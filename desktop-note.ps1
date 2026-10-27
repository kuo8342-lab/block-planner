# 方塊週排程・桌面便利貼
# 讀取 planner-data.json（每天由 Claude 同步更新），在桌面顯示今天的行程與這週任務。不需要登入。
param([string]$Snapshot, [string]$FakeNow, [string]$Skin)

$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$dataPath = Join-Path $here 'planner-data.json'
$posPath = Join-Path $here 'note-position.json'

if (-not $Snapshot) {
    $created = $false
    $script:mutex = New-Object System.Threading.Mutex($true, 'BlockPlannerDesktopNote', [ref]$created)
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
function HM([int]$m) { '{0:00}:{1:00}' -f [math]::Floor($m / 60), ($m % 60) }
function Now { if ($FakeNow) { [datetime]::Parse($FakeNow) } else { Get-Date } }
function Brush([string]$c) { New-Object System.Windows.Media.SolidColorBrush ([System.Windows.Media.ColorConverter]::ConvertFromString($c)) }

$script:data = $null; $script:dataStamp = [datetime]::MinValue
function Load-Data {
    if (-not (Test-Path $dataPath)) { $script:data = $null; return }
    $stamp = (Get-Item $dataPath).LastWriteTime
    if ($stamp -ne $script:dataStamp) {
        $script:data = Get-Content -Raw -Encoding UTF8 $dataPath | ConvertFrom-Json
        $script:dataStamp = $stamp
    }
}

function Get-Today {
    $d = $script:data; $now = Now
    $dayIdx = ([int]$now.DayOfWeek + 6) % 7
    $mon = $now.Date.AddDays(-$dayIdx); $key = $mon.ToString('yyyy-MM-dd'); $date = $now.ToString('yyyy-MM-dd')
    $week = $null; if ($d.weeks.PSObject.Properties.Name -contains $key) { $week = $d.weeks.$key }
    $blocks = if ($week) { @($week.blocks) } else { @($d.defaultTemplate) }
    $skips = if ($week -and $week.skipFixed) { @($week.skipFixed) } else { @() }
    $hol = @($d.holidays | Where-Object { $_.date -eq $date }) | Select-Object -First 1
    $specials = @($d.special | Where-Object { $_.date -eq $date })
    $replaced = @($specials | ForEach-Object { $_.replaces })
    $items = New-Object System.Collections.ArrayList
    foreach ($f in $d.fixed) {
        if ($f.day -ne $dayIdx -or $replaced -contains $f.id -or $skips -contains $f.id) { continue }
        if ($hol -and ($f.cat -in 'school', 'care' -or ($f.cat -eq 'life' -and (ToMin $f.start) -lt 1080))) { continue }
        [void]$items.Add([pscustomobject]@{ s = ToMin $f.start; e = ToMin $f.end; name = $f.name; cat = $f.cat; done = $false; fixed = $true })
    }
    foreach ($f in $specials) { if ($skips -notcontains $f.id) { [void]$items.Add([pscustomobject]@{ s = ToMin $f.start; e = ToMin $f.end; name = $f.name; cat = $f.cat; done = $false; fixed = $true }) } }
    foreach ($b in $blocks) { if ($b.day -eq $dayIdx) { $s = ToMin $b.start; [void]$items.Add([pscustomobject]@{ s = $s; e = $s + [int]$b.minutes; name = $b.name; cat = $b.cat; done = [bool]$b.done; fixed = $false }) } }
    $weekEnd = $mon.AddDays(6).ToString('yyyy-MM-dd')
    $tasks = @($d.tasks | Where-Object { "$($_.showFrom)" -le $weekEnd } | Sort-Object { if ($_.due) { $_.due } else { '9999' } })
    [pscustomobject]@{ now = $now; nowMin = $now.Hour * 60 + $now.Minute; dayIdx = $dayIdx; items = @($items | Sort-Object s); tasks = $tasks; holiday = $hol; fromTemplate = (-not $week) }
}

[xml]$xaml = @'
<Window xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation" xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        Title="方塊週排程便利貼" Width="330" SizeToContent="Height" WindowStyle="None" AllowsTransparency="True" Background="Transparent"
        ShowInTaskbar="False" ResizeMode="NoResize" Topmost="False" FontFamily="Microsoft JhengHei UI">
  <Grid Margin="14,16,14,18">
    <Border x:Name="Shadow" CornerRadius="4,4,22,4" Margin="3,5,-3,-5" Background="#33000000"/>
    <Border x:Name="Note" CornerRadius="4,4,22,4" Padding="18,22,18,14">
      <StackPanel>
        <Grid>
          <StackPanel Orientation="Horizontal" VerticalAlignment="Bottom">
            <TextBlock x:Name="Clock" FontSize="32" FontWeight="Bold" FontFamily="Consolas"/>
            <TextBlock x:Name="DateText" FontSize="13" Margin="10,0,0,6" VerticalAlignment="Bottom"/>
          </StackPanel>
        </Grid>
        <TextBlock x:Name="Holiday" FontSize="12" FontWeight="Bold" Margin="0,4,0,0" Visibility="Collapsed"/>
        <Border x:Name="NowCard" CornerRadius="10" Padding="12,9" Margin="0,10,0,0">
          <StackPanel>
            <TextBlock x:Name="NowLabel" FontSize="11" FontWeight="Bold" Opacity="0.75"/>
            <TextBlock x:Name="NowName" FontSize="18" FontWeight="Bold" TextWrapping="Wrap" Margin="0,2,0,0"/>
            <TextBlock x:Name="NowLeft" FontSize="12" Margin="0,3,0,0" Opacity="0.8"/>
          </StackPanel>
        </Border>
        <TextBlock Text="今天接下來" FontSize="12" FontWeight="Bold" Margin="0,12,0,4" x:Name="NextTitle"/>
        <StackPanel x:Name="NextList"/>
        <TextBlock Text="這週任務" FontSize="12" FontWeight="Bold" Margin="0,12,0,4" x:Name="TaskTitle"/>
        <StackPanel x:Name="TaskList"/>
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
$ui = @{}; foreach ($n in 'Note', 'Tape', 'Clock', 'DateText', 'Holiday', 'NowCard', 'NowLabel', 'NowName', 'NowLeft', 'NextTitle', 'NextList', 'TaskTitle', 'TaskList', 'Foot') { $ui[$n] = $win.FindName($n) }

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
    if (-not $script:data) {
        $ui.NowCard.Background = Brush $p.card; $ui.NowLabel.Text = '還沒有資料'; $ui.NowLabel.Foreground = Brush $p.sub
        $ui.NowName.Text = '等 Claude 下次同步'; $ui.NowLeft.Text = ''; $ui.Foot.Text = '連點 5 下打開完整 App'; return
    }
    $t = Get-Today
    if ($t.holiday) { $ui.Holiday.Text = "今天放假：$($t.holiday.name)"; $ui.Holiday.Visibility = 'Visible' } else { $ui.Holiday.Visibility = 'Collapsed' }
    $cur = @($t.items | Where-Object { $_.s -le $t.nowMin -and $t.nowMin -lt $_.e }) | Select-Object -Last 1
    if ($cur) {
        $c = $catColor["$($cur.cat)"]; if (-not $c) { $c = $p.accent }
        $ui.NowCard.Background = Brush ('#33' + $c.Substring(1)); $ui.NowLabel.Foreground = Brush $p.fg
        $ui.NowLabel.Text = '現在'; $ui.NowName.Text = ($(if ($cur.done) { '✓ ' } else { '' }) + $cur.name)
        $ui.NowLeft.Text = "到 $(HM $cur.e)・還有 $($cur.e - $t.nowMin) 分鐘"
    } else {
        $ui.NowCard.Background = Brush $p.card; $ui.NowLabel.Foreground = Brush $p.sub
        $ui.NowLabel.Text = '現在'; $ui.NowName.Text = '空檔'; $ui.NowLeft.Text = ''
    }
    $next = @($t.items | Where-Object { $_.s -gt $t.nowMin }) | Select-Object -First 6
    if ($next.Count) { foreach ($i in $next) { $c = $catColor["$($i.cat)"]; if (-not $c) { $c = $p.accent }; Add-Row $ui.NextList $c "$(HM $i.s)–$(HM $i.e)" $i.name $p $i.done } }
    else { Add-Row $ui.NextList $p.sub '' '今天沒有其他行程了' $p $false }
    $tasks = @($t.tasks) | Select-Object -First 5
    if ($tasks.Count) { foreach ($k in $tasks) { $due = if ($k.due) { ' （' + ([datetime]$k.due).ToString('M/d') + '）' } else { '' }; Add-Row $ui.TaskList $p.accent '' ("$($k.title)$due") $p $false } }
    else { Add-Row $ui.TaskList $p.sub '' '這週沒有待辦任務' $p $false }
    $exp = try { ([datetime]$script:data.exportedAt).ToLocalTime().ToString('M/d HH:mm') } catch { '?' }
    $ui.Foot.Text = "資料更新：$exp$(if ($t.fromTemplate) { '（這週還沒排，顯示預設計畫）' } else { '' })`n連點 5 下打開完整 App・右鍵有更多選項"
}

# position: last saved place, otherwise top-right of the screen
$wa = [System.Windows.SystemParameters]::WorkArea
$win.Left = $wa.Right - 350; $win.Top = $wa.Top + 10
if (Test-Path $posPath) { try { $pos = Get-Content -Raw $posPath | ConvertFrom-Json; if ($pos.left -ge $wa.Left - 200 -and $pos.left -le $wa.Right - 60) { $win.Left = $pos.left; $win.Top = $pos.top } } catch {} }

Render

if ($Snapshot) {
    $win.Show(); $win.UpdateLayout()
    $w = [int]$win.ActualWidth; $h = [int]$win.ActualHeight
    $rtb = New-Object System.Windows.Media.Imaging.RenderTargetBitmap $w, $h, 96, 96, ([System.Windows.Media.PixelFormats]::Pbgra32)
    $rtb.Render($win.Content)
    $enc = New-Object System.Windows.Media.Imaging.PngBitmapEncoder; $enc.Frames.Add([System.Windows.Media.Imaging.BitmapFrame]::Create($rtb))
    $fs = [System.IO.File]::Create($Snapshot); $enc.Save($fs); $fs.Close(); $win.Close(); return
}

# drag to move; 5 quick clicks open the full app
$script:taps = 0; $script:lastTap = [datetime]::MinValue
$win.Add_MouseLeftButtonDown({
    $before = "$($win.Left),$($win.Top)"
    try { $win.DragMove() } catch {}
    if ("$($win.Left),$($win.Top)" -ne $before) {
        @{ left = $win.Left; top = $win.Top } | ConvertTo-Json | Set-Content -Encoding UTF8 $posPath
        $script:taps = 0; return
    }
    $nowTap = Get-Date
    if (($nowTap - $script:lastTap).TotalSeconds -gt 1.8) { $script:taps = 0 }
    $script:lastTap = $nowTap; $script:taps++
    if ($script:taps -ge 5) { $script:taps = 0; Start-Process ($(if ($script:data -and $script:data.appUrl) { $script:data.appUrl } else { 'https://claude.ai/artifact/RRaj3mqydYHndBP93vSeUg' })) }
})

$menu = New-Object System.Windows.Controls.ContextMenu
foreach ($entry in @(@('打開完整 App', { Start-Process 'https://claude.ai/artifact/RRaj3mqydYHndBP93vSeUg' }), @('重新整理', { $script:dataStamp = [datetime]::MinValue; Render }), @('關閉便利貼', { $win.Close() }))) {
    $mi = New-Object System.Windows.Controls.MenuItem; $mi.Header = $entry[0]; $mi.Add_Click($entry[1]); [void]$menu.Items.Add($mi)
}
$win.ContextMenu = $menu

$timer = New-Object System.Windows.Threading.DispatcherTimer; $timer.Interval = [TimeSpan]::FromSeconds(20)
$timer.Add_Tick({ try { Render } catch {} }); $timer.Start()
[void]$win.ShowDialog()
