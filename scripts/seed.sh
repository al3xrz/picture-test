#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "[seed] Running seed inside backend container..."
docker compose exec backend python seed.py "$@"
