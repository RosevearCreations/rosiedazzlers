import {inspectCommsReadback781,buildUnsignedCommsHandoff781}
  from './ql781-comms-evidence.mjs';

const el=id=>document.getElementById(id);
let statusPacket=null;
let localReadback=null;
async function refresh(){
  statusPacket=null;
  el('status781').textContent='Checking Rosie source status with the signed-in owner session (no remote handshake)…';
  el('revision781').textContent='Not independently verified';
  el('remote781').textContent='0 verified · HOLD';
  el('gates781').replaceChildren();
  try{
    const response=await fetch('/api/admin/comms_hub_connection_status_v781',{
      method:'GET',credentials:'same-origin',cache:'no-store',headers:{Accept:'application/json'}});
    const result=await response.json();
    if(!response.ok||result.ok!==true||result.connection_state!=='DISCONNECTED / HOLD'||
      result.actual_remote_handshakes!==0||result.network_requests_by_status_check!==0)
      throw Error('Original owner session or source HOLD evidence unavailable.');
    statusPacket=result;
    el('connection781').textContent=result.connection_state;
    el('revision781').textContent=result.production_source_revision_reference||'Not supplied by runtime';
    el('remote781').textContent='0 authenticated · source-only status';
    el('status781').textContent='Read-only local source check complete. No original signed TEST receipts or authenticated Comms connection established.';
    for(const gate of result.outstanding_gates||[]){
      const li=document.createElement('li');
      li.textContent=`${gate.id}: ${gate.state} · ${gate.next}`;
      el('gates781').append(li);
    }
  }catch(error){
    el('connection781').textContent='DISCONNECTED / HOLD';
    el('status781').textContent=`HOLD — ${error.message}. No remote connection test was started.`;
  }
}
el('refresh781').addEventListener('click',refresh);
el('readback781').addEventListener('change',async event=>{
  localReadback=null;
  el('readbackResult781').textContent='HOLD — Imported evidence not authenticated.';
  const file=event.target.files?.[0];
  if(!file)return;
  if(file.size>65536){el('readbackStatus781').textContent='DENY — Readback exceeds 64 KB.';return;}
  try{
    const raw=JSON.parse(await file.text());
    const review=inspectCommsReadback781(raw);
    el('readbackResult781').textContent=JSON.stringify(review,null,2);
    if(!review.ok)throw Error(review.reason);
    localReadback=review;
    el('readbackStatus781').textContent='FORMAT VALID · Six peers remain DISCONNECTED / HOLD. Original issuer and owner authorization NOT VERIFIED. File stayed local.';
  }catch(error){
    el('readbackStatus781').textContent=`HOLD — ${error.message}. No original receipt was trusted.`;
  }
});
el('handoff781').addEventListener('click',()=>{
  const handoff=buildUnsignedCommsHandoff781({
    sourceRevision:statusPacket?.production_source_revision_reference,
    importedReadback:localReadback});
  const url=URL.createObjectURL(new Blob([JSON.stringify(handoff,null,2)],
    {type:'application/json'}));
  const a=document.createElement('a');a.href=url;
  a.download='rosie-unsigned-comms-test-owner-handoff-v781.json';a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
});
refresh();
