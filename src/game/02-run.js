// ---------- run state, the field, the maze ----------
const SPAWN_ROWS=[3,4],KEEP_ROWS=[3,4];
let R=null,UID=1;
const has=id=>R&&R.relics.includes(id);
const relicN=id=>R?R.relics.filter(r=>r===id).length:0;
function newRun(){
  R={act:0,wave:1,gold:8+2*rank('gold'),lvl:2,xp:0,hp:100+10*rank('keep'),hpMax:100+10*rank('keep'),bench:new Array(8+rank('bench')).fill(null),board:[],
    shop:[],relics:[],stones:rank('stone')?[2]:[],streak:0,phase:'plan',rerolls:0,freeRoll:0,portalGold:0,goldFrac:0,egg:-1,pool:{},picks:[],leakAct:0,
    stats:{kills:0,dmg:0,leaks:0,maxMaze:0},endless:false,speed:SET.speedPref||1,b:null,seed:(Math.random()*1e9)|0};
  for(const k of HKEYS)R.pool[k]=POOL[HEROES[k].c];
  genField();rollShop(true);
  // a free starter so the first wave is never empty
  const starters=HKEYS.filter(k=>HEROES[k].c===1);addHero(rnd(starters),1,true);
  R.freeRoll=rank('reroll');
}
// obstacles, runes and portals are re-dealt every act
function genField(){
  const F=R.field={blk:new Uint8Array(COLS*ROWS),obs:[],runes:[],portals:[]};
  const free=(c,r)=>!F.blk[r*COLS+c]&&!F.runes.some(q=>q.c===c&&q.r===r)&&!F.portals.some(q=>q.c===c&&q.r===r)&&!(c<=1&&SPAWN_ROWS.includes(r))&&!(c>=COLS-2&&KEEP_ROWS.includes(r));
  const kinds=[[0,0,1,3,4],[0,1,1,5,3],[2,2,3,4,4]][R.act];
  for(let i=0,n=6+R.act*2,tries=0;i<n&&tries<200;tries++){const c=1+((Math.random()*(COLS-2))|0),r=(Math.random()*ROWS)|0;if(!free(c,r))continue;F.blk[r*COLS+c]=2;
    if(!flow(F.blk)){F.blk[r*COLS+c]=0;continue}F.obs.push({c,r,k:rnd(kinds)});i++}
  // runes sit in the middle of the field; portals are off to the side so you choose whether to route monsters through them
  const put=(arr,v,cmin,cmax,rows)=>{for(let t=0;t<80;t++){const c=cmin+((Math.random()*(cmax-cmin+1))|0),r=rnd(rows);if(free(c,r)){arr.push({c,r,v,ph:Math.random()*6});return}}};
  put(F.runes,2,4,6,[2,3,4,5]);put(F.runes,2,7,10,[1,2,5,6]);if(R.act>=1)put(F.runes,3,5,9,[0,7]);
  put(F.portals,2,3,6,[0,1,6,7]);if(R.act>=1)put(F.portals,2,8,11,[0,1,6,7]);if(R.act>=2)put(F.portals,3,5,9,[3,4]);
  // heroes left on blocked tiles go back to the bench
  for(const h of R.board.slice())if(F.blk[h.r*COLS+h.c]||F.runes.some(q=>q.c===h.c&&q.r===h.r)||F.portals.some(q=>q.c===h.c&&q.r===h.r))toBench(h);
  rebuildBlk();if(typeof bgDirty!=='undefined')bgDirty=1;
}
function rebuildBlk(){const F=R.field;for(let i=0;i<F.blk.length;i++)if(F.blk[i]===1)F.blk[i]=0;for(const h of R.board)F.blk[h.r*COLS+h.c]=1;F.dist=flow(F.blk);F.route=traceRoute();}
// breadth-first flow field from the keep; returns null if no entrance can reach it
function flow(blk){
  const d=new Int16Array(COLS*ROWS).fill(-1),q=[];
  for(const r of KEEP_ROWS){const i=r*COLS+COLS-1;if(!blk[i]){d[i]=0;q.push(i)}}
  for(let h=0;h<q.length;h++){const i=q[h],c=i%COLS,r=(i/COLS)|0;for(const [dc,dr] of [[1,0],[-1,0],[0,1],[0,-1]]){const nc=c+dc,nr=r+dr;if(nc<0||nr<0||nc>=COLS||nr>=ROWS)continue;const j=nr*COLS+nc;if(blk[j]||d[j]>=0)continue;d[j]=d[i]+1;q.push(j)}}
  return SPAWN_ROWS.some(r=>d[r*COLS]>=0)?d:null}
function canPlace(c,r){const F=R.field,i=r*COLS+c;if(c<0||r<0||c>=COLS||r>=ROWS||F.blk[i])return false;if(F.runes.some(q=>q.c===c&&q.r===r)||F.portals.some(q=>q.c===c&&q.r===r))return false;
  const b=F.blk.slice();b[i]=1;return !!flow(b)}
function nextCell(c,r){const d=R.field.dist,cur=d[r*COLS+c];let best=null,bd=cur<0?1e9:cur;
  for(const [dc,dr] of [[1,0],[0,1],[0,-1],[-1,0]]){const nc=c+dc,nr=r+dr;if(nc<0||nr<0||nc>=COLS||nr>=ROWS)continue;const v=d[nr*COLS+nc];if(v>=0&&v<bd){bd=v;best=[nc,nr]}}
  return best}
function traceRoute(){const d=R.field.dist;if(!d)return[];let r=SPAWN_ROWS.filter(rr=>d[rr*COLS]>=0).sort((a,b)=>d[a*COLS]-d[b*COLS])[0];if(r==null)return[];let c=0;const out=[[c,r]];
  for(let i=0;i<COLS*ROWS;i++){const n=nextCell(c,r);if(!n)break;[c,r]=n;out.push([c,r])}const L=out.length;if(R.stats&&L>R.stats.maxMaze){R.stats.maxMaze=L;if(L>=40)award('maze40');if(L>=70)award('h_maze')}return out}
const runeAt=(c,r)=>R.field.runes.find(q=>q.c===c&&q.r===r);
const portalAt=(c,r)=>R.field.portals.find(q=>q.c===c&&q.r===r);
const runeMul=q=>q.v+(has('runesmith')?1:0)+(has('heart')?2:0);
const portalMul=q=>q.v+(has('riftlord')?1:0);
// ---------- heroes: bench, field, merging ----------
const boardMax=()=>R.lvl+(has('recruit')?1:0)+(has('kingmaker')?2:0);
function heroAt(c,r){return R.board.find(h=>h.c===c&&h.r===r)}
function mkHero(k,star){return{uid:UID++,k,star,mana:0,cd:Math.random()*.5,atk:0,face:1,hits:0,buffT:0,c:-1,r:-1}}
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
  for(const x of same.slice(0,3)){if(x===keep)continue;removeHero(x)}
  delete keep.tmp;keep.star++;keep.mana=0;fxStar(keep);if(keep.star===3){award('star3');if(keep.k==='wyrm')award('h_dragon');if(R.board.filter(x=>x.star===3).length>=3)award('h_three')}
  merge(keep)}
function removeHero(h){const i=R.board.indexOf(h);if(i>=0){R.board.splice(i,1);rebuildBlk()}const j=R.bench.indexOf(h);if(j>=0)R.bench[j]=null}
function toBench(h){const j=R.bench.indexOf(null);if(j<0)return false;const i=R.board.indexOf(h);if(i>=0)R.board.splice(i,1);R.bench[j]=h;h.c=h.r=-1;rebuildBlk();return true}
function placeHero(h,c,r){if(!canPlace(c,r))return false;const onBoard=R.board.includes(h);if(!onBoard&&R.board.length>=boardMax())return false;
  if(onBoard){R.board.splice(R.board.indexOf(h),1);rebuildBlk();if(!canPlace(c,r)){R.board.push(h);rebuildBlk();return false}}
  const j=R.bench.indexOf(h);if(j>=0)R.bench[j]=null;h.c=c;h.r=r;R.board.push(h);rebuildBlk();META.seen[h.k]=1;if(HKEYS.every(k=>META.seen[k]))award('all18');return true}
const sellValue=h=>HEROES[h.k].c*Math.pow(3,h.star-1)-(h.star>1&&HEROES[h.k].c>1?1:0);
function sellHero(h){R.gold+=sellValue(h);R.pool[h.k]+=Math.pow(3,h.star-1);removeHero(h);sfx('coin',.5)}
// ---------- traits and hero stats ----------
let SYN={};
function calcTraits(){const seen={},cnt={};for(const h of R.board){if(seen[h.k])continue;seen[h.k]=1;for(const t of HEROES[h.k].tr)cnt[t]=(cnt[t]||0)+1}
  for(const r of R.relics){const em=RELIC[r].em;if(em)cnt[em]=(cnt[em]||0)+1}
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
  return s}
