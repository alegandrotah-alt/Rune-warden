# Rune Warden

Raise heroes. Twist the road. Hold the keep.

A fantasy roguelite tower defense played in landscape. Monsters pour out of a portal and march on your keep; the heroes you place are the maze. Buy heroes from an auto-battler shop, merge three copies into ★2 and ★3, stack traits, and steer monsters past × runes that multiply your shots or through × portals that split them for gold.

- 25 heroes and 8 traits (including Plaguebringer poison stacks); monsters fight back and can knock heroes out.
- Items: six components drop from elites and bosses; two on one hero make one of 21 finished items.
- An act map: pick battles, elites, rune shrines, treasure roads, camps or mystery events before every wave.
- Three acts, three bosses, relics every few waves, then endless mode. Ten ascension levels, a seeded daily challenge, hero unlocks and keep skins.

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
