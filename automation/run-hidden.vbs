' Runs tick.js (BlockPlanner local reminders) without a console window
Set fso = CreateObject("Scripting.FileSystemObject")
Set sh = CreateObject("WScript.Shell")
dir = fso.GetParentFolderName(WScript.ScriptFullName)
node = "node.exe"
If fso.FileExists(sh.ExpandEnvironmentStrings("%ProgramFiles%") & "\nodejs\node.exe") Then node = sh.ExpandEnvironmentStrings("%ProgramFiles%") & "\nodejs\node.exe"
sh.CurrentDirectory = dir
sh.Run """" & node & """ """ & dir & "\tick.js""", 0, False
