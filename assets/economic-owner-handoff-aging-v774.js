const el=id=>document.getElementById(id);
const endpoint='/api/admin/economic_owner_handoff_aging_v774';
let packet=null;
const status=message=>{el('status774').textContent=message;};
for(const [fileId,textId] of [
  ['filePost774','postOwner774'],['fileReadiness774','readinessOwner774'],
  ['fileAuthorization774','authorizationOwner774'],
  ['fileAcceptance774','acceptanceOwner774'],['fileFinal774','finalOwner774'],
  ['fileContinuity774','continuityOwner774'],['fileReview774','reviewOwner774'],
  ['fileHandoff774','handoffOwner774']
])el(fileId).addEventListener('change',async()=>{
  const file=el(fileId).files?.[0];if(!file)return;
  if(file.size>18000){status('HOLD — Signed original evidence exceeds 18 KB.');return;}
  try{const raw=await file.text();JSON.parse(raw);el(textId).value=raw;
    status(`${file.name} imported locally. No original evidence stored by the site.`);}
  catch{status(`HOLD — Invalid signed JSON in ${file.name}.`);}
});
function followups(items){
  const rows=el('follow774');rows.replaceChildren();
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
    el('config774').textContent=`Read-only original-source evidence · ${sources}. No external business writes.`;
  }catch(error){el('config774').textContent=`HOLD — ${error.message}`;}
}
el('form774').addEventListener('submit',async event=>{
  event.preventDefault();packet=null;el('export774').disabled=true;
  let body;
  try{body={booking_id:el('booking774').value.trim(),
    source_record_id:el('source774').value.trim(),
    change_ticket_id:el('ticket774').value.trim(),
    execution_request_id:el('request774').value.trim(),
    owner_postchange_decision:JSON.parse(el('postOwner774').value),
    owner_closure_readiness_decision:JSON.parse(el('readinessOwner774').value),
    owner_explicit_closure_authorization:JSON.parse(el('authorizationOwner774').value),
    owner_postclosure_acceptance_decision:JSON.parse(el('acceptanceOwner774').value),
    original_owner_final_manual_decision:JSON.parse(el('finalOwner774').value),
    original_owner_signoff_continuity:JSON.parse(el('continuityOwner774').value),
    original_owner_disposition_renewal_review:JSON.parse(el('reviewOwner774').value),
    original_owner_renewal_handoff:JSON.parse(el('handoffOwner774').value)};
  }catch{status('HOLD — Eight original signed owner envelopes required.');return;}
  el('verify774').disabled=true;
  status('Re-verifying historical sources, owner handoff, dispute aging and retention closure witness…');
  try{const response=await fetch(endpoint,{method:'POST',credentials:'same-origin',
    cache:'no-store',headers:{'Content-Type':'application/json',Accept:'application/json'},
    body:JSON.stringify(body)});
    const data=await response.json();el('result774').textContent=JSON.stringify(data,null,2);
    for(const [id,value] of [
      ['prior774',data.predecessor_disposition_status],
      ['owner774',data.original_owner_handoff_review?.status],
      ['ack774',data.independent_renewal_handoff_acknowledgment?.status],
      ['aging774',data.independent_external_dispute_aging?.status],
      ['closure774',data.independent_retention_closure_witness?.status]
    ])el(id).textContent=value||'HOLD — Not independently verified';
    followups(data.follow_ups);
    status(`${data.owner_renewal_handoff_status||'HOLD'} · ${data.blocking_count??'Unknown'} external follow-ups.`);
    if(response.ok&&data.ok){packet=data;el('export774').disabled=false;}
  }catch(error){status(`HOLD — Original source readback unavailable: ${error.message}`);}
  finally{el('verify774').disabled=false;}
});
el('export774').addEventListener('click',()=>{
  if(!packet)return;
  const url=URL.createObjectURL(new Blob([JSON.stringify(packet,null,2)],{type:'application/json'}));
  const a=document.createElement('a');a.href=url;
  a.download='rosie-unsigned-owner-handoff-dispute-aging-retention-closure-v774.json';a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
});
configuration();
