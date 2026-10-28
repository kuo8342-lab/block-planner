[CmdletBinding()]
param([switch]$NoBrowser)

$ErrorActionPreference = 'Stop'
$paceRoot = Split-Path -Parent $PSScriptRoot
$paceUrl = 'http://127.0.0.1:5175/'

function Test-PacePreview {
    try {
        $page = Invoke-WebRequest -Uri $paceUrl -UseBasicParsing -TimeoutSec 2
        return $page.StatusCode -eq 200 -and $page.Content.Contains('pacePages')
    } catch { return $false }
}

try {
    if (-not (Test-PacePreview)) {
        $nodeCommand = Get-Command node.exe -ErrorAction SilentlyContinue
        $nodeCandidates = @(
            $nodeCommand.Source,
            (Join-Path $env:ProgramFiles 'nodejs\node.exe'),
            (Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe')
        )
        $paceNode = $nodeCandidates | Where-Object { $_ -and (Test-Path -LiteralPath $_ -PathType Leaf) } | Select-Object -First 1
        if (-not $paceNode) { throw 'Node.js could not be found. Please install Node.js, then try again.' }
        $logDirectory = Join-Path $env:LOCALAPPDATA 'BlockPlanner'
        New-Item -ItemType Directory -Path $logDirectory -Force | Out-Null
        $env:PORT = '5175'
        $serverFile = Join-Path $PSScriptRoot 'serve.cjs'
        $server = Start-Process -FilePath $paceNode -ArgumentList ('"' + $serverFile + '"') -WorkingDirectory $paceRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $logDirectory 'preview.log') -RedirectStandardError (Join-Path $logDirectory 'preview-error.log')
        $ready = $false
        for ($attempt = 0; $attempt -lt 20; $attempt++) {
            Start-Sleep -Milliseconds 300
            if (Test-PacePreview) { $ready = $true; break }
            if ($server.HasExited) { break }
        }
        if (-not $ready) { throw ('The local preview could not start on port 5175. Details: ' + (Join-Path $logDirectory 'preview-error.log')) }
    }
    if ($NoBrowser) { Write-Output $paceUrl }
    else { Start-Process -FilePath $paceUrl }
} catch {
    if ($NoBrowser) { throw }
    Add-Type -AssemblyName System.Windows.Forms
    [System.Windows.Forms.MessageBox]::Show($_.Exception.Message, 'Block Planner', 'OK', 'Error') | Out-Null
    exit 1
}
