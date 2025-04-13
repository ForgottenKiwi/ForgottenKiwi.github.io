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
camera.position.z = 60;
camera.position.y = 15;

// Create renderer
const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize(canvasContainer.offsetWidth, canvasContainer.offsetHeight);
container.appendChild(renderer.domElement);


// Create a cube
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshNormalMaterial();
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);
cube.position.y += 1;

let rotationSpeed = 6;
let movementSpeed = Math.PI * rotationSpeed * 2;
const keys = {}; // Track pressed keys
let yVelo = 0;
let fallSpeed = 90;
let jumpStrength = 31;
let cameraHeight = 15;

//fog
scene.fog = new THREE.FogExp2(0x000000, 0.002);

// Global horizontal velocity (x and z)
let camVel = new THREE.Vector3(0, 0, 0);

// Settings for acceleration/deceleration (units per second^2)
const accel = 300; // How fast you speed up when a key is pressed
const decel = 400; // How fast you slow down when no key is pressed
let maxSpeed = movementSpeed; // Maximum horizontal speed

// Key press event listeners
document.addEventListener("keydown", (event) => (keys[event.code] = true));
document.addEventListener("keyup", (event) => (keys[event.code] = false));

function updateCameraMovement(delta) {
  // Determine the desired movement direction from keys (in local space)
  let direction = new THREE.Vector3(0, 0, 0);
  if (keys["KeyW"]) direction.z -= 1;
  if (keys["KeyS"]) direction.z += 1;
  if (keys["KeyA"]) direction.x -= 1;
  if (keys["KeyD"]) direction.x += 1;
  direction.normalize(); // so diagonal movement isn’t faster

  // Calculate acceleration vector in local camera space
  let localAcc = direction.multiplyScalar(accel * delta);

  // Convert the local acceleration to world space.
  // (Since your camera rotates only around Y, you can rotate the vector by camera.rotation.y)
  let worldAcc = localAcc
    .clone()
    .applyAxisAngle(new THREE.Vector3(0, 1, 0), camera.rotation.y);

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
  if (keys["ArrowLeft"]) camera.rotation.y += rotationSpeed * delta;
  if (keys["ArrowRight"]) camera.rotation.y -= rotationSpeed * delta;

  // Jump is handled separately (see below)
  if (keys["Space"] && Math.abs(camera.position.y - cameraHeight) < 0.1) {
    yVelo = jumpStrength;
  }

  //Shift
  // if (keys["ShiftLeft"]) {
  //   rotationSpeed = 2.5;
  //   jumpStrength = 20;
  //   cameraHeight = 1.5;
  //   maxSpeed = 10;
  // } else {
  //   rotationSpeed = 6;
  //   jumpStrength = 31;
  //   maxSpeed = Math.PI * rotationSpeed * 2;
  //   cameraHeight += 10 * delta;
  //   if (cameraHeight > 15) {
  //     cameraHeight = 15;
  //   }
  // }

  // //fly
  // if (keys["KeyR"]) camera.position.y += 1;
  // if (keys["KeyF"]) camera.position.y -= 1;
}

// checkerboard tiles
const darkColor = new THREE.Color("grey");
const lightColor = new THREE.Color("lightgrey");
const tileSize = 3;
const groundGeo = new THREE.PlaneGeometry(tileSize, tileSize);
const groundMat = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
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

function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
function lerp(a, b, t) { return a + t * (b - a); }

function grad(hash, x, y) {
  const h = hash & 3;
  const u = h & 1 ? x : -x;
  const v = h & 2 ? y : -y;
  return u + v;
}

const perm = new Array(512);
const p = [...Array(256).keys()].sort(() => Math.random() - 0.5);
for (let i = 0; i < 512; i++) perm[i] = p[i & 255];

function perlin(x, y) {
  const X = Math.floor(x) & 255;
  const Y = Math.floor(y) & 255;
  const xf = x - Math.floor(x);
  const yf = y - Math.floor(y);
  const u = fade(xf);
  const v = fade(yf);
  const aa = perm[X] + Y;
  const ab = perm[X] + Y + 1;
  const ba = perm[X + 1] + Y;
  const bb = perm[X + 1] + Y + 1;
  const gradAA = grad(perm[aa], xf, yf);
  const gradBA = grad(perm[ba], xf - 1, yf);
  const gradAB = grad(perm[ab], xf, yf - 1);
  const gradBB = grad(perm[bb], xf - 1, yf - 1);
  const x1 = lerp(gradAA, gradBA, u);
  const x2 = lerp(gradAB, gradBB, u);
  return lerp(x1, x2, v);
}

let aSize = 100;
let hSize = 100;


for (let i = 0; i < aSize; i++) {
  for (let j = 0; j < hSize; j++){
    let ground = new THREE.Mesh(groundGeo, groundMat.clone());
    scene.add( ground );
    ground.rotation.x = Math.PI/2;
    ground.position.x = i * tileSize
    ground.position.z = j * tileSize
    ground.position.y = perlin(ground.position.x * 0.01, ground.position.z * 0.01) * 10;
    ground.material.color = new THREE.Color().setRGB(0,0,(ground.position.y/20+0.5));
  }
}

// let aSize = 100;
// let hSize = 100;
// let g = 0;
// let h = 0;
// let totalX = [];
// let totalY = [];
// let totalOfTotals = [];

// for (let i = 0; i < aSize; i++) {
//   if (i > 0) {
//     g = (totalX[0] + totalY[0]) / 2 + Math.round(Math.random() * 2 - 1);
//     h = g;
//     console.log(totalX[0], totalY[0], g);
//   }

//   totalX = [];

//   for (let j = 0; j < hSize; j++) {
//     totalX.push(g);
//     g += Math.round(Math.random() * 4) - 2;
//     if(j>0){
//       let ground = new THREE.Mesh(groundGeo, groundMat.clone());
//       scene.add( ground );
//       ground.rotation.x = Math.PI/2;
//       ground.position.x = (aSize-j) * tileSize
//       ground.position.z = i * tileSize
//       ground.position.y = g/10
//       let b = g
//       ground.material.color = new THREE.Color().setRGB(0,0,b/20+0.5);
//     }
//   }
//   console.log(totalX);

//   totalY = [];

//   for (let k = 0; k < hSize; k++) {
//     totalY.push(h);
//     h += Math.round(Math.random() * 4) - 2;
//     if(k>0){
//       let ground = new THREE.Mesh(groundGeo, groundMat.clone());
//       scene.add( ground );
//       ground.rotation.x = Math.PI/2;
//       ground.position.x = i * tileSize
//       ground.position.z = (aSize-k) * tileSize
//       ground.position.y = h/10
//       let b = h
//       ground.material.color = new THREE.Color().setRGB(0,0,b/20+0.5);
//     }
//   }
//   console.log(totalY);

//   hSize -= 1;
//   totalOfTotals.push(totalX);
//   totalOfTotals.push(totalY);

//   let ground = new THREE.Mesh(groundGeo, groundMat.clone());
//   scene.add( ground );
//   ground.rotation.x = Math.PI/2;
//   ground.position.x = i * tileSize
//   ground.position.z = i * tileSize
//   ground.position.y = g/10
//   let b = g
//   ground.material.color = new THREE.Color().setRGB(0,0,b/20+0.5);
// }
//console.log(totalOfTotals);

// for (let i = 0; i < aSize * aSize; i++) {
  
  
// }

backgroundColor = new THREE.Color(0x06002f);
scene.background = backgroundColor;

const light = new THREE.HemisphereLight(0xffffbb, 0x080820, 1);
scene.add(light);


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




// original


// // Create scene
// const scene = new THREE.Scene();

// // Create camera
// const camera = new THREE.PerspectiveCamera(
//   75,
//   window.innerWidth / window.innerHeight,
//   0.1,
//   1000
// );
// camera.position.z = 60;
// camera.position.y = 15;

// // Create renderer
// const renderer = new THREE.WebGLRenderer({antialias: true});
// renderer.setSize(window.innerWidth, window.innerHeight);
// document.body.appendChild(renderer.domElement);

// // Create a cube
// const geometry = new THREE.BoxGeometry();
// const material = new THREE.MeshNormalMaterial();
// const cube = new THREE.Mesh(geometry, material);
// scene.add(cube);
// cube.position.y += 1;

// let rotationSpeed = 6;
// let movementSpeed = Math.PI * rotationSpeed * 2;
// const keys = {}; // Track pressed keys
// let yVelo = 0;
// let fallSpeed = 90;
// let jumpStrength = 31;
// let cameraHeight = 15;

// //fog
// scene.fog = new THREE.FogExp2(0x000000, 0.002);

// // Global horizontal velocity (x and z)
// let camVel = new THREE.Vector3(0, 0, 0);

// // Settings for acceleration/deceleration (units per second^2)
// const accel = 300; // How fast you speed up when a key is pressed
// const decel = 400; // How fast you slow down when no key is pressed
// let maxSpeed = movementSpeed; // Maximum horizontal speed

// // Key press event listeners
// document.addEventListener("keydown", (event) => (keys[event.code] = true));
// document.addEventListener("keyup", (event) => (keys[event.code] = false));

// function updateCameraMovement(delta) {
//   // Determine the desired movement direction from keys (in local space)
//   let direction = new THREE.Vector3(0, 0, 0);
//   if (keys["KeyW"]) direction.z -= 1;
//   if (keys["KeyS"]) direction.z += 1;
//   if (keys["KeyA"]) direction.x -= 1;
//   if (keys["KeyD"]) direction.x += 1;
//   direction.normalize(); // so diagonal movement isn’t faster

//   // Calculate acceleration vector in local camera space
//   let localAcc = direction.multiplyScalar(accel * delta);

//   // Convert the local acceleration to world space.
//   // (Since your camera rotates only around Y, you can rotate the vector by camera.rotation.y)
//   let worldAcc = localAcc
//     .clone()
//     .applyAxisAngle(new THREE.Vector3(0, 1, 0), camera.rotation.y);

//   // If any key is pressed, accelerate; otherwise decelerate.
//   if (direction.length() > 0) {
//     camVel.add(worldAcc);
//     // Clamp speed to maximum
//     if (camVel.length() > maxSpeed) {
//       camVel.setLength(maxSpeed);
//     }
//   } else {
//     // No keys pressed: apply deceleration (braking)
//     let speed = camVel.length();
//     if (speed > 0) {
//       // Reduce the speed
//       let braking = decel * delta;
//       speed = Math.max(speed - braking, 0);
//       camVel.setLength(speed);
//     }
//   }

//   // Update the camera position by adding the velocity.
//   camera.position.x += camVel.x * delta;
//   camera.position.z += camVel.z * delta;

//   // Handle rotation independently
//   if (keys["ArrowLeft"]) camera.rotation.y += rotationSpeed * delta;
//   if (keys["ArrowRight"]) camera.rotation.y -= rotationSpeed * delta;

//   // Jump is handled separately (see below)
//   if (keys["Space"] && Math.abs(camera.position.y - cameraHeight) < 0.1) {
//     yVelo = jumpStrength;
//   }

//   //Shift
//   // if (keys["ShiftLeft"]) {
//   //   rotationSpeed = 2.5;
//   //   jumpStrength = 20;
//   //   cameraHeight = 1.5;
//   //   maxSpeed = 10;
//   // } else {
//   //   rotationSpeed = 6;
//   //   jumpStrength = 31;
//   //   maxSpeed = Math.PI * rotationSpeed * 2;
//   //   cameraHeight += 10 * delta;
//   //   if (cameraHeight > 15) {
//   //     cameraHeight = 15;
//   //   }
//   // }

//   // //fly
//   // if (keys["KeyR"]) camera.position.y += 1;
//   // if (keys["KeyF"]) camera.position.y -= 1;
// }

// // checkerboard tiles
// const darkColor = new THREE.Color("grey");
// const lightColor = new THREE.Color("lightgrey");
// const tileSize = 3;
// const groundGeo = new THREE.PlaneGeometry(tileSize, tileSize);
// const groundMat = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
// // const size = 50;
// // for(i=0; i<size; i++){
// //     for(k=0; k<size; k++){
// //         let ground = new THREE.Mesh(groundGeo, groundMat.clone());
// //         scene.add( ground );
// //         ground.rotation.x = Math.PI/2;
// //         ground.position.z = (-size/2 + k)*tileSize;
// //         ground.position.x = (-size/2 + i)*tileSize;
// //         if(((i+k) % 2) == 0){
// //             ground.material.color = lightColor;
// //         }else{
// //             ground.material.color = darkColor;
// //         }
// //     }
// // }

// function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
// function lerp(a, b, t) { return a + t * (b - a); }

// function grad(hash, x, y) {
//   const h = hash & 3;
//   const u = h & 1 ? x : -x;
//   const v = h & 2 ? y : -y;
//   return u + v;
// }

// const perm = new Array(512);
// const p = [...Array(256).keys()].sort(() => Math.random() - 0.5);
// for (let i = 0; i < 512; i++) perm[i] = p[i & 255];

// function perlin(x, y) {
//   const X = Math.floor(x) & 255;
//   const Y = Math.floor(y) & 255;
//   const xf = x - Math.floor(x);
//   const yf = y - Math.floor(y);
//   const u = fade(xf);
//   const v = fade(yf);
//   const aa = perm[X] + Y;
//   const ab = perm[X] + Y + 1;
//   const ba = perm[X + 1] + Y;
//   const bb = perm[X + 1] + Y + 1;
//   const gradAA = grad(perm[aa], xf, yf);
//   const gradBA = grad(perm[ba], xf - 1, yf);
//   const gradAB = grad(perm[ab], xf, yf - 1);
//   const gradBB = grad(perm[bb], xf - 1, yf - 1);
//   const x1 = lerp(gradAA, gradBA, u);
//   const x2 = lerp(gradAB, gradBB, u);
//   return lerp(x1, x2, v);
// }

// let aSize = 100;
// let hSize = 100;


// for (let i = 0; i < aSize; i++) {
//   for (let j = 0; j < hSize; j++){
//     let ground = new THREE.Mesh(groundGeo, groundMat.clone());
//     scene.add( ground );
//     ground.rotation.x = Math.PI/2;
//     ground.position.x = i * tileSize
//     ground.position.z = j * tileSize
//     ground.position.y = perlin(ground.position.x * 0.01, ground.position.z * 0.01) * 10;
//     ground.material.color = new THREE.Color().setRGB(0,0,(ground.position.y/20+0.5));
//   }
// }

// // let aSize = 100;
// // let hSize = 100;
// // let g = 0;
// // let h = 0;
// // let totalX = [];
// // let totalY = [];
// // let totalOfTotals = [];

// // for (let i = 0; i < aSize; i++) {
// //   if (i > 0) {
// //     g = (totalX[0] + totalY[0]) / 2 + Math.round(Math.random() * 2 - 1);
// //     h = g;
// //     console.log(totalX[0], totalY[0], g);
// //   }

// //   totalX = [];

// //   for (let j = 0; j < hSize; j++) {
// //     totalX.push(g);
// //     g += Math.round(Math.random() * 4) - 2;
// //     if(j>0){
// //       let ground = new THREE.Mesh(groundGeo, groundMat.clone());
// //       scene.add( ground );
// //       ground.rotation.x = Math.PI/2;
// //       ground.position.x = (aSize-j) * tileSize
// //       ground.position.z = i * tileSize
// //       ground.position.y = g/10
// //       let b = g
// //       ground.material.color = new THREE.Color().setRGB(0,0,b/20+0.5);
// //     }
// //   }
// //   console.log(totalX);

// //   totalY = [];

// //   for (let k = 0; k < hSize; k++) {
// //     totalY.push(h);
// //     h += Math.round(Math.random() * 4) - 2;
// //     if(k>0){
// //       let ground = new THREE.Mesh(groundGeo, groundMat.clone());
// //       scene.add( ground );
// //       ground.rotation.x = Math.PI/2;
// //       ground.position.x = i * tileSize
// //       ground.position.z = (aSize-k) * tileSize
// //       ground.position.y = h/10
// //       let b = h
// //       ground.material.color = new THREE.Color().setRGB(0,0,b/20+0.5);
// //     }
// //   }
// //   console.log(totalY);

// //   hSize -= 1;
// //   totalOfTotals.push(totalX);
// //   totalOfTotals.push(totalY);

// //   let ground = new THREE.Mesh(groundGeo, groundMat.clone());
// //   scene.add( ground );
// //   ground.rotation.x = Math.PI/2;
// //   ground.position.x = i * tileSize
// //   ground.position.z = i * tileSize
// //   ground.position.y = g/10
// //   let b = g
// //   ground.material.color = new THREE.Color().setRGB(0,0,b/20+0.5);
// // }
// //console.log(totalOfTotals);

// // for (let i = 0; i < aSize * aSize; i++) {
  
  
// // }

// backgroundColor = new THREE.Color(0x06002f);
// scene.background = backgroundColor;

// const light = new THREE.HemisphereLight(0xffffbb, 0x080820, 1);
// scene.add(light);

// const clock = new THREE.Clock();

// // Animation loop
// function animate() {
//   requestAnimationFrame(animate);
//   let delta = clock.getDelta();

//   cube.rotation.x += 0.01;
//   cube.rotation.y += 0.01;
//   updateCameraMovement(delta);

//   camera.position.y += yVelo * delta;
//   if (camera.position.y > cameraHeight) {
//     yVelo -= fallSpeed * delta;
//   } else {
//     camera.position.y = cameraHeight;
//     yVelo = 0;
//   }
//   renderer.render(scene, camera);
// }
// animate();

// // Resize handling
// // window.addEventListener("resize", () => {
// //   renderer.setSize(window.innerWidth, window.innerHeight);
// //   camera.aspect = window.innerWidth / window.innerHeight;
// //   camera.updateProjectionMatrix();
// // });


// // Resize handling
// window.addEventListener('resize', () => {
//   const width = canvasContainer.clientWidth;
//   const height = canvasContainer.clientHeight;
//   console.log("Window resize:", width, height);
//   renderer.setSize(width, height);
//   camera.aspect = width / height;
//   camera.updateProjectionMatrix();
// });


// if ('ResizeObserver' in window) {
//   const resizeObserver = new ResizeObserver((entries) => {
//     for (let entry of entries) {
//       const { width, height } = entry.contentRect;
//       console.log("Resized:", width, height);
//       renderer.setSize(width, height);
//       camera.aspect = width / height;
//       camera.updateProjectionMatrix();
//     }
//   });
//   resizeObserver.observe(canvasContainer);
// }

// function scrollLockCheck(){
//   const scrollCheck = document.getElementById('scrollCheck')
//   if(scrollCheck.checked){
//     document.getElementById('main').style.position="fixed"
//   } else {
//     document.getElementById('main').style.position="relative"
//   }
// }