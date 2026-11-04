# Rune Warden: notes for working on this repo

- Fantasy roguelite tower defense with an auto-battler shop (landscape). Sibling of Gate Rush (alegandrotah-alt/gate-rush-android) and built the same way.
- Edit the game in `src/`, never `www/index.html` (it's generated). `node tools/build.js` assembles it.
- `src/game/*.js` files are concatenated in name order into one script inside one IIFE (opened in `00-core.js`, closed in `10-loop.js`); they share one scope, so order matters for top-level `const`s.
- Before pushing, run `node tools/build.js && node tools/sim.js --runs 6`; CI also runs `tools/browser-check.js` (set `CHROME_PATH` locally).
- The sim loads the game with no DOM at all: keep DOM-only code behind `DOM` / `$()` null checks so game logic runs headless.
- Sprite sheets in `www/gfx/` are rendered offline from CC0 KayKit / Quaternius / Kenney models: heroes `h_<key>.png` (10 cells of 160: idle 0-3, attack 4-9, facing right), monsters `m_<key>.png` (6 walk cells), `keep.png` and `keep_<colour>.png` skins (320), `props.png` (192 cells), `props2.png` (graveyard/ember props, 160 cells; see `OBS_SETS`/`EDGE_SETS` in `01-data.js`).
- Music in `www/music/` (one track per act plus menu and boss, see CREDITS.txt); sound effects (`sp_*` spell sounds, `m_*` monster hits) and particle textures are embedded from `src/assets/`.
- Gameplay randomness that must repeat in a daily challenge (shops, waves, map, field, relic offers, events) goes through `rng()`/`rndS()`, not `Math.random`.
- Bump the cache name in `www/sw.js` when files in `www/gfx` or `www/music` are renamed or replaced.
- Pushing to `main` releases: Android APK on Releases (version = run number) and the web version on GitHub Pages.
