// Build 824: source-backed, authorized supervisor-only handoff notes.
// No browser persistence, automatic customer message, or booking mutation.
import { sourceFreshness823 } from './build823-supervisor-exception-review.mjs';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const API='/api/admin/worksite_review_notes_v824';
const $=id=>document.getElementById(id);
const cleanTime=value=>{
  const n=Date.parse(value);
  return Number.isFinite(n)?new Date(n).toLocaleString('en-CA',{dateStyle:'medium',timeStyle:'short'}):'Time unverified';
};
const validText=text=>typeof text==='string'&&text.trim().length>=12&&text.trim().length<=500;
export function createSupervisorHandoff824({refresh}={}){
  let actor='',rows=[],canManage=false,loaded=false,loadedAt=null,selected='',pending=null,historyId='',verifiedHistoryIds=new Set();
  const status=(message,error=false)=>{
    const el=$('build824HandoffStatus');
    if(el){el.textContent=message;el.dataset.status=error?'error':'info';}
  };
  const okSource=()=>{
    const freshness=sourceFreshness823({loaded,loadedAt});
    return canManage&&!!actor&&loaded&&freshness.allowReport&&rows.length<=150;
  };
  function resetPrivate(){
    selected='';pending=null;historyId='';verifiedHistoryIds.clear();
    if($('build824NoteText'))$('build824NoteText').value='';
    if($('build824History'))$('build824History').textContent='';
  }
  function mount(){
    const anchor=$('build822ReviewHeading')?.closest('.build822-review');
    if(!anchor||$('build824SupervisorHandoff'))return;
    const section=document.createElement('section');
    section.id='build824SupervisorHandoff';section.hidden=true;
    section.className='build824-handoff';section.setAttribute('aria-labelledby','build824HandoffHeading');
    section.innerHTML='<h4 id="build824HandoffHeading">Private supervisor handoff history</h4>'+
      '<p class="muted">Internal source-backed notes for an authorized follow-up. This is not a customer reply, public record, report export or automatic closure.</p>'+
      '<label for="build824ReviewSelect">Follow-up in the currently verified exception view</label>'+
      '<select id="build824ReviewSelect" aria-describedby="build824HandoffStatus"><option value="">Select a follow-up</option></select>'+
      '<label for="build824NoteText">Private handoff note (12–500 characters)</label>'+
      '<textarea id="build824NoteText" rows="3" minlength="12" maxlength="500" autocomplete="off" placeholder="Record an internal handoff or review decision, not a customer-visible reply."></textarea>'+
      '<div class="build824-actions"><button id="build824SaveHandoff" class="btn ghost" type="button" disabled>Save private handoff</button>'+
      '<button id="build824ReadHistory" class="btn ghost" type="button" disabled>Read source-backed history</button>'+
      '<button id="build824RefreshSource" class="btn ghost" type="button">Refresh and recheck access</button></div>'+
      '<p id="build824HandoffStatus" role="status" aria-live="polite" tabindex="-1">Waiting for verified supervisor access.</p>'+
      '<ol id="build824History" class="build824-history" aria-label="Source-backed supervisor handoff history"></ol>'+
      '<p class="muted">Notes remain private and append-only. A fresh source and current revision are required before saving. Draft text stays in this open page during refresh and is never automatically submitted.</p>';
    anchor.append(section);
    $('build824ReviewSelect').addEventListener('change',()=>{
      selected=$('build824ReviewSelect').value;
      pending=null;historyId='';verifiedHistoryIds.clear();$('build824History').textContent='';
      $('build824NoteText').value='';
      renderButtons();
      status(selected?'Select Read source-backed history or enter a new private handoff.':'Choose a verified follow-up.');
    });
    $('build824NoteText').addEventListener('input',()=>{pending=null;renderButtons();});
    $('build824ReadHistory').addEventListener('click',readHistory);
    $('build824SaveHandoff').addEventListener('click',save);
    $('build824RefreshSource').addEventListener('click',async()=>{
      status('Refreshing authorized follow-ups and review access…');
      try{await refresh?.();}finally{
        status(okSource()?'Verified source refreshed. Review the same follow-up before saving.':'Source or supervisor permission unavailable. No note was saved.',!okSource());
        $('build824HandoffStatus').focus({preventScroll:false});
      }
    });
  }
  function renderButtons(){
    if(!$('build824ReviewSelect'))return;
    const valid=okSource()&&UUID.test(selected)&&rows.some(r=>r.id===selected);
    $('build824SaveHandoff').disabled=!valid||!validText($('build824NoteText').value);
    $('build824ReadHistory').disabled=!valid;
  }
  function update({staffId=null,canAssign=false,verified=false,sourceLoadedAt=null,selection=[]}={}){
    if(!$('build824SupervisorHandoff'))return;
    const nextActor=UUID.test(String(staffId||''))?staffId:'';
    if(!nextActor||!canAssign){
      actor='';canManage=false;rows=[];loaded=false;loadedAt=null;resetPrivate();
      $('build824SupervisorHandoff').hidden=true;return;
    }
    if(actor&&actor!==nextActor)resetPrivate();
    actor=nextActor;canManage=canAssign;loaded=verified;loadedAt=sourceLoadedAt;
    rows=Array.isArray(selection)&&selection.length<=150?selection:[];
    $('build824SupervisorHandoff').hidden=false;
    const box=$('build824ReviewSelect');const desired=selected;
    box.textContent='';
    const placeholder=document.createElement('option');placeholder.value='';placeholder.textContent='Select an authorized follow-up';box.append(placeholder);
    for(const row of rows){
      if(!UUID.test(String(row.id||'')))continue;
      const option=document.createElement('option');option.value=row.id;
      option.textContent='Follow-up '+String(row.id).slice(-8)+' · '+String(row.request_kind||'Worksite review').replaceAll('_',' ');
      box.append(option);
    }
    if(rows.some(r=>r.id===desired))box.value=desired;else box.value='';
    selected=box.value;
    box.disabled=!okSource();
    renderButtons();
    const freshness=sourceFreshness823({loaded,loadedAt});
    if(!freshness.allowReport)status('Report source expired or unavailable. Refresh the authenticated queue before handoff. Draft text is retained in this page.',true);
    else if(!selected)status('Choose a verified follow-up to review private history or save a handoff.');
    else if(historyId!==selected)status('A fresh source is available. Read the authenticated note history when needed.');
  }
  async function readHistory(){
    if(!okSource()||!UUID.test(selected)||!rows.some(r=>r.id===selected)){status('Verified source is required for private history.',true);return false;}
    const id=selected;status('Reading private source history…');
    try{
      const response=await fetch(API+'?followup_id='+encodeURIComponent(id),{credentials:'include',cache:'no-store'});
      const data=await response.json().catch(()=>null);
      if(!response.ok||!data?.ok||!Array.isArray(data.history)||data.followup_id!==id||!data.private_supervisor_only)
        throw Error(data?.error||'Private history could not be verified.');
      if(selected!==id||!okSource())throw Error('The selected follow-up or source changed. Refresh and retry.');
      const list=$('build824History');list.textContent='';verifiedHistoryIds.clear();
      for(const note of data.history.slice(0,20)){
        if(UUID.test(String(note.id||'')))verifiedHistoryIds.add(note.id);
        const li=document.createElement('li');
        const time=document.createElement('time');time.textContent=cleanTime(note.recorded_at);
        const body=document.createElement('p');body.textContent=String(note.note_text||'');
        const meta=document.createElement('p');meta.className='muted';
        meta.textContent='Supervisor note · '+String(note.exception_key||'review')+' · recorded actor '+String(note.actor_staff_user_id||'').slice(-8);
        li.append(time,meta,body);list.append(li);
      }
      historyId=id;
      status('Source verified '+data.history.length+' latest private handoff entries (maximum 20). No customer messages sent.');
      return true;
    }catch(error){$('build824History').textContent='';historyId='';
      status(error.message||'Private history unavailable. No private records displayed.',true);return false;}
  }
  async function save(){
    if(!okSource()||!UUID.test(selected))return;
    const row=rows.find(r=>r.id===selected),note=$('build824NoteText').value.trim();
    if(!row||!validText(note)||!Number.isSafeInteger(row.workflow_revision)){status('A valid fresh follow-up revision and 12–500-character note are required.',true);return;}
    const category=$('build822ExceptionSelect')?.value||'all';
    const key=selected+'|'+category+'|'+note;
    if(!pending||pending.key!==key){
      if(!globalThis.crypto?.randomUUID){status('Secure request IDs are unavailable. Use an updated browser.',true);return;}
      pending={key,id:globalThis.crypto.randomUUID()};
    }
    const payload={request_id:pending.id,followup_id:selected,exception_key:category,note_text:note,expected_revision:row.workflow_revision};
    $('build824SaveHandoff').disabled=true;status('Saving supervisor-only handoff and awaiting source readback…');
    try{
      const response=await fetch(API,{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      const data=await response.json().catch(()=>null);
      if(!response.ok||!data?.ok||!data.private_supervisor_only||!UUID.test(String(data.note_id||'')))
        throw Error(data?.error||'Supervisor handoff could not be confirmed.');
      const noteId=data.note_id;
      if(!await readHistory())throw Error('Private note accepted, but source readback is unavailable. Preserve draft and retry the same request ID.');
      if(selected!==payload.followup_id||!verifiedHistoryIds.has(noteId))throw Error('Private note accepted but its exact source readback was not verified. Preserve the draft and request ID.');
      pending=null;$('build824NoteText').value='';
      status('Private supervisor handoff saved and source history refreshed. No customer, booking or payment action occurred.');
      $('build824HandoffStatus').focus({preventScroll:false});
    }catch(error){status(error.message||'No confirmed private handoff. Do not assume it was saved.',true);}
    finally{renderButtons();}
  }
  return {mount,update,readHistory};
}
