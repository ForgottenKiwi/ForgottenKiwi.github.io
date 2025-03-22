//For website
const canvasContainer = document.querySelector('.canvas-wrapper');
const canvasElement = document.getElementById('canvas');
const container = document.getElementById('canvas');

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

const movementSpeed = 15;
const rotationSpeed = 5;
const keys = {}; // Track pressed keys

// Key press event listeners
document.addEventListener('keydown', (event) => keys[event.code] = true);
document.addEventListener('keyup', (event) => keys[event.code] = false);

// Camera movement logic
function updateCameraMovement(delta) {
    // Move forward
    if (keys['KeyW']) camera.position.z -= (Math.cos(camera.rotation.y) * movementSpeed * delta), camera.position.x -= (Math.sin(camera.rotation.y) * movementSpeed * delta);
    // Move backward
    if (keys['KeyS']) camera.position.z += (Math.cos(camera.rotation.y) * movementSpeed * delta), camera.position.x += (Math.sin(camera.rotation.y) * movementSpeed * delta);
    // Move left
    if (keys['KeyA']) camera.position.x -= (Math.cos(camera.rotation.y) * movementSpeed * delta), camera.position.z += (Math.sin(camera.rotation.y) * movementSpeed * delta);
    // Move right
    if (keys['KeyD']) camera.position.x += (Math.cos(camera.rotation.y) * movementSpeed * delta), camera.position.z -= (Math.sin(camera.rotation.y) * movementSpeed * delta);
    // Rotate left
    if (keys['ArrowLeft']) camera.rotation.y += (rotationSpeed * delta);
    // Rotate right
    if (keys['ArrowRight']) camera.rotation.y -= (rotationSpeed * delta);
    // Rotate up
    // if (keys['ArrowUp']) camera.rotation.x += (rotationSpeed * delta);
    // // Rotate down
    // if (keys['ArrowDown']) camera.rotation.x -= (rotationSpeed * delta);
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
    renderer.render(scene, camera);
}
animate();

// Resize handling
window.addEventListener('resize', () => {
    renderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);
    camera.aspect = canvasContainer.clientWidth / canvasContainer.clientHeight;
    camera.updateProjectionMatrix();
});

function scrollLockCheck(){
    const scrollCheck = document.getElementById('scrollCheck')
    console.log(scrollCheck.checked)
    if(scrollCheck.checked){
      document.getElementById('main').style.position="fixed"
    } else {
      document.getElementById('main').style.position="relative"
    }
  }

// // Create scene
// const scene = new THREE.Scene();

// // Create camera
// const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
// camera.position.z = 5;
// camera.position.y = 2;

// // Create renderer
// const renderer = new THREE.WebGLRenderer();
// renderer.setSize(window.innerWidth, window.innerHeight);
// document.body.appendChild(renderer.domElement);

// // Create a cube
// const geometry = new THREE.BoxGeometry();
// const material = new THREE.MeshNormalMaterial();
// const cube = new THREE.Mesh(geometry, material);
// scene.add(cube);
// cube.position.y += 1

// const movementSpeed = 15;
// const rotationSpeed = 5;
// const keys = {}; // Track pressed keys

// // Key press event listeners
// document.addEventListener('keydown', (event) => keys[event.code] = true);
// document.addEventListener('keyup', (event) => keys[event.code] = false);

// // Camera movement logic
// function updateCameraMovement(delta) {
//     // Move forward
//     if (keys['KeyW']) camera.position.z -= (Math.cos(camera.rotation.y) * movementSpeed * delta), camera.position.x -= (Math.sin(camera.rotation.y) * movementSpeed * delta);
//     // Move backward
//     if (keys['KeyS']) camera.position.z += (Math.cos(camera.rotation.y) * movementSpeed * delta), camera.position.x += (Math.sin(camera.rotation.y) * movementSpeed * delta);
//     // Move left
//     if (keys['KeyA']) camera.position.x -= (Math.cos(camera.rotation.y) * movementSpeed * delta), camera.position.z += (Math.sin(camera.rotation.y) * movementSpeed * delta);
//     // Move right
//     if (keys['KeyD']) camera.position.x += (Math.cos(camera.rotation.y) * movementSpeed * delta), camera.position.z -= (Math.sin(camera.rotation.y) * movementSpeed * delta);
//     // Rotate left
//     if (keys['ArrowLeft']) camera.rotation.y += (rotationSpeed * delta);
//     // Rotate right
//     if (keys['ArrowRight']) camera.rotation.y -= (rotationSpeed * delta);
//     // Rotate up
//     // if (keys['ArrowUp']) camera.rotation.x += (rotationSpeed * delta);
//     // // Rotate down
//     // if (keys['ArrowDown']) camera.rotation.x -= (rotationSpeed * delta);
// }

// // checkerboard tiles
// const darkColor = new THREE.Color( 'grey' );
// const lightColor = new THREE.Color( 'lightgrey' );
// const tileSize = 3;
// const groundGeo = new THREE.PlaneGeometry( tileSize, tileSize );
// const groundMat = new THREE.MeshBasicMaterial( {side: THREE.DoubleSide} );
// const size = 50;
// for(i=0; i<size; i++){
//     for(k=0; k<size; k++){
//         let ground = new THREE.Mesh(groundGeo, groundMat.clone());
//         scene.add( ground );
//         ground.rotation.x = Math.PI/2;
//         ground.position.z = (-size/2 + k)*tileSize;
//         ground.position.x = (-size/2 + i)*tileSize;
//         if(((i+k) % 2) == 0){
//             ground.material.color = lightColor;
//         }else{
//             ground.material.color = darkColor;
//         }
//     }
// }

// backgroundColor = new THREE.Color(0x06002F);
// scene.background = backgroundColor;

// const light = new THREE.HemisphereLight( 0xffffbb, 0x080820, 1 );
// scene.add( light );


// const clock = new THREE.Clock();

// // Animation loop
// function animate() {
//     requestAnimationFrame(animate);
//     let delta = clock.getDelta(); 

//     cube.rotation.x += 0.01;
//     cube.rotation.y += 0.01;
//     updateCameraMovement(delta);
//     renderer.render(scene, camera);
// }
// animate();

// // Resize handling
// window.addEventListener('resize', () => {
//     renderer.setSize(window.innerWidth, window.innerHeight);
//     camera.aspect = window.innerWidth / window.innerHeight;
//     camera.updateProjectionMatrix();
// });