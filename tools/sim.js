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
src = src.replace(/\}\)\(\);\s*$/, `globalThis.G={RELICS,applyRelic,gainPotion,POTKEYS,TRAITS,TRAIT_ORDER,isFront,newRun,get R(){return R},startWave,battleTick,buy,buyXP,reroll,placeHero,canPlace,heroStats,calcTraits,takeRelic,placeStone,sellHero,boardMax,allHeroes,heroAt,HEROES,COLS,ROWS,T,get SYN(){return SYN},XPNEED,flow,rebuildBlk,needMap,mapOptions,chooseNode,roomView,roomAct,takeRecruit,usePotion,POTIONS,equipFrom,canTake,ITEMS,FINISHED,SPAWN_ROWS,terAt,runeAt,portalAt,nbrs,hx,hy};})();`);
const script = new vm.Script(src, { filename: 'game.js' });
function mulberry(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

function runOnce(seed, opt) {
  const rand = mulberry(seed), math = Object.create(Math); math.random = rand;
  const store = { 'runewarden-settings': JSON.stringify({ allSys: opt && opt.stage0 ? false : true }) };
  const ctx = { Math: math, console, JSON, Object, Array, Number, String, Date, Map, Set, Promise, Uint8Array, Int16Array, Float32Array, isFinite, parseInt, parseFloat, Error,
    localStorage: { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } },
    setTimeout: () => 0, clearTimeout: () => 0, performance: { now: () => 0 } };
  ctx.globalThis = ctx; vm.createContext(ctx); script.runInContext(ctx);
  WALL = null; RAND = rand; const G = ctx.G; G.newRun({ asc: opt && opt.asc || 0, oracle: true }); const R = () => G.R;
  const nodes = {}, rooms = {}; let kos = 0;
  // fuzzing: start holding a random pile of relics, boss relics included, plus potions
  if (opt && opt.fuzz) { const R0 = G.R, pool = G.RELICS.map((r) => r.id); for (let i = 0; i < 12; i++) { const id = pool[(rand() * pool.length) | 0]; if (!R0.relics.includes(id)) { R0.relics.push(id); G.applyRelic(id); } } for (const p of G.POTKEYS) G.gainPotion(p); }
  let err = null, waves = 0;
  try {
    for (let guard = 0; guard < 400 && R().phase !== 'over'; guard++) {
      if (R().phase === 'pick') { const p = R().picks; G.takeRelic(p[(rand() * p.length) | 0]); continue; }
      if (R().phase === 'room') { botRoom(G, rand); rooms[R().room ? R().room.t : 'x'] = 1; continue; }
      if (R().phase === 'reward') { botRecruit(G); continue; }
      if (G.needMap()) { botMap(G); continue; }
      plan(G, rand, opt);
      if (GOD && R().final && !R().godDone) { R().godDone = 1; for (const h of R().board) { h.star = 3; h.it = [G.FINISHED[(rand() * G.FINISHED.length) | 0], G.FINISHED[(rand() * G.FINISHED.length) | 0], G.FINISHED[(rand() * G.FINISHED.length) | 0]]; } G.calcTraits(); }
      nodes[R().node || 'battle'] = (nodes[R().node || 'battle'] || 0) + 1;
      if (!G.startWave()) { err = 'could not start wave ' + R().wave; break; }
      let t = 0, ko = 0; while (R().phase === 'wave' && t < 600) { G.battleTick(1 / 30); t += 1 / 30; if (R().b) { ko = R().b.ko; botPotion(G, t); } } kos += ko;

      if (R().phase === 'wave') { err = 'wave ' + R().wave + ' never ended'; break; }
      waves = R().wave - 1;
      { const r = R(); if (!Number.isFinite(r.gold) || !Number.isFinite(r.hp) || r.board.some((h) => { const st = G.heroStats(h); return !Number.isFinite(st.dmg) || !Number.isFinite(st.as) || !Number.isFinite(st.rng); })) { err = 'non-finite state after floor ' + waves + ' (gold ' + r.gold + ', hp ' + r.hp + ')'; break; } }
      if (R().endless === false && R().phase === 'over') break;
    }
  } catch (e) { err = e && e.stack ? e.stack.split('\n').slice(0, 3).join(' | ') : String(e); }
  const r = R();
  if (!err && r.phase !== 'over') err = `stalled on floor ${r.wave} in phase ${r.phase}${r.room ? ' (' + r.room.t + ')' : ''}`;
  const items = G.allHeroes().reduce((a, h) => a + (h.it || []).length, 0);
  return { rooms: Object.keys(rooms).length, pots: r.stats.pots || 0, kos, seed, waves: r.phase === 'over' ? r.wave - 1 : waves, win: !!r.win, tw: !!r.trueWin, fin: !!r.final, devHp: r.devHp, hp: Math.round(r.hp), lvl: r.lvl, relics: r.relics.length, maze: r.stats.maxMaze, items, elites: r.stats.elites || 0, nodes, stars: G.allHeroes().map((h) => h.k + h.star + ((h.it || []).length ? '[' + h.it.join(',') + ']' : '')).join(' '), err };
}
// ---------- the bot ----------
// traits the bot builds towards: the two it already has the most different heroes in
function focus(G) { const cnt = {}; const seen = new Set(); for (const h of G.allHeroes()) { if (seen.has(h.k)) continue; seen.add(h.k); for (const t of G.HEROES[h.k].tr) cnt[t] = (cnt[t] || 0) + 1 + G.HEROES[h.k].c * .2; }
  return Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a]).slice(0, 2); }
function heroScore(G, h, F) { const H = G.HEROES, D = H[h.k]; return D.c * Math.pow(3, h.star - 1) * (1 + .25 * (h.vet || 0)) * (1 + .35 * D.tr.filter((t) => F.includes(t)).length) * (1 + .3 * (h.it || []).length); }
function plan(G, rand, opt) {
  const R = G.R, H = G.HEROES, w = R.wave, F = focus(G), STRONG = !opt || opt.bot !== 'simple';
  const owned = (k, s) => G.allHeroes().filter((h) => h.k === k && h.star === s).length;
  // TFT-style gold: build to 50 for full interest once the early floors are over, level on a schedule
  const reserve = !STRONG ? (w < 4 ? 0 : Math.min(30, w * 3)) : w < 5 ? 0 : w < 9 ? 20 : 50;
  const sched = [0, 3, 3, 4, 4, 5, 5, 5, 6, 6, 6, 7, 7, 7, 7, 8, 8, 8, 8, 8, 8, 9, 9, 9, 9, 9, 10, 10, 10, 10, 10, 10];
  const wantLvl = STRONG ? sched[Math.min(w, sched.length - 1)] : Math.min(9, 3 + Math.floor(w / 3.2));
  const wants = (k) => owned(k, 1) >= 1 || owned(k, 2) >= 1 && owned(k, 1) >= 0 && H[k].c <= 3 || H[k].tr.some((t) => F.includes(t));
  for (let pass = 0; pass < 8; pass++) {
    while (R.lvl < wantLvl && R.gold >= 4 + Math.min(reserve, 10)) G.buyXP();
    R.shop.forEach((k, i) => { if (!k) return; const c = H[k].c; if (owned(k, 1) >= 1 && R.gold >= c) G.buy(i); });
    R.shop.forEach((k, i) => { if (!k) return; const c = H[k].c, n = G.allHeroes().length; if (R.gold - c >= reserve && n < G.boardMax() + 3 && (!STRONG || wants(k) || n < G.boardMax())) G.buy(i); });
    // roll down for upgrades once levelled, keeping the interest reserve
    if (R.gold > reserve + (STRONG ? 4 : 12) && w > (STRONG ? 4 : 6) && (!STRONG || R.lvl >= wantLvl)) G.reroll(); else break;
  }
  // bench full: sell the least useful single copy
  while (R.bench.every(Boolean)) { const s = R.bench.slice().sort((a, b) => heroScore(G, a, F) - heroScore(G, b, F))[0]; G.sellHero(s); }
  // field the best heroes: value, stars, focus traits and items
  for (const b of R.bench.filter(Boolean).sort((a, c) => heroScore(G, c, F) - heroScore(G, a, F))) {
    if (R.board.length < G.boardMax()) { place(G, b); continue; }
    const weak = R.board.slice().sort((a, c) => heroScore(G, a, F) - heroScore(G, c, F))[0];
    if (weak && heroScore(G, b, F) > heroScore(G, weak, F) * 1.1) { const c = weak.c, r = weak.r; R.board.splice(R.board.indexOf(weak), 1); const j = R.bench.indexOf(b); R.bench[j] = weak; weak.c = weak.r = -1; if (!G.placeHero(b, c, r)) place(G, b); }
  }
  R.potions.forEach((id, i) => { if (G.POTIONS[id].plan) G.usePotion(i); });
  if (!WALL || R.act !== WALL.act) { planWalls(G); if (WALL) WALL.act = R.act; }
  if (w % 3 === 1 || w % 10 === 1) remaze(G);
  botItems(G);
  while (R.stones.length) { const at = STRONG ? bestStone(G) : null; let ok = false;
    if (at) ok = G.placeStone(0, at[0], at[1]);
    if (!ok) { const route = R.field.route; const [c, r] = route[(route.length / 2 + (rand() - .5) * 6) | 0] || [6, 4]; for (const [dc, dr] of [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1]]) { if (G.placeStone(0, c + dc, r + dr)) { ok = true; break; } } }
    if (!ok) R.stones.shift(); }
}
// a rune stone is best where the most backline shots cross it on their way to the road
function bestStone(G) { const R = G.R, T = G.T, route = [].concat(...(R.field.routes || [R.field.route || []])), shooters = R.board.filter((h) => !G.isFront(h.k)); let best = null, bs = 0;
  for (let r = 0; r < G.ROWS; r++) for (let c = 0; c < G.COLS; c++) { if (R.field.blk[r * G.COLS + c] || G.runeAt(c, r) || G.portalAt(c, r)) continue; const px = G.hx(c, r), py = G.hy(r); let sc = 0;
    for (const h of shooters) { const hx = G.hx(h.c, h.r), hy = G.hy(h.r), rng = G.heroStats(h).rng * T;
      for (const [rc, rr] of route) { const tx = G.hx(rc, rr), ty = G.hy(rr), L = Math.hypot(tx - hx, ty - hy); if (L > rng || L < T) continue; const u = ((px - hx) * (tx - hx) + (py - hy) * (ty - hy)) / (L * L); if (u <= 0 || u >= 1) continue; const d = Math.hypot(hx + (tx - hx) * u - px, hy + (ty - hy) * u - py); if (d < T * .45) sc += G.HEROES[h.k].c; } }
    if (sc > bs) { bs = sc; best = [c, r]; } }
  return best; }
// the roads monsters would walk from every gate if this tile were blocked too (null if that closes one)
function routeWith(G, blk) {
  const d = G.flow(blk); if (!d) return null; const C = G.COLS, out = [];
  for (const g of G.R.field.gates || [{ k: 'west' }]) {
    let c, r; if (g.k === 'west') { r = G.SPAWN_ROWS.filter((q) => d[q * C] >= 0).sort((a, b) => d[a * C] - d[b * C])[0]; c = 0; } else { c = g.c; r = g.r; }
    const rt = [[c, r]];
    for (let i = 0; i < 200; i++) { const cur = d[r * C + c]; if (cur === 0) break; let nx = null, bd = cur;
      for (const [nc, nr] of G.nbrs(c, r)) { const v = d[nr * C + nc]; if (v >= 0 && v < bd) { bd = v; nx = [nc, nr]; } }
      if (!nx) break; [c, r] = nx; rt.push([c, r]); }
    out.push(rt); }
  return out;
}
// maze-aware placement: a tile is worth the road it adds (every hero shoots longer) plus how much of the road this hero covers
function place(G, h) {
  const R = G.R, s = G.heroStats(h), melee = s.rng < 2;
  let best = null, bs = -1e9;
  for (let r = 0; r < G.ROWS; r++) for (let c = 0; c < G.COLS; c++) {
    if (!G.canPlace(c, r)) continue;
    const blk = R.field.blk.slice(); blk[r * G.COLS + c] = 1; const routes = routeWith(G, blk); if (!routes) continue;
    const dist = (c1, r1, c2, r2) => Math.hypot(G.hx(c1, r1) - G.hx(c2, r2), G.hy(r1) - G.hy(r2)) / G.T;
    const hill = G.terAt(c, r) === 1, rng = s.rng + (hill && !melee ? 1 : 0), seen = new Set(), route = [];
    for (const rt of routes) for (const q of rt) { const k = q[0] + ',' + q[1]; if (!seen.has(k)) { seen.add(k); route.push(q); } }
    let cov = 0; for (const [rc, rr] of route) { if (dist(rc, rr, c, r) <= rng + .3) cov += 1; }
    const shortest = Math.min(...routes.map((rt) => rt.length));
    // ranged heroes like runes between them and the road
    let rune = 0; if (!melee) for (const q of R.field.runes) if (dist(q.c, q.r, c, r) <= s.rng) rune += .8;
    // a planned serpentine: two walls with the gap at opposite ends; single tiles barely lengthen a shortest path, walls do
    const wall = WALL && WALL.has(c + ',' + r) ? WALL.get(c + ',' + r) : 0;
    // portals multiply the wave: worth it early for gold, dangerous later
    let por = 0; for (const [rc, rr] of route) { const p = G.portalAt(rc, rr); if (p) por += (p.v - 1) * (R.act >= 1 ? 3 : -1); }
    const score = cov * (melee ? 1.3 : 1) + shortest * .45 + rune + wall - por + (hill ? (melee ? .8 : 1.5) : 0) + RAND() * .3;
    if (score > bs) { bs = score; best = [c, r]; }
  }
  if (best) G.placeHero(h, best[0], best[1]);
}
// pick columns where a wall (with one gap at the top or bottom) can actually be built around runes and portals
let WALL = null, RAND = Math.random, BOTKIND = 'strong';
function planWalls(G) { const R = G.R, C = G.COLS, RR = G.ROWS, opts = [];
  for (let c = 3; c <= C - 4; c++) for (const gap of [0, RR - 1]) { let need = 0, ok = true; for (let r = 0; r < RR; r++) { if (r === gap) continue; const b = R.field.blk[r * C + c]; if (b === 2) continue; if (G.runeAt(c, r) || G.portalAt(c, r)) { ok = false; break; } need++; } if (ok) opts.push({ c, gap, need }); }
  opts.sort((a, b) => a.need - b.need); WALL = new Map(); const first = opts[0]; if (!first) return; const add = (o, v) => { for (let r = 0; r < RR; r++) if (r !== o.gap) WALL.set(o.c + ',' + r, v); };
  add(first, 8); const second = opts.find((o) => Math.abs(o.c - first.c) >= 3 && o.gap !== first.gap); if (second) add(second, 4); }
// every few waves, lift each hero and put it back where the maze is best now
function remaze(G) { const R = G.R; for (const h of R.board.slice()) { const c = h.c, r = h.r; R.board.splice(R.board.indexOf(h), 1); h.c = h.r = -1; G.rebuildBlk(); const j = R.bench.indexOf(null); if (j < 0) { h.c = c; h.r = r; R.board.push(h); G.rebuildBlk(); continue; } R.bench[j] = h; place(G, h); if (!R.board.includes(h)) { R.bench[j] = null; h.c = c; h.r = r; R.board.push(h); G.rebuildBlk(); } } }
function botMap(G) { const R = G.R, o = G.mapOptions(), weak = R.hp < R.hpMax * .5, early = R.wave % 10 < 4, pref = BOTKIND === 'pacifist' ? ['treasure', 'rest', 'merchant', 'event', 'battle', 'elite', 'boss'] : weak ? ['rest', 'treasure', 'merchant', 'event', 'battle', 'elite', 'boss'] : early ? ['battle', 'treasure', 'event', 'elite', 'merchant', 'rest', 'boss'] : ['elite', 'treasure', 'battle', 'rest', 'merchant', 'event', 'boss'];
  const pick = o.slice().sort((a, b) => pref.indexOf(a.t) - pref.indexOf(b.t))[0]; G.chooseNode(pick.f, pick.l); }
// rooms: take the first thing that is allowed and affordable; at the merchant buy what helps, then leave
function botRoom(G, rand) { const R = G.R, V = G.roomView(); if (!V) return; const ok = V.opts.map((q, i) => ({ q, i })).filter(({ q }) => !q.dis && !q.sold && !(q.cost > R.gold) && !(q.ok && !q.ok()));
  if (R.room.t === 'rest' && !R.room.step) { const i = R.hp < R.hpMax * .7 ? 0 : 1; if (G.roomAct(i)) return; const mv = V.opts.findIndex((q) => q.leave); if (mv >= 0 && G.roomAct(mv)) return; }
  if (V.shop) { const buy = ok.find(({ q }) => q.cost && (q.item || q.pot || q.relic) && R.gold - q.cost >= 10); if (buy) { G.roomAct(buy.i); return; } const leave = V.opts.findIndex((q) => q.leave); G.roomAct(leave); return; }
  const risky = (q) => /Lose|health/.test(q.d || '') && R.hp < 40; const pick = ok.find(({ q }) => !risky(q)) || ok[ok.length - 1]; if (!pick || !G.roomAct(pick.i)) G.roomAct(V.opts.length - 1); }
function botRecruit(G) { const R = G.R, S = R.spoils, H = G.HEROES; const own = (k) => G.allHeroes().some((h) => h.k === k);
  let i = S.heroes.findIndex(own); if (i < 0) i = S.heroes.map((k, j) => [H[k].c, j]).sort((a, b) => b[0] - a[0])[0][1]; if (R.bench.every(Boolean) || !G.takeRecruit(i)) G.takeRecruit(-1); }
function botPotion(G, t) { const R = G.R; if (!R.potions.length || !R.b) return; const leak = R.b.mons.some((m) => m.x > (G.COLS - 2) * G.T); const ko = R.b.ko;
  R.potions.forEach((id, i) => { const P = G.POTIONS[id]; if (P.plan) return; if (id === 'heal' && R.hp < R.hpMax * .6) G.usePotion(i); else if (id === 'phoenix' && ko >= 2) G.usePotion(i); else if (P.wave && id !== 'phoenix' && (leak || R.b.mons.length > 25)) G.usePotion(i); }); }
function botItems(G) { const R = G.R, H = G.HEROES, val = (h) => H[h.k].c * Math.pow(3, h.star - 1);
  const carry = R.board.slice().sort((a, b) => (b.wd || 0) - (a.wd || 0) || val(b) - val(a));
  for (let guard = 0; guard < 20 && R.items.length; guard++) { const id = R.items[0], h = carry.find((x) => G.canTake(x, id)); if (!h) break; G.equipFrom(0, h); } }
const results = []; const t0 = Date.now();
const ASCN = +arg('asc', 0);
const BOT = arg('bot', 'strong'); BOTKIND = BOT;
const FUZZ = process.argv.includes('--fuzz'), GOD = process.argv.includes('--god');
for (let i = 0; i < RUNS; i++) results.push(runOnce(1000 + i * 7919, { asc: ASCN, bot: BOT, fuzz: FUZZ }));
const secs = ((Date.now() - t0) / 1000).toFixed(1);
const errs = results.filter((r) => r.err), ws = results.map((r) => r.waves).sort((a, b) => a - b);
const avg = ws.reduce((a, b) => a + b, 0) / ws.length, past5 = results.filter((r) => r.waves >= 5).length / results.length;
let md = `### Balance simulation\n${results.length} seeded bot runs in ${secs}s (the bot builds around traits, saves gold for interest, mazes, places rune stones in its shooters' lines, picks map rooms and uses items and potions; it still plays worse than a good player).\n\n| Seed | Waves survived | Won | Keep HP | Level | Relics | Longest road | Items | Heroes |\n|---|---|---|---|---|---|---|---|---|\n`;
for (const r of results) md += `| ${r.seed} | ${r.waves} | ${r.win ? 'yes' : ''} | ${r.hp} | ${r.lvl} | ${r.relics} | ${r.maze} | ${r.items} | ${r.stars} |\n`;
const reach = (f) => Math.round(100 * results.filter((r) => r.waves >= f || r.win).length / results.length);
md += `\nReached act II: ${reach(10)}%, act III: ${reach(20)}%, won: ${reach(31)}%, faced the Devourer: ${results.filter((r) => r.fin).length}, beat it: ${results.filter((r) => r.tw).length}` + (results.some((r) => r.fin && !r.tw) ? ` (it had ${results.filter((r) => r.fin && !r.tw).map((r) => r.devHp == null ? 'escorts' : Math.round(r.devHp * 100) + '%').join(', ')} health left when it won)` : '') + '.';
md += `\nAverage ${avg.toFixed(1)} waves, median ${ws[ws.length >> 1]}, best ${ws[ws.length - 1]}. Wins: ${results.filter((r) => r.win).length}/${results.length}. Average road ${(results.reduce((a, r) => a + r.maze, 0) / results.length).toFixed(0)} tiles, knockouts per run ${(results.reduce((a, r) => a + r.kos, 0) / results.length).toFixed(0)}, potions drunk ${(results.reduce((a, r) => a + r.pots, 0) / results.length).toFixed(1)}, items held ${(results.reduce((a, r) => a + r.items, 0) / results.length).toFixed(1)}, elite stops cleared ${(results.reduce((a, r) => a + r.elites, 0) / results.length).toFixed(1)}.\n`;
const fails = [];
if (errs.length) fails.push(`${errs.length} run(s) crashed: seed ${errs[0].seed}: ${errs[0].err}`);
if (past5 < .5) fails.push(`only ${(past5 * 100).toFixed(0)}% of runs survived 5 waves (expected at least 50%)`);
md += fails.length ? `\n**Failed:** ${fails.join('; ')}\n` : '\nAll checks passed.\n';
console.log(md);
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, md + '\n');
if (process.argv.includes('--json')) fs.writeFileSync('sim-results.json', JSON.stringify(results, null, 1));
process.exit(fails.length ? 1 : 0);
