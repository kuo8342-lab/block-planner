/* 步調 Pace: twelve more themes (skins) — 夕陽, 森林, 薰衣草, 極光, 雪地, 咖啡, 沙漠, 糖果, 銀河, 楓葉, 雨夜, 水墨. They join the skins A already has:
   same picker, same saved choice (localStorage + the synced config), same on/off switch for the moving background.
   A draws its own six backgrounds inside drawBg()/seedParticles(); these two are wrapped here so a new skin draws
   its own scene and every other skin falls through to A's code untouched. Injected by build-c.js after the notion UI. */
(() => {
  if (typeof SKINS === 'undefined' || typeof fx === 'undefined' || typeof applySkin !== 'function') return;

  const NEW = [
    { id: 'sunset', name: '夕陽', note: '暮色海灣、暖橘晚霞與冉冉天燈', sw: ['#fff3e8', '#fffaf5', '#e0603a', '#ffd0c0', '#e9c8e8'] },
    { id: 'forest', name: '森林', note: '深綠迷霧林間、丁達爾光束與螢火蟲', sw: ['#0b1511', '#173326', '#7fd18b', '#e8d96a', '#2a4a35'] },
    { id: 'lavender', name: '薰衣草', note: '普羅旺斯花坡、紫瓣隨風與粉蝶飛舞', sw: ['#f6f2fd', '#fffdff', '#8a63d2', '#e9dcff', '#d9c7f5'] },
    { id: 'aurora', name: '極光', note: '極地星夜、多層流動綠紫極光帷幕', sw: ['#050d16', '#0f2a35', '#5eead4', '#a78bfa', '#34d399'] },
    { id: 'snow', name: '雪地', note: '靜謐冰藍雪原、六角冰晶雪花飄落', sw: ['#f1f6fb', '#ffffff', '#3b82c4', '#dcebf8', '#cfdde9'] },
    { id: 'coffee', name: '咖啡', note: '溫暖胡桃木吧檯、拿鐵拉花與醇香熱氣', sw: ['#f6efe6', '#fffaf3', '#9a6a3f', '#e4c9a8', '#c9a47a'] },
    { id: 'desert', name: '沙漠', note: '金色曲線沙丘、綠洲微風與盛開仙人掌', sw: ['#fbf0dc', '#fffaf0', '#c2641f', '#f6d9a8', '#e8c88c'] },
    { id: 'candy', name: '糖果', note: '法式甜點工坊、馬卡龍與繽紛糖霜星芒', sw: ['#fff1f7', '#ffffff', '#e0559b', '#ffd6e8', '#cfe9ff'] },
    { id: 'galaxy', name: '銀河', note: '深紫雙旋臂星雲、行星環與壯麗星軌', sw: ['#0a0618', '#1a1033', '#c084fc', '#7dd3fc', '#f0abfc'] },
    { id: 'autumn', name: '楓葉', note: '京都金秋嵐山、七裂紅楓與銀杏隨風翻飛', sw: ['#fbf0e4', '#fffaf4', '#c2410c', '#fbd3a6', '#e7b88a'] },
    { id: 'rain', name: '雨夜', note: 'Lo-Fi 城市天際線、溫暖窗燈與雨滴漣漪', sw: ['#0d141c', '#16212d', '#7fb2e5', '#9fc4ee', '#2c3e50'] },
    { id: 'ink', name: '水墨', note: '宣紙遠山煙雲、寫意墨韻與寒梅朱印', sw: ['#f5f3ee', '#fdfcf9', '#2b2b2b', '#e6e2d8', '#c9c4b6'] }
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
      'linear-gradient(180deg, #f9f2e9 0%, #efe3d3 100%)') +
    light('desert', '--bg: #fbf0dc; --panel: #fffaf0; --panel-2: #f6e8cc; --fg: #3d2b17; --muted: #75603f; --line: #ecd8b4; --line-soft: #f4e6c8;' +
      '--accent: #a8520f; --accent-ink: #a8520f; --accent-on: #ffffff; --accent-soft: #f8e0bb; --shadow: 0 2px 4px rgba(194, 100, 31, .06), 0 10px 26px rgba(194, 100, 31, .1);' +
      '--note: #f6dfb4; --note-fg: #3d2b17; --note-line: rgba(194, 100, 31, .14); --note-tape: rgba(255, 255, 255, .6);',
      'linear-gradient(180deg, #fdf3df 0%, #f3d9ad 100%)') +
    light('candy', '--bg: #fff1f7; --panel: #ffffff; --panel-2: #ffe8f2; --fg: #3a2232; --muted: #7d5a70; --line: #f6d3e3; --line-soft: #fbe5ef;' +
      '--accent: #b8236f; --accent-ink: #b8236f; --accent-on: #ffffff; --accent-soft: #ffd6e8; --shadow: 0 2px 4px rgba(224, 85, 155, .06), 0 10px 26px rgba(110, 160, 230, .12);' +
      '--note: #ffe0ee; --note-fg: #3a2232; --note-line: rgba(224, 85, 155, .14); --note-tape: rgba(207, 233, 255, .8);',
      'radial-gradient(circle at 10% 10%, #ffe0ee 0%, transparent 45%), radial-gradient(circle at 90% 90%, #d8ecff 0%, transparent 45%)') +
    dark('galaxy', '--bg: #0a0618; --panel: rgba(22, 14, 44, .82); --panel-2: rgba(36, 24, 68, .76); --fg: #ece6ff; --muted: #a99bcf; --line: rgba(190, 150, 255, .22); --line-soft: rgba(190, 150, 255, .09);' +
      '--accent: #c084fc; --accent-ink: #c084fc; --accent-on: #0a0618; --accent-soft: rgba(192, 132, 252, .17); --danger: #ff9aa8; --shadow: 0 10px 34px rgba(0, 0, 0, .5);' +
      '--note: #1c1238; --note-fg: #ece6ff; --note-line: rgba(192, 132, 252, .15); --note-tape: rgba(125, 211, 252, .3);',
      'radial-gradient(ellipse at 70% 15%, #2a1250 0%, transparent 55%), radial-gradient(ellipse at 10% 95%, #0f1d4a 0%, transparent 55%)') +
    light('autumn', '--bg: #fbf0e4; --panel: #fffaf4; --panel-2: #f7e6d3; --fg: #3b2216; --muted: #7a5a45; --line: #efd6bd; --line-soft: #f6e6d6;' +
      '--accent: #a8330a; --accent-ink: #a8330a; --accent-on: #ffffff; --accent-soft: #fbdcc0; --shadow: 0 2px 4px rgba(194, 65, 12, .06), 0 10px 26px rgba(194, 65, 12, .1);' +
      '--note: #fbd9b5; --note-fg: #3b2216; --note-line: rgba(194, 65, 12, .14); --note-tape: rgba(255, 255, 255, .6);',
      'linear-gradient(180deg, #fcf1e3 0%, #f6dfc4 100%)') +
    dark('rain', '--bg: #0d141c; --panel: rgba(20, 30, 42, .84); --panel-2: rgba(30, 44, 60, .78); --fg: #e1ebf5; --muted: #8ea3b8; --line: rgba(130, 170, 210, .2); --line-soft: rgba(130, 170, 210, .08);' +
      '--accent: #7fb2e5; --accent-ink: #7fb2e5; --accent-on: #0d141c; --accent-soft: rgba(127, 178, 229, .16); --danger: #ff9a8a; --shadow: 0 10px 34px rgba(0, 0, 0, .45);' +
      '--note: #172433; --note-fg: #e1ebf5; --note-line: rgba(127, 178, 229, .14); --note-tape: rgba(255, 214, 120, .25);',
      'linear-gradient(180deg, #101a26 0%, #0b1119 100%)') +
    light('ink', '--bg: #f5f3ee; --panel: #fdfcf9; --panel-2: #eeeae1; --fg: #1f1f1f; --muted: #66625a; --line: #dcd7ca; --line-soft: #e8e4d9;' +
      '--accent: #2b2b2b; --accent-ink: #2b2b2b; --accent-on: #ffffff; --accent-soft: #e6e2d8; --shadow: 0 2px 4px rgba(0, 0, 0, .05), 0 10px 26px rgba(0, 0, 0, .07);' +
      '--note: #ebe6d9; --note-fg: #1f1f1f; --note-line: rgba(0, 0, 0, .1); --note-tape: rgba(255, 255, 255, .7);',
      'radial-gradient(circle at 20% 10%, #ffffff 0%, transparent 50%), linear-gradient(180deg, #f7f5f0 0%, #ece8de 100%)');
  style.textContent += [['forest', '#12201a'], ['aurora', '#0c1826'], ['night', '#141c3a'], ['neon', '#0e0e1a'], ['galaxy', '#160e2c'], ['rain', '#141f2b']].map(([id, c]) => sk(id) + ' dialog { background: ' + c + '; backdrop-filter: none; -webkit-backdrop-filter: none; }\n').join('');
  document.head.appendChild(style);

  /* ---------- Botanical & Artistic Vector Primitives (Shared across background & confetti) ---------- */
  // True 7-lobed Japanese Momiji Maple Leaf with stem and veins
  function traceMomijiLeaf(ctx, r) {
    const lobes = [
      [0, -1.05, 0.16],       // central top lobe
      [0.62, -0.78, 0.15],    // upper right lobe
      [0.98, -0.15, 0.13],    // mid right lobe
      [0.58, 0.38, 0.10],     // lower right lobe
      [-0.58, 0.38, 0.10],    // lower left lobe
      [-0.98, -0.15, 0.13],   // mid left lobe
      [-0.62, -0.78, 0.15]    // upper left lobe
    ];
    ctx.beginPath();
    ctx.moveTo(0, r * 0.28);
    // Right side from base to top, then down left side
    const order = [3, 2, 1, 0, 6, 5, 4];
    const valleys = [
      [0.24, 0.25], [0.42, 0.04], [0.36, -0.32], [0.16, -0.45],
      [-0.16, -0.45], [-0.36, -0.32], [-0.42, 0.04], [-0.24, 0.25]
    ];
    for (let i = 0; i < order.length; i++) {
      const [lx, ly, w] = lobes[order[i]];
      const [vx, vy] = valleys[i];
      const [nvx, nvy] = valleys[i + 1];
      const ang = Math.atan2(ly, lx);
      const px = Math.cos(ang + 1.57) * w * r, py = Math.sin(ang + 1.57) * w * r;
      ctx.quadraticCurveTo(vx * r, vy * r, (lx * 0.65) * r + px, (ly * 0.65) * r + py);
      ctx.quadraticCurveTo(lx * r + px * 0.4, ly * r + py * 0.4, lx * r, ly * r);
      ctx.quadraticCurveTo(lx * r - px * 0.4, ly * r - py * 0.4, (lx * 0.65) * r - px, (ly * 0.65) * r - py);
      ctx.quadraticCurveTo(nvx * r, nvy * r, nvx * r, nvy * r);
    }
    ctx.closePath();
  }
  function drawMomijiWithVeins(ctx, r, fillCol, veinCol) {
    ctx.fillStyle = fillCol;
    traceMomijiLeaf(ctx, r);
    ctx.fill();
    // Delicate stem & palmate veins
    ctx.strokeStyle = veinCol || 'rgba(90, 25, 10, 0.42)';
    ctx.lineWidth = Math.max(0.7, r * 0.07);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, r * 0.25);
    ctx.quadraticCurveTo(r * 0.08, r * 0.52, r * 0.18, r * 0.72); // curved petiole stem
    const tips = [[0, -0.85], [0.5, -0.62], [0.78, -0.12], [-0.5, -0.62], [-0.78, -0.12]];
    for (const [tx, ty] of tips) {
      ctx.moveTo(0, r * 0.22);
      ctx.lineTo(tx * r, ty * r);
    }
    ctx.stroke();
  }
  // Golden Ginkgo Biloba fan leaf
  function drawGinkgoLeaf(ctx, r, fillCol) {
    ctx.fillStyle = fillCol;
    ctx.beginPath();
    ctx.moveTo(0, r * 0.45);
    ctx.quadraticCurveTo(r * 0.35, r * 0.1, r * 0.88, -r * 0.35);
    ctx.bezierCurveTo(r * 0.75, -r * 0.85, r * 0.2, -r * 0.92, r * 0.06, -r * 0.52);
    ctx.lineTo(0, -r * 0.38); // central notch of ginkgo leaf
    ctx.lineTo(-r * 0.06, -r * 0.52);
    ctx.bezierCurveTo(-r * 0.2, -r * 0.92, -r * 0.75, -r * 0.85, -r * 0.88, -r * 0.35);
    ctx.quadraticCurveTo(-r * 0.35, r * 0.1, 0, r * 0.45);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(140, 85, 10, 0.35)';
    ctx.lineWidth = Math.max(0.7, r * 0.07);
    ctx.beginPath();
    ctx.moveTo(0, r * 0.42);
    ctx.quadraticCurveTo(r * 0.06, r * 0.68, r * 0.14, r * 0.85);
    ctx.stroke();
  }
  // Crystalline 6-point Snowflake
  function drawCrystalSnowflake(ctx, r) {
    ctx.beginPath();
    for (let k = 0; k < 6; k++) {
      const a = k * Math.PI / 3;
      const ca = Math.cos(a), sa = Math.sin(a);
      ctx.moveTo(0, 0);
      ctx.lineTo(ca * r, sa * r);
      const b1 = r * 0.55, bLen = r * 0.32;
      for (const sgn of [-1, 1]) {
        const ba = a + sgn * 0.55;
        ctx.moveTo(ca * b1, sa * b1);
        ctx.lineTo(ca * b1 + Math.cos(ba) * bLen, sa * b1 + Math.sin(ba) * bLen);
      }
    }
    ctx.stroke();
  }
  // Curved 4-point celestial sparkle
  function drawSparkleStar(ctx, x, y, r) {
    ctx.beginPath();
    ctx.moveTo(x, y - r);
    ctx.quadraticCurveTo(x + r * 0.12, y - r * 0.12, x + r, y);
    ctx.quadraticCurveTo(x + r * 0.12, y + r * 0.12, x, y + r);
    ctx.quadraticCurveTo(x - r * 0.12, y + r * 0.12, x - r, y);
    ctx.quadraticCurveTo(x - r * 0.12, y - r * 0.12, x, y - r);
    ctx.closePath();
    ctx.fill();
  }

  window.PACE_ART = { traceMomijiLeaf, drawMomijiWithVeins, drawGinkgoLeaf, drawCrystalSnowflake, drawSparkleStar };

  /* ---------- moving backgrounds ---------- */
  const r = (a, b) => a + Math.random() * (b - a);
  const MAKE = {
    sunset: (W, H, a) => Array.from({ length: Math.round(18 * a) + 10 }, (_, i) => ({ x: r(0, W), y: r(0, H), r: r(12, 38), vy: r(.15, .42), p: r(0, 6.28), lantern: i % 3 === 0 })),
    forest: (W, H, a) => Array.from({ length: Math.round(30 * a) + 14 }, () => ({ x: r(0, W), y: r(0, H), vx: r(-.22, .22), vy: r(-.2, .2), p: r(0, 6.28), s: r(.7, 1.7) })),
    lavender: (W, H, a) => Array.from({ length: Math.round(28 * a) + 14 }, (_, i) => ({ x: r(0, W), y: r(0, H), vx: r(.12, .38), vy: r(-.3, -.08), p: r(0, 6.28), s: r(4, 9), rot: r(0, 6.28), kind: i % 6 === 0 ? 'butterfly' : i % 2 === 0 ? 'petal' : 'bokeh' })),
    aurora: (W, H, a) => Array.from({ length: Math.round(90 * a) + 34 }, () => ({ x: r(0, W), y: r(0, H * .82), r: r(.5, 1.6), p: r(0, 6.28), s: r(.6, 2) })),
    snow: (W, H, a) => Array.from({ length: Math.round(48 * a) + 24 }, (_, i) => ({ x: r(0, W), y: r(-H * .2, H), vx: r(-.22, .26), vy: r(.45, 1.25), r: r(2.2, 6.5), p: r(0, 6.28), rot: r(0, 6.28), crystal: i % 3 === 0 })),
    coffee: (W, H, a) => Array.from({ length: Math.round(12 * a) + 7 }, (_, i) => ({ x: r(0, W), y: r(H * .15, H + 80), vy: r(.28, .6), p: r(0, 6.28), len: r(80, 150), bokeh: i % 3 === 0, r: r(18, 42) })),
    desert: (W, H, a) => Array.from({ length: Math.round(44 * a) + 22 }, () => ({ x: r(0, W), y: r(0, H), vx: r(.35, 1.15), vy: r(-.06, .06), r: r(.8, 2.2), p: r(0, 6.28) })),
    candy: (W, H, a) => Array.from({ length: Math.round(18 * a) + 10 }, (_, i) => ({ x: r(0, W), y: r(0, H), vy: r(.18, .48), r: r(7, 16), p: r(0, 6.28), rot: r(0, 6.28), c: i % 4, kind: i % 3 })),
    galaxy: (W, H, a) => Array.from({ length: Math.round(130 * a) + 55 }, () => ({ a: r(0, 6.28), d: r(10, Math.hypot(W, H) * .62), r: r(.4, 1.7), p: r(0, 6.28), s: r(.5, 2) })),
    autumn: (W, H, a) => Array.from({ length: Math.round(20 * a) + 12 }, (_, i) => ({ x: r(0, W), y: r(-H * .1, H), vx: r(-.35, .4), vy: r(.42, 1.05), rot: r(0, 6.28), vr: r(-.025, .025), flip: r(0, 6.28), vflip: r(.02, .05), s: r(8, 15), c: i % 4, ginkgo: i % 4 === 3, p: r(0, 6.28) })),
    rain: (W, H, a) => Array.from({ length: Math.round(75 * a) + 34 }, (_, i) => ({ x: r(0, W + 100), y: r(-H * .2, H), len: r(12, 26), v: r(8, 15), p: r(.18, .48), bokeh: i < 10 ? { x: r(0, W), y: r(H * .2, H * .85), r: r(24, 65), col: i % 2 ? '255, 190, 95' : '110, 190, 255' } : null })),
    ink: (W, H, a) => Array.from({ length: Math.round(8 * a) + 6 }, (_, i) => ({ x: r(0, W), y: r(0, H), r: r(45, 140), p: r(0, 6.28), sp: r(.004, .009), vy: r(-.1, .1), plum: i % 2 === 0 }))
  };

  const CANDY = ['255, 126, 182', '110, 197, 255', '255, 209, 102', '142, 224, 180'];
  const LEAF_COLS = ['#d9481e', '#e87a24', '#b8321a', '#f2b728'];

  const DRAW = {
    sunset(ctx, W, H, t) {
      const R = Math.max(W, H) * .7, g = ctx.createRadialGradient(W * .78, H * .92, 0, W * .78, H * .92, R);
      g.addColorStop(0, 'rgba(255, 160, 75, .42)'); g.addColorStop(.5, 'rgba(244, 114, 150, .18)'); g.addColorStop(1, 'rgba(255, 170, 90, 0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      for (const o of fx.parts) {
        o.y -= o.vy; o.x += Math.sin(t * .012 + o.p) * .3;
        if (o.y < -o.r * 1.5) { o.y = H + o.r; o.x = r(0, W); }
        const q = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
        q.addColorStop(0, o.lantern ? 'rgba(255, 230, 150, .48)' : 'rgba(255, 190, 120, .28)');
        q.addColorStop(1, 'rgba(255, 180, 110, 0)');
        ctx.fillStyle = q; ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, 6.283); ctx.fill();
        if (o.lantern) {
          ctx.save();
          ctx.translate(o.x, o.y);
          ctx.rotate(Math.sin(t * .015 + o.p) * .08);
          const lw = o.r * .42, lh = o.r * .56;
          ctx.fillStyle = 'rgba(235, 95, 45, .45)';
          ctx.beginPath(); ctx.roundRect(-lw / 2, -lh / 2, lw, lh, lw * .25); ctx.fill();
          ctx.fillStyle = 'rgba(255, 240, 180, .75)';
          ctx.beginPath(); ctx.arc(0, lh * .18, lw * .22, 0, 6.283); ctx.fill();
          ctx.restore();
        }
      }
    },
    forest(ctx, W, H, t) {
      // Soft god-rays (Tyndall sunbeams) filtering from top-left canopy
      ctx.save();
      for (let i = 0; i < 3; i++) {
        const rx = W * (.18 + i * .28) + Math.sin(t * .004 + i) * 30;
        const rg = ctx.createLinearGradient(rx, 0, rx + 140, H * .75);
        rg.addColorStop(0, 'rgba(165, 240, 175, .07)');
        rg.addColorStop(1, 'rgba(127, 209, 139, 0)');
        ctx.fillStyle = rg;
        ctx.beginPath();
        ctx.moveTo(rx - 40, 0); ctx.lineTo(rx + 45, 0);
        ctx.lineTo(rx + 220, H * .8); ctx.lineTo(rx + 40, H * .8);
        ctx.closePath(); ctx.fill();
      }
      ctx.restore();
      const m = ctx.createLinearGradient(0, H * .68, 0, H);
      m.addColorStop(0, 'rgba(127, 209, 139, 0)'); m.addColorStop(1, 'rgba(127, 209, 139, .11)');
      ctx.fillStyle = m; ctx.fillRect(0, H * .68, W, H * .32);
      for (const f of fx.parts) {
        f.vx = Math.max(-.5, Math.min(.5, f.vx + r(-.02, .02))); f.vy = Math.max(-.4, Math.min(.4, f.vy + r(-.02, .02)));
        f.x += f.vx; f.y += f.vy; if (f.x < -10) f.x = W + 10; if (f.x > W + 10) f.x = -10; if (f.y < -10) f.y = H + 10; if (f.y > H + 10) f.y = -10;
        const a = Math.max(0, Math.sin(t * .028 * f.s + f.p)) ** 2;
        if (a < .02) continue;
        const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, 13);
        g.addColorStop(0, 'rgba(230, 255, 140, ' + (a * .92) + ')');
        g.addColorStop(.4, 'rgba(130, 235, 145, ' + (a * .45) + ')');
        g.addColorStop(1, 'rgba(130, 235, 145, 0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(f.x, f.y, 13, 0, 6.283); ctx.fill();
      }
    },
    lavender(ctx, W, H, t) {
      const wg = ctx.createLinearGradient(0, H * .75, 0, H);
      wg.addColorStop(0, 'rgba(168, 130, 225, 0)'); wg.addColorStop(1, 'rgba(168, 130, 225, .12)');
      ctx.fillStyle = wg; ctx.fillRect(0, H * .75, W, H * .25);
      for (const s of fx.parts) {
        s.x += s.vx + Math.sin(t * .015 + s.p) * .25; s.y += s.vy; s.rot += .015;
        if (s.y < -16) { s.y = H + 16; s.x = r(0, W); } if (s.x > W + 16) s.x = -16;
        const a = .28 + .55 * Math.abs(Math.sin(t * .018 + s.p));
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.globalAlpha = a;
        if (s.kind === 'butterfly') {
          const wing = 0.35 + 0.65 * Math.abs(Math.sin(t * .12 + s.p));
          ctx.rotate(Math.sin(t * .02 + s.p) * .25 - .3);
          ctx.scale(1, wing);
          ctx.fillStyle = '#9b6fe0';
          ctx.beginPath();
          ctx.ellipse(-s.s * .45, -s.s * .2, s.s * .7, s.s * .45, -.4, 0, 6.283);
          ctx.ellipse(s.s * .45, -s.s * .2, s.s * .7, s.s * .45, .4, 0, 6.283);
          ctx.fill();
        } else if (s.kind === 'petal') {
          ctx.rotate(s.rot);
          ctx.scale(Math.cos(t * .025 + s.p) * .5 + .5, 1);
          ctx.fillStyle = '#a37ce0';
          ctx.beginPath();
          ctx.moveTo(0, -s.s);
          ctx.quadraticCurveTo(s.s * .65, 0, 0, s.s);
          ctx.quadraticCurveTo(-s.s * .65, 0, 0, -s.s);
          ctx.fill();
        } else {
          ctx.fillStyle = '#bca0eb';
          drawSparkleStar(ctx, 0, 0, s.s * .9);
        }
        ctx.restore();
      }
    },
    aurora(ctx, W, H, t) {
      for (const s of fx.parts) {
        ctx.globalAlpha = .35 + .65 * Math.abs(Math.sin(t * .015 * s.s + s.p));
        ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.283); ctx.fill();
      }
      const bands = [[52, 211, 153, .12, .0042, .006], [94, 234, 212, .2, .0031, .0045], [167, 139, 250, .28, .0052, .0035]];
      bands.forEach(([cr, cg, cb, base, k, sp], i) => {
        const y0 = H * (base + .02), th = H * .24, top = y0 - th * .5;
        const g = ctx.createLinearGradient(0, top, 0, top + th * 1.4);
        g.addColorStop(0, 'rgba(' + cr + ',' + cg + ',' + cb + ',0)');
        g.addColorStop(.38, 'rgba(' + cr + ',' + cg + ',' + cb + ',.28)');
        g.addColorStop(1, 'rgba(' + cr + ',' + cg + ',' + cb + ',0)');
        ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.beginPath();
        for (let x = 0; x <= W; x += 14) { const y = top + Math.sin(x * k + t * sp * 6 + i * 1.7) * 32 + Math.sin(x * k * 2.3 - t * sp * 4) * 14; x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
        for (let x = W; x >= 0; x -= 14) ctx.lineTo(x, top + th * 1.4 + Math.sin(x * k * 1.4 + t * sp * 5 + i) * 26);
        ctx.closePath(); ctx.fill();
      });
    },
    snow(ctx, W, H, t) {
      const sg = ctx.createLinearGradient(0, H * .8, 0, H);
      sg.addColorStop(0, 'rgba(185, 215, 240, 0)'); sg.addColorStop(1, 'rgba(185, 215, 240, .22)');
      ctx.fillStyle = sg; ctx.fillRect(0, H * .8, W, H * .2);
      for (const f of fx.parts) {
        f.x += f.vx + Math.sin(t * .012 + f.p) * .35; f.y += f.vy; f.rot += .008;
        if (f.y > H + 10) { f.y = -10; f.x = r(0, W); } if (f.x > W + 10) f.x = -10; if (f.x < -10) f.x = W + 10;
        ctx.save();
        ctx.translate(f.x, f.y);
        if (f.crystal) {
          ctx.rotate(f.rot);
          ctx.globalAlpha = .72;
          ctx.strokeStyle = '#5b9bd5';
          ctx.lineWidth = 1.2;
          ctx.lineCap = 'round';
          drawCrystalSnowflake(ctx, f.r * 1.35);
        } else {
          ctx.globalAlpha = .8;
          const rg = ctx.createRadialGradient(0, 0, 0, 0, 0, f.r * 1.3);
          rg.addColorStop(0, '#ffffff');
          rg.addColorStop(.65, 'rgba(180, 215, 245, .65)');
          rg.addColorStop(1, 'rgba(180, 215, 245, 0)');
          ctx.fillStyle = rg;
          ctx.beginPath(); ctx.arc(0, 0, f.r * 1.3, 0, 6.283); ctx.fill();
        }
        ctx.restore();
      }
    },
    coffee(ctx, W, H, t) {
      const cg = ctx.createLinearGradient(0, H * .7, 0, H);
      cg.addColorStop(0, 'rgba(160, 118, 80, 0)'); cg.addColorStop(1, 'rgba(160, 118, 80, .1)');
      ctx.fillStyle = cg; ctx.fillRect(0, H * .7, W, H * .3);
      ctx.lineCap = 'round';
      for (const w of fx.parts) {
        w.y -= w.vy; if (w.y < -w.len) { w.y = H + 20; w.x = r(0, W); }
        if (w.bokeh) {
          const g = ctx.createRadialGradient(w.x, w.y, 0, w.x, w.y, w.r);
          g.addColorStop(0, 'rgba(215, 165, 110, .18)'); g.addColorStop(1, 'rgba(215, 165, 110, 0)');
          ctx.globalAlpha = 1; ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(w.x, w.y, w.r, 0, 6.283); ctx.fill();
        } else {
          const fade = Math.min(1, Math.max(0, (H - w.y) / (H * .35))) * Math.min(1, Math.max(0, (w.y + w.len) / 120));
          ctx.globalAlpha = .15 * fade; ctx.strokeStyle = '#9c6f44'; ctx.lineWidth = 6;
          ctx.beginPath();
          for (let i = 0; i <= 12; i++) { const y = w.y + (i / 12) * w.len, x = w.x + Math.sin(y * .035 + w.p + t * .02) * 14; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
          ctx.stroke();
        }
      }
    },
    desert(ctx, W, H, t) {
      [[.84, .15, 0], [.91, .22, 2.1]].forEach(([b, al, ph]) => {
        ctx.fillStyle = 'rgba(205, 148, 76, ' + al + ')'; ctx.beginPath(); ctx.moveTo(0, H);
        for (let x = 0; x <= W; x += 16) ctx.lineTo(x, H * b + Math.sin(x * .004 + t * .0004 + ph) * 16 + Math.sin(x * .011 + ph) * 7);
        ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
      });
      ctx.globalAlpha = .55; ctx.fillStyle = '#c99350';
      for (const p of fx.parts) {
        p.x += p.vx; p.y += p.vy + Math.sin(t * .02 + p.p) * .18; if (p.x > W + 4) { p.x = -4; p.y = r(0, H); }
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
      }
    },
    candy(ctx, W, H, t) {
      for (const o of fx.parts) {
        o.y -= o.vy; o.x += Math.sin(t * .012 + o.p) * .35; o.rot += .01;
        if (o.y < -o.r * 2) { o.y = H + o.r * 2; o.x = r(0, W); }
        ctx.save();
        ctx.translate(o.x, o.y);
        ctx.rotate(o.rot);
        const col = 'rgb(' + CANDY[o.c] + ')';
        if (o.kind === 0) {
          // Wrapped bonbon candy
          ctx.globalAlpha = .38; ctx.fillStyle = col;
          ctx.beginPath();
          ctx.moveTo(-o.r * .7, 0); ctx.lineTo(-o.r * 1.45, -o.r * .55); ctx.lineTo(-o.r * 1.45, o.r * .55); ctx.closePath();
          ctx.moveTo(o.r * .7, 0); ctx.lineTo(o.r * 1.45, -o.r * .55); ctx.lineTo(o.r * 1.45, o.r * .55); ctx.closePath();
          ctx.fill();
          ctx.beginPath(); ctx.arc(0, 0, o.r * .85, 0, 6.283); ctx.fill();
          ctx.globalAlpha = .5; ctx.fillStyle = '#ffffff';
          ctx.beginPath(); ctx.arc(-o.r * .28, -o.r * .28, o.r * .22, 0, 6.283); ctx.fill();
        } else if (o.kind === 1) {
          // Sparkle sugar star
          ctx.globalAlpha = .42; ctx.fillStyle = col;
          drawSparkleStar(ctx, 0, 0, o.r * 1.1);
        } else {
          // Pastel macaron / bubble
          ctx.globalAlpha = .32; ctx.fillStyle = col;
          ctx.beginPath(); ctx.arc(0, 0, o.r, 0, 6.283); ctx.fill();
          ctx.globalAlpha = .45; ctx.fillStyle = '#ffffff';
          ctx.beginPath(); ctx.arc(-o.r * .35, -o.r * .35, o.r * .25, 0, 6.283); ctx.fill();
        }
        ctx.restore();
      }
    },
    galaxy(ctx, W, H, t) {
      [[W * .7 + Math.sin(t * .001) * 40, H * .3, 'rgba(160, 90, 240, .18)'], [W * .25, H * .75 + Math.cos(t * .0008) * 30, 'rgba(70, 120, 240, .15)']].forEach(([x, y, c]) => {
        const R = Math.max(W, H) * .48, g = ctx.createRadialGradient(x, y, 0, x, y, R); g.addColorStop(0, c); g.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      });
      const cx = W * .55, cy = H * .45; ctx.fillStyle = '#ffffff';
      for (const s of fx.parts) {
        const an = s.a + t * .00025 * (300 / (s.d + 150)), x = cx + Math.cos(an) * s.d, y = cy + Math.sin(an) * s.d * .6;
        if (x < -2 || x > W + 2 || y < -2 || y > H + 2) continue;
        ctx.globalAlpha = .3 + .7 * Math.abs(Math.sin(t * .015 * s.s + s.p));
        ctx.beginPath(); ctx.arc(x, y, s.r, 0, 6.283); ctx.fill();
      }
    },
    autumn(ctx, W, H, t) {
      // Warm autumn sunlit glow from top right
      const ag = ctx.createRadialGradient(W * .85, 0, 0, W * .85, 0, Math.max(W, H) * .6);
      ag.addColorStop(0, 'rgba(245, 158, 11, .14)'); ag.addColorStop(1, 'rgba(245, 158, 11, 0)');
      ctx.fillStyle = ag; ctx.fillRect(0, 0, W, H);
      for (const l of fx.parts) {
        l.x += l.vx + Math.sin(t * .014 + l.p) * .65;
        l.y += l.vy;
        l.rot += l.vr;
        l.flip += l.vflip;
        if (l.y > H + 24) { l.y = -24; l.x = r(0, W); }
        if (l.x > W + 24) l.x = -24; if (l.x < -24) l.x = W + 24;
        ctx.save();
        ctx.translate(l.x, l.y);
        ctx.rotate(l.rot);
        // 3D tumbling leaf flip perspective
        const flipScale = 0.38 + 0.62 * Math.abs(Math.cos(l.flip));
        ctx.scale(flipScale, 1);
        ctx.globalAlpha = .58;
        if (l.ginkgo) {
          drawGinkgoLeaf(ctx, l.s, LEAF_COLS[l.c]);
        } else {
          drawMomijiWithVeins(ctx, l.s, LEAF_COLS[l.c], 'rgba(90, 25, 10, 0.35)');
        }
        ctx.restore();
      }
    },
    rain(ctx, W, H, t) {
      const g = ctx.createLinearGradient(0, H * .68, 0, H);
      g.addColorStop(0, 'rgba(255, 200, 120, 0)'); g.addColorStop(1, 'rgba(255, 200, 120, .08)');
      ctx.fillStyle = g; ctx.fillRect(0, H * .68, W, H * .32);
      // Warm city bokeh lights behind rain
      for (const d of fx.parts) {
        if (!d.bokeh) continue;
        const b = d.bokeh, pulse = .75 + .25 * Math.sin(t * .015 + d.p * 10);
        const bg = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
        bg.addColorStop(0, `rgba(${b.col}, ${.12 * pulse})`);
        bg.addColorStop(1, `rgba(${b.col}, 0)`);
        ctx.globalAlpha = 1; ctx.fillStyle = bg;
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 6.283); ctx.fill();
      }
      ctx.strokeStyle = '#aacdf0'; ctx.lineWidth = 1.1; ctx.lineCap = 'round';
      for (const d of fx.parts) {
        d.x -= d.v * .12; d.y += d.v;
        if (d.y > H - 8) {
          // Draw subtle puddle ripple splash at the bottom before resetting
          ctx.save();
          ctx.globalAlpha = d.p * .7;
          ctx.strokeStyle = 'rgba(170, 205, 240, .55)';
          ctx.beginPath();
          ctx.ellipse(d.x, H - 6, 8, 2.2, 0, 0, 6.283);
          ctx.stroke();
          ctx.restore();
          d.y = -d.len; d.x = r(0, W + 100);
        }
        ctx.globalAlpha = d.p;
        ctx.beginPath(); ctx.moveTo(d.x, d.y); ctx.lineTo(d.x + d.len * .12, d.y - d.len); ctx.stroke();
      }
    },
    ink(ctx, W, H, t) {
      // Subtle Shan-Shui distant misty mountains at bottom
      ctx.save();
      [[.84, 'rgba(40, 38, 34, .06)', 0], [.9, 'rgba(30, 28, 25, .09)', 1.8]].forEach(([baseY, col, ph]) => {
        ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, H);
        for (let x = 0; x <= W; x += 18) {
          const y = H * baseY - Math.abs(Math.sin(x * .0035 + ph)) * 42 - Math.sin(x * .009 + ph) * 14;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
      });
      ctx.restore();
      for (const b of fx.parts) {
        const k = (Math.sin(t * b.sp + b.p) + 1) / 2; b.y += b.vy; if (b.y < -b.r) b.y = H + b.r; if (b.y > H + b.r) b.y = -b.r;
        const rr = b.r * (.7 + .3 * k), g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, rr);
        g.addColorStop(0, 'rgba(30, 30, 30, ' + (.075 * k) + ')'); g.addColorStop(.7, 'rgba(30, 30, 30, ' + (.03 * k) + ')'); g.addColorStop(1, 'rgba(30, 30, 30, 0)');
        ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(b.x, b.y, rr, 0, 6.283); ctx.fill();
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

  /* ---------- how finished blocks are counted, per theme ---------- */
  const UNITS = {
    default: ['🌱', '萌發 {n} 株新芽', '生機'], night: ['⭐', '亮起 {n} 顆星', '亮度'], sakura: ['🌸', '綻放 {n} 朵櫻花', '花開'],
    ocean: ['🫧', '躍動 {n} 顆氣泡', '潛水深度'], matcha: ['🍵', '沏好 {n} 碗抹茶', '茶韻'], neon: ['⚡', '充能 {n} 座晶柱', '能量'],
    sunset: ['🏮', '升起 {n} 盞天燈', '暮光'], forest: ['🌲', '種下 {n} 棵古樹', '森林覆蓋'], lavender: ['💜', '盛開 {n} 穗薰衣草', '花香'],
    aurora: ['🌌', '舞動 {n} 道極光', '極光強度'], snow: ['❄️', '凝結 {n} 朵冰晶', '積雪'], coffee: ['☕', '拉花 {n} 杯拿鐵', '醇香'],
    desert: ['🌵', '盛放 {n} 株仙人掌', '綠洲'], candy: ['🍬', '珍藏 {n} 顆甜點', '甜度'], galaxy: ['🪐', '探索 {n} 顆行星', '航行距離'],
    autumn: ['🍁', '染紅 {n} 片秋楓', '秋意'], rain: ['🏙️', '點亮 {n} 扇夜窗', '萬家燈火'], ink: ['🖌️', '題下 {n} 枝寒梅', '墨韻']
  };
  window.PACE_SKIN_IDS = ["default","night","sakura","ocean","matcha","neon","sunset","forest","lavender","aurora","snow","coffee","desert","candy","galaxy","autumn","rain","ink"];
  window.paceSkinInfo = id => {
    const k = UNITS[id] ? id : 'default', u = UNITS[k], sw = (SKINS.find(s => s.id === k) || {}).sw;
    return { id: k, icon: u[0], pip: k === 'default' ? '■' : u[0], count: n => u[1].replace('{n}', n), measure: u[2], color: sw ? sw[2] : '#2f7a5b' };
  };
  window.paceBar = (id, rate) => {
    const i = window.paceSkinInfo(id), lit = rate == null ? 0 : Math.floor(rate / 10), frac = rate == null ? 0 : (rate % 10) / 10;
    return '<div class="grp-pips" role="img" aria-label="達成率' + (rate == null ? '' : ' ' + rate + '%') + '" style="--pc:' + i.color + '">' +
      Array.from({ length: 10 }, (_, k) => '<span class="pip ' + (k < lit ? 'on' : k === lit && frac > 0 ? 'part' : 'off') + '" style="--d:' + k * 45 + 'ms' + (k === lit && frac > 0 ? ';opacity:' + (.25 + .75 * frac).toFixed(2) : '') + '">' + i.pip + '</span>').join('') + '</div>';
  };
  window.paceUnit = () => { const u = UNITS[skin] || UNITS.default; return { icon: u[0], count: n => u[1].replace('{n}', n), measure: u[2] }; };

  /* ---------- Themed Confetti & Celebration Particle Engine ---------- */
  const THEME_PALETTES = {
    sakura: { cols: ['#fbbcd0', '#f472b6', '#ffffff', '#fda4af', '#fb7185'], shapes: ['sakura', 'petal', 'sparkle'] },
    forest: { cols: ['#4ade80', '#22c55e', '#fef08a', '#86efac', '#15803d'], shapes: ['leaf', 'sparkle', 'circle'] },
    snow: { cols: ['#38bdf8', '#7dd3fc', '#ffffff', '#bae6fd', '#0284c7'], shapes: ['snowflake', 'sparkle', 'circle'] },
    ocean: { cols: ['#38bdf8', '#0ea5e9', '#ffffff', '#7dd3fc', '#a5f3fc'], shapes: ['bubble', 'sparkle', 'circle'] },
    candy: { cols: ['#f472b6', '#c084fc', '#fde047', '#67e8f9', '#fb7185'], shapes: ['heart', 'sparkle', 'circle'] },
    galaxy: { cols: ['#c084fc', '#818cf8', '#f472b6', '#38bdf8', '#fef08a'], shapes: ['sparkle', 'star', 'circle'] },
    matcha: { cols: ['#84cc16', '#65a30d', '#fef08a', '#d9f99d', '#4d7c0f'], shapes: ['leaf', 'petal', 'circle'] },
    coffee: { cols: ['#b45309', '#d97706', '#fef3c7', '#78350f', '#fde68a'], shapes: ['heart', 'sparkle', 'circle'] },
    sunset: { cols: ['#fb923c', '#f87171', '#fbbf24', '#f43f5e', '#fda4af'], shapes: ['sparkle', 'petal', 'circle'] },
    aurora: { cols: ['#2dd4bf', '#a78bfa', '#34d399', '#67e8f9', '#c084fc'], shapes: ['sparkle', 'star', 'circle'] },
    neon: { cols: ['#00e5ff', '#ff3d81', '#39ff14', '#ffff00', '#ffffff'], shapes: ['sparkle', 'rect', 'star'] },
    autumn: { cols: ['#dc2626', '#ea580c', '#f59e0b', '#b91c1c', '#eab308'], shapes: ['maple', 'ginkgo', 'leaf'] },
    rain: { cols: ['#60a5fa', '#38bdf8', '#93c5fd', '#fde047', '#ffffff'], shapes: ['bubble', 'sparkle', 'circle'] },
    ink: { cols: ['#dc2626', '#18181b', '#52525b', '#e11d48', '#a1a1aa'], shapes: ['sakura', 'circle', 'petal'] },
    desert: { cols: ['#f59e0b', '#d97706', '#10b981', '#f43f5e', '#fbbf24'], shapes: ['sparkle', 'petal', 'circle'] },
    lavender: { cols: ['#a855f7', '#c084fc', '#e9d5ff', '#7c3aed', '#f472b6'], shapes: ['petal', 'sparkle', 'heart'] },
    night: { cols: ['#fbbf24', '#60a5fa', '#fef08a', '#e0e7ff', '#ffffff'], shapes: ['sparkle', 'star', 'circle'] },
    default: { cols: ['#2f7a5b', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'], shapes: ['sparkle', 'leaf', 'circle'] }
  };

  const TAU2 = Math.PI * 2;
  function drawCustomShape(ctx, shape, s, col) {
    if (shape === 'maple') {
      drawMomijiWithVeins(ctx, s * 0.72, col, 'rgba(90, 20, 10, 0.35)');
    } else if (shape === 'ginkgo') {
      drawGinkgoLeaf(ctx, s * 0.72, col);
    } else if (shape === 'sakura') {
      ctx.beginPath();
      ctx.moveTo(0, s * 0.55);
      ctx.bezierCurveTo(-s * 0.55, s * 0.15, -s * 0.5, -s * 0.45, -s * 0.12, -s * 0.55);
      ctx.lineTo(0, -s * 0.35);
      ctx.lineTo(s * 0.12, -s * 0.55);
      ctx.bezierCurveTo(s * 0.5, -s * 0.45, s * 0.55, s * 0.15, 0, s * 0.55);
      ctx.closePath();
      ctx.fill();
    } else if (shape === 'snowflake') {
      ctx.strokeStyle = col;
      ctx.lineWidth = 1.3;
      ctx.lineCap = 'round';
      drawCrystalSnowflake(ctx, s * 0.62);
    } else if (shape === 'sparkle') {
      drawSparkleStar(ctx, 0, 0, s * 0.68);
    } else if (shape === 'petal') {
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 0.68, s * 0.34, 0, 0, TAU2);
      ctx.fill();
    } else if (shape === 'leaf') {
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.62);
      ctx.quadraticCurveTo(s * 0.46, 0, 0, s * 0.62);
      ctx.quadraticCurveTo(-s * 0.46, 0, 0, -s * 0.62);
      ctx.fill();
    } else if (shape === 'star') {
      ctx.beginPath();
      for (let k = 0; k < 10; k++) {
        const rad = -Math.PI / 2 + k * Math.PI / 5;
        const dist = k % 2 === 0 ? s * 0.58 : s * 0.25;
        k === 0 ? ctx.moveTo(Math.cos(rad) * dist, Math.sin(rad) * dist) : ctx.lineTo(Math.cos(rad) * dist, Math.sin(rad) * dist);
      }
      ctx.closePath();
      ctx.fill();
    } else if (shape === 'heart') {
      const d = s * 0.42;
      ctx.beginPath();
      ctx.moveTo(0, d * 0.6);
      ctx.bezierCurveTo(-d * 1.2, -d * 0.4, -d * 1.2, -d * 1.2, 0, -d * 0.6);
      ctx.bezierCurveTo(d * 1.2, -d * 1.2, d * 1.2, -d * 0.4, 0, d * 0.6);
      ctx.fill();
    } else if (shape === 'bubble') {
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.44, 0, TAU2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.beginPath();
      ctx.arc(-s * 0.14, -s * 0.14, s * 0.13, 0, TAU2);
      ctx.fill();
    } else if (shape === 'rect') {
      ctx.fillRect(-s / 2, -s / 4, s, s / 2);
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, s / 2.5, 0, TAU2);
      ctx.fill();
    }
  }

  if (typeof fx !== 'undefined') {
    window.drawConfetti = function (ctx) {
      ctx.clearRect(0, 0, fx.w, fx.h);
      fx.confetti = fx.confetti.filter(c => c.life < c.max);
      for (const c of fx.confetti) {
        c.life++;
        c.vy += c.gravity !== undefined ? c.gravity : 0.16;
        c.vx *= 0.985;
        c.x += c.vx + Math.sin(c.life * 0.12 + c.a) * 0.25;
        c.y += c.vy;
        c.a += c.va;
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(c.a);
        const progress = c.life / c.max;
        ctx.globalAlpha = Math.max(0, 1 - Math.pow(progress, 1.4));
        ctx.fillStyle = c.col;
        drawCustomShape(ctx, c.customShape || (c.shape ? 'rect' : 'circle'), c.s, c.col);
        ctx.restore();
      }
    };

    window.burst = function (x, y, combo = 1) {
      if (!fxOn) return;
      const themeConfig = THEME_PALETTES[skin] || THEME_PALETTES.default;
      const count = Math.min(72, 36 + (combo > 1 ? (combo - 1) * 8 : 0));
      for (let i = 0; i < count; i++) {
        const a = r(0, TAU2);
        const v = r(2.5, 7.8 + Math.min(3, combo * 0.6));
        const customShape = themeConfig.shapes[i % themeConfig.shapes.length];
        const isFloaty = ['petal', 'leaf', 'maple', 'ginkgo', 'sakura', 'snowflake'].includes(customShape);
        fx.confetti.push({
          x, y,
          vx: Math.cos(a) * v,
          vy: Math.sin(a) * v - (isFloaty ? 1.9 : 3.2),
          a: r(0, TAU2),
          va: r(-0.22, 0.22),
          s: r(7, 13),
          col: themeConfig.cols[i % themeConfig.cols.length],
          customShape,
          shape: customShape === 'rect',
          life: 0,
          max: r(54, 90),
          gravity: isFloaty ? 0.085 : 0.17
        });
      }
      fx.topDirty = true;
      kickFx();
    };

    window.burstAt = function (el, combo = 1) {
      if (!el) return;
      const rct = el.getBoundingClientRect();
      window.burst(rct.left + rct.width / 2, rct.top + Math.min(rct.height, 40) / 2, combo);
    };
  }

  const THEME_TITLES = {
    sakura: '🌸 滿園春櫻綻放', forest: '🌲 蒼翠森林成蔭', snow: '❄️ 銀裝冰晶雪原', ocean: '🫧 蔚藍珊瑚秘境',
    candy: '🍬 甜蜜甜點工坊', galaxy: '🪐 浩瀚星河長明', matcha: '🍵 宇治茶席飄香', coffee: '☕ 醇香拿鐵滿室',
    sunset: '🏮 暮色天燈祈願', aurora: '🌌 極地光幕璀璨', neon: '⚡ 賽博能量滿載', autumn: '🍁 嵐山金秋似錦',
    rain: '🏙️ 雨夜萬家燈火', ink: '🖌️ 水墨寒梅生香', desert: '🌵 金沙綠洲繁盛', lavender: '💜 普羅旺斯花海',
    night: '⭐ 璀璨星座連軌', default: '🌱 晨曦花園盛放'
  };

  function relabel() {
    const el = document.getElementById('rSkyMeta'); if (!el) return;
    if (window.PACE_KEEP_ORIGINAL_WORDS && (skin === 'default' || skin === 'night')) return;
    const [pill, count] = el.querySelectorAll('span');
    const u = window.paceUnit();
    const g = /(\d+)%/.exec(pill?.textContent || '');
    const n = /(\d+)/.exec(count?.textContent || '');
    const rateVal = g ? parseInt(g[1], 10) : 0;
    if (pill && g) {
      pill.textContent = u.measure + ' ' + g[1] + '%';
      if (rateVal >= 100) {
        pill.classList.add('pace-all-done');
        pill.style.background = 'var(--accent)';
        pill.style.color = 'var(--accent-on, #fff)';
        pill.style.fontWeight = '700';
      }
    }
    if (count && n) {
      const t = document.createElement('span');
      t.textContent = u.count(n[1]);
      count.replaceChildren(u.icon + ' ', t);
    }
    let badge = el.querySelector('.pace-sky-badge');
    if (rateVal >= 100) {
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'glow-pill pace-sky-badge';
        badge.style.marginLeft = '6px';
        badge.style.animation = 'pace-badge-pop 400ms cubic-bezier(.2,.9,.3,1.3)';
        el.appendChild(badge);
      }
      badge.textContent = THEME_TITLES[skin] || '🏆 完美達標';
    } else if (badge) {
      badge.remove();
    }
  }
  if (typeof renderReview === 'function') {
    const review0 = renderReview;
    window.renderReview = function (...a) { const r = review0.apply(this, a); try { relabel(); } catch (e) {} return r; };
  }
  const apply0 = applySkin;
  window.applySkin = function () { apply0(); try { relabel(); window.paceGroupRefresh?.(); } catch (e) {} };

  let saved = null; try { saved = localStorage.getItem(SKIN_KEY); } catch (e) {}
  if (NEW.some(s => s.id === saved) && skin !== saved) skin = saved;
  applySkin();
  if (typeof syncSkinFromConfig === 'function') syncSkinFromConfig();
})();
