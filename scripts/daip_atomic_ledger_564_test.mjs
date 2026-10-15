import assert from 'node:assert/strict';
import {createAtomicAcceptanceLedger564,inspectProviderEnvironment564} from '../assets/daip-atomic-ledger-564.js';
const ids=['11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','33333333-3333-4333-8333-333333333333'];
const cfg={url:'https://example.supabase.co',serviceRoleKey:'mock-test-service-role-key-not-real',authority:'server-owner-564'};
assert.equal(createAtomicAcceptanceLedger564({...cfg,serviceRoleKey:''}),null);
let calls=0;
const adapter=createAtomicAcceptanceLedger564({...cfg,fetchImpl:async (url,opts)=>{
 calls++;assert.match(url,/\/rpc\/daip_acceptance_insert_if_absent$/);
 assert.equal(opts.method,'POST');return {ok:true,json:async()=>[{outcome:calls===1?'inserted':'existing',identity_matches:true,digest_matches:true}]};
}});
const x={project_id:ids[0],asset_id:ids[1],derivative_id:ids[2],evidence_digest:'sha256-acceptance-12345',worker_receipt_digest:'sha256-worker-123456',consent_document_digest:'sha256-consent-12345'};
assert.equal((await adapter.insertIfAbsent(x)).outcome,'inserted');
assert.equal((await adapter.insertIfAbsent(x)).outcome,'existing');
await assert.rejects(adapter.insertIfAbsent({...x,project_id:'../../other'}));
assert.equal(inspectProviderEnvironment564({}).configured,false);
assert.equal(inspectProviderEnvironment564({}).credentials_disclosed,false);
console.log('BUILD 564 ATOMIC LEDGER ADAPTER PASS');
