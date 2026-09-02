#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-https://dev.rosiedazzlers.pages.dev}"
LABEL="${2:-Build 294 runtime}"
BASE_URL="${BASE_URL%/}"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

fail() { echo "Build 294 smoke FAIL: $*" >&2; exit 1; }
fetch() { curl -fsSL --retry 2 --retry-delay 1 "$@"; }

echo "== ${LABEL} =="
echo "Base: ${BASE_URL}"

fetch "${BASE_URL}/my-account" > "${TMP_DIR}/account.html" || fail "could not load /my-account"
for token in 'id="maintenanceConversion"' '/assets/client-auth.js' '<script type="module" src="/assets/my-account-v296.js"></script>'; do
  grep -Fq "$token" "${TMP_DIR}/account.html" || fail "account missing compatibility marker: $token"
done

# Build 295 removed staff-owned recurrence/scheduling controls from customer source.
# Build 294 remains defense in depth: its adapter still closes those controls if an older
# route copy ever presents them, but current customer HTML must not reintroduce them.
for token in 'id="vehNextDue"' 'id="vehNextServiceMileage"' 'id="vehIntervalDays"' 'id="vehAutoSchedule"'; do
  if grep -Fq "$token" "${TMP_DIR}/account.html"; then
    fail "retired staff-owned customer control returned at runtime: $token"
  fi
done

fetch "${BASE_URL}/assets/client-auth.js" > "${TMP_DIR}/client-auth.js" || fail "could not load client auth"
grep -Fq 'loadBuild294CustomerMaintenanceAuthority' "${TMP_DIR}/client-auth.js" || fail "Build 294 loader missing"
grep -Fq '/assets/customer-maintenance-authority-v294.js' "${TMP_DIR}/client-auth.js" || fail "Build 294 asset is not loaded"
grep -Fq 'loadBuild293CustomerNextActions' "${TMP_DIR}/client-auth.js" || fail "Build 293 next-action loader was lost"

fetch "${BASE_URL}/assets/customer-maintenance-authority-v294.js" > "${TMP_DIR}/maintenance-authority.js" || fail "could not load Build 294 asset"
for token in 'STAFF_OWNED_CONTROLS' 'vehNextDue' 'vehNextServiceMileage' 'vehIntervalDays' 'vehAutoSchedule' 'data-build294-maintenance-interest-only' 'Maintenance timing is an interest preference' 'Your customer account does not set a due date, service-mileage target, recurring cadence or automatic schedule.' 'No fixed cadence, price, discount, priority, appointment, subscription or recurring billing is created here.' '/maintenance-plan'; do
  grep -Fq "$token" "${TMP_DIR}/maintenance-authority.js" || fail "Build 294 asset missing runtime marker: $token"
done
if grep -Fq 'setInterval(' "${TMP_DIR}/maintenance-authority.js"; then fail "Build 294 adapter contains polling"; fi
if grep -Fq 'method: "POST"' "${TMP_DIR}/maintenance-authority.js"; then fail "Build 294 adapter contains a write request"; fi

# Anonymous dashboard remains read-only and customer-safe; this smoke never saves a vehicle.
status="$(curl -sS -o "${TMP_DIR}/dashboard.json" -w '%{http_code}' "${BASE_URL}/api/client/dashboard")"
[[ "$status" == "200" ]] || fail "anonymous dashboard returned HTTP ${status}"
grep -Eq '"authenticated"[[:space:]]*:[[:space:]]*false' "${TMP_DIR}/dashboard.json" || fail "anonymous dashboard did not fail closed"
grep -Eq '"vehicles"[[:space:]]*:[[:space:]]*\[\]' "${TMP_DIR}/dashboard.json" || fail "anonymous dashboard exposed vehicle rows"
if grep -Eqi 'admin_private_notes|service_role|supabase_service|password_hash' "${TMP_DIR}/dashboard.json"; then
  fail "anonymous dashboard disclosed private/internal data"
fi

echo "Build 294 runtime smoke: PASS"
echo "- Build 295-retired staff scheduling controls remain absent from customer HTML"
echo "- Build 294 customer maintenance authority adapter remains available as defense in depth"
echo "- Build 293 next-action loader remains present"
echo "- anonymous dashboard remains signed-out and customer-safe"
echo "- smoke is read-only and must not create or modify customer, vehicle, booking, review or maintenance-interest records"
