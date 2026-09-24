Option Explicit
Dim shell, files, root
Set shell = CreateObject("WScript.Shell")
Set files = CreateObject("Scripting.FileSystemObject")
root = files.GetParentFolderName(WScript.ScriptFullName)
shell.CurrentDirectory = root
On Error Resume Next
shell.Run "node """ & root & "\scripts\launch.mjs""", 0, False
If Err.Number <> 0 Then
  MsgBox "Could not start Zotero Research. Install Node.js 22+ and run setup-windows.cmd first.", 48, "Zotero Research"
End If
