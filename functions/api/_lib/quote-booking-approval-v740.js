// Build 740 — read-only quote acceptance, scope and deposit review.
// Provider authorization is HELD; this never creates a payment or reservation.
import {
  compareAcceptedTermsToCurrentPrice,
  hashStructuredQuoteTerms,
  normalizeStructuredQuoteTerms
} from "./quote-booking-terms.js";

const text = (value) => String(value ?? "").trim();
const safeTime = (value) => {
  const input = text(value);
  return input && Number.isFinite(Date.parse(input)) ? new Date(input).toISOString() : null;
};

export async function evaluateQuoteBookingApproval740({ quote, currentPrice, paymentRequests = [], proposedTerms = null, nowMs = Date.now() } = {}) {
  const source = quote && typeof quote === "object" ? quote : {};
  const accepted = source.acceptance_status === "accepted" && Boolean(safeTime(source.accepted_at));
  const terms = normalizeStructuredQuoteTerms(source.accepted_terms);
  const declaredHash = text(source.accepted_terms_hash);
  const deliveredHash = text(source.structured_terms_hash);
  const calculatedHash = accepted && declaredHash ? await hashStructuredQuoteTerms(terms) : null;
  const immutableMatch = Boolean(accepted && declaredHash && deliveredHash && calculatedHash === declaredHash && declaredHash === deliveredHash);
  const problems = [];

  if (!accepted) problems.push("No authenticated customer acceptance is recorded for this quote.");
  else if (!immutableMatch) problems.push("Accepted scope or its signed-off snapshot differs from the delivered quote. Re-issue it for customer confirmation.");

  const scopeComparison = immutableMatch
    ? compareAcceptedTermsToCurrentPrice(terms, currentPrice, nowMs)
    : { ok:false, code:"QUOTE_ACCEPTANCE_NOT_VERIFIED" };
  if (immutableMatch && !scopeComparison.ok) {
    problems.push(scopeComparison.error || "The accepted scope or price is no longer current. Obtain new customer confirmation.");
  }

  let proposedScopeMatches = true;
  if (proposedTerms != null) {
    const proposedHash = await hashStructuredQuoteTerms(proposedTerms);
    proposedScopeMatches = immutableMatch && proposedHash === declaredHash;
    if (!proposedScopeMatches) problems.push("The proposed package, size, add-ons, total, deposit or expiry differs from what the customer accepted.");
  }

  const rows = Array.isArray(paymentRequests) ? paymentRequests.slice(0, 10) : [];
  const previousRequests = rows.map((row) => ({
    id: text(row?.id) || null,
    provider: text(row?.provider) || "unknown",
    provider_status: text(row?.provider_status) || "not_reported",
    payment_status: text(row?.payment_status) || "not_reported",
    amount_cents: Number.isInteger(Number(row?.amount_cents)) ? Number(row.amount_cents) : null,
    requested_at: safeTime(row?.requested_at || row?.created_at),
    paid_at: safeTime(row?.paid_at),
    booking_confirmed_at: safeTime(row?.booking_confirmed_at)
  }));

  const scopeReady = accepted && immutableMatch && scopeComparison.ok && proposedScopeMatches;
  return Object.freeze({
    build: 740,
    status: scopeReady ? "scope_accepted_deposit_held" : "customer_reconfirmation_required",
    read_only: true,
    customer_acceptance: Object.freeze({
      state: text(source.acceptance_status) || "not_recorded",
      delivered_at: safeTime(source.delivered_at),
      responded_at: safeTime(source.responded_at),
      accepted_at: safeTime(source.accepted_at),
      accepted_snapshot_verified: immutableMatch,
      accepted_terms_fingerprint: immutableMatch ? declaredHash.slice(0, 12) : null
    }),
    accepted_scope: accepted ? Object.freeze({
      package_code: terms.package_code,
      vehicle_size: terms.vehicle_size,
      addon_codes: terms.addon_codes,
      total_cents: terms.total_cents,
      deposit_cents: terms.deposit_cents,
      currency: terms.currency,
      expires_at: terms.expires_at
    }) : null,
    scope_ready: scopeReady,
    proposed_scope_matches: proposedScopeMatches,
    pricing_review: Object.freeze({ state: scopeComparison.ok ? "matches_accepted_scope" : (scopeComparison.code || "unverified"), current_catalog_verified: currentPrice?.ok === true }),
    deposit: Object.freeze({
      accepted_amount_cents: scopeReady ? terms.deposit_cents : null,
      assumption: "Deposit comes only from the immutable customer-accepted quote after current catalog revalidation; it is not an independently typed amount.",
      provider_authorization: "HELD",
      can_create_payment_request: false,
      can_activate_live_provider: false,
      can_charge: false,
      existing_request_count: previousRequests.length,
      existing_requests: Object.freeze(previousRequests)
    }),
    staff_follow_up: Object.freeze({
      next_due_at: safeTime(source.follow_up_at),
      instruction: scopeReady
        ? "Confirm the customer's accepted scope, service date, site conditions, and consent. Provider activation remains on hold; use authorized manual staff follow-up."
        : "Resolve acceptance or pricing discrepancies; prepare and resend revised terms for an explicit customer decision."
    }),
    blockers: Object.freeze(problems),
    boundary: "Preview only: no booking, deposit request, customer message, provider session, charge, waiver or authorization change."
  });
}
