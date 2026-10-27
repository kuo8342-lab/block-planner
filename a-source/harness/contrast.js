window.contrastAudit = async function () {
  const parse = c => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const lum = ({ r, g, b }) => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(r) + .7152 * f(g) + .0722 * f(b); };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
  const over = (top, under) => ({ r: top.r * top.a + under.r * (1 - top.a), g: top.g * top.a + under.g * (1 - top.a), b: top.b * top.a + under.b * (1 - top.a), a: 1 });
  const bgOf = el => { const chain = []; for (let e = el; e; e = e.parentElement) { const c = parse(getComputedStyle(e).backgroundColor); if (c && c.a > 0) chain.push(c); if (c && c.a === 1) break; } let base = { r: 255, g: 255, b: 255, a: 1 }; for (const c of chain.reverse()) base = over(c, base); return base; };
  const out = []; const ns = document.createElement('style'); ns.textContent = '*{transition:none!important}'; document.head.appendChild(ns);
  state.week.blocks = [{ id: 'z1', day: 1, start: '18:40', minutes: 50, name: '數學題目', cat: 'study' }, { id: 'z2', day: 1, start: '19:40', minutes: 40, name: '休息', cat: 'rest' }]; render();
  for (const s of SKINS) {
    skin = s.id; applySkin(); await new Promise(r => setTimeout(r, 450));
    const checks = [['block', document.querySelector('[data-bid="z1"] .n')], ['rest block', document.querySelector('[data-bid="z2"] .n')], ['fixed', document.querySelector('.blk.fixed .n')],
      ['card text', document.querySelector('.card h2')], ['hint', document.querySelector('.card .hint')], ['chip', document.querySelector('.chip')], ['head', document.querySelector('.head .wd')]];
    for (const [name, el] of checks) {
      if (!el) { out.push(`${s.id} ${name}: missing`); continue; }
      const fg = parse(getComputedStyle(el).color), bg = bgOf(el);
      const r = ratio(over(fg, bg), bg);
      if (r < (name === 'hint' || name === 'head' ? 3 : 4.5)) out.push(`${s.id} ${name}: ${r.toFixed(2)}`);
    }
  }
  return out.length ? out : ['all readable'];
};
