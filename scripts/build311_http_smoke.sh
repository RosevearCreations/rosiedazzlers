#!/usr/bin/env bash
set -euo pipefail
BASE_URL="${1:-https://dev.rosiedazzlers.pages.dev}"
echo "Build 311 read-only Inventory Operations smoke against ${BASE_URL}"
page="$(curl -fsSL --retry 6 --retry-delay 3 "${BASE_URL}/admin-catalog.html")"
asset="$(curl -fsSL --retry 6 --retry-delay 3 "${BASE_URL}/assets/admin-catalog-v311.js")"
grep -Fq '<script src="/assets/admin-catalog-v311.js"></script>' <<<"$page"
grep -Fq 'Inventory Workflow' <<<"$page"
grep -Fq 'Low inventory & reorder candidates' <<<"$page"
grep -Fq '/api/admin/catalog_inventory_list' <<<"$asset"
grep -Fq '/api/admin/catalog_inventory_save' <<<"$asset"
grep -Fq '/api/admin/catalog_stock_action' <<<"$asset"
grep -Fq '/api/admin/catalog_reorder_request' <<<"$asset"
grep -Fq '/api/admin/catalog_usage_add' <<<"$asset"
grep -Fq '/api/admin/catalog_usage_list' <<<"$asset"
grep -Fq '/api/admin/catalog_low_stock_list' <<<"$asset"
grep -Fq '/api/admin/catalog_purchase_orders_list' <<<"$asset"
grep -Fq "pageKey:'admin-catalog'" <<<"$asset"
if grep -Fq 'setInterval(' <<<"$asset"; then
  echo "Build 311 Inventory Operations asset unexpectedly contains idle polling" >&2
  exit 1
fi
echo "Build 311 read-only Inventory Operations smoke: PASS (catalog_inventory_list and mutation API identities verified statically; no inventory write performed)"
