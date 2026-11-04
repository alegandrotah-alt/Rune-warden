# Rune Warden: notes for working on this repo

- Fantasy roguelite tower defense with an auto-battler shop (landscape). Sibling of Gate Rush (alegandrotah-alt/gate-rush-android) and built the same way.
- Edit the game in `src/`, never `www/index.html` (it's generated). `node tools/build.js` assembles it.
- `src/game/*.js` files are concatenated in name order into one script inside one IIFE (opened in `00-core.js`, closed in `10-loop.js`); they share one scope, so order matters for top-level `const`s.
- Before pushing, run `node tools/build.js && node tools/sim.js --runs 6`; CI also runs `tools/browser-check.js` (set `CHROME_PATH` locally).
- The sim loads the game with no DOM at all: keep DOM-only code behind `DOM` / `$()` null checks so game logic runs headless.
- Sprite sheets in `www/gfx/` are rendered offline from CC0 KayKit / Quaternius / Kenney models: heroes `h_<key>.png` (10 cells of 160: idle 0-3, attack 4-9, facing right), monsters `m_<key>.png` (6 walk cells), `keep.png` and `keep_<colour>.png` skins (320), `props.png` (192 cells), `props2.png` (graveyard/ember props, 160 cells; see `OBS_SETS`/`EDGE_SETS` in `01-data.js`).
- Music in `www/music/` (one track per act plus menu and boss, see CREDITS.txt); sound effects (`sp_*` spell sounds, `m_*` monster hits) and particle textures are embedded from `src/assets/`.
- The board is pointy-top hexes in offset rows: use `hx(c,r)`/`hy(r)` for centres, `cellOf(x,y)` for the hex under a point, `nbrs(c,r)` for neighbours and `hexPath()` to draw one. Never assume square tiles.
- Run flow: every floor is one auto-battler round. Map rooms (`05b-map.js`) are fights (`NODES[t].fight`: battle, elite, boss) or rooms without monsters (`05c-rooms.js`: rest, merchant, treasure, event, plus the oracle at the start). Phases: plan, wave, reward (recruit pick), pick (relics), room, over; after a fight `R.queue` plays the screens in order via `advance()`. `roomView()` describes a room for both the screen and the sim bot.
- Keep guardians live in `04c-keep.js` (`GUARDS` data in `01-data.js`, `META.gl` levels, `META.geq` stationed); frontline auras are computed in `calcTraits()` into `h.au`, and monster-side zones use `R.b.fl` built every battle tick.
- Onboarding stages (`08d-onboard.js`): stage 0 first run, 1 adds events/merchant/potions/oracle, 2 adds keep guardians; `stage()` gates them and `SET.allSys` turns everything on. The sim always plays with all systems on. Hint cards (`TIPS`) show once each; add `&notips` to the URL in screenshot scripts.
- Icons are drawn (`00b-icons.js`): `icon(name)` gives SVG for the page, `drawIcon()` paints the same art on the canvas; data entries get `.ic` (SVG) and `.icn` (name) from `applyIcons()`. Don't use emoji-prone text symbols for UI icons.
- `saveRun()` only saves a run with `R.live` set (a run the player started); the placeholder run behind the menu must never overwrite a saved run.
- Balance: `node tools/sim.js --runs 80` (strong bot) should land around 10-25% wins with deaths spread over act III; `--bot pacifist` must not clearly beat it; `--fuzz` hands out random relic piles.
- Gameplay randomness that must repeat in a daily challenge (shops, waves, map, field, relic offers, events) goes through `rng()`/`rndS()`, not `Math.random`.
- Bump the cache name in `www/sw.js` when files in `www/gfx` or `www/music` are renamed or replaced.
- Pushing to `main` releases: Android APK on Releases (version = run number) and the web version on GitHub Pages.
