// Build 202 — private incident reports list endpoint.
import { requireStaffAccess, serviceHeaders, json, methodNotAllowed, isUuid } from "../_lib/staff-auth.js";

export async function onRequestOptions(){ return new Response("", { status:204, headers:corsHeaders() }); }
export async function onRequestGet(context){ return handle(context); }
export async function onRequestPost(context){ return handle(context); }
export async function onRequestPut(){ return withCors(methodNotAllowed()); }

async function handle({ request, env }){
  try {
    const input = request.method === 'GET' ? Object.fromEntries(new URL(request.url).searchParams.entries()) : await request.json().catch(()=>({}));
    const access = await requireStaffAccess({ request, env, body: input, capability:'view_live_ops', allowLegacyAdminFallback:true });
    if (!access.ok) return withCors(access.response);

    const bookingId = cleanText(input.booking_id);
    if (bookingId && !isUuid(bookingId)) return withCors(json({ ok:false, error:'Invalid booking_id.' }, 400));
    const status = cleanCode(input.status);
    const publicVisible = input.public_visible === true || input.public_visible === 'true' ? true : input.public_visible === false || input.public_visible === 'false' ? false : null;
    const limit = Math.min(Math.max(Number(input.limit || 80) || 80, 1), 250);

    let url = `${env.SUPABASE_URL}/rest/v1/incident_reports?select=*&order=updated_at.desc,created_at.desc&limit=${limit}`;
    if (bookingId) url += `&booking_id=eq.${encodeURIComponent(bookingId)}`;
    if (status) url += `&status=eq.${encodeURIComponent(status)}`;
    if (publicVisible !== null) url += `&public_visible=eq.${publicVisible ? 'true':'false'}`;

    if (!canManageAll(access.actor) && access.actor?.id) {
      url += `&or=(reported_by_staff_user_id.eq.${encodeURIComponent(access.actor.id)},created_by_staff_user_id.eq.${encodeURIComponent(access.actor.id)})`;
    }

    const res = await fetch(url, { headers: serviceHeaders(env) });
    if (!res.ok) return withCors(dbError(await res.text()));
    const rows = await res.json().catch(()=>[]);
    return withCors(json({ ok:true, reports:Array.isArray(rows)?rows:[], actor:publicActor(access.actor), scope:canManageAll(access.actor)?'all':'own' }));
  } catch (err) {
    return withCors(json({ ok:false, error:err?.message || String(err) }, 500));
  }
}

function canManageAll(actor){ return actor?.is_admin === true || actor?.can_manage_bookings === true || actor?.can_manage_staff === true; }
function publicActor(actor){ return { id: actor?.id || null, full_name: actor?.full_name || null, email: actor?.email || null, role_code: actor?.role_code || null, can_manage_bookings: actor?.can_manage_bookings === true, is_admin: actor?.is_admin === true }; }
function dbError(text){ const message=String(text||''); if (/incident_reports|schema cache|does not exist|PGRST/i.test(message)) return json({ ok:false, error:'Incident report tables are not available yet. Apply sql/2026-06-12_build202_incident_reports_and_marketing.sql, then retry.', migration:'sql/2026-06-12_build202_incident_reports_and_marketing.sql', detail:message }, 501); return json({ ok:false, error:`Could not load incident reports. ${message}` }, 500); }
function cleanText(v){ return String(v == null ? '' : v).trim(); }
function cleanCode(v){ return cleanText(v).toLowerCase().replace(/[^a-z0-9_-]/g,''); }
function corsHeaders(){ return { 'Access-Control-Allow-Origin':'*', 'Access-Control-Allow-Methods':'GET,POST,OPTIONS', 'Access-Control-Allow-Headers':'Content-Type, x-admin-password, x-staff-email, x-staff-user-id', 'Cache-Control':'no-store' }; }
function withCors(response){ const headers=new Headers(response.headers||{}); Object.entries(corsHeaders()).forEach(([k,v])=>headers.set(k,v)); return new Response(response.body,{status:response.status,statusText:response.statusText,headers}); }
