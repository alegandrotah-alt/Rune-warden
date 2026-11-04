// ---------- run flow: waves, rewards, relic picks, acts, the end ----------
const STONE_AT={5:1,15:1,25:1};
function endWave(){
  const B=R.b,won=B.leaked===0,w=R.wave,node=R.node||'battle',boss=w%10===0&&w<=30;
  if(R.final){R.b=null;award('devourer');R.trueWin=1;META.trueWins=(META.trueWins||0)+1;saveMeta();runOver(true);return}
  R.lastDmg={wave:w,rows:R.board.map(h=>({k:h.k,star:h.star,d:h.wd||0,uid:h.uid})).sort((a,b)=>b.d-a.d)};
  R.streak=won?(R.streak>=0?R.streak+1:1):(R.streak<=0?R.streak-1:-1);
  const inc=income(won);gainXP(2+(has('scholar')?3:0)+rank('xp'));
  for(const h of R.board){h.ko=0;h.chillT=0;h.tauntT=0}R.ink=0;R.hoard=0;R.calm=R.calm||0;
  if(R.egg>0){R.egg--;if(R.egg===0){R.gold+=35;banner('THE GOLDEN EGG HATCHES  +35g','#ffcf2e');R.egg=-1}}
  if(STONE_AT[w])R.stones.push(2);
  if(w>=5)award('w5');if(w>5&&R.board.length===1)award('h_lone');if(R.gold>=60)award('gold60');
  R.b=null;R.freeRoll=rank('reroll');if(SET.dmgOpen===undefined){SET.dmgOpen=true;saveSet()}
  floatText(FW/2,FH*.42,won?`FLOOR ${w} CLEARED`:`FLOOR ${w} SURVIVED`,won?'#9dff8a':'#ffb060',1.6);
  floatText(FW/2,FH*.42+T*.7,`+${inc.base+inc.int+inc.st+inc.ex} gold`+(inc.int?`  (${inc.int} interest)`:'')+(inc.st?`  (${inc.st} streak)`:''),'#ffcf2e',1.1);
  sfx(won?'taken':'block',.6);
  // act boss down
  if(boss){const a=w/10;if(R.leakAct===0)award('perfect');R.leakAct=0;R.calm=0;
    if(a===1){award('act1');if(R.rerolls===0)award('h_miser')}if(a===2)award('act2');
    if(a===3){award('win');META.wins=(META.wins||0)+1;R.won=1;saveMeta();banner(MON[actD(2).boss].n.toUpperCase()+' FALLS','#ffd76a')}
    else{R.act=a;const fix=Math.ceil((R.hpMax-R.hp)*.5);R.hp+=fix;if(fix>0)floatText(FW+T*.2,FH/2-T*1.2,'+'+fix,'#7dff9a',1.3);genField();if(guardLv('oracle')>=3)R.stones.push(2);banner(`ACT ${["I","II","III"][a]}: ${actD(a).n.toUpperCase()}`,'#ffd76a');bgDirty=1}}
  R.wave++;if(R.endless&&R.wave>=40)award('endless40');
  rollShop(true);R.node=null;if(boss)genMap();if(R.won&&!R.endless)R.map=null;R.nextQ=waveList(R.wave);autoNode();
  R.queue=[];
  if(R.endless){if((w%5)===0)R.queue.push('endless')}
  else{R.spoils=makeSpoils(node,won,inc.base+inc.int+inc.st+inc.ex);R.queue.push('spoils');if(node==='elite')R.queue.push('relic');if(boss)R.queue.push('boss');if(boss&&w===30)R.queue.push('gate')}
  advance();uiRefresh();
}
function offerRelics(t,src){
  const pool=relicPool(t).concat(t===2?relicPool(1).filter(()=>rng()<.25):[]);
  const n=(t===4?3:3+rank('choice'))-(asc(10)?1:0),out=[];while(out.length<n&&pool.length){out.push(pool.splice((rng()*pool.length)|0,1)[0].id)}
  if(!out.length){advance();return}R.picks=out;R.pickSrc=src||'';R.phase='pick';saveRun();showPick()}
function takeRelic(id){
  R.picks=[];sfx('level',.6);gainRelic(id);
  calcTraits();uiRefresh();advance()}
function applyRelic(id){
  if(id==='armory'){dropItem(rndS(COMPS));dropItem(rndS(COMPS))}if(id==='smith'){dropItem(randomFinished());dropItem(randomFinished())}
  if(id==='stones')R.stones.push(2,2);if(id==='heart')R.stones.push(3);if(id==='treasury')R.gold+=45;if(id==='egg')R.egg=6;
  if(id==='masons'){R.hpMax+=20;R.hp=R.hpMax}
  if(id==='ascend'){for(const s of [2,1]){const c=R.board.filter(h=>h.star===s).sort((a,b)=>HEROES[b.k].c-HEROES[a.k].c)[0];if(c){c.star++;fxStar(c)}}}
  if(id==='belt')gainPotion();
  if(id==='whetstone')for(const h of R.board.filter(h=>(h.vet||0)<2).sort((a,b)=>HEROES[b.k].c*b.star-HEROES[a.k].c*a.star).slice(0,2))train(h);
  if(id==='astrolabe'){const o=allHeroes().filter(h=>h.star===1);for(let i=0;i<3&&o.length;i++){const h=o.splice((rng()*o.length)|0,1)[0];h.star=2;fxStar(h)}}
  if(id==='pandora')for(const h of allHeroes().filter(h=>h.star===1&&HEROES[h.k].c<5))transmute(h);
  if(id==='calling'){for(let i=0;i<3;i++){const r=randomRelic(1);if(r){R.relics.push(r);applyRelic(r)}}R.hpMax-=15;R.hp=Math.min(R.hp,R.hpMax)}
  if(id==='tinyhouse'){dropItem(rndS(COMPS));gainPotion();R.gold+=15;R.hpMax+=10;R.hp+=10;gainXP(5)}}
function placeStone(i,c,r){const F=R.field;if(c<0||r<0||c>=COLS||r>=ROWS||F.blk[r*COLS+c]||runeAt(c,r)||portalAt(c,r))return false;if(F.runes.length>=24)return false;
  F.runes.push({c,r,v:R.stones[i],ph:0,flash:.6,mine:1});R.stones.splice(i,1);sfx('level',.5);return true}
function award(id){if(!META.ach||META.ach[id])return;META.ach[id]=1;const a=ACHN[id];if(!a)return;META.gems+=a.g;saveMeta();toast(`${a.hidden?'Secret achievement':'Achievement'}: ${a.n}  +${a.g} gems`)}
function runOver(win){
  if(R.phase==='over')return;if(R.won)win=true;R.phase='over';const waves=R.wave-1,gems=Math.round((waves*1.5+Math.floor(Math.min(30,waves)/10)*10+(win?40:0)+(R.trueWin?150:0))*(1+.15*(R.asc||0))*(1+.1*rank('gems')));
  META.gems+=gems;META.runs++;META.best=Math.max(META.best,waves);if(R.endless)META.bestEndless=Math.max(META.bestEndless||0,waves);
  if(win&&!R.endless&&!R.daily){const a=R.asc||0;if(a>=1)award('asc1');if(a>=5)award('asc5');if(a>=10)award('asc10');META.asc=Math.max(META.asc||0,Math.min(10,a+1));R.ascUp=META.asc>a}
  if(R.daily){award('daily');const D=META.daily&&META.daily.d===R.daily?META.daily:{d:R.daily,best:0,tries:0};D.tries++;R.dailyNew=waves>D.best;D.best=Math.max(D.best,waves);META.daily=D}
  // a short history of runs, newest first, for the Records tab
  const top=(R.lastDmg?R.lastDmg.rows:[]).slice(0,3).map(r=>r.k+r.star);
  META.hist=[{t:Date.now(),f:waves,win:!!win,tw:!!R.trueWin,asc:R.asc||0,day:!!R.daily,by:win?'':R.lastLeak||'',top,rel:R.relics.length,kills:R.stats.kills,lvl:R.lvl}].concat(META.hist||[]).slice(0,30);
  saveMeta();clearRun();
  R.endGems=gems;R.win=win;showEnd(win)}
function goEndless(){R.endless=true;R.final=0;R.won=0;R.phase='plan';R.act=2;R.map=null;R.node='battle';R.room=null;R.queue=null;genField();rollShop(true);R.nextQ=waveList(R.wave);hideEnd();saveRun();uiRefresh()}
// ---------- saving a run in progress (between waves) ----------
// only a run the player actually started is saved: the placeholder run behind the menu must never overwrite it
function saveRun(){if(!R||!R.live||R.phase==='over')return;try{const o=Object.assign({},R,{b:null,field:{obs:R.field.obs,runes:R.field.runes,portals:R.field.portals,gates:R.field.gates,ter:Array.from(R.field.ter||[]),blk:Array.from(R.field.blk).map(v=>v===2?2:0)}});localStorage.setItem('runewarden-run',JSON.stringify(o))}catch(e){}}
function loadRun(){try{const o=JSON.parse(localStorage.getItem('runewarden-run')||'null');if(!o||!o.field)return false;R=o;
  // runs saved on the smaller board get a fresh field; heroes keep their hexes where they still fit
  if(o.field.blk.length!==COLS*ROWS){R.field={runes:[]};R.board=R.board.filter(h=>{if(h.c<COLS&&h.r<ROWS)return true;const j=R.bench.indexOf(null);if(j>=0){h.c=h.r=-1;R.bench[j]=h}return false});R.board.forEach(h=>{});const keep=R.board.slice();R.board=[];genField();for(const h of keep){if(!placeHero(h,h.c,h.r)){const j=R.bench.indexOf(null);if(j>=0){h.c=h.r=-1;R.bench[j]=h}}}o.field=R.field;o.field.blk=Array.from(R.field.blk);o.field.ter=Array.from(R.field.ter)}
  R.field.blk=Uint8Array.from(o.field.blk);R.field.ter=o.field.ter&&o.field.ter.length?Uint8Array.from(o.field.ter):new Uint8Array(COLS*ROWS);R.field.gates=o.field.gates||[{k:'west',c:0,r:4,id:0}];R.b=null;if(R.phase==='wave')R.phase='plan';
  UID=1+Math.max(0,...allHeroes().map(h=>h.uid||0));R.items=R.items||[];for(const h of allHeroes()){h.it=h.it||[];h.ko=0}for(const k of HKEYS)if(R.pool[k]==null)R.pool[k]=unlocked(k)?POOL[HEROES[k].c]:0;
  R.asc=R.asc||0;R.stats.elites=R.stats.elites||0;R.potions=R.potions||[];
  // runs saved before the branching map get a fresh map for the current act
  if(!R.map||!R.map.nodes){if(R.wave<=30&&!R.endless){const w=R.wave;genMap();R.wave=w}else{R.map=null;R.node='battle'}}
  if(R.phase==='reward'&&!R.spoils){R.phase='plan';R.queue=null}if(R.phase==='pick'&&!(R.picks&&R.picks.length))R.phase='plan';if(R.phase==='room'&&!R.room)R.phase='plan';
  rebuildBlk();calcTraits();if(!R.nextQ)R.nextQ=waveList(R.wave);return true}catch(e){return false}}
function clearRun(){try{localStorage.removeItem('runewarden-run')}catch(e){}}
const hasSavedRun=()=>{try{return !!localStorage.getItem('runewarden-run')}catch(e){return false}};
