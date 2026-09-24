#!/usr/bin/env python3
"""Build 484 source authority for Reliability, Cost & Recovery Evidence Continuity."""
from pathlib import Path
import re, subprocess, sys
ROOT=Path(__file__).resolve().parents[1]
errors=[]
def read(path):
    p=ROOT/path
    if not p.is_file():
        errors.append(f"missing required file: {path}"); return ""
    return p.read_text(encoding="utf-8",errors="ignore")
def require(text,needles,label):
    for needle in needles:
        if needle not in text: errors.append(f"{label} missing {needle!r}")

helper=read("functions/api/_lib/reliability-cost-recovery-evidence-continuity.js")
endpoint=read("functions/api/admin/reliability_security_cost_reassessment.js")
client=read("assets/build434-reliability-reassessment.js")
page=read("admin-reliability-reassessment.html")
copy=read("admin-reliability-reassessment/index.html")
doc=read("BUILD484_RELIABILITY_COST_RECOVERY_EVIDENCE_CONTINUITY.md")
queue=read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff=read("AI_PROJECT_HANDOFF.md")
readme=read("README.md")
source_gate=read(".github/workflows/development-source-gate.yml")
prod_gate=read(".github/workflows/production-business-acceptance-authority.yml")
workflow=read(".github/workflows/reliability-cost-recovery-evidence-continuity-authority.yml")
if page!=copy: errors.append("Build 484 reassessment route copies diverged")
if len(re.findall(r"<h1\b",page,re.I))!=1: errors.append("Build 484 page must retain exactly one H1")
require(helper,[
 "continuity_enrichment_build: 484",
 'continuity_authority: "reliability_cost_recovery_evidence_continuity"',
 "provider_owned_comparable_history_observed",
 "comparable_recovery_history_observed",
 "cold_snap_capable","temperature_limited_outdoor","controlled_environment_required",
 "first_party_traffic_proves_cloudflare_billing: false",
 "source_or_runtime_green_proves_recovery_outcome: false",
 "cold_weather_limitation_is_application_reliability_failure: false",
 "inferred_working_temperature_threshold_allowed: false",
 "production_restore_allowed: false"
],"Build 484 helper")
require(endpoint,[
 "buildReliabilityCostRecoveryEvidenceContinuity",
 '"X-Rosie-Reassessment": "build-464-read-only"',
 '"X-Rosie-Trend-Review": "build-474-read-only"',
 '"X-Rosie-Continuity": "build-484-read-only"'
],"Build 484 endpoint")
require(client,["renderContinuityReview","reassessmentContinuity","reassessmentFieldOperability","Technical availability is separate from field operability."],"Build 484 client")
require(page,[
 'data-build484="reliability-cost-recovery-evidence-continuity"',
 "Build 484 · evidence continuity",
 'id="reassessmentContinuity"','id="reassessmentFieldOperability"',
 "A cold-weather field limitation is not an application reliability failure."
],"Build 484 page")
require(doc,[
 "# Build 484 — Reliability, Cost & Recovery Evidence Continuity",
 "provider-owned comparable evidence",
 "Source/runtime GREEN is not recovery-outcome evidence.",
 "Southern Ontario",
 "Build 485 — Production Learning & Roadmap Renewal"
],"Build 484 contract")
require(queue,[
 "**Build 489 — Provider & Local Search Evidence Continuity** is the active bounded release.",
 "**Build 490 — Recovery & Authenticated Device Evidence Continuity** is next",
 "BUILD484_RELIABILITY_COST_RECOVERY_EVIDENCE_CONTINUITY.md",
 "it has not run out"
],"Build 484 queue")
require(handoff,[
 "**Build 489 — Provider & Local Search Evidence Continuity** is the active bounded release.",
 "BUILD484_RELIABILITY_COST_RECOVERY_EVIDENCE_CONTINUITY.md",
 "reliability_cost_recovery_evidence_continuity_check.py"
],"Build 484 handoff")
require(readme,[
 "Current source direction: **Build 489 — Provider & Local Search Evidence Continuity**.",
 "BUILD484_RELIABILITY_COST_RECOVERY_EVIDENCE_CONTINUITY.md",
 "reliability_cost_recovery_evidence_continuity_check.py",
 "Production is not considered GREEN from source promotion alone."
],"Build 484 README")
for text,label in [(source_gate,"Development Source Gate"),(prod_gate,"Production Business Acceptance")]:
    require(text,["python scripts/reliability_cost_recovery_evidence_continuity_check.py","node scripts/reliability_cost_recovery_evidence_continuity_test.mjs"],label)
require(workflow,[
 "Reliability Cost Recovery Evidence Continuity Authority",
 "python scripts/reliability_cost_recovery_evidence_continuity_check.py",
 "node scripts/reliability_cost_recovery_evidence_continuity_test.mjs"
],"Build 484 workflow")
migrations=[p for p in ROOT.rglob("*.sql") if re.search(r"(?:^|[^0-9])484(?:[^0-9]|$)",p.name)]
if migrations: errors.append("Build 484 must not introduce schema migration: "+", ".join(str(p.relative_to(ROOT)) for p in migrations))
if errors:
    print("BUILD 484 RELIABILITY COST RECOVERY EVIDENCE CONTINUITY AUTHORITY: FAIL")
    for e in errors: print(" -",e)
    sys.exit(1)
for command in [
 [sys.executable,"scripts/reliability_cost_resilience_trend_review_check.py"],
 ["node","scripts/reliability_cost_resilience_trend_review_test.mjs"],
 ["node","scripts/reliability_cost_recovery_evidence_continuity_test.mjs"]
]:
    proc=subprocess.run(command,cwd=ROOT,text=True,capture_output=True)
    if proc.returncode:
        print("BUILD 484 RELIABILITY COST RECOVERY EVIDENCE CONTINUITY AUTHORITY: FAIL")
        print(proc.stderr.strip() or proc.stdout.strip()); sys.exit(proc.returncode)
print("BUILD 484 RELIABILITY COST RECOVERY EVIDENCE CONTINUITY AUTHORITY: PASS")
