// Build 220 — role-aware customer list for the Customer Management workspace.
import { requireStaffAccess, json } from '../_lib/staff-auth.js';
import { customerAccessLevel, listCustomerProfiles } from '../_lib/customer-admin.js';

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
    const level = customerAccessLevel(access.actor);
    if (level === 'none') return withCors(json({ error:'Permission denied.' },403));
    const status = ['all','active','suspended','archived'].includes(String(body.status || 'all')) ? String(body.status || 'all') : 'all';
    const includeArchived = body.include_archived === true || String(body.include_archived || '').toLowerCase() === 'true' || status === 'archived';
    const rows = await listCustomerProfiles(env, { includeArchived, status, limit:body.limit || 250 });
    const needle = String(body.search || '').trim().toLowerCase().slice(0,120);
    const filtered = needle ? rows.filter((row) => [row.full_name,row.email,row.phone,row.city,row.tier_code].join(' ').toLowerCase().includes(needle)) : rows;
    return withCors(json({ ok:true, actor:compactActor(access.actor), access_level:level, customers:filtered }));
  } catch (error) {
    return withCors(json({ error:error?.message || 'Could not load customers.' },500));
  }
}
function compactActor(actor={}) { return { id:actor.id||null, email:actor.email||null, full_name:actor.full_name||null, role_code:actor.role_code||null, is_admin:actor.is_admin===true, can_manage_bookings:actor.can_manage_bookings===true, can_manage_staff:actor.can_manage_staff===true }; }
function corsHeaders(){ return {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type,x-admin-password,x-staff-email,x-staff-user-id','Cache-Control':'no-store'}; }
function withCors(response){ const headers=new Headers(response.headers||{}); for(const [key,value] of Object.entries(corsHeaders())) headers.set(key,value); return new Response(response.body,{status:response.status,statusText:response.statusText,headers}); }
