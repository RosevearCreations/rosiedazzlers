#!/usr/bin/env python3
"""Build 416 controlled soft-launch / real-world acceptance source authority."""
from pathlib import Path
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

def require(text, needles, label):
    for needle in needles:
        if needle not in text:
            errors.append(f"{label} missing {needle!r}")

helper=read("functions/api/_lib/launch-readiness-consolidation.js")
endpoint=read("functions/api/admin/launch_readiness_consolidated.js")
asset=read("assets/launch-readiness-consolidation.js")
page=read("admin-launch-readiness.html")
copy=read("admin-launch-readiness/index.html")
contract=read("BUILD416_CONTROLLED_SOFT_LAUNCH_REAL_WORLD_ACCEPTANCE.md")
queue=read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff=read("AI_PROJECT_HANDOFF.md")
readme=read("README.md")
dev_gate=read(".github/workflows/development-source-gate.yml")
prod_gate=read(".github/workflows/production-business-acceptance-authority.yml")
focused=read(".github/workflows/controlled-soft-launch-acceptance-authority.yml")
prod_check=read("scripts/production_business_acceptance_check.py")

require(helper,["CONTROLLED_PILOT_EVIDENCE","controlled_soft_launch","real_customer_journey_inferred: false","invite_only_scope_inferred: false","customer_identity_exposed: false","automatic_outreach_performed: false",'"email_delivery"','"incident_closeout"',"observed_real_jobs","evidence_ready_jobs","participant_authorization_inferred: false","automatic_booking_created: false","automatic_message_sent: false"],"Build 416 helper")
require(endpoint,['getJobHandoffEvidence','JSON.stringify({ days: 45 })','build: 416','authority: "controlled_soft_launch_real_world_acceptance"','retained_authority: "launch_readiness_consolidation_next_roadmap_renewal"',"job_handoff_evidence"],"Build 416 endpoint")
require(asset,["Controlled soft launch & real-world acceptance","Observed jobs","Evidence-ready jobs","Source checks never create a real customer journey","Participant authorization is never inferred","customer identity is not returned"],"Build 416 client")
require(page,['data-build416="controlled-soft-launch-real-world-acceptance"',"Build 416 · Controlled soft launch","invite-only real-world booking","Build 416 acceptance boundary","does not create a booking","authorize a participant","send customer outreach"],"Build 416 page")
if page!=copy: errors.append("admin-launch-readiness route copy drift")
require(contract,["controlled pilot itself","invite-only","known-customer","Customer identity is not returned","no schema migration","no automatic customer outreach","no payment/refund/provider transaction","Build 417"],"Build 416 contract")
for text,label in [(queue,"queue"),(handoff,"handoff"),(readme,"README")]:
    require(text,["BUILD416_CONTROLLED_SOFT_LAUNCH_REAL_WORLD_ACCEPTANCE.md"],label)
for gate,label in [(dev_gate,"Development source gate"),(prod_gate,"Production authority"),(focused,"focused authority")]:
    require(gate,["controlled_soft_launch_acceptance_check.py","controlled_soft_launch_acceptance_test.mjs"],label)
require(prod_check,['"controlled_soft_launch"',"scripts/controlled_soft_launch_acceptance_check.py","scripts/controlled_soft_launch_acceptance_test.mjs","Validate controlled soft launch acceptance authority"],"Production business acceptance source authority")
for needle in ["setInterval(","location.reload("]:
    if needle in asset: errors.append(f"Build 416 client contains automatic polling/reload primitive: {needle}")
for needle in ['method: "POST"',"method:'POST'",'method: "DELETE"',"method:'DELETE'",'method: "PATCH"',"method:'PATCH'"]:
    if needle in asset: errors.append(f"Build 416 client contains mutation primitive: {needle}")
for path in ["functions/api/_lib/launch-readiness-consolidation.js","functions/api/admin/launch_readiness_consolidated.js","assets/launch-readiness-consolidation.js","scripts/controlled_soft_launch_acceptance_test.mjs"]:
    proc=subprocess.run(["node","--check",path],cwd=ROOT,text=True,capture_output=True)
    if proc.returncode!=0: errors.append(f"{path} syntax failed: {proc.stderr.strip() or proc.stdout.strip()}")
test=subprocess.run(["node","scripts/controlled_soft_launch_acceptance_test.mjs"],cwd=ROOT,text=True,capture_output=True)
if test.returncode!=0: errors.append(f"controlled soft launch test failed: {test.stderr.strip() or test.stdout.strip()}")
if errors:
    print("CONTROLLED SOFT LAUNCH ACCEPTANCE AUTHORITY: FAIL")
    for error in errors: print(" -",error)
    sys.exit(1)
print("CONTROLLED SOFT LAUNCH ACCEPTANCE AUTHORITY: PASS")
print(" - invite-only participant scope remains explicit and operator-observed")
print(" - real booking/communication/field/completion/support evidence remains fail-closed")
print(" - customer identity is excluded from the Build 416 capstone payload")
print(" - source acceptance performs no automatic customer/provider/business mutation")
