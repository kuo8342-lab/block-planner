#!/usr/bin/env node
/* A → C bridge.
   A (the claude.ai planner) cannot reach the internet, so this small program runs on your computer: it reads what the
   scheduled export saved from A (./export), signs in to Pace (C) with your own account and refreshes your numbers and
   this week's plan in the groups you are in. It never changes WHO may see your plan: it keeps the choice you made in C
   (nobody / everyone / ticked people) and writes only your own documents.

   usage:  node bridge/a-to-c.js            sync once
           node bridge/a-to-c.js --dry      show what would be written, write nothing
           node bridge/a-to-c.js --release  give publishing back to the C app (stops syncing from A)
           node bridge/a-to-c.js --emulator use the local Firebase emulators (tests)
   setup:  copy bridge/config.example.json to bridge/config.json and fill in the e-mail and password of your Pace account. */
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.resolve(__dirname, '..');
const args = new Set(process.argv.slice(2));
const DRY = args.has('--dry'), RELEASE = args.has('--release'), EMU = args.has('--emulator');
const log = (...a) => console.log(new Date().toISOString().slice(0, 19).replace('T', ' '), ...a);
const die = m => { console.error('ERROR: ' + m); process.exit(1); };

/* ---------- settings ---------- */
const cfgFile = process.env.BRIDGE_CONFIG || path.join(__dirname, 'config.json');   // BRIDGE_CONFIG / BRIDGE_EXPORT are for tests
if (!fs.existsSync(cfgFile)) die('bridge/config.json is missing. Copy bridge/config.example.json and fill in your Pace e-mail and password.');
const cfg = JSON.parse(fs.readFileSync(cfgFile, 'utf8'));
if (!cfg.email || !cfg.password) die('bridge/config.json needs "email" and "password".');
const fbCfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'pace-build/firebase-config.json'), 'utf8'));
const PROJECT = EMU ? (process.env.BRIDGE_PROJECT || 'demo-pace') : fbCfg.projectId;
const AUTH = EMU ? 'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1' : 'https://identitytoolkit.googleapis.com/v1';
const FS = (EMU ? 'http://127.0.0.1:8080' : 'https://firestore.googleapis.com') + '/v1/projects/' + PROJECT + '/databases/(default)/documents';
const KEY = EMU ? 'fake-key' : fbCfg.apiKey;

/* ---------- Firestore REST helpers ---------- */
const enc = v => v === null ? { nullValue: null } : typeof v === 'boolean' ? { booleanValue: v } : Number.isInteger(v) ? { integerValue: String(v) } : typeof v === 'number' ? { doubleValue: v }
  : typeof v === 'string' ? { stringValue: v } : Array.isArray(v) ? { arrayValue: { values: v.map(enc) } } : { mapValue: { fields: Object.fromEntries(Object.entries(v).map(([k, x]) => [k, enc(x)])) } };
const dec = f => f == null ? null : 'stringValue' in f ? f.stringValue : 'integerValue' in f ? Number(f.integerValue) : 'doubleValue' in f ? f.doubleValue : 'booleanValue' in f ? f.booleanValue
  : 'arrayValue' in f ? (f.arrayValue.values || []).map(dec) : 'mapValue' in f ? Object.fromEntries(Object.entries(f.mapValue.fields || {}).map(([k, x]) => [k, dec(x)])) : 'timestampValue' in f ? f.timestampValue : null;
const decDoc = d => d && d.fields ? Object.fromEntries(Object.entries(d.fields).map(([k, v]) => [k, dec(v)])) : {};
let token = '';
const call = async (url, opt = {}) => {
  const r = await fetch(url, { ...opt, headers: { 'content-type': 'application/json', ...(token ? { authorization: 'Bearer ' + token } : {}), ...(opt.headers || {}) } });
  const t = await r.text(); let j = null; try { j = JSON.parse(t); } catch (e) {}
  if (!r.ok) { const e = new Error((j && j.error && (j.error.message || j.error.status)) || r.status + ' ' + t.slice(0, 200)); e.status = r.status; throw e; }
  return j;
};

/* ---------- A's data (what the scheduled export saved) ---------- */
const exp = process.env.BRIDGE_EXPORT || path.join(ROOT, 'export');
const readJson = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const pad = n => String(n).padStart(2, '0');
const ymd = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const mondayOfNow = () => { const x = new Date(); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };
const toMin = hm => { const [h, m] = String(hm || '0:0').split(':'); return (+h || 0) * 60 + (+m || 0); };
const hmOf = m => pad(Math.floor(m / 60) % 24) + ':' + pad(m % 60);
// A decides which blocks count as study with its own rules; read them from A's source so the numbers match A's report
const aSrc = fs.readFileSync(path.join(ROOT, 'a-source/planner.html'), 'utf8');
const subRules = (() => { const m = /const SUB_RULES = (\[[^\n]*\]);/.exec(aSrc); try { return m ? vm.runInNewContext('(' + m[1] + ')') : []; } catch (e) { return []; } })();
const studyCats = (() => { const m = /const STUDY_CATS = (\[[^\]]*\]);/.exec(aSrc); try { return m ? vm.runInNewContext(m[1]) : ['study', 'preview', 'code', 'lang', 'exam']; } catch (e) { return ['study', 'preview', 'code', 'lang', 'exam']; } })();
const subjectOf = b => b.subject || (subRules.find(([re]) => re.test(b.name || '')) || [])[1] || '';
const counts = b => studyCats.includes(b.cat) || (subjectOf(b) && subjectOf(b) !== '不算科目');

function weekSnapshot() {
  const mon = mondayOfNow(), week = ymd(mon), now = new Date();
  const wf = path.join(exp, 'weeks', week + '.json'), cf = path.join(exp, 'config', 'main.json');
  if (!fs.existsSync(cf)) die('no export found in ./export (run the scheduled export first).');
  const cfg2 = readJson(cf), age = (Date.now() - fs.statSync(cf).mtimeMs) / 36e5;
  const d = fs.existsSync(wf) ? readJson(wf) : { blocks: [] };
  const all = (d.blocks || []).filter(b => b && Number.isInteger(b.day) && b.day >= 0 && b.day <= 6).map(b => {
    const day = new Date(mon); day.setDate(day.getDate() + b.day);
    return { ...b, end: new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, toMin(b.start) + (Number(b.minutes) || 0)) };
  });
  const bl = all.filter(b => !b.skipped && counts(b)), sum = l => l.reduce((a, b) => a + (Number(b.minutes) || 0), 0);
  const done = bl.filter(b => b.done), du = sum(bl.filter(b => b.done || b.failed || b.end <= now)), dn = sum(done);
  const tt = Object.values(cfg2.targets || {}).reduce((a, b) => a + (Number(b) || 0), 0);
  return {
    week, ageHours: Math.round(age * 10) / 10,
    rate: du ? Math.min(100, Math.round(dn / du * 100)) : -1, stars: Math.min(done.length, 500), glow: tt ? Math.min(100, Math.round(dn / tt * 100)) : 0,
    blocks: all.filter(b => !b.skipped).sort((a, b) => a.day - b.day || toMin(a.start) - toMin(b.start)).slice(0, 150)
      .map(b => ({ d: b.day, s: String(b.start || '').slice(0, 5), m: Math.max(0, Math.min(1440, Math.round(Number(b.minutes) || 0))), n: String(b.name || '').slice(0, 40), c: String(b.cat || '').replace(/[^a-z]/g, '').slice(0, 12), x: !!b.done }))
  };
}

/* ---------- main ---------- */
(async () => {
  const auth = await call(AUTH + '/accounts:signInWithPassword?key=' + KEY, { method: 'POST', body: JSON.stringify({ email: cfg.email, password: cfg.password, returnSecureToken: true }) })
    .catch(e => die('sign-in failed (' + e.message + '). Check the e-mail and password in bridge/config.json; if your Pace account uses Google, set a password first (see bridge/README.md).'));
  token = auth.idToken; const uid = auth.localId;
  log('signed in as', cfg.email);
  const q = await call(FS + ':runQuery', { method: 'POST', body: JSON.stringify({ structuredQuery: { from: [{ collectionId: 'groups' }], where: { fieldFilter: { field: { fieldPath: 'members' }, op: 'ARRAY_CONTAINS', value: { stringValue: uid } } } } }) });
  const groups = q.filter(r => r.document).map(r => ({ id: r.document.name.split('/').pop(), ...decDoc(r.document) }));
  log(groups.length, 'group(s)');
  const snap = weekSnapshot();
  log('week', snap.week, '| rate', snap.rate, '| stars', snap.stars, '| glow', snap.glow, '| blocks', snap.blocks.length, '| export is', snap.ageHours + ' h old');
  let wrote = 0;
  for (const g of groups) {
    const planUrl = FS + '/groups/' + g.id + '/plans/' + uid;
    const cur = await call(planUrl).catch(e => e.status === 404 ? null : Promise.reject(e));
    if (!cur) { log('  ' + g.name + ': you have not chosen who may see your plan in C yet — skipped (open the group in C once).'); continue; }
    const mine = decDoc(cur);
    if (!['none', 'some', 'all'].includes(mine.access)) { log('  ' + g.name + ': unreadable choice, skipped'); continue; }
    const members = g.members || [];
    const allow = mine.access === 'some' ? (mine.allow || []).filter(u => members.includes(u)).slice(0, 29) : [];
    const name = (g.names && g.names[uid]) || cfg.email.split('@')[0];
    const stats = { uid, name: String(name).slice(0, 30), week: snap.week, rate: snap.rate, stars: snap.stars, glow: snap.glow, share: mine.access };
    const plan = { uid, week: snap.week, access: mine.access, allow, blocks: mine.access === 'none' ? [] : snap.blocks, choiceAt: Number.isInteger(mine.choiceAt) ? mine.choiceAt : 0, source: RELEASE ? '' : 'a' };
    if (RELEASE) delete plan.source;
    log('  ' + g.name + ': choice =', mine.access + (allow.length ? ' (' + allow.length + ' people)' : '') + ', ' + plan.blocks.length + ' blocks shared' + (RELEASE ? ', releasing' : ''));
    if (DRY) continue;
    const doc = (p, data) => ({ update: { name: 'projects/' + PROJECT + '/databases/(default)/documents/groups/' + g.id + '/' + p + '/' + uid, fields: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, enc(v)])) }, updateTransforms: [{ fieldPath: 'at', setToServerValue: 'REQUEST_TIME' }] });
    await call(FS + ':commit', { method: 'POST', body: JSON.stringify({ writes: [doc('stats', stats), doc('plans', plan)] }) });
    wrote++;
  }
  fs.writeFileSync(path.join(__dirname, 'last-run.json'), JSON.stringify({ at: new Date().toISOString(), groups: groups.length, wrote, rate: snap.rate, stars: snap.stars, week: snap.week, dry: DRY }, null, 1));
  log(DRY ? 'dry run, nothing written' : 'done: ' + wrote + ' group(s) updated');
})().catch(e => die(e.message));
