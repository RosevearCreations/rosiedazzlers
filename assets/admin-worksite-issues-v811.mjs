// Build 811 — manual authorized operations queue. No customer messages are sent.
import { ISSUE_CATEGORIES_811, ISSUE_LABELS_811 } from './customer-worksite-issues-v811.mjs';
const $=id=>typeof document==='undefined'?null:document.getElementById(id);
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const STATUS_ACTIONS_811=Object.freeze({pending_review:['reviewing','resolved','closed_no_action'],reviewing:['resolved','closed_no_action']});
export function nextReviewStatuses811(status){return STATUS_ACTIONS_811[status]||[];}
let issues=[],staffCandidates=[],loaded=false,busy=false,assignmentAllowed=false;
function notice(message,fail=false){const node=$('build811StaffStatus');if(node){node.className=fail?'notice bad':'notice';node.textContent=message;}}
function filtered(){const filter=$('build811StaffFilter')?.value||'open';return issues.filter(row=>
  filter==='all'||(filter==='open'?['pending_review','reviewing'].includes(row.status):
    filter==='arrival' ? ['arrival_today','past_due'].includes(row.arrival_priority)&&nextReviewStatuses811(row.status).length>0 :
    filter==='unassigned' ? !row.assigned_staff_user_id&&nextReviewStatuses811(row.status).length>0 : row.status===filter))
  .sort((a,b)=>{const priority={past_due:0,arrival_today:1,upcoming:2,unavailable:3,closed:4};
    return (priority[a.arrival_priority]??5)-(priority[b.arrival_priority]??5)||String(a.submitted_at).localeCompare(String(b.submitted_at));});}
const staffName=id=>staffCandidates.find(s=>s.id===id)?.name||'Staff member no longer in the active review list';
function actionPanel(row){if(!nextReviewStatuses811(row.status).length)return '';
  const due=['arrival_today','past_due'].includes(row.arrival_priority);
  return `<div class="build812-actions"><label>Assign this issue to an authorized reviewer
    <select data-build812-assignee="${esc(row.id)}"><option value="">Unassigned</option>${staffCandidates.map(s=>`<option value="${esc(s.id)}" ${s.id===row.assigned_staff_user_id?'selected':''}>${esc(s.name)}</option>`).join('')}</select></label>
    ${assignmentAllowed?`<button type="button" class="btn ghost" data-build812-action="assign" data-build812-id="${esc(row.id)}">Save assignment</button>`:'<p class="muted">Assignment requires additional staff permission.</p>'}
    ${row.staff_acknowledged_at?`<p class="muted">Acknowledged by staff ${esc(String(row.staff_acknowledged_at).slice(0,16).replace('T',' '))} UTC.</p>`:
    `<button type="button" class="btn ghost" data-build812-action="acknowledge" data-build812-id="${esc(row.id)}">Record my acknowledgement</button>`}
    ${due&&row.arrival_escalation_status!=='flagged'?`<button type="button" class="btn primary" data-build812-action="escalate" data-build812-id="${esc(row.id)}">Flag arrival-day follow-up</button>`:''}
    ${row.arrival_escalation_status==='flagged'?`<button type="button" class="btn ghost" data-build812-action="clear_escalation" data-build812-id="${esc(row.id)}">Mark escalation addressed</button>`:''}
    <p class="muted">Assignment and acknowledgement are internal records. No customer message or appointment change is sent.</p></div>`;}
function render(){const list=$('build811StaffList');if(!list)return;
  const open=issues.filter(row=>['pending_review','reviewing'].includes(row.status)).length;
  const due=issues.filter(row=>['arrival_today','past_due'].includes(row.arrival_priority)&&nextReviewStatuses811(row.status).length).length;
  $('build811StaffCounts').textContent=loaded?`${open} awaiting a final decision · ${due} reached arrival day or overdue · ${issues.length} in the latest review window.`:'No authorized issue queue loaded.';
  if(!loaded){list.innerHTML='<p class="muted">Waiting for authenticated staff review records.</p>';return;}
  const rows=filtered();
  list.innerHTML=rows.length?rows.map(row=>`<article class="build811-issue" data-build811-issue="${esc(row.id)}">
    <span class="badge">${esc(ISSUE_LABELS_811[row.status]||'Review required')}</span>
    <span class="badge">${esc(row.arrival_priority==='arrival_today'?'Arrival today':row.arrival_priority==='past_due'?'Arrival date passed':row.arrival_priority==='upcoming'?'Before arrival':row.arrival_priority==='closed'?'Closed':row.arrival_priority==='not_active'?'Appointment no longer active':'Check booking date')}</span>
    <h3>${esc(ISSUE_CATEGORIES_811[row.category]||'Worksite concern')}</h3>
    <p class="muted">Booking: ${esc(row.booking_id)} · Service date: ${esc(row.service_date||'unavailable')} · Reported ${esc(String(row.submitted_at||'').slice(0,16).replace('T',' '))} UTC</p>
    <p>${esc(row.description)}</p>
    <p><strong>Assigned reviewer:</strong> ${esc(row.assigned_staff_user_id?staffName(row.assigned_staff_user_id):'Unassigned')} · <strong>Arrival follow-up:</strong> ${esc(row.arrival_escalation_status||'none')}</p>
    ${row.private_note?`<p class="muted"><strong>Private staff note:</strong> ${esc(row.private_note)}</p>`:''}
    ${row.resolution?`<p><strong>Customer-visible answer:</strong> ${esc(row.resolution)}</p>`:''}
    ${actionPanel(row)}
    ${nextReviewStatuses811(row.status).length?`<form data-build811-review="${esc(row.id)}" class="build811-staff-form" aria-busy="false">
      <label>Next review step<select name="status" required>${nextReviewStatuses811(row.status).map(x=>`<option value="${esc(x)}">${esc(ISSUE_LABELS_811[x])}</option>`).join('')}</select></label>
      <label>Customer-visible response (required when closing)<textarea name="resolution" maxlength="1000" rows="3" placeholder="Clear next steps for the customer; no private staff notes"></textarea></label>
      <label>Private staff note (optional)<textarea name="private_note" maxlength="800" rows="2" placeholder="Internal context only"></textarea></label>
      <button class="btn primary" type="submit">Save staff decision</button>
    </form>`:'<p class="muted">Final status recorded. This screen does not reopen decisions.</p>'}
  </article>`).join(''):'<p class="muted">No issues match this review filter.</p>';
}
async function load(){if(busy)return;busy=true;$('build811StaffRefresh').disabled=true;loaded=false;render();notice('Checking staff permission and loading worksite issues…');
  try{const response=await fetch('/api/admin/worksite_assignment_v812',{credentials:'include',cache:'no-store'});
    const data=await response.json().catch(()=>null);
    if(!response.ok||!data?.ok||!Array.isArray(data.issues)||!Array.isArray(data.staff_candidates))throw Error(data?.error||'Could not load staff queue.');
    issues=data.issues;staffCandidates=data.staff_candidates;assignmentAllowed=data.authority?.assignment_allowed===true;loaded=true;render();notice('Queue loaded. Acknowledgement and escalation are manual records; no customer message is sent.');
  }catch(error){issues=[];staffCandidates=[];assignmentAllowed=false;render();notice(`${error.message||'Staff queue unavailable.'} Operations permissions and an authenticated staff session are required.`,true);}
  finally{busy=false;$('build811StaffRefresh').disabled=false;}
}
async function submitReview(event){const form=event.target.closest?.('[data-build811-review]');if(!form)return;event.preventDefault();if(form.getAttribute('aria-busy')==='true')return;
  const id=form.getAttribute('data-build811-review');const row=issues.find(x=>x.id===id);if(!row)return;
  const status=form.elements.namedItem('status').value;
  const resolution=form.elements.namedItem('resolution').value.trim();
  if(!nextReviewStatuses811(row.status).includes(status)||status!=='reviewing'&&resolution.length<8){notice('Choose a valid status and give the customer a clear explanation before closing.',true);return;}
  if(!window.confirm('Record this review step? This does not notify the customer or alter the appointment.'))return;
  form.setAttribute('aria-busy','true');form.querySelector('button').disabled=true;notice('Recording review…');
  try{const response=await fetch('/api/admin/worksite_issue_review_v811',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({issue_id:id,expected_status:row.status,expected_revision:row.workflow_revision,status,
    resolution,private_note:form.elements.namedItem('private_note').value.trim()})});
    const data=await response.json().catch(()=>null);if(!response.ok||!data?.ok)throw Error(data?.error||'Could not record decision.');
    await load();notice('Staff decision saved. The customer can see the current review status by opening My Account; no message was sent.');
  }catch(error){notice(`${error.message||'Review failed.'} Refresh before attempting another decision.`,true);form.setAttribute('aria-busy','false');form.querySelector('button').disabled=false;}
}
async function submitAction(event){const button=event.target.closest?.('[data-build812-action]');if(!button||busy)return;
  const id=button.dataset.build812Id,action=button.dataset.build812Action,row=issues.find(r=>r.id===id);if(!row)return;
  const assignee=action==='assign'?document.querySelector(`[data-build812-assignee="${id}"]`)?.value||null:null;
  if(action==='assign'&&(row.assigned_staff_user_id||null)===assignee){notice('This issue already has that assignment.');return;}
  const verb={assign:'Save this staff assignment',acknowledge:'Record that you personally reviewed the report',escalate:'Flag this unresolved arrival-day concern',clear_escalation:'Mark this follow-up as addressed'}[action];
  if(!verb||!window.confirm(`${verb}? This records an internal action only; no customer message, booking or payment will change.`))return;
  button.disabled=true;button.setAttribute('aria-busy','true');notice('Recording authorized action…');
  try{const response=await fetch('/api/admin/worksite_assignment_v812',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({issue_id:id,expected_revision:row.workflow_revision,action,assigned_staff_user_id:assignee})});
    const data=await response.json().catch(()=>null);if(!response.ok||!data?.ok)throw Error(data?.error||'Action not recorded.');
    await load();notice('Action recorded. Customers must open My Account to see acknowledgement status; no message was sent.');
  }catch(error){notice(`${error.message||'Update failed.'} Refresh before retrying.`,true);button.disabled=false;button.setAttribute('aria-busy','false');}
}
export function loadStaffWorksiteIssues811(){if(!$('build811StaffList'))return;
  $('build811StaffRefresh').addEventListener('click',load);
  $('build811StaffFilter').addEventListener('change',render);
  $('build811StaffList').addEventListener('submit',submitReview);
  $('build811StaffList').addEventListener('click',submitAction);
  load();
}
