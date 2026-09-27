#!/usr/bin/env python3
"""Build 516 source authority for Seasonal Capability & Public Claim Decision Outcome Continuity."""
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

helper=read("functions/api/_lib/seasonal-capability-public-claim-decision-outcome-continuity.js")
endpoint=read("functions/api/admin/service_economics_commercial_capacity_review.js")
client=read("assets/build473-service-economics-allocation-margin-review-readiness.js")
page=read("admin-service-economics-commercial-capacity-review.html")
copy=read("admin-service-economics-commercial-capacity-review/index.html")
doc=read("BUILD516_SEASONAL_CAPABILITY_PUBLIC_CLAIM_DECISION_OUTCOME_CONTINUITY.md")
roadmap=read("FORWARD_BUILD_ROADMAP_516_525.md")
queue=read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff=read("AI_PROJECT_HANDOFF.md")
readme=read("README.md")
blockers=read("STARTUP_GO_LIVE_BLOCKERS.md")
dev=read(".github/workflows/development-source-gate.yml")
prod=read(".github/workflows/production-business-acceptance-authority.yml")
prodcheck=read("scripts/production_business_acceptance_check.py")
workflow=read(".github/workflows/seasonal-capability-public-claim-decision-outcome-continuity-authority.yml")

if page!=copy:
    errors.append("Build 516 protected route copies diverged")
if len(re.findall(r"<h1\b",page,re.I))!=1:
    errors.append("Build 516 page must retain exactly one H1")

require(helper,[
    "seasonal_public_claim_outcome_build: 516",
    'seasonal_public_claim_outcome_authority: "seasonal_capability_public_claim_decision_outcome_continuity"',
    '"published","retain_hold","no_action"',
    '"publication_observed"',"retain_hold_observed","no_action_observed",
    '"publication_evidence_conflict"',"outcome_owner_action_required",
    "publication_state_observed_not_inferred: true",
    "automatic_publication_authorized: false",
    "broad_winter_availability_authorized: false",
    "source_owned_temperature_limit_may_be_widened: false"
],"Build 516 helper")

require(endpoint,[
    "buildSeasonalCapabilityPublicClaimDecisionOutcomeContinuity",
    'authority:"seasonal_capability_public_claim_decision_outcome_continuity"',
    'retained_public_claim_activation_authority:"seasonal_capability_public_claim_activation_decision"',
    'retained_operational_readiness_authority:"controlled_environment_operational_readiness_routing_continuity"'
],"Build 516 endpoint")

require(client,[
    "renderSeasonalPublicClaimOutcomeContinuity",
    "seasonalPublicClaimOutcomeContinuityGrid",
    "Publication observed",
    "Publication state is observed, never inferred"
],"Build 516 client")

require(page,[
    'data-build516="seasonal-capability-public-claim-decision-outcome-continuity"',
    "Build 517 · Winter Booking &amp; Quote Rule Controlled-Activation Outcome Continuity",
    "Seasonal capability &amp; public claim decision outcome continuity",
    'id="seasonalPublicClaimOutcomeContinuityGrid"',
    "Publication state is observed, never inferred.",
    "Broad winter availability remains HOLD."
],"Build 516 page")

require(doc,[
    "# Build 516 — Seasonal Capability & Public Claim Decision Outcome Continuity",
    "publication_observed","retain_hold_observed","no_action_observed",
    "Decision readiness never means publication",
    "Build 517 — Winter Booking & Quote Rule Controlled-Activation Outcome Continuity"
],"Build 516 contract")

require(roadmap,[
    "### Build 516 — Seasonal Capability & Public Claim Decision Outcome Continuity",
    "### Build 517 — Winter Booking & Quote Rule Controlled-Activation Outcome Continuity",
    "Publication state must be observed rather than inferred"
],"active roadmap")

require(queue,[
    "**Build 517 — Winter Booking & Quote Rule Controlled-Activation Outcome Continuity** is the active bounded release.",
    "**Build 518 — Controlled-Environment Routing Outcome Evidence Continuity** is next",
    "BUILD516_SEASONAL_CAPABILITY_PUBLIC_CLAIM_DECISION_OUTCOME_CONTINUITY.md",
    "it has not run out"
],"Build 516 queue")

require(handoff,[
    "**Build 517 — Winter Booking & Quote Rule Controlled-Activation Outcome Continuity** is the active bounded release.",
    "BUILD516_SEASONAL_CAPABILITY_PUBLIC_CLAIM_DECISION_OUTCOME_CONTINUITY.md",
    "seasonal_capability_public_claim_decision_outcome_continuity_check.py"
],"Build 516 handoff")

require(readme,[
    "Current source direction: **Build 517 — Winter Booking & Quote Rule Controlled-Activation Outcome Continuity**.",
    "BUILD516_SEASONAL_CAPABILITY_PUBLIC_CLAIM_DECISION_OUTCOME_CONTINUITY.md",
    "scripts/seasonal_capability_public_claim_decision_outcome_continuity_check.py",
    "Production is not considered GREEN from source promotion alone."
],"Build 516 README")

require(blockers,[
    "Seasonal service capability & transparency",
    "Build 516 adds read-only seasonal public-claim outcome continuity",
    "publication is observed rather than inferred"
],"canonical HOLD backlog")

for text,label in [(dev,"Development Source Gate"),(prod,"Production Business Acceptance")]:
    require(text,[
        "python -m py_compile scripts/seasonal_capability_public_claim_decision_outcome_continuity_check.py",
        "node --check scripts/seasonal_capability_public_claim_decision_outcome_continuity_test.mjs",
        "node --check functions/api/_lib/seasonal-capability-public-claim-decision-outcome-continuity.js",
        "python scripts/seasonal_capability_public_claim_decision_outcome_continuity_check.py",
        "node scripts/seasonal_capability_public_claim_decision_outcome_continuity_test.mjs"
    ],label)

require(prodcheck,[
    '"seasonal_capability_public_claim_decision_outcome_continuity"',
    "scripts/seasonal_capability_public_claim_decision_outcome_continuity_check.py",
    "scripts/seasonal_capability_public_claim_decision_outcome_continuity_test.mjs"
],"central Production acceptance")

require(workflow,[
    "Seasonal Capability & Public Claim Decision Outcome Continuity Authority",
    "python scripts/seasonal_capability_public_claim_decision_outcome_continuity_check.py",
    "node scripts/seasonal_capability_public_claim_decision_outcome_continuity_test.mjs",
    "Publication state: OBSERVED, NEVER INFERRED",
    "Broad winter availability: HOLD",
    "Automatic booking/quote/publication/HOLD mutation: NONE"
],"Build 516 workflow")

migrations=[p for p in ROOT.rglob("*.sql") if re.search(r"(?:^|[^0-9])516(?:[^0-9]|$)",p.name)]
if migrations:
    errors.append("Build 516 must not introduce schema migration: "+", ".join(str(p.relative_to(ROOT)) for p in migrations))

if errors:
    print("BUILD 516 SEASONAL CAPABILITY & PUBLIC CLAIM DECISION OUTCOME CONTINUITY AUTHORITY: FAIL")
    for e in errors:
        print(" -",e)
    sys.exit(1)

for command in [
    ["node","scripts/seasonal_capability_public_claim_activation_decision_test.mjs"],
    ["node","scripts/controlled_environment_operational_readiness_routing_continuity_test.mjs"],
    ["node","scripts/seasonal_capability_public_claim_decision_outcome_continuity_test.mjs"]
]:
    proc=subprocess.run(command,cwd=ROOT,text=True,capture_output=True)
    if proc.returncode:
        print("BUILD 516 SEASONAL CAPABILITY & PUBLIC CLAIM DECISION OUTCOME CONTINUITY AUTHORITY: FAIL")
        print(proc.stderr.strip() or proc.stdout.strip())
        sys.exit(proc.returncode)

print("BUILD 516 SEASONAL CAPABILITY & PUBLIC CLAIM DECISION OUTCOME CONTINUITY AUTHORITY: PASS")
print(" - publication is counted only from dated attributable manual-publication evidence")
print(" - explicit retain-HOLD and no-action outcomes remain service-specific and attributable")
print(" - missing publication evidence never becomes inferred no-action or publication")
print(" - source-owned temperature limits and broad-winter HOLD truth are preserved")
print(" - schema/provider/business/booking/quote/publication/HOLD mutation remains NONE")
