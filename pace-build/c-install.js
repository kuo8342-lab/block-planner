/* 步調 Pace: "安裝 App" dialog (Android APK / iPhone / computer) and importing a backup file.
   Injected by build-c.js after the app's own scripts. */
(() => {
  const $ = id => document.getElementById(id);
  const ua = navigator.userAgent;
  const isIos = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/.test(ua);
  const isMac = !isIos && /Macintosh/.test(ua);
  const installed = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true || document.referrer.startsWith('android-app://');

  /* ---------- 安裝 App ---------- */
  let deferred = null;
  addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; const b = $('instPwa'); if (b) b.hidden = false; });
  addEventListener('appinstalled', () => { deferred = null; const b = $('installBtn'); if (b) b.hidden = true; });

  const btn = $('installBtn');
  if (installed) { btn.hidden = true; }
  const dlg = document.createElement('dialog');
  dlg.id = 'installDlg';
  const here = isAndroid ? 'android' : isIos ? 'ios' : 'pc';
  const sec = (key, title, body) => '<details class="inst"' + (key === here ? ' open' : '') + '><summary>' + title + (key === here ? '<span class="badge ok">你現在用的</span>' : '') + '</summary><div class="inst-body">' + body + '</div></details>';
  dlg.innerHTML = '<form method="dialog">' +
    '<div class="dtitle">安裝成 App</div>' +
    '<p class="hint" style="margin:0">裝好後桌面會出現「步調」圖示，打開是全螢幕。之後網站更新，App 打開就是新版，不用重裝。</p>' +
    sec('android', 'Android 手機', '<a class="btn primary" href="pace.apk" download="步調Pace.apk">下載 Android App（APK）</a>' +
      '<ol><li>下載後點檔案安裝；手機問「允許安裝不明來源的應用程式」時選允許。</li><li>需要 Android 7 以上，並裝有 Chrome。</li><li>APK 有新版時直接安裝蓋過去就好，資料會保留。</li></ol>') +
    sec('ios', 'iPhone／iPad', '<ol><li>用 <b>Safari</b> 打開這個網站。</li><li>按下方的「分享」按鈕（方框加向上箭頭）。</li><li>選「加入主畫面」→「新增」。</li></ol><p class="hint" style="margin:0">iPhone 不能裝 APK；加入主畫面後一樣是全螢幕的 App。</p>') +
    sec('pc', 'Windows／Mac 電腦', '<button class="btn primary" type="button" id="instPwa" hidden>安裝到這台電腦</button>' +
      '<ol><li><b>Chrome 或 Edge</b>：網址列右邊的「安裝」圖示（螢幕加箭頭），或選單 →「投放、儲存及分享」→「安裝網頁應用程式」。</li><li><b>Mac 的 Safari</b>：選單列「檔案」→「加入 Dock」。</li></ol>') +
    '<p class="hint" style="margin:0">' + (window.PACE_FIREBASE ? '每台裝置在「設定 → 同步」登入同一個帳號，資料就會自動同步。不想登入的話，' : '每台裝置的資料各自存在那台裝置上。要搬到另一台：') + '在舊裝置「設定 → 匯出全部資料」，再到新裝置「設定 → 匯入備份」。</p>' +
    '<div class="actions"><button class="btn primary" value="ok">好</button></div></form>';
  document.body.appendChild(dlg);
  const open = () => { $('instPwa').hidden = !deferred; dlg.showModal(); };
  btn.addEventListener('click', open);
  /* inside the installed app the header button is hidden, so settings keeps a way to reach the APK and the steps for other devices */
  const privacyHead = [...document.querySelectorAll('#skinDlg .set-h')].find(h => h.textContent.startsWith('資料與隱私'));
  if (privacyHead) {
    const sec = document.createElement('div');
    sec.innerHTML = '<h3 class="set-h">安裝 App</h3>' +
      '<p class="hint" style="margin:0">' + (installed ? '你現在用的就是安裝好的 App。' : '') + '要裝到其他手機或電腦，或重新下載 Android APK，都在這裡。</p>' +
      '<button class="btn" type="button" id="installBtn2">安裝到手機或電腦</button>';
    privacyHead.before(...sec.childNodes);
    $('installBtn2').addEventListener('click', open);
  }
  dlg.addEventListener('click', async e => {
    if (e.target.id !== 'instPwa' || !deferred) return;
    deferred.prompt(); const r = await deferred.userChoice.catch(() => null); deferred = null; e.target.hidden = true;
    if (r?.outcome === 'accepted') dlg.close();
  });

  /* ---------- 匯入備份 ---------- */
  const exp = $('exportAll'), msg = $('privacyMsg');
  const file = Object.assign(document.createElement('input'), { type: 'file', accept: '.json,application/json', hidden: true });
  const imp = Object.assign(document.createElement('button'), { type: 'button', className: 'btn', id: 'importAll', textContent: '匯入備份' });
  exp.after(imp, file);
  imp.addEventListener('click', () => file.click());
  const COLS = ['weeks', 'tasks', 'wishes', 'templates', 'notes', 'goals', 'closures'];
  file.addEventListener('change', async () => {
    const f = file.files[0]; file.value = ''; if (!f) return;
    let data;
    try { data = JSON.parse(await f.text()); } catch (e) { msg.textContent = '這不是備份檔（讀不出來）。'; return; }
    if (!data || typeof data !== 'object' || !data.exportedAt || !data.config) { msg.textContent = '這不是步調匯出的備份檔。'; return; }
    const when = String(data.exportedAt).slice(0, 10);
    if (!confirm('要用 ' + when + ' 的備份取代這台裝置上現在的資料嗎？現在的資料會被蓋掉，建議先匯出一份。')) { msg.textContent = '已取消匯入。'; return; }
    try {
      const db = await window.claude.use('db');
      for (const c of COLS) for (const d of (await db.collection(c).get()).docs) await db.doc(c + '/' + d.id).delete();
      await db.doc('config/main').set(data.config);
      for (const c of COLS) for (const it of (Array.isArray(data[c]) ? data[c] : [])) { if (!it || !it.id) continue; const { id, ...body } = it; await db.doc(c + '/' + id).set(body); }
      msg.textContent = '匯入完成，重新整理中…';
      setTimeout(() => location.reload(), 400);
    } catch (e) { msg.textContent = '匯入失敗：' + (e?.message || e); }
  });
})();
