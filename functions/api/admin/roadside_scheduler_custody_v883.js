// Rosie 883: owner-session-only, read-only original Supabase + GitHub signed evidence dashboard.
// Original source reads are service-role only. Public GitHub comments are NOT immutable.
import {requireStaffAccess,json} from '../_lib/staff-auth.js';
import {evaluateRoadsideOperational881} from '../roadside_operational_watch_v881.js';
import {readOriginalRows881} from '../_lib/roadside-watch-source-v881.js';
import {pinnedIssuerRoster878} from '../_lib/roadside-provenance-pin-v878.js';
import {validateAnchorPublic881,verifyAnchorCandidate881}
 from '../_lib/roadside-operational-v881.js';
import {repo883,ledgerTitle883,alertTitle883,anchorTitle883,
 summarizeExecutionLedger883,ownerRenewal883,classifyAnchorRecovery883}
 from '../_lib/roadside-custody-v883.js';
const h={'Cache-Control':'no-store, private','Referrer-Policy':'no-referrer',
 'X-Content-Type-Options':'nosniff'};
const root='https://api.github.com';
const issuePrefix='https://github.com/RosevearCreations/rosiedazzlers/issues/';
async function originalGithubGet883(env,path){
 if(typeof path!=='string'||!path.startsWith('/'))throw Error('GITHUB_PATH_HOLD');
 const token=env?.ROSIE883_GITHUB_READ_TOKEN||'';
 const response=await fetch(root+path,{redirect:'error',cache:'no-store',headers:{
  'User-Agent':'Rosie-Dazzlers-Private-Owner-Custody-v883',
  Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28',
  ...(token?{Authorization:'Bearer '+token}:{})}});
 if(!response.ok)throw Error('GITHUB_ORIGINAL_READBACK_HOLD');
 const result=await response.json().catch(()=>null);
 if(result===null)throw Error('GITHUB_RESPONSE_INVALID_HOLD');
 return result;
}
async function findIssue883(env,title,phrase){
 const q='repo:'+repo883+' is:issue in:title "'+phrase+'"';
 const result=await originalGithubGet883(env,'/search/issues?q='+encodeURIComponent(q)+'&per_page=30');
 if(!Array.isArray(result?.items)||result.total_count>30)
  throw Error('ORIGINAL_ISSUE_SEARCH_COVERAGE_HOLD');
 const matches=result.items.filter(x=>x?.title===title&&!x.pull_request);
 if(matches.length>1)throw Error('ORIGINAL_ISSUE_DUPLICATE_HOLD');
 const issue=matches[0]||null;
 if(issue&&(!Number.isSafeInteger(issue.number)||issue.number<1||
  !Number.isSafeInteger(issue.comments)||issue.comments<0||
  typeof issue.html_url!=='string'||!issue.html_url.startsWith(issuePrefix)))
  throw Error('ORIGINAL_ISSUE_IDENTITY_HOLD');
 return issue;
}
async function latestComments883(env,issue,{anchor=false}={}){
 if(!issue)return {comments:null,truncated:false};
 if(anchor&&issue.comments>=100)return {comments:null,truncated:true};
 const last=Math.max(1,Math.ceil(issue.comments/100));
 if(last>1000)throw Error('ORIGINAL_ISSUE_INVENTORY_UNBOUNDED_HOLD');
 const pages=!anchor&&last>1?[last-1,last]:[last];
 let result=[];
 for(const page of pages){
  const rows=await originalGithubGet883(env,'/repos/'+repo883+
   '/issues/'+issue.number+'/comments?per_page=100&page='+page);
  if(!Array.isArray(rows))throw Error('ORIGINAL_COMMENTS_UNAVAILABLE_HOLD');
  result.push(...rows);
 }
 result=result.slice(-100);
 return {comments:result,truncated:issue.comments>100};
}
async function confirmNativeWorkflow883(env,x){
 if(!x)return {state:'NO_SIGNED_STEP_RECEIPT_HOLD'};
 const run=await originalGithubGet883(env,'/repos/'+repo883+'/actions/runs/'+x.run_id);
 if(run?.id?.toString()!==x.run_id||run.run_attempt!==x.run_attempt||
  run.head_sha!==x.head_sha||run.head_branch!=='main'||run.event!==x.event||
  typeof run.path!=='string'||!run.path.split('@')[0].endsWith(x.workflow)||
  run.repository?.full_name!==repo883)
  return {state:'ORIGINAL_GITHUB_WORKFLOW_MISMATCH_HOLD',run_id:x.run_id};
 if(run.status!=='completed'||run.conclusion!=='success'||x.outcome!=='VERIFY_STEP_SUCCESS')
  return {state:'ORIGINAL_WORKFLOW_NOT_GREEN_HOLD',run_id:x.run_id,
   signed_step_outcome:x.outcome,workflow_conclusion:run.conclusion||'PENDING'};
 return {state:'ORIGINAL_GITHUB_WORKFLOW_SUCCESS_VERIFIED',run_id:x.run_id,
  signed_step_outcome:x.outcome,workflow_conclusion:run.conclusion,
  recorded_at:x.recorded_at};
}
export async function onRequestGet({request,env}){
 const auth=await requireStaffAccess({request,env,body:{},capability:'manage_bookings',
  allowLegacyAdminFallback:false});
 if(!auth.ok)return auth.response;
 if(auth.auth_mode!=='session'||auth.actor?.is_admin!==true)
  return json({ok:false,build:883,state:'ORIGINAL_OWNER_SESSION_ONLY_HOLD'},403,h);
 try{
  const [native,rotation] = await Promise.all([
   evaluateRoadsideOperational881(env),
   readOriginalRows881(env,'rosie_roadside_rotation_receipts_v880',26)]);
  if(native?.ok!==true)throw Error('ORIGINAL_NATIVE_EVIDENCE_HOLD');
  let pin;try{pin=JSON.parse(env?.ROSIE881_EXTERNAL_ANCHOR_PUBLIC_JWK||'null');}
  catch{pin=null;}
  const roster=pinnedIssuerRoster878(env?.ROSIE_CLOSURE_TRUSTED_ED25519_KEYS_JSON);
  const pinOk=validateAnchorPublic881(pin,roster);
  const originalOk=rotation.length<=25&&rotation.every(x=>verifyAnchorCandidate881(x));
  const [ledgerIssue,watchIssue,anchorIssue]=await Promise.all([
   findIssue883(env,ledgerTitle883,'Signed scheduler execution receipt ledger'),
   findIssue883(env,alertTitle883,'Original signed native history'),
   findIssue883(env,anchorTitle883,'Independently signed original rotation')]);
  const [ledgerRows,watchRows,anchorRows]=await Promise.all([
   latestComments883(env,ledgerIssue),
   latestComments883(env,watchIssue),
   latestComments883(env,anchorIssue,{anchor:true})]);
  const execution=pinOk?await summarizeExecutionLedger883(ledgerRows.comments||[],pin,
   {truncated:ledgerRows.truncated}):
   {state:'SEPARATE_SIGNER_PIN_NOT_ENROLLED_HOLD',watch:null,anchor:null};
  const ownerAck=await ownerRenewal883(native,watchIssue,watchRows.comments,
   {truncated:watchRows.truncated});
  const anchorSource={ok:pinOk&&originalOk,build:881,
   no_customer_identifiers:true,no_proof_of_actual_key_change:true,
   receipt_count:rotation.length,receipt_digests:originalOk?rotation.map(x=>x.receipt_sha256):[],
   external_witness_public_jwk:pin};
  const anchors=await classifyAnchorRecovery883(anchorSource,anchorRows.comments,
   {truncated:anchorRows.truncated});
  const nativeRuns=execution.watch&&execution.anchor?
   await Promise.all([confirmNativeWorkflow883(env,execution.watch),
    confirmNativeWorkflow883(env,execution.anchor)]):
   [{state:'NO_SIGNED_WATCH_EXECUTION_HOLD'},{state:'NO_SIGNED_ANCHOR_EXECUTION_HOLD'}];
  const runStates={watch:nativeRuns[0],anchor:nativeRuns[1]};
  const allRunGreen=nativeRuns.every(x=>x.state==='ORIGINAL_GITHUB_WORKFLOW_SUCCESS_VERIFIED');
  return json({ok:true,build:883,state:'READ_ONLY_ORIGINAL_OWNER_EVIDENCE',
   native:{severity:native.severity,alert:native.alert,
    observations:native.native_observations,rotation_receipts:native.rotation_receipts,
    grace_seven_days:native.grace_expiring_seven_days,
    grace_expired:native.grace_expired,coverage_incomplete:native.coverage_incomplete},
   scheduler:{...execution,run_states:runStates,
    execution_verified:allRunGreen&&execution.state==='SIGNED_STEP_RECEIPTS_FRESH'},
   owner_ack:ownerAck,anchors,
   links:{ledger:ledgerIssue?.html_url||null,owner_alert:watchIssue?.html_url||null,
    original_anchors:anchorIssue?.html_url||null,
    supervised_recovery_workflow:'https://github.com/'+repo883+
     '/actions/workflows/rosie883-manual-anchor-recovery.yml'},
   original_provider_live_delivery_not_inferred:true,
   no_customer_financial_or_issuer_mutation:true,
   software_production_green_not_equal_operational_acceptance:true},200,h);
 }catch{
  return json({ok:false,build:883,state:'ORIGINAL_SOURCE_OR_GITHUB_READBACK_HOLD',
   original_provider_live_delivery_not_inferred:true},503,h);
 }
}
export const onRequestOptions=()=>json({ok:false,build:883,state:'OWNER_GET_ONLY'},405,h);
