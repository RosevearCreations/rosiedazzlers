#!/usr/bin/env python3
"""Build 448 Authenticated Cross-Device Acceptance Refresh source authority."""
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
contract=read("BUILD448_AUTHENTICATED_CROSS_DEVICE_ACCEPTANCE_REFRESH.md")
queue=read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff=read("AI_PROJECT_HANDOFF.md")
readme=read("README.md")
blockers=read("STARTUP_GO_LIVE_BLOCKERS.md")

require(helper,["freshness_days = 30","freshness_basis","stale_role_count","current:complete","stale_observation_is_not_current_release_proof","phone","tablet","desktop"],"Build 448 classifier")
require(endpoint,["current_build:448",'refresh_authority:"authenticated_cross_device_acceptance_refresh"'],"Build 448 endpoint")
require(asset,["Observation freshness","Stale roles","Current refresh"],"Launch Readiness")
require(contract,["# Build 448 — Authenticated Cross-Device Acceptance Refresh","30-day freshness window","Build 449 — Fleet & Maintenance Commercial Decision Closure"],"contract")
require(blockers,["Independent device / visual evidence","current release"],"HOLD backlog")
require(queue,["BUILD448_AUTHENTICATED_CROSS_DEVICE_ACCEPTANCE_REFRESH.md","**Build 451 — Booking Funnel, Quote & Pricing Learning** is the active bounded release.","**Build 452 — Staff Workflow, Support & Mobile Efficiency Learning** is next"],"queue")
require(handoff,["BUILD448_AUTHENTICATED_CROSS_DEVICE_ACCEPTANCE_REFRESH.md","authenticated_cross_device_acceptance_refresh_check.py","**Build 451 — Booking Funnel, Quote & Pricing Learning** is the active bounded release."],"handoff")
require(readme,["BUILD448_AUTHENTICATED_CROSS_DEVICE_ACCEPTANCE_REFRESH.md","authenticated_cross_device_acceptance_refresh_check.py","Current source direction: **Build 451 — Booking Funnel, Quote & Pricing Learning**."],"README")

for p in ["functions/api/_lib/authenticated-device-visual-acceptance.js","functions/api/admin/authenticated_device_visual_acceptance.js","assets/launch-readiness-consolidation.js","scripts/authenticated_cross_device_acceptance_refresh_test.mjs"]:
 r=subprocess.run(["node","--check",p],cwd=ROOT,text=True,capture_output=True)
 if r.returncode: errors.append(f"{p} syntax failed: {r.stderr.strip() or r.stdout.strip()}")
for cmd in [["node","scripts/authenticated_cross_device_acceptance_refresh_test.mjs"],["python","scripts/authenticated_device_visual_acceptance_check.py"],["node","scripts/authenticated_device_visual_acceptance_test.mjs"],["python","scripts/production_workflow_evidence_check.py"],["python","scripts/workflow_efficiency_accessibility_check.py"],["python","scripts/responsive_static_check.py"]]:
 r=subprocess.run(cmd,cwd=ROOT,text=True,capture_output=True)
 if r.returncode: errors.append(f"retained authority failed: {' '.join(cmd)}: {r.stderr.strip() or r.stdout.strip()}")

if errors:
 print("AUTHENTICATED CROSS-DEVICE ACCEPTANCE REFRESH AUTHORITY: FAIL")
 for e in errors: print(" -",e)
 sys.exit(1)
print("AUTHENTICATED CROSS-DEVICE ACCEPTANCE REFRESH AUTHORITY: PASS")
print(" - retained Build 438 classifier is enriched, not replaced")
print(" - all four role observations must be current within 30 days")
print(" - phone/tablet/desktop coverage remains required")
print(" - stale/missing/unavailable evidence remains HOLD")
