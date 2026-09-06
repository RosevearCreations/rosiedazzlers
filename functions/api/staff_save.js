// Build 349 — Staff & Access save authority.
import { requireStaffAccess, serviceHeaders, json, cleanText, cleanEmail, toBoolean } from "./_lib/staff-auth.js";
import { parsePermissionsProfile, profileForDatabase } from "./_lib/permissions-profile.js";

const INTERNAL_MODULES=["detailer","operations","admin","it","finance","daip","socials"];
const ROLE_CEILINGS={
  detailer:["detailer"],
  senior_detailer:["detailer","operations"],
  operations_manager:["detailer","operations"],
  accountant:["finance"],
  it_specialist:["it"],
  promoter:["socials"],
  daip_manager:["daip"],
  admin:[...INTERNAL_MODULES]
};

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await request.json().catch(() => ({}));
    const access = await requireStaffAccess({ request, env, body, capability: "manage_staff", allowLegacyAdminFallback: false });
    if (!access.ok) return access.response;
    const id = cleanText(body.id), full_name = cleanText(body.full_name), email = cleanEmail(body.email), role_code = cleanRole(body.role_code), is_active = toBooleanDefault(body.is_active, true);
    if (!full_name) return json({ error: "Missing full_name." }, 400);
    if (!email) return json({ error: "Missing or invalid email." }, 400);
    if (!role_code) return json({ error: "Invalid role_code." }, 400);

    let existingProfile={};
    let observedProfileValue=null;
    if(id){
      const profileRes=await fetch(`${env.SUPABASE_URL}/rest/v1/staff_users?select=permissions_profile&id=eq.${encodeURIComponent(id)}&limit=1`,{headers:serviceHeaders(env)});
      if(profileRes.ok){const rows=await profileRes.json().catch(()=>[]);observedProfileValue=Array.isArray(rows)&&rows[0]?rows[0].permissions_profile:null;existingProfile=parsePermissionsProfile(observedProfileValue);}
    } else {
      const sampleRes=await fetch(`${env.SUPABASE_URL}/rest/v1/staff_users?select=permissions_profile&limit=1`,{headers:serviceHeaders(env)});
      if(sampleRes.ok){const rows=await sampleRes.json().catch(()=>[]);observedProfileValue=Array.isArray(rows)&&rows[0]?rows[0].permissions_profile:null;}
    }
    const requestedAccess=body.module_access&&typeof body.module_access==="object"?body.module_access:(existingProfile.module_access||{});
    const module_access=normalizeModuleAccess(role_code,requestedAccess);
    const permissions_profile={...existingProfile,module_access,module_access_version:349};
    const forceFullAdminAuthority = role_code === "admin";

    const record = {
      full_name, email, role_code, is_active,
      can_override_lower_entries: forceFullAdminAuthority ? true : toBooleanDefault(body.can_override_lower_entries, false),
      can_manage_bookings: forceFullAdminAuthority ? true : toBooleanDefault(body.can_manage_bookings, false),
      can_manage_blocks: forceFullAdminAuthority ? true : toBooleanDefault(body.can_manage_blocks, false),
      can_manage_progress: forceFullAdminAuthority ? true : toBooleanDefault(body.can_manage_progress, false),
      can_manage_promos: forceFullAdminAuthority ? true : toBooleanDefault(body.can_manage_promos, false),
      can_manage_staff: forceFullAdminAuthority ? true : toBooleanDefault(body.can_manage_staff, false),
      permissions_profile: profileForDatabase(permissions_profile, observedProfileValue),
      employee_code: cleanText(body.employee_code), position_title: cleanText(body.position_title), pay_schedule: cleanPaySchedule(body.pay_schedule),
      hourly_rate_cents: cleanMoneyToCents(body.hourly_rate_cad, body.hourly_rate_cents), max_hours_per_day: cleanPositiveNumber(body.max_hours_per_day, 8), max_hours_per_week: cleanPositiveNumber(body.max_hours_per_week, 40),
      payroll_enabled: toBooleanDefault(body.payroll_enabled, true), preferred_work_hours: cleanJsonOrText(body.preferred_work_hours), tips_payout_notes: cleanText(body.tips_payout_notes), payroll_notes: cleanText(body.payroll_notes), notes: cleanText(body.notes), updated_at: new Date().toISOString()
    };
    if (id) {
      const patchRes = await fetch(`${env.SUPABASE_URL}/rest/v1/staff_users?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", headers: { ...serviceHeaders(env), Prefer: "return=representation" }, body: JSON.stringify(record) });
      if (!patchRes.ok) return json({ error: `Could not update staff user. ${await patchRes.text()}` }, 500);
      const rows = await patchRes.json().catch(() => []), row = Array.isArray(rows) ? rows[0] || null : null;
      if (!row) return json({ error: "Staff user not found." }, 404);
      return json({ ok: true, message: "Staff user updated.", actor: { id: access.actor?.id || null, full_name: access.actor?.full_name || null }, staff_user: row, admin_authority_forced: forceFullAdminAuthority });
    }
    const insertRes = await fetch(`${env.SUPABASE_URL}/rest/v1/staff_users`, { method: "POST", headers: { ...serviceHeaders(env), Prefer: "return=representation" }, body: JSON.stringify([{ ...record, created_at: new Date().toISOString() }]) });
    if (!insertRes.ok) return json({ error: `Could not create staff user. ${await insertRes.text()}` }, 500);
    const rows = await insertRes.json().catch(() => []);
    return json({ ok: true, message: "Staff user created.", actor: { id: access.actor?.id || null, full_name: access.actor?.full_name || null }, staff_user: Array.isArray(rows) ? rows[0] || null : null, admin_authority_forced: forceFullAdminAuthority });
  } catch (err) { return json({ error: err && err.message ? err.message : "Unexpected server error." }, 500); }
}
function normalizeModuleAccess(roleCode,input){const ceiling=new Set(ROLE_CEILINGS[roleCode]||[]),out={};for(const key of INTERNAL_MODULES){if(roleCode==="admin"){out[key]=true;continue;}out[key]=ceiling.has(key)&&(Object.prototype.hasOwnProperty.call(input||{},key)?input[key]===true:true);}return out;}
function cleanRole(value) { const s = String(value ?? "").trim().toLowerCase(); return ["admin", "senior_detailer", "detailer", "operations_manager", "accountant", "it_specialist", "promoter", "daip_manager"].includes(s) ? s : null; }
function toBooleanDefault(value, fallback = false) { if (value === null || value === undefined || value === "") return fallback; return toBoolean(value); }
function cleanPaySchedule(value) { const s = String(value ?? "").trim().toLowerCase(); return ["weekly", "biweekly", "semimonthly", "monthly", "contractor"].includes(s) ? s : null; }
function cleanPositiveNumber(value, fallback) { const n = Number(value); return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : fallback; }
function cleanMoneyToCents(cadValue, centsValue) { const cents = Number(centsValue); if (Number.isFinite(cents) && cents >= 0) return Math.round(cents); const cad = Number(cadValue); if (Number.isFinite(cad) && cad >= 0) return Math.round(cad * 100); return 0; }
function cleanJsonOrText(value) { if (value == null || value === "") return null; if (typeof value === "object") return value; const s = String(value).trim(); if (!s) return null; try { return JSON.parse(s); } catch { return s; } }
