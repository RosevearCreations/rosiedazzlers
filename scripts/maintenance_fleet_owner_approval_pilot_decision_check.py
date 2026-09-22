#!/usr/bin/env python3
"""Build 479 Maintenance & Fleet Owner Approval & Pilot Decision source authority."""
from pathlib import Path
import json,re,subprocess
ROOT=Path(__file__).resolve().parents[1]; errors=[]

def read(path):
 p=ROOT/path
 if not p.is_file(): errors.append(f"missing required file: {path}"); return ""
 return p.read_text(encoding="utf-8",errors="ignore")

def require(text,needles,label):
 for n in needles:
  if n not in text: errors.append(f"{label} missing {n!r}")

helper=read("functions/api/_lib/maintenance-fleet-owner-approval.js")
endpoint=read("functions/api/admin/maintenance_fleet_owner_approval.js")
client=read("assets/build439-maintenance-fleet-owner-approval.js")
page=read("admin-maintenance-fleet-owner-approval.html")
copy=read("admin-maintenance-fleet-owner-approval/index.html")
contract=read("BUILD479_MAINTENANCE_FLEET_OWNER_APPROVAL_PILOT_DECISION.md")
test=read("scripts/maintenance_fleet_owner_approval_pilot_decision_test.mjs")
workflow=read(".github/workflows/maintenance-fleet-owner-approval-pilot-decision-authority.yml")
queue=read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff=read("AI_PROJECT_HANDOFF.md")
readme=read("README.md")
blockers=read("STARTUP_GO_LIVE_BLOCKERS.md")
dev_gate=read(".github/workflows/development-source-gate.yml")
prod_gate=read(".github/workflows/production-business-acceptance-authority.yml")
maintenance=json.loads(read("config/maintenance-plan-business-rulebook.json") or "{}")
fleet=json.loads(read("config/fleet-business-rulebook.json") or "{}")

require(helper,[
 "pilot_decision_build:479",
 'pilot_decision_authority:"maintenance_fleet_owner_approval_pilot_decision"',
 "pilot_decision_record:{",
 'status:pilotDecisionRecordReady?"pilot_decision_recorded":"owner_action"',
 'decision:ownerPilotDecisionRecorded?explicitPilotDecision:"not_recorded"',
 "owner_pilot_authorization_recorded:ownerPilotAuthorizationRecorded",
 "participant_limit:participantLimit",
 "duration_days:durationDays",
 'mode:"manual"',
 "automatic_selection_allowed:false",
 "customer_auto_enrollment_allowed:false",
 "fleet_auto_activation_allowed:false",
 "current_live_availability_required:true",
 'availability_authority:clean(capacity.availability_authority)||"/api/availability"',
 "checkout_collision_revalidation_required:true",
 'collision_revalidation_authority:clean(capacity.collision_revalidation_authority)||"/api/checkout"',
 "capacity_reservation_allowed:false",
 "pilot_activation_allowed:false",
 "recurring_commitment_activation_allowed:false",
 "canonical_hold_mutated:false"
],"Build 479 helper")
require(endpoint,[
 "pilot_decision_build:479",
 'pilot_decision_authority:"maintenance_fleet_owner_approval_pilot_decision"',
 "GET,HEAD,OPTIONS",
 "build-439-449-459-469-479-read-only"
],"Build 479 endpoint")
require(client,[
 "Owner pilot decision record",
 "pilotDecisionRecord",
 "Participant selection",
 "/api/availability",
 "/api/checkout",
 "cannot auto-enroll customers"
],"Build 479 workbench client")
require(page,[
 'data-build479="maintenance-fleet-owner-approval-pilot-decision"',
 "Build 479 · owner approval &amp; pilot decision",
 "Pilot decision record",
 'id="pilotDecisionRecord"',
 "/api/availability",
 "/api/checkout"
],"Build 479 workbench page")
if page!=copy: errors.append("Build 479 workbench route copy drift")
if len(re.findall(r"<h1\b",page,re.I))!=1: errors.append("Build 479 workbench must contain exactly one H1")
require(contract,[
 "# Build 479 — Maintenance & Fleet Owner Approval & Pilot Decision",
 "awaiting_business_approval",
 "pilot_decision_record",
 "owner_action",
 "pilot_decision_recorded",
 "manual",
 "/api/availability",
 "/api/checkout",
 "Build 480 — Local Search Provider Snapshot Continuity & Descriptive Review"
],"Build 479 contract")
require(queue,[
 "BUILD479_MAINTENANCE_FLEET_OWNER_APPROVAL_PILOT_DECISION.md",
 "Build 480 — Local Search Provider Snapshot Continuity & Descriptive Review",
 "it has not run out"
],"Build 479 release queue")
require(handoff,[
 "BUILD479_MAINTENANCE_FLEET_OWNER_APPROVAL_PILOT_DECISION.md",
 "maintenance_fleet_owner_approval_pilot_decision_check.py",
 "maintenance_fleet_owner_approval_pilot_decision_test.mjs"
],"Build 479 handoff")
require(readme,[
 "Build 479 — Maintenance & Fleet Owner Approval & Pilot Decision",
 "BUILD479_MAINTENANCE_FLEET_OWNER_APPROVAL_PILOT_DECISION.md",
 "maintenance_fleet_owner_approval_pilot_decision_check.py"
],"Build 479 README")
require(blockers,[
 "Maintenance / fleet business approval",
 "Build 479",
 "pilot decision"
],"canonical HOLD backlog")
require(workflow,[
 "Build 479 — Maintenance & Fleet Owner Approval & Pilot Decision Authority",
 "python scripts/maintenance_fleet_owner_approval_pilot_decision_check.py",
 "node scripts/maintenance_fleet_owner_approval_pilot_decision_test.mjs"
],"Build 479 workflow")
for gate,label in ((dev_gate,"Development source gate"),(prod_gate,"Production business acceptance")):
 require(gate,[
  "python -m py_compile scripts/maintenance_fleet_owner_approval_pilot_decision_check.py",
  "node --check scripts/maintenance_fleet_owner_approval_pilot_decision_test.mjs",
  "python scripts/maintenance_fleet_owner_approval_pilot_decision_check.py",
  "node scripts/maintenance_fleet_owner_approval_pilot_decision_test.mjs"
 ],label)

if maintenance.get("status")!="awaiting_business_approval": errors.append("Build 479 must not approve maintenance rulebook")
if fleet.get("status")!="awaiting_business_approval": errors.append("Build 479 must not approve fleet rulebook")
for domain,row in (maintenance.get("decisions") or {}).items():
 if (row or {}).get("approved") is not False: errors.append(f"maintenance domain unexpectedly approved: {domain}")
for domain,row in (fleet.get("decisions") or {}).items():
 if (row or {}).get("approved") is not False: errors.append(f"fleet domain unexpectedly approved: {domain}")

for token in ['method:"POST"','method:"PATCH"','method:"DELETE"',"setInterval("]:
 if token in client: errors.append(f"Build 479 client contains forbidden mutation/polling token {token!r}")

commands=[
 ["node","--check","functions/api/_lib/maintenance-fleet-owner-approval.js"],
 ["node","--check","functions/api/admin/maintenance_fleet_owner_approval.js"],
 ["node","--check","assets/build439-maintenance-fleet-owner-approval.js"],
 ["node","--check","scripts/maintenance_fleet_owner_approval_pilot_decision_test.mjs"],
 ["node","scripts/maintenance_fleet_owner_approval_pilot_decision_test.mjs"],
 ["python","scripts/maintenance_fleet_controlled_pilot_activation_readiness_check.py"],
 ["node","scripts/maintenance_fleet_controlled_pilot_activation_readiness_test.mjs"]
]
for command in commands:
 proc=subprocess.run(command,cwd=ROOT,text=True,capture_output=True)
 if proc.returncode!=0: errors.append(f"{' '.join(command)} failed: {proc.stderr.strip() or proc.stdout.strip()}")

if errors:
 print("MAINTENANCE & FLEET OWNER APPROVAL & PILOT DECISION AUTHORITY: FAIL")
 for error in errors: print(" -",error)
 raise SystemExit(1)
print("MAINTENANCE & FLEET OWNER APPROVAL & PILOT DECISION AUTHORITY: PASS")
print(" - canonical rulebook approval remains explicit and unmodified")
print(" - missing owner pilot decision/bounds remain owner_action rather than inferred")
print(" - participant selection remains manual with no customer/fleet auto-activation")
print(" - availability and checkout collision revalidation remain authoritative for every real booking")
print(" - recurring commitment activation and capacity reservation remain locked")
