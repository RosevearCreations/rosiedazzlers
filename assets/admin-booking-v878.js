// Rosie 878 — original owner native delivery, immutable SLA acknowledgement,
// and independently pinned provenance verifier. No customer sends/refunds.
const q878=id=>document.getElementById(id);
let draft878='',busy878=false,lastAck878=null;
function show878(id,msg,hold=true){
 const node=q878(id);if(!node)return;
 node.textContent=msg;node.className='notice mini'+(hold?' error':'');
}
async function fetch878(path,{body=null}={}){
 const r=await fetch(path,{method:body?'POST':'GET',credentials:'include',
  cache:'no-store',referrerPolicy:'no-referrer',
  ...(body?{headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{})});
 const data=await r.json().catch(()=>({}));
 if(!r.ok||data.ok!==true)throw Error(data.error||'Original owner source unavailable');
 return data;
}
async function native878(){
 if(!draft878||busy878)return;busy878=true;
 const id=draft878;
 try{
  const d=await fetch878('/api/admin/roadside_native_delivery_v878?draft_id='+encodeURIComponent(id));
  if(id!==draft878)return;
  show878('rd878NativeResult',d.delivery_corroborated?
   'Original native provider receipt chain corroborated by the live vendor account: '+
    d.receipt_count+' signed event(s). Latest receipt '+d.latest_signed_event_at+
    '. Customer opening/reading remains unverified.':
   'HOLD — '+(d.reason||'Original signed native provider evidence unavailable'),
   !d.delivery_corroborated);
 }catch(ex){show878('rd878NativeResult','HOLD — '+ex.message);}
 finally{busy878=false;}
}
async function auditAck878(){
 if(!draft878||busy878)return;busy878=true;
 const id=draft878;
 try{
  const d=await fetch878('/api/admin/roadside_sla_ack_v878?draft_id='+encodeURIComponent(id));
  if(id!==draft878)return;
  lastAck878=d;
  const sel=q878('rd878AckCase');
  sel.replaceChildren();
  for(const a of d.cases||[]){
   const opt=document.createElement('option');opt.value=a.case_id;
   opt.textContent='Original case '+a.case_id.slice(0,8)+' · '+a.state.replaceAll('_',' ');
   sel.appendChild(opt);
  }
  const available=(d.cases||[]).some(c=>c.state==='OWNER_ACK_REQUIRED');
  q878('rd878AckSend').disabled=!available;
  show878('rd878AckResult',
   d.cases?.length?
    'Original case SLA '+d.original_sla_state+' · '+d.severity+
    ' · '+d.cases.filter(c=>c.acknowledged).length+'/'+d.cases.length+
    ' current source-bound owner acknowledgement(s). Acknowledgment does not reset the SLA or close a case.':
    'HOLD: no original unresolved refund case to acknowledge. Nothing was created.',
   !d.all_current_owner_cases_acknowledged);
 }catch(ex){lastAck878=null;show878('rd878AckResult','HOLD — '+ex.message);}
 finally{busy878=false;}
}
async function commitAck878(){
 if(!draft878||busy878||!lastAck878)return;
 const caseId=q878('rd878AckCase')?.value||'';
 const item=lastAck878.cases?.find(c=>c.case_id===caseId);
 const note=(q878('rd878AckNote')?.value||'').trim();
 if(item?.state!=='OWNER_ACK_REQUIRED'||note.length<12||note.length>500){
  show878('rd878AckResult','Select an unacknowledged original case and enter an explanation (12–500 characters).');return;
 }
 busy878=true;q878('rd878AckSend').disabled=true;
 const id=draft878;
 try{
  const r=await fetch878('/api/admin/roadside_sla_ack_v878',{body:{
   draft_id:id,case_id:caseId,source_check_id:lastAck878.source_check_id,
   owner_note:note}});
  if(id!==draft878)return;
  show878('rd878AckResult',r.state+' at '+r.acknowledged_at+
   '. Original deadline unchanged; refund remains subject to separate verification.',false);
  q878('rd878AckNote').value='';
  lastAck878=null;
 }catch(ex){show878('rd878AckResult','HOLD — '+ex.message);}
 finally{busy878=false;q878('rd878AckSend').disabled=true;}
}
async function readJSONFile878(id,maxBytes){
 const file=q878(id)?.files?.[0];
 if(!file||file.size<20||file.size>maxBytes||!/\.json$/i.test(file.name))
  throw Error('Choose a JSON file under '+Math.floor(maxBytes/1024)+' KB for '+id);
 return JSON.parse(await file.text());
}
async function verifyPin878(){
 if(!draft878||busy878)return;busy878=true;
 const id=draft878;q878('rd878VerifyPin').disabled=true;
 try{
  const [artifact,sidecar]=await Promise.all([
   readJSONFile878('rd878OriginalDossier',65536),
   readJSONFile878('rd878IssuerSidecar',16384)]);
  if(artifact.schema!=='rosie-roadside-closure-export-v874')
   throw Error('Original closure JSON export required');
  if(sidecar.payload?.schema!=='rosie-closure-provenance-renewal-v877')
   throw Error('Signed Build 877 Ed25519 sidecar required');
  const data=await fetch878('/api/admin/roadside_provenance_verify_v878',{
   body:{draft_id:id,artifact,sidecar}});
  if(id!==draft878)return;
  show878('rd878PinResult',data.pinned_provenance_verified?
   'Historical dossier and independently pinned issuer key verified · '+
    data.rotation_readiness+' · '+data.issuer_key_id+
    '. This does not clear current refunds or establish third-party witnessing.':
   'HOLD — Pinned issuer and original source proof are not verified',
   !data.pinned_provenance_verified);
 }catch(ex){show878('rd878PinResult','HOLD — '+ex.message);}
 finally{busy878=false;q878('rd878VerifyPin').disabled=!draft878;}
}
function choose878(id){
 draft878=id||'';lastAck878=null;
 for(const name of ['rd878Native','rd878AckAudit','rd878VerifyPin',
  'rd878OriginalDossier','rd878IssuerSidecar','rd878AckNote']){
  if(q878(name))q878(name).disabled=!draft878;
 }
 if(q878('rd878AckSend'))q878('rd878AckSend').disabled=true;
 if(q878('rd878AckCase'))q878('rd878AckCase').replaceChildren();
 for(const name of ['rd878OriginalDossier','rd878IssuerSidecar'])
  if(q878(name))q878(name).value='';
 show878('rd878NativeResult',draft878?'Original live native delivery not checked.':'Select an original roadside request.');
 show878('rd878AckResult',draft878?'Original persisted SLA acknowledgements not yet checked.':'Select an original roadside request.');
 show878('rd878PinResult',draft878?'Choose the original closure dossier and issuer signature sidecar.':'Select an original roadside request.');
}
function boot878(){
 if(!q878('rd878Native'))return;
 q878('rd878Native').addEventListener('click',native878);
 q878('rd878AckAudit').addEventListener('click',auditAck878);
 q878('rd878AckSend').addEventListener('click',commitAck878);
 q878('rd878VerifyPin').addEventListener('click',verifyPin878);
 window.addEventListener('rosie:intake-selected',e=>choose878(e.detail?.id));
 window.addEventListener('rosie:roadside-consent-withdrawn',()=>choose878(draft878));
 choose878(q878('rdIntakeId')?.value);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot878);
else boot878();
