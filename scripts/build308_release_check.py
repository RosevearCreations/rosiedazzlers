#!/usr/bin/env python3
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
errors = []


def read(rel: str) -> str:
    path = ROOT / rel
    if not path.exists():
        errors.append(f"missing {rel}")
        return ""
    return path.read_text(encoding="utf-8", errors="ignore")


def need(rel: str, *tokens: str) -> str:
    body = read(rel)
    for token in tokens:
        if token not in body:
            errors.append(f"{rel} missing {token}")
    return body


helper = need(
    "scripts/cloudflare_pages_development.sh",
    "Build 308 — canonical Cloudflare Pages Development acceptance/recovery helper",
    "accept_command()",
    "recover_command()",
    "verify_token",
    "resolve_project",
    "wait_for_exact_success 24 10",
    "validate_exact_identity",
    '[[ "$EXACT_USES_FUNCTIONS" == "true" ]]',
    "smoke_exact",
    "smoke_alias",
    "record_production_boundary",
    "git merge-base origin/main origin/dev",
    "never force-move main to dev",
    "observe_recovery_target",
    "require_manual_recovery_confirmation",
    '[[ "$RECOVERY_CONFIRM_SHA" == "$TARGET_SHA" ]]',
    '[[ "$EXACT_ENVIRONMENT" == "preview" ]]',
    "delete_stuck_preview",
    "recreate_exact",
    "Cloudflare Development exact-SHA manual recovery: PASS",
)

acceptance = need(
    ".github/workflows/cloudflare-development-acceptance.yml",
    "name: Cloudflare Development Acceptance",
    "branches:\n      - dev",
    "TARGET_SHA: ${{ github.sha }}",
    "Validate Build 308 deployment/recovery consolidation",
    "python scripts/build308_release_check.py",
    "bash scripts/cloudflare_pages_development.sh accept",
    "Build 274 I.T. Connections",
    "Normal acceptance contains no deployment DELETE or recreate request",
    "Production promotion",
)

# Normal acceptance must not regain its own Cloudflare API mutation/discovery
# implementation. Those mechanics belong only to the canonical helper.
for forbidden in [
    "--request DELETE",
    "--request POST",
    "/pages/projects/${CF_PROJECT_NAME}/deployments?per_page=25",
    "for alias_attempt in $(seq 1 12)",
]:
    if forbidden in acceptance:
        errors.append(f"normal Development acceptance duplicates canonical helper mechanic: {forbidden}")

recovery = need(
    ".github/workflows/cloudflare-pages-recovery.yml",
    "name: Cloudflare Pages Recovery",
    "workflow_dispatch:",
    "recovery_action:",
    "default: observe",
    "- observe",
    "- repair",
    "confirm_sha:",
    "cancel-in-progress: false",
    "TARGET_SHA: ${{ github.sha }}",
    "RECOVERY_ACTION: ${{ inputs.recovery_action }}",
    "RECOVERY_CONFIRM_SHA: ${{ inputs.confirm_sha }}",
    '[[ "$GITHUB_EVENT_NAME" == "workflow_dispatch" ]]',
    '[[ "$GITHUB_REF_NAME" == "dev" ]]',
    '[[ "$RECOVERY_CONFIRM_SHA" == "$TARGET_SHA" ]]',
    "bash scripts/cloudflare_pages_development.sh recover",
    "Production deployment mutation is forbidden",
)

trigger = recovery.split("permissions:", 1)[0]
if re.search(r"^\s*push\s*:", trigger, flags=re.M):
    errors.append("Cloudflare recovery must not run automatically on push")
if "branches:" in trigger:
    errors.append("Cloudflare recovery trigger must not contain an automatic branch trigger")
for forbidden in ["--request DELETE", "--request POST", "force=true"]:
    if forbidden in recovery:
        errors.append(f"recovery workflow duplicates mutation mechanic instead of delegating to helper: {forbidden}")

# Repair is intentionally stricter than observation. A terminal failed/canceled
# deployment is evidence, not something the helper silently deletes.
for token in [
    'case "$EXACT_STATUS" in success|failure|failed|canceled|cancelled)',
    "Refusing to delete terminal deployment status",
    "Recovery target is not a preview deployment; refusing mutation",
    "automatic deletion/retry is refused",
]:
    if token not in helper:
        errors.append(f"canonical helper missing fail-closed recovery rule: {token}")

# Retained release guards must understand the centralized successor without
# requiring the old duplicated inline workflow body.
need(
    "scripts/build276_release_check.py",
    "scripts/cloudflare_pages_development.sh",
    "wait_for_exact_success 24 10",
    "Build 308 may delegate",
)
need(
    "scripts/build281_release_check.py",
    "scripts/cloudflare_pages_development.sh",
    "EXACT_USES_FUNCTIONS",
    "Build 308 may centralize",
)

if errors:
    print("Build 308 deployment/recovery consolidation check: FAIL")
    for error in errors:
        print(f" - {error}")
    sys.exit(1)

print("Build 308 deployment/recovery consolidation check: PASS")
print(" - normal Development acceptance uses one read-only canonical Cloudflare helper")
print(" - exact-SHA success, Functions metadata, immutable smoke and alias convergence remain mandatory")
print(" - retained Build 274 I.T. Connections evidence remains explicit")
print(" - recovery is manual workflow_dispatch only and defaults to observe")
print(" - repair requires exact dev SHA confirmation and a non-terminal preview target")
print(" - terminal deployments and Production targets fail closed")
print(" - recovery DELETE/recreate mechanics exist only in the canonical helper")
