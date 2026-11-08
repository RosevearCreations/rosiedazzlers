// Build 811 — customer-owned worksite concern intake and status. No outbound send.
import { preparationCandidates810 } from './customer-visit-preparation-v810.mjs';
const $=id=>typeof document==='undefined'?null:document.getElementById(id);
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const ISSUE_CATEGORIES_811=Object.freeze({
  parking_access:'Parking or driveway access',site_rules:'Building, permit or runoff rules',
  utilities_restriction:'Site water or power restrictions',weather:'Weather or site safety',
  vehicle_condition:'Vehicle condition or special care',arrival_contact:'Arrival contact or instructions',other:'Other worksite concern'
});
export const ISSUE_LABELS_811=Object.freeze({
  pending_review:'Awaiting staff review',reviewing:'Rosie is reviewing',resolved:'Reviewed — resolution recorded',closed_no_action:'Closed — see Rosie’s explanation'
});
export function eligibleIssueBookings811(bookings,changeRequests) {return preparationCandidates810(bookings,changeRequests);}
export function issueDraft811(values,bookings,issues) {
  const booking=(Array.isArray(bookings)?bookings:[]).find(row=>row.id===values.booking_id);
  if(!booking)return {ok:false,message:'Select an upcoming appointment linked to your account.'};
  if((Array.isArray(issues)?issues:[]).some(row=>row.booking_id===booking.id&&['pending_review','reviewing'].includes(row.status)))
    return {ok:false,message:'Rosie is already reviewing a worksite report for this appointment. Check its status below.'};
  if(!Object.hasOwn(ISSUE_CATEGORIES_811,values.category))return {ok:false,message:'Choose a worksite concern type.'};
  const description=String(values.description||'').trim();
  if(description.length<15||description.length>1000)return {ok:false,message:'Describe the concern in 15–1000 characters.'};
  return {ok:true,message:'Your report will be saved for staff review. Your appointment and payment will not change automatically.'};
}

let accountId='',candidates=[],issues=[],loaded=false,wired=false,fetchEpoch=0,pendingKey=null,lastFingerprint=null;
function status(message,error=false){const el=$('build811CustomerStatus');if(el){el.className=error?'notice bad':'notice';el.textContent=message;}}
function renderHistory811(){const el=$('build811CustomerHistory');if(!el)return;
  el.innerHTML=loaded?(issues.length?issues.map(row=>`<article class="build811-issue"><span class="badge">${esc(ISSUE_LABELS_811[row.status]||'Staff review')}</span><h4>${esc(ISSUE_CATEGORIES_811[row.category]||'Worksite concern')}</h4><p><strong>Booking:</strong> ${esc(candidates.find(x=>x.id===row.booking_id)?.service_date||'Reference on file')} · Reported ${esc(String(row.submitted_at||'').slice(0,10))}</p><p>${esc(row.description||'')}</p>${row.resolution?`<p><strong>Rosie’s update:</strong> ${esc(row.resolution)}</p>`:''}<p class="muted">Status recorded by Rosie; no booking, payment or arrival changes are implied.</p></article>`).join(''):'<p class="muted">No worksite issues linked to this account.</p>'):'<p class="muted">Sign in and load your account to see issue status.</p>';
}
function currentDraft811(){return {booking_id:$('build811Booking')?.value||'',category:$('build811Category')?.value||'',description:$('build811Description')?.value||''};}
function renderControls811(){const select=$('build811Booking'),submit=$('build811Submit'),preview=$('build811Preview');if(!select||!submit||!preview)return;
  const current=select.value;
  select.innerHTML='<option value="">Choose an upcoming appointment</option>'+candidates.map(row=>`<option value="${esc(row.id)}">${esc(row.service_date)} · ${esc(row.package_code||'Detailing')}</option>`).join('');
  if(candidates.some(row=>row.id===current))select.value=current;
  select.disabled=!loaded||candidates.length===0;
  const decision=loaded?issueDraft811(currentDraft811(),candidates,issues):{ok:false,message:'Your signed-in appointment history must load before reporting.'};
  preview.textContent=decision.message;
  preview.dataset.state=decision.ok?'ready':'blocked';
  submit.disabled=!decision.ok||$('build811Form').getAttribute('aria-busy')==='true';
}
async function fetchIssues811(epoch){const response=await fetch('/api/client/worksite_issues_v811',{credentials:'include',cache:'no-store'});
  const data=await response.json().catch(()=>null);
  if(!response.ok||!data?.ok||!Array.isArray(data.issues))throw Error(data?.error||'Could not load your issue reports.');
  if(epoch!==fetchEpoch)return;
  issues=data.issues;loaded=true;renderHistory811();renderControls811();status(`${issues.length} worksite report${issues.length===1?'':'s'} on file. Contact Rosie directly about urgent safety concerns.`);
}
async function submit811(event){event.preventDefault();const form=$('build811Form');if(form.getAttribute('aria-busy')==='true')return;
  const body=currentDraft811(),decision=issueDraft811(body,candidates,issues);
  if(!loaded||!decision.ok){status(decision.message||'Refresh your account first.',true);return;}
  const fingerprint=JSON.stringify(body);
  if(fingerprint!==lastFingerprint){lastFingerprint=fingerprint;pendingKey=crypto.randomUUID();}
  body.client_request_id=pendingKey;
  form.setAttribute('aria-busy','true');renderControls811();status('Saving worksite report for staff review…');
  const epoch=fetchEpoch;
  try{const response=await fetch('/api/client/worksite_issues_v811',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    const result=await response.json().catch(()=>null);
    if(!response.ok||!result?.ok)throw Error(result?.error||'Could not save the report.');
    if(epoch!==fetchEpoch)return;
    lastFingerprint=null;pendingKey=null;form.reset();
    await fetchIssues811(epoch);
    status('Report recorded for staff review. Your appointment and payment were NOT changed. For urgent problems, contact Rosie directly.');
  }catch(error){if(epoch===fetchEpoch)status(`${error.message||'Could not confirm the report.'} A network issue can occur after saving. Refresh the history before trying again.`,true);}
  finally{if(epoch===fetchEpoch){form.setAttribute('aria-busy','false');renderControls811();}}
}
function wire811(){if(wired||!$('build811Form'))return;wired=true;
  $('build811Form').addEventListener('submit',submit811);
  for(const id of ['build811Booking','build811Category','build811Description']){
    document.getElementById(id)?.addEventListener('input',()=>{renderControls811();});
    document.getElementById(id)?.addEventListener('change',()=>{renderControls811();});
  }
  $('build811Refresh').addEventListener('click',async()=>{const epoch=fetchEpoch;loaded=false;renderControls811();status('Refreshing issue history…');try{await fetchIssues811(epoch);}catch(error){if(epoch===fetchEpoch){clearCustomerWorksiteIssues811();status(error.message||'Refresh unavailable.',true);}}});
}
export function clearCustomerWorksiteIssues811(){fetchEpoch++;accountId='';candidates=[];issues=[];loaded=false;pendingKey=null;lastFingerprint=null;
  $('build811Form')?.reset();if($('build811Form'))$('build811Form').setAttribute('aria-busy','false');renderHistory811();renderControls811();status('Sign in to report an issue with your upcoming appointment.');}
export async function loadCustomerWorksiteIssues811(dashboard,changeRequests=[]){if(typeof document==='undefined'||!$('build811Form'))return;
  const profile=String(dashboard?.customer?.id||'');
  if(!dashboard?.ok||!dashboard?.authenticated||!UUID.test(profile)){clearCustomerWorksiteIssues811();return;}
  if(profile!==accountId){issues=[];pendingKey=null;lastFingerprint=null;}
  accountId=profile;candidates=eligibleIssueBookings811(dashboard.bookings,changeRequests);loaded=false;
  const epoch=++fetchEpoch;wire811();renderHistory811();renderControls811();status('Loading your worksite report history…');
  try{await fetchIssues811(epoch);}catch(error){if(epoch===fetchEpoch){clearCustomerWorksiteIssues811();status(error.message||'Issue history unavailable. Nothing was sent.',true);}}
}
