import { requireStaffAccess, json, serviceHeaders, methodNotAllowed, isUuid } from "../_lib/staff-auth.js";
import { buildInventoryJobCostOperationalEvidence } from "../_lib/inventory-job-cost-operational-evidence.js";

export async function onRequestGet({ request, env }) {
  try {
    const query = Object.fromEntries(new URL(request.url).searchParams.entries());
    const bookingId = String(query.booking_id || "").trim();
    const access = await requireStaffAccess({
      request,
      env,
      body: query,
      capability: "manage_bookings",
      bookingId: bookingId || null,
      allowLegacyAdminFallback: true
    });
    if (!access.ok) return withCors(access.response);
    if (!bookingId || !isUuid(bookingId)) {
      return withCors(json({ ok: false, error: "A valid booking_id is required." }, 400));
    }
    if (!hasSupabaseConfig(env)) {
      return withCors(json({
        ok: false,
        error: "Inventory/job-cost operational evidence configuration is incomplete.",
        evidence_status: "unavailable"
      }, 503));
    }

    const [movements, items, purchaseOrders] = await Promise.all([
      fetchBookingMovements(env, bookingId),
      fetchInventoryItems(env),
      fetchActivePurchaseOrders(env)
    ]);

    const evidence = buildInventoryJobCostOperationalEvidence({
      booking_id: bookingId,
      movements,
      items,
      purchase_orders: purchaseOrders
    });

    return withCors(json({
      ok: true,
      inventory_job_cost_operational_evidence: evidence,
      source_authorities: {
        inventory_movements: "catalog_inventory_movements",
        inventory_items: "catalog_inventory_items",
        reorder_orders: "catalog_purchase_orders",
        legacy_read_model: "/api/admin/operations_job_cost_evidence",
        stock_mutation: "/api/admin/catalog_stock_action",
        reorder_mutation: "/api/admin/catalog_reorder_request"
      },
      acceptance_boundaries: {
        read_only: true,
        explicit_job_use_only: true,
        inferred_consumption: false,
        inferred_purchasing: false,
        inferred_accounting_posting: false,
        mutation_authority: false,
        schema_authority: false
      }
    }));
  } catch (err) {
    console.error("Inventory/job-cost operational evidence failed.", {
      message: err?.message || "Unknown error"
    });
    return withCors(json({
      ok: false,
      error: "Could not load inventory/job-cost operational evidence.",
      evidence_status: "unavailable"
    }, 500));
  }
}

export async function onRequestPost() {
  return withCors(methodNotAllowed(["GET", "OPTIONS"]));
}

export async function onRequestPatch() {
  return withCors(methodNotAllowed(["GET", "OPTIONS"]));
}

export async function onRequestDelete() {
  return withCors(methodNotAllowed(["GET", "OPTIONS"]));
}

export async function onRequestOptions() {
  return new Response("", { status: 204, headers: corsHeaders() });
}

async function fetchBookingMovements(env, bookingId) {
  const params = new URLSearchParams({
    select: "*",
    booking_id: `eq.${bookingId}`,
    order: "created_at.asc",
    limit: "1000"
  });
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/catalog_inventory_movements?${params.toString()}`, {
    headers: serviceHeaders(env)
  });
  if (!res.ok) throw new Error(`inventory_job_cost_movement_read_failed_${res.status}`);
  const rows = await res.json().catch(() => []);
  return Array.isArray(rows) ? rows : [];
}

async function fetchInventoryItems(env) {
  const params = new URLSearchParams({
    select: "id,item_key,name,qty_on_hand,unit_label,cost_cents,item_type,reuse_policy,reorder_point,reorder_qty,preferred_vendor",
    limit: "2000"
  });
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/catalog_inventory_items?${params.toString()}`, {
    headers: serviceHeaders(env)
  });
  if (!res.ok) throw new Error(`inventory_job_cost_inventory_read_failed_${res.status}`);
  const rows = await res.json().catch(() => []);
  return Array.isArray(rows) ? rows : [];
}

async function fetchActivePurchaseOrders(env) {
  const params = new URLSearchParams({
    select: "*",
    status: "in.(draft,requested,ordered)",
    limit: "1000"
  });
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/catalog_purchase_orders?${params.toString()}`, {
    headers: serviceHeaders(env)
  });
  if (!res.ok) throw new Error(`inventory_job_cost_purchase_order_read_failed_${res.status}`);
  const rows = await res.json().catch(() => []);
  return Array.isArray(rows) ? rows : [];
}

function hasSupabaseConfig(env) {
  return !!(env?.SUPABASE_URL && (
    env?.SUPABASE_SERVICE_ROLE_KEY ||
    env?.SUPABASE_SERVICE_KEY ||
    env?.SUPABASE_SERVICE_ROLE ||
    env?.SUPABASE_SECRET_KEY
  ));
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-admin-password, x-staff-email, x-staff-user-id",
    "Cache-Control": "no-store"
  };
}

function withCors(response) {
  const headers = new Headers(response.headers || {});
  for (const [key, value] of Object.entries(corsHeaders())) headers.set(key, value);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
