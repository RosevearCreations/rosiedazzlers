#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-https://dev.rosiedazzlers.pages.dev}"
LABEL="${2:-Build 293 runtime}"
BASE_URL="${BASE_URL%/}"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

fail() { echo "Build 293 smoke FAIL: $*" >&2; exit 1; }
fetch() { curl -fsSL --retry 2 --retry-delay 1 "$@"; }

echo "== ${LABEL} =="
echo "Base: ${BASE_URL}"

fetch "${BASE_URL}/my-account" > "${TMP_DIR}/account.html" || fail "could not load /my-account"
grep -Fq 'id="accountNotice"' "${TMP_DIR}/account.html" || fail "account notice missing"
grep -Fq 'id="bookingHistory"' "${TMP_DIR}/account.html" || fail "booking history missing"
grep -Fq 'id="maintenanceConversion"' "${TMP_DIR}/account.html" || fail "maintenance host missing"
grep -Fq '/assets/client-auth.js' "${TMP_DIR}/account.html" || fail "client auth loader missing"

fetch "${BASE_URL}/assets/client-auth.js" > "${TMP_DIR}/client-auth.js" || fail "could not load client auth"
grep -Fq 'loadBuild293CustomerNextActions' "${TMP_DIR}/client-auth.js" || fail "Build 293 loader missing"
grep -Fq '/assets/customer-next-actions-v293.js' "${TMP_DIR}/client-auth.js" || fail "Build 293 asset is not loaded"

fetch "${BASE_URL}/assets/customer-next-actions-v293.js" > "${TMP_DIR}/next-actions.js" || fail "could not load Build 293 asset"
for token in 'What’s next?' 'review_completed_service' 'rebook_service' 'open_progress' 'Book this service again' 'data-build293-maintenance-boundary' 'Maintenance timing is an interest preference' 'No fixed cadence, price, discount, priority, subscription, appointment or recurring billing'; do
  grep -Fq "$token" "${TMP_DIR}/next-actions.js" || fail "Build 293 asset missing runtime marker: $token"
done
if grep -Fq 'method: "POST"' "${TMP_DIR}/next-actions.js"; then fail "Build 293 adapter contains a write request"; fi
if grep -Fq 'setInterval(' "${TMP_DIR}/next-actions.js"; then fail "Build 293 adapter contains polling"; fi

# Anonymous dashboard read must stay customer-safe and fail closed without writing anything.
status="$(curl -sS -o "${TMP_DIR}/dashboard.json" -w '%{http_code}' "${BASE_URL}/api/client/dashboard")"
[[ "$status" == "200" ]] || fail "anonymous dashboard returned HTTP ${status}, expected customer-safe 200 signed-out projection"
grep -Eq '"authenticated"[[:space:]]*:[[:space:]]*false' "${TMP_DIR}/dashboard.json" || fail "anonymous dashboard did not fail closed"
grep -Eq '"signed_out"[[:space:]]*:[[:space:]]*true' "${TMP_DIR}/dashboard.json" || fail "anonymous dashboard missing signed-out marker"
grep -Eq '"bookings"[[:space:]]*:[[:space:]]*\[\]' "${TMP_DIR}/dashboard.json" || fail "anonymous dashboard exposed booking rows"
grep -Eq '"reviews"[[:space:]]*:[[:space:]]*\[\]' "${TMP_DIR}/dashboard.json" || fail "anonymous dashboard exposed review rows"

if grep -Eqi 'service_role|supabase_service|password_hash|admin_private_notes|detailer_visible_notes' "${TMP_DIR}/dashboard.json"; then
  fail "anonymous dashboard disclosed private/internal data"
fi

echo "Build 293 runtime smoke: PASS"
echo "- My Account and Build 293 orchestration asset are available"
echo "- maintenance presentation is guarded by the Build 291 interest-only boundary"
echo "- anonymous dashboard remains signed-out and customer-safe"
echo "- smoke is read-only and must not create customer, review, booking, or maintenance-interest records"
