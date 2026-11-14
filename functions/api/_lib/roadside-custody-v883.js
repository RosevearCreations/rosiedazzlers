// Rosie 883 — signed GitHub workflow-step receipts and bounded owner readback.
// GitHub issue comments are mutable: signatures detect alteration, not WORM custody.
export const repo883='RosevearCreations/rosiedazzlers';
export const ledgerTitle883='[Rosie 883] Signed scheduler execution receipt ledger';
export const alertTitle883='[Rosie 881] Original signed native history / issuer grace owner alert';
export const anchorTitle883='[Rosie 881] Independently signed original rotation digest anchors';
export const recoveryTitle883='[Rosie 883] Original external anchor exception recovery review';
const validHex=s=>typeof s==='string'&&/^[a-f0-9]{64}$/.test(s);
const validSig=s=>typeof s==='string'&&/^[A-Za-z0-9_-]{86}$/.test(s);
const validTime=s=>typeof s==='string'&&Number.isFinite(Date.parse(s));
const keyBytes=s=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')),v=>v.charCodeAt(0));
export const digest883=async s=>Array.from(new Uint8Array(await crypto.subtle.digest(
 'SHA-256',new TextEncoder().encode(s)))).map(n=>n.toString(16).padStart(2,'0')).join('');
export const receiptMarker883=p=>'<!-- rosie883-scheduler-receipt:'+p.run_id+':'+p.mode+':'+p.run_attempt+' -->';
export function executionReceiptComment883(payload,signature){
 return receiptMarker883(payload)+'\n'+JSON.stringify({payload,signature_ed25519:signature})+
 '\n\nSigned original GitHub workflow-step outcome only; not live vendor delivery, owner approval, immutable WORM or physical key rotation.';
}
export function parseExecutionReceipt883(body){
 if(typeof body!=='string'||body.length>2500)return null;
 const match=body.match(/^(<!-- rosie883-scheduler-receipt:[^\n]+ -->)\n(\{[^\n]+\})\n\n/);
 if(!match)return null;
 try{
  const item=JSON.parse(match[2]);
  if(!item?.payload||match[1]!==receiptMarker883(item.payload)||
   body!==executionReceiptComment883(item.payload,item.signature_ed25519))return null;
  return item;
 }catch{return null;}
}
export async function verifyExecutionReceipt883(body,pin,now=Date.now()){
 const item=parseExecutionReceipt883(body),p=item?.payload;
 if(!p||p.schema!=='rosie883-scheduler-step-receipt-v1'||
  p.repository!==repo883||!['watch','anchor'].includes(p.mode)||
  !['VERIFY_STEP_SUCCESS','VERIFY_STEP_HOLD'].includes(p.outcome)||
  p.workflow!=='.github/workflows/rosie882-signed-enrollment-watch.yml'||
  !/^[1-9][0-9]{0,18}$/.test(p.run_id||'')||
  !Number.isSafeInteger(p.run_attempt)||p.run_attempt<1||p.run_attempt>1000||
  !/^[a-f0-9]{40}$/.test(p.head_sha||'')||
  p.ref!=='refs/heads/main'||!['schedule','workflow_dispatch'].includes(p.event)||
  !validTime(p.recorded_at)||Date.parse(p.recorded_at)>now+300000||
  p.no_customer_identifiers!==true||p.no_provider_or_financial_acceptance_claim!==true||
  !validSig(item.signature_ed25519))return false;
 if(pin?.kty!=='OKP'||pin.crv!=='Ed25519'||!/^[A-Za-z0-9_-]{43}$/.test(pin.x||''))return false;
 try{
  const k=await crypto.subtle.importKey('jwk',pin,{name:'Ed25519'},false,['verify']);
  return await crypto.subtle.verify('Ed25519',k,keyBytes(item.signature_ed25519),
    new TextEncoder().encode(JSON.stringify(p)));
 }catch{return false;}
}
export async function summarizeExecutionLedger883(comments,pin,{now=Date.now(),truncated=false}={}){
 if(!Array.isArray(comments)||comments.length>100)
  return {state:'LEDGER_HISTORY_UNBOUNDED_HOLD',history_truncated:true,watch:null,anchor:null};
 const latest={watch:null,anchor:null},seen=new Set();
 for(const c of comments){
  if(!c?.body?.includes('rosie883-scheduler-receipt:'))continue;
  if(!await verifyExecutionReceipt883(c.body,pin,now))
   return {state:'LEDGER_SIGNATURE_OR_FORMAT_HOLD',history_truncated:truncated,watch:null,anchor:null};
  const p=parseExecutionReceipt883(c.body).payload;
  const identity=p.run_id+':'+p.mode+':'+p.run_attempt;
  if(seen.has(identity))
   return {state:'DUPLICATE_EXECUTION_RECEIPT_HOLD',history_truncated:truncated,watch:null,anchor:null};
  seen.add(identity);
  if(!latest[p.mode]||Date.parse(p.recorded_at)>Date.parse(latest[p.mode].recorded_at))
   latest[p.mode]={run_id:p.run_id,run_attempt:p.run_attempt,
    head_sha:p.head_sha,outcome:p.outcome,recorded_at:p.recorded_at,event:p.event,
    workflow:p.workflow,ref:p.ref};
 }
 const watch=latest.watch,anchor=latest.anchor;
 const stale=x=>!x||now-Date.parse(x.recorded_at)>6*3600000;
 const state=!watch||!anchor?'SCHEDULER_RECEIPT_COVERAGE_HOLD':
  (stale(watch)||stale(anchor))?'SCHEDULER_RECEIPT_STALE_HOLD':
  (watch.outcome!=='VERIFY_STEP_SUCCESS'||anchor.outcome!=='VERIFY_STEP_SUCCESS')?
   'SCHEDULER_STEP_FAILURE_HOLD':'SIGNED_STEP_RECEIPTS_FRESH';
 return {state,history_truncated:truncated,watch,anchor,receipts_in_window:seen.size,
  not_proof_of_workflow_run_completion:true};
}
export function sourceReport883(v){
 const measures=['native_observations','original_drafts_observed','native_source_changes_review',
 'broken_native_chain_links','stale_native_observations','aged_signed_events','rotation_receipts',
 'broken_rotation_chain_links','grace_expiring_seven_days','grace_expiring_72_hours',
 'grace_expired','pin_custody_hold'];
 if(v?.ok!==true||v.build!==881||!['CRITICAL','HIGH','REVIEW','NONE'].includes(v.severity)||
  v.no_customer_identifiers!==true||v.original_provider_current_delivery_not_inferred!==true||
  v.no_financial_or_key_mutation!==true||v.alert!==(v.severity!=='NONE')||
  measures.some(k=>!Number.isSafeInteger(v[k])||v[k]<0||v[k]>60))
  throw Error('ORIGINAL_HISTORY_UNVERIFIED_HOLD');
 return {severity:v.severity,coverage_incomplete:v.coverage_incomplete===true,
  no_original_native_history:v.no_original_native_history===true,
  no_original_rotation_receipts:v.no_original_rotation_receipts===true,
  measures:Object.fromEntries(measures.map(k=>[k,v[k]]))};
}
export async function ownerRenewal883(v,issue,comments,{now=Date.now(),truncated=false}={}){
 if(v?.ok!==true)return {state:'ORIGINAL_HISTORY_UNVERIFIED_HOLD'};
 const report=sourceReport883(v);
 if(!v.alert)return {state:'NO_ACTIVE_ALERT',renewal_required:false};
 if(!issue||!Array.isArray(comments))
  return {state:'ORIGINAL_OWNER_ALERT_ISSUE_MISSING_HOLD',renewal_required:true};
 const match=typeof issue.body==='string'&&
  issue.body.match(/^<!-- rosie881-watch-state:(\{[^\n]+\}) -->/);
 if(!match)return {state:'ORIGINAL_ALERT_SNAPSHOT_MISSING_HOLD',renewal_required:true};
 let snapshot;
 try{snapshot=JSON.parse(match[1]);}catch{return {state:'ORIGINAL_ALERT_SNAPSHOT_INVALID_HOLD',renewal_required:true};}
 const fingerprint=await digest883(JSON.stringify(report));
 if(JSON.stringify(snapshot)!==JSON.stringify(report))
  return {state:'ORIGINAL_ALERT_SNAPSHOT_DRIFT_HOLD',renewal_required:true,fingerprint};
 const valid=comments.filter(c=>c?.user?.login==='RosevearCreations'&&
  c.body==='ROSIE882-ACK: '+fingerprint&&validTime(c.created_at)&&
  Date.parse(c.created_at)<=now&&now-Date.parse(c.created_at)<=7*86400000)
  .sort((a,b)=>Date.parse(b.created_at)-Date.parse(a.created_at));
 const latest=valid[0]||null;
 return {state:latest?'OWNER_ACK_CURRENT':'OWNER_ACK_RENEWAL_HOLD',
  renewal_required:!latest,fingerprint,
  acknowledged_at:latest?.created_at||null,
  renewal_due_at:latest?new Date(Date.parse(latest.created_at)+7*86400000).toISOString():null,
  coverage_incomplete:truncated,ack_command:'ROSIE882-ACK: '+fingerprint};
}
export async function classifyAnchorRecovery883(source,comments,{now=Date.now(),truncated=false}={}){
 if(source?.ok!==true||source.build!==881||source.no_customer_identifiers!==true||
  source.no_proof_of_actual_key_change!==true||
  !Array.isArray(source.receipt_digests)||source.receipt_count!==source.receipt_digests.length||
  source.receipt_count>25||source.receipt_digests.some(x=>!validHex(x))||
  source.external_witness_public_jwk?.kty!=='OKP'||
  source.external_witness_public_jwk.crv!=='Ed25519'||
  !/^[A-Za-z0-9_-]{43}$/.test(source.external_witness_public_jwk.x||''))
  return {state:'ORIGINAL_ANCHOR_SOURCE_HOLD',verified:0,missing:0,invalid:0,duplicate:0,unexpected:0};
 const all=new Set(source.receipt_digests),seen=new Set();
 if(all.size!==source.receipt_digests.length)
  return {state:'ORIGINAL_ANCHOR_DUPLICATE_SOURCE_HOLD',verified:0,missing:0,invalid:0,duplicate:0,unexpected:0};
 if(!Array.isArray(comments)||truncated||comments.length>=100)
  return {state:'ANCHOR_COMMENT_COVERAGE_HOLD',verified:0,missing:all.size,invalid:0,duplicate:0,unexpected:0};
 let invalid=0,duplicate=0,unexpected=0,verified=0;
 const pinnedDigest=new Uint8Array(await crypto.subtle.digest('SHA-256',
  new TextEncoder().encode(source.external_witness_public_jwk.x)));
 const pinnedId='ed25519-sha256:'+btoa(String.fromCharCode(...pinnedDigest))
  .replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
 let key;try{key=await crypto.subtle.importKey('jwk',source.external_witness_public_jwk,
  {name:'Ed25519'},false,['verify']);}catch{
  return {state:'ANCHOR_PIN_INVALID_HOLD',verified:0,missing:all.size,invalid:0,duplicate:0,unexpected:0};}
 for(const c of comments){
  const body=c?.body;
  if(typeof body!=='string'||!body.includes('rosie881-rotation-anchor:'))continue;
  const match=body.match(/^<!-- rosie881-rotation-anchor:([a-f0-9]{64}) -->\n(\{[^\n]+\})\n\n/);
  if(!match){invalid++;continue;}
  let item;try{item=JSON.parse(match[2]);}catch{invalid++;continue;}
  const p=item?.payload;
  if(p?.schema!=='rosie881-independent-rotation-receipt-anchor-v1'||
   !validHex(p.receipt_sha256)||p.receipt_sha256!==match[1]||
   p.anchor_public_key_id!==pinnedId||
   !validTime(p.anchored_at)||Date.parse(p.anchored_at)>now+300000||
   !validSig(item.signature_ed25519)||
   body!==match[0]+
    'Metadata-only, separate GitHub-hosted tamper-evident anchor. NOT WORM or third-party human witnessing.'){
    invalid++;continue;
  }
  let valid=false;try{
   valid=await crypto.subtle.verify('Ed25519',key,keyBytes(item.signature_ed25519),
    new TextEncoder().encode(JSON.stringify(p)));
  }catch{}
  if(!valid){invalid++;continue;}
  if(!all.has(p.receipt_sha256)){unexpected++;continue;}
  if(seen.has(p.receipt_sha256)){duplicate++;continue;}
  seen.add(p.receipt_sha256);verified++;
 }
 const missing=all.size-seen.size;
 const state=!all.size?'NO_ORIGINAL_ROTATION_RECEIPTS_HOLD':
  invalid||duplicate||unexpected||missing?'EXTERNAL_ANCHOR_EXCEPTION_HOLD':'EXACT_EXTERNAL_ANCHORS_RECONCILED';
 return {state,verified,missing,invalid,duplicate,unexpected,
  original_receipts:all.size,manual_recovery_only:true,not_worm:true};
}
