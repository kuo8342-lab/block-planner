/* 步調 Pace: ambient sounds for focusing, synthesized with Web Audio: no files, no data used. Lives in the rewards dialog.
   12 sounds. The first three are free; the rest are rewards that open as the level goes up. A volume slider sets how loud. */
(() => {
  const host = document.getElementById('xpStreak'); if (!host || typeof playChime === 'undefined') return;
  const ls = { get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} } };
  // [id, icon, 名稱, level needed]
  const KINDS = [
    ['rain', '🌧️', '深夜細雨', 1], ['fire', '🪵', '溫暖壁爐', 1], ['stream', '🏞️', '山澗清泉', 1],
    ['wind', '🍃', '林間微風', 2], ['waves', '🌊', '海浪拍岸', 3], ['crickets', '🦗', '夏夜蟲鳴', 4],
    ['library', '📚', '圖書館白噪音', 5], ['storm', '⛈️', '遠方雷雨', 6], ['birds', '🐦', '清晨鳥鳴', 7],
    ['train', '🚆', '夜行列車', 8], ['chimes', '🎐', '屋簷風鈴', 9], ['space', '🪐', '深空漫遊', 10]
  ];
  let cur = null, vol = Number(ls.get('pace-zen-vol') ?? .7);
  if (isNaN(vol)) vol = .7;
  vol = Math.min(1, Math.max(0, vol));

  host.insertAdjacentHTML('afterend',
    '<h3 class="set-h">專注環境音</h3>' +
    '<p class="hint" style="margin:0">讀書時的背景聲。前三種一開始就有，其他的升等就會解鎖。</p>' +
    '<label class="zen-vol"><span>音量</span><input type="range" id="zenVol" min="0" max="100" step="5" value="' + Math.round(vol * 100) + '" aria-label="環境音音量"><span id="zenVolNum">' + Math.round(vol * 100) + '%</span></label>' +
    '<label class="check zen-auto"><input type="checkbox" id="zenAuto"> 開始專注時自動播放（播你上次選的那一種，專注結束就停）</label>' +
    '<div class="zen-row">' + KINDS.map(k => '<button type="button" class="btn zen-btn" data-zen="' + k[0] + '" aria-pressed="false"><span class="zen-ico" aria-hidden="true">' + k[1] + '</span><span class="zen-name">' + k[2] + '</span><small class="zen-lock"></small></button>').join('') + '</div>');
  const st = document.createElement('style');
  st.textContent =
    '.zen-row { display: grid; grid-template-columns: repeat(auto-fill, minmax(168px, 1fr)); gap: 6px; }' +
    '.zen-btn { display: flex; align-items: center; gap: 6px; justify-content: flex-start; text-align: left; position: relative; min-height: 40px; }' +
    '.zen-btn .zen-name { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }' +
    '.zen-btn .zen-lock { font-size: .7rem; color: var(--muted); white-space: nowrap; } .zen-btn .zen-lock:empty { display: none; }' +
    '.zen-btn[aria-pressed="true"] { border-color: var(--accent); background: var(--accent-soft); font-weight: 600; }' +
    '.zen-btn[aria-pressed="true"] .zen-ico { animation: zen-pulse 1.6s ease-in-out infinite alternate; display: inline-block; } @keyframes zen-pulse { to { transform: scale(1.2); } }' +
    '.zen-btn.locked { opacity: .55; } .zen-btn.locked .zen-ico { filter: grayscale(1); }' +
    '.zen-auto { flex-direction: row !important; gap: 6px; font-size: .82rem; align-items: center; margin: 0; } .zen-vol span { white-space: nowrap; } .zen-vol { display: flex; flex-direction: row !important; align-items: center; gap: 8px; font-size: .82rem; color: var(--muted); } .zen-vol input { flex: 1 1 auto; min-width: 0; max-width: 260px; accent-color: var(--accent); }' +
    '@media (prefers-reduced-motion: reduce) { .zen-btn .zen-ico { animation: none !important; } } body.nofx .zen-btn .zen-ico { animation: none !important; }';
  document.head.appendChild(st);

  const level = () => { const m = /(\d+)/.exec(document.getElementById('xpLevel')?.textContent || ''); return m ? Number(m[1]) : 1; };
  function paint() {
    const lv = level();
    document.querySelectorAll('.zen-btn').forEach(b => {
      const k = KINDS.find(x => x[0] === b.dataset.zen), locked = lv < k[3];
      b.classList.toggle('locked', locked); b.setAttribute('aria-disabled', String(locked));
      b.querySelector('.zen-lock').textContent = locked ? '🔒 Lv ' + k[3] : '';
      b.title = locked ? '升到 Lv ' + k[3] + ' 解鎖「' + k[2] + '」' : k[2];
      b.setAttribute('aria-pressed', String(!!cur && cur.kind === b.dataset.zen));
    });
  }

  /* ---------- sound building blocks ---------- */
  const buffers = {};
  function noiseBuffer(ctx, color) {
    if (buffers[color]) return buffers[color];
    const n = ctx.sampleRate * 4, buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, last = 0;
    for (let i = 0; i < n; i++) {
      const w = Math.random() * 2 - 1;
      if (color === 'white') d[i] = w * .5;
      else if (color === 'pink') { b0 = .99765 * b0 + w * .099046; b1 = .963 * b1 + w * .2965164; b2 = .57 * b2 + w * 1.0526913; d[i] = (b0 + b1 + b2 + w * .1848) * .16; }
      else { last = (last + .02 * w) / 1.02; d[i] = last * 3.2; }
    }
    return (buffers[color] = buf);
  }
  // everything a sound starts is kept so it can be stopped: nodes with .stop(), and timers
  function kit(ctx, out) {
    const nodes = [], timers = []; let alive = true;
    const K = {
      noise(color, type, freq, gain, q) {
        const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
        src.buffer = noiseBuffer(ctx, color); src.loop = true;
        f.type = type; f.frequency.value = freq; if (q) f.Q.value = q; g.gain.value = gain;
        src.connect(f); f.connect(g); g.connect(out); src.start(0, Math.random() * 3); nodes.push(src);
        return { f, g };
      },
      drone(freq, gain) { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = freq; g.gain.value = gain; o.connect(g); g.connect(out); o.start(); nodes.push(o); return { o, g }; },
      lfo(param, hz, depth) { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = hz; g.gain.value = depth; o.connect(g); g.connect(param); o.start(); nodes.push(o); },
      tone(freq, t0, dur, gain, type = 'sine', toFreq) {
        const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.setValueAtTime(freq, t0);
        if (toFreq) o.frequency.exponentialRampToValueAtTime(toFreq, t0 + dur);
        g.gain.setValueAtTime(.0001, t0); g.gain.exponentialRampToValueAtTime(gain, t0 + Math.min(.02, dur / 4)); g.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
        o.connect(g); g.connect(out); o.start(t0); o.stop(t0 + dur + .05);
      },
      burst(color, type, freq, t0, dur, gain, q) {
        const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
        src.buffer = noiseBuffer(ctx, color); f.type = type; f.frequency.value = freq; if (q) f.Q.value = q;
        g.gain.setValueAtTime(.0001, t0); g.gain.exponentialRampToValueAtTime(gain, t0 + Math.min(.03, dur / 3)); g.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
        src.connect(f); f.connect(g); g.connect(out); src.start(t0, Math.random() * 3); src.stop(t0 + dur + .05);
      },
      // call fn again and again, a random time apart (seconds)
      every(min, max, fn) { const go = () => { if (!alive) return; try { fn(ctx.currentTime + .05); } catch (e) {} timers.push(setTimeout(go, (min + Math.random() * (max - min)) * 1000)); }; timers.push(setTimeout(go, Math.random() * max * 500)); },
      stop() { alive = false; timers.forEach(clearTimeout); nodes.forEach(n => { try { n.stop(); } catch (e) {} }); }
    };
    return K;
  }
  const rnd = (a, b) => a + Math.random() * (b - a);
  const RECIPES = {
    rain(K) {
      K.noise('pink', 'highpass', 500, .55); K.noise('white', 'bandpass', 5200, .09, .6); K.noise('brown', 'lowpass', 320, .35);
      K.every(.05, .28, t => K.tone(rnd(1800, 4200), t, .05, rnd(.01, .035)));
    },
    fire(K) {
      const a = K.noise('brown', 'lowpass', 300, .42); K.lfo(a.g.gain, .5, .14); K.lfo(a.g.gain, 2.3, .07);     // the flame itself, fluttering
      K.noise('pink', 'bandpass', 1200, .05, .8);
      // dry wood crackling: little runs of sharp snaps
      K.every(.08, .5, t => { const n = 1 + Math.floor(Math.random() * 5); for (let i = 0; i < n; i++) K.burst('white', 'highpass', rnd(2500, 7000), t + i * rnd(.012, .05), rnd(.004, .014), rnd(.25, .7)); });
      // a log popping: a short woody knock with a snap on top
      K.every(.8, 3.2, t => { const f = rnd(140, 320); K.tone(f, t, rnd(.04, .09), rnd(.22, .45), 'triangle', f * .5); K.burst('white', 'bandpass', rnd(900, 2200), t, .025, .5, 1.2); });
      // now and then a log settles and the embers hiss
      K.every(6, 16, t => { K.burst('brown', 'lowpass', 400, t, .35, .6); K.tone(rnd(90, 130), t, .18, .3, 'triangle', 60); K.burst('white', 'highpass', 5000, t + .05, .9, .05); });
    },
    stream(K) {
      const a = K.noise('white', 'bandpass', 1900, .22, .8); K.lfo(a.f.frequency, .23, 500); K.noise('pink', 'lowpass', 900, .32);
      K.every(.06, .3, t => { const f = rnd(420, 1100); K.tone(f, t, rnd(.05, .11), rnd(.02, .05), 'sine', f * rnd(1.25, 1.7)); });
    },
    wind(K) {
      const a = K.noise('pink', 'bandpass', 520, .75, 1.1); K.lfo(a.f.frequency, .09, 260); K.lfo(a.g.gain, .13, .35);
      const b = K.noise('pink', 'bandpass', 1500, .16, 2); K.lfo(b.f.frequency, .06, 600); K.lfo(b.g.gain, .17, .1);
      K.every(.4, 1.6, t => K.burst('white', 'highpass', 4500, t, rnd(.2, .6), rnd(.008, .025)));   // leaves
    },
    waves(K) {
      const a = K.noise('pink', 'lowpass', 1100, .5); K.lfo(a.g.gain, .1, .42); K.lfo(a.f.frequency, .1, 550);
      const b = K.noise('brown', 'lowpass', 200, .55); K.lfo(b.g.gain, .1, .3);
      const c = K.noise('white', 'highpass', 3500, .05); K.lfo(c.g.gain, .1, .045);
    },
    crickets(K) {
      K.noise('pink', 'lowpass', 1400, .1);
      for (const [f, gap] of [[4300, .55], [4750, .8], [3900, 1.3]]) K.every(gap, gap * 1.7, t => { for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) K.tone(f + rnd(-40, 40), t + i * .11 + j * .028, .02, rnd(.02, .05)); });
      K.every(4, 11, t => K.tone(rnd(700, 950), t, .5, .02, 'sine', 620));   // a far hoot
    },
    library(K) {
      K.noise('pink', 'lowpass', 2600, .5); K.noise('brown', 'lowpass', 180, .3);
      K.every(5, 14, t => K.burst('white', 'bandpass', rnd(2500, 4000), t, .35, .03, 1.5));      // a page turning
      K.every(9, 22, t => K.burst('brown', 'lowpass', 500, t, .06, .12));                        // a chair, a book put down
    },
    storm(K) {
      K.noise('pink', 'highpass', 450, .5); K.noise('brown', 'lowpass', 300, .4);
      K.every(.05, .25, t => K.tone(rnd(1800, 4000), t, .05, rnd(.01, .03)));
      K.every(7, 18, t => { K.burst('brown', 'lowpass', rnd(90, 160), t, rnd(2.5, 4.5), rnd(.7, 1.1)); K.burst('brown', 'lowpass', 240, t + .15, 1.2, .35); });
    },
    birds(K) {
      const a = K.noise('pink', 'bandpass', 700, .14, .8); K.lfo(a.g.gain, .1, .06);
      K.every(.6, 2.6, t => {
        const base = rnd(2200, 4600), n = 2 + Math.floor(Math.random() * 4), up = Math.random() < .5;
        for (let i = 0; i < n; i++) { const f = base * rnd(.92, 1.1); K.tone(f, t + i * rnd(.09, .16), rnd(.05, .11), rnd(.025, .06), 'sine', up ? f * 1.35 : f * .75); }
      });
      K.every(5, 12, t => { for (let i = 0; i < 2; i++) K.tone(820, t + i * .42, .3, .035, 'sine', 640); });   // a dove
    },
    train(K) {
      const a = K.noise('brown', 'lowpass', 240, .9); K.lfo(a.g.gain, .5, .12); K.noise('pink', 'bandpass', 1300, .06, 1);
      K.every(1.24, 1.24, t => { for (const dt of [0, .16, .62, .78]) K.burst('brown', 'bandpass', 620, t + dt, .07, .5, 1.6); });
      K.every(25, 55, t => { for (const f of [330, 415]) K.tone(f, t, 1.6, .035, 'triangle'); });
    },
    chimes(K) {
      const a = K.noise('pink', 'bandpass', 600, .12, 1); K.lfo(a.g.gain, .08, .07);
      const scale = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.5];
      K.every(.5, 3.2, t => { const n = 1 + Math.floor(Math.random() * 3); for (let i = 0; i < n; i++) { const f = scale[Math.floor(Math.random() * scale.length)]; K.tone(f, t + i * rnd(.08, .3), rnd(1.6, 3), rnd(.04, .09)); K.tone(f * 2.76, t + i * .1, .5, .012); } });
    },
    space(K) {
      for (const [f, g] of [[55, .22], [82.4, .14], [110.3, .1], [164.8, .05]]) { const d = K.drone(f, g); K.lfo(d.g.gain, rnd(.04, .11), g * .6); K.lfo(d.o.frequency, rnd(.02, .05), f * .004); }
      const a = K.noise('pink', 'bandpass', 900, .07, 3); K.lfo(a.f.frequency, .04, 500);
      K.every(3, 9, t => { const f = [440, 554.4, 659.3, 880][Math.floor(Math.random() * 4)]; K.tone(f, t, rnd(2.5, 4.5), .02); });
    }
  };

  function stop() {
    if (!cur) return;
    const { gain, comp, ctx, k } = cur; cur = null;
    try { gain.gain.cancelScheduledValues(ctx.currentTime); gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime); gain.gain.linearRampToValueAtTime(.0001, ctx.currentTime + .4); } catch (e) {}
    setTimeout(() => { try { k.stop(); gain.disconnect(); comp.disconnect(); } catch (e) {} }, 500);
  }
  const loud = v => v * v * 2.2;   // the slider feels even; at the default 70% this is several times louder than the old fixed level
  function start(kind) {
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    const ctx = playChime.ctx || (playChime.ctx = new AC()); if (ctx.state === 'suspended') ctx.resume();
    const gain = ctx.createGain(), comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 4; comp.attack.value = .01; comp.release.value = .25;
    gain.gain.setValueAtTime(.0001, ctx.currentTime); gain.gain.linearRampToValueAtTime(Math.max(.0001, loud(vol)), ctx.currentTime + 1.2);
    gain.connect(comp); comp.connect(ctx.destination);
    const k = kit(ctx, gain);
    RECIPES[kind](k);
    cur = { kind, gain, comp, ctx, k };
  }
  document.querySelector('.zen-row').addEventListener('click', e => {
    const b = e.target.closest('.zen-btn'); if (!b) return;
    if (b.classList.contains('locked')) { const k = KINDS.find(x => x[0] === b.dataset.zen); if (typeof toast === 'function') toast('升到 Lv ' + k[3] + ' 就能解鎖「' + k[2] + '」'); return; }
    const same = cur && cur.kind === b.dataset.zen; stop(); autoOn = false;
    try { if (!same) { start(b.dataset.zen); ls.set('pace-zen-last', b.dataset.zen); if (ls.get('pace-zen-auto') === null) { ls.set('pace-zen-auto', '1'); autoBox.checked = true; } } } catch (err) {}
    paint();
  });
  document.getElementById('zenVol').addEventListener('input', e => {
    vol = Number(e.target.value) / 100; ls.set('pace-zen-vol', String(vol));
    document.getElementById('zenVolNum').textContent = Math.round(vol * 100) + '%';
    if (cur) { try { cur.gain.gain.cancelScheduledValues(cur.ctx.currentTime); cur.gain.gain.setTargetAtTime(Math.max(.0001, loud(vol)), cur.ctx.currentTime, .05); } catch (err) {} }
  });
  /* With the focus timer: starting to focus plays the sound you used last, and it stops when the focus ends.
     It is on once you have played a sound yourself, so nobody gets a surprise in a quiet room; the tick box turns it off. */
  const autoBox = document.getElementById('zenAuto');
  let autoOn = false, autoTimer = 0;
  const wantAuto = () => ls.get('pace-zen-auto') === '1';
  autoBox.checked = wantAuto();
  autoBox.addEventListener('change', () => { ls.set('pace-zen-auto', autoBox.checked ? '1' : '0'); if (!autoBox.checked && autoOn) { autoOn = false; stop(); paint(); } });
  const focusing = () => { try { return typeof focus !== 'undefined' && !!focus; } catch (e) { return false; } };
  function autoStart() {
    if (!wantAuto() || cur || !focusing()) return;
    let kind = ls.get('pace-zen-last'); const k = KINDS.find(x => x[0] === kind);
    if (!k || level() < k[3]) kind = 'rain';
    try { start(kind); autoOn = true; paint(); } catch (e) {}
    clearInterval(autoTimer);
    autoTimer = setInterval(() => { if (!focusing()) { clearInterval(autoTimer); if (autoOn) { autoOn = false; stop(); paint(); } } }, 1000);
  }
  if (typeof startFocus === 'function') {
    const sf0 = startFocus;
    window.startFocus = startFocus = function () { const r = sf0.apply(this, arguments); try { autoStart(); } catch (e) {} return r; };
  }
  const lvEl = document.getElementById('xpLevel');
  if (lvEl) new MutationObserver(paint).observe(lvEl, { childList: true, characterData: true, subtree: true });
  paint();
  window.paceZen = { auto: () => autoOn, kinds: () => KINDS.map(k => ({ id: k[0], name: k[2], level: k[3] })), playing: () => cur?.kind || null, stop: () => { stop(); paint(); } };
})();
