const el=id=>document.getElementById(id);
const endpoint='/api/admin/economic_handoff_closure_v775';
let packet=null;
const status=message=>{el('status775').textContent=message;};
for(const [fileId,textId] of [
  ['filePost775','postOwner775'],['fileReadiness775','readinessOwner775'],
  ['fileAuthorization775','authorizationOwner775'],
  ['fileAcceptance775','acceptanceOwner775'],['fileFinal775','finalOwner775'],
  ['fileContinuity775','continuityOwner775'],['fileReview775','reviewOwner775'],
  ['fileHandoff775','handoffOwner775'],['fileClosure775','closureOwner775']
])el(fileId).addEventListener('change',async()=>{
  const file=el(fileId).files?.[0];if(!file)return;
  if(file.size>18000){status('HOLD — Signed original evidence exceeds 18 KB.');return;}
  try{const raw=await file.text();JSON.parse(raw);el(textId).value=raw;
    status(`${file.name} imported locally. No original evidence stored by the site.`);}
  catch{status(`HOLD — Invalid signed JSON in ${file.name}.`);}
});
function followups(items){
  const rows=el('follow775');rows.replaceChildren();
  for(const item of items||[]){const row=document.createElement('tr');
    for(const value of [item.code,item.action]){const cell=document.createElement('td');
      cell.textContent=String(value??'—');row.appendChild(cell);}rows.appendChild(row);}
  if(!rows.children.length){const row=document.createElement('tr'),cell=document.createElement('td');
    cell.colSpan=2;cell.textContent='No independently authenticated review available.';
    row.appendChild(cell);rows.appendChild(row);}
}
async function configuration(){
  try{const response=await fetch(endpoint,{credentials:'same-origin',cache:'no-store'});
    const data=await response.json();if(!response.ok||!data.ok)
      throw Error(data.error||'Signed-in owner session required.');
    const sources=Object.entries(data.provider_configuration||{}).map(([name,ready])=>
      `${name}: ${ready?'configured':'NOT configured'}`).join(' · ');
    el('config775').textContent=`Read-only original-source evidence · ${sources}. No external business writes.`;
  }catch(error){el('config775').textContent=`HOLD — ${error.message}`;}
}
el('form775').addEventListener('submit',async event=>{
  event.preventDefault();packet=null;el('export775').disabled=true;
  let body;
  try{body={booking_id:el('booking775').value.trim(),
    source_record_id:el('source775').value.trim(),
    change_ticket_id:el('ticket775').value.trim(),
    execution_request_id:el('request775').value.trim(),
    owner_postchange_decision:JSON.parse(el('postOwner775').value),
    owner_closure_readiness_decision:JSON.parse(el('readinessOwner775').value),
    owner_explicit_closure_authorization:JSON.parse(el('authorizationOwner775').value),
    owner_postclosure_acceptance_decision:JSON.parse(el('acceptanceOwner775').value),
    original_owner_final_manual_decision:JSON.parse(el('finalOwner775').value),
    original_owner_signoff_continuity:JSON.parse(el('continuityOwner775').value),
    original_owner_disposition_renewal_review:JSON.parse(el('reviewOwner775').value),
    original_owner_renewal_handoff:JSON.parse(el('handoffOwner775').value),
    original_owner_handoff_closure_review:JSON.parse(el('closureOwner775').value)};
  }catch{status('HOLD — Nine original signed owner envelopes required.');return;}
  el('verify775').disabled=true;
  status('Re-verifying all historical sources, handoff decision register, dispute escalation and source-retention continuity…');
  try{const response=await fetch(endpoint,{method:'POST',credentials:'same-origin',
    cache:'no-store',headers:{'Content-Type':'application/json',Accept:'application/json'},
    body:JSON.stringify(body)});
    const data=await response.json();el('result775').textContent=JSON.stringify(data,null,2);
    for(const [id,value] of [
      ['prior775',data.predecessor_handoff_status],
      ['owner775',data.original_owner_handoff_closure_review?.status],
      ['decision775',data.independent_handoff_decision_register?.status],
      ['escalation775',data.independent_dispute_aging_escalation?.status],
      ['retention775',data.independent_source_retention_continuity?.status]
    ])el(id).textContent=value||'HOLD — Not independently verified';
    followups(data.follow_ups);
    status(`${data.handoff_closure_decision_status||'HOLD'} · ${data.blocking_count??'Unknown'} external follow-ups.`);
    if(response.ok&&data.ok){packet=data;el('export775').disabled=false;}
  }catch(error){status(`HOLD — Original source readback unavailable: ${error.message}`);}
  finally{el('verify775').disabled=false;}
});
el('export775').addEventListener('click',()=>{
  if(!packet)return;
  const url=URL.createObjectURL(new Blob([JSON.stringify(packet,null,2)],{type:'application/json'}));
  const a=document.createElement('a');a.href=url;
  a.download='rosie-unsigned-handoff-decision-aging-escalation-source-retention-v775.json';a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
});
configuration();
