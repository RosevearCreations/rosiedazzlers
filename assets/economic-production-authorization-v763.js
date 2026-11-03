const el=id=>document.getElementById(id),endpoint='/api/admin/economic_production_authorization_v763';
const now=new Date();el('period763').value=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
const fields=[['Record','record'],['Source','source'],['Owner','owner'],['History','history'],
  ['Migration','migration'],['Dba','dba'],['Security','security'],['Trial','trial'],
  ['Signoff','signoff'],['Production','production']];
const status=value=>{el('status763').textContent=value;};
let packet=null;
for(const [name,value] of fields){
  const file=el(`file${name}763`),area=el(`${value}763`);
  file.addEventListener('change',async()=>{
    const selected=file.files?.[0];if(!selected)return;
    if(selected.size>80000){status('HOLD — Selected file exceeds 80 KB.');return;}
    try{const content=await selected.text();JSON.parse(content);area.value=content;
      status(`${selected.name} imported locally; nothing was saved.`);}
    catch{status(`HOLD — ${selected.name} is not valid JSON.`);}
  });
}
function followups(items){
  const body=el('follow763');body.replaceChildren();
  for(const item of items||[]){
    const row=document.createElement('tr');
    for(const value of [item.code,item.action]){
      const cell=document.createElement('td');cell.textContent=String(value??'—');
      row.appendChild(cell);
    }body.appendChild(row);
  }
  if(!body.children.length){const row=document.createElement('tr'),cell=document.createElement('td');
    cell.colSpan=2;cell.textContent='No listed blockers.';row.appendChild(cell);body.appendChild(row);}
}
async function config(){
  try{
    const response=await fetch(endpoint,{credentials:'same-origin',cache:'no-store'});
    const data=await response.json();if(!response.ok||!data.ok)throw Error(data.error||'Owner sign-in required.');
    const values=Object.entries(data.provider_configuration||{})
      .map(([name,ready])=>`${name}: ${ready?'configured':'NOT configured'}`).join(' · ');
    el('config763').textContent=`Owner-only readback · ${values}. Production execution remains disabled.`;
  }catch(error){el('config763').textContent=`HOLD — ${error.message}`;}
}
el('form763').addEventListener('submit',async event=>{
  event.preventDefault();packet=null;el('export763').disabled=true;
  let body;
  try{body={
    period:el('period763').value,booking_id:el('booking763').value.trim(),
    source_record:JSON.parse(el('record763').value),
    source_attestation:JSON.parse(el('source763').value),
    owner_receipt:JSON.parse(el('owner763').value),
    history_manifest:JSON.parse(el('history763').value),
    owner_migration_review:JSON.parse(el('migration763').value),
    dba_review:JSON.parse(el('dba763').value),
    security_review:JSON.parse(el('security763').value),
    owner_trial_handoff:JSON.parse(el('trial763').value),
    owner_trial_signoff:JSON.parse(el('signoff763').value),
    owner_production_decision:JSON.parse(el('production763').value)
  };}catch{status('HOLD — All ten signed evidence JSON documents are required.');return;}
  const button=el('verify763');button.disabled=true;
  status('Revalidating exact preflight and independent DBA, security, owner, operator and witness signatures…');
  try{
    const response=await fetch(endpoint,{method:'POST',credentials:'same-origin',cache:'no-store',
      headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(body)});
    const data=await response.json();el('result763').textContent=JSON.stringify(data,null,2);
    for(const [id,value] of [
      ['prior763',data.build762_status],['dbaStatus763',data.dba_authorization?.status],
      ['securityStatus763',data.security_authorization?.status],
      ['ownerStatus763',data.owner_production_decision?.status],
      ['operatorStatus763',data.operator_gate?.status],
      ['rollbackStatus763',data.rollback_witness_readiness?.status]])
      el(id).textContent=value||'HOLD — Evidence unavailable';
    followups(data.follow_ups);
    status(`${data.authorization_status||'HOLD'} · ${data.blocking_count??'Unknown'} outstanding conditions.`);
    if(data.ok){packet=data;el('export763').disabled=false;}
  }catch(error){status(`HOLD — Production authorization review unavailable: ${error.message}`);}
  finally{button.disabled=false;}
});
el('export763').addEventListener('click',()=>{
  if(!packet)return;
  const url=URL.createObjectURL(new Blob([JSON.stringify(packet,null,2)],{type:'application/json'}));
  const link=document.createElement('a');link.href=url;
  link.download='rosie-unsigned-production-operator-gate-v763.json';link.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
});
config();
