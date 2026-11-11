// ---------- rooms without monsters, spoils after fights, potions ----------
// R.room = {t, ...}: the oracle at the start, a campfire, the merchant, a chest or an event.
// roomView() describes it (title, text, options) so the same logic drives the screen and the test bot.
const potionCap=()=>2+(has('belt')?1:0)+(rank('potion')>=2?1:0);
function gainPotion(id){if(has('sozu')||stage()<1)return false;if(R.potions.length>=potionCap()){toast('Potion slots are full');return false}R.potions.push(id||rndS(POTKEYS));if(DOM)uiPots();return true}
const canAdd=k=>R.bench.includes(null)||allHeroes().filter(h=>h.k===k&&h.star===1).length>=2;
function trainable(){return allHeroes().filter(h=>(h.vet||0)<2)}
function train(h){h.vet=(h.vet||0)+1;fxStar(h);sfx('level',.6);toast(`${HEROES[h.k].n} is now a veteran${h.vet>1?' (rank 2)':''}: +25% damage and health`);if(h.vet>=2)award('vet2')}
const cost=n=>Math.max(1,Math.round(n*(has('membership')?.7:1)*(1-.15*rank('merchant'))));
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
function finishFloor(){const inc={base:5,int:0,st:0,ex:has('tithe')?2:0};R.gold+=inc.base+inc.ex;gainXP(2+(has('scholar')?3:0)+rank('xp'));if(R.egg>0){R.egg--;if(R.egg===0){R.gold+=35;R.egg=-1;toast('The golden egg hatches: +35 gold')}}
  if(STONE_AT[R.wave])R.stones.push(2);R.wave++;rollShop(true);R.freeRoll=rank('reroll');R.node=null;R.nextQ=waveList(R.wave);
  floatText(FW/2,FH*.45,`+${inc.base+inc.ex} gold (no interest without a fight)`,'#ffcf2e',1.1);autoNode();enterPlan()}
function enterPlan(){R.phase='plan';R.queue=null;saveRun();uiRefresh();if(DOM){if(needMap())showMap();else $('ovMap').hidden=true}}
function roomView(){const o=R.room;if(!o)return null;const done=()=>leaveRoom(),V={ic:'?',t:'',d:'',opts:[]};
  if(o.t==='oracle'){Object.assign(V,{ic:icon('eye'),t:'The Oracle at the Gate',d:'"Every warden walks the road alone. Take a gift for the journey."'});
    V.opts=o.opts.map(k=>({n:ORACLE[k].n,d:ORACLE[k].d,risk:ORACLE[k].risk,act:()=>{oracleGift(k);done()}}))}
  else if(o.t==='rest'){Object.assign(V,{ic:NODES.rest.ic,t:'Campfire',d:'The fire crackles. The night is short: choose one.'});
    if(o.step==='train'){V.d='Who trains tonight? A veteran deals 25% more damage and has 25% more health (two ranks at most).';V.opts=trainable().map(h=>({n:heroLine(h),d:`Rank ${(h.vet||0)+1}`,hero:h.k,act:()=>{train(h);done()}}));V.opts.push({n:'Back',d:'',act:()=>{o.step=null}})}
    else{const heal=Math.max(0,Math.min(R.hpMax-R.hp,Math.round(R.hpMax*(rank('hearth')?.45:.3))));
      V.opts=[{n:'Rest',d:has('coffee')?'The Coffee Dripper keeps you awake.':heal?`Repair ${heal} keep health.`:'The keep is already whole.',dis:has('coffee')||!heal,act:()=>{R.hp+=heal;sfx('taken',.5);done()}},
        {n:'Train',d:has('fusion')?'The Fusion Hammer forbids it.':'A hero becomes a veteran: +25% damage and health.',dis:has('fusion')||!trainable().length,act:()=>{o.step='train'}}];
      if(has('shovel'))V.opts.push({n:'Dig',d:'Dig up a random relic.',act:()=>{gainRelic(randomRelic(rng()<.3?2:1));done()}});
      V.opts.push({n:'Move on',d:'Leave the fire behind.',leave:1,act:done})}}
  else if(o.t==='merchant'){Object.assign(V,{ic:NODES.merchant.ic,t:'The Merchant',d:`"Gold for goods, warden. Everything here works, mostly." You have ${R.gold} gold.`,shop:1});
    for(const s of o.stock){if(s.k==='item')V.opts.push({n:ITEMS[s.id].n,d:ITEMS[s.id].d,cost:s.c,sold:s.sold,dis:R.items.length>=ITEM_MAX,item:s.id,act:()=>{R.gold-=s.c;s.sold=1;dropItem(s.id)}});
      if(s.k==='potion')V.opts.push({n:POTIONS[s.id].n,d:POTIONS[s.id].d,cost:s.c,sold:s.sold||has('sozu'),dis:R.potions.length>=potionCap(),pot:s.id,act:()=>{if(gainPotion(s.id)){R.gold-=s.c;s.sold=1}}});
      if(s.k==='relic')V.opts.push({n:RELIC[s.id].n,d:RELIC[s.id].d,cost:s.c,sold:s.sold,relic:s.id,act:()=>{R.gold-=s.c;s.sold=1;gainRelic(s.id)}});
      if(s.k==='train')V.opts.push({n:'Training',d:'A hero becomes a veteran.',cost:s.c,sold:s.sold||!trainable().length,act:()=>{o.back='merchant';o.step='train'}})}
    if(o.step==='train'){V.shop=0;V.d='Who gets the lessons?';V.opts=trainable().map(h=>({n:heroLine(h),d:`Rank ${(h.vet||0)+1}`,hero:h.k,act:()=>{const s=o.stock.find(q=>q.k==='train');R.gold-=s.c;s.sold=1;train(h);o.step=null}}));V.opts.push({n:'Back',d:'',act:()=>{o.step=null}})}
    else V.opts.push({n:'Leave',d:'',leave:1,act:done})}
  else if(o.t==='gate'){Object.assign(V,{ic:icon('eye'),t:'The Rift Opens',d:`${MON[actD(2).boss].n} is dead, and the realm is saved. But beneath the ${actD(2).n.split(' ').pop()} the ground has torn open, and something vast is waking down there: the Rune Devourer. The way to it runs through the Rift: ${RIFTN} floors of void-born monsters that silence, drain and feed on your heroes, where every champion carries two twists, and the Rift Herald waits on the last. Your victory is already counted. Go down, or go home a hero.`});
    V.opts=[{n:'Enter the Rift',d:`Act IV: ${RIFTN} more floors, then the Devourer itself. The keep repairs half of its missing health first.`,risk:1,act:()=>{R.room=null;if(DOM)$('ovRoom').hidden=true;startRift()}},
      {n:'Return home victorious',d:'End the run as a victory.',act:()=>{R.room=null;if(DOM)$('ovRoom').hidden=true;runOver(true)}}]}
  else if(o.t==='devour'){Object.assign(V,{ic:icon('eye'),t:'The Hunger Beneath',d:'The Herald is silent, and the Rift has gone still. At the bottom of it the Rune Devourer turns to look at you. It takes at most a sliver of its health each second and regrows the rest, its heartbeat grows deadlier every time, it seizes your strongest hero, eats your runes and tears rifts open. A long road, healers and steady damage are the only way.'});
    V.opts=[{n:'Face the Devourer',d:'The last fight. Win or lose, your victory stands.',risk:1,act:()=>{R.room=null;if(DOM)$('ovRoom').hidden=true;enterFinal()}},
      {n:'Climb back out',d:'End the run as a victory.',act:()=>{R.room=null;if(DOM)$('ovRoom').hidden=true;runOver(true)}}]}
  else if(o.t==='treasure'){Object.assign(V,{ic:NODES.treasure.ic,t:'Treasure',d:`An old chest, unguarded. Inside: ${o.gold} gold and two relics. You can only carry one.`});
    V.opts=o.relics.map(id=>({n:RELIC[id].n,d:RELIC[id].d,relic:id,act:()=>{R.gold+=o.gold;gainRelic(id);done()}}));if(!V.opts.length)V.opts=[{n:'Take the gold',d:'',act:()=>{R.gold+=o.gold;done()}}]}
  else if(o.t==='event'){const E=EVENTS[o.id];Object.assign(V,{ic:E.ic||icon('question'),t:E.t,d:o.say||E.d});
    if(o.step==='heroes'){V.opts=o.pick.map(k=>({n:HEROES[k].n,d:canAdd(k)?HEROES[k].tr.map(t=>TRAITS[t].n).join(' · ')+` · ${HEROES[k].c} gold`:'Your bench is full',dis:!canAdd(k),hero:k,act:()=>{if(!addHero(k,1)){toast('Your bench is full');return}done()}}));V.opts.push({n:'Take nothing',d:'',act:done})}
    else V.opts=E.opts(o).map(q=>Object.assign({},q,{act:()=>{const r=q.run(o);if(r!=='stay')done()}}))}
  // never a dead end: if nothing can be chosen, offer a way out
  if(!V.opts.some(q=>!q.dis&&!q.sold&&!(q.cost>R.gold)&&!(q.ok&&!q.ok())))V.opts.push({n:'Move on',d:'',leave:1,act:o.t==='oracle'||o.t==='gate'||o.t==='devour'?done:()=>{if(o.step){o.step=null;return}done()}});
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
Object.assign(EVENTS,{
  beastmaster:{ic:'ᛒ',t:'A beastmaster\'s camp',d:'Cages, straw and a great many eyes in the dark. "They only bite monsters. Mostly."',mk:()=>({k:rndS(HKEYS.filter(k=>HEROES[k].tr.includes('beast')&&HEROES[k].c<=3))}),opts:e=>[{n:'Take the '+HEROES[e.k].n,d:'It joins your bench. '+HEROES[e.k].d,ok:()=>canAdd(e.k),run:()=>addHero(e.k,1,true)},{n:'Watch them train',d:'Gain 5 XP.',run:()=>gainXP(5)}]},
  surveyor:{ic:'▲',t:'A royal surveyor',d:'"Give me a morning and a few coins and I will move the earth for you."',opts:()=>[{n:'Raise the ground',d:'Pay 6 gold: three empty hexes become high ground.',ok:()=>R.gold>=6,run:()=>{R.gold-=6;terraform(1,3)}},{n:'Plant brambles',d:'Three hexes of the road grow thorns.',run:()=>terraform(3,3,1)},{n:'Send him away',d:'Nothing happens.',run:()=>{}}]},
  sealedgate:{ic:'ᚱ',t:'A half-sealed gate',d:'Old wards still cling to the stones. With the right word they would hold a while longer.',opts:()=>[{n:'Speak the word',d:'One fewer gate opens for the next 3 fights.',run:()=>{R.seal=3;R.nextQ=waveList(R.wave)}},{n:'Pry out the wardstones',d:'Gain 12 gold.',run:()=>{R.gold+=12}}]},
  moonshrine:{ic:'☾',t:'A moonlit shrine',d:'The pool is perfectly still. Something old is listening.',opts:()=>[{n:'Pray',d:'The keep repairs 15 health.',run:()=>{R.hp=Math.min(R.hpMax,R.hp+15)}},{n:'Offer blood',d:'Lose 12 keep health: your cheapest fielded ★1 hero becomes ★2.',ok:()=>R.hp>12&&R.board.some(h=>h.star===1),run:()=>{R.hp-=12;const h=R.board.filter(h=>h.star===1).sort((a,b)=>HEROES[a.k].c-HEROES[b.k].c)[0];h.star=2;fxStar(h);calcTraits()}}]},
});
// change a few hexes of terrain: free ones anywhere, or ones on the road
function terraform(t,n,road){const F=R.field,ok=(c,r)=>!F.blk[r*COLS+c]&&!F.ter[r*COLS+c]&&!runeAt(c,r)&&!portalAt(c,r)&&!isGate(c,r)&&c>0&&c<COLS-1;let cells=[];
  if(road)cells=(F.route||[]).filter(([c,r])=>ok(c,r));else for(let r=0;r<ROWS;r++)for(let c=2;c<COLS-2;c++)if(ok(c,r))cells.push([c,r]);
  for(let i=0;i<n&&cells.length;i++){const [c,r]=cells.splice((rng()*cells.length)|0,1)[0];F.ter[r*COLS+c]=t}calcTraits();if(typeof bgDirty!=='undefined')bgDirty=1}
// longer stories: several steps, and the choice at each one changes what comes next
Object.assign(EVENTS,{
  tower:{ic:'▲',t:'The leaning tower',d:'A watchtower sags over the road, its stairs half gone. Things glint on every landing.',mk:()=>({fl:0,gold:0,comp:0,rel:0}),
    opts:e=>{const risk=[10,30,50][e.fl],find=['12 gold','an item component','a gold relic'][e.fl],have=[e.gold?e.gold+' gold':'',e.comp?'an item component':'',e.rel?'a gold relic':''].filter(Boolean).join(', ');
      const take=()=>{R.gold+=e.gold;if(e.comp)dropItem(rndS(COMPS));if(e.rel)gainRelic(randomRelic(2))};
      return[{n:e.fl?'Climb higher':'Climb the stairs',d:`${find[0].toUpperCase()+find.slice(1)} on the next landing. ${risk}% chance the stairs give way: lose 8 keep health and everything you found here.`,ok:()=>R.hp>8,
        run:()=>{if(rng()*100<risk){R.hp-=8;toast('The stairs give way! You crawl out with nothing.');sfx('lose',.4);return}if(e.fl===0)e.gold=12;if(e.fl===1)e.comp=1;if(e.fl===2)e.rel=1;e.fl++;if(e.fl>=3){take();toast('You reach the top and carry it all down');return}e.say=`Landing ${e.fl} of 3. So far you carry ${have?have+' and ':''}${find}. The stairs above look worse.`;return'stay'}},
        {n:e.fl?'Climb down with what you have':'Leave it be',d:have?'Keep '+have+'.':'',run:take}]}},
  duel:{ic:'⚔',t:'A champion at the crossroads',d:'A knight in battered plate bars the way. "One of yours against me. No blood, just honour, and a purse on it."',
    opts:e=>{if(!e.on)return[{n:'Accept the duel',d:'Choose a hero to fight. Win: that hero becomes a veteran and you gain 15 gold. Lose: you pay 8 gold.',ok:()=>R.board.length>0,run:()=>{e.on=1;e.say='"Good. Choose your champion." Stronger heroes win more often.';return'stay'}},{n:'Pay the toll',d:'Lose 4 gold and walk on.',ok:()=>R.gold>=4,run:()=>{R.gold-=4}},{n:'Take the long way round',d:'',run:()=>{}}];
      return R.board.slice().sort((a,b)=>HEROES[b.k].c*b.star-HEROES[a.k].c*a.star).slice(0,4).map(h=>{const p=Math.round(clamp(.2+.11*HEROES[h.k].c*h.star+.1*(h.vet||0),.25,.92)*100);return{n:heroLine(h),d:`${p}% to win.`,hero:h.k,run:()=>{if(rng()*100<p){if((h.vet||0)<2)train(h);R.gold+=15;toast(`${HEROES[h.k].n} wins the duel!`);sfx('level',.6)}else{R.gold=Math.max(0,R.gold-8);toast(`${HEROES[h.k].n} is knocked flat. The knight takes his purse.`)}}}})}},
  sphinx:{ic:'◐',t:'The riddling statue',d:'A stone face in the cliff opens one eye. "Two answers right, and I give. One wrong, and I take."',mk:()=>({n:0,q:(rng()*RIDDLES.length)|0,ord:rng()<.5?[0,1,2]:rng()<.5?[1,0,2]:[2,1,0]}),
    opts:e=>{const Q=RIDDLES[e.q%RIDDLES.length];if(!e.say)e.say=`A stone face in the cliff opens one eye. "Two answers right, and I give. One wrong, and I take." It asks: "${Q.q}"`;
      return e.ord.map(i=>({n:Q.a[i],d:'',run:()=>{if(i!==0){R.gold=Math.max(0,R.gold-8);toast('"Wrong." The eye closes. You are 8 gold lighter.');return}e.n++;if(e.n>=2){gainRelic(randomRelic(1));toast('"Right again." The statue spits out a relic.');sfx('level',.6);return}e.q++;e.ord=rng()<.5?[1,2,0]:[2,0,1];e.say=`"Right. One more." It asks: "${RIDDLES[e.q%RIDDLES.length].q}"`;return'stay'}})).concat([{n:'Walk away',d:'',run:()=>{}}])}},
});
// the first answer of each riddle is the right one; the statue shuffles them
const RIDDLES=[{q:'Cross me and an arrow grows; walk through me and a monster does. Name us both.',a:['A rune and a portal','A hill and a bog','A gate and a breach']},
  {q:'Three of me make one of me, only better.',a:['A hero','A relic','A potion']},
  {q:'I pay you for sitting still: one coin for every ten you keep.',a:['Interest','A win streak','The merchant']},
  {q:'I never swing a blade, yet where I stand the road must bend.',a:['Any hero on the field','A rune stone','The keep']},
  {q:'I wake when a fight runs long, and then no stun or shove will hold me.',a:['Frenzy','A boss','An elite']}];
const EVKEYS=Object.keys(EVENTS);
applyIcons();
function transmute(h){const c=Math.min(5,HEROES[h.k].c+1),opts=HKEYS.filter(k=>HEROES[k].c===c&&(unlocked(k)||R.daily)&&k!==h.k);if(!opts.length)return;const k=rndS(opts);toast(`${HEROES[h.k].n} becomes ${HEROES[k].n}!`);h.k=k;if(h.c>=0)fxStar(h);merge(h)}
// ---------- spoils after a fight: pick a recruit (like a card reward), plus gold, items and potions ----------
function rollRecruits(n,bonus){const out=[];for(let i=0;i<n;i++){const lv=Math.min(10,R.lvl+(bonus||0));const o=ODDS[lv];let x=rng()*100,t=1;for(let q=0;q<5;q++){x-=o[q];if(x<0){t=q+1;break}}
    let opts=[];for(;t>=1;t--){opts=HKEYS.filter(k=>HEROES[k].c===t&&(R.pool[k]>0)&&!out.includes(k));if(opts.length)break}if(opts.length)out.push(rndS(opts))}return out}
function makeSpoils(node,won,gold){const S={node,won,lines:gold?[['gold',`+${gold} gold`]]:[],heroes:[]};
  const elite=node==='elite',boss=node==='boss';
  S.heroes=rollRecruits(3+(rank('recruit')?1:0)+(has('prayer')&&node==='battle'?1:0),elite||boss||has('prayer')&&rng()<.35?1:0);
  if(node==='battle'){R.gold+=3;S.lines.push(['gold','+3 spoils'])}
  if(elite){const c=rndS(COMPS);dropItem(c);R.gold+=6;S.lines.push(['item',`${ITEMS[c].n} and 6 gold from the elite`]);R.stats.elites=(R.stats.elites||0)+1;if(R.stats.elites>=5)award('elite5')}
  if((elite||boss)&&has('toolbox')){const c=rndS(COMPS);dropItem(c);S.lines.push(['item',`${ITEMS[c].n} from the Toolbox`])}
  if(!has('sozu')&&stage()>=1&&rng()<(elite?.6:boss?0:.4)&&R.potions.length<potionCap()){const p=rndS(POTKEYS);gainPotion(p);S.lines.push(['potion',`${POTIONS[p].n} found`])}
  if(has('bloodvial')){R.hp=Math.min(R.hpMax,R.hp+2)}
  return S}
function takeRecruit(i){const S=R.spoils;if(!S)return false;if(i<0){R.gold+=2;toast('Skipped: +2 gold')}else{const k=S.heroes[i];if(!k||!addHero(k,1)){toast('Your bench is full: sell a hero or skip');return false}sfx('pick',.55)}
  R.spoils=null;if(DOM)$('ovReward').hidden=true;advance();return true}
// after a fight, the queued screens play one after another, then you are back on the map
function advance(){const q=R.queue||[];const s=q.shift();if(!s){enterPlan();return}
  if(s==='spoils'){if(!R.spoils){advance();return}R.phase='reward';saveRun();showSpoils();return}
  if(s==='relic'){offerRelics(rng()<.6?1:2,'elite');return}
  if(s==='boss'){offerRelics(4,'boss');return}
  if(s==='gate'||s==='devour'){R.room={t:s};R.phase='room';saveRun();showRoom();return}
  if(s==='endless'){offerRelics(rng()<.3?3:2,'endless');return}
  advance()}
// ---------- act IV ----------
// down into the Rift: a new field, a short map, void-born monsters; the Herald on the last floor
function startRift(){R.rift=1;R.act=3;R.leakAct=0;R.calm=0;award('gate');const fix=Math.ceil((R.hpMax-R.hp)*.5);R.hp+=fix;genField();if(guardLv('oracle')>=3)R.stones.push(2);if(R.warden==='runesmith')R.stones.push(2);
  genMap();R.nextQ=waveList(R.wave);autoNode();bgDirty=1;banner('ACT IV: THE RIFT','#d6a8ff');if(fix>0)floatText(FW+T*.2,FH/2-T*1.2,'+'+fix,'#7dff9a',1.3);enterPlan()}
// the Devourer itself, with an escort from the Rift
function enterFinal(){R.final=1;R.node='final';R.map=null;R.nextQ=tagGates([{k:'devourer'}].concat(Array.from({length:16},(_,i)=>({k:rndS(actD(R.act).roster),elite:i%4===3?1:0}))),30);enterPlan()}
// ---------- room pictures: a small scene at the top of every room, built from the game's own sprites ----------
// each piece: [sheet, cell, x across (0..1), height (share of the picture), flip]. 'H:key' is a hero, 'M:key' a monster, 'TEAM' your two strongest heroes.
const SCENES={
  oracle:[['props4',12,.36,.5],['H:hexwitch',0,.6,.92,1],['props4',20,.82,.42]],
  rest:[['props4',15,.76,.95],['props4',8,.18,.5],['TEAM',0,.36,.8],['props4',14,.56,.36]],
  merchant:[['props4',0,.16,.5],['props4',2,.64,.98],['H:tinker',0,.4,.86],['props4',7,.86,.5]],
  treasure:[['props4',20,.26,.32],['props4',0,.5,.84],['props4',6,.74,.36]],
  gate:[['props4',17,.14,.7],['props4',16,.3,.5],['M:devourer',0,.64,1.3,1],['props4',20,.9,.4]],
  devour:[['props4',16,.12,.5],['M:devourer',0,.56,1.6,1],['props4',17,.92,.7]],
  armory:[['props4',5,.3,.6],['props4',0,.56,.6],['props4',7,.8,.5]],
  well:[['props4',9,.7,.9],['props4',1,.42,.62],['props4',12,.18,.45]],
  gambler:[['props4',5,.56,.6],['props4',13,.36,.6],['props4',6,.62,.26],['props4',0,.84,.45]],
  pilgrim:[['props4',17,.2,.8],['H:druid',0,.5,.9,1],['props4',12,.76,.45]],
  drill:[['H:squire',0,.3,.82],['H:berserker',0,.62,.95,1],['props4',8,.88,.5]],
  altar:[['props4',10,.22,.45],['props4',4,.5,.95],['props4',10,.78,.45]],
  bard:[['props4',8,.2,.5],['H:archer',0,.46,.88],['props4',14,.72,.36]],
  fey:[['props3',2,.2,.55],['props3',3,.42,.5],['props3',2,.66,.6],['props3',3,.86,.5]],
  hoard:[['props4',0,.2,.5],['M:dragon',0,.58,1.25,1],['props4',6,.34,.3],['props4',20,.88,.34]],
  library:[['props4',5,.3,.6],['H:apprentice',0,.56,.86],['props4',11,.82,.6]],
  smithy:[['props4',10,.24,.5],['H:berserker',0,.5,.92],['props4',5,.76,.6]],
  mirror:[['props4',20,.5,.95],['props4',12,.2,.45],['props4',11,.82,.55]],
  merchant2:[['props4',7,.34,.6],['H:cutpurse',0,.56,.86,1],['props4',0,.82,.5]],
  beastmaster:[['props4',15,.78,.95],['H:wolf',0,.24,.7],['H:fox',0,.44,.6],['H:scout',0,.6,.84,1]],
  surveyor:[['props4',17,.2,.85],['H:scout',0,.5,.86],['props4',8,.8,.5]],
  sealedgate:[['props4',16,.2,.45],['props4',9,.54,1.05],['props4',17,.86,.75]],
  moonshrine:[['props4',12,.2,.45],['props4',4,.5,.9],['props4',12,.8,.45]],
  tower:[['props4',18,.16,.55],['keep',0,.52,1.5],['props4',0,.84,.42]],
  duel:[['TEAM',0,.24,.82],['H:blackknight',0,.68,.98,1]],
  sphinx:[['props4',10,.22,.45],['props4',4,.5,1.05],['props4',19,.82,.8]],
};
const NIGHT={rest:1,oracle:1,moonshrine:1,bard:1,gate:1,devour:1,hoard:1};
function drawRoomArt(tries){if(!DOM||!R||!R.room)return;const cvs=$('roomArt');if(!cvs||!cvs.getContext)return;const o=R.room,key=o.t==='event'?o.id:o.t,S=SCENES[key];cvs.hidden=!S;if(!S)return;
  const dpr=Math.min(2,window.devicePixelRatio||1),w=Math.round(Math.max(200,cvs.clientWidth)*dpr),h=Math.round(Math.max(60,cvs.clientHeight||cvs.clientWidth/3)*dpr);if(cvs.width!==w||cvs.height!==h){cvs.width=w;cvs.height=h}const g=cvs.getContext('2d');if(!g||!g.createLinearGradient)return;
  const A=actD(R.act),bk=A.obs??R.act,Bk=BACKS[bk]||BACKS[0],night=NIGHT[key],hz=h*.6;
  // sky, a far ridge, the ground
  const sky=g.createLinearGradient(0,0,0,hz);sky.addColorStop(0,night?'#0a0a16':shade(A.sky[0],-.1));sky.addColorStop(1,night?shade(A.sky[0],.05):A.sky[1]);g.fillStyle=sky;g.fillRect(0,0,w,h);
  const gl=g.createRadialGradient(w*.72,hz*.5,0,w*.72,hz*.5,w*.4);gl.addColorStop(0,`rgba(${night?'200,210,255':Bk.glow},${night?.28:.4})`);gl.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gl;g.fillRect(0,0,w,hz);
  if(night){g.fillStyle='rgba(240,240,255,.9)';g.beginPath();g.arc(w*.72,hz*.42,h*.07,0,6.283);g.fill();for(let i=0;i<26;i++){const hx_=(i*97%100)/100*w,hy_=(i*53%100)/100*hz*.8;g.globalAlpha=.3+.5*((i*31%10)/10);g.fillRect(hx_,hy_,dpr,dpr)}g.globalAlpha=1}
  g.fillStyle=night?shade(Bk.a,-.35):Bk.b;g.beginPath();g.moveTo(0,hz);for(let i=0;i<=24;i++){const x=i/24*w;g.lineTo(x,hz-h*(.06+.07*Math.abs(Math.sin(i*1.7+bk))+.04*Math.sin(i*.6)))}g.lineTo(w,hz);g.closePath();g.fill();
  const gr=g.createLinearGradient(0,hz,0,h);gr.addColorStop(0,shade(A.ground[1],night?-.45:-.05));gr.addColorStop(1,shade(A.ground[2],night?-.65:-.35));g.fillStyle=gr;g.fillRect(0,hz-1,w,h-hz+1);
  // the pieces, standing on the ground line
  const base=h*.9;let missing=0;const put=(f,x,s,flip)=>{if(!f){missing++;return}g.fillStyle='rgba(0,0,0,.32)';g.beginPath();g.ellipse(x,base,s*.3,s*.07,0,0,6.283);g.fill();g.save();g.translate(x,base);if(flip)g.scale(-1,1);g.drawImage(f,-s/2,-s*.86,s,s);g.restore()};
  // (on a wide, short picture the pieces keep to the middle instead of spreading thin)
  const sw=Math.min(w,h*3.4),X=p=>w/2+(p-.5)*sw;for(const [sh,cell,px,sz,flip] of S){const s=h*sz;if(sh==='TEAM'){const tm=R.board.concat(R.bench.filter(Boolean)).sort((a,b)=>HEROES[b.k].c*b.star-HEROES[a.k].c*a.star).slice(0,2);tm.forEach((q,i)=>put(frame('h_'+q.k,160,0,s),X(px-.13*i),s*(HEROES[q.k].sz||1),flip))}
    else if(sh[1]===':')put(frame((sh[0]==='H'?'h_':'m_')+sh.slice(2),160,0,s),X(px),s,flip);else put(frame(sh,sh==='keep'?320:192,cell,s),X(px),s,flip)}
  // firelight, and a soft frame
  if(key==='rest'||key==='bard'||key==='smithy'||key==='altar'){g.save();g.globalCompositeOperation='lighter';const fx_=X(key==='rest'?.56:key==='bard'?.72:key==='smithy'?.24:.5),f2=g.createRadialGradient(fx_,base-h*.12,0,fx_,base-h*.12,h*.7);f2.addColorStop(0,'rgba(255,150,50,.5)');f2.addColorStop(1,'rgba(255,120,30,0)');g.fillStyle=f2;g.fillRect(0,0,w,h);g.restore()}
  const vg=g.createRadialGradient(w/2,h*.5,h*.4,w/2,h*.5,w*.62);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.55)');g.fillStyle=vg;g.fillRect(0,0,w,h);
  // sprites still loading: paint again shortly
  if(missing&&(tries||0)<16)setTimeout(()=>{if(R&&R.room===o&&!$('ovRoom').hidden)drawRoomArt((tries||0)+1)},220)}
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
function showRoom(){if(!DOM)return;const V=roomView();if(!V){$('ovRoom').hidden=true;return}$('roomI').innerHTML=V.ic;$('roomT').textContent=V.t;$('roomD').textContent=V.d;const box=$('roomList');box.innerHTML='';box.className=V.shop?'shopgrid':'picks';
  V.opts.forEach((q,i)=>{const b=document.createElement('button');b.type='button';b.className=V.shop&&!q.leave?'ware':'relic';b.style.setProperty('--c',q.risk?'#ff7a5a':q.relic?['','#cfd8e0','#ffcf6a','#e6a8ff','#ff8a6a'][RELIC[q.relic].t]:q.pot?POTIONS[q.pot].col:q.item?'#ffd76a':'#d6a8ff');
    const off=q.dis||q.sold||q.cost>R.gold||q.ok&&!q.ok();b.disabled=!!off;
    const icon=q.item?`<span class="gem it">${ITEMS[q.item].ic}</span>`:q.pot?`<span class="gem pot" style="--p:${POTIONS[q.pot].col}">${POTIONS[q.pot].ic}</span>`:q.relic?`<span class="gem">${RELIC[q.relic].em?TRAITS[RELIC[q.relic].em].ic:RIC[q.relic]||RELIC[q.relic].n[0]}</span>`:'';
    b.innerHTML=`${icon}<b>${q.n}</b>${q.d?`<span>${q.d}</span>`:''}${q.cost?`<em class="price">${q.sold?'Sold':q.cost+' gold'}</em>`:''}`;
    if(q.hero){const p=smallPortrait('h_',q.hero,22);if(p)b.prepend(p)}
    b.addEventListener('click',()=>{if(box.dataset.busy)return;box.dataset.busy=1;roomAct(i);delete box.dataset.busy});box.appendChild(b)});
  $('ovRoom').hidden=false;drawRoomArt()}
function showSpoils(){if(!DOM||!R.spoils)return;const S=R.spoils,N=NODES[S.node]||NODES.battle;$('rwT').textContent=S.node==='boss'?'The boss falls!':S.node==='elite'?'Elite defeated':'Victory';
  $('rwL').innerHTML=S.lines.map(([k,t])=>`<li class="${k}">${t}</li>`).join('')||'';
  const box=$('rwHeroes');box.innerHTML='';S.heroes.forEach((k,i)=>{const D=HEROES[k],b=document.createElement('button');b.type='button';b.className='hc rc';b.style.setProperty('--c',TIERCOL[D.c]);
    b.innerHTML=`<span class="cost">${D.c}g</span><span class="nm"><b>${D.n}</b><small>${D.tr.map(t=>TRAITS[t].ic+' '+TRAITS[t].n).join(' · ')}</small><small class="ab">${D.ab.n}: ${D.d}</small></span>`;const p=portrait(k,38);if(p)b.prepend(p);
    b.addEventListener('click',()=>takeRecruit(i));box.appendChild(b)});
  $('rwSkip').textContent='Skip (+2 gold)';$('ovReward').hidden=false}
function uiPots(){if(!DOM||!R)return;const box=$('pots'),cap=has('sozu')||stage()<1?0:potionCap(),sig=R.potions.join()+'|'+cap+'|'+R.phase;if(box.dataset.sig===sig)return;box.dataset.sig=sig;box.innerHTML='';
  for(let i=0;i<cap;i++){const id=R.potions[i],b=document.createElement('button');b.type='button';b.className='pot'+(id?'':' empty');
    if(id){const P=POTIONS[id];b.style.setProperty('--p',P.col);b.innerHTML=`<i>${P.ic}</i>`;b.title=P.n+': '+P.d;b.classList.toggle('ready',!(P.wave&&R.phase!=='wave')&&!(P.plan&&R.phase!=='plan'));b.addEventListener('click',()=>usePotion(i))}else b.title='Empty potion slot';box.appendChild(b)}}
function bindRooms(){if(!DOM)return;$('rwSkip').addEventListener('click',()=>takeRecruit(-1))}
