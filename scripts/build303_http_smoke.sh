#!/usr/bin/env bash
set -euo pipefail
base="${1:-https://dev.rosiedazzlers.pages.dev}"
page="$(curl -fsSL --retry 8 --retry-delay 4 --retry-all-errors "$base/admin-tax-support.html")"
printf '%s' "$page" | grep -Fq '/assets/admin-tax-support-v303.js'
printf '%s' "$page" | grep -Fq 'Tax support & accountant readiness'
asset="$(curl -fsSL --retry 8 --retry-delay 4 --retry-all-errors "$base/assets/admin-tax-support-v303.js")"
printf '%s' "$asset" | grep -Fq '/api/admin/accounting_tax_support'
printf '%s' "$asset" | grep -Fq '/api/admin/accounting_accountant_package?year='
echo 'Build 303 read-only tax-support HTTP smoke: PASS'
