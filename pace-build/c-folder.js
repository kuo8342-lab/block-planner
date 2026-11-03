/* 步調 Pace: pull the newest backup file of A (方塊週排程) out of a folder on this computer.
   A cannot send anything anywhere, but its 「下載備份檔」 button saves a .json file. Pick the folder that file lands in once
   (Settings → privacy, next to 匯入備份); from then on this reads the newest A backup in it, when you press the button or, if the
   browser still remembers the permission, when Pace opens. Chrome / Edge on a computer only (the browser's folder picker).
   Nothing is deleted: A's weeks, tasks, templates and wishes are written over the same ones here, C-only items stay,
   and from the settings only the schedule parts are taken (fixed times, blocks, targets, holidays); the theme stays. */
(() => {
  const btn0 = document.getElementById('importAll');
  if (!btn0 || !window.showDirectoryPicker) return;
  const LAST = 'pace-folder-last', NAME = /^方塊週排程.*\.json$/;
  const KEEP = ['fixed', 'modules', 'special', 'holidays', 'targets', 'restMin', 'defaultTemplate', 'version'];
  const COLS = ['weeks', 'tasks', 'wishes', 'templates'];
  const msg = document.getElementById('privacyMsg');
  const say = t => { if (msg) msg.textContent = t; };
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
  async function apply(data) {
    const db = await window.claude.use('db');
    const cur = (await db.doc('config/main').get()).data() || {};
    const a = data.config || {}, next = { ...cur };
    for (const k of KEEP) if (k in a) next[k] = a[k];
    await db.doc('config/main').set(next);
    let n = 0;
    for (const c of COLS) for (const it of (Array.isArray(data[c]) ? data[c] : [])) { if (!it || !it.id) continue; const { id, ...body } = it; await db.doc(c + '/' + id).set(body); n++; }
    return n;
  }
  async function run(dir, manual) {
    const f = await newest(dir);
    if (!f) { if (manual) say('這個資料夾裡沒有 A 的備份檔（檔名要像「方塊週排程-備份-日期.json」）。先在 A 按「下載備份檔」。'); return; }
    let data; try { data = JSON.parse(await f.text()); } catch (e) { if (manual) say('讀不出「' + f.name + '」。'); return; }
    if (!data || !data.exportedAt || !data.config || !Array.isArray(data.weeks)) { if (manual) say('「' + f.name + '」不是 A 的備份檔。'); return; }
    let last = ''; try { last = localStorage.getItem(LAST) || ''; } catch (e) {}
    if (String(data.exportedAt) <= last) { if (manual) say('已經是最新的了（A 備份時間 ' + String(data.exportedAt).slice(0, 16).replace('T', ' ') + '）。'); return; }
    if (manual && !confirm('要把 A 在 ' + String(data.exportedAt).slice(0, 16).replace('T', ' ') + ' 的行程和方塊放進步調嗎？同名的週、任務會被 A 的版本取代；步調裡只有的內容會保留。')) { say('已取消。'); return; }
    const n = await apply(data);
    try { localStorage.setItem(LAST, String(data.exportedAt)); } catch (e) {}
    say('已從 A 的備份同步 ' + n + ' 筆，重新整理中…');
    setTimeout(() => location.reload(), 500);
  }

  const btn = Object.assign(document.createElement('button'), { type: 'button', className: 'btn', id: 'folderSync', textContent: '從 A 的資料夾同步' });
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
  // opening Pace: only when the browser still remembers the permission (it never asks by itself here)
  setTimeout(async () => {
    try { const h = await getH(); if (h && (await h.queryPermission({ mode: 'read' })) === 'granted') await run(h, false); } catch (e) {}
  }, 3000);
})();
