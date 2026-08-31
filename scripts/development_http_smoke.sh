#!/usr/bin/env bash
set -euo pipefail
# Build 283 exact-deployment + branch-alias smoke authority.
# Retains Build 281 Functions-aware static/full separation, Build 282 high-intent
# acquisition-to-booking artifacts, and now proves Build 283 Gallery publication UI/API.

BASE_URL="${1:-}"
LABEL="${2:-Development endpoint}"
RETRY_MODE="${SMOKE_RETRY_MODE:-0}"
SMOKE_SCOPE="${SMOKE_SCOPE:-full}"

report_failure() {
  local message="$1"
  if [[ "$RETRY_MODE" == "1" ]]; then
    echo "::warning::${message}"
  else
    echo "::error::${message}"
  fi
}

if [[ -z "$BASE_URL" ]]; then
  report_failure "${LABEL}: smoke base URL is empty."
  exit 2
fi
if [[ "$SMOKE_SCOPE" != "static" && "$SMOKE_SCOPE" != "full" ]]; then
  report_failure "${LABEL}: unsupported SMOKE_SCOPE ${SMOKE_SCOPE}."
  exit 3
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

app_code=$(curl_code /tmp/rosie-app.html "${BASE_URL}/app/")
[[ "$app_code" == "200" ]] || { report_failure "${LABEL}: Staff App returned HTTP ${app_code}."; exit 6; }
grep -q "Staff App Launcher" /tmp/rosie-app.html || { report_failure "${LABEL}: /app/ did not contain the Staff App Launcher marker."; exit 7; }

if [[ "$SMOKE_SCOPE" == "full" ]]; then
  for endpoint in "/api/notifications_list" "/api/detailer/jobs?scope=workspace" "/api/admin/accounting_tax_support" "/api/admin/accounting_accountant_package" "/api/admin/integration_status" "/api/admin/gallery_approvals_list" "/api/admin/gallery_media_candidates_list"; do
    code=$(curl_code /tmp/rosie-api.json "${BASE_URL}${endpoint}")
    if [[ "$code" == "404" || "$code" =~ ^5 ]]; then
      report_failure "${LABEL}: protected smoke endpoint ${endpoint} returned HTTP ${code}."
      cat /tmp/rosie-api.json || true
      exit 8
    fi
  done
fi

tax_page_code=$(curl_code /tmp/rosie-tax-support.html "${BASE_URL}/admin-tax-support.html")
[[ "$tax_page_code" == "200" ]] || { report_failure "${LABEL}: Tax Support page returned HTTP ${tax_page_code}."; exit 9; }
grep -q "Tax support & accountant readiness" /tmp/rosie-tax-support.html || { report_failure "${LABEL}: Tax Support page missing Build 273 marker."; exit 10; }

it_page_code=$(curl_code /tmp/rosie-it-connections.html "${BASE_URL}/admin-integrations.html")
[[ "$it_page_code" == "200" ]] || { report_failure "${LABEL}: I.T. Connections page returned HTTP ${it_page_code}."; exit 11; }
grep -q 'data-build274="it-help-foundation"' /tmp/rosie-it-connections.html || { report_failure "${LABEL}: I.T. Connections page missing Build 274 marker."; exit 12; }

retention_code=$(curl_code /tmp/rosie-booking-retention.js "${BASE_URL}/assets/booking-retention-v275.js")
[[ "$retention_code" == "200" ]] || { report_failure "${LABEL}: Build 275 booking-retention module returned HTTP ${retention_code}."; exit 13; }
grep -q "Next available slots" /tmp/rosie-booking-retention.js || { report_failure "${LABEL}: booking-retention module missing Next available slots marker."; exit 14; }
grep -q "booking_funnel_exit" /tmp/rosie-booking-retention.js || { report_failure "${LABEL}: booking-retention module missing booking_funnel_exit marker."; exit 15; }

usecase_code=$(curl_code /tmp/rosie-booking-usecase-v282.js "${BASE_URL}/assets/booking-usecase-entry-v282.js")
[[ "$usecase_code" == "200" ]] || { report_failure "${LABEL}: Build 282 booking use-case adapter returned HTTP ${usecase_code}."; exit 30; }
grep -q "booking_usecase_entry" /tmp/rosie-booking-usecase-v282.js || { report_failure "${LABEL}: Build 282 booking adapter missing analytics marker."; exit 31; }
grep -q "spring_salt" /tmp/rosie-booking-usecase-v282.js || { report_failure "${LABEL}: Build 282 booking adapter missing spring salt preset."; exit 32; }
grep -q "winter_prep" /tmp/rosie-booking-usecase-v282.js || { report_failure "${LABEL}: Build 282 booking adapter missing winter protection preset."; exit 33; }

gallery_admin_code=$(curl_code /tmp/rosie-admin-gallery.html "${BASE_URL}/admin-gallery.html")
[[ "$gallery_admin_code" == "200" ]] || { report_failure "${LABEL}: Build 283 Gallery publication page returned HTTP ${gallery_admin_code}."; exit 37; }
grep -q 'data-build283="proof-publication-controls"' /tmp/rosie-admin-gallery.html || { report_failure "${LABEL}: Gallery publication page missing Build 283 identity marker."; exit 38; }
grep -q "Confirm public-use approval" /tmp/rosie-admin-gallery.html || { report_failure "${LABEL}: Gallery publication page missing separate public-use approval control."; exit 39; }
grep -q 'data-action="publish"' /tmp/rosie-admin-gallery.html || { report_failure "${LABEL}: Gallery publication page missing explicit publish control."; exit 40; }
grep -q 'data-action="unpublish"' /tmp/rosie-admin-gallery.html || { report_failure "${LABEL}: Gallery publication page missing explicit unpublish control."; exit 41; }

if [[ "$SMOKE_SCOPE" == "full" ]]; then
  landing_api_code=$(curl_code /tmp/rosie-landing-pages.json "${BASE_URL}/api/landing_pages_public")
  [[ "$landing_api_code" == "200" ]] || { report_failure "${LABEL}: public landing-page API returned HTTP ${landing_api_code}."; exit 17; }
  jq -e '.ok == true and .pages["tillsonburg-auto-detailing"] and .pages["port-dover-auto-detailing"]' /tmp/rosie-landing-pages.json >/dev/null || { report_failure "${LABEL}: landing-page API is missing guarded local pages."; exit 18; }
  grep -qi "self-contained mobile operating water and power" /tmp/rosie-landing-pages.json || { report_failure "${LABEL}: landing-page API does not expose the Build 278 self-contained service model."; exit 19; }
  if grep -Eqi 'customer-supplied garden hose|household electricity rate|standard exterior outlet' /tmp/rosie-landing-pages.json; then
    report_failure "${LABEL}: stale customer utility assumptions escaped the Build 278 finalizer."
    exit 20
  fi

  gallery_api_code=$(curl_code /tmp/rosie-gallery-public.json "${BASE_URL}/api/before_after_gallery_public")
  [[ "$gallery_api_code" == "200" ]] || { report_failure "${LABEL}: Build 283 public Gallery API returned HTTP ${gallery_api_code}."; exit 42; }
  jq -e '.ok == true and (.items | type == "array") and (.blocked_count | type == "number") and (.proof_ready_count | type == "number") and (.publication_rule | type == "string") and (.proof_rule | type == "string")' /tmp/rosie-gallery-public.json >/dev/null || { report_failure "${LABEL}: public Gallery API is missing Build 283 publication/proof authority fields."; cat /tmp/rosie-gallery-public.json || true; exit 43; }
  grep -qi "explicitly published" /tmp/rosie-gallery-public.json || { report_failure "${LABEL}: public Gallery API does not expose the explicit publication rule."; exit 44; }
  grep -qi "real Rosie proof" /tmp/rosie-gallery-public.json || { report_failure "${LABEL}: public Gallery API does not expose the real-proof boundary."; exit 45; }
fi

for slug in tillsonburg-auto-detailing woodstock-ingersoll-auto-detailing norwich-otterville-auto-detailing zorra-thamesford-embro-auto-detailing simcoe-delhi-auto-detailing port-dover-auto-detailing waterford-vittoria-auto-detailing port-rowan-turkey-point-auto-detailing; do
  code=$(curl_code "/tmp/${slug}.html" "${BASE_URL}/${slug}/")
  [[ "$code" == "200" ]] || { report_failure "${LABEL}: local page ${slug} returned HTTP ${code}."; exit 21; }
  grep -q 'data-build278="local-seo-depth"' "/tmp/${slug}.html" || { report_failure "${LABEL}: local page ${slug} is missing Build 278 static-depth marker."; exit 22; }
done

for slug in pre-sale-lease-return-detailing spring-salt-recovery-detailing fall-winter-protection-detailing; do
  code=$(curl_code "/tmp/${slug}.html" "${BASE_URL}/${slug}/")
  [[ "$code" == "200" ]] || { report_failure "${LABEL}: Build 282 use-case page ${slug} returned HTTP ${code}."; exit 34; }
  grep -q 'data-build282="usecase-conversion"' "/tmp/${slug}.html" || { report_failure "${LABEL}: Build 282 use-case page ${slug} is missing its static identity marker."; exit 35; }
done

sitemap_code=$(curl_code /tmp/rosie-sitemap.xml "${BASE_URL}/sitemap.xml")
[[ "$sitemap_code" == "200" ]] || { report_failure "${LABEL}: sitemap returned HTTP ${sitemap_code}."; exit 23; }
grep 'tillsonburg-auto-detailing/' /tmp/rosie-sitemap.xml | grep -q '2026-08-31' || { report_failure "${LABEL}: sitemap does not expose the Build 280 local lastmod."; exit 24; }
for slug in pre-sale-lease-return-detailing spring-salt-recovery-detailing fall-winter-protection-detailing; do
  grep "${slug}/" /tmp/rosie-sitemap.xml | grep -q '2026-08-31' || { report_failure "${LABEL}: sitemap does not expose current Build 282 entry ${slug}."; exit 36; }
done

echo "${LABEL}: Development ${SMOKE_SCOPE} HTTP smoke PASS at ${BASE_URL}"
