#!/usr/bin/env python3
"""Build 438 Authenticated Device & Visual Acceptance source authority."""
from pathlib import Path
import re,subprocess,sys
ROOT=Path(__file__).resolve().parents[1]; errors=[]
def read(path):
 p=ROOT/path
 if not p.is_file(): errors.append(f"missing required file: {path}"); return ""
 return p.read_text(encoding="utf-8",errors="ignore")
def require(text,needles,label):
 for n in needles:
  if n not in text: errors.append(f"{label} missing {n!r}")

helper=read("functions/api/_lib/authenticated-device-visual-acceptance.js")
endpoint=read("functions/api/admin/authenticated_device_visual_acceptance.js")
launch=read("functions/api/admin/launch_readiness_consolidated.js")
asset=read("assets/launch-readiness-consolidation.js")
page=read("admin-launch-readiness.html"); copy=read("admin-launch-readiness/index.html")
contract=read("BUILD438_AUTHENTICATED_DEVICE_VISUAL_ACCEPTANCE.md")
blockers=read("STARTUP_GO_LIVE_BLOCKERS.md")
queue=read("AUTONOMOUS_RELEASE_QUEUE.md"); handoff=read("AI_PROJECT_HANDOFF.md"); readme=read("README.md")
b419=read("BUILD419_CUSTOMER_STAFF_PRODUCTION_WORKFLOW_EVIDENCE.md")

require(helper,["buildAuthenticatedDeviceVisualAcceptance","booking_e2e","mobile","operations","accessibility","closure_candidate","phone","tablet","desktop","authentication_evidence_present","browser_evidence_present","route_evidence_present","viewport_evidence_present","outcome_evidence_present","automated_screenshot_polling:false","customer_or_booking_mutation_performed:false","evidence_note_exposed:false"],"Build 438 helper")
require(endpoint,["requireStaffAccess",'capability:"it_diagnostics"',"listLaunchEvidence","getProductionWorkflowEvidence","buildAuthenticatedDeviceVisualAcceptance","build:438",'authority:"authenticated_device_visual_acceptance"',"GET, HEAD, OPTIONS"],"Build 438 endpoint")
for token in ["onRequestPost","onRequestPatch","onRequestDelete","setInterval(","screenshot"]:
 if token in endpoint: errors.append(f"Build 438 endpoint contains forbidden token {token!r}")
require(launch,["buildAuthenticatedDeviceVisualAcceptance","authenticated_device_visual_acceptance: authenticatedDeviceVisualAcceptance",'current_device_visual_authority: "authenticated_device_visual_acceptance"'],"launch readiness composition")
require(asset,["Authenticated visual acceptance","Dated roles","Representative devices","Authenticated visual fields","No automated screenshot polling is used.","production_workflow_evidence"],"Launch Readiness client")
require(page,['data-build438="authenticated-device-visual-acceptance"',"Loading authenticated phone/tablet/desktop observations","Current authenticated device acceptance:","Build 419 acceptance boundary"],"Launch Readiness page")
if page!=copy: errors.append("admin-launch-readiness route copy drift")
require(contract,["# Build 438 — Authenticated Device & Visual Acceptance","/api/admin/authenticated_device_visual_acceptance","phone, tablet and desktop","browser evidence","safe internal route","viewport/width","closure_candidate","Build 439 — Maintenance & Fleet Owner Approval Convergence"],"Build 438 contract")
require(b419,["Customer workflow evidence","Detailer workflow evidence","Operations workflow evidence","Admin workflow evidence","real device or representative viewport/width"],"retained Build 419 contract")
require(blockers,["Independent device / visual evidence","authenticated_device_visual_acceptance","phone/tablet/desktop","closure candidate"],"canonical HOLD backlog")
require(queue,["BUILD438_AUTHENTICATED_DEVICE_VISUAL_ACCEPTANCE.md"],"release queue retained authority")
require(handoff,["BUILD438_AUTHENTICATED_DEVICE_VISUAL_ACCEPTANCE.md",".github/workflows/authenticated-device-visual-acceptance-authority.yml","scripts/authenticated_device_visual_acceptance_check.py"],"project handoff retained authority")
require(readme,["BUILD438_AUTHENTICATED_DEVICE_VISUAL_ACCEPTANCE.md","scripts/authenticated_device_visual_acceptance_check.py"],"README retained authority")

if len(re.findall(r"<h1\b",page,re.I))!=1: errors.append("Launch Readiness must retain exactly one H1")
for p in ["functions/api/_lib/authenticated-device-visual-acceptance.js","functions/api/admin/authenticated_device_visual_acceptance.js","functions/api/admin/launch_readiness_consolidated.js","assets/launch-readiness-consolidation.js","scripts/authenticated_device_visual_acceptance_test.mjs"]:
 r=subprocess.run(["node","--check",p],cwd=ROOT,text=True,capture_output=True)
 if r.returncode: errors.append(f"{p} syntax failed: {r.stderr.strip() or r.stdout.strip()}")
for cmd in [
 ["node","scripts/authenticated_device_visual_acceptance_test.mjs"],
 ["python","scripts/production_workflow_evidence_check.py"],
 ["node","scripts/production_workflow_evidence_test.mjs"],
 ["python","scripts/workflow_efficiency_accessibility_check.py"],
 ["python","scripts/build413_workflow_efficiency_accessibility_check.py"],
 ["python","scripts/responsive_static_check.py"]
]:
 r=subprocess.run(cmd,cwd=ROOT,text=True,capture_output=True)
 if r.returncode: errors.append(f"retained authority failed: {' '.join(cmd)}: {r.stderr.strip() or r.stdout.strip()}")
if errors:
 print("AUTHENTICATED DEVICE & VISUAL ACCEPTANCE AUTHORITY: FAIL")
 for e in errors: print(" -",e)
 sys.exit(1)
print("AUTHENTICATED DEVICE & VISUAL ACCEPTANCE AUTHORITY: PASS")
print(" - Customer, Detailer, Operations and Admin remain tied to retained role-specific workflow evidence")
print(" - accepted observations require dated auth/device/browser/route/viewport/outcome evidence")
print(" - representative phone/tablet/desktop coverage is required for a closure candidate")
print(" - protected note contents and customer identity remain excluded")
print(" - no screenshot capture/polling, customer/booking, role, provider or destructive-storage mutation")
