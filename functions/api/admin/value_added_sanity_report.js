// Build 205 — value-added sanity report for current app status, competitor-inspired gaps, and next-priority recommendations.
import { requireStaffAccess, json } from "../_lib/staff-auth.js";

const REPORT = {
  ok: true,
  build: 205,
  updated_at: "2026-06-13",
  title: "Build 205 sanity check and value-added roadmap",
  current_position: {
    summary: "Rosie Dazzlers now has a strong operations platform: booking, payments, admin diagnostics, media health, gallery resilience, incident reports, editable settings, pricing/landing editors, accounting workflows, and desktop/mobile visual polish.",
    risk: "The main risk is no longer missing foundations; it is complexity. The next best work should simplify owner/detailer screens and make customer conversion easier.",
    seo: "Keep one visible H1 per public page, clear local title/meta copy, Oxford/Norfolk town-service wording, sharp images near relevant text, reviews, and Business Profile proof updates."
  },
  strongest_foundations: [
    "Booking and deposit/payment flow",
    "Admin dashboard diagnostics that fail independently",
    "Editable settings with history restore and validation",
    "Gallery fallback, image health diagnostics, and before/after privacy gating",
    "Incident reports with private evidence and approved customer-visible publishing",
    "Pricing catalog, landing pages, option libraries, and water-rule editors",
    "Accounting, HST/GST, payment webhook, refunds, and month-end close foundations",
    "Desktop/mobile visual registry and shared responsive polish"
  ],
  priority_additions: [
    { rank: 1, feature: "Dedicated Gallery Approvals", route: "/admin-gallery.html", value: "Turns buried gallery consent/image repair into a simple approve/hide workflow." },
    { rank: 2, feature: "Quote Pipeline Revenue Dashboard", route: "/admin-quotes.html", value: "Shows total quote dollars outstanding, close rate, age, and follow-up stage." },
    { rank: 3, feature: "Meta Ads ROI Tracker", route: "/admin-marketing.html", value: "Tracks spend, leads, CPL, bookings, CAC, revenue, and average ticket." },
    { rank: 4, feature: "Membership/Maintenance Plan Engine", route: "/maintenance-plan.html", value: "Creates predictable repeat revenue and rebooking reminders." },
    { rank: 5, feature: "Vehicle History Timeline", route: "/my-account.html", value: "Gives customers a reason to return and makes the mobile app feel premium." },
    { rank: 6, feature: "Proof-of-Work Checklist", route: "/detailer-jobs.html", value: "Adds checklists, photos, signatures, and customer sign-off for accountability." },
    { rank: 7, feature: "Fleet Contract Mini-CRM", route: "/fleet.html", value: "Supports higher-ticket recurring commercial work and per-vehicle tracking." },
    { rank: 8, feature: "Review Request Automation", route: "/admin-notifications.html", value: "Builds local proof, trust, and Google Business Profile prominence." },
    { rank: 9, feature: "Seasonal Visual Campaign Builder", route: "/admin-content.html", value: "Creates polished offer blocks and landing content without code edits." },
    { rank: 10, feature: "Route Clustering Hints", route: "/admin-booking.html", value: "Helps reduce mobile travel gaps by grouping town/area jobs." }
  ],
  competitor_patterns_reviewed: [
    "mobile app-style booking and account management",
    "memberships/subscriptions/credits",
    "fleet and corporate services",
    "CRM quote tracking, close rate, and pipeline value",
    "Meta ads spend/lead/revenue formula tracking",
    "vehicle history and customer portal",
    "before/after proof photos and service documentation",
    "proof-of-work checklists, approvals, and sign-off",
    "gift cards and seasonal offers",
    "review requests and local proof"
  ],
  visual_enrichment: [
    "Add before/after slider cards on gallery and service pages.",
    "Add service/town hero images with local alt text.",
    "Add trust badge strips: mobile, brings power/water, Oxford/Norfolk, insured, customer-approved photos.",
    "Add mobile bottom action bar for Book, Call, Text, Gift Card.",
    "Add polished campaign graphics for seasonal offers.",
    "Add reduced-motion safe hover/lift effects on package and proof cards."
  ],
  next_step: "Prioritize the dedicated Gallery Approvals screen and Quote Pipeline dashboard next because they simplify current workflows and directly support customer trust and revenue tracking."
};

export async function onRequestGet({ request, env }) {
  try {
    const access = await requireStaffAccess({ request, env, capability: "manage_promos", allowLegacyAdminFallback: true });
    if (!access.ok) return withCors(access.response);
    return withCors(json(REPORT));
  } catch (err) {
    return withCors(json({ ok: false, error: err?.message || "Could not load value-added sanity report." }, 500));
  }
}

export async function onRequestOptions() { return new Response("", { status: 204, headers: corsHeaders() }); }
function corsHeaders() { return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,OPTIONS", "Access-Control-Allow-Headers": "Content-Type, x-admin-password, x-staff-email, x-staff-user-id", "Cache-Control": "no-store" }; }
function withCors(response) { const headers = new Headers(response.headers || {}); for (const [key, value] of Object.entries(corsHeaders())) headers.set(key, value); return new Response(response.body, { status: response.status, statusText: response.statusText, headers }); }
