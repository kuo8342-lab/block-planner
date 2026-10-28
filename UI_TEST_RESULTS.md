# Block Planner 2.0 手機體驗重製：測試結果

驗證日期：2026-10-28（Asia/Taipei）。最初驗證於桌面的新版專案執行。該 ZIP 的本機基準 `58b4dc7` 與遠端提交 `cdbcd796024494c799dfdca162c267af351a373b` 已確認整個 Git tree 相同；公開的測試準備腳本使用後者，重新複製此儲存庫即可取得基準。本機預覽預設使用 <http://127.0.0.1:5175/>，測試頁預設使用 5176。

最終自動化驗證共 **385 項通過、0 項失敗**；另外保留修改前 210 項通過的獨立基準結果。頁面與表單測試沒有未捕捉 JavaScript 錯誤。

上傳候選也已從遠端基準建立的獨立 checkout 重跑完整套件：Node 24.15.0、鎖定的 Playwright 1.62.1，使用 5185／5186，結果同為 **385／385 通過、結束碼 0**。測試伺服器確實讀取該 checkout 的網站與 fixture，原桌面 5175 預覽持續正常。這次另修正 Windows Git checkout 的 CRLF：建置器與專注單元測試在讀入時正規化換行，A 原始檔及資料格式不變。

| 測試層 | 通過 | 失敗 | 範圍 |
| --- | ---: | ---: | --- |
| 原核心＋新版 CSS | 210 | 0 | 原有排程、拖曳、任務、目標、專注、報表等回歸 |
| 實際產生的 C 版整合 | 114 | 0 | 桌面、五個手機頁面、儲存、互動、動畫、暫停、便利貼 |
| 首次使用與更新教學 | 19 | 0 | 中文／English、身份、13 步教學、保留／清除／略過 |
| 群組與隱私（離線 Firebase 替身） | 22 | 0 | 分享欄位、隱私選項、撤回、拍拍、加入／退出、未登入 |
| 專注暫停單元測試 | 15 | 0 | 工作／休息段、重載、結束、跨分頁、儲存失敗 |
| PWA 離線驗證 | 5 | 0 | 離線重新載入、新版介面、七日資料、儲存與控制器 |
| 合計，不重複計入修改前基準 | **385** | **0** | |
| 修改前原核心基準（另外列示） | 210 | 0 | 與新版核心結果對照 |

## 手機與桌面

375、390、430、440、768、1024、1280、1440 px 均沒有整頁水平溢出。375–440 px 的手機時間表整頁高度維持在 viewport 內；需要捲動的資料留在區域內捲動。

390 × 844 的時間表、任務、方塊、專注、更多五個頁面均通過整頁寬高邊界檢查。時間表捲動區底部在底部導航上方。單日／七日切換、日期切換、今日定位、新增方塊入口、任務範圍與方塊分類保留。

輸入草稿在分頁切換與 390 → 1440 → 390 尺寸切換後仍存在，而且是原本同一個 DOM 節點。390 × 460 的鍵盤縮小 viewport 模擬仍可操作快速輸入，沒有水平溢出。日期按鈕使用 Enter 後保留鍵盤焦點；N 快捷鍵開啟可見的任務輸入。

實際滑鼠拖曳與觸控長按事件拖曳均成功；拖曳會從方塊頁轉入時間表，放置時間正確。縮放手柄保持原來分鐘與像素的對應。原核心的 210 項測試另涵蓋整點吸附、跨午夜、週日接下週一、碰撞避讓、累了模式、提醒與原有快捷鍵。

7 種原生對話框分別在 390／1440 px 驗證：目標、方塊模組、排程方塊、設定、範本、固定行程、日期選項。手機以底部面板顯示，動畫結束後均在可視範圍內，沒有內部水平溢出。

## 專注、便利貼與動畫

暫停時倒數不減少，繼續後正常倒數；暫停期間結束專注不會把暫停時間加到實際專注分鐘數。單元測試涵蓋工作與休息段、舊格式、重新整理、跨分頁儲存事件及儲存失敗。

有正在進行的專注時，真實點擊「便利貼」及 W 快捷鍵都能進入小視窗；從便利貼按 N，再回專注頁，計時器仍可見且保持同一份資料。初始 `#widget` 連結保留便利貼模式。18 個合成任務的便利貼仍維持整頁邊界，清單在區域內捲動。

按下與放開按鈕有即時狀態。`prefers-reduced-motion` 開啟時，裝飾效果停用，按下不縮放且不執行過場。畫面截圖會完成有限動畫後擷取，避免把原本的啟動淡入誤認為最終設計；互動測試保留正常動畫。

## 教學與資料保存

完整走過 13 步教學，確認手機聚光燈目標有可視面積，且位於教學卡片上方。結束後會移除臨時捲動留白。另測試重新選擇語言、English 重新載入、身份四個預設方塊、設定中重新教學、保留範例、清除範例、略過、既有使用者更新介紹。更換身份只換模組，已排時間表不變。

合成舊資料包含週排程、任務、心得、目標、範本、備註、休假、未知紀錄及自訂欄位。新版啟動後 `pace-db-v1` 與 `pace-db-meta` 逐字相同。新建的模組、任務與目標重新整理後仍存在。原有 focus 格式未新增欄位；C 版暫停輔助狀態使用獨立的 `pace-ui-focus-pause-v1`。

合成 API Key 沒有出現在可讀取的輸入值或備份 JSON 中。所有截圖使用新建立的合成示範資料；沒有擷取使用者平常瀏覽器的資料。

## 群組測試邊界

群組測試執行真正的 `c-group.js`，Firebase API 由記憶體替身接收操作，不會送訊息、加入真實群組或呼叫外部服務。確認完成動態只包含允許的公開欄位，不包含開始時間、日期、心得或金鑰；只分享分鐘會移除名稱；完全不分享不會建立動態；取消完成會撤回。遠端同步紀錄不會再次廣播；教學與緩衝方塊不分享。

另驗證七日動態、自己的拍拍不能自按、拍拍只更新自己的欄位、加入／退出有確認、未登入受阻，以及權限／30 人上限的錯誤回饋。**沒有使用 Firestore emulator 驗證後端規則，也沒有測試真實 Google／Email 登入、雲端多人同步或 AI 提供者。** 這些外部功能的原有程式保持保留，不能把離線替身測試解讀為真實服務已連線通過。

## 測試方式與命令

工具為 Playwright、Chromium 與 Node；實際依賴版本以 `package-lock.json` 為準。每次使用新建、測完即關閉的獨立瀏覽器 context；主要測試封鎖非 localhost 請求。PWA 測試單獨啟用 service worker。沒有清除使用者 localStorage、IndexedDB 或雲端資料。

測試在導頁前使用 `page.clock.install({time})`，從 **2026-10-28 14:37（台北）正常走時**，不暫停計時器。這避免真實電腦時間剛好遇到提醒彈窗而遮住拖曳目標；提醒功能與提醒斷言仍然執行。

ZIP 未包含原 harness 建置需要的 `seed_config.json` 與 `default-plan.json`，因此 `prepare-tests.cjs` 從基準 Git 提交的現成 harness 提取原有模擬資料。原始 `a-source/planner.html` 與原測試檔不因測試準備而改動。核心 harness 只疊加新版 CSS；完整 C 版導覽與互動則由 114 項實際網站整合檢查。

第一次複製專案後，在專案根目錄安裝依賴及瀏覽器。優先使用鎖定版本；沒有 lockfile 的舊下載包才使用 `npm install`：

```powershell
npm ci
npx playwright install chromium
npm run build
npm run dev
```

另一個終端機執行：

```powershell
npm run test:ui
```

`test:ui` 依序執行核心與尺寸、C 版整合、教學、群組、專注暫停及 PWA，任何失敗均回傳非零結束碼，必要時啟動自己的臨時測試伺服器。也可分別執行 `npm run test:app`、`test:onboarding`、`test:group`、`test:focus`、`test:pwa`。單獨重跑修改前截圖的指令為 `node scripts/ui-tests.cjs --baseline --screenshots-only`；需先啟動同埠的測試資料伺服器。

若桌面程式已在 5175 執行，可選擇另一組未占用的連接埠，在另一份 checkout 執行完整測試而不影響桌面預覽：

```powershell
$env:PACE_TEST_PORT = '5185'
$env:PACE_EVIDENCE_PORT = '5186'
npm run test:ui
```

這兩個環境變數同時控制測試網址與臨時伺服器。手動執行 `scripts/serve.cjs` 時，網站埠優先採用 `PORT`，其次是 `PACE_TEST_PORT`；測試資料埠採用 `PACE_EVIDENCE_PORT`。預設仍為 5175／5176。應選擇未被其他專案使用的埠，避免測到不同 checkout。若使用 shallow clone，須先取得上述基準提交的 Git 物件。

`test-artifacts/` 與 `node_modules/` 均被 Git 忽略。測試紀錄包括 `before-results.json`、`after-results.json`、`app-results.json`、`onboarding-results.json`、`group-results.json`、`pwa-results.json`；專注單元測試結果直接輸出於命令列。

## 視覺證據

以下截圖保留於原本機測試輸出，未納入 Git。重新執行相應測試可在自己的 `test-artifacts/` 產生；GitHub 頁面不會自動提供這些本機圖片。

- [桌面修改前](test-artifacts/before-1440-viewport.png) ／ [桌面修改後](test-artifacts/after-1440-viewport.png)
- [手機修改前](test-artifacts/before-390-viewport.png) ／ [手機修改後](test-artifacts/after-390-viewport.png)
- [任務頁](test-artifacts/after-390-tasks.png) ／ [方塊頁](test-artifacts/after-390-blocks.png) ／ [專注頁](test-artifacts/after-390-focus.png) ／ [更多](test-artifacts/after-390-more.png)
- [手機設定](test-artifacts/after-390-skinDlg.png) ／ [手機目標](test-artifacts/after-390-goalDlg.png) ／ [教學](test-artifacts/after-390-tour-3.png)

手機測試為 Chromium 的行動 viewport、觸控 pointer 事件及縮小 viewport；不是實體 iPhone／Android 的鍵盤、Safari、原生 APK、推播或安裝流程測試。外部字型在測試中封鎖，截圖採系統備援字型。
