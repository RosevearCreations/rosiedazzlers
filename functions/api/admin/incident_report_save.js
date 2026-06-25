// Build 202 — private incident report create/update/decision endpoint.
import { requireStaffAccess, serviceHeaders, json, methodNotAllowed, isUuid } from "../_lib/staff-auth.js";

export async function onRequestOptions(){ return new Response("", { status:204, headers:corsHeaders() }); }
export async function onRequestPost(context){ return handleSave(context); }
export async function onRequestGet(){ return withCors(methodNotAllowed()); }
export async function onRequestPut(){ return withCors(methodNotAllowed()); }

async function handleSave({ request, env }){
  try {
    const body = await request.json().catch(()=>({}));
    const id = cleanText(body.id);
    const bookingId = cleanText(body.booking_id);
    if (id && !isUuid(id)) return withCors(json({ ok:false, error:'Invalid incident report id.' }, 400));
    if (!bookingId || !isUuid(bookingId)) return withCors(json({ ok:false, error:'A valid booking_id is required.' }, 400));

    const access = await requireStaffAccess({ request, env, body, capability:'work_booking', bookingId, allowLegacyAdminFallback:true });
    if (!access.ok) return withCors(access.response);
    const actor = access.actor || {};
    const isManager = actor.is_admin === true || actor.can_manage_bookings === true || actor.can_manage_staff === true;

    const existing = id ? await loadExisting(env, id) : null;
    if (id && !existing.ok) return withCors(existing.response);
    const old = existing?.row || null;

    const evidence = normalizeEvidence(body.evidence_items || body.evidence || []);
    const publicEvidence = normalizeEvidence(body.public_evidence_items || []).filter((item)=> evidence.some((e)=> e.url === item.url) || item.url);
    const title = cleanText(body.title);
    const privateReport = cleanText(body.private_report);
    const incidentType = cleanCode(body.incident_type || 'damage');

    if (!title) return withCors(json({ ok:false, error:'Incident title is required.' }, 400));
    if (!privateReport) return withCors(json({ ok:false, error:'Private detailer report is required.' }, 400));
    if (!evidence.length && !old) return withCors(json({ ok:false, error:'At least one photo evidence URL or upload is required before creating an incident report.' }, 400));
    if (!['damage','faulty_equipment','pre_existing_damage','customer_dispute','safety','other'].includes(incidentType)) return withCors(json({ ok:false, error:'Invalid incident_type.' }, 400));

    let publicVisible = body.public_visible === true || body.public_visible === 'true';
    let customerVisibleAt = old?.customer_visible_at || null;
    if (publicVisible && !isManager) return withCors(json({ ok:false, error:'Only admin/booking managers can publish an incident report to the customer.' }, 403));
    const approvedSummary = cleanText(body.approved_customer_summary);
    if (publicVisible && !approvedSummary) return withCors(json({ ok:false, error:'Approved customer summary is required before customer visibility can be enabled.' }, 400));
    if (publicVisible && !publicEvidence.length) return withCors(json({ ok:false, error:'Select at least one approved customer-visible evidence photo before publishing.' }, 400));
    if (publicVisible && !customerVisibleAt) customerVisibleAt = new Date().toISOString();

    const patch = {
      booking_id: bookingId,
      incident_type: incidentType,
      severity: cleanCode(body.severity || 'medium') || 'medium',
      status: cleanCode(body.status || (publicVisible ? 'customer_visible' : old?.status || 'open')) || 'open',
      decision_status: cleanCode(body.decision_status || (publicVisible ? 'approved_for_customer' : old?.decision_status || 'needs_review')) || 'needs_review',
      vehicle_area: cleanText(body.vehicle_area) || null,
      equipment_name: cleanText(body.equipment_name) || null,
      title,
      private_report: privateReport,
      private_admin_discussion: mergeDiscussion(old?.private_admin_discussion, body.private_admin_discussion, actor),
      evidence_items: evidence.length ? evidence : old?.evidence_items || [],
      decision_summary_private: isManager ? cleanText(body.decision_summary_private) || null : old?.decision_summary_private || null,
      approved_customer_summary: isManager ? approvedSummary || null : old?.approved_customer_summary || null,
      approved_customer_discussion: isManager ? cleanText(body.approved_customer_discussion) || null : old?.approved_customer_discussion || null,
      public_evidence_items: isManager ? publicEvidence : old?.public_evidence_items || [],
      public_visible: isManager ? publicVisible : old?.public_visible === true,
      customer_visible_at: isManager ? customerVisibleAt : old?.customer_visible_at || null,
      updated_at: new Date().toISOString(),
      updated_by_staff_user_id: actor.id || null,
      updated_by_staff_name: actor.full_name || actor.email || null,
      updated_by_staff_email: actor.email || null
    };

    if (!id) {
      patch.reported_by_staff_user_id = actor.id || null;
      patch.reported_by_staff_name = actor.full_name || actor.email || cleanText(body.reported_by_staff_name) || 'Staff';
      patch.reported_by_staff_email = actor.email || cleanText(body.reported_by_staff_email) || null;
      patch.created_by_staff_user_id = actor.id || null;
      patch.created_by_staff_name = actor.full_name || actor.email || null;
      patch.created_by_staff_email = actor.email || null;
    }

    if (isManager && cleanText(body.decision_status) && cleanText(body.decision_status) !== old?.decision_status) {
      patch.decision_made_by_staff_user_id = actor.id || null;
      patch.decision_made_by_name = actor.full_name || actor.email || 'Admin';
      patch.decision_made_at = new Date().toISOString();
    }

    const url = id
      ? `${env.SUPABASE_URL}/rest/v1/incident_reports?id=eq.${encodeURIComponent(id)}`
      : `${env.SUPABASE_URL}/rest/v1/incident_reports`;
    const res = await fetch(url, { method: id ? 'PATCH':'POST', headers:{ ...serviceHeaders(env), Prefer:'return=representation' }, body: JSON.stringify(id ? patch : [patch]) });
    if (!res.ok) return withCors(dbError(await res.text()));
    const rows = await res.json().catch(()=>[]);
    const row = Array.isArray(rows) ? rows[0] || null : rows || null;

    await logEvent(env, bookingId, row?.id || id, actor, patch, publicVisible).catch(()=>null);
    return withCors(json({ ok:true, report:row, message: publicVisible ? 'Incident report saved and customer visibility enabled.' : 'Incident report saved privately.' }));
  } catch (err) {
    return withCors(json({ ok:false, error:err?.message || String(err) }, 500));
  }
}

async function loadExisting(env, id){
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/incident_reports?select=*&id=eq.${encodeURIComponent(id)}&limit=1`, { headers: serviceHeaders(env) });
  if (!res.ok) return { ok:false, response: dbError(await res.text()) };
  const rows = await res.json().catch(()=>[]);
  const row = Array.isArray(rows) ? rows[0] || null : null;
  if (!row) return { ok:false, response: json({ ok:false, error:'Incident report not found.' }, 404) };
  return { ok:true, row };
}
function normalizeEvidence(value){
  const rows = Array.isArray(value) ? value : String(value||'').split(/\n+/).map((url)=>({ url }));
  const seen = new Set();
  return rows.map((item)=>{
    const url = cleanText(item?.url || item?.media_url || item);
    if (!url || seen.has(url)) return null;
    try { new URL(url); } catch { return null; }
    seen.add(url);
    return { url, caption: cleanText(item?.caption || item?.label), taken_at: cleanText(item?.taken_at), evidence_type: cleanCode(item?.evidence_type || 'photo') || 'photo', customer_visible: item?.customer_visible === true };
  }).filter(Boolean);
}
function mergeDiscussion(previous, next, actor){
  const cleanNext = cleanText(next);
  const cleanPrev = cleanText(previous);
  if (!cleanNext) return cleanPrev || null;
  if (cleanNext === cleanPrev) return cleanPrev || null;
  const stamp = `${new Date().toISOString()} — ${actor?.full_name || actor?.email || 'Staff'}`;
  if (!cleanPrev) return `${stamp}\n${cleanNext}`;
  if (cleanPrev.includes(cleanNext)) return cleanPrev;
  return `${cleanPrev}\n\n${stamp}\n${cleanNext}`;
}
async function logEvent(env, bookingId, reportId, actor, patch, publicVisible){
  await fetch(`${env.SUPABASE_URL}/rest/v1/booking_events`, { method:'POST', headers:serviceHeaders(env), body:JSON.stringify([{ booking_id:bookingId, event_type: publicVisible ? 'incident_report_published':'incident_report_saved', actor_name: actor?.full_name || actor?.email || 'Staff', event_note: String(patch.title || 'Incident report').slice(0,250), payload:{ incident_report_id:reportId, status:patch.status, decision_status:patch.decision_status, public_visible:publicVisible } }]) });
}
function dbError(text){ const message=String(text||''); if (/incident_reports|schema cache|does not exist|PGRST/i.test(message)) return json({ ok:false, error:'Incident report tables are not available yet. Apply sql/2026-06-12_build202_incident_reports_and_marketing.sql, then retry.', migration:'sql/2026-06-12_build202_incident_reports_and_marketing.sql', detail:message }, 501); return json({ ok:false, error:`Could not save incident report. ${message}` }, 500); }
function cleanText(v){ return String(v == null ? '' : v).trim(); }
function cleanCode(v){ return cleanText(v).toLowerCase().replace(/[^a-z0-9_-]/g,''); }
function corsHeaders(){ return { 'Access-Control-Allow-Origin':'*', 'Access-Control-Allow-Methods':'POST,OPTIONS', 'Access-Control-Allow-Headers':'Content-Type, x-admin-password, x-staff-email, x-staff-user-id', 'Cache-Control':'no-store' }; }
function withCors(response){ const headers=new Headers(response.headers||{}); Object.entries(corsHeaders()).forEach(([k,v])=>headers.set(k,v)); return new Response(response.body,{status:response.status,statusText:response.statusText,headers}); }
