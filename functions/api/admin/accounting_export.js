import { requireStaffAccess, methodNotAllowed } from "../_lib/staff-auth.js";
import { buildGeneralLedgerExport } from "../_lib/accounting-gl.js";

export async function onRequestOptions(){ return new Response('', {status:204, headers:corsHeaders()}); }
export async function onRequestGet({request, env}){
  try {
    const access = await requireStaffAccess({ request, env, capability:'manage_staff', allowLegacyAdminFallback:false });
    if (!access.ok) return withCors(access.response);
    const url = new URL(request.url);
    const now = new Date();
    const month = Math.max(1, Math.min(12, Number(url.searchParams.get('month') || (now.getMonth()+1))));
    const year = Math.max(2020, Math.min(2100, Number(url.searchParams.get('year') || now.getFullYear())));
    const csv = await buildGeneralLedgerExport(env, { month, year });
    return new Response(csv, { status:200, headers:{ ...corsHeaders(), 'Content-Type':'text/csv; charset=utf-8', 'Content-Disposition':`attachment; filename="rosie-general-ledger-${year}-${String(month).padStart(2,'0')}.csv"` } });
  } catch(err){ return new Response(JSON.stringify({ error: err?.message || 'Unexpected server error.' }), { status:500, headers:{ ...corsHeaders(), 'Content-Type':'application/json; charset=utf-8' } }); }
}
export async function onRequestPost(){ return withCors(methodNotAllowed()); }
function corsHeaders(){ return {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET,OPTIONS","Access-Control-Allow-Headers":"Content-Type, x-admin-password, x-staff-email, x-staff-user-id","Cache-Control":"no-store"}; }
function withCors(response){ const headers = new Headers(response.headers||{}); for(const [k,v] of Object.entries(corsHeaders())) headers.set(k,v); return new Response(response.body,{status:response.status,statusText:response.statusText,headers}); }
