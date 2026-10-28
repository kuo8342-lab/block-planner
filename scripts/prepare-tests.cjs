const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'test-artifacts');
// This remote commit has the same complete tree as the original ZIP baseline.
const baseline = 'cdbcd796024494c799dfdca162c267af351a373b';
fs.mkdirSync(out, { recursive:true });
const git = args => cp.execFileSync('git', args, { cwd:root, maxBuffer:20*1024*1024 });
for (const f of git(['ls-tree','-r','--name-only',baseline,'pace-planner']).toString().trim().split(/\r?\n/)) {
  if (!f) continue;
  const dest = path.join(out,'baseline',path.relative('pace-planner',f));
  fs.mkdirSync(path.dirname(dest),{recursive:true});
  fs.writeFileSync(dest,git(['show',`${baseline}:${f}`]));
}
const committedHarness = git(['show',`${baseline}:a-source/harness/index.html`]).toString();
let mock = committedHarness.match(/<script>([\s\S]*?)<\/script>/)[0];
const seed = JSON.parse(mock.match(/const store = (.*);/)[1]);
fs.writeFileSync(path.join(out,'seed.json'),JSON.stringify(seed,null,2));
// Legacy assertions expect an ordinary school Monday; their 2026-10-26 holiday
// fixture otherwise removes mon-am when these tests run in that week.
const harnessSeed = JSON.parse(JSON.stringify(seed));
harnessSeed['config/main'].holidays = [];
mock = mock.replace(/const store = .*;/, 'const store = '+JSON.stringify(harnessSeed)+';');
// Keep the late-night assertion in the viewed week instead of hard-coding an
// already-past week. The app intentionally hides now-pick in other weeks.
const tests = fs.readFileSync(path.join(root,'a-source/harness/tests.js'),'utf8')
  .replace('fakeNow(2026, 9, 21, 23, 20); nowPickIndex',
    'fakeNow(sm.getFullYear(), sm.getMonth(), sm.getDate() + 2, 23, 20); nowPickIndex');
const contrast = fs.readFileSync(path.join(root,'a-source/harness/contrast.js'),'utf8');
const src = fs.readFileSync(path.join(root,'a-source/planner.html'),'utf8');
let ui = '';
// The legacy A harness has no C-only branding/install controls. Exercise core
// handlers with the new CSS here; ui/app checks separately exercise the real C shell.
for (const [f,tag] of [['notion-ui.css','style'],['notion-components.css','style'],['notion-mobile.css','style'],['notion-motion.css','style']]) {
  const p = path.join(root,'pace-build',f);
  if (fs.existsSync(p)) ui += `<${tag}>${fs.readFileSync(p,'utf8')}</${tag}>`;
}
const wrap = skin => '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+mock+'</head><body>'+src+skin+'<script>'+tests+contrast+'</script></body></html>';
fs.writeFileSync(path.join(out,'baseline-harness.html'),wrap(''));
fs.writeFileSync(path.join(out,'redesign-harness.html'),wrap(ui));
console.log('Prepared baseline site, isolated seed and harnesses. No production/user storage is accessed.');
