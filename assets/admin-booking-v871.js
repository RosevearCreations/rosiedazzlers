// Build 871: manual customer-delivery audit, quote consent withdrawal and live net-deposit review.
// No customer delivery occurs inside this UI; no booking/payment status is mutated.
const el871=id=>document.getElementById(id);
let selected871='',share871='',running871=false,withdrawn871=false;
const money871=v=>v==null?'unverified':'$'+(Number(v)/100).toFixed(2)+' CAD';
function say871(t,bad=false){
 const e=el871('rd871Notice');if(!e)return;
 e.textContent=t;e.className='notice mini'+(bad?' error':'');
}
async function call871(method='GET',data={}){
 const url='/api/admin/roadside_audit_v871'+(method==='GET'?
  '?draft_id='+encodeURIComponent(selected871):'');
 const res=await fetch(url,{method,credentials:'include',cache:'no-store',
  ...(method==='POST'?{headers:{'Content-Type':'application/json'},
   body:JSON.stringify({draft_id:selected871,...data})}:{})});
 const j=await res.json().catch(()=>({}));
 if(!res.ok||!j.ok)throw Error(j.error||'Private delivery and deposit audit unavailable');
 return j;
}
async function shareInfo871(){
 const res=await fetch('/api/admin/roadside_share_v870?draft_id='+
  encodeURIComponent(selected871),{credentials:'include',cache:'no-store'});
 const j=await res.json().catch(()=>({}));
 if(!res.ok||!j.ok)throw Error(j.error||'Active quote link unavailable');
 withdrawn871=j.quote_consent_withdrawn===true;
 const item=(j.links||[]).find(x=>!x.revoked_at&&x.active);
 share871=item?.id||'';
 el871('rd871ShareLabel').textContent=withdrawn871?
  'Customer quote permission withdrawn — links revoked; create a new intake for fresh consent.':
  share871?'Active private quote link selected for manual delivery audit.':
  'No active quote link. Create a private quote link above first.';
 el871('rd871LogDelivery').disabled=!share871||withdrawn871;
 el871('rd871WithdrawConsent').disabled=withdrawn871;
}
function display871(data){
 withdrawn871=data.quote_consent_withdrawn===true;
 if(withdrawn871)el871('rd871WithdrawConsent').disabled=true;
 el871('rd871Consent').textContent=withdrawn871?
  'Quote sharing consent WITHDRAWN. Contact details cleared; previous links revoked.':
  data.private_capture_withdrawn?'Further private media capture has been withdrawn.':
  'Quote sharing consent has not been withdrawn.';
 const entries=data.delivery_audit||[];
 const log=el871('rd871AuditTrail');log.replaceChildren();
 if(!entries.length){const p=document.createElement('p');p.textContent=
   'No staff delivery or withdrawal events recorded.';log.append(p);}
 for(const event of entries){
  const p=document.createElement('p');p.className='mini';
  p.textContent=new Date(event.occurred_at).toLocaleString()+
   ' · '+event.event_type.replaceAll('_',' ')+
   ' · '+event.channel.replaceAll('_',' ')+
   ' · staff: '+event.actor+' (staff attestation, not provider delivery proof)';
  log.append(p);
 }
 const last=data.net_history?.[0]||null;
 const text=last?(new Date(last.checked_at).toLocaleString()+' · '+
  last.provider.toUpperCase()+' · '+last.state.replaceAll('_',' ')+
  ' · original '+money871(last.gross_cents)+' / refunded '+
  money871(last.refunded_cents)+' / remaining '+
  money871(last.net_cents)+
  ' · '+(last.net_verified?'Verified provider snapshot':'HOLD: no net amount certified')):
  'No refund-aware deposit check on record. A previous Build 870 original payment check does not establish the current net amount.';
 el871('rd871NetStatus').textContent=text;
 el871('rd871Reconcile').disabled=!data.booking_linked;
}
async function refresh871(){
 if(!selected871)return;
 const [data]=await Promise.all([call871(),shareInfo871()]);
 display871(data);
}
async function pick871(id){
 if(!id)return;
 selected871=id;share871='';withdrawn871=false;
 el871('rd871ConfirmDelivery').checked=false;
 el871('rd871ConfirmWithdraw').checked=false;
 el871('rd871ConfirmRevoke').checked=false;
 el871('rd871StopCapture').checked=false;
 el871('rd871NetStatus').textContent='Checking private source…';
 try{await refresh871();}catch(e){say871(e.message,true);}
}
async function execute871(body){
 if(running871||!selected871)return null;
 running871=true;
 try{return await call871('POST',body);}
 catch(e){say871(e.message,true);return null;}
 finally{running871=false;}
}
async function delivery871(){
 if(!share871||withdrawn871){say871('An active, consented quote share is required.',true);return;}
 const channel=el871('rd871Channel').value;
 const event_type=el871('rd871EventType').value;
 const result=await execute871({action:'record_delivery',share_id:share871,
  channel,event_type,
  confirm_staff_witnessed_event:el871('rd871ConfirmDelivery').checked});
 if(!result)return;
 el871('rd871ConfirmDelivery').checked=false;
 say871('Manual staff '+event_type.replaceAll('_',' ')+' recorded. No email/SMS was sent or independently verified by this action.');
 await refresh871();
}
async function withdraw871(){
 if(withdrawn871){say871('Consent was already withdrawn for this draft.',true);return;}
 if(!confirm('Withdraw this customer’s quote-sharing permission, clear saved draft contact information, and revoke ALL quote links? Existing private photos remain under retention review.')){
  return;
 }
 const result=await execute871({action:'withdraw_consent',
  confirm_customer_withdrawal_request:el871('rd871ConfirmWithdraw').checked,
  confirm_revoke_all_quote_links:el871('rd871ConfirmRevoke').checked,
  stop_future_private_capture:el871('rd871StopCapture').checked});
 if(!result)return;
 say871('Quote consent withdrawn. '+result.links_revoked+
  ' link(s) revoked. Future sharing requires a NEW, separately consented draft.');
 window.dispatchEvent(new CustomEvent('rosie:roadside-consent-withdrawn',
  {detail:{draft_id:selected871}}));
 await refresh871();
}
async function reconcile871(){
 const result=await execute871({action:'reconcile_net_deposit'});
 if(!result)return;
 const d=result.deposit||{};
 if(d.net_verified===true){
  say871('Current '+String(d.provider||'provider').toUpperCase()+
   ' refund snapshot: original '+money871(d.gross_cents)+
   ', refunded '+money871(d.refunded_cents)+
   ', remaining '+money871(d.net_cents)+
   '. This does NOT mark the invoice paid or guarantee future refund state.');
 }else say871('HOLD: '+(d.reason||d.note||'Refund or deposit evidence insufficient')+
   '. No remaining balance has been certified.',true);
 await refresh871();
}
function boot871(){
 if(!el871('rd871LogDelivery'))return;
 el871('rd871LogDelivery').addEventListener('click',delivery871);
 el871('rd871WithdrawConsent').addEventListener('click',withdraw871);
 el871('rd871Reconcile').addEventListener('click',reconcile871);
 window.addEventListener('rosie:intake-selected',e=>pick871(e.detail?.id));
 window.addEventListener('rosie:roadside-share-changed',()=>refresh871().catch(e=>say871(e.message,true)));
 if(el871('rdIntakeId')?.value)pick871(el871('rdIntakeId').value);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot871);
else boot871();
