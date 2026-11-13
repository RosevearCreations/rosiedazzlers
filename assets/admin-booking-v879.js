// Rosie 879 — original native stability snapshot, source-bound ack renewal, manual rotation readback.
const el879=id=>document.getElementById(id);
let draft879='',watch879=null,busy879=false;
function status879(id,body,ok=false){const n=el879(id);if(!n)return;n.textContent=body;n.className='notice mini'+(ok?'':' error');}
async function call879(url,body){
 const r=await fetch(url,{method:body?'POST':'GET',credentials:'include',
   cache:'no-store',referrerPolicy:'no-referrer',...(body?{
     headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{})});
 const result=await r.json().catch(()=>({}));
 if(!r.ok||result.ok!==true)throw Error(result.error||'Original owner source HOLD');
 return result;
}
async function readFile879(id,limit){
 const f=el879(id)?.files?.[0];if(!f||f.size<20||f.size>limit||!/\.json$/i.test(f.name))
  throw Error('Original private JSON file required for '+id);
 return JSON.parse(await f.text());
}
async function review879(){
 if(!draft879||busy879)return;busy879=true;
 const target=draft879;
 try{
  const result=await call879('/api/admin/roadside_stability_watch_v879?draft_id='+encodeURIComponent(target));
  if(draft879!==target)return;
  const d=result.delivery_watch,a=result.owner_sla_renewal;
  const last=watch879?.draft_id===target?watch879:null;
  const changed=last&&last.delivery_watch?.source_chain_sha256!==d.source_chain_sha256;
  status879('rd879WatchResult',d.state+' · '+d.verified+
    (changed?' · DRIFT/HOLD: original signed event chain changed since the last manual check. Review original sources.':'')+
    ' · '+(d.latest_original_signed_event_at||d.reason||'no corroboration')+
    '. This is not a continuous monitor or customer-read proof.',d.verified&&!changed);
  status879('rd879AckResult',a.state+(a.required_cases!==undefined?
   ' · '+a.required_cases+' current original case(s) need a renewed owner acknowledgment.':
   ' · '+a.reason)+
   ' Use the Build 878 acknowledgment control above; original SLA deadlines never reset.',
   a.state==='CURRENT_SOURCE_ACKNOWLEDGED');
  watch879=result;
 }catch(e){watch879=null;status879('rd879WatchResult','HOLD — '+e.message);}
 finally{busy879=false;}
}
async function rotation879(){
 if(!draft879||busy879)return;busy879=true;
 const target=draft879;
 try{
  const [artifact,sidecar]=await Promise.all([
   readFile879('rd878OriginalDossier',65536),readFile879('rd878IssuerSidecar',16384)]);
  const previous=(el879('rd879OldKey')?.value||'').trim();
  const active=(el879('rd879NewKey')?.value||'').trim();
  const ownerNote=(el879('rd879OwnerNote')?.value||'').trim();
  const result=await call879('/api/admin/roadside_rotation_execution_v879',{
   draft_id:target,artifact,sidecar,previous_issuer_key_id:previous,
   active_issuer_key_id:active,owner_note:ownerNote,
   owner_statement:'I_SUPERVISE_POST_ROTATION_READBACK'});
  if(target!==draft879)return;
  status879('rd879RotationResult',result.state+' · '+result.active_issuer_key_id+
   '. Current Cloudflare server pins were checked; this request neither updates them nor proves an external witness.',true);
 }catch(e){status879('rd879RotationResult','ROTATION HOLD — '+e.message);}
 finally{busy879=false;}
}
function choose879(id){draft879=id||'';watch879=null;
 for(const name of ['rd879Watch','rd879Rotation','rd879OldKey','rd879NewKey','rd879OwnerNote'])
  if(el879(name))el879(name).disabled=!draft879;
 status879('rd879WatchResult',draft879?'Run original live source watch.':'Select a saved roadside request.');
 status879('rd879AckResult','Current original source acknowledgment not reviewed.');
 status879('rd879RotationResult','No supervised operator-pin readback performed.');
}
function boot879(){
 if(!el879('rd879Watch'))return;
 el879('rd879Watch').addEventListener('click',review879);
 el879('rd879Rotation').addEventListener('click',rotation879);
 window.addEventListener('rosie:intake-selected',e=>choose879(e.detail?.id));
 window.addEventListener('rosie:roadside-consent-withdrawn',()=>choose879(draft879));
 choose879(el879('rdIntakeId')?.value);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot879);
else boot879();
