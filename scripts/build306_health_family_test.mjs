import assert from 'node:assert/strict';
import { SYSTEM_HEALTH_FAMILIES_BUILD306, normalizeHealthFamily, observeSystemHealthFamilies } from '../functions/api/_lib/system-health-families.js';

assert.deepEqual(SYSTEM_HEALTH_FAMILIES_BUILD306, ['deployment','api','d1','storage','authentication','providers']);
for (const name of SYSTEM_HEALTH_FAMILIES_BUILD306) assert.equal(normalizeHealthFamily(name), name);
assert.equal(normalizeHealthFamily('unknown'), null);

const request = new Request('https://dev.rosiedazzlers.pages.dev/api/admin/system_health_families');
const env = {
  CF_PAGES_BRANCH: 'dev',
  CF_PAGES_COMMIT_SHA: 'abc123',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'test-only-not-exported',
  ROSIE_PUBLIC_ASSETS_BUCKET: { get() {} },
  STRIPE_SECRET_KEY: 'sk_test_not_exported',
  STRIPE_WEBHOOK_SECRET: 'whsec_not_exported'
};
const actor = { role_code: 'it_specialist', email: 'must-not-be-exported@example.invalid', id: 'private-staff-id' };
const all = await observeSystemHealthFamilies({ request, env, actor });
assert.equal(all.contract, 'rosie_it_health_families_v1');
assert.equal(all.semantics, 'observation_only_build307_owns_readiness_diagnosis');
assert.deepEqual(all.family_order, SYSTEM_HEALTH_FAMILIES_BUILD306);
for (const name of SYSTEM_HEALTH_FAMILIES_BUILD306) assert.equal(all.families[name]?.family, name, name);
assert.equal(all.families.d1.mode, 'supabase');
assert.equal(all.families.d1.d1_binding_present, false);
assert.equal(all.families.storage.configured, true);
assert.equal(all.families.authentication.role_code, 'it_specialist');
assert.equal(all.families.authentication.email, undefined);

for (const name of SYSTEM_HEALTH_FAMILIES_BUILD306) {
  const one = await observeSystemHealthFamilies({ request, env, actor, family: name });
  assert.deepEqual(one.family_order, [name]);
  assert.deepEqual(Object.keys(one.families), [name]);
}

const serialized = JSON.stringify(all);
for (const forbidden of ['test-only-not-exported','sk_test_not_exported','whsec_not_exported','must-not-be-exported@example.invalid','private-staff-id']) {
  assert.equal(serialized.includes(forbidden), false, `private value leaked: ${forbidden}`);
}
for (const forbiddenSemantic of ['GREEN','AMBER','RED','remediation','corrective_action']) {
  assert.equal(serialized.includes(forbiddenSemantic), false, `Build 307 semantic leaked: ${forbiddenSemantic}`);
}

console.log('Build 306 I.T. health family extraction: PASS');
console.log('- six diagnostic families are independently addressable');
console.log('- Rosie Supabase vs D1 mode is reported accurately');
console.log('- secret values and staff identity are not exported');
console.log('- Build 307 readiness/remediation semantics remain outside the contract');
