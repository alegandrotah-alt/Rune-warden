// ---------- items: components drop from elites and bosses; two on one hero combine into a finished item ----------
const NOIT={dmg:0,as:0,sp:0,mana:0,crit:0,hp:0,rng:0,regen:0};
function itemStats(h){const it=h&&h.it;if(!it||!it.length)return NOIT;const key=it.join();if(h._ik===key)return h._is;const o=Object.assign({},NOIT);for(const id of it){const st=ITEMS[id].st;for(const k in st)o[k]+=st[k]}h._ik=key;h._is=o;return o}
const hasIt=(h,id)=>!!(h&&h.it&&h.it.includes(id));
const isComp=id=>!ITEMS[id].c;
const ITEM_MAX=10;const FLY=[];
function stashItem(id){if(R.items.length<ITEM_MAX){R.items.push(id);return true}R.gold+=2;toast(`Item bench full: ${ITEMS[id].n} sold for 2 gold`);return false}
function dropItem(id,x,y){if(!stashItem(id))return;R.itemNew=1;const i=R.items.length-1;if(x!=null)floatText(x,y-T*.9,'+ '+ITEMS[id].n,ITEMS[id].col,1.05);
  if(DOM)FLY.push({id,i,x0:x!=null?sx(x):W/2,y0:x!=null?sy(y)-ss(T*.5):H*.4,t:0});sfx('item',.45)}
// put an item on a hero; a component on a hero that holds a component makes a finished item
function giveItem(h,id){h.it=h.it||[];
  if(isComp(id)){const j=h.it.findIndex(isComp);if(j>=0){const fin=RECIPE[[h.it[j],id].sort().join('+')];h.it[j]=fin;if(DOM)toast(`${ITEMS[fin].n}: ${ITEMS[fin].d}`);fxItem(h);checkKit(h);return true}}
  if(h.it.length>=3){stashItem(id);return false}h.it.push(id);fxItem(h);checkKit(h);return true}
function canTake(h,id){h.it=h.it||[];return h.it.length<3||isComp(id)&&h.it.some(isComp)}
function equipFrom(i,h){const id=R.items[i];if(!id||!h)return false;if(!canTake(h,id)){toast('A hero can hold 3 items');return false}R.items.splice(i,1);giveItem(h,id);sfx('item',.5);if(h.hpMax)h.hpMax=heroMaxHp(h);R.itemNew=0;if((META.itemHint||0)<2){META.itemHint=2;saveMeta()}return true}
function checkKit(h){if(h.it.filter(x=>!isComp(x)).length>=3)award('items3')}
function fxItem(h){if(h.c>=0)fx({k:'star',x:hx(h.c,h.r),y:hy(h.r),dur:.5,col:'#ffd76a'})}
function randomFinished(){return rndS(FINISHED)}
// ---------- the bottom strip: ITEMS rack on the left, the hero bench in the middle, RUNES on the right ----------
function bottomLayout(){const s=Math.max(14,bss(T*.44)),gap=s*.45,L=bsx(-T*.1),Rr=bsx(FW+T*.1),rackW=5*s*1.12,runeW=2*s*1.12,n=R.bench.length,avail=Rr-L-rackW-runeW-gap*2,w=Math.min(bss(T*.9),avail/n);
  return{s,w,cx:L+rackW+gap+avail/2,y:bsy(FH)+bss(T*.3)+w*.42,L,Rr,rackW,runeW}}
function itemSlot(i){const B=bottomLayout(),col=i%5,row=(i/5)|0;return{x:B.L+B.s*.56+col*B.s*1.12,y:B.y-B.s*.56+row*B.s*1.12,s:B.s}}
function drawItemIcon(id,x,y,s,alpha){const I=ITEMS[id];if(!I)return;ctx.save();if(alpha!=null)ctx.globalAlpha=alpha;const fin=!isComp(id),r=s*.5;
  ctx.fillStyle=fin?'#3a2812':'#241c16';ctx.strokeStyle=fin?'#ffd76a':I.col;ctx.lineWidth=fin?2:1.5;ctx.beginPath();ctx.roundRect?ctx.roundRect(x-r,y-r,s,s,s*.22):ctx.rect(x-r,y-r,s,s);ctx.fill();ctx.stroke();
  ctx.textAlign='center';ctx.textBaseline='middle';
  if(fin){const a=ITEMS[I.c[0]],b=ITEMS[I.c[1]];drawIcon(a.icn,x-s*.17,y-s*.13,s*.5,a.col);drawIcon(b.icn,x+s*.17,y+s*.15,s*.5,b.col)}
  else drawIcon(I.icn,x,y,s*.68,I.col);ctx.restore()}
function drawItems(){const B=bottomLayout(),p0=itemSlot(0),s=B.s;
  // the rack: a panel with ten slots and a label, always visible so you know where items go
  const x0=B.L,y0=p0.y-s*.62,wd=B.rackW,ht=s*2.24;ctx.save();ctx.fillStyle='rgba(20,13,8,.72)';ctx.strokeStyle=R.itemNew?`rgba(255,215,106,${.55+.35*Math.sin(TIME*5)})`:'rgba(255,215,106,.3)';ctx.lineWidth=R.itemNew?2.5:1.2;
  ctx.beginPath();ctx.roundRect?ctx.roundRect(x0-s*.05,y0,wd+s*.05,ht,8):ctx.rect(x0,y0,wd,ht);ctx.fill();ctx.stroke();
  ctx.font=`800 ${Math.max(9,s*.34)}px "Barlow Condensed",sans-serif`;ctx.textAlign='left';ctx.textBaseline='bottom';ctx.fillStyle='#ffd76a';ctx.fillText('ITEMS',x0+2,y0-2);ctx.fillStyle='rgba(255,230,180,.55)';ctx.textAlign='right';ctx.fillText(R.items.length+'/'+ITEM_MAX,x0+wd,y0-2);
  for(let i=0;i<ITEM_MAX;i++){const p=itemSlot(i);ctx.strokeStyle='rgba(255,230,180,.13)';ctx.lineWidth=1;ctx.strokeRect(p.x-s*.46,p.y-s*.46,s*.92,s*.92)}ctx.restore();
  for(let i=0;i<R.items.length;i++){if(DRAG&&DRAG.item===i&&DRAG.moved)continue;if(FLY.some(f=>f.i===i))continue;const p=itemSlot(i);drawItemIcon(R.items[i],p.x,p.y,p.s)}
  // items flying in from where they dropped
  for(let k=FLY.length-1;k>=0;k--){const f=FLY[k];f.t+=FRAME_DT;const p=itemSlot(f.i),e=Math.min(1,f.t/.75),q=e*e*(3-2*e),x=lerp(f.x0,p.x,q),y=lerp(f.y0,p.y,q)-Math.sin(q*Math.PI)*s*2.5;
    ctx.save();ctx.globalCompositeOperation='lighter';const gl=glow('255,215,106');if(gl)ctx.drawImage(gl,x-s,y-s,s*2,s*2);ctx.restore();drawItemIcon(f.id,x,y,s*(1.3-.3*q));if(e>=1||f.i>=R.items.length)FLY.splice(k,1)}
  // until the first item is equipped, point at the rack
  if(R.items.length&&(META.itemHint||0)<2&&R.phase!=='wave'||R.itemNew&&R.items.length&&(META.itemHint||0)<2){const bob=Math.sin(TIME*5)*s*.15,tx=x0+wd*.5,ty=y0-s*.95+bob;
    ctx.save();ctx.font=`800 ${Math.max(11,s*.42)}px "Barlow Condensed",sans-serif`;ctx.textAlign='center';ctx.textBaseline='bottom';ctx.lineWidth=3;ctx.strokeStyle='rgba(0,0,0,.85)';ctx.strokeText('Drag an item onto a hero ▼',tx,ty);ctx.fillStyle='#ffe9a0';ctx.fillText('Drag an item onto a hero ▼',tx,ty);ctx.restore()}}
function drawHeroItems(h,x,y,size){if(!h.it||!h.it.length)return;const s=Math.max(11,size*.2);for(let i=0;i<h.it.length;i++)drawItemIcon(h.it[i],x+(i-(h.it.length-1)/2)*s*1.08,y,s)}
function itemAt(px,py){for(let i=0;i<R.items.length;i++){const p=itemSlot(i);if(Math.abs(px-p.x)<p.s*.55&&Math.abs(py-p.y)<p.s*.55)return i}return -1}
