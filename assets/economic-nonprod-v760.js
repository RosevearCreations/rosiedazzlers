const el=id=>document.getElementById(id),endpoint='/api/admin/economic_nonprod_trial_v760';
const date=new Date();el('period760').value=`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;
let packet=null;
const status=message=>{el('status760').textContent=message;};
const fields=[['fileRecord760','record760'],['fileSource760','source760'],['fileOwner760','owner760'],
  ['fileHistory760','history760'],['fileMigration760','migration760'],['fileDba760','dba760'],
  ['fileSecurity760','security760'],['fileTrial760','trial760']];
for(const [fileId,textareaId] of fields){
  el(fileId).addEventListener('change',async()=>{
    const file=el(fileId).files?.[0];if(!file)return;
    if(file.size>72000){status('HOLD — Evidence document exceeds 72 KB.');return;}
    try{const data=await file.text();JSON.parse(data);el(textareaId).value=data;
      status(`${file.name} imported locally and not saved.`);}
    catch{status(`HOLD — ${file.name} is not valid JSON.`);}
  });
}
function showFollow(items){
  const body=el('follow760');body.replaceChildren();
  if(!Array.isArray(items)||!items.length){const row=document.createElement('tr'),cell=document.createElement('td');
    cell.colSpan=2;cell.textContent='No reviewed exceptions.';row.appendChild(cell);body.appendChild(row);return;}
  for(const item of items){const row=document.createElement('tr');
    for(const value of [item.code,item.action]){const cell=document.createElement('td');
      cell.textContent=String(value??'—');row.appendChild(cell);}body.appendChild(row);}
}
async function config(){
  try{const response=await fetch(endpoint,{credentials:'same-origin',cache:'no-store'});
    const data=await response.json();if(!response.ok||!data.ok)throw Error(data.error||'Signed-in private access required.');
    el('config760').textContent=`Read-only preflight. Nonproduction identity ${data.nonprod_target_status}; isolation auditor ${data.independent_isolation_provider_configured?'configured':'NOT configured'}; rollback witness ${data.independent_rollback_provider_configured?'configured':'NOT configured'}. Execution remains HOLD.`;
  }catch(error){el('config760').textContent=`HOLD — ${error.message}`;}
}
el('form760').addEventListener('submit',async event=>{
  event.preventDefault();packet=null;el('export760').disabled=true;
  let evidence;
  try{evidence={period:el('period760').value,booking_id:el('booking760').value.trim(),
    source_record:JSON.parse(el('record760').value),source_attestation:JSON.parse(el('source760').value),
    owner_receipt:JSON.parse(el('owner760').value),history_manifest:JSON.parse(el('history760').value),
    owner_migration_review:JSON.parse(el('migration760').value),
    dba_review:JSON.parse(el('dba760').value),security_review:JSON.parse(el('security760').value),
    owner_trial_handoff:JSON.parse(el('trial760').value)};}
  catch{status('HOLD — All eight JSON documents are required.');return;}
  const button=el('verify760');button.disabled=true;status('Revalidating independent chain, project isolation and rollback/owner signatures…');
  try{
    const response=await fetch(endpoint,{method:'POST',credentials:'same-origin',cache:'no-store',
      headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(evidence)});
    const data=await response.json();el('result760').textContent=JSON.stringify(data,null,2);
    el('prior760').textContent=data.source_chain_status||'HOLD — Chain unavailable';
    el('identity760').textContent=data.nonprod_target?.status||'HOLD — Identity unavailable';
    el('isolation760').textContent=data.isolation_review?.status||'HOLD — Auditor evidence missing';
    el('rollback760').textContent=data.rollback_review?.status||'HOLD — Witness evidence missing';
    el('ownerStatus760').textContent=data.owner_trial_handoff?.status||'HOLD — Owner handoff missing';
    el('execution760').textContent=data.trial_execution_authorized?'Operator authorized':'HOLD — No execution authority or closure';
    showFollow(data.follow_ups);
    status(`${data.trial_handoff_status||'HOLD'} — ${data.blocking_count??'Unknown'} conditions remain.`);
    if(data.ok){packet=data;el('export760').disabled=false;}
  }catch(error){status(`HOLD — Trial preflight unavailable: ${error.message}`);}
  finally{button.disabled=false;}
});
el('export760').addEventListener('click',()=>{
  if(!packet)return;const url=URL.createObjectURL(new Blob([JSON.stringify(packet,null,2)],{type:'application/json'}));
  const a=document.createElement('a');a.href=url;a.download='rosie-unsigned-nonproduction-trial-readiness-v760.json';a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
});
config();
