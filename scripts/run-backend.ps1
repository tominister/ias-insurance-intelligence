# Run FastAPI from repo root (Python package: apps/backend/app).
$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $PSScriptRoot
$BackendDir = Join-Path $RepoRoot "apps\backend"
$VenvPython = Join-Path $BackendDir ".venv\Scripts\python.exe"
$Python = if (Test-Path $VenvPython) { $VenvPython } else { "python" }

$Port = if ($env:IAS_BACKEND_PORT) { $env:IAS_BACKEND_PORT } else { "8000" }

# Ensure auth deps (PyJWT) are installed in the project venv.
& $Python -c "import jwt" 2>$null
if ($LASTEXITCODE -ne 0) {
  Write-Host "Installing apps/backend/requirements.txt ..."
  & $Python -m pip install -r (Join-Path $BackendDir "requirements.txt")
}

Set-Location $BackendDir

& $Python -m uvicorn app.main:app `
  --reload `
  --reload-dir $BackendDir `
  --host 127.0.0.1 `
  --port $Port
