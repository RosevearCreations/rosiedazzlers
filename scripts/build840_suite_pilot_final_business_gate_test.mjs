import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {baseSuitePilot840,reconcileSuitePilot840,SUITE_PILOT_SCHEMA_840}
  from '../assets/build840-suite-pilot.mjs';
import {masterStatus834} from '../assets/build834-master-status.mjs';
import {masterPilot835} from '../assets/build835-master-pilot.mjs';
import {publicationReadiness836} from '../assets/build836-publication-readiness.mjs';
import {consentIncidentReadiness837} from '../assets/build837-consent-incident-continuity.mjs';
import {baseHealth838} from '../assets/build838-health-reconciliation.mjs';
import {basePortfolio839} from '../assets/build839-portfolio-readiness.mjs';
import {onRequestGet,onRequestOptions,onRequestPost,onRequestPut,onRequestPatch,onRequestDelete}
  from '../functions/api/admin/suite_pilot_final_business_gate_v840.js';

const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
const now=Date.parse('2026-11-10T17:00:00.000Z');
const at=offset=>new Date(now+offset).toISOString(),sha='b'.repeat(40);
const base=baseSuitePilot840({runtimeRevision:sha,branch:'main',signedStaffSession:true,
  generatedAt:at(0)});
assert.equal(base.schema,SUITE_PILOT_SCHEMA_840);
assert.equal(base.topology.length,7);
assert.deepEqual(base.routes.map(r=>r.id),['one-to-one','one-to-many','many-to-one']);
assert.equal(base.routes[1].destinations.length,2);
assert.equal(base.routes.every(r=>r.publishedHere===false&&r.acceptedReceiptsHere===0),true);
assert.equal(base.topology.find(t=>t.id==='yw').boundary.includes('Rosevear Landscaping'),true);
assert.equal(base.topology.find(t=>t.id==='icamp').boundary.includes('Camp Rosevear'),true);
assert.equal(base.safeguards.length,7);
assert.equal(base.effects.databaseWrites,0);
assert.equal(base.effects.messagesSent,0);
assert.equal(base.effects.masterEventsPublished,0);
assert.equal(base.effects.signaturesCreated,0);
assert.equal(base.finalBusinessGate.state,'HOLD');
assert.equal(base.finalBusinessGate.approvalRecordedHere,false);
assert.equal(base.productionExactShaVerifiedHere,false);
assert.equal(baseSuitePilot840({runtimeRevision:'forged',branch:'owner'}).runtimeRevisionClaim,null);
assert.throws(()=>baseSuitePilot840({generatedAt:'nonsense'}),/HOLD_INVALID_SUITE_CLOCK/);

const reports={
  status:masterStatus834({runtimeRevision:sha,generatedAt:at(0),now}),
  pilot:masterPilot835({runtimeRevision:sha,generatedAt:at(0)}),
  publication:publicationReadiness836({runtimeRevision:sha,generatedAt:at(0)}),
  consent:consentIncidentReadiness837({runtimeRevision:sha,generatedAt:at(0)}),
  health:baseHealth838({runtimeRevision:sha,branch:'main',originalSessionVerified:true,generatedAt:at(0)}),
  portfolio:basePortfolio839({runtimeRevision:sha,branch:'main',signedStaffSession:true,generatedAt:at(0)})
};
const observations=Object.fromEntries(Object.entries(reports)
  .map(([id,report])=>[id,{status:200,body:{ok:true,report}}]));
const good=reconcileSuitePilot840(base,observations,now);
assert.equal(good.localReconciliation.compatibleSourceReports,6);
assert.equal(good.localReconciliation.conflictOrStaleCount,0);
assert.equal(good.localReconciliation.status,'LOCAL_CONTRACTS_ONLY_ORIGINAL_PROOF_HOLD');
assert.equal(good.finalBusinessGate.state,'HOLD');
assert.equal(good.finalBusinessGate.unclosedItemCount,7);
assert.equal(good.localReconciliation.externalConsumerResponsesChecked,0);
assert.equal(good.finalBusinessGate.independentAiDataAccepted,false);
assert.equal(good.finalBusinessGate.independentCommsAccepted,false);
assert.equal(good.finalBusinessGate.originalOwnerAccepted,false);
assert.equal(good.finalBusinessGate.rollbackReceiptVerified,false);

const check=(id,replacement,expected)=>{
  const data=reconcileSuitePilot840(base,{...observations,[id]:replacement},now);
  assert.equal(data.finalBusinessGate.state,'HOLD');
  assert.equal(data.comparisons.find(x=>x.id===id).state,expected);
  assert.equal(data.finalBusinessGate.unclosedItemCount,8);
};
check('status',null,'UNAVAILABLE_OR_UNAUTHORIZED_HOLD');
check('status',{status:403,body:observations.status.body},'UNAVAILABLE_OR_UNAUTHORIZED_HOLD');
check('status',{status:503,body:null},'UNAVAILABLE_OR_UNAUTHORIZED_HOLD');
check('status',{status:200,body:{ok:false,report:reports.status}},'UNAVAILABLE_OR_UNAUTHORIZED_HOLD');
check('status',{status:200,body:{ok:true,report:{...reports.status,generatedAt:at(-400_000)}}},'CONFLICT_OR_STALE_HOLD');
check('status',{status:200,body:{ok:true,report:{...reports.status,generatedAt:at(120_000)}}},'CONFLICT_OR_STALE_HOLD');
check('status',{status:200,body:{ok:true,report:{...reports.status,sourceIdentity:{sourceId:'yw'}}}},'CONFLICT_OR_STALE_HOLD');
check('status',{status:200,body:{ok:true,report:{...reports.status,runtimeRevision:{claim:'c'.repeat(40)}}}},'REVISION_DRIFT_HOLD');
check('pilot',{status:200,body:{ok:true,report:{...reports.pilot,pilot:{...reports.pilot.pilot,sourceSignedReceiptVerifiedHere:true}}}},'CONFLICT_OR_STALE_HOLD');
check('publication',{status:200,body:{ok:true,report:{...reports.publication,outcome:{...reports.publication.outcome,masterEventsSent:1}}}},'CONFLICT_OR_STALE_HOLD');
check('consent',{status:200,body:{ok:true,report:{...reports.consent,outcome:{...reports.consent.outcome,messagesSent:1}}}},'CONFLICT_OR_STALE_HOLD');
check('health',{status:200,body:{ok:true,report:{...reports.health,outcomes:{...reports.health.outcomes,databaseWrites:1}}}},'CONFLICT_OR_STALE_HOLD');
check('portfolio',{status:200,body:{ok:true,report:{...reports.portfolio,masterPortfolio:{...reports.portfolio.masterPortfolio,portfolioGreen:true}}}},'CONFLICT_OR_STALE_HOLD');
assert.throws(()=>reconcileSuitePilot840({...base,signedStaffSession:false},observations,now),/HOLD_INVALID_SUITE_SCOPE/);
assert.throws(()=>reconcileSuitePilot840({...base,sourceId:'icamp'},observations,now),/HOLD_INVALID_SUITE_SCOPE/);
assert.throws(()=>reconcileSuitePilot840({...base,finalBusinessGate:{state:'GREEN'}},observations,now),/HOLD_INVALID_SUITE_SCOPE/);

const request=new Request('https://rosiedazzlers.ca/api/admin/suite_pilot_final_business_gate_v840',
  {headers:{Cookie:'rd_staff_session=hidden-session'}});
const env={SUPABASE_URL:'https://supabase-fixture.invalid',
  SUPABASE_SERVICE_ROLE_KEY:'hidden-role',CF_PAGES_COMMIT_SHA:sha,CF_PAGES_BRANCH:'main'};
const originalFetch=globalThis.fetch;
let signed=false,role='detailer',operations=true,it=true,reads=0;
globalThis.fetch=async(input,init={})=>{
  reads++;
  assert.equal(new URL(input).pathname.split('/').pop(),'staff_auth_sessions');
  assert.equal(init.method??'GET','GET');
  return Response.json(signed?[{expires_at:'2031-01-01T00:00:00Z',revoked_at:null,
    staff_user:{id:'00000000-0000-4000-8000-000000000099',role_code:role,is_active:true,
      can_manage_bookings:true,permissions_profile:{action_access:{
        'operations.assignment.manage':operations,'it.runtime.view':it}}}}]:[]);
};
try{
  assert.equal((await onRequestGet({request,env})).status,401);
  signed=true;
  assert.equal((await onRequestGet({request,env})).status,403);
  role='operations_manager';assert.equal((await onRequestGet({request,env})).status,403);
  // Existing action-permissions contract grants administrators all module actions;
  // per-action false flags do not revoke that role-wide ceiling.
  role='admin';operations=false;assert.equal((await onRequestGet({request,env})).status,200);
  operations=true;it=false;assert.equal((await onRequestGet({request,env})).status,200);
  it=true;
  const response=await onRequestGet({request,env});assert.equal(response.status,200);
  assert.match(response.headers.get('Cache-Control'),/no-store/);
  assert.equal(response.headers.get('Access-Control-Allow-Origin'),'none');
  const body=await response.json();assert.equal(body.report.schema,SUITE_PILOT_SCHEMA_840);
  assert.equal(body.report.runtimeRevisionClaim,sha);
  assert.equal(body.report.finalBusinessGate.state,'HOLD');
  assert.equal(body.authority.databaseWrites,0);
  assert.equal(body.authority.otherSourceReads,0);
  assert.equal(body.authority.masterConsumerInvoked,false);
  assert.ok(reads>=6);
  assert.doesNotMatch(JSON.stringify(body),/hidden-role|hidden-session|00000000-0000-4000/);
  for(const method of [onRequestPost,onRequestPut,onRequestPatch,onRequestDelete,onRequestOptions])
    assert.equal((await method()).status,405);
}finally{globalThis.fetch=originalFetch;}

const html=read('../admin-handoff-acceptance.html');
assert.equal(html,read('../admin-handoff-acceptance/index.html'));
for(const id of ['build840Heading','build840Refresh','build840State','build840Gate',
  'build840Summary','build840Topology','build840RouteRows','build840SourceRows','build840Release'])
  assert.match(html,new RegExp('id="'+id+'"'));
assert.match(html,/startSuitePilot840\(\)/);
assert.match(html,/build840-suite-pilot\.css/);
const ui=read('../assets/build840-suite-pilot-ui.mjs');
assert.match(ui,/reconcileSuitePilot840/);
assert.match(ui,/Promise\.all/);
assert.match(ui,/same-origin/);
assert.doesNotMatch(ui,/innerHTML|setInterval|method:\s*['"]POST|fetch\(['"]https?:/);
assert.match(read('../assets/build840-suite-pilot.css'),/focus-visible/);
console.log('BUILD840_SUITE_PILOT_FINAL_BUSINESS_GATE: PASS — local contracts / boundary / denial / HOLD');
