import assert from 'node:assert/strict';
import {recoveryCustody850,crossPlatformRecall850,receiverPilotDecision850,MASTER_CONTRACT_850} from '../functions/api/_lib/jobday-custody-850.js';
const h=recoveryCustody850([],{revoked:true});assert.equal(h.decision,'HOLD');assert.ok(h.reasons.includes('INDEPENDENT_PROVIDER_REMOVAL_UNVERIFIED'));
assert.equal(recoveryCustody850(Array(200).fill({})).decision,'HOLD');
assert.equal(crossPlatformRecall850([]).decision,'HOLD');
assert.equal(crossPlatformRecall850([{platform:'facebook',decision:'SCOPED_REVIEW_ONLY'}],{expectedPlatforms:['facebook','instagram']}).decision,'HOLD');
assert.equal(crossPlatformRecall850([{platform:'facebook',decision:'SCOPED_REVIEW_ONLY'}],{expectedPlatforms:['facebook']}).decision,'SCOPED_REVIEW_ONLY');
const revision='a'.repeat(40),now=Date.now();
const ack={source_revision:revision,source_contract:MASTER_CONTRACT_850,consumer_id:'ai-data-platform',owner_case_reference:'pilot-850',independent_signature_verified:true,durable_replay_verified:true,receiver_audience_verified:true,observed_at:new Date(now).toISOString()};
for(const candidate of [ack,{...ack,observed_at:new Date(now-3600000).toISOString()},{...ack,source_revision:'b'.repeat(40)}]){
 const result=receiverPilotDecision850({sourceRevision:revision,ack:candidate,expectedCase:'pilot-850',now,custody:{decision:'SCOPED_REVIEW_ONLY'},crossPlatform:{decision:'SCOPED_REVIEW_ONLY'}});
 assert.equal(result.decision,'HOLD');assert.equal(result.master_connection,'HOLD');assert.equal(result.receiver_pilot_accepted,false);
}
console.log('Rosie 850 fail-closed custody, platform and receiver pilot checks passed');
