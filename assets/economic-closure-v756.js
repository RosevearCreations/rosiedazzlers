const el=id=>document.getElementById(id),endpoint='/api/admin/economic_closure_review_v756';
const date=new Date();el('period756').value=`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;
let packet=null;
const status=value=>{el('status756').textContent=value;};
const cell=(row,text)=>{const td=document.createElement('td');td.textContent=String(text??'—');row.appendChild(td);};
const fillFollowUps=items=>{
  const tbody=el('follow756');tbody.replaceChildren();
  if(!items?.length){const row=document.createElement('tr');const td=document.createElement('td');td.colSpan=3;td.textContent='No follow-up packet.';row.appendChild(td);tbody.appendChild(row);return;}
  for(const item of items){const row=document.createElement('tr');for(const value of [item.priority,item.code,item.action])cell(row,value);tbody.appendChild(row);}
};
async function configuration(){
  try{const r=await fetch(endpoint,{credentials:'same-origin',cache:'no-store',headers:{Accept:'application/json'}});const data=await r.json();
    if(!r.ok||!data.ok)throw Error(data.error||'Private staff access required.');
    el('config756').textContent='Private read-only source verification available. Closure remains HOLD until immutable revision custody and separately authorized owner audit persistence are proven.';
  }catch(error){el('config756').textContent=`HOLD — ${error.message}`;}
}
for(const [fileId,textId] of [['fileRecord756','record756'],['fileSource756','source756'],['fileOwner756','owner756']]){
  el(fileId).addEventListener('change',async()=>{
    const file=el(fileId).files?.[0];if(!file)return;
    if(file.size>32000){status('HOLD — File exceeds 32 KB evidence cap.');return;}
    try{const content=await file.text();JSON.parse(content);el(textId).value=content;status(`${file.name} imported locally; not yet submitted.`);}
    catch{status(`HOLD — ${file.name} is not valid JSON.`);}
  });
}
el('form756').addEventListener('submit',async event=>{
  event.preventDefault();packet=null;el('export756').disabled=true;
  let evidence;
  try{evidence={period:el('period756').value,booking_id:el('booking756').value.trim(),
    source_record:JSON.parse(el('record756').value),source_attestation:JSON.parse(el('source756').value),
    owner_receipt:JSON.parse(el('owner756').value)};}
  catch{status('HOLD — Enter three valid JSON evidence records.');return;}
  const button=el('verify756');button.disabled=true;status('Verifying signed evidence, current Supabase row and owner audit readiness…');
  try{
    const r=await fetch(endpoint,{method:'POST',credentials:'same-origin',cache:'no-store',
      headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(evidence)});
    const data=await r.json();el('result756').textContent=JSON.stringify(data,null,2);
    el('sourceStatus756').textContent=data.source_readback?.readback_status||'HOLD — Not checked';
    el('historyStatus756').textContent=data.source_record_custody_verified?'Independent history verified':'HOLD — Original history unverified';
    el('auditStatus756').textContent=data.owner_persistence_readiness?.probe_status||'HOLD — Not checked';
    el('closureStatus756').textContent=data.closure_review_status||'HOLD — Not authorized';
    fillFollowUps(data.follow_ups);status(`${data.closure_review_status||'HOLD'} — ${data.blocking_count??'Unknown'} blocking conditions.`);
    if(data.ok){packet=data;el('export756').disabled=false;}
  }catch(error){status(`HOLD — Review unavailable: ${error.message}`);}
  finally{button.disabled=false;}
});
el('export756').addEventListener('click',()=>{
  if(!packet)return;const url=URL.createObjectURL(new Blob([JSON.stringify(packet,null,2)],{type:'application/json'}));
  const anchor=document.createElement('a');anchor.href=url;anchor.download='rosie-unsigned-closure-review-v756.json';anchor.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
});
configuration();
