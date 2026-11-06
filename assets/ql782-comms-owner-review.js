import {inspectOwnerReview782,brokerReceiptReview782} from './ql782-comms-review.mjs';

const el=id=>document.getElementById(id);
let review=null;
const inputIds=['challenge782','source782','master782','sourcePin782','masterPin782'];
for(const id of inputIds)el(id).addEventListener('change',()=>{
  review=null;
  el('reviewStatus782').textContent='HOLD · Public review evidence has changed; recheck locally.';
  el('reviewResult782').textContent='Unverified after input change.';
});
async function publicJson(id){
  const file=el(id).files?.[0];
  if(!file||file.size<2||file.size>32768||!/\.json$/i.test(file.name))
    throw Error('Each of three public QL-345 JSON files must be between 2 bytes and 32 KB.');
  return JSON.parse(await file.text());
}
el('inspect782').addEventListener('click',async()=>{
  review=null;
  el('reviewStatus782').textContent='Verifying supplied public QL-345 review signatures locally…';
  el('reviewResult782').textContent='Checking signatures. No network action started.';
  try{
    const [challenge,sourceDecision,masterDecision]=await Promise.all([
      publicJson('challenge782'),publicJson('source782'),publicJson('master782')]);
    review=await inspectOwnerReview782({challenge,sourceDecision,masterDecision,
      pinnedSourceSpki:el('sourcePin782').value.trim().toLowerCase(),
      pinnedMasterSpki:el('masterPin782').value.trim().toLowerCase()});
    el('reviewResult782').textContent=JSON.stringify(review,null,2);
    el('reviewStatus782').textContent=review.ok?
      'SIGNATURE MECHANICS VALID · Entered public fingerprints match, but original issuer authentication, real owner identity, enrollment consent and all remote receipts remain HOLD.':
      `HOLD · ${review.state}. No original trust or TEST permission was established.`;
  }catch(error){
    el('reviewResult782').textContent='No trusted review output.';
    el('reviewStatus782').textContent=`HOLD · ${error.message}. Never import secret evidence here.`;
  }
});
el('receiptReview782').addEventListener('click',()=>{
  const register=brokerReceiptReview782({publicReview:review});
  const blob=new Blob([JSON.stringify(register,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const anchor=document.createElement('a');
  anchor.href=url;
  anchor.download='rosie-unsigned-comms-nine-slot-receipt-review-v782.json';
  anchor.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  el('receiptStatus782').textContent='Unsigned local nine-slot review downloaded. Two original signed GET receipts and seven original denials remain NOT RECEIVED / NOT RUN; Comms Hub DISCONNECTED / HOLD.';
});
