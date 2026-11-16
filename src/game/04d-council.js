// ---------- the war council: run-wide modifiers from three sources ----------
// 1. the Constellation: a web of stars bought with points (one per level, one per boss); the outer stars are keystones with a price
// 2. pacts: curses you may accept for the coming fight, each with a reward
// 3. challenge runs: a rule set for the whole run
// All three write into one object, mods(), which the rest of the game reads. Call modsDirty() whenever a source changes.
let MODC=null;
function modsDirty(){MODC=null}
function mods(){if(MODC)return MODC;
  const M={dmg:1,as:1,spell:1,crit:0,hp:1,mana:1,mana0:0,rng:0,gold:0,intCap:0,intMul:1,rune:0,monHp:1,monSp:1,monN:1,elites:0,leak:1,reroll:0,free:0,slots:0,cap:0,big:1,noRune:1,regen:0,lifeAtk:0,lifeCast:0,twists:0,pactMul:1,noInt:0,rollFree:0,forced:0};
  if(!R)return M;
  for(const id of R.tree||[]){const n=STARN[id];if(n&&n.e)n.e(M)}
  if(R.ch&&CHALL[R.ch]&&CHALL[R.ch].m)CHALL[R.ch].m(M);
  for(const id of R.pact||[]){const p=PACT[id];if(p&&p.m)p.m(M)}
  return MODC=M}
// ---------- the Constellation ----------
const ARMS=[
  {k:'might',n:'Might',col:'#ff7a5a',s:[['+4% hero damage',M=>{M.dmg*=1.04}],['+4% hero damage',M=>{M.dmg*=1.04}]],
    N:['Giant Slayer','Heroes deal 20% more damage to elites and bosses.',M=>{M.big*=1.2}],K:['Glass Cannon','Heroes deal 45% more damage and have 40% less health.',M=>{M.dmg*=1.45;M.hp*=.6}]},
  {k:'swift',n:'Swiftness',col:'#ffd76a',s:[['+4% attack speed',M=>{M.as*=1.04}],['+4% attack speed',M=>{M.as*=1.04}]],
    N:['Long Reach','Shooters gain +1 range.',M=>{M.rng+=1}],K:['Blood Frenzy','Heroes attack 35% faster. Every attack costs them 1% of their health.',M=>{M.as*=1.35;M.lifeAtk+=.01}]},
  {k:'arcana',n:'Arcana',col:'#6ab8ff',s:[['Spells hit 6% harder',M=>{M.spell*=1.06}],['Heroes gain mana 10% faster',M=>{M.mana*=1.1}]],
    N:['Overflow','Heroes start every fight with 20 mana.',M=>{M.mana0+=20}],K:['Blood Magic','Spells hit 60% harder. Casting costs the hero 12% of its health.',M=>{M.spell*=1.6;M.lifeCast+=.12}]},
  {k:'bulwark',n:'Bulwark',col:'#7ddc6a',s:[['+6% hero health',M=>{M.hp*=1.06}],['+8 keep health',null,()=>{R.hpMax+=8;R.hp+=8}]],
    N:['Field Medic','Heroes regenerate 1.5% of their health every second.',M=>{M.regen+=.015}],K:['Juggernaut','Heroes have 70% more health and attack 15% slower.',M=>{M.hp*=1.7;M.as*=.85}]},
  {k:'fortune',n:'Fortune',col:'#ffcf2e',s:[['+1 gold after every fight',M=>{M.gold+=1}],['Interest can go 1 gold higher',M=>{M.intCap+=1}]],
    N:['Haggle','The first reroll on every floor is free.',M=>{M.free+=1}],K:['Miser\'s Vow','Interest is doubled. Rerolling the shop costs 2 more gold.',M=>{M.intMul*=2;M.reroll+=2}]},
  {k:'runes',n:'Runes',col:'#c9a8ff',s:[['+3% critical chance',M=>{M.crit=1-(1-M.crit)*.97}],['+3% critical chance',M=>{M.crit=1-(1-M.crit)*.97}]],
    N:['Deep Etching','Every rune multiplies by half more.',M=>{M.rune+=.5}],K:['Rune Zealot','Every rune multiplies by 1 more. Attacks that cross no rune deal 30% less.',M=>{M.rune+=1;M.noRune*=.7}]},
];
// stars: {id,x,y (-1..1),t:0 small,1 notable,2 keystone,n,d,col,e(M),on(),ln:[linked ids]}
const STARS=[{id:'core',x:0,y:0,t:3,n:'The Warden\'s Star',d:'Where every constellation begins.',col:'#fff3d0',ln:[]}];
ARMS.forEach((A,i)=>{const a=(i*60-90)*Math.PI/180,at=(r,o)=>({x:+(Math.cos(a+(o||0))*r).toFixed(3),y:+(Math.sin(a+(o||0))*r).toFixed(3)});
  STARS.push(Object.assign({id:A.k+'1',t:0,n:A.n,d:A.s[0][0],col:A.col,e:A.s[0][1],on:A.s[0][2],ln:['core']},at(.27)),
    Object.assign({id:A.k+'2',t:0,n:A.n,d:A.s[1][0],col:A.col,e:A.s[1][1],on:A.s[1][2],ln:[A.k+'1']},at(.47)),
    Object.assign({id:A.k+'N',t:1,n:A.N[0],d:A.N[1],col:A.col,e:A.N[2],ln:[A.k+'2']},at(.69)),
    Object.assign({id:A.k+'K',t:2,n:A.K[0],d:A.K[1],col:A.col,e:A.K[2],ln:[A.k+'N']},at(.93)),
    // a lesser star between this arm and the next, so paths can cross over
    Object.assign({id:'x'+i,t:0,n:'Lesser Star',d:'+2% hero damage and +2% attack speed',col:'#d8ccb8',e:M=>{M.dmg*=1.02;M.as*=1.02},ln:[A.k+'2',ARMS[(i+1)%6].k+'2']},at(.47,Math.PI/6)))});
const STARN={};STARS.forEach(s=>STARN[s.id]=s);
const starOwned=id=>id==='core'||!!(R.tree&&R.tree.includes(id));
const starLinks=id=>STARS.filter(s=>s.ln.includes(id)).map(s=>s.id).concat(STARN[id].ln);
const starOpen=id=>!starOwned(id)&&starLinks(id).some(starOwned);
function starTake(id){if(!STARN[id]||!(R.tp>0)||!starOpen(id))return false;R.tree.push(id);R.tp--;const s=STARN[id];if(s.on)s.on();modsDirty();if(s.t===2)award('keystone');if(R.tree.filter(q=>STARN[q].t===2).length>=2)award('keystone2');
  // health changes show at once in the planning phase
  for(const h of R.board){h.hpMax=heroMaxHp(h);h.hp=h.hpMax}sfx('level',.6,s.t===2?.7:1.1);return true}
// a night at the campfire can take every star back
function starReset(){const n=(R.tree||[]).length;if(!n)return false;if(R.tree.includes('bulwark2')){R.hpMax-=8;R.hp=Math.min(R.hp,R.hpMax)}R.tree=[];R.tp=(R.tp||0)+n;modsDirty();for(const h of R.board){h.hpMax=heroMaxHp(h);h.hp=h.hpMax}return true}
// ---------- pacts ----------
const PACTS=[
  {id:'swarm',n:'Swarm',d:'35% more monsters.',rw:{g:6},m:M=>{M.monN*=1.35}},
  {id:'iron',n:'Ironhide',d:'Monsters have 40% more health.',rw:{item:1},m:M=>{M.monHp*=1.4}},
  {id:'rush',n:'Bloodrush',d:'Monsters move 25% faster.',rw:{g:5},m:M=>{M.monSp*=1.25}},
  {id:'champ',n:'Champions',d:'Two more elite champions.',rw:{g:3,pot:1},m:M=>{M.elites+=2}},
  {id:'hush',n:'Silence',d:'Heroes gain mana 40% slower.',rw:{xp:8},m:M=>{M.mana*=.6}},
  {id:'brittle',n:'Brittle Walls',d:'Leaks hurt the keep twice as much.',rw:{g:8},m:M=>{M.leak*=2}},
  {id:'twist',n:'Twisted',d:'One more champion, and every champion carries two twists.',rw:{stone:1},m:M=>{M.twists=1;M.elites+=1}},
  {id:'weary',n:'Weary Arms',d:'Heroes deal 20% less damage.',rw:{g:7},m:M=>{M.dmg*=.8}},
  {id:'thin',n:'Thin Line',d:'Heroes have 35% less health.',rw:{item:1},m:M=>{M.hp*=.65}},
  {id:'tribute',n:'Blood Tribute',d:'The keep loses 12 health when the fight starts.',rw:{relic:1},cost:12},
];
const PACT={};PACTS.forEach(p=>PACT[p.id]=p);
const pactReward=p=>{const k=mods().pactMul,r=p.rw;return[r.g?`${Math.round(r.g*k)} gold`:'',r.xp?`${Math.round(r.xp*k)} XP`:'',r.item?'an item component':'',r.pot?'a potion':'',r.stone?'an attuned rune stone':'',r.relic?'a silver relic':''].filter(Boolean).join(' and ')};
// three pacts are offered for every fight (rolled once per floor); none before the Devourer
function pactOffer(){if(R.final||stage()<1&&!R.ch)return[];if(R.pactW!==R.wave||!R.pacts){R.pactW=R.wave;const pool=PACTS.filter(p=>!(p.cost&&R.hp<=p.cost+10)).map(p=>p.id),o=[];while(o.length<3&&pool.length)o.push(pool.splice((rng()*pool.length)|0,1)[0]);R.pacts=o;R.pact=[];
    // a pactbound challenge run signs two of them for you
    for(let i=0;i<mods().forced&&i<o.length;i++)R.pact.push(o[i]);modsDirty()}return R.pacts}
function pactToggle(id){if(R.phase!=='plan'||!pactOffer().includes(id))return false;const i=R.pact.indexOf(id);if(i>=0){if(i<mods().forced)return false;R.pact.splice(i,1)}else{if(R.pact.length>=2)return false;R.pact.push(id)}modsDirty();
  for(const h of R.board){h.hpMax=heroMaxHp(h);h.hp=h.hpMax}return true}
// when the fight starts: more monsters, more champions, tribute paid
function pactStart(q){const M=mods();if(M.monN>1){const body=q.filter(e=>!MON[e.k].boss&&!e.elite),n=Math.round(body.length*(M.monN-1));for(let i=0;i<n&&body.length;i++){const e=body[(rng()*body.length)|0];q.splice(1+((rng()*(q.length-1))|0),0,{k:e.k,g:e.g})}}
  for(let i=0;i<M.elites;i++){const c=q.filter(e=>!MON[e.k].boss&&!e.elite);if(c.length)c[(rng()*c.length)|0].elite=1}
  for(const id of R.pact||[])if(PACT[id].cost){R.hp=Math.max(1,R.hp-PACT[id].cost);floatText(FW+T*.2,FH/2-T,'-'+PACT[id].cost,'#ff6a5a',1.2)}
  if((R.pact||[]).length){R.stats.pacts=(R.stats.pacts||0)+R.pact.length;banner((R.pact.length>1?'PACTS: ':'PACT: ')+R.pact.map(id=>PACT[id].n.toUpperCase()).join(' + '),'#ff8a6a')}}
// when the fight ends with the keep standing: the rewards
function pactPay(won){const P=R.pact||[];if(!P.length)return;const k=mods().pactMul;let i=0;
  for(const id of P){const r=PACT[id].rw;if(r.g)R.gold+=Math.round(r.g*k);if(r.xp)gainXP(Math.round(r.xp*k));if(r.item)dropItem(rndS(COMPS));if(r.pot)gainPotion();if(r.stone)R.stones.push(kindStone(2));if(r.relic){const x=randomRelic(1);if(x)gainRelic(x)}
    floatText(FW/2,FH*.42+T*(1.4+.6*i++),`${PACT[id].n} kept: ${pactReward(PACT[id])}`,'#ff9a7a',1)}
  award('pact1');if(P.length>=2&&won)award('pact2');if((R.stats.pacts||0)>=15)award('pact15');R.pact=[];R.pacts=null;modsDirty()}
// ---------- challenge runs ----------
const CHALLS=[
  {id:'glass',n:'Glass Keep',d:'The keep has 30 health. You start with a gold relic.',start:()=>{R.hpMax=30;R.hp=30;const x=randomRelic(2);if(x)gainRelic(x)}},
  {id:'zealot',n:'Rune Fanatic',d:'Heroes deal 45% less damage. Every rune multiplies by 2 more, and you start with five rune stones, two of them attuned.',m:M=>{M.dmg*=.55;M.rune+=2},start:()=>{R.stones.push(2,2,2,kindStone(2),kindStone(2))}},
  {id:'council',n:'Small Council',d:'At most 5 heroes on the field. Heroes deal 70% more damage and have 70% more health.',m:M=>{M.cap=5;M.dmg*=1.7;M.hp*=1.7}},
  {id:'pactbound',n:'Pactbound',d:'Every fight carries two pacts you cannot refuse. Pact rewards are doubled.',m:M=>{M.forced=2;M.pactMul*=2}},
  {id:'night',n:'The Long Night',d:'40% more monsters, and they move 15% faster. +3 gold after every fight.',m:M=>{M.monN*=1.4;M.monSp*=1.15;M.gold+=3}},
  {id:'pauper',n:'Pauper\'s Crusade',d:'You earn no interest. Rerolling the shop is free.',m:M=>{M.noInt=1;M.rollFree=1}},
];
const CHALL={};CHALLS.forEach(c=>CHALL[c.id]=c);
const challOpen=()=>!!(META.ach&&META.ach.win);
