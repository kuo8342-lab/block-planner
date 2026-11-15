/* Guards for the things a time grid cannot see. Works in A (方塊週排程) and C (步調 Pace).
   1. 特別的一天: a dated event must say who has to agree (school, dorm, cram school, parents) or state that nobody does.
      Each named party becomes a task due a week ahead; the event and a bar at the top stay red until those tasks are ticked.
   2. 每日檢查: from 18:00, once a day, one question that has to be answered: is there anything in the next seven days that needs someone's OK?
   3. 收尾: at 22:45 the night warning asks for one line, "what comes next", and saves it as tomorrow's task, so stopping is safe.
   Data: config.special[].approvals = [{ who, taskId }] / noApproval, tasks[].approvalFor, config.lookCheck = { date, answer }.
   4. 時間校正: a new study block is stretched or shortened by how long that subject really took in the focus timer (done blocks with 實際時間, last 6 weeks, at least 3).
   5. 上限保護: a 4th study block after 18:00, or a week planned above 1.15 x what was actually finished last week, is taken back out and has to be confirmed.
   6. 程式閘門: the focus timer will not start a 程式 block until today's first other study block is ticked.
   Each one has a switch in Settings. In A they are on; in C (other people use it) the ones that interrupt or refuse are off until switched on.
   Loaded last by build-a.js and build-c.js. Nothing here runs in the test harness (runTests) or in the widget view. */
(() => {
  if (typeof state === 'undefined' || typeof renderGrid !== 'function' || typeof saveConfig !== 'function' || typeof saveTask !== 'function') return;
  const $ = id => document.getElementById(id);
  const inTests = () => typeof runTests === 'function';
  const today = () => ymd(new Date());
  const dayOf = date => new Date(date + 'T00:00:00');
  const wd = date => '週' + DAYN[(dayOf(date).getDay() + 6) % 7];
  const daysTo = date => Math.round((dayOf(date) - dayOf(today())) / 86400000);
  const WHO = ['導師／學務處（學校請假）', '宿舍（宿輔老師）', '補習班／資訊班', '家長'];
  const IS_A = !!window.GUARD_A;
  const DEF = { look: IS_A, wrap: IS_A, cap: IS_A, gate: IS_A, cal: true };
  const on = k => prefGet('guard-' + k, DEF[k] ? '1' : '0') === '1';
  const busy = () => !!document.querySelector('dialog[open]') || ($('alarm') && !$('alarm').hidden);

  document.head.insertAdjacentHTML('beforeend', `<style data-guard>
.guardbar { display: flex; flex-direction: column; gap: 4px; padding: 10px 14px; margin-bottom: 12px; border-radius: 12px; background: var(--c-exam); color: var(--c-exam-fg); font-size: .86rem; box-shadow: var(--shadow); }
.guardbar b { font-weight: 700; }
.guardbar .row { display: flex; flex-wrap: wrap; gap: 4px 10px; align-items: baseline; }
.guardbar .left { font-family: var(--f-mono); font-size: .76rem; }
.blk.fixed.need-ok { box-shadow: inset 0 0 0 2px var(--danger); }
.guard-who { display: flex; flex-direction: column; gap: 6px; border: 1px solid var(--line); border-radius: 10px; padding: 10px 12px; margin: 0; min-width: 0; }
.guard-who legend { font-size: .8rem; font-weight: 700; color: var(--fg); padding: 0 4px; }
.guard-who .sep { border-top: 1px dashed var(--line); margin: 2px 0; }
.guard-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; max-height: 40vh; overflow: auto; }
.guard-list li { display: grid; grid-template-columns: 86px minmax(0, 1fr); gap: 8px; align-items: baseline; padding: 7px 10px; border-radius: 9px; background: var(--panel-2); font-size: .86rem; }
.guard-list .when { font-family: var(--f-mono); font-size: .76rem; color: var(--muted); }
.guard-list .warn { color: var(--danger); font-weight: 700; }
.guard-why { margin: 0; font-size: .95rem; line-height: 1.6; }
.guard-q { margin: 0; font-size: 1rem; font-weight: 700; text-wrap: balance; }
</style>`);

  document.body.insertAdjacentHTML('beforeend', `
<dialog id="guardSpDlg" style="width:min(440px, calc(100vw - 32px))">
  <form method="dialog" id="guardSpForm">
    <div class="dtitle">特別的一天</div>
    <p class="hint" style="margin:0">考試、比賽、看醫生、家裡有事：只發生一次、會佔掉某一天的事。</p>
    <label>名稱<input id="gName" required placeholder="例如：英檢複試"></label>
    <div class="row2">
      <label>日期<input id="gDate" type="date" required></label>
      <label>類別<select id="gCat"></select></label>
    </div>
    <div class="row2">
      <label>開始<input id="gStart" type="time" step="300" required></label>
      <label>結束<input id="gEnd" type="time" step="300" required></label>
    </div>
    <label class="check"><input type="checkbox" id="gReplace" checked> 這段時間原本的固定行程（上課、補習…）不會去</label>
    <fieldset class="guard-who">
      <legend>這件事需要誰同意、要先跟誰講？（一定要選）</legend>
      <div id="gWho" style="display:flex;flex-direction:column;gap:6px"></div>
      <label class="check"><input type="checkbox" id="gOtherOn"> 其他：<input id="gOther" placeholder="誰" style="flex:1;min-width:0"></label>
      <div class="sep"></div>
      <label class="check"><input type="checkbox" id="gNone"> 不需要任何人同意</label>
    </fieldset>
    <p class="hint" style="margin:0">選了誰，就會多一個「先講並辦請假」的任務，期限在這一天的 7 天前。學校的事假要事前申請、核准了才算數。</p>
    <p class="hint" id="gErr" style="margin:0;color:var(--danger)" hidden></p>
    <div class="actions">
      <button class="btn" type="button" id="gCancel">取消</button>
      <button class="btn primary" type="submit">加入</button>
    </div>
  </form>
</dialog>
<dialog id="guardLookDlg" style="width:min(460px, calc(100vw - 32px))">
  <form method="dialog">
    <div class="dtitle">每日檢查：未來七天</div>
    <ul class="guard-list" id="gLookList"></ul>
    <p class="hint" id="gLookSun" style="margin:0" hidden>今天是週日：跟爸爸對一次下週的行程。</p>
    <p class="guard-q">未來七天，有沒有需要誰同意、或要先跟誰講的事？</p>
    <p class="hint" style="margin:0">想一下：考試、比賽、看醫生、家裡的事、學校活動、要早退或不在宿舍。</p>
    <div class="actions">
      <button class="btn" type="button" id="gLookNo">沒有，我想過了</button>
      <button class="btn primary" type="button" id="gLookYes">有，現在登記</button>
    </div>
  </form>
</dialog>
<dialog id="guardCapDlg" style="width:min(420px, calc(100vw - 32px))">
  <form method="dialog">
    <div class="dtitle">上限保護</div>
    <p class="guard-why" id="gCapWhy"></p>
    <p class="hint" style="margin:0">這個方塊先沒有加進去。排得比做得到的多，計畫就會每天失敗。可以先拿掉一個再加，或把已經排的做完。</p>
    <div class="actions">
      <button class="btn" type="button" id="gCapForce">還是要加</button>
      <button class="btn primary" type="button" id="gCapOk">好，不加</button>
    </div>
  </form>
</dialog>
<dialog id="guardWrapDlg" style="width:min(420px, calc(100vw - 32px))">
  <form method="dialog" id="guardWrapForm">
    <div class="dtitle">收尾</div>
    <p class="hint" style="margin:0">停在這裡。寫一句「明天接著做什麼」，明天打開就看得到，今天可以放心關掉。</p>
    <label>下一步<textarea id="gNext" rows="2" placeholder="例如：把第 3 題的迴圈改成 while，再跑一次測試"></textarea></label>
    <div class="actions">
      <button class="btn" type="button" id="gWrapSkip">沒有要記的</button>
      <button class="btn primary" type="submit">記下來，去睡</button>
    </div>
  </form>
</dialog>`);

  /* ---------- 1. who has to agree ---------- */
  const specials = () => state.config?.special || [];
  const taskOf = id => (state.tasks || []).find(t => t.id === id);
  // an approval counts as open while its task exists and is not ticked (a deleted task means the owner dropped it)
  const openApprovals = sp => (sp.approvals || []).filter(a => { const t = taskOf(a.taskId); return t && !t.done; });

  const bar = document.createElement('div');
  bar.className = 'guardbar'; bar.id = 'guardBar'; bar.hidden = true; bar.setAttribute('role', 'status');
  const night = $('nightBar'); if (night) night.parentNode.insertBefore(bar, night);

  function paintBar() {
    if (!state.tasksLoaded) { bar.hidden = true; return; }
    const t0 = today();
    const rows = specials().filter(sp => sp.date >= t0).map(sp => ({ sp, open: openApprovals(sp) })).filter(x => x.open.length).sort((a, b) => a.sp.date.localeCompare(b.sp.date)).slice(0, 4);
    bar.hidden = !rows.length;
    bar.innerHTML = rows.map(({ sp, open }) => {
      const n = daysTo(sp.date);
      return `<div class="row"><b>${md(sp.date)}（${wd(sp.date)}）${esc(sp.name)}</b><span>還沒講：${esc(open.map(a => a.who).join('、'))}</span><span class="left">${n === 0 ? '就是今天' : '剩 ' + n + ' 天'}</span></div>`;
    }).join('');
  }
  function paintGrid() {
    const need = new Map(specials().map(sp => [sp.id, openApprovals(sp).length]).filter(([, n]) => n));
    if (!need.size) return;
    document.querySelectorAll('#grid .blk.fixed[data-fixed]').forEach(el => {
      const n = need.get(el.dataset.fixed); if (!n) return;
      el.classList.add('need-ok');
      el.insertAdjacentHTML('beforeend', `<span class="miss">未講 ${n}</span>`);
    });
  }
  const grid0 = renderGrid;
  renderGrid = function () { const r = grid0.apply(this, arguments); try { paintGrid(); paintBar(); absorbSoon(); loadCap(); } catch (e) {} return r; };
  const tasks0 = renderTasks;
  renderTasks = function () { const r = tasks0.apply(this, arguments); try { paintBar(); } catch (e) {} return r; };

  const spDlg = $('guardSpDlg');
  $('gWho').innerHTML = WHO.map((w, i) => `<label class="check"><input type="checkbox" name="gWho" value="${i}">${w}</label>`).join('');
  function openSpecial() {
    $('guardSpForm').reset();
    $('gCat').innerHTML = catOptions('exam');
    $('gDate').min = today();
    $('gReplace').checked = true;
    $('gErr').hidden = true;
    spDlg.showModal();
  }
  window.guardNewSpecial = openSpecial;
  $('gCancel').addEventListener('click', () => spDlg.close());
  $('gOther').addEventListener('input', e => { if (e.target.value.trim()) $('gOtherOn').checked = true; });
  $('gNone').addEventListener('change', e => { if (e.target.checked) { document.querySelectorAll('#gWho input').forEach(x => { x.checked = false; }); $('gOtherOn').checked = false; } });
  spDlg.addEventListener('change', e => { if (e.target.name === 'gWho' || e.target.id === 'gOtherOn') { if (e.target.checked) $('gNone').checked = false; } });
  $('guardSpForm').addEventListener('submit', e => {
    e.preventDefault();
    const name = $('gName').value.trim(), date = $('gDate').value, start = $('gStart').value, end = $('gEnd').value, cat = $('gCat').value;
    const who = [...document.querySelectorAll('#gWho input:checked')].map(x => WHO[Number(x.value)]);
    const other = $('gOther').value.trim(); if ($('gOtherOn').checked && other) who.push(other);
    const none = $('gNone').checked;
    const err = !name ? '請填名稱' : !date ? '請選日期' : date < today() ? '這個日期已經過了' : !start || !end ? '請填開始和結束時間' : toMin(end) <= toMin(start) ? '結束時間要比開始晚'
      : $('gOtherOn').checked && !other ? '「其他」請寫是誰' : !who.length && !none ? '請選要先跟誰講；真的不用，就勾「不需要任何人同意」' : '';
    const errEl = $('gErr'); errEl.textContent = err; errEl.hidden = !err; if (err) return;
    if (!state.config) state.config = { modules: [], fixed: [], special: [] };
    const id = 'sp-' + uid(), day = (dayOf(date).getDay() + 6) % 7;
    const replaces = $('gReplace').checked ? (state.config.fixed || []).filter(f => f.day === day && toMin(f.start) < toMin(end) && toMin(start) < toMin(f.end)).map(f => f.id) : [];
    const weekAhead = ymd(addDays(dayOf(date), -7)), due = weekAhead < today() ? today() : weekAhead;
    const made = who.map(w => ({ id: uid(), title: `先講並辦請假：${w}｜${md(date)} ${name}`, minutes: 5, cat, showFrom: today(), due, done: false, remind: true, approvalFor: id, who: w, createdAt: new Date().toISOString() }));
    const sp = { id, date, start, end, name, cat, replaces, approvals: made.map(t => ({ who: t.who, taskId: t.id })) };
    if (none) sp.noApproval = true;
    state.config.special = [...specials(), sp];
    saveConfig();
    made.forEach(t => { state.tasks.push(t); saveTask(t); });
    spDlg.close(); render();
    const ids = new Set(made.map(t => t.id));
    toast(made.length ? `已加入 ${md(date)}「${name}」，多了 ${made.length} 個要先講的任務（期限 ${md(due)}）` : `已加入 ${md(date)}「${name}」`, () => {
      state.config.special = specials().filter(x => x.id !== id); saveConfig();
      state.tasks = state.tasks.filter(t => !ids.has(t.id));
      if (state.db) made.forEach(t => queue(() => state.db.doc('tasks/' + t.id).delete()));
      render();
    });
  });
  const nf = $('newFixed');
  if (nf) { nf.insertAdjacentHTML('afterend', ' <button class="btn" type="button" id="newSpecial">＋ 特別的一天</button>'); $('newSpecial').addEventListener('click', openSpecial); }

  /* ---------- 2. the daily question ---------- */
  const lookDlg = $('guardLookDlg');
  lookDlg.addEventListener('cancel', e => e.preventDefault());   // Esc does not answer the question
  function lookRows() {
    const rows = [], t0 = new Date();
    for (let i = 0; i <= 7; i++) {
      const d = ymd(addDays(t0, i));
      specials().filter(sp => sp.date === d).forEach(sp => {
        const open = openApprovals(sp);
        rows.push({ d, html: `${esc(sp.name)}（${sp.start}–${sp.end}）` + (open.length ? ` <span class="warn">還沒講：${esc(open.map(a => a.who).join('、'))}</span>` : !(sp.approvals || []).length && !sp.noApproval ? ' <span class="warn">沒登記要不要誰同意</span>' : '') });
      });
      const h = typeof dayOff === 'function' ? dayOff(d) : null;
      if (h) rows.push({ d, html: '放假：' + esc(h.name) });
    }
    const end = ymd(addDays(t0, 7));
    (state.tasks || []).filter(t => !t.done && t.due && t.due <= end).sort((a, b) => a.due.localeCompare(b.due)).forEach(t => {
      rows.push({ d: t.due, html: (t.due < today() ? '<span class="warn">已過期</span> ' : '') + '任務到期：' + esc(t.title) });
    });
    return rows.sort((a, b) => a.d.localeCompare(b.d));
  }
  function openLook() {
    const rows = lookRows();
    $('gLookList').innerHTML = rows.length ? rows.map(r => `<li><span class="when">${md(r.d)} ${wd(r.d)}</span><span>${r.html}</span></li>`).join('')
      : '<li style="grid-template-columns:minmax(0,1fr)"><span class="muted">未來七天沒有登記任何特別的事或到期的任務。</span></li>';
    $('gLookSun').hidden = new Date().getDay() !== 0;
    lookDlg.showModal();
  }
  function answerLook(answer) {
    if (state.config) { state.config.lookCheck = { date: today(), answer, at: new Date().toISOString() }; saveConfig(); }
    lookDlg.close();
  }
  $('gLookNo').addEventListener('click', () => answerLook('none'));
  $('gLookYes').addEventListener('click', () => { answerLook('yes'); openSpecial(); });
  function lookTick() {
    if (inTests() || !on('look') || !state.db || !state.config || !state.tasksLoaded) return;
    if (document.body.classList.contains('w')) return;
    if (new Date().getHours() < 18) return;
    if (state.config.lookCheck?.date === today()) return;
    if (busy()) return;
    openLook();
  }
  setInterval(lookTick, 30000);
  setTimeout(lookTick, 4000);

  /* ---------- 3. wrap up before bed ---------- */
  const wrapDlg = $('guardWrapDlg');
  // one evening = from 22:45 until 03:00 the next morning
  const eveningKey = now => ymd(now.getHours() < 3 ? addDays(now, -1) : now);
  function lastCat(now) {
    try {
      if (!isThisWeek() || now.getHours() < 3) return 'study';
      const day = (now.getDay() + 6) % 7, n = now.getHours() * 60 + now.getMinutes();
      const b = state.week.blocks.filter(x => x.day === day && STUDY_CATS.includes(x.cat) && toMin(x.start) <= n).sort((a, c) => toMin(c.start) - toMin(a.start))[0];
      return b ? b.cat : 'study';
    } catch (e) { return 'study'; }
  }
  let wrapKey = null;
  window.guardWrap = now => {
    if (inTests() || !on('wrap') || document.body.classList.contains('w')) return;
    const key = eveningKey(now);
    if (prefGet('planner-wrap', '') === key || busy()) return;
    wrapKey = key;
    $('guardWrapForm').reset();
    wrapDlg.showModal();
  };
  const wrapDone = () => { if (wrapKey) prefSet('planner-wrap', wrapKey); wrapDlg.close(); };
  $('gWrapSkip').addEventListener('click', wrapDone);
  $('guardWrapForm').addEventListener('submit', e => {
    e.preventDefault();
    const text = $('gNext').value.trim();
    if (text) {
      const now = new Date(), next = ymd(addDays(dayOf(eveningKey(now)), 1));
      const t = { id: uid(), title: '接著做：' + text, minutes: 30, cat: lastCat(now), showFrom: next, due: '', done: false, createdAt: now.toISOString() };
      state.tasks.push(t); saveTask(t); renderTasks();
      toast('記下來了，明天打開就看得到。去睡吧');
    }
    wrapDone();
  });

  /* ---------- 4-6. calibration, the cap, the code gate ---------- */
  const study = b => STUDY_CATS.includes(b.cat);
  const sumMin = l => l.reduce((a, b) => a + (b.minutes || 0), 0);
  const round5 = n => Math.max(5, Math.round(n / 5) * 5);
  const weekKey = () => ymd(state.monday);
  async function blocksOf(key) {
    if (key === weekKey()) return state.week.blocks;
    if (!state.db) return [];
    try { const d = await state.db.doc('weeks/' + key).get(); return d.exists ? (d.data().blocks || []) : []; } catch (e) { return []; }
  }

  // block ids already on the page: taken after each paint, so a block added in this very tick is still "new" when saveWeek runs
  const seen = new Set(); let absorbT = null;
  function absorbSoon() { if (absorbT) return; absorbT = setTimeout(() => { absorbT = null; state.week.blocks.forEach(b => seen.add(b.id)); }, 0); }

  // what was really finished last week, x 1.15 (0 = nothing to compare with, no cap)
  const caps = {};
  function loadCap() {
    const key = weekKey(); if (key in caps || !state.db) return;
    caps[key] = 0;
    blocksOf(ymd(addDays(state.monday, -7))).then(bl => { const done = sumMin(bl.filter(b => study(b) && b.done)); caps[key] = done > 0 ? round5(done * 1.15) : 0; });
  }
  window.guardCaps = () => ({ ...caps });

  // how long each subject really takes: time in the focus timer over planned time, finished blocks of the last 6 weeks
  let ratios = {}, ratiosAt = 0;
  async function loadRatios(force) {
    if (!force && Date.now() - ratiosAt < 10 * 60000) return; ratiosAt = Date.now();
    const acc = {}, mon = mondayOf(new Date());
    for (let i = 0; i < 6; i++) {
      (await blocksOf(ymd(addDays(mon, -7 * i)))).forEach(b => {
        if (!b.done || !(b.actual > 0) || !(b.minutes > 0) || !study(b)) return;
        const s = subjectOf(b) || CATS[b.cat], a = acc[s] || (acc[s] = { p: 0, a: 0, n: 0 });
        a.p += b.minutes; a.a += b.actual; a.n++;
      });
    }
    ratios = {};
    for (const s in acc) if (acc[s].n >= 3) ratios[s] = Math.min(2, Math.max(.5, acc[s].a / acc[s].p));
  }
  setTimeout(() => { if (!inTests()) loadRatios(); }, 6000);
  window.guardRatios = async force => { if (force) await loadRatios(true); return { ...ratios }; };

  const capDlg = $('guardCapDlg'); let capBlock = null;
  capDlg.addEventListener('cancel', () => { capBlock = null; });
  $('gCapOk').addEventListener('click', () => { capBlock = null; capDlg.close(); });
  $('gCapForce').addEventListener('click', () => {
    const b = capBlock; capBlock = null; capDlg.close(); if (!b) return;
    b.gc = 1; state.week.blocks.push(b); saveWeek(); render();
  });
  function overCap(b) {
    if (!on('cap')) return '';
    if (toMin(b.start) >= 18 * 60) {
      const eve = state.week.blocks.filter(x => x.day === b.day && study(x) && !x.skipped && toMin(x.start) >= 18 * 60);
      if (eve.length > 3) return `週${DAYN[b.day]}晚上已經有 ${eve.length - 1} 個讀書方塊，一個晚上最多 3 個。`;
    }
    const cap = caps[weekKey()], planned = sumMin(state.week.blocks.filter(x => study(x) && !x.skipped));
    if (cap && planned > cap) return `加上這個，這週會排到 ${planned} 分鐘。上週實際做完的 1.15 倍是 ${cap} 分鐘。`;
    return '';
  }
  function calibrate(b) {
    if (!on('cal')) return;
    const s = subjectOf(b) || CATS[b.cat], r = ratios[s]; loadRatios();
    if (!r || (r > .87 && r < 1.13)) return;
    const was = b.minutes, want = round5(was * r); if (want === was) return;
    if (typeof spillPastMidnight === 'function') spillPastMidnight(b, want); else b.minutes = want;
    try { ripple(b.day, b.id); } catch (e) {}
    setTimeout(() => { render(); toast(`「${s}」你實際要 ${r.toFixed(1)} 倍時間：${was} → ${b.minutes} 分`, () => { const x = state.week.blocks.find(y => y.id === b.id); if (x) { x.minutes = was; saveWeek(); render(); } }); }, 0);
  }
  const save0 = saveWeek;
  saveWeek = function () {
    try {
      if (!inTests() && state.monday >= mondayOf(new Date())) {
        const fresh = state.week.blocks.filter(b => !seen.has(b.id));
        fresh.forEach(b => seen.add(b.id));
        const b = fresh.length === 1 ? fresh[0] : null;   // several at once = a template or a paste: left alone
        if (b && study(b) && !b.gc) {
          const why = overCap(b);
          if (why) {
            state.week.blocks = state.week.blocks.filter(x => x !== b);
            capBlock = b; $('gCapWhy').textContent = why;
            setTimeout(() => { render(); if (!capDlg.open) capDlg.showModal(); }, 0);
          } else calibrate(b);
        }
      }
    } catch (e) {}
    return save0.apply(this, arguments);
  };

  // the gate: 程式 waits for today's first other study block
  if (typeof startFocus === 'function') {
    const focus0 = startFocus;
    startFocus = function (b) {
      try {
        if (!inTests() && on('gate') && b && b.cat === 'code' && isThisWeek()) {
          const day = (new Date().getDay() + 6) % 7;
          const first = state.week.blocks.filter(x => x.day === day && study(x) && x.cat !== 'code' && !x.skipped).sort((a, c) => toMin(a.start) - toMin(c.start))[0];
          if (first && !first.done) { toast(`先把今天第一格「${first.name}」做完打勾，再開程式`); return; }
        }
      } catch (e) {}
      return focus0.apply(this, arguments);
    };
  }

  /* ---------- switches in Settings ---------- */
  const anchor = $('prefNight')?.closest('label');
  if (anchor) {
    const rows = [['look', '每日檢查：18:00 後第一次打開時，問一次未來七天有沒有要誰同意的事'], ['wrap', '睡前收尾：睡前提醒第一次出現時，寫一句明天接著做什麼'],
      ['cap', '上限保護：一個晚上最多 3 個讀書方塊，一週不超過上週實際完成的 1.15 倍'], ['cal', '時間校正：照專注計時的紀錄，自動調整新方塊的長度'], ['gate', '程式方塊要等當天第一個讀書方塊打勾後，才能開始專注']];
    anchor.insertAdjacentHTML('afterend', rows.map(([k, t]) => `<label class="check"><input type="checkbox" id="gPref-${k}" data-gpref="${k}"> ${t}</label>`).join(''));
    const sync = () => rows.forEach(([k]) => { const el = $('gPref-' + k); if (el) el.checked = on(k); });
    sync();
    document.addEventListener('change', e => { const k = e.target.dataset?.gpref; if (k) prefSet('guard-' + k, e.target.checked ? '1' : '0'); });
    $('skinBtn')?.addEventListener('click', sync);
  }

  try { paintBar(); absorbSoon(); } catch (e) {}
})();
