// File: /functions/api/admin/editable_navigation_link_scan.js
// Build 195: scan editable navigation/footer links for missing labels, unsupported hrefs, duplicates, and likely broken internal pages.

import { requireStaffAccess, json } from "../_lib/staff-auth.js";
import { fallbackForKey, loadEditableSetting } from "../_lib/editable-settings.js";

export async function onRequestGet({ request, env }) {
  const auth = await requireStaffAccess({ request, env, capability: "manage_staff", allowLegacyAdminFallback: true });
  if (!auth.ok) return auth.response;
  const loaded = await loadEditableSetting(env, "navigation_footer");
  const value = loaded?.value || fallbackForKey("navigation_footer");
  return json({ ok: true, build: "195", source_status: loaded?.source_status || "fallback", scan: scanLinks(value) });
}

function scanLinks(value) {
  const rows = [];
  const seen = new Set();
  const pools = [value.navigation, value.footer_links, value.links, value.footer?.links].filter(Array.isArray);
  pools.forEach((items, groupIndex) => items.forEach((item, index) => {
    const href = String(item?.href || item?.url || "").trim();
    const label = String(item?.label || item?.title || "").trim();
    const issues = [];
    if (!label) issues.push("missing_label");
    if (!href) issues.push("missing_href");
    else if (!href.startsWith("/") && !/^https?:\/\//i.test(href) && !/^mailto:/i.test(href) && !/^tel:/i.test(href)) issues.push("unsupported_href_format");
    if (href.startsWith("/") && !/\.(html|png|jpg|jpeg|webp|svg|pdf)$/i.test(href) && !href.includes("?") && href !== "/") issues.push("internal_clean_route_verify_after_deploy");
    const key = href.toLowerCase();
    if (key && seen.has(key)) issues.push("duplicate_href");
    if (key) seen.add(key);
    rows.push({ group_index: groupIndex, index, label, href, ok: issues.length === 0, issues });
  }));
  return { total_links: rows.length, issue_count: rows.filter((row) => !row.ok).length, links: rows };
}
