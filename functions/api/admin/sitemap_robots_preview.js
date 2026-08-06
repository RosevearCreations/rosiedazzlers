// File: /functions/api/admin/sitemap_robots_preview.js
// Build 195: preview sitemap/robots candidates from editable navigation and landing-page content.

import { requireStaffAccess, json } from "../_lib/staff-auth.js";
import { loadEditableSetting } from "../_lib/editable-settings.js";

const ORIGIN = "https://rosiedazzlers.ca";

export async function onRequestGet({ request, env }) {
  const auth = await requireStaffAccess({ request, env, capability: "manage_staff", allowLegacyAdminFallback: true });
  if (!auth.ok) return auth.response;
  const [nav, landing] = await Promise.all([loadEditableSetting(env, "navigation_footer"), loadEditableSetting(env, "landing_pages_content")]);
  const paths = new Set(["/", "/services", "/pricing", "/book", "/contact", "/gallery", "/help"]);
  collectPaths(nav.value, paths);
  collectLandingPaths(landing.value, paths);
  const sorted = Array.from(paths).filter((path) => path.startsWith("/")).sort();
  const sitemap = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">', ...sorted.map((path) => `  <url><loc>${ORIGIN}${path}</loc></url>`), '</urlset>'].join("\n");
  const robots = [`User-agent: *`, `Allow: /`, `Sitemap: ${ORIGIN}/sitemap.xml`].join("\n");
  return json({ ok: true, build: "195", origin: ORIGIN, url_count: sorted.length, paths: sorted, sitemap_preview: sitemap, robots_preview: robots, warnings: sorted.some((p) => /admin|login|account/i.test(p)) ? ["Review sitemap paths; admin/account-like paths should not be public indexed."] : [] });
}
function collectPaths(value, out) { if (Array.isArray(value)) return value.forEach((item) => collectPaths(item, out)); if (value && typeof value === "object") { const href = value.href || value.url || value.path; if (typeof href === "string" && href.startsWith("/")) out.add(href); Object.values(value).forEach((v) => collectPaths(v, out)); } }
function collectLandingPaths(value, out) { const rows = Array.isArray(value?.pages) ? value.pages : Array.isArray(value?.landing_pages) ? value.landing_pages : []; rows.forEach((row) => { const path = row?.path || row?.url || row?.href || row?.slug; if (typeof path === "string" && path) out.add(path.startsWith("/") ? path : `/${path}`); }); }
