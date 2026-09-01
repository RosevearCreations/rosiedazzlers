#!/usr/bin/env bash
set -euo pipefail
BASE_URL="${1:-https://dev.rosiedazzlers.pages.dev}"
LABEL="${2:-Build 289 runtime}"
tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT
fetch(){ local path="$1" out="$2"; curl -fsS --retry 2 --retry-delay 1 "$BASE_URL$path" -o "$out"; }

fetch "/assets/account-resilience-v289.js" "$tmp/resilience.js"
grep -Fq "build289AccountResilience" "$tmp/resilience.js"
grep -Fq "ClientAuth.signIn" "$tmp/resilience.js"
grep -Fq "Retry account load" "$tmp/resilience.js"
grep -Fq "aria-live" "$tmp/resilience.js"
if grep -Fq "setInterval" "$tmp/resilience.js"; then echo "$LABEL: background polling introduced"; exit 31; fi

fetch "/assets/account-accessibility-v289.css" "$tmp/accessibility.css"
grep -Fq ":focus-visible" "$tmp/accessibility.css"
grep -Fq "var(--accent)" "$tmp/accessibility.css"

fetch "/assets/client-auth.js" "$tmp/client-auth.js"
grep -Fq "/assets/account-resilience-v289.js" "$tmp/client-auth.js"
grep -Fq "/assets/customer-privacy-v288.js" "$tmp/client-auth.js"

fetch "/my-account/" "$tmp/account.html"
grep -Fq 'name="viewport"' "$tmp/account.html"
grep -Fq '<h1>My Account</h1>' "$tmp/account.html"
grep -Fq '/assets/client-auth.js' "$tmp/account.html"

status=$(curl -sS -o "$tmp/dashboard.json" -w '%{http_code}' "$BASE_URL/api/client/dashboard")
[[ "$status" == "200" ]] || { echo "$LABEL: signed-out dashboard expected 200, got $status"; exit 32; }
grep -Fq '"authenticated":false' "$tmp/dashboard.json"
grep -Fq '"code":"not_authenticated"' "$tmp/dashboard.json"
if grep -Fq 'admin_private_notes' "$tmp/dashboard.json"; then echo "$LABEL: signed-out dashboard exposed staff-private field"; exit 33; fi

status=$(curl -sS -o "$tmp/auth-me.json" -w '%{http_code}' "$BASE_URL/api/client/auth_me")
[[ "$status" == "200" ]] || { echo "$LABEL: auth_me expected signed-out 200, got $status"; exit 34; }
grep -Fq '"authenticated":false' "$tmp/auth-me.json"

echo "$LABEL: PASS"
