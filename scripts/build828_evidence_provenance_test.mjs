import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {provenanceReport828,PROVENANCE_SCHEMA_828,SOURCE_LEDGER_828} from '../assets/build828-evidence-provenance.mjs';
import {onRequestGet} from '../functions/api/admin/worksite_field_evidence_v826.js';

const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
const now=Date.parse('2026-11-09T13:00:00.000Z');
const eventId=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');
const A='aa00dffd-194d-4cb1-84bd-50a95ab44e84';
const B='bb00dffd-194d-4cb1-84bd-50a95ab44e85';
const C='cc00dffd-194d-4cb1-84bd-50a95ab44e86';
const stamp=n=>new Date(now+n*60000).toISOString();
const obs=(id,offset=-50,role='customer',device='phone')=>({
  id:eventId(id),event_kind:'observation',actor_staff_user_id:A,
  role_id:role,device_class:device,browser_class:'chrome',
  observed_outcome:'pass',observed_at:stamp(offset-1),
  evidence_ref:'PHONE-OBS-20261109',recorded_at:stamp(offset)
});
const sign=(id,target,offset=-40,actor=B)=>({
  id:eventId(id),event_kind:'signoff',actor_staff_user_id:actor,
  target_event_id:eventId(target),review_state:'accepted_for_review',
  evidence_ref:'PHONE-REVIEW-20261109',recorded_at:stamp(offset)
});
const review=(id,target,offset=-30,state='owner_review_candidate',moduleId='customer-experience-mobile',actor=C)=>({
  id:eventId(id),event_kind:'module_review',actor_staff_user_id:actor,
  module_id:moduleId,target_event_id:target?eventId(target):null,
  review_state:state,evidence_ref:'MODULE-REVIEW-20261109',recorded_at:stamp(offset)
});
const get=(report,id='customer-experience-mobile')=>report.scopeTraces.find(x=>x.moduleId===id);
const happy=[review(3,2),sign(2,1),obs(1)];

const empty=provenanceReport828({events:[],sourceRevision:'wrong',now});
assert.equal(empty.schema,PROVENANCE_SCHEMA_828);
assert.equal(empty.sourceLedger,SOURCE_LEDGER_828);
assert.equal(empty.sourceId,'rosiedazzlers');
assert.equal(empty.scopeCount,45);
assert.equal(empty.currentReportReleaseSha,null);
assert.equal(empty.sourceHistoryIsComplete,false);
assert.equal(empty.connectionState,'DISCONNECTED / HOLD');
assert.equal(get(empty).latestChainStatus,'NO_RECENT_REVIEW');
assert.ok(empty.scopeTraces.every(x=>x.verifiedNumerator===null&&x.verifiedDenominator===null));
assert.equal(empty.completionPercent,null);
assert.equal(empty.dataSentToAIPlatform,false);
assert.equal(empty.dataSentToCommsHub,false);
assert.equal(empty.canonicalHoldChanged,false);
assert.equal(empty.reviewWindowPolicy.approved,false);
const linked=provenanceReport828({events:happy,now,sourceRevision:'a'.repeat(40)});
const mobile=get(linked);
assert.equal(linked.currentReportReleaseSha,'a'.repeat(40));
assert.equal(linked.historicalEventReleaseShaAvailable,false);
assert.equal(linked.localLinkedScopeCount,1);
assert.equal(mobile.latestChainStatus,'LOCAL_CHAIN_LINKED_UNVERIFIED');
assert.equal(mobile.latestDecision,'owner_review_candidate');
assert.equal(mobile.latestEvidenceFreshness,'DRAFT_WITHIN_REVIEW_WINDOW');
assert.equal(mobile.recentDecisions[0].signoffEventId,eventId(2));
assert.equal(mobile.recentDecisions[0].observationEventId,eventId(1));
assert.equal(mobile.recentDecisions[0].observedRole,'customer');
assert.equal(mobile.recentDecisions[0].observedDevice,'phone');
assert.equal(mobile.recentDecisions[0].eventReleaseRevision,null);
assert.equal(mobile.ownerApproved,false);
const pgTimestamp=provenanceReport828({events:happy.map(x=>({
  ...x,recorded_at:x.recorded_at.replace('.000Z','+00:00'),
  ...(x.observed_at?{observed_at:x.observed_at.replace('.000Z','.000000+00:00')}:{}),
})),now});
assert.equal(get(pgTimestamp).latestChainStatus,'LOCAL_CHAIN_LINKED_UNVERIFIED',
  'Real PostgREST timestamptz formatting must be accepted');
assert.equal(get(linked,'customer-experience-desktop').latestChainStatus,'NO_RECENT_REVIEW',
  'One device must not approve another');
for(const actor of [A,B,C])assert.equal(JSON.stringify(linked).includes(actor),false,'Staff identity must remain private');

const partial=provenanceReport828({events:[review(4,99)],now});
assert.equal(get(partial).latestChainStatus,'PARTIAL_RECENT_HISTORY');
assert.ok(get(partial).latestIssueCodes.includes('TARGET_OUTSIDE_RECENT_WINDOW'));
assert.equal(get(partial).latestEvidenceFreshness,'UNKNOWN');
const selfSign=provenanceReport828({events:[review(3,2),sign(2,1,-40,A),obs(1)],now});
assert.equal(get(selfSign).latestChainStatus,'CONFLICT');
assert.ok(get(selfSign).latestIssueCodes.includes('SIGNOFF_NOT_INDEPENDENT'));
const selfReview=provenanceReport828({events:[review(3,2,-30,'owner_review_candidate','customer-experience-mobile',B),sign(2,1),obs(1)],now});
assert.ok(get(selfReview).latestIssueCodes.includes('REVIEWER_NOT_INDEPENDENT'));
const mismatch=provenanceReport828({events:[review(3,2),sign(2,1),obs(1,-50,'detailer','tablet')],now});
assert.ok(get(mismatch).latestIssueCodes.includes('ROLE_DEVICE_SCOPE_MISMATCH'));
const wrongKind=provenanceReport828({events:[review(3,1),obs(1)],now});
assert.ok(get(wrongKind).latestIssueCodes.includes('TARGET_KIND_MISMATCH'));
const badChronology=provenanceReport828({events:[review(3,2,-60),sign(2,1,-40),obs(1,-50)],now});
assert.ok(get(badChronology).latestIssueCodes.includes('REVIEW_CHRONOLOGY_CONFLICT'));
const futureObservation=provenanceReport828({events:[review(3,2),sign(2,1),
  {...obs(1),observed_at:stamp(15)}],now});
assert.ok(get(futureObservation).latestIssueCodes.includes('OBSERVATION_TIME_CONFLICT'));
const old=n=>new Date(now-n*86400000).toISOString();
const stale=provenanceReport828({events:[
  {...review(3,2),recorded_at:old(35)},
  {...sign(2,1),recorded_at:old(36)},
  {...obs(1),recorded_at:old(37),observed_at:old(38)}
],now});
assert.equal(get(stale).latestEvidenceFreshness,'DRAFT_REVIEW_DUE');
assert.equal(stale.draftReviewDueCount,1);
assert.equal(stale.reviewWindowPolicy.use,'LOCAL_TRIAGE_ONLY_NOT_EXPIRY_OR_SCORE_AUTHORITY');
const reopened=provenanceReport828({events:[review(4,null,-1,'hold'),...happy],now});
assert.equal(get(reopened).latestDecision,'hold');
assert.equal(get(reopened).reopenAdvisory,true);
assert.equal(get(reopened).reopenIsInferredNotOwnerAuthorized,true);
assert.equal(get(reopened).latestChainStatus,'DECISION_ONLY_NO_APPROVED_CHAIN');
assert.equal(reopened.inferredReopenCount,1);
const duplicate=provenanceReport828({events:[review(3,2),review(3,2),sign(2,1),obs(1)],now});
assert.equal(get(duplicate).latestChainStatus,'CONFLICT');
assert.ok(get(duplicate).latestIssueCodes.includes('DUPLICATE_EVENT_ID'));
assert.equal(get(duplicate).recentDecisions[0].chainStatus,'CONFLICT');
const badRef=provenanceReport828({events:[{...review(3,2),evidence_ref:'customer@example.com'},sign(2,1),obs(1)],now});
assert.equal(get(badRef).recentDecisions[0].evidenceRef,null,'Unsafe human reference must not leak');
const capped=provenanceReport828({events:Array.from({length:101},(_,i)=>review(i+100,null,-i,'hold')),
  now});
assert.equal(capped.sourceWindowReturned,100);
assert.equal(capped.sourceWindowMayBeTruncated,true);
assert.equal(capped.sourceHistoryIsComplete,false);

// The private additive report inherits the same supervisor permission boundary.
let signed=false,role='detailer',allowed=true;
const realFetch=globalThis.fetch;
const env={SUPABASE_URL:'https://supabase-mock.invalid',SUPABASE_SERVICE_ROLE_KEY:'mock',
  CF_PAGES_COMMIT_SHA:'f'.repeat(40)};
const request=new Request('https://www.rosiedazzlers.ca/api/admin/worksite_field_evidence_v826',
  {headers:{Cookie:'rd_staff_session=token'}});
globalThis.fetch=async url=>{
  const path=new URL(url).pathname;
  if(path.endsWith('/staff_auth_sessions'))return Response.json(signed?[{
    expires_at:'2031-01-01T00:00:00Z',revoked_at:null,staff_user:{
      id:A,role_code:role,is_active:true,can_manage_bookings:true,
      permissions_profile:{action_access:{'operations.customer.manage':true,
        'operations.assignment.manage':allowed}}
    }}]:[]);
  if(path.endsWith('/rosie_field_acceptance_events_v826'))return Response.json(happy);
  throw Error('Unexpected source');
};
try{
  assert.equal((await onRequestGet({request,env})).status,401);
  signed=true;assert.equal((await onRequestGet({request,env})).status,403);
  role='operations_manager';allowed=false;assert.equal((await onRequestGet({request,env})).status,403);
  allowed=true;
  const res=await onRequestGet({request,env});assert.equal(res.status,200);
  const data=await res.json();
  assert.equal(data.requirement_provenance_preview.scopeCount,45);
  assert.equal(get(data.requirement_provenance_preview).latestChainStatus,'LOCAL_CHAIN_LINKED_UNVERIFIED');
  assert.equal(data.requirement_provenance_preview.currentReportReleaseSha,'f'.repeat(40));
  assert.equal(data.requirement_provenance_preview.dataSentToAIPlatform,false);
  assert.equal(data.source_authority.percentages_recalculated,false);
  assert.equal(JSON.stringify(data.requirement_provenance_preview).includes(A),false);
}finally{globalThis.fetch=realFetch;}

const page=read('../admin-handoff-acceptance.html');
assert.equal(page,read('../admin-handoff-acceptance/index.html'),'Mirrored supervisor routes must match');
for(const id of ['build828Provenance','build828Heading','build828Search','build828Filter',
  'build828Refresh','build828Status','build828Count','build828Rows'])
  assert.ok(page.includes('id="'+id+'"'),'Missing 828 UI control '+id);
assert.match(page,/build828-provenance-ui\.mjs\?v=build828/);
assert.match(read('../assets/build828-provenance.css'),/@media\(max-width:650px\)/);
assert.match(read('./current_booking_wizard_regression.sh'),/build828_evidence_provenance_test\.mjs/);
assert.match(read('../functions/api/admin/worksite_field_evidence_v826.js'),
  /requirement_provenance_preview:provenanceReport828/);
assert.doesNotMatch(read('../assets/build828-provenance-ui.mjs'),/localStorage|sessionStorage|POST|sendgrid|twilio|stripe/i);
console.log('Build 828 PASS: private bounded source lineage, distinct reviewer chain, device isolation, stale/reopen advisory, conflict/partial-history fail-closed, no score or trust promotion.');
