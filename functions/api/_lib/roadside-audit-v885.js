// Rosie 885 — independent full bounded retention-chain audit, scheduler SLA horizons and
// original-owner-only renewal receipts. Tamper-evident GitHub custody is NOT WORM.
import {repo883,digest883,parseExecutionReceipt883,verifyExecutionReceipt883}
 from './roadside-custody-v883.js';
import {parseRetention884,verifyRetention884}
 from './roadside-retention-v884.js';
export const auditTitle885='[Rosie 885] Independent original retention chain and scheduler SLA audit';
export const renewalTitle885='[Rosie 885] Owner-gated closure receipt renewals';
const validHex=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
const validId=x=>Number.isSafeInteger(x)&&x>0;
const validTime=x=>typeof x==='string'&&Number.isFinite(Date.parse(x));
const validSig=x=>typeof x==='string'&&/^[A-Za-z0-9_-]{86}$/.test(x);
const decode=x=>Uint8Array.from(atob(x.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
export const auditMarker885=p=>'<!-- rosie885-independent-audit:'+p.run_id+' -->';
export const auditComment885=(p,s)=>auditMarker885(p)+'\n'+
 JSON.stringify({payload:p,signature_ed25519:s})+
 '\n\nBounded, original GitHub-only independently signed audit; not WORM, external evidence of provider delivery or owner consent.';
export function parseAudit885(body){
 if(typeof body!=='string'||body.length>3500)return null;
 const m=body.match(/^<!-- rosie885-independent-audit:[^\n]+ -->\n(\{[^\n]+\})\n\n/);
 if(!m)return null;
 try{const j=JSON.parse(m[1]);return j?.payload&&body===auditComment885(j.payload,j.signature_ed25519)?j:null;}
 catch{return null;}
}
export async function verifyAudit885(body,pin,now=Date.now()){
 const v=parseAudit885(body),p=v?.payload;
 if(!p||p.schema!=='rosie885-original-continuity-audit-v1'||p.repository!==repo883||
  !/^[1-9][0-9]{0,18}$/.test(p.run_id||'')||
  !['INDEPENDENT_RETENTION_CHAIN_VERIFIED','INDEPENDENT_RETENTION_CHAIN_HOLD'].includes(p.chain_state)||
  !validHex(p.latest_checkpoint_sha256)||!validId(p.verified_checkpoints)||
  !validId(p.original_step_receipts)||!validTime(p.recorded_at)||
  Date.parse(p.recorded_at)>now+300000||
  !p.sla||!['4h','24h','7d','30d'].every(h=>
   ['VERIFIED','INSUFFICIENT_HISTORY_HOLD','SCHEDULER_SLA_HOLD'].includes(p.sla[h]))||
  p.original_vendor_delivery_not_inferred!==true||p.not_worm_or_lifetime_archive!==true||
  !validSig(v.signature_ed25519)||pin?.kty!=='OKP'||pin.crv!=='Ed25519'||
  !/^[A-Za-z0-9_-]{43}$/.test(pin.x||''))return false;
 try{const k=await crypto.subtle.importKey('jwk',pin,{name:'Ed25519'},false,['verify']);
  return crypto.subtle.verify('Ed25519',k,decode(v.signature_ed25519),
   new TextEncoder().encode(JSON.stringify(p)));
 }catch{return false;}
}
export const renewalMarker885=p=>'<!-- rosie885-owner-renewal:'+p.owner_comment_id+' -->';
export const renewalComment885=(p,s)=>renewalMarker885(p)+'\n'+
 JSON.stringify({payload:p,signature_ed25519:s})+
 '\n\nSigned original owner-initiated renewal evidence only, not automatic provider, issuer or financial incident closure.';
export function parseRenewal885(body){
 if(typeof body!=='string'||body.length>4000)return null;
 const m=body.match(/^<!-- rosie885-owner-renewal:[^\n]+ -->\n(\{[^\n]+\})\n\n/);
 if(!m)return null;
 try{const j=JSON.parse(m[1]);return j?.payload&&body===renewalComment885(j.payload,j.signature_ed25519)?j:null;}
 catch{return null;}
}
export async function verifyRenewal885(body,pin,now=Date.now()){
 const v=parseRenewal885(body),p=v?.payload;
 if(!p||p.schema!=='rosie885-original-owner-closure-renewal-v1'||
  p.repository!==repo883||!validId(p.owner_comment_id)||!validId(p.closure_issue_number)||
  !validHex(p.checkpoint_sha256)||!validHex(p.audit_sha256)||
  !(p.previous_renewal_sha256===null||validHex(p.previous_renewal_sha256))||
  !validTime(p.recorded_at)||Date.parse(p.recorded_at)>now+300000||
  p.owner_actor!=='RosevearCreations'||p.owner_gate_verified!==true||
  p.no_original_vendor_or_financial_clearance_claim!==true||
  !validSig(v.signature_ed25519)||pin?.kty!=='OKP'||pin.crv!=='Ed25519'||
  !/^[A-Za-z0-9_-]{43}$/.test(pin.x||''))return false;
 try{const k=await crypto.subtle.importKey('jwk',pin,{name:'Ed25519'},false,['verify']);
  return crypto.subtle.verify('Ed25519',k,decode(v.signature_ed25519),
   new TextEncoder().encode(JSON.stringify(p)));
 }catch{return false;}
}
export async function auditRetentionChain885({
 receipts,checkpoints,pin,sourceIssue,now=Date.now()
}={}){
 if(!validId(sourceIssue)||!Array.isArray(receipts)||!Array.isArray(checkpoints)||
  !receipts.length||!checkpoints.length||receipts.length>2000||checkpoints.length>2000)
  throw Error('ORIGINAL_INDEPENDENT_CHAIN_COVERAGE_HOLD');
 const seenReceiptIds=new Set(),seenRuns=new Set(),source=[];
 for(const c of receipts){
  if(!validId(c?.id)||seenReceiptIds.has(c.id)||
   c.user?.login!=='github-actions[bot]'||
   !await verifyExecutionReceipt883(c.body,pin,now))
   throw Error('ORIGINAL_EXECUTION_SIGNATURE_OR_IDENTITY_HOLD');
  if(source.length&&c.id<=source.at(-1).id)throw Error('EXECUTION_COMMENT_ORDER_HOLD');
  const p=parseExecutionReceipt883(c.body).payload,k=p.run_id+':'+p.mode+':'+p.run_attempt;
  if(seenRuns.has(k))throw Error('DUPLICATE_SCHEDULER_STEP_IDENTITY_HOLD');
  seenReceiptIds.add(c.id);seenRuns.add(k);
  source.push({id:c.id,body_sha256:await digest883(c.body),
   mode:p.mode,run_id:p.run_id,run_attempt:p.run_attempt,head_sha:p.head_sha,
   event:p.event,outcome:p.outcome,recorded_at:p.recorded_at});
 }
 let previousHash=null,previousCount=0,previousId=0,previousDate=0;
 const seenCheckpointIds=new Set();
 for(const c of checkpoints){
  if(!validId(c?.id)||seenCheckpointIds.has(c.id)||
   c.user?.login!=='github-actions[bot]'||
   !await verifyRetention884(c.body,pin,now))
   throw Error('ORIGINAL_RETENTION_SIGNATURE_OR_IDENTITY_HOLD');
  const p=parseRetention884(c.body).payload;
  if(c.id<=previousId||p.source_issue_number!==sourceIssue||
   p.previous_checkpoint_sha256!==previousHash||
   p.source_comment_count<=previousCount||
   p.source_comment_count>source.length||
   p.verified_receipts!==p.source_comment_count-previousCount||
   Date.parse(p.recorded_at)<previousDate)
   throw Error('ORIGINAL_CHECKPOINT_LINK_OR_COUNT_HOLD');
  const range=source.slice(previousCount,p.source_comment_count);
  if(range.length!==p.verified_receipts||
   p.first_comment_id!==range[0]?.id||p.last_comment_id!==range.at(-1)?.id||
   p.window_sha256!==await digest883(JSON.stringify(range.map(x=>[x.id,x.body_sha256]))))
   throw Error('ORIGINAL_CHECKPOINT_SOURCE_WINDOW_MISMATCH_HOLD');
  previousHash=await digest883(c.body);previousCount=p.source_comment_count;
  previousId=c.id;previousDate=Date.parse(p.recorded_at);
  seenCheckpointIds.add(c.id);
 }
 if(previousCount!==source.length)throw Error('UNATTESTED_SOURCE_TAIL_HOLD');
 return {state:'INDEPENDENT_RETENTION_CHAIN_VERIFIED',
  latest_checkpoint_sha256:previousHash,verified_checkpoints:checkpoints.length,
  original_step_receipts:source.length,
  source,genesis_verified:true,complete_within_bounded_github_source:true,
  not_worm_or_lifetime_archive:true};
}
const HORIZONS=[['4h',4*3600000],['24h',24*3600000],
 ['7d',7*86400000],['30d',30*86400000]];
export function monitorSchedulerSla885(source,runs,{now=Date.now()}={}){
 if(!Array.isArray(source)||!Array.isArray(runs))
  throw Error('ORIGINAL_SCHEDULER_RUN_INPUT_HOLD');
 const timeRows=source.filter(x=>validTime(x?.recorded_at)&&
  ['watch','anchor'].includes(x.mode)&&x.event==='schedule'&&
  Date.parse(x.recorded_at)<=now+300000);
 const recordsByRun=new Map(),runById=new Map();
 for(const x of runs){
  if(x?.repository?.full_name!==repo883||
   !String(x.path||'').split('@')[0].endsWith('/.github/workflows/rosie882-signed-enrollment-watch.yml'))
   continue;
  runById.set(String(x.id)+':'+x.run_attempt,x);
 }
 for(const x of timeRows){
  const key=x.run_id+':'+x.run_attempt;
  const old=recordsByRun.get(key)||{times:[],modes:new Map(),run_id:x.run_id,
   run_attempt:x.run_attempt,head_sha:x.head_sha};
  old.times.push(Date.parse(x.recorded_at));
  if(old.modes.has(x.mode))old.duplicate=true;
  old.modes.set(x.mode,x.outcome);
  if(old.head_sha!==x.head_sha)old.conflictingSha=true;
  recordsByRun.set(key,old);
 }
 const complete=[];
 for(const [key,x] of recordsByRun){
  const r=runById.get(key);
  if(x.duplicate||x.conflictingSha||x.modes.size!==2||
   x.modes.get('watch')!=='VERIFY_STEP_SUCCESS'||
   x.modes.get('anchor')!=='VERIFY_STEP_SUCCESS'||
   r?.status!=='completed'||r.conclusion!=='success'||r.head_branch!=='main'||
   r.head_sha!==x.head_sha||r.event!=='schedule')continue;
  complete.push({timestamp:Math.max(...x.times),run_id:x.run_id});
 }
 complete.sort((a,b)=>a.timestamp-b.timestamp);
 const horizon={},metrics={};
 const firstAll=timeRows.length?Math.min(...timeRows.map(x=>Date.parse(x.recorded_at))):null;
 const latest=complete.length?complete.at(-1).timestamp:null;
 for(const [name,window] of HORIZONS){
  const candidate=complete.filter(x=>x.timestamp>now-window&&x.timestamp<=now+300000);
  const mature=firstAll!==null&&firstAll<=now-window;
  let largestGap=window;
  if(candidate.length){
   largestGap=Math.max(now-candidate.at(-1).timestamp,
    candidate[0].timestamp-(now-window),
    ...candidate.slice(1).map((x,i)=>x.timestamp-candidate[i].timestamp));
  }
  const expected=Math.floor(window/(2*3600000));
  const sufficient=candidate.length>=Math.max(1,expected-1)&&
   largestGap<=4*3600000&&latest!==null&&now-latest<=4*3600000;
  horizon[name]=!mature?'INSUFFICIENT_HISTORY_HOLD':
   sufficient?'VERIFIED':'SCHEDULER_SLA_HOLD';
  metrics[name]={state:horizon[name],complete_runs:candidate.length,
   expected_scheduled_runs:expected,max_gap_minutes:Math.ceil(largestGap/60000),
   history_mature:mature};
 }
 return {state:['4h','24h'].every(h=>horizon[h]==='VERIFIED')?
   'SHORT_HORIZON_SLA_VERIFIED':'ORIGINAL_SCHEDULER_SLA_HOLD',
  horizon,metrics,original_vendor_delivery_not_inferred:true};
}
export async function ownerClosureRenewalDecision885({
 auditBody,checkpointBody,pin,closureIssue,closureComments,previousCheckpointBodies,
 priorRenewalBody,renewalComments,now=Date.now()
}={}){
 if(!await verifyAudit885(auditBody,pin,now)||!await verifyRetention884(checkpointBody,pin,now))
  return {state:'ORIGINAL_AUDIT_OR_CHECKPOINT_SIGNATURE_HOLD',renew:false};
 const audit=parseAudit885(auditBody).payload;
 const cp=parseRetention884(checkpointBody).payload;
 const checkpointSha=await digest883(checkpointBody),auditSha=await digest883(auditBody);
 if(audit.chain_state!=='INDEPENDENT_RETENTION_CHAIN_VERIFIED'||
  audit.latest_checkpoint_sha256!==checkpointSha||
  audit.sla['4h']!=='VERIFIED'||audit.sla['24h']!=='VERIFIED'||
  !validId(closureIssue?.number)||closureIssue?.state!=='closed'||
  closureIssue.state_reason!=='completed'||!validTime(closureIssue.closed_at)||
  closureIssue.closed_by?.login!=='github-actions[bot]'||
  !Array.isArray(closureComments)||closureComments.length>2000||
  !Array.isArray(previousCheckpointBodies)||!previousCheckpointBodies.length||
  previousCheckpointBodies.length>2000||
  !Array.isArray(renewalComments)||renewalComments.length>2000||
  now-Date.parse(audit.recorded_at)>24*3600000)
  return {state:'ORIGINAL_OWNER_CLOSURE_SOURCE_HOLD',renew:false};
 const signedCheckpoints=new Map();
 for(const body of previousCheckpointBodies){
  if(!await verifyRetention884(body,pin,now))
   return {state:'HISTORICAL_CLOSURE_CHECKPOINT_SIGNATURE_HOLD',renew:false};
  signedCheckpoints.set(await digest883(body),parseRetention884(body).payload);
 }
 if(!signedCheckpoints.has(checkpointSha))
  return {state:'CURRENT_CHECKPOINT_NOT_IN_HISTORY_HOLD',renew:false};
 const closureValid=closureComments.some(x=>{
  if(x.user?.login!=='RosevearCreations'||
   !/^ROSIE884-CLOSE: [0-9a-f]{64}$/.test(x.body||'')||
   !validTime(x.created_at))return false;
  const cp=signedCheckpoints.get(x.body.slice('ROSIE884-CLOSE: '.length));
  return cp&&Date.parse(x.created_at)>=Date.parse(cp.recorded_at)&&
   Date.parse(x.created_at)<=Date.parse(closureIssue.closed_at)&&
   Date.parse(closureIssue.closed_at)-Date.parse(x.created_at)<=24*3600000;
 });
 if(!closureValid)return {state:'ORIGINAL_OWNER_CLOSURE_APPROVAL_HOLD',renew:false};
 let previous=null,previousTime=0;
 if(priorRenewalBody!==null&&priorRenewalBody!==undefined){
  if(!await verifyRenewal885(priorRenewalBody,pin,now))
   return {state:'PREVIOUS_OWNER_RENEWAL_SIGNATURE_HOLD',renew:false};
  previous=await digest883(priorRenewalBody);
  previousTime=Date.parse(parseRenewal885(priorRenewalBody).payload.recorded_at);
 }
 const command='ROSIE885-RENEW: '+checkpointSha+':'+auditSha+':'+(previous||'GENESIS');
 const valid=renewalComments.filter(x=>x.user?.login==='RosevearCreations'&&
  x.body===command&&validId(x.id)&&validTime(x.created_at)&&
  Date.parse(x.created_at)>Math.max(Date.parse(audit.recorded_at),previousTime)&&
  Date.parse(x.created_at)<=now&&now-Date.parse(x.created_at)<=24*3600000);
 if(valid.length!==1)
  return {state:valid.length?'DUPLICATE_OWNER_RENEWAL_APPROVAL_HOLD':
   'OWNER_RENEWAL_APPROVAL_REQUIRED_HOLD',renew:false,command};
 return {state:'OWNER_RENEWAL_CURRENT_CHECKPOINT_APPROVED',renew:true,command,
  owner_comment_id:valid[0].id,owner_created_at:valid[0].created_at,
  checkpoint_sha256:checkpointSha,audit_sha256:auditSha,previous_renewal_sha256:previous};
}
