import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {CONTRACT_856,WITNESS_KIND_856,canonicalWitness856} from '../functions/api/_lib/jobday-delivery-856.js';
import {CONTRACT_857,revalidateHistoricCustody857,conflictAging857,
 revalidationDigest857,ownerAcceptance857,readbackDigest857}
 from '../functions/api/_lib/jobday-custody-857.js';
const crypto=globalThis.crypto||webcrypto;
const b64=b=>Buffer.from(b).toString('base64url');
const make=()=>crypto.subtle.generateKey('Ed25519',true,['sign','verify']);
const pub=async k=>b64(await crypto.subtle.exportKey('raw',k.publicKey));
const sign=async(k,r)=>b64(await crypto.subtle.sign('Ed25519',k.privateKey,
 new TextEncoder().encode(canonicalWitness856(r))));
const ks=await Promise.all(Array.from({length:8},make)),env={
 CF_PAGES_COMMIT_SHA:'b'.repeat(40),
 ROSIE_AIDATA_DELIVERY_WITNESS_ED25519_PUBLIC_KEY_856:await pub(ks[0]),
 ROSIE_COMMS_DELIVERY_WITNESS_ED25519_PUBLIC_KEY_856:await pub(ks[1])};
const pins=['ROSIE_AIDATA_TX_REPLAY_ED25519_PUBLIC_KEY_855','ROSIE_COMMS_TX_REPLAY_ED25519_PUBLIC_KEY_855',
 'ROSIE_AIDATA_INCIDENT_RESPONSE_ED25519_PUBLIC_KEY_854','ROSIE_AIDATA_REPLAY_LEDGER_ED25519_PUBLIC_KEY_853',
 'ROSIE_AIDATA_CONSUMER_DECISION_ED25519_PUBLIC_KEY_852','ROSIE_ORIGINAL_DEVICE_WITNESS_ED25519_PUBLIC_KEY_851'];
for(let i=0;i<pins.length;i++)env[pins[i]]=await pub(ks[i+2]);
const now=Date.now(),iso=n=>new Date(n).toISOString();
const booking='11111111-1111-4111-8111-111111111111',project='22222222-2222-4222-8222-222222222222';
const post={id:'33333333-3333-4333-8333-333333333333',platform:'instagram'};
const caseId='original857case',incident='original857incident',txref='originaltransaction857';
const tx={id:'44444444-4444-4444-8444-444444444444',project_id:project,booking_id:booking,post_id:post.id,
 case_reference:caseId,incident_reference:incident,transaction_reference:txref,
 source_revision:'a'.repeat(40),ai_data_sha256:'a'.repeat(64),comms_sha256:'b'.repeat(64),
 ai_data_nonce:'originalAiDataTransactionNonce857',comms_nonce:'originalCommsTransactionNonce857',
 recorded_at:iso(now-120000)};
const initialTime=now-45000,oldRevision='d'.repeat(40);
const base={version:1,kind:WITNESS_KIND_856,source_id:'rosiedazzlers',
 source_contract:CONTRACT_856,source_revision:oldRevision,
 booking_id:booking,project_id:project,post_id:post.id,case_reference:caseId,
 incident_reference:incident,transaction_reference:txref,prior_855_review_id:tx.id,
 receiver_claim:'signed_receiver_observation_review_only',
 disposition:'delivery_evidence_hold',permissions:'review_only_no_delivery_grant',
 issued_at:iso(initialTime-25000),observed_at:iso(initialTime-15000),
 expires_at:iso(initialTime+120000)};
const ai={...base,plane:'ai-data-platform',prior_855_plane_sha256:tx.ai_data_sha256,
 prior_855_plane_nonce:tx.ai_data_nonce,delivery_receipt_reference:'originalAiReceipt857test',
 nonce:'independentAiCustody857123456789',signer_id:'independent-ai-857-signer'};
const comms={...base,plane:'rosevear-comms-hub',prior_855_plane_sha256:tx.comms_sha256,
 prior_855_plane_nonce:tx.comms_nonce,delivery_receipt_reference:'originalCommsReceipt857test',
 nonce:'independentCommsCustody857123456',signer_id:'independent-comms-857-signer'};
const sha=async s=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',
 new TextEncoder().encode(s)))].map(x=>x.toString(16).padStart(2,'0')).join('');
const witness=(plane,r,id)=>({id,kind:'signed_delivery_hold_witness',plane,
 transaction_review_id:tx.id,project_id:project,booking_id:booking,post_id:post.id,
 case_reference:caseId,incident_reference:incident,transaction_reference:txref,
 prior_855_sha256:plane==='ai-data-platform'?tx.ai_data_sha256:tx.comms_sha256,
 source_revision:oldRevision,evidence_sha256:'',evidence_nonce:r.nonce,
 delivery_receipt_reference:r.delivery_receipt_reference,witness_observed_at:r.observed_at,
 recorded_at:iso(initialTime)});
const aWitness=witness('ai-data-platform',ai,'55555555-5555-4555-8555-555555555555');
aWitness.evidence_sha256=await sha(canonicalWitness856(ai));
const cWitness=witness('rosevear-comms-hub',comms,'66666666-6666-4666-8666-666666666666');
cWitness.evidence_sha256=await sha(canonicalWitness856(comms));
const ctx={transaction:tx,bookingId:booking,projectId:project,post,caseReference:caseId,
 incidentReference:incident,actor:'originalowner@rosie.ca'};
const [aSig,cSig]=await Promise.all([sign(ks[0],ai),sign(ks[1],comms)]);
const a=await revalidateHistoricCustody857(env,ai,aSig,{...ctx,plane:'ai-data-platform',witness:aWitness});
const c=await revalidateHistoricCustody857(env,comms,cSig,{...ctx,plane:'rosevear-comms-hub',witness:cWitness});
assert.equal(a.ok,true,JSON.stringify(a));assert.equal(c.ok,true,JSON.stringify(c));
assert.equal(a.historical_signature_revalidated,true);
assert.equal(a.verified_fresh_live_receiver_ack,false);
assert.equal(a.master_connection,'HOLD');
const test=(r,s,w=aWitness,plane='ai-data-platform',e=env)=>
 revalidateHistoricCustody857(e,r,s,{...ctx,plane,witness:w});
assert.equal((await test({...ai,source_revision:env.CF_PAGES_COMMIT_SHA},aSig)).ok,false);
assert.equal((await test({...ai,disposition:'CONNECTED'},aSig)).ok,false);
assert.equal((await test({...ai,nonce:'anotherNonce8571234567890'},aSig)).ok,false);
assert.equal((await test({...ai,observed_at:iso(initialTime-5000)},aSig)).ok,false);
assert.equal((await test(ai,cSig)).ok,false);
assert.equal((await test(ai,aSig,{...aWitness,evidence_sha256:'c'.repeat(64)})).ok,false);
assert.equal((await test(ai,aSig,{...aWitness,recorded_at:iso(initialTime+3600000)})).ok,false);
assert.equal((await test(ai,aSig,{...aWitness,source_revision:'e'.repeat(40)})).ok,false);
assert.equal((await test(ai,aSig,{...aWitness,project_id:booking})).ok,false);
assert.equal((await test(ai,aSig,aWitness,'rosevear-comms-hub')).ok,false);
assert.equal((await test(ai,aSig,aWitness,'ai-data-platform',{...env,
 ROSIE_AIDATA_DELIVERY_WITNESS_ED25519_PUBLIC_KEY_856:env.ROSIE_COMMS_DELIVERY_WITNESS_ED25519_PUBLIC_KEY_856})).ok,false);
const noConflict=conflictAging857({conflicts:[],priority:'HIGH',now});
assert.equal(noConflict.conflict_aging_status,'NO_CONFLICTS_RECORDED');
const conflict={recorded_at:iso(now-7*3600000)},low=conflictAging857({conflicts:[conflict],priority:'HIGH',now}),
 high=conflictAging857({conflicts:[conflict],priority:'CRITICAL',now});
assert.equal(low.conflict_aging_status,'OPEN_WITHIN_TARGET');
assert.equal(high.conflict_aging_status,'OPEN_ESCALATION_DUE');
assert.equal(high.open_conflict_count,1);
assert.equal(high.independent_master_remediation_verified,false);
assert.equal(conflictAging857({conflicts:[{recorded_at:'bad'}],priority:'HIGH',now}).decision,'HOLD');
assert.equal(conflictAging857({conflicts:[],priority:'UNKNOWN',now}).decision,'HOLD');
assert.equal(conflictAging857({conflicts:Array.from({length:81},()=>conflict),priority:'HIGH',now}).decision,'HOLD');
const ar=await revalidationDigest857({transaction:tx,witness:aWitness,plane:'ai-data-platform',
 nonce:'ownerIndependentReviewNonce857Ai1234',aging:high});
const cr=await revalidationDigest857({transaction:tx,witness:cWitness,plane:'rosevear-comms-hub',
 nonce:'ownerIndependentReviewNonce857Co1234',aging:high});
assert.notEqual(ar,cr);
const rows=[
 {kind:'historical_witness_revalidation',plane:'ai-data-platform',
 transaction_review_id:tx.id,witness_856_id:aWitness.id,
 prior_witness_sha256:aWitness.evidence_sha256,review_digest_sha256:ar},
 {kind:'historical_witness_revalidation',plane:'rosevear-comms-hub',
 transaction_review_id:tx.id,witness_856_id:cWitness.id,
 prior_witness_sha256:cWitness.evidence_sha256,review_digest_sha256:cr}
];
const read=ownerAcceptance857({transaction:tx,revalidations:rows,aging:high,ownerAction:'escalate_unresolved_conflicts'});
assert.equal(read.decision,'OWNER_MASTER_ACCEPTANCE_READBACK_HOLD_ONLY');
assert.equal(read.master_connection,'HOLD');
assert.equal(read.owner_operational_incident_closed,false);
assert.equal(ownerAcceptance857({transaction:tx,revalidations:rows.slice(0,1),aging:high,ownerAction:'maintain_external_hold'}).decision,'HOLD');
assert.equal(ownerAcceptance857({transaction:tx,revalidations:rows,aging:noConflict,ownerAction:'escalate_unresolved_conflicts'}).decision,'HOLD');
assert.equal(ownerAcceptance857({transaction:tx,revalidations:rows,aging:high,ownerAction:'approve_connected'}).decision,'HOLD');
const nonce='originalOwnerAcceptanceReadback857Nonce';
const d=await readbackDigest857({transaction:tx,revalidations:rows,aging:high,
 action:'escalate_unresolved_conflicts',nonce});
const reverse=await readbackDigest857({transaction:tx,revalidations:[...rows].reverse(),aging:high,
 action:'escalate_unresolved_conflicts',nonce});
assert.equal(d,reverse);
await assert.rejects(()=>readbackDigest857({transaction:tx,revalidations:rows.slice(0,1),aging:high,
 action:'maintain_external_hold',nonce}));
console.log('Rosie 857 historical Ed25519 custody, bounded escalation aging and original owner Master HOLD readback PASS');
