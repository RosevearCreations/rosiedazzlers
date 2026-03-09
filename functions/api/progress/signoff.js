// functions/api/progress/signoff.js
// POST /api/progress/signoff
// Customer-facing signoff using progress_token (no login yet).
//
// Accepts JSON:
// {
//   "token":"UUID",
//   "method":"typed" | "drawn",
//   "typed_name":"John Doe",              // required if typed
//   "drawn_signature_ref":"sb://...path", // optional if drawn (we can add upload step later)
//   "completion_notes":"Looks great!"     // optional
// }
//
// Behavior:
// - Creates a job_signoffs row
// - Updates bookings.job_status -> "completed" and completed_at timestamp
// - Returns { ok:true, booking_id }

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

    const method = String(body.method || "").toLowerCase();
    if (!["typed","drawn"].includes(method)) {
      return corsJson({ ok: false, error: "method must be typed or drawn" }, 400);
    }

    const typedName = String(body.typed_name || "").trim();
    const drawnRef = String(body.drawn_signature_ref || "").trim();
    const notes = body.completion_notes != null ? String(body.completion_notes).trim() : null;

    if (method === "typed" && !typedName) {
      return corsJson({ ok: false, error: "typed_name is required for typed signoff" }, 400);
    }
    if (method === "drawn" && !drawnRef) {
      // We allow this later when we implement upload, but for now require it.
      return corsJson({ ok: false, error: "drawn_signature_ref is required for drawn signoff" }, 400);
    }

    const supa = async (methodHttp, path, payload) => {
      const res = await fetch(`${SUPABASE_URL}${path}`, {
        method: methodHttp,
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
          "Content-Type": "application/json",
          Accept: "application/json",
          Prefer: "return=representation",
        },
        body: payload ? JSON.stringify(payload) : undefined,
      });
      const text = await res.text();
      const data = text ? safeJson(text) : null;
      return { ok: res.ok, status: res.status, data, raw: text };
    };

    // 1) Resolve booking from token
    const b = await supa(
      "GET",
      `/rest/v1/bookings?select=id,job_status,progress_enabled&progress_token=eq.${encodeURIComponent(token)}&limit=1`
    );
    if (!b.ok) return corsJson({ ok: false, error: "Supabase error (bookings)", details: b }, 502);

    const booking = Array.isArray(b.data) ? b.data[0] : null;
    if (!booking) return corsJson({ ok: false, error: "Not found" }, 404);
    if (booking.progress_enabled !== true) return corsJson({ ok: false, error: "Progress tracking disabled" }, 403);

    if (String(booking.job_status || "") === "completed") {
      return corsJson({ ok: false, error: "Already completed" }, 409);
    }

    // 2) Insert signoff
    const ins = await supa("POST", "/rest/v1/job_signoffs", {
      booking_id: booking.id,
      signed_by_role: "customer",
      signature_method: method,
      typed_name: method === "typed" ? typedName : null,
      drawn_signature_ref: method === "drawn" ? drawnRef : null,
      accepted: true,
      completion_notes: notes,
    });
    if (!ins.ok) return corsJson({ ok: false, error: "Insert failed (job_signoffs)", details: ins }, 502);

    // 3) Mark booking completed
    const upd = await supa(
      "PATCH",
      `/rest/v1/bookings?id=eq.${encodeURIComponent(booking.id)}`,
      { job_status: "completed", completed_at: new Date().toISOString() }
    );
    if (!upd.ok) return corsJson({ ok: false, error: "Update failed (bookings)", details: upd }, 502);

    return corsJson({ ok: true, booking_id: booking.id });
  } catch (e) {
    return corsJson({ ok: false, error: "Server error", details: String(e) }, 500);
  }
}

/* helpers */

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
