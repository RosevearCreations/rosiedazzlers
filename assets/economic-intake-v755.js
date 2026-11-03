const el=id=>document.getElementById(id);
const endpoint='/api/admin/economic_source_intake_v755';
let lastPacket=null;
const setStatus=value=>{el('status755').textContent=value;};
const date=new Date();el('period755').value=`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;
const addCell=(row,value)=>{const cell=document.createElement('td');cell.textContent=String(value??'—');row.appendChild(cell);};
function renderRows(target,rows,mapper){
  const tbody=el(target);tbody.replaceChildren();
  if(!rows?.length){const tr=document.createElement('tr');const td=document.createElement('td');td.colSpan=3;td.textContent='No review evidence available.';tr.appendChild(td);tbody.appendChild(tr);return;}
  for(const data of rows){const row=document.createElement('tr');for(const value of mapper(data))addCell(row,value);tbody.appendChild(row);}
}
async function status(){
  try{
    const res=await fetch(endpoint,{credentials:'same-origin',headers:{Accept:'application/json'},cache:'no-store'});
    const data=await res.json();if(!res.ok||!data.ok)throw Error(data.error||'Sign-in required.');
    el('config755').textContent='Private evidence review is available. Original source custody and actual business closure remain unverified.';
  }catch(error){el('config755').textContent=`HOLD — ${error.message}`;}
}
for(const [fileId,textId] of [['fileRecord755','record755'],['fileSource755','source755'],['fileOwner755','owner755']]){
  el(fileId).addEventListener('change',async()=>{
    const file=el(fileId).files?.[0];if(!file)return;
    if(file.size>32000){setStatus('HOLD — An evidence file exceeds the 32 KB input cap.');return;}
    try{const contents=await file.text();JSON.parse(contents);el(textId).value=contents;setStatus(`${file.name} imported locally; not yet submitted.`);}
    catch{setStatus(`HOLD — ${file.name} is not valid JSON.`);}
  });
}
el('form755').addEventListener('submit',async event=>{
  event.preventDefault();lastPacket=null;el('export755').disabled=true;
  let evidence;
  try{evidence={period:el('period755').value,booking_id:el('booking755').value.trim(),
    source_record:JSON.parse(el('record755').value),source_attestation:JSON.parse(el('source755').value),
    owner_receipt:JSON.parse(el('owner755').value)};}
  catch{setStatus('HOLD — Supply three valid JSON evidence objects.');return;}
  const button=el('verify755');button.disabled=true;setStatus('Rechecking live records, independently signed receipts and original-record hash…');
  try{
    const res=await fetch(endpoint,{method:'POST',credentials:'same-origin',cache:'no-store',
      headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(evidence)});
    const data=await res.json();el('result755').textContent=JSON.stringify(data,null,2);
    renderRows('audit755',data.decision_audit,d=>[d.phase,d.status,d.reference]);
    renderRows('follow755',data.follow_ups,d=>[d.severity,d.code,d.action]);
    setStatus(`${data.evidence_status||'HOLD'} — Business source closure remains unrecorded.`);
    if(data.ok){lastPacket=data;el('export755').disabled=false;}
  }catch(error){setStatus(`HOLD — Evidence review unavailable: ${error.message}`);}
  finally{button.disabled=false;}
});
el('export755').addEventListener('click',()=>{
  if(!lastPacket)return;
  const url=URL.createObjectURL(new Blob([JSON.stringify(lastPacket,null,2)],{type:'application/json'}));
  const a=document.createElement('a');a.href=url;a.download='rosie-economic-unsigned-review-v755.json';a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
});
status();
