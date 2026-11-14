#!/usr/bin/env node
// Rosie 885 scheduled independent verification of every original bounded 883 step receipt
// and 884 retention checkpoint, plus 4h/24h/7d/30d evidence-backed SLA horizons.
// Missing original issuer/source/scheduler evidence stays HOLD, not synthetic GREEN.
import {createPrivateKey,createPublicKey,sign} from 'node:crypto';
import {github881,originalIssue881,repo881} from './build881_owner_issue_client.mjs';
import {ledgerTitle883} from '../functions/api/_lib/roadside-custody-v883.js';
import {retentionTitle884} from '../functions/api/_lib/roadside-retention-v884.js';
import {auditRetentionChain885,monitorSchedulerSla885,auditTitle885,
 auditComment885,verifyAudit885}
 from '../functions/api/_lib/roadside-audit-v885.js';
const source='https://rosiedazzlers.ca/api/roadside_anchor_candidates_v881';
const checkRunContext885=()=> {
 if(process.env.GITHUB_REPOSITORY!==repo881||
  process.env.GITHUB_REF!=='refs/heads/main'||
  !['schedule','workflow_dispatch'].includes(process.env.GITHUB_EVENT_NAME)||
  !/^[1-9][0-9]{0,18}$/.test(process.env.GITHUB_RUN_ID||''))
  throw Error('GITHUB_ORIGINAL_AUDIT_AUTHORITY_HOLD');
};
export async function allOriginalComments885(issue,{limit=2000}={}){
 if(!Number.isSafeInteger(issue?.number)||issue.number<=0||
  !Number.isSafeInteger(issue.comments)||issue.comments<0||
  issue.comments>limit)throw Error('ORIGINAL_COMPLETE_COMMENT_INVENTORY_HOLD');
 const all=[];
 const pages=Math.max(1,Math.ceil(issue.comments/100));
 for(let page=1;page<=pages;page++){
  const rows=await github881('/issues/'+issue.number+'/comments?per_page=100&page='+page);
  if(!Array.isArray(rows)||rows.length>100)throw Error('ORIGINAL_COMMENT_PAGE_HOLD');
  all.push(...rows);
 }
 if(all.length!==issue.comments)throw Error('ORIGINAL_COMMENT_COUNT_RACE_HOLD');
 return all;
}
export async function originalScheduleRuns885(now=Date.now()){
 const runs=[];let complete=false;
 for(let page=1;page<=5;page++){
  const response=await github881('/actions/workflows/rosie882-signed-enrollment-watch.yml/runs?event=schedule&branch=main&per_page=100&page='+page);
  if(!Array.isArray(response?.workflow_runs))throw Error('ORIGINAL_WORKFLOW_RUN_INVENTORY_HOLD');
  const fetched=response.workflow_runs;
  for(const r of fetched){
   if(r?.repository?.full_name!==repo881||
    typeof r.path!=='string'||!r.path.split('@')[0].endsWith('/.github/workflows/rosie882-signed-enrollment-watch.yml'))
    throw Error('ORIGINAL_WORKFLOW_REPOSITORY_PROVENANCE_HOLD');
   if(!Number.isFinite(Date.parse(r.created_at)))
    throw Error('ORIGINAL_WORKFLOW_TIMESTAMP_HOLD');
   if(now-Date.parse(r.created_at)<=30*86400000+4*3600000)runs.push(r);
  }
  if(fetched.length<100||
   fetched.some(r=>now-Date.parse(r.created_at)>30*86400000+4*3600000)){
   complete=true;break;
  }
 }
 if(!complete)throw Error('ORIGINAL_30_DAY_WORKFLOW_COVERAGE_HOLD');
 return runs;
}
async function verifiedPin885(){
 const secret=process.env.ROSIE881_ANCHOR_JOB_SECRET||'';
 let signer;try{signer=createPrivateKey({key:JSON.parse(
  process.env.ROSIE881_EXTERNAL_ANCHOR_PRIVATE_JWK||''),format:'jwk'});}
 catch{throw Error('ORIGINAL_SEPARATE_SIGNER_UNENROLLED_HOLD');}
 if(secret.length<32)throw Error('ORIGINAL_SCHEDULER_SECRET_UNENROLLED_HOLD');
 const response=await fetch(source,{method:'POST',redirect:'error',
  headers:{Authorization:'Bearer '+secret,Accept:'application/json'}});
 if(!response.ok)throw Error('ORIGINAL_CLOUDFLARE_SIGNER_PIN_READBACK_HOLD');
 const v=await response.json();
 const local=createPublicKey(signer).export({format:'jwk'});
 if(v?.ok!==true||v.build!==881||v.no_customer_identifiers!==true||
  v.no_proof_of_actual_key_change!==true||
  v.external_witness_public_jwk?.x!==local.x||
  v.external_witness_public_jwk?.kty!=='OKP'||
  v.external_witness_public_jwk?.crv!=='Ed25519')
  throw Error('ORIGINAL_PUBLIC_AND_SEPARATE_SIGNER_MISMATCH_HOLD');
 return {signer,pin:v.external_witness_public_jwk};
}
async function ownerEscalation885(state,summary){
 const detail={state,run_id:process.env.GITHUB_RUN_ID||null,...summary};
 const body='<!-- rosie885-operator-state:'+JSON.stringify(detail)+' -->\n'+
  '## Independent Retention / Multi-Horizon Scheduling Audit — Original Owner Review\n'+
  'Audit state: **'+state+'**.\n'+
  'This is original redacted GitHub and pinned-source evidence only; no simulated run, source receipt, key change, customer data, owner sign-off, or WORM claim.\n'+
  'Inspect source receipt issue, retention checkpoint issue and signed audit comments before any manual owner renewal.\n'+
  'Original operational exceptions stay HOLD until separate original source evidence exists.\n';
 const issue=await originalIssue881(auditTitle885,body);
 if(issue.body!==body)await github881('/issues/'+issue.number,'PATCH',{body});
 const readback=await github881('/issues/'+issue.number);
 if(readback.body!==body)throw Error('OWNER_AUDIT_ESCALATION_READBACK_HOLD');
 return issue;
}
export async function run885(){
 checkRunContext885();
 const {signer,pin}=await verifiedPin885();
 const [stepIssue,checkpointIssue]=await Promise.all([
  originalIssue881(ledgerTitle883),originalIssue881(retentionTitle884)]);
 const [receipts,checkpoints,runs]=await Promise.all([
  allOriginalComments885(stepIssue),allOriginalComments885(checkpointIssue),
  originalScheduleRuns885()]);
 const chain=await auditRetentionChain885({receipts,checkpoints,pin,
  sourceIssue:stepIssue.number});
 const sla=monitorSchedulerSla885(chain.source,runs);
 const payload={schema:'rosie885-original-continuity-audit-v1',repository:repo881,
  run_id:process.env.GITHUB_RUN_ID,
  chain_state:chain.state,latest_checkpoint_sha256:chain.latest_checkpoint_sha256,
  verified_checkpoints:chain.verified_checkpoints,
  original_step_receipts:chain.original_step_receipts,
  sla:sla.horizon,recorded_at:new Date().toISOString(),
  original_vendor_delivery_not_inferred:true,not_worm_or_lifetime_archive:true};
 const signature=sign(null,Buffer.from(JSON.stringify(payload)),signer).toString('base64url');
 const signed=auditComment885(payload,signature);
 if(!await verifyAudit885(signed,pin))throw Error('LOCAL_INDEPENDENT_AUDIT_SIGNATURE_HOLD');
 const state=sla.state==='SHORT_HORIZON_SLA_VERIFIED'?
  'SIGNED_CHAIN_AND_4H_24H_SLA_VERIFIED':'ORIGINAL_HORIZON_SLA_HOLD';
 const auditIssue=await ownerEscalation885(state,{receipt_count:receipts.length,
  checkpoint_count:checkpoints.length,sla:sla.horizon});
 const append=await github881('/issues/'+auditIssue.number+'/comments','POST',{body:signed});
 if(!Number.isSafeInteger(append?.id)||append.id<=0)
  throw Error('ORIGINAL_INDEPENDENT_AUDIT_WRITE_HOLD');
 const confirmed=await github881('/issues/comments/'+append.id);
 if(confirmed.body!==signed||confirmed.user?.login!=='github-actions[bot]'||
  !await verifyAudit885(confirmed.body,pin))
  throw Error('SIGNED_INDEPENDENT_AUDIT_READBACK_HOLD');
 console.log('Rosie 885 original signed independent chain: '+chain.verified_checkpoints+
  ' checkpoints; 4h='+sla.horizon['4h']+' 24h='+sla.horizon['24h']+
  ' 7d='+sla.horizon['7d']+' 30d='+sla.horizon['30d']+
  '; no original vendor delivery inferred');
 if(state!=='SIGNED_CHAIN_AND_4H_24H_SLA_VERIFIED')
  throw Error(state);
}
if(import.meta.url===new URL('file://'+process.argv[1]).href)
 run885().catch(async e=>{
  try{
   if(process.env.GITHUB_REPOSITORY===repo881&&process.env.GITHUB_REF==='refs/heads/main')
    await ownerEscalation885('ORIGINAL_INDEPENDENT_AUDIT_HOLD',
     {reason:/^[A-Z0-9_]{4,100}$/.test(e.message)?e.message:'ORIGINAL_SOURCE_VERIFICATION_HOLD'});
  }catch(x){console.error('Rosie 885 owner escalation HOLD: '+x.message);}
  console.error('Rosie 885: '+e.message);process.exitCode=1;
 });
