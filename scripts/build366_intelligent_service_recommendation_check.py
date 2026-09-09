from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
engine = (ROOT / "assets/service-recommendation.js").read_text(encoding="utf-8")
ui = (ROOT / "assets/booking-service-recommendation.js").read_text(encoding="utf-8")
policies = (ROOT / "assets/site-policies.js").read_text(encoding="utf-8")
book = (ROOT / "book.html").read_text(encoding="utf-8")
catalog = (ROOT / "data/rosie_services_pricing_and_packages.json").read_text(encoding="utf-8")
test = (ROOT / "scripts/build366_intelligent_service_recommendation_test.mjs").read_text(encoding="utf-8")

# Pure engine must rank caller-supplied catalogue rows; it must not own Rosie package identifiers or prices.
assert "export function recommendService" in engine
assert "Array.isArray(packages)" in engine
assert "priceForSize" in engine
assert "return a.price - b.price" in engine
for forbidden in ["premium_wash", "basic_detail", "complete_detail", "interior_detail", "exterior_detail"]:
    assert forbidden not in engine, f"Recommendation engine hard-codes canonical package id: {forbidden}"

# The booking enhancer must read the existing catalogue and remain advisory.
assert "loadPricingCatalogClient" in ui
assert "recommendService" in ui
assert "Recommendation only" in ui
assert "data-package-card" in ui
assert "service-recommended" in ui
assert "data-choose-package" not in ui
assert ".click()" not in ui
assert "packageCode =" not in ui

# Existing booking hook loads the Build 366 enhancement only on /book.
assert "wireBookingServiceRecommendation" in policies
assert "/assets/booking-service-recommendation.js?v=20260909build366" in policies
assert "if (!isBookingPage()) return;" in policies

# Build 366 consumes the established booking/catalog authority instead of adding a parallel catalogue.
assert "loadPricingCatalogClient" in book
assert 'id="packageGrid"' in book
for marker in ["recommendation_tags", "customer_goal", "service_level", "best_for"]:
    assert marker in catalog, f"Canonical catalogue missing recommendation metadata: {marker}"

# Regression suite covers deterministic behavior, unknown input safety, no mutation, and anti-upsell tie-breaking.
for label in [
    "Empty or malformed catalogues fail closed",
    "Unknown goal/condition inputs normalize safely",
    "Recommendations are deterministic",
    "Ranking never mutates",
    "lower price as the tie-breaker",
    "Returned package codes always originate"
]:
    assert label in test, f"Missing regression evidence: {label}"

print("Build 366 intelligent service recommendation source authority: PASS")
