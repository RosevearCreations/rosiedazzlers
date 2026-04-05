// functions/api/admin/booking_save.js
//
// Role-aware booking create/update endpoint.
//
// What this file does:
// - prefers signed-in staff session access
// - requires manage_bookings capability
// - creates new bookings rows
// - updates existing bookings rows
// - supports structured assignment fields
// - preserves legacy assigned_to for compatibility
// - optionally links/creates a customer profile when enough customer data exists
//
// Supported request body:
// {
//   id?: "uuid",
//   customer_name: "Jane Doe",
//   customer_email?: "jane@example.com",
//   customer_phone?: "555-123-4567",
//   service_date: "2026-03-21",
//   start_slot: "morning",
//   package_code?: "interior-detail",
//   vehicle_size?: "suv",
//   status?: "pending",
//   job_status?: "scheduled",
//   assigned_staff_user_id?: "uuid",
//   assigned_staff_email?: "detailer@example.com",
//   assigned_to?: "Detailer Name",
//   progress_enabled?: false,
//   notes?: "Customer requests pet hair focus",
//   total_price?: 199.99,
//   deposit_amount?: 50
// }
//
// Request headers supported:
// - x-admin-password: transitional compatibility only when explicitly used
// - x-staff-email: recommended during transition
// - x-staff-user-id: optional alternative

import {
  requireStaffAccess,
  serviceHeaders,
  json,
  methodNotAllowed,
  cleanText,
  isUuid,
  toBoolean
} from "../_lib/staff-auth.js";

export async function onRequestOptions() {
  return new Response("", {
    status: 204,
    headers: corsHeaders()
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json().catch(() => ({}));

    const access = await requireStaffAccess({
      request,
      env,
      body,
      capability: "manage_bookings",
      allowLegacyAdminFallback: false
    });

    if (!access.ok) {
      return withCors(access.response);
    }

    const headers = serviceHeaders(env);
    const normalized = normalizeBookingPayload(body);

    if (!normalized.ok) {
      return withCors(json({ error: normalized.error }, 400));
    }

    const payload = normalized.payload;

    const resolvedAssignment = await resolveAssignment(env, headers, {
      assigned_staff_user_id: payload.assigned_staff_user_id,
      assigned_staff_email: payload.assigned_staff_email,
      assigned_to: payload.assigned_to
    });

    if (!resolvedAssignment.ok) {
      return withCors(resolvedAssignment.response);
    }

    const customerProfileId = await upsertCustomerProfileIfPossible(env, headers, payload);

    if (payload.id) {
      const existing = await findBookingById(env, headers, payload.id);
      if (!existing.ok) {
        return withCors(existing.response);
      }

      const patch = {
        customer_name: payload.customer_name,
        customer_email: payload.customer_email,
        customer_phone: payload.customer_phone,
        service_date: payload.service_date,
        start_slot: payload.start_slot,
        package_code: payload.package_code,
        vehicle_size: payload.vehicle_size,
        status: payload.status,
        job_status: payload.job_status,
        assigned_to: resolvedAssignment.assigned_to,
        assigned_staff_user_id: resolvedAssignment.assigned_staff_user_id,
        assigned_staff_email: resolvedAssignment.assigned_staff_email,
        assigned_staff_name: resolvedAssignment.assigned_staff_name,
        progress_enabled: payload.progress_enabled,
        notes: payload.notes,
        total_price: payload.total_price,
        deposit_amount: payload.deposit_amount,
        customer_profile_id: customerProfileId
      };

      const res = await fetch(
        `${env.SUPABASE_URL}/rest/v1/bookings?id=eq.${encodeURIComponent(payload.id)}`,
        {
          method: "PATCH",
          headers: {
            ...headers,
            Prefer: "return=representation"
          },
          body: JSON.stringify(patch)
        }
      );

      if (!res.ok) {
        const text = await res.text();
        return withCors(json({ error: `Could not update booking. ${text}` }, 500));
      }

      const rows = await res.json().catch(() => []);
      return withCors(
        json({
          ok: true,
          mode: "update",
          message: "Booking updated.",
          booking: Array.isArray(rows) ? rows[0] || null : null
        })
      );
    }

    const createPayload = {
      customer_name: payload.customer_name,
      customer_email: payload.customer_email,
      customer_phone: payload.customer_phone,
      service_date: payload.service_date,
      start_slot: payload.start_slot,
      package_code: payload.package_code,
      vehicle_size: payload.vehicle_size,
      status: payload.status,
      job_status: payload.job_status,
      assigned_to: resolvedAssignment.assigned_to,
      assigned_staff_user_id: resolvedAssignment.assigned_staff_user_id,
      assigned_staff_email: resolvedAssignment.assigned_staff_email,
      assigned_staff_name: resolvedAssignment.assigned_staff_name,
      progress_enabled: payload.progress_enabled,
      notes: payload.notes,
      total_price: payload.total_price,
      deposit_amount: payload.deposit_amount,
      customer_profile_id: customerProfileId
    };

    if (payload.progress_enabled) {
      createPayload.progress_token = crypto.randomUUID();
    }

    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/bookings`, {
      method: "POST",
      headers: {
        ...headers,
        Prefer: "return=representation"
      },
      body: JSON.stringify([createPayload])
    });

    if (!res.ok) {
      const text = await res.text();
      return withCors(json({ error: `Could not create booking. ${text}` }, 500));
    }

    const rows = await res.json().catch(() => []);
    return withCors(
      json({
        ok: true,
        mode: "create",
        message: "Booking created.",
        booking: Array.isArray(rows) ? rows[0] || null : null
      })
    );
  } catch (err) {
    return withCors(
      json(
        { error: err && err.message ? err.message : "Unexpected server error." },
        500
      )
    );
  }
}

export async function onRequestGet() {
  return withCors(methodNotAllowed());
}

/* ---------------- booking helpers ---------------- */

function normalizeBookingPayload(body) {
  const id = cleanText(body.id);
  const customer_name = cleanText(body.customer_name);
  const customer_email = cleanEmail(body.customer_email);
  const customer_phone = cleanPhone(body.customer_phone);
  const service_date = cleanDate(body.service_date);
  const start_slot = cleanSlotCode(body.start_slot);
  const package_code = cleanCode(body.package_code);
  const vehicle_size = cleanCode(body.vehicle_size);
  const status = cleanCode(body.status) || "pending";
  const job_status = cleanCode(body.job_status) || "scheduled";
  const assigned_staff_user_id = cleanText(body.assigned_staff_user_id);
  const assigned_staff_email = cleanEmail(body.assigned_staff_email);
  const assigned_to = cleanText(body.assigned_to);
  const progress_enabled =
    body.progress_enabled === undefined ? false : toBoolean(body.progress_enabled);
  const notes = cleanText(body.notes);
  const total_price = cleanMoney(body.total_price);
  const deposit_amount = cleanMoney(body.deposit_amount);

  if (id && !isUuid(id)) {
    return { ok: false, error: "Invalid booking id." };
  }

  if (!customer_name) {
    return { ok: false, error: "customer_name is required." };
  }

  if (body.customer_email && !customer_email) {
    return { ok: false, error: "Invalid customer_email." };
  }

  if (body.customer_phone && !customer_phone) {
    return { ok: false, error: "Invalid customer_phone." };
  }

  if (!service_date) {
    return { ok: false, error: "Valid service_date is required." };
  }

  if (!start_slot) {
    return { ok: false, error: "Valid start_slot is required." };
  }

  if (assigned_staff_user_id && !isUuid(assigned_staff_user_id)) {
    return { ok: false, error: "Invalid assigned_staff_user_id." };
  }

  if (body.assigned_staff_email && !assigned_staff_email) {
    return { ok: false, error: "Invalid assigned_staff_email." };
  }

  if (body.total_price !== undefined && total_price === null) {
    return { ok: false, error: "Invalid total_price." };
  }

  if (body.deposit_amount !== undefined && deposit_amount === null) {
    return { ok: false, error: "Invalid deposit_amount." };
  }

  if (total_price !== null && total_price < 0) {
    return { ok: false, error: "total_price cannot be negative." };
  }

  if (deposit_amount !== null && deposit_amount < 0) {
    return { ok: false, error: "deposit_amount cannot be negative." };
  }

  return {
    ok: true,
    payload: {
      id: id || null,
      customer_name,
      customer_email,
      customer_phone,
      service_date,
      start_slot,
      package_code,
      vehicle_size,
      status,
      job_status,
      assigned_staff_user_id: assigned_staff_user_id || null,
      assigned_staff_email,
      assigned_to,
      progress_enabled,
      notes,
      total_price,
      deposit_amount
    }
  };
}

async function findBookingById(env, headers, id) {
  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/bookings` +
      `?select=id` +
      `&id=eq.${encodeURIComponent(id)}` +
      `&limit=1`,
    { headers }
  );

  if (!res.ok) {
    const text = await res.text();
    return {
      ok: false,
      response: json({ error: `Could not verify booking. ${text}` }, 500)
    };
  }

  const rows = await res.json().catch(() => []);
  const row = Array.isArray(rows) ? rows[0] || null : null;

  if (!row) {
    return {
      ok: false,
      response: json({ error: "Booking not found." }, 404)
    };
  }

  return { ok: true, row };
}

/* ---------------- assignment helpers ---------------- */

async function resolveAssignment(env, headers, assignment) {
  const byId = assignment.assigned_staff_user_id;
  const byEmail = assignment.assigned_staff_email;
  const byName = assignment.assigned_to;

  if (!byId && !byEmail && !byName) {
    return {
      ok: true,
      assigned_to: null,
      assigned_staff_user_id: null,
      assigned_staff_email: null,
      assigned_staff_name: null
    };
  }

  if (byId) {
    const row = await findStaffUserById(env, headers, byId);
    if (!row) {
      return {
        ok: false,
        response: json({ error: "Assigned staff user not found or inactive." }, 404)
      };
    }

    return {
      ok: true,
      assigned_to: row.full_name || null,
      assigned_staff_user_id: row.id || null,
      assigned_staff_email: row.email || null,
      assigned_staff_name: row.full_name || null
    };
  }

  if (byEmail) {
    const row = await findStaffUserByEmail(env, headers, byEmail);
    if (!row) {
      return {
        ok: false,
        response: json({ error: "Assigned staff user not found or inactive." }, 404)
      };
    }

    return {
      ok: true,
      assigned_to: row.full_name || null,
      assigned_staff_user_id: row.id || null,
      assigned_staff_email: row.email || null,
      assigned_staff_name: row.full_name || null
    };
  }

  return {
    ok: true,
    assigned_to: byName || null,
    assigned_staff_user_id: null,
    assigned_staff_email: null,
    assigned_staff_name: byName || null
  };
}

async function findStaffUserById(env, headers, id) {
  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/staff_users` +
      `?select=id,full_name,email,is_active` +
      `&id=eq.${encodeURIComponent(id)}` +
      `&is_active=eq.true` +
      `&limit=1`,
    { headers }
  );
  if (!res.ok) return null;
  const rows = await res.json().catch(() => []);
  return Array.isArray(rows) ? rows[0] || null : null;
}

async function findStaffUserByEmail(env, headers, email) {
  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/staff_users` +
      `?select=id,full_name,email,is_active` +
      `&email=eq.${encodeURIComponent(email)}` +
      `&is_active=eq.true` +
      `&limit=1`,
    { headers }
  );
  if (!res.ok) return null;
  const rows = await res.json().catch(() => []);
  return Array.isArray(rows) ? rows[0] || null : null;
}

/* ---------------- customer profile helpers ---------------- */

async function upsertCustomerProfileIfPossible(env, headers, payload) {
  const hasCustomerIdentity = payload.customer_email || payload.customer_phone;
  if (!hasCustomerIdentity) return null;

  const existing = await findCustomerProfile(env, headers, {
    customer_email: payload.customer_email,
    customer_phone: payload.customer_phone
  });

  if (existing) {
    await fetch(
      `${env.SUPABASE_URL}/rest/v1/customer_profiles?id=eq.${encodeURIComponent(existing.id)}`,
      {
        method: "PATCH",
        headers: {
          ...headers,
          Prefer: "return=minimal"
        },
        body: JSON.stringify({
          customer_name: payload.customer_name,
          customer_email: payload.customer_email,
          customer_phone: payload.customer_phone
        })
      }
    ).catch(() => null);

    return existing.id || null;
  }

  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/customer_profiles`, {
    method: "POST",
    headers: {
      ...headers,
      Prefer: "return=representation"
    },
    body: JSON.stringify([
      {
        customer_name: payload.customer_name,
        customer_email: payload.customer_email,
        customer_phone: payload.customer_phone
      }
    ])
  }).catch(() => null);

  if (!res || !res.ok) return null;

  const rows = await res.json().catch(() => []);
  const row = Array.isArray(rows) ? rows[0] || null : null;
  return row ? row.id || null : null;
}

async function findCustomerProfile(env, headers, customer) {
  const clauses = [];
  if (customer.customer_email) {
    clauses.push(`customer_email.eq.${encodeURIComponent(customer.customer_email)}`);
  }
  if (customer.customer_phone) {
    clauses.push(`customer_phone.eq.${encodeURIComponent(customer.customer_phone)}`);
  }
  if (!clauses.length) return null;

  const url =
    `${env.SUPABASE_URL}/rest/v1/customer_profiles` +
    `?select=id,customer_name,customer_email,customer_phone` +
    `&or=(${clauses.join(",")})` +
    `&limit=1`;

  const res = await fetch(url, { headers }).catch(() => null);
  if (!res || !res.ok) return null;

  const rows = await res.json().catch(() => []);
  return Array.isArray(rows) ? rows[0] || null : null;
}

/* ---------------- field cleaners ---------------- */

function cleanEmail(value) {
  const s = String(value || "").trim().toLowerCase();
  if (!s) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) ? s : null;
}

function cleanPhone(value) {
  const s = String(value || "").trim();
  if (!s) return null;
  const digits = s.replace(/[^\d+]/g, "");
  return digits.length >= 7 && digits.length <= 20 ? s : null;
}

function cleanDate(value) {
  const s = cleanText(value);
  if (!s) return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
}

function cleanSlotCode(value) {
  const s = cleanText(value);
  if (!s) return null;
  return /^[a-z0-9_-]{1,50}$/i.test(s) ? s : null;
}

function cleanCode(value) {
  const s = cleanText(value);
  if (!s) return null;
  return /^[a-z0-9 _-]{1,100}$/i.test(s) ? s : null;
}

function cleanMoney(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? Number(n.toFixed(2)) : null;
}

/* ---------------- shared helpers ---------------- */

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, x-admin-password, x-staff-email, x-staff-user-id",
    "Cache-Control": "no-store"
  };
}

function withCors(response) {
  const headers = new Headers(response.headers || {});
  const extras = corsHeaders();

  for (const [key, value] of Object.entries(extras)) {
    headers.set(key, value);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
