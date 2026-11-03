const el=id=>document.getElementById(id);
const endpoint='/api/admin/economic_owner_acceptance_v768';
let packet=null;
const status=message=>{el('status768').textContent=message;};
for(const [fileId,textId] of [
  ['filePost768','postOwner768'],
  ['fileReadiness768','readinessOwner768'],
  ['fileAuthorization768','authorizationOwner768'],
  ['fileAcceptance768','acceptanceOwner768']
])el(fileId).addEventListener('change',async()=>{
  const file=el(fileId).files?.[0];if(!file)return;
  if(file.size>18000){status('HOLD — Signed decision file exceeds 18 KB.');return;}
  try{const raw=await file.text();JSON.parse(raw);el(textId).value=raw;
    status(`${file.name} imported locally. No evidence stored.`);}
  catch{status(`HOLD — ${file.name} is not valid JSON.`);}
});
function followups(items){
  const tbody=el('follow768');tbody.replaceChildren();
  for(const item of items||[]){const tr=document.createElement('tr');
    for(const value of [item.code,item.action]){const td=document.createElement('td');
      td.textContent=String(value??'—');tr.appendChild(td);}tbody.appendChild(tr);}
  if(!tbody.children.length){const tr=document.createElement('tr'),td=document.createElement('td');
    td.colSpan=2;td.textContent='No independent status available.';tr.appendChild(td);tbody.appendChild(tr);}
}
async function config(){
  try{const response=await fetch(endpoint,{credentials:'same-origin',cache:'no-store'});
    const data=await response.json();if(!response.ok||!data.ok)
      throw Error(data.error||'Signed-in owner session required.');
    const sources=Object.entries(data.provider_configuration||{}).map(([name,ready])=>
      `${name}: ${ready?'configured':'NOT configured'}`).join(' · ');
    el('config768').textContent=`Owner-only read-only review · ${sources}. No business action.`;
  }catch(error){el('config768').textContent=`HOLD — ${error.message}`;}
}
el('form768').addEventListener('submit',async event=>{
  event.preventDefault();packet=null;el('export768').disabled=true;
  let body;
  try{body={booking_id:el('booking768').value.trim(),source_record_id:el('source768').value.trim(),
    change_ticket_id:el('ticket768').value.trim(),execution_request_id:el('request768').value.trim(),
    owner_postchange_decision:JSON.parse(el('postOwner768').value),
    owner_closure_readiness_decision:JSON.parse(el('readinessOwner768').value),
    owner_explicit_closure_authorization:JSON.parse(el('authorizationOwner768').value),
    owner_postclosure_acceptance_decision:JSON.parse(el('acceptanceOwner768').value)};
  }catch{status('HOLD — Four original owner-signed JSON envelopes required.');return;}
  el('verify768').disabled=true;
  status('Re-authenticating historical source custody, owner decision and independent reopening register…');
  try{const response=await fetch(endpoint,{method:'POST',credentials:'same-origin',cache:'no-store',
      headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(body)});
    const data=await response.json();el('result768').textContent=JSON.stringify(data,null,2);
    for(const [id,value] of [
      ['prior768',data.predecessor_postclosure_review_status],
      ['owner768',data.owner_postclosure_decision?.status],
      ['custody768',data.independent_original_source_custody?.status],
      ['reopen768',data.independent_exception_reopening?.status]
    ])el(id).textContent=value||'HOLD — Not independently verified';
    followups(data.follow_ups);
    status(`${data.owner_acceptance_status||'HOLD'} · ${data.blocking_count??'Unknown'} follow-ups.`);
    if(response.ok&&data.ok){packet=data;el('export768').disabled=false;}
  }catch(error){status(`HOLD — Owner/custody review unavailable: ${error.message}`);}
  finally{el('verify768').disabled=false;}
});
el('export768').addEventListener('click',()=>{
  if(!packet)return;
  const url=URL.createObjectURL(new Blob([JSON.stringify(packet,null,2)],{type:'application/json'}));
  const link=document.createElement('a');link.href=url;
  link.download='rosie-unsigned-owner-custody-reopen-v768.json';link.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
});
config();
