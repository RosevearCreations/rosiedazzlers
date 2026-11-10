import {CONTINUITY_SCHEMA_837} from './build837-consent-incident-continuity.mjs';
const $=id=>document.getElementById(id);
let refreshing=false;
function show(report){
  const gates=$('build837Gates'),journeys=$('build837Journeys');
  gates.textContent='';journeys.textContent='';
  if(!report){$('build837Summary').textContent='No verified Rosie session or original consent evidence; messaging and incidents HOLD.';return;}
  $('build837Summary').textContent=`${report.source.id} · ${report.outcome.state} · `+
    `${report.outcome.messagesSent} outbound messages · ${report.outcome.providerReceiptsVerified} verified provider receipts. `+
    'Archived or acknowledged alerts are not resolved incidents.';
  for(const row of report.journeys){
    const tr=document.createElement('tr');
    for(const value of [row.id,row.purpose,row.channels.join(', '),row.outcome]){
      const td=document.createElement('td');td.textContent=value;tr.append(td);
    }journeys.append(tr);
  }
  for(const row of report.gates){
    const tr=document.createElement('tr');
    for(const value of [row.id,row.required,row.state,row.owner]){
      const td=document.createElement('td');td.textContent=value;tr.append(td);
    }gates.append(tr);
  }
  $('build837Next').textContent=report.nextAction;
}
async function refresh(){
  if(refreshing)return;refreshing=true;$('build837Refresh').disabled=true;
  $('build837State').textContent='Checking private Rosie consent/incident readiness (no send)…';
  try{
    const response=await fetch('/api/admin/comms_consent_incident_continuity_v837',
      {credentials:'same-origin',cache:'no-store'});
    const data=await response.json().catch(()=>null),report=data?.report;
    if(!response.ok||data?.ok!==true||report?.schema!==CONTINUITY_SCHEMA_837||
       report?.source?.id!=='rosiedazzlers'||report?.outcome?.state!=='DISCONNECTED / HOLD'||
       report?.outcome?.outboundEligible!==false||report?.outcome?.messagesSent!==0||
       report?.outcome?.providerReceiptsVerified!==0||report?.incidents?.sourceIncidentsMutated!==0||
       !Array.isArray(report.gates)||report.gates.length!==8||
       !Array.isArray(report.journeys)||report.journeys.length!==3)
      throw Error('Unverified source readiness');
    show(report);$('build837State').textContent='Local readiness checked '+report.generatedAt+
      ' · no delivery or incident closure; original Comms/AI Data HOLD.';
  }catch{
    show(null);$('build837State').textContent='Unauthorized or unavailable · fail-closed HOLD.';
    $('build837Next').textContent='An authorized Rosie source supervisor must review original consent and issue evidence.';
  }finally{refreshing=false;$('build837Refresh').disabled=false;}
}
export function startConsentIncidentContinuity837(){
  if(!$('build837Refresh'))return;
  $('build837Refresh').addEventListener('click',refresh);show(null);refresh();
}
