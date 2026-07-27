// Build 209 — admin diagnostics for canonical Markdown and archive status.
import { requireStaffAccess, json } from "../_lib/staff-auth.js";
import reportData from "../../../data/markdown_sanity_build236.json";

export async function onRequestGet({ request, env }) {
  try {
    const access = await requireStaffAccess({ request, env, capability: "manage_staff", allowLegacyAdminFallback: true });
    if (!access.ok) return withCors(access.response);
    return withCors(json({ ok: true, ...reportData }));
  } catch (err) {
    return withCors(json({ ok: false, error: err?.message || "Could not load Markdown sanity report." }, 500));
  }
}

export async function onRequestOptions() { return new Response("", { status: 204, headers: corsHeaders() }); }
function corsHeaders() { return { "Access-Control-Allow-Origin":"*", "Access-Control-Allow-Methods":"GET,OPTIONS", "Access-Control-Allow-Headers":"Content-Type, x-admin-password, x-staff-email, x-staff-user-id", "Cache-Control":"no-store" }; }
function withCors(response) { const headers = new Headers(response.headers || {}); for (const [key, value] of Object.entries(corsHeaders())) headers.set(key, value); return new Response(response.body, { status: response.status, statusText: response.statusText, headers }); }
