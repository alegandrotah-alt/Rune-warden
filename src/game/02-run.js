// ---------- run state, the field, the maze ----------
const SPAWN_ROWS=[4,5],KEEP_ROWS=[4,5];
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
// an act's look and monsters: the act itself, overridden by the biome this run rolled for it
function actD(a){a=Math.max(0,Math.min(3,a|0));if(a===3)return RIFT;const b=R&&R.bio&&typeof BIOMES!=='undefined'?BIOMES[R.bio[a]]:null;return b?Object.assign({},ACTS[a],b):ACTS[a]}
// a floor that ends in a boss: the tenth of each act, or the last of the Rift
const bossWave=w=>R&&R.rift?w===30+RIFTN:w%10===0&&w<=30;
function newRun(o){o=o||{};const A=o.daily?2:CHALL[o.ch]?0:clamp(o.asc||0,0,10),wk=!o.daily&&WARDENS[o.warden]&&wardenOpen(o.warden)?o.warden:'castellan',hp=100+10*rank('keep')-(A>=5?20:0)+({castellan:10,gravewarden:-10}[wk]||0);
  R={act:0,wave:1,gold:8+2*rank('gold')-(A>=3?3:0),lvl:2,xp:0,hp,hpMax:hp,bench:new Array(8+rank('bench')).fill(null),board:[],items:[],
    shop:[],relics:[],stones:rank('stone')?[2]:[],streak:0,phase:'plan',rerolls:0,freeRoll:0,portalGold:0,goldFrac:0,egg:-1,pool:{},picks:[],leakAct:0,
    stats:{kills:0,dmg:0,leaks:0,maxMaze:0,elites:0,pots:0},potions:[],room:null,queue:null,spoils:null,calm:0,endless:false,speed:SET.speedPref||1,b:null,seed:(Math.random()*1e9)|0,asc:A,daily:o.daily||null,rs:0,node:'battle',map:null,warden:wk,t0:Date.now(),secs:0,cnt:{},tree:[],tp:0,pact:[],pacts:null,ch:!o.daily&&CHALL[o.ch]?o.ch:null};modsDirty();
  R.guards=o.daily?[{k:'archers',l:1,t:1}]:stage()<2?[]:guardLoadout();
  // the warden's favoured guardian fights one level higher when it is stationed
  if(!o.daily)for(const g of R.guards)if(g.k===WARDENS[wk].g)g.l=Math.min(5,g.l+1);
  const ban=R.guards.find(g=>g.k==='banner');if(ban){R.hpMax+=10*ban.l;R.hp=R.hpMax}
  if(wk==='runesmith')R.stones.push(2);if(rank('promo'))R.lvl=3;if(rank('potion'))R.potions.push(rnd(POTKEYS));for(let i=0;i<rank('item');i++)R.items.push(rnd(COMPS));
  if(R.daily){let h=7;for(const ch of R.daily)h=Math.imul(h^ch.charCodeAt(0),2654435761);R.rs=h|0;R.seed=h>>>0}
  for(const k of HKEYS)R.pool[k]=unlocked(k)||R.daily?POOL[HEROES[k].c]:0;
  // each act rolls its usual biome or the alternate one (first runs keep the usual ones)
  R.bio=[0,1,2].map(a=>stage()>=1&&rng()<.5?BIOALT[a]:null);
  genField();genMap();autoNode();rollShop(true);
  // a free starter so the first wave is never empty
  const starters=HKEYS.filter(k=>HEROES[k].c===1&&R.pool[k]>0);addHero(rndS(starters),1,true);if(wk==='beastlord')addHero('wolf',1,true);if(rank('vet')&&allHeroes()[0])allHeroes()[0].vet=1;
  if(rank('relic')&&!R.daily){const r=randomRelic(1);if(r){R.relics.push(r);applyRelic(r)}}
  if(R.daily){const r2=RELICS.filter(r=>r.t===2&&!['egg','recruit'].includes(r.id));const id=rndS(r2).id;R.relics.push(id);applyRelic(id);R.dailyRelic=id}
  if(R.ch&&CHALL[R.ch].start)CHALL[R.ch].start();
  R.freeRoll=rank('reroll')+mods().free;R.nextQ=nodeQ(waveList(1));
  // the oracle offers three plain gifts and one with a price
  if(o.oracle){const safe=Object.keys(ORACLE).filter(k=>!ORACLE[k].risk),pick=[];while(pick.length<3){const k=rndS(safe);if(!pick.includes(k))pick.push(k)}pick.push(rndS(['risk','risk2']));R.room={t:'oracle',opts:pick};R.phase='room'}
}
// obstacles, terrain, gates, runes and portals are re-dealt every act
// gates are where monsters come from: the west gate is always there; edge gates (north/south) and breaches in the field open as the run goes on
// terrain: 1 high ground (+1 range for shooters, +20% damage for melee), 2 mud (monsters 35% slower), 3 thorns (monsters bleed), 4 water (nobody walks or stands there)
const TER={hill:1,mud:2,thorn:3,water:4};
const TERN=['','High ground','Mud','Thorns','Water'];
const terAt=(c,r)=>R.field.ter?R.field.ter[r*COLS+c]:0;
const gateCell=g=>g.k==='west'?null:[g.c,g.r];
function genField(){
  // runes you placed yourself travel with you into the next act
  const mine=R.field?R.field.runes.filter(q=>q.mine):[];
  const A=actD(R.act),TW=A.ter||{water:1,hill:3,mud:2,thorn:1};
  const F=R.field={blk:new Uint8Array(COLS*ROWS),ter:new Uint8Array(COLS*ROWS),obs:[],runes:[],portals:[],gates:[{k:'west',c:0,r:4,id:0}],grown:0};
  genIsland(F);
  // gates for this act (portal rules: every gate opens in the western half of the field, at least 8 hexes from the keep): one edge gate in act I, both in act II, both plus a breach in act III
  const gl=[];const eg=(k,r0)=>{for(let t=0;t<30;t++){const c=2+((rng()*5)|0),r=rimRow(F,c,r0===0);if(r<0)continue;if(!F.gates.some(g=>Math.abs(g.c-c)<2&&g.r===r)){F.gates.push({k,c,r,id:F.gates.length});return}}};
  const ns=rng()<.5;if(R.act>=0)eg(ns?'north':'south',ns?0:ROWS-1);if(R.act>=1)eg(ns?'south':'north',ns?ROWS-1:0);
  if(R.act>=2||R.endless){for(let t=0;t<40;t++){const c=3+((rng()*5)|0),r=2+((rng()*6)|0);if(F.land[r*COLS+c]&&!F.gates.some(g=>Math.abs(g.c-c)+Math.abs(g.r-r)<4)){F.gates.push({k:'breach',c,r,id:F.gates.length});break}}}
  const gateNear=(c,r)=>F.gates.some(g=>g.k!=='west'&&Math.abs(g.c-c)<=1&&Math.abs(g.r-r)<=1);
  for(const q of mine)if(!gateNear(q.c,q.r))F.runes.push({c:q.c,r:q.r,v:q.v,k:q.k,ph:q.ph||0,flash:.6,mine:1});
  const free=(c,r)=>!F.blk[r*COLS+c]&&!F.ter[r*COLS+c]&&!F.runes.some(q=>q.c===c&&q.r===r)&&!F.portals.some(q=>q.c===c&&q.r===r)&&!gateNear(c,r)&&!(c<=1&&SPAWN_ROWS.includes(r))&&!(c>=COLS-2&&KEEP_ROWS.includes(r));
  // water first: little lakes and streams of 2-4 hexes that block the road
  for(let i=0,tries=0;i<(TW.water||0)&&tries<60;tries++){let c=2+((rng()*(COLS-5))|0),r=(rng()*ROWS)|0;if(!free(c,r))continue;const cells=[[c,r]],n=2+((rng()*3)|0);
    for(let j=1;j<n;j++){const nb=nbrs(c,r).filter(([a,b])=>free(a,b)&&!cells.some(([x,y])=>x===a&&y===b));if(!nb.length)break;[c,r]=rndS(nb);cells.push([c,r])}
    for(const [a,b] of cells){F.blk[b*COLS+a]=2;F.ter[b*COLS+a]=4}if(!flow(F.blk)){for(const [a,b] of cells){F.blk[b*COLS+a]=0;F.ter[b*COLS+a]=0}continue}i++}
  const kinds=[[0,0,1,2,3,4,5],[0,1,2,3,3,4,5],[0,1,2,3,4,5,5]][Math.min(2,R.act)];
  for(let i=0,n=7+R.act*2,tries=0;i<n&&tries<200;tries++){const c=1+((rng()*(COLS-2))|0),r=(rng()*ROWS)|0;if(!free(c,r))continue;F.blk[r*COLS+c]=2;
    if(!flow(F.blk)){F.blk[r*COLS+c]=0;continue}F.obs.push({c,r,k:rndS(kinds),a:A.obs??R.act});i++}
  // soft terrain: patches of mud and thorns along the middle, single hills where shooters like to stand
  const patch=(t,n,sz)=>{for(let i=0,tries=0;i<n&&tries<80;tries++){let c=2+((rng()*(COLS-4))|0),r=(rng()*ROWS)|0;if(!free(c,r))continue;F.ter[r*COLS+c]=t;
    for(let j=1;j<sz;j++){const nb=nbrs(c,r).filter(([a,b])=>free(a,b));if(!nb.length)break;[c,r]=rndS(nb);F.ter[r*COLS+c]=t}i++}};
  patch(1,TW.hill||0,1);patch(2,TW.mud||0,3);patch(3,TW.thorn||0,2);
  // runes sit in the middle of the field; portals are off to the side so you choose whether to route monsters through them
  const put=(arr,v,cmin,cmax,rows)=>{for(let t=0;t<80;t++){const c=cmin+((rng()*(cmax-cmin+1))|0),r=rndS(rows);if(free(c,r)){arr.push({c,r,v,ph:rng()*6});return}}};
  put(F.runes,2,4,7,[2,3,4,5,6,7]);put(F.runes,2,8,12,[1,2,7,8]);if(R.act>=1)put(F.runes,3,5,11,[0,9]);
  // from act II on, one of the field's own runes is attuned (two in the Rift)
  if(R.act>=1){const own=F.runes.filter(q=>!q.mine&&!q.k);for(let i=0;i<(R.act>=3?2:1)&&own.length;i++)own.splice((rng()*own.length)|0,1)[0].k=rndS(RKEYS)}
  put(F.portals,2,3,7,[0,1,8,9]);if(R.act>=1)put(F.portals,2,7,10,[0,1,8,9]);if(R.act>=2)put(F.portals,3,5,9,[1,8]);
  // heroes left on blocked tiles go back to the bench
  for(const h of R.board.slice())if(F.blk[h.r*COLS+h.c]||isGate(h.c,h.r)||F.runes.some(q=>q.c===h.c&&q.r===h.r)||F.portals.some(q=>q.c===h.c&&q.r===h.r))toBench(h);
  genSky(F);rebuildBlk();fixRoads();if(typeof bgDirty!=='undefined')bgDirty=1;
}
// ---- the floating island ----
// The field is a 16×10 grid, but only the island's hexes are land: the rest is open sky (blk 3), where nothing stands and no road runs.
// Each act raises a new island; land bought with Expand (R.isle) makes every later island bigger too.
const ISLE=[100,112,124,112];
const isleN=()=>Math.min(COLS*ROWS-8,(R.endless?132:ISLE[Math.min(3,R.act)])+(R.isle||0));
// island shapes: a plain oval, twin isles joined at a narrow waist, a crescent with a bay bitten out of one side, or a ring around a hole in the sky
const ISHAPE=['Oval Isle','Twin Isles','Crescent Isle','Ring Isle'];
function genIsland(F){const N=isleN(),L=F.land=new Uint8Array(COLS*ROWS),sc=[],ph=rng()*6.283,ph2=rng()*6.283,amp=.6+rng()*.6,squash=1+rng()*.35,
    k=F.shape=R.act===0&&!R.endless&&!R.isle?0:(rng()*ISHAPE.length)|0,bs=rng()<.5?-1:1,bx=(rng()-.5)*.6,hxp=(rng()-.5)*.5,hyp=(rng()<.5?-1:1)*(.3+rng()*.15);
  for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){const x=(c+(r&1)*.5-7.75)/8.4,y=(r-4.5)/5.2,a=Math.atan2(y,x);
    let s=x*x+y*y*squash-amp*.12*(Math.sin(a*3+ph)*.6+Math.sin(a*5+ph2)*.4)+rng()*.14;
    if(k===1)s+=.9*Math.exp(-(x-bx*.5)*(x-bx*.5)/.025)*Math.min(1,y*y*6);
    else if(k===2)s+=1.4*Math.exp(-((x-bx)*(x-bx)+(y-bs*.85)*(y-bs*.85))/.09);
    else if(k===3)s+=2*Math.exp(-((x-hxp)*(x-hxp)+(y-hyp)*(y-hyp))/.012);
    // the road's ends and a spine between them are always land, so the island never splits
    if((c<=1&&SPAWN_ROWS.includes(r))||(c>=COLS-2&&KEEP_ROWS.includes(r))||r===SPAWN_ROWS[0])s=-9;
    sc.push([s,r*COLS+c])}
  sc.sort((a,b)=>a[0]-b[0]);for(let i=0;i<N&&i<sc.length;i++)L[sc[i][1]]=1;
  const seen=new Uint8Array(COLS*ROWS),q=[KEEP_ROWS[0]*COLS+COLS-1];seen[q[0]]=1;
  for(let h=0;h<q.length;h++){const i=q[h];for(const [nc,nr] of nbrs(i%COLS,(i/COLS)|0)){const j=nr*COLS+nc;if(L[j]&&!seen[j]){seen[j]=1;q.push(j)}}}
  for(let i=0;i<L.length;i++){if(!seen[i])L[i]=0;if(!L[i])F.blk[i]=3}}
// the topmost (or bottom-most) land hex in a column: where an edge gate opens on the rim
function rimRow(F,c,top){for(let k=0;k<ROWS;k++){const r=top?k:ROWS-1-k;if(F.land[r*COLS+c])return r}return -1}
const isLand=(c,r)=>c>=0&&r>=0&&c<COLS&&r<ROWS&&(!R.field.land||R.field.land[r*COLS+c]===1);
// Expand: raise a chunk of three hexes out of the sky next to the island, between fights
const expandCost=()=>3+(R.field.grown||0)*2;
function isleEdge(c,r){const F=R.field;return !!F.land&&c>=0&&r>=0&&c<COLS&&r<ROWS&&!F.land[r*COLS+c]&&nbrs(c,r).some(([a,b])=>F.land[b*COLS+a])}
function expandChunk(c,r){const F=R.field,add=[[c,r]],d=(p)=>Math.hypot(hx(p[0],p[1])-hx(c,r),hy(p[1])-hy(r));
  for(let k=0;k<2;k++){const cand=[];for(const [a,b] of add)for(const p of nbrs(a,b))if(!F.land[p[1]*COLS+p[0]]&&!add.some(o=>o[0]===p[0]&&o[1]===p[1])&&!cand.some(o=>o[0]===p[0]&&o[1]===p[1]))cand.push(p);if(!cand.length)break;const fd=(p)=>(F.sky||[]).some(s=>!s.got&&s.c===p[0]&&s.r===p[1])?-99:0;cand.sort((p,q)=>fd(p)-fd(q)||d(p)-d(q));add.push(cand[0])}return add}
function expandAt(c,r){const F=R.field;if(R.phase!=='plan'||!isleEdge(c,r)||R.gold<expandCost())return false;R.gold-=expandCost();
  const add=expandChunk(c,r),t0=typeof TIME!=='undefined'?TIME:0;if(DOM)F.rise=F.rise||[];for(const [a,b] of add){const i=b*COLS+a;F.land[i]=1;F.blk[i]=0;if(F.rise)F.rise.push({c:a,r:b,t0:t0+F.rise.length*.07})}
  for(const s of (F.sky||[]))if(!s.got&&add.some(p=>p[0]===s.c&&p[1]===s.r))skyClaim(s);
  F.grown=(F.grown||0)+1;R.isle=(R.isle||0)+add.length;R.stats.isle=(R.stats.isle||0)+add.length;rebuildBlk();if(typeof bgDirty!=='undefined')bgDirty=1;
  if(typeof sfx==='function')sfx('level',.5);if(typeof fx==='function')for(const [a,b] of add)fx({k:'ring',x:hx(a,b),y:hy(b),r:T*.7,col:'#e8d6a8',dur:.5});if(R.isle>=30)award('isle');return true}
// heroes kept from the last act may wall off a new gate: lift the ones nearest the gates until every road is open,
// then put them back wherever the roads stay open (or on the bench, or sell them if the bench is full)
function fixRoads(){const F=R.field;if(F.dist)return;const G=(F.gates||[]).filter(g=>g.k!=='west'),lift=[];
  const gd=h=>Math.min(99,...G.map(g=>Math.hypot(hx(g.c,g.r)-hx(h.c,h.r),hy(g.r)-hy(h.r))),Math.hypot(hx(h.c,h.r),hy(h.r)-hy(SPAWN_ROWS[0])));
  while(!F.dist&&R.board.length){const h=R.board.slice().sort((a,b)=>gd(a)-gd(b))[0];R.board.splice(R.board.indexOf(h),1);lift.push(h);rebuildBlk()}
  // still no road (rocks or water sealing a gate on the island's rim): clear the rock nearest a gate, then give up on that gate
  for(let k=0;k<40&&!F.dist;k++){let best=-1,bd=1e9;for(let i=0;i<COLS*ROWS;i++){if(F.blk[i]!==2)continue;const c=i%COLS,r=(i/COLS)|0,d=gd({c,r});if(d<bd){bd=d;best=i}}
    if(best<0)break;F.blk[best]=0;if(F.ter&&F.ter[best]===4)F.ter[best]=0;F.obs=F.obs.filter(o=>o.c+o.r*COLS!==best);rebuildBlk()}
  while(!F.dist&&F.gates.length>1){F.gates.pop();rebuildBlk()}
  for(const h of lift){const c0=h.c,r0=h.r;let best=null,bd=1e9;for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){if(!canPlace(c,r))continue;const d=Math.hypot(hx(c,r)-hx(c0,r0),hy(r)-hy(r0));if(d<bd){bd=d;best=[c,r]}}
    if(best){h.c=best[0];h.r=best[1];R.board.push(h);rebuildBlk();continue}
    h.c=h.r=-1;const j=R.bench.indexOf(null);if(j>=0)R.bench[j]=h;else{R.gold+=sellValue(h);R.pool[h.k]+=COPIES[h.star];for(const it of h.it||[])stashItem(it)}}}
const isGate=(c,r)=>!!(R.field.gates&&R.field.gates.some(g=>g.k!=='west'&&g.c===c&&g.r===r));
function rebuildBlk(){const F=R.field;for(let i=0;i<F.blk.length;i++)if(F.blk[i]===1)F.blk[i]=0;for(const h of R.board)F.blk[h.r*COLS+h.c]=1;F.dist=flow(F.blk);F.route=traceRoute();F.routes=(F.gates||[]).map(g=>traceRoute(g));}
// breadth-first flow field from the keep; returns null if any gate can't reach it
function flow(blk){
  const d=new Int16Array(COLS*ROWS).fill(-1),q=[];
  for(const r of KEEP_ROWS){const i=r*COLS+COLS-1;if(!blk[i]){d[i]=0;q.push(i)}}
  for(let h=0;h<q.length;h++){const i=q[h],c=i%COLS,r=(i/COLS)|0;for(const [nc,nr] of nbrs(c,r)){const j=nr*COLS+nc;if(blk[j]||d[j]>=0)continue;d[j]=d[i]+1;q.push(j)}}
  if(!SPAWN_ROWS.some(r=>d[r*COLS]>=0))return null;
  const G=R&&R.field&&R.field.gates;if(G)for(const g of G)if(g.k!=='west'&&!(d[g.r*COLS+g.c]>=0))return null;
  return d}
function canPlace(c,r){const F=R.field,i=r*COLS+c;if(c<0||r<0||c>=COLS||r>=ROWS||F.blk[i])return false;if(F.runes.some(q=>q.c===c&&q.r===r)||F.portals.some(q=>q.c===c&&q.r===r)||isGate(c,r))return false;
  const b=F.blk.slice();b[i]=1;return !!flow(b)}
function nextCell(c,r){const d=R.field.dist,cur=d[r*COLS+c];let best=null,bd=cur<0?1e9:cur;
  for(const [nc,nr] of nbrs(c,r)){const v=d[nr*COLS+nc];if(v>=0&&v<bd){bd=v;best=[nc,nr]}}
  return best}
// the road monsters take from a gate (the west gate by default) to the keep
function traceRoute(g){const d=R.field.dist;if(!d)return[];let c,r;
  if(!g||g.k==='west'){r=SPAWN_ROWS.filter(rr=>d[rr*COLS]>=0).sort((a,b)=>d[a*COLS]-d[b*COLS])[0];if(r==null)return[];c=0}else{c=g.c;r=g.r;if(!(d[r*COLS+c]>=0))return[]}
  const out=[[c,r]];
  for(let i=0;i<COLS*ROWS;i++){const n=nextCell(c,r);if(!n)break;[c,r]=n;out.push([c,r])}const L=out.length;if(!g&&R.stats&&L>R.stats.maxMaze){R.stats.maxMaze=L;if(L>=40)award('maze40');if(L>=70)award('h_maze')}return out}
// which gates a wave uses: early floors come only from the west, later ones split between several gates
function gatePlan(w){const F=R.field,G=F&&F.gates||[{k:'west',id:0}];if(G.length<2)return[0];const rf=!!R.rift,wi=((w-1)%10)+1,boss=bossWave(w)||!rf&&wi===10;
  let n=boss?Math.min(G.length,R.act+2):Math.min(G.length-(wi<5&&!rf&&G.some(g=>g.k==='breach')?1:0),(R.act===0?(wi>=(stage()<1?5:3)?2:1):R.act===1?(wi>=3?2:1)+(wi>=7?1:0):(wi>=3?2:1)+(wi>=6?1:0)+(wi>=8?1:0))+(R.endless?1:0));
  // a breach in the middle of the field only opens once the act has warmed up
  const others=G.slice(1).filter(g=>g.k!=='breach'||wi>=5||rf).map(g=>g.id);const out=[0];while(out.length<n&&others.length)out.push(others.splice((rng()*others.length)|0,1)[0]);
  // sometimes the west gate stays shut and every monster comes from the others
  if(out.length>2&&rng()<.3)out.shift();if((has('sealstone')?1:0)+(R.seal>0?1:0)){for(let k=(has('sealstone')?1:0)+(R.seal>0?1:0);k>0&&out.length>1;k--)out.pop()}
  const an=G.find(g=>g.k==='anchor');if(an&&!out.includes(an.id))out.push(an.id);return out}
// hand out the wave's monsters to its gates in runs of a few, so each gate sends a little pack
function tagGates(q,w){const P=gatePlan(w);let gi=0,run=0;for(const e of q){if(MON[e.k]&&MON[e.k].boss){e.g=P.includes(0)?0:P[0];continue}if(run<=0){gi=P[(rng()*P.length)|0];run=2+((rng()*4)|0)}e.g=gi;run--}return anchorQ(q)}
const runeAt=(c,r)=>R.field.runes.find(q=>q.c===c&&q.r===r);
const portalAt=(c,r)=>R.field.portals.find(q=>q.c===c&&q.r===r);
const runeMul=q=>q.v+mods().rune+(has('runesmith')?1:0)+(has('heart')?2:0)+(has('dome')?2:0)+(R.ink?1:0)+(hasGuard('oracle')?1:0)+(R.b&&R.b.surgeT>0?1:0);
const portalMul=q=>q.v+(has('riftlord')?1:0);
// ---------- heroes: bench, field, merging ----------
const boardMax=()=>Math.min(mods().cap||99,boardMax0());
const boardMax0=()=>R.lvl+(has('recruit')?1:0)+(has('kingmaker')?2:0)+['crown','ecto','sozu','coffee','fusion'].filter(has).length;
function heroAt(c,r){return R.board.find(h=>h.c===c&&h.r===r)}
function mkHero(k,star){return{uid:UID++,k,star,mana:0,cd:Math.random()*.5,atk:0,face:1,hits:0,buffT:0,c:-1,r:-1,it:[]}}
function addHero(k,star,free,ed){
  const slot=R.bench.indexOf(null);
  // a third copy merges even with a full bench
  const same=allHeroes().filter(h=>h.k===k&&h.star===star);
  if(slot<0&&same.length<2)return false;
  const h=mkHero(k,star||1);if(ed)h.ed=ed;if(slot>=0)R.bench[slot]=h;else{h.tmp=1}
  if(!free)R.pool[k]=Math.max(0,R.pool[k]-1);
  merge(h);return true}
function allHeroes(){return R.board.concat(R.bench.filter(Boolean))}
function merge(h){
  const same=allHeroes().filter(x=>x.k===h.k&&x.star===h.star);if(h.tmp&&!same.includes(h))same.push(h);
  const need=3;if(same.length<need||h.star>=4){if(h.tmp)delete h.tmp;return}
  const keep=same.find(x=>R.board.includes(x))||same.find(x=>!x.tmp)||same[0];
  for(const x of same.slice(0,need)){if(x===keep)continue;removeHero(x);keep.vet=Math.max(keep.vet||0,x.vet||0);if(!keep.ed&&x.ed)keep.ed=x.ed;for(const it of x.it||[])giveItem(keep,it)}
  delete keep.tmp;keep.star++;keep.mana=0;fxStar(keep);if(keep.star===3){award('star3');if(keep.k==='wyrm')award('h_dragon');if(R.board.filter(x=>x.star===3).length>=3)award('h_three')}if(keep.star===4){award('star4');banner(HEROES[keep.k].n.toUpperCase()+' ASCENDS','#ff9ad8')}
  merge(keep)}
function removeHero(h){const i=R.board.indexOf(h);if(i>=0){R.board.splice(i,1);rebuildBlk()}const j=R.bench.indexOf(h);if(j>=0)R.bench[j]=null}
function toBench(h){const j=R.bench.indexOf(null);if(j<0)return false;const i=R.board.indexOf(h);if(i>=0)R.board.splice(i,1);R.bench[j]=h;h.c=h.r=-1;rebuildBlk();return true}
function placeHero(h,c,r){if(!canPlace(c,r))return false;const onBoard=R.board.includes(h);if(!onBoard&&h.ed!=='hollow'&&fieldN()>=boardMax())return false;
  if(onBoard){R.board.splice(R.board.indexOf(h),1);rebuildBlk();if(!canPlace(c,r)){R.board.push(h);rebuildBlk();return false}}
  const j=R.bench.indexOf(h);if(j>=0)R.bench[j]=null;h.c=c;h.r=r;R.board.push(h);rebuildBlk();if(R.field.ter&&R.board.filter(x=>R.field.ter[x.r*COLS+x.c]===1).length>=3)award('hill3');if(HEROES[h.k].c===5&&!onBoard&&typeof fx==='function'){fx({k:'pillar',x:hx(c,r),y:hy(r),dur:.9});sfx('sp_holy',.5,.8)}META.seen[h.k]=1;if(HKEYS.every(k=>META.seen[k]))award('all18');return true}
const sellValue=h=>HEROES[h.k].c*COPIES[h.star]-(h.star>1&&HEROES[h.k].c>1?1:0);
function sellHero(h){R.gold+=sellValue(h);R.pool[h.k]+=COPIES[h.star];removeHero(h);for(const it of h.it||[])stashItem(it);h.it=[];sfx('coin',.5)}
// ---------- traits and hero stats ----------
let SYN={};
function calcTraits(){const seen={},cnt={};for(const h of R.board){if(seen[h.k])continue;seen[h.k]=1;for(const t of HEROES[h.k].tr)cnt[t]=(cnt[t]||0)+1}
  for(const r of R.relics){const em=RELIC[r].em;if(em)cnt[em]=(cnt[em]||0)+1}
  for(const g of R.guards||[])for(const t of GUARDS[g.k].tr)cnt[t]=(cnt[t]||0)+1;
  if(R.warden==='beastlord'&&cnt.beast)cnt.beast++;
  
  // frontline auras: a melee hero buffs the heroes on the hexes touching it
  for(const h of R.board)h.au={as:0,dmg:0,dr:0,hp:0,heal:0};
  for(const h of R.board){const F=HEROES[h.k].fl;if(!F)continue;const A={rally:['as',.15],howl:['as',.2],warcry:['dmg',.15],ward:['dr',.2],tend:['heal',.03],bulwark:['hp',.3],coat:['dr',.12],antler:['hp',.2],mount:['dmg',.12],shieldwall:['dr',.15],brace:['hp',.25],horn:['as',.15]}[F.k];if(!A)continue;
    for(const [c,r] of nbrs(h.c,h.r)){const o=heroAt(c,r);if(o&&o!==h){o.au[A[0]]+=A[1];if(F.k==='ward')o.au.heal+=.02;if(F.k==='horn'&&HEROES[o.k].tr.includes('beast'))o.au.dmg+=.15}}}
  // Beasts count the Beasts on touching hexes
  for(const h of R.board)if(HEROES[h.k].tr.includes('beast'))h.pack=nbrs(h.c,h.r).filter(([c,r])=>{const o=heroAt(c,r);return o&&o!==h&&HEROES[o.k].tr.includes('beast')}).length;
  SYN={};for(const t of TRAIT_ORDER){const n=cnt[t]||0,bp=TRAITS[t].bp;let tier=-1;bp.forEach((b,i)=>{if(n>=b)tier=i});SYN[t]={n,tier};if(tier===bp.length-1&&bp.length>1)award('trait6')}
  return SYN}
const tier=t=>SYN[t]?SYN[t].tier:-1;
function heroStats(h){const D=HEROES[h.k],m=STARM[h.star],tr=D.tr,s={dmg:D.dmg*m,as:D.as,rng:D.rng,crit:0,cm:2,spell:1};
  if(tr.includes('kingdom')&&tier('kingdom')>=0)s.as*=1+[.2,.45,.8,1.5][tier('kingdom')];if(tier('kingdom')>=3)s.as*=1.25;
  if(tr.includes('marksman')&&tier('marksman')>=0){s.rng+=tier('marksman')+1;s.as*=1+[.15,.35,.8][tier('marksman')]}
  if(tr.includes('assassin')&&tier('assassin')>=0){s.crit=[.2,.4,.65][tier('assassin')];s.cm=[2,2.5,3.5][tier('assassin')]}
  if(tr.includes('sorcerer')&&tier('sorcerer')>=0)s.spell=1+[.3,.7,1.4,2.6,5][tier('sorcerer')];
  if(tr.includes('wildwood')&&tier('wildwood')>=2)s.dmg*=tier('wildwood')>=3?2.2:1.4;
  if(tr.includes('beast')&&tier('beast')>=0){const t=tier('beast');s.dmg*=1+[.1,.2,.35,.7][t]+[.15,.3,.45,.8][t]*(h.pack||0)}
  if(tr.includes('beast')&&R.warden==='beastlord')s.dmg*=1.15;
  if(tr.includes('beast')&&R.b&&R.b.moon)s.as*=1+.04*R.b.moon;
  if(h.k==='orcraider'&&R.b&&h.c>=0){const p=heroPos(h);let n=0;for(const m of R.b.mons)if(m.hp>0&&!m.fly&&Math.hypot(m.x-p.x,m.y-p.y)<T*1.5)n++;s.as*=1+Math.min(.48,.06*n)}
  if(h.c>=0&&R.field&&R.field.ter&&R.field.ter[h.r*COLS+h.c]===1){if(isFront(h.k))s.dmg*=has('surveyor')?1.4:1.2;else s.rng+=has('surveyor')?2:1}
  if(has('warhorn')&&R.b&&R.b.t<6)s.as*=1.4;
  if(has('crit'))s.crit=1-(1-s.crit)*.85;if(has('haste'))s.as*=1.15;if(has('eagle'))s.rng+=1;
  if(has('collector'))s.dmg*=Math.pow(1.06,R.relics.length);
  if(has('tally'))s.dmg*=1+Math.min(.6,((R.stats.kills/25)|0)*.01);if(has('idol'))s.dmg*=1+Math.min(.4,((R.gold/4)|0)*.01);if(has('ouro'))s.as*=1+Math.min(.4,(R.cnt.rr||0)*.005);if(has('ledger'))s.dmg*=1+Math.min(1,(R.cnt.big||0)*.04);if(has('sands')&&R.b)s.dmg*=1+Math.min(.8,R.b.t*.02);if(has('flawless'))s.dmg*=1+Math.min(.6,(R.cnt.fl||0)*.03);
  if(h.c>=0&&isLey(h.c,h.r)){s.dmg*=1.4;s.spell*=1.25}
  // ★4: ascended heroes attack faster, cast harder and reach further
  if(h.star>=4){s.as*=1.5;s.spell*=1.6;if(!isFront(h.k))s.rng+=1}
  if(h.buffT>0)s.as*=h.buffAs||2;
  if(h.vet)s.dmg*=1+.25*h.vet;if(h.au){s.as*=1+h.au.as;s.dmg*=1+h.au.dmg}if(h.hoard)s.dmg*=1+.005*h.hoard;if(has('philo'))s.dmg*=1.3;if(R.b&&R.b.rageT>0)s.as*=1.6;if(R.b&&R.b.rallyT>0)s.as*=1.4;
  // items
  const I=itemStats(h);s.dmg*=1+I.dmg;s.as*=1+I.as;s.spell*=1+I.sp;s.crit=1-(1-s.crit)*(1-I.crit);s.rng+=I.rng||0;
  if(hasIt(h,'edge'))s.cm+=.5;if(hasIt(h,'titan'))s.dmg*=1+Math.min(.8,.04*(h.stk||0));if(hasIt(h,'rage'))s.as*=1+Math.min(2,.04*(h.stk||0));
  if(h.chillT>0)s.as*=.7;
  // the Constellation, pacts and challenge rules
  if(h.ed==='savage')s.dmg*=1.25;if(h.ed==='fleet')s.as*=1.25;
  const M=mods();s.dmg*=M.dmg;s.as*=M.as;s.spell*=M.spell;if(M.crit)s.crit=1-(1-s.crit)*(1-M.crit);if(M.rng&&!isFront(h.k))s.rng+=M.rng;
  return s}
// hero health: bigger heroes, stars and Guardians are tougher; it refills every wave
function heroMaxHp(h){const D=HEROES[h.k];return Math.round((380+120*D.c)*STARH[h.star]*(D.tr.includes('guardian')?1.5:1)*(D.tr.includes('bruiser')&&tier('bruiser')>=0?[1.25,1.5,1.8,2.6][tier('bruiser')]:1)*(isFront(h.k)?1.35:1)*(1+itemStats(h).hp)*(1+.25*(h.vet||0))*(1+(h.au?h.au.hp:0))*mods().hp)}
