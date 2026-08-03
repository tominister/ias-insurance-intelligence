#!/usr/bin/env bash
# Run Vite dev server from repo root (app: apps/frontend).
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FRONTEND_DIR="$REPO_ROOT/apps/frontend"
cd "$FRONTEND_DIR"
if [[ ! -d node_modules ]]; then
  echo "node_modules missing — running npm install"
  npm install
fi
exec npm run dev
