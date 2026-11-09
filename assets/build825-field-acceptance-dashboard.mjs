// Build 825: role/device handoff acceptance and module readiness — manual refresh only.
// Source rates remain fixed audited estimates. No browser storage or evidence write.
import {MODULE_BASELINE_825} from './build825-module-baseline.mjs';
import {moduleSignal825} from './build825-field-readiness.mjs';

const $=id=>document.getElementById(id);
let report=null,loadedAt=null,loading=false;
const setStatus=(message,error=false)=>{const e=$('build825Status');if(!e)return;e.textContent=message;e.dataset.status=error?'error':'info';};
const add=(parent,tag,text,cls='')=>{const el=document.createElement(tag);if(cls)el.className=cls;el.textContent=String(text??'');parent.append(el);return el;};
const formatTime=v=>{const date=new Date(v);return Number.isFinite(date.getTime())?date.toLocaleString('en-CA',{dateStyle:'medium',timeStyle:'short'}):'Unverified time';};
const describe=status=>({
  observed_dated:'Current observed',
  regression_observed:'Current regression',
  owner_action:'Needs field observation',
  unavailable:'Unavailable — HOLD',
  operator_review_candidate:'Operator review only',
  regression_hold:'Regression — HOLD',
  hold:'HOLD',
  source_observed_review_required:'Handoff source recorded — needs field review',
  missing_observation:'No source events — HOLD'
})[status]||String(status||'Unverified');
const expired=()=>!report||!loadedAt||Date.now()-loadedAt>15*60*1000;
function tableRows(container,records,cols){
  container.textContent='';
  for(const r of records){
    const tr=document.createElement('tr');
    for(const col of cols){
      const td=document.createElement(col.header?'th':'td');
      if(col.header)td.scope='row';
      td.textContent=String(col.get(r)??'—');
      if(col.field)td.dataset.field=col.field;
      tr.append(td);
    }
    container.append(tr);
  }
}
function renderDevice(){
  const a=report?.acceptance;if(!a)return;
  const roles=a.devices.roles||[],devices=a.devices.devices||[];
  tableRows($('build825RoleRows'),roles,[
    {header:true,get:r=>r.id},
    {get:r=>describe(r.status)},
    {get:r=>r.current_pass?'Current positive evidence':r.current_regression?'Current negative observation — investigate':'Not currently verified'},
    {get:r=>r.observed_at?formatTime(r.observed_at):'No dated observation'}
  ]);
  tableRows($('build825DeviceRows'),devices,[
    {header:true,get:r=>r.id},{get:r=>describe(r.status)},
    {get:r=>r.observed_at?formatTime(r.observed_at):'Not observed'}
  ]);
  const detail=$('build825DeviceStatus');
  detail.textContent=a.devices.reason+' Device data are from the separately permissioned I.T. authority; missing access remains unavailable, never treated as approved.';
}
function renderSourceCounts(){
  const list=$('build825Sources');list.textContent='';
  if(!report)return;
  const entries=Object.entries(report.acceptance.counts||{});
  for(const [key,value] of entries){
    const li=document.createElement('li');
    const title=key.replace(/([A-Z])/g,' $1').replaceAll('_',' ').toLowerCase();
    add(li,'strong',title+': ');
    add(li,'span',value.status==='available'?String(value.count)+' recorded':'Source unavailable');
    list.append(li);
  }
}
function renderModules(){
  const tbody=$('build825ModuleRows');tbody.textContent='';
  if(!report)return;
  const filter=$('build825StatusFilter').value,search=$('build825ModuleSearch').value.trim().toLowerCase();
  const a=report.acceptance;
  const aged=expired();
  const all=MODULE_BASELINE_825.map(m=>({...m,signal:aged?{status:'source_unavailable',label:'Snapshot expired — refresh'}:moduleSignal825(m,a)}));
  const filtered=all.filter(m=>(!search||(m.name+' '+m.note).toLowerCase().includes(search))&&
    (filter==='all'||m.signal.status===filter));
  tableRows(tbody,filtered,[
    {header:true,get:r=>r.name},
    {get:r=>r.built+'%'},
    {get:r=>r.proven+'%'},
    {get:r=>r.signal.label},
    {get:r=>r.source||'No direct source mapped; separate owner proof required'}
  ]);
  $('build825ModuleCount').textContent=filtered.length+' of '+MODULE_BASELINE_825.length+
    ' modules shown. Built/proven figures are fixed November 8 estimates, not recalculated from event counts.';
}
function render(){
  if(!report)return;
  const a=report.acceptance;
  $('build825SnapshotTime').textContent='Source snapshot generated '+formatTime(report.generated_at)+
    (expired()?' — expired; refresh required.':' — manual refresh; values are not continuous telemetry.');
  $('build825HandoffStatus').textContent=a.handoff.reason;
  $('build825HandoffStatus').dataset.status=a.handoff.status;
  $('build825OperationalStatus').textContent='Operational acceptance: '+a.operational_readiness+
    '. Canonical HOLD changed: NO. Owner review still required.';
  renderDevice();renderSourceCounts();renderModules();
}
async function load(){
  if(loading)return;loading=true;
  const button=$('build825Refresh');button.disabled=true;
  setStatus('Checking signed supervisor authority and reading dated source evidence…');
  try{
    const response=await fetch('/api/admin/worksite_field_acceptance_v825',{credentials:'include',cache:'no-store'});
    const data=await response.json().catch(()=>null);
    if(!response.ok||!data?.ok||data.build!==825||data.scope!=='signed_supervisor_read_only'||!data.acceptance)
      throw Error(data?.error||'Authorized field acceptance source unavailable.');
    report=data;loadedAt=Date.now();render();
    const unavailable=Object.values(data.acceptance.counts).filter(v=>v.status!=='available').length;
    setStatus('Signed supervisor snapshot read successfully. '+unavailable+
      ' source(s) unavailable; no field tests, provider transactions, module score changes or HOLD closure were performed.');
  }catch(error){
    report=null;loadedAt=null;
    $('build825RoleRows').textContent='';
    $('build825DeviceRows').textContent='';
    $('build825ModuleRows').textContent='';
    $('build825Sources').textContent='';
    $('build825HandoffStatus').textContent='Unavailable — no field acceptance evidence may be inferred.';
    $('build825DeviceStatus').textContent='Role and device evidence unavailable. Do not assume passed.';
    $('build825SnapshotTime').textContent='No current verified snapshot.';
    $('build825ModuleCount').textContent='No current authorized evidence. Estimated baseline is available in the audit document.';
    $('build825OperationalStatus').textContent='Operational acceptance HOLD. No source available.';
    setStatus(error.message||'Source unavailable',true);
  }finally{loading=false;button.disabled=false;}
}
export function startFieldAcceptance825(){
  $('build825Refresh').addEventListener('click',load);
  $('build825StatusFilter').addEventListener('change',renderModules);
  $('build825ModuleSearch').addEventListener('input',renderModules);
  load();
}
