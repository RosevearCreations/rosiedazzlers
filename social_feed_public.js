import { serviceHeaders } from "./_lib/staff-auth.js";

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

export async function onRequestGet({ env }) {
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
  const merged = mergeSocialFeeds(fallback, row?.value);
  return merged;
}

function mergeSocialFeeds(fallback, candidate) {
  const base = cloneSocialFeeds(fallback);
  if (!candidate || typeof candidate !== "object") return base;

  const candidatePlatforms = Array.isArray(candidate.platforms) ? candidate.platforms : [];
  const map = new Map(candidatePlatforms.map((platform) => [String(platform?.key || "").trim().toLowerCase(), platform]));

  base.platforms = base.platforms.map((platform) => {
    const override = map.get(String(platform.key || "").trim().toLowerCase()) || null;
    return normalizePlatform({ ...platform, ...(override || {}) }, platform);
  });

  const extras = candidatePlatforms
    .filter((platform) => !base.platforms.some((basePlatform) => String(basePlatform.key).toLowerCase() === String(platform?.key || "").trim().toLowerCase()))
    .map((platform) => normalizePlatform(platform, {}))
    .filter(Boolean);

  base.platforms.push(...extras);
  return base;
}

function normalizePlatform(platform, fallbackPlatform = {}) {
  const key = String(platform?.key || fallbackPlatform?.key || "").trim();
  if (!key) return null;
  const items = Array.isArray(platform?.items) ? platform.items : Array.isArray(fallbackPlatform?.items) ? fallbackPlatform.items : [];
  return {
    key,
    label: String(platform?.label || fallbackPlatform?.label || key),
    profile_url: String(platform?.profile_url || fallbackPlatform?.profile_url || "").trim(),
    intro: String(platform?.intro || fallbackPlatform?.intro || "").trim(),
    items: items
      .filter((item) => item && typeof item === "object")
      .map((item) => ({
        title: String(item.title || "Latest update").trim(),
        caption: String(item.caption || "").trim(),
        url: String(item.url || "").trim(),
        published_at: String(item.published_at || "").trim()
      }))
      .filter((item) => item.url)
      .slice(0, 5)
  };
}

function cloneSocialFeeds(payload) {
  return JSON.parse(JSON.stringify(payload || DEFAULT_SOCIAL_FEEDS));
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
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
