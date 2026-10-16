import assert from 'node:assert/strict';
import {reviewSignedDerivative561} from '../assets/daip-signed-release-561.js';
const p='11111111-1111-4111-8111-111111111111',a='22222222-2222-4222-8222-222222222222',d='33333333-3333-4333-8333-333333333333',now='2026-10-15T04:00:00Z';
const operatorReview={build:560,operator_provenance_complete:true,operator_privacy_review_complete:true,operator_consent_review_complete:true,private_derivative_present:true};
const receipt={project_id:p,asset_id:a,derivative_id:d,worker_job_reference:'worker-job-561',source_checksum_reference:'sha256-src561',output_checksum_reference:'sha256-out561',finished_at:'2026-10-15T03:00:00Z',outcome:'succeeded',output_bytes:1024};
const canonical=JSON.stringify(receipt);
const keys=await crypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},true,['sign','verify']);
const pub=await crypto.subtle.exportKey('jwk',keys.publicKey);
const signed=new Uint8Array(await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},keys.privateKey,new TextEncoder().encode(canonical)));
const signature=Buffer.from(signed).toString('base64url');
const consentEvidence={project_id:p,asset_id:a,derivative_id:d,signature_verified_by_trusted_service:true,revoked:false,expired:false,checked_at:'2026-10-15T03:00:00Z',authority_reference:'consent-service-561'};
const supervisor={reviewer_reference:'inspector-561',approval_reference:'approval-561',reviewed_at:'2026-10-15T03:30:00Z',privacy_check_passed:true,derivative_inspection_passed:true,decision:'approve_private_acceptance'};
const args={project_id:p,asset_id:a,derivative_id:d,operatorReview,workerReceipt:receipt,workerSignature:signature,trustedPublicKey:pub,consentEvidence,supervisor,now};
const good=await reviewSignedDerivative561(args);
assert.equal(good.worker_signature_verified,true);assert.equal(good.status,'private_derivative_technical_acceptance');
assert.equal(good.public_release_allowed,false);assert.equal(good.canonical_publication_hold_closed,false);
for(const x of [{workerSignature:'bad'},{workerReceipt:{...receipt,output_bytes:2048}},{consentEvidence:{...consentEvidence,revoked:true}},{supervisor:{...supervisor,decision:'reject'}},{trustedPublicKey:null}]){
 const bad=await reviewSignedDerivative561({...args,...x});assert.equal(bad.status,'signed_evidence_acceptance_hold');assert.equal(bad.public_release_allowed,false);
}
console.log('BUILD 561 SIGNED PRIVATE ACCEPTANCE PASS');
