(()=>{
// ---------- core: helpers, canvas, settings, saved progress, sprite sheets ----------
const $=id=>typeof document!=='undefined'&&document.getElementById?document.getElementById(id):null;
const clamp=(v,a,b)=>v<a?a:v>b?b:v,rnd=a=>a[(Math.random()*a.length)|0],lerp=(a,b,t)=>a+(b-a)*t;
const fmt=n=>{n=Math.round(n);const a=Math.abs(n);return a>=1e9?(n/1e9).toFixed(1)+'B':a>=1e6?(n/1e6).toFixed(1)+'M':a>=1e4?(n/1e3).toFixed(1)+'K':String(n)};
const mk=(w,h)=>{if(typeof document==='undefined'||!document.createElement)return null;const c=document.createElement('canvas');c.width=w;c.height=h;return c};
const hexA=(h,a)=>{const n=parseInt(h.slice(1),16);return `rgba(${n>>16&255},${n>>8&255},${n&255},${a})`};
// field: a COLS x ROWS board of pointy-top hexes (odd rows shifted right by half a hex), T world units between hex centres.
// Monsters enter on the left and walk to the keep on the right.
const COLS=14,ROWS=8,T=64,RS=T*.866,FW=(COLS+.5)*T,FH=(ROWS-1)*RS+T,VY=.62,HR=T/1.732;
const hx=(c,r)=>(c+.5+(r&1)*.5)*T,hy=r=>r*RS+T/2;
const NBO=[[[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[-1,0]],[[1,0],[1,-1],[1,1],[0,-1],[0,1],[-1,0]]];
function nbrs(c,r){const o=[];for(const [dc,dr] of NBO[r&1]){const nc=c+dc,nr=r+dr;if(nc>=0&&nr>=0&&nc<COLS&&nr<ROWS)o.push([nc,nr])}return o}
// the hex under a world point (null off the board)
function cellOf(x,y){let best=null,bd=1e9;const r0=Math.round((y-T/2)/RS);for(let r=r0-1;r<=r0+1;r++){if(r<0||r>=ROWS)continue;const c0=Math.round(x/T-.5-(r&1)*.5);for(let c=c0-1;c<=c0+1;c++){if(c<0||c>=COLS)continue;const d=(hx(c,r)-x)**2+(hy(r)-y)**2;if(d<bd){bd=d;best=[c,r]}}}return best&&bd<=HR*HR?best:null}
// hex outline in screen space (pointy top), optionally lifted
function hexPath(g,c,r,k,lift){const x=hx(c,r),y=hy(r),R_=HR*(k||1);g.beginPath();for(let i=0;i<6;i++){const a=(-90+60*i)*Math.PI/180,px=sx(x+Math.cos(a)*R_),py=sy(y+Math.sin(a)*R_)-(lift||0);i?g.lineTo(px,py):g.moveTo(px,py)}g.closePath()}
const cv=$('cv'),ctx=cv&&cv.getContext?cv.getContext('2d'):null;
let W=0,H=0,DPR=1,VIEW={s:1,ox:0,oy:0},VB={s:1,ox:0,oy:0},ZM={z:1,x:0,y:0};
let SET={music:.6,sfx:.7,shake:1,nums:1,quality:'auto',speedPref:1};
try{const m=JSON.parse(localStorage.getItem('runewarden-settings')||'null');if(m)Object.assign(SET,m)}catch(e){}
const saveSet=()=>{try{localStorage.setItem('runewarden-settings',JSON.stringify(SET))}catch(e){}};
let META={gems:0,best:0,runs:0,res:{},ach:{},seen:{},wins:0,bestEndless:0,kills:0};
try{const m=JSON.parse(localStorage.getItem('runewarden-meta')||'null');if(m)META=Object.assign(META,m)}catch(e){}
const saveMeta=()=>{try{localStorage.setItem('runewarden-meta',JSON.stringify(META))}catch(e){}};
const rank=id=>META.res[id]||0;
const LQ=()=>SET.quality==='low'||(SET.quality==='auto'&&PERF.low);
const PERF={low:false,acc:0,n:0};
function resize(){if(!cv)return;W=cv.clientWidth||innerWidth;H=cv.clientHeight||innerHeight;DPR=Math.min(LQ()?1:2,window.devicePixelRatio||1);cv.width=Math.round(W*DPR);cv.height=Math.round(H*DPR);
  // fit the field (plus room for the keep, the spawn portal and the bench strip) between the top bar and the shop
  const short=H<=430,top=short?38:46,bot=(UI.shopH||120)+4,side=short||W<700?62:176,availW=W-side-16,availH=H-top-bot-4;
  const nw=FW+T*3,nh=FH*VY+T*1.55,s=Math.min(availW/nw,availH/nh);VB.s=s;VB.ox=side+8+(availW-nw*s)/2+T*1.15*s;VB.oy=top+(availH-nh*s)/2+T*.5*s;applyZoom();
  if(typeof bgDirty!=='undefined')bgDirty=1}
const sx=x=>VIEW.ox+x*VIEW.s,sy=y=>VIEW.oy+y*VIEW.s*VY,ss=v=>v*VIEW.s;
// camera zoom (pinch, wheel): the field zooms, the bench and stones stay put
const bsx=x=>VB.ox+x*VB.s,bsy=y=>VB.oy+y*VB.s*VY,bss=v=>v*VB.s;
function applyZoom(){const z=ZM.z;if(z<=1.001){ZM.z=1;ZM.x=ZM.y=0}
  VIEW.s=VB.s*ZM.z;VIEW.ox=VB.ox+ZM.x;VIEW.oy=VB.oy+ZM.y;
  // keep the middle of the screen on the field
  const cx=W/2,cy=H/2;if(sx(0)>cx){ZM.x-=sx(0)-cx}if(sx(FW)<cx){ZM.x+=cx-sx(FW)}if(sy(0)>cy){ZM.y-=sy(0)-cy}if(sy(FH)<cy){ZM.y+=cy-sy(FH)}
  VIEW.ox=VB.ox+ZM.x;VIEW.oy=VB.oy+ZM.y;if(typeof bgDirty!=='undefined')bgDirty=1}
function zoomAt(mx,my,z){const wx=(mx-VIEW.ox)/VIEW.s,wy=(my-VIEW.oy)/(VIEW.s*VY);ZM.z=clamp(z,1,2.4);const s=VB.s*ZM.z;ZM.x=mx-VB.ox-wx*s;ZM.y=my-VB.oy-wy*s*VY;applyZoom()}
function panBy(dx,dy){if(ZM.z<=1)return;ZM.x+=dx;ZM.y+=dy;applyZoom()}
const UI={shopH:150};
// ---------- sprite sheets rendered offline from CC0 3D models (gfx/) ----------
const SPR={img:{},st:{},cache:{}};
function sheet(name){const s=SPR.st[name];if(s===1)return SPR.img[name];if(s!==undefined)return null;if(typeof Image==='undefined'||!document.createElement){SPR.st[name]=-1;return null}
  SPR.st[name]=0;const im=new Image();im.onload=()=>{SPR.st[name]=1;if(typeof onSheet==='function')onSheet(name)};im.onerror=()=>{SPR.st[name]=-1};im.src='gfx/'+name+'.png';SPR.img[name]=im;return null}
// a frame, downscaled once to the size it is drawn at (cached per 8px bucket)
function frame(name,cell,i,want){const im=sheet(name);if(!im)return null;const b=Math.max(16,Math.min(cell,Math.ceil(want/8)*8)),key=name+'|'+i+'|'+b;let c=SPR.cache[key];if(c)return c;
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
