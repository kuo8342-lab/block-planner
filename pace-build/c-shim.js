/* 步調 Pace runtime: the app was written against claude.ai's window.claude.use('db' | 'sample' | 'downloads').
   Outside claude.ai we provide: a database kept in this browser's localStorage,
   no AI ('sample' is always unavailable, so the app hides its AI parts), and plain browser downloads. */
(() => {
  if (window.claude?.use) return;
  const LS = 'pace-db-v1';
  const ls = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} } };

  /* ---------- database ---------- */
  let store = {};
  try { store = JSON.parse(ls.get(LS) || '{}') || {}; } catch (e) { store = {}; }
  if (!store['config/main']) store['config/main'] = {
    // a few basics only; c-persona.js swaps these for the chosen profile's starter blocks
    modules: [
      ['讀書', 'study', 50], ['寫作業', 'study', 60], ['考前複習', 'exam', 60], ['休息', 'rest', 20]
    ].map(([name, cat, minutes, subject, video], i) => ({ id: 'm' + i, name, cat, minutes, ...(subject ? { subject } : {}), ...(video ? { video: true } : {}) })),
    fixed: [], special: [], targets: {}, restMin: 60, holidays: []
  };
  const clone = v => v === undefined ? undefined : JSON.parse(JSON.stringify(v));
  let subs = [];
  const persist = () => { ls.set(LS, JSON.stringify(store)); subs.forEach(f => f()); };
  const snapDoc = p => ({ id: p.split('/').pop(), exists: p in store, data: () => clone(store[p]) });
  const docsIn = c => Object.keys(store).filter(k => k.startsWith(c + '/') && k.split('/').length === c.split('/').length + 1).sort().map(snapDoc);
  const qsnap = c => { const docs = docsIn(c); return { docs, size: docs.length, empty: !docs.length, docChanges: () => [], metadata: {} }; };
  const later = f => setTimeout(f, 0);
  const watch = f => { subs.push(f); later(f); return () => { subs = subs.filter(x => x !== f); }; };
  /* when each document was last written (ms), so cloud sync can tell which copy is newer */
  const META = 'pace-db-meta';
  let meta = {};
  try { meta = JSON.parse(ls.get(META) || '{}') || {}; } catch (e) { meta = {}; }
  const saveMeta = () => ls.set(META, JSON.stringify(meta));
  let writeHooks = [];
  const wrote = p => { meta[p] = Math.max(Date.now(), (meta[p] || 0) + 1); saveMeta(); const t = meta[p], d = clone(store[p]); writeHooks.forEach(f => f(p, d === undefined ? null : d, t)); };
  const doc = p => ({ id: p.split('/').pop(), path: p,
    get: async () => snapDoc(p),
    set: async data => { store[p] = clone(data); wrote(p); later(persist); },
    update: async data => { store[p] = { ...(store[p] || {}), ...clone(data) }; wrote(p); later(persist); },
    delete: async () => { delete store[p]; wrote(p); later(persist); },
    onSnapshot: next => watch(() => next(snapDoc(p))) });
  const collection = c => ({ path: c, doc: id => doc(c + '/' + id), get: async () => qsnap(c), onSnapshot: next => watch(() => next(qsnap(c))) });
  const db = { doc, collection };
  ls.set(LS, JSON.stringify(store));
  /* another tab changed the data: reload it and tell every listener */
  addEventListener('storage', e => {
    if (e.key === META) { try { meta = JSON.parse(e.newValue || '{}') || {}; } catch (err) {} return; }
    if (e.key !== LS) return; try { store = JSON.parse(e.newValue || '{}') || {}; } catch (err) {} subs.forEach(f => f());
  });
  /* hooks for c-sync.js: every local write, and applying a copy that came from the cloud */
  window.paceStore = {
    paths: () => [...new Set([...Object.keys(store), ...Object.keys(meta)])],
    read: p => ({ d: p in store ? clone(store[p]) : null, t: meta[p] || 0 }),
    onWrite: f => { writeHooks.push(f); return () => { writeHooks = writeHooks.filter(x => x !== f); }; },
    apply: (p, d, t) => { if (d == null) delete store[p]; else store[p] = clone(d); meta[p] = t; saveMeta(); later(persist); }
  };

  /* ---------- no AI in 步調: drop API keys saved by older versions ---------- */
  try { for (const k of Object.keys(localStorage)) if (/^pace-(api-key|model|ai-provider)/.test(k)) localStorage.removeItem(k); } catch (e) {}
  const fail = code => Object.assign(new Error(code), { code });

  /* ---------- downloads ---------- */
  // phones get the system share sheet (save to Files / Drive / send to yourself); computers a normal download.
  // With neither, there is no way to save a file, and the app hides its backup button.
  const touch = matchMedia('(pointer: coarse)').matches;
  const canShareFile = (() => { try { return !!navigator.canShare && navigator.canShare({ files: [new File(['{}'], 'x.json', { type: 'application/json' })] }); } catch (e) { return false; } })();
  const canDownload = 'download' in HTMLAnchorElement.prototype;
  const downloads = (canShareFile && touch) || canDownload ? { save: async ({ filename, data }) => {
    const text = typeof data === 'string' ? data : JSON.stringify(data);
    const done = () => { ls.set('pace-last-backup', String(Date.now())); return { status: 'saved' }; };   // the backup reminder counts from here
    if (canShareFile && touch) {
      try { await navigator.share({ files: [new File([text], filename, { type: 'application/json' })], title: filename }); return done(); }
      catch (e) { if (e?.name === 'AbortError') throw fail('declined'); if (!canDownload) throw e; }
    }
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: filename });
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 5000);
    return done();
  } } : null;

  window.claude = { use: async name => name === 'db' ? db : name === 'downloads' ? downloads : null };
})();
