const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const scoreEl = document.getElementById('score');

const car = {
  width: 40,
  height: 80,
  x: canvas.width / 2 - 20,
  y: canvas.height - 120,
  speed: 5
};

const keys = {};
function handleKey(e, isDown) {
  const key = e.key.toLowerCase();
  if (['arrowleft','arrowright','arrowup','arrowdown','a','d','w','s'].includes(key)) {
    e.preventDefault();
    keys[key] = isDown;
  }
}
document.addEventListener('keydown', e => handleKey(e, true));
document.addEventListener('keyup', e => handleKey(e, false));

function createObstacle() {
  const width = 40 + Math.random() * 40;
  const x = Math.random() * (canvas.width - width);
  return { x, y: -100, width, height: 20, speed: 4 };
}

let obstacles = [];
let lastSpawn = 0;
let lastTime = 0;
let running = false;
let distance = 0;
let gameSpeed = 1;
let sceneryOffset = 0;

// Audio
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let engineOscillator;

function startEngine() {
  engineOscillator = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  engineOscillator.type = 'sawtooth';
  engineOscillator.frequency.value = 60;
  gain.gain.value = 0.05;
  engineOscillator.connect(gain).connect(audioCtx.destination);
  engineOscillator.start();
}

function stopEngine() {
  if (engineOscillator) {
    engineOscillator.stop();
    engineOscillator.disconnect();
    engineOscillator = null;
  }
}

function playCrash() {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(200, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(20, audioCtx.currentTime + 0.5);
  gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.5);
}

function reset() {
  car.x = canvas.width / 2 - car.width / 2;
  obstacles = [];
  lastSpawn = 0;
  lastTime = 0;
  distance = 0;
  gameSpeed = 1;
  sceneryOffset = 0;
  scoreEl.textContent = 'Distance: 0';
}

function update(delta) {
  if (keys['arrowleft'] || keys['a']) car.x -= car.speed;
  if (keys['arrowright'] || keys['d']) car.x += car.speed;
  if (keys['arrowup'] || keys['w']) gameSpeed += 0.002 * delta;
  if (keys['arrowdown'] || keys['s']) gameSpeed = Math.max(1, gameSpeed - 0.004 * delta);

  car.x = Math.max(0, Math.min(canvas.width - car.width, car.x));

  obstacles.forEach(o => o.y += o.speed * gameSpeed);
  obstacles = obstacles.filter(o => o.y < canvas.height);

  lastSpawn += delta * gameSpeed;
  if (lastSpawn > 1000) {
    obstacles.push(createObstacle());
    lastSpawn = 0;
  }

  distance += gameSpeed * delta / 16;
  scoreEl.textContent = `Distance: ${Math.floor(distance)}`;

  sceneryOffset += gameSpeed * delta * 0.5;

  obstacles.forEach(o => {
    if (o.x < car.x + car.width && o.x + o.width > car.x &&
        o.y < car.y + car.height && o.y + o.height > car.y) {
      running = false;
      stopEngine();
      playCrash();
      gameOverScreen.style.display = 'flex';
    }
  });
}

function draw() {
  // background grass
  ctx.fillStyle = 'green';
  ctx.fillRect(0,0,canvas.width,canvas.height);

  // road pseudo-3D
  ctx.beginPath();
  ctx.moveTo(canvas.width * 0.25,0);
  ctx.lineTo(canvas.width * 0.75,0);
  ctx.lineTo(canvas.width,canvas.height);
  ctx.lineTo(0,canvas.height);
  ctx.closePath();
  ctx.fillStyle = '#555';
  ctx.fill();

  // lane line
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 4;
  ctx.setLineDash([20,20]);
  ctx.lineDashOffset = -sceneryOffset;
  ctx.beginPath();
  ctx.moveTo(canvas.width/2,0);
  ctx.lineTo(canvas.width/2,canvas.height);
  ctx.stroke();
  ctx.setLineDash([]);

  // roadside signs
  ctx.fillStyle = 'yellow';
  const signSpacing = 150;
  for (let y = -(sceneryOffset % signSpacing); y < canvas.height; y += signSpacing) {
    ctx.fillRect(30, y, 10, 20);
    ctx.fillRect(canvas.width - 40, y, 10, 20);
  }

  // car
  ctx.fillStyle = 'red';
  ctx.fillRect(car.x, car.y, car.width, car.height);

  // obstacles
  ctx.fillStyle = 'black';
  obstacles.forEach(o => ctx.fillRect(o.x, o.y, o.width, o.height));
}

function gameLoop(timestamp) {
  if (!running) return;
  const delta = timestamp - lastTime;
  lastTime = timestamp;
  update(delta);
  draw();
  requestAnimationFrame(gameLoop);
}

startBtn.addEventListener('click', () => {
  startScreen.style.display = 'none';
  audioCtx.resume();
  startEngine();
  running = true;
  reset();
  requestAnimationFrame(gameLoop);
});

restartBtn.addEventListener('click', () => {
  gameOverScreen.style.display = 'none';
  audioCtx.resume();
  startEngine();
  running = true;
  reset();
  requestAnimationFrame(gameLoop);
});
