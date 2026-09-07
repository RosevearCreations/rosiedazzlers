// Build 360 — CRM Operational Work Queue.
// Derived from exact customer_profile_id relationships; no schema change and no automatic outreach.
import { requireStaffAccess, json, serviceHeaders, isUuid } from '../_lib/staff-auth.js';
import { customerAccessLevel, addCustomerAudit, loadCustomerProfile } from '../_lib/customer-admin.js';
import {
  CRM_QUEUE_POLICY,
  normalizeCrmQueueAction,
  deriveCrmOperationalQueue,
  crmQueueMetrics,
  crmQueueActions,
  queueAuditEventType,
  queueAuditSummary
} from '../_lib/crm-operational-work-queue.js';

const PROFILE_LIMIT = 500;
const BOOKING_LIMIT = 5000;
const VEHICLE_LIMIT = 2000;
const AUDIT_LIMIT = 2000;

export async function onRequest(context) {
  const method = String(context.request?.method || 'GET').toUpperCase();
  if (method === 'OPTIONS') return onRequestOptions();
  if (method === 'GET') return onRequestGet(context);
  if (method === 'POST') return onRequestPost(context);
  return withCors(json({ error:'Method not allowed.', allowed_methods:['GET','POST','OPTIONS'] }, 405));
}

export async function onRequestOptions() { return new Response('', { status:204, headers:corsHeaders() }); }

export async function onRequestGet({ request, env }) {
  try {
    const query = Object.fromEntries(new URL(request.url).searchParams.entries());
    const access = await requireStaffAccess({ request, env, body:query, capability:'view_live_ops', allowLegacyAdminFallback:true });
    if (!access.ok) return withCors(access.response);
    if (customerAccessLevel(access.actor) === 'none') return withCors(json({ error:'Permission denied.' }, 403));

    const source = await loadQueueSources(env);
    const queue = deriveCrmOperationalQueue({
      profiles:source.profiles,
      bookings:source.bookings,
      vehicles:source.vehicles,
      auditEvents:source.audit_events,
      now:new Date()
    });

    return withCors(json({
      ok:true,
      build:360,
      queue,
      metrics:crmQueueMetrics(queue),
      actions:crmQueueActions(),
      policy:CRM_QUEUE_POLICY,
      identity_rule:'exact_customer_profile_id_only',
      readiness:{
        derived_queue:true,
        schema_change:false,
        persistent_score:false,
        fuzzy_identity_merge:false,
        inferred_outreach_consent:false,
        automatic_notifications:false,
        automatic_booking_creation:false,
        automatic_payment_action:false,
        staff_audit_actions:true
      },
      coverage:{
        profiles_loaded:source.profiles.length,
        bookings_loaded:source.bookings.length,
        vehicles_loaded:source.vehicles.length,
        audit_events_loaded:source.audit_events.length,
        profile_limit:PROFILE_LIMIT,
        booking_limit:BOOKING_LIMIT,
        vehicle_limit:VEHICLE_LIMIT,
        audit_limit:AUDIT_LIMIT,
        possibly_truncated:source.profiles.length >= PROFILE_LIMIT || source.bookings.length >= BOOKING_LIMIT || source.vehicles.length >= VEHICLE_LIMIT || source.audit_events.length >= AUDIT_LIMIT
      }
    }));
  } catch (error) {
    console.error('Could not load CRM operational work queue.', error);
    return withCors(json({ error:error?.message || 'Could not load CRM operational work queue.' }, 500));
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const access = await requireStaffAccess({ request, env, body, capability:'manage_bookings', allowLegacyAdminFallback:true });
    if (!access.ok) return withCors(access.response);
    if (customerAccessLevel(access.actor) !== 'manager') return withCors(json({ error:'Manager customer access is required to record CRM queue outcomes.' }, 403));

    const normalized = normalizeCrmQueueAction(body);
    if (!normalized.ok) return withCors(json({ error:normalized.error }, 400));
    if (!isUuid(normalized.customer_profile_id)) return withCors(json({ error:'A valid customer_profile_id is required.' }, 400));

    const profile = await loadCustomerProfile(env, normalized.customer_profile_id);
    if (!profile || profile.archived_at || profile.is_active !== true) return withCors(json({ error:'Active customer profile not found.' }, 404));
    if (normalized.action === 'contacted' && ![profile.email, profile.phone, profile.sms_phone].some((value) => String(value || '').trim())) {
      return withCors(json({ error:'No contact method is recorded for this customer.' }, 409));
    }

    await addCustomerAudit(env, {
      customerProfileId:normalized.customer_profile_id,
      eventType:queueAuditEventType(normalized.action),
      actor:access.actor || {},
      safeSummary:queueAuditSummary(normalized.action, normalized.note)
    });

    return withCors(json({
      ok:true,
      build:360,
      customer_profile_id:normalized.customer_profile_id,
      action:normalized.action,
      audit_recorded:true,
      sends_notification:false,
      creates_booking:false,
      changes_customer_profile:false,
      infers_outreach_consent:false
    }, 201));
  } catch (error) {
    console.error('Could not record CRM operational queue action.', error);
    return withCors(json({ error:error?.message || 'Could not record CRM operational queue action.' }, 500));
  }
}

export async function onRequestPut() { return withCors(json({ error:'Method not allowed.' }, 405)); }
export async function onRequestPatch() { return withCors(json({ error:'Method not allowed.' }, 405)); }
export async function onRequestDelete() { return withCors(json({ error:'Method not allowed.' }, 405)); }

async function loadQueueSources(env) {
  const headers = serviceHeaders(env);
  const auditTypes = 'crm_queue_reviewed,crm_queue_contacted,crm_queue_no_contact_needed';
  const [profileRes, bookingRes, vehicleRes, auditRes] = await Promise.all([
    fetch(`${env.SUPABASE_URL}/rest/v1/customer_profiles?select=id,full_name,email,phone,sms_phone,tier_code,notification_opt_in,notification_channel,is_active,archived_at&is_active=eq.true&archived_at=is.null&order=updated_at.desc&limit=${PROFILE_LIMIT}`, { headers }),
    fetch(`${env.SUPABASE_URL}/rest/v1/bookings?select=id,customer_profile_id,status,job_status,service_date,completed_at,created_at,price_total_cents&customer_profile_id=not.is.null&order=completed_at.desc.nullslast,service_date.desc.nullslast,created_at.desc&limit=${BOOKING_LIMIT}`, { headers }),
    fetch(`${env.SUPABASE_URL}/rest/v1/customer_vehicles?select=id,customer_profile_id,vehicle_name,model_year,make,model,is_primary,next_cleaning_due_at,service_interval_days,next_service_mileage_km,auto_schedule_opt_in,notification_opt_in,updated_at&customer_profile_id=not.is.null&order=updated_at.desc&limit=${VEHICLE_LIMIT}`, { headers }),
    fetch(`${env.SUPABASE_URL}/rest/v1/customer_admin_audit_events?select=customer_profile_id,event_type,safe_summary,created_at&event_type=in.(${auditTypes})&order=created_at.desc&limit=${AUDIT_LIMIT}`, { headers })
  ]);

  for (const [label, response] of [['customer profiles',profileRes],['bookings',bookingRes],['customer vehicles',vehicleRes],['CRM audit history',auditRes]]) {
    if (!response.ok) throw new Error(`Could not load ${label}. ${await response.text()}`);
  }
  return {
    profiles:safeRows(await profileRes.json().catch(() => [])),
    bookings:safeRows(await bookingRes.json().catch(() => [])),
    vehicles:safeRows(await vehicleRes.json().catch(() => [])),
    audit_events:safeRows(await auditRes.json().catch(() => []))
  };
}

function safeRows(value) { return Array.isArray(value) ? value : []; }
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin':'*',
    'Access-Control-Allow-Methods':'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers':'Content-Type,x-admin-password,x-staff-email,x-staff-user-id',
    'Cache-Control':'no-store'
  };
}
function withCors(response) {
  const headers = new Headers(response.headers || {});
  for (const [key, value] of Object.entries(corsHeaders())) headers.set(key, value);
  return new Response(response.body, { status:response.status, statusText:response.statusText, headers });
}
