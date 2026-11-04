const el=id=>document.getElementById(id);
const endpoint='/api/admin/economic_owner_register_v770';
let packet=null;
const status=text=>{el('status770').textContent=text;};
for(const [fileId,textId] of [
  ['filePost770','postOwner770'],['fileReadiness770','readinessOwner770'],
  ['fileAuthorization770','authorizationOwner770'],['fileAcceptance770','acceptanceOwner770']
])el(fileId).addEventListener('change',async()=>{
  const file=el(fileId).files?.[0];if(!file)return;
  if(file.size>18000){status('HOLD — Original owner receipt exceeds 18 KB.');return;}
  try{const raw=await file.text();JSON.parse(raw);el(textId).value=raw;
    status(`${file.name} imported locally. No signed evidence stored by this site.`);}
  catch{status(`HOLD — ${file.name} is not valid JSON.`);}
});
function followups(items){
  const rows=el('follow770');rows.replaceChildren();
  for(const item of items||[]){const row=document.createElement('tr');
    for(const text of [item.code,item.action]){const cell=document.createElement('td');
      cell.textContent=String(text??'—');row.appendChild(cell);}rows.appendChild(row);}
  if(!rows.children.length){const row=document.createElement('tr'),cell=document.createElement('td');
    cell.colSpan=2;cell.textContent='Original independent follow-up not available.';
    row.appendChild(cell);rows.appendChild(row);}
}
async function configuration(){
  try{const response=await fetch(endpoint,{credentials:'same-origin',cache:'no-store'});
    const data=await response.json();if(!response.ok||!data.ok)
      throw Error(data.error||'Owner sign-in required.');
    const config=Object.entries(data.provider_configuration||{}).map(([name,ready])=>
      `${name}: ${ready?'configured':'NOT configured'}`).join(' · ');
    el('config770').textContent=`Read-only independent evidence review · ${config}. No business action.`;
  }catch(error){el('config770').textContent=`HOLD — ${error.message}`;}
}
el('form770').addEventListener('submit',async event=>{
  event.preventDefault();packet=null;el('export770').disabled=true;
  let body;
  try{body={booking_id:el('booking770').value.trim(),
    source_record_id:el('source770').value.trim(),
    change_ticket_id:el('ticket770').value.trim(),
    execution_request_id:el('request770').value.trim(),
    owner_postchange_decision:JSON.parse(el('postOwner770').value),
    owner_closure_readiness_decision:JSON.parse(el('readinessOwner770').value),
    owner_explicit_closure_authorization:JSON.parse(el('authorizationOwner770').value),
    owner_postclosure_acceptance_decision:JSON.parse(el('acceptanceOwner770').value)};
  }catch{status('HOLD — Four original signed owner JSON envelopes required.');return;}
  el('verify770').disabled=true;
  status('Re-authenticating original owner and handoff custody, then checking decision register, acknowledgment and exception aging…');
  try{const response=await fetch(endpoint,{method:'POST',credentials:'same-origin',
    cache:'no-store',headers:{'Content-Type':'application/json',Accept:'application/json'},
    body:JSON.stringify(body)});
    const data=await response.json();el('result770').textContent=JSON.stringify(data,null,2);
    for(const [id,text] of [
      ['prior770',data.predecessor_handoff_retention_status],
      ['register770',data.independent_owner_decision_register?.status],
      ['ack770',data.independent_owner_handoff_acknowledgment?.status],
      ['aging770',data.independent_retention_exception_aging?.status],
      ['age770',data.independent_retention_exception_aging?.oldest_open_exception_age_hours==null?
        'Unverified':`${data.independent_retention_exception_aging.oldest_open_exception_age_hours} hours`],
      ['threshold770',data.independent_retention_exception_aging?.source_alert_threshold_hours==null?
        'Unverified':`${data.independent_retention_exception_aging.source_alert_threshold_hours} hours`]
    ])el(id).textContent=text||'HOLD — Not independently verified';
    followups(data.follow_ups);
    status(`${data.owner_register_status||'HOLD'} · ${data.blocking_count??'Unknown'} follow-ups.`);
    if(response.ok&&data.ok){packet=data;el('export770').disabled=false;}
  }catch(error){status(`HOLD — Original issuer evidence unavailable: ${error.message}`);}
  finally{el('verify770').disabled=false;}
});
el('export770').addEventListener('click',()=>{
  if(!packet)return;
  const url=URL.createObjectURL(new Blob([JSON.stringify(packet,null,2)],
    {type:'application/json'}));
  const a=document.createElement('a');a.href=url;
  a.download='rosie-unsigned-owner-decision-register-aging-v770.json';a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
});
configuration();
