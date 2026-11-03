const el=id=>document.getElementById(id),endpoint='/api/admin/economic_history_preflight_v757';
const now=new Date();el('period757').value=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
let packet=null;
const status=text=>{el('status757').textContent=text;};
const fillFollowUps=items=>{
  const tbody=el('follow757');tbody.replaceChildren();
  if(!items?.length){const row=document.createElement('tr');const td=document.createElement('td');td.colSpan=2;td.textContent='No review packet.';row.appendChild(td);tbody.appendChild(row);return;}
  for(const item of items){const row=document.createElement('tr');for(const text of [item.code,item.action]){
    const td=document.createElement('td');td.textContent=text;row.appendChild(td);
  }tbody.appendChild(row);}
};
async function configuration(){
  try{const response=await fetch(endpoint,{credentials:'same-origin',cache:'no-store'});const data=await response.json();
    if(!response.ok||!data.ok)throw Error(data.error||'Private staff authorization required.');
    el('config757').textContent='Private source-history preflight ready. The owner decision audit is design-only and closure remains HOLD.';
  }catch(error){el('config757').textContent=`HOLD — ${error.message}`;}
}
for(const [fileId,textId] of [['fileRecord757','record757'],['fileSource757','source757'],
  ['fileOwner757','owner757'],['fileHistory757','history757']]){
  el(fileId).addEventListener('change',async()=>{
    const file=el(fileId).files?.[0];if(!file)return;
    if(file.size>36000){status('HOLD — Evidence file exceeds the 36 KB limit.');return;}
    try{const content=await file.text();JSON.parse(content);el(textId).value=content;status(`${file.name} imported locally; not submitted.`);}
    catch{status(`HOLD — ${file.name} contains invalid JSON.`);}
  });
}
el('form757').addEventListener('submit',async event=>{
  event.preventDefault();packet=null;el('export757').disabled=true;
  let evidence;
  try{evidence={period:el('period757').value,booking_id:el('booking757').value.trim(),
    source_record:JSON.parse(el('record757').value),source_attestation:JSON.parse(el('source757').value),
    owner_receipt:JSON.parse(el('owner757').value),history_manifest:JSON.parse(el('history757').value)};}
  catch{status('HOLD — Four well-formed JSON evidence documents are required.');return;}
  const button=el('verify757');button.disabled=true;status('Checking fresh signed evidence, owning source history and independent custodian head…');
  try{
    const response=await fetch(endpoint,{method:'POST',credentials:'same-origin',cache:'no-store',
      headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(evidence)});
    const data=await response.json();el('result757').textContent=JSON.stringify(data,null,2);
    const history=data.history_verification;
    el('chain757').textContent=history?.history_chain_integrity_verified?'Chain matched':'HOLD — '+(history?.history_status||'Not checked');
    el('head757').textContent=history?.independent_history_head_signature_verified?'Independent signature matched':'HOLD — Independent head unverified';
    el('audit757').textContent=data.owner_audit_design_status||'HOLD — Not applied';
    el('closure757').textContent=data.closure_preflight_status||'HOLD — Not authorized';
    fillFollowUps(data.follow_ups);status(`${data.closure_preflight_status||'HOLD'} — ${data.blocking_count??'Unknown'} blocking conditions.`);
    if(data.ok){packet=data;el('export757').disabled=false;}
  }catch(error){status(`HOLD — Preflight unavailable: ${error.message}`);}
  finally{button.disabled=false;}
});
el('export757').addEventListener('click',()=>{
  if(!packet)return;const url=URL.createObjectURL(new Blob([JSON.stringify(packet,null,2)],{type:'application/json'}));
  const a=document.createElement('a');a.href=url;a.download='rosie-unsigned-economic-preflight-v757.json';a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
});
configuration();
