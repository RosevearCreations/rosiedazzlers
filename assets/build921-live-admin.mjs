// Rosie 921 original Admin workbench: zero HTML injection, public key material stays on the server.
const $=id=>document.getElementById(id),endpoint='/api/admin/sysop_921';
const put=(id,v)=>{$(id).textContent=typeof v==='string'?v:JSON.stringify(v,null,2)};
async function req(body){
 try{const response=await fetch(endpoint,{credentials:'same-origin',cache:'no-store',...(body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{})});
 return {http:response.status,...await response.json()};}catch{return {ok:false,error:'ORIGINAL_READ_ONLY_EVIDENCE_SERVICE_UNAVAILABLE'}}}
async function refresh(){
 const r=await req();
 if(!r.ok){put('overview',{state:'HOLD',error:r.error||r.http});return}
 $('overview').textContent='Original source receipts: '+r.sourceReceipts+' | Receiver ACK reviews: '+r.receiverAckReviews+' | 920 ledger reviews: '+r.independentLedgerReviews+
 ' | 921 original native API witnesses: '+r.originalNativeApiWitnesses+' | Original Windows samples: '+r.windowsReadOnlyHealthSamples+
 ' | Physical recovery and seven-source CONNECTED: HOLD.';
 put('receiverStatus',{receiverEnrollment:r.receiverStatus,originalHostSamplerEnrolled:r.originalHostHealthSamplerPinEnrolled,originalTwoOwnerPinsEnrolled:r.originalTwoOwnerRosterEnrolled,receiverNetworkDeliveryAccepted:false});
 put('fieldCases',r.fieldCases?.length?r.fieldCases:'No genuine original preflight, two-owner and physical reboot field record present.');
 put('recentNative',r.lastNativeReadbacks?.length?r.lastNativeReadbacks:'No live original receiver-native API witness.');
 put('recentHealth',r.lastHostHealthSamples?.length?r.lastHostHealthSamples:'No signed Windows original-host loopback health samples.');
 const previous=$('ledgerReview').value;
 $('ledgerReview').replaceChildren();
 const opt=document.createElement('option');opt.value='';opt.textContent='Choose an original signed ledger review';$('ledgerReview').append(opt);
 for(const x of r.originalLedgerReviewIds||[]){const o=document.createElement('option');o.value=x.ledgerReviewId;o.textContent=x.receiverId+' · '+x.ledgerReviewId;$('ledgerReview').append(o)}
 if([...$('ledgerReview').options].some(x=>x.value===previous))$('ledgerReview').value=previous;
}
$('refresh').addEventListener('click',refresh);
$('probe').addEventListener('click',async()=>{
 const ledgerReviewId=$('ledgerReview').value;
 if(!/^[a-f0-9-]{36}$/i.test(ledgerReviewId)){put('probeResult','No original 920 ledger review was selected.');return}
 if(!confirm('Run one server-approved read-only GET against the genuinely enrolled ORIGINAL receiver? No receiver modifications or CONNECTED status will occur.'))return;
 const r=await req({action:'read_original_receiver_api',ledgerReviewId});put('probeResult',r);if(r.ok)await refresh();
});
$('admit').addEventListener('click',async()=>{
 let envelope;try{envelope=JSON.parse($('hostEnvelope').value);if(!envelope||!envelope.payload||!envelope.signature)throw Error('missing')}catch{put('hostResult','Signed original Windows JSON envelope required.');return}
 if(!confirm('Retain this as immutable original Windows port-reachability evidence only, not verified service health or physical reboot certification?'))return;
 const r=await req({action:'admit_windows_health_sample',envelope});put('hostResult',r);if(r.ok)await refresh();
});
