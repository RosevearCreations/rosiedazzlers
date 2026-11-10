// Build 834: local release evidence and master-plane relationship review.
// Never publishes or sends a health or release event.
import {MASTER_STATUS_SCHEMA_834} from './build834-master-status.mjs';
const $=id=>document.getElementById(id);
const cell=(row,tag,value)=>{const e=document.createElement(tag);e.textContent=String(value??'UNKNOWN');row.append(e);return e;};
let report=null,loading=false;
function render(){
  const body=$('build834Rows');body.textContent='';
  if(!report){$('build834Summary').textContent='No authenticated source status. Independent release, health and integrations are UNKNOWN / HOLD.';return;}
  const r=report.lastVerifiedReleaseReference;
  const match=report.runtimeRevision.matchesLastHistoricalProductionProof;
  $('build834Summary').textContent='Last independently checked historical release: Build '+r.build+
    ', '+r.workflowConclusionAtObservation+' / '+r.jobCountAtObservation+' jobs; proof '+
    r.deploymentObservationFreshness+'. Current runtime revision '+(match===null?'unavailable':
      match?'matches that historical SHA':'differs from that historical SHA')+
    '. Neither case proves a current independent deployment readback.';
  const link=$('build834Proof');link.href=r.workflowUrl;link.textContent='Open historical exact-SHA workflow #'+r.workflowRunId;
  for(const peer of report.masterRelationship.links){
    const tr=document.createElement('tr'),header=cell(tr,'th',peer.sourceId);header.scope='row';
    cell(tr,'td',peer.role+' · '+peer.boundary);
    cell(tr,'td',peer.purpose);
    cell(tr,'td',peer.receiverStatus);
    cell(tr,'td',peer.contract+' · '+peer.direction);body.append(tr);
  }
  $('build834Event').textContent=report.consumerEventContract.targetFamilies.join(' / ')+
    ' · unsigned, no approved audience, missing evidence expiry, sequence and independent ACK. '+
    'Payload drafts intentionally fail the ingestible contract.';
}
async function refresh(){
  if(loading)return;loading=true;$('build834Refresh').disabled=true;
  $('build834State').textContent='Reading original-session Rosie source status…';
  try{
    const res=await fetch('/api/admin/master_shell_status_v834',{credentials:'same-origin',cache:'no-store'});
    const data=await res.json().catch(()=>null);
    if(!res.ok||!data?.ok||data.build!==834||data.report?.schema!==MASTER_STATUS_SCHEMA_834||
      data.report.sourceHealth?.connectionState!=='DISCONNECTED / HOLD'||
      data.report.consumerEventContract?.publishEligible!==false||
      data.report.acceptance?.canonicalHoldChanged!==false||
      data.report.masterRelationship?.links?.length!==6)
      throw Error('Untrusted status source');
    report=data.report;
    $('build834State').textContent='Read-only Rosie process observation at '+report.generatedAt+
      '. Comms DISCONNECTED / HOLD; Master event delivery not authorized.';
  }catch{
    report=null;$('build834Proof').removeAttribute('href');
    $('build834Proof').textContent='No independently confirmed release report available here';
    $('build834Event').textContent='Master event contract NOT ACTIVE.';
    $('build834State').textContent='Private report unavailable or access denied; source and connection state UNKNOWN / HOLD.';
  }finally{loading=false;$('build834Refresh').disabled=false;render();}
}
export function startMasterStatus834(){$('build834Refresh').addEventListener('click',refresh);render();refresh();}
