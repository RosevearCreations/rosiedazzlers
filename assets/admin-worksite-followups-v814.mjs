// Build 814: verified staff queue and response history, including audit actors.
import { eventTimeToronto813 } from './worksite-timeline-v813.mjs';
import { FOLLOWUP_LABELS_814,FOLLOWUP_KINDS_814 } from './customer-worksite-followups-v814.mjs';
import { readViews818,saveView818,selectView818,removeView818,viewStorage818 } from './build818-followup-view-state.mjs';
import { outcome819,latestReturnedHandoff819,outcomeSummary819 } from './build819-followup-outcomes.mjs';
const $=id=>typeof document==='undefined'?null:document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&'+'#39;'}[c]));
const localDateTimeValue=v=>{if(!v)return '';const date=new Date(v);if(!Number.isFinite(date.getTime()))return '';const pad=n=>String(n).padStart(2,'0');return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;};
let records=[],events=[],escalations=[],escalationEvents=[],escalationReady=false,canEscalate=false,ownership=[],ownershipEvents=[],ownershipCandidates=[],ownershipReady=false,canAssign=false,staffId=null,busy=false,loaded=false;
let viewsActor=null,savedViews={views:[],activeId:''};
function notice(message,err=false){const el=$('build814StaffStatus');if(el){el.className=err?'notice bad':'notice';el.textContent=message;}}
function viewNotice(message){const el=$('build818ViewStatus');if(el)el.textContent=message;}
function ensureOutcomeSurface819(){
  const counts=$('build814StaffCounts');if(!counts||$('build819OutcomeSummary'))return;
  const section=document.createElement('section');section.className='build819-summary';section.setAttribute('aria-label','Follow-up outcomes for the filtered queue');
  const heading=document.createElement('h3');heading.textContent='Follow-up outcomes and closure guidance';
  const summary=document.createElement('p');summary.id='build819OutcomeSummary';summary.setAttribute('role','status');summary.setAttribute('aria-live','polite');summary.textContent='Waiting for the authenticated outcome summary.';
  const handoff=document.createElement('p');handoff.id='build819HandoffStatus';handoff.className='muted';handoff.tabIndex=-1;handoff.setAttribute('role','status');handoff.setAttribute('aria-live','polite');handoff.textContent='Manual changes show readback and focus guidance here.';
  section.append(heading,summary,handoff);counts.before(section);
}
function viewControls818(){
  const select=$('build818SavedViews');if(!select)return;
  select.innerHTML='<option value="">Choose a saved view</option>'+savedViews.views.map(v=>`<option value="${esc(v.id)}">${esc(v.name)}</option>`).join('');
  select.value=savedViews.activeId;
  const ready=!!staffId;
  $('build818SaveView').disabled=!ready;
  $('build818RemoveView').disabled=!ready||!savedViews.activeId;
  select.disabled=!ready||savedViews.views.length===0;
}
function hydrateViews818(){
  if(viewsActor===staffId)return;
  viewsActor=staffId;savedViews=readViews818(viewStorage818(),staffId);
  const selected=savedViews.views.find(v=>v.id===savedViews.activeId);
  if(selected){$('build814StaffFilter').value=selected.status;$('build817ReviewTarget').value=selected.target;
    $('build817StaffSearch').value='';viewNotice(`Restored “${selected.name}” filters in this browser tab. Search text was not saved.`);
  }else viewNotice(staffId?'Views are saved only in this browser tab, for this staff account. Search and customer details are never saved.':'Sign in to manage saved views.');
  viewControls818();
}
function saveCurrentView818(){
  if(!staffId)return;
  const outcome=saveView818(viewStorage818(),staffId,$('build818ViewName').value,{
    status:$('build814StaffFilter').value,target:$('build817ReviewTarget').value});
  if(!outcome.ok){viewNotice(outcome.reason);return;}
  savedViews=outcome;viewControls818();viewNotice(`Saved “${outcome.view.name}” for this browser tab. Search and private notes were not stored.`);
}
function applySavedView818(){
  const id=$('build818SavedViews').value,view=savedViews.views.find(v=>v.id===id);
  if(!view){savedViews.activeId='';viewControls818();return;}
  const outcome=selectView818(viewStorage818(),staffId,id);
  if(!outcome){viewNotice('Could not remember this view in the current browser tab.');return;}
  savedViews=outcome;$('build814StaffFilter').value=view.status;$('build817ReviewTarget').value=view.target;
  $('build817StaffSearch').value='';viewControls818();render();
  viewNotice(`Applied “${view.name}”. Search was cleared. ${!ownershipReady&&view.target!=='all'?'Verified ownership is unavailable; this target view is paused.':''}`);
}
function removeSavedView818(){
  if(!savedViews.activeId)return;
  const outcome=removeView818(viewStorage818(),staffId,savedViews.activeId);
  if(!outcome){viewNotice('Saved view could not be removed.');return;}
  savedViews=outcome;viewControls818();viewNotice('Saved view removed. Current filters and queue records were not changed.');
}
export function advisoryAging815(row,now=Date.now()){if(row.status!=='awaiting_staff')return null;const ms=Date.parse(row.requested_at);if(!Number.isFinite(ms)||ms>now)return {band:'unknown',label:'Age unavailable'};
  const hours=Math.floor((now-ms)/3600000);return {band:hours>=48?'overdue':hours>=24?'attention':'new',label:hours>=48?'Over 48 hours — supervisor review suggested':hours>=24?'Over 24 hours — review soon':'Newer than 24 hours'};}
const escalationByFollowup=id=>escalations.find(e=>e.followup_id===id);
const ownershipFor=id=>ownership.find(e=>e.followup_id===id);
export function priority816(row,owner=null,escalation=null,now=Date.now()){
  if(row.status!=='awaiting_staff')return {level:7,label:'Not waiting for staff'};
  const band=advisoryAging815(row,now)?.band;
  if(escalation&&escalation.status!=='cleared'&&!owner)return {level:0,label:'Escalated — no owner'};
  if(band==='overdue'&&!owner)return {level:1,label:'Overdue — no owner'};
  if(band==='overdue')return {level:2,label:'Overdue — owner assigned'};
  if(escalation&&escalation.status!=='cleared')return {level:3,label:'Supervisor review — assigned'};
  if(band==='attention'&&!owner)return {level:4,label:'24+ hours — no owner'};
  if(band==='attention')return {level:5,label:'24+ hours — assigned'};
  return {level:6,label:'Recent follow-up'};
}
// Build 817: client-side triage over the authenticated, bounded staff queue.
// Missing ownership data must never be interpreted as an unassigned or overdue owner.
export function reviewTarget817(row,owner,now=Date.now()){
  if(row?.status!=='awaiting_staff'||!owner?.review_due_at)return 'none';
  const due=Date.parse(owner.review_due_at);
  if(!Number.isFinite(due))return 'unknown';
  return due<=now?'past':due<=now+86400000?'soon':'later';
}
export function selectFollowups817(rows,{status='priority',query='',target='all',ownershipReady=false,owners=[],escalations=[],staffId=null,now=Date.now()}={}){
  const ownerFor=id=>owners.find(e=>e.followup_id===id);
  const escalationFor=id=>escalations.find(e=>e.followup_id===id);
  const search=String(query).trim().toLocaleLowerCase().slice(0,100);
  return rows.filter(r=>{
    const owner=ownershipReady?ownerFor(r.id):null,escalation=escalationFor(r.id);
    const matchesStatus=status==='all'||r.status===status||(status==='priority'&&r.status==='awaiting_staff')||
      (status==='unowned'&&ownershipReady&&r.status==='awaiting_staff'&&!owner)||
      (status==='mine'&&ownershipReady&&owner?.owner_staff_user_id===staffId)||
      (status==='aging'&&['attention','overdue'].includes(advisoryAging815(r,now)?.band))||
      (status==='escalated'&&!!escalation&&escalation.status!=='cleared');
    if(!matchesStatus||target!=='all'&&(!ownershipReady||reviewTarget817(r,owner,now)!==target))return false;
    return !search||[r.booking_id,r.issue_category,r.request_kind,FOLLOWUP_KINDS_814[r.request_kind],r.request_text]
      .some(value=>String(value??'').toLocaleLowerCase().includes(search));
  }).sort((a,b)=>priority816(a,ownerFor(a.id),escalationFor(a.id),now).level-priority816(b,ownerFor(b.id),escalationFor(b.id),now).level||
    (Date.parse(a.requested_at)||0)-(Date.parse(b.requested_at)||0));
}
function ownerControls(row){if(row.status!=='awaiting_staff'&&!ownershipFor(row.id))return '';
  if(!ownershipReady)return '<p class="notice bad">Owner assignment source unavailable. Assignments are read-only until refresh.</p>';
  const current=ownershipFor(row.id),person=ownershipCandidates.find(s=>s.id===current?.owner_staff_user_id);
  const history=current?ownershipEvents.filter(e=>e.ownership_id===current.id).slice(0,12).reverse():[];
  return `<section class="build816-owner" aria-label="Internal supervisor ownership"><p><strong>Review owner:</strong> ${esc(person?.name|| (current?'Assigned staff member':'Not assigned'))}${current?.review_due_at?` · Internal review target ${esc(eventTimeToronto813(current.review_due_at))}`:''}</p>
    ${current&&canAssign?`<details class="build818-review-note"><summary>Private reviewer note (supervisors only)</summary><p>${current.private_note?esc(current.private_note):'No verified reviewer note is available.'}</p><p class="muted">Existing audited assignment note. Read-only here; editing requires an authorized assignment update.</p></details>`:''}
    ${current?`<details class="build813-timeline"><summary>Recorded ownership history (${history.length}${history.length===12?'+':''})</summary>${history.length?`<ol class="build813-event-list">${history.map(e=>`<li>${esc(eventTimeToronto813(e.recorded_at))} · ${esc(e.event_kind.replaceAll('_',' '))} · Rev ${esc(e.ownership_revision)} · Staff ${esc(String(e.actor_staff_user_id||'').slice(0,8))}</li>`).join('')}</ol>`:'<p class="muted">No audit events returned.</p>'}</details>`:''}
    ${canAssign&&row.status==='awaiting_staff'?`<form class="build816-owner-form" data-build816-owner="${esc(row.id)}"><label>Authorized owner<select name="owner" required><option value="">Choose a reviewer</option>${ownershipCandidates.map(s=>`<option value="${esc(s.id)}" ${current?.owner_staff_user_id===s.id?'selected':''}>${esc(s.name)}</option>`).join('')}</select></label>
    <label>Internal review target (optional, within 30 days)<input type="datetime-local" name="reviewDue" value="${esc(localDateTimeValue(current?.review_due_at))}" /></label>
    <label>Private assignment reason<textarea name="note" minlength="12" maxlength="600" rows="2" required placeholder="Explain what the owner should review and why">${esc(current?.private_note||'')}</textarea></label>
    <button type="submit" class="btn ghost">${current?'Update assigned owner':'Assign an owner'}</button><p class="muted">Internal target only. No promised customer response time or automatic message.</p></form>`:''}
  </section>`;
}
function supervisorHistory(record){if(!record)return '';const timeline=escalationEvents.filter(e=>e.escalation_id===record.id).slice(0,12).reverse();return `<details class="build813-timeline"><summary>Supervisor audit (${timeline.length}${timeline.length===12?'+':''})</summary><ol class="build813-event-list">${timeline.map(e=>`<li>${esc(eventTimeToronto813(e.recorded_at))} · Rev ${esc(e.escalation_revision)} · ${esc(e.event_kind.replaceAll('_',' '))} · Staff ${esc(String(e.actor_staff_user_id||'').slice(0,8))}</li>`).join('')}</ol></details>`;}
function supervisorControls(row){if(!escalationReady)return '<p class="notice bad">Supervisor state could not be verified. Escalation controls are unavailable until refresh.</p>';
  const existing=escalationByFollowup(row.id);const age=advisoryAging815(row);const ageBadge=age?`<p class="build815-age build815-age-${esc(age.band)}">Advisory age: ${esc(age.label)}. These bands are not a promised service deadline.</p>`:'';
  if(existing)return `${ageBadge}<div class="build815-escalation"><p><strong>Supervisor review:</strong> ${esc(existing.status)} · flagged ${esc(eventTimeToronto813(existing.flagged_at))}</p>
    <p class="muted">Internal reason: ${esc(existing.reason)} · supervisor ${esc(String(existing.flagged_by_staff_user_id||'').slice(0,8))}</p>
    ${existing.acknowledged_at?`<p class="muted">Acknowledged ${esc(eventTimeToronto813(existing.acknowledged_at))}</p>`:''}
    ${existing.cleared_at?`<p class="muted">Cleared ${esc(eventTimeToronto813(existing.cleared_at))}</p>`:''}
    ${canEscalate&&existing.status!=='cleared'?`<form data-build815-decision="${esc(row.id)}"><button type="submit" class="btn ghost">${existing.status==='flagged'?'Acknowledge supervisor review':'Clear supervisor review'}</button></form>`:''}
    ${supervisorHistory(existing)}</div>`;
  if(row.status!=='awaiting_staff')return '';
  return `${ageBadge}${canEscalate?`<form class="build814-staff-reply" data-build815-flag="${esc(row.id)}"><label>Private supervisor reason<textarea name="reason" minlength="12" maxlength="600" rows="2" required placeholder="Explain the safety, timing or service concern for the supervisor"></textarea></label><button class="btn ghost" type="submit">Flag for supervisor review</button><p class="muted">Manual review only; no automatic customer message or appointment change.</p></form>`:''}`;
}
function audit(id){const history=events.filter(e=>e.followup_id===id).slice(0,12).reverse();
  return `<details class="build813-timeline"><summary>Verified follow-up actions (${history.length}${history.length===12?'+':''})</summary>
    ${history.length?`<ol class="build813-event-list">${history.map(e=>`<li><time>${esc(eventTimeToronto813(e.recorded_at))}</time> · Rev ${esc(e.followup_revision)} · ${esc(e.event_kind.replaceAll('_',' '))}${e.actor_staff_user_id?` · Staff ${esc(e.actor_staff_user_id.slice(0,8))}`:''}</li>`).join('')}</ol>`:'<p class="muted">No recorded actions yet. History is not reconstructed.</p>'}
    <p class="muted">Actions are written by the database. Customers cannot see staff identity or the internal audit log.</p></details>`;}
function outcomeCard819(row){const result=outcome819(row),handoff=latestReturnedHandoff819(row,events);
  return `<section class="build819-outcome build819-${esc(result.kind)}" aria-label="Recorded follow-up outcome and manual next step">
    <h4>Follow-up outcome: ${esc(result.label)}</h4>
    <p><strong>Suggested manual next step:</strong> ${esc(result.guidance)}</p>
    <p class="muted"><strong>Latest returned follow-up audit event:</strong> ${handoff?`${esc(handoff.label)} · ${esc(eventTimeToronto813(handoff.recordedAt))} · revision ${esc(handoff.revision)}`:'No matching event was returned in the bounded audit history. Do not reconstruct missing actions.'}</p>
    <p class="muted">Follow-up outcome only. No automatic closure, outreach, booking, payment or dispatch action.</p>
  </section>`;}
function handoffFeedback819(id,action,readback){const status=$('build819HandoffStatus');if(!status)return;
  const card=Array.from($('build814StaffList')?.querySelectorAll('[data-build819-followup]')||[]).find(node=>node.getAttribute('data-build819-followup')===id);
  const record=records.find(row=>row.id===id);
  status.textContent=`${action}. ${!readback?'Relevant source readback unavailable; verify before further action.':card?`Current follow-up outcome: ${outcome819(record).label}.`:'Record is outside the current filtered or bounded view. Your filters were retained.'} No outbound message was sent.`;
  (card||status).focus({preventScroll:false});
}
function render(){const el=$('build814StaffList');if(!el)return;
  const filter=$('build814StaffFilter')?.value||'priority',query=$('build817StaffSearch')?.value||'',target=$('build817ReviewTarget')?.value||'all';
  const selection=loaded?selectFollowups817(records,{status:filter,query,target,ownershipReady,owners:ownership,escalations:escalationReady?escalations:[],staffId}):[];
  const targetSelect=$('build817ReviewTarget');if(targetSelect)targetSelect.disabled=!ownershipReady;
  const summary=$('build819OutcomeSummary');if(summary){
    if(!loaded)summary.textContent='Outcome summary unavailable until the authenticated follow-up queue loads.';
    else{const counts=outcomeSummary819(selection);summary.textContent=`Shown follow-ups (${counts.total}; latest 150 loaded maximum): ${counts.waiting} awaiting staff · ${counts.responded} waiting for customer decision · ${counts.needs_help} requesting more help · ${counts.confirmed} customer-confirmed answers · ${counts.review} needing source review. ${ownershipReady?'Owner source available.':'Owner source unavailable.'} ${escalationReady?'Supervisor source available.':'Supervisor source unavailable.'} No booking or issue closures are inferred.`;}
  }
  $('build814StaffCounts').textContent=loaded?`${selection.length} of ${records.length} loaded follow-ups shown (latest 150 maximum) · ${records.filter(r=>r.status==='awaiting_staff').length} waiting for staff · ${records.filter(r=>advisoryAging815(r)?.band==='overdue').length} over 48 hours · ${ownershipReady?records.filter(r=>r.status==='awaiting_staff'&&!ownershipFor(r.id)).length+' unowned waiting · '+records.filter(r=>reviewTarget817(r,ownershipFor(r.id))==='past').length+' passed internal review targets · ':target!=='all'?'review-target view paused until ownership can be verified · ':'ownership source unavailable · '}${escalationReady?escalations.filter(e=>e.status!=='cleared').length+' open supervisor reviews':'supervisor state unavailable'}.`:'Awaiting authenticated operations access.';
  if(!loaded){el.innerHTML='<p class="muted">Waiting for the authorized follow-up queue.</p>';return;}
  el.innerHTML=selection.length?selection.map(row=>`<article class="build811-issue" tabindex="-1" data-build819-followup="${esc(row.id)}">
    <span class="badge">${esc(FOLLOWUP_LABELS_814[row.status]||'Follow-up')}</span>${row.status==='awaiting_staff'?`<span class="badge build816-priority-label">${ownershipReady?esc(priority816(row,ownershipFor(row.id),escalationReady?escalationByFollowup(row.id):null).label):'Ownership priority unavailable'}</span>`:''}<h3>${esc(FOLLOWUP_KINDS_814[row.request_kind]||'Worksite question')}</h3>
    <p class="muted">${esc(row.issue_category||'Worksite report')} · Booking ${esc(row.booking_id||'Reference on file')} · ${esc(eventTimeToronto813(row.requested_at))}</p>
    <p><strong>Customer’s follow-up:</strong> ${esc(row.request_text)}</p>
    ${row.staff_response?`<p class="build814-response"><strong>Recorded response:</strong> ${esc(row.staff_response)} · ${esc(eventTimeToronto813(row.staff_responded_at))}</p>`:''}
    ${row.customer_decided_at?`<p><strong>Customer’s decision:</strong> ${esc(FOLLOWUP_LABELS_814[row.status])} · ${esc(eventTimeToronto813(row.customer_decided_at))}${row.customer_feedback?`<br>${esc(row.customer_feedback)}`:''}</p>`:''}
    ${outcomeCard819(row)}
    ${supervisorControls(row)}
    ${ownerControls(row)}
    ${audit(row.id)}
    ${row.status==='awaiting_staff'?`<form class="build814-staff-reply" data-build814-staff-reply="${esc(row.id)}" aria-busy="false"><label>Customer-visible response<textarea name="response" minlength="12" maxlength="1000" rows="3" required placeholder="Explain the answer and next step without internal staff notes"></textarea></label>
      <button class="btn primary" type="submit">Save response for customer account</button><p class="muted">Saves a response in My Account; does not email or text the customer.</p></form>`:''}
  </article>`).join(''):'<p class="muted">No follow-ups match this filter.</p>';
}
async function load(){if(busy)return;busy=true;loaded=false;escalationReady=false;ownershipReady=false;$('build814StaffRefresh').disabled=true;render();notice('Loading verified staff follow-ups…');
  try{const response=await fetch('/api/admin/worksite_followups_v814',{credentials:'include',cache:'no-store'});const data=await response.json().catch(()=>null);
    if(!response.ok||!data?.ok||!Array.isArray(data.followups)||!Array.isArray(data.events))throw Error(data?.error||'Queue unavailable.');
    records=data.followups;events=data.events;loaded=true;
    try{const e=await fetch('/api/admin/worksite_escalations_v815',{credentials:'include',cache:'no-store'});const d=await e.json().catch(()=>null);
      if(!e.ok||!d?.ok||!Array.isArray(d.escalations)||!Array.isArray(d.events))throw Error('Unavailable');
      escalations=d.escalations;escalationEvents=d.events;canEscalate=d.can_escalate===true;escalationReady=true;
    }catch{escalations=[];escalationEvents=[];canEscalate=false;escalationReady=false;}
    try{const o=await fetch('/api/admin/worksite_ownership_v816',{credentials:'include',cache:'no-store'});const d=await o.json().catch(()=>null);
      if(!o.ok||!d?.ok||!Array.isArray(d.ownership)||!Array.isArray(d.events)||!Array.isArray(d.candidates))throw Error('Unavailable');
      ownership=d.ownership;ownershipEvents=d.events;ownershipCandidates=d.candidates;canAssign=d.can_assign===true;staffId=d.current_staff_user_id;ownershipReady=true;
    }catch{ownership=[];ownershipEvents=[];ownershipCandidates=[];canAssign=false;staffId=null;ownershipReady=false;}
    hydrateViews818();render();notice(escalationReady&&ownershipReady?'Priority queue, supervisor reviews and owner records loaded. No outbound message is sent.':'Follow-ups loaded, but some supervisor/owner records are unavailable. Their controls are disabled.',!escalationReady||!ownershipReady);return true;
  }catch(error){records=[];events=[];staffId=null;hydrateViews818();render();notice(`${error.message||'Queue unavailable.'} Authenticated operations permission is required.`,true);return false;}
  finally{busy=false;$('build814StaffRefresh').disabled=false;}
}
async function assignOwner(event){const form=event.target.closest?.('[data-build816-owner]');if(!form)return;event.preventDefault();
  if(busy||!ownershipReady||!canAssign||form.getAttribute('aria-busy')==='true')return;
  const row=records.find(r=>r.id===form.dataset.build816Owner);if(!row||row.status!=='awaiting_staff')return;
  const current=ownershipFor(row.id),owner=form.elements.namedItem('owner').value,note=form.elements.namedItem('note').value.trim(),localDue=form.elements.namedItem('reviewDue').value;
  if(!ownershipCandidates.some(s=>s.id===owner)||note.length<12||note.length>600){notice('Choose an authorized staff member and enter a private 12–600 character note.',true);return;}
  const parsedDue=localDue?new Date(localDue):null;
  if(parsedDue&&!Number.isFinite(parsedDue.getTime())){notice('Enter a valid review date.',true);return;}
  const reviewDue=parsedDue?parsedDue.toISOString():null;
  if(!window.confirm('Save this internal ownership decision? No customer notification or appointment change occurs.'))return;
  form.setAttribute('aria-busy','true');form.querySelector('button').disabled=true;notice('Saving assigned reviewer…');
  try{const response=await fetch('/api/admin/worksite_ownership_v816',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({followup_id:row.id,owner_staff_user_id:owner,private_note:note,review_due_at:reviewDue,expected_revision:current?.workflow_revision??null})});
    const data=await response.json().catch(()=>null);if(!response.ok||!data?.ok)throw Error(data?.error||'Assignment not confirmed.');const readback=await load()&&ownershipReady;handoffFeedback819(row.id,'Supervisor owner update accepted by source',readback);notice(readback?'Supervisor owner recorded with an auditable decision. No message was sent.':'Owner update accepted, but ownership readback is unavailable. Refresh to verify before further changes.',!readback);
  }catch(error){notice(`${error.message||'Owner not confirmed.'} Refresh before retrying.`,true);form.setAttribute('aria-busy','false');form.querySelector('button').disabled=false;}
}
async function escalate(event){const flag=event.target.closest?.('[data-build815-flag]'),form=flag||event.target.closest?.('[data-build815-decision]');if(!form)return;
  event.preventDefault();if(busy||!escalationReady||!canEscalate||form.getAttribute('aria-busy')==='true')return;
  const row=records.find(r=>r.id===(flag?form.dataset.build815Flag:form.dataset.build815Decision));if(!row)return;
  const existing=escalationByFollowup(row.id);const action=flag?'flag':existing?.status==='flagged'?'acknowledge':'clear';
  const reason=flag?form.elements.namedItem('reason')?.value.trim():undefined;
  if(flag&&(reason.length<12||reason.length>600)){notice('Provide a private supervisor reason of 12–600 characters.',true);return;}
  if(!window.confirm(`${action==='flag'?'Flag for':action==='acknowledge'?'Acknowledge':'Clear'} supervisor review? This is an internal record only; no message is sent.`))return;
  form.setAttribute('aria-busy','true');form.querySelector('button').disabled=true;notice('Saving supervisor decision…');
  try{const response=await fetch('/api/admin/worksite_escalations_v815',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,followup_id:row.id,...(flag?{reason}:{expected_revision:existing.workflow_revision})})});
    const data=await response.json().catch(()=>null);if(!response.ok||!data?.ok)throw Error(data?.error||'Not confirmed.');const readback=await load()&&escalationReady;handoffFeedback819(row.id,'Supervisor review decision accepted by source',readback);notice(readback?'Supervisor decision saved in the audited internal queue. No external notification was sent.':'Supervisor decision accepted, but escalation readback is unavailable. Refresh to verify before further changes.',!readback);
  }catch(error){notice(`${error.message||'Decision not confirmed.'} Refresh the queue before retrying.`,true);form.setAttribute('aria-busy','false');form.querySelector('button').disabled=false;}
}
async function submit(event){const form=event.target.closest?.('[data-build814-staff-reply]');if(!form)return;event.preventDefault();if(form.getAttribute('aria-busy')==='true'||busy)return;
  const row=records.find(r=>r.id===form.dataset.build814StaffReply);if(!row)return;
  const responseText=form.elements.namedItem('response').value.trim();if(responseText.length<12||responseText.length>1000){notice('Response must contain 12–1000 characters.',true);return;}
  if(!window.confirm('Save this response for the customer to read in My Account? No email or text is sent.'))return;
  form.setAttribute('aria-busy','true');form.querySelector('button').disabled=true;notice('Saving staff response…');
  try{const response=await fetch('/api/admin/worksite_followups_v814',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({followup_id:row.id,expected_revision:row.workflow_revision,response:responseText})});
    const data=await response.json().catch(()=>null);if(!response.ok||!data?.ok)throw Error(data?.error||'Response not saved.');
    const readback=await load();handoffFeedback819(row.id,'Staff response accepted by source',readback);notice(readback?'Staff response recorded and available to the customer in My Account after refresh. No outbound message was sent.':'Staff response accepted, but queue readback is unavailable. Refresh to verify before further changes.',!readback);
  }catch(error){notice(`${error.message||'Response not confirmed.'} Refresh the queue before trying again.`,true);form.setAttribute('aria-busy','false');form.querySelector('button').disabled=false;}
}
export function loadStaffWorksiteFollowups814(){if(!$('build814StaffList'))return;ensureOutcomeSurface819();
  $('build814StaffRefresh').addEventListener('click',async()=>{const success=await load();const feedback=$('build819HandoffStatus');if(feedback)feedback.textContent=success?'Follow-up queue refreshed; active search and triage filters are retained. No message was sent.':'Follow-up refresh unavailable; filters are retained. No action was recorded.';});$('build814StaffFilter').addEventListener('change',render);
  $('build817StaffSearch').addEventListener('input',render);$('build817ReviewTarget').addEventListener('change',render);
  $('build818SaveView').addEventListener('click',saveCurrentView818);
  $('build818SavedViews').addEventListener('change',applySavedView818);
  $('build818RemoveView').addEventListener('click',removeSavedView818);
  $('build814StaffList').addEventListener('submit',submit);$('build814StaffList').addEventListener('submit',escalate);$('build814StaffList').addEventListener('submit',assignOwner);load();}
