#!/usr/bin/env node
// Headless balance simulation: a simple bot plays whole runs (shop, levels, placement, relics) with no browser.
// Every run is seeded, so the same code always gives the same numbers.
//   node tools/sim.js               6 runs, prints a table, fails on crashes or if the bot can't get through the early waves
//   node tools/sim.js --runs 10 --json
const fs = require('fs');
const vm = require('vm');
const { buildFragment } = require('./build.js');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const RUNS = +arg('runs', 6);

const frag = buildFragment();
let src = frag.slice(frag.indexOf('<script>') + 8, frag.lastIndexOf('</script>'));
src = src.replace(/\}\)\(\);\s*$/, `globalThis.G={newRun,get R(){return R},startWave,battleTick,buy,buyXP,reroll,placeHero,canPlace,heroStats,calcTraits,takeRelic,placeStone,sellHero,boardMax,allHeroes,heroAt,HEROES,COLS,ROWS,T,get SYN(){return SYN},XPNEED,flow,rebuildBlk,needMap,mapOptions,chooseNode,resolveEvent,eventOpts,equipFrom,canTake,ITEMS,SPAWN_ROWS,runeAt,portalAt};})();`);
const script = new vm.Script(src, { filename: 'game.js' });
function mulberry(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

function runOnce(seed, opt) {
  const rand = mulberry(seed), math = Object.create(Math); math.random = rand;
  const store = {};
  const ctx = { Math: math, console, JSON, Object, Array, Number, String, Date, Map, Set, Promise, Uint8Array, Int16Array, Float32Array, isFinite, parseInt, parseFloat, Error,
    localStorage: { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } },
    setTimeout: () => 0, clearTimeout: () => 0, performance: { now: () => 0 } };
  ctx.globalThis = ctx; vm.createContext(ctx); script.runInContext(ctx);
  WALL = null; const G = ctx.G; G.newRun({ asc: opt && opt.asc || 0 }); const R = () => G.R;
  const nodes = {}; let kos = 0;
  let err = null, waves = 0;
  try {
    for (let guard = 0; guard < 80 && R().phase !== 'over'; guard++) {
      if (R().phase === 'pick') { const p = R().picks; G.takeRelic(p[(rand() * p.length) | 0]); continue; }
      if (R().event) { botEvent(G); continue; }
      if (G.needMap()) { botMap(G); if (R().event) continue; }
      plan(G, rand, opt);
      nodes[R().node || 'battle'] = (nodes[R().node || 'battle'] || 0) + 1;
      if (!G.startWave()) { err = 'could not start wave ' + R().wave; break; }
      let t = 0, ko = 0; while (R().phase === 'wave' && t < 600) { G.battleTick(1 / 30); t += 1 / 30; if (R().b) ko = R().b.ko; } kos += ko;

      if (R().phase === 'wave') { err = 'wave ' + R().wave + ' never ended'; break; }
      waves = R().wave - 1;
      if (R().endless === false && R().phase === 'over') break;
    }
  } catch (e) { err = e && e.stack ? e.stack.split('\n').slice(0, 3).join(' | ') : String(e); }
  const r = R();
  const items = G.allHeroes().reduce((a, h) => a + (h.it || []).length, 0);
  return { kos, seed, waves: r.phase === 'over' ? r.wave - 1 : waves, win: !!r.win, hp: Math.round(r.hp), lvl: r.lvl, relics: r.relics.length, maze: r.stats.maxMaze, items, elites: r.stats.elites || 0, nodes, stars: G.allHeroes().map((h) => h.k + h.star + ((h.it || []).length ? '[' + h.it.join(',') + ']' : '')).join(' '), err };
}
// ---------- the bot ----------
function plan(G, rand, opt) {
  const R = G.R, H = G.HEROES, w = R.wave;
  const owned = (k, s) => G.allHeroes().filter((h) => h.k === k && h.star === s).length;
  const reserve = w < 4 ? 0 : Math.min(30, w * 3);
  const wantLvl = Math.min(9, 3 + Math.floor(w / 3.2));
  for (let pass = 0; pass < 6; pass++) {
    while (R.lvl < wantLvl && R.gold >= 4 + Math.min(reserve, 10)) G.buyXP();
    // pairs first, then anything that fits on the field
    R.shop.forEach((k, i) => { if (!k) return; const c = H[k].c; if (owned(k, 1) >= 1 && R.gold >= c) G.buy(i); });
    R.shop.forEach((k, i) => { if (!k) return; const c = H[k].c, n = G.allHeroes().length; if (R.gold - c >= reserve && n < G.boardMax() + 3) G.buy(i); });
    if (R.gold > reserve + 12 && w > 6) G.reroll(); else break;
  }
  // bench full: sell the cheapest single
  while (R.bench.every(Boolean)) { const s = R.bench.slice().sort((a, b) => H[a.k].c * a.star - H[b.k].c * b.star)[0]; G.sellHero(s); }
  const val = (h) => H[h.k].c * Math.pow(3, h.star - 1);
  // swap weakest board hero for a stronger bench hero
  for (const b of R.bench.filter(Boolean).sort((a, c) => val(c) - val(a))) {
    if (R.board.length < G.boardMax()) { place(G, b); continue; }
    const weak = R.board.slice().sort((a, c) => val(a) - val(c))[0];
    if (weak && val(b) > val(weak)) { const c = weak.c, r = weak.r; R.board.splice(R.board.indexOf(weak), 1); const j = R.bench.indexOf(b); R.bench[j] = weak; weak.c = weak.r = -1; if (!G.placeHero(b, c, r)) place(G, b); }
  }
  if (!WALL || R.act !== WALL.act) { planWalls(G); if (WALL) WALL.act = R.act; }
  if (w % 3 === 1 || w % 10 === 1) remaze(G);
  botItems(G);
  while (R.stones.length) { const route = R.field.route; const [c, r] = route[(route.length / 2 + (rand() - .5) * 6) | 0] || [5, 3]; let ok = false; for (const [dc, dr] of [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1]]) { if (G.placeStone(0, c + dc, r + dr)) { ok = true; break; } } if (!ok) R.stones.shift(); }
}
// the road monsters would walk if this tile were blocked too (null if that closes it)
function routeWith(G, blk) {
  const d = G.flow(blk); if (!d) return null; const C = G.COLS;
  let r = G.SPAWN_ROWS.filter((q) => d[q * C] >= 0).sort((a, b) => d[a * C] - d[b * C])[0], c = 0; const out = [[c, r]];
  for (let i = 0; i < 200; i++) { const cur = d[r * C + c]; if (cur === 0) break; let nx = null, bd = cur;
    for (const [dc, dr] of [[1, 0], [0, 1], [0, -1], [-1, 0]]) { const nc = c + dc, nr = r + dr; if (nc < 0 || nr < 0 || nc >= C || nr >= G.ROWS) continue; const v = d[nr * C + nc]; if (v >= 0 && v < bd) { bd = v; nx = [nc, nr]; } }
    if (!nx) break; [c, r] = nx; out.push([c, r]); }
  return out;
}
// maze-aware placement: a tile is worth the road it adds (every hero shoots longer) plus how much of the road this hero covers
function place(G, h) {
  const R = G.R, s = G.heroStats(h), melee = s.rng < 2;
  let best = null, bs = -1e9;
  for (let r = 0; r < G.ROWS; r++) for (let c = 0; c < G.COLS; c++) {
    if (!G.canPlace(c, r)) continue;
    const blk = R.field.blk.slice(); blk[r * G.COLS + c] = 1; const route = routeWith(G, blk); if (!route) continue;
    let cov = 0; for (const [rc, rr] of route) { const d = Math.hypot(rc - c, rr - r); if (d <= s.rng + .3) cov += 1 + (G.runeAt(rc, rr) ? 0 : 0); }
    // ranged heroes like runes between them and the road
    let rune = 0; if (!melee) for (const q of R.field.runes) if (Math.hypot(q.c - c, q.r - r) <= s.rng) rune += .8;
    // a planned serpentine: two walls with the gap at opposite ends; single tiles barely lengthen a shortest path, walls do
    const wall = WALL && WALL.has(c + ',' + r) ? WALL.get(c + ',' + r) : 0;
    const score = cov * (melee ? 1.3 : 1) + route.length * .45 + rune + wall + Math.random() * .3;
    if (score > bs) { bs = score; best = [c, r]; }
  }
  if (best) G.placeHero(h, best[0], best[1]);
}
// pick columns where a wall (with one gap at the top or bottom) can actually be built around runes and portals
let WALL = null;
function planWalls(G) { const R = G.R, C = G.COLS, RR = G.ROWS, opts = [];
  for (let c = 3; c <= 10; c++) for (const gap of [0, RR - 1]) { let need = 0, ok = true; for (let r = 0; r < RR; r++) { if (r === gap) continue; const b = R.field.blk[r * C + c]; if (b === 2) continue; if (G.runeAt(c, r) || G.portalAt(c, r)) { ok = false; break; } need++; } if (ok) opts.push({ c, gap, need }); }
  opts.sort((a, b) => a.need - b.need); WALL = new Map(); const first = opts[0]; if (!first) return; const add = (o, v) => { for (let r = 0; r < RR; r++) if (r !== o.gap) WALL.set(o.c + ',' + r, v); };
  add(first, 8); const second = opts.find((o) => Math.abs(o.c - first.c) >= 3 && o.gap !== first.gap); if (second) add(second, 4); }
// every few waves, lift each hero and put it back where the maze is best now
function remaze(G) { const R = G.R; for (const h of R.board.slice()) { const c = h.c, r = h.r; R.board.splice(R.board.indexOf(h), 1); h.c = h.r = -1; G.rebuildBlk(); const j = R.bench.indexOf(null); if (j < 0) { h.c = c; h.r = r; R.board.push(h); G.rebuildBlk(); continue; } R.bench[j] = h; place(G, h); if (!R.board.includes(h)) { R.bench[j] = null; h.c = c; h.r = r; R.board.push(h); G.rebuildBlk(); } } }
function botMap(G) { const R = G.R, o = G.mapOptions(), pref = R.hp < R.hpMax * .5 ? ['camp', 'shrine', 'battle', 'mystery', 'treasure', 'elite'] : ['elite', 'treasure', 'mystery', 'shrine', 'battle', 'camp'];
  const pick = o.slice().sort((a, b) => pref.indexOf(R.map.rows[a.row][a.lane]) - pref.indexOf(R.map.rows[b.row][b.lane]))[0]; G.chooseNode(pick.row, pick.lane); }
function botEvent(G) { const R = G.R, opts = G.eventOpts(); let i = opts.findIndex((o) => !o.ok || o.ok()); if (R.event.id === 'well' && R.hp < 40) i = 1; if (!G.resolveEvent(Math.max(0, i))) G.resolveEvent(opts.length - 1); }
function botItems(G) { const R = G.R, H = G.HEROES, val = (h) => H[h.k].c * Math.pow(3, h.star - 1);
  const carry = R.board.slice().sort((a, b) => (b.wd || 0) - (a.wd || 0) || val(b) - val(a));
  for (let guard = 0; guard < 20 && R.items.length; guard++) { const id = R.items[0], h = carry.find((x) => G.canTake(x, id)); if (!h) break; G.equipFrom(0, h); } }
const results = []; const t0 = Date.now();
const ASCN = +arg('asc', 0);
for (let i = 0; i < RUNS; i++) results.push(runOnce(1000 + i * 7919, { asc: ASCN }));
const secs = ((Date.now() - t0) / 1000).toFixed(1);
const errs = results.filter((r) => r.err), ws = results.map((r) => r.waves).sort((a, b) => a - b);
const avg = ws.reduce((a, b) => a + b, 0) / ws.length, past5 = results.filter((r) => r.waves >= 5).length / results.length;
let md = `### Balance simulation\n${results.length} seeded bot runs in ${secs}s (the bot shops, levels and places heroes next to the road; it plays worse than a person).\n\n| Seed | Waves survived | Won | Keep HP | Level | Relics | Longest road | Items | Heroes |\n|---|---|---|---|---|---|---|---|---|\n`;
for (const r of results) md += `| ${r.seed} | ${r.waves} | ${r.win ? 'yes' : ''} | ${r.hp} | ${r.lvl} | ${r.relics} | ${r.maze} | ${r.items} | ${r.stars} |\n`;
md += `\nAverage ${avg.toFixed(1)} waves, median ${ws[ws.length >> 1]}, best ${ws[ws.length - 1]}. Wins: ${results.filter((r) => r.win).length}/${results.length}. Average road ${(results.reduce((a, r) => a + r.maze, 0) / results.length).toFixed(0)} tiles, knockouts per run ${(results.reduce((a, r) => a + r.kos, 0) / results.length).toFixed(0)}, items held ${(results.reduce((a, r) => a + r.items, 0) / results.length).toFixed(1)}, elite stops cleared ${(results.reduce((a, r) => a + r.elites, 0) / results.length).toFixed(1)}.\n`;
const fails = [];
if (errs.length) fails.push(`${errs.length} run(s) crashed: seed ${errs[0].seed}: ${errs[0].err}`);
if (past5 < .5) fails.push(`only ${(past5 * 100).toFixed(0)}% of runs survived 5 waves (expected at least 50%)`);
md += fails.length ? `\n**Failed:** ${fails.join('; ')}\n` : '\nAll checks passed.\n';
console.log(md);
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, md + '\n');
if (process.argv.includes('--json')) fs.writeFileSync('sim-results.json', JSON.stringify(results, null, 1));
process.exit(fails.length ? 1 : 0);
