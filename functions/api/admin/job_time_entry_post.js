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
    const entry_type = String(body.entry_type || "").trim();
    const created_by_name = String(body.created_by_name || "").trim();
    const note = cleanText(body.note);
    const source = cleanSource(body.source);
    const event_time = cleanEventTime(body.event_time);
    const staff_user_id = cleanText(body.staff_user_id);

    if (!booking_id) {
      return json({ error: "Missing booking_id." }, 400);
    }

    if (!isValidEntryType(entry_type)) {
      return json({ error: "Invalid entry_type." }, 400);
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

    const insertRes = await fetch(`${env.SUPABASE_URL}/rest/v1/job_time_entries`, {
      method: "POST",
      headers: {
        ...headers,
        Prefer: "return=representation"
      },
      body: JSON.stringify([
        {
          booking_id,
          staff_user_id,
          entry_type,
          event_time,
          note,
          created_by_name: created_by_name || null,
          source
        }
      ])
    });

    if (!insertRes.ok) {
      const text = await insertRes.text();
      return json({ error: `Could not save time entry. ${text}` }, 500);
    }

    const rows = await insertRes.json();
    const row = Array.isArray(rows) ? rows[0] || null : null;

    return json({
      ok: true,
      message: "Time entry saved.",
      time_entry: row
    });
  } catch (err) {
    return json(
      { error: err && err.message ? err.message : "Unexpected server error." },
      500
    );
  }
}

function isValidEntryType(value) {
  return [
    "arrival",
    "work_start",
    "work_stop",
    "break_start",
    "break_stop",
    "rain_break_start",
    "rain_break_stop",
    "heat_break_start",
    "heat_break_stop",
    "job_complete"
  ].includes(value);
}

function cleanText(value) {
  const s = String(value ?? "").trim();
  return s || null;
}

function cleanSource(value) {
  const s = String(value ?? "").trim().toLowerCase();
  if (!s) return "jobsite";
  return ["jobsite", "admin", "system"].includes(s) ? s : "jobsite";
}

function cleanEventTime(value) {
  const s = String(value ?? "").trim();
  if (!s) return new Date().toISOString();
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
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
