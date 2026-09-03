import assert from 'node:assert/strict';
import { observeSystemHealthFamilies } from '../functions/api/_lib/system-health-families.js';
import { SYSTEM_HEALTH_READINESS_STATES_BUILD307, buildSystemHealthReadiness } from '../functions/api/_lib/system-health-readiness.js';

assert.deepEqual(SYSTEM_HEALTH_READINESS_STATES_BUILD307, ['GREEN','AMBER','RED']);

const request = new Request('https://dev.rosiedazzlers.pages.dev/api/admin/system_health_families');
const env = {
  CF_PAGES_BRANCH: 'dev',
  CF_PAGES_COMMIT_SHA: 'build307-test-sha',
  CF_PAGES_DEPLOYMENT_ID: 'build307-test-deployment',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'supabase-secret-must-not-export',
  ROSIE_PUBLIC_ASSETS_BUCKET: { get() {} },
  STRIPE_SECRET_KEY: 'stripe-secret-must-not-export',
  STRIPE_WEBHOOK_SECRET: 'stripe-webhook-must-not-export'
};
const actor = { role_code: 'it_specialist', email: 'private@example.invalid', id: 'private-staff-id' };
const observations = await observeSystemHealthFamilies({ request, env, actor });
const readiness = buildSystemHealthReadiness(observations);

assert.equal(readiness.build, 307);
assert.equal(readiness.contract, 'rosie_it_readiness_diagnostics_v1');
assert.equal(readiness.observation_contract, 'rosie_it_health_families_v1');
assert.equal(readiness.summary.configuration_is_not_transaction_acceptance, true);
assert.equal(readiness.summary.overall_state, 'AMBER');
assert.equal(readiness.diagnostics.deployment.state, 'GREEN');
assert.equal(readiness.diagnostics.api.state, 'GREEN');
assert.equal(readiness.diagnostics.authentication.state, 'GREEN');
assert.equal(readiness.diagnostics.d1.state, 'AMBER');
assert.equal(readiness.diagnostics.d1.evidence_class, 'configuration_only');
assert.equal(readiness.diagnostics.d1.transaction_acceptance, 'not_tested');
assert.equal(readiness.diagnostics.storage.state, 'AMBER');
assert.equal(readiness.diagnostics.storage.transaction_acceptance, 'not_tested');
assert.equal(readiness.diagnostics.providers.state, 'AMBER');
assert.equal(readiness.diagnostics.providers.transaction_acceptance, 'not_tested');
assert.ok(readiness.diagnostics.providers.provider_items.every((item) => item.state === 'AMBER'));
assert.ok(readiness.diagnostics.providers.provider_items.every((item) => item.transaction_acceptance === 'not_tested'));
assert.equal(readiness.diagnostics.d1.corrective_action.automatic, false);
assert.equal(readiness.diagnostics.storage.corrective_action.automatic, false);
assert.equal(readiness.diagnostics.providers.corrective_action.automatic, false);

const missingObservations = await observeSystemHealthFamilies({ request, env: { CF_PAGES_BRANCH: 'dev' }, actor });
const missing = buildSystemHealthReadiness(missingObservations);
assert.equal(missing.diagnostics.d1.state, 'RED');
assert.equal(missing.diagnostics.d1.code, 'DATABASE_CONFIGURATION_MISSING');
assert.equal(missing.diagnostics.storage.state, 'RED');
assert.equal(missing.diagnostics.storage.code, 'R2_BINDING_MISSING');
assert.equal(missing.diagnostics.providers.state, 'AMBER');
assert.equal(missing.diagnostics.providers.code, 'PROVIDERS_NOT_CONFIGURED_OR_OPTIONAL');
assert.equal(missing.summary.overall_state, 'RED');

const failed = buildSystemHealthReadiness({
  build: 306,
  contract: 'rosie_it_health_families_v1',
  family_order: ['storage'],
  families: { storage: { family: 'storage', observed: false, error: 'Safe test failure' } }
});
assert.equal(failed.diagnostics.storage.state, 'RED');
assert.equal(failed.diagnostics.storage.evidence_class, 'observation_failed');
assert.match(failed.diagnostics.storage.summary, /Safe test failure/);
assert.equal(failed.diagnostics.storage.corrective_action.required, true);
assert.equal(failed.diagnostics.storage.corrective_action.automatic, false);

const serialized = JSON.stringify(readiness);
for (const forbidden of [
  'supabase-secret-must-not-export',
  'stripe-secret-must-not-export',
  'stripe-webhook-must-not-export',
  'private@example.invalid',
  'private-staff-id'
]) assert.equal(serialized.includes(forbidden), false, `private value leaked: ${forbidden}`);

for (const forbiddenClaim of [
  'transaction_acceptance":"passed',
  'transaction_acceptance":"accepted',
  'webhook accepted',
  'payment accepted',
  'provider transaction proven'
]) assert.equal(serialized.toLowerCase().includes(forbiddenClaim.toLowerCase()), false, `fabricated acceptance claim: ${forbiddenClaim}`);

console.log('Build 307 I.T. readiness diagnostics: PASS');
console.log('- GREEN is reserved for evidence this diagnostic directly proves');
console.log('- database, R2 and provider configuration remain AMBER without transaction acceptance');
console.log('- missing core database/R2 authority is RED with explicit corrective guidance');
console.log('- optional provider absence is not falsely promoted to a core-app RED');
console.log('- corrective mechanics are read-only/manual and secrets remain private');
