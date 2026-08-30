// Build 274 — explicit payment amount unit helpers.
// Provider APIs do not agree on units: Stripe returns integer cents while PayPal returns decimal currency strings.
// Keep the conversions explicit and never infer units from an amount-size threshold.

export function normalizeCents(value) {
  if (value === null || value === undefined || value === "") return 0;
  const raw = Number(value);
  if (!Number.isFinite(raw) || raw < 0) return 0;
  return Math.round(raw);
}

export function decimalMoneyToCents(value) {
  if (value === null || value === undefined || value === "") return 0;
  const raw = Number(value);
  if (!Number.isFinite(raw) || raw < 0) return 0;
  return Math.round(raw * 100);
}

// Compatibility bridge for older webhook call sites while Build 274 finishes provider-specific extraction.
// Numeric values and integer strings are treated as already-cents (Stripe shape).
// Decimal strings are treated as currency-unit amounts (PayPal shape, e.g. "50.00").
export function providerMoneyToCents(value) {
  if (typeof value === "string") {
    const raw = value.trim();
    if (!raw) return 0;
    if (/^\d+\.\d{1,2}$/.test(raw)) return decimalMoneyToCents(raw);
  }
  return normalizeCents(value);
}
