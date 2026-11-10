// Build 836: authenticated source-only readback. Never a transport or an event ACK.
export const PUBLICATION_SCHEMA_836='rosie.master-shell.protected-publication-readiness.v1';
export const PUBLICATION_SOURCE_836='rosiedazzlers';
const SHA=/^[a-f0-9]{40}$/;
const gates=Object.freeze([
  ['source','Exact Rosie source, immutable revision and signed V1 event','SOURCE_CONTRACT_PREPARED','Rosie source'],
  ['owner','Independent original source/master owner approvals and witness','HOLD_ORIGINAL_OWNER_PROOF','Protected owners'],
  ['transport','Pinned original HMAC signing key, audience and private transport','HOLD_ORIGINAL_TRANSPORT','Original source operator'],
  ['consent','Separate current Comms incident/notification consent and route','HOLD_PROVIDER_AND_CONSENT','Rosie and Comms owners'],
  ['sequence','Atomic durable event/recipient replay and ordering claims','HOLD_DURABLE_REPLAY','Original protected transport'],
  ['delivery','Original one-attempt delivery; fail closed on uncertain outcome','NOT_EXECUTED','Original protected operator'],
  ['ack','Independent per-consumer receipt, source/sequence/hash binding','NOT_VERIFIED','Receiving master'],
  ['isolation','Independent per-consumer HOLD/DLQ and explicit owner release','HOLD_INDEPENDENT_ACCEPTANCE','Source/master owners']
]);
export function publicationReadiness836({runtimeRevision=null,
  generatedAt=new Date().toISOString()}={}){
  if(!Number.isFinite(Date.parse(generatedAt))||
     new Date(Date.parse(generatedAt)).toISOString()!==generatedAt)
    throw Error('HOLD_INVALID_SOURCE_CLOCK');
  return {
    schema:PUBLICATION_SCHEMA_836,build:836,generatedAt,
    source:{sourceId:PUBLICATION_SOURCE_836,sourceRole:'business_shell',
      tenantBoundary:'owned_business_legacy',tenantId:null,
      runtimeRevisionClaim:SHA.test(runtimeRevision??'')?runtimeRevision:null,
      runtimeRevisionIndependentlyVerified:false},
    eventContract:{schema:'rosevear.master-shell.event.v1',schemaVersion:'1.0.0',
      allowedFamilies:['source.health.reported','release.promoted',
        'module.readiness.changed','audit.evidence.recorded',
        'incident.opened','incident.updated'],
      requiresOriginalSourceSequence:true,requiresIdempotency:true,
      requiresOriginalPerAudienceGrant:true,automaticReplay:false,
      directPeerOrTenantPublication:false,manyToManyAuthorized:false},
    consumers:[
      {sourceId:'ai-data-platform',role:'MASTER_INTELLIGENCE',
        purpose:'Read-only, signed source-update evidence and accepted webhook receipt',
        state:'HOLD_NO_APPROVED_SOURCE_CONSUMER_OR_ACK',
        outboundEvents:0,acceptedReceipts:0},
      {sourceId:'rosevear-comms-hub',role:'MASTER_OPERATOR_PLANE',
        purpose:'Independently consented incident/operator event routing',
        state:'HOLD_NO_APPROVED_INCIDENT_ROUTE_OR_ACK',
        outboundEvents:0,acceptedReceipts:0}
    ],
    gates:gates.map(([id,label,state,owner])=>({id,label,state,owner})),
    outcome:{connectionState:'DISCONNECTED / HOLD',connected:false,
      originalPublisherInstalledInWeb:false,ownerPublicationApproved:false,
      originalSignerVerified:false,consumerAckVerified:false,
      durableReplayProven:false,dlqVerified:false,liveTransportAttempted:false,
      masterEventsSent:0,originalReceiptsAccepted:0,remoteCommands:0,
      sourceWrites:0,customerDataReturned:false,connectionPromoted:false},
    nextAction:'Reconcile separately authenticated original source/owner, consent, HMAC transport, durable replay, event schema and per-consumer ACK before any private publication. Never use this page for approvals, retries, secrets or customer data.'
  };
}
