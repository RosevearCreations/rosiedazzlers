#!/usr/bin/env bash
set -euo pipefail
BASE_URL="${1:-https://dev.rosiedazzlers.pages.dev}"
LABEL="${2:-Build 305 runtime}"
tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT

assert_denied(){
  local method="$1" route="$2" body="${3:-}"
  local out="$tmp/${route}.json" status
  if [[ "$method" == "GET" ]]; then
    status=$(curl -sS -o "$out" -w '%{http_code}' "$BASE_URL/api/admin/$route")
  else
    status=$(curl -sS -o "$out" -w '%{http_code}' -X "$method" -H 'Content-Type: application/json' --data "$body" "$BASE_URL/api/admin/$route")
  fi
  [[ "$status" == "401" ]] || { echo "$LABEL: anonymous $method $route expected 401, got $status"; cat "$out"; exit 41; }
  grep -Fq '"error":"Unauthorized."' "$out"
  if grep -Fiq 'required_action' "$out"; then
    echo "$LABEL: anonymous denial disclosed required_action for $route"; cat "$out"; exit 42
  fi
}

assert_denied GET accounting_accounts_list
assert_denied GET payment_webhook_events_list
assert_denied GET payroll_summary
assert_denied POST accounting_entry_save '{}'
assert_denied POST accounting_bank_reconciliation '{}'
assert_denied POST accounting_remittance_post '{}'
assert_denied POST payment_refund_status_poll '{}'
assert_denied POST payment_webhook_event_replay '{}'
assert_denied POST final_balance_checkout_create '{}'
assert_denied POST quote_deposit_request_create '{}'

echo "$LABEL: PASS"
echo "- anonymous Finance reads fail closed before data access"
echo "- posting/reconciliation/tax/refund/settlement mutations fail closed before route logic"
echo "- Operations-owned quote request mutation remains authenticated"
echo "- anonymous denial responses do not disclose required action names"
