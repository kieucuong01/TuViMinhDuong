$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location $repoRoot

$bundledNode = "C:\Users\ASUS\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin"
if (Test-Path $bundledNode) {
  $env:PATH = "$bundledNode;$env:PATH"
}

npm run seo:autopilot:execute
