' Opens the Pace desktop note without a console window, and keeps it open:
' while %APPDATA%\PaceNote\keep-open exists (the note's "keep open" setting), the note is started again
' whenever it closes, crashes or is ended. Exit code 3 = another copy is already open, so stop.
Set fso = CreateObject("Scripting.FileSystemObject")
Set sh = CreateObject("WScript.Shell")
here = fso.GetParentFolderName(WScript.ScriptFullName)
flag = sh.ExpandEnvironmentStrings("%APPDATA%") & "\PaceNote\keep-open"
cmd = "powershell.exe -NoProfile -STA -ExecutionPolicy Bypass -File """ & here & "\pace-note.ps1"""
wait = 2
Do
  t0 = Timer
  rc = sh.Run(cmd, 0, True)
  If rc = 3 Then Exit Do
  If Not fso.FileExists(flag) Then Exit Do
  If Not fso.FileExists(here & "\pace-note.ps1") Then Exit Do
  ran = Timer - t0
  If ran < 0 Then ran = ran + 86400
  If ran < 30 Then wait = wait * 2 Else wait = 2
  If wait > 120 Then wait = 120
  WScript.Sleep wait * 1000
Loop
