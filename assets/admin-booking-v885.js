// Rosie 885: read-only owner dashboard, no automatic GitHub owner comment, sign-off or incident closure.
const n885=id=>document.getElementById(id);let busy885=false,command885='';
const display885=(id,message,hold=false)=>{
 const x=n885(id);if(!x)return;x.textContent=message;x.className='notice mini'+(hold?' error':'');
};
async function inspect885(){
 if(busy885)return;busy885=true;command885='';
 const copy=n885('rd885CopyRenew');if(copy)copy.disabled=true;
 for(const id of ['rd885Chain','rd885Horizons','rd885Renewal'])
  display885(id,'Reading original signed GitHub evidence…');
 try{
  const r=await fetch('/api/admin/roadside_independent_audit_v885',{
   method:'GET',credentials:'include',cache:'no-store',referrerPolicy:'no-referrer'});
  const data=await r.json().catch(()=>({}));
  if(!r.ok||data.ok!==true)throw Error(data.state||'Independent source HOLD');
  const audit=data.independent_audit||{},sla=audit.sla||{},renew=data.owner_renewal||{};
  display885('rd885Chain',[
   'Independent chain: '+(audit.state||'HOLD'),
   'Original signed step receipts: '+(audit.observed_original_receipts??0),
   'Verified original checkpoints: '+(audit.observed_signed_checkpoints??0),
   'Snapshot time: '+(audit.recorded_at||'UNKNOWN'),
   'Current independent readback: '+!!audit.verified_original_readback,
   'No WORM or lifetime-retention guarantee'
  ].join(' · '),!audit.verified_original_readback);
  display885('rd885Horizons',[
   '4-hour scheduler evidence: '+(sla['4h']||'HOLD'),
   '24-hour: '+(sla['24h']||'HOLD'),
   '7-day: '+(sla['7d']||'HOLD'),
   '30-day: '+(sla['30d']||'HOLD'),
   'An immature horizon is not reported as a pass',
   'No original vendor delivery is inferred'
  ].join(' · '),['4h','24h'].some(h=>sla[h]!=='VERIFIED'));
  display885('rd885Renewal',[
   'Owner closure renewal: '+(renew.state||'HOLD'),
   'Last signed renewal: '+(renew.renewed_at||'NONE'),
   'Renewal due: '+(renew.renewal_due_at||'NOT VERIFIED'),
   'Original owner must comment and dispatch manually',
   'This does not close original issuer, finance or customer incidents'
  ].join(' · '),renew.state!=='SIGNED_OWNER_RENEWAL_CURRENT');
  const candidate=renew.owner_comment_command;
  if(typeof candidate==='string'&&
   /^ROSIE885-RENEW: [a-f0-9]{64}:[a-f0-9]{64}:(GENESIS|[a-f0-9]{64})$/.test(candidate)){
   command885=candidate;if(copy)copy.disabled=false;
  }
  for(const [id,url] of [['rd885AuditIssue',data.links?.audit],
   ['rd885RenewalIssue',data.links?.owner_renewals],
   ['rd885DriftIssue',data.links?.original_drift_issue]]){
   const element=n885(id);if(!element)continue;
   if(typeof url==='string'&&
    /^https:\/\/github\.com\/RosevearCreations\/rosiedazzlers\/issues\/[0-9]+$/.test(url)){
    element.href=url;element.hidden=false;
   }else element.hidden=true;
  }
 }catch(e){
  display885('rd885Chain','INDEPENDENT CHAIN HOLD — '+e.message,true);
  display885('rd885Horizons','SCHEDULER SLA HORIZONS HOLD — original source evidence unavailable',true);
  display885('rd885Renewal','OWNER CLOSURE RECEIPT RENEWAL HOLD — no owner action inferred',true);
 }finally{busy885=false;}
}
async function copy885(){
 if(!command885)return;
 try{await navigator.clipboard.writeText(command885);
  display885('rd885CopyStatus','Owner renewal candidate copied. No comment was submitted and no closure was granted.');
 }catch{display885('rd885CopyStatus','Clipboard unavailable; no approval submitted.',true);}
}
function initialize885(){
 n885('rd885Inspect')?.addEventListener('click',inspect885);
 n885('rd885CopyRenew')?.addEventListener('click',copy885);
}
if(document.readyState==='loading')
 document.addEventListener('DOMContentLoaded',initialize885);
else initialize885();
