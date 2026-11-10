import {SUITE_PILOT_SCHEMA_840,reconcileSuitePilot840} from './build840-suite-pilot.mjs';

const $=id=>document.getElementById(id);
const append=(parent,tag,value)=>{
  const element=document.createElement(tag);element.textContent=String(value??'UNKNOWN');
  parent.append(element);return element;
};
let inFlight=false;
const read=async path=>{
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),7000);
  try{
    const response=await fetch(path,{credentials:'same-origin',cache:'no-store',
      headers:{Accept:'application/json'},signal:controller.signal});
    return {status:response.status,body:await response.json().catch(()=>null)};
  }catch{return {status:503,body:null};}finally{clearTimeout(timer);}
};
const render=(report)=>{
  const rows=$('build840SourceRows'),routes=$('build840RouteRows'),topology=$('build840Topology');
  rows.textContent='';routes.textContent='';topology.textContent='';
  for(const item of report?.topology??[]){
    const row=document.createElement('li');
    append(row,'strong',item.id+' · '+item.role+' · ');
    append(row,'span',item.boundary+' · '+item.trustState);
    topology.append(row);
  }
  for(const row of report?.comparisons??[]){
    const tr=document.createElement('tr');
    const th=append(tr,'th','Build '+row.build+' · '+row.id);th.scope='row';
    append(tr,'td',row.state);
    append(tr,'td',row.observedAt||'No current trusted timestamp');
    const cell=document.createElement('td'),link=document.createElement('a');
    link.href=row.path;link.textContent='Protected Rosie source';cell.append(link);tr.append(cell);
    rows.append(tr);
  }
  for(const row of report?.routes??[]){
    const tr=document.createElement('tr');
    const th=append(tr,'th',row.name);th.scope='row';
    append(tr,'td',row.source+' → '+row.destinations.join(', '));
    append(tr,'td',row.state+' · '+row.required);
    append(tr,'td',row.owner);routes.append(tr);
  }
  $('build840Gate').textContent='Final business gate: HOLD · '+
    (report?.finalBusinessGate?.reason||'Original evidence unavailable.');
  $('build840Summary').textContent=report?.localReconciliation?
    `${report.localReconciliation.compatibleSourceReports} of 6 local Rosie reports are compatible; `+
      `${report.localReconciliation.conflictOrStaleCount} conflicting/stale and `+
      `${report.localReconciliation.missingOrUnauthorizedCount} missing/unauthorized. `+
      'Zero external consumer responses or original owner signatures verified.':
    'Private local source comparison not yet performed; zero external consumer claims verified.';
  $('build840Release').textContent='Runtime commit claim: '+
    (report?.runtimeRevisionClaim?.slice(0,12)||'unavailable')+
    ' · software Production GREEN requires separate exact-SHA GitHub/Cloudflare verification.';
};
async function refresh(){
  if(inFlight)return;inFlight=true;$('build840Refresh').disabled=true;
  $('build840State').textContent='Comparing current authenticated Rosie source reports once…';
  try{
    const base=await read('/api/admin/suite_pilot_final_business_gate_v840');
    if(base.status!==200||base.body?.ok!==true||
       base.body?.report?.schema!==SUITE_PILOT_SCHEMA_840||
       base.body?.report?.sourceId!=='rosiedazzlers'||
       base.body?.report?.signedStaffSession!==true)
      throw Error('Private Rosie administrator scope unavailable');
    const report=base.body.report;
    const all=await Promise.all(report.comparisons.map(async row=>[row.id,await read(row.path)]));
    const reconciled=reconcileSuitePilot840(report,Object.fromEntries(all),Date.now());
    if(reconciled.finalBusinessGate.state!=='HOLD'||reconciled.effects.databaseWrites!==0||
       reconciled.effects.masterEventsPublished!==0)throw Error('Unauthorized promotion');
    render(reconciled);
    $('build840State').textContent=reconciled.localReconciliation.status+
      ' · read-only, source-owned and explicitly not cross-app acceptance.';
  }catch{
    render(null);
    $('build840State').textContent='Local private source unavailable · HOLD / UNKNOWN. No claim of connection.';
  }finally{inFlight=false;$('build840Refresh').disabled=false;}
}
export function startSuitePilot840(){
  if(!$('build840Refresh'))return;
  $('build840Refresh').addEventListener('click',refresh);
  render(null);
  // No hidden background polling, cross-origin reads or automatic retry.
}
