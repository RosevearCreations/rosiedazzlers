// Build 223 — DAIP private-MVP design-blueprint helpers.
// This layer records a written technical proposal for independent review only.
// It cannot provision R2/Supabase Storage, issue upload/download authorization, create queues,
// process media, expose customer assets, export content, or publish anything.

import { serviceHeaders, isUuid } from './staff-auth.js';
import { safeJson, serviceReady } from './daip-test-mode.js';
import { safeGovernanceText, safeDate } from './daip-governance.js';
import { buildPhase1ReadinessDashboard } from './daip-phase1-readiness.js';

export const DAIP_PRIVATE_MVP_BUILD = 223;
export const DAIP_PRIVATE_MVP_STATUSES = ['draft', 'submitted_for_independent_review', 'paused'];
export const DAIP_PRIVATE_MVP_SUBMIT_PHRASE = 'SUBMIT DESIGN BLUEPRINT';

function asBoolean(value) { return value === true || String(value || '').trim().toLowerCase() === 'true'; }

export function safeBlueprintText(value, max = 2400) {
  const text = safeGovernanceText(value, max);
  if (!text) return null;
  // Keep reviews design-level. The workspace must never become a location for object paths,
  // storage account names, upload URLs, IAM-style credentials, or customer information.
  const forbidden = [
    /r2\.cloudflarestorage\.com/i, /storage\.googleapis\.com/i, /s3\.amazonaws\.com/i,
    /\b[a-f0-9]{32,}\b/i, /\b(account|project)[ _-]?id\s*[:=]/i,
    /\b(object|bucket)[ _-]?(name|path)\s*[:=]/i, /\b(booking|customer|client)[ _-]?(id|uuid)\s*[:=]/i,
    /\b(address|postal code|phone|email)\s*[:=]/i
  ];
  return forbidden.some((pattern) => pattern.test(text)) ? null : text;
}

async function getRows(env, table, select, limit = 60) {
  if (!serviceReady(env)) return { ok:false, error:'Supabase service configuration is missing.', rows:[] };
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/${table}?select=${encodeURIComponent(select)}&order=created_at.desc&limit=${limit}`, { headers:serviceHeaders(env) });
  const body = await response.text();
  if (!response.ok) return { ok:false, error:`${table} is not ready. Apply the Build 223 migration.`, rows:[], detail:body.slice(0,180) };
  return { ok:true, rows:safeJson(body) || [] };
}

export async function loadLatestPrivateMvpDesign(env) {
  const select = [
    'id','review_status','design_owner_label','independent_reviewer_label','design_summary','threat_model_summary',
    'upload_control_summary','storage_separation_summary','cost_telemetry_summary','rollback_acceptance_summary',
    'review_due_on','readiness_review_id','readiness_authorization_valid','zero_public_destination_confirmed',
    'no_customer_media_confirmed','non_production_acknowledged','gate_c_held','submitted_by_staff_email',
    'submitted_at','recorded_by_staff_email','created_at'
  ].join(',');
  const result = await getRows(env, 'daip_private_mvp_design_reviews', select, 1);
  return { ...result, review:result.rows[0] || null };
}

export async function loadPrivateMvpDesignAudit(env) {
  const select = 'design_review_id,event_type,actor_staff_email,safe_note,created_at';
  const result = await getRows(env, 'daip_private_mvp_design_audit_events', select, 80);
  return result.ok ? result.rows : [];
}

export async function buildPrivateMvpDesignDashboard(env) {
  const readiness = await buildPhase1ReadinessDashboard(env);
  const latest = await loadLatestPrivateMvpDesign(env);
  const audit = latest.ok ? await loadPrivateMvpDesignAudit(env) : [];
  const canRecord = readiness.ready && latest.ok;
  const currentReadiness = readiness.review || null;
  const authorizationValid = readiness.current_authorization_valid === true;
  return {
    build:DAIP_PRIVATE_MVP_BUILD,
    ready:canRecord,
    warning:readiness.warning || latest.error || null,
    readiness_authorization_valid:authorizationValid,
    readiness_record_id:currentReadiness?.id || null,
    readiness_status:currentReadiness?.review_status || null,
    gate_c:{ id:'C', label:'Private storage/upload design', state:'held', detail:'Build 223 collects a written blueprint only. Gate C remains held until a separately reviewed technical implementation and acceptance review.' },
    technical_capabilities_enabled:0,
    public_capabilities_enabled:0,
    review:latest.review,
    audit,
    constraints:[
      'Blueprint records are design evidence only and do not provision technical capability.',
      'No real customer media, customer record, object path, URL, credential, bucket name, or storage configuration is allowed.',
      'No public destination, customer access, gallery/social handoff, export, or automatic publishing can be enabled by Build 223.'
    ]
  };
}

export function buildPrivateMvpDesignInsert({ body = {}, actor = {}, dashboard = {} }) {
  const status = String(body.review_status || 'draft').trim().toLowerCase();
  if (!DAIP_PRIVATE_MVP_STATUSES.includes(status)) return { ok:false, error:'Choose a valid design-blueprint status.' };
  const owner = safeBlueprintText(body.design_owner_label, 120);
  const reviewer = safeBlueprintText(body.independent_reviewer_label, 120);
  const summary = safeBlueprintText(body.design_summary, 2400);
  const threat = safeBlueprintText(body.threat_model_summary, 2400);
  const upload = safeBlueprintText(body.upload_control_summary, 2400);
  const storage = safeBlueprintText(body.storage_separation_summary, 2400);
  const cost = safeBlueprintText(body.cost_telemetry_summary, 1600);
  const rollback = safeBlueprintText(body.rollback_acceptance_summary, 1600);
  const reviewDate = safeDate(body.review_due_on);
  const zeroPublic = asBoolean(body.zero_public_destination_confirmed);
  const noCustomer = asBoolean(body.no_customer_media_confirmed);
  const nonProduction = asBoolean(body.non_production_acknowledged);
  if (!owner || owner.length < 2) return { ok:false, error:'Enter the accountable design owner.' };
  if (!reviewer || reviewer.length < 2) return { ok:false, error:'Name the independent reviewer or reviewing role.' };
  for (const [name,value] of [['design summary',summary],['threat model',threat],['upload-control outline',upload],['storage-separation outline',storage],['cost-telemetry outline',cost],['rollback/acceptance outline',rollback]]) {
    if (!value || value.length < 12) return { ok:false, error:`Enter a safe plain-language ${name} of at least 12 characters.` };
  }
  if (!reviewDate) return { ok:false, error:'Choose the independent-review due date.' };
  const readinessValid = dashboard.readiness_authorization_valid === true;
  const readinessId = dashboard.readiness_record_id || null;
  if (status === 'submitted_for_independent_review') {
    if (!readinessValid || !readinessId) return { ok:false, error:'A current Build 222 written-design-review authorization is required before this blueprint can be submitted.' };
    if (!(zeroPublic && noCustomer && nonProduction)) return { ok:false, error:'Confirm zero public destination, no customer media, and the non-production hard stop.' };
    if (String(body.submission_confirmation || '').trim() !== DAIP_PRIVATE_MVP_SUBMIT_PHRASE) return { ok:false, error:`Type ${DAIP_PRIVATE_MVP_SUBMIT_PHRASE} exactly to submit this blueprint.` };
  }
  const now = new Date().toISOString();
  const actorId = isUuid(actor?.id) ? actor.id : null;
  const actorEmail = safeBlueprintText(actor?.email, 320);
  const submitted = status === 'submitted_for_independent_review';
  const row = {
    review_status:status,
    design_owner_label:owner,
    independent_reviewer_label:reviewer,
    design_summary:summary,
    threat_model_summary:threat,
    upload_control_summary:upload,
    storage_separation_summary:storage,
    cost_telemetry_summary:cost,
    rollback_acceptance_summary:rollback,
    review_due_on:reviewDate,
    readiness_review_id:readinessId,
    readiness_authorization_valid:readinessValid,
    zero_public_destination_confirmed:zeroPublic,
    no_customer_media_confirmed:noCustomer,
    non_production_acknowledged:nonProduction,
    gate_c_held:true,
    submitted_by_staff_user_id:submitted ? actorId : null,
    submitted_by_staff_email:submitted ? actorEmail : null,
    submitted_at:submitted ? now : null,
    recorded_by_staff_user_id:actorId,
    recorded_by_staff_email:actorEmail,
    created_at:now
  };
  const eventType = submitted ? 'blueprint_submitted_for_independent_review' : (status === 'paused' ? 'blueprint_paused' : 'blueprint_drafted');
  const safeNote = submitted
    ? 'Private-MVP design blueprint submitted for independent review only; Gate C remains held and all technical/public capabilities remain disabled.'
    : (status === 'paused'
      ? 'Private-MVP design blueprint paused; Gate C remains held and no technical/public capability is enabled.'
      : 'Private-MVP design blueprint draft saved; Gate C remains held and no technical/public capability is enabled.');
  return {
    ok:true,
    row,
    audit:{ event_type:eventType, actor_staff_user_id:actorId, actor_staff_email:actorEmail, safe_note:safeNote, created_at:now }
  };
}
