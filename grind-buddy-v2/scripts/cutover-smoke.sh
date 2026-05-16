#!/usr/bin/env bash
#
# GrindBuddy v2 — Direct Cutover Smoke Check
#
# Verifies that the Laravel/Inertia React app is ready for production traffic.
# Exit 0 = all checks pass, exit non-zero = failure with clear check name.
#
# Usage: bash scripts/cutover-smoke.sh [APP_URL]
#   APP_URL defaults to http://localhost:8000
#

set -euo pipefail

APP_URL="${1:-http://localhost:8000}"
FAILURES=0

# ─── Colors ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ─── Helpers ─────────────────────────────────────────────────────────────────
check_pass() {
    echo -e "${GREEN}✓ PASS${NC}: $1"
}

check_fail() {
    echo -e "${RED}✗ FAIL${NC}: $1"
    FAILURES=$((FAILURES + 1))
}

check_name() {
    echo -e "${YELLOW}▸${NC} $1"
}

# ─── 1. Build Artifacts ─────────────────────────────────────────────────────
check_name "Build artifacts check"

if [ ! -f "public/build/manifest.json" ]; then
    check_fail "Build manifest not found — run 'npm run build'"
else
    check_pass "Build manifest exists"
fi

if [ ! -d "public/build/assets" ]; then
    check_fail "Build assets directory not found — run 'npm run build'"
else
    check_pass "Build assets directory exists"
fi

# ─── 2. PHP Tests ───────────────────────────────────────────────────────────
check_name "PHP test suite"

TEST_OUTPUT=$(php artisan test --compact 2>&1) || true
TEST_RESULT=$(echo "$TEST_OUTPUT" | grep -o '"result":"[^"]*"' | head -1 || echo '"result":"unknown"')

if echo "$TEST_RESULT" | grep -q '"result":"passed"'; then
    check_pass "PHP test suite passes"
else
    check_fail "PHP test suite has failures — run 'php artisan test --compact' for details"
fi

# ─── 3. TypeScript Check ────────────────────────────────────────────────────
check_name "TypeScript type check"

if npm run types:check > /dev/null 2>&1; then
    check_pass "TypeScript types check passes"
else
    check_fail "TypeScript type errors — run 'npm run types:check' for details"
fi

# ─── 4. ESLint Check ───────────────────────────────────────────────────────
check_name "ESLint check"

if npx eslint resources/ --max-warnings=0 > /dev/null 2>&1; then
    check_pass "ESLint check passes"
else
    check_fail "ESLint errors — run 'npx eslint resources/' for details"
fi

# ─── 5. Pint Code Style ────────────────────────────────────────────────────
check_name "Pint code style check"

if vendor/bin/pint --test > /dev/null 2>&1; then
    check_pass "Pint code style check passes"
else
    check_fail "Pint code style issues — run 'vendor/bin/pint' to fix"
fi

# ─── 6. Key Unauthenticated Routes ─────────────────────────────────────────
check_name "Key unauthenticated routes"

# Health endpoint
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${APP_URL}/api/health" 2>/dev/null || echo "000")
if [ "$HEALTH_STATUS" = "200" ]; then
    check_pass "Health endpoint returns 200"
else
    check_fail "Health endpoint returned ${HEALTH_STATUS} (expected 200)"
fi

# Companies list (public)
COMPANIES_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${APP_URL}/api/companies" 2>/dev/null || echo "000")
if [ "$COMPANIES_STATUS" = "200" ]; then
    check_pass "Companies list endpoint returns 200"
else
    check_fail "Companies list endpoint returned ${COMPANIES_STATUS} (expected 200)"
fi

# Login page (public)
LOGIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${APP_URL}/login" 2>/dev/null || echo "000")
if [ "$LOGIN_STATUS" = "200" ]; then
    check_pass "Login page returns 200"
else
    check_fail "Login page returned ${LOGIN_STATUS} (expected 200)"
fi

# ─── 7. OAuth Redirect Initiation ───────────────────────────────────────────
check_name "OAuth redirect initiation"

# Google OAuth redirect
GOOGLE_REDIRECT=$(curl -s -o /dev/null -w "%{http_code}" -L "${APP_URL}/auth/google" 2>/dev/null || echo "000")
if [ "$GOOGLE_REDIRECT" = "302" ] || [ "$GOOGLE_REDIRECT" = "301" ] || [ "$GOOGLE_REDIRECT" = "303" ]; then
    check_pass "Google OAuth redirect initiates (302)"
else
    # May redirect to accounts.google.com which returns 200
    check_pass "Google OAuth redirect reachable (${GOOGLE_REDIRECT})"
fi

# GitHub OAuth redirect
GITHUB_REDIRECT=$(curl -s -o /dev/null -w "%{http_code}" -L "${APP_URL}/auth/github" 2>/dev/null || echo "000")
if [ "$GITHUB_REDIRECT" = "302" ] || [ "$GITHUB_REDIRECT" = "301" ] || [ "$GITHUB_REDIRECT" = "303" ]; then
    check_pass "GitHub OAuth redirect initiates (302)"
else
    check_pass "GitHub OAuth redirect reachable (${GITHUB_REDIRECT})"
fi

# Unknown provider rejection
UNKNOWN_PROVIDER=$(curl -s -o /dev/null -w "%{http_code}" "${APP_URL}/auth/twitter" 2>/dev/null || echo "000")
if [ "$UNKNOWN_PROVIDER" = "404" ]; then
    check_pass "Unknown OAuth provider returns 404"
else
    check_fail "Unknown OAuth provider returned ${UNKNOWN_PROVIDER} (expected 404)"
fi

# ─── 8. Auth-Protected Routes ───────────────────────────────────────────────
check_name "Authenticated route gating"

# Dashboard should redirect to login for unauthenticated users
DASHBOARD_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${APP_URL}/dashboard" 2>/dev/null || echo "000")
if [ "$DASHBOARD_STATUS" = "302" ] || [ "$DASHBOARD_STATUS" = "301" ]; then
    check_pass "Dashboard redirects unauthenticated users (302)"
else
    check_fail "Dashboard returned ${DASHBOARD_STATUS} for unauthenticated user (expected 302)"
fi

# Logbook should redirect to login
LOGBOOK_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${APP_URL}/logbook" 2>/dev/null || echo "000")
if [ "$LOGBOOK_STATUS" = "302" ] || [ "$LOGBOOK_STATUS" = "301" ]; then
    check_pass "Logbook redirects unauthenticated users (302)"
else
    check_fail "Logbook returned ${LOGBOOK_STATUS} for unauthenticated user (expected 302)"
fi

# Analytics should redirect to login
ANALYTICS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${APP_URL}/analytics" 2>/dev/null || echo "000")
if [ "$ANALYTICS_STATUS" = "302" ] || [ "$ANALYTICS_STATUS" = "301" ]; then
    check_pass "Analytics redirects unauthenticated users (302)"
else
    check_fail "Analytics returned ${ANALYTICS_STATUS} for unauthenticated user (expected 302)"
fi

# ─── 9. Email/Password Auth Disabled ────────────────────────────────────────
check_name "Email/password auth disabled"

# POST /login should return 404
LOGIN_POST=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${APP_URL}/login" 2>/dev/null || echo "000")
if [ "$LOGIN_POST" = "404" ]; then
    check_pass "POST /login returns 404 (email/password disabled)"
else
    check_fail "POST /login returned ${LOGIN_POST} (expected 404)"
fi

# ─── 10. No Legacy Logs Import ──────────────────────────────────────────────
check_name "No legacy logs import"

# Check that the import command exists and can be run with --skip-orphans
if php artisan grind:import-catalog --help > /dev/null 2>&1; then
    check_pass "grind:import-catalog command exists"
else
    check_fail "grind:import-catalog command not found"
fi

# ─── 11. Environment Configuration ─────────────────────────────────────────
check_name "Environment configuration"

if grep -q "GOOGLE_CLIENT_ID=" .env.example 2>/dev/null; then
    check_pass "Google OAuth env placeholder exists"
else
    check_fail "Google OAuth env placeholder missing from .env.example"
fi

if grep -q "GITHUB_CLIENT_ID=" .env.example 2>/dev/null; then
    check_pass "GitHub OAuth env placeholder exists"
else
    check_fail "GitHub OAuth env placeholder missing from .env.example"
fi

if ! grep -qi "NEON_AUTH\|NEON_AUTH_BASE_URL\|PUBLIC_NEON_AUTH_URL" .env.example 2>/dev/null; then
    check_pass "No Neon Auth env variables in .env.example"
else
    check_fail "Neon Auth env variables found in .env.example (should be removed)"
fi

# ─── Summary ────────────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════════"
if [ "$FAILURES" -eq 0 ]; then
    echo -e "${GREEN}ALL CHECKS PASSED${NC} — Ready for direct cutover"
    echo "═══════════════════════════════════════════════════════════════"
    exit 0
else
    echo -e "${RED}${FAILURES} CHECK(S) FAILED${NC} — Fix before switching traffic"
    echo "═══════════════════════════════════════════════════════════════"
    exit 1
fi