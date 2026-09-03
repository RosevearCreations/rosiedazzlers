#!/usr/bin/env bash
set -euo pipefail
BASE_URL="${1:-https://dev.rosiedazzlers.pages.dev}"
echo "Build 312 read-only inventory integrity smoke against ${BASE_URL}"
page="$(curl -fsSL --retry 6 --retry-delay 3 "${BASE_URL}/admin-catalog.html")"
asset="$(curl -fsSL --retry 6 --retry-delay 3 "${BASE_URL}/assets/admin-catalog-v311.js")"
grep -Fq '<script src="/assets/admin-catalog-v311.js"></script>' <<<"$page"
grep -Fq 'Inventory Workflow' <<<"$page"
grep -Fq '/api/admin/catalog_stock_action' <<<"$asset"
grep -Fq '/api/admin/catalog_reorder_request' <<<"$asset"
grep -Fq '/api/admin/catalog_purchase_order_update' <<<"$asset"
for path in /api/admin/catalog_inventory_list /api/admin/catalog_usage_list /api/admin/catalog_purchase_orders_list; do
  code="$(curl -sS -o /tmp/build312-body -w '%{http_code}' --retry 6 --retry-delay 3 "${BASE_URL}${path}")"
  case "$code" in
    401|403) ;;
    *) echo "Expected anonymous read-only ${path} to fail closed with 401/403, got ${code}" >&2; cat /tmp/build312-body >&2 || true; exit 1;;
  esac
done
echo "Build 312 read-only inventory integrity smoke: PASS (Inventory UI/API identities present; anonymous protected reads fail closed; no mutation performed)"
