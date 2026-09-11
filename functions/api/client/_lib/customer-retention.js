// Build 382 — customer account and retention UX convergence.
// This module is a read-only customer projection over existing authorities.
// It does not create quote, maintenance, communication, review, booking, or payment state.

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
  const completedBookings = (Array.isArray(bookings) ? bookings : []).filter(bookingIsCompleted);

  return {
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
    rebooking: {
      available: completedBookings.length > 0,
      completed_service_count: completedBookings.length,
      booking_path: '/book'
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

function normalizeStatus(value) {
  return String(value || '').trim().toLowerCase();
}

function pick(row, fields) {
  const source = row && typeof row === 'object' && !Array.isArray(row) ? row : {};
  const out = {};
  for (const field of fields) if (Object.prototype.hasOwnProperty.call(source, field)) out[field] = source[field];
  return out;
}
