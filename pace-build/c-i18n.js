/* 步調 Pace: interface language. The app is written in Traditional Chinese; for English we translate what
   ends up on screen: every text node and placeholder/title/aria-label, now and whenever the page changes.
   Dictionary keys are the Chinese strings; {0} {1}… stand for the parts the app fills in (numbers, names, days).
   Injected by build-c.js with the English dictionary as PACE_EN. */
(() => {
  const LS = 'pace-lang';
  const pick = () => { try { const v = localStorage.getItem(LS); if (v) return v; } catch (e) {} return /^zh/i.test(navigator.language || 'zh') ? 'zh' : 'en'; };
  const lang = pick();
  window.paceLang = () => lang;
  window.paceSetLang = v => { try { localStorage.setItem(LS, v); } catch (e) {} location.reload(); };
  document.documentElement.lang = lang === 'en' ? 'en' : 'zh-Hant';
  if (lang !== 'en') return;

  const norm = s => s.replace(/\s+/g, ' ').trim();
  const exact = new Map(), patterns = [];
  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  for (const [zh, en] of Object.entries(PACE_EN)) {
    const k = norm(zh);
    if (!/\{\d+\}/.test(k)) { exact.set(k, en); continue; }
    const weekday = new Set();
    const src = k.split(/(\{\d+\})/).map(part => {
      const m = /^\{(\d+)\}$/.exec(part);
      return m ? '(.*?)' : esc(part).replace(/ /g, '\\s*');
    }).join('');
    // which captures sit right after 週 (a weekday like 一 or 一、三)
    const order = [...k.matchAll(/\{(\d+)\}/g)].map(m => Number(m[1]));
    order.forEach((n, i) => { const at = k.indexOf('{' + n + '}'); if (k[at - 1] === '週') weekday.add(n); });
    patterns.push({ re: new RegExp('^' + src + '$'), order, weekday, en, len: k.replace(/\{\d+\}|\s/g, '').length });
  }
  patterns.sort((a, b) => b.len - a.len);   // most fixed text first, so 「休 {0} 分」 wins over 「{0} {1} {2} 分」
  const WD = { 一: 'Mon', 二: 'Tue', 三: 'Wed', 四: 'Thu', 五: 'Fri', 六: 'Sat', 日: 'Sun' };
  const day = s => s.replace(/[一二三四五六日]/g, c => WD[c]).replace(/、/g, ', ');
  const piece = s => exact.get(norm(s)) ?? s.replace(/(\d+)月/g, '$1/').replace(/(\d+)日/g, '$1');
  function tr(text) {
    const k = norm(text); if (!k || !/[㐀-鿿＀-￯　-〿]/.test(k)) return null;
    if (exact.has(k)) return exact.get(k);
    for (const p of patterns) {
      const m = p.re.exec(k); if (!m) continue;
      const vals = {}; p.order.forEach((n, i) => { const v = m[i + 1]; vals[n] = p.weekday.has(n) ? day(v) : piece(v); });
      return p.en.replace(/\{(\d+)\}/g, (_, n) => vals[n] ?? '');
    }
    return null;
  }
  window.paceTr = tr;
  const SKIP = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'CODE']);
  // never touch what we wrote ourselves: a user's own Chinese block name stays Chinese, and rewriting it would loop forever
  const mine = new WeakMap();
  function textNode(n) {
    if (n.parentNode && SKIP.has(n.parentNode.nodeName)) return;
    if (mine.get(n) === n.data) return;
    const t = tr(n.data); if (t == null) return;
    const lead = /^\s*/.exec(n.data)[0], trail = /\s*$/.exec(n.data)[0];
    const next = (lead ? ' ' : '') + t + (trail ? ' ' : '');
    mine.set(n, next);
    if (next !== n.data) n.data = next;
  }
  const ATTRS = ['placeholder', 'title', 'aria-label', 'alt'];
  const mineAttr = new WeakMap();
  function element(el) {
    for (const a of ATTRS) {
      const v = el.getAttribute?.(a); if (!v) continue;
      const seen = mineAttr.get(el) || {}; if (seen[a] === v) continue;
      const t = tr(v); if (t == null) continue;
      seen[a] = t; mineAttr.set(el, seen);
      if (t !== v) el.setAttribute(a, t);
    }
  }
  function walk(root) {
    if (root.nodeType === 3) return textNode(root);
    if (root.nodeType !== 1 || SKIP.has(root.nodeName)) return;
    element(root);
    const it = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    for (let n = it.nextNode(); n; n = it.nextNode()) n.nodeType === 3 ? textNode(n) : element(n);
  }
  const run = () => {
    walk(document.body);
    const t = tr(document.title); if (t) document.title = t;
    new MutationObserver(list => {
      for (const m of list) {
        if (m.type === 'characterData') textNode(m.target);
        else if (m.type === 'attributes') element(m.target);
        else m.addedNodes.forEach(walk);
      }
    }).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  };
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', run) : run();
  // the app's alerts and confirms
  const wrap = f => msg => f(typeof msg === 'string' ? (tr(msg) ?? msg) : msg);
  window.alert = wrap(window.alert.bind(window)); window.confirm = wrap(window.confirm.bind(window));
})();
