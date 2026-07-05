import { requireStaffAccess, json, methodNotAllowed } from "../_lib/staff-auth.js";
import { listPayables } from "../_lib/accounting-gl.js";

export async function onRequestOptions(){ return new Response('', {status:204, headers:corsHeaders()}); }
export async function onRequestGet({request, env}){
  try {
    const access = await requireStaffAccess({ request, env, capability:'manage_staff', allowLegacyAdminFallback:false });
    if (!access.ok) return withCors(access.response);
    const url = new URL(request.url);
    const status = String(url.searchParams.get('status') || 'open').trim();
    const payables = await listPayables(env, { status });
    const summary = {
      open_count: payables.filter((x)=>x.payment_status === 'open').length,
      partial_count: payables.filter((x)=>x.payment_status === 'partial').length,
      paid_count: payables.filter((x)=>x.payment_status === 'paid').length,
      outstanding_cad: payables.reduce((s,x)=>s + Number(x.balance_due_cad||0), 0)
    };
    return withCors(json({ ok:true, payables, summary }));
  } catch(err){ return withCors(json({ error: err?.message || 'Unexpected server error.' },500)); }
}
export async function onRequestPost(){ return withCors(methodNotAllowed()); }
function corsHeaders(){ return {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET,OPTIONS","Access-Control-Allow-Headers":"Content-Type, x-admin-password, x-staff-email, x-staff-user-id","Cache-Control":"no-store"}; }
function withCors(response){ const headers = new Headers(response.headers||{}); for(const [k,v] of Object.entries(corsHeaders())) headers.set(k,v); return new Response(response.body,{status:response.status,statusText:response.statusText,headers}); }
