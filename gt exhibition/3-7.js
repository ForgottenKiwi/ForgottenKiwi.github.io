const canvasContainer = document.querySelector('.canvas-wrapper');
const canvasElement = document.getElementById('canvas');
const container = document.getElementById('canvas');
let fullscreen = false;

var elem = document.getElementById("canvas");
function openFullscreen() {
  fullscreen = true
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

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  canvasContainer.offsetWidth / canvasContainer.offsetHeight,
  0.1,
  100000
);
camera.position.set(0, 2, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(canvasContainer.offsetWidth, canvasContainer.offsetHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);

const cubeGeometry = new THREE.BoxGeometry();
const cubeMaterial = new THREE.MeshNormalMaterial();
const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
scene.add(cube);
cube.position.y = 1;
cube.castShadow = true;
cube.receiveShadow = true;

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

document.addEventListener("keydown", (event) => keys[event.code] = true);
document.addEventListener("keyup", (event) => keys[event.code] = false);

const bullets = [];
const enemies = [];
const numEnemies = 10;

function shootBullet() {
  const bullet = new THREE.Mesh(
    new THREE.SphereGeometry(0.2),
    new THREE.MeshStandardMaterial({ color: 0xffff00 })
  );
  bullet.castShadow = true;
  bullet.receiveShadow = true;
  bullet.position.copy(camera.position);
  const dir = new THREE.Vector3(0, 0, -1).applyEuler(camera.rotation).normalize();
  bullet.velocity = dir.multiplyScalar(100);
  scene.add(bullet);
  bullets.push(bullet);
}

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

  if (keys["Space"] && Math.abs(camera.position.y - (currentTerrainHeight + cameraHeight)) < groundEpsilon) {
    yVelo = jumpStrength;
  }

  if (keys["ArrowDown"]) {
    camVel.setLength(50); // Dash
  }

  if (keys["ArrowUp"]) {
    shootBullet(); // Shoot
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

// Terrain setup
const width = 10000;
const length = 10000;
const segments = 1000;
const geometryE = new THREE.PlaneGeometry(width, length, segments, segments);
const materialE = new THREE.MeshStandardMaterial({ vertexColors: true, wireframe: false });
const plane = new THREE.Mesh(geometryE, materialE);
plane.rotation.x = -Math.PI / 2;
plane.receiveShadow = true;
scene.add(plane);

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

function plateauify(value, k = 0.02, range = 10) {
  let normalized = value / range;
  let plateaued = normalized / (1 + k * Math.pow(normalized, 2));
  return plateaued * range;
}

for (let i = 0; i < vertices.length; i += 3) {
  const x = vertices[i];
  const y = vertices[i + 1];
  const noiseValueP = perlin(x * 0.001, y * 0.001) * 500;
  const noiseValueD = perlin(x * 0.01, y * 0.01) * 10;
  const noiseValueM = perlin(x * 0.0005, y * 0.0005) * 1000 + 200;
  const noiseValueSD = perlin(x * 0.01, y * 0.01) * 1;
  vertices[i + 2] = plateauify(noiseValueP) + noiseValueD + noiseValueM + noiseValueSD;
  colors[i + 1] = (vertices[i + 2] / 75 + 0.6) - 0.1;
  colors[i + 2] = -vertices[i + 2] / 75 + 0.6;
}
geometryE.setAttribute('color', new THREE.BufferAttribute(colors, 3));
geometryE.attributes.position.needsUpdate = true;
geometryE.computeVertexNormals();

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

// Enemies
const enemies = [];
const enemyStartPositions = [];

for (let i = 0; i < 5; i++) {
  const geometry = new THREE.BoxGeometry(2, 2, 2);
  const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
  const enemy = new THREE.Mesh(geometry, material);
  const x = (Math.random() - 0.5) * 400;
  const z = (Math.random() - 0.5) * 400;
  const y = getTerrainHeight(x, z, geometryE) + 1;
  enemy.position.set(x, y, z);
  scene.add(enemy);
  enemies.push(enemy);
  enemyStartPositions.push(enemy.position.clone());
}

// Bullets
const bullets = [];

function shootBullet() {
  const geometry = new THREE.SphereGeometry(0.5, 8, 8);
  const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
  const bullet = new THREE.Mesh(geometry, material);

  bullet.position.copy(camera.position);
  bullet.velocity = new THREE.Vector3(0, 0, -1).applyEuler(camera.rotation).multiplyScalar(100);
  bullets.push(bullet);
  scene.add(bullet);
}

// Reset enemy to original position
function resetEnemy(enemyIndex) {
  enemies[enemyIndex].position.copy(enemyStartPositions[enemyIndex]);
}

// Animate
function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();

  updateCameraMovement(delta);

  yVelo -= gravity * delta;
  camera.position.y += yVelo * delta;

  const terrainHeight = getTerrainHeight(camera.position.x, camera.position.z, geometryE) + cameraHeight;

  if (camera.position.y < terrainHeight) {
    camera.position.y = terrainHeight;
    yVelo = 0;
  }

  // Move bullets
  for (let i = bullets.length - 1; i >= 0; i--) {
    const bullet = bullets[i];
    bullet.position.add(bullet.velocity.clone().multiplyScalar(delta));

    // Remove far away bullets
    if (bullet.position.distanceTo(camera.position) > 1000) {
      scene.remove(bullet);
      bullets.splice(i, 1);
      continue;
    }

    // Collision with enemies
    for (let j = 0; j < enemies.length; j++) {
      const enemy = enemies[j];
      if (bullet.position.distanceTo(enemy.position) < 2) {
        scene.remove(bullet);
        bullets.splice(i, 1);
        resetEnemy(j); // Reset enemy on hit
        break;
      }
    }
  }

  renderer.render(scene, camera);
}
animate();

