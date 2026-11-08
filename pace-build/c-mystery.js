/* 步調 Pace: 「心流奇蹟工程」 (Wonders of Focus), a weekly building project that shows the week's progress as something standing:
   - 不是耗費時間玩的遊戲，而是利用「One More Turn（再推進一步奇蹟就落成了！）」的強烈自律心智引導；
   - 每週承接一座世界奇蹟工程（亞歷山大圖書館、空中花園、星空天文台、時光方尖碑…）；
   - 每完成一個方塊 = 運送砌上一塊漢白玉基石（共 10 塊築成）；
   - 7 根日之神廟石柱（週一至週日）：每天達標 7 成點亮神廟精力光柱；
   - 奇蹟完工時全屏慶典，並入駐「專注奇蹟博物館」。博物館是從存好的方塊算出來的，每台裝置都一樣，取消打勾也會跟著變。 */

(() => {
  if (typeof state === 'undefined' || typeof blocksInRange !== 'function') return;
  const SEEN = 'pace-wonder-seen';   // the week whose finished wonder has been celebrated
  const ls = {
    get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} }
  };

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
  // inside the rewards dialog: the header has no room for one more button, and the phone layout hides it
  const host = document.getElementById('xpQuestTxt'), fallback = document.getElementById('skinBtn');
  if (host) host.after(btn); else if (fallback) fallback.before(btn); else return;

  // Dialog markup
  document.body.insertAdjacentHTML('beforeend', `
    <dialog id="wonderDlg" class="wonder-dlg" aria-labelledby="wonderTitle">
      <form method="dialog">
        <div class="wonder-header">
          <div class="dtitle" id="wonderTitle">🏛️ 心流世界奇蹟工程</div>
          <button type="button" class="btn sm" id="museumToggleBtn" title="查看已落成的奇蹟博物館">🏛️ 博物館圖鑑</button>
        </div>
        <p class="hint" style="margin:2px 0 10px">每完成一個方塊就砌上一塊基石，每天達標點亮一根神柱。這週完成 10 塊基石、3 天以上達標，奇蹟就落成。</p>

        <!-- Wonder Canvas: Building in progress -->
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
          <!-- Progress Bar -->
          <div class="wonder-bar-track">
            <i id="wonderBarFill"></i>
          </div>
          <div class="blueprint-clue" id="bpClueBox">
            <p id="bpLore">正在平整地基。排定並完成方塊，運送漢白玉基石開始壘砌柱廊…</p>
          </div>
        </div>

        <!-- 7 Daily Temples (Zelda Stamina Pillars) -->
        <h3 class="set-h" style="margin:12px 0 6px">7 日精力試煉神廟（日達標 7 成點亮）</h3>
        <div class="wonder-temples-row" id="wonderTemplesRow"></div>

        <!-- Museum View (Hidden by default) -->
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
    }
    .wonder-nav-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px color-mix(in srgb, var(--accent) 25%, transparent);
      border-color: var(--accent);
    }
    .wonder-nav-btn { align-self: flex-start; }
    .wonder-dlg form > * { flex: none; }
    .wonder-dlg {
      width: min(530px, calc(100vw - 32px)); border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0,0,0,.35); border: 1px solid var(--line);
      background: var(--panel); color: var(--fg);
    }
    .wonder-dlg form { max-height: 86vh; overflow-y: auto; padding: 4px 2px; }
    .wonder-header { display: flex; justify-content: space-between; align-items: center; }
    .wonder-canvas-wrap {
      position: relative; width: 100%; border-radius: 14px; overflow: hidden;
      background: linear-gradient(180deg, #0f172a 0%, #020617 100%);
      border: 1px solid rgba(245, 158, 11, .25);
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
      margin-top: 6px; text-align: center; font-size: .75rem;
    }
    .temple-pill {
      padding: 6px 2px; border-radius: 8px; background: var(--panel-2);
      border: 1px solid var(--line-soft); display: flex; flex-direction: column;
      gap: 3px; align-items: center; transition: all .25s ease;
    }
    .temple-pill.active {
      border-color: #f59e0b; background: rgba(245, 158, 11, .14);
      color: #d97706; font-weight: 700; box-shadow: 0 2px 8px rgba(245, 158, 11, .18);
    }
    .temple-pillar-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--line); position: relative; z-index: 1; }
    .temple-pill.active .temple-pillar-dot { background: #f59e0b; box-shadow: 0 0 6px #f59e0b; }
    /* golden beam: neighbouring lit pillars are joined dot to dot; all 7 lit makes the whole row glow */
    .wonder-temples-row { position: relative; }
    .temple-pill { position: relative; }
    .temple-pill.active { animation: pace-pillar-in .45s ease both; animation-delay: calc(var(--i) * 90ms); }
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

  /* ---------- Engine: Wonder Data & Canvas Construction ---------- */
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

  function drawWonderScene(canvas, data) {
    if (!data) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = canvas.clientWidth || 460, H = 260;
    canvas.width = W * dpr; canvas.height = H * dpr; canvas.style.height = H + 'px';
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Dynamic sky based on completion percentage
    const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
    if (data.isCompleted) {
      skyGrad.addColorStop(0, '#1e1b4b');
      skyGrad.addColorStop(0.5, '#312e81');
      skyGrad.addColorStop(1, '#4338ca');
    } else {
      skyGrad.addColorStop(0, '#020617');
      skyGrad.addColorStop(0.6, '#0f172a');
      skyGrad.addColorStop(1, '#1e293b');
    }
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, H);

    // Stars in night sky
    ctx.fillStyle = '#ffffff';
    let seed = 42;
    const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    for (let i = 0; i < 45; i++) {
      ctx.globalAlpha = 0.2 + rnd() * 0.6;
      ctx.beginPath();
      ctx.arc(rnd() * W, rnd() * (H - 60), rnd() * 1.2 + 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Ground platform
    const groundY = H - 36;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, groundY, W, 36);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(W, groundY); ctx.stroke();

    // 10 Construction Blocks (Stones of Civilization)
    const stones = data.stonesPlaced;
    const cx = W / 2, baseW = 180;

    // Layer 1: Foundation (4 blocks)
    for (let i = 0; i < 4; i++) {
      const bx = cx - baseW / 2 + i * (baseW / 4) + 2;
      const by = groundY - 18;
      const isBuilt = stones > i;
      ctx.fillStyle = isBuilt ? '#cbd5e1' : 'rgba(255,255,255,0.06)';
      ctx.strokeStyle = isBuilt ? '#94a3b8' : 'rgba(255,255,255,0.12)';
      ctx.lineWidth = 1.2;
      ctx.fillRect(bx, by, baseW / 4 - 4, 16);
      ctx.strokeRect(bx, by, baseW / 4 - 4, 16);
    }

    // Layer 2: Pillars / Colonnade (3 pillars)
    for (let i = 0; i < 3; i++) {
      const bx = cx - (baseW * 0.75) / 2 + i * (baseW * 0.75 / 3) + 6;
      const by = groundY - 48;
      const isBuilt = stones > 4 + i;
      ctx.fillStyle = isBuilt ? '#e2e8f0' : 'rgba(255,255,255,0.05)';
      ctx.strokeStyle = isBuilt ? '#cbd5e1' : 'rgba(255,255,255,0.1)';
      ctx.fillRect(bx, by, (baseW * 0.75 / 3) - 12, 28);
      ctx.strokeRect(bx, by, (baseW * 0.75 / 3) - 12, 28);
    }

    // Layer 3: Architrave & Pediment Dome (2 blocks)
    for (let i = 0; i < 2; i++) {
      const bx = cx - 50 + i * 52;
      const by = groundY - 72;
      const isBuilt = stones > 7 + i;
      ctx.fillStyle = isBuilt ? '#f1f5f9' : 'rgba(255,255,255,0.04)';
      ctx.strokeStyle = isBuilt ? '#e2e8f0' : 'rgba(255,255,255,0.08)';
      ctx.fillRect(bx, by, 46, 20);
      ctx.strokeRect(bx, by, 46, 20);
    }

    // Layer 4: Pinnacle / Golden Crown (Stone 10)
    const isPinnacle = stones >= 10;
    ctx.save();
    ctx.fillStyle = isPinnacle ? '#fbbf24' : 'rgba(255,255,255,0.05)';
    ctx.strokeStyle = isPinnacle ? '#f59e0b' : 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1.5;
    if (isPinnacle) {
      ctx.shadowBlur = 18;
      ctx.shadowColor = '#fbbf24';
    }
    ctx.beginPath();
    ctx.moveTo(cx, groundY - 105);
    ctx.lineTo(cx - 24, groundY - 76);
    ctx.lineTo(cx + 24, groundY - 76);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Central Icon Badge of the Wonder
    ctx.font = '28px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(data.wonder.icon, cx, groundY - 34);

    // Completed Celebration Sunbeams / Golden Radiance
    if (data.isCompleted) {
      ctx.save();
      const goldRays = ctx.createRadialGradient(cx, groundY - 80, 10, cx, groundY - 80, 180);
      goldRays.addColorStop(0, 'rgba(251, 191, 36, 0.45)');
      goldRays.addColorStop(0.5, 'rgba(245, 158, 11, 0.15)');
      goldRays.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = goldRays;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
  }

  /* ---------- Refresh UI State ---------- */
  async function refreshWonderUI() {
    const data = await getWonderData(true);
    if (!data) return;

    const cv = document.getElementById('wonderCanvas');
    if (cv) drawWonderScene(cv, data);

    const wonder = data.wonder;
    document.getElementById('bpIcon').textContent = wonder.icon;
    document.getElementById('bpName').textContent = wonder.name;
    document.getElementById('bpTagline').textContent = wonder.tagline;
    document.getElementById('bpPct').textContent = data.pct + '%';
    document.getElementById('wonderBarFill').style.width = data.pct + '%';

    const stagePill = document.getElementById('wonderStagePill');
    stagePill.textContent = data.isCompleted ? '👑 奇蹟完工落成' : data.pct >= 70 ? '🔨 穹頂封頂中' : data.pct >= 40 ? '🏛️ 廊柱壘砌中' : '📐 地基平整中';
    stagePill.classList.toggle('done', data.isCompleted);
    document.getElementById('wonderBlocksPill').textContent = `基石 ${data.stonesPlaced}/10 塊`;

    // Clue & Lore box
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

    // 7 Daily Temples
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
    if (rowHtml !== lastRow) { lastRow = rowHtml; templesRow.innerHTML = rowHtml; }   // rebuilt (and animated) only when a pillar changes, or on opening

    // Museum List
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
    document.getElementById('wonderDlg').showModal();
    refreshWonderUI();
  });

  document.getElementById('museumToggleBtn')?.addEventListener('click', () => {
    const v = document.getElementById('wonderMuseumView');
    v.hidden = !v.hidden;
  });

  /* a finished wonder is celebrated once; saved blocks are re-read only while the dialog is open */
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
