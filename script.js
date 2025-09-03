const canvas = document.getElementById('manHinh');
const ctx = canvas.getContext('2d');
const btnChoiLai = document.getElementById('btnChoiLai');

const frames = [new Image(), new Image()];
frames[0].src = 'assets/walk1.png';
frames[1].src = 'assets/walk2.png';

const st = {
  gameOver:false,
  diem:0,
  nv:{x:80,y:80,w:48,h:48,tocDo:3},
  phim:{},
  frameTick:0, frameIndex:0,
  setObj:{x:0,y:0,w:22,h:38,vx:0,vy:0},
  bomList:[] // {x,y,r,vx,vy}
};

function ngau(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }
function randPosRect(w,h,margin=18){ return {x:ngau(margin,canvas.width-margin-w), y:ngau(margin,canvas.height-margin-h)} }
function randPosCircle(r,margin=18){ return {x:ngau(r+margin,canvas.width-r-margin), y:ngau(r+margin,canvas.height-r-margin)} }
function rectRect(a,b){ return !(a.x+a.w<b.x||b.x+b.w<a.x||a.y+a.h<b.y||b.y+b.h<a.y); }
function rectCircle(rect,c){
  const gx=Math.max(rect.x,Math.min(c.x,rect.x+rect.w));
  const gy=Math.max(rect.y,Math.min(c.y,rect.y+rect.h));
  const dx=c.x-gx, dy=c.y-gy;
  return dx*dx+dy*dy<=c.r*c.r;
}

function placeMovingSet(){
  let p = randPosRect(st.setObj.w, st.setObj.h, 24);
  while (rectRect(st.nv, {x:p.x,y:p.y,w:st.setObj.w,h:st.setObj.h})) p = randPosRect(st.setObj.w, st.setObj.h, 24);
  st.setObj.x = p.x; st.setObj.y = p.y;
  const sp = 2 + Math.random()*1.5; const ang = Math.random()*Math.PI*2;
  st.setObj.vx = Math.cos(ang)*sp; st.setObj.vy = Math.sin(ang)*sp;
}

function spawnMovingBomb(){
  const r = 12;
  let p = randPosCircle(r,24);
  // tránh người chơi và tia sét
  while (rectCircle(st.nv, {x:p.x,y:p.y,r}) || rectRect({x:p.x-r,y:p.y-r,w:r*2,h:r*2}, st.setObj)){
    p = randPosCircle(r,24);
  }
  const sp = 1.5 + Math.random()*1.8; const ang = Math.random()*Math.PI*2;
  st.bomList.push({x:p.x,y:p.y,r, vx:Math.cos(ang)*sp, vy:Math.sin(ang)*sp});
}

function khoiTao(){
  st.gameOver=false; st.diem=0;
  st.nv.x=80; st.nv.y=80; st.nv.tocDo=3; st.frameTick=0; st.frameIndex=0;
  st.bomList.length=0;
  placeMovingSet();
  spawnMovingBomb();
}

window.addEventListener('keydown', e=>{
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault();
  st.phim[e.code] = true;
});
window.addEventListener('keyup', e=>{ st.phim[e.code] = false; });

function xuLyNhap(){
  const nv = st.nv, t = nv.tocDo; let di=false;
  if(st.phim['ArrowUp']||st.phim['KeyW']) { nv.y -= t; di=true; }
  if(st.phim['ArrowDown']||st.phim['KeyS']) { nv.y += t; di=true; }
  if(st.phim['ArrowLeft']||st.phim['KeyA']) { nv.x -= t; di=true; }
  if(st.phim['ArrowRight']||st.phim['KeyD']) { nv.x += t; di=true; }

  // chạm viền = game over (kiểm tra trước khi clamp)
  if(nv.x<=0||nv.y<=0||nv.x+nv.w>=canvas.width||nv.y+nv.h>=canvas.height) st.gameOver=true;

  // clamp để hiển thị
  nv.x = Math.max(0, Math.min(canvas.width-nv.w, nv.x));
  nv.y = Math.max(0, Math.min(canvas.height-nv.h, nv.y));

  if(di){ st.frameTick++; if(st.frameTick%10===0) st.frameIndex=(st.frameIndex+1)%frames.length; } else st.frameIndex=0;
}

function capNhat(){
  if(st.gameOver) return;
  xuLyNhap();
  if(st.gameOver) return;

  // Di chuyển tia sét + dội tường
  st.setObj.x += st.setObj.vx; st.setObj.y += st.setObj.vy;
  if (st.setObj.x <= 0 || st.setObj.x + st.setObj.w >= canvas.width)  st.setObj.vx *= -1;
  if (st.setObj.y <= 0 || st.setObj.y + st.setObj.h >= canvas.height) st.setObj.vy *= -1;
  st.setObj.x = Math.max(0, Math.min(canvas.width - st.setObj.w, st.setObj.x));
  st.setObj.y = Math.max(0, Math.min(canvas.height - st.setObj.h, st.setObj.y));

  // Di chuyển bom + dội tường
  for (const b of st.bomList){
    b.x += b.vx; b.y += b.vy;
    if (b.x - b.r <= 0 || b.x + b.r >= canvas.width)  b.vx *= -1;
    if (b.y - b.r <= 0 || b.y + b.r >= canvas.height) b.vy *= -1;
    b.x = Math.max(b.r, Math.min(canvas.width - b.r, b.x));
    b.y = Math.max(b.r, Math.min(canvas.height - b.r, b.y));
  }

  // Bom: chạm là thua
  for(const b of st.bomList){ if(rectCircle(st.nv,b)){ st.gameOver=true; break; } }
  if(st.gameOver) return;

  // Ăn tia sét?
  if(rectRect(st.nv, st.setObj)){
    st.diem += 10;
    placeMovingSet();  // sét nhảy chỗ khác + tốc độ mới
    spawnMovingBomb(); // +1 bom di chuyển
  }
}

function veSet(x,y,w,h){
  ctx.save();
  ctx.translate(x,y);
  ctx.fillStyle='#fde047'; ctx.strokeStyle='#f59e0b'; ctx.lineWidth=2;
  ctx.beginPath();
  ctx.moveTo(w*0.2,0);
  ctx.lineTo(w*0.55,h*0.35);
  ctx.lineTo(w*0.35,h*0.35);
  ctx.lineTo(w*0.75,h);
  ctx.lineTo(w*0.45,h*0.6);
  ctx.lineTo(w*0.65,h*0.6);
  ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.restore();
}
function veBom(x,y,r){
  ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2);
  ctx.fillStyle='#374151'; ctx.fill();
  ctx.strokeStyle='#1f2937'; ctx.lineWidth=2; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x+r*0.4,y-r*0.7); ctx.lineTo(x+r*0.9,y-r*1.2);
  ctx.strokeStyle='#9ca3af'; ctx.lineWidth=2; ctx.stroke();
  ctx.beginPath(); ctx.arc(x+r*0.95,y-r*1.25,3,0,Math.PI*2);
  ctx.fillStyle='#f59e0b'; ctx.fill();
}

function ve(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  // Sét + bom
  veSet(st.setObj.x, st.setObj.y, st.setObj.w, st.setObj.h);
  for(const b of st.bomList) veBom(b.x,b.y,b.r);
  // Nhân vật
  const f = frames[st.frameIndex];
  if(!f.complete){ ctx.fillStyle='#2563eb'; ctx.fillRect(st.nv.x,st.nv.y,st.nv.w,st.nv.h); }
  else{ ctx.drawImage(f,st.nv.x,st.nv.y,st.nv.w,st.nv.h); }
  // HUD
  ctx.fillStyle='rgba(255,255,255,0.85)';
  ctx.fillRect(8,8,220,28);
  ctx.fillStyle='#111'; ctx.font='16px system-ui,sans-serif';
  ctx.fillText('⭐ '+st.diem+'  ⚡1  💣'+st.bomList.length,16,28);

  if(st.gameOver){
    ctx.fillStyle='rgba(0,0,0,0.6)'; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle='#fff'; ctx.font='22px system-ui,sans-serif'; ctx.textAlign='center';
    ctx.fillText('GAME OVER — điểm: '+st.diem, canvas.width/2, canvas.height/2-10);
    ctx.font='16px system-ui,sans-serif';
    ctx.fillText('Bấm "Chơi lại" để bắt đầu lại', canvas.width/2, canvas.height/2+18);
  }
}

function loop(){ capNhat(); ve(); requestAnimationFrame(loop); }
btnChoiLai.addEventListener('click', ()=>{ khoiTao(); });
khoiTao(); loop();
