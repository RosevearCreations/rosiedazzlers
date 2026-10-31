import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fixtureFor730 as fx} from './build729_signed_comparison_continuity_test.mjs';
import {recoverLocalComparison730} from '../assets/quote-followup-recovery-v730.mjs';
import {EVIDENCE_KINDS731,localAgeBand731,overviewEvidenceItem731} from
  '../assets/quote-followup-overview-v731.mjs';
import {onRequestPost} from '../functions/api/admin/quote_followup_rebalance.js';

const {f,env,at,witnessId,gapId,owner,witness,gap,oa,ob,wa,wb,ga,gb,
  queue,audit,recheck,ownerA,ownerB,witnessA,witnessB,gapA,gapB}=fx;
assert.equal(Object.keys(EVIDENCE_KINDS731).length,24);
assert.deepEqual(Object.values(EVIDENCE_KINDS731).reduce((out,d)=>{
  out[d.scope]=(out[d.scope]||0)+1;return out;
},{}),{nonproduction:8,witness:8,owner:8});
for(const [age,code,rank] of [[0,'under24',0],[23,'under24',0],[24,'24h',1],
  [71,'24h',1],[72,'72h',2],[167,'72h',2],[168,'168h',3],[999,'168h',3]]){
  const band=localAgeBand731(age);assert.equal(band.code,code);assert.equal(band.rank,rank);
}
assert.equal(localAgeBand731(-1),null);
assert.equal(localAgeBand731(12.5),null);

const policy={review_note:'Original comparison sources checked. Independent approval remains HELD.',
  acknowledge_local_recovery_only:true};
const specs=[
  ['owner',f.owner,owner,oa,ob,queue,ownerA,ownerB],
  ['witness',witnessId,witness,wa,wb,audit,witnessA,witnessB],
  ['nonproduction',gapId,gap,ga,gb,recheck,gapA,gapB]];
const originals=[];
for(const [scope,id,comparison,before,after,source,rawBefore,rawAfter] of specs){
  const signedComparison=await f.verify(comparison,comparison.kind,729);
  const summary=recoverLocalComparison730(scope,signedComparison,before,after,source,
    f.actor(id),env,policy,at(95));
  assert.ok(summary);
  const verified=await f.verify(summary,summary.kind,730);
  assert.ok(verified.ok,`${scope} summary verification rejected`);
  const item=overviewEvidenceItem731(verified,at(100));
  assert.ok(item);
  assert.equal(item.scope,scope);
  assert.equal(item.build,730);
  assert.equal(item.receipt_sha256,verified.receipt_sha256);
  assert.equal(item.source_hashes.signed_comparison_sha256,signedComparison.receipt_sha256);
  assert.equal(item.source_hashes.signed_before_sha256,before.receipt_sha256);
  assert.equal(item.proof_b_authorized,false);
  assert.equal(item.external_evidence_approved,false);
  assert.equal(item.age_band,'under24');
  assert.ok(item.outstanding_action.length>20);
  if(scope==='owner'){
    assert.equal(item.recorded_local_queue_age_hours,0);
    assert.equal(item.recorded_local_review_window_hours,24);
  }
  if(scope==='nonproduction')assert.equal(item.unresolved_gap_codes.length,5);
  assert.equal(overviewEvidenceItem731({...verified,receipt:{...verified.receipt,
    proof_b_authorized:true}},at(100)),null);
  assert.equal(overviewEvidenceItem731({...verified,receipt:{...verified.receipt,
    external_message_sent:true}},at(100)),null);
  assert.equal(overviewEvidenceItem731({...verified,receipt:{...verified.receipt,
    status:'APPROVED GREEN'}},at(100)),null);
  assert.equal(overviewEvidenceItem731(verified,at(100+31*86400)),null);
  originals.push({scope,id,receipt:summary,rawBefore,rawAfter,comparison,source});
}
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
  const selected=await Promise.all(originals.flatMap(item=>[
    f.sign(item.receipt),f.sign(item.comparison),f.sign(item.rawBefore)]));
  const body={action:'review_owner_evidence_overview',signed_receipts:selected};
  const accepted=await onRequestPost({request:request(f.owner,body),env:apiEnv});
  assert.equal(accepted.status,200,JSON.stringify(await accepted.clone().json()));
  const output=await accepted.json();
  assert.equal(output.items.length,9);
  assert.equal(output.external_evidence_approved,false);
  assert.equal(output.proof_b_authorized,false);
  assert.ok(output.items.every(x=>x.receipt_sha256&&x.source_hashes));
  assert.deepEqual(output.items.map(x=>x.age_rank),[...output.items.map(x=>x.age_rank)]
    .sort((a,b)=>b-a));
  const duplicates=await onRequestPost({request:request(f.owner,{...body,
    signed_receipts:[selected[0],selected[0]]}),env:apiEnv});
  assert.equal(duplicates.status,409);
  const tampered=await onRequestPost({request:request(f.owner,{...body,
    signed_receipts:[{...selected[0],signature_base64:'AAAA'}]}),env:apiEnv});
  assert.equal(tampered.status,409);
  const wrongScope=await onRequestPost({request:request(f.owner,{...body,
    signed_receipts:[await f.sign({...originals[0].receipt,kind:'unknown'})]}),env:apiEnv});
  assert.equal(wrongScope.status,409);
  const oversized=await onRequestPost({request:request(f.owner,{...body,
    signed_receipts:Array(25).fill(selected[0])}),env:apiEnv});
  assert.equal(oversized.status,400);
  assert.ok(reads>=4);assert.equal(writes,0);
}finally{globalThis.fetch=originalFetch;}

const root=resolve(import.meta.dirname,'..'),read=p=>readFileSync(resolve(root,p),'utf8');
const html=read('admin-followup-workload.html');
assert.equal(html,read('admin-followup-workload/index.html'));
for(const id of ['overviewTitle731','overviewFiles731','overviewVerify731','overviewScope731',
  'overviewAging731','overviewExport731','overviewResults731','overviewStatus731',
  'advancedOwner731','advancedWitness731','advancedNonproduction731','advancedRecovery731'])
  assert.match(html,new RegExp(`id="${id}"`));
for(const id of ['ledgerExecutionReview723','witnessIdentityReview723','ledgerPurgeReview724',
  'ledgerDeltaReview729','witnessContinuityReview729','trialDriftReview729',
  'recoverySign730'])assert.match(html,new RegExp(`id="${id}"`));
const js=read('assets/admin-followup-workload-v713.js');
const originalPanels=[...html.matchAll(/<details class="rd-v72[3-9]-panel"><summary>/g)];
assert.equal(originalPanels.length,21);
const lanes={owner:0,witness:0,nonproduction:0};
for(const match of originalPanels){
  const excerpt=html.slice(match.index,html.indexOf('<details ',match.index+10));
  const first=excerpt.match(/<label for="([^"]+)"/);
  assert.ok(first,`Missing direct input in original advanced panel at ${match.index}`);
  const id=first[1];
  const lane=id.startsWith('witness')?'witness':id.startsWith('trial')||
    ['ledgerDryRunReceipt723','ledgerExpiryReceipt724'].includes(id)?
    'nonproduction':'owner';
  lanes[lane]++;
}
assert.deepEqual(lanes,{owner:7,witness:7,nonproduction:7});
for(const functionName of ['simplifyEvidencePanels731','verifyOverview731',
  'renderOverview731','exportOverview731','advancedRecoveryItems731'])
  assert.match(js,new RegExp(functionName));
assert.match(js,/Array\.from\(\{length:7\}/);
assert.match(js,/appendChild\(panel\)/);
assert.match(js,/receipt_sha256/);
assert.doesNotMatch(js.slice(js.indexOf('// Build 731: preserve'),
  js.indexOf("$('workloadRefresh713').addEventListener")),/localStorage|sessionStorage|removeChild\(/);
assert.match(read('assets/admin-followup-workload-v731.css'),/:focus-visible/);
assert.match(read('assets/admin-followup-workload-v731.css'),/@media\(max-width:620px\)/);
assert.match(read('scripts/current_booking_wizard_regression.sh'),/build731_owner_evidence_workbench_test\.mjs/);
console.log('Build 731 PASS: 24 kind map, 24/72/168h aging, verified original hashes, preserved advanced actions, tamper/duplicate refusal and zero writes');
