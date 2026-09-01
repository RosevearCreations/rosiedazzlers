#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-}"
LABEL="${2:-Build 286 endpoint}"

fail() {
  echo "::error::${LABEL}: $1"
  exit "${2:-2}"
}

[[ -n "$BASE_URL" ]] || fail "smoke base URL is empty." 2
BASE_URL="${BASE_URL%/}"

curl_code() {
  local output="$1"
  local url="$2"
  curl --silent --show-error --location \
    --header 'Cache-Control: no-cache' \
    --header 'Pragma: no-cache' \
    --output "$output" \
    --write-out '%{http_code}' \
    "$url"
}

review_asset_code=$(curl_code /tmp/rosie-customer-review-v286.js "${BASE_URL}/assets/customer-review-v286.js")
[[ "$review_asset_code" == "200" ]] || fail "customer-review-v286.js returned HTTP ${review_asset_code}." 10
grep -q "Completed booking" /tmp/rosie-customer-review-v286.js || fail "customer review asset missing Completed booking marker." 11
grep -q "/api/client/reviews_save" /tmp/rosie-customer-review-v286.js || fail "customer review asset missing review API authority." 12
grep -q "customer_review_prompt_view" /tmp/rosie-customer-review-v286.js || fail "customer review asset missing prompt analytics marker." 13

client_auth_code=$(curl_code /tmp/rosie-client-auth-v286.js "${BASE_URL}/assets/client-auth.js")
[[ "$client_auth_code" == "200" ]] || fail "client-auth.js returned HTTP ${client_auth_code}." 14
grep -q "/assets/customer-review-v286.js" /tmp/rosie-client-auth-v286.js || fail "My Account does not bootstrap Build 286 customer-review authority." 15

review_api_code=$(curl_code /tmp/rosie-review-api-v286.json "${BASE_URL}/api/client/reviews_save")
if [[ "$review_api_code" == "404" || "$review_api_code" =~ ^5 ]]; then
  cat /tmp/rosie-review-api-v286.json || true
  fail "review eligibility API returned HTTP ${review_api_code}." 16
fi
if [[ "$review_api_code" == "401" ]]; then
  grep -qi "Unauthorized" /tmp/rosie-review-api-v286.json || fail "unauthenticated review API response did not preserve the Unauthorized boundary." 17
elif [[ "$review_api_code" != "200" ]]; then
  cat /tmp/rosie-review-api-v286.json || true
  fail "review eligibility API returned unexpected HTTP ${review_api_code}." 18
fi

echo "${LABEL}: Build 286 completed-job customer review HTTP smoke PASS at ${BASE_URL}"
