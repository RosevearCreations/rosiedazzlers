import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {BUDGET780,evaluateCIQueue780,summary780}
  from './ci_queue_budget_v780.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const sha='a'.repeat(40),ts=s=>new Date(Date.parse('2026-11-05T12:00:00Z')+s*1000).toISOString();
const create=(queue=20,runtime=40,id=1)=>({
  run:{id,head_sha:sha,head_branch:'main',event:'push',
    name:'Optional verified source authority',status:'completed',conclusion:'success',
    created_at:ts(0)},
  check:{name:'authority',details_url:`https://github.com/example/rosiedazzlers/actions/runs/${id}/job/${id}`,
    status:'completed',conclusion:'success',started_at:ts(queue),completed_at:ts(queue+runtime)}
});
const fixtures=Array.from({length:20},(_,i)=>create(20+i,40+i,i+1));
const verify=(items,extra={})=>evaluateCIQueue780({sha,
  runs:items.map(x=>x.run),checks:items.map(x=>x.check),...extra});
const ok=verify(fixtures);
assert.equal(ok.state,'WITHIN_BUDGET');
assert.equal(ok.workflow_runs,20);
assert.equal(ok.measured_runs,20);
assert.ok(ok.queue_p95_seconds<=BUDGET780.queue_p95_seconds);
assert.match(summary780(ok),/20\/20 measured/);
const slow=verify(fixtures.map((x,i)=>i<3?create(150,220,i+1):x));
assert.equal(slow.state,'OVER_BUDGET_REVIEW');
assert.ok(slow.violations.includes('QUEUE_P95_OVER_BUDGET'));
assert.ok(slow.violations.includes('RUNTIME_P95_OVER_BUDGET'));
const stalled=verify([{...fixtures[0],run:{...fixtures[0].run,status:'in_progress'}}]);
assert.equal(stalled.state,'PENDING_MEASUREMENT');
const missing=verify([{run:fixtures[0].run,check:{...fixtures[0].check,details_url:'https://invalid/'}}]);
assert.equal(missing.state,'HOLD_INCOMPLETE_OR_FAILED_CI_EVIDENCE');
const failed=verify([{...fixtures[0],run:{...fixtures[0].run,conclusion:'failure'}}]);
assert.equal(failed.state,'HOLD_INCOMPLETE_OR_FAILED_CI_EVIDENCE');
assert.equal(verify(fixtures,{sha:'invalid'}).state,'HOLD_UNVERIFIED_CI_EVIDENCE');
const cross=verify([...fixtures,{...create(999,999,25),run:{...create(999,999,25).run,head_sha:'b'.repeat(40)}}]);
assert.equal(cross.state,'WITHIN_BUDGET');
const monitored=[
  ['staff-mobile-remediation-closure-outcome-continuity-authority.yml',12],
  ['service-economics-seasonal-capacity-reliability-decision-outcome-continuity-authority.yml',15],
  ['service-economics-seasonal-capacity-reliability-evidence-freshness-review-authority.yml',8],
  ['staff-mobile-closure-evidence-freshness-review-authority.yml',8],
  ['recovery-authenticated-device-observation-execution-evidence-authority.yml',12],
  ['recovery-authenticated-device-closure-evidence-integrity-review-authority.yml',8],
  ['service-economics-seasonal-capacity-reliability-decision-readiness-authority.yml',12]
];
for(const [file,timeout] of monitored){
  const wf=read('.github/workflows/'+file);
  assert.match(wf,new RegExp('timeout-minutes: '+timeout+'\\b'));
  assert.match(wf,/cancel-in-progress: true/);
  if(file!=='service-economics-seasonal-capacity-reliability-decision-readiness-authority.yml')
    assert.doesNotMatch(wf,/^  group:.*\$\{\{ github.sha \}\}/m,
      'optional ref should cancel superseded SHA '+file);
  assert.match(wf,/workflow_dispatch:/);
}
const monitor=read('.github/workflows/release-health-monitor.yml');
assert.match(monitor,/actions: read/);
assert.match(monitor,/node scripts\/ci_queue_budget_v780.mjs --github --enforce/);
for(const name of ['development-source-gate.yml','production-business-acceptance-authority.yml',
  'cloudflare-development-acceptance.yml'])
  assert.doesNotMatch(read('.github/workflows/'+name),/^    paths:\s*$/m);
console.log('Build 780 CI PASS: exact-SHA queue/runtime p95 budgets, 7 optional hard runtimes, ref dedup, protected gates unchanged.');
