import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,sign} from 'node:crypto';
import {certifyOriginalClosure887} from '../functions/api/_lib/roadside-certification-v887.js';
import {auditComment885,renewalComment885} from '../functions/api/_lib/roadside-audit-v885.js';
import {digest883} from '../functions/api/_lib/roadside-custody-v883.js';
const {privateKey,publicKey}=generateKeyPairSync('ed25519');
const pin=publicKey.export({format:'jwk'});
const now=Date.parse('2026-11-14T12:00:00Z'),sha='a'.repeat(64);
const signPayload=p=>sign(null,Buffer.from(JSON.stringify(p)),privateKey).toString('base64url');
const mkAudit=(hours,id,overrides={})=>{
 const payload={schema:'rosie885-original-continuity-audit-v1',
  repository:'RosevearCreations/rosiedazzlers',run_id:String(id),
  chain_state:'INDEPENDENT_RETENTION_CHAIN_VERIFIED',latest_checkpoint_sha256:sha,
  verified_checkpoints:1,original_step_receipts:1,
  sla:{'4h':'VERIFIED','24h':'VERIFIED','7d':'VERIFIED','30d':'VERIFIED'},
  recorded_at:new Date(now-hours*3600000).toISOString(),
  original_vendor_delivery_not_inferred:true,not_worm_or_lifetime_archive:true,
  ...overrides};
 return {id,user:{login:'github-actions[bot]'},body:auditComment885(payload,signPayload(payload))};
};
const audits=[mkAudit(31*24,1),mkAudit(7*24,2),mkAudit(24,3),mkAudit(4,4),mkAudit(0,5)];
async function owner(audit=audits.at(-1),overrides={}){
 const payload={schema:'rosie885-original-owner-closure-renewal-v1',
  repository:'RosevearCreations/rosiedazzlers',owner_comment_id:123,closure_issue_number:124,
  checkpoint_sha256:sha,audit_sha256:await digest883(audit.body),
  previous_renewal_sha256:null,recorded_at:new Date(now).toISOString(),
  owner_actor:'RosevearCreations',owner_gate_verified:true,
  no_original_vendor_or_financial_clearance_claim:true,...overrides};
 return {id:90,user:{login:'github-actions[bot]'},
  body:renewalComment885(payload,signPayload(payload))};
}
const opts=async()=>({auditComments:audits,renewalComments:[await owner()],pin,
 sourceInventoryComplete:true,renewalInventoryComplete:true,
 sourceSchedulerRunsVerified:true,originalClosureApproved:true,now});
test('signed mature complete evidence certifies, without inferring operational GREEN',async()=>{
 const r=await certifyOriginalClosure887(await opts());
 assert.equal(r.state,'CERTIFIED');assert.equal(r.operational_green_inferred,false);
});
test('missing inventory is HOLD',async()=>{
 const r=await certifyOriginalClosure887({...await opts(),sourceInventoryComplete:false});
 assert.equal(r.state,'HOLD');
});
test('unauthenticated forged audit is HOLD',async()=>{
 const x=await opts();x.auditComments=[...audits.slice(0,-1),{...audits.at(-1),body:audits.at(-1).body+'x'}];
 assert.match((await certifyOriginalClosure887(x)).reasons.join(),/SIGNATURE/);
});
test('duplicate original run is HOLD',async()=>{
 const x=await opts();x.auditComments=[...audits,{...mkAudit(1,5),id:6}];
 assert.match((await certifyOriginalClosure887(x)).reasons.join(),/DUPLICATE/);
});
test('immature 30d horizon is HOLD',async()=>{
 const x=await opts();x.auditComments=[mkAudit(1,5)];
 assert.equal((await certifyOriginalClosure887(x)).state,'HOLD');
});
test('missing source scheduler proof is HOLD',async()=>{
 const x=await opts();x.sourceSchedulerRunsVerified=false;
 assert.match((await certifyOriginalClosure887(x)).reasons.join(),/SCHEDULER_RUN/);
});
test('owner permission never inferred',async()=>{
 const x=await opts();x.originalClosureApproved=false;
 assert.match((await certifyOriginalClosure887(x)).reasons.join(),/OWNER_CLOSURE/);
});
test('owner renewal from another audit is HOLD',async()=>{
 const x=await opts();x.renewalComments=[await owner(audits[2])];
 assert.match((await certifyOriginalClosure887(x)).reasons.join(),/RENEWAL/);
});
test('missing signed owner renewal is HOLD',async()=>{
 const x=await opts();x.renewalComments=[];
 assert.equal((await certifyOriginalClosure887(x)).state,'HOLD');
});
test('tampered owner renewal is HOLD',async()=>{
 const x=await opts();x.renewalComments=[{...x.renewalComments[0],body:x.renewalComments[0].body+'tamper'}];
 assert.match((await certifyOriginalClosure887(x)).reasons.join(),/SIGNATURE/);
});
