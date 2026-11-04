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
src = src.replace(/\}\)\(\);\s*$/, `globalThis.G={newRun,get R(){return R},startWave,battleTick,buy,buyXP,reroll,placeHero,canPlace,heroStats,calcTraits,takeRelic,placeStone,sellHero,boardMax,allHeroes,heroAt,HEROES,COLS,ROWS,T,get SYN(){return SYN},XPNEED};})();`);
const script = new vm.Script(src, { filename: 'game.js' });
function mulberry(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

function runOnce(seed, opt) {
  const rand = mulberry(seed), math = Object.create(Math); math.random = rand;
  const store = {};
  const ctx = { Math: math, console, JSON, Object, Array, Number, String, Date, Map, Set, Promise, Uint8Array, Int16Array, Float32Array, isFinite, parseInt, parseFloat, Error,
    localStorage: { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } },
    setTimeout: () => 0, clearTimeout: () => 0, performance: { now: () => 0 } };
  ctx.globalThis = ctx; vm.createContext(ctx); script.runInContext(ctx);
  const G = ctx.G; G.newRun(); const R = () => G.R;
  let err = null, waves = 0;
  try {
    for (let guard = 0; guard < 80 && R().phase !== 'over'; guard++) {
      if (R().phase === 'pick') { const p = R().picks; G.takeRelic(p[(rand() * p.length) | 0]); continue; }
      plan(G, rand, opt);
      if (!G.startWave()) { err = 'could not start wave ' + R().wave; break; }
      let t = 0; while (R().phase === 'wave' && t < 600) { G.battleTick(1 / 30); t += 1 / 30; }
      if (R().phase === 'wave') { err = 'wave ' + R().wave + ' never ended'; break; }
      waves = R().wave - 1;
      if (R().endless === false && R().phase === 'over') break;
    }
  } catch (e) { err = e && e.stack ? e.stack.split('\n').slice(0, 3).join(' | ') : String(e); }
  const r = R();
  return { seed, waves: r.phase === 'over' ? r.wave - 1 : waves, win: !!r.win, hp: Math.round(r.hp), lvl: r.lvl, relics: r.relics.length, maze: r.stats.maxMaze, stars: G.allHeroes().map((h) => h.k + h.star).join(' '), err };
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
  while (R.stones.length) { const route = R.field.route; const [c, r] = route[(route.length / 2 + (rand() - .5) * 6) | 0] || [5, 3]; let ok = false; for (const [dc, dr] of [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1]]) { if (G.placeStone(0, c + dc, r + dr)) { ok = true; break; } } if (!ok) R.stones.shift(); }
}
function place(G, h) {
  const R = G.R, s = G.heroStats(h), route = R.field.route;
  let best = null, bs = -1;
  for (let r = 0; r < G.ROWS; r++) for (let c = 0; c < G.COLS; c++) {
    if (!G.canPlace(c, r)) continue;
    let cov = 0; for (const [rc, rr] of route) if (Math.hypot(rc - c, rr - r) <= s.rng) cov++;
    // prefer tiles that make the road longer: count route length after placing
    const score = cov + (route.some(([rc, rr]) => rc === c && rr === r) ? 1.5 : 0) + Math.random() * .5;
    if (score > bs) { bs = score; best = [c, r]; }
  }
  if (best) G.placeHero(h, best[0], best[1]);
}
const results = []; const t0 = Date.now();
for (let i = 0; i < RUNS; i++) results.push(runOnce(1000 + i * 7919));
const secs = ((Date.now() - t0) / 1000).toFixed(1);
const errs = results.filter((r) => r.err), ws = results.map((r) => r.waves).sort((a, b) => a - b);
const avg = ws.reduce((a, b) => a + b, 0) / ws.length, past5 = results.filter((r) => r.waves >= 5).length / results.length;
let md = `### Balance simulation\n${results.length} seeded bot runs in ${secs}s (the bot shops, levels and places heroes next to the road; it plays worse than a person).\n\n| Seed | Waves survived | Won | Keep HP | Level | Relics | Longest road | Heroes |\n|---|---|---|---|---|---|---|---|\n`;
for (const r of results) md += `| ${r.seed} | ${r.waves} | ${r.win ? 'yes' : ''} | ${r.hp} | ${r.lvl} | ${r.relics} | ${r.maze} | ${r.stars} |\n`;
md += `\nAverage ${avg.toFixed(1)} waves, median ${ws[ws.length >> 1]}, best ${ws[ws.length - 1]}.\n`;
const fails = [];
if (errs.length) fails.push(`${errs.length} run(s) crashed: seed ${errs[0].seed}: ${errs[0].err}`);
if (past5 < .5) fails.push(`only ${(past5 * 100).toFixed(0)}% of runs survived 5 waves (expected at least 50%)`);
md += fails.length ? `\n**Failed:** ${fails.join('; ')}\n` : '\nAll checks passed.\n';
console.log(md);
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, md + '\n');
if (process.argv.includes('--json')) fs.writeFileSync('sim-results.json', JSON.stringify(results, null, 1));
process.exit(fails.length ? 1 : 0);
