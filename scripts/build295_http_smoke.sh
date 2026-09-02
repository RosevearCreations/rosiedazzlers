#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-https://dev.rosiedazzlers.pages.dev}"
LABEL="${2:-Build 295 runtime}"
BASE_URL="${BASE_URL%/}"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

fail(){ echo "Build 295 smoke FAIL: $*" >&2; exit 1; }
fetch(){ curl -fsSL --retry 2 --retry-delay 1 "$@"; }

echo "== ${LABEL} =="
echo "Base: ${BASE_URL}"

fetch "${BASE_URL}/my-account" > "${TMP_DIR}/account.html" || fail "could not load /my-account"
for token in \
  'data-build295-account-source-authority' \
  'Maintenance interest' \
  'Open maintenance interest' \
  'id="maintenanceConversion"' \
  'id="bookingHistory"' \
  'id="vehicleForm"' \
  '/assets/client-auth.js'; do
  grep -Fq "$token" "${TMP_DIR}/account.html" || fail "account source missing retained static marker: $token"
done

ACCOUNT_RUNTIME="${TMP_DIR}/account.html"
if grep -Fq '/assets/my-account-v296.js' "${TMP_DIR}/account.html"; then
  fetch "${BASE_URL}/assets/my-account-v296.js" > "${TMP_DIR}/account-runtime.js" || fail "Build 296 versioned My Account module missing"
  ACCOUNT_RUNTIME="${TMP_DIR}/account-runtime.js"
fi
for token in \
  'data-build295-maintenance-interest-only' \
  'Maintenance timing is an interest preference' \
  'No fixed cadence, price, discount, priority, appointment, subscription or recurring billing'; do
  grep -Fq "$token" "$ACCOUNT_RUNTIME" || fail "account runtime missing retained Build 295 marker: $token"
done

if grep -Eqi 'acctAdminNotes|vehAdminNotes|vehNextDue|vehNextServiceMileage|vehIntervalDays|vehAutoSchedule|unlock maintenance pricing|reduced maintenance pricing|reduced repeat-clean pricing|Maintenance eligible|Recurring maintenance scheduling only starts|Your account can move into recurring maintenance' "${TMP_DIR}/account.html" "$ACCOUNT_RUNTIME"; then
  fail "legacy customer/staff or maintenance commercial authority remains in My Account runtime"
fi

# Defense-in-depth assets remain deployed even though static source no longer depends on them.
fetch "${BASE_URL}/assets/customer-privacy-v288.js" > "${TMP_DIR}/privacy.js" || fail "Build 288 privacy adapter missing"
grep -Fq 'build288CustomerPrivacy' "${TMP_DIR}/privacy.js" || fail "Build 288 privacy marker missing"
fetch "${BASE_URL}/assets/customer-maintenance-authority-v294.js" > "${TMP_DIR}/maintenance-v294.js" || fail "Build 294 maintenance adapter missing"
grep -Fq 'STAFF_OWNED_CONTROLS' "${TMP_DIR}/maintenance-v294.js" || fail "Build 294 defensive control boundary missing"

# Anonymous dashboard must remain signed out/customer-safe. This smoke is read-only.
status="$(curl -sS -o "${TMP_DIR}/dashboard.json" -w '%{http_code}' "${BASE_URL}/api/client/dashboard")"
[[ "$status" == "200" ]] || fail "anonymous dashboard returned HTTP ${status}, expected 200 signed-out projection"
grep -Eq '"authenticated"[[:space:]]*:[[:space:]]*false' "${TMP_DIR}/dashboard.json" || fail "anonymous dashboard did not fail closed"
grep -Eq '"signed_out"[[:space:]]*:[[:space:]]*true' "${TMP_DIR}/dashboard.json" || fail "anonymous dashboard missing signed-out marker"
grep -Eq '"bookings"[[:space:]]*:[[:space:]]*\[\]' "${TMP_DIR}/dashboard.json" || fail "anonymous dashboard exposed bookings"
grep -Eq '"reviews"[[:space:]]*:[[:space:]]*\[\]' "${TMP_DIR}/dashboard.json" || fail "anonymous dashboard exposed reviews"
if grep -Eqi 'service_role|supabase_service|password_hash|admin_private_notes' "${TMP_DIR}/dashboard.json"; then
  fail "anonymous dashboard disclosed private/internal data"
fi

echo "Build 295 runtime smoke: PASS"
echo "- static My Account source is maintenance-interest-only and privacy-safe"
echo "- Build 288/294 defensive adapters remain available"
echo "- anonymous dashboard remains signed-out and customer-safe"
echo "- smoke is read-only; it creates no customer, vehicle, booking, review, or maintenance record"
