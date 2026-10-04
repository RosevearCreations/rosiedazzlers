#!/usr/bin/env python3
"""Build 534 Service Economics, Seasonal Capacity & Reliability Evidence Freshness Review authority."""
from pathlib import Path
import subprocess, sys

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

helper=read("functions/api/_lib/service-economics-seasonal-capacity-reliability-evidence-freshness-review.js")
endpoint=read("functions/api/admin/service_economics_seasonal_capacity_reliability_decision_readiness.js")
doc=read("BUILD534_SERVICE_ECONOMICS_SEASONAL_CAPACITY_RELIABILITY_EVIDENCE_FRESHNESS_REVIEW.md")
roadmap=read("FORWARD_BUILD_ROADMAP_526_535.md")
queue=read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff=read("AI_PROJECT_HANDOFF.md")
readme=read("README.md")
blockers=read("STARTUP_GO_LIVE_BLOCKERS.md")
docindex=read("DOC_INDEX.md")
dev=read(".github/workflows/development-source-gate.yml")
prod=read(".github/workflows/production-business-acceptance-authority.yml")
prodcheck=read("scripts/production_business_acceptance_check.py")
workflow=read(".github/workflows/service-economics-seasonal-capacity-reliability-evidence-freshness-review-authority.yml")

require(helper,[
 "service_economics_seasonal_capacity_reliability_freshness_build:534",
 'service_economics_seasonal_capacity_reliability_freshness_authority:"service_economics_seasonal_capacity_reliability_evidence_freshness_review"',
 '"retained_decision_outcome_review_required"',
 '"decision_readiness_trace_drift_review_required"',
 '"insufficient_comparable_history_review_required"',
 '"retained_same_domain_evidence_freshness_review_required"',
 '"owner_decision_outcome_freshness_review_required"',
 '"retain_current_controls_evidence_current"',
 '"retain_hold_evidence_current"',
 '"bounded_manual_follow_up_evidence_current"',
 "missing_comparable_history_remains_insufficient:true",
 "source_owned_temperature_thresholds_only:true",
 "provider_billing_cpu_or_quota_inferred:false",
 "future_capacity_inferred:false",
 "price_sensitivity_inferred:false",
 "cross_domain_substitution_allowed:false",
 "schema_or_storage_mutation_performed:false",
 "permanent_polling:false",
],"Build 534 helper")

require(endpoint,[
 "Build 514/524/534",
 "buildServiceEconomicsSeasonalCapacityReliabilityEvidenceFreshnessReview",
 "service_economics_seasonal_capacity_reliability_freshness_build:534",
 'service_economics_seasonal_capacity_reliability_freshness_authority:"service_economics_seasonal_capacity_reliability_evidence_freshness_review"',
 "service_economics_seasonal_capacity_reliability_evidence_freshness_review:freshnessReview",
 '"X-Rosie-Service-Economics-Evidence-Freshness":"build-534-read-only"',
],"Build 534 endpoint")

require(doc,[
 "# Build 534 — Service Economics, Seasonal Capacity & Reliability Evidence Freshness Review",
 "Missing comparable history remains insufficient",
 "Southern Ontario",
 "does not establish Cloudflare/provider billing, CPU, quota",
 "does not forecast future capacity",
 "does not establish price sensitivity",
 "adds no Supabase table",
 "Build 535 — Production Learning & Roadmap Renewal",
],"Build 534 contract")
require(roadmap,["Build 534 — Service Economics, Seasonal Capacity & Reliability Evidence Freshness Review","Build 535 — Production Learning & Roadmap Renewal"],"forward roadmap")
require(queue,["**Build 534 — Service Economics, Seasonal Capacity & Reliability Evidence Freshness Review** is the active bounded release.","BUILD534_SERVICE_ECONOMICS_SEASONAL_CAPACITY_RELIABILITY_EVIDENCE_FRESHNESS_REVIEW.md","scripts/service_economics_seasonal_capacity_reliability_evidence_freshness_review_check.py","**Build 535 — Production Learning & Roadmap Renewal** is next"],"release queue")
require(handoff,["**Build 534 — Service Economics, Seasonal Capacity & Reliability Evidence Freshness Review** is the active bounded release.","BUILD534_SERVICE_ECONOMICS_SEASONAL_CAPACITY_RELIABILITY_EVIDENCE_FRESHNESS_REVIEW.md","scripts/service_economics_seasonal_capacity_reliability_evidence_freshness_review_check.py","**Build 535 — Production Learning & Roadmap Renewal** is next"],"project handoff")
require(readme,["Current source direction: **Build 534 — Service Economics, Seasonal Capacity & Reliability Evidence Freshness Review**.","BUILD534_SERVICE_ECONOMICS_SEASONAL_CAPACITY_RELIABILITY_EVIDENCE_FRESHNESS_REVIEW.md","scripts/service_economics_seasonal_capacity_reliability_evidence_freshness_review_check.py"],"README")
require(docindex,["BUILD534_SERVICE_ECONOMICS_SEASONAL_CAPACITY_RELIABILITY_EVIDENCE_FRESHNESS_REVIEW.md","current bounded release contract"],"documentation index")
require(blockers,["Build 534 adds read-only service-economics, seasonal-capacity and reliability evidence freshness review","Missing comparable history remains insufficient"],"canonical HOLD backlog")

for text,label in [(dev,"Development Source Gate"),(prod,"Production Business Acceptance")]:
    require(text,[
      "service_economics_seasonal_capacity_reliability_evidence_freshness_review_check.py",
      "service_economics_seasonal_capacity_reliability_evidence_freshness_review_test.mjs",
      "service-economics-seasonal-capacity-reliability-evidence-freshness-review.js",
    ],label)
require(prodcheck,["service_economics_seasonal_capacity_reliability_evidence_freshness_review","scripts/service_economics_seasonal_capacity_reliability_evidence_freshness_review_check.py","scripts/service_economics_seasonal_capacity_reliability_evidence_freshness_review_test.mjs"],"Production source contract")
require(workflow,["Validate Build 534 freshness authority","python scripts/service_economics_seasonal_capacity_reliability_evidence_freshness_review_check.py","node scripts/service_economics_seasonal_capacity_reliability_evidence_freshness_review_test.mjs"],"Build 534 workflow")

commands=[
 ["node","--check","functions/api/_lib/service-economics-seasonal-capacity-reliability-evidence-freshness-review.js"],
 ["node","--check","functions/api/admin/service_economics_seasonal_capacity_reliability_decision_readiness.js"],
 ["node","--check","scripts/service_economics_seasonal_capacity_reliability_evidence_freshness_review_test.mjs"],
 ["node","scripts/service_economics_seasonal_capacity_reliability_evidence_freshness_review_test.mjs"],
 ["python","scripts/service_economics_seasonal_capacity_reliability_decision_outcome_continuity_check.py"],
 ["node","scripts/service_economics_seasonal_capacity_reliability_decision_outcome_continuity_test.mjs"],
]
for command in commands:
    result=subprocess.run(command,cwd=ROOT,text=True,capture_output=True)
    if result.returncode:
        errors.append(f"command failed: {' '.join(command)}\n{result.stdout}{result.stderr}")

if errors:
    print("BUILD 534 SERVICE ECONOMICS, SEASONAL CAPACITY & RELIABILITY EVIDENCE FRESHNESS REVIEW: FAIL")
    for error in errors: print(f"- {error}")
    sys.exit(1)

print("BUILD 534 SERVICE ECONOMICS, SEASONAL CAPACITY & RELIABILITY EVIDENCE FRESHNESS REVIEW: PASS")
print("- four evidence domains remain independent and current same-domain evidence is required")
print("- missing comparable history, stale evidence and readiness drift fail closed to review")
print("- Southern Ontario temperature thresholds remain source-owned")
print("- provider billing/CPU/quota, recovery success, future capacity and price sensitivity are not inferred")
print("- no Supabase/schema/storage, automatic business/provider/HOLD mutation or permanent polling is added")
