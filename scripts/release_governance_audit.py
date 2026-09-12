#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def text(path: str) -> str:
    target = ROOT / path
    if not target.exists():
        raise SystemExit(f"FAIL: required release-governance file is missing: {path}")
    return target.read_text(encoding="utf-8")


def require(source: str, needle: str, label: str) -> None:
    if needle not in source:
        raise SystemExit(f"FAIL: {label}: missing {needle!r}")
    print(f"PASS: {label}")


def forbid(source: str, needle: str, label: str) -> None:
    if needle in source:
        raise SystemExit(f"FAIL: {label}: forbidden stale release assumption {needle!r}")
    print(f"PASS: {label}")


governance = text("RELEASE_GOVERNANCE.md")
branch_note = text("BRANCH_WORKFLOW_NOTE.md")
source_gate = text(".github/workflows/development-source-gate.yml")
production_gate = text(".github/workflows/production-business-acceptance-authority.yml")
it_authority = text(".github/workflows/it-readiness-release-control-authority.yml")
roadmap = text("FORWARD_BUILD_ROADMAP_386_395.md")

require(governance, "non-force fast-forward", "governance requires non-force fast-forward promotion")
require(governance, "exact SHA", "governance requires exact-SHA identity")
require(governance, "force pushes: blocked", "intended platform posture blocks force pushes")
require(governance, "branch deletion: blocked", "intended platform posture blocks release-branch deletion")
require(governance, "Stale-check discrimination", "stale-check discrimination is documented")
require(governance, "Protected-branch rejection", "protected-branch recovery is documented")
require(governance, "Platform-protection visibility unavailable", "unknown external protection fails closed to AMBER")
require(governance, "database migrations", "governance preserves mutation safety boundary")

require(branch_note, "non-force", "branch workflow preserves non-force release rule")
require(branch_note, "exact SHA", "branch workflow preserves exact-SHA rule")
require(source_gate, "name: Current Source Gate", "canonical Development source gate name is stable")
require(production_gate, "name: Production Business Acceptance", "canonical Production acceptance name is stable")
require(it_authority, "- 'build*'", "I.T. authority follows release-number-independent build branches")
forbid(it_authority, "build353-*", "I.T. authority no longer limits feature evidence to Build 353 branches")
require(roadmap, "Build 387", "forward roadmap retains Build 387 authority")
require(roadmap, "Release Governance", "forward roadmap names release-governance scope")

# The canonical release contract must never recommend a force update.
for forbidden in ["force: true", "force=true", "--force"]:
    forbid(governance, forbidden, "canonical governance never recommends forced release promotion")

print("PASS: Build 387 release governance is exact-SHA aware, release-number independent, recovery documented, and fail-closed around unknown GitHub-hosted protection.")
