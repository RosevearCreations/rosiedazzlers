#!/usr/bin/env python3
"""Build 469 Maintenance & Fleet Controlled Pilot Activation Readiness source authority."""
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
contract=read("BUILD469_MAINTENANCE_FLEET_CONTROLLED_PILOT_ACTIVATION_READINESS.md")
test=read("scripts/maintenance_fleet_controlled_pilot_activation_readiness_test.mjs")
workflow=read(".github/workflows/maintenance-fleet-controlled-pilot-activation-readiness-authority.yml")
dev_gate=read(".github/workflows/development-source-gate.yml")
prod_gate=read(".github/workflows/production-business-acceptance-authority.yml")
maintenance=json.loads(read("config/maintenance-plan-business-rulebook.json") or "{}")
fleet=json.loads(read("config/fleet-business-rulebook.json") or "{}")

require(helper,[
 "controlled_pilot_readiness_build:469",
 'controlled_pilot_authority:"maintenance_fleet_controlled_pilot_activation_readiness"',
 "controlled_pilot_readiness:{",
 'status:controlledPilotReady?"operator_review_ready":"owner_action"',
 "decision_package_ready:controlledPilotReady",
 "owner_pilot_authorization_required:true",
 "owner_pilot_authorization_recorded:false",
 "pilot_activation_allowed:false",
 "customer_facing_automation_allowed:false",
 "participant_selection_is_manual:true",
 "current_date_slot_must_be_revalidated:true",
 'availability_authority:clean(capacity.availability_authority)||"/api/availability"',
 'collision_revalidation_authority:clean(capacity.collision_revalidation_authority)||"/api/checkout"',
 "participant_limit_inferred:false",
 "pilot_duration_inferred:false",
 "service_area_expansion_allowed:false",
 "guaranteed_capacity_allowed:false",
 "price_override_allowed:false",
 "discount_override_allowed:false",
 "invoice_term_override_allowed:false",
 "capacity_reservation_performed:false",
 "participant_limit:null",
 "duration_days:null"
],"Build 469 helper")
require(endpoint,[
 "controlled_pilot_readiness_build:469",
 'controlled_pilot_authority:"maintenance_fleet_controlled_pilot_activation_readiness"',
 "GET,HEAD,OPTIONS"
],"Build 469 endpoint")
require(client,[
 "Controlled-pilot activation decision",
 "controlledPilotReadiness",
 "Explicit owner pilot authorization",
 "/api/availability",
 "/api/checkout"
],"Build 469 workbench client")
require(page,[
 'data-build469="maintenance-fleet-controlled-pilot-activation-readiness"',
 "Controlled pilot activation readiness",
 'id="controlledPilotReadiness"',
 "/api/availability",
 "/api/checkout"
],"Build 469 retained workbench surface")
if page!=copy: errors.append("Build 469 workbench route copy drift")
if len(re.findall(r"<h1\b",page,re.I))!=1: errors.append("Build 469 workbench must contain exactly one H1")
require(contract,[
 "# Build 469 — Maintenance & Fleet Controlled Pilot Activation Readiness",
 "config/maintenance-plan-business-rulebook.json",
 "config/fleet-business-rulebook.json",
 "operator_review_ready",
 "owner_action",
 "explicit owner pilot authorization",
 "/api/availability",
 "/api/checkout",
 "Build 470 — Local Search Provider Window & Attribution Closure"
],"Build 469 contract")
require(workflow,[
 "Build 469 — Maintenance & Fleet Controlled Pilot Activation Readiness Authority",
 "python scripts/maintenance_fleet_controlled_pilot_activation_readiness_check.py",
 "node scripts/maintenance_fleet_controlled_pilot_activation_readiness_test.mjs"
],"Build 469 workflow")
for gate,label in ((dev_gate,"Development source gate"),(prod_gate,"Production business acceptance")):
 require(gate,[
  "python -m py_compile scripts/maintenance_fleet_controlled_pilot_activation_readiness_check.py",
  "node --check scripts/maintenance_fleet_controlled_pilot_activation_readiness_test.mjs",
  "python scripts/maintenance_fleet_controlled_pilot_activation_readiness_check.py",
  "node scripts/maintenance_fleet_controlled_pilot_activation_readiness_test.mjs"
 ],label)

if maintenance.get("status")!="awaiting_business_approval": errors.append("Build 469 must not approve maintenance rulebook")
if fleet.get("status")!="awaiting_business_approval": errors.append("Build 469 must not approve fleet rulebook")
for domain,row in (maintenance.get("decisions") or {}).items():
 if (row or {}).get("approved") is not False: errors.append(f"maintenance domain unexpectedly approved: {domain}")
for domain,row in (fleet.get("decisions") or {}).items():
 if (row or {}).get("approved") is not False: errors.append(f"fleet domain unexpectedly approved: {domain}")

for token in ['method:"POST"','method:"PATCH"','method:"DELETE"',"setInterval("]:
 if token in client: errors.append(f"Build 469 client contains forbidden mutation/polling token {token!r}")

commands=[
 ["node","--check","functions/api/_lib/maintenance-fleet-owner-approval.js"],
 ["node","--check","functions/api/admin/maintenance_fleet_owner_approval.js"],
 ["node","--check","assets/build439-maintenance-fleet-owner-approval.js"],
 ["node","--check","scripts/maintenance_fleet_controlled_pilot_activation_readiness_test.mjs"],
 ["node","scripts/maintenance_fleet_controlled_pilot_activation_readiness_test.mjs"]
]
for command in commands:
 proc=subprocess.run(command,cwd=ROOT,text=True,capture_output=True)
 if proc.returncode!=0: errors.append(f"{' '.join(command)} failed: {proc.stderr.strip() or proc.stdout.strip()}")

if errors:
 print("MAINTENANCE & FLEET CONTROLLED PILOT ACTIVATION READINESS AUTHORITY: FAIL")
 for error in errors: print(" -",error)
 raise SystemExit(1)
print("MAINTENANCE & FLEET CONTROLLED PILOT ACTIVATION READINESS AUTHORITY: PASS")
print(" - retained owner-decision and commercial activation readiness systems reused")
print(" - current unapproved rulebooks remain truthful owner_action evidence")
print(" - pilot participant and duration bounds remain explicit owner decisions, never inferred")
print(" - live availability and checkout collision revalidation remain mandatory")
print(" - customer-facing automation, booking, discount, invoice, billing, provider and capacity mutations remain locked")
