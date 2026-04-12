import { requireStaffAccess, json, methodNotAllowed, serviceHeaders } from "../_lib/staff-auth.js";

export async function onRequestOptions(){ return new Response('', {status:204, headers:corsHeaders()}); }
export async function onRequestGet({request, env}){
  try {
    const access = await requireStaffAccess({ request, env, capability:'manage_staff', allowLegacyAdminFallback:false });
    if (!access.ok) return withCors(access.response);
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/accounting_accounts?select=*&order=sort_order.asc,code.asc`, { headers: serviceHeaders(env) });
    if (!res.ok) return withCors(json({ error:`Could not load accounting accounts. ${await res.text()}` },500));
    const rows = await res.json().catch(()=>[]);
    return withCors(json({ ok:true, accounts: rows }));
  } catch(err){ return withCors(json({ error: err?.message || 'Unexpected server error.' },500)); }
}
export async function onRequestPost(){ return withCors(methodNotAllowed()); }
function corsHeaders(){ return {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET,OPTIONS","Access-Control-Allow-Headers":"Content-Type, x-admin-password, x-staff-email, x-staff-user-id","Cache-Control":"no-store"}; }
function withCors(response){ const headers = new Headers(response.headers||{}); for(const [k,v] of Object.entries(corsHeaders())) headers.set(k,v); return new Response(response.body,{status:response.status,statusText:response.statusText,headers}); }
