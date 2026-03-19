// functions/api/admin/customers_detail.js
//
// Role-aware customer detail endpoint.
//
// What this file does:
// - keeps current ADMIN_PASSWORD bridge protection
// - requires manage_bookings capability
// - loads one customer_profile in full
// - returns related bookings for that customer
// - supports lookup by customer_profile id
//
// Supported request body:
// {
//   customer_profile_id: "uuid"
// }
//
// Request headers supported:
// - x-admin-password: required
// - x-staff-email: recommended during transition
// - x-staff-user-id: optional alternative

import {
  requireStaffAccess,
  serviceHeaders,
  json,
  methodNotAllowed,
  isUuid
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
    const customer_profile_id = String(body.customer_profile_id || "").trim();

    if (!customer_profile_id) {
      return withCors(json({ error: "Missing customer_profile_id." }, 400));
    }

    if (!isUuid(customer_profile_id)) {
      return withCors(json({ error: "Invalid customer_profile_id." }, 400));
    }

    const access = await requireStaffAccess({
      request,
      env,
      body,
      capability: "manage_bookings",
      allowLegacyAdminFallback: true
    });

    if (!access.ok) {
      return withCors(access.response);
    }

    const headers = serviceHeaders(env);

    const profileRes = await fetch(
      `${env.SUPABASE_URL}/rest/v1/customer_profiles` +
        `?select=id,created_at,updated_at,customer_name,customer_email,customer_phone,tier_code,notes` +
        `&id=eq.${encodeURIComponent(customer_profile_id)}` +
        `&limit=1`,
      { headers }
    );

    if (!profileRes.ok) {
      const text = await profileRes.text();
      return withCors(json({ error: `Could not load customer profile. ${text}` }, 500));
    }

    const profileRows = await profileRes.json().catch(() => []);
    const profile = Array.isArray(profileRows) ? profileRows[0] || null : null;

    if (!profile) {
      return withCors(json({ error: "Customer profile not found." }, 404));
    }

    const tierCode = profile.tier_code ? String(profile.tier_code) : null;
    const email = profile.customer_email ? String(profile.customer_email).trim().toLowerCase() : null;
    const phone = profile.customer_phone ? String(profile.customer_phone).trim() : null;

    const [tierRes, bookingsRes] = await Promise.all([
      tierCode
        ? fetch(
            `${env.SUPABASE_URL}/rest/v1/customer_tiers` +
              `?select=code,sort_order,label,description,is_active` +
              `&code=eq.${encodeURIComponent(tierCode)}` +
              `&limit=1`,
            { headers }
          )
        : Promise.resolve(null),
      fetch(buildBookingsUrl(env, { email, phone }), { headers })
    ]);

    if (tierRes && !tierRes.ok) {
      const text = await tierRes.text();
      return withCors(json({ error: `Could not load customer tier. ${text}` }, 500));
    }

    if (!bookingsRes.ok) {
      const text = await bookingsRes.text();
      return withCors(json({ error: `Could not load related bookings. ${text}` }, 500));
    }

    const tierRows = tierRes ? await tierRes.json().catch(() => []) : [];
    const bookingRows = await bookingsRes.json().catch(() => []);

    const tier = Array.isArray(tierRows) ? tierRows[0] || null : null;
    const bookings = Array.isArray(bookingRows) ? bookingRows : [];
    const summary = summarizeBookings(bookings);

    return withCors(
      json({
        ok: true,
        actor: {
          id: access.actor.id || null,
          full_name: access.actor.full_name || null,
          email: access.actor.email || null,
          role_code: access.actor.role_code || null
        },
        customer_profile: {
          id: profile.id,
          created_at: profile.created_at || null,
          updated_at: profile.updated_at || null,
          customer_name: profile.customer_name || null,
          customer_email: profile.customer_email || null,
          customer_phone: profile.customer_phone || null,
          tier_code: profile.tier_code || null,
          notes: profile.notes || null
        },
        customer_tier: tier
          ? {
              code: tier.code || null,
              sort_order: tier.sort_order == null ? 0 : Number(tier.sort_order),
              label: tier.label || null,
              description: tier.description || null,
              is_active: tier.is_active === true
            }
          : null,
        booking_summary: summary,
        bookings: bookings.map((row) => ({
          id: row.id,
          created_at: row.created_at || null,
          updated_at: row.updated_at || null,
          service_date: row.service_date || null,
          start_slot: row.start_slot || null,
          status: row.status || null,
          job_status: row.job_status || null,
          package_code: row.package_code || null,
          vehicle_size: row.vehicle_size || null,
          total_price: row.total_price == null ? null : Number(row.total_price),
          deposit_amount: row.deposit_amount == null ? null : Number(row.deposit_amount),
          assigned_to: row.assigned_to || null,
          assigned_staff_user_id: row.assigned_staff_user_id || null,
          assigned_staff_email: row.assigned_staff_email || null,
          assigned_staff_name: row.assigned_staff_name || null,
          progress_enabled: row.progress_enabled === true
        }))
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

/* ---------------- helpers ---------------- */

function buildBookingsUrl(env, { email, phone }) {
  let url =
    `${env.SUPABASE_URL}/rest/v1/bookings` +
    `?select=id,created_at,updated_at,service_date,start_slot,status,job_status,package_code,vehicle_size,total_price,deposit_amount,assigned_to,assigned_staff_user_id,assigned_staff_email,assigned_staff_name,progress_enabled,customer_email,customer_phone` +
    `&order=service_date.desc,created_at.desc`;

  const orParts = [];
  if (email) {
    orParts.push(`customer_email.eq.${encodeURIComponent(email)}`);
  }
  if (phone) {
    orParts.push(`customer_phone.eq.${encodeURIComponent(phone)}`);
  }

  if (!orParts.length) {
    url += `&id=eq.__no_match__`;
  } else {
    url += `&or=(${orParts.join(",")})`;
  }

  return url;
}

function summarizeBookings(bookings) {
  const out = {
    booking_count: 0,
    completed_count: 0,
    cancelled_count: 0,
    active_count: 0,
    total_estimated_value: 0,
    total_deposits: 0,
    last_booking_at: null
  };

  for (const row of bookings) {
    out.booking_count += 1;

    const status = String(row.status || "").trim().toLowerCase();
    const jobStatus = String(row.job_status || "").trim().toLowerCase();

    if (status === "cancelled" || jobStatus === "cancelled") {
      out.cancelled_count += 1;
    } else {
      out.active_count += 1;
    }

    if (status === "completed" || jobStatus === "completed") {
      out.completed_count += 1;
    }

    out.total_estimated_value += Number(row.total_price || 0);
    out.total_deposits += Number(row.deposit_amount || 0);

    const currentLast = out.last_booking_at ? Date.parse(out.last_booking_at) : 0;
    const rowTime = Date.parse(row.service_date || row.created_at || 0);
    if (!out.last_booking_at || rowTime > currentLast) {
      out.last_booking_at = row.service_date || row.created_at || null;
    }
  }

  return out;
}

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
