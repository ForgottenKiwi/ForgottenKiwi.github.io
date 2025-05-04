//For website

const canvasContainer = document.querySelector('.canvas-wrapper');
const canvasElement = document.getElementById('canvas');
const container = document.getElementById('canvas');
//console.log(container.clientWidth, container.clientHeight)

let fullscreen = false;

var elem = document.getElementById("canvas");
function openFullscreen() {
  fullscreen = true
  renderer.setSize(window.screen.width, window.screen.height);
  camera.aspect = window.screen.width / window.screen.height;
  camera.updateProjectionMatrix();
  if (elem.requestFullscreen) {
    elem.requestFullscreen();
  } else if (elem.webkitRequestFullscreen) { /* Safari */
    elem.webkitRequestFullscreen();
  } else if (elem.msRequestFullscreen) { /* IE11 */
    elem.msRequestFullscreen();
  }
}



// Create scene
const scene = new THREE.Scene();

// Create camera
const camera = new THREE.PerspectiveCamera(
  75,
  canvasContainer.offsetWidth / canvasContainer.offsetHeight,
  0.1,
  100000
);
camera.position.set(0, 2, 0);

// Create renderer and enable shadows
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(canvasContainer.offsetWidth, canvasContainer.offsetHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Optional: smoother shadows
container.appendChild(renderer.domElement);

// Create a cube (for testing)
const cubeGeometry = new THREE.BoxGeometry();
const cubeMaterial = new THREE.MeshNormalMaterial();
const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
scene.add(cube);
cube.position.y = 1;
cube.castShadow = true;
cube.receiveShadow = true;

// Movement and physics settings
let rotationSpeed = 6;
let movementSpeed = Math.PI * rotationSpeed * 2;
const keys = {}; // Track pressed keys
let yVelo = 0;
const fallSpeed = 90;
let jumpStrength = 31;
let cameraHeight = 2;
const groundEpsilon = 0.1; // Tolerance for ground check

// Global horizontal velocity (x and z)
let camVel = new THREE.Vector3(0, 0, 0);

// Acceleration settings
const accel = 300;
const decel = 400;
let maxSpeed = movementSpeed;

// Key press event listeners
document.addEventListener("keydown", (event) => (keys[event.code] = true));
document.addEventListener("keyup", (event) => (keys[event.code] = false));

// Update camera movement and jump/gravity logic
function updateCameraMovement(delta) {
  let direction = new THREE.Vector3(0, 0, 0);
  if (keys["KeyW"]) direction.z -= 1;
  if (keys["KeyS"]) direction.z += 1;
  if (keys["KeyA"]) direction.x -= 1;
  if (keys["KeyD"]) direction.x += 1;
  direction.normalize();

  let localAcc = direction.multiplyScalar(accel * delta);
  let worldAcc = localAcc.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), camera.rotation.y);

  if (direction.length() > 0) {
    camVel.add(worldAcc);
    if (camVel.length() > maxSpeed) {
      camVel.setLength(maxSpeed);
    }
  } else {
    let speed = camVel.length();
    if (speed > 0) {
      let braking = decel * delta;
      speed = Math.max(speed - braking, 0);
      camVel.setLength(speed);
    }
  }

  camera.position.x += camVel.x * delta;
  camera.position.z += camVel.z * delta;

  if (keys["ArrowLeft"]) camera.rotation.y += rotationSpeed * delta;
  if (keys["ArrowRight"]) camera.rotation.y -= rotationSpeed * delta;

  const currentTerrainHeight = getTerrainHeight(camera.position.x, camera.position.z, geometryE);
  if (keys["Space"] && Math.abs(camera.position.y - (getTerrainHeight(camera.position.x, camera.position.z, geometryE) + cameraHeight)) < groundEpsilon) {
    yVelo = jumpStrength; // Apply upward impulse
  }

  if (keys["ShiftLeft"]) {
    rotationSpeed = 2.5;
    jumpStrength = 20;
    cameraHeight = 1.5;
    maxSpeed = 10;
  } else {
    rotationSpeed = 6;
    jumpStrength = 31;
    maxSpeed = Math.PI * rotationSpeed * 2;
    cameraHeight += 10 * delta;
    if (cameraHeight > 2) {
      cameraHeight = 2;
    }
  }
}

// --- Terrain and Collision Setup ---

const width = 10000;
const length = 10000;
const segments = 1000;
const geometryE = new THREE.PlaneGeometry(width, length, segments, segments);
const materialE = new THREE.MeshStandardMaterial({ vertexColors: true, wireframe: false });
const plane = new THREE.Mesh(geometryE, materialE);
plane.rotation.x = -Math.PI / 2;
plane.receiveShadow = true;
scene.add(plane);

// Modify terrain vertices using Perlin noise
const vertices = geometryE.attributes.position.array;
const colors = new Float32Array(vertices.length);

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

// Plateau function using sigmoid-based clamping
function plateauify(value, k = 0.02, range = 10) {
  let normalized = value / range;
  let plateaued = normalized / (1 + k * Math.pow(normalized, 2));
  return plateaued * range;
}

// Update vertices using Perlin noise layers
for (let i = 0; i < vertices.length; i += 3) {
  const x = vertices[i];
  const y = vertices[i + 1];
  const noiseValueP = perlin(x * 0.001, y * 0.001) * 500;
  const noiseValueD = perlin(x * 0.01, y * 0.01) * 10;
  const noiseValueM = perlin(x * 0.0005, y * 0.0005) * 1000 + 200;
  const noiseValueSD = perlin(x * 0.01, y * 0.01) * 1;
  vertices[i + 2] = plateauify(noiseValueP) + noiseValueD + noiseValueM + noiseValueSD;
  colors[i + 1] = (vertices[i + 2] / 150 + Math.random()/2);
  colors[i + 2] = -vertices[i + 2] / 75 + 0.6
}
geometryE.setAttribute('color', new THREE.BufferAttribute(colors, 3));
geometryE.attributes.position.needsUpdate = true;
geometryE.computeVertexNormals();

// --- Bilinear Interpolation Function for Terrain Height ---
function getTerrainHeight(x, z, geometry) {
  const pos = geometry.attributes.position.array;
  const { width, height, widthSegments, heightSegments } = geometry.parameters;
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  let u = (x + halfWidth) / width;
  let v = (z + halfHeight) / height;
  const gridX = u * widthSegments;
  const gridY = v * heightSegments;
  const x0 = Math.floor(gridX);
  const x1 = Math.min(x0 + 1, widthSegments);
  const y0 = Math.floor(gridY);
  const y1 = Math.min(y0 + 1, heightSegments);
  const fx = gridX - x0;
  const fy = gridY - y0;
  function getZ(ix, iy) {
    const index = (iy * (widthSegments + 1) + ix) * 3 + 2;
    return pos[index];
  }
  const z00 = getZ(x0, y0);
  const z10 = getZ(x1, y0);
  const z01 = getZ(x0, y1);
  const z11 = getZ(x1, y1);
  const z0 = lerp(z00, z10, fx);
  const z1 = lerp(z01, z11, fx);
  return lerp(z0, z1, fy);
}

// fake water
const geometryW = new THREE.PlaneGeometry(width, length);
const materialW = new THREE.MeshStandardMaterial({color: 0x0400ff});
const planeW = new THREE.Mesh(geometryW, materialW);
planeW.rotation.x = -Math.PI / 2;
planeW.receiveShadow = true;
scene.add(planeW);



// --- Lighting Setup ---
// Ambient light for overall brightness
const ambientLight = new THREE.AmbientLight(0x72b3b5, 0.2);
scene.add(ambientLight);

// Directional light to simulate sunlight with shadows
const directionalLight = new THREE.DirectionalLight(0xffee00, 1);
directionalLight.position.set(5000, 2000, 5000);
directionalLight.target.position.set(0, 0, 0);
scene.add(directionalLight.target);

directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 4096;
directionalLight.shadow.mapSize.height = 4096;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 10000;
directionalLight.shadow.camera.left = -6000;
directionalLight.shadow.camera.right = 6000;
directionalLight.shadow.camera.top = 6000;
directionalLight.shadow.camera.bottom = -6000;
directionalLight.shadow.bias = -0.0001;

scene.add(directionalLight);

// Optional: visualize the shadow camera frustum
// const shadowHelper = new THREE.CameraHelper(directionalLight.shadow.camera);
// scene.add(shadowHelper);

scene.background = new THREE.Color( 0x8cd9ff )

//fog
scene.fog = new THREE.FogExp2(0xbae6ff, 0.00035);


// --- Animation Loop ---
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();

  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;
  updateCameraMovement(delta);

  // Update vertical position using yVelo (pure vertical jump)
  camera.position.y += yVelo * delta;

  // Always apply gravity
  yVelo -= fallSpeed * delta;

  // When falling (yVelo negative), check for collision with terrain
  if (yVelo < 0) {
    const terrainHeight = getTerrainHeight(camera.position.x, camera.position.z, geometryE);
    if (camera.position.y < terrainHeight + cameraHeight) {
      camera.position.y = terrainHeight + cameraHeight;
      yVelo = 0;
    }
  }

  renderer.render(scene, camera);
}
animate();

// // Resize handling
// window.addEventListener("resize", () => {
//   renderer.setSize(window.innerWidth, window.innerHeight);
//   camera.aspect = window.innerWidth / window.innerHeight;
//   camera.updateProjectionMatrix();
// });


if(fullscreen == false){
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
}

function scrollLockCheck(){
  const scrollCheck = document.getElementById('scrollCheck')
  if(scrollCheck.checked){
    document.getElementById('main').style.position="fixed"
  } else {
    document.getElementById('main').style.position="relative"
  }
}

function wireframeCheck(){
  const wireCheck = document.getElementById('wireCheck')
  if(wireCheck.checked){
    materialE.wireframe = true;
  } else {
    materialE.wireframe = false;
  }
}

