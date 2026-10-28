/* C-only controls around the existing focus timer; no new fields in planner-focus. */
(() => {
  'use strict';
  const clock = window.paceFocusClock;
  const box = document.getElementById('wFocus');
  const actions = box?.querySelector('.acts');
  if (!clock || !actions || document.getElementById('fPause')) return;
  const button = document.createElement('button');
  button.id = 'fPause'; button.type = 'button'; button.className = 'btn';
  actions.prepend(button);
  const en = () => window.paceLang?.() === 'en';
  const el = id => document.getElementById(id);
  const originalRender = renderFocus;
  let lastSession = null, remoteRender = 0;

  function updateControl() {
    if (!focus) {
      button.hidden = true;
      delete box.dataset.paused;
      // finishFocus computes actual minutes before it renders the empty timer.
      // Another tab must not clear the record while the originating tab computes.
      if (!remoteRender && lastSession) clock.clear(lastSession);
      return;
    }
    lastSession = { start: focus.start };
    const paused = !!clock.read(focus);
    button.hidden = false;
    button.textContent = paused ? (en() ? 'Resume' : '繼續') : (en() ? 'Pause' : '暫停');
    button.setAttribute('aria-pressed', String(paused));
    button.setAttribute('aria-label', paused ? (en() ? 'Resume timer' : '繼續計時') : (en() ? 'Pause timer' : '暫停計時'));
    button.title = paused ? (en() ? 'Paused time does not count toward focus time' : '暫停時間不計入實際專注時間') : (en() ? 'Pause the current work or break timer' : '暫停目前的專注或休息計時');
    box.dataset.paused = String(paused);
    // The original skip handler uses wall time. Resume before using it.
    const skip = el('fSkip');
    if (skip) { skip.disabled = paused; skip.title = paused ? (en() ? 'Resume before skipping the break' : '請先繼續計時，再略過休息') : ''; }
    if (!paused) return;
    const brk = focus.phase === 'break', split = focus.mode !== 'single';
    const rounds = split ? Math.ceil(focus.total / focus.work) : 1;
    const workMs = focusWorkMs(focus), doneMin = Math.floor(workMs / 60000), totalMin = Math.round(focus.total / 60000);
    el('fLbl').textContent = en() ? (brk ? 'Break paused' : 'Focus paused') : (brk ? '休息已暫停' : '專注已暫停');
    el('fRound').textContent = en()
      ? (split ? `Round ${focus.round} / ${rounds} · Paused` : 'Single session · Paused')
      : (split ? `第 ${focus.round} / ${rounds} 輪・已暫停` : '不分割・已暫停');
    el('fAll').textContent = en()
      ? `Overall ${doneMin} / ${totalMin} min (${Math.min(100, Math.round(workMs / focus.total * 100))}%) · Paused time is excluded`
      : `整體進度 ${doneMin} / ${totalMin} 分鐘（${Math.min(100, Math.round(workMs / focus.total * 100))}%）・暫停時間不計入`;
    el('focusPill').textContent = `${en() ? 'Paused' : '已暫停'} ${el('fTime').textContent}`;
  }

  renderFocus = function (...args) {
    if (focus) lastSession = { start: focus.start };
    const result = originalRender.apply(this, args);
    updateControl();
    return result;
  };

  function savedTimerMatches(f) {
    try {
      const saved = JSON.parse(localStorage.getItem(FOCUS_KEY) || 'null');
      return saved && saved.start === f.start && saved.segStart === f.segStart && saved.segEnd === f.segEnd && saved.end === f.end;
    } catch (_) { return false; }
  }

  button.addEventListener('click', () => {
    // Settle an elapsed segment before freezing it at the current instant.
    renderFocus();
    if (!focus) return;
    const paused = clock.read(focus);
    if (!paused) {
      storeFocus();
      if (!savedTimerMatches(focus) || !clock.pause(focus)) {
        toast(en() ? 'Unable to save a pause. The timer is still running.' : '無法儲存暫停狀態，計時仍在進行。');
        return;
      }
    } else {
      const duration = Math.max(0, Date.now() - paused.at), previous = {};
      for (const key of ['start', 'segStart', 'segEnd', 'end']) {
        previous[key] = focus[key];
        if (Number.isFinite(focus[key])) focus[key] += duration;
      }
      // Publish shifted deadlines before removing the old pause signature.
      storeFocus();
      if (!savedTimerMatches(focus)) {
        Object.assign(focus, previous);
        toast(en() ? 'Unable to save the timer. It is still paused.' : '無法儲存計時狀態，目前仍維持暫停。');
        return;
      }
      clock.clear(paused);
    }
    renderFocus();
  });

  function sameSession(a, b) {
    return a && b && ['id', 'taskId', 'week', 'name', 'mode', 'total'].every(key => a[key] === b[key]);
  }
  window.addEventListener('storage', event => {
    if (event.key !== clock.key && event.key !== FOCUS_KEY) return;
    if (event.key === FOCUS_KEY) {
      try {
        const before = JSON.parse(event.oldValue || 'null'), after = JSON.parse(event.newValue || 'null');
        // Only synchronize a timer already open in this tab; do not import a new session.
        if (!focus || !before || focus.start !== before.start || (after && !sameSession(focus, after))) return;
        focus = after ? normFocus(after) : null;
      } catch (_) { return; }
    }
    remoteRender++;
    try { renderFocus(); } finally { remoteRender--; }
  });
  renderFocus();
})();
