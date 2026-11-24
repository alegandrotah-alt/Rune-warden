// ---------- ember layer: living pixel outlines on the menus, rooms, rewards and the map ----------
// A low-resolution canvas laid over the page and scaled up with hard pixels, so everything on it reads as pixel
// art. While a screen is open its panel and the choices on it get a living outline, and the effect fits the
// screen: fire on the menu and at a rest, gold glints on rewards and at the merchant, starlight in the temple and
// on relic picks, mist at events, the void at the Rift's gates, ash on defeat. Each god's card carries its own
// (Solenne's rising light, Morrow's shadow, Sylvara's leaves, Vexis's bubbles, Aurion's stars, Korrun's forge
// sparks, Hessa's wind, Grakka's war-fire), and the act map wears its act's weather. Fire uses the old "doom fire"
// heat strip; everything else is pixel particles. Nothing runs while no screen is open.
const EMB={px:3,sp:[],pp:[],t:0,c:null,x:null,w:0,h:0,img:null,buf:null,tint:new WeakMap(),fire:new WeakMap(),pal:{},on:true,vis:0};
const FRAMP=[[70,16,10],[150,38,16],[224,84,26],[255,150,46],[255,214,100],[255,248,210]];
// every effect: its colour, the colour of the glowing frame, how many particles per second per 100 pixels of
// outline, and (for the screen as a whole) what drifts across it
const ESTY={
  fire:{c:[255,150,46],amb:'ember'},
  war:{c:[255,70,50],fire:[255,40,30],amb:'ember'},
  spark:{c:[255,214,110],rate:10},
  star:{c:[200,222,255],rate:11,amb:'twinkle'},
  holy:{c:[255,236,170],rate:12},
  mist:{c:[180,190,215],rate:16},
  leaf:{c:[130,215,90],rate:8,amb:'leaf'},
  bubble:{c:[150,240,110],rate:5},
  snow:{c:[225,242,255],rate:9,amb:'snow'},
  forge:{c:[255,180,80],rate:13},
  wind:{c:[225,205,150],rate:4},
  void:{c:[190,90,255],rate:11,amb:'void'},
  ash:{c:[150,146,140],rate:3,amb:'ash'},
  firefly:{c:[220,255,120],rate:4},
};
// each god's card wears its god's effect
const DSTY={solenne:'holy',morrow:'mist',sylvara:'leaf',vexis:'bubble',aurion:'star',korrun:'forge',hessa:'wind',grakka:'war'};
// the act map wears its act's weather (the same kinds as the field's ambient particles, AMBK in 06-render.js)
const MSTY=['mist','firefly','fire','bubble','snow','wind'];
function embInit(){if(!DOM||EMB.c)return;const c=document.createElement('canvas');c.id='emberC';c.setAttribute('aria-hidden','true');document.body.appendChild(c);EMB.c=c;EMB.x=c.getContext('2d');
  // the page scrolls on its own thread, a frame ahead of this canvas: while it moves, the effects on the choices pause
  EMB.scr=0;document.addEventListener('scroll',()=>{EMB.scr=performance.now()},{capture:true,passive:true});
  try{if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)EMB.on=false}catch(e){}}
function embSize(){const w=Math.ceil(innerWidth/EMB.px),h=Math.ceil(innerHeight/EMB.px);if(w!==EMB.w||h!==EMB.h){EMB.w=EMB.c.width=w;EMB.h=EMB.c.height=h;EMB.img=EMB.x.createImageData(w,h);EMB.buf=new Uint32Array(EMB.img.data.buffer)}}
function embHex(s){s=(s||'').trim();const m=/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(s);if(!m)return null;let v=m[1];if(v.length===3)v=v.split('').map(q=>q+q).join('');return[parseInt(v.slice(0,2),16),parseInt(v.slice(2,4),16),parseInt(v.slice(4,6),16)]}
function embTint(el){if(EMB.tint.has(el))return EMB.tint.get(el);let t=null;try{t=embHex(getComputedStyle(el).getPropertyValue('--c'))}catch(e){}EMB.tint.set(el,t);return t}
const ergb=(c,k=1)=>`rgb(${Math.min(255,c[0]*k)|0},${Math.min(255,c[1]*k)|0},${Math.min(255,c[2]*k)|0})`;
const mixc=(a,b,k)=>b?[a[0]+(b[0]-a[0])*k,a[1]+(b[1]-a[1])*k,a[2]+(b[2]-a[2])*k]:a;
// ---- fire: 32 colours from cold (0) to white hot (31), pulled toward a tint in the middle, as RGBA words ----
function embPal(t){const key=t?t.join():'-';if(EMB.pal[key])return EMB.pal[key];const P=new Uint32Array(32);
  for(let i=0;i<32;i++){const h=i/31,f=h*(FRAMP.length-1),j=Math.min(FRAMP.length-2,f|0),u=f-j,A=FRAMP[j],B=FRAMP[j+1];let c=[A[0]+(B[0]-A[0])*u,A[1]+(B[1]-A[1])*u,A[2]+(B[2]-A[2])*u];
    if(t){const k=Math.max(0,1-Math.abs(h-.5)*2.4)*.9;c=c.map((v,q)=>v+(t[q]-v)*k)}const al=Math.min(255,h*3.2*255)|0;P[i]=(al<<24|(c[2]|0)<<16|(c[1]|0)<<8|(c[0]|0))>>>0}
  return EMB.pal[key]=P}
function embStrip(el,w,H){let f=EMB.fire.get(el);if(!f||f.w!==w||f.H!==H){f={w,H,a:new Float32Array(w*H),fuel:new Float32Array(w)};for(let x=0;x<w;x++)f.fuel[x]=Math.random();EMB.fire.set(el,f)}return f}
function embBurn(f,heat,cool){const {w,H,a,fuel}=f;
  for(let x=0;x<w;x++){const nb=x>0?fuel[x-1]:fuel[x];fuel[x]+=(Math.random()-.5)*.5+(nb-fuel[x])*.3;fuel[x]=fuel[x]<0?0:fuel[x]>1?1:fuel[x];const q=fuel[x]*fuel[x];a[(H-1)*w+x]=heat*(.18+.82*q)}
  for(let y=0;y<H-1;y++)for(let x=0;x<w;x++){const r=Math.random(),nx=x+((r*3)|0)-1;if(nx<0||nx>=w)continue;const v=a[(y+1)*w+x]-r*cool;a[y*w+nx]=v>0?v:0}}
function embPaint(f,x0,y0,pal,cy0,cy1){const {w,H,a}=f,B=EMB.buf,W=EMB.w,Hh=EMB.h;
  for(let y=0;y<H;y++){const sy=y0-(H-1)+y;if(sy<0||sy>=Hh||sy<cy0||sy>cy1)continue;const row=sy*W;
    for(let x=0;x<w;x++){const v=a[y*w+x];if(v<.04)continue;const sx=x0+x;if(sx<0||sx>=W)continue;B[row+sx]=pal[Math.min(31,(v*31)|0)]}}}
// ---- the outline itself: a thin glowing frame with cut corners, flickering ----
function embFrame(r,c,al){const P=EMB.px,X=EMB.x,x0=Math.round(r.left/P),y0=Math.round(r.top/P),x1=Math.round(r.right/P)-1,y1=Math.round(r.bottom/P)-1;if(x1-x0<6||y1-y0<6)return;
  X.globalAlpha=al*(.7+.3*Math.sin(EMB.t*9+x0)*Math.sin(EMB.t*5.3+y0));X.fillStyle=ergb(c,.85);
  X.fillRect(x0+2,y0,x1-x0-3,1);X.fillRect(x0+2,y1,x1-x0-3,1);X.fillRect(x0,y0+2,1,y1-y0-3);X.fillRect(x1,y0+2,1,y1-y0-3);X.fillRect(x0+1,y0+1,1,1);X.fillRect(x1-1,y0+1,1,1);X.fillRect(x0+1,y1-1,1,1);X.fillRect(x1-1,y1-1,1,1);X.globalAlpha=1}
// ---- particles: born on an outline (or above it), each kind moving and drawn its own way ----
// a point on the outline of box (low-res pixels), favouring the top edge, with the outward direction there
function embEdge(b,top){const w=b.x1-b.x0,h=b.y1-b.y0,u=Math.random()*(w*(top?3:2)+h*2);
  if(u<w*(top?3:1))return[b.x0+Math.random()*w,b.y0,0,-1];if(!top&&u<w*2)return[b.x0+Math.random()*w,b.y1,0,1];
  const y=b.y0+Math.random()*h;return Math.random()<.5?[b.x0,y,-1,0]:[b.x1,y,1,0]}
function embBorn(k,b,c){if(EMB.pp.length>(PERF.low?280:700))return;const R_=Math.random,p={k,c,l:0,ph:R_()*6,s:1};let e;
  switch(k){
    case'spark':case'star':e=embEdge(b);p.x=e[0]+e[2]*R_()*2;p.y=e[1]+e[3]*R_()*2;p.L=.5+R_()*.6;p.s=k==='star'&&R_()<.35?2:1;p.vy=k==='star'?-3:0;break;
    case'holy':p.x=b.x0+2+R_()*(b.x1-b.x0-4);p.y=b.y0;p.vy=-(9+R_()*10);p.L=.5+R_()*.5;break;
    case'mist':e=embEdge(b);p.x=e[0];p.y=e[1];p.vx=e[2]*(2+R_()*3)+(R_()-.5)*3;p.vy=e[3]*(2+R_()*3)-1.5;p.L=1.2+R_()*1.2;p.s=R_()<.5?2:3;break;
    case'leaf':e=embEdge(b,1);p.x=e[0];p.y=e[1]-1;p.vx=(R_()-.5)*6;p.vy=4+R_()*5;p.L=1.4+R_()*1;p.c=R_()<.3?[230,170,60]:R_()<.5?mixc(c,[60,140,50],.4):c;break;
    case'bubble':p.x=b.x0+2+R_()*(b.x1-b.x0-4);p.y=b.y0;p.vy=-(5+R_()*6);p.L=.9+R_()*.8;p.s=R_()<.4?2:1;break;
    case'snow':p.x=b.x0+R_()*(b.x1-b.x0);p.y=b.y0-6-R_()*16;p.vx=(R_()-.5)*3;p.vy=5+R_()*4;p.L=4;p.land=b.y0-1;break;
    case'forge':e=embEdge(b);p.x=e[0];p.y=e[1];p.vx=e[2]*(8+R_()*14)+(R_()-.5)*16;p.vy=-(14+R_()*22)+e[3]*6;p.L=.5+R_()*.5;break;
    case'wind':p.x=b.x0-4+R_()*(b.x1-b.x0)*.6;p.y=b.y0-R_()*4;p.vx=30+R_()*28;p.L=.45+R_()*.4;p.s=3+(R_()*5|0);break;
    case'void':e=embEdge(b);const d=6+R_()*9;p.x=e[0]+e[2]*d+(e[2]?0:(R_()-.5)*4);p.y=e[1]+e[3]*d+(e[3]?0:(R_()-.5)*4);p.vx=-e[2]*d/0.8;p.vy=-e[3]*d/0.8;p.L=.8;break;
    case'ash':p.x=b.x0+R_()*(b.x1-b.x0);p.y=b.y0-4-R_()*10;p.vx=(R_()-.5)*4;p.vy=3+R_()*4;p.L=2.5+R_()*2;break;
    case'firefly':e=embEdge(b);p.x=e[0]+e[2]*3;p.y=e[1]+e[3]*3;p.L=2+R_()*2;p.vx=(R_()-.5)*4;p.vy=(R_()-.5)*4;break;
    default:return}
  EMB.pp.push(p)}
// emit k-particles along box r (screen pixels) at rate (per second per 100 outline pixels)
function embEmit(k,r,c,mul,dt,clip){const S=ESTY[k];if(!S||S.fire)return;const P=EMB.px,b={x0:r.left/P,y0:r.top/P,x1:r.right/P,y1:r.bottom/P};
  if(clip&&(r.bottom<clip.top||r.top>clip.bottom))return;let n=((b.x1-b.x0)*2+(b.y1-b.y0)*2)/100*(S.rate||5)*mul*dt;while(n>0){if(Math.random()<n)embBorn(k,b,c||S.c);n--}}
function embDraw(dt){const X=EMB.x,T=EMB.t;
  for(let i=EMB.pp.length-1;i>=0;i--){const p=EMB.pp[i];p.l+=dt;if(p.l>p.L){EMB.pp.splice(i,1);continue}const a=p.l/p.L,c=p.c;let al=1;
    switch(p.k){
      case'spark':case'star':{p.y+=(p.vy||0)*dt;const s=a<.5?a*2:(1-a)*2;X.globalAlpha=s;X.fillStyle=ergb(c,1.25);const x=p.x|0,y=p.y|0;X.fillRect(x,y,1,1);
        if(s>.45){X.globalAlpha=s*.8;X.fillStyle=ergb(c);const L=p.s+(s>.8?1:0);X.fillRect(x-L,y,L,1);X.fillRect(x+1,y,L,1);X.fillRect(x,y-L,1,L);X.fillRect(x,y+1,1,L)}continue}
      case'holy':p.y+=p.vy*dt;X.globalAlpha=(a<.2?a*5:1)*(1-a);X.fillStyle=ergb(c,1.1);X.fillRect(p.x|0,p.y|0,1,3);X.globalAlpha*=.5;X.fillRect(p.x|0,(p.y|0)+3,1,2);continue;
      case'mist':p.x+=p.vx*dt;p.y+=p.vy*dt;X.globalAlpha=Math.sin(a*Math.PI)*.55;X.fillStyle=ergb(c);X.fillRect(p.x|0,p.y|0,p.s,p.s-1||1);continue;
      case'leaf':p.x+=(p.vx+Math.sin(T*3+p.ph)*6)*dt;p.y+=p.vy*dt;X.globalAlpha=a>.75?(1-a)*4:1;X.fillStyle=ergb(c);if(Math.sin(T*6+p.ph)>0)X.fillRect(p.x|0,p.y|0,2,1);else X.fillRect(p.x|0,p.y|0,1,2);continue;
      case'bubble':{p.y+=p.vy*dt;p.x+=Math.sin(T*5+p.ph)*dt*4;const x=p.x|0,y=p.y|0;X.fillStyle=ergb(c);
        if(a>.88){X.globalAlpha=.9;X.fillRect(x-2,y-2,1,1);X.fillRect(x+2,y-2,1,1);X.fillRect(x-2,y+2,1,1);X.fillRect(x+2,y+2,1,1);continue}
        X.globalAlpha=.85;if(p.s>1){X.fillRect(x-1,y-2,3,1);X.fillRect(x-1,y+2,3,1);X.fillRect(x-2,y-1,1,3);X.fillRect(x+2,y-1,1,3);X.globalAlpha=.6;X.fillStyle='#fff';X.fillRect(x-1,y-1,1,1)}else{X.fillRect(x,y-1,1,1);X.fillRect(x-1,y,1,1);X.fillRect(x+1,y,1,1);X.fillRect(x,y+1,1,1)}continue}
      case'snow':if(p.y<p.land){p.y+=p.vy*dt;p.x+=(p.vx+Math.sin(T*2+p.ph)*2)*dt}else if(!p.st){p.st=p.l;p.y=p.land}al=p.st?Math.max(0,1-(p.l-p.st)/1.2):Math.min(1,p.l*3);if(p.st&&al<=0){p.l=p.L}X.globalAlpha=al;X.fillStyle=ergb(c);X.fillRect(p.x|0,p.y|0,1,1);continue;
      case'forge':p.vy+=70*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;X.globalAlpha=1-a;X.fillStyle=ergb(a<.4?[255,245,200]:c);X.fillRect(p.x|0,p.y|0,1,1);X.globalAlpha=(1-a)*.5;X.fillRect((p.x-p.vx*.03)|0,(p.y-p.vy*.03)|0,1,1);continue;
      case'wind':p.x+=p.vx*dt;X.globalAlpha=Math.sin(a*Math.PI)*.8;X.fillStyle=ergb(c);X.fillRect(p.x|0,p.y|0,p.s,1);continue;
      case'void':p.x+=p.vx*dt;p.y+=p.vy*dt;X.globalAlpha=Math.min(1,a*2.5);X.fillStyle=a>.8?'#fff':ergb(c,.6+a*.6);X.fillRect(p.x|0,p.y|0,1,1);continue;
      case'ash':p.x+=(p.vx+Math.sin(T*1.5+p.ph)*2)*dt;p.y+=p.vy*dt;X.globalAlpha=Math.sin(a*Math.PI)*.75;X.fillStyle=ergb(c,.8+Math.sin(p.ph)*.2);X.fillRect(p.x|0,p.y|0,1,1);continue;
      case'firefly':p.x+=(p.vx+Math.sin(T*1.3+p.ph)*3)*dt;p.y+=(p.vy+Math.cos(T*1.1+p.ph)*3)*dt;X.globalAlpha=Math.max(0,Math.sin(T*4+p.ph))*Math.sin(a*Math.PI);X.fillStyle=ergb(c,1.15);X.fillRect(p.x|0,p.y|0,1,1);X.globalAlpha*=.35;X.fillRect((p.x|0)-1,p.y|0,3,1);X.fillRect(p.x|0,(p.y|0)-1,1,3);continue}}
  X.globalAlpha=1}
// what drifts across the whole screen behind a style
function embAmb(kind,dt){if(!kind)return;const W=EMB.w,H=EMB.h,cap=PERF.low?16:36;if(EMB.sp.length>=cap||Math.random()>=dt*14)return;const R_=Math.random;
  const s={k:kind,ph:R_()*6,l:0};
  if(kind==='ember'){s.x=R_()*W;s.y=H+2;s.vy=-(6+R_()*10);s.L=4+R_()*5}
  else if(kind==='snow'){s.x=R_()*W;s.y=-2;s.vy=8+R_()*8;s.L=12}
  else if(kind==='ash'){s.x=R_()*W;s.y=-2;s.vy=4+R_()*5;s.L=14}
  else if(kind==='leaf'){if(R_()<.6)return;s.x=R_()*W;s.y=-2;s.vy=7+R_()*6;s.L=12}
  else if(kind==='void'){s.x=R_()*W;s.y=R_()*H;s.vy=-2;s.L=2+R_()*2}
  else if(kind==='twinkle'){s.x=R_()*W;s.y=R_()*H;s.vy=0;s.L=1+R_()}
  EMB.sp.push(s)}
function embAmbDraw(dt){const X=EMB.x,T=EMB.t;
  for(let i=EMB.sp.length-1;i>=0;i--){const s=EMB.sp[i];s.l+=dt;s.y+=s.vy*dt;if(s.l>s.L||s.y<-3||s.y>EMB.h+3){EMB.sp.splice(i,1);continue}const a=s.l/s.L;
    if(s.k==='ember'){s.x+=Math.sin(T*1.7+s.ph)*dt*5;X.globalAlpha=Math.min(1,a*4)*(1-a)*(.55+.45*Math.sin(T*11+s.ph));X.fillStyle=a<.5?'#ffcf6a':'#ff7a30'}
    else if(s.k==='snow'){s.x+=Math.sin(T*1.2+s.ph)*dt*6;X.globalAlpha=.8;X.fillStyle='#e8f4ff'}
    else if(s.k==='ash'){s.x+=Math.sin(T*.9+s.ph)*dt*5;X.globalAlpha=.55;X.fillStyle='#8f8a84'}
    else if(s.k==='leaf'){s.x+=Math.sin(T*2+s.ph)*dt*10;X.globalAlpha=.85;X.fillStyle=s.ph>3?'#d9a04a':'#7fc25a';X.fillRect(s.x|0,s.y|0,Math.sin(T*5+s.ph)>0?2:1,1);continue}
    else if(s.k==='void'){X.globalAlpha=Math.sin(a*Math.PI)*.8;X.fillStyle=s.ph>3?'#c890ff':'#5a2a90'}
    else if(s.k==='twinkle'){X.globalAlpha=Math.sin(a*Math.PI)*.8;X.fillStyle='#dfe8ff'}
    X.fillRect(s.x|0,s.y|0,1,1)}
  X.globalAlpha=1}
// which effect fits the open screen
function embTheme(ov){const id=ov.id;
  if(id==='ovStart')return'fire';
  if(id==='ovRoom'){const t=R&&R.room&&R.room.t;return{deity:'star',oracle:'star',rest:'fire',merchant:'spark',treasure:'spark',event:'mist',gate:'void',devour:'void'}[t]||'mist'}
  if(id==='ovMap'){if(R&&(R.rift||R.final))return'void';const bk=R?actD(R.act).obs??R.act:0;return MSTY[bk]||'mist'}
  if(id==='ovReward')return'spark';
  if(id==='ovPick'||id==='ovCn')return'star';
  if(id==='ovEnd')return ov.dataset.win==='1'?'spark':'ash';
  return null}
// what lives on the open screen
function embTargets(still){const ov=[...document.querySelectorAll('.overlay:not([hidden])')].filter(o=>!o.classList.contains('tipov')).pop();if(!ov)return embHud();
  const k=embTheme(ov),card=ov.querySelector('.card');if(!k||!card)return null;const T={k,el:card,card:card.getBoundingClientRect(),opts:[],rings:[]};
  if(still)for(const el of ov.querySelectorAll('#roomList>button:not(:disabled),#pickList>button:not(:disabled),#rwHeroes>*,.dcard.on')){const dk=el.dataset.dy||(el.classList.contains('dcard')?el.dataset.k:null);
    T.opts.push({el,r:el.getBoundingClientRect(),t:dk&&DEITIES[dk]?embHex(DEITIES[dk].col):embTint(el),k:dk&&DSTY[dk]||k,on:el.classList.contains('on')||document.activeElement===el||el.matches(':hover')})}
  if(still)for(const el of ov.querySelectorAll('.mn.can,.mn.boss'))T.rings.push({el,r:el.getBoundingClientRect(),t:el.classList.contains('boss')?[190,80,255]:embTint(el),boss:el.classList.contains('boss')});
  return T}
// no screen open: between fights the FIGHT button burns, so the next step is always lit
function embHud(){if(!R||R.phase!=='plan'||TUT)return null;const b=$('fightB');if(!b||!b.offsetParent||b.disabled||b.classList.contains('speed'))return null;const r=b.getBoundingClientRect();if(!r.width)return null;
  return{hud:1,k:'fire',el:b,card:r,opts:[],rings:[]}}
function emberTick(dt0){if(!DOM)return;if(!EMB.c)embInit();if(!EMB.c)return;
  // drawn 30 times a second: pixel art looks the same and it costs half
  EMB.ft=(EMB.ft||0)+dt0;if(EMB.ft<1/31)return;const dt=Math.min(.1,EMB.ft);EMB.ft=0;
  const still=performance.now()-(EMB.scr||0)>160,T=EMB.on?embTargets(still):null;
  // nothing to show: drop what is left too, so the full-screen layer switches off at once (it costs a
  // compositing pass every frame while it is shown)
  if(!T){EMB.sp.length=0;EMB.pp.length=0;if(EMB.vis){EMB.c.style.display='none';EMB.vis=0}return}
  if(EMB.k!==T.k){EMB.sp.length=0;EMB.pp.length=0;EMB.k=T.k}
  if(!EMB.vis){EMB.c.style.display='';EMB.vis=1}embSize();EMB.t+=dt;const P=EMB.px,X=EMB.x;
  EMB.buf.fill(0);const draws=[],C=T.card,cy0=Math.floor(C.top/P),cy1=Math.ceil(C.bottom/P),S=ESTY[T.k];
  const burn=(el,r,H,heat,cool,t,clip)=>{const w=Math.max(4,Math.round((r.right-r.left)/P)-4);const f=embStrip(el,w,H);embBurn(f,heat,cool);embPaint(f,Math.round(r.left/P)+2,Math.round(r.top/P),embPal(t),clip?cy0:-1e9,clip?cy1:1e9)};
  // the panel
  if(T.hud)burn(T.el,C,8,.9,.24,null,0);
  else{if(S.fire||T.k==='fire')burn(T.el,C,11,1.05,.15,S.fire||null,0);else{const per=((C.right-C.left)+(C.bottom-C.top))*2/P;embEmit(T.k,C,null,Math.min(1,260/Math.max(1,per)),dt)}draws.push([C,S.c,.6])}
  // the choices, each in its own effect
  for(const o of T.opts){if(o.r.bottom<C.top||o.r.top>C.bottom)continue;const s=ESTY[o.k]||S,col=s.fire?null:o.t?mixc(s.c,o.t,.55):s.c;
    if(s.fire||o.k==='fire')burn(o.el,o.r,o.on?7:5,o.on?.95:.7,o.on?.3:.34,s.fire||o.t,1);else embEmit(o.k,o.r,col,o.on?1.6:.95,dt,C);
    if(o.r.top>=C.top-2&&o.r.bottom<=C.bottom+2)draws.push([o.r,s.fire?s.c:(o.t||s.c),o.on?.95:.55])}
  // map rooms: the reachable ones in the act's weather, the boss room in violet fire
  for(const g of T.rings){if(g.r.bottom<C.top||g.r.top>C.bottom)continue;
    if(g.boss||T.k==='fire'){const r={left:g.r.left+(g.r.right-g.r.left)*.12,right:g.r.right-(g.r.right-g.r.left)*.12,top:g.r.top+(g.r.bottom-g.r.top)*.18};burn(g.el,r,g.boss?10:7,g.boss?1:.8,g.boss?.22:.27,g.t,1)}
    else embEmit(T.k,g.r,null,2.2,dt,C)}
  if(!T.hud)embAmb(S.amb,dt);
  X.putImageData(EMB.img,0,0);for(const d of draws)embFrame(d[0],d[1],d[2]);embDraw(dt);embAmbDraw(dt)}
