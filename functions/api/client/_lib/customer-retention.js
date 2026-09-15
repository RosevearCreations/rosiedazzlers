// Build 403 — customer account, retention and explainable rebooking guidance.
// This module is a read-only projection over existing authorities.
// It does not create quote, maintenance, communication, review, booking, pricing or payment state.

export async function loadCustomerRetention({ env, headers, email, profileId, profile, reviews, bookings } = {}) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const customerId = String(profileId || '').trim();

  const [quoteRows, maintenanceRows, reviewRequestRows] = await Promise.all([
    normalizedEmail
      ? loadRows(env, headers, `quote_proposal_drafts?select=id,title,status,acceptance_status,terms_expires_at,accepted_at,declined_at,responded_at,created_at,updated_at&customer_email=eq.${encodeURIComponent(normalizedEmail)}&order=created_at.desc&limit=25`)
      : Promise.resolve([]),
    normalizedEmail
      ? loadRows(env, headers, `membership_interest_requests?select=id,status,preferred_cycle,vehicle_count,created_at,updated_at&email=eq.${encodeURIComponent(normalizedEmail)}&order=created_at.desc&limit=10`)
      : Promise.resolve([]),
    customerId
      ? loadRows(env, headers, `review_request_queue?select=id,booking_id,status,sent_at,send_after,channel,trigger_event,created_at,updated_at&customer_id=eq.${encodeURIComponent(customerId)}&order=created_at.desc&limit=25`)
      : Promise.resolve([])
  ]);

  const safeQuotes = (Array.isArray(quoteRows) ? quoteRows : []).map(customerSafeQuote);
  const safeMaintenance = (Array.isArray(maintenanceRows) ? maintenanceRows : []).map(customerSafeMaintenanceInterest);
  const safeReviewRequests = (Array.isArray(reviewRequestRows) ? reviewRequestRows : []).map(customerSafeReviewRequest);
  const safeReviews = Array.isArray(reviews) ? reviews : [];
  const completedBookings = (Array.isArray(bookings) ? bookings : [])
    .filter((row) => bookingIsCompleted(row) && String(row?.customer_profile_id || '') === customerId)
    .sort((a, b) => bookingEvidenceTime(b) - bookingEvidenceTime(a));

  return {
    schema: 'rd.customer.retention.v2',
    quotes: {
      count: safeQuotes.length,
      latest: safeQuotes[0] || null,
      items: safeQuotes
    },
    maintenance: {
      interest_recorded: safeMaintenance.length > 0,
      latest: safeMaintenance[0] || null,
      items: safeMaintenance,
      creates_subscription: false,
      creates_automatic_enrollment: false,
      creates_appointment: false,
      creates_recurring_billing: false
    },
    communication: communicationProjection(profile),
    review: reviewProjection({ reviews: safeReviews, reviewRequests: safeReviewRequests, completedBookings }),
    rebooking: rebookingProjection(completedBookings),
    authority: {
      exact_customer_profile_id: true,
      fuzzy_identity_merge: false,
      inferred_outreach_consent: false,
      inferred_review_eligibility: false,
      inferred_vehicle_history: false,
      persistent_customer_scoring: false,
      automatic_booking_write: false,
      automatic_customer_outreach: false,
      automatic_service_substitution: false
    }
  };
}

async function loadRows(env, headers, path) {
  try {
    if (!env?.SUPABASE_URL || !headers) return [];
    const response = await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, { headers });
    if (!response.ok) return [];
    const rows = await response.json().catch(() => []);
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

function customerSafeQuote(row) {
  return pick(row, ['id','title','status','acceptance_status','terms_expires_at','accepted_at','declined_at','responded_at','created_at','updated_at']);
}

function customerSafeMaintenanceInterest(row) {
  return pick(row, ['id','status','preferred_cycle','vehicle_count','created_at','updated_at']);
}

function customerSafeReviewRequest(row) {
  return pick(row, ['id','booking_id','status','sent_at','send_after','channel','trigger_event','created_at','updated_at']);
}

function communicationProjection(profile) {
  const row = profile && typeof profile === 'object' ? profile : {};
  const channel = String(row.notification_channel || 'email').trim().toLowerCase() || 'email';
  return {
    notification_opt_in: row.notification_opt_in === true,
    notification_channel: ['email','sms','none'].includes(channel) ? channel : 'email',
    detailer_chat_opt_in: row.detailer_chat_opt_in === true,
    notify_on_progress_post: row.notify_on_progress_post === true,
    notify_on_media_upload: row.notify_on_media_upload === true,
    notify_on_comment_reply: row.notify_on_comment_reply === true,
    live_updates_enabled: row.live_updates_enabled === true,
    email_verified: Boolean(row.email_verified_at)
  };
}

function reviewProjection({ reviews, reviewRequests, completedBookings }) {
  const existingReviews = Array.isArray(reviews) ? reviews : [];
  const requests = Array.isArray(reviewRequests) ? reviewRequests : [];
  if (existingReviews.length) {
    return {
      status: 'review_exists',
      label: 'Review received',
      already_reviewed: true,
      request: requests[0] || null,
      review: existingReviews[0] || null,
      source: 'customer_reviews'
    };
  }

  const request = requests[0] || null;
  if (request) {
    const status = normalizeStatus(request.status) || (request.sent_at ? 'sent' : 'queued');
    return {
      status,
      label: reviewStatusLabel(status),
      already_reviewed: false,
      request,
      review: null,
      source: 'review_request_queue'
    };
  }

  return {
    status: completedBookings.length ? 'not_requested' : 'no_completed_service',
    label: completedBookings.length ? 'No review request recorded' : 'Available after completed work',
    already_reviewed: false,
    request: null,
    review: null,
    source: completedBookings.length ? 'completed_booking_history' : 'none'
  };
}

function rebookingProjection(completedBookings) {
  const rows = Array.isArray(completedBookings) ? completedBookings : [];
  const latest = rows[0] || null;
  if (!latest) {
    return {
      available: false,
      state: 'unavailable',
      completed_service_count: 0,
      booking_path: '/book',
      explanation: 'No exact completed-service history is available for service guidance yet.'
    };
  }

  const packageCode = String(latest.package_code || '').trim();
  const vehicleSize = String(latest.vehicle_size || '').trim();
  const serviceDate = dateOnly(latest.service_date || latest.detailing_completed_at || latest.completed_at || latest.created_at);
  const exactEvidence = Boolean(packageCode && vehicleSize && serviceDate);
  if (!exactEvidence) {
    return {
      available: false,
      state: 'insufficient',
      completed_service_count: rows.length,
      booking_path: '/book',
      latest_completed_service: {
        package_code: packageCode || null,
        vehicle_size: vehicleSize || null,
        service_date: serviceDate || null
      },
      explanation: 'Completed work exists, but the exact package, vehicle-size and service-date evidence needed for a faithful rebooking starting point is incomplete.'
    };
  }

  const params = new URLSearchParams({
    rebook_package: packageCode,
    rebook_vehicle_size: vehicleSize,
    rebook_date: serviceDate
  });
  return {
    available: true,
    state: 'observed_completed_service',
    completed_service_count: rows.length,
    latest_completed_service: {
      package_code: packageCode,
      vehicle_size: vehicleSize,
      service_date: serviceDate
    },
    booking_path: `/book?${params.toString()}`,
    explanation: 'This is an advisory starting point from exact completed-service history. Current vehicle condition, current catalog, availability, scope and price are reconfirmed in the booking flow before anything is booked.'
  };
}

function reviewStatusLabel(status) {
  const labels = {
    queued: 'Review request queued',
    pending: 'Review request pending',
    scheduled: 'Review request scheduled',
    ready: 'Review request ready',
    sent: 'Review request sent',
    blocked: 'Review request not ready',
    completed: 'Review received',
    cancelled: 'Review request cancelled',
    suppressed: 'Review request suppressed'
  };
  return labels[normalizeStatus(status)] || 'Review status recorded';
}

function bookingIsCompleted(row) {
  if (!row || typeof row !== 'object') return false;
  return Boolean(
    row.detailing_completed_at ||
    row.completed_at ||
    String(row.job_status || '').trim().toLowerCase() === 'completed' ||
    String(row.status || '').trim().toLowerCase() === 'completed'
  );
}

function bookingEvidenceTime(row) {
  const value = row?.detailing_completed_at || row?.completed_at || row?.service_date || row?.created_at || '';
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function dateOnly(value) {
  const text = String(value || '').trim();
  const match = text.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : '';
}

function normalizeStatus(value) {
  return String(value || '').trim().toLowerCase();
}

function pick(row, fields) {
  const source = row && typeof row === 'object' && !Array.isArray(row) ? row : {};
  const out = {};
  for (const field of fields) if (Object.prototype.hasOwnProperty.call(source, field)) out[field] = source[field];
  return out;
}
