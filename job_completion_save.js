
import { requireStaffAccess, json, isUuid } from "../_lib/staff-auth.js";
export async function onRequestOptions(){ return new Response("", { status:204, headers:corsHeaders() }); }
export async function onRequestPost({ request, env }){
  try {
    const body = await request.json().catch(()=>null);
    const bookingId = String(body?.booking_id || '').trim();
    const access = await requireStaffAccess({ request, env, body: body || {}, capability:'work_booking', bookingId, allowLegacyAdminFallback:false });
    if (!access.ok) return withCors(access.response);
    if (!isUuid(bookingId)) return withCors(json({ error:'Invalid booking_id.' },400));
    const payload = { booking_id: bookingId, keys_returned: body?.keys_returned === true, water_disconnected: body?.water_disconnected === true, electricity_disconnected: body?.electricity_disconnected === true, debrief_completed: body?.debrief_completed === true, suggested_next_steps: String(body?.suggested_next_steps || '').trim() || null, suggested_interval_days: body?.suggested_interval_days == null || body?.suggested_interval_days === '' ? null : Number(body.suggested_interval_days), auto_schedule_requested: body?.auto_schedule_requested === true, completed_by_name: access.actor.full_name || access.actor.email || 'Staff', completed_by_staff_user_id: access.actor.id || null, completed_at: new Date().toISOString(), notes: String(body?.notes || '').trim() || null, updated_at: new Date().toISOString() };
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/job_completion_checklists?on_conflict=booking_id`, { method:'POST', headers:{ apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, 'Content-Type':'application/json', Prefer:'resolution=merge-duplicates,return=representation' }, body: JSON.stringify([payload]) });
    if (!res.ok) return withCors(json({ error: await res.text() },500));
    const rows = await res.json().catch(()=>[]);
    return withCors(json({ ok:true, checklist: Array.isArray(rows) ? rows[0] || null : null }));
  } catch (err) { return withCors(json({ error:String(err) },500)); }
}
function corsHeaders(){return {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type, x-admin-password, x-staff-email, x-staff-user-id","Cache-Control":"no-store"};}
function withCors(response){ const headers=new Headers(response.headers||{}); for (const [k,v] of Object.entries(corsHeaders())) headers.set(k,v); return new Response(response.body,{status:response.status,statusText:response.statusText,headers}); }
