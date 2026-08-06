// Build 220 — resolves internal sign-in help requests without changing a customer account.
import { requireStaffAccess, json, cleanText, isUuid } from '../_lib/staff-auth.js';
import { canManageCustomerSecurity } from '../_lib/customer-admin.js';

export async function onRequest(context){
  const method = String(context.request?.method || 'GET').toUpperCase();
  if (method === 'OPTIONS') return onRequestOptions(context);
  if (method === 'POST') return onRequestPost(context);
  return withCors(json({ error:'Method not allowed.', allowed_methods:['POST','OPTIONS'] },405));
}
export async function onRequestOptions(){ return new Response('', { status:204, headers:corsHeaders() }); }
export async function onRequestPost(context){
  const { request, env } = context;
  try {
    const body = await request.json().catch(() => ({}));
    const access = await requireStaffAccess({ request, env, body, capability:'view_live_ops', allowLegacyAdminFallback:true });
    if (!access.ok) return withCors(access.response);
    if (!canManageCustomerSecurity(access.actor)) return withCors(json({ error:'Only an administrator or booking manager can resolve account-help requests.' },403));
    const requestId=cleanText(body.request_id); const status=String(body.status || '').trim(); const note=cleanText(body.safe_resolution_note);
    if(!isUuid(requestId)) return withCors(json({ error:'Invalid help-request id.' },400));
    if(!['reviewed','resolved','declined'].includes(status)) return withCors(json({ error:'Choose a valid request status.' },400));
    if(note && note.length>500) return withCors(json({ error:'Resolution note is too long.' },400));
    if(note && /https?:\/\/|token|password|signed[_ -]?url|bearer\s+/i.test(note)) return withCors(json({ error:'Resolution note must not contain links, passwords, tokens, or credentials.' },400));
    const response=await fetch(`${env.SUPABASE_URL}/rest/v1/customer_account_recovery_requests?id=eq.${encodeURIComponent(requestId)}`, { method:'PATCH', headers:{apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:`Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,'Content-Type':'application/json',Prefer:'return=representation'}, body:JSON.stringify({ status, reviewed_at:new Date().toISOString(), reviewed_by_staff_user_id:access.actor.id||null, reviewed_by_staff_email:access.actor.email||null, safe_resolution_note:note||null, updated_at:new Date().toISOString() }) });
    if(!response.ok) throw new Error(`Could not update account-help request. ${await response.text()}`);
    return withCors(json({ ok:true, message:'Account-help request updated.' }));
  } catch(error){ return withCors(json({ error:error?.message || 'Could not update account-help request.' },500)); }
}
function corsHeaders(){ return {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type,x-admin-password,x-staff-email,x-staff-user-id','Cache-Control':'no-store'}; }
function withCors(response){ const headers=new Headers(response.headers||{}); for(const [key,value] of Object.entries(corsHeaders())) headers.set(key,value); return new Response(response.body,{status:response.status,statusText:response.statusText,headers}); }
