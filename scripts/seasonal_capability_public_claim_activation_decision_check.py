#!/usr/bin/env python3
"""Build 506 source authority for Seasonal Capability & Public Claim Activation Decision."""
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

helper=read("functions/api/_lib/seasonal-capability-public-claim-activation-decision.js")
endpoint=read("functions/api/admin/service_economics_commercial_capacity_review.js")
client=read("assets/build473-service-economics-allocation-margin-review-readiness.js")
page=read("admin-service-economics-commercial-capacity-review.html")
copy=read("admin-service-economics-commercial-capacity-review/index.html")
doc=read("BUILD506_SEASONAL_CAPABILITY_PUBLIC_CLAIM_ACTIVATION_DECISION.md")
roadmap=read("FORWARD_BUILD_ROADMAP_506_515.md")
queue=read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff=read("AI_PROJECT_HANDOFF.md")
readme=read("README.md")
blockers=read("STARTUP_GO_LIVE_BLOCKERS.md")
dev=read(".github/workflows/development-source-gate.yml")
prod=read(".github/workflows/production-business-acceptance-authority.yml")
prodcheck=read("scripts/production_business_acceptance_check.py")
workflow=read(".github/workflows/seasonal-capability-public-claim-activation-decision-authority.yml")

if page!=copy:
    errors.append("Build 506 protected route copies diverged")
if len(re.findall(r"<h1\b",page,re.I))!=1:
    errors.append("Build 506 page must retain exactly one H1")

require(helper,[
    "seasonal_public_claim_activation_build: 506",
    'seasonal_public_claim_activation_authority: "seasonal_capability_public_claim_activation_decision"',
    "approve_public_claim_activation","hold_public_claim_activation",
    "public_claim_activation_decision_ready","activation_owner_review_required","owner_hold",
    "manual_publication_required: true",
    "automatic_publication_authorized: false",
    "broad_winter_availability_authorized: false",
    "final_owner_decision_may_widen_source_owned_temperature_limit: false",
    "activation_decision_ready_is_publication: false"
],"Build 506 helper")

require(endpoint,[
    "buildSeasonalCapabilityPublicClaimActivationDecision",
    'authority:"seasonal_capability_public_claim_activation_decision"',
    'retained_owner_public_claim_authority:"seasonal_capability_owner_review_public_claim_decision"',
    'retained_site_qualification_authority:"controlled_environment_site_qualification_service_routing_evidence"'
],"Build 506 endpoint")

require(client,[
    "renderSeasonalPublicClaimActivationDecision",
    "seasonalPublicClaimActivationDecisionGrid",
    "Activation decision ready",
    "Actual publication remains manual"
],"Build 506 client")

require(page,[
    'data-build506="seasonal-capability-public-claim-activation-decision"',
    "Build 506 · Seasonal Capability &amp; Public Claim Activation Decision",
    'id="seasonalPublicClaimActivationDecisionGrid"',
    "Actual publication remains a separate manual action.",
    "Broad winter availability remains HOLD."
],"Build 506 page")

require(doc,[
    "# Build 506 — Seasonal Capability & Public Claim Activation Decision",
    "public_claim_activation_decision_ready",
    "Actual publication remains a separate manual action",
    "Build 507 — Winter Booking & Quote Rule Controlled Activation Decision"
],"Build 506 contract")

require(roadmap,[
    "### Build 506 — Seasonal Capability & Public Claim Activation Decision",
    "### Build 507 — Winter Booking & Quote Rule Controlled Activation Decision"
],"active roadmap")

require(queue,[
    "**Build 507 — Winter Booking & Quote Rule Controlled Activation Decision** is the active bounded release.",
    "**Build 508 — Controlled-Environment Operational Readiness & Routing Continuity** is next",
    "BUILD506_SEASONAL_CAPABILITY_PUBLIC_CLAIM_ACTIVATION_DECISION.md",
    "it has not run out"
],"Build 506 queue")

require(handoff,[
    "**Build 507 — Winter Booking & Quote Rule Controlled Activation Decision** is the active bounded release.",
    "BUILD506_SEASONAL_CAPABILITY_PUBLIC_CLAIM_ACTIVATION_DECISION.md",
    "seasonal_capability_public_claim_activation_decision_check.py"
],"Build 506 handoff")

require(readme,[
    "Current source direction: **Build 507 — Winter Booking & Quote Rule Controlled Activation Decision**.",
    "BUILD506_SEASONAL_CAPABILITY_PUBLIC_CLAIM_ACTIVATION_DECISION.md",
    "seasonal_capability_public_claim_activation_decision_check.py",
    "Production is not considered GREEN from source promotion alone."
],"Build 506 README")

require(blockers,[
    "Seasonal service capability & transparency",
    "Broad winter-availability claims remain held",
    "Build 506 adds a read-only seasonal capability/public-claim activation decision package"
],"canonical HOLD backlog")

for text,label in [(dev,"Development Source Gate"),(prod,"Production Business Acceptance")]:
    require(text,[
        "python -m py_compile scripts/seasonal_capability_public_claim_activation_decision_check.py",
        "node --check scripts/seasonal_capability_public_claim_activation_decision_test.mjs",
        "node --check functions/api/_lib/seasonal-capability-public-claim-activation-decision.js",
        "python scripts/seasonal_capability_public_claim_activation_decision_check.py",
        "node scripts/seasonal_capability_public_claim_activation_decision_test.mjs"
    ],label)

require(prodcheck,[
    '"seasonal_capability_public_claim_activation_decision"',
    "scripts/seasonal_capability_public_claim_activation_decision_check.py",
    "scripts/seasonal_capability_public_claim_activation_decision_test.mjs",
    "Validate seasonal capability & public claim activation decision authority"
],"central Production acceptance")

require(workflow,[
    "Seasonal Capability & Public Claim Activation Decision Authority",
    "python scripts/seasonal_capability_public_claim_activation_decision_check.py",
    "node scripts/seasonal_capability_public_claim_activation_decision_test.mjs",
    "Actual publication: MANUAL",
    "Broad winter availability: HOLD",
    "Automatic booking/quote/publication mutation: NONE"
],"Build 506 workflow")

migrations=[p for p in ROOT.rglob("*.sql") if re.search(r"(?:^|[^0-9])506(?:[^0-9]|$)",p.name)]
if migrations:
    errors.append("Build 506 must not introduce schema migration: "+", ".join(str(p.relative_to(ROOT)) for p in migrations))

if errors:
    print("BUILD 506 SEASONAL CAPABILITY & PUBLIC CLAIM ACTIVATION DECISION AUTHORITY: FAIL")
    for e in errors:
        print(" -",e)
    sys.exit(1)

for command in [
    [sys.executable,"scripts/controlled_environment_site_qualification_service_routing_evidence_check.py"],
    ["node","scripts/controlled_environment_site_qualification_service_routing_evidence_test.mjs"],
    [sys.executable,"scripts/seasonal_capability_owner_review_public_claim_decision_check.py"],
    ["node","scripts/seasonal_capability_owner_review_public_claim_decision_test.mjs"],
    ["node","scripts/seasonal_capability_public_claim_activation_decision_test.mjs"]
]:
    proc=subprocess.run(command,cwd=ROOT,text=True,capture_output=True)
    if proc.returncode:
        print("BUILD 506 SEASONAL CAPABILITY & PUBLIC CLAIM ACTIVATION DECISION AUTHORITY: FAIL")
        print(proc.stderr.strip() or proc.stdout.strip())
        sys.exit(proc.returncode)

print("BUILD 506 SEASONAL CAPABILITY & PUBLIC CLAIM ACTIVATION DECISION AUTHORITY: PASS")
print(" - final owner activation decisions remain service-specific and evidence-backed")
print(" - actual publication remains a separate manual action")
print(" - source-owned temperature limits cannot be widened by this release")
print(" - broad winter availability remains HOLD")
print(" - schema/provider/business/publication mutation remains NONE")
