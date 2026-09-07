// Build 359 — read-only customer retention dashboard.
// Exact customer_profile_id linkage only. No fuzzy/email identity joins, writes, queues, scores, or schema changes.
import { requireStaffAccess, json, serviceHeaders, isUuid } from '../_lib/staff-auth.js';
import { customerAccessLevel } from '../_lib/customer-admin.js';

export async function onRequest(context) {
  const method = String(context.request?.method || 'GET').toUpperCase();
  if (method === 'OPTIONS') return onRequestOptions();
  if (method === 'POST') return onRequestPost(context);
  return withCors(json({ error:'Method not allowed.', allowed_methods:['POST','OPTIONS'] }, 405));
}

export async function onRequestOptions() {
  return new Response('', { status:204, headers:corsHeaders() });
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const access = await requireStaffAccess({
      request,
      env,
      body,
      capability:'view_live_ops',
      allowLegacyAdminFallback:true
    });
    if (!access.ok) return withCors(access.response);
    if (customerAccessLevel(access.actor) === 'none') return withCors(json({ error:'Permission denied.' }, 403));

    const customerProfileId = String(body.customer_profile_id || '').trim();
    if (!isUuid(customerProfileId)) return withCors(json({ error:'A valid customer_profile_id is required.' }, 400));

    const headers = serviceHeaders(env);
    const encodedId = encodeURIComponent(customerProfileId);
    const [profileRes, bookingsRes, vehiclesRes] = await Promise.all([
      fetch(`${env.SUPABASE_URL}/rest/v1/customer_profiles?select=id,full_name,email,tier_code,is_active,archived_at&id=eq.${encodedId}&limit=1`, { headers }),
      fetch(`${env.SUPABASE_URL}/rest/v1/bookings?select=id,customer_profile_id,status,job_status,service_date,created_at,completed_at,price_total_cents&customer_profile_id=eq.${encodedId}&order=service_date.asc,created_at.asc&limit=500`, { headers }),
      fetch(`${env.SUPABASE_URL}/rest/v1/customer_vehicles?select=id,customer_profile_id,vehicle_name,model_year,make,model,is_primary,updated_at,next_cleaning_due_at,service_interval_days,next_service_mileage_km,auto_schedule_opt_in,notification_opt_in,last_package_code&customer_profile_id=eq.${encodedId}&order=is_primary.desc,updated_at.desc&limit=100`, { headers })
    ]);

    if (!profileRes.ok) return withCors(json({ error:`Could not load customer profile. ${await profileRes.text()}` }, 500));
    if (!bookingsRes.ok) return withCors(json({ error:`Could not load linked booking history. ${await bookingsRes.text()}` }, 500));
    if (!vehiclesRes.ok) return withCors(json({ error:`Could not load saved vehicles. ${await vehiclesRes.text()}` }, 500));

    const profiles = await profileRes.json().catch(() => []);
    const profile = Array.isArray(profiles) ? profiles[0] || null : null;
    if (!profile) return withCors(json({ error:'Customer profile not found.' }, 404));

    const bookings = safeRows(await bookingsRes.json().catch(() => []));
    const vehicles = safeRows(await vehiclesRes.json().catch(() => []));
    const exactBookings = bookings.filter((row) => String(row.customer_profile_id || '') === customerProfileId);
    const exactVehicles = vehicles.filter((row) => String(row.customer_profile_id || '') === customerProfileId);

    const completed = exactBookings
      .filter(isCompletedBooking)
      .sort((a, b) => retentionTime(a) - retentionTime(b));
    const open = exactBookings
      .filter(isOpenBooking)
      .sort((a, b) => serviceTime(a) - serviceTime(b));

    const completedCount = completed.length;
    const first = completed[0] || null;
    const last = completed[completed.length - 1] || null;
    const maintenanceVehicles = exactVehicles.filter(hasMaintenanceInterest);

    return withCors(json({
      ok:true,
      build:359,
      read_only:true,
      identity_rule:'exact_customer_profile_id_only',
      customer:{
        id:profile.id,
        full_name:profile.full_name || null,
        email:profile.email || null,
        tier_code:profile.tier_code || null,
        is_active:profile.is_active === true,
        archived_at:profile.archived_at || null
      },
      retention:{
        first_completed_service:serviceSnapshot(first),
        last_completed_service:serviceSnapshot(last),
        completed_service_count:completedCount,
        repeat_service_count:Math.max(completedCount - 1, 0),
        repeat_customer:completedCount > 1,
        open_booking_count:open.length,
        open_bookings:open.map(serviceSnapshot),
        saved_vehicle_count:exactVehicles.length,
        saved_vehicles:exactVehicles.map(vehicleSnapshot),
        maintenance_interest:{
          value:maintenanceVehicles.length > 0,
          source:'explicit_customer_vehicle_planning',
          vehicle_count:maintenanceVehicles.length
        },
        fleet_interest:{
          value:null,
          source:'unknown_no_explicit_customer_profile_link',
          note:'Fleet lead contact data is not treated as customer identity.'
        }
      },
      safeguards:{
        fuzzy_identity_merge:false,
        email_identity_merge:false,
        inferred_outreach_consent:false,
        persistent_retention_score:false,
        crm_queue:false,
        polling:false,
        writes:false
      }
    }));
  } catch (error) {
    return withCors(json({ error:error?.message || 'Could not load customer retention dashboard.' }, 500));
  }
}

export async function onRequestGet() { return withCors(json({ error:'Method not allowed.' }, 405)); }
export async function onRequestPut() { return withCors(json({ error:'Method not allowed.' }, 405)); }
export async function onRequestPatch() { return withCors(json({ error:'Method not allowed.' }, 405)); }
export async function onRequestDelete() { return withCors(json({ error:'Method not allowed.' }, 405)); }

function safeRows(value) { return Array.isArray(value) ? value : []; }
function normalizedStatus(row) { return [row?.status, row?.job_status].map((v) => String(v || '').trim().toLowerCase()); }
function isCompletedBooking(row) {
  const statuses = normalizedStatus(row);
  return Boolean(row?.completed_at) && statuses.includes('completed');
}
function isOpenBooking(row) {
  const statuses = normalizedStatus(row);
  return !statuses.includes('cancelled') && !statuses.includes('completed');
}
function retentionTime(row) { return Date.parse(row?.completed_at || row?.service_date || row?.created_at || '') || 0; }
function serviceTime(row) { return Date.parse(row?.service_date || row?.created_at || '') || Number.MAX_SAFE_INTEGER; }
function serviceSnapshot(row) {
  if (!row) return null;
  return {
    booking_id:row.id || null,
    service_date:row.service_date || null,
    completed_at:row.completed_at || null,
    status:row.status || null,
    job_status:row.job_status || null,
    price_total_cents:Number(row.price_total_cents || 0)
  };
}
function vehicleSnapshot(row) {
  return {
    id:row.id || null,
    vehicle_name:row.vehicle_name || null,
    model_year:row.model_year ?? null,
    make:row.make || null,
    model:row.model || null,
    is_primary:row.is_primary === true,
    next_cleaning_due_at:row.next_cleaning_due_at || null,
    service_interval_days:numberOrNull(row.service_interval_days),
    next_service_mileage_km:numberOrNull(row.next_service_mileage_km),
    auto_schedule_opt_in:row.auto_schedule_opt_in === true,
    notification_opt_in:row.notification_opt_in === true,
    last_package_code:row.last_package_code || null,
    updated_at:row.updated_at || null
  };
}
function hasMaintenanceInterest(row) {
  return Boolean(
    row?.next_cleaning_due_at ||
    numberOrNull(row?.service_interval_days) !== null ||
    numberOrNull(row?.next_service_mileage_km) !== null ||
    row?.auto_schedule_opt_in === true ||
    row?.notification_opt_in === true
  );
}
function numberOrNull(value) {
  if (value === null || value === undefined || String(value).trim() === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin':'*',
    'Access-Control-Allow-Methods':'POST,OPTIONS',
    'Access-Control-Allow-Headers':'Content-Type,x-admin-password,x-staff-email,x-staff-user-id',
    'Cache-Control':'no-store'
  };
}
function withCors(response) {
  const headers = new Headers(response.headers || {});
  for (const [key, value] of Object.entries(corsHeaders())) headers.set(key, value);
  return new Response(response.body, { status:response.status, statusText:response.statusText, headers });
}
