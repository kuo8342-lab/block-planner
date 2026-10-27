/* 步調 Pace: "who are you" — picks the starter blocks in the palette. Asked once on first open (while the palette
   still holds the built-in starter set), and changeable later in Settings → 外觀. Only the palette changes;
   blocks already on the timetable stay. Injected by build-c.js after the app's own scripts. */
(() => {
  const B = (name, cat, minutes, extra = {}) => ({ name, cat, minutes, ...extra });
  const PERSONAS = {
    // only the few blocks almost everyone in the group needs; the rest people add themselves with 「＋ 新方塊」
    student: { label: '國中／高中生', blocks: [B('讀書', 'study', 50), B('寫作業', 'study', 60), B('考前複習', 'exam', 60), B('休息', 'rest', 20)] },
    college: { label: '大學生', blocks: [B('上課複習', 'study', 45), B('作業／報告', 'study', 90), B('考前複習', 'exam', 90), B('休息', 'rest', 20)] },
    exam: { label: '準備考試（學測、國考、證照）', blocks: [B('練習題', 'study', 90), B('寫考古題', 'exam', 120), B('整理錯題', 'study', 45), B('休息', 'rest', 20)] },
    worker: { label: '上班族', blocks: [B('專心工作', 'study', 90), B('進修', 'study', 60), B('運動', 'swim', 45), B('休息', 'rest', 20)] },
    freelance: { label: '自由工作者／接案', blocks: [B('接案工作', 'study', 120), B('跟客戶溝通', 'life', 30), B('學新技能', 'study', 60), B('休息', 'rest', 20)] },
    parent: { label: '家長', blocks: [B('陪孩子', 'rest', 60), B('家事', 'life', 45), B('工作', 'study', 120), B('自己的時間', 'rest', 60)] },
    blank: { label: '自己來（從空白開始）', blocks: [] }
  };
  const KEY = 'pace-persona';
  const get = () => { try { return localStorage.getItem(KEY); } catch (e) { return null; } };
  const set = v => { try { localStorage.setItem(KEY, v); } catch (e) {} };

  function apply(id) {
    const p = PERSONAS[id]; if (!p || !state.config) return;
    state.config.modules = p.blocks.map((b, i) => ({ id: id + '-' + i, ...b }));
    set(id); saveConfig(); render();
  }

  /* ---------- first open: a small dialog ---------- */
  const dlg = document.createElement('dialog');
  dlg.id = 'personaDlg';
  dlg.innerHTML = '<form method="dialog"><div class="dtitle">你主要用步調來排什麼？</div>' +
    '<p class="hint" style="margin:0">選一個，左邊只會先放 4 個最基本的方塊，其他需要的用「＋ 新方塊」自己加。之後也可以在「設定 → 外觀」換。</p>' +
    '<div class="persona-list">' + Object.entries(PERSONAS).map(([id, p]) => `<button class="btn" type="button" data-persona="${id}">${p.label}</button>`).join('') + '</div></form>';
  document.body.appendChild(dlg);
  dlg.addEventListener('click', e => { const b = e.target.closest('[data-persona]'); if (!b) return; apply(b.dataset.persona); dlg.close(); });
  dlg.addEventListener('cancel', () => set('student'));   // Esc keeps the starter blocks and doesn't ask again

  /* ---------- very first question: the language, confirmed with a green 確定 / red 不要 (asked once) ---------- */
  const langChosen = () => { try { return localStorage.getItem('pace-lang') !== null; } catch (e) { return true; } };
  const ld = document.createElement('dialog');
  ld.id = 'langDlg';
  ld.innerHTML = '<form method="dialog"><div class="dtitle">選擇語言 · Choose language</div>' +
    '<div class="persona-list" id="langPick"><button class="btn" type="button" data-lang="zh">繁體中文</button><button class="btn" type="button" data-lang="en">English</button></div>' +
    '<div id="langConfirm" hidden><p class="lang-ask" id="langAsk"></p><div class="actions"><button class="btn no" type="button" id="langNo"></button><button class="btn yes" type="button" id="langYes"></button></div></div></form>';
  document.body.appendChild(ld);
  let langWanted = 'zh';
  const TXT = { zh: ['使用繁體中文嗎？', '不要，重選', '確定'], en: ['Use English?', 'No, go back', 'Yes'] };
  ld.addEventListener('click', e => {
    const pick = e.target.closest('[data-lang]');
    if (pick) {
      langWanted = pick.dataset.lang; const [ask, no, yes] = TXT[langWanted];
      document.getElementById('langAsk').textContent = ask; document.getElementById('langNo').textContent = no; document.getElementById('langYes').textContent = yes;
      document.getElementById('langPick').hidden = true; document.getElementById('langConfirm').hidden = false; return;
    }
    if (e.target.id === 'langNo') { document.getElementById('langPick').hidden = false; document.getElementById('langConfirm').hidden = true; return; }
    if (e.target.id === 'langYes') {
      const changes = langWanted !== window.paceLang?.();
      try { localStorage.setItem('pace-lang', langWanted); } catch (e2) {}
      if (changes) { location.reload(); return; }   // the translation is set up at load
      ld.close(); waitForData();
    }
  });
  ld.addEventListener('cancel', e => e.preventDefault());   // it has to be answered once

  const isStarter = () => (state.config?.modules || []).every(m => /^m\d+$/.test(m.id));
  let tries = 0;
  function waitForData() {
    if (!langChosen()) { if (!ld.open) ld.showModal(); return; }
    if (get()) return;
    if (!state.ready || !state.config) { if (++tries < 40) setTimeout(waitForData, 250); return; }
    if (!isStarter()) { set('custom'); return; }   // someone who already changed their blocks is not asked
    dlg.showModal();
  }
  waitForData();

  /* ---------- settings: change later ---------- */
  const lang = document.querySelector('#skinDlg .lang-pick');
  if (lang) {
    const lab = document.createElement('label');
    lab.className = 'lang-pick';
    lab.innerHTML = '身份（預設方塊）<select id="personaPick"><option value="custom">（目前的方塊）</option>' + Object.entries(PERSONAS).map(([id, p]) => `<option value="${id}">${p.label}</option>`).join('') + '</select>';
    lang.after(lab);
    const sel = lab.querySelector('select');
    document.getElementById('skinBtn').addEventListener('click', () => { sel.value = PERSONAS[get()] ? get() : 'custom'; });
    sel.addEventListener('change', () => {
      if (sel.value === 'custom') return;
      if (!confirm('要把左邊的方塊換成「' + PERSONAS[sel.value].label + '」的預設方塊嗎？時間表上已經排好的不會動。')) { sel.value = PERSONAS[get()] ? get() : 'custom'; return; }
      apply(sel.value); toast('已換成「' + PERSONAS[sel.value].label + '」的方塊');
    });
  }
})();
