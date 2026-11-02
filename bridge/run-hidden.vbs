' Runs a-to-c.js (A -> Pace bridge) without a console window
Set fso = CreateObject("Scripting.FileSystemObject")
Set sh = CreateObject("WScript.Shell")
dir = fso.GetParentFolderName(WScript.ScriptFullName)
node = "node.exe"
If fso.FileExists(sh.ExpandEnvironmentStrings("%ProgramFiles%") & "\nodejs\node.exe") Then node = sh.ExpandEnvironmentStrings("%ProgramFiles%") & "\nodejs\node.exe"
sh.CurrentDirectory = dir
' output goes to bridge\log.txt so a failed run can be read later
sh.Run "cmd /c """"" & node & """ """ & dir & "\a-to-c.js"" >> """ & dir & "\log.txt"" 2>&1""", 0, False
