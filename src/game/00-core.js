(()=>{
// ---------- core: helpers, canvas, settings, saved progress, sprite sheets ----------
const $=id=>typeof document!=='undefined'&&document.getElementById?document.getElementById(id):null;
const clamp=(v,a,b)=>v<a?a:v>b?b:v,rnd=a=>a[(Math.random()*a.length)|0],lerp=(a,b,t)=>a+(b-a)*t;
const fmt=n=>{n=Math.round(n);const a=Math.abs(n);return a>=1e9?(n/1e9).toFixed(1)+'B':a>=1e6?(n/1e6).toFixed(1)+'M':a>=1e4?(n/1e3).toFixed(1)+'K':String(n)};
const mk=(w,h)=>{if(typeof document==='undefined'||!document.createElement)return null;const c=document.createElement('canvas');c.width=w;c.height=h;return c};
const hexA=(h,a)=>{const n=parseInt(h.slice(1),16);return `rgba(${n>>16&255},${n>>8&255},${n&255},${a})`};
// field: COLS x ROWS tiles of T world units. Monsters enter on the left and walk to the keep on the right.
const COLS=14,ROWS=8,T=64,FW=COLS*T,FH=ROWS*T,VY=.62;
const cv=$('cv'),ctx=cv&&cv.getContext?cv.getContext('2d'):null;
let W=0,H=0,DPR=1,VIEW={s:1,ox:0,oy:0};
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
  const nw=FW+T*3,nh=FH*VY+T*1.55,s=Math.min(availW/nw,availH/nh);VIEW.s=s;VIEW.ox=side+8+(availW-nw*s)/2+T*1.15*s;VIEW.oy=top+(availH-nh*s)/2+T*.5*s;
  if(typeof bgDirty!=='undefined')bgDirty=1}
const sx=x=>VIEW.ox+x*VIEW.s,sy=y=>VIEW.oy+y*VIEW.s*VY,ss=v=>v*VIEW.s;
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
