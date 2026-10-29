import {captureHoldSnapshot,compareHoldSnapshots,validateHoldSnapshot}
  from './admin-gift-hold-snapshot-compare-v699.js';

const el=id=>document.getElementById(id);
const api=url=>window.AdminAuth?.fetchWithAuth?
  window.AdminAuth.fetchWithAuth(url,{cache:'no-store'}):
  fetch(url,{credentials:'include',cache:'no-store'});
let current=null;
function say(message,ok=false){const node=el('review699SnapshotResult');
  node.textContent=message;node.dataset.state=ok?'ok':'error';}
async function capture(){const button=el('review699Capture');button.disabled=true;current=null;
  el('review699Download').disabled=true;
  try{const r=await api('/api/admin/gift_hold_recurrence_followup');
    const data=await r.json().catch(()=>({}));if(!r.ok||!data.ok)
      throw Error(data.error||'Owner-only HOLD source unavailable');
    current=await captureHoldSnapshot(data);
    el('review699Download').disabled=false;
    say(`Captured ${current.case_count} pseudonymous HOLD cases at ${current.captured_at}. `+
      `Current source fingerprint: ${current.source_snapshot_sha256}. `+
      'No baseline is trusted until separately authenticated; this local export does not certify recurrence or resolution.',true);
  }catch(e){say(e.message+'. Manual HOLD/no-resend remains.');}
  finally{button.disabled=false;}
}
function download(){if(!current)return;
  const blob=new Blob([JSON.stringify(current,null,2)+'\n'],{type:'application/json'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download='rosie-gift-hold-owner-snapshot-'+current.captured_at.slice(0,10)+'.json';
  a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  say('Downloaded a local pseudonymous snapshot. Store it securely; it has no independent signer or custody attestation.',true);
}
async function compare(){const file=el('review699PreviousFile')?.files?.[0];
  if(!file||!current){say('Capture the current HOLD snapshot and select a previous local file first.');return;}
  if(file.size<80||file.size>128000){say('Previous snapshot file exceeds the allowed local boundary.');return;}
  const button=el('review699Compare');button.disabled=true;
  try{const raw=await file.text();const previous=await validateHoldSnapshot(JSON.parse(raw));
    const result=await compareHoldSnapshots(previous,current);
    say(`Bounded, UNVERIFIED sample comparison: ${result.unchanged_in_bounded_sample} unchanged, `+
      `${result.changed_in_bounded_sample} changed classification/phase, ${result.new_in_bounded_sample} newly visible, `+
      `${result.absent_from_current_bounded_sample} no longer visible. `+
      (result.possible_truncation?'One or both samples may be truncated. ':'')+
      'Missing is NOT resolved; changed is NOT independently confirmed recurrence. All gifts remain on HOLD; no resend, customer contact or gateway call.',false);
  }catch(e){say(`Cannot compare untrusted snapshot: ${e.message}. No HOLD was lifted.`);}
  finally{button.disabled=false;el('review699PreviousFile').value='';}
}
function init(){el('review699Capture')?.addEventListener('click',capture);
  el('review699Download')?.addEventListener('click',download);
  el('review699Compare')?.addEventListener('click',compare);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
else init();
