# Run Vite dev server from repo root (app: apps/frontend).
$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $PSScriptRoot
$FrontendDir = Join-Path $RepoRoot "apps\frontend"
Set-Location $FrontendDir

if (-not (Test-Path "node_modules")) {
  Write-Host "node_modules missing — run: npm install"
  npm install
}

npm run dev
