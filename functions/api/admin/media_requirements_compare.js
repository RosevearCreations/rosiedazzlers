// File: /functions/api/admin/media_requirements_compare.js
// Build 195: compare DB/editor media requirements with bundled fallback requirements before restore or force-sync.

import { requireStaffAccess, json } from "../_lib/staff-auth.js";
import { fallbackForKey, loadEditableSetting } from "../_lib/editable-settings.js";

export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => ({}));
  const auth = await requireStaffAccess({ request, env, body, capability: "manage_staff", allowLegacyAdminFallback: true });
  if (!auth.ok) return auth.response;
  const current = body.value && typeof body.value === "object" ? body.value : (await loadEditableSetting(env, "media_requirements")).value || {};
  return json({ ok: true, build: "195", compare: compareMedia(current, fallbackForKey("media_requirements")) });
}
export async function onRequestGet({ request, env }) { return onRequestPost({ request: new Request(request.url, { method: "POST", headers: request.headers, body: JSON.stringify({}) }), env }); }
function compareMedia(current, fallback) {
  const cur = byKey(current?.required_assets || []);
  const fb = byKey(fallback?.required_assets || []);
  const keys = new Set([...Object.keys(cur), ...Object.keys(fb)]);
  const added = [], removed = [], changed = [];
  for (const key of Array.from(keys).sort()) {
    if (cur[key] && !fb[key]) added.push(cur[key]);
    else if (!cur[key] && fb[key]) removed.push(fb[key]);
    else if (JSON.stringify(cur[key]) !== JSON.stringify(fb[key])) changed.push({ key, current: cur[key], fallback: fb[key] });
  }
  return { current_count: Object.keys(cur).length, fallback_count: Object.keys(fb).length, added_count: added.length, removed_count: removed.length, changed_count: changed.length, added: added.slice(0, 50), removed: removed.slice(0, 50), changed: changed.slice(0, 50) };
}
function byKey(rows) { const out = {}; (Array.isArray(rows) ? rows : []).forEach((row, index) => { const key = String(row?.r2_key || row?.url || row?.label || `row_${index}`).toLowerCase(); out[key] = row; }); return out; }
