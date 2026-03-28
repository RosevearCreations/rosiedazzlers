export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    const url = new URL(request.url);
    const token = (url.searchParams.get("token") || "").trim();

    if (!token) {
      return json({ error: "Missing token." }, 400);
    }

    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      return json({ error: "Server configuration is incomplete." }, 500);
    }

    const headers = {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json"
    };

    const bookingUrl =
      `${env.SUPABASE_URL}/rest/v1/bookings` +
      `?select=id,status,job_status,customer_name,service_date,start_slot,package_code,vehicle_size,assigned_to,progress_enabled,progress_token,current_workflow_stage,detailer_response_status,detailer_response_reason,dispatched_at,arrived_at,detailing_started_at,detailing_completed_at` +
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
      return json({ error: "Progress viewing is not enabled for this booking." }, 403);
    }

    const bookingId = booking.id;

    const [updatesRes, mediaRes, signoffsRes, checklistRes, usageRes, eventsRes] = await Promise.all([
      fetch(
        `${env.SUPABASE_URL}/rest/v1/job_updates?select=id,created_at,created_by,note,visibility&booking_id=eq.${bookingId}&visibility=eq.customer&order=created_at.desc`,
        { headers }
      ),
      fetch(
        `${env.SUPABASE_URL}/rest/v1/job_media?select=id,created_at,created_by,kind,caption,media_url,visibility&booking_id=eq.${bookingId}&visibility=eq.customer&order=created_at.desc`,
        { headers }
      ),
      fetch(
        `${env.SUPABASE_URL}/rest/v1/job_signoffs?select=id,signer_type,signer_name,signer_email,notes,signed_at,user_agent,signature_data_url&booking_id=eq.${bookingId}&order=signed_at.desc`,
        { headers }
      ),
      fetch(
        `${env.SUPABASE_URL}/rest/v1/job_completion_checklists?select=*&booking_id=eq.${bookingId}&limit=1`,
        { headers }
      ),
      fetch(
        `${env.SUPABASE_URL}/rest/v1/catalog_inventory_movements?select=id,created_at,item_key,item_name,qty_delta,note,movement_type&booking_id=eq.${bookingId}&movement_type=eq.job_use&order=created_at.desc`,
        { headers }
      ),
      fetch(
        `${env.SUPABASE_URL}/rest/v1/booking_events?select=id,created_at,event_type,event_note,actor_name,payload&booking_id=eq.${bookingId}&order=created_at.asc`,
        { headers }
      )
    ]);

    if (!updatesRes.ok) {
      const text = await updatesRes.text();
      return json({ error: `Could not load updates. ${text}` }, 500);
    }

    if (!mediaRes.ok) {
      const text = await mediaRes.text();
      return json({ error: `Could not load media. ${text}` }, 500);
    }

    if (!signoffsRes.ok) {
      const text = await signoffsRes.text();
      return json({ error: `Could not load signoffs. ${text}` }, 500);
    }

    if (!checklistRes.ok) {
      const text = await checklistRes.text();
      return json({ error: `Could not load checklist. ${text}` }, 500);
    }

    if (!usageRes.ok) {
      const text = await usageRes.text();
      return json({ error: `Could not load products used. ${text}` }, 500);
    }

    if (!eventsRes.ok) {
      const text = await eventsRes.text();
      return json({ error: `Could not load booking events. ${text}` }, 500);
    }

    const [updatesRaw, media, signoffs, checklistRows, productsUsed, bookingEvents] = await Promise.all([
      updatesRes.json(),
      mediaRes.json(),
      signoffsRes.json(),
      checklistRes.json(),
      usageRes.json(),
      eventsRes.json()
    ]);

    const updates = Array.isArray(updatesRaw)
      ? updatesRaw.filter((row) => String(row.visibility || "customer").toLowerCase() !== "internal")
      : [];

    const packageName = booking.package_code
      ? booking.package_code
          .split("_")
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(" ")
      : "";

    return json({
      ok: true,
      booking: {
        id: booking.id,
        status: booking.status,
        job_status: booking.job_status,
        customer_name: booking.customer_name,
        service_date: booking.service_date,
        start_slot: booking.start_slot,
        package_code: booking.package_code,
        package_name: packageName,
        vehicle_size: booking.vehicle_size,
        assigned_to: booking.assigned_to,
        current_workflow_stage: booking.current_workflow_stage || null,
        detailer_response_status: booking.detailer_response_status || null,
        detailer_response_reason: booking.detailer_response_reason || null,
        dispatched_at: booking.dispatched_at || null,
        arrived_at: booking.arrived_at || null,
        detailing_started_at: booking.detailing_started_at || null,
        detailing_completed_at: booking.detailing_completed_at || null
      },
      updates,
      media: Array.isArray(media) ? media : [],
      signoffs: Array.isArray(signoffs) ? signoffs : [],
      checklist: Array.isArray(checklistRows) ? checklistRows[0] || null : null,
      products_used: Array.isArray(productsUsed) ? productsUsed : [],
      workflow_events: Array.isArray(bookingEvents) ? bookingEvents : []
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
