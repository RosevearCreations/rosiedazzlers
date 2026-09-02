// Build 305 — central admin action gate.
// Build 272 Operations mappings are retained; Build 305 adds method-aware Finance coverage.
import { requireStaffAccess } from "../_lib/staff-auth.js";
import { requireActionAccess } from "../_lib/action-permissions.js";
import { financeActionFor } from "../_lib/admin-finance-actions.js";

const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const OPERATIONS_ACTION_BY_LEAF = Object.freeze({
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
  final_balance_request_manage: "operations.quote.manage"
});

export async function onRequest(context) {
  const { request, env } = context;
  const method = String(request.method || "GET").toUpperCase();
  if (method === "OPTIONS") return context.next();

  const pathname = new URL(request.url).pathname;
  const prefix = "/api/admin/";
  if (!pathname.startsWith(prefix)) return context.next();
  const leaf = pathname.slice(prefix.length).replace(/\/+$/, "");

  const requiredAction = financeActionFor(leaf, method)
    || (WRITE_METHODS.has(method) ? OPERATIONS_ACTION_BY_LEAF[leaf] : null);
  if (!requiredAction) return context.next();

  let body = {};
  if (WRITE_METHODS.has(method) && method !== "DELETE") {
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
