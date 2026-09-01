#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-}"
LABEL="${2:-Build 285 endpoint}"

if [[ -z "$BASE_URL" ]]; then
  echo "::error::${LABEL}: smoke base URL is empty."
  exit 2
fi
BASE_URL="${BASE_URL%/}"

fetch_asset() {
  local output="$1"
  local path="$2"
  local code
  code=$(curl --silent --show-error --location \
    --header 'Cache-Control: no-cache' \
    --header 'Pragma: no-cache' \
    --output "$output" --write-out '%{http_code}' "${BASE_URL}${path}")
  [[ "$code" == "200" ]] || { echo "::error::${LABEL}: ${path} returned HTTP ${code}."; exit 3; }
}

fetch_asset /tmp/rosie-build285-rebook.js /assets/customer-rebook-v285.js
grep -q "Book this service again" /tmp/rosie-build285-rebook.js || { echo "::error::${LABEL}: Build 285 account CTA marker missing."; exit 4; }
grep -q "Using your previous booking as a starting point" /tmp/rosie-build285-rebook.js || { echo "::error::${LABEL}: Build 285 booking context marker missing."; exit 5; }
grep -q 'rebook_package' /tmp/rosie-build285-rebook.js || { echo "::error::${LABEL}: Build 285 package handoff marker missing."; exit 6; }
grep -q 'rebook_date' /tmp/rosie-build285-rebook.js || { echo "::error::${LABEL}: Build 285 history-date verification marker missing."; exit 7; }
grep -q '/api/client/dashboard' /tmp/rosie-build285-rebook.js || { echo "::error::${LABEL}: Build 285 authenticated dashboard authority missing."; exit 8; }
grep -q "no longer available to repeat" /tmp/rosie-build285-rebook.js || { echo "::error::${LABEL}: Build 285 retired-service fail-closed marker missing."; exit 9; }

fetch_asset /tmp/rosie-build285-client-auth.js /assets/client-auth.js
grep -q '/assets/customer-rebook-v285.js' /tmp/rosie-build285-client-auth.js || { echo "::error::${LABEL}: customer account does not bootstrap Build 285."; exit 10; }

fetch_asset /tmp/rosie-build285-pricing-client.js /assets/pricing-catalog-client.js
grep -q './booking-retention-v275.js' /tmp/rosie-build285-pricing-client.js || { echo "::error::${LABEL}: retained Build 275 booking module missing."; exit 11; }
grep -q './customer-rebook-v285.js' /tmp/rosie-build285-pricing-client.js || { echo "::error::${LABEL}: booking path does not bootstrap Build 285."; exit 12; }

echo "${LABEL}: Build 285 customer-history rebook HTTP smoke PASS at ${BASE_URL}"
