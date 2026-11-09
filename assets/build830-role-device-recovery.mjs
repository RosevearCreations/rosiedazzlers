// Build 830 — bounded REAL field-observation planning, not browser-farm proof.
// Only original dated source records are classified. No invented field sessions,
// independent I.T. attestation, owner acceptance or Master Shell score.
import {SOURCE_ROLES_826,SOURCE_DEVICES_826,SOURCE_BROWSERS_826,VALID_OUTCOMES_826}
  from './build826-field-evidence-contract.mjs';

export const ROLE_DEVICE_SCHEMA_830='rosie.role-device.field-recovery.local-preview.v1';
export const DRAFT_FOLLOWUP_DAYS_830=30; // NOT owner-approved expiration.
export const ROLE_DEVICE_MATRIX_830=Object.freeze(SOURCE_ROLES_826.flatMap(role=>
  SOURCE_DEVICES_826.map(device=>Object.freeze({roleId:role,deviceClass:device,
    cellId:'rd-role-device-v1-'+role+'-'+device}))));
const ISO=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ROUTE=/^\/(?:app|admin|book|account|detailer)(?:[./-][A-Za-z0-9_./-]*)?$/;
const stamp=value=>typeof value==='string'&&ISO.test(value)&&Number.isFinite(Date.parse(value))?
  Date.parse(value):null;
const validId=value=>typeof value==='string'&&UUID.test(value);
const sorted=(a,b)=>stamp(b.recorded_at)-stamp(a.recorded_at)||String(b.id).localeCompare(String(a.id));
const safeRoute=value=>typeof value==='string'&&value.length<=90&&ROUTE.test(value)&&
  !value.includes('..');
const recentRef=e=>typeof e?.id==='string'&&validId(e.id)?e.id.slice(-8):null;
const validObservation=(e,now)=>validId(e.id)&&validId(e.actor_staff_user_id)&&
  stamp(e.recorded_at)!==null&&stamp(e.observed_at)!==null&&
  stamp(e.observed_at)<=now+120000&&stamp(e.observed_at)<=stamp(e.recorded_at)+120000&&
  SOURCE_ROLES_826.includes(e.role_id)&&SOURCE_DEVICES_826.includes(e.device_class)&&
  SOURCE_BROWSERS_826.includes(e.browser_class)&&VALID_OUTCOMES_826.includes(e.observed_outcome)&&
  safeRoute(e.route_path)&&Number.isSafeInteger(e.viewport_width)&&
  e.viewport_width>=320&&e.viewport_width<=3840;

function signoffFor(observation,events,duplicates){
  const all=events.filter(e=>e?.event_kind==='signoff'&&e.target_event_id===observation.id);
  if(all.some(e=>!validId(e.id)||stamp(e.recorded_at)===null))
    return {state:'REVIEW_CONFLICT',valid:false};
  const decisions=all.sort(sorted);
  const latest=decisions[0];
  if(!latest)return {state:'NO_SEPARATE_REVIEW',valid:false};
  if(duplicates.has(latest.id)||!validId(latest.actor_staff_user_id)||
    latest.actor_staff_user_id===observation.actor_staff_user_id||
    stamp(latest.recorded_at)<stamp(observation.recorded_at))
    return {state:'REVIEW_CONFLICT',valid:false};
  if(latest.review_state==='returned'||latest.review_state==='rejected')
    return {state:'REVIEW_RETURNED_OR_REJECTED',valid:false};
  return {state:latest.review_state==='accepted_for_review'?'LOCAL_SIGNOFF_UNVERIFIED':'REVIEW_CONFLICT',
    valid:latest.review_state==='accepted_for_review'};
}

export function roleDeviceRecovery830({events=[],now=Date.now(),generatedAt=null,
  sourceRevision=null}={}){
  const current=Number.isFinite(now)?now:Date.now();
  const bounded=Array.isArray(events)?events.slice(0,100):[];
  const seen=new Set(),duplicates=new Set();
  for(const e of bounded){if(!validId(e?.id))continue;
    if(seen.has(e.id))duplicates.add(e.id);else seen.add(e.id);}
  const cells=ROLE_DEVICE_MATRIX_830.map(key=>{
    const observations=bounded.filter(e=>e?.event_kind==='observation'&&
      e.role_id===key.roleId&&e.device_class===key.deviceClass);
    const malformed=observations.some(e=>duplicates.has(e.id)||
      !validObservation(e,current));
    const sortedObservations=observations.filter(e=>stamp(e.recorded_at)!==null&&validId(e.id)).sort(sorted);
    const latest=sortedObservations[0]||null;
    const negative=sortedObservations.find(e=>['fail','blocked'].includes(e.observed_outcome));
    const latestValid=latest&&!malformed&&validObservation(latest,current);
    const signoff=latestValid?signoffFor(latest,bounded,duplicates):
      {state:latest?'SOURCE_EVENT_CONFLICT':'NO_SEPARATE_REVIEW',valid:false};
    const hasPriorNegative=latestValid&&latest.observed_outcome==='pass'&&negative&&
      stamp(negative.recorded_at)<stamp(latest.recorded_at);
    const aged=latestValid&&current-stamp(latest.observed_at)>DRAFT_FOLLOWUP_DAYS_830*86400000;
    const currentNegative=latestValid&&['fail','blocked'].includes(latest.observed_outcome);
    const status=!observations.length?'NO_RECENT_SOURCE_OBSERVATION':!latestValid?'SOURCE_EVENT_CONFLICT':
      currentNegative?'CURRENT_LOCAL_FAILURE_OR_BLOCK':
      hasPriorNegative?'LOCAL_RETEST_REVIEW_REQUIRED':
      signoff.state==='REVIEW_CONFLICT'?'SOURCE_EVENT_CONFLICT':
      signoff.state==='REVIEW_RETURNED_OR_REJECTED'?'RETURNED_FOR_NEW_EVIDENCE':
      aged?'DRAFT_FOLLOWUP_DUE':signoff.valid?'LOCAL_PASS_SIGNED_FOR_REVIEW':'LOCAL_PASS_NEEDS_SEPARATE_REVIEW';
    return {
      ...key,status,
      mostRecentObservationIdSuffix:recentRef(latest),
      recentObservationCount:observations.length,
      latestObservedAt:latestValid?latest.observed_at:null,
      latestBrowser:latestValid?latest.browser_class:null,
      latestRoute:latestValid?latest.route_path:null,
      latestViewportWidth:latestValid?latest.viewport_width:null,
      latestOutcome:latestValid?latest.observed_outcome:null,
      latestSignoffState:signoff.state,
      sourceWindowMayOmitHistory:bounded.length===100,
      latestLocalObservationAged:!!aged,
      localRetestAfterNegative:!!hasPriorNegative,
      latestNegativeInWindow:!!negative,
      negativeHistoryCleared:false,
      recoveryAction:currentNegative?'Investigate the failed or blocked route; retest on a real signed-in device and obtain a separate supervisor review.':
        hasPriorNegative?'Compare the newer real-device retest with the earlier negative observation; request an independent supervisor decision before any owner disposition.':
        !latestValid?'Perform a real signed-in role/device walkthrough, recording original route, browser, width, outcome and time.':
        aged?'Repeat the real role/device walkthrough; the 30-day check is only an unapproved local reminder.':
        signoff.valid?'Request actual device/owner verification; local supervisor signoff alone cannot close readiness.':
        'Obtain a separate signed-supervisor review of the observation, or repeat the test if it was returned.',
      originalDeviceSessionVerified:false,independentITDeviceAuthorityVerified:false,
      ownerAccepted:false,masterCompletionPercent:null,canonicalHoldChanged:false
    };
  });
  if(cells.length!==12||new Set(cells.map(x=>x.cellId)).size!==12)
    throw Error('Rosie role-device acceptance matrix must contain 12 stable cells');
  return {
    schema:ROLE_DEVICE_SCHEMA_830,build:830,sourceId:'rosiedazzlers',
    shellBoundary:'owned_business_shell',generatedAt:stamp(generatedAt)!==null?
      generatedAt:new Date(current).toISOString(),
    currentDeploymentRevisionClaim:typeof sourceRevision==='string'&&/^[a-f0-9]{40}$/.test(sourceRevision)?sourceRevision:null,
    historicalEventRevisionAvailable:false,
    sourceWindowLimit:100,sourceWindowReturned:bounded.length,
    completeHistory:false,roleCount:SOURCE_ROLES_826.length,deviceCount:SOURCE_DEVICES_826.length,
    cellCount:cells.length,cells,
    reviewedLocalPassCount:cells.filter(x=>x.status==='LOCAL_PASS_SIGNED_FOR_REVIEW').length,
    currentLocalNegativeCount:cells.filter(x=>x.status==='CURRENT_LOCAL_FAILURE_OR_BLOCK').length,
    retestReviewRequiredCount:cells.filter(x=>x.status==='LOCAL_RETEST_REVIEW_REQUIRED').length,
    reviewCandidateNotOwnerAcceptance:true,
    genuineFieldDeviceAcceptanceCount:null,
    independentlyVerifiedRoleDevicePairs:null,
    allRolesDevicesAccepted:false,ownerAccepted:false,
    approvedNumerator:null,approvedDenominator:null,completionPercent:null,
    proposedFollowupDays:DRAFT_FOLLOWUP_DAYS_830,followupPolicyApproved:false,
    noBrowserAutomationOrPhysicalDeviceTestPerformed:true,
    sourceConnectionState:'DISCONNECTED / HOLD',
    dataSentToAIPlatform:false,dataSentToCommsHub:false,
    bookingChanged:false,customerNotified:false,canonicalHoldChanged:false,
    nextStep:'Use an original authenticated customer/detailer/operations/admin session on the actual phone/tablet/desktop. Record and independently review each observation; reconcile separate I.T. device authority and owner signoff before any readiness claim.'
  };
}
