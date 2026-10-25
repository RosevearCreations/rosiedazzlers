import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const files = [
  'authenticated-cross-device-acceptance-refresh-authority.yml',
  'authenticated-device-acceptance-closure-authority.yml',
  'authenticated-device-observation-refresh-regression-triage-authority.yml',
  'authenticated-device-regression-closure-authority.yml',
  'authenticated-device-visual-acceptance-authority.yml',
  'recovery-authenticated-device-evidence-continuity-authority.yml',
  'recovery-authenticated-device-observation-execution-evidence-authority.yml',
];
assert.equal(files.length, 7);
assert.equal(new Set(files).size, files.length);
const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');

for (const name of files) {
  const yaml = read('../.github/workflows/' + name);
  const events = yaml.split(/\n(?:permissions|concurrency|jobs):/)[0];
  const push = events.split(/\n  push:/)[1]?.split(/\n  pull_request:/)[0] || '';
  const pr = events.split(/\n  pull_request:/)[1]?.split(/\n  workflow_dispatch:/)[0] || '';
  assert.match(events, /^on:\s*$/m, name);
  assert.match(push, /\bdev\b/, name + ' protected dev push');
  assert.match(push, /\bmain\b/, name + ' protected main push');
  assert.doesNotMatch(push, /['"]?build\*['"]?/, name + ' redundant feature push');
  assert.match(pr, /\bdev\b/, name + ' dev PR');
  assert.match(pr, /\bmain\b/, name + ' main PR');
  assert.match(events, /workflow_dispatch:/, name + ' manual dispatch');
  assert.match(yaml, /^jobs:/m, name + ' unchanged jobs');
  assert.match(yaml, /runs-on:\s*ubuntu-latest/, name + ' runner');
}

const wrapper = read('./current_optional_authority_triggers.sh');
assert.match(wrapper, /set -euo pipefail/);
for (let build = 633; build <= 639; build++) {
  assert.match(wrapper, new RegExp(`node scripts/build${build}_optional_authority_`), `Build ${build} retained`);
}
const gate = read('../.github/workflows/development-source-gate.yml');
assert.match(gate, /bash scripts\/current_optional_authority_triggers\.sh/);
for (const label of ['source checks suite A', 'source checks suite B', 'source checks suite C', 'source checks suite D', 'source checks']) {
  assert.ok(gate.includes('name: ' + label), 'Required source gate intact: ' + label);
}
console.log('Build 639 — cohort G authenticated-device optional trigger regression: PASS');
