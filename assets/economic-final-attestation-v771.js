const el=id=>document.getElementById(id);
const endpoint='/api/admin/economic_final_attestation_v771';
let packet=null;
const status=text=>{el('status771').textContent=text;};
for(const [fileId,textId] of [
  ['filePost771','postOwner771'],['fileReadiness771','readinessOwner771'],
  ['fileAuthorization771','authorizationOwner771'],
  ['fileAcceptance771','acceptanceOwner771'],['fileFinal771','finalOwner771']
])el(fileId).addEventListener('change',async()=>{
  const file=el(fileId).files?.[0];if(!file)return;
  if(file.size>18000){status('HOLD — Original signed evidence file exceeds 18 KB.');return;}
  try{const raw=await file.text();JSON.parse(raw);el(textId).value=raw;
    status(`${file.name} imported locally. No evidence stored by the site.`);}
  catch{status(`HOLD — Invalid signed JSON in ${file.name}.`);}
});
function followups(items){
  const rows=el('follow771');rows.replaceChildren();
  for(const item of items||[]){const row=document.createElement('tr');
    for(const text of [item.code,item.action]){const cell=document.createElement('td');
      cell.textContent=String(text??'—');row.appendChild(cell);}rows.appendChild(row);}
  if(!rows.children.length){const row=document.createElement('tr'),cell=document.createElement('td');
    cell.colSpan=2;cell.textContent='No independent external outcome available.';
    row.appendChild(cell);rows.appendChild(row);}
}
async function configuration(){
  try{const response=await fetch(endpoint,{credentials:'same-origin',cache:'no-store'});
    const data=await response.json();if(!response.ok||!data.ok)
      throw Error(data.error||'Signed-in original owner session required.');
    const sources=Object.entries(data.provider_configuration||{}).map(([name,ready])=>
      `${name}: ${ready?'configured':'NOT configured'}`).join(' · ');
    el('config771').textContent=`Read-only original owner review · ${sources}. Business changes disabled.`;
  }catch(error){el('config771').textContent=`HOLD — ${error.message}`;}
}
el('form771').addEventListener('submit',async event=>{
  event.preventDefault();packet=null;el('export771').disabled=true;
  let body;
  try{body={booking_id:el('booking771').value.trim(),
    source_record_id:el('source771').value.trim(),
    change_ticket_id:el('ticket771').value.trim(),
    execution_request_id:el('request771').value.trim(),
    owner_postchange_decision:JSON.parse(el('postOwner771').value),
    owner_closure_readiness_decision:JSON.parse(el('readinessOwner771').value),
    owner_explicit_closure_authorization:JSON.parse(el('authorizationOwner771').value),
    owner_postclosure_acceptance_decision:JSON.parse(el('acceptanceOwner771').value),
    original_owner_final_manual_decision:JSON.parse(el('finalOwner771').value)};
  }catch{status('HOLD — Five original owner-signed JSON envelopes are required.');return;}
  el('verify771').disabled=true;
  status('Re-authenticating original source history and independent final decision, dispute and escalation reports…');
  try{const response=await fetch(endpoint,{method:'POST',credentials:'same-origin',
    cache:'no-store',headers:{'Content-Type':'application/json',Accept:'application/json'},
    body:JSON.stringify(body)});
    const data=await response.json();el('result771').textContent=JSON.stringify(data,null,2);
    for(const [id,value] of [
      ['prior771',data.predecessor_owner_register_status],
      ['owner771',data.original_owner_final_manual_decision?.status],
      ['attest771',data.independent_final_decision_attestation?.status],
      ['dispute771',data.independent_handoff_dispute_resolution?.status],
      ['escalation771',data.independent_retention_exception_escalation?.status]
    ])el(id).textContent=value||'HOLD — Not independently verified';
    followups(data.follow_ups);
    status(`${data.final_owner_review_status||'HOLD'} · ${data.blocking_count??'Unknown'} follow-ups.`);
    if(response.ok&&data.ok){packet=data;el('export771').disabled=false;}
  }catch(error){status(`HOLD — Original source review unavailable: ${error.message}`);}
  finally{el('verify771').disabled=false;}
});
el('export771').addEventListener('click',()=>{
  if(!packet)return;
  const url=URL.createObjectURL(new Blob([JSON.stringify(packet,null,2)],
    {type:'application/json'}));
  const a=document.createElement('a');a.href=url;
  a.download='rosie-unsigned-original-final-owner-review-v771.json';a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
});
configuration();
