import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {onRequestGet,sourceCount825} from '../functions/api/admin/worksite_field_acceptance_v825.js';
import {EVIDENCE_SOURCES_825,countFromPostgrest825,verifiedEvidenceCounts825,deviceMatrix825,fieldAcceptance825,moduleSignal825} from '../assets/build825-field-readiness.mjs';
import {MODULE_BASELINE_825} from '../assets/build825-module-baseline.mjs';

const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const supervisorId='aa00dffd-194d-4cb1-84bd-50a95ab44e84';
const examples={handoffs:2,followups:3,bookings:1,fieldUpdates:0,timeEntries:0,payroll:0,invoices:0,
  accounting:0,financeJournal:0,tax:0,social:0,inventory:0,payments:0,integration:0,creative:1};
assert.equal(Object.keys(EVIDENCE_SOURCES_825).length,15);
assert.equal(countFromPostgrest825('0-0/4',1),4);
assert.equal(countFromPostgrest825('*/0',0),0);
assert.equal(countFromPostgrest825(null,0),null);
assert.equal(countFromPostgrest825('*/unknown',0),null);
assert.equal(countFromPostgrest825('0-0/3',2),null);
assert.equal(countFromPostgrest825('0-0/-2',1),null);
assert.equal(verifiedEvidenceCounts825({handoffs:{status:'available',count:0}}).handoffs.observed,false);
assert.equal(verifiedEvidenceCounts825({handoffs:{status:'unavailable',count:0}}).handoffs.count,null);
assert.equal(deviceMatrix825().closure_candidate,false);
const syntheticDevice={
  closure_candidate:true,
  roles:['customer','detailer','operations','admin'].map(id=>({id,status:'observed_dated',current_pass:true,current_regression:false,device_classes:['phone','tablet','desktop']})),
  devices:['phone','tablet','desktop'].map(id=>({id,status:'observed_dated',observed:true}))
};
assert.equal(deviceMatrix825(syntheticDevice).status,'operator_review_candidate');
assert.equal(deviceMatrix825({...syntheticDevice,roles:syntheticDevice.roles.map((r,i)=>i===0?{...r,current_pass:false,current_regression:true}:r)}).status,'regression_hold');
assert.equal(deviceMatrix825({...syntheticDevice,devices:syntheticDevice.devices.filter(r=>r.id!=='tablet')}).closure_candidate,false);
const sourceRecords=Object.fromEntries(Object.keys(EVIDENCE_SOURCES_825).map(k=>[k,{status:'available',count:examples[k]}]));
const classification=fieldAcceptance825({sources:sourceRecords,deviceEvidence:syntheticDevice,generatedAt:'2026-11-09T01:00:00Z'});
assert.equal(classification.handoff.status,'source_observed_review_required');
assert.equal(classification.operational_readiness,'hold','No real field records means no operational readiness even with role observations');
assert.equal(classification.canonical_hold_changed,false);
assert.equal(classification.auto_completion_percent_increased,false);
assert.equal(fieldAcceptance825({sources:sourceRecords}).devices.status,'unavailable');
assert.equal(fieldAcceptance825({sources:{}}).handoff.status,'unavailable');
assert.equal(fieldAcceptance825({sources:{...sourceRecords,handoffs:{status:'available',count:0}},deviceEvidence:syntheticDevice}).handoff.status,'owner_action');
assert.equal(moduleSignal825({source:'payroll',role:'operations'},classification).status,'missing_observation');
assert.equal(moduleSignal825({source:'handoffs',role:'operations'},classification).status,'owner_review');
assert.equal(moduleSignal825({source:'followups',role:'customer'},fieldAcceptance825({sources:sourceRecords})).status,'device_hold');
assert.equal(moduleSignal825({source:'nonexistent'},classification).status,'source_unavailable');
assert.equal(MODULE_BASELINE_825.length,45,'all 45 audit rows remain present');
assert.equal(new Set(MODULE_BASELINE_825.map(x=>x.id)).size,45);
for(const m of MODULE_BASELINE_825){assert.ok(Number.isInteger(m.built)&&m.built>=0&&m.built<=100);assert.ok(Number.isInteger(m.proven)&&m.proven>=0&&m.proven<=100);
  assert.ok(m.built>=m.proven,'source readiness may not exceed source implementation');
  assert.ok(m.name&&m.note&&typeof m.note==='string');
}
const baseline=read('../docs/ROSIE_MODULE_COMPLETION_AUDIT_20261108.md');
for(const m of MODULE_BASELINE_825)assert.ok(baseline.includes('| '+m.name+' | '+m.built+'% | '+m.proven+'% |'),'Never alter audited rates behind the owner's back: '+m.name);

let signed=true,role='operations_manager',permission=true,offlineTable='',sessionRequests=0;
const env={SUPABASE_URL:'https://supabase-mock.invalid',SUPABASE_SERVICE_ROLE_KEY:'test-only'};
const mockActor=()=>({id:supervisorId,full_name:'Test Supervisor',is_active:true,role_code:role,can_manage_bookings:true,
  permissions_profile:{action_access:{'operations.customer.manage':true,'operations.assignment.manage':permission}}});
const request=(cookie='rd_staff_session=token')=>({request:new Request('https://www.rosiedazzlers.ca/api/admin/worksite_field_acceptance_v825',{
  headers:cookie?{Cookie:cookie}:{}}),env});
const originalFetch=globalThis.fetch;
globalThis.fetch=async(url,init={})=>{
  const target=new URL(url),table=target.pathname.split('/').at(-1);
  if(table==='staff_auth_sessions'){
    sessionRequests++;
    return Response.json(signed?[{expires_at:'2031-01-01T00:00:00Z',revoked_at:null,staff_user:mockActor()}]:[]);
  }
  if(table===offlineTable)throw Error('Source unavailable');
  const key=Object.entries(EVIDENCE_SOURCES_825).find(([,v])=>v===table)?.[0];
  if(key){
    const count=examples[key],rows=count?[{id:'fake-count-only'}]:[];
    return Response.json(rows,{headers:{'Content-Range':count?'0-0/'+count:'*/0'}});
  }
  // Any IT-only launch evidence, role or provider lookup not mocked is
  // intentionally unavailable, never silently passed.
  return Response.json({error:'Unavailable'},{status:503});
};
try{
  signed=false;assert.equal((await onRequestGet(request())).status,401);signed=true;
  role='detailer';assert.equal((await onRequestGet(request())).status,403);
  role='operations_manager';permission=false;assert.equal((await onRequestGet(request())).status,403);permission=true;
  assert.equal((await onRequestGet(request(''))).status,401);
  let response=await onRequestGet(request());assert.equal(response.status,200);
  let data=await response.json();
  assert.equal(data.scope,'signed_supervisor_read_only');assert.equal(data.authority.supervisor_action,true);
  assert.equal(data.acceptance.counts.handoffs.count,2);
  assert.equal(data.acceptance.counts.payroll.count,0);
  assert.equal(data.acceptance.devices.status,'unavailable');
  assert.equal(data.acceptance.handoff.status,'source_observed_review_required');
  assert.equal(data.acceptance.operational_readiness,'hold');
  assert.equal(data.acceptance.canonical_hold_changed,false);
  assert.equal(data.authority.billing_changed,false);
  assert.ok(!JSON.stringify(data).includes('Test Supervisor'),'No staff identities are returned');
  offlineTable='staff_payroll_runs';response=await onRequestGet(request());data=await response.json();
  assert.equal(data.acceptance.counts.payroll.status,'unavailable');
  assert.equal(data.acceptance.counts.payroll.count,null,'Unknown must never be silently zero');
  assert.equal(data.acceptance.canonical_hold_changed,false);
  offlineTable='customer_worksite_supervisor_notes_v824';
  response=await onRequestGet(request());data=await response.json();
  assert.equal(data.acceptance.handoff.status,'unavailable','A missing handoff source stays unavailable');
  assert.ok(sessionRequests>4);
  assert.equal((await sourceCount825(env,'missing_random_table')).status,'unavailable','unknown table not queried');
}finally{globalThis.fetch=originalFetch;}

const api=read('../functions/api/admin/worksite_field_acceptance_v825.js');
for(const token of ['staffAccess811','operations.assignment.manage','getDeviceAuthority','sourceCount825','Cache-Control','source_green_is_not_business_evidence'])
  assert.ok(api.includes(token)||token==='source_green_is_not_business_evidence'&&read('../assets/build825-field-readiness.mjs').includes(token),'Missing field authority '+token);
assert.doesNotMatch(api,/onRequestPost|method:\s*['"](?:POST|PATCH|DELETE)['"]|service_role.*client|sendgrid|twilio/i);
const ui=read('../assets/build825-field-acceptance-dashboard.mjs');
assert.doesNotMatch(ui,/localStorage|sessionStorage|createObjectURL|\.download\s*=|fetch\(.+method:\s*['"](?:POST|PATCH|DELETE)/i);
assert.match(ui,/auto|provisional|review|HOLD/i);
const page=read('../admin-handoff-acceptance.html');
assert.equal(page,read('../admin-handoff-acceptance/index.html'),'canonical/mirror acceptance pages are identical');
for(const id of ['build825Refresh','build825RoleRows','build825DeviceRows','build825ModuleRows','build825ModuleSearch','build825StatusFilter','build825Sources','build825HandoffStatus'])
  assert.ok(page.includes('id="'+id+'"'),'Missing accessible acceptance control '+id);
assert.match(page,/build825-field-acceptance-dashboard\.mjs\?v=build825/);
assert.match(page,/name="viewport"|meta name="viewport"/);
const today=read('../admin-today.html');
assert.equal(today,read('../admin-today/index.html'));
assert.match(today,/href="\/admin-handoff-acceptance\.html"/);
assert.match(read('../assets/build825-field-acceptance.css'),/@media\(max-width:680px\)/);
assert.match(read('./current_booking_wizard_regression.sh'),/build825_production_field_acceptance_test\.mjs/);
console.log('Build 825 PASS: staff permission separation, actual source counts, HOLD on unavailable/stale/device evidence, no automatic module scores, mirrored accessible role/device dashboard.');
