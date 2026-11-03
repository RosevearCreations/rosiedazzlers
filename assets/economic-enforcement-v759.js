const el=id=>document.getElementById(id),endpoint='/api/admin/economic_enforcement_audit_v759';
const date=new Date();el('period759').value=`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;
let packet=null;
const status=text=>{el('status759').textContent=text;};
const fields=[['fileRecord759','record759'],['fileSource759','source759'],['fileOwner759','owner759'],
  ['fileHistory759','history759'],['fileMigration759','migration759'],['fileDba759','dba759'],
  ['fileSecurity759','security759']];
for(const [fileId,textId] of fields){
  el(fileId).addEventListener('change',async()=>{
    const file=el(fileId).files?.[0];if(!file)return;
    if(file.size>60000){status('HOLD — Evidence file exceeds 60 KB.');return;}
    try{const data=await file.text();JSON.parse(data);el(textId).value=data;status(`${file.name} imported locally; no document saved.`);}
    catch{status(`HOLD — ${file.name} is not valid JSON.`);}
  });
}
function followUps(items){
  const body=el('follow759');body.replaceChildren();
  if(!Array.isArray(items)||!items.length){const row=document.createElement('tr'),cell=document.createElement('td');
    cell.colSpan=2;cell.textContent='No review packet.';row.appendChild(cell);body.appendChild(row);return;}
  for(const item of items){const row=document.createElement('tr');
    for(const value of [item.code,item.action]){const cell=document.createElement('td');cell.textContent=String(value??'—');row.appendChild(cell);}
    body.appendChild(row);}
}
async function config(){
  try{
    const response=await fetch(endpoint,{credentials:'same-origin',cache:'no-store'});
    const data=await response.json();if(!response.ok||!data.ok)throw Error(data.error||'Private owner access required.');
    el('config759').textContent=`Read-only private preflight. Independent auditor ${data.independent_storage_audit_origin_configured?'configured':'NOT configured'}; distinct nonproduction target ${data.nonprod_target_configured?'configured':'NOT configured'}. No migration or closure authority.`;
  }catch(error){el('config759').textContent=`HOLD — ${error.message}`;}
}
el('form759').addEventListener('submit',async event=>{
  event.preventDefault();packet=null;el('export759').disabled=true;
  let evidence;
  try{evidence={period:el('period759').value,booking_id:el('booking759').value.trim(),
    source_record:JSON.parse(el('record759').value),source_attestation:JSON.parse(el('source759').value),
    owner_receipt:JSON.parse(el('owner759').value),history_manifest:JSON.parse(el('history759').value),
    owner_migration_review:JSON.parse(el('migration759').value),dba_review:JSON.parse(el('dba759').value),
    security_review:JSON.parse(el('security759').value)};}
  catch{status('HOLD — All seven evidence documents must contain valid JSON.');return;}
  const button=el('verify759');button.disabled=true;
  status('Rechecking source history, retention provider, independent storage audit and signed approval chain…');
  try{
    const response=await fetch(endpoint,{method:'POST',credentials:'same-origin',cache:'no-store',
      headers:{Accept:'application/json','Content-Type':'application/json'},body:JSON.stringify(evidence)});
    const data=await response.json();el('result759').textContent=JSON.stringify(data,null,2);
    el('storage759').textContent=data.storage_audit?.status||'HOLD — No independent audit';
    el('dbaStatus759').textContent=data.dba_review?.status||'HOLD — No valid DBA review';
    el('securityStatus759').textContent=data.security_review?.status||'HOLD — No valid security review';
    el('target759').textContent=data.nonprod_target?.status||'HOLD — Unverified';
    el('trial759').textContent=data.trial_readiness_status||'HOLD — Not authorized';
    el('closure759').textContent=data.closure_reconciliation_status||'HOLD — Not authorized';
    followUps(data.follow_ups);
    status(`${data.trial_readiness_status||'HOLD'} — ${data.blocking_count??'Unknown'} remaining conditions.`);
    if(data.ok){packet=data;el('export759').disabled=false;}
  }catch(error){status(`HOLD — Preflight unavailable: ${error.message}`);}
  finally{button.disabled=false;}
});
el('export759').addEventListener('click',()=>{
  if(!packet)return;const url=URL.createObjectURL(new Blob([JSON.stringify(packet,null,2)],{type:'application/json'}));
  const link=document.createElement('a');link.href=url;link.download='rosie-unsigned-nonprod-trial-preflight-v759.json';link.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
});
config();
