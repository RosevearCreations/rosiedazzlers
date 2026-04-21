
import { getCurrentCustomerSession, serviceHeaders } from "../_lib/customer-session.js";
export async function onRequestOptions(){ return new Response("", { status:204, headers:corsHeaders() }); }
export async function onRequestPost(context){
  const { request, env } = context;
  try {
    const current = await getCurrentCustomerSession({ env, request });
    if (!current?.customer_profile?.id) return withCors(json({ error:'Unauthorized.' },401));
    const body = await request.json().catch(()=>({}));
    const vehicle_id = String(body.vehicle_id || '').trim();
    const media_url = cleanText(body.media_url);
    const media_kind = normalizeKind(body.media_kind || body.kind);
    const capture_role = cleanText(body.capture_role);
    const caption = cleanText(body.caption);
    const set_as_garage = body.set_as_garage === true || ['front','back'].includes(String(body.capture_role||'').toLowerCase());
    if (!vehicle_id) return withCors(json({ error:'vehicle_id is required.' },400));
    if (!media_url) return withCors(json({ error:'media_url is required.' },400));
    if (!media_kind) return withCors(json({ error:'Invalid media kind.' },400));
    const headers = serviceHeaders(env);
    const vRes = await fetch(`${env.SUPABASE_URL}/rest/v1/customer_vehicles?select=id,customer_profile_id,garage_display_media_url&customer_profile_id=eq.${encodeURIComponent(current.customer_profile.id)}&id=eq.${encodeURIComponent(vehicle_id)}&limit=1`, { headers });
    const vRows = await vRes.json().catch(()=>[]);
    const vehicle = Array.isArray(vRows)?vRows[0]||null:null;
    if (!vRes.ok || !vehicle) return withCors(json({ error:'Vehicle not found.' },404));
    const payload = {
      customer_profile_id: current.customer_profile.id,
      vehicle_id,
      media_kind,
      media_url,
      capture_role,
      caption,
      is_primary: body.is_primary === true,
      is_deleted: false,
      uploaded_by_customer: true,
      google_score_status: 'pending',
      updated_at: new Date().toISOString()
    };
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/customer_vehicle_media`, { method:'POST', headers:{ ...headers, Prefer:'return=representation' }, body: JSON.stringify([payload]) });
    if (!res.ok) return withCors(json({ error:`Could not save vehicle media. ${await res.text()}` },500));
    const rows = await res.json().catch(()=>[]);
    const media = Array.isArray(rows)?rows[0]||null:null;
    if (set_as_garage && media_kind === 'photo') {
      await fetch(`${env.SUPABASE_URL}/rest/v1/customer_vehicles?id=eq.${encodeURIComponent(vehicle_id)}&customer_profile_id=eq.${encodeURIComponent(current.customer_profile.id)}`, { method:'PATCH', headers:{ ...headers, Prefer:'return=minimal' }, body: JSON.stringify({ garage_display_media_url: media_url, garage_display_media_kind: media_kind, updated_at: new Date().toISOString() }) }).catch(()=>null);
    }
    return withCors(json({ ok:true, media }));
  } catch(err){ return withCors(json({ error: err?.message || 'Unexpected server error.' },500)); }
}
function cleanText(v){ const s=String(v??'').trim(); return s||null; }
function normalizeKind(v){ const s=String(v||'photo').trim().toLowerCase(); if(['photo','image'].includes(s)) return 'photo'; if(s==='video') return 'video'; return null; }
function json(data,status=200){ return new Response(JSON.stringify(data,null,2),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}}); }
function corsHeaders(){ return {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type','Cache-Control':'no-store'}; }
function withCors(response){ const headers=new Headers(response.headers||{}); for(const [k,v] of Object.entries(corsHeaders())) headers.set(k,v); return new Response(response.body,{status:response.status,statusText:response.statusText,headers}); }
