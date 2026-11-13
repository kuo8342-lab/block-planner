# 步調 Pace・桌面便利貼
# 直接讀你的同步帳號（Firebase），顯示今天的行程和這週任務。
# 更新時機：開啟時、點一下便利貼、每 5 分鐘。不需要開著瀏覽器，也不需要 AI 排程。
# 連結方式：步調 → 設定 → 同步 → 「連結電腦桌面便利貼」，再點一下這張便利貼。
param([switch]$Sync, [string]$Snapshot, [string]$FakeNow, [string]$Skin, [string]$DataDir)

$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$self = $MyInvocation.MyCommand.Path
$dir = if ($DataDir) { $DataDir } else { Join-Path $env:APPDATA 'PaceNote' }
if (-not (Test-Path $dir)) { [void](New-Item -ItemType Directory -Force $dir) }
$dataPath = Join-Path $dir 'data.json'      # last good copy of today's data
$statusPath = Join-Path $dir 'status.json'  # how the last sync went
$linkPath = Join-Path $dir 'link.dat'       # the sign-in, encrypted for this Windows user only
$posPath = Join-Path $dir 'position.json'
$appUrl = 'https://block-planner-beta.vercel.app'
$apiKey = 'AIzaSyADaHf4Xhn6JyGLfaxINxWlwDQV2Vei-Ew'   # the public web config of the Pace Firebase project
$project = 'pace-planner-83998'
$tokenUrl = if ($env:PACE_NOTE_TOKEN_URL) { $env:PACE_NOTE_TOKEN_URL } else { 'https://securetoken.googleapis.com/v1/token' }
$fsUrl = if ($env:PACE_NOTE_FS_URL) { $env:PACE_NOTE_FS_URL } else { 'https://firestore.googleapis.com/v1' }
$syncEvery = 300   # seconds

function Now { if ($FakeNow) { [datetime]::Parse($FakeNow) } else { Get-Date } }
function MondayKey($now) { $now.Date.AddDays(-(([int]$now.DayOfWeek + 6) % 7)).ToString('yyyy-MM-dd') }
function Write-Json($path, $obj) { [System.IO.File]::WriteAllText($path, ($obj | ConvertTo-Json -Depth 30 -Compress), (New-Object System.Text.UTF8Encoding $false)) }
function Read-Json($path) { if (Test-Path $path) { try { return [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8) | ConvertFrom-Json } catch {} }; $null }

# ---------- the sign-in (a Firebase refresh token), kept encrypted with Windows DPAPI ----------
Add-Type -AssemblyName System.Security
function Save-Link([string]$rt, [string]$uid) {
    $plain = [System.Text.Encoding]::UTF8.GetBytes((@{ rt = $rt; uid = $uid } | ConvertTo-Json -Compress))
    [System.IO.File]::WriteAllBytes($linkPath, [System.Security.Cryptography.ProtectedData]::Protect($plain, $null, 'CurrentUser'))
}
function Read-Link {
    if (-not (Test-Path $linkPath)) { return $null }
    try { [System.Text.Encoding]::UTF8.GetString([System.Security.Cryptography.ProtectedData]::Unprotect([System.IO.File]::ReadAllBytes($linkPath), $null, 'CurrentUser')) | ConvertFrom-Json } catch { $null }
}

# ---------- sync worker: runs as its own hidden process so the note never freezes ----------
function Http([string]$url, [string]$method, [string]$body, [string]$contentType, [string]$bearer) {
    $r = [System.Net.HttpWebRequest]::Create($url); $r.Method = $method; $r.Timeout = 20000; $r.ReadWriteTimeout = 20000
    if ($bearer) { $r.Headers.Add('Authorization', "Bearer $bearer") }
    if ($body) { $bytes = [System.Text.Encoding]::UTF8.GetBytes($body); $r.ContentType = $contentType; $r.ContentLength = $bytes.Length; $s = $r.GetRequestStream(); $s.Write($bytes, 0, $bytes.Length); $s.Close() }
    $code = 0; $resp = $null
    try { $resp = $r.GetResponse() } catch [System.Net.WebException] { $resp = $_.Exception.Response; if (-not $resp) { throw } }
    $code = [int]$resp.StatusCode
    $reader = New-Object System.IO.StreamReader($resp.GetResponseStream(), [System.Text.Encoding]::UTF8); $text = $reader.ReadToEnd(); $reader.Close(); $resp.Close()
    @{ code = $code; text = $text }
}
# Firestore REST value → plain value
function FV($v) {
    if ($null -eq $v) { return $null }
    $n = @($v.PSObject.Properties.Name)
    if ($n -contains 'stringValue') { return [string]$v.stringValue }
    if ($n -contains 'booleanValue') { return [bool]$v.booleanValue }
    if ($n -contains 'integerValue') { return [long]$v.integerValue }
    if ($n -contains 'doubleValue') { return [double]$v.doubleValue }
    if ($n -contains 'timestampValue') { return [string]$v.timestampValue }
    if ($n -contains 'arrayValue') {
        $list = New-Object System.Collections.ArrayList
        if ($v.arrayValue.PSObject.Properties.Name -contains 'values') { foreach ($x in $v.arrayValue.values) { [void]$list.Add((FV $x)) } }
        return , $list.ToArray()
    }
    if ($n -contains 'mapValue') {
        $o = [ordered]@{}
        if ($v.mapValue.PSObject.Properties.Name -contains 'fields') { foreach ($p in $v.mapValue.fields.PSObject.Properties) { $o[$p.Name] = FV $p.Value } }
        return $o
    }
    $null
}
# one synced document → its data (null when missing or deleted)
function DocData($doc) {
    if (-not $doc -or -not ($doc.PSObject.Properties.Name -contains 'fields')) { return $null }
    $f = $doc.fields
    if (($f.PSObject.Properties.Name -contains 'del') -and (FV $f.del)) { return $null }
    if (-not ($f.PSObject.Properties.Name -contains 'd')) { return $null }
    FV $f.d
}
function Arr($x) { if ($null -eq $x) { , @() } else { , @($x) } }

function Do-Sync {
    $status = @{ state = 'ok'; at = (Get-Date).ToString('o') }
    try {
        $link = Read-Link
        if (-not $link -or -not $link.rt -or -not $link.uid) { $status.state = 'unlinked'; return }
        $t = Http "$tokenUrl`?key=$apiKey" 'POST' ('grant_type=refresh_token&refresh_token=' + [uri]::EscapeDataString($link.rt)) 'application/x-www-form-urlencoded' $null
        if ($t.code -ge 400 -and $t.code -lt 500) { $status.state = 'relink'; return }   # signed out, password changed or account deleted
        if ($t.code -ge 500) { throw "token $($t.code)" }
        $tok = $t.text | ConvertFrom-Json
        if ($tok.refresh_token -and $tok.refresh_token -ne $link.rt) { Save-Link $tok.refresh_token $link.uid }
        $id = $tok.id_token; $base = "$fsUrl/projects/$project/databases/(default)/documents/users/$($link.uid)"
        $get = { param($name) $r = Http "$base/docs/$name" 'GET' $null $null $id; if ($r.code -eq 404) { return $null }; if ($r.code -ge 400) { throw "read $name $($r.code)" }; DocData ($r.text | ConvertFrom-Json) }
        $now = Now; $key = MondayKey $now
        $cfg = & $get 'config~main'
        $week = & $get "weeks~$key"
        # tasks are separate documents: every one whose path starts with tasks/
        $q = @{ structuredQuery = @{ from = @(@{ collectionId = 'docs' }); where = @{ compositeFilter = @{ op = 'AND'; filters = @(
                            @{ fieldFilter = @{ field = @{ fieldPath = 'p' }; op = 'GREATER_THAN_OR_EQUAL'; value = @{ stringValue = 'tasks/' } } },
                            @{ fieldFilter = @{ field = @{ fieldPath = 'p' }; op = 'LESS_THAN'; value = @{ stringValue = 'tasks0' } } }) } } } } | ConvertTo-Json -Depth 12 -Compress
        $r = Http "$base`:runQuery" 'POST' $q 'application/json' $id
        if ($r.code -ge 400) { throw "tasks $($r.code)" }
        $tasks = New-Object System.Collections.ArrayList
        $rows = $r.text | ConvertFrom-Json
        foreach ($row in $rows) {
            if (-not ($row.PSObject.Properties.Name -contains 'document')) { continue }
            $d = DocData $row.document
            if ($d -and -not $d['done']) { [void]$tasks.Add([ordered]@{ title = "$($d['title'])"; due = "$($d['due'])"; showFrom = "$($d['showFrom'])" }) }
        }
        $out = [ordered]@{
            syncedAt = (Get-Date).ToString('o'); weekKey = $key
            skin = if ($cfg) { "$($cfg['skin'])" } else { '' }
            fixed = Arr $(if ($cfg) { $cfg['fixed'] }); special = Arr $(if ($cfg) { $cfg['special'] }); holidays = Arr $(if ($cfg) { $cfg['holidays'] })
            hasWeek = [bool]$week
            blocks = Arr $(if ($week) { $week['blocks'] }); skipFixed = Arr $(if ($week) { $week['skipFixed'] })
            tasks = $tasks.ToArray()
        }
        Write-Json $dataPath $out
    } catch { $status.state = 'offline'; $status.error = "$($_.Exception.Message)" }
    finally { Write-Json $statusPath $status }
}
if ($Sync) { [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12; Do-Sync; return }

# ---------- the note ----------
if (-not $Snapshot) {
    $created = $false
    $script:mutex = New-Object System.Threading.Mutex($true, 'PaceDesktopNote', [ref]$created)
    if (-not $created) { return }
}
Add-Type -AssemblyName PresentationFramework, PresentationCore, WindowsBase, System.Xaml

$palettes = @{
    default = @{ note = '#FFF3A6'; fg = '#3D3510'; sub = '#6B5E1F'; accent = '#2F62C9'; tape = '#99FFFFFF'; card = '#143D3510' }
    night   = @{ note = '#1D2754'; fg = '#EEF1FF'; sub = '#AEB8E6'; accent = '#9DB2FF'; tape = '#559DB2FF'; card = '#22EEF1FF' }
    sakura  = @{ note = '#FFE1E9'; fg = '#4A2832'; sub = '#8F5A69'; accent = '#DC5A7B'; tape = '#AAFFFFFF'; card = '#144A2832' }
    ocean   = @{ note = '#D4EFFC'; fg = '#0F3346'; sub = '#3F6A82'; accent = '#0A74B4'; tape = '#AAFFFFFF'; card = '#140F3346' }
    matcha  = @{ note = '#ECF2D4'; fg = '#2B3921'; sub = '#5E6F4E'; accent = '#4E7A38'; tape = '#99FFFFFF'; card = '#142B3921' }
    neon    = @{ note = '#0F0F1E'; fg = '#E9FBFF'; sub = '#86A0B5'; accent = '#00E5FF'; tape = '#88FF3D81'; card = '#1A00E5FF' }
}
$catColor = @{ study = '#3A78D6'; preview = '#1F9E84'; code = '#7656D6'; lang = '#E0782D'; exam = '#D9493C'; class = '#A8733F'; swim = '#2A9CCC'; rest = '#4AA83C'; buffer = '#D4AD1C'; care = '#D4598A'; life = '#94A0AE'; school = '#6B7A8A' }
$dayNames = '一', '二', '三', '四', '五', '六', '日'
function ToMin([string]$t) { $p = $t.Split(':'); [int]$p[0] * 60 + [int]$p[1] }
function HM([int]$m) { '{0:00}:{1:00}' -f ([math]::Floor($m / 60) % 24), ($m % 60) }
function Brush([string]$c) { New-Object System.Windows.Media.SolidColorBrush ([System.Windows.Media.ColorConverter]::ConvertFromString($c)) }

$script:data = $null; $script:dataStamp = [datetime]::MinValue; $script:hint = ''
function Load-Data {
    if (-not (Test-Path $dataPath)) { $script:data = $null; $script:dataStamp = [datetime]::MinValue; return }
    $stamp = (Get-Item $dataPath).LastWriteTimeUtc
    if ($stamp -ne $script:dataStamp) { $script:data = Read-Json $dataPath; $script:dataStamp = $stamp }
}
function Get-Today {
    $d = $script:data; $now = Now
    $dayIdx = ([int]$now.DayOfWeek + 6) % 7
    $key = MondayKey $now; $date = $now.ToString('yyyy-MM-dd')
    $thisWeek = ("$($d.weekKey)" -eq $key)   # a copy from last week only tells us the fixed times
    $blocks = if ($thisWeek) { @($d.blocks) } else { @() }
    $skips = if ($thisWeek) { @($d.skipFixed) } else { @() }
    $hol = @($d.holidays | Where-Object { $_.date -eq $date }) | Select-Object -First 1
    $specials = @($d.special | Where-Object { $_.date -eq $date })
    $replaced = @($specials | ForEach-Object { $_.replaces })
    $items = New-Object System.Collections.ArrayList
    $add = { param($x, $done, $fixed) try { $s = ToMin "$($x.start)"; $e = if ($x.PSObject.Properties.Name -contains 'end' -and $x.end) { ToMin "$($x.end)" } else { $s + [int]$x.minutes }; [void]$items.Add([pscustomobject]@{ s = $s; e = $e; name = "$($x.name)"; cat = "$($x.cat)"; done = $done; fixed = $fixed }) } catch {} }
    foreach ($f in @($d.fixed)) {
        if ($null -eq $f -or $f.day -ne $dayIdx -or $replaced -contains $f.id -or $skips -contains $f.id) { continue }
        if ($hol -and ($f.cat -in 'school', 'care' -or ($f.cat -eq 'life' -and (ToMin "$($f.start)") -lt 1080))) { continue }
        & $add $f $false $true
    }
    foreach ($f in $specials) { if ($skips -notcontains $f.id) { & $add $f $false $true } }
    foreach ($b in $blocks) { if ($null -ne $b -and $b.day -eq $dayIdx -and -not $b.skipped) { & $add $b ([bool]$b.done) $false } }
    $weekEnd = $now.Date.AddDays(6 - $dayIdx).ToString('yyyy-MM-dd')
    $tasks = @($d.tasks | Where-Object { $_ -and "$($_.showFrom)" -le $weekEnd } | Sort-Object { if ($_.due) { $_.due } else { '9999' } })
    [pscustomobject]@{ now = $now; nowMin = $now.Hour * 60 + $now.Minute; items = @($items | Sort-Object s); tasks = $tasks; holiday = $hol; noPlan = (-not $thisWeek -or -not $d.hasWeek) }
}

[xml]$xaml = @'
<Window xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation" xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        Title="步調便利貼" Width="330" SizeToContent="Height" WindowStyle="None" AllowsTransparency="True" Background="Transparent"
        ShowInTaskbar="False" ResizeMode="NoResize" Topmost="False" FontFamily="Microsoft JhengHei UI">
  <Grid Margin="14,16,14,18">
    <Border x:Name="Shadow" CornerRadius="4,4,22,4" Margin="3,5,-3,-5" Background="#33000000"/>
    <Border x:Name="Note" CornerRadius="4,4,22,4" Padding="18,22,18,14">
      <StackPanel>
        <StackPanel Orientation="Horizontal" VerticalAlignment="Bottom">
          <TextBlock x:Name="Clock" FontSize="32" FontWeight="Bold" FontFamily="Consolas"/>
          <TextBlock x:Name="DateText" FontSize="13" Margin="10,0,0,6" VerticalAlignment="Bottom"/>
        </StackPanel>
        <TextBlock x:Name="Holiday" FontSize="12" FontWeight="Bold" Margin="0,4,0,0" Visibility="Collapsed"/>
        <Border x:Name="NowCard" CornerRadius="10" Padding="12,9" Margin="0,10,0,0">
          <StackPanel>
            <TextBlock x:Name="NowLabel" FontSize="11" FontWeight="Bold" Opacity="0.75"/>
            <TextBlock x:Name="NowName" FontSize="18" FontWeight="Bold" TextWrapping="Wrap" Margin="0,2,0,0"/>
            <TextBlock x:Name="NowLeft" FontSize="12" Margin="0,3,0,0" Opacity="0.8" TextWrapping="Wrap"/>
          </StackPanel>
        </Border>
        <StackPanel x:Name="Body">
          <TextBlock Text="今天接下來" FontSize="12" FontWeight="Bold" Margin="0,12,0,4" x:Name="NextTitle"/>
          <StackPanel x:Name="NextList"/>
          <TextBlock Text="這週任務" FontSize="12" FontWeight="Bold" Margin="0,12,0,4" x:Name="TaskTitle"/>
          <StackPanel x:Name="TaskList"/>
        </StackPanel>
        <TextBlock x:Name="Foot" FontSize="10.5" Margin="0,12,0,0" HorizontalAlignment="Center" TextWrapping="Wrap" TextAlignment="Center"/>
      </StackPanel>
    </Border>
    <Border x:Name="Tape" Width="104" Height="24" VerticalAlignment="Top" HorizontalAlignment="Center" Margin="0,-12,0,0">
      <Border.RenderTransform><RotateTransform Angle="-3" CenterX="52" CenterY="12"/></Border.RenderTransform>
    </Border>
  </Grid>
</Window>
'@
$win = [Windows.Markup.XamlReader]::Load((New-Object System.Xml.XmlNodeReader $xaml))
$ui = @{}; foreach ($n in 'Note', 'Tape', 'Clock', 'DateText', 'Holiday', 'NowCard', 'NowLabel', 'NowName', 'NowLeft', 'Body', 'NextTitle', 'NextList', 'TaskTitle', 'TaskList', 'Foot') { $ui[$n] = $win.FindName($n) }

function Add-Row($panel, [string]$dot, [string]$left, [string]$right, $p, [bool]$strike) {
    $b = New-Object System.Windows.Controls.Border; $b.CornerRadius = 8; $b.Padding = '9,5'; $b.Margin = '0,0,0,4'; $b.Background = Brush $p.card
    $g = New-Object System.Windows.Controls.DockPanel
    $e = New-Object System.Windows.Shapes.Ellipse; $e.Width = 8; $e.Height = 8; $e.Fill = Brush $dot; $e.Margin = '0,0,8,0'; $e.VerticalAlignment = 'Center'
    [System.Windows.Controls.DockPanel]::SetDock($e, 'Left'); [void]$g.Children.Add($e)
    if ($left) {
        $t1 = New-Object System.Windows.Controls.TextBlock; $t1.Text = $left; $t1.FontFamily = 'Consolas'; $t1.FontSize = 12; $t1.Width = 92; $t1.Foreground = Brush $p.sub; $t1.VerticalAlignment = 'Center'
        [System.Windows.Controls.DockPanel]::SetDock($t1, 'Left'); [void]$g.Children.Add($t1)
    }
    $t2 = New-Object System.Windows.Controls.TextBlock; $t2.Text = $right; $t2.FontSize = 13; $t2.TextWrapping = 'Wrap'; $t2.Foreground = Brush $p.fg
    if ($strike) { $t2.TextDecorations = [System.Windows.TextDecorations]::Strikethrough; $t2.Opacity = 0.55 }
    [void]$g.Children.Add($t2); $b.Child = $g; [void]$panel.Children.Add($b)
}

function Render {
    Load-Data
    $st = Read-Json $statusPath; $state = if ($st) { "$($st.state)" } else { '' }
    $linked = Test-Path $linkPath
    $skinName = if ($Skin) { $Skin } elseif ($script:data -and $script:data.skin) { "$($script:data.skin)" } else { 'default' }
    $p = $palettes[$skinName]; if (-not $p) { $p = $palettes.default }
    $ui.Note.Background = Brush $p.note; $ui.Tape.Background = Brush $p.tape
    foreach ($n in 'Clock', 'NowName', 'NextTitle', 'TaskTitle') { $ui[$n].Foreground = Brush $p.fg }
    foreach ($n in 'DateText', 'NowLeft', 'Foot') { $ui[$n].Foreground = Brush $p.sub }
    $ui.Holiday.Foreground = Brush $p.accent
    $ui.NextList.Children.Clear(); $ui.TaskList.Children.Clear()
    $now = Now
    $ui.Clock.Text = $now.ToString('HH:mm')
    $ui.DateText.Text = "週$($dayNames[([int]$now.DayOfWeek + 6) % 7])・$($now.Month)/$($now.Day)"
    $ui.NowCard.Background = Brush $p.card; $ui.NowLabel.Foreground = Brush $p.sub
    if (-not $linked -or $state -eq 'relink' -or -not $script:data) {
        $ui.Body.Visibility = 'Collapsed'; $ui.Holiday.Visibility = 'Collapsed'
        if (-not $linked) { $ui.NowLabel.Text = '還沒連結步調'; $ui.NowName.Text = '點這裡連結'; $ui.NowLeft.Text = '先在步調按「設定 → 同步 → 連結電腦桌面便利貼」，再回來點一下這張便利貼。' }
        elseif ($state -eq 'relink') { $ui.NowLabel.Text = '需要重新連結'; $ui.NowName.Text = '登入過期了'; $ui.NowLeft.Text = '請在步調再按一次「連結電腦桌面便利貼」，再回來點一下這張便利貼。' }
        elseif ($state -eq 'offline') { $ui.NowLabel.Text = '連不上網路'; $ui.NowName.Text = '稍後會再試'; $ui.NowLeft.Text = '點一下可以馬上重試。' }
        else { $ui.NowLabel.Text = '步調'; $ui.NowName.Text = '同步中…'; $ui.NowLeft.Text = '' }
        $ui.Foot.Text = $(if ($script:hint) { $script:hint } else { '右鍵有更多選項' }); return
    }
    $ui.Body.Visibility = 'Visible'
    $t = Get-Today
    if ($t.holiday) { $ui.Holiday.Text = "今天放假：$($t.holiday.name)"; $ui.Holiday.Visibility = 'Visible' } else { $ui.Holiday.Visibility = 'Collapsed' }
    $cur = @($t.items | Where-Object { $_.s -le $t.nowMin -and $t.nowMin -lt $_.e }) | Select-Object -Last 1
    if ($cur) {
        $c = $catColor["$($cur.cat)"]; if (-not $c) { $c = $p.accent }
        $ui.NowCard.Background = Brush ('#33' + $c.Substring(1)); $ui.NowLabel.Foreground = Brush $p.fg
        $ui.NowLabel.Text = '現在'; $ui.NowName.Text = ($(if ($cur.done) { '✓ ' } else { '' }) + $cur.name)
        $ui.NowLeft.Text = "到 $(HM $cur.e)・還有 $($cur.e - $t.nowMin) 分鐘"
    } else { $ui.NowLabel.Text = '現在'; $ui.NowName.Text = '空檔'; $ui.NowLeft.Text = '' }
    $next = @($t.items | Where-Object { $_.s -gt $t.nowMin }) | Select-Object -First 6
    if ($next.Count) { foreach ($i in $next) { $c = $catColor["$($i.cat)"]; if (-not $c) { $c = $p.accent }; Add-Row $ui.NextList $c "$(HM $i.s)–$(HM $i.e)" $i.name $p $i.done } }
    else { Add-Row $ui.NextList $p.sub '' $(if ($t.noPlan -and -not $t.items.Count) { '這週還沒排方塊' } else { '今天沒有其他行程了' }) $p $false }
    $tasks = @($t.tasks) | Select-Object -First 5
    if ($tasks.Count) { foreach ($k in $tasks) { $due = ''; if ($k.due) { try { $due = ' （' + ([datetime]$k.due).ToString('M/d') + '）' } catch {} }; Add-Row $ui.TaskList $p.accent '' ("$($k.title)$due") $p $false } }
    else { Add-Row $ui.TaskList $p.sub '' '這週沒有待辦任務' $p $false }
    $at = try { ([datetime]$script:data.syncedAt).ToLocalTime().ToString('HH:mm') } catch { '?' }
    $line = if ($script:hint) { $script:hint } elseif ($state -eq 'offline') { "連不上網路，顯示 $at 的資料" } else { "已同步 $at・每 5 分鐘自動更新" }
    $ui.Foot.Text = "$line`n點一下立刻同步・連點 5 下打開步調"
}

# ---------- syncing from the note ----------
$script:worker = $null; $script:lastSync = [datetime]::MinValue; $script:lastDay = (Now).Date
function Start-Sync {
    if ($Snapshot) { return }
    if ($script:worker -and -not $script:worker.HasExited) { return }
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = 'powershell.exe'; $psi.Arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$self`" -Sync" + $(if ($DataDir) { " -DataDir `"$DataDir`"" } else { '' })
    $psi.UseShellExecute = $false; $psi.CreateNoWindow = $true
    try { $script:worker = [System.Diagnostics.Process]::Start($psi); $script:lastSync = Get-Date; $script:hint = '同步中…' } catch { $script:hint = '無法啟動同步' }
}
# a link code copied from the web app: pace-note:<base64 of {"rt":…,"uid":…}>
function Try-Link {
    try { $clip = [System.Windows.Clipboard]::GetText() } catch { return $false }
    if ("$clip".Trim() -notmatch '^pace-note:([A-Za-z0-9+/=]+)$') { return $false }
    try {
        $o = [System.Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($Matches[1])) | ConvertFrom-Json
        if (-not $o.rt -or -not $o.uid) { return $false }
        Save-Link "$($o.rt)" "$($o.uid)"
        try { [System.Windows.Clipboard]::Clear() } catch {}   # the code is a sign-in: do not leave it lying in the clipboard
        Remove-Item -Force -ErrorAction SilentlyContinue $dataPath, $statusPath
        $script:lastSync = [datetime]::MinValue; return $true
    } catch { return $false }
}

# ---------- start with Windows ----------
$startupLnk = Join-Path ([Environment]::GetFolderPath('Startup')) '步調便利貼.lnk'
function Set-Startup([bool]$on) {
    if (-not $on) { Remove-Item -Force -ErrorAction SilentlyContinue $startupLnk; return }
    $sh = New-Object -ComObject WScript.Shell; $l = $sh.CreateShortcut($startupLnk)
    $l.TargetPath = Join-Path $env:WINDIR 'System32\wscript.exe'; $l.Arguments = '"' + (Join-Path $here 'pace-note.vbs') + '"'; $l.WorkingDirectory = $here; $l.Description = '步調 Pace 桌面便利貼'; $l.Save()
}

# position: last saved place, otherwise top-right of the screen
$wa = [System.Windows.SystemParameters]::WorkArea
$win.Left = $wa.Right - 350; $win.Top = $wa.Top + 10
$pos = Read-Json $posPath
if ($pos -and $pos.left -ge $wa.Left - 200 -and $pos.left -le $wa.Right - 60 -and $pos.top -ge $wa.Top - 20 -and $pos.top -le $wa.Bottom - 60) { $win.Left = $pos.left; $win.Top = $pos.top }

Render

if ($Snapshot) {
    $win.Show(); $win.UpdateLayout()
    $w = [int]$win.ActualWidth; $h = [int]$win.ActualHeight
    $rtb = New-Object System.Windows.Media.Imaging.RenderTargetBitmap $w, $h, 96, 96, ([System.Windows.Media.PixelFormats]::Pbgra32)
    $rtb.Render($win.Content)
    $enc = New-Object System.Windows.Media.Imaging.PngBitmapEncoder; $enc.Frames.Add([System.Windows.Media.Imaging.BitmapFrame]::Create($rtb))
    $fs = [System.IO.File]::Create($Snapshot); $enc.Save($fs); $fs.Close(); $win.Close(); return
}

# the first time it runs, set it to start with Windows (can be turned off from the right-click menu)
$firstRun = Join-Path $dir 'installed'
if (-not (Test-Path $firstRun)) { try { Set-Startup $true } catch {}; Set-Content -Encoding UTF8 $firstRun (Get-Date).ToString('o') }

# drag to move; one click syncs now (or links, when a link code is in the clipboard); 5 quick clicks open the app
$script:taps = 0; $script:lastTap = [datetime]::MinValue
$win.Add_MouseLeftButtonDown({
    $before = "$($win.Left),$($win.Top)"
    try { $win.DragMove() } catch {}
    if ("$($win.Left),$($win.Top)" -ne $before) { Write-Json $posPath @{ left = $win.Left; top = $win.Top }; $script:taps = 0; return }
    $nowTap = Get-Date
    if (($nowTap - $script:lastTap).TotalSeconds -gt 1.8) { $script:taps = 0 }
    $script:lastTap = $nowTap; $script:taps++
    if ($script:taps -ge 5) { $script:taps = 0; Start-Process $appUrl; return }
    $linkedNow = Try-Link
    if (-not (Test-Path $linkPath)) { $script:hint = '剪貼簿裡沒有連結碼：請先在步調按「連結電腦桌面便利貼」'; Render; return }
    if ($linkedNow -or ($nowTap - $script:lastSync).TotalSeconds -gt 3) { Start-Sync }
    Render
})

$menu = New-Object System.Windows.Controls.ContextMenu
$miStart = New-Object System.Windows.Controls.MenuItem; $miStart.Header = '開機時自動啟動'; $miStart.IsCheckable = $true
$miStart.Add_Click({ try { Set-Startup $miStart.IsChecked } catch {} })
$menu.Add_Opened({ $miStart.IsChecked = Test-Path $startupLnk })
foreach ($entry in @(
        @('立刻同步', { Start-Sync; Render }),
        @('打開步調', { Start-Process $appUrl }),
        @('解除連結（登出便利貼）', { Remove-Item -Force -ErrorAction SilentlyContinue $linkPath, $dataPath, $statusPath; $script:hint = ''; Render }))) {
    $mi = New-Object System.Windows.Controls.MenuItem; $mi.Header = $entry[0]; $mi.Add_Click($entry[1]); [void]$menu.Items.Add($mi)
}
[void]$menu.Items.Add($miStart)
$miClose = New-Object System.Windows.Controls.MenuItem; $miClose.Header = '關閉便利貼'; $miClose.Add_Click({ $win.Close() }); [void]$menu.Items.Add($miClose)
$win.ContextMenu = $menu

# every 15 seconds: redraw the clock; pick up a finished sync; sync again after 5 minutes or when the day changes
$timer = New-Object System.Windows.Threading.DispatcherTimer; $timer.Interval = [TimeSpan]::FromSeconds(15)
$timer.Add_Tick({
    try {
        if ($script:worker -and $script:worker.HasExited) { $script:worker = $null; $script:hint = '' }
        $today = (Now).Date
        if ((Test-Path $linkPath) -and (((Get-Date) - $script:lastSync).TotalSeconds -ge $syncEvery -or $today -ne $script:lastDay)) { $script:lastDay = $today; Start-Sync }
        Render
    } catch {}
})
$timer.Start()
# a quicker check while a sync is running, so the result shows as soon as it lands
$fast = New-Object System.Windows.Threading.DispatcherTimer; $fast.Interval = [TimeSpan]::FromMilliseconds(700)
$fast.Add_Tick({ try { if ($script:worker -and $script:worker.HasExited) { $script:worker = $null; $script:hint = ''; Render } } catch {} })
$fast.Start()
if (Test-Path $linkPath) { Start-Sync; Render }
[void]$win.ShowDialog()
