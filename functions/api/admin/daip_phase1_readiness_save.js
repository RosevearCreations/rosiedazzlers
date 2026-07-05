// Build 222 — record a DAIP readiness review without opening technical/public capabilities.
import { requireStaffAccess, serviceHeaders, json } from '../_lib/staff-auth.js';
import { buildPhase1ReadinessDashboard, buildPhase1ReadinessInsert } from '../_lib/daip-phase1-readiness.js';

export async function onRequest(context){
  const method = String(context.request?.method || 'POST').toUpperCase();
  if (method === 'OPTIONS') return onRequestOptions(context);
  if (method === 'POST') return handle(context);
  return withCors(json({ ok:false, error:'Method not allowed.', allowed_methods:['POST','OPTIONS'] },405));
}
export async function onRequestOptions(){ return new Response('', { status:204, headers:corsHeaders() }); }
export async function onRequestPost(context){ return handle(context); }

async function handle({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const access = await requireStaffAccess({ request, env, body, capability:'manage_staff', allowLegacyAdminFallback:true });
    if (!access.ok) return withCors(access.response);
    const dashboard = await buildPhase1ReadinessDashboard(env);
    if (!dashboard.ready) return withCors(json({ ok:false, error:dashboard.warning || 'Apply the DAIP governance and readiness migrations before recording readiness.' },409));
    const prepared = buildPhase1ReadinessInsert({ body, actor:access.actor, dashboard });
    if (!prepared.ok) return withCors(json({ ok:false, error:prepared.error },400));

    const reviewResponse = await fetch(`${env.SUPABASE_URL}/rest/v1/daip_phase1_readiness_reviews`, {
      method:'POST', headers:{ ...serviceHeaders(env), Prefer:'return=representation' }, body:JSON.stringify([prepared.row])
    });
    const reviewText = await reviewResponse.text();
    if (!reviewResponse.ok) return withCors(json({ ok:false, error:`Could not save DAIP readiness review. ${reviewText.slice(0,180)}` },409));
    const rows = JSON.parse(reviewText || '[]');
    const review = rows[0] || null;
    if (review?.id) {
      const audit = { ...prepared.audit, review_id:review.id };
      const auditResponse = await fetch(`${env.SUPABASE_URL}/rest/v1/daip_phase1_readiness_audit_events`, {
        method:'POST', headers:{ ...serviceHeaders(env), Prefer:'return=minimal' }, body:JSON.stringify([audit])
      });
      if (!auditResponse.ok) return withCors(json({ ok:false, error:'Readiness review was saved but its audit event could not be recorded. Resolve before continuing.' },409));
    }
    return withCors(json({
      ok:true,
      message:prepared.row.review_status === 'ready_for_design_review'
        ? 'Readiness recorded for a written private-MVP design review only. Gate C remains Held.'
        : 'DAIP readiness review saved. No technical or public capability is enabled.',
      review
    }));
  } catch (error) {
    return withCors(json({ ok:false, error:error?.message || 'Could not save DAIP readiness review.' },500));
  }
}
function corsHeaders(){ return {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type,x-admin-password,x-staff-email,x-staff-user-id','Cache-Control':'no-store'}; }
function withCors(response){ const headers = new Headers(response.headers || {}); for (const [key,value] of Object.entries(corsHeaders())) headers.set(key,value); return new Response(response.body,{status:response.status,statusText:response.statusText,headers}); }
