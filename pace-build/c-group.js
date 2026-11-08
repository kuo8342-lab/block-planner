/* 步調 Pace: 共筆群組 — friends join with an invite code; whenever someone finishes a block or a task,
   everyone in the group sees 「搞定！」 and can tap 👏. Inside a group everyone always sees who is in it, each person's
   this-week 達成率 and how many stars are lit, and can chat. Before joining (or creating) a group you choose whether
   your week's plan may be viewed (read-only): nobody / everyone in the group / only the people you tick.
   Firestore: groups/{code} { name, owner, members[], names{uid: name} } and its subcollections
     feed/{uid_item}  — finished things (搞定！ + 👏)
     stats/{uid}      — name, week, rate, stars, glow, share ('none'|'some'|'all'): visible to every member
     plans/{uid}      — this week's blocks + access + allow[]: readable only as access says; written only by its owner
     chat/{uid_time}  — chat messages
   Needs c-sync.js (sign-in); without a Firebase config this does nothing. */
(() => {
  if (!window.PACE_FIREBASE || !window.paceSync || !window.paceStore) return;
  const $ = id => document.getElementById(id);
  const ls = { get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} } };
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const newCode = () => [...crypto.getRandomValues(new Uint8Array(8))].map(n => ALPHA[n % 32]).join('');
  const cleanCode = s => { const m = /join=([A-Za-z0-9]+)/.exec(s); return (m ? m[1] : s).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8); };
  const link = code => location.origin + location.pathname + '?join=' + code;

  /* ---------- settings section, right after 同步 (both sit just above 資料與隱私) ---------- */
  const privacyHead = [...document.querySelectorAll('#skinDlg .set-h')].find(h => h.textContent.startsWith('資料與隱私'));
  const box = document.createElement('div');
  box.innerHTML = '<h3 class="set-h">共筆群組</h3>' +
    '<p class="hint" style="margin:0">跟朋友、同學組一個群組：誰完成了方塊或任務，大家都會看到「搞定！」，還可以按 👏 幫他拍拍，也能在群組聊天室聊天。進群組的人一定看得到你的名字、這週的達成率和完成了幾個方塊；你的計畫要不要讓人看（只能看、不能改），加入前由你決定，之後隨時能改。</p>' +
    '<p class="hint" id="grpOff" style="margin:0">要先在上面「同步」登入帳號，才能建立或加入群組。</p>' +
    '<div id="grpOn" class="sync-form" hidden>' +
      '<label>你在群組裡的名字<input id="grpMe" maxlength="20" autocomplete="nickname"></label>' +
      '<div id="grpList" class="grp-list"></div>' +
      '<div class="sync-acts"><input id="grpName" maxlength="30" placeholder="新群組的名字（例如：三年二班讀書會）" aria-label="新群組的名字"><button class="btn primary" type="button" id="grpNew">建立群組</button></div>' +
      '<div class="sync-acts"><input id="grpCode" maxlength="80" placeholder="朋友給你的邀請碼或連結" aria-label="邀請碼"><button class="btn" type="button" id="grpJoin">加入</button></div>' +
      '<label class="check"><input type="checkbox" id="grpShare"> 完成方塊或任務時告訴群組</label>' +
      '<label class="check"><input type="checkbox" id="grpHide"> 只說完成了幾分鐘，不說做了什麼</label>' +
    '</div>' +
    '<p class="hint" id="grpMsg" aria-live="polite" style="margin:0"></p>';
  privacyHead.before(...box.childNodes);
  const msg = t => { $('grpMsg').textContent = t; };
  $('grpShare').checked = ls.get('pace-group-share') !== '0';
  $('grpHide').checked = ls.get('pace-group-hide') === '1';
  $('grpShare').addEventListener('change', e => ls.set('pace-group-share', e.target.checked ? '1' : '0'));
  $('grpHide').addEventListener('change', e => ls.set('pace-group-hide', e.target.checked ? '1' : null));

  /* ---------- feed card on the main page, under 願望清單 ---------- */
  const card = document.createElement('section');
  card.className = 'card'; card.id = 'grpCard'; card.hidden = true;
  card.innerHTML = '<h2>群組動態 <span class="count" id="grpCount"></span></h2><div class="grp-rooms" id="grpRooms"></div><div class="grp-feed" id="grpFeed"></div>' +
    '<p class="hint">朋友完成方塊或任務時會出現在這裡，按 👏 幫他拍拍。群組在「設定 → 共筆群組」。</p>';
  ($('wishes')?.closest('section') || document.querySelector('main section.card:last-of-type'))?.after(card);

  /* ---------- state ---------- */
  let fb = null, user = null, groups = [], unGroups = null;
  const hooks = [], roomHooks = [];
  const mine = {};   // gid → { access, allow } = what I decided about my plan (read from my own plans doc; missing = I have not decided yet)
  const mineAsked = new Set();   // groups whose plans doc I am already listening to
  const mineUnsub = new Map();
  let roomGid = null;   // the group whose chat room is open
  const CONTACT = window.PACE_CONTACT || '';   // who receives reports (pace-build/contact.txt, injected by build-c.js)
  const blocked = () => { try { const a = JSON.parse(ls.get('pace-group-blocked') || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; } };
  const setBlocked = a => ls.set('pace-group-blocked', JSON.stringify([...new Set(a)].slice(0, 200)));
  const DAY = 864e5;
  const reportHref = (g, who, uid, text, when) => 'mailto:' + CONTACT + '?subject=' + encodeURIComponent('檢舉：步調群組 ' + g.id) +
    '&body=' + encodeURIComponent('群組：' + g.name + '（' + g.id + '）\n對象：' + who + '（' + uid + '）\n時間：' + when + '\n內容：' + (text || '（成員本人）') + '\n\n請寫下你覺得有問題的原因：\n');
  const leaving = new Set();   // groups I am leaving right now: never publish into them
  const nameIn = gid => groups.find(g => g.id === gid)?.names?.[user.uid] || myName();   // the rules want the name the group has for me
  const feeds = new Map();      // gid → { unsub, items: [] }
  const cheersSeen = new Map(); // my feed items → how many 👏 I've already been told about
  const myName = () => (ls.get('pace-group-name') || user?.displayName || (user?.email || '').split('@')[0] || '我').slice(0, 20);

  paceSync.onUser(async u => {
    user = u;
    $('grpOff').hidden = !!u; $('grpOn').hidden = !u;
    if (!u) { unGroups?.(); unGroups = null; for (const f of feeds.values()) f.unsub(); feeds.clear(); groups = []; hooks.forEach(f => { try { f(groups); } catch (e) {} }); for (const k of Object.keys(mine)) delete mine[k]; mineAsked.clear(); mineUnsub.forEach(f => f()); mineUnsub.clear(); leaving.clear(); closeRoom(); if ($('grpPlan')?.open) $('grpPlan').close(); if ($('grpConsent')?.open) $('grpConsent').close(); render(); return; }
    fb = paceSync.fb();
    $('grpMe').value = myName();
    const { fs, db } = fb;
    unGroups = fs.onSnapshot(fs.query(fs.collection(db, 'groups'), fs.where('members', 'array-contains', u.uid)), snap => {
      groups = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.name.localeCompare(b.name));
      hooks.forEach(f => { try { f(groups); } catch (e) {} });   // c-board.js
      for (const [gid, f] of feeds) if (!groups.some(g => g.id === gid)) { f.unsub(); feeds.delete(gid); }
      for (const g of groups) if (!feeds.has(g.id)) listen(g.id);
      for (const [gid, f] of mineUnsub) if (!groups.some(g => g.id === gid)) { f(); mineUnsub.delete(gid); mineAsked.delete(gid); delete mine[gid]; }
      for (const g of groups) loadMine(g.id);
      for (const g of groups) cleanup(g.id);
      for (const gid of [...leaving]) if (!groups.some(g => g.id === gid)) leaving.delete(gid);
      if (roomGid && !groups.some(g => g.id === roomGid)) { closeRoom(); if ($('grpPlan')?.open) $('grpPlan').close(); msg('你已經不在這個群組了。'); }
      render(); if (roomGid) renderRoom();
    }, () => msg('讀不到群組，請稍後再試。'));
    pendingJoin();
  });

  function listen(gid) {
    const { fs, db } = fb, f = { items: [], unsub: null, first: true };
    feeds.set(gid, f);
    const q = fs.query(fs.collection(db, 'groups', gid, 'feed'), fs.orderBy('at', 'desc'), fs.limit(40));
    f.unsub = fs.onSnapshot(q, snap => {
      f.items = snap.docs.map(d => ({ id: d.id, gid, ...d.data() }));
      for (const ch of snap.docChanges()) {
        const it = { id: ch.doc.id, ...ch.doc.data() }, n = Object.keys(it.cheers || {}).length;
        if (it.uid === user?.uid) {   // someone cheered for me
          const before = cheersSeen.get(it.id);
          cheersSeen.set(it.id, n);
          if (!f.first && before != null && n > before) {
            const who = Object.keys(it.cheers).filter(k => k !== user.uid).map(k => groups.find(g => g.id === gid)?.names?.[k]).filter(Boolean).pop();
            if (who) toast(who + ' 幫你拍拍 👏');
          }
        } else if (!f.first && ch.type === 'added' && !ch.doc.metadata.hasPendingWrites && Date.now() - (it.at?.toMillis?.() ?? 0) < 15 * 60000) celebrate(it);   // fresh ones only, not a pile after being offline
      }
      f.first = false;
      render();
    }, () => {   // e.g. a group I just created, before the server has it: try again shortly
      if (feeds.get(gid) !== f) return;
      feeds.delete(gid);
      setTimeout(() => { if (user && groups.some(g => g.id === gid) && !feeds.has(gid)) listen(gid); }, 3000);
    });
  }

  function celebrate(it) {
    toast(it.title ? '🎉 ' + it.name + ' 搞定了「' + it.title + '」' : '🎉 ' + it.name + ' 完成了 ' + it.minutes + ' 分鐘');
    try { burst(innerWidth / 2, Math.min(innerHeight / 3, 260)); } catch (e) {}
  }

  /* ---------- render ---------- */
  const ago = ts => {
    const m = Math.max(0, Math.round((Date.now() - (ts?.toMillis ? ts.toMillis() : Date.now())) / 60000));
    return m < 1 ? '剛剛' : m < 60 ? m + ' 分鐘前' : m < 1440 ? Math.floor(m / 60) + ' 小時前' : Math.floor(m / 1440) + ' 天前';
  };
  function render() {
    // settings: my groups
    $('grpList').innerHTML = groups.map(g => '<div class="grp-item"><div><b>' + esc(g.name) + '</b><span class="muted"> · ' + g.members.length + ' 人 · 邀請碼 </span><code>' + g.id + '</code></div>' +
      '<div class="sync-acts"><button class="btn" type="button" data-groom="' + g.id + '">聊天室</button><button class="btn" type="button" data-gprivacy="' + g.id + '">計畫公開設定</button><button class="btn" type="button" data-ginvite="' + g.id + '">邀請朋友</button><button class="btn plain" type="button" data-gleave="' + g.id + '">退出</button></div></div>').join('');
    // main page: last 7 days, newest first
    const week = Date.now() - 7 * 864e5;
    const all = [...feeds.values()].flatMap(f => f.items).filter(it => !it.at?.toMillis || it.at.toMillis() > week).filter(it => !blocked().includes(it.uid))
      .sort((a, b) => (b.at?.toMillis?.() ?? Infinity) - (a.at?.toMillis?.() ?? Infinity)).slice(0, 30);
    card.hidden = !groups.length;
    $('grpRooms').innerHTML = groups.map(g => '<button class="btn grp-room-btn" type="button" data-groom="' + g.id + '">💬 <b>' + esc(g.name) + '</b><span class="muted"> · ' + g.members.length + ' 人 · 成員、達成率和聊天室</span></button>').join('') +
      (groups.some(g => mine[g.id] === null) ? '<p class="hint grp-need">群組新增了達成率、看計畫和聊天室。你還沒決定要讓群組看到什麼，所以現在別人看不到你的資料。<button class="btn primary" type="button" data-gprivacy="' + groups.find(g => mine[g.id] === null).id + '">現在決定</button></p>' : '');
    $('grpCount').textContent = all.length || '';
    const many = groups.length > 1;
    $('grpFeed').innerHTML = all.length ? all.map(it => {
      const mine = it.uid === user?.uid, n = Object.keys(it.cheers || {}).length, did = !!it.cheers?.[user?.uid];
      const g = groups.find(x => x.id === it.gid);
      return '<div class="grp-row"><div class="grp-txt">' + (many && g ? '<span class="muted">' + esc(g.name) + '</span> ' : '') +
        '<b>' + (mine ? '你' : esc(it.name)) + '</b> ' +
        (it.title ? '<span>搞定了</span> <span class="grp-what">「' + esc(it.title) + '」</span>' : '<span>完成了 ' + it.minutes + ' 分鐘</span>') +
        ' <span class="muted">' + ago(it.at) + '</span></div>' +
        '<button class="btn plain grp-cheer' + (did ? ' on' : '') + '" type="button" data-cheer="' + it.gid + '/' + esc(it.id) + '"' + (mine ? ' disabled' : '') + ' aria-pressed="' + did + '" title="拍拍">👏' + (n ? ' ' + n : '') + '</button></div>';
    }).join('') : '<p class="hint" style="margin:0">還沒有人完成東西。完成一個方塊試試看！</p>';
  }
  setInterval(() => { if (groups.length) render(); }, 60000);   // keep 「N 分鐘前」 fresh

  /* ---------- buttons ---------- */
  const busy = f => async (...a) => { if (!user) { msg('要先登入同步帳號。'); return; } msg('處理中…'); try { await f(...a); } catch (e) { msg('失敗了：' + (e?.code === 'permission-denied' ? '沒有權限（群組可能滿 30 人或不存在）' : e?.code === 'unavailable' || e?.code === 'deadline-exceeded' ? '連不上網路，請連線後再試' : e?.code === 'unauthenticated' ? '登入過期了，請重新登入' : e?.code === 'resource-exhausted' ? '今天的用量到上限了，明天再試' : '出了點問題，請稍後再試' + (e?.code ? '（' + e.code + '）' : ''))); } };
  $('grpNew').addEventListener('click', busy(async () => {
    const name = $('grpName').value.trim().slice(0, 30);
    if (!name) { msg('先幫群組取個名字。'); return; }
    const pick = await consent({ mode: 'create', group: name, members: [] });
    if (!pick || !user) { msg(''); return; }
    const { fs, db } = fb, code = newCode();
    await fs.setDoc(fs.doc(db, 'groups', code), { name, owner: user.uid, members: [user.uid], names: { [user.uid]: myName() }, createdAt: fs.serverTimestamp() });
    $('grpName').value = '';
    try { await savePrivacy(code, pick); } catch (e) { msg('群組建好了（邀請碼 ' + code + '），但公開設定沒存成功。請按「計畫公開設定」再選一次。'); return; }
    msg('建立好了！邀請碼是 ' + code + '，按「邀請朋友」把連結傳給大家。');
  }));
  /* expiry without a paid plan (Firestore's own TTL needs billing): when the app loads a group, old messages are removed.
     Everyone removes their own; the group owner removes anyone's. Chat lives 90 days, 搞定 30 days. At most once every 6 hours per group. */
  const lastClean = new Map();
  async function cleanup(gid) {
    if (!user || !fb || Date.now() - (lastClean.get(gid) || 0) < 6 * 36e5) return;
    lastClean.set(gid, Date.now());
    const g = groups.find(x => x.id === gid), owner = !!g && g.owner === user.uid, { fs, db } = fb;
    try {
      for (const [c, days] of [['chat', 90], ['feed', 30]]) {
        const cutoff = Date.now() - days * DAY;
        const q = owner ? fs.query(fs.collection(db, 'groups', gid, c), fs.where('at', '<', new Date(cutoff)), fs.limit(200))
                        : fs.query(fs.collection(db, 'groups', gid, c), fs.where('uid', '==', user.uid), fs.limit(200));
        const old = (await fs.getDocs(q)).docs.filter(d => { const t = d.data().at?.toMillis?.(); return t && t < cutoff; });
        if (old.length) { const b = fs.writeBatch(db); old.forEach(d => b.delete(d.ref)); await b.commit(); }
      }
    } catch (e) { lastClean.delete(gid); }
  }
  /* leave: stop publishing, then delete my chat, 搞定, plan and numbers, and only then my membership */
  async function leaveGroup(g) {
    const { fs, db } = fb, prev = mine[g.id];
    leaving.add(g.id); delete mine[g.id]; lastSig.delete(g.id); clearTimeout(pubTimer);
    try {
      for (const c of ['chat', 'feed']) {
        const docs = (await fs.getDocs(fs.query(fs.collection(db, 'groups', g.id, c), fs.where('uid', '==', user.uid)))).docs;
        for (let i = 0; i < docs.length; i += 400) { const b = fs.writeBatch(db); docs.slice(i, i + 400).forEach(d => b.delete(d.ref)); await b.commit(); }
      }
      await fs.deleteDoc(fs.doc(db, 'groups', g.id, 'plans', user.uid));
      await fs.deleteDoc(fs.doc(db, 'groups', g.id, 'stats', user.uid));
      await fs.updateDoc(fs.doc(db, 'groups', g.id), { members: fs.arrayRemove(user.uid), ['names.' + user.uid]: fs.deleteField() });
    } catch (e) { leaving.delete(g.id); if (prev !== undefined) mine[g.id] = prev; throw e; }
    if (roomGid === g.id) closeRoom();
  }
  // deleting my data: the shared schedule items I added go too (plain leaving keeps them for the group)
  window.paceGroupLeaveAll = async () => { if (user && fb) for (const g of [...groups]) {
    try { const { fs, db } = fb, mine = await fs.getDocs(fs.query(fs.collection(db, 'groups', g.id, 'board'), fs.where('uid', '==', user.uid))); for (const d of mine.docs) await fs.deleteDoc(d.ref); } catch (e) {}
    await leaveGroup(g);
  } };   // used by 「刪除雲端資料」 in c-sync.js
  async function join(code) {
    const { fs, db } = fb, ref = fs.doc(db, 'groups', code), g = await fs.getDoc(ref);
    if (!g.exists()) { msg('找不到這個邀請碼，請再確認一次。'); return false; }
    const data = g.data();
    if (data.members.includes(user.uid)) { msg('你已經在「' + data.name + '」裡了。'); return true; }
    const pick = await consent({ mode: 'join', group: data.name, members: data.members.map(u => ({ uid: u, name: data.names?.[u] || '?' })) });
    if (!pick || !user) { msg('沒有加入。'); return false; }
    await fs.updateDoc(ref, { members: fs.arrayUnion(user.uid), ['names.' + user.uid]: myName() });
    try { await savePrivacy(code, pick); } catch (e) { msg('加入「' + data.name + '」了，但公開設定沒存成功。現在別人看不到你的資料，請按「計畫公開設定」再選一次。'); return true; }
    msg('加入「' + data.name + '」了！');
    return true;
  }
  $('grpJoin').addEventListener('click', busy(async () => {
    const code = cleanCode($('grpCode').value);
    if (code.length !== 8) { msg('邀請碼是 8 個英文字母或數字。'); return; }
    if (await join(code)) $('grpCode').value = '';
  }));
  $('grpList').addEventListener('click', busy(async e => {
    const inv = e.target.closest('[data-ginvite]'), leave = e.target.closest('[data-gleave]'), room = e.target.closest('[data-groom]'), priv = e.target.closest('[data-gprivacy]');
    if (room) { $('skinDlg').close(); openRoom(room.dataset.groom); return; }
    if (priv) { await editPrivacy(priv.dataset.gprivacy); return; }
    if (!inv && !leave) { msg(''); return; }
    const g = groups.find(x => x.id === (inv || leave).dataset[inv ? 'ginvite' : 'gleave']);
    if (inv) {
      const text = '一起用「步調」排時間！加入我的群組「' + g.name + '」，完成時互相說搞定 🎉 邀請碼：' + g.id;
      if (navigator.share) { try { await navigator.share({ title: '步調 Pace', text, url: link(g.id) }); msg(''); return; } catch (err) { if (err?.name === 'AbortError') { msg(''); return; } } }
      try { await navigator.clipboard.writeText(text + '\n' + link(g.id)); msg('邀請連結複製好了，貼給朋友就可以。'); }
      catch (err) { msg('把這個連結傳給朋友：' + link(g.id)); }
      return;
    }
    if (!confirm('要退出「' + g.name + '」嗎？你在這個群組的計畫、數字、說過的話和「搞定」都會一起刪掉，之後就不會再收到群組的消息。')) { msg(''); return; }
    await leaveGroup(g);
    msg('已退出「' + g.name + '」。');
  }));
  $('grpMe').addEventListener('change', busy(async () => {
    const name = $('grpMe').value.trim().slice(0, 20);
    if (!name) { $('grpMe').value = myName(); msg(''); return; }
    ls.set('pace-group-name', name);
    const { fs, db } = fb;
    for (const g of groups) await fs.updateDoc(fs.doc(db, 'groups', g.id), { ['names.' + user.uid]: name });
    schedulePublish(500);
    msg('名字改好了。');
  }));
  card.addEventListener('click', e => {
    const room = e.target.closest('[data-groom]'), priv = e.target.closest('[data-gprivacy]');
    if (room) openRoom(room.dataset.groom); else if (priv) busy(editPrivacy)(priv.dataset.gprivacy);
  });
  $('grpFeed').addEventListener('click', async e => {
    const b = e.target.closest('[data-cheer]'); if (!b || b.disabled || !user) return;
    const [gid, id] = b.dataset.cheer.split('/'), on = b.getAttribute('aria-pressed') !== 'true';
    const { fs, db } = fb;
    try { await fs.updateDoc(fs.doc(db, 'groups', gid, 'feed', id), { ['cheers.' + user.uid]: on ? true : fs.deleteField() }); if (on) burstAt(b); } catch (err) { toast('拍拍沒送出去，請稍後再試'); }
  });

  /* ---------- invite links: ?join=CODE (kept until signed in) ---------- */
  { const q = new URLSearchParams(location.search), code = q.get('join');
    if (code) {
      ls.set('pace-group-join', cleanCode(code)); q.delete('join');
      history.replaceState(null, '', location.pathname + (q.toString() ? '?' + q : '') + location.hash);
      if (ls.get('pace-sync-on') !== '1') setTimeout(() => showAlarm('朋友邀請你加入共筆群組！先到「設定 → 同步」登入帳號（沒有的話可以註冊），登入後就會問你要不要加入。', '共筆群組'), 1500);
    } }
  async function pendingJoin() {
    const code = ls.get('pace-group-join'); if (!code) return;
    ls.set('pace-group-join', null);
    try { await join(code); } catch (e) { msg('加入失敗了，請到「設定 → 共筆群組」再輸入一次邀請碼：' + code); }
  }

  /* ---------- 搞定！ watch my own writes for things that just became done ---------- */
  const doneIn = (p, d) => {
    const out = new Map();
    if (!d) return out;
    if (p.startsWith('weeks/') && Array.isArray(d.blocks)) {
      for (const b of d.blocks) if (b && b.done && !b.tour && b.cat !== 'buffer')
        out.set(b.taskId ? 't-' + b.taskId : 'b-' + p.slice(6) + '-' + b.id, { title: b.name, minutes: b.minutes });   // a block for a task counts once, with the task
    } else if (/^tasks\/[^/]+$/.test(p) && d.done && !d.tour) out.set('t-' + p.slice(6), { title: d.title, minutes: d.minutes });
    return out;
  };
  const known = new Map();
  for (const p of paceStore.paths()) known.set(p, doneIn(p, paceStore.read(p).d));
  const apply = paceStore.apply;   // copies from my other devices: remember them, they were shared over there
  paceStore.apply = (p, d, t) => { apply(p, d, t); known.set(p, doneIn(p, d)); if (/^(weeks|config)\//.test(p)) schedulePublish(); };
  paceStore.onWrite((p, d) => {
    const now = doneIn(p, d), was = known.get(p) || new Map();
    known.set(p, now);
    if (/^(weeks|tasks|config)\//.test(p)) schedulePublish();
    if (!user || !groups.length) return;
    const { fs, db } = fb, hide = ls.get('pace-group-hide') === '1';
    const eid = k => user.uid + '_' + k.replace(/[^A-Za-z0-9_-]/g, '');
    for (const [k, it] of now) if (!was.has(k) && ls.get('pace-group-share') !== '0')
      for (const g of groups) if (mine[g.id] !== null && !leaving.has(g.id)) fs.setDoc(fs.doc(db, 'groups', g.id, 'feed', eid(k)), {
        uid: user.uid, name: nameIn(g.id), title: hide ? '' : String(it.title || '').slice(0, 60),
        minutes: Math.max(0, Math.min(1440, Math.round(Number(it.minutes) || 0))), at: fs.serverTimestamp(), cheers: {}, expireAt: new Date(Date.now() + 30 * DAY)
      }).catch(() => {});   // already there (shared from another write): keep it and its 👏
    for (const k of was.keys()) if (!now.has(k))   // unticked: take it back
      for (const g of groups) fs.deleteDoc(fs.doc(db, 'groups', g.id, 'feed', eid(k))).catch(() => {});
  });

  /* ============ 公開範圍、成員數字、看計畫、聊天室 ============ */
  const pad = n => String(n).padStart(2, '0');
  const ymdOf = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const mondayOfNow = () => { const x = new Date(); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };
  const toMin = hm => { const [h, m] = String(hm || '0:0').split(':'); return (+h || 0) * 60 + (+m || 0); };
  const hmOf = m => pad(Math.floor(m / 60) % 24) + ':' + pad(m % 60);
  const STUDY = ['study', 'preview', 'code', 'lang', 'exam'];
  const DAYN = ['一', '二', '三', '四', '五', '六', '日'];
  const lastSig = new Map();

  /* this week's numbers (same rules as the weekly report) and, if I allow it, the blocks themselves */
  function weekSnapshot() {
    const mon = mondayOfNow(), week = ymdOf(mon), now = new Date();
    const d = paceStore.read('weeks/' + week).d, cfg = paceStore.read('config/main').d;
    const all = (d?.blocks || []).filter(b => b && !b.tour && Number.isInteger(b.day) && b.day >= 0 && b.day <= 6).map(b => {
      const day = new Date(mon); day.setDate(day.getDate() + b.day);
      return { ...b, end: new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, toMin(b.start) + (Number(b.minutes) || 0)) };
    });
    const cnt = typeof counts === 'function' ? counts : b => STUDY.includes(b.cat) || !!b.subject;
    const bl = all.filter(b => !b.skipped && cnt(b));
    const sum = l => l.reduce((a, b) => a + (Number(b.minutes) || 0), 0);
    const done = bl.filter(b => b.done), du = sum(bl.filter(b => b.done || b.failed || b.end <= now)), dn = sum(done);
    const tt = Object.values(cfg?.targets || {}).reduce((a, b) => a + (Number(b) || 0), 0);
    return {
      week, rate: du ? Math.min(100, Math.round(dn / du * 100)) : -1, stars: Math.min(done.length, 500), glow: tt ? Math.min(100, Math.round(dn / tt * 100)) : 0,
      blocks: all.filter(b => !b.skipped).sort((a, b) => a.day - b.day || toMin(a.start) - toMin(b.start)).slice(0, 150)
        .map(b => ({ d: b.day, s: String(b.start || '').slice(0, 5), m: Math.max(0, Math.min(1440, Math.round(Number(b.minutes) || 0))), n: String(b.name || '').slice(0, 40), c: String(b.cat || '').replace(/[^a-z]/g, '').slice(0, 12), x: !!b.done }))
    };
  }
  function publishGroup(gid, snap, m, force) {
    if (!user || !m) return Promise.resolve();
    const { fs, db } = fb;
    if (m.external) {   // the A bridge on my computer fills my numbers and plan: only a sharing choice I just made here is written, and the plan keeps its blocks
      if (!force) return Promise.resolve();
      const ref = fs.doc(db, 'groups', gid, 'plans', user.uid), members0 = groups.find(g => g.id === gid)?.members;
      return fs.getDoc(ref).then(s => {
        const old = s.exists() ? s.data() : {};
        return fs.setDoc(ref, { uid: user.uid, week: typeof old.week === 'string' && old.week.length === 10 ? old.week : snap.week, access: m.access,
          allow: m.access === 'some' ? m.allow.filter(u => !members0 || members0.includes(u)).slice(0, 29) : [], blocks: m.access === 'none' ? [] : (Array.isArray(old.blocks) ? old.blocks : []),
          choiceAt: m.at || 0, source: 'a', at: fs.serverTimestamp() });
      }).then(() => fs.updateDoc(fs.doc(db, 'groups', gid, 'stats', user.uid), { share: m.access, at: fs.serverTimestamp() }).catch(() => {})).then(() => { lastSig.delete(gid); });   // the label next to my numbers follows the choice at once
    }
    const stats = { uid: user.uid, name: myName(), week: snap.week, rate: snap.rate, stars: snap.stars, glow: snap.glow, share: m.access, skin: (typeof skin === 'string' && (window.PACE_SKIN_IDS || []).includes(skin)) ? skin : 'default' };   // my theme goes with my numbers: friends see me in it
    const members = groups.find(g => g.id === gid)?.members;   // a person who left is dropped from the list, so rejoining never re-opens my plan
    const plan = { uid: user.uid, week: snap.week, access: m.access, allow: m.access === 'some' ? m.allow.filter(u => !members || members.includes(u)).slice(0, 29) : [], blocks: m.access === 'none' ? [] : snap.blocks, choiceAt: m.at || 0 };
    const sig = JSON.stringify([stats, plan]);
    if (!force && lastSig.get(gid) === sig) return Promise.resolve();
    lastSig.set(gid, sig);
    return Promise.all([
      fs.setDoc(fs.doc(db, 'groups', gid, 'stats', user.uid), { ...stats, at: fs.serverTimestamp() }),
      fs.setDoc(fs.doc(db, 'groups', gid, 'plans', user.uid), { ...plan, at: fs.serverTimestamp() })
    ]).catch(e => { lastSig.delete(gid); if (force) throw e; });
  }
  async function publishAll() {
    if (!user || !fb || !groups.length) return;
    const snap = weekSnapshot();
    for (const g of groups) if (mine[g.id] && !leaving.has(g.id)) await publishGroup(g.id, snap, mine[g.id]);   // never before I have decided
  }
  let pubTimer = 0;
  function schedulePublish(ms = 4000) { clearTimeout(pubTimer); pubTimer = setTimeout(publishAll, ms); }
  setInterval(() => { if (user && groups.length && !document.hidden) publishAll(); }, 5 * 60000);   // 「時間已到」 moves on by itself
  document.addEventListener('visibilitychange', () => { if (!document.hidden) schedulePublish(1500); });

  /* what did I decide for this group? my own plans doc says; no doc = not decided yet (null) */
  function loadMine(gid) {
    if (mineAsked.has(gid)) return;
    mineAsked.add(gid);
    const { fs, db } = fb;
    // a live listener: if I change my choice on another device, this one follows and never writes the old choice back
    mineUnsub.set(gid, fs.onSnapshot(fs.doc(db, 'groups', gid, 'plans', user.uid), s => {
      const d = s.exists() ? s.data() : null, ok = d && ['none', 'some', 'all'].includes(d.access);
      if (ok) {
        const next = { access: d.access, allow: Array.isArray(d.allow) ? d.allow.filter(x => typeof x === 'string') : [], at: Number.isInteger(d.choiceAt) ? d.choiceAt : 0, external: d.source === 'a' };
        if (mine[gid] && mine[gid].at > next.at) { lastSig.delete(gid); schedulePublish(800); return; }   // what I chose here is newer than the server copy: write it again
        if (mine[gid] && mine[gid].at === next.at && mine[gid].access === next.access && mine[gid].allow.join() === next.allow.join() && !!mine[gid].external === next.external) return;
        mine[gid] = next; lastSig.delete(gid); schedulePublish(800);
      } else if (mine[gid] === undefined) mine[gid] = null;   // nothing stored yet: not decided (a choice I just made here wins)
      render(); if (roomGid === gid) renderRoom();
    }, () => { mineAsked.delete(gid); mineUnsub.delete(gid); }));
  }
  async function savePrivacy(gid, pick) {
    const prev = mine[gid];
    mine[gid] = { access: pick.access, allow: pick.access === 'some' ? pick.allow.slice(0, 29) : [], at: Math.max(Date.now(), (prev?.at || 0) + 1), external: !!prev?.external };   // a plan the A bridge fills stays that way
    const p = publishGroup(gid, weekSnapshot(), mine[gid], true); p.catch(() => {});
    let r;
    try { r = await Promise.race([p.then(() => 'ok'), new Promise(res => setTimeout(() => res('pending'), 7000))]); }   // offline: the write waits in the queue
    catch (e) { mine[gid] = prev; render(); if (roomGid === gid) renderRoom(); throw e; }
    render(); if (roomGid === gid) renderRoom();
    return r;
  }
  async function editPrivacy(gid) {
    const g = groups.find(x => x.id === gid); if (!g) return false;
    const cur = mine[gid];
    const pick = await consent({ mode: cur ? 'edit' : 'legacy', group: g.name, cur, members: g.members.filter(u => u !== user.uid).map(u => ({ uid: u, name: g.names?.[u] || '?' })) });
    if (!pick || !user) { msg(''); return false; }
    let r;
    try { r = await savePrivacy(gid, pick); } catch (e) { msg('沒存成功，公開設定沒有改變。請稍後再試。'); return false; }
    if (!user) return false;
    msg(r === 'pending' ? '目前沒有網路。你的選擇已經記下，連線後才會生效；在那之前，別人看到的還是舊的設定。' : pick.access === 'none' ? '存好了：現在沒有人看得到你的計畫。' : '公開設定存好了。');
    return true;
  }

  /* ---------- the question asked before joining (also used to change it later) ---------- */
  document.body.insertAdjacentHTML('beforeend',
    '<dialog id="grpConsent" class="grp-dlg" aria-labelledby="gcTitle"><div class="grp-form">' +
      '<div class="dtitle" id="gcTitle"></div>' +
      '<div class="grp-box"><b>一定會讓群組裡的人看到</b>' +
        '<p class="hint" style="margin:0">加入群組就表示同意。群組裡的每個人都看得到：</p>' +
        '<ul class="grp-ul"><li>你的名字：<b id="gcName"></b></li><li>你這週的達成率（完成 ÷ 時間已到的方塊）</li><li>你這週完成了幾個方塊、離每週目標多近（依你選的主題顯示成星星、花朵、氣泡等）</li><li>你在聊天室說的話</li><li>你完成的方塊或任務（「搞定！」動態，可以在設定裡關掉，或只說分鐘數）</li></ul></div>' +
      '<div class="grp-box"><b>你的計畫要讓別人看嗎？</b>' +
        '<p class="hint" style="margin:0">「計畫」是你這週的方塊：名稱、時間、有沒有完成。別人只能看，不能修改。看不到你的心得、備註、目標和待辦。</p>' +
        '<label class="check"><input type="radio" name="gcAccess" value="none"> 不公開：沒有人看得到我的計畫</label>' +
        '<label class="check"><input type="radio" name="gcAccess" value="all"> 公開給群組裡所有人（之後加入的人也看得到）</label>' +
        '<label class="check"><input type="radio" name="gcAccess" value="some" id="gcSome"> 只公開給我勾選的人</label>' +
        '<div class="grp-pick" id="gcPick" hidden></div>' +
        '<p class="hint" style="margin:0">別人會看到你選的是「不公開」、「部分公開」還是「全部公開」。被你勾選的人，也看得到被勾選的名單。方塊名稱是你自己打的，請不要放病歷、感情或別人的個資。</p></div>' +
      '<p class="hint" style="margin:0">之後隨時可以在「設定 → 共筆群組 → 計畫公開設定」改。改成不公開，已經公開的內容會馬上刪掉；退出群組時，你的計畫、數字和說過的話也會一起刪掉。</p>' +
      '<label class="check" id="gcAgeRow"><input type="checkbox" id="gcAge"> 我年滿 13 歲；未滿 18 歲，我已經讓家長或老師知道我在用。</label>' +
      '<p class="hint" style="margin:0">完整說明請看<a href="privacy.html" target="_blank" rel="noopener">隱私權政策</a>。</p>' +
      '<div class="actions"><button class="btn" type="button" id="gcNo">取消</button><button class="btn primary" type="button" id="gcYes"></button></div>' +
    '</div></dialog>');
  const TITLE = { join: g => '加入「' + g + '」前，請先決定', create: g => '建立「' + g + '」前，請先決定', edit: g => '「' + g + '」的計畫公開設定', legacy: g => '「' + g + '」新增了功能，請先決定' };
  function consent({ mode, group, members, cur }) {
    const dlg = $('grpConsent'), radios = [...dlg.querySelectorAll('[name="gcAccess"]')];
    $('gcTitle').textContent = TITLE[mode](group);
    $('gcName').textContent = myName();
    $('gcYes').textContent = mode === 'join' ? '同意並加入' : mode === 'create' ? '同意並建立' : '儲存';
    const needAge = mode === 'join' || mode === 'create' || mode === 'legacy';
    $('gcAgeRow').hidden = !needAge; $('gcAge').checked = false; $('gcYes').disabled = needAge;
    $('gcAge').onchange = () => { $('gcYes').disabled = needAge && !$('gcAge').checked; };
    $('gcPick').innerHTML = members.map(m => '<label class="check"><input type="checkbox" value="' + esc(m.uid) + '"' + (cur?.allow?.includes(m.uid) ? ' checked' : '') + '> ' + esc(m.name) + '</label>').join('') ||
      '<p class="hint" style="margin:0">現在群組裡只有你，等朋友加入後再回來勾選。</p>';
    const want = cur?.access || 'none';
    radios.forEach(r => { r.checked = r.value === want; });
    $('gcSome').disabled = !members.length;
    if (!members.length && want === 'some') radios[0].checked = true;
    const sync = () => { $('gcPick').hidden = !$('gcSome').checked; };
    sync(); dlg.onchange = sync;
    return new Promise(res => {
      let settled = false;
      const finish = v => { if (settled) return; settled = true; $('gcYes').onclick = $('gcNo').onclick = dlg.onclose = null; if (dlg.open) dlg.close(); res(v); };
      $('gcNo').onclick = () => finish(null);
      dlg.onclose = () => finish(null);
      $('gcYes').onclick = () => {
        if ($('gcYes').disabled) return;
        const access = radios.find(r => r.checked)?.value || 'none';
        finish({ access, allow: access === 'some' ? [...$('gcPick').querySelectorAll('input:checked')].map(i => i.value) : [] });
      };
      dlg.showModal();
    });
  }

  /* ---------- the group room: members (name, 達成率, stars), read-only plans, chat ---------- */
  document.body.insertAdjacentHTML('beforeend',
    '<dialog id="grpRoom" class="grp-dlg grp-wide" aria-label="群組聊天室"><div class="grp-form">' +
      '<div class="grp-head"><select id="grpRoomSel" aria-label="選擇群組"></select><button class="btn" type="button" id="grpRoomMine">計畫公開設定</button><button class="btn plain" type="button" id="grpRoomClose" aria-label="關閉">✕</button></div>' +
      '<p class="hint grp-need" id="grpRoomNeed" hidden>你還沒決定要讓群組看到什麼，所以別人現在看不到你的達成率和計畫。<button class="btn primary" type="button" id="grpRoomDecide">現在決定</button></p>' +
      '<h3 class="set-h">成員</h3><div class="grp-members" id="grpMembers"></div>' +
      '<h3 class="set-h">共用行程表</h3><div id="grpBoard"></div>' +
      '<h3 class="set-h">聊天室</h3><div class="grp-chat" id="grpChat" aria-live="polite"></div><p class="hint" id="grpBlocked" style="margin:0"></p>' +
      '<div class="sync-acts"><input id="grpMsgIn" maxlength="300" placeholder="說點什麼…" aria-label="聊天內容" autocomplete="off"><button class="btn primary" type="button" id="grpSend">送出</button></div>' +
      '<p class="hint" id="grpRoomMsg" aria-live="polite" style="margin:0">聊天室只有這個群組的人看得到。請友善，不要霸凌，也不要貼別人的個資。</p>' +
    '</div></dialog>' +
    '<dialog id="grpPlan" class="grp-dlg grp-wide" aria-labelledby="gpTitle"><div class="grp-form">' +
      '<div class="dtitle" id="gpTitle"></div><p class="hint grp-ro" id="gpNote" style="margin:0"></p><div id="gpBody"></div>' +
      '<div class="actions"><button class="btn primary" type="button" id="gpClose">關閉</button></div>' +
    '</div></dialog>');
  const style = document.createElement('style');
  style.textContent =
    '.grp-rooms { display: flex; flex-direction: column; gap: 6px; margin-bottom: 8px; } .grp-rooms:empty { display: none; }' +
    '.grp-room-btn { justify-content: flex-start; text-align: left; white-space: normal; }' +
    '.grp-need { border: 1px solid var(--accent); border-radius: 10px; padding: 8px 10px; display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin: 0; }' +
    'dialog.grp-dlg { width: min(460px, calc(100vw - 24px)); max-height: 90vh; max-height: 90dvh; overflow: auto; } dialog.grp-wide { width: min(600px, calc(100vw - 24px)); }' +
    'dialog#grpRoom[open] { display: flex; flex-direction: column; overflow: hidden; } #grpRoom .grp-form { min-height: 0; flex: 1 1 auto; }' +
    '#grpRoom .grp-members { max-height: 32dvh; overflow-y: auto; flex: 0 1 auto; min-height: 0; } #grpRoom .grp-chat { height: auto; flex: 1 1 140px; min-height: 120px; }' +
    '.grp-form { display: flex; flex-direction: column; gap: 12px; font-size: .88rem; }' +
    '.grp-box { border: 1px solid var(--line); border-radius: 10px; padding: 10px 12px; display: flex; flex-direction: column; gap: 6px; }' +
    '.grp-ul { margin: 0; padding-left: 1.3em; display: flex; flex-direction: column; gap: 2px; }' +
    '.grp-pick { display: flex; flex-direction: column; padding-left: 26px; }' +
    '.grp-head { display: flex; gap: 8px; align-items: center; } .grp-head select { flex: 1 1 auto; min-width: 0; padding: 7px 10px; border: 1px solid var(--line); border-radius: 9px; background: var(--panel-2); color: var(--fg); }' +
    '.grp-members { display: flex; flex-direction: column; gap: 8px; }' +
    '.grp-mem { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 4px 10px; align-items: center; border: 1px solid var(--line); border-radius: 10px; padding: 8px 10px; }' +
    '.grp-mem .nm { font-weight: 600; overflow-wrap: anywhere; } .grp-mem .meta { grid-column: 1 / -1; display: flex; flex-wrap: wrap; gap: 4px 12px; color: var(--muted); font-size: .8rem; }' +
    '.grp-mem { border-left: 3px solid var(--pc, var(--line)); } .grp-pips { grid-column: 1 / -1; display: flex; gap: 3px; font-size: 17px; line-height: 1; color: var(--pc, var(--accent)); }' +
    '.grp-pips .pip.off { filter: grayscale(1); opacity: .2; } .grp-pips .pip.part { filter: none; } .grp-pips .pip { display: inline-block; transition: opacity .3s ease; }' +
    '.grp-mem.fresh .pip.on { animation: grp-pop .45s cubic-bezier(.2,1.4,.4,1) both; animation-delay: var(--d, 0ms); } @keyframes grp-pop { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }' +
    '@media (prefers-reduced-motion: reduce) { .grp-mem.fresh .pip.on { animation: none; } } body.nofx .grp-mem.fresh .pip.on { animation: none; }' +
    '.grp-bar { grid-column: 1 / -1; height: 8px; border-radius: 999px; background: var(--line-soft, rgba(128,128,128,.2)); overflow: hidden; } .grp-bar i { display: block; height: 100%; background: var(--accent); border-radius: 999px; }' +
    '.grp-chat { display: flex; flex-direction: column; gap: 6px; height: min(260px, 38vh); overflow-y: auto; flex: none; border: 1px solid var(--line); border-radius: 10px; padding: 8px; }' +
    '.grp-msg { max-width: 88%; align-self: flex-start; background: var(--panel-2); border-radius: 12px; padding: 6px 10px; overflow-wrap: anywhere; } .grp-msg.me { align-self: flex-end; background: var(--accent-soft); }' +
    '.grp-msg .who { font-size: .74rem; color: var(--muted); } .grp-msg button { margin-left: 6px; padding: 0 6px; font-size: .72rem; }' +
    '.grp-mod { display: inline-flex; gap: 6px; margin-left: auto; } .grp-mod .btn, .grp-msg .who .btn { min-height: 0; padding: 2px 8px; font-size: .72rem; text-decoration: none; }' +
    '.grp-ro { border-left: 3px solid var(--accent); padding: 4px 10px; background: var(--accent-soft); border-radius: 4px; }' +
    '.grp-day { margin-top: 6px; } .grp-day h4 { margin: 0 0 4px; font-size: .86rem; }' +
    '.grp-pb { display: flex; gap: 8px; align-items: center; padding: 4px 8px; border-radius: 8px; margin-bottom: 3px; background: var(--c-study, var(--panel-2)); color: var(--c-study-fg, var(--fg)); overflow-wrap: anywhere; } .grp-pb .tm { font-family: var(--f-mono, monospace); font-size: .78rem; flex: none; }';
  document.head.appendChild(style);

  let roomFresh = false;   // the marks pop in once when the room opens
  let roomUnsubs = [], roomStats = new Map(), roomChat = [], lastSent = 0;
  const roomMsg = t => { $('grpRoomMsg').textContent = t; };
  const shareText = s => s === 'all' ? '計畫：全部公開' : s === 'some' ? '計畫：部分公開' : '計畫：不公開';
  function stopRoom() { roomUnsubs.forEach(f => f()); roomUnsubs = []; roomStats = new Map(); roomChat = []; }
  function closeRoom() { stopRoom(); roomGid = null; roomHooks.forEach(f => { try { f(null); } catch (e) {} }); if ($('grpRoom').open) $('grpRoom').close(); }
  function openRoom(gid) {
    if (!user || !fb || !groups.some(g => g.id === gid)) return;
    roomFresh = true; setTimeout(() => { roomFresh = false; }, 1800);
    stopRoom(); roomGid = gid; roomHooks.forEach(f => { try { f(gid); } catch (e) {} }); roomMsg('聊天室只有這個群組的人看得到。請友善，不要霸凌，也不要貼別人的個資。');
    const { fs, db } = fb;
    roomUnsubs.push(fs.onSnapshot(fs.collection(db, 'groups', gid, 'stats'), snap => {
      roomStats = new Map(snap.docs.map(d => [d.id, d.data()])); renderRoom();
    }, () => roomMsg('讀不到成員的資料，請稍後再試。')));
    roomUnsubs.push(fs.onSnapshot(fs.query(fs.collection(db, 'groups', gid, 'chat'), fs.orderBy('at', 'desc'), fs.limit(100)), snap => {
      roomChat = snap.docs.map(d => ({ id: d.id, pending: d.metadata?.hasPendingWrites === true, ...d.data() })).reverse(); renderChat();
    }, () => roomMsg('讀不到聊天室，請稍後再試。')));
    renderRoom(); renderChat(); window.paceStickers?.refresh?.();
    if (!$('grpRoom').open) $('grpRoom').showModal();
  }
  function renderRoom() {
    const g = groups.find(x => x.id === roomGid); if (!g) return;
    $('grpRoomSel').innerHTML = groups.map(x => '<option value="' + x.id + '"' + (x.id === roomGid ? ' selected' : '') + '>' + esc(x.name) + '（' + x.members.length + ' 人）</option>').join('');
    $('grpRoomNeed').hidden = mine[g.id] !== null;
    const week = ymdOf(mondayOfNow());
    const info = id => window.paceSkinInfo?.(id) || { id: 'default', icon: '⭐', pip: '■', count: n => '亮起 ' + n + ' 顆星', measure: '亮度', color: '' };   // each person is drawn in THEIR theme (c-skins.js)
    const order =[...g.members].sort((a, b) => (a === user.uid ? -1 : b === user.uid ? 1 : String(g.names?.[a]).localeCompare(String(g.names?.[b]))));
    $('grpMembers').innerHTML = order.map(uid => {
      const s = roomStats.get(uid), me = uid === user.uid, fresh = s && s.week === week, nm = esc(g.names?.[uid] || s?.name || '?');
      const rate = fresh && s.rate >= 0 ? s.rate : null, unit = info(s?.skin);
      const act = !s ? '' : s.share === 'none' && !me ? '<span class="muted">不公開計畫</span>' : '<button class="btn" type="button" data-plan="' + esc(uid) + '">' + (me ? '看我公開的計畫' : '看計畫') + '</button>';
      const mod = me ? '' : (g.owner === user.uid ? '<button class="btn plain" type="button" data-kick="' + esc(uid) + '">移出群組</button>' : '') +
        (CONTACT ? '<a class="btn plain" href="' + esc(reportHref(g, g.names?.[uid] || '?', uid, '', new Date().toLocaleString())) + '">檢舉</a>' : '');
      return '<div class="grp-mem th-' + esc(unit.id) + (roomFresh ? ' fresh' : '') + '" style="--pc:' + esc(unit.color) + '"><span class="nm">' + nm + (me ? ' <span class="muted">（你）</span>' : '') + '</span><span>' + act + '</span>' +
        (window.paceBar ? window.paceBar(unit.id, rate) : '<div class="grp-bar" role="img" aria-label="達成率"><i style="width:' + (rate ?? 0) + '%"></i></div>') +
        '<div class="meta"><span>達成率 ' + (rate == null ? '—' : rate + '%') + '</span>' +
        (fresh ? '<span>' + unit.icon + ' <span>' + esc(unit.count(s.stars)) + '</span></span><span>' + esc(unit.measure) + ' ' + s.glow + '%</span>' : '<span>' + (s ? '這週還沒更新' : '還沒同意顯示') + '</span>') +
        (s ? '<span>' + shareText(s.share) + '</span>' : '') + (mod ? '<span class="grp-mod">' + mod + '</span>' : '') + '</div></div>';
    }).join('');
  }
  function renderChat() {
    const box = $('grpChat'), stick = box.scrollHeight - box.scrollTop - box.clientHeight < 40;
    const g = groups.find(x => x.id === roomGid), bl = new Set(blocked()), owner = !!g && g.owner === user?.uid;
    const shown = roomChat.filter(m => !bl.has(m.uid));
    box.innerHTML = shown.length ? shown.map(m => {
      const me = m.uid === user?.uid;
      const when = m.at?.toMillis ? new Date(m.at.toMillis()).toLocaleString() : '';
      const tools = me ? '<button class="btn plain" type="button" data-unsend="' + esc(m.id) + '">收回</button>'
        : '<button class="btn plain" type="button" data-block="' + esc(m.uid) + '">封鎖</button>' +
          (CONTACT && g ? '<a class="btn plain" href="' + esc(reportHref(g, m.name || '?', m.uid, m.text, when)) + '">檢舉</a>' : '') +
          (owner ? '<button class="btn plain" type="button" data-unsend="' + esc(m.id) + '">刪除</button>' : '');
      const bodyHtml = window.paceStickers?.renderChatMessage ? window.paceStickers.renderChatMessage(m.text) : esc(m.text);
      return '<div class="grp-msg' + (me ? ' me' : '') + '"><div class="who"><span>' + (me ? '你' : esc(m.name)) + '</span> · <span>' + (m.pending ? '傳送中' : ago(m.at)) + '</span>' + tools + '</div><div>' + bodyHtml + '</div></div>';
    }).join('') : '<p class="hint" style="margin:0">還沒有人說話，打個招呼吧！</p>';
    $('grpBlocked').innerHTML = bl.size ? '已封鎖（聊天和搞定都看不到）：' + [...bl].map(u => '<button class="btn plain" type="button" data-unblock="' + esc(u) + '">' + esc(g?.names?.[u] || roomChat.find(m => m.uid === u)?.name || '某人') + ' ✕ 解除</button>').join(' ') : '';
    if (stick) box.scrollTop = box.scrollHeight;
  }
  async function sendChat() {
    const text = $('grpMsgIn').value.trim().slice(0, 300);
    if (!text || !roomGid || !user) return;
    if (Date.now() - lastSent < 800) return;
    if (mine[roomGid] === undefined) { roomMsg('讀不到你的公開設定，請稍後再試。'); return; }
    if (mine[roomGid] === null && !(await editPrivacy(roomGid))) { roomMsg('先決定要讓群組看到什麼，才能在聊天室說話。'); return; }
    if (!user || !roomGid) return;
    lastSent = Date.now(); $('grpMsgIn').value = '';
    const { fs, db } = fb;
    try { await fs.setDoc(fs.doc(db, 'groups', roomGid, 'chat', user.uid + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)), { uid: user.uid, name: nameIn(roomGid), text, at: fs.serverTimestamp(), expireAt: new Date(Date.now() + 90 * DAY) }); roomMsg(''); }
    catch (e) { $('grpMsgIn').value = text; roomMsg('沒送出去，請稍後再試。'); }
  }
  let planSeq = 0;
  async function showPlan(uid) {
    const g = groups.find(x => x.id === roomGid); if (!g) return;
    const seq = ++planSeq;
    const me = uid === user.uid, nm = g.names?.[uid] || '?', dlg = $('grpPlan'), body = $('gpBody');
    $('gpTitle').textContent = me ? '我公開的計畫（別人看到的樣子）' : nm + ' 這週的計畫';
    $('gpNote').textContent = me ? '這是別人看到的內容。' : '唯讀：你只能看，不能修改別人的計畫。';
    body.innerHTML = '<p class="hint">讀取中…</p>'; if (!dlg.open) dlg.showModal();
    const { fs, db } = fb;
    let d;
    try { const s = await fs.getDoc(fs.doc(db, 'groups', roomGid, 'plans', uid)); d = s.exists() ? s.data() : null; }
    catch (e) { if (seq !== planSeq || !dlg.open) return; body.innerHTML = '<p class="hint">' + (e?.code === 'permission-denied' ? '對方沒有開放給你看。' : '讀不到，請稍後再試。') + '</p>'; return; }
    if (seq !== planSeq || !dlg.open) return;
    if (!d || d.access === 'none' || !d.blocks?.length) { body.innerHTML = '<p class="hint">' + (d?.access === 'none' ? (me ? '你目前不公開計畫，別人看不到。' : '對方目前不公開計畫。') : '這週還沒有可以看的方塊。') + '</p>'; return; }
    if (typeof d.week !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(d.week) || isNaN(new Date(d.week + 'T00:00:00'))) { body.innerHTML = '<p class="hint">讀不到，請稍後再試。</p>'; return; }
    const CATS = ['school', 'study', 'preview', 'code', 'lang', 'exam', 'class', 'swim', 'rest', 'buffer', 'care', 'life'];
    d.blocks = d.blocks.filter(b => b && typeof b === 'object' && Number.isInteger(b.d) && b.d >= 0 && b.d <= 6 && /^\d{2}:\d{2}$/.test(b.s))
      .map(b => ({ d: b.d, s: b.s, m: Math.max(0, Math.min(1440, Math.round(Number(b.m) || 0))), n: String(b.n ?? '').slice(0, 40), c: CATS.includes(b.c) ? b.c : 'life', x: b.x === true }));
    const mon = new Date(d.week + 'T00:00:00'), cur = d.week === ymdOf(mondayOfNow());
    body.innerHTML = (cur ? '' : '<p class="hint">這是 ' + esc(d.week) + ' 那週的計畫，對方這週還沒更新。</p>') +
      DAYN.map((n, i) => {
        const day = new Date(mon); day.setDate(day.getDate() + i);
        const bl = d.blocks.filter(b => b.d === i);
        return bl.length ? '<div class="grp-day"><h4>週' + n + '・' + (day.getMonth() + 1) + '/' + day.getDate() + '</h4>' + bl.map(b =>
          '<div class="grp-pb" style="background:var(--c-' + esc(b.c) + ',var(--panel-2));color:var(--c-' + esc(b.c) + '-fg,var(--fg))"><span class="tm">' + esc(b.s) + '–' + hmOf(toMin(b.s) + (b.m || 0)) + '</span><span>' + esc(b.n) + '</span>' + (b.x ? '<span title="完成">✓</span>' : '') + '</div>').join('') + '</div>' : '';
      }).join('');
  }
  $('grpRoomSel').addEventListener('change', e => openRoom(e.target.value));
  $('grpRoomClose').addEventListener('click', closeRoom);
  $('grpRoom').addEventListener('close', () => { stopRoom(); roomGid = null; });
  $('grpRoomMine').addEventListener('click', () => { if (roomGid) editPrivacy(roomGid).catch(() => roomMsg('存不起來，請稍後再試。')); });
  $('grpRoomDecide').addEventListener('click', () => { if (roomGid) editPrivacy(roomGid).catch(() => roomMsg('存不起來，請稍後再試。')); });
  $('grpSend').addEventListener('click', sendChat);
  $('grpMsgIn').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); sendChat(); } });
  $('grpMembers').addEventListener('click', e => { const b = e.target.closest('[data-plan]'); if (b) showPlan(b.dataset.plan); });
  $('grpChat').addEventListener('click', async e => {
    const blk = e.target.closest('[data-block]');
    if (blk) {
      const nm = roomChat.find(m => m.uid === blk.dataset.block)?.name || '這個人';
      if (confirm('要封鎖「' + nm + '」嗎？你就看不到他的聊天和「搞定」，他不會知道。可以在聊天室下方解除。')) { setBlocked([...blocked(), blk.dataset.block]); renderChat(); render(); }
      return;
    }
    const b = e.target.closest('[data-unsend]'); if (!b || !roomGid) return;
    const { fs, db } = fb;
    try { await fs.deleteDoc(fs.doc(db, 'groups', roomGid, 'chat', b.dataset.unsend)); } catch (err) { roomMsg('沒收回成功，請稍後再試。'); }
  });
  $('grpBlocked').addEventListener('click', e => { const u = e.target.closest('[data-unblock]'); if (u) { setBlocked(blocked().filter(x => x !== u.dataset.unblock)); renderChat(); render(); } });
  /* the owner removes someone: their chat, 搞定, plan and numbers go, and they cannot come back with the code */
  $('grpMembers').addEventListener('click', async e => {
    const k = e.target.closest('[data-kick]'); if (!k || !roomGid) return;
    const g = groups.find(x => x.id === roomGid), uid = k.dataset.kick;
    if (!g || g.owner !== user.uid || !g.members.includes(uid) || uid === user.uid) return;
    if (!confirm('要把「' + (g.names?.[uid] || '這個人') + '」移出群組嗎？他的聊天、搞定和計畫會一起刪掉，而且不能再用邀請碼加入。')) return;
    roomMsg('處理中…');
    try {
      const { fs, db } = fb;
      for (const c of ['chat', 'feed']) {
        const docs = (await fs.getDocs(fs.query(fs.collection(db, 'groups', g.id, c), fs.where('uid', '==', uid)))).docs;
        for (let i = 0; i < docs.length; i += 400) { const bt = fs.writeBatch(db); docs.slice(i, i + 400).forEach(d => bt.delete(d.ref)); await bt.commit(); }
      }
      await fs.deleteDoc(fs.doc(db, 'groups', g.id, 'plans', uid)).catch(() => {});
      await fs.deleteDoc(fs.doc(db, 'groups', g.id, 'stats', uid)).catch(() => {});
      await fs.updateDoc(fs.doc(db, 'groups', g.id), { members: fs.arrayRemove(uid), ['names.' + uid]: fs.deleteField(), banned: fs.arrayUnion(uid) });
      roomMsg('已移出。');
    } catch (err) { roomMsg('沒成功，請稍後再試。'); }
  });
  $('gpClose').addEventListener('click', () => $('grpPlan').close());
  $('grpPlan').addEventListener('close', () => { planSeq++; });
  window.paceGroupRefresh = () => { if (roomGid) renderRoom(); };
  /* for c-board.js (the schedule a group shares): my groups, the open room, my name in a group */
  window.paceGroups = { list: () => groups, onChange: f => { hooks.push(f); f(groups); }, onRoom: f => { roomHooks.push(f); if (roomGid) f(roomGid); },
    room: () => roomGid, user: () => user, fb: () => fb, nameIn: gid => (groups.find(g => g.id === gid)?.names || {})[user?.uid] || myName(), open: gid => openRoom(gid) };
  /* changing my theme changes how friends see me: publish again soon */
  { const apply0 = window.applySkin; if (typeof apply0 === 'function') window.applySkin = function () { const r = apply0.apply(this, arguments); try { schedulePublish(1500); } catch (e) {} return r; }; }   // theme changed: new words for the numbers
})();
