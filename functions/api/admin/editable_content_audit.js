// File: /functions/api/admin/editable_content_audit.js
// Build 188: protected architectural audit of mutable content/config domains.
import registry from "../../../data/editable_content_registry_build188.json";
import { requireStaffAccess, json } from "../_lib/staff-auth.js";

export async function onRequestGet({ request, env }) {
  const auth = await requireStaffAccess({
    request,
    env,
    capability: "manage_staff",
    allowLegacyAdminFallback: true
  });
  if (!auth.ok) return auth.response;
  return json({ ok: true, ...registry });
}
