// Build 355: customer-facing completed-service history convergence.
// Preserve the accepted Build 296 My Account runtime and observe its existing
// authenticated dashboard reads rather than issuing a second dashboard request.

export function bookingIsCompleted(row) {
  if (!row || typeof row !== 'object') return false;
  return Boolean(
    row.detailing_completed_at ||
    row.completed_at ||
    String(row.job_status || '').trim().toLowerCase() === 'completed' ||
    String(row.status || '').trim().toLowerCase() === 'completed'
  );
}

export function buildAccountHistoryViewModel(payload) {
  const bookings = Array.isArray(payload?.bookings) ? payload.bookings : [];
  const serviceHistory = Array.isArray(payload?.service_history) ? payload.service_history : [];
  return {
    currentBookings: bookings.filter((row) => !bookingIsCompleted(row)),
    serviceHistory: serviceHistory.slice(),
    latestService: serviceHistory[0] || null
  };
}

export function vehicleLabel(entry) {
  const vehicle = entry?.vehicle && typeof entry.vehicle === 'object' ? entry.vehicle : {};
  const named = clean(vehicle.vehicle_name);
  if (named) return named;
  const described = [vehicle.model_year, vehicle.make, vehicle.model].map(clean).filter(Boolean).join(' ');
  if (described) return described;
  const size = clean(vehicle.vehicle_size);
  return size ? `${humanize(size)} vehicle` : 'Vehicle';
}

export function packageLabel(value) {
  const text = clean(value);
  return text ? humanize(text) : 'Detailing service';
}

function clean(value) {
  return String(value ?? '').trim();
}

function humanize(value) {
  return clean(value)
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function esc(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function money(cents) {
  if (cents === null || cents === undefined || String(cents).trim() === '') return null;
  const number = Number(cents);
  if (!Number.isFinite(number)) return null;
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(number / 100);
}

function dateLabel(value) {
  const text = clean(value);
  if (!text) return 'Date unavailable';
  const match = text.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : text;
}

function renderCurrentBookings(rows) {
  if (!rows.length) return '<div class="notice">No current or upcoming bookings.</div>';
  return rows.map((row) => {
    const progress = row.progress_enabled && row.progress_token
      ? `<a class="btn small" href="/progress?token=${encodeURIComponent(row.progress_token)}">Open progress</a>`
      : '<span class="kicker">Progress not enabled</span>';
    const mileage = row.vehicle_mileage_km === null || row.vehicle_mileage_km === undefined || String(row.vehicle_mileage_km).trim() === ''
      ? '—'
      : `${esc(row.vehicle_mileage_km)} km`;
    const deposit = money(row.deposit_cents);
    return `<article class="card" data-build355-current-booking><div class="kicker">${esc(dateLabel(row.service_date || row.created_at))}${row.start_slot ? ` · ${esc(row.start_slot)}` : ''}</div><h3>${esc(packageLabel(row.package_code || 'Booking'))}</h3><p>Status: ${esc(row.status || row.job_status || 'scheduled')}</p><p>Vehicle size: ${esc(humanize(row.vehicle_size || 'not recorded'))} · Mileage ${mileage}${deposit ? ` · Deposit ${esc(deposit)}` : ''}</p><p>${progress}</p></article>`;
  }).join('');
}

function renderCompletedServices(rows) {
  if (!rows.length) return '<div class="notice">No completed services yet.</div>';
  return rows.map((row) => {
    const total = money(row.price_total_cents);
    const mileage = row.vehicle_mileage_km === null || row.vehicle_mileage_km === undefined || String(row.vehicle_mileage_km).trim() === ''
      ? null
      : `${esc(row.vehicle_mileage_km)} km`;
    const facts = [esc(vehicleLabel(row)), mileage, total].filter(Boolean).join(' · ');
    return `<article class="card" data-build355-completed-service><div class="kicker">Completed ${esc(dateLabel(row.completed_at || row.service_date))}</div><h3>${esc(packageLabel(row.package_code))}</h3><p>${facts || 'Completed service record'}</p><p class="muted">${row.vehicle_id ? 'Linked to your saved vehicle.' : 'Historical booking vehicle details.'}</p></article>`;
  }).join('');
}

function renderMaintenanceContext(latestService) {
  const wrap = document.querySelector('#maintenanceConversion');
  if (!wrap) return;
  if (!latestService) {
    wrap.innerHTML = `<article class="maintenance-offer" data-build355-maintenance-history><div class="badge">Maintenance interest</div><h3>Tell Rosie when repeat detailing may be useful</h3><p class="muted">Once you have completed service history, this account will show that history here as context. Maintenance timing remains a request for review, not an automatic schedule.</p><p class="muted">This does not create a due date, fixed cadence, price, discount, priority, appointment, subscription or recurring billing.</p><div class="actions"><a class="btn ghost" href="/maintenance-plan">Open maintenance interest</a></div></article>`;
    return;
  }
  wrap.innerHTML = `<article class="maintenance-offer" data-build355-maintenance-history><div class="badge">Completed-service context</div><h3>Last completed: ${esc(packageLabel(latestService.package_code))}</h3><p class="muted">${esc(dateLabel(latestService.completed_at || latestService.service_date))} · ${esc(vehicleLabel(latestService))}</p><p class="muted">This history does not create a due date, fixed cadence, price, discount, priority, appointment, subscription or recurring billing. Rosie still reviews any maintenance-interest request against current condition, scope and availability.</p><div class="actions"><a class="btn ghost" href="/maintenance-plan">Open maintenance interest</a></div></article>`;
}

export function renderDashboardHistory(payload) {
  if (typeof document === 'undefined') return;
  const wrap = document.querySelector('#bookingHistory');
  if (!wrap) return;
  const model = buildAccountHistoryViewModel(payload);
  wrap.innerHTML = `<section data-build355-booking-activity><h3 style="margin:0 0 8px">Current & upcoming bookings</h3><div class="grid">${renderCurrentBookings(model.currentBookings)}</div></section><section data-build355-service-history style="margin-top:18px"><h3 style="margin:0 0 8px">Completed service history</h3><p class="muted" style="margin-top:0">Completed services come from the same authenticated booking and canonical saved-vehicle authorities used by Rosie operations.</p><div class="grid">${renderCompletedServices(model.serviceHistory)}</div></section>`;
  renderMaintenanceContext(model.latestService);
}

function dashboardRequest(input) {
  const raw = typeof input === 'string' ? input : input?.url;
  if (!raw) return false;
  try {
    return new URL(raw, 'https://www.rosiedazzlers.ca').pathname === '/api/client/dashboard';
  } catch {
    return false;
  }
}

async function captureDashboardResponse(response, input) {
  if (!dashboardRequest(input) || !response?.clone) return;
  const payload = await response.clone().json().catch(() => null);
  if (payload?.ok) renderDashboardHistory(payload);
}

if (typeof window !== 'undefined' && typeof document !== 'undefined' && typeof window.fetch === 'function') {
  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const response = await originalFetch(input, init);
    captureDashboardResponse(response, input).catch(() => {});
    return response;
  };
  import('/assets/my-account-v296.js').catch((error) => {
    const notice = document.querySelector('#accountNotice');
    if (notice) {
      notice.className = 'notice bad';
      notice.textContent = error?.message || 'Could not load My Account.';
    }
  });
}
