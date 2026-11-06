/* 步調 Pace: rewards that make finishing a block feel good and show up where you can see them, built on what motivation research says
   works — and nothing that works by guilt.
   - Small wins (progress principle): every finished block gives XP on the spot (+18 flies up from the block), and XP adds up to levels.
   - A companion that grows with your level (egg → dragon), always visible in the header; attachment and a visible story of progress.
   - Combo: each extra block finished the same day is worth a little more.
   - Surprise (variable reward, in small doses): every 5 finished blocks opens a chest with a sticker; some are rare. The album keeps them.
   - Competence (self-determination theory): achievements for real behaviour (first block, streaks, rest kept, reflections…).
   - Goal gradient: a weekly quest set a little above last week, with a bar that fills; "one more to go" when you are close.
   - Forgiving streaks: one rest pass per week keeps a streak alive through one bad day (all-or-nothing streaks make people quit).
   - Fresh start effect: a new week is announced as a clean start. Self-compassion: a missed block gets a kind word, not a scolding.
   - Healthy limits are yours to set, and off until you do: study hours and bedtime for school days and weekends, whether going past the limit
     stops XP, and your own words as the reminder. Nothing is assumed about how much you should study or when you should sleep.
   - Autonomy: everything here can be switched off; there are no streak-loss warnings, timers or pressure pop-ups.
   XP and stickers are calculated from your saved blocks every time (not stored), so un-ticking a block takes its XP back, nothing can be
   farmed, and the numbers are the same on every device. Works in A and C (uses A's own functions). */
(() => {
  if (typeof state === 'undefined' || typeof toggleDone !== 'function' || typeof blocksInRange !== 'function') return;
  const OFF = 'pace-rewards-off', MUTE = 'pace-rewards-mute', SEEN = 'pace-rewards-seen', FRESH = 'pace-fresh-week', CHEST = 'pace-chests-opened';
  const ls = { get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} } };
  const on = () => ls.get(OFF) !== '1';
  const motion = () => (typeof fxOn === 'undefined' || fxOn) && !matchMedia('(prefers-reduced-motion: reduce)').matches;
  const blockXp = b => 10 + Math.floor((Number(b.minutes) || 0) / 10) * 2;
  const comboXp = k => Math.min(10, (k - 1) * 2);   // the k-th block finished in a day
  const TITLES = [[1, '新手'], [3, '起步者'], [5, '穩定前進'], [8, '專注者'], [12, '自律達人'], [18, '時間大師'], [25, '傳奇']];
  const titleOf = lv => TITLES.filter(([n]) => lv >= n).pop()[1];
  const PETS = [[1, '🥚', '一顆蛋'], [2, '🐣', '破殼了'], [3, '🐥', '小雞'], [5, '🐤', '會跑的小雞'], [8, '🐦', '小鳥'], [12, '🦉', '貓頭鷹'], [18, '🦅', '老鷹'], [25, '🐉', '神龍']];
  const petOf = lv => PETS.filter(([n]) => lv >= n).pop();
  const need = lv => 25 * lv * (lv + 1);   // XP needed to reach level lv + 1
  const levelOf = xp => { let lv = 1; while (xp >= need(lv)) lv++; return lv; };
  // [emoji, name] by rarity; which sticker a chest holds depends only on its number
  const COMMON = [['🍙', '飯糰'], ['🧋', '珍奶'], ['📎', '迴紋針'], ['✏️', '鉛筆'], ['🍎', '蘋果'], ['🍪', '餅乾'], ['🎧', '耳機'], ['🌻', '向日葵'], ['🐢', '烏龜'], ['🍀', '四葉草'], ['🎈', '氣球'], ['🧩', '拼圖'], ['🐧', '企鵝'], ['🍊', '橘子'], ['🐝', '蜜蜂'], ['🌈', '彩虹']];
  const RARE = [['🦊', '狐狸'], ['🐙', '章魚'], ['🚀', '火箭'], ['🎸', '吉他'], ['🦄', '獨角獸'], ['🪐', '土星']];
  const LEGEND = [['👑', '王冠'], ['💎', '鑽石'], ['🏆', '獎盃']];
  const STICKERS = [...COMMON.map(x => [...x, 'common']), ...RARE.map(x => [...x, 'rare']), ...LEGEND.map(x => [...x, 'legend'])];
  const stickerOf = i => {
    const h = Math.abs(Math.sin((i + 1) * 12.9898) * 43758.5453), roll = h - Math.floor(h), pick = Math.floor(h * 7) ;
    const pool = roll > .96 ? LEGEND : roll > .78 ? RARE : COMMON, x = pool[pick % pool.length];
    return STICKERS.find(s => s[0] === x[0]);
  };
  const RARITY = { common: '普通', rare: '稀有', legend: '傳說' };
  const BADGES = [
    ['first', '🌱', '第一步', '完成第一個方塊', s => s.done >= 1],
    ['ten', '🔟', '十全', '完成 10 個方塊', s => s.done >= 10],
    ['fifty', '🏅', '半百', '完成 50 個方塊', s => s.done >= 50],
    ['hundred', '💯', '百塊', '完成 100 個方塊', s => s.done >= 100],
    ['streak3', '🔥', '三天不斷', '連續 3 天達標（完成 7 成以上）', s => s.best >= 3],
    ['streak7', '🌟', '一週不斷', '連續 7 天達標', s => s.best >= 7],
    ['early', '🌅', '早起鳥', '在早上 9 點前完成 5 個方塊', s => s.early >= 5],
    ['week80', '🎯', '神準一週', '一週完成 8 成以上（至少 5 個到期的方塊）', s => s.week80],
    ['comeback', '💪', '回來了', '停了 3 天以上，又重新完成方塊', s => s.comeback],
    ['rest', '🛋️', '會休息的人', '完成 10 個休息方塊（休息也是計畫的一部分）', s => s.rest >= 10],
    ['reflect', '📝', '回顧家', '寫下 3 則做完或沒做完的回顧', s => s.reflect >= 3],
    ['hours20', '⏱️', '二十小時', '讀書類累積 20 小時', s => s.studyMin >= 1200]
  ];
  const CHEERS = ['做得好', '又前進一步', '很穩', '保持這個節奏', '專注力在線', '一格一格累積', '這就是進步', '辛苦了'];
  // d = 0 (Monday) … 6 (Sunday); no limit and no bedtime unless the person set one
  const health = d => { const h = state.config?.health || {}, i = d >= 5 ? 1 : 0, m = Array.isArray(h.max) ? h.max[i] : 0, b = Array.isArray(h.bed) ? h.bed[i] : ''; return { maxStudy: Number.isFinite(m) ? m : 0, bed: typeof b === 'string' ? b : '', noXp: h.noXp !== false, note: typeof h.note === 'string' ? h.note.trim() : '' }; };
  const dayIdx = date => (new Date(date + 'T00:00:00').getDay() + 6) % 7;
  let stats = null, busy = false, again = false, timer = 0, firstDone = false;

  async function compute() {
    if (!state.db) return null;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const from = addDays(mondayOf(today), -7 * 52), now = new Date();
    const all = await blocksInRange(from, addDays(mondayOf(today), 6));
    const s = { done: 0, xp: 0, early: 0, rest: 0, reflect: 0, studyMin: 0, best: 0, streak: 0, passUsed: false, week80: false, comeback: false, todayXp: 0, todayDone: 0, overLimit: false };
    const byDay = {}, byWeek = {}, kDay = {}, minDay = {}, todayKey = ymd(today);
    let lastDone = null;
    for (const b of all.sort((a, c) => a.date.localeCompare(c.date) || toMin(a.start) - toMin(c.start))) {
      if (b.skipped) continue;
      const wk = ymd(mondayOf(new Date(b.date + 'T00:00:00'))), w = byWeek[wk] || (byWeek[wk] = { done: 0, due: 0 });
      if (b.reflection?.text) s.reflect++;
      if (counts(b)) { const v = byDay[b.date] || (byDay[b.date] = { p: 0, d: 0 }); v.p += b.minutes; if (b.done) v.d += b.minutes; }
      if (b.done || b.failed || blockEnd(b.date, b) <= now) w.due++;
      if (!b.done) continue;
      w.done++; s.done++;
      const hb = health(dayIdx(b.date)), over = hb.noXp && hb.maxStudy > 0 && counts(b) && (minDay[b.date] || 0) >= hb.maxStudy;   // past the limit you set: no more points for it
      if (counts(b)) minDay[b.date] = (minDay[b.date] || 0) + b.minutes;
      if (!over) { const k = kDay[b.date] = (kDay[b.date] || 0) + 1, gain = blockXp(b) + comboXp(k); s.xp += gain; if (b.date === todayKey) s.todayXp += gain; }
      if (b.date === todayKey) { s.todayDone++; if (over) s.overLimit = true; }
      if (toMin(b.start) < 9 * 60) s.early++;
      if (b.cat === 'rest') s.rest++;
      if (counts(b)) s.studyMin += b.minutes;
      if (lastDone && (new Date(b.date) - new Date(lastDone)) / 864e5 >= 4) s.comeback = true;
      lastDone = b.date;
    }
    s.todayStudy = minDay[todayKey] || 0;
    // weekly quest: a little more than last week (at least 5); reaching it is worth 30 XP
    const target = wk => { const prev = byWeek[ymd(addDays(new Date(wk + 'T00:00:00'), -7))]; return Math.max(5, Math.min(40, (prev ? prev.done : 0) + 2)); };
    for (const wk of Object.keys(byWeek)) { const w = byWeek[wk]; if (w.done >= target(wk)) s.xp += 30; if (w.due >= 5 && w.done / w.due >= .8) s.week80 = true; }
    const thisWk = ymd(mondayOf(today));
    s.quest = { target: target(thisWk), done: byWeek[thisWk]?.done || 0 };
    // forgiving streak: days with planned study count when 7/10 of it is done; one missed day per Mon–Sun week is forgiven
    const pass = {}; let run = 0;
    for (let d = new Date(from); d <= today; d = addDays(d, 1)) {
      const k = ymd(d), v = byDay[k], wk = ymd(mondayOf(d));
      if (!v || !v.p) continue;
      if (v.d / v.p >= .7) { run++; }
      else if (k === todayKey) { /* today is not over */ }
      else if (!pass[wk] && run > 0) { pass[wk] = true; }
      else run = 0;
      s.best = Math.max(s.best, run);
    }
    s.streak = run; s.passUsed = !!pass[thisWk];
    s.badges = BADGES.filter(x => x[4](s)).map(x => x[0]);
    s.xp += s.badges.length * 50;
    s.level = levelOf(s.xp);
    s.chests = Math.floor(s.done / 5);
    s.album = Array.from({ length: s.chests }, (_, i) => stickerOf(i));
    const l = all.filter(b => b.date === todayKey && !b.skipped && counts(b));
    s.today = { left: l.filter(b => !b.done).length, total: l.length };
    return s;
  }
  async function refresh(quiet) {
    if (busy) { again = true; return; }
    busy = true;
    try { const s = await compute(); if (s) { stats = s; paint(); if (!quiet) celebrate(); else settle(); } } catch (e) {}
    busy = false;
    if (again) { again = false; refresh(quiet); }
  }
  const later = () => { clearTimeout(timer); timer = setTimeout(() => refresh(false), 900); };
  window.paceRewardsRefresh = () => later();

  /* ---------- the header button and the dialog ---------- */
  const btn = Object.assign(document.createElement('button'), { type: 'button', className: 'btn xp-btn', id: 'xpBtn' });
  btn.innerHTML = '<span class="xp-pet" aria-hidden="true">🥚</span><span class="xp-lv">Lv 1</span><span class="xp-mini"><i></i></span><span class="xp-fire" hidden></span>';
  btn.title = '等級與成就';
  // top right, in the same place on every page and on phones (the phone layout hides the header buttons)
  const crumbStatus = document.querySelector('.workspace-crumb .status'), host = document.getElementById('skinBtn');
  if (crumbStatus) { crumbStatus.before(btn); btn.classList.add('in-crumb'); } else if (host) host.before(btn); else return;
  document.body.insertAdjacentHTML('beforeend',
    '<dialog id="xpDlg" class="xp-dlg" aria-labelledby="xpTitle"><form method="dialog">' +
      '<div class="dtitle" id="xpTitle">等級與成就</div>' +
      '<div class="xp-top"><div class="xp-petbig" id="xpPet" aria-hidden="true"></div><div><div class="xp-big" id="xpLevel"></div><div class="xp-name" id="xpName"></div></div></div>' +
      '<div class="xp-track"><i id="xpFill"></i></div><p class="hint" id="xpNext" style="margin:0"></p>' +
      '<p class="xp-today" id="xpToday"></p>' +
      '<h3 class="set-h">本週任務</h3><div class="xp-track quest"><i id="xpQuest"></i></div><p class="hint" id="xpQuestTxt" style="margin:0"></p>' +
      '<h3 class="set-h">連續達標</h3><p class="hint" id="xpStreak" style="margin:0"></p>' +
      '<h3 class="set-h">貼紙圖鑑 <span class="count" id="xpAlbumN"></span></h3><p class="hint" id="xpChestHint" style="margin:0"></p><div class="xp-album" id="xpAlbum"></div>' +
      '<h3 class="set-h">成就 <span class="count" id="xpCount"></span></h3><div class="xp-badges" id="xpBadges"></div>' +
      '<h3 class="set-h">健康界線</h3>' +
      '<p class="hint" style="margin:0">這些都由你決定，沒填就不會提醒。</p>' +
      '<div class="row2"><label>平日最多讀幾小時<input id="xpMax0" type="number" min="0" max="24" step="0.5" placeholder="不限"></label><label>假日最多讀幾小時<input id="xpMax1" type="number" min="0" max="24" step="0.5" placeholder="不限"></label></div>' +
      '<div class="row2"><label>平日睡覺時間<input id="xpBed0" type="time" step="900"></label><label>假日睡覺時間<input id="xpBed1" type="time" step="900"></label></div>' +
      '<label>超過時想對自己說的話（可不填）<input id="xpNote" maxlength="60" placeholder="例如：明天還有明天的份"></label>' +
      '<label class="check"><input type="checkbox" id="xpNoXp"> 超過上限的方塊不加 XP</label>' +
      '<label class="check"><input type="checkbox" id="xpOn"> 顯示獎勵（關掉後不會跳出升級、寶箱，也不顯示 XP）</label>' +
      '<label class="check"><input type="checkbox" id="xpSnd"> 獎勵音效</label>' +
      '<p class="hint" style="margin:0">XP 是用你完成的方塊算出來的：每完成一格 10 分起，越長越多，同一天做越多格加越多；達成本週任務 +30、拿到成就 +50。取消打勾會扣回來，所以沒辦法刷分，每台裝置看到的都一樣。</p>' +
      '<div class="actions"><button class="btn primary" value="ok">關閉</button></div>' +
    '</form></dialog>' +
    '<div class="xp-stage" id="xpStage" hidden><div class="xp-card" role="dialog" aria-modal="true" aria-labelledby="xpCardT"><div class="xp-burst" id="xpCardIc" aria-hidden="true"></div><div class="xp-cardt" id="xpCardT"></div><p class="xp-cards" id="xpCardS"></p><button class="btn primary" type="button" id="xpCardGo"></button></div></div>');
  const st = document.createElement('style');
  st.textContent = '.xp-btn { display: inline-flex; align-items: center; gap: 7px; font-weight: 800; color: var(--accent-ink, var(--accent)); border-color: var(--accent); background: color-mix(in srgb, var(--accent) 12%, var(--panel)); }' +
    '.xp-btn.in-crumb { margin-left: auto; margin-right: 10px; padding: 3px 11px; min-height: 34px; flex: none; }' +
    '.workspace-crumb .xp-btn ~ .status { margin-left: 0; } .xp-dlg form > * { flex: none; } .xp-dlg form:focus-visible { outline: none; }' +
    '.xp-pet { font-size: 1.15rem; line-height: 1; display: inline-block; } .xp-fire { font-size: .78rem; color: var(--fg); }' +
    '.xp-mini { width: 46px; height: 7px; border-radius: 99px; background: color-mix(in srgb, var(--accent) 18%, transparent); overflow: hidden; display: inline-block; } .xp-mini i { display: block; height: 100%; width: 0; background: var(--accent); border-radius: 99px; transition: width .6s ease; }' +
    '.xp-btn.bump .xp-pet { animation: xp-hop .6s ease; } .xp-btn.bump { animation: xp-glow .8s ease; }' +
    '@keyframes xp-hop { 30% { transform: translateY(-9px) rotate(-12deg) scale(1.25); } 60% { transform: translateY(0) rotate(8deg); } }' +
    '@keyframes xp-glow { 40% { box-shadow: 0 0 0 5px color-mix(in srgb, var(--accent) 35%, transparent); } }' +
    '.xp-float { position: fixed; z-index: 90; pointer-events: none; font-weight: 900; font-size: 1.05rem; color: var(--accent-ink, var(--accent)); background: var(--panel); padding: 2px 10px; border-radius: 99px; box-shadow: 0 4px 14px rgba(0,0,0,.2); animation: xp-up 1.25s ease-out forwards; white-space: nowrap; }' +
    '@keyframes xp-up { 0% { transform: translate(-50%, 0) scale(.7); opacity: 0; } 18% { transform: translate(-50%, -14px) scale(1.12); opacity: 1; } 100% { transform: translate(-50%, -66px) scale(1); opacity: 0; } }' +
    '.xp-dlg { width: min(480px, calc(100vw - 32px)); } .xp-dlg form { max-height: 84vh; overflow: auto; }' +
    '.xp-top { display: flex; align-items: center; gap: 14px; } .xp-petbig { font-size: 3.2rem; line-height: 1; } .xp-big { font-size: 1.7rem; font-weight: 900; font-family: var(--f-mono); color: var(--accent-ink, var(--accent)); line-height: 1.1; } .xp-name { font-weight: 700; }' +
    '.xp-today { margin: 0; font-weight: 700; font-size: .86rem; }' +
    '.xp-track { height: 12px; border-radius: 99px; background: var(--line-soft); overflow: hidden; } .xp-track i { display: block; height: 100%; width: 0; background: var(--accent); border-radius: 99px; transition: width .8s ease; } .xp-track.quest i { background: var(--c-rest-dot); }' +
    '.xp-album { display: grid; grid-template-columns: repeat(auto-fill, minmax(44px, 1fr)); gap: 6px; } .xp-st { aspect-ratio: 1; display: grid; place-items: center; font-size: 1.45rem; border-radius: 10px; background: var(--panel-2); position: relative; } .xp-st.none { filter: grayscale(1); opacity: .22; } .xp-st.rare { box-shadow: inset 0 0 0 2px #5b8def; } .xp-st.legend { box-shadow: inset 0 0 0 2px #e0a100; background: color-mix(in srgb, #e0a100 16%, var(--panel-2)); } .xp-st b { position: absolute; right: 3px; bottom: 1px; font-size: .62rem; }' +
    '.xp-badges { display: grid; grid-template-columns: repeat(auto-fill, minmax(124px, 1fr)); gap: 8px; }' +
    '.xp-badge { display: flex; flex-direction: column; gap: 2px; padding: 8px 10px; border-radius: 10px; background: var(--panel-2); font-size: .78rem; color: var(--fg); }' +
    '.xp-badge b { font-size: .86rem; } .xp-badge .ic { font-size: 1.4rem; line-height: 1; } .xp-badge.locked { opacity: .55; } .xp-badge.locked .ic { filter: grayscale(1); }' +
    '.xp-stage { position: fixed; inset: 0; z-index: 95; display: grid; place-items: center; background: rgba(10, 12, 20, .55); padding: 16px; } .xp-stage[hidden] { display: none; }' +
    '.xp-card { width: min(340px, 100%); background: var(--panel); color: var(--fg); border-radius: 22px; padding: 26px 22px 20px; text-align: center; box-shadow: 0 24px 70px rgba(0,0,0,.4); animation: xp-pop .45s cubic-bezier(.2,1.5,.4,1); background-color: var(--bg); background-image: linear-gradient(var(--panel), var(--panel)); }' +
    '@keyframes xp-pop { from { transform: scale(.6); opacity: 0; } to { transform: scale(1); opacity: 1; } }' +
    '.xp-burst { font-size: 4.6rem; line-height: 1.1; } .xp-burst.shake { animation: xp-shake .5s ease-in-out infinite; cursor: pointer; } .xp-burst.reveal { animation: xp-reveal .6s cubic-bezier(.2,1.7,.4,1); }' +
    '@keyframes xp-shake { 25% { transform: rotate(-9deg); } 75% { transform: rotate(9deg); } } @keyframes xp-reveal { from { transform: scale(0) rotate(-40deg); } to { transform: scale(1) rotate(0); } }' +
    '.xp-cardt { font-size: 1.3rem; font-weight: 900; margin-top: 8px; } .xp-cards { margin: 6px 0 16px; font-size: .9rem; color: var(--muted); }' +
    'body.xp-off .xp-mini, body.xp-off .xp-lv, body.xp-off .xp-fire, body.xp-off .xp-pet { display: none; } body.xp-off .xp-btn { color: inherit; background: var(--panel); border-color: var(--line); font-weight: 500; } body.xp-off .xp-btn::after { content: "成就"; }' +
    '@media (prefers-reduced-motion: reduce) { .xp-track i, .xp-mini i { transition: none; } .xp-btn.bump, .xp-btn.bump .xp-pet, .xp-float, .xp-card, .xp-burst.shake, .xp-burst.reveal { animation: none; } }';
  document.head.appendChild(st);

  function paint() {
    document.body.classList.toggle('xp-off', !on());
    if (!stats) return;
    const s = stats, lo = s.level > 1 ? need(s.level - 1) : 0, hi = need(s.level), pct = Math.round((s.xp - lo) / (hi - lo) * 100), pet = petOf(s.level);
    btn.querySelector('.xp-pet').textContent = pet[1]; btn.querySelector('.xp-lv').textContent = 'Lv ' + s.level; btn.querySelector('.xp-mini i').style.width = pct + '%';
    const fire = btn.querySelector('.xp-fire'); fire.hidden = !s.streak; fire.textContent = '🔥' + s.streak;
    btn.title = 'Lv ' + s.level + '「' + titleOf(s.level) + '」 · ' + s.xp + ' XP · 夥伴：' + pet[2];
    document.getElementById('xpPet').textContent = pet[1];
    document.getElementById('xpLevel').textContent = 'Lv ' + s.level;
    document.getElementById('xpName').textContent = titleOf(s.level) + ' · ' + s.xp + ' XP';
    document.getElementById('xpFill').style.width = pct + '%';
    const nextPet = PETS.find(([n]) => n > s.level);
    document.getElementById('xpNext').textContent = '再 ' + (hi - s.xp) + ' XP 升到 Lv ' + (s.level + 1) + (TITLES.find(([n]) => n === s.level + 1) ? '「' + titleOf(s.level + 1) + '」' : '') + (nextPet ? '；Lv ' + nextPet[0] + ' 時夥伴會變成 ' + nextPet[1] : '');
    document.getElementById('xpToday').textContent = '今天：完成 ' + s.todayDone + ' 格，+' + s.todayXp + ' XP' + (s.overLimit ? '（已超過每日上限，今天夠了 🌙）' : '');
    const q = s.quest, qp = Math.min(100, Math.round(q.done / q.target * 100));
    document.getElementById('xpQuest').style.width = qp + '%';
    document.getElementById('xpQuestTxt').textContent = q.done >= q.target ? '這週任務完成了（' + q.done + ' / ' + q.target + ' 個方塊）🎉 多做的都是額外的。' :
      '這週完成 ' + q.target + ' 個方塊（比上週多一點點）：' + q.done + ' / ' + q.target + (q.target - q.done <= 2 ? '，就差 ' + (q.target - q.done) + ' 個！' : '');
    document.getElementById('xpStreak').textContent = (s.streak ? '🔥 現在連續 ' + s.streak + ' 天達標' : '還沒有連續紀錄，今天完成 7 成就開始') + '，最長 ' + s.best + ' 天。' +
      '每週有一張「休息券」：有一天沒達標，不會打斷連續紀錄' + (s.passUsed ? '（這週的已經用掉了）。' : '（這週還沒用）。');
    const owned = new Map(); s.album.forEach(x => owned.set(x[0], (owned.get(x[0]) || 0) + 1));
    document.getElementById('xpAlbumN').textContent = owned.size + ' / ' + STICKERS.length;
    document.getElementById('xpChestHint').textContent = '每完成 5 個方塊開一個寶箱，再 ' + (5 - s.done % 5) + ' 個就有下一個。藍框稀有、金框傳說。';
    document.getElementById('xpAlbum').innerHTML = STICKERS.map(x => owned.has(x[0]) ? '<div class="xp-st ' + x[2] + '" title="' + x[1] + '（' + RARITY[x[2]] + '）">' + x[0] + (owned.get(x[0]) > 1 ? '<b>×' + owned.get(x[0]) + '</b>' : '') + '</div>' : '<div class="xp-st none" title="還沒拿到">❔</div>').join('');
    document.getElementById('xpCount').textContent = s.badges.length + ' / ' + BADGES.length;
    document.getElementById('xpBadges').innerHTML = BADGES.map(([id, ic, name, how]) => '<div class="xp-badge' + (s.badges.includes(id) ? '' : ' locked') + '"><span class="ic">' + ic + '</span><b>' + name + '</b><span>' + how + '</span></div>').join('');
    document.getElementById('xpOn').checked = on(); document.getElementById('xpSnd').checked = ls.get(MUTE) !== '1';
    for (const [i, d] of [[0, 0], [1, 5]]) { const h = health(d); document.getElementById('xpMax' + i).value = h.maxStudy ? h.maxStudy / 60 : ''; document.getElementById('xpBed' + i).value = h.bed; }
    document.getElementById('xpNote').value = health(0).note; document.getElementById('xpNoXp').checked = health(0).noXp;
  }

  /* ---------- celebrations: a queue of cards, one at a time; a chest has to be tapped open ---------- */
  const queue = []; let showing = false;
  const chime = notes => { if (ls.get(MUTE) === '1') return; try { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return; const c = playChime.ctx || (playChime.ctx = new AC()); if (c.state === 'suspended') c.resume(); const t0 = c.currentTime + .03;
    notes.forEach(([f, dt, len]) => { const o = c.createOscillator(), g = c.createGain(); o.type = 'triangle'; o.frequency.value = f; g.gain.setValueAtTime(.0001, t0 + dt); g.gain.exponentialRampToValueAtTime(.16, t0 + dt + .01); g.gain.exponentialRampToValueAtTime(.0001, t0 + dt + len); o.connect(g); g.connect(c.destination); o.start(t0 + dt); o.stop(t0 + dt + len + .02); }); } catch (e) {} };
  const party = n => { if (!motion() || typeof burst !== 'function') return; for (let i = 0; i < n; i++) setTimeout(() => { try { burst(innerWidth * (.25 + Math.random() * .5), innerHeight * (.2 + Math.random() * .3)); } catch (e) {} }, i * 170); };
  function nextCard() {
    const c = queue.shift(), stage = document.getElementById('xpStage');
    if (!c) { showing = false; stage.hidden = true; return; }
    showing = true; stage.hidden = false;
    const ic = document.getElementById('xpCardIc'), go = document.getElementById('xpCardGo');
    const show = (icon, title, sub, label, cls) => { ic.className = 'xp-burst' + (cls ? ' ' + cls : ''); ic.textContent = icon; document.getElementById('xpCardT').textContent = title; document.getElementById('xpCardS').textContent = sub; go.textContent = label; const card = stage.querySelector('.xp-card'); card.style.animation = 'none'; void card.offsetWidth; card.style.animation = ''; go.focus({ preventScroll: true }); };
    if (c.chest) {
      show('🎁', '寶箱出現了！', '完成 5 個方塊的獎勵，打開看看是什麼？', '打開寶箱', 'shake');
      go.onclick = ic.onclick = () => {
        ic.onclick = null; const x = c.chest;
        show(x[0], x[1], RARITY[x[2]] + '貼紙，已收進圖鑑。' + (x[2] === 'legend' ? ' 太幸運了！' : ''), '收下', 'reveal');
        chime(x[2] === 'common' ? [[659, 0, .2], [880, .1, .35]] : [[659, 0, .2], [880, .1, .2], [1175, .2, .2], [1568, .3, .5]]); party(x[2] === 'common' ? 1 : 4);
        go.onclick = nextCard;
      };
    } else { show(c.icon, c.title, c.sub, '太好了', 'reveal'); chime([[523, 0, .2], [659, .12, .2], [784, .24, .2], [1047, .36, .5]]); party(c.big ? 5 : 2); go.onclick = nextCard; }
  }
  const enqueue = c => { queue.push(c); if (!showing) nextCard(); };
  /* remember where we are without any fuss (first load, or rewards switched off) */
  function settle() {
    if (firstDone) return; firstDone = true;
    if (!stats) return;
    let seen = null; try { seen = JSON.parse(ls.get(SEEN) || 'null'); } catch (e) {}
    if (!seen) ls.set(SEEN, JSON.stringify({ level: stats.level, badges: stats.badges }));
    if (ls.get(CHEST) === null) ls.set(CHEST, String(stats.chests));
  }
  function celebrate() {
    if (!stats) return; settle();
    let seen = null; try { seen = JSON.parse(ls.get(SEEN) || 'null'); } catch (e) {}
    const opened = Number(ls.get(CHEST)) || 0, up = seen && stats.level > seen.level;
    const newB = seen ? BADGES.filter(b => stats.badges.includes(b[0]) && !seen.badges.includes(b[0])) : [];
    ls.set(SEEN, JSON.stringify({ level: Math.max(stats.level, seen?.level || 0), badges: [...new Set([...stats.badges, ...(seen?.badges || [])])] }));
    if (stats.chests > opened) ls.set(CHEST, String(stats.chests));   // a chest opens once, even if a block is un-ticked and ticked again
    if (!on()) return;
    if (up) { const a = petOf(seen.level), b = petOf(stats.level), grew = a[0] !== b[0];
      enqueue({ icon: b[1], title: '升級！Lv ' + stats.level + '「' + titleOf(stats.level) + '」', sub: grew ? '你的夥伴從 ' + a[1] + ' 長大成 ' + b[1] + ' ' + b[2] + ' 了！' : '繼續一格一格累積。', big: grew }); }
    for (const x of newB) enqueue({ icon: x[1], title: '新成就：' + x[2], sub: x[3] + ' · +50 XP' });
    for (let i = opened; i < stats.chests; i++) enqueue({ chest: stickerOf(i) });
  }
  function floatAt(el, text) {
    if (!motion()) return;
    const r = el?.getBoundingClientRect?.(), x = r && r.width ? r.left + r.width / 2 : innerWidth / 2, y = r && r.width ? r.top + 6 : innerHeight / 2;
    const f = Object.assign(document.createElement('div'), { className: 'xp-float', textContent: text }); f.style.left = x + 'px'; f.style.top = y + 'px';
    document.body.appendChild(f); setTimeout(() => f.remove(), 1300);
  }
  btn.addEventListener('click', () => { paint(); document.getElementById('xpDlg').showModal(); if (!stats) refresh(true); });
  document.getElementById('xpOn').addEventListener('change', e => { ls.set(OFF, e.target.checked ? '0' : '1'); paint(); });
  document.getElementById('xpSnd').addEventListener('change', e => ls.set(MUTE, e.target.checked ? '0' : '1'));
  const saveHealth = () => {
    if (!state.config) state.config = {};
    const hours = id => { const m = Math.max(0, Math.min(24, Number(document.getElementById(id).value) || 0)); return Math.round(m * 60); };
    state.config.health = { max: [hours('xpMax0'), hours('xpMax1')], bed: [document.getElementById('xpBed0').value || '', document.getElementById('xpBed1').value || ''], noXp: document.getElementById('xpNoXp').checked, note: document.getElementById('xpNote').value.trim().slice(0, 60) };
    saveConfig(); later(); seedNudges();
  };
  for (const id of ['xpMax0', 'xpMax1', 'xpBed0', 'xpBed1', 'xpNote', 'xpNoXp']) document.getElementById(id).addEventListener('change', saveHealth);

  /* ---------- hooks into A: finishing, missing, saving ---------- */
  const done0 = toggleDone;
  window.toggleDone = toggleDone = function (id) {
    const before = state.week.blocks.find(x => x.id === id)?.done;
    const r = done0.apply(this, arguments);
    const b = state.week.blocks.find(x => x.id === id);
    if (on() && b && b.done && !before) {
      const date = ymd(addDays(state.monday, b.day)), day = state.week.blocks.filter(x => x.day === b.day && !x.skipped);
      const hb = health(b.day), limit = hb.noXp ? hb.maxStudy : 0, others = day.filter(x => x.done && x.id !== b.id && counts(x) && toMin(x.start) <= toMin(b.start)).reduce((a, x) => a + x.minutes, 0), over = limit > 0 && counts(b) && others >= limit;
      const k = day.filter(x => x.done && toMin(x.start) <= toMin(b.start)).length, gain = over ? 0 : blockXp(b) + comboXp(k);
      const today = date === ymd(new Date()), left = day.filter(x => !x.done && counts(x)).length;
      const extra = over ? ' 超過你設的上限了，這格不加 XP。' + (hb.note || '今天夠了 🌙') :
        ' +' + gain + ' XP · ' + (k > 1 ? '連擊 ×' + k + ' · ' : '') + CHEERS[Math.floor(Math.random() * CHEERS.length)] + (today && counts(b) ? (left === 0 ? '，今天的都完成了！' : left === 1 ? '，今天再 1 個就全部完成' : '') : '');
      const t = document.getElementById('toastText'); if (t && !document.getElementById('toast').hidden) t.textContent += extra;
      if (!over) floatAt(document.querySelector('[data-bid="' + b.id + '"]') || document.querySelector('[data-wdone="' + b.id + '"]'), '+' + gain + ' XP' + (k > 1 ? ' ×' + k : ''));
      btn.classList.remove('bump'); void btn.offsetWidth; btn.classList.add('bump');
      chime([[784, 0, .12], [1047, .07, .22]]);
    }
    return r;
  };
  if (typeof toggleFail === 'function') {
    const fail0 = toggleFail;
    window.toggleFail = toggleFail = function (id) {
      const r = fail0.apply(this, arguments);
      const b = state.week.blocks.find(x => x.id === id), t = document.getElementById('toastText');
      if (b?.failed && t) t.textContent = '「' + b.name + '」記為沒做完。沒關係，記下來就是在面對它；之後按「重排沒做完的」補上就好。';
      return r;
    };
  }
  /* gentle words when a plan goes past the daily limit or bedtime: once for each excess, not again on every save */
  const told = new Set();
  function excess() {
    const out = [], wk = ymd(state.monday);
    for (let d = 0; d < 7; d++) {
      const h = health(d), bed = /^\d\d:\d\d$/.test(h.bed) ? toMin(h.bed) : 0, tail = h.note ? ' ' + h.note : '';
      const l = state.week.blocks.filter(b => b.day === d && !b.skipped), st = l.filter(counts).reduce((a, b) => a + b.minutes, 0);
      if (h.maxStudy > 0 && st > h.maxStudy) out.push([wk + '|max|' + d, '週' + DAYN[d] + '排了 ' + (st / 60).toFixed(1) + ' 小時讀書，超過你設的 ' + (h.maxStudy / 60) + ' 小時。' + tail]);
      // a bedtime after midnight would be a morning hour: only an evening bedtime can be passed by a block
      if (bed >= 18 * 60) for (const b of l) if (b.cat !== 'rest' && toMin(b.start) + b.minutes > bed) out.push([wk + '|bed|' + d + '|' + b.id, '「' + b.name + '」排到你設的睡覺時間 ' + h.bed + ' 以後了。' + tail]);
    }
    return out;
  }
  function seedNudges() { try { excess().forEach(([k]) => told.add(k)); } catch (e) {} }
  const save0 = saveWeek;
  window.saveWeek = saveWeek = function () {
    const r = save0.apply(this, arguments); later();
    try { const fresh = excess().filter(([k]) => !told.has(k)); fresh.forEach(([k]) => told.add(k)); if (fresh.length && on()) setTimeout(() => toast(fresh.slice(0, 2).map(x => x[1]).join(' ')), 500); } catch (e) {}
    return r;
  };

  /* ---------- a new week is a fresh start ---------- */
  function freshStart() {
    const wk = ymd(mondayOf(new Date()));
    if (ls.get(FRESH) === wk) return;
    const first = ls.get(FRESH) === null; ls.set(FRESH, wk);
    if (first || !on()) return;
    setTimeout(() => toast('新的一週開始了 🌱 上週的事不算數，這週從 0 開始累積。本週任務：' + (stats ? stats.quest.target : 5) + ' 個方塊。'), 2500);
  }
  (function wait(n) {
    if (state.db && state.ready !== false) { seedNudges(); refresh(true).then(freshStart); return; }
    if (n < 120) setTimeout(() => wait(n + 1), 500);
  })(0);
  paint();
})();
