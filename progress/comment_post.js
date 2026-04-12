export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await request.json().catch(() => ({}));
    const token = String(body.token || '').trim();
    const createdBy = String(body.created_by || '').trim();
    const note = String(body.note || '').trim();
    if (!token) return json({ error: 'Missing token.' }, 400);
    if (!createdBy || !note) return json({ error: 'Your name and message are required.' }, 400);
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return json({ error: 'Server configuration is incomplete.' }, 500);

    const headers = {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json'
    };

    const bookingRes = await fetch(
      `${env.SUPABASE_URL}/rest/v1/bookings?select=id,customer_name,progress_enabled,progress_token&progress_token=eq.${encodeURIComponent(token)}&limit=1`,
      { headers }
    );
    if (!bookingRes.ok) return json({ error: `Could not resolve booking. ${await bookingRes.text()}` }, 500);
    const bookings = await bookingRes.json();
    const booking = Array.isArray(bookings) ? bookings[0] : null;
    if (!booking) return json({ error: 'Progress record not found.' }, 404);
    if (booking.progress_enabled === false) return json({ error: 'Progress viewing is not enabled for this booking.' }, 403);

    const cleanName = createdBy.slice(0, 120);
    const cleanNote = note.slice(0, 4000);
    const insertRes = await fetch(`${env.SUPABASE_URL}/rest/v1/job_updates`, {
      method: 'POST',
      headers: { ...headers, Prefer: 'return=representation' },
      body: JSON.stringify([{ booking_id: booking.id, created_by: cleanName, note: cleanNote, visibility: 'customer' }])
    });
    if (!insertRes.ok) return json({ error: `Could not save message. ${await insertRes.text()}` }, 500);

    await fetch(`${env.SUPABASE_URL}/rest/v1/booking_events`, {
      method: 'POST',
      headers,
      body: JSON.stringify([{ booking_id: booking.id, event_type: 'customer_comment', event_note: cleanNote.slice(0, 250), actor_name: cleanName, payload: { source: 'progress_page' } }])
    }).catch(() => null);

    return json({ ok: true });
  } catch (err) {
    return json({ error: err?.message || 'Unexpected server error.' }, 500);
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
}
