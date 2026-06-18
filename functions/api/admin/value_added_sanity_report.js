// Build 209 — current value-added sanity report.
import { requireStaffAccess, json } from "../_lib/staff-auth.js";

const REPORT = {
  ok: true,
  build: 209,
  updated_at: "2026-06-17",
  title: "Build 209 sanity check and value roadmap",
  current_position: {
    summary: "Rosie Dazzlers now has a connected operations platform and a real live-detail interaction backbone: quote/booking, staff updates, protected evidence, customer progress, payment, review, and repeat-maintenance foundations.",
    risk: "The main risk is operational hardening rather than missing screens: migrations, notifications, unread state, weak-network upload recovery, video/storage controls, and live browser testing.",
    seo: "Keep one visible H1, useful local titles/main headings, mobile/desktop content parity, descriptive image text, real approved local proof, and complete Google Business Profile information. Code cannot guarantee first-page placement."
  },
  strongest_foundations: [
    "Lead/quote through repeat-maintenance workflow command center",
    "Live detail notes, photos, videos, stages, customer action requests, and three privacy audiences",
    "Private incident/evidence workflow with separate approved customer publishing",
    "Customer progress timeline, comments, sign-off, and approved media",
    "Booking, deposits/payments, accounting, refunds, webhook, and month-end foundations",
    "Gallery approval, media health, visual placeholders, responsive desktop/mobile presentation",
    "Editable settings with history, validation, friendly forms, and emergency fallback",
    "Two canonical Markdown files with redundant planning files archived"
  ],
  priority_additions: [
    { rank:1, feature:"Live update notifications and unread state", route:"/admin-progress.html", value:"Makes the interaction workflow useful without staff/customers repeatedly refreshing." },
    { rank:2, feature:"Reliable mobile media upload", route:"/detailer-jobs.html", value:"Adds progress, retry, cancellation, offline recovery, and video size guidance for weak jobsite connections." },
    { rank:3, feature:"Proof checklist + required media", route:"/detailer-jobs.html", value:"Ensures arrival, condition, work, and final proof are complete before job close." },
    { rank:4, feature:"In-job recommendation approval", route:"/progress.html", value:"Lets customers approve add-on work and price changes while the detailer is onsite." },
    { rank:5, feature:"Completed-job summary", route:"/admin-workflow.html", value:"Combines proof, invoice, care advice, review request, and maintenance recommendation." },
    { rank:6, feature:"Approved media reuse", route:"/admin-gallery.html", value:"Moves approved final media into Gallery, vehicle history, review proof, and local landing pages without duplicate upload." },
    { rank:7, feature:"Today-needs-attention dashboard", route:"/admin.html", value:"Groups unread replies, pending approvals, incidents, quote follow-ups, and payments into one owner view." },
    { rank:8, feature:"Storage and retention diagnostics", route:"/admin.html", value:"Finds orphan uploads, broken paths, oversized video, and media that should be archived." },
    { rank:9, feature:"Real quote-to-booking CRUD", route:"/admin-quotes.html", value:"Turns the existing pipeline foundation into a live revenue and follow-up system." },
    { rank:10, feature:"Review and repeat-maintenance automation", route:"/admin-growth.html", value:"Connects successful completed jobs to trust, referrals, and predictable repeat revenue." }
  ],
  competitor_patterns_reviewed: [
    "mobile job photos/videos and damage documentation",
    "required checklists, findings, approvals, signatures, and proof of work",
    "customer portals and progress messaging",
    "route-aware scheduling and on-my-way communication",
    "quotes, invoices, payments, automated follow-up, and CRM history",
    "reviews, memberships, recurring service, and fleet workflows"
  ],
  visual_enrichment: [
    "Use customer-approved live progress photos as eventual before/after proof instead of generic stock images.",
    "Add video thumbnail/poster frames and captions for progress clips.",
    "Use stage icons and colour-safe badges for arrival, condition, during, final, recommendation, and issue updates.",
    "Keep staff-only and review-pending cards visually distinct without exposing their content publicly.",
    "Continue mobile touch-target, overflow, sticky-action, reduced-motion, and media aspect-ratio checks.",
    "Replace placeholders with owned local images after consent and approval."
  ],
  next_step: "Apply the Build 209 migration, live-test all three audiences, then add notifications/unread state and reliable mobile upload recovery."
};

export async function onRequestGet({ request, env }) {
  try {
    const access = await requireStaffAccess({ request, env, capability: "manage_promos", allowLegacyAdminFallback: true });
    if (!access.ok) return withCors(access.response);
    return withCors(json(REPORT));
  } catch (err) {
    return withCors(json({ ok:false, error:err?.message || "Could not load value-added sanity report." }, 500));
  }
}

export async function onRequestOptions() { return new Response("", { status:204, headers:corsHeaders() }); }
function corsHeaders() { return { "Access-Control-Allow-Origin":"*", "Access-Control-Allow-Methods":"GET,OPTIONS", "Access-Control-Allow-Headers":"Content-Type,x-admin-password,x-staff-email,x-staff-user-id", "Cache-Control":"no-store" }; }
function withCors(response) { const headers = new Headers(response.headers || {}); for (const [key,value] of Object.entries(corsHeaders())) headers.set(key,value); return new Response(response.body, { status:response.status, statusText:response.statusText, headers }); }
