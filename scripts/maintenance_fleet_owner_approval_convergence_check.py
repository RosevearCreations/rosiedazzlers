#!/usr/bin/env python3
"""Build 439 Maintenance & Fleet Owner Approval Convergence source authority."""
from pathlib import Path
import re,subprocess,sys,json
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
page=read("admin-maintenance-fleet-owner-approval.html"); copy=read("admin-maintenance-fleet-owner-approval/index.html")
auth=read("assets/admin-auth.js"); nav=read("assets/app-core/module-navigation.js")
contract=read("BUILD439_MAINTENANCE_FLEET_OWNER_APPROVAL_CONVERGENCE.md")
queue=read("AUTONOMOUS_RELEASE_QUEUE.md"); handoff=read("AI_PROJECT_HANDOFF.md"); readme=read("README.md")
maintenance=json.loads(read("config/maintenance-plan-business-rulebook.json") or "{}")
fleet=json.loads(read("config/fleet-business-rulebook.json") or "{}")

require(helper,["buildMaintenanceFleetOwnerApprovalConvergence","Cadence","Pricing","Volume pricing / discount","Travel limits","Invoicing / credit terms","Capacity & priority","decision_count","owner_action_count","owner_decision_mutation_available:false","rulebook_write_performed:false","booking_creation_allowed:false","invoice_creation_allowed:false","provider_mutation_allowed:false"],"Build 439 helper")
require(endpoint,['requireActionAccess(access.actor,"admin.settings.manage")',"getCommercialActivation","getFleetLearning","maintenance_fleet_owner_approval_convergence","GET,HEAD,OPTIONS"],"Build 439 endpoint")
for token in ["onRequestPost","onRequestPatch","onRequestDelete","setInterval("]:
 if token in endpoint: errors.append(f"Build 439 endpoint contains forbidden token {token!r}")
require(client,['fetch("/api/admin/maintenance_fleet_owner_approval"','method:"GET"',"No term was approved or changed.","admin-maintenance-fleet-owner-approval"],"Build 439 client")
for token in ["method:"POST"","method:"PATCH"","method:"DELETE"","localStorage","sessionStorage","setInterval("]:
 if token in client: errors.append(f"Build 439 client contains forbidden token {token!r}")
require(page,['data-build439="maintenance-fleet-owner-approval-convergence"',"Maintenance &amp; Fleet Owner Decisions","Decision boundary","maintenance-plan-business-rulebook.json","fleet-business-rulebook.json","build439-maintenance-fleet-owner-approval.js"],"Build 439 page")
if page!=copy: errors.append("Build 439 route copy drift")
if len(re.findall(r"<h1\b",page,re.I))!=1: errors.append("Build 439 page must contain exactly one H1")
require(auth,['case "admin-maintenance-fleet-owner-approval"'],"admin role ceiling")
require(nav,['"/admin-maintenance-fleet-owner-approval.html"','"page_key":"admin-maintenance-fleet-owner-approval"','"label":"Owner Commercial Decisions"'],"module navigation")
require(contract,["# Build 439 — Maintenance & Fleet Owner Approval Convergence","/api/admin/maintenance_fleet_owner_approval","admin.settings.manage","canonical rulebooks","owner_action","Build 440 — Local Search Provider Evidence Refresh"],"Build 439 contract")
require(queue,["**Build 439 — Maintenance & Fleet Owner Approval Convergence** is the active bounded release.","**Build 440 — Local Search Provider Evidence Refresh**"],"release queue")
require(handoff,["**Build 439 — Maintenance & Fleet Owner Approval Convergence** is the active bounded release.","**Build 440 — Local Search Provider Evidence Refresh**",".github/workflows/maintenance-fleet-owner-approval-convergence-authority.yml","scripts/maintenance_fleet_owner_approval_convergence_check.py"],"project handoff")
require(readme,["Current source direction: **Build 439 — Maintenance & Fleet Owner Approval Convergence**","scripts/maintenance_fleet_owner_approval_convergence_check.py","**Build 440 — Local Search Provider Evidence Refresh**"],"README")

for name,book in [("maintenance",maintenance),("fleet",fleet)]:
 if book.get("status")!="awaiting_business_approval": errors.append(f"{name} rulebook unexpectedly not awaiting business approval")
 decisions=book.get("decisions") or {}
 if any((v or {}).get("approved") is True for v in decisions.values() if isinstance(v,dict)):
  errors.append(f"{name} rulebook contains an approved domain; Build 439 must not fabricate or silently change owner approval")

for p in ["functions/api/_lib/maintenance-fleet-owner-approval.js","functions/api/admin/maintenance_fleet_owner_approval.js","assets/build439-maintenance-fleet-owner-approval.js","scripts/maintenance_fleet_owner_approval_convergence_test.mjs"]:
 r=subprocess.run(["node","--check",p],cwd=ROOT,text=True,capture_output=True)
 if r.returncode: errors.append(f"{p} syntax failed: {r.stderr.strip() or r.stdout.strip()}")
for cmd in [
 ["node","scripts/maintenance_fleet_owner_approval_convergence_test.mjs"],
 ["python","scripts/build410_maintenance_fleet_commercial_acceptance_check.py"],
 ["python","scripts/retention_maintenance_fleet_operational_pilot_check.py"],
 ["python","scripts/fleet_commercial_operations_learning_check.py"],
 ["python","scripts/maintenance_plan_business_rulebook_check.py"],
 ["python","scripts/fleet_business_rulebook_check.py"]
]:
 r=subprocess.run(cmd,cwd=ROOT,text=True,capture_output=True)
 if r.returncode: errors.append(f"retained authority failed: {' '.join(cmd)}: {r.stderr.strip() or r.stdout.strip()}")

if errors:
 print("MAINTENANCE & FLEET OWNER APPROVAL CONVERGENCE AUTHORITY: FAIL")
 for e in errors: print(" -",e)
 sys.exit(1)
print("MAINTENANCE & FLEET OWNER APPROVAL CONVERGENCE AUTHORITY: PASS")
print(" - canonical maintenance/fleet rulebooks remain awaiting explicit business approval")
print(" - owner-decision workbench is admin-only and read-only")
print(" - current operational evidence is context only; no commercial term is inferred")
print(" - no discount, quote acceptance, booking, invoice, recurring billing, outreach, provider/accounting or capacity mutation")
