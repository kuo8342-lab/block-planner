/* 步調 Pace: pull the newest backup file of A (方塊週排程) out of a folder on this computer. Only for the owner's account: A is a private
   planner, so nobody else has such a file and nobody else sees the button.
   A cannot send anything anywhere, but its 「下載備份檔」 button saves a .json file. Pick the folder that file lands in once
   (Settings → privacy, next to 匯入備份); from then on this reads the newest A backup in it, when you press the button or, if the
   browser still remembers the permission, when Pace opens. Chrome / Edge on a computer only (the browser's folder picker).
   A is the source: its weeks, tasks, wishes, templates, notes, goals and closures replace the same ones here, and what A deleted since
   the last sync is deleted here. Kept: anything added only in C, blocks copied from a group's shared schedule, ticks made in C.
   From the settings only the schedule parts are taken (fixed times, blocks, targets, holidays); the theme and C's own limits stay. */
(() => {
  const btn0 = document.getElementById('importAll');
  if (!btn0 || !window.showDirectoryPicker || !window.paceSync) return;
  const OWNER = 'kuo658975@gmail.com';
  const LAST = 'pace-folder-last', IDS = 'pace-folder-ids', NAME = /^方塊週排程.*\.json$/;
  const KEEP = ['fixed', 'modules', 'special', 'holidays', 'targets', 'restMin', 'defaultTemplate', 'version'];
  const COLS = ['tasks', 'wishes', 'templates', 'notes', 'goals', 'closures'];
  const msg = document.getElementById('privacyMsg');
  const say = t => { if (msg) msg.textContent = t; };
  const when = s => { const d = new Date(s); return (d.getMonth() + 1) + '/' + d.getDate() + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };
  const lsGet = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
  const idb = () => new Promise((ok, no) => { const r = indexedDB.open('pace-folder', 1); r.onupgradeneeded = () => r.result.createObjectStore('h'); r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error); });
  const getH = async () => { try { const db = await idb(); return await new Promise(ok => { const q = db.transaction('h').objectStore('h').get('dir'); q.onsuccess = () => ok(q.result || null); q.onerror = () => ok(null); }); } catch (e) { return null; } };
  const putH = async h => { try { const db = await idb(); db.transaction('h', 'readwrite').objectStore('h').put(h, 'dir'); } catch (e) {} };

  async function newest(dir) {
    let best = null;
    for await (const e of dir.values()) {
      if (e.kind !== 'file' || !NAME.test(e.name)) continue;
      const f = await e.getFile(); if (!best || f.lastModified > best.lastModified) best = f;
    }
    return best;
  }
  /* A's week wins, but a block copied from a shared schedule, a block added only in C after the last sync and a tick made in C stay */
  function mergeWeek(aWeek, cur, known) {
    const { id, ...body } = aWeek, aBlocks = body.blocks || [], aIds = new Set(aBlocks.map(b => b.id)), mine = (cur && cur.blocks) || [];
    const byId = new Map(mine.map(b => [b.id, b]));
    const blocks = aBlocks.map(b => byId.get(b.id)?.done && !b.done && !b.failed ? { ...b, done: true } : b);
    for (const b of mine) if (!aIds.has(b.id) && (b.shared || (known && !known.includes(b.id)))) blocks.push(b);
    return { ...body, blocks };
  }
  async function apply(data) {
    const db = await window.claude.use('db');
    let prev = null; try { prev = JSON.parse(lsGet(IDS) || 'null'); } catch (e) {}
    const cur = (await db.doc('config/main').get()).data() || {}, a = data.config || {}, next = { ...cur };
    for (const k of KEEP) if (k in a) next[k] = a[k];
    await db.doc('config/main').set(next);
    let n = 0; const ids = { blocks: {} };
    for (const w of data.weeks) {
      if (!w || !w.id) continue;
      const s = await db.doc('weeks/' + w.id).get(), merged = mergeWeek(w, s.exists ? s.data() : null, prev?.blocks?.[w.id]);
      await db.doc('weeks/' + w.id).set(merged); ids.blocks[w.id] = (w.blocks || []).map(b => b.id); n++;
    }
    for (const c of COLS) {
      const list = (Array.isArray(data[c]) ? data[c] : []).filter(it => it && it.id);
      for (const it of list) { const { id, ...body } = it; await db.doc(c + '/' + id).set(body); n++; }
      ids[c] = list.map(it => it.id);
      for (const gone of (prev?.[c] || [])) if (!ids[c].includes(gone)) await db.doc(c + '/' + gone).delete();   // A deleted it after the last sync
    }
    lsSet(IDS, JSON.stringify(ids));
    try { if (typeof weekCache !== 'undefined') Object.keys(weekCache).forEach(k => delete weekCache[k]); } catch (e) {}
    window.paceRewardsRefresh?.();
    return n;
  }
  async function run(dir, manual) {
    const f = await newest(dir);
    if (!f) { if (manual) say('這個資料夾裡沒有 A 的備份檔（檔名要像「方塊週排程-備份-日期.json」）。先在 A 按「下載備份檔」。'); return; }
    let data; try { data = JSON.parse(await f.text()); } catch (e) { if (manual) say('讀不出「' + f.name + '」。'); return; }
    if (!data || !data.exportedAt || !data.config || !Array.isArray(data.weeks)) { if (manual) say('「' + f.name + '」不是 A 的備份檔。'); return; }
    if (String(data.exportedAt) <= (lsGet(LAST) || '')) { if (manual) say('已經是最新的了（A 備份時間 ' + when(data.exportedAt) + '）。要更新的話，先到 A 再按一次「下載備份檔」。'); return; }
    if (manual && !confirm('要把 A 備份（' + when(data.exportedAt) + '）放進步調嗎？相同的週、任務、便利貼會換成 A 的版本，A 刪掉的也會刪掉；只有步調才有的內容和打勾會保留。')) { say('已取消。'); return; }
    const n = await apply(data);
    lsSet(LAST, String(data.exportedAt));
    const text = '已從 A 的備份同步 ' + n + ' 筆（' + when(data.exportedAt) + '）。';
    say(text); if (typeof toast === 'function') toast(text);
  }

  const btn = Object.assign(document.createElement('button'), { type: 'button', className: 'btn', id: 'folderSync', textContent: '從 A 的資料夾同步', hidden: true });
  btn.title = '選一次放 A 備份檔的資料夾，之後按這顆就會抓最新的 A 備份';
  btn0.after(btn);
  btn.addEventListener('click', async () => {
    try {
      let h = await getH();
      if (h && (await h.queryPermission({ mode: 'read' })) !== 'granted' && (await h.requestPermission({ mode: 'read' })) !== 'granted') h = null;
      if (!h) { h = await window.showDirectoryPicker({ id: 'pace-a-backup', mode: 'read' }); await putH(h); }
      await run(h, true);
    } catch (e) { if (e && e.name !== 'AbortError') say('沒辦法讀這個資料夾：' + (e.message || e) + '（瀏覽器不讓選「下載」本身時，請在裡面開一個新資料夾，讓 A 的備份存進去）'); }
  });
  /* only the owner's account: the button appears after signing in; opening Pace syncs when the browser still remembers the permission (it never asks by itself) */
  let auto = false;
  window.paceSync.onUser(u => {
    const mine = !!u && String(u.email || '').toLowerCase() === OWNER;
    btn.hidden = !mine;
    if (!mine || auto) return;
    auto = true;
    setTimeout(async () => { try { const h = await getH(); if (h && (await h.queryPermission({ mode: 'read' })) === 'granted') await run(h, false); } catch (e) {} }, 3000);
  });
})();
