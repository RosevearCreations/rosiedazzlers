#!/usr/bin/env node
import {appendFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

// Measured against Build 779's exact-main release: 56s queue p95, 58s
// execution p95. Thresholds allow normal runner variance but flag regressions.
export const BUDGET780=Object.freeze({queue_p95_seconds:120,
  runtime_p95_seconds:180,runtime_max_seconds:600});
const SHA=/^[a-f0-9]{40}$/i;
const terminal=new Set(['completed']);
const bad=new Set(['failure','timed_out','cancelled','action_required']);
const stamp=x=>x?Date.parse(x):NaN;
const p95=a=>a[Math.max(0,Math.ceil(.95*a.length)-1)];
const round=x=>Math.round(x*10)/10;

// A successful completed workflow can retain an obsolete, older queued check
// record when GitHub replaces a job attempt. Select the newer completed record
// ONLY when every discarded duplicate has the same check name and an earlier
// valid start time. A genuine pending, failed, missing or different-named check
// still blocks release-health measurement.
export function reconcileCompletedCheckAttempts780(linked,run){
 const groups=new Map();
 for(const check of linked){
  const key=String(check?.name||'');
  if(!groups.has(key))groups.set(key,[]);
  groups.get(key).push(check);
 }
 const accepted=[];let superseded=0;
 for(const attempts of groups.values()){
  if(attempts.length===1){accepted.push(attempts[0]);continue;}
  if(run?.status!=='completed'||run?.conclusion!=='success')
   return {ok:false,checks:linked,superseded:0};
  const passed=attempts.filter(c=>c?.status==='completed'&&c.conclusion==='success'&&
   Number.isFinite(stamp(c.started_at))&&Number.isFinite(stamp(c.completed_at)));
  if(!passed.length)return {ok:false,checks:linked,superseded:0};
  passed.sort((a,b)=>stamp(b.started_at)-stamp(a.started_at)||
    stamp(b.completed_at)-stamp(a.completed_at));
  const latest=passed[0];
  if(attempts.some(c=>c!==latest&&(
    !Number.isFinite(stamp(c.started_at))||
    stamp(c.started_at)>stamp(latest.started_at)||
    !(c.status==='completed'&&c.conclusion==='success'||
      c.status==='queued'&&c.conclusion==null)
  )))return {ok:false,checks:linked,superseded:0};
  accepted.push(latest);superseded+=attempts.length-1;
 }
 return {ok:true,checks:accepted,superseded};
}

export function evaluateCIQueue780({sha,runs,checks,branch='main',budget=BUDGET780}={}){
  const base={schema:'rosie-ci-queue-budget-v780',build:780,sha,
    branch,read_only:true,production_checks_bypassed:false,
    workflow_runs:0,measured_runs:0,pending_runs:0,
    queue_p95_seconds:null,runtime_p95_seconds:null,
    runtime_max_seconds:null,superseded_check_records:0,budget,violations:[],state:'HOLD_UNVERIFIED_CI_EVIDENCE'};
  if(!SHA.test(sha||'')||!Array.isArray(runs)||!Array.isArray(checks))return base;
  // Exclude the observer itself; otherwise its own in-progress check would
  // prevent an exact-commit snapshot from ever becoming complete.
  const relevant=runs.filter(r=>r?.head_sha===sha&&r?.head_branch===branch&&
    r?.event==='push'&&r.name!=='Release Health Dashboard & Drift Alerts');
  if(!relevant.length)return base;
  const report={...base,workflow_runs:relevant.length};
  const values=[];
  for(const run of relevant){
    if(!terminal.has(run.status)){
      report.pending_runs++;continue;
    }
    if(bad.has(run.conclusion))report.violations.push(`FAILED_WORKFLOW_RUN:${run.id}`);
    const linked=checks.filter(c=>typeof c.details_url==='string'&&
      c.details_url.includes(`/actions/runs/${run.id}/`));
    if(!linked.length){report.violations.push(`MISSING_CHECK_RUN:${run.id}`);continue;}
    const normalized=reconcileCompletedCheckAttempts780(linked,run);
    if(!normalized.ok){
      report.violations.push(`INCOMPLETE_CHECK_TIMELINE:${run.id}`);continue;
    }
    report.superseded_check_records+=normalized.superseded;
    const authoritative=normalized.checks;
    const starts=authoritative.map(c=>stamp(c.started_at));
    const ends=authoritative.map(c=>stamp(c.completed_at));
    const created=stamp(run.created_at);
    if(!Number.isFinite(created)||starts.some(x=>!Number.isFinite(x))||
      ends.some(x=>!Number.isFinite(x))||authoritative.some(c=>c.status!=='completed')){
      report.violations.push(`INCOMPLETE_CHECK_TIMELINE:${run.id}`);continue;
    }
    const started=Math.min(...starts),ended=Math.max(...ends);
    if(started<created||ended<started){
      report.violations.push(`INVALID_CHECK_TIMELINE:${run.id}`);continue;
    }
    values.push({queue:(started-created)/1000,runtime:(ended-started)/1000});
  }
  report.measured_runs=values.length;
  if(report.pending_runs){report.state='PENDING_MEASUREMENT';return report;}
  if(report.violations.length||values.length!==relevant.length){
    report.state='HOLD_INCOMPLETE_OR_FAILED_CI_EVIDENCE';return report;
  }
  const queue=values.map(x=>x.queue).sort((a,b)=>a-b);
  const runtime=values.map(x=>x.runtime).sort((a,b)=>a-b);
  report.queue_p95_seconds=round(p95(queue));
  report.runtime_p95_seconds=round(p95(runtime));
  report.runtime_max_seconds=round(runtime[runtime.length-1]);
  if(report.queue_p95_seconds>budget.queue_p95_seconds)
    report.violations.push('QUEUE_P95_OVER_BUDGET');
  if(report.runtime_p95_seconds>budget.runtime_p95_seconds)
    report.violations.push('RUNTIME_P95_OVER_BUDGET');
  if(report.runtime_max_seconds>budget.runtime_max_seconds)
    report.violations.push('RUNTIME_MAX_OVER_BUDGET');
  report.state=report.violations.length?'OVER_BUDGET_REVIEW':'WITHIN_BUDGET';
  return report;
}

async function json(url,token){
  const response=await fetch(url,{headers:{Authorization:`Bearer ${token}`,
    Accept:'application/vnd.github+json','User-Agent':'rosiedazzlers-ci-budget-v780'},
    signal:AbortSignal.timeout(20000)});
  if(!response.ok)throw Error(`Read-only GitHub CI query returned HTTP ${response.status}`);
  return response.json();
}
async function pages(root,token,key,maxPages=10){
  const all=[];
  for(let page=1;page<=maxPages;page++){
    const res=await json(`${root}&per_page=100&page=${page}`,token);
    if(!Array.isArray(res[key]))throw Error('Malformed GitHub CI page: '+key);
    all.push(...res[key]);
    if(res[key].length<100)return all;
  }
  throw Error('CI evidence exceeded pagination bound; refuse truncated measurement.');
}
export async function fetchCIQueue780({repo,token}={}){
  if(!/^[\w.-]+\/[\w.-]+$/.test(repo||'')||!token)
    throw Error('Read-only repository and Actions token required.');
  const root=`https://api.github.com/repos/${repo}`;
  const branch=await json(`${root}/branches/main`,token);
  const sha=branch?.commit?.sha;
  if(!SHA.test(sha||''))throw Error('Exact main commit unavailable.');
  const [runs,checks]=await Promise.all([
    pages(`${root}/actions/runs?head_sha=${sha}`,token,'workflow_runs'),
    pages(`${root}/commits/${sha}/check-runs?filter=all`,token,'check_runs')]);
  return evaluateCIQueue780({sha,runs,checks});
}
export function summary780(result){
  const text=x=>x==null?'Unavailable':String(x).replace(/[|<>\r\n]/g,' ');
  return ['### Build 780 — exact-main CI queue and runtime budget',
    `- Source: GitHub Actions push-to-main workflow runs and corresponding exact-SHA check starts.`,
    `- SHA: \`${text(result.sha)}\` · ${text(result.state)} · ${result.measured_runs}/${result.workflow_runs} measured.`,
    `- Queue p95: ${text(result.queue_p95_seconds)}s / ${result.budget.queue_p95_seconds}s budget.`,
    `- Runtime p95: ${text(result.runtime_p95_seconds)}s / ${result.budget.runtime_p95_seconds}s budget.`,
    `- Runtime max: ${text(result.runtime_max_seconds)}s / ${result.budget.runtime_max_seconds}s budget.`,
    `- Pending: ${result.pending_runs}; superseded completed-run duplicate check records: ${result.superseded_check_records||0}; violations: ${result.violations.length?result.violations.join(', '):'none'}.`,
    '- Missing, mismatched, failed or incomplete evidence is not reported as a passing measurement.',
    '- This read-only monitor never cancels a required gate or authorizes a production/custody decision.',''].join('\n');
}
export async function main780(argv=process.argv.slice(2)){
  if(!argv.includes('--github'))throw Error('Use --github for exact-main read-only observation.');
  const result=await fetchCIQueue780({repo:process.env.GITHUB_REPOSITORY,
    token:process.env.GITHUB_TOKEN});
  process.stdout.write(JSON.stringify(result)+'\n');
  if(process.env.GITHUB_STEP_SUMMARY)
    appendFileSync(process.env.GITHUB_STEP_SUMMARY,summary780(result)+'\n');
  if(argv.includes('--enforce')&&
    !['WITHIN_BUDGET','PENDING_MEASUREMENT'].includes(result.state))
    process.exitCode=1;
  return result;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  main780().catch(error=>{process.stderr.write(`Build 780 CI budget unavailable: ${error.message}\n`);
    process.exitCode=1;});
}
