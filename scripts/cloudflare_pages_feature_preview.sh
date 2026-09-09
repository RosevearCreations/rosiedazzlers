#!/usr/bin/env bash
set -euo pipefail

# Durable Cloudflare Pages feature-branch preview acceptance helper.
# Read-only: verifies the exact GitHub SHA/branch reached a successful preview
# deployment with Functions enabled, then smokes the immutable deployment URL.

CF_PROJECT_NAME="${CF_PROJECT_NAME:-rosiedazzlers}"
CF_FEATURE_BRANCH="${CF_FEATURE_BRANCH:-${GITHUB_REF_NAME:-}}"
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

[[ -n "${CLOUDFLARE_API_TOKEN:-}" ]] || fail "ROSIEDAZZLERS_TOKEN is unavailable." 2
[[ -n "$TARGET_SHA" ]] || fail "Exact feature target SHA is required." 3
[[ -n "$CF_FEATURE_BRANCH" ]] || fail "Feature branch name is required." 4
[[ "$CF_FEATURE_BRANCH" != "main" && "$CF_FEATURE_BRANCH" != "dev" ]] || fail "Feature-preview helper refuses main/dev." 5
if [[ -n "${GITHUB_ACTIONS:-}" ]]; then echo "::add-mask::${CLOUDFLARE_API_TOKEN}"; fi

cf_curl() {
  curl --fail-with-body --silent --show-error \
    --header "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
    --header "Content-Type: application/json" "$@"
}

cf_curl "https://api.cloudflare.com/client/v4/user/tokens/verify" > "$TMP_DIR/token.json"
jq -e '.success == true and (.result.status // "") == "active"' "$TMP_DIR/token.json" >/dev/null \
  || fail "ROSIEDAZZLERS_TOKEN is not an active Cloudflare API token." 6
note "Cloudflare API token authority: PASS"

project_ok() {
  local candidate="$1" code
  code=$(curl --silent --show-error --output "$TMP_DIR/project.json" --write-out '%{http_code}' \
    --header "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
    --header "Content-Type: application/json" \
    "https://api.cloudflare.com/client/v4/accounts/${candidate}/pages/projects/${CF_PROJECT_NAME}" || true)
  [[ "$code" == "200" ]] && jq -e '.success == true' "$TMP_DIR/project.json" >/dev/null 2>&1
}

account_id="$CONFIGURED_ACCOUNT_ID"
if [[ -n "$account_id" ]]; then
  project_ok "$account_id" || fail "Configured CLOUDFLARE_ACCOUNT_ID cannot read Pages project ${CF_PROJECT_NAME}." 7
else
  cf_curl "https://api.cloudflare.com/client/v4/accounts?per_page=50" > "$TMP_DIR/accounts.json"
  jq -e '.success == true' "$TMP_DIR/accounts.json" >/dev/null || fail "Cloudflare account discovery failed." 8
  while IFS= read -r candidate; do
    [[ -z "$candidate" ]] && continue
    if project_ok "$candidate"; then account_id="$candidate"; break; fi
  done < <(jq -r '.result[]?.id' "$TMP_DIR/accounts.json")
fi
[[ -n "$account_id" ]] || fail "ROSIEDAZZLERS_TOKEN cannot discover/read Pages project ${CF_PROJECT_NAME}." 9
jq -e '.success == true and .result.source.type == "github"' "$TMP_DIR/project.json" >/dev/null \
  || fail "Rosie Pages project is not backed by the expected GitHub source authority." 10

production_branch=$(jq -r '.result.production_branch // .result.source.config.production_branch // empty' "$TMP_DIR/project.json")
[[ -n "$production_branch" ]] || fail "Pages production branch is unavailable." 11
[[ "$CF_FEATURE_BRANCH" != "$production_branch" ]] || fail "Feature preview branch resolves to the Production branch." 12

summary "### Cloudflare feature-preview authority"
summary "- Project: \`${CF_PROJECT_NAME}\`"
summary "- Feature branch: \`${CF_FEATURE_BRANCH}\`"
summary "- Production branch: \`${production_branch}\`"

exact_id=""
exact_status=""
for attempt in $(seq 1 30); do
  cf_curl "https://api.cloudflare.com/client/v4/accounts/${account_id}/pages/projects/${CF_PROJECT_NAME}/deployments?per_page=50" > "$TMP_DIR/deployments.json"
  jq -e '.success == true' "$TMP_DIR/deployments.json" >/dev/null || fail "Cloudflare deployment listing failed." 13
  exact_id=$(jq -r --arg sha "$TARGET_SHA" --arg branch "$CF_FEATURE_BRANCH" '
    [.result[]? | select(
      (.deployment_trigger.metadata.branch // "") == $branch and
      (.deployment_trigger.metadata.commit_hash // "") == $sha
    )][0].id // empty
  ' "$TMP_DIR/deployments.json")
  exact_status=$(jq -r --arg id "$exact_id" '.result[]? | select(.id == $id) | (.latest_stage.status // "unknown")' "$TMP_DIR/deployments.json" | head -n1)
  if [[ -n "$exact_id" ]]; then
    note "Exact feature deployment ${exact_id}: ${exact_status:-unknown} (attempt ${attempt}/30)."
    case "$exact_status" in
      success) break ;;
      failure|failed|canceled|cancelled) fail "Exact feature deployment reached terminal status ${exact_status}." 14 ;;
    esac
  else
    note "Exact feature SHA is not visible in Cloudflare Pages yet (attempt ${attempt}/30)."
  fi
  [[ "$attempt" -ge 30 ]] || sleep 10
done
[[ -n "$exact_id" ]] || fail "Cloudflare does not show exact feature commit ${TARGET_SHA} on ${CF_FEATURE_BRANCH}." 15
[[ "$exact_status" == "success" ]] || fail "Exact feature deployment did not become successful; last status ${exact_status:-unknown}." 16

cf_curl "https://api.cloudflare.com/client/v4/accounts/${account_id}/pages/projects/${CF_PROJECT_NAME}/deployments/${exact_id}" > "$TMP_DIR/exact.json"
jq -e '.success == true' "$TMP_DIR/exact.json" >/dev/null || fail "Cloudflare exact feature deployment lookup failed." 17
exact_sha=$(jq -r '.result.deployment_trigger.metadata.commit_hash // empty' "$TMP_DIR/exact.json")
exact_branch=$(jq -r '.result.deployment_trigger.metadata.branch // empty' "$TMP_DIR/exact.json")
exact_url=$(jq -r '.result.url // empty' "$TMP_DIR/exact.json")
exact_environment=$(jq -r '.result.environment // empty' "$TMP_DIR/exact.json")
exact_uses_functions=$(jq -r 'if .result.uses_functions == true then "true" elif .result.uses_functions == false then "false" else "unknown" end' "$TMP_DIR/exact.json")
exact_detail_status=$(jq -r '.result.latest_stage.status // "unknown"' "$TMP_DIR/exact.json")

[[ "$exact_sha" == "$TARGET_SHA" ]] || fail "Feature deployment SHA mismatch: ${exact_sha:-missing}." 18
[[ "$exact_branch" == "$CF_FEATURE_BRANCH" ]] || fail "Feature deployment branch mismatch: ${exact_branch:-missing}." 19
[[ "$exact_environment" == "preview" ]] || fail "Feature deployment is not a preview environment (${exact_environment:-missing})." 20
[[ "$exact_detail_status" == "success" ]] || fail "Feature deployment detail is not successful (${exact_detail_status})." 21
[[ "$exact_uses_functions" == "true" ]] || fail "Feature deployment does not report uses_functions=true (${exact_uses_functions})." 22
[[ -n "$exact_url" ]] || fail "Successful feature deployment has no immutable URL." 23

SMOKE_SCOPE=static bash scripts/development_http_smoke.sh "$exact_url" "Exact feature preview"
SMOKE_SCOPE=static bash scripts/contextual_proof_http_smoke.sh "$exact_url" "Exact feature preview"

summary "### Exact feature preview"
summary "- GitHub SHA: \`${TARGET_SHA}\`"
summary "- Cloudflare deployment: \`${exact_id}\`"
summary "- Deployment status: \`${exact_detail_status}\`"
summary "- Environment: \`${exact_environment}\`"
summary "- Functions: \`${exact_uses_functions}\`"
summary "- Immutable URL: ${exact_url}"
summary "- Static application/service/location/sitemap/contextual-proof smoke: PASS"
note "Cloudflare exact feature preview acceptance: PASS"
