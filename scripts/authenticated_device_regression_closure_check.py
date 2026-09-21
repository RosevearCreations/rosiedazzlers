#!/usr/bin/env python3
"""Build 468 Authenticated Device Regression Closure source authority."""
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
asset=read("assets/launch-readiness-consolidation.js")
launch=read("functions/api/admin/launch_readiness_consolidated.js")
contract=read("BUILD468_AUTHENTICATED_DEVICE_REGRESSION_CLOSURE.md")
queue=read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff=read("AI_PROJECT_HANDOFF.md")
readme=read("README.md")
blockers=read("STARTUP_GO_LIVE_BLOCKERS.md")
workflow=read(".github/workflows/authenticated-device-regression-closure-authority.yml")
dev=read(".github/workflows/development-source-gate.yml")
prod=read(".github/workflows/production-business-acceptance-authority.yml")

require(helper,[
 "authenticated_device_regression_closure","current_regression","historical_acceptance",
 "current_pass_role_ids","current_regression_role_ids","historical_only_role_ids",
 "current_device_ids","current_regression_device_ids","current_browser_ids",
 "current_regression_browser_ids","retained_historical_acceptance_role_ids",
 "historical_acceptance_is_not_current_regression_proof",
 "historical_acceptance_overrides_current_regression:false",
 "source_responsive_checks_are_supporting_only:true"
],"Build 468 classifier")
require(endpoint,["regression_build:468",'regression_authority:"authenticated_device_regression_closure"',"GET, HEAD, OPTIONS"],"Build 468 endpoint")
require(asset,["Regression review","Current regressions","Historical-only","Regression devices","Regression browsers","Historical acceptance does not override a current regression"],"Launch Readiness")
require(launch,["authenticated_device_visual_acceptance","current_device_visual_authority","current_device_regression_authority","authenticated_device_regression_closure"],"Launch Readiness composition")
require(contract,["# Build 468 — Authenticated Device Regression Closure","current_regression_observed","historical acceptance","Build 469 — Maintenance & Fleet Controlled Pilot Activation Readiness"],"Build 468 contract")
require(blockers,["Independent device / visual evidence","Build 468","current regression","historical acceptance"],"canonical HOLD backlog")
require(queue,["BUILD468_AUTHENTICATED_DEVICE_REGRESSION_CLOSURE.md","Build 468 — Authenticated Device Regression Closure","Build 469 — Maintenance & Fleet Controlled Pilot Activation Readiness"],"release queue")
require(handoff,["BUILD468_AUTHENTICATED_DEVICE_REGRESSION_CLOSURE.md","authenticated_device_regression_closure_check.py"],"project handoff")
require(readme,["BUILD468_AUTHENTICATED_DEVICE_REGRESSION_CLOSURE.md","authenticated_device_regression_closure_check.py"],"README")
require(workflow,["Build 468 — Authenticated Device Regression Closure Authority","authenticated-device-regression-closure","authenticated_device_regression_closure_check.py"],"focused workflow")
for text,label in [(dev,"Development source gate"),(prod,"Production business acceptance")]:
 require(text,["authenticated_device_regression_closure_check.py","authenticated_device_regression_closure_test.mjs"],label)

for token in ["onRequestPost","onRequestPatch","onRequestDelete","setInterval(","screenshot capture"]:
 if token in endpoint: errors.append(f"Build 468 endpoint contains forbidden token {token!r}")

migrations=[p for p in ROOT.rglob("*.sql") if re.search(r"(?:^|[^0-9])468(?:[^0-9]|$)",p.name)]
if migrations:
 errors.append("Build 468 must not introduce a schema migration: "+", ".join(str(p.relative_to(ROOT)) for p in migrations))

for p in [
 "functions/api/_lib/authenticated-device-visual-acceptance.js",
 "functions/api/admin/authenticated_device_visual_acceptance.js",
 "assets/launch-readiness-consolidation.js",
 "functions/api/admin/launch_readiness_consolidated.js",
 "scripts/authenticated_device_regression_closure_test.mjs"
]:
 r=subprocess.run(["node","--check",p],cwd=ROOT,text=True,capture_output=True)
 if r.returncode: errors.append(f"{p} syntax failed: {r.stderr.strip() or r.stdout.strip()}")

for cmd in [
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
 print("AUTHENTICATED DEVICE REGRESSION CLOSURE AUTHORITY: FAIL")
 for e in errors: print(" -",e)
 sys.exit(1)
print("AUTHENTICATED DEVICE REGRESSION CLOSURE AUTHORITY: PASS")
print(" - current passing and current regression observations are separated from historical acceptance")
print(" - a current regression cannot be overridden by retained historical acceptance")
print(" - Customer/Detailer/Operations/Admin plus representative phone/tablet/desktop current coverage remains explicit")
print(" - responsive source checks remain supporting evidence only")
print(" - no screenshot polling, business/provider/storage mutation, schema migration or permanent polling")
