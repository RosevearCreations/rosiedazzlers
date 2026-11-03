const el=id=>document.getElementById(id),endpoint='/api/admin/economic_change_control_v762';
const now=new Date();el('period762').value=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
let packet=null;
const status=value=>{el('status762').textContent=value;};
const fields=[['fileRecord762','record762'],['fileSource762','source762'],['fileOwner762','owner762'],
  ['fileHistory762','history762'],['fileMigration762','migration762'],['fileDba762','dba762'],
  ['fileSecurity762','security762'],['fileTrial762','trial762'],['fileSignoff762','signoff762']];
for(const [fileId,fieldId] of fields){
  el(fileId).addEventListener('change',async()=>{
    const file=el(fileId).files?.[0];if(!file)return;
    if(file.size>72000){status('HOLD — File exceeds 72 KB.');return;}
    try{const raw=await file.text();JSON.parse(raw);el(fieldId).value=raw;
      status(`${file.name} imported locally. Nothing saved.`);}
    catch{status(`HOLD — ${file.name} is not valid JSON.`);}
  });
}
function followups(items){
  const list=el('follow762');list.replaceChildren();
  for(const item of items||[]){const row=document.createElement('tr');
    for(const value of [item.code,item.action]){const cell=document.createElement('td');
      cell.textContent=String(value??'—');row.appendChild(cell);}list.appendChild(row);}
  if(!list.children.length){const row=document.createElement('tr'),cell=document.createElement('td');
    cell.colSpan=2;cell.textContent='No listed blockers.';row.appendChild(cell);list.appendChild(row);}
}
async function config(){
  try{const response=await fetch(endpoint,{credentials:'same-origin',cache:'no-store'});
    const data=await response.json();if(!response.ok||!data.ok)throw Error(data.error||'Owner sign-in required.');
    el('config762').textContent=`Read-only owner review. Independent rollback reviewer ${data.rollback_review_provider_configured?'configured':'NOT configured'}; separate change-control reviewer ${data.change_control_provider_configured?'configured':'NOT configured'}. Production execution HOLD.`;
  }catch(error){el('config762').textContent=`HOLD — ${error.message}`;}
}
el('form762').addEventListener('submit',async event=>{
  event.preventDefault();packet=null;el('export762').disabled=true;
  let body;
  try{body={period:el('period762').value,booking_id:el('booking762').value.trim(),
    source_record:JSON.parse(el('record762').value),source_attestation:JSON.parse(el('source762').value),
    owner_receipt:JSON.parse(el('owner762').value),history_manifest:JSON.parse(el('history762').value),
    owner_migration_review:JSON.parse(el('migration762').value),
    dba_review:JSON.parse(el('dba762').value),security_review:JSON.parse(el('security762').value),
    owner_trial_handoff:JSON.parse(el('trial762').value),
    owner_trial_signoff:JSON.parse(el('signoff762').value)};}
  catch{status('HOLD — All nine signed evidence JSON documents are required.');return;}
  const button=el('verify762');button.disabled=true;status('Revalidating trial, rollback disposition, owner sign-off and change design…');
  try{
    const response=await fetch(endpoint,{method:'POST',credentials:'same-origin',cache:'no-store',
      headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(body)});
    const data=await response.json();el('result762').textContent=JSON.stringify(data,null,2);
    el('prior762').textContent=data.build761_trial_status||'HOLD — Prior review unavailable';
    el('target762').textContent=data.nonprod_target?.status||'HOLD — Project identity missing';
    el('rollback762').textContent=data.rollback_disposition_review?.status||'HOLD — Independent rollback review missing';
    el('ownerStatus762').textContent=data.owner_trial_signoff?.status||'HOLD — Owner sign-off missing';
    el('change762').textContent=data.change_control_review?.status||'HOLD — Change-control review missing';
    followups(data.follow_ups);status(`${data.change_control_status||'HOLD'} — ${data.blocking_count??'Unknown'} conditions.`);
    if(data.ok){packet=data;el('export762').disabled=false;}
  }catch(error){status(`HOLD — Owner change-control review unavailable: ${error.message}`);}
  finally{button.disabled=false;}
});
el('export762').addEventListener('click',()=>{
  if(!packet)return;
  const url=URL.createObjectURL(new Blob([JSON.stringify(packet,null,2)],{type:'application/json'}));
  const link=document.createElement('a');link.href=url;link.download='rosie-unsigned-change-control-preflight-v762.json';link.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
});
config();
