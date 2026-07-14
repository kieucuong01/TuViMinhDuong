[CmdletBinding()]
param(
  [Parameter(Position = 0)]
  [ValidateSet("doctor", "mcp", "claude", "codex", "stats", "smoke", "start")]
  [string]$Action = "doctor",

  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$PassThrough = @()
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$repoRoot = Split-Path -Parent $PSScriptRoot
$defaultProxyPort = 8787
$proxyPort = if ($env:HEADROOM_PROXY_PORT) { [int]$env:HEADROOM_PROXY_PORT } else { $defaultProxyPort }
$proxyUrl = "http://127.0.0.1:$proxyPort"

$env:HEADROOM_TELEMETRY = "off"
$env:HEADROOM_MEMORY_DB_PATH = Join-Path $env:USERPROFILE ".headroom\memory.db"
$env:HEADROOM_MEMORY_PROJECT_ROOT = $repoRoot
$env:HEADROOM_SAVINGS_PATH = Join-Path $env:USERPROFILE ".headroom\proxy_savings.json"

function Get-HeadroomStartupTimeoutSeconds {
  $rawValue = $env:HEADROOM_PROXY_STARTUP_TIMEOUT_SECONDS
  if ([string]::IsNullOrWhiteSpace($rawValue)) {
    return 120
  }

  $timeoutSeconds = 0
  if ([int]::TryParse($rawValue, [ref]$timeoutSeconds) -and $timeoutSeconds -gt 0) {
    return $timeoutSeconds
  }

  return 120
}

function Find-Headroom {
  $command = Get-Command headroom.exe -ErrorAction SilentlyContinue
  if (-not $command) {
    $command = Get-Command headroom -ErrorAction SilentlyContinue
  }
  if ($command) {
    return $command.Source
  }

  $fallback = Join-Path $env:USERPROFILE ".local\bin\headroom.exe"
  if (Test-Path -LiteralPath $fallback) {
    return $fallback
  }

  throw "Headroom chưa được cài. Chạy: uv tool install --force `"headroom-ai[mcp,proxy]`""
}

function Find-HeadroomPython {
  $candidates = @(
    (Join-Path $env:APPDATA "uv\tools\headroom-ai\Scripts\python.exe"),
    (Join-Path $env:USERPROFILE ".local\share\uv\tools\headroom-ai\Scripts\python.exe")
  )

  foreach ($candidate in $candidates) {
    if ($candidate -and (Test-Path -LiteralPath $candidate)) {
      return $candidate
    }
  }

  $command = Get-Command python.exe -ErrorAction SilentlyContinue
  if ($command) {
    return $command.Source
  }

  throw "Không tìm thấy Python runtime của Headroom. Chạy lại: uv tool install --force `"headroom-ai[mcp,proxy]`""
}

function Test-HeadroomProxy {
  foreach ($path in @("readyz", "health")) {
    try {
      $health = Invoke-RestMethod -Uri "$proxyUrl/$path" -TimeoutSec 2
      if (($health.ready -eq $true) -or ($health.status -eq "healthy")) {
        return $true
      }
    } catch {
      continue
    }
  }

  return $false
}

function Ensure-HeadroomProxy {
  param([Parameter(Mandatory = $true)][string]$HeadroomPath)

  if (Test-HeadroomProxy) {
    return
  }

  $arguments = @(
    "proxy",
    "--host", "127.0.0.1",
    "--port", "$proxyPort",
    "--no-telemetry",
    "--memory",
    "--memory-storage", "project"
  )
  $proxyProcess = Start-Process -FilePath $HeadroomPath -ArgumentList $arguments -WorkingDirectory $env:USERPROFILE -WindowStyle Hidden -PassThru
  $timeoutSeconds = Get-HeadroomStartupTimeoutSeconds
  $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()

  while ($stopwatch.Elapsed.TotalSeconds -lt $timeoutSeconds) {
    if (Test-HeadroomProxy) {
      return
    }

    if ($proxyProcess.HasExited) {
      throw "Headroom proxy dừng trước khi sẵn sàng trên $proxyUrl. Exit code: $($proxyProcess.ExitCode). Chạy thủ công '$HeadroomPath proxy --host 127.0.0.1 --port $proxyPort --no-telemetry --memory --memory-storage project' để xem log."
    }

    Start-Sleep -Milliseconds 500
  }

  throw "Headroom proxy không khởi động trên $proxyUrl sau $timeoutSeconds giây. Chạy thủ công '$HeadroomPath proxy --host 127.0.0.1 --port $proxyPort --no-telemetry --memory --memory-storage project' để xem log."
}

function Get-HeadroomStats {
  try {
    return [ordered]@{
      source = "stats"
      stats = Invoke-RestMethod -Uri "$proxyUrl/stats" -TimeoutSec 5
    }
  } catch {
    $statsError = $_.Exception.Message
  }

  $health = Invoke-RestMethod -Uri "$proxyUrl/health" -TimeoutSec 10
  $history = $null
  $historyError = $null

  try {
    $history = Invoke-RestMethod -Uri "$proxyUrl/stats-history" -TimeoutSec 10
  } catch {
    $historyError = $_.Exception.Message
  }

  return [ordered]@{
    source = "stats-fallback"
    note = "/stats timed out or failed; using /health and /stats-history."
    stats_error = $statsError
    health = $health
    stats_history = $history
    stats_history_error = $historyError
  }
}

$headroom = Find-Headroom

switch ($Action) {
  "mcp" {
    Ensure-HeadroomProxy -HeadroomPath $headroom
    & $headroom mcp serve --proxy-url $proxyUrl
    exit $LASTEXITCODE
  }

  "start" {
    Ensure-HeadroomProxy -HeadroomPath $headroom
    Invoke-RestMethod -Uri "$proxyUrl/readyz" -TimeoutSec 10 | ConvertTo-Json -Depth 8
    break
  }

  "claude" {
    if (-not (Get-Command claude -ErrorAction SilentlyContinue)) {
      throw "Claude Code CLI chưa được cài hoặc chưa có trong PATH. Cài Claude Code rồi chạy lại npm run agent:headroom:claude."
    }
    Set-Location $repoRoot
    & $headroom wrap claude --port $proxyPort --memory --tool-search true @PassThrough
    exit $LASTEXITCODE
  }

  "codex" {
    if (-not (Get-Command codex -ErrorAction SilentlyContinue)) {
      throw "Codex CLI chưa được cài hoặc chưa có trong PATH. Với Codex Desktop, dùng MCP Headroom cho output lớn; không thể route phiên Desktop hiện tại qua wrapper repo."
    }
    Set-Location $repoRoot
    & $headroom wrap codex --port $proxyPort --memory @PassThrough
    exit $LASTEXITCODE
  }

  "stats" {
    Ensure-HeadroomProxy -HeadroomPath $headroom
    Get-HeadroomStats | ConvertTo-Json -Depth 12
    break
  }

  "smoke" {
    $python = Find-HeadroomPython
    $smokeScript = Join-Path $PSScriptRoot "headroom-smoke.py"
    $resultText = & $python $smokeScript
    if ($LASTEXITCODE -ne 0) {
      throw "Headroom smoke không nén được payload MCP/tool-output. Output: $resultText"
    }
    $result = $resultText | ConvertFrom-Json
    $tokensSaved = [int]$result.tokensSaved
    if ($tokensSaved -le 0) {
      throw "Headroom smoke chạy nhưng không tiết kiệm token."
    }
    $result | ConvertTo-Json -Depth 8
    break
  }

  default {
    Ensure-HeadroomProxy -HeadroomPath $headroom
    & $headroom --version
    if ($LASTEXITCODE -ne 0) {
      exit $LASTEXITCODE
    }
    & $headroom doctor --json
    $doctorExitCode = $LASTEXITCODE
    if ($doctorExitCode -ge 2) {
      exit $doctorExitCode
    }
    exit 0
  }
}
