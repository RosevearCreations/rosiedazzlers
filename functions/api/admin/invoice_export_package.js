// File: /functions/api/admin/invoice_export_package.js
// Build 195: export a booking invoice/confirmation package as JSON or simple printable HTML.

import { requireStaffAccess, json } from "../_lib/staff-auth.js";
import { loadBookingDocumentPayloadById } from "../_lib/booking-documents.js";

export async function onRequestGet({ request, env }) {
  const auth = await requireStaffAccess({ request, env, capability: "manage_bookings", allowLegacyAdminFallback: true });
  if (!auth.ok) return auth.response;
  const url = new URL(request.url);
  const bookingId = String(url.searchParams.get("booking_id") || "").trim();
  const format = String(url.searchParams.get("format") || "json").toLowerCase();
  if (!bookingId) return json({ ok: false, error: "booking_id is required." }, 400);
  const document = await loadBookingDocumentPayloadById(env, bookingId);
  if (!document) return json({ ok: false, error: "Booking document could not be loaded." }, 404);
  const packagePayload = { ok: true, build: "195", exported_at: new Date().toISOString(), booking_id: bookingId, package: { invoice: document.rendered_templates?.invoice || {}, appointment_confirmation: document.rendered_templates?.appointment_confirmation || {}, public_links: document.documents || {}, summary: document.summary || {}, policy_stamp: document.policy_stamp || null } };
  if (format === "html") return new Response(renderHtml(packagePayload), { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
  return json(packagePayload);
}
function renderHtml(payload) { const pkg = payload.package || {}; return `<!doctype html><html><head><meta charset="utf-8"><title>Rosie Dazzlers Invoice Export</title></head><body><h1>Invoice export package</h1><p><strong>Booking:</strong> ${escapeHtml(payload.booking_id)}</p><h2>Invoice</h2><p><strong>${escapeHtml(pkg.invoice?.subject || "")}</strong></p><p>${escapeHtml(pkg.invoice?.body || "")}</p><h2>Appointment confirmation</h2><p><strong>${escapeHtml(pkg.appointment_confirmation?.subject || "")}</strong></p><p>${escapeHtml(pkg.appointment_confirmation?.body || "")}</p><pre>${escapeHtml(JSON.stringify(payload, null, 2))}</pre></body></html>`; }
function escapeHtml(value) { return String(value ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;"); }
