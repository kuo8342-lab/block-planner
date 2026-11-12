/* 步調 Pace: 「心流奇蹟工程」 (Wonders of Focus), a weekly building project that shows the week's progress as something standing:
   - 不是耗費時間玩的遊戲，而是利用「One More Turn（再推進一步奇蹟就落成了！）」的強烈自律心智引導；
   - 每週承接一座世界奇蹟工程（亞歷山大圖書館、空中花園、星空天文台、太陽金字塔、巨人燈塔…），各有專屬建築幾何與動態光影；
   - 每完成一個方塊 = 運送砌上一塊漢白玉基石（共 10 塊築成）；
   - 7 根日之神廟石柱（週一至週日）：每天達標 7 成點亮神廟精力光柱；
   - 奇蹟完工時全屏慶典，並入駐「專注奇蹟博物館」。博物館是從存好的方塊算出來的，每台裝置都一樣，取消打勾也會跟著變。 */

(() => {
  if (typeof state === 'undefined' || typeof blocksInRange !== 'function') return;
  const SEEN = 'pace-wonder-seen';

  // 12 座世界級心流奇蹟工程
  const WONDERS = [
    {
      id: 'library', name: '亞歷山大星空圖書館', icon: '🏛️',
      tagline: '智慧與知識的萬神殿',
      quote: '「書籍是穿越時間的航船，專注是駛向未知的風帆。」',
      lore: '每讀一卷書、解一道題，都在為這座人類文明的燈塔添磚加瓦。',
      color: '#38bdf8'
    },
    {
      id: 'gardens', name: '巴比倫空中花園', icon: '🌺',
      tagline: '自律與生命的綠洲',
      quote: '「在荒漠中開鑿清泉，在繁雜的生活中綻放秩序的花朵。」',
      lore: '張弛有度、生生不息，這座懸浮在空中的奇蹟是你生活平衡的象徵。',
      color: '#4ade80'
    },
    {
      id: 'observatory', name: '時空星象觀象台', icon: '🔭',
      tagline: '窺探真理的深空天眼',
      quote: '「目光越過眼前的喧囂，在浩瀚星軌中校準一生的航向。」',
      lore: '透過深層心流，你精確掌握了時間的節奏與宏大的格局。',
      color: '#c084fc'
    },
    {
      id: 'pyramid', name: '太陽黃金金字塔', icon: '🔺',
      tagline: '恆久不朽的自律基石',
      quote: '「四千年歲月在此凝視，微小的每一天匯聚成萬仞高山。」',
      lore: '一磚一瓦皆由不可動搖的決心築成，任何風暴都無法撼動。',
      color: '#f59e0b'
    },
    {
      id: 'colossus', name: '心流巨人燈塔', icon: '🗼',
      tagline: '照亮迷航者的破曉航標',
      quote: '「風浪再大，只要燈塔長明，歸途便無可阻擋。」',
      lore: '矗立於波濤之中，為你每日的奮鬥指明最堅定的航線。',
      color: '#fbbf24'
    },
    {
      id: 'forge', name: '赫菲斯托斯鍛造聖殿', icon: '⚒️',
      tagline: '千錘百鍊的匠心之爐',
      quote: '「烈火淬鍊真金，每一次攻克難題都在重塑更強大的靈魂。」',
      lore: '專注就是那柄純青的鐵錘，將平庸敲打成驚世的工藝品。',
      color: '#f87171'
    },
    {
      id: 'citadel', name: '靜修浮空衛城', icon: '🏰',
      tagline: '守護專注的絕對要塞',
      quote: '「劃定神聖的專注邊界，將一切浮躁與干擾拒於城門之外。」',
      lore: '你的注意力是你最昂貴的資產，這座衛城由你的自律親手加冕。',
      color: '#a78bfa'
    },
    {
      id: 'clocktower', name: '永恆時光之鐘塔', icon: '🕰️',
      tagline: '精確到微秒的秩序韻律',
      quote: '「齒輪不疾不徐，唯有沉穩的嘀嗒聲能穿透歲月的長河。」',
      lore: '不慌張、不拖延，掌握了時間節奏的人已然掌握了世界。',
      color: '#e2e8f0'
    },
    {
      id: 'sanctuary', name: '晨曦林間隱修殿', icon: '🍃',
      tagline: '呼吸與修復的心靈聖泉',
      quote: '「會休息的靈魂才能走得深遠，平靜是世間最強大的力量。」',
      lore: '休息不是退縮，而是拉滿下一支神箭前的深沉蓄力。',
      color: '#34d399'
    },
    {
      id: 'colosseum', name: '意志競技場', icon: '⚔️',
      tagline: '戰勝怠惰的榮耀之地',
      quote: '「最強大的對手不是他人，而是那個想放棄的昨天的自己。」',
      lore: '每一次戰勝拖延起身上路，競技場上就響起雷鳴般的喝采。',
      color: '#fb923c'
    },
    {
      id: 'pantheon', name: '群星萬神殿', icon: '🌌',
      tagline: '多元交融的宏偉穹頂',
      quote: '「包容多維度的人生追求，穹頂之下星光萬道。」',
      lore: '兼顧學習、健康、工作與心靈，你的生命神殿圓滿無缺。',
      color: '#818cf8'
    },
    {
      id: 'monolith', name: '起源黑石巨碑', icon: '⬛',
      tagline: '開啟智識新紀元的奇點',
      quote: '「邁出舒適圈的第一步，文明與個人都在此蛻變昇華。」',
      lore: '矗立於宇宙邊緣的神秘巨碑，宣告著全新自我境界的降臨。',
      color: '#60a5fa'
    }
  ];

  function getWonderForWeek(mondayStr) {
    const d = new Date(mondayStr + 'T00:00:00');
    const weekNum = Math.floor(d.getTime() / (7 * 864e5));
    return WONDERS[Math.abs(weekNum) % WONDERS.length];
  }

  /* ---------- Header Button & Dialog ---------- */
  const btn = Object.assign(document.createElement('button'), {
    type: 'button',
    className: 'btn wonder-nav-btn',
    id: 'wonderBtn',
    title: '每週的奇蹟建造工程'
  });
  btn.innerHTML = '<span class="wonder-ico">🏛️</span><span class="wonder-lbl">本週奇蹟</span>';
  const host = document.getElementById('xpQuestTxt'), fallback = document.getElementById('skinBtn');
  if (host) host.after(btn); else if (fallback) fallback.before(btn); else return;

  document.body.insertAdjacentHTML('beforeend', `
    <dialog id="wonderDlg" class="wonder-dlg" aria-labelledby="wonderTitle">
      <form method="dialog">
        <div class="wonder-header">
          <div class="dtitle" id="wonderTitle">🏛️ 心流世界奇蹟工程</div>
          <div style="display:flex;gap:6px">
            <button type="button" class="btn sm" id="wonderPreviewNext" title="切換預覽 12 座世界奇蹟藍圖">🎨 預覽其他奇蹟</button>
            <button type="button" class="btn sm" id="museumToggleBtn" title="查看已落成的奇蹟博物館">🏛️ 博物館圖鑑</button>
          </div>
        </div>
        <p class="hint" style="margin:2px 0 10px">每完成一個方塊就砌上一塊基石，每天達標點亮一根神柱。這週完成 10 塊基石、3 天以上達標，奇蹟就落成。</p>

        <!-- Wonder Canvas: Bespoke Architectural Illustration -->
        <div class="wonder-canvas-wrap">
          <canvas id="wonderCanvas" width="460" height="260"></canvas>
          <div class="wonder-build-status" id="wonderBuildStatus">
            <span class="wonder-stage-pill" id="wonderStagePill">建造中</span>
            <span class="wonder-blocks-pill" id="wonderBlocksPill">基石 0/10</span>
          </div>
        </div>

        <!-- Wonder Blueprint & Lore -->
        <div class="wonder-blueprint-card">
          <div class="blueprint-top">
            <span class="blueprint-icon" id="bpIcon">🏛️</span>
            <div class="blueprint-meta">
              <b id="bpName">亞歷山大圖書館</b>
              <span id="bpTagline">智慧與知識的萬神殿</span>
            </div>
            <div class="blueprint-progress-val" id="bpPct">0%</div>
          </div>
          <div class="wonder-bar-track">
            <i id="wonderBarFill"></i>
          </div>
          <div class="blueprint-clue" id="bpClueBox">
            <p id="bpLore">正在平整地基。排定並完成方塊，運送漢白玉基石開始壘砌柱廊…</p>
          </div>
        </div>

        <!-- 7 Daily Temples -->
        <h3 class="set-h" style="margin:12px 0 6px">7 日精力試煉神廟（日達標 7 成點亮）</h3>
        <div class="wonder-temples-row" id="wonderTemplesRow"></div>

        <!-- Museum View -->
        <div id="wonderMuseumView" class="wonder-museum-view" hidden>
          <h3 class="set-h" style="margin-top:14px">🏛️ 已落成的歷史世界奇蹟 (<span id="museumCount">0</span>)</h3>
          <div class="museum-grid" id="museumGrid"></div>
        </div>

        <div class="actions" style="margin-top:14px">
          <button class="btn primary" value="ok">繼續推進行程</button>
        </div>
      </form>
    </dialog>
  `);

  /* ---------- Styles ---------- */
  const style = document.createElement('style');
  style.textContent = `
    .wonder-nav-btn {
      display: inline-flex; align-items: center; gap: 6px; font-weight: 700;
      position: relative; border-color: color-mix(in srgb, var(--accent) 35%, transparent);
      transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
      align-self: flex-start;
    }
    .wonder-nav-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px color-mix(in srgb, var(--accent) 25%, transparent);
      border-color: var(--accent);
    }
    .wonder-dlg form > * { flex: none; }
    .wonder-dlg {
      width: min(530px, calc(100vw - 32px)); border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0,0,0,.35); border: 1px solid var(--line);
      background: var(--panel); color: var(--fg);
    }
    .wonder-dlg form { max-height: 86vh; overflow-y: auto; padding: 4px 2px; }
    .wonder-header { display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap; }
    .wonder-canvas-wrap {
      position: relative; width: 100%; border-radius: 14px; overflow: hidden;
      background: linear-gradient(180deg, #0f172a 0%, #020617 100%);
      border: 1px solid rgba(245, 158, 11, .28);
      box-shadow: inset 0 0 40px rgba(0,0,0,.8), 0 4px 18px rgba(0,0,0,.25);
      margin: 8px 0;
    }
    #wonderCanvas { display: block; width: 100%; height: auto; }
    .wonder-build-status {
      position: absolute; top: 10px; right: 12px; display: flex; gap: 6px;
    }
    .wonder-stage-pill, .wonder-blocks-pill {
      font-size: .75rem; font-weight: 700; padding: 3px 8px; border-radius: 99px;
      background: rgba(15, 23, 42, .75); backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, .15); color: #e2e8f0;
    }
    .wonder-stage-pill.done {
      background: #fef3c7; color: #92400e; border-color: #fcd34d;
      box-shadow: 0 0 10px rgba(245, 158, 11, .4);
    }
    .wonder-blueprint-card {
      background: var(--panel-2); border-radius: 14px; padding: 12px 14px;
      border: 1px solid var(--line); margin-top: 8px;
    }
    .blueprint-top { display: flex; align-items: center; gap: 12px; }
    .blueprint-icon { font-size: 2.2rem; line-height: 1; filter: drop-shadow(0 2px 8px rgba(0,0,0,.2)); }
    .blueprint-meta { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
    .blueprint-meta b { font-size: 1.05rem; }
    .blueprint-meta span { font-size: .82rem; color: var(--muted); }
    .blueprint-progress-val { font-family: var(--f-mono); font-size: 1.35rem; font-weight: 700; color: var(--accent); }
    .wonder-bar-track {
      height: 10px; border-radius: 99px; background: var(--line-soft);
      overflow: hidden; margin: 10px 0 8px; position: relative;
    }
    .wonder-bar-track i {
      display: block; height: 100%; width: 0; border-radius: 99px;
      background: linear-gradient(90deg, #f59e0b, #eab308, #fbbf24);
      transition: width .8s cubic-bezier(.2,.8,.2,1); position: relative;
    }
    .wonder-bar-track i::after {
      content: ""; position: absolute; inset: 0;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,.4), transparent);
      animation: pace-shimmer 2.2s infinite;
    }
    .blueprint-clue {
      margin-top: 6px; padding: 8px 10px; border-radius: 10px;
      background: color-mix(in srgb, var(--accent) 8%, var(--panel));
      border-left: 3px solid var(--accent); font-size: .86rem; line-height: 1.5;
    }
    .blueprint-clue p { margin: 0; }
    .wonder-temples-row {
      display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px;
      margin-top: 6px; text-align: center; font-size: .75rem; position: relative;
    }
    .temple-pill {
      padding: 6px 2px; border-radius: 8px; background: var(--panel-2);
      border: 1px solid var(--line-soft); display: flex; flex-direction: column;
      gap: 3px; align-items: center; transition: all .25s ease; position: relative;
    }
    .temple-pill.active {
      border-color: #f59e0b; background: rgba(245, 158, 11, .14);
      color: #d97706; font-weight: 700; box-shadow: 0 2px 8px rgba(245, 158, 11, .18);
      animation: pace-pillar-in .45s ease both; animation-delay: calc(var(--i) * 90ms);
    }
    .temple-pillar-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--line); position: relative; z-index: 1; }
    .temple-pill.active .temple-pillar-dot { background: #f59e0b; box-shadow: 0 0 6px #f59e0b; }
    .temple-beam {
      position: absolute; top: 8px; left: 50%; width: calc(100% + 8px); height: 3px; border-radius: 3px; pointer-events: none;
      background: linear-gradient(90deg, #f59e0b, #fde68a, #f59e0b); background-size: 200% 100%;
      box-shadow: 0 0 8px rgba(245, 158, 11, .7); transform-origin: left center;
      animation: pace-beam-grow .5s ease-out both, pace-beam-flow 2.4s linear infinite;
      animation-delay: calc(var(--i) * 90ms + 200ms), 0s;
    }
    .wonder-temples-row.beam-full .temple-pill.active { box-shadow: 0 0 14px rgba(245, 158, 11, .45); animation: pace-pillar-in .45s ease both, pace-pillar-glow 2.4s ease-in-out infinite; animation-delay: calc(var(--i) * 90ms), 1.2s; }
    .wonder-temples-row.beam-full::after {
      content: ""; position: absolute; inset: -4px; border-radius: 12px; pointer-events: none;
      background: linear-gradient(100deg, transparent 30%, rgba(253, 230, 138, .55) 50%, transparent 70%); background-size: 250% 100%;
      animation: pace-beam-sweep 2.8s ease-in-out 1s infinite both;
    }
    @keyframes pace-pillar-in { from { transform: translateY(6px); opacity: .3; } to { transform: none; opacity: 1; } }
    @keyframes pace-beam-grow { from { transform: scaleX(0); } to { transform: scaleX(1); } }
    @keyframes pace-beam-flow { to { background-position: -200% 0; } }
    @keyframes pace-pillar-glow { 50% { box-shadow: 0 0 22px rgba(245, 158, 11, .75); } }
    @keyframes pace-beam-sweep { from { background-position: 150% 0; } to { background-position: -100% 0; } }
    .museum-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(134px, 1fr));
      gap: 10px; margin-top: 8px;
    }
    .museum-card {
      padding: 10px; border-radius: 12px; background: var(--panel-2);
      border: 1px solid var(--line); text-align: center; display: flex;
      flex-direction: column; gap: 4px; font-size: .78rem;
    }
    .museum-card .ic { font-size: 1.9rem; margin-bottom: 2px; filter: drop-shadow(0 2px 6px rgba(0,0,0,.15)); }
    .museum-card b { font-size: .86rem; }
    @media (prefers-reduced-motion: reduce) { .wonder-bar-track i::after, .temple-pill.active, .temple-beam, .wonder-temples-row.beam-full .temple-pill.active, .wonder-temples-row.beam-full::after { animation: none; } }
  `;
  document.head.appendChild(style);

  /* ---------- Engine: Wonder Data & Bespoke Architectural Canvas Construction ---------- */
  function weekFacts(mon, blocks) {
    const monStr = ymd(mon), byDay = Array.from({ length: 7 }, (_, dIdx) => {
      const dStr = ymd(addDays(mon, dIdx)), dayBlocks = blocks.filter(b => b.date === dStr && !b.skipped && counts(b));
      const planned = dayBlocks.reduce((a, b) => a + b.minutes, 0), done = dayBlocks.filter(b => b.done).reduce((a, b) => a + b.minutes, 0);
      return { dIdx, dStr, planned, done, rate: planned > 0 ? done / planned : 0, active: planned > 0 && done / planned >= 0.7 };
    });
    const totalDone = blocks.filter(b => b.done && !b.skipped).length, stonesPlaced = Math.min(10, totalDone), activeDaysCount = byDay.filter(d => d.active).length;
    return { monStr, wonder: getWonderForWeek(monStr), byDay, totalDone, stonesPlaced, pct: Math.round(stonesPlaced * 10), activeDaysCount, isCompleted: stonesPlaced >= 10 && activeDaysCount >= 3 };
  }

  async function getWonderData(withMuseum) {
    if (!state.db) return null;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const mon = mondayOf(today), from = withMuseum ? addDays(mon, -7 * 52) : mon;
    const all = await blocksInRange(from, addDays(mon, 6)), museum = [];
    if (withMuseum) for (let w = new Date(from); w < mon; w = addDays(w, 7)) {
      const key = ymd(w), end = ymd(addDays(w, 6)), f = weekFacts(w, all.filter(b => b.date >= key && b.date <= end));
      if (f.isCompleted) museum.push({ week: key, ...f.wonder });
    }
    const end = ymd(addDays(mon, 6)), now = weekFacts(mon, all.filter(b => b.date >= ymd(mon) && b.date <= end));
    if (now.isCompleted) museum.push({ week: now.monStr, ...now.wonder });
    return { ...now, museum };
  }

  /* ---------- Painting kit: every piece is lit from the upper left, has masonry courses and a soft edge.
     A piece that is not built yet is only a dashed blueprint outline. ---------- */
  const hexRgb = h => { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  const mixHex = (a, b, k) => { const x = hexRgb(a), y = hexRgb(b); return 'rgb(' + x.map((v, i) => Math.round(v + (y[i] - v) * k)).join(',') + ')'; };
  const lighter = (h, k) => mixHex(h, '#ffffff', k), darker = (h, k) => mixHex(h, '#0b1026', k);
  function piece(ctx, built, path, x0, x1, base, o = {}) {
    ctx.save();
    if (!built) {
      ctx.fillStyle = 'rgba(148, 163, 184, 0.05)'; ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)'; ctx.lineWidth = 1; ctx.setLineDash([4, 3]);
      path(); ctx.fill(); ctx.stroke(); ctx.restore(); return;
    }
    const g = ctx.createLinearGradient(x0, 0, x1, 0);
    g.addColorStop(0, lighter(base, o.hi ?? .3)); g.addColorStop(.42, base); g.addColorStop(1, darker(base, o.lo ?? .45));
    ctx.fillStyle = g;
    if (o.glow) { ctx.shadowColor = o.glow; ctx.shadowBlur = o.blur || 14; }
    path(); ctx.fill(); ctx.shadowBlur = 0;
    ctx.strokeStyle = darker(base, .55); ctx.lineWidth = .9; ctx.globalAlpha = .5; ctx.stroke();
    ctx.restore();
  }
  // a stone block with courses of masonry
  function block(ctx, built, x, y, w, h, base, o = {}) {
    piece(ctx, built, () => { ctx.beginPath(); ctx.roundRect(x, y, w, h, o.r ?? 1.5); }, x, x + w, base, o);
    if (!built) return;
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    const ch = o.course || 8;
    ctx.strokeStyle = 'rgba(15, 23, 42, ' + (o.joint ?? .17) + ')'; ctx.lineWidth = .7; ctx.beginPath();
    for (let yy = y + ch; yy < y + h - 1; yy += ch) { ctx.moveTo(x, yy); ctx.lineTo(x + w, yy); }
    if (!o.plain) for (let yy = y, r = 0; yy < y + h; yy += ch, r++) for (let xx = x + (r % 2 ? ch : ch * 2); xx < x + w - 1; xx += ch * 2) { ctx.moveTo(xx, yy); ctx.lineTo(xx, Math.min(yy + ch, y + h)); }
    ctx.stroke();
    ctx.fillStyle = 'rgba(255, 255, 255, .3)'; ctx.fillRect(x, y, w, 1.2);
    ctx.fillStyle = 'rgba(2, 6, 23, .25)'; ctx.fillRect(x, y + h - 2, w, 2);
    ctx.restore();
  }
  function poly(ctx, built, pts, base, o = {}) {
    const xs = pts.map(p => p[0]);
    piece(ctx, built, () => { ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); }, Math.min(...xs), Math.max(...xs), base, o);
  }
  // a fluted column with base and capital
  function column(ctx, built, x, y, w, h, base) {
    piece(ctx, built, () => { ctx.beginPath(); ctx.rect(x - w / 2, y, w, h); }, x - w / 2, x + w / 2, base, { lo: .55 });
    if (!built) return;
    ctx.save(); ctx.strokeStyle = 'rgba(15, 23, 42, .16)'; ctx.lineWidth = .6; ctx.beginPath();
    for (let k = 1; k < 4; k++) { const fx = x - w / 2 + k * w / 4; ctx.moveTo(fx, y + 4); ctx.lineTo(fx, y + h - 3); }
    ctx.stroke(); ctx.restore();
    block(ctx, true, x - w / 2 - 2.5, y - 4, w + 5, 4.5, lighter(base, .15), { plain: true, course: 99, r: 1 });
    block(ctx, true, x - w / 2 - 2, y + h - 3, w + 4, 3.5, darker(base, .1), { plain: true, course: 99, r: 1 });
  }
  function dome(ctx, built, cx, cy, r, base, o = {}) {
    const sy = o.squash ?? 1;
    const path = () => { ctx.beginPath(); ctx.ellipse(cx, cy, r, r * sy, 0, Math.PI, 0); ctx.closePath(); };
    if (!built) { piece(ctx, false, path, cx - r, cx + r, base); return; }
    ctx.save();
    const g = ctx.createRadialGradient(cx - r * .4, cy - r * sy * .62, r * .05, cx, cy, r * 1.05);
    g.addColorStop(0, lighter(base, .55)); g.addColorStop(.4, base); g.addColorStop(1, darker(base, .55));
    ctx.fillStyle = g; if (o.glow) { ctx.shadowColor = o.glow; ctx.shadowBlur = 16; }
    path(); ctx.fill(); ctx.shadowBlur = 0;
    ctx.clip(); ctx.strokeStyle = 'rgba(15, 23, 42, .2)'; ctx.lineWidth = .8;
    for (const k of (o.ribs ?? [.35, .7])) { ctx.beginPath(); ctx.ellipse(cx, cy, r * k, r * sy, 0, Math.PI, 0); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(cx, cy - r * sy); ctx.lineTo(cx, cy); ctx.stroke();
    ctx.restore();
  }
  function glowDot(ctx, x, y, r, color, a = 1) {
    ctx.save(); ctx.globalAlpha = Math.max(0, Math.min(1, a));
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color); g.addColorStop(.35, color); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill(); ctx.restore();
  }
  // an arched opening: dark when empty, warm and softly breathing when lit
  function arch(ctx, x, y, w, h, lit, t = 0, ph = 0, color = '#fbbf24') {
    ctx.save();
    ctx.beginPath(); ctx.moveTo(x - w / 2, y + h); ctx.lineTo(x - w / 2, y + w / 2); ctx.arc(x, y + w / 2, w / 2, Math.PI, 0); ctx.lineTo(x + w / 2, y + h); ctx.closePath();
    if (lit) {
      const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, lighter(color, .5)); g.addColorStop(1, color);
      ctx.globalAlpha = .82 + .18 * Math.sin(t * .003 + ph); ctx.fillStyle = g; ctx.shadowColor = color; ctx.shadowBlur = 9;
    } else ctx.fillStyle = 'rgba(8, 12, 28, .82)';
    ctx.fill(); ctx.restore();
  }
  function beam(ctx, x, y, ang, len, spread, color, a = .8) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createLinearGradient(0, 0, len, 0); g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = a; ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, -2); ctx.lineTo(len, -spread); ctx.lineTo(len, spread); ctx.lineTo(0, 2); ctx.closePath(); ctx.fill(); ctx.restore();
  }
  function foliage(ctx, x, y, r, t, ph = 0) {
    const sway = Math.sin(t * .0018 + ph) * 1.2;
    for (const [dx, dy, k, c] of [[-.5, .15, .7, '#166534'], [.45, .2, .72, '#15803d'], [0, -.2, .85, '#22c55e'], [-.2, -.05, .5, '#4ade80']]) {
      ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x + dx * r + sway, y + dy * r, r * k, 0, 6.2832); ctx.fill();
    }
  }

  // 12 buildings. s = 0–10 pieces placed this week.
  const ARCHITECTS = {
    library(ctx, cx, gy, s, t, col) {
      block(ctx, s >= 1, cx - 116, gy - 8, 232, 8, '#94a3b8', { plain: true, course: 99 });
      block(ctx, s >= 1, cx - 106, gy - 15, 212, 7, '#a8b3c4', { plain: true, course: 99 });
      block(ctx, s >= 2, cx - 96, gy - 22, 192, 7, '#cbd5e1', { plain: true, course: 99 });
      block(ctx, s >= 3, cx - 78, gy - 84, 156, 62, '#64748b', { lo: .6 });               // inner hall wall
      if (s >= 3) { arch(ctx, cx, gy - 62, 22, 40, s >= 7, t, 0); if (s >= 7) glowDot(ctx, cx, gy - 34, 34, 'rgba(251,191,36,.35)'); }
      for (let i = 0; i < 6; i++) column(ctx, s >= 3 + Math.floor(i / 2), cx - 80 + i * 32, gy - 82, 10, 60, '#e2e8f0');
      block(ctx, s >= 6, cx - 98, gy - 98, 196, 12, '#e2e8f0', { plain: true, course: 6 });
      if (s >= 6) { ctx.fillStyle = 'rgba(71, 85, 105, .55)'; for (let x = cx - 90; x < cx + 92; x += 9) ctx.fillRect(x, gy - 95, 3, 6); }
      dome(ctx, s >= 9, cx, gy - 104, 44, '#38bdf8', { glow: s >= 10 ? col : null, ribs: [.3, .62, .86] });
      poly(ctx, s >= 8, [[cx, gy - 128], [cx - 102, gy - 98], [cx + 102, gy - 98]], '#f1f5f9');
      if (s >= 8) { ctx.strokeStyle = 'rgba(71, 85, 105, .5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, gy - 108, 6, 0, 6.2832); ctx.stroke(); }
      if (s >= 10) {
        const y = gy - 162 + Math.sin(t * .003) * 3;
        glowDot(ctx, cx, y, 26, 'rgba(253,224,71,.5)');
        ctx.fillStyle = '#fde047'; ctx.beginPath(); ctx.arc(cx, y, 7, 0, 6.2832); ctx.fill();
        ctx.strokeStyle = 'rgba(125, 211, 252, .85)'; ctx.lineWidth = 1.3;
        for (const k of [0, 1.05, 2.1]) { ctx.beginPath(); ctx.ellipse(cx, y, 20, 6, t * .001 + k, 0, 6.2832); ctx.stroke(); }
      }
    },

    gardens(ctx, cx, gy, s, t, col) {
      const tiers = [[112, 30, 1], [88, 58, 3], [64, 86, 5], [40, 112, 7]];
      tiers.forEach(([hw, top, req], i) => {
        const y = gy - top, built = s >= req;
        block(ctx, built, cx - hw, y, hw * 2, 28, i % 2 ? '#d6c7a8' : '#e7d9bb', { course: 7 });
        if (built) {
          const n = 7 - i;
          for (let a = 0; a < n; a++) arch(ctx, cx - hw + 14 + a * ((hw * 2 - 28) / (n - 1)), y + 9, 9, 19, false);
          block(ctx, true, cx - hw - 3, y - 3, hw * 2 + 6, 4, '#f5ecd7', { plain: true, course: 99 });
        }
        if (s >= req + 1) for (let x = cx - hw + 8, k = 0; x <= cx + hw - 8; x += 15, k++) {
          foliage(ctx, x, y - 2 + (k % 2) * 3, 7.5, t, k + i);
          ctx.strokeStyle = '#15803d'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x, y + 2); ctx.quadraticCurveTo(x + Math.sin(t * .002 + k) * 2.5, y + 9, x + 1, y + 13 + (k % 3) * 3); ctx.stroke();
          if (k % 2) { ctx.fillStyle = k % 4 === 1 ? '#fb7185' : '#fde047'; ctx.beginPath(); ctx.arc(x + 3, y + 1, 1.9, 0, 6.2832); ctx.fill(); }
        }
      });
      if (s >= 9) for (const sg of [-1, 1]) {
        ctx.save(); const x = cx + sg * 30;
        const g = ctx.createLinearGradient(0, gy - 112, 0, gy); g.addColorStop(0, 'rgba(186, 230, 253, .9)'); g.addColorStop(1, 'rgba(125, 211, 252, .25)');
        ctx.strokeStyle = g; ctx.lineWidth = 5; ctx.setLineDash([9, 5]); ctx.lineDashOffset = -(t * .05) % 14;
        ctx.beginPath(); ctx.moveTo(x, gy - 112); ctx.lineTo(x + sg * 6, gy - 2); ctx.stroke(); ctx.restore();
        glowDot(ctx, x + sg * 6, gy - 3, 12, 'rgba(186,230,253,.45)');
      }
      for (const sg of [-1, 1]) column(ctx, s >= 10, cx + sg * 16, gy - 136, 5, 24, '#f5ecd7');
      dome(ctx, s >= 10, cx, gy - 138, 24, '#34d399', { glow: s >= 10 ? col : null, squash: .7 });
      if (s >= 10) glowDot(ctx, cx, gy - 122, 14, 'rgba(253,224,71,.45)', .7 + .3 * Math.sin(t * .003));
    },

    observatory(ctx, cx, gy, s, t, col) {
      poly(ctx, s >= 1, [[cx - 120, gy], [cx - 70, gy - 16], [cx + 78, gy - 16], [cx + 124, gy]], '#475569', { lo: .6 });   // hilltop
      block(ctx, s >= 2, cx - 66, gy - 44, 132, 28, '#cbd5e1');
      block(ctx, s >= 4, cx - 48, gy - 92, 96, 48, '#e2e8f0');
      if (s >= 4) { arch(ctx, cx, gy - 40, 16, 24, s >= 6, t, 1); for (const dx of [-28, 0, 28]) arch(ctx, cx + dx, gy - 80, 9, 18, s >= 6, t, dx); }
      block(ctx, s >= 5, cx - 54, gy - 97, 108, 6, '#f1f5f9', { plain: true, course: 99 });
      dome(ctx, s >= 8, cx, gy - 97, 48, '#a78bfa', { glow: s >= 10 ? col : null, ribs: [.4, .78] });
      const ang = -.62 + Math.sin(t * .0012) * .07;
      ctx.save(); ctx.translate(cx + 6, gy - 116); ctx.rotate(ang);
      block(ctx, s >= 9, 0, -6, 46, 12, '#d4a44a', { plain: true, course: 99, r: 3 });
      block(ctx, s >= 9, 40, -8, 10, 16, '#f6d57a', { plain: true, course: 99, r: 2 });
      ctx.restore();
      if (s >= 10) beam(ctx, cx + 6 + Math.cos(ang) * 50, gy - 116 + Math.sin(ang) * 50, ang, 190, 30, 'rgba(196, 181, 253, .7)');
    },

    pyramid(ctx, cx, gy, s, t, col) {
      ctx.fillStyle = 'rgba(180, 130, 60, .28)'; ctx.beginPath(); ctx.moveTo(cx - 170, gy);
      ctx.quadraticCurveTo(cx - 90, gy - 16, cx - 10, gy - 3); ctx.quadraticCurveTo(cx + 90, gy - 18, cx + 170, gy); ctx.closePath(); ctx.fill();   // dunes
      for (let i = 0; i < 9; i++) {
        const w = 214 - i * 21, y = gy - (i + 1) * 12.5;
        block(ctx, s > i, cx - w / 2, y, w, 12.5, i % 2 ? '#e9c46a' : '#f2cf7a', { course: 6.5, hi: .38, lo: .6, r: .5 });
      }
      if (s >= 4) arch(ctx, cx - 18, gy - 26, 14, 26, s >= 9, t, 2, '#fb923c');
      const fy = s >= 10 ? Math.sin(t * .003) * 3 : 0;
      poly(ctx, s >= 10, [[cx, gy - 146 + fy], [cx - 14, gy - 117 + fy], [cx + 14, gy - 117 + fy]], '#fbbf24', { glow: col, hi: .6 });
      if (s >= 10) { glowDot(ctx, cx, gy - 132 + fy, 40, 'rgba(253,224,71,.4)'); beam(ctx, cx, gy - 146 + fy, -Math.PI / 2, 80, 10, 'rgba(253, 224, 71, .55)', .5 + .3 * Math.sin(t * .002)); }
    },

    colossus(ctx, cx, gy, s, t, col) {
      poly(ctx, s >= 1, [[cx - 92, gy], [cx - 70, gy - 14], [cx - 30, gy - 22], [cx + 40, gy - 20], [cx + 78, gy - 10], [cx + 96, gy]], '#475569', { lo: .65 });   // rock
      for (let k = 0; k < 2; k++) {
        ctx.fillStyle = k ? 'rgba(125, 211, 252, .3)' : 'rgba(56, 189, 248, .22)'; ctx.beginPath(); ctx.moveTo(cx - 170, gy + 2);
        for (let x = cx - 170; x <= cx + 170; x += 10) ctx.lineTo(x, gy - 5 + k * 3 + Math.sin(x * .06 + t * .003 * (k ? 1 : -1) + k) * 3);
        ctx.lineTo(cx + 170, gy + 2); ctx.closePath(); ctx.fill();
      }
      block(ctx, s >= 2, cx - 44, gy - 54, 88, 34, '#d8dee8');
      if (s >= 2) arch(ctx, cx, gy - 44, 14, 24, s >= 9, t, 0);
      block(ctx, s >= 3, cx - 49, gy - 59, 98, 5, '#f1f5f9', { plain: true, course: 99 });
      const shaft = () => { ctx.beginPath(); ctx.moveTo(cx - 30, gy - 59); ctx.lineTo(cx - 22, gy - 118); ctx.lineTo(cx + 22, gy - 118); ctx.lineTo(cx + 30, gy - 59); ctx.closePath(); };
      piece(ctx, s >= 5, shaft, cx - 30, cx + 30, '#eef2f7');
      if (s >= 5) {
        ctx.save(); shaft(); ctx.clip();
        ctx.fillStyle = 'rgba(190, 60, 60, .82)'; ctx.fillRect(cx - 32, gy - 82, 64, 11); ctx.fillRect(cx - 32, gy - 108, 64, 10);
        const g = ctx.createLinearGradient(cx - 30, 0, cx + 30, 0); g.addColorStop(0, 'rgba(255,255,255,.12)'); g.addColorStop(1, 'rgba(8,12,28,.45)'); ctx.fillStyle = g; ctx.fillRect(cx - 32, gy - 120, 64, 62);
        ctx.restore();
        for (const y of [gy - 72, gy - 97]) arch(ctx, cx, y, 6, 10, s >= 9, t, y);
      }
      block(ctx, s >= 7, cx - 30, gy - 123, 60, 5, '#94a3b8', { plain: true, course: 99 });     // gallery
      if (s >= 7) { ctx.strokeStyle = 'rgba(226, 232, 240, .8)'; ctx.lineWidth = 1; ctx.beginPath(); for (let x = cx - 28; x <= cx + 28; x += 7) { ctx.moveTo(x, gy - 123); ctx.lineTo(x, gy - 131); } ctx.moveTo(cx - 28, gy - 131); ctx.lineTo(cx + 28, gy - 131); ctx.stroke(); }
      block(ctx, s >= 8, cx - 13, gy - 146, 26, 23, s >= 9 ? '#fde68a' : '#94a3b8', { plain: true, course: 99, glow: s >= 9 ? '#fbbf24' : null });
      dome(ctx, s >= 9, cx, gy - 146, 16, '#b91c1c', { squash: .8, ribs: [.5] });
      if (s >= 9) glowDot(ctx, cx, gy - 135, 30, 'rgba(253,224,71,.55)', .75 + .25 * Math.sin(t * .004));
      if (s >= 10) { const a = Math.sin(t * .0011) * .5; beam(ctx, cx, gy - 135, -.12 + a, 190, 34, 'rgba(253, 224, 71, .75)'); beam(ctx, cx, gy - 135, Math.PI + .12 + a, 190, 34, 'rgba(253, 224, 71, .5)', .55); }
    },

    forge(ctx, cx, gy, s, t, col) {
      block(ctx, s >= 1, cx - 108, gy - 10, 216, 10, '#334155', { course: 5 });
      block(ctx, s >= 2, cx - 96, gy - 26, 192, 16, '#3f4b5f', { course: 8 });
      for (const sg of [-1, 1]) {
        const x = cx + sg * 68;
        block(ctx, s >= 4, x - 16, gy - 104, 32, 78, '#2b3445', { course: 9, lo: .6 });
        block(ctx, s >= 5, x - 20, gy - 110, 40, 7, '#475569', { plain: true, course: 99 });
        if (s >= 7) {
          const p = .7 + .3 * Math.sin(t * .004 + sg);
          ctx.save(); ctx.globalAlpha = p; ctx.shadowColor = '#f97316'; ctx.shadowBlur = 12;
          const g = ctx.createLinearGradient(0, gy - 100, 0, gy - 30); g.addColorStop(0, '#fde047'); g.addColorStop(.5, '#f97316'); g.addColorStop(1, '#b91c1c');
          ctx.strokeStyle = g; ctx.lineWidth = 3.5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, gy - 100);
          ctx.lineTo(x - 4, gy - 82); ctx.lineTo(x + 4, gy - 64); ctx.lineTo(x - 3, gy - 46); ctx.lineTo(x, gy - 30); ctx.stroke(); ctx.restore();
          glowDot(ctx, x, gy - 114, 12, 'rgba(249,115,22,.7)', p);
        }
      }
      block(ctx, s >= 6, cx - 40, gy - 74, 80, 48, '#3b4557', { course: 8 });                  // furnace
      poly(ctx, s >= 6, [[cx - 46, gy - 74], [cx - 20, gy - 96], [cx + 20, gy - 96], [cx + 46, gy - 74]], '#475569');
      if (s >= 6) { arch(ctx, cx, gy - 62, 34, 36, s >= 8, t, 0, '#f97316'); if (s >= 8) glowDot(ctx, cx, gy - 40, 46, 'rgba(249,115,22,.45)', .7 + .3 * Math.sin(t * .006)); }
      if (s >= 9) {                                                                            // anvil in the doorway
        ctx.fillStyle = '#cbd5e1'; ctx.beginPath(); ctx.moveTo(cx - 14, gy - 40); ctx.lineTo(cx + 16, gy - 40); ctx.lineTo(cx + 9, gy - 34); ctx.lineTo(cx + 5, gy - 34); ctx.lineTo(cx + 7, gy - 27); ctx.lineTo(cx - 7, gy - 27); ctx.lineTo(cx - 5, gy - 34); ctx.lineTo(cx - 9, gy - 34); ctx.closePath(); ctx.fill();
      }
      if (s >= 10) for (let k = 0; k < 14; k++) {
        const life = ((t * .05 + k * 13) % 90) / 90, sy = gy - 96 - life * 70, sx = cx + Math.sin(k * 2.1 + t * .003) * (10 + life * 26);
        glowDot(ctx, sx, sy, 3.5, k % 2 ? '#fde047' : '#fb923c', 1 - life);
      }
    },

    citadel(ctx, cx, gy, s, t, col) {
      const fy = Math.sin(t * .0022) * 4;
      ctx.save(); ctx.fillStyle = 'rgba(2, 6, 23, .4)'; ctx.beginPath(); ctx.ellipse(cx, gy - 2, 62 - fy * 2, 6, 0, 0, 6.2832); ctx.fill(); ctx.restore();
      ctx.save(); ctx.translate(0, fy - 6);
      poly(ctx, s >= 2, [[cx - 92, gy - 62], [cx + 92, gy - 62], [cx + 60, gy - 44], [cx + 34, gy - 22], [cx + 6, gy - 10], [cx - 22, gy - 26], [cx - 58, gy - 42]], '#57534e', { lo: .7 });
      if (s >= 2) { ctx.fillStyle = '#4d7c0f'; ctx.beginPath(); ctx.roundRect(cx - 94, gy - 66, 188, 6, 3); ctx.fill(); }
      if (s >= 3) for (const [dx, h] of [[-30, 14], [18, 18], [44, 9]]) { glowDot(ctx, cx + dx, gy - 22 + h * .2, 9, 'rgba(167,139,250,.6)', .6 + .4 * Math.sin(t * .003 + dx)); poly(ctx, true, [[cx + dx - 4, gy - 34], [cx + dx + 4, gy - 34], [cx + dx, gy - 34 + h + 8]], '#a78bfa', { hi: .5 }); }
      block(ctx, s >= 4, cx - 62, gy - 92, 124, 28, '#d6d3e4');                                   // curtain wall
      if (s >= 4) { ctx.fillStyle = '#d6d3e4'; for (let x = cx - 62; x < cx + 60; x += 11) ctx.fillRect(x, gy - 97, 6, 5); arch(ctx, cx, gy - 84, 14, 20, s >= 9, t, 0); }
      for (const [dx, w, h, req] of [[-56, 24, 62, 5], [56, 24, 62, 7], [0, 32, 92, 9]]) {
        const x = cx + dx, top = gy - 64 - h;
        block(ctx, s >= req, x - w / 2, top, w, h, '#e7e5f2');
        block(ctx, s >= req, x - w / 2 - 3, top - 4, w + 6, 5, '#f5f3ff', { plain: true, course: 99 });
        poly(ctx, s >= req, [[x, top - 4 - w * 1.15], [x - w / 2 - 4, top - 4], [x + w / 2 + 4, top - 4]], '#7c3aed', { hi: .35 });
        if (s >= req) {
          arch(ctx, x, top + 12, 7, 13, s >= 9, t, dx); if (h > 70) arch(ctx, x, top + 40, 7, 13, s >= 9, t, dx + 2);
          ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, top - 4 - w * 1.15); ctx.lineTo(x, top - 14 - w * 1.15); ctx.stroke();
          ctx.fillStyle = '#f472b6'; ctx.beginPath(); const wv = Math.sin(t * .005 + dx) * 2; ctx.moveTo(x, top - 14 - w * 1.15); ctx.lineTo(x + 10, top - 11 - w * 1.15 + wv); ctx.lineTo(x, top - 8 - w * 1.15); ctx.closePath(); ctx.fill();
        }
      }
      if (s >= 10) {
        ctx.save(); const g = ctx.createRadialGradient(cx, gy - 96, 60, cx, gy - 96, 104); g.addColorStop(0, 'rgba(167,139,250,0)'); g.addColorStop(.85, 'rgba(167,139,250,.16)'); g.addColorStop(1, 'rgba(196,181,253,.5)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, gy - 96, 104, 0, 6.2832); ctx.fill();
        ctx.strokeStyle = 'rgba(221, 214, 254, .6)'; ctx.lineWidth = 1.2; ctx.setLineDash([14, 10]); ctx.lineDashOffset = t * .02; ctx.beginPath(); ctx.arc(cx, gy - 96, 104, 0, 6.2832); ctx.stroke(); ctx.restore();
      }
      ctx.restore();
    },

    clocktower(ctx, cx, gy, s, t, col) {
      block(ctx, s >= 1, cx - 58, gy - 10, 116, 10, '#94a3b8', { plain: true, course: 5 });
      block(ctx, s >= 2, cx - 44, gy - 62, 88, 52, '#c9b8a3');
      if (s >= 2) { arch(ctx, cx, gy - 44, 20, 34, s >= 9, t, 0); for (const dx of [-28, 28]) arch(ctx, cx + dx, gy - 50, 8, 16, s >= 9, t, dx); }
      block(ctx, s >= 3, cx - 48, gy - 67, 96, 6, '#e7dccb', { plain: true, course: 99 });
      block(ctx, s >= 5, cx - 36, gy - 132, 72, 65, '#d9cab6');
      if (s >= 5) for (const dx of [-20, 20]) arch(ctx, cx + dx, gy - 84, 7, 14, s >= 9, t, dx);
      block(ctx, s >= 6, cx - 41, gy - 137, 82, 6, '#efe6d8', { plain: true, course: 99 });
      block(ctx, s >= 7, cx - 28, gy - 154, 56, 17, '#c9b8a3', { course: 6 });                     // belfry
      if (s >= 7) for (const dx of [-15, 0, 15]) arch(ctx, cx + dx, gy - 151, 8, 13, false);
      poly(ctx, s >= 8, [[cx, gy - 192], [cx - 33, gy - 154], [cx + 33, gy - 154]], '#475569', { hi: .2 });
      if (s >= 8) { ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(cx, gy - 192); ctx.lineTo(cx, gy - 201); ctx.stroke(); glowDot(ctx, cx, gy - 202, 5, '#fde047'); }
      const y = gy - 108;
      if (s >= 9) {
        glowDot(ctx, cx, y, 40, 'rgba(253,224,71,.4)');
        ctx.save(); const g = ctx.createRadialGradient(cx - 5, y - 6, 2, cx, y, 22); g.addColorStop(0, '#fffbeb'); g.addColorStop(1, '#fde68a');
        ctx.fillStyle = g; ctx.strokeStyle = '#92400e'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(cx, y, 21, 0, 6.2832); ctx.fill(); ctx.stroke();
        ctx.lineWidth = 1.3; ctx.beginPath(); for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6, r0 = k % 3 ? 17 : 15; ctx.moveTo(cx + Math.cos(a) * r0, y + Math.sin(a) * r0); ctx.lineTo(cx + Math.cos(a) * 19, y + Math.sin(a) * 19); } ctx.stroke();
        if (s >= 10) {                                                                            // the hands show the real time
          const d = new Date(), m = d.getMinutes() + d.getSeconds() / 60, h = d.getHours() % 12 + m / 60;
          const a1 = h * Math.PI / 6 - Math.PI / 2, a2 = m * Math.PI / 30 - Math.PI / 2;
          ctx.strokeStyle = '#451a03'; ctx.lineCap = 'round'; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(cx, y); ctx.lineTo(cx + Math.cos(a1) * 10, y + Math.sin(a1) * 10); ctx.stroke();
          ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(cx, y); ctx.lineTo(cx + Math.cos(a2) * 16, y + Math.sin(a2) * 16); ctx.stroke();
          ctx.fillStyle = '#451a03'; ctx.beginPath(); ctx.arc(cx, y, 2.2, 0, 6.2832); ctx.fill();
        }
        ctx.restore();
      } else if (s < 5) piece(ctx, false, () => { ctx.beginPath(); ctx.arc(cx, y, 21, 0, 6.2832); }, cx - 21, cx + 21, '#fde68a');
      else { ctx.fillStyle = 'rgba(8, 12, 28, .6)'; ctx.beginPath(); ctx.arc(cx, y, 21, 0, 6.2832); ctx.fill(); }
    },

    sanctuary(ctx, cx, gy, s, t, col) {
      ctx.save(); const pg = ctx.createRadialGradient(cx, gy - 3, 5, cx, gy - 3, 120); pg.addColorStop(0, 'rgba(110, 231, 183, .5)'); pg.addColorStop(1, 'rgba(16, 185, 129, .08)');
      ctx.fillStyle = pg; ctx.beginPath(); ctx.ellipse(cx, gy - 3, 120, 9, 0, 0, 6.2832); ctx.fill();
      ctx.strokeStyle = 'rgba(209, 250, 229, .5)'; ctx.lineWidth = .8; for (let k = 0; k < 3; k++) { const r = ((t * .012 + k * 30) % 90); ctx.globalAlpha = 1 - r / 90; ctx.beginPath(); ctx.ellipse(cx - 70 + k * 60, gy - 3, r * .5, r * .05 + 1, 0, 0, 6.2832); ctx.stroke(); }
      ctx.restore();
      block(ctx, s >= 1, cx - 76, gy - 16, 152, 10, '#a8a29e', { course: 5 });
      block(ctx, s >= 2, cx - 66, gy - 24, 132, 8, '#d6d3d1', { plain: true, course: 99 });
      if (s >= 5) { block(ctx, true, cx - 44, gy - 76, 88, 52, '#7c2d12', { plain: true, course: 99, lo: .6 }); arch(ctx, cx, gy - 64, 20, 40, s >= 8, t, 0); }
      for (const dx of [-54, -20, 20, 54]) piece(ctx, s >= 3 + (Math.abs(dx) > 30 ? 0 : 1), () => { ctx.beginPath(); ctx.rect(cx + dx - 4.5, gy - 80, 9, 56); }, cx + dx - 4.5, cx + dx + 4.5, '#c2302d', { lo: .55 });
      if (s >= 8) block(ctx, true, cx - 38, gy - 108, 76, 20, '#9a3412', { plain: true, course: 99, lo: .6 });
      [[86, 80, 7, 16], [58, 112, 9, 13]].forEach(([hw, ry, req, th]) => {
        const y = gy - ry;
        piece(ctx, s >= req, () => {
          ctx.beginPath(); ctx.moveTo(cx - hw - 20, y - 6); ctx.quadraticCurveTo(cx - hw + 4, y + 4, cx - hw * .45, y - th - 4);
          ctx.lineTo(cx + hw * .45, y - th - 4); ctx.quadraticCurveTo(cx + hw - 4, y + 4, cx + hw + 20, y - 6);
          ctx.quadraticCurveTo(cx + hw, y + 9, cx + hw - 12, y + 8); ctx.lineTo(cx - hw + 12, y + 8); ctx.quadraticCurveTo(cx - hw, y + 9, cx - hw - 20, y - 6); ctx.closePath();
        }, cx - hw - 20, cx + hw + 20, '#0f766e', { glow: s >= 10 ? col : null, blur: 10 });
        if (s >= req) {
          ctx.save(); ctx.strokeStyle = 'rgba(2, 44, 34, .4)'; ctx.lineWidth = .8; ctx.beginPath(); for (let x = cx - hw + 6; x <= cx + hw - 6; x += 7) { ctx.moveTo(x, y + 7); ctx.lineTo(cx + (x - cx) * .5, y - th - 3); } ctx.stroke();
          ctx.fillStyle = '#fbbf24'; ctx.fillRect(cx - hw * .45, y - th - 6, hw * .9, 2.5); ctx.restore();
          for (const sg of [-1, 1]) {
            const lx = cx + sg * (hw + 12), ly = y + 8 + Math.sin(t * .002 + sg);
            ctx.strokeStyle = '#a8a29e'; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(lx, y - 2); ctx.lineTo(lx, ly); ctx.stroke();
            glowDot(ctx, lx, ly + 4, 9, 'rgba(251,146,60,.8)', .75 + .25 * Math.sin(t * .004 + sg));
            ctx.fillStyle = '#fb923c'; ctx.beginPath(); ctx.ellipse(lx, ly + 4, 3, 4, 0, 0, 6.2832); ctx.fill();
          }
        }
      });
      if (s >= 10) { ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(cx, gy - 131); ctx.lineTo(cx, gy - 148); ctx.stroke(); glowDot(ctx, cx, gy - 149, 7, '#fde047'); }
    },

    colosseum(ctx, cx, gy, s, t, col) {
      for (let row = 0; row < 3; row++) {
        const hw = 108 - row * 5, y = gy - (row + 1) * 34, built = s >= (row + 1) * 3 - 1, lit = s >= 9;
        piece(ctx, built, () => { ctx.beginPath(); ctx.moveTo(cx - hw, y + 34); ctx.lineTo(cx - hw, y + 4); ctx.quadraticCurveTo(cx, y - 5, cx + hw, y + 4); ctx.lineTo(cx + hw, y + 34); ctx.closePath(); }, cx - hw, cx + hw, row % 2 ? '#e3c58f' : '#edd3a2');
        if (!built) continue;
        const n = 9;
        for (let a = 0; a < n; a++) {
          const u = (a + .5) / n * 2 - 1, ax = cx + Math.sin(u * 1.25) / Math.sin(1.25) * (hw - 10), w = 13 * Math.cos(u * 1.15) + 3;
          arch(ctx, ax, y + 9 - (1 - u * u) * 4, w, 22 + (1 - u * u) * 3, lit, t, a + row, '#f59e0b');
        }
        ctx.fillStyle = 'rgba(255, 255, 255, .35)'; ctx.beginPath(); ctx.moveTo(cx - hw, y + 4); ctx.quadraticCurveTo(cx, y - 5, cx + hw, y + 4); ctx.lineTo(cx + hw, y + 6); ctx.quadraticCurveTo(cx, y - 3, cx - hw, y + 6); ctx.fill();
      }
      if (s >= 10) {
        block(ctx, true, cx - 5, gy - 122, 10, 16, '#a8a29e', { plain: true, course: 99 });
        for (let k = 0; k < 3; k++) glowDot(ctx, cx + Math.sin(t * .006 + k * 2) * 2.5, gy - 130 - k * 6, 15 - k * 3, k ? 'rgba(253,224,71,.8)' : 'rgba(249,115,22,.85)', .8);
        glowDot(ctx, cx, gy - 128, 46, 'rgba(249,115,22,.3)');
      }
    },

    pantheon(ctx, cx, gy, s, t, col) {
      block(ctx, s >= 1, cx - 112, gy - 8, 224, 8, '#94a3b8', { plain: true, course: 99 });
      block(ctx, s >= 3, cx - 90, gy - 72, 180, 64, '#b8c2d1');                                   // rotunda drum
      block(ctx, s >= 4, cx - 94, gy - 78, 188, 7, '#dbe2ec', { plain: true, course: 99 });
      dome(ctx, s >= 7, cx, gy - 78, 86, '#cbd5e1', { glow: s >= 10 ? col : null, squash: .62, ribs: [.25, .5, .75] });
      if (s >= 7) { ctx.save(); ctx.strokeStyle = 'rgba(15, 23, 42, .16)'; ctx.lineWidth = .8; for (const k of [.3, .55, .78]) { ctx.beginPath(); ctx.ellipse(cx, gy - 78 - 86 * .62 * k, 86 * Math.sqrt(1 - k * k), 3, 0, Math.PI, 0); ctx.stroke(); } ctx.restore(); }
      for (let i = 0; i < 6; i++) column(ctx, s >= 5 + (i > 2 ? 1 : 0), cx - 50 + i * 20, gy - 58, 8, 50, '#eef2f7');
      block(ctx, s >= 8, cx - 62, gy - 70, 124, 9, '#f1f5f9', { plain: true, course: 99 });
      poly(ctx, s >= 9, [[cx, gy - 98], [cx - 66, gy - 70], [cx + 66, gy - 70]], '#f8fafc');
      if (s >= 5) arch(ctx, cx, gy - 44, 16, 36, s >= 9, t, 0);
      if (s >= 10) { beam(ctx, cx, gy - 132, -Math.PI / 2, 130, 24, 'rgba(165, 180, 252, .7)', .6 + .2 * Math.sin(t * .002)); glowDot(ctx, cx, gy - 132, 14, 'rgba(224,231,255,.9)'); }
    },

    monolith(ctx, cx, gy, s, t, col) {
      block(ctx, s >= 1, cx - 92, gy - 8, 184, 8, '#1e293b', { plain: true, course: 99 });
      block(ctx, s >= 2, cx - 74, gy - 16, 148, 8, '#273449', { plain: true, course: 99 });
      block(ctx, s >= 3, cx - 54, gy - 24, 108, 8, '#334155', { plain: true, course: 99 });
      const built = s >= 7;
      const slab = () => { ctx.beginPath(); ctx.moveTo(cx - 24, gy - 24); ctx.lineTo(cx - 20, gy - 156); ctx.lineTo(cx + 8, gy - 164); ctx.lineTo(cx + 26, gy - 152); ctx.lineTo(cx + 24, gy - 24); ctx.closePath(); };
      piece(ctx, built, slab, cx - 24, cx + 26, '#0f172a', { hi: .22, lo: .5, glow: s >= 8 ? col : null, blur: 18 });
      if (built) {
        ctx.save(); slab(); ctx.clip();
        const sh = ctx.createLinearGradient(cx - 30, gy - 160, cx + 30, gy - 30); sh.addColorStop(0, 'rgba(148,197,255,.28)'); sh.addColorStop(.35, 'rgba(148,197,255,0)'); ctx.fillStyle = sh; ctx.fillRect(cx - 30, gy - 170, 60, 150);
        if (s >= 9) {
          const p = (t * .03) % 150;
          ctx.strokeStyle = '#38bdf8'; ctx.shadowColor = '#38bdf8'; ctx.shadowBlur = 8; ctx.lineWidth = 1.3; ctx.globalAlpha = .9;
          ctx.beginPath(); ctx.moveTo(cx, gy - 30); ctx.lineTo(cx, gy - 60); ctx.lineTo(cx - 10, gy - 72); ctx.lineTo(cx - 10, gy - 98); ctx.moveTo(cx, gy - 60); ctx.lineTo(cx + 11, gy - 74); ctx.lineTo(cx + 11, gy - 120); ctx.lineTo(cx + 2, gy - 132); ctx.lineTo(cx + 2, gy - 150); ctx.stroke();
          for (const [x, y, r] of [[cx - 10, gy - 104, 5], [cx + 11, gy - 96, 3.5], [cx + 2, gy - 142, 4]]) { ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.stroke(); }
          const band = ctx.createLinearGradient(0, gy - 20 - p, 0, gy - 44 - p); band.addColorStop(0, 'rgba(125,211,252,0)'); band.addColorStop(.5, 'rgba(125,211,252,.4)'); band.addColorStop(1, 'rgba(125,211,252,0)');
          ctx.shadowBlur = 0; ctx.fillStyle = band; ctx.fillRect(cx - 30, gy - 44 - p, 60, 24);
        }
        ctx.restore();
      }
      if (s >= 10) {
        for (const k of [0, 1]) { ctx.save(); ctx.strokeStyle = k ? 'rgba(125, 211, 252, .8)' : 'rgba(96, 165, 250, .55)'; ctx.shadowColor = '#38bdf8'; ctx.shadowBlur = 8; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.ellipse(cx, gy - 96, 70, 15, (k ? -1 : 1) * (.22 + Math.sin(t * .0015) * .12), 0, 6.2832); ctx.stroke(); ctx.restore(); }
        for (let k = 0; k < 5; k++) { const a = t * .0009 + k * 1.256, x = cx + Math.cos(a) * 70, y = gy - 96 + Math.sin(a) * 15 + Math.sin(t * .003 + k) * 3; poly(ctx, true, [[x, y - 5], [x + 3.5, y], [x, y + 5], [x - 3.5, y]], '#38bdf8', { hi: .6 }); }
      }
    }
  };

  /* ---------- The night around the building: moon, far hills, soft ground, mist ---------- */
  function drawBackdrop(ctx, W, H, groundY, ts, done, col) {
    const sky = ctx.createLinearGradient(0, 0, 0, groundY);
    if (done) { sky.addColorStop(0, '#0b1030'); sky.addColorStop(.55, '#272063'); sky.addColorStop(1, '#5b3b8c'); }
    else { sky.addColorStop(0, '#030617'); sky.addColorStop(.6, '#0f1a35'); sky.addColorStop(1, '#22304f'); }
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    let seed = 42; const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 60; i++) {
      const sx = rnd() * W, sy = rnd() * (groundY - 40), sr = rnd() * 1.1 + .3, sp = rnd() * 6.28;
      ctx.globalAlpha = .2 + .6 * Math.abs(Math.sin(ts * .0015 + sp)); ctx.beginPath(); ctx.arc(sx, sy, sr, 0, 6.2832); ctx.fill();
    }
    ctx.globalAlpha = 1;
    const mx = W * .16, my = 44;                                              // moon
    glowDot(ctx, mx, my, 46, 'rgba(226,232,255,.22)');
    ctx.fillStyle = '#eef2ff'; ctx.beginPath(); ctx.arc(mx, my, 13, 0, 6.2832); ctx.fill();
    ctx.fillStyle = 'rgba(148, 163, 184, .35)'; for (const [dx, dy, r] of [[-4, -3, 3], [4, 3, 2.2], [2, -6, 1.5]]) { ctx.beginPath(); ctx.arc(mx + dx, my + dy, r, 0, 6.2832); ctx.fill(); }
    if (done) { const g = ctx.createRadialGradient(W / 2, groundY - 70, 10, W / 2, groundY - 70, 220); g.addColorStop(0, 'rgba(251, 191, 36, .3)'); g.addColorStop(.6, 'rgba(245, 158, 11, .08)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
    for (const [amp, base, c, f] of [[16, 30, done ? '#2a2468' : '#141f3d', .011], [11, 14, done ? '#1d1a4d' : '#0e1730', .019]]) {   // two rows of far hills
      ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(0, groundY);
      for (let x = 0; x <= W; x += 8) ctx.lineTo(x, groundY - base - Math.sin(x * f + base) * amp - Math.sin(x * f * 2.7) * amp * .35);
      ctx.lineTo(W, groundY); ctx.closePath(); ctx.fill();
    }
    const gg = ctx.createLinearGradient(0, groundY, 0, H); gg.addColorStop(0, '#16213a'); gg.addColorStop(1, '#070b18');
    ctx.fillStyle = gg; ctx.fillRect(0, groundY, W, H - groundY);
    ctx.fillStyle = 'rgba(2, 6, 23, .5)'; ctx.beginPath(); ctx.ellipse(W / 2, groundY + 5, 150, 9, 0, 0, 6.2832); ctx.fill();   // the building's shadow
  }
  function drawMist(ctx, W, groundY, ts) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 3; k++) {
      const x = ((ts * .008 * (k + 1) + k * 190) % (W + 260)) - 130;
      const g = ctx.createRadialGradient(x, groundY - 2, 4, x, groundY - 2, 120); g.addColorStop(0, 'rgba(190, 205, 235, .1)'); g.addColorStop(1, 'rgba(190, 205, 235, 0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, groundY - 2, 120, 16, 0, 0, 6.2832); ctx.fill();
    }
    ctx.restore();
  }

  let wonderRaf = 0, activeWonderData = null, previewIdx = -1;

  function drawWonderScene(canvas, data, ts = 0) {
    if (!data) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = canvas.clientWidth || 460, H = 260;
    // resize only when the size changes: reallocating the canvas every frame halved the frame rate
    if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) { canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); canvas.style.height = H + 'px'; }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const wonder = data.wonder, groundY = H - 34;
    drawBackdrop(ctx, W, H, groundY, ts, data.isCompleted, wonder.color);

    // Render the specific Wonder's architecture
    ctx.save();
    const arch = ARCHITECTS[wonder.id] || ARCHITECTS.library;
    arch(ctx, W / 2, groundY, data.stonesPlaced, ts, wonder.color);
    ctx.restore();
    drawMist(ctx, W, groundY, ts);
  }

  function startWonderLoop() {
    cancelAnimationFrame(wonderRaf);
    const step = ts => {
      const dlg = document.getElementById('wonderDlg');
      const cv = document.getElementById('wonderCanvas');
      if (!dlg?.open || !cv || !activeWonderData) return;
      drawWonderScene(cv, activeWonderData, ts);
      if ((typeof fxOn === 'undefined' || fxOn) && !(typeof reduceMotion !== 'undefined' && reduceMotion)) wonderRaf = requestAnimationFrame(step);
    };
    wonderRaf = requestAnimationFrame(step);
  }

  /* ---------- Refresh UI State ---------- */
  async function refreshWonderUI() {
    const baseData = await getWonderData(true);
    if (!baseData) return;
    const data = previewIdx >= 0
      ? { ...baseData, wonder: WONDERS[previewIdx % WONDERS.length], stonesPlaced: 10, pct: 100, isCompleted: true }
      : baseData;
    activeWonderData = data;

    const cv = document.getElementById('wonderCanvas');
    if (cv) drawWonderScene(cv, data, performance.now());
    startWonderLoop();

    const wonder = data.wonder;
    document.getElementById('bpIcon').textContent = wonder.icon;
    document.getElementById('bpName').textContent = wonder.name + (previewIdx >= 0 ? '（藍圖預覽）' : '');
    document.getElementById('bpTagline').textContent = wonder.tagline;
    document.getElementById('bpPct').textContent = data.pct + '%';
    document.getElementById('wonderBarFill').style.width = data.pct + '%';

    const stagePill = document.getElementById('wonderStagePill');
    stagePill.textContent = previewIdx >= 0 ? '🎨 竣工預覽' : data.isCompleted ? '👑 奇蹟完工落成' : data.pct >= 70 ? '🔨 穹頂封頂中' : data.pct >= 40 ? '🏛️ 廊柱壘砌中' : '📐 地基平整中';
    stagePill.classList.toggle('done', data.isCompleted);
    document.getElementById('wonderBlocksPill').textContent = `基石 ${data.stonesPlaced}/10 塊`;

    const clueBox = document.getElementById('bpClueBox');
    let clueHtml = '';
    if (data.isCompleted) {
      clueHtml = `<b>👑 奇蹟竣工永恆銘文：</b><p style="margin-top:4px;color:#d97706;font-weight:700">${wonder.quote}</p><small style="color:var(--muted)">${wonder.lore}</small>`;
    } else if (data.stonesPlaced >= 8) {
      clueHtml = `<b>⚡ 只差最後 ${10 - data.stonesPlaced} 塊基石！</b><p style="margin-top:3px">再完成方塊，加上 3 天以上達標，本週的奇蹟就落成了。</p>`;
    } else {
      clueHtml = `<b>📜 工程藍圖：</b><p style="margin-top:2px">${wonder.lore}</p><small class="hint">每完成一個排程方塊，工匠便為奇蹟砌上一塊基石。</small>`;
    }
    clueBox.innerHTML = clueHtml;

    const dayNames = ['週一', '週二', '週三', '週四', '週五', '週六', '週日'];
    const templesRow = document.getElementById('wonderTemplesRow');
    const lit = data.byDay.map(d => !!d.active), allLit = lit.every(Boolean);
    templesRow.classList.toggle('beam-full', allLit);
    templesRow.setAttribute('aria-label', '本週 ' + lit.filter(Boolean).length + ' 根神柱點亮' + (allLit ? '，七柱全亮' : ''));
    const rowHtml = data.byDay.map((d, i) => `
      <div class="temple-pill ${d.active ? 'active' : ''}" style="--i:${i}">
        ${d.active && lit[i + 1] ? '<span class="temple-beam" aria-hidden="true"></span>' : ''}
        <span class="temple-pillar-dot"></span>
        <span>${dayNames[i]}</span>
        <span style="font-size:.68rem;opacity:.8">${d.planned > 0 ? Math.round(d.rate * 100) + '%' : '-'}</span>
      </div>
    `).join('');
    if (rowHtml !== lastRow) { lastRow = rowHtml; templesRow.innerHTML = rowHtml; }

    document.getElementById('museumCount').textContent = data.museum.length;
    document.getElementById('museumGrid').innerHTML = data.museum.map(m => `
      <div class="museum-card">
        <span class="ic">${m.icon}</span>
        <b>${m.name}</b>
        <span style="color:var(--muted)">${m.tagline}</span>
        <span style="font-size:.7rem;opacity:.7">${m.week} 竣工</span>
      </div>
    `).join('') || '<p class="hint" style="grid-column:1/-1;text-align:center">博物館尚無藏品。每週完成 10 塊奇蹟基石與 3 天以上達標，即可永久入駐！</p>';
  }

  let lastRow = '';
  btn.addEventListener('click', () => {
    lastRow = '';
    previewIdx = -1;
    document.getElementById('wonderDlg').showModal();
    refreshWonderUI();
  });

  document.getElementById('wonderPreviewNext')?.addEventListener('click', () => {
    previewIdx = (previewIdx + 1) % WONDERS.length;
    refreshWonderUI();
  });

  document.getElementById('museumToggleBtn')?.addEventListener('click', () => {
    const v = document.getElementById('wonderMuseumView');
    v.hidden = !v.hidden;
  });

  async function watch() {
    try {
      const open = document.getElementById('wonderDlg').open;
      if (open) refreshWonderUI();
      const d = await getWonderData(false); if (!d || !d.isCompleted) return;
      let seen = null; try { seen = localStorage.getItem(SEEN); } catch (e) {}
      if (seen === d.monStr) return;
      try { localStorage.setItem(SEEN, d.monStr); } catch (e) {}
      window.paceRewardCard?.({ icon: d.wonder.icon, title: '奇蹟落成：' + d.wonder.name, sub: d.wonder.quote, big: true });
    } catch (e) {}
  }
  let timer = 0;
  const save0 = saveWeek;
  window.saveWeek = saveWeek = function () { const r = save0.apply(this, arguments); clearTimeout(timer); timer = setTimeout(watch, 1400); return r; };
})();
