#!/usr/bin/env bash
set -euo pipefail
BASE_URL="${1:-https://dev.rosiedazzlers.pages.dev}"
LABEL="${2:-Build 292 runtime}"
tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT

assert_no_disclosure(){
  local file="$1"
  for token in 'SUPABASE_' 'service role' 'Bearer ' 'public_inquiry_leads' 'details' 'stack'; do
    if grep -Fiq "$token" "$file"; then
      echo "$LABEL: response disclosed $token"; cat "$file"; exit 61
    fi
  done
}

status=$(curl -sSL -o "$tmp/fleet.html" -w '%{http_code}' "$BASE_URL/fleet")
[[ "$status" == "200" ]] || { echo "$LABEL: fleet page expected final 200, got $status"; exit 62; }
grep -Fq 'data-build292="fleet-workplace-acquisition-intake"' "$tmp/fleet.html"
grep -Fq 'Fleet and Workplace Vehicle Detailing' "$tmp/fleet.html"
grep -Fq 'fleet-assessment-form' "$tmp/fleet.html"
grep -Fq 'value="workplace_group"' "$tmp/fleet.html"
grep -Fq 'value="repeat_interest"' "$tmp/fleet.html"
grep -Fq 'does not create a quote, appointment or recurring commitment' "$tmp/fleet.html"
if grep -Fq '>Monthly<' "$tmp/fleet.html" || grep -Fq '6+ vehicles' "$tmp/fleet.html"; then
  echo "$LABEL: stale threshold/cadence copy remains on fleet page"; exit 63
fi

status=$(curl -sSL -o "$tmp/pricing.html" -w '%{http_code}' "$BASE_URL/fleet-pricing")
[[ "$status" == "200" ]] || { echo "$LABEL: fleet-pricing page expected final 200, got $status"; exit 64; }
grep -Fq 'Fleet and multi-vehicle quote planning' "$tmp/pricing.html"
grep -Fq 'No automatic fleet minimum or vehicle threshold' "$tmp/pricing.html"
grep -Fq 'No automatic volume discount or commercial rate' "$tmp/pricing.html"

# All POST probes below fail validation before persistence and therefore must not create a Development lead row.
status=$(curl -sS -o "$tmp/missing-contact.json" -w '%{http_code}' -X POST -H 'Content-Type: application/json' \
  --data '{"topic":"fleet","full_name":"Build 292 validation only","request_type":"small_business","preferred_cadence":"not_sure","message":"Validation-only fleet request details."}' \
  "$BASE_URL/api/public_lead_submit")
[[ "$status" == "400" ]] || { echo "$LABEL: missing-contact validation expected 400, got $status"; cat "$tmp/missing-contact.json"; exit 65; }
grep -Fq 'Email or phone is required.' "$tmp/missing-contact.json"
assert_no_disclosure "$tmp/missing-contact.json"

status=$(curl -sS -o "$tmp/invalid-type.json" -w '%{http_code}' -X POST -H 'Content-Type: application/json' \
  --data '{"topic":"fleet","full_name":"Build 292 validation only","email":"build292@example.invalid","request_type":"invalid_type","preferred_cadence":"not_sure","message":"Validation-only fleet request details."}' \
  "$BASE_URL/api/public_lead_submit")
[[ "$status" == "400" ]] || { echo "$LABEL: invalid request type expected 400, got $status"; cat "$tmp/invalid-type.json"; exit 66; }
grep -Fq 'Choose the type of fleet or workplace request.' "$tmp/invalid-type.json"
assert_no_disclosure "$tmp/invalid-type.json"

status=$(curl -sS -o "$tmp/invalid-timing.json" -w '%{http_code}' -X POST -H 'Content-Type: application/json' \
  --data '{"topic":"fleet","full_name":"Build 292 validation only","email":"build292@example.invalid","request_type":"small_business","preferred_cadence":"monthly_fixed","message":"Validation-only fleet request details."}' \
  "$BASE_URL/api/public_lead_submit")
[[ "$status" == "400" ]] || { echo "$LABEL: invalid timing expected 400, got $status"; cat "$tmp/invalid-timing.json"; exit 67; }
grep -Fq 'Choose a timing preference.' "$tmp/invalid-timing.json"
assert_no_disclosure "$tmp/invalid-timing.json"

status=$(curl -sS -o "$tmp/get.json" -w '%{http_code}' "$BASE_URL/api/public_lead_submit")
[[ "$status" == "405" ]] || { echo "$LABEL: GET public lead endpoint expected 405, got $status"; cat "$tmp/get.json"; exit 68; }
assert_no_disclosure "$tmp/get.json"

echo "$LABEL: PASS"
echo "- fleet/workplace and quote-planning pages are deployed with Build 292 authority"
echo "- stale threshold/monthly promise copy is absent"
echo "- missing contact, invalid request type and invalid timing all fail before persistence"
echo "- GET remains 405 and public responses do not disclose Supabase/storage details"
echo "- validation smoke must not create a Development lead row"
