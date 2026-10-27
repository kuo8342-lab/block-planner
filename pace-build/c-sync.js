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
  const aiHead = [...document.querySelectorAll('#skinDlg .set-h')].find(h => h.textContent.startsWith('AI'));
  const box = document.createElement('div');
  box.innerHTML = '<h3 class="set-h">同步（登入帳號）</h3>' +
    '<p class="hint" style="margin:0">登入後，手機、電腦和 App 會自動同步同一份資料。不登入也能用，資料只存在這台裝置。AI 金鑰和這台裝置的提醒設定不會上傳。</p>' +
    '<div id="syncOut">' +
      '<button class="btn primary" type="button" id="syncGoogle">用 Google 帳號登入</button>' +
      '<details class="sync-mail"><summary>用 Email 登入</summary><div class="sync-form">' +
        '<label>Email<input id="syncEmail" type="email" autocomplete="email"></label>' +
        '<label>密碼（至少 6 個字）<input id="syncPass" type="password" autocomplete="current-password"></label>' +
        '<div class="sync-acts"><button class="btn primary" type="button" id="syncIn">登入</button><button class="btn" type="button" id="syncUp">註冊新帳號</button><button class="btn plain" type="button" id="syncReset">忘記密碼</button></div>' +
      '</div></details>' +
    '</div>' +
    '<div id="syncInBox" hidden><p style="margin:0">已登入：<b id="syncWho"></b></p>' +
      '<div class="sync-acts"><button class="btn" type="button" id="syncOutBtn">登出</button><button class="btn danger" type="button" id="syncWipe">刪除雲端資料</button></div>' +
      '<div id="widgetLinkBox" hidden><button class="btn" type="button" id="widgetLink">連結 Android 桌面小工具</button>' +
      '<p class="hint" style="margin:0">按一下，桌面的「步調・今天」小工具就會顯示你今天的方塊（大約每 30 分鐘更新）。只會連結這支手機。</p></div></div>' +
    '<p class="hint" id="syncMsg" aria-live="polite" style="margin:0"></p>';
  aiHead.before(...box.childNodes);
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
  const idOf = p => p.split('/').join('~');
  function start(u) {
    user = u; remember(true);
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
    unsub?.(); unhook?.(); unsub = unhook = null; user = null;
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
  const unlinkWidget = () => { try { if (isAndroid && localStorage.getItem('pace-widget-linked') === '1') { linked(false); toApp({ rt: '', uid: '' }); } } catch (e) {} };

  /* ---------- buttons ---------- */
  const errText = e => ({
    'auth/invalid-email': 'Email 格式不對。', 'auth/missing-password': '請輸入密碼。', 'auth/weak-password': '密碼至少要 6 個字。',
    'auth/email-already-in-use': '這個 Email 已經註冊過了，請直接登入。', 'auth/invalid-credential': 'Email 或密碼不對。', 'auth/wrong-password': 'Email 或密碼不對。',
    'auth/user-not-found': '找不到這個帳號，要先註冊。', 'auth/too-many-requests': '嘗試太多次了，請稍後再試。', 'auth/network-request-failed': '連不上網路，請稍後再試。',
    'auth/popup-closed-by-user': '登入視窗被關掉了。', 'auth/cancelled-popup-request': '', 'auth/unauthorized-domain': '這個網址還沒加到 Firebase 的授權網域。'
  })[e?.code] ?? ('登入失敗：' + (e?.code || e?.message || e));
  const run = f => async () => { msg('處理中…'); try { await load(); await f(); } catch (e) { msg(errText(e)); } };
  $('syncGoogle').addEventListener('click', run(async () => {
    const { auth, au } = fb, p = new auth.GoogleAuthProvider();
    try { await auth.signInWithPopup(au, p); msg(''); }
    catch (e) { if (['auth/popup-blocked', 'auth/operation-not-supported-in-this-environment'].includes(e?.code)) { remember(true); await auth.signInWithRedirect(au, p); } else throw e; }
  }));
  const creds = () => [$('syncEmail').value.trim(), $('syncPass').value];
  $('syncIn').addEventListener('click', run(async () => { await fb.auth.signInWithEmailAndPassword(fb.au, ...creds()); msg(''); }));
  $('syncUp').addEventListener('click', run(async () => { await fb.auth.createUserWithEmailAndPassword(fb.au, ...creds()); msg('註冊完成，已登入。'); }));
  $('syncReset').addEventListener('click', run(async () => { await fb.auth.sendPasswordResetEmail(fb.au, creds()[0]); msg('已寄出重設密碼的信，請去收信。'); }));
  $('syncOutBtn').addEventListener('click', run(async () => { await fb.auth.signOut(fb.au); remember(false); msg('已登出。資料還留在這台裝置，但不會再同步。'); unlinkWidget(); }));
  $('syncWipe').addEventListener('click', run(async () => {
    if (!user || !confirm('要刪除雲端上的所有資料嗎？這台裝置上的資料會保留，並且登出。')) { msg(''); return; }
    const { fs, db } = fb, col = fs.collection(db, 'users', user.uid, 'docs');
    const docs = (await fs.getDocs(col)).docs;
    for (let i = 0; i < docs.length; i += 400) { const b = fs.writeBatch(db); docs.slice(i, i + 400).forEach(d => b.delete(d.ref)); await b.commit(); }
    await fb.auth.signOut(fb.au); remember(false); msg('雲端資料已刪除，也已登出。'); unlinkWidget();
  }));
})();
