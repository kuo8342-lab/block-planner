// Builds planner-data.json (read by the desktop note) from documents that ArtifactData saved into ./export
// Usage: node build-export.js
const fs = require('fs'), path = require('path');
const dir = path.join(__dirname, 'export');
const read = p => JSON.parse(fs.readFileSync(path.join(dir, p), 'utf8'));
const list = c => fs.existsSync(path.join(dir, c)) ? fs.readdirSync(path.join(dir, c)).filter(f => f.endsWith('.json')).map(f => ({ id: f.replace(/\.json$/, ''), ...read(path.join(c, f)) })) : [];
const cfg = read('config/main.json');
const weeks = {}; list('weeks').forEach(w => { const { id, ...rest } = w; weeks[id] = rest; });
const templates = list('templates');
const out = {
  exportedAt: new Date().toISOString(),
  appUrl: 'https://claude.ai/artifact/RRaj3mqydYHndBP93vSeUg',
  skin: cfg.skin || 'default',
  fixed: cfg.fixed || [], special: cfg.special || [], holidays: cfg.holidays || [],
  defaultTemplate: (templates.find(t => t.id === cfg.defaultTemplate) || {}).blocks || [],
  weeks,
  tasks: list('tasks').filter(t => !t.done).map(({ title, minutes, showFrom, due }) => ({ title, minutes, showFrom, due }))
};
const target = path.join(__dirname, 'planner-data.json');
fs.writeFileSync(target + '.tmp', JSON.stringify(out, null, 1), 'utf8');
fs.renameSync(target + '.tmp', target);
console.log('wrote', target, '| weeks', Object.keys(weeks).length, '| tasks', out.tasks.length, '| skin', out.skin);
