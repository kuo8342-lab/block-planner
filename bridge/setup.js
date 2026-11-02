#!/usr/bin/env node
/* One-time setup for the A → Pace bridge: asks for your Pace e-mail and password (typed here, never shown or logged),
   checks that they work, writes bridge/config.json, does a dry run and offers to install the 30-minute schedule.
   usage: node bridge/setup.js            (add --emulator for tests) */
const fs = require('fs'), path = require('path'), readline = require('readline'), cp = require('child_process');
const EMU = process.argv.includes('--emulator');
const ROOT = path.resolve(__dirname, '..');
const fb = JSON.parse(fs.readFileSync(path.join(ROOT, 'pace-build/firebase-config.json'), 'utf8'));
const AUTH = EMU ? 'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1' : 'https://identitytoolkit.googleapis.com/v1', KEY = EMU ? 'fake-key' : fb.apiKey;
const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
let muted = false; const w0 = rl._writeToOutput.bind(rl); rl._writeToOutput = s => { if (!muted) w0(s); else if (/\n|\r/.test(s)) w0('\n'); };
const ask = (q, hidden) => new Promise(res => { process.stdout.write(q); muted = !!hidden; rl.question('', a => { muted = false; res(a.trim()); }); });
const yes = async q => /^(y|yes|是|好|要)/i.test(await ask(q + ' (y/n) '));
const call = async (p, body) => { const r = await fetch(AUTH + p + '?key=' + KEY, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }); const j = await r.json().catch(() => ({})); return { ok: r.ok, j }; };
(async () => {
  console.log('\n=== A → Pace 橋接：設定 ===\n密碼只在這個視窗輸入，不會顯示，也不會傳給任何人；只會存在你電腦的 bridge\\config.json。\n');
  const given = (process.argv.find(a => a.startsWith('--email=')) || '').slice(8);   // e.g. --email=me@example.com skips the question
  const email = (given || await ask('你的 Pace 帳號 Email： ')).toLowerCase();
  if (given) console.log('Pace 帳號 Email： ' + email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { console.log('這不像 Email，已結束。'); process.exit(1); }
  if (!(await yes('你的 Pace 帳號已經有密碼了嗎？（用 Email 註冊的就有；只用 Google 登入的還沒有）'))) {
    const r = await call('/accounts:sendOobCode', { requestType: 'PASSWORD_RESET', email });
    if (!r.ok) { console.log('寄信失敗：' + ((r.j.error && r.j.error.message) || '未知錯誤') + '（確認這個 Email 在 Pace 登入過）'); process.exit(1); }
    console.log('\n已寄出「重設密碼」的信到 ' + email + '。請開信、按連結、設一組新密碼（Google 登入之後仍然可以用）。');
    await ask('設好之後按 Enter 繼續… ');
  }
  let ok = false, password = '';
  for (let i = 0; i < 3 && !ok; i++) {
    password = await ask('\n請輸入 Pace 密碼（輸入時不會顯示）： ', true);
    const r = await call('/accounts:signInWithPassword', { email, password, returnSecureToken: true });
    if (r.ok) ok = true; else console.log('登入失敗（' + ((r.j.error && r.j.error.message) || '') + '），再試一次。');
  }
  if (!ok) { console.log('\n三次都失敗，已結束，沒有寫入任何檔案。'); process.exit(1); }
  fs.writeFileSync(path.join(__dirname, 'config.json'), JSON.stringify({ email, password }, null, 2));
  console.log('\n登入成功，已寫入 bridge\\config.json。\n\n--- 試跑（只顯示，不寫入）---');
  const d = cp.spawnSync(process.execPath, [path.join(__dirname, 'a-to-c.js'), '--dry', ...(EMU ? ['--emulator'] : [])], { stdio: 'inherit' });
  if (d.status !== 0) { console.log('\n試跑有問題（上面有說明）。設定檔已存好，修好後可以重新執行 node bridge/a-to-c.js --dry。'); process.exit(1); }
  if (EMU) { rl.close(); return; }
  if (await yes('\n要現在啟用自動同步嗎？（每 30 分鐘一次）')) {
    const r = cp.spawnSync('powershell', ['-ExecutionPolicy', 'Bypass', '-File', path.join(__dirname, 'install-task.ps1')], { stdio: 'inherit' });
    console.log(r.status === 0 ? '\n完成。之後不用再做什麼；結果在 bridge\\log.txt。' : '\n排程沒裝成功，上面有說明。');
  } else console.log('\n之後想啟用：powershell -ExecutionPolicy Bypass -File bridge\\install-task.ps1');
  rl.close();
})().catch(e => { console.error('ERROR: ' + e.message); process.exit(1); });
