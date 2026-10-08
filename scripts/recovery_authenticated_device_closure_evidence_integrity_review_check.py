#!/usr/bin/env python3
"""Build 540 source authority for Recovery & Authenticated Device Closure Evidence Integrity Review."""
from pathlib import Path
import re, subprocess, sys
ROOT=Path(__file__).resolve().parents[1]
errors=[]
def read(path):
    p=ROOT/path
    if not p.is_file(): errors.append(f"missing required file: {path}"); return ""
    return p.read_text(encoding="utf-8",errors="ignore")
def require(text,needles,label):
    for needle in needles:
        if needle not in text: errors.append(f"{label} missing {needle!r}")

helper=read("functions/api/_lib/recovery-authenticated-device-closure-evidence-integrity-review.js")
endpoint=read("functions/api/admin/recovery_authenticated_device_closure_review.js")
consolidated=read("functions/api/admin/launch_readiness_consolidated.js")
client=read("assets/launch-readiness-consolidation.js")
page=read("admin-launch-readiness.html"); copy=read("admin-launch-readiness/index.html")
doc=read("BUILD540_RECOVERY_AUTHENTICATED_DEVICE_CLOSURE_EVIDENCE_INTEGRITY_REVIEW.md")
roadmap=read("FORWARD_BUILD_ROADMAP_536_545.md"); queue=read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff=read("AI_PROJECT_HANDOFF.md"); readme=read("README.md"); blockers=read("STARTUP_GO_LIVE_BLOCKERS.md")
docindex=read("DOC_INDEX.md"); dev=read(".github/workflows/development-source-gate.yml")
prod=read(".github/workflows/production-business-acceptance-authority.yml")
prodcheck=read("scripts/production_business_acceptance_check.py")
workflow=read(".github/workflows/recovery-authenticated-device-closure-evidence-integrity-review-authority.yml")

if page!=copy: errors.append("Build 540 protected route copies diverged")
if len(re.findall(r"<h1\b",page,re.I))!=1: errors.append("Build 540 page must retain exactly one H1")
require(helper,["recovery_authenticated_device_closure_integrity_build: 540",'recovery_authenticated_device_closure_integrity_authority: "recovery_authenticated_device_closure_evidence_integrity_review"','"closure_integrity_current"','"retained_freshness_review_required"','"recovery_source_identity_review_required"','"recovery_source_identity_drift_review_required"','"authenticated_device_identity_review_required"','"authenticated_device_identity_drift_review_required"',"recovery_and_authenticated_device_populations_joined: false","source_runtime_green_can_prove_recovery_or_device_closure: false","production_restore_performed: false","current_negative_overridden_by_historical_acceptance: false","persistent_telemetry: false"],"Build 540 helper")
for text,label in [(endpoint,"Build 540 endpoint"),(consolidated,"Build 540 consolidated endpoint")]:
    require(text,["buildRecoveryAuthenticatedDeviceClosureEvidenceIntegrityReview","recovery_authenticated_device_closure_integrity_build:540",'recovery_authenticated_device_closure_integrity_authority:"recovery_authenticated_device_closure_evidence_integrity_review"',"recovery_authenticated_device_closure_evidence_integrity_review:"],label)
require(client,["closureIntegrity=data.recovery_authenticated_device_closure_evidence_integrity_review||{}",'metric("Build 540 closure evidence integrity",closureIntegrity.status||"retained_freshness_review_required")'],"Build 540 client")
require(page,['data-build540="recovery-authenticated-device-closure-evidence-integrity-review"',"Build 540 · Recovery &amp; Authenticated Device Closure Evidence Integrity Review","Recovery and authenticated-device populations remain separate"],"Build 540 page")
require(doc,["# Build 540 — Recovery & Authenticated Device Closure Evidence Integrity Review","bounded non-Production recovery trace","role/device/browser","Build 541 — Maintenance & Fleet Continuation Evidence Integrity Review"],"Build 540 contract")
require(roadmap,["### Build 540 — Recovery & Authenticated Device Closure Evidence Integrity Review","### Build 541 — Maintenance & Fleet Continuation Evidence Integrity Review","no Production restore or automatic HOLD mutation"],"renewed roadmap")
require(queue,["**Build 540 — Recovery & Authenticated Device Closure Evidence Integrity Review** is the active bounded release.","**Build 541 — Maintenance & Fleet Continuation Evidence Integrity Review** is next","BUILD540_RECOVERY_AUTHENTICATED_DEVICE_CLOSURE_EVIDENCE_INTEGRITY_REVIEW.md","Production deployment/runtime/business acceptance"],"release queue")
require(handoff,["**Build 540 — Recovery & Authenticated Device Closure Evidence Integrity Review** is the active bounded release.","**Build 541 — Maintenance & Fleet Continuation Evidence Integrity Review** is next","BUILD540_RECOVERY_AUTHENTICATED_DEVICE_CLOSURE_EVIDENCE_INTEGRITY_REVIEW.md","recovery_authenticated_device_closure_evidence_integrity_review_check.py"],"project handoff")
require(readme,["Current source direction: **Build 540 — Recovery & Authenticated Device Closure Evidence Integrity Review**.","BUILD540_RECOVERY_AUTHENTICATED_DEVICE_CLOSURE_EVIDENCE_INTEGRITY_REVIEW.md","scripts/recovery_authenticated_device_closure_evidence_integrity_review_check.py","Production is not considered GREEN from source promotion alone."],"README")
require(blockers,["Build 540 adds read-only recovery/authenticated-device closure evidence integrity review","bounded non-Production recovery trace","authenticated role/device/browser","No Production restore"],"canonical HOLD backlog")
require(docindex,["BUILD540_RECOVERY_AUTHENTICATED_DEVICE_CLOSURE_EVIDENCE_INTEGRITY_REVIEW.md","current bounded release contract"],"documentation index")
for text,label in [(dev,"Development Source Gate"),(prod,"Production Business Acceptance")]:
    require(text,["python -m py_compile scripts/recovery_authenticated_device_closure_evidence_integrity_review_check.py","node --check scripts/recovery_authenticated_device_closure_evidence_integrity_review_test.mjs","node --check functions/api/_lib/recovery-authenticated-device-closure-evidence-integrity-review.js","python scripts/recovery_authenticated_device_closure_evidence_integrity_review_check.py","node scripts/recovery_authenticated_device_closure_evidence_integrity_review_test.mjs"],label)
require(prodcheck,['"recovery_authenticated_device_closure_evidence_integrity_review"',"scripts/recovery_authenticated_device_closure_evidence_integrity_review_check.py","scripts/recovery_authenticated_device_closure_evidence_integrity_review_test.mjs"],"central Production acceptance")
require(workflow,["Recovery & Authenticated Device Closure Evidence Integrity Review Authority","python scripts/recovery_authenticated_device_closure_evidence_integrity_review_check.py","node scripts/recovery_authenticated_device_closure_evidence_integrity_review_test.mjs","Bounded non-Production recovery trace: EXACT OR REVIEW","Authenticated role/device/browser trace: EXACT OR REVIEW","Production restore / authenticated-session mutation: NONE"],"Build 540 workflow")
migrations=[p for p in ROOT.rglob("*.sql") if re.search(r"(?:^|[^0-9])540(?:[^0-9]|$)",p.name)]
if migrations: errors.append("Build 540 must not introduce a schema migration: "+", ".join(str(p.relative_to(ROOT)) for p in migrations))
for path in ["functions/api/_lib/recovery-authenticated-device-closure-evidence-integrity-review.js","functions/api/admin/recovery_authenticated_device_closure_review.js","functions/api/admin/launch_readiness_consolidated.js","assets/launch-readiness-consolidation.js","scripts/recovery_authenticated_device_closure_evidence_integrity_review_test.mjs"]:
    proc=subprocess.run(["node","--check",path],cwd=ROOT,text=True,capture_output=True)
    if proc.returncode: errors.append(f"{path} syntax failed: {proc.stderr.strip() or proc.stdout.strip()}")
if errors:
    print("BUILD 540 RECOVERY & AUTHENTICATED DEVICE CLOSURE EVIDENCE INTEGRITY REVIEW AUTHORITY: FAIL")
    for error in errors: print(" -",error)
    sys.exit(1)
for command in [["node","scripts/recovery_authenticated_device_closure_evidence_freshness_review_test.mjs"],["node","scripts/recovery_authenticated_device_closure_evidence_integrity_review_test.mjs"]]:
    proc=subprocess.run(command,cwd=ROOT,text=True,capture_output=True)
    if proc.returncode:
        print("BUILD 540 RECOVERY & AUTHENTICATED DEVICE CLOSURE EVIDENCE INTEGRITY REVIEW AUTHORITY: FAIL")
        print(proc.stderr.strip() or proc.stdout.strip())
        sys.exit(proc.returncode)
print("BUILD 540 RECOVERY & AUTHENTICATED DEVICE CLOSURE EVIDENCE INTEGRITY REVIEW AUTHORITY: PASS")
print(" - Build 530 freshness remains the retained authority")
print(" - bounded non-Production recovery identity is exact or fails closed to its owning HOLD")
print(" - authenticated role/device/browser identity is exact or fails closed to its owning HOLD")
print(" - current negative device evidence is never overridden by historical acceptance")
print(" - source/runtime GREEN cannot manufacture recovery or device closure")
print(" - Production restore/auth-session/HOLD/Supabase/schema/storage/telemetry mutation: NONE")
