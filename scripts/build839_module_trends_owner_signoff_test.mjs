import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {basePortfolio839,reconcilePortfolio839,PORTFOLIO_SCHEMA_839,AUDIT_DATE_839}
  from '../assets/build839-portfolio-readiness.mjs';
import {draftRegistry827} from '../assets/build827-module-requirements.mjs';
import {provenanceReport828} from '../assets/build828-evidence-provenance.mjs';
import {onRequestGet,onRequestPost,onRequestOptions,onRequestPut,onRequestPatch,onRequestDelete}
  from '../functions/api/admin/module_portfolio_readiness_v839.js';

const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const now=Date.parse('2026-11-10T15:00:00.000Z'),at=offset=>new Date(now+offset).toISOString();
const sha='e'.repeat(40);
const base=basePortfolio839({runtimeRevision:sha,branch:'main',signedStaffSession:true,generatedAt:at(0)});
assert.equal(base.schema,PORTFOLIO_SCHEMA_839);
assert.equal(base.audit.date,AUDIT_DATE_839);
assert.equal(base.scopeDrafts,45);
assert.equal(base.requirementDrafts,39);
assert.equal(base.scopes.length,45);
assert.equal(new Set(base.scopes.map(r=>r.scopeId)).size,45);
assert.equal(base.scopes.every(r=>r.approvedNumerator===null&&r.approvedDenominator===null&&
  r.approvedWeight===null&&r.signedOriginalOwnerDecisionVerified===false),true);
assert.equal(base.scopes[0].provisionalBuiltEstimate,80);
assert.equal(base.scopes[0].provisionalProvenEstimate,40);
assert.equal(base.audit.comparableApprovedPairs,0);
assert.equal(base.audit.approvedTrendPercentPoints,null);
assert.equal(base.ownerSignoff.signedOwnerReceipt,null);
assert.equal(base.ownerSignoff.signoffRecordedByThisView,false);
assert.equal(base.masterPortfolio.portfolioGreen,false);
assert.equal(base.masterPortfolio.approvedUnweightedPercent,null);
assert.equal(base.masterPortfolio.approvedWeightedPercent,null);
assert.equal(base.productionExactShaIndependentlyVerified,false);
assert.equal(base.safeguards.databaseWrites,0);
assert.equal(base.safeguards.masterEvents,0);
assert.equal(basePortfolio839({runtimeRevision:'spoof',branch:'admin'}).runtimeRevisionClaim,null);
assert.throws(()=>basePortfolio839({generatedAt:'bad'}),/HOLD_INVALID_PORTFOLIO_CLOCK/);

const original={status:200,body:{ok:true,build:826,generated_at:at(-1000),
  requirement_registry_draft:draftRegistry827(),
  requirement_provenance_preview:provenanceReport828({now,generatedAt:at(-1000)})}};
const valid=reconcilePortfolio839(base,original,now);
assert.equal(valid.sourceReview.state,'RECENT_LOCAL_LEDGER_ONLY');
assert.equal(valid.sourceReview.localLinkedCount,0);
assert.equal(valid.sourceReview.unapprovedScopes,45);
assert.equal(valid.sourceReview.approvedTrendPoints,0);
assert.equal(valid.scopes.every(x=>x.localChainStatus==='NO_RECENT_REVIEW'),true);
assert.equal(valid.ownerSignoff.state,'HOLD_NOT_SIGNED');
assert.equal(valid.masterPortfolio.state,'DISCONNECTED / HOLD');
assert.equal(valid.masterPortfolio.scoringAuthorized,false);
assert.equal(valid.masterPortfolio.portfolioGreen,false);
for(const broken of [null,{status:403,body:original.body},
  {status:200,body:{...original.body,generated_at:at(-400_000)}},
  {status:200,body:{...original.body,generated_at:at(120_000)}},
  {status:200,body:{...original.body,requirement_registry_draft:{
    ...original.body.requirement_registry_draft,approvedNumerator:40}}},
  {status:200,body:{...original.body,requirement_provenance_preview:{
    ...original.body.requirement_provenance_preview,ownerApproved:true}}},
  {status:200,body:{...original.body,requirement_provenance_preview:{
    ...original.body.requirement_provenance_preview,scopeTraces:[
      original.body.requirement_provenance_preview.scopeTraces[0],
      ...original.body.requirement_provenance_preview.scopeTraces.slice(0,-1)]}}}]){
  const held=reconcilePortfolio839(base,broken,now);
  assert.equal(held.sourceReview.state,'UNAVAILABLE_OR_STALE_HOLD');
  assert.equal(held.sourceReview.approvedTrendPoints,0);
  assert.equal(held.masterPortfolio.approvedNumerator,null);
  assert.equal(held.ownerSignoff.signedOwnerDecisionVerified,false);
}
assert.throws(()=>reconcilePortfolio839({...base,schema:'untrusted'},original,now),
  /HOLD_INVALID_PORTFOLIO_SCOPE/);
assert.throws(()=>reconcilePortfolio839({...base,signedStaffSession:false},original,now),
  /HOLD_INVALID_PORTFOLIO_SCOPE/);

const request=new Request('https://rosiedazzlers.ca/api/admin/module_portfolio_readiness_v839',
  {headers:{Cookie:'rd_staff_session=secret-fixture'}});
const env={SUPABASE_URL:'https://supabase-fixture.invalid',
  SUPABASE_SERVICE_ROLE_KEY:'hidden-role',CF_PAGES_COMMIT_SHA:sha,CF_PAGES_BRANCH:'main'};
const actualFetch=globalThis.fetch;
let signed=false,role='detailer',permissions={
  'operations.assignment.manage':true,'it.runtime.view':true};let reads=0;
globalThis.fetch=async(input,init={})=>{
  reads++;
  assert.equal(new URL(input).pathname.split('/').pop(),'staff_auth_sessions');
  assert.equal(init.method??'GET','GET');
  return Response.json(signed?[{expires_at:'2031-01-01T00:00:00Z',revoked_at:null,
    staff_user:{id:'00000000-0000-4000-8000-000000000099',role_code:role,is_active:true,
      can_manage_bookings:true,permissions_profile:{action_access:{...permissions}}}}]:[]);
};
try{
  assert.equal((await onRequestGet({request,env})).status,401);
  signed=true;assert.equal((await onRequestGet({request,env})).status,403);
  role='operations_manager';assert.equal((await onRequestGet({request,env})).status,403);
  role='accountant';assert.equal((await onRequestGet({request,env})).status,403);
  role='admin';
  const response=await onRequestGet({request,env});
  assert.equal(response.status,200);
  assert.match(response.headers.get('Cache-Control'),/no-store/);
  const body=await response.json();
  assert.equal(body.report.schema,PORTFOLIO_SCHEMA_839);
  assert.equal(body.report.runtimeRevisionClaim,sha);
  assert.equal(body.report.ownerSignoff.signedOwnerDecisionVerified,false);
  assert.equal(body.report.masterPortfolio.exportedToMaster,false);
  assert.equal(body.authority.databaseWrites,0);
  assert.equal(body.authority.otherSourceReads,0);
  assert.ok(reads>=5);
  assert.doesNotMatch(JSON.stringify(body),/hidden-role|secret-fixture|00000000-0000-4000/);
  for(const method of [onRequestOptions,onRequestPost,onRequestPut,onRequestPatch,onRequestDelete])
    assert.equal((await method()).status,405);
}finally{globalThis.fetch=actualFetch;}

const html=read('../admin-handoff-acceptance.html');
assert.equal(html,read('../admin-handoff-acceptance/index.html'));
for(const id of ['build839Heading','build839Search','build839Filter','build839Refresh',
  'build839Rows','build839State','build839Signoff','build839Master'])
  assert.match(html,new RegExp('id="'+id+'"'));
assert.match(html,/startPortfolioReadiness839\(\)/);
assert.match(html,/build839-portfolio\.css/);
const ui=read('../assets/build839-portfolio-ui.mjs');
assert.match(ui,/textContent/);
assert.doesNotMatch(ui,/innerHTML|setInterval|method:\s*['"]POST/);
assert.match(ui,/worksite_field_evidence_v826/);
assert.match(read('../assets/build839-portfolio.css'),/focus-visible/);
assert.match(read('./current_booking_wizard_regression.sh'),/build839_module_trends_owner_signoff_test/);
console.log('Build 839 audit-only trends, signed owner HOLD, Master portfolio and protected source PASS');
