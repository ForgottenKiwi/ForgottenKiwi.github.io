let checked = true;
let animationId;

var speed_limit = 1;
var accelerate = true;
var speed = 0;
var starsize = 3;
var stars = 1600;
var fov = 100;
var extraW = 5000;
var extraH = 2400;

var canv = document.getElementById('cv');
document.querySelector('body').onresize = resizeCanv;
const ctx = canv.getContext('2d');
const minZ = -fov + 2;

var extraW_half = extraW / 2;
var extraH_half = extraH / 2;
const TWOPI = Math.PI * 2;
var xMin, xMax, yMin, yMax;
var initScaleX, initScaleY;
var vel;
var points;

function init() {
  resizeCanv();
  points = randomPoints();
  vel = speed;
  if (!animationId) {
    animate();
  }
}

function resizeCanv() {
  canv.width = window.innerWidth;
  canv.height = window.innerHeight;
  xMax = canv.width / 2;
  xMin = -xMax;
  yMax = canv.height / 2;
  yMin = -yMax;
  initScaleX = canv.width + extraW;
  initScaleY = canv.height + extraH;
}

function randomPoints() {
  let arr = [];
  for (let i = 0; i < stars; i++){
    arr.push({
      x: Math.random() * initScaleX - (xMax + extraW_half),
      y: Math.random() * initScaleY - (yMax + extraH_half),
      z: Math.random() * 1000 + 140,
      prevz: this.z,
      size: starsize
    });
  }
  return arr;
}

function project(items, alterScale = true){
  alterScale = alterScale ? -0.4 : 0;
  let projected = [];
  items.forEach(item => {
    let scale = fov / (fov + item.z);
    let prevscale = fov / (fov + item.prevz);
    projected.push({
      x: item.x * scale,
      y: item.y * scale,
      z: item.z,
      prevx: item.x * prevscale,
      prevy: item.y * prevscale,
      size: item.size * scale + alterScale
    });
  });
  return projected;
}

function inView(item) {
  return (
    item.x + item.size > xMin &&
    item.x < xMax &&
    item.y + item.size > yMin &&
    item.y < yMax &&
    item.z < 500
  );
}

function drawLines(items) {
  items.forEach(item => {
    if (inView(item)){
      ctx.lineWidth = item.size;
      ctx.beginPath();
      ctx.moveTo(item.x, item.y);
      ctx.lineTo(item.prevx, item.prevy);
      ctx.stroke();
      ctx.closePath();
    }
  });
}

function animate() {
  if (!checked) return;
  animationId = window.requestAnimationFrame(animate);

  ctx.save();
  ctx.fillStyle = 'rgb(0,0,0)';
  ctx.fillRect(0, 0, canv.width, canv.height);
  ctx.translate(xMax, yMax);
  ctx.fillStyle = 'rgb(255,255,255)';
  points.forEach(item => {
    if (item.z > minZ) {
      item.prevz = item.z;
      item.z -= vel;
    }
    else {
      item.z = item.prevz = Math.random() * 600 + 600;
      item.x = Math.random() * initScaleX - (xMax + extraW_half);
      item.y = Math.random() * initScaleY - (yMax + extraH_half);
    }
  });

  ctx.strokeStyle = 'rgb(255,255,255)';
  drawLines(project(points));
  ctx.restore();

  if (accelerate && vel < speed_limit) {
    vel += 0.08;
  }
}

function hideStars(){
  // Toggle the flag
  checked = !checked;
  console.log("Stars visible:", checked);
   
  // Save the state in localStorage
  localStorage.setItem('starsVisible', checked);
   
  if (!checked) {
    window.cancelAnimationFrame(animationId);
    animationId = null;
    ctx.fillStyle = 'rgb(0,0,0)';
    ctx.fillRect(0, 0, canv.width, canv.height);
  } else {
    init();
  }
}

const checkbox = document.getElementById("starCheck");

// On page load, check localStorage and set the initial state
window.onload = function() {
  const storedState = localStorage.getItem('starsVisible');
  checked = storedState !== null ? (storedState === 'true') : true;
  checkbox.checked = checked; // Set the property directly
  console.log("load");
  
  if (checked) {
    init();
  } else {
    resizeCanv();
    ctx.fillStyle = 'rgb(0,0,0)';
    ctx.fillRect(0, 0, canv.width, canv.height);
  }
};














