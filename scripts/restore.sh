#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

ARCHIVE="${1:-}"
if [ -z "${ARCHIVE}" ] || [ ! -f "${ARCHIVE}" ]; then
  echo "Usage: $0 backups/picture-test-YYYYmmdd-HHMMSS.tar.gz"
  exit 1
fi

read -r -p "[restore] This overwrites current database/uploads. Continue? [y/N] " ans
if [[ ! "${ans}" =~ ^[Yy]$ ]]; then
  echo "[restore] Aborted."
  exit 0
fi

echo "[restore] Stopping backend..."
docker compose stop backend

echo "[restore] Restoring from ${ARCHIVE}..."
docker compose run --rm -T --no-deps -v "$(pwd)/${ARCHIVE}":/restore.tar.gz:ro \
  backend sh -c "rm -rf /data/* && tar xzf /restore.tar.gz -C / && echo restored"

echo "[restore] Starting backend..."
docker compose start backend

echo "[restore] Done."
