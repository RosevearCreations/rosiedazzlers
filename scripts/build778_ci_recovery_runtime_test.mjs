import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const recovery=[
  'recovery-authenticated-device-manual-closure-outcome-continuity-authority.yml',
  'recovery-authenticated-device-evidence-continuity-authority.yml',
  'recovery-authenticated-device-closure-review-authority.yml',
  'recovery-authenticated-device-closure-evidence-freshness-review-authority.yml',
  'recovery-authenticated-device-closure-evidence-integrity-review-authority.yml',
  'recovery-authenticated-device-observation-execution-evidence-authority.yml',
  'recovery-artifact-drill-evidence-review-authority.yml',
  'recovery-evidence-closure-drill-readiness-authority.yml',
  'recovery-evidence-validation-drill-decision-readiness-authority.yml',
  'recovery-drill-evidence-refresh-closure-review-authority.yml',
  'backup-recovery-evidence-closure-authority.yml'
];
const device=[
  'authenticated-device-acceptance-closure-authority.yml',
  'authenticated-device-regression-closure-authority.yml',
  'authenticated-device-observation-refresh-regression-triage-authority.yml',
  'authenticated-cross-device-acceptance-refresh-authority.yml',
  'authenticated-device-visual-acceptance-authority.yml'
];
const staff=[
  'staff-mobile-remediation-execution-evidence-readiness-authority.yml',
  'staff-mobile-remediation-closure-readiness-authority.yml',
  'staff-mobile-remediation-verification-authority.yml',
  'staff-mobile-remediation-outcome-evidence-authority.yml'
];
const all=[...recovery,...device,...staff];
assert.equal(all.length,20);assert.equal(new Set(all).size,20);
for(const name of all){
  const file=read('.github/workflows/'+name);
  for(const [start,end] of [['push','pull_request'],['pull_request','workflow_dispatch']]){
    const segment=file.split(new RegExp('^  '+start+':\\s*$','m'))[1]
      ?.split(new RegExp('^  '+end+':\\s*$','m'))[0];
    assert.ok(segment,`${name} retains ${start}`);
    assert.match(segment,/\bdev\b/);assert.match(segment,/\bmain\b/);
    assert.match(segment,/^    paths:\s*$/m);
    assert.ok(segment.includes(`'.github/workflows/${name}'`));
    for(const scope of staff.includes(name)?["'**/*staff-mobile*'","'**/*staff*'",
      "'**/*detailer*'","'**/*mobile*'"]:
      ["'**/*recovery*'","'**/*backup*'","'**/*restore*'",
      "'**/*authenticated-device*'","'**/*device*'"])
      assert.ok(segment.includes(scope),`${name} domain scope ${scope}`);
    for(const shared of ["'functions/api/_lib/staff-auth.js'",
      "'functions/_middleware.js'","'scripts/release_check.py'",
      "'scripts/ci-source-cache/**'","'assets/styles.css'"])
      assert.ok(segment.includes(shared),`${name} common contract ${shared}`);
    assert.doesNotMatch(segment,/['"]?\*\*\/\*\*?['"]?\s*$/m);
  }
  assert.match(file,/^  workflow_dispatch:/m);
  assert.match(file,/^jobs:/m);
  assert.match(file,/runs-on:\s*ubuntu-latest/);
}
// Protect every required gate and every recovery test in source suites B-D.
const gate=read('.github/workflows/development-source-gate.yml');
const business=read('.github/workflows/production-business-acceptance-authority.yml');
for(const [text,label] of [[gate,'source'],[business,'business']]){
  assert.match(text,/^  push:\s*$/m,label+' push');
  assert.match(text,/^  pull_request:\s*$/m,label+' PR');
  assert.doesNotMatch(text,/^    paths:\s*$/m,label+' required gate never path-scoped');
  for(const task of [
    'recovery_authenticated_device_evidence_continuity_test.mjs',
    'recovery_authenticated_device_manual_closure_outcome_continuity_test.mjs',
    'recovery_authenticated_device_observation_execution_evidence_test.mjs'])
    assert.ok(text.includes(task),label+' retained '+task);
}
for(const name of ['source checks suite A','source checks suite B','source checks suite C',
  'source checks suite D','source checks'])assert.ok(gate.includes('name: '+name));
const nestedRecovery=read('.github/workflows/recovery-authenticated-device-manual-closure-outcome-continuity-authority.yml');
assert.match(nestedRecovery,/ROSIE_CI_DEDUP_SUBCHECKS:\s*"1"/);
assert.match(nestedRecovery,/PYTHONPATH:\s*\$\{\{ github.workspace \}\}\/scripts\/ci-source-cache/);
const memo=read('scripts/ci-source-cache/sitecustomize.py');
for(const boundary of ['GITHUB_ACTIONS','GITHUB_SHA','RUNNER_TEMP',
  'returncode'])assert.ok(memo.includes(boundary));
assert.match(memo,/result\.returncode == 0/);
assert.match(memo,/return _ORIGINAL_RUN\(\*args, \*\*kwargs\)/);
assert.match(gate,/needs:\s*\[source-gate-partition-a,\s*source-gate-partition-b,\s*source-gate-partition-c,\s*source-gate-partition-d\]/);
for(const workflow of ['.github/workflows/cloudflare-development-acceptance.yml',
  '.github/workflows/release-health-monitor.yml',
  '.github/workflows/production-business-acceptance-authority.yml'])
  assert.doesNotMatch(read(workflow),/^    paths:\s*$/m,'protected '+workflow);
console.log('Build 778 CI PASS: 20 optional recovery/device/staff authorities scoped; protected source A-D, aggregate, business, Cloudflare and release health remain unconditional.');
