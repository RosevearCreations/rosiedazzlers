#!/usr/bin/env bash
set -euo pipefail
BASE_URL="${1:-https://dev.rosiedazzlers.pages.dev}"
echo "Build 309 read-only Staff Administration smoke against ${BASE_URL}"
page="$(curl -fsSL --retry 6 --retry-delay 3 "${BASE_URL}/admin-staff.html")"
asset="$(curl -fsSL --retry 6 --retry-delay 3 "${BASE_URL}/assets/admin-staff-v309.js")"
grep -Fq '<script type="module" src="/assets/admin-staff-v309.js"></script>' <<<"$page"
grep -Fq '<h1>Manage staff access</h1>' <<<"$page"
grep -Fq 'data-module-access="admin"' <<<"$page"
grep -Fq 'const ROLE_MODULES = {' <<<"$asset"
grep -Fq 'admin: [...MODULE_KEYS]' <<<"$asset"
grep -Fq 'module_access: collectModuleAccess()' <<<"$asset"
grep -Fq '/api/admin/staff_list' <<<"$asset"
grep -Fq '/api/admin/staff_save' <<<"$asset"
grep -Fq 'pageKey: "admin-staff"' <<<"$asset"
if grep -Fq 'setInterval(' <<<"$asset"; then
  echo "Build 309 Staff asset unexpectedly contains idle polling" >&2
  exit 1
fi
echo "Build 309 read-only Staff Administration smoke: PASS (staff_list/staff_save identities verified statically; no staff write performed)"
