
import { getCurrentCustomerSession, serviceHeaders } from "../_lib/customer-session.js";
export async function onRequestOptions(){ return new Response("", { status:204, headers:corsHeaders() }); }
export async function onRequestPost(context){
  const { request, env } = context;
  try {
    const current = await getCurrentCustomerSession({ env, request });
    if (!current?.customer_profile?.id) return withCors(json({ error:'Unauthorized.' },401));
    const body = await request.json().catch(()=>({}));
    const media_id = String(body.media_id || '').trim();
    if (!media_id) return withCors(json({ error:'media_id is required.' },400));
    const headers = serviceHeaders(env);
    const lookup = await fetch(`${env.SUPABASE_URL}/rest/v1/customer_vehicle_media?select=*&id=eq.${encodeURIComponent(media_id)}&customer_profile_id=eq.${encodeURIComponent(current.customer_profile.id)}&limit=1`, { headers });
    const rows = await lookup.json().catch(()=>[]); const media = Array.isArray(rows)?rows[0]||null:null;
    if (!lookup.ok || !media) return withCors(json({ error:'Vehicle media not found.' },404));
    await fetch(`${env.SUPABASE_URL}/rest/v1/customer_vehicle_media?id=eq.${encodeURIComponent(media_id)}&customer_profile_id=eq.${encodeURIComponent(current.customer_profile.id)}`, { method:'PATCH', headers:{ ...headers, Prefer:'return=minimal' }, body: JSON.stringify({ is_deleted:true, updated_at:new Date().toISOString() }) });
    await fetch(`${env.SUPABASE_URL}/rest/v1/customer_vehicles?id=eq.${encodeURIComponent(media.vehicle_id)}&customer_profile_id=eq.${encodeURIComponent(current.customer_profile.id)}&garage_display_media_url=eq.${encodeURIComponent(media.media_url)}`, { method:'PATCH', headers:{ ...headers, Prefer:'return=minimal' }, body: JSON.stringify({ garage_display_media_url:null, garage_display_media_kind:null, updated_at:new Date().toISOString() }) }).catch(()=>null);
    return withCors(json({ ok:true }));
  } catch(err){ return withCors(json({ error: err?.message || 'Unexpected server error.' },500)); }
}
function json(data,status=200){ return new Response(JSON.stringify(data,null,2),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}}); }
function corsHeaders(){ return {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type','Cache-Control':'no-store'}; }
function withCors(response){ const headers=new Headers(response.headers||{}); for(const [k,v] of Object.entries(corsHeaders())) headers.set(k,v); return new Response(response.body,{status:response.status,statusText:response.statusText,headers}); }
