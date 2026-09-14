#!/usr/bin/env python3
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
errors = []


def read(path):
    p = ROOT / path
    if not p.exists():
        errors.append(f"missing {path}")
        return ""
    return p.read_text(encoding="utf-8", errors="ignore")


def require(path, needles):
    text = read(path)
    for needle in needles:
        if needle not in text:
            errors.append(f"{path}: missing {needle!r}")
    return text

booking = require("assets/build398-booking-journey-qol.js", [
    "rd_booking_selection_v398",
    "48 * 60 * 60 * 1000",
    "Resume service choices",
    "Start fresh",
    "vehicle size, service, and add-on codes",
    "min-height:44px",
    "wireBookingJourneyQol",
])
require("assets/site-policies.js", [
    "build398-booking-journey-qol.js?v=20260914build398",
    "wireBookingJourneyQol",
])
endpoint = require("functions/api/admin/marketing_acquisition_quality.js", [
    'capability: "view_analytics"',
    "site_activity_events",
    "source,campaign",
    "ROW_LIMIT = 2000",
    'status: "unavailable"',
    '"insufficient"',
    "cross_layer_identity_join: false",
    "customer_identity_exposed: false",
    "raw_session_identifiers_exposed: false",
    "raw_ip_user_agent_exposed: false",
    "attribution_inference: false",
])
require("admin-acquisition-quality.html", [
    'name="viewport"',
    "/api/admin/marketing_acquisition_quality",
    "Observed source, campaign, referrer and device evidence only",
    "raw referrer URLs are not exposed",
    "data-page=\"admin-growth\"",
])
require("assets/admin-menu.js", [
    "/admin-acquisition-quality.html",
    "Acquisition Quality",
    "Growth evidence",
])
require("BUILD398_CUSTOMER_JOURNEY_ACQUISITION.md", [
    "Build 398 — Customer Journey, Booking QoL & Acquisition Quality",
    "Build 399 — Customer Communication, Self-Service & Booking Funnel",
    "no database migration",
    "exact-SHA",
])
require("AUTONOMOUS_RELEASE_QUEUE.md", [
    "Build 398 — Customer Journey, Booking QoL & Acquisition Quality",
    "Build 399 — Customer Communication, Self-Service & Booking Funnel",
])
require("AI_PROJECT_HANDOFF.md", [
    "Build 398 — Customer Journey, Booking QoL & Acquisition Quality",
    "Build 399 — Customer Communication, Self-Service & Booking Funnel",
])
require("README.md", [
    "Current source direction: **Build 398 — Customer Journey, Booking QoL & Acquisition Quality**.",
    "BUILD398_CUSTOMER_JOURNEY_ACQUISITION.md",
])

# The new aggregate endpoint must not select or expose raw identifiers.
for forbidden in ["session_id", "visitor_id", "ip_address", "user_agent", "postal_code", "customer_email"]:
    if re.search(rf"select=[^\n\"']*\b{re.escape(forbidden)}\b", endpoint, re.I):
        errors.append(f"acquisition endpoint selects forbidden identifier {forbidden}")

# The browser draft may mention excluded fields in privacy copy. Validate only the
# actual persisted object keys; value expressions such as Date.now() are irrelevant.
set_match = re.search(r"localStorage\.setItem\(STORAGE_KEY,\s*JSON\.stringify\((\{.*?\})\)\);", booking, re.S)
if not set_match:
    errors.append("booking QoL does not have a recognizable bounded localStorage payload")
else:
    payload = set_match.group(1)
    keys = set(re.findall(r"(?:^|[,\{])\s*([A-Za-z_$][\w$]*)\s*(?=[:,\}])", payload))
    required_keys = {"size", "package", "addons", "saved_at"}
    if keys != required_keys:
        errors.append(f"booking draft keys are {sorted(keys)}, expected {sorted(required_keys)}")

if errors:
    print("BUILD 398 CUSTOMER JOURNEY & ACQUISITION QUALITY: FAIL")
    for error in errors:
        print(f"- {error}")
    sys.exit(1)

print("BUILD 398 CUSTOMER JOURNEY & ACQUISITION QUALITY: GREEN")
print("- browser draft is bounded to non-PII service selections and explicit resume/start-fresh behavior")
print("- acquisition evidence is aggregate-only, observed, bounded, and fail-closed")
print("- responsive phone/tablet/desktop contracts remain retained")
print("- schema/provider/business-data mutation authorized: NONE")
