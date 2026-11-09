import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {MODULE_BASELINE_825} from '../assets/build825-module-baseline.mjs';
import {MODULE_REQUIREMENT_SCOPES_827,draftRegistry827,REGISTRY_VERSION_827} from '../assets/build827-module-requirements.mjs';
import {onRequestGet} from '../functions/api/admin/worksite_field_evidence_v826.js';

const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
const draft=draftRegistry827();
assert.equal(draft.schema,REGISTRY_VERSION_827);
assert.equal(draft.sourceId,'rosiedazzlers');
assert.equal(draft.shellBoundary,'owned_business_shell');
assert.equal(draft.connectionState,'DISCONNECTED / HOLD');
assert.equal(draft.totalModules,45);
assert.equal(draft.scopeDrafts,45);
assert.equal(draft.distinctRequirementDrafts,39);
assert.equal(draft.scopes.length,MODULE_BASELINE_825.length);
assert.equal(draft.requirements.length,39);
assert.deepEqual(draft.scopes.map(x=>x.moduleId),MODULE_BASELINE_825.map(x=>x.id));
assert.equal(new Set(draft.scopes.map(x=>x.scopeId)).size,45);
assert.equal(new Set(draft.requirements.map(x=>x.requirementId)).size,39);
assert.ok(draft.scopes.every(x=>x.requirementId.startsWith('rd-req-v1-')&&
  x.scopeId==='rd-scope-v1-'+x.moduleId&&x.proposedCriterion.length>30&&
  x.status==='DRAFT_UNSCOPED'&&x.inScope===null&&x.weight===null&&
  x.ownerIdentity===null&&x.ownerApprovedAt===null&&x.scopeApproved===false&&
  x.evidenceRef===null&&x.evidenceURI===null&&x.freshness==='UNKNOWN'&&
  x.approvedNumerator===null&&x.approvedDenominator===null&&
  x.evidenceIsIndependent===false&&x.linkedLocalReview===null));
for(const prefix of ['customer-experience','worker-detailer','admin']){
  const rows=draft.scopes.filter(x=>x.capability===prefix);
  assert.equal(rows.length,3,'Every device scope must exist');
  assert.equal(new Set(rows.map(x=>x.requirementId)).size,1,'Shared criterion should deduplicate');
  assert.deepEqual(new Set(rows.map(x=>x.deviceVariant)),new Set(['desktop','phone','tablet']));
  assert.equal(new Set(rows.map(x=>x.scopeId)).size,3);
}
assert.equal(draft.approvedRequirementCount,0);
assert.equal(draft.approvedDenominator,null);
assert.equal(draft.approvedNumerator,null);
assert.equal(draft.approvedWeightSum,null);
assert.equal(draft.completionPercent,null);
assert.equal(draft.scoringAuthorized,false);
assert.equal(draft.masterOwnerApproved,false);
assert.equal(draft.dataSentToAIPlatform,false);
assert.equal(draft.dataSentToCommsHub,false);
assert.equal(draft.canonicalHoldChanged,false);
assert.ok(Object.isFrozen(MODULE_REQUIREMENT_SCOPES_827));
const review={id:'00000000-0000-4000-8000-000000000001',event_kind:'module_review',
  module_id:'customer-experience-mobile',review_state:'needs_evidence',
  evidence_ref:'FIELD-PHONE-20261109',recorded_at:'2026-11-09T10:00:00.000Z'};
const linked=draftRegistry827({events:[review]});
const mobile=linked.scopes.find(x=>x.moduleId===review.module_id);
assert.equal(mobile.linkedLocalReview.eventId,review.id);
assert.equal(mobile.linkedLocalReview.evidenceRef,review.evidence_ref);
assert.equal(mobile.linkedLocalReview.provenance,'LOCAL_OPERATOR_REPORTED_UNVERIFIED');
assert.equal(mobile.weight,null);
assert.equal(mobile.approvedDenominator,null);
assert.equal(linked.completionPercent,null);
assert.equal(linked.evidenceVerified,false);
assert.equal(linked.scopes.find(x=>x.moduleId==='customer-experience-desktop').linkedLocalReview,null,
  'Evidence from one device cannot imply another device has been observed');
const bad=draftRegistry827({events:[
  {...review,id:'not-an-id'},
  {...review,module_id:'other-source'},
  {...review,evidence_ref:'customer@example.com'},
  {...review,event_kind:'observation'},
]});
assert.ok(bad.scopes.every(x=>x.linkedLocalReview===null));

// The registry is only published within an existing signed supervisor GET.
let signed=false,role='detailer',allowed=true;
const sourceRows=[review];
const savedFetch=globalThis.fetch;
const env={SUPABASE_URL:'https://supabase-test.invalid',SUPABASE_SERVICE_ROLE_KEY:'test'};
const request=new Request('https://www.rosiedazzlers.ca/api/admin/worksite_field_evidence_v826',
  {headers:{Cookie:'rd_staff_session=test'}});
globalThis.fetch=async(url)=>{
  const location=new URL(url);
  if(location.pathname.endsWith('/staff_auth_sessions'))return Response.json(signed?[{
    expires_at:'2031-01-01T00:00:00Z',revoked_at:null,staff_user:{
      id:'aa00dffd-194d-4cb1-84bd-50a95ab44e84',role_code:role,
      is_active:true,can_manage_bookings:true,
      permissions_profile:{action_access:{'operations.customer.manage':true,
        'operations.assignment.manage':allowed}}
    }}]:[]);
  if(location.pathname.endsWith('/rosie_field_acceptance_events_v826'))return Response.json(sourceRows);
  throw Error('Unexpected source requested');
};
try{
  assert.equal((await onRequestGet({request,env})).status,401);
  signed=true;assert.equal((await onRequestGet({request,env})).status,403);
  role='operations_manager';allowed=false;assert.equal((await onRequestGet({request,env})).status,403);
  allowed=true;
  const res=await onRequestGet({request,env});assert.equal(res.status,200);
  const payload=await res.json();
  assert.equal(payload.requirement_registry_draft.scopeDrafts,45);
  assert.equal(payload.requirement_registry_draft.scopes.find(x=>x.moduleId===review.module_id)
    .linkedLocalReview.evidenceRef,review.evidence_ref);
  assert.equal(payload.master_preview.moduleReadiness.length,45);
  assert.equal(payload.requirement_registry_draft.scoringAuthorized,false);
  assert.equal(payload.source_authority.percentages_recalculated,false);
}finally{globalThis.fetch=savedFetch;}

const page=read('../admin-handoff-acceptance.html');
assert.equal(page,read('../admin-handoff-acceptance/index.html'));
for(const id of ['build827Registry','build827Heading','build827Search','build827Filter',
  'build827Refresh','build827Status','build827Count','build827Rows'])
  assert.ok(page.includes('id="'+id+'"'),'Missing registry UI '+id);
assert.match(page,/build827-module-registry-ui\.mjs\?v=build827/);
assert.match(read('../assets/build827-module-registry.css'),/@media\(max-width:650px\)/);
assert.match(read('./current_booking_wizard_regression.sh'),/build827_module_requirements_registry_test\.mjs/);
const api=read('../functions/api/admin/worksite_field_evidence_v826.js');
assert.match(api,/staffAccess811/);
assert.match(api,/supervisor\(access\.actor\)/);
assert.match(api,/requirement_registry_draft:draftRegistry827/);
assert.doesNotMatch(read('../assets/build827-module-registry-ui.mjs'),/localStorage|sessionStorage|POST|sendgrid|twilio|stripe/i);
console.log('Build 827 PASS: stable 45 module scopes, 39 distinct unapproved requirement drafts, device dedupe, private unverified source links, no scoring or trust promotion.');
