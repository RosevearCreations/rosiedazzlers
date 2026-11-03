const el=id=>document.getElementById(id);
const endpoint='/api/admin/economic_database_closure_v765';
let packet=null;
const status=value=>{el('status765').textContent=value;};
for(const [fileId,textId] of [['filePost765','postOwner765'],['fileClosure765','owner765']]){
  el(fileId).addEventListener('change',async()=>{
    const file=el(fileId).files?.[0];if(!file)return;
    if(file.size>18000){status('HOLD — Signed owner file exceeds 18 KB.');return;}
    try{const raw=await file.text();JSON.parse(raw);el(textId).value=raw;
      status(`${file.name} imported in this browser. Nothing has been stored.`);}
    catch{status(`HOLD — ${file.name} is not valid JSON.`);}
  });
}
function followups(items){
  const body=el('follow765');body.replaceChildren();
  for(const item of items||[]){const row=document.createElement('tr');
    for(const value of [item.code,item.action]){const cell=document.createElement('td');
      cell.textContent=String(value??'—');row.appendChild(cell);}body.appendChild(row);}
  if(!body.children.length){const row=document.createElement('tr'),cell=document.createElement('td');
    cell.colSpan=2;cell.textContent='No outstanding conditions.';row.appendChild(cell);body.appendChild(row);}
}
async function config(){
  try{const response=await fetch(endpoint,{credentials:'same-origin',cache:'no-store'});
    const data=await response.json();if(!response.ok||!data.ok)throw Error(data.error||'Owner sign-in required.');
    const providers=Object.entries(data.provider_configuration||{}).map(([name,ready])=>
      `${name}: ${ready?'configured':'NOT configured'}`).join(' · ');
    el('config765').textContent=`Signed-in owner review · ${providers}. Read-only, no closure.`;
  }catch(error){el('config765').textContent=`HOLD — ${error.message}`;}
}
el('form765').addEventListener('submit',async event=>{
  event.preventDefault();packet=null;el('export765').disabled=true;
  let body;
  try{body={booking_id:el('booking765').value.trim(),source_record_id:el('source765').value.trim(),
    change_ticket_id:el('ticket765').value.trim(),
    execution_request_id:el('request765').value.trim(),
    owner_postchange_decision:JSON.parse(el('postOwner765').value),
    owner_closure_readiness_decision:JSON.parse(el('owner765').value)};
  }catch{status('HOLD — Both authentic signed owner decision JSON documents are required.');return;}
  el('verify765').disabled=true;
  status('Authenticating historical execution, direct DBA inspection, separate audit enforcement and owner decision…');
  try{
    const response=await fetch(endpoint,{method:'POST',credentials:'same-origin',cache:'no-store',
      headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(body)});
    const data=await response.json();el('result765').textContent=JSON.stringify(data,null,2);
    for(const [id,value] of [
      ['historical765',data.postchange_owner_decision?.status],
      ['db765',data.independent_production_database_inspection?.status],
      ['audit765',data.independent_immutable_audit_enforcement?.status],
      ['ownerStatus765',data.owner_closure_readiness_decision?.status]
    ])el(id).textContent=value||'HOLD — Missing or invalid source';
    followups(data.follow_ups);
    status(`${data.closure_readiness_status||'HOLD'} · ${data.blocking_count??'Unknown'} outstanding conditions.`);
    if(data.ok){packet=data;el('export765').disabled=false;}
  }catch(error){status(`HOLD — Independent database review unavailable: ${error.message}`);}
  finally{el('verify765').disabled=false;}
});
el('export765').addEventListener('click',()=>{
  if(!packet)return;
  const url=URL.createObjectURL(new Blob([JSON.stringify(packet,null,2)],{type:'application/json'}));
  const link=document.createElement('a');link.href=url;
  link.download='rosie-unsigned-independent-database-audit-v765.json';link.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
});
config();
