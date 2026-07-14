// Build 224 — DAIP Gate C technical-review and rollback acceptance helpers.
// This layer stores review evidence only. It cannot create storage, object paths, upload/download
// authorization, workers, queues, processing, customer-media access, public destinations, or publishing.
import { serviceHeaders, isUuid } from './staff-auth.js';
import { safeJson, serviceReady } from './daip-test-mode.js';
import { safeBlueprintText, buildPrivateMvpDesignDashboard } from './daip-private-mvp-design.js';

export const DAIP_GATE_C_BUILD = 224;
export const DAIP_GATE_C_STATUSES = ['draft','blocked','accepted_for_test_only_implementation_review'];
export const DAIP_GATE_C_ACCEPT_PHRASE = 'ACCEPT TEST-ONLY REVIEW';

function asBoolean(value) { return value === true || String(value || '').trim().toLowerCase() === 'true'; }

export function safeGateCText(value, max = 2400) {
  const text = safeBlueprintText(value, max);
  if (!text) return null;
  const prohibited = [
    /https?:\/\//i, /www\./i, /r2\b/i, /s3\b/i, /supabase\s*storage/i, /google\s*drive/i,
    /\b(bucket|object|key|secret|token|credential|endpoint)\b/i,
    /\b(booking|customer|client)[ _-]?(id|uuid)\b/i,
    /\b(vin|address|postal code|phone|email)\b/i,
    /\b[a-f0-9]{24,}\b/i
  ];
  return prohibited.some((pattern) => pattern.test(text)) ? null : text;
}

async function getRows(env, table, select, limit = 80) {
  if (!serviceReady(env)) return { ok:false, error:'Supabase service configuration is missing.', rows:[] };
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/${table}?select=${encodeURIComponent(select)}&order=created_at.desc&limit=${limit}`, { headers:serviceHeaders(env) });
  const text = await response.text();
  if (!response.ok) return { ok:false, error:`${table} is not ready. Apply the Build 224 migration.`, rows:[], detail:text.slice(0,180) };
  return { ok:true, rows:safeJson(text) || [] };
}

export async function loadLatestGateCReview(env) {
  const select = [
    'id','review_status','technical_owner_label','independent_reviewer_label','acceptance_scope_summary',
    'rollback_plan_summary','failure_test_summary','cost_stop_validation_summary','review_due_on',
    'design_review_id','design_submission_valid','zero_public_destination_confirmed','no_customer_media_confirmed',
    'technical_capabilities_still_disabled','gate_c_held','accepted_by_staff_email','accepted_at',
    'recorded_by_staff_email','created_at'
  ].join(',');
  const result = await getRows(env, 'daip_gate_c_technical_reviews', select, 1);
  return { ...result, review:result.rows[0] || null };
}

export async function loadGateCAudit(env) {
  const result=await getRows(env,'daip_gate_c_technical_review_audit_events','technical_review_id,event_type,actor_staff_email,safe_note,created_at',80);
  return result.ok ? result.rows : [];
}

export async function buildGateCDashboard(env) {
  const blueprint=await buildPrivateMvpDesignDashboard(env);
  const latest=await loadLatestGateCReview(env);
  const audit=latest.ok ? await loadGateCAudit(env) : [];
  const design=blueprint.review || null;
  const currentDesignValid=Boolean(
    blueprint.readiness_authorization_valid === true && design &&
    design.review_status === 'submitted_for_independent_review' &&
    design.gate_c_held === true && design.zero_public_destination_confirmed === true &&
    design.no_customer_media_confirmed === true && design.non_production_acknowledged === true
  );
  return {
    build:DAIP_GATE_C_BUILD,
    ready:blueprint.ready && latest.ok,
    warning:blueprint.warning || latest.error || null,
    design_submission_valid:currentDesignValid,
    design_review_id:design?.id || null,
    design_status:design?.review_status || null,
    gate_c:{ id:'C', label:'Private technical implementation', state:'held', detail:'Build 224 records a technical review and rollback acceptance plan only. It never enables technical or public DAIP capability.' },
    technical_capabilities_enabled:0,
    public_capabilities_enabled:0,
    review:latest.review,
    audit,
    constraints:[
      'This is a test-only technical review and rollback acceptance record, not a deployment approval.',
      'No customer media, customer record, storage detail, URL, credential, object path, or external-system configuration is allowed.',
      'Gate C remains held. Any future implementation requires a separate reviewed build and staging acceptance.'
    ]
  };
}

export function buildGateCInsert({ body={}, actor={}, dashboard={} }) {
  const status=String(body.review_status || 'draft').trim().toLowerCase();
  if (!DAIP_GATE_C_STATUSES.includes(status)) return { ok:false, error:'Choose a valid Gate C review status.' };
  const owner=safeGateCText(body.technical_owner_label,120);
  const reviewer=safeGateCText(body.independent_reviewer_label,120);
  const scope=safeGateCText(body.acceptance_scope_summary,2400);
  const rollback=safeGateCText(body.rollback_plan_summary,2400);
  const failure=safeGateCText(body.failure_test_summary,2000);
  const cost=safeGateCText(body.cost_stop_validation_summary,1600);
  const due=String(body.review_due_on || '').trim();
  for (const [label,value] of [['technical owner',owner],['independent reviewer',reviewer]]) if (!value || value.length < 2) return {ok:false,error:`Enter the ${label}.`};
  for (const [label,value] of [['acceptance scope',scope],['rollback plan',rollback],['failure-test plan',failure],['cost-stop validation',cost]]) if (!value || value.length < 12) return {ok:false,error:`Enter a safe plain-language ${label} of at least 12 characters.`};
  if (!/^\d{4}-\d{2}-\d{2}$/.test(due)) return {ok:false,error:'Choose a review date.'};
  const zeroPublic=asBoolean(body.zero_public_destination_confirmed);
  const noCustomer=asBoolean(body.no_customer_media_confirmed);
  const disabled=asBoolean(body.technical_capabilities_still_disabled);
  const designValid=dashboard.design_submission_valid === true;
  const designId=dashboard.design_review_id || null;
  if (status==='accepted_for_test_only_implementation_review') {
    if (!designValid || !designId) return {ok:false,error:'A current submitted Build 223 blueprint is required before a Gate C technical review can be accepted.'};
    if (!(zeroPublic && noCustomer && disabled)) return {ok:false,error:'Confirm no public destination, no customer media, and that technical capabilities remain disabled.'};
    if (String(body.acceptance_confirmation || '').trim() !== DAIP_GATE_C_ACCEPT_PHRASE) return {ok:false,error:`Type ${DAIP_GATE_C_ACCEPT_PHRASE} exactly to accept this review.`};
  }
  const now=new Date().toISOString(); const actorId=isUuid(actor?.id)?actor.id:null; const actorEmail=safeGateCText(actor?.email,320);
  const accepted=status==='accepted_for_test_only_implementation_review';
  const row={
    review_status:status,technical_owner_label:owner,independent_reviewer_label:reviewer,
    acceptance_scope_summary:scope,rollback_plan_summary:rollback,failure_test_summary:failure,cost_stop_validation_summary:cost,
    review_due_on:due,design_review_id:designId,design_submission_valid:designValid,
    zero_public_destination_confirmed:zeroPublic,no_customer_media_confirmed:noCustomer,
    technical_capabilities_still_disabled:disabled,gate_c_held:true,
    accepted_by_staff_user_id:accepted?actorId:null,accepted_by_staff_email:accepted?actorEmail:null,accepted_at:accepted?now:null,
    recorded_by_staff_user_id:actorId,recorded_by_staff_email:actorEmail,created_at:now
  };
  const eventType=accepted?'technical_review_accepted_for_test_only':(status==='blocked'?'technical_review_blocked':'technical_review_drafted');
  return {ok:true,row,audit:{event_type:eventType,actor_staff_user_id:actorId,actor_staff_email:actorEmail,safe_note:accepted?'Gate C technical review accepted for test-only implementation planning; Gate C remains held and all technical/public capabilities remain disabled.':(status==='blocked'?'Gate C technical review blocked; no technical/public capability is enabled.':'Gate C technical review draft saved; no technical/public capability is enabled.'),created_at:now}};
}
