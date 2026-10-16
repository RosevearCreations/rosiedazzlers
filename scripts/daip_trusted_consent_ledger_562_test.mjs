import assert from 'node:assert/strict';
import {build562LedgerDecision as decide} from '../assets/daip-trusted-consent-ledger-562.js';
const p='11111111-1111-4111-8111-111111111111',a='22222222-2222-4222-8222-222222222222',d='33333333-3333-4333-8333-333333333333';
const scope={project_id:p,asset_id:a,derivative_id:d};
const worker={...scope,signature_verified_by_server:true,key_registered_by_server:true,key_id:'registered-key-01',receipt_digest:'sha256-worker001',worker_job_reference:'worker-job-562',verified_at:'2026-10-15T03:00:00Z'};
const consent={...scope,provider_verified_by_server:true,signature_verified_by_server:true,revoked:false,scope:'specific_derivative',document_digest:'sha256-consent001',provider_reference:'provider-001',verified_at:'2026-10-15T03:00:00Z',expires_at:'2026-10-18T00:00:00Z'};
const privateAcceptance={...scope,build:561,status:'private_derivative_technical_acceptance',public_release_allowed:false,supervisor_reference:'supervisor-001'};
const args={...scope,worker,consent,privateAcceptance,now:'2026-10-15T04:00:00Z'};
const good=decide(args);assert.equal(good.status,'private_ledger_candidate');assert.equal(good.db_written,false);assert.equal(good.public_release_allowed,false);
for(const changes of [{worker:{...worker,signature_verified_by_server:false}},{worker:{...worker,project_id:a}},{consent:{...consent,revoked:true}},{consent:{...consent,expires_at:'2026-10-14T00:00:00Z'}},{privateAcceptance:{...privateAcceptance,status:'hold'}},{previous:{...scope,status:'private_ledger_candidate'}}]){
 const bad=decide({...args,...changes});assert.equal(bad.status,'hold');assert.equal(bad.public_release_allowed,false);
}
console.log('BUILD 562 LEDGER GUARD PASS');
