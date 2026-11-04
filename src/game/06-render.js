// ---------- rendering ----------
let bgDirty=1,BG=null,SHK=0,TIME=0;const TXT=[],FXL=[];let BANNER=null;
function fx(o){if(FXL.length>(LQ()?60:160))return;o.t=0;FXL.push(o)}
function floatText(x,y,t,col,s){if(TXT.length>40)TXT.shift();TXT.push({x,y,t,col,s:s||1,life:1.1})}
function banner(t,col){BANNER={t,col,life:2.4}}
function shake(v){SHK=Math.max(SHK,v*(SET.shake??1))}
function fxStar(h){const p=h.c>=0?{x:hx(h.c,h.r),y:hy(h.r)}:null;if(p){fx({k:'star',x:p.x,y:p.y,dur:.9,col:'#ffd76a'});floatText(p.x,p.y-T,'★'.repeat(h.star),'#ffd76a',1.4)}sfx('level',.7)}
const TIERCOL=['','#b8c2cc','#5fd17a','#4aa8ff','#c77dff','#ffcf2e'];
function benchSlot(i){const B=bottomLayout(),n=R.bench.length;return{x:B.cx+(i-(n-1)/2)*B.w,y:B.y,w:B.w}}
function buildBG(){
  const A=ACTS[R?R.act:0];BG=mk(cv.width,cv.height);if(!BG)return;const g=BG.getContext('2d');if(!g||!g.createLinearGradient)return;g.setTransform(DPR,0,0,DPR,0,0);
  const sky=g.createLinearGradient(0,0,0,H);sky.addColorStop(0,A.sky[0]);sky.addColorStop(1,A.sky[1]);g.fillStyle=sky;g.fillRect(0,0,W,H);
  // a raised plateau: dark edge, then hex tiles with a thin gap like a board game
  const x0=sx(-T*.15),x1=sx(FW+T*.15),y0=sy(-T*.15),y1=sy(FH+T*.15);
  g.fillStyle='rgba(0,0,0,.35)';g.fillRect(x0+6,y0+10,x1-x0,y1-y0+ss(T*.22));g.fillStyle=A.edge;g.fillRect(x0,y0,x1-x0,y1-y0);g.fillStyle='rgba(0,0,0,.25)';g.fillRect(x0,y1,x1-x0,ss(T*.22));
  for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){const h=hh(c,r,R?R.seed:0);hexPath(g,c,r,.97);g.fillStyle=A.ground[(c+r*2)%3];g.fill();
    g.fillStyle=`rgba(255,255,255,${.02+(h%7)*.007})`;g.fill();g.strokeStyle='rgba(255,255,255,.07)';g.lineWidth=1;g.stroke()}
  groundDetail(g,R?R.act:0);
  // the entrance lane and the keep courtyard
  g.fillStyle='rgba(30,20,40,.55)';g.fillRect(sx(-T*1.1),sy(hy(SPAWN_ROWS[0])-T*.45),ss(T*1.1),ss(hy(SPAWN_ROWS[SPAWN_ROWS.length-1])-hy(SPAWN_ROWS[0])+T*.9)*VY);
  g.fillStyle='rgba(200,190,160,.35)';g.fillRect(sx(FW-T*.1),sy(hy(KEEP_ROWS[0])-T*.45),ss(T*1),ss(hy(KEEP_ROWS[KEEP_ROWS.length-1])-hy(KEEP_ROWS[0])+T*.9)*VY);
  edgeProps(g,R?R.act:0);
  g.fillStyle=A.fog;g.fillRect(0,0,W,H);
  bgDirty=0}
// a hash so decorations stay put for a run and act
const hh=(a,b,c)=>((a*73856093)^(b*19349663)^(c*83492791))>>>0;
function groundDetail(g,act){const sd=R?R.seed:0;g.save();
  for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){const h=hh(c,r,sd+act*7),x=sx(hx(c,r)-T*.5),y=sy(hy(r)-T*.5),s=ss(T);
    if(act===0){if(h%6===0){g.strokeStyle='rgba(20,24,18,.35)';g.lineWidth=Math.max(1,s*.025);g.beginPath();const x0=x+s*((h>>3)%60)/100+s*.2,y0=y+s*VY*.3;g.moveTo(x0,y0);g.lineTo(x0+s*.12,y0+s*.08);g.lineTo(x0+s*.08,y0+s*.2);g.moveTo(x0+s*.12,y0+s*.08);g.lineTo(x0+s*.26,y0+s*.06);g.stroke()}
      if(h%9===1){g.fillStyle='rgba(230,225,205,.5)';g.save();g.translate(x+s*((h>>4)%70)/100+s*.15,y+s*VY*((h>>6)%60)/100+s*.12);g.rotate((h%10)/3);g.fillRect(-s*.07,-s*.012,s*.14,s*.024);g.beginPath();g.arc(-s*.07,0,s*.022,0,6.283);g.arc(s*.07,0,s*.022,0,6.283);g.fill();g.restore()}
      if(h%5===2){g.fillStyle='rgba(90,120,70,.22)';g.beginPath();g.ellipse(x+s*.5,y+s*VY*.5,s*.35,s*.2*VY+s*.05,0,0,6.283);g.fill()}}
    else if(act===1){if(h%3===0){g.strokeStyle=h%2?'rgba(140,200,90,.55)':'rgba(60,110,40,.5)';g.lineWidth=Math.max(1,s*.022);const bx=x+s*((h>>3)%70)/100+s*.15,by=y+s*VY*((h>>5)%60)/100+s*.25;for(let k=-1;k<=1;k++){g.beginPath();g.moveTo(bx+k*s*.03,by);g.quadraticCurveTo(bx+k*s*.05,by-s*.06,bx+k*s*.09,by-s*.12);g.stroke()}}
      if(h%11===4){const fc=['#ffe36a','#ff8ad0','#ffffff','#8ad0ff'][h%4];g.fillStyle=fc;for(let k=0;k<3;k++){g.beginPath();g.arc(x+s*(.2+((h>>(k*3))%60)/100),y+s*VY*(.2+((h>>(k*4+2))%60)/100),Math.max(1,s*.025),0,6.283);g.fill()}}}
    else{if(h%4===0){g.strokeStyle='rgba(255,110,30,.45)';g.lineWidth=Math.max(1,s*.03);g.shadowColor='#ff6a1a';g.shadowBlur=s*.12;g.beginPath();const x0=x+s*((h>>3)%50)/100+s*.15,y0=y+s*VY*((h>>5)%50)/100+s*.15;g.moveTo(x0,y0);g.lineTo(x0+s*.15,y0+s*.05);g.lineTo(x0+s*.22,y0+s*.16);g.moveTo(x0+s*.15,y0+s*.05);g.lineTo(x0+s*.3,y0);g.stroke();g.shadowBlur=0}
      if(h%7===3){g.fillStyle='rgba(30,20,18,.35)';g.beginPath();g.ellipse(x+s*.5,y+s*VY*.55,s*.3,s*.12,0,0,6.283);g.fill()}}}
  g.restore()}
// props along the far edge of the plateau, drawn once into the background
let EDGE=[];
function edgeProps(g,act){const set=EDGE_SETS[act],sd=R?R.seed:0;EDGE=[];
  for(let i=0;i<COLS+2;i++){const h=hh(i,99,sd+act*13);if(h%3===0)continue;const d=set[h%set.length],x=(i-.5+((h>>4)%40)/100)*T,y=-T*(.28+((h>>7)%20)/100);EDGE.push({x,y,d})}
  EDGE.sort((a,b)=>a.y-b.y);for(const e of EDGE){const s=ss(T*1.25*e.d[2]),f=frame(e.d[0],e.d[0]==='props'?192:160,e.d[1],s*DPR);if(f)g.drawImage(f,sx(e.x)-s/2,sy(e.y)-s*.86,s,s)}}
function drawRoute(){const rt=R.field.route;if(!rt||rt.length<2)return;ctx.save();ctx.strokeStyle=R.phase==='wave'?'rgba(255,240,200,.16)':'rgba(255,240,200,.45)';ctx.lineWidth=Math.max(2,ss(5));ctx.setLineDash([ss(10),ss(12)]);ctx.lineDashOffset=-TIME*ss(40);ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(sx(-T*.6),sy(hy(rt[0][1])));for(const [c,r] of rt)ctx.lineTo(sx(hx(c,r)),sy(hy(r)));ctx.lineTo(sx(FW+T*.5),sy(hy(rt[rt.length-1][1])));ctx.stroke();ctx.restore();
}
function drawRunes(){
  for(const q of R.field.runes){const x=sx(hx(q.c,q.r)),y=sy(hy(q.r)),s=ss(T),f=q.flash>0?q.flash/.3:0;if(q.flash>0)q.flash-=FRAME_DT;const v=runeMul(q);
    ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.55+.25*Math.sin(TIME*3+q.c)+f*.5;const gl=glow('120,170,255');if(gl)ctx.drawImage(gl,x-s*.8,y-s*.55,s*1.6,s*1.1);ctx.restore();
    ctx.strokeStyle=f?'#ffffff':'#9cc4ff';ctx.lineWidth=Math.max(1.5,ss(2.5));ctx.beginPath();ctx.ellipse(x,y,s*.38,s*.38*VY,0,0,6.283);ctx.stroke();
    ctx.save();ctx.translate(x,y);ctx.scale(1,VY);ctx.rotate(TIME*.6+q.ph);ctx.strokeStyle='rgba(190,215,255,.85)';ctx.lineWidth=Math.max(1,ss(1.6));for(let i=0;i<6;i++){ctx.rotate(1.047);ctx.beginPath();ctx.moveTo(s*.2,0);ctx.lineTo(s*.32,0);ctx.stroke()}ctx.restore();
    ctx.font=`900 ${Math.max(12,ss(19))}px Cinzel,serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineWidth=3;ctx.strokeStyle='#0a1430';ctx.strokeText('×'+v,x,y);ctx.fillStyle=f?'#ffffff':'#d8e6ff';ctx.fillText('×'+v,x,y)}}
function drawPortals(){
  for(const q of R.field.portals){const x=sx(hx(q.c,q.r)),y=sy(hy(q.r)),s=ss(T),f=q.flash>0?q.flash/.4:0;if(q.flash>0)q.flash-=FRAME_DT;
    ctx.save();ctx.translate(x,y);ctx.scale(1,VY);for(let i=0;i<3;i++){ctx.rotate(TIME*(1.4+i*.4));ctx.strokeStyle=`rgba(${190-i*30},${110+i*20},255,${.75-i*.15})`;ctx.lineWidth=Math.max(1.5,ss(3-i*.6));ctx.beginPath();ctx.arc(0,0,s*(.38-i*.08),0,4.4);ctx.stroke()}
    ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.6+f*.4;const gl=glow('170,90,255');if(gl)ctx.drawImage(gl,-s*.5,-s*.5,s,s);ctx.restore();
    ctx.font=`900 ${Math.max(11,ss(16))}px Cinzel,serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineWidth=3;ctx.strokeStyle='#1a0830';ctx.strokeText('×'+portalMul(q),x,y-s*.42);ctx.fillStyle='#e6c8ff';ctx.fillText('×'+portalMul(q),x,y-s*.42)}}
function drawSpawnAndKeep(){
  const y=sy((hy(SPAWN_ROWS[0])+hy(SPAWN_ROWS[SPAWN_ROWS.length-1]))/2),x=sx(-T*.55),s=ss(T);ctx.save();ctx.translate(x,y);
  const gr=ctx.createRadialGradient(0,0,0,0,0,s*.9);gr.addColorStop(0,'rgba(10,0,20,.95)');gr.addColorStop(.6,'rgba(80,20,120,.75)');gr.addColorStop(1,'rgba(120,40,200,0)');ctx.fillStyle=gr;ctx.beginPath();ctx.ellipse(0,0,s*.55,s*1.05,0,0,6.283);ctx.fill();
  ctx.strokeStyle='rgba(200,120,255,.8)';ctx.lineWidth=2;for(let i=0;i<3;i++){ctx.beginPath();ctx.ellipse(0,0,s*(.42+.06*Math.sin(TIME*3+i*2)),s*(.95+.05*Math.sin(TIME*2+i)),0,0,6.283);ctx.stroke()}ctx.restore();
  const sk=SKINS.find(q=>q.id===SET.skin)||SKINS[0],k=sheet(sk.sh)||sheet('keep');const kx=sx(FW+T*.62),ky=sy((hy(KEEP_ROWS[0])+hy(KEEP_ROWS[KEEP_ROWS.length-1]))/2)+ss(T*.5),ks=ss(T*3.1);
  ctx.fillStyle='rgba(0,0,0,.3)';ctx.beginPath();ctx.ellipse(kx,ky,ks*.3,ks*.09,0,0,6.283);ctx.fill();
  if(k)ctx.drawImage(k,kx-ks/2,ky-ks*.86,ks,ks);else{ctx.fillStyle='#8a90a0';ctx.fillRect(kx-ks*.2,ky-ks*.6,ks*.4,ks*.6)}
  // keep health under the castle
  const bw=ss(T*1.5),bx=kx-bw/2,by=ky+ss(8),p=clamp(R.hp/R.hpMax,0,1);ctx.fillStyle='rgba(0,0,0,.7)';ctx.fillRect(bx-1,by-1,bw+2,ss(9)+2);ctx.fillStyle=p>.5?'#6ad06a':p>.25?'#ffc04a':'#ff4a4a';ctx.fillRect(bx,by,bw*p,ss(9));
  ctx.font=`800 ${Math.max(10,ss(12))}px "Barlow Condensed",sans-serif`;ctx.textAlign='center';ctx.textBaseline='top';ctx.fillStyle='#fff';ctx.fillText(Math.ceil(R.hp)+' / '+R.hpMax,kx,by+ss(10))}
// a stone plinth under every fielded hero: the hex is raised, with its front faces showing
const PLAT=['#8a8070','#6f8a5a','#8a5a48'],PLATD=['#4e463c','#3e5232','#4e2e24'];
function drawPlatform(h){const lift=ss(T*.17),c=h.c,r=h.r,x=hx(c,r),y=hy(r),R_=HR*.93,pts=[];for(let i=0;i<6;i++){const a=(-90+60*i)*Math.PI/180;pts.push([sx(x+Math.cos(a)*R_),sy(y+Math.sin(a)*R_)])}
  // front faces: the edges between vertices 1-2, 2-3 and 3-4 (right-lower, bottom, left-lower)
  const col=TRAITS[HEROES[h.k].tr[0]].col,dark=PLATD[R.act]||PLATD[0];ctx.save();ctx.fillStyle='rgba(0,0,0,.28)';ctx.beginPath();ctx.ellipse(sx(x),sy(y)+ss(T*.06),ss(R_*1.05),ss(R_*1.05)*VY,0,0,6.283);ctx.fill();
  for(const [a,b,sh] of [[1,2,.75],[2,3,.6],[3,4,.75]]){ctx.fillStyle=dark;ctx.beginPath();ctx.moveTo(pts[a][0],pts[a][1]-lift);ctx.lineTo(pts[b][0],pts[b][1]-lift);ctx.lineTo(pts[b][0],pts[b][1]);ctx.lineTo(pts[a][0],pts[a][1]);ctx.closePath();ctx.fill();ctx.fillStyle=`rgba(0,0,0,${1-sh})`;ctx.fill()}
  ctx.beginPath();pts.forEach(([px,py],i)=>i?ctx.lineTo(px,py-lift):ctx.moveTo(px,py-lift));ctx.closePath();const gr=ctx.createLinearGradient(0,sy(y-R_)-lift,0,sy(y+R_)-lift);gr.addColorStop(0,'#c8bca4');gr.addColorStop(1,PLAT[R.act]||PLAT[0]);ctx.fillStyle=gr;ctx.fill();
  ctx.strokeStyle=hexA(col,.85);ctx.lineWidth=Math.max(1.5,ss(2.2));ctx.stroke();ctx.strokeStyle='rgba(255,255,255,.25)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(pts[4][0],pts[4][1]-lift);ctx.lineTo(pts[5][0],pts[5][1]-lift);ctx.lineTo(pts[0][0],pts[0][1]-lift);ctx.stroke();
  // veteran chevrons carved into the front of the plinth
  if(h.vet){ctx.fillStyle='#ffb04a';ctx.font=`900 ${Math.max(8,lift*.95)}px sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('❯'.repeat(h.vet),pts[3][0],pts[3][1]-lift*.45)}ctx.restore();return lift}
const OBS_SCALE=[1.25,1.2,.95,.75,.85,.7];
function heroFrame(h){const busy=h.atk>0&&R.phase==='wave';if(busy){const p=1-h.atk/.42;return 4+clamp((p*6)|0,0,5)}return((TIME*5+h.uid)|0)%4}
function drawHeroAt(h,x,y,size,ghost,live){
  const f=frame('h_'+h.k,160,live&&h.ko?0:heroFrame(h),size*DPR);
  if(live&&h.ko){ctx.save();ctx.globalAlpha=.55;ctx.fillStyle='rgba(0,0,0,.28)';ctx.beginPath();ctx.ellipse(x,y,size*.22,size*.07,0,0,6.283);ctx.fill();if(f){ctx.translate(x,y);ctx.rotate((h.face<0?-1:1)*1.3);ctx.drawImage(f,-size/2,-size*.75,size,size)}ctx.restore();
    ctx.font=`900 ${Math.max(10,size*.2)}px sans-serif`;ctx.textAlign='center';ctx.fillStyle='#ffb0a0';ctx.fillText('✖',x,y-size*.35);return}
  ctx.fillStyle='rgba(0,0,0,.28)';ctx.beginPath();ctx.ellipse(x,y,size*.22,size*.07,0,0,6.283);ctx.fill();
  if(h.star>1){ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=h.star===3?.7:.4;const gl=glow(h.star===3?'255,200,60':'150,200,255');if(gl)ctx.drawImage(gl,x-size*.45,y-size*.75,size*.9,size*.9);ctx.restore()}
  if(ghost)ctx.globalAlpha=.6;
  if(f){ctx.save();ctx.translate(x,y);if(h.face<0)ctx.scale(-1,1);ctx.drawImage(f,-size/2,-size*.86,size,size);if(live&&h.hurtT>0&&!LQ()){ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.4;ctx.drawImage(f,-size/2,-size*.86,size,size)}ctx.restore();
    if(live&&(h.hurtT>0||h.chillT>0)){ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=h.hurtT>0?.6:.35;const gl=glow(h.hurtT>0?'255,60,40':'120,200,255');if(gl)ctx.drawImage(gl,x-size*.32,y-size*.7,size*.64,size*.64);ctx.restore()}}
  else{ctx.fillStyle=TIERCOL[HEROES[h.k].c];ctx.beginPath();ctx.arc(x,y-size*.35,size*.22,0,6.283);ctx.fill()}
  ctx.globalAlpha=1;
  // stars, cost colour
  const st='★'.repeat(h.star),fs=Math.max(9,size*.16);ctx.font=`900 ${fs}px sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineWidth=3;ctx.strokeStyle='rgba(0,0,0,.85)';ctx.strokeText(st,x,y+fs*.55);ctx.fillStyle=h.star===3?'#ffd76a':h.star===2?'#cfe6ff':TIERCOL[HEROES[h.k].c];ctx.fillText(st,x,y+fs*.55)}
function drawMon(m){
  const D=MON[m.k],x=sx(m.x),fly=m.fly?ss(T*.55)+Math.sin(m.wob)*ss(4):0,y=sy(m.y),size=ss(T*1.25*(m.sz||D.sz))*(m.boss?1.15:1);
  ctx.fillStyle='rgba(0,0,0,.3)';ctx.beginPath();ctx.ellipse(x,y,size*.22,size*.07,0,0,6.283);ctx.fill();
  if(m.elite||m.boss){ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.55+.2*Math.sin(TIME*6);const gl=glow(m.boss?'255,80,60':'255,200,60');if(gl)ctx.drawImage(gl,x-size*.5,y-size*.4-fly,size,size*.6);ctx.restore()}
  if(m.slowT>0&&m.slowP<1){ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.35;const gl=glow('120,200,255');if(gl)ctx.drawImage(gl,x-size*.35,y-size*.7-fly,size*.7,size*.7);ctx.restore()}
  const fi=((m.wob*1.1)|0)%6,f=frame('m_'+m.k,160,(m.stunT>0||m.rootT>0)?0:fi,size*DPR);if(m.lunge>0)m.lunge-=FRAME_DT;const lg=m.lunge>0?Math.sin(m.lunge/.25*Math.PI)*size*.12*(m.face||1):0;
  if(f){ctx.save();ctx.translate(x+lg,y-fly);if(m.face<0)ctx.scale(-1,1);ctx.drawImage(f,-size/2,-size*.86,size,size);if(m.hitT>0&&!LQ()){ctx.globalCompositeOperation='lighter';ctx.globalAlpha=m.hitT*3;ctx.drawImage(f,-size/2,-size*.86,size,size)}ctx.restore()}
  else{ctx.fillStyle='#c8c0b0';ctx.beginPath();ctx.arc(x,y-size*.3-fly,size*.22,0,6.283);ctx.fill()}
  if(m.rootT>0){ctx.strokeStyle='#6ad04a';ctx.lineWidth=Math.max(1.5,ss(2.5));for(let i=0;i<4;i++){const a=i*1.57+TIME;ctx.beginPath();ctx.moveTo(x+Math.cos(a)*size*.2,y);ctx.quadraticCurveTo(x+Math.cos(a)*size*.25,y-size*.25,x+Math.cos(a+.6)*size*.12,y-size*.4);ctx.stroke()}}
  if(m.stunT>0){ctx.fillStyle='#ffe066';for(let i=0;i<3;i++){const a=TIME*5+i*2.09;ctx.beginPath();ctx.arc(x+Math.cos(a)*size*.2,y-size*.85-fly+Math.sin(a)*size*.05,Math.max(1.5,size*.04),0,6.283);ctx.fill()}}
  if(m.psn&&m.psn.n>0){const n=m.psn.n,px=x+size*.24,py=y-size*.62-fly;ctx.fillStyle='#4a7a1a';ctx.beginPath();ctx.arc(px,py,Math.max(5,size*.08),0,6.283);ctx.fill();ctx.font=`900 ${Math.max(8,size*.1)}px "Barlow Condensed",sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#d8ff8a';ctx.fillText(n,px,py+.5)}
  if(m.dots.length){ctx.fillStyle='rgba(180,255,90,.8)';const ph=(TIME*1.5+m.id*.3)%1;ctx.globalAlpha=1-ph;ctx.beginPath();ctx.arc(x+size*.12,y-size*(.5+ph*.4)-fly,Math.max(1.5,size*.05),0,6.283);ctx.fill();ctx.globalAlpha=1}
  if(m.hp<m.max||m.boss||m.elite){const bw=size*(m.boss?.9:.55),by=y-size*.92-fly,p=clamp(m.hp/m.max,0,1);ctx.fillStyle='rgba(0,0,0,.75)';ctx.fillRect(x-bw/2-1,by-1,bw+2,Math.max(3,size*.05)+2);ctx.fillStyle=m.boss?'#ff5a4a':m.elite?'#ffcf2e':'#e8473f';ctx.fillRect(x-bw/2,by,bw*p,Math.max(3,size*.05));
    if(m.sh>0){ctx.fillStyle='rgba(235,245,255,.9)';ctx.fillRect(x-bw/2,by-Math.max(2,size*.03)-1,bw*clamp(m.sh/(m.max*.35),0,1),Math.max(2,size*.03))}
    if(m.boss){ctx.font=`700 ${Math.max(10,ss(12))}px Cinzel,serif`;ctx.textAlign='center';ctx.textBaseline='bottom';ctx.fillStyle='#fff';ctx.fillText(MON[m.k].n,x,by-2)}
    else if(m.aff){const A=AFFIX[m.aff];ctx.font=`800 ${Math.max(9,ss(11))}px "Barlow Condensed",sans-serif`;ctx.textAlign='center';ctx.textBaseline='bottom';ctx.lineWidth=3;ctx.strokeStyle='rgba(0,0,0,.85)';ctx.strokeText(A.n,x,by-3);ctx.fillStyle=A.col;ctx.fillText(A.n,x,by-3)}}
}
function drawProj(q){const x=sx(q.x),y=sy(q.y)-ss(T*.35),big=q.mult>1,s=ss(T)*(big?1.25:1);
  const a=Math.atan2((q.ty-q.y)*VY,q.tx-q.x);
  if(big){ctx.save();ctx.globalCompositeOperation='lighter';const gl=glow('170,140,255');if(gl)ctx.drawImage(gl,x-s*.3,y-s*.3,s*.6,s*.6);ctx.restore()}
  if(q.kind==='arrow'||q.kind==='bolt'){ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.strokeStyle=q.kind==='bolt'?'#d8d0c0':'#e8d4a8';ctx.lineWidth=Math.max(1.5,ss(2.2));ctx.beginPath();ctx.moveTo(-s*.22,0);ctx.lineTo(s*.12,0);ctx.stroke();ctx.fillStyle='#e8eef5';ctx.beginPath();ctx.moveTo(s*.18,0);ctx.lineTo(s*.08,-s*.05);ctx.lineTo(s*.08,s*.05);ctx.fill();ctx.restore();return}
  if(q.kind==='star'){ctx.save();ctx.translate(x,y);ctx.rotate(TIME*20);ctx.fillStyle='#dfe6ee';ctx.beginPath();for(let i=0;i<8;i++){const r=i%2?s*.04:s*.11;ctx.lineTo(Math.cos(i*.785)*r,Math.sin(i*.785)*r)}ctx.fill();ctx.restore();return}
  if(q.kind==='flask'){ctx.save();ctx.translate(x,y-Math.sin(clamp(1-Math.hypot(q.tx-q.x,q.ty-q.y)/(T*3),0,1)*Math.PI)*s*.3);ctx.rotate(TIME*12);ctx.fillStyle='#8ad04a';ctx.strokeStyle='#1a2a0a';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,s*.02,s*.07,0,6.283);ctx.fill();ctx.stroke();ctx.fillStyle='#d8c8a0';ctx.fillRect(-s*.025,-s*.09,s*.05,s*.05);ctx.restore();return}
  const col=q.kind==='fire'?'255,120,40':q.kind==='ice'?'150,220,255':q.kind==='holy'?'255,230,140':q.src&&HEROES[q.src.k].tr.includes('shadow')?'190,120,255':'110,200,255';
  ctx.save();ctx.globalCompositeOperation='lighter';const gl=glow(col);if(gl)ctx.drawImage(gl,x-s*.25,y-s*.25,s*.5,s*.5);ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x,y,s*.05,0,6.283);ctx.fill();ctx.restore()}
function drawFx(dt){
  for(const f of FXL){f.t+=dt;const p=Math.min(1,f.t/f.dur),x=sx(f.x),y=sy(f.y),a=1-p;
    if(f.k==='mslash'){ctx.save();ctx.translate(x,y-ss(T*.35));ctx.scale(-(f.face||1),1);ctx.globalAlpha=a;ctx.strokeStyle='#ff5a4a';ctx.lineWidth=Math.max(2,ss(4));ctx.lineCap='round';for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(-ss(T*.18)+i*ss(7),-ss(T*.2));ctx.lineTo(ss(T*.06)+i*ss(7),ss(T*.12));ctx.stroke()}ctx.restore()}
    else if(f.k==='mbolt'){const q=p,bx=lerp(f.x,f.x1,q),by=lerp(f.y,f.y1,q);ctx.save();ctx.globalCompositeOperation='lighter';const gl=glow(f.col==='#8ad8ff'?'140,210,255':f.col==='#b8ffd8'?'160,255,200':'190,110,255');if(gl)ctx.drawImage(gl,sx(bx)-ss(T*.3),sy(by)-ss(T*.65),ss(T*.6),ss(T*.6));ctx.restore()}
    else if(f.k==='ring'||f.k==='nova'||f.k==='hex'||f.k==='fire'||f.k==='roots'||f.k==='ice'||f.k==='poison'){const r=ss(f.r)*(f.k==='ring'?.6+.4*p:.85+.15*p);ctx.save();ctx.globalAlpha=a*(f.k==='ring'?.9:.55);
      if(f.k!=='ring'){ctx.fillStyle=f.k==='fire'?'rgba(255,110,40,.6)':f.k==='hex'?'rgba(150,80,220,.55)':f.k==='roots'?'rgba(90,200,60,.5)':f.k==='ice'?'rgba(170,225,255,.55)':f.k==='poison'?'rgba(140,210,60,.5)':hexA(f.col,.4);ctx.beginPath();ctx.ellipse(x,y,r,r*VY,0,0,6.283);ctx.fill()}
      ctx.strokeStyle=f.col;ctx.lineWidth=Math.max(2,ss(4)*a);ctx.beginPath();ctx.ellipse(x,y,r,r*VY,0,0,6.283);ctx.stroke();ctx.restore();if(f.k!=='ring'&&!LQ())spellFx(f,x,y,ss(f.r),p,a)}
    else if(f.k==='corpse')drawCorpse(f,x,y,p,a);
    else if(f.k==='die'){ctx.save();ctx.globalAlpha=a;for(let i=0;i<6;i++){const an=i*1.05,d=ss(f.r)*p;ctx.fillStyle=f.col;ctx.beginPath();ctx.arc(x+Math.cos(an)*d,y-ss(T*.3)+Math.sin(an)*d*VY-ss(10)*p,Math.max(1.5,ss(4)*a),0,6.283);ctx.fill()}ctx.restore();dspr('smoke_04','#5a5048',x,y-ss(T*.3),ss(f.r*2)*(.6+p),ss(f.r*2)*(.6+p),f.x,a*.5)}
    else if(f.k==='slash'&&FXOK()&&dspr('slash_02',f.col==='#ffffff'?'#fff4d8':f.col,x,y-ss(T*.32),ss(T*(f.big?1.3:.85)),ss(T*(f.big?1.3:.85)),(f.face<0?Math.PI:0)+p*.9-.4,a,1)){}
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
  if(R.b)for(const z of R.b.zones){const x=sx(z.x),y=sy(z.y),r=ss(z.r),a=Math.min(1,z.t);ctx.save();ctx.globalAlpha=.32*a;ctx.fillStyle='#7ac03a';ctx.beginPath();ctx.ellipse(x,y,r,r*VY,0,0,6.283);ctx.fill();ctx.globalAlpha=.6*a;ctx.strokeStyle='#b8f06a';ctx.lineWidth=1.5;ctx.setLineDash([5,6]);ctx.lineDashOffset=TIME*12;ctx.stroke();ctx.setLineDash([]);
    if(!LQ())for(let i=0;i<5;i++){const ph=(TIME*.7+i*.2)%1,an=i*1.26+z.x;ctx.globalAlpha=a*(1-ph)*.8;ctx.fillStyle='#c8ff7a';ctx.beginPath();ctx.arc(x+Math.cos(an)*r*.55,y+Math.sin(an)*r*.55*VY-ph*ss(T*.5),Math.max(1.5,ss(3.5)),0,6.283);ctx.fill()}ctx.restore()}
  drawPlacement();
  // everything that stands on the field, back to front
  const list=[];for(const o of R.field.obs)list.push({y:hy(o.r),o});for(const h of R.board)if(!(DRAG&&DRAG.h===h))list.push({y:hy(h.r),h});if(R.b)for(const m of R.b.mons)if(m.hp>0)list.push({y:m.y+(m.fly?T*2:0),m});
  list.sort((a,b)=>a.y-b.y);
  for(const it of list){if(it.o){const o=it.o,d=(OBS_SETS[o.a??R.act]||OBS_SETS[0])[o.k%6],x=sx(hx(o.c,o.r)),y=sy(hy(o.r))+ss(T*.12),s=ss(T*1.35*d[2]);ctx.fillStyle='rgba(0,0,0,.25)';ctx.beginPath();ctx.ellipse(x,y,s*.32,s*.1,0,0,6.283);ctx.fill();const f=frame(d[0],d[0]==='props'?192:160,d[1],s*DPR);if(f)ctx.drawImage(f,x-s/2,y-s*.86,s,s);else{ctx.fillStyle='#6a6a60';ctx.fillRect(x-s*.2,y-s*.4,s*.4,s*.4)}
      if(d[0]==='props2'&&d[1]===11){ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.5+.2*Math.sin(TIME*7+o.c);const gl=glow('255,140,40');if(gl)ctx.drawImage(gl,x-s*.35,y-s*.75,s*.7,s*.6);ctx.restore()}}
    else if(it.h){const h=it.h,x=sx(hx(h.c,h.r)),lift=drawPlatform(h),yb=sy(hy(h.r))-lift;if(h.tauntT>0&&R.phase==='wave'){ctx.strokeStyle=`rgba(255,90,58,${.4+.3*Math.sin(TIME*8)})`;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,yb,ss(T*.42),ss(T*.42)*VY,0,0,6.283);ctx.stroke()}
      drawHeroAt(h,x,yb+ss(T*.12),ss(T*1.45*(HEROES[h.k].sz||1)),0,R.phase==='wave');drawHeroItems(h,x,yb+ss(T*.36),ss(T*1.45));
      if(R.phase==='wave'&&!h.ko){const D=HEROES[h.k],y=yb-ss(T*1.18),bw=ss(T*.6),bh=Math.max(2,ss(4));ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillRect(x-bw/2-1,y-bh-2,bw+2,bh*2+3);
        if(h.hpMax){const p=clamp(h.hp/h.hpMax,0,1);ctx.fillStyle=h.hurtT>0?'#ffffff':p>.5?'#5fd16a':p>.25?'#ffc04a':'#ff4a4a';ctx.fillRect(x-bw/2,y-bh-1,bw*p,bh)}
        ctx.fillStyle='#4ab8ff';ctx.fillRect(x-bw/2,y+1,bw*clamp(h.mana/D.mana,0,1),bh)}}
    else drawMon(it.m)}
  drawSpawnAndKeep();
  if(R.b)for(const q of R.b.projs)drawProj(q);
  drawFx(dt);drawBench();
  // floating text
  ctx.textAlign='center';ctx.textBaseline='middle';for(const t of TXT){t.life-=dt;const a=clamp(t.life*2,0,1),fs=Math.max(11,ss(15))*t.s*(t.life>1?1.2:1);ctx.globalAlpha=a;ctx.font=`800 ${fs}px "Barlow Condensed",sans-serif`;ctx.lineWidth=3;ctx.strokeStyle='rgba(0,0,0,.85)';const y=sy(t.y)-ss(T*.4)-(1.1-t.life)*ss(26);ctx.strokeText(t.t,sx(t.x),y);ctx.fillStyle=t.col;ctx.fillText(t.t,sx(t.x),y)}ctx.globalAlpha=1;for(let i=TXT.length-1;i>=0;i--)if(TXT[i].life<=0)TXT.splice(i,1);
  if(BANNER){BANNER.life-=dt;const a=clamp(BANNER.life,0,1),fs=Math.min(W/16,42);ctx.globalAlpha=a;ctx.font=`900 ${fs}px Cinzel,serif`;ctx.lineWidth=6;ctx.strokeStyle='rgba(0,0,0,.8)';ctx.strokeText(BANNER.t,W/2+Math.min(0,0),sy(FH*.25));ctx.fillStyle=BANNER.col;ctx.fillText(BANNER.t,W/2,sy(FH*.25));ctx.globalAlpha=1;if(BANNER.life<=0)BANNER=null}
  drawTutHand();drawDrag();ctx.restore()}
function drawBench(){
  const n=R.bench.length;if(ZM.z>1){const a=benchSlot(0),b=benchSlot(n-1);ctx.fillStyle='rgba(15,10,7,.78)';ctx.fillRect(a.x-a.w*.6,a.y-a.w*.42,b.x-a.x+a.w*1.2,a.w*.82)}for(let i=0;i<n;i++){const b=benchSlot(i),h=R.bench[i];ctx.fillStyle=DRAG&&DRAG.overBench===i?'rgba(255,215,106,.25)':'rgba(0,0,0,.32)';ctx.strokeStyle='rgba(255,230,180,.25)';ctx.lineWidth=1;
    const w=b.w*.92,hh=b.w*.66;ctx.beginPath();ctx.roundRect?ctx.roundRect(b.x-w/2,b.y-hh*.55,w,hh,6):ctx.rect(b.x-w/2,b.y-hh*.55,w,hh);ctx.fill();ctx.stroke();
    if(h&&!(DRAG&&DRAG.h===h)){drawHeroAt(h,b.x,b.y+hh*.3,b.w*1.05);drawHeroItems(h,b.x,b.y-hh*.42,b.w*1.05)}}
  drawItems();
  // rune stones waiting to be placed
  drawRuneRack();R.stones.forEach((v,i)=>{if(i>3)return;if(DRAG&&DRAG.stone===i)return;const p=stoneSlot(i);ctx.save();ctx.globalCompositeOperation='lighter';const gl=glow('120,170,255');if(gl)ctx.drawImage(gl,p.x-p.s,p.y-p.s,p.s*2,p.s*2);ctx.restore();ctx.fillStyle='#2a3a6a';ctx.strokeStyle='#9cc4ff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y,p.s*.55,0,6.283);ctx.fill();ctx.stroke();
    ctx.font=`900 ${p.s*.6}px Cinzel,serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#e6eeff';ctx.fillText('×'+v,p.x,p.y+1)})}
function stoneSlot(i){const B=bottomLayout(),col=i%2,row=((i/2)|0)%2;return{x:B.Rr-B.runeW+B.s*.56+col*B.s*1.12,y:B.y-B.s*.56+row*B.s*1.12,s:B.s*.95}}
function drawRuneRack(){const B=bottomLayout(),s=B.s,x0=B.Rr-B.runeW,y0=B.y-s*1.18;ctx.save();ctx.fillStyle='rgba(12,16,30,.7)';ctx.strokeStyle=R.stones.length?`rgba(156,196,255,${.5+.3*Math.sin(TIME*4)})`:'rgba(156,196,255,.25)';ctx.lineWidth=R.stones.length?2:1.2;
  ctx.beginPath();ctx.roundRect?ctx.roundRect(x0,y0,B.runeW,s*2.24,8):ctx.rect(x0,y0,B.runeW,s*2.24);ctx.fill();ctx.stroke();ctx.font=`800 ${Math.max(9,s*.34)}px "Barlow Condensed",sans-serif`;ctx.textAlign='left';ctx.textBaseline='bottom';ctx.fillStyle='#9cc4ff';ctx.fillText('RUNES',x0+2,y0-2);
  if(!R.stones.length){ctx.fillStyle='rgba(156,196,255,.3)';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`700 ${Math.max(8,s*.28)}px "Barlow Condensed",sans-serif`;ctx.fillText('none',x0+B.runeW/2,y0+s*1.12)}ctx.restore()}

const FXOK=()=>ATOK>0;
// sprite particles that make each spell type look different
function spellFx(f,x,y,r,p,a){if(!FXOK())return;const n=f.k==='nova'?6:8,seed=(f.x*7+f.y*3)|0;
  for(let i=0;i<n;i++){const an=i/n*6.283+seed,d=r*(.25+.6*((i*37+seed)%10)/10),px=x+Math.cos(an)*d,py=y+Math.sin(an)*d*VY;
    if(f.k==='fire'){const h=r*.5*(1-p*.4);dspr(i%2?'fire_01':'flame_02','#ff8a2a',px,py-h*.45-p*r*.25,h*.8,h,0,a,1)}
    else if(f.k==='roots'){ctx.save();ctx.globalAlpha=a;ctx.strokeStyle=i%2?'#5aa83a':'#8ad05a';ctx.lineWidth=Math.max(2,r*.05);ctx.lineCap='round';const g=Math.min(1,p*3)*r*.35;ctx.beginPath();ctx.moveTo(px,py);ctx.quadraticCurveTo(px+Math.cos(an*3)*g*.5,py-g*.6,px+Math.cos(an)*g*.3,py-g);ctx.stroke();ctx.restore()}
    else if(f.k==='hex'){dspr('twirl_01','#b070ff',px,py-r*.15,r*.45,r*.45,TIME*4+i,a*.8,1)}
    else if(f.k==='ice'){ctx.save();ctx.globalAlpha=a;ctx.fillStyle=i%2?'#e8f8ff':'#9ad8ff';ctx.strokeStyle='#4a8ab8';ctx.lineWidth=1;const hgt=r*.32*Math.min(1,p*4);ctx.beginPath();ctx.moveTo(px-r*.06,py);ctx.lineTo(px,py-hgt);ctx.lineTo(px+r*.06,py);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore()}
    else if(f.k==='poison'){dspr(i%2?'smoke_04':'circle_05','#9ad04a',px,py-r*.15-p*r*.25,r*.4,r*.4,TIME+i,a*.7,0)}
    else{dspr(i%2?'star_06':'spark_05',f.col,px,py-r*.2-p*r*.3,r*.3,r*.3,TIME*3+i,a,1)}}
  if(f.k==='hex'||f.k==='nova')dspr('circle_05',f.col,x,y,r*2.2*(.6+.4*p),r*2.2*(.6+.4*p)*VY,0,a*.8,1)}
// a monster's last moment: it tips over, sinks and fades
function drawCorpse(f,x,y,p,a){const size=ss(T*1.25*(f.sz||1))*(f.boss?1.15:1),fr=frame('m_'+f.mk,160,0,size*DPR);if(!fr)return;const fly=f.fly?ss(T*.55)*(1-p):0;
  ctx.save();ctx.globalAlpha=a*a;ctx.translate(x,y-fly+p*size*.12);ctx.rotate((f.face<0?-1:1)*Math.min(1,p*2.2)*1.25);if(f.face<0)ctx.scale(-1,1);ctx.drawImage(fr,-size/2,-size*.86,size,size);ctx.restore()}
