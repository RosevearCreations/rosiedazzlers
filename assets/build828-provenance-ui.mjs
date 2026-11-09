// Build 828: human-readable bounded provenance, not an independent attestation.
import {provenanceReport828} from './build828-evidence-provenance.mjs';
import {MODULE_REQUIREMENT_SCOPES_827} from './build827-module-requirements.mjs';

const $=id=>document.getElementById(id);
const names=new Map(MODULE_REQUIREMENT_SCOPES_827.map(x=>[x.moduleId,x.moduleName]));
let report=provenanceReport828(),sourceAvailable=false,loading=false;
const add=(parent,tag,value)=>{const el=document.createElement(tag);el.textContent=String(value??'—');parent.append(el);return el;};
const formatTime=value=>{
  if(!value)return 'UNKNOWN';
  const date=new Date(value);
  return Number.isFinite(date.getTime())?date.toLocaleString('en-CA',{
    dateStyle:'medium',timeStyle:'short'}):'UNKNOWN';
};
const issues=values=>values?.length?values.join(', '):'None in bounded chain';

function render(){
  const search=$('build828Search').value.trim().toLowerCase(),filter=$('build828Filter').value;
  const tbody=$('build828Rows');tbody.textContent='';
  const shown=report.scopeTraces.filter(scope=>{
    if(filter==='linked'&&scope.latestChainStatus!=='LOCAL_CHAIN_LINKED_UNVERIFIED')return false;
    if(filter==='conflict'&&scope.latestChainStatus!=='CONFLICT')return false;
    if(filter==='partial'&&scope.latestChainStatus!=='PARTIAL_RECENT_HISTORY')return false;
    if(filter==='due'&&scope.latestEvidenceFreshness!=='DRAFT_REVIEW_DUE')return false;
    if(filter==='reopen'&&!scope.reopenAdvisory)return false;
    return !search||(names.get(scope.moduleId)+' '+scope.scopeId+' '+scope.requirementId)
      .toLowerCase().includes(search);
  });
  for(const scope of shown){
    const tr=document.createElement('tr');
    const th=add(tr,'th',names.get(scope.moduleId));th.scope='row';
    add(th,'small',scope.scopeId);
    add(tr,'td',sourceAvailable?scope.latestChainStatus:'SOURCE_UNAVAILABLE_UNKNOWN');
    add(tr,'td',sourceAvailable?scope.latestDecision:'UNKNOWN');
    add(tr,'td',sourceAvailable?scope.latestEvidenceFreshness:'UNKNOWN');
    const detail=document.createElement('td');
    const details=document.createElement('details');
    const summary=add(details,'summary',scope.recentDecisions.length+
      ' recent decision(s) · view local trace');
    summary.setAttribute('aria-label','View local decision trace for '+names.get(scope.moduleId));
    if(scope.reopenAdvisory)add(details,'p','Possible later return/reopen based on local decision order; not an owner-authorized reopen.');
    if(!scope.recentDecisions.length)add(details,'p','No decision in the latest 100 source events. Older events may exist.');
    const list=document.createElement('ol');
    for(const entry of scope.recentDecisions){
      const li=document.createElement('li');
      add(li,'strong',entry.decision+' · '+formatTime(entry.recordedAt)+' · local event '+entry.reviewEventId.slice(-8));
      add(li,'p','Local reference: '+(entry.evidenceRef||'UNKNOWN')+'; chain: '+entry.chainStatus+
        '; signoff: '+(entry.signoffEventId?.slice(-8)||'UNKNOWN')+
        '; observation: '+(entry.observationEventId?.slice(-8)||'UNKNOWN'));
      add(li,'p','Outcome: '+(entry.observationOutcome||'UNKNOWN')+'; role/device: '+
        (entry.observedRole||'UNKNOWN')+'/'+(entry.observedDevice||'UNKNOWN')+
        '; observed: '+formatTime(entry.observedAt));
      add(li,'p','Review signals: '+issues(entry.issueCodes)+
        '; suggested check by: '+formatTime(entry.proposedReviewDueAt));
      list.append(li);
    }
    details.append(list);detail.append(details);tr.append(detail);tbody.append(tr);
  }
  $('build828Count').textContent=shown.length+'/'+report.scopeCount+' module scopes shown. '+
    (sourceAvailable?'Recent local chains linked: '+report.localLinkedScopeCount+
      '; conflicts: '+report.conflictScopeCount+'; partial: '+report.partialHistoryScopeCount+
      '; 30-day review advisories: '+report.draftReviewDueCount+
      '; inferred reopen advisories: '+report.inferredReopenCount+'.':
      'Private source unavailable; all actual chain states UNKNOWN.')+
    ' No independent acceptance, approved denominator or Comms connection is claimed.';
}

async function refresh(){
  if(loading)return;loading=true;const button=$('build828Refresh');button.disabled=true;
  $('build828Status').textContent='Checking authenticated source event lineage…';
  try{
    const response=await fetch('/api/admin/worksite_field_evidence_v826',{
      credentials:'include',cache:'no-store'});
    const data=await response.json().catch(()=>null);
    if(!response.ok||!data?.ok||data.build!==826||
      data.requirement_provenance_preview?.schema!==report.schema||
      data.requirement_provenance_preview.scopeCount!==45)
      throw Error('Bounded supervisor provenance source unavailable');
    report=data.requirement_provenance_preview;sourceAvailable=true;
    $('build828Status').textContent='Local append-only source read at '+formatTime(data.generated_at)+
      '. Latest '+report.sourceWindowReturned+'/100 records only; older targets may be outside the window. '+
      'A 30-day reminder is a draft triage policy, not expiration of evidence or module approval.';
  }catch{
    report=provenanceReport828();sourceAvailable=false;
    $('build828Status').textContent='Source unavailable. No evidence was inferred, expired, accepted, reopened or scored.';
  }finally{loading=false;button.disabled=false;render();}
}
export function startProvenance828(){
  $('build828Search').addEventListener('input',render);
  $('build828Filter').addEventListener('change',render);
  $('build828Refresh').addEventListener('click',refresh);
  render();refresh();
}
