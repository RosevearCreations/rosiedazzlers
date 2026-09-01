#!/usr/bin/env bash
set -euo pipefail
BASE_URL="${1:-https://dev.rosiedazzlers.pages.dev}"
LABEL="${2:-Build 290 runtime}"
tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT

assert_no_disclosure(){
  local file="$1"
  for token in 'SUPABASE_' 'service role' 'STAFF_SESSION_SECRET' 'ADMIN_PASSWORD' 'stack' 'required_action'; do
    if grep -Fiq "$token" "$file"; then
      echo "$LABEL: denial response disclosed $token"; cat "$file"; exit 41
    fi
  done
}

status=$(curl -sS -o "$tmp/admin-customers.html" -w '%{http_code}' "$BASE_URL/admin-customers.html")
[[ "$status" == "200" ]] || { echo "$LABEL: protected shell expected static 200, got $status"; exit 42; }
grep -Fq 'noindex,nofollow,noarchive' "$tmp/admin-customers.html"
grep -Fq '/assets/admin-auth.js' "$tmp/admin-customers.html"
grep -Fq '/assets/admin-shell.js' "$tmp/admin-customers.html"

status=$(curl -sS -o "$tmp/staff-me.json" -w '%{http_code}' "$BASE_URL/api/admin/auth_me")
[[ "$status" == "200" ]] || { echo "$LABEL: signed-out staff auth_me expected 200, got $status"; exit 43; }
grep -Fq '"authenticated":false' "$tmp/staff-me.json"
assert_no_disclosure "$tmp/staff-me.json"

for route in customer_profiles_save quote_pipeline_save quote_deposit_refund_save; do
  status=$(curl -sS -o "$tmp/${route}.json" -w '%{http_code}' -X POST -H 'Content-Type: application/json' --data '{}' "$BASE_URL/api/admin/$route")
  [[ "$status" == "401" ]] || { echo "$LABEL: anonymous $route expected 401, got $status"; cat "$tmp/${route}.json"; exit 44; }
  grep -Fq '"error":"Unauthorized."' "$tmp/${route}.json"
  assert_no_disclosure "$tmp/${route}.json"
done

status=$(curl -sS -o "$tmp/t2125.json" -w '%{http_code}' "$BASE_URL/api/admin/accounting_t2125_workpaper?year=2026")
[[ "$status" == "401" ]] || { echo "$LABEL: anonymous Finance read expected 401, got $status"; cat "$tmp/t2125.json"; exit 45; }
assert_no_disclosure "$tmp/t2125.json"

echo "$LABEL: PASS"
echo "- protected admin direct URL exposes a static noindex shell only; data remains behind authenticated APIs"
echo "- anonymous Operations/quote/Finance routes fail closed"
echo "- anonymous mutation denial happens before action disclosure"
echo "- denial bodies do not expose configuration/secret identifiers"
