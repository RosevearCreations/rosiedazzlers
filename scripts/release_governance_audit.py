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

require(governance, "non-force fast-forward", "governance requires non-force Development promotion")
require(governance, "stage-specific", "governance defines stage-specific exact-SHA authority")
require(governance, "rd main protection", "governance names the active protected-main ruleset")
require(governance, "pull request required", "governance requires protected-main PR promotion")
require(governance, "source checks", "governance names the protected-main required status context")
require(governance, "Never force-push", "governance explicitly forbids release history rewriting")
require(governance, "Stale-check discrimination", "stale-check discrimination is documented")
require(governance, "Protected `main` rejection", "protected-main recovery is documented")
require(governance, "Platform-protection visibility unavailable", "unknown external protection fails closed to AMBER")
require(governance, "database migrations", "governance preserves mutation safety boundary")

require(branch_note, "non-force", "branch workflow preserves non-force Development rule")
require(branch_note, "rd main protection", "branch workflow follows protected-main ruleset")
require(branch_note, "pull request", "branch workflow uses PR promotion for main")
require(branch_note, "Production merge SHA", "branch workflow distinguishes Development and Production exact identities")
require(source_gate, "name: Current Source Gate", "canonical Development source gate name is stable")
require(production_gate, "name: Production Business Acceptance", "canonical Production acceptance name is stable")
require(it_authority, "- 'build*'", "I.T. authority follows release-number-independent build branches")
forbid(it_authority, "build353-*", "I.T. authority no longer limits feature evidence to Build 353 branches")
require(roadmap, "Build 387", "forward roadmap retains Build 387 authority")
require(roadmap, "rd main protection", "forward roadmap follows protected-main release governance")
require(roadmap, "Build 388", "forward roadmap retains the next commercial-accuracy build")

# The living release contract must not recommend common history-rewriting release commands.
for forbidden in ["git push --force", "git push -f", "force=true"]:
    forbid(governance.lower(), forbidden, "canonical governance never recommends force-push release commands")

print("PASS: Build 387 release governance is protected-main aware, stage-specific exact-SHA aware, release-number independent, recovery documented, and fail-closed around GitHub-hosted protection evidence.")
