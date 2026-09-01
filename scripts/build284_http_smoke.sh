#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-}"
LABEL="${2:-Build 284 target}"
SCOPE="${SMOKE_SCOPE:-full}"
[[ -n "$BASE_URL" ]] || { echo "Build 284 smoke requires a base URL." >&2; exit 2; }
BASE_URL="${BASE_URL%/}"

tmpdir="$(mktemp -d)"
trap 'rm -rf "$tmpdir"' EXIT

fetch_ok() {
  local path="$1" out="$2" code
  code=$(curl --silent --show-error --location --output "$out" --write-out '%{http_code}' "${BASE_URL}${path}")
  [[ "$code" == "200" ]] || { echo "${LABEL}: ${path} returned HTTP ${code}" >&2; return 1; }
}

require_text() {
  local file="$1" token="$2" label="$3"
  grep -Fq "$token" "$file" || { echo "${LABEL}: ${label} missing ${token}" >&2; return 1; }
}

fetch_ok "/assets/contextual-proof-v284.js" "$tmpdir/proof.js"
require_text "$tmpdir/proof.js" "Build 284" "contextual proof asset"
require_text "$tmpdir/proof.js" "/api/before_after_gallery_public" "contextual proof asset"
require_text "$tmpdir/proof.js" "no-real-matching-proof" "contextual proof asset"
require_text "$tmpdir/proof.js" "Real Rosie work" "contextual proof asset"

fetch_ok "/assets/visual-placeholders.js" "$tmpdir/placeholders.js"
require_text "$tmpdir/placeholders.js" "/assets/contextual-proof-v284.js" "visual bootstrap"
require_text "$tmpdir/placeholders.js" "data-build284-contextual-proof-bootstrap" "visual bootstrap"

fetch_ok "/headlight-restoration/" "$tmpdir/service.html"
require_text "$tmpdir/service.html" "data-landing-slug=\"headlight-restoration\"" "representative service page"
require_text "$tmpdir/service.html" "/assets/chrome.js" "representative service page"

fetch_ok "/tillsonburg-auto-detailing/" "$tmpdir/location.html"
require_text "$tmpdir/location.html" "data-build278=\"local-seo-depth\"" "representative location page"
require_text "$tmpdir/location.html" "/assets/chrome.js" "representative location page"

fetch_ok "/spring-salt-recovery-detailing/" "$tmpdir/usecase.html"
require_text "$tmpdir/usecase.html" "data-build282=\"usecase-conversion\"" "representative use-case page"
require_text "$tmpdir/usecase.html" "/assets/chrome.js" "representative use-case page"

if [[ "$SCOPE" == "full" ]]; then
  fetch_ok "/api/before_after_gallery_public" "$tmpdir/gallery.json"
  jq -e '.ok == true and (.items | type == "array") and (.publication_rule | type == "string") and (.proof_rule | type == "string")' "$tmpdir/gallery.json" >/dev/null
  jq -e '.proof_rule | ascii_downcase | contains("real rosie proof")' "$tmpdir/gallery.json" >/dev/null
fi

echo "${LABEL}: Build 284 contextual proof ${SCOPE} HTTP smoke PASS at ${BASE_URL}"
