#!/usr/bin/env node
/* One-time copy of everything A saved (weeks, tasks, templates from ./export) into your Pace (C) account's own data,
   so C shows your whole A history and plan. Settings (config) are NOT copied: C keeps its own.
   usage:  node bridge/import-all.js          show what would be written (writes nothing)
           node bridge/import-all.js --go     write it; first saves what the account holds now to bridge/backup-before-import.json
           add --config to also copy A's fixed schedule, block palette, targets, holidays (C keeps its theme)
           add --emulator for the local Firebase emulators (tests). */
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const CONFIG = process.argv.includes('--config'), GO = process.argv.includes('--go'), EMU = process.argv.includes('--emulator');
const die = m => { console.error('ERROR: ' + m); process.exit(1); };
const cfg = JSON.parse(fs.readFileSync(process.env.BRIDGE_CONFIG || path.join(__dirname, 'config.json'), 'utf8'));
const fbCfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'pace-build/firebase-config.json'), 'utf8'));
const PROJECT = EMU ? 'demo-pace' : fbCfg.projectId, KEY = EMU ? 'fake-key' : fbCfg.apiKey;
const AUTH = EMU ? 'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1' : 'https://identitytoolkit.googleapis.com/v1';
const FS = (EMU ? 'http://127.0.0.1:8080' : 'https://firestore.googleapis.com') + '/v1/projects/' + PROJECT + '/databases/(default)/documents';
const enc = v => v === null || v === undefined ? { nullValue: null } : typeof v === 'boolean' ? { booleanValue: v } : Number.isInteger(v) ? { integerValue: String(v) } : typeof v === 'number' ? { doubleValue: v }
  : typeof v === 'string' ? { stringValue: v } : Array.isArray(v) ? { arrayValue: { values: v.map(enc) } } : { mapValue: { fields: Object.fromEntries(Object.entries(v).map(([k, x]) => [k, enc(x)])) } };
const dec = f => f == null ? null : 'stringValue' in f ? f.stringValue : 'integerValue' in f ? Number(f.integerValue) : 'doubleValue' in f ? f.doubleValue : 'booleanValue' in f ? f.booleanValue
  : 'arrayValue' in f ? (f.arrayValue.values || []).map(dec) : 'mapValue' in f ? Object.fromEntries(Object.entries(f.mapValue.fields || {}).map(([k, x]) => [k, dec(x)])) : null;
let token = '';
const call = async (url, opt = {}) => {
  const r = await fetch(url, { ...opt, headers: { 'content-type': 'application/json', ...(token ? { authorization: 'Bearer ' + token } : {}) } });
  const t = await r.text(); let j = null; try { j = JSON.parse(t); } catch (e) {}
  if (!r.ok) throw new Error((j && j.error && (j.error.message || j.error.status)) || r.status + ' ' + t.slice(0, 200));
  return j;
};
const exp = process.env.BRIDGE_EXPORT || path.join(ROOT, 'export');
const local = [];
for (const dir of ['weeks', 'tasks', 'templates']) {
  const d = path.join(exp, dir); if (!fs.existsSync(d)) continue;
  for (const f of fs.readdirSync(d).filter(x => x.endsWith('.json'))) local.push({ p: dir + '/' + f.slice(0, -5), d: JSON.parse(fs.readFileSync(path.join(d, f), 'utf8')) });
}
if (CONFIG) { const f = path.join(exp, 'config/main.json'); if (fs.existsSync(f)) local.push({ p: 'config/main', d: JSON.parse(fs.readFileSync(f, 'utf8')), merge: true }); }
(async () => {
  const auth = await call(AUTH + '/accounts:signInWithPassword?key=' + KEY, { method: 'POST', body: JSON.stringify({ email: cfg.email, password: cfg.password, returnSecureToken: true }) }).catch(e => die('sign-in failed: ' + e.message));
  token = auth.idToken; const uid = auth.localId, base = FS + '/users/' + uid + '/docs';
  const cur = {}; let pageToken = '';
  do {
    const j = await call(base + '?pageSize=300' + (pageToken ? '&pageToken=' + encodeURIComponent(pageToken) : ''));
    for (const doc of j.documents || []) { const f = Object.fromEntries(Object.entries(doc.fields || {}).map(([k, v]) => [k, dec(v)])); if (f.p) cur[f.p] = f; }
    pageToken = j.nextPageToken || '';
  } while (pageToken);
  console.log('Your Pace account (' + cfg.email + ') holds ' + Object.keys(cur).length + ' documents; A has ' + local.length + ' to copy.');
  for (const x of local) if (x.merge) { const c = (cur[x.p] || {}).d || {}; const a = x.d; x.d = { ...c, ...Object.fromEntries(['fixed', 'modules', 'special', 'holidays', 'targets', 'restMin', 'defaultTemplate', 'version'].filter(k => k in a).map(k => [k, a[k]])) }; }   // C keeps its own theme and other settings
  const plan = local.map(x => { const c = cur[x.p]; const same = c && !c.del && JSON.stringify(c.d) === JSON.stringify(x.d); return { ...x, state: same ? 'same' : c && !c.del ? 'REPLACES C\'s version' : 'new' }; });
  for (const x of plan) console.log('  ' + x.p.padEnd(34) + x.state + (x.p.startsWith('weeks/') ? '  (' + (x.d.blocks || []).length + ' blocks' + (cur[x.p] && !cur[x.p].del ? ', C has ' + ((cur[x.p].d || {}).blocks || []).length : '') + ')' : ''));
  if (!GO) { console.log('\nNothing written. Run again with --go to copy.'); return; }
  const bk = path.join(__dirname, 'backup-before-import.json'); fs.writeFileSync(bk, JSON.stringify(cur, null, 1)); console.log('\nBackup of the account saved: ' + bk);
  const todo = plan.filter(x => x.state !== 'same'); let t = Date.now();
  for (let i = 0; i < todo.length; i += 20) {
    const writes = todo.slice(i, i + 20).map(x => ({ update: { name: 'projects/' + PROJECT + '/databases/(default)/documents/users/' + uid + '/docs/' + x.p.split('/').join('~'), fields: { p: enc(x.p), t: enc(t++), d: enc(x.d), del: enc(false) } } }));
    await call(FS + ':commit', { method: 'POST', body: JSON.stringify({ writes }) });
  }
  console.log('Copied ' + todo.length + ' document(s). Open Pace (or reload it) and sign in: your A plan and records are there.');
})().catch(e => die(e.message));
