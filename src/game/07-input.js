// ---------- input: drag heroes between bench and field, drop on the shop to sell, tap for details ----------
let DRAG=null,SEL=null,VALID=null;
const toWorld=(px,py)=>({x:(px-VIEW.ox)/VIEW.s,y:(py-VIEW.oy)/(VIEW.s*VY)});
const cellAt=(px,py)=>{const w=toWorld(px,py),c=Math.floor(w.x/T),r=Math.floor(w.y/T);return c>=0&&r>=0&&c<COLS&&r<ROWS?{c,r}:null};
function benchAt(px,py){for(let i=0;i<R.bench.length;i++){const b=benchSlot(i);if(Math.abs(px-b.x)<b.w*.5&&Math.abs(py-b.y-b.w*.05)<b.w*.45)return i}return -1}
function heroUnder(px,py){const c=cellAt(px,py+ss(T*.25));if(c){const h=heroAt(c.c,c.r);if(h)return h}const c2=cellAt(px,py);return c2?heroAt(c2.c,c2.r):null}
function overShop(px,py){const el=$('shop');if(!el||!el.getBoundingClientRect)return false;const r=el.getBoundingClientRect();return py>=r.top-6&&px>=r.left&&px<=r.right}
function pdown(e){if(!R||R.phase==='over'||R.phase==='pick')return;ensureAudio();const px=e.clientX,py=e.clientY;
  const ii=itemAt(px,py);if(ii>=0){DRAG={item:ii,x:px,y:py,sx:px,sy:py};return}
  for(let i=0;i<R.stones.length;i++){const p=stoneSlot(i);if(Math.hypot(px-p.x,py-p.y)<p.s*.8){DRAG={stone:i,x:px,y:py,sx:px,sy:py};return}}
  const bi=benchAt(px,py);if(bi>=0&&R.bench[bi]){DRAG={h:R.bench[bi],from:'bench',bi,x:px,y:py,sx:px,sy:py};startValid();return}
  const h=heroUnder(px,py);if(h){DRAG={h,from:'board',x:px,y:py,sx:px,sy:py,locked:R.phase!=='plan'};startValid();return}
  SEL=null;uiInfo(null);const now=performance.now();if(now-(pdown.lastTap||0)<320&&ZM.z>1){ZM.z=1;applyZoom();uiZoom()}pdown.lastTap=now;if(ZM.z>1)PAN={x:px,y:py}}
function startValid(){VALID=null;if(R.phase!=='plan')return;VALID=new Uint8Array(COLS*ROWS);const was=DRAG.from==='board'?DRAG.h:null;if(was){R.board.splice(R.board.indexOf(was),1);rebuildBlk()}
  for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++)VALID[r*COLS+c]=canPlace(c,r)?1:0;if(was){R.board.push(was);rebuildBlk()}}
function pmove(e){if(!DRAG)return;DRAG.x=e.clientX;DRAG.y=e.clientY;DRAG.moved=DRAG.moved||Math.hypot(DRAG.x-DRAG.sx,DRAG.y-DRAG.sy)>8;DRAG.over=cellAt(DRAG.x,DRAG.y+ss(T*.2));DRAG.overBench=benchAt(DRAG.x,DRAG.y);DRAG.sell=!!DRAG.h&&overShop(DRAG.x,DRAG.y);if(DRAG.item!=null)DRAG.tgt=itemTarget(DRAG.x,DRAG.y);uiSellHint(DRAG.sell&&DRAG.h?sellValue(DRAG.h):0)}
function pup(e){if(!DRAG)return;const d=DRAG;DRAG=null;uiSellHint(0);pmove({clientX:d.x,clientY:d.y});
  if(d.item!=null){if(!d.moved){uiItem(R.items[d.item]);return}const h=itemTarget(d.x,d.y);if(h){if(equipFrom(d.item,h)){calcTraits();if(SEL===h)uiInfo(h)}}else toast('Drop items on a hero');uiRefresh();if(R.phase==='plan')saveRun();return}
  if(!d.moved){if(d.h){SEL=d.h;uiInfo(d.h)}VALID=null;return}
  if(d.stone!=null){const c=cellAt(d.x,d.y+ss(T*.2));if(!c||!placeStone(d.stone,c.c,c.r))toast('Drop rune stones on an empty tile');VALID=null;uiRefresh();return}
  const h=d.h,over=cellAt(d.x,d.y+ss(T*.2)),bi=benchAt(d.x,d.y);
  if(overShop(d.x,d.y)){sellHero(h);if(SEL===h){SEL=null;uiInfo(null)}}
  else if(bi>=0){const other=R.bench[bi];if(d.from==='bench'){R.bench[d.bi]=other;R.bench[bi]=h}else if(!other){const i=R.board.indexOf(h);if(d.locked){toast('Heroes can only move between waves')}else{R.board.splice(i,1);h.c=h.r=-1;R.bench[bi]=h;rebuildBlk()}}
    else if(!d.locked){const c=h.c,r=h.r;R.board.splice(R.board.indexOf(h),1);h.c=h.r=-1;R.bench[bi]=h;other.c=c;other.r=r;R.board.push(other);rebuildBlk()}}
  else if(over){if(R.phase!=='plan')toast('Place heroes between waves');
    else{const x=heroAt(over.c,over.r);
      if(x&&x!==h){if(d.from==='board'){const c=h.c,r=h.r;h.c=x.c;h.r=x.r;x.c=c;x.r=r;rebuildBlk()}else{R.bench[d.bi]=x;R.board.splice(R.board.indexOf(x),1);x.c=x.r=-1;h.c=over.c;h.r=over.r;R.board.push(h);rebuildBlk()}}
      else if(!x){if(d.from==='bench'&&R.board.length>=boardMax())toast(`Your field holds ${boardMax()} heroes. Level up for more`);else if(!placeHero(h,over.c,over.r))toast(R.field.blk[over.r*COLS+over.c]===2||runeAt(over.c,over.r)||portalAt(over.c,over.r)?'That tile is taken':'That would block the road completely')}}}
  VALID=null;calcTraits();uiRefresh();if(R.phase==='plan')saveRun()}
function drawPlacement(){
  if(DRAG&&VALID&&DRAG.h&&DRAG.moved){for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){if(heroAt(c,r))continue;ctx.fillStyle=VALID[r*COLS+c]?'rgba(140,255,140,.10)':'rgba(255,60,60,.10)';ctx.fillRect(sx(c*T)+1,sy(r*T)+1,ss(T)-2,ss(T)*VY-2)}
    if(DRAG.over){const o=DRAG.over,ok=VALID[o.r*COLS+o.c]||heroAt(o.c,o.r);ctx.strokeStyle=ok?'#9dff8a':'#ff5a5a';ctx.lineWidth=2.5;ctx.strokeRect(sx(o.c*T)+2,sy(o.r*T)+2,ss(T)-4,ss(T)*VY-4);
      const s=heroStats(DRAG.h);ctx.strokeStyle='rgba(255,255,255,.4)';ctx.setLineDash([6,6]);ctx.beginPath();ctx.ellipse(sx((o.c+.5)*T),sy((o.r+.5)*T),ss(s.rng*T),ss(s.rng*T)*VY,0,0,6.283);ctx.stroke();ctx.setLineDash([])}}
  if(DRAG&&DRAG.stone!=null&&DRAG.moved){const o=cellAt(DRAG.x,DRAG.y+ss(T*.2));if(o){ctx.strokeStyle='#9cc4ff';ctx.lineWidth=2.5;ctx.strokeRect(sx(o.c*T)+2,sy(o.r*T)+2,ss(T)-4,ss(T)*VY-4)}}
  if(SEL&&R.board.includes(SEL)&&!DRAG){const s=heroStats(SEL);ctx.strokeStyle='rgba(255,230,160,.55)';ctx.lineWidth=2;ctx.setLineDash([6,6]);ctx.beginPath();ctx.ellipse(sx((SEL.c+.5)*T),sy((SEL.r+.5)*T),ss(s.rng*T),ss(s.rng*T)*VY,0,0,6.283);ctx.stroke();ctx.setLineDash([])}}
function itemTarget(px,py){const h=heroUnder(px,py+ss(T*.2))||heroUnder(px,py);if(h)return h;const bi=benchAt(px,py);return bi>=0?R.bench[bi]:null}
function drawDrag(){if(!DRAG||!DRAG.moved)return;if(DRAG.item!=null){const s=Math.max(22,ss(T*.5)),t=DRAG.tgt;if(t){let x,y;if(t.c>=0){x=sx((t.c+.5)*T);y=sy((t.r+.5)*T)}else{const b=benchSlot(R.bench.indexOf(t));x=b.x;y=b.y}ctx.strokeStyle=canTake(t,R.items[DRAG.item])?'#ffd76a':'#ff5a5a';ctx.lineWidth=2.5;ctx.beginPath();ctx.ellipse(x,y,ss(T*.45),ss(T*.45)*VY,0,0,6.283);ctx.stroke()}drawItemIcon(R.items[DRAG.item],DRAG.x,DRAG.y-s*.4,s);return}if(DRAG.h)drawHeroAt(DRAG.h,DRAG.x,DRAG.y+ss(T*.4),ss(T*1.5),1);else if(DRAG.stone!=null){const v=R.stones[DRAG.stone],s=Math.max(16,ss(T*.38));ctx.fillStyle='#2a3a6a';ctx.strokeStyle='#9cc4ff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(DRAG.x,DRAG.y,s*.6,0,6.283);ctx.fill();ctx.stroke();ctx.font=`900 ${s*.6}px Cinzel,serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#fff';ctx.fillText('×'+v,DRAG.x,DRAG.y)}}
// two fingers pinch to zoom and pan; one finger pans an empty spot while zoomed; the mouse wheel zooms
let PAN=null,PINCH=null;const PTR=new Map();
const mid=()=>{const v=[...PTR.values()];return{x:(v[0].x+v[1].x)/2,y:(v[0].y+v[1].y)/2,d:Math.hypot(v[0].x-v[1].x,v[0].y-v[1].y)||1}};
function uiZoom(){const b=$('zoomB');if(b)b.hidden=ZM.z<=1}
if(cv&&cv.addEventListener){
  cv.addEventListener('pointerdown',e=>{try{cv.setPointerCapture(e.pointerId)}catch(_){}PTR.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(PTR.size===2){DRAG=null;VALID=null;PAN=null;uiSellHint(0);const m=mid();PINCH={d0:m.d,z0:ZM.z,x:m.x,y:m.y};return}if(PTR.size>2)return;pdown(e)});
  cv.addEventListener('pointermove',e=>{if(PTR.has(e.pointerId))PTR.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(PINCH&&PTR.size===2){const m=mid();zoomAt(m.x,m.y,PINCH.z0*m.d/PINCH.d0);panBy(m.x-PINCH.x,m.y-PINCH.y);PINCH.x=m.x;PINCH.y=m.y;uiZoom();return}
    if(PAN){panBy(e.clientX-PAN.x,e.clientY-PAN.y);PAN.x=e.clientX;PAN.y=e.clientY;return}pmove(e)});
  const up=e=>{PTR.delete(e.pointerId);if(PINCH){if(PTR.size<2)PINCH=null;return}if(PAN){PAN=null;return}if(e.type==='pointercancel'){DRAG=null;VALID=null;return}pup(e)};
  cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
  cv.addEventListener('wheel',e=>{e.preventDefault();zoomAt(e.clientX,e.clientY,ZM.z*(e.deltaY<0?1.12:1/1.12));uiZoom()},{passive:false})}
if(typeof window!=='undefined'&&window.addEventListener)window.addEventListener('keydown',e=>{if(!R||document.activeElement&&document.activeElement.tagName==='INPUT')return;
  if(e.key===' '){e.preventDefault();if(R.phase==='plan')fight();else if(R.phase==='wave')cycleSpeed()}else if(e.key==='d'||e.key==='D'){reroll();uiRefresh()}else if(e.key==='f'||e.key==='F'){buyXP();uiRefresh()}else if(e.key==='Escape'||e.key==='p')togglePause()});
