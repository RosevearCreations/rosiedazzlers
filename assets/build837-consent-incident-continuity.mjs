// Build 837: source-owned contract inventory, not customer consent or a Comms grant.
export const CONTINUITY_SCHEMA_837='rosie.comms.consent-incident-continuity.v1';
const sha=/^[a-f0-9]{40}$/i;
const stages=Object.freeze([
  ['customer-purpose','One source customer, one approved service purpose','HOLD_CURRENT_PURPOSE_CONSENT','Rosie customer preference source'],
  ['customer-channel','Current channel, recipient, expiry and revocation checked at send time','HOLD_CURRENT_CHANNEL_AND_RECIPIENT','Rosie customer preference source'],
  ['provider','Independent original delivery provider and authenticated delivery receipt','HOLD_ORIGINAL_PROVIDER_RECEIPT','Rosie/Comms authorized provider owner'],
  ['operator-route','Approved Comms incident route, audience, privacy and retention','HOLD_COMMS_INCIDENT_CONTRACT','Rosevear Comms Hub owner'],
  ['incident-source','One original Rosie issue, booking relationship and lawful assignee','HOLD_ORIGINAL_INCIDENT_AND_ASSIGNMENT','Rosie operations supervisor'],
  ['age-escalation','Chronology, first response, aging and separate escalation owner','HOLD_ORIGINAL_TIMELINE_AND_ESCALATION','Rosie operations supervisor'],
  ['resolution','Source resolution proof and independent closure authorization','HOLD_ORIGINAL_RESOLUTION_PROOF','Rosie issue owner and Comms operator'],
  ['reconciliation','Per-recipient signed ACK, durable deduplication and handoff audit','HOLD_ORIGINAL_ACK_AND_REPLAY','Protected source/master operators']
]);
export function consentIncidentReadiness837({runtimeRevision=null,generatedAt=new Date().toISOString()}={}){
  if(!Number.isFinite(Date.parse(generatedAt))||new Date(Date.parse(generatedAt)).toISOString()!==generatedAt)
    throw Error('HOLD_INVALID_SOURCE_CLOCK');
  return {schema:CONTINUITY_SCHEMA_837,build:837,source:{id:'rosiedazzlers',role:'owned_business_source',
    tenantBoundary:'owned_business_legacy',revisionClaim:sha.test(runtimeRevision??'')?runtimeRevision:null,
    revisionIndependentlyVerified:false},generatedAt,
    journeys:[{id:'booking-service',purpose:'service',channels:['email','sms','push'],
      outcome:'HOLD_NO_CURRENT_CONSENT_OR_PROVIDER_PROOF',customerDeliveryAuthorized:false},
      {id:'marketing',purpose:'marketing',channels:['email','sms'],
      outcome:'HOLD_SEPARATE_MARKETING_CONSENT_REQUIRED',customerDeliveryAuthorized:false},
      {id:'worksite-incident',purpose:'incident',channels:['private_operator'],
      outcome:'HOLD_NO_ORIGINAL_INCIDENT_ROUTE_OR_ASSIGNEE',customerDeliveryAuthorized:false}],
    gates:stages.map(([id,required,state,owner])=>({id,required,state,owner})),
    incidents:{reviewIsNotResolution:true,archiveIsNotResolution:true,
      statusChangeRequiresOriginalSource:true,escalationRequiresOneSourceOwner:true,
      sourceIncidentsRead:0,sourceIncidentsMutated:0,commsIncidentsCreated:0,
      remoteTasksCreated:0,remoteTasksClosed:0},
    outcome:{state:'DISCONNECTED / HOLD',connection:'HOLD',outboundEligible:false,
      messagesSent:0,providerReceiptsVerified:0,masterEventsSent:0,
      customerDataReturned:false,credentialDisclosure:false,originalOperatorInvoked:false},
    nextAction:'Verify original current purpose/channel/recipient consent, withdrawal and provider proof; independently authorize the private Comms incident contract, one source assignee, chronology and source-linked resolution. Never infer closure from alert acknowledgement.'};
}
