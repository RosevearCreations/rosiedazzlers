// Build 811 — manual authorized operations queue. No customer messages are sent.
import { ISSUE_CATEGORIES_811, ISSUE_LABELS_811 } from './customer-worksite-issues-v811.mjs';
const $=id=>typeof document==='undefined'?null:document.getElementById(id);
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const STATUS_ACTIONS_811=Object.freeze({pending_review:['reviewing','resolved','closed_no_action'],reviewing:['resolved','closed_no_action']});
export function nextReviewStatuses811(status){return STATUS_ACTIONS_811[status]||[];}
let issues=[],loaded=false,busy=false;
function notice(message,fail=false){const node=$('build811StaffStatus');if(node){node.className=fail?'notice bad':'notice';node.textContent=message;}}
function filtered(){const filter=$('build811StaffFilter')?.value||'open';return issues.filter(row=>filter==='all'||(filter==='open'?['pending_review','reviewing'].includes(row.status):row.status===filter));}
function render(){const list=$('build811StaffList');if(!list)return;
  const open=issues.filter(row=>['pending_review','reviewing'].includes(row.status)).length;
  $('build811StaffCounts').textContent=loaded?`${open} awaiting a final decision · ${issues.length} in the latest review window.`:'No authorized issue queue loaded.';
  if(!loaded){list.innerHTML='<p class="muted">Waiting for authenticated staff review records.</p>';return;}
  const rows=filtered();
  list.innerHTML=rows.length?rows.map(row=>`<article class="build811-issue" data-build811-issue="${esc(row.id)}">
    <span class="badge">${esc(ISSUE_LABELS_811[row.status]||'Review required')}</span>
    <h3>${esc(ISSUE_CATEGORIES_811[row.category]||'Worksite concern')}</h3>
    <p class="muted">Booking: ${esc(row.booking_id)} · Reported ${esc(String(row.submitted_at||'').slice(0,16).replace('T',' '))} UTC</p>
    <p>${esc(row.description)}</p>
    ${row.private_note?`<p class="muted"><strong>Private staff note:</strong> ${esc(row.private_note)}</p>`:''}
    ${row.resolution?`<p><strong>Customer-visible answer:</strong> ${esc(row.resolution)}</p>`:''}
    ${nextReviewStatuses811(row.status).length?`<form data-build811-review="${esc(row.id)}" class="build811-staff-form" aria-busy="false">
      <label>Next review step<select name="status" required>${nextReviewStatuses811(row.status).map(x=>`<option value="${esc(x)}">${esc(ISSUE_LABELS_811[x])}</option>`).join('')}</select></label>
      <label>Customer-visible response (required when closing)<textarea name="resolution" maxlength="1000" rows="3" placeholder="Clear next steps for the customer; no private staff notes"></textarea></label>
      <label>Private staff note (optional)<textarea name="private_note" maxlength="800" rows="2" placeholder="Internal context only"></textarea></label>
      <button class="btn primary" type="submit">Save staff decision</button>
    </form>`:'<p class="muted">Final status recorded. This screen does not reopen decisions.</p>'}
  </article>`).join(''):'<p class="muted">No issues match this review filter.</p>';
}
async function load(){if(busy)return;busy=true;$('build811StaffRefresh').disabled=true;loaded=false;render();notice('Checking staff permission and loading worksite issues…');
  try{const response=await fetch('/api/admin/worksite_issue_review_v811',{credentials:'include',cache:'no-store'});
    const data=await response.json().catch(()=>null);
    if(!response.ok||!data?.ok||!Array.isArray(data.issues))throw Error(data?.error||'Could not load staff queue.');
    issues=data.issues;loaded=true;render();notice('Queue loaded. Updates are recorded manually; no booking or communication is changed.');
  }catch(error){issues=[];render();notice(`${error.message||'Staff queue unavailable.'} Operations permissions and an authenticated staff session are required.`,true);}
  finally{busy=false;$('build811StaffRefresh').disabled=false;}
}
async function submitReview(event){const form=event.target.closest?.('[data-build811-review]');if(!form)return;event.preventDefault();if(form.getAttribute('aria-busy')==='true')return;
  const id=form.getAttribute('data-build811-review');const row=issues.find(x=>x.id===id);if(!row)return;
  const status=form.elements.namedItem('status').value;
  const resolution=form.elements.namedItem('resolution').value.trim();
  if(!nextReviewStatuses811(row.status).includes(status)||status!=='reviewing'&&resolution.length<8){notice('Choose a valid status and give the customer a clear explanation before closing.',true);return;}
  if(!window.confirm('Record this review step? This does not notify the customer or alter the appointment.'))return;
  form.setAttribute('aria-busy','true');form.querySelector('button').disabled=true;notice('Recording review…');
  try{const response=await fetch('/api/admin/worksite_issue_review_v811',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({issue_id:id,expected_status:row.status,status,
    resolution,private_note:form.elements.namedItem('private_note').value.trim()})});
    const data=await response.json().catch(()=>null);if(!response.ok||!data?.ok)throw Error(data?.error||'Could not record decision.');
    await load();notice('Staff decision saved. The customer can see the current review status by opening My Account; no message was sent.');
  }catch(error){notice(`${error.message||'Review failed.'} Refresh before attempting another decision.`,true);form.setAttribute('aria-busy','false');form.querySelector('button').disabled=false;}
}
export function loadStaffWorksiteIssues811(){if(!$('build811StaffList'))return;
  $('build811StaffRefresh').addEventListener('click',load);
  $('build811StaffFilter').addEventListener('change',render);
  $('build811StaffList').addEventListener('submit',submitReview);
  load();
}
