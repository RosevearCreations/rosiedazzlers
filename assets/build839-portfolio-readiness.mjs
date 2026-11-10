// Build 839 — a source-owned portfolio REVIEW, not an owner signature or Master score.
// The only dated estimates are the Nov 8 audit; approved trend snapshots do not exist.
import {MODULE_BASELINE_825} from './build825-module-baseline.mjs';
import {MODULE_REQUIREMENT_SCOPES_827,REGISTRY_VERSION_827}
  from './build827-module-requirements.mjs';
import {PROVENANCE_SCHEMA_828} from './build828-evidence-provenance.mjs';

export const PORTFOLIO_SCHEMA_839='rosie.master-shell.module-portfolio-review.v1';
export const AUDIT_DATE_839='2026-11-08';
const SHA=/^[a-f\d]{40}$/i;
const AGE=5*60_000; // Manual UI diagnostic guidance, NOT an owner evidence expiry policy.
const stamp=value=>typeof value==='string'&&Number.isFinite(Date.parse(value))&&
  /^\d{4}-\d{2}-\d{2}T/.test(value)?Date.parse(value):null;
const registryIds=new Set(MODULE_REQUIREMENT_SCOPES_827.map(scope=>scope.moduleId));

export function basePortfolio839({runtimeRevision=null,branch=null,generatedAt=new Date().toISOString(),
  signedStaffSession=false}={}){
  if(stamp(generatedAt)===null)throw Error('HOLD_INVALID_PORTFOLIO_CLOCK');
  return {schema:PORTFOLIO_SCHEMA_839,build:839,sourceId:'rosiedazzlers',
    role:'OWNED_BUSINESS_SOURCE_SHELL',tenantBoundary:'owned_business_legacy',
    generatedAt,readOnly:true,manualRefreshOnly:true,signedStaffSession:signedStaffSession===true,
    runtimeRevisionClaim:SHA.test(runtimeRevision??'')?runtimeRevision:null,
    runtimeBranchClaim:['dev','main'].includes(branch)?branch:null,
    productionExactShaIndependentlyVerified:false,
    audit:{date:AUDIT_DATE_839,source:'docs/ROSIE_MODULE_COMPLETION_AUDIT_20261108.md',
      classification:'PROVISIONAL_HUMAN_ESTIMATES_NOT_APPROVED_SCORES',
      historicalSnapshotCount:1,ownerApprovedSnapshotCount:0,comparableApprovedPairs:0,
      trendState:'NO_APPROVED_COMPARABLE_SNAPSHOTS',
      builtAndProvenEstimateDelta:null,approvedTrendPercentPoints:null},
    requirementDrafts:39,scopeDrafts:45,
    scopes:MODULE_REQUIREMENT_SCOPES_827.map((scope,i)=>({
      moduleId:scope.moduleId,moduleName:scope.moduleName,scopeId:scope.scopeId,
      requirementId:scope.requirementId,proposedOwnerRole:scope.proposedOwnerRole,
      roleVariant:scope.roleVariant,deviceVariant:scope.deviceVariant,
      provisionalBuiltEstimate:MODULE_BASELINE_825[i].built,
      provisionalProvenEstimate:MODULE_BASELINE_825[i].proven,
      baselineDate:AUDIT_DATE_839,localChainStatus:'NOT_CHECKED',
      localDecision:'UNKNOWN',localEvidenceFreshness:'UNKNOWN',
      ownerScopeApproved:false,approvedNumerator:null,approvedDenominator:null,
      approvedWeight:null,approvedWeightedPercent:null,approvedUnweightedPercent:null,
      signedOriginalOwnerDecisionVerified:false,independentReviewerVerified:false,
      masterConsumerAckVerified:false,sourceEvidenceClass:'PROVISIONAL_AUDIT_ONLY',
      nextAction:'Review actual field evidence and obtain explicit owner-approved scope, signed decision and independent Master acceptance.'
    })),
    ownerSignoff:{state:'HOLD_NOT_SIGNED',ownerIdentityVerified:false,
      scopeAndWeightApprovalVerified:false,originalEvidenceVerified:false,
      independentReviewerVerified:false,signedOwnerDecisionVerified:false,
      signedOwnerReceipt:null,signoffRecordedByThisView:false},
    masterPortfolio:{state:'DISCONNECTED / HOLD',aiData:'DISCONNECTED / HOLD',
      comms:'DISCONNECTED / HOLD',approvedNumerator:null,approvedDenominator:null,
      approvedWeightSum:null,approvedWeightedPercent:null,approvedUnweightedPercent:null,
      approvedScopeCount:0,scoringAuthorized:false,consumerAckVerified:false,
      portfolioGreen:false,exportedToMaster:false},
    safeguards:{databaseWrites:0,externalCalls:0,remoteNotifications:0,masterEvents:0,
      originalCustomerRowsReturned:0,canonicalHoldChanged:false,
      deploymentDoesNotEqualFieldAcceptance:true}
  };
}

function validSource839(source,now){
  if(source?.status!==200||source.body?.ok!==true||source.body?.build!==826)return false;
  const data=source.body,when=stamp(data.generated_at);
  if(when===null||when>now+60_000||now-when>AGE)return false;
  const reg=data.requirement_registry_draft,prov=data.requirement_provenance_preview;
  if(reg?.schema!==REGISTRY_VERSION_827||reg.scopeDrafts!==45||
     reg.distinctRequirementDrafts!==39||reg.scoringAuthorized!==false||
     reg.masterOwnerApproved!==false||reg.approvedNumerator!==null||
     reg.approvedDenominator!==null||prov?.schema!==PROVENANCE_SCHEMA_828||
     prov.scopeCount!==45||prov.sourceWindowLimit!==100||
     prov.scoringAuthorized!==false||prov.ownerApproved!==false||
     prov.approvedNumerator!==null||prov.approvedDenominator!==null||
     !Array.isArray(prov.scopeTraces)||prov.scopeTraces.length!==45)return false;
  const seen=new Set();
  for(const scope of prov.scopeTraces){
    const expected=MODULE_REQUIREMENT_SCOPES_827.find(s=>s.moduleId===scope?.moduleId);
    if(!expected||seen.has(scope.moduleId)||scope.scopeId!==expected.scopeId||
       scope.requirementId!==expected.requirementId||scope.ownerApproved!==false||
       scope.verifiedPercent!==null||scope.canonicalHoldChanged!==false)return false;
    seen.add(scope.moduleId);
  }
  return seen.size===registryIds.size;
}

export function reconcilePortfolio839(base,source=null,now=Date.now()){
  if(base?.schema!==PORTFOLIO_SCHEMA_839||base.signedStaffSession!==true||
     base.scopes?.length!==45||!Number.isFinite(now))throw Error('HOLD_INVALID_PORTFOLIO_SCOPE');
  const recent=validSource839(source,now);
  const traces=recent?new Map(source.body.requirement_provenance_preview.scopeTraces
    .map(scope=>[scope.moduleId,scope])):new Map();
  const scopes=base.scopes.map(row=>{
    const trace=traces.get(row.moduleId);
    return {...row,localChainStatus:trace?.latestChainStatus||'SOURCE_UNAVAILABLE_UNKNOWN',
      localDecision:trace?.latestDecision||'UNKNOWN',
      localEvidenceFreshness:trace?.latestEvidenceFreshness||'UNKNOWN',
      sourceEvidenceClass:trace?'RECENT_LOCAL_SUPERVISOR_LEDGER_NOT_OWNER_PROOF':
        'PROVISIONAL_AUDIT_ONLY_SOURCE_UNAVAILABLE',
      nextAction:trace?.latestChainStatus==='CONFLICT'?
        'Resolve the original source event conflict and obtain independent owner evidence.':
        trace?.latestChainStatus==='LOCAL_CHAIN_LINKED_UNVERIFIED'?
          'Review this local chain with the original owner; supervisor review is not signed owner acceptance.':
          'Open the owning module evidence history; missing recent records are UNKNOWN, not zero or failed.'};
  });
  const localLinkedCount=scopes.filter(s=>s.localChainStatus==='LOCAL_CHAIN_LINKED_UNVERIFIED').length;
  const localConflictCount=scopes.filter(s=>s.localChainStatus==='CONFLICT').length;
  return {...base,generatedAt:new Date(now).toISOString(),scopes,
    sourceReview:{state:recent?'RECENT_LOCAL_LEDGER_ONLY':'UNAVAILABLE_OR_STALE_HOLD',
      observedAt:recent?source.body.generated_at:null,
      latestEventsReturned:recent?source.body.requirement_provenance_preview.sourceWindowReturned:null,
      olderEventsMayBeMissing:true,localLinkedCount,localConflictCount,
      ownerApprovedScopes:0,unapprovedScopes:45,approvedTrendPoints:0,
      provisionalAuditIsNotCurrentMeasuredProgress:true},
    ownerSignoff:{...base.ownerSignoff,state:'HOLD_NOT_SIGNED'},
    masterPortfolio:{...base.masterPortfolio,state:'DISCONNECTED / HOLD',
      portfolioGreen:false,approvedNumerator:null,approvedDenominator:null,
      approvedWeightedPercent:null,approvedUnweightedPercent:null}};
}
