// Rosie 884: owner-session-only read-only retained checkpoint and closure drilldown.
// Original GitHub data is independently read back; no customer or financial mutations.
import {requireStaffAccess,json} from '../_lib/staff-auth.js';
import {pinnedIssuerRoster878} from '../_lib/roadside-provenance-pin-v878.js';
import {validateAnchorPublic881} from '../_lib/roadside-operational-v881.js';
import {onRequestGet as owner883} from './roadside_scheduler_custody_v883.js';
import {repo883,ledgerTitle883,parseExecutionReceipt883,verifyExecutionReceipt883,digest883}
 from '../_lib/roadside-custody-v883.js';
import {retentionTitle884,driftTitle884,verifyRetention884,parseRetention884,
 assessExecutionDrift884,closureDecision884}
 from '../_lib/roadside-retention-v884.js';
const headers={'Cache-Control':'no-store, private','Referrer-Policy':'no-referrer',
 'X-Content-Type-Options':'nosniff'};
async function api884(env,path){
 const token=env?.ROSIE883_GITHUB_READ_TOKEN||'';
 const r=await fetch('https://api.github.com'+path,{redirect:'error',cache:'no-store',
  headers:{Accept:'application/vnd.github+json',
   'User-Agent':'Rosie-Original-Scheduler-Custody-v884',
   'X-GitHub-Api-Version':'2022-11-28',
   ...(token?{Authorization:'Bearer '+token}:{})}});
 if(!r.ok)throw Error('GITHUB_ORIGINAL_READBACK_HOLD');
 return r.json();
}
async function issue884(env,title,phrase){
 const query='repo:'+repo883+' is:issue in:title "'+phrase+'"';
 const search=await api884(env,'/search/issues?q='+encodeURIComponent(query)+'&per_page=30');
 if(!Array.isArray(search.items)||search.total_count>30)throw Error('ISSUE_SEARCH_BOUNDARY_HOLD');
 const found=search.items.filter(x=>x.title===title&&!x.pull_request);
 if(found.length>1)throw Error('DUPLICATE_ORIGINAL_ISSUE_HOLD');
 const value=found[0]||null;
 if(value&&(!Number.isSafeInteger(value.number)||value.number<1||
  !Number.isSafeInteger(value.comments)||value.comments<0||
  !/^[0-9]+$/.test(String(value.number))))throw Error('GITHUB_ORIGINAL_ISSUE_META_HOLD');
 return value;
}
async function comments884(env,issue,{strict=false}={}){
 if(!issue)return [];
 if(strict&&issue.comments>100)throw Error('SOURCE_COMMENT_COVERAGE_HOLD');
 const last=Math.max(1,Math.ceil(issue.comments/100));
 const pages=last>1?[last-1,last]:[last],all=[];
 for(const page of pages){
  const data=await api884(env,'/repos/'+repo883+'/issues/'+issue.number+
   '/comments?per_page=100&page='+page);
  if(!Array.isArray(data))throw Error('GITHUB_ORIGINAL_COMMENTS_HOLD');
  all.push(...data);
 }
 if(strict&&all.length!==issue.comments)throw Error('COMMENT_INVENTORY_DRIFT_HOLD');
 return all.slice(-100);
}
export async function onRequestGet({request,env}){
 const auth=await requireStaffAccess({request,env,body:{},capability:'manage_bookings',
  allowLegacyAdminFallback:false});
 if(!auth.ok)return auth.response;
 if(auth.auth_mode!=='session'||auth.actor?.is_admin!==true)
  return json({ok:false,build:884,state:'OWNER_SESSION_ONLY_HOLD'},403,headers);
 try{
  const originalResponse=await owner883({request,env});
  const original=await originalResponse.json().catch(()=>null);
  if(!originalResponse.ok||original?.ok!==true)
   throw Error('ORIGINAL_OWNER_SOURCE_HOLD');
  let pin;try{pin=JSON.parse(env?.ROSIE881_EXTERNAL_ANCHOR_PUBLIC_JWK||'null');}catch{}
  const roster=pinnedIssuerRoster878(env?.ROSIE_CLOSURE_TRUSTED_ED25519_KEYS_JSON);
  if(!validateAnchorPublic881(pin,roster))throw Error('ORIGINAL_INDEPENDENT_SIGNER_PIN_HOLD');
  const [retentionIssue,ledgerIssue,driftIssue]=await Promise.all([
   issue884(env,retentionTitle884,'Signed scheduler receipt retention checkpoints'),
   issue884(env,ledgerTitle883,'Signed scheduler execution receipt ledger'),
   issue884(env,driftTitle884,'Original execution drift and renewal exception')]);
  const [retentionRows,sourceRows,driftRows]=await Promise.all([
   comments884(env,retentionIssue),comments884(env,ledgerIssue),comments884(env,driftIssue)]);
  const latest=retentionRows.at(-1);
  let retained={state:'NO_ORIGINAL_SIGNED_RETENTION_HOLD',signed:false};
  if(latest&&await verifyRetention884(latest.body,pin)){
   const p=parseRetention884(latest.body).payload;
   const previous=retentionRows.at(-2);
   const chain=previous?await verifyRetention884(previous.body,pin)&&
    p.previous_checkpoint_sha256===await digest883(previous.body):
    p.previous_checkpoint_sha256===null;
   const now=Date.now(),fresh=now-Date.parse(p.recorded_at)<=4*3600000;
   const sourceLatest=sourceRows.at(-1);
   const cursorMatches=p.source_issue_number===ledgerIssue?.number&&
    p.source_comment_count===ledgerIssue?.comments&&
    p.last_comment_id===sourceLatest?.id;
   retained={state:chain&&fresh&&cursorMatches?
    'SIGNED_RETENTION_CURRENT':'SIGNED_RETENTION_STALE_OR_CHAIN_HOLD',
    signed:true,chain_verified_bounded:!!chain,recorded_at:p.recorded_at,
    source_comment_count:p.source_comment_count,
    verified_receipts:p.verified_receipts,
    cursor_matches_original:!!cursorMatches,
    history_unbounded:!!retentionIssue&&retentionIssue.comments>100};
  }else if(latest)retained={state:'RETENTION_SIGNATURE_HOLD',signed:false};
  const signedRows=[];
  for(const c of sourceRows){
   if(c?.user?.login!=='github-actions[bot]'||
    !await verifyExecutionReceipt883(c.body,pin))
    throw Error('SIGNED_EXECUTION_SOURCE_READBACK_HOLD');
   const p=parseExecutionReceipt883(c.body).payload;
   signedRows.push({mode:p.mode,run_id:p.run_id,run_attempt:p.run_attempt,
    head_sha:p.head_sha,outcome:p.outcome,recorded_at:p.recorded_at,event:p.event});
  }
  const recent=['watch','anchor'].map(mode=>signedRows.filter(r=>r.mode===mode)
   .sort((a,b)=>Date.parse(b.recorded_at)-Date.parse(a.recorded_at))[0]).filter(Boolean);
  const runs=[];
  for(const record of recent){
   const run=await api884(env,'/repos/'+repo883+'/actions/runs/'+record.run_id);
   if(run?.repository?.full_name!==repo883||typeof run.path!=='string'||
    !run.path.split('@')[0].endsWith('/.github/workflows/rosie882-signed-enrollment-watch.yml'))
    throw Error('ORIGINAL_WORKFLOW_REPO_PATH_HOLD');
   runs.push(run);
  }
  const drift=assessExecutionDrift884(signedRows,runs);
  const noCoverage=!!ledgerIssue&&ledgerIssue.comments>100;
  if(noCoverage)drift.state='ORIGINAL_HISTORY_BOUNDED_PARTIAL_HOLD';
  const closure=latest&&retained.state==='SIGNED_RETENTION_CURRENT'?
   await closureDecision884({retentionBody:latest.body,pin,drift,
    ownerAck:original.owner_ack,anchors:original.anchors,
    originalReceiptCount:original.anchors?.original_receipts,
    approvalComments:driftRows}):
   {state:'RETENTION_NOT_CURRENT_HOLD',close:false};
  const fingerprint=retained.state==='SIGNED_RETENTION_CURRENT'?
   await digest883(latest.body):null;
  return json({ok:true,build:884,state:'ORIGINAL_OWNER_READ_ONLY',
   retention:retained,execution_drift:drift,
   closure:{state:closure.state,approved:closure.close,
    owner_approval_command:fingerprint?
     'ROSIE884-CLOSE: '+fingerprint:null,
    manual_dispatch_required:true},
   links:{retention:retentionIssue?.html_url||null,drift:driftIssue?.html_url||null,
    owner_closure_workflow:'https://github.com/'+repo883+
     '/actions/workflows/rosie884-owner-gated-closure.yml'},
   original_provider_delivery_not_inferred:true,
   no_automatic_financial_or_issuer_closure:true},200,headers);
 }catch{
  return json({ok:false,build:884,state:'ORIGINAL_RETENTION_OR_GITHUB_READBACK_HOLD',
   original_provider_delivery_not_inferred:true},503,headers);
 }
}
export const onRequestOptions=()=>json({ok:false,build:884,state:'OWNER_GET_ONLY'},405,headers);
