// Build 203 — desktop/mobile and visual polish diagnostics.
import { requireStaffAccess, json, methodNotAllowed } from "../_lib/staff-auth.js";

export async function onRequestGet(context) { return handleReport(context); }
export async function onRequestPost(context) { return handleReport(context); }
export async function onRequestOptions() { return new Response("", { status: 204, headers: corsHeaders() }); }
export async function onRequestPut() { return withCors(methodNotAllowed()); }

async function handleReport({ request, env }) {
  try {
    const body = request?.method === "POST" ? await request.json().catch(() => ({})) : {};
    const access = await requireStaffAccess({ request, env, body, capability: "manage_bookings", allowLegacyAdminFallback: true });
    if (!access.ok) return withCors(access.response);

    const origin = new URL(request.url).origin;
    const registry = await loadRegistry(origin);
    const pageChecks = await Promise.all([
      checkPage(origin, "/", "Homepage"),
      checkPage(origin, "/book", "Booking"),
      checkPage(origin, "/pricing", "Pricing"),
      checkPage(origin, "/services", "Services"),
      checkPage(origin, "/admin", "Admin dashboard"),
      checkPage(origin, "/admin-app", "Admin app")
    ]);
    const warnings = [];
    for (const page of pageChecks) warnings.push(...page.warnings.map((warning) => ({ page: page.label, warning })));
    const deviceTargets = Array.isArray(registry.device_targets) ? registry.device_targets : [];
    const visualSlots = Array.isArray(registry.visual_slots) ? registry.visual_slots : [];
    const activeSlots = visualSlots.filter((slot) => String(slot.status || "").includes("active")).length;
    return withCors(json({
      ok: true,
      build: "203",
      registry_source: registry.source || "bundled_json_fallback",
      summary: {
        checked_pages: pageChecks.length,
        pages_with_warnings: pageChecks.filter((page) => page.warnings.length).length,
        device_targets: deviceTargets.length,
        active_visual_slots: activeSlots,
        total_visual_slots: visualSlots.length
      },
      page_checks: pageChecks,
      device_targets: deviceTargets,
      visual_slots: visualSlots,
      warnings,
      recommendation: warnings.length
        ? "Review pages with mobile/visual warnings, then prioritize the booking path and the highest-traffic service pages."
        : "Desktop/mobile and visual polish checks look healthy for the sampled pages."
    }));
  } catch (err) {
    return withCors(json({ ok: true, build: "203", warning: err?.message || "Responsive visual report could not run.", summary: { checked_pages: 0, pages_with_warnings: 0 }, page_checks: [] }));
  }
}

async function loadRegistry(origin) {
  try {
    const res = await fetch(origin + "/data/responsive_visual_registry.json", { headers: { "Cache-Control": "no-cache" } });
    if (!res.ok) throw new Error("registry unavailable");
    return await res.json();
  } catch {
    return { source: "inline_fallback", device_targets: [], visual_slots: [], professional_effects: [] };
  }
}

async function checkPage(origin, path, label) {
  const out = { path, label, status: 0, ok: false, hasViewportMeta: false, h1Count: 0, imageCount: 0, warnings: [] };
  try {
    const res = await fetch(origin + path, { headers: { "Cache-Control": "no-cache" } });
    out.status = res.status;
    const html = await res.text().catch(() => "");
    out.ok = res.ok;
    out.hasViewportMeta = /<meta[^>]+name=["']viewport["']/i.test(html);
    out.h1Count = (html.match(/<h1\b/gi) || []).length;
    out.imageCount = (html.match(/<img\b/gi) || []).length;
    out.hasNavToggle = /id=["']navToggle["']|class=["'][^"']*nav-toggle/i.test(html);
    out.hasCss = /assets\/site\.css/i.test(html);
    if (!out.ok) out.warnings.push(`Fetch returned ${res.status}`);
    if (!out.hasViewportMeta) out.warnings.push("Missing viewport meta tag for mobile layout.");
    if (out.h1Count !== 1 && !path.startsWith("/admin")) out.warnings.push(`Public page has ${out.h1Count} H1 tags; keep one clear H1.`);
    if (!out.hasCss) out.warnings.push("Shared site CSS was not detected.");
    if (!out.imageCount && !path.startsWith("/admin")) out.warnings.push("No images detected; consider adding proof or brand imagery.");
    return out;
  } catch (err) {
    out.warnings.push(err?.message || "Fetch failed");
    return out;
  }
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-admin-password, x-staff-email, x-staff-user-id",
    "Cache-Control": "no-store"
  };
}
function withCors(response) { const headers = new Headers(response.headers || {}); for (const [k, v] of Object.entries(corsHeaders())) headers.set(k, v); return new Response(response.body, { status: response.status, statusText: response.statusText, headers }); }
