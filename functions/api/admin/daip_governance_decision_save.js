// Build 219 — save a DAIP-0 decision draft or owner approval. No media capability is enabled here.
import { requireStaffAccess, serviceHeaders, json } from '../_lib/staff-auth.js';
import { serviceReady, safeJson } from '../_lib/daip-test-mode.js';
import { buildGovernanceUpsert, DAIP_GOVERNANCE_BUILD } from '../_lib/daip-governance.js';

export async function onRequestOptions(){ return new Response('', { status:204, headers:corsHeaders() }); }
export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const access = await requireStaffAccess({ request, env, body, capability:'manage_staff', allowLegacyAdminFallback:true });
    if (!access.ok) return withCors(access.response);
    if (!serviceReady(env)) return withCors(json({ ok:false, error:'Supabase service configuration is missing.' }, 500));
    const decisionKey = String(body?.decision_key || '').trim();
    const existingResponse = await fetch(`${env.SUPABASE_URL}/rest/v1/daip_governance_decisions?select=decision_key,resolution_status,revision_number&decision_key=eq.${encodeURIComponent(decisionKey)}&limit=1`, { headers:serviceHeaders(env) });
    const existingText = await existingResponse.text();
    if (!existingResponse.ok) return withCors(json({ ok:false, error:'DAIP governance tables are not ready. Apply Build 219 migration.' }, 409));
    const existing = (safeJson(existingText) || [])[0] || null;
    const prepared = buildGovernanceUpsert({ body, actor:access.actor, existing });
    if (!prepared.ok) return withCors(json({ ok:false, error:prepared.error }, 400));

    const decisionResponse = await fetch(`${env.SUPABASE_URL}/rest/v1/daip_governance_decisions?on_conflict=decision_key`, {
      method:'POST', headers:{...serviceHeaders(env), Prefer:'resolution=merge-duplicates,return=representation'}, body:JSON.stringify([prepared.row])
    });
    const decisionText = await decisionResponse.text();
    const saved = (safeJson(decisionText) || [])[0] || null;
    if (!decisionResponse.ok || !saved) return withCors(json({ ok:false, error:'Could not save the DAIP governance decision.' }, 500));

    const auditResponse = await fetch(`${env.SUPABASE_URL}/rest/v1/daip_governance_audit_events`, {
      method:'POST', headers:{...serviceHeaders(env), Prefer:'return=minimal'}, body:JSON.stringify([prepared.audit])
    });
    if (!auditResponse.ok) return withCors(json({ ok:false, error:'Decision was saved but its required governance audit event could not be recorded.' }, 500));

    return withCors(json({ ok:true, build:DAIP_GOVERNANCE_BUILD, decision:saved, message:prepared.row.resolution_status === 'approved' ? 'Owner approval recorded. DAIP storage, workers, exports, and publishing remain disabled.' : 'DAIP-0 decision draft saved. Production capabilities remain disabled.' }));
  } catch (error) {
    return withCors(json({ ok:false, build:DAIP_GOVERNANCE_BUILD, error:error?.message || 'Could not save DAIP governance decision.' }, 500));
  }
}
function corsHeaders(){ return {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type,x-admin-password,x-staff-email,x-staff-user-id','Cache-Control':'no-store'}; }
function withCors(response){ const headers=new Headers(response.headers||{}); for(const [key,value] of Object.entries(corsHeaders())) headers.set(key,value); return new Response(response.body,{status:response.status,statusText:response.statusText,headers}); }
