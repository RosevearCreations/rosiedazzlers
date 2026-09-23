#!/usr/bin/env python3
"""Build 481 Booking & Quote Experiment Approval & Measurement Lock authority.
Retained validation is release-state independent: living current/next labels may advance.
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
save=read("functions/api/admin/booking_quote_experiment_approval_lock_save.js")
client=read("assets/build451-booking-funnel-quote-pricing-learning.js")
page=read("admin-booking-quote-retention-learning.html")
copy=read("admin-booking-quote-retention-learning/index.html")
contract=read("BUILD481_BOOKING_QUOTE_EXPERIMENT_APPROVAL_MEASUREMENT_LOCK.md")
queue=read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff=read("AI_PROJECT_HANDOFF.md")
readme=read("README.md")
roadmap=read("FORWARD_BUILD_ROADMAP_476_485.md")
blockers=read("STARTUP_GO_LIVE_BLOCKERS.md")
workflow=read(".github/workflows/booking-quote-experiment-approval-measurement-lock-authority.yml")
dev=read(".github/workflows/development-source-gate.yml")
prod=read(".github/workflows/production-business-acceptance-authority.yml")
prod_check=read("scripts/production_business_acceptance_check.py")
retained471=read("scripts/booking_quote_controlled_experiment_framework_check.py")
retained451=read("scripts/booking_funnel_quote_pricing_learning_check.py")

require(helper,[
 "buildBookingQuoteExperimentApprovalMeasurementLock",
 "experiment_approval_measurement_lock_build:481",
 'experiment_approval_measurement_lock_authority:"booking_quote_experiment_approval_measurement_lock"',
 'authority:"booking_quote_experiment_approval_measurement_lock"',
 '"measurement_locked"',
 '"owner_approval_required"',
 "success_threshold_required:true",
 "target_direction_required:true",
 "winner_rule_required:true",
 "positive_duration_required:true",
 "allocation_rule_required:true",
 "explicit_stop_conditions_required:true",
 "seasonal_weather_eligibility_required:true",
 "immutable_after_lock:true",
 "lock_does_not_authorize_execution:true",
 'region:"Southern Ontario, Canada"',
 "weather_ineligible_sessions_excluded_from_conversion_denominator:seasonalBoundaryComplete",
 "cold_weather_restriction_counts_as_conversion_failure:false",
 "service_temperature_limit_inferred:false",
 "execution_authorized:false",
 "experiment_started:false",
 "pricing_mutation_allowed:false",
 "discount_mutation_allowed:false",
 "booking_rule_mutation_allowed:false",
 "availability_mutation_allowed:false",
 "outreach_allowed:false"
],"Build 481 helper")

require(endpoint,[
 "Build 451/461/471/481",
 'loadAppSettings(env,["booking_quote_experiment_approval_lock"])',
 "approval_records:approvalSettings?.booking_quote_experiment_approval_lock||{}",
 "onRequestPost(){return readOnly()}",
 "dedicated Build 481 approval-lock endpoint"
],"Build 481 retained read endpoint")

require(save,[
 'const SETTING_KEY="booking_quote_experiment_approval_lock"',
 '"booking_stage_clarity","quote_band_clarity","accepted_work_scope_clarity"',
 "REQUIRED_STOP_CONDITIONS",
 "body.approved!==true||body.confirm_measurement_lock!==true",
 'weatherIneligibleHandling!=="exclude_from_conversion_denominator"',
 "This measurement contract is already locked and immutable in Build 481.",
 "execution_authorized:false",
 "experiment_started:false",
 'authority:"booking_quote_experiment_approval_measurement_lock"',
 "The measurement contract is locked. This does not authorize experiment execution"
],"Build 481 governance save endpoint")
for token in ["searchconsole.googleapis.com","mybusiness.googleapis.com","setInterval(","wrangler pages deploy"]:
 if token in save+helper+endpoint:
  errors.append(f"Build 481 contains forbidden provider/polling/deploy token {token!r}")
if "method:\"POST\"" not in save:
 errors.append("Build 481 governance save endpoint must explicitly write through POST")
for token in ["method:\"PATCH\"","method:\"DELETE\"","method:\"PUT\""]:
 if token in save:
  errors.append(f"Build 481 governance save endpoint contains forbidden persistence method {token!r}")

require(client,[
 "measurementLocks481",
 "saveMeasurementLock481",
 "/api/admin/booking_quote_experiment_approval_lock_save",
 'method:"POST"',
 "Build 481 measurement contract locked.",
 "Cold-weather restriction counts as conversion failure: NO",
 "Execution authorized: NO"
],"Build 481 workbench client")
for token in ["localStorage","sessionStorage","setInterval("]:
 if token in client:
  errors.append(f"Build 481 client contains forbidden local persistence/polling token {token!r}")

require(page,[
 'data-build481="booking-quote-experiment-approval-measurement-lock"',
 "Build 481 · Booking &amp; Quote Experiment Approval &amp; Measurement Lock",
 'id="experimentMeasurementLocks481"',
 'id="measurementLockForm481"',
 "weather-ineligible sessions must be excluded from the conversion denominator",
 "Exact service temperature limits are never guessed here"
],"Build 481 page")
if page!=copy:
 errors.append("booking/quote workbench route copies must remain byte-identical")
if len(re.findall(r"<h1\b",page,re.I))!=1:
 errors.append("booking/quote workbench must retain exactly one H1")

require(contract,[
 "# Build 481 — Booking & Quote Experiment Approval & Measurement Lock",
 "measurement_locked",
 "immutable through the Build 481 endpoint",
 "Southern Ontario seasonal/weather eligibility",
 "Weather-ineligible sessions must be excluded from the conversion denominator",
 "execution_authorized: false",
 "Build 482 — Staff & Mobile Remediation Execution Evidence Readiness"
],"Build 481 contract")
require(roadmap,[
 "Build 481 — Booking & Quote Experiment Approval & Measurement Lock",
 "weather-ineligible sessions as ordinary conversion failures",
 "Southern Ontario seasonal-service truth direction"
],"Build 481 roadmap")
require(queue,[
 "BUILD481_BOOKING_QUOTE_EXPERIMENT_APPROVAL_MEASUREMENT_LOCK.md",
 "Build 482 — Staff & Mobile Remediation Execution Evidence Readiness",
 "it has not run out"
],"Build 481 queue")
require(handoff,[
 "BUILD481_BOOKING_QUOTE_EXPERIMENT_APPROVAL_MEASUREMENT_LOCK.md",
 "booking_quote_experiment_approval_measurement_lock_check.py",
 "booking_quote_experiment_approval_measurement_lock_test.mjs"
],"Build 481 handoff")
require(readme,[
 "BUILD481_BOOKING_QUOTE_EXPERIMENT_APPROVAL_MEASUREMENT_LOCK.md",
 "booking_quote_experiment_approval_measurement_lock_check.py",
 "booking_quote_experiment_approval_measurement_lock_test.mjs"
],"Build 481 README")
require(blockers,[
 "Build 481 adds explicit owner-approved booking/quote measurement locks",
 "Weather-ineligible sessions are excluded"
],"Build 481 HOLD boundary")
require(workflow,[
 "Build 481 — Booking & Quote Experiment Approval & Measurement Lock Authority",
 "booking-quote-experiment-approval-measurement-lock",
 "booking_quote_experiment_approval_measurement_lock_check.py",
 "booking_quote_experiment_approval_measurement_lock_test.mjs"
],"Build 481 focused workflow")
for gate,label in ((dev,"Development source gate"),(prod,"Production business acceptance")):
 require(gate,[
  "python -m py_compile scripts/booking_quote_experiment_approval_measurement_lock_check.py",
  "node --check scripts/booking_quote_experiment_approval_measurement_lock_test.mjs",
  "python scripts/booking_quote_experiment_approval_measurement_lock_check.py",
  "node scripts/booking_quote_experiment_approval_measurement_lock_test.mjs"
 ],label)
require(prod_check,[
 '"booking_quote_experiment_approval_measurement_lock"',
 "scripts/booking_quote_experiment_approval_measurement_lock_check.py",
 "scripts/booking_quote_experiment_approval_measurement_lock_test.mjs",
 "weather-ineligible sessions"
],"central Production acceptance")
require(retained471,[
 "BUILD471_BOOKING_QUOTE_CONTROLLED_EXPERIMENT_FRAMEWORK.md",
 "/api/admin/booking_quote_experiment_approval_lock_save"
],"retained Build 471 authority")
require(retained451,[
 "BUILD451_BOOKING_FUNNEL_QUOTE_PRICING_LEARNING.md",
 "/api/admin/booking_quote_experiment_approval_lock_save"
],"retained Build 451 authority")

migrations=[p for p in ROOT.rglob("*.sql") if re.search(r"(?:^|[^0-9])481(?:[^0-9]|$)",p.name)]
if migrations:
 errors.append("Build 481 must not introduce a schema migration: "+", ".join(str(p.relative_to(ROOT)) for p in migrations))

commands=[
 ["node","--check","functions/api/_lib/booking-funnel-quote-pricing-learning.js"],
 ["node","--check","functions/api/admin/booking_funnel_quote_pricing_learning.js"],
 ["node","--check","functions/api/admin/booking_quote_experiment_approval_lock_save.js"],
 ["node","--check","assets/build451-booking-funnel-quote-pricing-learning.js"],
 ["node","--check","scripts/booking_quote_experiment_approval_measurement_lock_test.mjs"],
 ["node","scripts/booking_quote_experiment_approval_measurement_lock_test.mjs"],
 ["python","scripts/booking_quote_controlled_experiment_framework_check.py"],
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
 print("BUILD 481 BOOKING & QUOTE EXPERIMENT APPROVAL & MEASUREMENT LOCK AUTHORITY: FAIL")
 for error in errors:
  print(" -",error)
 sys.exit(1)

print("BUILD 481 BOOKING & QUOTE EXPERIMENT APPROVAL & MEASUREMENT LOCK AUTHORITY: PASS")
print(" - complete owner approval + threshold/duration/allocation/stop-condition contract is required before lock")
print(" - locked measurement governance is immutable through Build 481 and does not authorize execution")
print(" - Southern Ontario weather-ineligible sessions are excluded without inventing temperature limits")
print(" - existing app settings store reused; no schema migration")
print(" - no automatic price/discount/booking-rule/availability/outreach/provider/customer mutation or polling")
