// Rosie 884: bounded, signed original step-receipt retention and owner-closure decisions.
// GitHub issue comments are amendable; hashes/signatures provide tamper evidence, not WORM.
import {parseExecutionReceipt883,verifyExecutionReceipt883,digest883,repo883}
 from './roadside-custody-v883.js';
export const retentionTitle884='[Rosie 884] Signed scheduler receipt retention checkpoints';
export const driftTitle884='[Rosie 884] Original execution drift and renewal exception review';
const hex=s=>typeof s==='string'&&/^[a-f0-9]{64}$/.test(s);
const stamp=s=>typeof s==='string'&&Number.isFinite(Date.parse(s));
const b64=s=>typeof s==='string'&&/^[A-Za-z0-9_-]{86}$/.test(s);
const validId=n=>Number.isSafeInteger(n)&&n>0;
const decode=s=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
export const marker884=p=>'<!-- rosie884-retention:'+p.run_id+':'+p.last_comment_id+' -->';
export function retentionComment884(payload,signature){
 return marker884(payload)+'\n'+JSON.stringify({payload,signature_ed25519:signature})+
 '\n\nSigned bounded GitHub receipt checkpoint, not WORM retention, a complete lifetime archive, a provider event, or human owner approval.';
}
export function parseRetention884(body){
 if(typeof body!=='string'||body.length>3200)return null;
 const m=body.match(/^<!-- rosie884-retention:[^\n]+ -->\n(\{[^\n]+\})\n\n/);
 if(!m)return null;
 try{
  const item=JSON.parse(m[1]);
  return item?.payload&&body===retentionComment884(item.payload,item.signature_ed25519)?item:null;
 }catch{return null;}
}
export async function verifyRetention884(body,pin,now=Date.now()){
 const it=parseRetention884(body),p=it?.payload;
 if(!p||p.schema!=='rosie884-scheduler-retention-v1'||p.repository!==repo883||
  !/^[1-9][0-9]{0,18}$/.test(p.run_id||'')||
  !validId(p.source_issue_number)||!validId(p.source_comment_count)||
  !validId(p.first_comment_id)||!validId(p.last_comment_id)||
  p.last_comment_id<p.first_comment_id||!validId(p.verified_receipts)||
  p.verified_receipts>100||p.verified_receipts>p.source_comment_count||
  !hex(p.window_sha256)||!(p.previous_checkpoint_sha256===null||hex(p.previous_checkpoint_sha256))||
  !stamp(p.recorded_at)||Date.parse(p.recorded_at)>now+300000||
  p.no_immutable_retention_claim!==true||p.no_vendor_or_financial_claim!==true||
  !b64(it.signature_ed25519)||pin?.kty!=='OKP'||pin?.crv!=='Ed25519'||
  !/^[A-Za-z0-9_-]{43}$/.test(pin.x||''))return false;
 try{
  const k=await crypto.subtle.importKey('jwk',pin,{name:'Ed25519'},false,['verify']);
  return await crypto.subtle.verify('Ed25519',k,decode(it.signature_ed25519),
   new TextEncoder().encode(JSON.stringify(p)));
 }catch{return false;}
}
// A cursor must occur in the bounded original source window: never skip uncovered entries.
export async function sourceWindow884(comments,pin,{sourceIssue,sourceCount,previousLastId=null,
 previousSourceCount=null,now=Date.now()}={}){
 if(!validId(sourceIssue)||!validId(sourceCount)||!Array.isArray(comments)||
  comments.length<1||comments.length>100||
  (previousLastId!==null&&!validId(previousLastId))||
  (previousLastId!==null&&(!validId(previousSourceCount)||
   previousSourceCount>=sourceCount)))
  throw Error('ORIGINAL_LEDGER_COVERAGE_HOLD');
 const sorted=[...comments].sort((a,b)=>a.id-b.id);
 const unique=new Set(),rows=[];
 for(const c of sorted){
  if(!validId(c?.id)||unique.has(c.id)||c.user?.login!=='github-actions[bot]'||
   !await verifyExecutionReceipt883(c.body,pin,now))
   throw Error('ORIGINAL_SIGNED_RECEIPT_INVALID_HOLD');
  unique.add(c.id);
  const p=parseExecutionReceipt883(c.body).payload;
  rows.push({id:c.id,mode:p.mode,run_id:p.run_id,run_attempt:p.run_attempt,
   outcome:p.outcome,recorded_at:p.recorded_at,head_sha:p.head_sha,event:p.event,
   body_sha256:await digest883(c.body)});
 }
 if(sourceCount<sorted.length)throw Error('SOURCE_COMMENT_COUNT_INCONSISTENT_HOLD');
 if(previousLastId===null){
  if(sourceCount!==sorted.length)throw Error('UNATTESTED_PREVIOUS_HISTORY_HOLD');
 }else{
  const found=rows.findIndex(x=>x.id===previousLastId);
  if(found<0)throw Error('SOURCE_RETENTION_CURSOR_GAP_HOLD');
  rows.splice(0,found+1);
  if(rows.length!==sourceCount-previousSourceCount)
   throw Error('RETENTION_SOURCE_COUNT_GAP_HOLD');
  if(!rows.length)throw Error('NO_NEW_SIGNED_RECEIPTS_HOLD');
 }
 if(!rows.length)throw Error('NO_ORIGINAL_SIGNED_RECEIPTS_HOLD');
 const fingerprint=await digest883(JSON.stringify(rows.map(x=>[x.id,x.body_sha256])));
 return {source_issue_number:sourceIssue,source_comment_count:sourceCount,
  first_comment_id:rows[0].id,last_comment_id:rows[rows.length-1].id,
  verified_receipts:rows.length,window_sha256:fingerprint,rows};
}
export function assessExecutionDrift884(rows,runs,{now=Date.now()}={}){
 if(!Array.isArray(rows)||rows.length<1||!Array.isArray(runs))
  return {state:'SIGNED_EXECUTION_COVERAGE_HOLD',reason:'NO_ORIGINAL_RECEIPTS'};
 const modes=['watch','anchor'],result={};
 let sawRisk=false;
 for(const mode of modes){
  const matching=rows.filter(r=>r.mode===mode).sort((a,b)=>
   Date.parse(b.recorded_at)-Date.parse(a.recorded_at));
  const latest=matching[0],scheduled=matching.find(r=>r.event==='schedule');
  if(!latest){result[mode]={state:'MISSING_SIGNED_MODE_HOLD'};sawRisk=true;continue;}
  const run=runs.find(x=>String(x?.id)===latest.run_id&&
   x.run_attempt===latest.run_attempt&&x.head_sha===latest.head_sha&&
   x.event===latest.event&&x.head_branch==='main');
  const age=now-Date.parse(latest.recorded_at);
  const ok=run?.status==='completed'&&run.conclusion==='success'&&
   latest.outcome==='VERIFY_STEP_SUCCESS'&&
   age>=-300000&&age<=4*3600000&&!!scheduled&&
   now-Date.parse(scheduled.recorded_at)<=4*3600000;
  result[mode]={state:ok?'LATEST_SIGNED_RUN_VERIFIED':'SCHEDULER_EXECUTION_DRIFT_HOLD',
   run_id:latest.run_id,run_attempt:latest.run_attempt,
   step_outcome:latest.outcome,workflow_conclusion:run?.conclusion||'UNVERIFIED',
   recorded_at:latest.recorded_at,
   scheduled_recent:!!scheduled&&now-Date.parse(scheduled.recorded_at)<=4*3600000};
  if(!ok)sawRisk=true;
 }
 const priorFailure=rows.some(r=>r.outcome==='VERIFY_STEP_HOLD'&&
  now-Date.parse(r.recorded_at)<=4*3600000);
 if(priorFailure)sawRisk=true;
 return {state:sawRisk?'ORIGINAL_SCHEDULER_DRIFT_HOLD':'ORIGINAL_EXECUTION_WINDOW_VERIFIED',
  watch:result.watch,anchor:result.anchor,recent_failure:priorFailure,
  no_live_provider_claim:true};
}
export async function closureDecision884({retentionBody,pin,drift,ownerAck,anchors,
 originalReceiptCount,approvalComments,now=Date.now()}={}){
 if(!await verifyRetention884(retentionBody,pin,now))
  return {state:'RETENTION_SIGNATURE_HOLD',close:false};
 const fingerprint=await digest883(retentionBody);
 const p=parseRetention884(retentionBody).payload;
 if(drift?.state!=='ORIGINAL_EXECUTION_WINDOW_VERIFIED'||
  ownerAck?.state!=='OWNER_ACK_CURRENT'||
  anchors?.state!=='EXACT_EXTERNAL_ANCHORS_RECONCILED'||
  !validId(originalReceiptCount)||
  originalReceiptCount!==anchors.original_receipts||
  !Array.isArray(approvalComments)||approvalComments.length>100)
  return {state:'ORIGINAL_RENEWAL_EVIDENCE_HOLD',close:false,fingerprint};
 const approvals=approvalComments.filter(c=>c?.user?.login==='RosevearCreations'&&
  c.body==='ROSIE884-CLOSE: '+fingerprint&&stamp(c.created_at)&&
  Date.parse(c.created_at)>=Date.parse(p.recorded_at)&&
  Date.parse(c.created_at)<=now&&now-Date.parse(c.created_at)<=24*3600000);
 if(approvals.length!==1)
  return {state:approvals.length?'OWNER_APPROVAL_DUPLICATE_HOLD':'OWNER_APPROVAL_MISSING_HOLD',
   close:false,fingerprint};
 return {state:'OWNER_GATED_DRIFT_EXCEPTION_CLOSE_APPROVED',close:true,fingerprint,
  approved_at:approvals[0].created_at};
}
