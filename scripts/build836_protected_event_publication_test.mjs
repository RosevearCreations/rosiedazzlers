import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PUBLICATION_SCHEMA_836,publicationReadiness836}
  from '../assets/build836-publication-readiness.mjs';
import {SCHEMA_836,MASTER_EVENT_836,payloadSha836,validateRosie836Event,
  createRosie836OriginalPublisher,ql836Status}
  from './ql836_protected_event_publication.mjs';
import {onRequestGet,onRequestPost,onRequestPut,onRequestPatch,onRequestDelete,onRequestOptions}
  from '../functions/api/admin/master_shell_publication_v836.js';

const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const t=Date.parse('2026-11-10T03:40:00.000Z'),revision='a'.repeat(40);
const report=publicationReadiness836({runtimeRevision:revision,
  generatedAt:new Date(t).toISOString()});
assert.equal(report.schema,PUBLICATION_SCHEMA_836);
assert.equal(report.source.sourceId,'rosiedazzlers');
assert.equal(report.source.tenantBoundary,'owned_business_legacy');
assert.equal(report.outcome.connected,false);
assert.equal(report.outcome.connectionState,'DISCONNECTED / HOLD');
assert.equal(report.outcome.masterEventsSent,0);
assert.equal(report.outcome.consumerAckVerified,false);
assert.equal(report.outcome.originalPublisherInstalledInWeb,false);
assert.equal(report.eventContract.manyToManyAuthorized,false);
assert.equal(report.consumers.length,2);assert.equal(report.gates.length,8);
assert.equal(publicationReadiness836({runtimeRevision:'bad'}).source.runtimeRevisionClaim,null);
assert.throws(()=>publicationReadiness836({generatedAt:'not-utc'}),/HOLD_INVALID_SOURCE_CLOCK/);
assert.equal(ql836Status(['--status']).connected,false);
assert.throws(()=>ql836Status(['--run']),/DENY_UNSUPERVISED/);
assert.throws(()=>createRosie836OriginalPublisher(),/HOLD_PROTECTED_ORIGINAL/);

const eventId='evt_123456789012abc',idem='rosie.836.42.audit';
const payload={expiresAt:new Date(t+120000).toISOString(),
  status:'HELD',evidenceRef:'urn:rosevear:evidence:rosie-836-test'};
const event={eventId,schema:MASTER_EVENT_836,schemaVersion:'1.0.0',
  sourceId:'rosiedazzlers',sourceRevision:revision,shellId:'rosiedazzlers',
  tenantId:null,eventType:'audit.evidence.recorded',
  occurredAt:new Date(t-2000).toISOString(),publishedAt:new Date(t).toISOString(),
  sourceSequence:42,correlationId:'corr_123456789012abc',causationId:null,
  idempotencyKey:idem,sensitivity:'internal',
  audience:['ai-data-platform','rosevear-comms-hub'],
  evidenceURI:payload.evidenceRef,verificationState:'reported',
  payloadHash:payloadSha836(payload),payload};
assert.equal(validateRosie836Event(event,t).ok,true);
for(const [field,value] of [
  ['sourceId','yw'],['shellId','other'],['tenantId','rosie-dazzlers'],
  ['sourceRevision','invalid'],['eventId','invalid'],
  ['sourceSequence',0],['eventType','consent.changed'],
  ['occurredAt',new Date(t+2000).toISOString()],
  ['publishedAt',new Date(t-100000).toISOString()],
  ['correlationId','bad'],['causationId','bad'],
  ['idempotencyKey','space is bad'],['sensitivity','restricted'],
  ['verificationState','unknown'],['payloadHash','bad'],
  ['audience',['yw']],['audience',['ai-data-platform','ai-data-platform']],
  ['audience',['ai-data-platform','rosevear-comms-hub','yw']],
  ['evidenceURI','http://insecure.invalid']]){
  assert.equal(validateRosie836Event({...event,[field]:value},t).ok,false,field);
}
assert.equal(validateRosie836Event({...event,extra:true},t).ok,false);
assert.equal(validateRosie836Event({...event,payload:{...payload,status:'ACCEPTED'}},t).ok,false);
assert.equal(validateRosie836Event({...event,payload:{...payload,pii:'hidden'}},t).ok,false);
assert.equal(validateRosie836Event(event,t+11*60_000).ok,false);
assert.equal(validateRosie836Event({...event,eventType:'release.promoted'},t).ok,false);

const recipientGrant=recipient=>({schema:'rosie.master-shell.ql836.original-per-consumer-grant.v1',
  state:'INDEPENDENT_ORIGINAL_PER_CONSUMER_PUBLICATION_APPROVED',
  sourceId:'rosiedazzlers',recipient,eventId,sourceRevision:revision,
  sourceSequence:42,payloadHash:event.payloadHash,idempotencyKey:idem,
  expiresAt:new Date(t+85000).toISOString(),approvedTransport:recipient==='ai-data-platform'?
    'SIGNED_HMAC_WEBHOOK_V1':'CONSENT_SCOPED_PRIVATE_EVENT_V1',
  independentSourceOwnerVerified:true,independentMasterOwnerVerified:true,
  originalQl835ReceiptWitnessed:true,originalSourceSignerVerified:true,
  originalConsumerReceiverVerified:true,durableReplayStoreVerified:true,
  dataMinimizationVerified:true,consumerContractVerified:true,consentAndRouteVerified:true});
const calls=[];
let denyGrant=null,denyReserve=null,denySourceProof=null,denyAck=null,
  throwTransmit=null,dlqWorks=true;
const originalOperator={
  async readIndependentOriginalPerConsumerGrant({recipient}){
    calls.push('grant:'+recipient);
    return denyGrant===recipient?{...recipientGrant(recipient),consentAndRouteVerified:false}:
      recipientGrant(recipient);
  },
  async reserveDurableOriginalDelivery({recipient,eventId:id}){
    calls.push('reserve:'+recipient);
    return {reserved:denyReserve!==recipient,fresh:denyReserve!==recipient,
      inOrder:denyReserve!==recipient,recipient,eventId:id};
  },
  async signOriginalSourceEnvelope({event:e,recipient}){
    calls.push('sign:'+recipient);
    return {sourceSigned:true,sourceId:'rosiedazzlers',eventId:e.eventId,
      recipient,envelopeSha256:'b'.repeat(64),signerKeyId:'source-key-836'};
  },
  async verifyIndependentOriginalSourceSignature({sourceId,recipient,eventId:id,envelopeSha256}){
    calls.push('verify-source:'+recipient);
    return {independentlyVerified:denySourceProof!==recipient,
      sourceId,recipient,eventId:id,envelopeSha256};
  },
  async transmitOriginalConsumerEvent({event:e,recipient}){
    calls.push('transmit:'+recipient);
    if(throwTransmit===recipient)throw Error('transmission unknown');
    return {submitted:true,eventId:e.eventId,recipient};
  },
  async verifyIndependentOriginalConsumerAck({recipient,eventId:id,sourceSequence,
    payloadHash,idempotencyKey,envelopeSha256}){
    calls.push('ack:'+recipient);
    return {independentlyVerified:denyAck!==recipient,accepted:denyAck!==recipient,
      sourceId:'rosiedazzlers',recipient,eventId:id,sourceSequence,
      payloadHash,idempotencyKey,envelopeSha256,durableReceiptVerified:true};
  },
  async recordOriginalDeadLetter({recipient,eventId:id}){
    calls.push('dlq:'+recipient);
    if(!dlqWorks)throw Error('DLQ unavailable');
    return {durablyRecorded:true,recipient,eventId:id};
  }
};
const build=()=>createRosie836OriginalPublisher({originalOperator,now:()=>t});
let publisher=build();
assert.equal(publisher.inspect().connected,false);
let result=await publisher.publishOnce(event);
assert.equal(result.schema,SCHEMA_836);
assert.equal(result.state,'ALL_ORIGINAL_CONSUMER_ACKS_VERIFIED_CONNECTION_STILL_HELD');
assert.equal(result.allConsumerAcksVerified,true);
assert.equal(result.ackVerifiedCount,2);
assert.equal(result.connectionState,'DISCONNECTED / HOLD');
assert.equal(result.connected,false);
assert.equal(result.autoRetry,false);
assert.equal(calls.filter(x=>x.startsWith('transmit')).length,2);
assert.deepEqual(calls.slice(0,2),[
  'grant:ai-data-platform','grant:rosevear-comms-hub']);
assert.equal((await publisher.publishOnce(event)).state,'DENY_DUPLICATE_PUBLISHER_INSTANCE');

calls.length=0;denyGrant='rosevear-comms-hub';
result=await build().publishOnce(event);
assert.equal(result.state,'HOLD_ORIGINAL_PER_CONSUMER_GRANT_UNVERIFIED');
assert.equal(calls.filter(x=>x.startsWith('transmit')).length,0);
assert.equal(calls.filter(x=>x.startsWith('reserve')).length,0);
denyGrant=null;

calls.length=0;denyReserve='ai-data-platform';denyAck='rosevear-comms-hub';
result=await build().publishOnce(event);
assert.equal(result.state,'PARTIAL_OR_UNVERIFIED_DELIVERY_CONSUMERS_ISOLATED_HELD');
assert.equal(result.ackVerifiedCount,0);
assert.equal(result.deliveries[0].dlq,'ORIGINAL_DLQ_RECORDED');
assert.equal(result.deliveries[1].dlq,'ORIGINAL_DLQ_RECORDED');
assert.ok(calls.includes('transmit:rosevear-comms-hub'));
assert.ok(!calls.includes('transmit:ai-data-platform'));
denyReserve=null;denyAck=null;

calls.length=0;denySourceProof='ai-data-platform';
result=await build().publishOnce(event);
assert.equal(result.deliveries[0].state,'HOLD_DELIVERY_OR_ACK_UNVERIFIED');
assert.ok(!calls.includes('transmit:ai-data-platform'));
assert.ok(calls.includes('transmit:rosevear-comms-hub'));
denySourceProof=null;

calls.length=0;throwTransmit='ai-data-platform';dlqWorks=false;
result=await build().publishOnce(event);
assert.equal(result.state,'PARTIAL_OR_UNVERIFIED_DELIVERY_CONSUMERS_ISOLATED_HELD');
assert.equal(result.deliveries[0].dlq,'HOLD_UNVERIFIED');
assert.equal(result.deliveries[0].transmissionMayHaveOccurred,true);
assert.equal(result.deliveries[1].state,'ACK_VERIFIED');
assert.equal(result.autoRetry,false);
throwTransmit=null;dlqWorks=true;

calls.length=0;
result=await build().publishOnce({...event,sourceId:'icamp'});
assert.equal(result.state,'DENY_SOURCE_SCHEMA_SCOPE_EXPIRY_OR_HASH');
assert.equal(calls.length,0);
assert.doesNotMatch(JSON.stringify(result),/secret|private-fixture|HMAC_KEY/);

// Only the established Rosie staff-session query is allowed on the HTTP path.
const request=new Request('https://rosiedazzlers.ca/api/admin/master_shell_publication_v836',
  {headers:{Cookie:'rd_staff_session=private-fixture'}});
const env={SUPABASE_URL:'https://supabase-mock.invalid',
  SUPABASE_SERVICE_ROLE_KEY:'service-fixture',CF_PAGES_COMMIT_SHA:revision};
const oldFetch=globalThis.fetch;
let signed=false,role='detailer',permission=true;const hits=[];
globalThis.fetch=async(input,init={})=>{
  const table=new URL(input).pathname.split('/').pop();hits.push(table);
  assert.equal(table,'staff_auth_sessions');assert.equal(init.method??'GET','GET');
  return Response.json(signed?[{expires_at:'2031-01-01T00:00:00Z',revoked_at:null,
    staff_user:{id:'00000000-0000-4000-8000-000000000099',role_code:role,
      is_active:true,can_manage_bookings:true,permissions_profile:{action_access:{
        'operations.assignment.manage':permission}}}}]:[]);
};
try{
  assert.equal((await onRequestGet({request,env})).status,401);
  signed=true;assert.equal((await onRequestGet({request,env})).status,403);
  role='operations_manager';permission=false;
  assert.equal((await onRequestGet({request,env})).status,403);
  permission=true;
  const response=await onRequestGet({request,env});
  assert.equal(response.status,200);
  assert.match(response.headers.get('Cache-Control'),/no-store/);
  const body=await response.json();
  assert.equal(body.report.schema,PUBLICATION_SCHEMA_836);
  assert.equal(body.report.outcome.connected,false);
  assert.equal(body.report.outcome.masterEventsSent,0);
  assert.equal(body.authority.sourcePublishes,0);
  assert.equal(body.authority.databaseWrites,0);
  assert.ok(hits.every(x=>x==='staff_auth_sessions'));
  assert.doesNotMatch(JSON.stringify(body),/service-fixture|private-fixture|00000000-0000-4000/);
  for(const mutation of [onRequestOptions,onRequestPost,onRequestPut,onRequestPatch,onRequestDelete])
    assert.equal((await mutation()).status,405);
}finally{globalThis.fetch=oldFetch;}
const html=read('../admin-handoff-acceptance.html');
assert.equal(html,read('../admin-handoff-acceptance/index.html'));
for(const id of ['build836Heading','build836Gates','build836Consumers','build836Refresh'])
  assert.match(html,new RegExp('id="'+id+'"'));
assert.match(html,/startPublicationReadiness836\(\)/);
assert.match(html,/build836-publication\.css/);
const ui=read('../assets/build836-publication-ui.mjs');
assert.match(ui,/textContent/);assert.doesNotMatch(ui,/innerHTML|method:\s*['"]POST/);
assert.match(read('../assets/build836-publication.css'),/focus-visible/);
assert.match(read('./current_booking_wizard_regression.sh'),/build836_protected_event_publication_test/);
console.log('Build 836 protected event schema, original grants, replay, ACK/DLQ isolation and safe staff UI PASS');
