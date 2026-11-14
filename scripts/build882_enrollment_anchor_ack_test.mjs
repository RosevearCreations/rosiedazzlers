import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {generateKeyPairSync,sign,createHash} from 'node:crypto';
import {verifyEnrollmentProof882} from '../functions/api/roadside_scheduler_enrollment_v882.js';
import {ownerAckState882,reconcileExternalAnchors882} from './build882_enrollment_anchor_ack.mjs';
import {keyId881,anchorComment881} from './build881_independent_anchor_runner.mjs';
const files=['functions/api/roadside_scheduler_enrollment_v882.js',
 'scripts/build882_enrollment_anchor_ack.mjs','scripts/build882_enrollment_anchor_ack_test.mjs'];
for(const f of files)execFileSync('node',['--check',f],{stdio:'pipe'});
const now=Date.now(),iso=x=>new Date(x).toISOString(),hex=c=>c.repeat(64);
const {privateKey,publicKey}=generateKeyPairSync('ed25519');
const jwk=publicKey.export({format:'jwk'});
const proof={schema:'rosie882-scheduler-enrollment-v1',repository:'RosevearCreations/rosiedazzlers',
 mode:'watch',challenge:'A'.repeat(43),issued_at:iso(now),run_id:'12345'};
const sig=sign(null,Buffer.from(JSON.stringify(proof)),privateKey).toString('base64url');
assert.equal(await verifyEnrollmentProof882(proof,sig,jwk,now),true);
assert.equal(await verifyEnrollmentProof882({...proof,mode:'fake'},sig,jwk,now),false);
assert.equal(await verifyEnrollmentProof882({...proof,challenge:'B'.repeat(43)},sig,jwk,now),false);
assert.equal(await verifyEnrollmentProof882({...proof,issued_at:iso(now-600000)},sig,jwk,now),false);
assert.equal(await verifyEnrollmentProof882(proof,'A'.repeat(86),jwk,now),false);
const report={severity:'HIGH',coverage_incomplete:true,measures:{grace_expired:1}};
const digest=createHash('sha256').update(JSON.stringify(report)).digest('hex');
const issue={body:'<!-- rosie881-watch-state:'+JSON.stringify(report)+' -->\nReview owner alert'};
const ack={body:'ROSIE882-ACK: '+digest,user:{login:'RosevearCreations'},created_at:iso(now-1000)};
assert.equal(ownerAckState882(report,issue,[ack],now).state,'OWNER_ACK_READBACK_VERIFIED');
assert.equal(ownerAckState882(report,issue,[{...ack,user:{login:'other'}}],now).state,'OWNER_ACK_PENDING_HOLD');
assert.equal(ownerAckState882(report,issue,[{...ack,created_at:iso(now-8*86400000)}],now).state,'OWNER_ACK_PENDING_HOLD');
assert.equal(ownerAckState882({...report,severity:'CRITICAL'},issue,[ack],now).state,'ORIGINAL_WATCH_SNAPSHOT_DRIFT_HOLD');
const payload={schema:'rosie881-independent-rotation-receipt-anchor-v1',
 receipt_sha256:hex('a'),anchor_public_key_id:keyId881(jwk),anchored_at:iso(now)};
const signature=sign(null,Buffer.from(JSON.stringify(payload)),privateKey).toString('base64url');
const comment={body:anchorComment881(payload,signature)};
const source={ok:true,build:881,no_customer_identifiers:true,no_proof_of_actual_key_change:true,
 receipt_digests:[hex('a')],receipt_count:1,external_witness_public_jwk:jwk};
assert.equal(reconcileExternalAnchors882(source,[comment]).count,1);
assert.throws(()=>reconcileExternalAnchors882(source,[]),/GAP/);
assert.throws(()=>reconcileExternalAnchors882(source,[comment,comment]),/DUPLICATE/);
assert.throws(()=>reconcileExternalAnchors882({...source,receipt_count:0},[comment]),/INVENTORY/);
assert.throws(()=>reconcileExternalAnchors882({...source,receipt_digests:[],receipt_count:0},[]),/NO_ORIGINAL/);
assert.throws(()=>reconcileExternalAnchors882(source,[{body:comment.body.replace('Metadata-only','Changed')}]),/READBACK|SIGNATURE|GAP/);
for(const path of ['.github/workflows/rosie882-protected-source.yml','.github/workflows/rosie882-signed-enrollment-watch.yml']){
 const w=readFileSync(path,'utf8');assert(w.includes('workflow_dispatch:'));
}
console.log('Rosie 882 signed challenge, exact anchors and owner ACK continuity: PASS');
