[CmdletBinding()]
param(
  [Parameter(Position = 0)]
  [ValidateSet("doctor", "mcp", "claude", "stats", "smoke")]
  [string]$Action = "doctor",

  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$PassThrough = @()
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$repoRoot = Split-Path -Parent $PSScriptRoot
$proxyUrl = "http://127.0.0.1:8787"

$env:HEADROOM_TELEMETRY = "off"
$env:HEADROOM_MEMORY_DB_PATH = Join-Path $env:USERPROFILE ".headroom\memory.db"
$env:HEADROOM_MEMORY_PROJECT_ROOT = $repoRoot
$env:HEADROOM_SAVINGS_PATH = Join-Path $env:USERPROFILE ".headroom\proxy_savings.json"

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
  try {
    $health = Invoke-RestMethod -Uri "$proxyUrl/health" -TimeoutSec 2
    return $health.status -eq "healthy"
  } catch {
    return $false
  }
}

function Ensure-HeadroomProxy {
  param([Parameter(Mandatory = $true)][string]$HeadroomPath)

  if (Test-HeadroomProxy) {
    return
  }

  $arguments = @(
    "proxy",
    "--host", "127.0.0.1",
    "--port", "8787",
    "--no-telemetry",
    "--memory",
    "--memory-storage", "project"
  )
  Start-Process -FilePath $HeadroomPath -ArgumentList $arguments -WorkingDirectory $env:USERPROFILE -WindowStyle Hidden

  for ($attempt = 1; $attempt -le 40; $attempt += 1) {
    if (Test-HeadroomProxy) {
      return
    }
    Start-Sleep -Milliseconds 500
  }

  throw "Headroom proxy không khởi động trên $proxyUrl. Chạy thủ công '$HeadroomPath proxy --no-telemetry' để xem log."
}

$headroom = Find-Headroom

switch ($Action) {
  "mcp" {
    Ensure-HeadroomProxy -HeadroomPath $headroom
    & $headroom mcp serve --proxy-url $proxyUrl
    exit $LASTEXITCODE
  }

  "claude" {
    if (-not (Get-Command claude -ErrorAction SilentlyContinue)) {
      throw "Claude Code CLI chưa được cài hoặc chưa có trong PATH. Cài Claude Code rồi chạy lại npm run agent:headroom:claude."
    }
    Set-Location $repoRoot
    & $headroom wrap claude --memory --tool-search true @PassThrough
    exit $LASTEXITCODE
  }

  "stats" {
    Ensure-HeadroomProxy -HeadroomPath $headroom
    Invoke-RestMethod -Uri "$proxyUrl/stats" -TimeoutSec 10 | ConvertTo-Json -Depth 8
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
