// Rosie 872: provider-reported delivery, refund exception, same-browser roadside field test.
// Do not manufacture a customer receipt, settle a refund or claim hardware attestation.
const r872=id=>document.getElementById(id);
let selected872='',share872='',busy872=false,device872=null,case872='';
const msg872=(v,bad=false)=>{
 const el=r872('rd872Status');if(!el)return;el.textContent=v;
 el.className='notice mini'+(bad?' error':'');
};
async function post872(route,action,values={}){
 const r=await fetch(route,{method:'POST',credentials:'include',cache:'no-store',
  headers:{'Content-Type':'application/json'},body:JSON.stringify({draft_id:selected872,action,...values})});
 const j=await r.json().catch(()=>({}));
 if(!r.ok||!j.ok)throw Error(j.error||'Original roadside authority unavailable');
 return j;
}
async function get872(route){
 const r=await fetch(route+'?draft_id='+encodeURIComponent(selected872),
  {credentials:'include',cache:'no-store'});
 const j=await r.json().catch(()=>({}));
 if(!r.ok||!j.ok)throw Error(j.error||'Original private receipt unavailable');
 return j;
}
function pretty872(v){return String(v||'unknown').replaceAll('_',' ');}
async function refresh872(){
 if(!selected872)return;
 const [a,b,c]=await Promise.all([
  get872('/api/admin/roadside_send_v872'),
  get872('/api/admin/roadside_field_v872'),
  get872('/api/admin/roadside_share_v870')
 ]);
 const current=(c.links||[]).find(x=>x.active&&!x.revoked_at);
 share872=current?.id||'';
 const deliveries=(a.dispatches||[]);
 r872('rd872ProviderStatus').textContent=deliveries.length?
  deliveries.map(x=>new Date(x.created_at).toLocaleString()+' · '+
   pretty872(x.state)+' · '+(x.provider||'provider pending')+
   ' (only signed callback can prove provider-reported delivery)').join('\n'):
  'No provider delivery attempt recorded. A copied link is not a delivered message.';
 r872('rd872Send').disabled=!share872||c.quote_consent_withdrawn===true||
  deliveries.some(x=>x.share_id===share872);
 const cases=b.refund_cases||[];
 const active=cases.find(x=>x.state!=='closed_verified');
 case872=active?.id||'';
 r872('rd872CaseStatus').textContent=cases.length?
  cases.map(x=>new Date(x.opened_at).toLocaleString()+' · '+
   pretty872(x.issue_code)+' · '+pretty872(x.state)).join('\n'):
  'No refund exceptions opened. Recheck the original provider deposit using Build 871 first.';
 r872('rd872OpenCase').disabled=!b.latest_net_checks?.length||Boolean(case872);
 r872('rd872ReviewHold').disabled=!case872;
 r872('rd872CloseCase').disabled=!case872;
 const challenges=b.device_challenges||[];
 r872('rd872DeviceStatus').textContent=challenges.length?
  challenges.map(x=>new Date(x.issued_at).toLocaleString()+' · '+
   pretty872(x.state)+' · '+(x.state==='owner_accepted'?
    'Owner witnessed original device':'No physical-device approval inferred')).join('\n'):
  'No original-device challenge. Production CI does not replace a live field test.';
 r872('rd872OwnerAccept').disabled=!challenges.some(x=>x.state==='browser_proof_complete');
}
async function run872(action){
 if(busy872||!selected872)return;
 busy872=true;
 try{await action();}
 catch(e){msg872(e.message,true);}
 finally{busy872=false;}
}
async function send872(){
 await run872(async()=>{
  const link=r872('rdShareUrl870')?.value||'';
  let token='';
  try{token=new URL(link).hash.match(/(?:^#|&)share=([A-Za-z0-9_-]{43})/)?.[1]||'';}catch{}
  if(!token||!share872)throw Error('Original private link is only available when freshly issued. Revoke and reissue if lost.');
  const email=(r872('rdQuickEmail')?.value||'').trim().toLowerCase();
  if(!email||!r872('rd872ConsentSend').checked||!r872('rd872NoRetry').checked)
   throw Error('Customer-approved original email and explicit one-send confirmation required.');
  const result=await post872('/api/admin/roadside_send_v872','send_consented_email',{
   share_id:share872,share_token:token,recipient_confirmed_email:email,
   confirm_customer_email_delivery:true,confirm_one_attempt_no_automatic_retry:true});
  r872('rd872ConsentSend').checked=false;
  r872('rd872NoRetry').checked=false;
  msg872(result.status==='provider_accepted'?
   'Provider ACCEPTED this message. Not yet delivered: require the independently signed provider callback.':
   'Delivery on HOLD. No automatic resend; reconcile with the external provider.');
  await refresh872();
 });
}
async function openCase872(){
 await run872(async()=>{
  const result=await post872('/api/admin/roadside_field_v872','open_refund_exception');
  msg872('Original deposit exception opened for owner review: '+result.state);
  await refresh872();
 });
}
async function reviewCase872(decision){
 await run872(async()=>{
  if(!case872)throw Error('An original open exception is required.');
  const note=(r872('rd872OwnerReason')?.value||'').trim();
  if(note.length<12)throw Error('Owner must enter at least 12 characters of reasoning.');
  if(decision==='close_verified'&&!confirm('Close exception ONLY with a fresh original provider net-deposit check? This does NOT issue any refund.'))return;
  const result=await post872('/api/admin/roadside_field_v872','review_refund_exception',{
   case_id:case872,decision,note});
  msg872('Owner decision: '+pretty872(result.state)+'. No refund was issued.');
  await refresh872();
 });
}
async function startDevice872(){
 await run872(async()=>{
  if(!window.crypto?.subtle||!navigator.mediaDevices?.getUserMedia)
   throw Error('A secure browser with original camera and WebCrypto support is required.');
  if(!r872('rd872PhysicalDevice').checked)throw Error('Confirm we are using the original physical roadside device.');
  const key=await crypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},true,['sign','verify']);
  const jwk=await crypto.subtle.exportKey('jwk',key.publicKey);
  const response=await post872('/api/admin/roadside_field_v872','start_device_challenge',{
   confirm_original_device_present:true,public_key:jwk});
  device872={key,challenge:response.challenge_id,nonce:response.nonce,
   issuedAt:Date.now(),draftId:selected872};
  msg872('New challenge saved for five minutes. Now take and SAVE a fresh private photo/video using the camera controls above, then complete proof in THIS tab.');
  await refresh872();
 });
}
function encode872(bytes){
 return btoa(String.fromCharCode(...new Uint8Array(bytes)))
  .replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
async function completeDevice872(){
 await run872(async()=>{
  const s=device872;
  if(!s||s.draftId!==selected872||Date.now()-s.issuedAt>5*60*1000)
   throw Error('Device challenge expired or lost from this tab. Start a fresh one.');
  const media=await get872('/api/admin/detailing_intake_v868');
  const recent=(media.media||[]).filter(x=>x.status==='stored_private'&&
   Date.parse(x.verified_at)>=s.issuedAt-4000)
   .sort((a,b)=>Date.parse(b.verified_at)-Date.parse(a.verified_at));
  const saved=recent[0];
  if(!saved)throw Error('No NEW verified private media found since challenge. Use Take Photo(s)/Video, save it, and try again.');
  const signed='v872:'+s.challenge+':'+selected872+':'+saved.id+':'+s.nonce;
  const signature=await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},
   s.key.privateKey,new TextEncoder().encode(signed));
  const public_key=await crypto.subtle.exportKey('jwk',s.key.publicKey);
  const result=await post872('/api/admin/roadside_field_v872','complete_device_challenge',{
   challenge_id:s.challenge,media_id:saved.id,
   signature:encode872(signature),public_key,camera_api_available:true});
  device872=null;
  msg872('Original same-browser challenge and new private upload verified. Owner field observation is STILL REQUIRED; this is not hardware attestation.');
  await refresh872();
 });
}
async function ownerAccept872(){
 await run872(async()=>{
  const field=await get872('/api/admin/roadside_field_v872');
  const pending=(field.device_challenges||[]).find(x=>x.state==='browser_proof_complete');
  if(!pending)throw Error('Fresh owner-witnessable device proof required.');
  if(!r872('rd872OwnerObserved').checked||!r872('rd872OwnerPrivateMedia').checked)
   throw Error('Owner must independently witness the original device and private media.');
  const result=await post872('/api/admin/roadside_field_v872','owner_accept_device',{
   challenge_id:pending.id,confirm_original_device_observed:true,
   confirm_private_media_verified:true});
  msg872('Owner witnessed and accepted this field test. Provider delivery, customer payment and manufacturer hardware identity remain independent.');
  await refresh872();
 });
}
function boot872(){
 if(!r872('rd872Send'))return;
 r872('rd872Send').addEventListener('click',send872);
 r872('rd872OpenCase').addEventListener('click',openCase872);
 r872('rd872ReviewHold').addEventListener('click',()=>reviewCase872('review_hold'));
 r872('rd872CloseCase').addEventListener('click',()=>reviewCase872('close_verified'));
 r872('rd872StartDevice').addEventListener('click',startDevice872);
 r872('rd872CompleteDevice').addEventListener('click',completeDevice872);
 r872('rd872OwnerAccept').addEventListener('click',ownerAccept872);
 window.addEventListener('rosie:intake-selected',e=>{
  const id=e.detail?.id||'';if(!id)return;
  if(device872&&device872.draftId!==id)device872=null;
  selected872=id;refresh872().catch(e=>msg872(e.message,true));
 });
 for(const name of ['rosie:roadside-share-changed','rosie:roadside-consent-withdrawn'])
  window.addEventListener(name,()=>refresh872().catch(e=>msg872(e.message,true)));
 if(r872('rdIntakeId')?.value){selected872=r872('rdIntakeId').value;
  refresh872().catch(e=>msg872(e.message,true));}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot872);
else boot872();
