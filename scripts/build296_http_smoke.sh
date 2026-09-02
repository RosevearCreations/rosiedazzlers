#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-https://dev.rosiedazzlers.pages.dev}"
LABEL="${2:-Build 296 runtime}"
BASE_URL="${BASE_URL%/}"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

fail(){ echo "Build 296 smoke FAIL: $*" >&2; exit 1; }
fetch(){ curl -fsSL --retry 2 --retry-delay 1 "$@"; }

echo "== ${LABEL} =="
echo "Base: ${BASE_URL}"

fetch "${BASE_URL}/my-account" > "${TMP_DIR}/account.html" || fail "could not load /my-account"
for token in \
  'data-build295-account-source-authority' \
  'data-build295-maintenance-interest-only' \
  'Maintenance interest' \
  'Open maintenance interest' \
  'No fixed cadence, price, discount, priority, appointment, subscription or recurring billing' \
  'id="maintenanceConversion"' \
  'id="bookingHistory"' \
  'id="vehicleForm"' \
  '/assets/client-auth.js' \
  '<script type="module" src="/assets/my-account-v296.js"></script>'; do
  grep -Fq "$token" "${TMP_DIR}/account.html" || fail "account source missing runtime marker: $token"
done

if grep -Fq '<script type="module">' "${TMP_DIR}/account.html"; then
  fail "mature inline My Account module still exists at runtime"
fi

fetch "${BASE_URL}/assets/my-account-v296.js" > "${TMP_DIR}/account.js" || fail "versioned My Account module missing"
for token in \
  'import { setBrandImages, setFooter } from "/assets/site.js";' \
  '/api/client/dashboard' \
  '/api/client/profile_update' \
  '/api/client/vehicles_save' \
  '/api/client/vehicle_media_upload_url' \
  '/api/client/vehicle_media_save' \
  '/api/client/reviews_save' \
  'setBrandImages(); setFooter();'; do
  grep -Fq "$token" "${TMP_DIR}/account.js" || fail "versioned account module missing runtime marker: $token"
done

if grep -Eqi 'acctAdminNotes|vehAdminNotes|vehNextDue|vehNextServiceMileage|vehIntervalDays|vehAutoSchedule|admin_private_notes|unlock maintenance pricing|reduced maintenance pricing|reduced repeat-clean pricing|Maintenance eligible|Recurring maintenance scheduling only starts|Your account can move into recurring maintenance' "${TMP_DIR}/account.html" "${TMP_DIR}/account.js"; then
  fail "legacy customer/staff or maintenance commercial authority remains in My Account runtime"
fi

fetch "${BASE_URL}/assets/customer-privacy-v288.js" > "${TMP_DIR}/privacy.js" || fail "Build 288 privacy adapter missing"
grep -Fq 'build288CustomerPrivacy' "${TMP_DIR}/privacy.js" || fail "Build 288 privacy marker missing"
fetch "${BASE_URL}/assets/customer-maintenance-authority-v294.js" > "${TMP_DIR}/maintenance-v294.js" || fail "Build 294 maintenance adapter missing"
grep -Fq 'STAFF_OWNED_CONTROLS' "${TMP_DIR}/maintenance-v294.js" || fail "Build 294 defensive control boundary missing"

status="$(curl -sS -o "${TMP_DIR}/dashboard.json" -w '%{http_code}' "${BASE_URL}/api/client/dashboard")"
[[ "$status" == "200" ]] || fail "anonymous dashboard returned HTTP ${status}, expected 200 signed-out projection"
grep -Eq '"authenticated"[[:space:]]*:[[:space:]]*false' "${TMP_DIR}/dashboard.json" || fail "anonymous dashboard did not fail closed"
grep -Eq '"signed_out"[[:space:]]*:[[:space:]]*true' "${TMP_DIR}/dashboard.json" || fail "anonymous dashboard missing signed-out marker"
grep -Eq '"bookings"[[:space:]]*:[[:space:]]*\[\]' "${TMP_DIR}/dashboard.json" || fail "anonymous dashboard exposed bookings"
grep -Eq '"reviews"[[:space:]]*:[[:space:]]*\[\]' "${TMP_DIR}/dashboard.json" || fail "anonymous dashboard exposed reviews"
if grep -Eqi 'service_role|supabase_service|password_hash|admin_private_notes' "${TMP_DIR}/dashboard.json"; then
  fail "anonymous dashboard disclosed private/internal data"
fi

echo "Build 296 runtime smoke: PASS"
echo "- My Account loads its mature behavior from /assets/my-account-v296.js"
echo "- retained Build 295 source authority remains visible and safe"
echo "- Build 288/294 defensive adapters remain available"
echo "- anonymous dashboard remains signed-out and customer-safe"
echo "- smoke is read-only; it creates no customer, vehicle, booking, review, media, or maintenance record"
