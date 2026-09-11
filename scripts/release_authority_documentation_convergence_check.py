#!/usr/bin/env python3
"""Fail closed when living release truth diverges from durable release authority."""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
QUEUE = ROOT / "AUTONOMOUS_RELEASE_QUEUE.md"
HANDOFF = ROOT / "AI_PROJECT_HANDOFF.md"
README = ROOT / "README.md"
BRANCH_NOTE = ROOT / "BRANCH_WORKFLOW_NOTE.md"
ROADMAP = ROOT / "FORWARD_BUILD_ROADMAP_378_385.md"
PRODUCTION_WORKFLOW = ROOT / ".github/workflows/production-business-acceptance-authority.yml"
PRODUCTION_CHECK = ROOT / "scripts/production_business_acceptance_check.py"
PRODUCTION_HELPER = ROOT / "scripts/cloudflare_pages_production_acceptance.sh"
errors: list[str] = []


def read(path: Path, label: str) -> str:
    if not path.exists():
        errors.append(f"missing {label}: {path.relative_to(ROOT)}")
        return ""
    return path.read_text(encoding="utf-8", errors="ignore")


def require(text: str, needles: list[str], label: str) -> None:
    for needle in needles:
        if needle not in text:
            errors.append(f"{label} missing required release authority: {needle!r}")


def section_build(text: str, heading: str) -> int | None:
    match = re.search(
        rf"##\s+{re.escape(heading)}\s+.*?\*\*Build\s+(\d{{3}})\s+—",
        text,
        flags=re.S,
    )
    if not match:
        errors.append(f"release queue cannot resolve numbered state from {heading!r}")
        return None
    return int(match.group(1))


queue = read(QUEUE, "autonomous release queue")
handoff = read(HANDOFF, "project handoff")
readme = read(README, "README")
branch_note = read(BRANCH_NOTE, "branch workflow note")
roadmap = read(ROADMAP, "forward roadmap")
production_workflow = read(PRODUCTION_WORKFLOW, "Production workflow")
production_check = read(PRODUCTION_CHECK, "Production source authority")
production_helper = read(PRODUCTION_HELPER, "Production exact-SHA helper")

accepted = section_build(queue, "Accepted checkpoint")
current = section_build(queue, "Current release")
next_release = section_build(queue, "Next release")

if None not in (accepted, current, next_release):
    assert accepted is not None and current is not None and next_release is not None
    if current != accepted + 1:
        errors.append(f"current release {current} is not sequential after accepted checkpoint {accepted}")
    if next_release != current + 1:
        errors.append(f"next release {next_release} is not sequential after current release {current}")

    handoff_builds = [int(value) for value in re.findall(r"\*\*Build\s+(\d{3})\s+—", handoff)]
    expected = [accepted, current, next_release]
    if handoff_builds != expected:
        errors.append(f"handoff accepted/current/next sequence {handoff_builds} does not match queue {expected}")

    if f"Current source direction: **Build {current} —" not in readme:
        errors.append(f"README does not identify current release {current}")
    if f"### Build {current} —" not in roadmap:
        errors.append(f"forward roadmap does not contain current release {current}")
    if f"### Build {next_release} —" not in roadmap:
        errors.append(f"forward roadmap does not contain next release {next_release}")

require(queue, [
    "exact-SHA Production deployment/runtime authority",
    "non-force fast-forward",
    "Missing exact Production runtime/deployment identity is a blocker",
], "autonomous release queue")

require(handoff, [
    "Source promotion alone is never Production proof.",
    "Production exact-SHA authority",
    "Missing deployment identity, Functions metadata or runtime smoke is a blocker",
    "Database migrations remain separate explicit acceptance boundaries",
], "project handoff")

require(branch_note, [
    "authorized non-force fast-forward of `main`",
    "durable Production exact-SHA authority",
    "Production deployment acceptance is observation-only",
], "branch workflow note")

require(readme, [
    "scripts/release_authority_documentation_convergence_check.py",
    ".github/workflows/production-business-acceptance-authority.yml",
    "Production is not considered GREEN from source promotion alone.",
], "README")

require(production_workflow, [
    "name: Production Business Acceptance & Exact-SHA Authority",
    "- 'build*'",
    "- dev",
    "- main",
    "production-exact-sha:",
    "if: github.event_name == 'push' && github.ref == 'refs/heads/main'",
    "CLOUDFLARE_API_TOKEN: ${{ secrets.ROSIEDAZZLERS_TOKEN }}",
    "CONFIGURED_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}",
    "TARGET_SHA: ${{ github.sha }}",
    "bash scripts/cloudflare_pages_production_acceptance.sh",
], "Production workflow")

if re.search(r"(?i)\bbuild\s+\d{3}\b", production_workflow):
    errors.append("Production workflow is still branded to a numbered historical release")

require(production_check, [
    "durable Production business acceptance",
    "workflow is durable across sequential releases",
    "Production exact-SHA evidence is Cloudflare read-only and fail-closed",
], "Production source authority")

require(production_helper, [
    "read-only Cloudflare Pages Production exact-SHA acceptance",
    "PRODUCTION EXACT-SHA ACCEPTANCE: PASS",
    "exact GitHub SHA matches successful Cloudflare Production deployment",
    "immutable deployment and canonical Production runtime smoke passed",
    "mutation performed: none",
], "Production exact-SHA helper")

# Living documents intentionally avoid pinning commit identity in prose. Git refs
# and exact-SHA workflow evidence are the current authority and cannot go stale.
for path, text in [
    (QUEUE, queue),
    (HANDOFF, handoff),
    (README, readme),
    (BRANCH_NOTE, branch_note),
]:
    if re.search(r"(?i)\b[0-9a-f]{12,40}\b", text):
        errors.append(f"{path.name} embeds commit-like identity instead of live Git/workflow evidence")
    if len(re.findall(r"(?i)\bbuild\s+\d{3}\b", text)) > 3:
        errors.append(f"{path.name} contains more than accepted/current/next numbered release references")

if len(readme) > 18000:
    errors.append("README exceeds the living-document size boundary")

# The durable Production path remains observation-only.
for needle in [
    "git push", "git update-ref", "wrangler pages deploy", "--request POST", "-X POST",
    "--request DELETE", "-X DELETE", "--request PATCH", "-X PATCH", "/rollback", "/retry",
]:
    if needle in production_helper:
        errors.append(f"Production exact-SHA helper contains mutation primitive: {needle}")

if errors:
    print("RELEASE AUTHORITY & DOCUMENTATION CONVERGENCE: FAIL")
    for error in errors:
        print(f" - {error}")
    raise SystemExit(1)

print("RELEASE AUTHORITY & DOCUMENTATION CONVERGENCE: PASS")
print(" - accepted/current/next release state is sequential and shared by queue, handoff and README")
print(" - living documents point to Git/workflow evidence rather than stale commit identity")
print(" - Production business acceptance is release-number independent")
print(" - exact-SHA Cloudflare Production evidence remains read-only and fail-closed")
