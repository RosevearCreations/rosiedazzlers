#!/usr/bin/env python3
"""Build 449 Fleet & Maintenance Commercial Decision Closure source authority."""
from pathlib import Path
import json,subprocess,sys,re
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
contract=read("BUILD449_FLEET_MAINTENANCE_COMMERCIAL_DECISION_CLOSURE.md")
queue=read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff=read("AI_PROJECT_HANDOFF.md")
readme=read("README.md")
blockers=read("STARTUP_GO_LIVE_BLOCKERS.md")
maintenance=json.loads(read("config/maintenance-plan-business-rulebook.json") or "{}")
fleet=json.loads(read("config/fleet-business-rulebook.json") or "{}")

require(helper,[
 "current_build:449",'authority:"fleet_maintenance_commercial_decision_closure"',
 "MAINTENANCE_REQUIRED_FIELDS","FLEET_REQUIRED_FIELDS","decision_closure",
 "owner_decision_path","required_fields","owner_review_candidate",
 "commercial_decision_write_performed:false","automatic_approval_performed:false",
 "approval_timestamp_inferred:false","live_capacity_is_separate_from_commercial_policy:true"
],"Build 449 helper")
require(endpoint,[
 "current_build:449",'refresh_authority:"fleet_maintenance_commercial_decision_closure"',
 "maintenance_fleet_owner_approval_convergence","GET,HEAD,OPTIONS"
],"Build 449 endpoint")
require(client,[
 "Closure state","Owner decision path","Required closure fields",
 "Closure requires an explicit owner decision in canonical source.",
 "Commercial policy source:"
],"Build 449 workbench client")
for token in ['method:"POST"','method:"PATCH"','method:"DELETE"',"setInterval("]:
 if token in client: errors.append(f"Build 449 client contains forbidden mutation/polling token {token!r}")
require(page,[
 'data-build449="fleet-maintenance-commercial-decision-closure"',
 "Build 449 · commercial decision closure","Commercial decision closure status",
 "Source GREEN may coexist with owner_action"
],"Build 449 workbench page")
if page!=copy: errors.append("Build 449 workbench route copy drift")
if len(re.findall(r"<h1\b",page,re.I))!=1: errors.append("Build 449 workbench must contain exactly one H1")
require(contract,[
 "# Build 449 — Fleet & Maintenance Commercial Decision Closure",
 "config/maintenance-plan-business-rulebook.json",
 "config/fleet-business-rulebook.json",
 "owner_review_candidate",
 "Build 450 — Local Search Measurement & Conversion Attribution"
],"Build 449 contract")
require(blockers,["Maintenance / fleet business approval","Build 449","owner_review_candidate"],"canonical HOLD backlog")
require(queue,[
 "**Build 450 — Local Search Measurement & Conversion Attribution** is the active bounded release.",
 "BUILD449_FLEET_MAINTENANCE_COMMERCIAL_DECISION_CLOSURE.md",
 "**Build 451 — Booking Funnel, Quote & Pricing Learning** is next"
],"release queue")
require(handoff,[
 "**Build 450 — Local Search Measurement & Conversion Attribution** is the active bounded release.",
 "BUILD449_FLEET_MAINTENANCE_COMMERCIAL_DECISION_CLOSURE.md",
 "fleet_maintenance_commercial_decision_closure_check.py"
],"project handoff")
require(readme,[
 "Current source direction: **Build 450 — Local Search Measurement & Conversion Attribution**.",
 "BUILD449_FLEET_MAINTENANCE_COMMERCIAL_DECISION_CLOSURE.md",
 "fleet_maintenance_commercial_decision_closure_check.py"
],"README")

expected_maintenance={"eligibility","cadence","price","inclusions","exclusions","cancellation","priority"}
expected_fleet={"fleet_minimums","service_tiers","travel_limits","volume_pricing","invoicing","cancellation"}
for label,book,expected in [
 ("maintenance",maintenance,expected_maintenance),
 ("fleet",fleet,expected_fleet)
]:
 if book.get("status")!="awaiting_business_approval": errors.append(f"{label} rulebook no longer truthfully awaits business approval")
 if book.get("business_approval_required") is not True: errors.append(f"{label} rulebook must require explicit business approval")
 decisions=book.get("decisions") or {}
 if set(decisions)!=expected: errors.append(f"{label} decision domains do not match canonical closure set")
 if any(isinstance(v,dict) and v.get("approved") is True for v in decisions.values()):
  errors.append(f"{label} rulebook contains an approved domain without owner-supplied Build 449 terms")

for p in [
 "functions/api/_lib/maintenance-fleet-owner-approval.js",
 "functions/api/admin/maintenance_fleet_owner_approval.js",
 "assets/build439-maintenance-fleet-owner-approval.js",
 "scripts/fleet_maintenance_commercial_decision_closure_test.mjs"
]:
 r=subprocess.run(["node","--check",p],cwd=ROOT,text=True,capture_output=True)
 if r.returncode: errors.append(f"{p} syntax failed: {r.stderr.strip() or r.stdout.strip()}")

for cmd in [
 ["node","scripts/fleet_maintenance_commercial_decision_closure_test.mjs"],
 ["python","scripts/maintenance_fleet_owner_approval_convergence_check.py"],
 ["node","scripts/maintenance_fleet_owner_approval_convergence_test.mjs"],
 ["python","scripts/build410_maintenance_fleet_commercial_acceptance_check.py"],
 ["node","scripts/build410_maintenance_fleet_commercial_acceptance_test.mjs"],
 ["python","scripts/maintenance_plan_business_rulebook_check.py"],
 ["python","scripts/fleet_business_rulebook_check.py"],
 ["python","scripts/fleet_commercial_operations_learning_check.py"],
 ["python","scripts/retention_maintenance_fleet_operational_pilot_check.py"]
]:
 r=subprocess.run(cmd,cwd=ROOT,text=True,capture_output=True)
 if r.returncode: errors.append(f"retained authority failed: {' '.join(cmd)}: {r.stderr.strip() or r.stdout.strip()}")

if errors:
 print("FLEET & MAINTENANCE COMMERCIAL DECISION CLOSURE AUTHORITY: FAIL")
 for e in errors: print(" -",e)
 sys.exit(1)

print("FLEET & MAINTENANCE COMMERCIAL DECISION CLOSURE AUTHORITY: PASS")
print(" - canonical maintenance/fleet decision domains converge into one read-only closure packet")
print(" - current rulebooks truthfully remain owner_action; no business term was invented")
print(" - a fully approved source becomes owner_review_candidate, never automatic activation")
print(" - live capacity remains separate from commercial policy")
print(" - no discount/booking/invoice/billing/provider/schema/customer/storage mutation")
