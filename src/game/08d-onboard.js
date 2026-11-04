// ---------- staged onboarding: systems arrive over the first runs, each with a one-time card ----------
// stage 0: first run (shop, traits, maze, runes, items, recruits, a simple map)
// stage 1: from the second run (events, merchant, potions, the oracle)
// stage 2: after reaching act II or three runs (keep guardians)
function stage(){if(SET.allSys||R&&R.daily)return 3;let s=0;if((META.runs||0)>=1)s=1;if((META.best||0)>=10||(META.runs||0)>=3)s=2;return s}
const TIPS={
  recruit:{icn:'star',t:'Recruits',d:'After every fight you may pick one hero to join you for free. Pick heroes that share traits with your team, or a copy towards a ★2.'},
  elite:{icn:'skull',t:'Elite champions',d:'Elite fights bring champions with a twist: Vampiric, Shielded, Swift, Thorned or Undying. Beat them for an item, gold, a recruit and a relic.'},
  relic:{icn:'gem',t:'Relics',d:'Relics last the whole run. The ◈ button at the top lists yours. Boss relics are the strongest, and most have a price.'},
  rest:{icn:'fire',t:'Campfires',d:'Rest to repair the keep, or train a hero into a veteran: +25% damage and health, up to two ranks. Veterans show chevrons on their plinth.'},
  treasure:{icn:'chest',t:'Treasure',d:'A chest holds gold and a choice of two relics. Rooms without monsters pay base income but no interest, so fights still matter.'},
  potion:{icn:'flask',t:'Potions',d:'Potions sit at the top of the screen. Tap one to drink it. Most work during a wave: freeze everything, burn everything, fill every mana bar.'},
  event:{icn:'question',t:'Unknown rooms',d:'Unknown rooms hold events: a gamble, a bargain, a curse, a gift. Read the price before you choose.'},
  merchant:{icn:'scales',t:'The Merchant',d:'Spend gold on items, potions, relics and training. Gold spent here does not earn interest, so buy what changes your run.'},
  guards:{icn:'shield',t:'Keep guardians',d:'Your keep now fights too. Keep Archers man the walls from the start. Unlock and train more guardians in the Keep tab between runs. Tap the keep in a fight to see them.'},
  hunt:{icn:'swords',t:'Hunters',d:'Some monsters stop to fight any hero in reach. Frontline heroes with lots of health hold them; they also hit back hard.'},
  rush:{icn:'arrow',t:'Runners',d:'Runners ignore your heroes and dash for the keep, dealing double damage if they arrive. Slow them, or kill them before they reach the gate.'},
  boss:{icn:'crown',t:'Act bosses',d:'The last floor of each act is a boss. Beat it for a boss relic, and the keep repairs half of its missing health before the next act.'},
  act:{icn:'flag',t:'A new act',d:'New monsters, a new map and a new field. Rune stones you placed come with you; heroes on tiles that are now blocked go back to the bench.'},
};
let TIPQ=[];
function tip(id){if(!DOM||!TIPS[id])return;META.tips=META.tips||{};if(META.tips[id]||TIPQ.includes(id))return;TIPQ.push(id)}
// cards wait until nothing else is on screen and no wave is running
function tipTick(){if(!DOM||!TIPQ.length||!R||R.phase==='wave'||TUT||typeof location!=='undefined'&&/notips/.test(location.search))return;const busy=['ovStart','ovEnd','ovPause','ovTip'].some(k=>!$(k).hidden);if(busy)return;
  const id=TIPQ.shift();META.tips=META.tips||{};if(META.tips[id])return;META.tips[id]=1;saveMeta();const T_=TIPS[id];
  $('tipI').innerHTML=icon(T_.icn);$('tipT').textContent=T_.t;$('tipD').textContent=T_.d;$('ovTip').hidden=false;sfx('pick',.4)}
function bindTips(){if(!DOM)return;$('tipOk').addEventListener('click',()=>{$('ovTip').hidden=true})}
// what the current state should introduce
function tipWatch(){if(!DOM||!R)return;
  if(R.phase==='reward')tip('recruit');if(R.phase==='pick')tip(R.pickSrc==='boss'?'boss':'relic');if(R.room&&TIPS[R.room.t])tip(R.room.t);
  if(R.potions.length)tip('potion');if(R.guards&&R.guards.length&&R.wave>1)tip('guards');if(R.act>0)tip('act');
  if(R.phase==='plan'&&R.nextQ){if(R.node==='elite'||R.nextQ.some(e=>e.elite))tip('elite');if(R.nextQ.some(e=>MON[e.k].beh==='hunt'))tip('hunt');if(R.nextQ.some(e=>MON[e.k].beh==='rush'))tip('rush');if(R.wave%10===0&&R.wave<=30)tip('boss')}}
