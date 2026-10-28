# 步調 Pace：2026-10-28 新版功能盤點與 UI 相容性矩陣

盤點對象是本次新 ZIP 的 `block-planner-20261028/block-planner-main`，本機基準提交 `58b4dc7`。上傳前已確認其整個 Git tree 與遠端提交 `cdbcd796024494c799dfdca162c267af351a373b` 完全相同；公開測試腳本採用此遠端基準。本文件不沿用 10 月 27 日舊專案的缺項結論，不包含真實使用者資料、API Key 或登入憑證。

**「已有」代表原始碼存在對應實作，不代表外部服務、真機及每一種操作已完成測試。** 實際測試證據須另看本次測試報告。需求附件最後停在第八章 Phase 1 的「4. 盤」，未臆測後續內容。

## 版本、架構與隔離範圍

| 問題 | 確認結果與證據 |
| --- | --- |
| A 原始碼 | `a-source/planner.html`：原生 HTML/CSS/JavaScript 單頁應用，核心排程、拖曳、任務、專注、報表都在此。 |
| C 原始碼與輸出 | `pace-build/build-c.js` 從 A 讀入 HTML，精確替換 C 的設定／文字並注入 `c-shim.js`、`c-sync.js`、`c-group.js`、`c-i18n.js`、`c-install.js`、`c-persona.js`、`c-tour.js`；輸出 `pace-planner/index.html`。 |
| UI 是否共用 | C 建置時複用 A 的 DOM/CSS，沒有獨立 React/Vue 元件。C 專用 UI 應最後注入，保留原元素和事件，不修改 A 原始檔。 |
| 演算法是否共用 | 是。A 核心中包含 ripple、跨午夜、任務／目標、專注與報表。C 建置器另外設定顯示時段與作息；不能沿用舊版硬編碼的 08:00–23:30。 |
| 儲存是否共用 | API 形狀共用 `window.claude.use('db')`；實際後端不同。A 使用宿主資料服務；C `c-shim.js:6` 使用 `pace-db-v1` localStorage 和 `pace-db-meta` 文件時間戳。 |
| 設定與同步 | C 的 `c-sync.js:54` 提供 `paceSync`，以 Firebase Auth 與 Firestore 選用同步；`c-group.js` 依賴它。C 的作息／身份／語言等亦有裝置 localStorage 偏好。 |
| Android | 有 `pace-apk/` Gradle/Java TWA，含 `PaceWidget` 快捷小工具、`PaceTodayWidget` 今日行程、`TodayData`、登入連結 Activity。此次 UI 不改原生版本、簽署或功能。 |
| PWA | 有 `pace-planner/manifest.json` 與 `sw.js`；service worker 同來源 GET 採 network-first，失敗回快取；保留 manifest、start URL、hash 入口與 APK 資產。 |
| 原有測試 | `a-source/harness/{build.js,tests.js,contrast.js,serve.js}` 與 `pace-apk/app/src/test/java/app/pace/planner/TodayDataTest.java`。Harness 依賴的外部 fixture 與 Android emulator 需求必須確認，不能只因檔案存在宣稱通過。 |

引用縮寫：`A` = `a-source/planner.html`；`B` = `pace-build/build-c.js`；`S` = `pace-build/c-shim.js`；`Y` = `pace-build/c-sync.js`；`G` = `pace-build/c-group.js`；`I` = `pace-build/c-install.js`；`P` = `pace-build/c-persona.js`；`T` = `pace-build/c-tour.js`。冒號後為盤點時的一起始行號；函式／ID 名稱提供穩定搜尋依據。

## A. 排時間

| 需求 | 原版狀態 | 程式證據與需保留的語意 |
| --- | --- | --- |
| 方塊新增、改名、刪除 | 已有 | `A:1845 openBlock`、`A:1908 openModule`、`dlgForm`／`modForm`；刪除可復原。 |
| 桌面拖曳 | 已有 | `A:1705` 起 pointer 事件、`dropTarget`、`placeNew`。 |
| 手機長按拖曳 | 已有 | `A:1725` 後 touch 長按 320ms 啟動；快速移動用來捲動。 |
| 點擊方塊排程 | 已有 | `A:1908 openModule` 與 `mPut`；選星期／時間直接排入。另可點空白時段選模組。 |
| 修改時間 | 已有 | `A:1886 dlgForm`，時間與分鐘數保存後調用跨日／ripple。 |
| 底部拉伸長度 | 已有 | `A:1760` resize branch；pointerup 調用 `spillPastMidnight`。 |
| 即時增加分鐘數 | 已有 | `A:1772 rzTip` 顯示加減分鐘／小時、總長度及隔日時間。 |
| 整點吸附 | 已有，語意有限 | `A:1765` 拉伸「增量」接近 60 分鐘倍數時吸附；一般拖曳仍為 5 分鐘吸附，不是每次都吸到鐘面整點。 |
| 跨午夜排程 | 已有 | `A:1089 spillPastMidnight` 把超出 `END` 的部分另建「（續）」方塊，接隔日 00:00。編輯／拉伸有接入；不代表任意任務輸入都會自動分割。 |
| 週日接下週一 | 已有 | `A:1096`、`addToWeek` 寫入下一週週一文件；保留不同週資料的讀寫與快取失效。 |
| 自動避讓後續方塊 | 已有 | `A:1039 ripple` 避開固定與已完成方塊，放不下時嘗試後日緩衝／空檔；無空檔會提示。 |
| 完成／未完成 | 已有 | `A:1445 toggleDone`、`toggleFail`，與 taskId、取消及群組完成發佈相容。 |
| 固定行程 | 已有 | `A:1012 fixedFor`、`newFixForm`；週期、特殊行程、假日、回收紀錄。 |
| 單週取消固定行程 | 已有 | `A:2362 skipFixed` 與 `state.week.skipFixed`，可還原／轉為可移動方塊。 |
| 未完成一鍵重排 | 已有 | `A:2089 replan`，先用未來緩衝再找空檔。 |
| 週範本 | 已有 | `A:2025` 起 renderTemplates／tplForm／maybeAutofill；預設範本只在適用週自動填入。 |
| 複製上週 | 已有 | `A:1989 copyPrev`，保留原有排程並複製不連任務的方塊。 |
| 台灣國定假日 | 部分／資料依賴 | `A:1006 holidayOf` 能呈現 `config.holidays` 並調整固定行程；新 C 預設 `S:17 holidays:[]`。未找到完整國定假日資料表或自動抓取官方日曆；不得宣稱新裝就已具備所有國定假日。 |
| 自訂作息 | 已有〔C〕 | `B:212–255`：顯示起迄時間、睡覺時間，夜間提示與推薦跟著設定。 |
| 自訂時間表顯示範圍 | 已有〔C〕 | `PACE_HOURS`、`pace-day-from`（0–12 時）、`pace-day-to`（14–24 時）；預設 06:00–24:00，變更後 reload。 |
| 身份預設四個方塊 | 已有〔C〕 | `P:7–14 PERSONAS` 六種身份各四個方塊，另有空白身份；只替換模組清單，既有時間表保留。 |

跨午夜的既有限制：續段在 00:00；當使用者設定 `START > 0`，續段仍保存但不在可見範圍內，原程式有說明。`END` 可早於 24:00 時，分割仍依 `END` 計算並接隔日 00:00，這是原有核心行為，UI 改版不可私自更改。

## B. 任務與目標

| 需求 | 原版狀態 | 程式證據與需保留的語意 |
| --- | --- | --- |
| Enter 快速新增 | 已有 | `A:2169 quickAdd`、`parseQuick`，可解析日期／截止日／時間／分鐘／每週重複。 |
| 任務延後顯示 | 已有 | `A:1032 visibleTasks`／`laterTasks` 依 `showFrom` 與所選週判定。 |
| 任務拖入時間表 | 已有 | `data-drag="task:…"` 與 `dragInfo`，保留 taskId。 |
| 目標建立 | 已有 | `A:2755 goalForm`，手動或 AI 步驟。 |
| 目標期限 | 已有 | `goalDue`、`weeksUntil`、`A:2708 renderGoals` 期限／進度。 |
| 每週小步驟 | 已有 | goalSteps 支援 `週N｜`、分鐘數及每週分配。 |
| 自動產生當週任務 | 已有 | 建目標時一次產生帶 showFrom／due 的任務，各週依原規則顯示。 |
| 願望清單 | 已有 | `A:2387 renderWishes`、`wishForm`、刪除／復原。 |
| 願望一鍵排程 | 已有 | `A:2406 data-wplace`，另可拖入網格。 |

原版沒有獨立的「編輯既有目標」表單，也沒有完整任務詳情編輯表單。重新組織入口時，不能用沒有接上邏輯的詳情頁冒充既有功能。

## C. 專注

| 需求 | 原版狀態 | 程式證據與需保留的語意 |
| --- | --- | --- |
| 現在做這件 | 已有 | `A:2638 nowCandidates`／`renderNowPick`，按優先順序選候選；既有 npAct／npNext。 |
| 腦袋累了 | 已有 | `A:2628 tiredNow`、`npTired`，裝置偏好使推薦切輕量，可恢復一般。 |
| 夜間輕量推薦 | 已有 | A 21:30 後；C `B:239–241` 改依睡覺時間前 2.5 小時與疲勞狀態。未設定睡覺時間時不能臆稱固定夜間時段。 |
| 番茄鐘 | 已有 | `A:2198–2314`：單次／分段、work／break、跳過休息、實際專注分鐘、刷新恢復、結束心得。 |
| 專注筆記 | 已有 | `A:2302 fNoteForm`：念頭直接新增為 15 分鐘 life 任務，計時不中斷；另有結束後反思文字。不是獨立筆記資料庫。 |
| 生病了一鍵跳過 | 已有 | `A:1693 doSkipAll`：指定日未完成方塊標 skipped，不計入達成率，可復原。 |
| 開始提醒 | 已有 | `A:1464 checkReminders`，開始前五分鐘及開始時，頁面開啟時運作。 |
| 提醒鈴聲 | 已有 | NOTIFY／SOUNDS、playAlarmSound、設定選擇及試聽。 |
| 多分頁只提醒一次 | 已有機制 | `A:1589 ringOnce` 以 localStorage 相同訊息鍵 60 秒去重，背景分頁延遲 1.5 秒；它不是跨程序原子鎖，不能宣稱所有競態下絕不重複。 |
| 開始 | 已有 | startFocus／startTaskFocus、npAct、dFocus、data-tfocus。 |
| 暫停／繼續 | **基準版缺少；本次 C 介面新增** | 原 focus state 只有 work／break；原 `fStop` 保持結束／記錄並開心得。本次 `pace-build/notion-focus-clock.js` 與 `notion-focus.js` 使用獨立 `pace-ui-focus-pause-v1` 的 `{start,at}` 暫停記錄，C 組建將三處計時取值導向 pause clock。繼續時只平移既有 start/segStart/segEnd/end，doneMs 不變，原 `planner-focus` 欄位及 A 檔不變。支援專注／休息暫停、刷新恢復、暫停中結束的實際分鐘數；暫停時需先繼續才能略過休息。`scripts/focus-pause-tests.cjs` 15/15 確定性測試通過，瀏覽器整合另驗。 |
| 結束 | 已有 | `fDone`／`fStop` 調用 `finishFocus`，保留完成與停止語意。 |
| 獨立手機專注頁 | UI 新需求 | 可用現有 wFocus、fNoteForm、nowPick 建立展示分頁；不得產生第二套計時器或改寫 focus 儲存格式。 |

## D. 共筆群組〔C〕

全部功能依賴原有 Firebase 設定與登入，以下為原始碼／規則確認，**未聲稱已連正式帳號驗證**。

| 需求 | 原版狀態 | 程式證據與需保留的語意 |
| --- | --- | --- |
| 建立群組 | 已有 | `G:127 grpNew`，建立 groups 文件。 |
| 邀請碼 | 已有 | `G:11 newCode` 產生八字元碼，群組 ID 即邀請碼。 |
| 邀請連結 | 已有 | `G:149` 起邀請處理，系統分享／剪貼簿／文字退路。 |
| 加入群組 | 已有 | `G:135 join`，輸入碼或待處理邀請；有加入確認。 |
| 完成動態 | 已有 | `G:194 doneIn`／`G:207 paceStore.onWrite`，方塊／任務由未完成轉完成才發佈。 |
| 拍拍 | 已有 | `G:173 grpFeed` 使用 cheers 自己的 UID 欄位。 |
| 被拍提醒 | 已有 | `G:66 listen` 比對 cheersSeen，初始同步不轟炸提醒。 |
| 七日動態卡片 | 已有 | `G:102 render`，近七日、畫面最多 30 筆；每群組查詢最多 40 筆。 |
| 隱藏任務名稱 | 已有 | `pace-group-hide` 使新發佈 title 為空字串。 |
| 只分享完成分鐘 | 已有 | 同上，仍包含姓名／完成時間／分鐘等原本允許資訊。 |
| 完全不分享 | 已有，影響新動態 | `pace-group-share='0'` 阻止後續完成發佈；不會自動刪除以前已分享內容。 |
| 取消完成撤回動態 | 已有 | `G:218` 比對原本已完成項目消失，刪除相同 event ID。 |
| 登入才能使用 | 已有 | `paceSync.onUser`、`busy` guard、Firestore signedIn/member 規則。 |
| 30 人上限 | 已有 | `pace-build/firestore.rules:13 okMembers` 由規則限制不超過 30 且無重複。 |
| 退出群組 | 已有 | `G:163` 原生 confirm，再移除自己 UID／名字。舊動態依原行為保留。 |
| 私人時間表不可互看 | 規則與資料路徑有隔離 | `users/{uid}/docs/{doc}` 只允許自己的 UID；群組 feed 建立欄位白名單僅 uid/name/title/minutes/at/cheers。不可把整個週文件、AI Key 或同步 token 放入新群組 UI。 |

不得在 UI 層繞過 paceStore.onWrite 直接分享；不得把 `grpShare`／`grpHide` 重新初始化成展示預設；不得用模擬群組成功訊息冒充服務回應。

## E. 報表與 AI

| 需求 | 原版狀態 | 程式證據與需保留的語意 |
| --- | --- | --- |
| 每週完成統計 | 已有 | `A:1367 renderReport`，亦有日／月；已取消與尚未到時間的分母規則保留。 |
| 分類時間統計 | 已有 | `A:1310 renderStats` 與時數檢視；各科與類別不同。 |
| 每週回顧 | 已有 | `renderReview`、星空、反思列表、完成與目標比率。 |
| 教練卡片開關 | 已有 | `A:2834 COACH_DEFAULT`／`syncCoach`／prefCoach；C `B:258` 預設關閉。UI 不得以 display 規則強制顯示原隱藏卡。 |
| Claude | 已有〔C〕 | `S:59 PROVIDERS`、askAnthropic。 |
| Gemini | 已有〔C〕 | 同上、askGemini。 |
| ChatGPT | 已有 OpenAI API 選項 | askOpenAiLike 使用 OpenAI API；不是登入 ChatGPT 帳號或使用 ChatGPT 訂閱額度。 |
| DeepSeek | 已有〔C〕 | PROVIDERS、askOpenAiLike。 |
| 使用者自己的 API Key | 已有〔C〕 | paceAi 每供應商獨立 key/model，設定可存／移除／自訂模型。金鑰不可放進 URL、群組、截圖、console 或報告。 |

## F. 小視窗

| 需求 | 原版狀態 | 程式證據與需保留的語意 |
| --- | --- | --- |
| 便利貼 | 已有 | `setWidget`、body.w、#widget。 |
| 現在與下一件事 | 已有 | `A:1325 renderWidget`，目前行程與後續清單。 |
| 五次點擊返回 | 已有 | `A:2601 tapCount`；按鈕／input／連結等不計入五次點擊。 |
| Android 桌面捷徑 | 已有 | `PaceWidget.java:24`、B:284，#widget/#add/#focus。 |
| Android 今日行程小工具 | 已有 | `PaceTodayWidget.java`、`TodayData.java`、WidgetLinkActivity、Y 的 widgetLink。需真機或 emulator 另驗證。 |

## G. 資料

| 需求 | 原版狀態 | 程式證據與需保留的語意 |
| --- | --- | --- |
| 匯出備份 | 已有 | `A:2923 exportAll`，保留 app/exportedAt/config/weeks/tasks/wishes/templates/notes/goals/closures 格式。 |
| 匯入備份 | 已有〔C〕 | `I:52–74`，驗證 JSON，明確確認取代後才執行。不得對真實資料跑測試。 |
| 手機分享選單 | 已有 | `S:154–162`，coarse pointer 且 canShareFile 時調 navigator.share。 |
| 不支援隱藏按鈕 | 已有 | `A:2967` 隱藏 exportAll/backupHint；S 在無下載亦無分享能力時回 null。 |
| 14 天備份提醒 | 已有，有條件 | `I:76–90`：僅 fine pointer 電腦、未登入同步、有資料、距最近備份或初次紀錄超過 14 天，每天最多一次；手機不彈。 |
| Google 登入 | 已有 | `Y:107` popup 與 redirect fallback。 |
| Email 登入 | 已有 | `Y:113`，另有註冊與密碼重設。 |
| 多裝置同步 | 已有 | `Y:55` 起，文件 `{p,t,d,del}` 以時間戳比較；IndexedDB 快取由 Firebase SDK 管理。 |
| 刪除全部資料 | **部分：原入口不是全域清庫** | `A:2934 wipeAll` 要輸入「刪除」，僅刪 weeks/tasks/wishes/templates/notes，config 可選；**goals/closures 不在此迴圈**，群組資料也不同路徑。`Y:117 syncWipe` 另有雲端私人 docs 刪除確認。UI 改版不擴大刪除範圍，不改稱會清除所有群組與設定。 |

## H. 安裝 App

| 需求 | 原版狀態 | 程式證據與需保留的語意 |
| --- | --- | --- |
| Android APK | 已有 | I 的 pace.apk 下載、pace-planner/pace.apk。 |
| Android 更新提示 | 已有 | `I:92` 比較 query/localStorage 的已安裝版本與 PACE_APK_VERSION；B 由 `pace-apk/app/build.gradle` 的 `versionCode` 讀版本。基準版使用作者電腦的 `D:/KIBO&/pace-apk/app/build.gradle` 絕對路徑，本次只改為相對 C builder 的可攜式路徑 `../pace-apk/app/build.gradle`；讀到相同 `versionCode 5`，未修改原生版本號或原生檔案。 |
| iPhone Safari 加入主畫面 | 已有教學 | I 的 iOS 分區；實際加入由使用者／作業系統執行。 |
| Chrome PWA | 已有 | beforeinstallprompt、instPwa、manifest、service worker。 |
| Edge PWA | 已有 | 同一 PWA 安裝能力與桌面教學；平台能力偵測保持。 |
| 網站更新 | 已有 | sw.js 的 network-first；更新 HTML 不需移除 localStorage 或 IndexedDB。 |

## I. 第一次使用

| 需求 | 原版狀態 | 程式證據與需保留的語意 |
| --- | --- | --- |
| 中文 | 已有 | 核心繁中、c-i18n pace-lang。 |
| English | 已有 | c-i18n.js／i18n-en.json；不可刪除字典或改寫使用者內容。 |
| 語言確認 | 已有 | `P:36–61 langDlg`，選語言後 Yes/No 確認。 |
| 身份選擇 | 已有 | P 的 personaDlg，舊自訂模組不自動重設。 |
| 身份預設方塊 | 已有 | P PERSONAS，六種四個方塊與空白。 |
| 13 步聚光燈教學 | 已有 | `T:11 STEPS` 13 個定義；當目標不存在或功能條件不成立時略過，實際顯示步數可能較少。 |
| 略過教學 | 已有 | tourSkip／Escape → finish(false)，沿用既有範例清理規則。 |
| 保留範例 | 已有 | `T:64 keepSamples` 移除 tour 標記並保留資料。 |
| 清除範例 | 已有 | `T:58 clearSamples` 只處理原有 tour 標記項目；UI 不能另行清資料。 |
| 老使用者更新介紹 | 已有 | `T:29 WHATS_NEW` 與 pace-seen-version。此次掛鉤不變更版本、seen 或 sample 行為。 |
| 設定重看教學 | 已有 | `T:163 tourAgain` 關閉設定後開教學。 |
| 新 UI 教學定位 | 本次相容性掛鉤 | `T:95` 在捲動／getBoundingClientRect 前同步調 `window.paceUI?.reveal?.(target)`；沒有 UI API 時原流程不變。 |

## 本次新增 UI 需求與核心功能的界線

| UI 需求 | 安全實作方式／原版缺口 |
| --- | --- |
| 桌面可收合導覽、更多入口 | C 專用 DOM/CSS 層，沿用 calendar/tasks/blocks/focus/more 路由與原節點；groups 在未登入時指向設定說明，不能偽造動態。 |
| 手機單日與週檢視 | 原版只有七日網格；新增單日是展示狀態，不建立新週文件、不改 day 索引、不縮放分鐘。 |
| 今日任務／本週任務 | 原版顯示週任務；今日分頁需明確使用既有 due/showFrom／排程關係，避免把無截止日任務誤稱今日到期，篩選不得刪除任務。 |
| 手機獨立方塊頁 | 移動原 palette／模組新增入口，保持 data-drag、模組表單、拖曳回日曆。 |
| 專注頁 | 重用現有 wFocus、fNoteForm、nowPick、疲勞入口；可按呈現需要移動原節點，但不得複製 ID 或建立第二個計時 interval。 |
| 暫停 | 原版缺少；本次以 C 層的真實凍結時鐘實作。獨立 UI metadata 不進入共用文件或雲端格式；刷新保留暫停。繼續時平移原有時段，停止／完成只計入實際專注；儲存失敗維持原狀態並提示。對已開啟同一計時的另一分頁同步原計時日期平移，不把另一分頁的新計時自動匯入。 |
| Bottom Sheet／詳情面板 | 以 CSS 呈現原 dialog，保留 showModal、close、cancel、焦點與原 submit handler；路由切換保留未提交輸入。 |
| 按壓／頁面／完成／拖曳動畫 | transform/opacity 且尊重 reduce-motion；對拖曳來源不可改動已計算的 bounding rect／grabY，不能讓動畫搶 pointer 事件或重算排程。 |
| 儲存／錯誤回饋 | 觀察原 writeChain／status，不在 click 時直接宣稱已儲存。原 c-shim 的 localStorage 寫入例外會被吞掉，成功語意不等同磁碟持久化保證；此次不得偷偷重構 adapter。 |

## 單日檢視必守條件

1. 原 `#grid` 順序是左上角、七個 `.head[data-date]`、`.axis`、七個 `.col[data-day]`。單日保留角落／刻度／選中的標題與欄位，其餘僅隱藏，不刪除或重新編號。
2. 選中的 `.col[data-day]` 必須仍保留原 0–6 數值。DOM 在 renderGrid 重建後，重新套用展示 class 即可；不要改 `state.week.blocks`。
3. 單日 CSS 用 54px 刻度 + 剩餘寬度；週視圖回原七欄橫向捲動。保留每分鐘 1px、`OFF=10`、`.col` 垂直高度／無額外 padding，拖曳與拉伸計算直接依這些值。
4. C 的 `START/END/SPAN` 來自 PACE_HOURS；今日定位依目前本機分鐘計算 scrollTop，不能寫死 08:00 或將 ISO UTC 日期代替本機日期。
5. 續段在相鄰天或下週時，提供日期切換可見性；不因單日只顯示一欄而丟棄 `.cont-preview`／續段資料。
6. 路由從方塊／任務拖回日曆時，先顯示原 #gridScroll、清除遮罩與 inert，讓 `document.elementFromPoint()` 真的命中原 `.col`。
7. `reveal(element)` 必須同步，且不 render 替換目標：識別所在功能頁、更多分區、方塊 day／日期，展示原節點後再讓教學量測。#toReport/#toWidget/#skinBtn/#installBtn 要能顯示原入口，不應自動點擊或開不同模態。
8. 保留全域快捷鍵在 input／textarea／select／dialog 中的排除規則；教學開啟時勿讓路由按壓誤觸資料操作。

## 必須保持的資料與隱私契約

- C 文件：config/main、weeks/YYYY-MM-DD（當週週一）、tasks、wishes、templates、notes、goals、closures；未知欄位也須完整保留。
- 私人同步：users/{uid}/docs/{path 將 / 改 ~}，`{p,t,d,del}` 時間戳／刪除墓碑不變。
- 群組：groups/{gid} 與 feed；不能將私人文件混入群組活動。測試僅使用 mock 或 emulator，不登入真人帳號。
- 裝置偏好：planner-*、pace-*（含時間範圍、身份、語言、教學、提醒、群組分享、AI）不可為改版而清除或重設。
- 日期以 `A:994 ymd`、mondayOf、addDays 的本機日曆語意為準；跨午夜與週界仍調原 spillPastMidnight/addToWeek。
- PWA 與原生入口 #widget/#add/#focus、?join、?apk 保持；不能因新路由互相覆蓋而失去邀請或版本辨識。
- 本次新增暫停需通過組建後的瀏覽器整合驗證；既有缺口／條件（假日資料來源、刪除範圍、提醒去重競態）需如實報告，不以 UI 宣稱已完整實作或驗證。

2026-10-28 原始碼保全檢查：對基準 `58b4dc7` 執行 `git diff --numstat -- a-source pace-apk pace-build/c-shim.js pace-build/c-sync.js pace-build/c-group.js pace-build/firestore.rules pace-build/c-persona.js pace-build/c-install.js`，結果為空。共用 A 核心、原生 Android、離線文件格式、同步、群組及規則、身份與安裝邏輯均無修改。變更透過 C 組建的展示層與上述三個暫停時鐘取值掛鉤產生；教學只加入畫面揭示及可見範圍定位，保留原範例與版本流程。
