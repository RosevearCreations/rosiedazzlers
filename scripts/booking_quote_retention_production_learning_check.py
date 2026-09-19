#!/usr/bin/env python3
"""Build 441 source authority for Booking, Quote & Retention Production Learning."""
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
errors = []

def read(path):
    target = ROOT / path
    if not target.is_file():
        errors.append(f"missing required file: {path}")
        return ""
    return target.read_text(encoding="utf-8", errors="ignore")

def require(text, needles, label):
    for needle in needles:
        if needle not in text:
            errors.append(f"{label} missing {needle!r}")

helper = read("functions/api/_lib/booking-quote-retention-production-learning.js")
endpoint = read("functions/api/admin/booking_quote_retention_production_learning.js")
page = read("admin-booking-quote-retention-learning.html")
route = read("admin-booking-quote-retention-learning/index.html")
client = read("assets/build441-booking-quote-retention-learning.js")
test = read("scripts/booking_quote_retention_production_learning_test.mjs")
contract = read("BUILD441_BOOKING_QUOTE_RETENTION_PRODUCTION_LEARNING.md")
readme = read("README.md")
queue = read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff = read("AI_PROJECT_HANDOFF.md")
auth = read("assets/admin-auth.js")
nav = read("assets/app-core/module-navigation.js")

if page != route:
    errors.append("Build 441 .html and folder-index routes must remain byte-identical")

require(helper, [
    "build: 441",
    'mode: "booking_quote_retention_production_learning"',
    "correlation_only: true",
    "causal_claim_authority: false",
    "cross_layer_identity_join: false",
    "customer_identity_exposed: false",
    "automatic_segmentation_allowed: false",
    "automatic_outreach_allowed: false",
    "automatic_discount_allowed: false",
    "pricing_mutation_allowed: false",
    "automatic_booking_allowed: false",
    "automatic_maintenance_enrollment_allowed: false",
    "payment_mutation_allowed: false",
    "provider_mutation_allowed: false",
    "permanent_polling_allowed: false"
], "Build 441 helper")

require(endpoint, [
    '"manage_bookings"',
    "getBookingRebookingFunnel",
    "getRetentionRebookingLearning",
    "getQuotePipeline",
    "buildBookingQuoteRetentionProductionLearning",
    "onRequestPost",
    "onRequestPut",
    "onRequestPatch",
    "onRequestDelete"
], "Build 441 endpoint")

require(page, [
    'data-build441="booking-quote-retention-production-learning"',
    "Booking, Quote &amp; Retention Production Learning",
    "correlation",
    "No automatic outreach",
    'id="refreshLearning"',
    "/assets/build441-booking-quote-retention-learning.js"
], "Build 441 page")

require(client, [
    "/api/admin/booking_quote_retention_production_learning?days=",
    'method: "GET"',
    "No automatic action or polling is running."
], "Build 441 client")

for forbidden in ("setInterval(", "localStorage", "sessionStorage", 'method: "POST"', 'method: "PUT"', 'method: "PATCH"', 'method: "DELETE"'):
    if forbidden in client:
        errors.append(f"Build 441 client must not contain {forbidden!r}")

require(test, ["BUILD 441 BOOKING QUOTE RETENTION PRODUCTION LEARNING TEST: PASS"], "Build 441 test")
require(contract, [
    "# Build 441 — Booking, Quote & Retention Production Learning",
    "correlation",
    "No automatic outreach",
    "Build 442 — Staff Workflow & Support Exception Learning"
], "Build 441 contract")
require(readme, [
    "Current source direction: **Build 441 — Booking, Quote & Retention Production Learning**",
    "scripts/booking_quote_retention_production_learning_check.py",
    "**Build 442 — Staff Workflow & Support Exception Learning**"
], "README")
require(queue, [
    "**Build 441 — Booking, Quote & Retention Production Learning** is the active bounded release.",
    "**Build 442 — Staff Workflow & Support Exception Learning**"
], "release queue")
require(handoff, [
    "**Build 441 — Booking, Quote & Retention Production Learning** is the active bounded release.",
    ".github/workflows/booking-quote-retention-production-learning-authority.yml",
    "scripts/booking_quote_retention_production_learning_check.py"
], "handoff")
require(auth, ['case "admin-booking-quote-retention-learning"'], "operations route ceiling")
require(nav, [
    '"/admin-booking-quote-retention-learning.html"',
    '"page_key":"admin-booking-quote-retention-learning"',
    '"label":"Booking, Quote & Retention Learning"'
], "module navigation")

commands = [
    ["node", "--check", "functions/api/_lib/booking-quote-retention-production-learning.js"],
    ["node", "--check", "functions/api/admin/booking_quote_retention_production_learning.js"],
    ["node", "--check", "assets/build441-booking-quote-retention-learning.js"],
    ["node", "scripts/booking_quote_retention_production_learning_test.mjs"]
]
for command in commands:
    result = subprocess.run(command, cwd=ROOT, text=True, capture_output=True)
    if result.returncode:
        errors.append(f"{' '.join(command)} failed: {result.stderr.strip() or result.stdout.strip()}")

if errors:
    print("BUILD 441 BOOKING QUOTE RETENTION PRODUCTION LEARNING AUTHORITY: FAIL")
    for error in errors:
        print(" -", error)
    sys.exit(1)

print("BUILD 441 BOOKING QUOTE RETENTION PRODUCTION LEARNING AUTHORITY: PASS")
print(" - booking, quote and repeat-booking evidence remains aggregate and read-only")
print(" - observed counts remain correlation, not causal proof")
print(" - customer identity is not returned by the learning surface")
print(" - outreach, segmentation, discounts, pricing, bookings, enrollment, payment and provider mutations remain locked")
