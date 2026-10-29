// 方塊週排程・本機自動提醒（取代 Claude 排程任務，不花 token）
// 由工作排程器每 5 分鐘執行一次：方塊提醒、早安摘要、颱風停課、資料過期警告，用 ntfy 推播到手機。
// 用法：node tick.js [--dry-run] [--now 2026-10-29T18:30] [--data <path>] [--state-dir <dir>] [--typhoon-file <html>]
//   --dry-run 只印出要推的內容；預設資料夾下不寫狀態，指定 --state-dir 時才寫（方便測試去重）
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto');

const HERE = __dirname;
const argv = process.argv.slice(2);
const arg = k => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : undefined; };
const DRY = argv.includes('--dry-run');
const STATE_DIR = arg('--state-dir') ? path.resolve(arg('--state-dir')) : HERE;
const SAVE = !DRY || !!arg('--state-dir');
const DATA = path.resolve(arg('--data') || path.join(HERE, '..', 'planner-data.json'));
const TYPH_URL = 'https://www.dgpa.gov.tw/typh/daily/nds.html';
const CITY = '新北市';
const P = f => path.join(STATE_DIR, f);

// 內建台灣放假日（與 A 版相同）
const BUILTIN_HOLIDAYS = {
  '2026-12-25': '行憲紀念日', '2027-01-01': '元旦', '2027-02-04': '小年夜', '2027-02-05': '除夕', '2027-02-06': '春節', '2027-02-07': '春節', '2027-02-08': '春節',
  '2027-02-09': '春節補假', '2027-02-10': '春節補假', '2027-03-01': '和平紀念日補假', '2027-04-05': '清明節', '2027-04-06': '兒童節補假', '2027-04-30': '勞動節補假',
  '2027-06-09': '端午節', '2027-09-15': '中秋節', '2027-09-28': '教師節', '2027-10-11': '國慶日補假', '2027-10-25': '光復節', '2027-12-24': '行憲紀念日補假', '2027-12-31': '元旦補假'
};

// ---- 小工具 ----
const readJson = (f, def) => { try { return JSON.parse(fs.readFileSync(f, 'utf8').replace(/^﻿/, '')); } catch { return def; } };
const writeJson = (f, o) => { if (!SAVE) return; fs.writeFileSync(f + '.tmp', JSON.stringify(o, null, 1), 'utf8'); fs.renameSync(f + '.tmp', f); };
const pad = n => String(n).padStart(2, '0');
const toMin = s => { const m = /^(\d{1,2}):(\d{2})$/.exec(s || ''); return m ? +m[1] * 60 + +m[2] : NaN; };
const ymd = d => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
const addDays = (s, n) => { const d = new Date(s + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return ymd(d); };

// 台北時間：用「UTC 欄位 = 台北牆上時間」的 Date 表示，不依賴系統時區
function taipeiNow() {
  const f = arg('--now');
  if (f) { const m = /^(\d{4}-\d{2}-\d{2})T(\d{1,2}):(\d{2})$/.exec(f); if (!m) throw new Error('--now 格式要是 YYYY-MM-DDTHH:MM'); return { wall: new Date(`${m[1]}T${pad(m[2])}:${m[3]}:00Z`), real: new Date(Date.parse(`${m[1]}T${pad(m[2])}:${m[3]}:00+08:00`)) }; }
  const real = new Date(); return { wall: new Date(real.getTime() + 8 * 3600e3), real };
}
const { wall, real } = taipeiNow();
const TODAY = ymd(wall), NOW_MIN = wall.getUTCHours() * 60 + wall.getUTCMinutes();
const DOW = (wall.getUTCDay() + 6) % 7; // 0=週一
const MONDAY = addDays(TODAY, -DOW);
const HHMM = `${pad(wall.getUTCHours())}:${pad(wall.getUTCMinutes())}`;

// ---- 紀錄檔（保留最後約 500 行）----
function log(msg) {
  const line = `${TODAY} ${HHMM} ${msg}`;
  if (DRY) console.log('[log] ' + msg);
  if (!SAVE) return;
  try {
    const f = P('log.txt'); fs.appendFileSync(f, line + '\n', 'utf8');
    const lines = fs.readFileSync(f, 'utf8').split('\n').filter(Boolean);
    if (lines.length > 600) fs.writeFileSync(f, lines.slice(-500).join('\n') + '\n', 'utf8');
  } catch { }
}

// ---- 設定（ntfy 主題）----
function loadConfig() {
  const f = P('config.json');
  let cfg = readJson(f, null);
  if (!cfg || !cfg.topic) {
    const A = 'abcdefghijklmnopqrstuvwxyz234567';
    cfg = { server: 'https://ntfy.sh', ...(cfg || {}), topic: 'fangkuai-' + [...crypto.randomBytes(16)].map(x => A[x & 31]).join('') };
    fs.writeFileSync(f, JSON.stringify(cfg, null, 1), 'utf8');
    log(`已建立 ntfy 設定檔：${f}（主題名稱在檔案裡，用手機 ntfy 訂閱它）`); console.log(`已建立 ntfy 設定檔：${f}`);
  }
  return cfg;
}

// ---- 推播：用 ntfy 的 JSON 發佈，標題/內文都是 UTF-8，中文不會亂碼 ----
const sent = [];
async function push(title, message, { tags = [], priority = 3 } = {}) {
  sent.push(title);
  if (DRY) { console.log(`[推播] (優先 ${priority}) ${title}\n        ${message.replace(/\n/g, '\n        ')}`); return true; }
  const cfg = loadConfig();
  try {
    const r = await fetch(cfg.server.replace(/\/$/, ''), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ topic: cfg.topic, title, message, tags, priority }), signal: AbortSignal.timeout(15000) });
    if (!r.ok) { log(`推播失敗 HTTP ${r.status}：${title}`); return false; }
    log(`已推播：${title}｜${message.replace(/\n/g, ' / ').slice(0, 80)}`); return true;
  } catch (e) { log(`推播失敗 ${e.name}：${title}`); return false; }
}

// ---- 資料 ----
function holidayName(data, date) {
  const h = (data && data.holidays || []).find(x => x && x.date === date);
  return h ? (h.name || '放假') : BUILTIN_HOLIDAYS[date] || null;
}
const ownBlocksToday = data => ((data.weeks && data.weeks[MONDAY] && data.weeks[MONDAY].blocks) || [])
  .filter(b => b && b.day === DOW && !isNaN(toMin(b.start)))
  .sort((a, b) => toMin(a.start) - toMin(b.start));
const blockText = b => b.cat === 'rest'
  ? `${b.start} 該休息了${b.name && b.name !== '休息' ? '：' + b.name : ''}（${b.minutes || 0} 分）`
  : `${b.start} ${b.name || '方塊'}（${b.minutes || 0} 分）`;

// a. 方塊提醒：15 分鐘內開始、未完成/略過/失敗、開始未超過 1 分鐘；每個方塊只提醒一次
async function blockReminders(data, state) {
  state.notified = state.notified || {};
  const due = ownBlocksToday(data).filter(b => !b.done && !b.skipped && !b.failed)
    .filter(b => { const d = toMin(b.start) - NOW_MIN; return d >= -1 && d <= 15; })
    .filter(b => !state.notified[`${TODAY}|${b.id}|${b.start}`]);
  if (!due.length) return;
  const rest = due.every(b => b.cat === 'rest');
  const title = due.length === 1 ? (rest ? '休息時間到' : '方塊快開始了') : `接下來 ${due.length} 個方塊`;
  if (await push(title, due.map(blockText).join('\n'), { tags: [rest ? 'coffee' : 'alarm_clock'], priority: 4 }))
    due.forEach(b => state.notified[`${TODAY}|${b.id}|${b.start}`] = HHMM);
}

// b. 早安摘要：07:00 後第一次執行（每天一次；中午後才開機就不補發）
async function morningSummary(data, state) {
  if (state.morning === TODAY || NOW_MIN < 7 * 60) return;
  if (NOW_MIN >= 12 * 60) { state.morning = TODAY; log('超過中午才執行，略過早安摘要'); return; }
  const hol = holidayName(data, TODAY);
  const blocks = ownBlocksToday(data).filter(b => !b.skipped && !b.done);
  const tasks = (data.tasks || []).filter(t => t && t.due === TODAY).map(t => t.title);
  let msg = hol ? `今天放假（${hol}）\n` : '';
  if (!blocks.length) msg += '今天還沒排方塊，打開方塊週排程排一下吧';
  else msg += '今天：' + blocks.slice(0, 8).map(b => `${b.start} ${b.name}`).join('、') + (blocks.length > 8 ? ` 等 ${blocks.length} 個` : '');
  if (tasks.length) msg += '\n今天到期：' + tasks.join('、');
  if (msg.length > 200) msg = msg.slice(0, 199) + '…';
  if (await push('早安・今天的方塊', msg, { tags: ['sunrise'] })) state.morning = TODAY;
}

// c. 颱風停課（新北市）
function decodeHtml(buf, contentType) {
  const head = Buffer.from(buf).subarray(0, 4096).toString('latin1');
  const m = /charset\s*=\s*["']?([\w-]+)/i.exec(contentType || '') || /charset\s*=\s*["']?([\w-]+)/i.exec(head);
  let cs = (m ? m[1] : 'utf-8').toLowerCase();
  if (/big-?5|x-x-big5|cp950/.test(cs)) cs = 'big5';
  try { let t = new TextDecoder(cs).decode(buf); if (cs !== 'big5' && (t.match(/�/g) || []).length > 20) t = new TextDecoder('big5').decode(buf); return t; }
  catch { return new TextDecoder('utf-8').decode(buf); }
}
const strip = s => s.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/[ \t\r\f\v]+/g, ' ').replace(/\n\s*/g, '\n').trim();
// 回傳 null=頁面看不懂；{none:true}=沒有停班停課；{city:false}=有表但沒有新北市；{text,today,tomorrow,partial}
function parseTyphoon(html) {
  const ti = html.search(/<table[^>]*id=["']?Table/i);
  if (ti < 0) return null;
  const end = html.search(/<\/table>/i), table = html.slice(ti, end > ti ? end : undefined);
  if (/無停班停課訊息/.test(strip(table))) return { none: true };
  const rows = [...table.matchAll(/<tr\b[^>]*>([\s\S]*?)(?=<tr\b|<\/tbody|<\/table|$)/gi)].map(m => m[1]);
  const lineList = text => text.split(/\n|(?<=。)/).map(s => s.trim()).filter(Boolean);
  const verdict = text => {
    const lines = lineList(text), stop = s => /停止(?:(?!照常).){0,6}上課|停課/.test(s);   // 「停止上課」「停止上班及上課」「停止上班、停止上課」；不含「停止上班、照常上課」
    const today = lines.some(s => /今天|今日/.test(s) && stop(s)), tomorrow = lines.some(s => /明天|明日/.test(s) && stop(s));
    const any = stop(text), partial = any && /[一-鿿]{1,4}區[、，,：:]|部分|山區/.test(text);
    return { text, today, tomorrow, any, partial };
  };
  for (const tr of rows) {
    const tds = [...tr.matchAll(/<t[dh]\b[^>]*>([\s\S]*?)(?=<\/t[dh]>|<t[dh]\b|$)/gi)].map(m => strip(m[1]));
    const i = tds.findIndex(t => /^新北市[：:]?$/.test(t.replace(/\s/g, '')));
    if (i >= 0 && tds[i + 1]) return verdict(tds.slice(i + 1).join('\n').trim());
    // 縣市名稱和內容擠在同一格：「新北市：今天停止上課。」
    const one = tds.find(t => /^新北市\s*[：:]/.test(t));
    if (one) return verdict(one.replace(/^新北市\s*[：:]\s*/, ''));
  }
  return { city: false };
}
async function typhoonCheck(state) {
  if (NOW_MIN < 5 * 60 || NOW_MIN >= 23 * 60) return;
  // 平時每 3 小時查一次；19:00–23:00 是隔天停課的發布時段，改成每 30 分鐘
  const every = NOW_MIN >= 19 * 60 ? 30 : 180;
  if (state.typhoonAt && real.getTime() - state.typhoonAt < (every - 1) * 60e3) return;
  let html;
  try {
    if (arg('--typhoon-file')) html = decodeHtml(fs.readFileSync(arg('--typhoon-file')), '');
    else { const r = await fetch(TYPH_URL, { signal: AbortSignal.timeout(20000), headers: { 'User-Agent': 'Mozilla/5.0 BlockPlanner' } }); if (!r.ok) { log(`颱風頁面 HTTP ${r.status}`); return; } html = decodeHtml(new Uint8Array(await r.arrayBuffer()), r.headers.get('content-type')); }
  } catch (e) { log(`颱風頁面抓取失敗 ${e.name}`); return; }
  state.typhoonAt = real.getTime();
  let res; try { res = parseTyphoon(html); } catch (e) { log('颱風頁面解析錯誤 ' + e.message); return; }
  if (!res) { log('颱風頁面格式看不懂，不推播'); return; }
  if (res.none || res.city === false) { if (DRY) log(res.none ? '無停班停課訊息' : '表格中沒有新北市'); return; }
  if (!res.any) { log(`新北市：${res.text.replace(/\n/g, ' ').slice(0, 60)}（沒有停課）`); return; }
  const tf = P('typhoon.json'), rec = readJson(tf, { history: [] });
  if (rec.last && rec.last.text === res.text) return;
  const when = (res.partial ? '部分地區' : '') + (res.today && res.tomorrow ? '今天、明天' : res.today ? '今天' : res.tomorrow ? '明天' : '');
  const body = `颱風停課：新北市${when ? when + '停止上課' : ''}（原文：${res.text.replace(/\n/g, ' ')}）`;
  if (await push('颱風停課通知', body, { tags: ['cyclone', 'warning'], priority: 5 })) {
    rec.last = { date: TODAY, text: res.text }; rec.history = [...(rec.history || []), rec.last].slice(-30); writeJson(tf, rec);
  }
}

// d. 資料過期警告
async function staleCheck(data, state) {
  const t = Date.parse(data && data.exportedAt);
  const old = isNaN(t) || real.getTime() - t > 30 * 3600e3;
  if (!old || state.stale === TODAY || NOW_MIN < 7 * 60) return;
  const hrs = isNaN(t) ? '?' : Math.round((real.getTime() - t) / 3600e3);
  if (await push('資料沒更新', `方塊週排程的資料超過一天沒更新（上次 ${hrs} 小時前），提醒可能不準。`, { tags: ['warning'] })) state.stale = TODAY;
}

if (require.main === module) (async () => {
  const sf = P('state.json'), state = readJson(sf, {});
  try {
    if (argv.includes('--test')) {   // 真的推一則測試通知（確認手機有訂閱到），然後結束
      const cfg = loadConfig();
      console.log(`設定檔：${P('config.json')}（裡面的 topic 就是手機 ntfy 要訂閱的主題）`);
      const ok = await push('方塊週排程測試', '手機看得到這則，就代表提醒設定好了。', { tags: ['white_check_mark'] });
      console.log(ok ? `已送出測試通知到 ${cfg.server}；手機有跳出來就成功。` : '送出失敗，請看 log.txt。');
      return;
    }
    if (!DRY) loadConfig();
    const data = readJson(DATA, null);
    if (!data) log(`讀不到資料檔 ${DATA}`);
    else {
      try { await blockReminders(data, state); } catch (e) { log('方塊提醒錯誤 ' + e.message); }
      try { await morningSummary(data, state); } catch (e) { log('早安摘要錯誤 ' + e.message); }
      try { await staleCheck(data, state); } catch (e) { log('過期檢查錯誤 ' + e.message); }
    }
    try { await typhoonCheck(state); } catch (e) { log('颱風檢查錯誤 ' + e.message); }
    // 只留最近兩天的去重紀錄
    const keep = addDays(TODAY, -2);
    state.notified = Object.fromEntries(Object.entries(state.notified || {}).filter(([k]) => k.slice(0, 10) >= keep));
    state.lastRun = `${TODAY} ${HHMM}`;
    writeJson(sf, state);
    if (DRY && !sent.length) console.log('（這次沒有要推播的內容）');
  } catch (e) { log('錯誤 ' + (e && e.message)); }
  process.exitCode = 0;
})();

module.exports = { parseTyphoon, decodeHtml };
