/* 步調 Pace: optional sign-in and cloud sync (Firebase Auth + Cloud Firestore).
   Every local document is mirrored to users/{uid}/docs/{path with / → ~} as { p, t, d, del }.
   The copy with the newer t wins; deletions are kept as del:true so other devices see them.
   Without window.PACE_FIREBASE (no project set up yet) this does nothing and shows nothing. */
(() => {
  const CFG = window.PACE_FIREBASE;
  if (!CFG || !window.paceStore) return;
  const V = '12.19.0', CDN = 'https://www.gstatic.com/firebasejs/' + V + '/';
  const $ = id => document.getElementById(id);

  /* ---------- settings section ---------- */
  const privacyHead = [...document.querySelectorAll('#skinDlg .set-h')].find(h => h.textContent.startsWith('資料與隱私'));
  const box = document.createElement('div');
  box.innerHTML = '<h3 class="set-h">同步（登入帳號）</h3>' +
    '<p class="hint" style="margin:0">登入後，手機、電腦和 App 會自動同步同一份資料。不登入也能用，資料只存在這台裝置。登入後，資料會存到 Google Firebase 雲端（台灣彰化機房）；加入群組後，群組裡的人看得到你選擇分享的部分。這台裝置的提醒設定不會上傳。</p>' +
    '<div id="syncOut">' +
      '<label class="check"><input type="checkbox" id="syncAge"> 我年滿 13 歲；未滿 18 歲，我已經讓家長或老師知道我在用。（註冊和用 Google 登入前要勾）</label>' +
      '<p class="hint" style="margin:0">資料怎麼用、怎麼刪，請看<a href="privacy.html" target="_blank" rel="noopener">隱私權政策</a>。</p>' +
      '<button class="btn primary" type="button" id="syncGoogle">用 Google 帳號登入</button>' +
      '<details class="sync-mail"><summary>用 Email 登入</summary><div class="sync-form">' +
        '<label>Email<input id="syncEmail" type="email" autocomplete="email"></label>' +
        '<label>密碼（至少 6 個字）<input id="syncPass" type="password" autocomplete="current-password"></label>' +
        '<div class="sync-acts"><button class="btn primary" type="button" id="syncIn">登入</button><button class="btn" type="button" id="syncUp">註冊新帳號</button><button class="btn plain" type="button" id="syncReset">忘記密碼</button></div>' +
      '</div></details>' +
    '</div>' +
    '<div id="syncInBox" hidden><p style="margin:0">已登入：<b id="syncWho"></b></p>' +
      '<div class="sync-acts"><button class="btn" type="button" id="syncOutBtn">登出</button><button class="btn danger" type="button" id="syncWipe">刪除雲端資料</button><button class="btn danger" type="button" id="syncDelAcct">刪除帳號和所有資料</button></div>' +
      '<div id="widgetLinkBox" hidden><button class="btn" type="button" id="widgetLink">連結 Android 桌面小工具</button>' +
      '<p class="hint" style="margin:0">按一下，桌面的「步調・今天」小工具就會顯示你今天的方塊。不用開 App，大約每 5 分鐘自動更新，點小工具上的 ↻ 會立刻更新。只會連結這支手機。</p></div>' +
      '<div id="noteLinkBox" hidden><button class="btn" type="button" id="noteLink">連結電腦桌面便利貼</button> <a class="btn plain" href="pace-note.zip" download>下載桌面便利貼（Windows）</a>' +
      '<p class="hint" style="margin:0">桌面便利貼是一支 Windows 小程式，會顯示今天的行程和這週任務：開啟時、點一下便利貼、每 5 分鐘都會自動同步，不用開著瀏覽器。</p><p class="hint" style="margin:0">用法：下載後解壓縮，點兩下 pace-note.vbs 打開便利貼；回來按上面的按鈕複製連結碼，再點一下便利貼就完成了。連結碼等於你的登入，不要貼給別人。</p></div></div>' +
    '<p class="hint" id="syncMsg" aria-live="polite" style="margin:0"></p>';
  privacyHead.before(...box.childNodes);
  const msg = t => { $('syncMsg').textContent = t; };
  const status = $('status');

  /* ---------- firebase, loaded only when needed ---------- */
  let fb = null;
  async function load() {
    if (fb) return fb;
    const [app, auth, fs] = await Promise.all(['firebase-app', 'firebase-auth', 'firebase-firestore'].map(n => import(CDN + n + '.js')));
    const a = app.initializeApp(CFG);
    let db;
    try { db = fs.initializeFirestore(a, { localCache: fs.persistentLocalCache() }); } catch (e) { db = fs.getFirestore(a); }
    const au = auth.getAuth(a);
    if (CFG.emulator) { auth.connectAuthEmulator(au, 'http://127.0.0.1:9099', { disableWarnings: true }); fs.connectFirestoreEmulator(db, '127.0.0.1', 8080); }
    fb = { auth, fs, au, db };
    auth.onAuthStateChanged(au, u => u ? start(u) : stop());
    return fb;
  }
  const signedBefore = () => { try { return localStorage.getItem('pace-sync-on') === '1'; } catch (e) { return false; } };
  const remember = on => { try { on ? localStorage.setItem('pace-sync-on', '1') : localStorage.removeItem('pace-sync-on'); } catch (e) {} };
  if (signedBefore()) load().catch(() => msg('連不上同步服務，資料先存在這台裝置。'));

  /* ---------- sync ---------- */
  let unsub = null, unhook = null, user = null;
  const userHooks = [];   // c-group.js listens for sign-in and sign-out
  window.paceSync = { load: () => load(), fb: () => fb, user: () => user, onUser: f => { userHooks.push(f); if (user) f(user); } };
  const idOf = p => p.split('/').join('~');
  function start(u) {
    user = u; remember(true); userHooks.forEach(f => f(u));
    $('syncOut').hidden = true; $('syncInBox').hidden = false; $('syncWho').textContent = u.email || u.displayName || '已登入';
    const { fs, db } = fb, col = fs.collection(db, 'users', u.uid, 'docs');
    const push = (p, d, t) => fs.setDoc(fs.doc(col, idOf(p)), { p, t, d: d ?? null, del: d == null }).catch(() => msg('有些變更還沒上傳，連上網路後會自動補傳。'));
    unhook = paceStore.onWrite(push);
    let first = true;
    unsub = fs.onSnapshot(col, snap => {
      const seen = new Set();
      for (const ch of snap.docChanges()) {
        if (ch.type === 'removed') continue;
        const r = ch.doc.data(); if (!r || !r.p) continue;
        seen.add(r.p);
        const mine = paceStore.read(r.p);
        if (r.t > mine.t || mine.t === 0) paceStore.apply(r.p, r.del ? null : r.d, r.t);   // t 0 = never edited here (e.g. the starter settings)
        else if (r.t < mine.t) push(r.p, mine.d, mine.t);
      }
      if (first) {   // things only this device has go up once, right after signing in
        first = false;
        for (const p of paceStore.paths()) if (!snap.docs.some(d => d.data().p === p)) { const m = paceStore.read(p); if (m.d != null) push(p, m.d, m.t || 1); }
        msg('同步完成，之後的變更會自動同步。');
      }
      if (status) status.textContent = snap.metadata.hasPendingWrites ? '同步中…' : '已同步';
    }, () => msg('同步中斷了，請重新登入。'));
  }
  function stop() {
    unsub?.(); unhook?.(); unsub = unhook = null; user = null; userHooks.forEach(f => f(null));
    $('syncOut').hidden = false; $('syncInBox').hidden = true;
  }

  /* ---------- Android home-screen widget: hand this sign-in to the app so its widget can read today's blocks ---------- */
  const isAndroid = /Android/.test(navigator.userAgent);
  $('widgetLinkBox').hidden = !isAndroid;
  // an intent: address names the package, so only the 步調 app can receive the sign-in token
  const toApp = extras => { location.href = 'intent://link#Intent;scheme=pacewidget;package=app.pace.planner;' + Object.entries(extras).map(([k, v]) => 'S.' + k + '=' + encodeURIComponent(v)).join(';') + ';end'; };
  const linked = on => { try { on ? localStorage.setItem('pace-widget-linked', '1') : localStorage.removeItem('pace-widget-linked'); } catch (e) {} };
  $('widgetLink').addEventListener('click', () => {
    if (!user) return;
    toApp({ rt: user.refreshToken, uid: user.uid, lang: window.paceLang?.() || 'zh' });
    linked(true); msg('已送到 App。如果沒有反應，請先安裝最新版的 Android App（設定 → 安裝 App）。');
  });
  /* ---------- Windows desktop note (pace-note.ps1): it has no browser, so the sign-in goes over as a code in the clipboard ---------- */
  $('noteLinkBox').hidden = !/Windows/.test(navigator.userAgent);
  $('noteLink').addEventListener('click', async () => {
    if (!user) return;
    try { await navigator.clipboard.writeText('pace-note:' + btoa(JSON.stringify({ rt: user.refreshToken, uid: user.uid }))); msg('連結碼已複製。現在點一下桌面上的便利貼就完成了（便利貼會把剪貼簿清掉）。'); }
    catch (e) { msg('複製不了連結碼，請換用 Chrome 或 Edge 再試一次。'); }
  });
  const unlinkWidget = () => { try { if (isAndroid && localStorage.getItem('pace-widget-linked') === '1') { linked(false); toApp({ rt: '', uid: '' }); } } catch (e) {} };

  /* ---------- buttons ---------- */
  const errText = e => ({
    'auth/invalid-email': 'Email 格式不對。', 'auth/missing-password': '請輸入密碼。', 'auth/weak-password': '密碼至少要 6 個字。',
    'auth/email-already-in-use': '這個 Email 已經註冊過了，請直接登入。', 'auth/invalid-credential': 'Email 或密碼不對。', 'auth/wrong-password': 'Email 或密碼不對。',
    'auth/user-not-found': '找不到這個帳號，要先註冊。', 'auth/too-many-requests': '嘗試太多次了，請稍後再試。', 'auth/network-request-failed': '連不上網路，請稍後再試。',
    'auth/popup-closed-by-user': '登入視窗被關掉了。', 'auth/cancelled-popup-request': '', 'auth/unauthorized-domain': '這個網址還沒加到 Firebase 的授權網域。'
  })[e?.code] ?? ('登入失敗：' + (e?.code || e?.message || e));
  const run = f => async () => { msg('處理中…'); try { await load(); await f(); } catch (e) { msg(errText(e)); } };
  const ageOk = () => { if ($('syncAge').checked) return true; msg('請先勾選「我年滿 13 歲；未滿 18 歲，我已經讓家長或老師知道」。'); return false; };
  $('syncGoogle').addEventListener('click', run(async () => {
    if (!ageOk()) return;
    const { auth, au } = fb, p = new auth.GoogleAuthProvider();
    try { await auth.signInWithPopup(au, p); msg(''); }
    catch (e) { if (['auth/popup-blocked', 'auth/operation-not-supported-in-this-environment'].includes(e?.code)) { remember(true); await auth.signInWithRedirect(au, p); } else throw e; }
  }));
  const creds = () => [$('syncEmail').value.trim(), $('syncPass').value];
  $('syncIn').addEventListener('click', run(async () => { await fb.auth.signInWithEmailAndPassword(fb.au, ...creds()); msg(''); }));
  $('syncUp').addEventListener('click', run(async () => { if (!ageOk()) return; await fb.auth.createUserWithEmailAndPassword(fb.au, ...creds()); msg('註冊完成，已登入。'); }));
  $('syncReset').addEventListener('click', run(async () => { await fb.auth.sendPasswordResetEmail(fb.au, creds()[0]); msg('已寄出重設密碼的信，請去收信。'); }));
  $('syncOutBtn').addEventListener('click', run(async () => { await fb.auth.signOut(fb.au); remember(false); msg('已登出。資料還留在這台裝置，但不會再同步。'); unlinkWidget(); }));
  /* delete the account itself: group data first (chat, 搞定, plan, numbers, membership), then my synced documents, then the login */
  $('syncDelAcct').addEventListener('click', run(async () => {
    if (!user || !confirm('要刪除帳號嗎？雲端上的資料、你在群組裡的計畫、數字和說過的話都會刪掉，帳號也會消失，而且不能復原。這台裝置上的資料會保留。')) { msg(''); return; }
    if (!confirm('再確認一次：真的要刪除帳號和所有雲端資料嗎？')) { msg(''); return; }
    const { fs, db } = fb;
    try {
      if (window.paceGroupLeaveAll) await window.paceGroupLeaveAll();
      const docs = (await fs.getDocs(fs.collection(db, 'users', user.uid, 'docs'))).docs;
      for (let i = 0; i < docs.length; i += 400) { const b = fs.writeBatch(db); docs.slice(i, i + 400).forEach(d => b.delete(d.ref)); await b.commit(); }
      await fb.auth.deleteUser(fb.au.currentUser);
    } catch (e) {
      if (e?.code === 'auth/requires-recent-login') { msg('為了安全，請先登出、重新登入，再按一次「刪除帳號和所有資料」。群組和雲端資料已經刪掉了。'); return; }
      throw e;
    }
    remember(false); msg('帳號和雲端資料都已刪除。這台裝置上的資料還在。'); unlinkWidget();
  }));
  $('syncWipe').addEventListener('click', run(async () => {
    if (!user || !confirm('要刪除雲端上的所有資料嗎？包含你在群組裡的計畫、數字和說過的話，也會退出所有群組。這台裝置上的資料會保留，並且登出。')) { msg(''); return; }
    if (window.paceGroupLeaveAll) await window.paceGroupLeaveAll();   // c-group.js: my chat, 搞定, plan and numbers, then my membership
    const { fs, db } = fb, col = fs.collection(db, 'users', user.uid, 'docs');
    const docs = (await fs.getDocs(col)).docs;
    for (let i = 0; i < docs.length; i += 400) { const b = fs.writeBatch(db); docs.slice(i, i + 400).forEach(d => b.delete(d.ref)); await b.commit(); }
    await fb.auth.signOut(fb.au); remember(false); msg('雲端資料已刪除，也已登出。'); unlinkWidget();
  }));
})();
