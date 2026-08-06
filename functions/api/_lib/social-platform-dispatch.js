import { cleanText } from "./staff-auth.js";

const DEFAULT_META_VERSION = "v20.0";

export async function attemptPlatformPublish({ env, post, actor }) {
  const platform = String(post?.platform || "manual").trim().toLowerCase();

  if (platform === "manual") {
    return {
      ok: false,
      unsupported: true,
      status: "ready",
      error: "Manual copy/paste channel selected. Open the draft, copy the caption/media, and mark it posted after publishing.",
      response_summary: { mode: "manual" }
    };
  }

  if (platform === "x") return publishToX({ env, post });
  if (platform === "facebook") return publishToFacebookPage({ env, post });
  if (platform === "instagram") return publishToInstagramBusiness({ env, post });

  if (env?.SOCIAL_DISPATCH_WEBHOOK_URL) {
    return publishViaWebhook({ env, post, actor, reason: `${platform} direct API publishing is not enabled in this bridge.` });
  }

  return {
    ok: false,
    unsupported: true,
    status: "failed",
    error: platformUnsupportedMessage(platform),
    response_summary: { mode: "unsupported", platform }
  };
}

export async function publishViaWebhook({ env, post, actor, reason = "" }) {
  if (!env?.SOCIAL_DISPATCH_WEBHOOK_URL) {
    return {
      ok: false,
      status: "failed",
      error: "SOCIAL_DISPATCH_WEBHOOK_URL is not configured.",
      response_summary: { mode: "webhook", configured: false }
    };
  }

  const response = await fetch(env.SOCIAL_DISPATCH_WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(env.SOCIAL_DISPATCH_WEBHOOK_SECRET ? { "x-social-dispatch-secret": env.SOCIAL_DISPATCH_WEBHOOK_SECRET } : {})
    },
    body: JSON.stringify({
      event: "rosie_social_post_publish",
      reason,
      post: normalizeOutboundPost(post),
      actor: { id: actor?.id || null, name: actor?.full_name || actor?.email || "Staff" }
    })
  });

  const text = await response.text().catch(() => "");
  if (!response.ok) {
    return {
      ok: false,
      status: "failed",
      error: text.slice(0, 500) || `Webhook returned HTTP ${response.status}.`,
      response_summary: { mode: "webhook", status: response.status, body: text.slice(0, 500) }
    };
  }

  let payload = null;
  try { payload = text ? JSON.parse(text) : null; } catch { payload = null; }

  return {
    ok: true,
    status: "posted",
    external_post_id: cleanText(payload?.id || payload?.post_id || payload?.external_post_id),
    external_post_url: cleanText(payload?.url || payload?.post_url || payload?.external_post_url),
    response_summary: { mode: "webhook", status: response.status, body: text.slice(0, 500) }
  };
}

async function publishToX({ env, post }) {
  const token = cleanText(env?.X_ACCESS_TOKEN || env?.X_USER_ACCESS_TOKEN || env?.X_BEARER_TOKEN);
  if (!token) {
    return {
      ok: false,
      status: "failed",
      error: "X_ACCESS_TOKEN is not configured. The draft remains available for manual posting or webhook dispatch.",
      response_summary: { mode: "x", configured: false }
    };
  }

  const text = clampSocialText(composeText({ ...post, public_url: post.public_url || firstMediaUrl(post) }), 280);
  const response = await fetch("https://api.x.com/2/tweets", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ text })
  });

  const payload = await safeJson(response);
  if (!response.ok) {
    return {
      ok: false,
      status: "failed",
      error: extractApiError(payload, `X API returned HTTP ${response.status}.`),
      response_summary: { mode: "x", status: response.status, body: summarizePayload(payload) }
    };
  }

  const id = cleanText(payload?.data?.id);
  return {
    ok: true,
    status: "posted",
    external_post_id: id,
    external_post_url: id ? `https://x.com/i/web/status/${encodeURIComponent(id)}` : "",
    response_summary: { mode: "x", status: response.status, body: summarizePayload(payload) }
  };
}

async function publishToFacebookPage({ env, post }) {
  const pageId = cleanText(env?.FACEBOOK_PAGE_ID || env?.META_FACEBOOK_PAGE_ID);
  const token = cleanText(env?.FACEBOOK_PAGE_ACCESS_TOKEN || env?.META_PAGE_ACCESS_TOKEN);
  if (!pageId || !token) {
    return {
      ok: false,
      status: "failed",
      error: "FACEBOOK_PAGE_ID and FACEBOOK_PAGE_ACCESS_TOKEN are required for Facebook Page API publishing.",
      response_summary: { mode: "facebook", configured: false }
    };
  }

  const version = cleanText(env?.META_GRAPH_VERSION) || DEFAULT_META_VERSION;
  const media = firstMediaUrl(post);
  const body = new URLSearchParams();
  body.set("access_token", token);

  let endpoint = `https://graph.facebook.com/${version}/${encodeURIComponent(pageId)}/feed`;
  if (media) {
    endpoint = `https://graph.facebook.com/${version}/${encodeURIComponent(pageId)}/photos`;
    body.set("url", media);
    body.set("caption", composeText(post));
    body.set("published", "true");
  } else {
    body.set("message", composeText(post));
    if (post.public_url) body.set("link", String(post.public_url));
  }

  const response = await fetch(endpoint, { method: "POST", body });
  const payload = await safeJson(response);
  if (!response.ok) {
    return {
      ok: false,
      status: "failed",
      error: extractApiError(payload, `Facebook Graph API returned HTTP ${response.status}.`),
      response_summary: { mode: "facebook", status: response.status, body: summarizePayload(payload) }
    };
  }

  const id = cleanText(payload?.post_id || payload?.id);
  return {
    ok: true,
    status: "posted",
    external_post_id: id,
    external_post_url: id ? `https://www.facebook.com/${encodeURIComponent(id)}` : "",
    response_summary: { mode: "facebook", status: response.status, body: summarizePayload(payload) }
  };
}

async function publishToInstagramBusiness({ env, post }) {
  const accountId = cleanText(env?.INSTAGRAM_BUSINESS_ACCOUNT_ID || env?.INSTAGRAM_IG_USER_ID || env?.META_INSTAGRAM_BUSINESS_ACCOUNT_ID);
  const token = cleanText(env?.INSTAGRAM_ACCESS_TOKEN || env?.META_PAGE_ACCESS_TOKEN || env?.FACEBOOK_PAGE_ACCESS_TOKEN);
  const media = firstMediaUrl(post);

  if (!accountId || !token) {
    return {
      ok: false,
      status: "failed",
      error: "INSTAGRAM_BUSINESS_ACCOUNT_ID and INSTAGRAM_ACCESS_TOKEN/META_PAGE_ACCESS_TOKEN are required for Instagram publishing.",
      response_summary: { mode: "instagram", configured: false }
    };
  }

  if (!media) {
    return {
      ok: false,
      status: "failed",
      error: "Instagram publishing requires at least one public image or video URL.",
      response_summary: { mode: "instagram", media_required: true }
    };
  }

  const version = cleanText(env?.META_GRAPH_VERSION) || DEFAULT_META_VERSION;
  const createBody = new URLSearchParams();
  createBody.set("access_token", token);
  createBody.set(isVideoUrl(media) ? "video_url" : "image_url", media);
  createBody.set("caption", composeText(post));
  if (isVideoUrl(media)) createBody.set("media_type", "REELS");

  const createRes = await fetch(`https://graph.facebook.com/${version}/${encodeURIComponent(accountId)}/media`, {
    method: "POST",
    body: createBody
  });
  const createPayload = await safeJson(createRes);
  if (!createRes.ok || !createPayload?.id) {
    return {
      ok: false,
      status: "failed",
      error: extractApiError(createPayload, `Instagram media container creation returned HTTP ${createRes.status}.`),
      response_summary: { mode: "instagram", step: "create_container", status: createRes.status, body: summarizePayload(createPayload) }
    };
  }

  const publishBody = new URLSearchParams();
  publishBody.set("access_token", token);
  publishBody.set("creation_id", createPayload.id);

  const publishRes = await fetch(`https://graph.facebook.com/${version}/${encodeURIComponent(accountId)}/media_publish`, {
    method: "POST",
    body: publishBody
  });
  const publishPayload = await safeJson(publishRes);
  if (!publishRes.ok) {
    return {
      ok: false,
      status: "failed",
      error: extractApiError(publishPayload, `Instagram publish returned HTTP ${publishRes.status}.`),
      response_summary: { mode: "instagram", step: "publish", status: publishRes.status, container_id: createPayload.id, body: summarizePayload(publishPayload) }
    };
  }

  const id = cleanText(publishPayload?.id);
  return {
    ok: true,
    status: "posted",
    external_post_id: id,
    external_post_url: id ? `https://www.instagram.com/p/${encodeURIComponent(id)}/` : "",
    response_summary: { mode: "instagram", status: publishRes.status, container_id: createPayload.id, body: summarizePayload(publishPayload) }
  };
}

function platformUnsupportedMessage(platform) {
  const names = {
    tiktok: "TikTok direct posting needs an approved TikTok app and Content Posting API wiring.",
    google_business_profile: "Google Business Profile posting should use webhook/manual publishing until the approved account/API flow is connected.",
    linkedin: "LinkedIn direct posting needs an approved LinkedIn app, access token, and author URN.",
    youtube_shorts: "YouTube Shorts publishing needs a YouTube Data API OAuth flow and video upload flow."
  };
  return names[platform] || `${platform} direct publishing is not wired yet. Use the webhook or manual fallback.`;
}

function normalizeOutboundPost(post) {
  return {
    id: post?.id || null,
    platform: post?.platform || "manual",
    status: post?.status || "draft",
    post_text: post?.post_text || "",
    media_urls: mediaUrls(post),
    public_url: post?.public_url || null,
    hashtags: Array.isArray(post?.hashtags) ? post.hashtags : [],
    booking_id: post?.booking_id || null,
    source_type: post?.source_type || null,
    source_id: post?.source_id || null
  };
}

function composeText(post) {
  const text = cleanText(post?.post_text);
  const publicUrl = cleanText(post?.public_url);
  if (publicUrl && !text.includes(publicUrl)) return `${text}\n\n${publicUrl}`.trim();
  return text || publicUrl || "Rosie Dazzlers job update.";
}

function clampSocialText(text, max) {
  const clean = cleanText(text);
  if (clean.length <= max) return clean;
  return `${clean.slice(0, Math.max(0, max - 1)).trim()}…`;
}

function mediaUrls(post) {
  if (Array.isArray(post?.media_urls)) return post.media_urls.map(cleanText).filter(Boolean);
  try {
    const parsed = JSON.parse(String(post?.media_urls || "[]"));
    return Array.isArray(parsed) ? parsed.map(cleanText).filter(Boolean) : [];
  } catch {
    return [];
  }
}

function firstMediaUrl(post) {
  return mediaUrls(post).find((url) => /^https?:\/\//i.test(url)) || "";
}

function isVideoUrl(url) {
  return /\.(mp4|mov|m4v|webm)(\?|#|$)/i.test(String(url || ""));
}

async function safeJson(response) {
  const text = await response.text().catch(() => "");
  if (!text) return null;
  try { return JSON.parse(text); } catch { return { raw: text.slice(0, 1000) }; }
}

function extractApiError(payload, fallback) {
  if (payload?.error?.message) return String(payload.error.message).slice(0, 500);
  if (Array.isArray(payload?.errors) && payload.errors[0]) {
    return String(payload.errors[0].detail || payload.errors[0].message || payload.errors[0].title || fallback).slice(0, 500);
  }
  if (payload?.raw) return String(payload.raw).slice(0, 500);
  return fallback;
}

function summarizePayload(payload) {
  if (!payload) return null;
  return JSON.parse(JSON.stringify(payload, (_, value) => {
    if (typeof value === "string" && value.length > 500) return `${value.slice(0, 500)}…`;
    return value;
  }));
}
