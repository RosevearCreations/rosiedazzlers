// Build 833: evidence review only. No route activation or outbound UI actions.
import {COMMS_SCHEMA_833} from './build833-comms-boundary.mjs';
const $=id=>document.getElementById(id);
const cell=(parent,tag,value)=>{const el=document.createElement(tag);
  el.textContent=String(value??'UNKNOWN');parent.append(el);return el;};
let report=null,busy=false;
function render(){
  const table=$('build833Rows');table.textContent='';
  if(!report){$('build833Count').textContent='No private source snapshot; all Comms incident and consent routes HOLD.';return;}
  for(const record of report.rows){
    const tr=document.createElement('tr');const heading=cell(tr,'th',record.label);heading.scope='row';
    cell(tr,'td',record.source+'; '+record.audience);
    cell(tr,'td',record.privacy);
    cell(tr,'td',record.reason+' · '+record.contractReviewState);
    const td=document.createElement('td');const details=document.createElement('details');
    cell(details,'summary','Required authority and next action');
    cell(details,'p',record.authority);cell(details,'p',record.operation);
    cell(details,'p','Route: '+record.route+'; last local source: '+(record.latestSourceAt||'UNKNOWN'));
    td.append(details);const link=cell(td,'a','Open Rosie source review');
    link.href=record.next;link.className='btn ghost';tr.append(td);table.append(tr);
  }
  const pending=(report.issueStatuses.pending_review||0)+(report.issueStatuses.reviewing||0);
  $('build833Count').textContent=report.sourceCounts.issues+' sampled source concerns ('+pending+
    ' locally open), '+report.sourceCounts.staffReportedHandoffs+' staff-reported contact outcomes. '+
    (report.sourceWindowsAtCap?'At least one source window is full; older records may be omitted. ':'')+
    'None proves current customer consent, independent provider delivery or approved Comms routing.';
}
async function refresh(){
  if(busy)return;busy=true;$('build833Refresh').disabled=true;
  $('build833Status').textContent='Checking original-session Rosie source records…';
  try{
    const response=await fetch('/api/admin/comms_boundary_review_v833',
      {credentials:'same-origin',cache:'no-store'});
    const body=await response.json().catch(()=>null);
    if(!response.ok||!body?.ok||body.build!==833||body.report?.schema!==COMMS_SCHEMA_833||
      body.report.sourceConnectionState!=='DISCONNECTED / HOLD'||
      body.report.canonicalHoldChanged!==false||body.report.rows?.length!==5||
      body.report.rows.some(x=>x.contractReviewState!=='HOLD'||x.outboundEligible!==false))
      throw Error('Untrusted private source report');
    report=body.report;
    $('build833Status').textContent='Local source review only · Comms DISCONNECTED / HOLD · '+
      'zero authorized outbound routes. Sampled '+report.sampledAt+'.';
  }catch{
    report=null;
    $('build833Status').textContent='Private source unavailable or access denied. '+
      'No consent, incident authority or Comms connectivity inferred.';
  }finally{busy=false;$('build833Refresh').disabled=false;render();}
}
export function startCommsReview833(){
  $('build833Refresh').addEventListener('click',refresh);render();refresh();
}
