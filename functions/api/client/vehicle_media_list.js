
import { getCurrentCustomerSession, serviceHeaders } from "../_lib/customer-session.js";
export async function onRequestOptions(){ return new Response("", { status:204, headers:corsHeaders() }); }
export async function onRequestGet(context){ return handle(context); }
export async function onRequestPost(context){ return handle(context); }
async function handle(context){
  const { request, env } = context;
  try {
    const current = await getCurrentCustomerSession({ env, request });
    if (!current?.customer_profile?.id) return withCors(json({ error:'Unauthorized.' },401));
    const url = new URL(request.url);
    const vehicle_id = String(url.searchParams.get('vehicle_id') || '').trim() || String((await request.clone().json().catch(()=>({}))).vehicle_id || '').trim();
    if (!vehicle_id) return withCors(json({ error:'vehicle_id is required.' },400));
    const headers = serviceHeaders(env);
    const check = await fetch(`${env.SUPABASE_URL}/rest/v1/customer_vehicles?select=id&customer_profile_id=eq.${encodeURIComponent(current.customer_profile.id)}&id=eq.${encodeURIComponent(vehicle_id)}&limit=1`, { headers });
    const checkRows = await check.json().catch(()=>[]);
    if (!check.ok || !Array.isArray(checkRows) || !checkRows[0]) return withCors(json({ error:'Vehicle not found.' },404));
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/customer_vehicle_media?select=*&vehicle_id=eq.${encodeURIComponent(vehicle_id)}&is_deleted=eq.false&order=is_primary.desc,created_at.desc`, { headers });
    if (!res.ok) return withCors(json({ error:`Could not load vehicle media. ${await res.text()}` },500));
    const rows = await res.json().catch(()=>[]);
    return withCors(json({ ok:true, media:Array.isArray(rows)?rows:[] }));
  } catch(err){ return withCors(json({ error: err?.message || 'Unexpected server error.' },500)); }
}
function json(data,status=200){ return new Response(JSON.stringify(data,null,2),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}}); }
function corsHeaders(){ return {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type','Cache-Control':'no-store'}; }
function withCors(response){ const headers=new Headers(response.headers||{}); for(const [k,v] of Object.entries(corsHeaders())) headers.set(k,v); return new Response(response.body,{status:response.status,statusText:response.statusText,headers}); }
