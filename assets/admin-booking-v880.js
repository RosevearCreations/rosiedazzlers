// Rosie 880: original owner-only persistent history and supervised grace watch.
const e880=id=>document.getElementById(id);
let draft880='',busy880=false;
function show880(id,message,pass=false){
 const el=e880(id);if(!el)return;
 el.textContent=message;el.className='notice mini'+(pass?'':' error');
}
async function call880(url,body=null){
 const r=await fetch(url,{method:body?'POST':'GET',credentials:'include',
  cache:'no-store',referrerPolicy:'no-referrer',
  ...(body?{headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{})});
 const obj=await r.json().catch(()=>({}));
 if(!r.ok||obj.ok!==true)throw Error(obj.error||'Original private custody HOLD');
 return obj;
}
async function originalFile880(id,maxSize){
 const f=e880(id)?.files?.[0];
 if(!f||f.size<20||f.size>maxSize||!/\.json$/i.test(f.name))
  throw Error('Select original private JSON file ('+id+') using Build 878 controls above.');
 return JSON.parse(await f.text());
}
async function capture880(){
 if(!draft880||busy880)return;busy880=true;
 const id=draft880;
 try{
  const r=await call880('/api/admin/roadside_watch_append_v880',{draft_id:id});
  if(id!==draft880)return;
  show880('rd880CaptureResult',r.state+' · immutable SHA-256 '+r.record_sha256+
   ' · '+r.recorded_at+'. This is one original source observation, not continuous delivery or customer-read proof.',true);
 }catch(ex){show880('rd880CaptureResult','WATCH HOLD — '+ex.message);}
 finally{busy880=false;}
}
async function history880(){
 if(!draft880||busy880)return;busy880=true;
 const id=draft880;
 try{
  const r=await call880('/api/admin/roadside_history_v880?draft_id='+encodeURIComponent(id));
  if(id!==draft880)return;
  const n=r.native_history.length,rot=r.rotation_history.length,g=r.historical_grace_watch;
  const sourceOK=r.native_chain_integrity.verified===true;
  const rotationOK=r.rotation_chain_integrity.verified===true;
  show880('rd880HistoryResult',n+' persisted original delivery review(s), '+rot+
   ' immutable supervised issuer readback receipt(s). Native chain: '+
   r.native_chain_integrity.state+'; rotation chain: '+r.rotation_chain_integrity.state+
   (r.history_truncated?' · more history exists; displayed window only':'')+
   '. History remains original private evidence, not an external WORM anchor.',
   sourceOK&&rotationOK&&!r.history_truncated);
  const active=(g.receipts||[]).filter(x=>x.state==='GRACE_EXPIRING_7_DAYS'||x.state==='GRACE_EXPIRED');
  show880('rd880GraceResult',g.state+' · '+(g.receipts?.length||0)+
   ' historical receipt(s) checked against deployed operator pins.'+
   (active.length?' '+active.map(x=>x.state+' until '+x.grace_verify_until).join('; '):'')+
   '. No silent key deletion or automated Cloudflare rotation.',g.verified&&!g.owner_followup_required);
 }catch(ex){show880('rd880HistoryResult','HISTORY HOLD — '+ex.message);}
 finally{busy880=false;}
}
async function receipt880(){
 if(!draft880||busy880)return;busy880=true;
 const id=draft880;
 try{
  const [artifact,sidecar]=await Promise.all([
   originalFile880('rd878OriginalDossier',65536),
   originalFile880('rd878IssuerSidecar',16384)]);
  const previous=(e880('rd879OldKey')?.value||'').trim();
  const current=(e880('rd879NewKey')?.value||'').trim();
  const note=(e880('rd879OwnerNote')?.value||'').trim();
  if(note.length<12||note.length>500)throw Error('Enter a substantive 12–500 character owner note above.');
  const r=await call880('/api/admin/roadside_rotation_receipt_v880',{
   draft_id:id,artifact,sidecar,previous_issuer_key_id:previous,
   active_issuer_key_id:current,owner_note:note,
   owner_statement:'I_SUPERVISE_POST_ROTATION_READBACK'});
  if(id!==draft880)return;
  show880('rd880ReceiptResult',r.state+' · SHA-256 '+r.receipt_sha256+
   ' · grace until '+r.grace_verify_until+
   '. Immutable database readback only; does not change Cloudflare secrets or prove third-party witnessing.',true);
 }catch(ex){show880('rd880ReceiptResult','ROTATION RECEIPT HOLD — '+ex.message);}
 finally{busy880=false;}
}
function choose880(id){
 draft880=id||'';
 for(const k of ['rd880Capture','rd880History','rd880Receipt'])
  if(e880(k))e880(k).disabled=!draft880;
 show880('rd880CaptureResult','Select an original saved roadside draft, then explicitly record one fresh source check.');
 show880('rd880HistoryResult','No persisted source-chain history queried.');
 show880('rd880ReceiptResult','No original supervised receipt submitted.');
 show880('rd880GraceResult','No original operator issuer grace monitoring query performed.');
}
function boot880(){
 if(!e880('rd880Capture'))return;
 e880('rd880Capture').addEventListener('click',capture880);
 e880('rd880History').addEventListener('click',history880);
 e880('rd880Receipt').addEventListener('click',receipt880);
 window.addEventListener('rosie:intake-selected',e=>choose880(e.detail?.id));
 window.addEventListener('rosie:roadside-consent-withdrawn',()=>choose880(draft880));
 choose880(e880('rdIntakeId')?.value);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot880);
else boot880();
