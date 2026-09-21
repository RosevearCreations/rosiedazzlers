from pathlib import Path
import subprocess
import sys

ROOT=Path(__file__).resolve().parents[1]
errors=[]

required={
    "BUILD461_BOOKING_QUOTE_EXPERIMENT_READINESS.md":[
        "ready for owner review",
        "No customer/session identity join",
        "Build 462 — Staff & Mobile Friction Remediation Priorities",
    ],
    "functions/api/_lib/booking-funnel-quote-pricing-learning.js":[
        "release_enrichment_build:461",
        'authority:"booking_quote_experiment_readiness"',
        "automatic_experiment_activation_allowed:false",
        "automatic_winner_selection_allowed:false",
        "booking_stage_clarity",
        "quote_band_clarity",
        "accepted_work_scope_clarity",
    ],
    "assets/build451-booking-funnel-quote-pricing-learning.js":[
        "experimentReadiness461",
        "Automatic activation: NO",
        "Business mutation: NO",
    ],
    "admin-booking-quote-retention-learning.html":[
        'data-build461="booking-quote-experiment-readiness"',
        "Build 461 · Booking &amp; Quote Experiment Readiness",
        "owner-review hypotheses &amp; measurement plans",
    ],
    "admin-booking-quote-retention-learning/index.html":[
        'data-build461="booking-quote-experiment-readiness"',
        "Build 461 · Booking &amp; Quote Experiment Readiness",
    ],
    "AUTONOMOUS_RELEASE_QUEUE.md":[
        "BUILD461_BOOKING_QUOTE_EXPERIMENT_READINESS.md",
    ],
}

for rel,needles in required.items():
    path=ROOT/rel
    if not path.exists():
        errors.append(f"missing {rel}")
        continue
    text=path.read_text(encoding="utf-8")
    for needle in needles:
        if needle not in text:
            errors.append(f"{rel}: missing {needle!r}")

for rel in [
    "functions/api/_lib/booking-funnel-quote-pricing-learning.js",
    "functions/api/admin/booking_funnel_quote_pricing_learning.js",
    "assets/build451-booking-funnel-quote-pricing-learning.js",
    "scripts/booking_quote_experiment_readiness_test.mjs",
]:
    result=subprocess.run(["node","--check",rel],cwd=ROOT,text=True,capture_output=True)
    if result.returncode:
        errors.append(f"node --check {rel}: {result.stderr.strip() or result.stdout.strip()}")

result=subprocess.run(["node","scripts/booking_quote_experiment_readiness_test.mjs"],cwd=ROOT,text=True,capture_output=True)
if result.returncode:
    errors.append(f"Build 461 behavioral test failed: {result.stderr.strip() or result.stdout.strip()}")

if errors:
    print("BUILD 461 BOOKING & QUOTE EXPERIMENT READINESS AUTHORITY: FAIL")
    for error in errors:
        print(" -",error)
    sys.exit(1)

print("BUILD 461 BOOKING & QUOTE EXPERIMENT READINESS AUTHORITY: PASS")
print(" - retained Build 451 workbench enriched; no parallel analytics authority")
print(" - booking-stage, quote-band and accepted-work/value signals become owner-review plans only")
print(" - no automatic pricing/discount/booking-rule/outreach/experiment/provider/schema mutation or polling")
