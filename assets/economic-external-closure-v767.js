const el=id=>document.getElementById(id);
const endpoint='/api/admin/economic_external_closure_v767';
let packet=null;
const status=value=>{el('status767').textContent=value;};
for(const [fileId,textId] of [
  ['filePost767','postOwner767'],
  ['fileReadiness767','readinessOwner767'],
  ['fileAuthorization767','authorizationOwner767']
])el(fileId).addEventListener('change',async()=>{
  const file=el(fileId).files?.[0];if(!file)return;
  if(file.size>18000){status('HOLD — Signed decision file exceeds 18 KB.');return;}
  try{const raw=await file.text();JSON.parse(raw);el(textId).value=raw;
    status(`${file.name} imported locally. This page stores no evidence.`);}
  catch{status(`HOLD — ${file.name} is not valid JSON.`);}
});
function followups(items){
  const tbody=el('follow767');tbody.replaceChildren();
  for(const item of items||[]){const tr=document.createElement('tr');
    for(const value of [item.code,item.action]){const td=document.createElement('td');
      td.textContent=String(value??'—');tr.appendChild(td);}tbody.appendChild(tr);}
  if(!tbody.children.length){const tr=document.createElement('tr'),td=document.createElement('td');
    td.colSpan=2;td.textContent='No exception information available.';tr.appendChild(td);tbody.appendChild(tr);}
}
async function config(){
  try{const response=await fetch(endpoint,{credentials:'same-origin',cache:'no-store'});
    const data=await response.json();if(!response.ok||!data.ok)
      throw Error(data.error||'Signed-in owner session required.');
    const sources=Object.entries(data.provider_configuration||{}).map(([name,ready])=>
      `${name}: ${ready?'configured':'NOT configured'}`).join(' · ');
    el('config767').textContent=`Owner-only read-only review · ${sources}. No closure action.`;
  }catch(error){el('config767').textContent=`HOLD — ${error.message}`;}
}
el('form767').addEventListener('submit',async event=>{
  event.preventDefault();packet=null;el('export767').disabled=true;
  let body;
  try{body={booking_id:el('booking767').value.trim(),source_record_id:el('source767').value.trim(),
    change_ticket_id:el('ticket767').value.trim(),execution_request_id:el('request767').value.trim(),
    owner_postchange_decision:JSON.parse(el('postOwner767').value),
    owner_closure_readiness_decision:JSON.parse(el('readinessOwner767').value),
    owner_explicit_closure_authorization:JSON.parse(el('authorizationOwner767').value)};
  }catch{status('HOLD — Three authentic owner-signed JSON envelopes are required.');return;}
  el('verify767').disabled=true;
  status('Re-authenticating Build 766 and independent operator/state sources…');
  try{const response=await fetch(endpoint,{method:'POST',credentials:'same-origin',cache:'no-store',
      headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(body)});
    const data=await response.json();el('result767').textContent=JSON.stringify(data,null,2);
    for(const [id,value] of [
      ['prior767',data.predecessor_final_disposition_status],
      ['execution767',data.independent_external_execution?.status],
      ['inspection767',data.independent_post_closure_inspection?.status]
    ])el(id).textContent=value||'HOLD — Not authenticated';
    followups(data.follow_ups);
    status(`${data.post_closure_review_status||'HOLD'} · ${data.blocking_count??'Unknown'} owner follow-ups.`);
    if(response.ok&&data.ok){packet=data;el('export767').disabled=false;}
  }catch(error){status(`HOLD — Independent readback unavailable: ${error.message}`);}
  finally{el('verify767').disabled=false;}
});
el('export767').addEventListener('click',()=>{
  if(!packet)return;
  const url=URL.createObjectURL(new Blob([JSON.stringify(packet,null,2)],{type:'application/json'}));
  const link=document.createElement('a');link.href=url;
  link.download='rosie-unsigned-postclosure-review-v767.json';link.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
});
config();
