#!/usr/bin/env node
// Build 882: read-only signed enrollment, exact external anchor reconciliation and owner ACK continuity.
import {randomBytes,createPrivateKey,createPublicKey,sign,createHash} from 'node:crypto';
import {github881,originalIssue881,repo881} from './build881_owner_issue_client.mjs';
import {safeReport881} from './build881_native_drift_alert_runner.mjs';
import {keyId881,verifyAnchor881,parseAnchorComment881,anchorComment881} from './build881_independent_anchor_runner.mjs';
const root='https://rosiedazzlers.ca/api/';
const watchTitle='[Rosie 881] Original signed native history / issuer grace owner alert';
const anchorTitle='[Rosie 881] Independently signed original rotation digest anchors';
const sha=s=>createHash('sha256').update(s).digest('hex');
const hex=s=>typeof s==='string'&&/^[a-f0-9]{64}$/.test(s);
const readIssueState=body=>{
 const match=typeof body==='string'&&body.match(/^<!-- rosie881-watch-state:(\{[^\n]+\}) -->/);
 if(!match)throw Error('ORIGINAL_WATCH_SNAPSHOT_MISSING_HOLD');
 try{return JSON.parse(match[1]);}catch{throw Error('ORIGINAL_WATCH_SNAPSHOT_INVALID_HOLD');}
};
export function ownerAckState882(report,issue,comments,now=Date.now()){
 const snapshot=readIssueState(issue?.body);
 if(JSON.stringify(snapshot)!==JSON.stringify(report))
  return {state:'ORIGINAL_WATCH_SNAPSHOT_DRIFT_HOLD',fingerprint:sha(JSON.stringify(report))};
 if(!Array.isArray(comments)||comments.length>=100)
  return {state:'OWNER_COMMENT_COVERAGE_HOLD',fingerprint:sha(JSON.stringify(report))};
 const fingerprint=sha(JSON.stringify(report));
 // ACK is author-bound to the repository's original owner, exact snapshot, and <=7 days old.
 const valid=comments.filter(c=>c?.user?.login==='RosevearCreations'&&
  c.body==='ROSIE882-ACK: '+fingerprint&&Number.isFinite(Date.parse(c.created_at))&&
  Date.parse(c.created_at)<=now&&now-Date.parse(c.created_at)<=7*86400000);
 return {state:valid.length?'OWNER_ACK_READBACK_VERIFIED':'OWNER_ACK_PENDING_HOLD',
  fingerprint,matching_owner_comments:valid.length};
}
export function reconcileExternalAnchors882(d,comments){
 if(d?.ok!==true||d.build!==881||d.no_customer_identifiers!==true||
  d.no_proof_of_actual_key_change!==true||
  !Array.isArray(d.receipt_digests)||d.receipt_count!==d.receipt_digests.length||
  d.receipt_count>25||!d.external_witness_public_jwk||
  d.receipt_digests.some(s=>!hex(s)))throw Error('ORIGINAL_DIGEST_INVENTORY_HOLD');
 const digests=new Set(d.receipt_digests);
 if(digests.size!==d.receipt_digests.length)throw Error('DUPLICATE_ORIGINAL_DIGEST_HOLD');
 if(!digests.size)throw Error('NO_ORIGINAL_ROTATION_RECEIPTS_HOLD');
 if(!Array.isArray(comments)||comments.length>=100)throw Error('EXTERNAL_COMMENT_COVERAGE_HOLD');
 const seen=new Set();
 for(const c of comments){
  if(!c?.body?.includes('rosie881-rotation-anchor:'))continue;
  const item=parseAnchorComment881(c.body);
  if(!item||!verifyAnchor881(item,d.external_witness_public_jwk)||
    c.body!==anchorComment881(item.payload,item.signature_ed25519))
   throw Error('EXTERNAL_SIGNATURE_OR_READBACK_HOLD');
  const digest=item.payload.receipt_sha256;
  if(!digests.has(digest)||seen.has(digest))throw Error('UNEXPECTED_OR_DUPLICATE_EXTERNAL_ANCHOR_HOLD');
  seen.add(digest);
 }
 if(seen.size!==digests.size)throw Error('EXTERNAL_ANCHOR_GAP_HOLD');
 return {state:'EXACT_EXTERNAL_ANCHOR_READBACK_RECONCILED',count:seen.size};
}
async function source(path,token,body){
 const r=await fetch(root+path,{method:'POST',redirect:'error',
  headers:{Authorization:'Bearer '+token,Accept:'application/json',
   ...(body?{'Content-Type':'application/json'}:{})},
  ...(body?{body:JSON.stringify(body)}:{})});
 if(!r.ok)throw Error('ORIGINAL_SOURCE_HOLD: '+path+' HTTP '+r.status);
 return r.json();
}
export async function run882(){
 const mode=process.env.ROSIE882_MODE;
 if(!['watch','anchor'].includes(mode)||process.env.GITHUB_REPOSITORY!==repo881||
  !/^[1-9][0-9]{0,18}$/.test(process.env.GITHUB_RUN_ID||''))
  throw Error('EXACT_REPO_SCHEDULER_AUTHORITY_HOLD');
 const secret=process.env[mode==='watch'?'ROSIE881_OWNER_WATCH_JOB_SECRET':'ROSIE881_ANCHOR_JOB_SECRET']||'';
 const privateText=process.env.ROSIE881_EXTERNAL_ANCHOR_PRIVATE_JWK||'';
 if(secret.length<32||!privateText)throw Error('ORIGINAL_SCHEDULER_SIGNER_NOT_ENROLLED_HOLD');
 let privateJwk;try{privateJwk=JSON.parse(privateText);}catch{throw Error('SIGNER_JWK_INVALID_HOLD');}
 if(!/^[A-Za-z0-9_-]{43}$/.test(privateJwk?.d||''))throw Error('SIGNER_PRIVATE_KEY_MISSING_HOLD');
 const key=createPrivateKey({key:privateJwk,format:'jwk'});
 const proof={schema:'rosie882-scheduler-enrollment-v1',repository:repo881,mode,
  challenge:randomBytes(32).toString('base64url'),issued_at:new Date().toISOString(),
  run_id:process.env.GITHUB_RUN_ID};
 const signature_ed25519=sign(null,Buffer.from(JSON.stringify(proof)),key).toString('base64url');
 const enrolled=await source('roadside_scheduler_enrollment_v882',secret,{proof,signature_ed25519});
 if(enrolled?.ok!==true||enrolled.build!==882||enrolled.scheduler!==mode||
  enrolled.repository!==repo881||enrolled.state!=='SIGNED_ENROLLMENT_READBACK'||
  enrolled.challenge_sha256!==sha(proof.challenge)||
  enrolled.no_original_provider_delivery_claim!==true||
  enrolled.no_financial_or_issuer_mutation!==true)
  throw Error('SIGNED_ENROLLMENT_CHALLENGE_READBACK_HOLD');
 console.log('Rosie 882 '+mode+' signed enrollment proof verified (not scheduler uptime).');
 if(mode==='anchor'){
  const sourceDigests=await source('roadside_anchor_candidates_v881',secret);
  const local=createPublicKey(key).export({format:'jwk'});
  if(keyId881(sourceDigests.external_witness_public_jwk)!==keyId881(local)||
   local.x!==sourceDigests.external_witness_public_jwk.x)
   throw Error('EXTERNAL_ANCHOR_ORIGINAL_PIN_MISMATCH_HOLD');
  const issue=await originalIssue881(anchorTitle);
  const comments=await github881('/issues/'+issue.number+'/comments?per_page=100');
  const verified=reconcileExternalAnchors882(sourceDigests,comments);
  console.log('Rosie 882 '+verified.state+' count='+verified.count+
   ' (no physical key rotation or WORM claim)');
 }else{
  const v=await source('roadside_operational_watch_v881',secret);
  const report=safeReport881(v);
  if(!v.alert){console.log('Rosie 882 NO_ACTIVE_OWNER_ALERT; no live vendor receipt claim');return;}
  const issue=await originalIssue881(watchTitle);
  const comments=await github881('/issues/'+issue.number+'/comments?per_page=100');
  const state=ownerAckState882(report,issue,comments);
  console.log('Rosie 882 owner grace/history alert state='+state.state+
   ' snapshot_sha256='+state.fingerprint+
   ' (ack instruction: owner GitHub comment ROSIE882-ACK: <snapshot_sha256>)');
  if(state.state!=='OWNER_ACK_READBACK_VERIFIED')throw Error(state.state);
 }
}
if(import.meta.url===new URL('file://'+process.argv[1]).href)
 run882().catch(e=>{console.error('Rosie 882: '+e.message);process.exitCode=1;});
