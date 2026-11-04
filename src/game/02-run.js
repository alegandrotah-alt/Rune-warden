// ---------- run state, the field, the maze ----------
const SPAWN_ROWS=[3,4],KEEP_ROWS=[3,4];
let R=null,UID=1;
const has=id=>R&&R.relics.includes(id);
// gameplay randomness: seeded during a daily challenge so everyone gets the same shops, waves, map and field
function rng(){if(!R||!R.daily)return Math.random();let t=R.rs=(R.rs+0x6D2B79F5)|0;t=Math.imul(t^t>>>15,1|t);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}
const rndS=a=>a[(rng()*a.length)|0];
const asc=n=>R&&(R.asc||0)>=n;
const unlocked=k=>!UNLOCK[k]||!!(META.unl&&META.unl[k]);
const dayKey=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const relicN=id=>R?R.relics.filter(r=>r===id).length:0;
const isFront=k=>HEROES[k].rng<2;
function newRun(o){o=o||{};const A=o.daily?2:clamp(o.asc||0,0,10),hp=100+10*rank('keep')-(A>=5?20:0);
  R={act:0,wave:1,gold:8+2*rank('gold')-(A>=3?3:0),lvl:2,xp:0,hp,hpMax:hp,bench:new Array(8+rank('bench')).fill(null),board:[],items:[],
    shop:[],relics:[],stones:rank('stone')?[2]:[],streak:0,phase:'plan',rerolls:0,freeRoll:0,portalGold:0,goldFrac:0,egg:-1,pool:{},picks:[],leakAct:0,
    stats:{kills:0,dmg:0,leaks:0,maxMaze:0,elites:0,pots:0},potions:[],room:null,queue:null,spoils:null,calm:0,endless:false,speed:SET.speedPref||1,b:null,seed:(Math.random()*1e9)|0,asc:A,daily:o.daily||null,rs:0,node:'battle',map:null};
  R.guards=o.daily?[{k:'archers',l:1,t:1}]:stage()<2?[]:guardLoadout();const ban=R.guards.find(g=>g.k==='banner');if(ban){R.hpMax+=10*ban.l;R.hp=R.hpMax}
  if(rank('promo'))R.lvl=3;if(rank('potion'))R.potions.push(rnd(POTKEYS));for(let i=0;i<rank('item');i++)R.items.push(rnd(COMPS));
  if(R.daily){let h=7;for(const ch of R.daily)h=Math.imul(h^ch.charCodeAt(0),2654435761);R.rs=h|0;R.seed=h>>>0}
  for(const k of HKEYS)R.pool[k]=unlocked(k)||R.daily?POOL[HEROES[k].c]:0;
  genField();genMap();autoNode();rollShop(true);
  // a free starter so the first wave is never empty
  const starters=HKEYS.filter(k=>HEROES[k].c===1&&R.pool[k]>0);addHero(rndS(starters),1,true);if(rank('vet')&&allHeroes()[0])allHeroes()[0].vet=1;
  if(rank('relic')&&!R.daily){const r=randomRelic(1);if(r){R.relics.push(r);applyRelic(r)}}
  if(R.daily){const r2=RELICS.filter(r=>r.t===2&&!['egg','recruit'].includes(r.id));const id=rndS(r2).id;R.relics.push(id);applyRelic(id);R.dailyRelic=id}
  R.freeRoll=rank('reroll');R.nextQ=nodeQ(waveList(1));
  // the oracle offers three plain gifts and one with a price
  if(o.oracle){const safe=Object.keys(ORACLE).filter(k=>!ORACLE[k].risk),pick=[];while(pick.length<3){const k=rndS(safe);if(!pick.includes(k))pick.push(k)}pick.push(rndS(['risk','risk2']));R.room={t:'oracle',opts:pick};R.phase='room'}
}
// obstacles, runes and portals are re-dealt every act
function genField(){
  // runes you placed yourself travel with you into the next act
  const mine=R.field?R.field.runes.filter(q=>q.mine):[];
  const F=R.field={blk:new Uint8Array(COLS*ROWS),obs:[],runes:[],portals:[]};
  for(const q of mine)F.runes.push({c:q.c,r:q.r,v:q.v,ph:q.ph||0,flash:.6,mine:1});
  const free=(c,r)=>!F.blk[r*COLS+c]&&!F.runes.some(q=>q.c===c&&q.r===r)&&!F.portals.some(q=>q.c===c&&q.r===r)&&!(c<=1&&SPAWN_ROWS.includes(r))&&!(c>=COLS-2&&KEEP_ROWS.includes(r));
  const kinds=[[0,0,1,2,3,4,5],[0,1,2,3,3,4,5],[0,1,2,3,4,5,5]][R.act];
  for(let i=0,n=6+R.act*2,tries=0;i<n&&tries<200;tries++){const c=1+((rng()*(COLS-2))|0),r=(rng()*ROWS)|0;if(!free(c,r))continue;F.blk[r*COLS+c]=2;
    if(!flow(F.blk)){F.blk[r*COLS+c]=0;continue}F.obs.push({c,r,k:rndS(kinds),a:R.act});i++}
  // runes sit in the middle of the field; portals are off to the side so you choose whether to route monsters through them
  const put=(arr,v,cmin,cmax,rows)=>{for(let t=0;t<80;t++){const c=cmin+((rng()*(cmax-cmin+1))|0),r=rndS(rows);if(free(c,r)){arr.push({c,r,v,ph:rng()*6});return}}};
  put(F.runes,2,4,6,[2,3,4,5]);put(F.runes,2,7,10,[1,2,5,6]);if(R.act>=1)put(F.runes,3,5,9,[0,7]);
  put(F.portals,2,3,6,[0,1,6,7]);if(R.act>=1)put(F.portals,2,8,11,[0,1,6,7]);if(R.act>=2)put(F.portals,3,5,9,[1,6]);
  // heroes left on blocked tiles go back to the bench
  for(const h of R.board.slice())if(F.blk[h.r*COLS+h.c]||F.runes.some(q=>q.c===h.c&&q.r===h.r)||F.portals.some(q=>q.c===h.c&&q.r===h.r))toBench(h);
  rebuildBlk();if(typeof bgDirty!=='undefined')bgDirty=1;
}
function rebuildBlk(){const F=R.field;for(let i=0;i<F.blk.length;i++)if(F.blk[i]===1)F.blk[i]=0;for(const h of R.board)F.blk[h.r*COLS+h.c]=1;F.dist=flow(F.blk);F.route=traceRoute();}
// breadth-first flow field from the keep; returns null if no entrance can reach it
function flow(blk){
  const d=new Int16Array(COLS*ROWS).fill(-1),q=[];
  for(const r of KEEP_ROWS){const i=r*COLS+COLS-1;if(!blk[i]){d[i]=0;q.push(i)}}
  for(let h=0;h<q.length;h++){const i=q[h],c=i%COLS,r=(i/COLS)|0;for(const [nc,nr] of nbrs(c,r)){const j=nr*COLS+nc;if(blk[j]||d[j]>=0)continue;d[j]=d[i]+1;q.push(j)}}
  return SPAWN_ROWS.some(r=>d[r*COLS]>=0)?d:null}
function canPlace(c,r){const F=R.field,i=r*COLS+c;if(c<0||r<0||c>=COLS||r>=ROWS||F.blk[i])return false;if(F.runes.some(q=>q.c===c&&q.r===r)||F.portals.some(q=>q.c===c&&q.r===r))return false;
  const b=F.blk.slice();b[i]=1;return !!flow(b)}
function nextCell(c,r){const d=R.field.dist,cur=d[r*COLS+c];let best=null,bd=cur<0?1e9:cur;
  for(const [nc,nr] of nbrs(c,r)){const v=d[nr*COLS+nc];if(v>=0&&v<bd){bd=v;best=[nc,nr]}}
  return best}
function traceRoute(){const d=R.field.dist;if(!d)return[];let r=SPAWN_ROWS.filter(rr=>d[rr*COLS]>=0).sort((a,b)=>d[a*COLS]-d[b*COLS])[0];if(r==null)return[];let c=0;const out=[[c,r]];
  for(let i=0;i<COLS*ROWS;i++){const n=nextCell(c,r);if(!n)break;[c,r]=n;out.push([c,r])}const L=out.length;if(R.stats&&L>R.stats.maxMaze){R.stats.maxMaze=L;if(L>=40)award('maze40');if(L>=70)award('h_maze')}return out}
const runeAt=(c,r)=>R.field.runes.find(q=>q.c===c&&q.r===r);
const portalAt=(c,r)=>R.field.portals.find(q=>q.c===c&&q.r===r);
const runeMul=q=>q.v+(has('runesmith')?1:0)+(has('heart')?2:0)+(has('dome')?2:0)+(R.ink?1:0)+(hasGuard('oracle')?1:0);
const portalMul=q=>q.v+(has('riftlord')?1:0);
// ---------- heroes: bench, field, merging ----------
const boardMax=()=>R.lvl+(has('recruit')?1:0)+(has('kingmaker')?2:0)+['crown','ecto','sozu','coffee','fusion'].filter(has).length;
function heroAt(c,r){return R.board.find(h=>h.c===c&&h.r===r)}
function mkHero(k,star){return{uid:UID++,k,star,mana:0,cd:Math.random()*.5,atk:0,face:1,hits:0,buffT:0,c:-1,r:-1,it:[]}}
function addHero(k,star,free){
  const slot=R.bench.indexOf(null);
  // a third copy merges even with a full bench
  const same=allHeroes().filter(h=>h.k===k&&h.star===star);
  if(slot<0&&same.length<2)return false;
  const h=mkHero(k,star||1);if(slot>=0)R.bench[slot]=h;else{h.tmp=1}
  if(!free)R.pool[k]=Math.max(0,R.pool[k]-1);
  merge(h);return true}
function allHeroes(){return R.board.concat(R.bench.filter(Boolean))}
function merge(h){
  const same=allHeroes().filter(x=>x.k===h.k&&x.star===h.star);if(h.tmp&&!same.includes(h))same.push(h);
  if(same.length<3||h.star>=3){if(h.tmp)delete h.tmp;return}
  const keep=same.find(x=>R.board.includes(x))||same.find(x=>!x.tmp)||same[0];
  for(const x of same.slice(0,3)){if(x===keep)continue;removeHero(x);keep.vet=Math.max(keep.vet||0,x.vet||0);for(const it of x.it||[])giveItem(keep,it)}
  delete keep.tmp;keep.star++;keep.mana=0;fxStar(keep);if(keep.star===3){award('star3');if(keep.k==='wyrm')award('h_dragon');if(R.board.filter(x=>x.star===3).length>=3)award('h_three')}
  merge(keep)}
function removeHero(h){const i=R.board.indexOf(h);if(i>=0){R.board.splice(i,1);rebuildBlk()}const j=R.bench.indexOf(h);if(j>=0)R.bench[j]=null}
function toBench(h){const j=R.bench.indexOf(null);if(j<0)return false;const i=R.board.indexOf(h);if(i>=0)R.board.splice(i,1);R.bench[j]=h;h.c=h.r=-1;rebuildBlk();return true}
function placeHero(h,c,r){if(!canPlace(c,r))return false;const onBoard=R.board.includes(h);if(!onBoard&&R.board.length>=boardMax())return false;
  if(onBoard){R.board.splice(R.board.indexOf(h),1);rebuildBlk();if(!canPlace(c,r)){R.board.push(h);rebuildBlk();return false}}
  const j=R.bench.indexOf(h);if(j>=0)R.bench[j]=null;h.c=c;h.r=r;R.board.push(h);rebuildBlk();if(HEROES[h.k].c===5&&!onBoard&&typeof fx==='function'){fx({k:'pillar',x:hx(c,r),y:hy(r),dur:.9});sfx('sp_holy',.5,.8)}META.seen[h.k]=1;if(HKEYS.every(k=>META.seen[k]))award('all18');return true}
const sellValue=h=>HEROES[h.k].c*Math.pow(3,h.star-1)-(h.star>1&&HEROES[h.k].c>1?1:0);
function sellHero(h){R.gold+=sellValue(h);R.pool[h.k]+=Math.pow(3,h.star-1);removeHero(h);for(const it of h.it||[])stashItem(it);h.it=[];sfx('coin',.5)}
// ---------- traits and hero stats ----------
let SYN={};
function calcTraits(){const seen={},cnt={};for(const h of R.board){if(seen[h.k])continue;seen[h.k]=1;for(const t of HEROES[h.k].tr)cnt[t]=(cnt[t]||0)+1}
  for(const r of R.relics){const em=RELIC[r].em;if(em)cnt[em]=(cnt[em]||0)+1}
  for(const g of R.guards||[])for(const t of GUARDS[g.k].tr)cnt[t]=(cnt[t]||0)+1;
  // frontline auras: a melee hero buffs the heroes on the hexes touching it
  for(const h of R.board)h.au={as:0,dmg:0,dr:0,hp:0,heal:0};
  for(const h of R.board){const F=HEROES[h.k].fl;if(!F)continue;const A={rally:['as',.15],howl:['as',.2],warcry:['dmg',.15],ward:['dr',.2],tend:['heal',.03],bulwark:['hp',.3]}[F.k];if(!A)continue;
    for(const [c,r] of nbrs(h.c,h.r)){const o=heroAt(c,r);if(o&&o!==h){o.au[A[0]]+=A[1];if(F.k==='ward')o.au.heal+=.02}}}
  SYN={};for(const t of TRAIT_ORDER){const n=cnt[t]||0,bp=TRAITS[t].bp;let tier=-1;bp.forEach((b,i)=>{if(n>=b)tier=i});SYN[t]={n,tier};if(tier===bp.length-1&&bp.length>1)award('trait6')}
  return SYN}
const tier=t=>SYN[t]?SYN[t].tier:-1;
function heroStats(h){const D=HEROES[h.k],m=STARM[h.star],tr=D.tr,s={dmg:D.dmg*m,as:D.as,rng:D.rng,crit:0,cm:2,spell:1};
  if(tr.includes('kingdom')&&tier('kingdom')>=0)s.as*=1+[.2,.45,.8][tier('kingdom')];
  if(tr.includes('marksman')&&tier('marksman')>=0){s.rng+=tier('marksman')+1;s.as*=1+[.15,.35][tier('marksman')]}
  if(tr.includes('assassin')&&tier('assassin')>=0){s.crit=[.2,.4][tier('assassin')];s.cm=[2,2.5][tier('assassin')]}
  if(tr.includes('sorcerer')&&tier('sorcerer')>=0)s.spell=1+[.3,.7,1.4][tier('sorcerer')];
  if(tr.includes('wildwood')&&tier('wildwood')>=2)s.dmg*=1.4;
  if(has('crit'))s.crit=1-(1-s.crit)*.85;if(has('haste'))s.as*=1.15;if(has('eagle'))s.rng+=1;
  if(has('collector'))s.dmg*=Math.pow(1.06,R.relics.length);
  if(h.buffT>0)s.as*=h.buffAs||2;
  if(h.vet)s.dmg*=1+.25*h.vet;if(h.au){s.as*=1+h.au.as;s.dmg*=1+h.au.dmg}if(h.hoard)s.dmg*=1+.005*h.hoard;if(has('philo'))s.dmg*=1.3;if(R.b&&R.b.rageT>0)s.as*=1.6;
  // items
  const I=itemStats(h);s.dmg*=1+I.dmg;s.as*=1+I.as;s.spell*=1+I.sp;s.crit=1-(1-s.crit)*(1-I.crit);s.rng+=I.rng||0;
  if(hasIt(h,'edge'))s.cm+=.5;if(hasIt(h,'titan'))s.dmg*=1+Math.min(.8,.04*(h.stk||0));if(hasIt(h,'rage'))s.as*=1+Math.min(2,.04*(h.stk||0));
  if(h.chillT>0)s.as*=.7;
  return s}
// hero health: bigger heroes, stars and Guardians are tougher; it refills every wave
function heroMaxHp(h){const D=HEROES[h.k];return Math.round((380+120*D.c)*[0,1,1.8,3.2][h.star]*(D.tr.includes('guardian')?1.5:1)*(isFront(h.k)?1.35:1)*(1+itemStats(h).hp)*(1+.25*(h.vet||0))*(1+(h.au?h.au.hp:0)))}
