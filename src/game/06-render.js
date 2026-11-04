// ---------- rendering ----------
let bgDirty=1,BG=null,SHK=0,TIME=0;const TXT=[],FXL=[];let BANNER=null;
function fx(o){if(FXL.length>(LQ()?60:160))return;o.t=0;FXL.push(o)}
function floatText(x,y,t,col,s){if(TXT.length>40)TXT.shift();TXT.push({x,y,t,col,s:s||1,life:1.1})}
function banner(t,col){BANNER={t,col,life:2.4}}
function shake(v){SHK=Math.max(SHK,v*(SET.shake??1))}
function fxStar(h){const p=h.c>=0?{x:(h.c+.5)*T,y:(h.r+.5)*T}:null;if(p){fx({k:'star',x:p.x,y:p.y,dur:.9,col:'#ffd76a'});floatText(p.x,p.y-T,'★'.repeat(h.star),'#ffd76a',1.4)}sfx('level',.7)}
const TIERCOL=['','#b8c2cc','#5fd17a','#4aa8ff','#c77dff','#ffcf2e'];
function benchSlot(i){const n=R.bench.length,w=Math.min(ss(T*.95),(W-40)/n);return{x:sx(FW/2)+(i-(n-1)/2)*w,y:sy(FH)+ss(T*.28)+w*.42,w}}
function buildBG(){
  const A=ACTS[R?R.act:0];BG=mk(cv.width,cv.height);if(!BG)return;const g=BG.getContext('2d');if(!g||!g.createLinearGradient)return;g.setTransform(DPR,0,0,DPR,0,0);
  const sky=g.createLinearGradient(0,0,0,H);sky.addColorStop(0,A.sky[0]);sky.addColorStop(1,A.sky[1]);g.fillStyle=sky;g.fillRect(0,0,W,H);
  // a raised plateau: dark edge, then tiles
  const x0=sx(-T*.15),x1=sx(FW+T*.15),y0=sy(-T*.15),y1=sy(FH+T*.15);
  g.fillStyle='rgba(0,0,0,.35)';g.fillRect(x0+6,y0+10,x1-x0,y1-y0+ss(T*.22));g.fillStyle=A.edge;g.fillRect(x0,y1,x1-x0,ss(T*.22));
  for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){const h=((c*73856093)^(r*19349663)^(R?R.seed:0))>>>0;g.fillStyle=A.ground[(c+r)%2?0:1];g.fillRect(sx(c*T),sy(r*T),ss(T)+.5,ss(T)*VY+.5);
    g.fillStyle=`rgba(255,255,255,${.015+(h%7)*.006})`;g.fillRect(sx(c*T),sy(r*T),ss(T)+.5,ss(T)*VY+.5);
    if(h%5===0){g.fillStyle='rgba(0,0,0,.08)';for(let k=0;k<3;k++){g.beginPath();g.ellipse(sx(c*T+((h>>k*3)%50)+7),sy(r*T+((h>>k*4)%50)+7),ss(3),ss(2),0,0,6.283);g.fill()}}}
  g.strokeStyle='rgba(0,0,0,.12)';g.lineWidth=1;for(let c=0;c<=COLS;c++){g.beginPath();g.moveTo(sx(c*T),sy(0));g.lineTo(sx(c*T),sy(FH));g.stroke()}for(let r=0;r<=ROWS;r++){g.beginPath();g.moveTo(sx(0),sy(r*T));g.lineTo(sx(FW),sy(r*T));g.stroke()}
  // the entrance lane and the keep courtyard
  g.fillStyle='rgba(30,20,40,.55)';g.fillRect(sx(-T*1.1),sy(SPAWN_ROWS[0]*T),ss(T*1.1),ss(T*SPAWN_ROWS.length)*VY);
  g.fillStyle='rgba(200,190,160,.35)';g.fillRect(sx(FW),sy(KEEP_ROWS[0]*T),ss(T*.9),ss(T*KEEP_ROWS.length)*VY);
  g.fillStyle=A.fog;g.fillRect(0,0,W,H);
  bgDirty=0}
function drawRoute(){const rt=R.field.route;if(!rt||rt.length<2)return;ctx.save();ctx.strokeStyle=R.phase==='wave'?'rgba(255,240,200,.16)':'rgba(255,240,200,.45)';ctx.lineWidth=Math.max(2,ss(5));ctx.setLineDash([ss(10),ss(12)]);ctx.lineDashOffset=-TIME*ss(40);ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(sx(-T*.6),sy((rt[0][1]+.5)*T));for(const [c,r] of rt)ctx.lineTo(sx((c+.5)*T),sy((r+.5)*T));ctx.lineTo(sx(FW+T*.5),sy((rt[rt.length-1][1]+.5)*T));ctx.stroke();ctx.restore();
  if(R.phase!=='wave'){ctx.font=`700 ${Math.max(11,ss(13))}px Cinzel,serif`;ctx.textAlign='left';ctx.fillStyle='rgba(255,240,200,.8)';ctx.fillText(`Road: ${rt.length} tiles`,sx(0),sy(-T*.25))}}
function drawRunes(){
  for(const q of R.field.runes){const x=sx((q.c+.5)*T),y=sy((q.r+.5)*T),s=ss(T),f=q.flash>0?q.flash/.3:0;if(q.flash>0)q.flash-=FRAME_DT;const v=runeMul(q);
    ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.55+.25*Math.sin(TIME*3+q.c)+f*.5;const gl=glow('120,170,255');if(gl)ctx.drawImage(gl,x-s*.8,y-s*.55,s*1.6,s*1.1);ctx.restore();
    ctx.strokeStyle=f?'#ffffff':'#9cc4ff';ctx.lineWidth=Math.max(1.5,ss(2.5));ctx.beginPath();ctx.ellipse(x,y,s*.38,s*.38*VY,0,0,6.283);ctx.stroke();
    ctx.save();ctx.translate(x,y);ctx.scale(1,VY);ctx.rotate(TIME*.6+q.ph);ctx.strokeStyle='rgba(190,215,255,.85)';ctx.lineWidth=Math.max(1,ss(1.6));for(let i=0;i<6;i++){ctx.rotate(1.047);ctx.beginPath();ctx.moveTo(s*.2,0);ctx.lineTo(s*.32,0);ctx.stroke()}ctx.restore();
    ctx.font=`900 ${Math.max(12,ss(19))}px Cinzel,serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineWidth=3;ctx.strokeStyle='#0a1430';ctx.strokeText('×'+v,x,y);ctx.fillStyle=f?'#ffffff':'#d8e6ff';ctx.fillText('×'+v,x,y)}}
function drawPortals(){
  for(const q of R.field.portals){const x=sx((q.c+.5)*T),y=sy((q.r+.5)*T),s=ss(T),f=q.flash>0?q.flash/.4:0;if(q.flash>0)q.flash-=FRAME_DT;
    ctx.save();ctx.translate(x,y);ctx.scale(1,VY);for(let i=0;i<3;i++){ctx.rotate(TIME*(1.4+i*.4));ctx.strokeStyle=`rgba(${190-i*30},${110+i*20},255,${.75-i*.15})`;ctx.lineWidth=Math.max(1.5,ss(3-i*.6));ctx.beginPath();ctx.arc(0,0,s*(.38-i*.08),0,4.4);ctx.stroke()}
    ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.6+f*.4;const gl=glow('170,90,255');if(gl)ctx.drawImage(gl,-s*.5,-s*.5,s,s);ctx.restore();
    ctx.font=`900 ${Math.max(11,ss(16))}px Cinzel,serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineWidth=3;ctx.strokeStyle='#1a0830';ctx.strokeText('×'+portalMul(q),x,y-s*.42);ctx.fillStyle='#e6c8ff';ctx.fillText('×'+portalMul(q),x,y-s*.42)}}
function drawSpawnAndKeep(){
  const y=sy((SPAWN_ROWS[0]+SPAWN_ROWS.length/2)*T),x=sx(-T*.55),s=ss(T);ctx.save();ctx.translate(x,y);
  const gr=ctx.createRadialGradient(0,0,0,0,0,s*.9);gr.addColorStop(0,'rgba(10,0,20,.95)');gr.addColorStop(.6,'rgba(80,20,120,.75)');gr.addColorStop(1,'rgba(120,40,200,0)');ctx.fillStyle=gr;ctx.beginPath();ctx.ellipse(0,0,s*.55,s*1.05,0,0,6.283);ctx.fill();
  ctx.strokeStyle='rgba(200,120,255,.8)';ctx.lineWidth=2;for(let i=0;i<3;i++){ctx.beginPath();ctx.ellipse(0,0,s*(.42+.06*Math.sin(TIME*3+i*2)),s*(.95+.05*Math.sin(TIME*2+i)),0,0,6.283);ctx.stroke()}ctx.restore();
  const k=sheet('keep');const kx=sx(FW+T*.62),ky=sy((KEEP_ROWS[0]+KEEP_ROWS.length/2)*T)+ss(T*.5),ks=ss(T*3.1);
  ctx.fillStyle='rgba(0,0,0,.3)';ctx.beginPath();ctx.ellipse(kx,ky,ks*.3,ks*.09,0,0,6.283);ctx.fill();
  if(k)ctx.drawImage(k,kx-ks/2,ky-ks*.86,ks,ks);else{ctx.fillStyle='#8a90a0';ctx.fillRect(kx-ks*.2,ky-ks*.6,ks*.4,ks*.6)}
  // keep health under the castle
  const bw=ss(T*1.5),bx=kx-bw/2,by=ky+ss(8),p=clamp(R.hp/R.hpMax,0,1);ctx.fillStyle='rgba(0,0,0,.7)';ctx.fillRect(bx-1,by-1,bw+2,ss(9)+2);ctx.fillStyle=p>.5?'#6ad06a':p>.25?'#ffc04a':'#ff4a4a';ctx.fillRect(bx,by,bw*p,ss(9));
  ctx.font=`800 ${Math.max(10,ss(12))}px "Barlow Condensed",sans-serif`;ctx.textAlign='center';ctx.textBaseline='top';ctx.fillStyle='#fff';ctx.fillText(Math.ceil(R.hp)+' / '+R.hpMax,kx,by+ss(10))}
const OBS_SCALE=[1.25,1.2,.95,.75,.85,.7];
function heroFrame(h){const busy=h.atk>0&&R.phase==='wave';if(busy){const p=1-h.atk/.42;return 4+clamp((p*6)|0,0,5)}return((TIME*5+h.uid)|0)%4}
function drawHeroAt(h,x,y,size,ghost){
  const f=frame('h_'+h.k,160,heroFrame(h),size*DPR);
  ctx.fillStyle='rgba(0,0,0,.28)';ctx.beginPath();ctx.ellipse(x,y,size*.22,size*.07,0,0,6.283);ctx.fill();
  if(h.star>1){ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=h.star===3?.7:.4;const gl=glow(h.star===3?'255,200,60':'150,200,255');if(gl)ctx.drawImage(gl,x-size*.45,y-size*.75,size*.9,size*.9);ctx.restore()}
  if(ghost)ctx.globalAlpha=.6;
  if(f){ctx.save();ctx.translate(x,y);if(h.face<0)ctx.scale(-1,1);ctx.drawImage(f,-size/2,-size*.86,size,size);ctx.restore()}
  else{ctx.fillStyle=TIERCOL[HEROES[h.k].c];ctx.beginPath();ctx.arc(x,y-size*.35,size*.22,0,6.283);ctx.fill()}
  ctx.globalAlpha=1;
  // stars, cost colour
  const st='★'.repeat(h.star),fs=Math.max(9,size*.16);ctx.font=`900 ${fs}px sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineWidth=3;ctx.strokeStyle='rgba(0,0,0,.85)';ctx.strokeText(st,x,y+fs*.55);ctx.fillStyle=h.star===3?'#ffd76a':h.star===2?'#cfe6ff':TIERCOL[HEROES[h.k].c];ctx.fillText(st,x,y+fs*.55)}
function drawMon(m){
  const D=MON[m.k],x=sx(m.x),fly=m.fly?ss(T*.55)+Math.sin(m.wob)*ss(4):0,y=sy(m.y),size=ss(T*1.25*(m.sz||D.sz))*(m.boss?1.15:1);
  ctx.fillStyle='rgba(0,0,0,.3)';ctx.beginPath();ctx.ellipse(x,y,size*.22,size*.07,0,0,6.283);ctx.fill();
  if(m.elite||m.boss){ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.55+.2*Math.sin(TIME*6);const gl=glow(m.boss?'255,80,60':'255,200,60');if(gl)ctx.drawImage(gl,x-size*.5,y-size*.4-fly,size,size*.6);ctx.restore()}
  if(m.slowT>0&&m.slowP<1){ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.35;const gl=glow('120,200,255');if(gl)ctx.drawImage(gl,x-size*.35,y-size*.7-fly,size*.7,size*.7);ctx.restore()}
  const fi=((m.wob*1.1)|0)%6,f=frame('m_'+m.k,160,(m.stunT>0||m.rootT>0)?0:fi,size*DPR);
  if(f){ctx.save();ctx.translate(x,y-fly);if(m.face<0)ctx.scale(-1,1);ctx.drawImage(f,-size/2,-size*.86,size,size);if(m.hitT>0&&!LQ()){ctx.globalCompositeOperation='lighter';ctx.globalAlpha=m.hitT*3;ctx.drawImage(f,-size/2,-size*.86,size,size)}ctx.restore()}
  else{ctx.fillStyle='#c8c0b0';ctx.beginPath();ctx.arc(x,y-size*.3-fly,size*.22,0,6.283);ctx.fill()}
  if(m.rootT>0){ctx.strokeStyle='#6ad04a';ctx.lineWidth=Math.max(1.5,ss(2.5));for(let i=0;i<4;i++){const a=i*1.57+TIME;ctx.beginPath();ctx.moveTo(x+Math.cos(a)*size*.2,y);ctx.quadraticCurveTo(x+Math.cos(a)*size*.25,y-size*.25,x+Math.cos(a+.6)*size*.12,y-size*.4);ctx.stroke()}}
  if(m.stunT>0){ctx.fillStyle='#ffe066';for(let i=0;i<3;i++){const a=TIME*5+i*2.09;ctx.beginPath();ctx.arc(x+Math.cos(a)*size*.2,y-size*.85-fly+Math.sin(a)*size*.05,Math.max(1.5,size*.04),0,6.283);ctx.fill()}}
  if(m.dots.length){ctx.fillStyle='rgba(180,255,90,.8)';const ph=(TIME*1.5+m.id*.3)%1;ctx.globalAlpha=1-ph;ctx.beginPath();ctx.arc(x+size*.12,y-size*(.5+ph*.4)-fly,Math.max(1.5,size*.05),0,6.283);ctx.fill();ctx.globalAlpha=1}
  if(m.hp<m.max||m.boss||m.elite){const bw=size*(m.boss?.9:.55),by=y-size*.92-fly,p=clamp(m.hp/m.max,0,1);ctx.fillStyle='rgba(0,0,0,.75)';ctx.fillRect(x-bw/2-1,by-1,bw+2,Math.max(3,size*.05)+2);ctx.fillStyle=m.boss?'#ff5a4a':m.elite?'#ffcf2e':'#e8473f';ctx.fillRect(x-bw/2,by,bw*p,Math.max(3,size*.05));
    if(m.boss){ctx.font=`700 ${Math.max(10,ss(12))}px Cinzel,serif`;ctx.textAlign='center';ctx.textBaseline='bottom';ctx.fillStyle='#fff';ctx.fillText(MON[m.k].n,x,by-2)}}
}
function drawProj(q){const x=sx(q.x),y=sy(q.y)-ss(T*.35),big=q.mult>1,s=ss(T)*(big?1.25:1);
  const a=Math.atan2((q.ty-q.y)*VY,q.tx-q.x);
  if(big){ctx.save();ctx.globalCompositeOperation='lighter';const gl=glow('170,140,255');if(gl)ctx.drawImage(gl,x-s*.3,y-s*.3,s*.6,s*.6);ctx.restore()}
  if(q.kind==='arrow'||q.kind==='bolt'){ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.strokeStyle=q.kind==='bolt'?'#d8d0c0':'#e8d4a8';ctx.lineWidth=Math.max(1.5,ss(2.2));ctx.beginPath();ctx.moveTo(-s*.22,0);ctx.lineTo(s*.12,0);ctx.stroke();ctx.fillStyle='#e8eef5';ctx.beginPath();ctx.moveTo(s*.18,0);ctx.lineTo(s*.08,-s*.05);ctx.lineTo(s*.08,s*.05);ctx.fill();ctx.restore();return}
  if(q.kind==='star'){ctx.save();ctx.translate(x,y);ctx.rotate(TIME*20);ctx.fillStyle='#dfe6ee';ctx.beginPath();for(let i=0;i<8;i++){const r=i%2?s*.04:s*.11;ctx.lineTo(Math.cos(i*.785)*r,Math.sin(i*.785)*r)}ctx.fill();ctx.restore();return}
  const col=q.kind==='fire'?'255,120,40':q.kind==='holy'?'255,230,140':q.src&&HEROES[q.src.k].tr.includes('shadow')?'190,120,255':'110,200,255';
  ctx.save();ctx.globalCompositeOperation='lighter';const gl=glow(col);if(gl)ctx.drawImage(gl,x-s*.25,y-s*.25,s*.5,s*.5);ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x,y,s*.05,0,6.283);ctx.fill();ctx.restore()}
function drawFx(dt){
  for(const f of FXL){f.t+=dt;const p=Math.min(1,f.t/f.dur),x=sx(f.x),y=sy(f.y),a=1-p;
    if(f.k==='ring'||f.k==='nova'||f.k==='hex'||f.k==='fire'||f.k==='roots'){const r=ss(f.r)*(f.k==='ring'?.6+.4*p:.85+.15*p);ctx.save();ctx.globalAlpha=a*(f.k==='ring'?.9:.55);
      if(f.k!=='ring'){ctx.fillStyle=f.k==='fire'?'rgba(255,110,40,.6)':f.k==='hex'?'rgba(150,80,220,.55)':f.k==='roots'?'rgba(90,200,60,.5)':hexA(f.col,.4);ctx.beginPath();ctx.ellipse(x,y,r,r*VY,0,0,6.283);ctx.fill()}
      ctx.strokeStyle=f.col;ctx.lineWidth=Math.max(2,ss(4)*a);ctx.beginPath();ctx.ellipse(x,y,r,r*VY,0,0,6.283);ctx.stroke();ctx.restore()}
    else if(f.k==='die'){ctx.save();ctx.globalAlpha=a;for(let i=0;i<6;i++){const an=i*1.05,d=ss(f.r)*p;ctx.fillStyle=f.col;ctx.beginPath();ctx.arc(x+Math.cos(an)*d,y-ss(T*.3)+Math.sin(an)*d*VY-ss(10)*p,Math.max(1.5,ss(4)*a),0,6.283);ctx.fill()}ctx.restore();dspr('smoke_04','#5a5048',x,y-ss(T*.3),ss(f.r*2)*(.6+p),ss(f.r*2)*(.6+p),f.x,a*.5)}
    else if(f.k==='slash'){ctx.save();ctx.translate(x,y-ss(T*.3));ctx.scale(f.face||1,1);ctx.globalAlpha=a;ctx.strokeStyle=f.col;ctx.lineWidth=Math.max(2,ss(f.big?6:3.5));ctx.lineCap='round';ctx.beginPath();ctx.arc(0,0,ss(T*(f.big?.5:.32)),-1.9+p*.6,-.2+p*.6);ctx.stroke();ctx.restore()}
    else if(f.k==='cast'){ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=a;const gl=glow('255,255,255');if(gl)ctx.drawImage(gl,x-ss(T*.5),y-ss(T*1.1)-ss(10)*p,ss(T),ss(T));ctx.strokeStyle=f.col;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,y,ss(T*.45)*(.5+p),ss(T*.45)*(.5+p)*VY,0,0,6.283);ctx.stroke();ctx.restore()}
    else if(f.k==='line'||f.k==='bolt'||f.k==='beam'){ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=a;ctx.strokeStyle=f.mult>1?'#c9a8ff':f.col;ctx.lineWidth=Math.max(2,ss(f.k==='beam'?18:f.k==='line'?7:3))*(f.k==='bolt'?1:a+.3);ctx.lineCap='round';ctx.beginPath();
      if(f.k==='bolt'){const n=5;ctx.moveTo(x,y-ss(T*.35));for(let i=1;i<=n;i++){const t=i/n;ctx.lineTo(sx(lerp(f.x,f.x1,t))+(i<n?(Math.random()-.5)*ss(14):0),sy(lerp(f.y,f.y1,t))-ss(T*.35))}}
      else{ctx.moveTo(x,y-ss(T*.35));ctx.lineTo(sx(f.x1),sy(f.y1)-ss(T*.35))}ctx.stroke();
      if(f.k==='beam'){ctx.strokeStyle='#ffffff';ctx.lineWidth=Math.max(1,ss(5))*a;ctx.stroke()}
      if(f.mult>1){ctx.font=`900 ${Math.max(12,ss(18))}px Cinzel,serif`;ctx.fillStyle='#e6dcff';ctx.textAlign='center';ctx.fillText('×'+fmt(f.mult),sx((f.x+f.x1)/2),sy((f.y+f.y1)/2)-ss(T*.6))}ctx.restore()}
    else if(f.k==='cone'){ctx.save();ctx.globalAlpha=a*.7;ctx.translate(x,y-ss(T*.3));ctx.scale(1,VY);ctx.fillStyle='rgba(255,120,40,.55)';ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,ss(f.r)*(.6+.4*p),f.a-.65,f.a+.65);ctx.closePath();ctx.fill();ctx.restore()}
    else if(f.k==='star'){ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=a;const gl=glow('255,215,100');if(gl)ctx.drawImage(gl,x-ss(T)*(1+p),y-ss(T)*(1.4+p),ss(T*2)*(1+p),ss(T*2)*(1+p));ctx.restore()}}
  for(let i=FXL.length-1;i>=0;i--)if(FXL[i].t>=FXL[i].dur)FXL.splice(i,1)}
function render(dt){
  if(!ctx||!R)return;TIME+=dt;if(bgDirty||!BG)buildBG();
  ctx.setTransform(DPR,0,0,DPR,0,0);ctx.save();if(SHK>0){ctx.translate((Math.random()-.5)*SHK,(Math.random()-.5)*SHK);SHK=Math.max(0,SHK-dt*40)}
  if(BG)ctx.drawImage(BG,0,0,W,H);
  drawRoute();drawPortals();drawRunes();
  if(R.b)for(const tp of R.b.traps){const x=sx(tp.x),y=sy(tp.y),s=ss(T*.35);ctx.strokeStyle='#9aff6a';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,y,s,s*VY,0,0,6.283);ctx.stroke();for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(i*1.57+.78)*s,y+Math.sin(i*1.57+.78)*s*VY);ctx.stroke()}}
  drawPlacement();
  // everything that stands on the field, back to front
  const list=[];for(const o of R.field.obs)list.push({y:(o.r+.5)*T,o});for(const h of R.board)if(!(DRAG&&DRAG.h===h))list.push({y:(h.r+.5)*T,h});if(R.b)for(const m of R.b.mons)if(m.hp>0)list.push({y:m.y+(m.fly?T*2:0),m});
  list.sort((a,b)=>a.y-b.y);
  const ps=sheet('props');
  for(const it of list){if(it.o){const o=it.o,x=sx((o.c+.5)*T),y=sy((o.r+.5)*T)+ss(T*.12),s=ss(T*1.35*OBS_SCALE[o.k]);ctx.fillStyle='rgba(0,0,0,.25)';ctx.beginPath();ctx.ellipse(x,y,s*.32,s*.1,0,0,6.283);ctx.fill();const f=frame('props',192,o.k,s*DPR);if(f)ctx.drawImage(f,x-s/2,y-s*.86,s,s);else{ctx.fillStyle='#6a6a60';ctx.fillRect(x-s*.2,y-s*.4,s*.4,s*.4)}}
    else if(it.h){const h=it.h;drawHeroAt(h,sx((h.c+.5)*T),sy((h.r+.5)*T)+ss(T*.15),ss(T*1.45));if(R.phase==='wave'){const D=HEROES[h.k],x=sx((h.c+.5)*T),y=sy((h.r+.5)*T)+ss(T*.32),bw=ss(T*.6);ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillRect(x-bw/2,y,bw,ss(4));ctx.fillStyle='#4ab8ff';ctx.fillRect(x-bw/2,y,bw*clamp(h.mana/D.mana,0,1),ss(4))}}
    else drawMon(it.m)}
  drawSpawnAndKeep();
  if(R.b)for(const q of R.b.projs)drawProj(q);
  drawFx(dt);drawBench();
  // floating text
  ctx.textAlign='center';ctx.textBaseline='middle';for(const t of TXT){t.life-=dt;const a=clamp(t.life*2,0,1),fs=Math.max(11,ss(15))*t.s*(t.life>1?1.2:1);ctx.globalAlpha=a;ctx.font=`800 ${fs}px "Barlow Condensed",sans-serif`;ctx.lineWidth=3;ctx.strokeStyle='rgba(0,0,0,.85)';const y=sy(t.y)-ss(T*.4)-(1.1-t.life)*ss(26);ctx.strokeText(t.t,sx(t.x),y);ctx.fillStyle=t.col;ctx.fillText(t.t,sx(t.x),y)}ctx.globalAlpha=1;for(let i=TXT.length-1;i>=0;i--)if(TXT[i].life<=0)TXT.splice(i,1);
  if(BANNER){BANNER.life-=dt;const a=clamp(BANNER.life,0,1),fs=Math.min(W/16,42);ctx.globalAlpha=a;ctx.font=`900 ${fs}px Cinzel,serif`;ctx.lineWidth=6;ctx.strokeStyle='rgba(0,0,0,.8)';ctx.strokeText(BANNER.t,W/2+Math.min(0,0),sy(FH*.25));ctx.fillStyle=BANNER.col;ctx.fillText(BANNER.t,W/2,sy(FH*.25));ctx.globalAlpha=1;if(BANNER.life<=0)BANNER=null}
  drawDrag();ctx.restore()}
function drawBench(){
  const n=R.bench.length;for(let i=0;i<n;i++){const b=benchSlot(i),h=R.bench[i];ctx.fillStyle=DRAG&&DRAG.overBench===i?'rgba(255,215,106,.25)':'rgba(0,0,0,.32)';ctx.strokeStyle='rgba(255,230,180,.25)';ctx.lineWidth=1;
    const w=b.w*.92,hh=b.w*.62;ctx.beginPath();ctx.roundRect?ctx.roundRect(b.x-w/2,b.y-hh*.55,w,hh,6):ctx.rect(b.x-w/2,b.y-hh*.55,w,hh);ctx.fill();ctx.stroke();
    if(h&&!(DRAG&&DRAG.h===h))drawHeroAt(h,b.x,b.y+hh*.3,b.w*1.05)}
  // rune stones waiting to be placed
  R.stones.forEach((v,i)=>{if(DRAG&&DRAG.stone===i)return;const p=stoneSlot(i);ctx.save();ctx.globalCompositeOperation='lighter';const gl=glow('120,170,255');if(gl)ctx.drawImage(gl,p.x-p.s,p.y-p.s,p.s*2,p.s*2);ctx.restore();ctx.fillStyle='#2a3a6a';ctx.strokeStyle='#9cc4ff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y,p.s*.55,0,6.283);ctx.fill();ctx.stroke();
    ctx.font=`900 ${p.s*.6}px Cinzel,serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#e6eeff';ctx.fillText('×'+v,p.x,p.y+1)})}
function stoneSlot(i){const s=Math.max(16,ss(T*.38));return{x:sx(-T*.7),y:sy(FH)+ss(T*.2)-i*s*1.25-s*1.2,s}}
