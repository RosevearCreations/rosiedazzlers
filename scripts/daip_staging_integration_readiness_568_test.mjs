import assert from 'node:assert/strict';
import {STAGING_STEPS_568,stagingIntegrationPlan568 as plan} from '../assets/daip-staging-integration-readiness-568.js';
assert.equal(STAGING_STEPS_568.length,6);
assert.deepEqual(STAGING_STEPS_568.map(s=>s.id),[
 'provider_selection','credential_isolation','migration_recovery',
 'provider_negative_cases','ledger_idempotency','operator_acceptance'
]);
const empty=plan();
assert.equal(empty.document_status,'planning_documentation_incomplete');
assert.equal(empty.pending_stage_ids.length,6);
assert.equal(empty.operational_status,'HOLD');
const partial=plan({documentedStageIds:['provider_selection','provider_selection','unknown','NEVER_OUTPUT_SECRET']});
assert.deepEqual(partial.documented_stage_ids,['provider_selection']);
assert.equal(partial.pending_stage_ids.length,5);
assert.equal(JSON.stringify(partial).includes('NEVER_OUTPUT_SECRET'),false);
const complete=plan({documentedStageIds:STAGING_STEPS_568.map(s=>s.id)});
assert.equal(complete.document_status,'planning_documentation_complete');
assert.equal(complete.staging_execution_authorized,false);
assert.equal(complete.external_worker_provider_verified,false);
assert.equal(complete.external_consent_provider_verified,false);
assert.equal(complete.sql_migrations_applied,false);
assert.equal(complete.ledger_runtime_verified,false);
assert.equal(complete.operator_approval_verified,false);
assert.equal(complete.operational_status,'HOLD');
assert.equal(complete.public_release_allowed,false);
assert.equal(complete.public_export_allowed,false);
assert.equal(complete.storage_written,false);
assert.equal(complete.customer_data_mutated,false);
assert.equal(complete.worker_dispatched,false);
assert.ok(Object.isFrozen(complete));
assert.ok(Object.isFrozen(complete.staging_runbook));
for (const x of STAGING_STEPS_568) assert.ok(Object.isFrozen(x));
console.log('Build 568 staging integration plan: PASS; all external operational changes remain HOLD');
