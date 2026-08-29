import { hydrateMediaRows, publicWorkflowEvents, schemaLooksLegacy } from "../_lib/job-live-feed.js";

export async function onRequestGet(context) {
  const { request, env } = context;
  try {
    const url = new URL(request.url);
    const token = (url.searchParams.get("token") || "").trim();
    if (!token) return json({ error: "Missing token." }, 400);
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return json({ error: "Server configuration is incomplete." }, 500);

    const headers = serviceHeaders(env);
    const bookingUrl = `${env.SUPABASE_URL}/rest/v1/bookings?select=id,status,job_status,customer_name,service_date,start_slot,package_code,vehicle_size,assigned_to,progress_enabled,progress_token,current_workflow_stage,detailer_response_status,detailer_response_reason,dispatched_at,arrived_at,detailing_started_at,detailing_completed_at,progress_last_viewed_at,completed_summary_status&progress_token=eq.${encodeURIComponent(token)}&limit=1`;
    const bookingRes = await fetch(bookingUrl, { headers });
    if (!bookingRes.ok) return json({ error: `Could not load booking. ${await bookingRes.text()}` }, 500);
    const booking = (await bookingRes.json().catch(() => []))?.[0] || null;
    if (!booking) return json({ error: "Progress record not found." }, 404);
    if (booking.progress_enabled === false) return json({ error: "Progress viewing is not enabled for this booking." }, 403);

    const bookingId = booking.id;
    const [updatesResult, mediaResult, signoffsRes, checklistRes, usageRes, eventsRes, incidentsRes, summaryRes, paymentLinksRes] = await Promise.all([
      fetchAdaptive(env, headers, "job_updates", bookingId,
        "id,created_at,created_by,note,visibility,thread_status,stage,source_channel,review_status,customer_action_required,customer_visible_at,recommendation_title,recommendation_amount_cents,recommendation_status,customer_decision,customer_decision_note,customer_decision_at,customer_acknowledgement_name,customer_acknowledged_at,customer_acknowledgement_version,linked_payment_request_id",
        "id,created_at,created_by,note,visibility"),
      fetchAdaptive(env, headers, "job_media", bookingId,
        "id,created_at,created_by,kind,caption,media_url,visibility,thread_status,stage,source_channel,review_status,customer_action_required,customer_visible_at,storage_bucket,storage_path,content_type,file_size_bytes,duration_seconds,retention_policy,retention_expires_at,gallery_reuse_status,vehicle_history_reuse_status",
        "id,created_at,created_by,kind,caption,media_url,visibility"),
      fetch(`${env.SUPABASE_URL}/rest/v1/job_signoffs?select=id,signer_type,signer_name,signer_email,notes,signed_at,user_agent,signature_data_url&booking_id=eq.${bookingId}&order=signed_at.desc`, { headers }),
      fetch(`${env.SUPABASE_URL}/rest/v1/job_completion_checklists?select=*&booking_id=eq.${bookingId}&limit=1`, { headers }),
      fetch(`${env.SUPABASE_URL}/rest/v1/catalog_inventory_movements?select=id,created_at,item_key,item_name,qty_delta,note,movement_type&booking_id=eq.${bookingId}&movement_type=eq.job_use&order=created_at.desc`, { headers }),
      fetch(`${env.SUPABASE_URL}/rest/v1/booking_events?select=id,created_at,event_type,event_note,actor_name,payload&booking_id=eq.${bookingId}&order=created_at.asc`, { headers }),
      fetch(`${env.SUPABASE_URL}/rest/v1/incident_reports?select=id,created_at,updated_at,incident_type,severity,title,vehicle_area,equipment_name,decision_status,approved_customer_summary,approved_customer_discussion,public_evidence_items,customer_visible_at&booking_id=eq.${bookingId}&public_visible=eq.true&order=customer_visible_at.desc,updated_at.desc`, { headers }),
      fetch(`${env.SUPABASE_URL}/rest/v1/completed_job_summaries?select=*&booking_id=eq.${bookingId}&customer_visible=eq.true&limit=1`, { headers }).catch(()=>null),
      fetch(`${env.SUPABASE_URL}/rest/v1/final_balance_payment_requests?select=id,booking_id,status,amount_cents,currency,checkout_url,payment_url,provider_status,notes,created_at&booking_id=eq.${bookingId}&order=created_at.desc`, { headers }).catch(()=>null)
    ]);

    if (!updatesResult.response.ok) return json({ error: `Could not load updates. ${await updatesResult.response.text()}` }, 500);
    if (!mediaResult.response.ok) return json({ error: `Could not load media. ${await mediaResult.response.text()}` }, 500);
    for (const [label, res] of [["signoffs", signoffsRes], ["checklist", checklistRes], ["products used", usageRes], ["booking events", eventsRes]]) {
      if (!res.ok) return json({ error: `Could not load ${label}. ${await res.text()}` }, 500);
    }

    const [updatesRaw, mediaRaw, signoffs, checklistRows, productsUsed, bookingEvents] = await Promise.all([
      updatesResult.response.json().catch(() => []),
      mediaResult.response.json().catch(() => []),
      signoffsRes.json().catch(() => []),
      checklistRes.json().catch(() => []),
      usageRes.json().catch(() => []),
      eventsRes.json().catch(() => [])
    ]);
    const incidentReports = incidentsRes.ok ? await incidentsRes.json().catch(() => []) : [];
    const completedSummaryRows = summaryRes && summaryRes.ok ? await summaryRes.json().catch(()=>[]) : [];
    const completedJobSummary = Array.isArray(completedSummaryRows) ? completedSummaryRows[0] || null : null;
    const paymentLinkRows = paymentLinksRes && paymentLinksRes.ok ? await paymentLinksRes.json().catch(()=>[]) : [];
    const now = new Date();
    const paymentLinks = (Array.isArray(paymentLinkRows) ? paymentLinkRows : []).map((row) => {
      const rawStatus = String(row.status || 'open').toLowerCase();
      const state = row.paid_at || /paid|succeeded|settled|complete/.test(rawStatus) ? 'paid' : (row.cancelled_at || /cancel/.test(rawStatus) ? 'cancelled' : (row.expires_at && new Date(row.expires_at) <= now ? 'expired' : 'open'));
      return {
        id:row.id, status:row.status || state, state, amount_cents:row.amount_cents, currency:row.currency || 'CAD',
        url:state === 'open' ? (row.checkout_url || row.payment_url || null) : null,
        provider_status:row.provider_status || null, notes:row.notes || null, created_at:row.created_at,
        paid_at:row.paid_at || null, expires_at:row.expires_at || null
      };
    });
    const updates = customerRows(updatesRaw);
    const media = await hydrateMediaRows(env, customerRows(mediaRaw));
    const workflowEvents = publicWorkflowEvents(bookingEvents);
    const previousViewedAt = booking.progress_last_viewed_at ? new Date(booking.progress_last_viewed_at).getTime() : 0;
    const unreadCount = [...updates, ...media].filter((row) => {
      if (String(row.source_channel || "staff").toLowerCase() === "customer") return false;
      const stamp = new Date(row.customer_visible_at || row.created_at || 0).getTime();
      return stamp > previousViewedAt;
    }).length;
    const packageName = booking.package_code ? booking.package_code.split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ") : "";

    await markViewed(env, bookingId);

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
        detailer_response_reason: null,
        dispatched_at: booking.dispatched_at || null,
        arrived_at: booking.arrived_at || null,
        detailing_started_at: booking.detailing_started_at || null,
        detailing_completed_at: booking.detailing_completed_at || null,
        completed_summary_status: booking.completed_summary_status || null
      },
      updates,
      media,
      signoffs: Array.isArray(signoffs) ? signoffs : [],
      checklist: Array.isArray(checklistRows) ? checklistRows[0] || null : null,
      products_used: Array.isArray(productsUsed) ? productsUsed : [],
      workflow_events: workflowEvents,
      incident_reports: Array.isArray(incidentReports) ? incidentReports : [],
      completed_job_summary: completedJobSummary,
      payment_links: paymentLinks,
      unread_count: unreadCount,
      incident_report_notice: incidentsRes.ok ? null : "Incident report sharing is not available yet.",
      enhanced_live_feed: !updatesResult.legacy && !mediaResult.legacy,
      refresh_after_seconds: 20
    });
  } catch (err) {
    return json({ error: err?.message || "Unexpected server error." }, 500);
  }
}

function customerRows(rows) {
  return (Array.isArray(rows) ? rows : []).filter((row) => {
    if (String(row.visibility || "customer").toLowerCase() !== "customer") return false;
    if (["hidden", "internal_only"].includes(String(row.thread_status || "visible"))) return false;
    if (row.review_status && !["approved", "not_required"].includes(String(row.review_status))) return false;
    return true;
  });
}

async function fetchAdaptive(env, headers, table, bookingId, enhancedSelect, legacySelect) {
  const make = (select) => fetch(`${env.SUPABASE_URL}/rest/v1/${table}?select=${select}&booking_id=eq.${encodeURIComponent(bookingId)}&visibility=eq.customer&order=created_at.desc`, { headers });
  let response = await make(enhancedSelect);
  if (response.ok) return { response, legacy: false };
  const text = await response.text();
  if (!schemaLooksLegacy(text)) return { response: new Response(text, { status: response.status, headers: response.headers }), legacy: false };
  response = await make(legacySelect);
  return { response, legacy: true };
}

async function markViewed(env, bookingId) {
  await fetch(`${env.SUPABASE_URL}/rest/v1/bookings?id=eq.${encodeURIComponent(bookingId)}`, {
    method: "PATCH",
    headers: { ...serviceHeaders(env), Prefer: "return=minimal" },
    body: JSON.stringify({ progress_last_viewed_at: new Date().toISOString() })
  }).catch(() => null);
}

function serviceHeaders(env) {
  return { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, "Content-Type": "application/json" };
}
function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
}
