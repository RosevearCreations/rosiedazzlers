#!/usr/bin/env python3
"""Build 527 source authority for Winter Booking & Quote Rule Outcome Freshness Review."""
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
helper=read("functions/api/_lib/winter-booking-quote-rule-outcome-freshness-review.js")
doc=read("BUILD527_WINTER_BOOKING_QUOTE_RULE_OUTCOME_FRESHNESS_REVIEW.md")
workflow=read(".github/workflows/winter-booking-quote-rule-outcome-freshness-review-authority.yml")
require(helper,["winter_booking_quote_outcome_freshness_build: 527",'winter_booking_quote_outcome_freshness_authority: "winter_booking_quote_rule_outcome_freshness_review"','"controlled_activation_current","retain_hold_current"','"stale_outcome_review_required"','"applied_rule_drift_review_required"','"runtime_safety_revalidation_required"',"rule_state_may_be_inferred_from_source_or_runtime_green: false",'retained_availability_authority: "/api/availability"'],"Build 527 helper")
require(doc,["# Build 527 — Winter Booking & Quote Rule Outcome Freshness Review","controlled_activation_current","retain_hold_current","stale_outcome_review_required","applied_rule_drift_review_required","runtime_safety_revalidation_required","Build 528 — Controlled-Environment Routing Outcome Freshness & Capacity Review"],"Build 527 contract")
require(workflow,["Winter Booking & Quote Rule Outcome Freshness Review Authority","python scripts/winter_booking_quote_rule_outcome_freshness_review_check.py","node scripts/winter_booking_quote_rule_outcome_freshness_review_test.mjs","Weather-ineligible sessions: EXCLUDED FROM ORDINARY CONVERSION INTERPRETATION","Automatic booking/quote/checkout/HOLD mutation: NONE"],"Build 527 workflow")
for path in ["functions/api/_lib/winter-booking-quote-rule-outcome-freshness-review.js","scripts/winter_booking_quote_rule_outcome_freshness_review_test.mjs"]:
    proc=subprocess.run(["node","--check",path],cwd=ROOT,text=True,capture_output=True)
    if proc.returncode: errors.append(f"{path} syntax failed: {proc.stderr.strip() or proc.stdout.strip()}")
if errors:
    print("BUILD 527 WINTER BOOKING & QUOTE RULE OUTCOME FRESHNESS REVIEW AUTHORITY: FAIL")
    for error in errors: print(" -",error)
    sys.exit(1)
for command in [["node","scripts/winter_booking_quote_rule_controlled_activation_outcome_continuity_test.mjs"],["node","scripts/winter_booking_quote_rule_outcome_freshness_review_test.mjs"]]:
    proc=subprocess.run(command,cwd=ROOT,text=True,capture_output=True)
    if proc.returncode:
        print("BUILD 527 WINTER BOOKING & QUOTE RULE OUTCOME FRESHNESS REVIEW AUTHORITY: FAIL")
        print(proc.stderr.strip() or proc.stdout.strip()); sys.exit(proc.returncode)
print("BUILD 527 WINTER BOOKING & QUOTE RULE OUTCOME FRESHNESS REVIEW AUTHORITY: PASS")
