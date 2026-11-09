// Build 827 — source-owned REQUIREMENT DRAFTS, never approved Master scoring.
// Stable identifiers are based on named capabilities and scopes, not array order.
// Repeated device scopes share a requirement ID but require separate evidence.
import {MODULE_BASELINE_825} from './build825-module-baseline.mjs';

export const REGISTRY_VERSION_827='rosie.module-requirements.draft.v1';
export const REGISTRY_AUDIT_827='docs/ROSIE_MODULE_COMPLETION_AUDIT_20261108.md';
const SHARED={
  'customer-experience':'An authenticated customer completes and recovers the booking/account journey with authorized access.',
  'worker-detailer':'A signed-in detailer completes the authorized assignment, field checklist and signoff journey.',
  'admin':'An authorized administrator performs and reviews permitted operations without access escalation.'
};
const CRITERIA={
  'project-creative-work-tracking':'A project has attributable sessions, cost lines, outputs and a reviewed completion.',
  'crm-lead-management':'A consented lead is converted or closed with authorized customer history and follow-up.',
  'social-integration-publishing':'A channel-specific draft passes approval and its actual dispatch receipt is reviewed.',
  'job-preparation':'A real job has site checks, readiness constraints and staff preparation confirmed.',
  'job-progress-and-signoff':'A real job has attributable progress, quality exceptions and owner signoff.',
  'scheduling-dispatch':'Capacity, assignment, shift constraints and reschedule exceptions reconcile for a real job.',
  'booking-and-quote-journey':'A consented booking and quote follow authoritative catalogue, availability and deposit rules.',
  'payroll':'An approved real time entry reconciles to a payroll run and owner review.',
  'invoicing-final-balances':'A completed job reconciles to a delivered invoice, balance and payment evidence.',
  'accounting-and-reconciliation':'Authorized journals, bank records and a real period close reconcile with review.',
  'taxation-hst-t2125':'Source workpapers and HST/T2125 treatment are reviewed by the authorized accountant.',
  'rosevear-application-integration-comms-hub':'Original owner, signer and witness proof permits a scoped source TEST receipt and readback.',
  'storefront-customer-catalogue':'A customer views current services/prices and receives authorized fulfilment confirmation.',
  'inventory-stock-control':'A physical stock movement reconciles to its authorized inventory source record.',
  'supplies-consumables':'Actual worksite consumption reconciles to stock and job costs.',
  'tools-equipment':'A real asset has assigned custody, condition checks and maintenance evidence.',
  'end-products-service-deliverables':'A real service deliverable is checked against its ordered scope and accepted quality.',
  'job-profitability-financial-tracking':'A finished job reconciles labour, materials, fees and margin to actual entries.',
  'payments-deposits-and-refunds':'A provider-authenticated payment, deposit or refund reconciles to an authorized order.',
  'security-privacy-rbac':'Negative access tests and independently reviewed permissions protect private roles and data.',
  'advertising-and-paid-campaigns':'Approved campaign spend reconciles to provider results and source attribution.',
  'i-t-cross-module-operations-dashboard':'Live source health, stale data and recovery actions reflect dated authoritative evidence.',
  'customer-communications-and-consent':'A consented message has source authorization, provider delivery outcome and safe opt-out.',
  'media-photo-provenance-and-consent':'A real asset has provenance, use consent and appropriate access/retention evidence.',
  'local-seo-search-console-gbp':'Current Search Console and Business Profile observations support approved SEO changes.',
  'fleet-maintenance-programs':'A real fleet service plan has owner approval, execution and maintenance history.',
  'backup-disaster-recovery':'An independently witnessed restore meets the agreed recovery steps and access policy.',
  'analytics-retention-conversion':'An attributable observed cohort supports conversion and retention reports without PII leaks.',
  'loyalty-referrals-rebooking':'A consented customer repeat/referral journey reconciles to its original source transaction.',
  'legal-policies-tax-compliance-review':'Current policies, privacy and tax compliance are signed off by the appropriate owner/adviser.',
  'weather-seasonality-and-field-safety':'Real site, season and weather constraints result in an authorized safe work decision.',
  'customer-support-and-exceptions':'An actual customer exception is resolved with authorized follow-up and outcome evidence.',
  'staff-management-permissions':'Actual staff assignments, access and offboarding are confirmed under least privilege.',
  'procurement-vendors':'A real purchase, delivery and vendor invoice reconcile to approved stock and cost.',
  'monitoring-observability-incident-management':'A real incident has timely detection, source-linked triage, owner action and closure proof.',
  'gift-cards-and-promotions':'A real gift or promotion issuance/redeem journey reconciles to provider and balance records.'
};
const DEVICE_SUFFIX=/(?:-desktop|-mobile|-tablet)$/;
const capabilityFor=moduleId=>{
  const shared=moduleId.replace(DEVICE_SUFFIX,'');
  return Object.hasOwn(SHARED,shared)?shared:moduleId;
};
const criterionFor=capability=>SHARED[capability]||CRITERIA[capability];
const deviceFor=moduleId=>moduleId.endsWith('-desktop')?'desktop':
  moduleId.endsWith('-mobile')?'phone':moduleId.endsWith('-tablet')?'tablet':null;

const rows=MODULE_BASELINE_825.map(module=>{
  const capability=capabilityFor(module.id),criterion=criterionFor(capability);
  if(!criterion)throw Error('Unmapped Rosie requirement draft: '+module.id);
  return Object.freeze({
    moduleId:module.id,moduleName:module.name,
    requirementId:'rd-req-v1-'+capability,
    scopeId:'rd-scope-v1-'+module.id,
    capability,proposedCriterion:criterion,
    roleVariant:module.role||null,deviceVariant:deviceFor(module.id),
    sourceHint:module.source||null,
    proposedOwnerRole:module.role?module.role+' product steward':'Rosie product owner',
    ownerIdentity:null,ownerApprovedAt:null,scopeApproved:false,
    status:'DRAFT_UNSCOPED',inScope:null,weight:null,
    evidenceRef:null,evidenceURI:null,evidenceObservedAt:null,
    evidenceReviewedAt:null,freshness:'UNKNOWN',
    approvedNumerator:null,approvedDenominator:null,
    auditContextURI:REGISTRY_AUDIT_827,
    evidenceIsIndependent:false
  });
});
if(rows.length!==45||new Set(rows.map(x=>x.scopeId)).size!==45||
   new Set(rows.map(x=>x.requirementId)).size!==39)
  throw Error('Rosie draft registry scope/identity mismatch');

export const MODULE_REQUIREMENT_SCOPES_827=Object.freeze(rows);
export function draftRegistry827({events=[]}={}){
  // A source ledger pointer is review context, NOT approved numerator evidence.
  // The private endpoint returns at most 100 recent events, never a full audit.
  const latest=new Map();
  for(const event of Array.isArray(events)?events.slice(0,100):[]){
    if(event?.event_kind!=='module_review'||!rows.some(x=>x.moduleId===event.module_id)||
      !/^[0-9a-f-]{36}$/i.test(event.id||'')||
      !/^[A-Za-z][A-Za-z0-9:_.-]{5,79}$/.test(event.evidence_ref||'')||
      !Number.isFinite(Date.parse(event.recorded_at||'')))continue;
    if(!latest.has(event.module_id)||Date.parse(event.recorded_at)>Date.parse(latest.get(event.module_id).recorded_at))
      latest.set(event.module_id,event);
  }
  const requirements=new Map();
  for(const row of MODULE_REQUIREMENT_SCOPES_827){
    if(!requirements.has(row.requirementId))requirements.set(row.requirementId,Object.freeze({
      requirementId:row.requirementId,proposedCriterion:row.proposedCriterion,
      ownerApproved:false,approvedWeight:null,approvedEvidence:null
    }));
  }
  return {
    schema:REGISTRY_VERSION_827,sourceId:'rosiedazzlers',
    shellBoundary:'owned_business_shell',contractStatus:'LOCAL_DRAFT_NOT_APPROVED',
    totalModules:MODULE_BASELINE_825.length,
    distinctRequirementDrafts:requirements.size,scopeDrafts:rows.length,
    requirements:[...requirements.values()],
    scopes:rows.map(row=>{
      const event=latest.get(row.moduleId);
      return {...row,linkedLocalReview:event?{
        eventId:event.id,evidenceRef:event.evidence_ref,
        recordedAt:event.recorded_at,reviewState:event.review_state,
        provenance:'LOCAL_OPERATOR_REPORTED_UNVERIFIED'
      }:null};
    }),
    recentHistoryLimit:100,partialHistory:true,
    approvedRequirementCount:0,approvedNumerator:null,approvedDenominator:null,
    approvedWeightSum:null,completionPercent:null,scoringAuthorized:false,
    evidenceVerified:false,masterOwnerApproved:false,
    dataSentToAIPlatform:false,dataSentToCommsHub:false,
    connectionState:'DISCONNECTED / HOLD',canonicalHoldChanged:false,
    reviewNext:'Product owner must approve scope, owner, criteria, weights and authentic evidence; AI Data controls the final scoring contract.'
  };
}
