// Build 833: local, source-owned Comms contract review. A source preview is
// neither an approved integration contract nor permission to dispatch.
export const COMMS_SCHEMA_833='rosie.comms.shell-route-consent-review.v1';
export const COMMS_LIMITS_833=Object.freeze({issues:100,handoffs:100});
export const COMMS_ROUTE_DRAFTS_833=Object.freeze([
  {id:'shell-health-test',label:'Source shell health',source:'QL-364 source-owned health handler',
    audience:'rosevear-master TEST-only one-use GET',privacy:'No customer, booking, employee or device payload',
    authority:'QL-362/363/365D original source signer, separately signed owner TEST approval, pinned receiver/one-use receipt',
    route:'GET /api/integration/v1/shell/health',next:'/admin-comms-hub-v781.html',
    reason:'HEALTH_TEST_ORIGINAL_AUTHORITY_MISSING',operation:'GET only after original independent ceremony; never a persistent connection'},
  {id:'booking-service',label:'Customer booking notices',source:'Rosie booking and current customer consent',
    audience:'One verified customer, one purpose and channel',privacy:'Never send vehicle, customer address, contact or payment details through health contract',
    authority:'Customer profile, current purpose/channel preference and recipient, authorized service owner, approved Comms messaging contract',
    route:'PROPOSED / no Comms route',next:'/admin-notifications.html',
    reason:'MESSAGING_CONTRACT_AND_CURRENT_CONSENT_MISSING',operation:'Manual source-side review only; no automatic notification'},
  {id:'worksite-incident',label:'Worksite concern and incident',source:'customer_worksite_issues_v811',
    audience:'One authorized Rosie operations supervisor, not an inferred master operator',
    privacy:'Private customer description, site and booking identifiers must stay with Rosie',
    authority:'Authenticated issue, source decision provenance, original consent, case owner and approved incident contract',
    route:'PROPOSED / no Comms route',next:'/admin-today.html#build814StaffFollowups',
    reason:'INCIDENT_IDENTITY_ROUTE_AND_CONSENT_MISSING',operation:'Review original concern locally; do not create or close a Comms incident'},
  {id:'finance-exception',label:'Deposit or payment exception',source:'Rosie booking/payment and accounting source',
    audience:'Authorized Rosie operations/finance reviewer only',privacy:'No provider tokens, amount, payer identity, invoice or payroll details to Comms',
    authority:'Original provider evidence, signed finance review, case owner and separately approved incident route',
    route:'PROPOSED / no Comms route',next:'/admin-accounting.html',
    reason:'FINANCE_PROVIDER_AND_INCIDENT_CONTRACT_MISSING',operation:'Manual finance handoff only; no payment/refund/provider call'},
  {id:'staff-escalation',label:'Staff or assignment escalation',source:'Rosie staff worksite and handoff decisions',
    audience:'One authorized internal operations role; no cross-tenant fan-out',
    privacy:'No HR identity, worker location or private staffing records in shell health response',
    authority:'Original role/device session, assignment owner and authorized staff incident channel',
    route:'PROPOSED / no Comms route',next:'/admin-operations.html',
    reason:'STAFF_AUDIENCE_AND_ESCALATION_CONTRACT_MISSING',operation:'Local supervisor queue only; no remote task or message'}
]);
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const issueStates=new Set(['pending_review','reviewing','resolved','closed_no_action']);
const issueCategories=new Set(['parking_access','site_rules','utilities_restriction','weather',
  'vehicle_condition','arrival_contact','other']);
const handoffStates=new Set(['planned_not_contacted','blocked_by_preference','attempted_no_answer',
  'voicemail_left','customer_contacted','followup_requested']);
const channels=new Set(['email','sms','phone']);
const purposes=new Set(['service','marketing']);
const parsedTime=(value)=>typeof value==='string'&&Number.isFinite(Date.parse(value))?Date.parse(value):null;
const countBy=(rows,field,options)=>Object.fromEntries([...options].map(k=>[k,rows.filter(r=>r[field]===k).length]));
export function reviewCommsBoundary833({issues=[],handoffs=[],sampledAt=new Date().toISOString(),
  sourceRevision=null,now=Date.now()}={}){
  if(!Array.isArray(issues)||issues.length>COMMS_LIMITS_833.issues||
    !Array.isArray(handoffs)||handoffs.length>COMMS_LIMITS_833.handoffs||
    !Number.isFinite(now)||parsedTime(sampledAt)===null)throw Error('Bounded, dated Comms source required');
  const seenIssues=new Set(),seenHandoffs=new Set();
  for(const issue of issues){
    if(!issue||!UUID.test(issue.id)||seenIssues.has(issue.id)||
      !issueStates.has(issue.status)||!issueCategories.has(issue.category)||
      parsedTime(issue.submitted_at)===null)throw Error('Malformed or duplicate issue source');
    seenIssues.add(issue.id);
  }
  for(const item of handoffs){
    if(!item||!UUID.test(item.id)||seenHandoffs.has(item.id)||
      !handoffStates.has(item.outcome)||!channels.has(item.channel)||
      !purposes.has(item.purpose)||parsedTime(item.recorded_at)===null||
      item.staff_report_unverified!==true||item.provider_delivery_verified!==false||
      item.outbound_dispatched!==false)throw Error('Malformed or promoted handoff claim');
    seenHandoffs.add(item.id);
  }
  const latestIssue=issues.length?Math.max(...issues.map(x=>parsedTime(x.submitted_at))):null;
  const latestHandoff=handoffs.length?Math.max(...handoffs.map(x=>parsedTime(x.recorded_at))):null;
  const rows=COMMS_ROUTE_DRAFTS_833.map(route=>({
    ...route,contractReviewState:'HOLD',outboundEligible:false,
    originalSourceProofVerified:false,recipientAudienceApproved:false,
    latestSourceAt:route.id==='worksite-incident'&&latestIssue!==null?
      new Date(latestIssue).toISOString():route.id==='booking-service'&&latestHandoff!==null?
      new Date(latestHandoff).toISOString():null,
    currentConsentVerified:false,authorizedIncidentWrite:false,providerDeliveryProved:false
  }));
  return {schema:COMMS_SCHEMA_833,build:833,sourceId:'rosiedazzlers',
    shellId:'rosiedazzlers',repository:'RosevearCreations/rosiedazzlers',
    ownedBusinessShell:true,customerOrChildTenantSourceIdentity:false,
    canonicalTenantBoundary:'owned_business_legacy',
    originalQl365dAuthority:'SOFTWARE_ONLY / ORIGINAL EVIDENCE HOLD',
    sourceManifestIsNotAuthentication:true,ql364HealthOnly:true,
    sourceRevisionClaim:typeof sourceRevision==='string'&&/^[a-f0-9]{40}$/i.test(sourceRevision)?sourceRevision:null,
    revisionIndependentlyVerified:false,
    sampledAt,sourceHistoryComplete:false,sourceWindowsAtCap:issues.length===100||handoffs.length===100,
    sourceCounts:{issues:issues.length,staffReportedHandoffs:handoffs.length},
    sourceLimits:COMMS_LIMITS_833,
    issueStatuses:countBy(issues,'status',issueStates),issueCategories:countBy(issues,'category',issueCategories),
    historicalStaffReportedHandoffs:countBy(handoffs,'outcome',handoffStates),
    historicalPurpose:countBy(handoffs,'purpose',purposes),
    historicalChannel:countBy(handoffs,'channel',channels),
    noCurrentRecipientOrPurposeConsentEstablished:true,
    consentEvidenceScope:'HISTORICAL_STAFF_REPORTS_ONLY_NOT_CURRENT_CONSENT',
    rows,approvedRoutingContracts:0,incidentRoutesPublished:0,
    fanOutAuthorized:false,manyToManyAuthorized:false,providerContacts:0,
    originalIssuerAndWitnessVerified:false,sourceSignerVerified:false,
    independentOwnerTestGrantVerified:false,oneUsePrivateGetVerified:false,
    customerMessagesSent:false,staffMessagesSent:false,remoteIncidentsCreated:false,
    remoteTasksCreated:false,masterEventsPublished:false,sourceRecordsMutated:false,
    receiverActivated:false,canonicalHoldChanged:false,sourceConnectionState:'DISCONNECTED / HOLD',
    nextStep:'Comms owns independent source identity, incident taxonomy, audience/consent contract, correlation, idempotency, replay, delivery receipts, retention and incident closure authority. Rosie must retain local operations and no-send until separately approved.'};
}
