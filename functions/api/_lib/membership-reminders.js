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
  const number = Number.parseInt(text.replace(/[^0-9]/g, ""), 10);
  if (Number.isFinite(number) && number > 0) {
    if (text.includes("week")) return number * 7;
    if (text.includes("day")) return number;
    if (text.includes("month")) return number * 30;
  }
  if (text.includes("4")) return 28;
  if (text.includes("6")) return 42;
  if (text.includes("8")) return 56;
  if (text.includes("month")) return 30;
  return 35;
}

export function normalizeCycleDays(value, fallbackLabel = MEMBERSHIP_REMINDER_DEFAULTS.cycle_label) {
  const num = Math.floor(Number(value || 0));
  if (Number.isFinite(num) && num >= 14 && num <= 84) return num;
  return cycleDaysFromLabel(fallbackLabel);
}

export function computeNextReminderAt(labelOrDays, baseDate = new Date()) {
  const days = typeof labelOrDays === "number"
    ? normalizeCycleDays(labelOrDays)
    : cycleDaysFromLabel(labelOrDays);
  const next = new Date(baseDate.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  next.setUTCHours(13, 0, 0, 0);
  return next.toISOString();
}

export async function buildMembershipReminderCandidates(env, settings, options = {}) {
  const limit = Math.max(1, Math.min(500, Math.floor(Number(options.limit || 250))));
  const bookingRows = await fetchCompletedBookings(env, limit);
  const bookingProfileIds = Array.from(new Set(bookingRows.map((row) => cleanText(row?.customer_profile_id)).filter(Boolean)));
  const savedVehiclesByProfile = await fetchCustomerVehiclesByProfileIds(env, bookingProfileIds);
  const grouped = groupCompletedBookings(bookingRows, savedVehiclesByProfile);
  const profileIds = Array.from(new Set(grouped.map((row) => row.customer_profile_id).filter(Boolean)));
  const profiles = await fetchCustomerProfilesByIds(env, profileIds);
  const reminderHistory = await fetchReminderHistoryMap(env, grouped.map((row) => row.email).filter(Boolean));
  const origin = String(env?.SITE_ORIGIN || options.origin || "https://rosiedazzlers.ca").replace(/\/+$/, "");
  const now = options.now instanceof Date ? options.now : new Date();
  const fallbackCycle = normalizeCycleDays(null, settings?.cycle_label || MEMBERSHIP_REMINDER_DEFAULTS.cycle_label);

  const candidates = grouped.map((summary) => {
    const profile = summary.customer_profile_id ? profiles.get(summary.customer_profile_id) || null : null;
    const vehicle = summary.customer_vehicle || null;
    const exactHistory = reminderHistory.get(reminderHistoryKey(summary.email, summary.maintenance_vehicle_key)) || null;
    const legacyHistory = exactHistory ? null : reminderHistory.get(reminderHistoryKey(summary.email, "legacy")) || null;
    const lastReminderAt = exactHistory?.last_reminder_at || legacyHistory?.last_reminder_at || null;
    const preferredCycle = vehicle?.service_interval_days ?? profile?.maintenance_cycle_days;
    const cycleDays = inferCycleDays(summary.bookings, preferredCycle, fallbackCycle);
    const calculatedNextReminderAt = computeNextReminderAt(cycleDays, new Date(summary.last_service_at));
    const nextReminderAt = normalizeDueDateIso(vehicle?.next_cleaning_due_at) || calculatedNextReminderAt;
    const reminderOptIn = vehicle?.notification_opt_in ?? profile?.maintenance_reminder_opt_in ?? profile?.notification_opt_in ?? true;
    const dueState = reminderCandidateDue({
      email: summary.email,
      reminder_opt_in: reminderOptIn,
      eligible_for_maintenance: summary.has_complete_detail,
      vehicle_identity_reliable: summary.vehicle_identity_reliable,
      last_service_at: summary.last_service_at,
      last_reminder_at: lastReminderAt,
      next_reminder_at: nextReminderAt
    }, settings, now);

    return {
      candidate_key: `vehicle-${summary.maintenance_vehicle_key}`,
      maintenance_vehicle_key: summary.maintenance_vehicle_key,
      customer_profile_id: summary.customer_profile_id || null,
      customer_vehicle_id: vehicle?.id || null,
      full_name: profile?.full_name || summary.full_name || "Customer",
      email: summary.email || profile?.email || null,
      phone: profile?.phone || summary.phone || null,
      postal_code: profile?.postal_code || summary.postal_code || null,
      booking_count: summary.booking_count,
      last_service_at: summary.last_service_at,
      previous_service_at: summary.previous_service_at,
      cycle_days: cycleDays,
      cycle_label: cycleLabelFromDays(cycleDays),
      cycle_source: vehicle?.service_interval_days ? "staff_vehicle_override" : (summary.booking_count > 1 ? "vehicle_history" : "profile_or_plan_default"),
      has_complete_detail: summary.has_complete_detail,
      eligible_for_maintenance: summary.has_complete_detail && summary.vehicle_identity_reliable,
      latest_complete_detail_at: summary.latest_complete_detail_at,
      last_reminder_at: lastReminderAt,
      next_reminder_at: nextReminderAt,
      next_reminder_source: vehicle?.next_cleaning_due_at ? "staff_vehicle_override" : "vehicle_cadence",
      reminder_status: dueState.reason,
      reminder_count: Number(exactHistory?.reminder_count || 0),
      customer_reminder_count: Number(profile?.maintenance_reminder_count || 0),
      reminder_opt_in: reminderOptIn,
      vehicle_identity_reliable: summary.vehicle_identity_reliable,
      vehicle_identity_source: summary.vehicle_identity_source,
      vehicle_label: summary.vehicle_label,
      vehicle_year: summary.latest_booking?.vehicle_year || null,
      vehicle_make: cleanText(summary.latest_booking?.vehicle_make) || null,
      vehicle_model: cleanText(summary.latest_booking?.vehicle_model) || null,
      latest_booking_id: summary.latest_booking?.id || null,
      latest_package_code: summary.latest_booking?.package_code || null,
      latest_vehicle_size: summary.latest_booking?.vehicle_size || null,
      latest_service_area: summary.latest_booking?.service_area || null,
      latest_customer_name: summary.latest_booking?.customer_name || summary.full_name || null,
      latest_addon_codes: extractAddonCodes(summary.latest_booking?.addons),
      booking_url: buildBookingUrl(origin, summary.latest_booking),
      plan_url: `${origin}/maintenance-plan`,
      staff_auto_schedule_opt_in: vehicle?.auto_schedule_opt_in === true,
      due: dueState.due,
      due_reason: dueState.reason
    };
  });

  candidates.sort((a, b) => {
    if (a.due !== b.due) return a.due ? -1 : 1;
    if (a.vehicle_identity_reliable !== b.vehicle_identity_reliable) return a.vehicle_identity_reliable ? -1 : 1;
    return String(b.last_service_at || "").localeCompare(String(a.last_service_at || ""));
  });

  return candidates;
}

export function reminderCandidateDue(candidate, settings, now = new Date()) {
  if (!settings?.reminder_enabled) return { due: false, reason: "reminders_disabled" };
  if (candidate?.vehicle_identity_reliable === false) return { due: false, reason: "vehicle_identity_required" };
  if (!candidate?.eligible_for_maintenance) return { due: false, reason: "requires_complete_detail" };
  if (candidate?.reminder_opt_in === false) return { due: false, reason: "opted_out" };
  if (!String(candidate?.email || "").trim()) return { due: false, reason: "missing_email" };
  const lastServiceAt = parseDate(candidate?.last_service_at);
  if (!lastServiceAt) return { due: false, reason: "missing_service_history" };
  const lastReminderAt = parseDate(candidate?.last_reminder_at);
  if (lastReminderAt && lastReminderAt.getTime() >= lastServiceAt.getTime()) {
    return { due: false, reason: "already_reminded_for_latest_service" };
  }
  const nextReminderAt = parseDate(candidate?.next_reminder_at) || parseDate(computeNextReminderAt(candidate?.cycle_days || settings?.cycle_label, lastServiceAt));
  if (!nextReminderAt) return { due: false, reason: "missing_schedule" };
  return nextReminderAt.getTime() <= now.getTime()
    ? { due: true, reason: "due" }
    : { due: false, reason: "waiting" };
}

export async function processMembershipReminderCandidate(env, candidate, settings, options = {}) {
  const due = reminderCandidateDue(candidate, settings, options.now || new Date());
  const candidateId = candidate.candidate_key || candidate.customer_profile_id || candidate.email;
  if (!due.due) return { ok: false, skipped: true, reason: due.reason, id: candidateId };
  const origin = String(env?.SITE_ORIGIN || options.origin || "https://rosiedazzlers.ca").replace(/\/+$/, "");
  const bookingUrl = candidate.booking_url || `${origin}/book`;
  const planUrl = candidate.plan_url || `${origin}/maintenance-plan`;
  const subject = settings.reminder_subject || MEMBERSHIP_REMINDER_DEFAULTS.reminder_subject;
  const intro = settings.reminder_intro || MEMBERSHIP_REMINDER_DEFAULTS.reminder_intro;
  const lastServiceLabel = formatDateLabel(candidate.last_service_at);
  const vehicleLine = candidate.vehicle_label ? `Vehicle: ${candidate.vehicle_label}` : null;
  const body_text = [
    `Hi ${candidate.full_name || "there"},`,
    "",
    intro,
    vehicleLine,
    lastServiceLabel ? `Your last clean with Rosie Dazzlers was ${lastServiceLabel}.` : null,
    candidate.latest_package_code ? `Last package: ${candidate.latest_package_code}` : null,
    candidate.latest_service_area ? `Last service area: ${candidate.latest_service_area}` : null,
    `Suggested maintenance cycle: ${candidate.cycle_label || settings.cycle_label || "Recurring clean"}`,
    `Book now: ${bookingUrl}`,
    `Maintenance-plan details: ${planUrl}`
  ].filter(Boolean).join("\n");
  const body_html = `
    <h1>${escapeHtml(subject)}</h1>
    <p>Hi ${escapeHtml(candidate.full_name || "there")},</p>
    <p>${escapeHtml(intro)}</p>
    ${candidate.vehicle_label ? `<p><strong>Vehicle:</strong> ${escapeHtml(candidate.vehicle_label)}</p>` : ""}
    ${lastServiceLabel ? `<p><strong>Your last clean:</strong> ${escapeHtml(lastServiceLabel)}</p>` : ""}
    ${candidate.latest_package_code ? `<p><strong>Last package:</strong> ${escapeHtml(candidate.latest_package_code)}</p>` : ""}
    ${candidate.latest_service_area ? `<p><strong>Last service area:</strong> ${escapeHtml(candidate.latest_service_area)}</p>` : ""}
    <p><strong>Suggested maintenance cycle:</strong> ${escapeHtml(candidate.cycle_label || settings.cycle_label || "Recurring clean")}</p>
    <p><a href="${bookingUrl}">Book your next clean</a><br><a href="${planUrl}">Maintenance-plan details</a></p>
  `;

  const eventRes = await fetch(`${env.SUPABASE_URL}/rest/v1/notification_events`, {
    method: "POST",
    headers: { ...serviceHeaders(env), Prefer: "return=representation" },
    body: JSON.stringify([{
      event_type: "maintenance_plan_reminder_email",
      channel: settings.reminder_channel || "email",
      booking_id: candidate.latest_booking_id || null,
      customer_profile_id: candidate.customer_profile_id || null,
      recipient_email: candidate.email,
      payload: {
        template_key: "maintenance_plan_reminder",
        maintenance_source: "vehicle_history",
        maintenance_vehicle_key: candidate.maintenance_vehicle_key,
        customer_profile_id: candidate.customer_profile_id || null,
        customer_vehicle_id: candidate.customer_vehicle_id || null,
        latest_booking_id: candidate.latest_booking_id || null,
        vehicle_label: candidate.vehicle_label || null,
        vehicle_identity_source: candidate.vehicle_identity_source || null,
        booking_url: bookingUrl,
        plan_url: planUrl,
        cycle_days: candidate.cycle_days,
        last_service_at: candidate.last_service_at || null
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
    return { ok: false, error: "Could not queue maintenance reminder.", id: candidateId };
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

  if (candidate.customer_profile_id) {
    await fetch(`${env.SUPABASE_URL}/rest/v1/customer_profiles?id=eq.${encodeURIComponent(candidate.customer_profile_id)}`, {
      method: "PATCH",
      headers: { ...serviceHeaders(env), Prefer: "return=minimal" },
      body: JSON.stringify({
        maintenance_last_reminder_at: new Date().toISOString(),
        maintenance_reminder_status: dispatch.ok ? "sent" : "failed",
        maintenance_reminder_count: Number(candidate.customer_reminder_count || 0) + 1
      })
    }).catch(() => null);
  }

  return {
    ok: dispatch.ok,
    id: candidateId,
    notification_event_id: event.id,
    next_reminder_at: computeNextReminderAt(candidate.cycle_days, new Date(candidate.last_service_at)),
    error: dispatch.error || null
  };
}

async function fetchCompletedBookings(env, limit) {
  const select = [
    "id", "customer_profile_id", "customer_vehicle_id", "customer_name", "customer_email", "customer_phone", "postal_code",
    "service_date", "service_area", "package_code", "vehicle_size", "vehicle_year", "vehicle_make", "vehicle_model", "vehicle_plate",
    "addons", "completed_at", "detailing_completed_at", "job_status", "status"
  ].join(",");
  const url = `${env.SUPABASE_URL}/rest/v1/bookings?select=${select}&or=(completed_at.not.is.null,detailing_completed_at.not.is.null,job_status.eq.completed,status.eq.completed)&order=service_date.desc&limit=${limit}`;
  const res = await fetch(url, { headers: serviceHeaders(env) });
  if (!res.ok) return [];
  const rows = await res.json().catch(() => []);
  return Array.isArray(rows) ? rows : [];
}

async function fetchCustomerVehiclesByProfileIds(env, ids) {
  const cleanIds = Array.from(new Set((Array.isArray(ids) ? ids : []).map((row) => cleanText(row)).filter(Boolean)));
  if (!cleanIds.length) return new Map();
  const select = [
    "id", "customer_profile_id", "vehicle_name", "model_year", "make", "model", "vehicle_size",
    "notification_opt_in", "next_cleaning_due_at", "service_interval_days", "auto_schedule_opt_in",
    "last_package_code", "last_addons", "next_service_mileage_km"
  ].join(",");
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/customer_vehicles?select=${select}&customer_profile_id=in.(${cleanIds.join(",")})`, {
    headers: serviceHeaders(env)
  });
  if (!res.ok) return new Map();
  const rows = await res.json().catch(() => []);
  const map = new Map();
  for (const row of Array.isArray(rows) ? rows : []) {
    const profileId = cleanText(row?.customer_profile_id);
    if (!profileId) continue;
    const list = map.get(profileId) || [];
    list.push(row);
    map.set(profileId, list);
  }
  return map;
}

export function groupCompletedBookings(rows, savedVehiclesByProfile = new Map()) {
  const grouped = new Map();
  for (const row of Array.isArray(rows) ? rows : []) {
    const email = normalizeEmail(row?.customer_email);
    const profileId = cleanText(row?.customer_profile_id);
    const customerKey = profileId || email;
    if (!customerKey) continue;
    const serviceAt = bookingServiceIso(row);
    if (!serviceAt) continue;

    const savedVehicles = profileId ? (savedVehiclesByProfile.get(profileId) || []) : [];
    const identity = resolveVehicleIdentity(row, savedVehicles, customerKey);
    const groupKey = `${customerKey}|${identity.internal_key}`;
    const entry = grouped.get(groupKey) || {
      customer_profile_id: profileId || null,
      customer_key: customerKey,
      customer_vehicle: identity.customer_vehicle || null,
      maintenance_vehicle_key: identity.maintenance_vehicle_key,
      vehicle_identity_source: identity.source,
      vehicle_identity_reliable: identity.reliable,
      vehicle_label: identity.label,
      full_name: cleanText(row?.customer_name) || null,
      email,
      phone: cleanText(row?.customer_phone) || null,
      postal_code: cleanText(row?.postal_code) || null,
      bookings: []
    };
    if (identity.source === "booking_vehicle_link" && entry.vehicle_identity_source !== "booking_vehicle_link") {
      entry.customer_vehicle = identity.customer_vehicle || entry.customer_vehicle;
      entry.vehicle_identity_source = identity.source;
      entry.vehicle_identity_reliable = true;
      entry.vehicle_label = identity.label || entry.vehicle_label;
    }
    entry.bookings.push({ ...row, service_at: serviceAt });
    if (!entry.full_name && row?.customer_name) entry.full_name = cleanText(row.customer_name);
    if (!entry.email && email) entry.email = email;
    if (!entry.phone && row?.customer_phone) entry.phone = cleanText(row.customer_phone);
    if (!entry.postal_code && row?.postal_code) entry.postal_code = cleanText(row.postal_code);
    grouped.set(groupKey, entry);
  }

  return Array.from(grouped.values()).map((entry) => {
    entry.bookings.sort((a, b) => String(b.service_at).localeCompare(String(a.service_at)));
    const latest = entry.bookings[0] || null;
    const previous = entry.bookings[1] || null;
    const completeDetailBookings = entry.bookings.filter((row) => String(row?.package_code || "").trim().toLowerCase() === "complete_detail");
    return {
      customer_profile_id: entry.customer_profile_id,
      customer_vehicle: entry.customer_vehicle,
      maintenance_vehicle_key: entry.maintenance_vehicle_key,
      vehicle_identity_source: entry.vehicle_identity_source,
      vehicle_identity_reliable: entry.vehicle_identity_reliable,
      vehicle_label: entry.vehicle_label,
      full_name: entry.full_name,
      email: entry.email,
      phone: entry.phone,
      postal_code: entry.postal_code,
      bookings: entry.bookings,
      booking_count: entry.bookings.length,
      latest_booking: latest,
      previous_booking: previous,
      has_complete_detail: completeDetailBookings.length > 0,
      latest_complete_detail_booking: completeDetailBookings[0] || null,
      latest_complete_detail_at: completeDetailBookings[0]?.service_at || null,
      last_service_at: latest?.service_at || null,
      previous_service_at: previous?.service_at || null
    };
  });
}

function resolveVehicleIdentity(row, savedVehicles, customerKey) {
  const spec = bookingVehicleSpec(row);
  const linkedVehicleId = cleanText(row?.customer_vehicle_id);
  if (linkedVehicleId) {
    const linked = (Array.isArray(savedVehicles) ? savedVehicles : []).find((vehicle) => cleanText(vehicle?.id) === linkedVehicleId) || null;
    if (linked?.id) {
      const internalKey = `saved:${linkedVehicleId}`;
      return {
        internal_key: internalKey,
        maintenance_vehicle_key: opaqueVehicleKey(`${customerKey}|${internalKey}`),
        source: "booking_vehicle_link",
        reliable: true,
        label: vehicleLabel(spec, linked),
        customer_vehicle: linked
      };
    }

    const bookingId = cleanText(row?.id) || linkedVehicleId;
    const internalKey = `linked-invalid:${bookingId}`;
    return {
      internal_key: internalKey,
      maintenance_vehicle_key: opaqueVehicleKey(`${customerKey}|${internalKey}`),
      source: "booking_vehicle_link_invalid",
      reliable: false,
      label: vehicleLabel(spec, null),
      customer_vehicle: null
    };
  }

  const saved = matchSavedVehicle(spec, savedVehicles);
  const label = vehicleLabel(spec, saved);
  if (saved?.id) {
    const internalKey = `saved:${cleanText(saved.id)}`;
    return {
      internal_key: internalKey,
      maintenance_vehicle_key: opaqueVehicleKey(`${customerKey}|${internalKey}`),
      source: "saved_vehicle",
      reliable: true,
      label,
      customer_vehicle: saved
    };
  }

  const plate = normalizePlate(row?.vehicle_plate ?? row?.vehicle?.plate);
  if (plate) {
    const internalKey = `plate:${plate}`;
    return {
      internal_key: internalKey,
      maintenance_vehicle_key: opaqueVehicleKey(`${customerKey}|${internalKey}`),
      source: "plate",
      reliable: true,
      label,
      customer_vehicle: null
    };
  }

  const bookingId = cleanText(row?.id) || `${cleanText(row?.service_date)}:${opaqueVehicleKey(JSON.stringify(spec))}`;
  const internalKey = `isolated:${bookingId}`;
  return {
    internal_key: internalKey,
    maintenance_vehicle_key: opaqueVehicleKey(`${customerKey}|${internalKey}`),
    source: "isolated",
    reliable: false,
    label,
    customer_vehicle: null
  };
}

function bookingVehicleSpec(row) {
  const vehicle = row?.vehicle && typeof row.vehicle === "object" ? row.vehicle : {};
  return {
    year: normalizeYear(row?.vehicle_year ?? vehicle.year ?? vehicle.model_year),
    make: cleanText(row?.vehicle_make ?? vehicle.make),
    model: cleanText(row?.vehicle_model ?? vehicle.model),
    size: normalizeVehicleSize(row?.vehicle_size ?? vehicle.size ?? vehicle.vehicle_size)
  };
}

function matchSavedVehicle(spec, savedVehicles) {
  if (!spec.year || !spec.make || !spec.model || !spec.size) return null;
  const matches = (Array.isArray(savedVehicles) ? savedVehicles : []).filter((vehicle) => {
    return normalizeYear(vehicle?.model_year) === spec.year
      && normalizeVehicleToken(vehicle?.make) === normalizeVehicleToken(spec.make)
      && normalizeVehicleToken(vehicle?.model) === normalizeVehicleToken(spec.model)
      && normalizeVehicleSize(vehicle?.vehicle_size) === spec.size;
  });
  return matches.length === 1 ? matches[0] : null;
}

function vehicleLabel(spec, saved) {
  const named = cleanText(saved?.vehicle_name);
  if (named) return named;
  const parts = [spec.year, spec.make, spec.model].filter(Boolean);
  return parts.length ? parts.join(" ") : "Vehicle";
}

function opaqueVehicleKey(value) {
  const input = String(value || "");
  let h1 = 0x811c9dc5;
  let h2 = 0x9e3779b9;
  for (let i = 0; i < input.length; i += 1) {
    const code = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ code, 0x01000193);
    h2 = Math.imul(h2 ^ code, 0x85ebca6b);
  }
  return `${(h1 >>> 0).toString(16).padStart(8, "0")}${(h2 >>> 0).toString(16).padStart(8, "0")}`;
}

async function fetchCustomerProfilesByIds(env, ids) {
  const cleanIds = Array.from(new Set((Array.isArray(ids) ? ids : []).map((row) => cleanText(row)).filter(Boolean)));
  if (!cleanIds.length) return new Map();
  const selectPreferred = "id,email,full_name,phone,postal_code,notification_opt_in,notification_channel,maintenance_reminder_opt_in,maintenance_cycle_days,maintenance_last_reminder_at,maintenance_next_reminder_at,maintenance_reminder_status,maintenance_reminder_count";
  const selectFallback = "id,email,full_name,phone,postal_code,notification_opt_in,notification_channel";
  const filters = `id=in.(${cleanIds.join(",")})`;
  const primary = await fetch(`${env.SUPABASE_URL}/rest/v1/customer_profiles?select=${selectPreferred}&${filters}`, { headers: serviceHeaders(env) });
  const res = primary.ok
    ? primary
    : await fetch(`${env.SUPABASE_URL}/rest/v1/customer_profiles?select=${selectFallback}&${filters}`, { headers: serviceHeaders(env) });
  if (!res.ok) return new Map();
  const rows = await res.json().catch(() => []);
  return new Map((Array.isArray(rows) ? rows : []).map((row) => [String(row.id), row]));
}

async function fetchReminderHistoryMap(env, emails) {
  const list = Array.from(new Set((Array.isArray(emails) ? emails : []).map((row) => normalizeEmail(row)).filter(Boolean))).slice(0, 100);
  if (!list.length) return new Map();
  const orFilter = list.map((email) => `recipient_email.eq.${encodeURIComponent(email)}`).join(",");
  const url = `${env.SUPABASE_URL}/rest/v1/notification_events?select=recipient_email,created_at,status,event_type,payload&event_type=eq.maintenance_plan_reminder_email&status=eq.sent&or=(${orFilter})&order=created_at.desc&limit=${Math.max(100, list.length * 8)}`;
  const res = await fetch(url, { headers: serviceHeaders(env) });
  if (!res.ok) return new Map();
  const rows = await res.json().catch(() => []);
  const map = new Map();
  for (const row of Array.isArray(rows) ? rows : []) {
    const email = normalizeEmail(row?.recipient_email);
    if (!email) continue;
    const vehicleKey = cleanText(row?.payload?.maintenance_vehicle_key) || "legacy";
    const key = reminderHistoryKey(email, vehicleKey);
    const current = map.get(key) || { last_reminder_at: null, reminder_count: 0 };
    current.reminder_count += 1;
    current.last_reminder_at = pickLaterIso(current.last_reminder_at, row?.created_at || null);
    map.set(key, current);
  }
  return map;
}

function reminderHistoryKey(email, vehicleKey) {
  return `${normalizeEmail(email)}|${cleanText(vehicleKey) || "legacy"}`;
}

function inferCycleDays(bookings, preferredCycleDays, fallbackDays) {
  const preferred = normalizeCycleDays(preferredCycleDays, fallbackDays);
  if (!Array.isArray(bookings) || bookings.length < 2) return preferred;
  const diffs = [];
  const sorted = [...bookings].sort((a, b) => String(a.service_at).localeCompare(String(b.service_at)));
  for (let i = 1; i < sorted.length; i += 1) {
    const prev = parseDate(sorted[i - 1].service_at);
    const curr = parseDate(sorted[i].service_at);
    if (!prev || !curr) continue;
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86400000);
    if (diffDays >= 14 && diffDays <= 84) diffs.push(diffDays);
  }
  if (!diffs.length) return preferred;
  const recent = diffs.slice(-3);
  const avg = recent.reduce((sum, num) => sum + num, 0) / recent.length;
  if (avg <= 35) return 28;
  if (avg <= 49) return 42;
  return 56;
}

function buildBookingUrl(origin, booking) {
  const url = new URL(`${origin}/book`);
  if (!booking || typeof booking !== "object") return url.toString();
  if (cleanText(booking.package_code)) url.searchParams.set("package", cleanText(booking.package_code));
  if (["small", "mid", "oversize"].includes(String(booking.vehicle_size || "").trim().toLowerCase())) url.searchParams.set("size", String(booking.vehicle_size).trim().toLowerCase());
  if (cleanText(booking.service_area)) url.searchParams.set("area", cleanText(booking.service_area));
  const addonCodes = extractAddonCodes(booking.addons);
  if (addonCodes.length) url.searchParams.set("addons", addonCodes.join(","));
  return url.toString();
}

function extractAddonCodes(addons) {
  const rows = Array.isArray(addons) ? addons : [];
  return rows.map((row) => cleanText(row?.code || row)).filter(Boolean);
}

function bookingServiceIso(row) {
  const explicit = parseDate(row?.completed_at) || parseDate(row?.detailing_completed_at);
  if (explicit) return explicit.toISOString();
  const serviceDate = cleanText(row?.service_date);
  if (/^\d{4}-\d{2}-\d{2}$/.test(serviceDate)) return `${serviceDate}T13:00:00.000Z`;
  return null;
}

function normalizeDueDateIso(value) {
  const text = cleanText(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return `${text}T13:00:00.000Z`;
  const date = parseDate(text);
  return date ? date.toISOString() : null;
}

function normalizeYear(value) {
  const year = Math.floor(Number(value || 0));
  return year >= 1900 && year <= 2200 ? year : null;
}

function normalizeVehicleSize(value) {
  const size = cleanText(value).toLowerCase();
  return ["small", "mid", "oversize"].includes(size) ? size : "";
}

function normalizeVehicleToken(value) {
  return cleanText(value).toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function normalizePlate(value) {
  const plate = cleanText(value).toUpperCase().replace(/[^A-Z0-9]+/g, "");
  return plate.length >= 2 ? plate : "";
}

function cycleLabelFromDays(days) {
  const safe = normalizeCycleDays(days);
  const weeks = Math.round(safe / 7);
  return weeks > 1 ? `Every ${weeks} weeks` : `Every ${safe} days`;
}

function formatDateLabel(value) {
  const date = parseDate(value);
  if (!date) return null;
  return date.toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" });
}

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function pickLaterIso(a, b) {
  const da = parseDate(a);
  const db = parseDate(b);
  if (da && db) return da.getTime() >= db.getTime() ? da.toISOString() : db.toISOString();
  if (da) return da.toISOString();
  if (db) return db.toISOString();
  return null;
}

function normalizeEmail(value) {
  return cleanText(value).toLowerCase();
}

function cleanText(value) {
  return String(value || "").trim();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
