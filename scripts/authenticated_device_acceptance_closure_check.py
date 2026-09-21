#!/usr/bin/env python3
"""Build 458 Authenticated Device Acceptance Closure source authority."""
from pathlib import Path
import subprocess,sys
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
asset=read("assets/launch-readiness-consolidation.js")
contract=read("BUILD458_AUTHENTICATED_DEVICE_ACCEPTANCE_CLOSURE.md")
queue=read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff=read("AI_PROJECT_HANDOFF.md")
readme=read("README.md")
blockers=read("STARTUP_GO_LIVE_BLOCKERS.md")

require(helper,["authenticated_device_acceptance_closure","operator_review_ready","current_role_ids","current_device_ids","stale_role_ids","stale_device_ids","missing_role_ids","missing_device_ids","unavailable_role_ids","unavailable_device_ids","operator_review_required:true","canonical_hold_mutated:false","source_responsive_checks_are_supporting_only:true"],"Build 458 classifier")
require(endpoint,["current_build:448","closure_build:458",'closure_authority:"authenticated_device_acceptance_closure"',"GET, HEAD, OPTIONS"],"Build 458 endpoint")
require(asset,["Closure review","Stale coverage","Missing coverage","Acceptance closure:","Current surfaces:","Current devices:"],"Launch Readiness")
require(contract,["# Build 458 — Authenticated Device Acceptance Closure","operator_review_ready","phone","tablet","desktop","Build 459 — Fleet & Maintenance Commercial Activation Readiness"],"Build 458 contract")
require(blockers,["Independent device / visual evidence","current release"],"canonical HOLD backlog")
require(queue,["BUILD458_AUTHENTICATED_DEVICE_ACCEPTANCE_CLOSURE.md","BUILD459_FLEET_MAINTENANCE_COMMERCIAL_ACTIVATION_READINESS.md"],"release queue retained authority pointers")
require(handoff,["BUILD458_AUTHENTICATED_DEVICE_ACCEPTANCE_CLOSURE.md","authenticated_device_acceptance_closure_check.py"],"project handoff retained authority pointers")
require(readme,["BUILD458_AUTHENTICATED_DEVICE_ACCEPTANCE_CLOSURE.md","authenticated_device_acceptance_closure_check.py"],"README retained authority pointers")

for p in ["functions/api/_lib/authenticated-device-visual-acceptance.js","functions/api/admin/authenticated_device_visual_acceptance.js","assets/launch-readiness-consolidation.js","scripts/authenticated_device_acceptance_closure_test.mjs"]:
 r=subprocess.run(["node","--check",p],cwd=ROOT,text=True,capture_output=True)
 if r.returncode: errors.append(f"{p} syntax failed: {r.stderr.strip() or r.stdout.strip()}")
for cmd in [
 ["node","scripts/authenticated_device_acceptance_closure_test.mjs"],
 ["python","scripts/authenticated_cross_device_acceptance_refresh_check.py"],
 ["node","scripts/authenticated_cross_device_acceptance_refresh_test.mjs"],
 ["python","scripts/authenticated_device_visual_acceptance_check.py"],
 ["node","scripts/authenticated_device_visual_acceptance_test.mjs"],
 ["python","scripts/production_workflow_evidence_check.py"],
 ["python","scripts/workflow_efficiency_accessibility_check.py"],
 ["python","scripts/responsive_static_check.py"]
]:
 r=subprocess.run(cmd,cwd=ROOT,text=True,capture_output=True)
 if r.returncode: errors.append(f"retained authority failed: {' '.join(cmd)}: {r.stderr.strip() or r.stdout.strip()}")

if errors:
 print("AUTHENTICATED DEVICE ACCEPTANCE CLOSURE AUTHORITY: FAIL")
 for e in errors: print(" -",e)
 sys.exit(1)
print("AUTHENTICATED DEVICE ACCEPTANCE CLOSURE AUTHORITY: PASS")
print(" - retained Build 438/448 classifier and Launch Readiness surface are enriched, not replaced")
print(" - current, stale, missing and unavailable authenticated role/device coverage is explicit")
print(" - Customer, Detailer, Operations and Admin plus phone/tablet/desktop remain required")
print(" - complete coverage is operator-review-ready only; canonical HOLD is never auto-mutated")
print(" - source responsive/accessibility checks remain supporting evidence only")
