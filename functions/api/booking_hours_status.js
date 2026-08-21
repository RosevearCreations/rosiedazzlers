// File: /functions/api/booking_hours_status.js
// Build 191: public business-hours / holiday-closure status using editable settings.
import { loadEditableSetting } from "./_lib/editable-settings.js";
import { serviceHeaders } from "./_lib/staff-auth.js";

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const dateText = String(url.searchParams.get("date") || "").trim();
  const loaded = await loadEditableSetting(env, "business_hours_holidays", { headers: serviceHeaders(env) }).catch(() => null);
  const value = loaded?.value || {};
  const date = parseDate(dateText) || new Date();
  const ymd = date.toISOString().slice(0, 10);
  const dayKey = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"][date.getUTCDay()];
  const closures = Array.isArray(value.holiday_closures) ? value.holiday_closures : [];
  const closure = closures.find((item) => String(item.date || item.day || "").slice(0,10) === ymd) || null;
  const hours = value.hours && typeof value.hours === "object" ? value.hours : {};
  return json({ ok: true, date: ymd, day: dayKey, is_closed: !!closure, closure, hours_label: closure ? (closure.label || closure.reason || "Closed") : (hours[dayKey] || "By appointment"), source_status: loaded?.source_status || "bundled_json_fallback", timezone: value.timezone || "America/Toronto", notes: value.notes || "Availability is by appointment and may depend on weather, driveway access, municipal rules, and service scope." });
}
function parseDate(value) { if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null; const d = new Date(`${value}T12:00:00Z`); return Number.isNaN(d.getTime()) ? null : d; }
function json(data, status = 200) { return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "public, max-age=120" } }); }
