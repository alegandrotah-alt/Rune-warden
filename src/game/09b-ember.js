// ---------- ember layer: pixel flames on the menus, rooms, rewards and the map ----------
// A low-resolution canvas laid over the page and scaled up with hard pixels, so everything on it reads as pixel
// art. While a screen is open, fire burns along the top of its panel and of every choice on it (the old "doom
// fire": a strip of heat that rises, drifts and cools a little each step), tinted with the choice's colour so a
// god's card burns in that god's colour. Map rooms you can walk to carry a small fire, the boss room a violet
// one, and embers drift up the screen. Nothing runs while no screen is open.
const EMB={px:3,sp:[],t:0,acc:0,c:null,x:null,w:0,h:0,img:null,buf:null,tint:new WeakMap(),fire:new WeakMap(),pal:{},on:true,vis:0};
const FRAMP=[[70,16,10],[150,38,16],[224,84,26],[255,150,46],[255,214,100],[255,248,210]];
function embInit(){if(!DOM||EMB.c)return;const c=document.createElement('canvas');c.id='emberC';c.setAttribute('aria-hidden','true');document.body.appendChild(c);EMB.c=c;EMB.x=c.getContext('2d');
  try{if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)EMB.on=false}catch(e){}}
function embSize(){const w=Math.ceil(innerWidth/EMB.px),h=Math.ceil(innerHeight/EMB.px);if(w!==EMB.w||h!==EMB.h){EMB.w=EMB.c.width=w;EMB.h=EMB.c.height=h;EMB.img=EMB.x.createImageData(w,h);EMB.buf=new Uint32Array(EMB.img.data.buffer)}}
function embHex(s){s=(s||'').trim();const m=/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(s);if(!m)return null;let v=m[1];if(v.length===3)v=v.split('').map(q=>q+q).join('');return[parseInt(v.slice(0,2),16),parseInt(v.slice(2,4),16),parseInt(v.slice(4,6),16)]}
function embTint(el){if(EMB.tint.has(el))return EMB.tint.get(el);let t=null;try{t=embHex(getComputedStyle(el).getPropertyValue('--c'))}catch(e){}EMB.tint.set(el,t);return t}
// 32 colours from cold (0) to white hot (31), pulled toward a tint in the middle, as little-endian RGBA words
function embPal(t){const key=t?t.join():'-';if(EMB.pal[key])return EMB.pal[key];const P=new Uint32Array(32);
  for(let i=0;i<32;i++){const h=i/31,f=h*(FRAMP.length-1),j=Math.min(FRAMP.length-2,f|0),u=f-j,A=FRAMP[j],B=FRAMP[j+1];let c=[A[0]+(B[0]-A[0])*u,A[1]+(B[1]-A[1])*u,A[2]+(B[2]-A[2])*u];
    if(t){const k=Math.max(0,1-Math.abs(h-.5)*2.4)*.9;c=c.map((v,q)=>v+(t[q]-v)*k)}const al=Math.min(255,h*3.2*255)|0;P[i]=(al<<24|(c[2]|0)<<16|(c[1]|0)<<8|(c[0]|0))>>>0}
  return EMB.pal[key]=P}
// one strip of fire for an element: w columns, H rows, the bottom row is the fuel line
function embStrip(el,w,H){let f=EMB.fire.get(el);if(!f||f.w!==w||f.H!==H){f={w,H,a:new Float32Array(w*H),fuel:new Float32Array(w)};for(let x=0;x<w;x++)f.fuel[x]=Math.random();EMB.fire.set(el,f)}return f}
function embBurn(f,heat,cool){const {w,H,a,fuel}=f;
  for(let x=0;x<w;x++){const nb=x>0?fuel[x-1]:fuel[x];fuel[x]+=(Math.random()-.5)*.5+(nb-fuel[x])*.3;fuel[x]=fuel[x]<0?0:fuel[x]>1?1:fuel[x];const q=fuel[x]*fuel[x];a[(H-1)*w+x]=heat*(.18+.82*q)}
  for(let y=0;y<H-1;y++)for(let x=0;x<w;x++){const r=Math.random(),nx=x+((r*3)|0)-1;if(nx<0||nx>=w)continue;const v=a[(y+1)*w+x]-r*cool;a[y*w+nx]=v>0?v:0}}
// paint a strip so its fuel line sits on screen row y0 (low-res pixels), starting at column x0
function embPaint(f,x0,y0,pal,cy0,cy1){const {w,H,a}=f,B=EMB.buf,W=EMB.w,Hh=EMB.h;
  for(let y=0;y<H;y++){const sy=y0-(H-1)+y;if(sy<0||sy>=Hh||sy<cy0||sy>cy1)continue;const row=sy*W;
    for(let x=0;x<w;x++){const v=a[y*w+x];if(v<.04)continue;const sx=x0+x;if(sx<0||sx>=W)continue;B[row+sx]=pal[Math.min(31,(v*31)|0)]}}}
// a thin glowing frame with cut corners, flickering
function embFrame(r,pal,al){const P=EMB.px,X=EMB.x,x0=Math.round(r.left/P),y0=Math.round(r.top/P),x1=Math.round(r.right/P)-1,y1=Math.round(r.bottom/P)-1;if(x1-x0<6||y1-y0<6)return;
  const c=pal[17];X.globalAlpha=al*(.7+.3*Math.sin(EMB.t*9+x0)*Math.sin(EMB.t*5.3+y0));X.fillStyle=`rgb(${c&255},${c>>8&255},${c>>16&255})`;
  X.fillRect(x0+2,y0,x1-x0-3,1);X.fillRect(x0+2,y1,x1-x0-3,1);X.fillRect(x0,y0+2,1,y1-y0-3);X.fillRect(x1,y0+2,1,y1-y0-3);X.fillRect(x0+1,y0+1,1,1);X.fillRect(x1-1,y0+1,1,1);X.fillRect(x0+1,y1-1,1,1);X.fillRect(x1-1,y1-1,1,1);X.globalAlpha=1}
// what burns on the open screen
function embTargets(){const ov=[...document.querySelectorAll('.overlay:not([hidden])')].filter(o=>!o.classList.contains('tipov')).pop();if(!ov)return null;
  const card=ov.querySelector('.card');if(!card)return null;const T={el:card,card:card.getBoundingClientRect(),opts:[],rings:[]};
  for(const el of ov.querySelectorAll('#roomList>button:not(:disabled),#pickList>button:not(:disabled),#rwHeroes>*,.dcard.on'))T.opts.push({el,r:el.getBoundingClientRect(),t:embTint(el),on:el.classList.contains('on')||document.activeElement===el||el.matches(':hover')});
  for(const el of ov.querySelectorAll('.mn.can,.mn.boss'))T.rings.push({el,r:el.getBoundingClientRect(),t:el.classList.contains('boss')?[190,80,255]:embTint(el),boss:el.classList.contains('boss')});
  return T}
function emberTick(dt){if(!DOM)return;if(!EMB.c)embInit();if(!EMB.c)return;const T=EMB.on?embTargets():null;
  if(!T&&!EMB.sp.length){if(EMB.vis){EMB.c.style.display='none';EMB.vis=0}return}
  if(!EMB.vis){EMB.c.style.display='';EMB.vis=1}embSize();EMB.t+=dt;EMB.acc+=dt;const P=EMB.px,X=EMB.x,step=EMB.acc>=1/30;if(step)EMB.acc%=1/30;
  EMB.buf.fill(0);const draws=[];
  if(T){const C=T.card,cy0=Math.floor(C.top/P),cy1=Math.ceil(C.bottom/P),burn=(el,r,H,heat,cool,t,clip)=>{const w=Math.max(4,Math.round((r.right-r.left)/P)-4);const f=embStrip(el,w,H);if(step)embBurn(f,heat,cool);
      embPaint(f,Math.round(r.left/P)+2,Math.round(r.top/P),embPal(t),clip?cy0:-1e9,clip?cy1:1e9)};
    burn(T.el,C,11,1.05,.15,null,0);draws.push([C,embPal(null),.6]);
    for(const o of T.opts){if(o.r.bottom<C.top||o.r.top>C.bottom)continue;burn(o.el,o.r,o.on?7:5,o.on?.95:.7,o.on?.3:.34,o.t,1);if(o.r.top>=C.top-2&&o.r.bottom<=C.bottom+2)draws.push([o.r,embPal(o.t),o.on?.95:.55])}
    for(const g of T.rings){if(g.r.bottom<C.top||g.r.top>C.bottom)continue;const r={left:g.r.left+(g.r.right-g.r.left)*.12,right:g.r.right-(g.r.right-g.r.left)*.12,top:g.r.top+(g.r.bottom-g.r.top)*.18};burn(g.el,r,g.boss?10:7,g.boss?1:.8,g.boss?.22:.27,g.t,1)}
    if(EMB.sp.length<(PERF.low?18:40)&&Math.random()<dt*14)EMB.sp.push({x:Math.random()*EMB.w,y:EMB.h+2,vy:-(6+Math.random()*10),ph:Math.random()*6,l:0,L:4+Math.random()*5})}
  X.putImageData(EMB.img,0,0);for(const d of draws)embFrame(d[0],d[1],d[2]);
  for(let i=EMB.sp.length-1;i>=0;i--){const s=EMB.sp[i];s.l+=dt;s.y+=s.vy*dt;s.x+=Math.sin(EMB.t*1.7+s.ph)*dt*5;if(s.l>s.L||s.y<-2){EMB.sp.splice(i,1);continue}
    const a=s.l/s.L;X.globalAlpha=Math.min(1,a*4)*(1-a)*(.55+.45*Math.sin(EMB.t*11+s.ph));X.fillStyle=a<.5?'#ffcf6a':'#ff7a30';X.fillRect(s.x|0,s.y|0,1,1)}
  X.globalAlpha=1}
