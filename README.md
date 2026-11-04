# Rune Warden

Raise heroes. Twist the road. Hold the keep.

A fantasy roguelite tower defense played in landscape. Monsters pour out of a portal and march on your keep; the heroes you place are the maze. Buy heroes from an auto-battler shop, merge three copies into ★2 and ★3, stack traits, and steer monsters past × runes that multiply your shots or through × portals that split them for gold.

- A hex board in the style of auto-battlers; fielded heroes stand on raised plinths and are the maze.
- 31 heroes and 10 traits (Plaguebringer poison stacks, Beasts that hunt in packs, Bruisers that knock monsters back down the road); monsters fight back and can knock heroes out.
- Monsters come through several gates: the west portal, gates on the top and bottom edges and breaches in the field, changing from wave to wave and shown before each fight. Terrain: high ground, mud, thorns and water.
- Six biomes: every act rolls one of two, each with its own monsters, terrain, props, horizon and boss.
- Items: six components; two on one hero forge one of 21 finished items. They wait in the ITEMS rack beside the bench.
- A Slay the Spire style layer: branching act maps with battles, elites (with affixes), campfires (rest or train veterans), a merchant, treasure chests and 13 events; a free recruit after every fight; potions; boss relics with drawbacks; an oracle's blessing at the start.
- Frontline (⚔) and backline (➶) roles: frontliners tank, slow, taunt, sleep and buff neighbours; backliners deal damage. Range lights up on the hexes while you drag. 5-cost Legends each have a unique power.
- Monsters that hunt heroes, rush the keep or phase out; nine keep guardians unlocked through deeds or gems and trained to level 5; an expanded research tree.
- Three acts, three bosses, an optional brutal final boss (the Rune Devourer: damage cap, regeneration, immune shells, an escalating heartbeat, rune eating and breaches), then endless mode. Ten ascension levels, a seeded daily challenge, hero unlocks and keep skins.

- **Play in the browser / iPhone / PC:** the GitHub Pages site of this repo (on iPhone: Safari → Share → Add to Home Screen).
- **Android:** download the latest `RuneWarden-N.apk` from Releases.

## Building
```
node tools/build.js            # assemble www/index.html from src/
node tools/sim.js --runs 6     # headless balance bot (traits, interest, mazing, rune stones, map rooms, items, potions)
                               # --asc N ascension, --bot simple|pacifist, --fuzz random relic piles,
                               # --god gives the bot a ★3 board with items for the Devourer fight
node tools/browser-check.js    # headless Chromium: errors and frame times (needs playwright)
```
Every push to `main` runs the checks, builds a signed APK (with the `ANDROID_KEYSTORE_B64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS` secrets) and deploys the web version.

## Credits
Heroes, skeletons, keep and nature models by Kay Lousberg (KayKit, CC0); monsters from Quaternius Ultimate Monsters and beasts from Quaternius Ultimate Animated Animals (CC0); the Frost Colossus and Orc Raider from KayKit Mystery Monthly (CC0); biome props from the Kenney Nature Kit (CC0); graveyard props, particles and sound effects by Kenney (CC0); spell sounds from Ninja Adventure by Pixel-boy and AAA (CC0). Music from Generic RPG Pack by Estúdio Vaca Roxa (CC0, see `www/music/CREDITS.txt`).
