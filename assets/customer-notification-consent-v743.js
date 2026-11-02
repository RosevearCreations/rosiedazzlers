// Build 743 — customer-managed purpose/channel choices, readback and safe previews.
import { PREFERENCE_FIELDS743 } from '/assets/notification-consent-preview-v743.mjs';

const $ = (selector) => document.querySelector(selector);
const esc = (value) => String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
let currentProfile = null;
let lastFingerprint = null;
let lastRequestId = null;
let lastHistory = [];

function controls() {
  const form = $('#build743PreferenceForm');
  return Object.fromEntries(PREFERENCE_FIELDS743.map((key) => [key, form?.elements.namedItem(key)]));
}

function defaultChoices(profile) {
  return {
    service_email: profile?.notification_opt_in === true && profile?.notification_channel === 'email',
    service_sms: profile?.notification_opt_in === true && profile?.notification_channel === 'sms',
    service_phone: false,
    marketing_email: false, marketing_sms: false, marketing_phone: false
  };
}

function readChoices() {
  const inputs = controls();
  return Object.fromEntries(PREFERENCE_FIELDS743.map((key) => [key, inputs[key]?.checked === true]));
}

function setChoices(preferences) {
  const fields = controls();
  const values = preferences || defaultChoices(currentProfile);
  for (const key of PREFERENCE_FIELDS743) if (fields[key]) fields[key].checked = values[key] === true;
}

function previewStatus({ purpose, channel, selected }) {
  if (currentProfile?.notification_opt_in !== true) return 'Blocked: main notification switch is off';
  if (!selected[`${purpose}_${channel}`]) return purpose === 'marketing' ? 'Off: no marketing consent' : 'Off for this service channel';
  if (channel === 'email' && !currentProfile?.has_email) return 'Blocked: email address missing';
  if (channel !== 'email' && !currentProfile?.has_phone) return 'Blocked: phone number missing';
  if (channel !== 'phone' && currentProfile?.notification_channel !== channel) return 'Held: different preferred channel selected above';
  return channel === 'phone' ? 'Eligible for manual staff review only — no call placed' : 'Preference allows review; no message queued or sent';
}

function renderPreview() {
  const el = $('#build743CustomerPreview');
  if (!el) return;
  const selected = readChoices();
  el.innerHTML = ['email','sms','phone'].map((channel) => {
    const service = previewStatus({ purpose:'service', channel, selected });
    const marketing = previewStatus({ purpose:'marketing', channel, selected });
    const label = channel === 'sms' ? 'Text message (SMS)' : channel === 'phone' ? 'Phone handoff' : 'Email';
    return `<article class="build743-entry"><div class="badge">${esc(label)} · Preview only</div><p><strong>Service:</strong> ${esc(service)}</p><p><strong>Marketing:</strong> ${esc(marketing)}</p><p class="build743-meta">Delivery: no send attempted from this screen; no provider receipt can be inferred.</p></article>`;
  }).join('');
}

function renderHistory() {
  const el = $('#build743PreferenceHistory');
  if (!el) return;
  el.innerHTML = lastHistory.length ? lastHistory.map((snapshot) => {
    const enabled = PREFERENCE_FIELDS743.filter((key) => snapshot[key] === true).map((key) => key.replace('_', ' '));
    const date = snapshot.recorded_at ? new Date(snapshot.recorded_at).toLocaleString('en-CA') : 'Recorded time unavailable';
    return `<article class="build743-entry"><strong>${esc(date)}</strong><p>${enabled.length ? esc(enabled.join(', ')) : 'All purpose/channel options off'}</p><p class="build743-meta">Saved preference version; no message or phone call sent by this action.</p></article>`;
  }).join('') : '<p class="muted">No purpose-specific preference changes recorded yet. Your existing account notification choice still applies to service messages. Marketing stays off.</p>';
}

export async function loadCustomerCommunicationPreferences() {
  if (typeof document === 'undefined' || !$('#build743PreferenceForm')) return;
  const status = $('#build743PreferenceStatus');
  status.className = 'notice';
  status.textContent = 'Loading your current choices…';
  try {
    const response = await fetch('/api/client/notification_preferences_v743', { credentials:'include', cache:'no-store' });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.ok) throw new Error(data?.error || 'Could not load communication choices.');
    currentProfile = data.profile;
    lastHistory = Array.isArray(data.history) ? data.history : [];
    setChoices(data.current);
    renderPreview();
    renderHistory();
    status.className = 'notice';
    status.textContent = currentProfile.notification_opt_in
      ? `Main notification preference: on, ${currentProfile.notification_channel || 'no'} channel. Purpose-specific choices are shown below.`
      : 'Main notification preference: OFF. All contact channels remain blocked until you change the main account preference.';
  } catch (error) {
    status.className = 'notice bad';
    status.textContent = error?.message || 'Communication preferences are unavailable.';
    $('#build743PreferenceSave').disabled = true;
  }
}

async function saveChoices(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (form.getAttribute('aria-busy') === 'true' || !currentProfile) return;
  const choices = readChoices();
  const fingerprint = JSON.stringify(choices);
  if (fingerprint !== lastFingerprint) { lastFingerprint = fingerprint; lastRequestId = crypto.randomUUID(); }
  const body = { ...choices, client_request_id: lastRequestId };
  const notice = $('#build743SaveStatus');
  notice.className = 'notice';
  notice.textContent = 'Saving your choices without contacting anyone…';
  form.setAttribute('aria-busy','true');
  $('#build743PreferenceSave').disabled = true;
  try {
    const res = await fetch('/api/client/notification_preferences_v743', { method:'POST', credentials:'include', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(body) });
    const result = await res.json().catch(() => null);
    if (!res.ok || !result?.ok) throw new Error(result?.error || 'Preferences could not be saved.');
    notice.className = 'notice ok';
    notice.textContent = 'Your choices are saved with an audit entry. No email, text message or phone call was sent.';
    lastFingerprint = null;
    lastRequestId = null;
    await loadCustomerCommunicationPreferences();
  } catch (error) {
    notice.className = 'notice bad';
    notice.textContent = error?.message || 'Could not save preferences. Retry safely.';
  } finally {
    form.setAttribute('aria-busy','false');
    $('#build743PreferenceSave').disabled = false;
  }
}

if (typeof document !== 'undefined') {
  $('#build743PreferenceForm')?.addEventListener('change', renderPreview);
  $('#build743PreferenceForm')?.addEventListener('submit', saveChoices);
}
