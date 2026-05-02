#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "[PLXYGROUND] Starting all services..."

# Backend
cd "$ROOT_DIR/backend"
if [ ! -d node_modules ]; then
  echo "[backend] Installing dependencies..."
  npm install
fi
npm run start > "$ROOT_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
echo "[backend] Started (PID $BACKEND_PID) → http://localhost:3011"

# Admin panel
cd "$ROOT_DIR/admin-panel"
if [ ! -d node_modules ]; then
  echo "[admin-panel] Installing dependencies..."
  npm install
fi
npm run start > "$ROOT_DIR/admin-panel.log" 2>&1 &
ADMIN_PID=$!
echo "[admin-panel] Started (PID $ADMIN_PID) → http://localhost:3012"

# Frontend
cd "$ROOT_DIR/frontend"
if [ ! -d node_modules ]; then
  echo "[frontend] Installing dependencies..."
  npm install
fi
npm run start > "$ROOT_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo "[frontend] Started (PID $FRONTEND_PID) → http://localhost:19006"

echo ""
echo "All services running. Logs: backend.log | admin-panel.log | frontend.log"
echo "Press Ctrl+C to stop all."

trap "kill $BACKEND_PID $ADMIN_PID $FRONTEND_PID 2>/dev/null; echo 'All services stopped.'" INT
wait
