// Build 840 — source-scoped suite pilot comparison, never a signed Master ACK.
// The independent AI Data/Comms owners must provide original receipts elsewhere.
import {MASTER_STATUS_SCHEMA_834} from './build834-master-status.mjs';
import {MASTER_PILOT_SCHEMA_835} from './build835-master-pilot.mjs';
import {PUBLICATION_SCHEMA_836} from './build836-publication-readiness.mjs';
import {CONTINUITY_SCHEMA_837} from './build837-consent-incident-continuity.mjs';
import {HEALTH_SCHEMA_838} from './build838-health-reconciliation.mjs';
import {PORTFOLIO_SCHEMA_839} from './build839-portfolio-readiness.mjs';

export const SUITE_PILOT_SCHEMA_840='rosie.master-shell.suite-pilot-business-gate.v1';
const REVISION=/^[a-f0-9]{40}$/i;
const MAX_AGE_MS=5*60_000; // Interactive-source freshness, not a signer policy.
const claim=revision=>REVISION.test(revision??'')?revision:null;
const timestamp=value=>typeof value==='string'&&Number.isFinite(Date.parse(value))&&
  new Date(Date.parse(value)).toISOString()===value?Date.parse(value):null;
const topology=Object.freeze([
  ['rosiedazzlers','OWNED_BUSINESS_SOURCE','owned_business_legacy','Rosie original staff/owner'],
  ['ai-data-platform','MASTER_INTELLIGENCE','master_read_model','Independent AI Data owner'],
  ['rosevear-comms-hub','MASTER_COMMUNICATIONS','master_operator_plane','Independent Comms owner'],
  ['yw','PEER_PLATFORM_SHELL','platform_shell / Rosevear Landscaping child tenant','YW platform owner'],
  ['icamp','PEER_PLATFORM_SHELL','platform_shell / Camp Rosevear child tenant','iCamp platform owner'],
  ['devilndove','PEER_OWNED_BUSINESS','owned_business_legacy','Devil n Dove owner'],
  ['rosevear-ai-hub','PEER_LOCAL_SUPPORT','no_customer_tenant','Original Windows owner']
]);
const routes=Object.freeze([
  {id:'one-to-one',name:'One-to-one source health',source:'rosiedazzlers',
    destinations:['ai-data-platform'],owner:'Rosie + AI Data original owners',
    required:'Exact source revision, signed source health, approved audience and independent AI Data ACK.'},
  {id:'one-to-many',name:'One-to-many consented source event',source:'rosiedazzlers',
    destinations:['ai-data-platform','rosevear-comms-hub'],owner:'Rosie + each independent consumer',
    required:'Separate purpose/channel consent, grants, nonce/replay claims and signed ACK per audience.'},
  {id:'many-to-one',name:'Many-to-one portfolio normalization',source:'suite-source-shells',
    destinations:['ai-data-platform'],owner:'Each original source + AI Data portfolio owner',
    required:'Per-source tenant isolation, signed receipt, agreed denominators/weights and independent portfolio acceptance.'}
]);
const safeguards=Object.freeze([
  ['privacy','No source customer, employee, payment or device payload passes to the shell.'],
  ['tenant','YW/iCamp business tenants never become separate root source identities or imply cross-tenant reads.'],
  ['authorization','Ree/Jack outer Sysop role never substitutes for an application-specific grant.'],
  ['consent','Purpose, channel, recipient and current revocation remain per-consumer original evidence.'],
  ['replay','An absent nonce, durable sequence, expiry or independent ACK remains HOLD.'],
  ['failure','Timeout, inaccessible peer, conflict, stale clock or invalid source is UNKNOWN/HOLD, not success.'],
  ['rollback','Original owner-authorized stop and recovery receipts are independently reviewed; no restore is attempted.']
]);
const sources=Object.freeze([
  ['status',834,MASTER_STATUS_SCHEMA_834,'/api/admin/master_shell_status_v834',r=>r.sourceIdentity?.sourceId==='rosiedazzlers'&&r.sourceHealth?.connectionState==='DISCONNECTED / HOLD'],
  ['pilot',835,MASTER_PILOT_SCHEMA_835,'/api/admin/master_shell_pilot_v835',r=>r.source?.sourceId==='rosiedazzlers'&&r.pilot?.sourceSignedReceiptVerifiedHere===false&&r.outcome?.connected===false],
  ['publication',836,PUBLICATION_SCHEMA_836,'/api/admin/master_shell_publication_v836',r=>r.source?.sourceId==='rosiedazzlers'&&r.outcome?.consumerAckVerified===false&&r.outcome?.masterEventsSent===0],
  ['consent',837,CONTINUITY_SCHEMA_837,'/api/admin/comms_consent_incident_continuity_v837',r=>r.source?.id==='rosiedazzlers'&&r.outcome?.outboundEligible===false&&r.outcome?.messagesSent===0],
  ['health',838,HEALTH_SCHEMA_838,'/api/admin/operations_security_it_health_v838',r=>r.sourceId==='rosiedazzlers'&&r.sourceConnections?.consumerAckVerified===false&&r.outcomes?.databaseWrites===0],
  ['portfolio',839,PORTFOLIO_SCHEMA_839,'/api/admin/module_portfolio_readiness_v839',r=>r.sourceId==='rosiedazzlers'&&r.ownerSignoff?.signedOwnerDecisionVerified===false&&r.masterPortfolio?.portfolioGreen===false&&r.masterPortfolio?.approvedNumerator===null]
]);

export function baseSuitePilot840({runtimeRevision=null,branch=null,generatedAt=new Date().toISOString(),
  signedStaffSession=false}={}){
  if(timestamp(generatedAt)===null)throw Error('HOLD_INVALID_SUITE_CLOCK');
  return {schema:SUITE_PILOT_SCHEMA_840,build:840,sourceId:'rosiedazzlers',
    role:'OWNED_BUSINESS_SOURCE_SHELL',tenantBoundary:'owned_business_legacy',
    generatedAt,signedStaffSession:signedStaffSession===true,readOnly:true,manualRefreshOnly:true,
    runtimeRevisionClaim:claim(runtimeRevision),runtimeBranchClaim:['dev','main'].includes(branch)?branch:null,
    runtimeRevisionIndependentlyVerified:false,productionExactShaVerifiedHere:false,
    topology:topology.map(([id,role,boundary,owner])=>({id,role,boundary,owner,
      trustState:id==='rosiedazzlers'?'SOURCE_LOCAL_ONLY':'NOT_INDEPENDENTLY_ATTESTED'})),
    routes:routes.map(route=>({...route,state:'HOLD_INDEPENDENT_ORIGINAL_EVIDENCE',
      publishedHere:false,acceptedReceiptsHere:0})),
    safeguards:safeguards.map(([id,required])=>({id,required,state:'HOLD_ORIGINAL_PROOF'})),
    comparisons:sources.map(([id,build,schema,path])=>({id,build,schema,path,
      state:'NOT_CHECKED',observedAt:null,revisionClaim:null})),
    finalBusinessGate:{state:'HOLD',softwareReleaseState:'SEPARATE_EXACT_SHA_CI',
      originalOwnerAccepted:false,independentAiDataAccepted:false,
      independentCommsAccepted:false,sourceSignedReceiptVerified:false,
      providerEvidenceVerified:false,tenantPrivacyApproved:false,
      rollbackReceiptVerified:false,unclosedItemCount:7,connection:'DISCONNECTED / HOLD',
      approvalRecordedHere:false,reason:'Original business, owner, provider and cross-suite receipts are not independently established by this source.'},
    effects:{databaseWrites:0,crossApplicationRequests:0,customerRowsReturned:0,
      messagesSent:0,masterEventsPublished:0,restoresAttempted:0,signaturesCreated:0,
      automaticRetries:0,originalOwnerAuthorityExercised:false}
  };
}

// Every submitted report is an authenticated same-origin SOURCE observation only.
// Valid matching source reports can show code compatibility, never external acceptance.
export function reconcileSuitePilot840(base,observations={},now=Date.now()){
  if(base?.schema!==SUITE_PILOT_SCHEMA_840||base?.signedStaffSession!==true||
     base.sourceId!=='rosiedazzlers'||base.finalBusinessGate?.state!=='HOLD'||
     !Number.isFinite(now)||!Array.isArray(base.comparisons)||base.comparisons.length!==6)
    throw Error('HOLD_INVALID_SUITE_SCOPE');
  const comparisons=sources.map(([id,build,schema,path,check])=>{
    const evidence=observations?.[id],body=evidence?.body,report=body?.report,
      at=timestamp(report?.generatedAt),revision=report?.runtimeRevisionClaim??
        report?.source?.currentRuntimeRevisionClaim??report?.source?.runtimeRevisionClaim??
        report?.source?.revisionClaim??report?.runtimeRevision?.claim??report?.runtimeRevision??null;
    let state='UNAVAILABLE_OR_UNAUTHORIZED_HOLD';
    if(evidence?.status===200&&body?.ok===true&&report?.schema===schema&&
       report.build===build&&at!==null&&at<=now+60_000&&now-at<=MAX_AGE_MS&&
       check(report)&&
       !(typeof revision==='string'&&!REVISION.test(revision))){
      if(base.runtimeRevisionClaim&&revision&&revision!==base.runtimeRevisionClaim)
        state='REVISION_DRIFT_HOLD';
      else state='LOCAL_CONTRACT_COMPATIBLE_NOT_MASTER_PROOF';
    }else if(evidence?.status===200&&body?.ok===true)
      state='CONFLICT_OR_STALE_HOLD';
    return {id,build,schema,path,state,observedAt:state==='LOCAL_CONTRACT_COMPATIBLE_NOT_MASTER_PROOF'?report.generatedAt:null,
      revisionClaim:state==='LOCAL_CONTRACT_COMPATIBLE_NOT_MASTER_PROOF'?claim(revision):null};
  });
  const compatible=comparisons.filter(x=>x.state==='LOCAL_CONTRACT_COMPATIBLE_NOT_MASTER_PROOF').length;
  const conflicts=comparisons.filter(x=>x.state==='CONFLICT_OR_STALE_HOLD'||x.state==='REVISION_DRIFT_HOLD').length;
  return {...base,generatedAt:new Date(now).toISOString(),comparisons,
    localReconciliation:{compatibleSourceReports:compatible,expectedSourceReports:sources.length,
      conflictOrStaleCount:conflicts,missingOrUnauthorizedCount:sources.length-compatible-conflicts,
      status:compatible===sources.length?'LOCAL_CONTRACTS_ONLY_ORIGINAL_PROOF_HOLD':'INCOMPLETE_SOURCE_EVIDENCE_HOLD',
      externalConsumerResponsesChecked:0,originalOwnerSignaturesVerified:0},
    finalBusinessGate:{...base.finalBusinessGate,state:'HOLD',
      unclosedItemCount:7+sources.length-compatible,
      reason:compatible===sources.length?'All six source reports are compatible, but no original signed owner/provider/master receipts are established.':
        'Source observations are missing, stale, conflicting or untrusted; original business approvals are also absent.'}};
}
