#!/usr/bin/env python3
"""Build 536 source authority for Seasonal Capability & Public Claim Evidence Integrity Review."""
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

helper=read("functions/api/_lib/seasonal-capability-public-claim-evidence-integrity-review.js")
endpoint=read("functions/api/admin/service_economics_commercial_capacity_review.js")
client=read("assets/build473-service-economics-allocation-margin-review-readiness.js")
page=read("admin-service-economics-commercial-capacity-review.html")
copy=read("admin-service-economics-commercial-capacity-review/index.html")
doc=read("BUILD536_SEASONAL_CAPABILITY_PUBLIC_CLAIM_EVIDENCE_INTEGRITY_REVIEW.md")
roadmap=read("FORWARD_BUILD_ROADMAP_536_545.md")
queue=read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff=read("AI_PROJECT_HANDOFF.md")
readme=read("README.md")
blockers=read("STARTUP_GO_LIVE_BLOCKERS.md")
docindex=read("DOC_INDEX.md")
dev=read(".github/workflows/development-source-gate.yml")
prod=read(".github/workflows/production-business-acceptance-authority.yml")
prodcheck=read("scripts/production_business_acceptance_check.py")
workflow=read(".github/workflows/seasonal-capability-public-claim-evidence-integrity-review-authority.yml")

if page!=copy:
    errors.append("Build 536 protected route copies diverged")
if len(re.findall(r"<h1\b",page,re.I))!=1:
    errors.append("Build 536 page must retain exactly one H1")

require(helper,[
    "seasonal_public_claim_integrity_build: 536",
    'seasonal_public_claim_integrity_authority: "seasonal_capability_public_claim_evidence_integrity_review"',
    '"integrity_current"',
    '"owning_evidence_identity_review_required"',
    '"owning_evidence_identity_drift_review_required"',
    '"owner_action_identity_review_required"',
    '"owner_action_identity_drift_review_required"',
    '"freshness_window_integrity_review_required"',
    '"source_owned_limit_integrity_review_required"',
    '"public_claim_wording_integrity_review_required"',
    "evidence_identity_may_be_inferred_from_source_or_runtime_green: false",
    "source_owned_temperature_limit_may_be_widened: false",
    "persistent_telemetry_allowed: false"
],"Build 536 helper")

require(endpoint,[
    "buildSeasonalCapabilityPublicClaimEvidenceIntegrityReview",
    'authority:"seasonal_capability_public_claim_evidence_integrity_review"',
    'retained_seasonal_public_claim_freshness_authority:"seasonal_capability_public_claim_outcome_freshness_review"'
],"Build 536 endpoint")

require(client,[
    "renderSeasonalPublicClaimEvidenceIntegrityReview",
    "seasonalPublicClaimEvidenceIntegrityReviewGrid",
    "Owning evidence identity",
    "Owner action identity",
    "Evidence integrity current"
],"Build 536 client")

require(page,[
    'data-build536="seasonal-capability-public-claim-evidence-integrity-review"',
    "Build 536 · Seasonal Capability &amp; Public Claim Evidence Integrity Review",
    'id="seasonalPublicClaimEvidenceIntegrityReviewGrid"',
    "Missing identity snapshots remain manual review/HOLD.",
    "Broad winter availability remains HOLD."
],"Build 536 page")

require(doc,[
    "# Build 536 — Seasonal Capability & Public Claim Evidence Integrity Review",
    "integrity_current",
    "owning_evidence_identity_review_required",
    "owner_action_identity_review_required",
    "freshness_window_integrity_review_required",
    "source_owned_limit_integrity_review_required",
    "Build 537 — Winter Booking & Quote Rule Evidence Integrity Review"
],"Build 536 contract")

require(roadmap,[
    "### Build 536 — Seasonal Capability & Public Claim Evidence Integrity Review",
    "### Build 537 — Winter Booking & Quote Rule Evidence Integrity Review",
    "source-owned limits",
    "Storage and mutation rule"
],"renewed roadmap")

require(queue,[
    "**Build 536 — Seasonal Capability & Public Claim Evidence Integrity Review** is the active bounded release.",
    "**Build 537 — Winter Booking & Quote Rule Evidence Integrity Review** is next",
    "BUILD536_SEASONAL_CAPABILITY_PUBLIC_CLAIM_EVIDENCE_INTEGRITY_REVIEW.md",
    "it has not run out",
    "Production deployment/runtime/business acceptance"
],"release queue")

require(handoff,[
    "**Build 536 — Seasonal Capability & Public Claim Evidence Integrity Review** is the active bounded release.",
    "**Build 537 — Winter Booking & Quote Rule Evidence Integrity Review** is next",
    "BUILD536_SEASONAL_CAPABILITY_PUBLIC_CLAIM_EVIDENCE_INTEGRITY_REVIEW.md",
    "seasonal_capability_public_claim_evidence_integrity_review_check.py",
    "Production deployment/runtime/business acceptance must independently prove that exact SHA."
],"project handoff")

require(readme,[
    "Current source direction: **Build 536 — Seasonal Capability & Public Claim Evidence Integrity Review**.",
    "BUILD536_SEASONAL_CAPABILITY_PUBLIC_CLAIM_EVIDENCE_INTEGRITY_REVIEW.md",
    "scripts/seasonal_capability_public_claim_evidence_integrity_review_check.py",
    "Production is not considered GREEN from source promotion alone."
],"README")

require(blockers,[
    "Seasonal service capability & transparency",
    "Build 536 adds read-only seasonal/public-claim evidence integrity review",
    "missing identity snapshots remain manual review/HOLD"
],"canonical HOLD backlog")

require(docindex,[
    "BUILD536_SEASONAL_CAPABILITY_PUBLIC_CLAIM_EVIDENCE_INTEGRITY_REVIEW.md",
    "current bounded release contract"
],"documentation index")

for text,label in [(dev,"Development Source Gate"),(prod,"Production Business Acceptance")]:
    require(text,[
        "python -m py_compile scripts/seasonal_capability_public_claim_evidence_integrity_review_check.py",
        "node --check scripts/seasonal_capability_public_claim_evidence_integrity_review_test.mjs",
        "node --check functions/api/_lib/seasonal-capability-public-claim-evidence-integrity-review.js",
        "python scripts/seasonal_capability_public_claim_evidence_integrity_review_check.py",
        "node scripts/seasonal_capability_public_claim_evidence_integrity_review_test.mjs"
    ],label)

require(prodcheck,[
    '"seasonal_capability_public_claim_evidence_integrity_review"',
    "scripts/seasonal_capability_public_claim_evidence_integrity_review_check.py",
    "scripts/seasonal_capability_public_claim_evidence_integrity_review_test.mjs"
],"central Production acceptance")

require(workflow,[
    "Seasonal Capability & Public Claim Evidence Integrity Review Authority",
    "python scripts/seasonal_capability_public_claim_evidence_integrity_review_check.py",
    "node scripts/seasonal_capability_public_claim_evidence_integrity_review_test.mjs",
    "Owning evidence identity: EXPLICIT OR REVIEW",
    "Owner/manual-publication identity: EXPLICIT OR REVIEW",
    "Supabase/schema/storage/persistent telemetry growth: NONE"
],"Build 536 workflow")

migrations=[p for p in ROOT.rglob("*.sql") if re.search(r"(?:^|[^0-9])536(?:[^0-9]|$)",p.name)]
if migrations:
    errors.append("Build 536 must not introduce a schema migration: "+", ".join(str(p.relative_to(ROOT)) for p in migrations))

for path in [
    "functions/api/_lib/seasonal-capability-public-claim-evidence-integrity-review.js",
    "functions/api/admin/service_economics_commercial_capacity_review.js",
    "assets/build473-service-economics-allocation-margin-review-readiness.js",
    "scripts/seasonal_capability_public_claim_evidence_integrity_review_test.mjs"
]:
    proc=subprocess.run(["node","--check",path],cwd=ROOT,text=True,capture_output=True)
    if proc.returncode:
        errors.append(f"{path} syntax failed: {proc.stderr.strip() or proc.stdout.strip()}")

if errors:
    print("BUILD 536 SEASONAL CAPABILITY & PUBLIC CLAIM EVIDENCE INTEGRITY REVIEW AUTHORITY: FAIL")
    for error in errors:
        print(" -",error)
    sys.exit(1)

for command in [
    ["node","scripts/seasonal_capability_public_claim_outcome_freshness_review_test.mjs"],
    ["node","scripts/seasonal_capability_public_claim_evidence_integrity_review_test.mjs"]
]:
    proc=subprocess.run(command,cwd=ROOT,text=True,capture_output=True)
    if proc.returncode:
        print("BUILD 536 SEASONAL CAPABILITY & PUBLIC CLAIM EVIDENCE INTEGRITY REVIEW AUTHORITY: FAIL")
        print(proc.stderr.strip() or proc.stdout.strip())
        sys.exit(proc.returncode)

print("BUILD 536 SEASONAL CAPABILITY & PUBLIC CLAIM EVIDENCE INTEGRITY REVIEW AUTHORITY: PASS")
print(" - Build 526 freshness remains the retained freshness authority")
print(" - owning-source and owner/manual-publication identity are explicit or fail closed to review/HOLD")
print(" - freshness windows and source-owned limits remain service-specific")
print(" - broad winter availability is never inferred")
print(" - Supabase/schema/storage/persistent-telemetry/provider/business/publication/HOLD mutation remains NONE")
