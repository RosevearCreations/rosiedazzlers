// Rosie 881: read-only, authenticated owner view of bounded original history alert risk.
const n881=id=>document.getElementById(id);
let pending881=false;
async function report881(){
 if(pending881)return;pending881=true;
 const result=n881('rd881OwnerStatus');
 if(result){result.textContent='Reading original evidence and deployed trust status…';result.className='notice mini';}
 try{
  const response=await fetch('/api/admin/roadside_operational_watch_v881',{
   method:'GET',credentials:'include',cache:'no-store',referrerPolicy:'no-referrer'});
  const data=await response.json().catch(()=>({}));
  if(!response.ok||data.ok!==true)throw Error(data.state||'Original server source unavailable');
  const parts=[
   'Priority: '+data.severity,
   'Original native observations: '+data.native_observations,
   'Source-chain review changes: '+data.native_source_changes_review,
   'Unreviewed grace within 7 days: '+data.grace_expiring_seven_days,
   'Grace expired: '+data.grace_expired,
   'Pin custody HOLD: '+data.pin_custody_hold,
   'Original rotation records: '+data.rotation_receipts,
   'Coverage incomplete: '+data.coverage_incomplete
  ];
  if(data.no_original_native_history)parts.push('NO ORIGINAL NATIVE HISTORY — owner evidence intake required');
  if(data.no_original_rotation_receipts)parts.push('NO ORIGINAL ROTATION RECEIPTS — no external anchors asserted');
  parts.push('This is a read-only historical source inspection; scheduler execution and GitHub anchor readback are not proven by this screen.');
  result.textContent=parts.join(' · ');
  result.className='notice mini'+(data.alert?' error':'');
 }catch(e){if(result){result.textContent='OWNER MONITOR HOLD — '+e.message;result.className='notice mini error';}}
 finally{pending881=false;}
}
function init881(){
 if(!n881('rd881Review'))return;
 n881('rd881Review').addEventListener('click',report881);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init881);
else init881();
