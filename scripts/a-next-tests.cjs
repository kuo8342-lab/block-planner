// A-next (A + Pace's no-network parts) against A's own legacy harness. Synthetic data only; no network.
const fs = require('node:fs'), path = require('node:path');
let pw; try { pw = require('playwright'); } catch { pw = require(path.join(process.env.USERPROFILE, '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')); }
const root = path.resolve(__dirname, '..'), out = path.join(root, 'test-artifacts');
const base = fs.readFileSync(path.join(out, 'baseline-harness.html'), 'utf8');   // made by prepare-tests.cjs: mock + A + legacy tests
const A = fs.readFileSync(path.join(root, 'a-source/planner.html'), 'utf8');
const next = fs.readFileSync(path.join(root, 'a-source/planner-next.html'), 'utf8');
if (!base.includes(A)) throw new Error('baseline harness does not contain A; run prepare-tests.cjs first');
const file = path.join(out, 'anext-harness.html');
fs.writeFileSync(file, base.replace(A, () => next));
(async () => {
  const browser = await pw.chromium.launch({ headless: true }), page = await browser.newPage(), errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.route('**/*', r => { const u = new URL(r.request().url()); return u.protocol === 'file:' || u.hostname === '127.0.0.1' || u.protocol === 'data:' ? r.continue() : r.abort(); });
  await page.goto('file:///' + file.replace(/\\/g, '/'), { waitUntil: 'domcontentloaded' });
  const res = await page.evaluate(() => runTests());
  const pass = res.filter(s => s.startsWith('PASS')).length, bad = res.filter(s => /^(FAIL|CRASH)/.test(s));
  console.log(`A-next legacy harness: ${pass} passed, ${bad.length} failed`); bad.forEach(b => console.log(b));
  // the new themes in A's own page: picker, saved choice, drawing, unit words
  const t = await page.evaluate(async () => {
    const ids = ['sunset', 'forest', 'lavender', 'aurora', 'snow', 'coffee'], r = {};
    r.listed = ids.every(i => SKINS.some(s => s.id === i));
    r.painted = {};
    for (const i of ids) { skin = i; applySkin(); await new Promise(x => setTimeout(x, 400)); const c = fx.bg, d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let k = 3; k < d.length; k += 200) if (d[k] > 8) n++; r.painted[i] = n > 0; r.attr = document.body.dataset.skin; }
    skin = 'forest'; applySkin(); r.unit = paceUnit().count(3);
    skin = 'default'; applySkin();
    return r;
  });
  console.log('themes:', JSON.stringify(t));
  console.log('page errors:', errors.length ? errors : 'none');
  await browser.close();
  if (bad.length || errors.length || !t.listed || Object.values(t.painted).some(v => !v)) process.exitCode = 1;
})().catch(e => { console.error('CRASH', e.message); process.exitCode = 1; });
