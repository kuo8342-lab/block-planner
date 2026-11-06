/* 步調 Pace: a schedule a group shares (共用行程表), next to everyone's own plan.
   Each group (its invite code is the invitation) has groups/{gid}/board/{id}: meetings, study sessions, deadlines anyone in the group
   can add or change. They are never written into your own week: they are drawn on top of your timetable (dashed, on the right half),
   and 「加到我的行程」 copies one into your week when you want it there. Leaving a group or turning the layer off changes nothing of yours.
   Conflicts: a shared item that overlaps one of your blocks or fixed times in the next 14 days raises a banner and a ping, and again
   every 15 minutes, until you press 「不再提醒這個衝突」 (remembered on all your devices) or say you are not going. That conflict then stays quiet;
   a new or changed one (other time, other block) alerts again.
   Everyone can say 我會到／不會到. Edits keep a short history that can be restored, and whoever added an item (or the group's owner) can lock it.
   Needs c-group.js (window.paceGroups) and A's own functions. */
(() => {
  const PG = window.paceGroups;
  if (!PG || typeof state === 'undefined' || typeof renderGrid !== 'function' || typeof blocksInRange !== 'function') return;
  const $ = id => document.getElementById(id);
  const esc2 = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const ls = { get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} } };
  const SHOW = 'pace-board-show', DISMISS = 'pace-conflict-dismissed', DOC = 'config/conflicts', EVERY = 15 * 60000;
  const myAnswer = it => (it.going || {})[PG.user()?.uid];
  const canEdit = it => { const me = PG.user()?.uid, g = PG.list().find(x => x.id === it.gid); return !it.locked || it.uid === me || g?.owner === me; };
  const show = () => ls.get(SHOW) !== '0';
  const hm = m => pad(Math.floor(m / 60) % 24) + ':' + pad(m % 60);
  const gname = gid => PG.list().find(g => g.id === gid)?.name || '群組';
  const keyOf = it => it.gid + '/' + it.id;
  const boards = new Map();   // gid -> { items, unsub }
  const all = () => [...boards].flatMap(([gid, b]) => b.items.map(x => ({ ...x, gid })));
  let roomGid = null, conflicts = [], shown = 0, snoozeUntil = 0, alerted = new Set(), checking = false;

  /* ---------- listening ---------- */
  PG.onChange(list => {
    for (const [gid, b] of boards) if (!list.some(g => g.id === gid)) { b.unsub(); boards.delete(gid); }
    const fb = PG.fb();
    if (fb && PG.user()) {
      const { fs, db } = fb, since = ymd(addDays(new Date(), -14));
      for (const g of list) if (!boards.has(g.id)) {
        const b = { items: [], unsub: () => {} }; boards.set(g.id, b);
        // right after joining, the group list can arrive before the server has my membership and the first read is refused: try again
        const listen = tries => { b.unsub = fs.onSnapshot(fs.query(fs.collection(db, 'groups', g.id, 'board'), fs.where('date', '>=', since)),
          snap => { b.items = snap.docs.map(d => ({ id: d.id, ...d.data() })); changed(); },
          () => { if (boards.get(g.id) === b) setTimeout(() => { if (boards.get(g.id) === b) listen(tries + 1); }, Math.min(30000, 1500 * (tries + 1))); }); };
        listen(0);
      }
    }
    changed();
  });
  PG.onRoom(gid => { roomGid = gid; paintList(); });
  function changed() { try { renderGrid(); } catch (e) {} paintList(); check(); }

  /* ---------- the layer on the timetable ---------- */
  const grid0 = renderGrid;
  window.renderGrid = renderGrid = function () { const r = grid0.apply(this, arguments); try { overlay(); } catch (e) {} return r; };
  function overlay() {
    if (!show()) return;
    for (const it of all()) {
      const day = Math.round((new Date(it.date + 'T00:00:00') - state.monday) / 864e5); if (day < 0 || day > 6) continue;
      if (state.week.blocks.some(b => b.shared === keyOf(it))) continue;   // already copied into my week
      const col = document.querySelector('#grid .col[data-day="' + day + '"]'); if (!col) continue;
      const s = toMin(it.start), e = s + it.minutes, top = Math.max(s, START) - START + OFF, h = Math.min(e, END) - Math.max(s, START);
      if (h <= 0) continue;
      const el = document.createElement('div');
      el.className = 'blk shared cat-' + (CATS[it.cat] ? it.cat : 'life') + (myAnswer(it) === 'no' ? ' declined' : ''); el.style.top = top + 'px'; el.style.height = Math.max(h, 18) + 'px';
      el.dataset.shared = keyOf(it); el.title = '群組「' + gname(it.gid) + '」的共用行程：' + it.start + '–' + hm(e) + ' ' + it.title + '（' + (it.name || '') + ' 新增）';
      el.innerHTML = '<span class="t">👥 ' + esc2(it.start) + '–' + hm(e) + '</span><span class="n">' + esc2(it.title) + '</span>';
      col.appendChild(el);
    }
  }
  // the layer is not A's block: no dragging, no "new block here"; a tap opens it
  document.addEventListener('pointerdown', e => { if (e.target.closest?.('.blk.shared')) e.stopPropagation(); }, true);
  document.addEventListener('click', e => {
    const el = e.target.closest?.('.blk.shared'); if (!el) return;
    e.stopPropagation(); e.preventDefault();
    const it = all().find(x => keyOf(x) === el.dataset.shared); if (it) openItem(it);
  }, true);

  /* ---------- the list in the group room, and the add / edit dialog ---------- */
  document.body.insertAdjacentHTML('beforeend',
    '<dialog id="brdDlg" class="grp-dlg" aria-labelledby="brdTitle"><form method="dialog" class="grp-form">' +
      '<div class="dtitle" id="brdTitle">共用行程</div><p class="hint" id="brdWho" style="margin:0"></p>' +
      '<label>內容<input id="brdName" maxlength="40" placeholder="例如：小組討論、社團練習、報告截止" required></label>' +
      '<div class="row2"><label>日期<input id="brdDate" type="date" required></label><label>開始<input id="brdStart" type="time" step="300" required></label></div>' +
      '<div class="row2"><label>分鐘<input id="brdMin" type="number" min="5" max="720" step="5" required></label><label>類別<select id="brdCat"></select></label></div>' +
      '<p class="hint" style="margin:0">群組裡的每個人都會在自己的時間表上看到它（虛線、右半邊），但不會改到任何人自己的計畫。群組成員都可以修改；新增的人和群組建立者可以刪除或鎖定。</p>' +
      '<div class="brd-rsvp" id="brdRsvp"><div class="brd-rsvpb"><button class="btn" type="button" id="brdYes">我會到</button><button class="btn" type="button" id="brdNo">不會到</button></div><p class="hint" id="brdGoing" style="margin:0"></p></div>' +
      '<label class="check" id="brdLockRow"><input type="checkbox" id="brdLock"> 鎖定：只有新增的人和群組建立者可以修改</label>' +
      '<details id="brdHistWrap"><summary>修改紀錄</summary><div class="brd-hist" id="brdHist"></div></details>' +
      '<p class="hint" id="brdMsg" aria-live="polite" style="margin:0"></p>' +
      '<div class="actions"><button class="btn danger left" type="button" id="brdDel">刪除</button><button class="btn" type="button" id="brdMine">加到我的行程</button>' +
      '<button class="btn" value="cancel" formnovalidate>取消</button><button class="btn primary" type="button" id="brdSave">儲存</button></div>' +
    '</form></dialog>' +
    '<div class="brd-bar" id="brdBar" role="alert" hidden><div class="brd-txt"><b>⚠ 行程衝突</b> <span id="brdBarTxt"></span></div>' +
      '<div class="brd-acts"><button class="btn" type="button" id="brdGo">去看看</button><button class="btn" type="button" id="brdNext" hidden>下一個</button>' +
      '<button class="btn" type="button" id="brdSkip">我不會到</button><button class="btn" type="button" id="brdLater">稍後提醒</button><button class="btn primary" type="button" id="brdQuiet">不再提醒這個衝突</button></div></div>');
  $('brdCat').innerHTML = Object.entries(CATS).map(([k, v]) => '<option value="' + k + '">' + esc2(v) + '</option>').join('');
  const st = document.createElement('style');
  st.textContent = '.blk.shared { left: 52%; right: 2px; z-index: 2; cursor: pointer; border: 1.5px dashed currentColor; opacity: .93; background-image: none; }' +
    '.blk.shared .t { font-size: .6rem; } .blk.shared.declined { opacity: .4; }' +
    '.brd-rsvp { display: flex; flex-direction: column; gap: 6px; } .brd-rsvpb { display: flex; gap: 8px; } .brd-hist { display: flex; flex-direction: column; gap: 6px; padding-top: 6px; } .brd-h { display: flex; gap: 8px; align-items: center; justify-content: space-between; font-size: .78rem; } .brd-tag { font-size: .72rem; color: var(--muted); }' +
    '.brd-list { display: flex; flex-direction: column; gap: 6px; } .brd-it { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; gap: 8px; align-items: center; padding: 7px 10px; border-radius: 10px; background: var(--panel-2); font-size: .84rem; }' +
    '.brd-it .when { font-family: var(--f-mono); font-size: .74rem; color: var(--muted); } .brd-it .who { font-size: .72rem; color: var(--muted); } .brd-it.past { opacity: .5; }' +
    '.brd-acts0 { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; justify-content: space-between; }' +
    '.brd-bar { position: fixed; z-index: 70; top: calc(10px + env(safe-area-inset-top, 0px)); left: 50%; transform: translateX(-50%); width: min(660px, calc(100vw - 24px));' +
    '  display: flex; flex-wrap: wrap; gap: 8px 12px; align-items: center; justify-content: space-between; padding: 10px 14px; border-radius: 14px;' +
    '  background: var(--panel); color: var(--fg); border: 2px solid var(--danger); box-shadow: 0 12px 34px rgba(0,0,0,.22); font-size: .86rem; }' +
    '.brd-bar .brd-txt { min-width: 0; flex: 1 1 260px; } .brd-bar .brd-acts { display: flex; flex-wrap: wrap; gap: 6px; } .brd-bar .btn { padding: 4px 10px; font-size: .8rem; }' +
    '.brd-bar.flash { animation: brdflash .5s ease-in-out 4; } @keyframes brdflash { 50% { box-shadow: 0 0 0 4px color-mix(in srgb, var(--danger) 45%, transparent); } }' +
    '@media (prefers-reduced-motion: reduce) { .brd-bar.flash { animation: none; } }';
  document.head.appendChild(st);

  function paintList() {
    const box = $('grpBoard'); if (!box) return;
    if (!roomGid) { box.innerHTML = ''; return; }
    const today = ymd(new Date()), mine = PG.user()?.uid;
    const list = all().filter(x => x.gid === roomGid).sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start));
    box.innerHTML = '<div class="brd-acts0"><button class="btn primary" type="button" id="brdAdd">＋ 新增共用行程</button>' +
      '<label class="check" style="flex-direction:row;gap:6px;font-size:.8rem"><input type="checkbox" id="brdShow"' + (show() ? ' checked' : '') + '> 在我的時間表上顯示群組行程</label></div>' +
      (list.length ? '<div class="brd-list">' + list.map(x => {
        const d = new Date(x.date + 'T00:00:00');
        return '<div class="brd-it' + (x.date < today ? ' past' : '') + '"><span class="when">' + (d.getMonth() + 1) + '/' + d.getDate() + ' 週' + DAYN[(d.getDay() + 6) % 7] + ' ' + esc2(x.start) + '–' + hm(toMin(x.start) + x.minutes) + '</span>' +
          '<span>' + esc2(x.title) + ' <span class="who">· ' + esc2(x.uid === mine ? '我' : x.name || '') + (x.by && x.by !== x.name ? '（' + esc2(x.by) + ' 改過）' : '') + '</span>' + (x.locked ? ' 🔒' : '') + rsvpTag(x) + '</span>' +
          '<button class="btn" type="button" data-brd="' + esc2(keyOf(x)) + '">打開</button></div>';
      }).join('') + '</div>' : '<p class="hint" style="margin:0">還沒有共用行程。按「新增共用行程」放入小組討論、社團練習或報告截止，群組裡每個人都會看到。</p>');
    $('brdAdd').onclick = () => openItem(null);
    $('brdShow').onchange = e => { ls.set(SHOW, e.target.checked ? '1' : '0'); renderGrid(); };
    box.querySelectorAll('[data-brd]').forEach(b => { b.onclick = () => { const it = all().find(x => keyOf(x) === b.dataset.brd); if (it) openItem(it); }; });
  }

  function rsvpTag(x) { const v = Object.values(x.going || {}), y = v.filter(a => a === 'yes').length, n = v.filter(a => a === 'no').length; return y || n ? ' <span class="brd-tag">✓' + y + ' ✗' + n + '</span>' : ''; }
  let editing = null, editGid = null;
  function openItem(it) {
    editing = it; editGid = it ? it.gid : roomGid;
    if (!editGid) return;
    const g = PG.list().find(x => x.id === editGid), me = PG.user()?.uid;
    $('brdTitle').textContent = (it ? '共用行程' : '新增共用行程') + ' · ' + gname(editGid);
    $('brdWho').textContent = it ? (it.uid === me ? '你' : it.name || '') + ' 新增的' + (it.by && it.by !== it.name ? '，' + it.by + ' 最後修改' : '') : '';
    const d = new Date(); d.setMinutes(Math.ceil(d.getMinutes() / 30) * 30 + 60, 0, 0);
    $('brdName').value = it ? it.title : ''; $('brdDate').value = it ? it.date : ymd(d); $('brdStart').value = it ? it.start : hm(d.getHours() * 60 + d.getMinutes());
    $('brdMin').value = it ? it.minutes : 60; $('brdCat').value = it && CATS[it.cat] ? it.cat : 'study';
    const boss = !!it && (it.uid === me || g?.owner === me), may = !it || canEdit(it);
    $('brdDel').hidden = !boss; $('brdMine').hidden = !it; $('brdMsg').textContent = it && !may ? '這個行程鎖定了，只有新增的人和群組建立者可以修改。' : '';
    $('brdSave').hidden = !may; for (const id of ['brdName', 'brdDate', 'brdStart', 'brdMin', 'brdCat']) $(id).disabled = !may;
    $('brdLockRow').hidden = !boss; $('brdLock').checked = !!it?.locked;
    $('brdRsvp').hidden = !it; paintGoing(it);
    const hist = (it && Array.isArray(it.history)) ? it.history : [];
    $('brdHistWrap').hidden = !hist.length; $('brdHistWrap').open = false;
    $('brdHist').innerHTML = hist.map((h, i) => '<div class="brd-h"><span>' + esc2(h.date) + ' ' + esc2(h.start) + ' ' + esc2(h.minutes) + ' 分「' + esc2(h.title) + '」· ' + esc2(h.by || '') + '</span>' + (may ? '<button class="btn" type="button" data-back="' + i + '">填回這個版本</button>' : '') + '</div>').join('');
    $('brdDlg').showModal();
  }
  const say = t => { $('brdMsg').textContent = t; };
  function paintGoing(it) {
    if (!it) return;
    const g = PG.list().find(x => x.id === it.gid), names = g?.names || {}, going = it.going || {}, who = a => (g?.members || []).filter(u => going[u] === a).map(u => names[u] || '').join('、');
    const mine = myAnswer(it); $('brdYes').setAttribute('aria-pressed', mine === 'yes'); $('brdNo').setAttribute('aria-pressed', mine === 'no');
    const y = who('yes'), n = who('no'); $('brdGoing').textContent = (y ? '會到：' + y : '還沒有人說會到') + (n ? '；不會到：' + n : '');
  }
  async function answer(it, a) {
    const fb = PG.fb(), me = PG.user()?.uid; if (!fb || !me || !it) return false;
    await fb.fs.updateDoc(fb.fs.doc(fb.db, 'groups', it.gid, 'board', it.id), { ['going.' + me]: a });
    return true;
  }
  for (const [id, a] of [['brdYes', 'yes'], ['brdNo', 'no']]) $(id).addEventListener('click', async () => {
    if (!editing) return;
    try { await answer(editing, a); editing = { ...editing, going: { ...(editing.going || {}), [PG.user().uid]: a } }; paintGoing(editing); } catch (e) { say('沒有存成功，請確認網路。'); }
  });
  $('brdHist').addEventListener('click', e => {
    const b = e.target.closest('[data-back]'); if (!b || !editing) return;
    const h = editing.history?.[Number(b.dataset.back)]; if (!h) return;
    $('brdName').value = h.title || ''; $('brdDate').value = h.date || ''; $('brdStart').value = h.start || ''; $('brdMin').value = h.minutes || 60; if (CATS[h.cat]) $('brdCat').value = h.cat;
    say('已經填回舊內容，按「儲存」才會生效。');
  });
  $('brdSave').addEventListener('click', async () => {
    const fb = PG.fb(), user = PG.user(); if (!fb || !user || !editGid) return;
    const title = $('brdName').value.trim().slice(0, 40), date = $('brdDate').value, start = $('brdStart').value, minutes = Math.round(Number($('brdMin').value) / 5) * 5;
    if (!title) { say('請寫內容。'); return; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(start)) { say('請選日期和開始時間。'); return; }
    if (!(minutes >= 5 && minutes <= 720)) { say('分鐘要在 5 到 720 之間。'); return; }
    const { fs, db } = fb, name = PG.nameIn(editGid), cat = $('brdCat').value;
    const data = { title, date, start, minutes, cat, by: name, at: fs.serverTimestamp() };
    try {
      if (editing) {
        const changed = ['title', 'date', 'start', 'minutes', 'cat'].some(k => editing[k] !== data[k]);
        if (changed) data.history = [{ title: editing.title, date: editing.date, start: editing.start, minutes: editing.minutes, cat: editing.cat, by: editing.by || editing.name || '' }, ...(Array.isArray(editing.history) ? editing.history : [])].slice(0, 10);
        if (!$('brdLockRow').hidden) data.locked = $('brdLock').checked;
        await fs.updateDoc(fs.doc(db, 'groups', editGid, 'board', editing.id), data);
      }
      else await fs.setDoc(fs.doc(db, 'groups', editGid, 'board', user.uid + '_' + Date.now().toString(36)), { ...data, uid: user.uid, name });
      $('brdDlg').close();
    } catch (e) { say('沒有存成功，請確認網路，或你還在這個群組裡。'); }
  });
  $('brdDel').addEventListener('click', async () => {
    const fb = PG.fb(); if (!fb || !editing) return;
    try { await fb.fs.deleteDoc(fb.fs.doc(fb.db, 'groups', editing.gid, 'board', editing.id)); $('brdDlg').close(); }
    catch (e) { say('沒有刪除成功：只有新增的人和群組建立者可以刪除。'); }
  });
  $('brdMine').addEventListener('click', async () => {
    const it = editing; if (!it || !state.db) return;
    const date = new Date(it.date + 'T00:00:00'), mon = mondayOf(date), day = (date.getDay() + 6) % 7;
    const blk = { id: uid(), day, start: it.start, minutes: it.minutes, name: it.title, cat: CATS[it.cat] ? it.cat : 'life', shared: keyOf(it) };
    try {
      if (ymd(mon) === ymd(state.monday)) { if (state.week.blocks.some(b => b.shared === blk.shared)) { say('已經在你的行程裡了。'); return; } state.week.blocks.push(blk); saveWeek(); render(); }
      else {
        const ref = state.db.doc('weeks/' + ymd(mon)), s = await ref.get(), d = s.exists ? s.data() : { blocks: [] };
        if ((d.blocks || []).some(b => b.shared === blk.shared)) { say('已經在你的行程裡了。'); return; }
        await ref.set({ ...d, blocks: [...(d.blocks || []), blk] });
        try { if (typeof weekCache !== 'undefined') delete weekCache[ymd(mon)]; } catch (e) {}
      }
      $('brdDlg').close(); toast('已把「' + it.title + '」加到你 ' + (date.getMonth() + 1) + '/' + date.getDate() + ' 的行程');
      check();
    } catch (e) { say('沒有加成功，請再試一次。'); }
  });

  /* ---------- conflicts ---------- */
  // silenced conflicts: this device's list plus the synced one, so another device does not ask again
  const dismissed = async () => {
    let a = []; try { a = JSON.parse(ls.get(DISMISS) || '[]'); } catch (e) {}
    let b = []; try { const s = await state.db.doc(DOC).get(); b = (s.exists && s.data().keys) || []; } catch (e) {}
    return new Set([...a, ...b]);
  };
  const saveDismissed = async set => { const keys = [...set]; ls.set(DISMISS, JSON.stringify(keys)); try { await state.db.doc(DOC).set({ keys }); } catch (e) {} };
  function fixedOn(date, wd) {
    const cfg = state.config || {}, specials = (cfg.special || []).filter(s => s.date === date), replaced = new Set(specials.flatMap(s => s.replaces || []));
    return [...(cfg.fixed || []).filter(f => f.day === wd && !replaced.has(f.id)), ...specials]
      .filter(f => f.start && f.end).map(f => ({ id: 'fixed:' + f.id, name: f.name, s: toMin(f.start), e: toMin(f.end), fixed: true }));
  }
  async function check() {
    if (checking || !state.db || !state.config) return;
    checking = true;
    try {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const end = addDays(today, 14), now = new Date();
      const its = all().filter(it => { const d = new Date(it.date + 'T00:00:00'); return d >= today && d <= end && +d + (toMin(it.start) + it.minutes) * 6e4 > +now && myAnswer(it) !== 'no'; });
      const list = [];
      if (its.length) {
        const own = await blocksInRange(today, end);
        for (const it of its) {
          const s = toMin(it.start), e = s + it.minutes, wd = (new Date(it.date + 'T00:00:00').getDay() + 6) % 7;
          const mine = [...own.filter(b => b.date === it.date && !b.skipped && !b.done && b.shared !== keyOf(it)).map(b => ({ id: b.id, name: b.name, s: toMin(b.start), e: toMin(b.start) + b.minutes })), ...fixedOn(it.date, wd)];
          for (const m of mine) if (m.s < e && s < m.e) list.push({ it, m, key: [keyOf(it), it.date, it.start, it.minutes, m.id, m.s, m.e].join('|') });
        }
      }
      const quiet = await dismissed();
      // forget dismissed conflicts that are over, so the list does not grow forever
      const keep = [...quiet].filter(k => (k.split('|')[1] || '') >= ymd(today)); if (keep.length !== quiet.size) await saveDismissed(new Set(keep));
      conflicts = list.filter(c => !quiet.has(c.key)).sort((a, b) => a.it.date.localeCompare(b.it.date) || a.it.start.localeCompare(b.it.start));
      const fresh = conflicts.filter(c => !alerted.has(c.key));
      if (fresh.length) { snoozeUntil = 0; shown = conflicts.indexOf(fresh[0]); ring(); }
      paintBar();
    } catch (e) {}
    checking = false;
  }
  function describe(c) {
    const d = new Date(c.it.date + 'T00:00:00'), when = (d.getMonth() + 1) + '/' + d.getDate() + ' 週' + DAYN[(d.getDay() + 6) % 7];
    return when + ' 你的「' + c.m.name + '」' + (c.m.fixed ? '（固定行程）' : '') + ' ' + hm(c.m.s) + '–' + hm(c.m.e) + '，和群組「' + gname(c.it.gid) + '」的「' + c.it.title + '」 ' + c.it.start + '–' + hm(toMin(c.it.start) + c.it.minutes) + ' 撞在一起。';
  }
  function paintBar() {
    const bar = $('brdBar');
    if (!conflicts.length || Date.now() < snoozeUntil) { bar.hidden = true; return; }
    shown = Math.min(shown, conflicts.length - 1);
    $('brdBarTxt').textContent = describe(conflicts[shown]) + (conflicts.length > 1 ? '（共 ' + conflicts.length + ' 個衝突）' : '');
    $('brdNext').hidden = conflicts.length < 2;
    bar.hidden = false;
  }
  function ring() {
    conflicts.forEach(c => alerted.add(c.key));
    const bar = $('brdBar'); bar.classList.remove('flash'); void bar.offsetWidth; bar.classList.add('flash');
    try { const AC = window.AudioContext || window.webkitAudioContext; if (AC && typeof playNotifyPing === 'function') { const ctx = playChime.ctx || (playChime.ctx = new AC()); if (ctx.state === 'suspended') ctx.resume(); playNotifyPing(ctx, ctx.currentTime + .05); } } catch (e) {}
    try { if (document.hidden && 'Notification' in window && Notification.permission === 'granted' && conflicts[0]) new Notification('行程衝突', { body: describe(conflicts[0]) }); } catch (e) {}
  }
  $('brdNext').addEventListener('click', () => { shown = (shown + 1) % conflicts.length; paintBar(); });
  $('brdLater').addEventListener('click', () => { snoozeUntil = Date.now() + EVERY; paintBar(); });
  $('brdSkip').addEventListener('click', async () => {
    const c = conflicts[shown]; if (!c) return;
    try { await answer(c.it, 'no'); conflicts = conflicts.filter(x => keyOf(x.it) !== keyOf(c.it)); paintBar(); toast('已告訴群組你不會到「' + c.it.title + '」。'); } catch (e) { toast('沒有存成功，請確認網路。'); }
  });
  $('brdQuiet').addEventListener('click', async () => {
    const c = conflicts[shown]; if (!c) return;
    conflicts.splice(shown, 1); paintBar();
    const q = await dismissed(); q.add(c.key); await saveDismissed(q);
    toast('這個衝突不會再提醒了。時間或行程有變的話，會再提醒你。');
  });
  $('brdGo').addEventListener('click', () => {
    const c = conflicts[shown]; if (!c) return;
    document.querySelectorAll('dialog[open]').forEach(d => d.close());
    document.body.classList.remove('r', 'w');
    state.monday = mondayOf(new Date(c.it.date + 'T00:00:00')); subscribeWeek();
  });
  // keep reminding: every 15 minutes while a conflict is still there and not silenced
  setInterval(() => { check().then(() => { if (conflicts.length) { snoozeUntil = 0; paintBar(); ring(); } }); }, EVERY);
  const save0 = saveWeek;
  window.saveWeek = saveWeek = function () { const r = save0.apply(this, arguments); setTimeout(check, 800); return r; };
  (function wait(n) { if (state.db && state.config) { check(); return; } if (n < 120) setTimeout(() => wait(n + 1), 500); })(0);
})();
