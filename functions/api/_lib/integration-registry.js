// Build 225 — Social/analytics integration registry.
// This file intentionally holds only variable names, provider labels, and setup guidance.
// It never returns a secret value or accepts secrets from a browser request.

export const TRACKING_PROVIDERS = [
  {
    key: "meta_pixel",
    label: "Meta Pixel",
    category: "Website measurement and remarketing",
    public_env: "META_PIXEL_ID",
    format: /^(\d{6,30})$/,
    status_note: "Pixel ID only. Keep Conversions API tokens server-side and do not put customer booking, payment, VIN, or address data into browser events.",
    setup_path: "Meta Business Suite / Events Manager / Data sources / Add / Web / Meta Pixel"
  },
  {
    key: "google_analytics",
    label: "Google Analytics 4",
    category: "Website analytics",
    public_env: "GA4_MEASUREMENT_ID",
    format: /^G-[A-Z0-9]{6,20}$/i,
    status_note: "Measurement ID only. No Google client secret belongs in website code.",
    setup_path: "Google Analytics / Admin / Data collection and modification / Data streams / Web"
  },
  {
    key: "google_ads",
    label: "Google Ads tag",
    category: "Advertising measurement",
    public_env: "GOOGLE_ADS_CONVERSION_ID",
    format: /^AW-\d{6,20}$/i,
    status_note: "Use the conversion ID here. Individual conversion labels are documented for a later consented conversion-event pass.",
    setup_path: "Google Ads / Goals / Conversions / Summary / Tag setup"
  },
  {
    key: "tiktok_pixel",
    label: "TikTok Pixel",
    category: "Website measurement and remarketing",
    public_env: "TIKTOK_PIXEL_ID",
    format: /^[A-Za-z0-9_-]{8,64}$/,
    status_note: "Pixel ID only. Events API credentials remain server-side and are not in scope for this release.",
    setup_path: "TikTok Ads Manager / Tools / Events Manager / Web Events"
  },
  {
    key: "linkedin_insight",
    label: "LinkedIn Insight Tag",
    category: "Website measurement and professional retargeting",
    public_env: "LINKEDIN_PARTNER_ID",
    format: /^\d{4,20}$/,
    status_note: "Partner ID only. Do not upload contact lists or enable matched audiences without a separate consent review.",
    setup_path: "LinkedIn Campaign Manager / Account assets / Insight Tag"
  },
  {
    key: "pinterest_tag",
    label: "Pinterest Tag",
    category: "Website measurement and visual discovery",
    public_env: "PINTEREST_TAG_ID",
    format: /^\d{4,20}$/,
    status_note: "Tag ID only. Keep any conversion API access token server-side.",
    setup_path: "Pinterest Ads Manager / Conversions / Pinterest Tag"
  },
  {
    key: "microsoft_uet",
    label: "Microsoft Advertising UET",
    category: "Search advertising measurement",
    public_env: "MICROSOFT_UET_TAG_ID",
    format: /^\d{4,24}$/,
    status_note: "UET tag ID only. This project does not use any Microsoft Advertising secret in the browser.",
    setup_path: "Microsoft Advertising / Tools / Conversion goals / UET tags"
  }
];

export const SOCIAL_PUBLISHING_PROVIDERS = [
  {
    key: "facebook_page",
    label: "Facebook Page publishing",
    category: "Social queue direct publishing",
    required_env: ["FACEBOOK_PAGE_ID", "FACEBOOK_PAGE_ACCESS_TOKEN"],
    current_mode: "Direct attempt supported after social review approval."
  },
  {
    key: "instagram_business",
    label: "Instagram Business publishing",
    category: "Social queue direct publishing",
    alternatives: [
      ["INSTAGRAM_BUSINESS_ACCOUNT_ID", "INSTAGRAM_ACCESS_TOKEN"],
      ["INSTAGRAM_IG_USER_ID", "META_PAGE_ACCESS_TOKEN"],
      ["META_INSTAGRAM_BUSINESS_ACCOUNT_ID", "META_PAGE_ACCESS_TOKEN"]
    ],
    current_mode: "Direct attempt supported after social review approval."
  },
  {
    key: "x",
    label: "X publishing",
    category: "Social queue direct publishing",
    required_env: ["X_USER_ACCESS_TOKEN"],
    current_mode: "Current bridge can attempt a direct post where its token scope supports it; media/premium API requirements are provider-dependent."
  },
  {
    key: "tiktok_publishing",
    label: "TikTok publishing",
    category: "Social queue",
    required_env: ["TIKTOK_CLIENT_KEY", "TIKTOK_ACCESS_TOKEN"],
    current_mode: "Credential readiness is detected, but current production path remains manual or webhook-dispatch until a separately reviewed direct-publish adapter is approved."
  },
  {
    key: "linkedin_publishing",
    label: "LinkedIn publishing",
    category: "Social queue",
    required_env: ["LINKEDIN_AUTHOR_URN", "LINKEDIN_ACCESS_TOKEN"],
    current_mode: "Credential readiness is detected, but current production path remains manual or webhook-dispatch until a separately reviewed direct-publish adapter is approved."
  },
  {
    key: "youtube_shorts",
    label: "YouTube Shorts",
    category: "Social queue",
    required_env: ["YOUTUBE_ACCESS_TOKEN"],
    alternatives: [["GOOGLE_OAUTH_ACCESS_TOKEN"]],
    current_mode: "Credential readiness is detected, but current production path remains manual or webhook-dispatch until a separately reviewed video-publish adapter is approved."
  },
  {
    key: "google_business_profile",
    label: "Google Business Profile",
    category: "Local profile publishing",
    required_env: ["GOOGLE_BUSINESS_PROFILE_LOCATION_NAME", "GOOGLE_OAUTH_ACCESS_TOKEN"],
    current_mode: "Use the Social Queue as a reviewed manual/webhook handoff until a separately reviewed Business Profile adapter is approved."
  }
];

function has(env, key) {
  return Boolean(String(env?.[key] || "").trim());
}

function maskedPresence(env, key) {
  return has(env, key) ? "configured" : "missing";
}

function trackingStatusRow(env, item) {
  const value = String(env?.[item.public_env] || "").trim();
  const valid = !value || !item.format || item.format.test(value);
  return {
    key: item.key,
    label: item.label,
    category: item.category,
    variable: item.public_env,
    configured: Boolean(value),
    valid_format: valid,
    setup_path: item.setup_path,
    status_note: item.status_note
  };
}

function publishingStatusRow(env, item) {
  const required = Array.isArray(item.required_env) ? item.required_env : [];
  const alternatives = Array.isArray(item.alternatives) ? item.alternatives : [];
  const requiredReady = required.length ? required.every((key) => has(env, key)) : false;
  const alternativeReady = alternatives.some((group) => group.every((key) => has(env, key)));
  const configured = requiredReady || alternativeReady;
  return {
    key: item.key,
    label: item.label,
    category: item.category,
    configured,
    current_mode: item.current_mode,
    required_variables: required.map((key) => ({ key, status: maskedPresence(env, key) })),
    alternative_variable_sets: alternatives.map((group) => group.map((key) => ({ key, status: maskedPresence(env, key) })))
  };
}

export function buildIntegrationStatus(env) {
  const mode = ["off", "test", "production"].includes(String(env?.MARKETING_TRACKING_MODE || "").toLowerCase())
    ? String(env?.MARKETING_TRACKING_MODE || "").toLowerCase()
    : "off";
  const enabled = String(env?.MARKETING_TRACKING_ENABLED || "").toLowerCase() === "true";
  const tracking = TRACKING_PROVIDERS.map((item) => trackingStatusRow(env, item));
  const publishing = SOCIAL_PUBLISHING_PROVIDERS.map((item) => publishingStatusRow(env, item));
  return {
    mode,
    enabled,
    consent_required: true,
    tracking,
    publishing,
    configured_tracking_count: tracking.filter((item) => item.configured && item.valid_format).length,
    configured_publishing_count: publishing.filter((item) => item.configured).length,
    no_secrets_returned: true,
    release_boundary: "This screen reports configuration presence only. It never shows values or accepts credentials in the browser."
  };
}

export function buildPublicTrackingConfig(env) {
  const enabled = String(env?.MARKETING_TRACKING_ENABLED || "").toLowerCase() === "true";
  const mode = ["test", "production"].includes(String(env?.MARKETING_TRACKING_MODE || "").toLowerCase())
    ? String(env?.MARKETING_TRACKING_MODE || "").toLowerCase()
    : "off";

  const providers = {};
  if (enabled && mode !== "off") {
    for (const item of TRACKING_PROVIDERS) {
      const value = String(env?.[item.public_env] || "").trim();
      if (!value || (item.format && !item.format.test(value))) continue;
      providers[item.key] = { id: value, mode };
    }
  }

  return {
    ok: true,
    enabled: enabled && mode !== "off" && Object.keys(providers).length > 0,
    mode,
    consent_required: true,
    config_version: String(env?.MARKETING_TRACKING_CONSENT_VERSION || "1").slice(0, 32),
    providers,
    note: "Only public tag identifiers are returned. Tokens, client secrets, webhook secrets, and service-role credentials are never returned."
  };
}
