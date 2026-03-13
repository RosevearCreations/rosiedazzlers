// /functions/api/admin/bookings.js
// REPLACE ENTIRE FILE
//
// Admin endpoint for listing bookings + updating status.
//
// POST JSON (action=list):
// {
//   "admin_password": "....",
//   "action": "list",
//   "date_from": "YYYY-MM-DD",   // optional
//   "date_to":   "YYYY-MM-DD",   // optional
//   "statuses": ["pending","confirmed"] // optional
// }
//
// POST JSON (action=set_status):
// {
//   "admin_password": "....",
//   "action": "set_status",
//   "booking_id": "uuid",
//   "status": "pending" | "confirmed" | "cancelled" | "completed"
// }

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => null);

    const ADMIN_PASSWORD = env.ADMIN_PASSWORD;
    if (!ADMIN_PASSWORD) return json({ ok: false, error: "Server not configured (ADMIN_PASSWORD missing)" }, 500);
    if (!body?.admin_password || body.admin_password !== ADMIN_PASSWORD) {
      return json({ ok: false, error: "Unauthorized" }, 401);
    }

    const SUPABASE_URL = env.SUPABASE_URL;
    const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
    if (!SUPABASE_URL || !SERVICE_KEY) {
      return json({ ok: false, error: "Server not configured (Supabase env vars missing)" }, 500);
    }

    const action = String(body.action || "").trim();

    // Helper for Supabase REST calls
    const supa = async (method, path, payload) => {
      const res = await fetch(`${SUPABASE_URL}${path}`, {
        method,
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
      if (!res.ok) return { ok: false, status: res.status, data, raw: text };
      return { ok: true, status: res.status, data };
    };

    // ---- LIST ----
    if (action === "list") {
      const date_from = body.date_from ? String(body.date_from).trim() : null;
      const date_to = body.date_to ? String(body.date_to).trim() : null;
      const statuses = Array.isArray(body.statuses) ? body.statuses.map(String) : null;

      if (date_from && !/^\d{4}-\d{2}-\d{2}$/.test(date_from)) {
        return json({ ok: false, error: "date_from must be YYYY-MM-DD" }, 400);
      }
      if (date_to && !/^\d{4}-\d{2}-\d{2}$/.test(date_to)) {
        return json({ ok: false, error: "date_to must be YYYY-MM-DD" }, 400);
      }

      const params = new URLSearchParams();
      params.set("select", "*");
      params.set("order", "service_date.asc,start_slot.asc");

      if (date_from) params.append("service_date", `gte.${date_from}`);
      if (date_to) params.append("service_date", `lte.${date_to}`);

      if (statuses && statuses.length) {
        // e.g. status=in.(pending,confirmed)
        const safe = statuses.map(s => s.replace(/[^\w-]/g, "")).filter(Boolean);
        if (safe.length) params.set("status", `in.(${safe.join(",")})`);
      }

      const r = await supa("GET", `/rest/v1/bookings?${params.toString()}`);
      if (!r.ok) return json({ ok: false, error: "Supabase error (bookings list)", details: r }, 502);

      return json({ ok: true, count: Array.isArray(r.data) ? r.data.length : 0, rows: r.data || [] });
    }

    // ---- SET STATUS ----
    if (action === "set_status") {
      const booking_id = String(body.booking_id || "").trim();
      const status = String(body.status || "").trim();

      if (!booking_id) return json({ ok: false, error: "Missing booking_id" }, 400);

      const allowed = new Set(["pending", "confirmed", "cancelled", "completed"]);
      if (!allowed.has(status)) return json({ ok: false, error: "Invalid status" }, 400);

      const r = await supa(
        "PATCH",
        `/rest/v1/bookings?id=eq.${encodeURIComponent(booking_id)}`,
        { status }
      );

      if (!r.ok) return json({ ok: false, error: "Supabase error (booking update)", details: r }, 502);

      const row = Array.isArray(r.data) ? r.data[0] : r.data;
      return json({ ok: true, row });
    }

    return json({ ok: false, error: "Unknown action" }, 400);

  } catch (e) {
    return json({ ok: false, error: "Server error", details: String(e) }, 500);
  }
}

function safeJson(text) {
  try { return JSON.parse(text); } catch { return { raw: text }; }
}

function corsHeaders() {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "POST,OPTIONS",
    "access-control-allow-headers": "content-type,authorization",
  };
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json", ...corsHeaders() },
  });
}
