#!/bin/bash
API="http://localhost:3011"
PASS=0
FAIL=0

check() {
  local label=$1
  local condition=$2
  if eval "$condition"; then
    echo "  ✅ PASS: $label"
    ((PASS++))
  else
    echo "  ❌ FAIL: $label"
    ((FAIL++))
  fi
}

echo ""
echo "=============================="
echo "  PLXYGROUND SMOKE TESTS"
echo "=============================="

# --- 1. HEALTH ---
echo ""
echo "[ Health ]"
HEALTH=$(curl -sf "$API/healthz")
check "Health endpoint returns 200" '[ -n "$HEALTH" ]'

# --- 2. ADMIN LOGIN ---
echo ""
echo "[ Admin Auth ]"
ADMIN_RES=$(curl -sf -X POST "$API/api/admin/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@plxyground.local","password":"Internet2026@"}')
ADMIN_TOKEN=$(echo $ADMIN_RES | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
check "Admin login returns token" '[ -n "$ADMIN_TOKEN" ]'

# --- 3. CREATOR LOGIN ---
echo ""
echo "[ Creator Auth ]"
CREATOR_RES=$(curl -sf -X POST "$API/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"sarahjohnson@plxyground.local","password":"Password1!"}')
CREATOR_TOKEN=$(echo $CREATOR_RES | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
check "Creator login returns token" '[ -n "$CREATOR_TOKEN" ]'

# --- 4. CREATOR SIGNUP ---
echo ""
echo "[ Creator Signup ]"
SIGNUP_RES=$(curl -sf -X POST "$API/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"smoketest_'$(date +%s)'@test.com","password":"TestPass1!","profile_slug":"smoketest-'$(date +%s)'"}')
check "Creator signup succeeds" '[ -n "$SIGNUP_RES" ]'

# --- 5. BUSINESS LOGIN ---
echo ""
echo "[ Business Auth ]"
BIZ_RES=$(curl -sf -X POST "$API/api/business/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"nike@plxyground.local","password":"Password1!"}')
BIZ_TOKEN=$(echo $BIZ_RES | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
check "Business login returns token" '[ -n "$BIZ_TOKEN" ]'

# --- 6. CONTENT WITHOUT MEDIA BLOCKED ---
echo ""
echo "[ Content Validation ]"
NO_MEDIA_RES=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/api/content" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CREATOR_TOKEN" \
  -d '{"title":"Test","body":"Test body","content_type":"article"}')
check "Create content without media_url returns 400" '[ "$NO_MEDIA_RES" = "400" ]'

# --- 7. CREATE CONTENT WITH MEDIA ---
echo ""
echo "[ Content Create ]"
CREATE_RES=$(curl -sf -X POST "$API/api/content" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CREATOR_TOKEN" \
  -d '{"title":"Smoke Test Post","body":"Full body content here for smoke test.","content_type":"article","media_url":"https://images.unsplash.com/photo-1546519638405-a9f5a95a5b64?w=800"}')
POST_ID=$(echo $CREATE_RES | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
check "Create content with media_url returns created post" '[ -n "$POST_ID" ]'

# --- 8. ADMIN APPROVE CONTENT ---
echo ""
echo "[ Admin Approve ]"
if [ -n "$POST_ID" ] && [ -n "$ADMIN_TOKEN" ]; then
  APPROVE_RES=$(curl -sf -X PUT "$API/api/admin/content/$POST_ID" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d '{"is_published":true}')
  check "Admin can approve content" '[ -n "$APPROVE_RES" ]'
fi

# --- 9. FEED SHOWS APPROVED CONTENT ---
echo ""
echo "[ Feed ]"
FEED_RES=$(curl -sf "$API/api/content")
check "Feed returns content list" '[ -n "$FEED_RES" ]'
check "Feed includes content" 'echo "$FEED_RES" | grep -q "title"'

# --- 10. SUSPEND USER ---
echo ""
echo "[ User Suspension ]"
CREATOR_ID=$(echo $CREATOR_RES | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
SUSPEND_USER_RES=$(curl -sf -X POST "$API/api/admin/users/3/suspend" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"reason":"Smoke test suspension"}')
SUSPENDED_LOGIN=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"alexrivera@plxyground.local","password":"Password1!"}')
check "Suspended user login returns 403" '[ "$SUSPENDED_LOGIN" = "403" ]'

# --- 11. ADMIN QUEUE ---
echo ""
echo "[ Admin Queue ]"
QUEUE_RES=$(curl -sf -H "Authorization: Bearer $ADMIN_TOKEN" "$API/api/admin/queue")
check "Admin can access moderation queue" '[ -n "$QUEUE_RES" ]'

# --- 12. ADMIN USERS ---
echo ""
echo "[ Admin Users ]"
USERS_RES=$(curl -sf -H "Authorization: Bearer $ADMIN_TOKEN" "$API/api/admin/users")
check "Admin can list users" '[ -n "$USERS_RES" ]'

# --- 13. ADMIN ANALYTICS ---
echo ""
echo "[ Admin Analytics ]"
ANALYTICS_RES=$(curl -sf -H "Authorization: Bearer $ADMIN_TOKEN" "$API/api/admin/analytics")
check "Admin analytics returns data" '[ -n "$ANALYTICS_RES" ]'

# --- 14. AUDIT LOG ---
echo ""
echo "[ Audit Log ]"
AUDIT_RES=$(curl -sf -H "Authorization: Bearer $ADMIN_TOKEN" "$API/api/admin/audit")
check "Admin audit log returns data" '[ -n "$AUDIT_RES" ]'

# --- 15. LIVE ALERTS ---
echo ""
echo "[ Live Alerts ]"
ALERTS_RES=$(curl -sf -H "Authorization: Bearer $ADMIN_TOKEN" "$API/api/admin/alerts")
check "Admin alerts returns data" '[ -n "$ALERTS_RES" ]'

# --- 16. TERMS AND PRIVACY ---
echo ""
echo "[ Legal Pages ]"
TERMS_RES=$(curl -s -o /dev/null -w "%{http_code}" "$API/terms")
PRIVACY_RES=$(curl -s -o /dev/null -w "%{http_code}" "$API/privacy")
check "Terms page returns 200" '[ "$TERMS_RES" = "200" ]'
check "Privacy page returns 200" '[ "$PRIVACY_RES" = "200" ]'

# --- 17. FRONTEND RUNNING ---
echo ""
echo "[ Frontend ]"
FRONTEND_RES=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:19006")
check "Frontend is accessible on port 19006" '[ "$FRONTEND_RES" = "200" ]'

# --- 18. ADMIN PANEL RUNNING ---
echo ""
echo "[ Admin Panel ]"
ADMIN_PANEL_RES=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3012")
check "Admin panel is accessible on port 3012" '[ "$ADMIN_PANEL_RES" = "200" ]'

# --- RESULTS ---
echo ""
echo "=============================="
echo "  RESULTS: $PASS passed, $FAIL failed"
echo "=============================="
if [ "$FAIL" -eq 0 ]; then
  echo "  🎉 ALL TESTS PASSED — PLXYGROUND IS HEALTHY"
else
  echo "  ⚠️  $FAIL test(s) failed — check BLOCKERS.md"
fi
 echo ""
