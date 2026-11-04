/* 步調 Pace: the weekly report's 「夜空」 becomes the scene of the current theme.
   Every finished block is one thing that grows in that theme: a tree in 森林, a flower in 櫻花, a bubble in 海洋, a cup of tea in 抹茶,
   a lit lamp in 霓虹, a sunset glow in 夕陽, a lavender bunch in 薰衣草, an aurora ribbon in 極光, a snowflake in 雪地, a cup of coffee in 咖啡.
   A block whose time has passed without being done is the withered / empty / popped version, one still to come is a dashed outline.
   drawSky() belongs to A (and so to C); it is wrapped here, and 星空 stays A's own sky. Loaded after c-skins.js. */
(() => {
  if (typeof drawSky !== 'function' || typeof skin === 'undefined' || typeof blockEnd !== 'function') return;
  const keepOriginal = !!window.PACE_KEEP_ORIGINAL_WORDS;   // A keeps its own sky for the default and the night theme
  const TAU = 6.2832, clamp = (v, a, b) => Math.max(a, Math.min(b, v)), easeOut = x => 1 - Math.pow(1 - clamp(x, 0, 1), 3);
  const back = x => { x = clamp(x, 0, 1); const c = 1.7; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };   // a little overshoot, like something growing
  const dashed = (ctx, on) => ctx.setLineDash(on ? [3, 3] : []);

  /* each theme: background colours (top, middle, bottom), whether it is dark, text colour, and how its three states are drawn */
  const SCENES = {
    default: { bg: ['#f6f8fb', '#eaf0f7', '#dde6f1'], dark: false, label: '#5c6878',
      done(c, x, y, s, a, t) { const w = s * .9 * a; c.fillStyle = '#2f7a5b'; c.beginPath(); c.roundRect(x - w / 2, y - w / 2, w, w, 3); c.fill(); },
      missed(c, x, y, s) { c.strokeStyle = '#c2372c'; c.lineWidth = 1.2; c.beginPath(); c.roundRect(x - s * .45, y - s * .45, s * .9, s * .9, 3); c.stroke(); },
      future(c, x, y, s) { c.strokeStyle = '#8a98aa'; dashed(c, 1); c.beginPath(); c.roundRect(x - s * .45, y - s * .45, s * .9, s * .9, 3); c.stroke(); dashed(c, 0); } },
    sakura: { bg: ['#fff3f6', '#fde0e8', '#f9c9d6'], dark: false, label: '#8f4a60',
      done(c, x, y, s, a, t, i) { const r = s * .55 * a, sw = Math.sin(t * .0012 + i) * .12; c.save(); c.translate(x, y); c.rotate(sw);
        for (let k = 0; k < 5; k++) { c.rotate(TAU / 5); c.fillStyle = k % 2 ? '#f7a8bd' : '#fbc3d2'; c.beginPath(); c.ellipse(0, -r * .62, r * .42, r * .62, 0, 0, TAU); c.fill(); }
        c.fillStyle = '#f2c14e'; c.beginPath(); c.arc(0, 0, r * .22, 0, TAU); c.fill(); c.restore(); },
      missed(c, x, y, s) { c.strokeStyle = '#c98a9a'; c.lineWidth = 1.2; c.fillStyle = 'rgba(194,55,44,.12)'; c.beginPath(); c.ellipse(x, y, s * .22, s * .32, .3, 0, TAU); c.fill(); c.stroke(); },
      future(c, x, y, s) { c.strokeStyle = '#d7a3b3'; dashed(c, 1); c.beginPath(); c.ellipse(x, y, s * .22, s * .32, .3, 0, TAU); c.stroke(); dashed(c, 0); } },
    ocean: { bg: ['#d6f1fc', '#a9dcf2', '#6fb7dc'], dark: false, label: '#0e4a6b',
      done(c, x, y, s, a, t, i) { const r = s * .45 * a, fy = Math.sin(t * .001 + i * 1.3) * 3 - (t * .004 + i * 17) % 6; c.save(); c.translate(x, y + fy);
        c.strokeStyle = 'rgba(255,255,255,.9)'; c.fillStyle = 'rgba(255,255,255,.22)'; c.lineWidth = 1.3; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill(); c.stroke();
        c.fillStyle = 'rgba(255,255,255,.8)'; c.beginPath(); c.arc(-r * .35, -r * .35, r * .22, 0, TAU); c.fill(); c.restore(); },
      missed(c, x, y, s) { c.strokeStyle = 'rgba(194,55,44,.7)'; c.lineWidth = 1.2; c.beginPath(); c.arc(x, y, s * .4, .3, 2.2); c.stroke(); c.beginPath(); c.arc(x, y, s * .4, 3.4, 5.3); c.stroke(); },
      future(c, x, y, s) { c.strokeStyle = 'rgba(255,255,255,.8)'; dashed(c, 1); c.beginPath(); c.arc(x, y, s * .4, 0, TAU); c.stroke(); dashed(c, 0); } },
    matcha: { bg: ['#f1f5e2', '#e0eac4', '#cddca6'], dark: false, label: '#4a5c34',
      done(c, x, y, s, a, t, i) { const w = s * .8 * a, h = w * .62; c.save(); c.translate(x, y + h * .2);
        c.fillStyle = '#6b9a4b'; c.beginPath(); c.moveTo(-w / 2, -h / 2); c.lineTo(w / 2, -h / 2); c.quadraticCurveTo(w / 2, h / 2, 0, h / 2); c.quadraticCurveTo(-w / 2, h / 2, -w / 2, -h / 2); c.fill();
        c.fillStyle = '#a7c67e'; c.beginPath(); c.ellipse(0, -h / 2, w / 2, h * .16, 0, 0, TAU); c.fill();
        c.strokeStyle = 'rgba(80,110,55,.55)'; c.lineWidth = 1.2; c.lineCap = 'round';
        for (let k = -1; k <= 1; k += 2) { c.beginPath(); for (let j = 0; j <= 6; j++) { const yy = -h / 2 - j * 2.6 * a, xx = k * w * .16 + Math.sin(t * .003 + j * .9 + i) * 1.8; j ? c.lineTo(xx, yy) : c.moveTo(xx, yy); } c.stroke(); }
        c.restore(); },
      missed(c, x, y, s) { const w = s * .7, h = w * .62; c.strokeStyle = '#b05a4a'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x - w / 2, y - h / 2); c.lineTo(x + w / 2, y - h / 2); c.quadraticCurveTo(x + w / 2, y + h / 2, x, y + h / 2); c.quadraticCurveTo(x - w / 2, y + h / 2, x - w / 2, y - h / 2); c.stroke(); },
      future(c, x, y, s) { const w = s * .7, h = w * .62; c.strokeStyle = '#8fa56f'; dashed(c, 1); c.beginPath(); c.moveTo(x - w / 2, y - h / 2); c.lineTo(x + w / 2, y - h / 2); c.quadraticCurveTo(x + w / 2, y + h / 2, x, y + h / 2); c.quadraticCurveTo(x - w / 2, y + h / 2, x - w / 2, y - h / 2); c.stroke(); dashed(c, 0); } },
    neon: { bg: ['#07070f', '#0c0c1c', '#14102c'], dark: true, label: '#86a0b5',
      done(c, x, y, s, a, t, i) { const col = i % 3 ? '0,229,255' : '255,61,129', f = .78 + .22 * Math.sin(t * .006 + i * 2.1), r = s * .3 * a;
        const g = c.createRadialGradient(x, y, 0, x, y, r * 3.2); g.addColorStop(0, 'rgba(' + col + ',' + (.55 * f) + ')'); g.addColorStop(1, 'rgba(' + col + ',0)'); c.fillStyle = g; c.beginPath(); c.arc(x, y, r * 3.2, 0, TAU); c.fill();
        c.fillStyle = 'rgba(' + col + ',' + f + ')'; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); },
      missed(c, x, y, s) { c.strokeStyle = 'rgba(255,61,129,.45)'; c.lineWidth = 1; c.beginPath(); c.arc(x, y, s * .28, 0, TAU); c.stroke(); },
      future(c, x, y, s) { c.strokeStyle = 'rgba(134,160,181,.5)'; dashed(c, 1); c.beginPath(); c.arc(x, y, s * .28, 0, TAU); c.stroke(); dashed(c, 0); } },
    sunset: { bg: ['#ffd9b8', '#f2b3b8', '#c9a6d9'], dark: false, label: '#7a3f4a',
      done(c, x, y, s, a, t, i) { const r = s * .95 * a * (1 + .05 * Math.sin(t * .002 + i)); const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(255,236,170,.98)'); g.addColorStop(.45, 'rgba(255,170,90,.7)'); g.addColorStop(1, 'rgba(255,120,90,0)'); c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); },
      missed(c, x, y, s) { c.strokeStyle = 'rgba(160,60,70,.55)'; c.lineWidth = 1.2; c.beginPath(); c.arc(x, y, s * .38, 0, TAU); c.stroke(); },
      future(c, x, y, s) { c.strokeStyle = 'rgba(255,255,255,.85)'; dashed(c, 1); c.beginPath(); c.arc(x, y, s * .38, 0, TAU); c.stroke(); dashed(c, 0); } },
    forest: { bg: ['#0b1511', '#10241b', '#173326'], dark: true, label: '#95b09c', ground: '#0d1f17',
      done(c, x, y, s, a, t, i) { const h = s * 1.25 * a, sw = Math.sin(t * .0015 + i * 1.7) * .05; c.save(); c.translate(x, y + s * .6); c.rotate(sw);
        c.fillStyle = '#6b4b32'; c.fillRect(-s * .06, -h * .35, s * .12, h * .35);
        c.fillStyle = '#2f7d48'; c.beginPath(); c.moveTo(0, -h); c.lineTo(s * .42, -h * .3); c.lineTo(-s * .42, -h * .3); c.closePath(); c.fill();
        c.fillStyle = '#3f9d5a'; c.beginPath(); c.moveTo(0, -h * .78); c.lineTo(s * .5, -h * .2); c.lineTo(-s * .5, -h * .2); c.closePath(); c.fill(); c.restore(); },
      missed(c, x, y, s) { c.save(); c.translate(x, y + s * .6); c.strokeStyle = '#8a6a52'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -s * .8); c.moveTo(0, -s * .45); c.lineTo(s * .22, -s * .65); c.moveTo(0, -s * .55); c.lineTo(-s * .2, -s * .72); c.stroke(); c.restore(); },
      future(c, x, y, s) { c.save(); c.translate(x, y + s * .6); c.strokeStyle = '#5f8a6c'; dashed(c, 1); c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -s * .3); c.moveTo(-s * .12, -s * .42); c.lineTo(0, -s * .3); c.lineTo(s * .12, -s * .42); c.stroke(); dashed(c, 0); c.restore(); } },
    lavender: { bg: ['#f1e9fc', '#e3d6f7', '#d2c0f0'], dark: false, label: '#5a4a80',
      done(c, x, y, s, a, t, i) { const h = s * 1.05 * a, sw = Math.sin(t * .0016 + i) * .06; c.save(); c.translate(x, y + s * .5); c.rotate(sw);
        for (let k = -1; k <= 1; k++) { c.strokeStyle = '#6f8f5a'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(k * 2, 0); c.lineTo(k * s * .16, -h); c.stroke();
          for (let j = 0; j < 5; j++) { c.fillStyle = j % 2 ? '#8a63d2' : '#a98be0'; c.beginPath(); c.ellipse(k * s * .16 * (j / 5 + .2), -h * (.45 + j * .11), s * .07, s * .1, 0, 0, TAU); c.fill(); } }
        c.restore(); },
      missed(c, x, y, s) { c.save(); c.translate(x, y + s * .5); c.strokeStyle = '#a89a8a'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(s * .1, -s * .4, s * .25, -s * .5); c.stroke(); c.restore(); },
      future(c, x, y, s) { c.save(); c.translate(x, y + s * .5); c.strokeStyle = '#a58fd0'; dashed(c, 1); c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -s * .6); c.stroke(); dashed(c, 0); c.restore(); } },
    aurora: { bg: ['#07182a', '#06101d', '#050d16'], dark: true, label: '#8fb4b4', stars: true,
      done(c, x, y, s, a, t, i) { const cols = ['52,211,153', '94,234,212', '167,139,250'], col = cols[i % 3], h = (28 + s * 2.4) * a, w = 5 + s * .18; const g = c.createLinearGradient(0, 6, 0, 6 + h);
        g.addColorStop(0, 'rgba(' + col + ',0)'); g.addColorStop(.35, 'rgba(' + col + ',.75)'); g.addColorStop(1, 'rgba(' + col + ',0)'); c.fillStyle = g; c.beginPath();
        for (let j = 0; j <= 10; j++) { const yy = 6 + h * j / 10, xx = x - w + Math.sin(t * .0018 + j * .55 + i) * 5; j ? c.lineTo(xx, yy) : c.moveTo(xx, yy); }
        for (let j = 10; j >= 0; j--) c.lineTo(x + w + Math.sin(t * .0018 + j * .55 + i) * 5, 6 + h * j / 10); c.closePath(); c.fill(); },
      missed(c, x, y, s) { c.strokeStyle = 'rgba(255,154,168,.5)'; c.lineWidth = 1; c.beginPath(); c.moveTo(x, 12); c.lineTo(x, 12 + s * .8); c.stroke(); },
      future(c, x, y, s) { c.strokeStyle = 'rgba(143,180,180,.55)'; dashed(c, 1); c.beginPath(); c.moveTo(x, 12); c.lineTo(x, 12 + s * .8); c.stroke(); dashed(c, 0); } },
    snow: { bg: ['#f4f9fd', '#dbe9f5', '#c5d9ea'], dark: false, label: '#3f5a73', snowy: true,
      done(c, x, y, s, a, t, i) { const r = s * .5 * a, fy = Math.sin(t * .0012 + i) * 2.5; c.save(); c.translate(x, y + fy); c.rotate(t * .0003 + i); c.strokeStyle = '#5f9bd0'; c.lineWidth = 1.3; c.lineCap = 'round';
        for (let k = 0; k < 3; k++) { c.rotate(TAU / 6); c.beginPath(); c.moveTo(-r, 0); c.lineTo(r, 0); c.stroke(); c.beginPath(); c.moveTo(r * .55, -r * .22); c.lineTo(r * .8, 0); c.lineTo(r * .55, r * .22); c.stroke(); c.beginPath(); c.moveTo(-r * .55, -r * .22); c.lineTo(-r * .8, 0); c.lineTo(-r * .55, r * .22); c.stroke(); }
        c.restore(); },
      missed(c, x, y, s) { c.fillStyle = 'rgba(194,55,44,.35)'; c.beginPath(); c.arc(x, y, s * .13, 0, TAU); c.fill(); },
      future(c, x, y, s) { c.strokeStyle = '#8fb0cc'; dashed(c, 1); c.beginPath(); c.arc(x, y, s * .3, 0, TAU); c.stroke(); dashed(c, 0); } },
    coffee: { bg: ['#f6ecdd', '#ead9c0', '#dcc4a2'], dark: false, label: '#6a4d35',
      done(c, x, y, s, a, t, i) { const w = s * .8 * a, h = w * .7; c.save(); c.translate(x, y + h * .15);
        c.fillStyle = '#fffaf3'; c.strokeStyle = '#7b5230'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-w / 2, -h / 2); c.lineTo(w / 2, -h / 2); c.lineTo(w * .38, h / 2); c.lineTo(-w * .38, h / 2); c.closePath(); c.fill(); c.stroke();
        c.beginPath(); c.arc(w / 2 + 1, -h * .05, h * .28, -1.4, 1.4); c.stroke();
        c.fillStyle = '#5b3a22'; c.beginPath(); c.ellipse(0, -h / 2, Math.max(.1, w / 2 - 1), Math.max(.1, h * .13), 0, 0, TAU); c.fill();
        c.strokeStyle = 'rgba(123,82,48,.5)'; c.lineCap = 'round';
        for (let k = -1; k <= 1; k += 2) { c.beginPath(); for (let j = 0; j <= 6; j++) { const yy = -h / 2 - 3 - j * 2.8 * a, xx = k * w * .14 + Math.sin(t * .003 + j + i * 2) * 2; j ? c.lineTo(xx, yy) : c.moveTo(xx, yy); } c.stroke(); }
        c.restore(); },
      missed(c, x, y, s) { const w = s * .7, h = w * .7; c.strokeStyle = '#b05a4a'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x - w / 2, y - h / 2); c.lineTo(x + w / 2, y - h / 2); c.lineTo(x + w * .38, y + h / 2); c.lineTo(x - w * .38, y + h / 2); c.closePath(); c.stroke(); },
      future(c, x, y, s) { const w = s * .7, h = w * .7; c.strokeStyle = '#a58a6a'; dashed(c, 1); c.beginPath(); c.moveTo(x - w / 2, y - h / 2); c.lineTo(x + w / 2, y - h / 2); c.lineTo(x + w * .38, y + h / 2); c.lineTo(x - w * .38, y + h / 2); c.closePath(); c.stroke(); dashed(c, 0); } }
  };
  const ROT = (c, x, y, a) => { c.save(); c.translate(x, y); c.rotate(a); };
  const PLANET = [['#e9d5ff', '#7c3aed'], ['#bae6fd', '#1d4ed8'], ['#fecdd3', '#be123c'], ['#fde68a', '#b45309']], CAND = ['#ff7eb6', '#6ec5ff', '#ffc94d', '#7ed9a8'], LEAVES = ['#d9541e', '#e8892b', '#b8421a', '#e3a21a'];
  const maple = (c, r) => { c.beginPath(); for (let k = 0; k < 10; k++) { const an = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? r * .45 : r; c.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); } c.closePath(); };
  Object.assign(SCENES, {
    desert: { bg: ['#fde9c4', '#f6cf92', '#e9b66c'], dark: false, label: '#6e4a22', ground: '#dca45a',
      done(c, x, y, s, a, t, i) { const h = s * 1.2 * a; c.save(); c.translate(x, y + s * .6); c.fillStyle = '#3f8a52';
        c.beginPath(); c.roundRect(-s * .1, -h, s * .2, h, s * .1); c.fill();
        c.beginPath(); c.roundRect(-s * .34, -h * .62, s * .12, h * .3, s * .06); c.fill(); c.beginPath(); c.roundRect(-s * .34, -h * .4, s * .3, s * .1, s * .05); c.fill();
        c.beginPath(); c.roundRect(s * .22, -h * .78, s * .12, h * .3, s * .06); c.fill(); c.beginPath(); c.roundRect(s * .04, -h * .55, s * .3, s * .1, s * .05); c.fill();
        if (a > .9) { c.fillStyle = '#f472b6'; c.beginPath(); c.arc(0, -h, s * .07, 0, TAU); c.fill(); } c.restore(); },
      missed(c, x, y, s) { c.save(); c.translate(x, y + s * .6); c.strokeStyle = '#a9824f'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -s * .75); c.moveTo(0, -s * .4); c.lineTo(-s * .22, -s * .3); c.moveTo(0, -s * .55); c.lineTo(s * .2, -s * .45); c.stroke(); c.restore(); },
      future(c, x, y, s) { c.save(); c.translate(x, y + s * .6); c.strokeStyle = '#a07d4a'; dashed(c, 1); c.beginPath(); c.roundRect(-s * .08, -s * .5, s * .16, s * .5, s * .08); c.stroke(); dashed(c, 0); c.restore(); } },
    candy: { bg: ['#fff0f6', '#ffe0ee', '#dbeaff'], dark: false, label: '#8a3a66',
      done(c, x, y, s, a, t, i) { const r = s * .34 * a, col = CAND[i % 4]; ROT(c, x, y, Math.sin(t * .0015 + i) * .15 + i * .5);
        c.fillStyle = col; c.beginPath(); c.moveTo(-r * .8, 0); c.lineTo(-r * 1.7, -r * .6); c.lineTo(-r * 1.7, r * .6); c.closePath(); c.fill();
        c.beginPath(); c.moveTo(r * .8, 0); c.lineTo(r * 1.7, -r * .6); c.lineTo(r * 1.7, r * .6); c.closePath(); c.fill();
        c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill(); c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = Math.max(1, r * .22); c.beginPath(); c.arc(0, 0, r * .55, -2.4, -.6); c.stroke(); c.restore(); },
      missed(c, x, y, s) { c.strokeStyle = '#c98aa8'; c.fillStyle = 'rgba(194,55,44,.1)'; c.lineWidth = 1.2; c.beginPath(); c.arc(x, y, s * .3, 0, TAU); c.fill(); c.stroke(); },
      future(c, x, y, s) { c.strokeStyle = '#d9a9c4'; dashed(c, 1); c.beginPath(); c.arc(x, y, s * .3, 0, TAU); c.stroke(); dashed(c, 0); } },
    galaxy: { bg: ['#07040f', '#120a2a', '#1e1245'], dark: true, label: '#a99bcf', stars: true,
      done(c, x, y, s, a, t, i) { const r = s * .32 * a, [lt, dk] = PLANET[i % 4], g = c.createRadialGradient(x - r * .35, y - r * .35, 0, x, y, r);
        g.addColorStop(0, lt); g.addColorStop(1, dk); c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
        if (i % 2 === 0) { ROT(c, x, y, -.4 + Math.sin(t * .0005 + i) * .06); c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 1.2; c.beginPath(); c.ellipse(0, 0, r * 1.7, r * .42, 0, 0, TAU); c.stroke(); c.restore(); } },
      missed(c, x, y, s) { c.strokeStyle = 'rgba(255,150,170,.5)'; c.lineWidth = 1; c.beginPath(); c.arc(x, y, s * .26, 0, TAU); c.stroke(); },
      future(c, x, y, s) { c.strokeStyle = 'rgba(169,155,207,.55)'; dashed(c, 1); c.beginPath(); c.arc(x, y, s * .26, 0, TAU); c.stroke(); dashed(c, 0); } },
    autumn: { bg: ['#fde7cf', '#f6c99a', '#e9a66d'], dark: false, label: '#7a3c18',
      done(c, x, y, s, a, t, i) { ROT(c, x, y, i * .9 + Math.sin(t * .0014 + i) * .12); c.fillStyle = LEAVES[i % 4]; maple(c, s * .48 * a); c.fill();
        c.strokeStyle = 'rgba(90,40,10,.45)'; c.lineWidth = 1; c.beginPath(); c.moveTo(0, s * .5 * a); c.lineTo(0, -s * .2 * a); c.stroke(); c.restore(); },
      missed(c, x, y, s, a, t, i) { ROT(c, x, y, i * .9); c.strokeStyle = '#9a6a4a'; c.fillStyle = 'rgba(150,110,80,.18)'; c.lineWidth = 1.1; maple(c, s * .4); c.fill(); c.stroke(); c.restore(); },
      future(c, x, y, s, a, t, i) { ROT(c, x, y, i * .9); c.strokeStyle = '#b07a52'; dashed(c, 1); maple(c, s * .4); c.stroke(); dashed(c, 0); c.restore(); } },
    rain: { bg: ['#0c1420', '#111d2b', '#17283a'], dark: true, label: '#8ea3b8', ground: '#0a111a',
      done(c, x, y, s, a, t, i) { const w = s * .5, h = s * .66, f = .85 + .15 * Math.sin(t * .004 + i * 2.3), g = c.createRadialGradient(x, y, 0, x, y, s * a);
        g.addColorStop(0, 'rgba(255,205,120,' + (.35 * f) + ')'); g.addColorStop(1, 'rgba(255,205,120,0)'); c.fillStyle = g; c.beginPath(); c.arc(x, y, s * a, 0, TAU); c.fill();
        c.fillStyle = 'rgba(255,214,130,' + f + ')'; c.beginPath(); c.roundRect(x - w / 2 * a, y - h / 2 * a, w * a, h * a, 2); c.fill();
        c.strokeStyle = 'rgba(60,45,20,.55)'; c.lineWidth = 1; c.beginPath(); c.moveTo(x, y - h / 2 * a); c.lineTo(x, y + h / 2 * a); c.moveTo(x - w / 2 * a, y); c.lineTo(x + w / 2 * a, y); c.stroke(); },
      missed(c, x, y, s) { const w = s * .5, h = s * .66; c.fillStyle = 'rgba(255,255,255,.04)'; c.strokeStyle = 'rgba(255,140,140,.35)'; c.lineWidth = 1; c.beginPath(); c.roundRect(x - w / 2, y - h / 2, w, h, 2); c.fill(); c.stroke(); },
      future(c, x, y, s) { const w = s * .5, h = s * .66; c.strokeStyle = 'rgba(142,163,184,.55)'; dashed(c, 1); c.beginPath(); c.roundRect(x - w / 2, y - h / 2, w, h, 2); c.stroke(); dashed(c, 0); } },
    ink: { bg: ['#faf8f3', '#f1eee6', '#e7e3d8'], dark: false, label: '#5f5b52',
      done(c, x, y, s, a, t, i) { const r = s * .36 * Math.min(a, 1.1), st = -.9 + i * .7; c.strokeStyle = 'rgba(25,25,25,.86)'; c.lineCap = 'round'; c.lineWidth = Math.max(1.6, s * .11);
        c.beginPath(); c.arc(x, y, r, st, st + TAU * .86 * clamp(a, 0, 1)); c.stroke(); c.lineWidth = 1; },
      missed(c, x, y, s, a, t, i) { const st = -.9 + i * .7; c.strokeStyle = 'rgba(25,25,25,.28)'; c.lineWidth = 1; c.beginPath(); c.arc(x, y, s * .3, st, st + 2.4); c.stroke(); },
      future(c, x, y, s) { c.strokeStyle = 'rgba(100,95,85,.55)'; dashed(c, 1); c.beginPath(); c.arc(x, y, s * .3, 0, TAU); c.stroke(); dashed(c, 0); } }
  });
  window.PACE_SCENE_IDS = Object.keys(SCENES);
  const useScene = () => { if (keepOriginal && (skin === 'default' || skin === 'night')) return null; return SCENES[skin] || null; };

  /* what each theme calls the picture, for the card title, the picture's label and the line under it */
  const TEXT = {
    default: ['這週的進度', '每完成一個方塊，就填滿一格', '每完成一個方塊填滿一格，越久越大；紅框是時間過了沒做的，虛線是還沒到的。進度 = 這週完成 ÷ 每週目標。'],
    sakura: ['這週的花園', '每完成一個方塊就開一朵花', '每完成一個方塊開一朵花，越久越大；合起來的花苞是時間過了沒做的，虛線是還沒到的。花開 = 這週完成 ÷ 每週目標。'],
    ocean: ['這週的海底', '每完成一個方塊就冒出一顆氣泡', '每完成一個方塊冒出一顆氣泡，越久越大；破掉的圈是時間過了沒做的，虛線是還沒到的。潛水深度 = 這週完成 ÷ 每週目標。'],
    matcha: ['這週的茶席', '每完成一個方塊就泡好一杯茶', '每完成一個方塊泡一杯茶，越久越大；空杯是時間過了沒做的，虛線是還沒到的。茶香 = 這週完成 ÷ 每週目標。'],
    neon: ['這週的燈牆', '每完成一個方塊就點亮一盞燈', '每完成一個方塊點亮一盞燈，越久越亮；暗的圈是時間過了沒做的，虛線是還沒到的。電量 = 這週完成 ÷ 每週目標。'],
    sunset: ['這週的晚霞', '每完成一個方塊就收集一道晚霞', '每完成一個方塊收集一道晚霞，越久越大；淡淡的圈是時間過了沒做的，虛線是還沒到的。暖度 = 這週完成 ÷ 每週目標。'],
    forest: ['這週的森林', '每完成一個方塊就種下一棵樹', '每完成一個方塊種下一棵樹，越久越高；枯樹是時間過了沒做的，虛線的小苗是還沒到的。森林覆蓋 = 這週完成 ÷ 每週目標。'],
    lavender: ['這週的花田', '每完成一個方塊就採一束薰衣草', '每完成一個方塊長出一束薰衣草，越久越高；枯枝是時間過了沒做的，虛線是還沒到的。香氣 = 這週完成 ÷ 每週目標。'],
    aurora: ['這週的極光', '每完成一個方塊就出現一道極光', '每完成一個方塊出現一道極光，越久越長；細線是時間過了沒做的，虛線是還沒到的。極光強度 = 這週完成 ÷ 每週目標。'],
    snow: ['這週的雪地', '每完成一個方塊就落下一片雪花', '每完成一個方塊落下一片雪花，越久越大，地上的雪越積越高；灰點是時間過了沒做的，虛線是還沒到的。積雪 = 這週完成 ÷ 每週目標。'],
    coffee: ['這週的咖啡館', '每完成一個方塊就沖好一杯咖啡', '每完成一個方塊沖一杯咖啡，越久越大；空杯是時間過了沒做的，虛線是還沒到的。能量 = 這週完成 ÷ 每週目標。'],
    desert: ['這週的沙漠', '每完成一個方塊就長出一株仙人掌', '每完成一個方塊長出一株仙人掌，越久越高；枯枝是時間過了沒做的，虛線的小苗是還沒到的。綠洲 = 這週完成 ÷ 每週目標。'],
    candy: ['這週的糖果罐', '每完成一個方塊就收集一顆糖果', '每完成一個方塊收集一顆糖果，越久越大；淡淡的圈是時間過了沒做的，虛線是還沒到的。甜度 = 這週完成 ÷ 每週目標。'],
    galaxy: ['這週的星系', '每完成一個方塊就拜訪一顆行星', '每完成一個方塊拜訪一顆行星，越久越大；細圈是時間過了沒做的，虛線是還沒到的。航行距離 = 這週完成 ÷ 每週目標。'],
    autumn: ['這週的楓林', '每完成一個方塊就飄下一片楓葉', '每完成一個方塊飄下一片楓葉，越久越大；褪色的葉子是時間過了沒做的，虛線是還沒到的。秋意 = 這週完成 ÷ 每週目標。'],
    rain: ['這週的雨夜城市', '每完成一個方塊就亮起一扇窗', '每完成一個方塊亮起一扇窗，越久越大；暗的窗是時間過了沒做的，虛線是還沒到的。燈火 = 這週完成 ÷ 每週目標。'],
    ink: ['這週的墨跡', '每完成一個方塊就寫下一個圓', '每完成一個方塊寫下一個圓，越久越大；淡淡的短弧是時間過了沒做的，虛線是還沒到的。墨色 = 這週完成 ÷ 每週目標。']
  };
  const original = { title: null, label: null, hint: null };
  function retext() {
    const card = document.getElementById('rSkyCard'); if (!card) return;
    const h = card.querySelector('h3'), cv = document.getElementById('rSky'), p = cv && cv.nextElementSibling;
    if (original.title === null) { original.title = h.textContent; original.label = cv.getAttribute('aria-label'); original.hint = p.textContent; }
    const t = useScene() && TEXT[skin];
    h.textContent = t ? t[0] : original.title; cv.setAttribute('aria-label', t ? t[1] : original.label); p.textContent = t ? t[2] : original.hint;
  }

  /* ---------- drawing ---------- */
  const sky0 = drawSky;
  window.drawSky = function (canvas, blocks, monday) {
    const sc = useScene();
    if (canvas.__scene) { cancelAnimationFrame(canvas.__scene.raf); clearTimeout(canvas.__scene.timer); canvas.__scene = null; }
    retext();
    if (!sc) return sky0(canvas, blocks, monday);
    const dpr = Math.min(2, window.devicePixelRatio || 1), W = canvas.clientWidth || 600, H = 200, now = new Date();
    canvas.width = W * dpr; canvas.height = H * dpr; canvas.style.height = H + 'px';
    let seed = 7; const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    for (let i = 0; i < 70; i++) { rnd(); rnd(); }   // the same random sequence the sky used, so blocks sit where they always did
    const items = blocks.map((b, i) => {
      const day = b.day, x = ((day + .5) / 7) * W + (rnd() - .5) * (W / 7) * .6, y = 12 + ((toMin(b.start) - START) / SPAN) * (H - 44), r = Math.max(2, Math.sqrt(b.minutes) * .55);
      const date = ymd(addDays(monday, b.day));
      return { i, x, y: sc.ground ? H - 40 - (y / H) * 14 : sc.snowy ? y : y, s: clamp(Math.sqrt(b.minutes) * 3.6, 16, 40), state: b.done ? 'done' : blockEnd(date, b) <= now ? 'missed' : 'future' };
    });
    const doneN = items.filter(it => it.state === 'done').length;
    const animate = typeof fxOn !== 'undefined' && fxOn && !(typeof reduceMotion !== 'undefined' && reduceMotion);
    const st = { canvas, raf: 0, timer: 0, t0: performance.now(), skin, last: 0 };
    canvas.__scene = st;
    const stars = sc.stars ? Array.from({ length: 70 }, () => ({ x: rnd() * W, y: rnd() * (H - 30), r: rnd() * 1.1 + .3, p: rnd() * 6.28 })) : null;
    const frame = ts => {
      st.raf = 0;
      if (!canvas.isConnected || canvas.__scene !== st || st.skin !== skin) return;
      if (canvas.offsetParent === null) { st.timer = setTimeout(() => { st.raf = requestAnimationFrame(frame); }, 400); return; }   // the report is not on screen
      if (animate && ts - st.last < 33) { st.raf = requestAnimationFrame(frame); return; }
      st.last = ts;
      const t = animate ? ts : 0, el = animate ? ts - st.t0 : 99999, c = canvas.getContext('2d');
      c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, W, H);
      const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, sc.bg[0]); g.addColorStop(.55, sc.bg[1]); g.addColorStop(1, sc.bg[2]); c.fillStyle = g; c.fillRect(0, 0, W, H);
      if (stars) for (const s of stars) { c.globalAlpha = .3 + .6 * Math.abs(Math.sin(t * .0015 + s.p)); c.fillStyle = '#fff'; c.beginPath(); c.arc(s.x, s.y, s.r, 0, TAU); c.fill(); }
      c.globalAlpha = 1;
      if (sc.ground) { c.fillStyle = sc.ground; c.fillRect(0, H - 32, W, 32); }
      if (sc.snowy) { const mh = 6 + Math.min(34, doneN * 3.2) * easeOut(el / 1200); c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(0, H); for (let x = 0; x <= W; x += 12) c.lineTo(x, H - 22 - mh * (.7 + .3 * Math.sin(x * .03))); c.lineTo(W, H); c.closePath(); c.fill(); }
      c.lineWidth = 1.2;
      for (const it of items) {
        const a = it.state === 'done' ? back((el - it.i * 55) / 750) : 1;
        if (a <= 0) continue;
        c.save(); c.globalAlpha = it.state === 'done' ? clamp(a * 1.4, 0, 1) : clamp((el - it.i * 20) / 300, 0, 1);
        try { sc[it.state](c, it.x, it.y, it.s, clamp(a, .02, 1.18), t, it.i); } catch (e) { /* one bad shape must not stop the picture */ }
        c.restore();
      }
      c.globalAlpha = .75; c.fillStyle = sc.label; c.font = '12px "Noto Sans TC", sans-serif'; c.textAlign = 'center';
      DAYN.forEach((n, i) => c.fillText('週' + n, ((i + .5) / 7) * W, H - 8)); c.globalAlpha = 1;
      if (animate || el < 1500) st.raf = requestAnimationFrame(frame);
    };
    st.raf = requestAnimationFrame(frame);
  };
  // a theme change: new title and words, and an open weekly report draws its new scene
  const apply1 = applySkin;
  window.applySkin = function () {
    apply1();
    try { retext(); if (typeof report !== 'undefined' && report.mode === 'week' && document.body.classList.contains('r')) renderReport(); } catch (e) {}
  };
})();
