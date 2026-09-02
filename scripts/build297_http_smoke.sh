#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-https://dev.rosiedazzlers.pages.dev}"
LABEL="${2:-Build 297 runtime}"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

page="$tmp/admin-customers.html"
route="$tmp/admin-customers-route.html"
asset="$tmp/admin-customers-v297.js"

status=$(curl -sSL -o "$page" -w '%{http_code}' "$BASE_URL/admin-customers.html")
[[ "$status" == "200" ]] || { echo "$LABEL: /admin-customers.html returned $status"; exit 1; }
status=$(curl -sSL -o "$route" -w '%{http_code}' "$BASE_URL/admin-customers")
[[ "$status" == "200" ]] || { echo "$LABEL: /admin-customers returned $status"; exit 1; }
cmp -s "$page" "$route" || { echo "$LABEL: Operations customer route copies differ at runtime"; exit 1; }

grep -Fq '<script src="/assets/admin-customers-v297.js"></script>' "$page" || { echo "$LABEL: versioned Operations customer asset tag missing"; exit 1; }
if grep -Fq 'AdminShell.boot({pageKey:' "$page"; then
  echo "$LABEL: mature customer runtime is still inline in HTML"
  exit 1
fi

grep -Fq 'noindex,nofollow,noarchive' "$page"
grep -Fq '/assets/admin-auth.js' "$page"
grep -Fq '/assets/admin-shell.js' "$page"
grep -Fq 'id="customerForm"' "$page"
grep -Fq 'id="helpQueue"' "$page"
for token in \
  'data-access-action="send_account_setup"' \
  'data-access-action="send_password_reset"' \
  'data-access-action="resend_verification"' \
  'data-access-action="revoke_sessions"'; do
  grep -Fq "$token" "$page" || { echo "$LABEL: customer HTML missing retained access action $token"; exit 1; }
done

status=$(curl -sSL -o "$asset" -w '%{http_code}' "$BASE_URL/assets/admin-customers-v297.js")
[[ "$status" == "200" ]] || { echo "$LABEL: /assets/admin-customers-v297.js returned $status"; exit 1; }
for token in \
  '/api/admin/customer_admin_list' \
  '/api/admin/customer_admin_detail' \
  '/api/admin/customer_admin_save' \
  '/api/admin/customer_admin_access_action' \
  '/api/admin/customer_account_help_list' \
  '/api/admin/customer_account_help_action' \
  'revoke_sessions' \
  'ARCHIVE CLIENT' \
  "AdminShell.boot({pageKey:'admin-customers'"; do
  grep -Fq "$token" "$asset" || { echo "$LABEL: extracted customer runtime missing $token"; exit 1; }
done

node --check "$asset" >/dev/null

echo "$LABEL: PASS"
echo "- Operations customer HTML loads the versioned Build 297 runtime asset"
echo "- root and folder routes are exact at runtime"
echo "- retained customer/admin authority markers are present"
echo "- smoke is read-only; no admin mutation API is invoked"
