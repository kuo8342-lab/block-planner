# 步調 Pace・桌面便利貼安裝程式（由 setup.cmd 從網站讀進來執行）
# 把便利貼放到 %LOCALAPPDATA%\PaceNote\app，換掉正在執行的舊版，然後打開它。
# 連結和位置存在 %APPDATA%\PaceNote，重裝不會動到。
$ErrorActionPreference = 'Stop'
try {
    Write-Host '  正在安裝「步調」桌面便利貼，請稍候…'
    $base = $env:PACE_NOTE_BASE
    $dir = Join-Path $env:LOCALAPPDATA 'PaceNote\app'
    [void](New-Item -ItemType Directory -Force $dir)
    $files = 'pace-note.ps1', 'pace-note.vbs'
    $web = New-Object Net.WebClient
    foreach ($f in $files) { $web.DownloadFile($base + $f, (Join-Path $dir ($f + '.new'))) }   # download everything first, so a broken connection leaves the old copy working
    Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" | Where-Object { $_.CommandLine -like '*-File*pace-note.ps1*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
    Start-Sleep -Milliseconds 500
    foreach ($f in $files) { Move-Item -Force (Join-Path $dir ($f + '.new')) (Join-Path $dir $f) }
    Remove-Item -Force -ErrorAction SilentlyContinue (Join-Path $env:APPDATA 'PaceNote\installed')   # the note sets itself to start with Windows again, from this folder
    Start-Process wscript.exe ('"' + (Join-Path $dir 'pace-note.vbs') + '"')
    Write-Host ''
    Write-Host '  完成！便利貼已經貼在桌面上，之後開機會自動出現。'
    Write-Host '  這個視窗會自己關掉，下載的安裝檔可以刪除。'
    Start-Sleep -Seconds 4
} catch {
    Write-Host ''
    Write-Host '  安裝沒有成功。請確認電腦有連上網路，再開一次安裝檔。'
    Write-Host "  （$($_.Exception.Message)）"
    exit 1
}
