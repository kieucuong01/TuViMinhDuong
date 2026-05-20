param(
  [int]$Port = 4000,
  [string]$HostName = "0.0.0.0"
)

$ErrorActionPreference = "Continue"
$Root = Split-Path -Parent $PSScriptRoot
$Node = "C:\Users\ASUS\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
$Next = Join-Path $Root "node_modules\next\dist\bin\next"
$LogDir = Join-Path $Root ".next"
$OutLog = Join-Path $LogDir "keepalive-$Port.out.log"
$ErrLog = Join-Path $LogDir "keepalive-$Port.err.log"

if (!(Test-Path $LogDir)) {
  New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
}

Set-Location -LiteralPath $Root

"[$(Get-Date -Format o)] keepalive started on port $Port" | Add-Content -Path $OutLog

while ($true) {
  try {
    $existing = netstat -ano | Select-String ":$Port\s" | Select-String "LISTENING"
    foreach ($line in $existing) {
      if ($line -match "LISTENING\s+(\d+)$") {
        $pidToStop = [int]$Matches[1]
        try {
          Stop-Process -Id $pidToStop -Force -ErrorAction Stop
          "[$(Get-Date -Format o)] stopped existing listener PID $pidToStop on port $Port" | Add-Content -Path $OutLog
        } catch {
          "[$(Get-Date -Format o)] could not stop PID $pidToStop on port ${Port}: $($_.Exception.Message)" | Add-Content -Path $ErrLog
        }
      }
    }

    "[$(Get-Date -Format o)] starting next on port $Port" | Add-Content -Path $OutLog
    $nextArgs = "`"$Next`" start -p $Port -H $HostName"
    $process = Start-Process -FilePath $Node `
      -ArgumentList $nextArgs `
      -WorkingDirectory $Root `
      -RedirectStandardOutput $OutLog `
      -RedirectStandardError $ErrLog `
      -WindowStyle Hidden `
      -PassThru

    "[$(Get-Date -Format o)] next PID $($process.Id)" | Add-Content -Path $OutLog
    Wait-Process -Id $process.Id
    "[$(Get-Date -Format o)] next exited on port $Port; restarting in 2s" | Add-Content -Path $ErrLog
  } catch {
    "[$(Get-Date -Format o)] keepalive error on port ${Port}: $($_.Exception.Message)" | Add-Content -Path $ErrLog
  }

  Start-Sleep -Seconds 2
}
