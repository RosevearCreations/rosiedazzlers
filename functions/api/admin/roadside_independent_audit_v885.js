// Rosie 885: private owner-only, read-only original signed audit and closure-renewal readback.
// No user browser can write an owner approval, sign a receipt, or clear an incident here.
import {requireStaffAccess,json} from '../_lib/staff-auth.js';
import {onRequestGet as owner884} from './roadside_scheduler_retention_v884.js';
import {repo883,digest883} from '../_lib/roadside-custody-v883.js';
import {auditTitle885,renewalTitle885,verifyAudit885,parseAudit885,
 verifyRenewal885,parseRenewal885}
 from '../_lib/roadside-audit-v885.js';
const h={'Cache-Control':'no-store, private','Referrer-Policy':'no-referrer',
 'X-Content-Type-Options':'nosniff'};
async function github885(env,path){
 if(typeof path!=='string'||!path.startsWith('/'))throw Error('GITHUB_PATH_HOLD');
 const token=env?.ROSIE883_GITHUB_READ_TOKEN||'';
 const r=await fetch('https://api.github.com'+path,{redirect:'error',cache:'no-store',
  headers:{Accept:'application/vnd.github+json',
   'X-GitHub-Api-Version':'2022-11-28','User-Agent':'Rosie-885-Private-Original-Audit',
   ...(token?{Authorization:'Bearer '+token}:{})}});
 if(!r.ok)throw Error('ORIGINAL_GITHUB_READBACK_HOLD');
 return r.json();
}
async function search885(env,title,phrase){
 const q='repo:'+repo883+' is:issue in:title "'+phrase+'"';
 const r=await github885(env,'/search/issues?q='+encodeURIComponent(q)+'&per_page=30');
 if(!Array.isArray(r?.items)||r.total_count>30)throw Error('GITHUB_ISSUE_SEARCH_COVERAGE_HOLD');
 const hit=r.items.filter(x=>x.title===title&&!x.pull_request);
 if(hit.length>1)throw Error('DUPLICATE_ORIGINAL_AUDIT_ISSUE_HOLD');
 return hit[0]||null;
}
async function latest885(env,issue){
 if(!issue)return [];
 if(!Number.isSafeInteger(issue.number)||issue.number<1||
  !Number.isSafeInteger(issue.comments)||issue.comments<0||issue.comments>500)
  throw Error('GITHUB_ORIGINAL_ISSUE_COMMENT_COVERAGE_HOLD');
 const last=Math.max(1,Math.ceil(issue.comments/100));
 const pages=last>1?[last-1,last]:[last],out=[];
 for(const p of pages){
  const rows=await github885(env,'/repos/'+repo883+'/issues/'+issue.number+
   '/comments?per_page=100&page='+p);
  if(!Array.isArray(rows))throw Error('GITHUB_ORIGINAL_COMMENT_READBACK_HOLD');
  out.push(...rows);
 }
 if(issue.comments<=100&&out.length!==issue.comments)
  throw Error('ORIGINAL_GITHUB_COMMENT_COUNT_HOLD');
 return out.slice(-100);
}
const issueLink885=s=>typeof s==='string'&&
 /^https:\/\/github\.com\/RosevearCreations\/rosiedazzlers\/issues\/[0-9]+$/.test(s)?s:null;
export async function onRequestGet({request,env}){
 const auth=await requireStaffAccess({request,env,body:{},capability:'manage_bookings',
  allowLegacyAdminFallback:false});
 if(!auth.ok)return auth.response;
 if(auth.auth_mode!=='session'||auth.actor?.is_admin!==true)
  return json({ok:false,build:885,state:'ORIGINAL_OWNER_ONLY_HOLD'},403,h);
 try{
  const originalResponse=await owner884({request,env});
  const original=await originalResponse.json().catch(()=>null);
  if(!originalResponse.ok||original?.ok!==true)throw Error('ORIGINAL_BUILD_884_SOURCE_HOLD');
  let pin;try{pin=JSON.parse(env?.ROSIE881_EXTERNAL_ANCHOR_PUBLIC_JWK||'null');}catch{}
  if(pin?.kty!=='OKP'||pin.crv!=='Ed25519')throw Error('ORIGINAL_SEPARATE_PIN_HOLD');
  const [auditIssue,renewIssue,retIssue]=await Promise.all([
   search885(env,auditTitle885,'Independent original retention chain'),
   search885(env,renewalTitle885,'Owner-gated closure receipt renewals'),
   search885(env,'[Rosie 884] Signed scheduler receipt retention checkpoints',
    'Signed scheduler receipt retention checkpoints')]);
  const [audits,renewals,checkpoints]=await Promise.all([
   latest885(env,auditIssue),latest885(env,renewIssue),latest885(env,retIssue)]);
  const auditRow=audits.at(-1),renewRow=renewals.at(-1),cpRow=checkpoints.at(-1);
  const auditOK=auditRow?.user?.login==='github-actions[bot]'&&
   await verifyAudit885(auditRow.body,pin);
  const checkpointSha=cpRow?await digest883(cpRow.body):null;
  const audit=auditOK?parseAudit885(auditRow.body).payload:null;
  const auditCurrent=auditOK&&audit.latest_checkpoint_sha256===checkpointSha&&
   Date.now()-Date.parse(audit.recorded_at)<=24*3600000&&
   original.retention?.state==='SIGNED_RETENTION_CURRENT';
  const analysis={state:auditCurrent?audit.chain_state:
   'INDEPENDENT_ORIGINAL_AUDIT_NOT_CURRENT_HOLD',
   observed_signed_checkpoints:audit?.verified_checkpoints??0,
   observed_original_receipts:audit?.original_step_receipts??0,
   sla:audit?.sla||{'4h':'INSUFFICIENT_HISTORY_HOLD',
    '24h':'INSUFFICIENT_HISTORY_HOLD','7d':'INSUFFICIENT_HISTORY_HOLD',
    '30d':'INSUFFICIENT_HISTORY_HOLD'},
   recorded_at:audit?.recorded_at||null,verified_original_readback:!!auditCurrent,
   older_coverage_not_worm:true};
  const renewed=renewRow?.user?.login==='github-actions[bot]'&&
   await verifyRenewal885(renewRow.body,pin);
  const renewal=renewed?parseRenewal885(renewRow.body).payload:null;
  const auditSha=auditRow?await digest883(auditRow.body):null;
  const matchingRenewal=renewed&&auditCurrent&&
   renewal.checkpoint_sha256===checkpointSha&&
   renewal.audit_sha256===auditSha;
  const renewedAt=matchingRenewal?Date.parse(renewal.recorded_at):null;
  const renewalDue=renewedAt?new Date(renewedAt+7*86400000).toISOString():null;
  const current=matchingRenewal&&Date.now()-renewedAt<=7*86400000;
  const prev=renewed?await digest883(renewRow.body):null;
  const canPropose=auditCurrent&&audit.sla['4h']==='VERIFIED'&&
   audit.sla['24h']==='VERIFIED'&&
   original.closure?.state!=='RETENTION_NOT_CURRENT_HOLD';
  const command=canPropose?'ROSIE885-RENEW: '+checkpointSha+':'+auditSha+':'+
   (prev||'GENESIS'):null;
  return json({ok:true,build:885,state:'READ_ONLY_ORIGINAL_OWNER_AUDIT',
   independent_audit:analysis,
   owner_renewal:{state:current?'SIGNED_OWNER_RENEWAL_CURRENT':
    'OWNER_RENEWAL_REQUIRED_HOLD',renewed_at:current?renewal.recorded_at:null,
    renewal_due_at:current?renewalDue:null,
    owner_comment_command:command,
    manual_original_owner_dispatch_required:true},
   links:{audit:issueLink885(auditIssue?.html_url),
    owner_renewals:issueLink885(renewIssue?.html_url),
    original_drift_issue:original.links?.drift||null,
    owner_renewal_workflow:'https://github.com/'+repo883+
     '/actions/workflows/rosie885-original-owner-renewal.yml'},
   original_provider_delivery_not_inferred:true,not_worm:true},200,h);
 }catch{
  return json({ok:false,build:885,state:'ORIGINAL_INDEPENDENT_AUDIT_SOURCE_HOLD',
   original_provider_delivery_not_inferred:true},503,h);
 }
}
export const onRequestOptions=()=>json({ok:false,build:885,state:'ORIGINAL_OWNER_GET_ONLY'},405,h);
