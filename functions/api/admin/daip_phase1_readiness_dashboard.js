// Build 222 — protected DAIP Phase 1 readiness dashboard.
import { requireStaffAccess, json } from '../_lib/staff-auth.js';
import { buildPhase1ReadinessDashboard } from '../_lib/daip-phase1-readiness.js';

export async function onRequest(context){
  const method = String(context.request?.method || 'GET').toUpperCase();
  if (method === 'OPTIONS') return onRequestOptions(context);
  if (method === 'GET' || method === 'POST') return handle(context);
  return withCors(json({ ok:false, error:'Method not allowed.', allowed_methods:['GET','POST','OPTIONS'] },405));
}
export async function onRequestOptions(){ return new Response('', { status:204, headers:corsHeaders() }); }
export async function onRequestGet(context){ return handle(context); }
export async function onRequestPost(context){ return handle(context); }

async function handle({ request, env }) {
  try {
    const body = request.method === 'GET' ? Object.fromEntries(new URL(request.url).searchParams.entries()) : await request.json().catch(() => ({}));
    const access = await requireStaffAccess({ request, env, body, capability:'manage_staff', allowLegacyAdminFallback:true });
    if (!access.ok) return withCors(access.response);
    const dashboard = await buildPhase1ReadinessDashboard(env);
    return withCors(json({ ok:true, ...dashboard }));
  } catch (error) {
    return withCors(json({ ok:false, error:error?.message || 'Could not load DAIP readiness.' },500));
  }
}
function corsHeaders(){ return {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type,x-admin-password,x-staff-email,x-staff-user-id','Cache-Control':'no-store'}; }
function withCors(response){ const headers = new Headers(response.headers || {}); for (const [key,value] of Object.entries(corsHeaders())) headers.set(key,value); return new Response(response.body,{status:response.status,statusText:response.statusText,headers}); }
