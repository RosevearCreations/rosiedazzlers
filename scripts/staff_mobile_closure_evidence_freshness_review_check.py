#!/usr/bin/env python3
"""Build 533 Staff & Mobile Closure Evidence Freshness Review authority."""
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
        if needle not in text:
            errors.append(f"{label} missing {needle!r}")

helper=read("functions/api/_lib/staff-mobile-closure-evidence-freshness-review.js")
endpoint=read("functions/api/admin/staff_mobile_remediation_closure_readiness.js")
doc=read("BUILD533_STAFF_MOBILE_CLOSURE_EVIDENCE_FRESHNESS_REVIEW.md")
roadmap=read("FORWARD_BUILD_ROADMAP_526_535.md")
queue=read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff=read("AI_PROJECT_HANDOFF.md")
readme=read("README.md")
blockers=read("STARTUP_GO_LIVE_BLOCKERS.md")
docindex=read("DOC_INDEX.md")
dev=read(".github/workflows/development-source-gate.yml")
prod=read(".github/workflows/production-business-acceptance-authority.yml")
prodcheck=read("scripts/production_business_acceptance_check.py")
workflow=read(".github/workflows/staff-mobile-closure-evidence-freshness-review-authority.yml")

require(helper,[
    "staff_mobile_closure_freshness_build: 533",
    'staff_mobile_closure_freshness_authority: "staff_mobile_closure_evidence_freshness_review"',
    '"retained_closure_outcome_review_required"',
    '"closure_outcome_trace_conflict_review_required"',
    '"workflow_role_device_browser_context_review_required"',
    '"like_for_like_sample_window_review_required"',
    '"confounder_weather_site_review_required"',
    '"retained_closure_evidence_freshness_review_required"',
    '"owner_closure_outcome_freshness_review_required"',
    '"closure_outcome_current"',
    '"retain_open_outcome_current"',
    "materially_like_for_like_observation_required: true",
    "comparable_window_or_sample_required: true",
    "remediation_effective: null",
    "causation: null",
    "staff_fault: null",
    "device_fault: null",
    "business_impact: null",
    "schema_or_storage_mutation_performed: false",
    "permanent_polling: false"
],"Build 533 helper")

require(endpoint,[
    "buildStaffMobileClosureEvidenceFreshnessReview",
    "staff_mobile_closure_freshness_build:533",
    'staff_mobile_closure_freshness_authority:"staff_mobile_closure_evidence_freshness_review"',
    "staff_mobile_closure_evidence_freshness_review:closureFreshness",
    '"X-Rosie-Staff-Mobile-Closure-Freshness":"build-533-read-only"',
    "GET,HEAD,OPTIONS"
],"Build 533 endpoint")
for forbidden in ["onRequestPost","onRequestPatch","onRequestDelete","onRequestPut","setInterval(","localStorage","sessionStorage"]:
    if forbidden in endpoint:
        errors.append(f"Build 533 endpoint contains forbidden mutation/polling token {forbidden!r}")

require(doc,[
    "# Build 533 — Staff & Mobile Closure Evidence Freshness Review",
    "materially like-for-like",
    "Southern Ontario weather/site",
    "adds no schema migration",
    "Build 534 — Service Economics, Seasonal Capacity & Reliability Evidence Freshness Review"
],"Build 533 contract")
require(roadmap,[
    "### Build 533 — Staff & Mobile Closure Evidence Freshness Review",
    "workflow/role/device/browser observations",
    "recorded confounders",
    "### Build 534 — Service Economics, Seasonal Capacity & Reliability Evidence Freshness Review"
],"renewed roadmap")
require(queue,[
    "**Build 533 — Staff & Mobile Closure Evidence Freshness Review** is the active bounded release.",
    "**Build 534 — Service Economics, Seasonal Capacity & Reliability Evidence Freshness Review** is next",
    "BUILD533_STAFF_MOBILE_CLOSURE_EVIDENCE_FRESHNESS_REVIEW.md",
    "BUILD523_STAFF_MOBILE_REMEDIATION_CLOSURE_OUTCOME_CONTINUITY.md",
    "non-force fast-forward",
    "it has not run out"
],"release queue")
require(handoff,[
    "**Build 533 — Staff & Mobile Closure Evidence Freshness Review** is the active bounded release.",
    "**Build 534 — Service Economics, Seasonal Capacity & Reliability Evidence Freshness Review** is next",
    "BUILD533_STAFF_MOBILE_CLOSURE_EVIDENCE_FRESHNESS_REVIEW.md",
    "staff_mobile_closure_evidence_freshness_review_check.py",
    "BUILD523_STAFF_MOBILE_REMEDIATION_CLOSURE_OUTCOME_CONTINUITY.md"
],"project handoff")
require(readme,[
    "Current source direction: **Build 533 — Staff & Mobile Closure Evidence Freshness Review**.",
    "BUILD533_STAFF_MOBILE_CLOSURE_EVIDENCE_FRESHNESS_REVIEW.md",
    "scripts/staff_mobile_closure_evidence_freshness_review_check.py",
    "Production is not considered GREEN from source promotion alone."
],"README")
require(blockers,[
    "Build 533 adds read-only staff/mobile closure evidence freshness review",
    "like-for-like",
    "No remediation effectiveness, causation, staff fault, device fault or business impact is inferred"
],"canonical HOLD backlog")
require(docindex,[
    "BUILD533_STAFF_MOBILE_CLOSURE_EVIDENCE_FRESHNESS_REVIEW.md",
    "current bounded release contract"
],"documentation index")

for text,label in [(dev,"Development Source Gate"),(prod,"Production Business Acceptance")]:
    require(text,[
        "python -m py_compile scripts/staff_mobile_closure_evidence_freshness_review_check.py",
        "node --check scripts/staff_mobile_closure_evidence_freshness_review_test.mjs",
        "node --check functions/api/_lib/staff-mobile-closure-evidence-freshness-review.js",
        "python scripts/staff_mobile_closure_evidence_freshness_review_check.py",
        "node scripts/staff_mobile_closure_evidence_freshness_review_test.mjs"
    ],label)

require(prodcheck,[
    '"staff_mobile_closure_evidence_freshness_review"',
    "scripts/staff_mobile_closure_evidence_freshness_review_check.py",
    "scripts/staff_mobile_closure_evidence_freshness_review_test.mjs"
],"central Production acceptance")
require(workflow,[
    "Staff & Mobile Closure Evidence Freshness Review Authority",
    "staff-mobile-closure-evidence-freshness-review",
    "python scripts/staff_mobile_closure_evidence_freshness_review_check.py",
    "node scripts/staff_mobile_closure_evidence_freshness_review_test.mjs",
    "Schema / storage / telemetry / polling mutation: NONE"
],"Build 533 workflow")

migrations=[p for p in ROOT.rglob("*.sql") if re.search(r"(?:^|[^0-9])533(?:[^0-9]|$)",p.name)]
if migrations:
    errors.append("Build 533 must not introduce schema migration: "+", ".join(str(p.relative_to(ROOT)) for p in migrations))

for path in [
    "functions/api/_lib/staff-mobile-closure-evidence-freshness-review.js",
    "functions/api/admin/staff_mobile_remediation_closure_readiness.js",
    "scripts/staff_mobile_closure_evidence_freshness_review_test.mjs"
]:
    proc=subprocess.run(["node","--check",path],cwd=ROOT,text=True,capture_output=True)
    if proc.returncode:
        errors.append(f"{path} syntax failed: {proc.stderr.strip() or proc.stdout.strip()}")

if errors:
    print("BUILD 533 STAFF & MOBILE CLOSURE EVIDENCE FRESHNESS REVIEW AUTHORITY: FAIL")
    for error in errors:
        print(" -",error)
    sys.exit(1)

for command in [
    ["node","scripts/staff_mobile_closure_evidence_freshness_review_test.mjs"],
    ["node","scripts/staff_mobile_remediation_closure_outcome_continuity_test.mjs"],
    ["node","scripts/staff_mobile_remediation_closure_readiness_test.mjs"],
    ["node","scripts/staff_mobile_remediation_outcome_interpretation_follow_up_test.mjs"],
    ["node","scripts/staff_mobile_remediation_outcome_evidence_test.mjs"],
    ["node","scripts/staff_mobile_remediation_execution_evidence_readiness_test.mjs"],
    ["node","scripts/staff_mobile_remediation_verification_test.mjs"],
    ["node","scripts/staff_mobile_friction_remediation_priorities_test.mjs"],
    ["node","scripts/staff_support_mobile_efficiency_learning_test.mjs"]
]:
    proc=subprocess.run(command,cwd=ROOT,text=True,capture_output=True)
    if proc.returncode:
        print("BUILD 533 STAFF & MOBILE CLOSURE EVIDENCE FRESHNESS REVIEW AUTHORITY: FAIL")
        print(proc.stderr.strip() or proc.stdout.strip())
        sys.exit(proc.returncode)

print("BUILD 533 STAFF & MOBILE CLOSURE EVIDENCE FRESHNESS REVIEW AUTHORITY: PASS")
print(" - retained Build 523 close/retain-open outcome remains explicit and trace-matched")
print(" - workflow/role/device/browser and comparable sample/window evidence remain materially like-for-like")
print(" - confounder and Southern Ontario weather/site review remains explicit")
print(" - retained evidence and owner review must remain current")
print(" - no effectiveness, causation, staff/device fault, business-impact, schema/storage, telemetry or polling mutation is authorized")
