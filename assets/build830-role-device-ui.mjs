// Supervisor-guided walkthrough only. Clicking Prepare never fabricates a session.
import {ROLE_DEVICE_MATRIX_830,ROLE_DEVICE_SCHEMA_830} from './build830-role-device-recovery.mjs';

const $=id=>document.getElementById(id);
let report=null,loading=false;
const add=(parent,tag,value)=>{const el=document.createElement(tag);
  el.textContent=String(value??'UNKNOWN');parent.append(el);return el;};
const when=value=>{
  const d=new Date(value||'');return Number.isFinite(d.getTime())?
    d.toLocaleString('en-CA',{dateStyle:'medium',timeStyle:'short'}):'UNKNOWN';
};
const roleLabel={customer:'Customer',detailer:'Detailer',operations:'Operations',admin:'Admin'};
function prepare(cell){
  const role=$('build826Role'),device=$('build826Device'),route=$('build826Route');
  if(!role||!device||!route)return;
  role.value=cell.roleId;device.value=cell.deviceClass;
  // Clear all context-sensitive defaults so the operator must observe and
  // re-enter the actual browser, route, width, outcome, date and safe reference.
  route.value='';$('build826Browser').selectedIndex=-1;
  $('build826Viewport').value='';$('build826Outcome').selectedIndex=-1;
  $('build826ObservedAt').value='';$('build826EvidenceRef').value='';
  $('build830Status').textContent='Prepared '+roleLabel[cell.roleId]+'/'+cell.deviceClass+
    ' in the existing observation form only. On the real signed-in device, confirm browser, '+
    'current route, viewport, outcome and date before recording; no event has been saved.';
  $('build826GuidedEvidence').scrollIntoView({behavior:'auto',block:'start'});
  route.focus({preventScroll:true});
}
function render(){
  const tbody=$('build830Rows');tbody.textContent='';
  if(!report){$('build830Count').textContent='No authorized source. All actual role/device outcomes UNKNOWN; readiness HOLD.';return;}
  const role=$('build830RoleFilter').value,status=$('build830StateFilter').value;
  const shown=report.cells.filter(c=>(role==='all'||c.roleId===role)&&
    (status==='all'||status==='negative'&&c.status==='CURRENT_LOCAL_FAILURE_OR_BLOCK'||
      status==='retest'&&c.status==='LOCAL_RETEST_REVIEW_REQUIRED'||
      status==='review'&&['LOCAL_PASS_SIGNED_FOR_REVIEW','LOCAL_PASS_NEEDS_SEPARATE_REVIEW',
        'RETURNED_FOR_NEW_EVIDENCE'].includes(c.status)||
      status==='missing'&&['NO_RECENT_SOURCE_OBSERVATION','SOURCE_EVENT_CONFLICT','DRAFT_FOLLOWUP_DUE'].includes(c.status)));
  for(const cell of shown){
    const tr=document.createElement('tr');
    const th=add(tr,'th',roleLabel[cell.roleId]+' / '+cell.deviceClass);th.scope='row';
    add(th,'small',cell.cellId);
    add(tr,'td',cell.status);
    add(tr,'td',cell.latestOutcome||'UNKNOWN');
    add(tr,'td',when(cell.latestObservedAt)+' · '+(cell.latestBrowser||'browser UNKNOWN')+
      ' · '+(cell.latestViewportWidth?cell.latestViewportWidth+'px':'width UNKNOWN'));
    add(tr,'td',cell.latestSignoffState);
    const actions=document.createElement('td');
    const details=document.createElement('details');
    const summary=add(details,'summary','Recovery / evidence steps');
    summary.setAttribute('aria-label','Review recovery guidance for '+roleLabel[cell.roleId]+' '+cell.deviceClass);
    add(details,'p',cell.recoveryAction);
    add(details,'p','Latest route: '+(cell.latestRoute||'UNKNOWN')+
      '. Local history may omit earlier events. Do not treat a retest as closing a prior failure.');
    actions.append(details);
    const button=add(actions,'button','Prepare observation form');button.type='button';
    button.className='btn ghost';button.addEventListener('click',()=>prepare(cell));
    tr.append(actions);tbody.append(tr);
  }
  $('build830Count').textContent=shown.length+'/'+report.cellCount+' role/device cells shown; '+
    report.reviewedLocalPassCount+' locally signed-for-review, '+
    report.currentLocalNegativeCount+' latest negative, '+
    report.retestReviewRequiredCount+' retest follow-up. Independently accepted cells UNKNOWN; '+
    'no automatic owner acceptance or scoring.';
}
async function refresh(){
  if(loading)return;loading=true;$('build830Refresh').disabled=true;
  $('build830Status').textContent='Reading private recent role/device source observations…';
  try{
    const response=await fetch('/api/admin/worksite_field_evidence_v826',{
      credentials:'same-origin',cache:'no-store'});
    const data=await response.json().catch(()=>null);
    if(!response.ok||!data?.ok||data.build!==826||
      data.role_device_recovery_preview?.schema!==ROLE_DEVICE_SCHEMA_830||
      data.role_device_recovery_preview.cellCount!==ROLE_DEVICE_MATRIX_830.length)
      throw Error('Authenticated local evidence unavailable');
    report=data.role_device_recovery_preview;
    $('build830Status').textContent='Private ledger read ('+report.sourceWindowReturned+'/100 latest records). '+
      '12 cell projections are local only; original device sessions and independent I.T./owner '+
      'acceptance still require actual field walkthroughs.';
  }catch{
    report=null;$('build830Status').textContent='Private source unavailable or access denied. '+
      'No real-device result, repair, clearance or module score was inferred.';
  }finally{loading=false;$('build830Refresh').disabled=false;render();}
}
export function startRoleDeviceRecovery830(){
  $('build830RoleFilter').addEventListener('change',render);
  $('build830StateFilter').addEventListener('change',render);
  $('build830Refresh').addEventListener('click',refresh);
  render();refresh();
}
