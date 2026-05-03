#!/usr/bin/env bash
set -e

echo ""
echo "=== PLXYGROUND — Starting all services ==="
echo ""

# Backend
if [ ! -f backend/.env ]; then
  cp backend/.env.example backend/.env
  echo "  Created backend/.env from example"
fi

# Frontend
if [ ! -f frontend/.env ]; then
  cp frontend/.env.example frontend/.env
  echo "  Created frontend/.env from example"
fi

echo "  Installing backend deps..."
(cd backend && npm install --silent)

echo "  Installing frontend deps..."
(cd frontend && npm install --silent)

echo "  Installing admin-panel deps..."
(cd admin-panel && npm install --silent)

echo ""
echo "  Starting backend on port 3011..."
(cd backend && npm run dev) &
BACKEND_PID=$!

echo "  Starting admin-panel on port 3012..."
(cd admin-panel && node server.js) &
ADMIN_PID=$!

echo "  Starting frontend (Expo)..."
(cd frontend && npx expo start) &
FRONTEND_PID=$!

echo ""
echo "  Backend:      http://localhost:3011"
echo "  Admin Panel:  http://localhost:3012"
echo "  Frontend:     http://localhost:19006 (Expo)"
echo ""
echo "  Press Ctrl+C to stop all services"
echo ""

trap "kill $BACKEND_PID $ADMIN_PID $FRONTEND_PID 2>/dev/null; echo 'All services stopped.'; exit 0" INT TERM
wait
