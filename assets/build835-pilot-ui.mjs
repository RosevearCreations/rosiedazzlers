// Read-only human-readable 835 pilot, no original GET or owner approval action.
import {MASTER_PILOT_SCHEMA_835} from './build835-master-pilot.mjs';
const $=id=>document.getElementById(id);
let busy=false;
function paint(report){
  const rows=$('build835Steps');rows.textContent='';
  if(!report){
    $('build835Summary').textContent='Source readiness unavailable. Original private approval, signed receipt and connection remain HOLD.';
    return;
  }
  $('build835Summary').textContent='Rosie '+report.source.sourceId+' · '+
    report.outcome.softwareReadiness+' · '+report.outcome.connectionState+
    '. This is only a local operator status preview; no original health GET, owner proof, signed receipt or Master event was performed.';
  for(const step of report.steps){
    const tr=document.createElement('tr');
    for(const value of [step.id,step.label,step.status,step.owner]){
      const td=document.createElement('td');td.textContent=value;tr.append(td);
    }
    rows.append(tr);
  }
  $('build835Next').textContent=report.nextAction;
}
async function refresh(){
  if(busy)return;busy=true;$('build835Refresh').disabled=true;
  $('build835State').textContent='Checking signed-in Rosie source readiness…';
  try{
    const response=await fetch('/api/admin/master_shell_pilot_v835',
      {credentials:'same-origin',cache:'no-store'});
    const json=await response.json().catch(()=>null),report=json?.report;
    if(!response.ok||json?.ok!==true||report?.schema!==MASTER_PILOT_SCHEMA_835||
       report.source?.sourceId!=='rosiedazzlers'||report.pilot?.sourceCount!==1||
       report.pilot?.sourceGetExecutedHere!==false||
       report.pilot?.sourceSignedReceiptVerifiedHere!==false||
       report.outcome?.connected!==false||
       report.outcome?.connectionState!=='DISCONNECTED / HOLD'||
       report.outcome?.canonicalHoldChanged!==false||
       !Array.isArray(report.steps)||report.steps.length!==7)
      throw Error('No trusted source preview');
    paint(report);
    $('build835State').textContent='Source-local pilot readiness read at '+report.generatedAt+
      '. No original TEST executed; connection HOLD.';
  }catch{
    paint(null);$('build835Next').textContent='Authenticate as Rosie supervisor; original TEST must remain in its protected owner workflow.';
    $('build835State').textContent='Private status denied or unavailable; fail-closed HOLD.';
  }finally{busy=false;$('build835Refresh').disabled=false;}
}
export function startOwnerPilot835(){
  $('build835Refresh').addEventListener('click',refresh);
  paint(null);refresh();
}
