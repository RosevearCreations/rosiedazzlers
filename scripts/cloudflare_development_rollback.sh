#!/usr/bin/env bash
set -euo pipefail

# Build 322 — read-only Development rollback candidate verifier.
# This script never moves Git refs and never mutates Cloudflare. It proves that a
# prior dev SHA is a real ancestor with a successful immutable Pages preview that
# can be smoke-tested before any future human-authorized rollback decision.

ROLLBACK_SHA="${ROLLBACK_SHA:-${1:-}}"
CF_PROJECT_NAME="${CF_PROJECT_NAME:-rosiedazzlers}"
CF_DEV_BRANCH="${CF_DEV_BRANCH:-dev}"
CURRENT_DEV_SHA="${CURRENT_DEV_SHA:-${GITHUB_SHA:-}}"
CONFIGURED_ACCOUNT_ID="${CONFIGURED_ACCOUNT_ID:-${CLOUDFLARE_ACCOUNT_ID:-}}"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

fail(){ echo "::error::$1" >&2; exit "${2:-1}"; }
note(){ echo "$*"; }
summary(){ [[ -n "${GITHUB_STEP_SUMMARY:-}" ]] && printf '%s\n' "$*" >> "$GITHUB_STEP_SUMMARY" || true; }

[[ -n "$ROLLBACK_SHA" ]] || fail "ROLLBACK_SHA is required." 2
[[ "$ROLLBACK_SHA" =~ ^[0-9a-f]{40}$ ]] || fail "ROLLBACK_SHA must be a full 40-character commit SHA." 3
[[ "$CF_DEV_BRANCH" == "dev" ]] || fail "Rollback verification is restricted to the dev branch." 4
[[ -n "${CLOUDFLARE_API_TOKEN:-}" ]] || fail "ROSIEDAZZLERS_TOKEN is unavailable." 5
if [[ -n "${GITHUB_ACTIONS:-}" ]]; then echo "::add-mask::${CLOUDFLARE_API_TOKEN}"; fi

git fetch --no-tags origin dev main >/dev/null
DEV_SHA="$(git rev-parse origin/dev)"
MAIN_SHA="$(git rev-parse origin/main)"
[[ -z "$CURRENT_DEV_SHA" || "$CURRENT_DEV_SHA" == "$DEV_SHA" ]] || fail "Development moved during rollback verification. Expected ${CURRENT_DEV_SHA}, current origin/dev is ${DEV_SHA}." 6
git cat-file -e "${ROLLBACK_SHA}^{commit}" 2>/dev/null || fail "Rollback SHA is not present in repository history." 7
git merge-base --is-ancestor "$ROLLBACK_SHA" "$DEV_SHA" || fail "Rollback SHA is not an ancestor of current dev; refusing unrelated/divergent history." 8
[[ "$ROLLBACK_SHA" != "$DEV_SHA" ]] || fail "Rollback SHA equals current dev; choose a prior accepted candidate." 9
if git merge-base --is-ancestor "$DEV_SHA" "$ROLLBACK_SHA" 2>/dev/null; then fail "Rollback SHA is not older than current dev." 10; fi

cf_get(){
  curl --fail-with-body --silent --show-error \
    --header "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
    --header "Content-Type: application/json" "$@"
}
project_ok(){
  local account="$1" code
  code=$(curl --silent --show-error --output "$TMP_DIR/project.json" --write-out '%{http_code}' \
    --header "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
    --header "Content-Type: application/json" \
    "https://api.cloudflare.com/client/v4/accounts/${account}/pages/projects/${CF_PROJECT_NAME}" || true)
  [[ "$code" == "200" ]] && jq -e '.success == true' "$TMP_DIR/project.json" >/dev/null 2>&1
}

ACCOUNT_ID="$CONFIGURED_ACCOUNT_ID"
if [[ -n "$ACCOUNT_ID" ]]; then
  project_ok "$ACCOUNT_ID" || fail "Configured Cloudflare account cannot read Pages project ${CF_PROJECT_NAME}." 11
else
  cf_get "https://api.cloudflare.com/client/v4/accounts?per_page=50" > "$TMP_DIR/accounts.json"
  jq -e '.success == true' "$TMP_DIR/accounts.json" >/dev/null || fail "Cloudflare account discovery failed." 12
  while IFS= read -r candidate; do
    [[ -n "$candidate" ]] || continue
    if project_ok "$candidate"; then ACCOUNT_ID="$candidate"; break; fi
  done < <(jq -r '.result[]?.id' "$TMP_DIR/accounts.json")
fi
[[ -n "$ACCOUNT_ID" ]] || fail "Cloudflare project authority could not be resolved." 13

PRODUCTION_BRANCH=$(jq -r '.result.production_branch // .result.source.config.production_branch // empty' "$TMP_DIR/project.json")
[[ -n "$PRODUCTION_BRANCH" ]] || fail "Cloudflare Production branch is unavailable." 14
[[ "$CF_DEV_BRANCH" != "$PRODUCTION_BRANCH" ]] || fail "Rollback verifier refuses a Production branch target." 15

cf_get "https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/pages/projects/${CF_PROJECT_NAME}/deployments?per_page=100" > "$TMP_DIR/deployments.json"
jq -e '.success == true' "$TMP_DIR/deployments.json" >/dev/null || fail "Cloudflare deployment listing failed." 16
DEPLOYMENT_ID=$(jq -r --arg sha "$ROLLBACK_SHA" --arg branch "$CF_DEV_BRANCH" '[.result[]? | select((.deployment_trigger.metadata.commit_hash // "") == $sha and (.deployment_trigger.metadata.branch // "") == $branch and (.latest_stage.status // "") == "success")][0].id // empty' "$TMP_DIR/deployments.json")
[[ -n "$DEPLOYMENT_ID" ]] || fail "No successful Cloudflare dev deployment was found for rollback SHA ${ROLLBACK_SHA}." 17

cf_get "https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/pages/projects/${CF_PROJECT_NAME}/deployments/${DEPLOYMENT_ID}" > "$TMP_DIR/deployment.json"
jq -e '.success == true' "$TMP_DIR/deployment.json" >/dev/null || fail "Cloudflare rollback deployment lookup failed." 18
DEPLOYMENT_SHA=$(jq -r '.result.deployment_trigger.metadata.commit_hash // empty' "$TMP_DIR/deployment.json")
DEPLOYMENT_BRANCH=$(jq -r '.result.deployment_trigger.metadata.branch // empty' "$TMP_DIR/deployment.json")
DEPLOYMENT_STATUS=$(jq -r '.result.latest_stage.status // empty' "$TMP_DIR/deployment.json")
DEPLOYMENT_ENV=$(jq -r '.result.environment // empty' "$TMP_DIR/deployment.json")
DEPLOYMENT_URL=$(jq -r '.result.url // empty' "$TMP_DIR/deployment.json")
USES_FUNCTIONS=$(jq -r 'if .result.uses_functions == true then "true" elif .result.uses_functions == false then "false" else "unknown" end' "$TMP_DIR/deployment.json")

[[ "$DEPLOYMENT_SHA" == "$ROLLBACK_SHA" ]] || fail "Cloudflare rollback candidate SHA identity mismatch." 19
[[ "$DEPLOYMENT_BRANCH" == "$CF_DEV_BRANCH" ]] || fail "Cloudflare rollback candidate branch identity mismatch." 20
[[ "$DEPLOYMENT_STATUS" == "success" ]] || fail "Rollback candidate deployment is not successful." 21
[[ "$DEPLOYMENT_ENV" == "preview" ]] || fail "Rollback candidate is not a Development preview deployment." 22
[[ "$USES_FUNCTIONS" == "true" ]] || fail "Rollback candidate does not report uses_functions=true." 23
[[ -n "$DEPLOYMENT_URL" ]] || fail "Rollback candidate has no immutable deployment URL." 24

SMOKE_SCOPE=static bash scripts/development_http_smoke.sh "$DEPLOYMENT_URL" "Rollback candidate"
SMOKE_SCOPE=static bash scripts/contextual_proof_http_smoke.sh "$DEPLOYMENT_URL" "Rollback candidate contextual proof"

COMMITS_BACK=$(git rev-list --count "${ROLLBACK_SHA}..${DEV_SHA}")
note "Development rollback candidate: PASS"
note "Candidate ${ROLLBACK_SHA} is ${COMMITS_BACK} commit(s) behind current dev and has a successful immutable Cloudflare preview."
summary "### Development rollback candidate"
summary "- Current dev SHA: \`${DEV_SHA}\`"
summary "- Candidate SHA: \`${ROLLBACK_SHA}\`"
summary "- Candidate distance behind dev: \`${COMMITS_BACK}\` commit(s)"
summary "- Cloudflare deployment: \`${DEPLOYMENT_ID}\`"
summary "- Immutable preview: ${DEPLOYMENT_URL}"
summary "- Deployment status: \`${DEPLOYMENT_STATUS}\`"
summary "- Deployment environment: \`${DEPLOYMENT_ENV}\`"
summary "- uses_functions: \`${USES_FUNCTIONS}\`"
summary "- Static/contextual smoke: PASS"
summary "- Current Production/main SHA: \`${MAIN_SHA}\`"
summary "- Mutation performed: **none**"
summary "- Production mutation: **forbidden**"
summary "- This is rollback evidence only; moving dev requires a separate explicit human-authorized Git action."
