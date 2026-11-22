// Rosie 919 original session only; all variable text is textContent, never HTML.
const $=id=>document.getElementById(id),api='/api/admin/sysop_919';
const show=(id,value)=>{$(id).textContent=typeof value==='string'?value:JSON.stringify(value,null,2)};
async function call(payload){
 try{const r=await fetch(api,{credentials:'same-origin',cache:'no-store',...(payload?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}:{})});
 return {http:r.status,...await r.json()};}catch{return {ok:false,error:'PRIVATE_ORIGINAL_SERVICE_UNAVAILABLE'}}}
async function refresh(){
 const r=await call();if(!r.ok){show('summary',{state:'HOLD',detail:r.error||r.http});return;}
 $('summary').textContent=(r.sourceReceiptCount||0)+' signed source observations; '+(r.verifiedReceiverReviewCount||0)+' separately signed receiver reviews; original receiver transport and host recovery: HOLD.';
 $('sources').replaceChildren();
 for(const x of r.sources||[]){
 const tr=document.createElement('tr');
 for(const v of [x.appId,x.enrolled?'Public pin enrolled':'Not enrolled',x.sourceReceipts,x.receiverAckReviews]){
 const td=document.createElement('td');td.textContent=String(v);tr.append(td);} $('sources').append(tr);}
 show('receiverPins',r.receiverPinsEnrolled);
 show('hostState',{independentPinEnrolled:r.originalHostIndependentPinEnrolled,hostReviewCount:r.hostRecoveryReviewCount,physicalRecoveryAccepted:false});
}
async function submit(textId,resultId,action){
 let envelope;try{envelope=JSON.parse($(textId).value);if(!envelope||typeof envelope!=='object')throw Error('invalid')}catch{show(resultId,'Provide the exact signed non-sensitive JSON envelope.');return;}
 if(!confirm('Verify and store an immutable signed evidence REVIEW only? No CONNECTED, physical recovery or external transport acceptance.'))return;
 const r=await call({action,envelope});show(resultId,r);if(r.ok)await refresh();
}
$('refresh').addEventListener('click',refresh);
$('submitAck').addEventListener('click',()=>submit('ack','ackResult','admit_receiver_ack'));
$('submitHost').addEventListener('click',()=>submit('host','hostResult','admit_host_witness'));
