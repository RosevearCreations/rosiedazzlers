#!/usr/bin/env bash
set -euo pipefail

# Build 377 — read-only Cloudflare Pages Production exact-SHA acceptance.
# This helper observes the Git-backed Production deployment only. It cannot
# deploy, retry, delete, roll back, move Git refs, or mutate business data.

CF_PROJECT_NAME="${CF_PROJECT_NAME:-rosiedazzlers}"
CF_PRODUCTION_BRANCH="${CF_PRODUCTION_BRANCH:-main}"
CF_PRODUCTION_URL="${CF_PRODUCTION_URL:-https://rosiedazzlers.ca}"
TARGET_SHA="${TARGET_SHA:-${GITHUB_SHA:-}}"
CONFIGURED_ACCOUNT_ID="${CONFIGURED_ACCOUNT_ID:-${CLOUDFLARE_ACCOUNT_ID:-}}"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

fail() {
  local message="$1" code="${2:-1}"
  echo "::error::${message}" >&2
  exit "$code"
}
note() { echo "$*"; }
summary() { if [[ -n "${GITHUB_STEP_SUMMARY:-}" ]]; then printf '%s\n' "$*" >> "$GITHUB_STEP_SUMMARY"; fi; }

require_common() {
  [[ -n "${CLOUDFLARE_API_TOKEN:-}" ]] || fail "ROSIEDAZZLERS_TOKEN is unavailable." 2
  [[ "$TARGET_SHA" =~ ^[0-9a-f]{40}$ ]] || fail "An exact 40-character Production target SHA is required." 3
  [[ "$CF_PRODUCTION_BRANCH" == "main" ]] || fail "Production acceptance is restricted to branch 'main' (got '$CF_PRODUCTION_BRANCH')." 4
  if [[ -n "${GITHUB_ACTIONS:-}" ]]; then echo "::add-mask::${CLOUDFLARE_API_TOKEN}"; fi
}

cf_get() {
  curl --fail-with-body --silent --show-error \
    --header "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
    --header "Content-Type: application/json" "$1"
}

verify_token() {
  cf_get "https://api.cloudflare.com/client/v4/user/tokens/verify" > "$TMP_DIR/token.json"
  jq -e '.success == true and (.result.status // "") == "active"' "$TMP_DIR/token.json" >/dev/null \
    || fail "ROSIEDAZZLERS_TOKEN is not an active Cloudflare API token." 5
  note "Cloudflare API token authority: PASS"
}

project_ok() {
  local candidate="$1" code
  code=$(curl --silent --show-error --output "$TMP_DIR/project.json" --write-out '%{http_code}' \
    --header "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
    --header "Content-Type: application/json" \
    "https://api.cloudflare.com/client/v4/accounts/${candidate}/pages/projects/${CF_PROJECT_NAME}" || true)
  [[ "$code" == "200" ]] && jq -e '.success == true' "$TMP_DIR/project.json" >/dev/null 2>&1
}

resolve_project() {
  local account_id="$CONFIGURED_ACCOUNT_ID" candidate
  if [[ -n "$account_id" ]]; then
    project_ok "$account_id" || fail "Configured CLOUDFLARE_ACCOUNT_ID cannot read Pages project ${CF_PROJECT_NAME}." 6
  else
    cf_get "https://api.cloudflare.com/client/v4/accounts?per_page=50" > "$TMP_DIR/accounts.json"
    jq -e '.success == true' "$TMP_DIR/accounts.json" >/dev/null || fail "Cloudflare account discovery failed." 7
    while IFS= read -r candidate; do
      [[ -z "$candidate" ]] && continue
      if project_ok "$candidate"; then account_id="$candidate"; break; fi
    done < <(jq -r '.result[]?.id' "$TMP_DIR/accounts.json")
  fi
  [[ -n "$account_id" ]] || fail "ROSIEDAZZLERS_TOKEN cannot discover/read Pages project ${CF_PROJECT_NAME}." 8
  jq -e '.success == true and .result.source.type == "github"' "$TMP_DIR/project.json" >/dev/null \
    || fail "Rosie Pages project is not backed by the expected GitHub source authority." 9

  CF_ACCOUNT_ID="$account_id"
  local configured_production_branch
  configured_production_branch=$(jq -r '.result.production_branch // .result.source.config.production_branch // empty' "$TMP_DIR/project.json")
  [[ "$configured_production_branch" == "$CF_PRODUCTION_BRANCH" ]] \
    || fail "Cloudflare Production branch is '${configured_production_branch:-missing}', expected '${CF_PRODUCTION_BRANCH}'." 10
  note "Cloudflare project authority: PASS; Production=${CF_PRODUCTION_BRANCH}."
}

list_deployments() {
  cf_get "https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/pages/projects/${CF_PROJECT_NAME}/deployments?per_page=25" > "$TMP_DIR/deployments.json"
  jq -e '.success == true' "$TMP_DIR/deployments.json" >/dev/null || fail "Cloudflare deployment listing failed." 11
}

find_exact() {
  list_deployments
  EXACT_ID=$(jq -r --arg sha "$TARGET_SHA" --arg branch "$CF_PRODUCTION_BRANCH" '
    [.result[]? | select(
      (.deployment_trigger.metadata.branch // "") == $branch and
      (.deployment_trigger.metadata.commit_hash // "") == $sha
    )][0].id // empty
  ' "$TMP_DIR/deployments.json")
  EXACT_STATUS=$(jq -r --arg id "$EXACT_ID" '.result[]? | select(.id == $id) | (.latest_stage.status // "unknown")' "$TMP_DIR/deployments.json" | head -n1)
}

fetch_exact() {
  cf_get "https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/pages/projects/${CF_PROJECT_NAME}/deployments/${EXACT_ID}" > "$TMP_DIR/exact.json"
  jq -e '.success == true' "$TMP_DIR/exact.json" >/dev/null || fail "Cloudflare exact Production deployment lookup failed." 12
  EXACT_STATUS=$(jq -r '.result.latest_stage.status // "unknown"' "$TMP_DIR/exact.json")
  EXACT_URL=$(jq -r '.result.url // empty' "$TMP_DIR/exact.json")
  EXACT_SHA=$(jq -r '.result.deployment_trigger.metadata.commit_hash // empty' "$TMP_DIR/exact.json")
  EXACT_BRANCH=$(jq -r '.result.deployment_trigger.metadata.branch // empty' "$TMP_DIR/exact.json")
  EXACT_ENVIRONMENT=$(jq -r '.result.environment // empty' "$TMP_DIR/exact.json")
  EXACT_USES_FUNCTIONS=$(jq -r 'if .result.uses_functions == true then "true" elif .result.uses_functions == false then "false" else "unknown" end' "$TMP_DIR/exact.json")
}

wait_for_exact_success() {
  local attempts="${1:-24}" sleep_seconds="${2:-10}" attempt ready=false
  EXACT_ID=""; EXACT_STATUS=""
  for attempt in $(seq 1 "$attempts"); do
    find_exact
    if [[ -n "$EXACT_ID" ]]; then
      note "Exact Production deployment ${EXACT_ID}: ${EXACT_STATUS:-unknown} (attempt ${attempt}/${attempts})."
      case "$EXACT_STATUS" in
        success) ready=true; break ;;
        failure|failed|canceled|cancelled) fail "Exact Production deployment ${EXACT_ID} reached terminal status ${EXACT_STATUS}." 13 ;;
      esac
    else
      note "Exact Production SHA is not visible in Cloudflare Pages yet (attempt ${attempt}/${attempts})."
    fi
    [[ "$attempt" -ge "$attempts" ]] || sleep "$sleep_seconds"
  done
  [[ "$ready" == "true" ]] || fail "Exact Production deployment for ${TARGET_SHA} did not become successful." 14

  fetch_exact
  [[ "$EXACT_STATUS" == "success" ]] || fail "Exact Production deployment detail is not successful (${EXACT_STATUS})." 15
  [[ "$EXACT_SHA" == "$TARGET_SHA" ]] || fail "Exact Production deployment SHA mismatch: ${EXACT_SHA:-missing}." 16
  [[ "$EXACT_BRANCH" == "$CF_PRODUCTION_BRANCH" ]] || fail "Exact Production branch mismatch: ${EXACT_BRANCH:-missing}." 17
  [[ "$EXACT_ENVIRONMENT" == "production" ]] || fail "Exact deployment is not Production (${EXACT_ENVIRONMENT:-missing})." 18
  [[ "$EXACT_USES_FUNCTIONS" == "true" ]] || fail "Production deployment does not report uses_functions=true (${EXACT_USES_FUNCTIONS})." 19
  [[ -n "$EXACT_URL" ]] || fail "Successful Production deployment has no immutable URL." 20

  summary "### Exact Production deployment"
  summary "- GitHub SHA: \`${TARGET_SHA}\`"
  summary "- Cloudflare deployment: \`${EXACT_ID}\`"
  summary "- Deployment branch/environment: \`${EXACT_BRANCH}\` / \`${EXACT_ENVIRONMENT}\`"
  summary "- Deployment reports Functions: \`${EXACT_USES_FUNCTIONS}\`"
  summary "- Immutable deployment URL: ${EXACT_URL}"
}

smoke_exact() {
  SMOKE_SCOPE=static bash scripts/development_http_smoke.sh "$EXACT_URL" "Exact Production deployment"
  SMOKE_SCOPE=static bash scripts/contextual_proof_http_smoke.sh "$EXACT_URL" "Exact Production deployment"
  summary "- Immutable Production static/contextual smoke: PASS"
}

smoke_production_alias() {
  local attempt alias_ready=false
  for attempt in $(seq 1 12); do
    note "Checking Production alias convergence (attempt ${attempt}/12)."
    if SMOKE_RETRY_MODE=1 SMOKE_SCOPE=full bash scripts/development_http_smoke.sh "$CF_PRODUCTION_URL" "Production alias attempt ${attempt}/12"; then
      alias_ready=true
      break
    fi
    [[ "$attempt" -ge 12 ]] || sleep 5
  done
  [[ "$alias_ready" == "true" ]] || fail "Production alias did not converge to an accepted runtime within 12 attempts." 21
  SMOKE_SCOPE=full bash scripts/contextual_proof_http_smoke.sh "$CF_PRODUCTION_URL" "Production alias contextual proof"
  summary "### Production runtime smoke"
  summary "- Canonical Production URL: ${CF_PRODUCTION_URL}"
  summary "- Full public/protected-boundary runtime smoke: PASS"
  summary "- Contextual proof smoke: PASS"
}

main() {
  require_common
  verify_token
  resolve_project
  wait_for_exact_success
  smoke_exact
  smoke_production_alias
  note "PRODUCTION EXACT-SHA ACCEPTANCE: PASS"
  note "- exact GitHub SHA matches successful Cloudflare Production deployment"
  note "- Production environment and Functions metadata are explicit"
  note "- immutable deployment and canonical Production runtime smoke passed"
  note "- mutation performed: none"
}

main "$@"
