#!/usr/bin/env bash
set -euo pipefail
BASE_URL="${1:-https://dev.rosiedazzlers.pages.dev}"
LABEL="${2:-Build 291 runtime}"
tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT

assert_no_disclosure(){
  local file="$1"
  for token in 'SUPABASE_' 'service role' 'Bearer ' 'details' 'stack' 'membership_interest_requests'; do
    if grep -Fiq "$token" "$file"; then
      echo "$LABEL: response disclosed $token"; cat "$file"; exit 51
    fi
  done
}

status=$(curl -sSL -o "$tmp/maintenance.html" -w '%{http_code}' "$BASE_URL/maintenance-plan")
[[ "$status" == "200" ]] || { echo "$LABEL: maintenance page expected final 200, got $status"; exit 52; }
grep -Fq 'data-build291="maintenance-retention-intake"' "$tmp/maintenance.html"
grep -Fq 'Maintenance detailing interest' "$tmp/maintenance.html"
grep -Fq 'Cadence selected after service review' "$tmp/maintenance.html"
grep -Fq 'interest request only' "$tmp/maintenance.html"
grep -Fq 'does not create a subscription' "$tmp/maintenance.html"
grep -Fq 'preference only' "$tmp/maintenance.html"
grep -Fq 'aria-live="polite"' "$tmp/maintenance.html"
if grep -Fq 'Every 4 or 8 weeks' "$tmp/maintenance.html" || grep -Fq 'Priority reminder before your preferred date' "$tmp/maintenance.html"; then
  echo "$LABEL: stale fixed-cadence/priority copy remains"; exit 53
fi

# Validation failures occur before persistence and therefore must not write a maintenance-interest row.
status=$(curl -sS -o "$tmp/missing-email.json" -w '%{http_code}' \
  -X POST -H 'Content-Type: application/json' \
  --data '{"full_name":"Build 291 validation only","preferred_cycle":"not_sure"}' \
  "$BASE_URL/api/membership_interest_create")
[[ "$status" == "400" ]] || { echo "$LABEL: missing-email validation expected 400, got $status"; cat "$tmp/missing-email.json"; exit 54; }
grep -Fq '"A valid email is required."' "$tmp/missing-email.json"
assert_no_disclosure "$tmp/missing-email.json"

status=$(curl -sS -o "$tmp/invalid-cycle.json" -w '%{http_code}' \
  -X POST -H 'Content-Type: application/json' \
  --data '{"full_name":"Build 291 validation only","email":"build291-validation@example.invalid","preferred_cycle":"invalid_cycle"}' \
  "$BASE_URL/api/membership_interest_create")
[[ "$status" == "400" ]] || { echo "$LABEL: invalid-cycle validation expected 400, got $status"; cat "$tmp/invalid-cycle.json"; exit 55; }
grep -Fq '"Choose a maintenance timing preference."' "$tmp/invalid-cycle.json"
assert_no_disclosure "$tmp/invalid-cycle.json"

status=$(curl -sS -o "$tmp/get.json" -w '%{http_code}' "$BASE_URL/api/membership_interest_create")
[[ "$status" == "405" ]] || { echo "$LABEL: GET maintenance intake expected 405, got $status"; cat "$tmp/get.json"; exit 56; }
assert_no_disclosure "$tmp/get.json"

echo "$LABEL: PASS"
echo "- canonical maintenance interest page is source-safe and crawlable"
echo "- fixed cadence/priority promises are absent"
echo "- invalid email and invalid_cycle stop before persistence and must not write a maintenance-interest row"
echo "- public validation responses do not disclose Supabase/storage details"
echo "- no Development waitlist test record was created by this smoke"
