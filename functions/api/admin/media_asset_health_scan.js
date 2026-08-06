// Build 216 — resilient public image health scan.
// Build 184 compatibility marker: this remains the Media Health scan introduced in Build 184.
// Uses bounded concurrent checks, compatible image format lookup, and optional
// server-side persistence for recurring public-media alerts. No browser/client
// data is recorded; only public asset metadata and staff audit context are stored.
import { requireStaffAccess, json, serviceHeaders } from "../_lib/staff-auth.js";

const BUILD = "216";
const PUBLIC_BASE = "https://assets.rosiedazzlers.ca/";
const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".webp", ".png", ".JPG", ".JPEG", ".WEBP", ".PNG"];
const FETCH_TIMEOUT_MS = 12_000;
const SCAN_CONCURRENCY = 6;
const READ_BYTES = 262_143;

const FALLBACK_ASSETS = [
  ["Pet Hair Removal", "packages/pet_hair_removal.png", "addon", 1200, 800, "1200x800 minimum, 1600x1067 preferred"],
  ["Odor Treatment", "packages/odor_treatment.png", "addon", 1200, 800, "1200x800 minimum"],
  ["Seat Shampoo", "packages/seat_shampoo.png", "addon", 1200, 800, "1200x800 minimum"],
  ["Carpet Shampoo", "packages/carpet_shampoo.png", "addon", 1200, 800, "1200x800 minimum"],
  ["Salt Stain Treatment", "packages/salt_stain_treatment.png", "addon", 1200, 800, "1200x800 minimum"],
  ["Headlight Restoration", "packages/headlight_restoration.png", "addon", 1200, 800, "1200x800 minimum"],
  ["Windshield Ceramic Coating", "packages/windshield_ceramic_coating.png", "addon", 1200, 800, "1200x800 minimum"],
  ["Ceramic Spray Protection", "packages/ceramic_spray_wax.png", "addon", 1200, 800, "1200x800 minimum"],
  ["Trim Restoration", "packages/trim_restoration.png", "addon", 1200, 800, "1200x800 minimum"],
  ["Bug and Tar Removal", "packages/bug_tar_removal.png", "addon", 1200, 800, "1200x800 minimum"],
  ["Truck Box Wash", "packages/truck_box_wash.png", "addon", 1200, 800, "1200x800 minimum"],
  ["Fleet Vehicle Add-on", "packages/fleet_vehicle_add_on.png", "addon", 1200, 800, "1200x800 minimum"],
  ["Tillsonburg local hero", "landing-pages/tillsonburg-auto-detailing.jpg", "regional", 1600, 900, "1600x900 preferred JPG/WebP"],
  ["Woodstock/Ingersoll local hero", "landing-pages/woodstock-ingersoll-auto-detailing.jpg", "regional", 1600, 900, "1600x900 preferred JPG/WebP"],
  ["Simcoe/Delhi local hero", "landing-pages/simcoe-delhi-auto-detailing.jpg", "regional", 1600, 900, "1600x900 preferred JPG/WebP"],
  ["Port Dover local hero", "landing-pages/port-dover-auto-detailing.jpg", "regional", 1600, 900, "1600x900 preferred JPG/WebP"],
  ["Norwich/Otterville local hero", "landing-pages/norwich-otterville-auto-detailing.jpg", "regional", 1600, 900, "1600x900 preferred JPG/WebP"],
  ["Zorra/Thamesford/Embro local hero", "landing-pages/zorra-thamesford-embro-auto-detailing.jpg", "regional", 1600, 900, "1600x900 preferred JPG/WebP"],
  ["Waterford/Vittoria local hero", "landing-pages/waterford-vittoria-auto-detailing.jpg", "regional", 1600, 900, "1600x900 preferred JPG/WebP"],
  ["Port Rowan/Turkey Point local hero", "landing-pages/port-rowan-turkey-point-auto-detailing.jpg", "regional", 1600, 900, "1600x900 preferred JPG/WebP"]
];

export async function onRequestPost({ request, env }) {
  return handle({ request, env, body: await request.json().catch(() => ({})) });
}
export async function onRequestGet({ request, env }) {
  return handle({ request, env, body: Object.fromEntries(new URL(request.url).searchParams.entries()) });
}

async function handle({ request, env, body }) {
  try {
    const access = await requireStaffAccess({ request, env, body, capability: "manage_bookings", allowLegacyAdminFallback: true });
    if (!access.ok) return access.response;
    const limit = Math.max(1, Math.min(200, Number(body.limit || 120) || 120));
    const assets = await loadAssets(env, request, limit);
    const rows = await mapWithConcurrency(assets.slice(0, limit), SCAN_CONCURRENCY, checkAsset);
    const missing = rows.filter((row) => !row.ok);
    const undersized = rows.filter((row) => row.ok && row.dimension_status === "too_small");
    const persistence = await persistScanObservations(env, rows, actorName(access.actor)).catch((error) => ({
      ok: false,
      warning: error?.message || "Persistent alert tracking is unavailable until the Build 216 migration is applied."
    }));
    return json({
      ok: true,
      build: BUILD,
      checked_count: rows.length,
      missing_count: missing.length,
      undersized_count: undersized.length,
      present_count: rows.length - missing.length,
      assets: rows,
      missing,
      undersized,
      upload_base: PUBLIC_BASE,
      dimension_validation: "bounded PNG/JPEG/WebP header scan with JPG/JPEG/WebP/PNG format-variant lookup",
      persistence,
      next_step: missing.length
        ? "Use the exact expected R2 key and resolved URL shown below. After two failed scans, the issue appears in Persistent public-media alerts."
        : (undersized.length ? "Replace undersized files with the size listed in IMAGES.md, then scan again." : "All checked public asset URLs responded and met known size rules.")
    });
  } catch (error) {
    return json({ ok: false, error: error?.message || "Could not scan media asset health." }, 500);
  }
}

async function loadAssets(env, request, limit) {
  const fromDb = await loadAssetsFromDb(env, limit).catch(() => []);
  const fromJson = await loadAssetsFromPublicJson(request, limit).catch(() => []);
  const merged = new Map();
  for (const item of [...fromJson, ...fromDb, ...fallbackAssets()]) {
    if (item.r2_key && !merged.has(item.r2_key)) merged.set(item.r2_key, item);
  }
  return [...merged.values()].slice(0, limit);
}

async function loadAssetsFromDb(env, limit) {
  if (!hasSupabaseConfig(env)) return [];
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/media_asset_tasks?select=label,category,r2_key,public_url,required_width,required_height,required_size,upload_method,status&status=neq.archived&order=sort_order.asc&limit=${limit}`, { headers: serviceHeaders(env) });
  const rows = res.ok ? await res.json().catch(() => []) : [];
  return Array.isArray(rows) ? rows.map(normalizeAsset) : [];
}

async function loadAssetsFromPublicJson(request, limit) {
  const origin = new URL(request.url).origin;
  const res = await fetch(`${origin}/data/media_requirements.json`, { cf: { cacheTtl: 0 } });
  if (!res.ok) throw new Error("media requirements JSON unavailable");
  const data = await res.json();
  const out = [];
  for (const item of data.required_assets || []) out.push(normalizeAsset(item));
  return out.slice(0, limit);
}

function fallbackAssets() {
  return FALLBACK_ASSETS.map(([label, key, category, required_width, required_height, required_size]) => normalizeAsset({ label, r2_key: key, category, required_width, required_height, required_size }));
}

function normalizeAsset(item) {
  const key = String(item.r2_key || item.key || "").replace(/^\/+/, "");
  const url = String(item.public_url || item.url || `${PUBLIC_BASE}${key}`);
  return {
    label: String(item.label || key),
    category: String(item.category || "media"),
    r2_key: key,
    url,
    required_width: Number(item.required_width || item.min_width || 0) || null,
    required_height: Number(item.required_height || item.min_height || 0) || null,
    required_size: String(item.required_size || item.requirement || "See IMAGES.md"),
    upload_method: String(item.upload_method || `Cloudflare R2 → upload ${key}`)
  };
}

function assetUrlCandidates(asset) {
  const primary = String(asset?.url || "").trim();
  const out = [];
  const add = (url) => { if (url && !out.includes(url)) out.push(url); };
  add(primary);
  try {
    const parsed = new URL(primary);
    if (/\.(?:png|jpe?g|webp)$/i.test(parsed.pathname)) {
      for (const ext of IMAGE_EXTENSIONS) {
        const candidate = new URL(parsed.href);
        candidate.pathname = candidate.pathname.replace(/\.(?:png|jpe?g|webp)$/i, ext);
        add(candidate.href);
      }
    }
  } catch {}
  return out;
}

async function checkAsset(asset) {
  const candidates = assetUrlCandidates(asset);
  let last = null;
  for (const url of candidates) {
    const checked = await fetchImageHeader(url);
    const dimensions = checked.bytes ? readImageDimensions(checked.bytes, checked.content_type) : null;
    const isImageLike = /^image\//i.test(checked.content_type || "") || !!dimensions;
    const dimensionStatus = checked.ok && dimensions && asset.required_width && asset.required_height
      ? (dimensions.width >= asset.required_width && dimensions.height >= asset.required_height ? "ok" : "too_small")
      : (checked.ok && dimensions ? "measured" : "unknown");
    const failureKind = !checked.ok
      ? classifyFailure(checked)
      : (!isImageLike ? "unexpected_content_type" : (dimensionStatus === "too_small" ? "undersized" : ""));
    const row = {
      ...asset,
      ok: checked.ok,
      status: checked.status,
      content_type: checked.content_type,
      content_length: checked.content_length,
      dimensions,
      dimension_status: dimensionStatus,
      issue: failureKind,
      failure_kind: failureKind,
      resolved_url: url,
      used_format_fallback: url !== asset.url,
      candidate_urls: candidates,
      timed_out: checked.timed_out === true
    };
    if (checked.ok && !failureKind) return row;
    last = row;
    // A public URL that returns a non-image document must not be treated as a valid compatible format.
    if (checked.ok && failureKind === "unexpected_content_type") break;
  }
  return last || { ...asset, ok: false, status: 0, issue: "no_candidate_url", failure_kind: "no_candidate_url", candidate_urls: candidates };
}

async function fetchImageHeader(url) {
  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS) : null;
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Range: `bytes=0-${READ_BYTES}`,
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8"
      },
      signal: controller?.signal,
      cf: { cacheTtl: 0 }
    });
    const bytes = res.ok ? new Uint8Array(await res.arrayBuffer()) : null;
    return {
      ok: res.ok,
      status: res.status,
      content_type: res.headers.get("content-type") || "",
      content_length: res.headers.get("content-length") || "",
      bytes,
      timed_out: false
    };
  } catch (error) {
    const timedOut = error?.name === "AbortError";
    return { ok: false, status: 0, content_type: "", content_length: "", bytes: null, timed_out: timedOut, error: error?.message || "Fetch failed" };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function classifyFailure(row) {
  if (row.timed_out) return "timeout";
  if (row.status === 404) return "not_found";
  if (row.status === 401 || row.status === 403) return "not_public";
  if (row.status >= 500) return "origin_error";
  if (row.status === 0) return "unreachable";
  return "unavailable";
}

async function mapWithConcurrency(values, limit, worker) {
  const out = new Array(values.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, values.length) }, async () => {
    while (next < values.length) {
      const current = next++;
      out[current] = await worker(values[current]);
    }
  });
  await Promise.all(workers);
  return out;
}

async function persistScanObservations(env, rows, actor) {
  if (!hasSupabaseConfig(env)) return { ok: false, warning: "Supabase is not configured; scan results are not persisted." };
  const payload = rows.map((row) => ({
    r2_key: row.r2_key,
    label: row.label,
    category: row.category,
    ok: row.ok === true,
    http_status: Number(row.status || 0),
    failure_kind: row.failure_kind || row.issue || null,
    expected_url: row.url,
    resolved_url: row.resolved_url || null,
    candidate_urls: row.candidate_urls || [],
    content_type: row.content_type || null,
    width: row.dimensions?.width || null,
    height: row.dimensions?.height || null,
    dimension_status: row.dimension_status || "unknown",
    used_format_fallback: row.used_format_fallback === true
  }));
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/rosie_record_media_asset_observations`, {
    method: "POST",
    headers: serviceHeaders(env),
    body: JSON.stringify({ p_rows: payload, p_actor: actor || null, p_scan_source: "admin_media_health" })
  });
  const text = await res.text();
  const data = safeJson(text);
  if (!res.ok) throw new Error(data?.message || data?.error || "Build 216 persistent alert tracking is unavailable until its SQL migration is applied.");
  return { ok: true, ...(data && typeof data === "object" ? data : {}) };
}

function actorName(actor) {
  return String(actor?.full_name || actor?.email || actor?.id || "staff").trim().slice(0, 180) || "staff";
}

function readImageDimensions(bytes) {
  if (!bytes || bytes.length < 12) return null;
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 && bytes.length >= 24) return { type: "png", width: u32(bytes, 16), height: u32(bytes, 20) };
  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    let i = 2;
    while (i + 9 < bytes.length) {
      if (bytes[i] !== 0xff) { i += 1; continue; }
      const marker = bytes[i + 1];
      const len = (bytes[i + 2] << 8) + bytes[i + 3];
      if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) return { type: "jpeg", height: (bytes[i + 5] << 8) + bytes[i + 6], width: (bytes[i + 7] << 8) + bytes[i + 8] };
      i += Math.max(2, len + 2);
    }
  }
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return readWebp(bytes);
  return null;
}
function readWebp(bytes) {
  const chunk = String.fromCharCode(bytes[12], bytes[13], bytes[14], bytes[15]);
  if (chunk === "VP8X" && bytes.length >= 30) return { type: "webp", width: 1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16), height: 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16) };
  if (chunk === "VP8 " && bytes.length >= 30) return { type: "webp", width: bytes[26] + ((bytes[27] & 0x3f) << 8), height: bytes[28] + ((bytes[29] & 0x3f) << 8) };
  if (chunk === "VP8L" && bytes.length >= 25) {
    const bits = bytes[21] | (bytes[22] << 8) | (bytes[23] << 16) | (bytes[24] << 24);
    return { type: "webp", width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  return { type: "webp" };
}
function u32(bytes, index) { return ((bytes[index] << 24) >>> 0) + (bytes[index + 1] << 16) + (bytes[index + 2] << 8) + bytes[index + 3]; }
function safeJson(value) { try { return JSON.parse(value); } catch { return null; } }
function hasSupabaseConfig(env) { return !!(env?.SUPABASE_URL && (env?.SUPABASE_SERVICE_ROLE_KEY || env?.SUPABASE_SERVICE_KEY || env?.SUPABASE_SERVICE_ROLE || env?.SUPABASE_SECRET_KEY)); }
