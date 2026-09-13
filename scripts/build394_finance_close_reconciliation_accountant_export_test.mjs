import assert from "node:assert/strict";
import { deriveFinanceCloseAcceptance } from "../functions/api/_lib/accounting-finance-close-acceptance.js";

const readyClosure = {
  close_ready_candidate: true,
  blockers: [],
  evidence: {
    booking_finance: {
      available: true,
      event_count: 6,
      deposit_cad: 120,
      final_payment_cad: 430,
      refund_cad: 25,
      discount_cad: 0,
      other_adjustment_cad: 0,
      tip_cad: 35
    },
    provider_payments: {
      available: true,
      paid_request_count: 2,
      paid_amount_cad: 430,
      settlement_review_ready: true
    },
    bank_reconciliation: {
      available: true,
      ready: true,
      difference_cad: 0,
      latest_reconciliation: { status: "reconciled" }
    },
    hst_support: {
      available: true,
      remittance_reviewed: true,
      report: {
        net_tax_payable_cad: 71.5,
        suggested_remittance_cad: 71.5
      }
    }
  }
};

const readyLedger = {
  by_account: [
    { account_code: "service_revenue", label: "Service revenue", amount_cad: 525 },
    { account_code: "payment_processing_fees", label: "Payment processing fees", amount_cad: 14.25 }
  ]
};

const ready = deriveFinanceCloseAcceptance({
  month: 8,
  year: 2026,
  closure: readyClosure,
  monthlyReport: readyLedger
});
assert.equal(ready.build, 394);
assert.equal(ready.status, "ready");
assert.equal(ready.scenarios.deposit.status, "ready");
assert.equal(ready.scenarios.final_balance.evidence.amount_cad, 430);
assert.equal(ready.scenarios.refund.evidence.amount_cad, 25);
assert.equal(ready.scenarios.provider_fees.status, "ready");
assert.equal(ready.scenarios.provider_fees.evidence.recorded_fee_cad, 14.25);
assert.equal(ready.scenarios.hst.status, "ready");
assert.equal(ready.scenarios.reconciliation.evidence.difference_cad, 0);
assert.equal(ready.scenarios.month_end.status, "ready");
assert.equal(ready.scenarios.accountant_export.status, "ready");
assert.equal(ready.boundaries.read_only, true);
assert.equal(ready.boundaries.accounting_posting, false);
assert.equal(ready.boundaries.payment_provider_mutation, false);
assert.ok(ready.export_manifest.csv_exports.some((row) => row.type === "general_ledger"));
assert.ok(ready.export_manifest.csv_exports.some((row) => row.type === "year_end_package"));

const missingFee = deriveFinanceCloseAcceptance({
  month: 8,
  year: 2026,
  closure: readyClosure,
  monthlyReport: { by_account: [{ account_code: "service_revenue", label: "Service revenue", amount_cad: 525 }] }
});
assert.equal(missingFee.status, "review");
assert.equal(missingFee.scenarios.provider_fees.status, "review");
assert.equal(missingFee.scenarios.accountant_export.status, "review");
assert.ok(missingFee.readiness.reasons.some((reason) => reason.includes("no explicit posted fee")));

const hstReview = deriveFinanceCloseAcceptance({
  month: 8,
  year: 2026,
  closure: {
    ...readyClosure,
    close_ready_candidate: false,
    blockers: ["Month-end review checklist is incomplete: remittance_reviewed."],
    evidence: {
      ...readyClosure.evidence,
      hst_support: {
        ...readyClosure.evidence.hst_support,
        remittance_reviewed: false
      }
    }
  },
  monthlyReport: readyLedger
});
assert.equal(hstReview.status, "review");
assert.equal(hstReview.scenarios.hst.status, "review");
assert.equal(hstReview.scenarios.month_end.status, "review");

const unavailable = deriveFinanceCloseAcceptance({
  month: 8,
  year: 2026,
  closure: null,
  monthlyReport: null,
  closureAvailable: false,
  ledgerAvailable: false,
  sourceErrors: ["month_end_closure: unavailable", "posted_ledger: unavailable"]
});
assert.equal(unavailable.status, "unavailable");
assert.equal(unavailable.scenarios.deposit.status, "unavailable");
assert.equal(unavailable.scenarios.reconciliation.status, "unavailable");
assert.equal(unavailable.scenarios.accountant_export.status, "unavailable");
assert.equal(unavailable.boundaries.customer_charge, false);
assert.equal(unavailable.boundaries.customer_refund, false);

const noProviderActivity = deriveFinanceCloseAcceptance({
  month: 8,
  year: 2026,
  closure: {
    ...readyClosure,
    evidence: {
      ...readyClosure.evidence,
      provider_payments: { available: true, paid_request_count: 0, paid_amount_cad: 0 }
    }
  },
  monthlyReport: { by_account: [] }
});
assert.equal(noProviderActivity.scenarios.provider_fees.status, "ready");
assert.equal(noProviderActivity.scenarios.provider_fees.evidence.applicable, false);

console.log("BUILD 394 FINANCE CLOSE / RECONCILIATION / ACCOUNTANT EXPORT: PASS");
console.log(" - deposit, final-balance and refund evidence remains booking-event authoritative");
console.log(" - provider fees require explicit posted ledger evidence when provider payments exist");
console.log(" - HST, bank reconciliation and month-end close fail closed when review evidence is incomplete");
console.log(" - accountant export remains a manual-approval candidate rather than an automatic posting action");
console.log(" - no accounting posting, period close, charge/refund or Stripe/PayPal/provider mutation is introduced");
