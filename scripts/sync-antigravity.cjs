// Keep the second working copy (D:\antigravity\pace, another clone of this repo) up to date.
// Runs after every commit here (.git/hooks/post-commit). It only ever fast-forwards: when that copy has its own unfinished or
// committed changes it touches nothing and says which files, so they can be looked at and merged here first.
const { execFileSync } = require('child_process'), fs = require('fs'), path = require('path');
const COPY = process.env.PACE_COPY || 'D:/antigravity/pace', HERE = path.resolve(__dirname, '..');
const git = (...a) => execFileSync('git', ['-C', COPY, ...a], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
if (!fs.existsSync(path.join(COPY, '.git'))) { console.log('[sync] no copy at ' + COPY); process.exit(0); }
try {
  const dirty = git('status', '--porcelain');
  if (dirty) { console.log('[sync] NOT updated: ' + COPY + ' has its own changes. Look at them and merge them here first:\n' + dirty); process.exit(0); }
  git('fetch', '--quiet', HERE, 'main');
  const ahead = git('rev-list', '--count', 'FETCH_HEAD..HEAD');
  if (ahead !== '0') { console.log('[sync] NOT updated: ' + COPY + ' has ' + ahead + ' commit(s) that are not here:\n' + git('log', '--oneline', 'FETCH_HEAD..HEAD')); process.exit(0); }
  git('merge', '--quiet', '--ff-only', 'FETCH_HEAD');
  console.log('[sync] ' + COPY + ' is now at ' + git('log', '--oneline', '-1'));
} catch (e) { console.log('[sync] failed: ' + String(e.stderr || e.message).trim()); }
