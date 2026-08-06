// Build 219 — protected DAIP owner-decision and promotion-gate dashboard.
import { requireStaffAccess, json } from '../_lib/staff-auth.js';
import { buildGovernanceDashboard, DAIP_GOVERNANCE_BUILD } from '../_lib/daip-governance.js';

export async function onRequestOptions(){ return new Response('', { status:204, headers:corsHeaders() }); }
export async function onRequestGet(context){ return handle(context); }
export async function onRequestPost(context){ return handle(context); }

async function handle({ request, env }) {
  try {
    const body = request.method === 'GET' ? {} : await request.json().catch(() => ({}));
    const access = await requireStaffAccess({ request, env, body, capability:'manage_staff', allowLegacyAdminFallback:true });
    if (!access.ok) return withCors(access.response);
    const data = await buildGovernanceDashboard(env);
    return withCors(json({ ok:true, ...data, generated_at:new Date().toISOString() }));
  } catch (error) {
    return withCors(json({ ok:false, build:DAIP_GOVERNANCE_BUILD, error:error?.message || 'Could not load DAIP governance.' }, 500));
  }
}
function corsHeaders(){ return {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type,x-admin-password,x-staff-email,x-staff-user-id','Cache-Control':'no-store'}; }
function withCors(response){ const headers=new Headers(response.headers||{}); for(const [key,value] of Object.entries(corsHeaders())) headers.set(key,value); return new Response(response.body,{status:response.status,statusText:response.statusText,headers}); }
