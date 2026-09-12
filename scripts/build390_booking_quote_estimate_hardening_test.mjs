import assert from "node:assert/strict";
import {
  acceptedQuoteContinuity,
  availabilityContinuity,
  depositRequestContinuity,
  fixedCatalogQuoteContinuity,
  inspectionEstimateContinuity
} from "../functions/api/_lib/commercial-continuity.js";

const fixed = fixedCatalogQuoteContinuity();
assert.equal(fixed.commercial_kind, "quote");
assert.equal(fixed.inspection_required, false);
assert.equal(fixed.compatibility_status, "confirmed");
assert.equal(fixed.availability_status, "unverified");
assert.equal(fixed.booking_confirmed, false);
assert.equal(fixed.payment_confirmed, false);

const estimate = inspectionEstimateContinuity("Headlight condition requires inspection.");
assert.equal(estimate.commercial_kind, "estimate");
assert.equal(estimate.inspection_required, true);
assert.equal(estimate.compatibility_status, "requires_review");
assert.equal(estimate.booking_confirmed, false);
assert.equal(estimate.deposit_status, "not_requested");

const available = availabilityContinuity(true);
assert.equal(available.availability_status, "available_unheld");
assert.equal(available.slot_held, false);
assert.equal(available.booking_confirmed, false);

const unavailable = availabilityContinuity(false);
assert.equal(unavailable.availability_status, "unavailable");
assert.equal(unavailable.booking_confirmed, false);

const accepted = acceptedQuoteContinuity();
assert.equal(accepted.quote_accepted, true);
assert.equal(accepted.booking_confirmed, false);
assert.equal(accepted.payment_confirmed, false);
assert.equal(accepted.availability_status, "unverified");

const unpaid = depositRequestContinuity(
  { payment_status: "pending", booking_confirmed_at: null },
  { acceptance_status: "accepted" }
);
assert.equal(unpaid.quote_accepted, true);
assert.equal(unpaid.deposit_paid, false);
assert.equal(unpaid.booking_confirmed, false);

const paidNotConfirmed = depositRequestContinuity(
  { payment_status: "paid", booking_confirmed_at: null },
  { acceptance_status: "accepted" }
);
assert.equal(paidNotConfirmed.deposit_paid, true);
assert.equal(paidNotConfirmed.payment_confirmed, true);
assert.equal(paidNotConfirmed.booking_confirmed, false);
assert.equal(paidNotConfirmed.next_action, "await_booking_confirmation");

const confirmed = depositRequestContinuity(
  { payment_status: "paid", booking_confirmed_at: "2026-09-12T12:00:00.000Z" },
  { acceptance_status: "accepted" }
);
assert.equal(confirmed.deposit_paid, true);
assert.equal(confirmed.booking_confirmed, true);
assert.equal(confirmed.booking_status, "confirmed");

console.log("Build 390 booking/quote/estimate continuity regression: PASS");
