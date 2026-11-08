// Build 814: verified staff queue and response history, including audit actors.
import { eventTimeToronto813 } from './worksite-timeline-v813.mjs';
import { FOLLOWUP_LABELS_814,FOLLOWUP_KINDS_814 } from './customer-worksite-followups-v814.mjs';
const $=id=>typeof document==='undefined'?null:document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&'+'#39;'}[c]));
let records=[],events=[],escalations=[],escalationEvents=[],escalationReady=false,canEscalate=false,busy=false,loaded=false;
function notice(message,err=false){const el=$('build814StaffStatus');if(el){el.className=err?'notice bad':'notice';el.textContent=message;}}
export function advisoryAging815(row,now=Date.now()){if(row.status!=='awaiting_staff')return null;const ms=Date.parse(row.requested_at);if(!Number.isFinite(ms)||ms>now)return {band:'unknown',label:'Age unavailable'};
  const hours=Math.floor((now-ms)/3600000);return {band:hours>=48?'overdue':hours>=24?'attention':'new',label:hours>=48?'Over 48 hours — supervisor review suggested':hours>=24?'Over 24 hours — review soon':'Newer than 24 hours'};}
const escalationByFollowup=id=>escalations.find(e=>e.followup_id===id);
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
function render(){const el=$('build814StaffList');if(!el)return;
  $('build814StaffCounts').textContent=loaded?`${records.filter(r=>r.status==='awaiting_staff').length} waiting for staff · ${records.filter(r=>advisoryAging815(r)?.band==='overdue').length} over 48 hours · ${escalations.filter(e=>e.status!=='cleared').length} open supervisor reviews · ${records.length} recent follow-ups${escalationReady?'':' · supervisor state unavailable'}.`:'Awaiting authenticated operations access.';
  if(!loaded){el.innerHTML='<p class="muted">Waiting for the authorized follow-up queue.</p>';return;}
  const filter=$('build814StaffFilter')?.value||'awaiting_staff';const selection=records.filter(r=>filter==='all'||r.status===filter||(filter==='aging'&&['attention','overdue'].includes(advisoryAging815(r)?.band))||(filter==='escalated'&&escalationByFollowup(r.id)?.status!=='cleared'&&!!escalationByFollowup(r.id)));
  el.innerHTML=selection.length?selection.map(row=>`<article class="build811-issue">
    <span class="badge">${esc(FOLLOWUP_LABELS_814[row.status]||'Follow-up')}</span><h3>${esc(FOLLOWUP_KINDS_814[row.request_kind]||'Worksite question')}</h3>
    <p class="muted">${esc(row.issue_category||'Worksite report')} · Booking ${esc(row.booking_id||'Reference on file')} · ${esc(eventTimeToronto813(row.requested_at))}</p>
    <p><strong>Customer’s follow-up:</strong> ${esc(row.request_text)}</p>
    ${row.staff_response?`<p class="build814-response"><strong>Recorded response:</strong> ${esc(row.staff_response)} · ${esc(eventTimeToronto813(row.staff_responded_at))}</p>`:''}
    ${row.customer_decided_at?`<p><strong>Customer’s decision:</strong> ${esc(FOLLOWUP_LABELS_814[row.status])} · ${esc(eventTimeToronto813(row.customer_decided_at))}${row.customer_feedback?`<br>${esc(row.customer_feedback)}`:''}</p>`:''}
    ${supervisorControls(row)}
    ${audit(row.id)}
    ${row.status==='awaiting_staff'?`<form class="build814-staff-reply" data-build814-staff-reply="${esc(row.id)}" aria-busy="false"><label>Customer-visible response<textarea name="response" minlength="12" maxlength="1000" rows="3" required placeholder="Explain the answer and next step without internal staff notes"></textarea></label>
      <button class="btn primary" type="submit">Save response for customer account</button><p class="muted">Saves a response in My Account; does not email or text the customer.</p></form>`:''}
  </article>`).join(''):'<p class="muted">No follow-ups match this filter.</p>';
}
async function load(){if(busy)return;busy=true;loaded=false;escalationReady=false;$('build814StaffRefresh').disabled=true;render();notice('Loading verified staff follow-ups…');
  try{const response=await fetch('/api/admin/worksite_followups_v814',{credentials:'include',cache:'no-store'});const data=await response.json().catch(()=>null);
    if(!response.ok||!data?.ok||!Array.isArray(data.followups)||!Array.isArray(data.events))throw Error(data?.error||'Queue unavailable.');
    records=data.followups;events=data.events;loaded=true;
    try{const e=await fetch('/api/admin/worksite_escalations_v815',{credentials:'include',cache:'no-store'});const d=await e.json().catch(()=>null);
      if(!e.ok||!d?.ok||!Array.isArray(d.escalations)||!Array.isArray(d.events))throw Error('Unavailable');
      escalations=d.escalations;escalationEvents=d.events;canEscalate=d.can_escalate===true;escalationReady=true;
    }catch{escalations=[];escalationEvents=[];canEscalate=false;escalationReady=false;}
    render();notice(escalationReady?'Follow-up and supervisor queues loaded. No outbound message is sent.':'Follow-ups loaded; supervisor state is unavailable and escalation actions are disabled.',!escalationReady);
  }catch(error){records=[];events=[];render();notice(`${error.message||'Queue unavailable.'} Authenticated operations permission is required.`,true);}
  finally{busy=false;$('build814StaffRefresh').disabled=false;}
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
    const data=await response.json().catch(()=>null);if(!response.ok||!data?.ok)throw Error(data?.error||'Not confirmed.');await load();notice('Supervisor decision saved in the audited internal queue. No external notification was sent.');
  }catch(error){notice(`${error.message||'Decision not confirmed.'} Refresh the queue before retrying.`,true);form.setAttribute('aria-busy','false');form.querySelector('button').disabled=false;}
}
async function submit(event){const form=event.target.closest?.('[data-build814-staff-reply]');if(!form)return;event.preventDefault();if(form.getAttribute('aria-busy')==='true'||busy)return;
  const row=records.find(r=>r.id===form.dataset.build814StaffReply);if(!row)return;
  const responseText=form.elements.namedItem('response').value.trim();if(responseText.length<12||responseText.length>1000){notice('Response must contain 12–1000 characters.',true);return;}
  if(!window.confirm('Save this response for the customer to read in My Account? No email or text is sent.'))return;
  form.setAttribute('aria-busy','true');form.querySelector('button').disabled=true;notice('Saving staff response…');
  try{const response=await fetch('/api/admin/worksite_followups_v814',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({followup_id:row.id,expected_revision:row.workflow_revision,response:responseText})});
    const data=await response.json().catch(()=>null);if(!response.ok||!data?.ok)throw Error(data?.error||'Response not saved.');
    await load();notice('Staff response recorded and available to the customer in My Account after refresh. No outbound message was sent.');
  }catch(error){notice(`${error.message||'Response not confirmed.'} Refresh the queue before trying again.`,true);form.setAttribute('aria-busy','false');form.querySelector('button').disabled=false;}
}
export function loadStaffWorksiteFollowups814(){if(!$('build814StaffList'))return;
  $('build814StaffRefresh').addEventListener('click',load);$('build814StaffFilter').addEventListener('change',render);
  $('build814StaffList').addEventListener('submit',submit);$('build814StaffList').addEventListener('submit',escalate);load();}
