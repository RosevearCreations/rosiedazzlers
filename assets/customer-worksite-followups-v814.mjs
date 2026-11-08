// Build 814: verified customer requests, replies and resolution confirmation.
import { eventTimeToronto813 } from './worksite-timeline-v813.mjs';
import { ISSUE_CATEGORIES_811 } from './customer-worksite-issues-v811.mjs';
const $=id=>typeof document==='undefined'?null:document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const FOLLOWUP_LABELS_814=Object.freeze({awaiting_staff:'Waiting for Rosie’s response',staff_replied:'Rosie responded — confirmation requested',confirmed:'Customer confirmed resolved',needs_more_help:'Customer requested more help'});
export const FOLLOWUP_KINDS_814=Object.freeze({clarification:'Clarify Rosie’s answer',new_information:'Share new worksite information',still_unresolved:'Still unresolved',other:'Other question'});
export function followupDraft814(values,issues,followups){
  const issue=(Array.isArray(issues)?issues:[]).find(r=>r.id===values.issue_id);
  if(!issue)return {ok:false,message:'Choose a worksite issue that belongs to your signed-in account.'};
  if((Array.isArray(followups)?followups:[]).some(r=>r.issue_id===issue.id&&['awaiting_staff','staff_replied'].includes(r.status)))
    return {ok:false,message:'There is already an open follow-up for this issue. Review the response or confirm it first.'};
  if(!Object.hasOwn(FOLLOWUP_KINDS_814,values.request_kind))return {ok:false,message:'Choose a reason for your follow-up.'};
  const text=String(values.request_text||'').trim();
  if(text.length<12||text.length>1000)return {ok:false,message:'Describe your question in 12–1000 characters.'};
  return {ok:true,message:'This saves a follow-up for staff review in My Account. It does not email Rosie or change the appointment.'};
}
export function confirmationDecision814(status,decision,feedback){
  if(status!=='staff_replied'||!['confirmed','needs_more_help'].includes(decision))return false;
  const text=String(feedback||'').trim();return text.length<=500&&(decision==='confirmed'||text.length>=12);
}
let issues=[],followups=[],escalations=[],escalationReady=false,available=false,wired=false,epoch=0,pendingKey=null,lastFingerprint=null;
export function customerGuidance815(row,escalation){
  if(row.status==='staff_replied')return 'Please review Rosie’s response and confirm whether it resolved your concern.';
  if(row.status==='confirmed')return 'You confirmed the answer resolved your concern.';
  if(row.status==='needs_more_help')return 'You requested more help. You may send another follow-up or contact Rosie directly.';
  if(escalation?.status==='flagged')return 'Your request has been flagged for supervisor review. A response has not yet been recorded.';
  if(escalation?.status==='acknowledged')return 'A supervisor has acknowledged your concern. A response is still pending.';
  return 'Your follow-up is awaiting staff response. Please refresh My Account for updates.';
}
function customerProgress815(row){if(!escalationReady)return '<p class="muted">Supervisor review progress is temporarily unavailable; your follow-up history is still available.</p>';
  const e=escalations.find(v=>v.followup_id===row.id);if(!e)return '';
  return `<p class="build815-customer-progress"><strong>Supervisor review:</strong> ${e.status==='flagged'?'Flagged for supervisor review':e.status==='acknowledged'?'Supervisor acknowledged':e.status==='cleared'?'Supervisor review completed':'Review pending'}
    · ${esc(eventTimeToronto813(e.status==='cleared'?e.cleared_at:e.status==='acknowledged'?e.acknowledged_at:e.flagged_at))}</p>`;}
function notice(s,err=false){const el=$('build814CustomerStatus');if(el){el.className=err?'notice bad':'notice';el.textContent=s;}}
function draft(){return {issue_id:$('build814Issue')?.value||'',request_kind:$('build814Kind')?.value||'',request_text:$('build814Text')?.value||''};}
function renderControls(){const select=$('build814Issue'),submit=$('build814Submit'),preview=$('build814Preview'),form=$('build814Form');if(!select||!submit||!preview||!form)return;
  const old=select.value;select.innerHTML='<option value="">Choose a saved worksite report</option>'+issues.map(row=>`<option value="${esc(row.id)}">${esc(ISSUE_CATEGORIES_811[row.category]||'Worksite concern')} · ${esc(String(row.submitted_at||'').slice(0,10))}</option>`).join('');
  if(issues.some(row=>row.id===old))select.value=old;select.disabled=!available||!issues.length;
  const result=available?followupDraft814(draft(),issues,followups):{ok:false,message:'Your signed-in follow-up history must load before submission.'};
  preview.textContent=result.message;submit.disabled=!result.ok||form.getAttribute('aria-busy')==='true';
}
function renderHistory(){const target=$('build814CustomerHistory');if(!target)return;
  target.innerHTML=available?(followups.length?followups.map(row=>`<article class="build811-issue" data-build814-followup="${esc(row.id)}">
    <span class="badge">${esc(FOLLOWUP_LABELS_814[row.status]||'Staff review')}</span>
    <h4>${esc(FOLLOWUP_KINDS_814[row.request_kind]||'Worksite follow-up')}</h4>
    <p class="muted">${esc(ISSUE_CATEGORIES_811[issues.find(i=>i.id===row.issue_id)?.category]||'Related worksite report')} · ${esc(eventTimeToronto813(row.requested_at))}</p>
    <p><strong>Our question:</strong> ${esc(row.request_text)}</p>
    ${row.staff_response?`<p class="build814-response"><strong>Rosie’s response:</strong> ${esc(row.staff_response)}<br><span class="muted">Recorded ${esc(eventTimeToronto813(row.staff_responded_at))}. Viewable here; no outbound notification was sent.</span></p>`:''}
    ${row.customer_decided_at?`<p><strong>Our confirmation:</strong> ${row.status==='confirmed'?'Marked resolved':'More help needed'} · ${esc(eventTimeToronto813(row.customer_decided_at))}${row.customer_feedback?` · ${esc(row.customer_feedback)}`:''}</p>`:''}
    ${customerProgress815(row)}
    <p class="build815-customer-next"><strong>Next step:</strong> ${esc(customerGuidance815(row,escalationReady?escalations.find(e=>e.followup_id===row.id):null))}</p>
    ${row.status==='staff_replied'?`<form class="build814-confirm" data-build814-confirm="${esc(row.id)}" aria-busy="false"><p><strong>Did Rosie’s response resolve your question?</strong></p>
      <label>Decision<select name="decision"><option value="confirmed">Yes, this answered my question</option><option value="needs_more_help">No, I still need help</option></select></label>
      <label>Optional note (required when more help is needed)<textarea name="feedback" maxlength="500" rows="2" placeholder="What is still unclear or unresolved?"></textarea></label>
      <button class="btn primary" type="submit">Record my confirmation</button></form>`:''}
    ${row.status==='needs_more_help'?'<p class="muted">Your feedback was recorded for staff review. You may submit another follow-up about this issue or contact Rosie directly for urgent help.</p>':''}
    <p class="muted">The booking, payment and worksite issue’s original resolution status are unchanged by this follow-up.</p>
  </article>`).join(''):'<p class="muted">No follow-up requests on file. Select a saved report to ask Rosie a question.</p>'):'<p class="muted">Sign in and load your worksite reports to view follow-ups.</p>';
}
async function refresh(expected){const response=await fetch('/api/client/worksite_followups_v814',{credentials:'include',cache:'no-store'});
  const data=await response.json().catch(()=>null);if(!response.ok||!data?.ok||!Array.isArray(data.followups))throw Error(data?.error||'Could not load follow-ups.');
  if(expected!==epoch)return;followups=data.followups;available=true;
  try{const response=await fetch('/api/client/worksite_escalation_v815',{credentials:'include',cache:'no-store'});const data=await response.json().catch(()=>null);
    if(!response.ok||!data?.ok||!Array.isArray(data.escalations))throw Error('Supervisor progress unavailable');
    escalations=data.escalations;escalationReady=true;
  }catch{escalations=[];escalationReady=false;}
  if(expected!==epoch)return;renderHistory();renderControls();
  notice(`${followups.filter(r=>r.status==='awaiting_staff').length} awaiting staff response · ${followups.filter(r=>r.status==='staff_replied').length} waiting for your confirmation. ${escalationReady?'Supervisor progress is current as of refresh.':'Supervisor progress is temporarily unavailable.'} No response deadline is promised.`);
}
async function submitRequest(event){event.preventDefault();const form=$('build814Form');if(form.getAttribute('aria-busy')==='true')return;
  const values=draft(),result=followupDraft814(values,issues,followups);
  if(!available||!result.ok){notice(result.message||'Refresh your history.',true);return;}
  const fingerprint=JSON.stringify(values);if(fingerprint!==lastFingerprint){lastFingerprint=fingerprint;pendingKey=crypto.randomUUID();}
  const expected=epoch;form.setAttribute('aria-busy','true');renderControls();notice('Saving your follow-up…');
  try{const response=await fetch('/api/client/worksite_followups_v814',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({...values,action:'request',client_request_id:pendingKey})});
    const data=await response.json().catch(()=>null);if(!response.ok||!data?.ok)throw Error(data?.error||'Could not confirm the request.');
    if(expected!==epoch)return;pendingKey=null;lastFingerprint=null;form.reset();await refresh(expected);
    notice('Follow-up saved for staff review in My Account. No new message, booking change or payment was made.');
  }catch(error){if(expected===epoch)notice(`${error.message||'Request not confirmed.'} Refresh history before retrying; the request may already be saved.`,true);}
  finally{if(expected===epoch){form.setAttribute('aria-busy','false');renderControls();}}
}
async function submitConfirmation(event){const form=event.target.closest?.('[data-build814-confirm]');if(!form)return;event.preventDefault();if(form.getAttribute('aria-busy')==='true')return;
  const followup=followups.find(row=>row.id===form.dataset.build814Confirm);if(!followup)return;
  const decision=form.elements.namedItem('decision').value,feedback=form.elements.namedItem('feedback').value.trim();
  if(!confirmationDecision814(followup.status,decision,feedback)){notice('For more help, explain the remaining concern in 12–500 characters.',true);return;}
  if(!window.confirm('Record this confirmation in My Account? This does not email staff or change the booking.'))return;
  const expected=epoch;form.setAttribute('aria-busy','true');form.querySelector('button').disabled=true;notice('Recording your decision…');
  try{const response=await fetch('/api/client/worksite_followups_v814',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'confirm',followup_id:followup.id,expected_revision:followup.workflow_revision,decision,feedback})});
    const data=await response.json().catch(()=>null);if(!response.ok||!data?.ok)throw Error(data?.error||'Decision not confirmed.');
    if(expected!==epoch)return;await refresh(expected);notice(decision==='confirmed'?'Your resolution confirmation was saved. Thank you.':'Your need for more help was recorded. Open a new follow-up or contact Rosie directly.');
  }catch(error){if(expected===epoch){notice(`${error.message||'Decision not confirmed.'} Refresh before trying again.`,true);form.setAttribute('aria-busy','false');form.querySelector('button').disabled=false;}}
}
function wire(){if(wired||!$('build814Form'))return;wired=true;
  $('build814Form').addEventListener('submit',submitRequest);
  for(const id of ['build814Issue','build814Kind','build814Text']){$(id)?.addEventListener('input',renderControls);$(id)?.addEventListener('change',renderControls);}
  $('build814CustomerHistory').addEventListener('submit',submitConfirmation);
  $('build814Refresh').addEventListener('click',async()=>{const e=epoch;available=false;renderControls();notice('Refreshing follow-up history…');try{await refresh(e);}catch(error){if(e===epoch){renderHistory();notice(error.message||'Refresh unavailable.',true);}}});
}
export function clearCustomerWorksiteFollowups814(){epoch++;issues=[];followups=[];escalations=[];escalationReady=false;available=false;pendingKey=null;lastFingerprint=null;
  $('build814Form')?.reset();if($('build814Form'))$('build814Form').setAttribute('aria-busy','false');renderControls();renderHistory();notice('Sign in to view and submit follow-ups.');}
export async function loadCustomerWorksiteFollowups814(ownedIssues){if(typeof document==='undefined'||!$('build814Form'))return;
  const current=Array.isArray(ownedIssues)?ownedIssues:[];issues=current;available=false;wire();renderControls();renderHistory();
  const e=++epoch;notice('Loading customer follow-up history…');try{await refresh(e);}catch(error){if(e===epoch){renderHistory();notice(error.message||'Follow-ups unavailable.',true);}}
}
