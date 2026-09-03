#!/usr/bin/env bash
set -euo pipefail
BASE_URL="${1:-https://dev.rosiedazzlers.pages.dev}"
LABEL="${2:-Build 306 runtime}"
tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT

status=$(curl -sSL -o "$tmp/page.html" -w '%{http_code}' "$BASE_URL/admin-system-health.html")
[[ "$status" == "200" ]] || { echo "$LABEL: System Health page expected 200, got $status"; exit 61; }
grep -Fq 'I.T. System Health' "$tmp/page.html" || { echo "$LABEL: System Health page identity missing"; exit 65; }
if ! grep -Fq '/assets/admin-system-health-v306.js' "$tmp/page.html" && ! grep -Fq '/assets/admin-system-health-v307.js' "$tmp/page.html"; then
  echo "$LABEL: recognized Build 306/307 System Health runtime identity missing"
  exit 66
fi

status=$(curl -sS -o "$tmp/anon.json" -w '%{http_code}' "$BASE_URL/api/admin/system_health_families")
[[ "$status" == "401" ]] || { echo "$LABEL: anonymous health-family API expected 401, got $status"; cat "$tmp/anon.json"; exit 62; }
grep -Fq '"error":"Unauthorized."' "$tmp/anon.json" || { echo "$LABEL: anonymous denial identity missing"; cat "$tmp/anon.json"; exit 67; }
for token in SUPABASE_SERVICE_ROLE_KEY STRIPE_SECRET_KEY PAYPAL_CLIENT_SECRET STAFF_SESSION_SECRET required_action; do
  if grep -Fiq "$token" "$tmp/anon.json"; then
    echo "$LABEL: anonymous denial leaked $token"; cat "$tmp/anon.json"; exit 63
  fi
done

status=$(curl -sS -o "$tmp/post.json" -w '%{http_code}' -X POST -H 'Content-Type: application/json' --data '{}' "$BASE_URL/api/admin/system_health_families")
[[ "$status" == "405" ]] || { echo "$LABEL: health-family POST expected 405, got $status"; cat "$tmp/post.json"; exit 64; }

echo "$LABEL: PASS"
echo "- System Health dashboard and a recognized Build 306/307 versioned runtime are deployed"
echo "- anonymous diagnostic access fails closed without action/secret disclosure"
echo "- mutation method is rejected; runtime smoke is read-only"
