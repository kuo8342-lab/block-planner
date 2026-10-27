/* Build 「步調 Pace」(version C, for other people) from the private claude.ai app (version A).
   usage: node build-c.js <planner.html> <out-dir>
   C stores data in the browser (localStorage), uses the visitor's own AI key (Claude, Gemini, OpenAI or DeepSeek),
   drops everything personal to A's owner, and has its own name and colours. */
const fs = require('fs'), path = require('path');
const src = process.argv[2] || path.join(__dirname, 'planner.html');
const out = process.argv[3] || path.join(__dirname, 'pace-out');
let s = fs.readFileSync(src, 'utf8');
const rep = (a, b, all) => {
  const n = s.split(a).length - 1;
  if (all ? n < 1 : n !== 1) throw new Error(`expected ${all ? '>=1' : 'exactly 1'} match, got ${n}: ${a.slice(0, 80)}`);
  s = all ? s.split(a).join(b) : s.replace(a, () => b);
};
const SDK = 'https://cdn.jsdelivr.net/npm/@anthropic-ai/sdk@0.132.1/+esm';

/* ---------- head: name, install files, look ---------- */
rep('<title>方塊週排程</title>', '');
rep('</head>', `<title>步調 Pace</title>
<meta name="description" content="用時間方塊排一週的讀書計畫：拖曳排程、目標拆解、專注計時、週報。資料只存在你的裝置。">
<link rel="manifest" href="manifest.json">
<meta name="theme-color" content="#2f7a5b">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="步調">
<link rel="apple-touch-icon" href="icon-192.png">
<link rel="icon" href="icon.svg" type="image/svg+xml">
<script>${fs.readFileSync(path.join(__dirname, 'c-shim.js'), 'utf8').replace('__SDK__', SDK)}</script>
</head>`);
const PACE_CSS = `<style>
/* 步調 Pace: warm paper + forest green, hand-written headings */
:root {
  --bg: #f4f1ea; --panel: #fffdf8; --panel-2: #f8f5ee; --fg: #23251f; --muted: #66665b; --line: #e4ded2; --line-soft: #efeae0;
  --accent: #2f7a5b; --accent-soft: #e1efe7;
}
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {
  --bg: #161814; --panel: #1f221d; --panel-2: #262a24; --fg: #ecebe4; --muted: #a3a596; --line: #34392f; --line-soft: #2a2e26;
  --accent: #6cc39b; --accent-soft: #23382d;
} }
:root[data-theme="dark"] {
  --bg: #161814; --panel: #1f221d; --panel-2: #262a24; --fg: #ecebe4; --muted: #a3a596; --line: #34392f; --line-soft: #2a2e26;
  --accent: #6cc39b; --accent-soft: #23382d;
}
h1, h2, .dtitle, .brandname { font-family: "LXGW WenKai TC", var(--f-body); }
.brandname { display: inline-flex; align-items: center; gap: 6px; font-weight: 700; color: var(--accent); font-size: .95rem; letter-spacing: .04em; }
.brandname img { width: 20px; height: 20px; }
#exportNow, label:has(#exportSec) { display: none !important; }
.ai-key { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 8px; align-items: end; }
.ai-key input, .ai-key select { width: 100%; min-width: 0; box-sizing: border-box; }
.ai-key a.btn { text-decoration: none; color: inherit; white-space: nowrap; align-self: end; }
#aiCustomWrap { grid-column: 1 / -1; }
.sync-form { display: flex; flex-direction: column; gap: 8px; padding: 6px 0; }
.sync-form input { width: 100%; min-width: 0; box-sizing: border-box; }
.sync-acts { display: flex; flex-wrap: wrap; gap: 8px; }
#syncOut { display: flex; flex-direction: column; gap: 8px; align-items: flex-start; }
#syncOut[hidden] { display: none; }
#syncOut details { align-self: stretch; }
/* ---------- day headers: weekday, date, then one muted line; only problems get colour ---------- */
.head { gap: 3px; padding: 10px 4px 9px; }
.head .busy.calm { display: none; }
.head .busy.hot { font-size: .64rem; padding: 0 .55em; }
.head .stats { display: flex; justify-content: center; align-items: center; gap: 6px; min-height: 18px; font-family: var(--f-mono); font-size: .68rem; color: var(--muted); white-space: nowrap; }
.head .stats .load { font-size: inherit; }
.head .stats .load + .load::before { content: "·"; margin-right: 6px; color: var(--muted); opacity: .6; font-weight: 400; }
.head .stats .load.heavy, .head .stats .load.rest-low { color: var(--danger); font-weight: 600; }
@media (max-width: 1279px) {   /* narrow day columns: stack the two numbers */
  .head .stats { flex-direction: column; gap: 0; line-height: 1.35; }
  .head .stats .load + .load::before { content: none; }
}
.head .stats .load.rest-low::after { content: ""; display: inline-block; width: 5px; height: 5px; margin-left: 3px; border-radius: 50%; background: currentColor; vertical-align: 1px; }
/* ---------- computer screens: one header bar, a wider rail, and the timetable stays in view while the rail scrolls ---------- */
@media (min-width: 921px) {
  body { padding-block: 20px 48px; }
  .planner { max-width: 1760px; margin-inline: auto; }
  .top { align-items: center; gap: 10px 16px; padding: 12px 16px 12px 20px; margin-bottom: 18px;
    background: var(--panel); border-radius: 18px; box-shadow: var(--shadow); }
  .brand { display: grid; grid-template-columns: auto auto; grid-template-rows: auto auto; column-gap: 16px; align-items: center; }
  .brandname { grid-row: 1 / 3; font-size: 1.1rem; padding-right: 16px; border-right: 1px solid var(--line); align-self: stretch; }
  .brandname img { width: 28px; height: 28px; }
  .brand .eyebrow { align-self: end; }
  .brand h1 { font-size: 1.45rem; line-height: 1.2; align-self: start; }
  .weeknav { padding-left: 4px; }
  .actions-top { gap: 6px; }
  .actions-top .btn, .actions-top .seg, .weeknav .btn { min-height: 36px; }
  .actions-top .menu > summary.btn { display: inline-flex; align-items: center; }
  #installBtn { background: transparent; color: var(--accent); border-color: var(--accent); }
  #installBtn:hover { background: var(--accent-soft); }
  .status { padding-left: 6px; }
  .layout { grid-template-columns: 300px minmax(0, 1fr); gap: 20px; }
  .card { padding: 16px 16px 18px; gap: 12px; border-radius: 16px; }
  .card h2 { font-size: 1rem; }
  .grid-scroll { border-radius: 16px; }
  body:not(.r) .layout > div:last-child { position: sticky; top: 16px; }
  body:not(.r) .grid-scroll { max-height: calc(100vh - 32px); }
  body:not(.r) .warnbar:not([hidden]) + .grid-scroll { max-height: calc(100vh - 84px); }
  .warnbar { box-shadow: none; border: 1px solid var(--line); background: var(--panel-2); border-radius: 12px; }
}
@media (min-width: 1500px) {
  .layout { grid-template-columns: 340px minmax(0, 1fr); gap: 24px; }
  .card { padding: 18px 20px 20px; }
  .hint { font-size: .8rem; }
}
#installDlg { width: min(440px, calc(100vw - 32px)); }
#installDlg form { max-height: 82vh; overflow: auto; }
.inst { border: 1px solid var(--line); border-radius: 12px; padding: 4px 12px; }
.inst > summary { font-size: .92rem; font-weight: 700; color: var(--fg); display: flex; align-items: center; gap: 8px; }
.inst-body { display: flex; flex-direction: column; gap: 8px; padding: 6px 0 10px; font-size: .86rem; }
.inst-body ol { margin: 0; padding-left: 1.3em; display: flex; flex-direction: column; gap: 4px; }
.inst-body a.btn { text-decoration: none; align-self: flex-start; }
/* settings grid: long option texts used to push the right column off a phone screen */
.pref-grid { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
.pref-grid label, .pref-grid select, .pref-grid input { min-width: 0; max-width: 100%; }
.pref-grid select, .pref-grid input { width: 100%; box-sizing: border-box; }
</style>`;
rep('    <div class="brand">\n', '    <div class="brand">\n      <span class="brandname"><img src="icon.svg" alt="">步調</span>\n');

/* ---------- settings: AI key section, drop the A-only parts ---------- */
rep('placeholder="例如：石碇區"', 'placeholder="例如：大安區"');
rep('方塊週排程', '步調', true);   // backup file name, notification title, heading placeholder
{ const blk = /<h3 class="set-h">放假與地區<\/h3>\n    <div class="pref-grid">\n[\s\S]*?\n    <\/div>\n/.exec(s)[0]; rep(blk, '<div hidden>' + blk + '</div>\n'); }   // A's daily sync looks up typhoon days; C has no one to do that
rep('    <h3 class="set-h">資料與隱私</h3>', `    <h3 class="set-h">AI（用你自己的金鑰）</h3>
    <p class="hint" style="margin:0">目標拆解和教練要用 AI。選一家 AI 服務，貼上你在那家建立的 API 金鑰就會出現。費用由你自己的 API 帳戶支付，建議在那家的後台設定每月花費上限。Google Gemini 的 Flash 系列目前有免費額度（以 Google 官方公告為準；免費額度的內容 Google 可能拿去改進產品）。金鑰只存在這台裝置，不會傳給這個網站，只會直接送到你選的 AI 服務。</p>
    <div class="ai-key">
      <label>AI 服務<select id="aiProvider"><option value="anthropic">Anthropic Claude</option><option value="gemini">Google Gemini</option><option value="openai">OpenAI</option><option value="deepseek">DeepSeek</option></select></label>
      <a class="btn" id="aiKeyLink" href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener">取得金鑰</a>
      <label>API 金鑰<input id="aiKey" type="password" autocomplete="off" spellcheck="false" placeholder="sk-ant-..."></label>
      <button class="btn" type="button" id="aiKeySave">儲存</button>
      <label>模型<select id="aiModel"></select></label>
      <button class="btn danger" type="button" id="aiKeyDel">移除金鑰</button>
      <label id="aiCustomWrap" hidden>自訂模型名稱<input id="aiModelCustom" autocomplete="off" spellcheck="false" placeholder="照官方文件的模型 ID 填"></label>
    </div>
    <p class="hint" id="aiKeyUrl" style="margin:0;overflow-wrap:anywhere"></p>
    <p class="hint" id="aiKeyMsg" aria-live="polite" style="margin:0"></p>
    <h3 class="set-h">資料與隱私</h3>`);
rep('資料存在 claude.ai 上，只有你自己的帳號看得到，不會公開。可以隨時匯出備份或全部刪除。',
  '資料只存在這台裝置的瀏覽器裡，不會上傳到任何伺服器。換裝置或清除瀏覽器資料就會不見，記得定期匯出備份。');
rep('範本和 Claude 回饋，無法復原', '範本和目標，無法復原');
rep('（這個頁面開著時；電腦另外有 Windows 通知）', '（這個頁面開著時）');

/* ---------- texts that belong to A's owner ---------- */
rep('placeholder="例如：Kibo 上傳網頁模擬器"', 'placeholder="例如：交英文作文"');
rep('<div class="note" id="claudeNote"><span class="muted">每天早上同步一次後，這裡會出現 Claude 的回饋。</span></div>',
  '<div class="note" id="claudeNote"><span class="muted">每週日花 10 分鐘排下週，比每天臨時想要做什麼輕鬆很多。</span></div>');
rep('每次提問會用到你的 Claude 用量。', '每次提問會用到你自己 API 金鑰的額度。');
rep('placeholder="例如：二段數學考 80 分、12/27 前交出 Kibo"', 'placeholder="例如：段考數學考 80 分、月底前讀完一本書"');
rep('例如「二段數學考 80 分」「12/27 前交出 Kibo」。', '例如「段考數學考 80 分」「月底前讀完一本書」。');
rep('「一般週」「段考週」「Kibo 衝刺週」', '「一般週」「段考週」「比賽衝刺週」');
rep("swim: '游泳'", "swim: '運動'");
rep("care: '心理師'", "care: '看診'");
rep('學校、心理師和傍晚前', '學校、看診和傍晚前');
rep("const SUBJECTS = ['數學', '物理', '化學', '生物', '國文', '英文', '德文', '程式', '自主學習'];",
  "const SUBJECTS = ['數學', '國文', '英文', '物理', '化學', '生物', '歷史', '地理', '公民', '程式'];");
rep(/const SUB_RULES = \[.*\];/.exec(s)[0],
  "const SUB_RULES = [[/數學/, '數學'], [/國文|作文/, '國文'], [/英文|英檢|多益|托福|雅思/, '英文'], [/物理/, '物理'], [/化學/, '化學'], [/生物/, '生物'], [/歷史/, '歷史'], [/地理/, '地理'], [/公民/, '公民'], [/python|程式|apcs|coding/i, '程式']];");
rep("{ 英文: 'lang', 德文: 'lang', 程式: 'code', 自主學習: 'code' }", "{ 英文: 'lang', 程式: 'code' }");
rep("['英文', '德文', '國文', '生物']", "['英文', '國文', '生物', '歷史', '地理', '公民']");
rep("prefGet('planner-county', '新北市')", "prefGet('planner-county', '')");
rep("prefGet('planner-district', '石碇區')", "prefGet('planner-district', '')");
rep('台灣高二理組學生', '台灣學生', true);
rep('使用者重視休息、23:30 前睡；', '使用者重視休息和睡眠；');
rep('請 Claude 幫你放入學校課表，或直接開始拖', '到「設定 → 固定行程」加入你的課表，或直接開始拖');
rep("'這個檢視無法匯出，請在 claude.ai 開啟這一頁'", "'這個瀏覽器無法下載檔案'");
rep("'這個畫面不能下載檔案，請在 claude.ai 打開 App 再匯出。'", "'這個瀏覽器無法下載檔案。'");
rep("not_granted: '你沒有允許這個頁面使用 Claude，AI 功能先關閉。',",
  "not_granted: '還沒有 API 金鑰，到「設定 → AI」貼上就能用。', bad_key: 'API 金鑰不對或已失效，到「設定 → AI」重新貼上。', unreachable: '連不上 AI 服務。最常見的原因是金鑰不對、已失效或額度用完（有些服務出錯時不會告訴瀏覽器原因），請到「設定 → AI」確認；也可能是網路不穩。', billing: 'API 帳戶額度不足或還沒開通付費，請到那家 AI 服務的後台確認。',");
rep("refused: 'Claude 沒有回答這個問題，換個說法試試。'", "refused: 'AI 沒有回答這個問題，換個說法試試。'");
rep("'無法連到資料庫，請在 claude.ai 開啟這一頁'", "'這個瀏覽器不能存資料（可能是無痕模式）'");
const PERSONAL = /石碇|心理師|高二理組|Kibo|kibo|德文|自主學習|claude\.ai 開啟/g;
const left = [...s.matchAll(PERSONAL)].map(m => s.slice(Math.max(0, m.index - 60), m.index + 40).replace(/\s+/g, ' '));
if (left.length) throw new Error('personal text left:\n' + left.join('\n'));

/* ---------- day headers: study and rest time on one quiet line ---------- */
rep('${busyTag}<span class="load${study > heavyAt', '${busyTag}<span class="stats"><span class="load${study > heavyAt');
rep("休 ${rest} 分${restLow ? ' ⚠' : ''}</span>` : ''}</div>`;", "休 ${rest} 分</span>` : ''}</span></div>`;");

/* ---------- optional cloud sync: only when a Firebase web config is present (goes first, the install dialog reads PACE_FIREBASE) ---------- */
{ const cfgFile = process.env.PACE_FIREBASE_CONFIG || path.join(__dirname, 'firebase-config.json');
  const cfg = fs.existsSync(cfgFile) ? JSON.parse(fs.readFileSync(cfgFile, 'utf8')) : null;
  if (cfg) rep('</body>', '<script>window.PACE_FIREBASE = ' + JSON.stringify(cfg) + ';\n' + fs.readFileSync(path.join(__dirname, 'c-sync.js'), 'utf8') + '</script>\n</body>');
  console.log(cfg ? 'sync: on (' + cfg.projectId + ')' : 'sync: off (no firebase-config.json)'); }

/* ---------- interface language: Chinese or English, chosen in Settings → Appearance ---------- */
rep('</head>', '<script>const PACE_EN = ' + JSON.stringify(JSON.parse(fs.readFileSync(path.join(__dirname, 'i18n-en.json'), 'utf8'))) + ';\n'
  + fs.readFileSync(path.join(__dirname, 'c-i18n.js'), 'utf8') + '</script>\n</head>');
rep('<h3 class="set-h">外觀</h3>', `<h3 class="set-h">外觀</h3>
    <label class="lang-pick">語言 Language<select id="paceLang" onchange="paceSetLang(this.value)"><option value="zh">繁體中文</option><option value="en">English</option></select></label>
    <script>document.getElementById('paceLang').value = paceLang();</script>`);

/* ---------- links from the Android home-screen widget: #widget sticky note, #add quick add, #focus start focusing ---------- */
rep('</body>', `<script>
(() => {
  const go = () => {
    const h = location.hash;
    if (h === '#widget') { setWidget(true); return; }
    if (h !== '#add' && h !== '#focus') return;
    history.replaceState(null, '', location.pathname + location.search);
    setWidget(false);
    if (h === '#add') { const q = document.getElementById('qa'); q.scrollIntoView({ block: 'center' }); q.focus(); }
    else setTimeout(() => document.getElementById('npAct')?.click(), 600);   // 「現在做這件」's start button, once the data is in
  };
  addEventListener('hashchange', go);
  if (location.hash === '#add' || location.hash === '#focus') setTimeout(go, 900);
})();
</script>
</body>`);

/* ---------- install button and backup import ---------- */
rep('<button class="btn" type="button" id="skinBtn">設定</button>', '<button class="btn" type="button" id="skinBtn">設定</button><button class="btn primary" type="button" id="installBtn">安裝 App</button>');
rep('</body>', '<script>' + fs.readFileSync(path.join(__dirname, 'c-install.js'), 'utf8') + '</script>\n</body>');

/* ---------- AI settings wiring (after the app's own boot hooks) ---------- */
rep('</body>', PACE_CSS + `
<script>
(() => {
  const $ = id => document.getElementById(id);
  const prov = $('aiProvider'), key = $('aiKey'), model = $('aiModel'), custom = $('aiModelCustom'), msg = $('aiKeyMsg');
  const P = () => paceAi.providers[prov.value];
  const refreshAi = async () => { try { sampleFn = await window.claude.use('sample'); } catch (e) { sampleFn = null; } renderAiAvailability(); };
  const sync = () => {
    prov.value = paceAi.provider();
    const p = P(), k = paceAi.key(), m = paceAi.model(), known = p.models.some(([id]) => id === m);
    key.value = ''; key.placeholder = k ? '已儲存（' + k.slice(0, 6) + '…）' : p.keyHint;
    $('aiKeyLink').href = p.keyUrl; $('aiKeyUrl').textContent = p.name + ' 的金鑰在這裡建立：' + p.keyUrl.replace('https://', '');
    model.innerHTML = p.models.map(([id, label]) => '<option value="' + id + '">' + label + '</option>').join('') + '<option value="__custom">自訂模型名稱…</option>';
    model.value = known ? m : '__custom'; custom.value = known ? '' : m; $('aiCustomWrap').hidden = known;
    $('aiKeyDel').hidden = !k;
  };
  $('skinBtn').addEventListener('click', () => { sync(); msg.textContent = ''; });
  prov.addEventListener('change', async () => { paceAi.setProvider(prov.value); sync(); msg.textContent = '已改用 ' + P().name + (paceAi.key() ? '。' : '，貼上這家的金鑰就能用。'); await refreshAi(); });
  model.addEventListener('change', () => {
    if (model.value === '__custom') { $('aiCustomWrap').hidden = false; custom.focus(); return; }
    $('aiCustomWrap').hidden = true; paceAi.setModel(model.value); msg.textContent = '已改用 ' + model.selectedOptions[0].textContent;
  });
  custom.addEventListener('change', () => { const v = custom.value.trim(); if (!/^[A-Za-z0-9_.:/-]{2,80}$/.test(v)) { msg.textContent = '模型名稱只能有英文、數字和 - . _ / :'; return; } paceAi.setModel(v); msg.textContent = '已改用自訂模型 ' + v; });
  $('aiKeySave').addEventListener('click', async () => {
    const v = key.value.trim();
    if (prov.value === 'anthropic' && !/^sk-ant-/.test(v)) { msg.textContent = '金鑰應該是 sk-ant- 開頭的一長串文字。'; return; }
    if (v.length < 20 || v.includes(' ')) { msg.textContent = '金鑰看起來不完整，請整串複製貼上（中間不能有空白）。'; return; }
    paceAi.setKey(v); sync(); msg.textContent = '已儲存。';
    await refreshAi();
  });
  $('aiKeyDel').addEventListener('click', async () => { paceAi.setKey(''); sync(); msg.textContent = '已移除 ' + P().name + ' 的金鑰。'; await refreshAi(); });
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
})();
</script>
</body>`);

fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'index.html'), s);
console.log('built', path.join(out, 'index.html'), (s.length / 1024).toFixed(0) + ' KB');
