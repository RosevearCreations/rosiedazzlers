#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-https://dev.rosiedazzlers.pages.dev}"
PAGE_URL="${BASE_URL%/}/admin-app.html"
ASSET_URL="${BASE_URL%/}/assets/admin-app-v313.js"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

page="$TMP_DIR/admin-app.html"
asset="$TMP_DIR/admin-app-v313.js"

curl -fsSL --retry 2 --retry-delay 2 "$PAGE_URL" -o "$page"
curl -fsSL --retry 2 --retry-delay 2 "$ASSET_URL" -o "$asset"

grep -Fq '<script src="/assets/admin-app-v313.js"></script>' "$page"
grep -Fq '<h1>App Management</h1>' "$page"
grep -Fq 'The single shared pricing and package catalog' "$page"
grep -Fq '/admin-catalog.html' "$page"

grep -Fq '/api/admin/app_settings_get' "$asset"
grep -Fq '/api/admin/app_settings_save' "$asset"
grep -Fq "saveSetting('pricing_catalog', pricingCatalogState" "$asset"
grep -Fq 'function setPricingCatalogState(' "$asset"
grep -Fq 'pricingCatalogState.packages' "$asset"
grep -Fq 'pricingCatalogState.addons' "$asset"
grep -Fq 'pricingCatalogState.service_areas' "$asset"
grep -Fq 'pricingCatalogState.public_requirements' "$asset"

if grep -Fq 'setInterval(' "$asset"; then
  echo 'Build 313 runtime unexpectedly contains idle polling.' >&2
  exit 1
fi

node --check "$asset"

echo 'Build 313 Development Product/Catalog smoke: PASS'
echo '- admin-app page and versioned controller are deployed'
echo '- pricing_catalog package/add-on/service-area/requirements authority is retained'
echo '- app_settings_get/app_settings_save API identities are retained'
echo '- smoke is read-only: no authenticated API or Product/Catalog mutation is performed'
