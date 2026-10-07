#!/usr/bin/env python3
"""Build 537 source authority for Winter Booking & Quote Rule Evidence Integrity Review."""
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

helper=read("functions/api/_lib/winter-booking-quote-rule-evidence-integrity-review.js")
endpoint=read("functions/api/admin/service_economics_commercial_capacity_review.js")
client=read("assets/build473-service-economics-allocation-margin-review-readiness.js")
page=read("admin-service-economics-commercial-capacity-review.html")
copy=read("admin-service-economics-commercial-capacity-review/index.html")
doc=read("BUILD537_WINTER_BOOKING_QUOTE_RULE_EVIDENCE_INTEGRITY_REVIEW.md")
roadmap=read("FORWARD_BUILD_ROADMAP_536_545.md")
queue=read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff=read("AI_PROJECT_HANDOFF.md")
readme=read("README.md")
blockers=read("STARTUP_GO_LIVE_BLOCKERS.md")
docindex=read("DOC_INDEX.md")
dev=read(".github/workflows/development-source-gate.yml")
prod=read(".github/workflows/production-business-acceptance-authority.yml")
prodcheck=read("scripts/production_business_acceptance_check.py")
workflow=read(".github/workflows/winter-booking-quote-rule-evidence-integrity-review-authority.yml")

if page!=copy: errors.append("Build 537 protected route copies diverged")
if len(re.findall(r"<h1\b",page,re.I))!=1: errors.append("Build 537 page must retain exactly one H1")

require(helper,[
    "winter_booking_quote_rule_integrity_build: 537",
    'winter_booking_quote_rule_integrity_authority: "winter_booking_quote_rule_evidence_integrity_review"',
    '"integrity_current"',
    '"decision_trace_identity_review_required"',
    '"decision_trace_identity_drift_review_required"',
    '"service_classification_integrity_review_required"',
    '"customer_transparency_integrity_review_required"',
    '"booking_quote_rule_integrity_review_required"',
    '"runtime_safety_identity_review_required"',
    '"runtime_safety_identity_drift_review_required"',
    '"freshness_window_integrity_review_required"',
    "winter_rule_identity_may_be_inferred_from_source_or_runtime_green: false",
    'retained_availability_authority: "/api/availability"',
    'retained_checkout_collision_authority: "checkout_server_side_collision_revalidation"',
    "persistent_telemetry_allowed: false"
],"Build 537 helper")

require(endpoint,[
    "buildWinterBookingQuoteRuleEvidenceIntegrityReview",
    'authority:"winter_booking_quote_rule_evidence_integrity_review"',
    'retained_winter_rule_freshness_authority:"winter_booking_quote_rule_outcome_freshness_review"',
    'retained_availability_authority:"/api/availability"'
],"Build 537 endpoint")

require(client,[
    "renderWinterBookingQuoteRuleEvidenceIntegrityReview",
    "winterRuleEvidenceIntegrityReviewGrid",
    "Decision trace identity",
    "Runtime safety identity",
    "Evidence integrity current"
],"Build 537 client")

require(page,[
    'data-build537="winter-booking-quote-rule-evidence-integrity-review"',
    "Build 537 · Winter Booking &amp; Quote Rule Evidence Integrity Review",
    'id="winterRuleEvidenceIntegrityReviewGrid"',
    "Weather-ineligible sessions remain outside ordinary conversion interpretation.",
    "Missing identity snapshots remain manual review/HOLD."
],"Build 537 page")

require(doc,[
    "# Build 537 — Winter Booking & Quote Rule Evidence Integrity Review",
    "integrity_current",
    "decision_trace_identity_review_required",
    "customer_transparency_integrity_review_required",
    "runtime_safety_identity_review_required",
    "Build 538 — Controlled-Environment Routing & Capacity Evidence Integrity Review"
],"Build 537 contract")

require(roadmap,[
    "### Build 537 — Winter Booking & Quote Rule Evidence Integrity Review",
    "### Build 538 — Controlled-Environment Routing & Capacity Evidence Integrity Review",
    "Weather-ineligible sessions remain outside ordinary conversion interpretation",
    "Storage and mutation rule"
],"renewed roadmap")

require(queue,[
    "**Build 537 — Winter Booking & Quote Rule Evidence Integrity Review** is the active bounded release.",
    "**Build 538 — Controlled-Environment Routing & Capacity Evidence Integrity Review** is next",
    "BUILD537_WINTER_BOOKING_QUOTE_RULE_EVIDENCE_INTEGRITY_REVIEW.md",
    "it has not run out",
    "Production deployment/runtime/business acceptance"
],"release queue")

require(handoff,[
    "**Build 537 — Winter Booking & Quote Rule Evidence Integrity Review** is the active bounded release.",
    "**Build 538 — Controlled-Environment Routing & Capacity Evidence Integrity Review** is next",
    "BUILD537_WINTER_BOOKING_QUOTE_RULE_EVIDENCE_INTEGRITY_REVIEW.md",
    "winter_booking_quote_rule_evidence_integrity_review_check.py",
    "Production deployment/runtime/business acceptance must independently prove that exact SHA."
],"project handoff")

require(readme,[
    "Current source direction: **Build 537 — Winter Booking & Quote Rule Evidence Integrity Review**.",
    "BUILD537_WINTER_BOOKING_QUOTE_RULE_EVIDENCE_INTEGRITY_REVIEW.md",
    "scripts/winter_booking_quote_rule_evidence_integrity_review_check.py",
    "Production is not considered GREEN from source promotion alone."
],"README")

require(blockers,[
    "Seasonal service capability & transparency",
    "Build 537 adds read-only winter booking/quote rule evidence integrity review",
    "Missing identity snapshots remain manual review/HOLD"
],"canonical HOLD backlog")

require(docindex,[
    "BUILD537_WINTER_BOOKING_QUOTE_RULE_EVIDENCE_INTEGRITY_REVIEW.md",
    "current bounded release contract"
],"documentation index")

for text,label in [(dev,"Development Source Gate"),(prod,"Production Business Acceptance")]:
    require(text,[
        "python -m py_compile scripts/winter_booking_quote_rule_evidence_integrity_review_check.py",
        "node --check scripts/winter_booking_quote_rule_evidence_integrity_review_test.mjs",
        "node --check functions/api/_lib/winter-booking-quote-rule-evidence-integrity-review.js",
        "python scripts/winter_booking_quote_rule_evidence_integrity_review_check.py",
        "node scripts/winter_booking_quote_rule_evidence_integrity_review_test.mjs"
    ],label)

require(prodcheck,[
    '"winter_booking_quote_rule_evidence_integrity_review"',
    "scripts/winter_booking_quote_rule_evidence_integrity_review_check.py",
    "scripts/winter_booking_quote_rule_evidence_integrity_review_test.mjs"
],"central Production acceptance")

require(workflow,[
    "Winter Booking & Quote Rule Evidence Integrity Review Authority",
    "python scripts/winter_booking_quote_rule_evidence_integrity_review_check.py",
    "node scripts/winter_booking_quote_rule_evidence_integrity_review_test.mjs",
    "Decision/outcome trace identity: EXPLICIT OR REVIEW",
    "Availability / checkout collision identity: EXPLICIT OR REVIEW",
    "Weather-ineligible sessions: EXCLUDED FROM ORDINARY CONVERSION INTERPRETATION",
    "Supabase/schema/storage/persistent telemetry growth: NONE"
],"Build 537 workflow")

migrations=[p for p in ROOT.rglob("*.sql") if re.search(r"(?:^|[^0-9])537(?:[^0-9]|$)",p.name)]
if migrations: errors.append("Build 537 must not introduce a schema migration: "+", ".join(str(p.relative_to(ROOT)) for p in migrations))

for path in [
    "functions/api/_lib/winter-booking-quote-rule-evidence-integrity-review.js",
    "functions/api/admin/service_economics_commercial_capacity_review.js",
    "assets/build473-service-economics-allocation-margin-review-readiness.js",
    "scripts/winter_booking_quote_rule_evidence_integrity_review_test.mjs"
]:
    proc=subprocess.run(["node","--check",path],cwd=ROOT,text=True,capture_output=True)
    if proc.returncode: errors.append(f"{path} syntax failed: {proc.stderr.strip() or proc.stdout.strip()}")

if errors:
    print("BUILD 537 WINTER BOOKING & QUOTE RULE EVIDENCE INTEGRITY REVIEW AUTHORITY: FAIL")
    for error in errors: print(" -",error)
    sys.exit(1)

for command in [
    ["node","scripts/winter_booking_quote_rule_outcome_freshness_review_test.mjs"],
    ["node","scripts/winter_booking_quote_rule_evidence_integrity_review_test.mjs"]
]:
    proc=subprocess.run(command,cwd=ROOT,text=True,capture_output=True)
    if proc.returncode:
        print("BUILD 537 WINTER BOOKING & QUOTE RULE EVIDENCE INTEGRITY REVIEW AUTHORITY: FAIL")
        print(proc.stderr.strip() or proc.stdout.strip())
        sys.exit(proc.returncode)

print("BUILD 537 WINTER BOOKING & QUOTE RULE EVIDENCE INTEGRITY REVIEW AUTHORITY: PASS")
print(" - Build 527 freshness remains the retained winter-rule freshness authority")
print(" - decision/outcome identity and service classification are explicit or fail closed to review/HOLD")
print(" - customer wording, retained booking/quote rule pair and runtime-safety identity are explicit")
print(" - /api/availability and checkout collision revalidation remain authoritative")
print(" - weather-ineligible sessions remain outside ordinary conversion interpretation")
print(" - Supabase/schema/storage/persistent-telemetry/booking/quote/checkout/HOLD mutation remains NONE")
