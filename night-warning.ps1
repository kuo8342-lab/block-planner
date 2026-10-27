# 晚睡警告：由「工作排程器」在 23:00 後每 10 分鐘執行一次（電腦關機就不會執行）。
$now = Get-Date
if ($now.Hour -ge 3 -and $now.Hour -lt 23) { return }

$time = $now.ToString('HH:mm')
if ($now.Hour -eq 23 -and $now.Minute -lt 30) {
    $title = "$time 了，準備睡覺"
    $body  = '收尾一下，23:30 前上床。'
} else {
    $title = "已經 $time 了，超過 23:30"
    $body  = '存好檔、放下手機，去睡吧。明天的你會感謝現在的你。'
}

[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
[Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] | Out-Null

$esc = { param($s) [System.Security.SecurityElement]::Escape($s) }
$xml = @"
<toast scenario="reminder" launch="https://claude.ai/artifact/RRaj3mqydYHndBP93vSeUg" activationType="protocol">
  <visual>
    <binding template="ToastGeneric">
      <text>$(& $esc "晚睡警告｜$title")</text>
      <text>$(& $esc $body)</text>
    </binding>
  </visual>
  <actions>
    <action content="知道了" arguments="dismiss" activationType="system"/>
  </actions>
  <audio src="ms-winsoundevent:Notification.Reminder"/>
</toast>
"@

$doc = New-Object Windows.Data.Xml.Dom.XmlDocument
$doc.LoadXml($xml)
$toast = [Windows.UI.Notifications.ToastNotification]::new($doc)
$toast.Tag = 'night-warning'
$toast.Group = 'block-planner'
$appId = '{1AC14E77-02E7-4E5D-B744-2EB1AE5198B7}\WindowsPowerShell\v1.0\powershell.exe'
[Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier($appId).Show($toast)
