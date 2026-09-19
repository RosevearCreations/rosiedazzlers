import { classifyNotificationDeliveryEvidence } from "./customer-communication-consent.js";

const DAY_MS = 24 * 60 * 60 * 1000;

export function buildRetentionRebookingLearning(input = {}) {
  const bookings = arrayOfObjects(input.bookings);
  const maintenance = arrayOfObjects(input.maintenance_interest);
  const events = arrayOfObjects(input.notification_events);
  const profiles = arrayOfObjects(input.customer_profiles);

  const bookingEvidence = buildBookingEvidence(bookings);
  const maintenanceEvidence = buildMaintenanceEvidence(maintenance);
  const communicationEvidence = buildCommunicationEvidence(events, profiles);

  const unavailable = [];
  if (!bookingEvidence.exact_profile_rows) unavailable.push("exact_profile_booking_evidence");
  if (!maintenanceEvidence.total) unavailable.push("maintenance_interest_evidence");
  if (!communicationEvidence.profile_count && !communicationEvidence.event_count) unavailable.push("communication_evidence");

  const overall = bookingEvidence.status === "ready"
    ? (unavailable.length ? "partial" : "ready")
    : (bookingEvidence.status === "partial" ? "partial" : "unavailable");

  return Object.freeze({
    build: 429,
    mode: "retention_rebooking_learning",
    evidence_status: overall,
    repeat_booking: Object.freeze(bookingEvidence),
    maintenance_interest: Object.freeze(maintenanceEvidence),
    communication: Object.freeze(communicationEvidence),
    operator_review: Object.freeze(buildOperatorReview({ bookingEvidence, maintenanceEvidence, communicationEvidence })),
    unavailable_evidence: Object.freeze(unavailable),
    boundaries: Object.freeze({
      read_only_learning: true,
      exact_customer_profile_linkage_only: true,
      fuzzy_identity_merge_allowed: false,
      customer_identity_exposed: false,
      causation_claimed_from_counts: false,
      marketing_consent_inferred: false,
      outreach_eligibility_inferred_from_booking_history: false,
      automatic_customer_segmentation_allowed: false,
      automatic_outreach_allowed: false,
      automatic_booking_allowed: false,
      automatic_maintenance_enrollment_allowed: false,
      automatic_discount_allowed: false,
      provider_mutation_allowed: false,
      schema_authority: false,
      permanent_polling_allowed: false
    })
  });
}

function buildBookingEvidence(rows) {
  const exactRows = rows.filter((row) => clean(row.customer_profile_id));
  const missingIdentityRows = rows.length - exactRows.length;
  const byProfile = new Map();

  for (const row of exactRows) {
    const id = clean(row.customer_profile_id);
    if (!byProfile.has(id)) byProfile.set(id, []);
    byProfile.get(id).push(row);
  }

  const repeatCustomers = new Set();
  const elapsedDays = [];
  const transitions = new Map();
  let completedJobs = 0;
  let completedWithLaterBooking = 0;
  let incompleteTimestampPairs = 0;
  let incompletePackagePairs = 0;

  for (const [profileId, profileRows] of byProfile.entries()) {
    const ordered = [...profileRows].sort((a, b) => bookingCreatedTime(a) - bookingCreatedTime(b));
    const completed = ordered.filter(bookingIsCompleted);
    completedJobs += completed.length;

    for (const completedRow of completed) {
      const completedAt = bookingCompletionTime(completedRow);
      if (!completedAt) {
        incompleteTimestampPairs += 1;
        continue;
      }
      const later = ordered.find((candidate) => candidate !== completedRow && bookingCreatedTime(candidate) > completedAt);
      if (!later) continue;

      completedWithLaterBooking += 1;
      repeatCustomers.add(profileId);

      const laterAt = bookingCreatedTime(later);
      if (laterAt > completedAt) elapsedDays.push(Math.max(0, Math.round((laterAt - completedAt) / DAY_MS)));
      else incompleteTimestampPairs += 1;

      const fromPackage = clean(completedRow.package_code);
      const toPackage = clean(later.package_code);
      if (fromPackage && toPackage) {
        const key = `${fromPackage} → ${toPackage}`;
        transitions.set(key, (transitions.get(key) || 0) + 1);
      } else {
        incompletePackagePairs += 1;
      }
    }
  }

  const transitionRows = [...transitions.entries()]
    .map(([transition, count]) => ({ transition, count }))
    .sort((a, b) => b.count - a.count || a.transition.localeCompare(b.transition))
    .slice(0, 12);

  let status = "unavailable";
  if (exactRows.length) status = (missingIdentityRows || incompleteTimestampPairs || incompletePackagePairs) ? "partial" : "ready";

  return {
    status,
    total_booking_rows: rows.length,
    exact_profile_rows: exactRows.length,
    rows_missing_exact_profile_id: missingIdentityRows,
    profiles_with_booking_evidence: byProfile.size,
    completed_jobs: completedJobs,
    repeat_customers: repeatCustomers.size,
    completed_jobs_with_later_booking: completedWithLaterBooking,
    elapsed_days: summarizeNumbers(elapsedDays),
    package_transitions: transitionRows,
    incomplete_timestamp_pairs: incompleteTimestampPairs,
    incomplete_package_pairs: incompletePackagePairs,
    correlation_only: true,
    causal_claim: false
  };
}

function buildMaintenanceEvidence(rows) {
  const statuses = countBy(rows, (row) => normalize(row.status) || "unknown");
  const cycles = countBy(rows, (row) => clean(row.preferred_cycle) || "unspecified");
  return {
    status: rows.length ? "partial" : "unavailable",
    total: rows.length,
    status_counts: statuses,
    preferred_cycle_counts: cycles,
    vehicles_requested: rows.reduce((sum, row) => sum + finiteWhole(row.vehicle_count), 0),
    exact_profile_linkage: "unavailable_from_current_source",
    followup_eligibility_inferred: false,
    enrollment_inferred: false,
    consent_inferred: false
  };
}

function buildCommunicationEvidence(events, profiles) {
  const profileMap = new Map();
  for (const profile of profiles) {
    const id = clean(profile.id);
    if (id) profileMap.set(id, profile);
  }

  const deliveryStates = {};
  let linkedEvents = 0;
  let missingProfileEvents = 0;
  let providerDependent = 0;
  let definitiveDelivered = 0;

  for (const event of events) {
    const evidence = classifyNotificationDeliveryEvidence(event);
    deliveryStates[evidence.state] = (deliveryStates[evidence.state] || 0) + 1;
    if (evidence.provider_dependent) providerDependent += 1;
    if (evidence.definitive_delivery) definitiveDelivered += 1;

    const id = clean(event.customer_profile_id);
    if (id && profileMap.has(id)) linkedEvents += 1;
    else if (id) missingProfileEvents += 1;
  }

  let optedIn = 0;
  let optedOut = 0;
  let channelUnknown = 0;
  const channelCounts = {};
  for (const profile of profileMap.values()) {
    if (profile.notification_opt_in === true) optedIn += 1;
    else optedOut += 1;
    const channel = normalize(profile.notification_channel);
    if (channel) channelCounts[channel] = (channelCounts[channel] || 0) + 1;
    else channelUnknown += 1;
  }

  return {
    status: (profiles.length || events.length) ? (missingProfileEvents ? "partial" : "ready") : "unavailable",
    profile_count: profileMap.size,
    current_explicit_opt_in_profiles: optedIn,
    current_not_opted_in_profiles: optedOut,
    profiles_with_unknown_channel: channelUnknown,
    channel_counts: channelCounts,
    event_count: events.length,
    events_linked_to_current_profile: linkedEvents,
    events_missing_current_profile: missingProfileEvents,
    delivery_evidence_counts: deliveryStates,
    provider_dependent_events: providerDependent,
    definitive_delivered_events: definitiveDelivered,
    provider_acceptance_is_not_delivery: true,
    dispatch_time_consent_gate_remains_authoritative: true,
    followup_readiness_is_not_dispatch_authority: true
  };
}

function buildOperatorReview({ bookingEvidence, maintenanceEvidence, communicationEvidence }) {
  const items = [];
  if (bookingEvidence.repeat_customers) {
    items.push(`${bookingEvidence.repeat_customers} customer profile(s) show a completed job followed by a later booking. Treat this as observed repeat behaviour, not causation.`);
  } else {
    items.push("No exact-profile repeat-booking evidence is currently available.");
  }
  if (maintenanceEvidence.total) {
    items.push(`${maintenanceEvidence.total} maintenance-interest record(s) are available for aggregate review, but current source identity does not authorize exact-profile linkage.`);
  }
  if (communicationEvidence.provider_dependent_events) {
    items.push(`${communicationEvidence.provider_dependent_events} communication event(s) remain provider-dependent; provider acceptance is not final delivery.`);
  }
  items.push("Any customer contact still requires the existing dispatch-time explicit-consent authority.");
  return items;
}

function summarizeNumbers(values) {
  const nums = values.filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
  if (!nums.length) return { count: 0, min: null, max: null, average: null, median: null };
  const total = nums.reduce((sum, value) => sum + value, 0);
  const midpoint = Math.floor(nums.length / 2);
  const median = nums.length % 2
    ? nums[midpoint]
    : Math.round((nums[midpoint - 1] + nums[midpoint]) / 2);
  return {
    count: nums.length,
    min: nums[0],
    max: nums[nums.length - 1],
    average: Math.round((total / nums.length) * 10) / 10,
    median
  };
}

function countBy(rows, getter) {
  const out = {};
  for (const row of rows) {
    const key = String(getter(row) || "unknown");
    out[key] = (out[key] || 0) + 1;
  }
  return out;
}

function bookingIsCompleted(row) {
  return Boolean(
    row?.detailing_completed_at ||
    row?.completed_at ||
    normalize(row?.job_status) === "completed" ||
    normalize(row?.status) === "completed"
  );
}

function bookingCompletionTime(row) {
  return parseTime(row?.detailing_completed_at || row?.completed_at || row?.service_date || "");
}

function bookingCreatedTime(row) {
  return parseTime(row?.created_at || row?.service_date || row?.completed_at || row?.detailing_completed_at || "");
}

function parseTime(value) {
  const timestamp = Date.parse(String(value || ""));
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function finiteWhole(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? Math.floor(number) : 0;
}

function normalize(value) {
  return clean(value).toLowerCase();
}

function clean(value) {
  return String(value ?? "").trim();
}

function arrayOfObjects(value) {
  return Array.isArray(value) ? value.filter((row) => row && typeof row === "object" && !Array.isArray(row)) : [];
}
