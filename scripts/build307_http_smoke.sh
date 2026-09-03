#!/usr/bin/env bash
set -euo pipefail
BASE_URL="${1:-https://dev.rosiedazzlers.pages.dev}"
LABEL="${2:-Build 307 runtime}"
tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT

status=$(curl -sSL -o "$tmp/page.html" -w '%{http_code}' "$BASE_URL/admin-system-health.html")
[[ "$status" == "200" ]] || { echo "$LABEL: System Health page expected 200, got $status"; exit 71; }
grep -Fq 'Build 307 · I.T. readiness' "$tmp/page.html"
grep -Fq '/assets/admin-system-health-v307.js' "$tmp/page.html"
grep -Fq 'configuration never counts as payment, webhook, delivery, publishing, or external API transaction acceptance' "$tmp/page.html"

status=$(curl -sS -o "$tmp/anon.json" -w '%{http_code}' "$BASE_URL/api/admin/system_health_families")
[[ "$status" == "401" ]] || { echo "$LABEL: anonymous readiness API expected 401, got $status"; cat "$tmp/anon.json"; exit 72; }
grep -Fq '"error":"Unauthorized."' "$tmp/anon.json"
for token in SUPABASE_SERVICE_ROLE_KEY STRIPE_SECRET_KEY PAYPAL_CLIENT_SECRET STAFF_SESSION_SECRET required_action corrective_action; do
  if grep -Fiq "$token" "$tmp/anon.json"; then
    echo "$LABEL: anonymous denial leaked $token"; cat "$tmp/anon.json"; exit 73
  fi
done

status=$(curl -sS -o "$tmp/post.json" -w '%{http_code}' -X POST -H 'Content-Type: application/json' --data '{}' "$BASE_URL/api/admin/system_health_families")
[[ "$status" == "405" ]] || { echo "$LABEL: readiness POST expected 405, got $status"; cat "$tmp/post.json"; exit 74; }

status=$(curl -sS -o "$tmp/bad-family.json" -w '%{http_code}' "$BASE_URL/api/admin/system_health_families?family=not-a-family")
[[ "$status" == "401" ]] || { echo "$LABEL: anonymous invalid-family request must fail auth before validation, got $status"; cat "$tmp/bad-family.json"; exit 75; }

echo "$LABEL: PASS"
echo "- Build 307 readiness dashboard and versioned runtime are deployed"
echo "- anonymous diagnostics fail closed before family validation without secret/action leakage"
echo "- mutation method is rejected; runtime smoke remains read-only"
