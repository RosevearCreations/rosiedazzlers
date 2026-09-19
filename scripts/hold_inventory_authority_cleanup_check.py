#!/usr/bin/env python3
"""Build 426 — canonical Production HOLD inventory / authority cleanup guard."""
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
errors = []

def read(path):
    target = ROOT / path
    if not target.is_file():
        errors.append(f"missing required file: {path}")
        return ""
    return target.read_text(encoding="utf-8", errors="ignore")

def require(text, needles, label):
    for needle in needles:
        if needle not in text:
            errors.append(f"{label} missing {needle!r}")

contract = read("BUILD426_HOLD_INVENTORY_AUTHORITY_CLEANUP.md")
backlog = read("STARTUP_GO_LIVE_BLOCKERS.md")
queue = read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff = read("AI_PROJECT_HANDOFF.md")
readme = read("README.md")
dev_gate = read(".github/workflows/development-source-gate.yml")
prod_gate = read(".github/workflows/production-business-acceptance-authority.yml")
prod_check = read("scripts/production_business_acceptance_check.py")

require(contract, [
    "single current evidence/HOLD backlog",
    "provider_dependent",
    "owner_action",
    "unavailable",
    "Source/runtime GREEN does not auto-close provider or owner evidence.",
    "does not authorize schema migration",
    "protected-main",
], "Build 426 contract")

require(backlog, [
    "# Rosie Dazzlers — Current Production HOLD Inventory",
    "## Canonical HOLD backlog",
    "provider_dependent",
    "owner_action",
    "unavailable",
    "Provider outcomes & communications",
    "Recovery / backup evidence",
    "Independent device / visual evidence",
    "Maintenance / fleet business approval",
    "dated, attributable evidence",
    "Source/runtime GREEN never closes a provider or owner HOLD by itself.",
], "canonical HOLD backlog")

for stale in [
    "Build 406 evidence classification",
    "Build 415 —",
    "FORWARD_BUILD_ROADMAP_405_415.md",
    "Build 416 controlled soft-launch work begins",
]:
    if stale in backlog:
        errors.append(f"canonical HOLD backlog retains stale launch-era wording: {stale!r}")

for text, label in [(queue, "queue"), (handoff, "handoff"), (readme, "README")]:
    require(text, ["STARTUP_GO_LIVE_BLOCKERS.md"], label)

require(queue, ["Build 426", "Build 427", "BUILD426_HOLD_INVENTORY_AUTHORITY_CLEANUP.md"], "queue")
require(handoff, ["Build 426", "Build 427", "BUILD426_HOLD_INVENTORY_AUTHORITY_CLEANUP.md"], "handoff")
require(readme, ["Build 426", "BUILD426_HOLD_INVENTORY_AUTHORITY_CLEANUP.md"], "README")

for gate, label in [(dev_gate, "Development source gate"), (prod_gate, "Production authority")]:
    require(gate, ["python scripts/hold_inventory_authority_cleanup_check.py"], label)

require(prod_check, [
    '"hold_inventory_authority_cleanup"',
    "scripts/hold_inventory_authority_cleanup_check.py",
    "Validate HOLD inventory & authority cleanup",
], "Production business acceptance source authority")

if errors:
    print("HOLD INVENTORY & AUTHORITY CLEANUP: FAIL")
    for error in errors:
        print(" -", error)
    sys.exit(1)

print("HOLD INVENTORY & AUTHORITY CLEANUP: PASS")
print(" - one current Production HOLD backlog is authoritative")
print(" - provider, owner and unavailable evidence remain distinct")
print(" - stale launch-era blocker wording is removed")
print(" - source/runtime GREEN cannot fabricate closure of external evidence")
print(" - no schema, customer, provider, accounting, inventory or destructive-storage mutation is authorized")
