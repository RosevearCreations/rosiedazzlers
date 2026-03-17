export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      return json({ error: "Server configuration is incomplete." }, 500);
    }

    const adminPassword = request.headers.get("x-admin-password") || "";
    if (!env.ADMIN_PASSWORD || adminPassword !== env.ADMIN_PASSWORD) {
      return json({ error: "Unauthorized." }, 401);
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return json({ error: "Invalid request body." }, 400);
    }

    const booking_id = String(body.booking_id || "").trim();
    if (!booking_id) {
      return json({ error: "Missing booking_id." }, 400);
    }

    const headers = {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json"
    };

    const bookingRes = await fetch(
      `${env.SUPABASE_URL}/rest/v1/bookings?select=id&id=eq.${encodeURIComponent(booking_id)}&limit=1`,
      { headers }
    );

    if (!bookingRes.ok) {
      const text = await bookingRes.text();
      return json({ error: `Could not verify booking. ${text}` }, 500);
    }

    const bookingRows = await bookingRes.json();
    const booking = Array.isArray(bookingRows) ? bookingRows[0] : null;

    if (!booking) {
      return json({ error: "Booking not found." }, 404);
    }

    const entriesRes = await fetch(
      `${env.SUPABASE_URL}/rest/v1/job_time_entries` +
        `?select=id,entry_type,event_time,note,created_by_name,source,created_at` +
        `&booking_id=eq.${encodeURIComponent(booking_id)}` +
        `&order=event_time.asc,created_at.asc`,
      { headers }
    );

    if (!entriesRes.ok) {
      const text = await entriesRes.text();
      return json({ error: `Could not load time entries. ${text}` }, 500);
    }

    const entries = await entriesRes.json();
    const rows = Array.isArray(entries) ? entries : [];

    const summary = summarizeTimeEntries(rows);

    return json({
      ok: true,
      booking_id,
      summary,
      time_entries: rows
    });
  } catch (err) {
    return json(
      { error: err && err.message ? err.message : "Unexpected server error." },
      500
    );
  }
}

function summarizeTimeEntries(entries) {
  let arrived_at = null;
  let started_at = null;
  let completed_at = null;
  let last_event_type = null;
  let current_status = "idle";

  let activeWorkStartMs = null;
  let activePauseStartMs = null;

  let total_work_ms = 0;
  let total_pause_ms = 0;

  for (const entry of entries) {
    const t = Date.parse(entry.event_time);
    if (Number.isNaN(t)) continue;

    last_event_type = entry.entry_type;

    if (entry.entry_type === "arrival" && !arrived_at) {
      arrived_at = entry.event_time;
      current_status = "arrived";
      continue;
    }

    if (entry.entry_type === "work_start") {
      if (!started_at) started_at = entry.event_time;

      if (activePauseStartMs != null) {
        total_pause_ms += Math.max(0, t - activePauseStartMs);
        activePauseStartMs = null;
      }

      activeWorkStartMs = t;
      current_status = "working";
      continue;
    }

    if (["break_start", "rain_break_start", "heat_break_start"].includes(entry.entry_type)) {
      if (activeWorkStartMs != null) {
        total_work_ms += Math.max(0, t - activeWorkStartMs);
        activeWorkStartMs = null;
      }

      activePauseStartMs = t;

      if (entry.entry_type === "break_start") current_status = "break";
      if (entry.entry_type === "rain_break_start") current_status = "rain_break";
      if (entry.entry_type === "heat_break_start") current_status = "heat_break";
      continue;
    }

    if (["break_stop", "rain_break_stop", "heat_break_stop"].includes(entry.entry_type)) {
      if (activePauseStartMs != null) {
        total_pause_ms += Math.max(0, t - activePauseStartMs);
        activePauseStartMs = null;
      }

      activeWorkStartMs = t;
      current_status = "working";
      continue;
    }

    if (entry.entry_type === "work_stop") {
      if (activeWorkStartMs != null) {
        total_work_ms += Math.max(0, t - activeWorkStartMs);
        activeWorkStartMs = null;
      }
      current_status = "stopped";
      continue;
    }

    if (entry.entry_type === "job_complete") {
      if (activeWorkStartMs != null) {
        total_work_ms += Math.max(0, t - activeWorkStartMs);
        activeWorkStartMs = null;
      }
      if (activePauseStartMs != null) {
        total_pause_ms += Math.max(0, t - activePauseStartMs);
        activePauseStartMs = null;
      }
      completed_at = entry.event_time;
      current_status = "completed";
      continue;
    }
  }

  const now = Date.now();

  if (activeWorkStartMs != null) {
    total_work_ms += Math.max(0, now - activeWorkStartMs);
  }

  if (activePauseStartMs != null) {
    total_pause_ms += Math.max(0, now - activePauseStartMs);
  }

  return {
    arrived_at,
    started_at,
    completed_at,
    last_event_type,
    current_status,
    total_work_ms,
    total_pause_ms
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}
