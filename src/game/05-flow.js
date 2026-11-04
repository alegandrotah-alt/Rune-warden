// ---------- run flow: waves, rewards, relic picks, acts, the end ----------
const PICK_AT={2:1,6:1,10:3,13:2,17:2,20:3,23:2,27:2};
const STONE_AT={5:1,15:1,25:1};
function endWave(){
  const B=R.b,won=B.leaked===0,w=R.wave;
  R.streak=won?(R.streak>=0?R.streak+1:1):(R.streak<=0?R.streak-1:-1);
  const inc=income(won);gainXP(2+(has('scholar')?3:0)+rank('xp'));
  if(R.egg>0){R.egg--;if(R.egg===0){R.gold+=35;banner('THE GOLDEN EGG HATCHES  +35g','#ffcf2e');R.egg=-1}}
  if(STONE_AT[w])R.stones.push(2);
  if(w>=5)award('w5');if(w>5&&R.board.length===1)award('h_lone');if(R.gold>=60)award('gold60');
  R.b=null;R.freeRoll=rank('reroll');
  floatText(FW/2,FH*.42,won?`WAVE ${w} CLEARED`:`WAVE ${w} SURVIVED`,won?'#9dff8a':'#ffb060',1.6);
  floatText(FW/2,FH*.42+T*.7,`+${inc.base+inc.int+inc.st+inc.ex} gold`+(inc.int?`  (${inc.int} interest)`:'')+(inc.st?`  (${inc.st} streak)`:''),'#ffcf2e',1.1);
  sfx(won?'taken':'block',.6);
  // act boss down
  if(w%10===0&&w<=30){const a=w/10;if(R.leakAct===0)award('perfect');R.leakAct=0;
    if(a===1){award('act1');if(R.rerolls===0)award('h_miser')}if(a===2)award('act2');
    if(a===3){award('win');META.wins=(META.wins||0)+1;R.wave++;saveMeta();runOver(true);return}
    R.act=a;genField();banner(`ACT ${['I','II','III'][a]}: ${ACTS[a].n.toUpperCase()}`,'#ffd76a');bgDirty=1}
  R.wave++;if(R.endless&&R.wave>=40)award('endless40');
  rollShop(true);
  const t=PICK_AT[w];if(t&&!R.endless)offerRelics(t);else{R.phase='plan';saveRun()}
  uiRefresh();
}
function offerRelics(t){
  const own=new Set(R.relics),pool=RELICS.filter(r=>(r.t===t||t===2&&r.t===1&&Math.random()<.25)&&!own.has(r.id));
  const n=3+rank('choice'),out=[];while(out.length<n&&pool.length){out.push(pool.splice((Math.random()*pool.length)|0,1)[0].id)}
  R.picks=out;R.phase='pick';showPick()}
function takeRelic(id){
  R.relics.push(id);R.picks=[];sfx('level',.6);
  if(id==='stones')R.stones.push(2,2);if(id==='heart')R.stones.push(3);if(id==='treasury')R.gold+=45;if(id==='egg')R.egg=6;
  if(id==='masons'){R.hpMax+=20;R.hp=R.hpMax}
  if(id==='ascend'){for(const s of [2,1]){const c=R.board.filter(h=>h.star===s).sort((a,b)=>HEROES[b.k].c-HEROES[a.k].c)[0];if(c){c.star++;fxStar(c)}}}
  calcTraits();R.phase='plan';saveRun();uiRefresh()}
function placeStone(i,c,r){const F=R.field;if(c<0||r<0||c>=COLS||r>=ROWS||F.blk[r*COLS+c]||runeAt(c,r)||portalAt(c,r))return false;if(F.runes.length>=24)return false;
  F.runes.push({c,r,v:R.stones[i],ph:0,flash:.6,mine:1});R.stones.splice(i,1);sfx('level',.5);return true}
function award(id){if(!META.ach||META.ach[id])return;META.ach[id]=1;const a=ACHN[id];if(!a)return;META.gems+=a.g;saveMeta();toast(`${a.hidden?'Secret achievement':'Achievement'}: ${a.n}  +${a.g} gems`)}
function runOver(win){
  if(R.phase==='over')return;R.phase='over';const waves=R.wave-1,gems=Math.round(waves*1.5+Math.floor(Math.min(30,waves)/10)*10+(win?40:0));
  META.gems+=gems;META.runs++;META.best=Math.max(META.best,waves);if(R.endless)META.bestEndless=Math.max(META.bestEndless||0,waves);saveMeta();clearRun();
  R.endGems=gems;R.win=win;showEnd(win)}
function goEndless(){R.endless=true;R.phase='plan';R.act=2;genField();rollShop(true);hideEnd();saveRun();uiRefresh()}
// ---------- saving a run in progress (between waves) ----------
function saveRun(){if(!R||R.phase==='over')return;try{const o=Object.assign({},R,{b:null,field:{obs:R.field.obs,runes:R.field.runes,portals:R.field.portals,blk:Array.from(R.field.blk).map(v=>v===2?2:0)}});localStorage.setItem('runewarden-run',JSON.stringify(o))}catch(e){}}
function loadRun(){try{const o=JSON.parse(localStorage.getItem('runewarden-run')||'null');if(!o||!o.field)return false;R=o;R.field.blk=Uint8Array.from(o.field.blk);R.b=null;if(R.phase==='wave')R.phase='plan';
  UID=1+Math.max(0,...allHeroes().map(h=>h.uid||0));rebuildBlk();calcTraits();return true}catch(e){return false}}
function clearRun(){try{localStorage.removeItem('runewarden-run')}catch(e){}}
const hasSavedRun=()=>{try{return !!localStorage.getItem('runewarden-run')}catch(e){return false}};
