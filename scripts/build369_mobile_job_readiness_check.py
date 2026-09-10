#!/usr/bin/env python3
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
APP = (ROOT / "apps/detailer/detailer-app.js").read_text(encoding="utf-8")
GET = (ROOT / "functions/api/jobsite_intake_get.js").read_text(encoding="utf-8")
SAVE = (ROOT / "functions/api/jobsite_intake_save.js").read_text(encoding="utf-8")

errors = []

def require(text, needle, label):
    if needle not in text:
        errors.append(f"missing {label}: {needle}")

# Mobile Detailer App must load the canonical staff-authorized intake on demand.
require(APP, "/api/jobsite_intake_get", "canonical intake endpoint")
require(APP, "Pre-visit site readiness", "readiness heading")
require(APP, "safe, private/permitted work area", "work-area business rule")
require(APP, "Rosie supplies normal detailing water and power", "Rosie utility-supply rule")
require(APP, "No automatic retry was started", "fail-closed retry language")

canonical_fields = [
    "vehicle_accessible_and_safe",
    "keys_collected",
    "keys_handed_over_acknowledged",
    "owner_present_for_visual_inspection",
    "owner_damage_acknowledged",
    "entire_vehicle_accessible",
    "site_weather_notes",
    "owner_notes",
    "detailer_pre_job_notes",
    "intake_complete",
]
for field in canonical_fields:
    require(APP, field, f"mobile canonical field {field}")
    require(SAVE, field, f"saved canonical field {field}")

# The read endpoint must remain staff-authorized and booking-scoped.
require(GET, "requireStaffAccess", "staff authorization")
require(GET, "capability: 'work_booking'", "work_booking capability")
require(GET, "booking_id", "booking scope")
require(GET, "booking_jobsite?select=*", "canonical booking_jobsite projection")

# Build 369 must preserve the no-recurring-network-work invariant.
if "setInterval(" in APP:
    errors.append("detailer app introduced setInterval recurring work")
if "setTimeout(loadSelectedReadiness" in APP or "setTimeout(()=>loadSelectedReadiness" in APP:
    errors.append("readiness introduced automatic retry scheduling")

# Do not regress to a customer-supplied normal utility requirement.
for forbidden in ("customer supplies water", "customer supplies power", "customer must supply water", "customer must supply power"):
    if forbidden.lower() in APP.lower():
        errors.append(f"forbidden utility wording: {forbidden}")

if errors:
    print("Build 369 mobile job readiness authority check FAILED:")
    for error in errors:
        print(f" - {error}")
    sys.exit(1)

print("Build 369 mobile job readiness authority check GREEN")
print(f"Validated {len(canonical_fields)} canonical readiness fields, staff authority, Rosie utility rule, and no recurring readiness polling.")
