import {inspectCommsProvenance783} from './ql783-comms-provenance.mjs';

const el=id=>document.getElementById(id);
let currentOwnerReview=null;
let currentProvenance=null;
const clear=()=>{
  currentProvenance=null;
  el('status783').textContent='HOLD · Evidence changed. Refresh local review; source TEST remains unauthorized.';
  el('result783').textContent='Pending local read-only inspection.';
};
window.addEventListener('rosie:ql782-owner-review',event=>{
  currentOwnerReview=event.detail?.ok===true?event.detail:null;
  clear();
});
for(const id of ['ql346File783','ql347File783','ql353File783'])
  el(id).addEventListener('change',clear);
async function readSanitized(id){
  const file=el(id).files?.[0];
  if(!file||!/\.json$/i.test(file.name)||file.size<2||file.size>32768)
    throw Error('Each selected nonsecret report must be a JSON file between 2 bytes and 32 KB.');
  return JSON.parse(await file.text());
}
el('inspect783').addEventListener('click',async()=>{
  clear();
  try{
    const [ql346,ql347,ql353]=await Promise.all([
      readSanitized('ql346File783'),readSanitized('ql347File783'),readSanitized('ql353File783')]);
    currentProvenance=await inspectCommsProvenance783({ql346,ql347,ql353,
      ownerReview:currentOwnerReview});
    el('result783').textContent=JSON.stringify(currentProvenance,null,2);
    el('status783').textContent=currentProvenance.ok?
      'FORMAT/DIGEST LINKS MATCH · Original issuer identity, human owner TEST enrollment, private device receipt and Rosie source GET receipts remain UNVERIFIED. DISCONNECTED / HOLD.':
      `HOLD · ${currentProvenance.state}. No original evidence can be promoted from a copied status file.`;
  }catch(error){
    el('status783').textContent=`HOLD · ${error.message}. Never import original secrets or private heartbeat data.`;
    el('result783').textContent='No original authority or receipt accepted.';
  }
});
el('download783').addEventListener('click',()=>{
  const output={schema:'rosie.comms.ql783.original-evidence-provenance-review.v1',
    source_app_id:'rosiedazzlers',reviewed_at:new Date().toISOString(),
    local_readback:currentProvenance||{
      state:'NO_SAFELY_RECONCILED_ORIGINAL_REPORTS',ok:false},
    originalIssuerIndependentlyAuthenticated:false,
    originalOwnerEnrollmentAuthorized:false,
    originalSignedDeviceReceiptIndependentlyVerified:false,
    originalSignedSourceGetReceiptsIndependentlyVerified:false,
    sourceTestAuthorized:false,connected:false,
    networkRequests:0,sourceWrites:0,customerCommunications:false,
    unsigned:true,notAnAuthorization:true,connection:'DISCONNECTED / HOLD'};
  const url=URL.createObjectURL(new Blob([JSON.stringify(output,null,2)],
    {type:'application/json'}));
  const a=document.createElement('a');a.href=url;
  a.download='rosie-unsigned-original-issuer-custody-receipt-hold-v783.json';
  a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  el('status783').textContent='Unsigned local HOLD report downloaded. This is not an original issuer attestation, owner consent, signed receipt, or broker connectivity proof.';
});
