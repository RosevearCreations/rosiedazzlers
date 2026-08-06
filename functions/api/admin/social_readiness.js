import { requireStaffAccess, json, methodNotAllowed } from "../_lib/staff-auth.js";
import { socialReadiness, withSocialCors, socialCorsHeaders } from "../_lib/social-dispatch.js";

export async function onRequestOptions() {
  return new Response("", { status: 204, headers: socialCorsHeaders() });
}

export async function onRequestGet({ request, env }) {
  const access = await requireStaffAccess({ request, env, capability: "manage_progress", allowLegacyAdminFallback: true });
  if (!access.ok) return withSocialCors(access.response);
  return withSocialCors(json({ ok: true, readiness: socialReadiness(env) }));
}

export async function onRequestPost(context) {
  return onRequestGet(context);
}

export async function onRequestPut() {
  return withSocialCors(methodNotAllowed());
}
