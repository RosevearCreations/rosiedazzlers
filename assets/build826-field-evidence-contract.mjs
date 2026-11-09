// Build 826: immutable, source-reported acceptance and review event contracts.
// Not the master completion calculation authority or a private Comms connection.
import {MODULE_BASELINE_825} from './build825-module-baseline.mjs';

export const ROSIE_SHELL_826=Object.freeze({
  sourceId:'rosiedazzlers',repository:'RosevearCreations/rosiedazzlers',
  shellBoundary:'owned_business_shell',tenantId:null,
  ql364Handler:'functions/api/_lib/ql364-source-health.mjs',
  manifestURI:'/.well-known/rosevear-integration-manifest.json',
  sourceConnection:'DISCONNECTED / HOLD'
});
export const EVENT_KINDS_826=Object.freeze(['observation','signoff','module_review']);
export const SOURCE_ROLES_826=Object.freeze(['customer','detailer','operations','admin']);
export const SOURCE_DEVICES_826=Object.freeze(['phone','tablet','desktop']);
export const SOURCE_BROWSERS_826=Object.freeze(['chrome','safari','firefox','edge']);
export const VALID_OUTCOMES_826=Object.freeze(['pass','fail','blocked']);
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ROUTE=/^\/(?:app|admin|book|account|detailer)(?:[./-][A-Za-z0-9_./-]*)?$/;
const REF=/^[A-Za-z][A-Za-z0-9:_.-]{5,79}$/;
const MODULE_IDS=new Set(MODULE_BASELINE_825.map(x=>x.id));
const contains=(array,value)=>array.includes(value);
export const validUuid826=value=>typeof value==='string'&&UUID.test(value);
export function validateEvidence826(data,{now=Date.now()}={}){
  if(!data||typeof data!=='object'||Array.isArray(data)||!validUuid826(data.request_id)||
    !EVENT_KINDS_826.includes(data.event_kind)||!Number.isFinite(now))return null;
  const evidence_ref=typeof data.evidence_ref==='string'?data.evidence_ref.trim():'';
  if(!REF.test(evidence_ref))return null;
  const base={event_kind:data.event_kind,request_id:data.request_id,evidence_ref};
  if(data.event_kind==='observation'){
    const {role_id,device_class,browser_class,route_path,viewport_width,observed_outcome,observed_at}=data;
    const observed=Date.parse(observed_at||'');
    if(!contains(SOURCE_ROLES_826,role_id)||!contains(SOURCE_DEVICES_826,device_class)||
      !contains(SOURCE_BROWSERS_826,browser_class)||typeof route_path!=='string'||
      route_path.length>90||!ROUTE.test(route_path)||route_path.includes('..')||
      !Number.isSafeInteger(viewport_width)||viewport_width<320||viewport_width>3840||
      !contains(VALID_OUTCOMES_826,observed_outcome)||typeof observed_at!=='string'||
      !Number.isFinite(observed)||new Date(observed).toISOString()!==observed_at||
      observed>now+120000||observed<now-30*86400000)return null;
    return {...base,role_id,device_class,browser_class,route_path,viewport_width,observed_outcome,observed_at};
  }
  if(data.event_kind==='signoff'){
    if(!validUuid826(data.target_event_id)||
      !contains(['accepted_for_review','returned','rejected'],data.review_state))return null;
    return {...base,target_event_id:data.target_event_id,review_state:data.review_state};
  }
  if(data.event_kind==='module_review'){
    if(!MODULE_IDS.has(data.module_id)||
      !contains(['hold','needs_evidence','owner_review_candidate'],data.review_state))return null;
    const target=data.target_event_id;
    if(data.review_state==='owner_review_candidate'){
      if(!validUuid826(target))return null;
    }else if(target!==null&&target!==undefined&&!validUuid826(target))return null;
    return {...base,module_id:data.module_id,review_state:data.review_state,...(target?{target_event_id:target}:{})};
  }
  return null;
}
export function classifyReviewHistory826(rows=[]){
  const safe=Array.isArray(rows)?rows.slice(0,100):[];
  const modules={};
  for(const row of safe){
    if(row?.event_kind==='module_review'&&MODULE_IDS.has(row.module_id)&&!modules[row.module_id]){
      modules[row.module_id]={review_state:row.review_state,
        recorded_at:row.recorded_at,decision_id:row.id,operator_review_only:true};
    }
  }
  return {totalReturned:safe.length,historyCapped:safe.length===100,
    observations:safe.filter(x=>x.event_kind==='observation').length,
    signoffs:safe.filter(x=>x.event_kind==='signoff').length,
    moduleReviews:safe.filter(x=>x.event_kind==='module_review').length,
    latestModuleReviews:modules,sourceVerified:false,independentSignerVerified:false,
    actualDeviceCapturePerformed:false,originalOwnerSignaturesSupplied:false,
    scope:'bounded_recent_events_only'};
}
export function proposedMasterReadiness826({events=[],sourceRevision=null,generatedAt=null}={}){
  const history=classifyReviewHistory826(events);
  const commit=typeof sourceRevision==='string'&&/^[a-f0-9]{40}$/.test(sourceRevision)?sourceRevision:null;
  return {
    schema:'rosevear.suite.master-readiness-preview.v1',contractStatus:'PROPOSED_NOT_APPROVED',
    sourceId:ROSIE_SHELL_826.sourceId,repository:ROSIE_SHELL_826.repository,
    shellBoundary:ROSIE_SHELL_826.shellBoundary,tenantId:null,
    sourceRevision:commit,generatedAt,
    manifestURI:ROSIE_SHELL_826.manifestURI,
    ql364SourceHandler:ROSIE_SHELL_826.ql364Handler,
    connectionState:ROSIE_SHELL_826.sourceConnection,
    integrationVerification:'AUTHORIZATION HELD',dataSentToAIPlatform:false,
    dataSentToCommsHub:false,signedOriginalReceiptVerified:false,
    lastVerifiedEvidenceURI:null,masterOwnerApproved:false,
    scoringAuthority:'AI Data Platform — NOT this source preview',
    moduleReadiness:MODULE_BASELINE_825.map(row=>({
      moduleId:row.id,provisionalBuiltPercent:row.built,
      provisionalProvenPercent:row.proven,approvedNumerator:null,approvedDenominator:null,
      verifiedRequirementWeights:null,reviewState:history.latestModuleReviews[row.id]?.review_state||'unscoped',
      reviewEventId:history.latestModuleReviews[row.id]?.decision_id||null,
      percentageVerified:false,ownerApprovalRequired:true
    })),
    historicalEventCountReturned:history.totalReturned,
    sourceStatus:'OPERATOR_REPORTED_ONLY',
    masterEventPublicationAuthorized:false,commsNotificationAuthorized:false,
    canonicalHoldChanged:false,
    nextStep:'Approve common registry/event contract and original source signer before any private publication; product-owner requirement scope/denominator approvals are still missing.'
  };
}
