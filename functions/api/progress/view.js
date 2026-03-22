import { loadAppSettings } from "../_lib/app-settings.js";

export async function onRequestGet(context) {
  const { request, env } = context;
  try {
    const url = new URL(request.url);
    const token = (url.searchParams.get("token") || "").trim();
    if (!token) return json({ error: "Missing token." }, 400);
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return json({ error: "Server configuration is incomplete." }, 500);

    const headers = {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json"
    };
    const settings = await loadAppSettings(env, ['feature_flags','visibility_matrix']);

    const bookingRes = await fetch(
      `${env.SUPABASE_URL}/rest/v1/bookings?select=id,status,job_status,customer_name,customer_email,service_date,start_slot,package_code,vehicle_size,assigned_to,progress_enabled,progress_token&progress_token=eq.${encodeURIComponent(token)}&limit=1`,
      { headers }
    );
    if (!bookingRes.ok) return json({ error: `Could not load booking. ${await bookingRes.text()}` }, 500);
    const bookingRows = await bookingRes.json().catch(() => []);
    const booking = Array.isArray(bookingRows) ? bookingRows[0] || null : null;
    if (!booking) return json({ error: "Progress record not found." }, 404);
    if (booking.progress_enabled === false) return json({ error: "Progress viewing is not enabled for this booking." }, 403);

    const bookingId = booking.id;
    const [updatesRes, mediaRes, signoffsRes, commentsRes, prefRes, annRes] = await Promise.all([
      fetch(`${env.SUPABASE_URL}/rest/v1/job_updates?select=id,created_at,created_by,note,visibility&booking_id=eq.${bookingId}&visibility=eq.customer&order=created_at.desc`, { headers }),
      fetch(`${env.SUPABASE_URL}/rest/v1/job_media?select=id,created_at,created_by,kind,caption,media_url,visibility&booking_id=eq.${bookingId}&visibility=eq.customer&order=created_at.desc`, { headers }),
      fetch(`${env.SUPABASE_URL}/rest/v1/job_signoffs?select=id,signer_type,signer_name,signer_email,notes,signed_at,user_agent&booking_id=eq.${bookingId}&order=signed_at.desc`, { headers }),
      fetch(`${env.SUPABASE_URL}/rest/v1/progress_comments?select=id,booking_id,parent_type,parent_id,author_type,author_name,author_email,message,created_at,visibility&booking_id=eq.${bookingId}&order=created_at.asc`, { headers }),
      booking.customer_email ? fetch(`${env.SUPABASE_URL}/rest/v1/customer_profiles?select=id,notification_opt_in,notification_channel,detailer_chat_opt_in&email=eq.${encodeURIComponent(booking.customer_email)}&limit=1`, { headers }) : Promise.resolve(null),
      fetch(`${env.SUPABASE_URL}/rest/v1/observation_annotations?select=id,booking_id,media_id,x_percent,y_percent,title,note,visibility,created_by_type,created_by_name,created_at&booking_id=eq.${bookingId}&visibility=eq.customer&order=created_at.asc`, { headers }).catch(() => null)
    ]);

    for (const [res, label] of [[updatesRes,'updates'],[mediaRes,'media'],[signoffsRes,'signoffs'],[commentsRes,'comments']]) {
      if (!res.ok) return json({ error: `Could not load ${label}. ${await res.text()}` }, 500);
    }

    const updates = await updatesRes.json().catch(() => []);
    const media = await mediaRes.json().catch(() => []);
    const signoffs = await signoffsRes.json().catch(() => []);
    const rawComments = await commentsRes.json().catch(() => []);
    const prefRows = prefRes ? await prefRes.json().catch(() => []) : [];
    const annotations = annRes && annRes.ok ? await annRes.json().catch(() => []) : [];
    const prefs = Array.isArray(prefRows) ? prefRows[0] || null : null;

    const packageName = booking.package_code ? booking.package_code.split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ") : "";
    const customerChatEnabled = settings.feature_flags?.customer_chat_enabled !== false && (prefs?.detailer_chat_opt_in !== false);

    const comments = (Array.isArray(rawComments) ? rawComments : []).filter(row => {
      if (row.visibility === 'internal') return false;
      if (row.author_type === 'client') return true;
      return customerChatEnabled;
    });

    const mediaWithAnnotations = (Array.isArray(media) ? media : []).map(item => ({
      ...item,
      annotations: (Array.isArray(annotations) ? annotations : []).filter(a => a.media_id === item.id)
    }));

    return json({
      ok: true,
      app_settings: settings,
      booking: {
        id: booking.id,
        status: booking.status,
        job_status: booking.job_status,
        customer_name: booking.customer_name,
        customer_email: booking.customer_email || null,
        service_date: booking.service_date,
        start_slot: booking.start_slot,
        package_code: booking.package_code,
        package_name: packageName,
        vehicle_size: booking.vehicle_size,
        assigned_to: booking.assigned_to
      },
      customer_preferences: {
        notification_opt_in: prefs?.notification_opt_in === true,
        notification_channel: prefs?.notification_channel || 'email',
        detailer_chat_opt_in: prefs?.detailer_chat_opt_in !== false,
        customer_chat_enabled: customerChatEnabled
      },
      updates: Array.isArray(updates) ? updates : [],
      media: mediaWithAnnotations,
      signoffs: Array.isArray(signoffs) ? signoffs : [],
      comments,
      annotations: Array.isArray(annotations) ? annotations : []
    });
  } catch (err) {
    return json({ error: err && err.message ? err.message : "Unexpected server error." }, 500);
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
