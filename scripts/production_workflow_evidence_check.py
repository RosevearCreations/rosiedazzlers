#!/usr/bin/env python3
"""Build 419 customer/staff Production workflow evidence source authority."""
from pathlib import Path
import re
import subprocess
import sys

ROOT=Path(__file__).resolve().parents[1]
errors=[]

def read(path):
    target=ROOT/path
    if not target.is_file():
        errors.append(f"missing required file: {path}")
        return ""
    return target.read_text(encoding="utf-8",errors="ignore")

def require(text,needles,label):
    for needle in needles:
        if needle not in text:
            errors.append(f"{label} missing {needle!r}")

helper=read("functions/api/_lib/production-workflow-evidence.js")
endpoint=read("functions/api/admin/production_workflow_evidence.js")
launch_endpoint=read("functions/api/admin/launch_readiness_consolidated.js")
asset=read("assets/launch-readiness-consolidation.js")
page=read("admin-launch-readiness.html")
copy=read("admin-launch-readiness/index.html")
contract=read("BUILD419_CUSTOMER_STAFF_PRODUCTION_WORKFLOW_EVIDENCE.md")
roadmap=read("FORWARD_BUILD_ROADMAP_416_425.md")
queue=read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff=read("AI_PROJECT_HANDOFF.md")
readme=read("README.md")
dev_gate=read(".github/workflows/development-source-gate.yml")
prod_gate=read(".github/workflows/production-business-acceptance-authority.yml")
focused=read(".github/workflows/production-workflow-evidence-authority.yml")
prod_check=read("scripts/production_business_acceptance_check.py")

require(helper,["buildProductionWorkflowEvidence",'"booking_e2e"','"mobile"','"operations"','"accessibility"',"source_checks_are_not_real_device_proof: true","role_access_changed: false","consent_inferred: false","customer_identity_exposed: false","device_or_viewport_language_present","observed_real_jobs"],"Build 419 helper")
require(endpoint,["requireStaffAccess",'capability: "it_diagnostics"',"listLaunchEvidence","getJobHandoffEvidence","JSON.stringify({ days: 45 })","buildProductionWorkflowEvidence","build: 419",'authority: "customer_staff_production_workflow_evidence"',"GET, HEAD, OPTIONS"],"Build 419 endpoint")
require(launch_endpoint,["buildProductionWorkflowEvidence","production_workflow_evidence","build: 419",'authority: "customer_staff_production_workflow_evidence"',"retained_recovery_build: 418","retained_provider_build: 417","retained_build: 416"],"launch readiness composition")
require(asset,["Customer & staff Production workflow evidence","Observed real jobs","real-device / representative-viewport","customer identity and evidence-note contents are not returned","production_workflow_evidence"],"Build 419 client")
require(page,['data-build419="customer-staff-production-workflow-evidence"',"Build 419 · Customer & staff Production workflow evidence",'id="workflowOut"',"Build 419 acceptance boundary","does not create test customers or jobs","does not change staff roles or capabilities","does not infer consent"],"Build 419 page")
if page!=copy: errors.append("admin-launch-readiness route copy drift")
require(contract,["Customer workflow evidence","Detailer workflow evidence","Operations workflow evidence","Admin workflow evidence","real device or representative viewport/width","Evidence-note contents are never returned","no schema migration","Source/Production GREEN may coexist with a workflow-evidence HOLD","Build 420 — Search Console, GBP & Local Acquisition Evidence Closure"],"Build 419 contract")
require(roadmap,["Build 419 — Customer & Staff Production Workflow Evidence","Build 420 — Search Console, GBP & Local Acquisition Evidence Closure"],"active roadmap")
for text,label in [(queue,"queue"),(handoff,"handoff"),(readme,"README")]: require(text,["BUILD419_CUSTOMER_STAFF_PRODUCTION_WORKFLOW_EVIDENCE.md"],label)
for gate,label in [(dev_gate,"Development source gate"),(prod_gate,"Production authority"),(focused,"focused authority")]: require(gate,["production_workflow_evidence_check.py","production_workflow_evidence_test.mjs"],label)
require(prod_check,['"production_workflow_evidence"',"scripts/production_workflow_evidence_check.py","scripts/production_workflow_evidence_test.mjs","Validate customer & staff Production workflow evidence authority"],"Production business acceptance source authority")

for needle in ["setInterval(","location.reload("]:
    if needle in asset: errors.append(f"Build 419 client contains automatic polling/reload primitive: {needle}")
for path in ["functions/api/_lib/production-workflow-evidence.js","functions/api/admin/production_workflow_evidence.js","functions/api/admin/launch_readiness_consolidated.js","assets/launch-readiness-consolidation.js","scripts/production_workflow_evidence_test.mjs"]:
    proc=subprocess.run(["node","--check",path],cwd=ROOT,text=True,capture_output=True)
    if proc.returncode!=0: errors.append(f"{path} syntax failed: {proc.stderr.strip() or proc.stdout.strip()}")
test=subprocess.run(["node","scripts/production_workflow_evidence_test.mjs"],cwd=ROOT,text=True,capture_output=True)
if test.returncode!=0: errors.append(f"Build 419 workflow evidence test failed: {test.stderr.strip() or test.stdout.strip()}")
migrations=[p for p in ROOT.rglob("*.sql") if re.search(r"(?:^|[^0-9])419(?:[^0-9]|$)",p.name)]
if migrations: errors.append("Build 419 must not introduce a database migration: "+", ".join(str(p.relative_to(ROOT)) for p in migrations))
if errors:
    print("CUSTOMER STAFF PRODUCTION WORKFLOW EVIDENCE AUTHORITY: FAIL")
    for error in errors: print(" -",error)
    sys.exit(1)
print("CUSTOMER STAFF PRODUCTION WORKFLOW EVIDENCE AUTHORITY: PASS")
print(" - Customer, Detailer, Operations and Admin observations remain role-specific")
print(" - verified workflow proof requires dated real-device/representative-viewport evidence")
print(" - Detailer observation remains tied to aggregate eligible real-job evidence")
print(" - customer identity and evidence-note contents remain excluded")
print(" - source acceptance changes no role, consent, booking, provider or business state")
