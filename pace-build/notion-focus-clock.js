/* C-only pause clock. Keep the original planner-focus document unchanged. */
(() => {
  'use strict';
  const key = 'pace-ui-focus-pause-v1';
  const read = f => {
    if (!f || !Number.isFinite(f.start)) return null;
    try {
      const value = JSON.parse(localStorage.getItem(key) || 'null');
      return value && value.start === f.start && Number.isFinite(value.at) && value.at >= f.start
        ? { start: value.start, at: value.at } : null;
    } catch (_) { return null; }
  };
  const pause = f => {
    if (!f || !Number.isFinite(f.start)) return false;
    if (read(f)) return true;
    const value = { start: f.start, at: Date.now() };
    if (value.at < value.start) return false;
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return read(f)?.at === value.at;
    } catch (_) { return false; }
  };
  const clear = f => {
    if (!read(f)) return;
    try { localStorage.removeItem(key); } catch (_) { /* A stale signature is harmless. */ }
  };
  window.paceFocusNow = f => read(f)?.at ?? Date.now();
  window.paceFocusClock = Object.freeze({ key, read, pause, clear });
})();
