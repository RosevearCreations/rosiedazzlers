#!/usr/bin/env python3
"""Build 542 read-only Booking & Quote Follow-Up Evidence Integrity source authority."""
from pathlib import Path
import re, subprocess, sys
ROOT=Path(__file__).resolve().parents[1]
errors=[]
def read(path):
    p=ROOT/path
    if not p.is_file(): errors.append("missing required "+path);return ""
    return p.read_text(encoding="utf-8",errors="replace")
def require(body,phrases,label):
    for phrase in phrases:
        if phrase not in body: errors.append(label+" missing "+repr(phrase))
helper=read("functions/api/_lib/booking-quote-follow-up-evidence-integrity-review.js")
endpoint=read("functions/api/admin/booking_quote_experiment_follow_up_decision.js")
doc=read("BUILD542_BOOKING_QUOTE_FOLLOW_UP_EVIDENCE_INTEGRITY_REVIEW.md")
workflow=read(".github/workflows/booking-quote-follow-up-evidence-integrity-review-authority.yml")
queue=read("AUTONOMOUS_RELEASE_QUEUE.md"); handoff=read("AI_PROJECT_HANDOFF.md")
readme=read("README.md"); blockers=read("STARTUP_GO_LIVE_BLOCKERS.md")
docindex=read("DOC_INDEX.md")
prodcheck=read("scripts/production_business_acceptance_check.py")
dev=read(".github/workflows/development-source-gate.yml")
prod=read(".github/workflows/production-business-acceptance-authority.yml")
require(helper,["booking_quote_follow_up_integrity_build: 542",'booking_quote_follow_up_integrity_authority: "booking_quote_follow_up_evidence_integrity_review"','"booking_quote_follow_up_integrity_current"','"follow_up_row_set_identity_review_required"','"measurement_allocation_duration_identity_review_required"','"owner_follow_up_identity_review_required"','"follow_up_authorization_observation_identity_review_required"','"weather_or_stop_condition_review_required"',"retained_build532_freshness_must_remain_current: true","exact_build522_follow_up_decision_trace_required: true","southern_ontario_weather_eligibility_and_exclusion_required: true","source_runtime_green_proves_follow_up_outcome: false","winner_selected: false","success_declared: false","booking_rule_changed: false","availability_rule_changed: false","outreach_sent: false","canonical_hold_mutated: false","schema_or_storage_mutated: false","permanent_polling: false"],"helper")
require(endpoint,["buildBookingQuoteFollowUpEvidenceIntegrityReview","booking_quote_follow_up_integrity_build:542",'booking_quote_follow_up_integrity_authority:"booking_quote_follow_up_evidence_integrity_review"',"booking_quote_follow_up_evidence_integrity_review:integrity",'"X-Rosie-Booking-Quote-Follow-Up-Integrity":"build-542-read-only"',"GET,HEAD,OPTIONS"],"endpoint")
for forbidden in ["onRequestPost","onRequestPut","onRequestPatch","onRequestDelete","setInterval("]:
    if forbidden in endpoint: errors.append("GET-only endpoint contains forbidden "+forbidden)
require(doc,["# Build 542 — Booking & Quote Follow-Up Evidence Integrity Review","Build 532","Build 522","Build 512","Build 481","Southern Ontario","weather-ineligible sessions","canonical HOLD","Build 543 — Staff & Mobile Closure Evidence Integrity Review"],"contract")
require(queue,["**Build 542 — Booking & Quote Follow-Up Evidence Integrity Review** is the active bounded release.","**Build 543 — Staff & Mobile Closure Evidence Integrity Review** is next","BUILD542_BOOKING_QUOTE_FOLLOW_UP_EVIDENCE_INTEGRITY_REVIEW.md"],"queue")
require(handoff,["**Build 542 — Booking & Quote Follow-Up Evidence Integrity Review** is the active bounded release.","**Build 543 — Staff & Mobile Closure Evidence Integrity Review** is next","booking_quote_follow_up_evidence_integrity_review_check.py","BUILD542_BOOKING_QUOTE_FOLLOW_UP_EVIDENCE_INTEGRITY_REVIEW.md"],"handoff")
require(readme,["Current source direction: **Build 542 — Booking & Quote Follow-Up Evidence Integrity Review**.","BUILD542_BOOKING_QUOTE_FOLLOW_UP_EVIDENCE_INTEGRITY_REVIEW.md","booking_quote_follow_up_evidence_integrity_review_check.py","Production is not considered GREEN from source promotion alone."],"README")
require(blockers,["Build 542 adds read-only booking/quote follow-up evidence integrity review","weather-ineligible","no automatic canonical-HOLD mutation"],"HOLD")
require(docindex,["BUILD542_BOOKING_QUOTE_FOLLOW_UP_EVIDENCE_INTEGRITY_REVIEW.md","current bounded release contract"],"index")
for yml,label in [(dev,"development"),(prod,"production")]:
    require(yml,["python -m py_compile scripts/booking_quote_follow_up_evidence_integrity_review_check.py","node --check scripts/booking_quote_follow_up_evidence_integrity_review_test.mjs","node --check functions/api/_lib/booking-quote-follow-up-evidence-integrity-review.js","python scripts/booking_quote_follow_up_evidence_integrity_review_check.py","node scripts/booking_quote_follow_up_evidence_integrity_review_test.mjs"],label)
require(prodcheck,['"booking_quote_follow_up_evidence_integrity_review"',"scripts/booking_quote_follow_up_evidence_integrity_review_check.py","scripts/booking_quote_follow_up_evidence_integrity_review_test.mjs"],"central production")
require(workflow,["Booking & Quote Follow-Up Evidence Integrity Review Authority","booking-quote-follow-up-evidence-integrity-review","python scripts/booking_quote_follow_up_evidence_integrity_review_check.py","node scripts/booking_quote_follow_up_evidence_integrity_review_test.mjs","Weather-ineligible sessions: EXCLUDED","Pricing / outreach / booking / canonical HOLD mutation: NONE"],"workflow")
if any(re.search(r"(?:^|[^0-9])542(?:[^0-9]|$)",p.name) for p in ROOT.rglob("*.sql")): errors.append("Build 542 SQL migration prohibited")
for p in ["functions/api/_lib/booking-quote-follow-up-evidence-integrity-review.js","functions/api/admin/booking_quote_experiment_follow_up_decision.js","scripts/booking_quote_follow_up_evidence_integrity_review_test.mjs"]:
    v=subprocess.run(["node","--check",p],cwd=ROOT,text=True,capture_output=True)
    if v.returncode: errors.append("syntax "+p+": "+v.stderr.strip())
if errors:
    print("BUILD 542 BOOKING & QUOTE FOLLOW-UP EVIDENCE INTEGRITY AUTHORITY: FAIL")
    for e in errors:print(" -",e)
    sys.exit(1)
for p in ["scripts/booking_quote_follow_up_evidence_freshness_review_test.mjs","scripts/booking_quote_experiment_follow_up_outcome_continuity_test.mjs","scripts/booking_quote_experiment_follow_up_decision_test.mjs","scripts/booking_quote_experiment_outcome_interpretation_test.mjs","scripts/booking_quote_controlled_experiment_execution_evidence_test.mjs","scripts/booking_quote_experiment_approval_measurement_lock_test.mjs","scripts/booking_quote_follow_up_evidence_integrity_review_test.mjs"]:
    v=subprocess.run(["node",p],cwd=ROOT,text=True,capture_output=True)
    if v.returncode:
        print("BUILD 542 BOOKING & QUOTE FOLLOW-UP EVIDENCE INTEGRITY AUTHORITY: FAIL")
        print(v.stderr.strip() or v.stdout.strip())
        sys.exit(v.returncode)
print("BUILD 542 BOOKING & QUOTE FOLLOW-UP EVIDENCE INTEGRITY AUTHORITY: PASS")
print(" - exact retained measurement, decision trace, owner outcome and timestamp or REVIEW/HOLD")
print(" - weather eligibility and triggered stop conditions remain fail-closed")
print(" - winner/pricing/outreach/booking/HOLD/schema/storage mutation: NONE")
