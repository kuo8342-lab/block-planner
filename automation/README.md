# 方塊週排程・本機自動提醒

取代原本一天跑很多次的 Claude 排程任務，改由電腦上的小程式每 5 分鐘檢查一次，**不花 token**，用 [ntfy](https://ntfy.sh) 推播到手機。

## 會做什麼
- **方塊提醒**：今天自己排的方塊（還沒完成／略過／失敗）在 15 分鐘內要開始時推一次，例如「18:40 數學題目（50 分）」；休息方塊是「18:40 該休息了：散步（30 分）」。每個方塊只推一次。
- **早安摘要**：每天 07:00 後第一次執行時推今天的方塊和今天到期的任務；放假日會加上「今天放假（名稱）」。中午後才開機就不補發。
- **颱風停課**：05:00–23:00 每 3 小時查一次人事行政總處停班停課頁（19:00 後每 30 分鐘，因為隔天停課通常晚上公布），新北市有停課就用高優先推播，同一則內容只推一次。
- **資料過期**：`planner-data.json` 超過 30 小時沒更新，每天提醒一次。

資料來自 `..\planner-data.json`（由剩下的 Claude 匯出任務更新）。

## 手機設定（ntfy）
1. 在 Google Play / App Store 安裝 **ntfy**。
2. 在這個資料夾開 PowerShell，執行 `node tick.js --test`：會產生 `config.json`，並真的送一則測試通知。
3. 打開 `config.json`，複製 `topic` 的值（`fangkuai-` 開頭）。
4. ntfy App → 右下角「＋」→ 貼上主題名稱、伺服器用預設的 ntfy.sh → 訂閱。
5. 再執行一次 `node tick.js --test`，手機跳出「方塊週排程測試」就成功了。

主題名稱等於密碼：知道的人都能看到推播，不要分享。

## 安裝／移除排程
在這個資料夾開 PowerShell：
```
powershell -ExecutionPolicy Bypass -File install-task.ps1     # 安裝（重複執行會覆蓋）
powershell -ExecutionPolicy Bypass -File uninstall-task.ps1   # 移除
```
排程名稱是工作排程器裡的 `\BlockPlanner\Tick`，只在登入時執行，不會跳出視窗。

## 測試
```
node tick.js --dry-run                          # 只印出要推的內容，不推、不記錄
node tick.js --dry-run --now 2026-10-29T18:30   # 假裝現在是台北時間某一刻
node tick.js --dry-run --data 測試.json --state-dir 暫存資料夾
```
紀錄在 `log.txt`（只保留最後約 500 行）；去重狀態在 `state.json`、颱風紀錄在 `typhoon.json`。

## 限制
- 電腦要開機、登入、沒睡眠才會推；關機那段時間的提醒不會補發。
- 提醒只跟最後一次匯出的資料一樣新：剛在 App 改的方塊，要等下次匯出才會被提醒。
- 學校固定課表不會推播，只提醒自己排的方塊。
- 颱風判斷只看新北市那一列文字；只有部分區停課時會標「部分地區」，請看原文確認自己的區。
