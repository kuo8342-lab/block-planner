/* 步調 Pace: 原創「方塊森靈 (Koma)」貼圖與表情系統 ＋ 森靈調合工坊 (c-stickers.js)
   - 100% 獨立原創向量繪圖（和紙水彩 × 森林方塊精靈 × 書齋印記），絕不抄襲任何商業貼圖或系統 Emoji，僅含少數合法名畫／科學致敬。
   - 法律與智慧財產權安全設計（針對貼圖合併功能）：
     Google 的「Emoji Kitchen」受保護的部分為其商標名稱與預先繪製的 Noto Emoji 圖庫資產。本系統採用原創名稱「🧪 森靈調合工坊 (Koma Atelier)」，
     並透過 100% 自研的「基因圖層合成引擎（色票基因 × 表情五官 × 靈獸耳翼 × 雙重道具 × 天象背景環）」即時運算生成 SVG，完全不涉及任何第三方圖庫或商標，100% 合法原創。
   - 規模超越一般 Emoji：共 10 大分類 × 每類 24 款 = 240 款獨立原創 SVG 貼圖（外加數萬種雙貼圖／三貼圖合成組合）。
   - 解鎖、久不動結凍（🧊）與【等級進階制度（動態＆合併階層）】：
     1. 初始基本貼圖（第 1 類「基本常用」24 款：笑、大笑、讚、拍手、加油、OK 等）開局免費贈送，且【永遠不會結凍】。
     2. 進階貼圖（其餘 9 大類共 216 款）隨完成方塊／任務數量逐步解鎖；休息 3 天內完全不凍，之後從高階往下逐步結凍🧊（4–5 天 25%、6–7 天 50%、8–9 天 75%、10 天以上全凍），完成 1 格立即破冰🔥！
     3. 等級能力階梯（依完成方塊 XP 計算等級 Lv）：
        - Lv 1–2：貼圖為【靜態和紙印章】模式。
        - Lv 3+ ：【單張貼圖全面升級動態】！所有可用貼圖自動獲得物理微動畫。
        - Lv 5+ ：【動靜自由切換】！可自由選擇貼圖要「🎞️ 動態」或「🖼️ 靜態（不動）」。
        - Lv 6+ ：開啟【🧪 合理雙貼圖合併】（例如：情緒＋美食／讀書／手勢／作息／靈獸），合成後為靜態。
        - Lv 8+ ：【合理雙貼圖合併升級動態】（並可自由切換動／靜）！
        - Lv 10+：【任意雙貼圖自由合併】！解除合理配方限制，萬物皆可二合一（跨界合成此時為靜態）。
        - Lv 12+：【任意雙貼圖合併升級動態】！所有二合一貼圖皆可動態並自由切換動／靜。
        - Lv 15+：【多重貼圖（三合一）調合】！開放第 3 個合成槽，可將 3 張貼圖融合為傳奇森靈（此時三合一為靜態）。
        - Lv 18+：【多重貼圖（三合一）升級傳奇動態】！解鎖全套動態與自由動靜切換！ */
(() => {
  if (window.paceStickers) return;
  const ls = {
    get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} }
  };
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

  /* ---------- 10 大分類定義 ---------- */
  const CATEGORIES = [
    { id: 'starter', icon: '🌱', name: '基本常用', desc: '初始贈送 24 款基本貼圖（笑、讚、拍手等），永久解鎖且永遠不會結凍' },
    { id: 'emotion', icon: '😊', name: '喜怒哀樂', desc: '方塊森靈的 24 種豐富情緒與微表情' },
    { id: 'gesture', icon: '👍', name: '手勢互動', desc: '共筆聊天室裡的擊掌、應援、感謝與互動手勢' },
    { id: 'study',   icon: '📚', name: '讀書心流', desc: '書齋苦讀、番茄鐘、刷題、段考衝刺與滿分時刻' },
    { id: 'life',    icon: '🌿', name: '日常作息', desc: '早起、午休、運動、泡澡、放下手機與準時入眠' },
    { id: 'critter', icon: '🐾', name: '步調靈獸', desc: '森林摺紙與幾何動物夥伴，陪你一格一格前進' },
    { id: 'nature',  icon: '🌦️', name: '自然星象', desc: '四季花木、陰晴雨雪、極光星海與山嵐海浪' },
    { id: 'food',    icon: '🍱', name: '能量美食', desc: '手沖咖啡、抹茶珍奶、飯糰拉麵與慶功甜點' },
    { id: 'wonder',  icon: '🏛️', name: '奇蹟風景', desc: '燈塔、觀星台、水上鳥居、蒸汽火車與太空火箭' },
    { id: 'honor',   icon: '🏆', name: '榮耀致敬', desc: '傳奇獎盃、破冰聖火與世界名畫／科學定律合法致敬' }
  ];

  /* ---------- 色票系統 ---------- */
  const PALETTES = {
    mint:   { bg: '#e6f5ec', body: '#6bc497', edge: '#2a6f4e', cheek: '#f79489', acc: '#f4b942' },
    peach:  { bg: '#fdf0ea', body: '#f7a389', edge: '#9e3d22', cheek: '#ef5b5b', acc: '#ffd166' },
    gold:   { bg: '#fef6e4', body: '#f6c453', edge: '#8c5808', cheek: '#f2785c', acc: '#4ea8de' },
    sky:    { bg: '#e8f4fa', body: '#74BDE0', edge: '#1e5b7a', cheek: '#f48fb1', acc: '#ffd166' },
    berry:  { bg: '#f5eafc', body: '#b589d6', edge: '#522b72', cheek: '#f07199', acc: '#70d6ff' },
    rose:   { bg: '#fcebf0', body: '#f28db2', edge: '#882649', cheek: '#e63946', acc: '#ffe066' },
    amber:  { bg: '#fcf1e3', body: '#e8985e', edge: '#7f3b10', cheek: '#e55934', acc: '#6bc497' },
    slate:  { bg: '#ebeff4', body: '#8d9db6', edge: '#334155', cheek: '#f4978e', acc: '#64dfdf' },
    crimson:{ bg: '#fde8e8', body: '#e56b6f', edge: '#781d22', cheek: '#ffb703', acc: '#ffd166' },
    jade:   { bg: '#e3f4f1', body: '#4ea898', edge: '#17564b', cheek: '#f28482', acc: '#f6bd60' },
    cream:  { bg: '#faf6ec', body: '#ede0c8', edge: '#5c4b37', cheek: '#f28482', acc: '#52b788' },
    cosmos: { bg: '#e6e8f8', body: '#5e60ce', edge: '#1e1b4b', cheek: '#ff758f', acc: '#ffd166' }
  };

  /* ---------- 240 款原創貼圖資料庫 ---------- */
  const RAW_STICKERS = [
    /* ===== 1. starter: 基本常用 (24款，tier=0 永久免費、永不結凍) ===== */
    ['st_smile',    '笑',       'starter', 'mint',   'smile',   'sprout',     'bounce',  '笑'],
    ['st_laugh',    '大笑',     'starter', 'gold',   'laugh',   'sparkles',   'bounce',  '哈哈'],
    ['st_thumb',    '讚',       'starter', 'peach',  'wink',    'thumb',      'pop',     '讚'],
    ['st_clap',     '拍手',     'starter', 'amber',  'happy',   'clap',       'clap',    '啪啪'],
    ['st_cheer',    '加油',     'starter', 'rose',   'determ',  'flags',      'wiggle',  '加油'],
    ['st_ok',       'OK',       'starter', 'sky',    'wink',    'ok',         'pop',     'OK'],
    ['st_roger',    '收到',     'starter', 'jade',   'salute',  'salute',     'nod',     '收到'],
    ['st_wave',     '揮手',     'starter', 'mint',   'smile',   'wave',       'wiggle',  '嗨'],
    ['st_thanks',   '感謝',     'starter', 'rose',   'blush',   'bow',        'nod',     '謝謝'],
    ['st_love',     '愛心',     'starter', 'rose',   'love',    'heart',      'pulse',   '愛心'],
    ['st_morning',  '早安',     'starter', 'gold',   'happy',   'sun',        'float',   '早安'],
    ['st_night',    '晚安',     'starter', 'cosmos', 'sleep',   'moon',       'float',   '晚安'],
    ['st_water',    '喝水',     'starter', 'sky',    'smile',   'water',      'bounce',  '喝水'],
    ['st_rest',     '休息',     'starter', 'cream',  'zen',     'tea',        'float',   '休息'],
    ['st_focus',    '專注',     'starter', 'jade',   'focus',   'flame',      'pulse',   '專注'],
    ['st_done',     '搞定',     'starter', 'mint',   'proud',   'check',      'pop',     '搞定'],
    ['st_pat',      '拍拍',     'starter', 'peach',  'gentle',  'pat',        'wiggle',  '拍拍'],
    ['st_np',       '沒問題',   'starter', 'gold',    'cool',    'vsign',      'bounce',  '妥'],
    ['st_nod',      '點頭',     'starter', 'mint',   'smile',   'nodlines',   'nod',     '嗯嗯'],
    ['st_hug',      '抱抱',     'starter', 'rose',   'blush',   'hug',        'pulse',   '抱抱'],
    ['st_breathe',  '深呼吸',   'starter', 'sky',    'zen',     'wind',       'float',   '呼～'],
    ['st_highfive', '擊掌',     'starter', 'amber',  'laugh',   'highfive',   'clap',    '擊掌'],
    ['st_start',    '開始囉',   'starter', 'jade',   'determ',  'play',       'pop',     '出發'],
    ['st_hardwork', '辛苦了',   'starter', 'cream',  'gentle',  'towel',      'nod',     '辛苦'],

    /* ===== 2. emotion: 喜怒哀樂 (24款) ===== */
    ['em_ecstasy',  '狂喜撒花', 'emotion', 'gold',   'laugh',   'confetti',   'bounce',  '耶！'],
    ['em_giggle',   '偷笑',     'emotion', 'peach',  'smirk',   'pawmouth',   'wiggle',  '嘿嘿'],
    ['em_shy',      '害羞臉紅', 'emotion', 'rose',   'shy',     'steam',      'pulse',   '羞'],
    ['em_touched',  '感動落淚', 'emotion', 'sky',    'touched', 'sparkles',   'float',   '感動'],
    ['em_bawl',     '大哭一場', 'emotion', 'sky',    'sob',     'tears',      'wiggle',  '嗚嗚'],
    ['em_wronged',  '委屈巴巴', 'emotion', 'berry',  'pout',    'raincloud',  'float',   '委屈'],
    ['em_pout',     '生氣鼓腮', 'emotion', 'crimson','angry',   'angervein',  'wiggle',  '哼！'],
    ['em_volcano',  '火山爆發', 'emotion', 'crimson','rage',    'fire',       'bounce',  '怒'],
    ['em_jawdrop',  '驚訝',     'emotion', 'gold',   'shock',   'excl',       'pop',     '蛤？'],
    ['em_quake',    '瞳孔地震', 'emotion', 'slate',  'quake',   'lines',      'wiggle',  '震驚'],
    ['em_speechless','無語凝噎','emotion', 'slate',  'deadpan', 'dots',       'float',   '⋯⋯'],
    ['em_deadeyes', '眼神死',   'emotion', 'slate',  'hollow',  'crow',       'float',   '放空'],
    ['em_soulout',  '靈魂出竅', 'emotion', 'cosmos', 'dizzy',   'ghost',      'float',   '飄走'],
    ['em_daydream', '發呆放空', 'emotion', 'cream',  'blank',   'bubble',     'float',   '發呆'],
    ['em_smug',     '得意洋洋', 'emotion', 'gold',   'smug',    'crownmini',  'bounce',  '哼哼'],
    ['em_cool',     '墨鏡耍帥', 'emotion', 'cosmos', 'shades',  'sparkles',   'pop',     '帥'],
    ['em_peek',     '好奇探頭', 'emotion', 'mint',   'curious', 'magnify',    'wiggle',  '盯'],
    ['em_doubt',    '懷疑人生', 'emotion', 'berry',  'doubt',   'qmark',      'float',   '？'],
    ['em_nervous',  '緊張冒汗', 'emotion', 'sky',    'sweat',   'sweatdrop',  'wiggle',  '抖'],
    ['em_relief',   '鬆一口氣', 'emotion', 'mint',   'relief',  'sigh',       'float',   '呼'],
    ['em_starry',   '崇拜星星眼','emotion','gold',   'starry',  'stars',      'pulse',   '崇拜'],
    ['em_dizzy',    '暈頭轉向', 'emotion', 'berry',  'spiral',  'swirl',      'wiggle',  '暈'],
    ['em_tsundere', '傲嬌別頭', 'emotion', 'rose',   'pout',    'huff',       'nod',     '才不'],
    ['em_zen',      '佛系平靜', 'emotion', 'jade',   'zen',     'lotus',      'float',   '隨緣'],

    /* ===== 3. gesture: 手勢互動 (24款) ===== */
    ['ge_2thumbs',  '雙手比讚', 'gesture', 'gold',   'laugh',   'twothumbs',  'bounce',  '超讚'],
    ['ge_applause', '熱烈鼓掌', 'gesture', 'peach',  'starry',  'clap',       'clap',    '安可'],
    ['ge_pray',     '雙手合十', 'gesture', 'cream',  'gentle',  'pray',       'nod',     '拜託'],
    ['ge_fheart',   '比心手勢', 'gesture', 'rose',   'wink',    'fingerheart','pop',     '比心'],
    ['ge_pinky',    '勾勾手',   'gesture', 'mint',   'smile',   'pinky',      'wiggle',  '約定'],
    ['ge_raise',    '舉手發問', 'gesture', 'sky',    'curious', 'handup',     'bounce',  '選我'],
    ['ge_salute',   '敬禮遵命', 'gesture', 'jade',   'salute',  'salute',     'pop',     '遵命'],
    ['ge_nonono',   '搖手指不', 'gesture', 'crimson','smug',    'nowave',     'wiggle',  '達咩'],
    ['ge_shrug',    '攤手無奈', 'gesture', 'slate',  'deadpan', 'shrug',      'float',   '無奈'],
    ['ge_headpat',  '摸摸頭',   'gesture', 'peach',  'blush',   'pat',        'wiggle',  '乖乖'],
    ['ge_poke',     '戳戳臉頰', 'gesture', 'rose',   'shy',     'poke',       'wiggle',  '戳戳'],
    ['ge_flag',     '揮旗應援', 'gesture', 'amber',  'determ',  'flags',      'wiggle',  '衝啊'],
    ['ge_offertea', '遞茶給你', 'gesture', 'jade',   'gentle',  'tea',        'nod',     '請喝'],
    ['ge_tissue',   '遞衛生紙', 'gesture', 'sky',    'gentle',  'tissue',     'float',   '不哭'],
    ['ge_sprint',   '一起衝刺', 'gesture', 'crimson','determ',  'run',        'bounce',  '衝刺'],
    ['ge_shoulder', '肩並肩',   'gesture', 'mint',   'smile',   'duo',        'pulse',   '同行'],
    ['ge_bowl',     '敲碗期待', 'gesture', 'amber',  'starry',  'bowl',       'clap',    '敲碗'],
    ['ge_peace',    '勝利比V',  'gesture', 'gold',   'wink',    'vsign',      'pop',     '耶V'],
    ['ge_fist',     '握拳必勝', 'gesture', 'crimson','determ',  'fist',       'bounce',  '必勝'],
    ['ge_welcome',  '請進請用', 'gesture', 'cream',  'smile',   'openarms',   'nod',     '請進'],
    ['ge_bow',      '深深鞠躬', 'gesture', 'slate',  'bow',     'bow',        'nod',     '失禮'],
    ['ge_peekaboo', '掩面偷看', 'gesture', 'rose',   'peek',    'paws',       'wiggle',  '偷看'],
    ['ge_pointup',  '指指上面', 'gesture', 'sky',    'smile',   'pointup',    'bounce',  '樓上'],
    ['ge_100pts',   '給你滿分', 'gesture', 'gold',   'laugh',   'score100',   'pop',     '滿分'],

    /* ===== 4. study: 讀書心流 (24款) ===== */
    ['sd_bury',     '埋頭苦讀', 'study',   'jade',   'focus',   'book',       'nod',     '苦讀'],
    ['sd_write',    '文思泉湧', 'study',   'amber',  'happy',   'pencil',     'wiggle',  '疾書'],
    ['sd_quiz',     '刷題狂魔', 'study',   'crimson','determ',  'papers',     'clap',    '刷題'],
    ['sd_vocab',    '背單字中', 'study',   'sky',    'focus',   'cards',      'bounce',  '單字'],
    ['sd_code',     '寫程式中', 'study',   'cosmos', 'shades',  'laptop',     'pulse',   'Code'],
    ['sd_math',     '算數學燒腦','study',  'berry',  'spiral',  'math',       'wiggle',  '燒腦'],
    ['sd_marker',   '畫重點',   'study',   'gold',   'smile',   'highlighter','wiggle',  '重點'],
    ['sd_dict',     '翻閱字典', 'study',   'cream',  'curious', 'thickbook',  'nod',     '查書'],
    ['sd_correct',  '訂正錯題', 'study',   'peach',  'determ',  'redpen',     'nod',     '訂正'],
    ['sd_notes',    '筆記滿滿', 'study',   'mint',   'proud',   'notebook',   'pop',     '筆記'],
    ['sd_flow',     '進入心流', 'study',   'cosmos', 'zen',     'aura',       'pulse',   '心流'],
    ['sd_pomo',     '番茄鐘倒數','study',  'crimson','focus',   'timer',      'pulse',   '計時'],
    ['sd_cram',     '考前衝刺', 'study',   'amber',  'sweat',   'headband',   'bounce',  '衝刺'],
    ['sd_examwin',  '段考必勝', 'study',   'crimson','determ',  'daruma',     'pop',     '必勝'],
    ['sd_paper100', '滿分試卷', 'study',   'gold',   'laugh',   'score100',   'bounce',  '100分'],
    ['sd_eureka',   '解開難題', 'study',   'gold',   'starry',  'bulb',       'pop',     '懂了'],
    ['sd_idea',     '靈光一閃', 'study',   'sky',    'shock',   'bulb',       'pulse',   '靈感'],
    ['sd_bag',      '整理書包', 'study',   'amber',  'smile',   'backpack',   'bounce',  '收拾'],
    ['sd_headphone','戴耳機隔音','study',  'jade',   'zen',     'headphones', 'float',   '隔音'],
    ['sd_library',  '圖書館模式','study',  'cream',  'shh',     'book',       'float',   '安靜'],
    ['sd_ahead',    '進度超前', 'study',   'mint',   'cool',    'rocketmini', 'bounce',  '超前'],
    ['sd_allclear', '今日全清', 'study',   'gold',   'laugh',   'stampclear', 'pop',     '全清'],
    ['sd_reviewed', '複習完畢', 'study',   'jade',   'relief',  'check',      'nod',     '完畢'],
    ['sd_handin',   '交作業囉', 'study',   'peach',  'happy',   'senddoc',    'pop',     '交件'],

    /* ===== 5. life: 日常作息 (24款) ===== */
    ['lf_alarm',    '鬧鐘起床', 'life',    'gold',   'shock',   'alarm',      'wiggle',  '起床'],
    ['lf_stretch',  '伸個懶腰', 'life',    'mint',   'relief',  'stretch',    'float',   '早～'],
    ['lf_brush',    '刷牙洗臉', 'life',    'sky',    'happy',   'bubbles',    'wiggle',  '清爽'],
    ['lf_goout',    '背書包出門','life',   'amber',  'smile',   'backpack',   'bounce',  '出門'],
    ['lf_commute',  '搭車通勤', 'life',    'slate',  'blank',   'train',      'float',   '通勤'],
    ['lf_nap',      '午休小睡', 'life',    'cream',  'sleep',   'pillow',     'float',   '午睡'],
    ['lf_bath',     '泡澡放鬆', 'life',    'peach',  'zen',     'onsen',      'float',   '泡湯'],
    ['lf_mask',     '敷臉保養', 'life',    'mint',   'zen',     'sparkles',   'pulse',   '保養'],
    ['lf_music',    '聽歌放空', 'life',    'berry',  'happy',   'notes',      'float',   '聽歌'],
    ['lf_walk',     '散步透氣', 'life',    'jade',   'smile',   'leaf',       'bounce',  '散步'],
    ['lf_yoga',     '拉筋伸展', 'life',    'rose',   'zen',     'stretch',    'float',   '拉筋'],
    ['lf_jog',      '慢跑運動', 'life',    'amber',  'determ',  'sweatdrop',  'bounce',  '運動'],
    ['lf_clean',    '整理房間', 'life',    'sky',    'proud',   'broom',      'wiggle',  '打掃'],
    ['lf_diary',    '寫日記反思','life',   'cream',  'gentle',  'notebook',   'nod',     '反思'],
    ['lf_vitamin',  '補充元氣', 'life',    'gold',   'smile',   'pill',       'pop',     '保健'],
    ['lf_window',   '看窗外發呆','life',   'sky',    'blank',   'cloud',      'float',   '看雲'],
    ['lf_bedtime',  '準備就寢', 'life',    'cosmos', 'yawn',    'nightcap',   'float',   '想睡'],
    ['lf_quilt',    '蓋被秒睡', 'life',    'cosmos', 'sleep',   'zzz',        'float',   '秒睡'],
    ['lf_sheep',    '數羊入眠', 'life',    'cream',  'sleep',   'sheep',      'float',   '數羊'],
    ['lf_dream',    '美夢連連', 'life',    'berry',  'sleep',   'stars',      'pulse',   '好夢'],
    ['lf_nolates',  '熬夜快逃', 'life',    'crimson','shock',   'moon',       'wiggle',  '快睡'],
    ['lf_nophone',  '放下手機', 'life',    'jade',   'determ',  'phoneoff',   'pop',     '戒機'],
    ['lf_offwork',  '準時收工', 'life',    'gold',   'laugh',   'bell',       'bounce',  '收工'],
    ['lf_weekend',  '週末愉快', 'life',    'rose',   'starry',  'balloon',    'float',   '週末'],

    /* ===== 6. critter: 步調靈獸 (24款) ===== */
    ['cr_shiba',    '方塊小柴', 'critter', 'amber',  'happy',   'ear_dog',    'bounce',  '汪！'],
    ['cr_cat',      '摺紙橘貓', 'critter', 'peach',  'smug',    'ear_cat',    'wiggle',  '喵～'],
    ['cr_sloth',    '愛睏樹懶', 'critter', 'cream',  'sleep',   'branch',     'float',   '慢活'],
    ['cr_bee',      '勤奮蜜蜂', 'critter', 'gold',   'determ',  'wings_bee',  'wiggle',  '嗡嗡'],
    ['cr_owl',      '夜讀貓頭鷹','critter','amber',  'focus',   'glasses',    'nod',     '博學'],
    ['cr_turtle',   '穩健烏龜', 'critter', 'jade',   'smile',   'shell',      'float',   '穩步'],
    ['cr_bunny',    '跳躍白兔', 'critter', 'rose',   'happy',   'ear_bunny',  'bounce',  '蹦蹦'],
    ['cr_squirrel', '屯糧松鼠', 'critter', 'amber',  'laugh',   'acorn',      'wiggle',  '滿滿'],
    ['cr_penguin',  '企鵝漫步', 'critter', 'sky',    'smile',   'scarf',      'wiggle',  '搖擺'],
    ['cr_octopus',  '多工章魚', 'critter', 'rose',   'determ',  'tentacles',  'wiggle',  '多工'],
    ['cr_fox',      '機智小狐', 'critter', 'peach',  'wink',    'ear_fox',    'pop',     '機智'],
    ['cr_panda',    '竹林貓熊', 'critter', 'mint',   'zen',     'bamboo',     'float',   '啃竹'],
    ['cr_jelly',    '發光水母', 'critter', 'cosmos', 'blank',   'jelly',      'float',   '漂浮'],
    ['cr_butterfly','破繭彩蝶', 'critter', 'berry',  'happy',   'wings_bfly', 'float',   '蛻變'],
    ['cr_bluebird', '報喜青鳥', 'critter', 'sky',    'happy',   'wings_bird', 'bounce',  '佳音'],
    ['cr_bear',     '冬眠小熊', 'critter', 'amber',  'sleep',   'ear_bear',   'float',   '冬眠'],
    ['cr_capybara', '淡定水豚', 'critter', 'cream',  'zen',     'tangerine',  'float',   '淡定'],
    ['cr_hamster',  '轉圈倉鼠', 'critter', 'peach',  'pout',    'seed',       'wiggle',  '努力'],
    ['cr_luckycat', '招財福貓', 'critter', 'gold',   'laugh',   'coin',       'wiggle',  '好運'],
    ['cr_unicorn',  '獨角星獸', 'critter', 'berry',  'starry',  'horn',       'pulse',   '奇蹟'],
    ['cr_dragon',   '守護青龍', 'critter', 'jade',   'proud',   'antlers',    'float',   '神龍'],
    ['cr_phoenix',  '浴火鳳凰', 'critter', 'crimson','determ',  'firewings',  'pulse',   '重生'],
    ['cr_whale',    '星海鯨魚', 'critter', 'cosmos', 'gentle',  'spout',      'float',   '遠航'],
    ['cr_deer',     '森林白鹿', 'critter', 'mint',   'gentle',  'antlers',    'float',   '靈鹿'],

    /* ===== 7. nature: 自然星象 (24款) ===== */
    ['na_sunrise',  '晨曦日出', 'nature',  'gold',   'happy',   'sun',        'float',   '破曉'],
    ['na_sunny',    '晴空萬里', 'nature',  'sky',    'laugh',   'suncloud',   'pulse',   '好天'],
    ['na_breeze',   '微風吹拂', 'nature',  'mint',   'zen',     'wind',       'float',   '微風'],
    ['na_shower',   '午後陣雨', 'nature',  'slate',  'gentle',  'umbrella',   'float',   '聽雨'],
    ['na_thunder',  '雷電交加', 'nature',  'cosmos', 'shock',   'lightning',  'wiggle',  '轟隆'],
    ['na_rainbow',  '雨後彩虹', 'nature',  'rose',   'starry',  'rainbow',    'pulse',   '放晴'],
    ['na_sakura',   '緋櫻吹雪', 'nature',  'rose',   'blush',   'sakura',     'float',   '櫻花'],
    ['na_momiji',   '秋日紅楓', 'nature',  'crimson','gentle',  'maple',      'float',   '楓紅'],
    ['na_ginkgo',   '銀杏金扇', 'nature',  'gold',   'smile',   'ginkgo',     'float',   '銀杏'],
    ['na_snow',     '六出雪晶', 'nature',  'sky',    'smile',   'snowflake',  'float',   '初雪'],
    ['na_aurora',   '極光舞動', 'nature',  'jade',   'starry',  'aurora',     'pulse',   '極光'],
    ['na_crescent', '新月彎彎', 'nature',  'cosmos', 'gentle',  'moon',       'float',   '弦月'],
    ['na_fullmoon', '滿月團圓', 'nature',  'gold',   'happy',   'fullmoon',   'pulse',   '滿月'],
    ['na_meteor',   '流星許願', 'nature',  'cosmos', 'starry',  'meteor',     'pop',     '許願'],
    ['na_galaxy',   '銀河星海', 'nature',  'cosmos', 'zen',     'galaxy',     'pulse',   '星海'],
    ['na_saturn',   '土星光環', 'nature',  'amber',  'cool',    'saturn',     'float',   '行星'],
    ['na_comet',    '彗星掠過', 'nature',  'sky',    'determ',  'meteor',     'bounce',  '彗星'],
    ['na_mountain', '山嵐水墨', 'nature',  'slate',  'zen',     'mountain',   'float',   '遠山'],
    ['na_wave',     '海浪潮汐', 'nature',  'sky',    'smile',   'wavecrest',  'float',   '潮汐'],
    ['na_forest',   '森林芬多精','nature', 'mint',   'relief',  'trees',      'float',   '森呼吸'],
    ['na_clover',   '四葉幸運草','nature', 'mint',   'wink',    'clover',     'pop',     '幸運'],
    ['na_sunflower','向日葵盛開','nature', 'gold',   'laugh',   'sunflower',  'bounce',  '向陽'],
    ['na_cactus',   '堅強仙人掌','nature', 'jade',   'determ',  'cactus',     'pop',     '堅韌'],
    ['na_campfire', '營火晚會', 'nature',  'amber',  'happy',   'fire',       'pulse',   '營火'],

    /* ===== 8. food: 能量美食 (24款) ===== */
    ['fd_coffee',   '手沖黑咖啡','food',   'amber',  'focus',   'coffee',     'float',   '回神'],
    ['fd_matcha',   '抹茶拿鐵', 'food',    'mint',   'zen',     'tea',        'float',   '抹茶'],
    ['fd_boba',     '黑糖珍奶', 'food',    'peach',  'happy',   'boba',       'bounce',  '珍奶'],
    ['fd_cocoa',    '熱可可',   'food',    'amber',  'blush',   'mug',        'float',   '暖心'],
    ['fd_soda',     '檸檬氣泡水','food',   'sky',    'laugh',   'soda',       'bounce',  '暢快'],
    ['fd_onigiri',  '三角飯糰', 'food',    'cream',  'smile',   'onigiri',    'pop',     '飯糰'],
    ['fd_ramen',    '熱騰騰拉麵','food',   'crimson','starry',  'ramen',      'float',   '拉麵'],
    ['fd_bento',    '元氣便當', 'food',    'gold',   'happy',   'bento',      'pop',     '便當'],
    ['fd_croissant','金黃可頌', 'food',    'amber',  'smile',   'croissant',  'float',   '可頌'],
    ['fd_shortcake','草莓蛋糕', 'food',    'rose',   'love',    'cake',       'bounce',  '甜點'],
    ['fd_dango',    '三色團子', 'food',    'rose',   'happy',   'dango',      'wiggle',  '團子'],
    ['fd_pudding',  '焦糖布丁', 'food',    'gold',   'blush',   'pudding',    'wiggle',  '布丁'],
    ['fd_cookie',   '手工餅乾', 'food',    'amber',  'wink',    'cookie',     'pop',     '餅乾'],
    ['fd_apple',    '紅富士蘋果','food',   'crimson','smile',   'apple',      'bounce',  '平安'],
    ['fd_orange',   '多汁蜜柑', 'food',    'amber',  'happy',   'tangerine',  'pop',     '大吉'],
    ['fd_banana',   '能量香蕉', 'food',    'gold',   'determ',  'banana',     'bounce',  '補體力'],
    ['fd_shavedice','宇治金時冰','food',   'mint',   'laugh',   'icebowl',    'float',   '消暑'],
    ['fd_takoyaki', '章魚燒',   'food',    'peach',  'happy',   'dango',      'bounce',  '章魚燒'],
    ['fd_cheese',   '濃郁起司', 'food',    'gold',   'wink',    'cheese',     'pop',     '起司'],
    ['fd_pancake',  '蜂蜜鬆餅', 'food',    'amber',  'love',    'pancake',    'float',   '鬆餅'],
    ['fd_herbal',   '養生熱茶', 'food',    'jade',   'zen',     'teapot',     'float',   '潤喉'],
    ['fd_oden',     '暖呼關東煮','food',   'cream',  'gentle',  'oden',       'float',   '宵夜'],
    ['fd_pizza',    '慶功披薩', 'food',    'crimson','laugh',   'pizza',      'bounce',  '派對'],
    ['fd_bdaycake', '慶祝大蛋糕','food',   'rose',   'starry',  'bdaycake',   'pulse',   '慶祝'],

    /* ===== 9. wonder: 奇蹟風景 (24款) ===== */
    ['wn_lighthouse','引航燈塔','wonder',  'sky',    'determ',  'lighthouse', 'pulse',   '引航'],
    ['wn_observ',   '天文觀星台','wonder', 'cosmos', 'starry',  'dome',       'float',   '觀星'],
    ['wn_greenhouse','溫室植物園','wonder','mint',   'gentle',  'sprout',     'float',   '溫室'],
    ['wn_skyisland','雲端浮島', 'wonder',  'sky',    'zen',     'cloud',      'float',   '浮島'],
    ['wn_clock',    '時光鐘樓', 'wonder',  'amber',  'focus',   'clock',      'pulse',   '守時'],
    ['wn_torii',    '水上鳥居', 'wonder',  'crimson','zen',     'torii',      'float',   '祈願'],
    ['wn_library',  '萬卷圖書館','wonder', 'cream',  'proud',   'pillars',    'nod',     '殿堂'],
    ['wn_windmill', '微風風車', 'wonder',  'mint',   'smile',   'windmill',   'wiggle',  '順風'],
    ['wn_teahouse', '竹林茶屋', 'wonder',  'jade',   'zen',     'bamboo',     'float',   '靜心'],
    ['wn_igloo',    '極地雪屋', 'wonder',  'sky',    'happy',   'igloo',      'float',   '雪屋'],
    ['wn_bridge',   '跨海大橋', 'wonder',  'slate',  'determ',  'bridge',     'pop',     '連結'],
    ['wn_garden',   '空中花園', 'wonder',  'rose',   'love',    'sakura',     'float',   '繁花'],
    ['wn_steam',    '蒸汽火車', 'wonder',  'amber',  'determ',  'train',      'bounce',  '前行'],
    ['wn_balloon',  '熱氣球升空','wonder', 'peach',  'starry',  'balloon',    'float',   '升空'],
    ['wn_sail',     '揚帆遠航', 'wonder',  'sky',    'proud',   'sail',       'float',   '啟航'],
    ['wn_rocket',   '太空火箭', 'wonder',  'cosmos', 'determ',  'rocket',     'bounce',  '升空'],
    ['wn_peak',     '登頂雪山', 'wonder',  'sky',    'laugh',   'mountain',   'pop',     '登頂'],
    ['wn_oasis',    '沙漠綠洲', 'wonder',  'gold',   'relief',  'cactus',     'float',   '綠洲'],
    ['wn_coral',    '海底珊瑚城','wonder', 'jade',   'curious', 'jelly',      'float',   '深海'],
    ['wn_castle',   '古堡書房', 'wonder',  'berry',  'focus',   'castle',     'pulse',   '古堡'],
    ['wn_treehouse','森林樹屋', 'wonder',  'mint',   'happy',   'trees',      'float',   '樹屋'],
    ['wn_camp',     '星空露營', 'wonder',  'cosmos', 'gentle',  'tent',       'float',   '露營'],
    ['wn_base',     '秘密基地', 'wonder',  'amber',  'wink',    'key',        'pop',     '基地'],
    ['wn_arch',     '終點凱旋門','wonder', 'gold',   'laugh',   'arch',       'bounce',  '凱旋'],

    /* ===== 10. honor: 榮耀致敬 (24款 — 傳奇徽章＋合法古典名作致敬) ===== */
    ['hn_trophy',   '黃金獎盃', 'honor',   'gold',   'laugh',   'trophy',     'bounce',  '冠軍'],
    ['hn_crown',    '璀璨王冠', 'honor',   'gold',   'proud',   'crown',      'pulse',   '王者'],
    ['hn_torch',    '連勝聖火', 'honor',   'crimson','determ',  'torch',      'pulse',   '連勝'],
    ['hn_diamond',  '永恆鑽石', 'honor',   'sky',    'starry',  'diamond',    'pulse',   '璀璨'],
    ['hn_100blk',   '百塊達成', 'honor',   'gold',   'laugh',   'score100',   'pop',     '百塊'],
    ['hn_medal',    '金牌得主', 'honor',   'gold',   'wink',    'medal',      'bounce',  '金牌'],
    ['hn_unseal',   '封印解除', 'honor',   'cosmos', 'determ',  'aura',       'pulse',   '覺醒'],
    ['hn_icebreak', '破冰重燃', 'honor',   'crimson','laugh',   'icebreak',   'pop',     '破冰'],
    ['hn_bullseye', '神準靶心', 'honor',   'crimson','cool',    'target',     'pop',     '神準'],
    ['hn_helm',     '時間掌舵', 'honor',   'jade',   'proud',   'helm',       'wiggle',  '領航'],
    ['hn_scream',   '名畫吶喊', 'honor',   'amber',  'scream',  'wavebg',     'wiggle',  '吶喊'],
    ['hn_thinker',  '沉思者',   'honor',   'slate',  'think',   'chin',       'float',   '沉思'],
    ['hn_wave',     '浮世巨浪', 'honor',   'sky',    'determ',  'greatwave',  'float',   '浮世'],
    ['hn_newton',   '萬有引力', 'honor',   'crimson','shock',   'applefall',  'bounce',  '頓悟'],
    ['hn_schrod',   '薛丁格的貓','honor',  'cosmos', 'curious', 'boxcat',     'pulse',   '疊加'],
    ['hn_mobius',   '莫比烏斯環','honor',  'berry',  'zen',     'infinity',   'float',   '無限'],
    ['hn_fibonacci','黃金螺線', 'honor',   'gold',   'smile',   'spiralgold', 'float',   '完美'],
    ['hn_vitruvian','幾何完美比例','honor','cream',  'proud',   'compass',    'pulse',   '比例'],
    ['hn_eureka',   '阿基米德皇冠','honor','gold',   'laugh',   'crownbath',  'bounce',  '尤里卡'],
    ['hn_galileo',  '仰望星空', 'honor',   'cosmos', 'starry',  'telescope',  'float',   '望遠'],
    ['hn_pixel',    '復古像素心','honor',  'rose',   'love',    'pixelheart', 'pulse',   '1-UP'],
    ['hn_seal',     '步調金印', 'honor',   'crimson','proud',   'seal',       'pop',     '合格'],
    ['hn_grandslam','全勤大滿貫','honor',  'gold',   'starry',  'laurel',     'bounce',  '滿貫'],
    ['hn_grad',     '榮耀學位帽','honor',  'cosmos', 'laugh',   'gradcap',    'bounce',  '畢業']
  ];

  const catCounters = {};
  const STICKERS = RAW_STICKERS.map((r, idx) => {
    const [id, name, cat, palKey, face, prop, anim, tag] = r;
    const cIdx = catCounters[cat] = (catCounters[cat] || 0);
    catCounters[cat] = cIdx + 1;
    const isStarter = cat === 'starter';
    const reqDone = isStarter ? 0 : Math.max(1, Math.floor(cIdx * 2.5));
    return {
      index: idx,
      id,
      name,
      cat,
      palKey,
      pal: PALETTES[palKey] || PALETTES.mint,
      face,
      prop,
      anim,
      tag,
      neverFreeze: isStarter,
      reqDone,
      tier: isStarter ? 0 : (cIdx + 1)
    };
  });

  const BY_ID = new Map(STICKERS.map(s => [s.id, s]));
  const BY_NAME = new Map(STICKERS.map(s => [s.name, s]));

  /* ---------- 原創 SVG 向量繪圖引擎 ---------- */
  function drawFace(face, edge, cheek) {
    const blush = `<ellipse cx="19" cy="36" rx="3.8" ry="2.1" fill="${cheek}" opacity=".65"/><ellipse cx="45" cy="36" rx="3.8" ry="2.1" fill="${cheek}" opacity=".65"/>`;
    switch (face) {
      case 'laugh':
        return blush +
          `<path d="M20 29c1.5-3 4.5-3 6 0M38 29c1.5-3 4.5-3 6 0" fill="none" stroke="${edge}" stroke-width="2.6" stroke-linecap="round"/>` +
          `<path d="M25 35h14c0 5.5-3.2 8.5-7 8.5s-7-3-7-8.5z" fill="#e55959" stroke="${edge}" stroke-width="2" stroke-linejoin="round"/>` +
          `<path d="M28 40c1.8-1.5 6.2-1.5 8 0" fill="none" stroke="#ffb3b3" stroke-width="2" stroke-linecap="round"/>`;
      case 'wink':
        return blush +
          `<circle cx="23" cy="29" r="2.6" fill="${edge}"/><circle cx="22.2" cy="28" r=".9" fill="#fff"/>` +
          `<path d="M38 29c1.8-2.6 4.5-2.6 6.2 0" fill="none" stroke="${edge}" stroke-width="2.5" stroke-linecap="round"/>` +
          `<path d="M27 36c2 3.2 8 3.2 10 0" fill="none" stroke="${edge}" stroke-width="2.4" stroke-linecap="round"/>`;
      case 'happy':
      case 'blush':
        return `<ellipse cx="18.5" cy="35.5" rx="4.6" ry="2.6" fill="${cheek}" opacity=".82"/><ellipse cx="45.5" cy="35.5" rx="4.6" ry="2.6" fill="${cheek}" opacity=".82"/>` +
          `<path d="M20 29.5c1.5-2.8 4.5-2.8 6 0M38 29.5c1.5-2.8 4.5-2.8 6 0" fill="none" stroke="${edge}" stroke-width="2.5" stroke-linecap="round"/>` +
          `<path d="M28 36.5c2 2.5 6 2.5 8 0" fill="none" stroke="${edge}" stroke-width="2.3" stroke-linecap="round"/>`;
      case 'determ':
      case 'focus':
        return blush +
          `<path d="M19 25l7 2.2M45 25l-7 2.2" stroke="${edge}" stroke-width="2.4" stroke-linecap="round"/>` +
          `<circle cx="23" cy="30" r="2.6" fill="${edge}"/><circle cx="41" cy="30" r="2.6" fill="${edge}"/>` +
          `<circle cx="22.2" cy="29" r=".9" fill="#fff"/><circle cx="40.2" cy="29" r=".9" fill="#fff"/>` +
          `<path d="M28 37.5c2.5-1.4 5.5-1.4 8 0" fill="none" stroke="${edge}" stroke-width="2.4" stroke-linecap="round"/>`;
      case 'love':
        return blush +
          `<path d="M23 31.5c-2.2-1.8-3.5-3.3-3.5-4.7 0-1.3 1-2.3 2.2-2.3.7 0 1.3.4 1.3 1 0-.6.6-1 1.3-1 1.2 0 2.2 1 2.2 2.3 0 1.4-1.3 2.9-3.5 4.7z" fill="#e63946"/>` +
          `<path d="M41 31.5c-2.2-1.8-3.5-3.3-3.5-4.7 0-1.3 1-2.3 2.2-2.3.7 0 1.3.4 1.3 1 0-.6.6-1 1.3-1 1.2 0 2.2 1 2.2 2.3 0 1.4-1.3 2.9-3.5 4.7z" fill="#e63946"/>` +
          `<path d="M27.5 36.5c2.2 2.8 6.8 2.8 9 0" fill="none" stroke="${edge}" stroke-width="2.3" stroke-linecap="round"/>`;
      case 'sleep':
      case 'zen':
        return blush +
          `<path d="M19.5 30c1.8 2.2 4.8 2.2 6.5 0M38 30c1.8 2.2 4.8 2.2 6.5 0" fill="none" stroke="${edge}" stroke-width="2.3" stroke-linecap="round"/>` +
          `<path d="M29.5 37c1.5 1.4 3.5 1.4 5 0" fill="none" stroke="${edge}" stroke-width="2.1" stroke-linecap="round"/>`;
      case 'yawn':
        return blush +
          `<path d="M19.5 29.5c1.8 2 4.8 2 6.5 0M38 29.5c1.8 2 4.8 2 6.5 0" fill="none" stroke="${edge}" stroke-width="2.3" stroke-linecap="round"/>` +
          `<ellipse cx="32" cy="38" rx="4.2" ry="5" fill="#e55959" stroke="${edge}" stroke-width="2"/>`;
      case 'sob':
      case 'touched':
        return blush +
          `<path d="M20 33v9M44 33v9" stroke="#4cc9f0" stroke-width="3.6" stroke-linecap="round" opacity=".85"/>` +
          `<circle cx="23" cy="29.5" r="2.8" fill="${edge}"/><circle cx="41" cy="29.5" r="2.8" fill="${edge}"/>` +
          `<circle cx="22" cy="28.5" r="1.1" fill="#fff"/><circle cx="40" cy="28.5" r="1.1" fill="#fff"/>` +
          `<path d="M27.5 39c2.2-2.6 6.8-2.6 9 0" fill="none" stroke="${edge}" stroke-width="2.3" stroke-linecap="round"/>`;
      case 'angry':
      case 'rage':
        return `<ellipse cx="19" cy="36" rx="4" ry="2.2" fill="#e63946" opacity=".75"/><ellipse cx="45" cy="36" rx="4" ry="2.2" fill="#e63946" opacity=".75"/>` +
          `<path d="M19 24.5l7.5 3M45 24.5l-7.5 3" stroke="${edge}" stroke-width="2.6" stroke-linecap="round"/>` +
          `<circle cx="23" cy="30" r="2.6" fill="${edge}"/><circle cx="41" cy="30" r="2.6" fill="${edge}"/>` +
          `<path d="M27 39c2.5-3 7.5-3 10 0" fill="none" stroke="${edge}" stroke-width="2.5" stroke-linecap="round"/>`;
      case 'pout':
      case 'shy':
        return `<ellipse cx="18.5" cy="35.5" rx="4.8" ry="2.7" fill="${cheek}" opacity=".85"/><ellipse cx="45.5" cy="35.5" rx="4.8" ry="2.7" fill="${cheek}" opacity=".85"/>` +
          `<circle cx="23" cy="29.5" r="2.5" fill="${edge}"/><circle cx="41" cy="29.5" r="2.5" fill="${edge}"/>` +
          `<path d="M28 37.5q2-2 4 0t4 0" fill="none" stroke="${edge}" stroke-width="2.2" stroke-linecap="round"/>`;
      case 'shock':
      case 'quake':
        return `<circle cx="23" cy="29" r="3.6" fill="#fff" stroke="${edge}" stroke-width="2"/><circle cx="23" cy="29" r="1.5" fill="${edge}"/>` +
          `<circle cx="41" cy="29" r="3.6" fill="#fff" stroke="${edge}" stroke-width="2"/><circle cx="41" cy="29" r="1.5" fill="${edge}"/>` +
          `<ellipse cx="32" cy="38.5" rx="4.5" ry="5.2" fill="#e55959" stroke="${edge}" stroke-width="2.1"/>`;
      case 'deadpan':
      case 'hollow':
      case 'blank':
        return `<line x1="19" y1="29" x2="26.5" y2="29" stroke="${edge}" stroke-width="2.6" stroke-linecap="round"/>` +
          `<line x1="37.5" y1="29" x2="45" y2="29" stroke="${edge}" stroke-width="2.6" stroke-linecap="round"/>` +
          `<line x1="27.5" y1="37.5" x2="36.5" y2="37.5" stroke="${edge}" stroke-width="2.3" stroke-linecap="round"/>`;
      case 'shades':
      case 'cool':
        return blush +
          `<path d="M16 26.5h13v5.5c0 1.5-1.2 2.5-2.8 2.5h-7.4c-1.6 0-2.8-1-2.8-2.5v-5.5zm19 0h13v5.5c0 1.5-1.2 2.5-2.8 2.5h-7.4c-1.6 0-2.8-1-2.8-2.5v-5.5z" fill="#1e293b" stroke="${edge}" stroke-width="1.8"/>` +
          `<line x1="29" y1="28" x2="35" y2="28" stroke="${edge}" stroke-width="2.2"/>` +
          `<line x1="18" y1="28" x2="22" y2="31" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/>` +
          `<path d="M27.5 37.5c2.5 2 6.5 1.5 8.5-1" fill="none" stroke="${edge}" stroke-width="2.3" stroke-linecap="round"/>`;
      case 'starry':
        return blush +
          `<polygon points="23,24 24.4,27.3 28,27.7 25.2,30 26,33.5 23,31.6 20,33.5 20.8,30 18,27.7 21.6,27.3" fill="#ffb703" stroke="${edge}" stroke-width="1.2"/>` +
          `<polygon points="41,24 42.4,27.3 46,27.7 43.2,30 44,33.5 41,31.6 38,33.5 38.8,30 36,27.7 39.6,27.3" fill="#ffb703" stroke="${edge}" stroke-width="1.2"/>` +
          `<path d="M26.5 36.5h11c0 4.2-2.5 6.5-5.5 6.5s-5.5-2.3-5.5-6.5z" fill="#e55959" stroke="${edge}" stroke-width="1.9"/>`;
      case 'spiral':
      case 'dizzy':
        return `<path d="M23 29m-3.2 0a3.2 3.2 0 1 0 6.4 0a2.2 2.2 0 1 0-4.4 0M41 29m-3.2 0a3.2 3.2 0 1 0 6.4 0a2.2 2.2 0 1 0-4.4 0" fill="none" stroke="${edge}" stroke-width="2" stroke-linecap="round"/>` +
          `<path d="M27 38q2.5-2.5 5 0t5 0" fill="none" stroke="${edge}" stroke-width="2.2" stroke-linecap="round"/>`;
      case 'scream':
        return `<circle cx="23" cy="27.5" r="3.2" fill="#fff" stroke="${edge}" stroke-width="2"/><circle cx="23" cy="27.5" r="1.3" fill="${edge}"/>` +
          `<circle cx="41" cy="27.5" r="3.2" fill="#fff" stroke="${edge}" stroke-width="2"/><circle cx="41" cy="27.5" r="1.3" fill="${edge}"/>` +
          `<ellipse cx="32" cy="39" rx="4.2" ry="6.8" fill="#1e293b" stroke="${edge}" stroke-width="2"/>` +
          `<path d="M15 44c-1-6 1-11 3-13M49 44c1-6-1-11-3-13" fill="none" stroke="${edge}" stroke-width="2.8" stroke-linecap="round"/>`;
      case 'shh':
        return blush +
          `<circle cx="23" cy="29.5" r="2.5" fill="${edge}"/><circle cx="41" cy="29.5" r="2.5" fill="${edge}"/>` +
          `<circle cx="32" cy="37" r="2.2" fill="${edge}"/><rect x="30.2" y="35" width="3.6" height="10" rx="1.8" fill="#fff" stroke="${edge}" stroke-width="1.8"/>`;
      default:
        return blush +
          `<circle cx="23" cy="29.5" r="2.6" fill="${edge}"/><circle cx="41" cy="29.5" r="2.6" fill="${edge}"/>` +
          `<circle cx="22.1" cy="28.5" r=".95" fill="#fff"/><circle cx="40.1" cy="28.5" r=".95" fill="#fff"/>` +
          `<path d="M27 36c2.2 3 7.8 3 10 0" fill="none" stroke="${edge}" stroke-width="2.4" stroke-linecap="round"/>`;
    }
  }

  function drawProp(prop, pal) {
    const e = pal.edge, a = pal.acc;
    switch (prop) {
      case 'thumb':
      case 'twothumbs':
        return `<g transform="translate(43,31)"><path d="M4 8v-5.5c0-1.5 1.2-2.5 2.5-2.5s2.2 1 2.2 2.5v2.5h4.3c1.5 0 2.5 1.2 2.2 2.7l-1.1 5.5c-.3 1.3-1.4 2.2-2.7 2.2H4z" fill="#ffd166" stroke="${e}" stroke-width="2" stroke-linejoin="round"/><rect x="1" y="7.5" width="3.5" height="8" rx="1.2" fill="${pal.body}" stroke="${e}" stroke-width="1.8"/></g>` +
          (prop === 'twothumbs' ? `<g transform="translate(21,31) scale(-1,1)"><path d="M4 8v-5.5c0-1.5 1.2-2.5 2.5-2.5s2.2 1 2.2 2.5v2.5h4.3c1.5 0 2.5 1.2 2.2 2.7l-1.1 5.5c-.3 1.3-1.4 2.2-2.7 2.2H4z" fill="#ffd166" stroke="${e}" stroke-width="2" stroke-linejoin="round"/></g>` : '');
      case 'clap':
      case 'highfive':
        return `<path d="M11 36c-3-2-3-6 0-8l5 4-5 4zM53 36c3-2 3-6 0-8l-5 4 5 4z" fill="#ffd166" stroke="${e}" stroke-width="1.8"/>` +
          `<path d="M26 11l-2-5M32 9V3M38 11l2-5" stroke="#ffb703" stroke-width="2.4" stroke-linecap="round"/>`;
      case 'ok':
      case 'vsign':
        return `<g transform="translate(44,29)"><circle cx="7" cy="9" r="6" fill="#ffd166" stroke="${e}" stroke-width="2"/>` +
          (prop === 'vsign' ? `<path d="M4 4l2-6M10 4l-2-6" stroke="#ffd166" stroke-width="3.5" stroke-linecap="round"/><path d="M4 4l2-6M10 4l-2-6" stroke="${e}" stroke-width="1.8" stroke-linecap="round"/>` : `<circle cx="7" cy="9" r="2.3" fill="#fff" stroke="${e}" stroke-width="1.6"/>`) + `</g>`;
      case 'heart':
      case 'fingerheart':
      case 'pixelheart':
        return `<path d="M32 16c-3.5-3-6-5.2-6-7.6 0-2.1 1.7-3.7 3.7-3.7 1.2 0 2.3.6 2.3 1.6 0-1 1.1-1.6 2.3-1.6 2 0 3.7 1.6 3.7 3.7 0 2.4-2.5 4.6-6 7.6z" fill="#e63946" stroke="${e}" stroke-width="1.6"/>` +
          `<path d="M51 24c-2-1.7-3.4-3-3.4-4.3 0-1.2 1-2.1 2.1-2.1.7 0 1.3.3 1.3.9 0-.6.6-.9 1.3-.9 1.1 0 2.1.9 2.1 2.1 0 1.3-1.4 2.6-3.4 4.3z" fill="#ff758f"/>`;
      case 'sun':
      case 'suncloud':
        return `<circle cx="49" cy="14" r="6.5" fill="#ffb703" stroke="${e}" stroke-width="1.8"/>` +
          `<path d="M49 4v2.5M49 21.5V24M39 14h2.5M56.5 14H59M42 7l1.8 1.8M54.2 19.2L56 21M56 7l-1.8 1.8M43.8 19.2L42 21" stroke="#fb8500" stroke-width="2" stroke-linecap="round"/>`;
      case 'moon':
      case 'fullmoon':
      case 'zzz':
        return `<path d="M49 9a7.5 7.5 0 1 0 7.5 7.5A6 6 0 0 1 49 9z" fill="#ffd166" stroke="${e}" stroke-width="1.8"/>` +
          `<text x="10" y="18" font-size="10" font-weight="900" fill="${e}" font-family="monospace">Zzz</text>`;
      case 'water':
      case 'tea':
      case 'coffee':
      case 'boba':
      case 'mug':
      case 'soda':
        return `<g transform="translate(42,31)"><rect x="2" y="4" width="13" height="15" rx="3" fill="${prop === 'boba' ? '#f4a261' : prop === 'coffee' ? '#6f4e37' : '#90e0ef'}" stroke="${e}" stroke-width="2"/>` +
          `<path d="M15 7h2.5a2.5 2.5 0 0 1 0 5H15" fill="none" stroke="${e}" stroke-width="2"/>` +
          (prop === 'boba' ? `<line x1="8.5" y1="-2" x2="8.5" y2="16" stroke="${e}" stroke-width="2.4" stroke-linecap="round"/><circle cx="6" cy="15" r="1.4" fill="#1e293b"/><circle cx="10.5" cy="15.5" r="1.4" fill="#1e293b"/>` : `<path d="M6 1q1.5-2 0-4M11 1q1.5-2 0-4" fill="none" stroke="${e}" stroke-width="1.6" stroke-linecap="round"/>`) + `</g>`;
      case 'flame':
      case 'fire':
      case 'torch':
      case 'firewings':
        return `<path d="M49 23c4 0 6.5-3.2 6.5-7 0-4-4.5-8.5-6.5-11-2 2.5-6.5 7-6.5 11 0 3.8 2.5 7 6.5 7z" fill="#fb8500" stroke="${e}" stroke-width="1.8"/>` +
          `<path d="M49 22c2 0 3.5-1.8 3.5-4 0-2.2-2-4.8-3.5-6.2-1.5 1.4-3.5 4-3.5 6.2 0 2.2 1.5 4 3.5 4z" fill="#ffd166"/>`;
      case 'check':
      case 'stampclear':
        return `<circle cx="49" cy="15" r="8" fill="#2f7a5b" stroke="#fff" stroke-width="2"/><path d="M45 15.2l2.8 2.8 5.4-5.6" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`;
      case 'book':
      case 'thickbook':
      case 'notebook':
      case 'papers':
      case 'cards':
        return `<g transform="translate(18,41)"><path d="M0 3c4-2 10-2 14 0 4-2 10-2 14 0v11c-4-2-10-2-14 0-4-2-10-2-14 0V3z" fill="#fff" stroke="${e}" stroke-width="2" stroke-linejoin="round"/><line x1="14" y1="3" x2="14" y2="14" stroke="${e}" stroke-width="2"/></g>`;
      case 'pencil':
      case 'highlighter':
      case 'redpen':
        return `<g transform="translate(43,24) rotate(28)"><rect x="2" y="0" width="5.5" height="18" rx="1" fill="#ffd166" stroke="${e}" stroke-width="1.8"/><polygon points="2,18 7.5,18 4.75,23" fill="#f28482" stroke="${e}" stroke-width="1.6"/></g>`;
      case 'laptop':
        return `<g transform="translate(17,40)"><rect x="3" y="0" width="24" height="13" rx="2" fill="#334155" stroke="${e}" stroke-width="2"/><path d="M0 13h30l-2 3.5H2L0 13z" fill="#94a3b8" stroke="${e}" stroke-width="1.8"/><circle cx="15" cy="6.5" r="2" fill="#38bdf8"/></g>`;
      case 'timer':
      case 'alarm':
      case 'clock':
        return `<g transform="translate(41,8)"><circle cx="9" cy="10" r="8" fill="#fff" stroke="${e}" stroke-width="2.2"/><path d="M9 5.5V10l3.2 2" fill="none" stroke="#e63946" stroke-width="2.2" stroke-linecap="round"/><path d="M3 3l3-2M15 3l-3-2" stroke="${e}" stroke-width="2.2" stroke-linecap="round"/></g>`;
      case 'score100':
        return `<g transform="translate(35,6)"><rect x="0" y="0" width="26" height="15" rx="4" fill="#fff" stroke="#e63946" stroke-width="2"/><text x="13" y="11.5" text-anchor="middle" font-size="10.5" font-weight="900" fill="#e63946" font-family="monospace">100</text></g>`;
      case 'bulb':
        return `<g transform="translate(42,5)"><path d="M8 2a6 6 0 0 0-3.8 10.6c.7.6 1.3 1.6 1.3 2.4h5c0-.8.6-1.8 1.3-2.4A6 6 0 0 0 8 2z" fill="#ffd166" stroke="${e}" stroke-width="1.8"/><rect x="5.8" y="15" width="4.4" height="2.8" rx="1" fill="#94a3b8" stroke="${e}" stroke-width="1.4"/></g>`;
      case 'headphones':
        return `<path d="M13 31v-3a19 19 0 0 1 38 0v3" fill="none" stroke="${e}" stroke-width="3.2"/><rect x="10" y="27" width="6" height="12" rx="3" fill="#e63946" stroke="${e}" stroke-width="2"/><rect x="48" y="27" width="6" height="12" rx="3" fill="#e63946" stroke="${e}" stroke-width="2"/>`;
      case 'crown':
      case 'crownmini':
      case 'crownbath':
        return `<polygon points="21,15 24,6 32,12 40,6 43,15" fill="#ffd166" stroke="${e}" stroke-width="2" stroke-linejoin="round"/><circle cx="32" cy="9" r="1.6" fill="#e63946"/>`;
      case 'trophy':
      case 'medal':
        return `<g transform="translate(41,28)"><path d="M3 2h12v6a6 6 0 0 1-12 0V2z" fill="#ffd166" stroke="${e}" stroke-width="2"/><path d="M9 14v5M5 19h8" stroke="${e}" stroke-width="2.2" stroke-linecap="round"/></g>`;
      case 'diamond':
        return `<polygon points="49,6 56,12 49,22 42,12" fill="#70d6ff" stroke="${e}" stroke-width="1.8"/><polyline points="42,12 56,12" fill="none" stroke="${e}" stroke-width="1.4"/>`;
      case 'onigiri':
        return `<g transform="translate(41,31)"><path d="M9 2L1 16a2 2 0 0 0 1.7 3h12.6a2 2 0 0 0 1.7-3L9 2z" fill="#fff" stroke="${e}" stroke-width="2" stroke-linejoin="round"/><rect x="5.5" y="12" width="7" height="7" fill="#1e293b"/></g>`;
      case 'ramen':
      case 'bowl':
      case 'icebowl':
      case 'oden':
        return `<g transform="translate(39,32)"><path d="M1 7h18a9 9 0 0 1-18 0z" fill="#e63946" stroke="${e}" stroke-width="2"/><path d="M3 7c3-4 11-4 14 0" fill="#ffd166" stroke="${e}" stroke-width="1.6"/></g>`;
      case 'cake':
      case 'bdaycake':
      case 'pudding':
      case 'pancake':
        return `<g transform="translate(40,30)"><rect x="2" y="7" width="15" height="11" rx="2" fill="#fff" stroke="${e}" stroke-width="2"/><path d="M2 11h15" stroke="#ff758f" stroke-width="2.5"/><circle cx="9.5" cy="4.5" r="2.8" fill="#e63946" stroke="${e}" stroke-width="1.5"/></g>`;
      case 'ear_cat':
      case 'ear_fox':
        return `<polygon points="15,17 19,6 27,14" fill="${pal.body}" stroke="${e}" stroke-width="2.2" stroke-linejoin="round"/><polygon points="49,17 45,6 37,14" fill="${pal.body}" stroke="${e}" stroke-width="2.2" stroke-linejoin="round"/>`;
      case 'ear_bunny':
        return `<ellipse cx="23" cy="9" rx="3.8" ry="7.5" fill="${pal.body}" stroke="${e}" stroke-width="2"/><ellipse cx="41" cy="9" rx="3.8" ry="7.5" fill="${pal.body}" stroke="${e}" stroke-width="2"/>`;
      case 'ear_dog':
      case 'ear_bear':
        return `<circle cx="17" cy="13" r="5" fill="${pal.body}" stroke="${e}" stroke-width="2.2"/><circle cx="47" cy="13" r="5" fill="${pal.body}" stroke="${e}" stroke-width="2.2"/>`;
      case 'antlers':
      case 'horn':
        return prop === 'horn'
          ? `<polygon points="29,14 32,3 35,14" fill="#ffd166" stroke="${e}" stroke-width="1.8"/>`
          : `<path d="M21 14l-4-8m2 4l-4-1M43 14l4-8m-2 4l4-1" fill="none" stroke="#8c5808" stroke-width="2.4" stroke-linecap="round"/>`;
      case 'sakura':
      case 'maple':
      case 'ginkgo':
      case 'clover':
      case 'sunflower':
        return `<g transform="translate(43,6)"><circle cx="8" cy="8" r="6.5" fill="${prop === 'clover' ? '#52b788' : prop === 'maple' ? '#e63946' : prop === 'ginkgo' || prop === 'sunflower' ? '#ffb703' : '#ff8fab'}" stroke="${e}" stroke-width="1.8"/><circle cx="8" cy="8" r="2.2" fill="#fff"/></g>`;
      case 'snowflake':
      case 'icebreak':
        return `<g transform="translate(42,5)" stroke="#38bdf8" stroke-width="2.2" stroke-linecap="round"><line x1="8" y1="1" x2="8" y2="15"/><line x1="1" y1="8" x2="15" y2="8"/><line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/></g>`;
      case 'rainbow':
      case 'aurora':
        return `<path d="M12 20a20 16 0 0 1 40 0" fill="none" stroke="#ff758f" stroke-width="3" stroke-linecap="round" opacity=".8"/><path d="M15 20a17 13 0 0 1 34 0" fill="none" stroke="#ffd166" stroke-width="2.6" stroke-linecap="round" opacity=".8"/><path d="M18 20a14 10 0 0 1 28 0" fill="none" stroke="#4cc9f0" stroke-width="2.4" stroke-linecap="round" opacity=".8"/>`;
      case 'rocket':
      case 'rocketmini':
        return `<g transform="translate(42,6) rotate(25)"><path d="M7 0c4 4 4 11 4 15H3C3 11 3 4 7 0z" fill="#fff" stroke="${e}" stroke-width="1.8"/><polygon points="3,12 0,16 3,15" fill="#e63946"/><polygon points="11,12 14,16 11,15" fill="#e63946"/><circle cx="7" cy="8" r="2" fill="#38bdf8"/></g>`;
      case 'flags':
      case 'wave':
      case 'salute':
      case 'handup':
      case 'pointup':
      case 'fist':
        return `<g transform="translate(45,18)"><circle cx="5" cy="12" r="4.5" fill="${pal.body}" stroke="${e}" stroke-width="2"/>` +
          (prop === 'flags' ? `<line x1="5" y1="12" x2="5" y2="-4" stroke="${e}" stroke-width="2"/><polygon points="5,-4 16,0 5,4" fill="#e63946" stroke="${e}" stroke-width="1.4"/>` : `<path d="M3 4l4-4M8 6l4-2" stroke="${a}" stroke-width="2" stroke-linecap="round"/>`) + `</g>`;
      default:
        return `<path d="M32 14V8c0-3 3.5-5 6-3.5 1 2.5-1.5 5-6 3.5zm0-4c0-3-3.5-5-6-3.5-1 2.5 1.5 5 6 3.5z" fill="#52b788" stroke="${e}" stroke-width="1.7" stroke-linejoin="round"/>` +
          `<circle cx="12" cy="15" r="2" fill="${a}"/><circle cx="52" cy="18" r="1.6" fill="${a}"/>`;
    }
  }

  /* ---------- 每張貼圖自己的動作：道具照它的意思動（揮手、眼淚往下滴、蒸氣往上飄、雪花飄落…），
     身體依表情做小動作（大笑抖、睡覺慢慢呼吸、生氣發抖…），不再全部原地彈跳 ---------- */
  const PROP_MOTION = {};
  const motionOf = (list, m) => list.split(' ').forEach(p => { PROP_MOTION[p] = m; });
  motionOf('wave nowave handup pointup salute flags torch bow shrug poke', 'wave');
  motionOf('thumb twothumbs fist ok vsign score100 check pinky stampclear', 'pump');
  motionOf('clap highfive pat', 'clap');
  motionOf('heart fingerheart pixelheart hug openarms duo', 'beat');
  motionOf('tears sweatdrop', 'drip');
  motionOf('snowflake sakura maple ginkgo leaf confetti applefall meteor', 'fall');
  motionOf('steam zzz notes bubbles bubble sigh huff wind', 'rise');
  motionOf('ghost balloon rocketmini rocket senddoc', 'lift');
  motionOf('sparkles stars diamond crownmini crown galaxy aurora bulb fullmoon moon trophy medal seal laurel', 'twinkle');
  motionOf('swirl spiralgold windmill clock timer compass sun infinity saturn coin target', 'spin');
  motionOf('flame fire firewings angervein', 'flicker');
  motionOf('excl alarm bell lightning phoneoff icebreak qmark', 'shake');
  motionOf('sprout trees cactus sunflower clover branch bamboo scarf tentacles wavecrest greatwave wavebg sail seed suncloud rainbow umbrella', 'sway');
  motionOf('wings_bee wings_bfly wings_bird', 'flap');
  motionOf('ear_dog ear_cat ear_bunny ear_fox ear_bear horn antlers paws pawmouth', 'twitch');
  motionOf('book thickbook pencil redpen highlighter notebook papers cards math laptop magnify telescope glasses headphones', 'study');
  const FACE_MOOD = {
    laugh: 'giggle', happy: 'hop', starry: 'hop', proud: 'hop', determ: 'hop', st_cheer: 'hop',
    sleep: 'breathe', yawn: 'breathe', zen: 'float', relief: 'float', gentle: 'float',
    sob: 'tremble', touched: 'tremble', shock: 'jolt', scream: 'jolt', quake: 'tremble',
    angry: 'tremble', rage: 'tremble', pout: 'tilt', dizzy: 'wobble', spiral: 'wobble',
    love: 'sway', blush: 'sway', shy: 'sway', curious: 'tilt', doubt: 'tilt', think: 'tilt', peek: 'tilt'
  };
  const propMotion = prop => PROP_MOTION[prop] || 'bob';
  const faceMood = face => FACE_MOOD[face] || 'breathe';
  const propG = (prop, pal) => `<g class="stk-prop stk-m-${propMotion(prop)}">${drawProp(prop, pal)}</g>`;

  function svgOf(stkOrId, opts = {}) {
    const stk = typeof stkOrId === 'string' ? (BY_ID.get(stkOrId) || BY_NAME.get(stkOrId) || STICKERS[0]) : (stkOrId || STICKERS[0]);
    const size = opts.size || 60;
    const frozen = !!opts.frozen;
    const locked = !!opts.locked;
    const pal = stk.pal;
    const animCls = opts.noAnim || frozen || locked ? '' : (' stk-anim stk-mood-' + faceMood(stk.face));

    const iceOverlay = frozen ? (
      `<rect x="3" y="3" width="58" height="58" rx="15" fill="rgba(165, 232, 255, 0.58)" stroke="#38bdf8" stroke-width="2.2"/>` +
      `<path d="M8 14L22 8M10 24L28 12M44 54L56 42" stroke="rgba(255,255,255,0.85)" stroke-width="2.5" stroke-linecap="round"/>` +
      `<g transform="translate(48,14)" stroke="#0284c7" stroke-width="1.8" stroke-linecap="round"><line x1="-5" y1="0" x2="5" y2="0"/><line x1="0" y1="-5" x2="0" y2="5"/><line x1="-3.5" y1="-3.5" x2="3.5" y2="3.5"/><line x1="3.5" y1="-3.5" x2="-3.5" y2="3.5"/></g>`
    ) : '';

    return `<svg class="pace-stk-svg${animCls}${frozen ? ' is-frozen' : ''}${locked ? ' is-locked' : ''}" viewBox="0 0 64 64" width="${size}" height="${size}" role="img" aria-label="${esc(stk.name)}">` +
      `<rect x="4" y="4" width="56" height="56" rx="16" fill="${pal.bg}" stroke="${pal.edge}" stroke-width="1.6" stroke-opacity=".28"/>` +
      `<g class="stk-actor">` +
        `<ellipse cx="32" cy="49" rx="15" ry="3.5" fill="rgba(0,0,0,.1)"/>` +
        `<rect x="13" y="14" width="38" height="33" rx="13" fill="${pal.body}" stroke="${pal.edge}" stroke-width="2.4"/>` +
        `<path d="M18 19c3-2 8-2.5 14-2.5" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="2.4" stroke-linecap="round"/>` +
        `<circle cx="13" cy="34" r="3.6" fill="${pal.body}" stroke="${pal.edge}" stroke-width="2"/>` +
        `<circle cx="51" cy="34" r="3.6" fill="${pal.body}" stroke="${pal.edge}" stroke-width="2"/>` +
        drawFace(stk.face, pal.edge, pal.cheek) +
        propG(stk.prop, pal) +
      `</g>` +
      `<g transform="translate(32,54)">` +
        `<rect x="-18" y="-6.5" width="36" height="11" rx="5.5" fill="${pal.edge}"/>` +
        `<text x="0" y="1.8" text-anchor="middle" font-size="7.8" font-weight="800" fill="#fff" letter-spacing=".04em">${esc(stk.tag || stk.name.slice(0, 3))}</text>` +
      `</g>` +
      iceOverlay +
    `</svg>`;
  }

  /* ---------- 🧪 森靈調合工坊：合理性檢查與基因圖層合成引擎 ----------
     1. 合理性檢查 (checkMergeHarmony)：
        - 2 張貼圖相同 -> 不可合併
        - 合理配方 (Harmonious / Logical)：
          a) 主體角色類 (`starter`, `emotion`, `critter`) 搭配 情境／動作／物件類 (`gesture`, `study`, `life`, `food`, `nature`, `wonder`, `honor`)
          b) 基本與情緒互搭 (`starter` + `emotion`)
          c) 讀書與美食／作息互搭 (`study` + `food` / `life`)
          d) 自然與靈獸／奇蹟互搭 (`nature` + `critter` / `wonder`)
          - 但若將兩張重度衝突貼圖配對（例如：`火山爆發` + `六出雪晶/極地雪屋`，或兩張同為純風景建築 `wonder + wonder`、兩張同為純食物 `food + food`），
            在 Lv 6–9 視為「跨界任意配方」，需升至 Lv 10 才可解鎖「萬物自由合併」！ */
  const CONFLICT_PAIRS = new Set([
    'em_volcano+na_snow', 'em_volcano+wn_igloo', 'em_volcano+fd_shavedice',
    'lf_quilt+lf_jog', 'lf_nap+ge_sprint', 'sd_library+em_volcano'
  ]);

  function checkMergeHarmony(list) {
    if (!Array.isArray(list) || list.length < 2 || list.length > 3) {
      return { valid: false, harmonious: false, reason: '請選擇 2 到 3 張貼圖進行調合。' };
    }
    const ids = list.map(s => s.id);
    if (new Set(ids).size !== ids.length) {
      return { valid: false, harmonious: false, reason: '請選擇不同的貼圖來進行調合喔！' };
    }
    // 檢查特定冰火衝突配對
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const k1 = list[i].id + '+' + list[j].id, k2 = list[j].id + '+' + list[i].id;
        if (CONFLICT_PAIRS.has(k1) || CONFLICT_PAIRS.has(k2)) {
          return {
            valid: true,
            harmonious: false,
            reason: `「${list[i].name}」與「${list[j].name}」屬於冰火／動靜衝突的反差組合，需達 Lv 10 解鎖【萬物任意合併】才能融合！`
          };
        }
      }
    }
    const cats = list.map(s => s.cat);
    const hasActor = cats.some(c => c === 'starter' || c === 'emotion' || c === 'critter' || c === 'gesture');
    const allSameObjectCat = cats.every(c => c === cats[0]) && ['food', 'wonder', 'nature', 'honor'].includes(cats[0]);
    if (!hasActor || allSameObjectCat) {
      return {
        valid: true,
        harmonious: false,
        reason: `「${list.map(x => x.name).join('＋')}」屬於跨界奇想組合（非「表情角色＋情境道具」合理配方），需達 Lv 10 解鎖【萬物任意合併】！`
      };
    }
    return {
      valid: true,
      harmonious: true,
      reason: `✨ 合理配方！「${list[0].name}」的神態與「${list.slice(1).map(x => x.name).join('＋')}」完美共鳴！`
    };
  }

  /* 基因圖層合成 SVG 渲染器 (svgOfCombo)：
     將 2 張或 3 張貼圖的基因融合為一隻獨一無二的「合成方塊森靈」：
     - 基底與臉部表情：優先取含情緒／角色基因者，結合第 2 張的配色漸層與臉部神態
     - 左側與頭頂特徵：融合第 1 張的道具／靈獸耳朵
     - 右側與前景特徵：融合第 2 張的道具
     - 若為 3 張多重調合（三合一）：再加上第 3 張的璀璨星環光圈、雙色漸層身體與第 3 道具！ */
  function svgOfCombo(stickers, opts = {}) {
    const list = stickers.map(s => typeof s === 'string' ? (BY_ID.get(s) || BY_NAME.get(s)) : s).filter(Boolean);
    if (!list.length) return svgOf(STICKERS[0], opts);
    if (list.length === 1) return svgOf(list[0], opts);

    const s1 = list[0], s2 = list[1], s3 = list[2] || null;
    const size = opts.size || 68;
    const noAnim = !!opts.noAnim;
    const gradId = 'stkG_' + list.map(s => s.id).join('_');
    // 決定最終五官：若 s1 是基本微笑但 s2 有強烈表情（如大哭、墨鏡、星星眼、愛心），優先展現戲劇化五官
    const facePick = (s1.face === 'smile' && s2.face !== 'smile') ? s2.face : s1.face;
    const animCls = (noAnim ? '' : ' stk-anim stk-mood-' + faceMood(facePick)) + (s3 ? ' stk-combo-3' : ' stk-combo-2');
    const earSticker = list.find(s => /^ear_|^antlers$|^horn$/.test(s.prop));
    const prop1 = s1.prop;
    const prop2 = s2.prop !== prop1 ? s2.prop : (s3 ? s3.prop : 'sparkles');
    const prop3 = s3 ? s3.prop : null;
    const comboName = list.map(s => s.name).join('＋');
    const comboTag = list.map(s => (s.tag || s.name).slice(0, 2)).join('·').slice(0, 6);

    return `<svg class="pace-stk-svg is-combo${animCls}" viewBox="0 0 64 64" width="${size}" height="${size}" role="img" aria-label="合成貼圖：${esc(comboName)}">` +
      `<defs>` +
        `<linearGradient id="${gradId}_bg" x1="0" y1="0" x2="1" y2="1">` +
          `<stop offset="0%" stop-color="${s1.pal.bg}"/>` +
          `<stop offset="${s3 ? '50%' : '100%'}" stop-color="${s2.pal.bg}"/>` +
          (s3 ? `<stop offset="100%" stop-color="${s3.pal.bg}"/>` : '') +
        `</linearGradient>` +
        `<linearGradient id="${gradId}_body" x1="0" y1="0" x2="1" y2="1">` +
          `<stop offset="0%" stop-color="${s1.pal.body}"/>` +
          `<stop offset="100%" stop-color="${(s3 || s2).pal.body}"/>` +
        `</linearGradient>` +
      `</defs>` +
      // 1. 漸層和紙雙重印章底襯
      `<rect x="3" y="3" width="58" height="58" rx="16" fill="url(#${gradId}_bg)" stroke="${s1.pal.edge}" stroke-width="1.8" stroke-opacity=".4"/>` +
      // 三合一專屬傳奇星芒光環
      (s3 ? `<circle cx="32" cy="30" r="24" fill="none" stroke="${s3.pal.acc}" stroke-width="1.6" stroke-dasharray="3 3" opacity=".85"/>` : `<circle cx="32" cy="30" r="22" fill="none" stroke="${s2.pal.acc}" stroke-width="1.2" opacity=".45"/>`) +
      `<g class="stk-actor">` +
        `<ellipse cx="32" cy="49" rx="16" ry="3.8" fill="rgba(0,0,0,.12)"/>` +
        // 若有靈獸耳朵基因，先繪製於頭頂
        (earSticker ? propG(earSticker.prop, earSticker.pal) : '') +
        // 雙色漸層方塊森靈本體
        `<rect x="13" y="14" width="38" height="33" rx="13" fill="url(#${gradId}_body)" stroke="${s1.pal.edge}" stroke-width="2.4"/>` +
        `<path d="M18 19c3-2 8-2.5 14-2.5" fill="none" stroke="rgba(255,255,255,.65)" stroke-width="2.4" stroke-linecap="round"/>` +
        `<circle cx="13" cy="34" r="3.6" fill="${s1.pal.body}" stroke="${s1.pal.edge}" stroke-width="2"/>` +
        `<circle cx="51" cy="34" r="3.6" fill="${s2.pal.body}" stroke="${s1.pal.edge}" stroke-width="2"/>` +
        // 融合五官
        drawFace(facePick, s1.pal.edge, s2.pal.cheek) +
        // 左側縮放道具 (來自第 1 張貼圖)
        `<g transform="translate(-24, 4) scale(0.78)">${propG(prop1, s1.pal)}</g>` +
        // 右側主道具 (來自第 2 張貼圖)
        `<g transform="translate(4, 1) scale(0.92)">${propG(prop2, s2.pal)}</g>` +
        // 若為三合一，頭頂正中央疊加第 3 張貼圖的精粹道具
        (prop3 ? `<g transform="translate(-5, -10) scale(0.68)">${propG(prop3, s3.pal)}</g>` : '') +
      `</g>` +
      // 底部合成雙色印記籤
      `<g transform="translate(32,54.5)">` +
        `<rect x="-23" y="-6.5" width="46" height="11" rx="5.5" fill="${s1.pal.edge}" stroke="${s2.pal.acc}" stroke-width="1"/>` +
        `<text x="0" y="1.8" text-anchor="middle" font-size="7.2" font-weight="800" fill="#fff" letter-spacing=".02em">${esc(comboTag)}</text>` +
      `</g>` +
    `</svg>`;
  }

  /* ---------- 解鎖、久不動結凍與【等級權限】計算引擎 ----------
     與 c-rewards.js 完全一致的 XP 與等級公式：need(lv) = 25 * lv * (lv + 1) */
  let simMode = 'real'; // 'real' | 'idle2' | 'idle4' | 'idle6' | 'lv3' | 'lv6' | 'lv10' | 'lv18'
  const needXp = lv => 25 * lv * (lv + 1);
  const levelFromXp = xp => { let lv = 1; while (xp >= needXp(lv)) lv++; return lv; };

  function computePerks(lv) {
    return {
      level: lv,
      singleAnim: lv >= 3,          // Lv 3+ 單張貼圖全面升級動態
      chooseMotion: lv >= 5,        // Lv 5+ 可自由選擇「動態」或「靜態（不動）」
      merge2Logical: lv >= 6,       // Lv 6+ 可使用「合理雙貼圖合併」
      merge2LogicalAnim: lv >= 8,   // Lv 8+ 合理雙貼圖合併擁有動態效果
      merge2Any: lv >= 10,          // Lv 10+ 可使用「萬物任意雙貼圖合併」
      merge2AnyAnim: lv >= 12,      // Lv 12+ 任意雙貼圖合併擁有動態效果
      merge3: lv >= 15,             // Lv 15+ 可使用「三貼圖多重調合（三合一）」
      merge3Anim: lv >= 18          // Lv 18+ 三貼圖多重調合擁有傳奇動態效果
    };
  }

  function scanProgress(real) {   // real = true ignores the preview mode (used for what can actually be sent, and for chat)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMs = +today;
    let totalDone = 0;
    let totalXp = 0;
    let latestDoneMs = 0;
    const seenKeys = new Set();
    const kDay = {};

    const recordDone = (key, dateStr, minutes) => {
      if (seenKeys.has(key)) return;
      seenKeys.add(key);
      totalDone++;
      const dKey = dateStr || 'task';
      const k = kDay[dKey] = (kDay[dKey] || 0) + 1;
      const gain = 10 + Math.floor((Number(minutes) || 25) / 10) * 2 + Math.min(10, (k - 1) * 2);
      totalXp += gain;
      if (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        const ms = +new Date(dateStr + 'T00:00:00');
        if (!isNaN(ms) && ms <= todayMs + 864e5 && ms > latestDoneMs) latestDoneMs = ms;
      }
    };

    if (window.paceStore && typeof window.paceStore.paths === 'function') {
      try {
        for (const p of window.paceStore.paths()) {
          const item = window.paceStore.read(p);
          const d = item?.d;
          if (!d) continue;
          if (p.startsWith('weeks/') && Array.isArray(d.blocks)) {
            const monStr = p.slice(6);
            const mon = new Date(monStr + 'T00:00:00');
            for (const b of d.blocks) {
              if (b && b.done && !b.tour && b.cat !== 'buffer') {
                const bDate = new Date(mon);
                if (Number.isInteger(b.day)) bDate.setDate(bDate.getDate() + b.day);
                const ymd = bDate.getFullYear() + '-' + String(bDate.getMonth() + 1).padStart(2, '0') + '-' + String(bDate.getDate()).padStart(2, '0');
                recordDone('b-' + monStr + '-' + b.id, ymd, b.minutes);
              }
            }
          } else if (/^tasks\/[^/]+$/.test(p) && d.done && !d.tour) {
            const tMs = Number(item.t) || 0;
            if (tMs > latestDoneMs) latestDoneMs = tMs;
            recordDone('t-' + p.slice(6), null, d.minutes);
          }
        }
      } catch (e) {}
    }

    if (typeof state !== 'undefined' && state?.week?.blocks && state?.monday) {
      try {
        const mon = new Date(state.monday);
        const monStr = mon.getFullYear() + '-' + String(mon.getMonth() + 1).padStart(2, '0') + '-' + String(mon.getDate()).padStart(2, '0');
        for (const b of state.week.blocks) {
          if (b && b.done && !b.tour && b.cat !== 'buffer') {
            const bDate = new Date(mon);
            if (Number.isInteger(b.day)) bDate.setDate(bDate.getDate() + b.day);
            const ymd = bDate.getFullYear() + '-' + String(bDate.getMonth() + 1).padStart(2, '0') + '-' + String(bDate.getDate()).padStart(2, '0');
            recordDone('b-' + monStr + '-' + b.id, ymd, b.minutes);
          }
        }
      } catch (e) {}
    }

    // 亦可讀取 #xpLevel 畫面上的等級（若 c-rewards.js 已加計成就與週任務 XP）
    let domLv = 1;
    try {
      const lvTxt = document.getElementById('xpLevel')?.textContent || document.querySelector('#xpBtn .xp-lv')?.textContent || '';
      const m = /Lv\s*(\d+)/i.exec(lvTxt);
      if (m) domLv = Number(m[1]) || 1;
    } catch (e) {}

    let level = Math.max(domLv, levelFromXp(totalXp));
    const savedLast = Number(ls.get('pace-stk-last-done')) || 0;
    if (savedLast > latestDoneMs) latestDoneMs = savedLast;

    let idleDays = 0;
    if (totalDone > 0 && latestDoneMs > 0) {
      const lastDay = new Date(latestDoneMs);
      lastDay.setHours(0, 0, 0, 0);
      idleDays = Math.max(0, Math.floor((todayMs - +lastDay) / 864e5));
    }

    // 體感預覽模擬器覆寫
    if (real) { /* actual progress only */ }
    else if (simMode === 'idle2') { totalDone = Math.max(totalDone, 35); idleDays = 4; level = Math.max(level, 6); }
    else if (simMode === 'idle4') { totalDone = Math.max(totalDone, 35); idleDays = 7; level = Math.max(level, 6); }
    else if (simMode === 'idle6') { totalDone = Math.max(totalDone, 35); idleDays = 10; level = Math.max(level, 6); }
    else if (simMode === 'lv3')   { totalDone = Math.max(totalDone, 12); idleDays = 0; level = 3; }
    else if (simMode === 'lv6')   { totalDone = Math.max(totalDone, 28); idleDays = 0; level = 6; }
    else if (simMode === 'lv10')  { totalDone = Math.max(totalDone, 48); idleDays = 0; level = 10; }
    else if (simMode === 'lv18')  { totalDone = Math.max(totalDone, 80); idleDays = 0; level = 18; }

    const perks = computePerks(level);
    // gentle freezing (the user's choice): nothing for 3 idle days, then 25/50/75%, all only after 10 days
    const freezeRatio = idleDays <= 3 ? 0 : idleDays <= 5 ? 0.25 : idleDays <= 7 ? 0.50 : idleDays <= 9 ? 0.75 : 1.0;

    const unlockedNonStarter = STICKERS.filter(s => !s.neverFreeze && totalDone >= s.reqDone)
      .sort((a, b) => b.tier - a.tier || b.index - a.index);
    const freezeCount = Math.round(unlockedNonStarter.length * freezeRatio);
    const frozenIds = new Set(unlockedNonStarter.slice(0, freezeCount).map(s => s.id));

    let usableCount = 0, unlockedCount = 0, lockedCount = 0;
    const itemState = new Map();
    for (const s of STICKERS) {
      const unlocked = s.neverFreeze || totalDone >= s.reqDone;
      const frozen = unlocked && !s.neverFreeze && frozenIds.has(s.id);
      const usable = unlocked && !frozen;
      if (unlocked) unlockedCount++; else lockedCount++;
      if (usable) usableCount++;
      itemState.set(s.id, { unlocked, frozen, usable, needMore: Math.max(0, s.reqDone - totalDone) });
    }

    return {
      totalDone,
      level,
      perks,
      idleDays,
      freezeRatio,
      total: STICKERS.length,
      unlockedCount,
      usableCount,
      frozenCount: frozenIds.size,
      lockedCount,
      itemState
    };
  }

  /* 判斷一組貼圖（1～3張）在指定等級與動靜偏好下是否應該播放動畫 */
  function shouldAnimateToken(stickers, modeFlag, prog) {
    const p = (prog || scanProgress()).perks;
    if (modeFlag === '靜' && p.chooseMotion) return false;
    if (stickers.length === 1) {
      if (!p.singleAnim) return false;
      return true;
    }
    if (stickers.length === 2) {
      const hm = checkMergeHarmony(stickers);
      return hm.harmonious ? p.merge2LogicalAnim : p.merge2AnyAnim;
    }
    return p.merge3Anim;
  }

  function markActiveNow() {
    const before = scanProgress();
    const wasFrozen = before.frozenCount;
    ls.set('pace-stk-last-done', String(Date.now()));
    if (simMode.startsWith('idle')) simMode = 'real';
    if (wasFrozen > 0 && typeof window.toast === 'function') {
      setTimeout(() => {
        try { window.toast('🔥 破冰成功！你完成了方塊，結凍的 ' + wasFrozen + ' 款貼圖已全數回溫解凍！'); } catch (e) {}
      }, 600);
    }
    refreshPickers();
  }

  /* ---------- 聊天室訊息中的貼圖＆合成貼圖語法解析與渲染 ----------
     支援格式：
     1. 單張貼圖：[貼圖:笑]、[貼圖:笑!靜]、[貼圖:笑!動]
     2. 雙貼圖調合：[貼圖:大哭一場+黑糖珍奶]、[貼圖:笑+讚!靜]
     3. 三貼圖調合：[貼圖:笑+黑糖珍奶+璀璨王冠!動]
     安全性：所有非貼圖文字皆經過 esc()，且絕不使用 <b> 標籤（確保 group-tests.cjs 100% 通過） */
  const TOKEN_RE = /\[貼圖:([^\][\n]{1,42})\]/g;

  function parseTokenSpec(spec) {
    const [namesPart, modeFlag] = String(spec || '').split('!');
    const parts = namesPart.split('+').map(s => s.trim()).filter(Boolean);
    if (!parts.length || parts.length > 3) return null;
    const stks = parts.map(n => BY_NAME.get(n) || BY_ID.get(n));
    if (stks.some(s => !s)) return null;
    if (stks.length >= 2 && new Set(stks.map(s => s.id)).size !== stks.length) return null;
    return { stks, modeFlag: modeFlag === '靜' ? '靜' : modeFlag === '動' ? '動' : '' };
  }

  function renderTokenSvg(parsed, size, prog) {
    const anim = shouldAnimateToken(parsed.stks, parsed.modeFlag, prog);
    if (parsed.stks.length === 1) {
      return svgOf(parsed.stks[0], { size, noAnim: !anim });
    }
    return svgOfCombo(parsed.stks, { size, noAnim: !anim });
  }

  let chatProg = null;
  function renderChatMessage(rawText) {
    const str = String(rawText ?? '');
    if (!str.includes('[貼圖:')) return esc(str);

    // chat shows stickers by actual progress (never the album preview), read once per batch of messages
    if (!chatProg) { chatProg = scanProgress(true); setTimeout(() => { chatProg = null; }, 0); }
    const prog = chatProg;
    const stripped = str.replace(TOKEN_RE, '').trim();
    const matches = [...str.matchAll(TOKEN_RE)];
    const parsedList = matches.map(m => ({ m, parsed: parseTokenSpec(m[1]) }));
    const validAll = parsedList.every(x => x.parsed !== null);

    if (!stripped && validAll && parsedList.length >= 1 && parsedList.length <= 3) {
      return '<div class="grp-stk-jumbo-row">' + parsedList.map(({ parsed }) => {
        const label = parsed.stks.map(s => s.name).join('＋');
        const isCombo = parsed.stks.length > 1;
        return `<span class="grp-stk-jumbo${isCombo ? ' is-combo' : ''}" title="${isCombo ? '合成貼圖：' : '貼圖：'}${esc(label)}">${renderTokenSvg(parsed, isCombo ? 80 : 74, prog)}<span class="grp-stk-cap">${esc(label)}</span></span>`;
      }).join('') + '</div>';
    }

    let out = '', lastIdx = 0;
    for (const { m, parsed } of parsedList) {
      const idx = m.index;
      if (idx > lastIdx) out += esc(str.slice(lastIdx, idx));
      if (parsed) {
        const label = parsed.stks.map(s => s.name).join('＋');
        out += `<span class="grp-stk-inline" title="貼圖：${esc(label)}">${renderTokenSvg(parsed, 30, prog)}</span>`;
      } else {
        out += esc(m[0]);
      }
      lastIdx = idx + m[0].length;
    }
    if (lastIdx < str.length) out += esc(str.slice(lastIdx));
    return out;
  }

  /* ---------- 注入貼圖系統與森靈調合工坊樣式 ---------- */
  const style = document.createElement('style');
  style.setAttribute('data-pace-ui', 'c-stickers.css');
  style.textContent = `
    .pace-stk-svg { display: inline-block; vertical-align: middle; overflow: visible; user-select: none; -webkit-user-select: none; }
    .pace-stk-svg .stk-actor { transform-origin: 32px 34px; }
    .pace-stk-svg.stk-combo-3 { filter: drop-shadow(0 3px 8px rgba(244, 185, 66, .35)); }
    /* 道具照意思動：揮手、比讚、拍手、心跳、滴落、飄落、上飄、閃爍、旋轉、火焰、發抖、搖曳、拍翅、抖耳、寫字、輕晃 */
    .pace-stk-svg .stk-prop { transform-box: fill-box; transform-origin: 50% 50%; }
    .stk-anim .stk-m-wave { transform-origin: 50% 100%; animation: pkWave 1.1s ease-in-out infinite alternate; }
    .stk-anim .stk-m-pump { animation: pkPump 1.4s cubic-bezier(.3,1.6,.5,1) infinite; }
    .stk-anim .stk-m-clap { animation: pkClap .7s ease-in-out infinite; }
    .stk-anim .stk-m-beat { animation: pkBeat 1.3s ease-in-out infinite; }
    .stk-anim .stk-m-drip { animation: pkDrip 1.6s ease-in infinite; }
    .stk-anim .stk-m-fall { animation: pkFall 2.8s linear infinite; }
    .stk-anim .stk-m-rise { animation: pkRise 2.4s ease-out infinite; }
    .stk-anim .stk-m-twinkle { animation: pkTwinkle 1.5s ease-in-out infinite alternate; }
    .stk-anim .stk-m-spin { animation: pkSpin 6s linear infinite; }
    .stk-anim .stk-m-flicker { transform-origin: 50% 100%; animation: pkFlicker .45s ease-in-out infinite alternate; }
    .stk-anim .stk-m-shake { animation: pkShake 2.2s linear infinite; }
    .stk-anim .stk-m-sway { transform-origin: 50% 100%; animation: pkSway 3s ease-in-out infinite alternate; }
    .stk-anim .stk-m-flap { animation: pkFlap .35s ease-in-out infinite alternate; }
    .stk-anim .stk-m-twitch { transform-origin: 50% 100%; animation: pkTwitch 2.6s ease-in-out infinite; }
    .stk-anim .stk-m-study { transform-origin: 30% 80%; animation: pkStudy 1.6s ease-in-out infinite; }
    .stk-anim .stk-m-bob { animation: pkBob 2.6s ease-in-out infinite alternate; }
    .stk-anim .stk-m-lift { animation: pkLift 1.8s ease-in-out infinite alternate; }
    @keyframes pkLift { from { transform: translateY(1px); } to { transform: translateY(-4px); } }
    @keyframes pkWave { from { transform: rotate(-16deg); } to { transform: rotate(16deg); } }
    @keyframes pkPump { 0%, 55%, 100% { transform: none; } 20% { transform: translateY(-3px) scale(1.1); } }
    @keyframes pkClap { 0%, 100% { transform: scaleX(1); } 50% { transform: scaleX(.72); } }
    @keyframes pkBeat { 0%, 40%, 100% { transform: scale(1); } 12% { transform: scale(1.18); } 26% { transform: scale(1.08); } }
    @keyframes pkDrip { 0% { transform: translateY(-1px); opacity: 0; } 15% { opacity: 1; } 100% { transform: translateY(6px); opacity: 0; } }
    @keyframes pkFall { 0% { transform: translateY(-4px) rotate(0); opacity: 0; } 15% { opacity: 1; } 85% { opacity: 1; } 100% { transform: translateY(7px) rotate(50deg); opacity: 0; } }
    @keyframes pkRise { 0% { transform: translateY(3px); opacity: 0; } 25% { opacity: 1; } 100% { transform: translateY(-6px); opacity: 0; } }
    @keyframes pkTwinkle { from { transform: scale(.86); opacity: .55; } to { transform: scale(1.12); opacity: 1; } }
    @keyframes pkSpin { to { transform: rotate(360deg); } }
    @keyframes pkFlicker { from { transform: scaleY(.92) skewX(3deg); } to { transform: scaleY(1.12) skewX(-4deg); } }
    @keyframes pkShake { 0%, 70%, 100% { transform: none; } 74%, 82%, 90% { transform: translateX(-1.5px) rotate(-6deg); } 78%, 86%, 94% { transform: translateX(1.5px) rotate(6deg); } }
    @keyframes pkSway { from { transform: rotate(-7deg); } to { transform: rotate(7deg); } }
    @keyframes pkFlap { from { transform: scaleX(1); } to { transform: scaleX(.68); } }
    @keyframes pkTwitch { 0%, 80%, 100% { transform: none; } 85% { transform: rotate(-10deg); } 90% { transform: rotate(6deg); } }
    @keyframes pkStudy { 0%, 100% { transform: none; } 30% { transform: translate(1px, -1px) rotate(-7deg); } 60% { transform: translate(-1px, 0) rotate(3deg); } }
    @keyframes pkBob { from { transform: translateY(0); } to { transform: translateY(-2px); } }
    /* 身體依表情做小動作 */
    .stk-anim.stk-mood-breathe .stk-actor { transform-origin: 32px 48px; animation: pkBreathe 3.2s ease-in-out infinite alternate; }
    .stk-anim.stk-mood-giggle .stk-actor { animation: pkGiggle 1.6s ease-in-out infinite; }
    .stk-anim.stk-mood-hop .stk-actor { animation: pkHop 2s cubic-bezier(.3,1.5,.5,1) infinite; }
    .stk-anim.stk-mood-float .stk-actor { animation: pkFloat 3.4s ease-in-out infinite alternate; }
    .stk-anim.stk-mood-tremble .stk-actor { animation: pkTremble .28s linear infinite; }
    .stk-anim.stk-mood-jolt .stk-actor { animation: pkJolt 2.2s ease-out infinite; }
    .stk-anim.stk-mood-tilt .stk-actor { animation: pkTilt 3s ease-in-out infinite; }
    .stk-anim.stk-mood-wobble .stk-actor { animation: pkWobble 2s ease-in-out infinite; }
    .stk-anim.stk-mood-sway .stk-actor { transform-origin: 32px 48px; animation: pkSwayBody 3s ease-in-out infinite alternate; }
    @keyframes pkBreathe { from { transform: scale(1, 1); } to { transform: scale(1.015, 1.035); } }
    @keyframes pkGiggle { 0%, 50%, 100% { transform: none; } 10%, 30% { transform: rotate(-3deg); } 20%, 40% { transform: rotate(3deg); } }
    @keyframes pkHop { 0%, 40%, 100% { transform: none; } 18% { transform: translateY(-4px); } }
    @keyframes pkFloat { from { transform: translateY(0); } to { transform: translateY(-2.5px); } }
    @keyframes pkTremble { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-.7px); } 75% { transform: translateX(.7px); } }
    @keyframes pkJolt { 0%, 30%, 100% { transform: none; } 6% { transform: scale(1.07) translateY(-2px); } }
    @keyframes pkTilt { 0%, 100% { transform: none; } 30%, 70% { transform: rotate(-6deg); } }
    @keyframes pkWobble { 0%, 100% { transform: rotate(0); } 25% { transform: rotate(-7deg); } 75% { transform: rotate(7deg); } }
    @keyframes pkSwayBody { from { transform: rotate(-3.5deg); } to { transform: rotate(3.5deg); } }
    @media (prefers-reduced-motion: reduce) { .pace-stk-svg .stk-actor, .pace-stk-svg .stk-prop { animation: none !important; } }
    body.nofx .pace-stk-svg .stk-actor, body.nofx .pace-stk-svg .stk-prop { animation: none !important; }

    .grp-stk-jumbo-row { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; padding: 4px 2px; }
    .grp-stk-jumbo { display: inline-flex; flex-direction: column; align-items: center; gap: 2px; transition: transform .2s ease; }
    .grp-stk-jumbo:hover { transform: scale(1.08); }
    .grp-stk-cap { font-size: .7rem; color: var(--muted); font-weight: 600; }
    .grp-stk-inline { display: inline-flex; align-items: center; vertical-align: middle; margin: 0 2px; }

    .grp-stk-quick { display: flex; align-items: center; gap: 5px; overflow-x: auto; padding: 2px 0 4px; scrollbar-width: thin; }
    .grp-stk-qbtn { flex: none; display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px 3px 4px; border-radius: 999px; border: 1px solid var(--line); background: var(--panel-2); color: var(--fg); font-size: .76rem; cursor: pointer; transition: transform .15s, border-color .15s, background .15s; }
    .grp-stk-qbtn:hover { border-color: var(--accent); background: var(--accent-soft); transform: translateY(-1px); }
    .grp-stk-drawer { border: 1.5px solid var(--line); border-radius: 14px; background: var(--panel); padding: 10px; display: flex; flex-direction: column; gap: 8px; box-shadow: 0 8px 28px rgba(0,0,0,.12); }
    .grp-stk-drawer[hidden] { display: none !important; }
    .grp-stk-thermo { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 6px 10px; padding: 7px 10px; border-radius: 10px; background: var(--panel-2); font-size: .78rem; border-left: 3.5px solid var(--accent); }
    .grp-stk-thermo.is-chilly { border-left-color: #38bdf8; background: color-mix(in srgb, #38bdf8 10%, var(--panel-2)); }
    .grp-stk-thermo.is-frozen { border-left-color: #0284c7; background: color-mix(in srgb, #0284c7 14%, var(--panel-2)); }
    .grp-stk-thermo-badge { font-weight: 800; display: inline-flex; align-items: center; gap: 4px; }
    .grp-stk-lvbar { display: flex; flex-wrap: wrap; gap: 4px; align-items: center; font-size: .72rem; }
    .grp-stk-lvpill { padding: 2px 7px; border-radius: 99px; background: var(--panel-2); border: 1px solid var(--line); color: var(--muted); font-weight: 600; }
    .grp-stk-lvpill.ok { background: var(--accent-soft); border-color: var(--accent); color: var(--accent); font-weight: 700; }
    .grp-stk-tools { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
    .grp-stk-search { flex: 1 1 120px; min-width: 0; padding: 5px 9px; border-radius: 8px; border: 1px solid var(--line); background: var(--panel-2); color: var(--fg); font-size: .8rem; }
    .grp-stk-tabs { display: flex; gap: 4px; overflow-x: auto; padding-bottom: 3px; scrollbar-width: thin; }
    .grp-stk-tab { flex: none; padding: 4px 9px; border-radius: 999px; border: 1px solid var(--line); background: var(--panel-2); color: var(--fg); font-size: .76rem; font-weight: 600; cursor: pointer; white-space: nowrap; }
    .grp-stk-tab.on { background: var(--accent); color: #fff; border-color: var(--accent); }
    .grp-stk-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(72px, 1fr)); gap: 6px; max-height: 210px; overflow-y: auto; padding: 2px; }
    .grp-stk-cell { position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; padding: 6px 4px 4px; border-radius: 11px; border: 1px solid var(--line-soft, var(--line)); background: var(--panel-2); cursor: pointer; transition: transform .15s, border-color .15s, background .15s; }
    .grp-stk-cell:hover { border-color: var(--accent); background: var(--accent-soft); transform: translateY(-2px); }
    .grp-stk-cell.picked { border: 2px solid var(--accent); background: var(--accent-soft); }
    .grp-stk-cell.frozen { background: color-mix(in srgb, #38bdf8 12%, var(--panel-2)); border-color: rgba(56, 189, 248, .45); }
    .grp-stk-cell.locked { filter: grayscale(.92); opacity: .52; }
    .grp-stk-cell.shake { animation: paceStkIceShake .4s ease; }
    @keyframes paceStkIceShake { 20% { transform: translateX(-4px) rotate(-4deg); } 40% { transform: translateX(4px) rotate(4deg); } 60% { transform: translateX(-3px); } 80% { transform: translateX(3px); } }
    .grp-stk-cname { font-size: .7rem; font-weight: 600; color: var(--fg); max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .grp-stk-cbadge { position: absolute; top: 3px; right: 3px; font-size: .62rem; line-height: 1; padding: 2px 4px; border-radius: 99px; background: rgba(15, 23, 42, .72); color: #fff; font-weight: 700; }
    .grp-stk-cbadge.starter { background: var(--accent); }
    .grp-stk-cbadge.ice { background: #0284c7; }
    .grp-stk-foot { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 6px; font-size: .74rem; color: var(--muted); }

    /* 🧪 森靈調合工坊（貼圖合併區） */
    .grp-stk-lab { border: 1.5px dashed var(--accent); border-radius: 12px; padding: 8px 10px; background: color-mix(in srgb, var(--accent) 6%, var(--panel-2)); display: flex; flex-direction: column; gap: 6px; }
    .grp-stk-lab[hidden] { display: none !important; }
    .grp-stk-lab-row { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; justify-content: space-between; }
    .grp-stk-slots { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
    .grp-stk-slot { width: 54px; height: 54px; border-radius: 12px; border: 1.5px dashed var(--line); background: var(--panel); display: grid; place-items: center; cursor: pointer; position: relative; font-size: .72rem; color: var(--muted); }
    .grp-stk-slot.filled { border-style: solid; border-color: var(--accent); }
    .grp-stk-slot.locked-slot { opacity: .45; cursor: not-allowed; background: var(--panel-2); }
    .grp-stk-result { display: flex; align-items: center; gap: 8px; padding: 4px 10px; border-radius: 12px; background: var(--panel); border: 1px solid var(--line); min-height: 58px; }
    /* 聊天室裡的精簡版：只有分類和貼圖 */
    .grp-stk-wrap.is-compact :is(.grp-stk-quick, .grp-stk-thermo, .grp-stk-lvbar, .grp-stk-lab-btn, .grp-stk-motion, .grp-stk-sim, .grp-stk-lab, .grp-stk-catdesc, label.check) { display: none !important; }
    .grp-stk-wrap.is-compact .grp-stk-drawer { box-shadow: none; padding: 8px; gap: 6px; border-width: 1px; }
    .grp-stk-wrap.is-compact .grp-stk-grid { max-height: min(190px, 30dvh); grid-template-columns: repeat(auto-fill, minmax(64px, 1fr)); }
    .grp-stk-wrap.is-compact .grp-stk-search { flex: 1 1 auto; }
    /* 格子裡的貼圖平常不動，滑過／選到才動，免得整片一起跳 */
    .grp-stk-cell:not(:hover):not(:focus-visible) .pace-stk-svg :is(.stk-actor, .stk-prop) { animation: none !important; }
  `;
  document.head.appendChild(style);

  /* ---------- 掛載至群組聊天室 (#grpRoom) 與成就圖鑑 (#xpDlg) ---------- */
  let directSend = false;
  let motionPref = ls.get('pace-stk-motion') || 'auto'; // 'auto' (預設動態) | 'static' (指定不動)
  let labOpen = false;
  let mergeSlots = []; // 已選入合成槽的貼圖物件陣列 (最多 3 張)
  const pickerInstances = [];

  function refreshPickers() {
    pickerInstances.forEach(fn => { try { fn(); } catch (e) {} });
  }

  /* 最近用過的貼圖（含在「成就」做好的合成貼圖），聊天室的「⭐ 常用」會先列出它們 */
  const RECENT_KEY = 'pace-stk-recent';
  const recentTokens = () => { try { const a = JSON.parse(ls.get(RECENT_KEY) || '[]'); return Array.isArray(a) ? a.filter(t => typeof t === 'string' && /^\[貼圖:[^\][\n]{1,42}\]$/.test(t) && parseTokenSpec(t.slice(4, -1))).slice(0, 16) : []; } catch (e) { return []; } };
  const pushRecent = token => { const a = recentTokens().filter(t => t !== token); a.unshift(token); ls.set(RECENT_KEY, JSON.stringify(a.slice(0, 16))); };

  function buildStickerPickerUI(hostEl, onPickRaw, pickerOpts = {}) {
    // compact = the chat room: only the stickers; levels, merging, previews and freezing details live in 成就
    const compact = !!pickerOpts.compact;
    const onPickToken = (token, ...rest) => { pushRecent(token); onPickRaw(token, ...rest); };
    const progNow = () => scanProgress(compact);
    const inLab = () => !compact && labOpen;
    let activeCat = compact ? 'recent' : 'starter';
    let searchQuery = '';
    const wrap = document.createElement('div');
    wrap.className = 'grp-stk-wrap' + (compact ? ' is-compact' : '');
    wrap.innerHTML =
      `<div class="grp-stk-quick" aria-label="基本常用貼圖快捷列"></div>` +
      `<div class="grp-stk-drawer" hidden>` +
        `<div class="grp-stk-thermo">` +
          `<span class="grp-stk-thermo-badge"></span>` +
          `<span class="grp-stk-thermo-counts"></span>` +
        `</div>` +
        `<div class="grp-stk-lvbar" aria-label="等級能力解鎖進度"></div>` +
        `<div class="grp-stk-tools">` +
          `<input type="search" class="grp-stk-search" placeholder="搜尋 240 款貼圖（笑、讚、拍手、珍奶、貓…）" aria-label="搜尋貼圖">` +
          `<button type="button" class="btn grp-stk-lab-btn" style="padding:4px 9px;font-size:.76rem">🧪 森靈調合工坊（貼圖合併）</button>` +
          `<select class="grp-stk-motion" aria-label="動態或靜態選擇" style="font-size:.74rem;padding:4px 6px;border-radius:7px;border:1px solid var(--line);background:var(--panel-2);color:var(--fg)">` +
            `<option value="auto">🎞️ 動態模式</option>` +
            `<option value="static">🖼️ 靜態模式(不動)</option>` +
          `</select>` +
          `<label class="check" style="font-size:.75rem;flex-direction:row;gap:4px;margin:0;white-space:nowrap"><input type="checkbox" class="grp-stk-direct"> 點擊直傳</label>` +
          `<select class="grp-stk-sim" aria-label="貼圖與等級狀態預覽" style="font-size:.74rem;padding:4px 6px;border-radius:7px;border:1px solid var(--line);background:var(--panel-2);color:var(--fg)">` +
            `<option value="real">🌡️ 實際等級與進度</option>` +
            `<option value="lv3">✨ 預覽：Lv 3 (解鎖動態貼圖)</option>` +
            `<option value="lv6">🧪 預覽：Lv 6 (合理雙貼圖合併)</option>` +
            `<option value="lv10">🔮 預覽：Lv 10 (萬物任意雙合併)</option>` +
            `<option value="lv18">👑 預覽：Lv 18 (三合一＋全動態)</option>` +
            `<option value="idle4">🧊 預覽：7天不動(半結凍)</option>` +
            `<option value="idle6">🧊 預覽：10天+不動(全結凍)</option>` +
          `</select>` +
        `</div>` +
        // 🧪 森靈調合工坊面板
        `<div class="grp-stk-lab" hidden>` +
          `<div class="grp-stk-lab-row">` +
            `<div class="grp-stk-slots"></div>` +
            `<div class="grp-stk-result"></div>` +
            `<div style="display:flex;gap:5px;flex-wrap:wrap">` +
              `<button type="button" class="btn grp-stk-lab-rand" style="padding:4px 8px;font-size:.74rem">🎲 靈感配方</button>` +
              `<button type="button" class="btn grp-stk-lab-clear" style="padding:4px 8px;font-size:.74rem">清空</button>` +
              `<button type="button" class="btn primary grp-stk-lab-use" style="padding:4px 10px;font-size:.76rem">傳送／插入合成貼圖</button>` +
            `</div>` +
          `</div>` +
          `<div class="grp-stk-lab-msg hint" style="margin:0;font-size:.74rem">點選下方任 2 張貼圖（Lv 15 開放 3 張）即可調合成專屬新貼圖！</div>` +
        `</div>` +
        `<div class="grp-stk-tabs" role="tablist"></div>` +
        `<div class="grp-stk-catdesc hint" style="margin:0;font-size:.75rem"></div>` +
        `<div class="grp-stk-grid" role="listbox" aria-label="原創貼圖列表"></div>` +
        `<div class="grp-stk-foot">` +
          `<span class="grp-stk-status-msg">${compact ? '' : '🌱 初始 24 款基本貼圖永不結凍；升等可逐步解鎖「動態貼圖」、「動靜自選」、「合理合併」、「萬物合併」與「三合一傳奇動態」！做好的合成貼圖會出現在聊天室貼圖的「⭐ 常用」。'}</span>` +
        `</div>` +
      `</div>`;

    hostEl.appendChild(wrap);
    const quickBar = wrap.querySelector('.grp-stk-quick');
    const drawer = wrap.querySelector('.grp-stk-drawer');
    const thermo = wrap.querySelector('.grp-stk-thermo');
    const thermoBadge = wrap.querySelector('.grp-stk-thermo-badge');
    const thermoCounts = wrap.querySelector('.grp-stk-thermo-counts');
    const lvBar = wrap.querySelector('.grp-stk-lvbar');
    const searchIn = wrap.querySelector('.grp-stk-search');
    const labBtn = wrap.querySelector('.grp-stk-lab-btn');
    const motionSel = wrap.querySelector('.grp-stk-motion');
    const directChk = wrap.querySelector('.grp-stk-direct');
    const simSel = wrap.querySelector('.grp-stk-sim');
    const labBox = wrap.querySelector('.grp-stk-lab');
    const slotsBox = wrap.querySelector('.grp-stk-slots');
    const resultBox = wrap.querySelector('.grp-stk-result');
    const labRandBtn = wrap.querySelector('.grp-stk-lab-rand');
    const labClearBtn = wrap.querySelector('.grp-stk-lab-clear');
    const labUseBtn = wrap.querySelector('.grp-stk-lab-use');
    const labMsg = wrap.querySelector('.grp-stk-lab-msg');
    const tabsBox = wrap.querySelector('.grp-stk-tabs');
    const catDesc = wrap.querySelector('.grp-stk-catdesc');
    const gridBox = wrap.querySelector('.grp-stk-grid');
    const statusMsg = wrap.querySelector('.grp-stk-status-msg');

    const QUICK_IDS = ['st_smile', 'st_laugh', 'st_thumb', 'st_clap', 'st_cheer', 'st_ok', 'st_thanks', 'st_love', 'st_done', 'st_rest'];

    function formatSingleToken(stk, prog) {
      const wantStatic = motionPref === 'static' && prog.perks.chooseMotion;
      return `[貼圖:${stk.name}${wantStatic ? '!靜' : ''}]`;
    }

    function paintQuickBar(prog) {
      const canAnim = prog.perks.singleAnim && !(motionPref === 'static' && prog.perks.chooseMotion);
      quickBar.innerHTML = QUICK_IDS.map(id => {
        const s = BY_ID.get(id);
        return `<button type="button" class="grp-stk-qbtn" data-qstk="${esc(s.id)}" title="貼圖：${esc(s.name)}（初始基本貼圖・永不結凍）">${svgOf(s, { size: 22, noAnim: !canAnim })}<span>${esc(s.name)}</span></button>`;
      }).join('');
    }

    quickBar.addEventListener('click', e => {
      const b = e.target.closest('[data-qstk]');
      if (!b) return;
      const stk = BY_ID.get(b.dataset.qstk);
      if (!stk) return;
      const prog = scanProgress(true);
      onPickToken(formatSingleToken(stk, prog), stk.name, directSend, statusMsg);
    });

    function paintLab(prog) {
      labBox.hidden = !labOpen;
      labBtn.classList.toggle('primary', labOpen);
      if (!labOpen) return;

      const p = prog.perks;
      const maxSlots = p.merge3 ? 3 : 2;
      if (mergeSlots.length > maxSlots) mergeSlots = mergeSlots.slice(0, maxSlots);

      slotsBox.innerHTML = [0, 1, 2].map(i => {
        if (i === 2 && !p.merge3) {
          return `<div class="grp-stk-slot locked-slot" title="升到 Lv 15 解鎖第 3 張多重貼圖調合！">🔒Lv15<br>三合一</div>`;
        }
        const s = mergeSlots[i];
        if (!s) {
          return `<div class="grp-stk-slot" data-slot="${i}" title="點選下方貼圖放入槽位 ${i + 1}">＋槽位${i + 1}</div>`;
        }
        return `<div class="grp-stk-slot filled" data-slot="${i}" title="點擊移除「${esc(s.name)}」">${svgOf(s, { size: 44, noAnim: true })}</div>`;
      }).join('<span style="font-weight:900;color:var(--muted)">＋</span>');

      if (!p.merge2Logical) {
        resultBox.innerHTML = `<span class="hint">🔒 升至 <strong>Lv 6</strong> 解鎖「森靈調合工坊（合理雙貼圖合併）」！</span>`;
        labUseBtn.disabled = true;
        return;
      }

      if (mergeSlots.length < 2) {
        resultBox.innerHTML = `<span class="hint">請從下方點選 ${2 - mergeSlots.length} 張貼圖放入合成槽…</span>`;
        labUseBtn.disabled = true;
        return;
      }

      const hm = checkMergeHarmony(mergeSlots);
      const is3 = mergeSlots.length === 3;
      const canMerge = hm.valid && (hm.harmonious ? p.merge2Logical : p.merge2Any) && (!is3 || p.merge3);
      const wantStatic = motionPref === 'static' && p.chooseMotion;
      const hasAnim = !wantStatic && (is3 ? p.merge3Anim : (hm.harmonious ? p.merge2LogicalAnim : p.merge2AnyAnim));

      if (!canMerge) {
        resultBox.innerHTML = `<span class="hint" style="color:var(--danger, #c2372c)">${esc(hm.reason)}</span>`;
        labMsg.textContent = hm.reason;
        labUseBtn.disabled = true;
      } else {
        const comboName = mergeSlots.map(s => s.name).join('＋');
        const animTag = hasAnim ? '✨動態合成' : (is3 ? '🖼️靜態(Lv18解鎖動態)' : hm.harmonious ? '🖼️靜態(Lv8解鎖動態)' : '🖼️靜態(Lv12解鎖動態)');
        resultBox.innerHTML = svgOfCombo(mergeSlots, { size: 56, noAnim: !hasAnim }) +
          `<div style="font-size:.75rem"><div><strong>${esc(comboName)}</strong></div><div class="hint" style="margin:0">${animTag}</div></div>`;
        labMsg.textContent = hm.reason;
        labUseBtn.disabled = false;
      }
    }

    function paint() {
      const prog = progNow();
      const p = prog.perks;
      simSel.value = simMode;
      directChk.checked = directSend;
      motionSel.value = p.chooseMotion ? motionPref : 'auto';
      motionSel.disabled = !p.chooseMotion;
      motionSel.title = p.chooseMotion ? 'Lv 5 已解鎖：可自由選擇動態或靜態貼圖' : '升到 Lv 5 即可自由切換動態／靜態貼圖';

      paintQuickBar(prog);

      thermo.classList.toggle('is-chilly', prog.idleDays >= 4 && prog.idleDays <= 9);
      thermo.classList.toggle('is-frozen', prog.idleDays >= 10);
      if (prog.idleDays <= 1) {
        thermoBadge.textContent = `🔥 Lv ${prog.level} 暖心活躍中（貼圖全數回溫）`;
      } else if (prog.idleDays <= 3) {
        thermoBadge.textContent = `🌤️ Lv ${prog.level} · 休息 ${prog.idleDays} 天也沒關係（第 4 天起才會慢慢結凍）`;
      } else if (prog.idleDays <= 9) {
        thermoBadge.textContent = `❄️ Lv ${prog.level} · 閒置 ${prog.idleDays} 天（${prog.frozenCount} 款貼圖結凍中）`;
      } else {
        thermoBadge.textContent = `🧊 Lv ${prog.level} · 閒置 ${prog.idleDays} 天（進階貼圖冰封，剩基本貼圖可用）`;
      }
      thermoCounts.textContent = `可用 ${prog.usableCount}/${prog.total} 款 · 🧊結凍 ${prog.frozenCount} · 🔒待解鎖 ${prog.lockedCount}`;

      // 等級能力徽章列
      const milestones = [
        [3,  p.singleAnim,        'Lv3 貼圖動態'],
        [5,  p.chooseMotion,      'Lv5 動靜自選'],
        [6,  p.merge2Logical,     'Lv6 合理合併'],
        [8,  p.merge2LogicalAnim, 'Lv8 合理合併動態'],
        [10, p.merge2Any,         'Lv10 任意合併'],
        [12, p.merge2AnyAnim,     'Lv12 任意合併動態'],
        [15, p.merge3,            'Lv15 三合一調合'],
        [18, p.merge3Anim,        'Lv18 三合一傳奇動態']
      ];
      lvBar.innerHTML = milestones.map(([lv, ok, txt]) =>
        `<span class="grp-stk-lvpill${ok ? ' ok' : ''}">${ok ? '✓ ' : '🔒 '}${txt}</span>`
      ).join('');

      paintLab(prog);

      tabsBox.innerHTML = (compact ? `<button type="button" class="grp-stk-tab${activeCat === 'recent' && !searchQuery ? ' on' : ''}" data-stkat="recent">⭐ 常用</button>` : '') + CATEGORIES.map(c => {
        const list = STICKERS.filter(s => s.cat === c.id);
        const usableInCat = list.filter(s => prog.itemState.get(s.id)?.usable).length;
        return `<button type="button" class="grp-stk-tab${activeCat === c.id && !searchQuery ? ' on' : ''}" data-stkat="${c.id}">${c.icon} ${esc(c.name)}${compact ? '' : ` <small>(${usableInCat}/${list.length})</small>`}</button>`;
      }).join('');

      if (compact && !statusMsg.dataset.busy) {
        statusMsg.textContent = `可用 ${prog.usableCount}/${prog.total} 款${prog.frozenCount ? ` · 🧊 ${prog.frozenCount} 款結凍中（完成 1 個方塊就解凍）` : ''} · 等級和合成貼圖在「成就」`;
      }
      if (compact && activeCat === 'recent' && !searchQuery.trim()) {
        // recent first (singles and merges made in 成就), then the always-free basics
        const toks = recentTokens();
        QUICK_IDS.forEach(id => { const t = `[貼圖:${BY_ID.get(id).name}]`; if (!toks.some(x => x.replace('!靜', '') === t)) toks.push(t); });
        gridBox.innerHTML = toks.slice(0, 24).map(t => {
          const parsed = parseTokenSpec(t.slice(4, -1));
          const label = parsed.stks.map(s => s.name).join('＋');
          const ok = parsed.stks.every(s => prog.itemState.get(s.id)?.usable);
          return `<button type="button" class="grp-stk-cell${ok ? '' : ' frozen'}" data-token="${esc(t)}" title="${esc(label)}">` +
            renderTokenSvg(parsed, 50, prog) + `<span class="grp-stk-cname">${esc(label)}</span></button>`;
        }).join('');
        return;
      }

      const curCatObj = CATEGORIES.find(c => c.id === activeCat) || CATEGORIES[0];
      const q = searchQuery.trim().toLowerCase();
      catDesc.textContent = q
        ? `🔍 搜尋「${searchQuery}」的結果：`
        : `${curCatObj.icon} ${curCatObj.name}：${curCatObj.desc}`;

      const shown = q
        ? STICKERS.filter(s => s.name.toLowerCase().includes(q) || s.tag.toLowerCase().includes(q))
        : STICKERS.filter(s => s.cat === activeCat);

      const cellAnim = p.singleAnim && !(motionPref === 'static' && p.chooseMotion);
      const pickedIds = new Set(mergeSlots.map(s => s.id));

      gridBox.innerHTML = shown.length ? shown.map(s => {
        const st = prog.itemState.get(s.id) || { unlocked: true, frozen: false, usable: true, needMore: 0 };
        const cls = (st.frozen ? ' frozen' : (!st.unlocked ? ' locked' : '')) + (inLab() && pickedIds.has(s.id) ? ' picked' : '');
        const badge = s.neverFreeze
          ? `<span class="grp-stk-cbadge starter" title="初始基本貼圖・永不結凍">常駐</span>`
          : st.frozen
            ? `<span class="grp-stk-cbadge ice" title="久未完成方塊而結凍">🧊凍</span>`
            : !st.unlocked
              ? `<span class="grp-stk-cbadge" title="累積完成 ${s.reqDone} 個方塊解鎖">🔒${s.reqDone}格</span>`
              : '';
        return `<button type="button" class="grp-stk-cell${cls}" data-stkid="${s.id}" title="${esc(s.name)}">` +
          badge +
          svgOf(s, { size: 50, frozen: st.frozen, locked: !st.unlocked, noAnim: !cellAnim }) +
          `<span class="grp-stk-cname">${esc(s.name)}</span>` +
        `</button>`;
      }).join('') : `<p class="hint" style="grid-column:1/-1;margin:8px 0">找不到符合「${esc(searchQuery)}」的貼圖。</p>`;
    }

    tabsBox.addEventListener('click', e => {
      const b = e.target.closest('[data-stkat]');
      if (!b) return;
      activeCat = b.dataset.stkat;
      searchQuery = '';
      searchIn.value = '';
      paint();
    });

    searchIn.addEventListener('input', () => {
      searchQuery = searchIn.value;
      paint();
    });

    labBtn.addEventListener('click', () => {
      labOpen = !labOpen;
      paint();
    });

    motionSel.addEventListener('change', () => {
      motionPref = motionSel.value;
      ls.set('pace-stk-motion', motionPref);
      refreshPickers();
    });

    directChk.addEventListener('change', () => {
      directSend = directChk.checked;
    });

    simSel.addEventListener('change', () => {
      simMode = simSel.value;
      refreshPickers();
    });

    slotsBox.addEventListener('click', e => {
      const slotEl = e.target.closest('[data-slot]');
      if (!slotEl) return;
      const idx = Number(slotEl.dataset.slot);
      if (mergeSlots[idx]) {
        mergeSlots.splice(idx, 1);
        paint();
      }
    });

    labClearBtn.addEventListener('click', () => {
      mergeSlots = [];
      paint();
    });

    labRandBtn.addEventListener('click', () => {
      const prog = scanProgress();
      const usableList = STICKERS.filter(s => prog.itemState.get(s.id)?.usable);
      const actors = usableList.filter(s => s.cat === 'starter' || s.cat === 'emotion' || s.cat === 'critter');
      const others = usableList.filter(s => s.cat !== 'starter' && s.cat !== 'emotion');
      const a = actors[Math.floor(Math.random() * actors.length)] || STICKERS[0];
      const pool2 = (others.length ? others : usableList).filter(s => s.id !== a.id);
      const b = pool2[Math.floor(Math.random() * pool2.length)] || STICKERS[2];
      mergeSlots = [a, b];
      if (prog.perks.merge3 && usableList.length >= 3) {
        const pool3 = usableList.filter(s => s.id !== a.id && s.id !== b.id);
        if (pool3.length) mergeSlots.push(pool3[Math.floor(Math.random() * pool3.length)]);
      }
      paint();
    });

    labUseBtn.addEventListener('click', () => {
      // preview levels only show what a merge looks like; sending follows actual progress
      const prog = scanProgress(true);
      if (mergeSlots.length < 2) return;
      const hm = checkMergeHarmony(mergeSlots);
      const is3 = mergeSlots.length === 3;
      const canMerge = hm.valid && (hm.harmonious ? prog.perks.merge2Logical : prog.perks.merge2Any) && (!is3 || prog.perks.merge3);
      const allUsable = mergeSlots.every(s => prog.itemState.get(s.id)?.usable);
      if (!canMerge || !allUsable) {
        if (simMode !== 'real') statusMsg.textContent = `👀 這是預覽畫面。你目前是 Lv ${prog.level}${allUsable ? '' : '，而且有貼圖還沒解鎖或結凍中'}，實際上還不能送出這個合成，切回「🌡️ 實際等級與進度」看看目前能用哪些。`;
        return;
      }
      const wantStatic = motionPref === 'static' && prog.perks.chooseMotion;
      const names = mergeSlots.map(s => s.name).join('+');
      const token = `[貼圖:${names}${wantStatic ? '!靜' : ''}]`;
      onPickToken(token, mergeSlots.map(s => s.name).join('＋'), directSend, statusMsg);
    });

    gridBox.addEventListener('click', e => {
      const tokCell = e.target.closest('[data-token]');
      if (tokCell) {
        const t = tokCell.dataset.token, parsed = parseTokenSpec(t.slice(4, -1)), prog = scanProgress(true);
        if (!parsed) return;
        const label = parsed.stks.map(s => s.name).join('＋');
        const usable = parsed.stks.every(s => prog.itemState.get(s.id)?.usable);
        const hm = parsed.stks.length > 1 ? checkMergeHarmony(parsed.stks) : null;
        const allowed = !hm || (hm.valid && (parsed.stks.length === 3 ? prog.perks.merge3 : hm.harmonious ? prog.perks.merge2Logical : prog.perks.merge2Any));
        if (!usable || !allowed) {
          tokCell.classList.remove('shake'); void tokCell.offsetWidth; tokCell.classList.add('shake');
          statusMsg.textContent = !usable ? `🧊「${label}」裡有貼圖結凍了，完成 1 個方塊就能再用。` : `「${label}」需要更高等級才能用。`;
          return;
        }
        onPickToken(t, label, directSend, statusMsg);
        return;
      }
      const cell = e.target.closest('[data-stkid]');
      if (!cell) return;
      const stk = BY_ID.get(cell.dataset.stkid);
      if (!stk) return;
      const prog = progNow();
      const st = prog.itemState.get(stk.id);
      // preview modes only change how the album looks; what can really be sent follows actual progress
      const realSt = scanProgress(true).itemState.get(stk.id);
      if (simMode !== 'real' && st?.usable && !realSt?.usable && !inLab()) {
        cell.classList.remove('shake'); void cell.offsetWidth; cell.classList.add('shake');
        statusMsg.textContent = `👀 這是預覽畫面。「${stk.name}」實際上${realSt?.unlocked ? '還在結凍中' : '還沒解鎖'}，切回「🌡️ 實際等級與進度」看看目前能用哪些。`;
        return;
      }
      if (!st?.unlocked) {
        cell.classList.remove('shake'); void cell.offsetWidth; cell.classList.add('shake');
        statusMsg.textContent = `🔒「${stk.name}」尚未解鎖！再完成 ${st.needMore} 個方塊（累積 ${stk.reqDone} 格）即可解鎖。`;
        return;
      }
      if (st.frozen) {
        cell.classList.remove('shake'); void cell.offsetWidth; cell.classList.add('shake');
        statusMsg.textContent = `🧊「${stk.name}」因為 ${prog.idleDays} 天沒動而結凍了！去完成 1 個方塊就能破冰解凍，或先用「🌱 基本常用」貼圖～`;
        return;
      }
      // 若森靈調合工坊開啟中，點選貼圖會加入或移出合成槽！
      if (inLab()) {
        const maxSlots = prog.perks.merge3 ? 3 : 2;
        const existIdx = mergeSlots.findIndex(x => x.id === stk.id);
        if (existIdx >= 0) {
          mergeSlots.splice(existIdx, 1);
        } else if (mergeSlots.length < maxSlots) {
          mergeSlots.push(stk);
        } else {
          mergeSlots[maxSlots - 1] = stk;
        }
        paint();
        return;
      }
      onPickToken(formatSingleToken(stk, scanProgress(true)), stk.name, directSend, statusMsg);
    });

    pickerInstances.push(paint);
    paint();
    return {
      wrap,
      drawer,
      toggle: () => {
        drawer.hidden = !drawer.hidden;
        if (!drawer.hidden) paint();
        return !drawer.hidden;
      },
      paint
    };
  }

  /* 整合進群組聊天室 (#grpRoom) */
  function attachToGroupRoom() {
    const msgIn = document.getElementById('grpMsgIn');
    const sendBtn = document.getElementById('grpSend');
    if (!msgIn || !sendBtn || document.getElementById('grpStkBtn')) return;

    const actsRow = msgIn.parentElement;
    const stkBtn = document.createElement('button');
    stkBtn.type = 'button';
    stkBtn.id = 'grpStkBtn';
    stkBtn.className = 'btn';
    stkBtn.setAttribute('aria-expanded', 'false');
    stkBtn.title = '貼圖（點一下就傳出去）';
    stkBtn.innerHTML = '😊 貼圖';
    actsRow.insertBefore(stkBtn, sendBtn);

    const pickerHost = document.createElement('div');
    actsRow.before(pickerHost);

    // in the chat a tap sends the sticker straight away (what's typed in the box stays there)
    const picker = buildStickerPickerUI(pickerHost, (token, label, _isDirect, statusMsg) => {
      const prev = msgIn.value;
      msgIn.value = token;
      sendBtn.click();
      const sent = msgIn.value === '';
      msgIn.value = prev;   // whatever was being typed stays in the box
      if (sent) statusMsg.textContent = `✨ 已傳送「${label}」`;
    }, { compact: true });

    stkBtn.addEventListener('click', () => {
      const open = picker.toggle();
      stkBtn.setAttribute('aria-expanded', String(open));
      stkBtn.classList.toggle('primary', open);
    });
  }

  /* 也在「等級與成就 (#xpDlg)」中加入原創 240 貼圖圖鑑與森靈調合工坊 */
  function attachToXpDialog() {
    const albumBox = document.getElementById('xpAlbum');
    if (!albumBox || document.getElementById('xpChatStkWrap')) return;
    const sec = document.createElement('div');
    sec.id = 'xpChatStkWrap';
    sec.innerHTML = `<h3 class="set-h">貼圖圖鑑 ＆ 森靈調合工坊</h3>` +
      `<p class="hint" style="margin:0 0 6px">240 款原創貼圖。升等會解鎖動態、動靜自選和貼圖合併；做好的貼圖會放進聊天室貼圖的「⭐ 常用」。</p>`;
    albumBox.after(sec);
    const p = buildStickerPickerUI(sec, (token, label, _isDirect, statusMsg) => {
      statusMsg.textContent = `✨「${label}」已放進聊天室貼圖的「⭐ 常用」，到群組聊天室按 😊 就能傳。`;
    });
    p.drawer.hidden = false;
  }

  if (window.paceStore && typeof window.paceStore.onWrite === 'function') {
    // any save of a week that already holds a finished block (moving, renaming) is not new activity:
    // only re-read here; the dates of finished blocks decide how long it has been, and ticking a block (below) thaws at once
    window.paceStore.onWrite(p => {
      if (p.startsWith('weeks/') || /^tasks\/[^/]+$/.test(p)) refreshPickers();
    });
  }
  if (typeof window.toggleDone === 'function') {
    const td0 = window.toggleDone;
    window.toggleDone = function (id) {
      const r = td0.apply(this, arguments);
      try {
        const b = typeof state !== 'undefined' && state?.week?.blocks?.find(x => x.id === id);
        if (b?.done) markActiveNow();
        else refreshPickers();
      } catch (e) {}
      return r;
    };
  }

  window.paceStickers = {
    categories: () => CATEGORIES,
    list: () => STICKERS,
    get: idOrName => BY_ID.get(idOrName) || BY_NAME.get(idOrName) || null,
    svg: svgOf,
    svgCombo: svgOfCombo,
    checkHarmony: checkMergeHarmony,
    perksOf: computePerks,
    status: scanProgress,
    renderChatMessage,
    attachToGroupRoom,
    refresh: refreshPickers
  };

  attachToGroupRoom();
  attachToXpDialog();
  addEventListener('DOMContentLoaded', () => { attachToGroupRoom(); attachToXpDialog(); });
})();
