import { requireStaffAccess, json, serviceHeaders } from "../_lib/staff-auth.js";

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const access = await requireStaffAccess({
      request,
      env,
      body,
      capability: "manage_blocks",
      allowLegacyAdminFallback: false,
    });
    if (!access.ok) return withCors(access.response);

    const start = cleanDate(body.start_date || body.block_date || body.blocked_date);
    const end = cleanDate(body.end_date || body.block_date || body.blocked_date);
    const reason = body.reason ? String(body.reason).trim() : null;
    const mode = String(body.mode || "date").trim().toLowerCase();
    const slot = String(body.slot || body.slot_code || "").trim().toUpperCase();

    if (!start || !end) {
      return withCors(json({ ok: false, error: "start_date and end_date must be YYYY-MM-DD" }, 400));
    }
    if (start > end) {
      return withCors(json({ ok: false, error: "start_date must be on or before end_date" }, 400));
    }

    const dates = enumerateDates(start, end);
    if (dates.length > 180) {
      return withCors(json({ ok: false, error: "Please keep range saves to 180 days or fewer at a time." }, 400));
    }
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      return withCors(json({ ok: false, error: "Server not configured (Supabase env vars missing)" }, 500));
    }

    const headers = {
      ...serviceHeaders(env),
      Accept: "application/json",
      Prefer: "resolution=merge-duplicates,return=representation"
    };

    if (mode === "date") {
      const rows = dates.map((blocked_date) => ({ blocked_date, reason }));
      const res = await fetch(`${env.SUPABASE_URL}/rest/v1/date_blocks?on_conflict=blocked_date`, {
        method: "POST",
        headers,
        body: JSON.stringify(rows)
      });
      const text = await res.text();
      const data = safeJson(text);
      if (!res.ok) {
        return withCors(json({ ok: false, error: "Supabase error (date_blocks batch upsert)", details: data }, 500));
      }
      return withCors(
        json({
          ok: true,
          mode: "date",
          count: rows.length,
          dates,
          rows: Array.isArray(data) ? data : [data].filter(Boolean),
          actor: access.actor.full_name || access.actor.email || "Staff"
        })
      );
    }

    if (mode === "slot") {
      const slots = slot === "BOTH" ? ["AM", "PM"] : ["AM", "PM"].includes(slot) ? [slot] : [];
      if (!slots.length) {
        return withCors(json({ ok: false, error: "slot must be AM, PM, or BOTH when mode=slot" }, 400));
      }
      const rows = [];
      for (const blocked_date of dates) {
        for (const s of slots) rows.push({ blocked_date, slot: s, reason });
      }
      const res = await fetch(`${env.SUPABASE_URL}/rest/v1/slot_blocks?on_conflict=blocked_date,slot`, {
        method: "POST",
        headers,
        body: JSON.stringify(rows)
      });
      const text = await res.text();
      const data = safeJson(text);
      if (!res.ok) {
        return withCors(json({ ok: false, error: "Supabase error (slot_blocks batch upsert)", details: data }, 500));
      }
      return withCors(
        json({
          ok: true,
          mode: "slot",
          slot: slots.length === 2 ? "BOTH" : slots[0],
          count: rows.length,
          dates,
          rows: Array.isArray(data) ? data : [data].filter(Boolean),
          actor: access.actor.full_name || access.actor.email || "Staff"
        })
      );
    }

    return withCors(json({ ok: false, error: "Invalid mode. Use 'date' or 'slot'." }, 400));
  } catch (e) {
    return withCors(json({ ok: false, error: "Server error", details: String(e) }, 500));
  }
}

function enumerateDates(start, end) {
  const dates = [];
  const d = new Date(`${start}T12:00:00`);
  const last = new Date(`${end}T12:00:00`);
  while (d <= last) {
    dates.push(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

function cleanDate(value) {
  const s = String(value || "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
}

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-admin-password, x-staff-email, x-staff-user-id",
    "Cache-Control": "no-store",
  };
}

function withCors(response) {
  const headers = new Headers(response.headers || {});
  for (const [k, v] of Object.entries(corsHeaders())) headers.set(k, v);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
