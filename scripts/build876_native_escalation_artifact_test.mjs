import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {nativeProviderEventKey,hasNativeReceiptProvenance,verifyOriginalResendField}
 from '../functions/api/_lib/roadside-native-field-v876.js';
import {classifyRoadsideRefundEscalation,rollupRoadsideEscalations}
 from '../functions/api/_lib/roadside-escalation-policy-v876.js';
import {validateClosureEnvelope,verifyClosurePayloadDigest,compareOriginalClosureEvidence}
 from '../functions/api/_lib/roadside-artifact-verify-v876.js';
const files=['functions/api/_lib/roadside-native-field-v876.js',
 'functions/api/_lib/roadside-escalation-policy-v876.js',
 'functions/api/_lib/roadside-artifact-verify-v876.js',
 'functions/api/admin/roadside_native_field_v876.js',
 'functions/api/admin/roadside_refund_drift_v875.js',
 'functions/api/admin/roadside_artifact_revalidate_v876.js',
 'functions/api/roadside_drift_watch_v876.js',
 'functions/api/roadside_native_resend_v875.js',
 'functions/api/roadside_quote_delivery_v872.js',
 'assets/admin-booking-v876.js','scripts/build876_refund_watch_runner.mjs'];
const read=p=>readFileSync(p,'utf8');
for(const p of files)execFileSync('node',['--check',p],{stdio:'pipe'});
assert.equal(read('admin-booking.html'),read('admin-booking/index.html'));
for(const id of ['rd876NativeCheck','rd876NativeStatus','rd876Policy',
 'rd876PolicyStatus','rd876ArtifactFile','rd876Revalidate','rd876ArtifactStatus',
 '/assets/admin-booking-v876.js'])
 assert(read('admin-booking.html').includes(id),'Owner UI missing '+id);
const nativeRoute=read('functions/api/roadside_native_resend_v875.js');
const relayRoute=read('functions/api/roadside_quote_delivery_v872.js');
assert(nativeRoute.includes('nativeProviderEventKey(proof.native_event_id)'));
assert(relayRoute.includes("eventId.startsWith('native-resend:')"));
assert(nativeRoute.indexOf('verifyResendSvix(')<nativeRoute.indexOf('const rows=await readRows(env,'));
const job=read('functions/api/roadside_drift_watch_v876.js');
assert(job.includes('ROSIE_ROADSIDE_ESCALATION_ENABLED'));
assert(job.includes('ROSIE_ROADSIDE_ESCALATION_JOB_SECRET'));
assert(job.includes('Bearer ')&&job.includes('no_customer_identifiers')===false);
const workflow=read('.github/workflows/rosie876-refund-owner-watch.yml');
assert(workflow.includes('schedule:')&&workflow.includes('issues: write'));
assert(workflow.includes('ROSIE_ROADSIDE_ESCALATION_JOB_SECRET'));
const nativeKey=nativeProviderEventKey('msg_876_proof_0001');
assert.equal(nativeKey,'native-resend:msg_876_proof_0001');
assert.equal(nativeProviderEventKey('bad'),null);

assert.equal(hasNativeReceiptProvenance({signature_verified:true,provider_event_id:nativeKey}),true);
assert.equal(hasNativeReceiptProvenance({signature_verified:true,provider_event_id:'relay_event876'}),false);
assert.equal(hasNativeReceiptProvenance({signature_verified:false,provider_event_id:nativeKey}),false);
const draftId='00000000-0000-4000-8000-000000000801';
const dispatchId='00000000-0000-4000-8000-000000000802';
const deviceId='00000000-0000-4000-8000-000000000803';
const netId='00000000-0000-4000-8000-000000000804';
const closureId='00000000-0000-4000-8000-000000000805';
const receiptId='00000000-0000-4000-8000-000000000806';
const recipient='owner-approved@example.ca';
const recipientHash=createHash('sha256').update(recipient).digest('hex');
const dispatch={id:dispatchId,draft_id:draftId,share_id:'00000000-0000-4000-8000-000000000807',
 provider:'email',provider_message_id:'message_876_001',recipient_hash:recipientHash,
 state:'delivery_confirmed',provider_accepted_at:new Date().toISOString(),
 receipt_at:new Date().toISOString()};
const receipts=[{id:receiptId,dispatch_id:dispatchId,provider_message_id:dispatch.provider_message_id,
 provider_event_id:nativeKey,event_type:'delivered',effective_state:'delivery_confirmed',
 signature_verified:true,received_at:new Date().toISOString()}];
const consent={contact_permission:true,quote_share_withdrawn_at:null,
 share_revoked_at:null,share_expires_at:new Date(Date.now()+7200000).toISOString()};
const email={id:dispatch.provider_message_id,to:[recipient],last_event:'delivered'};
const proof=await verifyOriginalResendField({dispatch,receipts,email,consent});
assert.equal(proof.original_native_signature_proven,true);
assert.equal(proof.provider_delivered,true);
assert.equal((await verifyOriginalResendField({dispatch,receipts:receipts.map(r=>({...r,provider_event_id:'relay_event876'})),email,consent})).provider_delivered,false);
assert.equal((await verifyOriginalResendField({dispatch,receipts,email:{...email,to:['wrong@example.ca']},consent})).provider_delivered,false);
assert.equal((await verifyOriginalResendField({dispatch,receipts,email:{...email,last_event:'bounced'},consent})).provider_delivered,false);
assert.equal((await verifyOriginalResendField({dispatch,receipts,email,consent:{...consent,share_revoked_at:new Date().toISOString()}})).provider_delivered,false);
assert.equal((await verifyOriginalResendField({dispatch,receipts,email,consent:{...consent,share_expires_at:new Date(Date.now()-1000).toISOString()}})).provider_delivered,false);
const policy=classifyRoadsideRefundEscalation({state:'REFUND_COMPLETENESS_DRIFT',
 reason:'Original refund amount increased'},{nowMs:Date.now()});
assert.equal(policy.severity,'CRITICAL');
assert.equal(policy.action,'freeze_closure_and_owner_review');
assert.equal(classifyRoadsideRefundEscalation({state:'PROVIDER_SOURCE_HOLD'}).severity,'HIGH');
assert.equal(classifyRoadsideRefundEscalation({state:'STALE_SOURCE_BASELINE'}).severity,'REVIEW');
assert.equal(classifyRoadsideRefundEscalation({state:'SOURCE_STABLE',alert:false}).severity,'NONE');
const rolled=rollupRoadsideEscalations([policy,classifyRoadsideRefundEscalation({state:'PROVIDER_SOURCE_HOLD'})]);
assert.equal(rolled.severity,'CRITICAL');
assert.equal(rolled.no_customer_identifiers,true);
assert.equal(rollupRoadsideEscalations([],{coverageIncomplete:true}).severity,'REVIEW');
const closure={id:closureId,draft_id:draftId,dispatch_id:dispatchId,device_challenge_id:deviceId,
 net_check_id:netId,owner_actor:'Original Owner',owner_note:'Witnessed original field evidence',
 closed_at:new Date().toISOString(),outcome:'original_roadside_pilot_closed'};
const device={id:deviceId,draft_id:draftId,state:'owner_accepted',
 issued_at:new Date().toISOString(),completed_at:new Date().toISOString(),
 media_id:'00000000-0000-4000-8000-000000000808',
 owner_accepted_by:'Original Owner',owner_accepted_at:new Date().toISOString()};
const net={id:netId,draft_id:draftId,booking_id:'00000000-0000-4000-8000-000000000809',
 provider:'paypal',source:'paypal_live',state:'partial_refund_verified',
 gross_cents:10000,refunded_cents:2000,net_cents:8000,net_verified:true,
 checked_at:new Date().toISOString()};
const exportDispatch={id:dispatch.id,draft_id:draftId,share_id:dispatch.share_id,provider:'email',
 provider_message_id:dispatch.provider_message_id,state:'delivery_confirmed',receipt_at:dispatch.receipt_at};
const original={closure,dispatch:exportDispatch,device,net,receipts,cases:[]};
const dossier={schema:'rosie-roadside-closure-export-v874',
 exported_at:new Date().toISOString(),closure,dispatch:exportDispatch,
 independent_provider_receipts:receipts,original_device_witness:device,
 original_deposit_snapshot:net,refund_case_history:[],current_case_hold:false,
 claims:{independent_external_signature:false}};
dossier.integrity={algorithm:'SHA-256',canonical_payload:'JSON.stringify(evidence_without_integrity)',
 digest_sha256:createHash('sha256').update(JSON.stringify(dossier)).digest('hex'),
 independently_signed:false};
assert.equal(validateClosureEnvelope(dossier,draftId).ok,true);
assert.equal(await verifyClosurePayloadDigest(dossier),true);
assert.equal(compareOriginalClosureEvidence(dossier,original),true);
assert.equal(await verifyClosurePayloadDigest({...dossier,closure:{...closure,owner_note:'silently changed'}}),false);
assert.equal(compareOriginalClosureEvidence(dossier,{...original,net:{...net,net_cents:6000}}),false);
assert.equal(validateClosureEnvelope({...dossier,closure:{...closure,draft_id:deviceId}},draftId).ok,false);
const artifactRoute=read('functions/api/admin/roadside_artifact_revalidate_v876.js');
assert(artifactRoute.includes('verifyClosurePayloadDigest')&&artifactRoute.includes('compareOriginalClosureEvidence'));
assert(artifactRoute.includes('allowLegacyAdminFallback:false')&&artifactRoute.includes("auth.actor?.is_admin!==true"));
assert(artifactRoute.includes('current_payment_clearance:false'));
console.log('Rosie 876 native signed provider, owner escalation and source-bound historical dossier: PASS');
