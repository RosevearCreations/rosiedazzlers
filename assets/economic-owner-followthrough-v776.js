const el=id=>document.getElementById(id);
const endpoint='/api/admin/economic_owner_followthrough_v776';
let packet=null;
let recheckBody777=null;
let registerPacket779=null;
const status=message=>{el('status776').textContent=message;};
for(const [fileId,textId] of [
  ['filePost776','postOwner776'],['fileReadiness776','readinessOwner776'],
  ['fileAuthorization776','authorizationOwner776'],
  ['fileAcceptance776','acceptanceOwner776'],['fileFinal776','finalOwner776'],
  ['fileContinuity776','continuityOwner776'],['fileReview776','reviewOwner776'],
  ['fileHandoff776','handoffOwner776'],['fileClosure776','closureOwner776'],
  ['fileFollow776','followOwner776']
])el(fileId).addEventListener('change',async()=>{
  const file=el(fileId).files?.[0];if(!file)return;
  if(file.size>18000){status('HOLD — Original signed JSON exceeds 18 KB.');return;}
  try{const raw=await file.text();JSON.parse(raw);el(textId).value=raw;
    status(`${file.name} imported locally; no original source evidence stored.`);}
  catch{status(`HOLD — Invalid signed JSON in ${file.name}.`);}
});
function followups(items){
  const rows=el('follow776');rows.replaceChildren();
  for(const item of items||[]){
    const row=document.createElement('tr');
    for(const value of [item.code,item.action]){
      const cell=document.createElement('td');cell.textContent=String(value??'—');
      row.appendChild(cell);
    }rows.appendChild(row);
  }
  if(!rows.children.length){
    const row=document.createElement('tr'),cell=document.createElement('td');
    cell.colSpan=2;cell.textContent='HOLD — Independent signed follow-through not yet available.';
    row.appendChild(cell);rows.appendChild(row);
  }
}
async function configuration(){
  try{
    const response=await fetch(endpoint,{credentials:'same-origin',cache:'no-store'});
    const data=await response.json();
    if(!response.ok||!data.ok)throw Error(data.error||'Signed-in owner session required.');
    const sources=Object.entries(data.provider_configuration||{}).map(([name,ready])=>
      `${name}: ${ready?'configured':'NOT configured'}`).join(' · ');
    el('config776').textContent=`Read-only original issuer verification · ${sources}. No external writes.`;
  }catch(error){el('config776').textContent=`HOLD — ${error.message}`;}
}
el('form776').addEventListener('submit',async event=>{
  event.preventDefault();packet=null;recheckBody777=null;registerPacket779=null;
  el('export776').disabled=true;el('expiry777').disabled=true;
  el('renew778').disabled=true;
  el('register779').disabled=true;el('exportRegister779').disabled=true;
  el('registerRows779').replaceChildren();
  el('registerResult779').textContent='HOLD — Original signed source verification must be repeated.';
  let body;
  try{
    body={booking_id:el('booking776').value.trim(),
      source_record_id:el('source776').value.trim(),
      change_ticket_id:el('ticket776').value.trim(),
      execution_request_id:el('request776').value.trim(),
      owner_postchange_decision:JSON.parse(el('postOwner776').value),
      owner_closure_readiness_decision:JSON.parse(el('readinessOwner776').value),
      owner_explicit_closure_authorization:JSON.parse(el('authorizationOwner776').value),
      owner_postclosure_acceptance_decision:JSON.parse(el('acceptanceOwner776').value),
      original_owner_final_manual_decision:JSON.parse(el('finalOwner776').value),
      original_owner_signoff_continuity:JSON.parse(el('continuityOwner776').value),
      original_owner_disposition_renewal_review:JSON.parse(el('reviewOwner776').value),
      original_owner_renewal_handoff:JSON.parse(el('handoffOwner776').value),
      original_owner_handoff_closure_review:JSON.parse(el('closureOwner776').value),
      original_owner_followthrough_review:JSON.parse(el('followOwner776').value)};
  }catch{status('HOLD — Ten original-owner signed JSON envelopes are required.');return;}
  recheckBody777=body;
  el('expiry777').disabled=false;
  el('renew778').disabled=false;
  el('register779').disabled=false;
  el('verify776').disabled=true;
  status('Rechecking original Build 775 chain and independent owner follow-through, aging exceptions and source custody…');
  try{
    const response=await fetch(endpoint,{method:'POST',credentials:'same-origin',
      cache:'no-store',headers:{'Content-Type':'application/json',Accept:'application/json'},
      body:JSON.stringify(body)});
    const data=await response.json();
    el('result776').textContent=JSON.stringify(data,null,2);
    for(const [id,value] of [
      ['prior776',data.predecessor_status],
      ['owner776',data.original_owner_followthrough_review?.status],
      ['decision776',data.independent_closure_followthrough?.status],
      ['exception776',data.independent_aging_exception_disposition?.status],
      ['custody776',data.independent_retention_custody_renewal?.status]
    ])el(id).textContent=value||'HOLD — Not independently verified';
    followups(data.follow_ups);
    status(`${data.owner_followthrough_status||'HOLD'} · ${data.blocking_count??'Unknown'} external follow-ups.`);
    if(response.ok&&data.ok){packet=data;el('export776').disabled=false;}
  }catch(error){status(`HOLD — Original signed source verification unavailable: ${error.message}`);}
  finally{el('verify776').disabled=false;}
});
el('expiry777').addEventListener('click',async()=>{
  if(!recheckBody777)return;
  el('expiry777').disabled=true;
  el('expiryStatus777').textContent='Re-fetching original signed custody sources and checking the current expiry at server time…';
  try{
    const response=await fetch('/api/admin/economic_retention_custody_expiry_v777',{
      method:'POST',credentials:'same-origin',cache:'no-store',
      headers:{'Content-Type':'application/json',Accept:'application/json'},
      body:JSON.stringify(recheckBody777)});
    const data=await response.json();
    el('expiryResult777').textContent=JSON.stringify(data,null,2);
    el('expiryStatus777').textContent=`${data.custody_expiry_status||'HOLD'} · ${data.remaining_hours??'Unknown'} hours remaining · ${data.blocking_count??'Unknown'} follow-ups.`;
  }catch(error){
    el('expiryStatus777').textContent=`HOLD — Custody expiry could not be independently rechecked: ${error.message}`;
  }finally{el('expiry777').disabled=false;}
});
el('renew778').addEventListener('click',async()=>{
  if(!recheckBody777)return;
  el('renew778').disabled=true;
  el('renewStatus778').textContent='Reauthenticating all original signed owner and custodian sources, then reviewing renewal exceptions…';
  try{
    const response=await fetch('/api/admin/economic_retention_renewal_followup_v778',{
      method:'POST',credentials:'same-origin',cache:'no-store',
      headers:{'Content-Type':'application/json',Accept:'application/json'},
      body:JSON.stringify(recheckBody777)});
    const data=await response.json();
    el('renewResult778').textContent=JSON.stringify(data,null,2);
    el('renewStatus778').textContent=`${data.renewal_followup_status||'HOLD'} · ${data.blocking_count??'Unknown'} owner/custodian actions. No automatic renewal.`;
  }catch(error){
    el('renewStatus778').textContent=`HOLD — Original issuer follow-up unavailable: ${error.message}`;
  }finally{el('renew778').disabled=false;}
});
el('register779').addEventListener('click',async()=>{
  if(!recheckBody777)return;
  registerPacket779=null;
  el('register779').disabled=true;el('exportRegister779').disabled=true;
  el('registerRows779').replaceChildren();
  el('registerResult779').textContent='HOLD — Rechecking original signed source decision history.';
  el('registerStatus779').textContent='Reauthenticating original owner, exception issuer and custodian history for a current read-only decision register…';
  try{
    const response=await fetch('/api/admin/economic_custody_exception_register_v779',{
      method:'POST',credentials:'same-origin',cache:'no-store',
      headers:{'Content-Type':'application/json',Accept:'application/json'},
      body:JSON.stringify(recheckBody777)});
    const data=await response.json();
    el('registerResult779').textContent=JSON.stringify(data,null,2);
    el('registerStatus779').textContent=`${data.custody_decision_register_status||'HOLD'} · ${data.decision_rows?.length??0} external decision rows · no automatic closure.`;
    const tbody=el('registerRows779');tbody.replaceChildren();
    for(const item of data.decision_rows||[]){
      const tr=document.createElement('tr');
      for(const value of [item.decision_key,item.issuer_role,item.status,item.action]){
        const td=document.createElement('td');td.textContent=String(value??'—');tr.appendChild(td);
      }tbody.appendChild(tr);
    }
    if(response.ok&&data.ok){registerPacket779=data;el('exportRegister779').disabled=false;}
  }catch(error){
    el('registerStatus779').textContent=`HOLD — Original independent decision register unavailable: ${error.message}`;
  }finally{el('register779').disabled=false;}
});
el('exportRegister779').addEventListener('click',()=>{
  if(!registerPacket779)return;
  const url=URL.createObjectURL(new Blob([JSON.stringify(registerPacket779,null,2)],{
    type:'application/json'}));
  const a=document.createElement('a');a.href=url;
  a.download='rosie-unsigned-independent-custody-exception-register-v779.json';a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
});
el('export776').addEventListener('click',()=>{
  if(!packet)return;
  const url=URL.createObjectURL(new Blob([JSON.stringify(packet,null,2)],{
    type:'application/json'}));
  const a=document.createElement('a');a.href=url;
  a.download='rosie-unsigned-owner-followthrough-aging-exception-custody-v776.json';a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
});
configuration();
