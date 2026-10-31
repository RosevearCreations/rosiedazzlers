import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fixtureFor730 as fx} from './build729_signed_comparison_continuity_test.mjs';
import {RECOVERY_SCOPES730,recoverLocalComparison730} from
  '../assets/quote-followup-recovery-v730.mjs';
import {onRequestPost} from '../functions/api/admin/quote_followup_rebalance.js';

const {f,env,at,witnessId,gapId,owner,witness,gap,oa,ob,wa,wb,ga,gb,
  queue,audit,recheck,ownerA,ownerB,witnessA,witnessB,gapA,gapB}=fx;
const policy={review_note:'Local comparison verified. Independent evidence remains absent.',
  acknowledge_local_recovery_only:true};
const cases=[
  ['owner',f.owner,owner,oa,ob,queue,ownerA,ownerB],
  ['witness',witnessId,witness,wa,wb,audit,witnessA,witnessB],
  ['nonproduction',gapId,gap,ga,gb,recheck,gapA,gapB]];
const verifiedComparison=async receipt=>f.verify(receipt,receipt.kind,729);
const comparison=await Promise.all(cases.map(async item=>verifiedComparison(item[2])));
assert.ok(comparison.every(x=>x.ok));
assert.equal(Object.keys(RECOVERY_SCOPES730).length,3);
for(let i=0;i<cases.length;i++){
  const [scope,id,,before,after,source]=cases[i],c=comparison[i];
  const get=(...args)=>recoverLocalComparison730(scope,...args);
  const summary=get(c,before,after,source,f.actor(id),env,policy,at(90));
  assert.ok(summary,`${scope} receipt rejected`);
  assert.equal(summary.build,730);
  assert.equal(summary.timeline.length,3);
  assert.deepEqual(summary.timeline.map(r=>r.stage),
    ['Earlier local review','Later local review','Signed comparison']);
  assert.equal(summary.proof_b_authorized,false);
  assert.equal(summary.sql_executed,false);
  assert.equal(summary.external_message_sent,false);
  assert.equal(summary.actual_records_deleted,0);
  assert.match(summary.status,/HELD/);
  assert.equal(get(c,after,before,source,f.actor(id),env,policy,at(90)),null);
  assert.equal(get({...c,receipt:{...c.receipt,signed_before_sha256:f.digest('bad')}},
    before,after,source,f.actor(id),env,policy,at(90)),null);
  assert.equal(get({...c,receipt:{...c.receipt,external_message_sent:true}},
    before,after,source,f.actor(id),env,policy,at(90)),null);
  assert.equal(get(c,before,after,source,f.actor(f.execution),env,policy,at(90)),null);
  assert.equal(get(c,before,after,source,f.actor(id),env,
    {...policy,acknowledge_local_recovery_only:false},at(90)),null);
  assert.equal(get(c,before,after,source,f.actor(id),env,
    {...policy,review_note:'operator@example.com should approve'},at(90)),null);
  assert.equal(get(c,before,after,source,f.actor(id),env,policy,at(-400)),null);
  if(scope==='owner')assert.equal(summary.local_age_delta_hours,0);
  if(scope==='witness')assert.equal(summary.decision_changed,true);
  if(scope==='nonproduction')assert.equal(summary.unresolved_gap_codes.length,5);
}
assert.equal(recoverLocalComparison730('__proto__',...Array(8).fill({})),null);

const apiEnv={...env,SUPABASE_SERVICE_ROLE_KEY:'synthetic-fixture-only'};
const ids=[f.owner,witnessId,gapId];
const hashes=Object.fromEntries(ids.map(id=>[f.digest('fixture-'+id),id]));
const endpoint='https://rosiedazzlers.ca/api/admin/quote_followup_rebalance';
const request=(id,body)=>new Request(endpoint,{method:'POST',
  headers:{'Content-Type':'application/json',Cookie:'rd_staff_session=fixture-'+id},
  body:JSON.stringify(body)});
const originalFetch=globalThis.fetch;let reads=0,writes=0;
globalThis.fetch=async(input,options={})=>{
  if(options.method&&options.method!=='GET'){writes++;throw Error('Unexpected write');}
  reads++;
  const uri=new URL(String(input));
  if(!uri.pathname.endsWith('/staff_auth_sessions'))throw Error('Unexpected staff source');
  const id=hashes[(uri.searchParams.get('token_hash')||'').slice(3)];
  return Response.json(id?[{id:'fixture',staff_user_id:id,revoked_at:null,
    expires_at:new Date(Date.now()+86400000).toISOString(),
    staff_user:{id,role_code:'admin',is_active:true,can_manage_bookings:true}}]:[]);
};
try{
  for(let i=0;i<cases.length;i++){
    const [scope,id,comparisonReceipt,,,,before,after]=cases[i];
    const original=cases[i];
    const body={action:'recover_local_comparison_summary',scope,
      signed_comparison:await f.sign(comparisonReceipt),
      signed_before:await f.sign(before),signed_after:await f.sign(after),
      signed_source:await f.sign(original[5].receipt),...policy};
    const response=await onRequestPost({request:request(id,body),env:apiEnv});
    assert.equal(response.status,200,JSON.stringify(await response.clone().json()));
    const result=await response.json();
    assert.equal(result.receipt.timeline.length,3);
    assert.equal(result.receipt.proof_b_authorized,false);
    assert.equal(result.signed_receipt.signature_algorithm,'Ed25519');
    const wrong=await onRequestPost({request:request(id,{...body,
      signed_comparison:await f.sign({...comparisonReceipt,
        signed_before_sha256:f.digest('tampered semantic source')})}),env:apiEnv});
    assert.equal(wrong.status,409);
    const swap=await onRequestPost({request:request(id,{...body,
      signed_before:body.signed_after,signed_after:body.signed_before}),env:apiEnv});
    assert.equal(swap.status,409);
    const badSig=await onRequestPost({request:request(id,{...body,
      signed_comparison:{...body.signed_comparison,signature_base64:'AAAA'}}),env:apiEnv});
    assert.equal(badSig.status,409);
  }
  assert.ok(reads>=12);assert.equal(writes,0);
}finally{globalThis.fetch=originalFetch;}

const root=resolve(import.meta.dirname,'..');
const read=path=>readFileSync(resolve(root,path),'utf8');
const html=read('admin-followup-workload.html');
assert.equal(html,read('admin-followup-workload/index.html'));
for(const id of ['recoveryScope730','recoveryComparison730','recoveryBefore730',
  'recoveryAfter730','recoverySource730','recoveryNote730','recoveryLocalOnly730',
  'recoveryExport730','recoveryImport730','recoverySign730','recoveryClear730',
  'recoveryStatus730','recoveryTimeline730'])assert.match(html,new RegExp(`id="${id}"`));
const ui=read('assets/admin-followup-workload-v713.js');
for(const method of ['exportRecovery730','importRecovery730','recoveryFresh730',
  'signRecovery730','clearRecovery730'])assert.match(ui,new RegExp(method));
assert.doesNotMatch(ui.slice(ui.indexOf('const recoveryFiles730'),
  ui.indexOf("$('workloadRefresh713').addEventListener")),/localStorage|sessionStorage/);
assert.match(read('assets/admin-followup-workload-v730.css'),/:focus-visible/);
assert.match(read('scripts/current_booking_wizard_regression.sh'),/build730_owner_recovery_timeline_gaps_test\.mjs/);
console.log('Build 730 PASS: original signed 729/728/727 recovery, local timelines, unresolved gaps, role separation, tamper rejection, zero writes');
