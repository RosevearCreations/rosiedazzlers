#!/usr/bin/env python3
"""Build 528 source authority for Controlled-Environment Routing Outcome Freshness & Capacity Review."""
from pathlib import Path
import subprocess, sys
ROOT=Path(__file__).resolve().parents[1]
errors=[]
def read(path):
    p=ROOT/path
    if not p.is_file(): errors.append(f"missing required file: {path}"); return ""
    return p.read_text(encoding="utf-8",errors="ignore")
def require(text,needles,label):
    for needle in needles:
        if needle not in text: errors.append(f"{label} missing {needle!r}")
helper=read("functions/api/_lib/controlled-environment-routing-outcome-freshness-capacity-review.js")
doc=read("BUILD528_CONTROLLED_ENVIRONMENT_ROUTING_OUTCOME_FRESHNESS_CAPACITY_REVIEW.md")
workflow=read(".github/workflows/controlled-environment-routing-outcome-freshness-capacity-review-authority.yml")
require(helper,["controlled_environment_routing_freshness_capacity_build: 528",'controlled_environment_routing_freshness_capacity_authority: "controlled_environment_routing_outcome_freshness_capacity_review"','"route_outcome_current","safe_reschedule_outcome_current"','"bounded_observed_capacity_current"','"capacity_not_observed"',"capacity_may_be_inferred_from_successful_route: false","automatic_capacity_reservation_allowed: false"],"Build 528 helper")
require(doc,["# Build 528 — Controlled-Environment Routing Outcome Freshness & Capacity Review","route_outcome_current","safe_reschedule_outcome_current","bounded_observed_capacity_current","capacity_not_observed","Build 529 — Provider & Local Search Closure Evidence Freshness Review"],"Build 528 contract")
require(workflow,["Controlled-Environment Routing Outcome Freshness & Capacity Review Authority","python scripts/controlled_environment_routing_outcome_freshness_capacity_review_check.py","node scripts/controlled_environment_routing_outcome_freshness_capacity_review_test.mjs","One successful route establishes future capacity: NO","Automatic appointment/routing/reschedule/capacity mutation: NONE"],"Build 528 workflow")
for path in ["functions/api/_lib/controlled-environment-routing-outcome-freshness-capacity-review.js","scripts/controlled_environment_routing_outcome_freshness_capacity_review_test.mjs"]:
    proc=subprocess.run(["node","--check",path],cwd=ROOT,text=True,capture_output=True)
    if proc.returncode: errors.append(f"{path} syntax failed: {proc.stderr.strip() or proc.stdout.strip()}")
if errors:
    print("BUILD 528 CONTROLLED-ENVIRONMENT ROUTING OUTCOME FRESHNESS & CAPACITY REVIEW AUTHORITY: FAIL")
    for error in errors: print(" -",error)
    sys.exit(1)
for command in [["node","scripts/controlled_environment_routing_outcome_evidence_continuity_test.mjs"],["node","scripts/controlled_environment_routing_outcome_freshness_capacity_review_test.mjs"]]:
    proc=subprocess.run(command,cwd=ROOT,text=True,capture_output=True)
    if proc.returncode:
        print("BUILD 528 CONTROLLED-ENVIRONMENT ROUTING OUTCOME FRESHNESS & CAPACITY REVIEW AUTHORITY: FAIL")
        print(proc.stderr.strip() or proc.stdout.strip())
        sys.exit(proc.returncode)
print("BUILD 528 CONTROLLED-ENVIRONMENT ROUTING OUTCOME FRESHNESS & CAPACITY REVIEW AUTHORITY: PASS")
