import { requireStaffAccess, json, methodNotAllowed, cleanText } from "../_lib/staff-auth.js";
import { settlePayable, roundMoney } from "../_lib/accounting-gl.js";

export async function onRequestOptions(){ return new Response('', {status:204, headers:corsHeaders()}); }
export async function onRequestPost({request, env}){
  try {
    const body = await request.json().catch(()=>({}));
    const access = await requireStaffAccess({ request, env, capability:'manage_staff', allowLegacyAdminFallback:false });
    if (!access.ok) return withCors(access.response);
    const entryId = cleanText(body.entry_id);
    if (!entryId) return withCors(json({ error:'entry_id is required.' },400));
    const settled = await settlePayable(env, {
      entry_id: entryId,
      amount_cad: body.amount_cad == null ? null : roundMoney(body.amount_cad),
      payment_account: cleanText(body.payment_account) || 'cash',
      payment_date: cleanText(body.payment_date) || new Date().toISOString().slice(0,10),
      memo: cleanText(body.memo) || null,
      actorName: access.actor?.full_name || access.actor?.email || null,
      actorStaffUserId: access.actor?.id || null
    });
    return withCors(json({ ok:true, saved: settled.entry, lines: settled.lines }));
  } catch(err){ return withCors(json({ error: err?.message || 'Unexpected server error.' },500)); }
}
export async function onRequestGet(){ return withCors(methodNotAllowed()); }
function corsHeaders(){ return {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type, x-admin-password, x-staff-email, x-staff-user-id","Cache-Control":"no-store"}; }
function withCors(response){ const headers = new Headers(response.headers||{}); for(const [k,v] of Object.entries(corsHeaders())) headers.set(k,v); return new Response(response.body,{status:response.status,statusText:response.statusText,headers}); }
