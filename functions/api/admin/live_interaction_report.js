// Build 209 — operational health report for live detailer/customer interaction.
import { requireStaffAccess, serviceHeaders, json } from "../_lib/staff-auth.js";

export async function onRequestGet({ request, env }) {
  try {
    const access = await requireStaffAccess({
      request,
      env,
      capability: "manage_progress",
      allowLegacyAdminFallback: true
    });
    if (!access.ok) return withCors(access.response);

    const snapshot = await loadSnapshot(env);
    const metrics = summarize(snapshot);
    return withCors(json({
      ok: true,
      build: 209,
      metrics,
      enhanced_schema_available: snapshot.enhanced_schema_available,
      fallback_active: snapshot.fallback_active,
      warnings: snapshot.warnings,
      workflow: [
        { key:"customer", label:"Customer now", description:"Immediately appears in the secure customer progress timeline." },
        { key:"review", label:"Admin review first", description:"Private until an administrator approves the customer-safe version." },
        { key:"internal", label:"Staff only", description:"Visible only to detailers and administrators." }
      ],
      safeguards: [
        "Customer progress only returns approved customer-safe updates and media.",
        "Internal booking-event notes are filtered from the public timeline.",
        "Private uploads may use short-lived signed storage URLs.",
        "Every photo, video, and note carries a stage and visibility decision."
      ],
      recommendation: metrics.pending_review
        ? `Review ${metrics.pending_review} pending live update(s) before publishing to customers.`
        : "Use Detailer Jobs for live posting and Admin Progress for moderation and customer-safe publishing."
    }));
  } catch (err) {
    return withCors(json({ ok:false, error:err?.message || "Could not load live interaction health." }, 500));
  }
}

async function loadSnapshot(env) {
  const base = {
    updates: [],
    media: [],
    bookings: [],
    enhanced_schema_available: true,
    fallback_active: false,
    warnings: []
  };
  if (!env?.SUPABASE_URL || !env?.SUPABASE_SERVICE_ROLE_KEY) {
    return { ...base, enhanced_schema_available:false, fallback_active:true, warnings:["Supabase environment variables are not configured."] };
  }
  const headers = serviceHeaders(env);
  base.updates = await adaptiveRows({
    env, headers, table:"job_updates",
    enhanced:"select=id,booking_id,created_at,visibility,thread_status,stage,review_status,requires_admin_review,customer_action_required,customer_visible_at&order=created_at.desc&limit=200",
    legacy:"select=id,booking_id,created_at,visibility,thread_status&order=created_at.desc&limit=200",
    base
  });
  base.media = await adaptiveRows({
    env, headers, table:"job_media",
    enhanced:"select=id,booking_id,created_at,visibility,thread_status,stage,review_status,requires_admin_review,customer_action_required,customer_visible_at,storage_bucket,storage_path,media_url,kind&order=created_at.desc&limit=200",
    legacy:"select=id,booking_id,created_at,visibility,thread_status,media_url,kind&order=created_at.desc&limit=200",
    base
  });
  base.bookings = await adaptiveRows({
    env, headers, table:"bookings",
    enhanced:"select=id,status,job_status,progress_enabled,progress_last_viewed_at,progress_last_customer_message_at,progress_last_staff_update_at,service_date,customer_name&progress_enabled=eq.true&order=service_date.desc&limit=100",
    legacy:"select=id,status,job_status,progress_enabled,service_date,customer_name&progress_enabled=eq.true&order=service_date.desc&limit=100",
    base
  });
  return base;
}

async function adaptiveRows({ env, headers, table, enhanced, legacy, base }) {
  const root = `${env.SUPABASE_URL}/rest/v1/${table}?`;
  try {
    let response = await fetch(`${root}${enhanced}`, { headers, cache:"no-store" });
    if (response.ok) return await response.json().catch(() => []);
    if ([400,404,406].includes(response.status)) {
      base.enhanced_schema_available = false;
      base.fallback_active = true;
      base.warnings.push(`${table} is using legacy columns until the Build 209 migration is applied.`);
      response = await fetch(`${root}${legacy}`, { headers, cache:"no-store" });
      if (response.ok) return await response.json().catch(() => []);
    }
    base.fallback_active = true;
    base.warnings.push(`${table} health query returned ${response.status}.`);
  } catch (err) {
    base.fallback_active = true;
    base.warnings.push(`${table} health query failed: ${err?.message || "fetch failed"}`);
  }
  return [];
}

function summarize(snapshot) {
  const rows = [
    ...snapshot.updates.map((row) => ({ ...row, content_type:"note" })),
    ...snapshot.media.map((row) => ({ ...row, content_type:row.kind || "media" }))
  ];
  const pending = rows.filter((row) => clean(row.review_status) === "pending" || row.requires_admin_review === true);
  const internal = rows.filter((row) => clean(row.visibility) === "internal" || clean(row.thread_status) === "internal_only");
  const customer = rows.filter((row) => clean(row.visibility) === "customer" && !["hidden","internal_only"].includes(clean(row.thread_status)) && clean(row.review_status) !== "pending");
  const action = rows.filter((row) => row.customer_action_required === true);
  const stored = snapshot.media.filter((row) => row.storage_bucket && row.storage_path);
  const external = snapshot.media.filter((row) => /^https?:\/\//i.test(String(row.media_url || "")) && !row.storage_path);
  const activeBookings = snapshot.bookings.filter((row) => !["completed","cancelled","declined"].includes(clean(row.job_status || row.status)));
  const customerMessages = snapshot.bookings.filter((row) => row.progress_last_customer_message_at).length;
  return {
    total_live_items: rows.length,
    customer_visible: customer.length,
    pending_review: pending.length,
    staff_only: internal.length,
    customer_action_required: action.length,
    stored_private_media: stored.length,
    external_media_links: external.length,
    progress_enabled_bookings: snapshot.bookings.length,
    active_progress_bookings: activeBookings.length,
    bookings_with_customer_messages: customerMessages,
    photos: snapshot.media.filter((row) => clean(row.kind) === "photo").length,
    videos: snapshot.media.filter((row) => clean(row.kind) === "video").length,
    notes: snapshot.updates.length
  };
}

function clean(value) { return String(value || "").trim().toLowerCase(); }
export async function onRequestOptions() { return new Response("", { status:204, headers:corsHeaders() }); }
function corsHeaders() { return { "Access-Control-Allow-Origin":"*", "Access-Control-Allow-Methods":"GET,OPTIONS", "Access-Control-Allow-Headers":"Content-Type,x-admin-password,x-staff-user-id,x-staff-email", "Cache-Control":"no-store" }; }
function withCors(response) { const headers = new Headers(response.headers || {}); for (const [key,value] of Object.entries(corsHeaders())) headers.set(key,value); return new Response(response.body, { status:response.status, statusText:response.statusText, headers }); }
