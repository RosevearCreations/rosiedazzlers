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
