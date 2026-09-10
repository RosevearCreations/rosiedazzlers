from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
engine = (ROOT / "assets/addon-eligibility.js").read_text(encoding="utf-8")
ui = (ROOT / "assets/booking-addon-optimization.js").read_text(encoding="utf-8")
policies = (ROOT / "assets/site-policies.js").read_text(encoding="utf-8")
planner = (ROOT / "booking-planner.html").read_text(encoding="utf-8")
analytics = (ROOT / "assets/public-analytics.js").read_text(encoding="utf-8")
ingest = (ROOT / "functions/api/analytics/ingest.js").read_text(encoding="utf-8")

required_engine = [
    "addonEligibleForPackage", "addonIncludedByPackage", "recommendAddons", "addonAttachRate",
    "requires_package_codes_any", "lower-cost tie-breaker only", "No positive evidence means no recommendation"
]
for token in required_engine:
    assert token in engine, f"missing add-on engine authority token: {token}"

required_ui = [
    "Nothing is added automatically", "data-addon-recommended", "booking_addon_recommendation_exposure",
    "booking_addon_recommendation_accept", "window.RosieAnalytics?.track", "conditionSelectionBefore",
    "newlySelected", "normal booking controls remain usable"
]
for token in required_ui:
    assert token in ui, f"missing booking add-on optimization token: {token}"

assert "booking-addon-optimization.js?v=20260909build367" in policies
assert "wireBookingAddonOptimization" in policies
assert "isBookingPage() && !isBookingPlannerPage()" in policies

# Existing booking authority must still persist only the customer's current selected Set.
assert "addon_codes: Array.from(state.addons)" in planner
assert 'analyticsTrack("booking_addon_toggle"' in planner
assert 'data-addon="${escapeHtml(addon.code)}"' in planner

# Build 367 must reuse the bounded fail-open analytics path rather than invent another telemetry store.
assert "const API = '/api/analytics/ingest'" in analytics
assert "MAX_BATCH = 12" in analytics
assert "Telemetry is expendable" in analytics
assert "Analytics always fails open" in ingest
assert "site_activity_events" in ingest

# Privacy boundary: recommendation telemetry contains catalogue/choice context, not customer identity fields.
for forbidden in ["customer_email", "customer_phone", "address_line1", "customer_name"]:
    assert forbidden not in ui, f"PII field leaked into add-on recommendation module: {forbidden}"

print("Build 367 add-on eligibility and attach-rate source authority passed.")
