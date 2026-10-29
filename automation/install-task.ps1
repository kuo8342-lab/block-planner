# 方塊週排程・本機提醒：在「工作排程器」註冊 \BlockPlanner\Tick，每 5 分鐘執行一次 run-hidden.vbs（不用系統管理員）
# 已存在就先移除再重建。用法：powershell -ExecutionPolicy Bypass -File install-task.ps1
$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$vbs = Join-Path $here 'run-hidden.vbs'
$user = "$env:USERDOMAIN\$env:USERNAME"

# 移除舊的（含退回用的根目錄名稱）
foreach ($t in @(@{P='\BlockPlanner\'; N='Tick'}, @{P='\'; N='BlockPlanner Tick'})) {
    Get-ScheduledTask -TaskPath $t.P -TaskName $t.N -ErrorAction SilentlyContinue | Unregister-ScheduledTask -Confirm:$false
}

$action = New-ScheduledTaskAction -Execute 'wscript.exe' -Argument "`"$vbs`"" -WorkingDirectory $here
# 從現在起每 5 分鐘、無限期重複；開機登入後也會接著跑
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) -RepetitionInterval (New-TimeSpan -Minutes 5)
$logon = New-ScheduledTaskTrigger -AtLogOn -User $user
$principal = New-ScheduledTaskPrincipal -UserId $user -LogonType Interactive -RunLevel Limited
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable `
    -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Minutes 2)
$desc = '方塊週排程本機提醒：方塊提醒、早安摘要、颱風停課、資料過期（ntfy 推播）'

try {
    Register-ScheduledTask -TaskPath '\BlockPlanner\' -TaskName 'Tick' -Action $action -Trigger $trigger, $logon `
        -Principal $principal -Settings $settings -Description $desc | Out-Null
    Write-Host '已註冊排程：\BlockPlanner\Tick（每 5 分鐘）'
} catch {
    # 有些電腦一般使用者不能建資料夾，退回放在根目錄
    Register-ScheduledTask -TaskPath '\' -TaskName 'BlockPlanner Tick' -Action $action -Trigger $trigger, $logon `
        -Principal $principal -Settings $settings -Description $desc | Out-Null
    Write-Host '已註冊排程：\BlockPlanner Tick（每 5 分鐘；無法建立 BlockPlanner 資料夾，改放根目錄）'
}
$cfg = Join-Path $here 'config.json'
if (-not (Test-Path $cfg)) { Write-Host '第一次執行後會產生 config.json，裡面的 topic 就是手機 ntfy 要訂閱的主題。' }
