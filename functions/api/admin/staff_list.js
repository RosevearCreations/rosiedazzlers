// Build 349 — resilient Staff & Access profile loading and explicit administrator authority.
import { requireStaffAccess, serviceHeaders, json } from "../_lib/staff-auth.js";
import { parsePermissionsProfile } from "../_lib/permissions-profile.js";

const INTERNAL_MODULES = ["detailer", "operations", "admin", "it", "finance", "daip", "socials"];
const ADMIN_MODULE_ACCESS = Object.freeze(Object.fromEntries(INTERNAL_MODULES.map((key) => [key, true])));
const FULL_STAFF_SELECT = "id,created_at,updated_at,full_name,email,role_code,is_active,can_override_lower_entries,can_manage_bookings,can_manage_blocks,can_manage_progress,can_manage_promos,can_manage_staff,permissions_profile,employee_code,position_title,pay_schedule,hourly_rate_cents,max_hours_per_day,max_hours_per_week,payroll_enabled,tips_payout_notes,payroll_notes,preferred_work_hours,notes";
const CORE_STAFF_SELECT = "id,created_at,updated_at,full_name,email,role_code,is_active,can_override_lower_entries,can_manage_bookings,can_manage_blocks,can_manage_progress,can_manage_promos,can_manage_staff,permissions_profile,notes";

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await request.json().catch(() => ({}));
    const access = await requireStaffAccess({ request, env, body, capability: "manage_staff", allowLegacyAdminFallback: false });
    if (!access.ok) return access.response;

    const warnings = [];
    const [staffResult, tiersResult] = await Promise.all([
      loadStaffRows(env, warnings),
      loadCustomerTiers(env)
    ]);

    if (!staffResult.ok) {
      return json({ error: `Could not load staff users. ${staffResult.error || "Staff profile query failed."}` }, 500);
    }

    if (!tiersResult.ok) {
      warnings.push("Customer tiers are temporarily unavailable. Staff profiles and module access remain available.");
    }

    const staffUsers = staffResult.rows.map(normalizeStaffForClient);
    const administratorCount = staffUsers.filter((row) => String(row.role_code || "").toLowerCase() === "admin").length;

    return json({
      ok: true,
      actor: {
        id: access.actor?.id || null,
        full_name: access.actor?.full_name || null,
        role_code: access.actor?.role_code || null,
        is_admin: access.actor?.is_admin === true
      },
      staff_users: staffUsers,
      customer_tiers: tiersResult.ok ? tiersResult.rows : [],
      warnings,
      admin_authority: {
        force_all: true,
        modules: [...INTERNAL_MODULES],
        administrator_count: administratorCount,
        capability_policy: "Administrators always receive every internal module and legacy management capability."
      }
    });
  } catch (err) {
    return json({ error: err && err.message ? err.message : "Unexpected server error." }, 500);
  }
}

async function loadStaffRows(env, warnings) {
  const headers = serviceHeaders(env);
  const fullUrl = `${env.SUPABASE_URL}/rest/v1/staff_users?select=${FULL_STAFF_SELECT}&order=full_name.asc`;
  const fullRes = await fetch(fullUrl, { headers });
  if (fullRes.ok) {
    const rows = await fullRes.json().catch(() => []);
    return { ok: true, rows: Array.isArray(rows) ? rows : [] };
  }

  // Keep access/profile administration usable if optional payroll/profile columns
  // lag behind the core staff schema during a deployment or migration.
  const fullError = await fullRes.text().catch(() => "");
  const coreUrl = `${env.SUPABASE_URL}/rest/v1/staff_users?select=${CORE_STAFF_SELECT}&order=full_name.asc`;
  const coreRes = await fetch(coreUrl, { headers });
  if (!coreRes.ok) {
    return { ok: false, rows: [], error: (await coreRes.text().catch(() => "")) || fullError || "Core staff query failed." };
  }

  warnings.push("Optional staff payroll/profile fields are not available from the current database schema. Core staff access profiles were loaded safely.");
  const coreRows = await coreRes.json().catch(() => []);
  return { ok: true, rows: Array.isArray(coreRows) ? coreRows : [] };
}

async function loadCustomerTiers(env) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/customer_tiers?select=code,sort_order,label,description,is_active&order=sort_order.asc`, { headers: serviceHeaders(env) });
  if (!res.ok) return { ok: false, rows: [] };
  const rows = await res.json().catch(() => []);
  return { ok: true, rows: Array.isArray(rows) ? rows : [] };
}

function normalizeStaffForClient(row) {
  const roleCode = String(row?.role_code || "").trim().toLowerCase();
  const profile = parsePermissionsProfile(row?.permissions_profile);
  if (roleCode !== "admin") {
    return { ...row, permissions_profile: profile };
  }

  return {
    ...row,
    role_code: "admin",
    can_override_lower_entries: true,
    can_manage_bookings: true,
    can_manage_blocks: true,
    can_manage_progress: true,
    can_manage_promos: true,
    can_manage_staff: true,
    permissions_profile: {
      ...profile,
      module_access: { ...ADMIN_MODULE_ACCESS },
      module_access_version: 349
    }
  };
}
