const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const scoreEl = document.getElementById('score');
const settingsScreen = document.getElementById('settingsScreen');
const settingsBtn = document.getElementById('settingsBtn');
const settingsBtn2 = document.getElementById('settingsBtn2');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const volumeSlider = document.getElementById('volumeSlider');

let musicVolume = volumeSlider.value / 1000;

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
  const types = ['car','cone','rock'];
  const type = types[Math.floor(Math.random()*types.length)];
  let width, height;
  switch(type) {
    case 'car':
      width = 40;
      height = 80;
      break;
    case 'cone':
      width = 20;
      height = 30;
      break;
    default:
      width = 30;
      height = 30;
  }
  const x = canvas.width * 0.25 + Math.random() * (canvas.width * 0.5 - width);
  return { type, x, y: -height, width, height, speed: 4 };
}

function createPowerUp() {
  const type = Math.random() < 0.5 ? 'boost' : 'shield';
  const size = 20;
  const x = canvas.width * 0.25 + Math.random() * (canvas.width * 0.5 - size);
  return { type, x, y: -size, size, speed: 3 };
}

let obstacles = [];
let lastSpawn = 0;
let lastTime = 0;
let running = false;
let distance = 0;
let gameSpeed = 1;
let sceneryOffset = 0;
let powerUps = [];
let lastPowerUpSpawn = 0;
let shieldActive = false;
let speedBoost = 1;
let boostTimer = 0;

// Audio
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let musicOscillator;
let musicInterval;
let musicGain;
const melody = [261.63, 329.63, 392.0, 523.25]; // simple loop

function startMusic() {
  musicOscillator = audioCtx.createOscillator();
  musicGain = audioCtx.createGain();
  musicOscillator.type = 'square';
  musicOscillator.frequency.value = melody[0];
  musicGain.gain.value = musicVolume;
  musicOscillator.connect(musicGain).connect(audioCtx.destination);
  musicOscillator.start();
  let index = 0;
  musicInterval = setInterval(() => {
    index = (index + 1) % melody.length;
    musicOscillator.frequency.setValueAtTime(melody[index], audioCtx.currentTime);
  }, 200);
}

function stopMusic() {
  if (musicOscillator) {
    musicOscillator.stop();
    musicOscillator.disconnect();
    musicOscillator = null;
  }
  if (musicInterval) {
    clearInterval(musicInterval);
    musicInterval = null;
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
  powerUps = [];
  lastPowerUpSpawn = 0;
  shieldActive = false;
  speedBoost = 1;
  boostTimer = 0;
  scoreEl.textContent = 'Distance: 0';
}

function update(delta) {
  if (keys['arrowleft'] || keys['a']) car.x -= car.speed;
  if (keys['arrowright'] || keys['d']) car.x += car.speed;
  if (keys['arrowup'] || keys['w']) gameSpeed += 0.002 * delta;
  if (keys['arrowdown'] || keys['s']) gameSpeed = Math.max(1, gameSpeed - 0.004 * delta);

  car.x = Math.max(0, Math.min(canvas.width - car.width, car.x));

  if (boostTimer > 0) {
    boostTimer -= delta;
    if (boostTimer <= 0) speedBoost = 1;
  }

  obstacles.forEach(o => o.y += o.speed * gameSpeed * speedBoost);
  obstacles = obstacles.filter(o => o.y < canvas.height);

  powerUps.forEach(p => p.y += p.speed * gameSpeed * speedBoost);
  powerUps = powerUps.filter(p => p.y < canvas.height);

  lastSpawn += delta * gameSpeed * speedBoost;
  if (lastSpawn > 1000) {
    obstacles.push(createObstacle());
    lastSpawn = 0;
  }

  lastPowerUpSpawn += delta * gameSpeed * speedBoost;
  if (lastPowerUpSpawn > 5000) {
    powerUps.push(createPowerUp());
    lastPowerUpSpawn = 0;
  }

  distance += gameSpeed * speedBoost * delta / 16;
  scoreEl.textContent = `Distance: ${Math.floor(distance)}`;

  sceneryOffset += gameSpeed * speedBoost * delta * 0.5;

  for (let i = obstacles.length - 1; i >= 0; i--) {
    const o = obstacles[i];
    if (o.x < car.x + car.width && o.x + o.width > car.x &&
        o.y < car.y + car.height && o.y + o.height > car.y) {
      if (shieldActive) {
        shieldActive = false;
        obstacles.splice(i,1);
      } else {
        running = false;
        stopMusic();
        playCrash();
        gameOverScreen.style.display = 'flex';
      }
    }
  }

  for (let i = powerUps.length - 1; i >= 0; i--) {
    const p = powerUps[i];
    if (p.x < car.x + car.width && p.x + p.size > car.x &&
        p.y < car.y + car.height && p.y + p.size > car.y) {
      if (p.type === 'boost') {
        speedBoost = 2;
        boostTimer = 3000;
      } else if (p.type === 'shield') {
        shieldActive = true;
      }
      powerUps.splice(i,1);
    }
  }
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

  // road lines
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(canvas.width * 0.25,0);
  ctx.lineTo(0,canvas.height);
  ctx.moveTo(canvas.width * 0.75,0);
  ctx.lineTo(canvas.width,canvas.height);
  ctx.stroke();

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
  if (shieldActive) {
    ctx.strokeStyle = 'cyan';
    ctx.lineWidth = 3;
    ctx.strokeRect(car.x - 5, car.y - 5, car.width + 10, car.height + 10);
  }

  // obstacles
  obstacles.forEach(o => {
    if (o.type === 'car') {
      ctx.fillStyle = 'blue';
      ctx.fillRect(o.x, o.y, o.width, o.height);
      ctx.fillStyle = 'lightblue';
      ctx.fillRect(o.x + 5, o.y + 10, o.width - 10, o.height - 20);
    } else if (o.type === 'cone') {
      ctx.fillStyle = 'orange';
      ctx.beginPath();
      ctx.moveTo(o.x + o.width/2, o.y);
      ctx.lineTo(o.x, o.y + o.height);
      ctx.lineTo(o.x + o.width, o.y + o.height);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillStyle = 'gray';
      ctx.beginPath();
      ctx.arc(o.x + o.width/2, o.y + o.height/2, o.width/2, 0, Math.PI*2);
      ctx.fill();
    }
  });

  // power-ups
  powerUps.forEach(p => {
    if (p.type === 'boost') {
      ctx.fillStyle = 'blue';
      ctx.fillRect(p.x, p.y, p.size, p.size);
    } else if (p.type === 'shield') {
      ctx.strokeStyle = 'cyan';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x + p.size/2, p.y + p.size/2, p.size/2, 0, Math.PI*2);
      ctx.stroke();
    }
  });
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
  startMusic();
  running = true;
  reset();
  requestAnimationFrame(gameLoop);
});

restartBtn.addEventListener('click', () => {
  gameOverScreen.style.display = 'none';
  audioCtx.resume();
  startMusic();
  running = true;
  reset();
  requestAnimationFrame(gameLoop);
});

function openSettings() {
  settingsScreen.style.display = 'flex';
}

function closeSettings() {
  settingsScreen.style.display = 'none';
}

settingsBtn.addEventListener('click', openSettings);
if (settingsBtn2) settingsBtn2.addEventListener('click', openSettings);
closeSettingsBtn.addEventListener('click', closeSettings);

volumeSlider.addEventListener('input', () => {
  musicVolume = volumeSlider.value / 1000;
  if (musicGain) musicGain.gain.value = musicVolume;
});
