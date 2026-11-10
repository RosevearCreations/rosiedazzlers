/** Build 836 original-protected publisher boundary. NOT wired to Cloudflare,
 * browsers, scheduled jobs, or a credential/environment bootstrap. The separately
 * authenticated original operator must verify signatures, consent, keys, durable
 * claims and consumer ACK independently. Positive fixtures are NEVER field proof.
 */
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';

export const SCHEMA_836='rosie.master-shell.ql836.protected-publication.v1';
export const MASTER_EVENT_836='rosevear.master-shell.event.v1';
const SOURCE='rosiedazzlers',HELD='DISCONNECTED / HOLD';
const SHA=/^[a-f0-9]{64}$/,REV=/^[a-f0-9]{40}$/;
const IDS=/^[A-Za-z0-9_-]{12,100}$/;
const ISO=s=>typeof s==='string'&&Number.isFinite(Date.parse(s))&&
  new Date(Date.parse(s)).toISOString()===s;
const allowed=Object.freeze({
  'source.health.reported':['ai-data-platform'],
  'release.promoted':['ai-data-platform'],
  'module.readiness.changed':['ai-data-platform'],
  'audit.evidence.recorded':['ai-data-platform','rosevear-comms-hub'],
  'incident.opened':['rosevear-comms-hub'],
  'incident.updated':['rosevear-comms-hub']
});
const fields=['eventId','schema','schemaVersion','sourceId','sourceRevision',
  'shellId','tenantId','eventType','occurredAt','publishedAt','sourceSequence',
  'correlationId','causationId','idempotencyKey','sensitivity','audience',
  'evidenceURI','verificationState','payloadHash','payload'];
const exact=(v,keys)=>v!==null&&typeof v==='object'&&!Array.isArray(v)&&
  Object.keys(v).length===keys.length&&Object.keys(v).every(k=>keys.includes(k));
export function canonical836(v){
  if(Array.isArray(v))return '['+v.map(canonical836).join(',')+']';
  if(v&&typeof v==='object')return '{'+Object.keys(v).sort().map(k=>
    JSON.stringify(k)+':'+canonical836(v[k])).join(',')+'}';
  return JSON.stringify(v);
}
export const payloadSha836=payload=>createHash('sha256').update(canonical836(payload)).digest('hex');
export function validateRosie836Event(event,now=Date.now()){
  if(!Number.isSafeInteger(now)||!exact(event,fields)||
     event.schema!==MASTER_EVENT_836||event.schemaVersion!=='1.0.0'||
     event.sourceId!==SOURCE||event.shellId!==SOURCE||event.tenantId!==null||
     !REV.test(event.sourceRevision??'')||
     !/^evt_[A-Za-z0-9_-]{12,100}$/.test(event.eventId??'')||
     !/^corr_[A-Za-z0-9_-]{12,100}$/.test(event.correlationId??'')||
     (event.causationId!==null&&!/^cause_[A-Za-z0-9_-]{12,100}$/.test(event.causationId??''))||
     !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/.test(event.idempotencyKey??'')||
     !Number.isSafeInteger(event.sourceSequence)||event.sourceSequence<1||
     !Object.hasOwn(allowed,event.eventType??'')||
     !['internal','confidential'].includes(event.sensitivity)||
     !['observed','reported','independently-verified'].includes(event.verificationState)||
     !ISO(event.occurredAt)||!ISO(event.publishedAt)||
     Date.parse(event.publishedAt)<Date.parse(event.occurredAt)||
     Math.abs(now-Date.parse(event.publishedAt))>30_000||
     typeof event.evidenceURI!=='string'||
     !/^(https:\/\/|urn:rosevear:evidence:)[^\s]{1,500}$/.test(event.evidenceURI)||
     !exact(event.payload,['expiresAt','status','evidenceRef'])||
     !ISO(event.payload.expiresAt)||Date.parse(event.payload.expiresAt)<=now||
     Date.parse(event.payload.expiresAt)>now+600_000||
     !['HELD','OBSERVED','NEEDS_REVIEW'].includes(event.payload.status)||
     event.payload.evidenceRef!==event.evidenceURI||
     !SHA.test(event.payloadHash??'')||
     payloadSha836(event.payload)!==event.payloadHash||
     !Array.isArray(event.audience)||event.audience.length<1||
     event.audience.length>2||new Set(event.audience).size!==event.audience.length||
     event.audience.some(a=>!allowed[event.eventType].includes(a)))
    return {ok:false,code:'DENY_SOURCE_SCHEMA_SCOPE_EXPIRY_OR_HASH'};
  return {ok:true,code:'SOURCE_EVENT_STRUCTURE_VALID_NOT_AUTHORIZED'};
}
const proposal=(code,more={})=>Object.freeze({schema:SCHEMA_836,sourceId:SOURCE,
  state:code,connectionState:HELD,connected:false,connectionPromoted:false,
  authenticatedSourceSignerEnrolledHere:false,consumerConnectionsVerified:false,
  customerDataAllowed:false,deviceActionsAllowed:false,
  autoRetry:false,...more});
const grantFields=['schema','state','sourceId','recipient','eventId','sourceRevision',
  'sourceSequence','payloadHash','idempotencyKey','expiresAt','approvedTransport',
  'independentSourceOwnerVerified','independentMasterOwnerVerified',
  'originalQl835ReceiptWitnessed','originalSourceSignerVerified',
  'originalConsumerReceiverVerified','durableReplayStoreVerified',
  'dataMinimizationVerified','consumerContractVerified','consentAndRouteVerified'];
function validGrant(g,e,recipient,at){
  return exact(g,grantFields)&&
    g.schema==='rosie.master-shell.ql836.original-per-consumer-grant.v1'&&
    g.state==='INDEPENDENT_ORIGINAL_PER_CONSUMER_PUBLICATION_APPROVED'&&
    g.sourceId===SOURCE&&g.recipient===recipient&&g.eventId===e.eventId&&
    g.sourceRevision===e.sourceRevision&&g.sourceSequence===e.sourceSequence&&
    g.payloadHash===e.payloadHash&&g.idempotencyKey===e.idempotencyKey&&
    ISO(g.expiresAt)&&Date.parse(g.expiresAt)>at&&
    Date.parse(g.expiresAt)<=Math.min(Date.parse(e.payload.expiresAt),at+90_000)&&
    g.approvedTransport===(recipient==='ai-data-platform'?
      'SIGNED_HMAC_WEBHOOK_V1':'CONSENT_SCOPED_PRIVATE_EVENT_V1')&&
    g.independentSourceOwnerVerified===true&&g.independentMasterOwnerVerified===true&&
    g.originalQl835ReceiptWitnessed===true&&g.originalSourceSignerVerified===true&&
    g.originalConsumerReceiverVerified===true&&g.durableReplayStoreVerified===true&&
    g.dataMinimizationVerified===true&&g.consumerContractVerified===true&&
    g.consentAndRouteVerified===true;
}
const methods=['readIndependentOriginalPerConsumerGrant','reserveDurableOriginalDelivery',
  'signOriginalSourceEnvelope','verifyIndependentOriginalSourceSignature',
  'transmitOriginalConsumerEvent',
  'verifyIndependentOriginalConsumerAck','recordOriginalDeadLetter'];

/** This factory must be called inside an independently authenticated private
 * operator, never through an HTTP endpoint or browser. An absent callback HOLDs.
 * One call spends the instance even if validation, reservation or ACK fails.
 */
export function createRosie836OriginalPublisher({originalOperator,now=()=>Date.now()}={}){
  if(typeof now!=='function'||methods.some(m=>typeof originalOperator?.[m]!=='function'))
    throw Error('HOLD_PROTECTED_ORIGINAL_PUBLISHER_AND_DURABLE_STORE_UNAVAILABLE');
  let spent=false;
  return Object.freeze({
    inspect:()=>proposal('HOLD_ORIGINAL_SIGNER_CONSENT_CONSUMER_AND_ACK_REQUIRED',
      {attempted:spent}),
    async publishOnce(event){
      if(spent)return proposal('DENY_DUPLICATE_PUBLISHER_INSTANCE');
      spent=true;
      const at=now(),validation=validateRosie836Event(event,at);
      if(!validation.ok)return proposal(validation.code);
      const recipients=[...event.audience],grants=new Map();
      try{
        // All recipient approvals must pass before any reservation or send.
        for(const recipient of recipients){
          const g=await originalOperator.readIndependentOriginalPerConsumerGrant({
            sourceId:SOURCE,recipient,eventId:event.eventId,
            sourceRevision:event.sourceRevision,sourceSequence:event.sourceSequence,
            idempotencyKey:event.idempotencyKey,payloadHash:event.payloadHash});
          if(!validGrant(g,event,recipient,at))
            return proposal('HOLD_ORIGINAL_PER_CONSUMER_GRANT_UNVERIFIED',
              {heldRecipient:recipient,attempted:true});
          grants.set(recipient,g);
        }
      }catch{return proposal('HOLD_ORIGINAL_GRANT_READBACK_AMBIGUOUS_NO_RETRY',{attempted:true});}
      const deliveries=[];
      for(const recipient of recipients){
        let stage='DURABLE_RESERVATION',transmitted=false;
        try{
          const grant=grants.get(recipient);
          const claim=await originalOperator.reserveDurableOriginalDelivery({
            sourceId:SOURCE,recipient,eventId:event.eventId,
            sourceSequence:event.sourceSequence,idempotencyKey:event.idempotencyKey});
          if(claim?.reserved!==true||claim?.fresh!==true||
             claim?.inOrder!==true||claim?.recipient!==recipient||
             claim?.eventId!==event.eventId)throw Error('DENY_REPLAY_OR_OUT_OF_ORDER');
          stage='SOURCE_SIGNING';
          const signed=await originalOperator.signOriginalSourceEnvelope({
            event,recipient,grant});
          if(signed?.sourceId!==SOURCE||signed?.eventId!==event.eventId||
             signed?.recipient!==recipient||signed?.sourceSigned!==true||
             !SHA.test(signed?.envelopeSha256??'')||
             !IDS.test(signed?.signerKeyId??''))throw Error('HOLD_UNSIGNED_OR_DRIFTED_SOURCE_ENVELOPE');
          const sourceProof=await originalOperator.verifyIndependentOriginalSourceSignature({
            sourceId:SOURCE,recipient,eventId:event.eventId,
            envelopeSha256:signed.envelopeSha256,signerKeyId:signed.signerKeyId,
            signedEnvelope:signed});
          if(sourceProof?.independentlyVerified!==true||
             sourceProof?.sourceId!==SOURCE||sourceProof?.recipient!==recipient||
             sourceProof?.eventId!==event.eventId||
             sourceProof?.envelopeSha256!==signed.envelopeSha256)
            throw Error('HOLD_ORIGINAL_SOURCE_SIGNATURE_NOT_INDEPENDENTLY_VERIFIED');
          stage='ORIGINAL_TRANSMIT';
          transmitted=true;
          const transmission=await originalOperator.transmitOriginalConsumerEvent({
            event,recipient,signedEnvelope:signed});
          if(transmission?.submitted!==true||transmission?.recipient!==recipient||
             transmission?.eventId!==event.eventId)
            throw Error('HOLD_UNCONFIRMED_ORIGINAL_TRANSMISSION');
          stage='INDEPENDENT_ACK';
          const ack=await originalOperator.verifyIndependentOriginalConsumerAck({
            sourceId:SOURCE,recipient,eventId:event.eventId,
            sourceSequence:event.sourceSequence,idempotencyKey:event.idempotencyKey,
            payloadHash:event.payloadHash,envelopeSha256:signed.envelopeSha256,
            transmission});
          if(ack?.independentlyVerified!==true||ack?.accepted!==true||
             ack?.sourceId!==SOURCE||ack?.recipient!==recipient||
             ack?.eventId!==event.eventId||
             ack?.sourceSequence!==event.sourceSequence||
             ack?.payloadHash!==event.payloadHash||
             ack?.envelopeSha256!==signed.envelopeSha256||
             ack?.idempotencyKey!==event.idempotencyKey||
             ack?.durableReceiptVerified!==true)
            throw Error('HOLD_CONSUMER_RECEIPT_UNVERIFIED');
          deliveries.push({recipient,state:'ACK_VERIFIED',
            originalConsumerAckVerified:true});
        }catch{
          let dlq='HOLD_UNVERIFIED';
          try{
            const recorded=await originalOperator.recordOriginalDeadLetter({
              sourceId:SOURCE,recipient,eventId:event.eventId,
              sourceSequence:event.sourceSequence,stage,
              transmitted,automaticRetry:false});
            if(recorded?.durablyRecorded===true&&recorded?.recipient===recipient&&
               recorded?.eventId===event.eventId)dlq='ORIGINAL_DLQ_RECORDED';
          }catch{/* Unverified DLQ remains held; no blind replay. */}
          deliveries.push({recipient,state:'HOLD_DELIVERY_OR_ACK_UNVERIFIED',
            originalConsumerAckVerified:false,dlq,stage,
            transmissionMayHaveOccurred:transmitted});
        }
      }
      const ackCount=deliveries.filter(d=>d.originalConsumerAckVerified).length;
      return proposal(ackCount===recipients.length?
        'ALL_ORIGINAL_CONSUMER_ACKS_VERIFIED_CONNECTION_STILL_HELD':
        'PARTIAL_OR_UNVERIFIED_DELIVERY_CONSUMERS_ISOLATED_HELD',{
        attempted:true,eventId:event.eventId,approvedRecipientCount:recipients.length,
        ackVerifiedCount:ackCount,allConsumerAcksVerified:ackCount===recipients.length,
        deliveries,masterConnectionGranted:false});
    }
  });
}

export function ql836Status(args=process.argv.slice(2)){
  if(args.length===1&&args[0]==='--status')
    return proposal('HOLD_ORIGINAL_PRIVATE_PUBLICATION_OPERATOR_NOT_INSTALLED');
  throw Error('DENY_UNSUPERVISED_QL836_PUBLICATION');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  try{process.stdout.write(JSON.stringify(ql836Status())+'\n');}
  catch{process.stderr.write('DENY_UNSUPERVISED_PUBLISH\n');process.exitCode=1;}
}
