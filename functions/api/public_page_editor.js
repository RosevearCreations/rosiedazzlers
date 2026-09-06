// Build 341 — Public page-editor overrides, scoped to the exact requested public path.
import { serviceHeaders, json } from "./_lib/staff-auth.js";

const SETTING_KEY = "public_page_editor";

export async function onRequestGet({ request, env }) {
  try {
    const url = new URL(request.url);
    const page = normalizePagePath(url.searchParams.get("page") || "/");
    if (!page) return json({ ok: false, error: "Invalid public page path." }, 400);

    const setting = await loadSetting(env);
    const pages = setting?.value?.pages && typeof setting.value.pages === "object" ? setting.value.pages : {};
    const overrides = pages[page] && typeof pages[page] === "object" ? pages[page] : {};

    return json({
      ok: true,
      page,
      version: Number(setting?.value?.version || 1),
      overrides,
      updated_at: setting?.updated_at || setting?.value?.updated_at || null
    }, 200, { "Cache-Control": "no-store" });
  } catch (error) {
    return json({ ok: false, error: error?.message || "Could not load page overrides." }, 500, { "Cache-Control": "no-store" });
  }
}

async function loadSetting(env) {
  if (!env?.SUPABASE_URL || !env?.SUPABASE_SERVICE_ROLE_KEY) return { value: { version: 1, pages: {} } };
  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/app_management_settings?select=value,updated_at&key=eq.${SETTING_KEY}&limit=1`,
    { headers: serviceHeaders(env) }
  );
  if (!res.ok) return { value: { version: 1, pages: {} } };
  const rows = await res.json().catch(() => []);
  const row = Array.isArray(rows) ? rows[0] || null : null;
  return row && row.value && typeof row.value === "object" ? row : { value: { version: 1, pages: {} } };
}

function normalizePagePath(value) {
  let page = String(value || "/").trim();
  try {
    if (/^https?:\/\//i.test(page)) page = new URL(page).pathname;
  } catch { return ""; }
  page = page.split("?")[0].split("#")[0].replace(/\/{2,}/g, "/");
  if (!page.startsWith("/")) page = `/${page}`;
  if (page.length > 1) page = page.replace(/\/+$/, "");
  if (page.length > 180 || page.startsWith("/api") || page.startsWith("/admin")) return "";
  return page || "/";
}
