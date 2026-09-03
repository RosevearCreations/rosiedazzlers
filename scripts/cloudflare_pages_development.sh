#!/usr/bin/env bash
set -euo pipefail

# Build 308 — canonical Cloudflare Pages Development acceptance/recovery helper.
# Normal acceptance is read-only. Recovery mutation is manual-only and requires
# an exact SHA confirmation plus proof that the target is a Development preview.

COMMAND="${1:-}"
CF_PROJECT_NAME="${CF_PROJECT_NAME:-rosiedazzlers}"
CF_DEV_BRANCH="${CF_DEV_BRANCH:-${CF_BRANCH:-dev}}"
CF_DEV_URL="${CF_DEV_URL:-https://dev.rosiedazzlers.pages.dev}"
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
  [[ -n "$TARGET_SHA" ]] || fail "Exact Development target SHA is required." 3
  [[ "$CF_DEV_BRANCH" == "dev" ]] || fail "This helper is restricted to the Rosie Development branch 'dev' (got '$CF_DEV_BRANCH')." 4
  if [[ -n "${GITHUB_ACTIONS:-}" ]]; then echo "::add-mask::${CLOUDFLARE_API_TOKEN}"; fi
}

cf_curl() {
  curl --fail-with-body --silent --show-error \
    --header "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
    --header "Content-Type: application/json" "$@"
}

verify_token() {
  cf_curl "https://api.cloudflare.com/client/v4/user/tokens/verify" > "$TMP_DIR/token.json"
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
    cf_curl "https://api.cloudflare.com/client/v4/accounts?per_page=50" > "$TMP_DIR/accounts.json"
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
  CF_PRODUCTION_BRANCH=$(jq -r '.result.production_branch // .result.source.config.production_branch // empty' "$TMP_DIR/project.json")
  CF_SUBDOMAIN=$(jq -r '.result.subdomain // empty' "$TMP_DIR/project.json")
  [[ -n "$CF_PRODUCTION_BRANCH" ]] || fail "Pages production branch is unavailable." 10
  [[ "$CF_DEV_BRANCH" != "$CF_PRODUCTION_BRANCH" ]] || fail "Development helper refuses to operate on the Production branch." 11

  summary "### Cloudflare project authority"
  summary "- Project: \`${CF_PROJECT_NAME}\`"
  summary "- Development branch: \`${CF_DEV_BRANCH}\`"
  summary "- Production branch: \`${CF_PRODUCTION_BRANCH}\`"
  summary "- Pages subdomain: \`${CF_SUBDOMAIN:-unknown}\`"
  note "Cloudflare project authority: PASS; Development=${CF_DEV_BRANCH}; Production=${CF_PRODUCTION_BRANCH}."
}

list_deployments() {
  cf_curl "https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/pages/projects/${CF_PROJECT_NAME}/deployments?per_page=25" > "$TMP_DIR/deployments.json"
  jq -e '.success == true' "$TMP_DIR/deployments.json" >/dev/null || fail "Cloudflare deployment listing failed." 12
}

find_exact() {
  list_deployments
  EXACT_ID=$(jq -r --arg sha "$TARGET_SHA" --arg branch "$CF_DEV_BRANCH" '
    [.result[]? | select(
      (.deployment_trigger.metadata.branch // "") == $branch and
      (.deployment_trigger.metadata.commit_hash // "") == $sha
    )][0].id // empty
  ' "$TMP_DIR/deployments.json")
  EXACT_STATUS=$(jq -r --arg id "$EXACT_ID" '.result[]? | select(.id == $id) | (.latest_stage.status // "unknown")' "$TMP_DIR/deployments.json" | head -n1)
}

fetch_exact_by_id() {
  local deployment_id="$1"
  cf_curl "https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/pages/projects/${CF_PROJECT_NAME}/deployments/${deployment_id}" > "$TMP_DIR/exact.json"
  jq -e '.success == true' "$TMP_DIR/exact.json" >/dev/null || fail "Cloudflare exact deployment lookup failed." 13
  EXACT_ID=$(jq -r '.result.id // empty' "$TMP_DIR/exact.json")
  EXACT_STATUS=$(jq -r '.result.latest_stage.status // "unknown"' "$TMP_DIR/exact.json")
  EXACT_URL=$(jq -r '.result.url // empty' "$TMP_DIR/exact.json")
  EXACT_SHA=$(jq -r '.result.deployment_trigger.metadata.commit_hash // empty' "$TMP_DIR/exact.json")
  EXACT_BRANCH=$(jq -r '.result.deployment_trigger.metadata.branch // empty' "$TMP_DIR/exact.json")
  EXACT_ENVIRONMENT=$(jq -r '.result.environment // empty' "$TMP_DIR/exact.json")
  EXACT_USES_FUNCTIONS=$(jq -r 'if .result.uses_functions == true then "true" elif .result.uses_functions == false then "false" else "unknown" end' "$TMP_DIR/exact.json")
}

validate_exact_identity() {
  [[ "$EXACT_SHA" == "$TARGET_SHA" ]] || fail "Exact deployment SHA mismatch: ${EXACT_SHA:-missing}." 14
  [[ "$EXACT_BRANCH" == "$CF_DEV_BRANCH" ]] || fail "Exact deployment branch mismatch: ${EXACT_BRANCH:-missing}." 15
  [[ -n "$EXACT_URL" ]] || fail "Successful Development deployment has no immutable URL." 16
  [[ "$EXACT_USES_FUNCTIONS" == "true" ]] || fail "Development deployment does not report uses_functions=true (${EXACT_USES_FUNCTIONS})." 17
}

wait_for_exact_detail_success() {
  local deployment_id="$1" attempts="${2:-12}" sleep_seconds="${3:-2}" attempt ready=false
  for attempt in $(seq 1 "$attempts"); do
    fetch_exact_by_id "$deployment_id"
    [[ "$EXACT_ID" == "$deployment_id" ]] || fail "Cloudflare detail lookup changed deployment identity from ${deployment_id} to ${EXACT_ID:-missing}." 42
    [[ "$EXACT_SHA" == "$TARGET_SHA" ]] || fail "Exact deployment SHA mismatch during detail consistency wait: ${EXACT_SHA:-missing}." 43
    [[ "$EXACT_BRANCH" == "$CF_DEV_BRANCH" ]] || fail "Exact deployment branch mismatch during detail consistency wait: ${EXACT_BRANCH:-missing}." 44
    note "Exact deployment detail metadata ${deployment_id}: ${EXACT_STATUS:-unknown} (consistency attempt ${attempt}/${attempts})."
    case "$EXACT_STATUS" in
      success) ready=true; break ;;
      failure|failed|canceled|cancelled) fail "Exact Development deployment detail reached terminal status ${EXACT_STATUS}." 45 ;;
    esac
    [[ "$attempt" -ge "$attempts" ]] || sleep "$sleep_seconds"
  done
  [[ "$ready" == "true" ]] || fail "Cloudflare deployment list reported success, but exact deployment detail did not converge to success within ${attempts} attempts; last status was ${EXACT_STATUS:-unknown}." 46
  validate_exact_identity
}

wait_for_exact_success() {
  local attempts="${1:-24}" sleep_seconds="${2:-10}" attempt ready=false
  EXACT_ID=""; EXACT_STATUS=""
  for attempt in $(seq 1 "$attempts"); do
    find_exact
    if [[ -n "$EXACT_ID" ]]; then
      note "Exact dev deployment ${EXACT_ID}: ${EXACT_STATUS:-unknown} (attempt ${attempt}/${attempts})."
      case "$EXACT_STATUS" in
        success) ready=true; break ;;
        failure|failed|canceled|cancelled) fail "Exact Development deployment ${EXACT_ID} reached terminal status ${EXACT_STATUS}." 18 ;;
      esac
    else
      note "Exact dev SHA is not visible in Cloudflare Pages yet (attempt ${attempt}/${attempts})."
    fi
    [[ "$attempt" -ge "$attempts" ]] || sleep "$sleep_seconds"
  done
  if [[ "$ready" != "true" ]]; then
    if [[ -z "$EXACT_ID" ]]; then
      local latest_sha latest_url latest_env
      latest_sha=$(jq -r --arg branch "$CF_DEV_BRANCH" '[.result[]? | select((.deployment_trigger.metadata.branch // "") == $branch)][0].deployment_trigger.metadata.commit_hash // "none"' "$TMP_DIR/deployments.json")
      latest_url=$(jq -r --arg branch "$CF_DEV_BRANCH" '[.result[]? | select((.deployment_trigger.metadata.branch // "") == $branch)][0].url // "none"' "$TMP_DIR/deployments.json")
      latest_env=$(jq -r --arg branch "$CF_DEV_BRANCH" '[.result[]? | select((.deployment_trigger.metadata.branch // "") == $branch)][0].environment // "none"' "$TMP_DIR/deployments.json")
      fail "Cloudflare does not show exact dev commit ${TARGET_SHA}. Latest visible dev deployment is ${latest_sha} (${latest_env}) at ${latest_url}." 19
    fi
    fail "Exact Development deployment ${EXACT_ID} was found but did not become successful; last status was ${EXACT_STATUS}." 20
  fi
  wait_for_exact_detail_success "$EXACT_ID" 12 2

  summary "### Exact Development deployment"
  summary "- GitHub SHA: \`${TARGET_SHA}\`"
  summary "- Cloudflare deployment: \`${EXACT_ID}\`"
  summary "- Deployment status: \`${EXACT_STATUS}\`"
  summary "- Deployment reports Functions: \`${EXACT_USES_FUNCTIONS}\`"
  summary "- Deployment URL: ${EXACT_URL}"
}

smoke_exact() {
  SMOKE_SCOPE=static bash scripts/development_http_smoke.sh "$EXACT_URL" "Exact Development deployment"
  SMOKE_SCOPE=static bash scripts/build284_http_smoke.sh "$EXACT_URL" "Exact Development deployment"
  summary "### Exact deployment smoke"
  summary "- Immutable deployment URL: ${EXACT_URL}"
  summary "- Cloudflare deployment metadata uses_functions=true: PASS"
  summary "- Static application/service/location/sitemap identity: PASS"
}

smoke_alias() {
  local attempt alias_ready=false
  for attempt in $(seq 1 12); do
    note "Checking Development branch alias convergence (attempt ${attempt}/12)."
    if SMOKE_RETRY_MODE=1 SMOKE_SCOPE=full bash scripts/development_http_smoke.sh "$CF_DEV_URL" "Development alias attempt ${attempt}/12"; then
      alias_ready=true
      note "Development branch alias converged on attempt ${attempt}/12."
      break
    fi
    [[ "$attempt" -ge 12 ]] || sleep 5
  done
  [[ "$alias_ready" == "true" ]] || fail "Development branch alias did not converge to the accepted deployment within 12 attempts." 22
  SMOKE_SCOPE=full bash scripts/build284_http_smoke.sh "$CF_DEV_URL" "Development alias contextual proof"
  summary "### Development alias smoke"
  summary "- Alias: ${CF_DEV_URL}"
  summary "- Bounded retry: 12 attempts × 5 seconds maximum spacing"
  summary "- Full static + dynamic/API runtime smoke: PASS"
}

record_production_boundary() {
  git fetch --no-tags origin main dev >/dev/null
  local dev_sha main_sha merge_base dev_ahead main_ahead
  dev_sha=$(git rev-parse origin/dev)
  main_sha=$(git rev-parse origin/main)
  merge_base=$(git merge-base origin/main origin/dev)
  dev_ahead=$(git rev-list --count origin/main..origin/dev)
  main_ahead=$(git rev-list --count origin/dev..origin/main)
  [[ "$dev_sha" == "$TARGET_SHA" ]] || fail "Development moved during acceptance. Expected ${TARGET_SHA}, current origin/dev is ${dev_sha}." 23
  summary "### Production promotion boundary"
  summary "- Accepted Development SHA: \`${dev_sha}\`"
  summary "- Current Production/main SHA: \`${main_sha}\`"
  summary "- Merge base: \`${merge_base}\`"
  summary "- dev-only commits vs main: \`${dev_ahead}\`"
  summary "- main-only commits vs dev: \`${main_ahead}\`"
  summary "- Status: **Development evidence only — Production remains closed.**"
  summary "- Promotion rule: reconcile/merge the accepted dev tree deliberately; never force-move main to dev."
}

observe_recovery_target() {
  local attempt
  EXACT_ID=""; EXACT_STATUS=""
  for attempt in $(seq 1 9); do
    find_exact
    if [[ -n "$EXACT_ID" ]]; then
      note "Recovery observation ${EXACT_ID}: ${EXACT_STATUS:-unknown} (attempt ${attempt}/9)."
      case "$EXACT_STATUS" in
        success) wait_for_exact_detail_success "$EXACT_ID" 12 2; return 0 ;;
        failure|failed|canceled|cancelled) fail "Exact Development deployment reached terminal ${EXACT_STATUS}; automatic deletion/retry is refused." 24 ;;
      esac
    fi
    [[ "$attempt" -ge 9 ]] || sleep 10
  done
  [[ -n "$EXACT_ID" ]] || fail "Exact Development SHA never appeared in Pages; recovery will not invent a deployment target." 25
  fetch_exact_by_id "$EXACT_ID"
  [[ "$EXACT_SHA" == "$TARGET_SHA" && "$EXACT_BRANCH" == "$CF_DEV_BRANCH" ]] || fail "Recovery target identity mismatch." 26
  [[ "$EXACT_ENVIRONMENT" == "preview" ]] || fail "Recovery target is not a preview deployment; refusing mutation." 27
}

require_manual_recovery_confirmation() {
  [[ "${RECOVERY_ACTION:-observe}" == "repair" ]] || return 1
  [[ -n "${RECOVERY_CONFIRM_SHA:-}" ]] || fail "Repair requires RECOVERY_CONFIRM_SHA." 28
  [[ "$RECOVERY_CONFIRM_SHA" == "$TARGET_SHA" ]] || fail "Recovery confirmation SHA does not match the exact target." 29
  [[ "${GITHUB_REF_NAME:-$CF_DEV_BRANCH}" == "$CF_DEV_BRANCH" ]] || fail "Recovery may run only from the Development branch ref." 30
  [[ "$CF_DEV_BRANCH" != "$CF_PRODUCTION_BRANCH" ]] || fail "Recovery may not mutate a Production branch deployment." 31
  return 0
}

delete_stuck_preview() {
  fetch_exact_by_id "$EXACT_ID"
  [[ "$EXACT_ENVIRONMENT" == "preview" ]] || fail "Refusing to delete a non-preview deployment." 32
  [[ "$EXACT_SHA" == "$TARGET_SHA" && "$EXACT_BRANCH" == "$CF_DEV_BRANCH" ]] || fail "Refusing to delete a deployment that is not the exact Development target." 33
  case "$EXACT_STATUS" in success|failure|failed|canceled|cancelled) fail "Refusing to delete terminal deployment status ${EXACT_STATUS}." 34 ;; esac

  local log_code log_count delete_code delete_error
  log_code=$(curl --silent --show-error --output "$TMP_DIR/history.json" --write-out '%{http_code}' \
    --header "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
    "https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/pages/projects/${CF_PROJECT_NAME}/deployments/${EXACT_ID}/history/logs" || true)
  log_count=$(jq -r '.result.total // (.result.data | length) // 0' "$TMP_DIR/history.json" 2>/dev/null || echo 0)
  note "Stuck preview diagnostics: history HTTP=${log_code}; log lines=${log_count}."

  delete_code=$(curl --silent --show-error --output "$TMP_DIR/delete.json" --write-out '%{http_code}' --request DELETE \
    --header "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
    "https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/pages/projects/${CF_PROJECT_NAME}/deployments/${EXACT_ID}?force=true" || true)
  case "$delete_code" in 200|202|204) ;; *)
    delete_error=$(jq -r '.errors[0].message // .messages[0].message // empty' "$TMP_DIR/delete.json" 2>/dev/null || true)
    fail "Cloudflare refused deletion of stuck Development preview: HTTP ${delete_code}${delete_error:+: ${delete_error}}." 35
  esac
  note "Stuck Development preview ${EXACT_ID} removed after exact manual confirmation."
}

recreate_exact() {
  local create_code create_error new_id new_sha new_branch
  create_code=$(curl --silent --show-error --output "$TMP_DIR/create.json" --write-out '%{http_code}' --request POST \
    --header "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
    "https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/pages/projects/${CF_PROJECT_NAME}/deployments" \
    -F "branch=${CF_DEV_BRANCH}" \
    -F 'commit_dirty=false' \
    -F "commit_hash=${TARGET_SHA}" \
    -F "commit_message=RosieDazzlers exact-SHA recovery ${TARGET_SHA}" || true)
  if [[ "$create_code" != "200" ]] || ! jq -e '.success == true and (.result.id // "") != ""' "$TMP_DIR/create.json" >/dev/null 2>&1; then
    create_error=$(jq -r '.errors[0].message // .messages[0].message // empty' "$TMP_DIR/create.json" 2>/dev/null || true)
    fail "Cloudflare exact-SHA recreate returned HTTP ${create_code}${create_error:+: ${create_error}}." 36
  fi
  new_id=$(jq -r '.result.id' "$TMP_DIR/create.json")
  new_sha=$(jq -r '.result.deployment_trigger.metadata.commit_hash // empty' "$TMP_DIR/create.json")
  new_branch=$(jq -r '.result.deployment_trigger.metadata.branch // empty' "$TMP_DIR/create.json")
  [[ "$new_sha" == "$TARGET_SHA" ]] || fail "Recreated deployment SHA mismatch: ${new_sha}." 37
  [[ "$new_branch" == "$CF_DEV_BRANCH" ]] || fail "Recreated deployment branch mismatch: ${new_branch}." 38
  EXACT_ID="$new_id"
  note "Exact Development deployment recreated as ${new_id}."
}

wait_recreated_id() {
  local deployment_id="$EXACT_ID" attempt ready=false
  for attempt in $(seq 1 30); do
    fetch_exact_by_id "$deployment_id"
    note "Recovered deployment ${deployment_id}: ${EXACT_STATUS} (attempt ${attempt}/30)."
    [[ "$EXACT_SHA" == "$TARGET_SHA" && "$EXACT_BRANCH" == "$CF_DEV_BRANCH" ]] || fail "Recovered deployment identity changed." 39
    case "$EXACT_STATUS" in success) ready=true; break ;; failure|failed|canceled|cancelled) fail "Recovered deployment reached ${EXACT_STATUS}." 40 ;; esac
    [[ "$attempt" -ge 30 ]] || sleep 10
  done
  [[ "$ready" == "true" ]] || fail "Recovered exact Development deployment did not reach success." 41
  validate_exact_identity
}

accept_command() {
  require_common
  verify_token
  resolve_project
  wait_for_exact_success 24 10
  smoke_exact
  smoke_alias
  record_production_boundary
  note "Cloudflare Development exact-SHA acceptance: PASS"
}

recover_command() {
  require_common
  verify_token
  resolve_project
  observe_recovery_target
  if [[ "$EXACT_STATUS" == "success" ]]; then
    smoke_exact
    note "Exact Development deployment is already successful; recovery mutation was unnecessary."
    return 0
  fi
  if ! require_manual_recovery_confirmation; then
    note "Recovery observation only: exact Development deployment ${EXACT_ID} remains ${EXACT_STATUS}. No mutation performed."
    summary "### Recovery observation"
    summary "- Target SHA: \`${TARGET_SHA}\`"
    summary "- Deployment: \`${EXACT_ID}\`"
    summary "- Status: \`${EXACT_STATUS}\`"
    summary "- Action: observation only — no mutation"
    return 0
  fi
  delete_stuck_preview
  recreate_exact
  wait_recreated_id
  smoke_exact
  smoke_alias
  record_production_boundary
  summary "### Manual Development recovery"
  summary "- Exact SHA confirmation: PASS"
  summary "- Production branch exclusion: PASS"
  summary "- Exact preview-only target: PASS"
  summary "- Recreated exact deployment smoke: PASS"
  note "Cloudflare Development exact-SHA manual recovery: PASS"
}

case "$COMMAND" in
  accept) accept_command ;;
  recover) recover_command ;;
  *) echo "Usage: $0 {accept|recover}" >&2; exit 64 ;;
esac
