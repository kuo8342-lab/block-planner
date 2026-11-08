/* Build 「A-next」: the private claude.ai planner (A) with Pace's look and the parts of Pace (C) that need no network.
   usage: node build-a.js <planner.html> <out.html>
   Stage 1: the six extra themes and their theme-specific progress words (c-skins.js).
   Stage 2: Pace's layout: header bar, rail, day headers, phone navigation, pause button on the focus timer (the notion-*.css / .js files).
   A keeps everything of its own: the AI coach, its name, its personal settings and its database.
   Nothing here talks to another site: groups and sync stay in C, because an artifact page cannot reach Firebase. */
const fs = require('fs'), path = require('path');
const src = process.argv[2] || path.join(__dirname, '../a-source/planner.html');
const out = process.argv[3] || path.join(__dirname, '../a-source/planner-next.html');
let s = fs.readFileSync(src, 'utf8').replace(/\r\n/g, '\n');
const read = f => fs.readFileSync(path.join(__dirname, f), 'utf8');
const rep = (a, b) => {
  const n = s.split(a).length - 1;
  if (n !== 1) throw new Error(`expected exactly 1 match, got ${n}: ${a.slice(0, 80)}`);
  s = s.replace(a, () => b);
};
// A may already carry a previous build of this: start from plain A
s = s.replace(/<script data-pace="[^"]*">[\s\S]*?<\/script>\n/g, '').replace(/<style data-pace="[^"]*">[\s\S]*?<\/style>\n/g, '').replace(/<!-- A-next:[^>]*-->\n/g, '');

/* the layout CSS Pace puts on top of A (day headers, computer screens, settings grid): taken from build-c.js so there is one copy */
const cSrc = read('build-c.js').replace(/\r\n/g, '\n');
const m = /const PACE_CSS = `([\s\S]*?)`;\nrep\('    <div class="brand">/.exec(cSrc);
if (!m) throw new Error('PACE_CSS not found in build-c.js');
const layoutCss = m[1].replace(/^<style>\n?/, '').replace(/<\/style>\s*$/, '');
// Pace's own colours and brand look stay in C: keep only the layout rules (from the day headers on), A keeps its palette
const from = layoutCss.indexOf('/* ---------- day headers');
if (from < 0) throw new Error('layout part not found in PACE_CSS');
const layoutOnly = layoutCss.slice(from);

/* 1. start of the page (the head stays exactly as the platform wrote it, or the publish would wrap the page a second time): a language stub (the interface here is Chinese only) and the pause-aware focus clock */
rep('</head><body>\n', '</head><body>\n<script data-pace="stub">window.paceLang = () => "zh"; window.PACE_HAS_COACH = true;</script>\n<script data-pace="focus-clock">' + read('notion-focus-clock.js') + '</script>\n');
rep('function focusWorkMs(f, now = Date.now())', 'function focusWorkMs(f, now = paceFocusNow(f))');
rep("const now = Date.now(); let note = '', changed = false;", "const now = paceFocusNow(focus); let note = '', changed = false;");
rep('const now = Date.now(), left = Math.max(0, focus.segEnd - now)', 'const now = paceFocusNow(focus), left = Math.max(0, focus.segEnd - now)');

/* 2. markup the layout expects: a name on the left of the header, one quiet line under each day, a hidden install button to move around */
rep('    <div class="brand">\n', '    <div class="brand">\n      <span class="brandname">方塊週排程</span>\n');
rep('${busyTag}<span class="load${study > heavyAt', '${busyTag}<span class="stats"><span class="load${study > heavyAt');
rep("休 ${rest} 分${restLow ? ' ⚠' : ''}</span>` : ''}</div>`;", "休 ${rest} 分</span>` : ''}</span></div>`;");
rep('<button class="btn" type="button" id="skinBtn">設定</button>', '<button class="btn" type="button" id="skinBtn">設定</button><button class="btn" type="button" id="installBtn" hidden>安裝 App</button>');

/* 3. the look: A's own CSS stays; Pace's layout and components go on top, then the scripts that build the phone navigation */
rep('</body>', '<style data-pace="layout">' + layoutOnly + '</style>\n</body>');
for (const f of ['notion-ui.css', 'notion-components.css', 'notion-mobile.css', 'notion-motion.css']) rep('</body>', '<style data-pace="' + f + '">' + read(f) + '</style>\n</body>');
for (const f of ['notion-ui.js', 'notion-mobile.js', 'notion-focus.js', 'notion-feedback.js']) rep('</body>', '<script data-pace="' + f + '">' + read(f) + '</script>\n</body>');

/* 3b. A keeps its own name and has no groups: undo the brand text the layout script writes */
rep('</body>', '<script data-pace="a-brand">' + `
(() => {
  document.querySelectorAll('.brandname').forEach(b => { b.innerHTML = '<span>方塊週排程<small class="brand-subtitle">AI 版</small></span>'; });
  document.querySelectorAll('.mobile-brand').forEach(b => { b.textContent = '方塊週排程'; });
})();` + '</script>\n</body>');

/* 4. the themes script reads A's skin globals, so it goes after A's own script */
rep('</body>', '<script data-pace="c-skins.js">window.PACE_KEEP_ORIGINAL_WORDS = true;\n' + read('c-skins.js') + '</script>\n<script data-pace="c-scenes.js">' + read('c-scenes.js') + '</script>\n<script data-pace="c-sounds.js">' + read('c-sounds.js') + '</script>\n<script data-pace="c-rewards.js">' + read('c-rewards.js') + '</script>\n<script data-pace="c-stickers.js">' + read('c-stickers.js') + '</script>\n<script data-pace="c-mystery.js">' + read('c-mystery.js') + '</script>\n<script data-pace="c-zen.js">' + read('c-zen.js') + '</script>\n<script data-pace="c-rest.js">' + read('c-rest.js') + '</script>\n<!-- A-next: Pace layout, themes and sounds (2026-11-04) -->\n</body>');

fs.writeFileSync(out, s);
console.log('built', out, (s.length / 1024).toFixed(0) + ' KB');
