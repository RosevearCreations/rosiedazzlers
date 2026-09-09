from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def text(path: str) -> str:
    p = ROOT / path
    assert p.exists(), f"missing {path}"
    return p.read_text(encoding="utf-8")


terms = text("functions/api/_lib/quote-booking-terms.js")
authority = text("functions/api/_lib/quote-booking-authority.js")
respond = text("functions/api/quote_proposal_respond.js")
deliver = text("functions/api/admin/quote_proposal_deliver.js")
reconcile = text("functions/api/admin/lead_conversion_price_reconcile.js")
create_booking = text("functions/api/admin/lead_conversion_create_booking.js")
admin_quote_delivery = text("assets/admin-quote-delivery.js")
admin_option_libraries = text("assets/admin-option-libraries.js")
migration = text("sql/2026-09-09_build362_quote_booking_acceptance.sql")
tests = text("scripts/build362_quote_booking_acceptance_test.mjs")

# Structured commercial terms are explicit, immutable on acceptance, and expiry gated.
for token in [
    "structured_terms", "structured_terms_hash", "accepted_terms", "accepted_terms_hash",
    "terms_expires_at", "QUOTE_EXPIRED", "QUOTE_TERMS_HASH_MISMATCH"
]:
    assert token in migration + respond + deliver + terms, f"missing structured quote authority: {token}"

assert "Set an explicit future quote expiry" in deliver
assert "Date.now()" in terms
assert "accepted_terms: checked.terms" in respond
assert "accepted_terms_hash: existing.structured_terms_hash" in respond
assert "QUOTE_ALREADY_ACCEPTED" in respond

# Admin must explicitly choose expiry; there is intentionally no baked-in validity period.
assert "data-delivery-expiry" in admin_quote_delivery
assert "datetime-local" in admin_quote_delivery
assert "parsed <= Date.now()" in admin_quote_delivery
assert "body.expires_at = pendingExpiryIso" in admin_quote_delivery
assert "/assets/admin-quote-delivery.js" in admin_option_libraries
assert "7 * 24" not in deliver + admin_quote_delivery
assert "30 * 24" not in deliver + admin_quote_delivery

# Current catalog and current appointment state are the booking authority.
assert "resolveCurrentQuotePrice" in reconcile
assert "resolveCurrentQuotePrice" in create_booking
assert "checkCurrentBookingAvailability" in create_booking
assert "compareAcceptedTermsToCurrentPrice" in create_booking
assert "price_total_cents: currentPrice.total_cents" in create_booking
assert "deposit_cents: currentPrice.deposit_cents" in create_booking
assert "allow_duplicate" not in create_booking

# Database replay protection must exist in addition to endpoint idempotency.
for token in [
    "source_quote_proposal_draft_id", "source_conversion_draft_id",
    "uq_bookings_source_quote_proposal_draft", "uq_bookings_source_conversion_draft"
]:
    assert token in migration + create_booking, f"missing replay protection: {token}"
assert "BOOKING_ALREADY_CREATED" in create_booking

# Authority shares checkout-style catalog and slot collision primitives.
assert "loadPricingCatalog" in authority
assert "date_blocks" in authority
assert "slot_blocks" in authority
assert "status.eq.confirmed" in authority
assert "BOOKING_SLOT_UNAVAILABLE" in terms

# Required regression cases.
for token in [
    "valid conversion", "expired quote", "stale price", "slot taken", "duplicate / replay",
    "missing / malformed structured quote data", "QUOTE_EXPIRED", "QUOTE_PRICE_CHANGED",
    "BOOKING_SLOT_UNAVAILABLE", "BOOKING_ALREADY_CREATED", "QUOTE_STRUCTURED_TERMS_REQUIRED"
]:
    assert token in tests, f"missing regression case: {token}"

print("Build 362 quote-to-booking acceptance authority: PASS")
