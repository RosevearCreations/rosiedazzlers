// Build 225 — exposes only public browser tag IDs after deployment configuration.
// Never add OAuth tokens, page access tokens, webhook secrets, Stripe secrets, or Supabase keys here.
import { buildPublicTrackingConfig } from "./_lib/integration-registry.js";

export async function onRequest(context) {
  const method = String(context.request?.method || "GET").toUpperCase();
  if (method === "OPTIONS") {
    return new Response("", { status:204, headers:headers() });
  }
  if (method !== "GET") {
    return response({ ok:false, error:"Method not allowed.", allowed_methods:["GET","OPTIONS"] }, 405);
  }
  return response(buildPublicTrackingConfig(context.env), 200);
}
export async function onRequestGet(context) { return onRequest(context); }
export async function onRequestOptions() { return new Response("", { status:204, headers:headers() }); }
function headers() {
  return {
    "Content-Type":"application/json; charset=utf-8",
    "Cache-Control":"no-store",
    "X-Content-Type-Options":"nosniff",
    "Referrer-Policy":"same-origin"
  };
}
function response(payload, status) {
  return new Response(JSON.stringify(payload), { status, headers:headers() });
}
