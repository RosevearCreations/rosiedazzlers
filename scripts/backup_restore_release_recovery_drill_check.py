#!/usr/bin/env python3
"""Retained fail-closed source authority for the completed Build 385 recovery drill."""
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
RUNBOOK = ROOT / "docs" / "BACKUP_RESTORE_RELEASE_RECOVERY.md"
FOCUSED_WORKFLOW = ROOT / ".github" / "workflows" / "backup-restore-release-recovery-drill-authority.yml"
ROLLBACK_WORKFLOW = ROOT / ".github" / "workflows" / "development-rollback-readiness.yml"
RECOVERY_WORKFLOW = ROOT / ".github" / "workflows" / "cloudflare-pages-recovery.yml"
ROLLBACK_HELPER = ROOT / "scripts" / "cloudflare_development_rollback.sh"
DEVELOPMENT_HELPER = ROOT / "scripts" / "cloudflare_pages_development.sh"
PRODUCTION_WORKFLOW = ROOT / ".github" / "workflows" / "production-business-acceptance-authority.yml"
PRODUCTION_HELPER = ROOT / "scripts" / "cloudflare_pages_production_acceptance.sh"
RETAINED_CHECK = ROOT / "scripts" / "release_rollback_recovery_check.py"
HISTORICAL_ROADMAP = ROOT / "FORWARD_BUILD_ROADMAP_378_385.md"
errors: list[str] = []


def read(path: Path, label: str) -> str:
    if not path.exists():
        errors.append(f"missing {label}: {path.relative_to(ROOT)}")
        return ""
    return path.read_text(encoding="utf-8", errors="ignore")


def require(text: str, needles: list[str], label: str) -> None:
    for needle in needles:
        if needle not in text:
            errors.append(f"{label} missing required recovery contract: {needle!r}")


runbook = read(RUNBOOK, "Build 385 recovery runbook")
focused = read(FOCUSED_WORKFLOW, "retained Build 385 focused workflow")
rollback_workflow = read(ROLLBACK_WORKFLOW, "Development rollback workflow")
recovery_workflow = read(RECOVERY_WORKFLOW, "Cloudflare recovery workflow")
rollback_helper = read(ROLLBACK_HELPER, "Development rollback helper")
development_helper = read(DEVELOPMENT_HELPER, "Development Pages helper")
production_workflow = read(PRODUCTION_WORKFLOW, "Production exact-SHA workflow")
production_helper = read(PRODUCTION_HELPER, "Production exact-SHA helper")
retained_check = read(RETAINED_CHECK, "retained rollback/recovery check")
historical = read(HISTORICAL_ROADMAP, "historical 378–385 roadmap")

require(runbook, [
    "Build 385 — Backup, Restore & Release Recovery Drill",
    "The drill is observation-only.",
    "Recovery state is `NOT VERIFIED`",
    "Production mutation is forbidden",
    "Git / source",
    "Cloudflare Pages",
    "Supabase / PostgreSQL",
    "R2 / public media",
    "Configuration / secrets",
    "DNS / domain",
    "Payments / providers",
    "RTO and RPO are operational targets, not promises",
    "Select a known-good source candidate",
    "Verify database boundary",
    "Verify media preservation",
    "Require explicit authorization",
    "Re-accept the recovered boundary",
    "Build 385 introduces no database migration",
], "Build 385 recovery runbook")

require(focused, [
    "name: Build 385 — Backup, Restore & Release Recovery Drill",
    "- 'build-385-*'",
    "workflow_dispatch:",
    "permissions:\n  contents: read",
    "python3 scripts/backup_restore_release_recovery_drill_check.py",
    "python3 scripts/release_rollback_recovery_check.py",
    "bash -n scripts/cloudflare_development_rollback.sh",
    "bash -n scripts/cloudflare_pages_development.sh",
    "bash -n scripts/cloudflare_pages_production_acceptance.sh",
    "Current release acceptance is owned by the living release authority",
], "retained Build 385 workflow")

if re.search(r"(?m)^\s*-\s+(dev|main)\s*$", focused):
    errors.append("retained Build 385 workflow must not run on ordinary dev/main pushes")

require(rollback_workflow, [
    "name: Development Rollback Readiness",
    "workflow_dispatch:",
    "rollback_sha:",
    "Git mutation: none",
    "Cloudflare mutation: none",
    "Production mutation: forbidden",
], "retained Development rollback workflow")

require(recovery_workflow, [
    "name: Cloudflare Pages Recovery",
    "workflow_dispatch:",
    "Production deployment mutation is forbidden.",
], "retained Cloudflare recovery workflow")

require(rollback_helper, [
    "read-only Development rollback candidate verifier",
    'git merge-base --is-ancestor "$ROLLBACK_SHA" "$DEV_SHA"',
    "Mutation performed: **none**",
    "Production mutation: **forbidden**",
], "retained Development rollback helper")

require(development_helper, [
    "Recovery mutation is manual-only",
    "require_manual_recovery_confirmation",
], "retained Development Pages helper")

require(production_workflow, [
    "Production Business Acceptance & Exact-SHA Authority",
    "production-exact-sha:",
    "bash scripts/cloudflare_pages_production_acceptance.sh",
], "Production exact-SHA workflow")

require(production_helper, [
    "read-only Cloudflare Pages Production exact-SHA acceptance",
    "PRODUCTION EXACT-SHA ACCEPTANCE: PASS",
    "mutation performed: none",
], "Production exact-SHA helper")

require(retained_check, [
    "ROLLBACK / RECOVERY ACCEPTANCE: PASS",
    "Production mutation remains forbidden",
], "retained rollback/recovery authority")

require(historical, [
    "**Phase status:** Completed.",
    "### Build 385 — Backup, Restore & Release Recovery Drill",
    "FORWARD_BUILD_ROADMAP_386_395.md",
], "historical 378–385 roadmap")

# The retained drill itself must remain observation-only.
for needle in [
    "git push", "git update-ref", "git reset --hard", "wrangler pages deploy",
    "--request POST", "-X POST", "--request DELETE", "-X DELETE",
    "--request PATCH", "-X PATCH", "/rollback", "/retry",
]:
    if needle in focused:
        errors.append(f"retained Build 385 workflow contains mutation primitive: {needle}")

migrations = [p for p in ROOT.rglob("*.sql") if re.search(r"(?:^|[^0-9])385(?:[^0-9]|$)", p.name)]
if migrations:
    errors.append("Build 385 must not introduce a database migration: " + ", ".join(str(p.relative_to(ROOT)) for p in migrations))

for needle in ["automatic database restore", "automatic restore", "secret value:", "API key:"]:
    if needle.lower() in runbook.lower():
        errors.append(f"Build 385 runbook violates fail-closed recovery boundary: {needle}")

if errors:
    print("BUILD 385 BACKUP / RESTORE / RELEASE RECOVERY DRILL: FAIL")
    for error in errors:
        print(f"- {error}")
    sys.exit(1)

print("BUILD 385 BACKUP / RESTORE / RELEASE RECOVERY DRILL: PASS")
print("- completed recovery drill remains observation-only and fail-closed")
print("- historical workflow no longer couples ordinary dev/main pushes to Build 385")
print("- database, media, configuration, DNS and provider recovery still require explicit authorization")
print("- Production exact-SHA re-acceptance remains mandatory after any real recovery")
print("- no Build 385 database migration is present")