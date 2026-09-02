// Build 305 — canonical method-aware Finance action resolver for /api/admin routes.
// Keep Finance action names aligned with action-permissions.js; do not create route-local permission vocabularies.

const READ_METHODS = new Set(["GET", "HEAD"]);
const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const EXPLICIT_FINANCE_LEAVES = new Set([
  "month_end_close_checklist",
  "quote_deposit_refund_initiate",
  "quote_deposit_refund_save",
  "quote_deposit_refunds_list",
  "quote_deposit_request_mark_paid",
  "final_balance_checkout_create"
]);

const SETTLEMENT_LEAVES = new Set([
  "accounting_payable_settle",
  "quote_deposit_request_mark_paid",
  "final_balance_checkout_create",
  "payment_receipt_resend",
  "payment_receipt_retry_queue",
  "payment_webhook_event_replay"
]);

export function isFinanceAdminLeaf(leaf) {
  const name = String(leaf || "").trim();
  return /^(?:accounting_|payment_|payroll_)/.test(name) || EXPLICIT_FINANCE_LEAVES.has(name);
}

export function financeActionFor(leaf, method) {
  const name = String(leaf || "").trim();
  const verb = String(method || "GET").toUpperCase();
  if (!isFinanceAdminLeaf(name) || verb === "OPTIONS") return null;
  if (READ_METHODS.has(verb)) return "finance.view";
  if (!WRITE_METHODS.has(verb)) return null;

  if (name.includes("refund")) return "finance.refund.manage";
  if (name.includes("reconcile") || name.includes("reconciliation")) return "finance.reconcile";
  if (
    name === "accounting_period_close" ||
    name === "accounting_month_end_checklist" ||
    name === "month_end_close_checklist"
  ) return "finance.period.close";
  if (
    name === "accounting_remittance_post" ||
    name.includes("tax") ||
    name.includes("t2125")
  ) return "finance.tax.manage";
  if (SETTLEMENT_LEAVES.has(name)) return "finance.settlement.manage";

  return "finance.post";
}

export const BUILD305_FINANCE_ACTIONS = Object.freeze([
  "finance.view",
  "finance.post",
  "finance.reconcile",
  "finance.period.close",
  "finance.refund.manage",
  "finance.settlement.manage",
  "finance.tax.manage"
]);
