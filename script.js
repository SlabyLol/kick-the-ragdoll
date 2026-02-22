const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let useMobileDrag = false;
let currentWeapon = null;
let weaponSprite = { x: 0, y: 0, visible: false };

// Start screen
document.getElementById('pcBtn').addEventListener('click', () => startGame(false));
document.getElementById('mobileBtn').addEventListener('click', () => startGame(true));
document.querySelectorAll('#weaponPanel button').forEach(btn=>{
  btn.addEventListener('click',()=>{ currentWeapon=btn.dataset.weapon; });
});

function startGame(isMobile){
  useMobileDrag = isMobile;
  document.getElementById('startScreen').style.display='none';
  document.getElementById('weaponPanel').style.display='block';
  canvas.style.display='block';
  canvas.width = window.innerWidth *0.9;
  canvas.height = window.innerHeight*0.7;
  initGame();
}

function initGame(){
  const gravity = 0.5;
  const friction = 0.9;
  const floorY = canvas.height;

  let mouse = {x:0,y:0,down:false};
  let draggedPart = null;

  // --- Ragdoll Part ---
  class Part{
    constructor(x,y,radius){
      this.x=x; this.y=y;
      this.oldx=x; this.oldy=y;
      this.radius=radius; this.fixed=false;
    }
    update(){
      if(this.fixed) return;
      let vx=(this.x-this.oldx)*friction;
      let vy=(this.y-this.oldy)*friction;
      this.oldx=this.x; this.oldy=this.y;
      this.x+=vx;
      this.y+=vy+gravity;
      if(this.y+this.radius>floorY){ this.y=floorY-this.radius; this.oldy=this.y+vy*-0.5; }
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

  // --- Constraint ---
  class Constraint{
    constructor(a,b,length){
      this.a=a; this.b=b; this.length=length;
    }
    update(){
      let dx=this.b.x-this.a.x;
      let dy=this.b.y-this.a.y;
      let dist=Math.sqrt(dx*dx+dy*dy);
      let diff=(this.length-dist)/dist/2;
      let ox=dx*diff; let oy=dy*diff;
      if(!this.a.fixed){ this.a.x-=ox; this.a.y-=oy; }
      if(!this.b.fixed){ this.b.x+=ox; this.b.y+=oy; }
      [this.a,this.b].forEach(p=>{
        if(p.y+p.radius>floorY){ p.y=floorY-p.radius; }
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

  // --- Create Ragdoll ---
  let head = new Part(canvas.width/2,100,20);
  let body = new Part(canvas.width/2,160,25);
  let leftArm = new Part(canvas.width/2-40,160,10);
  let rightArm = new Part(canvas.width/2+40,160,10);
  let leftLeg = new Part(canvas.width/2-20,240,10);
  let rightLeg = new Part(canvas.width/2+20,240,10);

  let parts=[head,body,leftArm,rightArm,leftLeg,rightLeg];
  let constraints=[
    new Constraint(head,body,40),
    new Constraint(body,leftArm,50),
    new Constraint(body,rightArm,50),
    new Constraint(body,leftLeg,80),
    new Constraint(body,rightLeg,80)
  ];

  // --- Drag setup ---
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
      if(currentWeapon){ weaponSprite.x=mouse.x; weaponSprite.y=mouse.y; weaponSprite.visible=true; }
      if(draggedPart){ draggedPart.x=mouse.x; draggedPart.y=mouse.y; }
    });
    canvas.addEventListener('mouseup', ()=>{ if(draggedPart){ draggedPart.fixed=false; draggedPart=null; } weaponSprite.visible=false; });
  } else {
    canvas.addEventListener('touchstart', e=>{
      let touch=e.touches[0];
      mouse.down=true;
      mouse.x=touch.clientX-canvas.getBoundingClientRect().left;
      mouse.y=touch.clientY-canvas.getBoundingClientRect().top;
      weaponSprite.x=mouse.x; weaponSprite.y=mouse.y; weaponSprite.visible=true;
      for(let p of parts){
        let dx=p.x-mouse.x; let dy=p.y-mouse.y;
        if(Math.sqrt(dx*dx+dy*dy)<p.radius){ draggedPart=p; p.fixed=true; break; }
      }
    });
    canvas.addEventListener('touchmove', e=>{
      let touch=e.touches[0];
      mouse.x=touch.clientX-canvas.getBoundingClientRect().left;
      mouse.y=touch.clientY-canvas.getBoundingClientRect().top;
      weaponSprite.x=mouse.x; weaponSprite.y=mouse.y;
      if(draggedPart){ draggedPart.x=mouse.x; draggedPart.y=mouse.y; }
    });
    canvas.addEventListener('touchend', ()=>{ if(draggedPart){ draggedPart.fixed=false; draggedPart=null; } weaponSprite.visible=false; });
  }

  // --- Weapons ---
  function applyWeaponImpact(part){
    if(currentWeapon==='bat') { part.oldx-=20; part.oldy-=5; }
    if(currentWeapon==='hammer'){ part.oldx-=30; part.oldy-=10; }
  }
  canvas.addEventListener('click', e=>{
    parts.forEach(p=>{
      let dx=p.x-e.offsetX;
      let dy=p.y-e.offsetY;
      if(Math.sqrt(dx*dx+dy*dy)<p.radius){ applyWeaponImpact(p); }
    });
  });

  // --- Autonomous standing & stumble ---
  let walkTime=0;
  let fallCooldown=0;
  function autoStand(){
    walkTime+=0.02;
    let step=Math.sin(walkTime)*5;
    leftLeg.y=Math.min(body.y+80+step,floorY-leftLeg.radius);
    rightLeg.y=Math.min(body.y+80-step,floorY-rightLeg.radius);
    if(body.y>140) body.y-=0.15;
    if(head.y>100) head.y-=0.15;
    // stumble simulation
    let tilt=Math.abs(leftLeg.y-rightLeg.y);
    if(tilt>30 && fallCooldown<=0){
      parts.forEach(p=>p.y+=15); // fall
      fallCooldown=100;
    }
    if(fallCooldown>0) fallCooldown--;
  }

  function update(){
    for(let i=0;i<5;i++) constraints.forEach(c=>c.update());
    parts.forEach(p=>p.update());
    autoStand();
  }

  function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    constraints.forEach(c=>c.draw());
    parts.forEach(p=>p.draw());
    // draw weapon
    if(currentWeapon && weaponSprite.visible){
      ctx.fillStyle='brown';
      ctx.fillRect(weaponSprite.x-10, weaponSprite.y-5, 20, 10);
      ctx.fillStyle='black';
      ctx.fillText(currentWeapon, weaponSprite.x-15, weaponSprite.y-10);
    }
  }

  function loop(){ update(); draw(); requestAnimationFrame(loop); }
  loop();

  window.addEventListener('resize',()=>{
    canvas.width=window.innerWidth*0.9;
    canvas.height=window.innerHeight*0.7;
  });
}
