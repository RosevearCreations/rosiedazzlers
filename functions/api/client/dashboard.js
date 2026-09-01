import { getCurrentCustomerSession, touchCustomerSession, rotateCustomerSession, appendSetCookie, serviceHeaders } from "../_lib/customer-session.js";
import { customerSafeProfile, customerSafeVehicles, customerSafeReviews, customerSafeTier } from "./_lib/customer-safe-shape.js";

export async function onRequestOptions() { return new Response("", { status: 204, headers: corsHeaders() }); }
export async function onRequestGet(context) { return handle(context); }
export async function onRequestPost(context) { return handle(context); }

async function handle(context) {
  const { request, env } = context;
  try {
    if (!env?.SUPABASE_URL) {
      return dashboardJson(emptyDashboardPayload({ code: "configuration_incomplete", error: "Customer dashboard is temporarily unavailable because Supabase is not configured." }));
    }

    let current = null;
    try { current = await getCurrentCustomerSession({ env, request }); }
    catch (sessionErr) {
      return dashboardJson(emptyDashboardPayload({ code: "session_storage_unavailable", error: "Customer dashboard sign-in storage is temporarily unavailable.", detail: safeErrorMessage(sessionErr) }));
    }

    if (!current?.customer_profile?.id) {
      return dashboardJson(emptyDashboardPayload({ code: "not_authenticated", error: "Sign in required to view the customer dashboard." }), 200, current?.clear_cookie || null);
    }

    await touchCustomerSession({ env, sessionId: current.session?.id || null, request });
    let rotatedCookie = null;
    if (current.needs_rotation === true) {
      const rotated = await rotateCustomerSession({ env, request, currentSession: current.session, customerProfile: current.customer_profile });
      rotatedCookie = rotated.cookie || null;
    }

    const headers = serviceHeaders(env);
    const email = current.customer_profile.email;
    const tierCode = current.customer_profile.tier_code || current.customer_profile.customer_tier_code || null;
    const [profileRes, bookRes, giftRes, redeemRes, vehicleRes, vehicleMediaRes, tierRes, reviewRes] = await Promise.all([
      fetch(`${env.SUPABASE_URL}/rest/v1/customer_profiles?select=*&id=eq.${encodeURIComponent(current.customer_profile.id)}&limit=1`, { headers }).catch(() => null),
      fetch(`${env.SUPABASE_URL}/rest/v1/bookings?select=id,created_at,service_date,start_slot,status,job_status,package_code,vehicle_size,price_total_cents,deposit_cents,progress_enabled,progress_token,customer_tier_code,assigned_staff_name,vehicle_mileage_km&customer_email=eq.${encodeURIComponent(email)}&order=created_at.desc`, { headers }),
      fetch(`${env.SUPABASE_URL}/rest/v1/gift_certificates?select=id,code,sku,type,status,remaining_cents,face_value_cents,expires_at,currency,package_code,vehicle_size,created_at,purchaser_email,recipient_email&or=(purchaser_email.eq.${encodeURIComponent(email)},recipient_email.eq.${encodeURIComponent(email)})&order=created_at.desc`, { headers }),
      fetch(`${env.SUPABASE_URL}/rest/v1/gift_certificate_redemptions?select=id,gift_certificate_id,booking_id,amount_cents,created_at,notes,gift_certificate:gift_certificates(code,purchaser_email,recipient_email),booking:bookings(service_date,package_code,status)&order=created_at.desc`, { headers }).catch(() => null),
      fetch(`${env.SUPABASE_URL}/rest/v1/customer_vehicles?select=*&customer_profile_id=eq.${encodeURIComponent(current.customer_profile.id)}&order=display_order.asc,created_at.desc`, { headers }).catch(() => null),
      fetch(`${env.SUPABASE_URL}/rest/v1/customer_vehicle_media?select=*&customer_profile_id=eq.${encodeURIComponent(current.customer_profile.id)}&is_deleted=eq.false&order=is_primary.desc,created_at.desc`, { headers }).catch(() => null),
      tierCode ? fetch(`${env.SUPABASE_URL}/rest/v1/customer_tiers?select=*&code=eq.${encodeURIComponent(tierCode)}&limit=1`, { headers }).catch(() => null) : Promise.resolve(null),
      fetch(`${env.SUPABASE_URL}/rest/v1/customer_reviews?select=*&customer_profile_id=eq.${encodeURIComponent(current.customer_profile.id)}&order=created_at.desc`, { headers }).catch(() => null)
    ]);

    if (!bookRes.ok) return dashboardJson(emptyDashboardPayload({ code: "booking_history_unavailable", error: "Could not load booking history.", detail: await safeResponseText(bookRes) }));
    if (!giftRes.ok) return dashboardJson(emptyDashboardPayload({ code: "gift_certificate_history_unavailable", error: "Could not load gift certificates.", detail: await safeResponseText(giftRes) }));

    const profileRows = profileRes && profileRes.ok ? await profileRes.json().catch(() => []) : [];
    const profile = customerSafeProfile(Array.isArray(profileRows) ? profileRows[0] || current.customer_profile : current.customer_profile) || customerSafeProfile(current.customer_profile);
    const bookings = await bookRes.json().catch(() => []);
    const gifts = await giftRes.json().catch(() => []);
    const redemptionsAll = redeemRes && redeemRes.ok ? await redeemRes.json().catch(() => []) : [];
    const vehicleRows = vehicleRes && vehicleRes.ok ? await vehicleRes.json().catch(() => []) : [];
    const vehicles = customerSafeVehicles(vehicleRows);
    const vehicleMedia = vehicleMediaRes && vehicleMediaRes.ok ? await vehicleMediaRes.json().catch(() => []) : [];
    const tiers = tierRes && tierRes.ok ? await tierRes.json().catch(() => []) : [];
    const tier = customerSafeTier(Array.isArray(tiers) ? tiers[0] || null : null);
    const redemptions = Array.isArray(redemptionsAll) ? redemptionsAll.filter((row) => {
      const gift = row.gift_certificate || {};
      return (String(gift.purchaser_email || '').toLowerCase() === String(email || '').toLowerCase()) || (String(gift.recipient_email || '').toLowerCase() === String(email || '').toLowerCase());
    }) : [];
    const reviewRows = reviewRes && reviewRes.ok ? await reviewRes.json().catch(() => []) : [];
    const reviews = customerSafeReviews(reviewRows);
    const giftSummary = summarizeGiftCertificates(Array.isArray(gifts) ? gifts : [], Array.isArray(redemptions) ? redemptions : []);
    const vehiclesWithMedia = vehicles.map((v) => ({ ...v, media: Array.isArray(vehicleMedia) ? vehicleMedia.filter((m) => String(m.vehicle_id) === String(v.id)) : [] }));

    return dashboardJson({ ok: true, authenticated: true, customer: profile, tier, bookings: Array.isArray(bookings) ? bookings : [], vehicles: vehiclesWithMedia,
      vehicle_media: Array.isArray(vehicleMedia) ? vehicleMedia : [], gift_certificates: Array.isArray(gifts) ? gifts : [], redemptions: Array.isArray(redemptions) ? redemptions : [],
      gift_summary: giftSummary, reviews }, 200, rotatedCookie);
  } catch (err) {
    return dashboardJson(emptyDashboardPayload({ code: "dashboard_unavailable", error: "Customer dashboard is temporarily unavailable.", detail: safeErrorMessage(err) }));
  }
}

function emptyDashboardPayload({ code = "not_authenticated", error = "Sign in required to view the customer dashboard.", detail = null } = {}) {
  return { ok: false, authenticated: false, signed_out: code === "not_authenticated", code, error, detail, customer: null, tier: null, bookings: [], vehicles: [], vehicle_media: [], gift_certificates: [], redemptions: [], gift_summary: summarizeGiftCertificates([], []), reviews: [] };
}
function dashboardJson(data, status = 200, setCookie = null) {
  let headersOut = new Headers({ "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  if (setCookie) headersOut = appendSetCookie(headersOut, setCookie);
  headersOut = applyCors(headersOut);
  return new Response(JSON.stringify(data), { status, headers: headersOut });
}
function corsHeaders() { return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Cache-Control": "no-store" }; }
function applyCors(headers) { const out = headers instanceof Headers ? new Headers(headers) : new Headers(headers || {}); for (const [k, v] of Object.entries(corsHeaders())) if (!out.has(k)) out.set(k, v); return out; }
async function safeResponseText(response) { try { return await response.text(); } catch { return ""; } }
function safeErrorMessage(err) { return err?.message || String(err || "Unexpected server error."); }
function summarizeGiftCertificates(gifts, redemptions) {
  const rows = Array.isArray(gifts) ? gifts : []; const used = Array.isArray(redemptions) ? redemptions : []; const now = Date.now();
  let active_count = 0, active_remaining_cents = 0, expired_count = 0, redeemed_cents = 0;
  for (const row of rows) { const remaining = Number(row.remaining_cents || 0); const expiresAt = row.expires_at ? Date.parse(row.expires_at) : null; const expired = Number.isFinite(expiresAt) && expiresAt < now;
    if (expired) expired_count += 1; if (!expired && String(row.status || '').toLowerCase() !== 'void') { active_count += 1; active_remaining_cents += remaining > 0 ? remaining : 0; } }
  for (const row of used) redeemed_cents += Number(row.amount_cents || 0);
  return { active_count, active_remaining_cents, expired_count, redeemed_cents, redemption_count: used.length };
}
