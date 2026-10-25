import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');
const expected = [
  'it-readiness-release-control-authority.yml',
  'production-business-acceptance-authority.yml',
  'release-governance-authority.yml',
];
const names = readdirSync(new URL('../.github/workflows/', import.meta.url)).filter(n => /\.ya?ml$/.test(n));
assert.ok(names.length >= 200, 'Workflow inventory unexpectedly smaller; review for removal');
const broad = [];
for (const name of names) {
  const yaml = read('../.github/workflows/' + name);
  const event = yaml.split(/\n(?:permissions|concurrency|env|jobs):/)[0];
  const push = event.split(/\n  push:/)[1]?.split(/\n  (?:pull_request|workflow_dispatch|schedule):/)[0] || '';
  if (/['"]build\*['"]/.test(push)) broad.push(name);
}
assert.deepEqual(broad.sort(), expected.sort(), 'Review any new/removed broad feature-branch authority selector');
for (const name of expected) {
  const y = read('../.github/workflows/' + name);
  const events = y.split(/\n(?:permissions|concurrency|env|jobs):/)[0];
  const push = events.split(/\n  push:/)[1]?.split(/\n  pull_request:/)[0] || '';
  const pr = events.split(/\n  pull_request:/)[1]?.split(/\n  workflow_dispatch:/)[0] || '';
  assert.match(push, /\bdev\b/, name + ' dev push');
  assert.match(push, /\bmain\b/, name + ' main push');
  assert.match(pr, /\bdev\b/, name + ' dev pull requests');
  assert.match(pr, /\bmain\b/, name + ' main pull requests');
  assert.match(events, /workflow_dispatch:/, name + ' manual dispatch');
  assert.match(y, /^jobs:/m, name + ' jobs retained');
}
const preview = read('../.github/workflows/cloudflare-feature-preview-acceptance.yml');
assert.match(preview, /'build\*\*'/, 'Feature-preview selector remains distinct');
assert.match(preview, /TARGET_SHA:\s*\$\{\{ github\.sha \}\}/, 'Exact feature preview SHA retained');
const source = read('../.github/workflows/development-source-gate.yml');
assert.match(source, /bash scripts\/current_optional_authority_triggers\.sh/);
for (const name of ['source checks suite A', 'source checks suite B', 'source checks suite C', 'source checks suite D', 'source checks']) {
  assert.ok(source.includes('name: ' + name), name + ' must remain required');
}
const wrapper = read('./current_optional_authority_triggers.sh');
assert.match(wrapper, /set -euo pipefail/);
for (let n = 633; n <= 646; n++) assert.match(wrapper, new RegExp('node scripts/build' + n + '_optional_authority_'), 'Cohort '+n);
console.log('Build 646 — final broad selector inventory and protected exceptions: PASS (' + names.length + ' workflows)');
