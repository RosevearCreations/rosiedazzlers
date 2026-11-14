// Build 883: owner-only, read-only signed scheduler receipts, ACK renewal and supervised anchor recovery.
const by883=id=>document.getElementById(id);
let currentAck883='',busy883=false;
const show883=(id,text,hold=false)=>{
 const element=by883(id);if(!element)return;
 element.textContent=text;element.className='notice mini'+(hold?' error':'');
};
const stateIsHold883=s=>/HOLD|MISSING|STALE|FAIL|PENDING|UNVERIFIED/i.test(String(s||''));
async function inspect883(){
 if(busy883)return;busy883=true;currentAck883='';
 const button=by883('rd883CopyAck');if(button)button.disabled=true;
 for(const id of ['rd883Ledger','rd883Ack','rd883Anchor'])
  show883(id,'Reading original source and signed GitHub evidence…');
 try{
  const response=await fetch('/api/admin/roadside_scheduler_custody_v883',{
   method:'GET',credentials:'include',cache:'no-store',referrerPolicy:'no-referrer'});
  const v=await response.json().catch(()=>({}));
  if(!response.ok||v.ok!==true)throw Error(v.state||'Original readback unavailable');
  const e=v.scheduler||{},rn=e.run_states||{};
  show883('rd883Ledger',[
   'Signed receipt ledger: '+(e.state||'HOLD'),
   'Current watch step: '+(e.watch?.outcome||'NO SIGNED RECEIPT'),
   'Current anchor step: '+(e.anchor?.outcome||'NO SIGNED RECEIPT'),
   'GitHub watch run: '+(rn.watch?.state||'HOLD'),
   'GitHub anchor run: '+(rn.anchor?.state||'HOLD'),
   'Original signed receipts in bounded view: '+(e.receipts_in_window??0),
   'Older history not fully checked: '+!!e.history_truncated,
   'Live original vendor delivery is not inferred'
  ].join(' · '),!e.execution_verified);
  const a=v.owner_ack||{};
  show883('rd883Ack',[
   'Original alert severity: '+(v.native?.severity||'UNKNOWN'),
   'Owner acknowledgment: '+(a.state||'HOLD'),
   'Renewal due: '+(a.renewal_due_at||'NOT VERIFIED'),
   'Latest verified acknowledgment: '+(a.acknowledged_at||'NONE'),
   'Snapshot fingerprint: '+(a.fingerprint||'NOT AVAILABLE'),
   'New owner comment required after material source changes or 7 days'
  ].join(' · '),stateIsHold883(a.state));
  if(a.ack_command&&typeof a.ack_command==='string'){
   currentAck883=a.ack_command;
   if(button)button.disabled=false;
  }
  const r=v.anchors||{};
  show883('rd883Anchor',[
   'External anchors: '+(r.state||'HOLD'),
   'Original rotation receipts: '+(r.original_receipts??0),
   'Verified: '+(r.verified??0),
   'Missing: '+(r.missing??0),
   'Invalid: '+(r.invalid??0),
   'Duplicates: '+(r.duplicate??0),
   'Unexpected: '+(r.unexpected??0),
   'Manual supervised recovery only; nothing is automatically repaired'
  ].join(' · '),r.state!=='EXACT_EXTERNAL_ANCHORS_RECONCILED');
  const issueLink=by883('rd883AckIssue');
  if(issueLink){
   const url=v.links?.owner_alert;
   if(typeof url==='string'&&/^https:\/\/github\.com\/RosevearCreations\/rosiedazzlers\/issues\/[0-9]+$/.test(url)){
    issueLink.href=url;issueLink.hidden=false;
   }else issueLink.hidden=true;
  }
 }catch(err){
  show883('rd883Ledger','SIGNED SCHEDULER RECEIPTS HOLD — '+err.message,true);
  show883('rd883Ack','OWNER ACKNOWLEDGMENT HOLD — original issue or source unavailable',true);
  show883('rd883Anchor','EXTERNAL ANCHOR RECOVERY HOLD — original readback unavailable',true);
 }finally{busy883=false;}
}
async function copy883(){
 if(!currentAck883)return;
 try{
  await navigator.clipboard.writeText(currentAck883);
  show883('rd883CopyStatus','Acknowledgment copied. This does not submit or approve it. Only the original GitHub owner can review and comment.');
 }catch{
  show883('rd883CopyStatus','Clipboard unavailable. The source fingerprint is shown above; no acknowledgment was sent.',true);
 }
}
function init883(){
 by883('rd883Inspect')?.addEventListener('click',inspect883);
 by883('rd883CopyAck')?.addEventListener('click',copy883);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init883);
else init883();
