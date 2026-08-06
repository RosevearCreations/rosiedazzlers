// Build 197 — admin route-copy parity diagnostics for root .html and folder/index.html copies.
import { requireStaffAccess, json, methodNotAllowed } from "../_lib/staff-auth.js";

const TARGETS = [
  ["Dashboard", "/admin.html", "/admin/"],
  ["App Management", "/admin-app.html", "/admin-app/"],
  ["Editable Settings", "/admin-site-settings.html", "/admin-site-settings/"],
  ["Bookings", "/admin-booking.html", "/admin-booking/"],
  ["Leads", "/admin-leads.html", "/admin-leads/"],
  ["Payments", "/admin-payments.html", "/admin-payments/"],
  ["Media Health", "/admin-media-health.html", "/admin-media-health/"],
  ["SEO Tasks", "/admin-seo-tasks.html", "/admin-seo-tasks/"],
  ["Content", "/admin-content.html", "/admin-content/"],
  ["Social Queue", "/admin-social.html", "/admin-social/"]
];

export async function onRequestGet(context) { return handleReport(context); }
export async function onRequestPost(context) { return handleReport(context); }
export async function onRequestOptions() { return new Response("", { status: 204, headers: corsHeaders() }); }
export async function onRequestPut() { return withCors(methodNotAllowed()); }

async function handleReport({ request, env }) {
  try {
    const body = request?.method === "POST" ? await request.json().catch(() => ({})) : {};
    const access = await requireStaffAccess({ request, env, body, capability: "manage_staff", allowLegacyAdminFallback: true });
    if (!access.ok) return withCors(access.response);
    const origin = new URL(request.url).origin;
    const pairs = [];
    for (const [label, rootPath, routePath] of TARGETS) {
      pairs.push(await comparePair(origin, label, rootPath, routePath));
    }
    const outOfSync = pairs.filter((row) => row.status !== "ok").length;
    return withCors(json({ ok: true, build: "197", summary: { checked: pairs.length, out_of_sync: outOfSync, healthy: pairs.length - outOfSync }, pairs, recommendation: outOfSync ? "Copy the root HTML file to the folder index.html route copy before deploying." : "All checked route copies returned matching normalized HTML." }));
  } catch (err) {
    return withCors(json({ ok: true, build: "197", warning: err?.message || "Route-copy parity report could not run.", summary: { checked: 0, out_of_sync: 0 }, pairs: [] }));
  }
}

async function comparePair(origin, label, rootPath, routePath) {
  const root = await fetchText(origin + rootPath);
  const route = await fetchText(origin + routePath);
  const rootNorm = normalizeHtml(root.text);
  const routeNorm = normalizeHtml(route.text);
  const exact = root.ok && route.ok && rootNorm === routeNorm;
  return {
    label,
    root_path: rootPath,
    route_path: routePath,
    root_status: root.status,
    route_status: route.status,
    root_length: rootNorm.length,
    route_length: routeNorm.length,
    status: exact ? "ok" : (root.ok && route.ok ? "content_drift" : "fetch_warning"),
    note: exact ? "Root and route copy match." : "Route copy should be refreshed from the root HTML file."
  };
}
async function fetchText(url) {
  try {
    const res = await fetch(url, { headers: { "Cache-Control": "no-cache" } });
    return { ok: res.ok, status: res.status, text: await res.text().catch(() => "") };
  } catch (err) {
    return { ok: false, status: 0, text: "", warning: err?.message || "fetch failed" };
  }
}
function normalizeHtml(text) { return String(text || "").replace(/\s+/g, " ").replace(/data-build\d+="[^"]*"/g, "").trim(); }
function corsHeaders() { return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type, x-admin-password, x-staff-email, x-staff-user-id", "Cache-Control": "no-store" }; }
function withCors(response) { const headers = new Headers(response.headers || {}); for (const [k, v] of Object.entries(corsHeaders())) headers.set(k, v); return new Response(response.body, { status: response.status, statusText: response.statusText, headers }); }
