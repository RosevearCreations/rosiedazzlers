// Rosie 870: no messaging side effects. Staff explicitly copies/shares a short-lived link.
const rd=id=>document.getElementById(id);
let draftId='',shareId='',busy=false;
const cash=v=>'$'+Number(v||0).toFixed(2)+' CAD';
function message(v,bad=false){
 const el=rd('rdShareStatus');if(!el)return;
 el.textContent=v;el.className='notice mini'+(bad?' error':'');
}
async function request(method,data={}){
 const url='/api/admin/roadside_share_v870'+
  (method==='GET'?'?draft_id='+encodeURIComponent(draftId):'');
 const response=await fetch(url,{method,credentials:'include',cache:'no-store',
  ...(method==='POST'?{headers:{'Content-Type':'application/json'},
   body:JSON.stringify({draft_id:draftId,...data})}:{})});
 const result=await response.json().catch(()=>({}));
 if(!response.ok||!result.ok)throw Error(result.error||'Private quote-share authority unavailable');
 return result;
}
function showDeposit(value){
 const state=value?.state||'not_booked';
 const notes={
  not_booked:'No canonical booking linked. A quote or shared URL is not a deposit.',
  verified_original_deposit:'Original provider deposit VERIFIED against the actual booking. Refunds/current net balance require a separate review.',
  settlement_pending:'Provider payment seen; booking receipt or confirmation has not converged. HOLD.',
  pending_provider:'No provider-verified deposit yet. HOLD.',
  gift_covered_no_cash_deposit:'Gift-covered booking; not a cash deposit. Review original gift settlement.',
  hold_unverified:'Payment evidence could not be verified. HOLD; do not mark paid.'
 };
 rd('rdDepositStatus870').textContent=notes[state]||'Deposit needs owner review.';
 rd('rdReconcileDeposit870').disabled=state==='not_booked'||busy;
}
async function refresh(){
 if(!draftId)return;
 const value=await request('GET');
 const link=(value.links||[]).find(x=>!x.revoked_at)||null;
 shareId=link?.id||'';
 rd('rdCreateShare870').disabled=Boolean(shareId)||value.quote_consent_withdrawn===true;
 rd('rdRevokeShare870').disabled=!shareId||value.quote_consent_withdrawn===true;
 rd('rdShareExpiry870').textContent=link?
  (link.active?'Active until ':'Expired on ')+new Date(link.expires_at).toLocaleString()+
   ' (lost links must be revoked before reissue).':
  'No active quote link. New links expire in seven days.';
 showDeposit(value.deposit);
}
async function choose(id){
 if(!id)return;
 draftId=id;shareId='';rd('rdShareUrl870').value='';
 rd('rdShareConsent870').checked=false;
 rd('rdShareDelivery870').checked=false;
 message('Confirm explicit customer permission before generating a private quote link.');
 try{await refresh();}catch(e){message(e.message,true);}
}
async function issue(){
 if(busy||!draftId)return;
 busy=true;rd('rdCreateShare870').disabled=true;
 try{
  const out=await request('POST',{action:'issue',
   confirm_customer_quote_sharing:rd('rdShareConsent870').checked,
   confirm_customer_receive_link:rd('rdShareDelivery870').checked,
   package_code:rd('rdSharePackage870').value,
   vehicle_size:rd('rdShareSize870').value});
  rd('rdShareUrl870').value=out.share_url;
  message('Link created; no message was sent automatically. Copy it and share only through the agreed channel. Estimate '+cash(out.quote_cad)+'.');
  await refresh();
  window.dispatchEvent(new CustomEvent('rosie:roadside-share-changed',{detail:{draft_id:draftId}}));
 }catch(e){message(e.message,true);rd('rdCreateShare870').disabled=false;}
 finally{busy=false;}
}
async function copy(){
 const value=rd('rdShareUrl870').value;
 if(!value){message('No fresh link in this tab. Revoke the old link and issue a new one if needed.',true);return;}
 try{await navigator.clipboard.writeText(value);message('Private one-link quote copied. Send it only with customer permission.');}
 catch{rd('rdShareUrl870').focus();rd('rdShareUrl870').select();message('Clipboard unavailable. Copy the selected link manually.',true);}
}
async function revoke(){
 if(busy||!shareId||!draftId)return;
 if(!confirm('Revoke this quote link immediately? Any customer holding it will need a new link.'))return;
 busy=true;rd('rdRevokeShare870').disabled=true;
 try{await request('POST',{action:'revoke',share_id:shareId});
  rd('rdShareUrl870').value='';shareId='';
  message('Link revoked. Its token no longer grants quote access.');
  await refresh();
  window.dispatchEvent(new CustomEvent('rosie:roadside-share-changed',{detail:{draft_id:draftId}}));
 }catch(e){message(e.message,true);}
 finally{busy=false;}
}
async function reconcile(){
 if(busy||!draftId)return;
 busy=true;rd('rdReconcileDeposit870').disabled=true;
 try{const r=await request('POST',{action:'reconcile'});
  showDeposit(r.deposit);
  message(r.deposit?.verified?
   'Provider reconciliation passed for the original deposit. Check refunds before issuing a net-paid statement.':
   'Deposit is still unverified or pending; no paid status was written.',!r.deposit?.verified);
 }catch(e){message(e.message,true);}
 finally{busy=false;}
}
function boot(){
 if(!rd('rdCreateShare870'))return;
 rd('rdCreateShare870').addEventListener('click',issue);
 rd('rdCopyShare870').addEventListener('click',copy);
 rd('rdRevokeShare870').addEventListener('click',revoke);
 rd('rdReconcileDeposit870').addEventListener('click',reconcile);
 window.addEventListener('rosie:intake-selected',e=>choose(e.detail?.id||''));
 window.addEventListener('rosie:roadside-consent-withdrawn',()=>{
  rd('rdShareUrl870').value='';shareId='';
  refresh().catch(e=>message(e.message,true));
 });
 if(rd('rdIntakeId')?.value)choose(rd('rdIntakeId').value);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);
else boot();
