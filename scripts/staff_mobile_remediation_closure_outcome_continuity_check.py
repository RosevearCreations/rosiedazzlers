#!/usr/bin/env python3
"""Build 523 source authority for Staff & Mobile Remediation Closure Outcome Continuity."""
from pathlib import Path
import re, subprocess, sys

ROOT=Path(__file__).resolve().parents[1]
errors=[]
def read(path):
    p=ROOT/path
    if not p.is_file():
        errors.append(f"missing required file: {path}")
        return ""
    return p.read_text(encoding="utf-8",errors="ignore")
def require(text,needles,label):
    for needle in needles:
        if needle not in text: errors.append(f"{label} missing {needle!r}")

helper=read("functions/api/_lib/staff-mobile-remediation-closure-outcome-continuity.js")
endpoint=read("functions/api/admin/staff_mobile_remediation_closure_readiness.js")
contract=read("BUILD523_STAFF_MOBILE_REMEDIATION_CLOSURE_OUTCOME_CONTINUITY.md")
roadmap=read("FORWARD_BUILD_ROADMAP_516_525.md")
queue=read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff=read("AI_PROJECT_HANDOFF.md")
readme=read("README.md")
blockers=read("STARTUP_GO_LIVE_BLOCKERS.md")
docindex=read("DOC_INDEX.md")
workflow=read(".github/workflows/staff-mobile-remediation-closure-outcome-continuity-authority.yml")
dev=read(".github/workflows/development-source-gate.yml")
prod=read(".github/workflows/production-business-acceptance-authority.yml")
prodcheck=read("scripts/production_business_acceptance_check.py")

require(helper,[
 "closure_outcome_build: 523",'closure_outcome_authority: "staff_mobile_remediation_closure_outcome_continuity"',
 '"closure_readiness_source_unavailable"','"closure_readiness_not_review_ready"','"closure_outcome_required"',
 '"closure_outcome_unattributable"','"closure_outcome_evidence_conflict"','"closure_outcome_observation_incomplete"',
 '"closure_outcome_observed"','"closure_retained_open_outcome_observed"',"exact_readiness_trace_required: true",
 "outcome_must_follow_retained_evidence: true","automatic_remediation_closure_allowed: false",
 "effectiveness_inference_allowed: false","causation_inference_allowed: false","staff_fault_inference_allowed: false",
 "device_fault_inference_allowed: false","canonical_hold_mutation_allowed: false","permanent_polling_allowed: false"
],"Build 523 helper")
require(endpoint,[
 "buildStaffMobileRemediationClosureReadiness","buildStaffMobileRemediationClosureOutcomeContinuity",
 "STAFF_MOBILE_REMEDIATION_CLOSURE_EVIDENCE_JSON","STAFF_MOBILE_REMEDIATION_CLOSURE_OUTCOME_JSON",
 "staff_mobile_remediation_closure_outcome_continuity",'"X-Rosie-Staff-Mobile-Closure-Outcome":"build-523-read-only"',"GET,HEAD,OPTIONS"
],"Build 523 endpoint")
for forbidden in ["onRequestPost","onRequestPut","onRequestPatch","onRequestDelete","setInterval(","localStorage","sessionStorage"]:
    if forbidden in endpoint: errors.append(f"Build 523 endpoint contains forbidden mutation/polling token {forbidden!r}")
require(contract,[
 "# Build 523 — Staff & Mobile Remediation Closure Outcome Continuity","the exact Build 513 readiness trace matches",
 "material confounders are explicitly reviewed","Southern Ontario weather/site context","does not prove remediation effectiveness",
 "No state automatically closes a remediation","Build 524 — Service Economics, Seasonal Capacity & Reliability Decision Outcome Continuity"
],"Build 523 contract")
require(roadmap,[
 "### Build 523 — Staff & Mobile Remediation Closure Outcome Continuity","workflow/role/device/browser context",
 "recorded material confounders","### Build 524 — Service Economics, Seasonal Capacity & Reliability Decision Outcome Continuity"
],"Build 523 roadmap")
require(queue,[
 "**Build 523 — Staff & Mobile Remediation Closure Outcome Continuity** is the active bounded release.",
 "**Build 524 — Service Economics, Seasonal Capacity & Reliability Decision Outcome Continuity** is next",
 "BUILD523_STAFF_MOBILE_REMEDIATION_CLOSURE_OUTCOME_CONTINUITY.md","BUILD513_STAFF_MOBILE_REMEDIATION_CLOSURE_READINESS.md",
 "non-force fast-forward","it has not run out"
],"Build 523 queue")
require(handoff,[
 "**Build 523 — Staff & Mobile Remediation Closure Outcome Continuity** is the active bounded release.",
 "BUILD523_STAFF_MOBILE_REMEDIATION_CLOSURE_OUTCOME_CONTINUITY.md","staff_mobile_remediation_closure_outcome_continuity_check.py",
 "BUILD513_STAFF_MOBILE_REMEDIATION_CLOSURE_READINESS.md","BUILD503_STAFF_MOBILE_REMEDIATION_OUTCOME_INTERPRETATION_FOLLOW_UP.md"
],"Build 523 handoff")
require(readme,[
 "Current source direction: **Build 523 — Staff & Mobile Remediation Closure Outcome Continuity**.",
 "BUILD523_STAFF_MOBILE_REMEDIATION_CLOSURE_OUTCOME_CONTINUITY.md","scripts/staff_mobile_remediation_closure_outcome_continuity_check.py",
 "Production is not considered GREEN from source promotion alone."
],"Build 523 README")
require(blockers,["Build 523 adds read-only staff/mobile remediation closure outcome continuity","effectiveness","Southern Ontario"],"canonical HOLD backlog")
require(docindex,["BUILD523_STAFF_MOBILE_REMEDIATION_CLOSURE_OUTCOME_CONTINUITY.md","current bounded release contract"],"documentation index")
for text,label in [(dev,"Development Source Gate"),(prod,"Production Business Acceptance")]:
    require(text,[
      "python -m py_compile scripts/staff_mobile_remediation_closure_outcome_continuity_check.py",
      "node --check scripts/staff_mobile_remediation_closure_outcome_continuity_test.mjs",
      "node --check functions/api/_lib/staff-mobile-remediation-closure-outcome-continuity.js",
      "python scripts/staff_mobile_remediation_closure_outcome_continuity_check.py",
      "node scripts/staff_mobile_remediation_closure_outcome_continuity_test.mjs"
    ],label)
require(prodcheck,[
 '"staff_mobile_remediation_closure_outcome_continuity"',"scripts/staff_mobile_remediation_closure_outcome_continuity_check.py",
 "scripts/staff_mobile_remediation_closure_outcome_continuity_test.mjs"
],"Production business checker registry")
require(workflow,[
 "Build 523 — Staff & Mobile Remediation Closure Outcome Continuity Authority","staff-mobile-remediation-closure-outcome-continuity",
 "python scripts/staff_mobile_remediation_closure_outcome_continuity_check.py","node scripts/staff_mobile_remediation_closure_outcome_continuity_test.mjs"
],"Build 523 workflow")
for command in [
 [sys.executable,"scripts/staff_mobile_remediation_closure_readiness_check.py"],
 ["node","scripts/staff_mobile_remediation_closure_readiness_test.mjs"],
 [sys.executable,"scripts/booking_quote_experiment_follow_up_outcome_continuity_check.py"],
 ["node","scripts/booking_quote_experiment_follow_up_outcome_continuity_test.mjs"],
 ["node","scripts/staff_mobile_remediation_closure_outcome_continuity_test.mjs"]
]:
    p=subprocess.run(command,cwd=ROOT,text=True,capture_output=True)
    if p.returncode: errors.append(f"retained authority failed: {' '.join(command)}: {p.stderr.strip() or p.stdout.strip()}")
for p in ["functions/api/_lib/staff-mobile-remediation-closure-outcome-continuity.js","functions/api/admin/staff_mobile_remediation_closure_readiness.js","scripts/staff_mobile_remediation_closure_outcome_continuity_test.mjs"]:
    r=subprocess.run(["node","--check",p],cwd=ROOT,text=True,capture_output=True)
    if r.returncode: errors.append(f"{p} syntax failed: {r.stderr.strip() or r.stdout.strip()}")
migrations=[p for p in ROOT.rglob("*.sql") if re.search(r"(?:^|[^0-9])523(?:[^0-9]|$)",p.name)]
if migrations: errors.append("Build 523 must not introduce schema migration: "+", ".join(str(p.relative_to(ROOT)) for p in migrations))
if errors:
    print("BUILD 523 STAFF & MOBILE REMEDIATION CLOSURE OUTCOME CONTINUITY AUTHORITY: FAIL")
    for e in errors: print(" -",e)
    sys.exit(1)
print("BUILD 523 STAFF & MOBILE REMEDIATION CLOSURE OUTCOME CONTINUITY AUTHORITY: PASS")
print(" - exact Build 513 closure-readiness evidence remains authoritative")
print(" - explicit close/retain-open outcomes require exact trace match and review after retained evidence")
print(" - workflow/role/device/browser, sample, confounder and Southern Ontario weather/site context remain explicit")
print(" - effectiveness, causation, staff fault, device fault and business impact remain undecided")
print(" - no automatic closure, role/task/support, outreach, provider/business, canonical-HOLD, schema/storage or polling mutation is authorized")
