// --- Canvas Setup ---
const canvasContainer = document.querySelector('.canvas-wrapper');
const canvasElement = document.getElementById('canvas');
const container = document.getElementById('canvas');

let fullscreen = false;
var elem = document.getElementById("canvas");
function openFullscreen() {
  fullscreen = true;
  renderer.setSize(window.screen.width, window.screen.height);
  camera.aspect = window.screen.width / window.screen.height;
  camera.updateProjectionMatrix();
  if (elem.requestFullscreen) {
    elem.requestFullscreen();
  } else if (elem.webkitRequestFullscreen) {
    elem.webkitRequestFullscreen();
  } else if (elem.msRequestFullscreen) {
    elem.msRequestFullscreen();
  }
}

// --- Scene Setup ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  canvasContainer.offsetWidth / canvasContainer.offsetHeight,
  0.1,
  100000
);
camera.position.set(0, 2, 0);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(canvasContainer.offsetWidth, canvasContainer.offsetHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);

// --- Cube (for testing) ---
const cubeGeometry = new THREE.BoxGeometry();
const cubeMaterial = new THREE.MeshNormalMaterial();
const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
cube.position.y = 1;
cube.castShadow = true;
cube.receiveShadow = true;
scene.add(cube);

// --- Movement ---
let rotationSpeed = 6;
let movementSpeed = Math.PI * rotationSpeed * 2;
const keys = {};
let yVelo = 0;
const fallSpeed = 90;
let jumpStrength = 31;
let cameraHeight = 2;
const groundEpsilon = 0.1;
let camVel = new THREE.Vector3(0, 0, 0);
const accel = 300;
const decel = 400;
let maxSpeed = movementSpeed;
let dashCooldown = 0;

// --- Input Events ---
document.addEventListener("keydown", (event) => {
  keys[event.code] = true;
  if (event.code === "ArrowUp") shootBullet();
  if (event.code === "ArrowDown" && dashCooldown <= 0) {
    const dashDir = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), camera.rotation.y);
    camVel.add(dashDir.multiplyScalar(100));
    dashCooldown = 1;
  }
});
document.addEventListener("keyup", (event) => keys[event.code] = false);

function updateCameraMovement(delta) {
  let direction = new THREE.Vector3();
  if (keys["KeyW"]) direction.z -= 1;
  if (keys["KeyS"]) direction.z += 1;
  if (keys["KeyA"]) direction.x -= 1;
  if (keys["KeyD"]) direction.x += 1;
  direction.normalize();

  let localAcc = direction.multiplyScalar(accel * delta);
  let worldAcc = localAcc.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), camera.rotation.y);

  if (direction.length() > 0) {
    camVel.add(worldAcc);
    if (camVel.length() > maxSpeed) camVel.setLength(maxSpeed);
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
  if (keys["Space"] && Math.abs(camera.position.y - (currentTerrainHeight + cameraHeight)) < groundEpsilon) {
    yVelo = jumpStrength;
  }

  if (keys["ArrowDown"]) {
    const dashDir = new THREE.Vector3(0, 0, -1).applyEuler(camera.rotation).setY(0).normalize();
    camVel.add(dashDir.multiplyScalar(150)); // dash strength
    keys["ArrowDown"] = false; // Prevents continuous dashing while held
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
    if (cameraHeight > 2) cameraHeight = 2;
  }
}

function colorShift(i){
  if(i % 2) {
    return 0.3
  }
}

// --- Terrain ---
const width = 5000;
const length = 5000;
const segments = 2000;
const geometryE = new THREE.PlaneGeometry(width, length, segments, segments);
const materialE = new THREE.MeshStandardMaterial({ vertexColors: true });
const plane = new THREE.Mesh(geometryE, materialE);
plane.rotation.x = -Math.PI / 2;
plane.receiveShadow = true;
scene.add(plane);

// --- Terrain Noise ---
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
  const aa = perm[X] + Y, ab = perm[X] + Y + 1;
  const ba = perm[X + 1] + Y, bb = perm[X + 1] + Y + 1;
  return lerp(lerp(grad(perm[aa], xf, yf), grad(perm[ba], xf - 1, yf), u),
              lerp(grad(perm[ab], xf, yf - 1), grad(perm[bb], xf - 1, yf - 1), u), v);
}
function plateauify(value, k = 0.02, range = 10) {
  let normalized = value / range;
  return normalized / (1 + k * normalized ** 2) * range;
}
for (let i = 0; i < vertices.length; i += 3) {
  const x = vertices[i], y = vertices[i + 1];
  const noise = plateauify(perlin(x * 0.001, y * 0.001) * 10) +
                perlin(x * 0.01, y * 0.01) +
                perlin(x * 0.0005, y * 0.0005) +
                perlin(x * 0.01, y * 0.01) + 10; // so there is a little less water
  vertices[i + 2] = noise;
  colors[i + 1] = (noise / 5 + 0.5) + Math.random()/2;
  colors[i + 2] = -noise / 5 + 0.5 + Math.random()/2;
}
geometryE.setAttribute('color', new THREE.BufferAttribute(colors, 3));
geometryE.attributes.position.needsUpdate = true;
geometryE.computeVertexNormals();

// --- Terrain Height Function ---
function getTerrainHeight(x, z, geometry) {
  const pos = geometry.attributes.position.array;
  const { width, height, widthSegments, heightSegments } = geometry.parameters;
  const u = (x + width / 2) / width;
  const v = (z + height / 2) / height;
  const gridX = u * widthSegments;
  const gridY = v * heightSegments;
  const x0 = Math.floor(gridX), x1 = Math.min(x0 + 1, widthSegments);
  const y0 = Math.floor(gridY), y1 = Math.min(y0 + 1, heightSegments);
  const fx = gridX - x0, fy = gridY - y0;
  const getZ = (ix, iy) => pos[(iy * (widthSegments + 1) + ix) * 3 + 2];
  return lerp(lerp(getZ(x0, y0), getZ(x1, y0), fx), lerp(getZ(x0, y1), getZ(x1, y1), fx), fy);
}

// --- Water Plane ---
const geometryW = new THREE.PlaneGeometry(width, length);
const materialW = new THREE.MeshStandardMaterial({ color: 0x0400ff });
const planeW = new THREE.Mesh(geometryW, materialW);
planeW.rotation.x = -Math.PI / 2;
planeW.receiveShadow = true;
scene.add(planeW);

// --- Lighting ---
scene.add(new THREE.AmbientLight(0x72b3b5, 0.5));
const dirLight = new THREE.DirectionalLight(0xffee00, 1);
dirLight.position.set(5000, 2000, 5000);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 4096;
dirLight.shadow.mapSize.height = 4096;
dirLight.shadow.camera.left = -6000;
dirLight.shadow.camera.right = 6000;
dirLight.shadow.camera.top = 6000;
dirLight.shadow.camera.bottom = -6000;
dirLight.shadow.camera.far = 10000;
dirLight.shadow.bias = -0.0001;
scene.add(dirLight);
scene.add(dirLight.target);

scene.background = new THREE.Color(0x8cd9ff);
scene.fog = new THREE.FogExp2(0xbae6ff, 0.00035);

// --- Enemies and Bullets ---
const enemies = [], bullets = [];
const bulletSpeed = 300, enemySpeed = 25, numEnemies = 5;

function shootBullet() {
  const geo = new THREE.SphereGeometry(0.5, 8, 8);
  const mat = new THREE.MeshStandardMaterial({ color: 0xffff00 });
  const bullet = new THREE.Mesh(geo, mat);
  bullet.position.copy(camera.position);
  bullet.velocity = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), camera.rotation.y).multiplyScalar(bulletSpeed);
  scene.add(bullet);
  bullets.push(bullet);
}

function spawnEnemies() {
  enemies.length = 0;
  for (let i = 0; i < numEnemies; i++) {
    const enemy = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 4), new THREE.MeshStandardMaterial({ color: 0xff0000 }));
    enemy.castShadow = true;
    enemy.receiveShadow = true;
    scene.add(enemy);
    resetEnemyPosition(enemy);
    enemy.originalPosition = enemy.position.clone(); // Save original position
    enemies.push(enemy);
  }
}

function resetEnemyPosition(enemy) {
  enemy.position.x = (Math.random() - 0.5) * 1000;
  enemy.position.z = (Math.random() - 0.5) * 1000;
  enemy.position.y = getTerrainHeight(enemy.position.x, enemy.position.z, geometryE) + 1;
  if (!enemy.originalPosition) enemy.originalPosition = enemy.position.clone();
}

function resetGame() {
  camera.position.set(0, 2, 0);
  camVel.set(0, 0, 0);
  enemies.forEach(resetEnemyPosition);
}

function updateEnemies(delta) {
  for (const enemy of enemies) {
    const dir = new THREE.Vector3().subVectors(camera.position, enemy.position).setY(0).normalize();
    enemy.position.add(dir.multiplyScalar(enemySpeed * delta));
    enemy.position.y = getTerrainHeight(enemy.position.x, enemy.position.z, geometryE) + 1;
    if (enemy.position.distanceTo(camera.position) < 2.5) resetGame();
  }
}

function updateBullets(delta) {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.position.add(b.velocity.clone().multiplyScalar(delta));
    if (b.position.length() > 5000) {
      scene.remove(b);
      bullets.splice(i, 1);
      continue;
    }

    // Collision detection with enemies
    for (const enemy of enemies) {
      if (b.position.distanceTo(enemy.position) < 4) {
        enemy.position.copy(enemy.originalPosition); // Reset to spawn
        b.position.set(9999, 9999, 9999); // Move bullet out of range
        break;
      }
    }
  }
}

// --- Animation ---
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();

  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;
  updateCameraMovement(delta);
  camera.position.y += yVelo * delta;
  yVelo -= fallSpeed * delta;
  if (yVelo < 0) {
    const terrain = getTerrainHeight(camera.position.x, camera.position.z, geometryE);
    if (camera.position.y < terrain + cameraHeight) {
      camera.position.y = terrain + cameraHeight;
      yVelo = 0;
    }
  }

  updateEnemies(delta);
  updateBullets(delta);
  if (dashCooldown > 0) dashCooldown -= delta;

  renderer.render(scene, camera);
}
animate();
spawnEnemies();

// --- Resize ---
if (!fullscreen) {
  window.addEventListener("resize", () => {
    const width = canvasContainer.clientWidth;
    const height = canvasContainer.clientHeight;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  });

  if ('ResizeObserver' in window) {
    new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      }
    }).observe(canvasContainer);
  }
}

// --- UI Toggles ---
function scrollLockCheck() {
  document.getElementById('main').style.position =
    document.getElementById('scrollCheck').checked ? "fixed" : "relative";
}

function wireframeCheck() {
  materialE.wireframe = document.getElementById('wireCheck').checked;
}

