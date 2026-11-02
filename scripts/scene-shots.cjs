// screenshots of the weekly report's picture in every theme; usage: node scene-shots.cjs <page-url> <outdir>
// the page must be a C or A-next build served over http; the week is seeded into its own browser storage (synthetic blocks only)
const fs = require('node:fs'), path = require('node:path');
let pw; try { pw = require('playwright'); } catch { pw = require(path.join(process.env.USERPROFILE, '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')); }
const url = process.argv[2], outDir = process.argv[3]; fs.mkdirSync(outDir, { recursive: true });
const THEMES = ['default', 'night', 'sakura', 'ocean', 'matcha', 'neon', 'sunset', 'forest', 'lavender', 'aurora', 'snow', 'coffee'];
(async () => {
  const browser = await pw.chromium.launch(), ctx = await browser.newContext({ viewport: { width: 1100, height: 900 } });
  await ctx.addInitScript(() => { try { for (const [k, v] of [['pace-lang', 'zh'], ['pace-persona', 'custom'], ['pace-tour-done', '1'], ['pace-seen-version', '9999-99-99']]) localStorage.setItem(k, v); } catch (e) {} });
  const page = await ctx.newPage(), errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => typeof state !== 'undefined' && state.ready, null, { timeout: 30000 });
  // last week: a mix of finished, missed and (by the clock) none still to come; this week: some still to come
  await page.evaluate(async () => {
    const mon = mondayOf(new Date()), prev = addDays(mon, -7), mk = (d, start, m, name, cat, done) => ({ id: 'b' + d + start, day: d, start, minutes: m, name, cat, done });
    const blocks = [];
    for (let d = 0; d < 7; d++) { blocks.push(mk(d, '09:00', 50, '數學' + d, 'study', d % 3 !== 2)); blocks.push(mk(d, '13:30', 30, '英文' + d, 'lang', d % 2 === 0)); blocks.push(mk(d, '19:30', 75, '程式' + d, 'code', d % 4 !== 3)); }
    await state.db.doc('weeks/' + ymd(prev)).set({ blocks });
    state.monday = prev; subscribeWeek();
  });
  await page.waitForTimeout(800);
  await page.evaluate(() => document.getElementById('toReport').click());
  await page.waitForFunction(() => !document.getElementById('rSkyCard').hidden, null, { timeout: 15000 });
  const out = {};
  for (const t of THEMES) {
    await page.evaluate(k => { skin = k; applySkin(); }, t);
    await page.waitForTimeout(450);
    await page.locator('#rSky').screenshot({ path: path.join(outDir, t + '-early.png') });
    await page.waitForTimeout(1500);
    await page.locator('#rSky').screenshot({ path: path.join(outDir, t + '.png') });
    out[t] = await page.evaluate(() => ({ title: document.querySelector('#rSkyCard h3').textContent, hint: document.getElementById('rSky').nextElementSibling.textContent.slice(0, 24), meta: document.getElementById('rSkyMeta').innerText.replace(/\n/g, ' | ') }));
  }
  console.log(JSON.stringify(out, null, 1)); console.log('page errors:', errors.length ? errors : 'none');
  await browser.close();
})().catch(e => { console.error('CRASH', e.message); process.exit(1); });
