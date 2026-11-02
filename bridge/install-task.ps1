# A → Pace 橋接：在「工作排程器」註冊 \BlockPlanner\A-to-Pace，每 30 分鐘執行一次（不用系統管理員）
# 已存在就先移除再重建。用法：powershell -ExecutionPolicy Bypass -File install-task.ps1
$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not (Test-Path (Join-Path $here 'config.json'))) { Write-Host '先建立 bridge\config.json（複製 config.example.json，填入你的 Pace Email 和密碼），再執行這個檔案。'; exit 1 }
$vbs = Join-Path $here 'run-hidden.vbs'
$user = "$env:USERDOMAIN\$env:USERNAME"
foreach ($t in @(@{P='\BlockPlanner\'; N='A-to-Pace'}, @{P='\'; N='BlockPlanner A-to-Pace'})) {
    Get-ScheduledTask -TaskPath $t.P -TaskName $t.N -ErrorAction SilentlyContinue | Unregister-ScheduledTask -Confirm:$false
}
$action = New-ScheduledTaskAction -Execute 'wscript.exe' -Argument "`"$vbs`"" -WorkingDirectory $here
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) -RepetitionInterval (New-TimeSpan -Minutes 30)
$logon = New-ScheduledTaskTrigger -AtLogOn -User $user
$principal = New-ScheduledTaskPrincipal -UserId $user -LogonType Interactive -RunLevel Limited
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Minutes 3)
$desc = '把 A（方塊週排程）這週的達成率和計畫同步到 Pace 的群組（照你在 Pace 選的公開範圍）'
try {
    Register-ScheduledTask -TaskPath '\BlockPlanner\' -TaskName 'A-to-Pace' -Action $action -Trigger $trigger, $logon -Principal $principal -Settings $settings -Description $desc | Out-Null
    Write-Host '已註冊排程：\BlockPlanner\A-to-Pace（每 30 分鐘）'
} catch {
    Register-ScheduledTask -TaskPath '\' -TaskName 'BlockPlanner A-to-Pace' -Action $action -Trigger $trigger, $logon -Principal $principal -Settings $settings -Description $desc | Out-Null
    Write-Host '已註冊排程：\BlockPlanner A-to-Pace（每 30 分鐘；改放根目錄）'
}
Write-Host '結果會寫在 bridge\log.txt。'
