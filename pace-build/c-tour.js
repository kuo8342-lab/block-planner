/* 步調 Pace: first-run guided tour. A spotlight on one part of the page at a time with a step card at the bottom
   (上一步 / 下一步 / 略過). It puts a sample block and a sample task in place to show them; at the end it asks
   whether to keep them, and skipping clears them. Runs once after the "who are you" question; Settings → 外觀
   has 「重新看教學」. Injected by build-c.js after c-persona.js. */
(() => {
  const DONE = 'pace-tour-done';
  const $ = id => document.getElementById(id);
  const card = sel => () => { const el = document.querySelector(sel); return el && (el.closest('.card') || el); };
  let sample = { block: null, task: null };

  const STEPS = [
    { title: '歡迎使用步調！', text: '跟著走一遍，大約 1 分鐘。過程中會先放一個範例方塊和一個範例任務給你看，最後再問你要不要留下。隨時可以按「略過」。' },
    { el: card('#palette'), title: '方塊', text: '常做的事做成方塊，拖到時間表上就排好了（手機要先按住一下再拖）。點方塊可以改名、刪除，或直接選時間排進去。' },
    { el: () => sample.block && document.querySelector(`[data-bid="${sample.block}"]`), title: '時間表', text: '這是剛放進時間表的範例方塊。點它可以改時間、開始專注；往下拉底部可以改長度；右上角 ✓ 是完成、✗ 是沒做完。灰色斜線是你的固定行程。' },
    { el: card('#qa'), title: '這週的任務', text: '在框框打字按 Enter 就新增任務，到了那週會自動出現。任務可以拖進時間表變成方塊。範例任務就在這裡。' },
    { el: card('#goals'), title: '目標', text: '寫下大目標和期限，拆成每週的小步驟，到那週會自動出現在任務裡。' },
    { el: () => { const n = $('nowPick'); return n && !n.hidden ? n : null; }, title: '現在做這件', text: '幫你挑「現在最該做的一件事」。按「開始專注」就開始番茄鐘；累了按「⚡ 腦袋累了」，會改推薦輕鬆的事。' },
    { el: card('#wishes'), title: '願望清單', text: '想做但還沒空的事先丟這裡，有空檔時一鍵排進時間表。' },
    { el: () => $('weekMenu'), title: '本週工具', text: '沒做完的方塊一鍵重排到後面的空檔，也可以把排好的一週存成範本、複製上週。' },
    { el: () => $('toReport'), title: '報表', text: '看這週完成多少、各科花了多少時間，還有每週回顧。' },
    { el: () => $('toWidget'), title: '便利貼', text: '把畫面縮成一張小卡，只看現在和接下來要做的事。連點 5 下回到完整畫面。' },
    { el: () => $('skinBtn'), title: '設定', text: '作息（時間表從幾點到幾點、睡覺時間）、語言、同步登入、共筆群組、AI、教練卡片和備份都在這裡。' },
    { el: () => { const b = $('installBtn'); return b && !b.hidden ? b : null; }, title: '安裝 App', text: '裝到手機或電腦桌面，用起來像一般 App。Android 還有桌面小工具。' },
    { title: '教學結束！', text: '剛剛的範例方塊和範例任務要留下來嗎？之後也可以在「設定 → 外觀」重新看一次教學。', last: true }
  ];

  /* ---------- what's new: people who already took the tour only see these after an update.
     Every Pace update adds an entry here (English goes in i18n-en.json). ---------- */
  const WHATS_NEW = [
    { v: '2026-10-28', steps: [
      { title: '更新了什麼', text: '步調更新了！接下來只介紹新的地方，按「下一步」或點亮起來的地方往下看。' },
      { el: () => $('skinBtn'), title: '設定 → 外觀', text: '可以隨時換語言（中文／English）、換身份的預設方塊，也可以重新看完整教學。' },
      { title: 'Android App 會提醒你更新', text: '用 Android App 的話，有新版本時畫面上方會出現「有新版本」，按一下就能下載更新，資料不會不見。' }
    ] },
    { v: '2026-10-28b', steps: [
      { title: '新功能：共筆群組', text: '跟朋友、同學組一個群組，誰完成了方塊或任務，大家都會看到「搞定！」，還能按 👏 互相拍拍。只會分享完成的事，時間表別人看不到。' },
      { el: () => $('skinBtn'), title: '設定 → 共筆群組', text: '先在「同步」登入帳號，再建立群組，按「邀請朋友」把連結傳出去；或輸入朋友給你的邀請碼加入。' },
      { el: () => { const c = $('grpCard'); return c && !c.hidden ? c : null; }, title: '群組動態', text: '大家完成的事會出現在這裡，按 👏 幫他拍拍。' }
    ] }
  ];
  const LATEST = WHATS_NEW[WHATS_NEW.length - 1].v;
  const SEEN = 'pace-seen-version';
  let steps = STEPS, mode = 'full';
  const avail = st => !st.el || !!st.el();

  /* ---------- sample items, marked so they can be cleared ---------- */
  function addSamples() {
    if (!state.config || !isThisWeek()) return;
    const slot = suggest(50, null)[0];
    const today = (new Date().getDay() + 6) % 7;
    const b = { id: uid(), day: slot ? slot.day : today, start: hm(slot ? slot.start : Math.max(START, 19 * 60)), minutes: 50, name: '（範例）讀書', cat: 'study', done: false, tour: true };
    state.week.blocks.push(b); saveWeek();
    const t = { id: uid(), title: '（範例）交英文作業', minutes: 30, cat: 'study', showFrom: ymd(new Date()), due: '', done: false, createdAt: new Date().toISOString(), tour: true };
    state.tasks.push(t); saveTask(t);
    sample = { block: b.id, task: t.id };
    render();
  }
  function clearSamples() {
    state.week.blocks = state.week.blocks.filter(b => !b.tour); saveWeek();
    for (const t of state.tasks.filter(t => t.tour)) { if (state.db) queue(() => state.db.doc('tasks/' + t.id).delete()); }
    state.tasks = state.tasks.filter(t => !t.tour);
    sample = { block: null, task: null }; render();
  }
  function keepSamples() {
    state.week.blocks.forEach(b => { if (b.tour) { delete b.tour; b.name = b.name.replace('（範例）', ''); } }); saveWeek();
    state.tasks.forEach(t => { if (t.tour) { delete t.tour; t.title = t.title.replace('（範例）', ''); saveTask(t); } });
    sample = { block: null, task: null }; render();
  }

  /* ---------- spotlight + step card ---------- */
  const root = document.createElement('div');
  root.id = 'tour'; root.hidden = true;
  root.innerHTML = '<div class="tour-block"></div><div class="tour-hi" id="tourHi"></div>' +
    '<div class="tour-card" role="dialog" aria-live="polite"><div class="tour-top"><span class="tour-step" id="tourStep"></span><button type="button" class="btn plain" id="tourSkip">略過</button></div>' +
    '<div class="tour-title" id="tourTitle"></div><p class="tour-text" id="tourText"></p><div class="tour-dots" id="tourDots"></div>' +
    '<div class="tour-acts" id="tourActs"></div></div>';
  document.body.appendChild(root);
  let i = 0, target = null;
  let scrollInset = null;

  function restoreScrollInset() {
    if (!scrollInset) return;
    scrollInset.el.style.paddingBottom = scrollInset.padding;
    scrollInset = null;
  }
  function targetScroller() {
    for (let el = target?.parentElement; el && el !== document.body; el = el.parentElement) {
      if (el.clientHeight && /auto|scroll/.test(getComputedStyle(el).overflowY)) return el;
    }
    return null;
  }
  function revealSpotlight() {
    restoreScrollInset();
    if (!target) return;
    if (!window.paceUI?.isMobile?.()) {
      target.scrollIntoView({ block: 'center' });
      const r = target.getBoundingClientRect();
      if (r.bottom > innerHeight - 240) scrollBy(0, r.bottom - (innerHeight - 260));
      return;
    }
    const scroller = targetScroller();
    if (!scroller) return; // Header controls already sit above the card.
    const card = root.querySelector('.tour-card').getBoundingClientRect();
    const area = scroller.getBoundingClientRect();
    const bottom = Math.min(area.bottom, card.top - 16), top = Math.max(0, area.top) + 10;
    // Extra scroll space lets even the final Settings / Install buttons clear the card.
    const reserve = Math.max(0, area.bottom - bottom);
    scrollInset = { el: scroller, padding: scroller.style.paddingBottom };
    scroller.style.paddingBottom = (parseFloat(getComputedStyle(scroller).paddingBottom) + reserve) + 'px';
    const r = target.getBoundingClientRect();
    const room = Math.max(0, bottom - top);
    const wantedTop = top + Math.max(0, (room - r.height) / 2);
    scroller.scrollTo({ top: scroller.scrollTop + r.top - wantedTop, behavior: 'instant' });
  }

  function place() {
    const hi = $('tourHi');
    const none = !target || !document.body.contains(target);
    root.classList.toggle('nohi', none);   // nothing to point at: dim the whole page instead
    if (none) { hi.hidden = true; return; }
    const r = target.getBoundingClientRect(), pad = 6;
    let left = r.left - pad, top = r.top - pad, right = r.right + pad, bottom = r.bottom + pad;
    if (window.paceUI?.isMobile?.()) {
      const area = targetScroller()?.getBoundingClientRect();
      left = Math.max(0, left, area?.left || 0); right = Math.min(innerWidth, right, area?.right || innerWidth);
      top = Math.max(0, top, area?.top || 0);
      bottom = Math.min(bottom, root.querySelector('.tour-card').getBoundingClientRect().top - 10, area?.bottom || innerHeight);
    }
    Object.assign(hi.style, { left: left + 'px', top: top + 'px', width: Math.max(0, right - left) + 'px', height: Math.max(0, bottom - top) + 'px' });
    hi.hidden = false;
  }
  function show(n) {
    if (n >= steps.length) { close(); return; }   // the last what's-new item had nothing to point at
    i = n; const s = steps[i];
    target = s.el ? s.el() : null;
    if (s.el && !target) { show(n + 1); return; }   // e.g. 「現在做這件」 has nothing to show right now (上一步 skips these itself)
    // The C-only workspace reveals the existing target synchronously before measuring its spotlight.
    if (target) window.paceUI?.reveal?.(target);
    // count only the steps that will really be shown this time (skipped ones like an empty 「現在做這件」 don't count)
    const shown = steps.filter(avail), pos = shown.indexOf(s), endNew = mode === 'new' && i === steps.length - 1;
    $('tourStep').textContent = (pos + 1) + ' / ' + shown.length;
    $('tourTitle').textContent = s.title; $('tourText').textContent = s.text;
    $('tourDots').innerHTML = shown.map((_, k) => `<i class="${k === pos ? 'on' : ''}"></i>`).join('');
    $('tourSkip').hidden = !!s.last || endNew;
    $('tourActs').innerHTML = s.last
      ? '<button type="button" class="btn no" id="tourClear">不要，清掉範例</button><button type="button" class="btn yes" id="tourKeep">留下來</button>'
      : endNew ? (i > 0 ? '<button type="button" class="btn" id="tourPrev">上一步</button>' : '') + '<button type="button" class="btn yes" id="tourGotIt">知道了</button>'
      : (i > 0 ? '<button type="button" class="btn" id="tourPrev">上一步</button>' : '') + `<button type="button" class="btn primary" id="tourNext">${i === 0 && mode === 'full' ? '開始' : '下一步'}</button>`;
    revealSpotlight(); place(); setTimeout(place, 400);
  }
  function close() { restoreScrollInset(); root.hidden = true; document.body.classList.remove('touring'); target = null; try { localStorage.setItem(SEEN, LATEST); } catch (e) {} }
  function finish(keep) {
    close();
    if (mode === 'new') return;   // the what's-new walk-through has no samples
    try { localStorage.setItem(DONE, '1'); } catch (e) {}
    if (keep) { keepSamples(); toast('已留下範例方塊和任務'); } else { clearSamples(); toast('範例已清掉，開始排你自己的一週吧'); }
  }
  root.addEventListener('click', e => {
    const id = e.target.id;
    const atEnd = steps[i].last || (mode === 'new' && i === steps.length - 1);
    if (id === 'tourNext' || (id === 'tourHi' && !atEnd)) { show(i + 1); }   // tapping the lit spot also moves on
    else if (id === 'tourHi' || id === 'tourGotIt') { if (mode === 'new') close(); }
    else if (id === 'tourPrev') { let k = i - 1; while (k > 0 && !avail(steps[k])) k--; show(k); }
    else if (id === 'tourSkip') finish(false);
    else if (id === 'tourKeep') finish(true);
    else if (id === 'tourClear') finish(false);
  });
  addEventListener('resize', () => { if (!root.hidden) { revealSpotlight(); place(); } }); addEventListener('scroll', place, true);
  document.addEventListener('keydown', e => { if (!root.hidden && e.key === 'Escape') finish(false); });

  window.paceTour = () => {
    if (!state.ready || !state.config) return;
    if (typeof setWidget === 'function' && document.body.classList.contains('w')) setWidget(false);
    if (document.body.classList.contains('r')) $('toGrid')?.click();
    steps = STEPS; mode = 'full';
    if (!sample.block) addSamples();   // up front, so the step count is right from step 1
    document.body.classList.add('touring'); root.hidden = false; show(0);
  };
  function whatsNew(since) {
    const list = WHATS_NEW.filter(w => w.v > since).flatMap(w => w.steps);
    if (!list.length || !state.ready) return;
    steps = list; mode = 'new';
    document.body.classList.add('touring'); root.hidden = false; show(0);
  }

  /* ---------- first open: after the "who are you" question is answered ---------- */
  let tries = 0;
  (function wait() {
    let done = false, seen = ''; try { done = localStorage.getItem(DONE) === '1'; seen = localStorage.getItem(SEEN) || ''; } catch (e) {}
    if (done) {   // already took the tour: after an update, show only what's new
      if (seen >= LATEST) return;
      if (!state.ready || !state.config) { if (++tries < 600) setTimeout(wait, 500); return; }
      setTimeout(() => whatsNew(seen), 800); return;
    }
    const persona = $('personaDlg');
    let picked = false; try { picked = !!localStorage.getItem('pace-persona'); } catch (e) {}
    if (!state.ready || !state.config || !picked || persona?.open) { if (++tries < 600) setTimeout(wait, 500); return; }
    setTimeout(window.paceTour, 500);
  })();

  /* ---------- Settings → 外觀: watch it again ---------- */
  const anchor = document.querySelector('#skinDlg .lang-pick:last-of-type') || document.querySelector('#skinDlg .lang-pick');
  if (anchor) {
    const b = Object.assign(document.createElement('button'), { type: 'button', className: 'btn', id: 'tourAgain', textContent: '重新看教學' });
    anchor.after(b);
    b.addEventListener('click', () => { $('skinDlg').close(); setTimeout(window.paceTour, 200); });
  }
})();
