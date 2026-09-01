#!/usr/bin/env bash
set -euo pipefail
BASE_URL="${1:-https://dev.rosiedazzlers.pages.dev}"
LABEL="${2:-Build 288 runtime}"
tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT
fetch(){ local path="$1" out="$2"; curl -fsS --retry 2 --retry-delay 1 "$BASE_URL$path" -o "$out"; }
fetch "/assets/customer-privacy-v288.js" "$tmp/privacy.js"
grep -Fq "build288CustomerPrivacy" "$tmp/privacy.js"
fetch "/my-account/" "$tmp/account.html"
grep -Fq 'name="viewport"' "$tmp/account.html"
grep -Fq '/assets/client-auth.js' "$tmp/account.html"

status=$(curl -sS -o "$tmp/vehicles.json" -w '%{http_code}' "$BASE_URL/api/client/vehicles_list")
[[ "$status" == "401" ]] || { echo "$LABEL: vehicles_list expected 401, got $status"; exit 21; }
status=$(curl -sS -o "$tmp/reviews.json" -w '%{http_code}' "$BASE_URL/api/client/reviews_save")
[[ "$status" == "401" ]] || { echo "$LABEL: reviews_save expected 401, got $status"; exit 22; }
status=$(curl -sS -o "$tmp/profile.json" -w '%{http_code}' -X POST -H 'Content-Type: application/json' --data '{"admin_private_notes":"should-not-write"}' "$BASE_URL/api/client/profile_update")
[[ "$status" == "401" ]] || { echo "$LABEL: profile_update expected 401, got $status"; exit 23; }
status=$(curl -sS -o "$tmp/dashboard.json" -w '%{http_code}' "$BASE_URL/api/client/dashboard")
[[ "$status" == "200" ]] || { echo "$LABEL: dashboard expected signed-out 200, got $status"; exit 24; }
grep -Fq '"authenticated":false' "$tmp/dashboard.json"
if grep -Fq 'admin_private_notes' "$tmp/dashboard.json"; then echo "$LABEL: dashboard exposed staff-private field"; exit 25; fi
echo "$LABEL: PASS"
