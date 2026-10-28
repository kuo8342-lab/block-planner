/* 步調 Pace: 共筆群組 — friends join with an invite code; whenever someone finishes a block or a task,
   everyone in the group sees 「搞定！」 and can tap 👏. Only finished things are shared, never the timetable.
   Firestore: groups/{code} { name, owner, members[], names{uid: name} } and groups/{code}/feed/{uid_item}.
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
    '<p class="hint" style="margin:0">跟朋友、同學組一個群組：誰完成了方塊或任務，大家都會看到「搞定！」，還可以按 👏 幫他拍拍。只會分享完成的事，你的時間表別人看不到。</p>' +
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
  card.innerHTML = '<h2>群組動態 <span class="count" id="grpCount"></span></h2><div class="grp-feed" id="grpFeed"></div>' +
    '<p class="hint">朋友完成方塊或任務時會出現在這裡，按 👏 幫他拍拍。群組在「設定 → 共筆群組」。</p>';
  ($('wishes')?.closest('section') || document.querySelector('main section.card:last-of-type'))?.after(card);

  /* ---------- state ---------- */
  let fb = null, user = null, groups = [], unGroups = null;
  const feeds = new Map();      // gid → { unsub, items: [] }
  const cheersSeen = new Map(); // my feed items → how many 👏 I've already been told about
  const myName = () => (ls.get('pace-group-name') || user?.displayName || (user?.email || '').split('@')[0] || '我').slice(0, 20);

  paceSync.onUser(async u => {
    user = u;
    $('grpOff').hidden = !!u; $('grpOn').hidden = !u;
    if (!u) { unGroups?.(); unGroups = null; for (const f of feeds.values()) f.unsub(); feeds.clear(); groups = []; render(); return; }
    fb = paceSync.fb();
    $('grpMe').value = myName();
    const { fs, db } = fb;
    unGroups = fs.onSnapshot(fs.query(fs.collection(db, 'groups'), fs.where('members', 'array-contains', u.uid)), snap => {
      groups = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.name.localeCompare(b.name));
      for (const [gid, f] of feeds) if (!groups.some(g => g.id === gid)) { f.unsub(); feeds.delete(gid); }
      for (const g of groups) if (!feeds.has(g.id)) listen(g.id);
      render();
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
      '<div class="sync-acts"><button class="btn" type="button" data-ginvite="' + g.id + '">邀請朋友</button><button class="btn plain" type="button" data-gleave="' + g.id + '">退出</button></div></div>').join('');
    // main page: last 7 days, newest first
    const week = Date.now() - 7 * 864e5;
    const all = [...feeds.values()].flatMap(f => f.items).filter(it => !it.at?.toMillis || it.at.toMillis() > week)
      .sort((a, b) => (b.at?.toMillis?.() ?? Infinity) - (a.at?.toMillis?.() ?? Infinity)).slice(0, 30);
    card.hidden = !groups.length;
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
  const busy = f => async (...a) => { if (!user) { msg('要先登入同步帳號。'); return; } msg('處理中…'); try { await f(...a); } catch (e) { msg('失敗了：' + (e?.code === 'permission-denied' ? '沒有權限（群組可能滿 30 人或不存在）' : e?.code || e?.message || e)); } };
  $('grpNew').addEventListener('click', busy(async () => {
    const name = $('grpName').value.trim().slice(0, 30);
    if (!name) { msg('先幫群組取個名字。'); return; }
    const { fs, db } = fb, code = newCode();
    await fs.setDoc(fs.doc(db, 'groups', code), { name, owner: user.uid, members: [user.uid], names: { [user.uid]: myName() }, createdAt: fs.serverTimestamp() });
    $('grpName').value = '';
    msg('建立好了！邀請碼是 ' + code + '，按「邀請朋友」把連結傳給大家。');
  }));
  async function join(code) {
    const { fs, db } = fb, ref = fs.doc(db, 'groups', code), g = await fs.getDoc(ref);
    if (!g.exists()) { msg('找不到這個邀請碼，請再確認一次。'); return false; }
    if (g.data().members.includes(user.uid)) { msg('你已經在「' + g.data().name + '」裡了。'); return true; }
    if (!confirm('要加入群組「' + g.data().name + '」嗎？之後你完成的方塊和任務，群組裡的人都看得到（可以在設定裡關掉）。')) { msg(''); return false; }
    await fs.updateDoc(ref, { members: fs.arrayUnion(user.uid), ['names.' + user.uid]: myName() });
    msg('加入「' + g.data().name + '」了！');
    return true;
  }
  $('grpJoin').addEventListener('click', busy(async () => {
    const code = cleanCode($('grpCode').value);
    if (code.length !== 8) { msg('邀請碼是 8 個英文字母或數字。'); return; }
    if (await join(code)) $('grpCode').value = '';
  }));
  $('grpList').addEventListener('click', busy(async e => {
    const inv = e.target.closest('[data-ginvite]'), leave = e.target.closest('[data-gleave]');
    if (!inv && !leave) { msg(''); return; }
    const g = groups.find(x => x.id === (inv || leave).dataset[inv ? 'ginvite' : 'gleave']);
    if (inv) {
      const text = '一起用「步調」排時間！加入我的群組「' + g.name + '」，完成時互相說搞定 🎉 邀請碼：' + g.id;
      if (navigator.share) { try { await navigator.share({ title: '步調 Pace', text, url: link(g.id) }); msg(''); return; } catch (err) { if (err?.name === 'AbortError') { msg(''); return; } } }
      try { await navigator.clipboard.writeText(text + '\n' + link(g.id)); msg('邀請連結複製好了，貼給朋友就可以。'); }
      catch (err) { msg('把這個連結傳給朋友：' + link(g.id)); }
      return;
    }
    if (!confirm('要退出「' + g.name + '」嗎？你之前的「搞定」會留著，之後就不會再收到群組的消息。')) { msg(''); return; }
    const { fs, db } = fb;
    await fs.updateDoc(fs.doc(db, 'groups', g.id), { members: fs.arrayRemove(user.uid), ['names.' + user.uid]: fs.deleteField() });
    msg('已退出「' + g.name + '」。');
  }));
  $('grpMe').addEventListener('change', busy(async () => {
    const name = $('grpMe').value.trim().slice(0, 20);
    if (!name) { $('grpMe').value = myName(); msg(''); return; }
    ls.set('pace-group-name', name);
    const { fs, db } = fb;
    for (const g of groups) await fs.updateDoc(fs.doc(db, 'groups', g.id), { ['names.' + user.uid]: name });
    msg('名字改好了。');
  }));
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
  paceStore.apply = (p, d, t) => { apply(p, d, t); known.set(p, doneIn(p, d)); };
  paceStore.onWrite((p, d) => {
    const now = doneIn(p, d), was = known.get(p) || new Map();
    known.set(p, now);
    if (!user || !groups.length) return;
    const { fs, db } = fb, hide = ls.get('pace-group-hide') === '1';
    const eid = k => user.uid + '_' + k.replace(/[^A-Za-z0-9_-]/g, '');
    for (const [k, it] of now) if (!was.has(k) && ls.get('pace-group-share') !== '0')
      for (const g of groups) fs.setDoc(fs.doc(db, 'groups', g.id, 'feed', eid(k)), {
        uid: user.uid, name: myName(), title: hide ? '' : String(it.title || '').slice(0, 60),
        minutes: Math.max(0, Math.min(1440, Math.round(Number(it.minutes) || 0))), at: fs.serverTimestamp(), cheers: {}
      }).catch(() => {});   // already there (shared from another write): keep it and its 👏
    for (const k of was.keys()) if (!now.has(k))   // unticked: take it back
      for (const g of groups) fs.deleteDoc(fs.doc(db, 'groups', g.id, 'feed', eid(k))).catch(() => {});
  });
})();
