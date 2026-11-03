const el=id=>document.getElementById(id);
const endpoint='/api/admin/economic_final_disposition_v766';
let packet=null;
const status=value=>{el('status766').textContent=value;};
for(const [fileId,textId] of [
  ['filePost766','postOwner766'],
  ['fileReadiness766','readinessOwner766'],
  ['fileAuthorization766','authorizationOwner766']
])el(fileId).addEventListener('change',async()=>{
  const file=el(fileId).files?.[0];if(!file)return;
  if(file.size>18000){status('HOLD — Signed decision file exceeds 18 KB.');return;}
  try{const raw=await file.text();JSON.parse(raw);el(textId).value=raw;
    status(`${file.name} imported in this browser; no receipt was stored.`);}
  catch{status(`HOLD — ${file.name} is not valid JSON.`);}
});
function followups(items){
  const tbody=el('follow766');tbody.replaceChildren();
  for(const item of items||[]){const tr=document.createElement('tr');
    for(const value of [item.code,item.action]){const td=document.createElement('td');
      td.textContent=String(value??'—');tr.appendChild(td);}tbody.appendChild(tr);}
  if(!tbody.children.length){const tr=document.createElement('tr'),td=document.createElement('td');
    td.colSpan=2;td.textContent='No outstanding conditions.';tr.appendChild(td);tbody.appendChild(tr);}
}
async function config(){
  try{const response=await fetch(endpoint,{credentials:'same-origin',cache:'no-store'});
    const data=await response.json();if(!response.ok||!data.ok)
      throw Error(data.error||'Signed-in owner session required.');
    const sources=Object.entries(data.provider_configuration||{}).map(([name,ready])=>
      `${name}: ${ready?'configured':'NOT configured'}`).join(' · ');
    el('config766').textContent=`Owner-only read-only review · ${sources}. No closure action.`;
  }catch(error){el('config766').textContent=`HOLD — ${error.message}`;}
}
el('form766').addEventListener('submit',async event=>{
  event.preventDefault();packet=null;el('export766').disabled=true;
  let body;
  try{body={booking_id:el('booking766').value.trim(),
    source_record_id:el('source766').value.trim(),
    change_ticket_id:el('ticket766').value.trim(),
    execution_request_id:el('request766').value.trim(),
    owner_postchange_decision:JSON.parse(el('postOwner766').value),
    owner_closure_readiness_decision:JSON.parse(el('readinessOwner766').value),
    owner_explicit_closure_authorization:JSON.parse(el('authorizationOwner766').value)};
  }catch{status('HOLD — Three authentic signed owner decisions are required.');return;}
  el('verify766').disabled=true;
  status('Authenticating historical custody, owner authorization, append-only decision receipt and independent exception review…');
  try{
    const response=await fetch(endpoint,{method:'POST',credentials:'same-origin',cache:'no-store',
      headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(body)});
    const data=await response.json();el('result766').textContent=JSON.stringify(data,null,2);
    for(const [id,value] of [
      ['prior766',data.predecessor_review_status],
      ['ownerStatus766',data.owner_external_manual_authorization?.status],
      ['ledger766',data.independent_append_only_decision_custody?.status],
      ['disposition766',data.independent_final_exception_disposition?.status]
    ])el(id).textContent=value||'HOLD — Not authenticated';
    followups(data.follow_ups);
    status(`${data.final_disposition_status||'HOLD'} · ${data.blocking_count??'Unknown'} conditions requiring follow-up.`);
    if(data.ok){packet=data;el('export766').disabled=false;}
  }catch(error){status(`HOLD — Final independent review unavailable: ${error.message}`);}
  finally{el('verify766').disabled=false;}
});
el('export766').addEventListener('click',()=>{
  if(!packet)return;
  const url=URL.createObjectURL(new Blob([JSON.stringify(packet,null,2)],{type:'application/json'}));
  const link=document.createElement('a');link.href=url;
  link.download='rosie-unsigned-owner-final-disposition-v766.json';link.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
});
config();
