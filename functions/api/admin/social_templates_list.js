import { requireStaffAccess, serviceHeaders, json, methodNotAllowed, cleanText } from "../_lib/staff-auth.js";
import { withSocialCors, socialCorsHeaders } from "../_lib/social-dispatch.js";

const FALLBACK_CAPTION_TEMPLATES = [
  {
    template_key: "progress_general_southern_ontario",
    display_name: "Progress update - Southern Ontario",
    platform: null,
    service_area: "Southern Ontario",
    template_text: "Another Rosie Dazzlers progress update: {summary}\n\nServing Tillsonburg, Oxford County, Norfolk County, and nearby Southern Ontario communities.",
    default_hashtags: ["RosieDazzlers", "AutoDetailing", "SouthernOntario"],
    notes: "Built-in fallback until the Build 158/159 template tables are available. Build 193 also keeps this endpoint stable when optional filters are omitted."
  },
  {
    template_key: "before_after_oxford_norfolk",
    display_name: "Before/after proof - Oxford and Norfolk",
    platform: null,
    service_area: "Oxford and Norfolk Counties",
    template_text: "Before/after detail progress for a local Rosie Dazzlers job: {summary}\n\nServing Tillsonburg, Oxford County, Norfolk County, and nearby Southern Ontario communities.",
    default_hashtags: ["RosieDazzlers", "MobileDetailing", "OxfordCounty", "NorfolkCounty"],
    notes: "Built-in fallback for approved job-media proof posts."
  },
  {
    template_key: "winter_salt_cleanup",
    display_name: "Winter salt cleanup",
    platform: null,
    service_area: "Southern Ontario",
    template_text: "Southern Ontario roads can be hard on vehicles. Rosie Dazzlers progress update: {summary}\n\nAsk us about interior cleanup, salt residue, and seasonal protection.",
    default_hashtags: ["RosieDazzlers", "WinterDetailing", "SouthernOntario", "MobileAutoDetailing"],
    notes: "Seasonal local-service template."
  }
];

const FALLBACK_HASHTAG_PRESETS = [
  {
    preset_key: "rosie_local_core",
    display_name: "Rosie local core",
    platform: null,
    service_area: "Southern Ontario",
    hashtags: ["RosieDazzlers", "AutoDetailing", "MobileDetailing", "SouthernOntario"],
    notes: "Safe default hashtags for most progress drafts."
  },
  {
    preset_key: "rosie_oxford_norfolk",
    display_name: "Oxford/Norfolk local",
    platform: null,
    service_area: "Oxford and Norfolk Counties",
    hashtags: ["RosieDazzlers", "Tillsonburg", "OxfordCounty", "NorfolkCounty", "MobileAutoDetailing"],
    notes: "Local discovery hashtag preset for service-area proof posts."
  },
  {
    preset_key: "rosie_services_core",
    display_name: "Detailing services core",
    platform: null,
    service_area: "Southern Ontario",
    hashtags: ["InteriorDetailing", "ExteriorDetailing", "VehicleCare", "RosieDazzlers"],
    notes: "Service keyword hashtags for general detailing posts."
  }
];

export async function onRequestOptions() {
  return new Response("", { status: 204, headers: socialCorsHeaders() });
}

export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    const access = await requireStaffAccess({ request, env, capability: "manage_progress", allowLegacyAdminFallback: true });
    if (!access.ok) return withSocialCors(access.response);

    const url = new URL(request.url);
    const platform = String(cleanText(url.searchParams.get("platform")) || "").toLowerCase();
    const serviceArea = String(cleanText(url.searchParams.get("service_area")) || "").toLowerCase();
    const warnings = [];

    const [captionResult, hashtagResult] = await Promise.all([
      loadCaptionTemplates(env),
      loadHashtagPresets(env)
    ]);

    if (!captionResult.ok) warnings.push(captionResult.warning);
    if (!hashtagResult.ok) warnings.push(hashtagResult.warning);

    const captionTemplates = filterRows(captionResult.rows.length ? captionResult.rows : FALLBACK_CAPTION_TEMPLATES, platform, serviceArea);
    const hashtagPresets = filterRows(hashtagResult.rows.length ? hashtagResult.rows : FALLBACK_HASHTAG_PRESETS, platform, serviceArea);

    return withSocialCors(json({
      ok: true,
      caption_templates: captionTemplates.map(normalizeCaptionTemplate),
      hashtag_presets: hashtagPresets.map(normalizeHashtagPreset),
      warnings: warnings.filter(Boolean)
    }));
  } catch (err) {
    return withSocialCors(json({ ok: false, error: err?.message || "Could not load social templates." }, 500));
  }
}

export async function onRequestPost(context) {
  return onRequestGet(context);
}

export async function onRequestPut() {
  return withSocialCors(methodNotAllowed());
}

async function loadCaptionTemplates(env) {
  return loadRows(env, "social_caption_templates", "template_key,display_name,platform,service_area,template_text,default_hashtags,is_enabled,notes");
}

async function loadHashtagPresets(env) {
  return loadRows(env, "social_hashtag_presets", "preset_key,display_name,platform,service_area,hashtags,is_enabled,notes");
}

async function loadRows(env, table, select) {
  if (!env?.SUPABASE_URL || !env?.SUPABASE_SERVICE_ROLE_KEY) {
    return { ok: false, rows: [], warning: "Supabase service credentials are not configured; using built-in social templates." };
  }

  const params = new URLSearchParams();
  params.set("select", select);
  params.set("is_enabled", "eq.true");
  params.set("order", "display_name.asc");
  params.set("limit", "100");

  try {
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/${table}?${params.toString()}`, { headers: serviceHeaders(env) });
    if (!res.ok) return { ok: false, rows: [], warning: `${table} is not available yet; using built-in social templates.` };
    const rows = await res.json().catch(() => []);
    return { ok: true, rows: Array.isArray(rows) ? rows : [] };
  } catch (err) {
    return { ok: false, rows: [], warning: `${table} could not be loaded; using built-in social templates.` };
  }
}

function filterRows(rows, platform, serviceArea) {
  return rows.filter((row) => {
    const rowPlatform = String(cleanText(row.platform) || "").toLowerCase();
    const rowArea = String(cleanText(row.service_area) || "").toLowerCase();
    const platformOk = !platform || !rowPlatform || rowPlatform === platform;
    const areaOk = !serviceArea || !rowArea || rowArea.includes(serviceArea) || serviceArea.includes(rowArea);
    return platformOk && areaOk;
  });
}

function normalizeCaptionTemplate(row) {
  return {
    template_key: cleanText(row.template_key),
    display_name: cleanText(row.display_name || row.template_key || "Caption template"),
    platform: cleanText(row.platform) || null,
    service_area: cleanText(row.service_area) || null,
    template_text: cleanText(row.template_text),
    default_hashtags: normalizeTagArray(row.default_hashtags),
    notes: cleanText(row.notes) || null
  };
}

function normalizeHashtagPreset(row) {
  return {
    preset_key: cleanText(row.preset_key),
    display_name: cleanText(row.display_name || row.preset_key || "Hashtag preset"),
    platform: cleanText(row.platform) || null,
    service_area: cleanText(row.service_area) || null,
    hashtags: normalizeTagArray(row.hashtags),
    notes: cleanText(row.notes) || null
  };
}

function normalizeTagArray(value) {
  const raw = Array.isArray(value) ? value : String(value || "").split(/[\n,\s]+/);
  const seen = new Set();
  const out = [];
  for (const item of raw) {
    const tag = cleanText(item).replace(/^#/, "");
    if (!tag || seen.has(tag.toLowerCase())) continue;
    seen.add(tag.toLowerCase());
    out.push(tag);
  }
  return out.slice(0, 12);
}
