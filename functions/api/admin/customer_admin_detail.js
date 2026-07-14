// Build 220 — sanitized customer detail; never returns password hashes, raw tokens, or session tokens.
import { requireStaffAccess, json, cleanText } from '../_lib/staff-auth.js';
import { customerAccessLevel, loadCustomerAdminDetail } from '../_lib/customer-admin.js';

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
    const level = customerAccessLevel(access.actor);
    if (level === 'none') return withCors(json({ error:'Permission denied.' },403));
    const id = cleanText(body.customer_profile_id);
    const detail = await loadCustomerAdminDetail(env, id);
    if (!detail) return withCors(json({ error:'Customer profile not found.' },404));
    if (level === 'operational') {
      delete detail.preference_history;
      delete detail.duplicate_candidates;
      detail.profile.admin_private_notes = null;
      detail.profile.client_private_notes = null;
      detail.profile.billing_profile_enabled = false;
      detail.access.pending_reset_links = null;
      detail.access.pending_verification_links = null;
      detail.audit = detail.audit.filter((row) => !/password|verification|session|archive|suspend|email/i.test(String(row.event_type || '')));
    }
    return withCors(json({ ok:true, access_level:level, customer:detail }));
  } catch (error) { return withCors(json({ error:error?.message || 'Could not load customer detail.' },500)); }
}
export async function onRequestGet(){ return withCors(json({ error:'Method not allowed.' },405)); }
function corsHeaders(){ return {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type,x-admin-password,x-staff-email,x-staff-user-id','Cache-Control':'no-store'}; }
function withCors(response){ const headers=new Headers(response.headers||{}); for(const [key,value] of Object.entries(corsHeaders())) headers.set(key,value); return new Response(response.body,{status:response.status,statusText:response.statusText,headers}); }
