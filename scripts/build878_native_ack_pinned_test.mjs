import assert from 'node:assert/strict';
import {createHash,webcrypto} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {assessNativeEventDelivery878} from '../functions/api/_lib/roadside-native-delivery-v878.js';
import {assessOwnerSlaAcknowledgement878} from '../functions/api/_lib/roadside-owner-ack-v878.js';
import {pinnedIssuerRoster878,verifyPinnedProvenance878,pinnedKeyId878}
 from '../functions/api/_lib/roadside-provenance-pin-v878.js';
import {issueOwnerClosureProvenance}
 from '../functions/api/_lib/roadside-provenance-issuer-v877.js';

const files=[
 'functions/api/_lib/roadside-native-delivery-v878.js',
 'functions/api/admin/roadside_native_delivery_v878.js',
 'functions/api/admin/roadside_native_field_v876.js',
 'functions/api/_lib/roadside-owner-ack-v878.js',
 'functions/api/admin/roadside_sla_ack_v878.js',
 'functions/api/admin/roadside_sla_audit_v877.js',
 'functions/api/_lib/roadside-provenance-pin-v878.js',
 'functions/api/admin/roadside_provenance_verify_v878.js',
 'assets/admin-booking-v878.js'
];
const read=p=>readFileSync(p,'utf8');
for(const path of files)execFileSync('node',['--check',path],{stdio:'pipe'});
const html=read('admin-booking.html');
assert.equal(html,read('admin-booking/index.html'));
for(const id of ['rd878Native','rd878NativeResult','rd878AckAudit','rd878AckCase',
 'rd878AckNote','rd878AckSend','rd878OriginalDossier','rd878IssuerSidecar',
 'rd878VerifyPin','rd878PinResult','/assets/admin-booking-v878.js'])
 assert(html.includes(id),'Missing owner UI '+id);

const draftId='00000000-0000-4000-8000-000000000878';
const closureId='00000000-0000-4000-8000-000000000879';
const dispatchId='00000000-0000-4000-8000-000000000880';
const sourceCheckId='00000000-0000-4000-8000-000000000881';
const caseId='00000000-0000-4000-8000-000000000882';
const nowMs=Date.now();
const stamp=new Date(nowMs-60000).toISOString();
const receipts=[{dispatch_id:dispatchId,provider_event_id:'native-resend:msg_878_original_001',
 provider_message_id:'original_resend_878_email',event_type:'delivered',
 effective_state:'delivery_confirmed',signature_verified:true,received_at:stamp}];
const nativeField={provider_api_queried:true,original_native_signature_proven:true,
 provider_delivered:true,state:'NATIVE_PROVIDER_DELIVERED',original_dispatch_id:dispatchId};
const enrollment={provider_api_queried:true,enrollment_verified:true,
 signing_key_binding_verified:false};
const good=await assessNativeEventDelivery878({nativeField,enrollment,receipts,dispatchId,nowMs});
assert.equal(good.state,'ORIGINAL_NATIVE_DELIVERY_CORROBORATED');
assert.equal(good.signed_webhook_seen,true);
assert.equal(good.customer_read_confirmed,false);
assert.match(good.original_native_event_chain_sha256,/^[0-9a-f]{64}$/);
for(const altered of [
 {enrollment:{...enrollment,enrollment_verified:false}},
 {nativeField:{...nativeField,provider_delivered:false}},
 {nativeField:{...nativeField,original_dispatch_id:draftId}},
 {receipts:receipts.map(r=>({...r,provider_event_id:'generic-signed_878'}))},
 {receipts:receipts.map(r=>({...r,signature_verified:false}))},
 {receipts:receipts.map(r=>({...r,event_type:'bounced',effective_state:'delivery_failed'}))},
 {receipts:receipts.map(r=>({...r,received_at:new Date(nowMs+60000).toISOString()}))}
]){
 const result=await assessNativeEventDelivery878({
  nativeField,enrollment,receipts,dispatchId,nowMs,...altered});
 assert.equal(result.delivery_corroborated,false,
  'Unproven provider status, native signature or original dispatch must HOLD');
}
const originalCase={id:caseId,draft_id:draftId,booking_id:closureId,
 state:'open',opened_at:stamp};
const ack={id:closureId,case_id:caseId,source_check_id:sourceCheckId,
 severity:'HIGH',original_case_opened_at:stamp,acknowledged_at:new Date(nowMs).toISOString(),
 owner_actor:'Original Owner'};
assert.equal(assessOwnerSlaAcknowledgement878({
 originalCase,sourceCheckId,severity:'HIGH',acks:[ack]}).state,'OWNER_ACKNOWLEDGED');
assert.equal(assessOwnerSlaAcknowledgement878({
 originalCase,sourceCheckId,severity:'CRITICAL',acks:[ack]}).state,'OWNER_ACK_REQUIRED');
assert.equal(assessOwnerSlaAcknowledgement878({
 originalCase,sourceCheckId:draftId,severity:'HIGH',acks:[ack]}).state,'OWNER_ACK_REQUIRED');
assert.equal(assessOwnerSlaAcknowledgement878({
 originalCase:{...originalCase,state:'closed_verified'},sourceCheckId,severity:'HIGH',acks:[ack]}).state,'ACK_SOURCE_HOLD');
assert.equal(assessOwnerSlaAcknowledgement878({
 originalCase,sourceCheckId,severity:'HIGH',
 acks:[{...ack,original_case_opened_at:new Date(nowMs-120000).toISOString()}]}).state,'ACK_SOURCE_HOLD');
assert.equal(assessOwnerSlaAcknowledgement878({
 originalCase,sourceCheckId,severity:'HIGH',acks:[ack,ack]}).state,'ACK_SOURCE_HOLD');

const pair=await webcrypto.subtle.generateKey('Ed25519',true,['sign','verify']);
const privateJwk=await webcrypto.subtle.exportKey('jwk',pair.privateKey);
const publicJwk=await webcrypto.subtle.exportKey('jwk',pair.publicKey);
const digest=createHash('sha256').update('verified original 878 closed dossier').digest('hex');
const nowIso=new Date(nowMs-1000).toISOString();
const issued=await issueOwnerClosureProvenance({privateJwk,publicJwk,
 draftId,closureId,artifactDigest:digest,nowIso});
assert.equal(issued.ok,true);
const artifact={integrity:{digest_sha256:digest},closure:{draft_id:draftId,id:closureId}};
const pinned=pinnedIssuerRoster878(JSON.stringify([{status:'active',public_jwk:publicJwk}]));
assert.equal(pinned.ok,true);
assert.equal(pinnedIssuerRoster878(null,{fallbackPublicJwk:publicJwk}).ok,true);
const verified=await verifyPinnedProvenance878({sidecar:issued,artifact,roster:pinned,nowMs});
assert.equal(verified.signed_provenance_verified,true);
assert.equal(verified.rotation_readiness,'ACTIVE_PIN_ONLY');
assert.equal(verified.issuer_key_id,await pinnedKeyId878(publicJwk));
assert.equal(verified.current_payment_clearance,false);
const other=await webcrypto.subtle.generateKey('Ed25519',true,['sign','verify']);
const otherPub=await webcrypto.subtle.exportKey('jwk',other.publicKey);
assert.equal((await verifyPinnedProvenance878({
 sidecar:issued,artifact,roster:pinnedIssuerRoster878(JSON.stringify([
 {status:'active',public_jwk:otherPub}]))})).ok,false,
 'Self-contained sidecar key must never be treated as independently pinned');
assert.equal((await verifyPinnedProvenance878({
 sidecar:issued,artifact,roster:pinnedIssuerRoster878(JSON.stringify([
 {status:'revoked',public_jwk:publicJwk},{status:'active',public_jwk:otherPub}]))})).ok,false);
assert.equal((await verifyPinnedProvenance878({
 sidecar:issued,artifact:{...artifact,integrity:{digest_sha256:'0'.repeat(64)}},roster:pinned})).ok,false);
assert.equal((await verifyPinnedProvenance878({
 sidecar:{...issued,payload:{...issued.payload,closure_id:draftId}},artifact,roster:pinned})).ok,false);
assert.equal((await verifyPinnedProvenance878({
 sidecar:{...issued,signature_ed25519:'A'.repeat(86)},artifact,roster:pinned})).ok,false);
const previous=[{status:'active',public_jwk:otherPub},
 {status:'previous',public_jwk:publicJwk,
  issued_before:new Date(nowMs+60000).toISOString(),
  verify_until:new Date(nowMs+3600000).toISOString()}];
assert.equal((await verifyPinnedProvenance878({sidecar:issued,artifact,
 roster:pinnedIssuerRoster878(JSON.stringify(previous)),nowMs})).rotation_readiness,
 'PREVIOUS_PIN_WITHIN_GRACE');
const expired=previous.map(k=>k.status==='previous'?{...k,
 verify_until:new Date(nowMs-1000).toISOString(),
 issued_before:new Date(nowMs-7200000).toISOString()}:k);
assert.equal((await verifyPinnedProvenance878({sidecar:issued,artifact,
 roster:pinnedIssuerRoster878(JSON.stringify(expired)),nowMs})).ok,false);
assert.equal(pinnedIssuerRoster878(JSON.stringify([{status:'active',public_jwk:publicJwk},
 {status:'active',public_jwk:otherPub}])).ok,false);
assert.equal(pinnedIssuerRoster878(JSON.stringify([{status:'active',public_jwk:publicJwk},
 {status:'active',public_jwk:publicJwk}])).ok,false);

const ackRoute=read('functions/api/admin/roadside_sla_ack_v878.js');
assert(ackRoute.includes('allowLegacyAdminFallback:false'));
assert(ackRoute.includes("request.headers.get('Origin')"));
assert(ackRoute.includes('rosie878_ack_owner_sla'));
assert(ackRoute.includes('audit.latest_original_source_check_id!==sourceId'));
const sql=read('supabase/migrations/20261113000700_build878_owner_sla_acknowledgements.sql');
assert(sql.includes('enable row level security'));
assert(sql.includes('revoke all on public.rosie_roadside_sla_acks_v878 from public,anon,authenticated'));
assert(sql.includes('security invoker'));
assert(sql.includes('on conflict (case_id,source_check_id,severity) do nothing'));
assert(sql.includes("c.state not in ('open','reviewed_hold')"));
assert(!/grant (insert|execute).* to (anon|authenticated);/i.test(sql));
const proofRoute=read('functions/api/admin/roadside_provenance_verify_v878.js');
assert(proofRoute.indexOf('validateOriginalDossier(')<proofRoute.indexOf('verifyPinnedProvenance878('));
assert(proofRoute.includes('ROSIE_CLOSURE_TRUSTED_ED25519_KEYS_JSON'));
const nativeRoute=read('functions/api/admin/roadside_native_delivery_v878.js');
assert(nativeRoute.includes('roadside_native_field_v876.js'));
assert(nativeRoute.includes('roadside_provider_enrollment_v877.js'));
assert(nativeRoute.includes('original_dispatch_record_verified:true'));
console.log('Rosie 878 original signed events, immutable owner SLA acknowledgement and pinned Ed25519 rotation: PASS');
