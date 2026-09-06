// Build 341 — Admin-only universal public page editor.
import { requireStaffAccess, serviceHeaders, json, methodNotAllowed } from "../_lib/staff-auth.js";

const SETTING_KEY = "public_page_editor";
const MAX_TEXT = 12000;
const MAX_KEY = 320;

export async function onRequestGet(context) {
  const access = await requireAdminEditor(context);
  if (!access.ok) return access.response;

  try {
    const page = normalizePagePath(new URL(context.request.url).searchParams.get("page") || "/");
    if (!page) return json({ ok: false, error: "Invalid public page path." }, 400);

    const setting = await loadSetting(context.env);
    return json({
      ok: true,
      can_edit: true,
      page,
      overrides: pageOverrides(setting.value, page),
      media: await loadApprovedMedia(context.env),
      actor: { email: access.actor?.email || null, role_code: access.actor?.role_code || null },
      updated_at: setting.updated_at || setting.value?.updated_at || null
    });
  } catch (error) {
    return json({ ok: false, error: error?.message || "Could not load page editor." }, 500);
  }
}

export async function onRequestPost(context) {
  const body = await context.request.json().catch(() => ({}));
  const access = await requireAdminEditor(context, body);
  if (!access.ok) return access.response;

  try {
    const page = normalizePagePath(body.page_path);
    const contentKey = normalizeContentKey(body.content_key);
    const kind = String(body.kind || "").trim().toLowerCase();
    if (!page) return json({ ok: false, error: "Invalid public page path." }, 400);
    if (!contentKey) return json({ ok: false, error: "Invalid content key." }, 400);
    if (!["text", "image", "link"].includes(kind)) return json({ ok: false, error: "Unsupported editor content kind." }, 400);

    const setting = await loadSetting(context.env);
    const next = normalizeSettingValue(setting.value);
    if (!next.pages[page] || typeof next.pages[page] !== "object") next.pages[page] = {};
    next.pages[page][contentKey] = {
      ...(await normalizeEntry(context.env, kind, body.value || {})),
      kind,
      updated_at: new Date().toISOString(),
      updated_by: access.actor?.email || access.actor?.id || "admin"
    };
    next.updated_at = new Date().toISOString();

    await saveSetting(context.env, next);
    return json({ ok: true, page, content_key: contentKey, override: next.pages[page][contentKey] });
  } catch (error) {
    return json({ ok: false, error: error?.message || "Could not save page edit." }, Number(error?.status || 500));
  }
}

export async function onRequestDelete(context) {
  const access = await requireAdminEditor(context);
  if (!access.ok) return access.response;

  try {
    const url = new URL(context.request.url);
    const page = normalizePagePath(url.searchParams.get("page"));
    const contentKey = normalizeContentKey(url.searchParams.get("content_key"));
    if (!page || !contentKey) return json({ ok: false, error: "Page and content_key are required." }, 400);

    const setting = await loadSetting(context.env);
    const next = normalizeSettingValue(setting.value);
    if (next.pages[page] && Object.prototype.hasOwnProperty.call(next.pages[page], contentKey)) {
      delete next.pages[page][contentKey];
      if (!Object.keys(next.pages[page]).length) delete next.pages[page];
      next.updated_at = new Date().toISOString();
      await saveSetting(context.env, next);
    }
    return json({ ok: true, page, content_key: contentKey, reset: true });
  } catch (error) {
    return json({ ok: false, error: error?.message || "Could not reset page edit." }, 500);
  }
}

export async function onRequestPut() { return methodNotAllowed(); }

async function requireAdminEditor({ request, env }, body = {}) {
  const access = await requireStaffAccess({
    request,
    env,
    body,
    capability: "manage_settings",
    allowLegacyAdminFallback: true
  });
  if (!access.ok) return access;
  const role = String(access.actor?.role_code || "").trim().toLowerCase();
  if (!access.actor?.is_admin && !access.actor?.is_legacy_admin && role !== "admin") {
    return { ok: false, response: json({ ok: false, error: "Page editing is restricted to administrators." }, 403) };
  }
  return access;
}

async function normalizeEntry(env, kind, raw) {
  if (kind === "text") {
    const text = String(raw.text ?? "").replace(/\u0000/g, "");
    if (text.length > MAX_TEXT) throw httpError(400, `Text exceeds ${MAX_TEXT} characters.`);
    return { text };
  }

  if (kind === "image") {
    const src = String(raw.src || "").trim();
    if (!src) throw httpError(400, "Choose an approved image.");
    const approved = await findApprovedMedia(env, src);
    if (!approved) throw httpError(400, "That image is not in the approved RosieDazzlers media library.");
    return {
      src: approved.media_url,
      alt: cleanLimited(raw.alt || approved.alt_text || approved.label || "Rosie Dazzlers detailing photo", 500),
      title: cleanLimited(raw.title || approved.label || "", 500),
      media_key: approved.media_key || null
    };
  }

  const text = cleanLimited(raw.text || "", 4000, false);
  const href = String(raw.href || "").trim();
  if (!isSafeHref(href)) throw httpError(400, "Link must be a local path, http/https URL, mailto, or tel link.");
  return { text, href };
}

async function loadSetting(env) {
  assertStorageEnv(env);
  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/app_management_settings?select=value,updated_at&key=eq.${SETTING_KEY}&limit=1`,
    { headers: serviceHeaders(env) }
  );
  if (!res.ok) throw new Error(`Page-editor setting read failed (${res.status}).`);
  const rows = await res.json().catch(() => []);
  const row = Array.isArray(rows) ? rows[0] || null : null;
  return row && row.value && typeof row.value === "object"
    ? row
    : { value: { version: 1, pages: {} }, updated_at: null };
}

async function saveSetting(env, value) {
  assertStorageEnv(env);
  const now = new Date().toISOString();
  const headers = serviceHeaders(env);

  await fetch(`${env.SUPABASE_URL}/rest/v1/app_management_setting_history`, {
    method: "POST",
    headers: { ...headers, Prefer: "return=minimal" },
    body: JSON.stringify([{ key: SETTING_KEY, value, created_at: now }])
  }).catch(() => null);

  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/app_management_settings?on_conflict=key`, {
    method: "POST",
    headers: { ...headers, Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify([{
      key: SETTING_KEY,
      value: { ...value, updated_at: now, source_status: "app_management_settings" },
      updated_at: now
    }])
  });
  if (!res.ok) throw new Error(await safeText(res) || "Could not save page editor setting.");
}

async function loadApprovedMedia(env) {
  const rows = await loadMediaRows(env);
  return rows.map(normalizeMediaRow).filter(Boolean).slice(0, 500);
}

async function findApprovedMedia(env, src) {
  const target = String(src || "").trim();
  if (!target) return null;
  const rows = await loadApprovedMedia(env);
  return rows.find((row) => row.media_url === target || row.fallback_url === target) || null;
}

async function loadMediaRows(env) {
  assertStorageEnv(env);
  const headers = serviceHeaders(env);
  try {
    const res = await fetch(
      `${env.SUPABASE_URL}/rest/v1/app_media_library?select=*&source_status=neq.archived&order=sort_order.asc,updated_at.desc&limit=500`,
      { headers }
    );
    if (res.ok) {
      const rows = await res.json().catch(() => []);
      if (Array.isArray(rows) && rows.length) return rows;
    }
  } catch {}

  try {
    const res = await fetch(
      `${env.SUPABASE_URL}/rest/v1/app_management_settings?select=value&key=eq.media_library&limit=1`,
      { headers }
    );
    if (!res.ok) return [];
    const rows = await res.json().catch(() => []);
    return flattenMediaSetting(Array.isArray(rows) && rows[0] ? rows[0].value : null);
  } catch { return []; }
}

function flattenMediaSetting(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (Array.isArray(value.media)) return value.media;
  if (Array.isArray(value.items)) return value.items;
  if (Array.isArray(value.images)) return value.images;
  if (Array.isArray(value.media_library)) return value.media_library;
  const groups = Array.isArray(value.media_groups) ? value.media_groups : [];
  return groups.flatMap((group) => (Array.isArray(group.images) ? group.images : []).map((image, index) => ({
    ...image,
    group_key: group.key || group.group_key || "",
    sort_order: image.sort_order ?? index
  })));
}

function normalizeMediaRow(row) {
  const mediaUrl = String(row?.media_url || row?.image_url || row?.url || row?.public_url || row?.fallback_url || "").trim();
  if (!mediaUrl || !/^https?:\/\//i.test(mediaUrl)) return null;
  const type = String(row?.media_type || row?.type || "image").trim().toLowerCase();
  if (!["image", "photo", ""].includes(type)) return null;
  return {
    id: row?.id || null,
    media_key: String(row?.media_key || row?.key || row?.slug || row?.id || mediaUrl),
    label: String(row?.label || row?.title || row?.alt_text || row?.caption || "Media image").trim(),
    media_url: mediaUrl,
    fallback_url: String(row?.fallback_url || "").trim(),
    alt_text: String(row?.alt_text || row?.alt || "").trim(),
    caption: String(row?.caption || "").trim(),
    group_key: String(row?.group_key || row?.group || row?.folder || "media").trim()
  };
}

function pageOverrides(value, page) {
  const pages = value?.pages && typeof value.pages === "object" ? value.pages : {};
  return pages[page] && typeof pages[page] === "object" ? pages[page] : {};
}

function normalizeSettingValue(value) {
  const sourcePages = value?.pages && typeof value.pages === "object" ? value.pages : {};
  return { version: 1, pages: JSON.parse(JSON.stringify(sourcePages)) };
}

function normalizePagePath(value) {
  let page = String(value || "").trim();
  if (!page) return "";
  page = page.split("?")[0].split("#")[0].replace(/\/{2,}/g, "/");
  if (!page.startsWith("/")) page = `/${page}`;
  if (page.length > 1) page = page.replace(/\/+$/, "");
  if (page.length > 180 || page.startsWith("/api") || page.startsWith("/admin")) return "";
  return page || "/";
}

function normalizeContentKey(value) {
  const key = String(value || "").trim();
  if (!key || key.length > MAX_KEY || !/^(text|image|link):/.test(key)) return "";
  if (/[^a-zA-Z0-9_:#.>\[\]()=\-]/.test(key)) return "";
  return key;
}

function isSafeHref(href) {
  if (!href) return false;
  if (href.startsWith("/") && !href.startsWith("//")) return true;
  return /^(https?:\/\/|mailto:|tel:)/i.test(href);
}

function assertStorageEnv(env) {
  if (!env?.SUPABASE_URL) throw new Error("Supabase page-editor storage is not configured.");
  const headers = serviceHeaders(env);
  if (!headers.apikey) throw new Error("Supabase service-role access is not configured.");
}

function cleanLimited(value, max, trim = true) {
  let text = String(value ?? "").replace(/\u0000/g, "");
  if (trim) text = text.trim();
  if (text.length > max) throw httpError(400, `Value exceeds ${max} characters.`);
  return text;
}

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

async function safeText(response) {
  try { return await response.text(); } catch { return ""; }
}
