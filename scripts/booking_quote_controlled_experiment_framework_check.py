#!/usr/bin/env python3
"""Build 471 Booking & Quote Controlled Experiment Framework source authority.
Retained Build 471 validation follows durable contract markers rather than living current/next labels.
"""
from pathlib import Path
import re,subprocess,sys

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

helper=read("functions/api/_lib/booking-funnel-quote-pricing-learning.js")
endpoint=read("functions/api/admin/booking_funnel_quote_pricing_learning.js")
client=read("assets/build451-booking-funnel-quote-pricing-learning.js")
page=read("admin-booking-quote-retention-learning.html")
copy=read("admin-booking-quote-retention-learning/index.html")
contract=read("BUILD471_BOOKING_QUOTE_CONTROLLED_EXPERIMENT_FRAMEWORK.md")
workflow=read(".github/workflows/booking-quote-controlled-experiment-framework-authority.yml")
queue=read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff=read("AI_PROJECT_HANDOFF.md")
readme=read("README.md")
dev=read(".github/workflows/development-source-gate.yml")
prod=read(".github/workflows/production-business-acceptance-authority.yml")
retained461=read("scripts/booking_quote_experiment_readiness_check.py")

require(helper,[
 "buildBookingQuoteControlledExperimentFramework",
 "controlled_experiment_framework_build:471",
 'controlled_experiment_framework_authority:"booking_quote_controlled_experiment_framework"',
 'authority:"booking_quote_controlled_experiment_framework"',
 'status:"not_recorded"',
 "success_threshold:null",
 "target_direction:null",
 "winner_rule:null",
 "duration_days:null",
 "allocation_rule:null",
 'results:{status:"not_started",winner:null,success:null}',
 '"owner_withdraws_approval"',
 '"price_discount_booking_rule_or_outreach_change_required"',
 "automatic_experiment_activation_allowed:false",
 "automatic_winner_selection_allowed:false",
 "pricing_mutation_allowed:false",
 "discount_mutation_allowed:false",
 "booking_rule_mutation_allowed:false",
 "outreach_allowed:false"
],"Build 471 helper")

require(endpoint,[
 "Build 451/461/471",
 "GET-only",
 "onRequestPost(){return readOnly()}",
 "onRequestPatch(){return readOnly()}",
 "onRequestDelete(){return readOnly()}"
],"Build 471 endpoint")
require(client,[
 "controlledExperiments471",
 "Build 471 controlled experiment framework",
 "Owner approval",
 "Success threshold",
 "Stop conditions",
 "Automatic activation: NO"
],"Build 471 client")
for token in ['method:"PATCH"','method: "PATCH"','method:"DELETE"','method: "DELETE"',"localStorage","sessionStorage","setInterval("]:
 if token in client: errors.append(f"Build 471 client contains forbidden mutation/persistence token {token!r}")
if ('method:"POST"' in client or 'method: "POST"' in client) and "/api/admin/booking_quote_experiment_approval_lock_save" not in client:
 errors.append("Build 471 client contains an unrecognized POST mutation path")
require(client,["/api/admin/booking_quote_experiment_approval_lock_save"],"retained Build 471 client explicit Build 481 governance extension")

require(page,[
 'data-build471="booking-quote-controlled-experiment-framework"',
 "Build 471 · Booking &amp; Quote Controlled Experiment Framework",
 'id="controlledExperiments471"',
 "Eligibility, success measures, stop conditions and owner approval"
],"Build 471 page")
if page!=copy: errors.append("booking/quote learning route copies must remain byte-identical")
if len(re.findall(r"<h1\b",page,re.I))!=1: errors.append("booking/quote learning workbench must retain exactly one H1")

require(contract,[
 "# Build 471 — Booking & Quote Controlled Experiment Framework",
 "owner_approval_required",
 "success-threshold placeholders",
 "Stop conditions",
 "Build 472 — Staff & Mobile Remediation Verification"
],"Build 471 contract")
require(queue,["BUILD471_BOOKING_QUOTE_CONTROLLED_EXPERIMENT_FRAMEWORK.md","BUILD472_STAFF_MOBILE_REMEDIATION_VERIFICATION.md"],"release queue retained Build 471 authority")
require(handoff,["BUILD471_BOOKING_QUOTE_CONTROLLED_EXPERIMENT_FRAMEWORK.md","booking_quote_controlled_experiment_framework_check.py"],"project handoff")
require(readme,["BUILD471_BOOKING_QUOTE_CONTROLLED_EXPERIMENT_FRAMEWORK.md","booking_quote_controlled_experiment_framework_check.py"],"README")
require(retained461,["BUILD461_BOOKING_QUOTE_EXPERIMENT_READINESS.md","booking_quote_experiment_readiness_test.mjs"],"retained Build 461 authority")

for gate,label in ((dev,"Development source gate"),(prod,"Production business acceptance")):
 require(gate,[
  "python -m py_compile scripts/booking_quote_controlled_experiment_framework_check.py",
  "node --check scripts/booking_quote_controlled_experiment_framework_test.mjs",
  "python scripts/booking_quote_controlled_experiment_framework_check.py",
  "node scripts/booking_quote_controlled_experiment_framework_test.mjs"
 ],label)

commands=[
 ["node","--check","functions/api/_lib/booking-funnel-quote-pricing-learning.js"],
 ["node","--check","functions/api/admin/booking_funnel_quote_pricing_learning.js"],
 ["node","--check","assets/build451-booking-funnel-quote-pricing-learning.js"],
 ["node","--check","scripts/booking_quote_controlled_experiment_framework_test.mjs"],
 ["node","scripts/booking_quote_controlled_experiment_framework_test.mjs"],
 ["python","scripts/booking_quote_experiment_readiness_check.py"],
 ["node","scripts/booking_quote_experiment_readiness_test.mjs"],
 ["python","scripts/booking_funnel_quote_pricing_learning_check.py"],
 ["node","scripts/booking_funnel_quote_pricing_learning_test.mjs"],
 ["python","scripts/booking_quote_retention_production_learning_check.py"],
 ["node","scripts/booking_quote_retention_production_learning_test.mjs"]
]
for command in commands:
 result=subprocess.run(command,cwd=ROOT,text=True,capture_output=True)
 if result.returncode:
  errors.append("command failed: "+" ".join(command)+"\n"+result.stdout+result.stderr)

if errors:
 print("BUILD 471 BOOKING & QUOTE CONTROLLED EXPERIMENT FRAMEWORK AUTHORITY: FAIL")
 for error in errors: print(" -",error)
 sys.exit(1)

print("BUILD 471 BOOKING & QUOTE CONTROLLED EXPERIMENT FRAMEWORK AUTHORITY: PASS")
print(" - retained Build 441/451/461 workbench reused; no parallel experiment authority")
print(" - eligibility, success measures, stop conditions and owner approval are explicit")
print(" - approval, duration, allocation, target threshold, winner and results remain fail-closed")
print(" - no automatic price/discount/booking-rule/outreach/experiment/provider/schema mutation or polling")
