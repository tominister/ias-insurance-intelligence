#!/usr/bin/env bash
# Azure App Service Linux startup — install deps then run FastAPI (Origami chatbot layout).
set -euo pipefail
cd /home/site/wwwroot
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
PORT="${WEBSITES_PORT:-8000}"
exec python -m uvicorn app.main:app --host 0.0.0.0 --port "${PORT}"
