export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      return json({ error: "Server configuration is incomplete." }, 500);
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return json({ error: "Invalid request body." }, 400);
    }

    const token = String(body.token || "").trim();
    const signer_name = String(body.signer_name || "").trim();
    const signer_email = String(body.signer_email || "").trim();
    const notes = String(body.notes || "").trim();
    const signature_data_url = String(body.signature_data_url || "").trim() || null;

    if (!token) return json({ error: "Missing token." }, 400);
    if (!signer_name) return json({ error: "Missing signer name." }, 400);
    if (!signer_email) return json({ error: "Missing signer email." }, 400);

    const headers = {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json"
    };

    const bookingUrl =
      `${env.SUPABASE_URL}/rest/v1/bookings` +
      `?select=id,status,job_status,progress_enabled,progress_token` +
      `&progress_token=eq.${encodeURIComponent(token)}` +
      `&limit=1`;

    const bookingRes = await fetch(bookingUrl, { headers });
    if (!bookingRes.ok) {
      const text = await bookingRes.text();
      return json({ error: `Could not load booking. ${text}` }, 500);
    }

    const bookings = await bookingRes.json();
    const booking = Array.isArray(bookings) ? bookings[0] : null;

    if (!booking) {
      return json({ error: "Progress record not found." }, 404);
    }

    if (booking.progress_enabled === false) {
      return json({ error: "Progress signoff is not enabled for this booking." }, 403);
    }

    const bookingId = booking.id;
    const user_agent = request.headers.get("user-agent") || "";

    const insertRes = await fetch(`${env.SUPABASE_URL}/rest/v1/job_signoffs`, {
      method: "POST",
      headers: {
        ...headers,
        Prefer: "return=representation"
      },
      body: JSON.stringify([
        {
          booking_id: bookingId,
          signer_type: "customer",
          signer_name,
          signer_email,
          notes: notes || null,
          signature_data_url,
          user_agent
        }
      ])
    });

    if (!insertRes.ok) {
      const text = await insertRes.text();
      return json({ error: `Could not save signoff. ${text}` }, 500);
    }

    const signoffRows = await insertRes.json();
    const signoff = Array.isArray(signoffRows) ? signoffRows[0] : null;

    const patchRes = await fetch(
      `${env.SUPABASE_URL}/rest/v1/bookings?id=eq.${bookingId}`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          status: "completed",
          job_status: "completed",
          completed_at: new Date().toISOString()
        })
      }
    );

    if (!patchRes.ok) {
      const text = await patchRes.text();
      return json({ error: `Signoff saved, but booking update failed. ${text}` }, 500);
    }

    return json({
      ok: true,
      message: "Signoff recorded.",
      signoff: signoff || null
    });
  } catch (err) {
    return json(
      { error: err && err.message ? err.message : "Unexpected server error." },
      500
    );
  }
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
