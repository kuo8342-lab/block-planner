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
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
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
/* first-run tour (c-tour.js): a click-blocking layer, a spotlight ring that dims everything else, and a step card at the bottom */
#tour .tour-block { position: fixed; inset: 0; z-index: 70; }
#tour.nohi .tour-block { background: rgba(10, 14, 12, .55); }
#tour .tour-hi { position: fixed; z-index: 71; border-radius: 14px; box-shadow: 0 0 0 3px var(--accent), 0 0 0 9999px rgba(10, 14, 12, .55); pointer-events: none; transition: left .25s, top .25s, width .25s, height .25s; }
#tour .tour-card { position: fixed; z-index: 72; left: 50%; bottom: calc(16px + env(safe-area-inset-bottom, 0px)); transform: translateX(-50%); width: min(440px, calc(100vw - 32px)); box-sizing: border-box; background: var(--panel); color: var(--fg); border-radius: 18px; padding: 14px 16px 16px; box-shadow: 0 12px 40px rgba(0,0,0,.35); }
#tour .tour-top { display: flex; justify-content: space-between; align-items: center; }
#tour .tour-step { font-family: var(--f-mono); font-size: .75rem; color: var(--muted); }
#tour .tour-title { font-family: "LXGW WenKai TC", var(--f-body); font-size: 1.15rem; font-weight: 700; margin: 4px 0 6px; color: var(--accent); }
#tour .tour-text { margin: 0; line-height: 1.6; font-size: .92rem; }
#tour .tour-dots { display: flex; gap: 5px; margin: 12px 0 10px; }
#tour .tour-dots i { width: 6px; height: 6px; border-radius: 50%; background: var(--line); }
#tour .tour-dots i.on { background: var(--accent); width: 16px; border-radius: 3px; }
#tour .tour-acts { display: flex; justify-content: flex-end; gap: 8px; flex-wrap: wrap; }
#tourAgain { margin-top: 6px; }
body.touring { padding-bottom: 340px; }   /* room to scroll the last things on the page above the step card */
/* iPhone / iPad: inputs under 16px make Safari zoom in on tap; 100vh includes the hidden toolbar; long-press must not select text */
@supports (-webkit-touch-callout: none) { input, select, textarea { font-size: 16px !important; } }
@supports (height: 100dvh) { .grid-scroll { max-height: calc(100dvh - 120px); } @media (min-width: 921px) { body:not(.r) .grid-scroll { max-height: calc(100dvh - 32px); } } }
@media (pointer: coarse) { .chip, .task .title, .wish .title, .blk { -webkit-user-select: none; } button, .btn { touch-action: manipulation; } }
.persona-list { display: grid; gap: 8px; margin-top: 10px; }
.persona-list .btn { justify-content: flex-start; text-align: left; padding: 10px 14px; }
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

/* ---------- everyone keeps different hours: the timetable's range and the bedtime come from Settings → 作息 (A's 08:00–23:30 and 23:30 bedtime were the owner's) ---------- */
rep('const START = 8 * 60, END = 24 * 60, SPAN = END - START, OFF = 10;',
  `const PACE_HOURS = (() => { const g = (k, d, lo, hi) => { let v = NaN; try { v = Number(localStorage.getItem(k)); } catch (e) {} return Number.isInteger(v) && v >= lo && v <= hi && localStorage.getItem(k) !== null ? v : d; };
  return { from: g('pace-day-from', 6, 0, 12), to: g('pace-day-to', 24, 14, 24), bed: g('pace-bedtime', -1, -1, 1439) }; })();   // bed: minutes after midnight, -1 = no bedtime
const START = PACE_HOURS.from * 60, END = PACE_HOURS.to * 60, SPAN = END - START, OFF = 10;`);
rep('const SUGGEST_WINDOWS = { 0: [[1080, 1380]], 1: [[1080, 1380]], 2: [[1080, 1380]], 3: [[1080, 1380]], 4: [], 5: [[660, 805], [1260, 1350]], 6: [[570, 1320]] };',
  'const SUGGEST_WINDOWS = Object.fromEntries([0, 1, 2, 3, 4, 5, 6].map(d => [d, [[START, END]]]));   // anywhere in your own day; fixed items and other blocks are skipped');
rep("Array.from({ length: 16 }, (_, i) => `<div style=\"top:${i * 60 + OFF}px\">${pad(8 + i)}:00</div>`)",
  "Array.from({ length: SPAN / 60 }, (_, i) => `<div style=\"top:${i * 60 + OFF}px\">${pad(START / 60 + i)}:00</div>`)");
{ const night = /function nightCheck\(\) \{[\s\S]*?\n\}\n/.exec(s)[0];
  rep(night, `function nightCheck() {
  const bar = document.getElementById('nightBar');
  if (prefGet('planner-night', '1') !== '1' || PACE_HOURS.bed < 0) { bar.hidden = true; return; }
  const now = new Date(), h = now.getHours(), m = now.getMinutes(), n = h * 60 + m;
  const past = (n - PACE_HOURS.bed + 1440) % 1440;   // minutes since bedtime (wraps past midnight)
  if (!(past >= 1410 || past < 180)) { nightSlot = null; return; }   // from 30 min before bedtime until 3 h after
  const slot = ymd(now) + '-' + h + '-' + Math.floor(m / 10);
  if (slot === nightSlot) return;
  nightSlot = slot;
  const bed = hm(PACE_HOURS.bed), late = past < 180;
  const msg = late ? \`已經 \${hm(n)} 了，過了你設定的睡覺時間 \${bed}。存好檔、放下手機，去睡吧\` : \`\${hm(n)} 了，收尾準備睡覺，\${bed} 前上床\`;
  document.getElementById('nightText').textContent = msg;
  bar.hidden = false; bar.classList.remove('flash'); void bar.offsetWidth; bar.classList.add('flash');
  if (document.body.classList.contains('w')) showRemind('晚睡警告：' + msg);
  else { try { if ('Notification' in window && Notification.permission === 'granted') new Notification('晚睡警告', { body: msg }); } catch (e) {} }
}
`); }
rep("  if (now.getHours() >= 23 || now.getHours() < 5) return [{ kind: 'sleep', title: '去睡覺', why: '已經 23:00 以後了，今天的事明天再做，睡飽比較有效率。' }];",
  "  const sinceBed = PACE_HOURS.bed < 0 ? -1 : (n - PACE_HOURS.bed + 1440) % 1440;\n  if (sinceBed >= 0 && sinceBed < 300) return [{ kind: 'sleep', title: '去睡覺', why: `已經過了你設定的睡覺時間 ${hm(PACE_HOURS.bed)}，今天的事明天再做，睡飽比較有效率。` }];");
rep('  const light = tiredNow() || n >= 21 * 60 + 30;', '  const light = tiredNow() || sinceBed >= 1290;   // the last 2½ hours before bedtime: lighter subjects first');
rep('<label class="check"><input type="checkbox" id="prefNight"> 23:00 後每 10 分鐘晚睡警告（這個頁面開著時）</label>',
  '<label class="check"><input type="checkbox" id="prefNight"> 睡前提醒：睡覺時間前 30 分鐘開始，每 10 分鐘一次（這個頁面開著時）</label>');
rep('    <h3 class="set-h">提醒與聲音</h3>', `    <h3 class="set-h">作息</h3>
    <p class="hint" style="margin:0">每個人的作息不一樣，開夜車也沒關係。時間表的範圍和睡覺時間都照你的習慣設定，改完會重新整理。</p>
    <div class="pref-grid">
      <label>時間表從<select id="dayFrom">${Array.from({ length: 13 }, (_, h) => `<option value="${h}">${String(h).padStart(2, '0')}:00</option>`).join('')}</select></label>
      <label>到<select id="dayTo">${Array.from({ length: 11 }, (_, i) => `<option value="${i + 14}">${String(i + 14).padStart(2, '0')}:00</option>`).join('')}</select></label>
      <label>睡覺時間<select id="bedTime"><option value="-1">不設定（不提醒）</option>${Array.from({ length: 16 }, (_, i) => { const m = (20 * 60 + i * 30) % 1440; return `<option value="${m}">${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}</option>`; }).join('')}</select></label>
    </div>
    <script>addEventListener('DOMContentLoaded', () => {   // PACE_HOURS is defined by the app script further down
      const pairs = [['dayFrom', 'pace-day-from', PACE_HOURS.from], ['dayTo', 'pace-day-to', PACE_HOURS.to], ['bedTime', 'pace-bedtime', PACE_HOURS.bed]];
      for (const [id, key, v] of pairs) { const el = document.getElementById(id); el.value = String(v); el.addEventListener('change', () => { try { localStorage.setItem(key, el.value); } catch (e) {} location.reload(); }); }
    });</script>
    <h3 class="set-h">提醒與聲音</h3>`);

/* ---------- coach off by default (tick it in Settings → 外觀); backup wording for people without Claude ---------- */
rep("const COACH_DEFAULT = '1';", "const COACH_DEFAULT = '0';   // most people don't need the coach");
rep('顯示「教練」卡片（每日回饋和 AI 讀書建議）', '顯示「教練」卡片（AI 讀書建議，要先在下面設定 AI 金鑰）');
rep('「下載備份檔」會把你所有的方塊、任務、目標和設定存成一個 .json 檔，放到這台裝置裡，萬一資料不見可以用來還原。這不是提醒功能。',
  '「下載備份檔」會把你所有的方塊、任務、目標和設定存成一個 .json 檔，放到這台裝置裡（手機會跳出分享畫面，選「儲存到檔案」或傳給自己）。換裝置或清除瀏覽器資料前先下載一份，到新裝置按「匯入備份」就能還原。這不是提醒功能。');

/* block reminders pop up only while the page is open; say plainly that phones in the background won't show them */
rep('方塊開始前 5 分鐘、開始時提醒（這個頁面開著時）', '方塊開始前 5 分鐘、開始時跳出提醒（頁面開著時才會跳；手機切到背景就不會，電腦上最準）');

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
rep('</body>', '<script>' + fs.readFileSync(path.join(__dirname, 'c-persona.js'), 'utf8') + '</script>\n</body>');   // who are you → starter blocks
rep('</body>', '<script>' + fs.readFileSync(path.join(__dirname, 'c-tour.js'), 'utf8') + '</script>\n</body>');   // first-run guided tour

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
