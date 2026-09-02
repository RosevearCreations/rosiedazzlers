#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-https://dev.rosiedazzlers.pages.dev}"
LABEL="${2:-Build 298 runtime}"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

fetch() {
  curl --fail --silent --show-error --location --max-time 25 "$1"
}

root_html="$TMP_DIR/admin-quotes.html"
folder_html="$TMP_DIR/admin-quotes-folder.html"
asset_js="$TMP_DIR/admin-quotes-v298.js"

fetch "$BASE_URL/admin-quotes.html" > "$root_html"
fetch "$BASE_URL/admin-quotes" > "$folder_html"
fetch "$BASE_URL/assets/admin-quotes-v298.js" > "$asset_js"

for page in "$root_html" "$folder_html"; do
  grep -Fq '<script src="/assets/admin-quotes-v298.js"></script>' "$page"
  grep -Fq 'id="qBooking"' "$page"
  grep -Fq 'id="bookingLink"' "$page"
  grep -Fq 'href="/admin-booking.html"' "$page"
  if grep -Fq '/api/admin/quote_pipeline_save' "$page"; then
    echo "ERROR: mature quote runtime is still inline in deployed page" >&2
    exit 1
  fi
done

grep -Fq '/api/admin/quote_pipeline_list' "$asset_js"
grep -Fq '/api/admin/quote_pipeline_save' "$asset_js"
grep -Fq "booking_id:\$('#qBooking').value||null" "$asset_js"
grep -Fq "window.AdminShell.boot({pageKey:'admin-quotes'" "$asset_js"
node --check "$asset_js"

# This smoke is intentionally read-only: it fetches static pages/assets only and never calls quote/booking write APIs.
echo "$LABEL: PASS"
echo "- /admin-quotes.html and /admin-quotes load the Build 298 external runtime"
echo "- quote list/save and booking-bridge authority markers remain present in the versioned asset"
echo "- smoke is read-only; no quote, booking, pricing or schema mutation is attempted"
