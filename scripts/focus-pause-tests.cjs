/* Deterministic tests run the original focus functions with the three C clock adapters. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'a-source/planner.html'), 'utf8').replace(/\r\n/g, '\n');
const head = fs.readFileSync(path.join(root, 'pace-build/notion-focus-clock.js'), 'utf8');
const footer = fs.readFileSync(path.join(root, 'pace-build/notion-focus.js'), 'utf8');
const key = 'pace-ui-focus-pause-v1', timerKey = 'planner-focus', minute = 60000;
const epoch = Date.UTC(2026, 9, 28, 2);
let core = source.slice(source.indexOf('/* ---------- focus timer ---------- */'), source.indexOf('setInterval(() => { if (focus) renderFocus(); }, 1000);'));
for (const [before, after] of [
  ['function focusWorkMs(f, now = Date.now())', 'function focusWorkMs(f, now = paceFocusNow(f))'],
  ["function advanceFocus() {\n  const now = Date.now();", "function advanceFocus() {\n  const now = paceFocusNow(focus);"],
  ['const now = Date.now(), left = Math.max(0, focus.segEnd - now)', 'const now = paceFocusNow(focus), left = Math.max(0, focus.segEnd - now)']
]) {
  assert.equal(core.split(before).length - 1, 1, `Expected one adapter anchor: ${before}`);
  core = core.replace(before, after);
}

function frame({ storage = new Map(), time = { now: epoch }, language = 'zh' } = {}) {
  const nodes = new Map(), events = [], listeners = new Map(), toasts = [], reflects = [], notices = [];
  let failWrite = false;
  function node(id = '') {
    return {
      id, hidden: false, disabled: false, textContent: '', title: '', dataset: {}, style: {}, attrs: {}, handlers: new Map(), children: [],
      classList: { toggle() {}, contains() { return false; } },
      setAttribute(k, v) { this.attrs[k] = v; },
      addEventListener(type, fn) { this.handlers.set(type, fn); },
      prepend(child) { this.children.unshift(child); nodes.set(child.id, child); },
      querySelector(selector) { return selector === '.acts' ? get('focus-actions') : null; },
      click() { if (!this.disabled) this.handlers.get('click')?.({ target: this }); }
    };
  }
  function get(id) { if (!nodes.has(id)) nodes.set(id, node(id)); return nodes.get(id); }
  const document = {
    body: { classList: { contains() { return false; } } },
    getElementById(id) { return id === 'fPause' && !nodes.has(id) ? null : get(id); },
    createElement() { return node(); }
  };
  const localStorage = {
    getItem(k) { return storage.get(k) ?? null; },
    setItem(k, value) { if (failWrite) throw Error('Synthetic quota failure'); const oldValue = storage.get(k) ?? null; storage.set(k, String(value)); events.push({ key: k, oldValue, newValue: String(value) }); },
    removeItem(k) { const oldValue = storage.get(k) ?? null; storage.delete(k); events.push({ key: k, oldValue, newValue: null }); }
  };
  class ClockDate extends Date { static now() { return time.now; } }
  const state = { monday: new ClockDate(epoch), tasks: [], week: { blocks: [{ id: 'block-1', actual: 0 }] }, db: null };
  const context = vm.createContext({
    console, Date: ClockDate, document, localStorage, state, weekCache: {},
    prefGet: (_key, fallback) => fallback,
    ymd: () => '2026-10-26', pad: n => String(n).padStart(2, '0'), hm: n => String(n),
    toast: text => toasts.push(text), showAlarm: text => notices.push(text), showRemind: text => notices.push(text),
    playAlarmSound() {}, saveTask() {}, saveWeek() {}, render() {}, renderWidget() {},
    openReflect: (f, mins, completed) => reflects.push({ f, mins, completed }),
    addEventListener: (type, fn) => listeners.set(type, fn), paceLang: () => language
  });
  context.window = context;
  vm.runInContext(head, context, { filename: 'notion-focus-clock.js' });
  vm.runInContext(core, context, { filename: 'original-focus-with-C-clock.js' });
  vm.runInContext(footer, context, { filename: 'notion-focus.js' });
  const run = code => vm.runInContext(code, context);
  return {
    run, context, storage, time, nodes, toasts, reflects, notices, events,
    start(minutes = 60) { run(`startFocus({ id: 'block-1', name: 'Synthetic test', minutes: ${minutes} })`); },
    tick(minutes) { time.now += minutes * minute; run('renderFocus()'); },
    click() { get('fPause').click(); },
    get focus() { return run('focus'); },
    get work() { return run('focus && focusWorkMs(focus)'); },
    get actual() { return state.week.blocks[0].actual; },
    failWrites(value) { failWrite = value; },
    receive(event) { listeners.get('storage')?.(event); }
  };
}

let passed = 0;
async function test(name, fn) {
  await fn(); passed++;
  process.stdout.write(`PASS ${name}\n`);
}
(async () => {
  await test('work pause freezes countdown and excludes paused time on resume', () => {
    const app = frame(); app.start(); app.tick(7);
    const fields = Object.keys(app.focus).sort(), originalStart = app.focus.start;
    app.click(); assert.equal(app.nodes.get('wFocus').dataset.paused, 'true');
    assert.equal(app.nodes.get('fPause').attrs['aria-pressed'], 'true');
    assert.deepEqual(JSON.parse(app.storage.get(key)), { start: originalStart, at: epoch + 7 * minute });
    app.tick(40); assert.equal(app.work, 7 * minute); assert.equal(app.nodes.get('fTime').textContent, '18:00');
    app.click(); assert.equal(app.focus.start, originalStart + 40 * minute); assert.equal(app.focus.doneMs, 0);
    assert.equal(app.storage.has(key), false); assert.equal(app.nodes.get('fPause').attrs['aria-pressed'], 'false');
    app.tick(3); assert.equal(app.work, 10 * minute); assert.deepEqual(Object.keys(app.focus).sort(), fields);
  });
  await test('paused work survives refresh before the first core render', () => {
    const app = frame(); app.start(); app.tick(6); app.click(); app.time.now += 120 * minute;
    const reloaded = frame({ storage: app.storage, time: app.time });
    assert.equal(reloaded.work, 6 * minute); assert.equal(reloaded.focus.phase, 'work');
    assert.equal(reloaded.nodes.get('fTime').textContent, '19:00'); assert.equal(reloaded.notices.length, 0);
    reloaded.click(); reloaded.tick(1); assert.equal(reloaded.work, 7 * minute);
  });
  await test('break pause preserves remaining break, work total, and round', () => {
    const app = frame(); app.start(); app.tick(25); app.tick(2); app.click();
    assert.equal(app.focus.phase, 'break'); assert.equal(app.nodes.get('fSkip').disabled, true);
    app.tick(50); assert.equal(app.focus.phase, 'break'); assert.equal(app.focus.round, 1);
    assert.equal(app.work, 25 * minute); assert.equal(app.nodes.get('fTime').textContent, '08:00');
    const reloaded = frame({ storage: app.storage, time: app.time });
    assert.equal(reloaded.focus.phase, 'break'); assert.equal(reloaded.nodes.get('fTime').textContent, '08:00');
    reloaded.click(); assert.equal(reloaded.nodes.get('fSkip').disabled, false);
    reloaded.tick(8); assert.equal(reloaded.focus.phase, 'work'); assert.equal(reloaded.focus.round, 2); assert.equal(reloaded.work, 25 * minute);
    reloaded.tick(25); reloaded.tick(10); reloaded.tick(10);
    assert.equal(reloaded.focus, null); assert.equal(reloaded.actual, 60);
  });
  for (const completed of [false, true]) {
    await test(`${completed ? 'complete' : 'stop'} while paused records only actual work`, async () => {
      const app = frame(); app.start(); app.tick(7); app.click(); app.tick(90);
      await app.run(`finishFocus(${completed})`);
      assert.equal(app.focus, null); assert.equal(app.actual, 7); assert.equal(app.reflects[0].mins, 7);
      assert.equal(app.reflects[0].completed, completed); assert.equal(app.storage.has(key), false);
    });
  }
  await test('stopping a paused break excludes both break and pause', async () => {
    const app = frame(); app.start(); app.tick(27); app.click(); app.tick(90);
    await app.run('finishFocus(false)'); assert.equal(app.actual, 25); assert.equal(app.reflects[0].mins, 25);
  });
  await test('short single session naturally finishes at its shifted deadline', () => {
    const app = frame(); app.run("prefGet = (key, fallback) => key === 'planner-pomo-mode' ? 'single' : fallback");
    app.start(10); app.tick(4); app.click(); app.tick(30); app.click(); app.tick(6);
    assert.equal(app.focus, null); assert.equal(app.actual, 10); assert.equal(app.reflects[0].completed, true);
  });
  await test('expired work is advanced before a pause is created', () => {
    const app = frame(); app.start(); app.time.now += 27 * minute; app.click();
    assert.equal(app.focus.phase, 'break'); assert.equal(app.work, 25 * minute); assert.equal(app.nodes.get('fTime').textContent, '08:00');
  });
  await test('an already finished timer is not paused', () => {
    const app = frame(); app.start(10); app.time.now += 20 * minute; app.click();
    assert.equal(app.focus, null); assert.equal(app.actual, 10); assert.equal(app.storage.has(key), false);
  });
  await test('stale or malformed metadata cannot freeze another session', () => {
    for (const value of ['broken', '{"start":1,"at":2}', '{"start":1750000000000,"at":"bad"}']) {
      const storage = new Map([[key, value]]), app = frame({ storage }); app.start(); app.tick(1);
      assert.equal(app.work, minute); assert.equal(app.nodes.get('wFocus').dataset.paused, 'false');
    }
  });
  await test('legacy focus records keep their original normalization and can pause', () => {
    const storage = new Map([[timerKey, JSON.stringify({ id: 'block-1', week: '2026-10-26', name: 'Legacy', start: epoch, end: epoch + 10 * minute })]]);
    const app = frame({ storage, time: { now: epoch + 3 * minute } });
    assert.equal(app.focus.mode, 'single'); app.click(); app.tick(40); assert.equal(app.work, 3 * minute);
  });
  await test('storage failure does not pretend to pause or resume', () => {
    const app = frame(); app.start(); app.tick(3); app.failWrites(true); app.click();
    assert.equal(app.storage.has(key), false); assert.equal(app.nodes.get('wFocus').dataset.paused, 'false');
    app.failWrites(false); app.click(); const originalStart = app.focus.start;
    app.tick(10); app.failWrites(true); app.click();
    assert.equal(app.focus.start, originalStart); assert.equal(app.nodes.get('wFocus').dataset.paused, 'true');
    assert.equal(app.work, 3 * minute); assert.equal(app.toasts.length, 2);
  });
  await test('a second matching tab receives pause and shifted resume deadlines', () => {
    const a = frame(); a.start(); const b = frame({ storage: a.storage, time: a.time });
    a.tick(5); a.events.length = 0; a.click(); a.events.forEach(event => b.receive(event));
    assert.equal(b.nodes.get('wFocus').dataset.paused, 'true');
    a.tick(40); b.run('renderFocus()'); assert.equal(b.work, 5 * minute);
    a.events.length = 0; a.click(); a.events.forEach(event => b.receive(event));
    assert.equal(b.focus.start, a.focus.start); assert.equal(b.work, 5 * minute);
    b.tick(1); assert.equal(b.work, 6 * minute);
  });
  await test('remote stop cannot clear the clock before the origin computes work', async () => {
    const a = frame(); a.start(); a.tick(5); a.click();
    const b = frame({ storage: a.storage, time: a.time }); a.time.now += 100 * minute;
    const oldValue = a.storage.get(timerKey); a.storage.delete(timerKey);
    b.receive({ key: timerKey, oldValue, newValue: null });
    assert.equal(b.focus, null); assert.equal(a.storage.has(key), true);
    await a.run('finishFocus(false)'); assert.equal(a.actual, 5); assert.equal(a.storage.has(key), false);
  });
  await test('English labels describe real paused and resumed state', () => {
    const app = frame({ language: 'en' }); app.start(); assert.equal(app.nodes.get('fPause').textContent, 'Pause');
    app.click(); assert.equal(app.nodes.get('fPause').textContent, 'Resume'); assert.equal(app.nodes.get('fLbl').textContent, 'Focus paused');
    assert.match(app.nodes.get('fAll').textContent, /Paused time is excluded/);
  });
  process.stdout.write(`\n${passed}/${passed} focus pause tests passed. No application data or network was used.\n`);
})().catch(error => { console.error(error); process.exitCode = 1; });
