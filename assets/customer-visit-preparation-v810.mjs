// Build 810 — private, in-memory appointment preparation guide. Nothing here
// writes booking state, sends an acknowledgment, or reserves an arrival time.
import { appointmentTimeline809, torontoToday809, validServiceDate809 } from './customer-booking-self-service-v809.mjs';

const $ = id => typeof document === 'undefined' ? null : document.getElementById(id);
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const PREPARATION_ITEMS_810 = Object.freeze([
  { id: 'space', label: 'Safe, legal work space', detail: 'Check driveway or permitted parking access, enough room to open doors, and safe space around the vehicle.' },
  { id: 'access', label: 'Building and site access', detail: 'Review condo, apartment, gate, permit and local runoff or water-use rules; arrange entry if needed.' },
  { id: 'utilities', label: 'Water and power arrangements', detail: 'Rosie brings standard detailing water and power. Check whether your site has unusual limits or safety restrictions and tell Rosie early.' },
  { id: 'vehicle', label: 'Vehicle and valuables', detail: 'Make the vehicle accessible and remove valuables and loose personal items before the team arrives.' },
  { id: 'condition', label: 'Condition and special instructions', detail: 'Make a note of pre-existing damage, delicate parts, pet hair, stains or concerns for the staff pre-inspection.' },
  { id: 'contact', label: 'Arrival contact and weather plan', detail: 'Check that Rosie can reach the correct adult contact. If weather, access or timing changes, contact Rosie directly.' }
]);

export function preparationCandidates810(bookings, requests, today = torontoToday809()) {
  if (!validServiceDate810Today(today)) return [];
  const raw = (Array.isArray(bookings) ? bookings : []).filter(row =>
    String(row?.job_status || '').toLowerCase() !== 'in_progress'
  );
  return appointmentTimeline809(raw, requests).filter(row =>
    !row.closed && validServiceDate809(String(row.service_date || ''), today)
  );
}

function validServiceDate810Today(today) {
  return typeof today === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(today) &&
    Number.isFinite(new Date(`${today}T12:00:00Z`).getTime()) &&
    new Date(`${today}T12:00:00Z`).toISOString().slice(0, 10) === today;
}

export function preparationProgress810(completedIds) {
  const set = new Set(Array.isArray(completedIds) ? completedIds : []);
  const done = PREPARATION_ITEMS_810.filter(item => set.has(item.id));
  return { done: done.length, total: PREPARATION_ITEMS_810.length,
    outstanding: PREPARATION_ITEMS_810.filter(item => !set.has(item.id)).map(item => item.label) };
}

export function preparationSummary810(appointment, completedIds, profile = {}) {
  if (!appointment?.id || !validServiceDate810Today(String(appointment.service_date || ''))) return null;
  const progress = preparationProgress810(completedIds);
  const hookups = [profile?.has_water_hookup === true ? 'water hookup marked available' : 'water hookup not marked available',
    profile?.has_power_hookup === true ? 'power hookup marked available' : 'power hookup not marked available'];
  return {
    progress,
    status: appointment.request ? 'Change request pending staff review — recorded date may change.' :
      appointment.confirmed ? 'Booking shown as confirmed on current account record.' : 'Appointment requires confirmation with Rosie.',
    hookupNote: `Account preferences: ${hookups.join('; ')}. Rosie brings standard detailing water and power; confirm any special restrictions.`,
    message: `Rosie Dazzlers personal preparation note — not sent automatically.\nRecorded service date: ${appointment.service_date}.\nPackage: ${appointment.package_code || 'Detailing'}.\n${appointment.request ? 'Pending change request: staff confirmation required.\n' : ''}Checklist reviewed: ${progress.done}/${progress.total}.\nStill to review: ${progress.outstanding.join('; ') || 'None marked outstanding'}.\nThis is a personal checklist, not a staff acknowledgment, change of booking or arrival confirmation.`
  };
}

let appointmentRows = [];
let activeProfile = {};
let accountKey = null;
let selection = '';
let currentChecks = new Map();
let wired = false;

function selectedAppointment() { return appointmentRows.find(row => row.id === selection) || null; }

function render810() {
  const dropdown = $('build810Booking');
  const status = $('build810VisitStatus');
  const guidance = $('build810VisitGuidance');
  const checklist = $('build810Checklist');
  if (!dropdown || !status || !guidance || !checklist) return;
  if (!appointmentRows.length) {
    selection = '';
    dropdown.innerHTML = '<option value="">No upcoming eligible appointment</option>';
    dropdown.disabled = true;
    status.textContent = 'No upcoming appointment with a recorded date is available for preparation. Contact Rosie about scheduling.';
    guidance.replaceChildren();
    checklist.replaceChildren();
    $('build810Copy').disabled = true;
    $('build810Reset').disabled = true;
    $('build810Progress').textContent = 'No active preparation checklist. Sign in and check your upcoming appointments.';
    $('build810CopyStatus').textContent = 'Nothing has been saved or sent.';
    $('build810CopyNote').value = '';
    $('build810CopyFallback').hidden = true;
    return;
  }
  if (!appointmentRows.some(row => row.id === selection)) selection = appointmentRows[0].id;
  dropdown.disabled = false;
  dropdown.innerHTML = appointmentRows.map(row => `<option value="${esc(row.id)}">${esc(row.service_date)} · ${esc(row.package_code || 'Detailing')}${row.request ? ' · Change under review' : ''}</option>`).join('');
  dropdown.value = selection;
  const appointment = selectedAppointment();
  const checked = currentChecks.get(selection) || new Set();
  const summary = preparationSummary810(appointment, [...checked], activeProfile);
  status.textContent = summary.status;
  guidance.innerHTML = `<p><strong>Recorded date and slot:</strong> ${esc(appointment.service_date)}${appointment.start_slot ? ` · ${esc(appointment.start_slot)}` : ' · Exact time not on file'}</p>
    <p class="muted">${esc(summary.hookupNote)}</p>
    <p class="muted">Arrival timing depends on the confirmed booking and real conditions. This is preparation guidance, not live staff tracking or a guaranteed arrival time.</p>
    <p class="muted">Before work, Rosie reviews the service area and vehicle condition. Any extra work, photo permissions or payment decisions follow their separate approval steps.</p>`;
  checklist.innerHTML = PREPARATION_ITEMS_810.map(item => `<label class="build810-check-item"><input type="checkbox" data-build810-check="${item.id}" ${checked.has(item.id) ? 'checked' : ''} /><span><strong>${esc(item.label)}</strong><small>${esc(item.detail)}</small></span></label>`).join('');
  $('build810Progress').textContent = `${summary.progress.done} of ${summary.progress.total} preparation items checked on this screen.${summary.progress.done === summary.progress.total ? ' Checklist reviewed; contact Rosie about anything unresolved.' : ''}`;
  $('build810Copy').disabled = false;
  $('build810Reset').disabled = summary.progress.done === 0;
  $('build810CopyFallback').hidden = true;
  $('build810CopyStatus').textContent = 'These checkmarks stay only on this screen and are not sent to Rosie or saved to your account.';
}

function bind810() {
  if (wired || !$('build810Booking')) return;
  wired = true;
  $('build810Booking').addEventListener('change', event => {
    selection = event.target.value;
    render810();
  });
  $('build810Checklist').addEventListener('change', event => {
    const id = event.target?.getAttribute('data-build810-check');
    if (!PREPARATION_ITEMS_810.some(item => item.id === id) || !selectedAppointment()) return;
    const checked = currentChecks.get(selection) || new Set();
    if (event.target.checked) checked.add(id); else checked.delete(id);
    currentChecks.set(selection, checked);
    // Update progress without replacing the focused checkbox.
    const progress = preparationProgress810([...checked]);
    $('build810Progress').textContent = `${progress.done} of ${progress.total} preparation items checked on this screen.${progress.done === progress.total ? ' Checklist reviewed; contact Rosie about anything unresolved.' : ''}`;
    $('build810Reset').disabled = progress.done === 0;
    $('build810CopyFallback').hidden = true;
  });
  $('build810Reset').addEventListener('click', () => { currentChecks.delete(selection); render810(); });
  $('build810Copy').addEventListener('click', async () => {
    const selected = selectedAppointment();
    const summary = preparationSummary810(selected, [...(currentChecks.get(selection) || new Set())], activeProfile);
    if (!summary) return;
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard not available');
      await navigator.clipboard.writeText(summary.message);
      $('build810CopyStatus').textContent = 'Preparation note copied. You can paste it into a message to Rosie yourself; nothing was sent automatically.';
    } catch {
      const fallback = $('build810CopyNote');
      $('build810CopyFallback').hidden = false;
      fallback.value = summary.message;
      fallback.focus();
      fallback.select();
      $('build810CopyStatus').textContent = 'Automatic copy is unavailable. Select and copy the note below, then contact Rosie if needed.';
    }
  });
  $('build809AppointmentList')?.addEventListener('click', event => {
    const link = event.target?.closest?.('[data-build810-select]');
    const id = link?.getAttribute('data-build810-select');
    if (id && appointmentRows.some(row => row.id === id)) { selection = id; render810(); }
  });
}

export function clearCustomerVisitPreparation810() {
  appointmentRows = [];
  activeProfile = {};
  accountKey = null;
  selection = '';
  currentChecks.clear();
  render810();
}

export function loadCustomerVisitPreparation810(dashboard, requests = []) {
  if (typeof document === 'undefined' || !$('build810Preparation')) return;
  const profileId = String(dashboard?.customer?.id || '');
  if (!dashboard?.ok || !dashboard?.authenticated || !UUID.test(profileId)) {
    clearCustomerVisitPreparation810();
    return;
  }
  if (profileId !== accountKey) { currentChecks.clear(); selection = ''; }
  accountKey = profileId;
  activeProfile = dashboard.customer || {};
  appointmentRows = preparationCandidates810(dashboard.bookings, requests);
  bind810();
  render810();
}
