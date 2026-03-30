#!/bin/bash
echo "🚀 Starting PLXYGROUND..."

# Kill any existing processes on our ports
lsof -ti:3011 | xargs kill -9 2>/dev/null || true
lsof -ti:3012 | xargs kill -9 2>/dev/null || true
lsof -ti:19006 | xargs kill -9 2>/dev/null || true

# Start backend
cd backend && npm install && node src/index.js &
BACKEND_PID=$!
echo "✅ Backend starting (PID $BACKEND_PID)"

# Start admin panel
cd ../admin-panel && npm install && node server.js &
ADMIN_PID=$!
echo "✅ Admin panel starting (PID $ADMIN_PID)"

# Start frontend
cd ../frontend && npm install && npx expo start --web --port 19006 &
FRONTEND_PID=$!
echo "✅ Frontend starting (PID $FRONTEND_PID)"

echo ""
echo "⏳ Waiting 10s for services to boot..."
sleep 10

echo ""
echo "🔍 Running health check..."
curl -sf http://localhost:3011/healthz && echo "✅ Backend healthy" || echo "❌ Backend not responding"

echo ""
echo "===================================="
echo "  PLXYGROUND RUNNING"
echo "===================================="
echo "  Backend:  http://localhost:3011"
echo "  Frontend: http://localhost:19006"
echo "  Admin:    http://localhost:3012"
echo "===================================="

wait
