// Build 274 — provider-specific acquisition help for I.T. Connections.
// This browser catalogue contains instructions only. Never place credential values in this file.
(function attachRosieITExternalHelp(globalScope) {
  const cloudflareSecretStorage = [
    "Open Cloudflare Dashboard and select Workers & Pages.",
    "Open the Rosie Dazzlers Pages project for the environment you are configuring (Development or Production).",
    "Open Settings, then Variables and Secrets.",
    "Add the exact variable name shown in the I.T. card. Choose encrypted/secret storage for tokens, passwords, signing secrets and service-role credentials.",
    "Save the change and redeploy that environment before testing; a newly added runtime value is not available to an already-running deployment."
  ];

  const cloudflareVariableStorage = [
    "Open Cloudflare Dashboard and select Workers & Pages.",
    "Open the Rosie Dazzlers Pages project for the correct environment.",
    "Open Settings, then Variables and Secrets.",
    "Add the exact variable name shown by Rosie as a non-secret environment variable.",
    "Save and redeploy before testing."
  ];

  const secretSecurity = "Treat this as a server secret. Do not paste it into GitHub source, browser JavaScript, Site Settings, Social Queue notes, screenshots, Markdown evidence or customer records. Keep Development/test and Production/live values separate.";
  const oauthSecurity = "Treat access and refresh tokens as server secrets. Grant only the scopes Rosie actually needs, keep Development and Production authorization separate where the provider supports it, and revoke/rotate credentials when access is no longer required.";

  function docs(label, url) {
    return { label, url };
  }

  function merge(base, extra) {
    return Object.freeze({ ...base, ...extra, integration: false });
  }

  const entries = {
    SUPABASE_URL: merge({
      title: "SUPABASE_URL",
      what: "The HTTPS API URL for the Supabase project Rosie should use in this environment.",
      changes: "Changing it points Rosie server requests at a different Supabase project, so an incorrect value can connect Development to Production data or vice versa.",
      why: "Rosie's server APIs need the project URL before they can reach the intended database/auth project.",
      source: "Supabase Dashboard for the exact project assigned to this Rosie environment.",
      setup: [
        "Sign in to Supabase and open the correct Rosie project.",
        "Open the project's Connect dialog or Project Settings / API area.",
        "Copy the project URL (the https://...supabase.co value), not a database password or Postgres connection string.",
        ...cloudflareVariableStorage
      ],
      format: "HTTPS project URL, normally https://<project-ref>.supabase.co",
      storage: "Cloudflare Pages environment variable named SUPABASE_URL.",
      test: ["Redeploy Rosie Development.", "Run the authenticated read-only Supabase/application health diagnostic.", "Confirm the diagnostic identifies the intended Development project and does not expose credentials."],
      troubleshooting: ["If requests return DNS/404 errors, recheck the project URL.", "If data appears to come from the wrong environment, stop and verify the project reference before any write test."],
      official: [docs("Supabase API key and project connection guidance", "https://supabase.com/docs/guides/getting-started/api-keys")]
    }, {}),

    SUPABASE_SERVICE_ROLE_KEY: merge({
      title: "SUPABASE_SERVICE_ROLE_KEY",
      what: "Rosie's current canonical server-only Supabase service-role credential.",
      changes: "It authorizes trusted Rosie server routes to perform privileged database operations. A wrong or missing key causes protected backend paths to fail.",
      why: "Current Rosie checkout/admin server code still expects this exact legacy service-role variable name.",
      source: "Supabase Dashboard / Settings / API Keys / Legacy API Keys for the matching project.",
      setup: [
        "Open the correct Supabase project for this environment.",
        "Open Settings / API Keys.",
        "Open the Legacy API Keys section and locate service_role. Rosie currently expects the legacy service-role value under SUPABASE_SERVICE_ROLE_KEY.",
        "Reveal/copy it only on a trusted computer. Do not use the anon/publishable key in this server-secret field.",
        ...cloudflareSecretStorage
      ],
      prerequisites: ["You must have administrative access to the correct Supabase project.", "Do not migrate this field to Supabase's newer secret-key format until Rosie's server helper is explicitly migrated and regression-tested."],
      storage: "Cloudflare Pages encrypted secret named SUPABASE_SERVICE_ROLE_KEY.",
      security: secretSecurity + " This key bypasses Row Level Security and must never reach the browser.",
      test: ["Redeploy Development after changing it.", "Run a bounded authenticated server diagnostic that requires service access.", "Verify success without printing the key or returning it in JSON."],
      troubleshooting: ["401/403 or 'service credentials unavailable' errors usually mean the value is missing, wrong, or belongs to another project.", "Verify SUPABASE_URL and this key belong to the same Supabase project."],
      official: [docs("Supabase API keys", "https://supabase.com/docs/guides/getting-started/api-keys"), docs("Supabase key migration guidance", "https://supabase.com/docs/guides/getting-started/migrating-to-new-api-keys")]
    }, {}),

    SUPABASE_ANON_KEY: merge({
      title: "SUPABASE_ANON_KEY",
      what: "The current legacy low-privilege Supabase client key used only by Rosie paths that explicitly require it.",
      changes: "It changes which Supabase project/client authority a limited client path can reach.",
      why: "Some older client integrations may still reference the canonical legacy anon key even though newer Supabase publishable keys now exist.",
      source: "Supabase Dashboard / Settings / API Keys / Legacy API Keys.",
      setup: ["Open the correct Supabase project.", "Open Settings / API Keys / Legacy API Keys.", "Copy anon, not service_role.", ...cloudflareVariableStorage],
      storage: "Cloudflare Pages environment variable named SUPABASE_ANON_KEY when a Rosie path actually requires it.",
      security: "This key is lower privilege than service_role, but still keep project/environment boundaries correct. Do not substitute it for SUPABASE_SERVICE_ROLE_KEY.",
      official: [docs("Supabase API keys", "https://supabase.com/docs/guides/getting-started/api-keys")]
    }, {}),

    ROSIE_PUBLIC_ASSETS_BUCKET: merge({
      title: "ROSIE_PUBLIC_ASSETS_BUCKET",
      what: "The preferred Cloudflare Pages R2 bucket binding used by Rosie media/object-storage routes.",
      changes: "It determines which R2 bucket Rosie reads/writes for public assets in this environment.",
      why: "Rosie needs a bound bucket object; this is not an API-token text value.",
      source: "Cloudflare R2 bucket plus the Pages project's Bindings configuration.",
      setup: [
        "Create or identify the correct R2 bucket for this environment in Cloudflare R2.",
        "Open Cloudflare / Workers & Pages / the Rosie Pages project.",
        "Open Settings / Bindings and choose Add binding / R2 bucket.",
        "Set the binding variable name to exactly ROSIE_PUBLIC_ASSETS_BUCKET.",
        "Select the intended R2 bucket and save.",
        "Redeploy the Pages project so the binding is present in Functions runtime."
      ],
      storage: "Cloudflare Pages R2 binding named ROSIE_PUBLIC_ASSETS_BUCKET; do not paste a token into Variables and Secrets.",
      test: ["Use a harmless Development media upload/health test.", "Confirm the object is written to the intended Development bucket and the expected public URL resolves."],
      troubleshooting: ["A 'No R2 bucket binding is configured' error usually means the binding is absent, misspelled, or the deployment predates the binding.", "Prefer this canonical name over legacy aliases for new configuration."],
      official: [docs("Cloudflare Pages R2 bindings", "https://developers.cloudflare.com/pages/functions/bindings/")]
    }, {}),

    PUBLIC_ASSETS_BUCKET: null,
    R2_PUBLIC_ASSETS_BUCKET: null,
    ASSETS_BUCKET: null,

    PUBLIC_ASSET_BASE_URL: merge({
      title: "PUBLIC_ASSET_BASE_URL",
      what: "The preferred public URL prefix Rosie uses when converting stored R2 object keys into browser-accessible asset URLs.",
      changes: "Changing it changes the public hostname/prefix returned for uploaded assets.",
      why: "An R2 binding stores objects, but public pages also need an approved URL that can serve those objects.",
      source: "The public/custom domain configured for Rosie's public asset bucket.",
      setup: ["Confirm the R2 bucket's public/custom domain in Cloudflare.", "Verify that a known harmless object resolves over HTTPS.", "Copy only the stable base URL/prefix.", ...cloudflareVariableStorage],
      format: "HTTPS URL prefix such as https://assets.example.ca/",
      storage: "Cloudflare Pages environment variable named PUBLIC_ASSET_BASE_URL.",
      test: ["Upload a Development test asset.", "Confirm Rosie returns a URL beneath this prefix and that the asset loads without exposing private objects."],
      official: [docs("Cloudflare R2 public buckets/custom domains", "https://developers.cloudflare.com/r2/data-access/public-buckets/")]
    }, {}),
    ASSETS_PUBLIC_BASE_URL: null,

    STRIPE_SECRET_KEY: merge({
      title: "STRIPE_SECRET_KEY",
      what: "The server-side Stripe API key Rosie uses for card/deposit payment operations.",
      changes: "It selects the Stripe account and mode used by Rosie server payment calls.",
      why: "Rosie cannot create or verify Stripe server operations without an authorized secret key.",
      source: "Stripe Dashboard / Developers / API keys for the correct test or live mode.",
      setup: ["Open Stripe Dashboard and select Test mode for Development or Live mode for Production.", "Open Developers / API keys.", "Reveal/copy the secret key for that mode; do not use the publishable key in this field.", ...cloudflareSecretStorage],
      prerequisites: ["Development must use Stripe test-mode credentials.", "Production must use live credentials only after deliberate payment acceptance/promotion."],
      storage: "Cloudflare Pages encrypted secret named STRIPE_SECRET_KEY.",
      security: secretSecurity,
      test: ["Use Rosie Development with Stripe test mode.", "Complete a bounded test payment using Stripe's test data.", "Verify the expected booking/quote changes only after the signed webhook is accepted."],
      troubleshooting: ["A valid API key does not prove settlement acceptance; STRIPE_WEBHOOK_SECRET is also required for the verified webhook path."],
      official: [docs("Stripe API keys", "https://docs.stripe.com/keys"), docs("Stripe webhooks", "https://docs.stripe.com/webhooks")]
    }, {}),

    STRIPE_WEBHOOK_SECRET: merge({
      title: "STRIPE_WEBHOOK_SECRET",
      what: "The preferred signing secret used to verify that Stripe webhook events reaching Rosie are authentic.",
      changes: "Changing it changes which Stripe webhook endpoint signature Rosie trusts.",
      why: "Rosie must verify signed settlement events before treating a payment as trusted.",
      source: "Stripe Dashboard / Developers / Webhooks / the exact Rosie endpoint for this environment.",
      setup: ["Open Stripe Dashboard in the correct mode.", "Open Developers / Webhooks.", "Create or open the webhook endpoint that targets Rosie's Stripe webhook URL for this environment.", "Select only the events required by Rosie's payment flow.", "Reveal the endpoint's signing secret (whsec_...).", ...cloudflareSecretStorage],
      callbacks: ["The webhook endpoint URL and signing secret are a matched pair. Development and Production require separate endpoint configuration/secrets."],
      storage: "Cloudflare Pages encrypted secret named STRIPE_WEBHOOK_SECRET.",
      security: secretSecurity,
      test: ["Send a Stripe test event to the Development endpoint.", "Confirm Rosie accepts a valid signature and rejects a deliberately invalid signature.", "Complete one bounded test payment and verify settlement updates the intended record."],
      official: [docs("Stripe webhooks", "https://docs.stripe.com/webhooks")]
    }, {}),
    STRIPE_WEBHOOK_SECRET_QUOTES: null,

    PAYPAL_CLIENT_ID: merge({
      title: "PAYPAL_CLIENT_ID",
      what: "The OAuth client identifier for Rosie's PayPal REST application.",
      changes: "It selects which PayPal app Rosie authenticates as.",
      why: "Rosie needs the client ID together with the client secret to obtain PayPal REST access tokens.",
      source: "PayPal Developer Dashboard / Apps & Credentials for Sandbox or Live.",
      setup: ["Open PayPal Developer Dashboard.", "Choose Sandbox for Development or Live for Production.", "Create/open the Rosie REST app under Apps & Credentials.", "Copy the Client ID for that environment.", ...cloudflareSecretStorage],
      storage: "Cloudflare Pages encrypted secret named PAYPAL_CLIENT_ID (Rosie currently treats it as protected server configuration).",
      security: secretSecurity,
      test: ["Use PayPal Sandbox for Development.", "Confirm Rosie can obtain a PayPal OAuth access token without logging the client secret.", "Then continue with sandbox order/capture and webhook verification."],
      official: [docs("PayPal REST authentication", "https://developer.paypal.com/api/rest/authentication/")]
    }, {}),

    PAYPAL_CLIENT_SECRET: merge({
      title: "PAYPAL_CLIENT_SECRET",
      what: "The PayPal REST app secret paired with PAYPAL_CLIENT_ID.",
      changes: "It authorizes Rosie to exchange the app credentials for PayPal REST access tokens.",
      why: "Current Rosie PayPal order capture requires this exact canonical variable name.",
      source: "PayPal Developer Dashboard / Apps & Credentials for the same app and environment as PAYPAL_CLIENT_ID.",
      setup: ["Open the Rosie PayPal app in the correct Sandbox/Live environment.", "Reveal/copy the Client Secret for that app.", "Verify it belongs to the same Client ID recorded for this environment.", ...cloudflareSecretStorage],
      storage: "Cloudflare Pages encrypted secret named PAYPAL_CLIENT_SECRET.",
      security: secretSecurity,
      test: ["Use Sandbox in Development and request an OAuth token through Rosie's server path.", "Do not print the secret or returned OAuth token in browser diagnostics."],
      official: [docs("PayPal REST authentication", "https://developer.paypal.com/api/rest/authentication/")]
    }, {}),

    PAYPAL_WEBHOOK_ID: merge({
      title: "PAYPAL_WEBHOOK_ID",
      what: "The identifier assigned by PayPal to the webhook subscription for Rosie's callback URL.",
      changes: "It tells Rosie's verifier which PayPal webhook registration should be trusted for signature verification.",
      why: "Current Rosie settlement logic requires this ID before PayPal webhook events can be trusted.",
      source: "PayPal Developer Dashboard / the Rosie app / Webhooks.",
      setup: ["Open the Rosie PayPal app in Sandbox for Development or Live for Production.", "Add/open the webhook whose listener URL is Rosie's PayPal webhook endpoint for that environment.", "Select the payment/order events required by Rosie.", "Save the webhook and copy its Webhook ID.", ...cloudflareSecretStorage],
      callbacks: ["The Webhook ID must belong to the exact environment-specific listener URL. Do not reuse a Sandbox webhook ID in Production."],
      storage: "Cloudflare Pages encrypted secret named PAYPAL_WEBHOOK_ID.",
      security: secretSecurity,
      test: ["Use PayPal Sandbox to generate a test order/capture event.", "Confirm the Rosie webhook endpoint verifies the message using this Webhook ID and updates only the expected Development record."],
      official: [docs("PayPal webhooks", "https://developer.paypal.com/api/rest/webhooks/rest/")]
    }, {}),

    PAYPAL_API_BASE: merge({
      title: "PAYPAL_API_BASE",
      what: "Optional override for the PayPal REST API hostname.",
      changes: "It changes whether Rosie talks to PayPal Sandbox or Live when the code path honors the override.",
      why: "It can make the environment boundary explicit during testing, but it is optional in the current registry.",
      source: "PayPal's official Sandbox/Live REST endpoints.",
      setup: ["For Development use https://api-m.sandbox.paypal.com when an explicit override is desired.", "For Production use https://api-m.paypal.com only after deliberate promotion.", ...cloudflareVariableStorage],
      format: "HTTPS base URL only; no path-specific endpoint.",
      storage: "Cloudflare Pages environment variable named PAYPAL_API_BASE.",
      security: "This value is not itself secret, but an incorrect Production/Sandbox choice can cross the intended payment boundary.",
      official: [docs("PayPal REST authentication", "https://developer.paypal.com/api/rest/authentication/")]
    }, {}),

    NOTIFICATIONS_EMAIL_WEBHOOK_URL: null,
    RECOVERY_EMAIL_WEBHOOK_URL: null,
    NOTIFICATIONS_SMS_WEBHOOK_URL: null,
    RECOVERY_SMS_WEBHOOK_URL: null,
    NOTIFICATIONS_PUSH_WEBHOOK_URL: null,
    NOTIFICATIONS_PROVIDER_AUTH_TOKEN: null,
    RECOVERY_PROVIDER_AUTH_TOKEN: null,
    NOTIFICATIONS_PUSH_PROVIDER_AUTH_TOKEN: null,

    META_PIXEL_ID: merge({
      title: "META_PIXEL_ID",
      what: "The public Meta Pixel identifier used by Rosie's consent-gated website measurement layer.",
      changes: "It changes which Meta data source receives consented public-site measurement events.",
      why: "Rosie can use it for approved website measurement/remarketing without exposing a Meta server token in browser code.",
      source: "Meta Events Manager / Data Sources / Meta Pixel.",
      setup: ["Open Meta Business Suite / Events Manager.", "Choose or create the Rosie web data source / Meta Pixel.", "Open its settings/details and copy the numeric Pixel ID.", ...cloudflareVariableStorage],
      format: "Numeric Meta Pixel ID.",
      storage: "Cloudflare Pages environment variable named META_PIXEL_ID.",
      security: "The Pixel ID is not a server secret. Conversions API tokens are different credentials and must remain server-side if Rosie later adds them.",
      test: ["Keep marketing tracking in Development/test mode with consent enabled.", "Use Meta Pixel Helper/Events Manager diagnostics on approved public pages only."],
      official: [docs("Meta Pixel documentation", "https://developers.facebook.com/docs/meta-pixel/")]
    }, {}),

    GA4_MEASUREMENT_ID: merge({
      title: "GA4_MEASUREMENT_ID",
      what: "The public Google Analytics 4 web-stream Measurement ID.",
      changes: "It changes which GA4 web data stream receives Rosie's consented public-site analytics events.",
      why: "Rosie uses it for public website measurement while keeping internal/admin/customer workflows outside marketing tracking.",
      source: "Google Analytics / Admin / Data streams / the Rosie web stream.",
      setup: ["Open Google Analytics and select the Rosie property.", "Open Admin / Data collection and modification / Data streams.", "Open the Web stream for Rosie's public site.", "Copy the Measurement ID beginning G-.", ...cloudflareVariableStorage],
      format: "G- followed by the GA4 stream identifier.",
      storage: "Cloudflare Pages environment variable named GA4_MEASUREMENT_ID.",
      test: ["Enable consented Development/test measurement.", "Use GA4 DebugView/Realtime and verify only approved public events appear."],
      official: [docs("Google Analytics web data streams", "https://support.google.com/analytics/answer/9304153")]
    }, {}),

    GOOGLE_ADS_CONVERSION_ID: merge({
      title: "GOOGLE_ADS_CONVERSION_ID",
      what: "The public Google Ads tag/conversion ID used for consented advertising measurement.",
      changes: "It changes which Google Ads account/tag receives approved website conversion signals.",
      why: "Rosie can measure approved campaign outcomes without storing a Google OAuth secret in public code.",
      source: "Google Ads / Goals / Conversions / tag setup.",
      setup: ["Open the intended Google Ads account.", "Open Goals / Conversions / Summary.", "Create/open the approved website conversion action and its Google tag setup.", "Copy the conversion ID beginning AW-.", ...cloudflareVariableStorage],
      format: "AW- followed by digits.",
      storage: "Cloudflare Pages environment variable named GOOGLE_ADS_CONVERSION_ID.",
      test: ["Use Google's Tag Assistant with Development/test consent enabled.", "Verify no internal/admin/customer pages emit advertising events."],
      official: [docs("Google Ads conversion measurement", "https://support.google.com/google-ads/answer/12216226")]
    }, {}),

    TIKTOK_PIXEL_ID: merge({
      title: "TIKTOK_PIXEL_ID",
      what: "The public TikTok Pixel identifier for consented website measurement.",
      changes: "It changes which TikTok web data source receives approved public-site events.",
      why: "Rosie can measure approved TikTok traffic/campaign outcomes separately from TikTok publishing credentials.",
      source: "TikTok Ads Manager / Events Manager / Web Events.",
      setup: ["Open TikTok Ads Manager.", "Open Tools / Events Manager / Web Events.", "Create/open Rosie's web data source/pixel.", "Copy its Pixel ID.", ...cloudflareVariableStorage],
      storage: "Cloudflare Pages environment variable named TIKTOK_PIXEL_ID.",
      security: "Pixel ID is public configuration; do not confuse it with TikTok client secrets or user access tokens.",
      test: ["Use TikTok's web-event diagnostic tools with Development/test consent enabled."],
      official: [docs("TikTok web measurement", "https://ads.tiktok.com/help/article/get-started-pixel")]
    }, {}),

    LINKEDIN_PARTNER_ID: merge({
      title: "LINKEDIN_PARTNER_ID",
      what: "The public LinkedIn Insight Tag partner/account identifier.",
      changes: "It changes which LinkedIn advertising account receives approved website insight events.",
      why: "Rosie can perform consented professional-network measurement without exposing an OAuth publishing token.",
      source: "LinkedIn Campaign Manager / Data / Insight Tag.",
      setup: ["Open LinkedIn Campaign Manager and select the intended ad account.", "Open the Insight Tag/data-source setup.", "Copy the numeric partner ID used in the Insight Tag.", ...cloudflareVariableStorage],
      format: "Numeric LinkedIn partner ID.",
      storage: "Cloudflare Pages environment variable named LINKEDIN_PARTNER_ID.",
      official: [docs("LinkedIn Insight Tag", "https://www.linkedin.com/help/lms/answer/a418880")]
    }, {}),

    PINTEREST_TAG_ID: merge({
      title: "PINTEREST_TAG_ID",
      what: "The public Pinterest Tag identifier for consented website measurement.",
      changes: "It changes which Pinterest account receives approved public-site conversion events.",
      why: "Rosie can measure visual-discovery traffic without exposing a Pinterest API access token in browser code.",
      source: "Pinterest Ads Manager / Conversions / Pinterest Tag.",
      setup: ["Open Pinterest Ads Manager for Rosie's business account.", "Open Conversions / Pinterest Tag.", "Create/open the approved tag and copy its Tag ID.", ...cloudflareVariableStorage],
      storage: "Cloudflare Pages environment variable named PINTEREST_TAG_ID.",
      official: [docs("Pinterest Tag", "https://help.pinterest.com/en/business/article/install-the-pinterest-tag")]
    }, {}),

    MICROSOFT_UET_TAG_ID: merge({
      title: "MICROSOFT_UET_TAG_ID",
      what: "The public Microsoft Advertising Universal Event Tracking tag identifier.",
      changes: "It changes which Microsoft Advertising account receives approved public-site measurement events.",
      why: "Rosie can measure approved search advertising outcomes without placing server credentials in browser code.",
      source: "Microsoft Advertising / Conversion Tracking / UET tags.",
      setup: ["Open Microsoft Advertising for the intended account.", "Open Conversion Tracking / UET tags.", "Create/open Rosie's UET tag and copy its numeric Tag ID.", ...cloudflareVariableStorage],
      storage: "Cloudflare Pages environment variable named MICROSOFT_UET_TAG_ID.",
      official: [docs("Microsoft UET", "https://help.ads.microsoft.com/#apex/ads/en/56684/2")]
    }, {}),

    FACEBOOK_PAGE_ID: merge({
      title: "FACEBOOK_PAGE_ID",
      what: "The Meta/Facebook Page identifier Rosie targets for approved Page publishing.",
      changes: "It changes which Facebook Page a direct-publish attempt targets.",
      why: "The publishing API needs an unambiguous Page ID in addition to an authorized Page access token.",
      source: "Meta Business/Page settings or Graph API data for the Rosie-managed Page.",
      setup: ["Confirm the Facebook Page is owned/managed by the correct Meta Business account.", "Use Meta Business Suite/Page settings or an authorized Graph API lookup to identify the Page's numeric ID.", "Record the Page ID only after confirming it is the Rosie business Page.", ...cloudflareVariableStorage],
      storage: "Cloudflare Pages environment variable named FACEBOOK_PAGE_ID.",
      test: ["Use a Development/test publishing asset and approval-first workflow.", "Verify the target Page before any live publish attempt."],
      official: [docs("Meta Pages API", "https://developers.facebook.com/docs/pages-api/")]
    }, {}),

    FACEBOOK_PAGE_ACCESS_TOKEN: merge({
      title: "FACEBOOK_PAGE_ACCESS_TOKEN",
      what: "A Meta Page access token authorizing Rosie's server-side Facebook Page publishing attempt.",
      changes: "It changes the Meta identity/permissions under which Rosie can act on the Page.",
      why: "Facebook publishing requires an access token with appropriate Page permissions; Page ID alone cannot publish.",
      source: "Meta developer/business OAuth flow for an app/user that has the required Page role and approved scopes.",
      setup: ["Create/use the approved Meta developer app for Rosie.", "Ensure the managing Facebook user has the required role/access to Rosie's Page.", "Configure the app's Facebook Login/required products and request only the Page permissions Rosie's publishing adapter needs.", "Complete OAuth authorization for the Rosie Page and exchange/obtain the Page access token according to Meta's current token flow.", "Confirm the token resolves to the intended Page and permissions using Meta's token/debug tools.", ...cloudflareSecretStorage],
      prerequisites: ["Meta app/business verification or App Review may be required for permissions used outside developer/test roles.", "Publishing acceptance must remain approval-first in Rosie."],
      storage: "Cloudflare Pages encrypted secret named FACEBOOK_PAGE_ACCESS_TOKEN.",
      security: oauthSecurity,
      test: ["Use Meta's access-token debugger/Graph API diagnostics first.", "Then make one bounded Development/test publish attempt to the intended Page and confirm the result/provider error without exposing the token."],
      official: [docs("Meta access tokens", "https://developers.facebook.com/docs/facebook-login/guides/access-tokens/"), docs("Meta Pages API", "https://developers.facebook.com/docs/pages-api/")]
    }, {}),

    INSTAGRAM_BUSINESS_ACCOUNT_ID: merge({
      title: "INSTAGRAM_BUSINESS_ACCOUNT_ID",
      what: "The Instagram professional-account ID Rosie targets for the preferred Instagram publishing credential set.",
      changes: "It changes which connected Instagram Business/Creator account receives a publishing attempt.",
      why: "Instagram publishing APIs identify the professional account by its API ID, not simply its @username.",
      source: "Meta Graph API for the Facebook Page connected to Rosie's Instagram professional account.",
      setup: ["Confirm Rosie's Instagram account is Professional (Business/Creator) and connected to the correct Facebook Page/Meta Business.", "Use the approved Meta app and Page authorization.", "Query the connected Instagram business account through Meta's Graph/API tooling and copy the returned Instagram account ID.", "Verify the ID corresponds to Rosie's Instagram profile before storing it.", ...cloudflareVariableStorage],
      storage: "Cloudflare Pages environment variable named INSTAGRAM_BUSINESS_ACCOUNT_ID.",
      official: [docs("Instagram API with Facebook Login", "https://developers.facebook.com/docs/instagram-platform/instagram-api-with-facebook-login/")]
    }, {}),

    INSTAGRAM_ACCESS_TOKEN: merge({
      title: "INSTAGRAM_ACCESS_TOKEN",
      what: "The server-side Meta/Instagram access token paired with Rosie's preferred Instagram professional-account ID.",
      changes: "It changes the authorization/scopes used for Instagram publishing.",
      why: "Rosie needs a valid authorized token to create media containers and publish approved Instagram content.",
      source: "Meta/Instagram OAuth for the approved developer app and Rosie professional account.",
      setup: ["Create/use the approved Meta app and configure Instagram API access.", "Connect/authorize Rosie's Instagram professional account through the required Meta login flow.", "Request only the scopes needed by the reviewed Rosie publishing adapter.", "Complete OAuth and obtain the user/page/Instagram token required by the selected Meta API flow.", "Validate the token/account relationship with Meta's official diagnostics before storing it.", ...cloudflareSecretStorage],
      storage: "Cloudflare Pages encrypted secret named INSTAGRAM_ACCESS_TOKEN.",
      security: oauthSecurity,
      official: [docs("Instagram Platform", "https://developers.facebook.com/docs/instagram-platform/")]
    }, {}),

    INSTAGRAM_IG_USER_ID: null,
    META_INSTAGRAM_BUSINESS_ACCOUNT_ID: null,
    META_PAGE_ACCESS_TOKEN: null,

    X_USER_ACCESS_TOKEN: merge({
      title: "X_USER_ACCESS_TOKEN",
      what: "A user-authorized X API token used by Rosie's current X publishing bridge where the account/API tier permits it.",
      changes: "It changes which X user and scopes Rosie can act as.",
      why: "Posting to a user's X account requires user-context authorization; an app/client identifier alone is not enough.",
      source: "X Developer Portal and the approved OAuth user-authorization flow for Rosie's X account.",
      setup: ["Open the X Developer Portal and create/use the approved Rosie project/app.", "Configure user authentication/OAuth for the application and the callback/redirect URL required by the Rosie adapter.", "Request the minimum write/posting scopes allowed by the selected X API authentication method and account tier.", "Authorize Rosie's X account through the OAuth flow and obtain the user access token.", "Confirm the token represents the intended Rosie account before storing it.", ...cloudflareSecretStorage],
      prerequisites: ["X API access level/tier must permit the endpoint Rosie intends to use.", "Media upload may have separate endpoint/tier requirements."],
      storage: "Cloudflare Pages encrypted secret named X_USER_ACCESS_TOKEN.",
      security: oauthSecurity,
      official: [docs("X API authentication", "https://docs.x.com/fundamentals/authentication")]
    }, {}),

    TIKTOK_CLIENT_KEY: merge({
      title: "TIKTOK_CLIENT_KEY",
      what: "The public/client identifier assigned to Rosie's TikTok developer application.",
      changes: "It identifies which TikTok developer app is requesting user authorization.",
      why: "TikTok OAuth/content-posting flows require a registered app/client before user access tokens can be issued.",
      source: "TikTok for Developers / Rosie's registered application.",
      setup: ["Sign in to TikTok for Developers and create/open Rosie's app.", "Add/configure the Content Posting API product if direct posting is the approved target.", "Configure the required redirect URI/domain verification and app details.", "Copy the app's Client key (not Client secret) from the app configuration.", ...cloudflareVariableStorage],
      prerequisites: ["For direct posting, TikTok requires a registered app and approval/authorization for the appropriate posting scope such as video.publish.", "Unaudited clients may be restricted to private visibility."],
      storage: "Cloudflare Pages environment variable named TIKTOK_CLIENT_KEY.",
      official: [docs("TikTok Content Posting API setup", "https://developers.tiktok.com/doc/content-posting-api-get-started/")]
    }, {}),

    TIKTOK_ACCESS_TOKEN: merge({
      title: "TIKTOK_ACCESS_TOKEN",
      what: "The TikTok user access token authorizing Rosie to act for the connected TikTok creator/business account.",
      changes: "It changes which TikTok user and granted scopes Rosie can use.",
      why: "TikTok publishing endpoints require user authorization; the Client Key alone cannot publish.",
      source: "TikTok Login/OAuth authorization for Rosie's TikTok account and registered developer app.",
      setup: ["Finish the TikTok developer-app and Content Posting API configuration first.", "Request the approved publishing scope(s), including video.publish when direct video publishing is intended.", "Send Rosie's TikTok user through TikTok's authorization flow.", "Exchange the returned authorization code using TikTok's server-side token endpoint/approved flow and capture the user access token/refresh data.", "Verify the token's account/scopes before storing it.", ...cloudflareSecretStorage],
      prerequisites: ["The user must explicitly authorize the app for the required scopes.", "Token lifecycle/refresh must be handled before production direct publishing is considered accepted."],
      storage: "Cloudflare Pages encrypted secret named TIKTOK_ACCESS_TOKEN.",
      security: oauthSecurity,
      test: ["Query creator information using the Development-authorized token.", "Only after that succeeds, perform a bounded approval-first posting test under TikTok's current audit/visibility rules."],
      official: [docs("TikTok Content Posting API", "https://developers.tiktok.com/doc/content-posting-api-get-started/"), docs("TikTok user access tokens", "https://developers.tiktok.com/doc/login-kit-manage-user-access-tokens/")]
    }, {}),

    LINKEDIN_AUTHOR_URN: merge({
      title: "LINKEDIN_AUTHOR_URN",
      what: "The LinkedIn person or organization URN Rosie should use as the author for approved publishing.",
      changes: "It changes which LinkedIn identity receives the post.",
      why: "LinkedIn publishing calls require an explicit author identifier in addition to an access token.",
      source: "LinkedIn API response for the authorized member or organization administered by Rosie's account.",
      setup: ["Create/use the approved LinkedIn developer app and complete OAuth for Rosie's LinkedIn identity.", "If publishing as an organization, confirm Rosie's authorized LinkedIn user has the required organization/page administrator role.", "Use LinkedIn's identity/organization API to obtain the canonical author identifier/URN required by the adapter.", "Verify the URN resolves to the intended Rosie person or organization.", ...cloudflareVariableStorage],
      storage: "Cloudflare Pages environment variable named LINKEDIN_AUTHOR_URN.",
      official: [docs("LinkedIn API authentication", "https://learn.microsoft.com/linkedin/shared/authentication/authentication")]
    }, {}),

    LINKEDIN_ACCESS_TOKEN: merge({
      title: "LINKEDIN_ACCESS_TOKEN",
      what: "The OAuth access token authorizing Rosie's LinkedIn publishing connection.",
      changes: "It changes which LinkedIn member/app permissions Rosie can use.",
      why: "LinkedIn requires OAuth authorization for member or organization publishing APIs.",
      source: "LinkedIn developer app OAuth flow authorized by Rosie's LinkedIn account.",
      setup: ["Create/open Rosie's LinkedIn developer application.", "Request/enable only the products and scopes required by the reviewed publishing adapter.", "Configure the exact OAuth redirect URL used by Rosie.", "Authorize Rosie's LinkedIn account and exchange the authorization code for an access token using the server-side OAuth flow.", "Verify the granted scopes and intended account before storing it.", ...cloudflareSecretStorage],
      callbacks: ["The OAuth redirect URI must exactly match the URI registered in LinkedIn Developer settings."],
      storage: "Cloudflare Pages encrypted secret named LINKEDIN_ACCESS_TOKEN.",
      security: oauthSecurity,
      official: [docs("LinkedIn OAuth", "https://learn.microsoft.com/linkedin/shared/authentication/authorization-code-flow")]
    }, {}),

    YOUTUBE_ACCESS_TOKEN: merge({
      title: "YOUTUBE_ACCESS_TOKEN",
      what: "A Google OAuth 2.0 user access token authorized to Rosie's YouTube channel for the reviewed YouTube/Shorts publishing adapter.",
      changes: "It changes which Google/YouTube account and OAuth scopes Rosie can use for YouTube API calls.",
      why: "YouTube Data API operations that manage channel content require OAuth user authorization; an API key alone cannot upload videos for Rosie.",
      source: "Google Cloud / Google Auth Platform OAuth flow for the Google account that owns or manages Rosie's YouTube channel.",
      setup: [
        "Open Google Cloud Console and select or create the Google Cloud project dedicated to Rosie's integrations.",
        "Open APIs & Services / API Library and enable YouTube Data API v3.",
        "Open Google Auth Platform. Configure the app/branding/consent screen and add Rosie's authorized test users while the app is in testing if Google requires them.",
        "Open Google Auth Platform / Clients and create an OAuth client for the application type Rosie will use (normally Web application for a server callback flow).",
        "Register the exact authorized redirect URI used by Rosie's OAuth callback. The URI must match exactly or Google returns redirect_uri_mismatch.",
        "In Rosie's reviewed OAuth flow, request only the YouTube scope(s) required by the adapter. For upload/publishing, use the minimum scope that permits the intended operation; do not grant broad account access unnecessarily.",
        "Sign in with the Google account that owns/manages Rosie's YouTube channel and approve the requested scope(s).",
        "Exchange the authorization code server-side for access/refresh credentials. The access token is the value represented by YOUTUBE_ACCESS_TOKEN in the current registry; long-lived production use also requires a reviewed refresh-token lifecycle rather than manually pasting expiring tokens forever.",
        ...cloudflareSecretStorage
      ],
      prerequisites: ["YouTube Data API v3 must be enabled in the selected Google Cloud project.", "Rosie's Google OAuth consent/app configuration must be valid for the account being authorized.", "YouTube API quota and Google verification requirements may apply depending on scopes and production use."],
      callbacks: ["Register the exact Development callback URL separately from Production when the environments use different origins.", "Do not invent a callback path; use the callback route implemented by the approved Rosie adapter."],
      storage: "Cloudflare Pages encrypted secret named YOUTUBE_ACCESS_TOKEN for the current registry. When a refresh-token adapter is implemented, its refresh token/client secret must also remain server-side under explicitly approved names.",
      security: oauthSecurity + " Do not use a simple YouTube API key as a substitute for an OAuth token when uploading/managing channel content.",
      test: ["First call a harmless authenticated YouTube endpoint that identifies the authorized channel/account.", "Confirm the returned channel is Rosie's intended channel.", "Then use a bounded Development test asset and approval-first workflow. Do not publish publicly until the adapter, scopes, token refresh and failure handling are accepted."],
      troubleshooting: ["403 errors can indicate missing scope, API not enabled, quota, channel permission or OAuth app verification issues.", "401 errors often indicate an expired/invalid access token; production cannot rely on manually maintained short-lived access tokens.", "redirect_uri_mismatch means the callback URI in the OAuth request does not exactly match Google Cloud configuration."],
      official: [docs("YouTube Data API OAuth for web server apps", "https://developers.google.com/youtube/v3/guides/auth/server-side-web-apps"), docs("Google OAuth client setup", "https://support.google.com/cloud/answer/15549257")]
    }, {}),

    GOOGLE_OAUTH_ACCESS_TOKEN: merge({
      title: "GOOGLE_OAUTH_ACCESS_TOKEN",
      what: "A server-side Google OAuth access token used as an accepted Google authorization credential by current YouTube/Google Business Profile connection detection.",
      changes: "It changes which Google account/scopes Rosie can use across the specific Google adapter consuming it.",
      why: "Google APIs that access private channel/business-profile data require OAuth user authorization rather than a generic public API key.",
      source: "Google Cloud / Google Auth Platform OAuth flow for Rosie's authorized Google account.",
      setup: ["Choose the exact Google API Rosie needs (for example YouTube Data API or Business Profile APIs) and enable it in the correct Google Cloud project.", "Configure Google Auth Platform app/consent settings.", "Create the correct OAuth client and register Rosie's exact redirect URI.", "Request only the scopes required by the selected Rosie adapter.", "Authorize the Google account that owns/manages the target property/channel/profile.", "Exchange the authorization code server-side and verify the resulting account/scopes.", ...cloudflareSecretStorage],
      callbacks: ["The registered redirect URI must exactly match Rosie's implemented OAuth callback.", "Use environment-specific redirect origins where Development and Production differ."],
      storage: "Cloudflare Pages encrypted secret named GOOGLE_OAUTH_ACCESS_TOKEN for current readiness detection. A production adapter should use a reviewed refresh-token lifecycle rather than depend on a manually refreshed short-lived token.",
      security: oauthSecurity,
      official: [docs("Google OAuth 2.0", "https://developers.google.com/identity/protocols/oauth2")]
    }, {}),

    GOOGLE_BUSINESS_PROFILE_LOCATION_NAME: merge({
      title: "GOOGLE_BUSINESS_PROFILE_LOCATION_NAME",
      what: "The Business Profile location resource identifier/name Rosie targets for approved local-profile actions.",
      changes: "It changes which Google Business Profile location the adapter targets.",
      why: "Google Business Profile APIs operate on a specific authorized business/location resource, not only a human-readable business name.",
      source: "Google Business Profile API response for Rosie's verified location after OAuth access is approved.",
      setup: ["Ensure Rosie's Google Business Profile location is claimed/verified and the authorizing Google account can manage it.", "Configure the Google Cloud project and request Business Profile API access as required by Google's current program.", "Enable/configure the relevant Business Profile APIs and Google OAuth client.", "Authorize the managing Google account through Rosie's reviewed OAuth flow.", "Use the Business Profile API to list accounts/locations and copy the exact location resource identifier expected by the adapter.", "Verify the selected location corresponds to Rosie's real business profile before storing it.", ...cloudflareVariableStorage],
      prerequisites: ["Google Business Profile API access may require approval and a valid verified business/profile.", "OAuth is required for private Business Profile data."],
      storage: "Cloudflare Pages environment variable named GOOGLE_BUSINESS_PROFILE_LOCATION_NAME.",
      test: ["Use a read-only Development request to retrieve the selected location/profile first.", "Do not perform live profile mutations until the adapter is separately accepted."],
      official: [docs("Google Business Profile basic setup", "https://developers.google.com/my-business/content/basic-setup"), docs("Google Business Profile OAuth", "https://developers.google.com/my-business/content/implement-oauth")]
    }, {}),

    google_search_console: merge({
      title: "Google Search Console setup",
      what: "Google Search Console is Rosie's external SEO ownership, indexing and search-performance control plane.",
      changes: "Adding/verifying the property does not add a Rosie runtime secret; it establishes ownership and gives us indexing/search diagnostics in Google's console.",
      why: "Rosie needs Search Console to verify sitemap discovery, indexing, canonical behavior and search performance.",
      source: "Google Search Console for rosiedazzlers.ca.",
      setup: ["Open Google Search Console while signed in with the Google account that should administer Rosie's property.", "Choose Add property.", "Prefer a Domain property when we want coverage across protocols/subdomains; Google normally verifies Domain properties through a DNS TXT record.", "Copy Google's verification record into the authoritative DNS provider exactly as supplied and wait for DNS propagation.", "Return to Search Console and complete verification.", "Submit/confirm Rosie's sitemap and inspect representative URLs."],
      storage: "External Google control plane. No Rosie runtime API key is required for ordinary Search Console ownership.",
      test: ["Confirm the property shows Verified.", "Confirm sitemap discovery succeeds.", "Use URL Inspection on the homepage and representative service/location pages."],
      security: "Do not invent a Google API key or OAuth secret merely to use Search Console's normal web interface.",
      official: [docs("Google Search Console", "https://search.google.com/search-console")]
    }, {}),

    google_maps: merge({
      title: "Google Maps Platform preparation",
      what: "Prepared control-plane work for a future approved Maps/geocoding adapter.",
      changes: "Nothing in current Build 274 requires a Google Maps runtime key, so this help prevents us from creating an unrestricted credential prematurely.",
      why: "If Rosie later adds maps, distance/geocoding or address-autocomplete, the exact API, billing boundary and key restrictions must be defined first.",
      source: "Google Cloud Console / Google Maps Platform only after an approved Rosie use case exists.",
      setup: ["Define the exact feature first (for example Maps JavaScript API, Places, Routes or Geocoding).", "Identify whether the caller is browser-side or server-side and what billing/quota boundary is acceptable.", "Enable only the required API(s) in the selected Google Cloud project.", "Create a dedicated credential and immediately restrict it by application (HTTP referrer/IP as appropriate) and by API.", "Only after the adapter defines an exact Rosie runtime variable name should that credential be added to the matching environment."],
      storage: "External/prepared. No canonical GOOGLE_MAPS_API_KEY exists in current Rosie source.",
      security: "Never create or deploy an unrestricted Maps API key. Do not invent a variable name before the adapter and guard define it.",
      official: [docs("Google Maps Platform getting started", "https://developers.google.com/maps/get-started")]
    }, {}),

    github: merge({
      title: "GitHub control-plane setup",
      what: "GitHub is Rosie's source-control/deployment control plane, not a routine runtime credential field.",
      changes: "Repository/branch integration determines which source Cloudflare can build/deploy; changing it can affect the deployment boundary.",
      why: "Rosie needs controlled source history, branch gates and deliberate Development/Production promotion.",
      source: "GitHub repository settings and Cloudflare Pages Git integration.",
      setup: ["Confirm the authoritative Rosie repository and intended Development branch in GitHub.", "In Cloudflare Pages, verify the project is connected to the correct GitHub repository/account.", "Verify the configured production branch and preview/development behavior match Rosie's release boundary.", "Use repository/app authorization supplied by the Git integration; do not create a Rosie runtime personal access token unless a future approved server adapter explicitly requires one."],
      storage: "External control plane. No routine Rosie runtime GitHub token is required by the current application source.",
      test: ["Verify the expected commit SHA/branch in GitHub.", "Verify Cloudflare Development deploy evidence refers to that exact SHA before acceptance."],
      security: "Keep GitHub account/repository credentials out of Site Settings and browser code.",
      official: [docs("Cloudflare Pages GitHub integration", "https://developers.cloudflare.com/pages/configuration/git-integration/github-integration/")]
    }, {})
  };

  // Safe aliases share the canonical acquisition workflow while making the legacy name explicit.
  entries.PUBLIC_ASSETS_BUCKET = merge(entries.ROSIE_PUBLIC_ASSETS_BUCKET, { title: "PUBLIC_ASSETS_BUCKET (legacy alias)", storage: "Legacy accepted Cloudflare R2 binding alias. Prefer ROSIE_PUBLIC_ASSETS_BUCKET for new configuration." });
  entries.R2_PUBLIC_ASSETS_BUCKET = merge(entries.ROSIE_PUBLIC_ASSETS_BUCKET, { title: "R2_PUBLIC_ASSETS_BUCKET (legacy alias)", storage: "Legacy accepted Cloudflare R2 binding alias. Prefer ROSIE_PUBLIC_ASSETS_BUCKET for new configuration." });
  entries.ASSETS_BUCKET = merge(entries.ROSIE_PUBLIC_ASSETS_BUCKET, { title: "ASSETS_BUCKET (legacy alias)", storage: "Legacy accepted Cloudflare R2 binding alias. Prefer ROSIE_PUBLIC_ASSETS_BUCKET for new configuration." });
  entries.ASSETS_PUBLIC_BASE_URL = merge(entries.PUBLIC_ASSET_BASE_URL, { title: "ASSETS_PUBLIC_BASE_URL (legacy alias)", storage: "Legacy accepted public asset base URL alias. Prefer PUBLIC_ASSET_BASE_URL for new configuration." });
  entries.STRIPE_WEBHOOK_SECRET_QUOTES = merge(entries.STRIPE_WEBHOOK_SECRET, { title: "STRIPE_WEBHOOK_SECRET_QUOTES (retained alias)", storage: "Retained accepted Stripe webhook-secret alias. Prefer STRIPE_WEBHOOK_SECRET for new configuration." });

  const notificationWebhook = (title, channel, variable) => merge({
    title,
    what: `The HTTPS webhook endpoint Rosie calls to hand ${channel} delivery to the selected external notification provider/bridge.`,
    changes: `It changes where Rosie sends ${channel} notification payloads for this provider path.`,
    why: `Rosie's provider dispatcher needs a concrete server endpoint before ${channel} delivery can leave the application.`,
    source: `The chosen ${channel} provider or automation/bridge service after its Rosie endpoint has been created and secured.`,
    setup: ["Choose/confirm the provider or bridge Rosie will use for this channel.", "Create a dedicated HTTPS endpoint/automation that accepts only the payload Rosie is designed to send.", "Configure provider-side sender/domain/phone verification and test-recipient restrictions as applicable.", "If the endpoint requires bearer authentication, create a dedicated provider token and configure the matching Rosie auth-token variable.", "Copy the final HTTPS webhook URL.", ...cloudflareSecretStorage],
    format: "HTTPS webhook URL.",
    storage: `Cloudflare Pages encrypted secret named ${variable}.`,
    security: secretSecurity + " Treat webhook URLs as secrets because many contain unguessable provider identifiers.",
    test: ["Use a non-customer Development recipient.", "Trigger one bounded preview/test dispatch.", "Confirm the provider accepted/delivered it and that failure responses are visible without logging private payloads or tokens."],
    troubleshooting: ["A configured URL does not prove provider rules/sender verification are enabled.", "Check provider logs for HTTP status/auth errors using safe request IDs only."]
  }, {});

  entries.NOTIFICATIONS_EMAIL_WEBHOOK_URL = notificationWebhook("NOTIFICATIONS_EMAIL_WEBHOOK_URL", "email", "NOTIFICATIONS_EMAIL_WEBHOOK_URL");
  entries.RECOVERY_EMAIL_WEBHOOK_URL = notificationWebhook("RECOVERY_EMAIL_WEBHOOK_URL", "recovery email", "RECOVERY_EMAIL_WEBHOOK_URL");
  entries.NOTIFICATIONS_SMS_WEBHOOK_URL = notificationWebhook("NOTIFICATIONS_SMS_WEBHOOK_URL", "SMS", "NOTIFICATIONS_SMS_WEBHOOK_URL");
  entries.RECOVERY_SMS_WEBHOOK_URL = notificationWebhook("RECOVERY_SMS_WEBHOOK_URL", "recovery SMS", "RECOVERY_SMS_WEBHOOK_URL");
  entries.NOTIFICATIONS_PUSH_WEBHOOK_URL = notificationWebhook("NOTIFICATIONS_PUSH_WEBHOOK_URL", "Web Push", "NOTIFICATIONS_PUSH_WEBHOOK_URL");

  const providerToken = (title, variable, purpose) => merge({
    title,
    what: purpose,
    changes: "It changes the authorization Rosie sends to the selected external notification endpoint.",
    why: "The provider may reject webhook requests unless Rosie authenticates them.",
    source: "The chosen notification/recovery provider or bridge's API/authentication settings.",
    setup: ["Open the provider/bridge that owns the matching webhook URL.", "Create a dedicated server-to-server bearer/API token with the minimum required permission.", "Do not reuse a personal login password or unrelated master credential.", "Copy the token once and store it directly in Rosie's encrypted environment configuration.", ...cloudflareSecretStorage],
    storage: `Cloudflare Pages encrypted secret named ${variable}.`,
    security: secretSecurity,
    test: ["Send one bounded Development dispatch using a non-customer recipient.", "Verify the provider accepts valid authentication and rejects an intentionally invalid token without exposing either token in logs."]
  }, {});
  entries.NOTIFICATIONS_PROVIDER_AUTH_TOKEN = providerToken("NOTIFICATIONS_PROVIDER_AUTH_TOKEN", "NOTIFICATIONS_PROVIDER_AUTH_TOKEN", "General bearer/API token used by Rosie's notification provider dispatcher when the selected webhook requires authentication.");
  entries.RECOVERY_PROVIDER_AUTH_TOKEN = providerToken("RECOVERY_PROVIDER_AUTH_TOKEN", "RECOVERY_PROVIDER_AUTH_TOKEN", "Bearer/API token used by Rosie's recovery-notification provider path when that endpoint requires authentication.");
  entries.NOTIFICATIONS_PUSH_PROVIDER_AUTH_TOKEN = providerToken("NOTIFICATIONS_PUSH_PROVIDER_AUTH_TOKEN", "NOTIFICATIONS_PUSH_PROVIDER_AUTH_TOKEN", "Bearer/API token specifically required by Rosie's explicit Web Push webhook path.");

  entries.INSTAGRAM_IG_USER_ID = merge(entries.INSTAGRAM_BUSINESS_ACCOUNT_ID, { title: "INSTAGRAM_IG_USER_ID (accepted alternative)", storage: "Accepted alternative Instagram account-ID variable. Prefer the canonical INSTAGRAM_BUSINESS_ACCOUNT_ID credential set for new configuration." });
  entries.META_INSTAGRAM_BUSINESS_ACCOUNT_ID = merge(entries.INSTAGRAM_BUSINESS_ACCOUNT_ID, { title: "META_INSTAGRAM_BUSINESS_ACCOUNT_ID (accepted alternative)", storage: "Accepted alternative Instagram account-ID variable. Prefer INSTAGRAM_BUSINESS_ACCOUNT_ID for new configuration." });
  entries.META_PAGE_ACCESS_TOKEN = merge(entries.FACEBOOK_PAGE_ACCESS_TOKEN, { title: "META_PAGE_ACCESS_TOKEN (accepted alternative)", storage: "Accepted Meta Page token alternative used by Rosie's Instagram credential sets; store as a Cloudflare Pages encrypted secret." });

  globalScope.RosieITHelpCatalog = Object.freeze({
    version: "274.2",
    entries: Object.freeze(entries)
  });
})(window);
