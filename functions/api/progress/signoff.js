// /functions/api/progress/signoff.js
// CREATE THIS FILE (or REPLACE ENTIRE FILE)
//
// POST /api/progress/signoff
//
// Records a typed customer sign-off for a booking identified by progress token.
// Also sets booking.job_status = "completed" and booking.completed_at.
//
// Request JSON:
// {
//   "token": "uuid",
//   "signer_name": "Full Name",
//   "signer_email": "email@example.com",
//   "notes": "optional",
//   "signer_type": "customer" | "staff" | "admin"   // optional, default "customer"
// }
//
// Env vars required:
// - SUPABASE_URL
// - SUPABASE_SERVICE_ROLE_KEY
//
// Tables expected:
// - bookings (id, progress_token, progress_enabled, job_status, completed_at)
// - job_signoffs (booking_id, signer_type, signer_name, signer_email, notes, signed_at, user_agent)

export async function onRequestOptions() {
  return corsResponse("", 204);
}

export async function onRequestPost({ request, env }) {
  try {
    const SUPABASE_URL = env.SUPABASE_URL;
    const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SERVICE_KEY) {
      return corsJson({ ok: false, error: "Server not configured (Supabase env vars missing)" }, 500);
    }

    const body = await readJson(request);

    const token = String(body.token || "").trim();
    if (!isUuid(token)) return corsJson({ ok: false, error: "Missing or invalid token" }, 400);

    const signer_name = String(body.signer_name || "").trim();
    const signer_email = String(body.signer_email || "").trim();
    const notes = body.notes != null ? String(body.notes).trim() : null;

    const signer_type = String(body.signer_type || "customer").toLowerCase();
    if (!["customer", "staff", "admin"].includes(signer_type)) {
      return corsJson({ ok: false, error: "signer_type must be customer, staff, or admin" }, 400);
    }

    if (!signer_name) return corsJson({ ok: false, error: "Missing signer_name" }, 400);
    if (!isEmail(signer_email)) return corsJson({ ok: false, error: "Missing or invalid signer_email" }, 400);

    const ua = request.headers.get("user-agent") || null;

    const supa = async (method, path, payload, prefer = "return=representation") => {
      const res = await fetch(`${SUPABASE_URL}${path}`, {
        method,
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
          "Content-Type": "application/json",
          Accept: "application/json",
          Prefer: prefer,
        },
        body: payload ? JSON.stringify(payload) : undefined,
      });
      const text = await res.text();
      const data = text ? safeJson(text) : null;
      return { ok: res.ok, status: res.status, data, raw: text };
    };

    // 1) Resolve booking by token
    const b = await supa(
      "GET",
      `/rest/v1/bookings?select=id,progress_enabled,job_status&progress_token=eq.${encodeURIComponent(token)}&limit=1`,
      null,
      "return=representation"
    );
    if (!b.ok) return corsJson({ ok: false, error: "Supabase error (bookings lookup)", details: b }, 502);

    const booking = Array.isArray(b.data) ? b.data[0] : null;
    if (!booking) return corsJson({ ok: false, error: "Not found" }, 404);
    if (booking.progress_enabled !== true) return corsJson({ ok: false, error: "Progress tracking disabled" }, 403);

    const now = new Date().toISOString();

    // 2) Insert signoff row
    const ins = await supa("POST", "/rest/v1/job_signoffs", {
      booking_id: booking.id,
      signer_type,
      signer_name,
      signer_email,
      notes: notes || null,
      signed_at: now,
      user_agent: ua,
    });
    if (!ins.ok) return corsJson({ ok: false, error: "Supabase insert failed (job_signoffs)", details: ins }, 502);

    // 3) Update booking status -> completed
    const upd = await supa(
      "PATCH",
      `/rest/v1/bookings?id=eq.${encodeURIComponent(booking.id)}`,
      { job_status: "completed", completed_at: now },
      "return=minimal"
    );
    if (!upd.ok) {
      // Signoff saved; booking status update failed. Return ok but warn.
      return corsJson({
        ok: true,
        warning: "Signoff recorded but booking status update failed",
        signoff: ins.data?.[0] || null,
        details: upd,
      }, 200);
    }

    return corsJson({ ok: true, signoff: ins.data?.[0] || null });
  } catch (e) {
    return corsJson({ ok: false, error: "Server error", details: String(e) }, 500);
  }
}

/* ---------------- helpers ---------------- */

async function readJson(request) {
  const t = await request.text();
  if (!t) return {};
  try { return JSON.parse(t); } catch { return {}; }
}

function safeJson(text) {
  try { return JSON.parse(text); } catch { return { raw: text }; }
}

function isUuid(s) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(s || ""));
}

function isEmail(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || ""));
}

function corsHeaders() {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "POST,OPTIONS",
    "access-control-allow-headers": "Content-Type",
  };
}

function corsJson(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json", ...corsHeaders() },
  });
}

function corsResponse(body = "", status = 200) {
  return new Response(body, { status, headers: corsHeaders() });
}
