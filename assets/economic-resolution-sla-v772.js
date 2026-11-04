const el=id=>document.getElementById(id);
const endpoint='/api/admin/economic_resolution_sla_v772';
let packet=null;
const status=message=>{el('status772').textContent=message;};
for(const [fileId,textId] of [
  ['filePost772','postOwner772'],['fileReadiness772','readinessOwner772'],
  ['fileAuthorization772','authorizationOwner772'],
  ['fileAcceptance772','acceptanceOwner772'],['fileFinal772','finalOwner772'],
  ['fileContinuity772','continuityOwner772']
])el(fileId).addEventListener('change',async()=>{
  const file=el(fileId).files?.[0];if(!file)return;
  if(file.size>18000){status('HOLD — Signed original evidence exceeds 18 KB.');return;}
  try{const raw=await file.text();JSON.parse(raw);el(textId).value=raw;
    status(`${file.name} imported locally. No original evidence stored by the site.`);}
  catch{status(`HOLD — Invalid signed JSON in ${file.name}.`);}
});
function followups(items){
  const rows=el('follow772');rows.replaceChildren();
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
    el('config772').textContent=`Read-only independent source review · ${sources}. Original business actions disabled.`;
  }catch(error){el('config772').textContent=`HOLD — ${error.message}`;}
}
el('form772').addEventListener('submit',async event=>{
  event.preventDefault();packet=null;el('export772').disabled=true;
  let body;
  try{body={booking_id:el('booking772').value.trim(),
    source_record_id:el('source772').value.trim(),
    change_ticket_id:el('ticket772').value.trim(),
    execution_request_id:el('request772').value.trim(),
    owner_postchange_decision:JSON.parse(el('postOwner772').value),
    owner_closure_readiness_decision:JSON.parse(el('readinessOwner772').value),
    owner_explicit_closure_authorization:JSON.parse(el('authorizationOwner772').value),
    owner_postclosure_acceptance_decision:JSON.parse(el('acceptanceOwner772').value),
    original_owner_final_manual_decision:JSON.parse(el('finalOwner772').value),
    original_owner_signoff_continuity:JSON.parse(el('continuityOwner772').value)};
  }catch{status('HOLD — Six original signed owner envelopes are required.');return;}
  el('verify772').disabled=true;
  status('Re-authenticating the full original source chain, external resolution and SLA…');
  try{const response=await fetch(endpoint,{method:'POST',credentials:'same-origin',
    cache:'no-store',headers:{'Content-Type':'application/json',Accept:'application/json'},
    body:JSON.stringify(body)});
    const data=await response.json();el('result772').textContent=JSON.stringify(data,null,2);
    for(const [id,value] of [
      ['prior772',data.predecessor_final_owner_review_status],
      ['owner772',data.original_owner_signoff_continuity_request?.status],
      ['resolution772',data.independent_external_resolution_receipt?.status],
      ['signoff772',data.independent_owner_signoff_continuity_witness?.status],
      ['sla772',data.independent_retention_escalation_sla?.status]
    ])el(id).textContent=value||'HOLD — Not independently verified';
    followups(data.follow_ups);
    status(`${data.final_owner_resolution_status||'HOLD'} · ${data.blocking_count??'Unknown'} required follow-ups.`);
    if(response.ok&&data.ok){packet=data;el('export772').disabled=false;}
  }catch(error){status(`HOLD — Original source readback unavailable: ${error.message}`);}
  finally{el('verify772').disabled=false;}
});
el('export772').addEventListener('click',()=>{
  if(!packet)return;
  const url=URL.createObjectURL(new Blob([JSON.stringify(packet,null,2)],
    {type:'application/json'}));
  const a=document.createElement('a');a.href=url;
  a.download='rosie-unsigned-resolution-signoff-retention-sla-v772.json';a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
});
configuration();
