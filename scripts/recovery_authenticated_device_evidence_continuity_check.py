#!/usr/bin/env python3
"""Build 490 Recovery & Authenticated Device Evidence Continuity authority."""
from pathlib import Path
import re, subprocess, sys

ROOT=Path(__file__).resolve().parents[1]
errors=[]
def read(path):
    p=ROOT/path
    if not p.is_file():
        errors.append(f"missing required file: {path}")
        return ""
    return p.read_text(encoding="utf-8",errors="ignore")
def require(text,needles,label):
    for needle in needles:
        if needle not in text:
            errors.append(f"{label} missing {needle!r}")

helper=read("functions/api/_lib/recovery-authenticated-device-evidence-continuity.js")
endpoint=read("functions/api/admin/recovery_authenticated_device_evidence_continuity.js")
launch=read("functions/api/admin/launch_readiness_consolidated.js")
asset=read("assets/launch-readiness-consolidation.js")
contract=read("BUILD490_RECOVERY_AUTHENTICATED_DEVICE_EVIDENCE_CONTINUITY.md")
roadmap=read("FORWARD_BUILD_ROADMAP_486_495.md")
queue=read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff=read("AI_PROJECT_HANDOFF.md")
readme=read("README.md")
blockers=read("STARTUP_GO_LIVE_BLOCKERS.md")
dev=read(".github/workflows/development-source-gate.yml")
prod=read(".github/workflows/production-business-acceptance-authority.yml")
workflow=read(".github/workflows/recovery-authenticated-device-evidence-continuity-authority.yml")

require(helper,[
  "continuity_enrichment_build: 490",
  'continuity_authority: "recovery_authenticated_device_evidence_continuity"',
  "recovery_and_device_populations_joined: false",
  "recovery_drill_must_remain_bounded_nonproduction: true",
  "current_negative_device_observation_overrides_historical_acceptance: true",
  "direct_authenticated_role_device_browser_observation_required: true",
  "historical_acceptance_can_prove_current_device_health: false",
  "production_restore_performed: false",
  "automated_browser_farm_created: false",
  "canonical_hold_mutated: false",
  "permanent_polling: false"
],"Build 490 helper")
require(endpoint,[
  "getRecoveryEvidence","getAuthenticatedDeviceEvidence","buildRecoveryAuthenticatedDeviceEvidenceContinuity",
  '"X-Rosie-Recovery-Device-Continuity":"build-490-read-only"',
  "GET,HEAD,OPTIONS"
],"Build 490 endpoint")
for forbidden in ["onRequestPost","onRequestPatch","onRequestDelete","setInterval("]:
    if forbidden in endpoint:
        errors.append(f"Build 490 endpoint contains forbidden mutation token {forbidden!r}")
require(launch,[
  "buildRecoveryAuthenticatedDeviceEvidenceContinuity",
  "recovery_authenticated_device_evidence_continuity",
  'current_recovery_device_continuity_authority: "recovery_authenticated_device_evidence_continuity"'
],"Launch Readiness composition")
require(asset,[
  "Build 490 continuity",
  "Recovery / device continuity",
  "Current negative device observations override historical acceptance"
],"Launch Readiness UI")
require(contract,[
  "# Build 490 — Recovery & Authenticated Device Evidence Continuity",
  "bounded non-Production",
  "current negative",
  "role/device/browser",
  "No Production restore",
  "Build 491 — Maintenance & Fleet Pilot Outcome Evidence"
],"Build 490 contract")
require(roadmap,[
  "### Build 490 — Recovery & Authenticated Device Evidence Continuity",
  "### Build 491 — Maintenance & Fleet Pilot Outcome Evidence"
],"renewed roadmap")
require(queue,[
  "**Build 507 — Winter Booking & Quote Rule Controlled Activation Decision** is the active bounded release.",
  "**Build 508 — Controlled-Environment Operational Readiness & Routing Continuity** is next",
  "BUILD490_RECOVERY_AUTHENTICATED_DEVICE_EVIDENCE_CONTINUITY.md",
  "it has not run out"
],"Build 490 queue")
require(handoff,[
  "**Build 507 — Winter Booking & Quote Rule Controlled Activation Decision** is the active bounded release.",
  "BUILD490_RECOVERY_AUTHENTICATED_DEVICE_EVIDENCE_CONTINUITY.md",
  "recovery_authenticated_device_evidence_continuity_check.py"
],"Build 490 handoff")
require(readme,[
  "Current source direction: **Build 507 — Winter Booking & Quote Rule Controlled Activation Decision**.",
  "BUILD490_RECOVERY_AUTHENTICATED_DEVICE_EVIDENCE_CONTINUITY.md",
  "recovery_authenticated_device_evidence_continuity_check.py",
  "Production is not considered GREEN from source promotion alone."
],"Build 490 README")
require(blockers,["Recovery / backup evidence","Independent device / visual evidence"],"canonical HOLD backlog")
for text,label in [(dev,"Development Source Gate"),(prod,"Production Business Acceptance")]:
    require(text,[
      "python scripts/recovery_authenticated_device_evidence_continuity_check.py",
      "node scripts/recovery_authenticated_device_evidence_continuity_test.mjs"
    ],label)
require(workflow,[
  "Build 490 — Recovery & Authenticated Device Evidence Continuity Authority",
  "recovery-authenticated-device-evidence-continuity",
  "python scripts/recovery_authenticated_device_evidence_continuity_check.py",
  "node scripts/recovery_authenticated_device_evidence_continuity_test.mjs"
],"Build 490 workflow")

migrations=[p for p in ROOT.rglob("*.sql") if re.search(r"(?:^|[^0-9])490(?:[^0-9]|$)",p.name)]
if migrations:
    errors.append("Build 490 must not introduce schema migration: "+", ".join(str(p.relative_to(ROOT)) for p in migrations))

for p in [
  "functions/api/_lib/recovery-authenticated-device-evidence-continuity.js",
  "functions/api/admin/recovery_authenticated_device_evidence_continuity.js",
  "functions/api/admin/launch_readiness_consolidated.js",
  "assets/launch-readiness-consolidation.js",
  "scripts/recovery_authenticated_device_evidence_continuity_test.mjs"
]:
    r=subprocess.run(["node","--check",p],cwd=ROOT,text=True,capture_output=True)
    if r.returncode:
        errors.append(f"{p} syntax failed: {r.stderr.strip() or r.stdout.strip()}")

for cmd in [
  ["node","scripts/recovery_authenticated_device_evidence_continuity_test.mjs"],
  ["python","scripts/recovery_drill_evidence_refresh_closure_review_check.py"],
  ["node","scripts/recovery_drill_evidence_refresh_closure_review_test.mjs"],
  ["python","scripts/recovery_evidence_validation_drill_decision_readiness_check.py"],
  ["node","scripts/recovery_evidence_validation_drill_decision_readiness_test.mjs"],
  ["python","scripts/authenticated_device_observation_refresh_regression_triage_check.py"],
  ["node","scripts/authenticated_device_observation_refresh_regression_triage_test.mjs"],
  ["python","scripts/authenticated_device_regression_closure_check.py"],
  ["node","scripts/authenticated_device_regression_closure_test.mjs"]
]:
    r=subprocess.run(cmd,cwd=ROOT,text=True,capture_output=True)
    if r.returncode:
        errors.append(f"retained authority failed: {' '.join(cmd)}: {r.stderr.strip() or r.stdout.strip()}")

if errors:
    print("BUILD 490 RECOVERY & AUTHENTICATED DEVICE EVIDENCE CONTINUITY AUTHORITY: FAIL")
    for e in errors: print(" -",e)
    sys.exit(1)

print("BUILD 490 RECOVERY & AUTHENTICATED DEVICE EVIDENCE CONTINUITY AUTHORITY: PASS")
print(" - recovery evidence and authenticated device observations remain separate owner-observed populations")
print(" - bounded non-Production recovery drill rules remain intact")
print(" - current negative device evidence overrides retained historical acceptance")
print(" - explicit role/device/browser coverage remains visible")
print(" - no Production restore, browser farm, remediation execution, HOLD mutation or permanent polling is authorized")
