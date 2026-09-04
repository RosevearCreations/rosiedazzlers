#!/usr/bin/env python3
"""Fail-closed source authority for Build 325 booking wizard responsive UX."""
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
BOOK = ROOT / "book.html"
BOOK_ROUTE = ROOT / "book" / "index.html"
LOADER = ROOT / "assets" / "booking-hours.js"
HELPER = ROOT / "assets" / "booking-wizard-responsive-v325.js"
WORKFLOW = ROOT / ".github" / "workflows" / "development-source-gate.yml"
errors = []


def require(path: Path, needles, label):
    if not path.exists():
        errors.append(f"missing {label}: {path.relative_to(ROOT)}")
        return ""
    text = path.read_text(encoding="utf-8")
    for needle in needles:
        if needle not in text:
            errors.append(f"{label} missing required contract: {needle!r}")
    return text


book = require(BOOK, [
    'new CustomEvent("rd:analytics"',
    'analyticsTrack("booking_step_view", { step_number: state.currentStep })',
    'analyticsTrack("booking_date_pick"',
    'analyticsTrack("booking_slot_pick"',
    'function gotoStep(step)',
    'async function validateStep(step)',
    'id="wizardNav"',
    'id="bookingStatus"',
], "canonical booking page")

route = require(BOOK_ROUTE, [
    'new CustomEvent("rd:analytics"',
    'analyticsTrack("booking_step_view", { step_number: state.currentStep })',
], "booking route copy")

loader = require(LOADER, [
    "Build 325: fail-open loader for booking wizard responsive/focus UX.",
    "function loadBuild325WizardUX()",
    "canonicalPath() !== '/book'",
    "/assets/booking-wizard-responsive-v325.js",
    "data-build325-booking-wizard-ux",
    "Standard booking remains available.",
    "loadBuild325WizardUX();",
], "booking helper loader")

helper = require(HELPER, [
    "Build 325: responsive, touch, focus, validation, and status UX",
    'matchMedia?.("(prefers-reduced-motion: reduce)")',
    'min-height:44px',
    '@media (max-width:720px)',
    '@media (max-width:480px)',
    'env(safe-area-inset-bottom)',
    'overflow-x:auto',
    'grid-auto-flow:column',
    'grid-template-columns:minmax(0,1fr)!important',
    'aria-current',
    'aria-controls',
    'aria-labelledby',
    'aria-invalid',
    'aria-describedby',
    'aria-live',
    'aria-atomic',
    'role", "alert"',
    'scrollIntoView',
    'focus({ preventScroll: true })',
    'new MutationObserver',
    '#bookingStatus',
    '#availabilityNote',
    '#service_date',
    '#service_area',
    '[data-slot]:not([disabled])',
    '#veh_year',
    '#vehicle_size',
    '#packageCards button',
    '#ack_driveway:not(:checked)',
    '#customer_name',
    '#customer_email',
    '#address_line1',
    '#postal_code',
    'document.documentElement.dataset.bookingWizardUxBuild = BUILD',
], "Build 325 booking UX helper")

workflow = require(WORKFLOW, [
    "assets/booking-wizard-responsive-v325.js",
    "scripts/booking_wizard_responsive_ux_check.py",
    "python scripts/booking_wizard_responsive_ux_check.py",
    "Booking wizard responsive UX authority: PASS",
], "current source gate")

if book and route and book != route:
    errors.append("book.html and book/index.html are not byte-identical")

# Build 325 must not alter the canonical Build 324 analytics event contract.
for event in [
    'booking_step_view',
    'booking_date_pick',
    'booking_slot_pick',
    'booking_condition_recommendation_apply',
    'booking_photo_estimate_requested',
]:
    if event not in book or event not in route:
        errors.append(f"Build 324 booking telemetry event missing from route copies: {event}")

# The helper is presentation/accessibility only. Network or booking mutation belongs to the canonical booking client.
for primitive in ["fetch(", "XMLHttpRequest", "sendBeacon(", "/api/"]:
    if primitive in helper:
        errors.append(f"Build 325 UX helper contains forbidden network primitive: {primitive}")

# The loader must remain fail-open; never block booking on optional UX enhancement.
for primitive in ["throw new Error", "location.reload(", "window.location="]:
    if primitive in loader:
        errors.append(f"Build 325 loader contains blocking primitive: {primitive}")

# Build 325 is source-only and must not introduce a schema migration.
migrations = list(ROOT.glob("**/*325*.sql"))
if migrations:
    errors.append("Build 325 must not introduce a schema migration: " + ", ".join(str(p.relative_to(ROOT)) for p in migrations))

if errors:
    print("BOOKING WIZARD RESPONSIVE UX: FAIL")
    for error in errors:
        print(f"- {error}")
    sys.exit(1)

print("BOOKING WIZARD RESPONSIVE UX: PASS")
print("- canonical /book route copies remain byte-identical")
print("- Build 324 booking funnel telemetry event names remain intact")
print("- responsive navigation and card layout are protected at 720px/480px")
print("- touch targets and mobile safe-area actions are protected")
print("- current-step semantics and panel relationships are protected")
print("- stage transitions recover scroll/focus with reduced-motion support")
print("- validation errors recover focus to the relevant control")
print("- availability/conflict/error messages expose live-region semantics")
print("- Build 325 helper is DOM-only and fail-open")
print("- no Build 325 database migration is present")
