#!/usr/bin/env python3
"""Build 503 source authority for Staff & Mobile Remediation Outcome Interpretation & Follow-Up."""
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
def require(text, needles, label):
    for needle in needles:
        if needle not in text: errors.append(f"{label} missing {needle!r}")

helper=read("functions/api/_lib/staff-support-mobile-efficiency-learning.js")
interpret=read("functions/api/_lib/staff-mobile-remediation-outcome-interpretation-follow-up.js")
endpoint=read("functions/api/admin/staff_support_mobile_efficiency_learning.js")
page=read("admin-staff-workflow-support-learning.html")
route=read("admin-staff-workflow-support-learning/index.html")
client=read("assets/build452-staff-support-mobile-efficiency-learning.js")
test=read("scripts/staff_mobile_remediation_outcome_interpretation_follow_up_test.mjs")
contract=read("BUILD503_STAFF_MOBILE_REMEDIATION_OUTCOME_INTERPRETATION_FOLLOW_UP.md")
roadmap=read("FORWARD_BUILD_ROADMAP_496_505.md")
queue=read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff=read("AI_PROJECT_HANDOFF.md")
readme=read("README.md")
workflow=read(".github/workflows/staff-mobile-remediation-outcome-interpretation-follow-up-authority.yml")
dev=read(".github/workflows/development-source-gate.yml")
prod=read(".github/workflows/production-business-acceptance-authority.yml")
prod_check=read("scripts/production_business_acceptance_check.py")
retained493=read("scripts/staff_mobile_remediation_outcome_evidence_check.py")

if page != route: errors.append("Build 503 .html and folder-index routes must remain byte-identical")
if len(re.findall(r"<h1\b",page,re.I)) != 1: errors.append("Build 503 learning page must retain exactly one H1")

require(helper,[
 "remediation_outcome_interpretation_follow_up_build: 503",
 'remediation_outcome_interpretation_follow_up_authority: "staff_mobile_remediation_outcome_interpretation_follow_up"',
 "remediation_outcome_interpretation_follow_up_summary",
 "remediation_outcome_interpretation_follow_up",
 "single_like_for_like_pair_proves_effectiveness: false",
 "descriptive_delta_proves_staff_or_device_fault: false",
 "automatic_follow_up_action_allowed: false",
 "interpretation_persistence_allowed: false"
],"Build 503 helper integration")
require(interpret,[
 '"outcome_evidence_not_review_ready"',
 '"comparable_outcome_rows_required"',
 '"bounded_descriptive_interpretation_follow_up_ready"',
 '"descriptive_follow_up_required"',
 '"repeat_like_for_like_observation_required"',
 "favorable_or_unfavorable_inferred: false",
 "effectiveness_inferred: false",
 "causation_inferred: false",
 "remediation_effective: null",
 "staff_fault: null",
 "device_fault: null",
 "counts_as_staff_mobile_friction: false",
 "service_temperature_limit_inferred: false"
],"Build 503 interpretation helper")
require(endpoint,[
 "remediation_outcome_evidence: []","remediation_outcome_source_available: false",
 'capability: "manage_bookings"','requireActionAccess(access.actor, "it.runtime.view")',
 "onRequestPost","onRequestPut","onRequestPatch","onRequestDelete"
],"retained GET-only endpoint")
require(page,[
 'data-build503="staff-mobile-remediation-outcome-interpretation-follow-up"',
 "Build 503 · Staff &amp; Mobile Remediation Outcome Interpretation &amp; Follow-Up",
 "Staff &amp; Mobile Remediation Outcome Interpretation &amp; Follow-Up",
 'id="remediationOutcomeInterpretationList"',
 "Build 493 remediation outcome evidence",
 "Southern Ontario weather/site restrictions remain separate"
],"Build 503 page")
require(client,[
 "renderOutcomeInterpretation","remediationOutcomeInterpretationList",
 "Build 503 descriptive interpretation",
 "Effectiveness: UNDECIDED","Staff fault: UNDECIDED","Device fault: UNDECIDED",
 "No background monitoring is running.","/api/admin/staff_support_mobile_efficiency_learning"
],"Build 503 client")
for forbidden in ("setInterval(", "localStorage", "sessionStorage", 'method: "POST"', 'method: "PUT"', 'method: "PATCH"', 'method: "DELETE"'):
    if forbidden in client: errors.append(f"Build 503 client must not contain {forbidden!r}")

require(test,["BUILD 503 STAFF & MOBILE REMEDIATION OUTCOME INTERPRETATION & FOLLOW-UP TEST: PASS"],"Build 503 behavioral proof")
require(contract,[
 "# Build 503 — Staff & Mobile Remediation Outcome Interpretation & Follow-Up",
 "Descriptive interpretation only","Follow-up boundary","Southern Ontario weather/site boundary",
 "Build 504 — Service Economics, Seasonal Capacity & Reliability Trend Continuity"
],"Build 503 contract")
require(roadmap,[
 "### Build 503 — Staff & Mobile Remediation Outcome Interpretation & Follow-Up",
 "materially like-for-like before/after evidence",
 "### Build 504 — Service Economics, Seasonal Capacity & Reliability Trend Continuity"
],"active roadmap")
require(queue,[
 "**Build 503 — Staff & Mobile Remediation Outcome Interpretation & Follow-Up** is the active bounded release.",
 "**Build 504 — Service Economics, Seasonal Capacity & Reliability Trend Continuity** is next",
 "BUILD503_STAFF_MOBILE_REMEDIATION_OUTCOME_INTERPRETATION_FOLLOW_UP.md","it has not run out"
],"Build 503 queue")
require(handoff,[
 "**Build 503 — Staff & Mobile Remediation Outcome Interpretation & Follow-Up** is the active bounded release.",
 "BUILD503_STAFF_MOBILE_REMEDIATION_OUTCOME_INTERPRETATION_FOLLOW_UP.md",
 "staff_mobile_remediation_outcome_interpretation_follow_up_check.py"
],"Build 503 handoff")
require(readme,[
 "Current source direction: **Build 503 — Staff & Mobile Remediation Outcome Interpretation & Follow-Up**.",
 "BUILD503_STAFF_MOBILE_REMEDIATION_OUTCOME_INTERPRETATION_FOLLOW_UP.md",
 "staff_mobile_remediation_outcome_interpretation_follow_up_check.py",
 "Production is not considered GREEN from source promotion alone."
],"Build 503 README")
require(workflow,[
 "Build 503 — Staff & Mobile Remediation Outcome Interpretation & Follow-Up Authority",
 "staff-mobile-remediation-outcome-interpretation-follow-up",
 "python scripts/staff_mobile_remediation_outcome_interpretation_follow_up_check.py",
 "node scripts/staff_mobile_remediation_outcome_interpretation_follow_up_test.mjs"
],"Build 503 focused workflow")
for gate,label in ((dev,"Development source gate"),(prod,"Production business acceptance")):
    require(gate,[
      "python scripts/staff_mobile_remediation_outcome_interpretation_follow_up_check.py",
      "node scripts/staff_mobile_remediation_outcome_interpretation_follow_up_test.mjs"
    ],label)
require(prod_check,[
 '"staff_mobile_remediation_outcome_interpretation_follow_up"',
 "scripts/staff_mobile_remediation_outcome_interpretation_follow_up_check.py",
 "scripts/staff_mobile_remediation_outcome_interpretation_follow_up_test.mjs",
 "Validate staff & mobile remediation outcome interpretation & follow-up authority"
],"central Production acceptance")
require(retained493,[
 "BUILD493_STAFF_MOBILE_REMEDIATION_OUTCOME_EVIDENCE.md",
 "staff_mobile_remediation_outcome_evidence_test.mjs"
],"retained Build 493 authority")

migrations=[p for p in ROOT.rglob("*.sql") if re.search(r"(?:^|[^0-9])503(?:[^0-9]|$)",p.name)]
if migrations: errors.append("Build 503 must not introduce schema migration: "+", ".join(str(p.relative_to(ROOT)) for p in migrations))

for p in [
 "functions/api/_lib/staff-mobile-remediation-outcome-interpretation-follow-up.js",
 "functions/api/_lib/staff-support-mobile-efficiency-learning.js",
 "functions/api/admin/staff_support_mobile_efficiency_learning.js",
 "assets/build452-staff-support-mobile-efficiency-learning.js",
 "scripts/staff_mobile_remediation_outcome_interpretation_follow_up_test.mjs"
]:
    r=subprocess.run(["node","--check",p],cwd=ROOT,text=True,capture_output=True)
    if r.returncode: errors.append(f"{p} syntax failed: {r.stderr.strip() or r.stdout.strip()}")

for command in [
 ["node","scripts/staff_mobile_remediation_outcome_interpretation_follow_up_test.mjs"],
 ["python","scripts/staff_mobile_remediation_outcome_evidence_check.py"],
 ["node","scripts/staff_mobile_remediation_outcome_evidence_test.mjs"],
 ["python","scripts/staff_mobile_remediation_execution_evidence_readiness_check.py"],
 ["node","scripts/staff_mobile_remediation_execution_evidence_readiness_test.mjs"]
]:
    r=subprocess.run(command,cwd=ROOT,text=True,capture_output=True)
    if r.returncode: errors.append(f"retained/behavioral authority failed: {' '.join(command)}: {r.stderr.strip() or r.stdout.strip()}")

if errors:
    print("BUILD 503 STAFF & MOBILE REMEDIATION OUTCOME INTERPRETATION & FOLLOW-UP AUTHORITY: FAIL")
    for e in errors: print(" -",e)
    sys.exit(1)
print("BUILD 503 STAFF & MOBILE REMEDIATION OUTCOME INTERPRETATION & FOLLOW-UP AUTHORITY: PASS")
print(" - interpretation is limited to retained Build 493 materially comparable attributable outcome rows")
print(" - before/after delta and arithmetic percent movement remain descriptive, not effectiveness or causation")
print(" - follow-up preserves measure, workflow, role, representative device/browser, sample/window and confounder context")
print(" - Southern Ontario weather/site restrictions remain separate from staff/mobile friction")
print(" - no automatic remediation, role change, closure, outreach, persistence, telemetry or polling is introduced")
