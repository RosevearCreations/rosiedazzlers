#!/usr/bin/env python3
"""Build 500 source authority for Recovery Drill & Authenticated Device Observation Execution Evidence."""
from pathlib import Path
import re, subprocess, sys
ROOT=Path(__file__).resolve().parents[1]; errors=[]
def read(path):
    p=ROOT/path
    if not p.is_file(): errors.append(f"missing required file: {path}"); return ""
    return p.read_text(encoding="utf-8",errors="ignore")
def require(text,needles,label):
    for needle in needles:
        if needle not in text: errors.append(f"{label} missing {needle!r}")
helper=read("functions/api/_lib/recovery-authenticated-device-observation-execution-evidence.js")
endpoint=read("functions/api/admin/recovery_authenticated_device_observation_execution_evidence.js")
proof=read("functions/api/_lib/recovery-export-operational-proof.js")
launch=read("functions/api/admin/launch_readiness_consolidated.js")
asset=read("assets/launch-readiness-consolidation.js")
contract=read("BUILD500_RECOVERY_DRILL_AUTHENTICATED_DEVICE_OBSERVATION_EXECUTION_EVIDENCE.md")
roadmap=read("FORWARD_BUILD_ROADMAP_496_505.md")
queue=read("AUTONOMOUS_RELEASE_QUEUE.md"); handoff=read("AI_PROJECT_HANDOFF.md"); readme=read("README.md"); blockers=read("STARTUP_GO_LIVE_BLOCKERS.md")
dev=read(".github/workflows/development-source-gate.yml"); prod=read(".github/workflows/production-business-acceptance-authority.yml"); prod_check=read("scripts/production_business_acceptance_check.py")
workflow=read(".github/workflows/recovery-authenticated-device-observation-execution-evidence-authority.yml")
require(helper,["execution_evidence_build: 500",'execution_evidence_authority: "recovery_authenticated_device_observation_execution_evidence"',"post_observation_requirements_complete","bounded_nonproduction_scope_explicit","recovery_and_device_populations_joined: false","direct_authenticated_role_device_browser_observation_required: true","source_checks_can_prove_observation_execution: false","production_restore_performed: false","recovery_drill_executed_by_this_build: false","automated_browser_farm_created: false","canonical_hold_mutated: false","permanent_polling: false"],"Build 500 helper")
require(proof,["bounded_nonproduction_scope_explicit","observer_role_present","backup_reference_present","retention_reference_present","outcome_recorded","outcome_classification","abort_or_deviation_recorded","evidence_note_exposed: false"],"retained recovery operational proof")
require(endpoint,["getRecoveryEvidence","getRecoveryOperationalProof","getAuthenticatedDeviceEvidence","buildRecoveryAuthenticatedDeviceObservationExecutionEvidence",'"X-Rosie-Recovery-Device-Execution-Evidence":"build-500-read-only"',"GET,HEAD,OPTIONS"],"Build 500 endpoint")
for forbidden in ["onRequestPost","onRequestPatch","onRequestDelete","setInterval("]:
    if forbidden in endpoint: errors.append(f"Build 500 endpoint contains forbidden mutation token {forbidden!r}")
require(launch,["buildRecoveryAuthenticatedDeviceObservationExecutionEvidence","recovery_authenticated_device_observation_execution_evidence",'current_recovery_device_execution_evidence_authority: "recovery_authenticated_device_observation_execution_evidence"'],"Launch Readiness composition")
require(asset,["Build 500 execution evidence","Recovery post-observation evidence","explicitly performed bounded non-Production observation"],"Launch Readiness UI")
require(contract,["# Build 500 — Recovery Drill & Authenticated Device Observation Execution Evidence","bounded **non-Production**","Customer;","Detailer;","Operations;","Admin.","Recovery evidence and authenticated-device evidence remain separate populations.","Build 501 — Maintenance & Fleet Pilot Outcome Continuity Review"],"Build 500 contract")
require(roadmap,["### Build 500 — Recovery Drill & Authenticated Device Observation Execution Evidence","### Build 501 — Maintenance & Fleet Pilot Outcome Continuity Review"],"renewed roadmap")
require(queue,["**Build 506 — Seasonal Capability & Public Claim Activation Decision** is the active bounded release.","**Build 507 — Winter Booking & Quote Rule Controlled Activation Decision** is next","BUILD500_RECOVERY_DRILL_AUTHENTICATED_DEVICE_OBSERVATION_EXECUTION_EVIDENCE.md","BUILD490_RECOVERY_AUTHENTICATED_DEVICE_EVIDENCE_CONTINUITY.md","it has not run out"],"Build 500 queue")
require(handoff,["**Build 506 — Seasonal Capability & Public Claim Activation Decision** is the active bounded release.","BUILD500_RECOVERY_DRILL_AUTHENTICATED_DEVICE_OBSERVATION_EXECUTION_EVIDENCE.md","recovery_authenticated_device_observation_execution_evidence_check.py","BUILD490_RECOVERY_AUTHENTICATED_DEVICE_EVIDENCE_CONTINUITY.md"],"Build 500 handoff")
require(readme,["Current source direction: **Build 506 — Seasonal Capability & Public Claim Activation Decision**.","BUILD500_RECOVERY_DRILL_AUTHENTICATED_DEVICE_OBSERVATION_EXECUTION_EVIDENCE.md","recovery_authenticated_device_observation_execution_evidence_check.py","Production is not considered GREEN from source promotion alone."],"Build 500 README")
require(blockers,["Recovery / backup evidence","Independent device / visual evidence","Build 500 recognizes execution evidence","Build 500 requires current direct authenticated","Build 500 adds read-only recovery-drill and authenticated-device observation execution evidence"],"canonical HOLD backlog")
for text,label in [(dev,"Development Source Gate"),(prod,"Production Business Acceptance")]:
    require(text,["python scripts/recovery_authenticated_device_observation_execution_evidence_check.py","node scripts/recovery_authenticated_device_observation_execution_evidence_test.mjs"],label)
require(prod_check,['"recovery_authenticated_device_observation_execution_evidence"','"scripts/recovery_authenticated_device_observation_execution_evidence_check.py"','"scripts/recovery_authenticated_device_observation_execution_evidence_test.mjs"',"Validate recovery drill & authenticated device observation execution evidence authority"],"Production business acceptance checker")
require(workflow,["Recovery Drill & Authenticated Device Observation Execution Evidence Authority","recovery-authenticated-device-observation-execution-evidence","python scripts/recovery_authenticated_device_observation_execution_evidence_check.py","node scripts/recovery_authenticated_device_observation_execution_evidence_test.mjs"],"Build 500 workflow")
migrations=[p for p in ROOT.rglob("*.sql") if re.search(r"(?:^|[^0-9])500(?:[^0-9]|$)",p.name)]
if migrations: errors.append("Build 500 must not introduce schema migration: "+", ".join(str(p.relative_to(ROOT)) for p in migrations))
for p in ["functions/api/_lib/recovery-export-operational-proof.js","functions/api/_lib/recovery-authenticated-device-observation-execution-evidence.js","functions/api/admin/recovery_authenticated_device_observation_execution_evidence.js","functions/api/admin/launch_readiness_consolidated.js","assets/launch-readiness-consolidation.js","scripts/recovery_authenticated_device_observation_execution_evidence_test.mjs"]:
    r=subprocess.run(["node","--check",p],cwd=ROOT,text=True,capture_output=True)
    if r.returncode: errors.append(f"{p} syntax failed: {r.stderr.strip() or r.stdout.strip()}")
for cmd in [["node","scripts/recovery_authenticated_device_observation_execution_evidence_test.mjs"],["python","scripts/recovery_authenticated_device_evidence_continuity_check.py"],["node","scripts/recovery_authenticated_device_evidence_continuity_test.mjs"],["python","scripts/recovery_drill_evidence_refresh_closure_review_check.py"],["node","scripts/recovery_drill_evidence_refresh_closure_review_test.mjs"],["python","scripts/authenticated_device_observation_refresh_regression_triage_check.py"],["node","scripts/authenticated_device_observation_refresh_regression_triage_test.mjs"],["python","scripts/authenticated_device_regression_closure_check.py"],["node","scripts/authenticated_device_regression_closure_test.mjs"]]:
    r=subprocess.run(cmd,cwd=ROOT,text=True,capture_output=True)
    if r.returncode: errors.append(f"retained authority failed: {' '.join(cmd)}: {r.stderr.strip() or r.stdout.strip()}")
if errors:
    print("BUILD 500 RECOVERY DRILL & AUTHENTICATED DEVICE OBSERVATION EXECUTION EVIDENCE AUTHORITY: FAIL")
    for e in errors: print(" -",e)
    sys.exit(1)
print("BUILD 500 RECOVERY DRILL & AUTHENTICATED DEVICE OBSERVATION EXECUTION EVIDENCE AUTHORITY: PASS")
print(" - recovery execution evidence requires current explicit bounded non-Production post-observation attribution")
print(" - current direct Customer/Detailer/Operations/Admin role/device/browser observations remain explicit")
print(" - recovery and authenticated-device populations remain separate")
print(" - current negative device evidence overrides historical acceptance")
print(" - no Production restore, drill execution by this build, browser farm, remediation, HOLD mutation or permanent polling is authorized")
