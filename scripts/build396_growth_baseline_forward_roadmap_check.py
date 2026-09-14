#!/usr/bin/env python3
"""Retained fail-closed source authority for the Build 396 growth baseline and 396–405 roadmap."""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ROADMAP = ROOT / "FORWARD_BUILD_ROADMAP_396_405.md"
BASELINE = ROOT / "docs" / "GROWTH_BASELINE_FORWARD_ROADMAP.md"
QUEUE = ROOT / "AUTONOMOUS_RELEASE_QUEUE.md"
HANDOFF = ROOT / "AI_PROJECT_HANDOFF.md"
README = ROOT / "README.md"
WORKFLOW = ROOT / ".github" / "workflows" / "growth-baseline-forward-roadmap-authority.yml"
CONVERGENCE = ROOT / "scripts" / "release_authority_documentation_convergence_check.py"
ANALYTICS = ROOT / "functions" / "api" / "analytics" / "ingest.js"
FUNNEL = ROOT / "functions" / "api" / "admin" / "booking_rebooking_funnel.js"
RETENTION = ROOT / "functions" / "api" / "admin" / "customer_retention_dashboard.js"
errors: list[str] = []


def read(path: Path, label: str) -> str:
    if not path.exists():
        errors.append(f"missing {label}: {path.relative_to(ROOT)}")
        return ""
    return path.read_text(encoding="utf-8", errors="ignore")


def require(text: str, needles: list[str], label: str) -> None:
    for needle in needles:
        if needle not in text:
            errors.append(f"{label} missing required Build 396 authority: {needle!r}")


def queue_pair(text: str) -> tuple[int | None, int | None]:
    current = re.search(r"## Current release.*?\*\*Build\s+(\d{3})\s+—", text, re.S)
    next_release = re.search(r"## Next release.*?\*\*Build\s+(\d{3})\s+—", text, re.S)
    if not current or not next_release:
        errors.append("release queue cannot resolve living current/next release")
        return None, None
    return int(current.group(1)), int(next_release.group(1))


def handoff_pair(text: str) -> tuple[int | None, int | None]:
    builds = [int(value) for value in re.findall(r"\*\*Build\s+(\d{3})\s+—", text)]
    if len(builds) < 2:
        errors.append("project handoff cannot resolve living current/next release")
        return None, None
    return builds[0], builds[1]


roadmap = read(ROADMAP, "396–405 roadmap")
baseline = read(BASELINE, "growth baseline contract")
queue = read(QUEUE, "release queue")
handoff = read(HANDOFF, "project handoff")
readme = read(README, "README")
workflow = read(WORKFLOW, "Build 396 workflow")
convergence = read(CONVERGENCE, "release convergence guard")
analytics = read(ANALYTICS, "analytics ingest")
funnel = read(FUNNEL, "booking/rebooking funnel")
retention = read(RETENTION, "customer retention authority")

for number in range(396, 406):
    if f"### Build {number} —" not in roadmap:
        errors.append(f"396–405 roadmap missing Build {number}")

require(roadmap, [
    "Genuine observed evidence only",
    "missing data is `unavailable` or `insufficient`",
    "Anonymous acquisition/session evidence and exact customer-profile history remain separate layers",
    "rd main protection",
    "exact Production SHA",
], "396–405 roadmap")

require(baseline, [
    "measurement baseline",
    "site_activity_events",
    "booking/rebooking funnel analytics",
    "Exact `customer_profile_id`",
    "Missing provider fee, HST, job-cost or reconciliation evidence remains `review`/`unavailable`",
    "must not expose IP addresses, User-Agent strings, visitor IDs, session IDs, raw postal codes, customer emails",
    "A missing observation is not a zero",
    "No live KPI number is embedded",
    "schema-neutral and read-only",
], "growth baseline contract")

queue_state = queue_pair(queue)
handoff_state = handoff_pair(handoff)
if None not in queue_state:
    current, next_release = queue_state
    if current is not None and not (396 <= current <= 405):
        errors.append(f"living current release {current} is outside retained 396–405 roadmap")
    if current is not None and next_release != current + 1:
        errors.append(f"living next release {next_release} is not sequential after {current}")
if queue_state != handoff_state:
    errors.append(f"living queue/handoff state diverges: {queue_state} vs {handoff_state}")

require(readme, [
    "FORWARD_BUILD_ROADMAP_396_405.md",
    "scripts/build396_growth_baseline_forward_roadmap_check.py",
], "README")

require(workflow, [
    "name: Build 396 — Growth Baseline & Forward Roadmap Renewal",
    "- 'build396-*'",
    "- dev",
    "- main",
    "python scripts/build396_growth_baseline_forward_roadmap_check.py",
    "python scripts/release_authority_documentation_convergence_check.py",
    "production-exact-sha:",
    "if: github.event_name == 'push' && github.ref == 'refs/heads/main'",
    "bash scripts/cloudflare_pages_production_acceptance.sh",
], "Build 396 workflow")

require(convergence, [
    'ROADMAP = ROOT / "FORWARD_BUILD_ROADMAP_396_405.md"',
    "forward roadmap does not contain current release",
], "release convergence guard")
require(analytics, ["site_activity_events", "analytics_storage_unavailable", "visitor_id", "session_id"], "analytics ingest")
require(funnel, ["Anonymous site sessions and exact customer_profile_id booking history are aggregated separately.", "cross_layer_identity_join:false", "customer_identity_exposed:false"], "booking/rebooking funnel")
require(retention, ["Exact customer_profile_id linkage only.", "fuzzy_identity_merge:false", "inferred_outreach_consent:false"], "customer retention authority")

if re.search(r"(?m)^\s*(contents|deployments|actions):\s*write\s*$", workflow):
    errors.append("Build 396 workflow grants write permission")
for needle in ["git push", "git update-ref", "wrangler pages deploy", "curl -X POST", "curl -X DELETE", "curl -X PATCH"]:
    if needle.lower() in workflow.lower():
        errors.append(f"Build 396 workflow contains mutation primitive: {needle}")

migrations = [p for p in ROOT.rglob("*.sql") if re.search(r"(?:^|[^0-9])396(?:[^0-9]|$)", p.name)]
if migrations:
    errors.append("Build 396 must not introduce a database migration: " + ", ".join(str(p.relative_to(ROOT)) for p in migrations))

if errors:
    print("BUILD 396 GROWTH BASELINE & FORWARD ROADMAP RENEWAL: FAIL")
    for error in errors:
        print(f"- {error}")
    sys.exit(1)

print("BUILD 396 GROWTH BASELINE & FORWARD ROADMAP RENEWAL: PASS")
print("- historical growth evidence/privacy baseline remains intact")
print("- living current/next state is allowed to advance sequentially through the retained 396–405 roadmap")
print("- raw identifiers remain excluded from aggregate-first growth reporting")
print("- schema, provider, business-data and destructive R2 mutation authorized: NONE")
