#!/usr/bin/env python3
"""Build 478 Authenticated Device Observation Refresh & Regression Triage source authority.\nRetained validation is release-state independent: living current/next labels may advance.\n"""
from pathlib import Path
import re, subprocess, sys
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
launch=read("functions/api/admin/launch_readiness_consolidated.js")
contract=read("BUILD478_AUTHENTICATED_DEVICE_OBSERVATION_REFRESH_REGRESSION_TRIAGE.md")
queue=read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff=read("AI_PROJECT_HANDOFF.md")
readme=read("README.md")
blockers=read("STARTUP_GO_LIVE_BLOCKERS.md")
workflow=read(".github/workflows/authenticated-device-observation-refresh-regression-triage-authority.yml")
dev=read(".github/workflows/development-source-gate.yml")
prod=read(".github/workflows/production-business-acceptance-authority.yml")

require(helper,[
 "authenticated_device_observation_refresh_regression_triage","build:478",
 "newly_observed_regression_role_ids","newly_observed_means_current_negative_observation_not_first_occurrence:true",
 "refresh_required_role_ids","refresh_required_device_ids","regression_triage_items",
 "bounded_remediation_triage_ready","remediation_execution_authorized:false",
 "re_observation_required:true","source_checks_can_prove_absence_of_regression:false",
 "historical_acceptance_can_override_current_regression:false",
 "automated_browser_farm_created:false","automated_remediation_performed:false",
 "canonical_hold_mutated:false"
],"Build 478 classifier")
require(endpoint,["triage_build:478",'triage_authority:"authenticated_device_observation_refresh_regression_triage"',"GET, HEAD, OPTIONS"],"Build 478 endpoint")
require(asset,["Observation triage","Triage regressions","Refresh roles","Refresh devices","No browser farm or source-check inference"],"Launch Readiness")
require(launch,["current_device_observation_triage_authority","authenticated_device_observation_refresh_regression_triage"],"Launch Readiness composition")
require(contract,["# Build 478 — Authenticated Device Observation Refresh & Regression Triage","newly observed regression","observation_refresh_required","Build 479 — Maintenance & Fleet Owner Approval & Pilot Decision"],"Build 478 contract")
require(blockers,["Independent device / visual evidence","Build 478","regression triage"],"canonical HOLD backlog")
require(queue,["BUILD478_AUTHENTICATED_DEVICE_OBSERVATION_REFRESH_REGRESSION_TRIAGE.md","FORWARD_BUILD_ROADMAP_476_485.md","it has not run out"],"release queue retained Build 478 authority")
require(handoff,["BUILD478_AUTHENTICATED_DEVICE_OBSERVATION_REFRESH_REGRESSION_TRIAGE.md","authenticated_device_observation_refresh_regression_triage_check.py"],"project handoff")
require(readme,["BUILD478_AUTHENTICATED_DEVICE_OBSERVATION_REFRESH_REGRESSION_TRIAGE.md","authenticated_device_observation_refresh_regression_triage_check.py"],"README")
require(workflow,["Build 478 — Authenticated Device Observation Refresh & Regression Triage Authority","authenticated-device-observation-refresh-regression-triage","authenticated_device_observation_refresh_regression_triage_check.py"],"focused workflow")
for text,label in [(dev,"Development source gate"),(prod,"Production business acceptance")]:
 require(text,["authenticated_device_observation_refresh_regression_triage_check.py","authenticated_device_observation_refresh_regression_triage_test.mjs"],label)

for token in ["onRequestPost","onRequestPatch","onRequestDelete","setInterval("]:
 if token in endpoint: errors.append(f"Build 478 endpoint contains forbidden token {token!r}")

migrations=[p for p in ROOT.rglob("*.sql") if re.search(r"(?:^|[^0-9])478(?:[^0-9]|$)",p.name)]
if migrations: errors.append("Build 478 must not introduce a schema migration: "+", ".join(str(p.relative_to(ROOT)) for p in migrations))

for p in [
 "functions/api/_lib/authenticated-device-visual-acceptance.js",
 "functions/api/admin/authenticated_device_visual_acceptance.js",
 "assets/launch-readiness-consolidation.js",
 "functions/api/admin/launch_readiness_consolidated.js",
 "scripts/authenticated_device_observation_refresh_regression_triage_test.mjs"
]:
 r=subprocess.run(["node","--check",p],cwd=ROOT,text=True,capture_output=True)
 if r.returncode: errors.append(f"{p} syntax failed: {r.stderr.strip() or r.stdout.strip()}")

for cmd in [
 ["node","scripts/authenticated_device_observation_refresh_regression_triage_test.mjs"],
 ["python","scripts/authenticated_device_regression_closure_check.py"],
 ["node","scripts/authenticated_device_regression_closure_test.mjs"],
 ["python","scripts/authenticated_device_acceptance_closure_check.py"],
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
 print("AUTHENTICATED DEVICE OBSERVATION REFRESH REGRESSION TRIAGE AUTHORITY: FAIL")
 for e in errors: print(" -",e)
 sys.exit(1)
print("AUTHENTICATED DEVICE OBSERVATION REFRESH REGRESSION TRIAGE AUTHORITY: PASS")
print(" - direct current authenticated observations remain distinct from historical acceptance")
print(" - current negative observations create bounded operator triage items only")
print(" - incomplete role/device observation coverage remains refresh-required")
print(" - source checks cannot prove absence of regression and no browser farm is created")
print(" - remediation execution, HOLD mutation and business/provider/storage mutation remain locked")
