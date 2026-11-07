/* 步調 Pace: ambient sounds for focusing (rain, fireplace, stream), synthesized with Web Audio: no files, no data used. Lives in the rewards dialog. */
(() => {
  const host = document.getElementById('xpStreak'); if (!host || typeof playChime === 'undefined') return;
  const KINDS = [['rain', '🌧️', '深夜細雨', 'lowpass', 800], ['fire', '🪵', '溫暖壁爐', 'bandpass', 450], ['stream', '🏞️', '山澗清泉', 'lowpass', 1200]];
  let cur = null;
  host.insertAdjacentHTML('afterend', '<h3 class="set-h">專注環境音</h3><div class="zen-row">' + KINDS.map(k => '<button type="button" class="btn zen-btn" data-zen="' + k[0] + '" aria-pressed="false">' + k[1] + ' ' + k[2] + '</button>').join('') + '</div>');
  const st = document.createElement('style');
  st.textContent = '.zen-row { display: flex; flex-wrap: wrap; gap: 6px; }';
  document.head.appendChild(st);
  const paint = () => document.querySelectorAll('.zen-btn').forEach(b => b.setAttribute('aria-pressed', String(!!cur && cur.kind === b.dataset.zen)));
  function stop() {
    if (!cur) return;
    const { noise, gain, ctx } = cur; cur = null;
    try { gain.gain.cancelScheduledValues(ctx.currentTime); gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime); gain.gain.linearRampToValueAtTime(.0001, ctx.currentTime + .4); setTimeout(() => { try { noise.stop(); } catch (e) {} }, 450); } catch (e) {}
  }
  function start(kind) {
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    const ctx = playChime.ctx || (playChime.ctx = new AC()); if (ctx.state === 'suspended') ctx.resume();
    const k = KINDS.find(x => x[0] === kind), size = ctx.sampleRate * 2, buffer = ctx.createBuffer(1, size, ctx.sampleRate), data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < size; i++) { last = last * .95 + (Math.random() * 2 - 1) * .05; data[i] = kind === 'fire' ? (Math.random() < .003 ? Math.random() * 1.5 - .75 : last * .3) : last * .6; }
    const noise = ctx.createBufferSource(), filter = ctx.createBiquadFilter(), gain = ctx.createGain();
    noise.buffer = buffer; noise.loop = true; filter.type = k[3]; filter.frequency.value = k[4];
    gain.gain.setValueAtTime(.01, ctx.currentTime); gain.gain.linearRampToValueAtTime(.12, ctx.currentTime + 1);
    noise.connect(filter); filter.connect(gain); gain.connect(ctx.destination); noise.start();
    cur = { kind, noise, gain, ctx };
  }
  document.querySelector('.zen-row').addEventListener('click', e => {
    const b = e.target.closest('.zen-btn'); if (!b) return;
    const same = cur && cur.kind === b.dataset.zen; stop();
    try { if (!same) start(b.dataset.zen); } catch (e) {}
    paint();
  });
})();
