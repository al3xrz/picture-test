#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if [ "${1:-}" = "--wipe" ]; then
  echo "[stop] Stopping and removing containers AND volumes (data loss)..."
  docker compose down -v
else
  echo "[stop] Stopping containers (data kept)..."
  docker compose down
fi
