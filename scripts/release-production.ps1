[CmdletBinding()]
param(
  [Parameter(Mandatory = $true, Position = 0)]
  [ValidateNotNullOrEmpty()]
  [string]$Message,

  [switch]$Migrate,
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot
$env:XDG_CONFIG_HOME = [System.IO.Path]::GetTempPath()

$bundledNodeDirectory = Join-Path $env:USERPROFILE ".cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin"
if (Test-Path -LiteralPath (Join-Path $bundledNodeDirectory "node.exe")) {
  $env:PATH = "$bundledNodeDirectory;$env:PATH"
}

$git = (Get-Command git.exe -ErrorAction Stop).Source
$npmCommand = Get-Command npm.cmd -ErrorAction SilentlyContinue
if (-not $npmCommand) {
  $npmCommand = Get-Command npm -ErrorAction Stop
}
$npm = $npmCommand.Source
$ssh = (Get-Command ssh.exe -ErrorAction Stop).Source
$curl = (Get-Command curl.exe -ErrorAction Stop).Source

function Invoke-NativeCommand {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Label,
    [Parameter(Mandatory = $true)]
    [string]$FilePath,
    [string[]]$Arguments = @()
  )

  Write-Host ""
  Write-Host "==> $Label" -ForegroundColor Cyan
  $previousErrorActionPreference = $ErrorActionPreference
  try {
    $ErrorActionPreference = "Continue"
    & $FilePath @Arguments
    $exitCode = $LASTEXITCODE
  } finally {
    $ErrorActionPreference = $previousErrorActionPreference
  }
  if ($exitCode -ne 0) {
    throw "$Label failed with exit code $exitCode."
  }
}

function Get-NativeOutput {
  param(
    [Parameter(Mandatory = $true)]
    [string]$FilePath,
    [string[]]$Arguments = @()
  )

  $previousErrorActionPreference = $ErrorActionPreference
  try {
    $ErrorActionPreference = "Continue"
    $output = & $FilePath @Arguments 2>&1
    $exitCode = $LASTEXITCODE
  } finally {
    $ErrorActionPreference = $previousErrorActionPreference
  }
  if ($exitCode -ne 0) {
    throw ($output -join [Environment]::NewLine)
  }
  return @($output)
}

function Get-RepositoryStatus {
  return @(Get-NativeOutput -FilePath $git -Arguments @("status", "--porcelain=v1", "--untracked-files=all"))
}

function Assert-ReleaseFilesAreSafe {
  param([string[]]$StatusLines)

  $blocked = @(foreach ($line in $StatusLines) {
    if ($line.Length -lt 4) {
      continue
    }

    $path = $line.Substring(3)
    if ($path.Contains(" -> ")) {
      $path = ($path -split " -> ")[-1]
    }
    $normalizedPath = $path.Trim('"').Replace("\", "/")

    if (
      $normalizedPath -match '(^|/)\.env($|\.)' -or
      $normalizedPath -match '(^|/)\.next($|/)' -or
      $normalizedPath -match '(^|/)node_modules($|/)' -or
      $normalizedPath -match '(^|/)src/generated/prisma($|/)' -or
      $normalizedPath -match '\.log$'
    ) {
      $normalizedPath
    }
  })

  if ($blocked.Count -gt 0) {
    throw "Release stopped because generated, secret, or log files are present:`n$($blocked -join "`n")"
  }
}

function Assert-Http200 {
  param([Parameter(Mandatory = $true)][string]$Url)

  for ($attempt = 1; $attempt -le 12; $attempt += 1) {
    $statusCode = (& $curl -L -sS -o NUL -w "%{http_code}" $Url).Trim()
    if ($LASTEXITCODE -eq 0 -and $statusCode -eq "200") {
      Write-Host "200 $Url" -ForegroundColor Green
      return
    }
    Start-Sleep -Seconds 2
  }

  throw "Production smoke failed: $Url did not return HTTP 200."
}

$branch = (Get-NativeOutput -FilePath $git -Arguments @("branch", "--show-current") | Select-Object -First 1).Trim()
if ($branch -ne "master") {
  throw "Release production only runs from master. Current branch: $branch"
}

$statusLines = @(Get-RepositoryStatus)
if ($statusLines.Count -eq 0) {
  throw "No repository changes to commit."
}
Assert-ReleaseFilesAreSafe -StatusLines $statusLines

Write-Host "Files included in this release:" -ForegroundColor Yellow
$statusLines | ForEach-Object { Write-Host $_ }

if ($DryRun) {
  Write-Host ""
  Write-Host "Dry run only. The real command will run:" -ForegroundColor Yellow
  Write-Host "npm run lint"
  Write-Host "npm test"
  Write-Host "npm run build"
  Write-Host "git add --all"
  Write-Host "git commit -m `"$Message`""
  Write-Host "git push origin master"
  Write-Host "VPS release build, symlink switch, PM2 restart, and production smoke"
  Write-Host "npm run pseo:seed on the new VPS release before build"
  Write-Host "npm run seed:interpretations on the new VPS release before build"
  if ($Migrate) {
    Write-Host "npm run db:deploy on the new VPS release"
  }
  exit 0
}

Invoke-NativeCommand -Label "Fetch origin/master" -FilePath $git -Arguments @("fetch", "origin", "master")
$divergence = (
  Get-NativeOutput -FilePath $git -Arguments @("rev-list", "--left-right", "--count", "origin/master...HEAD") |
    Select-Object -First 1
).Trim() -split "\s+"
if ([int]$divergence[0] -gt 0) {
  throw "Local master is behind origin/master. Pull and resolve changes before releasing."
}

Invoke-NativeCommand -Label "npm run lint" -FilePath $npm -Arguments @("run", "lint")
Invoke-NativeCommand -Label "npm test" -FilePath $npm -Arguments @("test")
Invoke-NativeCommand -Label "npm run build" -FilePath $npm -Arguments @("run", "build")

$statusLines = Get-RepositoryStatus
Assert-ReleaseFilesAreSafe -StatusLines $statusLines

Invoke-NativeCommand -Label "git add --all" -FilePath $git -Arguments @("add", "--all")
& $git diff --cached --quiet
if ($LASTEXITCODE -eq 0) {
  throw "No staged changes remain after verification."
}
if ($LASTEXITCODE -ne 1) {
  throw "Unable to inspect staged changes."
}

Invoke-NativeCommand -Label "Commit release" -FilePath $git -Arguments @("commit", "-m", $Message)
Invoke-NativeCommand -Label "git push origin master" -FilePath $git -Arguments @("push", "origin", "master")

$commitSha = (Get-NativeOutput -FilePath $git -Arguments @("rev-parse", "HEAD") | Select-Object -First 1).Trim()
$shortSha = $commitSha.Substring(0, 7)
$releaseName = "$(Get-Date -Format 'yyyyMMddHHmmss')-$shortSha"
$migrateFlag = if ($Migrate) { "1" } else { "0" }

$remoteScript = @'
set -euo pipefail

EXPECTED_SHA="$1"
RELEASE_NAME="$2"
RUN_MIGRATIONS="$3"
APP_ROOT="/opt/lasotinhhoa"
RELEASE_DIR="$APP_ROOT/releases/$RELEASE_NAME"
CURRENT_DIR="$APP_ROOT/current"
REPO_URL="https://github.com/kieucuong01/TuViMinhDuong.git"
PREVIOUS_RELEASE="$(readlink -f "$CURRENT_DIR" 2>/dev/null || true)"
RELEASES_TO_KEEP=3
deploy_succeeded="0"

start_app() {
  local app_dir="$1"
  cd "$app_dir"
  pm2 delete lasotinhhoa >/dev/null 2>&1 || true
  pm2 start node_modules/next/dist/bin/next --name lasotinhhoa -- start -p 4100 -H 127.0.0.1
}

cleanup_npm_cache() {
  npm cache clean --force >/dev/null 2>&1 || true
  rm -rf -- /root/.npm/_cacache/tmp 2>/dev/null || true
}

cleanup_old_releases() {
  mkdir -p "$APP_ROOT/releases"

  local current_release
  current_release="$(readlink -f "$CURRENT_DIR" 2>/dev/null || true)"

  local release_rows=()
  local release_path
  if [ -n "$current_release" ] && [ -d "$current_release" ]; then
    release_rows+=("9999999999 $current_release")
  fi
  while IFS= read -r release_path; do
    if [ "$release_path" = "$current_release" ]; then
      continue
    fi
    if [ -f "$release_path/.next/BUILD_ID" ] && [ -f "$release_path/node_modules/next/dist/bin/next" ]; then
      release_rows+=("$(stat -c '%Y' "$release_path") $release_path")
    fi
  done < <(find "$APP_ROOT/releases" -maxdepth 1 -mindepth 1 -type d -print)

  mapfile -t keep_releases < <(printf '%s\n' "${release_rows[@]}" | sort -rn | head -n "$RELEASES_TO_KEEP" | cut -d' ' -f2-)

  for release_path in "$APP_ROOT"/releases/*; do
    [ -d "$release_path" ] || continue
    local keep="0"
    local keep_release
    for keep_release in "${keep_releases[@]}"; do
      if [ "$release_path" = "$keep_release" ]; then
        keep="1"
        break
      fi
    done
    if [ "$keep" != "1" ]; then
      echo "Removing old or incomplete release: $release_path"
      rm -rf -- "$release_path"
    fi
  done
}

cleanup_failed_release() {
  if [ "$deploy_succeeded" = "1" ]; then
    return
  fi

  if [ -d "$RELEASE_DIR" ]; then
    local active_release
    active_release="$(readlink -f "$CURRENT_DIR" 2>/dev/null || true)"
    if [ "$active_release" != "$RELEASE_DIR" ]; then
      echo "Removing failed release: $RELEASE_DIR"
      rm -rf -- "$RELEASE_DIR"
    fi
  fi
}

trap cleanup_failed_release EXIT

mkdir -p "$APP_ROOT/releases"
cleanup_old_releases
cleanup_npm_cache
if [ -e "$RELEASE_DIR" ]; then
  echo "Release already exists: $RELEASE_DIR" >&2
  exit 1
fi

git clone --quiet --branch master --single-branch "$REPO_URL" "$RELEASE_DIR"
cd "$RELEASE_DIR"
ACTUAL_SHA="$(git rev-parse HEAD)"
if [ "$ACTUAL_SHA" != "$EXPECTED_SHA" ]; then
  echo "Expected commit $EXPECTED_SHA but cloned $ACTUAL_SHA" >&2
  exit 1
fi
rm -rf -- "$RELEASE_DIR/.git"

if [ -d "$CURRENT_DIR" ]; then
  for env_file in "$CURRENT_DIR"/.env "$CURRENT_DIR"/.env.*; do
    if [ -f "$env_file" ]; then
      cp "$env_file" "$RELEASE_DIR/"
    fi
  done
fi

npm ci
node scripts/check-production-env.mjs
if [ "$RUN_MIGRATIONS" = "1" ]; then
  npm run db:deploy
fi
npm run pseo:seed
npm run seed:interpretations
npm run build

ln -sfn "$RELEASE_DIR" "$CURRENT_DIR"
start_app "$RELEASE_DIR"

healthy="0"
for attempt in $(seq 1 30); do
  if curl -fsS "http://127.0.0.1:4100/kien-thuc-tu-vi" >/dev/null; then
    healthy="1"
    break
  fi
  sleep 1
done

if [ "$healthy" != "1" ]; then
  echo "New release failed local health check. Rolling back." >&2
  if [ -n "$PREVIOUS_RELEASE" ] && [ -d "$PREVIOUS_RELEASE" ]; then
    ln -sfn "$PREVIOUS_RELEASE" "$CURRENT_DIR"
    start_app "$PREVIOUS_RELEASE"
    pm2 save
  fi
  exit 1
fi

pm2 save
pm2 describe lasotinhhoa
pm2 describe lasotinhhoa | grep -F "$RELEASE_DIR" >/dev/null
echo "DEPLOYED_RELEASE=$RELEASE_DIR"
deploy_succeeded="1"
cleanup_old_releases
cleanup_npm_cache
'@

Write-Host ""
Write-Host "==> Deploy VPS release $releaseName" -ForegroundColor Cyan
$remoteScriptForBash = $remoteScript.Replace("`r", "")
$remoteScriptBase64 = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($remoteScriptForBash))
& $ssh tuvi-vps "printf '%s' '$remoteScriptBase64' | base64 -d | bash -s -- '$commitSha' '$releaseName' '$migrateFlag'"
if ($LASTEXITCODE -ne 0) {
  throw "VPS deployment failed with exit code $LASTEXITCODE."
}

Write-Host ""
Write-Host "==> Production smoke" -ForegroundColor Cyan
Assert-Http200 -Url "https://lasotinhhoa.vn"
Assert-Http200 -Url "https://lasotinhhoa.vn/kien-thuc-tu-vi"
Assert-Http200 -Url "https://lasotinhhoa.vn/api/knowledge-articles?page=1&pageSize=6"
Assert-Http200 -Url "https://lasotinhhoa.vn/sitemap.xml"

Write-Host ""
Write-Host "Release completed: $commitSha" -ForegroundColor Green
Write-Host "Production: https://lasotinhhoa.vn/kien-thuc-tu-vi" -ForegroundColor Green
