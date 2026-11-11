# Rune Warden

Raise heroes. Twist the road. Hold the keep.

A fantasy roguelite tower defense for phones held either way: sideways, monsters march left to right; upright, they come down from the top to your keep at the bottom. Monsters pour out of a portal and march on your keep; the heroes you place are the maze. Buy heroes from an auto-battler shop, merge three copies into ★2 and ★3, stack traits, and steer monsters past × runes that multiply your shots or through × portals that split them for gold.

- A 16×10 hex board in the style of auto-battlers; fielded heroes stand on raised plinths and are the maze. Portrait and landscape layouts switch as you turn the phone; zoom in and out with the − / + buttons, pinch or double-tap.
- 35 heroes and 10 traits (Plaguebringer poison stacks, Beasts that hunt in packs, Bruisers that knock monsters back down the road); monsters fight back and can knock heroes out.
- Monsters come through several gates: the west portal, gates on the top and bottom edges and breaches in the field, changing from wave to wave and shown before each fight. Terrain: high ground, mud, thorns and water.
- Six biomes: every act rolls one of two, each with its own monsters, terrain, props, horizon and boss. Every boss has a signature move on a timer (Curse, Spore Cloud, Firestorm, Bloom, Deep Freeze, Tailwind), shown on its intro card and in the Bestiary.
- Items: six components; two on one hero forge one of 21 finished items. They wait in the ITEMS rack beside the bench.
- A Slay the Spire style layer: branching act maps with battles, elites (with affixes), campfires (rest or train veterans), a merchant, treasure chests and 13 events; a free recruit after every fight; potions; boss relics with drawbacks; an oracle's blessing at the start.
- Frontline (⚔) and backline (➶) roles: frontliners tank, slow, taunt, sleep and buff neighbours; backliners deal damage. Range lights up on the hexes while you drag. 5-cost Legends each have a unique power.
- Monsters that hunt heroes, rush the keep or phase out; nine keep guardians unlocked through deeds or gems and trained to level 5; an expanded research tree.
- Four wardens to play (the Castellan, Runesmith, Beastlord and Gravewarden), each with a perk, a favoured keep guardian and a power used once per fight.
- Elite champions carry one of ten twists (two in the Rift and in endless); room screens are illustrated with scenes built from the game's sprites, and some events run over several steps.
- Monsters have attack and death animations; big blows freeze the fight for a blink, and bosses telegraph their signature move.
- A run history with a copyable plain-text summary of every run (Records tab and end screen), and an optional frame-rate display.
- Three acts, three bosses, then act IV: the Rift (five floors of void-born monsters and the Rift Herald) leading to an optional brutal final boss (the Rune Devourer: damage cap, regeneration, immune shells, an escalating heartbeat, rune eating and breaches), then endless mode. Ten ascension levels, a seeded daily challenge, hero unlocks and keep skins.

- **Play in the browser / iPhone / PC:** the GitHub Pages site of this repo (on iPhone: Safari → Share → Add to Home Screen).
- **Android:** download the latest `RuneWarden-N.apk` from Releases.

## Building
```
node tools/build.js            # assemble www/index.html from src/
node tools/sim.js --runs 6     # headless balance bot (traits, interest, mazing, rune stones, map rooms, items, potions)
                               # --asc N ascension, --bot simple|pacifist, --fuzz random relic piles,
                               # --god gives the bot a ★3 board with items for the Devourer fight
                               # --warden runesmith|beastlord|gravewarden plays that warden
node tools/browser-check.js    # headless Chromium: errors and frame times (needs playwright)
```
Every push to `main` runs the checks, builds a signed APK (with the `ANDROID_KEYSTORE_B64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS` secrets) and deploys the web version.

## Credits
Heroes, skeletons, keep and nature models by Kay Lousberg (KayKit, CC0); monsters from Quaternius Ultimate Monsters and beasts from Quaternius Ultimate Animated Animals (CC0); the Frost Colossus and Orc Raider from KayKit Mystery Monthly (CC0); biome props from the Kenney Nature Kit (CC0); graveyard props, particles and sound effects by Kenney (CC0); spell sounds from Ninja Adventure by Pixel-boy and AAA (CC0). Music from Generic RPG Pack by Estúdio Vaca Roxa (CC0, see `www/music/CREDITS.txt`).
