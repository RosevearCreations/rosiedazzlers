import {ageUnverifiedGiftWitnessReview} from './admin-gift-hold-witness-aging-v701.js';
const el=id=>document.getElementById(id);
async function inspect(){const file=el('review701GiftFile')?.files?.[0],button=el('review701GiftReview');
  const out=el('review701GiftResult');
  if(!file||file.size<80||file.size>128000){out.textContent='Choose one local Build 700 non-secret review packet.';return;}
  button.disabled=true;
  try{const result=ageUnverifiedGiftWitnessReview(JSON.parse(await file.text()));
    out.dataset.state='ok';
    out.textContent=`Exception aging: ${result.follow_up_classification}. `+
      `Snapshot age ${result.snapshot_age_hours}h; witness wait ${result.independent_witness_wait_hours}h; `+
      `${result.recent_case_count} bounded entries. ${result.next_specific_action} `+
      'No original witness, delivery, release or recurrence is verified. HOLD/no-resend continues.';
  }catch(e){out.dataset.state='error';out.textContent=`${e.message}; gift HOLD remains.`;}
  finally{button.disabled=false;el('review701GiftFile').value='';}}
function init(){el('review701GiftReview')?.addEventListener('click',inspect);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
