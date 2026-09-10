// Build 374 — shared read-only customer/service financial lifecycle authority.
// Finance booking events remain the source of truth for deposits, payments, tips, refunds and adjustments.

export const FINANCE_EVENT_TYPES = ["deposit", "final_payment", "tip", "refund", "discount", "other"].map((type) => `booking_finance_${type}`);

export function emptyFinanceSummary() {
  return { deposit: 0, final_payment: 0, tip: 0, refund: 0, discount: 0, other: 0 };
}

export function summarizeFinance(rows) {
  const map = new Map();
  for (const row of Array.isArray(rows) ? rows : []) {
    const bookingId = String(row?.booking_id || "");
    if (!bookingId) continue;
    const summary = map.get(bookingId) || emptyFinanceSummary();
    const payload = row && typeof row.payload === "object" && row.payload ? row.payload : {};
    const type = String(payload.entry_type || row.event_type || "").replace("booking_finance_", "");
    const amount = Number(payload.amount_cad || 0);
    if (Object.prototype.hasOwnProperty.call(summary, type) && Number.isFinite(amount)) summary[type] += amount;
    map.set(bookingId, summary);
  }
  return map;
}

export function cents(cad) {
  const value = Number(cad || 0);
  return Number.isFinite(value) ? Math.round(value * 100) : 0;
}

export function deriveFinancialLifecycle({ totalCents, finance = emptyFinanceSummary(), financeAvailable = true } = {}) {
  const serviceTotalCents = Math.max(0, Math.round(Number(totalCents || 0)));
  const depositCents = cents(finance.deposit);
  const finalPaymentCents = cents(finance.final_payment);
  const discountCents = cents(finance.discount);
  const refundCents = cents(finance.refund);
  const otherCents = cents(finance.other);
  const tipCents = cents(finance.tip);
  const remainingBalanceCents = Math.max(0, serviceTotalCents - depositCents - finalPaymentCents - discountCents - otherCents + refundCents);

  let state = "balance_due";
  if (!financeAvailable) state = "unavailable";
  else if (serviceTotalCents <= 0) state = "unverified_total";
  else if (remainingBalanceCents <= 0) state = "paid";

  return {
    available: !!financeAvailable,
    currency: "CAD",
    state,
    service_total_cents: serviceTotalCents,
    deposit_cents: depositCents,
    final_payment_cents: finalPaymentCents,
    service_payments_cents: depositCents + finalPaymentCents,
    discount_cents: discountCents,
    other_adjustment_cents: otherCents,
    refund_cents: refundCents,
    tip_cents: tipCents,
    remaining_balance_cents: remainingBalanceCents,
    tip_affects_service_balance: false
  };
}
