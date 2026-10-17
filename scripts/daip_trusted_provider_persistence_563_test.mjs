import assert from 'node:assert/strict';
import {reconcilePrivateAcceptance563 as run} from '../assets/daip-trusted-provider-persistence-563.js';
const scope={project_id:'11111111-1111-4111-8111-111111111111',asset_id:'22222222-2222-4222-8222-222222222222',derivative_id:'33333333-3333-4333-8333-333333333333'};
const worker={...scope,signature_verified_by_server:true,key_registered_by_server:true,key_id:'worker-key-01',receipt_digest:'digest-worker-123',worker_job_reference:'job-abc123',verified_at:'2026-10-15T03:00:00Z'};
const consent={...scope,provider_verified_by_server:true,signature_verified_by_server:true,revoked:false,scope:'specific_derivative',document_digest:'digest-consent-123',provider_reference:'provider-123',verified_at:'2026-10-15T03:00:00Z',expires_at:'2026-10-18T00:00:00Z'};
const privateAcceptance={...scope,build:561,status:'private_derivative_technical_acceptance',public_release_allowed:false,supervisor_reference:'supervisor-123'};
const args={scope,workerAdapter:{verify:async()=>worker},consentAdapter:{verify:async()=>consent},privateAcceptance,now:'2026-10-15T04:00:00Z'};
const good=await run({...args,ledger:{insertIfAbsent:async()=>({identity_matches:true,digest_matches:true,outcome:'inserted'})}});
assert.equal(good.ok,true);assert.equal(good.written,true);assert.equal(good.public_release_allowed,false);
const repeat=await run({...args,ledger:{insertIfAbsent:async()=>({identity_matches:true,digest_matches:true,outcome:'existing'})}});
assert.equal(repeat.ok,true);assert.equal(repeat.idempotent,true);
for(const patch of [{workerAdapter:null},{consentAdapter:{verify:async()=>({...consent,revoked:true})}},{ledger:{insertIfAbsent:async()=>({identity_matches:true,digest_matches:false,outcome:'existing'})}},{ledger:{insertIfAbsent:async()=>{throw Error('db unavailable')}}}]){
 const x=await run({...args,ledger:{insertIfAbsent:async()=>({identity_matches:true,digest_matches:true,outcome:'inserted'})},...patch});
 assert.equal(x.public_release_allowed,false);assert.equal(x.ok,false);
}
console.log('BUILD 563 TRUSTED ADAPTER AND IDEMPOTENCY PASS');
