// Rosie 920 Admin evidence intake: local text-only rendering, no auto-post or restart.
const $=id=>document.getElementById(id),endpoint='/api/admin/sysop_920';
const put=(id,value)=>{$(id).textContent=typeof value==='string'?value:JSON.stringify(value,null,2)};
async function req(body){
 try{const response=await fetch(endpoint,{credentials:'same-origin',cache:'no-store',...(body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{})});
 return {http:response.status,...await response.json()};}catch{return {ok:false,error:'ORIGINAL_PRIVATE_SERVICE_UNAVAILABLE'}}}
async function refresh(){
 const d=await req();if(!d.ok){put('overview',{state:'HOLD',detail:d.error||d.http});return;}
 $('overview').textContent=(d.receiverAckReviewCount||0)+' original ACK reviews · '+(d.ledgerReadbackReviewCount||0)+' independent signed ledger reviews · '+(d.hostWitnessReviewCount||0)+' original-host reports · '+(d.ownerFieldReportCount||0)+' owner reports. True receiver transport, seven-source CONNECTED and physical Windows recovery: HOLD.';
 $('receivers').replaceChildren();
 for(const r of d.receiverBreakdown||[]){
  const tr=document.createElement('tr');
  for(const v of [r.receiverId,d.receiverLedgerPinsEnrolled?.[r.receiverId]?'Public signer enrolled':'Not independently enrolled',r.ackReviews,r.independentLedgerReviews]){
   const td=document.createElement('td');td.textContent=String(v);tr.append(td);}
  $('receivers').append(tr);
 }
 put('ownerStatus',{twoOwnerPublicRosterEnrolled:!!d.ownerPinRosterComplete,currentAdminSignerEnrolled:!!d.ownerSessionPinEnrolled,signedTwoOwnerReviewCases:d.twoOwnerReviewCount,physicalRecoveryCertified:false});
 put('ceremonies',(d.ceremonies||[]).length?d.ceremonies:'No original supervised preflight recorded.');
 put('hostReviews',(d.recentHostReviews||[]).length?d.recentHostReviews:'No original host review. A reboot cannot be certified.');
}
async function signed(id,resultId,action){
 let envelope;try{envelope=JSON.parse($(id).value);if(!envelope||typeof envelope!=='object'||!envelope.payload||!envelope.signature)throw Error('bad');}
 catch{put(resultId,'Provide an original properly signed aggregate-only JSON envelope. Nothing saved.');return;}
 if(!confirm('Record this as an immutable ORIGINAL EVIDENCE REVIEW only? No physical reboot, receiver CONNECTED or automatic approval.'))return;
 const v=await req({action,envelope});put(resultId,v);if(v.ok)await refresh();
}
$('refresh').addEventListener('click',refresh);
$('admitLedger').addEventListener('click',()=>signed('ledgerEnvelope','ledgerResult','review_receiver_ledger'));
$('admitOwner').addEventListener('click',()=>signed('ownerEnvelope','ownerResult','record_owner_witness'));
$('openPreflight').addEventListener('click',async()=>{
 const hostId=$('hostId').value.trim();
 if(!/^[A-Za-z0-9_-]{6,100}$/.test(hostId)){put('preflightResult','Enter the exact independently pinned original-host identifier.');return;}
 if(!confirm('Open a 45-minute BEFORE-REBOOT evidence ceremony? This does NOT perform a reboot or certify one.'))return;
 const r=await req({action:'open_preflight',hostId});put('preflightResult',r);if(r.ok)await refresh();
});
