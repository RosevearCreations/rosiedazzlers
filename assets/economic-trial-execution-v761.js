const el=id=>document.getElementById(id),endpoint='/api/admin/economic_trial_execution_v761';
const today=new Date();el('period761').value=`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}`;
let packet=null;
const status=value=>{el('status761').textContent=value;};
const inputs=[['fileRecord761','record761'],['fileSource761','source761'],['fileOwner761','owner761'],
  ['fileHistory761','history761'],['fileMigration761','migration761'],['fileDba761','dba761'],
  ['fileSecurity761','security761'],['fileTrial761','trial761']];
for(const [fileId,fieldId] of inputs){
  el(fileId).addEventListener('change',async()=>{
    const file=el(fileId).files?.[0];if(!file)return;
    if(file.size>72000){status('HOLD — File exceeds 72 KB.');return;}
    try{const raw=await file.text();JSON.parse(raw);el(fieldId).value=raw;
      status(`${file.name} imported locally. No file has been stored.`);}
    catch{status(`HOLD — ${file.name} is not valid JSON.`);}
  });
}
function followups(items){
  const target=el('follow761');target.replaceChildren();
  for(const item of items||[]){
    const tr=document.createElement('tr');
    for(const value of [item.code,item.action]){
      const td=document.createElement('td');td.textContent=String(value??'—');tr.appendChild(td);
    }target.appendChild(tr);
  }
  if(!target.children.length){const tr=document.createElement('tr'),td=document.createElement('td');
    td.colSpan=2;td.textContent='No listed blockers.';tr.appendChild(td);target.appendChild(tr);}
}
async function config(){
  try{const response=await fetch(endpoint,{credentials:'same-origin',cache:'no-store'});
    const body=await response.json();if(!response.ok||!body.ok)throw Error(body.error||'Signed-in owner access required.');
    el('config761').textContent=`Private review only. External operator provider ${body.operator_provider_configured?'configured':'NOT configured'}; independent reconciliation provider ${body.reconciler_provider_configured?'configured':'NOT configured'}. Production closure HOLD.`;
  }catch(error){el('config761').textContent=`HOLD — ${error.message}`;}
}
el('form761').addEventListener('submit',async event=>{
  event.preventDefault();packet=null;el('export761').disabled=true;
  let evidence;
  try{evidence={period:el('period761').value,booking_id:el('booking761').value.trim(),
    source_record:JSON.parse(el('record761').value),source_attestation:JSON.parse(el('source761').value),
    owner_receipt:JSON.parse(el('owner761').value),history_manifest:JSON.parse(el('history761').value),
    owner_migration_review:JSON.parse(el('migration761').value),
    dba_review:JSON.parse(el('dba761').value),security_review:JSON.parse(el('security761').value),
    owner_trial_handoff:JSON.parse(el('trial761').value)};}
  catch{status('HOLD — All eight original JSON evidence documents are required.');return;}
  const button=el('verify761');button.disabled=true;status('Revalidating independent Build 760 handoff and external signed execution…');
  try{
    const response=await fetch(endpoint,{method:'POST',credentials:'same-origin',cache:'no-store',
      headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(evidence)});
    const data=await response.json();el('result761').textContent=JSON.stringify(data,null,2);
    el('handoff761').textContent=data.build760_handoff_status||'HOLD — Handoff unavailable';
    el('target761').textContent=data.nonprod_target?.status||'HOLD — Target unverified';
    el('operator761').textContent=data.operator_receipt?.status||'HOLD — No operator receipt';
    el('witness761').textContent=data.independent_trial_witness?.status||'HOLD — No independent witness';
    el('review761').textContent=data.trial_review_status||'HOLD — Unverified';
    followups(data.follow_ups);status(`${data.trial_review_status||'HOLD'} — ${data.blocking_count??'Unknown'} review conditions.`);
    if(data.ok){packet=data;el('export761').disabled=false;}
  }catch(error){status(`HOLD — Receipt review unavailable: ${error.message}`);}
  finally{button.disabled=false;}
});
el('export761').addEventListener('click',()=>{
  if(!packet)return;
  const url=URL.createObjectURL(new Blob([JSON.stringify(packet,null,2)],{type:'application/json'}));
  const link=document.createElement('a');link.href=url;link.download='rosie-unsigned-nonprod-execution-review-v761.json';link.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
});
config();
