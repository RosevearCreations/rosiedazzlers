import { requireStaffAccess, serviceHeaders, json, methodNotAllowed } from "../_lib/staff-auth.js";

export async function onRequestOptions() {
  return new Response("", { status: 204, headers: corsHeaders() });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  try {
    const access = await requireStaffAccess({
      request,
      env,
      capability: "manage_staff",
      allowLegacyAdminFallback: true
    });
    if (!access.ok) return withCors(access.response);

    const url = new URL(request.url);
    const usageContext = cleanText(url.searchParams.get("usage_context"));
    const groupKey = cleanText(url.searchParams.get("group_key"));
    const mediaType = cleanText(url.searchParams.get("media_type") || "image").toLowerCase();

    const warnings = [];
    let media = [];

    const dbRows = await loadMediaLibraryTable(env, warnings);
    if (dbRows.length) media = dbRows;

    if (!media.length) {
      const settingRows = await loadMediaLibrarySetting(env, warnings);
      if (settingRows.length) media = settingRows;
    }

    media = media
      .map(normalizeMediaRow)
      .filter(Boolean)
      .filter((row) => !usageContext || row.usage_contexts.includes(usageContext) || row.group_key === usageContext)
      .filter((row) => !groupKey || row.group_key === groupKey)
      .filter((row) => !mediaType || row.media_type === mediaType || (mediaType === "image" && ["photo", "image"].includes(row.media_type)))
      .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0) || String(a.label || "").localeCompare(String(b.label || "")));

    return withCors(json({ ok: true, media, warnings }));
  } catch (err) {
    return withCors(json({ error: err?.message || String(err) }, 500));
  }
}

export async function onRequestPost(context) {
  return onRequestGet(context);
}

export async function onRequestPut() {
  return withCors(methodNotAllowed());
}

async function loadMediaLibraryTable(env, warnings) {
  if (!env?.SUPABASE_URL || !env?.SUPABASE_SERVICE_ROLE_KEY) return [];
  try {
    const res = await fetch(
      `${env.SUPABASE_URL}/rest/v1/app_media_library?select=*&source_status=neq.archived&order=sort_order.asc,updated_at.desc&limit=500`,
      { headers: serviceHeaders(env) }
    );
    if (!res.ok) {
      warnings.push(`app_media_library table not available: ${await res.text()}`);
      return [];
    }
    const rows = await res.json().catch(() => []);
    return Array.isArray(rows) ? rows : [];
  } catch (err) {
    warnings.push(`app_media_library table read failed: ${err?.message || err}`);
    return [];
  }
}

async function loadMediaLibrarySetting(env, warnings) {
  if (!env?.SUPABASE_URL || !env?.SUPABASE_SERVICE_ROLE_KEY) return [];
  try {
    const res = await fetch(
      `${env.SUPABASE_URL}/rest/v1/app_management_settings?select=key,value,updated_at&key=eq.media_library&limit=1`,
      { headers: serviceHeaders(env) }
    );
    if (!res.ok) {
      warnings.push(`media_library app setting not available: ${await res.text()}`);
      return [];
    }
    const rows = await res.json().catch(() => []);
    const value = Array.isArray(rows) && rows[0] ? rows[0].value : null;
    return flattenSettingValue(value);
  } catch (err) {
    warnings.push(`media_library app setting read failed: ${err?.message || err}`);
    return [];
  }
}

function flattenSettingValue(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (Array.isArray(value.media)) return value.media;
  if (Array.isArray(value.items)) return value.items;
  if (Array.isArray(value.images)) return value.images;
  if (Array.isArray(value.media_library)) return value.media_library;
  const groups = Array.isArray(value.media_groups) ? value.media_groups : [];
  return groups.flatMap((group) => {
    const images = Array.isArray(group.images) ? group.images : [];
    return images.map((image, index) => ({ ...image, group_key: group.key || group.group_key || "", sort_order: image.sort_order ?? index }));
  });
}

function normalizeMediaRow(row) {
  const mediaUrl = cleanText(row?.media_url || row?.image_url || row?.url || row?.public_url || row?.fallback_url);
  if (!mediaUrl) return null;
  const usage = normalizeList(row?.usage_contexts || row?.usage || row?.contexts || row?.tags);
  const mediaType = cleanText(row?.media_type || row?.type || "image").toLowerCase();
  return {
    id: cleanText(row?.id),
    media_key: cleanText(row?.media_key || row?.key || row?.slug || row?.id || mediaUrl),
    label: cleanText(row?.label || row?.title || row?.alt_text || row?.caption || row?.media_key || "Media image"),
    media_type: mediaType === "photo" ? "image" : mediaType,
    media_url: mediaUrl,
    fallback_url: cleanText(row?.fallback_url),
    alt_text: cleanText(row?.alt_text || row?.alt),
    caption: cleanText(row?.caption),
    group_key: cleanText(row?.group_key || row?.group || row?.folder || "media"),
    usage_contexts: usage.length ? usage : ["inventory_item"],
    source_status: cleanText(row?.source_status || row?.status || "active"),
    sort_order: Number(row?.sort_order || 0),
    updated_at: cleanText(row?.updated_at)
  };
}

function normalizeList(value) {
  if (Array.isArray(value)) return value.map(cleanText).filter(Boolean);
  return String(value || "").split(/[\n,]/).map(cleanText).filter(Boolean);
}

function cleanText(value) {
  return String(value == null ? "" : value).trim();
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-admin-password, x-staff-email, x-staff-user-id",
    "Cache-Control": "no-store"
  };
}

function withCors(response) {
  const headers = new Headers(response.headers || {});
  for (const [key, value] of Object.entries(corsHeaders())) headers.set(key, value);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
