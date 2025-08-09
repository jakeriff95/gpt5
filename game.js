const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const car = {
  width: 40,
  height: 80,
  x: canvas.width / 2 - 20,
  y: canvas.height - 100,
  speed: 5
};

const keys = {};
function handleKey(e, isDown) {
  const key = e.key.toLowerCase();
  if (['arrowleft', 'arrowright', 'a', 'd'].includes(key)) {
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

function update(delta) {
  if (keys['arrowleft'] || keys['a']) car.x -= car.speed;
  if (keys['arrowright'] || keys['d']) car.x += car.speed;
  car.x = Math.max(0, Math.min(canvas.width - car.width, car.x));

  obstacles.forEach(o => o.y += o.speed);
  obstacles = obstacles.filter(o => o.y < canvas.height);

  lastSpawn += delta;
  if (lastSpawn > 1000) {
    obstacles.push(createObstacle());
    lastSpawn = 0;
  }

  obstacles.forEach(o => {
    if (o.x < car.x + car.width && o.x + o.width > car.x &&
        o.y < car.y + car.height && o.y + o.height > car.y) {
      alert('Crash! Game over.');
      document.location.reload();
    }
  });
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'red';
  ctx.fillRect(car.x, car.y, car.width, car.height);
  ctx.fillStyle = 'black';
  obstacles.forEach(o => ctx.fillRect(o.x, o.y, o.width, o.height));
}

let lastTime = 0;
function gameLoop(timestamp) {
  const delta = timestamp - lastTime;
  lastTime = timestamp;
  update(delta);
  draw();
  requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);
