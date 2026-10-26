// Build 660: appointment-only preparation copy. No new notifications are sent.
// Owner-managed templates are reviewed, never rewritten by this module.

export const SAFE_APPOINTMENT_SETUP_COPY =
  "Rosie brings standard detailing water and power. Please provide a safe, permitted work area and tell us about access, parking, building, local water-use or runoff restrictions before arrival.";

export const APPOINTMENT_PREPARATION_CHECKLIST = [
  "Provide a safe, legal, reasonably level work area with room to open vehicle doors and work around the vehicle.",
  "Remove valuables and loose belongings from the areas being detailed; arrange vehicle/key access.",
  "Tell us about fragile trim, leaks, damage, tint, coatings, special conditions or pets before we start.",
  "Flag unusual parking, condo/building access, weather, municipal water-use or runoff restrictions before arrival.",
  "Rosie brings standard detailing water and power; customer hose or outlet access is not required for normal detailing."
];

export const APPOINTMENT_SMS_PREVIEW =
  "Rosie Dazzlers visit: please arrange safe parking and vehicle access, remove valuables and flag building/runoff rules. We bring standard water and power.";

// Sentence-bounded classification avoids treating municipal restrictions or
// explicit statements that customers do NOT need utilities as contradictions.
export function hasAppointmentUtilityConflict(value) {
  const text = String(value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (!text) return false;
  const sentences = text.split(/(?<=[.!?])\s+|\r?\n/);
  return sentences.some((sentence) => {
    if (/\b(?:not required|not needed|do not need|don't need|no need|not expected)\b/i.test(sentence)
      && /\b(?:customer|you|hose|outlet|water|power)\b/i.test(sentence)) return false;
    return /\b(?:customer|customers|you|your)\b.{0,75}\b(?:provide|bring|supply|arrange)\b.{0,35}\b(?:water|power|hose|(?:electrical?\s+)?outlet|electricity)\b/i.test(sentence)
      || /\b(?:customer|customers|you|your)\b.{0,40}\b(?:need|needs|must|require)\b.{0,18}\b(?:water|power|hose|outlet|electricity)\b(?![- ](?:use|restrictions?|rules?))/i.test(sentence)
      || /\b(?:confirm|check|verify|require|arrange)\b.{0,40}\b(?:hose\s*\/\s*power|water\s*\/\s*power|power\s*\/\s*water|hose\s+access|outlet\s+availability)\b/i.test(sentence)
      || /\b(?:please\s+)?(?:have|make)\b.{0,28}\b(?:hose|outlet|water|power)\b.{0,20}\bavailable\b/i.test(sentence)
      || /\b(?:customer[- ]supplied|customer's)\s+(?:water|power|hose|electricity|outlet)\b/i.test(sentence)
      || /\b(?:water|power|electricity|hose|outlet)\b.{0,30}\b(?:must|needs?)\s+be\s+(?:provided|supplied|available)\b/i.test(sentence);
  });
}

export function reconcileAppointmentMessageText(value) {
  const text = String(value || "");
  if (!hasAppointmentUtilityConflict(text)) return text;
  return text.split(/(?<=[.!?])\s+|\r?\n/).map((sentence) =>
    hasAppointmentUtilityConflict(sentence) ? SAFE_APPOINTMENT_SETUP_COPY : sentence
  ).join("\n");
}

export function isAppointmentNotificationType(eventType) {
  return /^(?:order_confirmation|appointment(?:_|-)|booking_(?:confirmation|reminder|preparation)|pre_arrival)/i
    .test(String(eventType || "").trim());
}

// Called only after the existing consent and review-request dispatch gates.
// Preserves recipients, metadata, schedule and opt-out decisions. For an old
// contradictory HTML body, send the corrected plain text rather than the old
// HTML; we cannot safely rewrite arbitrary markup or embedded links.
export function guardAppointmentNotificationForDispatch(event) {
  if (!event || !isAppointmentNotificationType(event.event_type)) return event;
  const payload = event.payload && typeof event.payload === "object" ? { ...event.payload } : event.payload;
  if (payload && !Array.isArray(payload)) {
    for (const key of ["message", "body_text", "body", "sms_text", "subject"]) {
      if (typeof payload[key] === "string") payload[key] = reconcileAppointmentMessageText(payload[key]);
    }
    for (const key of ["body_html", "html"]) {
      if (typeof payload[key] === "string" && hasAppointmentUtilityConflict(payload[key])) payload[key] = null;
    }
  }
  const oldHtml = String(event.body_html || "");
  const htmlConflict = hasAppointmentUtilityConflict(oldHtml);
  const correctedText = reconcileAppointmentMessageText(event.body_text || payload?.body_text || payload?.message || "");
  return {
    ...event,
    subject: typeof event.subject === "string" ? reconcileAppointmentMessageText(event.subject) : event.subject,
    body_text: htmlConflict && !correctedText.trim() ? SAFE_APPOINTMENT_SETUP_COPY : correctedText || event.body_text,
    body_html: htmlConflict ? null : event.body_html,
    payload
  };
}

export function auditAppointmentTemplateFields(value, source = "template") {
  const findings = [];
  const check = (field, text) => {
    if (typeof text === "string" && hasAppointmentUtilityConflict(text)) {
      findings.push({ source, field, excerpt: text.slice(0, 200) });
    }
  };
  if (!value || typeof value !== "object") return findings;
  // Document templates: appointment only. Do not evaluate invoices or legal copy.
  const appointment = value.templates?.appointment_confirmation || value.appointment_confirmation || {};
  check("templates.appointment_confirmation.subject", appointment.subject);
  check("templates.appointment_confirmation.body", appointment.body);
  if (!value.templates?.appointment_confirmation) check("confirmation_intro", value.confirmation_intro);
  // Managed notification templates can be nested under email/sms channels.
  const walk = (node, path, depth = 0, appointmentContext = false) => {
    if (depth > 5 || findings.length >= 40) return;
    if (typeof node === "string") return appointmentContext && check(path, node);
    if (!node || typeof node !== "object") return;
    for (const [key, child] of Object.entries(node).slice(0, 100)) {
      const next = `${path}.${key}`;
      const context = appointmentContext || /appointment|booking|confirmation|pre.?arrival|reminder|prepar|checklist/i.test(key);
      walk(child, next, depth + 1, context);
    }
  };
  if (source.includes("notification_templates")) walk(value, "notification_templates");
  if (source.includes("membership")) check("reminder_intro", value.reminder_intro);
  return findings.slice(0, 40);
}
