#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { hasActionAccess, requireActionAccess, knownActionsForRole } from '../functions/api/_lib/action-permissions.js';

const MODULE_ACTIONS = Object.freeze({
  detailer: ['detailer.job.view', 'detailer.job.update', 'detailer.message.send'],
  operations: ['operations.schedule.view', 'operations.schedule.manage', 'operations.assignment.manage', 'operations.customer.manage', 'operations.quote.manage'],
  admin: ['admin.staff.view', 'admin.staff.manage', 'admin.settings.manage'],
  it: ['it.runtime.view', 'it.runtime.manage', 'it.notifications.view', 'it.notifications.process', 'it.modules.manage'],
  finance: ['finance.view', 'finance.post', 'finance.reconcile', 'finance.period.close', 'finance.refund.manage', 'finance.settlement.manage', 'finance.tax.manage'],
  daip: ['daip.view', 'daip.manage'],
  socials: ['socials.view', 'socials.manage', 'socials.publish']
});

const MODULES = Object.keys(MODULE_ACTIONS);
const ALL_ACTIONS = Object.values(MODULE_ACTIONS).flat();
const ROLE_CEILINGS = Object.freeze({
  detailer: ['detailer'],
  senior_detailer: ['detailer', 'operations'],
  operations_manager: ['detailer', 'operations'],
  accountant: ['finance'],
  it_specialist: ['it'],
  promoter: ['socials'],
  daip_manager: ['daip'],
  admin: [...MODULES]
});
const ROLE_DEFAULTS = Object.freeze({
  detailer: ['detailer.job.view', 'detailer.job.update', 'detailer.message.send'],
  senior_detailer: ['detailer.job.view', 'detailer.job.update', 'detailer.message.send', 'operations.schedule.view', 'operations.quote.manage'],
  operations_manager: [...MODULE_ACTIONS.detailer, ...MODULE_ACTIONS.operations],
  accountant: [...MODULE_ACTIONS.finance],
  it_specialist: [...MODULE_ACTIONS.it],
  promoter: [...MODULE_ACTIONS.socials],
  daip_manager: [...MODULE_ACTIONS.daip]
});

assert.deepEqual(MODULES, ['detailer', 'operations', 'admin', 'it', 'finance', 'daip', 'socials']);
assert.equal(ALL_ACTIONS.length, 28, 'Build 310 must cover exactly 28 registered actions');
assert.equal(new Set(ALL_ACTIONS).size, 28, 'Build 310 action registry must not contain duplicates');
assert.deepEqual([...knownActionsForRole('admin')].sort(), [...ALL_ACTIONS].sort(), 'Admin must enumerate every registered action');

function actor(role, moduleAccess, actionAccess = {}, extra = {}) {
  return {
    role_code: role,
    is_admin: false,
    is_legacy_admin: false,
    module_access: moduleAccess,
    permissions_profile: { module_access: moduleAccess, action_access: actionAccess },
    ...extra
  };
}

const allFalseModules = Object.fromEntries(MODULES.map((key) => [key, false]));
const allFalseActions = Object.fromEntries(ALL_ACTIONS.map((key) => [key, false]));
const admin = actor('admin', allFalseModules, allFalseActions);
for (const action of ALL_ACTIONS) {
  assert.equal(hasActionAccess(admin, action), true, `Admin role must bypass profile narrowing for ${action}`);
  assert.deepEqual(requireActionAccess(admin, action), { ok: true }, `Admin direct guard must accept ${action}`);
}

const legacyAdmin = actor('staff', allFalseModules, allFalseActions, { is_legacy_admin: true });
for (const action of ALL_ACTIONS) {
  assert.equal(hasActionAccess(legacyAdmin, action), true, `Legacy Admin bridge must retain ${action}`);
}

for (const [role, ceilingModules] of Object.entries(ROLE_CEILINGS)) {
  if (role === 'admin') continue;
  const ceiling = new Set(ceilingModules);
  const moduleAccess = Object.fromEntries(MODULES.map((key) => [key, true]));
  const explicitGrantAll = Object.fromEntries(ALL_ACTIONS.map((key) => [key, true]));
  const granted = actor(role, moduleAccess, explicitGrantAll);
  for (const [moduleKey, actions] of Object.entries(MODULE_ACTIONS)) {
    for (const action of actions) {
      assert.equal(
        hasActionAccess(granted, action),
        ceiling.has(moduleKey),
        `${role} must ${ceiling.has(moduleKey) ? 'allow' : 'deny'} ${action} at its role ceiling`
      );
    }
  }

  const narrowed = actor(role, allFalseModules, explicitGrantAll);
  for (const action of ALL_ACTIONS) {
    assert.equal(hasActionAccess(narrowed, action), false, `${role} module=false must narrow ${action}`);
  }

  const defaultsModules = Object.fromEntries(MODULES.map((key) => [key, ceiling.has(key)]));
  const defaultsActor = actor(role, defaultsModules, {});
  const expectedDefaults = ROLE_DEFAULTS[role] || [];
  assert.deepEqual([...knownActionsForRole(role)].sort(), [...expectedDefaults].sort(), `${role} default action registry drifted`);
  for (const action of ALL_ACTIONS) {
    assert.equal(hasActionAccess(defaultsActor, action), expectedDefaults.includes(action), `${role} default mismatch for ${action}`);
  }
}

assert.equal(hasActionAccess(admin, 'unknown.action'), false, 'Unknown actions must fail closed even for Admin');
const detailerDenied = requireActionAccess(actor('detailer', { detailer: true }), 'finance.view');
assert.equal(detailerDenied.ok, false);
assert.equal(detailerDenied.response.status, 403);
assert.equal((await detailerDenied.response.json()).required_action, 'finance.view');

const html = fs.readFileSync(new URL('../admin-staff.html', import.meta.url), 'utf8');
const asset = fs.readFileSync(new URL('../assets/admin-staff-v309.js', import.meta.url), 'utf8');
const staffSave = fs.readFileSync(new URL('../functions/api/staff_save.js', import.meta.url), 'utf8');
const staffSaveAlias = fs.readFileSync(new URL('../functions/api/admin/staff_save.js', import.meta.url), 'utf8');
const actionSource = fs.readFileSync(new URL('../functions/api/_lib/action-permissions.js', import.meta.url), 'utf8');
const authSource = fs.readFileSync(new URL('../functions/api/_lib/staff-auth.js', import.meta.url), 'utf8');

const uiModules = [...html.matchAll(/data-module-access="([^"]+)"/g)].map((match) => match[1]);
assert.deepEqual(uiModules, MODULES, 'Staff Administration must expose exactly the seven canonical module controls');
assert.match(html, /Administrator \/ Owner — all modules/);
assert.match(asset, /const MODULE_KEYS = \["detailer","operations","admin","it","finance","daip","socials"\];/);
assert.match(asset, /admin: \[\.\.\.MODULE_KEYS\]/);
assert.match(asset, /const forcedAdmin = role === "admin";/);
assert.match(asset, /input\.checked = forcedAdmin \? true/);
assert.match(asset, /Administrator accounts are always granted every internal module\./);
assert.match(staffSave, /const INTERNAL_MODULES=\["detailer","operations","admin","it","finance","daip","socials"\];/);
assert.match(staffSave, /admin:\[\.\.\.INTERNAL_MODULES\]/);
assert.match(staffSave, /if\(roleCode==="admin"\)\{out\[key\]=true;continue;\}/);
assert.match(staffSaveAlias, /Canonical implementation: functions\/api\/staff_save\.js/);
assert.match(staffSaveAlias, /export \{ onRequestPost \} from "\.\.\/staff_save\.js";/);
assert.match(authSource, /admin: \["detailer", "operations", "admin", "it", "finance", "daip", "socials"\]/);
assert.match(authSource, /actor\.is_admin \|\| actor\.is_legacy_admin \|\| String\(actor\.role_code \|\| ""\)\.toLowerCase\(\) === "admin"/);
for (const action of ALL_ACTIONS) assert.ok(actionSource.includes(`"${action}"`), `Action registry missing ${action}`);

console.log('Build 310 Admin full-access matrix: PASS');
console.log(`- ${MODULES.length} modules / ${ALL_ACTIONS.length} actions proven for Admin`);
console.log('- non-Admin role ceilings and profile narrowing remain fail-closed');
console.log('- Staff Administration UI, save normalization, auth ceiling and action registry agree');
