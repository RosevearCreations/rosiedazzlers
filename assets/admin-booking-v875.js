// Rosie 875: owner-only evidence controls, no automatic provider messages or refunds.
const e875=id=>document.getElementById(id);
let original875='',ownerClosure875=false,busy875=false;
function notice875(id,value,attention=false){
 const el=e875(id);if(!el)return;
 el.textContent=value;
 el.className='notice mini'+(attention?' error':'');
}
async function ownerGet875(path,asBlob=false){
 const r=await fetch(path+'?draft_id='+encodeURIComponent(original875),
  {method:'GET',cache:'no-store',credentials:'include',referrerPolicy:'no-referrer'});
 if(!r.ok){
  const obj=await r.json().catch(()=>({}));
  throw Error(obj.error||'Original owner evidence is unavailable');
 }
 if(asBlob){
  if(!/application\/json/i.test(r.headers.get('Content-Type')||''))throw Error('Original evidence download is not JSON');
  const b=await r.blob();
  if(!b.size||b.size>1048576)throw Error('Evidence download outside permitted size');
  return b;
 }
 const obj=await r.json().catch(()=>({}));
 if(obj.ok!==true)throw Error(obj.error||'Owner source was not verified');
 return obj;
}
async function reviewOwner875(){
 if(!original875)return;
 ownerClosure875=false;e875('rd875Download').disabled=true;
 const id=original875;
 try{
  const o=await ownerGet875('/api/admin/roadside_pilot_v873');
  if(id!==original875)return;
  ownerClosure875=o.owner_pilot_closed===true&&!!o.closure?.id;
  e875('rd875Download').disabled=!ownerClosure875;
  notice875('rd875Closure',ownerClosure875?
   'Original pilot closure exists. Owner evidence download is permitted, subject to fresh server verification.':
   'HOLD: no original independently accepted pilot closure. Export is disabled.',!ownerClosure875);
 }catch(ex){
  if(id!==original875)return;
  notice875('rd875Closure','HOLD: '+ex.message,true);
 }
}
async function checkProvider875(){
 if(!original875||busy875)return;
 busy875=true;
 try{
  const data=await ownerGet875('/api/admin/roadside_provider_mapping_v874');
  notice875('rd875Native',data.native_adapter_enabled?
   'Optional Resend-native verifier configured. This does NOT prove external webhook enrollment or a received original provider event.':
   'HOLD: no original native provider signing adapter enrolled. Source tests are not provider proof.',
   !data.native_adapter_enabled);
 }catch(ex){notice875('rd875Native','HOLD: '+ex.message,true);}
 finally{busy875=false;}
}
function amount875(v){return Number.isSafeInteger(v)?'$'+(v/100).toFixed(2)+' CAD':'unverified';}
async function checkDrift875(){
 if(!original875||busy875)return;
 busy875=true;
 const button=e875('rd875Drift');button.disabled=true;
 notice875('rd875Refund','Checking original live payment-provider evidence (read-only)…');
 try{
  const info=await ownerGet875('/api/admin/roadside_refund_drift_v875');
  const last=info.live;
  const extra=last?
   ' · source '+amount875(last.gross_cents)+
   ', refunded '+amount875(last.refunded_cents)+
   ', remaining '+amount875(last.net_cents):'';
  notice875('rd875Refund',info.state.replaceAll('_',' ')+' — '+
   info.reason+extra+(info.alert?' · Owner follow-up required.':' · No new drift observed.'),
   info.alert===true);
 }catch(ex){notice875('rd875Refund','HOLD: '+ex.message,true);}
 finally{busy875=false;button.disabled=false;}
}
async function download875(){
 if(!original875||!ownerClosure875||busy875)return;
 busy875=true;
 const button=e875('rd875Download');button.disabled=true;
 try{
  const blob=await ownerGet875('/api/admin/roadside_closure_export_v874',true);
  const href=URL.createObjectURL(blob);
  try{
   const a=document.createElement('a');a.href=href;
   a.download='rosie-roadside-closure-'+original875.slice(0,8)+'.json';
   a.style.display='none';document.body.append(a);a.click();a.remove();
  }finally{setTimeout(()=>URL.revokeObjectURL(href),15000);}
  notice875('rd875Closure','Original closure JSON downloaded to this device. Contains private operational evidence: store securely. SHA-256 is not an independent signature.');
 }catch(ex){
  ownerClosure875=false;
  notice875('rd875Closure','Download blocked: '+ex.message,true);
 }finally{busy875=false;button.disabled=!ownerClosure875;}
}
function choose875(id){
 original875=id||'';ownerClosure875=false;
 e875('rd875Download').disabled=true;
 e875('rd875CheckClosure').disabled=!original875;
 e875('rd875Drift').disabled=!original875;
 e875('rd875CheckNative').disabled=!original875;
 notice875('rd875Native','Native provider enrollment has not been independently verified.');
 notice875('rd875Refund','No current live refund comparison performed.');
 notice875('rd875Closure',original875?
  'Checking owner closure before making export available…':
  'Save or choose a roadside draft first.');
 if(original875)reviewOwner875();
}
function boot875(){
 if(!e875('rd875Download'))return;
 e875('rd875CheckNative').addEventListener('click',checkProvider875);
 e875('rd875Drift').addEventListener('click',checkDrift875);
 e875('rd875CheckClosure').addEventListener('click',reviewOwner875);
 e875('rd875Download').addEventListener('click',download875);
 window.addEventListener('rosie:intake-selected',e=>choose875(e.detail?.id));
 window.addEventListener('rosie:roadside-consent-withdrawn',()=>choose875(original875));
 choose875(e875('rdIntakeId')?.value);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot875);
else boot875();
