#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

cleanup() {
  echo
  echo "[dev] Shutting down..."
  kill "${BACKEND_PID:-}" "${FRONTEND_PID:-}" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo "[dev] Starting backend (http://localhost:8000)..."
(
  cd backend
  uv sync
  uv run uvicorn app.main:app --reload --port 8000
) &
BACKEND_PID=$!

echo "[dev] Starting frontend (http://localhost:5173)..."
(
  cd frontend
  [ -d node_modules ] || npm install
  npm run dev
) &
FRONTEND_PID=$!

wait
