// Build 171 lead_quote_preview endpoint for Admin Leads quote starters.
import { requireStaffAccess, json, serviceHeaders, cleanText, isUuid, methodNotAllowed } from "../_lib/staff-auth.js";

const LEAD_SELECT = [
  "id",
  "topic",
  "full_name",
  "email",
  "phone",
  "service_area",
  "vehicle_count",
  "preferred_cadence",
  "source_path",
  "message",
  "photo_estimate_links",
  "status",
  "staff_note",
  "converted_booking_id",
  "created_at",
  "updated_at"
].join(",");

const UPLOAD_SELECT_EXTENDED = [
  "id",
  "lead_id",
  "booking_id",
  "media_url",
  "filename",
  "content_type",
  "file_size_bytes",
  "status",
  "privacy_status",
  "privacy_note",
  "staff_note",
  "created_at",
  "linked_at"
].join(",");

const UPLOAD_SELECT_BASE = [
  "id",
  "lead_id",
  "booking_id",
  "media_url",
  "filename",
  "content_type",
  "file_size_bytes",
  "status",
  "privacy_status",
  "created_at",
  "linked_at"
].join(",");

export async function onRequestPost({ request, env }) {
  try {
    if (!hasSupabaseConfig(env)) {
      return withCors(json({ ok: false, error: "Server configuration is incomplete. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY/SUPABASE_SERVICE_KEY." }, 500));
    }

    const body = await request.json().catch(() => ({}));
    const access = await requireStaffAccess({
      request,
      env,
      body,
      capability: "manage_bookings",
      allowLegacyAdminFallback: true
    });
    if (!access.ok) return withCors(access.response);

    const id = cleanText(body.id || body.lead_id);
    if (!isUuid(id)) return withCors(json({ ok: false, error: "Valid lead id is required." }, 400));

    const lead = await loadLead(env, id);
    if (!lead) return withCors(json({ ok: false, error: "Lead not found." }, 404));

    const uploadsResult = await loadUploadsForLead(env, id);
    const quote = buildQuotePreview({ lead, uploads: uploadsResult.uploads, actor: access.actor });

    return withCors(json({
      ok: true,
      lead,
      uploads: uploadsResult.uploads,
      uploads_ready: uploadsResult.ready,
      warnings: uploadsResult.warnings,
      quote,
      actor: actorSummary(access.actor)
    }));
  } catch (err) {
    return withCors(json({
      ok: false,
      error: err?.message || "Could not build quote preview.",
      migration_hint: "Run the Build 167/168 lead and photo-estimate SQL before relying on lead quote preview."
    }, 500));
  }
}

export async function onRequestGet() {
  return withCors(methodNotAllowed());
}

export async function onRequestOptions() {
  return new Response("", { status: 204, headers: corsHeaders() });
}

async function loadLead(env, id) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/public_inquiry_leads?select=${encodeURIComponent(LEAD_SELECT)}&id=eq.${encodeURIComponent(id)}&limit=1`, {
    headers: serviceHeaders(env)
  });
  const text = await res.text();
  const data = safeJson(text);
  if (!res.ok) throw new Error(extractSupabaseError(data, text, "Could not load lead."));
  return Array.isArray(data) ? data[0] || null : null;
}

async function loadUploadsForLead(env, leadId) {
  try {
    return { uploads: await loadUploadsWithSelect(env, leadId, UPLOAD_SELECT_EXTENDED), ready: true, warnings: [] };
  } catch (err) {
    const message = String(err?.message || "");
    if (/privacy_note|staff_note|column/i.test(message)) {
      return { uploads: await loadUploadsWithSelect(env, leadId, UPLOAD_SELECT_BASE), ready: false, warnings: ["Photo uploads loaded without Build 168 review-note fields."] };
    }
    if (/photo_estimate_uploads|relation|does not exist|schema cache/i.test(message)) {
      return { uploads: [], ready: false, warnings: ["Photo estimate upload table is not available yet."] };
    }
    throw err;
  }
}

async function loadUploadsWithSelect(env, leadId, select) {
  const params = new URLSearchParams();
  params.set("select", select);
  params.set("lead_id", `eq.${leadId}`);
  params.set("order", "created_at.desc");
  params.set("limit", "25");
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/photo_estimate_uploads?${params.toString()}`, {
    headers: serviceHeaders(env)
  });
  const text = await res.text();
  const data = safeJson(text);
  if (!res.ok) throw new Error(extractSupabaseError(data, text, "Could not load linked uploads."));
  return Array.isArray(data) ? data : [];
}

function buildQuotePreview({ lead, uploads, actor }) {
  const topic = cleanSlug(lead.topic);
  const suggestedPath = suggestPath(lead, uploads);
  const privacyWarnings = buildPrivacyWarnings(uploads);
  const contactLine = [lead.full_name, lead.email, lead.phone].filter(Boolean).join(" | ") || "No contact details supplied";
  const vehicleLine = [
    lead.vehicle_count ? `${lead.vehicle_count} vehicle(s)` : null,
    lead.preferred_cadence ? `cadence: ${lead.preferred_cadence}` : null,
    lead.service_area ? `area: ${lead.service_area}` : null
  ].filter(Boolean).join(" | ") || "Vehicle/cadence not specified";
  const links = cleanArray(lead.photo_estimate_links);

  const checklist = [
    "Confirm service area, driveway/parking access, water/power access, and weather backup plan.",
    "Review photos/videos before promising a fixed price for pet hair, salt, odour, paint correction, ceramic coating, or fleet/work trucks.",
    "Use quote-safe language: starting price, final price after review, and no public photo use until privacy review is complete.",
    "If this becomes a booking, copy this preview into the booking note and set the lead status to quoted or converted."
  ];

  const copyLines = [
    `Rosie Dazzlers quote starter — ${human(topic)}`,
    `Lead: ${lead.full_name || "Unnamed lead"} (${lead.id})`,
    `Contact: ${contactLine}`,
    `Vehicle/Cadence: ${vehicleLine}`,
    `Suggested path: ${suggestedPath.title}`,
    `Suggested next step: ${suggestedPath.next_step}`,
    `Customer message: ${lead.message || "No message supplied."}`,
    links.length ? `Customer photo/share links: ${links.join(" | ")}` : "Customer photo/share links: none supplied",
    uploads.length ? `Linked uploads: ${uploads.map(uploadSummary).join(" | ")}` : "Linked uploads: none linked yet",
    privacyWarnings.length ? `Privacy warnings: ${privacyWarnings.join(" | ")}` : "Privacy warnings: none found in linked upload statuses",
    `Staff note: ${lead.staff_note || "No staff note yet."}`,
    `Checklist: ${checklist.join(" ")}`,
    `Prepared by: ${actor?.full_name || actor?.email || "staff"}`
  ];

  return {
    topic,
    title: suggestedPath.title,
    next_step: suggestedPath.next_step,
    checklist,
    privacy_warnings: privacyWarnings,
    copy_text: copyLines.join("\n")
  };
}

function suggestPath(lead, uploads) {
  const topic = cleanSlug(lead.topic);
  const message = String(lead.message || "").toLowerCase();
  const hasUploads = Array.isArray(uploads) && uploads.length > 0;

  if (topic === "fleet") {
    return {
      title: "Fleet/work-vehicle quote review",
      next_step: "Confirm vehicle count, vehicle types, parking logistics, service cadence, and whether the first visit should be a paid test detail."
    };
  }
  if (topic === "maintenance") {
    return {
      title: "Maintenance plan fit check",
      next_step: "Confirm previous detail condition, preferred cadence, storage/parking conditions, and whether an initial deep clean is needed before maintenance pricing."
    };
  }
  if (topic === "gift_card") {
    return {
      title: "Gift-card package recommendation",
      next_step: "Confirm recipient vehicle size, service area, and whether the gift should be a fixed dollar value or package-style certificate."
    };
  }
  if (topic === "special") {
    return {
      title: "Special offer eligibility check",
      next_step: "Confirm the requested special, vehicle size, condition, and whether any quote-required add-ons should be excluded from instant pricing."
    };
  }
  if (topic === "photo_estimate" || hasUploads) {
    return {
      title: "Photo-estimate review",
      next_step: "Review all supplied photos/videos, then recommend a package plus any quote-required add-ons before sending a final price range."
    };
  }
  if (/pet hair|dog|cat|odor|odour|salt|stain|shampoo|mold|mould/.test(message)) {
    return {
      title: "Condition-heavy interior review",
      next_step: "Ask for photos if missing, then compare Basic, Interior, Complete, pet hair, odour, shampoo, and salt-removal needs."
    };
  }
  if (/paint|scratch|polish|ceramic|coating|wax|sealant|clay/.test(message)) {
    return {
      title: "Exterior/paint-condition review",
      next_step: "Ask for daylight paint photos if missing, then separate wash, clay, sealant, paint correction, and coating expectations."
    };
  }
  return {
    title: "General mobile detailing quote starter",
    next_step: "Confirm vehicle size, current condition, location, and whether the customer wants quick clean, full detail, or quote-first add-ons."
  };
}

function buildPrivacyWarnings(uploads) {
  const warnings = [];
  for (const upload of Array.isArray(uploads) ? uploads : []) {
    const status = cleanSlug(upload.privacy_status);
    if (!status || status === "pending_review") warnings.push(`${upload.filename || upload.id}: privacy review pending`);
    if (status === "needs_blur") warnings.push(`${upload.filename || upload.id}: blur/crop needed before public use`);
    if (status === "rejected") warnings.push(`${upload.filename || upload.id}: rejected for media use`);
  }
  return warnings;
}

function uploadSummary(upload) {
  const label = upload.filename || upload.media_url || upload.id || "upload";
  const privacy = upload.privacy_status ? `privacy ${human(upload.privacy_status)}` : "privacy unknown";
  const status = upload.status ? `status ${human(upload.status)}` : "status unknown";
  return `${label} (${status}, ${privacy})`;
}

function cleanArray(value) {
  return Array.isArray(value) ? value.map((item) => cleanText(item)).filter(Boolean).slice(0, 20) : [];
}

function cleanSlug(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9_ -]+/g, "").replace(/\s+/g, "_");
}

function human(value) {
  return String(value || "").replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase()) || "—";
}

function actorSummary(actor) {
  return actor ? { id: actor.id || null, full_name: actor.full_name || null, email: actor.email || null } : null;
}

function safeJson(text) {
  try { return JSON.parse(text); } catch { return null; }
}

function extractSupabaseError(data, text, fallback) {
  if (data && data.message) return data.message;
  if (typeof text === "string" && text.trim()) return text.slice(0, 300);
  return fallback;
}

function hasSupabaseConfig(env) {
  return !!(env?.SUPABASE_URL && getSupabaseServiceRoleKey(env));
}

function getSupabaseServiceRoleKey(env) {
  return env?.SUPABASE_SERVICE_ROLE_KEY || env?.SUPABASE_SERVICE_KEY || env?.SUPABASE_SERVICE_ROLE || env?.SUPABASE_SECRET_KEY || "";
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-admin-password, x-staff-email, x-staff-user-id",
    "Cache-Control": "no-store"
  };
}

function withCors(response) {
  const headers = new Headers(response.headers || {});
  for (const [key, value] of Object.entries(corsHeaders())) headers.set(key, value);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
