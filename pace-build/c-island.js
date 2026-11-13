/* 步調 Pace: 「專注小島」 (Focus Island), the weekly reward. It replaces the wonder-building of c-mystery.js with two rules anyone can say in one breath:
     1. 每完成 1 個方塊，島上就多 1 樣東西（樹、小屋、池塘、風車、燈塔、熱氣球…到第 24 樣是彩虹，之後每個多一隻螢火蟲）。
     2. 每一天達標（完成當天計畫的 7 成），天上就亮 1 顆星；7 顆全亮會出現極光。
   Every Monday a new island starts (six kinds, in turn); an island with 10 things or more is kept in the album.
   Everything is worked out from the saved blocks, so every device shows the same island and un-ticking a block takes its thing away. */
(() => {
  if (typeof state === 'undefined' || typeof blocksInRange !== 'function') return;
  const SEEN = 'pace-wonder-seen';   // same key as before: a week already celebrated stays celebrated
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const KEEP = 10, FULL = 24;

  const ISLANDS = [
    { id: 'forest', name: '森林島', icon: '🌳', grass: ['#8fd16a', '#4f9a45'], leaf: ['#2f8f4e', '#49b265', '#7fd08a'], bloom: ['#ffd166', '#ff8fab', '#ffffff'], sky: ['#27306f', '#6a5aa8', '#f6a97e'] },
    { id: 'sakura', name: '櫻花島', icon: '🌸', grass: ['#a8dc8a', '#62a85a'], leaf: ['#f48fb1', '#f8bbd0', '#fde4ec'], bloom: ['#ff8fab', '#ffffff', '#ffd6e0'], sky: ['#3a2f73', '#a56bb0', '#ffc2a8'] },
    { id: 'maple', name: '楓葉島', icon: '🍁', grass: ['#c9c56a', '#8a9a3e'], leaf: ['#d9482b', '#f08a3c', '#f6c453'], bloom: ['#ffd166', '#f08a3c', '#fff3c4'], sky: ['#3b2a5e', '#b0577a', '#ffb36b'] },
    { id: 'snow', name: '雪松島', icon: '❄️', grass: ['#f2f8ff', '#b9cde6'], leaf: ['#2f6f6a', '#4b9a8f', '#e9f4ff'], bloom: ['#bfe3ff', '#ffffff', '#9ad0ff'], sky: ['#16224f', '#3f5fa8', '#b9c8f0'] },
    { id: 'tropic', name: '熱帶島', icon: '🏝️', grass: ['#9be07a', '#3fae6a'], leaf: ['#1f9d6b', '#38c48a', '#9af0b8'], bloom: ['#ff6b6b', '#ffd166', '#ff9f1c'], sky: ['#1d3b7a', '#3aa0c8', '#ffd08a'] },
    { id: 'lavender', name: '薰衣草島', icon: '💜', grass: ['#a9d98f', '#5fa06a'], leaf: ['#7a5cc8', '#9d84e0', '#cdbdf5'], bloom: ['#b39ddb', '#ffffff', '#e1bee7'], sky: ['#2a2468', '#7d62c0', '#f5b6c8'] }
  ];
  // the 24 things, in the order they appear. [kind, dx, dy, scale, 名稱]; dx/dy are measured from the middle of the island
  const THINGS = [
    ['tree', -122, -6, 1, '大樹'], ['bush', -58, 20, 1, '灌木'], ['house', 8, -4, 1, '小屋'], ['flowers', 72, 24, 1, '花叢'], ['tree', 132, -2, .9, '大樹'],
    ['pond', -22, 27, 1, '池塘'], ['rock', -152, 15, 1, '石頭'], ['pine', -92, -22, 1, '松樹'], ['sheep', 96, 8, 1, '小羊'], ['windmill', 70, -24, 1, '風車'],
    ['flowers', -112, 26, 1, '花叢'], ['tree', -40, -27, .85, '大樹'], ['lamp', 42, 22, 1, '路燈'], ['boat', -236, 58, 1, '小船'], ['lighthouse', 170, -12, 1, '燈塔'],
    ['mushroom', -4, 36, 1, '蘑菇'], ['pine', 112, -28, .9, '松樹'], ['tent', -168, -8, 1, '營火帳篷'], ['birds', 40, -150, 1, '海鷗'], ['balloon', -150, -118, 1, '熱氣球'],
    ['tree', 30, -33, .8, '大樹'], ['flowers', 132, 28, 1, '花叢'], ['sheep', -76, 3, 1, '小羊'], ['rainbow', 0, 0, 1, '彩虹']
  ];
  const MILESTONES = [[3, '🏠', '小屋'], [6, '💧', '池塘'], [10, '🌬️', '風車'], [15, '🗼', '燈塔'], [20, '🎈', '熱氣球'], [24, '🌈', '彩虹']];
  const islandOf = monStr => ISLANDS[Math.abs(Math.floor(new Date(monStr + 'T00:00:00').getTime() / (7 * 864e5))) % ISLANDS.length];

  /* ---------- the week, from saved blocks ---------- */
  const counted = b => (typeof counts === 'function' ? counts(b) : b.cat !== 'buffer');
  function weekFacts(mon, blocks) {
    const monStr = ymd(mon), byDay = Array.from({ length: 7 }, (_, i) => {
      const d = ymd(addDays(mon, i)), list = blocks.filter(b => b.date === d && !b.skipped && counted(b));
      const planned = list.reduce((a, b) => a + b.minutes, 0), done = list.filter(b => b.done).reduce((a, b) => a + b.minutes, 0);
      return { active: planned > 0 && done / planned >= .7 };
    });
    const things = blocks.filter(b => b.done && !b.skipped).length, stars = byDay.filter(d => d.active).length;
    return { monStr, island: islandOf(monStr), byDay, things, stars, kept: things >= KEEP };
  }
  async function getData(withAlbum) {
    if (!state.db) return null;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const mon = mondayOf(today), from = withAlbum ? addDays(mon, -7 * 52) : mon;
    const all = await blocksInRange(from, addDays(mon, 6)), album = [];
    const week = w => weekFacts(w, all.filter(b => b.date >= ymd(w) && b.date <= ymd(addDays(w, 6))));
    if (withAlbum) for (let w = new Date(from); w < mon; w = addDays(w, 7)) { const f = week(w); if (f.kept) album.push(f); }
    const now = week(mon); if (now.kept) album.push(now);
    return { ...now, album };
  }

  /* ---------- drawing ---------- */
  const TAU = Math.PI * 2;
  const ell = (c, x, y, rx, ry) => { c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU); };
  function glow(c, x, y, r, color, a = 1) { c.save(); c.globalAlpha = Math.max(0, Math.min(1, a)); c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); c.restore(); }
  const shadow = (c, x, y, rx) => { c.fillStyle = 'rgba(20, 40, 30, .18)'; ell(c, x, y, rx, rx * .28); c.fill(); };
  const DRAW = {
    tree(c, x, y, s, t, T, i) {
      const sw = Math.sin(t * .0015 + i) * 1.5 * s; shadow(c, x, y, 15 * s);
      c.fillStyle = '#7a5230'; c.beginPath(); c.roundRect(x - 3 * s, y - 20 * s, 6 * s, 21 * s, 2); c.fill();
      for (const [dx, dy, r, k] of [[-9, -28, 12, 0], [9, -27, 12, 0], [0, -37, 14, 1], [-3, -30, 9, 2]]) { c.fillStyle = T.leaf[k]; c.beginPath(); c.arc(x + dx * s + sw, y + dy * s, r * s, 0, TAU); c.fill(); }
    },
    pine(c, x, y, s, t, T, i) {
      const sw = Math.sin(t * .0013 + i) * s; shadow(c, x, y, 12 * s);
      c.fillStyle = '#6b4a2c'; c.fillRect(x - 2.5 * s, y - 8 * s, 5 * s, 9 * s);
      for (let k = 0; k < 3; k++) { c.fillStyle = T.id === 'snow' ? (k === 2 ? '#e9f4ff' : T.leaf[k]) : ['#1f6f4a', '#2c8a5b', '#3aa46e'][k]; c.beginPath(); c.moveTo(x + sw * k, y - (44 - k * 3) * s + k * 11 * s - 4 * s); c.lineTo(x - (15 - k * 3) * s, y - (8 + (2 - k) * 0) * s - (2 - k) * 9 * s); c.lineTo(x + (15 - k * 3) * s, y - 8 * s - (2 - k) * 9 * s); c.closePath(); c.fill(); }
    },
    bush(c, x, y, s, t, T) { shadow(c, x, y, 13 * s); for (const [dx, r, k] of [[-8, 8, 0], [7, 9, 1], [0, 10, 2]]) { c.fillStyle = T.leaf[k]; c.beginPath(); c.arc(x + dx * s, y - r * s * .8, r * s, 0, TAU); c.fill(); } },
    flowers(c, x, y, s, t, T, i) {
      for (let k = 0; k < 5; k++) { const fx = x + (k - 2) * 7 * s, h = (9 + (k % 2) * 5) * s, sw = Math.sin(t * .002 + k + i) * 1.5; c.strokeStyle = '#3f8f4a'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(fx, y); c.quadraticCurveTo(fx + sw, y - h * .6, fx + sw, y - h); c.stroke(); c.fillStyle = T.bloom[k % 3]; c.beginPath(); c.arc(fx + sw, y - h, 3.2 * s, 0, TAU); c.fill(); c.fillStyle = '#fff7c2'; c.beginPath(); c.arc(fx + sw, y - h, 1.2 * s, 0, TAU); c.fill(); }
    },
    rock(c, x, y, s) { shadow(c, x, y, 14 * s); c.fillStyle = '#9aa3ad'; c.beginPath(); c.moveTo(x - 13 * s, y); c.lineTo(x - 9 * s, y - 11 * s); c.lineTo(x + 2 * s, y - 15 * s); c.lineTo(x + 12 * s, y - 7 * s); c.lineTo(x + 14 * s, y); c.closePath(); c.fill(); c.fillStyle = '#c3cad2'; c.beginPath(); c.moveTo(x - 9 * s, y - 11 * s); c.lineTo(x + 2 * s, y - 15 * s); c.lineTo(x + 1 * s, y - 6 * s); c.closePath(); c.fill(); },
    mushroom(c, x, y, s) { for (const [dx, k] of [[-6, .8], [5, 1.1]]) { c.fillStyle = '#fff4e0'; c.fillRect(x + dx * s - 1.6 * k, y - 6 * k, 3.2 * k, 6 * k); c.fillStyle = '#e5484d'; c.beginPath(); c.ellipse(x + dx * s, y - 6 * k, 6 * k, 4.5 * k, 0, Math.PI, 0); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(x + dx * s - 2 * k, y - 8 * k, 1 * k, 0, TAU); c.arc(x + dx * s + 2.4 * k, y - 7.4 * k, .8 * k, 0, TAU); c.fill(); } },
    house(c, x, y, s, t) {
      shadow(c, x, y + 1, 26 * s);
      c.fillStyle = '#f6e7cf'; c.fillRect(x - 20 * s, y - 24 * s, 40 * s, 24 * s); c.fillStyle = '#e2cfae'; c.fillRect(x + 6 * s, y - 24 * s, 14 * s, 24 * s);
      c.fillStyle = '#c8553d'; c.beginPath(); c.moveTo(x - 25 * s, y - 23 * s); c.lineTo(x, y - 44 * s); c.lineTo(x + 25 * s, y - 23 * s); c.closePath(); c.fill();
      c.fillStyle = '#8d5a3b'; c.beginPath(); c.roundRect(x - 5 * s, y - 14 * s, 10 * s, 14 * s, [4, 4, 0, 0]); c.fill();
      const a = .75 + .25 * Math.sin(t * .003); glow(c, x + 13 * s, y - 14 * s, 12 * s, 'rgba(255, 214, 102, .8)', a); c.fillStyle = '#ffd666'; c.fillRect(x + 9 * s, y - 18 * s, 8 * s, 8 * s);
      c.fillStyle = '#9a6b4f'; c.fillRect(x + 10 * s, y - 46 * s, 6 * s, 12 * s);
      for (let k = 0; k < 3; k++) { const l = ((t * .02 + k * 20) % 60) / 60; c.fillStyle = 'rgba(255,255,255,' + (.5 * (1 - l)) + ')'; c.beginPath(); c.arc(x + 13 * s + Math.sin(l * 5 + k) * 4, y - 48 * s - l * 24, (3 + l * 5) * s, 0, TAU); c.fill(); }
    },
    pond(c, x, y, s, t) {
      const g = c.createLinearGradient(0, y - 8, 0, y + 8); g.addColorStop(0, '#8fdcff'); g.addColorStop(1, '#3aa0d8'); c.fillStyle = g; ell(c, x, y, 30 * s, 9 * s); c.fill();
      c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 1; const r = ((t * .01) % 20); c.globalAlpha = 1 - r / 20; ell(c, x - 6, y, r * s, r * .3 * s); c.stroke(); c.globalAlpha = 1;
      c.fillStyle = '#5cb85c'; ell(c, x + 12 * s, y + 2, 5 * s, 2 * s); c.fill(); c.fillStyle = '#ff8fab'; c.beginPath(); c.arc(x + 12 * s, y + 1, 1.6 * s, 0, TAU); c.fill();
    },
    sheep(c, x, y, s, t, T, i) {
      const hop = Math.max(0, Math.sin(t * .003 + i * 2)) * 2; shadow(c, x, y, 10 * s); y -= hop;
      c.fillStyle = '#3b3b45'; c.fillRect(x - 6 * s, y - 5 * s, 2 * s, 5 * s); c.fillRect(x + 4 * s, y - 5 * s, 2 * s, 5 * s);
      c.fillStyle = '#ffffff'; for (const [dx, dy, r] of [[-5, -9, 5.5], [3, -10, 6], [-1, -13, 5.5], [6, -8, 4.5]]) { c.beginPath(); c.arc(x + dx * s, y + dy * s, r * s, 0, TAU); c.fill(); }
      c.fillStyle = '#3b3b45'; ell(c, x - 10 * s, y - 10 * s, 4 * s, 3.4 * s); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(x - 11 * s, y - 11 * s, .9 * s, 0, TAU); c.fill();
    },
    windmill(c, x, y, s, t) {
      shadow(c, x, y, 16 * s);
      c.fillStyle = '#f3ead8'; c.beginPath(); c.moveTo(x - 11 * s, y); c.lineTo(x - 7 * s, y - 40 * s); c.lineTo(x + 7 * s, y - 40 * s); c.lineTo(x + 11 * s, y); c.closePath(); c.fill();
      c.fillStyle = '#d9c9a8'; c.beginPath(); c.moveTo(x + 3 * s, y); c.lineTo(x + 2 * s, y - 40 * s); c.lineTo(x + 7 * s, y - 40 * s); c.lineTo(x + 11 * s, y); c.closePath(); c.fill();
      c.fillStyle = '#b5523b'; c.beginPath(); c.moveTo(x - 9 * s, y - 40 * s); c.lineTo(x, y - 50 * s); c.lineTo(x + 9 * s, y - 40 * s); c.closePath(); c.fill();
      c.fillStyle = '#7a5230'; c.beginPath(); c.roundRect(x - 3 * s, y - 10 * s, 6 * s, 10 * s, [3, 3, 0, 0]); c.fill();
      c.save(); c.translate(x, y - 40 * s); c.rotate(t * .0012); for (let k = 0; k < 4; k++) { c.rotate(Math.PI / 2); c.strokeStyle = '#7a5230'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -24 * s); c.stroke(); c.fillStyle = 'rgba(255,255,255,.92)'; c.fillRect(1 * s, -24 * s, 7 * s, 16 * s); c.strokeStyle = 'rgba(122,82,48,.5)'; c.lineWidth = .6; c.strokeRect(1 * s, -24 * s, 7 * s, 16 * s); } c.restore();
      c.fillStyle = '#7a5230'; c.beginPath(); c.arc(x, y - 40 * s, 2.4 * s, 0, TAU); c.fill();
    },
    lamp(c, x, y, s, t) { c.fillStyle = '#4a4f5c'; c.fillRect(x - 1.2, y - 22 * s, 2.4, 22 * s); glow(c, x, y - 24 * s, 16 * s, 'rgba(255, 221, 128, .85)', .8 + .2 * Math.sin(t * .004)); c.fillStyle = '#ffe08a'; c.beginPath(); c.arc(x, y - 24 * s, 3.4 * s, 0, TAU); c.fill(); },
    tent(c, x, y, s, t) {
      shadow(c, x, y, 18 * s); c.fillStyle = '#f2994a'; c.beginPath(); c.moveTo(x - 16 * s, y); c.lineTo(x, y - 22 * s); c.lineTo(x + 16 * s, y); c.closePath(); c.fill(); c.fillStyle = '#c96a1f'; c.beginPath(); c.moveTo(x - 4 * s, y); c.lineTo(x, y - 22 * s); c.lineTo(x + 5 * s, y); c.closePath(); c.fill();
      const fx = x + 24 * s; for (let k = 0; k < 3; k++) glow(c, fx + Math.sin(t * .008 + k) * 1.5, y - 4 - k * 4, (8 - k * 2) * s, k ? 'rgba(255,221,102,.9)' : 'rgba(255,120,50,.9)', .85); c.strokeStyle = '#6b4a2c'; c.lineWidth = 2; c.beginPath(); c.moveTo(fx - 5, y); c.lineTo(fx + 5, y - 2); c.moveTo(fx + 5, y); c.lineTo(fx - 5, y - 2); c.stroke();
    },
    lighthouse(c, x, y, s, t) {
      shadow(c, x, y, 14 * s); c.fillStyle = '#8f98a3'; ell(c, x, y, 16 * s, 5 * s); c.fill();
      c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(x - 9 * s, y); c.lineTo(x - 6 * s, y - 46 * s); c.lineTo(x + 6 * s, y - 46 * s); c.lineTo(x + 9 * s, y); c.closePath(); c.fill();
      c.save(); c.beginPath(); c.moveTo(x - 9 * s, y); c.lineTo(x - 6 * s, y - 46 * s); c.lineTo(x + 6 * s, y - 46 * s); c.lineTo(x + 9 * s, y); c.clip(); c.fillStyle = '#e5484d'; c.fillRect(x - 10 * s, y - 16 * s, 20 * s, 8 * s); c.fillRect(x - 10 * s, y - 36 * s, 20 * s, 8 * s); c.fillStyle = 'rgba(0,0,0,.12)'; c.fillRect(x + 2 * s, y - 48 * s, 9 * s, 48 * s); c.restore();
      c.fillStyle = '#4a4f5c'; c.fillRect(x - 8 * s, y - 49 * s, 16 * s, 3 * s); c.fillStyle = '#ffe08a'; c.fillRect(x - 5 * s, y - 57 * s, 10 * s, 8 * s); c.fillStyle = '#e5484d'; c.beginPath(); c.moveTo(x - 7 * s, y - 57 * s); c.lineTo(x, y - 65 * s); c.lineTo(x + 7 * s, y - 57 * s); c.closePath(); c.fill();
      glow(c, x, y - 53 * s, 22 * s, 'rgba(255, 230, 140, .8)', .8);
      const a = Math.sin(t * .0009) * .6; c.save(); c.translate(x, y - 53 * s); c.rotate(Math.PI + a); c.globalCompositeOperation = 'lighter'; const g = c.createLinearGradient(0, 0, 170, 0); g.addColorStop(0, 'rgba(255, 236, 160, .55)'); g.addColorStop(1, 'rgba(255, 236, 160, 0)'); c.fillStyle = g; c.beginPath(); c.moveTo(0, -2); c.lineTo(170, -26); c.lineTo(170, 26); c.lineTo(0, 2); c.closePath(); c.fill(); c.restore();
    },
    boat(c, x, y, s, t) {
      const bob = Math.sin(t * .002) * 2, tilt = Math.sin(t * .002 + 1) * .05; c.save(); c.translate(x, y + bob); c.rotate(tilt);
      c.fillStyle = '#8d5a3b'; c.beginPath(); c.moveTo(-18 * s, 0); c.lineTo(18 * s, 0); c.lineTo(12 * s, 8 * s); c.lineTo(-12 * s, 8 * s); c.closePath(); c.fill();
      c.strokeStyle = '#6b4a2c'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -26 * s); c.stroke(); c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(1.5, -25 * s); c.lineTo(15 * s, -4 * s); c.lineTo(1.5, -4 * s); c.closePath(); c.fill(); c.fillStyle = '#ffd6d6'; c.beginPath(); c.moveTo(-1.5, -22 * s); c.lineTo(-11 * s, -4 * s); c.lineTo(-1.5, -4 * s); c.closePath(); c.fill(); c.restore();
    },
    birds(c, x, y, s, t) { c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 1.6; c.lineCap = 'round'; for (let k = 0; k < 3; k++) { const bx = x + k * 22 + Math.sin(t * .0006 + k) * 30, by = y + k * 9 + Math.sin(t * .002 + k * 2) * 4, w = 5 + Math.sin(t * .012 + k) * 2.5; c.beginPath(); c.moveTo(bx - 7, by - w); c.quadraticCurveTo(bx - 3, by - w - 2, bx, by); c.quadraticCurveTo(bx + 3, by - w - 2, bx + 7, by - w); c.stroke(); } },
    balloon(c, x, y, s, t) {
      const fy = Math.sin(t * .0012) * 6, fx = Math.sin(t * .0007) * 8; x += fx; y += fy;
      const cols = ['#ff6b6b', '#ffd166', '#4ecdc4', '#ffd166', '#ff6b6b']; c.save(); c.beginPath(); c.ellipse(x, y, 20 * s, 24 * s, 0, 0, TAU); c.clip(); cols.forEach((col, k) => { c.fillStyle = col; c.fillRect(x - 20 * s + k * 8 * s, y - 24 * s, 8 * s, 48 * s); }); const g = c.createRadialGradient(x - 7, y - 9, 2, x, y, 26 * s); g.addColorStop(0, 'rgba(255,255,255,.45)'); g.addColorStop(1, 'rgba(0,0,0,.18)'); c.fillStyle = g; c.fillRect(x - 22 * s, y - 26 * s, 44 * s, 52 * s); c.restore();
      c.strokeStyle = 'rgba(80,60,40,.7)'; c.lineWidth = 1; c.beginPath(); c.moveTo(x - 10 * s, y + 21 * s); c.lineTo(x - 5 * s, y + 33 * s); c.moveTo(x + 10 * s, y + 21 * s); c.lineTo(x + 5 * s, y + 33 * s); c.stroke(); c.fillStyle = '#a9713f'; c.beginPath(); c.roundRect(x - 6 * s, y + 33 * s, 12 * s, 8 * s, 2); c.fill();
    },
    rainbow(c, x, y, s, t) { c.save(); c.globalAlpha = .55 + .1 * Math.sin(t * .001); c.lineWidth = 5; ['#ff6b6b', '#ffa94d', '#ffd43b', '#69db7c', '#4dabf7', '#9775fa'].forEach((col, k) => { c.strokeStyle = col; c.beginPath(); c.ellipse(x, y + 6, 200 - k * 5, 150 - k * 5, 0, Math.PI, 0); c.stroke(); }); c.restore(); }
  };

  let raf = 0, active = null, bornAt = 0, showFull = false, showIsland = -1;
  function draw(canvas, d, ts) {
    const dpr = Math.min(2, window.devicePixelRatio || 1), W = canvas.clientWidth || 460, H = 290;
    if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) { canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); canvas.style.height = H + 'px'; }
    const c = canvas.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);
    const T = d.island, n = d.things, cx = W / 2, k = Math.min(1, (W - 20) / 520), gy = H - 78, seaY = H - 46;
    const sky = c.createLinearGradient(0, 0, 0, seaY); sky.addColorStop(0, T.sky[0]); sky.addColorStop(.6, T.sky[1]); sky.addColorStop(1, T.sky[2]); c.fillStyle = sky; c.fillRect(0, 0, W, H);
    glow(c, cx + W * .28, seaY - 6, 90, 'rgba(255, 236, 190, .55)'); c.fillStyle = '#fff3d6'; c.beginPath(); c.arc(cx + W * .28, seaY - 4, 17, 0, TAU); c.fill();   // the low sun
    // rule 2: one star for each day on target
    if (d.stars >= 7) for (let b = 0; b < 3; b++) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = .28 + .12 * Math.sin(ts * .001 + b); const g = c.createLinearGradient(0, 10, 0, 110); g.addColorStop(0, 'rgba(120,255,200,0)'); g.addColorStop(.5, ['rgba(120,255,200,.9)', 'rgba(140,200,255,.8)', 'rgba(200,150,255,.7)'][b]); g.addColorStop(1, 'rgba(120,255,200,0)'); c.fillStyle = g; c.beginPath(); c.moveTo(0, 30 + b * 14); for (let x = 0; x <= W; x += 20) c.lineTo(x, 34 + b * 14 + Math.sin(x * .012 + ts * .0006 + b * 2) * 14); for (let x = W; x >= 0; x -= 20) c.lineTo(x, 84 + b * 12 + Math.sin(x * .01 + ts * .0005 + b) * 16); c.closePath(); c.fill(); c.restore(); }
    for (let i = 0; i < 7; i++) {
      const sx = cx + (i - 3) * Math.min(52, W / 9), sy = 30 + Math.abs(i - 3) * 6, on = !!d.byDay[i]?.active;
      if (on) { const tw = .75 + .25 * Math.sin(ts * .003 + i); glow(c, sx, sy, 16, 'rgba(255, 240, 170, .9)', tw); c.fillStyle = '#fff6c4'; c.beginPath(); for (let p = 0; p < 10; p++) { const r = p % 2 ? 2.6 : 6.5, a = p * Math.PI / 5 - Math.PI / 2; c.lineTo(sx + Math.cos(a) * r, sy + Math.sin(a) * r); } c.closePath(); c.fill(); }
      else { c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 1; c.setLineDash([2, 2]); c.beginPath(); c.arc(sx, sy, 4, 0, TAU); c.stroke(); c.setLineDash([]); }
    }
    const age = i => i === n - 1 && bornAt ? Math.min(1, (ts - bornAt) / 600) : 1;   // the newest thing pops in
    const pop = a => a >= 1 ? 1 : 1 + .25 * Math.sin(a * Math.PI) - (1 - a) * (1 - a);
    const put = i => { const [kind, dx, dy, s] = THINGS[i], a = age(i), sc = s * k * Math.max(.01, pop(a)); DRAW[kind](c, cx + dx * k, gy + dy * k * .9, sc, ts, T, i); };
    if (n >= FULL) put(FULL - 1);                                                                 // the rainbow stands behind everything
    // sea, then the island
    const sea = c.createLinearGradient(0, seaY, 0, H); sea.addColorStop(0, '#5cc0e8'); sea.addColorStop(1, '#2a7fb8'); c.fillStyle = sea; c.fillRect(0, seaY, W, H - seaY);
    c.fillStyle = 'rgba(255, 236, 190, .35)'; c.beginPath(); c.moveTo(cx + W * .28 - 26, seaY); c.lineTo(cx + W * .28 + 26, seaY); c.lineTo(cx + W * .28 + 60, H); c.lineTo(cx + W * .28 - 60, H); c.closePath(); c.fill();
    c.fillStyle = '#f5e2b5'; ell(c, cx, gy + 26 * k, 232 * k, 34 * k); c.fill();                    // beach
    c.fillStyle = '#b98a5a'; ell(c, cx, gy + 14 * k, 204 * k, 40 * k); c.fill();                    // earth edge
    const gg = c.createLinearGradient(0, gy - 44 * k, 0, gy + 44 * k); gg.addColorStop(0, T.grass[0]); gg.addColorStop(1, T.grass[1]); c.fillStyle = gg; ell(c, cx, gy + 4 * k, 204 * k, 42 * k); c.fill();
    c.fillStyle = 'rgba(255,255,255,.16)'; ell(c, cx - 50 * k, gy - 10 * k, 110 * k, 16 * k); c.fill();
    const ground = []; for (let i = 0; i < Math.min(n, FULL - 1); i++) if (!['boat', 'birds', 'balloon', 'rainbow'].includes(THINGS[i][0])) ground.push(i);
    ground.sort((a, b) => THINGS[a][2] - THINGS[b][2]).forEach(put);
    for (let w = 0; w < 2; w++) { c.fillStyle = w ? 'rgba(255,255,255,.5)' : 'rgba(255,255,255,.28)'; c.beginPath(); c.moveTo(0, H); for (let x = 0; x <= W; x += 12) c.lineTo(x, H - 20 + w * 9 + Math.sin(x * .05 + ts * .0015 * (w ? 1 : -1)) * 2.5); c.lineTo(W, H); c.closePath(); c.fill(); }
    for (let i = 0; i < Math.min(n, FULL - 1); i++) if (['boat', 'birds', 'balloon'].includes(THINGS[i][0])) put(i);
    for (let f = 0; f < Math.min(16, n - FULL); f++) { const fx = cx + Math.sin(f * 2.4 + ts * .0004 * (1 + f % 3)) * 190 * k, fy = gy - 30 - (f * 13 % 70) + Math.sin(ts * .002 + f) * 8; glow(c, fx, fy, 7, 'rgba(210, 255, 150, .95)', .5 + .5 * Math.sin(ts * .004 + f * 1.7)); }
    if (!n) { c.fillStyle = 'rgba(255,255,255,.9)'; c.font = '600 14px system-ui, sans-serif'; c.textAlign = 'center'; c.fillText('完成第一個方塊，島上就會長出第一棵樹', cx, gy - 40); }
  }
  function loop() {
    cancelAnimationFrame(raf);
    const step = ts => {
      const dlg = $('wonderDlg'), cv = $('wonderCanvas'); if (!dlg?.open || !cv || !active) return;
      if (bornAt === -1) bornAt = ts;
      draw(cv, active, ts);
      if ((typeof fxOn === 'undefined' || fxOn) && !(typeof reduceMotion !== 'undefined' && reduceMotion)) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }

  /* ---------- the button and the dialog ---------- */
  const btn = Object.assign(document.createElement('button'), { type: 'button', className: 'btn wonder-nav-btn', id: 'wonderBtn', title: '這週的專注小島' });
  btn.innerHTML = '<span class="wonder-ico">🏝️</span><span class="wonder-lbl">本週小島</span><span class="isl-n" id="islBtnN"></span>';
  const host = $('xpQuestTxt'), fallback = $('skinBtn');
  if (host) host.after(btn); else if (fallback) fallback.before(btn); else return;
  document.body.insertAdjacentHTML('beforeend',
    '<dialog id="wonderDlg" class="isl-dlg" aria-labelledby="wonderTitle"><form method="dialog">' +
      '<div class="isl-head"><div class="dtitle" id="wonderTitle">🏝️ 專注小島</div><span class="isl-pill" id="islName"></span></div>' +
      '<div class="isl-rules"><span><b>1</b> 每完成 1 個方塊，島上多 1 樣東西</span><span><b>2</b> 每天達標，天上亮 1 顆星 ⭐</span></div>' +
      '<div class="isl-canvas"><canvas id="wonderCanvas" aria-label="這週的小島"></canvas><span class="isl-tag" id="islTag"></span></div>' +
      '<p class="isl-next" id="islNext" aria-live="polite"></p>' +
      '<div class="isl-miles" id="islMiles" aria-label="里程碑"></div>' +
      '<div class="isl-stars" id="islStars" aria-label="這週達標的日子"></div>' +
      '<div class="isl-acts"><button type="button" class="btn" id="islFull">👀 看完成的樣子</button><button type="button" class="btn" id="islOther">🧭 看其他島</button><button type="button" class="btn" id="islAlbumBtn">📔 小島相簿 <span id="islAlbumN"></span></button></div>' +
      '<div class="isl-album" id="islAlbum" hidden></div>' +
      '<div class="actions"><button class="btn primary" value="ok">關閉</button></div>' +
    '</form></dialog>');
  const st = document.createElement('style');
  st.textContent =
    '.wonder-nav-btn { display: inline-flex; align-items: center; gap: 6px; align-self: flex-start; } .isl-n { font-size: .78rem; color: var(--muted); font-weight: 600; }' +
    'dialog.isl-dlg { width: min(600px, calc(100vw - 24px)); max-height: 92dvh; overflow-y: auto; overflow-x: hidden; } .isl-dlg form { display: flex; flex-direction: column; gap: 10px; min-width: 0; }' +
    '.isl-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; } .isl-pill { padding: 3px 10px; border-radius: 99px; background: var(--accent-soft); color: var(--accent-ink, var(--accent)); font-size: .82rem; font-weight: 700; }' +
    '.isl-rules { display: flex; flex-wrap: wrap; gap: 6px 14px; font-size: .84rem; } .isl-rules b { display: inline-grid; place-items: center; width: 18px; height: 18px; margin-right: 4px; border-radius: 50%; background: var(--accent); color: #fff; font-size: .7rem; }' +
    '.isl-canvas { position: relative; border-radius: 14px; overflow: hidden; box-shadow: 0 6px 22px rgba(0,0,0,.16); } .isl-canvas canvas { display: block; width: 100%; height: 290px; }' +
    '.isl-tag { position: absolute; left: 10px; bottom: 10px; padding: 3px 10px; border-radius: 99px; background: rgba(15, 23, 42, .55); color: #fff; font-size: .78rem; font-weight: 700; backdrop-filter: blur(4px); } .isl-tag:empty { display: none; }' +
    '.isl-next { margin: 0; font-size: .9rem; font-weight: 600; }' +
    '.isl-miles { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 6px; } .isl-mile { display: flex; flex-direction: column; align-items: center; gap: 1px; padding: 6px 2px; border-radius: 10px; border: 1px solid var(--line); background: var(--panel-2); font-size: .72rem; color: var(--muted); text-align: center; }' +
    '.isl-mile .e { font-size: 1.25rem; line-height: 1.1; filter: grayscale(1); opacity: .45; } .isl-mile.on { border-color: var(--accent); background: var(--accent-soft); color: var(--fg); font-weight: 600; } .isl-mile.on .e { filter: none; opacity: 1; } .isl-mile.next { border-style: dashed; border-color: var(--accent); }' +
    '.isl-stars { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 4px; } .isl-star { display: flex; flex-direction: column; align-items: center; font-size: .7rem; color: var(--muted); } .isl-star .s { font-size: 1.05rem; filter: grayscale(1); opacity: .3; } .isl-star.on .s { filter: none; opacity: 1; } .isl-star.today { color: var(--fg); font-weight: 700; }' +
    '.isl-acts { display: flex; flex-wrap: wrap; gap: 6px; } .isl-acts .btn { font-size: .82rem; padding: 5px 10px; } .isl-acts .btn[aria-pressed="true"] { border-color: var(--accent); background: var(--accent-soft); }' +
    '.isl-album { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 6px; } .isl-album[hidden] { display: none; } .isl-card { display: flex; flex-direction: column; align-items: center; gap: 1px; padding: 8px 4px; border: 1px solid var(--line); border-radius: 10px; background: var(--panel-2); font-size: .74rem; text-align: center; } .isl-card .e { font-size: 1.5rem; } .isl-card b { font-size: .84rem; }' +
    '@media (max-width: 480px) { .isl-miles { grid-template-columns: repeat(3, minmax(0, 1fr)); } .isl-canvas canvas { height: 290px; } }';
  document.head.appendChild(st);

  let base = null;
  function view() {   // what the canvas shows: the real week, or a preview (full island / another kind of island)
    if (!base) return null;
    let d = base;
    if (showIsland >= 0) d = { ...d, island: ISLANDS[showIsland] };
    if (showFull) d = { ...d, things: FULL + 8, stars: 7, byDay: d.byDay.map(() => ({ active: true })) };
    return d;
  }
  function paint() {
    const d = view(); if (!d) return; active = d;
    const preview = showFull || showIsland >= 0, n = base.things;
    $('islName').textContent = d.island.icon + ' ' + d.island.name;
    $('islTag').textContent = preview ? '預覽（不是你這週的島）' : n ? '已經有 ' + n + ' 樣東西 · ⭐ ' + base.stars + ' / 7' : '';
    const next = MILESTONES.find(m => n < m[0]);
    $('islNext').textContent = n >= FULL ? '🌈 這座島完成了！之後每完成一個方塊，島上多一隻螢火蟲。'
      : n < FULL && THINGS[n] ? '下一個方塊會長出：' + THINGS[n][4] + (next ? '　·　再 ' + (next[0] - n) + ' 個方塊有 ' + next[1] + ' ' + next[2] : '') : '';
    $('islMiles').innerHTML = MILESTONES.map(m => '<div class="isl-mile' + (n >= m[0] ? ' on' : next === m ? ' next' : '') + '"><span class="e">' + m[1] + '</span><span>' + m[2] + '</span><span>' + (n >= m[0] ? '✓' : m[0] + ' 個') + '</span></div>').join('');
    const today = (new Date().getDay() + 6) % 7;
    $('islStars').innerHTML = base.byDay.map((x, i) => '<div class="isl-star' + (x.active ? ' on' : '') + (i === today ? ' today' : '') + '"><span class="s">⭐</span><span>週' + DAYN[i] + '</span></div>').join('');
    $('islFull').setAttribute('aria-pressed', String(showFull)); $('islOther').setAttribute('aria-pressed', String(showIsland >= 0));
    $('islOther').textContent = showIsland >= 0 ? '🧭 下一座（' + ISLANDS[showIsland].name + '）' : '🧭 看其他島';
    $('islAlbumN').textContent = base.album.length ? '(' + base.album.length + ')' : '';
    $('islAlbum').innerHTML = base.album.length ? base.album.slice().reverse().map(a => '<div class="isl-card"><span class="e">' + a.island.icon + '</span><b>' + esc(a.island.name) + '</b><span>' + esc(a.monStr.slice(5).replace('-', '/')) + ' 那週</span><span>' + a.things + ' 樣 · ⭐' + a.stars + '</span></div>').join('')
      : '<p class="hint" style="grid-column:1/-1;margin:0">一週裡完成 ' + KEEP + ' 個方塊，那座島就會收進相簿。</p>';
    const cv = $('wonderCanvas'); if (cv) draw(cv, d, performance.now());
    loop();
  }
  async function refresh(pop) {
    const d = await getData(true); if (!d) return;
    const grew = base && d.things > base.things; base = d;
    $('islBtnN').textContent = d.things ? d.things + ' 樣' : '';
    if ($('wonderDlg').open) { if (pop || grew) bornAt = -1; paint(); }
  }
  btn.addEventListener('click', async () => {
    showFull = false; showIsland = -1; $('islAlbum').hidden = true;
    const dlg = $('wonderDlg'); if (!dlg.open) dlg.showModal();
    bornAt = -1; await refresh(true); if (base) paint();
  });
  $('islFull').addEventListener('click', () => { showFull = !showFull; bornAt = 0; paint(); });
  $('islOther').addEventListener('click', () => { const cur = showIsland >= 0 ? showIsland : ISLANDS.indexOf(base?.island); showIsland = (cur + 1) % ISLANDS.length; if (base && ISLANDS[showIsland] === base.island && !showFull) showIsland = -1; bornAt = 0; paint(); });
  $('islAlbumBtn').addEventListener('click', () => { const a = $('islAlbum'); a.hidden = !a.hidden; if (!a.hidden) a.scrollIntoView({ block: 'nearest' }); });
  $('wonderDlg').addEventListener('close', () => cancelAnimationFrame(raf));

  /* ---------- when the week changes: keep the button's count fresh, and celebrate the island being kept ---------- */
  async function watch() {
    try {
      await refresh(false);
      const d = base; if (!d || !d.kept) return;
      let seen = null; try { seen = localStorage.getItem(SEEN); } catch (e) {}
      if (seen === d.monStr) return;
      try { localStorage.setItem(SEEN, d.monStr); } catch (e) {}
      window.paceRewardCard?.({ icon: d.island.icon, title: d.island.name + '收進相簿了！', sub: '這週完成了 ' + KEEP + ' 個方塊。繼續做，島上還會長出燈塔、熱氣球和彩虹。', big: true });
    } catch (e) {}
  }
  let timer = 0;
  const save0 = saveWeek;
  window.saveWeek = saveWeek = function () { const r = save0.apply(this, arguments); clearTimeout(timer); timer = setTimeout(watch, 1400); return r; };
  (function wait(n) { if (state.db) { refresh(false); return; } if (n < 60) setTimeout(() => wait(n + 1), 500); })(0);
  window.paceIsland = { data: () => base, things: THINGS.map(t => t[4]), islands: ISLANDS.map(i => i.name), preview: (full, idx) => { showFull = !!full; showIsland = idx ?? -1; paint(); } };
})();
