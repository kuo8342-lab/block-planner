/* 步調 Pace: rest suggestions. Rest is never something you pay for or earn: after a stretch of study, when today's limit is reached, or when today
   is all done, a small card suggests a few things from your own list. One tap puts it in the next free spot today as a normal rest block
   (so it can be moved, ticked, and it counts toward 會休息的人). Ignoring it costs nothing. The list and how often are yours, in the rewards dialog.
   Works in A and C; loaded after c-rewards.js. */
(() => {
  if (typeof state === 'undefined' || typeof toggleDone !== 'function') return;
  const $ = id => document.getElementById(id);
  const after = $('xpNoXp')?.closest('label'); if (!after) return;
  const STARTER = [['不帶手機散步', 20], ['洗個熱水澡', 20], ['看喜歡的書', 30], ['聽完一張專輯', 40], ['泡杯茶放空', 15]];
  const ideas = () => { const l = state.config?.restIdeas; return Array.isArray(l) ? l.filter(x => x && x.name) : STARTER.map(([name, minutes]) => ({ name, minutes })); };
  const every = () => { const n = state.config?.restEvery; return Number.isFinite(n) ? n : 90; };   // minutes of study between suggestions; 0 = off
  const save = (list, ev) => { if (!state.config) state.config = {}; if (list) state.config.restIdeas = list; if (ev !== undefined) state.config.restEvery = ev; saveConfig(); };

  after.insertAdjacentHTML('afterend',
    '<h3 class="set-h">休息提案</h3>' +
    '<label>每讀幾分鐘提議一次休息（0 = 不提議）<input id="restEvery" type="number" min="0" max="600" step="15"></label>' +
    '<div class="rest-ideas" id="restIdeas"></div>' +
    '<div class="rest-add"><input id="restName" maxlength="24" placeholder="我的休息方式" aria-label="休息方式"><input id="restMin" type="number" min="5" max="180" step="5" value="20" aria-label="分鐘"><button class="btn" type="button" id="restAdd">新增</button></div>');
  document.body.insertAdjacentHTML('beforeend',
    '<div class="rest-tip" id="restTip" role="status" hidden><div class="rest-msg" id="restMsg"></div><div class="rest-opts" id="restOpts"></div><button class="btn plain" type="button" id="restNo">先不用</button></div>');
  const st = document.createElement('style');
  st.textContent = '.rest-ideas { display: flex; flex-direction: column; gap: 4px; } .rest-idea { display: flex; align-items: center; justify-content: space-between; gap: 8px; font-size: .84rem; padding: 4px 4px 4px 10px; border-radius: 9px; background: var(--panel-2); }' +
    '.rest-add { display: grid; grid-template-columns: minmax(0, 1fr) 72px auto; gap: 6px; } .rest-add input { min-width: 0; width: 100%; }' +
    '.rest-tip { position: fixed; z-index: 65; left: 50%; bottom: calc(88px + env(safe-area-inset-bottom, 0px)); transform: translateX(-50%); width: min(440px, calc(100vw - 24px)); display: flex; flex-direction: column; gap: 8px; padding: 12px 14px; border-radius: 14px; background-color: var(--bg); background-image: linear-gradient(var(--panel), var(--panel)); color: var(--fg); border: 1px solid var(--line); box-shadow: 0 12px 34px rgba(0,0,0,.22); font-size: .88rem; }' +
    '.rest-msg { font-weight: 700; } .rest-opts { display: flex; flex-wrap: wrap; gap: 6px; } .rest-tip #restNo { align-self: flex-end; padding: 2px 8px; font-size: .78rem; }';
  document.head.appendChild(st);

  function paintList() {
    const box = $('restIdeas'), l = ideas(); box.textContent = '';
    for (const [i, x] of l.entries()) {
      const row = Object.assign(document.createElement('div'), { className: 'rest-idea' }), t = document.createElement('span'), del = Object.assign(document.createElement('button'), { type: 'button', className: 'btn plain', textContent: '刪除' });
      t.textContent = x.name + '（' + x.minutes + ' 分）'; del.addEventListener('click', () => { save(l.filter((_, k) => k !== i)); paintList(); });
      row.append(t, del); box.append(row);
    }
    $('restEvery').value = every();
  }
  $('xpBtn')?.addEventListener('click', paintList);
  $('restEvery').addEventListener('change', e => save(null, Math.max(0, Math.min(600, Math.round(Number(e.target.value) || 0)))));
  $('restAdd').addEventListener('click', () => {
    const name = $('restName').value.trim().slice(0, 24), minutes = Math.round(Math.max(5, Math.min(180, Number($('restMin').value) || 20)) / 5) * 5;
    if (!name) { $('restName').focus(); return; }
    save([...ideas(), { name, minutes }]); $('restName').value = ''; paintList();
  });

  /* the next free spot today, on the 5-minute mark, that touches none of my blocks or fixed times */
  function freeSpot(day, minutes) {
    const taken = [...fixedFor(day), ...blocksFor(day).filter(b => !b.skipped)].map(x => [x.s, x.e]).sort((a, b) => a[0] - b[0]);
    const n = new Date(); let s = Math.max(START, Math.ceil((n.getHours() * 60 + n.getMinutes()) / 5) * 5);
    for (const [a, b] of taken) { if (s + minutes <= a) break; if (b > s) s = b; }
    return s + minutes <= END ? s : null;
  }
  let timer = 0;
  const hide = () => { clearTimeout(timer); $('restTip').hidden = true; };
  function offer(msg, day) {
    const l = ideas(); if (!l.length) return;
    const picks = [...l].sort(() => Math.random() - .5).slice(0, 3), box = $('restOpts'); box.textContent = '';
    $('restMsg').textContent = msg;
    for (const x of picks) {
      const b = Object.assign(document.createElement('button'), { type: 'button', className: 'btn', textContent: x.name + ' ' + x.minutes + ' 分' });
      b.addEventListener('click', () => {
        const s = freeSpot(day, x.minutes);
        hide();
        if (s == null) { toast('今天排不下「' + x.name + '」了，就直接去做吧。'); return; }
        const blk = { id: uid(), day, start: pad(Math.floor(s / 60)) + ':' + pad(s % 60), minutes: x.minutes, name: x.name, cat: 'rest' };
        state.week.blocks.push(blk); saveWeek(); render();
        toast('已把「' + x.name + '」排在 ' + blk.start, () => { state.week.blocks = state.week.blocks.filter(y => y.id !== blk.id); saveWeek(); render(); });
      });
      box.append(b);
    }
    $('restTip').hidden = false; clearTimeout(timer); timer = setTimeout(hide, 45000);
  }
  $('restNo').addEventListener('click', hide);

  /* since the last rest block I finished today, how much study is done? Each full stretch gets one suggestion */
  let offeredDay = '', offered = 0, limitSaid = false;
  const done0 = toggleDone;
  window.toggleDone = toggleDone = function (id) {
    const before = state.week.blocks.find(x => x.id === id)?.done;
    const r = done0.apply(this, arguments);
    try {
      const b = state.week.blocks.find(x => x.id === id), date = b && ymd(addDays(state.monday, b.day)), today = ymd(new Date());
      if (!b || !b.done || before || date !== today || !counts(b)) return r;
      if (offeredDay !== today) { offeredDay = today; offered = 0; limitSaid = false; }
      const day = state.week.blocks.filter(x => x.day === b.day && !x.skipped).sort((x, y) => toMin(x.start) - toMin(y.start));
      const lastRest = day.filter(x => x.done && x.cat === 'rest').pop(), since = day.filter(x => x.done && counts(x) && (!lastRest || toMin(x.start) > toMin(lastRest.start))).reduce((a, x) => a + x.minutes, 0);
      const total = day.filter(x => x.done && counts(x)).reduce((a, x) => a + x.minutes, 0), left = day.filter(x => !x.done && counts(x)).length;
      const h = state.config?.health, cap = Array.isArray(h?.max) ? h.max[b.day >= 5 ? 1 : 0] : 0, ev = every();
      if (since < offered) offered = 0;   // a rest was finished, or a block un-ticked: start counting again
      if (left === 0) offer('今天的都完成了，想怎麼休息？', b.day);
      else if (cap > 0 && total >= cap && !limitSaid) { limitSaid = true; offer('今天讀到你設的上限了，換個休息吧？', b.day); }
      else if (ev > 0 && since >= ev && since >= offered + ev) { offered = since; offer('已經讀了 ' + (since / 60).toFixed(since % 60 ? 1 : 0) + ' 小時，休息一下？', b.day); }
    } catch (e) {}
    return r;
  };
})();
