/* 步調 Pace: rewards that help you keep going, built on what motivation research says works — and nothing that works by guilt.
   - Small wins (progress principle): every finished block gives XP, shown right away, and XP adds up to levels.
   - Competence (self-determination theory): achievements for real behaviour (first block, streaks, rest kept, reflections…).
   - Goal gradient: a weekly quest set a little above last week, with a bar that fills; "one more to go" when you are close.
   - Forgiving streaks: one rest pass per week keeps a streak alive through one bad day (all-or-nothing streaks make people quit).
   - Fresh start effect: a new week is announced as a clean start. Self-compassion: a missed block gets a kind word, not a scolding.
   - Autonomy: everything here can be switched off; there are no streak-loss warnings, timers or pressure pop-ups.
   XP is calculated from your saved blocks every time (not stored), so un-ticking a block takes its XP back and nothing can be farmed,
   and the numbers are the same on every device. Works in A and C (uses A's own functions). */
(() => {
  if (typeof state === 'undefined' || typeof toggleDone !== 'function' || typeof blocksInRange !== 'function') return;
  const OFF = 'pace-rewards-off', SEEN = 'pace-rewards-seen', FRESH = 'pace-fresh-week';
  const ls = { get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} } };
  const on = () => ls.get(OFF) !== '1';
  const blockXp = b => 10 + Math.floor((Number(b.minutes) || 0) / 10) * 2;
  const TITLES = [[1, '新手'], [3, '起步者'], [5, '穩定前進'], [8, '專注者'], [12, '自律達人'], [18, '時間大師'], [25, '傳奇']];
  const titleOf = lv => TITLES.filter(([n]) => lv >= n).pop()[1];
  const need = lv => 25 * lv * (lv + 1);   // XP needed to reach level lv + 1
  const levelOf = xp => { let lv = 1; while (xp >= need(lv)) lv++; return lv; };
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
  let stats = null, busy = false, again = false, timer = 0;

  async function compute() {
    if (!state.db) return null;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const from = addDays(mondayOf(today), -7 * 52), now = new Date();
    const all = await blocksInRange(from, addDays(mondayOf(today), 6));
    const s = { done: 0, xp: 0, early: 0, rest: 0, reflect: 0, studyMin: 0, best: 0, streak: 0, passUsed: false, week80: false, comeback: false };
    const byDay = {}, byWeek = {};
    let lastDone = null;
    for (const b of all.sort((a, c) => a.date.localeCompare(c.date) || toMin(a.start) - toMin(c.start))) {
      if (b.skipped) continue;
      const wk = ymd(mondayOf(new Date(b.date + 'T00:00:00'))), w = byWeek[wk] || (byWeek[wk] = { done: 0, due: 0 });
      if (b.reflection?.text) s.reflect++;
      if (counts(b)) { const v = byDay[b.date] || (byDay[b.date] = { p: 0, d: 0 }); v.p += b.minutes; if (b.done) v.d += b.minutes; }
      if (b.done || b.failed || blockEnd(b.date, b) <= now) w.due++;
      if (!b.done) continue;
      w.done++; s.done++; s.xp += blockXp(b);
      if (toMin(b.start) < 9 * 60) s.early++;
      if (b.cat === 'rest') s.rest++;
      if (counts(b)) s.studyMin += b.minutes;
      if (lastDone && (new Date(b.date) - new Date(lastDone)) / 864e5 >= 4) s.comeback = true;
      lastDone = b.date;
    }
    // weekly quest: a little more than last week (at least 5); reaching it is worth 30 XP
    const weeks = Object.keys(byWeek).sort();
    const target = wk => { const prev = byWeek[ymd(addDays(new Date(wk + 'T00:00:00'), -7))]; return Math.max(5, Math.min(40, (prev ? prev.done : 0) + 2)); };
    for (const wk of weeks) { const w = byWeek[wk]; if (w.done >= target(wk)) s.xp += 30; if (w.due >= 5 && w.done / w.due >= .8) s.week80 = true; }
    const thisWk = ymd(mondayOf(today));
    s.quest = { target: target(thisWk), done: byWeek[thisWk]?.done || 0 };
    // forgiving streak: days with planned study count when 7/10 of it is done; one missed day per Mon–Sun week is forgiven
    const pass = {}; let run = 0;
    for (let d = new Date(from); d <= today; d = addDays(d, 1)) {
      const k = ymd(d), v = byDay[k], wk = ymd(mondayOf(d));
      if (!v || !v.p) continue;
      if (v.d / v.p >= .7) { run++; }
      else if (k === ymd(today)) { /* today is not over */ }
      else if (!pass[wk] && run > 0) { pass[wk] = true; }
      else run = 0;
      s.best = Math.max(s.best, run);
    }
    s.streak = run; s.passUsed = !!pass[thisWk];
    s.badges = BADGES.filter(x => x[4](s)).map(x => x[0]);
    s.xp += s.badges.length * 50;
    s.level = levelOf(s.xp);
    s.today = (() => { const k = ymd(today), l = all.filter(b => b.date === k && !b.skipped && counts(b)); return { left: l.filter(b => !b.done).length, total: l.length }; })();
    return s;
  }
  async function refresh(quiet) {
    if (busy) { again = true; return; }
    busy = true;
    try { const s = await compute(); if (s) { stats = s; paint(); if (!quiet) celebrate(); } } catch (e) {}
    busy = false;
    if (again) { again = false; refresh(quiet); }
  }
  const later = () => { clearTimeout(timer); timer = setTimeout(() => refresh(false), 1200); };

  /* ---------- the header button and the dialog ---------- */
  const btn = Object.assign(document.createElement('button'), { type: 'button', className: 'btn xp-btn', id: 'xpBtn' });
  btn.innerHTML = '<span class="xp-lv">Lv 1</span><span class="xp-mini"><i></i></span>';
  btn.title = '等級與成就';
  const host = document.getElementById('skinBtn'); if (host) host.before(btn); else return;
  document.body.insertAdjacentHTML('beforeend',
    '<dialog id="xpDlg" class="xp-dlg" aria-labelledby="xpTitle"><form method="dialog">' +
      '<div class="dtitle" id="xpTitle">等級與成就</div>' +
      '<div class="xp-top"><div class="xp-big" id="xpLevel"></div><div class="xp-name" id="xpName"></div></div>' +
      '<div class="xp-track"><i id="xpFill"></i></div><p class="hint" id="xpNext" style="margin:0"></p>' +
      '<h3 class="set-h">本週任務</h3><div class="xp-track quest"><i id="xpQuest"></i></div><p class="hint" id="xpQuestTxt" style="margin:0"></p>' +
      '<h3 class="set-h">連續達標</h3><p class="hint" id="xpStreak" style="margin:0"></p>' +
      '<h3 class="set-h">成就 <span class="count" id="xpCount"></span></h3><div class="xp-badges" id="xpBadges"></div>' +
      '<label class="check"><input type="checkbox" id="xpOn"> 顯示獎勵（關掉後不會跳出升級和成就，也不顯示 XP）</label>' +
      '<p class="hint" style="margin:0">XP 是用你完成的方塊算出來的：每完成一格 10 分起，越長越多；達成本週任務 +30、拿到成就 +50。取消打勾會扣回來，所以沒辦法刷分，每台裝置看到的都一樣。</p>' +
      '<div class="actions"><button class="btn primary" value="ok">關閉</button></div>' +
    '</form></dialog>');
  const st = document.createElement('style');
  st.textContent = '.xp-btn { display: inline-flex; align-items: center; gap: 8px; font-weight: 700; }' +
    '.xp-mini { width: 38px; height: 6px; border-radius: 99px; background: var(--line-soft); overflow: hidden; display: inline-block; } .xp-mini i { display: block; height: 100%; width: 0; background: var(--accent); border-radius: 99px; transition: width .6s ease; }' +
    '.xp-dlg { width: min(460px, calc(100vw - 32px)); } .xp-dlg form { max-height: 84vh; overflow: auto; }' +
    '.xp-top { display: flex; align-items: baseline; gap: 12px; } .xp-big { font-size: 2rem; font-weight: 900; font-family: var(--f-mono); color: var(--accent); } .xp-name { font-weight: 700; }' +
    '.xp-track { height: 10px; border-radius: 99px; background: var(--line-soft); overflow: hidden; } .xp-track i { display: block; height: 100%; width: 0; background: var(--accent); border-radius: 99px; transition: width .8s ease; } .xp-track.quest i { background: var(--c-rest-dot); }' +
    '.xp-badges { display: grid; grid-template-columns: repeat(auto-fill, minmax(124px, 1fr)); gap: 8px; }' +
    '.xp-badge { display: flex; flex-direction: column; gap: 2px; padding: 8px 10px; border-radius: 10px; background: var(--panel-2); font-size: .78rem; color: var(--fg); }' +
    '.xp-badge b { font-size: .86rem; } .xp-badge .ic { font-size: 1.4rem; line-height: 1; } .xp-badge.locked { opacity: .55; } .xp-badge.locked .ic { filter: grayscale(1); }' +
    'body.xp-off .xp-mini, body.xp-off .xp-lv { display: none; } body.xp-off .xp-btn::after { content: "成就"; }' +
    '@media (prefers-reduced-motion: reduce) { .xp-track i, .xp-mini i { transition: none; } }';
  document.head.appendChild(st);

  function paint() {
    document.body.classList.toggle('xp-off', !on());
    if (!stats) return;
    const s = stats, lo = s.level > 1 ? need(s.level - 1) : 0, hi = need(s.level), pct = Math.round((s.xp - lo) / (hi - lo) * 100);
    btn.querySelector('.xp-lv').textContent = 'Lv ' + s.level; btn.querySelector('.xp-mini i').style.width = pct + '%';
    btn.title = 'Lv ' + s.level + '「' + titleOf(s.level) + '」 · ' + s.xp + ' XP';
    document.getElementById('xpLevel').textContent = 'Lv ' + s.level;
    document.getElementById('xpName').textContent = titleOf(s.level) + ' · ' + s.xp + ' XP';
    document.getElementById('xpFill').style.width = pct + '%';
    document.getElementById('xpNext').textContent = '再 ' + (hi - s.xp) + ' XP 升到 Lv ' + (s.level + 1) + (TITLES.find(([n]) => n === s.level + 1) ? '「' + titleOf(s.level + 1) + '」' : '');
    const q = s.quest, qp = Math.min(100, Math.round(q.done / q.target * 100));
    document.getElementById('xpQuest').style.width = qp + '%';
    document.getElementById('xpQuestTxt').textContent = q.done >= q.target ? '這週任務完成了（' + q.done + ' / ' + q.target + ' 個方塊）🎉 多做的都是額外的。' :
      '這週完成 ' + q.target + ' 個方塊（比上週多一點點）：' + q.done + ' / ' + q.target + (q.target - q.done <= 2 ? '，就差 ' + (q.target - q.done) + ' 個！' : '');
    document.getElementById('xpStreak').textContent = (s.streak ? '現在連續 ' + s.streak + ' 天達標' : '還沒有連續紀錄，今天完成 7 成就開始') + '，最長 ' + s.best + ' 天。' +
      '每週有一張「休息券」：有一天沒達標，不會打斷連續紀錄' + (s.passUsed ? '（這週的已經用掉了）。' : '（這週還沒用）。');
    document.getElementById('xpCount').textContent = s.badges.length + ' / ' + BADGES.length;
    document.getElementById('xpBadges').innerHTML = BADGES.map(([id, ic, name, how]) => '<div class="xp-badge' + (s.badges.includes(id) ? '' : ' locked') + '"><span class="ic">' + ic + '</span><b>' + name + '</b><span>' + how + '</span></div>').join('');
    document.getElementById('xpOn').checked = on();
  }
  function celebrate() {
    if (!stats) return;
    let seen = null; try { seen = JSON.parse(ls.get(SEEN) || 'null'); } catch (e) {}
    ls.set(SEEN, JSON.stringify({ level: stats.level, badges: stats.badges }));
    if (!seen || !on()) return;   // the first time: what you already had is not news
    const newB = BADGES.filter(b => stats.badges.includes(b[0]) && !seen.badges.includes(b[0]));
    const up = stats.level > seen.level;
    if (!up && !newB.length) return;
    const msg = (up ? '升級到 Lv ' + stats.level + '「' + titleOf(stats.level) + '」！' : '') + (newB.length ? ' 新成就：' + newB.map(b => b[1] + ' ' + b[2]).join('、') : '');
    setTimeout(() => {
      toast(msg.trim());
      try { if (typeof burst === 'function' && (typeof fxOn === 'undefined' || fxOn)) burst(innerWidth / 2, innerHeight / 3); } catch (e) {}
    }, 900);
  }
  btn.addEventListener('click', () => { paint(); document.getElementById('xpDlg').showModal(); if (!stats) refresh(true); });
  document.getElementById('xpOn').addEventListener('change', e => { ls.set(OFF, e.target.checked ? '0' : '1'); paint(); });

  /* ---------- hooks into A: finishing, missing, saving ---------- */
  const done0 = toggleDone;
  window.toggleDone = toggleDone = function (id) {
    const before = state.week.blocks.find(x => x.id === id)?.done;
    const r = done0.apply(this, arguments);
    const b = state.week.blocks.find(x => x.id === id);
    if (on() && b && b.done && !before) {
      const today = ymd(new Date()), mine = state.week.blocks.filter(x => ymd(addDays(state.monday, x.day)) === today && !x.skipped && counts(x));
      const left = mine.filter(x => !x.done).length;
      const extra = ' +' + blockXp(b) + ' XP · ' + CHEERS[Math.floor(Math.random() * CHEERS.length)] + (mine.includes(b) ? (left === 0 ? '，今天的都完成了！' : left === 1 ? '，今天再 1 個就全部完成' : '') : '');
      const t = document.getElementById('toastText'); if (t && !document.getElementById('toast').hidden) t.textContent += extra;
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
  const save0 = saveWeek;
  window.saveWeek = saveWeek = function () { const r = save0.apply(this, arguments); later(); return r; };

  /* ---------- a new week is a fresh start ---------- */
  function freshStart() {
    const wk = ymd(mondayOf(new Date()));
    if (ls.get(FRESH) === wk) return;
    const first = ls.get(FRESH) === null; ls.set(FRESH, wk);
    if (first || !on()) return;
    setTimeout(() => toast('新的一週開始了 🌱 上週的事不算數，這週從 0 開始累積。本週任務：' + (stats ? stats.quest.target : 5) + ' 個方塊。'), 2500);
  }
  (function wait(n) {
    if (state.db && state.ready !== false) { refresh(true).then(freshStart); return; }
    if (n < 120) setTimeout(() => wait(n + 1), 500);
  })(0);
  paint();
})();
