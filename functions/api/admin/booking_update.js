import { requireStaffAccess, json, isUuid, serviceHeaders, cleanText } from "../_lib/staff-auth.js";

export async function onRequestOptions() {
  return corsResponse("", 204);
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await readJson(request);
    const booking_id = String(body.booking_id || "").trim();
    if (!isUuid(booking_id)) return corsJson({ ok: false, error: "booking_id must be a uuid" }, 400);

    const access = await requireStaffAccess({
      request,
      env,
      body,
      capability: "manage_bookings",
      bookingId: booking_id,
      allowLegacyAdminFallback: false,
    });
    if (!access.ok) return corsResponseFrom(access.response);

    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      return corsJson({ ok: false, error: "Server not configured (Supabase env vars missing)" }, 500);
    }

    const action = String(body.action || "").trim();
    const supa = async (method, path, payload, prefer = "return=representation") => {
      const res = await fetch(`${env.SUPABASE_URL}${path}`, {
        method,
        headers: { ...serviceHeaders(env), Accept: "application/json", Prefer: prefer },
        body: payload ? JSON.stringify(payload) : undefined,
      });
      const text = await res.text();
      const data = text ? safeJson(text) : null;
      return { ok: res.ok, status: res.status, data, raw: text };
    };

    const get = await supa(
      "GET",
      `/rest/v1/bookings?select=id,progress_token,progress_enabled,job_status,service_date,package_code,vehicle_size,status&id=eq.${encodeURIComponent(booking_id)}&limit=1`,
      null,
      "return=representation"
    );
    if (!get.ok) return corsJson({ ok: false, error: "Supabase error (booking lookup)", details: get }, 502);

    const booking = Array.isArray(get.data) ? get.data[0] : null;
    if (!booking) return corsJson({ ok: false, error: "Booking not found" }, 404);

    const now = new Date().toISOString();
    let patchPayload = null;
    let eventType = null;
    let eventNote = null;

    if (action === "set_job_status") {
      const job_status = String(body.job_status || "").trim();
      if (!["scheduled", "in_progress", "completed", "cancelled"].includes(job_status)) {
        return corsJson({ ok: false, error: "job_status must be scheduled|in_progress|completed|cancelled" }, 400);
      }
      patchPayload = { job_status, updated_at: now };
      if (job_status === "completed") patchPayload.completed_at = now;
      eventType = "job_status_changed";
      eventNote = `Job status set to ${job_status}.`;
    }

    if (action === "set_progress_enabled") {
      const pe = body.progress_enabled;
      if (typeof pe !== "boolean") return corsJson({ ok: false, error: "progress_enabled must be boolean" }, 400);
      patchPayload = { progress_enabled: pe, updated_at: now };
      if (pe === true && !booking.progress_token) patchPayload.progress_token = crypto.randomUUID();
      eventType = "progress_enabled_changed";
      eventNote = pe ? "Customer progress feed enabled." : "Customer progress feed disabled.";
    }

    if (action === "regen_progress_token") {
      patchPayload = { progress_token: crypto.randomUUID(), progress_enabled: true, updated_at: now };
      eventType = "progress_token_regenerated";
      eventNote = "Customer progress link regenerated.";
    }

    if (!patchPayload) return corsJson({ ok: false, error: "Unknown action" }, 400);

    const upd = await supa("PATCH", `/rest/v1/bookings?id=eq.${encodeURIComponent(booking_id)}`, patchPayload, "return=representation");
    if (!upd.ok) return corsJson({ ok: false, error: "Supabase update failed (bookings)", details: upd }, 502);

    const row = Array.isArray(upd.data) ? upd.data[0] : upd.data;
    if (eventType) {
      await fetch(`${env.SUPABASE_URL}/rest/v1/booking_events`, {
        method: "POST",
        headers: { ...serviceHeaders(env), Prefer: "return=minimal" },
        body: JSON.stringify([{
          booking_id,
          event_type: eventType,
          event_note: eventNote,
          actor_name: access.actor.full_name || access.actor.email || "Staff",
          payload: {
            actor_id: access.actor.id || null,
            action,
            job_status: cleanText(row?.job_status),
            progress_enabled: row?.progress_enabled === true,
          },
        }]),
      }).catch(() => null);
    }

    const origin = new URL(request.url).origin;
    const token = row.progress_token || null;
    const links = token ? {
      progress_url: `${origin}/progress?token=${encodeURIComponent(token)}`,
      complete_url: `${origin}/complete?token=${encodeURIComponent(token)}`,
    } : null;

    return corsJson({ ok: true, row, links, actor: access.actor.full_name || access.actor.email || "Staff" });
  } catch (e) {
    return corsJson({ ok: false, error: "Server error", details: String(e) }, 500);
  }
}

async function readJson(request) {
  const t = await request.text();
  if (!t) return {};
  try { return JSON.parse(t); } catch { return {}; }
}
function safeJson(text) {
  try { return JSON.parse(text); } catch { return { raw: text }; }
}
function corsHeaders() {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "POST,OPTIONS",
    "access-control-allow-headers": "Content-Type, x-admin-password, x-staff-email, x-staff-user-id",
    "cache-control": "no-store",
  };
}
function corsJson(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json", ...corsHeaders() } });
}
function corsResponse(body = "", status = 200) {
  return new Response(body, { status, headers: corsHeaders() });
}
function corsResponseFrom(response) {
  const headers = new Headers(response.headers || {});
  for (const [k, v] of Object.entries(corsHeaders())) headers.set(k, v);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
