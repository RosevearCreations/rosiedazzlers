import { serviceHeaders, json, methodNotAllowed } from "./_lib/staff-auth.js";

const DEFAULTS = {
  quote_booking_settings: {
    prominent_cta: true,
    show_exact_total: true,
    show_time_expectation: true,
    teaser_text: "Start with the live booking planner to see service-area restrictions, 21-day availability windows, package choices, add-ons, and deposit-ready details before checkout."
  },
  gift_delivery_settings: {
    enabled: true,
    manual_review: false,
    automation_enabled: true,
    default_message: "Choose a recipient, add a message, and pick the day you want us to send the gift.",
    default_send_hour_local: 9,
    timezone_label: "America/Toronto",
    send_copy_to_purchaser: true
  },
  membership_plan_settings: {
    enabled: false,
    waitlist_enabled: true,
    plan_name: "Maintain Your Shine Plan",
    cycle_label: "Every 4 or 8 weeks",
    teaser: "Keep your vehicle on a repeating clean schedule with priority reminders and simpler rebooking.",
    benefits: [
      "Priority reminder before your preferred date",
      "Faster rebooking using your saved vehicle",
      "Cleaner predictable maintenance cycle"
    ],
    reminder_enabled: true,
    reminder_channel: "email",
    reminder_subject: "It may be time to book your next Rosie Dazzlers clean",
    reminder_intro: "Use the booking-led planner to pick your next clean while your preferred timing is still open.",
    reminder_send_hour_local: 9,
    timezone_label: "America/Toronto"
  }
};

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
      out[key] = { ...DEFAULTS[key], ...((Array.isArray(rows) && rows[0] && typeof rows[0].value === "object") ? rows[0].value : {}) };
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
