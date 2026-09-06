#!/usr/bin/env bash
set -euo pipefail

# Build 347 — runtime route/CSS smoke for current AdminShell protected pages.
# No sign-in or business mutation is performed: protected HTML is static, while
# authenticated APIs are intentionally outside this route-existence check.

BASE_URL="${1:-}"
LABEL="${2:-Development endpoint}"
if [[ -z "$BASE_URL" ]]; then
  echo "::error::${LABEL}: protected Admin smoke base URL is empty."
  exit 2
fi
BASE_URL="${BASE_URL%/}"

curl_code() {
  local output="$1" url="$2"
  curl --silent --show-error --location \
    --header 'Cache-Control: no-cache' \
    --header 'Pragma: no-cache' \
    --output "$output" \
    --write-out '%{http_code}' \
    "$url"
}

for asset in /assets/site.css /assets/admin-design-system.css /assets/admin-shell.js /assets/admin-menu.js; do
  safe=$(printf '%s' "$asset" | tr '/.' '__')
  code=$(curl_code "/tmp/${safe}" "${BASE_URL}${asset}")
  [[ "$code" == "200" ]] || { echo "::error::${LABEL}: ${asset} returned HTTP ${code}."; exit 3; }
done

grep -q 'data-admin-protected="true"' /tmp/_assets_admin-design-system_css || {
  echo "::error::${LABEL}: shared Admin design system is not the Build 347 protected-page contract."
  exit 4
}
grep -q 'rosie-admin-design-system-css' /tmp/_assets_admin-shell_js || {
  echo "::error::${LABEL}: AdminShell does not load the shared Admin design system."
  exit 5
}

mapfile -t pages < <(python - <<'PY'
from pathlib import Path
root=Path('.')
for path in sorted(root.glob('admin-*.html')):
    body=path.read_text(encoding='utf-8',errors='ignore')
    if 'AdminShell.boot' in body:
        print('/'+path.name)
PY
)

[[ ${#pages[@]} -gt 0 ]] || { echo "::error::${LABEL}: no protected AdminShell pages discovered."; exit 6; }

checked=0
for route in "${pages[@]}"; do
  out="/tmp/rosie-admin-${checked}.html"
  code=$(curl_code "$out" "${BASE_URL}${route}")
  if [[ "$code" == "404" || "$code" =~ ^5 ]]; then
    echo "::error::${LABEL}: protected route ${route} returned HTTP ${code}."
    exit 7
  fi
  if ! grep -qi '<html' "$out"; then
    echo "::error::${LABEL}: protected route ${route} did not return HTML."
    exit 8
  fi
  checked=$((checked+1))
done

echo "${LABEL}: protected Admin HTTP smoke PASS (${checked} AdminShell routes + shared shell/CSS assets)."
