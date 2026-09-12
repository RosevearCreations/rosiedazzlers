#!/usr/bin/env python3
"""Fail-closed retained authority for Build 386 post-recovery baseline and roadmap renewal."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
QUEUE = ROOT / "AUTONOMOUS_RELEASE_QUEUE.md"
HANDOFF = ROOT / "AI_PROJECT_HANDOFF.md"
README = ROOT / "README.md"
ROADMAP = ROOT / "FORWARD_BUILD_ROADMAP_386_395.md"
HISTORICAL_ROADMAP = ROOT / "FORWARD_BUILD_ROADMAP_378_385.md"
STARTUP = ROOT / "STARTUP_GO_LIVE_BLOCKERS.md"
CONVERGENCE = ROOT / "scripts" / "release_authority_documentation_convergence_check.py"
FOCUSED_WORKFLOW = ROOT / ".github" / "workflows" / "post-recovery-baseline-roadmap-authority.yml"
RECOVERY_WORKFLOW = ROOT / ".github" / "workflows" / "backup-restore-release-recovery-drill-authority.yml"
RECOVERY_RUNBOOK = ROOT / "docs" / "BACKUP_RESTORE_RELEASE_RECOVERY.md"
errors: list[str] = []


def read(path: Path, label: str) -> str:
    if not path.exists():
        errors.append(f"missing {label}: {path.relative_to(ROOT)}")
        return ""
    return path.read_text(encoding="utf-8", errors="ignore")


def require(text: str, needles: list[str], label: str) -> None:
    for needle in needles:
        if needle not in text:
            errors.append(f"{label} missing retained Build 386 contract: {needle!r}")


def living_release_pair(text: str, label: str) -> tuple[int, int] | None:
    current_match = re.search(r"\*\*Build\s+(\d{3})\s+—\s+[^*\n]+\*\*\s+is the active bounded release\.", text)
    next_match = re.search(r"\*\*Build\s+(\d{3})\s+—\s+[^*\n]+\*\*\s+is next only after", text)
    if not current_match or not next_match:
        errors.append(f"{label} cannot resolve living current/next release")
        return None
    return int(current_match.group(1)), int(next_match.group(1))


queue = read(QUEUE, "release queue")
handoff = read(HANDOFF, "project handoff")
readme = read(README, "README")
roadmap = read(ROADMAP, "renewed forward roadmap")
historical = read(HISTORICAL_ROADMAP, "completed recovery roadmap")
startup = read(STARTUP, "go-live acceptance authority")
convergence = read(CONVERGENCE, "living release convergence guard")
focused = read(FOCUSED_WORKFLOW, "Build 386 focused workflow")
recovery_workflow = read(RECOVERY_WORKFLOW, "retired Build 385 focused workflow")
recovery_runbook = read(RECOVERY_RUNBOOK, "retained recovery runbook")

queue_pair = living_release_pair(queue, "release queue")
handoff_pair = living_release_pair(handoff, "project handoff")
if queue_pair:
    current, next_release = queue_pair
    if current < 386:
        errors.append(f"living release regressed behind retained Build 386 authority: {queue_pair}")
    if next_release != current + 1:
        errors.append(f"living release is not sequential: {queue_pair}")
    if f"Current source direction: **Build {current} —" not in readme:
        errors.append(f"README does not identify current source release {current}")
if queue_pair and handoff_pair and queue_pair != handoff_pair:
    errors.append(f"project handoff sequence {handoff_pair} does not match release queue {queue_pair}")

require(readme, [
    "FORWARD_BUILD_ROADMAP_386_395.md",
    "scripts/release_authority_documentation_convergence_check.py",
    "Production is not considered GREEN from source promotion alone.",
], "README")

require(roadmap, [
    "# Rosie Dazzlers — Forward Build Roadmap 386–395",
    "### Build 386 — Post-Recovery Baseline & Forward Roadmap Renewal",
    "### Build 387 — Release Governance & Branch Protection Readiness",
    "### Build 388 — Service, Add-On & Commercial Accuracy Convergence",
    "### Build 389 — Local SEO, Service Landing & Proof Convergence",
    "### Build 390 — Booking, Quote & Condition-Based Estimate Hardening",
    "### Build 391 — Photo Studio & R2 Media Reliability",
    "### Build 392 — Retention, Maintenance & Fleet Commercial Activation",
    "### Build 393 — Operations, Inventory & Job-Cost Evidence",
    "### Build 394 — Finance Close, Reconciliation & Accountant Export Acceptance",
    "### Build 395 — Production Business Acceptance & Growth Readiness",
], "renewed roadmap")

require(historical, [
    "**Phase status:** Completed.",
    "FORWARD_BUILD_ROADMAP_386_395.md",
    "This file remains historical authority",
], "completed recovery roadmap")

if "Build 268" in startup or "MASTER_VALUE_ROADMAP.md" in startup:
    errors.append("go-live acceptance authority still carries obsolete Build 268 planning references")

require(convergence, [
    'ROADMAP = ROOT / "FORWARD_BUILD_ROADMAP_386_395.md"',
    "next release {next_release} is not sequential after current release {current}",
    "accepted checkpoint is live-ref based; current/next release state is sequential",
], "living release convergence guard")

require(focused, [
    "name: Build 386 — Post-Recovery Baseline & Forward Roadmap Renewal",
    "- 'build-386-*'", "- dev", "- main",
    "python3 scripts/post_recovery_baseline_roadmap_check.py",
    "python3 scripts/release_authority_documentation_convergence_check.py",
    "production-exact-sha:", "Verify exact Production deployment",
    "bash scripts/cloudflare_pages_production_acceptance.sh",
], "Build 386 focused workflow")

if re.search(r"(?m)^\s*-\s+(dev|main)\s*$", recovery_workflow):
    errors.append("Build 385 recovery workflow still triggers on ordinary dev/main pushes")
require(recovery_workflow, ["name: Build 385 — Backup, Restore & Release Recovery Drill", "- 'build-385-*'", "workflow_dispatch:"], "retired Build 385 workflow")
require(recovery_runbook, ["Build 385 — Backup, Restore & Release Recovery Drill", "The drill is observation-only.", "Production mutation is forbidden"], "retained recovery runbook")

for path, text in [(QUEUE, queue), (HANDOFF, handoff), (README, readme), (STARTUP, startup)]:
    if re.search(r"(?i)\b[0-9a-f]{12,40}\b", text):
        errors.append(f"{path.name} embeds commit-like identity instead of live Git/workflow evidence")

migrations = [p for p in ROOT.rglob("*.sql") if re.search(r"(?:^|[^0-9])386(?:[^0-9]|$)", p.name)]
if migrations:
    errors.append("Build 386 must not introduce a database migration: " + ", ".join(str(p.relative_to(ROOT)) for p in migrations))

for needle in ["git push", "git update-ref", "wrangler pages deploy", "--request POST", "-X POST", "--request DELETE", "-X DELETE", "--request PATCH", "-X PATCH", "/rollback", "/retry"]:
    if needle in focused:
        errors.append(f"Build 386 focused workflow contains mutation primitive: {needle}")

if errors:
    print("BUILD 386 POST-RECOVERY BASELINE / ROADMAP RENEWAL: FAIL")
    for error in errors:
        print(f"- {error}")
    raise SystemExit(1)

print("BUILD 386 POST-RECOVERY BASELINE / ROADMAP RENEWAL: PASS")
print(f"- retained baseline authority is compatible with living release {queue_pair[0]}/{queue_pair[1]}")
print("- completed recovery roadmap remains historical and the 386–395 roadmap remains authoritative")
print("- Build 385 recovery material remains retained but decoupled from ordinary dev/main pushes")
print("- Build 386 introduces no database migration or Production/business/provider mutation")
