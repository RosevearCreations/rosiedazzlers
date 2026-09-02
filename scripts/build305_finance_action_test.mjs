import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { financeActionFor, isFinanceAdminLeaf, BUILD305_FINANCE_ACTIONS } from "../functions/api/_lib/admin-finance-actions.js";
import { hasActionAccess } from "../functions/api/_lib/action-permissions.js";

const here = dirname(fileURLToPath(import.meta.url));
const adminDir = join(here, "..", "functions", "api", "admin");
const financeFiles = readdirSync(adminDir).filter((name) => /^(?:accounting_|payment_|payroll_).+\.js$/.test(name));
assert.ok(financeFiles.length >= 40, `expected current Finance surface, found ${financeFiles.length}`);

let exportedFinanceMethods = 0;
for (const filename of financeFiles) {
  const leaf = filename.replace(/\.js$/, "");
  assert.equal(isFinanceAdminLeaf(leaf), true, `${leaf} must be recognized as Finance`);
  const source = readFileSync(join(adminDir, filename), "utf8");
  const methods = [...source.matchAll(/export\s+async\s+function\s+onRequest(Get|Post|Put|Patch|Delete)\b/g)].map((match) => match[1].toUpperCase());
  for (const method of methods) {
    exportedFinanceMethods += 1;
    assert.ok(financeActionFor(leaf, method), `${method} ${leaf} must resolve to a Finance action`);
  }
}
assert.ok(exportedFinanceMethods >= financeFiles.length, "Finance files should expose protected request methods");

const cases = [
  ["accounting_accounts_list", "GET", "finance.view"],
  ["accounting_entry_save", "POST", "finance.post"],
  ["accounting_bank_reconciliation", "POST", "finance.reconcile"],
  ["accounting_payroll_payout_reconciliation", "POST", "finance.reconcile"],
  ["accounting_period_close", "POST", "finance.period.close"],
  ["accounting_month_end_checklist", "POST", "finance.period.close"],
  ["month_end_close_checklist", "POST", "finance.period.close"],
  ["accounting_remittance_post", "POST", "finance.tax.manage"],
  ["accounting_tax_support", "POST", "finance.tax.manage"],
  ["accounting_t2125_workpaper", "POST", "finance.tax.manage"],
  ["quote_deposit_refund_initiate", "POST", "finance.refund.manage"],
  ["quote_deposit_refund_save", "POST", "finance.refund.manage"],
  ["payment_refund_status_poll", "POST", "finance.refund.manage"],
  ["payment_refund_retry_scan", "POST", "finance.refund.manage"],
  ["accounting_payable_settle", "POST", "finance.settlement.manage"],
  ["quote_deposit_request_mark_paid", "POST", "finance.settlement.manage"],
  ["final_balance_checkout_create", "POST", "finance.settlement.manage"],
  ["payment_webhook_event_replay", "POST", "finance.settlement.manage"],
  ["payment_receipt_resend", "POST", "finance.settlement.manage"],
  ["payment_processor_fee_save", "POST", "finance.post"],
  ["payroll_run_save", "POST", "finance.post"],
  ["payment_webhook_events_list", "GET", "finance.view"],
  ["quote_deposit_refunds_list", "GET", "finance.view"]
];
for (const [leaf, method, expected] of cases) {
  assert.equal(financeActionFor(leaf, method), expected, `${method} ${leaf}`);
}

assert.equal(financeActionFor("accounting_future_write", "PATCH"), "finance.post");
assert.equal(financeActionFor("payment_future_read", "GET"), "finance.view");
assert.equal(financeActionFor("accounting_entry_save", "OPTIONS"), null);
assert.equal(financeActionFor("quote_deposit_request_create", "POST"), null, "Operations-owned quote request must stay outside Finance resolver");
assert.equal(financeActionFor("final_balance_request_manage", "POST"), null, "Operations-owned final-balance request lifecycle must stay outside Finance resolver");
assert.equal(financeActionFor("booking_finance", "POST"), null, "booking-scoped operational finance notes retain work_booking authority");
assert.equal(isFinanceAdminLeaf("accounting_owner_report"), true);
assert.equal(isFinanceAdminLeaf("payment_accountant_export_full"), true);
assert.equal(isFinanceAdminLeaf("payroll_summary"), true);
assert.equal(isFinanceAdminLeaf("customers_list"), false);

const accountant = { role_code: "accountant", permissions_profile: {}, module_access: { finance: true } };
for (const action of BUILD305_FINANCE_ACTIONS) assert.equal(hasActionAccess(accountant, action), true, `accountant default ${action}`);

const narrowed = {
  role_code: "accountant",
  module_access: { finance: true },
  permissions_profile: { action_access: { "finance.post": false, "finance.refund.manage": false } }
};
assert.equal(hasActionAccess(narrowed, "finance.view"), true);
assert.equal(hasActionAccess(narrowed, "finance.post"), false);
assert.equal(hasActionAccess(narrowed, "finance.refund.manage"), false);
assert.equal(hasActionAccess({ role_code: "operations_manager", module_access: { finance: true } }, "finance.view"), false, "role ceiling blocks cross-module escalation");
assert.equal(hasActionAccess({ role_code: "accountant", module_access: { finance: false } }, "finance.view"), false, "module disable wins");
assert.equal(hasActionAccess({ role_code: "admin", module_access: {} }, "finance.tax.manage"), true, "admin retains full authority");

console.log("Build 305 Finance action matrix: PASS");
console.log(`- ${financeFiles.length} current accounting/payment/payroll files and ${exportedFinanceMethods} exported methods scanned`);
console.log(`- ${cases.length} representative route/method mappings verified`);
console.log("- role ceiling, module disable and per-action narrowing fail closed");
console.log("- Operations-owned quote/final-balance request lifecycle remains unchanged");
