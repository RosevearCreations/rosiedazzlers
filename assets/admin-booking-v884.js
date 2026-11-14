// Rosie 884 owner-only original source drilldown. Read-only; no ACK/closure auto-submission.
const n884=id=>document.getElementById(id);
let command884='',busy884=false;
const write884=(id,msg,hold=false)=>{const e=n884(id);if(!e)return;
 e.textContent=msg;e.className='notice mini'+(hold?' error':'');};
async function review884(){
 if(busy884)return;busy884=true;command884='';
 if(n884('rd884CopyClose'))n884('rd884CopyClose').disabled=true;
 ['rd884Retention','rd884Drift','rd884Closure'].forEach(id=>
  write884(id,'Reading original GitHub signed source and owner gates…'));
 try{
  const r=await fetch('/api/admin/roadside_scheduler_retention_v884',{
   credentials:'include',cache:'no-store',referrerPolicy:'no-referrer'});
  const v=await r.json().catch(()=>({}));
  if(!r.ok||v.ok!==true)throw Error(v.state||'Original source unavailable');
  const retain=v.retention||{},drift=v.execution_drift||{},close=v.closure||{};
  write884('rd884Retention',[
   'Signed checkpoint: '+(retain.state||'HOLD'),
   'Verified new original receipts: '+(retain.verified_receipts??0),
   'Last source count: '+(retain.source_comment_count??'UNKNOWN'),
   'Bounded link verified: '+!!retain.chain_verified_bounded,
   'Source cursor matches: '+!!retain.cursor_matches_original,
   'Recorded: '+(retain.recorded_at||'NONE'),
   'No WORM or complete lifetime archive is asserted'
  ].join(' · '),retain.state!=='SIGNED_RETENTION_CURRENT');
  write884('rd884Drift',[
   'Original scheduling: '+(drift.state||'HOLD'),
   'Watch: '+(drift.watch?.state||'HOLD'),
   'Anchor: '+(drift.anchor?.state||'HOLD'),
   'Recent signed verification failure: '+!!drift.recent_failure,
   'Scheduled verification is not an original vendor delivery receipt'
  ].join(' · '),drift.state!=='ORIGINAL_EXECUTION_WINDOW_VERIFIED');
  write884('rd884Closure',[
   'Owner-gated renewal closure: '+(close.state||'HOLD'),
   'Approval verified: '+!!close.approved,
   'Manual workflow required: '+!!close.manual_dispatch_required,
   'Original source, issuer and finance incidents remain independent'
  ].join(' · '),!close.approved);
  if(typeof close.owner_approval_command==='string'&&
   /^ROSIE884-CLOSE: [0-9a-f]{64}$/.test(close.owner_approval_command)){
   command884=close.owner_approval_command;
   if(n884('rd884CopyClose'))n884('rd884CopyClose').disabled=false;
  }
  for(const [id,url] of [
   ['rd884DriftIssue',v.links?.drift],
   ['rd884RetentionIssue',v.links?.retention]]){
   const e=n884(id);
   if(!e)continue;
   if(typeof url==='string'&&
    /^https:\/\/github\.com\/RosevearCreations\/rosiedazzlers\/issues\/[0-9]+$/.test(url)){
    e.href=url;e.hidden=false;
   }else e.hidden=true;
  }
 }catch(err){
  write884('rd884Retention','RETENTION HOLD — '+err.message,true);
  write884('rd884Drift','ORIGINAL EXECUTION DRIFT UNKNOWN — check private evidence',true);
  write884('rd884Closure','OWNER RENEWAL CLOSURE HOLD — no decision can be inferred',true);
 }finally{busy884=false;}
}
async function copy884(){
 if(!command884)return;
 try{
  await navigator.clipboard.writeText(command884);
  write884('rd884CopyState','Original owner approval text copied. Nothing has been submitted or closed.');
 }catch{
  write884('rd884CopyState','Clipboard unavailable. No owner approval was submitted.',true);
 }
}
function init884(){
 n884('rd884Review')?.addEventListener('click',review884);
 n884('rd884CopyClose')?.addEventListener('click',copy884);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init884);
else init884();
