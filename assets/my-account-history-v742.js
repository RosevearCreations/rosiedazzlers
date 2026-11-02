// Build 742: one customer-safe, mobile-first history and change-request workbench.
// Reads authenticated snapshots. Submissions request review; they never change a booking.
const $ = (selector) => document.querySelector(selector);
const esc = (value) => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
const money = (cents) => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(Number(cents || 0) / 100);
const human = (value) => String(value || '').replaceAll('_', ' ').replaceAll('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
const dateOnly = (value) => String(value || '').slice(0, 10) || 'Date unavailable';

let accountBookings = [];
let accountDashboard = {};
let lastSubmittedKey = null;
let lastSubmissionFingerprint = null;

export function requestableBookings(bookings) {
  return (Array.isArray(bookings) ? bookings : []).filter((row) => {
    if (!row?.id || row.detailing_completed_at) return false;
    return !['completed', 'cancelled', 'canceled', 'refunded', 'no_show'].some((status) =>
      String(row.status || '').toLowerCase() === status || String(row.job_status || '').toLowerCase() === status
    );
  });
}

export function accountHistorySnapshot(dashboard, history) {
  const data = history && typeof history === 'object' ? history : {};
  return {
    booking_count: Array.isArray(dashboard?.bookings) ? dashboard.bookings.length : 0,
    quote_count: Array.isArray(data.quotes) ? data.quotes.length : 0,
    receipt_count: Array.isArray(data.payment_receipts) ? data.payment_receipts.length : 0,
    gift_count: Array.isArray(dashboard?.gift_certificates) ? dashboard.gift_certificates.length : 0,
    maintenance_count: Array.isArray(data.maintenance_interest) ? data.maintenance_interest.length : 0,
    request_count: Array.isArray(data.change_requests) ? data.change_requests.length : 0
  };
}

function renderOverview(dashboard, history) {
  const snapshot = accountHistorySnapshot(dashboard, history);
  const summaries = [
    ['Bookings', snapshot.booking_count, '#bookingHistory'],
    ['Quotes marked sent', snapshot.quote_count, '#build742Quotes'],
    ['Paid receipts', snapshot.receipt_count, '#build742Receipts'],
    ['Gift certificates', snapshot.gift_count, '#giftSummary'],
    ['Maintenance interests', snapshot.maintenance_count, '#build742Maintenance'],
    ['Change requests', snapshot.request_count, '#build742RequestHistory']
  ];
  $('#build742Overview').innerHTML = summaries.map(([label, count, target]) =>
    `<a class="build742-summary" href="${target}"><strong>${count}</strong><span>${esc(label)}</span></a>`
  ).join('');
}

function renderQuotes(rows) {
  const el = $('#build742Quotes');
  if (!el) return;
  el.innerHTML = rows.length ? rows.map((row) => {
    const state = row.accepted_at ? 'Accepted' : row.declined_at ? 'Declined' : human(row.acceptance_status || row.status || 'Sent for review');
    return `<article class="build742-entry"><span class="badge">Quote · ${esc(state)}</span><h4>${esc(row.title || 'Detailing quote')}</h4><p>Sent ${esc(dateOnly(row.sent_at || row.accepted_at))}${row.terms_expires_at ? ` · Terms through ${esc(dateOnly(row.terms_expires_at))}` : ''}</p><p class="muted">Quote terms remain subject to Rosie’s approval and applicable booking confirmation.</p></article>`;
  }).join('') : '<p class="muted">No quotes marked sent to this account are on file. Internal drafts are not displayed.</p>';
}

function renderReceipts(rows) {
  const el = $('#build742Receipts');
  if (!el) return;
  el.innerHTML = rows.length ? rows.map((row) =>
    `<article class="build742-entry"><span class="badge">Recorded as paid</span><h4>${esc(row.label || 'Payment')}</h4><p>${esc(money(row.amount_cents))} · ${esc(dateOnly(row.paid_at))}</p><p class="muted">Payment record summary. Contact Rosie for an itemized provider receipt.</p></article>`
  ).join('') : '<p class="muted">No deposit or final-balance payments recorded as paid are available in this account yet. A deposit estimate is not proof of payment.</p>';
}

function renderMaintenance(rows) {
  const el = $('#build742Maintenance');
  if (!el) return;
  el.innerHTML = rows.length ? rows.map((row) =>
    `<article class="build742-entry"><span class="badge">${esc(human(row.status || 'Recorded interest'))}</span><h4>Maintenance inquiry · ${esc(dateOnly(row.created_at))}</h4><p>Preferred cycle: ${esc(human(row.preferred_cycle || 'Not specified'))} · Vehicles: ${esc(row.vehicle_count ?? 'Not specified')}</p><p class="muted">Interest only; no subscription, recurring payment or appointment has been created.</p></article>`
  ).join('') : '<p class="muted">No maintenance-interest request is linked to your account. <a href="/maintenance-plan">Explore maintenance options</a>.</p>';
}

function renderRequests(rows) {
  const el = $('#build742RequestHistory');
  if (!el) return;
  el.innerHTML = rows.length ? rows.map((row) => {
    const state = row.status === 'pending_review' ? 'Awaiting Rosie’s review' : human(row.status || 'Under review');
    const booking = accountBookings.find((entry) => entry.id === row.booking_id);
    const label = booking ? `${dateOnly(booking.service_date)} · ${human(booking.package_code || 'Detailing')}` : 'Booking reference on file';
    return `<article class="build742-entry"><span class="badge">${esc(state)}</span><h4>${row.request_type === 'cancel' ? 'Cancellation' : 'Reschedule'} requested · ${esc(dateOnly(row.submitted_at))}</h4><p>${esc(label)}</p>${row.preferred_service_date ? `<p>Preferred new date: ${esc(dateOnly(row.preferred_service_date))}${row.preferred_start_slot ? ` · ${esc(row.preferred_start_slot)}` : ''}</p>` : ''}${row.resolution ? `<p>Rosie’s response: ${esc(row.resolution)}</p>` : ''}<p class="muted">${row.status === 'approved' ? 'Staff review recorded. Refer to your booking status for any confirmed schedule update.' : 'Submitting a request never changes the confirmed appointment, availability or payment on its own.'}</p></article>`;
  }).join('') : '<p class="muted">No cancellation or reschedule requests yet.</p>';
}

function updateRequestControls() {
  const reschedule = $('#build742RequestType').value === 'reschedule';
  const fields = $('#build742RescheduleFields');
  fields.hidden = !reschedule;
  $('#build742NewDate').required = reschedule;
  $('#build742NewDate').disabled = !reschedule;
  $('#build742NewSlot').disabled = !reschedule;
}

function renderBookingOptions() {
  const select = $('#build742Booking');
  const current = select.value;
  const eligible = requestableBookings(accountBookings);
  select.innerHTML = '<option value="">Choose your booking</option>' + eligible.map((row) =>
    `<option value="${esc(row.id)}">${esc(dateOnly(row.service_date))} · ${esc(human(row.package_code || 'Detailing'))} · ${esc(human(row.status || 'Scheduled'))}</option>`
  ).join('');
  if (eligible.some((row) => row.id === current)) select.value = current;
  select.disabled = eligible.length === 0;
  $('#build742RequestSubmit').disabled = eligible.length === 0;
  $('#build742NoBooking').hidden = eligible.length > 0;
}

async function refreshHistory(dashboard) {
  const response = await fetch('/api/client/account_history_v742', { credentials: 'include', cache: 'no-store' });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.ok) throw new Error(data?.error || 'Could not load account history.');
  renderOverview(dashboard, data.history);
  renderQuotes(data.history.quotes || []);
  renderReceipts(data.history.payment_receipts || []);
  renderMaintenance(data.history.maintenance_interest || []);
  renderRequests(data.history.change_requests || []);
  $('#build742HistoryStatus').textContent = 'History loaded from your signed-in account.';
}

export async function loadCustomerAccountHistory(dashboard) {
  if (typeof document === 'undefined' || !$('#build742History')) return;
  accountDashboard = dashboard || {};
  accountBookings = Array.isArray(dashboard?.bookings) ? dashboard.bookings : [];
  renderBookingOptions();
  $('#build742HistoryStatus').textContent = 'Loading account history…';
  try { await refreshHistory(dashboard); }
  catch (error) {
    $('#build742HistoryStatus').textContent = error?.message || 'History unavailable. Please try again.';
    $('#build742HistoryStatus').className = 'notice bad';
  }
}

async function submitChangeRequest(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (form.getAttribute('aria-busy') === 'true') return;
  const body = {
    booking_id: $('#build742Booking').value,
    request_type: $('#build742RequestType').value,
    preferred_service_date: $('#build742NewDate').value || null,
    preferred_start_slot: $('#build742NewSlot').value.trim(),
    reason: $('#build742Reason').value.trim()
  };
  const fingerprint = JSON.stringify(body);
  if (fingerprint !== lastSubmissionFingerprint) {
    lastSubmissionFingerprint = fingerprint;
    lastSubmittedKey = crypto.randomUUID();
  }
  body.client_request_id = lastSubmittedKey;
  form.setAttribute('aria-busy', 'true');
  $('#build742RequestSubmit').disabled = true;
  const status = $('#build742RequestStatus');
  status.className = 'notice';
  status.textContent = 'Saving your request for Rosie’s review…';
  try {
    const response = await fetch('/api/client/account_history_v742', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.ok) throw new Error(result?.error || 'Could not submit your request.');
    status.className = 'notice ok';
    status.textContent = 'Request received. Your booking has NOT been cancelled or rescheduled. Rosie will review it and confirm next steps.';
    form.reset();
    updateRequestControls();
    lastSubmittedKey = null;
    lastSubmissionFingerprint = null;
    await refreshHistory(accountDashboard).catch(() => { $('#build742HistoryStatus').textContent = 'Request saved; refresh your account to see the updated history.'; });
  } catch (error) {
    status.className = 'notice bad';
    status.textContent = error?.message || 'Could not submit. Please try again.';
  } finally {
    form.setAttribute('aria-busy', 'false');
    $('#build742RequestSubmit').disabled = requestableBookings(accountBookings).length === 0;
  }
}

if (typeof document !== 'undefined') {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Toronto', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const datePart = (type) => parts.find((item) => item.type === type)?.value || '';
  const dateInput = $('#build742NewDate');
  if (dateInput) dateInput.min = `${datePart('year')}-${datePart('month')}-${datePart('day')}`;
  $('#build742RequestType')?.addEventListener('change', updateRequestControls);
  $('#build742RequestForm')?.addEventListener('submit', submitChangeRequest);
  updateRequestControls();
}
