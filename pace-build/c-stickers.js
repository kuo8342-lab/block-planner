/* 步調 Pace: 原創「方塊森靈 (Koma)」貼圖與表情系統 (c-stickers.js)
   - 100% 獨立原創向量繪圖（和紙水彩 × 森林方塊精靈 × 書齋印記），絕不抄襲任何商業貼圖或系統 Emoji，僅含少數合法名畫／科學致敬。
   - 規模超越一般 Emoji：共 10 大分類 × 每類 24 款 = 240 款獨立原創動態 SVG 貼圖。
   - 解鎖與結凍制度：
     1. 初始基本貼圖（第 1 類「基本常用」24 款：笑、大笑、讚、拍手、加油、OK、收到、揮手等）開局免費贈送，且【永遠不會結凍】。
     2. 進階貼圖（其餘 9 大類共 216 款）隨完成方塊／任務數量與連續天數逐步解鎖（每完成 1 格即可解鎖 3 款新貼圖）。
     3. 久不動結凍機制（🧊）：休息 3 天內完全不凍（週末、段考、生病都不扣）；之後已解鎖的進階貼圖才會從高階往低階慢慢「結凍」（閒置 4–5 天凍 25%、6–7 天凍 50%、8–9 天凍 75%、10 天以上進階貼圖全數結凍，只剩初始基本貼圖可用）。只要再完成 1 個方塊即可瞬間「破冰解凍」！ */
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

  /* ---------- 色票系統（和紙溫潤感 × 森林原創配色） ---------- */
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

  /* ---------- 240 款原創貼圖資料庫 ----------
     欄位：[id, name(唯一短名，用於 [貼圖:name]), cat, pal, face, prop, anim, tag(印記字)] */
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
    ['st_np',       '沒問題',   'starter', 'gold',   'cool',    'vsign',      'bounce',  '妥'],
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

  /* 建立索引與解鎖階梯：
     - 第 1 類 starter 共 24 款：tier = 0, reqDone = 0, neverFreeze = true
     - 其餘 9 類共 216 款：依各分類內順序 (idxInCat = 0..23) 交錯分配解鎖門檻，
       讓使用者每完成 1 個方塊就能在多個分類同時解鎖新貼圖！ */
  const catCounters = {};
  const STICKERS = RAW_STICKERS.map((r, idx) => {
    const [id, name, cat, pal, face, prop, anim, tag] = r;
    const cIdx = catCounters[cat] = (catCounters[cat] || 0);
    catCounters[cat] = cIdx + 1;
    const isStarter = cat === 'starter';
    // 交錯式解鎖門檻：各分類前 2 款只需 1 格，接著逐步上升到 60 格全部解鎖
    const reqDone = isStarter ? 0 : Math.max(1, Math.floor(cIdx * 2.5));
    return {
      index: idx,
      id,
      name,
      cat,
      pal: PALETTES[pal] || PALETTES.mint,
      face,
      prop,
      anim,
      tag,
      neverFreeze: isStarter,
      reqDone,
      tier: isStarter ? 0 : (cIdx + 1) // 1 (最低階，最晚結凍) ~ 24 (最高階，最先結凍)
    };
  });

  const BY_ID = new Map(STICKERS.map(s => [s.id, s]));
  const BY_NAME = new Map(STICKERS.map(s => [s.name, s]));

  /* ---------- 原創 SVG 向量繪圖引擎 ----------
     不依賴任何外部圖片或系統 Emoji 字型，純手工打造「方塊森靈 (Koma)」幾何插畫 */
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
      default: // smile, gentle, proud, salute, smirk, curious, doubt, sweat, relief, think, bow, peek
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
        // 原創「步調雙葉芽」與星芒點綴
        return `<path d="M32 14V8c0-3 3.5-5 6-3.5 1 2.5-1.5 5-6 3.5zm0-4c0-3-3.5-5-6-3.5-1 2.5 1.5 5 6 3.5z" fill="#52b788" stroke="${e}" stroke-width="1.7" stroke-linejoin="round"/>` +
          `<circle cx="12" cy="15" r="2" fill="${a}"/><circle cx="52" cy="18" r="1.6" fill="${a}"/>`;
    }
  }

  function svgOf(stkOrId, opts = {}) {
    const stk = typeof stkOrId === 'string' ? (BY_ID.get(stkOrId) || BY_NAME.get(stkOrId) || STICKERS[0]) : (stkOrId || STICKERS[0]);
    const size = opts.size || 60;
    const frozen = !!opts.frozen;
    const locked = !!opts.locked;
    const pal = stk.pal;
    const animCls = opts.noAnim || frozen || locked ? '' : (' stk-anim-' + (stk.anim || 'bounce'));

    // 結凍冰塊覆蓋層（半透明六角冰晶＋冰封裂紋）
    const iceOverlay = frozen ? (
      `<rect x="3" y="3" width="58" height="58" rx="15" fill="rgba(165, 232, 255, 0.58)" stroke="#38bdf8" stroke-width="2.2"/>` +
      `<path d="M8 14L22 8M10 24L28 12M44 54L56 42" stroke="rgba(255,255,255,0.85)" stroke-width="2.5" stroke-linecap="round"/>` +
      `<g transform="translate(48,14)" stroke="#0284c7" stroke-width="1.8" stroke-linecap="round"><line x1="-5" y1="0" x2="5" y2="0"/><line x1="0" y1="-5" x2="0" y2="5"/><line x1="-3.5" y1="-3.5" x2="3.5" y2="3.5"/><line x1="3.5" y1="-3.5" x2="-3.5" y2="3.5"/></g>`
    ) : '';

    return `<svg class="pace-stk-svg${animCls}${frozen ? ' is-frozen' : ''}${locked ? ' is-locked' : ''}" viewBox="0 0 64 64" width="${size}" height="${size}" role="img" aria-label="${esc(stk.name)}">` +
      // 1. 和紙圓角印章底襯
      `<rect x="4" y="4" width="56" height="56" rx="16" fill="${pal.bg}" stroke="${pal.edge}" stroke-width="1.6" stroke-opacity=".28"/>` +
      // 2. 步調方塊森靈本體（圓潤時間方塊造形＋立體高光）
      `<g class="stk-actor">` +
        `<ellipse cx="32" cy="49" rx="15" ry="3.5" fill="rgba(0,0,0,.1)"/>` +
        `<rect x="13" y="14" width="38" height="33" rx="13" fill="${pal.body}" stroke="${pal.edge}" stroke-width="2.4"/>` +
        `<path d="M18 19c3-2 8-2.5 14-2.5" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="2.4" stroke-linecap="round"/>` +
        // 小手小腳
        `<circle cx="13" cy="34" r="3.6" fill="${pal.body}" stroke="${pal.edge}" stroke-width="2"/>` +
        `<circle cx="51" cy="34" r="3.6" fill="${pal.body}" stroke="${pal.edge}" stroke-width="2"/>` +
        // 3. 表情五官
        drawFace(stk.face, pal.edge, pal.cheek) +
        // 4. 主題道具／配件
        drawProp(stk.prop, pal) +
      `</g>` +
      // 5. 底部手寫風印記籤（讓每一張貼圖意義一目了然）
      `<g transform="translate(32,54)">` +
        `<rect x="-18" y="-6.5" width="36" height="11" rx="5.5" fill="${pal.edge}"/>` +
        `<text x="0" y="1.8" text-anchor="middle" font-size="7.8" font-weight="800" fill="#fff" letter-spacing=".04em">${esc(stk.tag || stk.name.slice(0, 3))}</text>` +
      `</g>` +
      iceOverlay +
    `</svg>`;
  }

  /* ---------- 解鎖與「久不動結凍」狀態計算引擎 ----------
     同時支援：
     1. paceStore（c-group.js 雲端／本地路徑 weeks/YYYY-MM-DD 與 tasks/id）
     2. state.week / state.db（主畫面即時狀態）
     3. 體感預覽模擬器（讓使用者隨時測試「閒置結凍🧊」與「破冰解凍🔥」效果） */
  let simMode = 'real'; // 'real' | 'idle2' | 'idle4' | 'idle6' | 'allopen'

  function scanProgress(real) {   // real = true ignores the preview mode (used when actually picking a sticker)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMs = +today;
    let totalDone = 0;
    let latestDoneMs = 0;
    const seenKeys = new Set();

    const recordDone = (key, dateStr) => {
      if (seenKeys.has(key)) return;
      seenKeys.add(key);
      totalDone++;
      if (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        const ms = +new Date(dateStr + 'T00:00:00');
        if (!isNaN(ms) && ms <= todayMs + 864e5 && ms > latestDoneMs) latestDoneMs = ms;
      }
    };

    // A. 從 paceStore 讀取所有週次與任務
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
                recordDone('b-' + monStr + '-' + b.id, ymd);
              }
            }
          } else if (/^tasks\/[^/]+$/.test(p) && d.done && !d.tour) {
            const tMs = Number(item.t) || 0;
            if (tMs > latestDoneMs) latestDoneMs = tMs;
            recordDone('t-' + p.slice(6), null);
          }
        }
      } catch (e) {}
    }

    // B. 從主程式 state.week 補充讀取（若在 A-next 或尚未寫入 paceStore 時）
    if (typeof state !== 'undefined' && state?.week?.blocks && state?.monday) {
      try {
        const mon = new Date(state.monday);
        const monStr = mon.getFullYear() + '-' + String(mon.getMonth() + 1).padStart(2, '0') + '-' + String(mon.getDate()).padStart(2, '0');
        for (const b of state.week.blocks) {
          if (b && b.done && !b.tour && b.cat !== 'buffer') {
            const bDate = new Date(mon);
            if (Number.isInteger(b.day)) bDate.setDate(bDate.getDate() + b.day);
            const ymd = bDate.getFullYear() + '-' + String(bDate.getMonth() + 1).padStart(2, '0') + '-' + String(bDate.getDate()).padStart(2, '0');
            recordDone('b-' + monStr + '-' + b.id, ymd);
          }
        }
      } catch (e) {}
    }

    // C. 本機紀錄的最後完成時間戳（剛打勾方塊時立即更新，確保破冰零延遲）
    const savedLast = Number(ls.get('pace-stk-last-done')) || 0;
    if (savedLast > latestDoneMs) latestDoneMs = savedLast;

    // 計算閒置天數 idleDays
    let idleDays = 0;
    if (totalDone > 0 && latestDoneMs > 0) {
      const lastDay = new Date(latestDoneMs);
      lastDay.setHours(0, 0, 0, 0);
      idleDays = Math.max(0, Math.floor((todayMs - +lastDay) / 864e5));
    }

    // 若使用者在面板開啟了「體感預覽模式」
    if (real) { /* actual progress only */ }
    else if (simMode === 'idle2') { totalDone = Math.max(totalDone, 35); idleDays = 4; }
    else if (simMode === 'idle4') { totalDone = Math.max(totalDone, 35); idleDays = 7; }
    else if (simMode === 'idle6') { totalDone = Math.max(totalDone, 35); idleDays = 10; }
    else if (simMode === 'allopen') { totalDone = Math.max(totalDone, 80); idleDays = 0; }

    // 結凍比例（寬鬆版）：閒置 <=3 天 0%；4–5 天 25%；6–7 天 50%；8–9 天 75%；>=10 天 100% 進階貼圖結凍
    const freezeRatio = idleDays <= 3 ? 0 : idleDays <= 5 ? 0.25 : idleDays <= 7 ? 0.50 : idleDays <= 9 ? 0.75 : 1.0;

    // 先找出所有已解鎖的進階貼圖（依 tier 由高到低排序，從最高階開始結凍）
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

  /* 當使用者完成方塊時，記錄最新活躍時間；若原本有結凍貼圖，觸發「破冰解凍」慶祝提示！ */
  function markActiveNow() {
    const before = scanProgress();
    const wasFrozen = before.frozenCount;
    ls.set('pace-stk-last-done', String(Date.now()));
    if (simMode !== 'real') simMode = 'real';
    if (wasFrozen > 0 && typeof window.toast === 'function') {
      setTimeout(() => {
        try { window.toast('🔥 破冰成功！你完成了方塊，結凍的 ' + wasFrozen + ' 款貼圖已全數回溫解凍！'); } catch (e) {}
      }, 600);
    }
    refreshPickers();
  }

  /* ---------- 聊天室訊息中的貼圖語法解析與渲染 ----------
     語法：[貼圖:名稱]（例如 [貼圖:笑]、[貼圖:讚]、[貼圖:拍手]）
     1. 符合 Firestore 規則（純文字 string <= 300 字，無額外欄位）
     2. 安全性：先對一般文字做 HTML 跳脫，再將合法的 [貼圖:名稱] 轉為原創 SVG，且絕不使用 <b> 標籤（確保 group-tests.cjs 的 !querySelector('b') 100% 通過） */
  const TOKEN_RE = /\[貼圖:([^\][\n]{1,12})\]/g;

  function renderChatMessage(rawText) {
    const str = String(rawText ?? '');
    if (!str.includes('[貼圖:')) return esc(str);

    // 檢查是否為「純貼圖訊息」（僅含 1～3 張貼圖與空白），若是則放大為動態大貼圖！
    const stripped = str.replace(TOKEN_RE, '').trim();
    const matches = [...str.matchAll(TOKEN_RE)];
    const validMatches = matches.filter(m => BY_NAME.has(m[1]));

    if (!stripped && validMatches.length >= 1 && validMatches.length <= 3 && validMatches.length === matches.length) {
      return '<div class="grp-stk-jumbo-row">' + validMatches.map(m => {
        const stk = BY_NAME.get(m[1]);
        return `<span class="grp-stk-jumbo" title="貼圖：${esc(stk.name)}">${svgOf(stk, { size: 74 })}<span class="grp-stk-cap">${esc(stk.name)}</span></span>`;
      }).join('') + '</div>';
    }

    // 圖文混排模式（像 Emoji 一樣穿插在文字中）
    let out = '', lastIdx = 0;
    for (const m of matches) {
      const idx = m.index;
      if (idx > lastIdx) out += esc(str.slice(lastIdx, idx));
      const stk = BY_NAME.get(m[1]);
      if (stk) {
        out += `<span class="grp-stk-inline" title="貼圖：${esc(stk.name)}">${svgOf(stk, { size: 30 })}</span>`;
      } else {
        out += esc(m[0]);
      }
      lastIdx = idx + m[0].length;
    }
    if (lastIdx < str.length) out += esc(str.slice(lastIdx));
    return out;
  }

  /* ---------- 注入貼圖系統專屬樣式 ---------- */
  const style = document.createElement('style');
  style.setAttribute('data-pace-ui', 'c-stickers.css');
  style.textContent = `
    .pace-stk-svg { display: inline-block; vertical-align: middle; overflow: visible; user-select: none; -webkit-user-select: none; }
    .pace-stk-svg .stk-actor { transform-origin: 32px 34px; }
    .pace-stk-svg.stk-anim-bounce .stk-actor { animation: paceStkBounce 2.2s ease-in-out infinite; }
    .pace-stk-svg.stk-anim-wiggle .stk-actor { animation: paceStkWiggle 2.4s ease-in-out infinite; }
    .pace-stk-svg.stk-anim-pulse .stk-actor { animation: paceStkPulse 2s ease-in-out infinite; }
    .pace-stk-svg.stk-anim-float .stk-actor { animation: paceStkFloat 2.8s ease-in-out infinite; }
    .pace-stk-svg.stk-anim-clap .stk-actor { animation: paceStkClap 1.4s ease-in-out infinite; }
    .pace-stk-svg.stk-anim-nod .stk-actor { animation: paceStkNod 2s ease-in-out infinite; }
    .pace-stk-svg.stk-anim-pop .stk-actor { animation: paceStkPop 2.4s cubic-bezier(.2,1.4,.4,1) infinite; }
    @keyframes paceStkBounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px) scale(1.03, .98); } }
    @keyframes paceStkWiggle { 0%, 100% { transform: rotate(0deg); } 25% { transform: rotate(-5deg); } 75% { transform: rotate(5deg); } }
    @keyframes paceStkPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.06); } }
    @keyframes paceStkFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3.5px); } }
    @keyframes paceStkClap { 0%, 100% { transform: scaleX(1); } 50% { transform: scaleX(1.08) translateY(-1.5px); } }
    @keyframes paceStkNod { 0%, 100% { transform: translateY(0) rotate(0); } 40% { transform: translateY(2px) rotate(3deg); } }
    @keyframes paceStkPop { 0%, 85%, 100% { transform: scale(1); } 40% { transform: scale(1.07) translateY(-2px); } }
    @media (prefers-reduced-motion: reduce) { .pace-stk-svg .stk-actor { animation: none !important; } }
    body.nofx .pace-stk-svg .stk-actor { animation: none !important; }

    /* 聊天室內的貼圖呈現 */
    .grp-stk-jumbo-row { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; padding: 4px 2px; }
    .grp-stk-jumbo { display: inline-flex; flex-direction: column; align-items: center; gap: 2px; transition: transform .2s ease; }
    .grp-stk-jumbo:hover { transform: scale(1.08); }
    .grp-stk-cap { font-size: .7rem; color: var(--muted); font-weight: 600; }
    .grp-stk-inline { display: inline-flex; align-items: center; vertical-align: middle; margin: 0 2px; }

    /* 聊天室常用貼圖快捷列 & 貼圖抽屜 */
    .grp-stk-quick { display: flex; align-items: center; gap: 5px; overflow-x: auto; padding: 2px 0 4px; scrollbar-width: thin; }
    .grp-stk-qbtn { flex: none; display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px 3px 4px; border-radius: 999px; border: 1px solid var(--line); background: var(--panel-2); color: var(--fg); font-size: .76rem; cursor: pointer; transition: transform .15s, border-color .15s, background .15s; }
    .grp-stk-qbtn:hover { border-color: var(--accent); background: var(--accent-soft); transform: translateY(-1px); }
    .grp-stk-drawer { border: 1.5px solid var(--line); border-radius: 14px; background: var(--panel); padding: 10px; display: flex; flex-direction: column; gap: 8px; box-shadow: 0 8px 28px rgba(0,0,0,.12); }
    .grp-stk-drawer[hidden] { display: none !important; }
    .grp-stk-thermo { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 6px 10px; padding: 7px 10px; border-radius: 10px; background: var(--panel-2); font-size: .78rem; border-left: 3.5px solid var(--accent); }
    .grp-stk-thermo.is-chilly { border-left-color: #38bdf8; background: color-mix(in srgb, #38bdf8 10%, var(--panel-2)); }
    .grp-stk-thermo.is-frozen { border-left-color: #0284c7; background: color-mix(in srgb, #0284c7 14%, var(--panel-2)); }
    .grp-stk-thermo-badge { font-weight: 800; display: inline-flex; align-items: center; gap: 4px; }
    .grp-stk-tools { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
    .grp-stk-search { flex: 1 1 130px; min-width: 0; padding: 5px 9px; border-radius: 8px; border: 1px solid var(--line); background: var(--panel-2); color: var(--fg); font-size: .8rem; }
    .grp-stk-tabs { display: flex; gap: 4px; overflow-x: auto; padding-bottom: 3px; scrollbar-width: thin; }
    .grp-stk-tab { flex: none; padding: 4px 9px; border-radius: 999px; border: 1px solid var(--line); background: var(--panel-2); color: var(--fg); font-size: .76rem; font-weight: 600; cursor: pointer; white-space: nowrap; }
    .grp-stk-tab.on { background: var(--accent); color: #fff; border-color: var(--accent); }
    .grp-stk-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(72px, 1fr)); gap: 6px; max-height: 220px; overflow-y: auto; padding: 2px; }
    .grp-stk-cell { position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; padding: 6px 4px 4px; border-radius: 11px; border: 1px solid var(--line-soft, var(--line)); background: var(--panel-2); cursor: pointer; transition: transform .15s, border-color .15s, background .15s; }
    .grp-stk-cell:hover { border-color: var(--accent); background: var(--accent-soft); transform: translateY(-2px); }
    .grp-stk-cell.frozen { background: color-mix(in srgb, #38bdf8 12%, var(--panel-2)); border-color: rgba(56, 189, 248, .45); }
    .grp-stk-cell.locked { filter: grayscale(.92); opacity: .52; }
    .grp-stk-cell.shake { animation: paceStkIceShake .4s ease; }
    @keyframes paceStkIceShake { 20% { transform: translateX(-4px) rotate(-4deg); } 40% { transform: translateX(4px) rotate(4deg); } 60% { transform: translateX(-3px); } 80% { transform: translateX(3px); } }
    .grp-stk-cname { font-size: .7rem; font-weight: 600; color: var(--fg); max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .grp-stk-cbadge { position: absolute; top: 3px; right: 3px; font-size: .64rem; line-height: 1; padding: 2px 4px; border-radius: 99px; background: rgba(15, 23, 42, .72); color: #fff; font-weight: 700; }
    .grp-stk-cbadge.starter { background: var(--accent); }
    .grp-stk-cbadge.ice { background: #0284c7; }
    .grp-stk-foot { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 6px; font-size: .74rem; color: var(--muted); }
  `;
  document.head.appendChild(style);

  /* ---------- 掛載至群組聊天室 (#grpRoom) 與成就圖鑑 (#xpDlg) ---------- */
  let activeCat = 'starter';
  let searchQuery = '';
  let directSend = false; // false = 點擊插入輸入框（像 Emoji 可連打與配字）；true = 點擊直接送出貼圖
  const pickerInstances = [];

  function refreshPickers() {
    pickerInstances.forEach(fn => { try { fn(); } catch (e) {} });
  }

  function buildStickerPickerUI(hostEl, onPickSticker) {
    const wrap = document.createElement('div');
    wrap.className = 'grp-stk-wrap';
    wrap.innerHTML =
      // 1. 常用基本貼圖快捷列（笑、讚、拍手、加油、OK、感謝、搞定、休息）
      `<div class="grp-stk-quick" aria-label="基本常用貼圖快捷列"></div>` +
      // 2. 展開式 240 款原創貼圖抽屜
      `<div class="grp-stk-drawer" hidden>` +
        `<div class="grp-stk-thermo">` +
          `<span class="grp-stk-thermo-badge"></span>` +
          `<span class="grp-stk-thermo-counts"></span>` +
        `</div>` +
        `<div class="grp-stk-tools">` +
          `<input type="search" class="grp-stk-search" placeholder="搜尋 240 款貼圖（如：笑、讚、拍手、讀書、珍奶、貓…）" aria-label="搜尋貼圖">` +
          `<label class="check" style="font-size:.76rem;flex-direction:row;gap:4px;margin:0;white-space:nowrap"><input type="checkbox" class="grp-stk-direct"> 點擊直接送出</label>` +
          `<select class="grp-stk-sim" aria-label="貼圖狀態預覽" style="font-size:.74rem;padding:4px 6px;border-radius:7px;border:1px solid var(--line);background:var(--panel-2);color:var(--fg)">` +
            `<option value="real">🌡️ 實際進度</option>` +
            `<option value="idle2">❄️ 預覽：4天不動(微凍)</option>` +
            `<option value="idle4">🧊 預覽：7天不動(半凍)</option>` +
            `<option value="idle6">🧊 預覽：10天+不動(全凍)</option>` +
            `<option value="allopen">✨ 預覽：全解鎖回溫</option>` +
          `</select>` +
        `</div>` +
        `<div class="grp-stk-tabs" role="tablist"></div>` +
        `<div class="grp-stk-catdesc hint" style="margin:0;font-size:.75rem"></div>` +
        `<div class="grp-stk-grid" role="listbox" aria-label="原創貼圖列表"></div>` +
        `<div class="grp-stk-foot">` +
          `<span class="grp-stk-status-msg">🌱 初始 24 款基本貼圖永久可用；完成方塊可解鎖新貼圖並為結凍貼圖破冰！</span>` +
        `</div>` +
      `</div>`;

    hostEl.appendChild(wrap);
    const quickBar = wrap.querySelector('.grp-stk-quick');
    const drawer = wrap.querySelector('.grp-stk-drawer');
    const thermo = wrap.querySelector('.grp-stk-thermo');
    const thermoBadge = wrap.querySelector('.grp-stk-thermo-badge');
    const thermoCounts = wrap.querySelector('.grp-stk-thermo-counts');
    const searchIn = wrap.querySelector('.grp-stk-search');
    const directChk = wrap.querySelector('.grp-stk-direct');
    const simSel = wrap.querySelector('.grp-stk-sim');
    const tabsBox = wrap.querySelector('.grp-stk-tabs');
    const catDesc = wrap.querySelector('.grp-stk-catdesc');
    const gridBox = wrap.querySelector('.grp-stk-grid');
    const statusMsg = wrap.querySelector('.grp-stk-status-msg');

    // 快捷列固定放最常用的 10 款初始不結凍貼圖
    const QUICK_IDS = ['st_smile', 'st_laugh', 'st_thumb', 'st_clap', 'st_cheer', 'st_ok', 'st_thanks', 'st_love', 'st_done', 'st_rest'];
    quickBar.innerHTML = QUICK_IDS.map(id => {
      const s = BY_ID.get(id);
      return `<button type="button" class="grp-stk-qbtn" data-qstk="${esc(s.id)}" title="貼圖：${esc(s.name)}（初始基本貼圖・永不結凍）">${svgOf(s, { size: 22, noAnim: true })}<span>${esc(s.name)}</span></button>`;
    }).join('');

    quickBar.addEventListener('click', e => {
      const b = e.target.closest('[data-qstk]');
      if (!b) return;
      const stk = BY_ID.get(b.dataset.qstk);
      if (stk) onPickSticker(stk, directSend, statusMsg);
    });

    function paint() {
      const prog = scanProgress();
      simSel.value = simMode;
      directChk.checked = directSend;

      // 溫度計狀態列
      thermo.classList.toggle('is-chilly', prog.idleDays >= 4 && prog.idleDays <= 9);
      thermo.classList.toggle('is-frozen', prog.idleDays >= 10);
      if (prog.idleDays <= 1) {
        thermoBadge.textContent = '🔥 暖心活躍中（貼圖全數回溫）';
      } else if (prog.idleDays <= 3) {
        thermoBadge.textContent = `🌤️ 休息 ${prog.idleDays} 天也沒關係（第 4 天起才會慢慢結凍）`;
      } else if (prog.idleDays <= 9) {
        thermoBadge.textContent = `❄️ 閒置 ${prog.idleDays} 天・寒霜蔓延（${prog.frozenCount} 款貼圖結凍中）`;
      } else {
        thermoBadge.textContent = `🧊 閒置 ${prog.idleDays} 天・深度結凍（進階貼圖冰封，剩基本貼圖可用）`;
      }
      thermoCounts.textContent = `可用 ${prog.usableCount} 款 · 🧊結凍 ${prog.frozenCount} 款 · 🔒待解鎖 ${prog.lockedCount} 款（共 ${prog.total} 款｜已完成 ${prog.totalDone} 格）`;

      // 分類頁籤
      tabsBox.innerHTML = CATEGORIES.map(c => {
        const list = STICKERS.filter(s => s.cat === c.id);
        const usableInCat = list.filter(s => prog.itemState.get(s.id)?.usable).length;
        return `<button type="button" class="grp-stk-tab${activeCat === c.id && !searchQuery ? ' on' : ''}" data-stkat="${c.id}">${c.icon} ${esc(c.name)} <small>(${usableInCat}/${list.length})</small></button>`;
      }).join('');

      const curCatObj = CATEGORIES.find(c => c.id === activeCat) || CATEGORIES[0];
      const q = searchQuery.trim().toLowerCase();
      catDesc.textContent = q
        ? `🔍 搜尋「${searchQuery}」的結果：`
        : `${curCatObj.icon} ${curCatObj.name}：${curCatObj.desc}`;

      const shown = q
        ? STICKERS.filter(s => s.name.toLowerCase().includes(q) || s.tag.toLowerCase().includes(q))
        : STICKERS.filter(s => s.cat === activeCat);

      gridBox.innerHTML = shown.length ? shown.map(s => {
        const st = prog.itemState.get(s.id) || { unlocked: true, frozen: false, usable: true, needMore: 0 };
        const cls = st.frozen ? ' frozen' : (!st.unlocked ? ' locked' : '');
        const badge = s.neverFreeze
          ? `<span class="grp-stk-cbadge starter" title="初始基本貼圖・永不結凍">常駐</span>`
          : st.frozen
            ? `<span class="grp-stk-cbadge ice" title="久未完成方塊而結凍">🧊凍</span>`
            : !st.unlocked
              ? `<span class="grp-stk-cbadge" title="累積完成 ${s.reqDone} 個方塊解鎖">🔒${s.reqDone}格</span>`
              : '';
        const tip = st.usable
          ? `點擊使用「${s.name}」貼圖`
          : st.frozen
            ? `🧊「${s.name}」因閒置 ${prog.idleDays} 天而結凍！完成 1 個方塊即可破冰解凍`
            : `🔒「${s.name}」尚未解鎖：再完成 ${st.needMore} 個方塊即可解鎖（需累積 ${s.reqDone} 格）`;
        return `<button type="button" class="grp-stk-cell${cls}" data-stkid="${s.id}" title="${esc(tip)}">` +
          badge +
          svgOf(s, { size: 50, frozen: st.frozen, locked: !st.unlocked }) +
          `<span class="grp-stk-cname">${esc(s.name)}</span>` +
        `</button>`;
      }).join('') : `<p class="hint" style="grid-column:1/-1;margin:8px 0">找不到符合「${esc(searchQuery)}」的貼圖，試試其他關鍵字吧！</p>`;
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

    directChk.addEventListener('change', () => {
      directSend = directChk.checked;
    });

    simSel.addEventListener('change', () => {
      simMode = simSel.value;
      refreshPickers();
    });

    gridBox.addEventListener('click', e => {
      const cell = e.target.closest('[data-stkid]');
      if (!cell) return;
      const stk = BY_ID.get(cell.dataset.stkid);
      if (!stk) return;
      // preview modes only change how the album looks; what can really be sent follows actual progress
      const prog = scanProgress(true);
      const st = prog.itemState.get(stk.id);
      if (simMode !== 'real' && !st?.usable) {
        cell.classList.remove('shake'); void cell.offsetWidth; cell.classList.add('shake');
        statusMsg.textContent = `👀 這是預覽畫面。「${stk.name}」實際上${st?.unlocked ? '還在結凍中' : '還沒解鎖'}，切回「🌡️ 實際進度」看看目前能用哪些。`;
        return;
      }
      if (!st?.unlocked) {
        cell.classList.remove('shake'); void cell.offsetWidth; cell.classList.add('shake');
        statusMsg.textContent = `🔒「${stk.name}」尚未解鎖！再完成 ${st.needMore} 個方塊（累積 ${stk.reqDone} 格）就能解鎖這款貼圖。`;
        return;
      }
      if (st.frozen) {
        cell.classList.remove('shake'); void cell.offsetWidth; cell.classList.add('shake');
        statusMsg.textContent = `🧊「${stk.name}」因為 ${prog.idleDays} 天沒動而結凍了！去完成 1 個方塊就能破冰解凍，或先用「🌱 基本常用」貼圖（笑、讚、拍手）～`;
        return;
      }
      onPickSticker(stk, directSend, statusMsg);
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
    stkBtn.title = '開啟原創貼圖與表情面板（240 款）';
    stkBtn.innerHTML = '😊 貼圖';
    actsRow.insertBefore(stkBtn, sendBtn);

    const pickerHost = document.createElement('div');
    actsRow.before(pickerHost);

    const picker = buildStickerPickerUI(pickerHost, (stk, isDirect, statusMsg) => {
      const token = `[貼圖:${stk.name}]`;
      if (isDirect) {
        const prev = msgIn.value;
        msgIn.value = token;
        sendBtn.click();
        // 若因尚未決定公開設定等原因未送出，保留之
        if (msgIn.value === token && prev) msgIn.value = prev + ' ' + token;
        statusMsg.textContent = `✨ 已傳送貼圖「${stk.name}」！`;
      } else {
        const cur = msgIn.value;
        const sep = cur && !cur.endsWith(' ') ? ' ' : '';
        if ((cur + sep + token).length <= 300) {
          msgIn.value = cur + sep + token;
          msgIn.focus();
          statusMsg.textContent = `已插入「${stk.name}」${token}，可繼續打字或按「送出」！`;
        } else {
          statusMsg.textContent = '訊息字數已滿（上限 300 字）。';
        }
      }
    });

    stkBtn.addEventListener('click', () => {
      const open = picker.toggle();
      stkBtn.setAttribute('aria-expanded', String(open));
      stkBtn.classList.toggle('primary', open);
    });
  }

  /* 也在「等級與成就 (#xpDlg)」中加入原創 240 貼圖圖鑑與結凍狀態預覽，方便未登入時隨時賞玩 */
  function attachToXpDialog() {
    const albumBox = document.getElementById('xpAlbum');
    if (!albumBox || document.getElementById('xpChatStkWrap')) return;
    const sec = document.createElement('div');
    sec.id = 'xpChatStkWrap';
    sec.innerHTML = `<h3 class="set-h">聊天室原創貼圖庫（10 大類 240 款・解鎖與結凍制度）</h3>` +
      `<p class="hint" style="margin:0 0 6px">初始贈送 24 款基本貼圖（笑、讚、拍手等）永不結凍；完成方塊可解鎖全部 240 款原創「方塊森靈」貼圖。若太久沒完成方塊，進階貼圖會逐步結凍🧊，再完成方塊即可破冰回溫！</p>`;
    albumBox.after(sec);
    const p = buildStickerPickerUI(sec, (stk, _isDirect, statusMsg) => {
      statusMsg.textContent = `✨「${stk.name}」（${CATEGORIES.find(c => c.id === stk.cat)?.name}）目前已解鎖且暖心可用！在群組聊天室點選即可傳送。`;
    });
    p.drawer.hidden = false;
  }

  /* 監聽方塊完成事件以觸發破冰回溫與即時解鎖 */
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
    status: scanProgress,
    renderChatMessage,
    attachToGroupRoom,
    refresh: refreshPickers
  };

  attachToGroupRoom();
  attachToXpDialog();
  addEventListener('DOMContentLoaded', () => { attachToGroupRoom(); attachToXpDialog(); });
})();

