export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const date = url.searchParams.get("date"); // YYYY-MM-DD

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return json({ error: "Missing or invalid ?date=YYYY-MM-DD" }, 400);
  }

  const SUPABASE_URL = env.SUPABASE_URL;
  const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SERVICE_KEY) {
    return json({ error: "Server not configured (missing Supabase env vars)" }, 500);
  }

  // Helper to call Supabase REST
  const supa = async (path) => {
    const res = await fetch(`${SUPABASE_URL}${path}`, {
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        Accept: "application/json",
      },
    });
    const text = await res.text();
    if (!res.ok) {
      return { ok: false, status: res.status, body: text };
    }
    return { ok: true, status: res.status, body: text ? JSON.parse(text) : null };
  };

  // 1) Check if the date is blocked
  const block = await supa(
    `/rest/v1/date_blocks?select=blocked_date,reason&blocked_date=eq.${encodeURIComponent(date)}`
  );
  if (!block.ok) return json({ error: "Supabase error (date_blocks)", details: block }, 500);

  if (Array.isArray(block.body) && block.body.length > 0) {
    return json({
      date,
      blocked: true,
      reason: block.body[0].reason ?? "Blocked",
      AM: false,
      PM: false,
    });
  }

  // 2) Fetch bookings for that date (pending + confirmed reserve slots)
  const bookings = await supa(
    `/rest/v1/bookings?select=status,start_slot,duration_slots&service_date=eq.${encodeURIComponent(date)}&status=in.(pending,confirmed)`
  );
  if (!bookings.ok) return json({ error: "Supabase error (bookings)", details: bookings }, 500);

  let AM = true;
  let PM = true;

  for (const b of bookings.body || []) {
    const slot = b.start_slot;
    const dur = Number(b.duration_slots);

    // Full-day consumes both slots
    if (dur === 2) {
      AM = false;
      PM = false;
      break;
    }

    // Half-day consumes its start slot only
    if (dur === 1 && slot === "AM") AM = false;
    if (dur === 1 && slot === "PM") PM = false;
  }

  return json({ date, blocked: false, AM, PM });
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "content-type": "application/json",
      // simple CORS (fine for now)
      "access-control-allow-origin": "*",
    },
  });
}
