// /functions/api/health.js
// Shows runtime environment + Stripe key mode (test vs live).
// Safe: does NOT reveal the secret value.

export function onRequestGet({ env, request }) {
  const k = env.STRIPE_SECRET_KEY || "";
  const stripe_key_mode =
    k.startsWith("sk_test_") ? "test" :
    k.startsWith("sk_live_") ? "live" :
    "missing/unknown";

  const out = {
    ok: true,
    stripe_key_mode,
    CF_PAGES: env.CF_PAGES || null,
    CF_PAGES_BRANCH: env.CF_PAGES_BRANCH || null,
    CF_PAGES_URL: env.CF_PAGES_URL || null,
    host: request.headers.get("host") || null
  };

  return new Response(JSON.stringify(out, null, 2), {
    headers: { "content-type": "application/json" },
  });
}
