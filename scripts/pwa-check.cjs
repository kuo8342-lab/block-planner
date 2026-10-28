// Disposable Chromium context; this never opens the user's normal browser profile.
const fs = require('node:fs');
const path = require('node:path');
const { previewUrl } = require('./test-config.cjs');
let playwright;
try { playwright = require('playwright'); } catch {
  playwright = require(path.join(process.env.USERPROFILE, '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
}
(async () => {
  const browser = await playwright.chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ locale: 'zh-TW' });
    await context.addInitScript(()=>{localStorage.setItem('pace-lang','zh');localStorage.setItem('pace-persona','custom');localStorage.setItem('pace-tour-done','1');localStorage.setItem('pace-seen-version','2026-10-28b');});
    const page = await context.newPage();
    await page.clock.install({time:new Date('2026-10-28T14:37:00+08:00')});
    await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
    await page.goto(previewUrl);
    await page.waitForFunction(() => state.ready);
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.waitForFunction(() => navigator.serviceWorker.controller);
    const before = await page.evaluate(() => localStorage.getItem('pace-db-v1'));
    await context.setOffline(true);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => state.ready);
    const result = await page.evaluate(before => ({
      offlineLoads: document.getElementById('range').textContent.length > 0,
      redesignPresent: !!document.querySelector('.workspace-nav'),
      sevenDays: document.querySelectorAll('.col').length === 7,
      storedDataPreserved: localStorage.getItem('pace-db-v1') === before,
      controller: !!navigator.serviceWorker.controller
    }), before);
    const out = path.resolve(__dirname, '../test-artifacts');
    fs.mkdirSync(out, { recursive: true });
    fs.writeFileSync(path.join(out, 'pwa-results.json'), JSON.stringify(result, null, 2));
    console.log(result);
    if (Object.values(result).some(value => value !== true)) process.exitCode = 1;
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
