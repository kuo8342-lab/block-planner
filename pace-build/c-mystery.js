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

  // Helper to style built vs blueprint-ghost architectural elements
  function setStoneStyle(ctx, built, fillCol, strokeCol, glowCol) {
    if (built) {
      ctx.fillStyle = fillCol;
      ctx.strokeStyle = strokeCol || '#e2e8f0';
      ctx.lineWidth = 1.4;
      ctx.setLineDash([]);
      if (glowCol) { ctx.shadowColor = glowCol; ctx.shadowBlur = 12; }
    } else {
      ctx.fillStyle = 'rgba(148, 163, 184, 0.06)';
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.24)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 3]);
      ctx.shadowBlur = 0;
    }
  }

  // 12 Bespoke Architectural Renderers
  const ARCHITECTS = {
    library(ctx, cx, gy, stones, t, col) {
      // Steps foundation (stones 1-2)
      for (let k = 0; k < 2; k++) {
        setStoneStyle(ctx, stones > k, k ? '#cbd5e1' : '#94a3b8', '#f8fafc');
        ctx.beginPath(); ctx.roundRect(cx - 110 + k * 12, gy - 12 - k * 10, 220 - k * 24, 10, 2); ctx.fill(); ctx.stroke();
      }
      // 6 Ionic columns (stones 3-6)
      for (let i = 0; i < 6; i++) {
        const x = cx - 78 + i * 31.2;
        setStoneStyle(ctx, stones > 2 + Math.floor(i / 1.5), '#e2e8f0', '#94a3b8');
        ctx.fillRect(x - 5, gy - 84, 10, 62); ctx.strokeRect(x - 5, gy - 84, 10, 62);
        ctx.beginPath(); ctx.arc(x - 6, gy - 84, 3, 0, 6.28); ctx.arc(x + 6, gy - 84, 3, 0, 6.28); ctx.fill();
      }
      // Entablature & triangular pediment (stones 7-8)
      setStoneStyle(ctx, stones >= 7, '#f1f5f9', '#cbd5e1');
      ctx.fillRect(cx - 94, gy - 96, 188, 12); ctx.strokeRect(cx - 94, gy - 96, 188, 12);
      setStoneStyle(ctx, stones >= 8, '#e2e8f0', '#f8fafc');
      ctx.beginPath(); ctx.moveTo(cx, gy - 126); ctx.lineTo(cx - 98, gy - 96); ctx.lineTo(cx + 98, gy - 96); ctx.closePath(); ctx.fill(); ctx.stroke();
      // Celestial dome & floating astrolabe (stones 9-10)
      setStoneStyle(ctx, stones >= 9, 'rgba(56, 189, 248, 0.35)', '#38bdf8', col);
      ctx.beginPath(); ctx.arc(cx, gy - 96, 52, Math.PI, 0); ctx.fill(); ctx.stroke();
      setStoneStyle(ctx, stones >= 10, '#fde047', '#f59e0b', '#38bdf8');
      ctx.beginPath(); ctx.arc(cx, gy - 162 + Math.sin(t * 0.003) * 3, 9, 0, 6.28); ctx.fill();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)'; ctx.beginPath(); ctx.ellipse(cx, gy - 162 + Math.sin(t * 0.003) * 3, 22, 7, t * 0.001, 0, 6.28); ctx.stroke();
    },

    gardens(ctx, cx, gy, stones, t, col) {
      // 4 terraced stone arches (stones 1-8)
      const tiers = [[110, 26, 1], [86, 52, 3], [62, 78, 5], [38, 104, 7]];
      tiers.forEach(([hw, top, req], idx) => {
        setStoneStyle(ctx, stones >= req, idx % 2 ? '#d6d3d1' : '#e7e5e4', '#a8a29e');
        ctx.beginPath(); ctx.roundRect(cx - hw, gy - top, hw * 2, 26, 3); ctx.fill(); ctx.stroke();
        // Hanging lush vines & blossoms on built terraces
        if (stones >= req + 1) {
          ctx.fillStyle = '#22c55e';
          for (let x = cx - hw + 10; x <= cx + hw - 10; x += 18) {
            const vh = 10 + Math.sin(x + t * 0.003) * 3;
            ctx.beginPath(); ctx.ellipse(x, gy - top + 4, 7, vh, 0, 0, 6.28); ctx.fill();
            ctx.fillStyle = '#fb7185'; ctx.beginPath(); ctx.arc(x + 2, gy - top + 6, 2.2, 0, 6.28); ctx.fill();
            ctx.fillStyle = '#22c55e';
          }
        }
      });
      // Cascading twin waterfalls (stone 9) & Royal Oasis Pavilion (stone 10)
      if (stones >= 9) {
        ctx.strokeStyle = 'rgba(125, 211, 252, 0.75)'; ctx.lineWidth = 3; ctx.setLineDash([6, 4]);
        ctx.lineDashOffset = -(t * 0.04) % 10;
        ctx.beginPath(); ctx.moveTo(cx - 24, gy - 104); ctx.lineTo(cx - 38, gy); ctx.moveTo(cx + 24, gy - 104); ctx.lineTo(cx + 38, gy); ctx.stroke();
        ctx.setLineDash([]);
      }
      setStoneStyle(ctx, stones >= 10, '#4ade80', '#fde047', col);
      ctx.beginPath(); ctx.arc(cx, gy - 104, 24, Math.PI, 0); ctx.fill(); ctx.stroke();
    },

    observatory(ctx, cx, gy, stones, t, col) {
      // Octagonal stone base & tower (stones 1-5)
      setStoneStyle(ctx, stones >= 2, '#cbd5e1', '#94a3b8');
      ctx.fillRect(cx - 64, gy - 32, 128, 32); ctx.strokeRect(cx - 64, gy - 32, 128, 32);
      setStoneStyle(ctx, stones >= 5, '#e2e8f0', '#cbd5e1');
      ctx.fillRect(cx - 46, gy - 82, 92, 50); ctx.strokeRect(cx - 46, gy - 82, 92, 50);
      // Astronomical dome (stones 6-8)
      setStoneStyle(ctx, stones >= 8, '#c084fc', '#e9d5ff', col);
      ctx.beginPath(); ctx.arc(cx, gy - 82, 46, Math.PI, 0); ctx.fill(); ctx.stroke();
      // Giant Telescope & Deep-Space Star Beam (stones 9-10)
      setStoneStyle(ctx, stones >= 9, '#fbbf24', '#fef08a');
      ctx.save(); ctx.translate(cx + 10, gy - 108); ctx.rotate(-0.55 + Math.sin(t * 0.0015) * 0.08);
      ctx.fillRect(0, -5, 42, 10); ctx.strokeRect(0, -5, 42, 10);
      if (stones >= 10) {
        const bg = ctx.createLinearGradient(42, 0, 160, 0);
        bg.addColorStop(0, 'rgba(192, 132, 252, 0.75)'); bg.addColorStop(1, 'rgba(56, 189, 248, 0)');
        ctx.fillStyle = bg; ctx.beginPath(); ctx.moveTo(42, -4); ctx.lineTo(170, -28); ctx.lineTo(170, 28); ctx.lineTo(42, 4); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    },

    pyramid(ctx, cx, gy, stones, t, col) {
      // 9 stepped limestone layers + levitating golden capstone (stone 10)
      for (let i = 0; i < 9; i++) {
        const w = 210 - i * 20, y = gy - (i + 1) * 12;
        setStoneStyle(ctx, stones > i, i % 2 ? '#fde68a' : '#fcd34d', '#d97706');
        ctx.fillRect(cx - w / 2, y, w, 11); ctx.strokeRect(cx - w / 2, y, w, 11);
      }
      const fy = stones >= 10 ? Math.sin(t * 0.003) * 4 : 0;
      setStoneStyle(ctx, stones >= 10, '#fbbf24', '#ffffff', col);
      ctx.beginPath();
      ctx.moveTo(cx, gy - 142 + fy); ctx.lineTo(cx - 22, gy - 112 + fy); ctx.lineTo(cx + 22, gy - 112 + fy);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    },

    colossus(ctx, cx, gy, stones, t, col) {
      // Ocean waves at base
      ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.beginPath(); ctx.moveTo(cx - 140, gy);
      for (let x = cx - 140; x <= cx + 140; x += 14) ctx.lineTo(x, gy - 6 + Math.sin(x * 0.05 + t * 0.004) * 4);
      ctx.lineTo(cx + 140, gy); ctx.closePath(); ctx.fill();
      // Multi-tier octagonal Pharos Lighthouse (stones 1-8)
      const stages = [[48, 36, 2], [36, 76, 5], [26, 114, 8]];
      stages.forEach(([hw, top, req], i) => {
        setStoneStyle(ctx, stones >= req, i === 1 ? '#f8fafc' : '#e2e8f0', '#94a3b8');
        ctx.fillRect(cx - hw, gy - top, hw * 2, 38); ctx.strokeRect(cx - hw, gy - top, hw * 2, 38);
      });
      // Lantern cupola & rotating twin searchlight beams (stones 9-10)
      setStoneStyle(ctx, stones >= 9, '#fbbf24', '#f59e0b', col);
      ctx.beginPath(); ctx.arc(cx, gy - 126, 14, 0, 6.28); ctx.fill(); ctx.stroke();
      if (stones >= 10) {
        const sweep = Math.cos(t * 0.0022);
        const lg = ctx.createLinearGradient(cx, gy - 126, cx + 170 * sweep, gy - 150);
        lg.addColorStop(0, 'rgba(253, 224, 71, 0.85)'); lg.addColorStop(1, 'rgba(253, 224, 71, 0)');
        ctx.fillStyle = lg;
        ctx.beginPath(); ctx.moveTo(cx, gy - 126); ctx.lineTo(cx + 175 * sweep, gy - 165); ctx.lineTo(cx + 175 * sweep, gy - 90); ctx.closePath(); ctx.fill();
      }
    },

    forge(ctx, cx, gy, stones, t, col) {
      // Heavy basalt temple & twin magma pillars (stones 1-6)
      setStoneStyle(ctx, stones >= 2, '#475569', '#94a3b8');
      ctx.fillRect(cx - 95, gy - 24, 190, 24); ctx.strokeRect(cx - 95, gy - 24, 190, 24);
      for (const sgn of [-1, 1]) {
        setStoneStyle(ctx, stones >= 5, '#334155', '#f87171');
        ctx.fillRect(cx + sgn * 65 - 14, gy - 96, 28, 72); ctx.strokeRect(cx + sgn * 65 - 14, gy - 96, 28, 72);
        if (stones >= 7) {
          ctx.fillStyle = '#ef4444'; ctx.fillRect(cx + sgn * 65 - 4, gy - 90, 8, 60);
        }
      }
      //Sacred Anvil & Rising Forge Sparks (stones 8-10)
      setStoneStyle(ctx, stones >= 9, '#cbd5e1', '#f8fafc', col);
      ctx.beginPath();
      ctx.moveTo(cx - 32, gy - 54); ctx.lineTo(cx + 36, gy - 54); ctx.lineTo(cx + 20, gy - 24); ctx.lineTo(cx - 20, gy - 24);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      if (stones >= 10) {
        for (let k = 0; k < 12; k++) {
          const sy = gy - 58 - ((t * 0.05 + k * 11) % 85), sx = cx + Math.sin(k * 2.1 + t * 0.004) * 28;
          ctx.fillStyle = k % 2 ? '#fde047' : '#f97316';
          ctx.beginPath(); ctx.arc(sx, sy, 2.2, 0, 6.28); ctx.fill();
        }
      }
    },

    citadel(ctx, cx, gy, stones, t, col) {
      const fy = Math.sin(t * 0.0025) * 5;
      ctx.save(); ctx.translate(0, fy);
      // Floating island rock & anti-gravity crystal (stones 1-3)
      setStoneStyle(ctx, stones >= 3, '#64748b', '#94a3b8');
      ctx.beginPath(); ctx.moveTo(cx - 85, gy - 55); ctx.lineTo(cx + 85, gy - 55); ctx.lineTo(cx, gy - 12); ctx.closePath(); ctx.fill(); ctx.stroke();
      // Gothic spires & battlements (stones 4-9)
      for (const [dx, w, h, req] of [[-48, 24, 52, 5], [48, 24, 52, 7], [0, 36, 78, 9]]) {
        setStoneStyle(ctx, stones >= req, '#e2e8f0', '#c084fc');
        ctx.fillRect(cx + dx - w / 2, gy - 55 - h, w, h); ctx.strokeRect(cx + dx - w / 2, gy - 55 - h, w, h);
        ctx.fillStyle = '#a855f7';
        ctx.beginPath(); ctx.moveTo(cx + dx, gy - 55 - h - 24); ctx.lineTo(cx + dx - w * 0.65, gy - 55 - h); ctx.lineTo(cx + dx + w * 0.65, gy - 55 - h); ctx.closePath(); ctx.fill();
      }
      // Arcane energy shield dome (stone 10)
      if (stones >= 10) {
        ctx.strokeStyle = 'rgba(167, 139, 250, 0.65)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(cx, gy - 75, 92, 0, 6.28); ctx.stroke();
      }
      ctx.restore();
    },

    clocktower(ctx, cx, gy, stones, t, col) {
      // Gothic clocktower shaft & spire (stones 1-8)
      setStoneStyle(ctx, stones >= 3, '#cbd5e1', '#94a3b8');
      ctx.fillRect(cx - 42, gy - 56, 84, 56); ctx.strokeRect(cx - 42, gy - 56, 84, 56);
      setStoneStyle(ctx, stones >= 6, '#e2e8f0', '#cbd5e1');
      ctx.fillRect(cx - 36, gy - 118, 72, 62); ctx.strokeRect(cx - 36, gy - 118, 72, 62);
      setStoneStyle(ctx, stones >= 8, '#94a3b8', '#f8fafc');
      ctx.beginPath(); ctx.moveTo(cx, gy - 172); ctx.lineTo(cx - 40, gy - 118); ctx.lineTo(cx + 40, gy - 118); ctx.closePath(); ctx.fill(); ctx.stroke();
      // Illuminated golden clock face & ticking hands (stones 9-10)
      setStoneStyle(ctx, stones >= 9, '#fef9c3', '#f59e0b', col);
      ctx.beginPath(); ctx.arc(cx, gy - 88, 22, 0, 6.28); ctx.fill(); ctx.stroke();
      if (stones >= 10) {
        ctx.strokeStyle = '#78350f'; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
        const a1 = t * 0.001, a2 = t * 0.012;
        ctx.beginPath();
        ctx.moveTo(cx, gy - 88); ctx.lineTo(cx + Math.cos(a1) * 12, gy - 88 + Math.sin(a1) * 12);
        ctx.moveTo(cx, gy - 88); ctx.lineTo(cx + Math.cos(a2) * 17, gy - 88 + Math.sin(a2) * 17);
        ctx.stroke();
      }
    },

    sanctuary(ctx, cx, gy, stones, t, col) {
      // Emerald healing spring pond at base
      ctx.fillStyle = 'rgba(52, 211, 153, 0.35)';
      ctx.beginPath(); ctx.ellipse(cx, gy - 4, 95, 10, 0, 0, 6.28); ctx.fill();
      // Wooden pavilion pillars & curved Torii/Pagoda roofs (stones 1-10)
      for (const dx of [-52, -22, 22, 52]) {
        setStoneStyle(ctx, stones >= 4, '#dc2626', '#fca5a5');
        ctx.fillRect(cx + dx - 4, gy - 72, 8, 64); ctx.strokeRect(cx + dx - 4, gy - 72, 8, 64);
      }
      [[88, 72, 7], [62, 104, 10]].forEach(([hw, ry, req]) => {
        setStoneStyle(ctx, stones >= req, '#065f46', '#34d399', col);
        ctx.beginPath();
        ctx.moveTo(cx - hw - 14, gy - ry + 6);
        ctx.quadraticCurveTo(cx, gy - ry - 26, cx + hw + 14, gy - ry + 6);
        ctx.lineTo(cx + hw, gy - ry + 14);
        ctx.quadraticCurveTo(cx, gy - ry - 10, cx - hw, gy - ry + 14);
        ctx.closePath(); ctx.fill(); ctx.stroke();
      });
    },

    colosseum(ctx, cx, gy, stones, t, col) {
      // 3 tiers of Roman Colosseum arches (stones 1-9) + Victory Flame (stone 10)
      for (let row = 0; row < 3; row++) {
        const w = 196 - row * 12, y = gy - (row + 1) * 32;
        setStoneStyle(ctx, stones >= (row + 1) * 3, '#fde68a', '#f59e0b');
        ctx.fillRect(cx - w / 2, y, w, 30); ctx.strokeRect(cx - w / 2, y, w, 30);
        // Arch cutouts
        ctx.fillStyle = '#0f172a';
        const nArches = 6 - row;
        for (let a = 0; a < nArches; a++) {
          const ax = cx - w / 2 + 18 + a * ((w - 36) / (nArches - 1 || 1));
          ctx.beginPath(); ctx.arc(ax, y + 16, 6, Math.PI, 0); ctx.lineTo(ax + 6, y + 28); ctx.lineTo(ax - 6, y + 28); ctx.closePath(); ctx.fill();
        }
      }
      if (stones >= 10) {
        const fg = ctx.createRadialGradient(cx, gy - 118, 2, cx, gy - 118, 28);
        fg.addColorStop(0, '#fef08a'); fg.addColorStop(0.5, '#f97316'); fg.addColorStop(1, 'rgba(249,115,22,0)');
        ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(cx, gy - 118, 28, 0, 6.28); ctx.fill();
      }
    },

    pantheon(ctx, cx, gy, stones, t, col) {
      // Rotunda cylinder, Corinthian portico & coffered dome with starlight oculus
      setStoneStyle(ctx, stones >= 4, '#cbd5e1', '#94a3b8');
      ctx.fillRect(cx - 88, gy - 64, 176, 64); ctx.strokeRect(cx - 88, gy - 64, 176, 64);
      setStoneStyle(ctx, stones >= 8, '#e2e8f0', '#818cf8', col);
      ctx.beginPath(); ctx.arc(cx, gy - 64, 84, Math.PI, 0); ctx.fill(); ctx.stroke();
      setStoneStyle(ctx, stones >= 9, '#f8fafc', '#cbd5e1');
      ctx.beginPath(); ctx.moveTo(cx, gy - 96); ctx.lineTo(cx - 56, gy - 64); ctx.lineTo(cx + 56, gy - 64); ctx.closePath(); ctx.fill(); ctx.stroke();
      if (stones >= 10) {
        const og = ctx.createLinearGradient(cx, 0, cx, gy - 120);
        og.addColorStop(0, 'rgba(129, 140, 248, 0.65)'); og.addColorStop(1, 'rgba(253, 224, 71, 0.2)');
        ctx.fillStyle = og;
        ctx.beginPath(); ctx.moveTo(cx - 28, 0); ctx.lineTo(cx + 28, 0); ctx.lineTo(cx + 12, gy - 146); ctx.lineTo(cx - 12, gy - 146); ctx.closePath(); ctx.fill();
      }
    },

    monolith(ctx, cx, gy, stones, t, col) {
      // Stepped alien altar, obsidian monolith & glowing sacred geometry rings
      setStoneStyle(ctx, stones >= 3, '#334155', '#60a5fa');
      ctx.fillRect(cx - 75, gy - 16, 150, 16); ctx.strokeRect(cx - 75, gy - 16, 150, 16);
      setStoneStyle(ctx, stones >= 8, '#090d16', '#38bdf8', col);
      ctx.fillRect(cx - 26, gy - 148, 52, 132); ctx.strokeRect(cx - 26, gy - 148, 52, 132);
      if (stones >= 9) {
        ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 1.6;
        for (let k = 0; k < 4; k++) {
          const ry = gy - 42 - k * 24;
          ctx.beginPath(); ctx.arc(cx, ry, 6 + (k % 2) * 3, 0, 6.28); ctx.stroke();
        }
      }
      if (stones >= 10) {
        ctx.strokeStyle = 'rgba(96, 165, 250, 0.75)'; ctx.lineWidth = 1.8;
        ctx.beginPath(); ctx.ellipse(cx, gy - 90, 68, 18, Math.sin(t * 0.002) * 0.25, 0, 6.28); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(cx, gy - 90, 68, 18, -Math.sin(t * 0.002) * 0.25, 0, 6.28); ctx.stroke();
      }
    }
  };

  let wonderRaf = 0, activeWonderData = null, previewIdx = -1;

  function drawWonderScene(canvas, data, ts = 0) {
    if (!data) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = canvas.clientWidth || 460, H = 260;
    // resize only when the size changes: reallocating the canvas every frame halved the frame rate
    if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) { canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); canvas.style.height = H + 'px'; }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const wonder = data.wonder;
    const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
    if (data.isCompleted) {
      skyGrad.addColorStop(0, '#0f172a');
      skyGrad.addColorStop(0.55, '#1e1b4b');
      skyGrad.addColorStop(1, '#312e81');
    } else {
      skyGrad.addColorStop(0, '#020617');
      skyGrad.addColorStop(0.6, '#0f172a');
      skyGrad.addColorStop(1, '#1e293b');
    }
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, H);

    // Twinkling stars
    ctx.fillStyle = '#ffffff';
    let seed = 42;
    const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    for (let i = 0; i < 48; i++) {
      const sx = rnd() * W, sy = rnd() * (H - 55), sr = rnd() * 1.3 + 0.4, sp = rnd() * 6.28;
      ctx.globalAlpha = 0.25 + 0.65 * Math.abs(Math.sin(ts * 0.002 + sp));
      ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;

    const groundY = H - 34;
    if (data.isCompleted) {
      ctx.save();
      const goldRays = ctx.createRadialGradient(W / 2, groundY - 75, 8, W / 2, groundY - 75, 195);
      goldRays.addColorStop(0, 'rgba(251, 191, 36, 0.38)');
      goldRays.addColorStop(0.5, 'rgba(245, 158, 11, 0.12)');
      goldRays.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = goldRays;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }

    // Ground platform
    ctx.fillStyle = '#090f1d';
    ctx.fillRect(0, groundY, W, 34);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(W, groundY); ctx.stroke();

    // Render the specific Wonder's architecture
    ctx.save();
    const arch = ARCHITECTS[wonder.id] || ARCHITECTS.library;
    arch(ctx, W / 2, groundY, data.stonesPlaced, ts, wonder.color);
    ctx.restore();
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
