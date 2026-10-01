#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

mkdir -p backups
STAMP="$(date +%Y%m%d-%H%M%S)"
ARCHIVE="backups/picture-test-${STAMP}.tar.gz"

echo "[backup] Archiving database and uploads to ${ARCHIVE}..."
docker compose exec -T backend tar czf - -C / data > "${ARCHIVE}"

echo "[backup] Done: ${ARCHIVE} ($(du -h "${ARCHIVE}" | cut -f1))"
