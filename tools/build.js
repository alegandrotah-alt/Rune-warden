#!/usr/bin/env node
// Assembles the game from src/ into a single self-contained page.
//   www/index.html      the installable web app / Android app page (app head + game)
//   dist/rune-warden.html the bare game page (used for the Claude preview)
// Game scripts in src/game/ are joined in file-name order into one script, so they share one scope.
// Images and sounds in src/assets/ are embedded as data URIs so the page works offline.
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const b64 = (p) => fs.readFileSync(path.join(ROOT, p)).toString('base64');

function assetsJs() {
  const atlas = JSON.parse(read('src/assets/atlas.json'));
  const sfx = fs.readdirSync(path.join(ROOT, 'src/assets/sfx')).filter((f) => f.endsWith('.mp3')).map((f) => f.slice(0, -4)).sort();
  return 'const ATLAS=' + JSON.stringify(atlas) + ';\n' +
    `const ATLIMG={fx:'data:image/png;base64,${b64('src/assets/fx.png')}'};\n` +
    'const SFXDATA={' + sfx.map((k) => `${k}:'${b64('src/assets/sfx/' + k + '.mp3')}'`).join(',') + '};\n';
}

function gameScript() {
  const files = fs.readdirSync(path.join(ROOT, 'src/game')).filter((f) => f.endsWith('.js')).sort();
  let js = '';
  for (const f of files) {
    let t = read('src/game/' + f);
    if (t.includes('/*@@ASSETS@@*/\n')) t = t.replace('/*@@ASSETS@@*/\n', assetsJs());
    js += t;
  }
  return js;
}

function buildFragment() {
  return read('src/page/meta.html') + '<style>' + read('src/styles/game.css') + '</style>' +
    read('src/page/body.html') + '<script>' + gameScript() + '</script>\n';
}

function buildPage(fragment) {
  return read('src/page/app-head.html') + fragment + '\n</body></html>\n';
}

module.exports = { buildFragment, buildPage, gameScript, ROOT };

if (require.main === module) {
  const frag = buildFragment();
  const page = buildPage(frag);
  fs.mkdirSync(path.join(ROOT, 'dist'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'www/index.html'), page);
  fs.writeFileSync(path.join(ROOT, 'dist/rune-warden.html'), frag);
  console.log(`built www/index.html (${(page.length / 1024).toFixed(0)} KB) and dist/rune-warden.html`);
}
