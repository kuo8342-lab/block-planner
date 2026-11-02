// screenshots of A-next (harness data) at desktop and phone widths; usage: node a-next-shots.cjs <outdir>
const fs = require('node:fs'), path = require('node:path');
let pw; try { pw = require('playwright'); } catch { pw = require(path.join(process.env.USERPROFILE, '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')); }
const root = path.resolve(__dirname, '..'), file = path.join(root, 'test-artifacts/anext-harness.html'), outDir = process.argv[2] || path.join(root, 'test-artifacts/anext-shots');
fs.mkdirSync(outDir, { recursive: true });
(async () => {
  const browser = await pw.chromium.launch({ headless: true });
  for (const [label, vp] of [['desktop', { width: 1366, height: 860 }], ['phone', { width: 390, height: 800 }]]) {
    const ctx = await browser.newContext({ viewport: vp }), page = await ctx.newPage(), errs = [];
    page.on('pageerror', e => errs.push(e.message));
    await page.route('**/*', r => { const u = new URL(r.request().url()); return u.protocol === 'file:' || u.hostname === '127.0.0.1' || u.protocol === 'data:' ? r.continue() : r.abort(); });
    await page.goto('file:///' + file.replace(/\\/g, '/'), { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.state && state.ready, null, { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(1200);
    for (const s of ['default', 'forest', 'sunset']) {
      await page.evaluate(k => { skin = k; applySkin(); }, s); await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(outDir, `${label}-${s}.png`) });
    }
    if (label === 'phone') {
      await page.evaluate(() => { skin = 'default'; applySkin(); });
      for (const name of ['tasks', 'blocks', 'focus', 'more']) {
        const b = page.locator('.mobile-nav button', { hasText: { tasks: '任務', blocks: '方塊', focus: '專注', more: '更多' }[name] }).first();
        if (await b.count()) { await b.click(); await page.waitForTimeout(400); await page.screenshot({ path: path.join(outDir, `phone-${name}.png`) }); }
      }
    }
    console.log(label, 'page errors:', errs.length ? errs : 'none');
    await ctx.close();
  }
  await browser.close();
})().catch(e => { console.error('CRASH', e.message); process.exit(1); });
