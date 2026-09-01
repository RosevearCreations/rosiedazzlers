#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-}"
LABEL="${2:-Build 287 endpoint}"
if [[ -z "$BASE_URL" ]]; then
  echo "::error::${LABEL}: smoke base URL is empty."
  exit 2
fi
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

account_code=$(curl_code /tmp/rosie-build287-account.js "${BASE_URL}/assets/customer-review-share-v287.js")
[[ "$account_code" == "200" ]] || { echo "::error::${LABEL}: Build 287 account share module returned HTTP ${account_code}."; exit 10; }
grep -q "Review Rosie on Google" /tmp/rosie-build287-account.js || { echo "::error::${LABEL}: Google review follow-up marker missing."; exit 11; }
grep -q "customer_share_completed" /tmp/rosie-build287-account.js || { echo "::error::${LABEL}: customer share completion analytics marker missing."; exit 12; }
grep -q "customer_referral" /tmp/rosie-build287-account.js || { echo "::error::${LABEL}: customer referral UTM campaign marker missing."; exit 13; }

entry_code=$(curl_code /tmp/rosie-build287-entry.js "${BASE_URL}/assets/customer-share-entry-v287.js")
[[ "$entry_code" == "200" ]] || { echo "::error::${LABEL}: Build 287 booking entry module returned HTTP ${entry_code}."; exit 14; }
grep -q "customer_share_booking_entry" /tmp/rosie-build287-entry.js || { echo "::error::${LABEL}: customer-share booking entry analytics marker missing."; exit 15; }
grep -q 'authority: "analytics_only"' /tmp/rosie-build287-entry.js || { echo "::error::${LABEL}: analytics-only authority marker missing."; exit 16; }
grep -q "Current service selection, vehicle size, availability, add-ons, price, deposit and payment rules still apply." /tmp/rosie-build287-entry.js || { echo "::error::${LABEL}: retained booking-authority notice missing."; exit 17; }

client_code=$(curl_code /tmp/rosie-build287-client-auth.js "${BASE_URL}/assets/client-auth.js")
[[ "$client_code" == "200" ]] || { echo "::error::${LABEL}: client-auth returned HTTP ${client_code}."; exit 18; }
grep -q "/assets/customer-review-share-v287.js" /tmp/rosie-build287-client-auth.js || { echo "::error::${LABEL}: My Account does not bootstrap Build 287 share helper."; exit 19; }

pricing_code=$(curl_code /tmp/rosie-build287-pricing.js "${BASE_URL}/assets/pricing-catalog-client.js")
[[ "$pricing_code" == "200" ]] || { echo "::error::${LABEL}: pricing client returned HTTP ${pricing_code}."; exit 20; }
grep -q './customer-share-entry-v287.js' /tmp/rosie-build287-pricing.js || { echo "::error::${LABEL}: booking path does not bootstrap Build 287 entry adapter."; exit 21; }

analytics_code=$(curl_code /tmp/rosie-build287-analytics.js "${BASE_URL}/assets/public-analytics.js")
[[ "$analytics_code" == "200" ]] || { echo "::error::${LABEL}: public analytics returned HTTP ${analytics_code}."; exit 22; }
grep -q "utm_source" /tmp/rosie-build287-analytics.js || { echo "::error::${LABEL}: public analytics no longer captures utm_source."; exit 23; }
grep -q "utm_campaign" /tmp/rosie-build287-analytics.js || { echo "::error::${LABEL}: public analytics no longer captures utm_campaign."; exit 24; }

review_code=$(curl_code /tmp/rosie-build287-review.json "${BASE_URL}/api/client/reviews_save")
if [[ "$review_code" == "404" || "$review_code" =~ ^5 ]]; then
  echo "::error::${LABEL}: protected review authority returned HTTP ${review_code}."
  cat /tmp/rosie-build287-review.json || true
  exit 25
fi
grep -qi "Unauthorized" /tmp/rosie-build287-review.json || { echo "::error::${LABEL}: unauthenticated review authority boundary changed unexpectedly."; cat /tmp/rosie-build287-review.json || true; exit 26; }

book_code=$(curl_code /tmp/rosie-build287-book.html "${BASE_URL}/book?utm_source=customer_share&utm_campaign=customer_referral")
[[ "$book_code" == "200" ]] || { echo "::error::${LABEL}: shared booking entry returned HTTP ${book_code}."; exit 27; }

echo "${LABEL}: Build 287 review/share HTTP smoke PASS at ${BASE_URL}"
