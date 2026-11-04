// ---------- items: components drop from elites and bosses; two on one hero combine into a finished item ----------
const NOIT={dmg:0,as:0,sp:0,mana:0,crit:0,hp:0,rng:0,regen:0};
function itemStats(h){const it=h&&h.it;if(!it||!it.length)return NOIT;const key=it.join();if(h._ik===key)return h._is;const o=Object.assign({},NOIT);for(const id of it){const st=ITEMS[id].st;for(const k in st)o[k]+=st[k]}h._ik=key;h._is=o;return o}
const hasIt=(h,id)=>!!(h&&h.it&&h.it.includes(id));
const isComp=id=>!ITEMS[id].c;
const ITEM_MAX=8;
function stashItem(id){if(R.items.length<ITEM_MAX){R.items.push(id);return true}R.gold+=2;toast(`Item bench full: ${ITEMS[id].n} sold for 2 gold`);return false}
function dropItem(id,x,y){stashItem(id);if(x!=null)floatText(x,y-T*.9,'+ '+ITEMS[id].n,ITEMS[id].col,1.05);sfx('item',.45)}
// put an item on a hero; a component on a hero that holds a component makes a finished item
function giveItem(h,id){h.it=h.it||[];
  if(isComp(id)){const j=h.it.findIndex(isComp);if(j>=0){const fin=RECIPE[[h.it[j],id].sort().join('+')];h.it[j]=fin;if(DOM)toast(`${ITEMS[fin].n}: ${ITEMS[fin].d}`);fxItem(h);checkKit(h);return true}}
  if(h.it.length>=3){stashItem(id);return false}h.it.push(id);fxItem(h);checkKit(h);return true}
function canTake(h,id){h.it=h.it||[];return h.it.length<3||isComp(id)&&h.it.some(isComp)}
function equipFrom(i,h){const id=R.items[i];if(!id||!h)return false;if(!canTake(h,id)){toast('A hero can hold 3 items');return false}R.items.splice(i,1);giveItem(h,id);sfx('item',.5);if(h.hpMax)h.hpMax=heroMaxHp(h);return true}
function checkKit(h){if(h.it.filter(x=>!isComp(x)).length>=3)award('items3')}
function fxItem(h){if(h.c>=0)fx({k:'star',x:(h.c+.5)*T,y:(h.r+.5)*T,dur:.5,col:'#ffd76a'})}
function randomFinished(){return rndS(FINISHED)}
// ---------- drawing items: the item bench sits on both sides of the hero bench ----------
function itemSlot(i){const n=R.bench.length,b=benchSlot(n-1),a=benchSlot(0),s=Math.min(b.w*.62,bss(T*.6)),side=i<4?1:-1,k=i%4;
  return{x:side>0?b.x+b.w*.5+s*.62+k*s*1.06:a.x-a.w*.5-s*.62-k*s*1.06,y:b.y,s}}
function drawItemIcon(id,x,y,s,alpha){const I=ITEMS[id];if(!I)return;ctx.save();if(alpha!=null)ctx.globalAlpha=alpha;const fin=!isComp(id),r=s*.5;
  ctx.fillStyle=fin?'#2a1d10':'#1c1714';ctx.strokeStyle=fin?'#ffd76a':I.col;ctx.lineWidth=fin?2:1.5;ctx.beginPath();ctx.roundRect?ctx.roundRect(x-r,y-r,s,s,s*.2):ctx.rect(x-r,y-r,s,s);ctx.fill();ctx.stroke();
  ctx.fillStyle=I.col;ctx.textAlign='center';ctx.textBaseline='middle';
  if(fin){const a=ITEMS[I.c[0]],b=ITEMS[I.c[1]];ctx.font=`900 ${s*.42}px sans-serif`;ctx.fillStyle=a.col;ctx.fillText(a.ic,x-s*.17,y-s*.12);ctx.fillStyle=b.col;ctx.fillText(b.ic,x+s*.17,y+s*.14)}
  else{ctx.font=`900 ${s*.62}px sans-serif`;ctx.fillText(I.ic,x,y+s*.03)}ctx.restore()}
function drawItems(){for(let i=0;i<R.items.length;i++){if(DRAG&&DRAG.item===i&&DRAG.moved)continue;const p=itemSlot(i);drawItemIcon(R.items[i],p.x,p.y,p.s)}}
function drawHeroItems(h,x,y,size){if(!h.it||!h.it.length)return;const s=Math.max(9,size*.17);for(let i=0;i<h.it.length;i++)drawItemIcon(h.it[i],x+(i-(h.it.length-1)/2)*s*1.08,y,s)}
function itemAt(px,py){for(let i=0;i<R.items.length;i++){const p=itemSlot(i);if(Math.abs(px-p.x)<p.s*.6&&Math.abs(py-p.y)<p.s*.6)return i}return -1}
