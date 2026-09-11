// Build 376 — shared response hardening authority.
// Conservative by design: protect authenticated/private surfaces without introducing a
// Content-Security-Policy that could break the existing inline UI or payment-provider flows.

const PRIVATE_PREFIXES = Object.freeze([
  "/admin",
  "/client",
  "/detailer",
  "/app/detailer",
  "/api/admin",
  "/api/client",
  "/api/detailer",
  "/api/auth"
]);

const PRIVATE_PATHS = new Set([
  "/login", "/login.html",
  "/my-account", "/my-account.html",
  "/progress", "/progress.html",
  "/checkout", "/checkout.html",
  "/complete", "/complete.html",
  "/invoice", "/invoice.html",
  "/quote-payment", "/quote-payment.html",
  "/final-balance-payment", "/final-balance-payment.html",
  "/booking-confirmed", "/booking-confirmed.html"
]);

export function isPrivateResponsePath(pathname) {
  const path = normalizePath(pathname);
  if (PRIVATE_PATHS.has(path)) return true;
  return PRIVATE_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

export function hardenResponse(request, response, options = {}) {
  if (!(response instanceof Response)) return response;
  if (response.status === 101) return response;

  const url = new URL(request.url);
  const headers = new Headers(response.headers);
  const privateResponse = isPrivateResponsePath(url.pathname) || headers.has("set-cookie");

  headers.set("x-content-type-options", "nosniff");
  headers.set("referrer-policy", "strict-origin-when-cross-origin");
  headers.set("permissions-policy", "camera=(), microphone=()");
  headers.set("x-permitted-cross-domain-policies", "none");

  if (privateResponse) {
    // Authenticated/customer/staff responses must never be reused from a shared cache.
    headers.set("cache-control", "no-store");
    headers.set("pragma", "no-cache");
    headers.set("x-frame-options", "DENY");
  } else if (options.forceNoCache === true) {
    // Used only where middleware rewrites legacy public copy at request time.
    headers.set("cache-control", "no-cache");
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

function normalizePath(pathname) {
  const raw = String(pathname || "/").trim() || "/";
  return raw.length > 1 ? raw.replace(/\/+$/, "") : raw;
}
