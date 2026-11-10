// Authenticated Rosie-only status renderer. No publish, retry, ACK or owner signoff.
import {PUBLICATION_SCHEMA_836} from './build836-publication-readiness.mjs';
const $=id=>document.getElementById(id);
let busy=false;
function render(report){
  const gates=$('build836Gates'),consumers=$('build836Consumers');
  gates.textContent='';consumers.textContent='';
  if(!report){
    $('build836Summary').textContent='Private source status unavailable. No original publisher, event delivery or ACK is verified.';
    return;
  }
  $('build836Summary').textContent='Rosie '+report.source.sourceId+' · '+
    report.outcome.connectionState+' · '+report.consumers.length+
    ' proposed master audiences. Published here: '+report.outcome.masterEventsSent+
    '. This page cannot approve or send events.';
  for(const row of report.gates){
    const tr=document.createElement('tr');
    for(const value of [row.id,row.label,row.state,row.owner]){
      const td=document.createElement('td');td.textContent=value;tr.append(td);
    }gates.append(tr);
  }
  for(const row of report.consumers){
    const tr=document.createElement('tr');
    for(const value of [row.sourceId,row.purpose,row.state,
      `${row.outboundEvents} / ${row.acceptedReceipts}`]){
      const td=document.createElement('td');td.textContent=value;tr.append(td);
    }consumers.append(tr);
  }
  $('build836Next').textContent=report.nextAction;
}
async function refresh(){
  if(busy)return;busy=true;$('build836Refresh').disabled=true;
  $('build836State').textContent='Checking private source-only publication readiness…';
  try{
    const res=await fetch('/api/admin/master_shell_publication_v836',
      {credentials:'same-origin',cache:'no-store'});
    const data=await res.json().catch(()=>null),report=data?.report;
    if(!res.ok||data?.ok!==true||report?.schema!==PUBLICATION_SCHEMA_836||
       report.source?.sourceId!=='rosiedazzlers'||
       report.outcome?.connectionState!=='DISCONNECTED / HOLD'||
       report.outcome?.connected!==false||
       report.outcome?.masterEventsSent!==0||
       report.outcome?.originalPublisherInstalledInWeb!==false||
       !Array.isArray(report.gates)||report.gates.length!==8||
       !Array.isArray(report.consumers)||report.consumers.length!==2)
      throw Error('No trusted local readiness');
    render(report);
    $('build836State').textContent='Rosie local readiness read at '+report.generatedAt+
      '. Original event publication not executed; HOLD.';
  }catch{
    render(null);
    $('build836Next').textContent='Sign in as authorized Rosie supervisor; original source and consumer approvals remain separate.';
    $('build836State').textContent='Read denied or unavailable; fail-closed HOLD.';
  }finally{busy=false;$('build836Refresh').disabled=false;}
}
export function startPublicationReadiness836(){
  const b=$('build836Refresh');if(!b)return;
  b.addEventListener('click',refresh);render(null);refresh();
}
