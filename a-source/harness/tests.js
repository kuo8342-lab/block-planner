window.runTests = async function () {
  const results = [];
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const $ = s => document.querySelector(s);
  const ok = (name, cond, info = '') => results.push((cond ? 'PASS ' : 'FAIL ') + name + (info ? ' — ' + info : ''));
  const ptr = (el, type, x, y, target) => (target || el).dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0, pointerId: 1, isPrimary: true }));
  const colRect = d => document.querySelector(`.col[data-day="${d}"]`).getBoundingClientRect();
  const yFor = (d, min) => colRect(d).top + OFF + (min - START);
  const blocksNamed = n => state.week.blocks.filter(b => b.name === n);
  const errors = [];
  window.addEventListener('error', e => errors.push(e.message));
  window.addEventListener('unhandledrejection', e => errors.push(String(e.reason)));
  const realDate = Date;
  const fakeNow = (y, mo, d, h, mi) => { const t = new realDate(y, mo, d, h, mi).getTime(); window.Date = class extends realDate { constructor(...a) { super(...(a.length ? a : [t])); } static now() { return t; } }; };
  const restoreDate = () => { window.Date = realDate; };
  try {
    prefSet('planner-rem-blocks', '0');
    await sleep(300);
    ok('boot: config loaded', !!state.config && state.config.modules.length > 10);
    ok('boot: palette chips', document.querySelectorAll('#palette [data-drag^="module:"]').length === state.config.modules.length);
    ok('boot: 7 day columns', document.querySelectorAll('.col').length === 7);
    ok('boot: fixed school blocks drawn', document.querySelectorAll('.blk.fixed.cat-school').length >= 8);
    state.week.blocks = []; saveWeek(); render(); await sleep(100);
    const nMods0 = state.config.modules.length;

    // drag a module chip onto Tuesday 18:40
    const chip = $('[data-drag="module:m-math"]'), cr = chip.getBoundingClientRect();
    document.getElementById('gridScroll').scrollTop = 600; await sleep(50);
    const tx = colRect(1).left + 40, ty = yFor(1, 18 * 60 + 40);
    ptr(chip, 'pointerdown', cr.left + 5, cr.top + 5);
    ptr(document, 'pointermove', cr.left + 30, cr.top + 30); ptr(document, 'pointermove', tx, ty);
    ptr(document, 'pointerup', tx, ty, document.elementFromPoint(tx, ty)); await sleep(80);
    const m = blocksNamed('數學題目')[0];
    ok('drag: module placed on Tuesday', m && m.day === 1, m ? m.start : 'none');
    ok('drag: dropped near 18:40', m && Math.abs(toMin(m.start) - (18 * 60 + 40)) <= 5, m && m.start);

    // place overlapping block -> ripple pushes math
    placeNew({ name: '物理題目', cat: 'study', minutes: 50 }, 1, 18 * 60 + 40); await sleep(50);
    const m2 = blocksNamed('數學題目')[0], p2 = blocksNamed('物理題目')[0];
    ok('ripple: overlapped block pushed later', toMin(m2.start) >= toMin(p2.start) + p2.minutes, `${p2.start} / ${m2.start}`);

    // touch: moving right away scrolls (no drag); holding first then dragging places the block
    const tptr = (el, type, x, y, target) => (target || el).dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0, pointerId: 2, isPrimary: true, pointerType: 'touch' }));
    const nMath0 = blocksNamed('數學題目').length;
    let c2 = $('[data-drag="module:m-math"]').getBoundingClientRect();
    tptr($('[data-drag="module:m-math"]'), 'pointerdown', c2.left + 5, c2.top + 5);
    tptr(document, 'pointermove', c2.left + 5, c2.top + 40); tptr(document, 'pointerup', c2.left + 5, c2.top + 40); await sleep(50);
    ok('touch: quick swipe does not drag', blocksNamed('數學題目').length === nMath0 && !drag);
    c2 = $('[data-drag="module:m-math"]').getBoundingClientRect();
    tptr($('[data-drag="module:m-math"]'), 'pointerdown', c2.left + 5, c2.top + 5); await sleep(380);
    ok('touch: long press lifts the chip', $('[data-drag="module:m-math"]').classList.contains('lifting'));
    const tx2 = colRect(2).left + 40, ty2 = yFor(2, 19 * 60 + 30);
    tptr(document, 'pointermove', c2.left + 30, c2.top + 30); tptr(document, 'pointermove', tx2, ty2);
    tptr(document, 'pointerup', tx2, ty2, document.elementFromPoint(tx2, ty2)); await sleep(80);
    const tm = blocksNamed('數學題目').find(b => b.day === 2);
    ok('touch: long press then drag places block', !!tm && Math.abs(toMin(tm.start) - (19 * 60 + 30)) <= 5, tm ? tm.start : 'none');
    state.week.blocks = state.week.blocks.filter(b => b !== tm); saveWeek(); render(); await sleep(30);

    // tap a module chip: rename, put on the timetable, delete with undo
    c2 = $('[data-drag="module:m-math"]').getBoundingClientRect();
    ptr($('[data-drag="module:m-math"]'), 'pointerdown', c2.left + 5, c2.top + 5); ptr(document, 'pointerup', c2.left + 5, c2.top + 5); await sleep(30);
    ok('module: tap opens editor', $('#modDlg').open && $('#mName').value === '數學題目' && !$('#mDel').hidden);
    $('#mName').value = '數學講義'; $('#mSave').click(); await sleep(30);
    ok('module: renamed', state.config.modules.find(m => m.id === 'm-math').name === '數學講義' && state.config.modules.length === nMods0);
    ptr($('[data-drag="module:m-math"]'), 'pointerdown', c2.left + 5, c2.top + 5); ptr(document, 'pointerup', c2.left + 5, c2.top + 5); await sleep(30);
    $('#mDay').value = '6'; $('#mStart').value = '10:00'; $('#mPut').click(); await sleep(50);
    const put = blocksNamed('數學講義').find(b => b.day === 6);
    ok('module: put on timetable without dragging', !!put && put.start === '10:00', put ? put.start : 'none');
    state.week.blocks = state.week.blocks.filter(b => b !== put); saveWeek(); render();
    ptr($('[data-drag="module:m-math"]'), 'pointerdown', c2.left + 5, c2.top + 5); ptr(document, 'pointerup', c2.left + 5, c2.top + 5); await sleep(30);
    $('#mDel').click(); ok('module: delete asks first', state.config.modules.some(m => m.id === 'm-math'));
    $('#mDel').click(); await sleep(30);
    ok('module: deleted', !state.config.modules.some(m => m.id === 'm-math') && !$('[data-drag="module:m-math"]'));
    $('#toastUndo').click(); await sleep(30);
    ok('module: delete can be undone', state.config.modules.some(m => m.id === 'm-math'));
    state.config.modules.find(m => m.id === 'm-math').name = '數學題目'; saveConfig(); render(); await sleep(30);

    // a block marked 沒做完 cannot be ticked until the ✗ is undone
    state.week.blocks.push({ id: 'fz', day: 4, start: '21:00', minutes: 30, name: '生物筆記', cat: 'study', done: false });
    toggleFail('fz'); await sleep(20);
    const fzEl = document.querySelector('[data-bid="fz"]');
    ok('fail: block drawn as failed, tick hidden', fzEl.classList.contains('failed') && getComputedStyle(fzEl.querySelector('.ck')).display === 'none');
    toggleDone('fz');
    ok('fail: quick tick refused while failed', !state.week.blocks.find(b => b.id === 'fz').done && $('#toastText').textContent.includes('先按紅色'));
    toggleFail('fz'); toggleDone('fz');
    ok('fail: after undoing ✗ it can be ticked', state.week.blocks.find(b => b.id === 'fz').done && !state.week.blocks.find(b => b.id === 'fz').failed);
    state.week.blocks = state.week.blocks.filter(b => b.id !== 'fz'); saveWeek(); render();

    // block-start reminder pops up on the timetable view, not only in the sticky note
    const nn = 10 * 60;
    prefSet('planner-rem-blocks', '1'); alarmQueue.length = 0;
    checkReminders([{ id: 'rem1', s: nn + 3, e: nn + 33, start: '10:03', name: '提醒測試', cat: 'study' }], nn); await sleep(80);
    ok('remind: shown on timetable view', !$('#alarm').hidden && $('#alarmMsg').textContent.includes('提醒測試'), $('#alarmMsg').textContent);
    closeAlarm(); await sleep(320); prefSet('planner-rem-blocks', '0');

    // 1. quick note while focusing becomes a task
    const nTasks0 = state.tasks.length;
    $('#fNote').value = '回 LINE 給同學'; $('#fNoteForm').dispatchEvent(new Event('submit', { cancelable: true })); await sleep(30);
    ok('quick note: task added', state.tasks.length === nTasks0 + 1 && state.tasks.some(t => t.title === '回 LINE 給同學' && t.minutes === 15));
    ok('quick note: box cleared and confirmed', $('#fNote').value === '' && $('#toastText').textContent.includes('繼續專注'));
    state.tasks = state.tasks.filter(t => t.title !== '回 LINE 給同學'); render();

    // 3. sick day: cancel every unfinished block that day, with undo
    state.week.blocks.push({ id: 'sk1', day: 1, start: '19:00', minutes: 30, name: '數學', cat: 'study', done: false }, { id: 'sk2', day: 1, start: '20:00', minutes: 30, name: '英文', cat: 'lang', done: true });
    openDayOff(ymd(addDays(state.monday, 1))); $('#doSkipAll').click(); await sleep(30);
    ok('sick day: unfinished blocks skipped, done ones kept', state.week.blocks.find(b => b.id === 'sk1').skipped === true && !state.week.blocks.find(b => b.id === 'sk2').skipped);
    $('#toastUndo').click(); await sleep(30);
    ok('sick day: undo', !state.week.blocks.find(b => b.id === 'sk1').skipped);
    state.week.blocks = state.week.blocks.filter(b => !['sk1', 'sk2'].includes(b.id)); saveWeek(); render();

    // 4. tired button
    $('#npTired').click(); await sleep(20);
    ok('tired: on for a while', tiredNow() && $('#npTired').textContent === '恢復一般');
    $('#npTired').click(); await sleep(20);
    ok('tired: off again', !tiredNow() && $('#npTired').textContent.includes('腦袋累了'));

    // 5. coach card folds
    $('#coachFold').click();
    ok('coach: folded', $('#coachBody').hidden && localStorage.getItem('planner-coach-folded') === '1');
    $('#coachFold').click();
    ok('coach: unfolded', !$('#coachBody').hidden);

    // 6. the same reminder rings once even if asked twice (another tab)
    localStorage.removeItem('ring:test'); let rang = 0;
    ringOnce('test', () => rang++); ringOnce('test', () => rang++);
    ok('one ring: second call skipped', rang === 1);
    localStorage.removeItem('ring:test');

    // 2. resize: +N 分 tip, a detent at whole hours, spill past midnight into the next day
    state.week.blocks.push({ id: 'rz1', day: 2, start: '20:00', minutes: 30, name: '物理', cat: 'study', done: false });
    render(); await sleep(30);
    let h1 = document.querySelector('[data-resize="rz1"]'), hr = h1.getBoundingClientRect();
    ptr(h1, 'pointerdown', hr.left + 5, hr.top + 3); ptr(document, 'pointermove', hr.left + 5, hr.top + 3 + 57);
    ok('resize: snaps to a whole hour and says so', $('#rzTip').textContent.startsWith('＋1 小時') && drag.min === 90, $('#rzTip').textContent);
    ptr(document, 'pointerup', hr.left + 5, hr.top + 60); await sleep(50);
    ok('resize: hour added', state.week.blocks.find(b => b.id === 'rz1').minutes === 90 && $('#rzTip').hidden);
    state.week.blocks = state.week.blocks.filter(b => b.id !== 'rz1');
    state.week.blocks.push({ id: 'rz2', day: 2, start: '23:00', minutes: 30, name: '化學', cat: 'study', done: false });
    render(); await sleep(30);
    h1 = document.querySelector('[data-resize="rz2"]'); hr = h1.getBoundingClientRect();
    ptr(h1, 'pointerdown', hr.left + 5, hr.top + 3); ptr(document, 'pointermove', hr.left + 5, hr.top + 3 + 90);
    ok('resize: tip shows the part that continues tomorrow', $('#rzTip').textContent.includes('隔天 00:00–01:00'), $('#rzTip').textContent);
    ptr(document, 'pointerup', hr.left + 5, hr.top + 93); await sleep(50);
    const rz2 = state.week.blocks.find(b => b.id === 'rz2'), cont = state.week.blocks.find(b => b.name === '化學（續）');
    ok('resize: cut at midnight, rest continues 00:00 next day', rz2.minutes === 60 && cont && cont.day === 3 && cont.start === '00:00' && cont.minutes === 60, JSON.stringify(cont));
    state.week.blocks = state.week.blocks.filter(b => b.id !== 'rz2' && b !== cont); saveWeek(); render();

    // typing a length in the dialog spills the same way
    state.week.blocks.push({ id: 'rz3', day: 1, start: '22:00', minutes: 30, name: '英文', cat: 'lang', done: false });
    openBlock('rz3'); $('#dMin').value = '200'; $('#dlgForm').dispatchEvent(new Event('submit', { cancelable: true })); await sleep(30);
    const rz3 = state.week.blocks.find(b => b.id === 'rz3'), c3 = state.week.blocks.find(b => b.name === '英文（續）');
    ok('dialog: long length continues next day', rz3.minutes === 120 && c3 && c3.day === 2 && c3.minutes === 80, rz3.minutes + ' ' + JSON.stringify(c3));
    state.week.blocks = state.week.blocks.filter(b => b.id !== 'rz3' && b !== c3); saveWeek(); render();

    // Sunday spills into next week's Monday
    const sun = { id: 'rz4', day: 6, start: '23:30', minutes: 30, name: '數學', cat: 'study', done: false };
    state.week.blocks.push(sun); spillPastMidnight(sun, 90); await sleep(120);
    const nextKey = ymd(addDays(state.monday, 7)), nextDoc = window.__store['weeks/' + nextKey];
    ok('sunday: rest goes to next Monday 00:00', sun.minutes === 30 && nextDoc && nextDoc.blocks.some(b => b.name === '數學（續）' && b.day === 0 && b.start === '00:00' && b.minutes === 60), JSON.stringify(nextDoc));
    state.week.blocks = state.week.blocks.filter(b => b.id !== 'rz4'); delete window.__store['weeks/' + nextKey]; saveWeek(); render();

    // ripple: a block pushed past midnight moves to a later free slot instead of piling up
    state.week.blocks.push({ id: 'ov1', day: 3, start: '23:00', minutes: 60, name: '生物', cat: 'study', done: false });
    placeNew({ name: '地理', cat: 'study', minutes: 90 }, 3, 22 * 60 + 30); await sleep(50);
    const ov1 = state.week.blocks.find(b => b.id === 'ov1');
    ok('overflow: moved to a later free slot', ov1.day > 3 && $('#toastText').textContent.includes('已移到'), ov1.day + ' ' + ov1.start + ' / ' + $('#toastText').textContent);
    $('#toastUndo').click(); await sleep(30);
    ok('overflow: move can be undone', state.week.blocks.find(b => b.id === 'ov1').day === 3);
    state.week.blocks = state.week.blocks.filter(b => b.id !== 'ov1' && b.name !== '地理'); saveWeek(); render();

    // ripple leaves finished blocks alone and warns when the day overflows
    state.week.blocks.push({ id: 'rA', day: 2, start: '19:00', minutes: 30, name: '國文', cat: 'study', done: false }, { id: 'rD', day: 2, start: '19:40', minutes: 30, name: '英文', cat: 'lang', done: true });
    placeNew({ name: '化學題目', cat: 'study', minutes: 50 }, 2, 18 * 60 + 50); await sleep(50);
    const rA = state.week.blocks.find(b => b.id === 'rA'), rDone = state.week.blocks.find(b => b.id === 'rD');
    ok('ripple: finished block not moved', rDone.start === '19:40', rDone.start);
    ok('ripple: pushed block jumps over finished one', toMin(rA.start) >= 20 * 60 + 10, rA.start);
    state.week.blocks.push({ id: 'rX', day: 3, start: '23:20', minutes: 40, name: '生物', cat: 'study', done: false });
    placeNew({ name: '德文', cat: 'lang', minutes: 30 }, 3, 23 * 60 + 10); await sleep(50);
    ok('ripple: overflow past midnight is reported', $('#toastText').textContent.includes('排不下'), $('#toastText').textContent);
    state.week.blocks = state.week.blocks.filter(b => !['rA', 'rD', 'rX'].includes(b.id) && !['化學題目', '德文'].includes(b.name)); saveWeek(); render();

    // header busy tags come from fixed items
    const heads = [...document.querySelectorAll('#grid .head[data-date]')];
    ok('busy: Sunday marked 空檔多', heads[6].querySelector('.busy.calm') !== null, heads[6].textContent);
    ok('busy: free minutes counted from fixed items', freeMinutes(6) > freeMinutes(0) && freeMinutes(0) < 480, freeMinutes(0) + ' / ' + freeMinutes(6));

    // resize physics by dragging its handle 30px down
    render(); await sleep(30);
    const rz = document.querySelector(`[data-resize="${p2.id}"]`), rr = rz.getBoundingClientRect();
    ptr(rz, 'pointerdown', rr.left + 5, rr.top + 3); ptr(document, 'pointermove', rr.left + 5, rr.top + 33); ptr(document, 'pointerup', rr.left + 5, rr.top + 33); await sleep(50);
    ok('resize: minutes increased', blocksNamed('物理題目')[0].minutes === 80, blocksNamed('物理題目')[0].minutes);
    const m3 = blocksNamed('數學題目')[0], p3 = blocksNamed('物理題目')[0];
    ok('resize: following block pushed and skips bath', toMin(m3.start) >= toMin(p3.start) + p3.minutes && !(toMin(m3.start) < 20 * 60 + 50 && toMin(m3.start) + m3.minutes > 20 * 60 + 30), m3.start);

    // quick done tick
    render(); await sleep(30);
    const ck = document.querySelector(`[data-toggle="${p3.id}"]`), ckr = ck.getBoundingClientRect();
    ptr(ck, 'pointerdown', ckr.left + 3, ckr.top + 3); await sleep(50);
    ok('tick: block marked done', blocksNamed('物理題目')[0].done === true);
    ok('tick: confetti spawned', fx.confetti.length > 0 || !fxOn);

    // dialog edit (click block)
    render(); await sleep(30);
    const bel = document.querySelector(`[data-bid="${m3.id}"]`), br = bel.getBoundingClientRect();
    ptr(bel, 'pointerdown', br.left + 20, br.top + 12); ptr(document, 'pointerup', br.left + 20, br.top + 12); await sleep(50);
    ok('dialog: opens on click', $('#dlg').open);
    $('#dMin').value = 45; $('#dSub').value = '數學'; $('#dlgForm').requestSubmit(); await sleep(50);
    ok('dialog: minutes saved', blocksNamed('數學題目')[0].minutes === 45);
    ok('dialog: subject saved', blocksNamed('數學題目')[0].subject === '數學');

    // duplicate + delete + undo
    openBlock(blocksNamed('數學題目')[0].id); $('#dDup').click(); await sleep(50);
    ok('dup: copy created', blocksNamed('數學題目').length === 2);
    openBlock(blocksNamed('數學題目')[1].id); $('#dDel').click(); await sleep(50);
    ok('delete: removed', blocksNamed('數學題目').length === 1);
    $('#toastUndo').click(); await sleep(50);
    ok('undo: delete restored', blocksNamed('數學題目').length === 2);

    // tasks: add, suggestion, complete, repeat
    $('#tTitle').value = '測試任務'; $('#tMin').value = 20; $('#tDue').value = ymd(addDays(state.monday, 6)); $('#tRepeat').checked = true;
    $('#taskForm').requestSubmit(); await sleep(50);
    const tk = state.tasks.find(t => t.title === '測試任務');
    ok('task: added with repeat', tk && tk.repeat === 'weekly');
    const sug = document.querySelector(`[data-place^="${tk.id}|"]`);
    ok('task: suggestion shown', !!sug);
    if (sug) { sug.click(); await sleep(50); ok('task: suggestion places linked block', state.week.blocks.some(b => b.taskId === tk.id)); }
    const cb = document.querySelector(`#tasks [data-tdone="${tk.id}"]`); cb.checked = true; cb.dispatchEvent(new Event('change', { bubbles: true })); await sleep(50);
    ok('task: completed', state.tasks.find(t => t.id === tk.id).done);
    ok('task: next week copy spawned', state.tasks.some(t => t.title === '測試任務' && !t.done && t.showFrom > tk.showFrom));

    // quick add
    $('#qa').value = '週日 10:00 國文 30分'; $('#quickAdd').requestSubmit(); await sleep(80);
    ok('quick add: block on Sunday 10:00', state.week.blocks.some(b => b.name === '國文' && b.day === 6 && b.start === '10:00' && b.minutes === 30));
    $('#qa').value = '週六前 讀英文單字 20分'; $('#quickAdd').requestSubmit(); await sleep(80);
    ok('quick add: task with due', state.tasks.some(t => t.title === '讀英文單字' && t.due && t.minutes === 20));

    // targets + rest warnings
    renderTargets();
    ok('targets: warn bar visible', !$('#warnbar').hidden);
    ok('rest: shortage flagged for Tuesday', $('#warnbar').textContent.includes('週二'));
    placeNew({ name: '休息', cat: 'rest', minutes: 60 }, 1, 22 * 60); await sleep(50);
    ok('rest: Tuesday shortage cleared after adding rest', !restIssues().some(r => r.d === 1));

    // empty slot picker
    const col = document.querySelector('.col[data-day="3"]'), y = yFor(3, 21 * 60 + 30);
    lastDragEnd = 0; col.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: colRect(3).left + 30, clientY: y })); await sleep(50);
    ok('picker: opens on empty slot', $('#pickDlg').open, $('#pickTitle').textContent);
    $('#pickList [data-pick="m-ger"]').click(); await sleep(50);
    ok('picker: adds chosen block', state.week.blocks.some(b => b.name === '德文' && b.day === 3));

    // fixed skip / restore / school locked
    document.querySelector('[data-fixed="thu-bath"]').click(); await sleep(30);
    ok('fixed: dialog opens', $('#fixDlg').open);
    $('#fixSkip').click(); await sleep(50);
    ok('fixed: skipped this week', (state.week.skipFixed || []).includes('thu-bath') && !fixedFor(3).some(f => f.id === 'thu-bath'));
    ok('fixed: skipped list shows', !$('#skipCard').hidden);
    $('[data-unskip="thu-bath"]').click(); await sleep(50);
    ok('fixed: restored', fixedFor(3).some(f => f.id === 'thu-bath'));
    document.querySelector('[data-fixed="mon-am"]').click(); await sleep(30);
    ok('fixed: school cannot be skipped', $('#fixSkip').hidden);
    $('#fixCancel').click();

    // holiday
    const before = state.config.holidays;
    state.config.holidays = [{ date: ymd(addDays(state.monday, 2)), name: '測試假日' }]; render();
    ok('holiday: school cleared that day', !fixedFor(2).some(f => f.cat === 'school' || f.cat === 'care'));
    ok('holiday: header badge', document.querySelector('.head .hol')?.textContent === '測試假日');
    ok('holiday: evening bath kept', fixedFor(2).some(f => f.id === 'wed-bath'));
    state.config.holidays = before; render();

    // wishlist
    $('#wishInput').value = '看一部電影 90分'; $('#wishForm').requestSubmit(); await sleep(50);
    const w = (state.wishes || []).find(x => x.title === '看一部電影');
    ok('wish: added', w && w.minutes === 90);
    document.querySelector(`[data-wplace="${w.id}"]`).click(); await sleep(50);
    ok('wish: placed into week (or no slot left)', state.week.blocks.some(b => b.name === '看一部電影') || $('#toastText').textContent.includes('空檔'));
    document.querySelector(`[data-wdel="${w.id}"]`).click(); await sleep(30);
    ok('wish: deleted', !(state.wishes || []).some(x => x.id === w.id));
    $('#toastUndo').click(); await sleep(30);
    ok('wish: undo delete', (state.wishes || []).some(x => x.id === w.id));

    // templates
    $('#tplBtn').click(); $('#tplName').value = '測試範本'; $('#tplForm').requestSubmit(); await sleep(50);
    const tpl = state.templates.find(t => t.name === '測試範本');
    ok('template: saved', tpl && tpl.blocks.length > 0);
    state.week.blocks = []; render();
    $('#tplBtn').click(); document.querySelector(`[data-tpl-apply="${tpl.id}"]`).click(); await sleep(50);
    ok('template: applied', state.week.blocks.length === tpl.blocks.length);
    $('#tplBtn').click(); const del = document.querySelector(`[data-tpl-del="${tpl.id}"]`); del.click(); del.click(); await sleep(30); $('#tplCancel').click();
    ok('template: deleted', !state.templates.some(t => t.id === tpl.id));

    // replan with a fake "now" (Thursday 21:00 of this week)
    const mon = state.monday;
    state.week.blocks.push({ id: 'past1', day: 0, start: '18:40', minutes: 50, name: '化學', cat: 'study', done: false });
    fakeNow(mon.getFullYear(), mon.getMonth(), mon.getDate() + 3, 19, 0);
    $('#replan').click(); await sleep(50);
    restoreDate();
    const moved = state.week.blocks.find(b => b.id === 'past1');
    ok('replan: missed block moved to later slot', moved.day >= 3, `${moved.day} ${moved.start}`);
    // replan fills a weekend 緩衝 block first
    state.week.blocks.push({ id: 'past2', day: 1, start: '19:00', minutes: 40, name: '物理', cat: 'study', done: false, failed: true }, { id: 'buf1', day: 6, start: '10:00', minutes: 90, name: '緩衝', cat: 'buffer', done: false });
    fakeNow(mon.getFullYear(), mon.getMonth(), mon.getDate() + 3, 19, 0);
    $('#replan').click(); await sleep(50);
    restoreDate();
    const p2b = state.week.blocks.find(b => b.id === 'past2'), buf = state.week.blocks.find(b => b.id === 'buf1');
    ok('buffer: missed block placed into buffer', p2b.day === 6 && p2b.start === '10:00' && !p2b.failed, `${p2b.day} ${p2b.start}`);
    ok('buffer: buffer shrinks', buf && buf.start === '10:40' && buf.minutes === 50, buf && `${buf.start} ${buf.minutes}`);
    ok('buffer: remaining buffer shown', $('#toastText').textContent.includes('緩衝還剩 50 分'), $('#toastText').textContent);

    // report
    setReport(true); await sleep(150);
    ok('report: week table', document.querySelectorAll('#rSubjects tbody tr').length >= 9);
    document.querySelector('[data-rmode="day"]').click(); await sleep(150);
    ok('report: day list', !$('#rListCard').hidden);
    document.querySelector('[data-rmode="month"]').click(); await sleep(250);
    ok('report: month bars', document.querySelectorAll('#rBreak .dbar').length >= 4);
    document.querySelector('[data-rmode="week"]').click(); setReport(false);

    // focus timer
    const fb = state.week.blocks.find(b => b.cat === 'study' && !b.done);
    startFocus(fb); await sleep(50);
    ok('focus: running pill', !$('#focusPill').hidden);
    focusEndHack = (focus.start -= 10 * 60000); focus.segStart -= 10 * 60000; await finishFocus(true); await sleep(50);
    ok('reflect: asks 完成了嗎 when focus ends', $('#reflDlg').open && document.querySelector('[name="reflDone"][value="yes"]').checked);
    $('#reflText').value = '三角函數還不熟'; $('#reflForm').requestSubmit(); await sleep(80);
    const fb2 = state.week.blocks.find(b => b.id === fb.id);
    ok('focus: actual minutes recorded', fb2.actual >= 10, fb2.actual);
    ok('focus: block done after answering 完成了', fb2.done);
    ok('reflect: one-line note saved', fb2.reflection?.text === '三角函數還不熟');

    // pomodoro: split / single / from a task
    {
      const fakeAt = ms => { window.Date = class extends realDate { constructor(...a) { super(...(a.length ? a : [ms])); } static now() { return ms; } }; };
      const M = 60000, clearAlarms = async () => { for (let i = 0; i < 6; i++) { closeAlarm(); await sleep(300); } };
      const answer = async yes => { document.querySelector(`[name="reflDone"][value="${yes ? 'yes' : 'no'}"]`).checked = true; $('#reflForm').requestSubmit(); await sleep(80); };
      await clearAlarms(); prefSet('planner-pomo-mode', 'split'); prefSet('planner-pomo-work', '25'); prefSet('planner-pomo-break', '10');
      const pb = { id: 'pomo1', day: 2, start: '20:00', minutes: 60, name: '番茄測試', cat: 'study', done: false };
      state.week.blocks.push(pb); saveWeek(); render();
      const t0 = realDate.now(); fakeAt(t0);
      startFocus(pb);
      ok('pomo: first segment is 25 min of focus', focus.phase === 'work' && focus.round === 1 && focus.segEnd - focus.segStart === 25 * M && focus.mode === 'split');
      ok('pomo: screen shows round, phase and overall progress', $('#fRound').textContent.includes('第 1 / 3 輪') && $('#fRound').textContent.includes('專注中') && $('#fAll').textContent.includes('0 / 60'), $('#fRound').textContent + ' | ' + $('#fAll').textContent);
      fakeAt(t0 + 25 * M + 1000); renderFocus(); await sleep(30);
      ok('pomo: switches to a 10 min break', focus.phase === 'break' && focus.segEnd - focus.segStart === 10 * M && $('#fLbl').textContent.includes('休息 10 分鐘') && !$('#fSkip').hidden, $('#fLbl').textContent);
      await sleep(50); ok('pomo: break notice shown', $('#alarmMsg').textContent.includes('休息 10 分鐘') || alarmQueue.some(a => a.msg.includes('休息 10 分鐘')), $('#alarmMsg').textContent);
      const saved = JSON.parse(localStorage.getItem(FOCUS_KEY));
      ok('pomo: segment saved for reload', saved.phase === 'break' && saved.round === 1 && saved.doneMs === 25 * M);
      focus = normFocus(saved); fakeAt(t0 + 35 * M + 1000); renderFocus();
      ok('pomo: resumes after reload into round 2', focus.phase === 'work' && focus.round === 2 && $('#fRound').textContent.includes('第 2 / 3 輪'));
      fakeAt(t0 + 60 * M + 2000); renderFocus();
      ok('pomo: second break', focus.phase === 'break' && focus.doneMs === 50 * M);
      $('#fSkip').click();
      ok('pomo: skip break starts last 10 min segment', focus.phase === 'work' && focus.round === 3 && focus.segEnd - focus.segStart === 10 * M);
      ok('pomo: no finish sound before the end', !$('#reflDlg').open);
      fakeAt(t0 + 71 * M); renderFocus(); await sleep(80);
      ok('pomo: finishes after 60 min of focus and asks 完成了嗎', !focus && $('#reflDlg').open && $('#reflMins').textContent.includes('60'), $('#reflMins').textContent);
      await answer(false);
      ok('pomo: actual focus minutes on the block', state.week.blocks.find(b => b.id === 'pomo1').actual === 60);
      ok('pomo: old saved timer treated as one piece', normFocus({ id: 'x', week: 'w', name: 'n', start: 0, end: 30 * M }).mode === 'single');

      // single
      prefSet('planner-pomo-mode', 'single');
      const pb2 = { id: 'pomo2', day: 2, start: '21:30', minutes: 60, name: '一次做完', cat: 'study', done: false };
      state.week.blocks.push(pb2); saveWeek(); render();
      fakeAt(t0); startFocus(pb2);
      ok('single: one 60 min segment', focus.mode === 'single' && focus.segEnd - focus.segStart === 60 * M && $('#fRound').textContent.includes('不分割'));
      fakeAt(t0 + 30 * M); renderFocus();
      ok('single: no break in the middle', focus.phase === 'work' && focus.round === 1);
      fakeAt(t0 + 60 * M + 1000); renderFocus(); await sleep(80);
      ok('single: finishes at the end', !focus && $('#reflDlg').open);
      await answer(true);
      ok('single: block done', state.week.blocks.find(b => b.id === 'pomo2').done && state.week.blocks.find(b => b.id === 'pomo2').actual === 60);
      prefSet('planner-pomo-mode', 'split');

      // from a task (no block this week)
      const tk = { id: 'tpomo', title: '背單字 Unit 5', minutes: 20, cat: 'lang', showFrom: ymd(state.monday), due: '', done: false, repeat: 'weekly' };
      state.tasks.push(tk); saveTask(tk); render(); await sleep(80);
      const tbtn = document.querySelector('[data-tfocus="tpomo"]');
      ok('task: 開始專注 button in the task list', !!tbtn && tbtn.getBoundingClientRect().width > 0);
      fakeAt(t0); tbtn.click(); await sleep(30);
      ok('task: focus uses task minutes', focus && focus.taskId === 'tpomo' && !focus.id && focus.total === 20 * M && focus.segEnd - focus.segStart === 20 * M);
      setWidget(false);
      fakeAt(t0 + 20 * M + 1000); renderFocus(); await sleep(80);
      ok('task: asks 完成了嗎 at the end', !focus && $('#reflDlg').open);
      await answer(true);
      const tk2 = state.tasks.find(t => t.id === 'tpomo');
      ok('task: checked off after 完成了', tk2.done && tk2.actual === 20);
      ok('task: weekly repeat spawned', state.tasks.some(t => t.title === '背單字 Unit 5' && !t.done && t.id !== 'tpomo'));

      // task that already has a block this week → use the block
      const tk3 = { id: 'tpomo3', title: '物理講義', minutes: 40, cat: 'study', showFrom: ymd(state.monday), due: '', done: false };
      state.tasks.push(tk3); saveTask(tk3);
      const pb3 = { id: 'pomo3', day: 3, start: '20:00', minutes: 30, name: '物理講義', cat: 'study', done: false, taskId: 'tpomo3' };
      state.week.blocks.push(pb3); saveWeek(); render(); await sleep(80);
      fakeAt(t0); document.querySelector('[data-tfocus="tpomo3"]').click(); await sleep(30);
      ok('task: linked block used first', focus && focus.id === 'pomo3' && focus.total === 30 * M);
      setWidget(false);
      fakeAt(t0 + 40 * M + 1000); renderFocus(); await sleep(80);   // 25 專注 + 10 休息 + 5 專注，一次補算
      await answer(true);
      const pb3b = state.week.blocks.find(b => b.id === 'pomo3'); ok('task: linked block done and task checked', state.week.blocks.find(b => b.id === 'pomo3').done && state.week.blocks.find(b => b.id === 'pomo3').actual === 30 && state.tasks.find(t => t.id === 'tpomo3').done, JSON.stringify(pb3b) + ' ' + JSON.stringify(state.tasks.find(t => t.id === 'tpomo3')) + ' refl=' + $('#reflDlg').open);

      // settings
      $('#skinBtn').click(); await sleep(30);
      ok('settings: pomodoro options', $('#pomoMode').value === 'split' && $('#pomoWork').value === '25' && $('#pomoBreak').value === '10');
      $('#pomoMode').value = 'single'; $('#pomoMode').dispatchEvent(new Event('change'));
      ok('settings: 不分割 saved and minutes locked', prefGet('planner-pomo-mode') === 'single' && $('#pomoWork').disabled);
      $('#pomoMode').value = 'split'; $('#pomoMode').dispatchEvent(new Event('change'));
      $('#pomoWork').value = '30'; $('#pomoWork').dispatchEvent(new Event('change'));
      ok('settings: focus minutes saved', prefGet('planner-pomo-work') === '30');
      prefSet('planner-pomo-work', '25'); $('#skinClose').click();

      restoreDate(); await clearAlarms();
      state.week.blocks = state.week.blocks.filter(b => !/^pomo/.test(b.id)); state.tasks.filter(t => /背單字 Unit 5|物理講義/.test(t.title)).forEach(t => state.db.doc('tasks/' + t.id).delete()); state.tasks = state.tasks.filter(t => !/背單字 Unit 5|物理講義/.test(t.title)); saveWeek(); render(); await sleep(80);
    }

    // widget + reminders
    setWidget(true); await sleep(30);
    ok('widget: visible', getComputedStyle($('#widget')).display !== 'none');
    showRemind('測試提醒'); ok('widget: reminder bar', !$('#wRemind').hidden);
    setWidget(false);

    // night warning with fake 23:12
    fakeNow(2026, 9, 20, 23, 12); nightSlot = null; nightCheck(); restoreDate();
    ok('night: warning shown at 23:12', !$('#nightBar').hidden && $('#nightText').textContent.includes('23:12'));
    $('#nightOk').click();
    fakeNow(2026, 9, 20, 22, 40); nightCheck(); restoreDate();
    ok('night: quiet before 23:00', $('#nightBar').hidden);

    // keyboard
    const m0 = ymd(state.monday);
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })); await sleep(50);
    ok('keys: → next week', ymd(state.monday) !== m0);
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 't', bubbles: true })); await sleep(50);
    ok('keys: T back to this week', ymd(state.monday) === ymd(mondayOf(new Date())));

    // skins
    for (const s of SKINS) {
      document.querySelector('#skinBtn').click(); document.querySelector(`#skinList [data-skin="${s.id}"]`).click(); await sleep(120);
      ok('skin: ' + s.name, document.body.dataset.skin === s.id && getComputedStyle(document.body).backgroundColor !== '');
    }
    $('#fxToggle').checked = false; $('#fxToggle').dispatchEvent(new Event('change')); await sleep(30);
    ok('fx: can turn off', document.body.classList.contains('nofx'));
    $('#fxToggle').checked = true; $('#fxToggle').dispatchEvent(new Event('change'));
    document.querySelector(`#skinList [data-skin="default"]`).click(); $('#skinClose').click();

    // copy / clear / ctrl+z
    const n0 = state.week.blocks.length;
    $('#clearW').click(); await sleep(30);
    ok('clear: week emptied', state.week.blocks.length === 0);
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true })); await sleep(30);
    ok('ctrl+z: clear undone', state.week.blocks.length === n0);

    await computeStreak();
    ok('streak: computed without error', true);

    // clearer target labels
    state.week.blocks = []; saveWeek(); render(); await sleep(50);
    const tgText = $('#targets').textContent;
    ok('labels: "還差" and "目標" shown', tgText.includes('還差 215 分') && tgText.includes('每週目標 215 分'), tgText.slice(0, 60));
    ok('labels: header sum readable', $('#targetSum').textContent.startsWith('已排'));
    ok('labels: warn pill readable', $('#warnbar').textContent.includes('數學 還差 215 分'));
    placeNew({ name: '數學題目', cat: 'study', minutes: 215 }, 0, 18 * 60 + 40); await sleep(50);
    ok('labels: reached target shows 達標', $('#targets').textContent.includes('達標 ✓'));
    ok('labels: no prime marks left', !document.body.innerText.includes('′'));

    // default skin animated background
    skin = 'default'; fxOn = true; applySkin(); await sleep(100);
    ok('default skin: aurora particles', fx.parts.length === 4);

    // sticky note: 5 taps open the app
    setWidget(true); await sleep(30);
    ok('note: widget shown', document.body.classList.contains('w'));
    const wEl = $('#widget');
    for (let i = 0; i < 4; i++) wEl.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    ok('note: 4 taps keep the note', document.body.classList.contains('w') && document.querySelectorAll('#tapDots i.on').length === 4);
    wEl.dispatchEvent(new MouseEvent('click', { bubbles: true })); await sleep(30);
    ok('note: 5th tap opens full app', !document.body.classList.contains('w'));
    setWidget(true);
    for (let i = 0; i < 3; i++) wEl.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await sleep(2000);
    ok('note: tap count resets after a pause', document.querySelectorAll('#tapDots i.on').length === 0 && document.body.classList.contains('w'));
    const cbx = document.querySelector('#wTasks input');
    if (cbx) { cbx.click(); await sleep(30); ok('note: ticking a task does not count as a tap', document.body.classList.contains('w')); }
    setWidget(false);

    // theme sync through data
    $('#skinBtn').click(); document.querySelector('#skinList [data-skin="sakura"]').click(); await sleep(150); $('#skinClose').click();
    ok('sync: chosen skin saved to data', window.__store['config/main'].skin === 'sakura');
    await state.db.doc('config/main').set({ ...window.__store['config/main'], skin: 'ocean' }); await sleep(150);
    ok('sync: skin changed elsewhere is applied here', skin === 'ocean' && document.body.dataset.skin === 'ocean');
    skin = 'default'; state.config.skin = 'default'; saveConfig(); applySkin();

    // missed blocks and an accurate rate (fake "now" = Wednesday 22:00 of this week)
    document.getElementById('thisW').click(); await sleep(100);
    const wm = state.monday;
    fakeNow(wm.getFullYear(), wm.getMonth(), wm.getDate() + 2, 22, 0);
    state.week.blocks = [
      { id: 'mA', day: 0, start: '18:40', minutes: 50, name: '數學題目', cat: 'study', done: false },
      { id: 'mB', day: 1, start: '18:40', minutes: 50, name: '物理題目', cat: 'study', done: true },
      { id: 'mC', day: 2, start: '23:00', minutes: 30, name: '國文', cat: 'study', done: false },
      { id: 'mD', day: 3, start: '18:40', minutes: 50, name: '化學', cat: 'study', done: false },
      { id: 'mE', day: 0, start: '21:00', minutes: 40, name: '生物', cat: 'study', done: false, skipped: true },
      { id: 'mF', day: 0, start: '22:00', minutes: 60, name: '休息', cat: 'rest', done: false }];
    saveWeek(); render(); await sleep(50);
    const elA = document.querySelector('[data-bid="mA"]'), elE = document.querySelector('[data-bid="mE"]'), elD = document.querySelector('[data-bid="mD"]'), elF = document.querySelector('[data-bid="mF"]');
    ok('missed: past unticked block marked 未完成', elA.classList.contains('missed') && elA.textContent.includes('未完成'));
    ok('missed: future block not marked', !elD.classList.contains('missed'));
    ok('missed: rest blocks never marked', !elF.classList.contains('missed'));
    ok('missed: cancelled block shown as 已取消', elE.classList.contains('skipped') && !elE.classList.contains('missed'));
    setReport(true); await sleep(200);
    const ringTxt = document.querySelector('#rKpis .ring span').textContent;
    ok('rate: only due blocks count (50 of 100 min = 50%)', ringTxt === '50%', ringTxt);
    ok('rate: missed KPI shows 0.8h', document.querySelector('.kpi-miss .v').textContent === '0.8h', document.querySelector('.kpi-miss .v').textContent);
    ok('rate: future time listed separately', [...document.querySelectorAll('#rKpis .kpi')].some(k => k.textContent.includes('還沒到') && k.textContent.includes('1.3h')));
    report.mode = 'day'; report.day = new Date(wm.getFullYear(), wm.getMonth(), wm.getDate()); await renderReport();
    ok('rate: day list shows ✗ 未完成 and 取消', $('#rList').textContent.includes('✗ 未完成') && $('#rList').textContent.includes('取消'));
    report.mode = 'week'; setReport(false);
    openBlock('mD'); $('#dSkip').checked = true; $('#dlgForm').requestSubmit(); await sleep(50);
    ok('cancel: dialog cancels a block', state.week.blocks.find(b => b.id === 'mD').skipped === true);
    const ckA = document.querySelector('[data-toggle="mA"]'), ra = ckA.getBoundingClientRect(); ptr(ckA, 'pointerdown', ra.left + 2, ra.top + 2); await sleep(50);
    ok('missed: ticking it later clears 未完成', !document.querySelector('[data-bid="mA"]').classList.contains('missed'));
    // 「我沒做完」 on a block whose time has not come yet
    const fD = document.querySelector('[data-fail="mD"]');
    state.week.blocks.find(b => b.id === 'mD').skipped = false; delete state.week.blocks.find(b => b.id === 'mD').skipped; render(); await sleep(30);
    const fD2 = document.querySelector('[data-fail="mD"]'), rD = fD2.getBoundingClientRect(); ptr(fD2, 'pointerdown', rD.left + 2, rD.top + 2); await sleep(50);
    ok('not-done: ✗ marks a future block 未完成 at once', document.querySelector('[data-bid="mD"]').classList.contains('missed') && state.week.blocks.find(b => b.id === 'mD').failed === true);
    report.mode = 'week'; setReport(true); await sleep(200);
    ok('not-done: counts in the rate right away', document.querySelector('.kpi-miss .v').textContent !== '0.0h');
    setReport(false);
    openBlock('mD'); ok('not-done: dialog shows the box ticked', $('#dFail').checked && !$('#dDone').checked);
    $('#dDone').checked = true; $('#dDone').dispatchEvent(new Event('change')); ok('not-done: ticking 完成了 unticks 沒做完', !$('#dFail').checked);
    $('#dlgForm').requestSubmit(); await sleep(50);
    ok('not-done: saving as done clears the mark', !state.week.blocks.find(b => b.id === 'mD').failed && state.week.blocks.find(b => b.id === 'mD').done);
    restoreDate(); state.week.blocks = []; saveWeek(); render();

    // default plan auto-fill for an unplanned week
    ok('default plan: template loaded', (state.templates || []).some(t => t.id === 'default-plan') && state.config.defaultTemplate === 'default-plan');
    document.getElementById('thisW').click(); await sleep(50);
    for (let i = 0; i < 2; i++) { document.getElementById('nextW').click(); await sleep(250); }
    ok('default plan: unplanned future week auto-filled', state.week.blocks.length > 30 && state.week.autofilled === '預設計畫', state.week.blocks.length);
    ok('default plan: written to data', (window.__store['weeks/' + ymd(state.monday)]?.blocks || []).length === state.week.blocks.length);
    const filled = state.week.blocks.length;
    state.week.blocks.pop(); saveWeek(); render(); document.getElementById('prevW').click(); await sleep(150); document.getElementById('nextW').click(); await sleep(250);
    ok('default plan: an edited week is not refilled', state.week.blocks.length === filled - 1);
    document.getElementById('nextW').click(); await sleep(250);
    $('#toastUndo').click(); await sleep(50);
    ok('default plan: undo leaves the week empty', state.week.blocks.length === 0);
    document.getElementById('prevW').click(); await sleep(150); document.getElementById('nextW').click(); await sleep(250);
    ok('default plan: emptied week stays empty', state.week.blocks.length === 0);
    // a past week is never auto-filled
    document.getElementById('thisW').click(); await sleep(50);
    for (let i = 0; i < 3; i++) { document.getElementById('prevW').click(); await sleep(200); }
    ok('default plan: past week untouched', state.week.blocks.length === 0 && !window.__store['weeks/' + ymd(state.monday)]);
    document.getElementById('thisW').click(); await sleep(150);
    // 資訊班 Saturday: template rest block at 11:00 is dropped instead of clashing
    const infoMon = mondayOf(new Date(2026, 10, 7)); state.monday = infoMon; subscribeWeek(); await sleep(300);
    ok('default plan: rest block skipped on 資訊班 Saturday', !state.week.blocks.some(b => b.day === 5 && b.start === '11:00'));
    ok('default plan: no clashes on 資訊班 week', ![0,1,2,3,4,5,6].some(d => blocksFor(d).some(b => fixedFor(d).some(f => f.s < b.e && b.s < f.e))));
    // template dialog default toggle
    document.getElementById('thisW').click(); await sleep(100);
    $('#tplBtn').click(); await sleep(30);
    ok('default plan: badge in template list', $('#tplList').textContent.includes('預設'));
    $('[data-tpl-def="default-plan"]').click(); await sleep(30);
    ok('default plan: can be switched off', !state.config.defaultTemplate);
    $('[data-tpl-def="default-plan"]').click(); await sleep(30); $('#tplCancel').click();
    ok('default plan: switched back on', state.config.defaultTemplate === 'default-plan');
    // ---- SparkGlow-style features ----
    document.getElementById('thisW').click(); await sleep(150);
    const sm = state.monday;
    fakeNow(sm.getFullYear(), sm.getMonth(), sm.getDate() + 2, 19, 0);   // Wednesday 19:00
    state.week.blocks = [
      { id: 's1', day: 2, start: '18:40', minutes: 50, name: '數學題目', cat: 'study', done: false },
      { id: 's2', day: 2, start: '19:40', minutes: 25, name: '預習化學', cat: 'preview', done: false },
      { id: 's3', day: 0, start: '18:40', minutes: 50, name: '物理題目', cat: 'study', done: false },
      { id: 's4', day: 1, start: '18:40', minutes: 50, name: '國文', cat: 'study', done: true, reflection: { text: '文言文注釋背完了', done: true } }];
    saveWeek(); render(); await sleep(60);
    ok('now-pick: card shown', !$('#nowPick').hidden);
    ok('now-pick: suggests the block happening now', $('#npTitle').textContent === '數學題目' && $('#npWhy').textContent.includes('現在排的'), $('#npTitle').textContent);
    $('#npNext').click(); await sleep(20);
    ok('now-pick: 換一個 gives another suggestion', $('#npTitle').textContent !== '數學題目', $('#npTitle').textContent);
    ok('now-pick: missed block is a candidate', nowCandidates().some(c => c.kind === 'missed' && c.block.id === 's3'));
    restoreDate();
    { const wed = addDays(state.monday, 2); fakeNow(wed.getFullYear(), wed.getMonth(), wed.getDate(), 23, 20); } nowPickIndex = 0; renderNowPick(); restoreDate();
    ok('now-pick: after 23:00 it says go to sleep', $('#npTitle').textContent === '去睡覺');
    renderNowPick();

    ok('ai: AI features visible when Claude is available', !document.querySelector('[data-ai]').hidden);
    // goals (replaces the old AI split)
    $('#newGoalBtn').click(); await sleep(30);
    ok('goal: dialog opens with AI button', $('#goalDlg').open && !$('#goalAiBtn').hidden);
    $('#goalTitle').value = '二段數學考 80 分'; $('#goalDue').value = ymd(addDays(state.monday, 20));
    $('#goalAiBtn').click(); await sleep(120);
    ok('goal: AI fills weekly steps', $('#goalSteps').value.split('\n').length === 3 && $('#goalSteps').value.startsWith('週'));
    $('#goalSteps').value = '週1｜讀課本 2-1 重點 25分\n週2｜做習題 1~10 40分\n週3｜總複習 50分';
    const nTasks = state.tasks.length; $('#goalForm').requestSubmit(); await sleep(80);
    const gl = state.goals.find(g => g.title === '二段數學考 80 分');
    ok('goal: created', !!gl && !$('#goalDlg').open);
    const gts = state.tasks.filter(t => t.goalId === gl.id);
    ok('goal: steps became tasks spread over 3 weeks', gts.length === 3 && new Set(gts.map(t => t.showFrom)).size === 3 && state.tasks.length === nTasks + 3);
    ok('goal: week-1 step shows up this week', gts.some(t => t.showFrom === ymd(state.monday) && t.title === '讀課本 2-1 重點' && t.minutes === 25));
    ok('goal: card shows progress', $('#goals').textContent.includes('0/3') && $('#goals').textContent.includes('下一步：讀課本 2-1 重點'));
    const gcb = document.querySelector(`#tasks [data-tdone="${gts[0].id}"]`) || document.querySelector(`[data-tdone="${gts[0].id}"]`); gcb.checked = true; gcb.dispatchEvent(new Event('change', { bubbles: true })); await sleep(50);
    ok('goal: ticking a step moves progress', $('#goals').textContent.includes('1/3'));
    ok('goal: coach data includes goals', weekFacts().includes('二段數學考 80 分'));
    const gd = document.querySelector(`[data-gdel="${gl.id}"]`); gd.click(); document.querySelector(`[data-gdel="${gl.id}"]`).click(); await sleep(50);
    ok('goal: delete removes goal and unfinished steps', !state.goals.some(g => g.id === gl.id) && state.tasks.filter(t => t.goalId === gl.id).length === 1);
    $('#toastUndo').click(); await sleep(50);
    ok('goal: undo brings it back', state.goals.some(g => g.id === gl.id) && state.tasks.filter(t => t.goalId === gl.id).length === 3);

    // reorganized UI
    ok('ui: week tools live in one menu', $('#weekMenu .menu-list').contains($('#replan')) && $('#weekMenu .menu-list').contains($('#clearW')));
    $('#weekMenu').open = true; $('#tplBtn').click(); await sleep(30);
    ok('ui: menu closes after choosing', !$('#weekMenu').open && $('#tplDlg').open); $('#tplCancel').click();
    $('#toReport').click(); await sleep(100); ok('ui: 報表 tab', document.body.classList.contains('r') && $('#toGrid').getAttribute('aria-pressed') === 'false');
    $('#toGrid').click(); await sleep(30); ok('ui: 時間表 tab', !document.body.classList.contains('r'));
    document.querySelector('[data-hv="cat"]').click(); ok('ui: hours card switches to 類別', !document.querySelector('[data-hpane="cat"]').hidden && document.querySelector('[data-hpane="sub"]').hidden);
    document.querySelector('[data-hv="sub"]').click();
    ok('ui: coach card holds the daily note', $('#claudeNote').closest('.card').textContent.includes('教練'));
    ok('ui: fixed items and privacy moved into settings', $('#skinDlg').contains($('#newFixed')) && $('#skinDlg').contains($('#exportAll')) && $('#skinDlg').contains($('#exportNow')));
    $('#skinBtn').click(); await sleep(30);
    $('#prefNight').checked = false; $('#prefNight').dispatchEvent(new Event('change'));
    fakeNow(2026, 9, 21, 23, 15); nightSlot = null; nightCheck(); restoreDate();
    ok('ui: night warning can be switched off', $('#nightBar').hidden);
    $('#prefNight').checked = true; $('#prefNight').dispatchEvent(new Event('change')); $('#skinClose').click();

    $('#coachChips [data-q]').click(); await sleep(80);
    ok('coach: answer shown', $('#coachOut').textContent.startsWith('測試回答'));
    ok('coach: prompt carries real week data', window.__lastPrompt.includes('這週各科') && window.__lastPrompt.includes('文言文注釋背完了'));

    fakeNow(sm.getFullYear(), sm.getMonth(), sm.getDate() + 2, 22, 0);
    setReport(true); await sleep(250);
    ok('sky: night-sky card in week report', !$('#rSkyCard').hidden && $('#rSky').width > 0);
    ok('sky: brightness and stars shown', $('#rSkyMeta').textContent.includes('亮度') && $('#rSkyMeta').textContent.includes('亮起 1 顆星'), $('#rSkyMeta').textContent);
    ok('review: reflections listed', $('#rReview').textContent.includes('文言文注釋背完了'));
    document.querySelector('[data-rmode="month"]').click(); await sleep(200);
    ok('sky: hidden outside week view', $('#rSkyCard').hidden);
    document.querySelector('[data-rmode="week"]').click(); setReport(false); restoreDate();

    let exported = null; const realSave = downloadsApi.save; downloadsApi.save = async o => { exported = JSON.parse(o.data); return realSave(o); };
    $('#exportAll').click(); await sleep(150); downloadsApi.save = realSave;
    ok('export: goals and closures included', Array.isArray(exported?.goals) && exported.goals.length > 0 && Array.isArray(exported?.closures), JSON.stringify(Object.keys(exported || {})));
    ok('export: backup file offered', window.__saved && window.__saved.filename.includes('備份') && window.__saved.len > 100, JSON.stringify(window.__saved));
    $('#wipeConfirm').value = ''; $('#wipeAll').click(); await sleep(50);
    ok('wipe: needs the word 刪除 first', Object.keys(window.__store).some(k => k.startsWith('weeks/')));
    $('#wipeConfirm').value = '刪除'; $('#wipeAll').click(); await sleep(300);
    ok('wipe: all records deleted, settings kept', !Object.keys(window.__store).some(k => /^(weeks|tasks|wishes|templates)\//.test(k)) && !!window.__store['config/main']);
  } catch (e) { results.push('CRASH ' + (e && e.stack || e)); }
  ok('no uncaught errors', errors.length === 0, errors.join(' | '));
  return results;
};
