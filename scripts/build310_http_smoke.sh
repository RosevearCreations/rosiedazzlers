#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-https://dev.rosiedazzlers.pages.dev}"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

echo "Build 310 read-only Admin full-access runtime smoke against ${BASE_URL}"

curl -fsSL --retry 6 --retry-delay 3 "${BASE_URL}/admin-staff.html" -o "$TMP_DIR/admin-staff.html"
curl -fsSL --retry 6 --retry-delay 3 "${BASE_URL}/assets/admin-staff-v309.js" -o "$TMP_DIR/admin-staff-v309.js"

grep -Fq '<h1>Manage staff access</h1>' "$TMP_DIR/admin-staff.html"
for module in detailer operations admin it finance daip socials; do
  grep -Fq "data-module-access=\"${module}\"" "$TMP_DIR/admin-staff.html"
done
grep -Fq 'Administrator / Owner — all modules' "$TMP_DIR/admin-staff.html"
grep -Fq 'const MODULE_KEYS = ["detailer","operations","admin","it","finance","daip","socials"]' "$TMP_DIR/admin-staff-v309.js"
grep -Fq 'admin: [...MODULE_KEYS]' "$TMP_DIR/admin-staff-v309.js"
grep -Fq 'const forcedAdmin = role === "admin"' "$TMP_DIR/admin-staff-v309.js"
grep -Fq 'Administrator accounts are always granted every internal module.' "$TMP_DIR/admin-staff-v309.js"

# staff_list is a read operation implemented as POST. This anonymous probe is deliberately
# credential-free, so authorization must stop it before any Supabase read or business mutation.
status="$(curl -sS --retry 6 --retry-delay 3 -o "$TMP_DIR/staff-list.json" -w '%{http_code}' \
  -X POST -H 'content-type: application/json' --data '{}' "${BASE_URL}/api/admin/staff_list")"
case "$status" in
  401|403) ;;
  *)
    echo "Build 310 expected anonymous staff_list denial, got HTTP ${status}" >&2
    cat "$TMP_DIR/staff-list.json" >&2 || true
    exit 1
    ;;
esac
node -e 'const fs=require("fs"); const p=process.argv[1]; const j=JSON.parse(fs.readFileSync(p,"utf8")); if(!j || typeof j.error!=="string") process.exit(2);' "$TMP_DIR/staff-list.json"

echo "Build 310 read-only runtime smoke: PASS"
echo "- all seven Staff Administration module controls are deployed"
echo "- Admin all-module forcing is deployed"
echo "- anonymous Staff Administration API access remains denied"
