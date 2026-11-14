#!/usr/bin/env node
// Rosie 885: original owner-initiated, signed closure-renewal receipts.
// Not automatic authorization, original 884 incident closure or provider clearance.
import {createPrivateKey,createPublicKey,sign} from 'node:crypto';
import {github881,originalIssue881,repo881} from './build881_owner_issue_client.mjs';
import {originalIssue881 as originalIssue} from './build881_owner_issue_client.mjs';
import {safeReport881} from './build881_native_drift_alert_runner.mjs';
import {ownerRenewal883,classifyAnchorRecovery883,alertTitle883,anchorTitle883,digest883}
 from '../functions/api/_lib/roadside-custody-v883.js';
import {retentionTitle884,driftTitle884,verifyRetention884}
 from '../functions/api/_lib/roadside-retention-v884.js';
import {auditTitle885,renewalTitle885,verifyAudit885,parseAudit885,
 renewalComment885,verifyRenewal885,parseRenewal885,ownerClosureRenewalDecision885}
 from '../functions/api/_lib/roadside-audit-v885.js';
import {allOriginalComments885} from './build885_independent_retention_sla_audit.mjs';
const base='https://rosiedazzlers.ca/api/';
async function original885(path,secret){
 if(secret.length<32)throw Error('ORIGINAL_SOURCE_SECRET_ENROLLMENT_HOLD');
 const response=await fetch(base+path,{method:'POST',redirect:'error',
  headers:{Authorization:'Bearer '+secret,Accept:'application/json'}});
 if(!response.ok)throw Error('ORIGINAL_CLOUDFLARE_SOURCE_HOLD');
 const v=await response.json();
 if(v?.ok!==true)throw Error('ORIGINAL_CLOUDFLARE_SOURCE_INCOMPLETE_HOLD');
 return v;
}
export async function ownerRenew885(){
 if(process.env.GITHUB_REPOSITORY!==repo881||
  process.env.GITHUB_REF!=='refs/heads/main'||
  process.env.GITHUB_ACTOR!=='RosevearCreations'||
  process.env.GITHUB_EVENT_NAME!=='workflow_dispatch')
  throw Error('ORIGINAL_OWNER_MANUAL_RENEWAL_ONLY_HOLD');
 let key;try{key=createPrivateKey({key:JSON.parse(
  process.env.ROSIE881_EXTERNAL_ANCHOR_PRIVATE_JWK||''),format:'jwk'});}
 catch{throw Error('ORIGINAL_SEPARATE_RENEWAL_SIGNER_HOLD');}
 const pin=createPublicKey(key).export({format:'jwk'});
 const [watch,anchor]=await Promise.all([
  original885('roadside_operational_watch_v881',
   process.env.ROSIE881_OWNER_WATCH_JOB_SECRET||''),
  original885('roadside_anchor_candidates_v881',
   process.env.ROSIE881_ANCHOR_JOB_SECRET||'')]);
 safeReport881(watch);
 if(anchor?.build!==881||anchor.no_customer_identifiers!==true||
  anchor.no_proof_of_actual_key_change!==true||
  anchor.external_witness_public_jwk?.x!==pin.x)
  throw Error('ORIGINAL_SIGNED_PIN_MISMATCH_HOLD');
 const [ownerIssue,externalIssue,auditIssue,cpIssue,driftIssue,renewIssue]=await Promise.all([
  watch.alert?originalIssue(alertTitle883):Promise.resolve(null),
  originalIssue(anchorTitle883),originalIssue(auditTitle885),
  originalIssue(retentionTitle884),originalIssue(driftTitle884),
  originalIssue(renewalTitle885,
   'Owner-initiated manually approved independently signed closure-renewal receipts. Not WORM, provider/financial clearance or automatic original 884 incident closure.')]);
 const [ownerRows,anchorRows,auditRows,cpRows,driftRows,renewRows]=await Promise.all([
  ownerIssue?allOriginalComments885(ownerIssue):Promise.resolve([]),
  allOriginalComments885(externalIssue),allOriginalComments885(auditIssue),
  allOriginalComments885(cpIssue),allOriginalComments885(driftIssue),
  allOriginalComments885(renewIssue)]);
 const ownerAck=await ownerRenewal883(watch,ownerIssue,ownerRows);
 const anchorVerified=await classifyAnchorRecovery883(anchor,anchorRows);
 if(ownerAck.state!=='OWNER_ACK_CURRENT'||
  anchorVerified.state!=='EXACT_EXTERNAL_ANCHORS_RECONCILED'||
  anchor.receipt_count!==anchorVerified.original_receipts)
  throw Error('ORIGINAL_OWNER_ACK_OR_EXTERNAL_ANCHOR_HOLD');
 const auditBody=auditRows.at(-1)?.body,cpBody=cpRows.at(-1)?.body;
 if(!await verifyAudit885(auditBody,pin)||!await verifyRetention884(cpBody,pin))
  throw Error('ORIGINAL_CURRENT_AUDIT_OR_CHECKPOINT_HOLD');
 const originalAudit=parseAudit885(auditBody).payload;
 if(originalAudit.original_step_receipts<1||originalAudit.verified_checkpoints!==cpRows.length)
  throw Error('ORIGINAL_AUDIT_COVERAGE_MISMATCH_HOLD');
 let previous=null;
 const renewalIds=new Set();
 for(const comment of renewRows){
  if(comment.user?.login!=='github-actions[bot]'||
   !await verifyRenewal885(comment.body,pin)||
   !Number.isSafeInteger(comment.id)||comment.id<1)
   throw Error('ORIGINAL_RENEWAL_CHAIN_SIGNATURE_HOLD');
  const p=parseRenewal885(comment.body).payload;
  if(p.previous_renewal_sha256!==previous||renewalIds.has(p.owner_comment_id))
   throw Error('ORIGINAL_RENEWAL_CHAIN_OR_DUPLICATE_HOLD');
  previous=await digest883(comment.body);renewalIds.add(p.owner_comment_id);
 }
 const assessment=await ownerClosureRenewalDecision885({
  auditBody,checkpointBody:cpBody,pin,closureIssue:driftIssue,
  closureComments:driftRows,previousCheckpointBodies:cpRows.map(c=>c.body),
  priorRenewalBody:renewRows.at(-1)?.body||null,
  renewalComments:driftRows});
 if(!assessment.renew){
  console.log('Rosie 885 original owner renewal requires a fresh exact owner GitHub comment on original drift issue: '+
   String(assessment.command||'not currently eligible'));
  throw Error(assessment.state);
 }
 const payload={schema:'rosie885-original-owner-closure-renewal-v1',repository:repo881,
  owner_comment_id:assessment.owner_comment_id,closure_issue_number:driftIssue.number,
  checkpoint_sha256:assessment.checkpoint_sha256,
  audit_sha256:assessment.audit_sha256,
  previous_renewal_sha256:assessment.previous_renewal_sha256,
  owner_actor:'RosevearCreations',owner_gate_verified:true,
  recorded_at:new Date().toISOString(),
  no_original_vendor_or_financial_clearance_claim:true};
 const signature=sign(null,Buffer.from(JSON.stringify(payload)),key).toString('base64url');
 const signed=renewalComment885(payload,signature);
 if(!await verifyRenewal885(signed,pin))throw Error('LOCAL_OWNER_RENEWAL_SIGNATURE_HOLD');
 const result=await github881('/issues/'+renewIssue.number+'/comments','POST',{body:signed});
 if(!Number.isSafeInteger(result?.id)||result.id<=0)
  throw Error('ORIGINAL_SIGNED_RENEWAL_WRITE_HOLD');
 const readback=await github881('/issues/comments/'+result.id);
 if(readback.user?.login!=='github-actions[bot]'||readback.body!==signed||
  !await verifyRenewal885(readback.body,pin))
  throw Error('ORIGINAL_SIGNED_RENEWAL_READBACK_HOLD');
 console.log('Rosie 885 original owner renewal independently signed and read back; original owner comment #'+
  assessment.owner_comment_id+'; closure incident stays original-owner gated; '+
  'no vendor delivery, issuer rotation or finance approval inferred.');
}
if(import.meta.url===new URL('file://'+process.argv[1]).href)
 ownerRenew885().catch(e=>{console.error('Rosie 885 renewal: '+e.message);process.exitCode=1;});
