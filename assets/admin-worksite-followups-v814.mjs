// Build 814: verified staff queue and response history, including audit actors.
import { eventTimeToronto813 } from './worksite-timeline-v813.mjs';
import { FOLLOWUP_LABELS_814,FOLLOWUP_KINDS_814 } from './customer-worksite-followups-v814.mjs';
const $=id=>typeof document==='undefined'?null:document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&'+'#39;'}[c]));
let records=[],events=[],busy=false,loaded=false;
function notice(message,err=false){const el=$('build814StaffStatus');if(el){el.className=err?'notice bad':'notice';el.textContent=message;}}
function audit(id){const history=events.filter(e=>e.followup_id===id).slice(0,12).reverse();
  return `<details class="build813-timeline"><summary>Verified follow-up actions (${history.length}${history.length===12?'+':''})</summary>
    ${history.length?`<ol class="build813-event-list">${history.map(e=>`<li><time>${esc(eventTimeToronto813(e.recorded_at))}</time> · Rev ${esc(e.followup_revision)} · ${esc(e.event_kind.replaceAll('_',' '))}${e.actor_staff_user_id?` · Staff ${esc(e.actor_staff_user_id.slice(0,8))}`:''}</li>`).join('')}</ol>`:'<p class="muted">No recorded actions yet. History is not reconstructed.</p>'}
    <p class="muted">Actions are written by the database. Customers cannot see staff identity or the internal audit log.</p></details>`;}
function render(){const el=$('build814StaffList');if(!el)return;
  $('build814StaffCounts').textContent=loaded?`${records.filter(r=>r.status==='awaiting_staff').length} waiting for a staff response · ${records.filter(r=>r.status==='staff_replied').length} waiting for customer confirmation · ${records.length} recent follow-ups.`:'Awaiting authenticated operations access.';
  if(!loaded){el.innerHTML='<p class="muted">Waiting for the authorized follow-up queue.</p>';return;}
  const filter=$('build814StaffFilter')?.value||'awaiting_staff';const selection=records.filter(r=>filter==='all'||r.status===filter);
  el.innerHTML=selection.length?selection.map(row=>`<article class="build811-issue">
    <span class="badge">${esc(FOLLOWUP_LABELS_814[row.status]||'Follow-up')}</span><h3>${esc(FOLLOWUP_KINDS_814[row.request_kind]||'Worksite question')}</h3>
    <p class="muted">${esc(row.issue_category||'Worksite report')} · Booking ${esc(row.booking_id||'Reference on file')} · ${esc(eventTimeToronto813(row.requested_at))}</p>
    <p><strong>Customer’s follow-up:</strong> ${esc(row.request_text)}</p>
    ${row.staff_response?`<p class="build814-response"><strong>Recorded response:</strong> ${esc(row.staff_response)} · ${esc(eventTimeToronto813(row.staff_responded_at))}</p>`:''}
    ${row.customer_decided_at?`<p><strong>Customer’s decision:</strong> ${esc(FOLLOWUP_LABELS_814[row.status])} · ${esc(eventTimeToronto813(row.customer_decided_at))}${row.customer_feedback?`<br>${esc(row.customer_feedback)}`:''}</p>`:''}
    ${audit(row.id)}
    ${row.status==='awaiting_staff'?`<form class="build814-staff-reply" data-build814-staff-reply="${esc(row.id)}" aria-busy="false"><label>Customer-visible response<textarea name="response" minlength="12" maxlength="1000" rows="3" required placeholder="Explain the answer and next step without internal staff notes"></textarea></label>
      <button class="btn primary" type="submit">Save response for customer account</button><p class="muted">Saves a response in My Account; does not email or text the customer.</p></form>`:''}
  </article>`).join(''):'<p class="muted">No follow-ups match this filter.</p>';
}
async function load(){if(busy)return;busy=true;loaded=false;$('build814StaffRefresh').disabled=true;render();notice('Loading verified staff follow-ups…');
  try{const response=await fetch('/api/admin/worksite_followups_v814',{credentials:'include',cache:'no-store'});const data=await response.json().catch(()=>null);
    if(!response.ok||!data?.ok||!Array.isArray(data.followups)||!Array.isArray(data.events))throw Error(data?.error||'Queue unavailable.');
    records=data.followups;events=data.events;loaded=true;render();notice('Response queue loaded. Replies become visible in the customer account after refresh; no message is sent.');
  }catch(error){records=[];events=[];render();notice(`${error.message||'Queue unavailable.'} Authenticated operations permission is required.`,true);}
  finally{busy=false;$('build814StaffRefresh').disabled=false;}
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
  $('build814StaffList').addEventListener('submit',submit);load();}
