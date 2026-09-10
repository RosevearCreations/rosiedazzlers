import { requireStaffAccess, json, serviceHeaders } from "../_lib/staff-auth.js";

const TABLES = Object.freeze({
  contacts: "fleet_account_contacts",
  vehicles: "fleet_account_vehicles",
  groups: "fleet_request_groups",
  jobs: "fleet_request_jobs",
  history: "fleet_vehicle_service_history"
});

export async function onRequestGet(context) { return handleGet(context); }
export async function onRequestPost(context) { return handlePost(context); }
export async function onRequestOptions() { return new Response("", { status: 204, headers: corsHeaders() }); }

async function handleGet({ request, env }) {
  try {
    if (!hasSupabaseConfig(env)) return withCors(json({ ok: false, error: "Fleet operations service configuration is incomplete." }, 500));
    const query = Object.fromEntries(new URL(request.url).searchParams.entries());
    const access = await requireStaffAccess({ request, env, body: query, capability: "manage_bookings", allowLegacyAdminFallback: true });
    if (!access.ok) return withCors(access.response);

    const accountId = normalizeUuid(query.account_id);
    const accounts = await restList(env, "fleet_accounts", new URLSearchParams({
      select: "id,company_name,contact_name,contact_email,contact_phone,town,vehicle_count,contract_status,notes,created_at,updated_at",
      order: "company_name.asc",
      limit: "200"
    }));

    let operations = emptyOperations();
    if (accountId) {
      const exists = accounts.some((row) => row.id === accountId);
      if (!exists) return withCors(json({ ok: false, error: "Fleet account was not found." }, 404));
      operations = await loadAccountOperations(env, accountId);
    }

    return withCors(json({ ok: true, accounts, selected_account_id: accountId || null, operations, boundaries: operationBoundaries() }));
  } catch (err) {
    console.error("Fleet account operations load failed.", { message: err?.message || "Unknown error" });
    return withCors(json({ ok: false, error: "Could not load fleet account operations." }, 500));
  }
}

async function handlePost({ request, env }) {
  try {
    if (!hasSupabaseConfig(env)) return withCors(json({ ok: false, error: "Fleet operations service configuration is incomplete." }, 500));
    const body = await request.json().catch(() => ({}));
    const access = await requireStaffAccess({ request, env, body, capability: "manage_bookings", allowLegacyAdminFallback: true });
    if (!access.ok) return withCors(access.response);

    const action = normalizeToken(body.action, 60);
    const actorId = normalizeUuid(access.actor?.id || body.staff_user_id);
    let result;
    if (action === "create_account") result = await createAccount(env, body, actorId);
    else if (action === "add_contact") result = await addContact(env, body, actorId);
    else if (action === "add_vehicle") result = await addVehicle(env, body, actorId);
    else if (action === "create_request_group") result = await createRequestGroup(env, body, actorId);
    else if (action === "add_request_job") result = await addRequestJob(env, body, actorId);
    else if (action === "add_service_history") result = await addServiceHistory(env, body, actorId);
    else return withCors(json({ ok: false, error: "Unsupported fleet operations action." }, 400));

    return withCors(json({ ok: true, action, result, boundaries: operationBoundaries() }));
  } catch (err) {
    const status = Number(err?.status) || 500;
    console.error("Fleet account operations write failed.", { message: err?.message || "Unknown error" });
    return withCors(json({ ok: false, error: status < 500 ? err.message : "Could not save fleet account operation." }, status));
  }
}

async function createAccount(env, body) {
  const companyName = requiredText(body.company_name, "Company name", 180);
  const payload = {
    company_name: companyName,
    contact_name: cleanText(body.contact_name, 160),
    contact_email: cleanEmail(body.contact_email),
    contact_phone: cleanText(body.contact_phone, 80),
    town: cleanText(body.town, 120),
    notes: cleanText(body.notes, 2000),
    updated_at: new Date().toISOString()
  };
  return restInsert(env, "fleet_accounts", compact(payload));
}

async function addContact(env, body, actorId) {
  const accountId = await requireAccount(env, body.fleet_account_id);
  const payload = {
    fleet_account_id: accountId,
    contact_name: requiredText(body.contact_name, "Contact name", 160),
    contact_title: cleanText(body.contact_title, 160),
    email: cleanEmail(body.email),
    phone: cleanText(body.phone, 80),
    is_primary: body.is_primary === true,
    notes: cleanText(body.notes, 1200),
    created_by_staff_user_id: actorId,
    updated_by_staff_user_id: actorId
  };
  return restInsert(env, TABLES.contacts, compact(payload));
}

async function addVehicle(env, body, actorId) {
  const accountId = await requireAccount(env, body.fleet_account_id);
  const year = nullableYear(body.vehicle_year);
  const payload = {
    fleet_account_id: accountId,
    unit_reference: requiredText(body.unit_reference, "Unit/reference", 120),
    vehicle_year: year,
    make: cleanText(body.make, 120),
    model: cleanText(body.model, 120),
    body_style: cleanText(body.body_style, 120),
    plate_reference: cleanText(body.plate_reference, 80),
    active: body.active !== false,
    notes: cleanText(body.notes, 1200),
    created_by_staff_user_id: actorId,
    updated_by_staff_user_id: actorId
  };
  return restInsert(env, TABLES.vehicles, compact(payload));
}

async function createRequestGroup(env, body, actorId) {
  const accountId = await requireAccount(env, body.fleet_account_id);
  const startDate = cleanDate(body.requested_start_date);
  const endDate = cleanDate(body.requested_end_date);
  if (startDate && endDate && endDate < startDate) throw clientError("Requested end date cannot be before the start date.");
  const payload = {
    fleet_account_id: accountId,
    group_reference: requiredText(body.group_reference, "Group reference", 120),
    title: cleanText(body.title, 200),
    requested_start_date: startDate,
    requested_end_date: endDate,
    po_reference: cleanText(body.po_reference, 160),
    invoice_group_reference: cleanText(body.invoice_group_reference, 160),
    status: normalizeStatus(body.status, ["planning", "requested", "scheduled", "completed", "cancelled"], "planning"),
    notes: cleanText(body.notes, 1800),
    created_by_staff_user_id: actorId,
    updated_by_staff_user_id: actorId
  };
  return restInsert(env, TABLES.groups, compact(payload));
}

async function addRequestJob(env, body, actorId) {
  const accountId = await requireAccount(env, body.fleet_account_id);
  const groupId = normalizeUuid(body.request_group_id);
  const vehicleId = normalizeUuid(body.vehicle_id);
  if (!groupId || !vehicleId) throw clientError("A valid request group and fleet vehicle are required.");
  await requireOwnedRow(env, TABLES.groups, groupId, accountId, "Request group");
  await requireOwnedRow(env, TABLES.vehicles, vehicleId, accountId, "Fleet vehicle");
  const bookingId = normalizeUuid(body.booking_id);
  if (body.booking_id && !bookingId) throw clientError("Booking id must be a valid UUID when supplied.");
  const payload = {
    fleet_account_id: accountId,
    request_group_id: groupId,
    vehicle_id: vehicleId,
    booking_id: bookingId,
    service_request: requiredText(body.service_request, "Service request", 500),
    status: normalizeStatus(body.status, ["planning", "linked", "scheduled", "completed", "cancelled"], bookingId ? "linked" : "planning"),
    notes: cleanText(body.notes, 1800),
    created_by_staff_user_id: actorId,
    updated_by_staff_user_id: actorId
  };
  return restInsert(env, TABLES.jobs, compact(payload));
}

async function addServiceHistory(env, body, actorId) {
  const accountId = await requireAccount(env, body.fleet_account_id);
  const vehicleId = normalizeUuid(body.vehicle_id);
  if (!vehicleId) throw clientError("A valid fleet vehicle is required.");
  await requireOwnedRow(env, TABLES.vehicles, vehicleId, accountId, "Fleet vehicle");
  const bookingId = normalizeUuid(body.booking_id);
  const requestJobId = normalizeUuid(body.request_job_id);
  if (body.booking_id && !bookingId) throw clientError("Booking id must be a valid UUID when supplied.");
  if (body.request_job_id && !requestJobId) throw clientError("Request job id must be a valid UUID when supplied.");
  if (requestJobId) await requireOwnedRow(env, TABLES.jobs, requestJobId, accountId, "Fleet request job");
  const servicedAt = cleanTimestamp(body.serviced_at) || new Date().toISOString();
  const payload = {
    fleet_account_id: accountId,
    vehicle_id: vehicleId,
    booking_id: bookingId,
    request_job_id: requestJobId,
    serviced_at: servicedAt,
    service_summary: requiredText(body.service_summary, "Service summary", 500),
    notes: cleanText(body.notes, 1800),
    created_by_staff_user_id: actorId
  };
  return restInsert(env, TABLES.history, compact(payload));
}

async function loadAccountOperations(env, accountId) {
  const filters = new URLSearchParams({ fleet_account_id: `eq.${accountId}` });
  const [contacts, vehicles, groups, jobs, history] = await Promise.all([
    restList(env, TABLES.contacts, withParams(filters, { select: "*", order: "is_primary.desc,contact_name.asc", limit: "200" })),
    restList(env, TABLES.vehicles, withParams(filters, { select: "*", order: "active.desc,unit_reference.asc", limit: "500" })),
    restList(env, TABLES.groups, withParams(filters, { select: "*", order: "created_at.desc", limit: "300" })),
    restList(env, TABLES.jobs, withParams(filters, { select: "*", order: "created_at.desc", limit: "1000" })),
    restList(env, TABLES.history, withParams(filters, { select: "*", order: "serviced_at.desc", limit: "1000" }))
  ]);
  return { contacts, vehicles, request_groups: groups, request_jobs: jobs, service_history: history };
}

async function requireAccount(env, rawId) {
  const id = normalizeUuid(rawId);
  if (!id) throw clientError("A valid fleet account id is required.");
  await requireOwnedRow(env, "fleet_accounts", id, null, "Fleet account");
  return id;
}

async function requireOwnedRow(env, table, id, accountId, label) {
  const params = new URLSearchParams({ select: "id", id: `eq.${id}`, limit: "1" });
  if (accountId) params.set("fleet_account_id", `eq.${accountId}`);
  const rows = await restList(env, table, params);
  if (!rows[0]) throw clientError(`${label} was not found for this fleet account.`, 404);
  return rows[0];
}

async function restList(env, table, params) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/${table}?${params.toString()}`, { headers: serviceHeaders(env) });
  const text = await res.text();
  const data = safeJson(text);
  if (!res.ok) throw new Error(extractSupabaseError(data, text, `Could not load ${table}.`));
  return Array.isArray(data) ? data : [];
}

async function restInsert(env, table, payload) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: { ...serviceHeaders(env), Prefer: "return=representation" },
    body: JSON.stringify(payload)
  });
  const text = await res.text();
  const data = safeJson(text);
  if (!res.ok) {
    const message = extractSupabaseError(data, text, `Could not save ${table}.`);
    if (/duplicate key|unique constraint/i.test(message)) throw clientError("That fleet reference already exists for this account.", 409);
    throw new Error(message);
  }
  return Array.isArray(data) ? data[0] || null : data;
}

function operationBoundaries() {
  return {
    creates_booking: false,
    mutates_booking: false,
    creates_invoice: false,
    charges_customer: false,
    applies_fleet_pricing: false,
    enables_recurring_billing: false,
    mutates_payment_provider: false,
    invoice_group_reference_is_metadata_only: true,
    po_reference_is_metadata_only: true
  };
}
function emptyOperations() { return { contacts: [], vehicles: [], request_groups: [], request_jobs: [], service_history: [] }; }
function withParams(base, additions) { const p = new URLSearchParams(base); for (const [k, v] of Object.entries(additions)) p.set(k, v); return p; }
function compact(obj) { return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== null && v !== undefined && v !== "")); }
function normalizeUuid(value) { const s = String(value || "").trim(); return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s) ? s : ""; }
function normalizeToken(value, max = 80) { return String(value || "").trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "_").slice(0, max); }
function cleanText(value, max) { const s = String(value ?? "").trim(); return s ? s.slice(0, max) : null; }
function requiredText(value, label, max) { const s = cleanText(value, max); if (!s) throw clientError(`${label} is required.`); return s; }
function cleanEmail(value) { const s = cleanText(value, 254); if (!s) return null; if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) throw clientError("Email address is not valid."); return s.toLowerCase(); }
function nullableYear(value) { if (value === null || value === undefined || value === "") return null; const n = Number(value); if (!Number.isInteger(n) || n < 1900 || n > 2100) throw clientError("Vehicle year is not valid."); return n; }
function cleanDate(value) { const s = String(value || "").trim(); if (!s) return null; if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || Number.isNaN(Date.parse(`${s}T00:00:00Z`))) throw clientError("Date is not valid."); return s; }
function cleanTimestamp(value) { const s = String(value || "").trim(); if (!s) return null; const ms = Date.parse(s); if (Number.isNaN(ms)) throw clientError("Service date/time is not valid."); return new Date(ms).toISOString(); }
function normalizeStatus(value, allowed, fallback) { const s = normalizeToken(value); return allowed.includes(s) ? s : fallback; }
function clientError(message, status = 400) { const e = new Error(message); e.status = status; return e; }
function safeJson(text) { try { return JSON.parse(text); } catch { return null; } }
function extractSupabaseError(data, text, fallback) { return data?.message || (String(text || "").trim().slice(0, 300) || fallback); }
function hasSupabaseConfig(env) { return !!(env?.SUPABASE_URL && (env?.SUPABASE_SERVICE_ROLE_KEY || env?.SUPABASE_SERVICE_KEY || env?.SUPABASE_SERVICE_ROLE || env?.SUPABASE_SECRET_KEY)); }
function corsHeaders() { return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type, x-admin-password, x-staff-email, x-staff-user-id", "Cache-Control": "no-store" }; }
function withCors(response) { const headers = new Headers(response.headers || {}); for (const [key, value] of Object.entries(corsHeaders())) headers.set(key, value); return new Response(response.body, { status: response.status, statusText: response.statusText, headers }); }
