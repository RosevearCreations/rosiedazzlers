// Build 341 - public HTML clarity + booking completion routing + universal public page-editor bootstrap.
// Static source and booking/payment APIs remain authoritative. This middleware only:
// 1) preserves the existing Build 272 public wording clarifications,
// 2) routes provider payment returns away from the customer job-signoff /complete page,
// 3) gives already-confirmed gift-covered checkouts a browser confirmation URL, and
// 4) loads the admin-only Build 341 editor on public content HTML pages.
const TARGETS = new Set([
  "/", "/index.html",
  "/book", "/book.html",
  "/pricing", "/pricing.html",
  "/services", "/services.html"
]);

const EDITOR_EXCLUDED_PREFIXES = ["/admin", "/api", "/client", "/detailer", "/app/detailer"];
const EDITOR_EXCLUDED_PATHS = new Set([
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

const PACKAGE_GUIDE = `
<div class="photo-estimate-guide" data-build272="package-scope-before-price" style="margin-top:12px">
  <strong>Compare scope before price</strong>
  <p class="muted" style="margin:6px 0 0"><strong>Premium Wash</strong> is the maintenance exterior refresh. <strong>Interior Detail</strong> is the deep cabin-focused service. <strong>Exterior Detail</strong> is a full exterior-focused detail and protection-prep service rather than a basic wash. <strong>Complete Detail</strong> covers the broadest inside-and-out base scope and is our <strong>Best value</strong>.</p>
  <p class="mini muted" style="margin:8px 0 0"><strong>How pricing works:</strong> the base price follows the Small, Mid-sized, or Oversized vehicle size selected in Step 1. Heavy contamination, pet hair, odours, severe stains, tar/sap/overspray, paint defects, unusual vehicle size or higher-risk work can add an approved surcharge/add-on or move the booking to quote review before the final service price is confirmed.</p>
  <p class="mini muted" style="margin:8px 0 0"><strong>Fully mobile:</strong> Rosie brings the water and power needed for standard detailing. We still need a safe driveway/work area and reasonable access around the vehicle.</p>
</div>`;

const PUBLIC_SCOPE_GUIDE = `
<section class="section panel" data-build272="public-package-scope">
  <h2 style="margin-top:0">What each package price represents</h2>
  <p class="muted"><strong>Premium Wash:</strong> maintenance exterior refresh. <strong>Interior Detail:</strong> deep interior cleaning. <strong>Exterior Detail:</strong> exterior-focused detailing and protection prep, not a basic wash. <strong>Complete Detail:</strong> the broadest inside-and-out base package and our <strong>Best value</strong>.</p>
  <p class="mini muted"><strong>Vehicle size sets the base price.</strong> Condition and extra labour can change the final scope: heavy contamination, pet hair, odour, severe stains, tar/sap/overspray, paint defects, unusual size, clay/decontamination, correction or coating work may require an add-on, surcharge or quote review.</p>
  <p class="mini muted"><strong>We are fully mobile:</strong> Rosie brings its own water and power for standard detailing; customers provide a safe driveway/work area and access to the vehicle.</p>
</section>`;

export async function onRequest(context) {
  const request = context.request;
  const url = new URL(request.url);

  // Build 326: the canonical checkout can legitimately return a confirmed booking with
  // no external payment URL when a gift certificate covers the full deposit. The public
  // wizard already follows checkout_url, so add a local confirmation target only after the
  // authoritative checkout endpoint has returned gift_only_confirm.
  if (request.method === "POST" && url.pathname === "/api/checkout") {
    return handleCheckoutResponse(context, url);
  }

  if (request.method !== "GET") return context.next();

  // /complete is the existing token-protected customer job sign-off page. Stripe and
  // PayPal historically returned there with provider parameters, which do not satisfy the
  // sign-off token contract. Move only those provider returns to the dedicated booking
  // confirmation route and preserve every provider query parameter (session_id/token/etc.).
  if ((url.pathname === "/complete" || url.pathname === "/complete.html") && isPaymentProvider(url.searchParams.get("provider"))) {
    url.pathname = "/booking-confirmed";
    return Response.redirect(url.toString(), 302);
  }

  const applyLegacyClarity = TARGETS.has(url.pathname);
  const applyPageEditor = isEditorEligiblePath(url.pathname);
  if (!applyLegacyClarity && !applyPageEditor) return context.next();

  const response = await context.next();
  const contentType = String(response.headers.get("content-type") || "").toLowerCase();
  if (!contentType.includes("text/html")) return response;

  let html = await response.text();

  if (applyLegacyClarity) {
    html = html
      .replaceAll("Customer provides power + water", "We bring our own water + power")
      .replaceAll("Our #1 choice", "Best value")
      .replaceAll("Quote staff-supplied water/power setup", "Rosie brings its own water and power")
      .replaceAll("Customer provides water and power", "Rosie brings its own water and power")
      .replaceAll("If power/water are not available, additional charges may apply.", "Rosie brings the water and power needed for standard detailing.");

    if (url.pathname === "/" || url.pathname === "/index.html") {
      html = html.replace(
        "<strong>Note:</strong> Rosie brings the water and power needed for standard detailing.\n            Customer accepts responsibility for local bylaw considerations regarding runoff/chemicals.",
        "<strong>Fully mobile:</strong> Rosie brings its own water and power for standard detailing. A safe driveway/work area and vehicle access are still required. Customer accepts responsibility for local bylaw considerations regarding runoff/chemicals."
      );
    }

    if (url.pathname === "/book" || url.pathname === "/book.html") {
      html = html.replace(
        '<div id="packageCards" class="service-card-grid" style="margin-top:12px"></div>',
        `${PACKAGE_GUIDE}\n      <div id="packageCards" class="service-card-grid" style="margin-top:12px"></div>`
      );
      html = html.replace(
        '<label><input id="ack_power_water" type="checkbox" /><span><strong>Power / water access acknowledged</strong><br><span data-policy-copy="water_power">Extra fees can apply if either is unavailable.</span></span></label>',
        '<label><input id="ack_power_water" type="checkbox" checked disabled /><span><strong>Rosie brings its own water and power</strong><br><span>We arrive fully mobile for standard detailing; safe driveway/work access is still required.</span></span></label>'
      );
      html = html.replace(
        '<label><input id="need_mobile_water_power" type="checkbox" /><span><strong>Quote bringing water/power</strong><br><span data-policy-copy="water_power">Check this if the site may not have hose or power access; staff will confirm extra setup fees.</span></span></label>',
        '<label hidden><input id="need_mobile_water_power" type="checkbox" /><span><strong>Mobile water/power included</strong></span></label>'
      );
      html = html.replace("Confirm setup needs before you continue to payment.", "Confirm safe site access and vehicle notes before payment. Rosie brings its own water and power for standard detailing.");
    }

    if (["/pricing", "/pricing.html", "/services", "/services.html"].includes(url.pathname)) {
      html = html.replace(/(<h1\b[^>]*>[\s\S]*?<\/h1>)/i, `$1${PUBLIC_SCOPE_GUIDE}`);
    }

    if (!html.includes("/assets/build272-public-clarity.js")) {
      html = html.replace("</body>", '<script src="/assets/build272-public-clarity.js?v=272" defer></script>\n</body>');
    }
  }

  if (applyPageEditor && !html.includes("/assets/universal-page-editor-bootstrap.js")) {
    html = html.replace(
      "</body>",
      '<script type="module" src="/assets/universal-page-editor-bootstrap.js?v=20260906build341"></script>\n</body>'
    );
  }

  const headers = new Headers(response.headers);
  headers.delete("content-length");
  headers.delete("etag");
  if (applyLegacyClarity) headers.set("cache-control", "no-cache");
  return new Response(html, { status: response.status, statusText: response.statusText, headers });
}

function isEditorEligiblePath(pathname) {
  const path = String(pathname || "/");
  if (EDITOR_EXCLUDED_PATHS.has(path)) return false;
  if (EDITOR_EXCLUDED_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`) || path.startsWith(`${prefix}.`))) return false;
  return true;
}

async function handleCheckoutResponse(context, requestUrl) {
  let intake = {};
  try {
    intake = await context.request.clone().json();
  } catch {
    intake = {};
  }

  const response = await context.next();
  if (!response.ok) return response;

  const contentType = String(response.headers.get("content-type") || "").toLowerCase();
  if (!contentType.includes("application/json")) return response;

  let payload = null;
  try {
    payload = await response.clone().json();
  } catch {
    return response;
  }

  if (!payload?.ok || payload.mode !== "gift_only_confirm" || payload.checkout_url) return response;

  const target = new URL("/booking-confirmed", requestUrl.origin);
  target.searchParams.set("provider", "gift");

  const packageCode = safeChoice(intake?.package_code, 80);
  const vehicleSize = ["small", "mid", "oversize"].includes(String(intake?.vehicle_size || "").toLowerCase())
    ? String(intake.vehicle_size).toLowerCase()
    : "";
  if (packageCode) target.searchParams.set("package", packageCode);
  if (vehicleSize) target.searchParams.set("size", vehicleSize);

  const body = JSON.stringify({ ...payload, checkout_url: `${target.pathname}${target.search}` });
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  headers.delete("etag");
  headers.set("content-type", "application/json; charset=utf-8");
  headers.set("cache-control", "no-store");
  return new Response(body, { status: response.status, statusText: response.statusText, headers });
}

function isPaymentProvider(value) {
  return ["stripe", "paypal"].includes(String(value || "").trim().toLowerCase());
}

function safeChoice(value, maxLength) {
  const text = String(value || "").trim();
  if (!text || text.length > maxLength) return "";
  return /^[a-z0-9_-]+$/i.test(text) ? text : "";
}
