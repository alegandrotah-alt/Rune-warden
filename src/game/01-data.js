// ---------- game data: traits, heroes, monsters, acts, relics, research, achievements ----------
// Traits: every hero has one origin and one class. Breakpoints work like an auto-battler: field more of a trait to power it up.
const TRAITS={
  kingdom:{n:'Kingdom',ic:'♛',col:'#6fb6ff',bp:[2,4,5],d:t=>`Kingdom heroes attack ${[20,45,80][t]}% faster.`},
  wildwood:{n:'Wildwood',ic:'♣',col:'#7ddc6a',bp:[2,4,6],d:t=>`Wildwood hits slow monsters ${[15,25,35][t]}% for 1.5s${t>=2?' and deal +40% damage':''}.`},
  shadow:{n:'Shadow',ic:'☾',col:'#b48cff',bp:[2,4,6],d:t=>`Shadow heroes deal +${[25,60,110][t]}% damage to monsters below half health.`},
  guardian:{n:'Guardian',ic:'⛨',col:'#ffcf6a',bp:[2,4],d:t=>`Every 3rd Guardian hit stuns for ${[.4,.8][t]}s. Monsters next to a Guardian are ${[20,40][t]}% slower.`},
  marksman:{n:'Marksman',ic:'➶',col:'#ff9a5a',bp:[2,4],d:t=>`Marksmen gain +${t+1} range and ${[15,35][t]}% attack speed.`},
  sorcerer:{n:'Sorcerer',ic:'✦',col:'#5fe1ff',bp:[2,4,6],d:t=>`All heroes gain ${[2,5,10][t]} mana per second. Sorcerer spells hit ${[30,70,140][t]}% harder.`},
  assassin:{n:'Assassin',ic:'✕',col:'#ff6a8a',bp:[2,4],d:t=>`Assassins crit ${[20,40][t]}% of the time for ${[2,2.5][t]}× damage.`},
};
const TRAIT_ORDER=Object.keys(TRAITS);
// range in tiles, as = attacks per second, mana = cast threshold. Projectile kinds: melee, arrow, bolt, orb, fire, holy, claw.
const HEROES={
  squire:{n:'Squire',c:1,tr:['kingdom','guardian'],dmg:14,as:.9,rng:1.25,mana:60,dt:'p',proj:'melee',ab:{k:'nova',n:'Shield Bash',r:.9,m:2,stun:1},d:'Bashes everything around his target, stunning them for 1s.'},
  archer:{n:'Archer',c:1,tr:['wildwood','marksman'],dmg:10,as:1,rng:3,mana:70,dt:'p',proj:'arrow',ab:{k:'fan',n:'Volley',shots:5,m:1},d:'Looses a volley of 5 arrows at monsters in range.'},
  apprentice:{n:'Apprentice',c:1,tr:['kingdom','sorcerer'],dmg:9,as:.8,rng:2.75,mana:50,dt:'m',proj:'orb',ab:{k:'nova',n:'Fireball',r:1,m:2.6,burn:1},d:'Hurls a fireball that bursts on a group and leaves them burning.'},
  cutpurse:{n:'Cutpurse',c:1,tr:['shadow','assassin'],dmg:12,as:1.2,rng:1.25,mana:60,dt:'p',proj:'melee',ab:{k:'execute',n:'Pilfer',m:3,gold:1},d:'Stabs the weakest monster in range for triple damage. Kills drop a gold coin.'},
  tinker:{n:'Tinker',c:1,tr:['kingdom','marksman'],dmg:11,as:.9,rng:2.75,mana:80,dt:'p',proj:'bolt',ab:{k:'pierce',n:'Frag Bolt',m:2.2},d:'Fires a bolt that pierces through every monster in a line.'},
  berserker:{n:'Berserker',c:2,tr:['wildwood','guardian'],dmg:22,as:.75,rng:1.25,mana:60,dt:'p',proj:'melee',ab:{k:'nova',n:'Whirlwind',r:1.35,m:2.4,self:1},d:'Spins with his axe, hitting every monster around him.'},
  hexwitch:{n:'Hexwitch',c:2,tr:['shadow','sorcerer'],dmg:10,as:.8,rng:3,mana:60,dt:'m',proj:'orb',ab:{k:'nova',n:'Hex',r:1.2,m:.6,dot:3.5},d:'Curses a group: they rot for a big chunk of damage over 4s.'},
  scout:{n:'Scout',c:2,tr:['wildwood','marksman'],dmg:16,as:.8,rng:3.25,mana:70,dt:'p',proj:'bolt',ab:{k:'trap',n:'Snare',m:1.5,root:2},d:'Sets a snare on the road ahead of a monster. The first ones through are rooted for 2s.'},
  nightblade:{n:'Nightblade',c:2,tr:['shadow','marksman'],dmg:15,as:.95,rng:3,mana:70,dt:'p',proj:'bolt',ab:{k:'chain',n:'Shadow Bolt',n2:4,m:1.8},d:'A bolt that leaps between 4 monsters.'},
  paladin:{n:'Paladin',c:3,tr:['kingdom','guardian'],dmg:30,as:.8,rng:1.35,mana:70,dt:'m',proj:'melee',ab:{k:'nova',n:'Consecrate',r:1.4,m:.7,dot:3,heal:1,self:1},d:'Blesses the ground around him: monsters there burn and the keep heals 1.'},
  druid:{n:'Druid',c:3,tr:['wildwood','sorcerer'],dmg:18,as:.75,rng:3,mana:70,dt:'m',proj:'orb',ab:{k:'nova',n:'Entangle',r:1.5,m:1.6,root:1.6},d:'Roots every monster in a wide circle for 1.6s.'},
  ninja:{n:'Ninja',c:3,tr:['shadow','assassin'],dmg:28,as:1.1,rng:1.35,mana:60,dt:'p',proj:'melee',ab:{k:'fan',n:'Shuriken Storm',shots:6,m:1.3},d:'Throws 6 shuriken at monsters in range.'},
  werewolf:{n:'Werewolf',c:4,tr:['wildwood','assassin'],dmg:40,as:1.1,rng:1.35,mana:80,dt:'p',proj:'claw',ab:{k:'buff',n:'Frenzy',as:2,t:4},d:'Goes into a frenzy, attacking twice as fast for 4s.'},
  tiefling:{n:'Tiefling',c:4,tr:['shadow','sorcerer'],dmg:30,as:.8,rng:3.25,mana:80,dt:'m',proj:'fire',ab:{k:'nova',n:'Hellfire',r:1.6,m:3.4,burn:1},d:'Calls down hellfire on the thickest group.'},
  blackknight:{n:'Black Knight',c:4,tr:['shadow','guardian'],dmg:55,as:.7,rng:1.35,mana:70,dt:'p',proj:'melee',ab:{k:'execute',n:'Doom',m:6,strong:1},d:'Brings his sword down on the strongest monster in range for 6× damage.'},
  templar:{n:'Templar',c:5,tr:['kingdom','sorcerer'],dmg:45,as:.75,rng:3.5,mana:90,dt:'m',proj:'holy',ab:{k:'beam',n:'Judgement',m:4},d:'A column of holy light sweeps the whole row of the board through his target.'},
  vampire:{n:'Vampire Lord',c:5,tr:['shadow','assassin'],dmg:70,as:1,rng:1.5,mana:80,dt:'m',proj:'claw',ab:{k:'nova',n:'Blood Feast',r:1.6,m:2.6,heal:2,self:1},d:'Drains every monster around him. The keep heals 2.'},
  wyrm:{n:'Wyrmling',c:5,tr:['wildwood','sorcerer'],dmg:50,as:.8,rng:3,mana:80,dt:'m',proj:'fire',ab:{k:'cone',n:'Dragonfire',r:2.6,m:3,burn:1},d:'Breathes a cone of fire through everything in front of it.'},
};
const HKEYS=Object.keys(HEROES);
// shop odds per level (tiers 1-5) and copies in the pool
const ODDS=[null,[100,0,0,0,0],[100,0,0,0,0],[75,25,0,0,0],[55,30,15,0,0],[45,33,20,2,0],[30,40,25,5,0],[19,30,40,10,1],[18,25,32,22,3],[10,20,25,35,10],[5,10,20,40,25]];
const POOL=[0,22,20,17,10,9];
const XPNEED=[0,0,2,2,6,10,20,36,48,72,84];// xp to go from level i to i+1
const STARM=[0,1,1.8,3.24];
// monsters: hp in units of the wave base, sp in tiles/s, ar = physical armour, mr = magic resist, w = keep damage on leak
const MON={
  minion:{n:'Skeleton Minion',hp:.7,sp:1.25,ar:0,mr:0,w:1,sz:.85},
  warrior:{n:'Skeleton Warrior',hp:1.3,sp:.9,ar:.3,mr:0,w:2,sz:.95},
  srogue:{n:'Skeleton Rogue',hp:.8,sp:1.6,ar:0,mr:.1,w:1,sz:.85},
  smage:{n:'Skeleton Mage',hp:1,sp:.9,ar:0,mr:.35,w:2,sz:.9,heal:1},
  golem:{n:'Bone Golem',hp:5,sp:.6,ar:.45,mr:.1,w:5,sz:1.35,big:1},
  necro:{n:'The Necromancer',hp:40,sp:.45,ar:.2,mr:.4,w:20,sz:1.7,boss:1,summon:'minion'},
  orc:{n:'Orc Grunt',hp:1.2,sp:1,ar:.15,mr:0,w:2,sz:.95},
  orcskull:{n:'Skullcrusher',hp:2,sp:.85,ar:.45,mr:0,w:3,sz:1.05},
  tribal:{n:'Tribal Runner',hp:.8,sp:1.7,ar:0,mr:0,w:1,sz:.9},
  yeti:{n:'Yeti',hp:5,sp:.6,ar:.2,mr:.3,w:5,sz:1.3,big:1},
  blob:{n:'Gel Blob',hp:1.4,sp:.8,ar:0,mr:.2,w:2,sz:.8,split:2},
  mushking:{n:'The Mushroom King',hp:48,sp:.45,ar:.3,mr:.3,w:20,sz:1.8,boss:1,summon:'blob'},
  demon:{n:'Demon',hp:1.5,sp:1.05,ar:.2,mr:.2,w:2,sz:1},
  bluedemon:{n:'Frost Demon',hp:1.7,sp:.95,ar:.1,mr:.5,w:3,sz:1},
  ghost:{n:'Skull Wraith',hp:.9,sp:1.1,ar:0,mr:.3,w:2,sz:.85,fly:1},
  armabee:{n:'Armabee',hp:1,sp:1.35,ar:.35,mr:0,w:2,sz:.8,fly:1},
  goleling:{n:'Goleling',hp:4.5,sp:.65,ar:.5,mr:.2,w:5,sz:1.2,fly:1,big:1},
  dragon:{n:'The Ember Dragon',hp:60,sp:.5,ar:.3,mr:.4,w:25,sz:2,boss:1,fly:1,summon:'ghost'},
};
// three acts of ten waves; wave 10 of each act is its boss
const ACTS=[
  {n:'Hollow Crypts',roster:['minion','warrior','srogue','smage'],big:'golem',boss:'necro',ground:['#4c5a44','#55634a','#48543f'],edge:'#2a3326',fog:'rgba(120,140,170,.10)',sky:['#1b2333','#3b4a5a']},
  {n:'Wildwood Marches',roster:['orc','orcskull','tribal','blob'],big:'yeti',boss:'mushking',ground:['#4f7a3a','#5a8a42','#4a7036'],edge:'#2c4a22',fog:'rgba(200,230,150,.06)',sky:['#2a4a3a','#7aa86a']},
  {n:'Ember Wastes',roster:['demon','bluedemon','ghost','armabee'],big:'goleling',boss:'dragon',ground:['#6a4a38','#7a5440','#5e4232'],edge:'#3a2418',fog:'rgba(255,120,60,.08)',sky:['#3a1a14','#a84a2a']},
];
// relics: picked like augments, three choices at a time. tier 1 silver, 2 gold, 3 prismatic
const RELICS=[
  {id:'em_kingdom',t:1,n:'Kingdom Crest',d:'Counts as one more Kingdom hero.',em:'kingdom'},
  {id:'em_wildwood',t:1,n:'Wildwood Crest',d:'Counts as one more Wildwood hero.',em:'wildwood'},
  {id:'em_shadow',t:1,n:'Shadow Crest',d:'Counts as one more Shadow hero.',em:'shadow'},
  {id:'em_guardian',t:1,n:'Guardian Crest',d:'Counts as one more Guardian.',em:'guardian'},
  {id:'em_marksman',t:1,n:'Marksman Crest',d:'Counts as one more Marksman.',em:'marksman'},
  {id:'em_sorcerer',t:1,n:'Sorcerer Crest',d:'Counts as one more Sorcerer.',em:'sorcerer'},
  {id:'em_assassin',t:1,n:'Assassin Crest',d:'Counts as one more Assassin.',em:'assassin'},
  {id:'stones',t:1,n:'Rune Pouch',d:'Gain two ×2 Rune Stones. Drop them on empty tiles: anything fired through a rune is multiplied.'},
  {id:'tithe',t:1,n:'Tithe',d:'+2 gold after every wave.'},
  {id:'scholar',t:1,n:'Scholar',d:'+3 XP after every wave.'},
  {id:'haste',t:1,n:'Quicksilver',d:'All heroes attack 15% faster.'},
  {id:'masons',t:1,n:'Master Masons',d:'+20 keep health, and repair the keep to full.'},
  {id:'mire',t:1,n:'Mire',d:'Monsters move 10% slower.'},
  {id:'eagle',t:2,n:'Eagle Eye',d:'All heroes gain +1 range.'},
  {id:'arcana',t:2,n:'Arcane Flow',d:'Heroes gain mana 50% faster.'},
  {id:'runesmith',t:2,n:'Runesmith',d:'Every rune multiplies by 1 more.'},
  {id:'baron',t:2,n:'Portal Baron',d:'Monsters that came through a portal are worth twice the gold.'},
  {id:'richer',t:2,n:'Usury',d:'Interest can go up to 8 gold per wave.'},
  {id:'recruit',t:2,n:'Recruiter',d:'+1 hero on the field.'},
  {id:'cheap',t:2,n:'Haggler',d:'Rerolling the shop costs 1 gold.'},
  {id:'crit',t:2,n:'Keen Edges',d:'Every hero crits 15% of the time for double damage.'},
  {id:'collector',t:2,n:'Collector',d:'Everything deals 6% more for every relic you own. Compounds.'},
  {id:'egg',t:2,n:'Golden Egg',d:'Hatches 6 waves from now into 35 gold.'},
  {id:'reaper',t:2,n:'Reaper',d:'Monsters below 12% health die on the spot (not bosses).'},
  {id:'heart',t:3,n:'Rune Heart',d:'Every rune multiplies by 2 more, and gain a ×3 Rune Stone.'},
  {id:'kingmaker',t:3,n:'Kingmaker',d:'+2 heroes on the field.'},
  {id:'treasury',t:3,n:'Royal Treasury',d:'Gain 45 gold now.'},
  {id:'ascend',t:3,n:'Ascension',d:'Your strongest ★1 hero on the field becomes ★2, and your strongest ★2 becomes ★3.'},
  {id:'riftlord',t:3,n:'Rift Lord',d:'Portals multiply by 1 more and monsters from them are worth triple gold.'},
  {id:'echo',t:3,n:'Echoing Spells',d:'Spells have a 35% chance to cast twice.'},
];
const RELIC={};RELICS.forEach(r=>RELIC[r.id]=r);
// research between runs, paid with gems
const RES=[
  {id:'gold',n:'War Chest',max:3,cost:[30,60,120],d:l=>`Start runs with +${2*l} gold.`},
  {id:'keep',n:'Stone Walls',max:3,cost:[30,60,120],d:l=>`The keep has +${10*l} health.`},
  {id:'xp',n:'Drill Sergeant',max:2,cost:[50,120],d:l=>`+${l} XP after every wave.`},
  {id:'reroll',n:'Market Day',max:1,cost:[80],d:()=>'Your first reroll every wave is free.'},
  {id:'choice',n:'Seer',max:1,cost:[150],d:()=>'Relic picks offer 4 choices.'},
  {id:'stone',n:'Heirloom Rune',max:1,cost:[100],d:()=>'Start every run with a ×2 Rune Stone.'},
  {id:'bench',n:'Barracks',max:1,cost:[90],d:()=>'+1 bench slot.'},
  {id:'interest',n:'Banker',max:1,cost:[140],d:()=>'Interest can go up to 6 gold per wave.'},
];
const RESN={};RES.forEach(r=>RESN[r.id]=r);
// achievements: g = gems. hidden ones show a hint until earned
const ACH=[
  {id:'w5',n:'Holding the Line',d:'Survive 5 waves',g:15},
  {id:'act1',n:'Crypt Breaker',d:'Defeat the Necromancer',g:40},
  {id:'act2',n:'Kingslayer',d:'Defeat the Mushroom King',g:60},
  {id:'win',n:'Rune Warden',d:'Defeat the Ember Dragon and win a run',g:150},
  {id:'star3',n:'Legendary',d:'Get a ★3 hero',g:30},
  {id:'trait6',n:'Full Banner',d:'Activate a trait at its top breakpoint',g:40},
  {id:'lvl9',n:'Warlord',d:'Reach level 9',g:40},
  {id:'gold60',n:'Hoarder',d:'Hold 60 gold at once',g:25},
  {id:'perfect',n:'Unbroken',d:'Clear an act without a single monster reaching the keep',g:80},
  {id:'portal50',n:'Rift Profiteer',d:'Earn 50 gold from portal monsters in one run',g:40},
  {id:'rune9',n:'Runic Resonance',d:'Hit a monster with a shot multiplied ×9 or more by runes',g:40},
  {id:'maze40',n:'Labyrinth',d:'Make monsters walk a path 40 tiles long',g:30},
  {id:'endless40',n:'Beyond the Wastes',d:'Reach wave 40 in endless mode',g:120},
  {id:'all18',n:'Roll Call',d:'Field every hero at least once (across runs)',g:60},
  {id:'h_lone',n:'One Warden',hidden:'One is all it takes.',d:'Clear a wave after wave 5 with a single hero on the field',g:60},
  {id:'h_three',n:'Trinity',hidden:'Three legends at once.',d:'Have three ★3 heroes on the field at once',g:120},
  {id:'h_dragon',n:'Dragonheart',hidden:'Raise a dragon to its full glory.',d:'Get a ★3 Wyrmling',g:150},
  {id:'h_miser',n:'Miser',hidden:'Never spend on luck.',d:'Defeat the Necromancer without rerolling the shop once',g:80},
  {id:'h_maze',n:'Endless Corridor',hidden:'Make the road very, very long.',d:'Make monsters walk a path 70 tiles long',g:100},
];
const ACHN={};ACH.forEach(a=>ACHN[a.id]=a);
