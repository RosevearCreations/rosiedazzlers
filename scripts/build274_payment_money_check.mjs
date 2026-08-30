// Build 274 executable payment-unit regression check.
import { normalizeCents, decimalMoneyToCents, providerMoneyToCents } from "../functions/api/_lib/payment-money.js";

function assertEqual(actual, expected, label) {
  if (actual !== expected) throw new Error(`${label}: expected ${expected}, got ${actual}`);
}

assertEqual(normalizeCents(5000), 5000, "Stripe $50 integer cents stay cents");
assertEqual(normalizeCents("5000"), 5000, "integer cent strings stay cents");
assertEqual(normalizeCents(12999), 12999, "Stripe $129.99 integer cents stay cents");
assertEqual(decimalMoneyToCents("50.00"), 5000, "PayPal $50.00 converts to cents");
assertEqual(decimalMoneyToCents("129.99"), 12999, "PayPal $129.99 converts to cents");
assertEqual(providerMoneyToCents(5000), 5000, "compat numeric provider amount stays cents");
assertEqual(providerMoneyToCents("5000"), 5000, "compat integer provider string stays cents");
assertEqual(providerMoneyToCents("50.00"), 5000, "compat decimal provider string converts from dollars");
assertEqual(normalizeCents(-1), 0, "negative cents rejected");
assertEqual(decimalMoneyToCents("not-money"), 0, "invalid decimal money rejected");

console.log("Build 274 payment money units: PASS");
console.log(" - Stripe integer cents are never multiplied by 100");
console.log(" - PayPal decimal currency strings convert to integer cents exactly once");
