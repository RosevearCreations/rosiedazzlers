// Build 829 — source-owned, nonpublishing AI Data compatibility projection.
// NEVER interpret this as a signed event, an approved reader grant or a score.
import {draftRegistry827,REGISTRY_VERSION_827} from './build827-module-requirements.mjs';
import {provenanceReport828,PROVENANCE_SCHEMA_828} from './build828-evidence-provenance.mjs';

export const REPORTING_SCHEMA_829='rosie.ai-data.source-compatibility.preview.v1';
export const TARGET_EVENT_SCHEMA_829='rosevear.master-shell.event.v1';
export const TARGET_EVENT_VERSION_829='1.0.0';
export const TARGET_EVENT_FAMILY_829='module.readiness.changed';
const SHA=/^[a-f0-9]{40}$/;
const validIso=value=>typeof value==='string'&&Number.isFinite(Date.parse(value))&&
  new Date(value).toISOString()===value;

/**
 * A local read model for authenticated Rosie supervisors only. It is deliberately
 * NOT an AI Data V1 event envelope: no approved audience, monotonic sequence,
 * source signer, approved evidence URI/expiry or consumer intake grant exists.
 */
export function reportingPreview829({events=[],sourceRevision=null,generatedAt=null,now=Date.now()}={}){
  const current=Number.isFinite(now)?now:Date.now();
  const at=validIso(generatedAt)?generatedAt:new Date(current).toISOString();
  const registry=draftRegistry827({events});
  const provenance=provenanceReport828({events,sourceRevision,generatedAt:at,now:current});
  const traces=new Map(provenance.scopeTraces.map(x=>[x.scopeId,x]));
  const scopes=registry.scopes.map(scope=>{
    const local=traces.get(scope.scopeId);
    return {
      moduleId:scope.moduleId,scopeId:scope.scopeId,
      requirementDraftId:scope.requirementId,
      roleVariant:scope.roleVariant,deviceVariant:scope.deviceVariant,
      localReviewState:local?.latestDecision??'UNKNOWN',
      localChainState:local?.latestChainStatus??'NO_RECENT_REVIEW',
      localFreshnessAdvisory:local?.latestEvidenceFreshness??'UNKNOWN',
      sourceHistoryPartial:true,
      // The AI Data Build 337 payload fields have these exact names/types.
      // Null evidence/expiry means this is NOT an ingestible signed event.
      readinessState:'UNKNOWN',completionPercent:null,
      evidenceURI:null,expiresAt:null,
      approvedRequirementRevision:null,approvedNumerator:null,approvedDenominator:null,
      approvedEvidenceFreshness:'UNKNOWN',
      consumerPayloadEligible:false,
      holdReasons:['UNAPPROVED_READER_AND_EVENT_TRANSPORT',
        'NO_OWNER_APPROVED_REQUIREMENT_DENOMINATOR',
        'NO_INDEPENDENTLY_VERIFIED_EXPIRING_EVIDENCE']
    };
  });
  if(scopes.length!==45||new Set(scopes.map(x=>x.scopeId)).size!==45)
    throw Error('Rosie reporting scopes must remain unique and source-owned');
  return {
    schema:REPORTING_SCHEMA_829,build:829,
    sourceId:'rosiedazzlers',shellId:'rosiedazzlers',
    shellBoundary:'owned-business-shell',repository:'RosevearCreations/rosiedazzlers',
    tenantId:null,childTenantEnumerated:false,
    audienceCandidate:'ai-data-platform',approvedAudience:[],
    contractCompatibility:{targetEventSchema:TARGET_EVENT_SCHEMA_829,
      targetSchemaVersion:TARGET_EVENT_VERSION_829,
      targetEventFamily:TARGET_EVENT_FAMILY_829,
      targetBuilds:[335,337,338,339],
      sourceRegistrySchema:REGISTRY_VERSION_827,
      provenanceSchema:PROVENANCE_SCHEMA_828,
      fieldsMapped:['moduleId','readinessState','completionPercent','evidenceURI','expiresAt'],
      consumerSchemaReviewed:true,consumerApproved:false,
      signedEventEnvelopeAvailable:false,transportReceiptVerified:false,
      readOnlyConsumerGrantAvailable:false,authorizedForOutbound:false},
    generatedAt:at,
    currentDeploymentRevisionClaim:typeof sourceRevision==='string'&&SHA.test(sourceRevision)?sourceRevision:null,
    revisionIndependentlyVerified:false,historicalEventReleaseRevisionAvailable:false,
    sourceWindowLimit:provenance.sourceWindowLimit,
    sourceWindowReturned:provenance.sourceWindowReturned,
    sourceHistoryComplete:false,
    requirementsDraft:registry.distinctRequirementDrafts,
    moduleScopeCount:scopes.length,
    scopes,
    approvedDenominator:null,approvedNumerator:null,completionPercent:null,
    masterScoreCalculated:false,sourceConnectionState:'DISCONNECTED / HOLD',
    dataSentToAIPlatform:false,dataSentToCommsHub:false,
    bookingOrCustomerDataIncluded:false,actorIdentityIncluded:false,
    originalSignerOrOwnerReceiptVerified:false,
    canonicalHoldChanged:false,
    nextAction:'Approve source/consumer identity, authenticated read audience, tenant scope, exact schema/transport signing and evidence expiry before proposing any signed event or AI Data reader. Product owner must separately approve requirements and denominators.'
  };
}
