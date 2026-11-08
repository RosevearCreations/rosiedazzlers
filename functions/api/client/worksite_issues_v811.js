// Build 811: verified account-scoped worksite concerns; never mutate a booking.
import { getCurrentCustomerSession, serviceHeaders } from '../_lib/customer-session.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CATEGORIES = new Set(['parking_access','site_rules','utilities_restriction','weather','vehicle_condition','arrival_contact','other']);
const CLOSED = new Set(['completed','cancelled','canceled','refunded','no_show']);
const SELECT = 'id,booking_id,category,customer_description,status,submitted_at,updated_at,reviewed_at,customer_visible_resolution,staff_acknowledged_at,arrival_escalation_status';

export function sameOrigin811(request) {
  const origin = request.headers.get('origin');
  const site = request.headers.get('sec-fetch-site');
  if (!origin || (site && !['same-origin','none'].includes(site))) return false;
  try { return new URL(origin).origin === new URL(request.url).origin; } catch { return false; }
}

export function validIssue811(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  const booking_id = String(body.booking_id || '').trim();
  const client_request_id = String(body.client_request_id || '').trim();
  const category = String(body.category || '').trim();
  const customer_description = typeof body.description === 'string' ? body.description.trim() : '';
  if (!UUID.test(booking_id) || !UUID.test(client_request_id) || !CATEGORIES.has(category) ||
      customer_description.length < 15 || customer_description.length > 1000) return null;
  return { booking_id, client_request_id, category, customer_description };
}

export function safeCustomerIssue811(row) {
  return { id:row.id, booking_id:row.booking_id, category:row.category,
    description:row.customer_description, status:row.status, submitted_at:row.submitted_at,
    updated_at:row.updated_at, reviewed_at:row.reviewed_at,
    resolution:row.customer_visible_resolution,staff_acknowledged_at:row.staff_acknowledged_at||null,
    arrival_escalation_status:row.arrival_escalation_status||'none' };
}

export function bookingAllowsIssue811(row, today) {
  return Boolean(row && !row.detailing_completed_at && !CLOSED.has(String(row.status || '').toLowerCase()) &&
    !CLOSED.has(String(row.job_status || '').toLowerCase()) && typeof row.service_date === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(row.service_date) && row.service_date >= today);
}

export const onRequestOptions = () => json({ok:false,error:'Method not allowed.'},405,{Allow:'GET, POST'});

export async function onRequestGet({request,env}) {
  try {
    const identity = await customerIdentity811(request,env);
    if (!identity) return json({ok:false,error:'Sign in to view worksite concerns.'},401);
    const rows = await loadRows(env,`customer_worksite_issues_v811?select=${SELECT}&customer_profile_id=eq.${encodeURIComponent(identity.profileId)}&order=submitted_at.desc&limit=50`);
    return json({ok:true,issues:rows.map(safeCustomerIssue811),authority:{staff_review_required:true,booking_unchanged:true,notification_sent:false}});
  } catch { return json({ok:false,error:'Worksite concern history is unavailable. Please try again.'},503); }
}

export async function onRequestPost({request,env}) {
  try {
    if (!sameOrigin811(request)) return json({ok:false,error:'Submit this request from your account.'},403);
    if (!(request.headers.get('content-type') || '').toLowerCase().startsWith('application/json')) return json({ok:false,error:'JSON is required.'},415);
    const identity = await customerIdentity811(request,env);
    if (!identity) return json({ok:false,error:'Sign in before reporting an issue.'},401);
    const raw = await request.text();
    if (raw.length > 2500) return json({ok:false,error:'The report is too large.'},413);
    const validated = validIssue811(JSON.parse(raw));
    if (!validated) return json({ok:false,error:'Choose an appointment and issue type, and describe the concern in 15–1000 characters.'},400);
    const {booking_id,client_request_id,category,customer_description} = validated;
    const owned = await loadRows(env,`bookings?select=id,customer_profile_id,customer_email,service_date,status,job_status,detailing_completed_at&id=eq.${encodeURIComponent(booking_id)}&customer_email=eq.${encodeURIComponent(identity.email)}&limit=1`);
    const booking = owned[0];
    if (!booking || (booking.customer_profile_id && booking.customer_profile_id !== identity.profileId)) return json({ok:false,error:'That appointment is not available in your account.'},404);
    // Check idempotency before date/closure checks: a saved report may be safely re-read.
    const prior = await loadRows(env,`customer_worksite_issues_v811?select=${SELECT},client_request_id&customer_profile_id=eq.${encodeURIComponent(identity.profileId)}&client_request_id=eq.${encodeURIComponent(client_request_id)}&limit=1`);
    if (prior.length) {
      const match = prior[0];
      if (match.booking_id !== booking_id || match.category !== category || match.customer_description !== customer_description) return json({ok:false,error:'This report reference was already used for different content.'},409);
      return json({ok:true,duplicate:true,issue:safeCustomerIssue811(match),appointment_changed:false,notification_sent:false});
    }
    const today = torontoToday811();
    if (!bookingAllowsIssue811(booking,today)) return json({ok:false,error:'This appointment is no longer open for a new worksite report. Contact Rosie directly.'},409);
    const insert = await fetch(`${env.SUPABASE_URL}/rest/v1/customer_worksite_issues_v811?select=${SELECT}`,{
      method:'POST', headers:{...serviceHeaders(env),Prefer:'return=representation'},
      body:JSON.stringify([{...validated,customer_profile_id:identity.profileId,status:'pending_review'}])
    });
    if (insert.status === 409) return json({ok:false,error:'A worksite issue for this appointment is already under review. Check its status before submitting again.'},409);
    if (!insert.ok) return json({ok:false,error:'Could not save the report. Please try again.'},503);
    const rows = await insert.json().catch(()=>[]);
    if (!Array.isArray(rows) || !rows[0]) return json({ok:false,error:'The saved report could not be confirmed. Refresh your issue history before retrying.'},503);
    return json({ok:true,duplicate:false,issue:safeCustomerIssue811(rows[0]),appointment_changed:false,notification_sent:false},201);
  } catch(error) {
    if (error instanceof SyntaxError) return json({ok:false,error:'Invalid report format.'},400);
    return json({ok:false,error:'Worksite report service is unavailable. Check history before trying again.'},503);
  }
}

async function customerIdentity811(request,env) {
  if (!env?.SUPABASE_URL || !env?.SUPABASE_SERVICE_ROLE_KEY) return null;
  const session = await getCurrentCustomerSession({env,request});
  const profileId = String(session?.customer_profile?.id || '').trim();
  const email = String(session?.customer_profile?.email || '').trim().toLowerCase();
  return UUID.test(profileId) && email.includes('@') ? {profileId,email} : null;
}

async function loadRows(env,path) {
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`,{headers:serviceHeaders(env)});
  if (!response.ok) throw new Error('Source unavailable');
  const rows = await response.json();
  if (!Array.isArray(rows)) throw new Error('Unexpected source data');
  return rows;
}

function torontoToday811() {
  const parts = new Intl.DateTimeFormat('en-CA',{timeZone:'America/Toronto',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
  const part = type => parts.find(row=>row.type===type)?.value || '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}

function json(data,status=200,extra={}) {return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...extra}});}
