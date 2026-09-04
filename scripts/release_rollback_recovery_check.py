#!/usr/bin/env python3
"""Fail-closed source authority for Build 322 rollback/recovery acceptance."""
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
ROLLBACK_WORKFLOW = ROOT / ".github" / "workflows" / "development-rollback-readiness.yml"
RECOVERY_WORKFLOW = ROOT / ".github" / "workflows" / "cloudflare-pages-recovery.yml"
ROLLBACK_HELPER = ROOT / "scripts" / "cloudflare_development_rollback.sh"
RECOVERY_HELPER = ROOT / "scripts" / "cloudflare_pages_development.sh"
SOURCE_GATE = ROOT / ".github" / "workflows" / "development-source-gate.yml"
errors = []


def require(path: Path, needles, label):
    if not path.exists():
        errors.append(f"missing {label}: {path.relative_to(ROOT)}")
        return ""
    text = path.read_text(encoding="utf-8")
    for needle in needles:
        if needle not in text:
            errors.append(f"{label} missing required contract: {needle!r}")
    return text


rollback_workflow = require(ROLLBACK_WORKFLOW, [
    "name: Development Rollback Readiness",
    "workflow_dispatch:",
    "rollback_sha:",
    "permissions:\n  contents: read",
    "Require manual dev-only dispatch",
    '[[ "$GITHUB_REF_NAME" == "dev" ]]',
    "python scripts/release_rollback_recovery_check.py",
    "bash scripts/cloudflare_development_rollback.sh",
    "Git mutation: none",
    "Cloudflare mutation: none",
    "Production mutation: forbidden",
], "rollback readiness workflow")

recovery_workflow = require(RECOVERY_WORKFLOW, [
    "name: Cloudflare Pages Recovery",
    "workflow_dispatch:",
    "options:\n          - observe\n          - repair",
    "permissions:\n  contents: read",
    '[[ "$GITHUB_REF_NAME" == "dev" ]]',
    '[[ "$RECOVERY_CONFIRM_SHA" == "$TARGET_SHA" ]]',
    "Production deployment mutation is forbidden.",
], "Cloudflare recovery workflow")

rollback_helper = require(ROLLBACK_HELPER, [
    "read-only Development rollback candidate verifier",
    '[[ "$ROLLBACK_SHA" =~ ^[0-9a-f]{40}$ ]]',
    'git merge-base --is-ancestor "$ROLLBACK_SHA" "$DEV_SHA"',
    '[[ "$ROLLBACK_SHA" != "$DEV_SHA" ]]',
    '[[ "$CF_DEV_BRANCH" != "$PRODUCTION_BRANCH" ]]',
    '(.latest_stage.status // "") == "success"',
    '[[ "$DEPLOYMENT_ENV" == "preview" ]]',
    '[[ "$USES_FUNCTIONS" == "true" ]]',
    'SMOKE_SCOPE=static bash scripts/development_http_smoke.sh',
    'SMOKE_SCOPE=static bash scripts/contextual_proof_http_smoke.sh',
    "Mutation performed: **none**",
    "Production mutation: **forbidden**",
], "rollback verifier")

recovery_helper = require(RECOVERY_HELPER, [
    "Recovery mutation is manual-only",
    '[[ "$CF_DEV_BRANCH" != "$CF_PRODUCTION_BRANCH" ]]',
    '[[ "$EXACT_ENVIRONMENT" == "preview" ]]',
    "require_manual_recovery_confirmation",
    "delete_stuck_preview",
], "Cloudflare recovery helper")

source_gate = require(SOURCE_GATE, [
    "scripts/release_rollback_recovery_check.py",
    "python scripts/release_rollback_recovery_check.py",
    "bash -n scripts/cloudflare_development_rollback.sh",
    "Rollback/recovery acceptance authority: PASS",
], "current source gate")

# Rollback drill must be non-mutating: GET-only HTTP and no Git ref writes.
for needle in [
    "git push", "git reset --hard", "git branch -f", "git update-ref", "git checkout -B dev",
    'method: "POST"', "--request POST", "-X POST", "--request DELETE", "-X DELETE", "--request PATCH", "-X PATCH",
    "/rollback", "/retry"
]:
    if needle in rollback_helper:
        errors.append(f"rollback verifier contains a mutation primitive: {needle}")

# Cloudflare calls in rollback helper must be retrieval-only endpoints.
for match in re.finditer(r'https://api\.cloudflare\.com/client/v4/[^"\s]+', rollback_helper):
    url = match.group(0)
    if not any(part in url for part in ["/accounts?", "/pages/projects/"]):
        errors.append(f"rollback verifier contains unexpected Cloudflare endpoint: {url}")

# Workflow itself must not have write permissions or branch/deployment mutation commands.
if re.search(r"\b(contents|deployments|actions):\s*write\b", rollback_workflow):
    errors.append("rollback readiness workflow grants write permissions")
for needle in ["git push", "wrangler pages deployment", "curl -X POST", "curl -X DELETE", "update-ref"]:
    if needle in rollback_workflow:
        errors.append(f"rollback readiness workflow contains mutation command: {needle}")

# Recovery remains narrowly mutating: repair only, exact current dev SHA, preview only, not terminal/Production.
for needle in [
    '[[ "${RECOVERY_ACTION:-observe}" == "repair" ]]',
    '[[ "$RECOVERY_CONFIRM_SHA" == "$TARGET_SHA" ]]',
    '[[ "$EXACT_ENVIRONMENT" == "preview" ]]',
    '[[ "$EXACT_SHA" == "$TARGET_SHA" && "$EXACT_BRANCH" == "$CF_DEV_BRANCH" ]]',
]:
    if needle not in recovery_helper:
        errors.append(f"recovery helper lost fail-closed repair boundary: {needle}")

# Rollback candidate must be prior history, successful preview, Functions-enabled and smokeable.
if "git merge-base --is-ancestor" not in rollback_helper or "successful Cloudflare dev deployment" not in rollback_helper:
    errors.append("rollback verifier does not prove prior dev ancestry and successful deployment evidence")
if "uses_functions" not in rollback_helper or "development_http_smoke.sh" not in rollback_helper:
    errors.append("rollback verifier does not require Functions metadata and smoke evidence")

# Build is source-only.
migrations = list(ROOT.glob("**/*322*.sql"))
if migrations:
    errors.append("Build 322 must not introduce a schema migration: " + ", ".join(str(p.relative_to(ROOT)) for p in migrations))

if errors:
    print("ROLLBACK / RECOVERY ACCEPTANCE: FAIL")
    for error in errors:
        print(f"- {error}")
    sys.exit(1)

print("ROLLBACK / RECOVERY ACCEPTANCE: PASS")
print("- rollback readiness is manual-dispatch and read-only")
print("- rollback candidates must be prior ancestors of current dev")
print("- rollback evidence requires an exact successful immutable Development preview")
print("- rollback evidence requires preview environment, Functions metadata and smoke checks")
print("- rollback verification cannot move Git refs or mutate Cloudflare")
print("- stuck-deployment recovery remains dev-only, preview-only and exact-SHA confirmed")
print("- Production mutation remains forbidden")
print("- no Build 322 database migration is present")
