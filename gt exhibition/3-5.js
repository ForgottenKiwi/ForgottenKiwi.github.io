//For website

const canvasContainer = document.querySelector('.canvas-wrapper');
const canvasElement = document.getElementById('canvas');
const container = document.getElementById('canvas');
console.log(container.clientWidth, container.clientHeight)

var elem = document.getElementById("canvas");
function openFullscreen() {
  if (elem.requestFullscreen) {
    elem.requestFullscreen();
  } else if (elem.webkitRequestFullscreen) { /* Safari */
    elem.webkitRequestFullscreen();
  } else if (elem.msRequestFullscreen) { /* IE11 */
    elem.msRequestFullscreen();
  }
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}


// Create scene
const scene = new THREE.Scene();

// Create camera
const camera = new THREE.PerspectiveCamera(75, canvasContainer.offsetWidth / canvasContainer.offsetHeight, 0.1, 1000);
camera.position.z = 5;
camera.position.y = 2;

// Create renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(canvasContainer.offsetWidth, canvasContainer.offsetHeight);
container.appendChild(renderer.domElement);

// Create a cube
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshNormalMaterial();
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);
cube.position.y += 1

let rotationSpeed = 6;
let movementSpeed = Math.PI * rotationSpeed * 2;
const keys = {}; // Track pressed keys
let yVelo = 0;
let fallSpeed = 90;
let jumpStrength = 31;
let cameraHeight = 2;

//fog
scene.fog = new THREE.FogExp2( 0x000000, 0.002 );

// Global horizontal velocity (x and z)
let camVel = new THREE.Vector3(0, 0, 0);

// Settings for acceleration/deceleration (units per second^2)
const accel = 300;       // How fast you speed up when a key is pressed
const decel = 400;       // How fast you slow down when no key is pressed
let maxSpeed = movementSpeed; // Maximum horizontal speed


// Key press event listeners
document.addEventListener('keydown', (event) => keys[event.code] = true);
document.addEventListener('keyup', (event) => keys[event.code] = false);


function updateCameraMovement(delta) {
    // Determine the desired movement direction from keys (in local space)
    let direction = new THREE.Vector3(0, 0, 0);
    if (keys['KeyW']) direction.z -= 1;
    if (keys['KeyS']) direction.z += 1;
    if (keys['KeyA']) direction.x -= 1;
    if (keys['KeyD']) direction.x += 1;
    direction.normalize(); // so diagonal movement isn’t faster
  
    // Calculate acceleration vector in local camera space
    let localAcc = direction.multiplyScalar(accel * delta);
  
    // Convert the local acceleration to world space.
    // (Since your camera rotates only around Y, you can rotate the vector by camera.rotation.y)
    let worldAcc = localAcc.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), camera.rotation.y);
  
    // If any key is pressed, accelerate; otherwise decelerate.
    if (direction.length() > 0) {
      camVel.add(worldAcc);
      // Clamp speed to maximum
      if (camVel.length() > maxSpeed) {
        camVel.setLength(maxSpeed);
      }
    } else {
      // No keys pressed: apply deceleration (braking)
      let speed = camVel.length();
      if (speed > 0) {
        // Reduce the speed
        let braking = decel * delta;
        speed = Math.max(speed - braking, 0);
        camVel.setLength(speed);
      }
    }
  
    // Update the camera position by adding the velocity.
    camera.position.x += camVel.x * delta;
    camera.position.z += camVel.z * delta;
  
    // Handle rotation independently
    if (keys['ArrowLeft']) camera.rotation.y += rotationSpeed * delta;
    if (keys['ArrowRight']) camera.rotation.y -= rotationSpeed * delta;
  
    // Jump is handled separately (see below)
    if (keys['Space'] && Math.abs(camera.position.y - cameraHeight) < 0.1) {
      yVelo = jumpStrength;
    }

    //Shift
    if (keys['ShiftLeft']){
        rotationSpeed = 2.5;
        jumpStrength = 20;
        cameraHeight = 1.5;
        maxSpeed = 10
    } else {
        rotationSpeed = 6;
        jumpStrength = 31;
        maxSpeed = Math.PI * rotationSpeed * 2
        cameraHeight += 10*delta;
        if (cameraHeight > 2){
            cameraHeight = 2
        }
    }
  }
  


  
// checkerboard tiles
const darkColor = new THREE.Color( 'grey' );
const lightColor = new THREE.Color( 'lightgrey' );
const tileSize = 3;
const groundGeo = new THREE.PlaneGeometry( tileSize, tileSize );
const groundMat = new THREE.MeshBasicMaterial( {side: THREE.DoubleSide} );
const size = 50;
for(i=0; i<size; i++){
    for(k=0; k<size; k++){
        let ground = new THREE.Mesh(groundGeo, groundMat.clone());
        scene.add( ground );
        ground.rotation.x = Math.PI/2;
        ground.position.z = (-size/2 + k)*tileSize;
        ground.position.x = (-size/2 + i)*tileSize;
        if(((i+k) % 2) == 0){
            ground.material.color = lightColor;
        }else{
            ground.material.color = darkColor;
        }
    }
}

backgroundColor = new THREE.Color(0x06002F);
scene.background = backgroundColor;

const light = new THREE.HemisphereLight( 0xffffbb, 0x080820, 1 );
scene.add( light );


const clock = new THREE.Clock();

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    let delta = clock.getDelta(); 

    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
    updateCameraMovement(delta);

    camera.position.y += yVelo * delta;
    if(camera.position.y > cameraHeight){
        yVelo -= (fallSpeed * delta);
    } else {
        camera.position.y = cameraHeight;
        yVelo = 0;
    }
    renderer.render(scene, camera);
}
animate();

// Resize handling
window.addEventListener('resize', () => {
  const width = canvasContainer.clientWidth;
  const height = canvasContainer.clientHeight;
  console.log("Window resize:", width, height);
  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
});


if ('ResizeObserver' in window) {
  const resizeObserver = new ResizeObserver((entries) => {
    for (let entry of entries) {
      const { width, height } = entry.contentRect;
      console.log("Resized:", width, height);
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }
  });
  resizeObserver.observe(canvasContainer);
}

function scrollLockCheck(){
  const scrollCheck = document.getElementById('scrollCheck')
  if(scrollCheck.checked){
    console.log(working);
  }
}

/*
// normal below
// Create scene
const scene = new THREE.Scene();

// Create camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;
camera.position.y = 2;

// Create renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Create a cube
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshNormalMaterial();
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);
cube.position.y += 1

let rotationSpeed = 6;
let movementSpeed = Math.PI * rotationSpeed * 2;
const keys = {}; // Track pressed keys
let yVelo = 0;
let fallSpeed = 90;
let jumpStrength = 31;
let cameraHeight = 2;

//fog
scene.fog = new THREE.FogExp2( 0x000000, 0.002 );

// Global horizontal velocity (x and z)
let camVel = new THREE.Vector3(0, 0, 0);

// Settings for acceleration/deceleration (units per second^2)
const accel = 300;       // How fast you speed up when a key is pressed
const decel = 400;       // How fast you slow down when no key is pressed
let maxSpeed = movementSpeed; // Maximum horizontal speed


// Key press event listeners
document.addEventListener('keydown', (event) => keys[event.code] = true);
document.addEventListener('keyup', (event) => keys[event.code] = false);


function updateCameraMovement(delta) {
    // Determine the desired movement direction from keys (in local space)
    let direction = new THREE.Vector3(0, 0, 0);
    if (keys['KeyW']) direction.z -= 1;
    if (keys['KeyS']) direction.z += 1;
    if (keys['KeyA']) direction.x -= 1;
    if (keys['KeyD']) direction.x += 1;
    direction.normalize(); // so diagonal movement isn’t faster
  
    // Calculate acceleration vector in local camera space
    let localAcc = direction.multiplyScalar(accel * delta);
  
    // Convert the local acceleration to world space.
    // (Since your camera rotates only around Y, you can rotate the vector by camera.rotation.y)
    let worldAcc = localAcc.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), camera.rotation.y);
  
    // If any key is pressed, accelerate; otherwise decelerate.
    if (direction.length() > 0) {
      camVel.add(worldAcc);
      // Clamp speed to maximum
      if (camVel.length() > maxSpeed) {
        camVel.setLength(maxSpeed);
      }
    } else {
      // No keys pressed: apply deceleration (braking)
      let speed = camVel.length();
      if (speed > 0) {
        // Reduce the speed
        let braking = decel * delta;
        speed = Math.max(speed - braking, 0);
        camVel.setLength(speed);
      }
    }
  
    // Update the camera position by adding the velocity.
    camera.position.x += camVel.x * delta;
    camera.position.z += camVel.z * delta;
  
    // Handle rotation independently
    if (keys['ArrowLeft']) camera.rotation.y += rotationSpeed * delta;
    if (keys['ArrowRight']) camera.rotation.y -= rotationSpeed * delta;
  
    // Jump is handled separately (see below)
    if (keys['Space'] && Math.abs(camera.position.y - cameraHeight) < 0.1) {
      yVelo = jumpStrength;
    }

    //Shift
    if (keys['ShiftLeft']){
        rotationSpeed = 2.5;
        jumpStrength = 20;
        cameraHeight = 1.5;
        maxSpeed = 10
    } else {
        rotationSpeed = 6;
        jumpStrength = 31;
        maxSpeed = Math.PI * rotationSpeed * 2
        cameraHeight += 10*delta;
        if (cameraHeight > 2){
            cameraHeight = 2
        }
    }
  }
  


  
// checkerboard tiles
const darkColor = new THREE.Color( 'grey' );
const lightColor = new THREE.Color( 'lightgrey' );
const tileSize = 3;
const groundGeo = new THREE.PlaneGeometry( tileSize, tileSize );
const groundMat = new THREE.MeshBasicMaterial( {side: THREE.DoubleSide} );
const size = 50;
for(i=0; i<size; i++){
    for(k=0; k<size; k++){
        let ground = new THREE.Mesh(groundGeo, groundMat.clone());
        scene.add( ground );
        ground.rotation.x = Math.PI/2;
        ground.position.z = (-size/2 + k)*tileSize;
        ground.position.x = (-size/2 + i)*tileSize;
        if(((i+k) % 2) == 0){
            ground.material.color = lightColor;
        }else{
            ground.material.color = darkColor;
        }
    }
}

backgroundColor = new THREE.Color(0x06002F);
scene.background = backgroundColor;

const light = new THREE.HemisphereLight( 0xffffbb, 0x080820, 1 );
scene.add( light );


const clock = new THREE.Clock();

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    let delta = clock.getDelta(); 

    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
    updateCameraMovement(delta);

    camera.position.y += yVelo * delta;
    if(camera.position.y > cameraHeight){
        yVelo -= (fallSpeed * delta);
    } else {
        camera.position.y = cameraHeight;
        yVelo = 0;
    }
    renderer.render(scene, camera);
}
animate();

// Resize handling
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

*/