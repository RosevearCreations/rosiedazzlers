#!/usr/bin/env node
import assert from 'node:assert/strict';
import { hasActionAccess, requireActionAccess, knownActionsForRole } from '../functions/api/_lib/action-permissions.js';

function actor(role, moduleAccess = {}, actionAccess = {}) {
  return {
    role_code: role,
    is_admin: role === 'admin',
    is_legacy_admin: false,
    module_access: moduleAccess,
    permissions_profile: { module_access: moduleAccess, action_access: actionAccess }
  };
}

const detailer = actor('detailer', { detailer:true });
assert.equal(hasActionAccess(detailer, 'detailer.job.view'), true);
assert.equal(hasActionAccess(detailer, 'operations.customer.manage'), false);
assert.equal(hasActionAccess(detailer, 'finance.view'), false);

const senior = actor('senior_detailer', { detailer:true, operations:true });
assert.equal(hasActionAccess(senior, 'operations.quote.manage'), true);
assert.equal(hasActionAccess(senior, 'operations.customer.manage'), false);

const seniorGranted = actor('senior_detailer', { detailer:true, operations:true }, { 'operations.customer.manage':true });
assert.equal(hasActionAccess(seniorGranted, 'operations.customer.manage'), true);

const ops = actor('operations_manager', { detailer:true, operations:true });
assert.equal(hasActionAccess(ops, 'operations.customer.manage'), true);
assert.equal(hasActionAccess(ops, 'operations.assignment.manage'), true);
assert.equal(hasActionAccess(ops, 'finance.tax.manage'), false);

const opsNarrowed = actor('operations_manager', { detailer:true, operations:false }, { 'operations.customer.manage':true });
assert.equal(hasActionAccess(opsNarrowed, 'operations.customer.manage'), false);

const accountant = actor('accountant', { finance:true });
assert.equal(hasActionAccess(accountant, 'finance.view'), true);
assert.equal(hasActionAccess(accountant, 'finance.tax.manage'), true);
assert.equal(hasActionAccess(accountant, 'operations.customer.manage'), false);

const accountantCrossGrant = actor('accountant', { finance:true }, { 'operations.customer.manage':true });
assert.equal(hasActionAccess(accountantCrossGrant, 'operations.customer.manage'), false);

const it = actor('it_specialist', { it:true });
assert.equal(hasActionAccess(it, 'it.runtime.manage'), true);
assert.equal(hasActionAccess(it, 'finance.view'), false);

const promoter = actor('promoter', { socials:true });
assert.equal(hasActionAccess(promoter, 'socials.publish'), true);
assert.equal(hasActionAccess(promoter, 'operations.quote.manage'), false);

const explicitDeny = actor('accountant', { finance:true }, { 'finance.tax.manage':false });
assert.equal(hasActionAccess(explicitDeny, 'finance.tax.manage'), false);

const admin = actor('admin', { detailer:true, operations:true, admin:true, it:true, finance:true, daip:true, socials:true });
for (const action of ['operations.customer.manage','finance.tax.manage','it.runtime.manage','socials.publish','daip.manage']) {
  assert.equal(hasActionAccess(admin, action), true, `admin should have ${action}`);
}

assert.equal(hasActionAccess(ops, 'unknown.action'), false);
assert.ok(knownActionsForRole('accountant').includes('finance.tax.manage'));
assert.ok(!knownActionsForRole('detailer').some((value) => value.startsWith('finance.')));

const denied = requireActionAccess(detailer, 'finance.view');
assert.equal(denied.ok, false);
assert.equal(denied.response.status, 403);
const deniedBody = await denied.response.json();
assert.equal(deniedBody.error, 'Permission denied.');
assert.equal(deniedBody.required_action, 'finance.view');

console.log('Build 290 action-permission matrix: PASS');
console.log('- role ceilings cannot be bypassed by explicit cross-module grants');
console.log('- profile module=false narrows role defaults');
console.log('- explicit action=false narrows an allowed module');
console.log('- explicit action=true may extend only inside the role/module ceiling');
console.log('- denied actions return 403 without performing a mutation');
