// Build 826: guided staff observation, separate reviewer and local module history.
// This workflow records operator reports. It does not approve source signers,
// connect Comms, notify customers, or change master completion percentages.
import {MODULE_BASELINE_825} from './build825-module-baseline.mjs';
import {validateEvidence826,ROSIE_SHELL_826} from './build826-field-evidence-contract.mjs';

const $=id=>document.getElementById(id);
const URL='/api/admin/worksite_field_evidence_v826';
let events=[],pending=null,loading=false,ready=false;
const status=(msg,error=false)=>{const e=$('build826Status');if(e){e.textContent=msg;e.dataset.status=error?'error':'info';}};
const nowInput=()=>{const d=new Date(),pad=n=>String(n).padStart(2,'0');return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())+'T'+pad(d.getHours())+':'+pad(d.getMinutes());};
const when=v=>{const d=new Date(v);return Number.isFinite(d.getTime())?d.toLocaleString('en-CA',{dateStyle:'medium',timeStyle:'short'}):'Unverified date';};
const item=(parent,tag,value)=>{const e=document.createElement(tag);e.textContent=String(value??'');parent.append(e);return e;};
function fillSelect(id,rows,prompt,make){
  const el=$(id),previous=el.value;el.textContent='';
  const empty=document.createElement('option');empty.value='';empty.textContent=prompt;el.append(empty);
  for(const row of rows){
    const o=document.createElement('option');const {id,label}=make(row);
    o.value=id;o.textContent=label;el.append(o);
  }
  el.value=rows.some(r=>r.id===previous)?previous:'';
}
function renderHistory(){
  const table=$('build826HistoryRows');table.textContent='';
  for(const e of events.slice(0,75)){
    const tr=document.createElement('tr');
    const module=MODULE_BASELINE_825.find(m=>m.id===e.module_id)?.name;
    for(const value of [when(e.recorded_at),e.event_kind,
      module||e.role_id||'—',e.device_class||e.review_state||e.observed_outcome||'—',
      e.evidence_ref||'—']){
      item(tr,'td',value);
    }
    table.append(tr);
  }
  $('build826HistoryStatus').textContent=events.length+
    ' latest local ledger event(s) shown (maximum 100 loaded). These are operator-reported records, not original owner receipts or independent production acceptance.';
}
function renderTargets(){
  fillSelect('build826SignoffTarget',events.filter(e=>e.event_kind==='observation'), 'Choose an observation to review',
    e=>({id:e.id,label:when(e.recorded_at)+' · '+e.role_id+'/'+e.device_class+' · '+e.observed_outcome+' · '+e.id.slice(-8)}));
  fillSelect('build826ModuleTarget',events.filter(e=>e.event_kind==='signoff'&&e.review_state==='accepted_for_review'),
    'Choose a separately accepted field signoff',
    e=>({id:e.id,label:when(e.recorded_at)+' · reviewed '+e.target_event_id?.slice(-8)+' · '+e.id.slice(-8)}));
}
function renderMaster(preview){
  const el=$('build826MasterState');el.textContent='';
  if(!preview){el.textContent='Master Shell reporting proposal unavailable; no integration state can be inferred.';return;}
  const p=document.createElement('p');
  p.textContent=ROSIE_SHELL_826.sourceId+' / '+ROSIE_SHELL_826.shellBoundary+' · '+
    preview.connectionState+' · '+preview.contractStatus+' · '+(preview.sourceRevision||'unknown source revision');
  el.append(p);
  const detail=document.createElement('p');
  detail.textContent='AI Data Platform is the completion-scoring authority; '+MODULE_BASELINE_825.length+
    ' provisional module estimates are presented here with no approved requirement denominators. No cross-application event was sent.';
  el.append(detail);
  const step=document.createElement('p');
  step.textContent=preview.nextStep||'Original source and master owner trust remains HELD.';
  el.append(step);
}
async function load(){
  if(loading)return;loading=true;$('build826Refresh').disabled=true;status('Refreshing signed supervisor evidence and source history…');
  try{
    const response=await fetch(URL,{credentials:'include',cache:'no-store'});
    const data=await response.json().catch(()=>null);
    if(!response.ok||!data?.ok||data.build!==826||data.scope!=='signed_supervisor_local_evidence_only'||!Array.isArray(data.events))
      throw Error(data?.error||'Private field evidence is unavailable.');
    ready=true;events=data.events.slice(0,100);
    renderHistory();renderTargets();renderMaster(data.master_preview);
    status('Source verified at '+when(data.generated_at)+'. Historical observations require separate review; canonical HOLD and percentages remain unchanged.');
  }catch(error){
    ready=false;events=[];
    renderHistory();renderTargets();renderMaster(null);
    status(error.message||'Source unavailable',true);
  }finally{
    loading=false;$('build826Refresh').disabled=false;
    for(const id of ['build826CaptureSubmit','build826SignoffSubmit','build826ModuleSubmit'])$(id).disabled=!ready;
  }
}
function payload(kind){
  const ref=$('build826EvidenceRef').value.trim();
  const common={event_kind:kind,evidence_ref:ref};
  if(kind==='observation'){
    const d=new Date($('build826ObservedAt').value);
    return {...common,role_id:$('build826Role').value,device_class:$('build826Device').value,
      browser_class:$('build826Browser').value,route_path:$('build826Route').value.trim(),
      viewport_width:Number($('build826Viewport').value),observed_outcome:$('build826Outcome').value,
      observed_at:Number.isFinite(d.getTime())?d.toISOString():''};
  }
  if(kind==='signoff')return {...common,target_event_id:$('build826SignoffTarget').value,
    review_state:$('build826SignoffDecision').value};
  const state=$('build826ModuleState').value,target=$('build826ModuleTarget').value;
  return {...common,module_id:$('build826ModuleId').value,review_state:state,
    ...(state==='owner_review_candidate'?{target_event_id:target}:{})};
}
async function send(kind){
  if(!ready){status('An authenticated supervisor source refresh is required.',true);return;}
  if(!globalThis.crypto?.randomUUID){status('Secure request IDs unavailable. Use a current browser.',true);return;}
  const candidate=payload(kind);
  const fingerprint=JSON.stringify(candidate);
  if(!pending||pending.fingerprint!==fingerprint)pending={fingerprint,id:crypto.randomUUID()};
  const body={...candidate,request_id:pending.id};
  if(!validateEvidence826(body)){status('Check required date, safe route, original reference, role/device or review target. No record was sent.',true);return;}
  for(const id of ['build826CaptureSubmit','build826SignoffSubmit','build826ModuleSubmit'])$(id).disabled=true;
  status('Recording a local source event; this is not an independent source signer or a master completion approval…');
  try{
    const response=await fetch(URL,{method:'POST',credentials:'include',
      headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    const result=await response.json().catch(()=>null);
    if(!response.ok||!result?.ok||!result.source_recorded||!result.event_id)
      throw Error(result?.error||'Evidence write could not be confirmed.');
    await load();
    if(!ready||!events.some(e=>e.id===result.event_id))
      throw Error('Source may have accepted the event, but exact history readback is unavailable. Keep the request ID and refresh; do not resubmit a different event.');
    pending=null;
    status('Source event '+result.event_id.slice(-8)+' recorded and independently read back. '+
      'This is operator-supplied evidence, not cryptographic owner approval, actual device attestation, or automatic module readiness.');
    $('build826Status').focus({preventScroll:false});
  }catch(error){status(error.message||'No evidence confirmed.',true);}
  finally{for(const id of ['build826CaptureSubmit','build826SignoffSubmit','build826ModuleSubmit'])$(id).disabled=!ready;}
}
export function startGuidedEvidence826(){
  $('build826ObservedAt').value=nowInput();
  const mod=$('build826ModuleId');for(const m of MODULE_BASELINE_825){
    const option=document.createElement('option');option.value=m.id;option.textContent=m.name+' · baseline '+m.built+'% built / '+m.proven+'% proven';mod.append(option);
  }
  $('build826Refresh').addEventListener('click',load);
  $('build826CaptureSubmit').addEventListener('click',()=>send('observation'));
  $('build826SignoffSubmit').addEventListener('click',()=>send('signoff'));
  $('build826ModuleSubmit').addEventListener('click',()=>send('module_review'));
  load();
}
