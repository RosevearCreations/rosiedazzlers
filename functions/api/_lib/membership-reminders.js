import { serviceHeaders } from "./staff-auth.js";
import { dispatchNotificationThroughProvider } from "./provider-dispatch.js";

export const MEMBERSHIP_REMINDER_DEFAULTS = {
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
};

export async function loadMembershipPlanSettings(env) {
  const settings = { ...MEMBERSHIP_REMINDER_DEFAULTS };
  try {
    if (!env?.SUPABASE_URL || !env?.SUPABASE_SERVICE_ROLE_KEY) return settings;
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/app_management_settings?select=value&key=eq.membership_plan_settings&limit=1`, {
      headers: serviceHeaders(env)
    });
    if (!res.ok) return settings;
    const rows = await res.json().catch(() => []);
    const row = Array.isArray(rows) ? rows[0] || null : null;
    return { ...settings, ...(row?.value && typeof row.value === "object" ? row.value : {}) };
  } catch {
    return settings;
  }
}

export function cycleDaysFromLabel(label) {
  const text = String(label || "").toLowerCase();
  if (text.includes("4")) return 28;
  if (text.includes("6")) return 42;
  if (text.includes("8")) return 56;
  if (text.includes("month")) return 30;
  return 35;
}

export function computeNextReminderAt(label, baseDate = new Date()) {
  const days = cycleDaysFromLabel(label);
  const next = new Date(baseDate.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  next.setUTCHours(13, 0, 0, 0);
  return next.toISOString();
}

export function reminderDue(row, settings, now = new Date()) {
  if (!settings?.reminder_enabled) return { due: false, reason: "reminders_disabled" };
  if (row?.reminder_opt_in === false) return { due: false, reason: "opted_out" };
  if (!String(row?.email || "").trim()) return { due: false, reason: "missing_email" };
  const nextReminderAt = row?.next_reminder_at ? new Date(row.next_reminder_at) : null;
  if (!nextReminderAt || Number.isNaN(nextReminderAt.getTime())) return { due: true, reason: "missing_schedule" };
  return { due: nextReminderAt.getTime() <= now.getTime(), reason: nextReminderAt.getTime() <= now.getTime() ? "due" : "waiting" };
}

export async function processMembershipReminderRow(env, row, settings, options = {}) {
  const due = reminderDue(row, settings, options.now || new Date());
  if (!due.due) return { ok: false, skipped: true, reason: due.reason, id: row.id };
  const origin = String(env?.SITE_ORIGIN || options.origin || "https://rosiedazzlers.ca").replace(/\/+$/, "");
  const bookingUrl = `${origin}/pricing#booking-planner`;
  const planUrl = `${origin}/maintenance-plan`;
  const subject = settings.reminder_subject || MEMBERSHIP_REMINDER_DEFAULTS.reminder_subject;
  const intro = settings.reminder_intro || MEMBERSHIP_REMINDER_DEFAULTS.reminder_intro;
  const body_text = [
    `Hi ${row.full_name || "there"},`,
    "",
    intro,
    `Preferred cycle: ${row.preferred_cycle || settings.cycle_label || "Recurring clean"}`,
    `Book now: ${bookingUrl}`,
    `Maintenance-plan details: ${planUrl}`,
    row.notes ? `Notes on file: ${row.notes}` : null
  ].filter(Boolean).join("\n");
  const body_html = `
    <h1>${escapeHtml(subject)}</h1>
    <p>Hi ${escapeHtml(row.full_name || "there")},</p>
    <p>${escapeHtml(intro)}</p>
    <p><strong>Preferred cycle:</strong> ${escapeHtml(row.preferred_cycle || settings.cycle_label || "Recurring clean")}</p>
    <p><a href="${bookingUrl}">Book now</a><br><a href="${planUrl}">Maintenance-plan details</a></p>
    ${row.notes ? `<p><strong>Notes on file:</strong> ${escapeHtml(row.notes)}</p>` : ""}
  `;

  const eventRes = await fetch(`${env.SUPABASE_URL}/rest/v1/notification_events`, {
    method: "POST",
    headers: { ...serviceHeaders(env), Prefer: "return=representation" },
    body: JSON.stringify([{
      event_type: "maintenance_plan_reminder_email",
      channel: settings.reminder_channel || "email",
      recipient_email: row.email,
      payload: {
        template_key: "maintenance_plan_reminder",
        membership_interest_request_id: row.id,
        booking_url: bookingUrl,
        plan_url: planUrl,
        preferred_cycle: row.preferred_cycle || null
      },
      status: "queued",
      attempt_count: 0,
      next_attempt_at: new Date().toISOString(),
      max_attempts: 5,
      subject,
      body_text,
      body_html
    }])
  });
  const eventRows = await eventRes.json().catch(() => []);
  const event = Array.isArray(eventRows) ? eventRows[0] || null : null;
  if (!eventRes.ok || !event) {
    return { ok: false, error: "Could not queue maintenance reminder.", id: row.id };
  }

  const dispatch = await dispatchNotificationThroughProvider(env, event);
  const eventPatch = dispatch.ok
    ? { status: "sent", attempt_count: 1, next_attempt_at: null, last_error: null, provider_response: dispatch.provider_response || null }
    : { status: "failed", attempt_count: 1, next_attempt_at: new Date(Date.now() + 30 * 60000).toISOString(), last_error: dispatch.error || "Dispatch failed." };
  await fetch(`${env.SUPABASE_URL}/rest/v1/notification_events?id=eq.${encodeURIComponent(event.id)}`, {
    method: "PATCH",
    headers: { ...serviceHeaders(env), Prefer: "return=minimal" },
    body: JSON.stringify(eventPatch)
  }).catch(() => null);

  const nextReminderAt = computeNextReminderAt(row.preferred_cycle || settings.cycle_label, options.now || new Date());
  await fetch(`${env.SUPABASE_URL}/rest/v1/membership_interest_requests?id=eq.${encodeURIComponent(row.id)}`, {
    method: "PATCH",
    headers: { ...serviceHeaders(env), Prefer: "return=minimal" },
    body: JSON.stringify({
      reminder_status: dispatch.ok ? "sent" : "failed",
      reminder_count: Number(row.reminder_count || 0) + 1,
      last_reminder_at: new Date().toISOString(),
      next_reminder_at: nextReminderAt
    })
  }).catch(() => null);

  return { ok: dispatch.ok, id: row.id, notification_event_id: event.id, next_reminder_at: nextReminderAt, error: dispatch.error || null };
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
