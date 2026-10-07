#!/usr/bin/env python3
"""Build 538 source authority for Controlled-Environment Routing & Capacity Evidence Integrity Review."""
from pathlib import Path
import re, subprocess, sys

ROOT=Path(__file__).resolve().parents[1]
errors=[]
def read(path):
    p=ROOT/path
    if not p.is_file(): errors.append(f"missing required file: {path}"); return ""
    return p.read_text(encoding="utf-8",errors="ignore")
def require(text,needles,label):
    for needle in needles:
        if needle not in text: errors.append(f"{label} missing {needle!r}")

helper=read("functions/api/_lib/controlled-environment-routing-capacity-evidence-integrity-review.js")
endpoint=read("functions/api/admin/service_economics_commercial_capacity_review.js")
client=read("assets/build473-service-economics-allocation-margin-review-readiness.js")
page=read("admin-service-economics-commercial-capacity-review.html")
copy=read("admin-service-economics-commercial-capacity-review/index.html")
doc=read("BUILD538_CONTROLLED_ENVIRONMENT_ROUTING_CAPACITY_EVIDENCE_INTEGRITY_REVIEW.md")
roadmap=read("FORWARD_BUILD_ROADMAP_536_545.md")
queue=read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff=read("AI_PROJECT_HANDOFF.md")
readme=read("README.md")
blockers=read("STARTUP_GO_LIVE_BLOCKERS.md")
docindex=read("DOC_INDEX.md")
dev=read(".github/workflows/development-source-gate.yml")
prod=read(".github/workflows/production-business-acceptance-authority.yml")
prodcheck=read("scripts/production_business_acceptance_check.py")
workflow=read(".github/workflows/controlled-environment-routing-capacity-evidence-integrity-review-authority.yml")

if page!=copy: errors.append("Build 538 protected route copies diverged")
if len(re.findall(r"<h1\b",page,re.I))!=1: errors.append("Build 538 page must retain exactly one H1")

require(helper,[
    "controlled_environment_routing_capacity_integrity_build: 538",
    'controlled_environment_routing_capacity_integrity_authority: "controlled_environment_routing_capacity_evidence_integrity_review"',
    '"integrity_current"',
    '"retained_routing_capacity_review_required"',
    '"service_site_workflow_identity_review_required"',
    '"service_site_workflow_identity_drift_review_required"',
    '"routing_outcome_identity_review_required"',
    '"site_confirmation_identity_review_required"',
    '"safe_reschedule_identity_review_required"',
    '"bounded_capacity_context_identity_review_required"',
    "controlled_environment_identity_may_be_inferred_from_source_or_runtime_green: false",
    "successful_route_proves_another_service_safe_operability: false",
    "bounded_observed_capacity_proves_future_capacity: false",
    "persistent_telemetry_allowed: false"
],"Build 538 helper")

require(endpoint,[
    "buildControlledEnvironmentRoutingCapacityEvidenceIntegrityReview",
    'authority:"controlled_environment_routing_capacity_evidence_integrity_review"',
    'retained_routing_capacity_freshness_authority:"controlled_environment_routing_outcome_freshness_capacity_review"',
    'retained_routing_outcome_authority:"controlled_environment_routing_outcome_evidence_continuity"'
],"Build 538 endpoint")

require(client,[
    "renderControlledEnvironmentRoutingCapacityEvidenceIntegrityReview",
    "controlledEnvironmentRoutingCapacityIntegrityGrid",
    "Service/site/workflow identity",
    "Site confirmation identity",
    "Bounded capacity context"
],"Build 538 client")

require(page,[
    'data-build538="controlled-environment-routing-capacity-evidence-integrity-review"',
    "Build 538 · Controlled-Environment Routing &amp; Capacity Evidence Integrity Review",
    'id="controlledEnvironmentRoutingCapacityIntegrityGrid"',
    "A qualified site or successful route does not establish universal indoor capability",
    "Missing identity snapshots remain manual review/HOLD."
],"Build 538 page")

require(doc,[
    "# Build 538 — Controlled-Environment Routing & Capacity Evidence Integrity Review",
    "integrity_current",
    "service_site_workflow_identity_review_required",
    "site_confirmation_identity_review_required",
    "safe_reschedule_identity_review_required",
    "bounded_capacity_context_identity_review_required",
    "Build 539 — Provider & Local Search Closure Evidence Integrity Review"
],"Build 538 contract")

require(roadmap,[
    "### Build 538 — Controlled-Environment Routing & Capacity Evidence Integrity Review",
    "### Build 539 — Provider & Local Search Closure Evidence Integrity Review",
    "A qualified site or successful route does not establish universal indoor capability",
    "Storage and mutation rule"
],"renewed roadmap")

require(queue,[
    "**Build 538 — Controlled-Environment Routing & Capacity Evidence Integrity Review** is the active bounded release.",
    "**Build 539 — Provider & Local Search Closure Evidence Integrity Review** is next",
    "BUILD538_CONTROLLED_ENVIRONMENT_ROUTING_CAPACITY_EVIDENCE_INTEGRITY_REVIEW.md",
    "it has not run out",
    "Production deployment/runtime/business acceptance"
],"release queue")

require(handoff,[
    "**Build 538 — Controlled-Environment Routing & Capacity Evidence Integrity Review** is the active bounded release.",
    "**Build 539 — Provider & Local Search Closure Evidence Integrity Review** is next",
    "BUILD538_CONTROLLED_ENVIRONMENT_ROUTING_CAPACITY_EVIDENCE_INTEGRITY_REVIEW.md",
    "controlled_environment_routing_capacity_evidence_integrity_review_check.py",
    "Production deployment/runtime/business acceptance must independently prove that exact SHA."
],"project handoff")

require(readme,[
    "Current source direction: **Build 538 — Controlled-Environment Routing & Capacity Evidence Integrity Review**.",
    "BUILD538_CONTROLLED_ENVIRONMENT_ROUTING_CAPACITY_EVIDENCE_INTEGRITY_REVIEW.md",
    "scripts/controlled_environment_routing_capacity_evidence_integrity_review_check.py",
    "Production is not considered GREEN from source promotion alone."
],"README")

require(blockers,[
    "Seasonal service capability & transparency",
    "Build 538 adds read-only controlled-environment routing/capacity evidence integrity review",
    "Missing identity snapshots remain manual review/HOLD"
],"canonical HOLD backlog")

require(docindex,[
    "BUILD538_CONTROLLED_ENVIRONMENT_ROUTING_CAPACITY_EVIDENCE_INTEGRITY_REVIEW.md",
    "current bounded release contract"
],"documentation index")

for text,label in [(dev,"Development Source Gate"),(prod,"Production Business Acceptance")]:
    require(text,[
        "python -m py_compile scripts/controlled_environment_routing_capacity_evidence_integrity_review_check.py",
        "node --check scripts/controlled_environment_routing_capacity_evidence_integrity_review_test.mjs",
        "node --check functions/api/_lib/controlled-environment-routing-capacity-evidence-integrity-review.js",
        "python scripts/controlled_environment_routing_capacity_evidence_integrity_review_check.py",
        "node scripts/controlled_environment_routing_capacity_evidence_integrity_review_test.mjs"
    ],label)

require(prodcheck,[
    '"controlled_environment_routing_capacity_evidence_integrity_review"',
    "scripts/controlled_environment_routing_capacity_evidence_integrity_review_check.py",
    "scripts/controlled_environment_routing_capacity_evidence_integrity_review_test.mjs"
],"central Production acceptance")

require(workflow,[
    "Controlled-Environment Routing & Capacity Evidence Integrity Review Authority",
    "python scripts/controlled_environment_routing_capacity_evidence_integrity_review_check.py",
    "node scripts/controlled_environment_routing_capacity_evidence_integrity_review_test.mjs",
    "Service/site/workflow identity: EXPLICIT OR REVIEW",
    "Route/site-confirmation/safe-reschedule identity: EXPLICIT OR REVIEW",
    "Bounded observed-capacity context: EXACT SNAPSHOT OR REVIEW",
    "Supabase/schema/storage/persistent telemetry growth: NONE"
],"Build 538 workflow")

migrations=[p for p in ROOT.rglob("*.sql") if re.search(r"(?:^|[^0-9])538(?:[^0-9]|$)",p.name)]
if migrations: errors.append("Build 538 must not introduce a schema migration: "+", ".join(str(p.relative_to(ROOT)) for p in migrations))

for path in [
    "functions/api/_lib/controlled-environment-routing-capacity-evidence-integrity-review.js",
    "functions/api/admin/service_economics_commercial_capacity_review.js",
    "assets/build473-service-economics-allocation-margin-review-readiness.js",
    "scripts/controlled_environment_routing_capacity_evidence_integrity_review_test.mjs"
]:
    proc=subprocess.run(["node","--check",path],cwd=ROOT,text=True,capture_output=True)
    if proc.returncode: errors.append(f"{path} syntax failed: {proc.stderr.strip() or proc.stdout.strip()}")

if errors:
    print("BUILD 538 CONTROLLED-ENVIRONMENT ROUTING & CAPACITY EVIDENCE INTEGRITY REVIEW AUTHORITY: FAIL")
    for error in errors: print(" -",error)
    sys.exit(1)

for command in [
    ["node","scripts/controlled_environment_routing_outcome_freshness_capacity_review_test.mjs"],
    ["node","scripts/controlled_environment_routing_capacity_evidence_integrity_review_test.mjs"]
]:
    proc=subprocess.run(command,cwd=ROOT,text=True,capture_output=True)
    if proc.returncode:
        print("BUILD 538 CONTROLLED-ENVIRONMENT ROUTING & CAPACITY EVIDENCE INTEGRITY REVIEW AUTHORITY: FAIL")
        print(proc.stderr.strip() or proc.stdout.strip())
        sys.exit(proc.returncode)

print("BUILD 538 CONTROLLED-ENVIRONMENT ROUTING & CAPACITY EVIDENCE INTEGRITY REVIEW AUTHORITY: PASS")
print(" - Build 528 routing/capacity freshness remains the retained authority")
print(" - service/site/workflow and routing outcome identities are explicit or fail closed to review/HOLD")
print(" - routed outcomes require exact current site-confirmation identity; safe reschedules require exact attributable identity")
print(" - bounded capacity context is exact, site-specific historical evidence only")
print(" - universal indoor capability, another-service safe operability and future capacity are never inferred")
print(" - Supabase/schema/storage/persistent-telemetry/routing/reschedule/capacity-reservation/HOLD mutation remains NONE")
