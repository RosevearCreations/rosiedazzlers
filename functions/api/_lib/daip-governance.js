// Build 219 — DAIP governance helpers.
// This layer records decisions and readiness evidence only. It never creates storage
// credentials, upload URLs, worker tasks, exports, customer media access, or publishing.

import { serviceHeaders, cleanText, isUuid } from './staff-auth.js';
import { readTestControl, serviceReady, safeJson } from './daip-test-mode.js';

export const DAIP_GOVERNANCE_BUILD = 219;
export const DAIP_DECISION_KEYS = [
  'DAIP-0-01','DAIP-0-02','DAIP-0-03','DAIP-0-04','DAIP-0-05','DAIP-0-06',
  'DAIP-0-07','DAIP-0-08','DAIP-0-09','DAIP-0-10','DAIP-0-11','DAIP-0-12'
];

export const DAIP_DECISIONS = [
  ['DAIP-0-01','Worker hosting','Choose a private background host suitable for future FFmpeg/OpenCV/transcription work; Pages Functions remain request handlers only.'],
  ['DAIP-0-02','Monthly cost ceiling','Set the monthly storage, egress, rendering, AI, and failed-retry ceiling before any processor is enabled.'],
  ['DAIP-0-03','Original storage','Choose the private original-storage and controlled-backup boundary, including download authority.'],
  ['DAIP-0-04','Google Drive role','Choose backup-only, operator-viewable mirror, or deferred. Drive must not become a second uncontrolled source of truth.'],
  ['DAIP-0-05','Consent language','Approve wording that separates service proof, customer portal visibility, gallery reuse, marketing reuse, and later publication.'],
  ['DAIP-0-06','Privacy-review roles','Name who can start a job, review privacy, approve export, approve gallery reuse, and approve any future publication.'],
  ['DAIP-0-07','Retention','Set retention for originals, proxies, rejected candidates, approved derivatives, legal hold, and dispute material.'],
  ['DAIP-0-08','Incident/legal-hold handling','Define exclusions and the written exception process for incident, dispute, safety, or legal-hold material.'],
  ['DAIP-0-09','Internal test set','Choose a staff-owned/internal, harmless media set. Never begin the next phase with a customer job.'],
  ['DAIP-0-10','Human review SLA','Choose review timing, escalation owner, and how failed or blocked media jobs are resolved.'],
  ['DAIP-0-11','Public destination scope','Confirm Phase 1 has no public destination; gallery, website, GBP, and social remain later reviewed actions.'],
  ['DAIP-0-12','Budget stop rule','Define the automatic processing pause/alert threshold for spend, storage, or egress.']
].map(([key,title,prompt]) => ({ key, title, prompt }));

export const REQUIRED_BUILD218_TESTS = [
  'daip_test_mode_preflight',
  'daip_internal_test_registry',
  'daip_internal_privacy_export_block'
];

const DECISION_BY_KEY = new Map(DAIP_DECISIONS.map((row) => [row.key, row]));

export function getDecisionDefinition(key) { return DECISION_BY_KEY.get(String(key || '').trim()) || null; }

export function expectedApprovalPhrase(key) { return `APPROVE ${String(key || '').trim()}`; }

export function safeGovernanceText(value, max = 2400) {
  const text = cleanText(value);
  if (!text || text.length > max) return null;
  // Governance documents must never carry credentials, URLs, signed links, raw object paths,
  // or a customer identifier. Sensitive values belong nowhere in this decision workspace.
  const forbidden = [
    /https?:\/\//i, /s3:\/\//i, /sk_(live|test)_/i, /whsec_/i, /supabase[_ -]?service/i,
    /api[_ -]?key/i, /private[_ -]?key/i, /password/i, /bearer\s+[a-z0-9._-]+/i,
    /signed[_ -]?url/i, /storage[_ -]?(key|path|bucket)/i, /drive[_ -]?file[_ -]?id/i,
    /\bvin\b\s*[:#-]?[a-z0-9]{6,}/i
  ];
  return forbidden.some((pattern) => pattern.test(text)) ? null : text;
}

export function safeDate(value) {
  const text = String(value || '').trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
}

export function normalizeDecision(row = {}) {
  const definition = getDecisionDefinition(row.decision_key);
  return {
    key: definition?.key || String(row.decision_key || ''),
    title: definition?.title || String(row.decision_title || ''),
    prompt: definition?.prompt || '',
    status: row.resolution_status === 'approved' ? 'approved' : (row.resolution_status === 'draft' ? 'draft' : 'open'),
    decision_owner_label: row.decision_owner_label || '',
    decision_summary: row.decision_summary || '',
    business_cost_impact: row.business_cost_impact || '',
    privacy_safety_impact: row.privacy_safety_impact || '',
    review_due_on: row.review_due_on || '',
    approved_at: row.approved_at || null,
    approved_by_staff_email: row.approved_by_staff_email || null,
    recorded_by_staff_email: row.recorded_by_staff_email || null,
    revision_number: Number(row.revision_number || 0),
    updated_at: row.updated_at || null
  };
}

export async function loadGovernanceRows(env) {
  if (!serviceReady(env)) return { ok:false, error:'Supabase service configuration is missing.', rows:[] };
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/daip_governance_decisions?select=decision_key,decision_title,resolution_status,decision_owner_label,decision_summary,business_cost_impact,privacy_safety_impact,review_due_on,approved_at,approved_by_staff_email,recorded_by_staff_email,revision_number,updated_at&order=decision_key.asc`, { headers:serviceHeaders(env) });
  const text = await response.text();
  if (!response.ok) return { ok:false, error:'DAIP governance tables are not ready. Apply Build 219 migration.', rows:[], detail:text.slice(0,180) };
  return { ok:true, rows:safeJson(text) || [] };
}

export async function loadGovernanceAudit(env) {
  if (!serviceReady(env)) return [];
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/daip_governance_audit_events?select=decision_key,event_type,actor_staff_email,revision_number,safe_note,created_at&order=created_at.desc&limit=80`, { headers:serviceHeaders(env) });
  if (!response.ok) return [];
  return safeJson(await response.text()) || [];
}

export async function loadLatestTestRuns(env) {
  if (!serviceReady(env)) return { rows:[], warning:'Supabase service configuration is missing.' };
  const filter = REQUIRED_BUILD218_TESTS.map((key) => encodeURIComponent(`"${key}"`)).join(',');
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/production_test_runs?select=test_key,status,performed_at,created_at,environment&test_key=in.(${filter})&order=performed_at.desc,created_at.desc&limit=120`, { headers:serviceHeaders(env) });
  const text = await response.text();
  if (!response.ok) return { rows:[], warning:'Guided test history is unavailable. Apply Build 212 migration and record Build 218 tests.', detail:text.slice(0,160) };
  const firstByKey = {};
  for (const row of safeJson(text) || []) if (!firstByKey[row.test_key]) firstByKey[row.test_key] = row;
  return { rows:REQUIRED_BUILD218_TESTS.map((key) => ({ key, ...(firstByKey[key] || { status:'not_started' }) })), warning:null };
}

export async function buildGovernanceDashboard(env) {
  const control = await readTestControl(env);
  const loaded = await loadGovernanceRows(env);
  const tests = await loadLatestTestRuns(env);
  const audit = loaded.ok ? await loadGovernanceAudit(env) : [];
  const existing = new Map(loaded.rows.map((row) => [row.decision_key, row]));
  const decisions = DAIP_DECISIONS.map((definition) => normalizeDecision(existing.get(definition.key) || { decision_key:definition.key, decision_title:definition.title }));
  const approved = decisions.filter((row) => row.status === 'approved');
  const drafted = decisions.filter((row) => row.status === 'draft');
  const testPassed = tests.rows.filter((row) => row.status === 'passed');
  const gates = [
    { id:'A', name:'Owner decisions', state:approved.length === DAIP_DECISIONS.length ? 'ready' : 'blocked', detail:`${approved.length}/${DAIP_DECISIONS.length} DAIP-0 decisions owner-approved.` },
    { id:'B', name:'Build 218 safety evidence', state:control.ok && testPassed.length === REQUIRED_BUILD218_TESTS.length ? 'ready' : 'blocked', detail:`${testPassed.length}/${REQUIRED_BUILD218_TESTS.length} required internal-test result(s) passed; test control is ${control.ok ? 'safe' : 'not ready'}.` },
    { id:'C', name:'Private storage/upload design', state:'held', detail:'Held: a separate reviewed future migration is required. Build 219 creates no storage, upload, or signed-link capability.' },
    { id:'D', name:'Private processing MVP', state:'held', detail:'Held: no worker, FFmpeg, proxy, thumbnails, AI, or queue execution is authorized in this build.' },
    { id:'E', name:'Privacy/export proof', state:'held', detail:'Held: no customer access, gallery/social handoff, or public derivative is enabled.' },
    { id:'F', name:'Controlled production pilot', state:'held', detail:'Held: impossible until Gates A–E are separately passed and a written rollout/rollback plan exists.' }
  ];
  return {
    build:DAIP_GOVERNANCE_BUILD,
    ready:loaded.ok && control.ok,
    setup_required:!loaded.ok,
    warning:loaded.ok ? (control.ok ? null : control.error) : loaded.error,
    control:control.ok ? control.control : null,
    decisions,
    audit,
    tests:tests.rows,
    test_warning:tests.warning || null,
    gates,
    summary:{ total:DAIP_DECISIONS.length, approved:approved.length, drafted:drafted.length, open:DAIP_DECISIONS.length - approved.length - drafted.length, tests_passed:testPassed.length, production_capabilities_enabled:0 }
  };
}

export function buildGovernanceUpsert({ body, actor, existing }) {
  const definition = getDecisionDefinition(body?.decision_key);
  if (!definition) return { ok:false, error:'Choose a valid DAIP-0 decision.' };
  const status = String(body?.resolution_status || 'draft').trim().toLowerCase();
  if (!['draft','approved'].includes(status)) return { ok:false, error:'Save a draft or approve a decision.' };
  const owner = safeGovernanceText(body?.decision_owner_label, 120);
  const summary = safeGovernanceText(body?.decision_summary, 2400);
  const cost = safeGovernanceText(body?.business_cost_impact, 1600);
  const privacy = safeGovernanceText(body?.privacy_safety_impact, 1600);
  const reviewDate = safeDate(body?.review_due_on);
  if (!owner || owner.length < 2) return { ok:false, error:'Enter the owner or accountable delegate.' };
  if (!summary || summary.length < 12) return { ok:false, error:'Enter a clear decision summary with no keys, URLs, customer data, or private media references.' };
  if (!cost || cost.length < 6) return { ok:false, error:'Enter the business/cost impact, even if the decision has no new cost.' };
  if (!privacy || privacy.length < 6) return { ok:false, error:'Enter the privacy/safety impact.' };
  if (!reviewDate) return { ok:false, error:'Choose a review date.' };
  if (status === 'approved' && String(body?.approval_confirmation || '').trim() !== expectedApprovalPhrase(definition.key)) {
    return { ok:false, error:`Type ${expectedApprovalPhrase(definition.key)} exactly to record owner approval.` };
  }
  const now = new Date().toISOString();
  const revision = Math.max(0, Number(existing?.revision_number || 0)) + 1;
  const actorId = isUuid(actor?.id) ? actor.id : null;
  const actorEmail = safeGovernanceText(actor?.email, 320);
  return {
    ok:true,
    decision:definition,
    row:{
      decision_key:definition.key,
      decision_title:definition.title,
      resolution_status:status,
      decision_owner_label:owner,
      decision_summary:summary,
      business_cost_impact:cost,
      privacy_safety_impact:privacy,
      review_due_on:reviewDate,
      approved_by_staff_user_id:status === 'approved' ? actorId : null,
      approved_by_staff_email:status === 'approved' ? actorEmail : null,
      approved_at:status === 'approved' ? now : null,
      recorded_by_staff_user_id:actorId,
      recorded_by_staff_email:actorEmail,
      revision_number:revision,
      updated_at:now
    },
    audit:{
      decision_key:definition.key,
      event_type:status === 'approved' ? 'decision_approved' : (existing?.resolution_status === 'approved' ? 'decision_reopened' : 'decision_drafted'),
      actor_staff_user_id:actorId,
      actor_staff_email:actorEmail,
      revision_number:revision,
      safe_note:status === 'approved' ? 'Owner approval recorded in DAIP governance workspace.' : 'DAIP governance draft saved; production capabilities remain disabled.',
      created_at:now
    }
  };
}
