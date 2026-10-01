#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  cp .env.example .env
  echo "[deploy] .env created from .env.example. Review ADMIN_USER/ADMIN_PASSWORD!"
fi

echo "[deploy] Building and starting containers..."
docker compose up -d --build

echo "[deploy] Status:"
docker compose ps

PORT="$(grep -E '^WEB_PORT=' .env | cut -d= -f2 || true)"
echo
echo "[deploy] Web UI: http://localhost:${PORT:-8080}"
echo "[deploy] Admin:  http://localhost:${PORT:-8080}/admin"
echo "[deploy] Seed demo data: make seed"
