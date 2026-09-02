#!/usr/bin/env bash
set -euo pipefail
base="${1:-https://dev.rosiedazzlers.pages.dev}"

page="$(curl -fsSL --retry 8 --retry-delay 4 --retry-all-errors "$base/admin-tax-support.html")"
printf '%s' "$page" | grep -Fq '/assets/admin-tax-support-v303.js'
printf '%s' "$page" | grep -Fq 'Download accountant JSON'

asset="$(curl -fsSL --retry 8 --retry-delay 4 --retry-all-errors "$base/assets/admin-tax-support-v303.js")"
printf '%s' "$asset" | grep -Fq '/api/admin/accounting_accountant_package?year='
printf '%s' "$asset" | grep -Fq 'rosie-accountant-package-${year}.json'

body_file="$(mktemp)"
trap 'rm -f "$body_file"' EXIT
code="$(curl -sS --connect-timeout 10 --max-time 30 -o "$body_file" -w '%{http_code}' "$base/api/admin/accounting_accountant_package?year=2026" || true)"
case "$code" in
  401|403) ;;
  *) echo "Build 304 expected anonymous accountant package rejection, got HTTP $code" >&2; exit 1 ;;
esac
if grep -Eq '"accountant_package"|storage_path|file_url|evidence_manifest' "$body_file"; then
  echo 'Build 304 anonymous response leaked accountant export content.' >&2
  exit 1
fi

echo 'Build 304 read-only accountant export HTTP smoke: PASS'
echo '- retained Tax Support page/asset remain deployed'
echo '- anonymous accountant package access fails closed without export leakage'
