(()=>{
// ---------- core: helpers, canvas, settings, saved progress, sprite sheets ----------
const $=id=>typeof document!=='undefined'&&document.getElementById?document.getElementById(id):null;
const clamp=(v,a,b)=>v<a?a:v>b?b:v,rnd=a=>a[(Math.random()*a.length)|0],lerp=(a,b,t)=>a+(b-a)*t;
const fmt=n=>{n=Math.round(n);const a=Math.abs(n);return a>=1e9?(n/1e9).toFixed(1)+'B':a>=1e6?(n/1e6).toFixed(1)+'M':a>=1e4?(n/1e3).toFixed(1)+'K':String(n)};
const mk=(w,h)=>{if(typeof document==='undefined'||!document.createElement)return null;const c=document.createElement('canvas');c.width=w;c.height=h;return c};
const hexA=(h,a)=>{const n=parseInt(h.slice(1),16);return `rgba(${n>>16&255},${n>>8&255},${n&255},${a})`};
// field: a COLS x ROWS board of pointy-top hexes (odd rows shifted right by half a hex), T world units between hex centres.
// Monsters enter on the left and walk to the keep on the right.
const COLS=16,ROWS=10,T=64,RS=T*.866,FW=(COLS+.5)*T,FH=(ROWS-1)*RS+T,VY=.62,HR=T/1.732;
const hx=(c,r)=>(c+.5+(r&1)*.5)*T,hy=r=>r*RS+T/2;
const NBO=[[[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[-1,0]],[[1,0],[1,-1],[1,1],[0,-1],[0,1],[-1,0]]];
function nbrs(c,r){const o=[];for(const [dc,dr] of NBO[r&1]){const nc=c+dc,nr=r+dr;if(nc>=0&&nr>=0&&nc<COLS&&nr<ROWS)o.push([nc,nr])}return o}
// the hex under a world point (null off the board)
function cellOf(x,y){let best=null,bd=1e9;const r0=Math.round((y-T/2)/RS);for(let r=r0-1;r<=r0+1;r++){if(r<0||r>=ROWS)continue;const c0=Math.round(x/T-.5-(r&1)*.5);for(let c=c0-1;c<=c0+1;c++){if(c<0||c>=COLS)continue;const d=(hx(c,r)-x)**2+(hy(r)-y)**2;if(d<bd){bd=d;best=[c,r]}}}return best&&bd<=HR*HR?best:null}
// hex outline in screen space (pointy top), optionally lifted
// hex outline in screen space with an optional lift (always straight up on screen); upright mode
function hexPathS(g,c,r,k,lift){const x=hx(c,r),y=hy(r),R_=HR*(k||1);g.beginPath();for(let i=0;i<6;i++){const a=(-90+60*i)*Math.PI/180,p=scr(x+Math.cos(a)*R_,y+Math.sin(a)*R_);i?g.lineTo(p[0],p[1]-(lift||0)):g.moveTo(p[0],p[1]-(lift||0))}g.closePath()}
function hexPath(g,c,r,k,lift){const x=hx(c,r),y=hy(r),R_=HR*(k||1);g.beginPath();for(let i=0;i<6;i++){const a=(-90+60*i)*Math.PI/180,px=sx(x+Math.cos(a)*R_),py=sy(y+Math.sin(a)*R_)-(lift||0);i?g.lineTo(px,py):g.moveTo(px,py)}g.closePath()}
const cv=$('cv'),ctx=cv&&cv.getContext?cv.getContext('2d'):null;
let W=0,H=0,DPR=1,VIEW={s:1,ox:0,oy:0,px:0,py:0},VB={s:1,ox:0,oy:0,px:0,py:0},ZM={z:0,x:0,y:0},ROT=0,FB={l:0,r:0,b:0};
let SET={music:.6,sfx:.7,shake:1,nums:1,quality:'auto',speedPref:1,fps:false};
try{const m=JSON.parse(localStorage.getItem('runewarden-settings')||'null');if(m)Object.assign(SET,m)}catch(e){}
const saveSet=()=>{try{localStorage.setItem('runewarden-settings',JSON.stringify(SET))}catch(e){}};
let META={gems:0,best:0,runs:0,res:{},ach:{},seen:{},wins:0,bestEndless:0,kills:0};
try{const m=JSON.parse(localStorage.getItem('runewarden-meta')||'null');if(m)META=Object.assign(META,m)}catch(e){}
const saveMeta=()=>{try{localStorage.setItem('runewarden-meta',JSON.stringify(META))}catch(e){}};
const rank=id=>META.res[id]||0;
const LQ=()=>SET.quality==='low'||(SET.quality==='auto'&&PERF.low);
const PERF={low:false,acc:0,n:0};let FPSV=60;
// Two layouts. Landscape: the road runs left to right. Portrait (ROT): the same field turned so monsters come in at the top
// and the keep stands at the bottom. Field coordinates never change; only the view does.
// sx/sy map field x/y into "layout space"; in landscape that is the screen. In portrait, ground art (hexes, rings, roads) is drawn
// in layout space through gnd(), which swaps the axes; anything that stands upright (sprites, text, bars) uses scr() for its
// anchor and is drawn with upr(), so it never turns sideways.
function resize(){if(!cv)return;W=cv.clientWidth||innerWidth;H=cv.clientHeight||innerHeight;DPR=Math.min(LQ()?1:2,window.devicePixelRatio||1);cv.width=Math.round(W*DPR);cv.height=Math.round(H*DPR);
  const rot=H>W*1.05?1:0;if(rot!==ROT){ROT=rot;ZM.z=0;if(typeof document!=='undefined'&&document.body)document.body.classList.toggle('port',!!ROT)}
  if(typeof measure==='function')measure();
  if(ROT){// portrait: the field fills the width; the spawn sits above it, the keep and the bench strip below
    const top=(UI.topH||80)+4,bot=(UI.shopH||120)+4,availW=W-12,availH=H-top-bot-4;
    const nw=FH+T*1.1,nh=(FW+T*1.6)*VY+T*3.7,s=Math.min(availW/nw,availH/nh);VB.s=s;VB.ox=VB.oy=0;VB.px=6+(availW-nw*s)/2+T*.6*s;VB.py=top+(availH-nh*s)/2+T*.95*VY*s;
    FB={l:VB.px-T*.1*s,r:VB.px+(FH+T*.1)*s,b:VB.py+(FW+T*.62)*s*VY+T*1.3*s}}
  else{// fit the field (plus room for the keep, the spawn portal and the bench strip) between the top bar and the shop
    const short=H<=430,top=short?38:46,bot=(UI.shopH||120)+4,side=short||W<700?62:176,availW=W-side-16,availH=H-top-bot-4;
    const nw=FW+T*3,nh=FH*VY+T*1.55,s=Math.min(availW/nw,availH/nh);VB.s=s;VB.ox=side+8+(availW-nw*s)/2+T*1.15*s;VB.oy=top+(availH-nh*s)/2+T*.5*s;VB.px=VB.py=0;
    FB={l:VB.ox-T*.1*s,r:VB.ox+(FW+T*.1)*s,b:VB.oy+FH*s*VY}}
  // phones start zoomed in so heroes are big; the zoom button shows the whole board
  if(!(ZM.z>0)){ZM.z=defZoom();ZM.x=ZM.y=0;centreZoom()}applyZoom();
  if(typeof bgDirty!=='undefined')bgDirty=1}
const defZoom=()=>clamp(SET.zoom||(Math.min(W,H)<=500?(ROT?1.3:1.15):1),1,ZMAX);
const ZMAX=2.4;
const sx=x=>VIEW.ox+x*VIEW.s,sy=y=>VIEW.oy+y*VIEW.s*VY,ss=v=>v*VIEW.s;
// field point -> screen point, in either layout
const scr=(x,y)=>ROT?[VIEW.px+y*VIEW.s,VIEW.py+x*VIEW.s*VY]:[VIEW.ox+x*VIEW.s,VIEW.oy+y*VIEW.s*VY];
// screen point -> field point
const unscr=(px,py)=>ROT?{x:(py-VIEW.py)/(VIEW.s*VY),y:(px-VIEW.px)/VIEW.s}:{x:(px-VIEW.ox)/VIEW.s,y:(py-VIEW.oy)/(VIEW.s*VY)};
// drawing modes: BASEM is the frame's base transform (pixel ratio and screen shake)
let BASEM=[1,0,0,1,0,0];
function upr(g,m){m=m||BASEM;(g||ctx).setTransform(m[0],m[1],m[2],m[3],m[4],m[5])}
function gnd(g,m){g=g||ctx;upr(g,m);if(ROT)g.transform(0,VY,1/VY,0,VIEW.px,VIEW.py)}
// the field's corners on screen (current zoom)
function fieldBox(pad){pad=pad||0;const a=scr(-pad,-pad),b=scr(FW+pad,FH+pad);return{l:Math.min(a[0],b[0]),r:Math.max(a[0],b[0]),t:Math.min(a[1],b[1]),b:Math.max(a[1],b[1])}}
// the bench and racks don't zoom
const bsx=x=>VB.ox+x*VB.s,bsy=y=>VB.oy+y*VB.s*VY,bss=v=>v*VB.s;
function applyZoom(){if(ZM.z<=1.001){ZM.z=1;ZM.x=ZM.y=0}
  const setV=()=>{VIEW.s=VB.s*ZM.z;VIEW.ox=VB.ox+(ROT?0:ZM.x);VIEW.oy=VB.oy+(ROT?0:ZM.y);VIEW.px=VB.px+(ROT?ZM.x:0);VIEW.py=VB.py+(ROT?ZM.y:0)};setV();
  // keep the middle of the screen on the field
  if(ZM.z>1){const cx=W/2,cy=H/2,F=fieldBox();if(F.l>cx)ZM.x-=F.l-cx;if(F.r<cx)ZM.x+=cx-F.r;if(F.t>cy)ZM.y-=F.t-cy;if(F.b<cy)ZM.y+=cy-F.b;setV()}
  if(typeof bgDirty!=='undefined')bgDirty=1}
// zoom keeping the field point under (mx,my) still
function zoomAt(mx,my,z){const w=unscr(mx,my);ZM.z=clamp(z,1,ZMAX);const s=VB.s*ZM.z;
  if(ROT){ZM.x=mx-VB.px-w.y*s;ZM.y=my-VB.py-w.x*s*VY}else{ZM.x=mx-VB.ox-w.x*s;ZM.y=my-VB.oy-w.y*s*VY}applyZoom()}
// start a zoomed view on the part of the field nearest the keep
function centreZoom(){if(ZM.z<=1)return;const z=ZM.z;ZM.z=1;applyZoom();const c=scr(FW*.55,FH/2);zoomAt(c[0],c[1],z);
  // upright: keep the castle in view just above the bench; the far end of the road scrolls under the top bar
  if(ROT){const kb=scr(FW+T*.62,FH/2)[1]+ss(T*1.3);ZM.y+=FB.b-kb;applyZoom()}}
function panBy(dx,dy){if(ZM.z<=1)return;ZM.x+=dx;ZM.y+=dy;applyZoom()}
const UI={shopH:150,topH:80};
// ---------- sprite sheets rendered offline from CC0 3D models (gfx/) ----------
const SPR={img:{},st:{},cache:{}};
function sheet(name){const s=SPR.st[name];if(s===1)return SPR.img[name];if(s!==undefined)return null;if(typeof Image==='undefined'||!document.createElement){SPR.st[name]=-1;return null}
  SPR.st[name]=0;const im=new Image();im.onload=()=>{SPR.st[name]=1;if(typeof onSheet==='function')onSheet(name)};im.onerror=()=>{SPR.st[name]=-1};im.src='gfx/'+name+'.png';SPR.img[name]=im;return null}
// a frame, downscaled once to the size it is drawn at (cached per 8px bucket)
// how many cells a character sheet has (0 until it loads)
function cells(name){const im=sheet(name);return im&&im.naturalHeight?Math.round(im.naturalWidth/im.naturalHeight):0}
// character sheets are square cells in one row, so the cell size is the sheet's height (older 160px sheets still work)
function frame(name,cell,i,want){const im=sheet(name);if(!im)return null;if(im.naturalHeight&&(name[1]==='_'||name==='props3'))cell=im.naturalHeight;const b=Math.max(16,Math.min(cell,Math.ceil(want/8)*8)),key=name+'|'+i+'|'+b;let c=SPR.cache[key];if(c)return c;
  c=mk(b,b);if(!c)return null;const g=c.getContext('2d');if(!g||!g.drawImage)return null;g.imageSmoothingQuality='high';
  let src=im,sx0=i*cell,sw=cell;while(sw/2>=b*1.3){const h=Math.round(sw/2),t=mk(h,h),tg=t.getContext('2d');tg.imageSmoothingQuality='high';tg.drawImage(src,sx0,0,sw,sw,0,0,h,h);src=t;sx0=0;sw=h}
  g.drawImage(src,sx0,0,sw,sw,0,0,b,b);if(Object.keys(SPR.cache).length>900)SPR.cache={};return SPR.cache[key]=c}
// ---------- Kenney CC0 particle textures, tinted on demand ----------
/*@@ASSETS@@*/
const AT={};let ATOK=0;
(function(){if(typeof Image==='undefined')return;const im=new Image();im.onload=()=>{AT.fx=im;ATOK=1};im.src=ATLIMG.fx})();
const TC={};
function tinted(name,col){const key=name+(col||'');if(TC[key]!==undefined)return TC[key];const r=ATLAS.fx[name];if(!r||!AT.fx)return null;const [x,y,w,h]=r,c=mk(w,h);if(!c)return TC[key]=null;const g=c.getContext('2d');if(!g||!g.drawImage)return TC[key]=null;
  g.drawImage(AT.fx,x,y,w,h,0,0,w,h);if(col){g.globalCompositeOperation='multiply';g.fillStyle=col;g.fillRect(0,0,w,h);g.globalCompositeOperation='destination-in';g.drawImage(AT.fx,x,y,w,h,0,0,w,h)}return TC[key]=c}
function dspr(name,col,x,y,w,h,rot,alpha,add){const c=tinted(name,col);if(!c)return false;const ga=ctx.globalAlpha,go=ctx.globalCompositeOperation;if(add)ctx.globalCompositeOperation='lighter';if(alpha!=null)ctx.globalAlpha=alpha;
  if(rot){ctx.save();ctx.translate(x,y);ctx.rotate(rot);ctx.drawImage(c,-w/2,-h/2,w,h);ctx.restore()}else ctx.drawImage(c,x-w/2,y-h/2,w,h);ctx.globalAlpha=ga;ctx.globalCompositeOperation=go;return true}
const GLOW={};function glow(rgb){if(GLOW[rgb])return GLOW[rgb];const c=mk(64,64);if(!c)return null;const g=c.getContext('2d');if(!g||!g.createRadialGradient)return GLOW[rgb]=c;const gr=g.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,`rgba(${rgb},1)`);gr.addColorStop(.35,`rgba(${rgb},.45)`);gr.addColorStop(1,`rgba(${rgb},0)`);g.fillStyle=gr;g.fillRect(0,0,64,64);return GLOW[rgb]=c}
