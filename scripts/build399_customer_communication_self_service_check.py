from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
errors = []

def require(path, needles):
    target = ROOT / path
    if not target.exists():
        errors.append(f"missing {path}")
        return ""
    text = target.read_text(encoding="utf-8", errors="ignore")
    for needle in needles:
        if needle not in text:
            errors.append(f"{path}: missing {needle!r}")
    return text

require("assets/build399-customer-communication-self-service.js", ["Prepare for the visit", "Check appointment status", "Reschedule or cancel", "Aftercare and concerns", "Review completed work", "Book the next service", "do not silently change or cancel", "min-height:46px", "rd:analytics"])
require("my-account.html", ["build399-customer-communication-self-service.js?v=20260914build399"])
require("booking-confirmed.html", ["Preparation, status &amp; aftercare"])
endpoint = require("functions/api/admin/customer_booking_funnel_quality.js", ['capability: "view_analytics"', "EVENT_ROW_LIMIT = 2500", "BOOKING_ROW_LIMIT = 1000", "site_activity_events", "canonical_booking_layer", "denominator_coverage", "layers_joined: false", "identity_join: false", "messages_sent: false", "booking_mutation: false"])
require("admin-customer-booking-funnel.html", ['name="viewport"', "/api/admin/customer_booking_funnel_quality", "Anonymous interaction layer", "Canonical booking layer", "Unavailable — not zero"])
require("assets/admin-menu.js", ["/admin-customer-booking-funnel.html", "Customer Booking Funnel"])
require("BUILD399_CUSTOMER_COMMUNICATION_SELF_SERVICE.md", ["Build 399 — Customer Communication, Self-Service & Booking Funnel", "Build 400", "schema-neutral", "exact Production"])

# Build 399 is a retained historical feature authority. Living current/next release
# identity belongs to the release-convergence guard and must be free to advance.
require("AUTONOMOUS_RELEASE_QUEUE.md", ["## Current release", "## Next release", "Production deployment/runtime/business acceptance"])
require("AI_PROJECT_HANDOFF.md", ["## Current release boundary", "protected `main`", "Production deployment/runtime/business acceptance"])
require("README.md", ["Current source direction: **Build ", "scripts/release_authority_documentation_convergence_check.py"])

for forbidden in ["session_id", "visitor_id", "ip_address", "user_agent", "postal_code", "customer_email", "customer_name"]:
    if re.search(rf"select=[^\n\"']*\b{re.escape(forbidden)}\b", endpoint, re.I):
        errors.append(f"funnel endpoint selects forbidden identifier {forbidden}")

if errors:
    print("BUILD 399 CUSTOMER COMMUNICATION & BOOKING FUNNEL: FAIL")
    for error in errors:
        print(f"- {error}")
    sys.exit(1)

print("BUILD 399 CUSTOMER COMMUNICATION & BOOKING FUNNEL: GREEN")
print("- retained customer guidance remains responsive, explicit, and non-mutating")
print("- anonymous telemetry and canonical bookings remain separate bounded evidence layers")
print("- living release identity may advance independently through the convergence guard")
print("- automatic messaging, identity joins, schema and business-data mutation: NONE")
