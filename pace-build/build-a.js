/* Build 「A-next」: the private claude.ai planner (A) with the parts of Pace (C) that need no network.
   usage: node build-a.js <planner.html> <out.html>
   Stage 1: the six extra themes and their theme-specific progress words (pace-build/c-skins.js).
   A keeps everything of its own: the AI coach, its name, its personal settings and its database.
   Nothing here talks to another site: groups and sync stay in C, because an artifact page cannot reach Firebase. */
const fs = require('fs'), path = require('path');
const src = process.argv[2] || path.join(__dirname, '../a-source/planner.html');
const out = process.argv[3] || path.join(__dirname, '../a-source/planner-next.html');
let s = fs.readFileSync(src, 'utf8').replace(/\r\n/g, '\n');
const rep = (a, b) => {
  const n = s.split(a).length - 1;
  if (n !== 1) throw new Error(`expected exactly 1 match, got ${n}: ${a.slice(0, 80)}`);
  s = s.replace(a, () => b);
};

/* the themes script reads A's skin globals, so it goes after A's own script, just before the end of the page */
rep('</body>', '<script data-pace="c-skins.js">window.PACE_KEEP_ORIGINAL_WORDS = true;\n' + fs.readFileSync(path.join(__dirname, 'c-skins.js'), 'utf8') + '</script>\n</body>');

s = s.replace('</body>', () => '<!-- A-next: themes from Pace (2026-11-02) -->\n</body>');
fs.writeFileSync(out, s);
console.log('built', out, (s.length / 1024).toFixed(0) + ' KB');
