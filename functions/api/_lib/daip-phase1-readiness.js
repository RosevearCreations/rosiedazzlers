// Build 222 — DAIP Phase 1 readiness-review helpers.
// This layer records a decision that the team may begin a written private-MVP design review.
// It cannot provision storage, issue upload/download authorization, enqueue work, process media,
// expose customer media, send content to public destinations, or publish anything.

import { serviceHeaders, isUuid } from './staff-auth.js';
import { safeJson, serviceReady } from './daip-test-mode.js';
import { buildGovernanceDashboard, safeGovernanceText, safeDate } from './daip-governance.js';

export const DAIP_READINESS_BUILD = 222;
export const DAIP_READINESS_STATUSES = ['draft', 'ready_for_design_review', 'paused'];
export const DAIP_DESIGN_REVIEW_PHRASE = 'AUTHORIZE DESIGN REVIEW';

function asBoolean(value) { return value === true || String(value || '').trim().toLowerCase() === 'true'; }
function gateById(gates = [], id) { return gates.find((gate) => gate.id === id) || { state:'blocked', detail:'Gate information is unavailable.' }; }

export function safeReadinessText(value, max = 2400) {
  return safeGovernanceText(value, max);
}

export async function loadLatestPhase1Readiness(env) {
  if (!serviceReady(env)) return { ok:false, error:'Supabase service configuration is missing.', review:null };
  const select = [
    'id','review_status','review_owner_label','review_summary','budget_stop_rule_summary','review_due_on',
    'consent_separation_confirmed','retention_legal_hold_confirmed','non_production_acknowledged',
    'gate_a_ready','gate_b_ready','decision_count','test_passed_count','test_control_safe',
    'approved_by_staff_email','approved_at','recorded_by_staff_email','created_at'
  ].join(',');
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/daip_phase1_readiness_reviews?select=${select}&order=created_at.desc&limit=1`, {
    headers:serviceHeaders(env)
  });
  const text = await response.text();
  if (!response.ok) return { ok:false, error:'DAIP readiness tables are not ready. Apply Build 222 migration.', review:null, detail:text.slice(0,180) };
  const rows = safeJson(text) || [];
  return { ok:true, review:rows[0] || null };
}

export async function loadPhase1ReadinessAudit(env) {
  if (!serviceReady(env)) return [];
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/daip_phase1_readiness_audit_events?select=review_id,event_type,actor_staff_email,safe_note,created_at&order=created_at.desc&limit=80`, {
    headers:serviceHeaders(env)
  });
  if (!response.ok) return [];
  return safeJson(await response.text()) || [];
}

export function readyForDesignReview(gates = []) {
  return gateById(gates, 'A').state === 'ready' && gateById(gates, 'B').state === 'ready';
}

export async function buildPhase1ReadinessDashboard(env) {
  const governance = await buildGovernanceDashboard(env);
  const latest = await loadLatestPhase1Readiness(env);
  const audit = latest.ok ? await loadPhase1ReadinessAudit(env) : [];
  const gateA = gateById(governance.gates, 'A');
  const gateB = gateById(governance.gates, 'B');
  const canRecord = governance.ready && latest.ok;
  const canStartDesignReview = canRecord && readyForDesignReview(governance.gates);
  const current = latest.review;
  const currentAuthorizationValid = Boolean(
    current && current.review_status === 'ready_for_design_review' &&
    current.gate_a_ready === true && current.gate_b_ready === true &&
    canStartDesignReview
  );
  return {
    build:DAIP_READINESS_BUILD,
    ready:canRecord,
    warning:governance.warning || latest.error || null,
    governance_summary:governance.summary,
    gate_a:gateA,
    gate_b:gateB,
    can_start_written_design_review:canStartDesignReview,
    current_authorization_valid:currentAuthorizationValid,
    technical_capabilities_enabled:0,
    public_capabilities_enabled:0,
    review:current,
    audit,
    constraints:[
      'A readiness record can authorize only a written private-MVP design review.',
      'No storage, upload, signed-link, worker, processing, customer-media, export, or publishing capability is enabled by this build.',
      'Gate C stays Held until a separately reviewed and accepted technical build exists.'
    ]
  };
}

export function buildPhase1ReadinessInsert({ body = {}, actor = {}, dashboard }) {
  const status = String(body.review_status || 'draft').trim().toLowerCase();
  if (!DAIP_READINESS_STATUSES.includes(status)) return { ok:false, error:'Choose a valid readiness status.' };
  const owner = safeReadinessText(body.review_owner_label, 120);
  const summary = safeReadinessText(body.review_summary, 2400);
  const budget = safeReadinessText(body.budget_stop_rule_summary, 1200);
  const reviewDate = safeDate(body.review_due_on);
  if (!owner || owner.length < 2) return { ok:false, error:'Enter the accountable owner or delegate.' };
  if (!summary || summary.length < 12) return { ok:false, error:'Enter a plain-language readiness summary without URLs, credentials, customer data, or private media references.' };
  if (!budget || budget.length < 12) return { ok:false, error:'Record the budget stop rule and the person responsible for pausing work.' };
  if (!reviewDate) return { ok:false, error:'Choose the review date.' };

  const gateAReady = dashboard?.gate_a?.state === 'ready';
  const gateBReady = dashboard?.gate_b?.state === 'ready';
  const decisionCount = Number(dashboard?.governance_summary?.approved || 0);
  const testPassedCount = Number(dashboard?.governance_summary?.tests_passed || 0);
  const testControlSafe = dashboard?.ready === true;
  const consent = asBoolean(body.consent_separation_confirmed);
  const retention = asBoolean(body.retention_legal_hold_confirmed);
  const nonProduction = asBoolean(body.non_production_acknowledged);

  if (status === 'ready_for_design_review') {
    if (!gateAReady || !gateBReady) return { ok:false, error:'Gate A and Gate B must both be Ready before a written private-MVP design review can be authorized.' };
    if (!(consent && retention && nonProduction)) return { ok:false, error:'Confirm consent separation, retention/legal-hold ownership, and the non-production hard stop.' };
    if (String(body.approval_confirmation || '').trim() !== DAIP_DESIGN_REVIEW_PHRASE) {
      return { ok:false, error:`Type ${DAIP_DESIGN_REVIEW_PHRASE} exactly to record readiness.` };
    }
  }

  const now = new Date().toISOString();
  const actorId = isUuid(actor?.id) ? actor.id : null;
  const actorEmail = safeReadinessText(actor?.email, 320);
  const approval = status === 'ready_for_design_review';
  const row = {
    review_status:status,
    review_owner_label:owner,
    review_summary:summary,
    budget_stop_rule_summary:budget,
    review_due_on:reviewDate,
    consent_separation_confirmed:consent,
    retention_legal_hold_confirmed:retention,
    non_production_acknowledged:nonProduction,
    gate_a_ready:gateAReady,
    gate_b_ready:gateBReady,
    decision_count:decisionCount,
    test_passed_count:testPassedCount,
    test_control_safe:testControlSafe,
    approved_by_staff_user_id:approval ? actorId : null,
    approved_by_staff_email:approval ? actorEmail : null,
    approved_at:approval ? now : null,
    recorded_by_staff_user_id:actorId,
    recorded_by_staff_email:actorEmail,
    created_at:now
  };
  return {
    ok:true,
    row,
    audit:{
      event_type:status === 'ready_for_design_review' ? 'written_design_review_authorized' : (status === 'paused' ? 'readiness_paused' : 'readiness_drafted'),
      actor_staff_user_id:actorId,
      actor_staff_email:actorEmail,
      safe_note:status === 'ready_for_design_review'
        ? 'DAIP readiness recorded for a written private-MVP design review only; technical/public capabilities remain disabled.'
        : (status === 'paused' ? 'DAIP readiness paused; no technical/public capability is enabled.' : 'DAIP readiness draft saved; no technical/public capability is enabled.'),
      created_at:now
    }
  };
}
