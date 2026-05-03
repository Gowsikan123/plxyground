#!/usr/bin/env bash
set -e

BASE="http://localhost:3011"
PASS=0
FAIL=0

check() {
  local label="$1"
  local expected="$2"
  local actual="$3"
  if echo "$actual" | grep -q "$expected"; then
    echo "  ✓ $label"
    PASS=$((PASS+1))
  else
    echo "  ✗ $label (expected '$expected' in response)"
    echo "    Got: $actual"
    FAIL=$((FAIL+1))
  fi
}

echo ""
echo "=== PLXYGROUND SMOKE TESTS ==="
echo ""

echo "[1] Health check"
RES=$(curl -sf "$BASE/healthz" || echo 'ERROR')
check "GET /healthz → success:true" '"success":true' "$RES"

echo ""
echo "[2] Root endpoint"
RES=$(curl -sf "$BASE/" || echo 'ERROR')
check "GET / → PLXYGROUND API" 'PLXYGROUND' "$RES"

echo ""
echo "[3] Creator login"
RES=$(curl -sf -X POST "$BASE/api/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"jayden@example.com","password":"Password1!"}' || echo 'ERROR')
check "POST /api/auth/login → token" '"token"' "$RES"
CREATOR_TOKEN=$(echo "$RES" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

echo ""
echo "[4] Creator /me"
RES=$(curl -sf "$BASE/api/auth/me" \
  -H "Authorization: Bearer $CREATOR_TOKEN" || echo 'ERROR')
check "GET /api/auth/me → username" '"username"' "$RES"

echo ""
echo "[5] Public feed"
RES=$(curl -sf "$BASE/api/content" || echo 'ERROR')
check "GET /api/content → posts array" '"posts"' "$RES"

echo ""
echo "[6] Creators list"
RES=$(curl -sf "$BASE/api/creators" || echo 'ERROR')
check "GET /api/creators → data array" '"data"' "$RES"

echo ""
echo "[7] Opportunities list"
RES=$(curl -sf "$BASE/api/opportunities" || echo 'ERROR')
check "GET /api/opportunities → data array" '"data"' "$RES"

echo ""
echo "[8] Admin login"
RES=$(curl -sf -X POST "$BASE/api/admin/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@plxyground.local","password":"Internet2026@"}' || echo 'ERROR')
check "POST /api/admin/auth/login → token" '"token"' "$RES"
ADMIN_TOKEN=$(echo "$RES" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

echo ""
echo "[9] Admin analytics"
RES=$(curl -sf "$BASE/api/admin/analytics" \
  -H "Authorization: Bearer $ADMIN_TOKEN" || echo 'ERROR')
check "GET /api/admin/analytics → total_creators" '"total_creators"' "$RES"

echo ""
echo "[10] Admin queue"
RES=$(curl -sf "$BASE/api/admin/queue" \
  -H "Authorization: Bearer $ADMIN_TOKEN" || echo 'ERROR')
check "GET /api/admin/queue → data array" '"data"' "$RES"

echo ""
echo "==========================="
echo "  PASSED: $PASS"
echo "  FAILED: $FAIL"
echo "==========================="
echo ""

if [ $FAIL -gt 0 ]; then
  exit 1
fi
