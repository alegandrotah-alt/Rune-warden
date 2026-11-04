// ---------- rooms without monsters, spoils after fights, potions ----------
// R.room = {t, ...}: the oracle at the start, a campfire, the merchant, a chest or an event.
// roomView() describes it (title, text, options) so the same logic drives the screen and the test bot.
const potionCap=()=>2+(has('belt')?1:0);
function gainPotion(id){if(has('sozu'))return false;if(R.potions.length>=potionCap()){toast('Potion slots are full');return false}R.potions.push(id||rndS(POTKEYS));if(DOM)uiPots();return true}
function trainable(){return allHeroes().filter(h=>(h.vet||0)<2)}
function train(h){h.vet=(h.vet||0)+1;fxStar(h);sfx('level',.6);toast(`${HEROES[h.k].n} is now a veteran${h.vet>1?' (rank 2)':''}: +25% damage and health`);if(h.vet>=2)award('vet2')}
const cost=n=>Math.max(1,Math.round(n*(has('membership')?.7:1)));
function relicPool(t){const own=new Set(R.relics);return RELICS.filter(r=>r.t===t&&!own.has(r.id)&&!(t<4&&r.id==='belt'&&has('sozu')))}
function randomRelic(t){const p=relicPool(t);return p.length?rndS(p).id:null}
function gainRelic(id){if(!id)return;R.relics.push(id);applyRelic(id);calcTraits();toast('Relic: '+RELIC[id].n);if(R.relics.filter(r=>RELIC[r].t===4).length>=2)award('boss4')}
function heroLine(h){return`${HEROES[h.k].n} ${'★'.repeat(h.star)}${h.vet?' · veteran '+h.vet:''}`}
function enterRoom(t){
  const o={t};
  if(t==='merchant'){const st=[];for(let i=0;i<2;i++)st.push({k:'item',id:rndS(COMPS),c:cost(7)});st.push({k:'item',id:randomFinished(),c:cost(17)});
    for(let i=0;i<2;i++)st.push({k:'potion',id:rndS(POTKEYS),c:cost(6)});const r1=randomRelic(1),r2=randomRelic(2);if(r1)st.push({k:'relic',id:r1,c:cost(15)});if(r2)st.push({k:'relic',id:r2,c:cost(24)});st.push({k:'train',c:cost(12)});o.stock=st}
  if(t==='treasure'){o.gold=8+R.act*5;const a=randomRelic(R.act>=1&&rng()<.5?2:1);let b=randomRelic(R.act>=2?2:1);if(b===a)b=randomRelic(2);o.relics=[a,b].filter(Boolean)}
  if(t==='event'){const id=rndS(EVKEYS.filter(k=>!R.map||!R.map.evSeen||!R.map.evSeen.includes(k))),E=EVENTS[id];Object.assign(o,{id},E.mk?E.mk():{});if(R.map){R.map.evSeen=R.map.evSeen||[];R.map.evSeen.push(id)}}
  R.room=o;R.phase='room';saveRun();showRoom()}
function leaveRoom(){const t=R.room&&R.room.t;R.room=null;if(DOM)$('ovRoom').hidden=true;if(t==='oracle'){enterPlan();return}
  R.calm=(R.calm||0)+1;if(R.calm>=4)award('nofight');finishFloor()}
// a floor with no monsters still counts as a round: income, XP and a fresh shop
function finishFloor(){const inc=income(null);gainXP(2+(has('scholar')?3:0)+rank('xp'));if(R.egg>0){R.egg--;if(R.egg===0){R.gold+=35;R.egg=-1;toast('The golden egg hatches: +35 gold')}}
  if(STONE_AT[R.wave])R.stones.push(2);R.wave++;rollShop(true);R.freeRoll=rank('reroll');R.node=null;R.nextQ=waveList(R.wave);
  floatText(FW/2,FH*.45,`+${inc.base+inc.int+inc.st+inc.ex} gold`,'#ffcf2e',1.2);autoNode();enterPlan()}
function enterPlan(){R.phase='plan';R.queue=null;saveRun();uiRefresh();if(DOM&&needMap())showMap()}
function roomView(){const o=R.room;if(!o)return null;const done=()=>leaveRoom(),V={ic:'?',t:'',d:'',opts:[]};
  if(o.t==='oracle'){Object.assign(V,{ic:'☉',t:'The Oracle at the Gate',d:'"Every warden walks the road alone. Take a gift for the journey."'});
    V.opts=o.opts.map(k=>({n:ORACLE[k].n,d:ORACLE[k].d,risk:ORACLE[k].risk,act:()=>{oracleGift(k);done()}}))}
  else if(o.t==='rest'){Object.assign(V,{ic:'♨',t:'Campfire',d:'The fire crackles. The night is short: choose one.'});
    if(o.step==='train'){V.d='Who trains tonight? A veteran deals 25% more damage and has 25% more health (two ranks at most).';V.opts=trainable().map(h=>({n:heroLine(h),d:`Rank ${(h.vet||0)+1}`,hero:h.k,act:()=>{train(h);done()}}));V.opts.push({n:'Back',d:'',act:()=>{o.step=null}})}
    else{const heal=Math.max(0,Math.min(R.hpMax-R.hp,Math.round(R.hpMax*.3)));
      V.opts=[{n:'Rest',d:has('coffee')?'The Coffee Dripper keeps you awake.':heal?`Repair ${heal} keep health.`:'The keep is already whole.',dis:has('coffee')||!heal,act:()=>{R.hp+=heal;sfx('taken',.5);done()}},
        {n:'Train',d:has('fusion')?'The Fusion Hammer forbids it.':'A hero becomes a veteran: +25% damage and health.',dis:has('fusion')||!trainable().length,act:()=>{o.step='train'}}];
      if(has('shovel'))V.opts.push({n:'Dig',d:'Dig up a random relic.',act:()=>{gainRelic(randomRelic(rng()<.3?2:1));done()}})}}
  else if(o.t==='merchant'){Object.assign(V,{ic:'⚖',t:'The Merchant',d:`"Gold for goods, warden. Everything here works, mostly." You have ${R.gold} gold.`,shop:1});
    for(const s of o.stock){if(s.k==='item')V.opts.push({n:ITEMS[s.id].n,d:ITEMS[s.id].d,cost:s.c,sold:s.sold,dis:R.items.length>=ITEM_MAX,item:s.id,act:()=>{R.gold-=s.c;s.sold=1;dropItem(s.id)}});
      if(s.k==='potion')V.opts.push({n:POTIONS[s.id].n,d:POTIONS[s.id].d,cost:s.c,sold:s.sold||has('sozu'),dis:R.potions.length>=potionCap(),pot:s.id,act:()=>{if(gainPotion(s.id)){R.gold-=s.c;s.sold=1}}});
      if(s.k==='relic')V.opts.push({n:RELIC[s.id].n,d:RELIC[s.id].d,cost:s.c,sold:s.sold,relic:s.id,act:()=>{R.gold-=s.c;s.sold=1;gainRelic(s.id)}});
      if(s.k==='train')V.opts.push({n:'Training',d:'A hero becomes a veteran.',cost:s.c,sold:s.sold||!trainable().length,act:()=>{o.back='merchant';o.step='train'}})}
    if(o.step==='train'){V.shop=0;V.d='Who gets the lessons?';V.opts=trainable().map(h=>({n:heroLine(h),d:`Rank ${(h.vet||0)+1}`,hero:h.k,act:()=>{const s=o.stock.find(q=>q.k==='train');R.gold-=s.c;s.sold=1;train(h);o.step=null}}));V.opts.push({n:'Back',d:'',act:()=>{o.step=null}})}
    else V.opts.push({n:'Leave',d:'',leave:1,act:done})}
  else if(o.t==='treasure'){Object.assign(V,{ic:'◆',t:'Treasure',d:`An old chest, unguarded. Inside: ${o.gold} gold and two relics. You can only carry one.`});
    V.opts=o.relics.map(id=>({n:RELIC[id].n,d:RELIC[id].d,relic:id,act:()=>{R.gold+=o.gold;gainRelic(id);done()}}));if(!V.opts.length)V.opts=[{n:'Take the gold',d:'',act:()=>{R.gold+=o.gold;done()}}]}
  else if(o.t==='event'){const E=EVENTS[o.id];Object.assign(V,{ic:E.ic||'?',t:E.t,d:o.say||E.d});
    if(o.step==='heroes'){V.opts=o.pick.map(k=>({n:HEROES[k].n,d:HEROES[k].tr.map(t=>TRAITS[t].n).join(' · ')+` · ${HEROES[k].c} gold`,hero:k,act:()=>{if(!addHero(k,1)){toast('Your bench is full');return}done()}}));V.opts.push({n:'Take nothing',d:'',act:done})}
    else V.opts=E.opts(o).map(q=>Object.assign({},q,{act:()=>{const r=q.run(o);if(r!=='stay')done()}}))}
  return V}
function roomAct(i){const V=roomView();const q=V&&V.opts[i];if(!q||q.dis||q.sold||q.cost>R.gold||q.ok&&!q.ok())return false;q.act();calcTraits();if(R.room){saveRun();showRoom()}uiRefresh();return true}
function oracleGift(k){
  if(k==='gold')R.gold+=15;if(k==='comp'){dropItem(rndS(COMPS));dropItem(rndS(COMPS))}if(k==='potion'){gainPotion();gainPotion()}
  if(k==='relic')gainRelic(randomRelic(1));if(k==='lvl'){R.lvl=3;R.xp=0}if(k==='stone')R.stones.push(3);
  if(k==='vet'){const h=allHeroes()[0];if(h)h.vet=1}if(k==='risk'){R.hp-=15;gainRelic(randomRelic(2))}if(k==='risk2'){R.hpMax-=20;R.hp=Math.min(R.hp,R.hpMax);R.gold+=30}}
// ---------- events: little stories with choices ----------
const EVENTS={
  armory:{ic:'⚔',t:'An abandoned armory',d:'Racks of old gear, most of it rusted. A few pieces are still good. Take one.',mk:()=>({c:[rndS(COMPS),rndS(COMPS),rndS(COMPS)]}),opts:e=>e.c.map(c=>({n:'Take the '+ITEMS[c].n,d:ITEMS[c].d,item:c,run:()=>dropItem(c)}))},
  well:{ic:'◌',t:'A cursed well',d:'Something glints at the bottom of the well. The water whispers your name.',opts:()=>[{n:'Reach in',d:'Lose 15 keep health. Gain two item components.',ok:()=>R.hp>15,run:()=>{R.hp-=15;dropItem(rndS(COMPS));dropItem(rndS(COMPS))}},{n:'Walk away',d:'Nothing happens.',run:()=>{}}]},
  gambler:{ic:'⚂',t:'A goblin gambler',d:'"Double or nothing, warden? Well, more or less double."',opts:()=>[{n:'Bet 10 gold',d:'Half the time you win 25 gold back.',ok:()=>R.gold>=10,run:()=>{R.gold-=10;if(rng()<.5){R.gold+=25;toast('You win 25 gold!');sfx('coin',.6)}else toast('The goblin cackles and pockets your gold')}},{n:'Leave',d:'Keep your gold.',run:()=>{}}]},
  pilgrim:{ic:'ᚱ',t:'A rune pilgrim',d:'An old woman covered in glowing tattoos offers you a blessing.',opts:()=>[{n:'A rune stone',d:'Gain a ×2 rune stone.',run:()=>R.stones.push(2)},{n:'Bless the runes',d:'Every rune on the field multiplies by 1 more for the rest of this act.',run:()=>{for(const q of R.field.runes)q.v++}}]},
  drill:{ic:'⚑',t:'A veteran drillmaster',d:'"Your recruits are soft. Give me an afternoon."',opts:()=>[{n:'Drills',d:'Gain 6 XP.',run:()=>gainXP(6)},{n:'Private lessons',d:'Pay 8 gold: your strongest fielded hero becomes a veteran.',ok:()=>R.gold>=8&&R.board.some(h=>(h.vet||0)<2),run:()=>{R.gold-=8;train(R.board.filter(h=>(h.vet||0)<2).sort((a,b)=>HEROES[b.k].c*b.star-HEROES[a.k].c*a.star)[0])}}]},
  altar:{ic:'✝',t:'The forgotten altar',d:'A cracked altar, still warm. It asks for a sacrifice.',opts:()=>[{n:'Offer a hero',d:'Your cheapest hero is gone for good. Gain a random gold relic.',ok:()=>allHeroes().length>1,run:()=>{const h=allHeroes().sort((a,b)=>HEROES[a.k].c*a.star-HEROES[b.k].c*b.star)[0];removeHero(h);for(const it of h.it||[])stashItem(it);gainRelic(randomRelic(2))}},{n:'Pray',d:'Repair 8 keep health.',run:()=>{R.hp=Math.min(R.hpMax,R.hp+8)}},{n:'Leave',d:'',run:()=>{}}]},
  bard:{ic:'♫',t:'A wandering bard',d:'"A song for the road? Or a song for the fight? Both cost the same, which is to say: something."',opts:()=>[{n:'A song for the road',d:'Repair 12 keep health.',run:()=>{R.hp=Math.min(R.hpMax,R.hp+12)}},{n:'A battle hymn',d:'Pay 6 gold: heroes start the next fight with full mana.',ok:()=>R.gold>=6,run:()=>{R.gold-=6;R.hymn=1}},{n:'Leave',d:'',run:()=>{}}]},
  fey:{ic:'❀',t:'A ring of mushrooms',d:'Tiny lights dance in a perfect circle of mushrooms. Stepping in feels... changeable.',opts:()=>[{n:'Dance',d:'A random ★1 hero you own turns into a random hero that costs 1 more.',ok:()=>allHeroes().some(h=>h.star===1&&HEROES[h.k].c<5),run:()=>{const h=rndS(allHeroes().filter(h=>h.star===1&&HEROES[h.k].c<5));transmute(h)}},{n:'Pick mushrooms',d:'Gain a random potion.',run:()=>gainPotion()},{n:'Leave',d:'',run:()=>{}}]},
  hoard:{ic:'◆',t:'A sleeping dragon\'s hoard',d:'A mountain of gold, and something huge breathing on top of it.',opts:()=>[{n:'Fill your pockets',d:'+35 gold. Your next fight has two more elite champions.',run:()=>{R.gold+=35;R.hoard=1}},{n:'Take one gem',d:'+10 gold.',run:()=>{R.gold+=10}},{n:'Tiptoe away',d:'',run:()=>{}}]},
  library:{ic:'❑',t:'The sunken library',d:'Water drips onto shelves of old war journals.',opts:e=>[{n:'Study tactics',d:'Choose a free hero from three, one cost above what your shop usually offers.',run:()=>{e.step='heroes';e.pick=rollRecruits(3,1);return 'stay'}},{n:'Read the runes',d:'Gain a ×2 rune stone.',run:()=>R.stones.push(2)}]},
  smithy:{ic:'⚒',t:'A dwarven smithy',d:'"Bring me scrap, I\'ll bring you steel. Bring me gold, I\'ll bring you better."',opts:()=>[{n:'Reforge',d:'Pay 6 gold: a component on your item rack becomes a random finished item.',ok:()=>R.gold>=6&&R.items.some(isComp),run:()=>{R.gold-=6;const i=R.items.findIndex(isComp);R.items.splice(i,1);dropItem(randomFinished())}},{n:'Buy scrap',d:'Pay 5 gold: a random item component.',ok:()=>R.gold>=5,run:()=>{R.gold-=5;dropItem(rndS(COMPS))}},{n:'Leave',d:'',run:()=>{}}]},
  mirror:{ic:'◐',t:'A cursed mirror',d:'Your reflection is a little late, and it is holding someone else.',opts:()=>[{n:'Reach through',d:'Lose 10 keep health. Copy a random hero you own (★1).',ok:()=>R.hp>10&&allHeroes().length>0,run:()=>{R.hp-=10;const h=rndS(allHeroes());if(!addHero(h.k,1,true))toast('Your bench is full')}},{n:'Smash it',d:'Gain 6 gold from the silver frame.',run:()=>{R.gold+=6}}]},
  merchant2:{ic:'⚖',t:'A peddler with one cart',d:'"Only one thing left, friend. Fair price."',mk:()=>({it:randomFinished()}),opts:e=>[{n:'Buy the '+ITEMS[e.it].n,d:ITEMS[e.it].d+' (12 gold)',item:e.it,ok:()=>R.gold>=12,run:()=>{R.gold-=12;dropItem(e.it)}},{n:'Leave',d:'',run:()=>{}}]},
};
const EVKEYS=Object.keys(EVENTS);
function transmute(h){const c=Math.min(5,HEROES[h.k].c+1),opts=HKEYS.filter(k=>HEROES[k].c===c&&(unlocked(k)||R.daily)&&k!==h.k);if(!opts.length)return;const k=rndS(opts);toast(`${HEROES[h.k].n} becomes ${HEROES[k].n}!`);h.k=k;if(h.c>=0)fxStar(h);merge(h)}
// ---------- spoils after a fight: pick a recruit (like a card reward), plus gold, items and potions ----------
function rollRecruits(n,bonus){const out=[];for(let i=0;i<n;i++){const lv=Math.min(10,R.lvl+(bonus||0));const o=ODDS[lv];let x=rng()*100,t=1;for(let q=0;q<5;q++){x-=o[q];if(x<0){t=q+1;break}}
    let opts=[];for(;t>=1;t--){opts=HKEYS.filter(k=>HEROES[k].c===t&&(R.pool[k]>0)&&!out.includes(k));if(opts.length)break}if(opts.length)out.push(rndS(opts))}return out}
function makeSpoils(node,won,gold){const S={node,won,lines:gold?[['gold',`+${gold} gold`]]:[],heroes:[]};
  const elite=node==='elite',boss=node==='boss';
  S.heroes=rollRecruits(3+(has('prayer')&&node==='battle'?1:0),elite||boss||has('prayer')&&rng()<.35?1:0);
  if(elite){const c=rndS(COMPS);dropItem(c);R.gold+=3;S.lines.push(['item',`${ITEMS[c].n} and 3 gold from the elite`]);R.stats.elites=(R.stats.elites||0)+1;if(R.stats.elites>=5)award('elite5')}
  if((elite||boss)&&has('toolbox')){const c=rndS(COMPS);dropItem(c);S.lines.push(['item',`${ITEMS[c].n} from the Toolbox`])}
  if(!has('sozu')&&rng()<(elite?.6:boss?0:.4)&&R.potions.length<potionCap()){const p=rndS(POTKEYS);gainPotion(p);S.lines.push(['potion',`${POTIONS[p].n} found`])}
  if(has('bloodvial')){R.hp=Math.min(R.hpMax,R.hp+2)}
  return S}
function takeRecruit(i){const S=R.spoils;if(!S)return false;if(i<0){R.gold+=2;toast('Skipped: +2 gold')}else{const k=S.heroes[i];if(!k||!addHero(k,1)){toast('Your bench is full: sell a hero or skip');return false}sfx('pick',.55)}
  R.spoils=null;if(DOM)$('ovReward').hidden=true;advance();return true}
// after a fight, the queued screens play one after another, then you are back on the map
function advance(){const q=R.queue||[];const s=q.shift();if(!s){enterPlan();return}
  if(s==='spoils'){R.phase='reward';saveRun();showSpoils();return}
  if(s==='relic'){offerRelics(rng()<.6?1:2,'elite');return}
  if(s==='boss'){offerRelics(4,'boss');return}
  if(s==='endless'){offerRelics(rng()<.3?3:2,'endless');return}
  advance()}
// ---------- potions ----------
function usePotion(i){const id=R.potions[i],P=POTIONS[id];if(!P)return false;
  if(P.wave&&R.phase!=='wave'){toast(`${P.n}: drink it during a wave`);return false}if(P.plan&&R.phase!=='plan'){toast(`${P.n}: drink it between waves`);return false}
  R.potions.splice(i,1);R.stats.pots=(R.stats.pots||0)+1;if(R.stats.pots>=5)award('potion5');sfx('item',.6,.8);const B=R.b;
  if(id==='fire'){for(const m of B.mons)if(m.hp>0){dealRaw(m,m.max*(m.boss?.06:.2),null,0,{big:1});fx({k:'fire',x:m.x,y:m.y,r:T*.5,dur:.5,col:'#ff7a2a'})}shake(6)}
  if(id==='frost'){for(const m of B.mons){m.stunT=Math.max(m.stunT,3);}fx({k:'ice',x:FW/2,y:FH/2,r:FW*.45,dur:.8,col:'#8ad8ff'})}
  if(id==='heal'){R.hp=Math.min(R.hpMax,R.hp+25)}
  if(id==='rage'){B.rageT=8}
  if(id==='mana'){for(const h of R.board)if(!h.ko)h.mana=HEROES[h.k].mana}
  if(id==='phoenix'){for(const h of R.board){if(h.ko){h.ko=0;h.hp=h.hpMax*.5}else healHero(h,h.hpMax*.5)}}
  if(id==='gold')R.gold+=12;if(id==='ink')R.ink=1;if(id==='insight')gainXP(6);
  toast(P.n+': '+P.d);uiRefresh();if(R.phase==='plan')saveRun();return true}
// ---------- room, spoils and potion screens ----------
function showRoom(){if(!DOM)return;const V=roomView();if(!V){$('ovRoom').hidden=true;return}$('roomI').textContent=V.ic;$('roomT').textContent=V.t;$('roomD').textContent=V.d;const box=$('roomList');box.innerHTML='';box.className=V.shop?'shopgrid':'picks';
  V.opts.forEach((q,i)=>{const b=document.createElement('button');b.type='button';b.className=V.shop&&!q.leave?'ware':'relic';b.style.setProperty('--c',q.risk?'#ff7a5a':q.relic?['','#cfd8e0','#ffcf6a','#e6a8ff','#ff8a6a'][RELIC[q.relic].t]:q.pot?POTIONS[q.pot].col:q.item?'#ffd76a':'#d6a8ff');
    const off=q.dis||q.sold||q.cost>R.gold||q.ok&&!q.ok();b.disabled=!!off;
    const icon=q.item?`<span class="gem it">${ITEMS[q.item].ic}</span>`:q.pot?`<span class="gem pot" style="--p:${POTIONS[q.pot].col}">${POTIONS[q.pot].ic}</span>`:q.relic?`<span class="gem">${RELIC[q.relic].em?TRAITS[RELIC[q.relic].em].ic:RIC[q.relic]||RELIC[q.relic].n[0]}</span>`:'';
    b.innerHTML=`${icon}<b>${q.n}</b>${q.d?`<span>${q.d}</span>`:''}${q.cost?`<em class="price">${q.sold?'Sold':q.cost+' gold'}</em>`:''}`;
    if(q.hero){const p=smallPortrait('h_',q.hero,22);if(p)b.prepend(p)}
    b.addEventListener('click',()=>roomAct(i));box.appendChild(b)});
  $('ovRoom').hidden=false}
function showSpoils(){if(!DOM||!R.spoils)return;const S=R.spoils,N=NODES[S.node]||NODES.battle;$('rwT').textContent=S.node==='boss'?'The boss falls!':S.node==='elite'?'Elite defeated':'Victory';
  $('rwL').innerHTML=S.lines.map(([k,t])=>`<li class="${k}">${t}</li>`).join('')||'';
  const box=$('rwHeroes');box.innerHTML='';S.heroes.forEach((k,i)=>{const D=HEROES[k],b=document.createElement('button');b.type='button';b.className='hc rc';b.style.setProperty('--c',TIERCOL[D.c]);
    b.innerHTML=`<span class="cost">${D.c}g</span><span class="nm"><b>${D.n}</b><small>${D.tr.map(t=>TRAITS[t].ic+' '+TRAITS[t].n).join(' · ')}</small><small class="ab">${D.ab.n}: ${D.d}</small></span>`;const p=portrait(k,38);if(p)b.prepend(p);
    b.addEventListener('click',()=>takeRecruit(i));box.appendChild(b)});
  $('rwSkip').textContent='Skip (+2 gold)';$('ovReward').hidden=false}
function uiPots(){if(!DOM||!R)return;const box=$('pots'),cap=has('sozu')?0:potionCap(),sig=R.potions.join()+'|'+cap+'|'+R.phase;if(box.dataset.sig===sig)return;box.dataset.sig=sig;box.innerHTML='';
  for(let i=0;i<cap;i++){const id=R.potions[i],b=document.createElement('button');b.type='button';b.className='pot'+(id?'':' empty');
    if(id){const P=POTIONS[id];b.style.setProperty('--p',P.col);b.innerHTML=`<i>${P.ic}</i>`;b.title=P.n+': '+P.d;b.classList.toggle('ready',!(P.wave&&R.phase!=='wave')&&!(P.plan&&R.phase!=='plan'));b.addEventListener('click',()=>usePotion(i))}else b.title='Empty potion slot';box.appendChild(b)}}
function bindRooms(){if(!DOM)return;$('rwSkip').addEventListener('click',()=>takeRecruit(-1))}
