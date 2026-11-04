const el=id=>document.getElementById(id);
const endpoint='/api/admin/economic_handoff_retention_v769';
let packet=null;
const status=msg=>{el('status769').textContent=msg;};
for(const [fileId,textId] of [
  ['filePost769','postOwner769'],['fileReadiness769','readinessOwner769'],
  ['fileAuthorization769','authorizationOwner769'],['fileAcceptance769','acceptanceOwner769']
])el(fileId).addEventListener('change',async()=>{
  const file=el(fileId).files?.[0];if(!file)return;
  if(file.size>18000){status('HOLD — Signed decision exceeds 18 KB.');return;}
  try{const raw=await file.text();JSON.parse(raw);el(textId).value=raw;
    status(`${file.name} imported locally; nothing saved to the website.`);}
  catch{status(`HOLD — Invalid signed JSON in ${file.name}.`);}
});
function followups(list){
  const target=el('follow769');target.replaceChildren();
  for(const item of list||[]){const row=document.createElement('tr');
    for(const value of [item.code,item.action]){
      const cell=document.createElement('td');cell.textContent=String(value??'—');row.appendChild(cell);
    }target.appendChild(row);}
  if(!target.children.length){const row=document.createElement('tr'),cell=document.createElement('td');
    cell.colSpan=2;cell.textContent='No verified external evidence available.';
    row.appendChild(cell);target.appendChild(row);}
}
async function configuration(){
  try{const response=await fetch(endpoint,{credentials:'same-origin',cache:'no-store'});
    const data=await response.json();
    if(!response.ok||!data.ok)throw Error(data.error||'Owner sign-in required.');
    const sources=Object.entries(data.provider_configuration||{}).map(([name,enabled])=>
      `${name}: ${enabled?'configured':'NOT configured'}`).join(' · ');
    el('config769').textContent=`Read-only original-source review · ${sources}. No business action.`;
  }catch(error){el('config769').textContent=`HOLD — ${error.message}`;}
}
el('form769').addEventListener('submit',async event=>{
  event.preventDefault();packet=null;el('export769').disabled=true;
  let body;
  try{body={booking_id:el('booking769').value.trim(),
    source_record_id:el('source769').value.trim(),
    change_ticket_id:el('ticket769').value.trim(),
    execution_request_id:el('request769').value.trim(),
    owner_postchange_decision:JSON.parse(el('postOwner769').value),
    owner_closure_readiness_decision:JSON.parse(el('readinessOwner769').value),
    owner_explicit_closure_authorization:JSON.parse(el('authorizationOwner769').value),
    owner_postclosure_acceptance_decision:JSON.parse(el('acceptanceOwner769').value)};
  }catch{status('HOLD — Four original owner-signed JSON envelopes required.');return;}
  el('verify769').disabled=true;
  status('Re-authenticating earlier evidence and fetching independent handoff, reopening and retention sources…');
  try{const response=await fetch(endpoint,{method:'POST',credentials:'same-origin',
    cache:'no-store',headers:{'Content-Type':'application/json',Accept:'application/json'},
    body:JSON.stringify(body)});
    const data=await response.json();
    el('result769').textContent=JSON.stringify(data,null,2);
    for(const [id,value] of [
      ['prior769',data.predecessor_owner_acceptance_status],
      ['handoff769',data.owner_handoff?.status],
      ['outcome769',data.external_reopen_outcome?.status],
      ['retention769',data.postclosure_retention_continuity?.status]
    ])el(id).textContent=value||'HOLD — Not independently verified';
    followups(data.follow_ups);
    status(`${data.handoff_retention_status||'HOLD'} · ${data.blocking_count??'Unknown'} follow-ups.`);
    if(response.ok&&data.ok){packet=data;el('export769').disabled=false;}
  }catch(error){status(`HOLD — External review unavailable: ${error.message}`);}
  finally{el('verify769').disabled=false;}
});
el('export769').addEventListener('click',()=>{
  if(!packet)return;
  const url=URL.createObjectURL(new Blob([JSON.stringify(packet,null,2)],
    {type:'application/json'}));
  const link=document.createElement('a');link.href=url;
  link.download='rosie-unsigned-owner-handoff-retention-v769.json';link.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
});
configuration();
