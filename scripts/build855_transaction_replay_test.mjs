import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {CONTRACT_855,KIND_855,canonicalTransaction855,verifyTransaction855,reviewCrossPlane855}
 from '../functions/api/_lib/jobday-transaction-855.js';
const crypto=globalThis.crypto||webcrypto;
const b64=v=>Buffer.from(v).toString('base64url');
const key=await crypto.subtle.generateKey('Ed25519',true,['sign','verify']);
const commsKey=await crypto.subtle.generateKey('Ed25519',true,['sign','verify']);
const prev=await crypto.subtle.generateKey('Ed25519',true,['sign','verify']);
const pub=async k=>b64(await crypto.subtle.exportKey('raw',k.publicKey));
const sign=async(k,msg)=>b64(await crypto.subtle.sign('Ed25519',k.privateKey,new TextEncoder().encode(msg)));
const now=Date.now(),iso=t=>new Date(t).toISOString();
const booking='11111111-1111-4111-8111-111111111111',project='22222222-2222-4222-8222-222222222222';
const post={id:'33333333-3333-4333-8333-333333333333',platform:'instagram'};
const source='a'.repeat(40),priorDigest='b'.repeat(64);
const caseRef='rosie855case',incident='rosie855incident',tx='transaction855caseone';
const ownerAuditId='44444444-4444-4444-8444-444444444444';
const response={id:'55555555-5555-4555-8555-555555555555',kind:'master_incident_response',
  evidence_sha256:priorDigest,recorded_at:iso(now-45000),sla_due_at:iso(now+100000)};
const env={CF_PAGES_COMMIT_SHA:source,
  ROSIE_AIDATA_TX_REPLAY_ED25519_PUBLIC_KEY_855:await pub(key),
  ROSIE_COMMS_TX_REPLAY_ED25519_PUBLIC_KEY_855:await pub(commsKey),
  ROSIE_AIDATA_INCIDENT_RESPONSE_ED25519_PUBLIC_KEY_854:await pub(prev)};
const context={bookingId:booking,projectId:project,post,caseReference:caseRef,incidentReference:incident,
  transactionReference:tx,prior854:response,ownerAuditId,actor:'originalowner@rosie.ca',now};
const common={version:1,kind:KIND_855,source_id:'rosiedazzlers',source_contract:CONTRACT_855,source_revision:source,
  booking_id:booking,project_id:project,post_id:post.id,case_reference:caseRef,incident_reference:incident,
  transaction_reference:tx,prior_854_response_id:response.id,prior_854_response_sha256:priorDigest,
  original_owner_audit_id:ownerAuditId,source_sla_due_at:response.sla_due_at,
  disposition:'cross_plane_hold_observation',permissions:'review_only_no_runtime_grant',
  issued_at:iso(now-20000),observed_at:iso(now-10000),expires_at:iso(now+120000)};
const ai={...common,plane:'ai-data-platform',nonce:'independentAIdataNonce123456789',signer_id:'independent-ai-master'};
const comms={...common,plane:'rosevear-comms-hub',nonce:'independentCommsNonce123456789',signer_id:'independent-comms-master'};
const aiSignature=await sign(key,canonicalTransaction855(ai));
const commsSignature=await sign(commsKey,canonicalTransaction855(comms));
const a=await verifyTransaction855(env,ai,aiSignature,{...context,plane:'ai-data-platform'});
const c=await verifyTransaction855(env,comms,commsSignature,{...context,plane:'rosevear-comms-hub'});
assert.equal(a.ok,true,JSON.stringify(a));assert.equal(c.ok,true,JSON.stringify(c));
assert.notEqual(a.canonical_sha256,c.canonical_sha256);
const check=(receipt,sig,plane,ctx=context,e=env)=>verifyTransaction855(e,receipt,sig,{...ctx,plane});
assert.equal((await check({...ai,source_revision:'0'.repeat(40)},aiSignature,'ai-data-platform')).ok,false);
assert.equal((await check({...ai,disposition:'CONNECTED'},aiSignature,'ai-data-platform')).ok,false);
assert.equal((await check({...ai,permissions:'write'},aiSignature,'ai-data-platform')).ok,false);
assert.equal((await check({...ai,prior_854_response_sha256:'e'.repeat(64)},aiSignature,'ai-data-platform')).ok,false);
assert.equal((await check({...ai,nonce:'invalid'},aiSignature,'ai-data-platform')).ok,false);
assert.equal((await check(ai,commsSignature,'ai-data-platform')).ok,false);
assert.equal((await check(ai,aiSignature,'rosevear-comms-hub')).ok,false);
assert.equal((await check(ai,aiSignature,'ai-data-platform',{...context,transactionReference:'anotherTransaction'})).ok,false);
assert.equal((await check(ai,aiSignature,'ai-data-platform',{...context,prior854:{...response,id:booking}})).ok,false);
assert.equal((await check(ai,aiSignature,'ai-data-platform',{...context,now:now+3600000})).ok,false);
assert.equal((await check(ai,aiSignature,'ai-data-platform',context,{
 ...env,ROSIE_COMMS_TX_REPLAY_ED25519_PUBLIC_KEY_855:env.ROSIE_AIDATA_TX_REPLAY_ED25519_PUBLIC_KEY_855})).ok,false);
assert.equal((await check(ai,aiSignature,'ai-data-platform',context,{
 ...env,ROSIE_AIDATA_TX_REPLAY_ED25519_PUBLIC_KEY_855:env.ROSIE_AIDATA_INCIDENT_RESPONSE_ED25519_PUBLIC_KEY_854})).ok,false);
assert.throws(()=>canonicalTransaction855({...ai,runtime_connected:true}));
const base={ai:a,comms:c,prior854:response,incidentRecordedAt:iso(now-3600000),
  ownerDecision:'accept_cross_plane_review_only',now};
const verdict=reviewCrossPlane855(base);
assert.equal(verdict.decision,'OWNER_CROSS_PLANE_REVIEW_RECORDED_ONLY');
assert.equal(verdict.review_status,'SIGNED_OBSERVATIONS_WITHIN_TARGET');
assert.equal(verdict.owner_operational_incident_closed,false);
assert.equal(verdict.remote_transaction_commit_verified,false);
assert.equal(verdict.master_connection,'HOLD');
assert.equal(reviewCrossPlane855({...base,comms:{...a,plane:'rosevear-comms-hub'}}).decision,'HOLD');
assert.equal(reviewCrossPlane855({...base,ownerDecision:'close_globally'}).decision,'HOLD');
assert.equal(reviewCrossPlane855({...base,ai:{...a,ok:false}}).decision,'HOLD');
assert.equal(reviewCrossPlane855({...base,incidentRecordedAt:'invalid'}).decision,'HOLD');
const late=reviewCrossPlane855({...base,prior854:{...response,sla_due_at:iso(now-30000)}});
assert.equal(late.review_status,'SIGNED_OBSERVATION_AFTER_TARGET');
assert.equal(late.confirmed_sla_resolution,false);
console.log('Rosie 855 cross-plane independent signed transaction, SLA evidence, replay-safe OWNER HOLD regression PASS');
