// Build 272 - central action gate for remaining customer, quote, refund, and settlement mutations.
// This middleware intentionally leaves reads and unrelated admin endpoints unchanged.
import { requireStaffAccess } from "../_lib/staff-auth.js";
import { requireActionAccess } from "../_lib/action-permissions.js";

const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const ACTION_BY_LEAF = Object.freeze({
  customer_profiles_save: "operations.customer.manage",
  customer_tiers_save: "operations.customer.manage",
  customer_tiers_delete: "operations.customer.manage",
  customers_save: "operations.customer.manage",
  customers_delete: "operations.customer.manage",

  quote_pipeline_save: "operations.quote.manage",
  quote_proposal_drafts_save: "operations.quote.manage",
  quote_proposal_deliver: "operations.quote.manage",
  quote_deposit_request_create: "operations.quote.manage",
  final_balance_request_create: "operations.quote.manage",
  final_balance_request_manage: "operations.quote.manage",

  quote_deposit_request_mark_paid: "finance.settlement.manage",
  quote_deposit_refund_initiate: "finance.refund.manage",
  quote_deposit_refund_save: "finance.refund.manage",
  accounting_payable_settle: "finance.settlement.manage"
});

export async function onRequest(context) {
  const { request, env } = context;
  if (!WRITE_METHODS.has(String(request.method || "").toUpperCase())) return context.next();

  const pathname = new URL(request.url).pathname;
  const prefix = "/api/admin/";
  if (!pathname.startsWith(prefix)) return context.next();
  const leaf = pathname.slice(prefix.length).replace(/\/+$/, "");
  const requiredAction = ACTION_BY_LEAF[leaf];
  if (!requiredAction) return context.next();

  let body = {};
  if (request.method !== "DELETE") {
    try { body = await request.clone().json(); } catch { body = {}; }
  }

  const access = await requireStaffAccess({
    request,
    env,
    body,
    capability: null,
    allowLegacyAdminFallback: true
  });
  if (!access.ok) return access.response;

  const actionAccess = requireActionAccess(access.actor, requiredAction);
  if (!actionAccess.ok) return actionAccess.response;

  return context.next();
}
