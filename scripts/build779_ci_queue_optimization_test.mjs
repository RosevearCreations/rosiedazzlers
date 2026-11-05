import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const cohort=[
  'booking-recovery-failure-handling-authority.yml',
  'service-economics-completeness-addon-cost-readiness-authority.yml',
  'service-economics-capacity-pricing-review-authority.yml',
  'service-economics-seasonal-capacity-reliability-trend-continuity-authority.yml',
  'staff-mobile-remediation-closure-outcome-continuity-authority.yml',
  'recovery-export-operational-proof-authority.yml',
  'reliability-cost-recovery-evidence-continuity-authority.yml',
  'service-economics-allocation-margin-review-readiness-authority.yml',
  'service-economics-seasonal-capacity-reliability-integrity-review-authority.yml',
  'service-economics-commercial-capacity-review-authority.yml',
  'service-economics-seasonal-operations-reliability-review-authority.yml',
  'staff-mobile-friction-remediation-priorities-authority.yml',
  'post-recovery-baseline-roadmap-authority.yml',
  'service-economics-seasonal-capacity-reliability-evidence-freshness-review-authority.yml',
  'staff-mobile-closure-evidence-integrity-review-authority.yml',
  'service-economics-seasonal-capacity-reliability-decision-readiness-authority.yml',
  'staff-mobile-closure-evidence-freshness-review-authority.yml',
  'service-economics-seasonal-capacity-reliability-decision-outcome-continuity-authority.yml',
  'staff-mobile-remediation-outcome-interpretation-follow-up-authority.yml',
  'service-economics-job-profitability-authority.yml'
];
const memoized=[
  'recovery-authenticated-device-closure-review-authority.yml',
  'recovery-authenticated-device-evidence-continuity-authority.yml',
  'recovery-authenticated-device-observation-execution-evidence-authority.yml',
  'recovery-drill-evidence-refresh-closure-review-authority.yml',
  'recovery-evidence-validation-drill-decision-readiness-authority.yml',
  'recovery-evidence-closure-drill-readiness-authority.yml',
  'recovery-artifact-drill-evidence-review-authority.yml',
  'authenticated-device-observation-refresh-regression-triage-authority.yml',
  'recovery-export-operational-proof-authority.yml',
  'reliability-cost-recovery-evidence-continuity-authority.yml'
];
assert.equal(cohort.length,20);assert.equal(new Set(cohort).size,20);
assert.equal(memoized.length,10);
for(const name of cohort){
  const data=read('.github/workflows/'+name);
  for(const [start,end] of [['push','pull_request'],['pull_request','workflow_dispatch']]){
    const part=data.split(new RegExp('^  '+start+':\\s*$','m'))[1]
      ?.split(new RegExp('^  '+end+':\\s*$','m'))[0];
    assert.ok(part,name+' '+start);
    assert.match(part,/\bdev\b/);assert.match(part,/\bmain\b/);
    assert.match(part,/^    paths:\s*$/m);
    assert.ok(part.includes(`'.github/workflows/${name}'`));
    const domain=name.startsWith('staff-')?["'**/*staff*'","'**/*detailer*'","'**/*mobile*'"]:
      name.startsWith('booking-')?["'**/*booking*'","'**/*recovery*'","'**/*quote*'"]:
      name.includes('recovery')?["'**/*recovery*'","'**/*backup*'","'**/*restore*'","'**/*export*'"]:
      ["'**/*service-economics*'","'**/*econom*'","'**/*pricing*'","'**/*capacity*'","'**/*consumable*'"];
    for(const selector of domain)assert.ok(part.includes(selector),name+' '+selector);
    for(const selector of ["'functions/api/_lib/staff-auth.js'",
      "'functions/_middleware.js'","'scripts/release_check.py'",
      "'scripts/ci-source-cache/**'","'assets/styles.css'"])
      assert.ok(part.includes(selector),name+' '+selector);
  }
  assert.match(data,/^  workflow_dispatch:/m);
  assert.match(data,/^jobs:/m);
  assert.match(data,/runs-on:\s*ubuntu-latest/);
}
for(const name of memoized){
  const data=read('.github/workflows/'+name);
  assert.match(data,/ROSIE_CI_DEDUP_SUBCHECKS:\s*"1"/);
  assert.match(data,/PYTHONPATH:\s*\$\{\{ github.workspace \}\}\/scripts\/ci-source-cache/);
  assert.match(data,/^  workflow_dispatch:/m);
}
const cache=read('scripts/ci-source-cache/sitecustomize.py');
for(const claim of ['GITHUB_ACTIONS','GITHUB_SHA','RUNNER_TEMP',
  'result.returncode == 0','return _ORIGINAL_RUN(*args, **kwargs)'])
  assert.ok(cache.includes(claim));
for(const path of ['.github/workflows/development-source-gate.yml',
  '.github/workflows/production-business-acceptance-authority.yml',
  '.github/workflows/cloudflare-development-acceptance.yml',
  '.github/workflows/release-health-monitor.yml'])
  assert.doesNotMatch(read(path),/^    paths:\s*$/m,'protected unfiltered '+path);
const gate=read('.github/workflows/development-source-gate.yml');
for(const n of ['source checks suite A','source checks suite B',
  'source checks suite C','source checks suite D','source checks'])
  assert.ok(gate.includes('name: '+n));
assert.match(gate,/bash scripts\/current_booking_wizard_regression.sh/);
console.log('Build 779 CI PASS: 20 optional domain authorities scoped, 10 SHA-scoped success-only nested recovery optimizations, protected gates unchanged.');
