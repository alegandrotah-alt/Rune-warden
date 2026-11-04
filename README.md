# Rune Warden

Raise heroes. Twist the road. Hold the keep.

A fantasy roguelite tower defense played in landscape. Monsters pour out of a portal and march on your keep; the heroes you place are the maze. Buy heroes from an auto-battler shop, merge three copies into ★2 and ★3, stack traits, and steer monsters past × runes that multiply your shots or through × portals that split them for gold.

- A hex board in the style of auto-battlers; fielded heroes stand on raised plinths and are the maze.
- 25 heroes and 8 traits (including Plaguebringer poison stacks); monsters fight back and can knock heroes out.
- Items: six components; two on one hero forge one of 21 finished items. They wait in the ITEMS rack beside the bench.
- A Slay the Spire style layer: branching act maps with battles, elites (with affixes), campfires (rest or train veterans), a merchant, treasure chests and 13 events; a free recruit after every fight; potions; boss relics with drawbacks; an oracle's blessing at the start.
- Three acts, three bosses, then endless mode. Ten ascension levels, a seeded daily challenge, hero unlocks and keep skins.

- **Play in the browser / iPhone / PC:** the GitHub Pages site of this repo (on iPhone: Safari → Share → Add to Home Screen).
- **Android:** download the latest `RuneWarden-N.apk` from Releases.

## Building
```
node tools/build.js            # assemble www/index.html from src/
node tools/sim.js --runs 6     # headless balance bot (mazes, picks map stops, equips items); --asc N for ascension
node tools/browser-check.js    # headless Chromium: errors and frame times (needs playwright)
```
Every push to `main` runs the checks, builds a signed APK (with the `ANDROID_KEYSTORE_B64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS` secrets) and deploys the web version.

## Credits
Heroes, skeletons, keep and nature models by Kay Lousberg (KayKit, CC0); monsters from Quaternius Ultimate Monsters (CC0); graveyard props, particles and sound effects by Kenney (CC0); spell sounds from Ninja Adventure by Pixel-boy and AAA (CC0). Music from Generic RPG Pack by Estúdio Vaca Roxa (CC0, see `www/music/CREDITS.txt`).
