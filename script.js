const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let useMobileDrag = false;

// Start screen buttons
document.getElementById('pcBtn').addEventListener('click', () => startGame(false));
document.getElementById('mobileBtn').addEventListener('click', () => startGame(true));

function startGame(isMobile) {
  useMobileDrag = isMobile;
  document.getElementById('startScreen').style.display = 'none';
  canvas.style.display = 'block';
  canvas.width = window.innerWidth * 0.9;
  canvas.height = window.innerHeight * 0.7;
  initGame();
}

function initGame() {
  const gravity = 0.5;
  const friction = 0.9;
  let mouse = { x:0, y:0, down:false };
  let draggedPart = null;

  // Ragdoll Part
  class Part {
    constructor(x,y,radius){
      this.x = x; this.y = y;
      this.oldx = x; this.oldy = y;
      this.radius = radius; this.fixed = false;
    }
    update() {
      if(this.fixed) return;
      let vx = (this.x-this.oldx)*friction;
      let vy = (this.y-this.oldy)*friction;
      this.oldx=this.x; this.oldy=this.y;
      this.x += vx; this.y += vy+gravity;
      // Floor collision
      if(this.y+this.radius>canvas.height){ this.y=canvas.height-this.radius; this.oldy=this.y+vy*-0.5; }
      // Wall collision
      if(this.x-this.radius<0){ this.x=this.radius; this.oldx=this.x+vx*-0.5; }
      if(this.x+this.radius>canvas.width){ this.x=canvas.width-this.radius; this.oldx=this.x+vx*-0.5; }
    }
    draw(){
      ctx.beginPath();
      ctx.fillStyle='red';
      ctx.arc(this.x,this.y,this.radius,0,Math.PI*2);
      ctx.fill();
    }
  }

  // Constraint / joint
  class Constraint {
    constructor(a,b,length){
      this.a=a; this.b=b; this.length=length;
    }
    update(){
      let dx=this.b.x-this.a.x;
      let dy=this.b.y-this.a.y;
      let dist=Math.sqrt(dx*dx+dy*dy);
      let diff=(this.length-dist)/dist/2;
      let offsetX=dx*diff; let offsetY=dy*diff;
      if(!this.a.fixed){ this.a.x-=offsetX; this.a.y-=offsetY; }
      if(!this.b.fixed){ this.b.x+=offsetX; this.b.y+=offsetY; }

      // Keep feet above floor
      [this.a,this.b].forEach(p=>{
        if(p.y+p.radius>canvas.height){ p.y=canvas.height-p.radius; }
      });
    }
    draw(){
      ctx.beginPath();
      ctx.strokeStyle='black';
      ctx.lineWidth=4;
      ctx.moveTo(this.a.x,this.a.y);
      ctx.lineTo(this.b.x,this.b.y);
      ctx.stroke();
    }
  }

  // Create ragdoll
  let head = new Part(canvas.width/2,100,20);
  let body = new Part(canvas.width/2,160,25);
  let leftArm = new Part(canvas.width/2-40,160,10);
  let rightArm = new Part(canvas.width/2+40,160,10);
  let leftLeg = new Part(canvas.width/2-20,240,10);
  let rightLeg = new Part(canvas.width/2+20,240,10);

  let parts = [head,body,leftArm,rightArm,leftLeg,rightLeg];
  let constraints = [
    new Constraint(head,body,40),
    new Constraint(body,leftArm,50),
    new Constraint(body,rightArm,50),
    new Constraint(body,leftLeg,80),
    new Constraint(body,rightLeg,80)
  ];

  // Drag setup
  if(!useMobileDrag){
    canvas.addEventListener('mousedown', e=>{
      mouse.down=true; mouse.x=e.offsetX; mouse.y=e.offsetY;
      for(let p of parts){
        let dx=p.x-mouse.x; let dy=p.y-mouse.y;
        if(Math.sqrt(dx*dx+dy*dy)<p.radius){ draggedPart=p; p.fixed=true; break; }
      }
    });
    canvas.addEventListener('mousemove', e=>{
      mouse.x=e.offsetX; mouse.y=e.offsetY;
      if(draggedPart){ draggedPart.x=mouse.x; draggedPart.y=mouse.y; }
    });
    canvas.addEventListener('mouseup', ()=>{ if(draggedPart){ draggedPart.fixed=false; draggedPart=null; } });
  } else {
    canvas.addEventListener('touchstart', e=>{
      mouse.down=true; 
      let touch=e.touches[0];
      mouse.x=touch.clientX-canvas.getBoundingClientRect().left;
      mouse.y=touch.clientY-canvas.getBoundingClientRect().top;
      for(let p of parts){
        let dx=p.x-mouse.x; let dy=p.y-mouse.y;
        if(Math.sqrt(dx*dx+dy*dy)<p.radius){ draggedPart=p; p.fixed=true; break; }
      }
    });
    canvas.addEventListener('touchmove', e=>{
      let touch=e.touches[0];
      mouse.x=touch.clientX-canvas.getBoundingClientRect().left;
      mouse.y=touch.clientY-canvas.getBoundingClientRect().top;
      if(draggedPart){ draggedPart.x=mouse.x; draggedPart.y=mouse.y; }
    });
    canvas.addEventListener('touchend', ()=>{ if(draggedPart){ draggedPart.fixed=false; draggedPart=null; } });
  }

  // Autonomous walk
  let walkTime=0;
  function autoWalk(){
    walkTime+=0.03; // slower
    let step=Math.sin(walkTime)*5;
    leftLeg.y=Math.min(body.y+80+step,canvas.height-leftLeg.radius);
    rightLeg.y=Math.min(body.y+80-step,canvas.height-rightLeg.radius);
    if(body.y>140) body.y-=0.15;
    if(head.y>100) head.y-=0.15;
    let forward=0.6; // slow
    parts.forEach(p=>p.x+=forward);
  }

  function update(){
    for(let i=0;i<5;i++) constraints.forEach(c=>c.update());
    parts.forEach(p=>p.update());
    autoWalk();
  }

  function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    constraints.forEach(c=>c.draw());
    parts.forEach(p=>p.draw());
  }

  function loop(){ update(); draw(); requestAnimationFrame(loop); }
  loop();

  // Responsive
  window.addEventListener('resize',()=>{
    canvas.width = window.innerWidth * 0.9;
    canvas.height = window.innerHeight * 0.7;
  });
}
