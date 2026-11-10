import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {HEALTH_SCHEMA_838,baseHealth838,reconcileHealth838}
  from '../assets/build838-health-reconciliation.mjs';
import {onRequestGet,onRequestPost,onRequestOptions,onRequestPut,onRequestPatch,onRequestDelete}
  from '../functions/api/admin/operations_security_it_health_v838.js';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const now=Date.parse('2026-11-10T14:00:00.000Z');
const date=offset=>new Date(now+offset).toISOString(),sha='c'.repeat(40);
const base=baseHealth838({runtimeRevision:sha,branch:'main',generatedAt:date(0),originalSessionVerified:true});
assert.equal(base.schema,HEALTH_SCHEMA_838);
assert.equal(base.runtimeRevisionClaim,sha);
assert.equal(base.runtimeRevisionIndependentlyVerified,false);
assert.equal(base.productionExactShaVerifiedHere,false);
assert.equal(base.sourceConnections.aiData,'DISCONNECTED / HOLD');
assert.equal(base.sourceConnections.comms,'DISCONNECTED / HOLD');
assert.equal(base.sourceConnections.consumerAckVerified,false);
assert.equal(base.sources.length,9);
assert.equal(new Set(base.sources.map(r=>r.id)).size,9);
assert.equal(base.sources.every(r=>r.state==='NOT_CHECKED'),true);
assert.equal(base.sources.every(r=>r.route.startsWith('/admin')),true);
assert.equal(base.outcomes.databaseWrites,0);
assert.equal(base.outcomes.remoteMessagesSent,0);
assert.equal(base.outcomes.restoreRun,false);
assert.equal(baseHealth838({runtimeRevision:'invalid',branch:'hack'}).runtimeRevisionClaim,null);
assert.equal(baseHealth838({runtimeRevision:sha,branch:'hack'}).runtimeBranchClaim,null);
assert.throws(()=>baseHealth838({generatedAt:'broken'}),/HOLD_INVALID_RUNTIME_CLOCK/);

const payloads={it:{status:200,body:{build:307,ok:true,generated_at:date(-1000),
    summary:{overall_state:'GREEN'},diagnostics:{}}},
  support:{status:200,body:{build:412,ok:true,generated_at:date(-2000),
    overall:'clear',alert_counts:{critical:0,warning:0,hold:0}}},
  backup:{status:200,body:{build:437,ok:true,generated_at:date(-3000),
    evidence:{status:'hold',truth_boundary:{production_restore_performed:false}}}}};
const row=(report,id)=>report.sources.find(r=>r.id===id);
const report=reconcileHealth838(base,payloads,now);
assert.equal(report.reconciliation.observedSourceCount,3);
assert.equal(report.reconciliation.unqueriedSourceCount,6);
assert.equal(report.reconciliation.platformWideGreen,false);
assert.equal(report.reconciliation.noNewGateOrOldPreflightTask,true);
assert.equal(report.reconciliation.noAutomatedPolling,true);
assert.equal(report.reconciliation.independentOwnerAcceptance,false);
assert.equal(row(report,'runtime').state,'RECENT_IT_DIAGNOSTIC_PASS');
assert.equal(row(report,'alerts').state,'RECENT_SUPPORT_NO_REPORTED_ALERTS');
assert.equal(row(report,'backup').state,'BACKUP_OR_RECOVERY_EVIDENCE_HOLD');
assert.equal(row(report,'operations').state,'NOT_CHECKED');
assert.equal(row(report,'security').state,'NOT_CHECKED');
assert.equal(row(report,'comms').state,'NOT_CHECKED');
assert.equal(report.outcomes.databaseWrites,0);

const stale=reconcileHealth838(base,{...payloads,
  it:{...payloads.it,body:{...payloads.it.body,generated_at:date(-6*60_000)}}},now);
assert.equal(row(stale,'runtime').state,'STALE_OR_INVALID_SOURCE_CLOCK');
assert.equal(stale.reconciliation.missingOrStaleCount,1);
const wrongTime=reconcileHealth838(base,{...payloads,
  it:{...payloads.it,body:{...payloads.it.body,generated_at:date(2*60_000)}}},now);
assert.equal(row(wrongTime,'runtime').state,'STALE_OR_INVALID_SOURCE_CLOCK');
const denied=reconcileHealth838(base,{...payloads,it:{status:403,body:{build:307}}},now);
assert.equal(row(denied,'runtime').state,'SOURCE_UNAVAILABLE');
const malformed=reconcileHealth838(base,{...payloads,it:{...payloads.it,
  body:{...payloads.it.body,summary:{overall_state:'INVALID'}}}},now);
assert.equal(row(malformed,'runtime').state,'HOLD_MALFORMED_IT_REPORT');
const failed=reconcileHealth838(base,{...payloads,it:{...payloads.it,
  body:{...payloads.it.body,summary:{overall_state:'RED'}}},
  support:{...payloads.support,body:{...payloads.support.body,overall:'critical',
    alert_counts:{critical:2}}}},now);
assert.equal(row(failed,'runtime').state,'IT_FAILURE_REPORTED');
assert.equal(row(failed,'alerts').state,'SOURCE_CRITICAL_ALERTS');
assert.equal(failed.reconciliation.sourceAlertCount,2);
const restoreCandidate=reconcileHealth838(base,{...payloads,backup:{...payloads.backup,
  body:{...payloads.backup.body,evidence:{status:'closure_candidate',
    truth_boundary:{production_restore_performed:false}}}}},now);
assert.equal(row(restoreCandidate,'backup').state,'DATED_BACKUP_EVIDENCE_REVIEW_CANDIDATE');
assert.equal(restoreCandidate.reconciliation.independentOwnerAcceptance,false);
const fakeRestored=reconcileHealth838(base,{...payloads,backup:{...payloads.backup,
  body:{...payloads.backup.body,evidence:{status:'closure_candidate',
    truth_boundary:{production_restore_performed:true}}}}},now);
assert.equal(row(fakeRestored,'backup').state,'HOLD_MALFORMED_BACKUP_REPORT');
assert.throws(()=>reconcileHealth838({...base,schema:'untrusted'},payloads,now),/HOLD_INVALID_SOURCE_SCOPE/);

const request=new Request('https://rosiedazzlers.ca/api/admin/operations_security_it_health_v838',
  {headers:{Cookie:'rd_staff_session=private-fixture'}});
const env={SUPABASE_URL:'https://supabase-mock.invalid',SUPABASE_SERVICE_ROLE_KEY:'service-fixture',
  CF_PAGES_COMMIT_SHA:sha,CF_PAGES_BRANCH:'main'};
const originalFetch=globalThis.fetch;let signed=false,role='detailer';let permissions={
  'operations.assignment.manage':true,'it.runtime.view':true};const hits=[];
globalThis.fetch=async(input,init={})=>{
  const table=new URL(input).pathname.split('/').pop();hits.push(table);
  assert.equal(table,'staff_auth_sessions');assert.equal(init.method??'GET','GET');
  return Response.json(signed?[{expires_at:'2031-01-01T00:00:00Z',revoked_at:null,
    staff_user:{id:'00000000-0000-4000-8000-000000000099',role_code:role,is_active:true,
      can_manage_bookings:true,permissions_profile:{action_access:{...permissions}}}}]:[]);
};
try{
  assert.equal((await onRequestGet({request,env})).status,401);
  signed=true;assert.equal((await onRequestGet({request,env})).status,403);
  role='operations_manager';permissions['it.runtime.view']=false;
  assert.equal((await onRequestGet({request,env})).status,403);
  permissions['it.runtime.view']=true;
  assert.equal((await onRequestGet({request,env})).status,403);
  role='admin';
  const result=await onRequestGet({request,env});
  assert.equal(result.status,200);assert.match(result.headers.get('Cache-Control'),/no-store/);
  const body=await result.json();assert.equal(body.report.schema,HEALTH_SCHEMA_838);
  assert.equal(body.report.runtimeRevisionClaim,sha);
  assert.equal(body.report.productionExactShaVerifiedHere,false);
  assert.equal(body.authority.signedStaffSession,true);
  assert.equal(body.authority.otherSourceReads,0);
  assert.equal(body.authority.databaseWrites,0);
  assert.ok(hits.every(x=>x==='staff_auth_sessions'));
  assert.doesNotMatch(JSON.stringify(body),/service-fixture|private-fixture|00000000-0000-4000/);
  for(const mutation of [onRequestOptions,onRequestPost,onRequestPut,onRequestPatch,onRequestDelete])
    assert.equal((await mutation()).status,405);
}finally{globalThis.fetch=originalFetch;}
const html=read('../admin-handoff-acceptance.html');
assert.equal(html,read('../admin-handoff-acceptance/index.html'));
for(const id of ['build838Heading','build838Refresh','build838Rows','build838State'])
  assert.match(html,new RegExp('id="'+id+'"'));
assert.match(html,/startHealthReconciliation838\(\)/);
assert.match(html,/build838-health\.css/);
const ui=read('../assets/build838-health-ui.mjs');
assert.match(ui,/textContent/);assert.doesNotMatch(ui,/innerHTML|method:\s*['"]POST/);
assert.doesNotMatch(ui,/setInterval/);
assert.match(read('../assets/build838-health.css'),/focus-visible/);
assert.match(read('./current_booking_wizard_regression.sh'),/build838_operations_security_it_health_test/);
console.log('Build 838 source-owned IT/support/recovery freshness, privacy, HOLD, permission and mirrored dashboard PASS');
