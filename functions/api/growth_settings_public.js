import { serviceHeaders, json, methodNotAllowed } from "./_lib/staff-auth.js";

const SAFE_MEMBERSHIP_PUBLIC_DEFAULTS = Object.freeze({
  enabled: false,
  waitlist_enabled: true,
  plan_name: "Maintenance Plan Interest",
  cycle_label: "Cadence selected after service review",
  teaser: "Tell us what recurring schedule would be useful after a completed reset or detail. This is an interest list; no subscription, fixed cadence, price, discount, or perk is promised.",
  benefits: [
    "Recurring service starts from current vehicle condition and completed service history",
    "Rebooking continues through the live booking flow",
    "Cadence is confirmed around use, season, condition, and service area"
  ],
  why_title: "What the waitlist helps us learn",
  why_lines: [
    "Preferred cadence | Tell us what schedule would be useful",
    "Vehicle mix | One vehicle or several",
    "Season and use | Salt, pets, mileage and work use matter",
    "Booking path | Final appointments still use the live booking flow"
  ],
  waitlist_intro: "Leave the cadence you would prefer and a few vehicle details. We use this as demand and planning evidence; it does not create a membership or lock in pricing, discounts, perks, or appointment frequency.",
  self_serve_title: "How recurring service should fit booking",
  self_serve_copy: "Recurring service should make the existing booking flow easier to repeat, not replace current availability, vehicle review, service scope, price, add-on, deposit, or site-access rules.",
  good_fit_title: "Good fit for the interest list",
  good_fit_lines: [
    "Repeat customers who want a more predictable cleaning routine",
    "Vehicles affected by seasonal salt, pets, frequent use, or work activity",
    "Households or small businesses exploring repeat service without committing to a fixed membership"
  ]
});

const DEFAULTS = {
  quote_booking_settings: {
    prominent_cta: true,
    show_exact_total: true,
    show_time_expectation: true,
    teaser_text: "Start with the live booking planner to see service-area restrictions, 21-day availability windows, package choices, add-ons, and deposit-ready details before checkout."
  },
  gift_delivery_settings: {
    enabled: true,
    manual_review: true,
    default_message: "Choose a recipient, add a message, and pick the day you want us to send the gift."
  },
  membership_plan_settings: { ...SAFE_MEMBERSHIP_PUBLIC_DEFAULTS }
};

function normalizeMembershipPublicSettings(raw) {
  const source = raw && typeof raw === "object" ? raw : {};
  // Build 275: App Management may retain older experimental membership copy.
  // Until recurring-plan economics/perks are deliberately approved, expose
  // only the safe waitlist contract and the operational on/off switches.
  return {
    ...SAFE_MEMBERSHIP_PUBLIC_DEFAULTS,
    enabled: source.enabled === true,
    waitlist_enabled: source.waitlist_enabled !== false
  };
}

export async function onRequestGet({ env }) {
  try {
    if (!env?.SUPABASE_URL || !env?.SUPABASE_SERVICE_ROLE_KEY) {
      return withCors(json(DEFAULTS));
    }

    const keys = ["quote_booking_settings", "gift_delivery_settings", "membership_plan_settings"];
    const out = {};
    for (const key of keys) {
      const res = await fetch(`${env.SUPABASE_URL}/rest/v1/app_management_settings?select=key,value&key=eq.${encodeURIComponent(key)}&limit=1`, {
        headers: serviceHeaders(env)
      });
      if (!res.ok) {
        out[key] = DEFAULTS[key];
        continue;
      }
      const rows = await res.json().catch(() => []);
      const stored = (Array.isArray(rows) && rows[0] && typeof rows[0].value === "object") ? rows[0].value : {};
      out[key] = key === "membership_plan_settings"
        ? normalizeMembershipPublicSettings(stored)
        : { ...DEFAULTS[key], ...stored };
    }

    return withCors(json(out));
  } catch (err) {
    return withCors(json({ ...DEFAULTS, warning: err?.message || "Using default public growth settings." }));
  }
}

export async function onRequestOptions() {
  return new Response("", { status: 204, headers: corsHeaders() });
}

export async function onRequestPost() {
  return withCors(methodNotAllowed(["GET", "OPTIONS"]));
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
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
