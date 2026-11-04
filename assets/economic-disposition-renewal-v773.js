const el=id=>document.getElementById(id);
const endpoint='/api/admin/economic_disposition_renewal_v773';
let packet=null;
const status=message=>{el('status773').textContent=message;};
for(const [fileId,textId] of [
  ['filePost773','postOwner773'],['fileReadiness773','readinessOwner773'],
  ['fileAuthorization773','authorizationOwner773'],
  ['fileAcceptance773','acceptanceOwner773'],['fileFinal773','finalOwner773'],
  ['fileContinuity773','continuityOwner773'],
  ['fileReview773','reviewOwner773']
])el(fileId).addEventListener('change',async()=>{
  const file=el(fileId).files?.[0];if(!file)return;
  if(file.size>18000){status('HOLD — Signed original evidence exceeds 18 KB.');return;}
  try{const raw=await file.text();JSON.parse(raw);el(textId).value=raw;
    status(`${file.name} imported locally. No original evidence stored by the site.`);}
  catch{status(`HOLD — Invalid signed JSON in ${file.name}.`);}
});
function followups(items){
  const rows=el('follow773');rows.replaceChildren();
  for(const item of items||[]){const row=document.createElement('tr');
    for(const value of [item.code,item.action]){const cell=document.createElement('td');
      cell.textContent=String(value??'—');row.appendChild(cell);}rows.appendChild(row);}
  if(!rows.children.length){const row=document.createElement('tr'),cell=document.createElement('td');
    cell.colSpan=2;cell.textContent='No independently witnessed outcome available.';
    row.appendChild(cell);rows.appendChild(row);}
}
async function configuration(){
  try{const response=await fetch(endpoint,{credentials:'same-origin',cache:'no-store'});
    const data=await response.json();if(!response.ok||!data.ok)
      throw Error(data.error||'Signed-in original owner session required.');
    const sources=Object.entries(data.provider_configuration||{}).map(([name,ready])=>
      `${name}: ${ready?'configured':'NOT configured'}`).join(' · ');
    el('config773').textContent=`Read-only independent source review · ${sources}. Original business actions disabled.`;
  }catch(error){el('config773').textContent=`HOLD — ${error.message}`;}
}
el('form773').addEventListener('submit',async event=>{
  event.preventDefault();packet=null;el('export773').disabled=true;
  let body;
  try{body={booking_id:el('booking773').value.trim(),
    source_record_id:el('source773').value.trim(),
    change_ticket_id:el('ticket773').value.trim(),
    execution_request_id:el('request773').value.trim(),
    owner_postchange_decision:JSON.parse(el('postOwner773').value),
    owner_closure_readiness_decision:JSON.parse(el('readinessOwner773').value),
    owner_explicit_closure_authorization:JSON.parse(el('authorizationOwner773').value),
    owner_postclosure_acceptance_decision:JSON.parse(el('acceptanceOwner773').value),
    original_owner_final_manual_decision:JSON.parse(el('finalOwner773').value),
    original_owner_signoff_continuity:JSON.parse(el('continuityOwner773').value),
    original_owner_disposition_renewal_review:JSON.parse(el('reviewOwner773').value)};
  }catch{status('HOLD — Seven original signed owner envelopes are required.');return;}
  el('verify773').disabled=true;
  status('Re-authenticating the full source chain, independent disposition, owner renewal and SLA remediation…');
  try{const response=await fetch(endpoint,{method:'POST',credentials:'same-origin',
    cache:'no-store',headers:{'Content-Type':'application/json',Accept:'application/json'},
    body:JSON.stringify(body)});
    const data=await response.json();el('result773').textContent=JSON.stringify(data,null,2);
    for(const [id,value] of [
      ['prior773',data.predecessor_resolution_status],
      ['owner773',data.original_owner_disposition_renewal_review?.status],
      ['disposition773',data.independent_external_disposition?.status],
      ['renewal773',data.independent_owner_signoff_renewal?.status],
      ['remediation773',data.independent_retention_sla_remediation?.status]
    ])el(id).textContent=value||'HOLD — Not independently verified';
    followups(data.follow_ups);
    status(`${data.external_disposition_signoff_status||'HOLD'} · ${data.blocking_count??'Unknown'} required follow-ups.`);
    if(response.ok&&data.ok){packet=data;el('export773').disabled=false;}
  }catch(error){status(`HOLD — Original source readback unavailable: ${error.message}`);}
  finally{el('verify773').disabled=false;}
});
el('export773').addEventListener('click',()=>{
  if(!packet)return;
  const url=URL.createObjectURL(new Blob([JSON.stringify(packet,null,2)],
    {type:'application/json'}));
  const a=document.createElement('a');a.href=url;
  a.download='rosie-unsigned-disposition-renewal-retention-remediation-v773.json';a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
});
configuration();
