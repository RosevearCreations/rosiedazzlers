// Build 828: bounded, read-only provenance of existing append-only Rosie events.
// A complete LOCAL chain is not an independently verified device, owner,
// provider, deployed release, or Master Shell score/connection receipt.
import {MODULE_REQUIREMENT_SCOPES_827} from './build827-module-requirements.mjs';

export const PROVENANCE_SCHEMA_828='rosie.module-provenance.local-preview.v1';
export const SOURCE_LEDGER_828='rosie_field_acceptance_events_v826';
export const DRAFT_REVIEW_DAYS_828=30; // Operator triage suggestion, NOT an approved expiry policy.
const DAY=86400000;
// Supabase/PostgREST commonly returns timestamptz with +00:00 and six-digit
// fractions; browser observation input uses Z. Both must remain comparable.
const ISO=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const REF=/^[A-Za-z][A-Za-z0-9:_.-]{5,79}$/;
const STATES=new Set(['hold','needs_evidence','owner_review_candidate']);
const SIGNOFFS=new Set(['accepted_for_review','returned','rejected']);
const OUTCOMES=new Set(['pass','fail','blocked']);
const ROLES=new Set(['customer','detailer','operations','admin']);
const DEVICES=new Set(['phone','tablet','desktop']);
const BROWSERS=new Set(['chrome','safari','firefox','edge']);
const kinds=new Set(['observation','signoff','module_review']);
const stamp=value=>typeof value==='string'&&ISO.test(value)&&Number.isFinite(Date.parse(value))?
  Date.parse(value):null;
const safeId=value=>typeof value==='string'&&UUID.test(value);
const safeRef=value=>typeof value==='string'&&REF.test(value)?value:null;
const safeState=value=>STATES.has(value)?value:'unrecognized';
const sorted=(a,b)=>stamp(b.recorded_at)-stamp(a.recorded_at)||String(b.id).localeCompare(String(a.id));

function candidateChain(review,scope,byId,ambiguous,now){
  const issues=[];
  const requireTarget=(id,kind)=>{
    if(!safeId(id)){issues.push('INVALID_TARGET_ID');return null;}
    if(ambiguous.has(id)){issues.push('DUPLICATE_EVENT_ID');return null;}
    const target=byId.get(id);
    if(!target){issues.push('TARGET_OUTSIDE_RECENT_WINDOW');return null;}
    if(target.event_kind!==kind){issues.push('TARGET_KIND_MISMATCH');return null;}
    return target;
  };
  const signoff=requireTarget(review.target_event_id,'signoff');
  let observation=null;
  if(signoff){
    if(signoff.review_state!=='accepted_for_review')issues.push('SIGNOFF_NOT_ACCEPTED_FOR_REVIEW');
    if(signoff.actor_staff_user_id===review.actor_staff_user_id)issues.push('REVIEWER_NOT_INDEPENDENT');
    if(stamp(signoff.recorded_at)>stamp(review.recorded_at))issues.push('REVIEW_CHRONOLOGY_CONFLICT');
    observation=requireTarget(signoff.target_event_id,'observation');
  }
  if(observation){
    if(signoff.actor_staff_user_id===observation.actor_staff_user_id)issues.push('SIGNOFF_NOT_INDEPENDENT');
    if(stamp(observation.recorded_at)>stamp(signoff.recorded_at))issues.push('SIGNOFF_CHRONOLOGY_CONFLICT');
    if(!ROLES.has(observation.role_id)||!DEVICES.has(observation.device_class)||
       !BROWSERS.has(observation.browser_class)||!OUTCOMES.has(observation.observed_outcome))
      issues.push('OBSERVATION_INVALID_FIELDS');
    const when=stamp(observation.observed_at);
    if(when===null||when>now+120000||when>stamp(observation.recorded_at)+120000)
      issues.push('OBSERVATION_TIME_CONFLICT');
    if(scope.deviceVariant&&
      (scope.roleVariant!==observation.role_id||scope.deviceVariant!==observation.device_class))
      issues.push('ROLE_DEVICE_SCOPE_MISMATCH');
  }
  const conflicts=issues.filter(x=>x!=='TARGET_OUTSIDE_RECENT_WINDOW');
  const complete=!!observation&&issues.length===0;
  const observed=complete?stamp(observation.observed_at):null;
  const expiry=observed===null?null:new Date(observed+DRAFT_REVIEW_DAYS_828*DAY).toISOString();
  const due=observed!==null&&observed+DRAFT_REVIEW_DAYS_828*DAY<now;
  return {
    chainStatus:conflicts.length?'CONFLICT':complete?'LOCAL_CHAIN_LINKED_UNVERIFIED':'PARTIAL_RECENT_HISTORY',
    issueCodes:issues,
    signoffEventId:signoff?.id||null,
    observationEventId:observation?.id||null,
    signoffRef:safeRef(signoff?.evidence_ref),
    observationRef:safeRef(observation?.evidence_ref),
    observationOutcome:OUTCOMES.has(observation?.observed_outcome)?observation.observed_outcome:null,
    observedRole:ROLES.has(observation?.role_id)?observation.role_id:null,
    observedDevice:DEVICES.has(observation?.device_class)?observation.device_class:null,
    observedAt:observed===null?null:observation.observed_at,
    proposedReviewDueAt:expiry,
    freshness:complete?(due?'DRAFT_REVIEW_DUE':'DRAFT_WITHIN_REVIEW_WINDOW'):'UNKNOWN',
    independentEvidenceVerified:false,
    eventReleaseRevision:null // The v826 event schema does NOT persist a deployed SHA.
  };
}

export function provenanceReport828({events=[],sourceRevision=null,generatedAt=null,now=Date.now()}={}){
  const current=Number.isFinite(now)?now:Date.now();
  const bounded=Array.isArray(events)?events.slice(0,100):[];
  const byId=new Map(),ambiguous=new Set();
  for(const e of bounded){
    if(!e||!kinds.has(e.event_kind)||!safeId(e.id)||stamp(e.recorded_at)===null)continue;
    if(byId.has(e.id)){ambiguous.add(e.id);byId.delete(e.id);continue;}
    if(!ambiguous.has(e.id))byId.set(e.id,e);
  }
  const result=MODULE_REQUIREMENT_SCOPES_827.map(scope=>{
    const reviews=bounded.filter(e=>e?.event_kind==='module_review'&&
      e.module_id===scope.moduleId&&safeId(e.id)&&stamp(e.recorded_at)!==null&&
      STATES.has(e.review_state)).sort(sorted);
    const hasDuplicateReviewId=reviews.some(e=>ambiguous.has(e.id));
    const full=reviews.map(e=>{
      const chain=e.review_state==='owner_review_candidate'
        ?candidateChain(e,scope,byId,ambiguous,current)
        :{chainStatus:'DECISION_ONLY_NO_APPROVED_CHAIN',issueCodes:[],
          signoffEventId:null,observationEventId:null,signoffRef:null,observationRef:null,
          observationOutcome:null,observedRole:null,observedDevice:null,observedAt:null,
          proposedReviewDueAt:null,freshness:'UNKNOWN',independentEvidenceVerified:false,
          eventReleaseRevision:null};
      if(ambiguous.has(e.id)){
        chain.chainStatus='CONFLICT';
        chain.issueCodes=['DUPLICATE_EVENT_ID'];
        chain.freshness='UNKNOWN';
      }
      return {reviewEventId:e.id,recordedAt:e.recorded_at,
        decision:safeState(e.review_state),evidenceRef:safeRef(e.evidence_ref),
        targetEventId:safeId(e.target_event_id)?e.target_event_id:null,
        ...chain};
    });
    const latest=full[0]||null;
    const reopenAdvisory=!!latest&&latest.decision!=='owner_review_candidate'&&
      full.slice(1).some(r=>r.decision==='owner_review_candidate');
    return {
      moduleId:scope.moduleId,scopeId:scope.scopeId,requirementId:scope.requirementId,
      roleVariant:scope.roleVariant,deviceVariant:scope.deviceVariant,
      localReviewCountInWindow:full.length,
      recentDecisions:full.slice(0,8),historyTruncatedForScope:full.length>8,
      latestDecision:latest?.decision||'UNKNOWN',
      latestChainStatus:hasDuplicateReviewId?'CONFLICT':latest?.chainStatus||'NO_RECENT_REVIEW',
      latestIssueCodes:hasDuplicateReviewId?['DUPLICATE_EVENT_ID']:latest?.issueCodes||[],
      latestEvidenceFreshness:latest?.freshness||'UNKNOWN',
      nextReviewSuggestedAt:latest?.proposedReviewDueAt||null,
      reopenAdvisory,reopenIsInferredNotOwnerAuthorized:reopenAdvisory,
      ownerApproved:false,verifiedNumerator:null,verifiedDenominator:null,
      verifiedPercent:null,canonicalHoldChanged:false
    };
  });
  return {
    schema:PROVENANCE_SCHEMA_828,sourceId:'rosiedazzlers',
    shellBoundary:'owned_business_shell',sourceLedger:SOURCE_LEDGER_828,
    contractStatus:'LOCAL_READ_ONLY_PREVIEW_NOT_MASTER_APPROVED',
    currentReportReleaseSha:typeof sourceRevision==='string'&&/^[0-9a-f]{40}$/.test(sourceRevision)?sourceRevision:null,
    historicalEventReleaseShaAvailable:false,
    generatedAt:stamp(generatedAt)!==null?generatedAt:new Date(current).toISOString(),
    sourceWindowLimit:100,sourceWindowReturned:bounded.length,
    sourceWindowMayBeTruncated:bounded.length===100,
    sourceHistoryIsComplete:false,scopeCount:result.length,
    scopeTraces:result,
    localLinkedScopeCount:result.filter(x=>x.latestChainStatus==='LOCAL_CHAIN_LINKED_UNVERIFIED').length,
    conflictScopeCount:result.filter(x=>x.latestChainStatus==='CONFLICT').length,
    partialHistoryScopeCount:result.filter(x=>x.latestChainStatus==='PARTIAL_RECENT_HISTORY').length,
    draftReviewDueCount:result.filter(x=>x.latestEvidenceFreshness==='DRAFT_REVIEW_DUE').length,
    inferredReopenCount:result.filter(x=>x.reopenAdvisory).length,
    reviewWindowPolicy:{days:DRAFT_REVIEW_DAYS_828,approved:false,
      use:'LOCAL_TRIAGE_ONLY_NOT_EXPIRY_OR_SCORE_AUTHORITY'},
    noOriginalSourceSignerProof:true,independentDeviceProof:false,
    ownerApproved:false,approvedNumerator:null,approvedDenominator:null,
    completionPercent:null,scoringAuthorized:false,
    connectionState:'DISCONNECTED / HOLD',dataSentToAIPlatform:false,
    dataSentToCommsHub:false,canonicalHoldChanged:false,
    guidance:'Review incomplete/contradictory source chains, historical events outside the latest 100 and proposed 30-day follow-ups with actual owners. No review flag changes a canonical HOLD.'
  };
}
