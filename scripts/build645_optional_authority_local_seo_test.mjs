import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');
const name = 'local-seo-service-landing-proof-authority.yml';
const yaml = read('../.github/workflows/' + name);
const events = yaml.split(/\n(?:permissions|concurrency|jobs):/)[0];
const push = events.split(/\n  push:/)[1]?.split(/\n  pull_request:/)[0] || '';
const pr = events.split(/\n  pull_request:/)[1] || '';
assert.match(events, /^on:\s*$/m);
assert.match(push, /branches:\s*\[main,\s*dev\]/, 'Protected push branches retained');
assert.doesNotMatch(push, /['"]?build\*['"]?/, 'Legacy feature push narrowed');
assert.match(pr, /branches:\s*\[main,\s*dev\]/, 'Protected PR branches retained');
assert.doesNotMatch(events, /workflow_dispatch:/, 'Legacy workflow manual dispatch unchanged');
for (const path of [
  "assets/landing-page.js",
  "functions/api/local_proof_public.js",
  "data/local_seo_targets.json",
  "scripts/build389_local_seo_service_landing_proof_check.py",
  ".github/workflows/local-seo-service-landing-proof-authority.yml",
]) {
  assert.ok(push.includes(path) && pr.includes(path), path + ' path guard retained');
}
assert.match(yaml, /^jobs:/m);
assert.match(yaml, /runs-on:\s*ubuntu-latest/);
assert.match(yaml, /python scripts\/build389_local_seo_service_landing_proof_check\.py/);
const protectedSelectors = [
  'it-readiness-release-control-authority.yml',
  'release-governance-authority.yml',
  'production-business-acceptance-authority.yml',
];
for (const n of protectedSelectors) {
  const policy = read('../.github/workflows/' + n);
  const trigger = policy.split(/\n(?:permissions|concurrency|jobs):/)[0].split(/\n  push:/)[1]?.split(/\n  pull_request:/)[0] || '';
  assert.match(trigger, /['"]build\*['"]/, n + ' policy selector not changed');
}
const wrapper = read('./current_optional_authority_triggers.sh');
assert.match(wrapper, /set -euo pipefail/);
for (let n = 633; n <= 645; n++) assert.match(wrapper, new RegExp('node scripts/build' + n + '_optional_authority_'), 'Build '+n);
const gate = read('../.github/workflows/development-source-gate.yml');
assert.match(gate, /bash scripts\/current_optional_authority_triggers\.sh/);
for (const label of ['source checks suite A', 'source checks suite B', 'source checks suite C', 'source checks suite D', 'source checks'])
  assert.ok(gate.includes('name: ' + label), label);
console.log('Build 645 — Local SEO optional trigger regression: PASS');
