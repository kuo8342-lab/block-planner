# A → Pace 橋接

A（claude.ai 上的「方塊週排程」）不能連到網路，所以群組裡看不到它。這個小程式在你的電腦上跑，
把 A 這週的**達成率、完成數、亮度**和**這週的方塊**更新到你在 Pace（C）加入的群組。

- 資料來源：排程匯出的 `export` 資料夾（Claude 排程每天 07、12、17、21 點存一次），所以朋友看到的最多會落後幾小時。
- 誰看得到：**照你在 Pace 選的公開範圍**（不公開／全部／指定的人）。程式不會更改這個選擇；你在 Pace 改了，下一次同步就照新的。
- 只寫你自己的資料，不會動別人的、也不會改群組。
- 同步後，Pace App 不會再用自己的（空的）資料蓋掉 A 的數字；在 Pace 改公開範圍仍然有效。

## 設定（一次）：最簡單的方法
在專案資料夾（BlockPlanner）執行 `node bridge/setup.js`，照畫面回答。它會幫你：寄密碼設定信（如果需要）、讓你輸入密碼（輸入時不顯示）、確認能登入、寫好 `config.json`、試跑一次、問要不要啟用排程。

## 手動設定（一次）
1. **你的 Pace 帳號要有密碼。** 平常用 Email 登入就已經有。用 Google 登入的話：到 Pace → 設定 → 同步，用 Email 輸入同一個 Gmail，按「忘記密碼」，
   收信後照連結設一組密碼（Google 登入仍然可以用）。
2. 複製 `config.example.json` 為 `config.json`，填入 Pace 帳號的 Email 和密碼。這個檔案只在你的電腦上，已設為不進 GitHub。
3. 在 Pace 加入群組並選好公開範圍（程式不會替你決定；沒選過的群組會被略過）。
4. 先試跑：`node bridge/a-to-c.js --dry`（只顯示會寫什麼，不寫入），沒問題再：`node bridge/a-to-c.js`。
5. 自動執行：`powershell -ExecutionPolicy Bypass -File bridge\install-task.ps1`（每 30 分鐘一次，記錄在 `bridge\log.txt`）。

## 其他
- 想把數字交還給 Pace App：`node bridge/a-to-c.js --release`，並移除排程（工作排程器 → BlockPlanner → A-to-Pace）。
- 只有你的電腦開著、而且有網路時才會同步。
- 密碼是明文放在 `config.json`；請不要把這個檔案傳給別人。
