const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let useMobileDrag = false;
let currentWeapon = null;
let weaponSprite = { x: 0, y: 0, visible: false };
let coins = 0;
let activeBombs = [];

// UI
document.getElementById('pcBtn').addEventListener('click', () => startGame(false));
document.getElementById('mobileBtn').addEventListener('click', () => startGame(true));
document.querySelectorAll('#weaponPanel button').forEach(btn=>{
  btn.addEventListener('click',()=>{ currentWeapon=btn.dataset.weapon; });
});

function startGame(isMobile){
  useMobileDrag = isMobile;
  document.getElementById('startScreen').style.display='none';
  document.getElementById('weaponPanel').style.display='block';
  document.getElementById('coinDisplay').style.display='block';
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
  let draggedWeapon = false;
  let fallen = false;
  let fallTimer = 0;

  // --- Ragdoll Parts ---
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
      this.x+=vx; this.y+=vy+gravity;
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

  // --- Ragdoll ---
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

  // --- Drag functions ---
  function startDragPart(x,y){
    for(let p of parts){
      let dx=p.x-x; let dy=p.y-y;
      if(Math.sqrt(dx*dx+dy*dy)<p.radius){ draggedPart=p; p.fixed=true; return true; }
    }
    return false;
  }

  function startDragWeapon(x,y){
    if(currentWeapon){
      weaponSprite.x=x; weaponSprite.y=y; weaponSprite.visible=true;
      draggedWeapon=true;
      return true;
    }
    return false;
  }

  // --- Input ---
  if(!useMobileDrag){
    canvas.addEventListener('mousedown', e=>{
      mouse.down=true; mouse.x=e.offsetX; mouse.y=e.offsetY;
      if(!startDragPart(mouse.x,mouse.y)) startDragWeapon(mouse.x,mouse.y);
    });
    canvas.addEventListener('mousemove', e=>{
      mouse.x=e.offsetX; mouse.y=e.offsetY;
      if(draggedPart){ draggedPart.x=mouse.x; draggedPart.y=mouse.y; }
      if(draggedWeapon){ weaponSprite.x=mouse.x; weaponSprite.y=mouse.y; }
    });
    canvas.addEventListener('mouseup', ()=>{
      if(draggedPart){ draggedPart.fixed=false; draggedPart=null; }
      if(draggedWeapon && currentWeapon==='bomb'){
        // place bomb
        activeBombs.push({x:weaponSprite.x,y:weaponSprite.y, timer:60}); // 1 sec timer
      }
      draggedWeapon=false; weaponSprite.visible=false;
    });
  } else {
    canvas.addEventListener('touchstart', e=>{
      let touch=e.touches[0];
      mouse.x=touch.clientX-canvas.getBoundingClientRect().left;
      mouse.y=touch.clientY-canvas.getBoundingClientRect().top;
      if(!startDragPart(mouse.x,mouse.y)) startDragWeapon(mouse.x,mouse.y);
    });
    canvas.addEventListener('touchmove', e=>{
      let touch=e.touches[0];
      mouse.x=touch.clientX-canvas.getBoundingClientRect().left;
      mouse.y=touch.clientY-canvas.getBoundingClientRect().top;
      if(draggedPart){ draggedPart.x=mouse.x; draggedPart.y=mouse.y; }
      if(draggedWeapon){ weaponSprite.x=mouse.x; weaponSprite.y=mouse.y; }
    });
    canvas.addEventListener('touchend', ()=>{
      if(draggedPart){ draggedPart.fixed=false; draggedPart=null; }
      if(draggedWeapon && currentWeapon==='bomb'){
        activeBombs.push({x:weaponSprite.x,y:weaponSprite.y, timer:60});
      }
      draggedWeapon=false; weaponSprite.visible=false;
    });
  }

  // --- Weapon impact ---
  function applyWeaponImpact(part,weapon){
    switch(weapon){
      case 'bat': part.oldx-=20; part.oldy-=5; break;
      case 'hammer': part.oldx-=30; part.oldy-=10; break;
      case 'punch': part.oldx-=10; part.oldy-=5; break;
    }
    coins++;
    document.getElementById('coins').innerText=coins;
  }

  function checkWeaponHits(){
    if(!draggedWeapon || !currentWeapon) return;
    if(currentWeapon==='bat' || currentWeapon==='hammer'){
      parts.forEach(p=>{
        let dx = p.x-weaponSprite.x;
        let dy = p.y-weaponSprite.y;
        if(Math.sqrt(dx*dx+dy*dy)<p.radius+10){
          applyWeaponImpact(p,currentWeapon);
        }
      });
    }
  }

  function updateBombs(){
    for(let i=activeBombs.length-1;i>=0;i--){
      let bomb=activeBombs[i];
      bomb.timer--;
      // check for collision with parts
      parts.forEach(p=>{
        let dx=p.x-bomb.x;
        let dy=p.y-bomb.y;
        if(Math.sqrt(dx*dx+dy*dy)<p.radius+15){
          p.oldx-=50; p.oldy-=20;
          coins+=5;
          document.getElementById('coins').innerText=coins;
          bomb.timer=0;
        }
      });
      if(bomb.timer<=0) activeBombs.splice(i,1);
    }
  }

  // --- Auto stand ---
  let fallTimer=0;
  function checkFall(){
    let headBelow = head.y>body.y+50;
    if(headBelow && fallTimer<=0){
      fallTimer=180; // 3 sec at 60fps
    }
    if(fallTimer>0) fallTimer--;
    if(fallTimer===0 && headBelow){
      head.y=100; body.y=160; leftLeg.y=240; rightLeg.y=240;
    }
  }

  function autoStand(){
    let t=Date.now()*0.002;
    leftLeg.y=Math.min(body.y+80+Math.sin(t)*5,floorY-leftLeg.radius);
    rightLeg.y=Math.min(body.y+80-Math.sin(t)*5,floorY-rightLeg.radius);
  }

  function update(){
    for(let i=0;i<5;i++) constraints.forEach(c=>c.update());
    parts.forEach(p=>p.update());
    autoStand();
    checkFall();
    checkWeaponHits();
    updateBombs();
  }

  function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    constraints.forEach(c=>c.draw());
    parts.forEach(p=>p.draw());
    // draw weapon
    if(currentWeapon && weaponSprite.visible){
      ctx.save();
      switch(currentWeapon){
        case 'bat':
          ctx.fillStyle='sienna'; ctx.fillRect(weaponSprite.x-15,weaponSprite.y-5,30,10); break;
        case 'hammer':
          ctx.fillStyle='gray'; ctx.fillRect(weaponSprite.x-10,weaponSprite.y-15,20,30); break;
        case 'punch':
          ctx.fillStyle='orange'; ctx.beginPath();
          ctx.arc(weaponSprite.x,weaponSprite.y,10,0,Math.PI*2); ctx.fill(); break;
        case 'bomb':
          ctx.fillStyle='black'; ctx.beginPath();
          ctx.arc(weaponSprite.x,weaponSprite.y,12,0,Math.PI*2); ctx.fill(); break;
      }
      ctx.restore();
    }
    // draw bombs on field
    activeBombs.forEach(b=>{
      ctx.fillStyle='black';
      ctx.beginPath();
      ctx.arc(b.x,b.y,12,0,Math.PI*2);
      ctx.fill();
    });
  }

  function loop(){ update(); draw(); requestAnimationFrame(loop); }
  loop();

  window.addEventListener('resize',()=>{
    canvas.width=window.innerWidth*0.9;
    canvas.height=window.innerHeight*0.7;
  });
}
