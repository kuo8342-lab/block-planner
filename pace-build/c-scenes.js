/* 步調 Pace: the weekly report's 「夜空」 becomes a bespoke, living art scene for each theme.
   Instead of scattering flat icons at random coordinates in mid-air, each theme has its own environmental stage
   (shelves for tea/coffee/candy, apartment buildings for rain windows, tree branches for sakura/maple, constellations for night,
   coral reefs for ocean, twilight bay for sky lanterns, ink-wash mountains & plum branches for ink).
   drawSky() belongs to A (and so to C); it is wrapped here. Loaded after c-skins.js. */
(() => {
  if (typeof drawSky !== 'function' || typeof skin === 'undefined' || typeof blockEnd !== 'function') return;
  const keepOriginal = !!window.PACE_KEEP_ORIGINAL_WORDS; // A-next keeps original title for default & night
  const TAU = Math.PI * 2, clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const back = x => { x = clamp(x, 0, 1); const c = 1.65; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
  const dashed = (ctx, on) => ctx.setLineDash(on ? [3, 3] : []);
  const ART = window.PACE_ART || {};

  // Helper: draw a 5-petaled notched Sakura blossom
  function drawSakuraFlower(c, r, petalCol, coreCol) {
    for (let k = 0; k < 5; k++) {
      c.save();
      c.rotate((k * TAU) / 5);
      c.fillStyle = k % 2 ? petalCol[0] : petalCol[1];
      c.beginPath();
      c.moveTo(0, 0);
      c.bezierCurveTo(-r * 0.42, -r * 0.35, -r * 0.45, -r * 0.92, -r * 0.1, -r * 0.98);
      c.lineTo(0, -r * 0.78); // Sakura petal notch
      c.lineTo(r * 0.1, -r * 0.98);
      c.bezierCurveTo(r * 0.45, -r * 0.92, r * 0.42, -r * 0.35, 0, 0);
      c.closePath();
      c.fill();
      c.restore();
    }
    // Stamens & golden pistils
    c.strokeStyle = coreCol || '#e07a9b';
    c.lineWidth = 0.9;
    for (let k = 0; k < 8; k++) {
      const a = (k * TAU) / 8;
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(Math.cos(a) * r * 0.28, Math.sin(a) * r * 0.28);
      c.stroke();
    }
    c.fillStyle = '#f59e0b';
    c.beginPath();
    c.arc(0, 0, r * 0.14, 0, TAU);
    c.fill();
  }

  // Helper: draw branches reaching from trunks to item points
  function drawCanopyBranches(c, W, H, items, trunkCol, twigCol) {
    c.save();
    c.strokeStyle = trunkCol;
    c.lineCap = 'round';
    // Left and right main boughs
    c.lineWidth = 5.5;
    c.beginPath();
    c.moveTo(-10, H * 0.72);
    c.bezierCurveTo(W * 0.15, H * 0.55, W * 0.28, H * 0.32, W * 0.46, H * 0.22);
    c.moveTo(W + 10, H * 0.65);
    c.bezierCurveTo(W * 0.82, H * 0.48, W * 0.66, H * 0.36, W * 0.52, H * 0.28);
    c.stroke();
    // Sub-branches connecting near item clusters
    c.lineWidth = 1.6;
    c.strokeStyle = twigCol;
    for (const it of items) {
      const anchorX = it.x < W * 0.5 ? it.x - 22 : it.x + 22;
      const anchorY = clamp(it.y + 14, 24, H - 36);
      c.beginPath();
      c.moveTo(anchorX, anchorY);
      c.quadraticCurveTo((anchorX + it.x) / 2, it.y + 4, it.x, it.y);
      c.stroke();
    }
    c.restore();
  }

  // Helper: draw 3 horizontal wooden display shelves for tea/coffee/candy
  function drawWoodenShelves(c, W, H, shelfCol, edgeCol) {
    const ys = [H * 0.36, H * 0.60, H * 0.84];
    for (const sy of ys) {
      c.fillStyle = 'rgba(0,0,0,0.08)';
      c.fillRect(18, sy + 3, W - 36, 6);
      c.fillStyle = shelfCol;
      c.beginPath();
      c.roundRect(14, sy - 2, W - 28, 6, 3);
      c.fill();
      c.strokeStyle = edgeCol;
      c.lineWidth = 1;
      c.stroke();
    }
  }

  const SCENES = {
    /* 1. 預設：晨曦植物溫室 (Sunlit Botanical Conservatory) */
    default: {
      bg: ['#f0f7f4', '#e2f0ea', '#cde4d8'], dark: false, label: '#3d6352', layout: 'garden',
      stage(c, W, H, t) {
        // Glasshouse arched skylight panes & warm morning sunbeams
        c.strokeStyle = 'rgba(47, 122, 91, 0.12)';
        c.lineWidth = 1.5;
        for (let i = 0; i <= 7; i++) {
          const x = (i / 7) * W;
          c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H - 28); c.stroke();
        }
        const sunG = c.createRadialGradient(W * 0.15, 0, 0, W * 0.15, 0, W * 0.65);
        sunG.addColorStop(0, 'rgba(255, 243, 190, 0.55)');
        sunG.addColorStop(1, 'rgba(255, 243, 190, 0)');
        c.fillStyle = sunG; c.fillRect(0, 0, W, H);
        // Rolling garden soil bed
        c.fillStyle = '#b7d7c8';
        c.beginPath(); c.moveTo(0, H);
        for (let x = 0; x <= W; x += 20) c.lineTo(x, H - 30 + Math.sin(x * 0.02) * 4);
        c.lineTo(W, H); c.closePath(); c.fill();
      },
      done(c, x, y, s, a, t, i) {
        const h = s * 0.95 * a, sw = Math.sin(t * 0.002 + i) * 0.06;
        c.save(); c.translate(x, y + s * 0.35); c.rotate(sw);
        // Stem
        c.strokeStyle = '#2f7a5b'; c.lineWidth = 2; c.lineCap = 'round';
        c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(s * 0.08, -h * 0.5, 0, -h); c.stroke();
        // Two lush leaves
        c.fillStyle = '#3da375';
        c.beginPath(); c.ellipse(-s * 0.22, -h * 0.45, s * 0.22 * a, s * 0.11 * a, -0.45, 0, TAU); c.fill();
        c.beginPath(); c.ellipse(s * 0.22, -h * 0.62, s * 0.22 * a, s * 0.11 * a, 0.45, 0, TAU); c.fill();
        // Blooming sunlit flower head
        const cols = ['#f59e0b', '#fb7185', '#38bdf8', '#a855f7'];
        c.fillStyle = cols[i % cols.length];
        for (let k = 0; k < 6; k++) {
          const ang = (k * TAU) / 6 + t * 0.0005;
          c.beginPath();
          c.arc(Math.cos(ang) * s * 0.16 * a, -h + Math.sin(ang) * s * 0.16 * a, s * 0.11 * a, 0, TAU);
          c.fill();
        }
        c.fillStyle = '#fef08a';
        c.beginPath(); c.arc(0, -h, s * 0.1 * a, 0, TAU); c.fill();
        c.restore();
      },
      missed(c, x, y, s) {
        c.save(); c.translate(x, y + s * 0.35);
        c.strokeStyle = '#a38b7a'; c.lineWidth = 1.4;
        c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(s * 0.15, -s * 0.35, s * 0.28, -s * 0.22); c.stroke();
        c.restore();
      },
      future(c, x, y, s) {
        c.save(); c.translate(x, y + s * 0.35);
        c.strokeStyle = '#6da58d'; dashed(c, 1);
        c.beginPath(); c.arc(0, -s * 0.25, s * 0.22, 0, TAU); c.stroke(); dashed(c, 0);
        c.restore();
      }
    },

    /* 2. 星空：璀璨星座連軌 (Constellation Night Sky) */
    night: {
      bg: ['#060b1e', '#111a3a', '#1e295b'], dark: true, label: '#b8c7ff', stars: true,
      stage(c, W, H, t, items) {
        // Glowing crescent moon
        c.save();
        c.fillStyle = '#fef9c3';
        c.shadowColor = '#fde047'; c.shadowBlur = 16;
        c.beginPath(); c.arc(W - 52, 34, 13, 0, TAU); c.fill();
        c.shadowBlur = 0;
        c.fillStyle = '#091028';
        c.beginPath(); c.arc(W - 46, 30, 11.5, 0, TAU); c.fill();
        c.restore();
        // Constellation golden threads connecting completed stars
        const doneItems = items.filter(it => it.state === 'done').sort((a, b) => a.x - b.x || a.y - b.y);
        if (doneItems.length > 1) {
          c.save();
          c.strokeStyle = 'rgba(253, 224, 71, 0.32)';
          c.lineWidth = 1.1;
          c.setLineDash([4, 3]);
          c.beginPath();
          for (let i = 0; i < doneItems.length - 1; i++) {
            const p1 = doneItems[i], p2 = doneItems[i + 1];
            if (Math.hypot(p2.x - p1.x, p2.y - p1.y) < W * 0.32) {
              c.moveTo(p1.x, p1.y); c.lineTo(p2.x, p2.y);
            }
          }
          c.stroke();
          c.restore();
        }
        // Distant mountain silhouette at bottom
        c.fillStyle = '#070b19';
        c.beginPath(); c.moveTo(0, H);
        for (let x = 0; x <= W; x += 16) {
          c.lineTo(x, H - 24 - Math.abs(Math.sin(x * 0.008)) * 14 - Math.sin(x * 0.025) * 5);
        }
        c.lineTo(W, H); c.closePath(); c.fill();
      },
      done(c, x, y, s, a, t, i) {
        const pulse = 0.82 + 0.18 * Math.sin(t * 0.004 + i * 1.7);
        const r = s * 0.38 * a * pulse;
        const cols = ['#93c5fd', '#fde047', '#c4b5fd', '#6ee7b7', '#fda4af'];
        const col = cols[i % cols.length];
        const g = c.createRadialGradient(x, y, 0, x, y, r * 2.4);
        g.addColorStop(0, col); g.addColorStop(0.4, 'rgba(255,255,255,0.25)'); g.addColorStop(1, 'rgba(255,255,255,0)');
        c.fillStyle = g; c.beginPath(); c.arc(x, y, r * 2.4, 0, TAU); c.fill();
        c.fillStyle = '#ffffff';
        if (ART.drawSparkleStar) ART.drawSparkleStar(c, x, y, r * 1.25);
        else { c.beginPath(); c.arc(x, y, r * 0.6, 0, TAU); c.fill(); }
      },
      missed(c, x, y, s) {
        c.strokeStyle = 'rgba(255, 156, 144, 0.45)'; c.lineWidth = 1.1;
        c.beginPath(); c.arc(x, y, s * 0.25, 0, TAU); c.stroke();
      },
      future(c, x, y, s) {
        c.strokeStyle = 'rgba(201, 210, 255, 0.45)'; dashed(c, 1);
        c.beginPath(); c.arc(x, y, s * 0.25, 0, TAU); c.stroke(); dashed(c, 0);
      }
    },

    /* 3. 櫻花：春櫻枝頭水彩畫 (Sakura Canopy Branches) */
    sakura: {
      bg: ['#fff5f8', '#fde2eb', '#f9cedd'], dark: false, label: '#8a425a', layout: 'canopy',
      stage(c, W, H, t, items) {
        // Soft distant spring hills
        c.fillStyle = 'rgba(244, 165, 188, 0.22)';
        c.beginPath(); c.moveTo(0, H);
        for (let x = 0; x <= W; x += 20) c.lineTo(x, H - 28 - Math.sin(x * 0.007 + 1) * 14);
        c.lineTo(W, H); c.closePath(); c.fill();
        drawCanopyBranches(c, W, H, items, 'rgba(92, 54, 62, 0.45)', 'rgba(115, 68, 78, 0.35)');
      },
      done(c, x, y, s, a, t, i) {
        const r = s * 0.56 * a, sw = Math.sin(t * 0.0018 + i) * 0.1;
        c.save(); c.translate(x, y); c.rotate(sw);
        drawSakuraFlower(c, r, ['#f48fb1', '#fbcfe8'], '#db2777');
        c.restore();
      },
      missed(c, x, y, s) {
        c.save(); c.translate(x, y);
        c.strokeStyle = '#be7b8e'; c.fillStyle = 'rgba(194, 55, 44, 0.12)'; c.lineWidth = 1.1;
        c.beginPath(); c.ellipse(0, 4, s * 0.18, s * 0.28, 0.4, 0, TAU); c.fill(); c.stroke();
        c.restore();
      },
      future(c, x, y, s) {
        // Plump pink flower bud on the twig
        c.save(); c.translate(x, y);
        c.fillStyle = 'rgba(244, 143, 177, 0.35)'; c.strokeStyle = '#d17b96'; dashed(c, 1);
        c.beginPath(); c.ellipse(0, 0, s * 0.18, s * 0.26, -0.2, 0, TAU); c.fill(); c.stroke(); dashed(c, 0);
        c.restore();
      }
    },

    /* 4. 海洋：蔚藍珊瑚礁秘境 (Coral Reef & Sunbeams) */
    ocean: {
      bg: ['#d8f3fc', '#9adbf4', '#4da2d4'], dark: false, label: '#0c3c59',
      stage(c, W, H, t) {
        // Underwater sunbeams (God rays)
        c.save();
        for (let k = 0; k < 4; k++) {
          const rx = W * (0.15 + k * 0.24) + Math.sin(t * 0.001 + k) * 14;
          const rg = c.createLinearGradient(rx, 0, rx + 70, H);
          rg.addColorStop(0, 'rgba(255,255,255,0.35)'); rg.addColorStop(1, 'rgba(255,255,255,0)');
          c.fillStyle = rg;
          c.beginPath(); c.moveTo(rx - 18, 0); c.lineTo(rx + 22, 0); c.lineTo(rx + 95, H); c.lineTo(rx + 15, H); c.closePath(); c.fill();
        }
        // Sandy seabed & swaying kelp
        c.fillStyle = '#3b8bbd';
        c.beginPath(); c.moveTo(0, H);
        for (let x = 0; x <= W; x += 16) c.lineTo(x, H - 24 + Math.sin(x * 0.015) * 5);
        c.lineTo(W, H); c.closePath(); c.fill();
        c.strokeStyle = 'rgba(20, 95, 110, 0.45)'; c.lineWidth = 3; c.lineCap = 'round';
        for (let k = 0; k < 9; k++) {
          const kx = (k + 0.5) * (W / 9);
          c.beginPath(); c.moveTo(kx, H - 18);
          c.quadraticCurveTo(kx + Math.sin(t * 0.002 + k) * 10, H - 38, kx + Math.sin(t * 0.002 + k + 1) * 12, H - 54);
          c.stroke();
        }
        c.restore();
      },
      done(c, x, y, s, a, t, i) {
        const r = s * 0.44 * a, fy = Math.sin(t * 0.0018 + i * 1.3) * 4;
        c.save(); c.translate(x, y + fy);
        // Iridescent bubble
        c.strokeStyle = 'rgba(255,255,255,0.92)'; c.fillStyle = 'rgba(255,255,255,0.26)'; c.lineWidth = 1.4;
        c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill(); c.stroke();
        c.fillStyle = 'rgba(255,255,255,0.85)';
        c.beginPath(); c.arc(-r * 0.34, -r * 0.34, r * 0.22, 0, TAU); c.fill();
        // Every 3rd bubble has a tiny swimming coral fish inside/beside it
        if (i % 3 === 0) {
          c.fillStyle = '#fb7185';
          c.beginPath(); c.ellipse(r * 0.1, r * 0.1, r * 0.32, r * 0.18, 0, 0, TAU); c.fill();
          c.beginPath(); c.moveTo(-r * 0.18, r * 0.1); c.lineTo(-r * 0.42, -r * 0.06); c.lineTo(-r * 0.42, r * 0.26); c.closePath(); c.fill();
        }
        c.restore();
      },
      missed(c, x, y, s) {
        c.strokeStyle = 'rgba(194,55,44,0.65)'; c.lineWidth = 1.2;
        c.beginPath(); c.arc(x, y, s * 0.36, 0.3, 2.2); c.stroke();
        c.beginPath(); c.arc(x, y, s * 0.36, 3.4, 5.3); c.stroke();
      },
      future(c, x, y, s) {
        c.strokeStyle = 'rgba(255,255,255,0.82)'; dashed(c, 1);
        c.beginPath(); c.arc(x, y, s * 0.36, 0, TAU); c.stroke(); dashed(c, 0);
      }
    },

    /* 5. 抹茶：宇治木質茶席博古架 (Uji Matcha Wooden Tea Shelf) */
    matcha: {
      bg: ['#f3f7e6', '#e5efd0', '#d5e4b8'], dark: false, label: '#3f522b', layout: 'shelf',
      stage(c, W, H) {
        // Subtle Shoji lattice lines in background
        c.strokeStyle = 'rgba(95, 120, 65, 0.1)'; c.lineWidth = 1;
        for (let x = W * 0.1; x < W; x += W * 0.2) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H - 28); c.stroke(); }
        drawWoodenShelves(c, W, H, '#c7a477', '#9e7b50');
      },
      done(c, x, y, s, a, t, i) {
        const w = s * 0.78 * a, h = w * 0.62;
        c.save(); c.translate(x, y - h * 0.48);
        // Ceramic Chawan bowl sitting on shelf
        c.fillStyle = '#4f7a38';
        c.beginPath();
        c.moveTo(-w / 2, -h / 2); c.lineTo(w / 2, -h / 2);
        c.quadraticCurveTo(w * 0.46, h / 2, 0, h / 2);
        c.quadraticCurveTo(-w * 0.46, h / 2, -w / 2, -h / 2);
        c.fill();
        // Whisked jade matcha foam
        c.fillStyle = '#a3cf72';
        c.beginPath(); c.ellipse(0, -h / 2, w / 2, h * 0.18, 0, 0, TAU); c.fill();
        // Rising steam wisps
        c.strokeStyle = 'rgba(75, 105, 50, 0.52)'; c.lineWidth = 1.2; c.lineCap = 'round';
        for (let k = -1; k <= 1; k += 2) {
          c.beginPath();
          for (let j = 0; j <= 6; j++) {
            const yy = -h / 2 - 2 - j * 2.5 * a, xx = k * w * 0.16 + Math.sin(t * 0.003 + j * 0.9 + i) * 1.8;
            j ? c.lineTo(xx, yy) : c.moveTo(xx, yy);
          }
          c.stroke();
        }
        c.restore();
      },
      missed(c, x, y, s) {
        const w = s * 0.66, h = w * 0.6;
        c.save(); c.translate(x, y - h * 0.48);
        c.strokeStyle = '#b05a4a'; c.lineWidth = 1.2;
        c.beginPath(); c.moveTo(-w / 2, -h / 2); c.lineTo(w / 2, -h / 2);
        c.quadraticCurveTo(w * 0.45, h / 2, 0, h / 2); c.quadraticCurveTo(-w * 0.45, h / 2, -w / 2, -h / 2); c.stroke();
        c.restore();
      },
      future(c, x, y, s) {
        const w = s * 0.66, h = w * 0.6;
        c.save(); c.translate(x, y - h * 0.48);
        c.strokeStyle = '#7e965d'; dashed(c, 1);
        c.beginPath(); c.moveTo(-w / 2, -h / 2); c.lineTo(w / 2, -h / 2);
        c.quadraticCurveTo(w * 0.45, h / 2, 0, h / 2); c.quadraticCurveTo(-w * 0.45, h / 2, -w / 2, -h / 2); c.stroke();
        dashed(c, 0); c.restore();
      }
    },

    /* 6. 霓虹：賽博龐克能量矩陣 (Synthwave Cyber Grid) */
    neon: {
      bg: ['#060612', '#0d0b26', '#1b1140'], dark: true, label: '#67e8f9',
      stage(c, W, H, t, items) {
        const horizon = H - 52;
        // Retro cyber sun on horizon
        const sunG = c.createLinearGradient(0, horizon - 46, 0, horizon);
        sunG.addColorStop(0, 'rgba(255, 61, 129, 0.55)'); sunG.addColorStop(1, 'rgba(251, 191, 36, 0.15)');
        c.fillStyle = sunG;
        c.beginPath(); c.arc(W / 2, horizon, 44, Math.PI, 0); c.fill();
        // 3D perspective neon floor grid
        c.strokeStyle = 'rgba(0, 229, 255, 0.25)'; c.lineWidth = 1;
        c.beginPath(); c.moveTo(0, horizon); c.lineTo(W, horizon); c.stroke();
        for (let i = -6; i <= 6; i++) {
          c.beginPath(); c.moveTo(W / 2 + i * 28, horizon); c.lineTo(W / 2 + i * 115, H); c.stroke();
        }
        for (let r = 1; r <= 4; r++) {
          const yy = horizon + Math.pow(r / 4, 1.6) * (H - horizon);
          c.beginPath(); c.moveTo(0, yy); c.lineTo(W, yy); c.stroke();
        }
        // Data circuit beams between completed nodes
        const done = items.filter(it => it.state === 'done');
        if (done.length > 1) {
          c.strokeStyle = 'rgba(0, 229, 255, 0.28)'; c.lineWidth = 1.2;
          c.beginPath();
          for (let i = 0; i < done.length - 1; i++) {
            if (Math.abs(done[i + 1].x - done[i].x) < W * 0.28) {
              c.moveTo(done[i].x, done[i].y); c.lineTo(done[i + 1].x, done[i + 1].y);
            }
          }
          c.stroke();
        }
      },
      done(c, x, y, s, a, t, i) {
        const col = i % 3 ? '0,229,255' : '255,61,129', f = 0.8 + 0.2 * Math.sin(t * 0.006 + i * 2.1), r = s * 0.32 * a;
        const g = c.createRadialGradient(x, y, 0, x, y, r * 3);
        g.addColorStop(0, `rgba(${col},${0.65 * f})`); g.addColorStop(1, `rgba(${col},0)`);
        c.fillStyle = g; c.beginPath(); c.arc(x, y, r * 3, 0, TAU); c.fill();
        // Glowing diamond cyber crystal
        c.fillStyle = '#ffffff';
        c.strokeStyle = `rgb(${col})`; c.lineWidth = 1.5;
        c.beginPath();
        c.moveTo(x, y - r * 1.2); c.lineTo(x + r * 0.9, y); c.lineTo(x, y + r * 1.2); c.lineTo(x - r * 0.9, y);
        c.closePath(); c.fill(); c.stroke();
      },
      missed(c, x, y, s) {
        c.strokeStyle = 'rgba(255,61,129,0.5)'; c.lineWidth = 1.1;
        c.beginPath(); c.arc(x, y, s * 0.28, 0, TAU); c.stroke();
      },
      future(c, x, y, s) {
        c.strokeStyle = 'rgba(134,160,181,0.5)'; dashed(c, 1);
        c.beginPath(); c.arc(x, y, s * 0.28, 0, TAU); c.stroke(); dashed(c, 0);
      }
    },

    /* 7. 夕陽：暮色海灣與祈福天燈 (Twilight Bay & Sky Lanterns) */
    sunset: {
      bg: ['#fed7aa', '#f4a2b8', '#b589d6'], dark: false, label: '#5e2b42',
      stage(c, W, H, t) {
        const seaY = H - 38;
        // Setting sun on the ocean horizon
        const sunG = c.createRadialGradient(W * 0.5, seaY, 4, W * 0.5, seaY, 68);
        sunG.addColorStop(0, 'rgba(255, 247, 200, 0.95)');
        sunG.addColorStop(0.45, 'rgba(251, 146, 60, 0.55)');
        sunG.addColorStop(1, 'rgba(251, 146, 60, 0)');
        c.fillStyle = sunG; c.fillRect(0, 0, W, seaY);
        // Calm twilight sea & shimmering sun path reflection
        const waterG = c.createLinearGradient(0, seaY, 0, H);
        waterG.addColorStop(0, '#9d6b99'); waterG.addColorStop(1, '#6d437a');
        c.fillStyle = waterG; c.fillRect(0, seaY, W, 38);
        c.fillStyle = 'rgba(254, 215, 170, 0.55)';
        for (let k = 0; k < 7; k++) {
          const wy = seaY + 4 + k * 4.5, ww = 42 - k * 4 + Math.sin(t * 0.003 + k) * 6;
          c.fillRect(W * 0.5 - ww / 2, wy, ww, 2);
        }
      },
      done(c, x, y, s, a, t, i) {
        // Floating Sky Lantern (祈福天燈)
        const fy = Math.sin(t * 0.002 + i * 1.4) * 3.5;
        const w = s * 0.48 * a, h = s * 0.64 * a;
        c.save(); c.translate(x, y + fy);
        c.rotate(Math.sin(t * 0.0015 + i) * 0.07);
        // Warm outer aura
        const g = c.createRadialGradient(0, 0, 0, 0, 0, s * 0.85 * a);
        g.addColorStop(0, 'rgba(255, 230, 140, 0.75)');
        g.addColorStop(0.5, 'rgba(251, 130, 70, 0.28)');
        g.addColorStop(1, 'rgba(251, 130, 70, 0)');
        c.fillStyle = g; c.beginPath(); c.arc(0, 0, s * 0.85 * a, 0, TAU); c.fill();
        // Lantern body
        const lg = c.createLinearGradient(0, -h / 2, 0, h / 2);
        lg.addColorStop(0, '#ea580c'); lg.addColorStop(0.65, '#fb923c'); lg.addColorStop(1, '#fef08a');
        c.fillStyle = lg;
        c.beginPath();
        c.moveTo(-w * 0.38, -h / 2); c.lineTo(w * 0.38, -h / 2);
        c.quadraticCurveTo(w * 0.58, 0, w * 0.34, h / 2);
        c.lineTo(-w * 0.34, h / 2);
        c.quadraticCurveTo(-w * 0.58, 0, -w * 0.38, -h / 2);
        c.closePath(); c.fill();
        // Glowing flame core at lantern base
        c.fillStyle = '#ffffff';
        c.beginPath(); c.arc(0, h * 0.32, w * 0.16, 0, TAU); c.fill();
        c.restore();
      },
      missed(c, x, y, s) {
        c.strokeStyle = 'rgba(130, 45, 65, 0.55)'; c.lineWidth = 1.2;
        c.beginPath(); c.roundRect(x - s * 0.2, y - s * 0.26, s * 0.4, s * 0.52, 4); c.stroke();
      },
      future(c, x, y, s) {
        c.strokeStyle = 'rgba(255,255,255,0.85)'; dashed(c, 1);
        c.beginPath(); c.roundRect(x - s * 0.2, y - s * 0.26, s * 0.4, s * 0.52, 4); c.stroke(); dashed(c, 0);
      }
    },

    /* 8. 森林：迷霧螢火森林 (Misty Firefly Forest) */
    forest: {
      bg: ['#08130e', '#0f241b', '#183829'], dark: true, label: '#9ec4a8', ground: '#0b1c14',
      stage(c, W, H, t) {
        // Layered distant misty mountain ridges
        [[0.58, 'rgba(26, 62, 45, 0.5)', 0.5], [0.72, 'rgba(18, 45, 32, 0.75)', 2.1]].forEach(([by, col, ph]) => {
          c.fillStyle = col; c.beginPath(); c.moveTo(0, H);
          for (let x = 0; x <= W; x += 18) c.lineTo(x, H * by + Math.sin(x * 0.008 + ph) * 16 + Math.cos(x * 0.02) * 6);
          c.lineTo(W, H); c.closePath(); c.fill();
        });
        // Drifting golden fireflies
        for (let k = 0; k < 14; k++) {
          const fx = ((k * 73 + t * 0.015) % W), fy = 24 + ((k * 41) % (H - 64)) + Math.sin(t * 0.003 + k) * 8;
          const fa = 0.3 + 0.7 * Math.abs(Math.sin(t * 0.004 + k * 1.9));
          c.fillStyle = `rgba(220, 255, 130, ${fa})`;
          c.beginPath(); c.arc(fx, fy, 1.8, 0, TAU); c.fill();
        }
      },
      done(c, x, y, s, a, t, i) {
        const h = s * 1.28 * a, sw = Math.sin(t * 0.0015 + i * 1.7) * 0.045;
        c.save(); c.translate(x, y + s * 0.6); c.rotate(sw);
        // Trunk
        c.fillStyle = '#6b4b32'; c.fillRect(-s * 0.065, -h * 0.32, s * 0.13, h * 0.32);
        // 3-tier lush pine/forest canopy
        const cols = i % 2 ? ['#1f6338', '#2d864c', '#45ad67'] : ['#1b5739', '#287a50', '#3ea16d'];
        [[0.22, 0.68, 0.52, cols[0]], [0.42, 0.88, 0.44, cols[1]], [0.62, 1.05, 0.34, cols[2]]].forEach(([bot, top, w, col]) => {
          c.fillStyle = col;
          c.beginPath();
          c.moveTo(0, -h * top);
          c.lineTo(s * w, -h * bot);
          c.lineTo(-s * w, -h * bot);
          c.closePath(); c.fill();
        });
        c.restore();
      },
      missed(c, x, y, s) {
        c.save(); c.translate(x, y + s * 0.6);
        c.strokeStyle = '#8a6a52'; c.lineWidth = 1.3;
        c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -s * 0.78);
        c.moveTo(0, -s * 0.45); c.lineTo(s * 0.22, -s * 0.65);
        c.moveTo(0, -s * 0.55); c.lineTo(-s * 0.2, -s * 0.72);
        c.stroke(); c.restore();
      },
      future(c, x, y, s) {
        c.save(); c.translate(x, y + s * 0.6);
        c.strokeStyle = '#5f8a6c'; dashed(c, 1);
        c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -s * 0.32);
        c.moveTo(-s * 0.14, -s * 0.44); c.lineTo(0, -s * 0.3); c.lineTo(s * 0.14, -s * 0.44);
        c.stroke(); dashed(c, 0); c.restore();
      }
    },

    /* 9. 薰衣草：普羅旺斯微風花田 (Provence Lavender Hills) */
    lavender: {
      bg: ['#f5effd', '#e6d8fa', '#cfb8f3'], dark: false, label: '#533e7a', ground: '#c3a6ed',
      stage(c, W, H) {
        c.fillStyle = 'rgba(167, 139, 250, 0.26)';
        c.beginPath(); c.moveTo(0, H);
        for (let x = 0; x <= W; x += 18) c.lineTo(x, H - 44 + Math.sin(x * 0.009) * 10);
        c.lineTo(W, H); c.closePath(); c.fill();
      },
      done(c, x, y, s, a, t, i) {
        const h = s * 1.1 * a, sw = Math.sin(t * 0.0018 + i) * 0.065;
        c.save(); c.translate(x, y + s * 0.55); c.rotate(sw);
        for (let k = -1; k <= 1; k++) {
          c.strokeStyle = '#5e824c'; c.lineWidth = 1.3;
          c.beginPath(); c.moveTo(k * 2, 0); c.lineTo(k * s * 0.18, -h); c.stroke();
          for (let j = 0; j < 6; j++) {
            c.fillStyle = j % 2 ? '#7c3aed' : '#a78bfa';
            c.beginPath();
            c.ellipse(k * s * 0.18 * (j / 6 + 0.2), -h * (0.42 + j * 0.1), s * 0.075, s * 0.11, k * 0.2, 0, TAU);
            c.fill();
          }
        }
        c.restore();
      },
      missed(c, x, y, s) {
        c.save(); c.translate(x, y + s * 0.55);
        c.strokeStyle = '#9c8b9e'; c.lineWidth = 1.2;
        c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(s * 0.1, -s * 0.4, s * 0.25, -s * 0.5); c.stroke();
        c.restore();
      },
      future(c, x, y, s) {
        c.save(); c.translate(x, y + s * 0.55);
        c.strokeStyle = '#9b82cc'; dashed(c, 1);
        c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -s * 0.6); c.stroke(); dashed(c, 0);
        c.restore();
      }
    },

    /* 10. 極光：極地雪山與冰湖極光 (Arctic Peaks & Aurora Reflection) */
    aurora: {
      bg: ['#041322', '#071d30', '#0b293f'], dark: true, label: '#99d5cf', stars: true,
      stage(c, W, H) {
        // Frozen glacial lake at bottom & jagged snow-capped peaks
        const lakeY = H - 30;
        const lg = c.createLinearGradient(0, lakeY, 0, H);
        lg.addColorStop(0, '#0d3146'); lg.addColorStop(1, '#061724');
        c.fillStyle = lg; c.fillRect(0, lakeY, W, 30);
        // Jagged arctic mountains
        c.fillStyle = '#102a3d';
        c.beginPath(); c.moveTo(0, lakeY);
        const peaks = [[0.12, 32], [0.28, 18], [0.45, 38], [0.64, 22], [0.82, 34], [1, 14]];
        for (const [px, ph] of peaks) c.lineTo(W * px, lakeY - ph);
        c.lineTo(W, lakeY); c.closePath(); c.fill();
      },
      done(c, x, y, s, a, t, i) {
        const cols = ['52,211,153', '45,212,191', '167,139,250'], col = cols[i % 3];
        const h = (32 + s * 2.5) * a, w = 6 + s * 0.22;
        const g = c.createLinearGradient(0, 6, 0, 6 + h);
        g.addColorStop(0, `rgba(${col},0)`); g.addColorStop(0.38, `rgba(${col},0.78)`); g.addColorStop(1, `rgba(${col},0)`);
        c.fillStyle = g; c.beginPath();
        for (let j = 0; j <= 10; j++) {
          const yy = 6 + (h * j) / 10, xx = x - w + Math.sin(t * 0.002 + j * 0.55 + i) * 5.5;
          j ? c.lineTo(xx, yy) : c.moveTo(xx, yy);
        }
        for (let j = 10; j >= 0; j--) c.lineTo(x + w + Math.sin(t * 0.002 + j * 0.55 + i) * 5.5, 6 + (h * j) / 10);
        c.closePath(); c.fill();
        // Shimmering reflection on the ice lake at the bottom
        c.fillStyle = `rgba(${col}, 0.22)`;
        c.fillRect(x - w * 0.8, 174 + (i % 4) * 3, w * 1.6, 2);
      },
      missed(c, x, y, s) {
        c.strokeStyle = 'rgba(255,154,168,0.5)'; c.lineWidth = 1;
        c.beginPath(); c.moveTo(x, 14); c.lineTo(x, 14 + s * 0.8); c.stroke();
      },
      future(c, x, y, s) {
        c.strokeStyle = 'rgba(143,180,180,0.55)'; dashed(c, 1);
        c.beginPath(); c.moveTo(x, 14); c.lineTo(x, 14 + s * 0.8); c.stroke(); dashed(c, 0);
      }
    },

    /* 11. 雪地：銀裝冰晶雪原 (Crystalline Snowfield) */
    snow: {
      bg: ['#eef6fc', '#d5e7f7', '#bad5ee'], dark: false, label: '#324e69', snowy: true,
      done(c, x, y, s, a, t, i) {
        const r = s * 0.48 * a, fy = Math.sin(t * 0.0014 + i) * 2.5;
        c.save(); c.translate(x, y + fy); c.rotate(t * 0.00035 + i);
        // Soft icy glow
        const g = c.createRadialGradient(0, 0, 0, 0, 0, r * 1.3);
        g.addColorStop(0, 'rgba(255,255,255,0.85)'); g.addColorStop(1, 'rgba(255,255,255,0)');
        c.fillStyle = g; c.beginPath(); c.arc(0, 0, r * 1.3, 0, TAU); c.fill();
        c.strokeStyle = '#3b82c4'; c.lineWidth = 1.4; c.lineCap = 'round';
        if (ART.drawCrystalSnowflake) ART.drawCrystalSnowflake(c, r);
        c.restore();
      },
      missed(c, x, y, s) {
        c.fillStyle = 'rgba(194,55,44,0.38)'; c.beginPath(); c.arc(x, y, s * 0.14, 0, TAU); c.fill();
      },
      future(c, x, y, s) {
        c.strokeStyle = '#7ea3c4'; dashed(c, 1); c.beginPath(); c.arc(x, y, s * 0.3, 0, TAU); c.stroke(); dashed(c, 0);
      }
    },

    /* 12. 咖啡：胡桃木吧檯與拉花拿鐵 (Walnut Barista Shelf & Latte Art) */
    coffee: {
      bg: ['#f5eadc', '#e8d5bc', '#d8be9c'], dark: false, label: '#593d26', layout: 'shelf',
      stage(c, W, H) {
        // Warm pendant cafe lights at top
        for (let k = 1; k <= 3; k++) {
          const lx = (W * k) / 4;
          const lg = c.createRadialGradient(lx, 12, 2, lx, 12, 55);
          lg.addColorStop(0, 'rgba(255, 225, 160, 0.55)'); lg.addColorStop(1, 'rgba(255, 225, 160, 0)');
          c.fillStyle = lg; c.beginPath(); c.arc(lx, 12, 55, 0, TAU); c.fill();
        }
        drawWoodenShelves(c, W, H, '#9c6b43', '#6e4726');
      },
      done(c, x, y, s, a, t, i) {
        const w = s * 0.78 * a, h = w * 0.66;
        c.save(); c.translate(x, y - h * 0.5);
        // Saucer plate on shelf
        c.fillStyle = '#fffaf3'; c.strokeStyle = '#7b5230'; c.lineWidth = 1.2;
        c.beginPath(); c.ellipse(0, h * 0.52, w * 0.58, h * 0.1, 0, 0, TAU); c.fill(); c.stroke();
        // Cup handle
        c.beginPath(); c.arc(w * 0.44, -h * 0.04, h * 0.25, -1.4, 1.4); c.stroke();
        // Porcelain cup body
        c.fillStyle = '#fffaf3';
        c.beginPath();
        c.moveTo(-w / 2, -h / 2); c.lineTo(w / 2, -h / 2);
        c.quadraticCurveTo(w * 0.45, h / 2, 0, h / 2);
        c.quadraticCurveTo(-w * 0.45, h / 2, -w / 2, -h / 2);
        c.closePath(); c.fill(); c.stroke();
        // Rich espresso crema & tiny white heart latte art
        c.fillStyle = '#6f4526';
        c.beginPath(); c.ellipse(0, -h / 2, Math.max(0.1, w / 2 - 1), Math.max(0.1, h * 0.16), 0, 0, TAU); c.fill();
        c.fillStyle = '#fff5e4';
        c.beginPath(); c.arc(0, -h / 2, w * 0.12, 0, TAU); c.fill();
        // Aromatic steam wisps
        c.strokeStyle = 'rgba(110, 70, 38, 0.48)'; c.lineCap = 'round';
        for (let k = -1; k <= 1; k += 2) {
          c.beginPath();
          for (let j = 0; j <= 6; j++) {
            const yy = -h / 2 - 3 - j * 2.5 * a, xx = k * w * 0.14 + Math.sin(t * 0.003 + j + i * 2) * 1.8;
            j ? c.lineTo(xx, yy) : c.moveTo(xx, yy);
          }
          c.stroke();
        }
        c.restore();
      },
      missed(c, x, y, s) {
        const w = s * 0.66, h = w * 0.64;
        c.save(); c.translate(x, y - h * 0.5);
        c.strokeStyle = '#b05a4a'; c.lineWidth = 1.2;
        c.beginPath(); c.moveTo(-w / 2, -h / 2); c.lineTo(w / 2, -h / 2); c.lineTo(w * 0.36, h / 2); c.lineTo(-w * 0.36, h / 2); c.closePath(); c.stroke();
        c.restore();
      },
      future(c, x, y, s) {
        const w = s * 0.66, h = w * 0.64;
        c.save(); c.translate(x, y - h * 0.5);
        c.strokeStyle = '#997a5c'; dashed(c, 1);
        c.beginPath(); c.moveTo(-w / 2, -h / 2); c.lineTo(w / 2, -h / 2); c.lineTo(w * 0.36, h / 2); c.lineTo(-w * 0.36, h / 2); c.closePath(); c.stroke();
        dashed(c, 0); c.restore();
      }
    },

    /* 13. 沙漠：星月金沙綠洲 (Golden Dunes & Oasis Cacti) */
    desert: {
      bg: ['#fde8c2', '#f5cb8c', '#e6ad63'], dark: false, label: '#63401b', ground: '#d99e52',
      stage(c, W, H) {
        // Sweeping golden dunes & turquoise oasis pond
        c.fillStyle = '#e2a95f';
        c.beginPath(); c.moveTo(0, H);
        for (let x = 0; x <= W; x += 18) c.lineTo(x, H - 42 + Math.sin(x * 0.008) * 12);
        c.lineTo(W, H); c.closePath(); c.fill();
        c.fillStyle = 'rgba(45, 180, 170, 0.45)';
        c.beginPath(); c.ellipse(W * 0.5, H - 22, 64, 7, 0, 0, TAU); c.fill();
      },
      done(c, x, y, s, a) {
        const h = s * 1.22 * a;
        c.save(); c.translate(x, y + s * 0.6); c.fillStyle = '#2f8548';
        c.beginPath(); c.roundRect(-s * 0.1, -h, s * 0.2, h, s * 0.1); c.fill();
        c.beginPath(); c.roundRect(-s * 0.34, -h * 0.62, s * 0.12, h * 0.3, s * 0.06); c.fill();
        c.beginPath(); c.roundRect(-s * 0.34, -h * 0.4, s * 0.3, s * 0.1, s * 0.05); c.fill();
        c.beginPath(); c.roundRect(s * 0.22, -h * 0.78, s * 0.12, h * 0.3, s * 0.06); c.fill();
        c.beginPath(); c.roundRect(s * 0.04, -h * 0.55, s * 0.3, s * 0.1, s * 0.05); c.fill();
        if (a > 0.85) {
          c.fillStyle = '#f43f5e';
          c.beginPath(); c.arc(0, -h, s * 0.085, 0, TAU); c.fill();
        }
        c.restore();
      },
      missed(c, x, y, s) {
        c.save(); c.translate(x, y + s * 0.6); c.strokeStyle = '#9e7644'; c.lineWidth = 1.2;
        c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -s * 0.75); c.moveTo(0, -s * 0.4); c.lineTo(-s * 0.22, -s * 0.3); c.moveTo(0, -s * 0.55); c.lineTo(s * 0.2, -s * 0.45); c.stroke();
        c.restore();
      },
      future(c, x, y, s) {
        c.save(); c.translate(x, y + s * 0.6); c.strokeStyle = '#997543'; dashed(c, 1);
        c.beginPath(); c.roundRect(-s * 0.08, -s * 0.5, s * 0.16, s * 0.5, s * 0.08); c.stroke(); dashed(c, 0);
        c.restore();
      }
    },

    /* 14. 糖果：法式甜點玻璃層架 (Patisserie Display Shelf) */
    candy: {
      bg: ['#fff1f7', '#ffe2ef', '#dcebff'], dark: false, label: '#823360', layout: 'shelf',
      stage(c, W, H) {
        drawWoodenShelves(c, W, H, 'rgba(244, 114, 182, 0.35)', 'rgba(219, 39, 119, 0.3)');
      },
      done(c, x, y, s, a, t, i) {
        const r = s * 0.35 * a, cols = ['#ff6ba9', '#5ec2ff', '#ffbe3b', '#5cd69a'], col = cols[i % 4];
        c.save(); c.translate(x, y - r * 0.9);
        c.rotate(Math.sin(t * 0.002 + i) * 0.1);
        c.fillStyle = col;
        c.beginPath(); c.moveTo(-r * 0.8, 0); c.lineTo(-r * 1.65, -r * 0.58); c.lineTo(-r * 1.65, r * 0.58); c.closePath(); c.fill();
        c.beginPath(); c.moveTo(r * 0.8, 0); c.lineTo(r * 1.65, -r * 0.58); c.lineTo(r * 1.65, r * 0.58); c.closePath(); c.fill();
        c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill();
        c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = Math.max(1.1, r * 0.22);
        c.beginPath(); c.arc(0, 0, r * 0.55, -2.4, -0.6); c.stroke();
        c.restore();
      },
      missed(c, x, y, s) {
        c.strokeStyle = '#c98aa8'; c.fillStyle = 'rgba(194,55,44,0.1)'; c.lineWidth = 1.2;
        c.beginPath(); c.arc(x, y - s * 0.25, s * 0.28, 0, TAU); c.fill(); c.stroke();
      },
      future(c, x, y, s) {
        c.strokeStyle = '#d19cb8'; dashed(c, 1);
        c.beginPath(); c.arc(x, y - s * 0.25, s * 0.28, 0, TAU); c.stroke(); dashed(c, 0);
      }
    },

    /* 15. 銀河：雙旋臂星雲與行星系 (Spiral Nebula & Planetary System) */
    galaxy: {
      bg: ['#06030f', '#12092b', '#21124c'], dark: true, label: '#b8abde', stars: true,
      stage(c, W, H, t) {
        // Luminous diagonal Milky Way nebula band
        c.save();
        const ng = c.createLinearGradient(0, H, W, 0);
        ng.addColorStop(0, 'rgba(124, 58, 237, 0)');
        ng.addColorStop(0.35, 'rgba(167, 139, 250, 0.16)');
        ng.addColorStop(0.65, 'rgba(56, 189, 248, 0.16)');
        ng.addColorStop(1, 'rgba(56, 189, 248, 0)');
        c.fillStyle = ng;
        c.beginPath();
        c.moveTo(0, H * 0.85); c.quadraticCurveTo(W * 0.5, H * 0.35, W, 0);
        c.lineTo(W, H * 0.35); c.quadraticCurveTo(W * 0.5, H * 0.7, 0, H);
        c.closePath(); c.fill();
        c.restore();
      },
      done(c, x, y, s, a, t, i) {
        const PLANET = [['#f3e8ff', '#7c3aed'], ['#e0f2fe', '#0284c7'], ['#ffe4e6', '#e11d48'], ['#fef3c7', '#d97706']];
        const r = s * 0.34 * a, [lt, dk] = PLANET[i % 4];
        const g = c.createRadialGradient(x - r * 0.35, y - r * 0.35, 0, x, y, r);
        g.addColorStop(0, lt); g.addColorStop(1, dk);
        c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
        if (i % 2 === 0) {
          c.save(); c.translate(x, y); c.rotate(-0.38 + Math.sin(t * 0.0006 + i) * 0.06);
          c.strokeStyle = 'rgba(255,255,255,0.68)'; c.lineWidth = 1.4;
          c.beginPath(); c.ellipse(0, 0, r * 1.75, r * 0.44, 0, 0, TAU); c.stroke();
          c.restore();
        } else {
          // Orbiting tiny moon
          const ma = t * 0.002 + i;
          c.fillStyle = '#ffffff';
          c.beginPath(); c.arc(x + Math.cos(ma) * r * 1.45, y + Math.sin(ma) * r * 0.65, r * 0.2, 0, TAU); c.fill();
        }
      },
      missed(c, x, y, s) {
        c.strokeStyle = 'rgba(255,150,170,0.5)'; c.lineWidth = 1;
        c.beginPath(); c.arc(x, y, s * 0.26, 0, TAU); c.stroke();
      },
      future(c, x, y, s) {
        c.strokeStyle = 'rgba(169,155,207,0.55)'; dashed(c, 1);
        c.beginPath(); c.arc(x, y, s * 0.26, 0, TAU); c.stroke(); dashed(c, 0);
      }
    },

    /* 16. 楓葉：京都嵐山金秋楓林 (True Palmate Momiji & Ginkgo Canopy) */
    autumn: {
      bg: ['#fdf0df', '#f8d2a8', '#ecab72'], dark: false, label: '#6e3212', layout: 'canopy',
      stage(c, W, H, t, items) {
        // Distant crimson-gold autumn mountain ridges
        c.fillStyle = 'rgba(217, 84, 30, 0.16)';
        c.beginPath(); c.moveTo(0, H);
        for (let x = 0; x <= W; x += 18) c.lineTo(x, H - 34 - Math.abs(Math.sin(x * 0.007 + 0.8)) * 18);
        c.lineTo(W, H); c.closePath(); c.fill();
        drawCanopyBranches(c, W, H, items, 'rgba(95, 45, 22, 0.42)', 'rgba(120, 58, 28, 0.32)');
      },
      done(c, x, y, s, a, t, i) {
        const cols = ['#d9381e', '#ea6a1f', '#b82914', '#eab308'];
        const sw = (i % 2 ? 0.25 : -0.25) + Math.sin(t * 0.0018 + i) * 0.12;
        c.save(); c.translate(x, y); c.rotate(sw);
        if (i % 5 === 4 && ART.drawGinkgoLeaf) {
          ART.drawGinkgoLeaf(c, s * 0.56 * a, cols[3]);
        } else if (ART.drawMomijiWithVeins) {
          ART.drawMomijiWithVeins(c, s * 0.58 * a, cols[i % 4], 'rgba(80, 20, 8, 0.42)');
        }
        c.restore();
      },
      missed(c, x, y, s, a, t, i) {
        c.save(); c.translate(x, y); c.rotate(i * 0.6);
        c.strokeStyle = '#9a5f42'; c.fillStyle = 'rgba(150, 95, 65, 0.16)'; c.lineWidth = 1.1;
        if (ART.traceMomijiLeaf) { ART.traceMomijiLeaf(c, s * 0.44); c.fill(); c.stroke(); }
        c.restore();
      },
      future(c, x, y, s, a, t, i) {
        c.save(); c.translate(x, y); c.rotate(i * 0.6);
        c.strokeStyle = '#a86b43'; dashed(c, 1);
        if (ART.traceMomijiLeaf) { ART.traceMomijiLeaf(c, s * 0.44); c.stroke(); }
        dashed(c, 0); c.restore();
      }
    },

    /* 17. 雨夜：Lo-Fi 城市大樓天際線與萬家燈火 (City Skyline & Lit Apartment Windows) */
    rain: {
      bg: ['#08101a', '#0f1b2b', '#182a3e'], dark: true, label: '#9bb3c9', layout: 'city',
      stage(c, W, H, t, items) {
        const streetY = H - 30;
        // Background distant skyline
        c.fillStyle = '#0c1624';
        for (let i = 0; i < 14; i++) {
          const bx = (i / 14) * W, bw = W / 14 + 4, bh = 55 + ((i * 37) % 65);
          c.fillRect(bx, streetY - bh, bw, bh);
        }
        // 7 Main Apartment Buildings (one for each day of the week, Mon-Sun)
        const colW = W / 7;
        for (let d = 0; d < 7; d++) {
          const bx = d * colW + colW * 0.1, bw = colW * 0.8, bh = 122 + ((d * 19) % 24);
          const topY = streetY - bh;
          c.fillStyle = '#111f30';
          c.strokeStyle = 'rgba(142, 163, 184, 0.2)';
          c.lineWidth = 1;
          c.fillRect(bx, topY, bw, bh);
          c.strokeRect(bx, topY, bw, bh);
          // Rooftop water tank / antenna details
          c.fillRect(bx + bw * 0.2, topY - 6, bw * 0.28, 6);
          c.beginPath(); c.moveTo(bx + bw * 0.75, topY); c.lineTo(bx + bw * 0.75, topY - 12); c.stroke();
        }
        // Wet asphalt street & warm window reflections
        c.fillStyle = '#070d15';
        c.fillRect(0, streetY, W, 30);
        for (const it of items) {
          if (it.state !== 'done') continue;
          c.fillStyle = 'rgba(255, 210, 120, 0.18)';
          c.fillRect(it.x - 6, streetY + 3 + (it.i % 3) * 3, 12, 2);
        }
      },
      done(c, x, y, s, a, t, i) {
        const w = Math.min(22, s * 0.52) * a, h = Math.min(26, s * 0.62) * a;
        const f = 0.88 + 0.12 * Math.sin(t * 0.004 + i * 2.3);
        const g = c.createRadialGradient(x, y, 0, x, y, s * 0.9 * a);
        g.addColorStop(0, `rgba(255,205,120,${0.38 * f})`); g.addColorStop(1, 'rgba(255,205,120,0)');
        c.fillStyle = g; c.beginPath(); c.arc(x, y, s * 0.9 * a, 0, TAU); c.fill();
        c.fillStyle = `rgba(255,216,135,${f})`;
        c.beginPath(); c.roundRect(x - w / 2, y - h / 2, w, h, 2); c.fill();
        // Window mullion bars
        c.strokeStyle = 'rgba(40,30,15,0.6)'; c.lineWidth = 1.1;
        c.beginPath();
        c.moveTo(x, y - h / 2); c.lineTo(x, y + h / 2);
        c.moveTo(x - w / 2, y); c.lineTo(x + w / 2, y);
        c.stroke();
      },
      missed(c, x, y, s) {
        const w = Math.min(20, s * 0.48), h = Math.min(24, s * 0.58);
        c.fillStyle = 'rgba(8, 13, 21, 0.65)'; c.strokeStyle = 'rgba(255,140,140,0.4)'; c.lineWidth = 1;
        c.beginPath(); c.roundRect(x - w / 2, y - h / 2, w, h, 2); c.fill(); c.stroke();
      },
      future(c, x, y, s) {
        const w = Math.min(20, s * 0.48), h = Math.min(24, s * 0.58);
        c.strokeStyle = 'rgba(142,163,184,0.5)'; dashed(c, 1);
        c.beginPath(); c.roundRect(x - w / 2, y - h / 2, w, h, 2); c.stroke(); dashed(c, 0);
      }
    },

    /* 18. 水墨：東方山水與寒梅朱印卷 (Shan-Shui Ink Wash & Red Plum Blossoms) */
    ink: {
      bg: ['#faf8f2', '#f2eee4', '#e6e0d2'], dark: false, label: '#4f4b42', layout: 'canopy',
      stage(c, W, H, t, items, doneN) {
        // Distant ink-wash mountains (遠山淡墨)
        [[0.68, 'rgba(60, 58, 52, 0.11)', 0], [0.80, 'rgba(40, 38, 34, 0.17)', 2.2]].forEach(([by, col, ph]) => {
          c.fillStyle = col; c.beginPath(); c.moveTo(0, H);
          for (let x = 0; x <= W; x += 16) c.lineTo(x, H * by - Math.abs(Math.sin(x * 0.006 + ph)) * 28 - Math.sin(x * 0.018) * 8);
          c.lineTo(W, H); c.closePath(); c.fill();
        });
        // Calligraphic ink plum branches
        drawCanopyBranches(c, W, H, items, 'rgba(28, 26, 23, 0.68)', 'rgba(45, 42, 38, 0.45)');
        // Traditional cinnabar red seal stamp (朱印) in top-left corner when blocks are done
        if (doneN > 0) {
          c.save();
          c.fillStyle = 'rgba(190, 35, 28, 0.82)';
          c.beginPath(); c.roundRect(14, 12, 20, 24, 2); c.fill();
          c.fillStyle = '#faf8f2'; c.font = 'bold 11px serif'; c.textAlign = 'center';
          c.fillText('步調', 24, 28);
          c.restore();
        }
      },
      done(c, x, y, s, a, t, i) {
        const r = s * 0.36 * Math.min(a, 1.1), st = -0.9 + i * 0.7;
        // Zen Enso ink brush circle
        c.strokeStyle = 'rgba(25,25,25,0.85)'; c.lineCap = 'round'; c.lineWidth = Math.max(1.8, s * 0.11);
        c.beginPath(); c.arc(x, y, r, st, st + TAU * 0.84 * clamp(a, 0, 1)); c.stroke();
        // Cinnabar red plum blossom (朱砂紅梅) blooming on the Enso ring
        const bx = x + Math.cos(st + 1.2) * r * 0.7, by = y + Math.sin(st + 1.2) * r * 0.7, pr = r * 0.42;
        c.fillStyle = '#c82822';
        for (let k = 0; k < 5; k++) {
          const pa = (k * TAU) / 5;
          c.beginPath(); c.arc(bx + Math.cos(pa) * pr * 0.55, by + Math.sin(pa) * pr * 0.55, pr * 0.42, 0, TAU); c.fill();
        }
        c.fillStyle = '#fde047';
        c.beginPath(); c.arc(bx, by, pr * 0.2, 0, TAU); c.fill();
        c.lineWidth = 1;
      },
      missed(c, x, y, s, a, t, i) {
        const st = -0.9 + i * 0.7;
        c.strokeStyle = 'rgba(25,25,25,0.28)'; c.lineWidth = 1.1;
        c.beginPath(); c.arc(x, y, s * 0.3, st, st + 2.4); c.stroke();
      },
      future(c, x, y, s) {
        c.strokeStyle = 'rgba(100,95,85,0.5)'; dashed(c, 1);
        c.beginPath(); c.arc(x, y, s * 0.28, 0, TAU); c.stroke(); dashed(c, 0);
      }
    }
  };

  window.PACE_SCENE_IDS = Object.keys(SCENES);
  const useScene = () => {
    if (keepOriginal && (skin === 'default' || skin === 'night')) return null;
    return SCENES[skin] || null;
  };

  const TEXT = {
    default: ['這週的晨曦花園', '每完成一個方塊就萌發一株向陽新芽', '每完成一個方塊綻放一株向陽花苗，越久越高；低垂的枝條是過期沒做的，虛線花苞是還沒到的。生機 = 這週完成 ÷ 每週目標。'],
    night: ['這週的夜空', '每完成一個方塊就點亮一顆星並連成星座', '每完成一個方塊點亮一顆星辰並連起星座軌跡；暗圈是時間過了沒做的，虛線是還沒到的。亮度 = 這週完成 ÷ 每週目標。'],
    sakura: ['這週的花園', '每完成一個方塊就在枝頭綻放一朵春櫻', '每完成一個方塊在櫻枝綻放一朵五瓣櫻花，越久越大；合起的花苞是過期沒做的，虛線是還沒到的。花開 = 這週完成 ÷ 每週目標。'],
    ocean: ['這週的海底', '每完成一個方塊就躍動一顆珊瑚礁氣泡', '每完成一個方塊冒出一顆氣泡與游魚，越久越大；破掉的圈是時間過了沒做的，虛線是還沒到的。潛水深度 = 這週完成 ÷ 每週目標。'],
    matcha: ['這週的茶席', '每完成一個方塊就在茶架沏好一碗抹茶', '每完成一個方塊在木質茶架沏好一碗抹茶，熱氣裊裊；空碗是過期沒做的，虛線是還沒到的。茶韻 = 這週完成 ÷ 每週目標。'],
    neon: ['這週的燈牆', '每完成一個方塊就充能一座賽博晶柱', '每完成一個方塊點亮並串連一座霓虹晶柱，越久越亮；暗圈是過期沒做的，虛線是還沒到的。能量 = 這週完成 ÷ 每週目標。'],
    sunset: ['這週的晚霞', '每完成一個方塊就升起一盞祈福天燈', '每完成一個方塊在暮色海灣升起一盞溫暖天燈，越久越大；暗框是過期沒做的，虛線是還沒到的。暮光 = 這週完成 ÷ 每週目標。'],
    forest: ['這週的森林', '每完成一個方塊就種下一棵蒼翠古樹', '每完成一個方塊在螢火林間種下一棵樹，越久越高；枯枝是過期沒做的，虛線小苗是還沒到的。森林覆蓋 = 這週完成 ÷ 每週目標。'],
    lavender: ['這週的花田', '每完成一個方塊就盛開一穗薰衣草', '每完成一個方塊長出一束飽滿薰衣草，越久越高；枯枝是過期沒做的，虛線是還沒到的。花香 = 這週完成 ÷ 每週目標。'],
    aurora: ['這週的極光', '每完成一個方塊就舞動一道極地光幕', '每完成一個方塊在雪山冰湖升起一道極光並映出倒影；細線是過期沒做的，虛線是還沒到的。極光強度 = 這週完成 ÷ 每週目標。'],
    snow: ['這週的雪地', '每完成一個方塊就凝結一朵六角冰晶', '每完成一個方塊落下六角冰晶雪花，地上的積雪越堆越高；灰點是過期沒做的，虛線是還沒到的。積雪 = 這週完成 ÷ 每週目標。'],
    coffee: ['這週的咖啡館', '每完成一個方塊就在吧檯沖好一杯拉花拿鐵', '每完成一個方塊在胡桃木吧檯沖好一杯拉花拿鐵；空杯是過期沒做的，虛線是還沒到的。醇香 = 這週完成 ÷ 每週目標。'],
    desert: ['這週的沙漠', '每完成一個方塊就盛放一株綠洲仙人掌', '每完成一個方塊在沙丘綠洲長出一株開花仙人掌；枯枝是過期沒做的，虛線是還沒到的。綠洲 = 這週完成 ÷ 每週目標。'],
    candy: ['這週的糖果罐', '每完成一個方塊就珍藏一顆法式甜點', '每完成一個方塊在甜點層架放上一顆繽紛糖果；淡圈是過期沒做的，虛線是還沒到的。甜度 = 這週完成 ÷ 每週目標。'],
    galaxy: ['這週的星系', '每完成一個方塊就探索一顆星雲行星', '每完成一個方塊在雙旋臂星雲點亮一顆環帶行星；細圈是過期沒做的，虛線是還沒到的。航行距離 = 這週完成 ÷ 每週目標。'],
    autumn: ['這週的楓林', '每完成一個方塊就染紅一片嵐山秋楓', '每完成一個方塊在枝頭染紅一片七裂紅楓或黃金銀杏；褪色葉是過期沒做的，虛線是還沒到的。秋意 = 這週完成 ÷ 每週目標。'],
    rain: ['這週的雨夜城市', '每完成一個方塊就點亮一扇大樓夜窗', '每完成一個方塊在雨夜公寓點亮一扇溫暖窗燈並映出街景倒影；暗窗是過期沒做的，虛線是還沒到的。萬家燈火 = 這週完成 ÷ 每週目標。'],
    ink: ['這週的墨跡', '每完成一個方塊就題下一枝水墨寒梅', '每完成一個方塊在山水畫卷揮毫圓相與朱砂紅梅；淡弧是過期沒做的，虛線是還沒到的。墨韻 = 這週完成 ÷ 每週目標。']
  };

  const original = { title: null, label: null, hint: null };
  function retext() {
    const card = document.getElementById('rSkyCard'); if (!card) return;
    const h = card.querySelector('h3'), cv = document.getElementById('rSky'), p = cv && cv.nextElementSibling;
    if (original.title === null) { original.title = h.textContent; original.label = cv.getAttribute('aria-label'); original.hint = p.textContent; }
    const t = useScene() && TEXT[skin];
    h.textContent = t ? t[0] : original.title;
    cv.setAttribute('aria-label', t ? t[1] : original.label);
    p.textContent = t ? t[2] : original.hint;
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
    for (let i = 0; i < 70; i++) { rnd(); rnd(); }

    // Count per-day index so shelf / city layouts can arrange items cleanly without overlapping
    const dayCounts = [0, 0, 0, 0, 0, 0, 0];
    const items = blocks.map((b, i) => {
      const day = b.day, slotIdx = dayCounts[day]++;
      const colW = W / 7, baseX = (day + 0.5) * colW;
      let x = baseX + (rnd() - 0.5) * colW * 0.58;
      let y = 18 + ((toMin(b.start) - START) / SPAN) * (H - 52);
      if (sc.layout === 'shelf') {
        const shelfYs = [H * 0.36 - 2, H * 0.60 - 2, H * 0.84 - 2];
        y = shelfYs[slotIdx % 3];
        x = baseX + ((Math.floor(slotIdx / 3) % 2 ? 1 : -1) * (slotIdx > 2 ? 12 : 0)) + (rnd() - 0.5) * 10;
      } else if (sc.layout === 'city') {
        const lane = slotIdx % 2 === 0 ? -colW * 0.16 : colW * 0.16;
        const row = Math.floor(slotIdx / 2);
        x = baseX + lane;
        y = clamp(H - 54 - row * 28, 52, H - 46);
      } else if (sc.layout === 'garden') {
        y = H - 36 - (slotIdx % 3) * 8;
        x = baseX + (slotIdx - 1) * 11 + (rnd() - 0.5) * 8;
      } else if (sc.ground) {
        y = H - 40 - (y / H) * 14;
      }
      const date = ymd(addDays(monday, b.day));
      return {
        b, i, x: clamp(x, 20, W - 20), y,
        s: clamp(Math.sqrt(b.minutes) * 3.6, 16, 40),
        state: b.done ? 'done' : blockEnd(date, b) <= now ? 'missed' : 'future'
      };
    });

    const doneN = items.filter(it => it.state === 'done').length;
    const animate = typeof fxOn !== 'undefined' && fxOn && !(typeof reduceMotion !== 'undefined' && reduceMotion);
    const st = { canvas, raf: 0, timer: 0, t0: performance.now(), skin, last: 0, hoverItem: null, items };
    canvas.__scene = st;

    if (!canvas.__boundHover) {
      canvas.__boundHover = true;
      canvas.addEventListener('mousemove', e => {
        if (!canvas.__scene) return;
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left, my = e.clientY - rect.top;
        const sc0 = canvas.__scene, hit = sc0.items.find(it => Math.hypot(it.x - mx, it.y - my) <= it.s * 0.75), changed = sc0.hoverItem !== (hit || null);
        sc0.hoverItem = hit || null;
        if (changed && !sc0.raf) sc0.raf = requestAnimationFrame(sc0.frame);
        canvas.style.cursor = hit ? 'pointer' : 'default';
        if (hit) {
          canvas.title = `${hit.b.name} (${hit.b.minutes}分) · ${hit.state === 'done' ? '已完成 ✅' : hit.state === 'missed' ? '時間已過 ❌' : '尚未開始 ⏳'}`;
        } else {
          canvas.removeAttribute('title');
        }
      });
      canvas.addEventListener('mouseleave', () => {
        const sc0 = canvas.__scene; if (sc0) { sc0.hoverItem = null; if (!sc0.raf) sc0.raf = requestAnimationFrame(sc0.frame); }
        canvas.style.cursor = 'default';
      });
    }

    const stars = sc.stars ? Array.from({ length: 70 }, () => ({ x: rnd() * W, y: rnd() * (H - 34), r: rnd() * 1.15 + 0.3, p: rnd() * 6.28 })) : null;
    const frame = ts => {
      st.raf = 0;
      if (!canvas.isConnected || canvas.__scene !== st || st.skin !== skin) return;
      if (canvas.offsetParent === null) { st.timer = setTimeout(() => { st.raf = requestAnimationFrame(frame); }, 400); return; }
      if (animate && ts - st.last < 33) { st.raf = requestAnimationFrame(frame); return; }
      st.last = ts;
      const t = animate ? ts : 0, el = animate ? ts - st.t0 : 99999, c = canvas.getContext('2d');
      c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, W, H);
      const g = c.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, sc.bg[0]); g.addColorStop(0.55, sc.bg[1]); g.addColorStop(1, sc.bg[2]);
      c.fillStyle = g; c.fillRect(0, 0, W, H);

      if (doneN > 0 && doneN >= items.length) {
        c.save();
        const goldG = c.createRadialGradient(W / 2, 0, 0, W / 2, 0, Math.max(W, H) * 0.8);
        goldG.addColorStop(0, 'rgba(255, 230, 150, 0.28)');
        goldG.addColorStop(0.5, 'rgba(255, 210, 100, 0.1)');
        goldG.addColorStop(1, 'rgba(255, 255, 255, 0)');
        c.fillStyle = goldG;
        c.fillRect(0, 0, W, H);
        c.restore();
      }

      if (stars) {
        for (const s of stars) {
          c.globalAlpha = 0.3 + 0.65 * Math.abs(Math.sin(t * 0.0016 + s.p));
          c.fillStyle = '#fff'; c.beginPath(); c.arc(s.x, s.y, s.r, 0, TAU); c.fill();
        }
      }
      c.globalAlpha = 1;
      if (sc.ground) { c.fillStyle = sc.ground; c.fillRect(0, H - 32, W, 32); }
      if (sc.snowy) {
        const mh = 6 + Math.min(34, doneN * 3.2) * (1 - Math.pow(1 - clamp(el / 1200, 0, 1), 3));
        c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(0, H);
        for (let x = 0; x <= W; x += 12) c.lineTo(x, H - 22 - mh * (0.7 + 0.3 * Math.sin(x * 0.03)));
        c.lineTo(W, H); c.closePath(); c.fill();
      }
      if (typeof sc.stage === 'function') {
        c.save();
        try { sc.stage(c, W, H, t, items, doneN); } catch (e) {}
        c.restore();
      }

      c.lineWidth = 1.2;
      for (const it of items) {
        const isHovered = st.hoverItem === it;
        const a = it.state === 'done' ? back((el - it.i * 55) / 750) : 1;
        if (a <= 0) continue;
        c.save();
        c.globalAlpha = it.state === 'done' ? clamp(a * 1.4, 0, 1) : clamp((el - it.i * 20) / 300, 0, 1);
        if (isHovered) {
          c.shadowBlur = 14;
          c.shadowColor = sc.label || '#ffb703';
        }
        try { sc[it.state](c, it.x, it.y, it.s * (isHovered ? 1.16 : 1), clamp(a, 0.02, 1.18), t, it.i); } catch (e) {}
        c.restore();
      }
      c.globalAlpha = 0.8; c.fillStyle = sc.label; c.font = '12px "Noto Sans TC", sans-serif'; c.textAlign = 'center';
      DAYN.forEach((n, i) => c.fillText('週' + n, ((i + 0.5) / 7) * W, H - 8)); c.globalAlpha = 1;
      if (animate || el < 1500 || st.hoverItem) st.raf = requestAnimationFrame(frame);
    };
    st.frame = frame; st.raf = requestAnimationFrame(frame);
  };

  const apply1 = applySkin;
  window.applySkin = function () {
    apply1();
    try { retext(); if (typeof report !== 'undefined' && report.mode === 'week' && document.body.classList.contains('r')) renderReport(); } catch (e) {}
  };
})();
