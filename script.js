const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 600;

const gravity = 0.5;
const friction = 0.9;

let mouse = { x: 0, y: 0, down: false };
let walkMode = false;

// Körperteil-Klasse
class Part {
  constructor(x, y, radius) {
    this.x = x;
    this.y = y;
    this.oldx = x;
    this.oldy = y;
    this.radius = radius;
    this.fixed = false;
  }

  update() {
    if(this.fixed) return;
    let vx = (this.x - this.oldx) * friction;
    let vy = (this.y - this.oldy) * friction;
    this.oldx = this.x;
    this.oldy = this.y;
    this.x += vx;
    this.y += vy + gravity;

    // Boden/Wände
    if(this.y + this.radius > canvas.height) {
      this.y = canvas.height - this.radius;
      this.oldy = this.y + vy * -0.5;
    }
    if(this.x - this.radius < 0) { this.x = this.radius; this.oldx = this.x + vx * -0.5; }
    if(this.x + this.radius > canvas.width) { this.x = canvas.width - this.radius; this.oldx = this.x + vx * -0.5; }
  }

  draw() {
    ctx.beginPath();
    ctx.fillStyle = 'red';
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Gelenke/Constraints
class Constraint {
  constructor(a, b, length) {
    this.a = a;
    this.b = b;
    this.length = length;
  }

  update() {
    let dx = this.b.x - this.a.x;
    let dy = this.b.y - this.a.y;
    let dist = Math.sqrt(dx*dx + dy*dy);
    let diff = (this.length - dist) / dist / 2;
    let offsetX = dx * diff;
    let offsetY = dy * diff;
    if(!this.a.fixed) { this.a.x -= offsetX; this.a.y -= offsetY; }
    if(!this.b.fixed) { this.b.x += offsetX; this.b.y += offsetY; }
  }

  draw() {
    ctx.beginPath();
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 4;
    ctx.moveTo(this.a.x, this.a.y);
    ctx.lineTo(this.b.x, this.b.y);
    ctx.stroke();
  }
}

// Ragdoll erstellen
let head = new Part(400, 100, 20);
let body = new Part(400, 160, 25);
let leftArm = new Part(360, 160, 10);
let rightArm = new Part(440, 160, 10);
let leftLeg = new Part(380, 240, 10);
let rightLeg = new Part(420, 240, 10);

let parts = [head, body, leftArm, rightArm, leftLeg, rightLeg];
let constraints = [
  new Constraint(head, body, 40),
  new Constraint(body, leftArm, 50),
  new Constraint(body, rightArm, 50),
  new Constraint(body, leftLeg, 80),
  new Constraint(body, rightLeg, 80)
];

// Drag & Drop
let draggedPart = null;
canvas.addEventListener('mousedown', e => {
  mouse.down = true; mouse.x = e.offsetX; mouse.y = e.offsetY;
  for(let p of parts) {
    let dx = p.x - mouse.x;
    let dy = p.y - mouse.y;
    if(Math.sqrt(dx*dx + dy*dy) < p.radius) { draggedPart = p; p.fixed = true; break; }
  }
});
canvas.addEventListener('mousemove', e => {
  mouse.x = e.offsetX; mouse.y = e.offsetY;
  if(draggedPart) { draggedPart.x = mouse.x; draggedPart.y = mouse.y; }
});
canvas.addEventListener('mouseup', () => { mouse.down = false; if(draggedPart) { draggedPart.fixed = false; draggedPart = null; } });

// Aufstehen / Gehen Logik
let walkTime = 0;
document.addEventListener('keydown', e => {
  if(e.code === 'Space') walkMode = !walkMode;
});

function applyWalk() {
  if(!walkMode) return;
  walkTime += 0.1;
  let step = Math.sin(walkTime) * 5;

  // Beine bewegen
  leftLeg.y = body.y + 80 + step;
  rightLeg.y = body.y + 80 - step;

  // Körper leicht nach oben ziehen, Kopf stabil
  body.y -= 0.2;
  head.y -= 0.2;

  // Vorwärtsbewegung
  let forward = 1.5;
  for(let p of [head, body, leftArm, rightArm, leftLeg, rightLeg]) {
    if(!p.fixed) p.x += forward;
  }
}

function update() {
  for(let i=0; i<5; i++) constraints.forEach(c => c.update());
  parts.forEach(p => p.update());
  applyWalk();
}

function draw() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  constraints.forEach(c => c.draw());
  parts.forEach(p => p.draw());
}

function loop() { update(); draw(); requestAnimationFrame(loop); }
loop();
