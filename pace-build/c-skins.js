/* 步調 Pace: six more themes (skins) — 夕陽, 森林, 薰衣草, 極光, 雪地, 咖啡. They join the skins A already has:
   same picker, same saved choice (localStorage + the synced config), same on/off switch for the moving background.
   A draws its own six backgrounds inside drawBg()/seedParticles(); these two are wrapped here so a new skin draws
   its own scene and every other skin falls through to A's code untouched. Injected by build-c.js after the notion UI. */
(() => {
  if (typeof SKINS === 'undefined' || typeof fx === 'undefined' || typeof applySkin !== 'function') return;

  const NEW = [
    { id: 'sunset', name: '夕陽', note: '暖橘到粉紫的天空、光點慢慢飄起', sw: ['#fff3e8', '#fffaf5', '#e0603a', '#ffd0c0', '#e9c8e8'] },
    { id: 'forest', name: '森林', note: '深綠夜晚、螢火蟲一閃一閃', sw: ['#0b1511', '#173326', '#7fd18b', '#e8d96a', '#2a4a35'] },
    { id: 'lavender', name: '薰衣草', note: '淡紫色、閃爍的小星光', sw: ['#f6f2fd', '#fffdff', '#8a63d2', '#e9dcff', '#d9c7f5'] },
    { id: 'aurora', name: '極光', note: '深藍夜空、綠紫色的光帶飄動', sw: ['#050d16', '#0f2a35', '#5eead4', '#a78bfa', '#34d399'] },
    { id: 'snow', name: '雪地', note: '冰藍白色、雪花飄落', sw: ['#f1f6fb', '#ffffff', '#3b82c4', '#dcebf8', '#cfdde9'] },
    { id: 'coffee', name: '咖啡', note: '奶泡米色、咖啡棕、熱氣緩緩上升', sw: ['#f6efe6', '#fffaf3', '#9a6a3f', '#e4c9a8', '#c9a47a'] }
  ];
  SKINS.push(...NEW);

  /* ---------- colours: the same block colours the other light / dark skins use ---------- */
  const LIGHT_CATS = '--c-school: #dfe5ec; --c-school-fg: #4a5868; --c-study: #cfe1fb; --c-study-fg: #19447d; --c-study-dot: #3a78d6;' +
    '--c-preview: #ccefe6; --c-preview-fg: #12594c; --c-preview-dot: #1f9e84; --c-code: #e4dcfb; --c-code-fg: #47308f; --c-code-dot: #7656d6;' +
    '--c-lang: #fde2cc; --c-lang-fg: #87410f; --c-lang-dot: #e0782d; --c-exam: #fddcd8; --c-exam-fg: #8f1f17; --c-exam-dot: #d9493c;' +
    '--c-class: #efe1d3; --c-class-fg: #694629; --c-class-dot: #a8733f; --c-swim: #cdeaf7; --c-swim-fg: #10597a; --c-swim-dot: #2a9ccc;' +
    '--c-rest: #d7f0d2; --c-rest-fg: #285f22; --c-rest-dot: #4aa83c; --c-buffer: #fbefbd; --c-buffer-fg: #6f5a08; --c-buffer-dot: #d4ad1c;' +
    '--c-care: #f9d9e5; --c-care-fg: #872c51; --c-care-dot: #d4598a; --c-life: #e8ebef; --c-life-fg: #5c6878; --c-life-dot: #94a0ae;' +
    '--danger: #c2372c; color-scheme: light;';
  const DARK_CATS = '--c-school: #252e39; --c-school-fg: #b6c1cd; --c-study: #1b3456; --c-study-fg: #bcd6f8; --c-study-dot: #6ea3ee;' +
    '--c-preview: #153e37; --c-preview-fg: #a3e4d5; --c-preview-dot: #46c3a6; --c-code: #2e2650; --c-code-fg: #d4c8fb; --c-code-dot: #a28af0;' +
    '--c-lang: #4a2d17; --c-lang-fg: #f7cba5; --c-lang-dot: #f09a55; --c-exam: #4d1e1a; --c-exam-fg: #f7bbb3; --c-exam-dot: #f07a6c;' +
    '--c-class: #3a2f25; --c-class-fg: #e5cdb5; --c-class-dot: #c99a69; --c-swim: #153a4d; --c-swim-fg: #aadcf3; --c-swim-dot: #57bde6;' +
    '--c-rest: #1d3a1b; --c-rest-fg: #b9e4b0; --c-rest-dot: #74c866; --c-buffer: #3d3512; --c-buffer-fg: #f1dd8d; --c-buffer-dot: #e2c24a;' +
    '--c-care: #48212f; --c-care-fg: #f5bfd3; --c-care-dot: #e888ad; --c-life: #222a33; --c-life-fg: #98a5b4; --c-life-dot: #6f7c8b;' +
    'color-scheme: dark;';
  const sk = id => 'body[data-skin="' + id + '"]';
  const light = (id, v, bg) => sk(id) + ' { ' + LIGHT_CATS + ' ' + v + ' background-image: ' + bg + '; background-attachment: fixed; }\n' +
    sk(id) + ' .card, ' + sk(id) + ' .grid-scroll, ' + sk(id) + ' .kpi, ' + sk(id) + ' .rp-card { border-radius: 14px; }\n';
  const dark = (id, v, bg) => sk(id) + ' { ' + DARK_CATS + ' ' + v + ' background-image: ' + bg + '; background-attachment: fixed; }\n' +
    ['.card', '.grid-scroll', '.kpi', '.rp-card', '.warnbar', '.head'].map(c => sk(id) + ' ' + c).join(', ') + ' { backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }\n';
  const style = document.createElement('style');
  style.setAttribute('data-pace-skins', '');
  style.textContent =
    light('sunset', '--bg: #fff3e8; --panel: #fffaf5; --panel-2: #ffeede; --fg: #3a2418; --muted: #7f5f4c; --line: #f2d6c0; --line-soft: #f9e8d9;' +
      '--accent: #b1411f; --accent-ink: #b1411f; --accent-on: #ffffff; --accent-soft: #ffe1d1; --shadow: 0 2px 4px rgba(224, 96, 58, .06), 0 10px 26px rgba(224, 96, 58, .1);' +
      '--note: #ffe2c9; --note-fg: #4a2a18; --note-line: rgba(224, 96, 58, .14); --note-tape: rgba(255, 255, 255, .65);',
      'linear-gradient(180deg, #ffe6d3 0%, #ffd3c4 50%, #ecc9e6 100%)') +
    dark('forest', '--bg: #0b1511; --panel: rgba(18, 32, 26, .84); --panel-2: rgba(28, 48, 38, .78); --fg: #e4f1e6; --muted: #95b09c; --line: rgba(140, 200, 150, .2); --line-soft: rgba(140, 200, 150, .09);' +
      '--accent: #7fd18b; --accent-ink: #7fd18b; --accent-on: #0b1511; --accent-soft: rgba(127, 209, 139, .16); --danger: #ff9a8a; --shadow: 0 10px 34px rgba(0, 0, 0, .45);' +
      '--note: #1d3326; --note-fg: #e4f1e6; --note-line: rgba(127, 209, 139, .14); --note-tape: rgba(127, 209, 139, .25);',
      'radial-gradient(ellipse at 15% 0%, #173326 0%, transparent 60%), radial-gradient(ellipse at 90% 100%, #10281f 0%, transparent 55%)') +
    light('lavender', '--bg: #f6f2fd; --panel: #fffdff; --panel-2: #f1ebfb; --fg: #2e2542; --muted: #695f82; --line: #e2d8f3; --line-soft: #eee7f9;' +
      '--accent: #6a44b0; --accent-ink: #6a44b0; --accent-on: #ffffff; --accent-soft: #eadffa; --shadow: 0 2px 4px rgba(138, 99, 210, .06), 0 10px 26px rgba(138, 99, 210, .1);' +
      '--note: #e9dcff; --note-fg: #2e2542; --note-line: rgba(138, 99, 210, .14); --note-tape: rgba(255, 255, 255, .7);',
      'radial-gradient(circle at 85% 10%, #e9dcff 0%, transparent 42%), radial-gradient(circle at 5% 90%, #f3e8ff 0%, transparent 45%)') +
    dark('aurora', '--bg: #050d16; --panel: rgba(12, 24, 38, .8); --panel-2: rgba(20, 38, 58, .74); --fg: #e6f6f2; --muted: #8fb4b4; --line: rgba(110, 230, 200, .2); --line-soft: rgba(110, 230, 200, .08);' +
      '--accent: #5eead4; --accent-ink: #5eead4; --accent-on: #050d16; --accent-soft: rgba(94, 234, 212, .16); --danger: #ff9aa8; --shadow: 0 10px 34px rgba(0, 0, 0, .45);' +
      '--note: #0f2a35; --note-fg: #e6f6f2; --note-line: rgba(94, 234, 212, .14); --note-tape: rgba(167, 139, 250, .3);',
      'linear-gradient(180deg, #07182a 0%, #050d16 70%)') +
    light('snow', '--bg: #f1f6fb; --panel: #ffffff; --panel-2: #eaf1f8; --fg: #1d2b3a; --muted: #546677; --line: #d6e2ee; --line-soft: #e6eef6;' +
      '--accent: #276aa8; --accent-ink: #276aa8; --accent-on: #ffffff; --accent-soft: #dcebf8; --shadow: 0 2px 4px rgba(59, 130, 196, .06), 0 10px 26px rgba(59, 130, 196, .1);' +
      '--note: #e3eef8; --note-fg: #1d2b3a; --note-line: rgba(59, 130, 196, .14); --note-tape: rgba(255, 255, 255, .75);',
      'linear-gradient(180deg, #f9fcff 0%, #e6f0f9 100%)') +
    light('coffee', '--bg: #f6efe6; --panel: #fffaf3; --panel-2: #f1e6d8; --fg: #3b2a1f; --muted: #705d4e; --line: #e4d5c3; --line-soft: #efe4d6;' +
      '--accent: #7b5230; --accent-ink: #7b5230; --accent-on: #ffffff; --accent-soft: #f0e0cd; --shadow: 0 2px 4px rgba(154, 106, 63, .06), 0 10px 26px rgba(154, 106, 63, .1);' +
      '--note: #f0dcc0; --note-fg: #3b2a1f; --note-line: rgba(154, 106, 63, .16); --note-tape: rgba(255, 255, 255, .6);',
      'linear-gradient(180deg, #f9f2e9 0%, #efe3d3 100%)');
  // dialogs sit on a solid colour: see-through panels let the page show through the chat and the plan
  style.textContent += [['forest', '#12201a'], ['aurora', '#0c1826'], ['night', '#141c3a'], ['neon', '#0e0e1a']].map(([id, c]) => sk(id) + ' dialog { background: ' + c + '; backdrop-filter: none; -webkit-backdrop-filter: none; }\n').join('');
  document.head.appendChild(style);

  /* ---------- moving backgrounds ---------- */
  const r = (a, b) => a + Math.random() * (b - a);
  const MAKE = {
    sunset: (W, H, a) => Array.from({ length: Math.round(16 * a) + 8 }, () => ({ x: r(0, W), y: r(0, H), r: r(14, 46), vy: r(.12, .35), p: r(0, 6.28) })),
    forest: (W, H, a) => Array.from({ length: Math.round(26 * a) + 12 }, () => ({ x: r(0, W), y: r(0, H), vx: r(-.2, .2), vy: r(-.2, .2), p: r(0, 6.28), s: r(.6, 1.6) })),
    lavender: (W, H, a) => Array.from({ length: Math.round(30 * a) + 14 }, () => ({ x: r(0, W), y: r(0, H), vx: r(.05, .2), vy: r(-.25, -.05), p: r(0, 6.28), s: r(3, 8) })),
    aurora: (W, H, a) => Array.from({ length: Math.round(90 * a) + 30 }, () => ({ x: r(0, W), y: r(0, H * .8), r: r(.4, 1.4), p: r(0, 6.28), s: r(.6, 2) })),
    snow: (W, H, a) => Array.from({ length: Math.round(46 * a) + 22 }, () => ({ x: r(0, W), y: r(-H, H), vx: r(-.2, .25), vy: r(.5, 1.3), r: r(1.6, 4.2), p: r(0, 6.28) })),
    coffee: (W, H, a) => Array.from({ length: Math.round(9 * a) + 5 }, () => ({ x: r(0, W), y: r(H * .4, H + 120), vy: r(.25, .55), p: r(0, 6.28), len: r(70, 130) }))
  };
  const DRAW = {
    sunset(ctx, W, H, t) {
      const R = Math.max(W, H) * .65, g = ctx.createRadialGradient(W * .82, H * 1.02, 0, W * .82, H * 1.02, R);
      g.addColorStop(0, 'rgba(255, 170, 90, .38)'); g.addColorStop(1, 'rgba(255, 170, 90, 0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      for (const o of fx.parts) {
        o.y -= o.vy; o.x += Math.sin(t * .01 + o.p) * .25; if (o.y < -o.r) { o.y = H + o.r; o.x = r(0, W); }
        const q = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r); q.addColorStop(0, 'rgba(255, 196, 128, .3)'); q.addColorStop(1, 'rgba(255, 196, 128, 0)');
        ctx.fillStyle = q; ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, 6.283); ctx.fill();
      }
    },
    forest(ctx, W, H, t) {
      const m = ctx.createLinearGradient(0, H * .7, 0, H); m.addColorStop(0, 'rgba(127, 209, 139, 0)'); m.addColorStop(1, 'rgba(127, 209, 139, .09)');
      ctx.fillStyle = m; ctx.fillRect(0, H * .7, W, H * .3);
      for (const f of fx.parts) {
        f.vx = Math.max(-.5, Math.min(.5, f.vx + r(-.02, .02))); f.vy = Math.max(-.4, Math.min(.4, f.vy + r(-.02, .02)));
        f.x += f.vx; f.y += f.vy; if (f.x < -10) f.x = W + 10; if (f.x > W + 10) f.x = -10; if (f.y < -10) f.y = H + 10; if (f.y > H + 10) f.y = -10;
        const a = Math.max(0, Math.sin(t * .03 * f.s + f.p)) ** 2;
        if (a < .02) continue;
        const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, 11); g.addColorStop(0, 'rgba(214, 255, 130, ' + (a * .9) + ')'); g.addColorStop(1, 'rgba(214, 255, 130, 0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(f.x, f.y, 11, 0, 6.283); ctx.fill();
      }
    },
    lavender(ctx, W, H, t) {
      for (const s of fx.parts) {
        s.x += s.vx; s.y += s.vy; if (s.y < -10) { s.y = H + 10; s.x = r(0, W); } if (s.x > W + 10) s.x = -10;
        const a = .15 + .6 * Math.abs(Math.sin(t * .02 + s.p));
        ctx.globalAlpha = a; ctx.strokeStyle = '#a98be0'; ctx.fillStyle = '#c9b3f2'; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(s.x - s.s, s.y); ctx.lineTo(s.x + s.s, s.y); ctx.moveTo(s.x, s.y - s.s); ctx.lineTo(s.x, s.y + s.s); ctx.stroke();
        ctx.beginPath(); ctx.arc(s.x, s.y, s.s * .28, 0, 6.283); ctx.fill();
      }
    },
    aurora(ctx, W, H, t) {
      for (const s of fx.parts) { ctx.globalAlpha = .3 + .7 * Math.abs(Math.sin(t * .015 * s.s + s.p)); ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.283); ctx.fill(); }
      const bands = [[52, 211, 153, .12, .0042, .006], [94, 234, 212, .2, .0031, .0045], [167, 139, 250, .28, .0052, .0035]];
      bands.forEach(([cr, cg, cb, base, k, sp], i) => {
        const y0 = H * (base + .02), th = H * .22, top = y0 - th * .5;
        const g = ctx.createLinearGradient(0, top, 0, top + th * 1.4);
        g.addColorStop(0, 'rgba(' + cr + ',' + cg + ',' + cb + ',0)'); g.addColorStop(.35, 'rgba(' + cr + ',' + cg + ',' + cb + ',.26)'); g.addColorStop(1, 'rgba(' + cr + ',' + cg + ',' + cb + ',0)');
        ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.beginPath();
        for (let x = 0; x <= W; x += 14) { const y = top + Math.sin(x * k + t * sp * 6 + i * 1.7) * 30 + Math.sin(x * k * 2.3 - t * sp * 4) * 12; x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
        for (let x = W; x >= 0; x -= 14) ctx.lineTo(x, top + th * 1.4 + Math.sin(x * k * 1.4 + t * sp * 5 + i) * 26);
        ctx.closePath(); ctx.fill();
      });
    },
    snow(ctx, W, H, t) {
      for (const f of fx.parts) {
        f.x += f.vx + Math.sin(t * .01 + f.p) * .3; f.y += f.vy; if (f.y > H + 6) { f.y = -6; f.x = r(0, W); } if (f.x > W + 6) f.x = -6; if (f.x < -6) f.x = W + 6;
        ctx.globalAlpha = .9; ctx.fillStyle = '#ffffff'; ctx.strokeStyle = 'rgba(110, 150, 195, .55)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 6.283); ctx.fill(); ctx.stroke();
      }
    },
    coffee(ctx, W, H, t) {
      ctx.lineCap = 'round'; ctx.lineWidth = 7;
      for (const w of fx.parts) {
        w.y -= w.vy; if (w.y < -w.len) { w.y = H + 20; w.x = r(0, W); }
        const fade = Math.min(1, Math.max(0, (H - w.y) / (H * .35))) * Math.min(1, Math.max(0, (w.y + w.len) / 120));
        ctx.globalAlpha = .13 * fade; ctx.strokeStyle = '#a07650'; ctx.beginPath();
        for (let i = 0; i <= 12; i++) { const y = w.y + (i / 12) * w.len, x = w.x + Math.sin(y * .035 + w.p + t * .02) * 14; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
        ctx.stroke();
      }
    }
  };
  const seed0 = seedParticles, draw0 = drawBg;
  window.seedParticles = function () {
    const make = MAKE[skin]; if (!make) return seed0();
    fx.parts = make(fx.w, fx.h, fx.w * fx.h / 1e6); fx.shoot = null;
  };
  window.drawBg = function (ctx) {
    const draw = DRAW[skin]; if (!draw) return draw0(ctx);
    ctx.clearRect(0, 0, fx.w, fx.h); draw(ctx, fx.w, fx.h, fx.t); ctx.globalAlpha = 1;
  };

  /* ---------- how finished blocks are counted, per theme: stars in 星空, flowers in 櫻花, bubbles in 海洋…
     icon, the count ({n} finished blocks this week) and the word for the week's progress toward the targets ---------- */
  const UNITS = {
    default: ['✅', '完成 {n} 格', '進度'], night: ['⭐', '亮起 {n} 顆星', '亮度'], sakura: ['🌸', '開了 {n} 朵花', '花開'],
    ocean: ['🫧', '冒出 {n} 顆氣泡', '潛水深度'], matcha: ['🍵', '泡了 {n} 杯茶', '茶香'], neon: ['⚡', '點亮 {n} 盞燈', '電量'],
    sunset: ['🌅', '收集 {n} 道晚霞', '暖度'], forest: ['🌲', '種下 {n} 棵樹', '森林覆蓋'], lavender: ['💜', '採了 {n} 束薰衣草', '香氣'],
    aurora: ['🌌', '出現 {n} 道極光', '極光強度'], snow: ['❄️', '堆了 {n} 片雪花', '積雪'], coffee: ['☕', '沖了 {n} 杯咖啡', '能量']
  };
  /* another person's theme (the group room draws each member in their own): words, colour and a scale of ten themed marks */
  window.PACE_SKIN_IDS = ["default","night","sakura","ocean","matcha","neon","sunset","forest","lavender","aurora","snow","coffee"];
  window.paceSkinInfo = id => {
    const k = UNITS[id] ? id : 'default', u = UNITS[k], sw = (SKINS.find(s => s.id === k) || {}).sw;
    return { id: k, icon: u[0], pip: k === 'default' ? '■' : u[0], count: n => u[1].replace('{n}', n), measure: u[2], color: sw ? sw[2] : '#2f7a5b' };
  };
  window.paceBar = (id, rate) => {   // 10 marks; the lit ones are the completion rate, a part-lit one shows the rest
    const i = window.paceSkinInfo(id), lit = rate == null ? 0 : Math.floor(rate / 10), frac = rate == null ? 0 : (rate % 10) / 10;
    return '<div class="grp-pips" role="img" aria-label="達成率' + (rate == null ? '' : ' ' + rate + '%') + '" style="--pc:' + i.color + '">' +
      Array.from({ length: 10 }, (_, k) => '<span class="pip ' + (k < lit ? 'on' : k === lit && frac > 0 ? 'part' : 'off') + '" style="--d:' + k * 45 + 'ms' + (k === lit && frac > 0 ? ';opacity:' + (.25 + .75 * frac).toFixed(2) : '') + '">' + i.pip + '</span>').join('') + '</div>';
  };
  window.paceUnit = () => { const u = UNITS[skin] || UNITS.default; return { icon: u[0], count: n => u[1].replace('{n}', n), measure: u[2] }; };
  // the weekly report says 「亮度 / 亮起 N 顆星」 for every theme: say it in the theme's own words
  function relabel() {
    const el = document.getElementById('rSkyMeta'); if (!el) return;
    if (window.PACE_KEEP_ORIGINAL_WORDS && (skin === 'default' || skin === 'night')) return;   // A keeps its own 亮度 / 亮起 N 顆星 where they were already
    const [pill, count] = el.querySelectorAll('span'), u = window.paceUnit();
    const g = /(\d+)%/.exec(pill?.textContent || ''), n = /(\d+)/.exec(count?.textContent || '');
    if (pill && g) pill.textContent = u.measure + ' ' + g[1] + '%';
    if (count && n) { const t = document.createElement('span'); t.textContent = u.count(n[1]); count.replaceChildren(u.icon + ' ', t); }
  }
  if (typeof renderReview === 'function') {
    const review0 = renderReview;
    window.renderReview = function (...a) { const r = review0.apply(this, a); try { relabel(); } catch (e) {} return r; };
  }
  const apply0 = applySkin;
  window.applySkin = function () { apply0(); try { relabel(); window.paceGroupRefresh?.(); } catch (e) {} };

  /* A already ran applySkin() with only its own six: if the saved choice is one of ours (or the synced config says so), switch now */
  let saved = null; try { saved = localStorage.getItem(SKIN_KEY); } catch (e) {}
  if (NEW.some(s => s.id === saved) && skin !== saved) skin = saved;
  applySkin();
  if (typeof syncSkinFromConfig === 'function') syncSkinFromConfig();
})();
