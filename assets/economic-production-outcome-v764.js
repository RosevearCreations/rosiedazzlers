const el=id=>document.getElementById(id),endpoint='/api/admin/economic_postchange_reconciliation_v764';
let packet=null;
const status=value=>{el('status764').textContent=value;};
el('fileOwner764').addEventListener('change',async()=>{
  const file=el('fileOwner764').files?.[0];if(!file)return;
  if(file.size>18000){status('HOLD — Owner signed decision file exceeds 18 KB.');return;}
  try{const raw=await file.text();JSON.parse(raw);el('owner764').value=raw;
    status(`${file.name} imported locally; no signed receipt was stored.`);}
  catch{status(`HOLD — ${file.name} is not valid JSON.`);}
});
function followups(items){
  const body=el('follow764');body.replaceChildren();
  for(const item of items||[]){const row=document.createElement('tr');
    for(const value of [item.code,item.action]){const cell=document.createElement('td');
      cell.textContent=String(value??'—');row.appendChild(cell);}body.appendChild(row);}
  if(!body.children.length){const row=document.createElement('tr'),cell=document.createElement('td');
    cell.colSpan=2;cell.textContent='No listed blockers.';row.appendChild(cell);body.appendChild(row);}
}
async function config(){
  try{const response=await fetch(endpoint,{credentials:'same-origin',cache:'no-store'});
    const data=await response.json();if(!response.ok||!data.ok)throw Error(data.error||'Owner sign-in required.');
    const providers=Object.entries(data.provider_configuration||{}).map(([name,ready])=>
      `${name}: ${ready?'configured':'NOT configured'}`).join(' · ');
    el('config764').textContent=`Owner-only read-only review · ${providers}. Execution and closure disabled.`;
  }catch(error){el('config764').textContent=`HOLD — ${error.message}`;}
}
el('form764').addEventListener('submit',async event=>{
  event.preventDefault();packet=null;el('export764').disabled=true;
  let body;
  try{body={
    booking_id:el('booking764').value.trim(),source_record_id:el('source764').value.trim(),
    change_ticket_id:el('ticket764').value.trim(),execution_request_id:el('request764').value.trim(),
    owner_postchange_decision:JSON.parse(el('owner764').value)
  };}catch{status('HOLD — An authentic owner post-change signed decision JSON is required.');return;}
  const button=el('verify764');button.disabled=true;
  status('Authenticating historical gate, external execution, independent witness, reconciliation and owner decision…');
  try{
    const response=await fetch(endpoint,{method:'POST',credentials:'same-origin',cache:'no-store',
      headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(body)});
    const data=await response.json();el('result764').textContent=JSON.stringify(data,null,2);
    for(const [id,value] of [
      ['archive764',data.execution_gate_archive?.status],
      ['execution764',data.external_operator_execution?.status],
      ['standby764',data.independent_rollback_standby?.status],
      ['reconciliation764',data.independent_outcome_reconciliation?.status],
      ['ownerStatus764',data.owner_postchange_decision?.status]
    ])el(id).textContent=value||'HOLD — Evidence unavailable';
    followups(data.follow_ups);
    status(`${data.postchange_status||'HOLD'} · ${data.blocking_count??'Unknown'} outstanding conditions.`);
    if(data.ok){packet=data;el('export764').disabled=false;}
  }catch(error){status(`HOLD — Post-change review unavailable: ${error.message}`);}
  finally{button.disabled=false;}
});
el('export764').addEventListener('click',()=>{
  if(!packet)return;
  const url=URL.createObjectURL(new Blob([JSON.stringify(packet,null,2)],{type:'application/json'}));
  const link=document.createElement('a');link.href=url;
  link.download='rosie-unsigned-postchange-external-evidence-v764.json';link.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
});
config();
