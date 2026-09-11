// Build 382 — Customer Account & Retention UX Convergence.
// Presents read-only projections from existing authorities. No lifecycle state is created here.

let loadPromise = null;

export function loadCustomerRetentionView() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return Promise.resolve(null);
  if (loadPromise) return loadPromise;
  loadPromise = fetch('/api/client/retention', { method: 'GET', headers: { Accept: 'application/json' }, cache: 'no-store' })
    .then(async (response) => {
      const payload = await response.json().catch(() => null);
      if (!payload?.ok || !payload?.authenticated || !payload?.retention) return null;
      renderCustomerRetention(payload.retention);
      return payload.retention;
    })
    .catch(() => null)
    .finally(() => { loadPromise = null; });
  return loadPromise;
}

export function renderCustomerRetention(retention) {
  if (typeof document === 'undefined' || !retention) return;
  const anchor = document.querySelector('[data-build295-account-source-authority]');
  if (!anchor) return;

  let section = document.querySelector('[data-build382-customer-retention]');
  if (!section) {
    section = document.createElement('section');
    section.className = 'section';
    section.setAttribute('data-build382-customer-retention', '');
    anchor.parentNode?.insertBefore(section, anchor);
  }

  section.innerHTML = `<div class="panel"><div class="section-head"><div><div class="kicker">Build 382 · Customer account convergence</div><h2 style="margin:4px 0 6px">Quotes, care plan & next steps</h2><p class="muted" style="margin:0">These statuses come from your existing Rosie Dazzlers account records. Nothing on this screen creates an appointment, subscription, recurring charge, review eligibility decision, or new quote.</p></div><a class="btn ghost" href="/book">Book or rebook</a></div><div class="grid cards two-col-stretch" style="margin-top:14px">${renderQuotes(retention.quotes)}${renderMaintenance(retention.maintenance)}${renderCommunication(retention.communication)}${renderReview(retention.review)}</div>${renderRebooking(retention.rebooking)}</div>`;
}

function renderQuotes(quotes) {
  const items = Array.isArray(quotes?.items) ? quotes.items.slice(0, 3) : [];
  const content = items.length
    ? items.map((row) => `<div class="garage-field"><span>${esc(row.title || 'Detailing quote')}</span><strong>${esc(quoteStatus(row))}${row.terms_expires_at ? ` · ${esc(dateLabel(row.terms_expires_at))}` : ''}</strong></div>`).join('')
    : '<p class="muted">No quote/proposal records are linked to this account email.</p>';
  return `<article class="card" data-build382-quotes><div class="kicker">Quotes</div><h3>Quote & proposal status</h3>${content}<p class="muted">Quote responses and commercial terms remain governed by the existing quote/proposal authority.</p></article>`;
}

function renderMaintenance(maintenance) {
  const latest = maintenance?.latest || null;
  const state = maintenance?.interest_recorded
    ? `<p><strong>Interest recorded</strong>${latest?.preferred_cycle ? ` · ${esc(latest.preferred_cycle)}` : ''}</p><p class="muted">Current record status: ${esc(humanize(latest?.status || 'new'))}</p>`
    : '<p class="muted">No maintenance-interest request is currently linked to this account email.</p>';
  return `<article class="card" data-build382-maintenance><div class="kicker">Maintenance</div><h3>Maintenance-plan interest</h3>${state}<p class="muted">Interest is not enrollment. It does not create a fixed cadence, appointment, subscription or recurring billing.</p><p><a class="btn small ghost" href="/maintenance-plan">Review maintenance options</a></p></article>`;
}

function renderCommunication(communication) {
  const c = communication || {};
  const regular = c.notification_opt_in ? `On · ${humanize(c.notification_channel || 'email')}` : 'Off';
  return `<article class="card" data-build382-communication><div class="kicker">Communication consent</div><h3>Your current preferences</h3><div class="garage-field"><span>Regular notifications</span><strong>${esc(regular)}</strong></div><div class="garage-field"><span>Detailer chat</span><strong>${yesNo(c.detailer_chat_opt_in)}</strong></div><div class="garage-field"><span>Progress updates</span><strong>${yesNo(c.notify_on_progress_post)}</strong></div><div class="garage-field"><span>Photo/media updates</span><strong>${yesNo(c.notify_on_media_upload)}</strong></div><div class="garage-field"><span>Reply notifications</span><strong>${yesNo(c.notify_on_comment_reply)}</strong></div><p class="muted">Edit these in Contact & addresses above; this card only summarizes the saved account preferences.</p></article>`;
}

function renderReview(review) {
  const r = review || {};
  const explanation = reviewExplanation(r.status);
  return `<article class="card" data-build382-review><div class="kicker">Genuine review status</div><h3>${esc(r.label || humanize(r.status || 'Not available'))}</h3><p>${esc(explanation)}</p><p class="muted">This account view reports the existing review/request lifecycle. It does not independently decide eligibility or create a review request.</p></article>`;
}

function renderRebooking(rebooking) {
  const count = Number(rebooking?.completed_service_count || 0);
  if (!rebooking?.available) return '<div class="notice" style="margin-top:14px" data-build382-rebooking>No completed service is available for rebooking context yet. You can still start a new booking at any time.</div>';
  return `<div class="notice" style="margin-top:14px" data-build382-rebooking><strong>Ready to book again?</strong> Your account has ${count} completed service${count === 1 ? '' : 's'} for reference. Current availability, service scope and pricing are always reconfirmed in the booking flow. <a href="${esc(rebooking.booking_path || '/book')}">Open booking</a>.</div>`;
}

function quoteStatus(row) {
  return humanize(row?.acceptance_status || row?.status || 'recorded');
}

function reviewExplanation(status) {
  const key = String(status || '').trim().toLowerCase();
  const map = {
    review_exists: 'A review is already recorded for your account.',
    queued: 'A review request is queued in the existing review workflow.',
    pending: 'A review request is pending in the existing review workflow.',
    scheduled: 'A review request is scheduled in the existing review workflow.',
    ready: 'A review request is ready in the existing review workflow.',
    sent: 'A review request has delivery evidence recorded.',
    blocked: 'The existing review workflow has not cleared this request for sending.',
    completed: 'The review lifecycle is recorded as completed.',
    cancelled: 'The review request lifecycle is recorded as cancelled.',
    suppressed: 'The review request lifecycle is recorded as suppressed.',
    not_requested: 'Completed work exists, but no review request lifecycle is recorded for this account.',
    no_completed_service: 'Review requests are tied to genuine completed work; no completed service is currently available here.'
  };
  return map[key] || 'Review status is reported from the existing account records.';
}

function dateLabel(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  const match = text.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : text;
}

function yesNo(value) { return value === true ? 'On' : 'Off'; }
function humanize(value) { return String(value || '').trim().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function esc(value) { return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;'); }
