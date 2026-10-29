import {reviewHoldSnapshotProvenance,validateNonsecretReviewPacket}
  from './admin-gift-hold-provenance-v700.js';
const el=id=>document.getElementById(id);
let packet=null;
function status(message,ok=false){const node=el('review700GiftResult');
  node.textContent=message;node.dataset.state=ok?'ok':'error';}
async function review(){const file=el('review700GiftFile')?.files?.[0];
  packet=null;el('review700GiftDownload').disabled=true;
  if(!file||file.size<80||file.size>128000){status('Choose one bounded local Build 699 owner snapshot JSON.');return;}
  const button=el('review700GiftReview');button.disabled=true;
  try{packet=await reviewHoldSnapshotProvenance(JSON.parse(await file.text()));
    validateNonsecretReviewPacket(packet);
    el('review700GiftDownload').disabled=false;
    status(`Snapshot self-integrity matched; ${packet.recent_case_count} bounded HOLD entries; `+
      `capture ${packet.snapshot_capture}; freshness ${packet.freshness_status}. `+
      'Original capture/witness authenticity NOT_VERIFIED. Manual HOLD/no-resend remains. ' +
      'The optional non-secret packet only requests human review; it is NOT a receipt.',true);
  }catch(e){status(`${e.message}. Original case HOLD remains.`);}
  finally{button.disabled=false;el('review700GiftFile').value='';}}
function download(){if(!packet)return;
  const blob=new Blob([JSON.stringify(packet,null,2)+'\n'],{type:'application/json'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download='rosie-gift-hold-provenance-review-request.json';a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  status('Local non-secret request exported. Independently verify origin/custody outside GitHub before trusting any history; no delivery authorized.',true);}
function init(){el('review700GiftReview')?.addEventListener('click',review);
  el('review700GiftDownload')?.addEventListener('click',download);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
