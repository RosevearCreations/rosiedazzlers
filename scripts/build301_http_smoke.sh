#!/usr/bin/env bash
set -euo pipefail
BASE_URL="${1:-https://dev.rosiedazzlers.pages.dev}"
PAGE_URL="${BASE_URL}/admin-accounting.html"
ASSET_URL="${BASE_URL}/assets/admin-accounting-v301.js"

echo "Build 301 read-only Finance Reconciliation smoke against ${BASE_URL}"
echo "Using bounded Development-alias convergence retry; no POST/write/reconcile action is issued."

ok=0
for attempt in $(seq 1 12); do
  page="$(curl -fsSL --connect-timeout 10 --max-time 30 "$PAGE_URL" 2>/dev/null || true)"
  asset="$(curl -fsSL --connect-timeout 10 --max-time 30 "$ASSET_URL" 2>/dev/null || true)"
  if grep -Fq '<script src="/assets/admin-accounting-v301.js"></script>' <<<"$page" \
    && grep -Fq 'Bank reconciliation' <<<"$page" \
    && grep -Fq 'id="bankReconForm"' <<<"$page" \
    && grep -Fq 'renderBankReconciliation' <<<"$asset" \
    && grep -Fq '/api/admin/accounting_bank_reconciliation?' <<<"$asset" \
    && grep -Fq '/api/admin/accounting_payroll_payout_reconciliation?' <<<"$asset" \
    && grep -Fq '/api/admin/accounting_statement_report?' <<<"$asset" \
    && grep -Fq "pageKey: 'admin-accounting'" <<<"$asset"; then
    ok=1
    break
  fi
  echo "Development alias not converged to Build 301 yet (attempt ${attempt}/12)."
  sleep 5
done

if [[ "$ok" != "1" ]]; then
  echo "Build 301 read-only Finance Reconciliation smoke: FAIL — Development alias did not converge within bounded retry." >&2
  exit 1
fi

echo "Build 301 read-only Finance Reconciliation smoke: PASS"
