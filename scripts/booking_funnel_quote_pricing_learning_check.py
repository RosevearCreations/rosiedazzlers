#!/usr/bin/env python3
"""Build 451 source authority for Booking Funnel, Quote & Pricing Learning."""
from pathlib import Path
import re, subprocess, sys
ROOT=Path(__file__).resolve().parents[1]
errors=[]
def read(path):
    target=ROOT/path
    if not target.is_file():
        errors.append(f"missing required file: {path}")
        return ""
    return target.read_text(encoding="utf-8",errors="ignore")
def require(text,needles,label):
    for needle in needles:
        if needle not in text:
            errors.append(f"{label} missing {needle!r}")

helper=read("functions/api/_lib/booking-funnel-quote-pricing-learning.js")
endpoint=read("functions/api/admin/booking_funnel_quote_pricing_learning.js")
page=read("admin-booking-quote-retention-learning.html")
route=read("admin-booking-quote-retention-learning/index.html")
client=read("assets/build451-booking-funnel-quote-pricing-learning.js")
test=read("scripts/booking_funnel_quote_pricing_learning_test.mjs")
contract=read("BUILD451_BOOKING_FUNNEL_QUOTE_PRICING_LEARNING.md")
queue=read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff=read("AI_PROJECT_HANDOFF.md")
readme=read("README.md")
blockers=read("STARTUP_GO_LIVE_BLOCKERS.md")
dev=read(".github/workflows/development-source-gate.yml")
prod=read(".github/workflows/production-business-acceptance-authority.yml")

if page != route:
    errors.append("Build 451 .html and folder-index routes must remain byte-identical")
if len(re.findall(r"<h1\b",page,re.I)) != 1:
    errors.append("Build 451 learning page must retain exactly one H1")

require(helper,[
    "build:451",'authority:"booking_funnel_quote_pricing_learning"',
    "largest_price_adjacent_stage_drop","review_cohort_sufficient","accepted_value_delta",
    "stage_drop_proves_price_friction:false","quote_decline_proves_price_sensitivity:false",
    "accepted_value_delta_proves_discounting:false","accepted_quote_is_completed_work:false",
    "automatic_price_change_allowed:false","automatic_discount_allowed:false",
    "automatic_outreach_allowed:false","automatic_quote_acceptance_allowed:false",
    "automatic_booking_creation_allowed:false","payment_or_provider_mutation_allowed:false",
    "permanent_polling_allowed:false"
],"Build 451 helper")
require(endpoint,[
    'capability:"manage_bookings"',"getBookingRebookingFunnel","getQuotePipeline",
    "buildBookingFunnelQuotePricingLearning","onRequestPost","onRequestPut","onRequestPatch","onRequestDelete"
],"Build 451 endpoint")
for forbidden in ("customer_name","customer_email","lead_id","customer_id","booking_id","quote_number","setInterval("):
    if forbidden in endpoint:
        errors.append(f"Build 451 endpoint contains forbidden identity token {forbidden!r}")
require(page,[
    'data-build451="booking-funnel-quote-pricing-learning"',
    "Build 451 · Booking Funnel, Quote &amp; Pricing Learning",
    "Booking Funnel, Quote &amp; Pricing Learning",
    'id="refreshPricingLearning451"','id="pricingSummary451"','id="pricingBands451"',
    'id="pricingSignals451"','id="pricingSources451"',
    "/assets/build451-booking-funnel-quote-pricing-learning.js",
    "No automatic price or discount change"
],"Build 451 page")
require(client,[
    "/api/admin/booking_funnel_quote_pricing_learning?days=",
    'method:"GET"',
    "Pricing changes, discounts, outreach, quote acceptance and booking creation remain locked."
],"Build 451 client")
for forbidden in ("setInterval(","localStorage","sessionStorage",'method:"POST"','method:"PUT"','method:"PATCH"','method:"DELETE"'):
    if forbidden in client:
        errors.append(f"Build 451 client must not contain {forbidden!r}")
require(test,["BUILD 451 BOOKING FUNNEL QUOTE PRICING LEARNING TEST: PASS"],"Build 451 test")
require(contract,[
    "# Build 451 — Booking Funnel, Quote & Pricing Learning",
    "price-adjacent","at least three sent rows","does not establish customer motive",
    "No automatic:","Build 452 — Staff Workflow, Support & Mobile Efficiency Learning"
],"Build 451 contract")
require(blockers,["Build 451","pricing-review","does not close any HOLD"],"canonical HOLD backlog")
require(queue,[
    "**Build 452 — Staff Workflow, Support & Mobile Efficiency Learning** is the active bounded release.",
    "BUILD451_BOOKING_FUNNEL_QUOTE_PRICING_LEARNING.md",
    "**Build 453 — Service Economics, Capacity & Pricing Review** is next"
],"release queue")
require(handoff,[
    "**Build 452 — Staff Workflow, Support & Mobile Efficiency Learning** is the active bounded release.",
    "BUILD451_BOOKING_FUNNEL_QUOTE_PRICING_LEARNING.md",
    "booking_funnel_quote_pricing_learning_check.py"
],"handoff")
require(readme,[
    "Current source direction: **Build 452 — Staff Workflow, Support & Mobile Efficiency Learning**.",
    "BUILD451_BOOKING_FUNNEL_QUOTE_PRICING_LEARNING.md",
    "booking_funnel_quote_pricing_learning_check.py",
    "**Build 452 — Staff Workflow, Support & Mobile Efficiency Learning**"
],"README")
for gate,label in ((dev,"Development gate"),(prod,"Production gate")):
    require(gate,["booking_funnel_quote_pricing_learning_check.py","booking_funnel_quote_pricing_learning_test.mjs"],label)

for path in [
    "functions/api/_lib/booking-funnel-quote-pricing-learning.js",
    "functions/api/admin/booking_funnel_quote_pricing_learning.js",
    "assets/build451-booking-funnel-quote-pricing-learning.js",
    "scripts/booking_funnel_quote_pricing_learning_test.mjs"
]:
    result=subprocess.run(["node","--check",path],cwd=ROOT,text=True,capture_output=True)
    if result.returncode:
        errors.append(f"{path} syntax failed: {result.stderr.strip() or result.stdout.strip()}")

for command in [
    ["node","scripts/booking_funnel_quote_pricing_learning_test.mjs"],
    ["python","scripts/booking_quote_retention_production_learning_check.py"],
    ["node","scripts/booking_quote_retention_production_learning_test.mjs"],
    ["python","scripts/build427_booking_conversion_quote_clarity_check.py"],
    ["python","scripts/booking_rebooking_funnel_check.py"],
    ["node","scripts/booking_rebooking_funnel_test.mjs"]
]:
    result=subprocess.run(command,cwd=ROOT,text=True,capture_output=True)
    if result.returncode:
        errors.append(f"retained authority failed: {' '.join(command)}: {result.stderr.strip() or result.stdout.strip()}")

if errors:
    print("BUILD 451 BOOKING FUNNEL QUOTE PRICING LEARNING AUTHORITY: FAIL")
    for error in errors:
        print(" -",error)
    sys.exit(1)
print("BUILD 451 BOOKING FUNNEL QUOTE PRICING LEARNING AUTHORITY: PASS")
print(" - aggregate booking-stage and quote-value evidence only")
print(" - pricing signals are review prompts, not causal price-sensitivity claims")
print(" - no identity, automatic pricing/discount/outreach/quote/booking/provider mutation or polling")
