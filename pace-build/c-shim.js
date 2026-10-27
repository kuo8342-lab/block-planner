/* 步調 Pace runtime: the app was written against claude.ai's window.claude.use('db' | 'sample' | 'downloads').
   Outside claude.ai we provide the same three things: a database kept in this browser's localStorage,
   AI through the visitor's own Claude API key, and plain browser downloads. */
(() => {
  if (window.claude?.use) return;
  const LS = 'pace-db-v1', KEY = 'pace-api-key', MODEL = 'pace-model';
  const ls = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} } };

  /* ---------- database ---------- */
  let store = {};
  try { store = JSON.parse(ls.get(LS) || '{}') || {}; } catch (e) { store = {}; }
  if (!store['config/main']) store['config/main'] = {
    modules: [
      ['數學練習', 'study', 50, '數學'], ['英文單字', 'lang', 20, '英文'], ['英文閱讀', 'lang', 30, '英文'], ['國文複習', 'study', 40, '國文'],
      ['自然科複習', 'study', 45], ['社會科複習', 'study', 45], ['預習明天的課', 'preview', 25], ['寫作業', 'study', 60],
      ['錯題訂正', 'study', 30], ['考前複習', 'exam', 60], ['程式練習', 'code', 60, '程式'], ['看教學影片', 'study', 30, null, true],
      ['休息', 'rest', 30], ['運動', 'swim', 45], ['緩衝', 'buffer', 60]
    ].map(([name, cat, minutes, subject, video], i) => ({ id: 'm' + i, name, cat, minutes, ...(subject ? { subject } : {}), ...(video ? { video: true } : {}) })),
    fixed: [], special: [], targets: {}, restMin: 60, holidays: []
  };
  const clone = v => v === undefined ? undefined : JSON.parse(JSON.stringify(v));
  let subs = [];
  const persist = () => { ls.set(LS, JSON.stringify(store)); subs.forEach(f => f()); };
  const snapDoc = p => ({ id: p.split('/').pop(), exists: p in store, data: () => clone(store[p]) });
  const docsIn = c => Object.keys(store).filter(k => k.startsWith(c + '/') && k.split('/').length === c.split('/').length + 1).sort().map(snapDoc);
  const qsnap = c => { const docs = docsIn(c); return { docs, size: docs.length, empty: !docs.length, docChanges: () => [], metadata: {} }; };
  const later = f => setTimeout(f, 0);
  const watch = f => { subs.push(f); later(f); return () => { subs = subs.filter(x => x !== f); }; };
  /* when each document was last written (ms), so cloud sync can tell which copy is newer */
  const META = 'pace-db-meta';
  let meta = {};
  try { meta = JSON.parse(ls.get(META) || '{}') || {}; } catch (e) { meta = {}; }
  const saveMeta = () => ls.set(META, JSON.stringify(meta));
  let writeHooks = [];
  const wrote = p => { meta[p] = Math.max(Date.now(), (meta[p] || 0) + 1); saveMeta(); const t = meta[p], d = clone(store[p]); writeHooks.forEach(f => f(p, d === undefined ? null : d, t)); };
  const doc = p => ({ id: p.split('/').pop(), path: p,
    get: async () => snapDoc(p),
    set: async data => { store[p] = clone(data); wrote(p); later(persist); },
    update: async data => { store[p] = { ...(store[p] || {}), ...clone(data) }; wrote(p); later(persist); },
    delete: async () => { delete store[p]; wrote(p); later(persist); },
    onSnapshot: next => watch(() => next(snapDoc(p))) });
  const collection = c => ({ path: c, doc: id => doc(c + '/' + id), get: async () => qsnap(c), onSnapshot: next => watch(() => next(qsnap(c))) });
  const db = { doc, collection };
  ls.set(LS, JSON.stringify(store));
  /* another tab changed the data: reload it and tell every listener */
  addEventListener('storage', e => {
    if (e.key === META) { try { meta = JSON.parse(e.newValue || '{}') || {}; } catch (err) {} return; }
    if (e.key !== LS) return; try { store = JSON.parse(e.newValue || '{}') || {}; } catch (err) {} subs.forEach(f => f());
  });
  /* hooks for c-sync.js: every local write, and applying a copy that came from the cloud */
  window.paceStore = {
    paths: () => [...new Set([...Object.keys(store), ...Object.keys(meta)])],
    read: p => ({ d: p in store ? clone(store[p]) : null, t: meta[p] || 0 }),
    onWrite: f => { writeHooks.push(f); return () => { writeHooks = writeHooks.filter(x => x !== f); }; },
    apply: (p, d, t) => { if (d == null) delete store[p]; else store[p] = clone(d); meta[p] = t; saveMeta(); later(persist); }
  };

  /* ---------- AI with the visitor's own key ----------
     Anthropic goes through its official SDK (streaming); Gemini, OpenAI and DeepSeek are plain fetch calls
     to their REST APIs (all three allow calls straight from the browser). Each service keeps its own key and model. */
  const PROVIDERS = {
    anthropic: { name: 'Anthropic Claude', keyUrl: 'https://console.anthropic.com/settings/keys', keyHint: 'sk-ant-...',
      models: [['claude-opus-5-5', 'Claude Opus 5.5（最聰明）'], ['claude-sonnet-5-5', 'Claude Sonnet 5.5（較便宜）'], ['claude-haiku-5-5', 'Claude Haiku 5.5（最便宜）']] },
    gemini: { name: 'Google Gemini', keyUrl: 'https://aistudio.google.com/apikey', keyHint: 'AIza...',
      models: [['gemini-3.8-flash', 'Gemini 3.8 Flash（有免費額度）'], ['gemini-3.5-flash-lite', 'Gemini 3.5 Flash-Lite（最便宜，有免費額度）'], ['gemini-4-argon', 'Gemini 4 Argon（最聰明，沒有免費額度）']] },
    openai: { name: 'OpenAI', keyUrl: 'https://platform.openai.com/api-keys', keyHint: 'sk-...',
      models: [['gpt-6.1-sol', 'GPT-6.1 Sol（推薦）'], ['gpt-6-luna', 'GPT-6 Luna（最便宜）'], ['gpt-6-astra', 'GPT-6 Astra（最聰明）']] },
    deepseek: { name: 'DeepSeek', keyUrl: 'https://platform.deepseek.com/api_keys', keyHint: 'sk-...',
      models: [['deepseek-flash', 'DeepSeek Flash（便宜）'], ['deepseek-v4-pro', 'DeepSeek V4 Pro（較聰明）']] }
  };
  const PROV = 'pace-ai-provider';
  const keyName = p => p === 'anthropic' ? KEY : KEY + '-' + p, modelName = p => p === 'anthropic' ? MODEL : MODEL + '-' + p;
  const cur = p => PROVIDERS[p] ? p : (PROVIDERS[ls.get(PROV)] ? ls.get(PROV) : 'anthropic');
  window.paceAi = {
    providers: PROVIDERS,
    provider: () => cur(), setProvider: p => { if (PROVIDERS[p]) ls.set(PROV, p); },
    key: p => ls.get(keyName(cur(p))) || '', setKey: (k, p) => ls.set(keyName(cur(p)), k || null),
    model: p => ls.get(modelName(cur(p))) || PROVIDERS[cur(p)].models[0][0], setModel: (m, p) => ls.set(modelName(cur(p)), m || null)
  };
  let sdk = null;
  const loadSdk = async () => sdk || (sdk = await import('__SDK__'));
  const fail = code => Object.assign(new Error(code), { code });
  const toText = prompt => typeof prompt === 'string' ? prompt : JSON.stringify(prompt);
  async function askAnthropic(apiKey, model, prompt, opts) {
    const { default: Anthropic } = await loadSdk();
    const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
    const params = { model, max_tokens: 16000, output_config: { effort: 'low' }, messages: [{ role: 'user', content: toText(prompt) }] };
    // Haiku has no server-side fallback; Opus and Sonnet fall back automatically if a safety check declines
    const fallback = model !== 'claude-haiku-5-5';
    if (fallback) { params.betas = ['server-side-fallback-2026-07-01']; params.fallbacks = 'default'; }
    let text = '';
    try {
      const stream = (fallback ? client.beta.messages : client.messages).stream(params, { signal: opts.signal });
      stream.on('text', delta => { text += delta; opts.onText?.({ text, delta }); });
      const msg = await stream.finalMessage();
      if (msg.stop_reason === 'refusal') throw fail('refused');
      return { text, truncated: msg.stop_reason === 'max_tokens' };
    } catch (e) {
      if (e.code) throw e;
      if (e instanceof Anthropic.APIUserAbortError || e?.name === 'AbortError') throw fail('cancelled');
      if (e instanceof Anthropic.AuthenticationError || e instanceof Anthropic.PermissionDeniedError) throw fail('bad_key');
      if (e instanceof Anthropic.RateLimitError) throw fail('rate_limited');
      if (e instanceof Anthropic.BadRequestError && /credit|billing|balance/i.test(e.message)) throw fail('billing');
      throw fail('unavailable');
    }
  }
  /* one non-streaming request; HTTP errors become the same codes the app already knows */
  async function post(url, headers, body, signal) {
    let res;
    try { res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body), signal }); }
    catch (e) {   // OpenAI's error replies carry no CORS header, so a wrong key looks like a network failure to the browser
      throw fail(e?.name === 'AbortError' ? 'cancelled' : navigator.onLine === false ? 'unavailable' : 'unreachable');
    }
    let data = null; try { data = await res.json(); } catch (e) {}
    if (res.ok) return data || {};
    const err = data?.error || {}, info = [err.code, err.type, err.status, err.message, ...(err.details || []).map(d => d.reason)].join(' ');
    if (res.status === 401 || res.status === 403 || /API_KEY_INVALID|invalid.{0,10}api.?key|incorrect api key|authentication/i.test(info)) throw fail('bad_key');
    if (res.status === 402 || /insufficient_quota|insufficient balance|billing|credit/i.test(info)) throw fail('billing');
    if (res.status === 429) throw fail('rate_limited');
    throw fail('unavailable');
  }
  async function askGemini(apiKey, model, prompt, opts) {
    const data = await post(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, { 'x-goog-api-key': apiKey },
      { contents: [{ role: 'user', parts: [{ text: toText(prompt) }] }], generationConfig: { maxOutputTokens: 16000 } }, opts.signal);
    const c = data.candidates?.[0];
    if (data.promptFeedback?.blockReason || (!c?.content && /SAFETY|PROHIBITED|BLOCKLIST|RECITATION/.test(c?.finishReason || ''))) throw fail('refused');
    const text = (c?.content?.parts || []).filter(p => !p.thought && p.text).map(p => p.text).join('');
    return { text, truncated: c?.finishReason === 'MAX_TOKENS' };
  }
  async function askOpenAiLike(url, apiKey, model, prompt, opts) {
    const data = await post(url, { authorization: 'Bearer ' + apiKey }, { model, messages: [{ role: 'user', content: toText(prompt) }] }, opts.signal);
    const c = data.choices?.[0];
    if (c?.message?.refusal) throw fail('refused');
    return { text: c?.message?.content || '', truncated: c?.finish_reason === 'length' };
  }
  async function ask(prompt, opts = {}) {
    const p = cur(), apiKey = paceAi.key(p), model = paceAi.model(p);
    if (!apiKey) throw fail('not_granted');
    // the app's prompts are written in Chinese and ask for Chinese answers; the language setting overrides that
    if (window.paceLang?.() === 'en') prompt += '\n\nIMPORTANT: Ignore the instruction to answer in Traditional Chinese. Write every part of your answer (including any step titles in JSON) in English.';
    if (p === 'anthropic') return askAnthropic(apiKey, model, prompt, opts);
    const r = p === 'gemini' ? await askGemini(apiKey, model, prompt, opts)
      : await askOpenAiLike(p === 'openai' ? 'https://api.openai.com/v1/chat/completions' : 'https://api.deepseek.com/chat/completions', apiKey, model, prompt, opts);
    if (r.text) opts.onText?.({ text: r.text, delta: r.text });
    return r;
  }
  ask.json = async (prompt, opts = {}) => {
    const { text } = await ask(prompt + '\n\n只輸出 JSON 本身，不要加說明文字或 ``` 標記。', opts);
    const m = text.match(/[\[{][\s\S]*[\]}]/);
    try { return JSON.parse(m ? m[0] : text); } catch (e) { throw fail('invalid_json'); }
  };

  /* ---------- downloads ---------- */
  const downloads = { save: async ({ filename, data }) => {
    const url = URL.createObjectURL(new Blob([typeof data === 'string' ? data : JSON.stringify(data)], { type: 'application/json' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: filename });
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 5000);
    return { status: 'saved' };
  } };

  window.claude = { use: async name => name === 'db' ? db : name === 'downloads' ? downloads : name === 'sample' ? (paceAi.key() ? ask : null) : null };
})();
