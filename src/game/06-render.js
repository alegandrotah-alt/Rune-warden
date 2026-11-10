// ---------- rendering ----------
let bgDirty=1,BG=null,SHK=0,TIME=0;const TXT=[],FXL=[];let BANNER=null;
function fx(o){if(FXL.length>(LQ()?60:160))return;o.t=0;FXL.push(o)}
function floatText(x,y,t,col,s){if(TXT.length>40)TXT.shift();TXT.push({x,y,t,col,s:s||1,life:1.1})}
function banner(t,col){BANNER={t,col,life:2.4}}
function shake(v){SHK=Math.max(SHK,v*(SET.shake??1))}
function fxStar(h){const p=h.c>=0?{x:hx(h.c,h.r),y:hy(h.r)}:null;if(p){fx({k:'star',x:p.x,y:p.y,dur:.9,col:'#ffd76a'});floatText(p.x,p.y-T,'★'.repeat(h.star),'#ffd76a',1.4)}sfx('level',.7)}
const TIERCOL=['','#b8c2cc','#5fd17a','#4aa8ff','#c77dff','#ffcf2e'];
function benchSlot(i){const B=bottomLayout(),n=R.bench.length;return{x:B.cx+(i-(n-1)/2)*B.w,y:B.y,w:B.w}}
let BGN=0;
function buildBG(){BGN++;
  const A=actD(R?R.act:0),bk=R?(A.obs??R.act):0;BG=mk(cv.width,cv.height);if(!BG)return;const g=BG.getContext('2d');if(!g||!g.createLinearGradient)return;const BM=[DPR,0,0,DPR,0,0];upr(g,BM);
  const sky=g.createLinearGradient(0,0,0,H);sky.addColorStop(0,A.sky[0]);sky.addColorStop(1,A.sky[1]);g.fillStyle=sky;g.fillRect(0,0,W,H);
  backdrop(g,A,bk);
  // a raised plateau with a cliff face below it, then hex tiles with a bevel like carved stone
  const FBx=fieldBox(T*.15),x0=FBx.l,x1=FBx.r,y0=FBx.t,y1=FBx.b,cliff=ss(T*.55);
  g.fillStyle='rgba(0,0,0,.4)';g.beginPath();g.ellipse((x0+x1)/2,y1+cliff*.9,(x1-x0)*.56,cliff*.9,0,0,6.283);g.fill();
  const cg=g.createLinearGradient(0,y1,0,y1+cliff);cg.addColorStop(0,A.edge);cg.addColorStop(1,'rgba(0,0,0,.85)');g.fillStyle=cg;g.beginPath();g.moveTo(x0,y1);g.lineTo(x1,y1);
  for(let i=0;i<=24;i++){const t=i/24,x=x1-(x1-x0)*t,h=hh(i,7,bk);g.lineTo(x,y1+cliff*(.55+((h%40)/100)))}g.closePath();g.fill();
  g.strokeStyle='rgba(0,0,0,.25)';g.lineWidth=1;for(let k=1;k<3;k++){g.beginPath();g.moveTo(x0,y1+cliff*k*.18);g.lineTo(x1,y1+cliff*k*.18);g.stroke()}
  g.fillStyle=A.edge;g.fillRect(x0,y0,x1-x0,y1-y0);const eg=g.createLinearGradient(0,y0,0,y1);eg.addColorStop(0,'rgba(255,255,255,.08)');eg.addColorStop(1,'rgba(0,0,0,.2)');g.fillStyle=eg;g.fillRect(x0,y0,x1-x0,y1-y0);
  gnd(g,BM);const sd=R?R.seed:0,lx=sx(FW*.35),ly=sy(FH*.2);
  for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){const h=hh(c,r,sd),cx=sx(hx(c,r)),cy=sy(hy(r)),s=ss(T);
    hexPath(g,c,r,.965);const tg=g.createLinearGradient(cx-s*.3,cy-s*.4,cx+s*.3,cy+s*.4);const base=A.ground[(c+r*2+(h%2))%3];tg.addColorStop(0,base);tg.addColorStop(1,shade(base,-.12));g.fillStyle=tg;g.fill();
    // light falls from the upper left: a soft pool of light across the board
    const d=Math.hypot(cx-lx,(cy-ly)*1.6)/ss(FW);g.fillStyle=`rgba(255,244,214,${Math.max(0,.1-d*.12)+(h%7)*.006})`;g.fill();
    // speckles so the tiles read as stone, earth or snow rather than flat colour
    if(!LQ())for(let k=0;k<5;k++){const hk=hh(c*7+k,r*3,sd+k),px=cx+((hk%100)/100-.5)*s*.7,py=cy+(((hk>>7)%100)/100-.5)*s*.5*VY;g.fillStyle=k%2?'rgba(0,0,0,.07)':'rgba(255,255,255,.06)';g.beginPath();g.arc(px,py,Math.max(.8,s*(.012+(hk%5)*.004)),0,6.283);g.fill()}
    // bevel: bright upper edges, dark lower edges
    g.save();hexPath(g,c,r,.965);g.clip();g.lineWidth=Math.max(1.5,s*.05);g.strokeStyle='rgba(255,255,255,.13)';g.save();g.translate(s*.02,s*.03);hexPath(g,c,r,.965);g.stroke();g.restore();
    g.strokeStyle='rgba(0,0,0,.22)';g.save();g.translate(-s*.02,-s*.03);hexPath(g,c,r,.965);g.stroke();g.restore();g.restore()}
  groundDetail(g,bk);
  if(R&&R.field&&R.field.ter)drawTerrainBG(g,BM);
  // the entrance lane and the keep courtyard
  if(!ROT){g.fillStyle='rgba(30,20,40,.55)';g.fillRect(sx(-T*1.1),sy(hy(SPAWN_ROWS[0])-T*.45),ss(T*1.1),ss(hy(SPAWN_ROWS[SPAWN_ROWS.length-1])-hy(SPAWN_ROWS[0])+T*.9)*VY);}
  g.fillStyle='rgba(200,190,160,.35)';g.fillRect(sx(FW-T*.1),sy(hy(KEEP_ROWS[0])-T*.45),ss(T*1),ss(hy(KEEP_ROWS[KEEP_ROWS.length-1])-hy(KEEP_ROWS[0])+T*.9)*VY);
  upr(g,BM);edgeProps(g,R?R.act:0);
  g.fillStyle=A.fog;g.fillRect(0,0,W,H);
  VIG=null;drawVignette(g);
  bgDirty=0}
// darken or lighten a #rrggbb colour
function shade(hex,k){const n=parseInt(hex.slice(1),16);let r=n>>16,g=n>>8&255,b=n&255;const f=v=>Math.round(clamp(k<0?v*(1+k):v+(255-v)*k,0,255));return'#'+((1<<24)|(f(r)<<16)|(f(g)<<8)|f(b)).toString(16).slice(1)}
// a painted horizon behind the plateau: two layers of hills or peaks or dunes, and a soft glow where the light is
const BACKS=[{k:'peaks',a:'#141a26',b:'#232c3c',glow:'150,170,220'},{k:'trees',a:'#16281c',b:'#24402a',glow:'220,240,170'},{k:'peaks',a:'#260e0a',b:'#4a1c12',glow:'255,140,60'},
  {k:'trees',a:'#0e1c18',b:'#1c3228',glow:'150,220,190'},{k:'peaks',a:'#3a4a66',b:'#5a6c8a',glow:'230,240,255'},{k:'dunes',a:'#7a4e26',b:'#a06a36',glow:'255,220,150'}];
function backdrop(g,A,bk){const B=BACKS[bk]||BACKS[0],yH=fieldBox().t-ss(T*(ROT?.7:.1)),sd=7+bk*13;
  const gl=g.createRadialGradient(W*.7,yH-H*.12,0,W*.7,yH-H*.12,W*.55);gl.addColorStop(0,`rgba(${B.glow},.35)`);gl.addColorStop(1,`rgba(${B.glow},0)`);g.fillStyle=gl;g.fillRect(0,0,W,H);
  for(const [col,amp,yo,fr] of [[B.b,.16,.02,.9],[B.a,.1,.06,1.7]]){g.fillStyle=col;g.beginPath();g.moveTo(0,H);g.lineTo(0,yH);const n=64;
    for(let i=0;i<=n;i++){const t=i/n,x=t*W;let y;const ph=t*Math.PI*2*fr*3+sd;
      if(B.k==='peaks')y=yH-H*amp*(.45+.55*Math.abs(Math.sin(ph))*(.6+.4*Math.sin(ph*.37+1)))+H*yo;
      else if(B.k==='dunes')y=yH-H*amp*(.5+.5*Math.sin(ph*.5))*.8+H*yo;
      else y=yH-H*amp*(.55+.25*Math.sin(ph*.7)+.2*((hh(i,3,sd)%10)/10))+H*yo;g.lineTo(x,y)}
    g.lineTo(W,H);g.closePath();g.fill();
    if(B.k==='trees'){for(let i=0;i<70;i++){const h=hh(i,11,sd),x=(h%1000)/1000*W,y=yH+H*yo-H*amp*.4-((h>>10)%30)/100*H*amp,s=H*.03*(1+((h>>5)%10)/10);g.beginPath();g.moveTo(x,y-s*1.4);g.lineTo(x+s*.5,y);g.lineTo(x-s*.5,y);g.closePath();g.fill()}}}
  // mist at the foot of the horizon
  const m=g.createLinearGradient(0,yH-H*.08,0,yH+H*.04);m.addColorStop(0,'rgba(255,255,255,0)');m.addColorStop(1,`rgba(${B.glow},.12)`);g.fillStyle=m;g.fillRect(0,yH-H*.08,W,H*.12)}
// vignette and a little colour grading on top of everything, cached per screen size and act
let VIG=null;const GRADE=['rgba(80,110,170,.06)','rgba(120,170,60,.05)','rgba(255,110,40,.07)','rgba(60,140,110,.07)','rgba(150,190,255,.07)','rgba(255,180,90,.07)'];
function drawVignette(dst){if(!VIG){VIG=mk(Math.max(1,Math.round(W/2)),Math.max(1,Math.round(H/2)));const g=VIG&&VIG.getContext('2d');if(!g||!g.createRadialGradient)return;const w=VIG.width,h=VIG.height;
    const bk=R?(actD(R.act).obs??R.act):0;g.fillStyle=GRADE[bk]||GRADE[0];g.fillRect(0,0,w,h);const v=g.createRadialGradient(w/2,h*.45,Math.min(w,h)*.35,w/2,h*.45,Math.max(w,h)*.75);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,.42)');g.fillStyle=v;g.fillRect(0,0,w,h)}
  if(VIG)(dst||ctx).drawImage(VIG,0,0,W,H)}
// drifting ambient particles: motes, fireflies, snow, embers, dust, spores
const AMB=[];const AMBK=[{c:'200,215,255',n:22,vy:-6,vx:3,r:1.6,tw:1},{c:'230,255,140',n:26,vy:-4,vx:6,r:1.8,tw:1,glow:1},{c:'255,140,50',n:34,vy:-22,vx:6,r:1.8,glow:1},{c:'170,255,200',n:24,vy:-5,vx:5,r:1.8,tw:1,glow:1},{c:'255,255,255',n:46,vy:22,vx:-9,r:2,tw:0},{c:'240,210,160',n:30,vy:-2,vx:24,r:1.4}];
function drawAmbient(dt){if(!R)return;const bk=actD(R.act).obs??R.act,K=AMBK[bk]||AMBK[0],n=LQ()?Math.round(K.n*.35):K.n;
  // particles live in screen space over the field, so snow falls down and embers rise in either layout
  if(AMB.k!==bk){AMB.length=0;AMB.k=bk}while(AMB.length<n)AMB.push({u:Math.random(),v:Math.random()*1.2-.1,z:.5+Math.random(),ph:Math.random()*6});
  const F=fieldBox(T*.6),bw=F.r-F.l,bh=F.b-F.t,k=ss(1);ctx.save();if(K.glow)ctx.globalCompositeOperation='lighter';
  // two batched paths (dim and bright) instead of one draw per particle
  const r0=Math.max(.8,ss(K.r));ctx.fillStyle=`rgb(${K.c})`;const P=[new Path2D(),new Path2D()];
  for(let i=0;i<AMB.length;i++){const p=AMB[i];p.u+=(K.vx+Math.sin(TIME*.7+p.ph)*4)*p.z*dt*k/bw;p.v+=K.vy*p.z*dt*VY*k/bh;p.ph+=dt;if(p.v<-.15)p.v=1.08;if(p.v>1.12)p.v=-.12;if(p.u<-.05)p.u=1.04;if(p.u>1.05)p.u=-.04;
    const x=F.l+p.u*bw,y=F.t+p.v*bh,r=r0*p.z,b=K.tw?(Math.sin(p.ph*2)>0?1:0):1;P[b].moveTo(x+r,y);P[b].arc(x,y,r,0,6.283);
    if(K.glow&&!LQ()&&i%4===0){const gl=glow(K.c);if(gl){ctx.globalAlpha=.5;ctx.drawImage(gl,x-r*4,y-r*4,r*8,r*8)}}}
  ctx.globalAlpha=.3;ctx.fill(P[0]);ctx.globalAlpha=.7;ctx.fill(P[1]);
  ctx.restore()}
// a hash so decorations stay put for a run and act
const hh=(a,b,c)=>((a*73856093)^(b*19349663)^(c*83492791))>>>0;
function groundDetail(g,act){const sd=R?R.seed:0;g.save();upr(g,[DPR,0,0,DPR,0,0]);// drawn upright so grass and cracks never lie sideways in portrait
  for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){const h=hh(c,r,sd+act*7),s=ss(T),P0=scr(hx(c,r),hy(r)),x=P0[0]-s*.5,y=P0[1]-s*VY*.5;
    if(act===0){if(h%6===0){g.strokeStyle='rgba(20,24,18,.35)';g.lineWidth=Math.max(1,s*.025);g.beginPath();const x0=x+s*((h>>3)%60)/100+s*.2,y0=y+s*VY*.3;g.moveTo(x0,y0);g.lineTo(x0+s*.12,y0+s*.08);g.lineTo(x0+s*.08,y0+s*.2);g.moveTo(x0+s*.12,y0+s*.08);g.lineTo(x0+s*.26,y0+s*.06);g.stroke()}
      if(h%9===1){g.fillStyle='rgba(230,225,205,.5)';g.save();g.translate(x+s*((h>>4)%70)/100+s*.15,y+s*VY*((h>>6)%60)/100+s*.12);g.rotate((h%10)/3);g.fillRect(-s*.07,-s*.012,s*.14,s*.024);g.beginPath();g.arc(-s*.07,0,s*.022,0,6.283);g.arc(s*.07,0,s*.022,0,6.283);g.fill();g.restore()}
      if(h%5===2){g.fillStyle='rgba(90,120,70,.22)';g.beginPath();g.ellipse(x+s*.5,y+s*VY*.5,s*.35,s*.2*VY+s*.05,0,0,6.283);g.fill()}}
    else if(act===1){if(h%3===0){g.strokeStyle=h%2?'rgba(140,200,90,.55)':'rgba(60,110,40,.5)';g.lineWidth=Math.max(1,s*.022);const bx=x+s*((h>>3)%70)/100+s*.15,by=y+s*VY*((h>>5)%60)/100+s*.25;for(let k=-1;k<=1;k++){g.beginPath();g.moveTo(bx+k*s*.03,by);g.quadraticCurveTo(bx+k*s*.05,by-s*.06,bx+k*s*.09,by-s*.12);g.stroke()}}
      if(h%11===4){const fc=['#ffe36a','#ff8ad0','#ffffff','#8ad0ff'][h%4];g.fillStyle=fc;for(let k=0;k<3;k++){g.beginPath();g.arc(x+s*(.2+((h>>(k*3))%60)/100),y+s*VY*(.2+((h>>(k*4+2))%60)/100),Math.max(1,s*.025),0,6.283);g.fill()}}}
    else if(act===3){if(h%4===0){g.fillStyle='rgba(30,60,50,.35)';g.beginPath();g.ellipse(x+s*(.3+((h>>3)%40)/100),y+s*VY*(.3+((h>>5)%40)/100),s*.16,s*.06,0,0,6.283);g.fill();g.fillStyle='rgba(180,230,210,.12)';g.beginPath();g.ellipse(x+s*(.28+((h>>3)%40)/100),y+s*VY*(.29+((h>>5)%40)/100),s*.07,s*.02,0,0,6.283);g.fill()}
      if(h%5===1){g.strokeStyle='rgba(120,150,70,.6)';g.lineWidth=Math.max(1,s*.02);const bx=x+s*((h>>4)%70)/100+s*.15,by=y+s*VY*.6;for(let k=-2;k<=2;k++){g.beginPath();g.moveTo(bx+k*s*.025,by);g.lineTo(bx+k*s*.04,by-s*(.12+((h>>k+3)&3)*.02));g.stroke()}}}
    else if(act===4){if(h%3===0){g.fillStyle='rgba(255,255,255,.35)';g.beginPath();g.ellipse(x+s*.5,y+s*VY*.5,s*(.2+(h%5)*.03),s*.08,0,0,6.283);g.fill()}
      if(h%4===1){g.fillStyle='rgba(255,255,255,.8)';for(let k=0;k<4;k++){g.beginPath();g.arc(x+s*(.15+((h>>(k*3))%70)/100),y+s*VY*(.15+((h>>(k*3+2))%70)/100),Math.max(.8,s*.012),0,6.283);g.fill()}}
      if(h%7===2){g.strokeStyle='rgba(120,160,200,.45)';g.lineWidth=Math.max(1,s*.02);g.beginPath();const x0=x+s*.3,y0=y+s*VY*.4;g.moveTo(x0,y0);g.lineTo(x0+s*.14,y0+s*.04);g.lineTo(x0+s*.22,y0-s*.03);g.stroke()}}
    else if(act===5){if(h%2===0){g.strokeStyle='rgba(120,80,30,.22)';g.lineWidth=Math.max(1,s*.022);for(let k=0;k<3;k++){const yy=y+s*VY*(.25+k*.2),xx=x+s*.15;g.beginPath();g.moveTo(xx,yy);g.quadraticCurveTo(xx+s*.35,yy-s*.06,xx+s*.7,yy);g.stroke()}}
      if(h%9===4){g.fillStyle='rgba(90,60,30,.4)';g.beginPath();g.ellipse(x+s*.55,y+s*VY*.6,s*.07,s*.035,0,0,6.283);g.fill()}}
    else{if(h%4===0){g.strokeStyle='rgba(255,110,30,.45)';g.lineWidth=Math.max(1,s*.03);g.shadowColor='#ff6a1a';g.shadowBlur=s*.12;g.beginPath();const x0=x+s*((h>>3)%50)/100+s*.15,y0=y+s*VY*((h>>5)%50)/100+s*.15;g.moveTo(x0,y0);g.lineTo(x0+s*.15,y0+s*.05);g.lineTo(x0+s*.22,y0+s*.16);g.moveTo(x0+s*.15,y0+s*.05);g.lineTo(x0+s*.3,y0);g.stroke();g.shadowBlur=0}
      if(h%7===3){g.fillStyle='rgba(30,20,18,.35)';g.beginPath();g.ellipse(x+s*.5,y+s*VY*.55,s*.3,s*.12,0,0,6.283);g.fill()}}}
  g.restore()}
// props along the far edge of the plateau, drawn once into the background
let EDGE=[];
function edgeProps(g,act){const set=EDGE_SETS[actD(act).obs??act],sd=R?R.seed:0;EDGE=[];
  for(let i=0;i<COLS+2;i++){const h=hh(i,99,sd+act*13);if(h%3===0)continue;const d=set[h%set.length],x=(i-.5+((h>>4)%40)/100)*T,y=-T*(.28+((h>>7)%20)/100);EDGE.push({x,y,d})}
  EDGE.sort((a,b)=>scr(a.x,a.y)[1]-scr(b.x,b.y)[1]);for(const e of EDGE){const s=ss(T*1.25*e.d[2]),f=frame(e.d[0],e.d[0]==='props2'?160:192,e.d[1],s*DPR),[X,Y]=scr(e.x,e.y);if(f)g.drawImage(f,X-s/2,Y-s*.86,s,s)}}
// gates that send monsters this wave (or next wave, while planning)
function activeGates(){const q=R.b?R.b.gs:R.nextQ;const set=new Set();if(q)for(const e of q)set.add(e.g||0);if(!set.size)set.add(0);return set}
function gateCount(id){const q=R.b?R.b.q:R.nextQ;let n=0;if(q)for(const e of q)if((e.g||0)===id)n++;return n}
const GCOL=['255,240,200','215,160,255','160,220,255','255,170,140','190,255,170'];
function drawRoute(){const F=R.field,act=activeGates(),wave=R.phase==='wave';ctx.save();ctx.lineWidth=Math.max(2,ss(5));ctx.setLineDash([ss(10),ss(12)]);ctx.lineDashOffset=-TIME*ss(40);ctx.lineCap='round';ctx.lineJoin='round';
  for(const g of F.gates||[{k:'west',id:0}]){if(!act.has(g.id))continue;const rt=g.id===0?F.route:(F.routes||[])[g.id];if(!rt||rt.length<2)continue;
    ctx.strokeStyle=`rgba(${GCOL[g.id%GCOL.length]},${wave?.16:.5})`;ctx.beginPath();if(g.k==='west')ctx.moveTo(sx(-T*.6),sy(hy(rt[0][1])));else ctx.moveTo(sx(hx(rt[0][0],rt[0][1])),sy(hy(rt[0][1])));
    for(const [c,r] of rt)ctx.lineTo(sx(hx(c,r)),sy(hy(r)));ctx.lineTo(sx(FW+T*.5),sy(hy(rt[rt.length-1][1])));ctx.stroke()}
  ctx.restore()}
// terrain painted into the background once per act
function drawTerrainBG(g,BM){const F=R.field,sd=R.seed||0;g.save();
  for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){const t=F.ter[r*COLS+c];if(!t)continue;const x=sx(hx(c,r)),y=sy(hy(r)),s=ss(T),h=hh(c,r,sd+31);
    if(t===4){hexPath(g,c,r,1.02);const gr=g.createLinearGradient(0,y-s*.4,0,y+s*.4);gr.addColorStop(0,'#2f6f9a');gr.addColorStop(1,'#1d4a6e');g.fillStyle=gr;g.fill();g.strokeStyle='rgba(210,235,255,.35)';g.lineWidth=Math.max(1,s*.03);g.stroke();
      hexPath(g,c,r,.78);g.fillStyle='rgba(120,190,230,.18)';g.fill();g.strokeStyle='rgba(255,255,255,.18)';g.lineWidth=Math.max(1,s*.015);for(let k=0;k<2;k++){const yy=y+(k-.5)*s*.18,xx=x+((h>>k*3)%20-10)/100*s;g.beginPath();g.moveTo(xx-s*.14,yy);g.quadraticCurveTo(xx,yy-s*.04,xx+s*.14,yy);g.stroke()}}
    else if(t===1){const lift=s*.12;g.fillStyle='rgba(0,0,0,.3)';hexPath(g,c,r,.98);g.fill();g.save();upr(g,BM);const [X,Y]=scr(hx(c,r),hy(r));hexPathS(g,c,r,.96,lift);const gr=g.createLinearGradient(0,Y-lift-s*.4,0,Y-lift+s*.4);gr.addColorStop(0,'rgba(255,240,200,.35)');gr.addColorStop(1,'rgba(255,240,200,.08)');g.fillStyle=gr;g.fill();g.strokeStyle='rgba(255,236,190,.55)';g.lineWidth=Math.max(1,s*.025);g.stroke();
      g.fillStyle='rgba(255,236,190,.7)';g.beginPath();g.moveTo(X-s*.1,Y-lift+s*.08);g.lineTo(X,Y-lift-s*.08);g.lineTo(X+s*.1,Y-lift+s*.08);g.closePath();g.fill();g.restore()}
    else if(t===2){hexPath(g,c,r,.94);g.fillStyle='rgba(70,48,28,.62)';g.fill();for(let k=0;k<4;k++){const px=x+(((h>>(k*4))%60)/100-.3)*s,py=y+(((h>>(k*4+2))%40)/100-.2)*s*VY;g.fillStyle='rgba(40,26,14,.55)';g.beginPath();g.ellipse(px,py,s*.09,s*.035,0,0,6.283);g.fill();g.fillStyle='rgba(200,180,150,.18)';g.beginPath();g.ellipse(px-s*.02,py-s*.008,s*.04,s*.012,0,0,6.283);g.fill()}}
    else if(t===3){hexPath(g,c,r,.94);g.fillStyle='rgba(40,50,24,.5)';g.fill();g.strokeStyle='rgba(28,40,14,.9)';g.lineWidth=Math.max(1,s*.03);for(let k=0;k<5;k++){const px=x+(((h>>(k*3))%70)/100-.35)*s,py=y+(((h>>(k*3+1))%50)/100-.25)*s*VY;g.beginPath();g.moveTo(px-s*.1,py+s*.03);g.quadraticCurveTo(px,py-s*.12,px+s*.1,py+s*.02);g.stroke();
      g.fillStyle='#c8d8a0';for(let j=0;j<3;j++){const tx=px-s*.07+j*s*.07,ty=py-s*.03-(j===1?s*.05:0);g.beginPath();g.moveTo(tx,ty);g.lineTo(tx+s*.012,ty-s*.04);g.lineTo(tx+s*.024,ty);g.fill()}}
      g.fillStyle='#b8344a';g.beginPath();g.arc(x+((h%30)-15)/100*s,y-s*.05,Math.max(1.2,s*.025),0,6.283);g.fill()}}
  g.restore()}
// water glints and the monster gates in the field
function drawLiveTerrain(){const F=R.field;if(F.ter&&!LQ()){ctx.save();ctx.globalCompositeOperation='lighter';for(let i=0;i<F.ter.length;i++){if(F.ter[i]!==4)continue;const c=i%COLS,r=(i/COLS)|0,x=sx(hx(c,r)),y=sy(hy(r)),s=ss(T);
    for(let k=0;k<2;k++){const ph=(TIME*.35+k*.5+c*.17+r*.29)%1;ctx.globalAlpha=Math.sin(ph*Math.PI)*.35;ctx.fillStyle='#d8f0ff';ctx.beginPath();ctx.ellipse(x+(ph-.5)*s*.5,y+(k-.5)*s*.2*VY,s*.08,s*.012,0,0,6.283);ctx.fill()}}ctx.restore()}
  const act=activeGates(),plan=R.phase!=='wave';
  for(const g of F.gates||[]){if(g.k==='west')continue;const x=sx(hx(g.c,g.r)),y=sy(hy(g.r)),s=ss(T),on=act.has(g.id);if(g.flash>0)g.flash-=FRAME_DT;
    ctx.save();ctx.translate(x,y);ctx.scale(1,VY);ctx.fillStyle='rgba(0,0,0,.45)';ctx.beginPath();ctx.arc(0,0,s*.42,0,6.283);ctx.fill();ctx.strokeStyle=on?'#9a7ab8':'#6a6470';ctx.lineWidth=Math.max(2,s*.07);ctx.stroke();
    ctx.fillStyle=on?'#c9a8ff':'#8a8490';for(let i=0;i<6;i++){const an=i*1.047+.3;ctx.fillRect(Math.cos(an)*s*.42-s*.03,Math.sin(an)*s*.42-s*.03,s*.06,s*.06)}
    if(on){const gr=ctx.createRadialGradient(0,0,0,0,0,s*.4);gr.addColorStop(0,'rgba(20,0,40,.95)');gr.addColorStop(.6,'rgba(110,40,170,.8)');gr.addColorStop(1,'rgba(170,90,255,.2)');ctx.fillStyle=gr;ctx.beginPath();ctx.arc(0,0,s*.36,0,6.283);ctx.fill();
      ctx.strokeStyle='rgba(220,170,255,.75)';ctx.lineWidth=Math.max(1.2,s*.025);for(let i=0;i<3;i++){ctx.rotate(TIME*(1.2+i*.5));ctx.beginPath();ctx.arc(0,0,s*(.3-i*.07),0,4)}ctx.stroke()}
    ctx.restore();
    if(on){ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.45+.2*Math.sin(TIME*3+g.id)+(g.flash>0?.4:0);const gl=glow('170,90,255');if(gl)ctx.drawImage(gl,x-s*.6,y-s*.75,s*1.2,s*1.1);ctx.restore()}
    if(on&&plan){const n=gateCount(g.id);if(n){ctx.save();upr();const [X,Y]=scr(hx(g.c,g.r),hy(g.r)),bx=X+s*.3,by=Y-s*.42,br=Math.max(8,s*.17);ctx.fillStyle='#2a1440';ctx.strokeStyle='#d6a8ff';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(bx,by,br,0,6.283);ctx.fill();ctx.stroke();ctx.font=`900 ${Math.max(9,br*1.1)}px "Barlow Condensed",sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#fff';ctx.fillText(n,bx,by+1);ctx.restore()}}}}
function drawRunes(){
  for(const q of R.field.runes){const x=sx(hx(q.c,q.r)),y=sy(hy(q.r)),s=ss(T),f=q.flash>0?q.flash/.3:0;if(q.flash>0)q.flash-=FRAME_DT;const v=runeMul(q);
    ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.55+.25*Math.sin(TIME*3+q.c)+f*.5;const gl=glow('120,170,255');if(gl)ctx.drawImage(gl,x-s*.8,y-s*.55,s*1.6,s*1.1);ctx.restore();
    ctx.strokeStyle=f?'#ffffff':'#9cc4ff';ctx.lineWidth=Math.max(1.5,ss(2.5));ctx.beginPath();ctx.ellipse(x,y,s*.38,s*.38*VY,0,0,6.283);ctx.stroke();
    ctx.save();ctx.translate(x,y);ctx.scale(1,VY);ctx.rotate(TIME*.6+q.ph);ctx.strokeStyle='rgba(190,215,255,.85)';ctx.lineWidth=Math.max(1,ss(1.6));for(let i=0;i<6;i++){ctx.rotate(1.047);ctx.beginPath();ctx.moveTo(s*.2,0);ctx.lineTo(s*.32,0);ctx.stroke()}ctx.restore();
    ctx.save();upr();const [X,Y]=scr(hx(q.c,q.r),hy(q.r));ctx.font=`900 ${Math.max(12,ss(19))}px Cinzel,serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineWidth=3;ctx.strokeStyle='#0a1430';ctx.strokeText('×'+v,X,Y);ctx.fillStyle=f?'#ffffff':'#d8e6ff';ctx.fillText('×'+v,X,Y);ctx.restore()}}
function drawPortals(){
  for(const q of R.field.portals){const x=sx(hx(q.c,q.r)),y=sy(hy(q.r)),s=ss(T),f=q.flash>0?q.flash/.4:0;if(q.flash>0)q.flash-=FRAME_DT;
    ctx.save();ctx.translate(x,y);ctx.scale(1,VY);for(let i=0;i<3;i++){ctx.rotate(TIME*(1.4+i*.4));ctx.strokeStyle=`rgba(${190-i*30},${110+i*20},255,${.75-i*.15})`;ctx.lineWidth=Math.max(1.5,ss(3-i*.6));ctx.beginPath();ctx.arc(0,0,s*(.38-i*.08),0,4.4);ctx.stroke()}
    ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.6+f*.4;const gl=glow('170,90,255');if(gl)ctx.drawImage(gl,-s*.5,-s*.5,s,s);ctx.restore();
    ctx.save();upr();const [X,Y]=scr(hx(q.c,q.r),hy(q.r));ctx.font=`900 ${Math.max(11,ss(16))}px Cinzel,serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineWidth=3;ctx.strokeStyle='#1a0830';ctx.strokeText('×'+portalMul(q),X,Y-s*.42);ctx.fillStyle='#e6c8ff';ctx.fillText('×'+portalMul(q),X,Y-s*.42);ctx.restore()}}
function drawSpawnAndKeep(){
  const [x,y]=scr(-T*.55,(hy(SPAWN_ROWS[0])+hy(SPAWN_ROWS[SPAWN_ROWS.length-1]))/2),s=ss(T),won=activeGates().has(0);ctx.save();ctx.translate(x,y);if(ROT){ctx.rotate(Math.PI/2);ctx.scale(.75,1)}if(!won)ctx.globalAlpha=.35;
  const gr=ctx.createRadialGradient(0,0,0,0,0,s*.9);gr.addColorStop(0,'rgba(10,0,20,.95)');gr.addColorStop(.6,'rgba(80,20,120,.75)');gr.addColorStop(1,'rgba(120,40,200,0)');ctx.fillStyle=gr;ctx.beginPath();ctx.ellipse(0,0,s*.55,s*1.05,0,0,6.283);ctx.fill();
  ctx.strokeStyle='rgba(200,120,255,.8)';ctx.lineWidth=2;for(let i=0;i<3;i++){ctx.beginPath();ctx.ellipse(0,0,s*(.42+.06*Math.sin(TIME*3+i*2)),s*(.95+.05*Math.sin(TIME*2+i)),0,0,6.283);ctx.stroke()}ctx.restore();
  if(won&&R.phase!=='wave'&&(R.field.gates||[]).length>1){const n=gateCount(0);if(n){const br=Math.max(8,s*.17);ctx.fillStyle='#2a1440';ctx.strokeStyle='#fff0c8';ctx.lineWidth=1.5;const by0=ROT?y-s*.6:y-s*.95;ctx.beginPath();ctx.arc(x,by0,br,0,6.283);ctx.fill();ctx.stroke();ctx.font=`900 ${Math.max(9,br*1.1)}px "Barlow Condensed",sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#fff';ctx.fillText(n,x,by0+1)}}
  const sk=SKINS.find(q=>q.id===SET.skin)||SKINS[0],k=sheet(sk.sh)||sheet('keep');const [kx,ky0]=scr(FW+T*.62,(hy(KEEP_ROWS[0])+hy(KEEP_ROWS[KEEP_ROWS.length-1]))/2),ky=ky0+ss(T*(ROT?.75:.5)),ks=ss(T*3.1);
  ctx.fillStyle='rgba(0,0,0,.3)';ctx.beginPath();ctx.ellipse(kx,ky,ks*.3,ks*.09,0,0,6.283);ctx.fill();
  if(k)ctx.drawImage(k,kx-ks/2,ky-ks*.86,ks,ks);else{ctx.fillStyle='#8a90a0';ctx.fillRect(kx-ks*.2,ky-ks*.6,ks*.4,ks*.6)}
  drawGuards(kx,ky,ks);
  // keep health under the castle
  const bw=ss(T*1.5),bx=kx-bw/2,by=ky+ss(8),p=clamp(R.hp/R.hpMax,0,1);ctx.fillStyle='rgba(0,0,0,.7)';ctx.fillRect(bx-1,by-1,bw+2,ss(9)+2);ctx.fillStyle=p>.5?'#6ad06a':p>.25?'#ffc04a':'#ff4a4a';ctx.fillRect(bx,by,bw*p,ss(9));
  ctx.font=`800 ${Math.max(10,ss(12))}px "Barlow Condensed",sans-serif`;ctx.textAlign='center';ctx.textBaseline='top';ctx.fillStyle='#fff';ctx.fillText(Math.ceil(R.hp)+' / '+R.hpMax,kx,by+ss(10))}
// a stone plinth under every fielded hero: the hex is raised, with its front faces showing
const PLAT=['#8a8070','#6f8a5a','#8a5a48'],PLATD=['#4e463c','#3e5232','#4e2e24'];
function drawPlatform(h){const lift=ss(T*.17),c=h.c,r=h.r,x=hx(c,r),y=hy(r),R_=HR*.93,pts=[];for(let i=0;i<6;i++){const a=(-90+60*i)*Math.PI/180;pts.push(scr(x+Math.cos(a)*R_,y+Math.sin(a)*R_))}const [X0,Y0]=scr(x,y);
  // front faces: the edges between vertices 1-2, 2-3 and 3-4 (right-lower, bottom, left-lower)
  const col=TRAITS[HEROES[h.k].tr[0]].col,dark=PLATD[R.act]||PLATD[0];ctx.save();ctx.fillStyle='rgba(0,0,0,.28)';ctx.beginPath();ctx.ellipse(X0,Y0+ss(T*.06),ss(R_*1.05),ss(R_*1.05)*VY,0,0,6.283);ctx.fill();
  for(const [a,b,sh] of ROT?[[0,1,.75],[1,2,.6],[2,3,.75]]:[[1,2,.75],[2,3,.6],[3,4,.75]]){ctx.fillStyle=dark;ctx.beginPath();ctx.moveTo(pts[a][0],pts[a][1]-lift);ctx.lineTo(pts[b][0],pts[b][1]-lift);ctx.lineTo(pts[b][0],pts[b][1]);ctx.lineTo(pts[a][0],pts[a][1]);ctx.closePath();ctx.fill();ctx.fillStyle=`rgba(0,0,0,${1-sh})`;ctx.fill()}
  ctx.beginPath();pts.forEach(([px,py],i)=>i?ctx.lineTo(px,py-lift):ctx.moveTo(px,py-lift));ctx.closePath();const gr=ctx.createLinearGradient(0,Y0-ss(R_)*VY-lift,0,Y0+ss(R_)*VY-lift);const leg=HEROES[h.k].c===5;gr.addColorStop(0,leg?'#fff0b0':'#c8bca4');gr.addColorStop(1,leg?'#c8962a':PLAT[R.act]||PLAT[0]);ctx.fillStyle=gr;ctx.fill();
  ctx.strokeStyle=leg?'#ffe58a':hexA(col,.85);ctx.lineWidth=Math.max(1.5,ss(leg?3:2.2));ctx.stroke();
  if(leg&&!LQ()){ctx.save();ctx.globalCompositeOperation='lighter';for(let i=0;i<4;i++){const ph=(TIME*.5+i/4+h.uid*.37)%1,an=i*1.57+TIME*.8;ctx.globalAlpha=(1-ph)*.9;ctx.fillStyle='#ffe58a';ctx.beginPath();ctx.arc(X0+Math.cos(an)*ss(R_*.6),Y0-lift-ph*ss(T*1.1),Math.max(1.2,ss(2.2)),0,6.283);ctx.fill()}ctx.restore()}ctx.strokeStyle='rgba(255,255,255,.25)';ctx.lineWidth=1;ctx.beginPath();{const tp=ROT?[3,4,5,0]:[4,5,0];tp.forEach((k,i)=>i?ctx.lineTo(pts[k][0],pts[k][1]-lift):ctx.moveTo(pts[k][0],pts[k][1]-lift))}ctx.stroke();
  // veteran chevrons carved into the front of the plinth
  if(h.vet){ctx.fillStyle='#ffb04a';ctx.font=`900 ${Math.max(8,lift*.95)}px sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';const fp=ROT?[(pts[1][0]+pts[2][0])/2,(pts[1][1]+pts[2][1])/2]:pts[3];ctx.fillText('❯'.repeat(h.vet),fp[0],fp[1]-lift*.45)}ctx.restore();return lift}
const OBS_SCALE=[1.25,1.2,.95,.75,.85,.7];
// which way a sprite faces on screen: along the road in landscape, across it in portrait
const fc=o=>ROT?(o.fy||1):(o.face||1);
function heroFrame(h){const busy=h.atk>0&&R.phase==='wave';if(busy){const p=1-h.atk/.42;return 4+clamp((p*6)|0,0,5)}return((TIME*5+h.uid)|0)%4}
function drawHeroAt(h,x,y,size,ghost,live){
  const f=frame('h_'+h.k,160,live&&h.ko?0:heroFrame(h),size*DPR);
  if(live&&h.ko){ctx.save();ctx.globalAlpha=.55;ctx.fillStyle='rgba(0,0,0,.28)';ctx.beginPath();ctx.ellipse(x,y,size*.22,size*.07,0,0,6.283);ctx.fill();if(f){ctx.translate(x,y);ctx.rotate((fc(h)<0?-1:1)*1.3);ctx.drawImage(f,-size/2,-size*.75,size,size)}ctx.restore();
    ctx.font=`900 ${Math.max(10,size*.2)}px sans-serif`;ctx.textAlign='center';ctx.fillStyle='#ffb0a0';ctx.fillText('✖',x,y-size*.35);return}
  ctx.fillStyle='rgba(0,0,0,.28)';ctx.beginPath();ctx.ellipse(x,y,size*.22,size*.07,0,0,6.283);ctx.fill();
  if(h.star>1){ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=h.star===3?.7:.4;const gl=glow(h.star===3?'255,200,60':'150,200,255');if(gl)ctx.drawImage(gl,x-size*.45,y-size*.75,size*.9,size*.9);ctx.restore()}
  if(ghost)ctx.globalAlpha=.6;
  if(f){ctx.save();ctx.translate(x,y);if(fc(h)<0)ctx.scale(-1,1);ctx.drawImage(f,-size/2,-size*.86,size,size);if(live&&h.hurtT>0&&!LQ()){ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.4;ctx.drawImage(f,-size/2,-size*.86,size,size)}ctx.restore();
    if(live&&h.seizT>0){ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.5+.25*Math.sin(TIME*10);const gl=glow('170,80,255');if(gl)ctx.drawImage(gl,x-size*.4,y-size*.8,size*.8,size*.8);ctx.restore()}
    if(live&&(h.hurtT>0||h.chillT>0)){ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=h.hurtT>0?.6:.35;const gl=glow(h.hurtT>0?'255,60,40':'120,200,255');if(gl)ctx.drawImage(gl,x-size*.32,y-size*.7,size*.64,size*.64);ctx.restore()}}
  else{ctx.fillStyle=TIERCOL[HEROES[h.k].c];ctx.beginPath();ctx.arc(x,y-size*.35,size*.22,0,6.283);ctx.fill()}
  ctx.globalAlpha=1;
  // stars, cost colour
  const st='★'.repeat(h.star),fs=Math.max(9,size*.16);ctx.font=`900 ${fs}px sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineWidth=3;ctx.strokeStyle='rgba(0,0,0,.85)';ctx.strokeText(st,x,y+fs*.55);ctx.fillStyle=h.star===3?'#ffd76a':h.star===2?'#cfe6ff':TIERCOL[HEROES[h.k].c];ctx.fillText(st,x,y+fs*.55)}
function drawMon(m){
  const D=MON[m.k],[x,y]=scr(m.x,m.y),fly=m.fly?ss(T*.55)+Math.sin(m.wob)*ss(4):0,size=ss(T*1.42*(m.sz||D.sz))*(m.boss?1.15:1);
  ctx.fillStyle='rgba(0,0,0,.3)';ctx.beginPath();ctx.ellipse(x,y,size*.22,size*.07,0,0,6.283);ctx.fill();
  if(m.elite||m.boss){ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.55+.2*Math.sin(TIME*6);const gl=glow(m.boss?'255,80,60':'255,200,60');if(gl)ctx.drawImage(gl,x-size*.5,y-size*.4-fly,size,size*.6);ctx.restore()}
  if(m.slowT>0&&m.slowP<1){ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.35;const gl=glow('120,200,255');if(gl)ctx.drawImage(gl,x-size*.35,y-size*.7-fly,size*.7,size*.7);ctx.restore()}
  const fi=((m.wob*1.1)|0)%6,f=frame('m_'+m.k,160,(m.stunT>0||m.rootT>0)?0:fi,size*DPR);if(m.lunge>0)m.lunge-=FRAME_DT;const lg=m.lunge>0?Math.sin(m.lunge/.25*Math.PI)*size*.12*fc(m):0;
  if(m.phased)ctx.globalAlpha=.3;if(MON[m.k].final){ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.5+.2*Math.sin(TIME*3);const gl=glow('150,60,255');if(gl)ctx.drawImage(gl,x-size*.7,y-size*1.05,size*1.4,size*1.2);ctx.restore()}
  if(m.charmT>0){ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.6;const gl=glow('255,80,160');if(gl)ctx.drawImage(gl,x-size*.4,y-size*.8,size*.8,size*.8);ctx.restore()}
  if(f){ctx.save();ctx.translate(x+lg,y-fly);if(fc(m)<0)ctx.scale(-1,1);ctx.drawImage(f,-size/2,-size*.86,size,size);if(m.hitT>0&&!LQ()){ctx.globalCompositeOperation='lighter';ctx.globalAlpha=m.hitT*3;ctx.drawImage(f,-size/2,-size*.86,size,size)}ctx.restore()}
  else{ctx.fillStyle='#c8c0b0';ctx.beginPath();ctx.arc(x,y-size*.3-fly,size*.22,0,6.283);ctx.fill()}ctx.globalAlpha=1;
  if(m.sleepT>0){ctx.fillStyle='#cfe6ff';ctx.font=`900 ${Math.max(10,size*.16)}px sans-serif`;ctx.textAlign='center';for(let i=0;i<3;i++){const ph=(TIME*.8+i/3)%1;ctx.globalAlpha=1-ph;ctx.fillText('z',x+size*.15+ph*size*.2,y-size*(.75+ph*.35)-fly)}ctx.globalAlpha=1}
  if(m.dreadT>0){ctx.strokeStyle='rgba(180,80,255,.7)';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(x,y,size*.26,size*.08,0,0,6.283);ctx.stroke()}
  if(m.rootT>0){ctx.strokeStyle='#6ad04a';ctx.lineWidth=Math.max(1.5,ss(2.5));for(let i=0;i<4;i++){const a=i*1.57+TIME;ctx.beginPath();ctx.moveTo(x+Math.cos(a)*size*.2,y);ctx.quadraticCurveTo(x+Math.cos(a)*size*.25,y-size*.25,x+Math.cos(a+.6)*size*.12,y-size*.4);ctx.stroke()}}
  if(m.stunT>0){ctx.fillStyle='#ffe066';for(let i=0;i<3;i++){const a=TIME*5+i*2.09;ctx.beginPath();ctx.arc(x+Math.cos(a)*size*.2,y-size*.85-fly+Math.sin(a)*size*.05,Math.max(1.5,size*.04),0,6.283);ctx.fill()}}
  if(m.psn&&m.psn.n>0){const n=m.psn.n,px=x+size*.24,py=y-size*.62-fly;ctx.fillStyle='#4a7a1a';ctx.beginPath();ctx.arc(px,py,Math.max(5,size*.08),0,6.283);ctx.fill();ctx.font=`900 ${Math.max(8,size*.1)}px "Barlow Condensed",sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#d8ff8a';ctx.fillText(n,px,py+.5)}
  if(m.dots.length){ctx.fillStyle='rgba(180,255,90,.8)';const ph=(TIME*1.5+m.id*.3)%1;ctx.globalAlpha=1-ph;ctx.beginPath();ctx.arc(x+size*.12,y-size*(.5+ph*.4)-fly,Math.max(1.5,size*.05),0,6.283);ctx.fill();ctx.globalAlpha=1}
  if(m.hp<m.max||m.boss||m.elite){const bw=size*(m.boss?.9:.55),by=y-size*.92-fly,p=clamp(m.hp/m.max,0,1);ctx.fillStyle='rgba(0,0,0,.75)';ctx.fillRect(x-bw/2-1,by-1,bw+2,Math.max(3,size*.05)+2);ctx.fillStyle=m.boss?'#ff5a4a':m.elite?'#ffcf2e':'#e8473f';ctx.fillRect(x-bw/2,by,bw*p,Math.max(3,size*.05));
    if(m.sh>0){ctx.fillStyle='rgba(235,245,255,.9)';ctx.fillRect(x-bw/2,by-Math.max(2,size*.03)-1,bw*clamp(m.sh/(m.max*.35),0,1),Math.max(2,size*.03))}
    if(m.boss){ctx.font=`700 ${Math.max(10,ss(12))}px Cinzel,serif`;ctx.textAlign='center';ctx.textBaseline='bottom';ctx.fillStyle='#fff';ctx.fillText(MON[m.k].n,x,by-2)}
    else if(m.aff){const A=AFFIX[m.aff];ctx.font=`800 ${Math.max(9,ss(11))}px "Barlow Condensed",sans-serif`;ctx.textAlign='center';ctx.textBaseline='bottom';ctx.lineWidth=3;ctx.strokeStyle='rgba(0,0,0,.85)';ctx.strokeText(A.n,x,by-3);ctx.fillStyle=A.col;ctx.fillText(A.n,x,by-3)}}
}
function drawProj(q){const P0=scr(q.x,q.y),x=P0[0],y=P0[1]-ss(T*.35),big=q.mult>1,s=ss(T)*(big?1.25:1);
  // a fading trail behind every shot, tinted by what it is
  if(!LQ()&&q.kind!=='boulder'&&q.kind!=='flask'){const tr=q.tr||(q.tr=[]);tr.push(x,y);if(tr.length>12)tr.splice(0,2);if(tr.length>=4){const tc=q.kind==='fire'?'255,140,60':q.kind==='ice'?'170,225,255':q.kind==='holy'?'255,230,150':q.kind==='arrow'||q.kind==='bolt'||q.kind==='star'?'255,245,220':q.src&&HEROES[q.src.k]&&HEROES[q.src.k].tr.includes('shadow')?'190,120,255':'120,200,255';
    ctx.save();ctx.globalCompositeOperation='lighter';ctx.lineCap='round';for(let i=2;i<tr.length;i+=2){const t=i/tr.length;ctx.strokeStyle=`rgba(${tc},${t*.55})`;ctx.lineWidth=Math.max(1,ss(q.kind==='arrow'||q.kind==='bolt'?2:5)*t*(big?1.5:1));ctx.beginPath();ctx.moveTo(tr[i-2],tr[i-1]);ctx.lineTo(tr[i],tr[i+1]);ctx.stroke()}ctx.restore()}}
  const PT=scr(q.tx,q.ty),a=Math.atan2(PT[1]-P0[1],PT[0]-P0[0]);
  if(big){ctx.save();ctx.globalCompositeOperation='lighter';const gl=glow('170,140,255');if(gl)ctx.drawImage(gl,x-s*.3,y-s*.3,s*.6,s*.6);ctx.restore()}
  if(q.kind==='arrow'||q.kind==='bolt'){ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.strokeStyle=q.kind==='bolt'?'#d8d0c0':'#e8d4a8';ctx.lineWidth=Math.max(1.5,ss(2.2));ctx.beginPath();ctx.moveTo(-s*.22,0);ctx.lineTo(s*.12,0);ctx.stroke();ctx.fillStyle='#e8eef5';ctx.beginPath();ctx.moveTo(s*.18,0);ctx.lineTo(s*.08,-s*.05);ctx.lineTo(s*.08,s*.05);ctx.fill();ctx.restore();return}
  if(q.kind==='star'){ctx.save();ctx.translate(x,y);ctx.rotate(TIME*20);ctx.fillStyle='#dfe6ee';ctx.beginPath();for(let i=0;i<8;i++){const r=i%2?s*.04:s*.11;ctx.lineTo(Math.cos(i*.785)*r,Math.sin(i*.785)*r)}ctx.fill();ctx.restore();return}
  if(q.kind==='boulder'){const tot=Math.hypot(q.tx-q.sx0,q.ty-q.sy0)||1,pr=1-Math.hypot(q.tx-q.x,q.ty-q.y)/tot,h=Math.sin(clamp(pr,0,1)*Math.PI)*ss(T*2.2);ctx.fillStyle='#8a7a68';ctx.strokeStyle='#2a2018';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y-h,ss(T*.16),0,6.283);ctx.fill();ctx.stroke();return}
  if(q.kind==='flask'){ctx.save();ctx.translate(x,y-Math.sin(clamp(1-Math.hypot(q.tx-q.x,q.ty-q.y)/(T*3),0,1)*Math.PI)*s*.3);ctx.rotate(TIME*12);ctx.fillStyle='#8ad04a';ctx.strokeStyle='#1a2a0a';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,s*.02,s*.07,0,6.283);ctx.fill();ctx.stroke();ctx.fillStyle='#d8c8a0';ctx.fillRect(-s*.025,-s*.09,s*.05,s*.05);ctx.restore();return}
  const col=q.kind==='fire'?'255,120,40':q.kind==='ice'?'150,220,255':q.kind==='holy'?'255,230,140':q.src&&HEROES[q.src.k].tr.includes('shadow')?'190,120,255':'110,200,255';
  ctx.save();ctx.globalCompositeOperation='lighter';const gl=glow(col);if(gl)ctx.drawImage(gl,x-s*.25,y-s*.25,s*.5,s*.5);ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x,y,s*.05,0,6.283);ctx.fill();ctx.restore()}
// effects that lie on the ground are drawn in layout space; the rest stand upright on screen
const FXG=new Set(['ring','nova','hex','fire','roots','ice','poison','breach','cone']);
function drawFx(dt){
  for(const f of FXL){f.t+=dt;const p=Math.min(1,f.t/f.dur),a=1-p,gk=FXG.has(f.k);if(gk)gnd();else upr();const [x,y]=gk?[sx(f.x),sy(f.y)]:scr(f.x,f.y);
    if(f.k==='pillar'){ctx.save();ctx.globalCompositeOperation='lighter';const w=ss(T*.5)*(1-p*.5),g2=ctx.createLinearGradient(0,y-ss(T*4),0,y);g2.addColorStop(0,'rgba(255,230,140,0)');g2.addColorStop(1,`rgba(255,230,140,${a*.8})`);ctx.fillStyle=g2;ctx.fillRect(x-w/2,y-ss(T*4),w,ss(T*4));ctx.restore()}
    else if(f.k==='zz'){ctx.save();ctx.globalAlpha=a;ctx.fillStyle='#cfe6ff';ctx.font=`900 ${Math.max(12,ss(18))}px sans-serif`;ctx.textAlign='center';ctx.fillText('Zz',x,y-ss(T*.9)-p*ss(20));ctx.restore()}
    else if(f.k==='mslash'){ctx.save();ctx.translate(x,y-ss(T*.35));ctx.scale(-(f.face||1),1);ctx.globalAlpha=a;ctx.strokeStyle='#ff5a4a';ctx.lineWidth=Math.max(2,ss(4));ctx.lineCap='round';for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(-ss(T*.18)+i*ss(7),-ss(T*.2));ctx.lineTo(ss(T*.06)+i*ss(7),ss(T*.12));ctx.stroke()}ctx.restore()}
    else if(f.k==='mbolt'){const q=p,bx=lerp(f.x,f.x1,q),by=lerp(f.y,f.y1,q);ctx.save();ctx.globalCompositeOperation='lighter';const gl=glow(f.col==='#8ad8ff'?'140,210,255':f.col==='#b8ffd8'?'160,255,200':'190,110,255');const [BX,BY]=scr(bx,by);if(gl)ctx.drawImage(gl,BX-ss(T*.3),BY-ss(T*.65),ss(T*.6),ss(T*.6));ctx.restore()}
    else if(f.k==='ring'||f.k==='nova'||f.k==='hex'||f.k==='fire'||f.k==='roots'||f.k==='ice'||f.k==='poison'){const r=ss(f.r)*(f.k==='ring'?.6+.4*p:.85+.15*p);ctx.save();ctx.globalAlpha=a*(f.k==='ring'?.9:.55);
      if(f.k!=='ring'){ctx.fillStyle=f.k==='fire'?'rgba(255,110,40,.6)':f.k==='hex'?'rgba(150,80,220,.55)':f.k==='roots'?'rgba(90,200,60,.5)':f.k==='ice'?'rgba(170,225,255,.55)':f.k==='poison'?'rgba(140,210,60,.5)':hexA(f.col,.4);ctx.beginPath();ctx.ellipse(x,y,r,r*VY,0,0,6.283);ctx.fill()}
      ctx.strokeStyle=f.col;ctx.lineWidth=Math.max(2,ss(4)*a);ctx.beginPath();ctx.ellipse(x,y,r,r*VY,0,0,6.283);ctx.stroke();ctx.restore();if(f.k!=='ring'&&!LQ()){upr();const [X,Y]=scr(f.x,f.y);spellFx(f,X,Y,ss(f.r),p,a)}}
    else if(f.k==='breach'){const s=ss(T)*(p<.15?p/.15:1),fa=p>.8?(1-p)/.2:1;ctx.save();ctx.translate(x,y);ctx.scale(1,VY);ctx.globalAlpha=fa;const gr=ctx.createRadialGradient(0,0,0,0,0,s*.55);gr.addColorStop(0,'rgba(10,0,25,.95)');gr.addColorStop(.6,'rgba(110,40,170,.8)');gr.addColorStop(1,'rgba(170,90,255,0)');ctx.fillStyle=gr;ctx.beginPath();ctx.arc(0,0,s*.55,0,6.283);ctx.fill();ctx.strokeStyle='rgba(230,190,255,.8)';ctx.lineWidth=2;for(let i=0;i<3;i++){ctx.rotate(TIME*(2+i));ctx.beginPath();ctx.arc(0,0,s*(.4-i*.1),0,3.6);ctx.stroke()}ctx.restore()}
    else if(f.k==='thorn'){ctx.save();ctx.globalAlpha=a;ctx.fillStyle='#ff6a6a';for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(x+(i-1)*ss(5),y-ss(T*.25)-p*ss(12)-i*ss(3),Math.max(1.2,ss(2.2)),0,6.283);ctx.fill()}ctx.restore()}
    else if(f.k==='corpse')drawCorpse(f,x,y,p,a);
    else if(f.k==='die'){ctx.save();ctx.globalAlpha=a;for(let i=0;i<6;i++){const an=i*1.05,d=ss(f.r)*p;ctx.fillStyle=f.col;ctx.beginPath();ctx.arc(x+Math.cos(an)*d,y-ss(T*.3)+Math.sin(an)*d*VY-ss(10)*p,Math.max(1.5,ss(4)*a),0,6.283);ctx.fill()}ctx.restore();dspr('smoke_04','#5a5048',x,y-ss(T*.3),ss(f.r*2)*(.6+p),ss(f.r*2)*(.6+p),f.x,a*.5)}
    else if(f.k==='slash'&&FXOK()&&dspr('slash_02',f.col==='#ffffff'?'#fff4d8':f.col,x,y-ss(T*.32),ss(T*(f.big?1.3:.85)),ss(T*(f.big?1.3:.85)),(f.face<0?Math.PI:0)+p*.9-.4,a,1)){}
    else if(f.k==='slash'){ctx.save();ctx.translate(x,y-ss(T*.3));ctx.scale(f.face||1,1);ctx.globalAlpha=a;ctx.strokeStyle=f.col;ctx.lineWidth=Math.max(2,ss(f.big?6:3.5));ctx.lineCap='round';ctx.beginPath();ctx.arc(0,0,ss(T*(f.big?.5:.32)),-1.9+p*.6,-.2+p*.6);ctx.stroke();ctx.restore()}
    else if(f.k==='cast'){ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=a;const gl=glow('255,255,255');if(gl)ctx.drawImage(gl,x-ss(T*.5),y-ss(T*1.1)-ss(10)*p,ss(T),ss(T));ctx.strokeStyle=f.col;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,y,ss(T*.45)*(.5+p),ss(T*.45)*(.5+p)*VY,0,0,6.283);ctx.stroke();ctx.restore()}
    else if(f.k==='line'||f.k==='bolt'||f.k==='beam'){ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=a;ctx.strokeStyle=f.mult>1?'#c9a8ff':f.col;ctx.lineWidth=Math.max(2,ss(f.k==='beam'?18:f.k==='line'?7:3))*(f.k==='bolt'?1:a+.3);ctx.lineCap='round';ctx.beginPath();
      if(f.k==='bolt'){const n=5;ctx.moveTo(x,y-ss(T*.35));for(let i=1;i<=n;i++){const t=i/n;const Q=scr(lerp(f.x,f.x1,t),lerp(f.y,f.y1,t));ctx.lineTo(Q[0]+(i<n?(Math.random()-.5)*ss(14):0),Q[1]-ss(T*.35))}}
      else{const Q=scr(f.x1,f.y1);ctx.moveTo(x,y-ss(T*.35));ctx.lineTo(Q[0],Q[1]-ss(T*.35))}ctx.stroke();
      if(f.k==='beam'){ctx.strokeStyle='#ffffff';ctx.lineWidth=Math.max(1,ss(5))*a;ctx.stroke()}
      if(f.mult>1){ctx.font=`900 ${Math.max(12,ss(18))}px Cinzel,serif`;ctx.fillStyle='#e6dcff';ctx.textAlign='center';{const Q=scr((f.x+f.x1)/2,(f.y+f.y1)/2);ctx.fillText('×'+fmt(f.mult),Q[0],Q[1]-ss(T*.6))}}ctx.restore()}
    else if(f.k==='cone'){ctx.save();ctx.globalAlpha=a*.7;ctx.translate(x,y);ctx.scale(1,VY);ctx.fillStyle='rgba(255,120,40,.55)';ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,ss(f.r)*(.6+.4*p),f.a-.65,f.a+.65);ctx.closePath();ctx.fill();ctx.restore()}
    else if(f.k==='star'){ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=a;const gl=glow('255,215,100');if(gl)ctx.drawImage(gl,x-ss(T)*(1+p),y-ss(T)*(1.4+p),ss(T*2)*(1+p),ss(T*2)*(1+p));ctx.restore()}}
  upr();for(let i=FXL.length-1;i>=0;i--)if(FXL[i].t>=FXL[i].dur)FXL.splice(i,1)}
function render(dt){
  if(!ctx||!R)return;TIME+=dt;if(bgDirty||!BG)buildBG();
  let shx=0,shy=0;if(SHK>0){shx=(Math.random()-.5)*SHK;shy=(Math.random()-.5)*SHK;SHK=Math.max(0,SHK-dt*40)}BASEM=[DPR,0,0,DPR,shx*DPR,shy*DPR];ctx.save();upr();
  if(BG)ctx.drawImage(BG,0,0,W,H);
  gnd();drawLiveTerrain();drawRoute();drawPortals();drawRunes();
  if(R.b)for(const tp of R.b.traps){const x=sx(tp.x),y=sy(tp.y),s=ss(T*.35);ctx.strokeStyle='#9aff6a';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,y,s,s*VY,0,0,6.283);ctx.stroke();for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(i*1.57+.78)*s,y+Math.sin(i*1.57+.78)*s*VY);ctx.stroke()}}
  if(R.b)for(const z of R.b.zones){const x=sx(z.x),y=sy(z.y),r=ss(z.r),a=Math.min(1,z.t);ctx.save();ctx.globalAlpha=.32*a;ctx.fillStyle='#7ac03a';ctx.beginPath();ctx.ellipse(x,y,r,r*VY,0,0,6.283);ctx.fill();ctx.globalAlpha=.6*a;ctx.strokeStyle='#b8f06a';ctx.lineWidth=1.5;ctx.setLineDash([5,6]);ctx.lineDashOffset=TIME*12;ctx.stroke();ctx.setLineDash([]);
    if(!LQ())for(let i=0;i<5;i++){const ph=(TIME*.7+i*.2)%1,an=i*1.26+z.x;ctx.globalAlpha=a*(1-ph)*.8;ctx.fillStyle='#c8ff7a';ctx.beginPath();ctx.arc(x+Math.cos(an)*r*.55,y+Math.sin(an)*r*.55*VY-ph*ss(T*.5),Math.max(1.5,ss(3.5)),0,6.283);ctx.fill()}ctx.restore()}
  drawPlacement();if(R.phase==='wave')for(const h of R.board)if(h.k==='templar'&&!h.ko)for(let rr=0;rr<ROWS;rr++)for(let cc=0;cc<COLS;cc++){if(Math.hypot(hx(cc,rr)-hx(h.c,h.r),hy(rr)-hy(h.r))<T*2.1){hexPath(ctx,cc,rr,.9);ctx.fillStyle=`rgba(255,230,140,${.07+.03*Math.sin(TIME*3)})`;ctx.fill()}}
  upr();
  // everything that stands on the field, back to front
  const list=[],dep=(x,y)=>scr(x,y)[1];for(const o of R.field.obs)list.push({y:dep(hx(o.c,o.r),hy(o.r)),o});for(const h of R.board)if(!(DRAG&&DRAG.h===h))list.push({y:dep(hx(h.c,h.r),hy(h.r)),h});if(R.b)for(const m of R.b.mons)if(m.hp>0)list.push({y:dep(m.x,m.y)+(m.fly?ss(T*1.2):0),m});
  list.sort((a,b)=>a.y-b.y);
  for(const it of list){if(it.o){const o=it.o,d=(OBS_SETS[o.a??R.act]||OBS_SETS[0])[o.k%6],[x,y0]=scr(hx(o.c,o.r),hy(o.r)),y=y0+ss(T*.12),s=ss(T*1.35*d[2]);ctx.fillStyle='rgba(0,0,0,.25)';ctx.beginPath();ctx.ellipse(x,y,s*.32,s*.1,0,0,6.283);ctx.fill();const f=frame(d[0],d[0]==='props2'?160:192,d[1],s*DPR);if(f)ctx.drawImage(f,x-s/2,y-s*.86,s,s);else{ctx.fillStyle='#6a6a60';ctx.fillRect(x-s*.2,y-s*.4,s*.4,s*.4)}
      if(d[0]==='props2'&&d[1]===11){ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.5+.2*Math.sin(TIME*7+o.c);const gl=glow('255,140,40');if(gl)ctx.drawImage(gl,x-s*.35,y-s*.75,s*.7,s*.6);ctx.restore()}}
    else if(it.h){const h=it.h,[x,y0]=scr(hx(h.c,h.r),hy(h.r)),lift=drawPlatform(h),yb=y0-lift;if(h.tauntT>0&&R.phase==='wave'){ctx.strokeStyle=`rgba(255,90,58,${.4+.3*Math.sin(TIME*8)})`;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,yb,ss(T*.42),ss(T*.42)*VY,0,0,6.283);ctx.stroke()}
      drawHeroAt(h,x,yb+ss(T*.12),ss(T*1.62*(HEROES[h.k].sz||1)),0,R.phase==='wave');drawHeroItems(h,x,yb+ss(T*.36),ss(T*1.45));
      if(R.phase==='wave'&&!h.ko){const D=HEROES[h.k],y=yb-ss(T*1.18),bw=ss(T*.6),bh=Math.max(2,ss(4));ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillRect(x-bw/2-1,y-bh-2,bw+2,bh*2+3);
        if(h.hpMax){const p=clamp(h.hp/h.hpMax,0,1);ctx.fillStyle=h.hurtT>0?'#ffffff':p>.5?'#5fd16a':p>.25?'#ffc04a':'#ff4a4a';ctx.fillRect(x-bw/2,y-bh-1,bw*p,bh)}
        ctx.fillStyle='#4ab8ff';ctx.fillRect(x-bw/2,y+1,bw*clamp(h.mana/D.mana,0,1),bh)}}
    else drawMon(it.m)}
  drawSpawnAndKeep();
  if(R.b)for(const q of R.b.projs)drawProj(q);
  drawFx(dt);drawAmbient(dt);drawBench();
  // floating text
  ctx.textAlign='center';ctx.textBaseline='middle';for(const t of TXT){t.life-=dt;const a=clamp(t.life*2,0,1),fs=Math.max(11,ss(15))*t.s*(t.life>1?1.2:1);ctx.globalAlpha=a;ctx.font=`800 ${fs}px "Barlow Condensed",sans-serif`;ctx.lineWidth=3;ctx.strokeStyle='rgba(0,0,0,.85)';const [tx0,ty0]=scr(t.x,t.y),y=ty0-ss(T*.4)-(1.1-t.life)*ss(26);ctx.strokeText(t.t,tx0,y);ctx.fillStyle=t.col;ctx.fillText(t.t,tx0,y)}ctx.globalAlpha=1;for(let i=TXT.length-1;i>=0;i--)if(TXT[i].life<=0)TXT.splice(i,1);
  if(BANNER){BANNER.life-=dt;const a=clamp(BANNER.life,0,1),fs=Math.min(W/16,42);ctx.globalAlpha=a;ctx.font=`900 ${fs}px Cinzel,serif`;ctx.lineWidth=6;ctx.strokeStyle='rgba(0,0,0,.8)';const bY=ROT?fieldBox().t+(fieldBox().b-fieldBox().t)*.3:sy(FH*.25);ctx.strokeText(BANNER.t,W/2,bY);ctx.fillStyle=BANNER.col;ctx.fillText(BANNER.t,W/2,bY);ctx.globalAlpha=1;if(BANNER.life<=0)BANNER=null}
  drawTimeStop();drawBossIntro();drawTutHand();drawDrag();ctx.restore()}
// a boss arrives: letterbox bars, its portrait and title slide in, the world slows down
function drawBossIntro(){const I=R.b&&R.b.intro;if(!I)return;const p=I.t/I.dur,inn=Math.min(1,I.t/.35),out=p>.8?(1-p)/.2:1,a=inn*out,bh=H*.13*a;
  ctx.save();ctx.fillStyle='rgba(0,0,0,.85)';ctx.fillRect(0,0,W,bh);ctx.fillRect(0,H-bh,W,bh);ctx.fillStyle=`rgba(20,0,10,${.35*a})`;ctx.fillRect(0,bh,W,H-bh*2);
  // sideways: the boss on the left, its name beside it. Upright: the boss above, the text centred under it.
  const D=MON[I.k],P=ROT,cx=W/2,cy=P?H*.36:H*.46,sz=P?Math.min(H*.3,W*.62):Math.min(H*.5,W*.3),f=frame('m_'+I.k,160,((TIME*4)|0)%6,sz*DPR),slide=(1-inn)*W*.3,ix=P?cx-sz/2-slide:cx-sz*.75-slide;
  if(f){ctx.globalAlpha=a;ctx.save();ctx.globalCompositeOperation='lighter';const gl=glow(I.k==='devourer'?'150,60,255':'255,80,50');if(gl)ctx.drawImage(gl,ix-sz*.05,cy-sz*.75,sz*1.6*(P?.7:1),sz*1.3);ctx.restore();ctx.drawImage(f,ix,cy-sz*.7,sz,sz)}
  const tx=P?cx+slide:cx+sz*.05+slide,y0=P?cy+sz*.5:cy,nf=P?Math.min(W/12,H*.05):Math.min(W/14,H*.085);ctx.globalAlpha=a;ctx.textAlign=P?'center':'left';ctx.textBaseline='alphabetic';ctx.font=`700 ${Math.max(11,P?W/26:H*.035)}px "Barlow Condensed",sans-serif`;ctx.fillStyle='#ffb0a0';ctx.fillText((EPITHET[I.k]||'').toUpperCase(),tx,y0-nf*.45);
  ctx.font=`900 ${nf}px Cinzel,serif`;ctx.lineWidth=5;ctx.strokeStyle='rgba(0,0,0,.9)';ctx.strokeText(D.n,tx,y0+nf*.6);ctx.fillStyle=I.k==='devourer'?'#d6a8ff':'#ffd76a';ctx.fillText(D.n,tx,y0+nf*.6);
  if(D.sig){const sf=Math.max(12,P?W/27:Math.min(W/42,H*.045));ctx.font=`700 ${sf}px "Barlow Condensed",sans-serif`;ctx.fillStyle='#ffe9b0';ctx.lineWidth=3;const t=D.sig.n+': '+D.sig.d,mw=P?W-36:W-tx-14,words=t.split(' ');let line='',yy=y0+nf*.6+sf*1.7;const put=()=>{ctx.strokeText(line.trim(),tx,yy);ctx.fillText(line.trim(),tx,yy)};for(const w of words){if(ctx.measureText(line+w).width>mw&&line){put();yy+=sf*1.25;line=''}line+=w+' '}put()}ctx.restore()}
function drawBench(){
  const n=R.bench.length;if(ZM.z>1){const a=benchSlot(0),b=benchSlot(n-1);ctx.fillStyle='rgba(15,10,7,.78)';ctx.fillRect(a.x-a.w*.6,a.y-a.w*.42,b.x-a.x+a.w*1.2,a.w*.82)}for(let i=0;i<n;i++){const b=benchSlot(i),h=R.bench[i];ctx.fillStyle=DRAG&&DRAG.overBench===i?'rgba(255,215,106,.25)':'rgba(0,0,0,.32)';ctx.strokeStyle='rgba(255,230,180,.25)';ctx.lineWidth=1;
    const w=b.w*.92,hh=b.w*.66;ctx.beginPath();ctx.roundRect?ctx.roundRect(b.x-w/2,b.y-hh*.55,w,hh,6):ctx.rect(b.x-w/2,b.y-hh*.55,w,hh);ctx.fill();ctx.stroke();
    if(h&&!(DRAG&&DRAG.h===h)){drawHeroAt(h,b.x,b.y+hh*.3,b.w*1.05);drawHeroItems(h,b.x,b.y-hh*.42,b.w*1.05)}}
  drawItems();
  // rune stones waiting to be placed
  drawRuneRack();R.stones.forEach((v,i)=>{if(i>3)return;if(DRAG&&DRAG.stone===i)return;const p=stoneSlot(i);ctx.save();ctx.globalCompositeOperation='lighter';const gl=glow('120,170,255');if(gl)ctx.drawImage(gl,p.x-p.s,p.y-p.s,p.s*2,p.s*2);ctx.restore();ctx.fillStyle='#2a3a6a';ctx.strokeStyle='#9cc4ff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y,p.s*.55,0,6.283);ctx.fill();ctx.stroke();
    ctx.font=`900 ${p.s*.6}px Cinzel,serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#e6eeff';ctx.fillText('×'+v,p.x,p.y+1)})}
function stoneSlot(i){const B=bottomLayout(),col=i%2,row=((i/2)|0)%2;return{x:B.Rr-B.runeW+B.s*.56+col*B.s*1.12,y:B.iy-B.s*.56+row*B.s*1.12,s:B.s*.95}}
function drawRuneRack(){const B=bottomLayout(),s=B.s,x0=B.Rr-B.runeW,y0=B.iy-s*1.18;ctx.save();ctx.fillStyle='rgba(12,16,30,.7)';ctx.strokeStyle=R.stones.length?`rgba(156,196,255,${.5+.3*Math.sin(TIME*4)})`:'rgba(156,196,255,.25)';ctx.lineWidth=R.stones.length?2:1.2;
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
function drawCorpse(f,x,y,p,a){const size=ss(T*1.42*(f.sz||1))*(f.boss?1.15:1),fr=frame('m_'+f.mk,160,0,size*DPR);if(!fr)return;const fly=f.fly?ss(T*.55)*(1-p):0;
  ctx.save();ctx.globalAlpha=a*a;ctx.translate(x,y-fly+p*size*.12);ctx.rotate((f.face<0?-1:1)*Math.min(1,p*2.2)*1.25);if(f.face<0)ctx.scale(-1,1);ctx.drawImage(fr,-size/2,-size*.86,size,size);ctx.restore()}
