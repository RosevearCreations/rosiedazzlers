// Build 220 — internal queue for customer sign-in-email assistance requests.
import { requireStaffAccess, json } from '../_lib/staff-auth.js';
import { canManageCustomerSecurity } from '../_lib/customer-admin.js';

export async function onRequest(context){
  const method = String(context.request?.method || 'GET').toUpperCase();
  if (method === 'OPTIONS') return onRequestOptions(context);
  if (method === 'GET') return handle(context);
  if (method === 'POST') return handle(context);
  return withCors(json({ error:'Method not allowed.', allowed_methods:['GET','POST','OPTIONS'] },405));
}
export async function onRequestOptions(){ return new Response('', { status:204, headers:corsHeaders() }); }
export async function onRequestGet(context){ return handle(context); }
export async function onRequestPost(context){ return handle(context); }
async function handle({ request, env }) {
  try {
    const body = request.method === 'GET' ? Object.fromEntries(new URL(request.url).searchParams.entries()) : await request.json().catch(() => ({}));
    const access = await requireStaffAccess({ request, env, body, capability:'view_live_ops', allowLegacyAdminFallback:true });
    if (!access.ok) return withCors(access.response);
    if (!canManageCustomerSecurity(access.actor)) return withCors(json({ error:'Only an administrator or booking manager can view account-help requests.' },403));
    const status = ['queued','reviewed','resolved','declined','all'].includes(String(body.status || 'queued')) ? String(body.status || 'queued') : 'queued';
    let url = `${env.SUPABASE_URL}/rest/v1/customer_account_recovery_requests?select=id,created_at,full_name_hint,phone_hint,email_hint,message,status,reviewed_at,reviewed_by_staff_email,safe_resolution_note&order=created_at.desc&limit=100`;
    if (status !== 'all') url += `&status=eq.${encodeURIComponent(status)}`;
    const response = await fetch(url, { headers:{ apikey:env.SUPABASE_SERVICE_ROLE_KEY, Authorization:`Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, 'Content-Type':'application/json' } });
    if (!response.ok) throw new Error(`Could not load account-help requests. ${await response.text()}`);
    const rows = await response.json().catch(() => []);
    return withCors(json({ ok:true, requests:Array.isArray(rows)?rows:[] }));
  } catch (error) { return withCors(json({ error:error?.message || 'Could not load account-help requests.' },500)); }
}
function corsHeaders(){ return {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type,x-admin-password,x-staff-email,x-staff-user-id','Cache-Control':'no-store'}; }
function withCors(response){ const headers=new Headers(response.headers||{}); for(const [key,value] of Object.entries(corsHeaders())) headers.set(key,value); return new Response(response.body,{status:response.status,statusText:response.statusText,headers}); }
