// Build 743 — role-gated readback. This module contains no provider dispatch path.
const $ = (selector) => document.querySelector(selector);
const esc = (value) => String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const human = (value) => String(value || '').replace(/[_-]+/g,' ').replace(/\b\w/g,(c)=>c.toUpperCase());
const when = (value) => value ? new Date(value).toLocaleString('en-CA') : 'Time unavailable';
let preview = null;
let latestId = null;
let latestFingerprint = null;
let initialized = false;

function currentCustomer() { return $('#build743AdminCustomer')?.value || ''; }

function render() {
  if (!preview) return;
  const customerId = currentCustomer();
  const customer = preview.customers.find((row) => row.id === customerId) || null;
  const cards = $('#build743AdminConsentCards');
  const notifications = $('#build743AdminNotifications');
  const handoffs = $('#build743AdminHandoffs');
  $('#build743HandoffSave').disabled = !customer;
  if (!customer) {
    cards.innerHTML = '<p class="muted">Choose a customer to review six purpose/channel decisions.</p>';
    notifications.innerHTML = '<p class="muted">No customer selected.</p>';
    handoffs.innerHTML = '<p class="muted">No customer selected.</p>';
    return;
  }
  cards.innerHTML = ['service','marketing'].map((purpose) =>
    `<section class="build743-group"><h3>${esc(human(purpose))} consent</h3>${['email','sms','phone'].map((channel) => {
      const state = customer.channels?.[`${purpose}_${channel}`] || {};
      return `<article class="build743-entry"><strong>${esc(channel.toUpperCase())}</strong> · ${state.allowed ? 'Allowed for review' : 'Held'}<p>${esc(human(state.reason || 'No fresh consent'))}</p><p class="build743-meta">${esc(state.next_action || 'Staff review required.')}</p></article>`;
    }).join('')}</section>`
  ).join('');
  const rows = preview.notifications.filter((row) => row.customer_profile_id === customerId);
  notifications.innerHTML = rows.length ? rows.map((row) =>
    `<article class="build743-entry"><div class="badge">${esc(row.channel.toUpperCase())} · ${esc(human(row.purpose))}</div><h4>${esc(human(row.event_type || 'Notification event'))}</h4><p>Source: ${esc(row.source_status || 'queued')} · ${esc(when(row.created_at))}</p><p><strong>${esc(row.delivery?.label || 'Outcome unknown')}</strong></p><p>Consent: ${row.consent_allowed ? 'current preference permits review' : `HOLD — ${esc(human(row.consent_reason))}`}</p><p class="build743-meta">${esc(row.next_action || '')}</p><p class="build743-meta">Summary preview only; queued body and provider payload are not shown.</p></article>`
  ).join('') : '<p class="muted">No email/SMS notification events are linked to this exact customer profile. No delivery should be inferred.</p>';
  const notes = preview.staff_handoffs.filter((row) => row.customer_profile_id === customerId);
  handoffs.innerHTML = notes.length ? notes.map((row) =>
    `<article class="build743-entry"><strong>${esc(row.channel.toUpperCase())} · ${esc(human(row.outcome))}</strong><p>${esc(when(row.recorded_at))} · ${esc(row.staff_actor_name || 'Staff')}</p><p class="build743-meta">Staff-reported only; not a provider-delivered receipt.</p></article>`
  ).join('') : '<p class="muted">No manual channel outcome recorded yet. Staff reports must not be mistaken for verified delivery.</p>';
  updateEventOptions();
}

function updateEventOptions() {
  if (!preview) return;
  const id = currentCustomer();
  const channel = $('#build743HandoffChannel').value;
  const purpose = $('#build743HandoffPurpose').value;
  const select = $('#build743HandoffEvent');
  const rows = preview.notifications.filter((row) => row.customer_profile_id === id && row.channel === channel && row.purpose === purpose);
  select.innerHTML = channel === 'phone'
    ? '<option value="">Manual phone handoff — no provider event</option>'
    : '<option value="">Choose an exact notification event</option>' + rows.map((row) =>
      `<option value="${esc(row.id)}">${esc(human(row.event_type))} · ${esc(when(row.created_at))}</option>`
    ).join('');
  select.disabled = channel === 'phone';
  $('#build743HandoffSave').disabled = !id || (channel !== 'phone' && !rows.length);
}

async function reload({ preserveCustomer = true } = {}) {
  const prior = preserveCustomer ? currentCustomer() : '';
  const status = $('#build743AdminStatus');
  status.textContent = 'Checking current preference, notification and handoff sources…';
  try {
    const exact = $('#build743ExactCustomer').value.trim();
    const url = exact ? `/api/admin/notification_preview_v743?customer_profile_id=${encodeURIComponent(exact)}` : '/api/admin/notification_preview_v743';
    const res = await fetch(url, { credentials:'include', cache:'no-store' });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok) throw new Error(data?.error || 'Could not load staff notification previews.');
    preview = data;
    const select = $('#build743AdminCustomer');
    select.innerHTML = '<option value="">Choose a customer with notification history</option>' + (data.customers || []).map((row) =>
      `<option value="${esc(row.id)}">${esc(row.label)} · ${esc(row.preferred_channel)}</option>`
    ).join('');
    if (data.customers?.some((row) => row.id === prior)) select.value = prior;
    else if (data.customers?.some((row) => row.id === exact)) select.value = exact;
    status.textContent = data.customers.length ? 'Read-only preview refreshed. No live dispatch or provider delivery claim.' : 'No exact customer-linked notification or manual outcome rows exist yet. This preview is intentionally empty.';
    render();
  } catch (error) {
    preview = null;
    status.textContent = error?.message || 'Staff notification preview unavailable.';
    status.className = 'notice bad';
    $('#build743HandoffSave').disabled = true;
  }
}

async function record(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (form.getAttribute('aria-busy') === 'true' || !preview || !currentCustomer()) return;
  const body = {
    customer_profile_id: currentCustomer(), channel: $('#build743HandoffChannel').value,
    purpose: $('#build743HandoffPurpose').value, notification_event_id: $('#build743HandoffEvent').value || null,
    outcome: $('#build743HandoffOutcome').value, note_summary: $('#build743HandoffNote').value.trim()
  };
  const fingerprint = JSON.stringify(body);
  if (fingerprint !== latestFingerprint) { latestFingerprint = fingerprint; latestId = crypto.randomUUID(); }
  body.client_request_id = latestId;
  const notice = $('#build743HandoffStatus');
  notice.className = 'notice'; notice.textContent = 'Recording a staff-reported outcome, without contacting anyone…';
  form.setAttribute('aria-busy','true'); $('#build743HandoffSave').disabled = true;
  try {
    const res = await fetch('/api/admin/notification_preview_v743', { method:'POST', credentials:'include', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify(body) });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok) throw new Error(data?.error || 'Could not record outcome.');
    notice.className = 'notice ok';
    notice.textContent = 'Staff report recorded. It is not a delivery receipt. No message, retry or call was initiated.';
    latestFingerprint = null; latestId = null;
    $('#build743HandoffNote').value = '';
    await reload();
  } catch (error) {
    notice.className = 'notice bad'; notice.textContent = error?.message || 'Could not record outcome.';
  } finally {
    form.setAttribute('aria-busy','false');
    updateEventOptions();
  }
}

export async function loadStaffNotificationPreview() {
  if (!$('#build743AdminCustomer')) return;
  if (!initialized) {
    initialized = true;
    $('#build743AdminCustomer').addEventListener('change', render);
    $('#build743HandoffChannel').addEventListener('change', updateEventOptions);
    $('#build743HandoffPurpose').addEventListener('change', updateEventOptions);
    $('#build743HandoffForm').addEventListener('submit', record);
    $('#build743LoadExactCustomer').addEventListener('click', () => { reload({ preserveCustomer:false }).catch(()=>{}); });
  }
  await reload();
}
