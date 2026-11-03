const el=id=>document.getElementById(id),endpoint='/api/admin/economic_retention_review_v758';
const date=new Date();el('period758').value=`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;
let packet=null;
const status=value=>{el('status758').textContent=value;};
const showFollowUps=items=>{
  const body=el('follow758');body.replaceChildren();
  if(!items?.length){const tr=document.createElement('tr'),td=document.createElement('td');td.colSpan=2;td.textContent='No review packet.';tr.appendChild(td);body.appendChild(tr);return;}
  for(const item of items){const tr=document.createElement('tr');for(const value of [item.code,item.action]){
    const td=document.createElement('td');td.textContent=String(value??'—');tr.appendChild(td);
  }body.appendChild(tr);}
};
async function config(){
  try{
    const r=await fetch(endpoint,{credentials:'same-origin',cache:'no-store'}),data=await r.json();
    if(!r.ok||!data.ok)throw Error(data.error||'Signed-in private owner review required.');
    el('config758').textContent=`Private read-only preflight. Provider ${data.provider_configured?'configured':'NOT configured'}; migration plan SHA-256: ${data.audit_plan_sha256}. All business closures HOLD.`;
  }catch(e){el('config758').textContent=`HOLD — ${e.message}`;}
}
for(const [fileId,textareaId] of [['fileRecord758','record758'],['fileSource758','source758'],
  ['fileOwner758','owner758'],['fileHistory758','history758'],['fileMigration758','migration758']]){
  el(fileId).addEventListener('change',async()=>{
    const file=el(fileId).files?.[0];if(!file)return;
    if(file.size>42000){status('HOLD — Evidence file exceeds 42 KB.');return;}
    try{const raw=await file.text();JSON.parse(raw);el(textareaId).value=raw;status(`${file.name} imported locally; not saved.`);}
    catch{status(`HOLD — ${file.name} is not valid JSON.`);}
  });
}
el('form758').addEventListener('submit',async event=>{
  event.preventDefault();packet=null;el('export758').disabled=true;
  let evidence;
  try{evidence={booking_id:el('booking758').value.trim(),period:el('period758').value,
    source_record:JSON.parse(el('record758').value),source_attestation:JSON.parse(el('source758').value),
    owner_receipt:JSON.parse(el('owner758').value),history_manifest:JSON.parse(el('history758').value),
    owner_migration_review:JSON.parse(el('migration758').value)};}
  catch{status('HOLD — All five JSON evidence documents must be complete.');return;}
  const button=el('verify758');button.disabled=true;status('Revalidating signed source evidence, live independent retention and migration-review binding…');
  try{
    const r=await fetch(endpoint,{method:'POST',credentials:'same-origin',cache:'no-store',
      headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(evidence)});
    const data=await r.json();el('result758').textContent=JSON.stringify(data,null,2);
    el('retentionStatus758').textContent=data.retention_review?.retention_status||'HOLD — Not checked';
    el('immutabilityStatus758').textContent=data.immutable_retention_verified?'Independently verified':'HOLD — External enforcement audit not completed';
    el('migrationStatus758').textContent=data.owner_migration_review?.migration_review_status||'HOLD — Not checked';
    el('closureStatus758').textContent=data.closure_reconciliation_status||'HOLD — Not authorized';
    showFollowUps(data.follow_ups);status(`${data.closure_reconciliation_status||'HOLD'} — ${data.blocking_count??'Unknown'} outstanding conditions.`);
    if(data.ok){packet=data;el('export758').disabled=false;}
  }catch(e){status(`HOLD — Review unavailable: ${e.message}`);}
  finally{button.disabled=false;}
});
el('export758').addEventListener('click',()=>{
  if(!packet)return;const url=URL.createObjectURL(new Blob([JSON.stringify(packet,null,2)],{type:'application/json'}));
  const anchor=document.createElement('a');anchor.href=url;anchor.download='rosie-unsigned-retention-closure-review-v758.json';anchor.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
});
config();
