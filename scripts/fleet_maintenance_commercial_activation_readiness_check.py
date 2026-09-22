#!/usr/bin/env python3
"""Build 459 Fleet & Maintenance Commercial Activation Readiness source authority."""
from pathlib import Path
import json,subprocess,re
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
contract=read("BUILD459_FLEET_MAINTENANCE_COMMERCIAL_ACTIVATION_READINESS.md")
maintenance=json.loads(read("config/maintenance-plan-business-rulebook.json") or "{}")
fleet=json.loads(read("config/fleet-business-rulebook.json") or "{}")

require(helper,["activation_readiness_build:459",'activation_authority:"fleet_maintenance_commercial_activation_readiness"',"activation_readiness:{","operator_review_ready","activation_authorization_separate:true","activation_allowed:false","automatic_activation_performed:false","live_capacity_inferred:false","capacity_reservation_performed:false","maintenance_eligibility","maintenance_cadence","maintenance_price","maintenance_capacity","fleet_travel","fleet_discount","fleet_invoicing"],"Build 459 helper")
require(endpoint,["activation_readiness_build:459",'activation_authority:"fleet_maintenance_commercial_activation_readiness"',"GET,HEAD,OPTIONS"],"Build 459 endpoint")
require(client,["Activation-readiness decision","Ready terms:","Readiness is review-only.","activationReadiness"],"Build 459 workbench client")
require(page,['data-build459="fleet-maintenance-commercial-activation-readiness"',"Commercial activation readiness",'id="activationReadiness"',"operator_review_ready"],"Build 459 retained workbench surface")
if page!=copy: errors.append("Build 459 workbench route copy drift")
if len(re.findall(r"<h1\b",page,re.I))!=1: errors.append("Build 459 workbench must contain exactly one H1")
require(contract,["# Build 459 — Fleet & Maintenance Commercial Activation Readiness","config/maintenance-plan-business-rulebook.json","config/fleet-business-rulebook.json","operator_review_ready","Activation boundary","/api/availability","/api/checkout"],"Build 459 contract")

if maintenance.get("status")!="awaiting_business_approval": errors.append("Build 459 must not approve maintenance rulebook")
if fleet.get("status")!="awaiting_business_approval": errors.append("Build 459 must not approve fleet rulebook")
for domain,row in (maintenance.get("decisions") or {}).items():
 if (row or {}).get("approved") is not False: errors.append(f"maintenance domain unexpectedly approved: {domain}")
for domain,row in (fleet.get("decisions") or {}).items():
 if (row or {}).get("approved") is not False: errors.append(f"fleet domain unexpectedly approved: {domain}")

for token in ['method:"POST"','method:"PATCH"','method:"DELETE"',"setInterval("]:
 if token in client: errors.append(f"Build 459 client contains forbidden mutation/polling token {token!r}")
for token in ["automatic_discount_allowed:false","booking_creation_allowed:false","invoice_creation_allowed:false","recurring_billing_allowed:false","provider_mutation_allowed:false","commercial_decision_write_performed:false"]:
 if token not in helper: errors.append(f"retained mutation boundary missing {token}")

commands=[
 ["node","--check","functions/api/_lib/maintenance-fleet-owner-approval.js"],
 ["node","--check","functions/api/admin/maintenance_fleet_owner_approval.js"],
 ["node","--check","assets/build439-maintenance-fleet-owner-approval.js"],
 ["node","--check","scripts/fleet_maintenance_commercial_activation_readiness_test.mjs"],
 ["node","scripts/fleet_maintenance_commercial_activation_readiness_test.mjs"]
]
for command in commands:
 proc=subprocess.run(command,cwd=ROOT,text=True,capture_output=True)
 if proc.returncode!=0: errors.append(f"{' '.join(command)} failed: {proc.stderr.strip() or proc.stdout.strip()}")

if errors:
 print("FLEET & MAINTENANCE COMMERCIAL ACTIVATION READINESS AUTHORITY: FAIL")
 for error in errors: print(" -",error)
 raise SystemExit(1)
print("FLEET & MAINTENANCE COMMERCIAL ACTIVATION READINESS AUTHORITY: PASS")
print(" - retained owner-decision workbench reused; no duplicate approval system")
print(" - seven activation-critical domains are reconciled without inferring approval")
print(" - operator_review_ready remains review-only and requires full source closure")
print(" - activation, discount, booking, invoice, billing, provider and capacity mutations remain locked")
