// Original private, Node-only evidence review. No sending, remote task creation or close.
// The web status route must never import this module.
export const ORIGINAL_REVIEW_SCHEMA_837='rosie.comms.ql837.original-evidence-review.v1';
const SHA=/^[a-f0-9]{40}$/i;
const ID=/^[a-z0-9][a-z0-9_.:-]{7,127}$/i;
const iso=v=>typeof v==='string'&&Number.isFinite(Date.parse(v))&&
  new Date(Date.parse(v)).toISOString()===v?Date.parse(v):null;
const deny=(reason)=>({ok:false,reason});
// All original records below must come from independent authenticated source/provider readers.
export function verifyOriginalJourney837({request,consent,providerReceipt,incident,now=Date.now()}={}){
  if(!Number.isFinite(now)||!request||request.sourceId!=='rosiedazzlers'||
     !SHA.test(request.sourceRevision??'')||!ID.test(request.correlationId??'')||
     !ID.test(request.sourceEventId??'')||!['service','marketing','incident'].includes(request.purpose)||
     !['email','sms','push','private_operator'].includes(request.channel)||
     !ID.test(request.recipientRef??''))return deny('HOLD_INVALID_OR_MISSING_SOURCE_SCOPE');
  if((request.purpose==='incident')!==(request.channel==='private_operator'))
    return deny('HOLD_WRONG_PURPOSE_CHANNEL_ROUTE');
  if(!consent||consent.sourceId!=='rosiedazzlers'||
     consent.correlationId!==request.correlationId||
     consent.recipientRef!==request.recipientRef||
     consent.purpose!==request.purpose||consent.channel!==request.channel||
     consent.originalCurrentConsentVerified!==true||
     consent.revoked===true||consent.optedOut===true||
     iso(consent.validFrom)===null||iso(consent.validUntil)===null||
     iso(consent.validFrom)>now||iso(consent.validUntil)<=now||
     now-iso(consent.checkedAt)>5*60_000||iso(consent.checkedAt)>now)
    return deny('HOLD_CONSENT_EXPIRED_REVOKED_STALE_OR_MISMATCHED');
  if(!providerReceipt||providerReceipt.sourceEventId!==request.sourceEventId||
     providerReceipt.correlationId!==request.correlationId||
     providerReceipt.recipientRef!==request.recipientRef||
     providerReceipt.purpose!==request.purpose||providerReceipt.channel!==request.channel||
     providerReceipt.originalProviderSignatureVerified!==true||
     providerReceipt.originalRecipientDeliveryVerified!==true||
     providerReceipt.outcome!=='delivered'||
     iso(providerReceipt.deliveredAt)===null||iso(providerReceipt.deliveredAt)>now||
     iso(providerReceipt.deliveredAt)<iso(consent.validFrom)||
     iso(providerReceipt.deliveredAt)>iso(consent.validUntil))
    return deny('HOLD_INDEPENDENT_PROVIDER_DELIVERY_UNVERIFIED');
  if(request.purpose==='incident'){
    if(!incident||incident.sourceId!=='rosiedazzlers'||
       incident.sourceEventId!==request.sourceEventId||
       incident.correlationId!==request.correlationId||
       !ID.test(incident.sourceIssueRef??'')||!ID.test(incident.sourceBookingRef??'')||
       !ID.test(incident.assigneeRef??'')||
       incident.originalSourceLinkVerified!==true||
       incident.independentOperatorRouteApproved!==true||
       incident.assigneeAcknowledged!==true||
       iso(incident.openedAt)===null||iso(incident.openedAt)>now||
       iso(incident.acknowledgedAt)===null||iso(incident.acknowledgedAt)>now||
       iso(incident.acknowledgedAt)<iso(incident.openedAt)||
       !['open','investigating','escalated','resolved'].includes(incident.status)||
       !Number.isSafeInteger(incident.slaMinutes)||incident.slaMinutes<1)
      return deny('HOLD_ORIGINAL_INCIDENT_OWNER_AND_CHRONOLOGY');
    const overdue=now-iso(incident.openedAt)>incident.slaMinutes*60_000;
    if(overdue&&incident.escalationOwnerVerified!==true)
      return deny('HOLD_OVERDUE_WITHOUT_ESCALATION_OWNER');
    if(incident.status==='resolved'&&(
      incident.originalSourceResolutionVerified!==true||
      incident.independentCommsResolutionApproved!==true||
      !ID.test(incident.resolutionEvidenceRef??'')))
      return deny('HOLD_ACKNOWLEDGED_OR_ARCHIVED_NOT_RESOLVED');
    return {ok:true,state:'ORIGINAL_EVIDENCE_REVIEWED_NO_REMOTE_MUTATION',
      incidentStatus:incident.status,overdue,reviewIsResolution:false,
      providerReceiptVerified:true,connection:'HOLD'};
  }
  return {ok:true,state:'ORIGINAL_EVIDENCE_REVIEWED_NO_SEND',
    providerReceiptVerified:true,incidentStatus:null,connection:'HOLD'};
}

// An original operator supplies three independent protected readers and makes the
// single-use claim itself. No exported HTTP handler, sender, mutation or retry.
export function createOriginal837Reviewer({originalOperator,now=()=>Date.now()}={}){
  if(!originalOperator||[
    'readOriginalCurrentConsent','readIndependentlyVerifiedProviderReceipt',
    'readOriginalSourceIncident','reserveDurableReviewClaim'
  ].some(k=>typeof originalOperator[k]!=='function'))throw Error('HOLD_ORIGINAL_OPERATOR_NOT_INSTALLED');
  let consumed=false;
  return {async reviewOnce(request){
    if(consumed)return {state:'HOLD_REPLAY_REVIEW_INSTANCE',connection:'HOLD'};
    consumed=true;
    if(!request||request.sourceId!=='rosiedazzlers'||!SHA.test(request.sourceRevision??''))
      return {state:'HOLD_SOURCE_SCOPE',connection:'HOLD'};
    try{
      const claim=await originalOperator.reserveDurableReviewClaim(request);
      if(claim?.fresh!==true||claim?.inOrder!==true||claim?.durablyRecorded!==true)
        return {state:'HOLD_ORIGINAL_REPLAY_OR_SEQUENCE',connection:'HOLD'};
      const consent=await originalOperator.readOriginalCurrentConsent(request);
      const providerReceipt=await originalOperator.readIndependentlyVerifiedProviderReceipt(request);
      const incident=request.purpose==='incident'?await originalOperator.readOriginalSourceIncident(request):null;
      const verdict=verifyOriginalJourney837({request,consent,providerReceipt,incident,now:now()});
      return {schema:ORIGINAL_REVIEW_SCHEMA_837,
        state:verdict.ok?verdict.state:verdict.reason,
        connection:'HOLD',deliveryAttempted:false,remoteIncidentMutated:false,
        autoRetry:false,providerReceiptVerified:verdict.ok===true};
    }catch{return {state:'HOLD_ORIGINAL_EVIDENCE_UNAVAILABLE',connection:'HOLD',
      deliveryAttempted:false,remoteIncidentMutated:false,autoRetry:false};}
  }};
}
export function status837(args=[]){
  if(args.some(a=>a!=='--status'))throw Error('DENY_UNSUPERVISED_ORIGINAL_REVIEW');
  return {schema:ORIGINAL_REVIEW_SCHEMA_837,state:'HOLD',
    originalOperatorInstalled:false,deliveryAttempted:false,connection:'HOLD'};
}
if(process.argv[1]&&import.meta.url===new URL(`file://${process.argv[1]}`).href){
  try{console.log(JSON.stringify(status837(process.argv.slice(2))));}
  catch{console.error('HOLD_UNSUPERVISED_ORIGINAL_REVIEW');process.exitCode=2;}
}
