// Build 744: authenticated, completed-service-only interest intake and readback.
// This endpoint never sends, schedules, bills, enrolls or discounts anything.
import { getCurrentCustomerSession, serviceHeaders } from '../_lib/customer-session.js';
import { completedService744, torontoMonth744, currentMarketingConsent744, INTEREST_KINDS744, CYCLE_HINTS744 } from '../../../assets/customer-followup-v744.mjs';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TABLE = 'customer_followup_interests_v744';
const BOOKING_FIELDS = 'id,customer_profile_id,customer_email,service_date,service_area,package_code,status,job_status,detailing_completed_at';
const INTEREST_FIELDS = 'id,source_booking_id,interest_kind,cycle_hint,interest_month,customer_note,review_status,submitted_at';
const PREF_FIELDS = 'id,recorded_at,service_email,service_sms,service_phone,marketing_email,marketing_sms,marketing_phone';

export async function onRequestOptions() { return json({ error:'Method not allowed.' },405,{Allow:'GET, POST'}); }

export async function onRequestGet({ request, env }) {
  try {
    const identity = await customerIdentity(request,env);
    if (!identity) return json({ok:false,error:'Sign in to view your follow-up options.'},401);
    const [bookings,interests,versions] = await Promise.all([
      rows(env,`bookings?select=${BOOKING_FIELDS}&customer_email=eq.${encodeURIComponent(identity.email)}&order=service_date.desc&limit=75`),
      rows(env,`${TABLE}?select=${INTEREST_FIELDS}&customer_profile_id=eq.${identity.id}&order=submitted_at.desc&limit=35`),
      rows(env,`customer_communication_preference_versions?select=${PREF_FIELDS}&customer_profile_id=eq.${identity.id}&order=recorded_at.desc,id.desc&limit=1`)
    ]);
    const history = bookings.filter((booking)=>ownedCompleted(booking,identity)).slice(0,12).map(safeService);
    const readiness = currentMarketingConsent744({profile:identity.profile,preference:versions[0]||null});
    return json({ok:true,authenticated:true,completed_services:history,interests:interests.map(safeInterest),
      marketing_contact_readiness:readiness,
      authority:{source:'actual_completed_bookings',availability_requires_live_check:true,one_car_capacity_applies:true,
        message_sent:false,appointment_created:false,auto_enrolled:false,discount_applied:false,
        confirmed_revenue_from_interest_cents:0}});
  } catch { return json({ok:false,error:'Follow-up options are temporarily unavailable.'},503); }
}

export async function onRequestPost({ request, env }) {
  try {
    if (!sameOrigin(request)) return json({ok:false,error:'Save this request from your signed-in account.'},403);
    if (!(request.headers.get('content-type')||'').toLowerCase().startsWith('application/json')) return json({ok:false,error:'JSON is required.'},415);
    const identity = await customerIdentity(request,env);
    if (!identity) return json({ok:false,error:'Sign in before recording interest.'},401);
    const text = await request.text();
    if (text.length>2048) return json({ok:false,error:'Request too large.'},413);
    const body = JSON.parse(text);
    if (!body || typeof body!=='object' || Array.isArray(body)) return json({ok:false,error:'An interest request is required.'},400);
    const bookingId=String(body.source_booking_id||'');
    const requestId=String(body.client_request_id||'');
    const kind=String(body.interest_kind||'');
    const cycle=kind==='maintenance'?String(body.cycle_hint||'unsure'):'unsure';
    const note=typeof body.customer_note==='string'?body.customer_note.trim():'';
    if (!UUID.test(bookingId)||!UUID.test(requestId)||!INTEREST_KINDS744.includes(kind)||!CYCLE_HINTS744.includes(cycle)||note.length>300)
      return json({ok:false,error:'Choose a completed service and valid follow-up preference.'},400);
    const [source,prior,versions]=await Promise.all([
      rows(env,`bookings?select=${BOOKING_FIELDS}&id=eq.${bookingId}&customer_email=eq.${encodeURIComponent(identity.email)}&limit=1`),
      rows(env,`${TABLE}?select=${INTEREST_FIELDS},client_request_id&customer_profile_id=eq.${identity.id}&client_request_id=eq.${requestId}&limit=1`),
      rows(env,`customer_communication_preference_versions?select=${PREF_FIELDS}&customer_profile_id=eq.${identity.id}&order=recorded_at.desc,id.desc&limit=1`)
    ]);
    if (!ownedCompleted(source[0],identity)) return json({ok:false,error:'The completed service was not found in your account.'},404);
    if (prior.length) {
      const item=prior[0];
      if (item.source_booking_id!==bookingId||item.interest_kind!==kind||item.cycle_hint!==cycle||item.customer_note!==note)
        return json({ok:false,error:'This request reference has already been used.'},409);
      return json({ok:true,duplicate:true,interest:safeInterest(item),message_sent:false,booking_created:false});
    }
    const month=torontoMonth744();
    const existing=await rows(env,`${TABLE}?select=${INTEREST_FIELDS}&customer_profile_id=eq.${identity.id}&source_booking_id=eq.${bookingId}&interest_kind=eq.${kind}&interest_month=eq.${month}&limit=1`);
    if (existing.length) return json({ok:true,duplicate:true,interest:safeInterest(existing[0]),
      explanation:'A matching interest is already recorded this month; we did not create a second request.',message_sent:false,booking_created:false});
    const preference=versions[0]||null;
    const consent=currentMarketingConsent744({profile:identity.profile,preference});
    const eligible=Object.values(consent.channels).some((channel)=>channel.allowed);
    const response=await fetch(`${env.SUPABASE_URL}/rest/v1/${TABLE}?select=${INTEREST_FIELDS}`,{
      method:'POST',headers:{...serviceHeaders(env),Prefer:'return=representation'},
      body:JSON.stringify([{customer_profile_id:identity.id,source_booking_id:bookingId,client_request_id:requestId,
        interest_kind:kind,cycle_hint:cycle,interest_month:month,customer_note:note,
        consent_preference_version_id:preference?.id||null,consent_eligible_snapshot:eligible,
        review_status:'pending_review',outreach_dispatched:false,appointment_created:false,
        subscription_enrolled:false,confirmed_revenue_cents:0}])
    });
    if (response.status===409) return json({ok:false,error:'A matching request was recorded concurrently. Refresh your interest history; no second request was made.'},409);
    if (!response.ok) return json({ok:false,error:'Could not save interest; no appointment or message was created.'},503);
    const data=await response.json().catch(()=>[]);
    if (!Array.isArray(data)||!data[0]) return json({ok:false,error:'Confirmation unavailable; refresh your account before trying again.'},503);
    return json({ok:true,duplicate:false,interest:safeInterest(data[0]),
      consent_fresh_at_submission:consent.fresh,staff_must_recheck_consent:true,
      message_sent:false,booking_created:false,subscription_created:false,confirmed_revenue_cents:0},201);
  } catch(error) {
    return json({ok:false,error:error instanceof SyntaxError?'Invalid request data.':'Follow-up service is temporarily unavailable.'},error instanceof SyntaxError?400:503);
  }
}

function ownedCompleted(row,identity) {
  return row && row.customer_email?.trim().toLowerCase()===identity.email &&
    (!row.customer_profile_id||row.customer_profile_id===identity.id) && completedService744(row);
}
function safeService(row) {return {id:row.id,service_date:row.service_date,completed_at:row.detailing_completed_at||row.service_date,
  package_code:row.package_code,service_area:row.service_area||null};}
function safeInterest(row) {return {id:row.id,source_booking_id:row.source_booking_id,interest_kind:row.interest_kind,
  cycle_hint:row.cycle_hint,interest_month:row.interest_month,customer_note:row.customer_note,
  review_status:row.review_status,submitted_at:row.submitted_at,confirmed_revenue_cents:0};}
async function customerIdentity(request,env) {
  if (!env?.SUPABASE_URL) return null;
  const current=await getCurrentCustomerSession({request,env});
  const profile=current?.customer_profile;
  const id=String(profile?.id||'');
  const email=String(profile?.email||'').trim().toLowerCase();
  return UUID.test(id)&&email.includes('@')&&profile?.is_active!==false?{id,email,profile}:null;
}
async function rows(env,path) {
  const result=await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`,{headers:serviceHeaders(env)});
  if (!result.ok) throw new Error('Source read failed');
  const data=await result.json();
  if (!Array.isArray(data)) throw new Error('Invalid source result');
  return data;
}
function sameOrigin(request) {
  const origin=request.headers.get('origin');
  const site=request.headers.get('sec-fetch-site');
  if (!origin||(site&&!['same-origin','none'].includes(site))) return false;
  try{return new URL(origin).origin===new URL(request.url).origin;}catch{return false;}
}
function json(data,status=200,extras={}) {return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8',
  'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...extras}});}
