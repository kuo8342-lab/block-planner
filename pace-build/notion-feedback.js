/* UI feedback only. Observes existing public UI state; never wraps persistence,
   sync, AI, scheduling, or promises and never announces invented success. */
(() => {
  const $ = id => document.getElementById(id);
  const pressTargets = 'button, summary, a.btn, [role="button"]';
  const pressed = new Map();
  const pressable = target => {
    const el = target?.closest?.(pressTargets);
    if (!el || el.disabled || el.getAttribute('aria-disabled') === 'true' ||
      el.closest('[data-drag], .blk, .rz')) return null;
    return el;
  };
  const release = id => {
    const el = pressed.get(id);
    if (el) el.classList.remove('pace-pressed');
    pressed.delete(id);
  };
  const releaseAll = () => { [...pressed.keys()].forEach(release); };
  document.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    const el = pressable(e.target);
    if (el) { pressed.set(e.pointerId, el); el.classList.add('pace-pressed'); }
  }, { passive: true });
  document.addEventListener('pointerup', e => release(e.pointerId), { passive: true });
  document.addEventListener('pointercancel', e => release(e.pointerId), { passive: true });
  document.addEventListener('lostpointercapture', e => release(e.pointerId), { passive: true });
  document.addEventListener('keydown', e => {
    if (e.repeat || !['Enter', ' '].includes(e.key)) return;
    const el = pressable(e.target);
    if (el) { pressed.set('keyboard', el); el.classList.add('pace-pressed'); }
  });
  document.addEventListener('keyup', e => { if (['Enter', ' '].includes(e.key)) release('keyboard'); });
  document.addEventListener('focusout', () => release('keyboard'));
  window.addEventListener('blur', releaseAll);
  document.addEventListener('visibilitychange', () => { if (document.hidden) releaseAll(); });

  // Virtual-keyboard dimensions affect sheet layout only; no viewport scroll reset.
  const updateViewport = () => {
    const vv = window.visualViewport;
    // Pinch zoom should magnify the workspace, not relayout it as a keyboard.
    const usable = vv && Math.abs(vv.scale - 1) < .01;
    document.documentElement.style.setProperty('--pace-visual-height', `${Math.round(usable ? vv.height : innerHeight)}px`);
    const inset = usable ? Math.max(0, innerHeight - vv.height - vv.offsetTop) : 0;
    document.documentElement.style.setProperty('--pace-keyboard-inset', `${Math.round(inset)}px`);
  };
  updateViewport();
  window.addEventListener('resize', updateViewport, { passive: true });
  window.visualViewport?.addEventListener('resize', updateViewport, { passive: true });
  window.visualViewport?.addEventListener('scroll', updateViewport, { passive: true });

  const pendingButtons = new WeakMap();
  function pending(button, on, ownsDisabled = true, spinner = true) {
    if (!button) return;
    if (on) {
      if (!pendingButtons.has(button)) pendingButtons.set(button, {
        disabled: button.disabled,
        busy: button.getAttribute('aria-busy'),
        ownsDisabled
      });
      if (ownsDisabled && !button.disabled) button.disabled = true;
      if (spinner) {
        button.setAttribute('aria-busy', 'true');
        button.dataset.pacePending = 'true';
      }
    } else {
      const old = pendingButtons.get(button);
      if (!old) return;
      if (old.ownsDisabled) button.disabled = old.disabled;
      if (old.busy === null) button.removeAttribute('aria-busy');
      else button.setAttribute('aria-busy', old.busy);
      delete button.dataset.pacePending;
      pendingButtons.delete(button);
    }
  }
  const translated = text => window.paceTr?.(text) || text;
  function messageWatcher(id, buttonSelector, pendingTexts) {
    const node = $(id);
    if (!node) return;
    node.setAttribute('aria-live', 'polite');
    const running = new Set(pendingTexts.flatMap(t => [t, translated(t)]));
    let lastButton = null;
    const lockedButtons = new Set();
    document.addEventListener('click', e => {
      const b = e.target.closest?.(buttonSelector);
      if (b && !b.disabled) lastButton = b;
    }, true);
    const reflect = () => {
      const text = node.textContent.trim();
      const processing = running.has(text);
      if (processing && lastButton) {
        document.querySelectorAll(buttonSelector).forEach(button => {
          lockedButtons.add(button);
          pending(button, true, true, button === lastButton);
        });
      } else if (!processing) {
        lockedButtons.forEach(button => pending(button, false));
        lockedButtons.clear();
        lastButton = null;
      }
      node.setAttribute('aria-busy', String(processing));
      const error = /失敗|無法|沒有權限|格式不對|連不上|找不到|過期|failed|failure|unable|invalid|not found|permission.denied|expired/i.test(text);
      const next = processing ? 'pending' : error ? 'error' : '';
      if (next) node.dataset.paceFeedback = next;
      else delete node.dataset.paceFeedback;
    };
    new MutationObserver(reflect).observe(node, { subtree: true, childList: true, characterData: true });
    reflect();
  }
  messageWatcher('syncMsg', '#syncGoogle, #syncIn, #syncUp, #syncReset, #syncOutBtn, #syncWipe', ['處理中…']);
  messageWatcher('grpMsg', '#grpNew, #grpJoin, [data-ginvite], [data-gleave]', ['處理中…']);
  messageWatcher('privacyMsg', '#exportAll, #wipeAll, #importAll, #shareBackup', ['整理資料中…', '刪除中…']);

  // The goal splitter already disables its button through try/finally.
  const goalAi = $('goalAiBtn');
  if (goalAi) {
    const reflectGoal = () => pending(goalAi, goalAi.disabled, false);
    new MutationObserver(reflectGoal).observe(goalAi, { attributes: true, attributeFilter: ['disabled'] });
    reflectGoal();
  }
  // Existing stop visibility spans the complete streamed response, not only its first token.
  const coachStop = $('coachStop');
  if (coachStop) {
    let coachButton = null;
    document.addEventListener('click', e => {
      const b = e.target.closest?.('#coachChips [data-q]');
      if (b && !b.disabled) { pending(coachButton, false); coachButton = b; }
    }, true);
    $('coachForm')?.addEventListener('submit', () => { pending(coachButton, false); coachButton = null; }, true);
    const reflectCoach = () => {
      const active = !coachStop.hidden;
      const form = $('coachForm');
      form?.setAttribute('aria-busy', String(active));
      pending(form?.querySelector('button[type="submit"]'), active);
      pending(coachButton, active);
    };
    new MutationObserver(reflectCoach).observe(coachStop, { attributes: true, attributeFilter: ['hidden'] });
    reflectCoach();
  }
  const status = $('status');
  if (status) {
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    const reflectStatus = () => status.setAttribute('aria-busy', String(/^(同步中|連線中|Syncing|Connecting)/i.test(status.textContent.trim())));
    new MutationObserver(reflectStatus).observe(status, { subtree: true, childList: true, characterData: true });
    reflectStatus();
  }
  const toast = $('toast');
  toast?.setAttribute('role', 'status');
  toast?.setAttribute('aria-live', 'polite');
  ['wNext', 'wTasks'].forEach(id => {
    const list = $(id);
    if (!list) return;
    list.tabIndex = 0;
    list.setAttribute('aria-label', list.previousElementSibling?.textContent || id);
  });
  document.querySelectorAll('dialog').forEach(dialog => {
    if (dialog.hasAttribute('aria-labelledby') || dialog.hasAttribute('aria-label')) return;
    const title = dialog.querySelector('.dtitle');
    if (!title) return;
    if (!title.id) title.id = `pace-title-${dialog.id}`;
    dialog.setAttribute('aria-labelledby', title.id);
  });
})();
