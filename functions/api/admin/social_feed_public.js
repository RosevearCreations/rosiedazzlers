import { requireStaffAccess, serviceHeaders, json, methodNotAllowed } from "../_lib/staff-auth.js";

const DEFAULT_SOCIAL_FEEDS = {
  platforms: [
    {
      key: "youtube",
      label: "YouTube",
      profile_url: "https://www.youtube.com/@rosiedazzlers/videos",
      intro: "Add the latest five YouTube uploads in App Management so the site always reflects your newest long-form videos.",
      items: []
    },
    {
      key: "instagram",
      label: "Instagram",
      profile_url: "https://www.instagram.com/rosiedazzlers/",
      intro: "Add the latest five Instagram posts or reels in App Management for the public social strip.",
      items: []
    },
    {
      key: "facebook",
      label: "Facebook",
      profile_url: "https://www.facebook.com/rosiedazzlers",
      intro: "Add the latest five Facebook posts in App Management.",
      items: []
    },
    {
      key: "tiktok",
      label: "TikTok",
      profile_url: "https://www.tiktok.com/@rosiedazzler",
      intro: "Add the latest five TikTok clips in App Management.",
      items: []
    },
    {
      key: "x",
      label: "X",
      profile_url: "https://x.com/RosieDazzlers",
      intro: "Add the latest five X posts in App Management.",
      items: []
    }
  ]
};

export async function onRequestGet({ request, env }) {
  const access = await requireStaffAccess({
    request,
    env,
    capability: "manage_settings",
    allowLegacyAdminFallback: true
  });
  if (!access.ok) return access.response;

  try {
    const socialFeeds = await loadSocialFeeds(env);
    return withCors(json({ ok: true, social_feeds: socialFeeds }));
  } catch (err) {
    return withCors(
      json(
        {
          ok: true,
          social_feeds: DEFAULT_SOCIAL_FEEDS,
          warning: err?.message || "Could not load saved social feeds; using fallback defaults."
        },
        200
      )
    );
  }
}

export async function onRequestOptions() {
  return new Response("", { status: 204, headers: corsHeaders() });
}

export async function onRequestPost() {
  return withCors(methodNotAllowed(["GET", "OPTIONS"]));
}

async function loadSocialFeeds(env) {
  const fallback = cloneSocialFeeds(DEFAULT_SOCIAL_FEEDS);
  if (!env?.SUPABASE_URL || !env?.SUPABASE_SERVICE_ROLE_KEY) return fallback;

  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/app_management_settings?select=value,updated_at&key=eq.social_feeds&limit=1`,
    { headers: serviceHeaders(env) }
  );

  if (!res.ok) return fallback;

  const rows = await res.json().catch(() => []);
  const row = Array.isArray(rows) ? rows[0] || null : null;
  return mergeSocialFeeds(fallback, row?.value);
}

function mergeSocialFeeds(fallback, raw) {
  const platforms = Array.isArray(raw?.platforms) ? raw.platforms : [];
  const byKey = new Map(platforms.map((row) => [String(row?.key || "").trim(), row]));

  return {
    platforms: fallback.platforms.map((base) => {
      const incoming = byKey.get(base.key) || {};
      const items = Array.isArray(incoming.items) ? incoming.items.slice(0, 5) : [];
      return {
        ...base,
        ...incoming,
        key: base.key,
        label: incoming.label || base.label,
        profile_url: incoming.profile_url || base.profile_url,
        intro: incoming.intro || base.intro,
        items: items.map((item, idx) => ({
          title: String(item?.title || `${base.label} update ${idx + 1}`),
          url: String(item?.url || base.profile_url || "#"),
          summary: String(item?.summary || ""),
          published_at: item?.published_at || null,
          thumbnail_url: item?.thumbnail_url || ""
        }))
      };
    })
  };
}

function cloneSocialFeeds(value) {
  return JSON.parse(JSON.stringify(value));
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-admin-password, x-staff-email, x-staff-user-id",
    "Cache-Control": "no-store"
  };
}

function withCors(response) {
  const headers = new Headers(response.headers || {});
  for (const [key, value] of Object.entries(corsHeaders())) headers.set(key, value);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
