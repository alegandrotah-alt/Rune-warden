#!/usr/bin/env node
// Browser check: loads the built game in headless Chromium on a landscape phone screen, plays a little,
// fails on any script error, and measures frame times with the CPU slowed down like a budget phone.
//   node tools/build.js && node tools/browser-check.js
// CI machines have no GPU, so absolute frame rates are far lower than on a real phone: watch the trend between builds.
const fs = require('fs');
const path = require('path');
const http = require('http');
const { chromium } = require('playwright');
const WWW = path.resolve(__dirname, '..', 'www');
const OUT = path.resolve(__dirname, '..', 'check-output');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.css': 'text/css', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg' };
function serve() {
  return new Promise((res) => {
    const srv = http.createServer((req, rsp) => {
      let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
      const f = path.join(WWW, p);
      if (!f.startsWith(WWW) || !fs.existsSync(f)) { rsp.writeHead(404); rsp.end(); return; }
      rsp.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(rsp);
    }).listen(0, '127.0.0.1', () => res(srv));
  });
}
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const srv = await serve(), url = `http://127.0.0.1:${srv.address().port}/?debug`;
  const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH, args: ['--no-sandbox'] } : {});
  const errors = [];
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push('page error: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|net::/.test(m.text())) errors.push('console: ' + m.text()); });
  await page.goto(url); await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUT, '1-menu.png') });
  // 1. a real first wave: buy from the shop, drag the starter onto the field, fight
  await page.click('#playB'); await page.waitForTimeout(800);
  const tut = await page.evaluate(() => !document.getElementById('coach').hidden);
  await page.click('#cards .hc:not(.empty)');
  const drag = await page.evaluate(() => { const R = window.__RW.R, h = R.bench.find(Boolean); return h ? true : false; });
  const placed = await page.evaluate(() => { const G = window.__RW, R = G.R; for (const h of R.bench.filter(Boolean)) { for (let c = 3; c < 12; c++) { if (G.placeHero(h, c, 2)) break; } } G.uiRefresh(); return R.board.length; });
  await page.screenshot({ path: path.join(OUT, '2-plan.png') });
  await page.click('#fightB'); await page.waitForTimeout(5000);
  await page.screenshot({ path: path.join(OUT, '3-wave1.png') });
  // 2. a busy late wave, CPU slowed 4x, frame times measured
  await page.evaluate(() => { const G = window.__RW, R = G.R; R.phase = 'plan'; R.b = null; R.wave = 24; R.nextQ = null; R.act = 2; G.genField(); R.lvl = 9; R.gold = 999;
    const ks = ['templar', 'wyrm', 'tiefling', 'druid', 'archer', 'ninja', 'blackknight', 'vampire', 'scout']; for (const k of ks) { G.addHero(k, 2, true); }
    let i = 0; for (const h of R.bench.filter(Boolean)) { const spots = [[2, 1], [4, 6], [6, 1], [8, 6], [10, 1], [3, 3], [7, 4], [11, 5], [5, 2]]; G.placeHero(h, ...spots[i++ % spots.length]); }
    G.startWave(); G.speed = 2; G.uiRefresh(); });
  await page.waitForTimeout(3000);
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.evaluate(() => { window.__ft = []; const f = (t) => { window.__ft.push(t); if (window.__ft.length < 20000) requestAnimationFrame(f); }; requestAnimationFrame(f); });
  await page.waitForTimeout(8000);
  const ft = await page.evaluate(() => window.__ft);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  await page.screenshot({ path: path.join(OUT, '4-busy-wave.png') });
  const busy = await page.evaluate(() => { const B = window.__RW.R.b; return B ? { mons: B.mons.length, projs: B.projs.length, ko: B.ko } : { mons: 0, projs: 0, ko: 0 }; });
  // 3. items combine on a hero, the act map and a mystery event open
  const extra = await page.evaluate(() => { const G = window.__RW, R = G.R; R.b = null; R.phase = 'plan'; R.room = null; R.queue = null; document.querySelectorAll('.overlay').forEach((o) => { o.hidden = true; });
    R.items.length = 0; const h = R.board[0]; h.it = []; G.dropItem('sword'); G.dropItem('bow'); G.equipFrom(0, h); G.equipFrom(0, h); const item = h.it.join();
    R.wave = 12; R.act = 1; G.genMap(); const opts = G.mapOptions().length; G.showMap(); const mapOk = opts > 0 && !document.getElementById('ovMap').hidden && document.querySelectorAll('#mapGrid .mn.can').length === opts;
    document.getElementById('ovMap').hidden = true; R.gold = 60; G.enterRoom('merchant'); const shown = !document.getElementById('ovRoom').hidden && document.querySelectorAll('#roomList button').length > 3;
    const g0 = R.gold; const buy = G.roomView().opts.findIndex((q) => q.cost && !q.sold && q.item); G.roomAct(buy); const bought = R.gold < g0;
    G.roomAct(G.roomView().opts.findIndex((q) => q.leave)); return { item, mapOk, chosen: opts + ' rooms reachable', evOk: shown && bought && !R.room }; });
  await page.screenshot({ path: path.join(OUT, '5-items-map.png') });
  await browser.close(); srv.close();
  const d = ft.slice(1).map((t, i) => t - ft[i]).sort((a, b) => a - b);
  const avg = d.reduce((a, b) => a + b, 0) / Math.max(1, d.length), p95 = d[Math.floor(d.length * .95)] || 0;
  let md = `### Browser check\n- Script errors: ${errors.length ? '**' + errors.length + '**' : 'none'}\n- Tutorial shown on the first run: ${tut ? 'yes' : '**no**'}\n- First wave: bought from the shop: ${drag ? 'yes' : '**no**'}, heroes on the field: ${placed}\n` +
    `- Busy late wave (${busy.mons} monsters, ${busy.projs} projectiles, ${busy.ko} heroes knocked out), CPU slowed 4×, landscape phone at 2× density: **${(1000 / avg).toFixed(0)} FPS** average, ${p95.toFixed(0)} ms 95th-percentile frame\n` +
    `- Sword + bow on one hero made: ${extra.item === 'runearrow' ? 'Rune Arrows' : '**' + (extra.item || 'nothing') + '**'}; act map opened: ${extra.mapOk ? 'yes' : '**no**'} (${extra.chosen}); merchant room bought an item and closed: ${extra.evOk ? 'yes' : '**no**'}\n` +
    `  (CI has no GPU, so real phones run far faster; compare this number between builds)\n- Screenshots are attached to the run as **browser-check-screens**.\n`;
  if (errors.length) md += '\n```\n' + errors.slice(0, 10).join('\n') + '\n```\n';
  console.log(md);
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, md + '\n');
  process.exit(errors.length || !drag || !placed || !tut || extra.item !== 'runearrow' || !extra.mapOk || !extra.evOk ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
