const fs = require('fs'), path = require('path');
const dir = __dirname, root = path.join(dir, '..');
const cfg = JSON.parse(fs.readFileSync(path.join(root, 'seed_config.json'), 'utf8'));
cfg.holidays = [{ date: '2026-10-26', name: '光復節補假' }];
cfg.targets = { 數學: 215, 物理: 145, 化學: 75, 生物: 50, 國文: 55, 英文: 140, 德文: 40, 程式: 90, 自主學習: 60 };
cfg.defaultTemplate = 'default-plan';
const dp = JSON.parse(fs.readFileSync(path.join(root, 'default-plan.json'), 'utf8'));
const seed = { 'templates/default-plan': dp, ['weeks/' + (() => { const d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0'); })()]: { blocks: [] }, 'config/main': cfg, 'tasks/t1': { title: '確認英檢考場', minutes: 10, cat: 'lang', showFrom: '2026-10-19', due: '2026-10-21', done: false }, 'tasks/t2': { title: 'Kibo 提交', minutes: 60, cat: 'code', showFrom: '2026-12-21', due: '2026-12-27', done: false } };
const mock = `<script>
(() => {
  const store = ${JSON.stringify(seed)};
  const subs = [];
  const clone = v => JSON.parse(JSON.stringify(v));
  const snapDoc = p => ({ id: p.split('/').pop(), exists: p in store, data: () => p in store ? clone(store[p]) : undefined, metadata: {} });
  const fire = () => subs.forEach(s => s());
  const doc = p => ({ id: p.split('/').pop(), path: p,
    get: async () => snapDoc(p),
    set: async d => { store[p] = clone(d); window.__writes = (window.__writes || 0) + 1; setTimeout(fire, 30); },
    update: async d => { store[p] = { ...store[p], ...clone(d) }; setTimeout(fire, 30); },
    delete: async () => { delete store[p]; setTimeout(fire, 30); },
    onSnapshot: (next) => { const f = () => next(snapDoc(p)); subs.push(f); setTimeout(f, 10); return () => {}; } });
  const collection = c => ({ path: c, doc: id => doc(c + '/' + id),
    get: async () => { const docs = Object.keys(store).filter(k => k.startsWith(c + '/') && k.split('/').length === c.split('/').length + 1).map(snapDoc); return { docs, size: docs.length, empty: !docs.length, docChanges: () => [], metadata: {} }; },
    onSnapshot: (next) => { const f = () => { const docs = Object.keys(store).filter(k => k.startsWith(c + '/') && k.split('/').length === c.split('/').length + 1).map(snapDoc); next({ docs, size: docs.length, empty: !docs.length, docChanges: () => [], metadata: {} }); }; subs.push(f); setTimeout(f, 10); return () => {}; } });
  const db = { doc, collection };
  window.__store = store;
  const mockSample = async (input, opts) => { window.__lastPrompt = typeof input === 'string' ? input : JSON.stringify(input); const text = '測試回答：這週數學還差 165 分，今天先做 30 分鐘。'; opts && opts.onText && opts.onText({ text, delta: text }); return { text, truncated: false, modelTierApplied: 'default' }; };
  mockSample.json = async () => [{ title: '讀課本 2-1 重點', minutes: 25 }, { title: '做習題 1~10', minutes: 40 }, { title: '訂正錯題', minutes: 20 }];
  const mockDownloads = { save: async ({ filename, data }) => { window.__saved = { filename, len: String(data).length }; return { status: 'saved' }; } };
  window.claude = { use: async n => n === 'db' ? db : n === 'sample' ? mockSample : n === 'downloads' ? mockDownloads : null };
})();
</script>`;
const page = fs.readFileSync(path.join(root, 'planner.html'), 'utf8');
fs.writeFileSync(path.join(dir, 'index.html'), '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' + mock + '</head><body>' + page + '<script>' + fs.readFileSync(path.join(dir, 'tests.js'), 'utf8') + fs.readFileSync(path.join(dir, 'contrast.js'), 'utf8') + '</script></body></html>');
console.log('built');
