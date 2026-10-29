# 移除方塊週排程・本機提醒的排程（config.json、state.json、log.txt 會留著）
$found = $false
foreach ($t in @(@{P='\BlockPlanner\'; N='Tick'}, @{P='\'; N='BlockPlanner Tick'})) {
    $task = Get-ScheduledTask -TaskPath $t.P -TaskName $t.N -ErrorAction SilentlyContinue
    if ($task) { $task | Unregister-ScheduledTask -Confirm:$false; Write-Host "已移除：$($t.P)$($t.N)"; $found = $true }
}
if (-not $found) { Write-Host '沒有找到排程，不用移除。' }
