/* 步調 Pace: first-run guided tour. A spotlight on one part of the page at a time with a step card at the bottom
   (上一步 / 下一步 / 略過). It puts a sample block and a sample task in place to show them; at the end it asks
   whether to keep them, and skipping clears them. Runs once after the "who are you" question; Settings → 外觀
   has 「重新看教學」. Injected by build-c.js after c-persona.js. */
(() => {
  const DONE = 'pace-tour-done';
  const $ = id => document.getElementById(id);
  // 設定 and 便利貼 live in the menu on wide screens (the header copies are hidden there): light up whichever one is on screen
  const vis = (id, re) => { const el = $(id); if (el && el.getClientRects().length) return el; return [...document.querySelectorAll('.rail-utilities button, .workspace-nav button')].find(b => re.test(b.textContent) && b.getClientRects().length) || el; };
  const card = sel => () => { const el = document.querySelector(sel); return el && (el.closest('.card') || el); };
  let sample = { block: null, task: null };

  const STEPS = [
    { title: '歡迎使用步調！', text: '跟著走一遍，大約 1 分鐘。過程中會先放一個範例方塊和一個範例任務給你看，最後再問你要不要留下。隨時可以按「略過」。' },
    { el: card('#palette'), title: '方塊', text: '這是「方塊」頁（選單裡每一項都有自己的頁面）。常做的事做成方塊，按住拖一下，畫面會自動回到時間表讓你放下（手機要先按住一下再拖）。點方塊可以改名、刪除，或直接選時間排進去。' },
    { el: () => sample.block && document.querySelector(`[data-bid="${sample.block}"]`), title: '時間表', text: '這是剛放進時間表的範例方塊。點它可以改時間、開始專注；往下拉底部可以改長度；右上角 ✓ 是完成、✗ 是沒做完。灰色斜線是你的固定行程。' },
    { el: card('#qa'), title: '這週的任務', text: '在框框打字按 Enter 就新增任務，到了那週會自動出現。任務可以拖進時間表變成方塊。範例任務就在這裡。' },
    { el: card('#goals'), title: '目標', text: '寫下大目標和期限，拆成每週的小步驟，到那週會自動出現在任務裡。' },
    { el: () => { const n = $('nowPick'); return n && !n.hidden ? n : null; }, title: '現在做這件', text: '幫你挑「現在最該做的一件事」。按「開始專注」就開始番茄鐘，可以暫停；累了按「⚡ 腦袋累了」，會改推薦輕鬆的事。用過環境音的話，開始專注時會自動播你上次選的那一種。' },
    { el: card('#wishes'), title: '願望清單', text: '想做但還沒空的事先丟這裡，有空檔時一鍵排進時間表。' },
    { el: () => $('weekMenu'), title: '本週工具', text: '沒做完的方塊一鍵重排到後面的空檔，也可以把排好的一週存成範本、複製上週。' },
    { el: () => $('toReport'), title: '報表', text: '看這週完成多少、各科花了多少時間，還有每週回顧。' },
    { el: () => vis('toWidget', /便利貼|Sticky/), title: '便利貼', text: '把畫面縮成一張小卡，只看現在和接下來要做的事。連點 5 下回到完整畫面。' },
    { el: () => vis('skinBtn', /設定|Settings/), title: '設定', text: '作息（時間表從幾點到幾點、睡覺時間）、主題、語言、同步登入和備份都在這裡，打開是完整的一頁。右上角的 Lv 按鈕是「等級與成就」：等級、貼圖、環境音和本週小島；選單裡的「共筆群組」可以跟朋友聊天、排大家共用的時間表。' },
    { el: () => { const b = $('installBtn'); return b && !b.hidden ? b : null; }, title: '安裝 App', text: '裝到手機或電腦桌面，用起來像一般 App。Android 還有桌面小工具。' },
    { title: '教學結束！', text: '剛剛的範例方塊和範例任務要留下來嗎？之後也可以在「設定 → 外觀」重新看一次教學。', last: true }
  ];

  /* ---------- what's new: people who already took the tour only see these after an update.
     Every Pace update adds an entry here (English goes in i18n-en.json). ---------- */
  const WHATS_NEW = [
    { v: '2026-10-28', steps: [
      { title: '更新了什麼', text: '步調更新了！接下來只介紹新的地方，按「下一步」或點亮起來的地方往下看。' },
      { el: () => vis('skinBtn', /設定|Settings/), title: '設定 → 外觀', text: '可以隨時換語言（中文／English）、換身份的預設方塊，也可以重新看完整教學。' },
      { title: 'Android App 會提醒你更新', text: '用 Android App 的話，有新版本時畫面上方會出現「有新版本」，按一下就能下載更新，資料不會不見。' }
    ] },
    { v: '2026-10-28b', steps: [
      { title: '新功能：共筆群組', text: '跟朋友、同學組一個群組，誰完成了方塊或任務，大家都會看到「搞定！」，還能按 👏 互相拍拍。只會分享完成的事，時間表別人看不到。' },
      { el: () => vis('skinBtn', /設定|Settings/), title: '設定 → 共筆群組', text: '先在「同步」登入帳號，再建立群組，按「邀請朋友」把連結傳出去；或輸入朋友給你的邀請碼加入。' },
      { el: () => { const c = $('grpCard'); return c && !c.hidden ? c : null; }, title: '群組動態', text: '大家完成的事會出現在這裡，按 👏 幫他拍拍。' }
    ] },
    { v: '2026-10-28c', steps: [
      { title: '新介面上線了！', text: '步調換了新的樣子，電腦和手機都更好用。你的方塊、任務和所有資料都還在，功能也都跟原本一樣，只是換了位置。' },
      { el: () => [...document.querySelectorAll('.mobile-nav, .workspace-nav')].find(n => n.getClientRects().length) || null, title: '新的選單', text: '電腦在左邊、手機在最下面：時間表、任務、方塊、專注都有自己的頁面。目標、願望清單、共筆群組和報表放在「更多」或工作台裡。' },
      { title: '時間表：單日或整週', text: '時間表可以切換只看一天或看整週，上方的日期列點一下就跳到那天。按「新增」可以快速排方塊。' },
      { title: '專注可以暫停了', text: '番茄鐘多了「暫停」按鈕，臨時被打斷時按一下，暫停的時間不會算進專注時間，按「繼續」接著計時。' }
    ] },
    { v: '2026-10-28d', steps: [
      { title: '不需要 AI 金鑰了', text: '步調拿掉了 AI 設定和教練卡片，所有功能都不用 API 金鑰就能用。之前存的金鑰已經從這台裝置刪除。' },
      { el: () => $('newGoalBtn'), title: '目標自動拆步驟', text: '新增目標時按「自動拆成每週步驟」，會照期限和每週時間平均分好，最後一週排總複習。每一行都可以再改成具體內容。' }
    ] },
    { v: '2026-11-01', steps: [
      { title: '新功能：群組聊天室', text: '群組裡可以聊天了。進群組一定看得到成員，還有每個人這週的達成率和完成了幾個方塊。你的計畫要不要讓別人看（只能看、不能改），加入前由你決定。' },
      { el: () => { const c = $('grpCard'); return c && !c.hidden ? c : vis('skinBtn', /設定|Settings/); }, title: '進入聊天室', text: '在畫面上的群組名字，或「設定 → 共筆群組」按「聊天室」進去，看成員、他們公開的計畫和聊天內容。已經在群組裡的人，要先決定要讓群組看到什麼，別人才看得到你的資料。' },
      { el: () => vis('skinBtn', /設定|Settings/), title: '設定 → 外觀：6 個新主題', text: '新增夕陽、森林、薰衣草、極光、雪地、咖啡。每個主題的完成度有自己的樣子：星空是星星、櫻花是花朵、海洋是氣泡、森林是樹。到「設定」選一個喜歡的。' }
    ] },
    { v: '2026-11-04', steps: [
      { el: () => vis('skinBtn', /設定|Settings/), title: '再 6 個主題，和 40 種聲音', text: '「設定 → 外觀」新增沙漠、糖果、銀河、楓葉、雨夜、水墨，共 18 個主題，報表的完成圖也跟著換。通知聲和番茄鐘結束音效各有 20 種，可以按「試聽通知聲」先聽。群組裡每個人的達成率，會照他自己的主題顯示。' }
    ] },
    { v: '2026-11-04b', steps: [
      { el: () => $('xpBtn'), title: '等級、成就和本週任務', text: '每完成一個方塊就得到 XP，累積升級；還有 12 個成就和每週任務（比上週多一點點就好）。連續達標每週送一張休息券，有一天沒做到也不會歸零。不想看可以在這裡關掉。' },
      { el: () => { const c = $('grpCard'); return c && !c.hidden ? c : vis('skinBtn', /設定|Settings/); }, title: '群組的共用行程表', text: '在群組聊天室按「新增共用行程」，放入小組討論、社團練習或報告截止，群組每個人都會在自己的時間表上看到（虛線、右半邊），不會改到自己的計畫。跟你的行程撞在一起時會一直提醒，按「不再提醒這個衝突」才會停；時間有變會再提醒。' }
    ] },
    { v: '2026-11-06', steps: [
      { el: () => $('xpBtn'), title: '你的夥伴和寶箱', text: '上面這顆按鈕住著你的夥伴：從一顆蛋開始，升級就會長大。完成方塊會飛出 XP，同一天做越多加越多；每完成 5 個開一個寶箱，收集貼紙圖鑑。健康界線也在這裡，平日假日的上限和睡覺時間都由你自己設。' },
      { el: () => { const c = $('grpCard'); return c && !c.hidden ? c : vis('skinBtn', /設定|Settings/); }, title: '共用行程可以回覆了', text: '打開共用行程可以按「我會到／不會到」，看到誰會來。改過的內容有修改紀錄可以填回，新增的人也可以鎖定不讓別人改。「不再提醒這個衝突」現在每台裝置都記得。' }
    ] },
    { v: '2026-11-07', steps: [
      { el: () => $('xpBtn'), title: '每週蓋一座奇蹟', text: '在這裡按「本週奇蹟」：完成方塊就砌上一塊基石，10 塊加 3 天達標就落成，收進博物館。完成方塊時的音效和彩帶也換成跟著主題走，櫻花飄花瓣、森林飄葉子。這裡也有 12 種專注環境音（雨聲、壁爐、溪水…），升等會解鎖更多，音量可以自己調。' },
      { el: () => $('xpBtn'), title: '休息提案', text: '讀了一段時間、到達你設的上限，或今天都做完時，會從你自己的清單提議幾種休息，按一下就排進今天的空檔。休息不用賺，也不用付。清單和多久提議一次都在這裡改。' }
    ] },
    { v: '2026-11-13', steps: [
      { title: '版面整理過了', text: '這次把畫面整理得更清楚，東西都還在，只是各自有了自己的頁面。接下來帶你看新的位置。' },
      { el: () => [...document.querySelectorAll('.mobile-nav, .workspace-nav')].find(n => n.getClientRects().length) || null, title: '選單：一項一頁', text: '電腦左邊的選單現在只放連結：目標、方塊、這週任務、願望清單、本週時數、專注、共筆群組，點哪個就只看那一頁，寬螢幕會排成好幾欄。選單右上的「<|」可以把它收起來。拖方塊時會自動回到時間表。' },
      { el: () => $('xpBtn'), title: '等級與成就變成完整一頁', text: '按這顆 Lv 按鈕（或選單的「等級與成就」）會打開一整頁，不再擠在小視窗：等級、本週任務、本週小島、環境音、貼圖圖鑑、成就和健康界線各有一張卡片。再按一次就回時間表。' },
      { el: () => $('xpBtn'), title: '12 種環境音，跟著專注自動播', text: '環境音從 3 種變 12 種，有音量滑桿；前三種一開始就有，其他的升等解鎖。播過一次以後，開始專注就會自動播你上次選的那一種，專注結束就停，不想要可以取消勾選。' },
      { el: () => $('xpBtn'), title: '240 款貼圖和調合工坊', text: '貼圖圖鑑也在這一頁：完成方塊解鎖新貼圖，太久沒動（4 天以上）才會慢慢結凍，完成一個方塊就解凍。升等可以把兩三張貼圖合成一張，做好的會出現在聊天室貼圖的「⭐ 常用」。每張貼圖都有自己的動作。' },
      { el: () => { const c = $('grpCard'); return c && !c.hidden ? c : null; }, title: '群組：聊天、成員、共用行程', text: '群組聊天室現在是「共筆群組」裡的一頁，分成三個分頁。「聊天」按 😊 傳貼圖，點一下就送出；「成員」看每個人的達成率；「共用行程」是一張大家共有的週時間表，點空白的時間就能新增，所有人都看得到。' }
    ] },
    { v: '2026-11-14', steps: [
      { el: () => $('xpBtn'), title: '新的每週獎勵：專注小島', text: '原本的「本週奇蹟」換成更簡單的「專注小島」，規則只有兩條：每完成 1 個方塊，島上就多 1 樣東西（樹、小屋、池塘、風車、燈塔、熱氣球，第 24 樣是彩虹）；每天達標，天上亮 1 顆星。每週一換一座新的島，完成 10 個方塊的島會收進相簿。在「等級與成就」按「本週小島」看。' },
      { el: () => vis('skinBtn', /設定|Settings/), title: '設定也是完整一頁', text: '設定不再是小視窗，打開是一整頁的卡片：外觀、作息、提醒與聲音、固定行程、同步、群組和資料。電腦上方的「便利貼」「設定」按鈕收進左邊選單了，右上角的等級只顯示 Lv。' }
    ] },
    { v: '2026-11-15', steps: [
      { el: () => vis('skinBtn', /設定|Settings/), title: '桌面便利貼會自己同步了', text: '電腦：設定 → 同步 可以下載「桌面便利貼」，它直接讀你的同步帳號，開啟時、點一下、每 5 分鐘都會自動更新，不用開著瀏覽器。Android：「步調・今天」小工具改成大約每 5 分鐘更新，不用開 App（要先更新到 App 1.4.0）。iPhone 沒有辦法做桌面小工具，可以把步調加到主畫面。' }
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
    if (none) { hi.hidden = true; root.classList.remove('card-top'); return; }
    const r = target.getBoundingClientRect(), pad = 6;
    let left = r.left - pad, top = r.top - pad, right = r.right + pad, bottom = r.bottom + pad;
    // something pinned to the bottom (the phone's tab bar): move the card up so it doesn't cover it
    const up = r.top > innerHeight * .6;
    root.classList.toggle('card-top', up);
    if (window.paceUI?.isMobile?.() && !up) {
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
  function close() { restoreScrollInset(); try { if (!window.paceUI?.isMobile?.() && document.body.dataset.paceView && document.body.dataset.paceView !== 'rewards') window.paceUI.showView('calendar'); } catch (e) {} root.hidden = true; document.body.classList.remove('touring'); target = null; try { localStorage.setItem(SEEN, LATEST); } catch (e) {} }
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
