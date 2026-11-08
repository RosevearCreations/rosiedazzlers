// Build 742: one customer-safe, mobile-first history and change-request workbench.
// Reads authenticated snapshots. Submissions request review; they never change a booking.
import { appointmentTimeline809, changeRequestChoices809, changeRequestPreview809, torontoToday809 } from './customer-booking-self-service-v809.mjs';
import { clearCustomerVisitPreparation810, loadCustomerVisitPreparation810, preparationCandidates810 } from './customer-visit-preparation-v810.mjs';
import { clearCustomerWorksiteIssues811, loadCustomerWorksiteIssues811 } from './customer-worksite-issues-v811.mjs?v=build816';
const $ = (selector) => document.querySelector(selector);
const esc = (value) => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
const money = (cents) => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(Number(cents || 0) / 100);
const human = (value) => String(value || '').replaceAll('_', ' ').replaceAll('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
const dateOnly = (value) => String(value || '').slice(0, 10) || 'Date unavailable';

let accountBookings = [];
let accountRequests = [];
let accountDashboard = {};
let historyReady = false;
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
    const state = row.status === 'pending_review' ? 'Awaiting Rosie’s review' : row.status === 'approved' ? 'Review approved — check booking status' : row.status === 'declined' ? 'Request declined' : human(row.status || 'Under review');
    const booking = accountBookings.find((entry) => entry.id === row.booking_id);
    const label = booking ? `${dateOnly(booking.service_date)} · ${human(booking.package_code || 'Detailing')}` : 'Booking reference on file';
    return `<article class="build742-entry"><span class="badge">${esc(state)}</span><h4>${row.request_type === 'cancel' ? 'Cancellation' : 'Reschedule'} requested · ${esc(dateOnly(row.submitted_at))}</h4><p>${esc(label)}</p>${row.preferred_service_date ? `<p>Preferred new date: ${esc(dateOnly(row.preferred_service_date))}${row.preferred_start_slot ? ` · ${esc(row.preferred_start_slot)}` : ''}</p>` : ''}${row.resolution ? `<p>Rosie’s response: ${esc(row.resolution)}</p>` : ''}<p class="muted">${row.status === 'approved' ? 'Staff review recorded. Refer to your booking status for any confirmed schedule update.' : 'Submitting a request never changes the confirmed appointment, availability or payment on its own.'}</p></article>`;
  }).join('') : '<p class="muted">No cancellation or reschedule requests yet.</p>';
}

function renderAppointments809() {
  const status = $('#build809AppointmentStatus');
  const list = $('#build809AppointmentList');
  if (!status || !list) return;
  if (!historyReady) {
    status.textContent = 'Sign in and load your booking history to see appointment status.';
    list.replaceChildren();
    return;
  }
  const appointments = appointmentTimeline809(accountBookings, accountRequests);
  const preparable = new Set(preparationCandidates810(accountBookings, accountRequests).map(row => row.id));
  status.textContent = appointments.length ? `${appointments.length} appointment${appointments.length === 1 ? '' : 's'} found in your account. Changes remain subject to Rosie’s review.` : 'No appointments linked to this account yet.';
  list.innerHTML = appointments.map((item) => {
    const pending = item.request;
    const statusLabel = pending ? `Change requested — awaiting Rosie’s review` : item.label;
    const date = dateOnly(item.service_date);
    return `<article class="build809-appointment-card" data-appointment-state="${item.closed ? 'closed' : pending ? 'pending-review' : 'open'}">
      <span class="badge">${esc(statusLabel)}</span>
      <h4>${esc(human(item.package_code || 'Detailing'))}</h4>
      <p><strong>Recorded date:</strong> ${esc(date)}${item.start_slot ? ` · ${esc(item.start_slot)}` : ''}</p>
      <p class="muted">${pending ? 'A request is awaiting staff review. Your original booking remains unchanged until an update is confirmed.' : item.closed ? 'This appointment is closed. Contact Rosie if you need help.' : item.confirmed ? 'Confirmed on the current booking record; check your details before arrival.' : 'Check directly with Rosie before treating this as confirmed.'}</p>
      ${pending ? '<a href="#build742RequestHistory">View request status</a>' : item.can_request ? '<a href="#build742RequestForm">Request a change</a>' : '<a href="/contact">Contact Rosie</a>'}
      ${preparable.has(item.id) ? `<a href="#build810Preparation" data-build810-select="${esc(item.id)}">Prepare for this visit</a>` : ''}
    </article>`;
  }).join('');
}

function previewRequest809() {
  const preview = $('#build809RequestPreview');
  const submit = $('#build742RequestSubmit');
  if (!preview || !submit) return { ok: false };
  const decision = historyReady ? changeRequestPreview809({
    booking_id: $('#build742Booking').value,
    request_type: $('#build742RequestType').value,
    preferred_service_date: $('#build742NewDate').value,
    preferred_start_slot: $('#build742NewSlot').value.trim()
  }, accountBookings, accountRequests) : { ok: false, message: 'Your signed-in account history must load before sending a request.' };
  preview.textContent = decision.message;
  preview.dataset.state = decision.ok ? 'ready' : 'blocked';
  submit.disabled = !decision.ok || $('#build742RequestForm').getAttribute('aria-busy') === 'true';
  return decision;
}

function updateRequestControls() {
  const reschedule = $('#build742RequestType').value === 'reschedule';
  const fields = $('#build742RescheduleFields');
  fields.hidden = !reschedule;
  $('#build742NewDate').required = reschedule;
  $('#build742NewDate').disabled = !reschedule;
  $('#build742NewSlot').disabled = !reschedule;
  previewRequest809();
}

function renderBookingOptions() {
  const select = $('#build742Booking');
  const current = select.value;
  const eligible = historyReady ? changeRequestChoices809(accountBookings, accountRequests) : [];
  select.innerHTML = '<option value="">Choose your booking</option>' + eligible.map((row) =>
    `<option value="${esc(row.id)}">${esc(dateOnly(row.service_date))} · ${esc(human(row.package_code || 'Detailing'))} · ${esc(human(row.status || 'Scheduled'))}</option>`
  ).join('');
  if (eligible.some((row) => row.id === current)) select.value = current;
  select.disabled = eligible.length === 0;
  $('#build742NoBooking').hidden = eligible.length > 0;
  $('#build742NoBooking').innerHTML = eligible.length ? '' : historyReady
    ? 'No open booking is currently eligible for a new request. Rosie may already be reviewing a change; <a href="#build742RequestHistory">check request status</a> or <a href="/contact">contact us</a>.'
    : 'Bookings will be available once your signed-in history loads.';
  previewRequest809();
}

async function refreshHistory(dashboard) {
  const response = await fetch('/api/client/account_history_v742', { credentials: 'include', cache: 'no-store' });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.ok) throw new Error(data?.error || 'Could not load account history.');
  accountRequests = Array.isArray(data.history.change_requests) ? data.history.change_requests : [];
  historyReady = true;
  renderOverview(dashboard, data.history);
  renderQuotes(data.history.quotes || []);
  renderReceipts(data.history.payment_receipts || []);
  renderMaintenance(data.history.maintenance_interest || []);
  renderRequests(accountRequests);
  renderBookingOptions();
  renderAppointments809();
  loadCustomerVisitPreparation810(dashboard, accountRequests);
  await loadCustomerWorksiteIssues811(dashboard, accountRequests);
  $('#build742HistoryStatus').textContent = 'History loaded from your signed-in account.';
}

export async function loadCustomerAccountHistory(dashboard) {
  if (typeof document === 'undefined' || !$('#build742History')) return;
  accountDashboard = dashboard || {};
  accountBookings = Array.isArray(dashboard?.bookings) ? dashboard.bookings : [];
  accountRequests = [];
  historyReady = false;
  clearCustomerVisitPreparation810();
  clearCustomerWorksiteIssues811();
  renderBookingOptions();
  renderAppointments809();
  $('#build742HistoryStatus').textContent = 'Loading account history…';
  try { await refreshHistory(dashboard); }
  catch (error) {
    // Do not preserve private account details from a previous signed-in session.
    historyReady = false;
    accountBookings = [];
    accountRequests = [];
    clearCustomerVisitPreparation810();
    clearCustomerWorksiteIssues811();
    for (const id of ['build742Overview','build742Quotes','build742Receipts','build742Maintenance','build742RequestHistory']) {
      document.getElementById(id)?.replaceChildren();
    }
    renderBookingOptions();
    renderAppointments809();
    $('#build742HistoryStatus').textContent = error?.message || 'History unavailable. Please try again.';
    $('#build742HistoryStatus').className = 'notice bad';
  }
}

async function submitChangeRequest(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (form.getAttribute('aria-busy') === 'true') return;
  const decision = previewRequest809();
  if (!decision.ok) {
    $('#build742RequestStatus').className = 'notice bad';
    $('#build742RequestStatus').textContent = decision.message;
    return;
  }
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
    if (!response.ok || !result?.ok) {
      if (response.status === 409) await refreshHistory(accountDashboard).catch(() => {});
      throw new Error(result?.error || 'Could not submit your request.');
    }
    status.className = 'notice ok';
    status.textContent = 'Request received. Your booking has NOT been cancelled or rescheduled. Rosie will review it and confirm next steps.';
    form.reset();
    updateRequestControls();
    lastSubmittedKey = null;
    lastSubmissionFingerprint = null;
    await refreshHistory(accountDashboard).catch(() => { $('#build742HistoryStatus').textContent = 'Request saved; refresh your account to see the updated history.'; });
  } catch (error) {
    status.className = 'notice bad';
    status.textContent = `${error?.message || 'Could not confirm this request.'} Check request history or contact Rosie before trying again; a network error may occur after a request is saved.`;
  } finally {
    form.setAttribute('aria-busy', 'false');
    previewRequest809();
  }
}

if (typeof document !== 'undefined') {
  const dateInput = $('#build742NewDate');
  if (dateInput) dateInput.min = torontoToday809();
  $('#build742RequestType')?.addEventListener('change', updateRequestControls);
  for (const id of ['build742Booking','build742NewDate','build742NewSlot']) {
    document.getElementById(id)?.addEventListener('input', previewRequest809);
    document.getElementById(id)?.addEventListener('change', previewRequest809);
  }
  $('#build742RequestForm')?.addEventListener('submit', submitChangeRequest);
  updateRequestControls();
}
