// Build 274 — authoritative I.T. integration catalogue + legacy social/analytics registry.
// This module reports configuration presence and safe setup metadata only.
// It never returns a raw secret, token, service-role key, webhook secret, or binding value.

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

const STORAGE = Object.freeze({
  secret: "Cloudflare Pages encrypted secret",
  variable: "Cloudflare Pages environment variable",
  binding: "Cloudflare Pages R2 binding",
  database: "Supabase application configuration",
  provider: "Provider console / account setting",
  external: "External control-plane integration; not stored in Rosie runtime"
});

function has(env, key) {
  const value = env?.[key];
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return Boolean(value.trim());
  return true;
}

function maskedPresence(env, key) {
  return has(env, key) ? "configured" : "missing";
}

function requirement(env, key, kind, options = {}) {
  return {
    key,
    kind,
    required: options.required !== false,
    conditional: options.conditional === true,
    status: maskedPresence(env, key),
    storage: options.storage || STORAGE[kind] || STORAGE.secret,
    obtain: options.obtain || "See the provider's official administrator console.",
    format: options.format || null,
    sensitivity: options.sensitivity || (kind === "secret" ? "secret" : "configuration"),
    purpose: options.purpose || null
  };
}

function coreRow(env, definition) {
  const required = (definition.required || []).map((item) => requirement(env, item.key, item.kind, item));
  const optional = (definition.optional || []).map((item) => requirement(env, item.key, item.kind, { ...item, required: false }));
  const alternatives = (definition.alternatives || []).map((group) => group.map((item) => requirement(env, item.key, item.kind, item)));
  const requiredReady = required.every((item) => item.status === "configured");
  const alternativeReady = alternatives.length === 0 || alternatives.some((group) => group.every((item) => item.status === "configured"));
  return {
    key: definition.key,
    label: definition.label,
    category: definition.category,
    lifecycle: definition.lifecycle || "active",
    configured: requiredReady && alternativeReady,
    required_variables: required,
    optional_variables: optional,
    alternative_variable_sets: alternatives,
    storage_note: definition.storage_note || null,
    obtain: definition.obtain || null,
    test: definition.test || null,
    callbacks_scopes: definition.callbacks_scopes || [],
    troubleshooting: definition.troubleshooting || [],
    current_mode: definition.current_mode || null
  };
}

const CORE_INTEGRATIONS = [
  {
    key: "supabase",
    label: "Supabase",
    category: "Primary application database and server-side service access",
    required: [
      { key: "SUPABASE_URL", kind: "variable", obtain: "Supabase project / Project Settings / API", purpose: "Project API base URL." },
      { key: "SUPABASE_SERVICE_ROLE_KEY", kind: "secret", obtain: "Supabase project / Project Settings / API keys", purpose: "Server-only service-role access used by canonical checkout and admin APIs." }
    ],
    optional: [
      { key: "SUPABASE_ANON_KEY", kind: "variable", obtain: "Supabase project / Project Settings / API keys", purpose: "Public/limited client key where a specific client path requires it." }
    ],
    test: "Use a Rosie authenticated read-only diagnostic or a bounded API health request; never print the service-role key.",
    troubleshooting: ["Confirm the Development Pages project points at the intended Supabase project.", "If a route says service credentials are unavailable, verify the exact canonical SUPABASE_SERVICE_ROLE_KEY name first."]
  },
  {
    key: "cloudflare_r2",
    label: "Cloudflare R2 public assets",
    category: "Media/object storage",
    alternatives: [
      [{ key: "ROSIE_PUBLIC_ASSETS_BUCKET", kind: "binding", obtain: "Cloudflare / Workers & Pages / Rosie project / Settings / Bindings / R2 bucket", purpose: "Preferred public asset bucket binding." }],
      [{ key: "PUBLIC_ASSETS_BUCKET", kind: "binding", obtain: "Cloudflare / Workers & Pages / Rosie project / Settings / Bindings / R2 bucket", purpose: "Accepted legacy alias." }],
      [{ key: "R2_PUBLIC_ASSETS_BUCKET", kind: "binding", obtain: "Cloudflare / Workers & Pages / Rosie project / Settings / Bindings / R2 bucket", purpose: "Accepted legacy alias." }],
      [{ key: "ASSETS_BUCKET", kind: "binding", obtain: "Cloudflare / Workers & Pages / Rosie project / Settings / Bindings / R2 bucket", purpose: "Accepted legacy alias." }]
    ],
    optional: [
      { key: "PUBLIC_ASSET_BASE_URL", kind: "variable", obtain: "Rosie asset-domain configuration", purpose: "Preferred public URL prefix for uploaded assets." },
      { key: "ASSETS_PUBLIC_BASE_URL", kind: "variable", obtain: "Rosie asset-domain configuration", purpose: "Accepted public URL prefix alias." }
    ],
    storage_note: "R2 bucket access is a Cloudflare binding, not a pasted token or Supabase setting.",
    test: "Use the authenticated media health/upload diagnostic with a harmless Development test asset, then confirm its public URL.",
    troubleshooting: ["A 501 'No R2 bucket binding is configured' means the Pages binding is absent or named incorrectly.", "Prefer ROSIE_PUBLIC_ASSETS_BUCKET for new configuration."]
  },
  {
    key: "stripe",
    label: "Stripe",
    category: "Card/deposit payment processing",
    required: [
      { key: "STRIPE_SECRET_KEY", kind: "secret", obtain: "Stripe Dashboard / Developers / API keys", purpose: "Server-side Stripe API access." }
    ],
    optional: [
      { key: "STRIPE_WEBHOOK_SECRET", kind: "secret", conditional: true, obtain: "Stripe Dashboard / Developers / Webhooks / Rosie booking endpoint", purpose: "Verifies booking/payment webhook signatures." },
      { key: "STRIPE_WEBHOOK_SECRET_QUOTES", kind: "secret", conditional: true, obtain: "Stripe Dashboard / Developers / Webhooks / quote endpoint", purpose: "Verifies quote-payment webhook signatures where that endpoint is retained." }
    ],
    test: "Use Stripe test mode and Rosie Development. Complete a test payment and verify the signed webhook updates the intended booking/quote only.",
    callbacks_scopes: ["Webhook signing secret must match the exact Development endpoint being tested."],
    troubleshooting: ["A configured API key does not prove webhook settlement works.", "Keep test and live keys/webhook secrets separated by environment."]
  },
  {
    key: "paypal",
    label: "PayPal",
    category: "Alternative payment processing",
    required: [
      { key: "PAYPAL_CLIENT_ID", kind: "secret", obtain: "PayPal Developer Dashboard / Apps & Credentials", purpose: "Server-side OAuth client identifier." },
      { key: "PAYPAL_CLIENT_SECRET", kind: "secret", obtain: "PayPal Developer Dashboard / Apps & Credentials", purpose: "Server-side OAuth client secret." }
    ],
    optional: [
      { key: "PAYPAL_WEBHOOK_ID", kind: "secret", conditional: true, obtain: "PayPal Developer Dashboard / Webhooks", purpose: "Required by the current webhook verifier before settlement can be trusted." },
      { key: "PAYPAL_API_BASE", kind: "variable", obtain: "Set only when intentionally overriding the default PayPal API environment.", purpose: "Optional API base override." }
    ],
    test: "Use PayPal Sandbox on Rosie Development; create/capture a sandbox order and verify a signed webhook against PAYPAL_WEBHOOK_ID.",
    callbacks_scopes: ["Webhook ID belongs to the exact webhook registered for the environment."],
    troubleshooting: ["Client credentials can be ready while webhook verification is still incomplete.", "Do not reuse live credentials in Development acceptance."]
  },
  {
    key: "email",
    label: "Email delivery",
    category: "Operational and recovery notifications",
    alternatives: [
      [{ key: "NOTIFICATIONS_EMAIL_WEBHOOK_URL", kind: "secret", obtain: "Chosen email delivery bridge/provider", purpose: "General notification email webhook." }],
      [{ key: "RECOVERY_EMAIL_WEBHOOK_URL", kind: "secret", obtain: "Chosen recovery email bridge/provider", purpose: "Recovery-specific email webhook." }]
    ],
    optional: [
      { key: "NOTIFICATIONS_PROVIDER_AUTH_TOKEN", kind: "secret", obtain: "Chosen notification bridge/provider", purpose: "Bearer token used when the provider endpoint expects one." },
      { key: "RECOVERY_PROVIDER_AUTH_TOKEN", kind: "secret", obtain: "Chosen recovery bridge/provider", purpose: "Recovery-provider bearer token." }
    ],
    storage_note: "Recovery provider rules may also be stored in Rosie application settings; secret values must remain server-side.",
    test: "Use the provider preview/test-recipient path with a non-customer Development recipient.",
    troubleshooting: ["Provider rules can disable dispatch even when a webhook variable exists.", "Do not place customer addresses or provider tokens in test notes."]
  },
  {
    key: "sms",
    label: "SMS delivery",
    category: "Operational and recovery text notifications",
    alternatives: [
      [{ key: "NOTIFICATIONS_SMS_WEBHOOK_URL", kind: "secret", obtain: "Chosen SMS delivery bridge/provider", purpose: "General notification SMS webhook." }],
      [{ key: "RECOVERY_SMS_WEBHOOK_URL", kind: "secret", obtain: "Chosen recovery SMS bridge/provider", purpose: "Recovery-specific SMS webhook." }]
    ],
    optional: [
      { key: "NOTIFICATIONS_PROVIDER_AUTH_TOKEN", kind: "secret", obtain: "Chosen notification bridge/provider", purpose: "Bearer token used when the provider endpoint expects one." },
      { key: "RECOVERY_PROVIDER_AUTH_TOKEN", kind: "secret", obtain: "Chosen recovery bridge/provider", purpose: "Recovery-provider bearer token." }
    ],
    storage_note: "Recovery provider rules may also be stored in Rosie application settings; secret values must remain server-side.",
    test: "Use the configured provider's Development/test-recipient path before any customer delivery.",
    troubleshooting: ["Confirm the provider rule is enabled and a webhook URL is configured.", "Use a test number and avoid real customer data during acceptance."]
  },
  {
    key: "web_push",
    label: "Web Push",
    category: "Browser push notifications",
    alternatives: [
      [
        { key: "NOTIFICATIONS_PUSH_WEBHOOK_URL", kind: "secret", obtain: "Chosen Web Push bridge/provider", purpose: "Explicit push provider webhook." },
        { key: "NOTIFICATIONS_PUSH_PROVIDER_AUTH_TOKEN", kind: "secret", obtain: "Chosen Web Push bridge/provider", purpose: "Auth token required by the explicit push webhook path." }
      ],
      [
        { key: "SUPABASE_URL", kind: "variable", obtain: "Supabase project / Project Settings / API", purpose: "Supabase Edge Function base." },
        { key: "SUPABASE_SERVICE_ROLE_KEY", kind: "secret", obtain: "Supabase project / Project Settings / API keys", purpose: "Server authorization for the current Supabase Web Push sender." }
      ]
    ],
    optional: [
      { key: "NOTIFICATIONS_PROVIDER_AUTH_TOKEN", kind: "secret", obtain: "Chosen notification bridge/provider", purpose: "Fallback bearer token for explicit provider dispatch." }
    ],
    storage_note: "The browser VAPID public key is read from Supabase application configuration; the private signing material is never returned by the Rosie browser API.",
    test: "Call the authenticated push-config readiness endpoint, subscribe a Development browser, then send a bounded test notification.",
    troubleshooting: ["A public VAPID key enables subscription; it does not by itself prove delivery.", "If no explicit push webhook exists, Rosie currently falls back to the Supabase Edge sender."]
  }
];

const PREPARED_INTEGRATIONS = [
  {
    key: "google_search_console",
    label: "Google Search Console",
    category: "SEO ownership, indexing and search performance",
    lifecycle: "prepared",
    configured: null,
    storage: STORAGE.external,
    obtain: "Google Search Console / Add property / verify rosiedazzlers.ca using the chosen ownership method.",
    current_mode: "No Rosie runtime secret is required for ordinary Search Console ownership. Add an API credential only when a reviewed server-side adapter actually needs one.",
    test: "Verify property ownership, sitemap discovery and URL Inspection in Google's console.",
    callbacks_scopes: [],
    troubleshooting: ["Do not invent or paste a Google API key into Rosie just to use Search Console."]
  },
  {
    key: "google_maps",
    label: "Google Maps Platform",
    category: "Maps/geocoding preparation",
    lifecycle: "prepared",
    configured: null,
    storage: STORAGE.external,
    obtain: "Google Cloud Console / APIs & Services after the exact Maps capability and billing boundary are approved.",
    current_mode: "No canonical Google Maps runtime credential was registered in the Build 274 source scan. Keep this as prepared work until an approved adapter defines the exact API and restriction model.",
    test: "When activated, test only the approved API from Development with HTTP/referrer or server restrictions applied.",
    callbacks_scopes: [],
    troubleshooting: ["Do not create an unrestricted browser API key."]
  },
  {
    key: "github",
    label: "GitHub",
    category: "Source control and deployment workflow",
    lifecycle: "active-control-plane",
    configured: null,
    storage: STORAGE.external,
    obtain: "GitHub repository/application settings and the Cloudflare Pages Git integration, not a routine Rosie Admin field.",
    current_mode: "GitHub is part of the development/deployment control plane. This catalogue does not infer or request a runtime personal access token when the application source does not require one.",
    test: "Verify the intended Development branch/deployment association and repository status without exposing account tokens.",
    callbacks_scopes: [],
    troubleshooting: ["Keep repository credentials out of site settings and browser code."]
  }
];

function trackingStatusRow(env, item) {
  const value = String(env?.[item.public_env] || "").trim();
  const valid = !value || !item.format || item.format.test(value);
  return {
    key: item.key,
    label: item.label,
    category: item.category,
    lifecycle: "active",
    variable: item.public_env,
    configured: Boolean(value),
    valid_format: valid,
    kind: "public_id",
    storage: STORAGE.variable,
    setup_path: item.setup_path,
    status_note: item.status_note,
    test: "Enable consented tracking in Development/test mode and verify with the provider's official diagnostic tool."
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
    lifecycle: "active-or-reviewed-handoff",
    configured,
    current_mode: item.current_mode,
    required_variables: required.map((key) => requirement(env, key, /TOKEN|SECRET/i.test(key) ? "secret" : "variable", { obtain: "Provider business/developer console for this connection." })),
    alternative_variable_sets: alternatives.map((group) => group.map((key) => requirement(env, key, /TOKEN|SECRET/i.test(key) ? "secret" : "variable", { obtain: "Provider business/developer console for this connection." }))),
    test: "Use a Development/test asset and the provider's official diagnostics; keep Social Queue approval-first.",
    callbacks_scopes: ["Provider permissions, OAuth scopes and account/page roles must be tested separately from variable presence."],
    troubleshooting: ["Configured means Rosie sees the required names; it does not prove provider authorization or publishing acceptance."]
  };
}

export function buildIntegrationStatus(env) {
  const mode = ["off", "test", "production"].includes(String(env?.MARKETING_TRACKING_MODE || "").toLowerCase())
    ? String(env?.MARKETING_TRACKING_MODE || "").toLowerCase()
    : "off";
  const enabled = String(env?.MARKETING_TRACKING_ENABLED || "").toLowerCase() === "true";
  const core = CORE_INTEGRATIONS.map((item) => coreRow(env, item));
  const tracking = TRACKING_PROVIDERS.map((item) => trackingStatusRow(env, item));
  const publishing = SOCIAL_PUBLISHING_PROVIDERS.map((item) => publishingStatusRow(env, item));
  const prepared = PREPARED_INTEGRATIONS.map((item) => ({ ...item }));
  return {
    catalogue_version: "274.1",
    mode,
    enabled,
    consent_required: true,
    core,
    tracking,
    publishing,
    prepared,
    configured_core_count: core.filter((item) => item.configured).length,
    configured_tracking_count: tracking.filter((item) => item.configured && item.valid_format).length,
    configured_publishing_count: publishing.filter((item) => item.configured).length,
    no_secrets_returned: true,
    release_boundary: "I.T. reports configuration presence and safe setup metadata only. Raw values, tokens, secrets, service-role keys and binding objects are never returned or accepted here."
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
