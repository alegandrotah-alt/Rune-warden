// ---------- game data: traits, heroes, monsters, acts, relics, research, achievements ----------
// Traits: every hero has one origin and one class. Breakpoints work like an auto-battler: field more of a trait to power it up.
const TRAITS={
  kingdom:{n:'Kingdom',ic:'♛',col:'#6fb6ff',bp:[2,4,6],d:t=>`Kingdom heroes attack ${[20,45,80][t]}% faster.`},
  wildwood:{n:'Wildwood',ic:'♣',col:'#7ddc6a',bp:[2,4,6],d:t=>`Wildwood hits slow monsters ${[15,25,35][t]}% for 1.5s${t>=2?' and deal +40% damage':''}.`},
  shadow:{n:'Shadow',ic:'☾',col:'#b48cff',bp:[2,4,6],d:t=>`Shadow heroes deal +${[25,60,110][t]}% damage to monsters below half health.`},
  guardian:{n:'Guardian',ic:'⛨',col:'#ffcf6a',bp:[2,4],d:t=>`Every 3rd Guardian hit stuns for ${[.4,.8][t]}s. Monsters next to a Guardian are ${[20,40][t]}% slower.`},
  marksman:{n:'Marksman',ic:'➶',col:'#ff9a5a',bp:[2,4],d:t=>`Marksmen gain +${t+1} range and ${[15,35][t]}% attack speed.`},
  sorcerer:{n:'Sorcerer',ic:'✦',col:'#5fe1ff',bp:[2,4,6],d:t=>`All heroes gain ${[2,5,10][t]} mana per second. Sorcerer spells hit ${[30,70,140][t]}% harder.`},
  assassin:{n:'Assassin',ic:'✕',col:'#ff6a8a',bp:[2,4],d:t=>`Assassins crit ${[20,40][t]}% of the time for ${[2,2.5][t]}× damage.`},
  beast:{n:'Beast',ic:'ᛒ',col:'#e0a050',bp:[2,4,6],d:t=>`Beasts deal +${[10,20,35][t]}% damage, plus +${[15,30,45][t]}% for every Beast on a touching hex.${t>=1?` Beast hits heal them ${t>=2?4:2}% health.`:''}`},
  bruiser:{n:'Bruiser',ic:'ᚢ',col:'#ff8a5a',bp:[2,3,4],d:t=>`Bruiser hits knock monsters back ${['a quarter of','half','three quarters of'][t]} a hex (bosses a third as far), and Bruisers have +${[25,50,80][t]}% health.`},
  plague:{n:'Plaguebringer',ic:'☣',col:'#a6e04a',bp:[2,3,4],d:t=>['Plaguebringer hits add a poison stack. Each stack eats 12% of the hero\'s damage every second for 4s (up to 12 stacks).','Poison stacks deal double damage.','Poison stacks deal double damage, and when a poisoned monster dies its stacks jump to monsters nearby.'][t]},
};
const TRAIT_ORDER=['kingdom','wildwood','shadow','plague','beast','guardian','marksman','sorcerer','assassin','bruiser'];
// range in tiles, as = attacks per second, mana = cast threshold. Projectile kinds: melee, arrow, bolt, orb, fire, holy, claw.
const HEROES={
  squire:{n:'Squire',c:1,fl:{k:'rally',n:'Rally',d:'Neighbouring heroes attack 15% faster.'},tr:['kingdom','guardian'],dmg:14,as:.9,rng:1.25,mana:60,dt:'p',proj:'melee',ab:{snd:'sp_slash',k:'nova',n:'Shield Bash',r:.9,m:2,stun:1},d:'Bashes everything around his target, stunning them for 1s.'},
  archer:{n:'Archer',c:1,tr:['wildwood','marksman'],dmg:10,as:1,rng:3,mana:70,dt:'p',proj:'arrow',ab:{snd:'sp_volley',k:'fan',n:'Volley',shots:5,m:1},d:'Looses a volley of 5 arrows at monsters in range.'},
  apprentice:{n:'Apprentice',c:1,tr:['kingdom','sorcerer'],dmg:9,as:.8,rng:2.75,mana:50,dt:'m',proj:'orb',ab:{snd:'sp_fire',k:'nova',n:'Fireball',r:1,m:2.6,burn:1},d:'Hurls a fireball that bursts on a group and leaves them burning.'},
  cutpurse:{n:'Cutpurse',c:1,fl:{k:'hamstring',n:'Hamstring',d:'Attacks slow monsters by 35% for 2s.'},tr:['shadow','assassin'],dmg:12,as:1.2,rng:1.25,mana:60,dt:'p',proj:'melee',ab:{snd:'sp_slash',k:'execute',n:'Pilfer',m:3,gold:1},d:'Stabs the weakest monster in range for triple damage. Kills drop a gold coin.'},
  tinker:{n:'Tinker',c:1,tr:['kingdom','marksman'],dmg:11,as:.9,rng:2.75,mana:80,dt:'p',proj:'bolt',ab:{snd:'sp_volley',k:'pierce',n:'Frag Bolt',m:2.2},d:'Fires a bolt that pierces through every monster in a line.'},
  berserker:{n:'Berserker',c:2,fl:{k:'warcry',n:'War Cry',d:'Neighbouring heroes deal 15% more damage.'},tr:['wildwood','guardian'],dmg:22,as:.75,rng:1.25,mana:60,dt:'p',proj:'melee',ab:{snd:'sp_slash',k:'nova',n:'Whirlwind',r:1.35,m:2.4,self:1},d:'Spins with his axe, hitting every monster around him.'},
  hexwitch:{n:'Hexwitch',c:2,tr:['shadow','sorcerer'],dmg:10,as:.8,rng:3,mana:60,dt:'m',proj:'orb',ab:{snd:'sp_hex',k:'nova',n:'Hex',r:1.2,m:.6,dot:3.5},d:'Curses a group: they rot for a big chunk of damage over 4s.'},
  scout:{n:'Scout',c:2,tr:['wildwood','marksman'],dmg:16,as:.8,rng:3.25,mana:70,dt:'p',proj:'bolt',ab:{snd:'sp_root',k:'trap',n:'Snare',m:1.5,root:2},d:'Sets a snare on the road ahead of a monster. The first ones through are rooted for 2s.'},
  nightblade:{n:'Nightblade',c:2,tr:['shadow','marksman'],dmg:15,as:.95,rng:3,mana:70,dt:'p',proj:'bolt',ab:{snd:'sp_dark',k:'chain',n:'Shadow Bolt',n2:4,m:1.8},d:'A bolt that leaps between 4 monsters.'},
  paladin:{n:'Paladin',c:3,fl:{k:'ward',n:'Holy Ward',d:'Neighbouring heroes take 20% less damage and heal 2% health every second.'},tr:['kingdom','guardian'],dmg:30,as:.8,rng:1.35,mana:70,dt:'m',proj:'melee',ab:{snd:'sp_holy',k:'nova',n:'Consecrate',r:1.4,m:.7,dot:3,heal:1,self:1},d:'Blesses the ground around him: monsters there burn and the keep heals 1.'},
  druid:{n:'Druid',c:3,tr:['wildwood','sorcerer'],dmg:18,as:.75,rng:3,mana:70,dt:'m',proj:'orb',ab:{snd:'sp_root',k:'nova',n:'Entangle',r:1.5,m:1.6,root:1.6},d:'Roots every monster in a wide circle for 1.6s.'},
  ninja:{n:'Ninja',c:3,fl:{k:'sleep',n:'Sleep Dart',d:'Every 4th attack puts the target to sleep for 2.5s. Big hits wake it.'},tr:['shadow','assassin'],dmg:28,as:1.1,rng:1.35,mana:60,dt:'p',proj:'melee',ab:{snd:'sp_volley',k:'fan',n:'Shuriken Storm',shots:6,m:1.3},d:'Throws 6 shuriken at monsters in range.'},
  werewolf:{n:'Werewolf',c:4,fl:{k:'howl',n:'Howl',d:'Neighbouring heroes attack 20% faster.'},tr:['wildwood','assassin'],dmg:40,as:1.1,rng:1.35,mana:80,dt:'p',proj:'claw',ab:{snd:'sp_dark',k:'buff',n:'Frenzy',as:2,t:4},d:'Goes into a frenzy, attacking twice as fast for 4s.'},
  tiefling:{n:'Tiefling',c:4,tr:['shadow','sorcerer'],dmg:30,as:.8,rng:3.25,mana:80,dt:'m',proj:'fire',ab:{snd:'sp_boom',k:'nova',n:'Hellfire',r:1.6,m:3.4,burn:1},d:'Calls down hellfire on the thickest group.'},
  blackknight:{n:'Black Knight',c:4,fl:{k:'dread',n:'Dread',d:'Monsters within 1.5 hexes take 20% more damage from everyone.'},tr:['shadow','guardian'],dmg:55,as:.7,rng:1.35,mana:70,dt:'p',proj:'melee',ab:{snd:'sp_slash',k:'execute',n:'Doom',m:6,strong:1},d:'Brings his sword down on the strongest monster in range for 6× damage.'},
  templar:{n:'Templar',c:5,lg:{n:'Sanctuary',d:'Hexes within 2 of him are holy ground: monsters there lose 3% of their health every second, and heroes there take 25% less damage.'},tr:['kingdom','sorcerer'],dmg:45,as:.75,rng:3.5,mana:90,dt:'m',proj:'holy',ab:{snd:'sp_holy',k:'beam',n:'Judgement',m:4},d:'A column of holy light sweeps the whole row of the board through his target.'},
  vampire:{n:'Vampire Lord',c:5,fl:{k:'thirst',n:'Thirst',d:'Monsters within 1.5 hexes are slowed 25%; he heals 15% of the damage he deals.'},lg:{n:'Dominate',d:'Each Blood Feast also charms the strongest monster in reach (not bosses) for 6s: it turns back towards the portal and fights its own kind.'},tr:['shadow','assassin'],dmg:70,as:1,rng:1.5,mana:80,dt:'m',proj:'claw',ab:{snd:'sp_dark',k:'nova',n:'Blood Feast',r:1.6,m:2.6,heal:2,self:1},d:'Drains every monster around him. The keep heals 2.'},
  wyrm:{n:'Wyrmling',c:5,sz:1.4,lg:{n:'Hoard',d:'Every kill adds a permanent hoard stack (+0.5% damage each, kept all run). At 60 stacks Dragonfire scorches the whole row.'},tr:['wildwood','sorcerer'],dmg:50,as:.8,rng:3,mana:80,dt:'m',proj:'fire',ab:{snd:'sp_breath',k:'cone',n:'Dragonfire',r:2.6,m:3,burn:1},d:'Breathes a cone of fire through everything in front of it.'},
  alchemist:{n:'Alchemist',c:1,tr:['plague','marksman'],dmg:9,as:.85,rng:2.75,mana:60,dt:'m',proj:'flask',ab:{snd:'sp_poison',k:'nova',n:'Acid Flask',r:1,m:.8,psn:3},d:'Throws a flask that splashes a group with 3 poison stacks.'},
  bogwitch:{n:'Bog Witch',c:2,tr:['plague','sorcerer'],dmg:11,as:.8,rng:3,mana:70,dt:'m',proj:'orb',ab:{snd:'sp_poison',k:'nova',n:'Bog Curse',r:1.3,m:.5,psn:4,slow:.35},d:'Curses a group with 4 poison stacks and slows them by 35% for 3s.'},
  duelist:{n:'Duelist',c:2,fl:{k:'taunt',n:'Challenge',d:'Monsters within 1.5 hexes can only attack him, and he parries 30% of their damage.'},tr:['kingdom','assassin'],dmg:20,as:1.1,rng:1.25,mana:50,dt:'p',proj:'melee',ab:{snd:'sp_slash',k:'execute',n:'Riposte',m:3.2,heal:.25},d:'Lunges at the weakest monster in reach for 3.2× damage and recovers 25% health.'},
  plague:{n:'Plague Doctor',c:3,fl:{k:'tend',n:'Tend',d:'Neighbouring heroes heal 3% health every second.'},tr:['plague','guardian'],dmg:22,as:.8,rng:1.6,mana:70,dt:'m',proj:'flask',ab:{snd:'sp_poison',k:'miasma',n:'Miasma',r:1.4,psn:2,t:4,heal:.2},d:'Leaves a cloud of miasma on the road for 4s that poisons monsters every second. Heroes nearby heal 20% health.'},
  frostmage:{n:'Frost Mage',c:3,tr:['kingdom','sorcerer'],dmg:20,as:.75,rng:3,mana:80,dt:'m',proj:'ice',ab:{snd:'sp_ice',k:'nova',n:'Blizzard',r:1.5,m:1.8,stun:.9,slow:.4,ice:1},d:'Freezes every monster in a wide circle for 0.9s, then slows them by 40%.'},
  warlord:{n:'Warlord',c:4,sz:1.1,fl:{k:'bulwark',n:'Bulwark',d:'Neighbouring heroes have 30% more health. Hits stun for 0.5s.'},tr:['wildwood','guardian'],dmg:48,as:.7,rng:1.35,mana:80,dt:'p',proj:'melee',ab:{snd:'m_slam',k:'nova',n:'Earthshatter',r:1.6,m:2.8,stun:1.2,self:1,taunt:4},d:'Slams the ground, stunning everything around him for 1.2s. Monsters attack him first for 4s.'},
  necromancer:{n:'Necromancer',c:4,tr:['plague','sorcerer'],dmg:30,as:.8,rng:3.25,mana:80,dt:'m',proj:'orb',ab:{snd:'sp_hex',k:'pest',n:'Pestilence',r:2,psn:4},d:'Every monster within 2 tiles of the target takes its poison as a burst, then gains 4 more stacks.'},
  alpaca:{sz:.92,n:'Spitting Alpaca',c:1,tr:['beast','marksman'],dmg:9,as:.95,rng:3,mana:60,dt:'p',proj:'orb',ab:{snd:'sp_root',k:'nova',n:'Gob',r:1,m:1.6,slow:.4},d:'Hawks a huge gob at its target: everything it splashes is slowed 40% for 3s.'},
  doe:{sz:.9,n:'Moon Doe',c:2,tr:['beast','sorcerer'],dmg:11,as:.8,rng:2.75,mana:70,dt:'m',proj:'holy',ab:{snd:'sp_holy',k:'nova',n:'Moonlight',r:1.5,m:1.3,mend:.18},d:'Moonlight burns the monsters around her target and heals every hero within 2 hexes of her for 18% of their health.'},
  destrier:{n:'Destrier',c:3,fl:{k:'mount',n:'Cavalry',d:'Neighbouring heroes deal 12% more damage.'},tr:['kingdom','bruiser'],dmg:30,as:.8,rng:1.35,mana:70,dt:'p',proj:'melee',ab:{snd:'m_slam',k:'execute',n:'Rear Kick',m:3,strong:1,kb:1.5,stun:.6},d:'Kicks the strongest monster in reach for 3× damage, stunning it and sending it a hex and a half back.'},
  fenrir:{n:'Fenrir',c:5,sz:1.35,lg:{n:'Blood Moon',d:'Every kill by a Beast makes all Beasts attack 4% faster for the rest of the wave (up to +100%). Fenrir\'s bite makes monsters bleed 2% of their health a second for 4s, and Devour kills outright anything but a boss below 20% health.'},tr:['beast','assassin'],dmg:75,as:1.15,rng:1.5,mana:70,dt:'p',proj:'claw',ab:{snd:'sp_slash',k:'execute',n:'Devour',m:5,heal:.25},d:'Devours the weakest monster in reach for 5× damage and heals a quarter of his health.'},
  wolf:{sz:.88,n:'Grey Wolf',c:1,tr:['beast','assassin'],dmg:13,as:1.15,rng:1.25,mana:60,dt:'p',proj:'claw',ab:{snd:'sp_slash',k:'execute',n:'Pounce',m:2.8},d:'Pounces on the weakest monster in reach for 2.8× damage.'},
  fox:{sz:.88,n:'Ember Fox',c:2,tr:['beast','sorcerer'],dmg:13,as:.85,rng:2.75,mana:60,dt:'m',proj:'fire',ab:{snd:'sp_fire',k:'chain',n:'Foxfire',n2:5,m:1.3},d:'Spits a wisp of foxfire that leaps between 5 monsters.'},
  husky:{sz:.88,n:'Snow Husky',c:2,fl:{k:'coat',n:'Thick Coat',d:'Neighbouring heroes take 12% less damage.'},tr:['beast','bruiser'],dmg:18,as:.85,rng:1.25,mana:60,dt:'p',proj:'claw',ab:{snd:'sp_ice',k:'nova',n:'Snow Plough',r:1.2,m:1.8,kb:1,self:1},d:'Ploughs through everything around it, knocking them back a whole hex.'},
  stag:{n:'Elder Stag',c:3,fl:{k:'antler',n:'Antler Guard',d:'Neighbouring heroes have 20% more health.'},tr:['beast','guardian'],dmg:28,as:.8,rng:1.35,mana:70,dt:'p',proj:'melee',ab:{snd:'m_slam',k:'nova',n:'Stampede',r:1.4,m:2,stun:.8,kb:.8,self:1},d:'Stamps the ground: monsters around it are stunned for 0.8s and thrown back.'},
  orcraider:{n:'Orc Raider',c:3,fl:{k:'bloodrage',n:'Bloodrage',d:'Attacks 6% faster for every monster within 1.5 hexes (up to +48%).'},tr:['shadow','bruiser'],dmg:32,as:.85,rng:1.3,mana:70,dt:'p',proj:'melee',ab:{snd:'sp_slash',k:'nova',n:'Cleave',r:1.3,m:2.6,kb:.6,self:1},d:'Cleaves everything around him and shoves it back down the road.'},
  bull:{n:'War Bull',c:4,sz:.95,fl:{k:'gore',n:'Gore',d:'Every hit knocks its target back half a hex.'},tr:['beast','bruiser'],dmg:52,as:.7,rng:1.35,mana:80,dt:'p',proj:'melee',ab:{snd:'m_slam',k:'execute',n:'Trample',m:4,strong:1,kb:2,stun:1},d:'Tramples the strongest monster in reach for 4× damage, stunning it and hurling it two hexes back.'},
};
const HKEYS=Object.keys(HEROES);
// shop odds per level (tiers 1-5) and copies in the pool
const ODDS=[null,[100,0,0,0,0],[100,0,0,0,0],[75,25,0,0,0],[55,30,15,0,0],[45,33,20,2,0],[30,40,25,5,0],[19,30,40,10,1],[18,25,32,22,3],[10,20,25,35,10],[5,10,20,40,25]];
const POOL=[0,22,20,17,10,9];
const XPNEED=[0,0,2,2,6,10,20,36,48,72,84];// xp to go from level i to i+1
const STARM=[0,1,1.8,3.24];
// monsters: hp in units of the wave base, sp in tiles/s, ar = physical armour, mr = magic resist, w = keep damage on leak
const EPITHET={sporemother:'Queen of the Sunken Bog',colossus:'Warden of Frostpeak Pass',skyking:'Tyrant of the Sunscorch Dunes',necro:'Lord of the Hollow Crypts',mushking:'The Rot-Crowned Sovereign',dragon:'Scourge of the Ember Wastes',devourer:'The Hunger Beneath the World',herald:'Voice of the Devourer'};
const MON={
  minion:{n:'Skeleton Minion',hp:.7,sp:1.25,ar:0,mr:0,w:1,sz:.85,atk:{k:'melee',r:1.45,cd:1.4,m:.4}},
  warrior:{n:'Skeleton Warrior',hp:1.3,sp:.9,ar:.3,mr:0,w:2,sz:.95,atk:{k:'melee',r:1.45,cd:1.3,m:1}},
  srogue:{n:'Skeleton Rogue',beh:'rush',hp:.8,sp:1.6,ar:0,mr:.1,w:2,sz:.85},
  smage:{n:'Skeleton Mage',hp:1,sp:.9,ar:0,mr:.35,w:2,sz:.9,heal:1,atk:{k:'bolt',r:2.4,cd:2.2,m:.9}},
  golem:{n:'Bone Golem',beh:'hunt',hp:5,sp:.6,ar:.45,mr:.1,w:5,sz:1.35,big:1,atk:{k:'slam',r:1.4,cd:2.8,m:2}},
  necro:{n:'The Necromancer',hp:30,sp:.45,ar:.2,mr:.4,w:20,sz:1.7,boss:1,sig:{k:'curse',n:'Curse',d:'every 8s he silences your hardest-hitting hero for 3s'},summon:'minion',atk:{k:'bolt',r:2.8,cd:1.6,m:1.2}},
  orc:{n:'Orc Grunt',hp:1.2,sp:1,ar:.15,mr:0,w:2,sz:.95,atk:{k:'melee',r:1.45,cd:1.3,m:1}},
  orcskull:{n:'Skullcrusher',beh:'hunt',hp:2,sp:.85,ar:.45,mr:0,w:3,sz:1.05,atk:{k:'melee',r:1.45,cd:1.5,m:1.4}},
  tribal:{n:'Tribal Runner',beh:'rush',hp:.8,sp:1.7,ar:0,mr:0,w:2,sz:.9},
  yeti:{n:'Yeti',beh:'hunt',hp:5,sp:.6,ar:.2,mr:.3,w:5,sz:1.3,big:1,atk:{k:'slam',r:1.4,cd:2.8,m:2}},
  blob:{n:'Gel Blob',hp:1.4,sp:.8,ar:0,mr:.2,w:2,sz:.8,split:2},
  mushking:{n:'The Mushroom King',hp:26,sp:.45,ar:.3,mr:.3,w:20,sz:1.8,boss:1,sig:{k:'spores',n:'Spore Cloud',d:'every 9s he heals every monster near him and puts heroes within 2 hexes to sleep for 1.2s'},summon:'blob',atk:{k:'slam',r:1.8,cd:3,m:1.5}},
  demon:{n:'Demon',beh:'hunt',hp:1.3,sp:1.05,ar:.2,mr:.2,w:2,sz:1,atk:{k:'melee',r:1.45,cd:1.2,m:1.2}},
  bluedemon:{n:'Frost Demon',hp:1.4,sp:.95,ar:.1,mr:.4,w:3,sz:1,atk:{k:'bolt',r:2.4,cd:2,m:.9,chill:1}},
  ghost:{n:'Skull Wraith',beh:'phase',hp:.8,sp:1.1,ar:0,mr:.3,w:2,sz:.85,fly:1,atk:{k:'bolt',r:2,cd:2,m:.7}},
  armabee:{n:'Armabee',beh:'rush',hp:.85,sp:1.35,ar:.35,mr:0,w:2,sz:.8,fly:1},
  goleling:{n:'Goleling',hp:4.5,sp:.65,ar:.5,mr:.2,w:5,sz:1.2,fly:1,big:1,atk:{k:'slam',r:1.4,cd:3,m:2}},
  devourer:{n:'The Rune Devourer',hp:240,sp:.17,ar:.35,mr:.35,w:999,sz:2.7,boss:1,final:1,atk:{k:'slam',r:2.3,cd:5,m:1}},
  dragon:{n:'The Ember Dragon',hp:33,sp:.5,ar:.3,mr:.4,w:25,sz:2,boss:1,sig:{k:'firestorm',n:'Firestorm',d:'every 9s fire rains on three of your heroes for a quarter of their health'},fly:1,summon:'ghost',atk:{k:'breath',r:2.6,cd:3.5,m:1.6}},
  pinkblob:{n:'Pink Jelly',hp:.8,sp:1.2,ar:0,mr:.1,w:1,sz:.8,split:2},
  mushnub:{n:'Mushnub',hp:1,sp:.8,ar:.1,mr:.2,w:2,sz:.85,heal:1},
  frog:{n:'Bog Lurker',beh:'hunt',hp:1.3,sp:1,ar:.15,mr:.1,w:2,sz:.95,atk:{k:'melee',r:1.45,cd:1.2,m:1.1}},
  glub:{n:'Glub',beh:'rush',hp:.7,sp:1.3,ar:0,mr:.2,w:2,sz:.8,fly:1},
  spiky:{n:'Thornback',beh:'hunt',hp:5,sp:.55,ar:.55,mr:.1,w:5,sz:1.3,big:1,atk:{k:'slam',r:1.4,cd:2.6,m:1.8}},
  sporemother:{n:'The Spore Mother',hp:30,sp:.45,ar:.25,mr:.35,w:20,sz:1.8,boss:1,sig:{k:'bloom',n:'Bloom',d:'every 10s she grows a shield worth 6% of her health and scatters three Mushnubs'},summon:'mushnub',atk:{k:'bolt',r:2.6,cd:1.8,m:1.1}},
  frostorc:{n:'Frost Raider',beh:'rush',hp:1.1,sp:1.45,ar:.15,mr:0,w:2,sz:.95},
  hywirl:{n:'Hywirl',beh:'phase',hp:1,sp:1,ar:0,mr:.35,w:2,sz:.9,fly:1,atk:{k:'bolt',r:2,cd:2.2,m:.8,chill:1}},
  alpaking:{n:'Alpaking',hp:1.1,sp:1.1,ar:.2,mr:.1,w:2,sz:.85,fly:1},
  iceblob:{n:'Rime Jelly',hp:1.4,sp:.8,ar:.1,mr:.3,w:2,sz:.85,split:2},
  colossus:{n:'The Frost Colossus',beh:'hunt',hp:28,sp:.42,ar:.4,mr:.25,w:20,sz:1.9,boss:1,sig:{k:'freeze',n:'Deep Freeze',d:'every 9s it freezes the two heroes nearest it solid for 2s and chills the rest'},summon:'iceblob',atk:{k:'slam',r:1.9,cd:3,m:1.6,chill:1}},
  cactoro:{n:'Cactoro',beh:'hunt',hp:1.5,sp:.85,ar:.35,mr:.1,w:3,sz:1,atk:{k:'melee',r:1.45,cd:1.3,m:1.2}},
  dino:{n:'Dune Raptor',beh:'rush',hp:1,sp:1.75,ar:.1,mr:0,w:2,sz:.95},
  birb:{n:'Scorch Birb',hp:1.2,sp:1.15,ar:.1,mr:.25,w:2,sz:.9,atk:{k:'bolt',r:2.2,cd:2,m:.9}},
  squidle:{n:'Squidle',beh:'phase',hp:.9,sp:1.15,ar:0,mr:.3,w:2,sz:.85,fly:1},
  brute:{n:'Sand Brute',beh:'hunt',hp:5,sp:.6,ar:.3,mr:.3,w:5,sz:1.35,big:1,atk:{k:'slam',r:1.4,cd:2.6,m:2.1}},
  skyking:{n:'The Sky Tyrant',hp:33,sp:.5,ar:.3,mr:.35,w:25,sz:2,boss:1,sig:{k:'gale',n:'Tailwind',d:'every 9s a gale makes every monster 50% faster for 3s'},fly:1,summon:'squidle',atk:{k:'bolt',r:2.8,cd:1.4,m:1.3}},
  voidling:{n:'Voidling',hp:1.2,sp:.95,ar:.1,mr:.4,w:2,sz:.85,atk:{k:'bolt',r:2.4,cd:2.4,m:.8,hush:.6}},
  riftimp:{n:'Rift Imp',beh:'rush',hp:.9,sp:1.5,ar:.1,mr:.2,w:2,sz:.85,fly:1},
  shade:{n:'Hollow Shade',beh:'hunt',hp:1.6,sp:1,ar:.3,mr:.3,w:3,sz:.95,atk:{k:'melee',r:1.45,cd:1.2,m:1.3,leech:.05}},
  gazer:{n:'Gazer',beh:'phase',hp:1,sp:1.1,ar:0,mr:.45,w:2,sz:.9,fly:1,atk:{k:'bolt',r:2.6,cd:2.2,m:.9,drain:25}},
  maw:{n:'Rift Maw',beh:'hunt',hp:6,sp:.6,ar:.4,mr:.4,w:6,sz:1.35,big:1,atk:{k:'slam',r:1.5,cd:2.6,m:2.2}},
  herald:{n:'The Rift Herald',hp:34,sp:.5,ar:.3,mr:.45,w:25,sz:2.1,boss:1,fly:1,sig:{k:'unravel',n:'Unravel',d:'every 9s it tears a breach open in the field and wraps itself in a shield worth 5% of its health'},summon:'riftimp',atk:{k:'breath',r:2.6,cd:3.2,m:1.7}},
};
// three acts of ten waves; wave 10 of each act is its boss
const ACTS=[
  {n:'Hollow Crypts',roster:['minion','warrior','srogue','smage'],big:'golem',boss:'necro',ter:{water:1,hill:3,mud:2,thorn:2},ground:['#4c5a44','#55634a','#48543f'],edge:'#2a3326',fog:'rgba(120,140,170,.10)',sky:['#1b2333','#3b4a5a']},
  {n:'Wildwood Marches',roster:['orc','orcskull','tribal','blob'],big:'yeti',boss:'mushking',ter:{water:3,hill:3,mud:2,thorn:2},ground:['#4f7a3a','#5a8a42','#4a7036'],edge:'#2c4a22',fog:'rgba(200,230,150,.06)',sky:['#2a4a3a','#7aa86a']},
  {n:'Ember Wastes',roster:['demon','bluedemon','ghost','armabee'],big:'goleling',boss:'dragon',ter:{water:0,hill:4,mud:1,thorn:3},ground:['#6a4a38','#7a5440','#5e4232'],edge:'#3a2418',fog:'rgba(255,120,60,.08)',sky:['#3a1a14','#a84a2a']},
];
// every act has a second biome a run can roll instead: its own field, terrain, monsters and boss
const BIOMES={
  bog:{a:0,n:'Sunken Bog',obs:3,roster:['pinkblob','mushnub','frog','glub'],big:'spiky',boss:'sporemother',ter:{water:4,hill:2,mud:4,thorn:1},ground:['#3e5236','#46603c','#3a4c32'],edge:'#20301e',fog:'rgba(110,170,140,.10)',sky:['#16241f','#3e5c4a']},
  frost:{a:1,n:'Frostpeak Pass',obs:4,roster:['frostorc','hywirl','alpaking','iceblob'],big:'yeti',boss:'colossus',ter:{water:2,hill:4,mud:1,thorn:0},ground:['#aabbcc','#b6c6d6','#a0b2c4'],edge:'#4a5a72',fog:'rgba(220,235,255,.12)',sky:['#25344e','#8aa2c0']},
  dunes:{a:2,n:'Sunscorch Dunes',obs:5,roster:['cactoro','dino','birb','squidle'],big:'brute',boss:'skyking',ter:{water:1,hill:4,mud:0,thorn:3},ground:['#c09a62','#cba46c','#b6925a'],edge:'#6e5028',fog:'rgba(255,215,150,.08)',sky:['#4e3218','#e0a868']},
};
const BIOALT=['bog','frost','dunes'];
// act IV: the Rift, five floors between the last act boss and the Rune Devourer. Its monsters meddle with your heroes.
const RIFTN=5;
const RIFT={n:'The Rift',obs:6,roster:['voidling','riftimp','shade','gazer'],big:'maw',boss:'herald',ter:{water:2,hill:3,mud:1,thorn:3},ground:['#4a3a6a','#56447a','#42345e'],edge:'#1c1430',fog:'rgba(170,110,255,.09)',sky:['#120a22','#5a3a9a']};
// the alternate bosses count as their act's boss for unlocks
const BOSSEQ={sporemother:'necro',colossus:'mushking',skyking:'dragon'};
// relics: picked like augments, three choices at a time. tier 1 silver, 2 gold, 3 prismatic
const RELICS=[
  {id:'em_kingdom',t:1,n:'Kingdom Crest',d:'Counts as one more Kingdom hero.',em:'kingdom'},
  {id:'em_wildwood',t:1,n:'Wildwood Crest',d:'Counts as one more Wildwood hero.',em:'wildwood'},
  {id:'em_shadow',t:1,n:'Shadow Crest',d:'Counts as one more Shadow hero.',em:'shadow'},
  {id:'em_guardian',t:1,n:'Guardian Crest',d:'Counts as one more Guardian.',em:'guardian'},
  {id:'em_marksman',t:1,n:'Marksman Crest',d:'Counts as one more Marksman.',em:'marksman'},
  {id:'em_sorcerer',t:1,n:'Sorcerer Crest',d:'Counts as one more Sorcerer.',em:'sorcerer'},
  {id:'em_assassin',t:1,n:'Assassin Crest',d:'Counts as one more Assassin.',em:'assassin'},
  {id:'em_plague',t:1,n:'Plague Crest',d:'Counts as one more Plaguebringer.',em:'plague'},
  {id:'em_beast',t:1,n:'Beast Crest',d:'Counts as one more Beast.',em:'beast'},
  {id:'em_bruiser',t:1,n:'Bruiser Crest',d:'Counts as one more Bruiser.',em:'bruiser'},
  {id:'quagmire',t:1,n:'Quagmire',d:'Mud slows monsters by 60% instead of 35%.'},
  {id:'bramble',t:1,n:'Bramble Seed',d:'Thorns hurt monsters three times as much.'},
  {id:'surveyor',t:2,n:'Surveyor\'s Level',d:'High ground gives another +1 range to shooters and another +20% damage to melee heroes.'},
  {id:'ram',t:2,n:'Battering Ram',d:'Every knockback also stuns for 0.4s (bosses 0.15s).'},
  {id:'warhorn',t:2,n:'War Horn',d:'Heroes attack 40% faster for the first 6 seconds of every wave.'},
  {id:'wardstone',t:2,n:'Wardstone',d:'Monsters that came through an edge gate or a breach take 20% more damage.'},
  {id:'sealstone',t:3,n:'Sealstone',d:'One fewer gate opens every wave (there is always at least one).'},
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
  {id:'armory',t:1,n:'Armory',d:'Gain two item components now.'},
  {id:'smith',t:2,n:'Master Smith',d:'Gain two random finished items now.'},
  {id:'reaper',t:2,n:'Reaper',d:'Monsters below 12% health die on the spot (not bosses).'},
  {id:'heart',t:3,n:'Rune Heart',d:'Every rune multiplies by 2 more, and gain a ×3 Rune Stone.'},
  {id:'kingmaker',t:3,n:'Kingmaker',d:'+2 heroes on the field.'},
  {id:'treasury',t:3,n:'Royal Treasury',d:'Gain 45 gold now.'},
  {id:'ascend',t:3,n:'Ascension',d:'Your strongest ★1 hero on the field becomes ★2, and your strongest ★2 becomes ★3.'},
  {id:'riftlord',t:3,n:'Rift Lord',d:'Portals multiply by 1 more and monsters from them are worth triple gold.'},
  {id:'echo',t:3,n:'Echoing Spells',d:'Spells have a 35% chance to cast twice.'},
  {id:'belt',t:1,n:'Potion Belt',d:'+1 potion slot, and gain a random potion.'},
  {id:'shovel',t:2,n:'Shovel',d:'At campfires you can also dig for a random relic.'},
  {id:'whetstone',t:1,n:'Whetstone',d:'Your two strongest fielded heroes become veterans.'},
  {id:'membership',t:2,n:'Guild Card',d:'Everything at the merchant costs 30% less.'},
  {id:'toolbox',t:1,n:'Toolbox',d:'Gain an item component after every elite and boss.'},
  {id:'bloodvial',t:1,n:'Blood Vial',d:'The keep repairs 2 health after every fight.'},
  {id:'prayer',t:2,n:'Prayer Wheel',d:'After every normal battle you choose from 4 recruits instead of 3, and they may be one cost higher.'},
  {id:'crown',t:4,n:'Cursed Crown',d:'+1 hero on the field. Rerolling the shop costs 1 more.'},
  {id:'philo',t:4,n:'Philosopher\'s Stone',d:'Heroes deal 30% more damage. Monsters have 20% more health.'},
  {id:'dome',t:4,n:'Runic Dome',d:'Every rune multiplies by 2 more. You can no longer see the coming wave.'},
  {id:'ecto',t:4,n:'Ectoplasm',d:'+1 hero on the field. You earn no interest.'},
  {id:'sozu',t:4,n:'Sozu',d:'+1 hero on the field. You can no longer get potions.'},
  {id:'coffee',t:4,n:'Coffee Dripper',d:'+1 hero on the field. You can no longer rest at campfires.'},
  {id:'fusion',t:4,n:'Fusion Hammer',d:'+1 hero on the field. You can no longer train at campfires.'},
  {id:'astrolabe',t:4,n:'Astrolabe',d:'Three random ★1 heroes you own become ★2.'},
  {id:'pandora',t:4,n:'Pandora\'s Box',d:'Every ★1 hero you own turns into a random hero that costs 1 more.'},
  {id:'calling',t:4,n:'Calling Bell',d:'Gain three random silver relics. The keep loses 15 maximum health.'},
  {id:'tinyhouse',t:4,n:'Tiny House',d:'An item component, a potion, 15 gold, 10 maximum keep health and 5 XP.'},
];
const RELIC={};RELICS.forEach(r=>RELIC[r.id]=r);
// research between runs, paid with gems
const RES=[
  {id:'gold',cat:'Economy',n:'War Chest',max:3,cost:[30,60,120],d:l=>`Start runs with +${2*l} gold.`},
  {id:'interest',cat:'Economy',n:'Banker',max:1,cost:[140],d:()=>'Interest can go up to 6 gold per wave.'},
  {id:'reroll',cat:'Economy',n:'Market Day',max:1,cost:[80],d:()=>'Your first reroll every wave is free.'},
  {id:'merchant',cat:'Economy',n:'Trade Routes',max:2,cost:[60,120],d:l=>`The merchant is ${15*l}% cheaper.`},
  {id:'gems',cat:'Economy',n:'Gem Cutters',max:3,cost:[100,200,350],d:l=>`+${10*l}% gems from runs.`},
  {id:'keep',cat:'Keep',n:'Stone Walls',max:5,cost:[30,60,120,180,260],d:l=>`The keep has +${10*l} health.`},
  {id:'keep2',cat:'Keep',n:'Second Banner',max:1,cost:[220],d:()=>'Station a second keep guardian.'},
  {id:'drill',cat:'Keep',n:'Guardian Drills',max:3,cost:[90,180,300],d:l=>`Keep guardians act ${10*l}% more often.`},
  {id:'hearth',cat:'Keep',n:'Warm Hearth',max:1,cost:[70],d:()=>'Campfires repair 45% of the keep instead of 30%.'},
  {id:'xp',cat:'Heroes',n:'Drill Sergeant',max:2,cost:[50,120],d:l=>`+${l} XP after every wave.`},
  {id:'bench',cat:'Heroes',n:'Barracks',max:1,cost:[90],d:()=>'+1 bench slot.'},
  {id:'vet',cat:'Heroes',n:'Training Grounds',max:1,cost:[80],d:()=>'Your starting hero is a veteran.'},
  {id:'recruit',cat:'Heroes',n:'Recruiter\'s Eye',max:1,cost:[120],d:()=>'Recruit picks after fights offer 4 heroes.'},
  {id:'promo',cat:'Heroes',n:'Field Promotion',max:1,cost:[110],d:()=>'Start runs at level 3.'},
  {id:'choice',cat:'Road',n:'Seer',max:1,cost:[150],d:()=>'Relic picks offer 4 choices.'},
  {id:'stone',cat:'Road',n:'Heirloom Rune',max:1,cost:[100],d:()=>'Start every run with a ×2 Rune Stone.'},
  {id:'potion',cat:'Road',n:'Apothecary',max:2,cost:[60,140],d:l=>l>1?'Start with a potion and carry one more.':'Start every run with a random potion.'},
  {id:'item',cat:'Road',n:'Quartermaster',max:2,cost:[70,150],d:l=>`Start every run with ${l} item component${l>1?'s':''}.`},
  {id:'relic',cat:'Road',n:'Heirloom Trinket',max:1,cost:[180],d:()=>'Start every run with a random silver relic.'},
];
const RESN={};RES.forEach(r=>RESN[r.id]=r);
// achievements: g = gems. hidden ones show a hint until earned
const ACH=[
  {id:'w5',n:'Holding the Line',d:'Survive 5 waves',g:15},
  {id:'act1',n:'Crypt Breaker',d:'Defeat the Necromancer',g:40},
  {id:'act2',n:'Kingslayer',d:'Defeat the Mushroom King',g:60},
  {id:'win',n:'Rune Warden',d:'Defeat the final boss of Act III and win a run',g:150},
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
  {id:'items3',n:'Fully Kitted',d:'Give one hero three finished items',g:30},
  {id:'plague10',n:'Pandemic',d:'Pile 10 poison stacks on one monster',g:30},
  {id:'elite5',n:'Elite Hunter',d:'Clear 5 elite battles in one run',g:40},
  {id:'asc1',n:'Ascendant',d:'Win a run on ascension 1 or higher',g:60},
  {id:'asc5',n:'Unbowed',d:'Win a run on ascension 5 or higher',g:150},
  {id:'asc10',n:'Eternal Warden',d:'Win a run on ascension 10',g:300},
  {id:'daily',n:'Daily Devotion',d:'Finish a daily challenge',g:15},
  {id:'vet2',n:'Drill Master',d:'Train a hero to veteran rank 2',g:25},
  {id:'potion5',n:'Apothecary',d:'Drink 5 potions in one run',g:25},
  {id:'boss4',n:'Collector of Curses',d:'Own two boss relics at once',g:40},
  {id:'nofight',n:'Pacifist Road',d:'Visit four rooms without monsters in one act',g:30},
  {id:'devourer',n:'Devourer\'s Bane',d:'Defeat the Rune Devourer',g:300},
  {id:'gate',n:'Into the Rift',d:'Choose to face the Rune Devourer',g:40},
  {id:'guard5',n:'Master of the Keep',d:'Upgrade a keep guardian to level 5',g:60},
  {id:'charm',n:'Turncoat',d:'Have a charmed monster kill one of its own',g:30},
  {id:'hoard60',n:'Dragon Hoard',d:'Grow a Wyrmling\'s hoard to 60 stacks',g:50},
  {id:'b_bog',n:'Weedkiller',d:'Defeat the Spore Mother',g:50},
  {id:'b_frost',n:'Icebreaker',d:'Defeat the Frost Colossus',g:60},
  {id:'b_dunes',n:'Clipped Wings',d:'Defeat the Sky Tyrant',g:120},
  {id:'gates4',n:'Four Fronts',d:'Clear a wave that came through four gates without a leak',g:50},
  {id:'kb200',n:'Get Back',d:'Knock monsters back 200 times in one run',g:40},
  {id:'hill3',n:'King of the Hill',d:'Have three heroes on high ground at once',g:25},
  {id:'moon',n:'Blood Moon',d:'Bring Fenrir\'s Blood Moon to its full strength',g:60},
  {id:'herald',n:'Silence the Herald',d:'Defeat the Rift Herald',g:80},
  {id:'wardens',n:'Many Hands',d:'Win a run with three different wardens',g:100},
  {id:'twins',n:'Double Trouble',d:'Slay an elite that carries two twists',g:40},
  {id:'h_lone',n:'One Warden',hidden:'One is all it takes.',d:'Clear a wave after wave 5 with a single hero on the field',g:60},
  {id:'h_three',n:'Trinity',hidden:'Three legends at once.',d:'Have three ★3 heroes on the field at once',g:120},
  {id:'h_dragon',n:'Dragonheart',hidden:'Raise a dragon to its full glory.',d:'Get a ★3 Wyrmling',g:150},
  {id:'h_miser',n:'Miser',hidden:'Never spend on luck.',d:'Defeat the Necromancer without rerolling the shop once',g:80},
  {id:'h_maze',n:'Endless Corridor',hidden:'Make the road very, very long.',d:'Make monsters walk a path 70 tiles long',g:100},
];
const ACHN={};ACH.forEach(a=>ACHN[a.id]=a);
// ---------- items: six components, and any two make a finished item ----------
const COMPS=['sword','bow','rod','tear','cloak','belt'];
const ITEMS={
  sword:{n:'Broadsword',ic:'⚔',col:'#ff8a6a',st:{dmg:.15},d:'+15% damage.'},
  bow:{n:'Recurve Bow',ic:'➶',col:'#ffd27a',st:{as:.15},d:'+15% attack speed.'},
  rod:{n:'Arcane Rod',ic:'⚚',col:'#c9a8ff',st:{sp:.2},d:'Spells hit 20% harder.'},
  tear:{n:'Mana Tear',ic:'◆',col:'#7ad0ff',st:{mana:15},d:'Starts each wave with 15 mana.'},
  cloak:{n:'Shadow Cloak',ic:'☾',col:'#ff9ac0',st:{crit:.1},d:'+10% critical chance.'},
  belt:{n:'Giant\'s Belt',ic:'♥',col:'#ff7a6a',st:{hp:.25},d:'+25% health.'},
  deathblade:{n:'Deathblade',c:['sword','sword'],st:{dmg:.45},d:'+45% damage.'},
  runearrow:{n:'Rune Arrows',c:['sword','bow'],st:{dmg:.15,as:.15},d:'Shots are multiplied ×1.5, and every rune they cross multiplies by 1 more.'},
  soulreaver:{n:'Soulreaver',c:['sword','rod'],st:{dmg:.15,sp:.3},d:'Spells hit 30% harder and heal this hero for 30% of the damage they deal.'},
  spear:{n:'Spear of Ages',c:['sword','tear'],st:{dmg:.15,mana:15},d:'Every attack gives 8 extra mana.'},
  edge:{n:'Executioner\'s Edge',c:['sword','cloak'],st:{dmg:.15,crit:.25},d:'+25% critical chance, and crits deal 50% more.'},
  titan:{n:'Titan\'s Resolve',c:['sword','belt'],st:{dmg:.1,hp:.25},d:'Gains 4% damage with every attack this wave, up to +80%.'},
  swift:{n:'Swiftstring',c:['bow','bow'],st:{as:.55},d:'+55% attack speed.'},
  rage:{n:'Rageblade',c:['bow','rod'],st:{as:.15,sp:.15},d:'Gains 4% attack speed with every attack this wave, up to +200%.'},
  storm:{n:'Storm Bow',c:['bow','tear'],st:{as:.15,mana:10},d:'Every third attack sends lightning leaping through 4 monsters for 80% damage.'},
  quiver:{n:'Twin Quiver',c:['bow','cloak'],st:{as:.15,crit:.1},d:'Every attack also strikes a second monster.'},
  mantle:{n:'Ranger\'s Mantle',c:['bow','belt'],st:{as:.2,hp:.25,rng:1},d:'+1 range and +20% attack speed.'},
  archmage:{n:'Archmage Hat',c:['rod','rod'],st:{sp:.75},d:'Spells hit 75% harder.'},
  sigil:{n:'Blue Sigil',c:['rod','tear'],st:{sp:.2,mana:15},d:'After casting, refunds 30 mana.'},
  gauntlet:{n:'Jeweled Gauntlet',c:['rod','cloak'],st:{sp:.2,crit:.2},d:'Spells can crit. +20% critical chance.'},
  censer:{n:'Grim Censer',c:['rod','belt'],st:{sp:.2,hp:.25},d:'Spells add 2 poison stacks to every monster they hit.'},
  chalice:{n:'Seraph\'s Chalice',c:['tear','tear'],st:{mana:40,regen:5},d:'Starts each wave with 40 mana and gains 5 mana per second.'},
  thief:{n:'Thief\'s Purse',c:['tear','cloak'],st:{mana:15,crit:.1},d:'Monsters this hero kills drop 1 gold 40% of the time.'},
  bloom:{n:'Lifebloom',c:['tear','belt'],st:{mana:15,hp:.25},d:'When this hero casts, heroes within 2 tiles heal 25% of their health.'},
  veil:{n:'Void Veil',c:['cloak','cloak'],st:{crit:.2},d:'Damage ignores armour and magic resist.'},
  bramble:{n:'Bramble Vest',c:['cloak','belt'],st:{crit:.1,hp:.6},d:'+60% health. Monsters that hit this hero take twice its damage back.'},
  warmog:{n:'Warmog\'s Plate',c:['belt','belt'],st:{hp:1.2},d:'+120% health, and regenerates 5% health every second.'},
};
const RECIPE={};for(const k in ITEMS){const I=ITEMS[k];if(I.c){RECIPE[I.c.slice().sort().join('+')]=k;I.ic=ITEMS[I.c[0]].ic+ITEMS[I.c[1]].ic;I.col=ITEMS[I.c[0]].col}}
const FINISHED=Object.keys(ITEMS).filter(k=>ITEMS[k].c);
// ---------- the act map: branching roads of rooms, like a dungeon crawl ----------
const NODES={
  battle:{n:'Battle',ic:'⚔',col:'#d8c8a8',fight:1,d:'A wave of monsters. Win for 3 bonus gold and a free recruit.'},
  elite:{n:'Elite',ic:'☠',col:'#ff7a5a',fight:1,d:'A wave with two elite champions. Win for an item, 6 gold, a recruit and a relic.'},
  event:{n:'Unknown',ic:'?',col:'#d6a8ff',d:'Something waits on the road. No monsters, and no interest this floor.'},
  rest:{n:'Campfire',ic:'♨',col:'#ffa64a',d:'Rest to repair the keep, or train a hero into a veteran. No monsters, and no interest this floor.'},
  merchant:{n:'Merchant',ic:'⚖',col:'#7ad0ff',d:'Buy items, potions and relics. No monsters, and no interest this floor.'},
  treasure:{n:'Treasure',ic:'◆',col:'#ffcf2e',d:'A chest: choose a relic. No monsters, and no interest this floor.'},
  boss:{n:'Boss',ic:'♛',col:'#ff5a4a',fight:1,d:'The act boss. Win for a boss relic.'},
};
// potions: one use each, from fights, events and the merchant
const POTIONS={
  fire:{n:'Fire Flask',ic:'✹',col:'#ff7a3a',wave:1,d:'Every monster burns for 20% of its health (bosses 6%).'},
  frost:{n:'Frost Phial',ic:'❄',col:'#8ad8ff',wave:1,d:'Freezes every monster for 3 seconds.'},
  heal:{n:'Healing Draught',ic:'✚',col:'#7ddc6a',d:'Repairs 25 keep health.'},
  rage:{n:'Berserk Brew',ic:'⚡',col:'#ff5a6a',wave:1,d:'Heroes attack 60% faster for 8 seconds.'},
  mana:{n:'Liquid Mana',ic:'✦',col:'#5fa8ff',wave:1,d:'Every hero\'s mana fills up: they all cast at once.'},
  phoenix:{n:'Phoenix Feather',ic:'❦',col:'#ffb04a',wave:1,d:'Knocked-out heroes get back up, and every hero heals 50%.'},
  gold:{n:'Midas Draught',ic:'⛁',col:'#ffcf2e',plan:1,d:'+12 gold.'},
  ink:{n:'Rune Ink',ic:'ᚱ',col:'#9cc4ff',d:'Every rune multiplies by 1 more until the next wave ends.'},
  insight:{n:'Elixir of Insight',ic:'◉',col:'#c9a8ff',plan:1,d:'+6 XP.'},
};
const POTKEYS=Object.keys(POTIONS);
// elite champions come with a twist
const AFFIX={
  vamp:{n:'Vampiric',col:'#ff4a6a',d:'heals when it hits a hero'},
  shield:{n:'Shielded',col:'#e8f0ff',d:'a shield soaks the first 35% of its health'},
  swift:{n:'Swift',col:'#ffe06a',d:'moves 40% faster'},
  thorns:{n:'Thorned',col:'#a6e04a',d:'heroes that hit it take damage back'},
  regen:{n:'Undying',col:'#7dff9a',d:'regenerates 2% health every second'},
  split:{n:'Splitting',col:'#ffb0e0',d:'splits into two lesser copies when it dies'},
  ward:{n:'Warding',col:'#8ad8ff',d:'monsters near it take 25% less damage'},
  molten:{n:'Molten',col:'#ff8a3a',d:'bursts when it dies, burning heroes within 2 hexes'},
  jugg:{n:'Unstoppable',col:'#d8c8a8',d:'cannot be knocked back, stunned, rooted or slowed'},
  hex:{n:'Hexing',col:'#c9a8ff',d:'its hits silence a hero for a second'},
};
const AFFKEYS=Object.keys(AFFIX);
// a twist that fits the monster: ones that need an attack only go to monsters that have one
const pickAff=(k,not)=>rnd(AFFKEYS.filter(a=>a!==not&&!((a==='vamp'||a==='hex')&&!MON[k].atk)&&!(a==='split'&&MON[k].split)));
const affd=(m,a)=>m.aff===a||m.aff2===a;
// ---------- wardens: who you play. Each has a perk, a power to use once per fight and a keep guardian that fights a level higher for them ----------
// (a free extra guardian was tried and was far too strong: the Keep Dragon alone took the bot from 10% wins to 67%)
const WARDENS={
  castellan:{n:'The Castellan',fig:'paladin',col:'#6fb6ff',say:'A soldier of the old guard. Steady walls, steady hands.',perk:'The keep has 10 more health.',pw:{n:'Rally',ic:'flag',d:'Heroes attack 40% faster for 6 seconds.'},g:'banner'},
  runesmith:{n:'The Runesmith',fig:'tinker',col:'#9cc4ff',say:'Reads the old runes like others read weather.',perk:'Start with a ×2 rune stone and get another at every new act.',pw:{n:'Overcharge',ic:'rune',d:'Every rune multiplies by 1 more for 10 seconds.'},g:'oracle',un:{ach:'act1',d:'Defeat an Act I boss'}},
  beastlord:{n:'The Beastlord',fig:'druid',col:'#d99a4a',say:'Raised by the pack, and still runs with it.',perk:'Start with a Grey Wolf. Your Beasts count as one more for the Beast trait.',pw:{n:'Stampede',ic:'paw',d:'Walking monsters are thrown back 2 hexes and stunned for 2 seconds.'},g:'dragon',un:{ach:'act2',d:'Defeat an Act II boss'}},
  gravewarden:{n:'The Gravewarden',fig:'necromancer',col:'#c9a8ff',say:'Keeps a ledger of the dead, and collects.',perk:'Every elite or boss slain repairs 3 keep health. The keep has 10 less health.',pw:{n:'Rise Again',ic:'skull',d:'Knocked-out heroes get back up at half health; the others heal 20%.'},g:'reaper',un:{ach:'win',d:'Win a run'}},
};
const WKEYS=Object.keys(WARDENS);
const wardenOpen=k=>!WARDENS[k].un||!!(META.ach&&META.ach[WARDENS[k].un.ach]);
// the oracle at the gate offers a blessing at the start of a run
const ORACLE={
  gold:{n:'A purse of gold',d:'+15 gold.'},
  comp:{n:'An armourer\'s gift',d:'Two item components.'},
  potion:{n:'An apothecary\'s gift',d:'Two random potions.'},
  relic:{n:'A trinket',d:'A random silver relic.'},
  lvl:{n:'Veterans\' oath',d:'Start at level 3.'},
  stone:{n:'An old rune',d:'A ×3 rune stone.'},
  vet:{n:'A trained recruit',d:'Your starting hero is a veteran (+25% damage and health).'},
  risk:{n:'A blood price',d:'Lose 15 keep health. Gain a random gold relic.',risk:1},
  risk2:{n:'A heavy purse',d:'The keep starts with 20 less health. +30 gold.',risk:1},
};
// ---------- ascension: each level adds its rule to all the ones below it ----------
const ASC=['Monsters have 15% more health.','An extra elite monster every wave from wave 4.','Start runs with 3 less gold.','Monsters move 8% faster.','The keep has 20 less health.','Monsters hit your heroes 30% harder.','Bosses have 35% more health.','Interest is capped at 4 gold.','Monsters have another 15% more health.','Relic picks offer one fewer choice.'];
// heroes you unlock with gems; the others are in the shop from the start
const UNLOCK={duelist:60,frostmage:90,plague:90,warlord:140,necromancer:140};
// keep skins unlocked by achievements
const SKINS=[{id:'blue',n:'Azure Keep',sh:'keep'},{id:'red',n:'Crimson Keep',sh:'keep_red',ach:'act1'},{id:'green',n:'Verdant Keep',sh:'keep_green',ach:'act2'},{id:'yellow',n:'Golden Keep',sh:'keep_yellow',ach:'win'}];
// decorations: obstacles on the field and props along the far edge, per act. [sheet, cell, scale]
const OBS_SETS=[
  [['props2',3,1.12],['props2',0,.9],['props2',1,.95],['props',2,.95],['props2',13,.95],['props2',7,1.1]],
  [['props',0,1.25],['props',1,1.2],['props2',10,.85],['props2',7,1.15],['props',3,.75],['props2',8,.95]],
  [['props2',12,1.05],['props2',13,.95],['props2',11,.85],['props',4,.85],['props2',14,.8],['props',2,.95]],
];
OBS_SETS.push([['props3',0,1.05],['props3',1,1.1],['props3',2,.95],['props3',3,1],['props3',4,.95],['props3',5,1.2]],
  [['props3',6,1.3],['props3',7,1],['props3',8,1.05],['props3',9,1],['props3',10,1.05],['props3',11,1.05]],
  [['props3',12,1.1],['props3',13,.95],['props3',14,1.3],['props3',15,1],['props3',16,1.05],['props3',17,.95]]);
OBS_SETS.push([['props4',16,1.05],['props4',17,1.2],['props4',18,1],['props4',20,.9],['props4',21,1.15],['props4',22,1.2]]);
const EDGE_SETS=[[['props2',4,.8],['props2',5,.55],['props2',6,.6],['props2',0,.7],['props2',1,.75],['props2',7,.9]],[['props2',9,.6],['props2',10,.7],['props',5,.7],['props2',8,.7],['props2',7,.9]],[['props2',11,.7],['props2',12,.8],['props2',13,.8],['props2',14,.65]]];
EDGE_SETS.push([['props3',21,.7],['props3',22,.7],['props3',23,.7],['props3',5,.9],['props3',2,.7]],[['props3',6,.95],['props3',8,.85],['props3',10,.8],['props3',7,.7]],[['props3',18,.9],['props3',19,.8],['props3',20,.6],['props3',13,.7],['props3',14,.95]],[['props4',17,.9],['props4',19,.9],['props4',16,.7],['props4',23,.7],['props4',22,.85],['props4',18,.8]]);
// ---------- keep guardians: they man the keep, unlock through deeds, and level up with gems ----------
// cd = seconds between actions at level 1; p(l) = power multiplier per level
const GUARDS={
  archers:{n:'Keep Archers',ic:'➶',col:'#ffd27a',tr:['marksman'],cd:.75,un:{d:'Always available'},d:l=>`Loose arrows at monsters within 5 hexes of the keep. Count as one more Marksman.`},
  banner:{n:'Royal Standard',ic:'⚑',col:'#6fb6ff',tr:['kingdom','guardian'],cd:0,un:{gems:80,d:'80 gems'},d:l=>`Counts as one more Kingdom and one more Guardian hero. The keep has +${10*l} health.`},
  priestess:{n:'High Priestess',ic:'✚',col:'#7ddc6a',tr:['sorcerer'],cd:9,un:{ach:'act1',d:'Defeat the Necromancer'},d:l=>`Every few seconds heals every hero ${8+2*l}% and the keep ${l}. Once per wave, gets the first knocked-out hero back up. Counts as one more Sorcerer.`},
  trebuchet:{n:'Trebuchet',ic:'☄',col:'#d8a060',tr:[],cd:6,un:{kills:600,d:'Slay 600 monsters'},d:l=>`Hurls a boulder at the biggest group anywhere on the field, stunning them. Its range is the whole field.`},
  sentinel:{n:'Stone Sentinel',ic:'⛨',col:'#b8c2cc',tr:['guardian'],cd:1.2,un:{ach:'perfect',d:'Clear an act without a leak'},d:l=>`Stands at the gate. Monsters that reach the keep must smash it first, and it hits back. Rebuilt every wave. Counts as one more Guardian.`},
  oracle:{n:'Rune Oracle',ic:'ᚱ',col:'#9cc4ff',tr:[],cd:0,un:{ach:'rune9',d:'Hit a ×9 rune shot'},d:l=>`Every rune multiplies by 1 more${l>=3?', and you get a ×2 rune stone at the start of every act':''}.`},
  reaper:{n:'Pale Reaper',ic:'☠',col:'#c9a8ff',tr:['shadow'],cd:3,un:{kills:2500,d:'Slay 2500 monsters'},d:l=>`Strikes the most wounded monster anywhere on the field, and reaps non-bosses below ${10+2*l}% health. Counts as one more Shadow hero.`},
  dragon:{n:'Keep Dragon',ic:'♨',col:'#ff7a3a',tr:['wildwood'],cd:9,un:{boss:['dragon',2],d:'Defeat an Act III boss twice'},d:l=>`Breathes fire down the entire row of the monster closest to the keep. Counts as one more Wildwood hero.`},
  chrono:{n:'Chronomancer',ic:'⧗',col:'#5fe1ff',tr:[],cd:26,un:{elites:60,d:'Slay 60 elite champions'},d:l=>`Stops time for ${(2+.3*l).toFixed(1)}s: monsters freeze while your heroes keep fighting.`},
};
const GKEYS=Object.keys(GUARDS);
const GCOST=[0,40,90,160,260];// gems to reach level 2..5
