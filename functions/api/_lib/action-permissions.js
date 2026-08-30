// Build 272 - explicit action permission authority layered on existing module/role access.
import { parsePermissionsProfile } from "./permissions-profile.js";
import { json } from "./staff-auth.js";

const ROLE_MODULE_CEILINGS = Object.freeze({
  detailer:["detailer"], senior_detailer:["detailer","operations"], operations_manager:["detailer","operations"],
  accountant:["finance"], it_specialist:["it"], promoter:["socials"], daip_manager:["daip"],
  admin:["detailer","operations","admin","it","finance","daip","socials"]
});
const ACTION_MODULE = Object.freeze({
  "detailer.job.view":"detailer", "detailer.job.update":"detailer", "detailer.message.send":"detailer",
  "operations.schedule.view":"operations", "operations.schedule.manage":"operations", "operations.assignment.manage":"operations", "operations.customer.manage":"operations", "operations.quote.manage":"operations",
  "admin.staff.view":"admin", "admin.staff.manage":"admin", "admin.settings.manage":"admin",
  "it.runtime.view":"it", "it.runtime.manage":"it", "it.notifications.view":"it", "it.notifications.process":"it", "it.modules.manage":"it",
  "finance.view":"finance", "finance.post":"finance", "finance.reconcile":"finance", "finance.period.close":"finance", "finance.refund.manage":"finance", "finance.settlement.manage":"finance",
  "daip.view":"daip", "daip.manage":"daip",
  "socials.view":"socials", "socials.manage":"socials", "socials.publish":"socials"
});
const ROLE_DEFAULTS = Object.freeze({
  detailer:["detailer.job.view","detailer.job.update","detailer.message.send"],
  senior_detailer:["detailer.job.view","detailer.job.update","detailer.message.send","operations.schedule.view","operations.quote.manage"],
  operations_manager:["detailer.job.view","detailer.job.update","detailer.message.send","operations.schedule.view","operations.schedule.manage","operations.assignment.manage","operations.customer.manage","operations.quote.manage"],
  accountant:["finance.view","finance.post","finance.reconcile","finance.period.close","finance.refund.manage","finance.settlement.manage"],
  it_specialist:["it.runtime.view","it.runtime.manage","it.notifications.view","it.notifications.process","it.modules.manage"],
  promoter:["socials.view","socials.manage","socials.publish"],
  daip_manager:["daip.view","daip.manage"], admin:["*"]
});

export function hasActionAccess(actor, action) {
  if (!actor || !action || !ACTION_MODULE[action]) return false;
  const role = String(actor.role_code || "").trim().toLowerCase();
  if (actor.is_admin || actor.is_legacy_admin || role === "admin") return true;
  const moduleKey = ACTION_MODULE[action];
  const ceiling = ROLE_MODULE_CEILINGS[role] || [];
  if (!ceiling.includes(moduleKey)) return false;
  const profile = parsePermissionsProfile(actor.permissions_profile);
  const modules = actor.module_access && typeof actor.module_access === "object" ? actor.module_access : (profile.module_access && typeof profile.module_access === "object" ? profile.module_access : {});
  if (Object.prototype.hasOwnProperty.call(modules, moduleKey) && modules[moduleKey] !== true) return false;
  const explicit = profile.action_access && typeof profile.action_access === "object" ? profile.action_access : {};
  if (Object.prototype.hasOwnProperty.call(explicit, action)) return explicit[action] === true;
  return (ROLE_DEFAULTS[role] || []).includes(action);
}

export function requireActionAccess(actor, action) {
  return hasActionAccess(actor, action) ? { ok:true } : { ok:false, response:json({ error:"Permission denied.", required_action:action }, 403) };
}

export function knownActionsForRole(roleCode) {
  const role = String(roleCode || "").trim().toLowerCase();
  return role === "admin" ? Object.keys(ACTION_MODULE) : [...(ROLE_DEFAULTS[role] || [])];
}
