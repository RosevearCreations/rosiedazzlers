// Build 225 — configuration-presence report. No values or secrets are returned.
import { requireStaffAccess, json } from "../_lib/staff-auth.js";
import { buildIntegrationStatus } from "../_lib/integration-registry.js";

export async function onRequest(context) {
  const method = String(context.request?.method || "GET").toUpperCase();
  if (method === "OPTIONS") return onRequestOptions();
  if (method === "GET" || method === "POST") return handle(context);
  return withCors(json({ ok:false, error:"Method not allowed.", allowed_methods:["GET","POST","OPTIONS"] }, 405));
}
export async function onRequestOptions() {
  return new Response("", { status:204, headers:corsHeaders() });
}
export async function onRequestGet(context) { return handle(context); }
export async function onRequestPost(context) { return handle(context); }

async function handle({ request, env }) {
  const body = request.method === "GET" ? Object.fromEntries(new URL(request.url).searchParams.entries()) : await request.json().catch(() => ({}));
  const access = await requireStaffAccess({ request, env, body, capability:"manage_staff", allowLegacyAdminFallback:true });
  if (!access.ok) return withCors(access.response);
  return withCors(json({ ok:true, integrations:buildIntegrationStatus(env) }));
}
function corsHeaders() {
  // Same-origin admin endpoint: do not grant other origins read access to configuration status.
  return {
    "Access-Control-Allow-Methods":"GET,POST,OPTIONS",
    "Access-Control-Allow-Headers":"Content-Type,x-admin-password,x-staff-email,x-staff-user-id",
    "Cache-Control":"no-store",
    "Vary":"Origin"
  };
}
function withCors(response) {
  const headers = new Headers(response.headers || {});
  for (const [key, value] of Object.entries(corsHeaders())) headers.set(key, value);
  return new Response(response.body, { status:response.status, statusText:response.statusText, headers });
}
