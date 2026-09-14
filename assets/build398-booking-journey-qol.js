// Build 398 — Customer Journey, Booking QoL & Acquisition Quality
// Browser-only booking selection continuity. Stores no contact, address, notes, date, slot, payment, or customer identifiers.
const STORAGE_KEY = 'rd_booking_selection_v398';
const MAX_AGE_MS = 48 * 60 * 60 * 1000;
const ALLOWED_SIZES = new Set(['small','mid','oversize']);

function cleanCode(value, max = 80) {
  return String(value || '').trim().replace(/[^a-zA-Z0-9_.:-]/g, '').slice(0, max);
}

function readDraft() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const savedAt = Number(parsed?.saved_at || 0);
    if (!savedAt || Date.now() - savedAt > MAX_AGE_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    const size = ALLOWED_SIZES.has(String(parsed?.size || '')) ? String(parsed.size) : '';
    const packageCode = cleanCode(parsed?.package || '');
    const addons = Array.isArray(parsed?.addons) ? parsed.addons.map((value) => cleanCode(value)).filter(Boolean).slice(0, 30) : [];
    if (!size && !packageCode && !addons.length) return null;
    return { size, package: packageCode, addons, saved_at: savedAt };
  } catch {
    return null;
  }
}

function writeDraftFromUrl() {
  try {
    const params = new URLSearchParams(location.search);
    const size = ALLOWED_SIZES.has(String(params.get('size') || '')) ? String(params.get('size')) : '';
    const packageCode = cleanCode(params.get('package') || params.get('pkg') || '');
    const addons = String(params.get('addons') || '').split(',').map((value) => cleanCode(value)).filter(Boolean).slice(0, 30);
    if (!size && !packageCode && !addons.length) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ size, package: packageCode, addons, saved_at: Date.now() }));
  } catch {}
}

function explicitSelectionsPresent() {
  const params = new URLSearchParams(location.search);
  return ['size','package','pkg','addons'].some((key) => params.has(key));
}

function resumeDraft(draft) {
  const url = new URL(location.href);
  if (draft.size) url.searchParams.set('size', draft.size);
  if (draft.package) url.searchParams.set('package', draft.package);
  if (draft.addons.length) url.searchParams.set('addons', draft.addons.join(','));
  url.hash = url.hash || '#services';
  location.assign(url.toString());
}

function injectTouchAndLayoutGuard() {
  if (document.getElementById('build398-booking-qol-css')) return;
  const style = document.createElement('style');
  style.id = 'build398-booking-qol-css';
  style.textContent = `
    .build398-booking-qol{display:grid;gap:10px;margin-top:12px}
    .build398-booking-qol__actions{display:flex;gap:8px;flex-wrap:wrap}
    .package-card button,.addon-card,#applyToPlannerBtn,#clearAddonsBtn,#sizeChartBtn{min-height:44px}
    @media(max-width:720px){
      .build398-booking-qol__actions{display:grid;grid-template-columns:1fr}
      .build398-booking-qol__actions .btn{width:100%;min-height:48px}
      .selection-line{display:grid;grid-template-columns:minmax(0,1fr);gap:4px}
      .selection-line strong{text-align:left!important;overflow-wrap:anywhere}
      .selection-bar .btn{width:100%;min-height:48px}
    }
  `;
  document.head.appendChild(style);
}

function injectJourneyGuidance() {
  const booking = document.querySelector('#booking');
  if (!booking || document.querySelector('[data-build398-next-steps]')) return;
  const panel = document.createElement('section');
  panel.className = 'panel build398-booking-qol';
  panel.setAttribute('data-build398-next-steps', 'true');
  panel.innerHTML = `
    <strong>What happens next</strong>
    <div class="mini muted">Choose an available date and service area in the planner, confirm your vehicle and scope, review the deposit, then enter the contact details needed to finish the booking. If a date or time is no longer available, choose another displayed slot; your service selections can be kept in this browser.</div>
    <div class="mini muted"><strong>Privacy:</strong> this Build 398 convenience layer saves only vehicle size, service, and add-on codes for up to 48 hours in this browser. It does not store your name, email, phone, address, notes, appointment date, payment details, or card information.</div>
  `;
  booking.parentNode?.insertBefore(panel, booking);
}

function injectDraftPrompt(draft) {
  if (!draft || explicitSelectionsPresent()) return;
  const services = document.querySelector('#services');
  if (!services || document.querySelector('[data-build398-draft-prompt]')) return;
  const box = document.createElement('div');
  box.className = 'notice build398-booking-qol';
  box.setAttribute('data-build398-draft-prompt', 'true');
  box.innerHTML = `
    <strong>Continue where you left off?</strong>
    <div class="mini muted">A recent service-selection draft is available on this browser. Resume it, or start fresh. No contact or payment information is stored in this draft.</div>
    <div class="build398-booking-qol__actions">
      <button class="btn primary" type="button" data-build398-resume>Resume service choices</button>
      <button class="btn ghost" type="button" data-build398-clear>Start fresh</button>
    </div>
  `;
  services.insertBefore(box, services.firstChild);
  box.querySelector('[data-build398-resume]')?.addEventListener('click', () => resumeDraft(draft));
  box.querySelector('[data-build398-clear]')?.addEventListener('click', () => {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    box.remove();
  });
}

function bindSelectionPersistence() {
  const syncSoon = () => setTimeout(writeDraftFromUrl, 0);
  document.addEventListener('change', syncSoon, true);
  document.addEventListener('click', (event) => {
    if (event.target?.closest?.('[data-choose-package],[data-addon-card],#clearAddonsBtn,#vehicleSize')) syncSoon();
  }, true);
  window.addEventListener('popstate', writeDraftFromUrl);
}

export function wireBookingJourneyQol(root = document) {
  const path = String(location.pathname || '').replace(/\.html$/i, '').replace(/\/+$/, '') || '/';
  if (path !== '/book') return;
  injectTouchAndLayoutGuard();
  injectJourneyGuidance();
  const draft = readDraft();
  injectDraftPrompt(draft);
  writeDraftFromUrl();
  bindSelectionPersistence();
}
