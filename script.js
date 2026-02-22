const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 600;
canvas.height = 400;

// Ragdoll als Kreis (vereinfacht)
let ragdoll = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  radius: 30,
  vx: 0,
  vy: 0
};

const gravity = 0.5;
const friction = 0.9;

// Maus-Interaktion
let mouse = { x: 0, y: 0, down: false };
canvas.addEventListener('mousedown', (e) => { mouse.down = true; mouse.x = e.offsetX; mouse.y = e.offsetY; kickRagdoll(); });
canvas.addEventListener('mouseup', () => { mouse.down = false; });
canvas.addEventListener('mousemove', (e) => { mouse.x = e.offsetX; mouse.y = e.offsetY; });

function kickRagdoll() {
  // Prüfen, ob Mausklick auf Ragdoll ist
  const dx = ragdoll.x - mouse.x;
  const dy = ragdoll.y - mouse.y;
  const dist = Math.sqrt(dx*dx + dy*dy);
  if(dist < ragdoll.radius) {
    // Impuls in Richtung von Klick
    ragdoll.vx += -dx * 0.2;
    ragdoll.vy += -dy * 0.2;
  }
}

function update() {
  ragdoll.vy += gravity;
  ragdoll.x += ragdoll.vx;
  ragdoll.y += ragdoll.vy;

  // Kollision mit Boden
  if(ragdoll.y + ragdoll.radius > canvas.height) {
    ragdoll.y = canvas.height - ragdoll.radius;
    ragdoll.vy *= -0.7; 
    ragdoll.vx *= friction;
  }

  // Kollision mit Wänden
  if(ragdoll.x - ragdoll.radius < 0 || ragdoll.x + ragdoll.radius > canvas.width) {
    ragdoll.vx *= -0.7;
    if(ragdoll.x - ragdoll.radius < 0) ragdoll.x = ragdoll.radius;
    if(ragdoll.x + ragdoll.radius > canvas.width) ragdoll.x = canvas.width - ragdoll.radius;
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'red';
  ctx.beginPath();
  ctx.arc(ragdoll.x, ragdoll.y, ragdoll.radius, 0, Math.PI * 2);
  ctx.fill();
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();
