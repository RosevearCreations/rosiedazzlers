// assets/booking-vehicle-form-ux.js
// Build 339: progressive visual enhancement for the existing booking-planner vehicle controls.
// The module never replaces, clones, or renames the live inputs because booking-planner.html
// already owns their validation, catalogue, saved-garage, analytics, and checkout listeners.

const BUILD339_STYLE_ID = 'build339-vehicle-form-ux-style';

const FIELD_CONFIG = {
  veh_year: {
    state: 'Required',
    hint: 'Choose the model year. Start typing to use the vehicle catalogue.'
  },
  veh_make: {
    state: 'Required',
    hint: 'Choose the manufacturer. The model list is refined from your year and make.'
  },
  veh_model: {
    state: 'Required',
    hint: 'Choose the exact model so Rosie Dazzlers can verify vehicle size and service fit.'
  },
  veh_color: {
    state: 'Optional',
    hint: 'Useful for identifying the vehicle when we arrive.'
  },
  veh_mileage: {
    state: 'Optional',
    hint: 'Current kilometres help maintain an accurate service history.'
  },
  vehicle_size: {
    state: 'Required',
    hint: 'Pricing is based on vehicle size. Use the suggested size when available.'
  },
  veh_category: {
    state: 'Optional',
    hint: 'Helps us account for luxury, exotic, or specialty-care requirements.'
  },
  veh_body: {
    state: 'Optional',
    hint: 'Body style helps confirm access, surface area, and service time.'
  }
};

function ensureStyles(root) {
  const doc = root.ownerDocument || root;
  if (doc.getElementById(BUILD339_STYLE_ID)) return;
  const style = doc.createElement('style');
  style.id = BUILD339_STYLE_ID;
  style.textContent = `
    .build339-vehicle-head{
      margin-top:4px;padding:16px 18px;border:1px solid rgba(77,119,255,.28);
      border-radius:18px;background:linear-gradient(135deg,rgba(77,119,255,.12),rgba(255,255,255,.035));
      align-items:center
    }
    .build339-vehicle-head > div:first-child{min-width:min(100%,480px)}
    .build339-vehicle-head h3{font-size:1.28rem;letter-spacing:-.015em}
    .build339-vehicle-head p{margin:.42rem 0 0;line-height:1.5}
    .build339-vehicle-head .build339-required-note{
      display:flex;gap:7px;align-items:flex-start;margin-top:9px;color:rgba(234,242,255,.84);
      font-size:.88rem;line-height:1.4
    }
    .build339-vehicle-head .build339-required-note::before{
      content:'✓';display:inline-grid;place-items:center;flex:0 0 20px;width:20px;height:20px;
      border-radius:999px;background:rgba(36,195,107,.14);color:#d7ffe8;font-weight:900
    }
    .build339-vehicle-head a[href='/login']{
      min-height:42px;display:inline-flex;align-items:center;justify-content:center;white-space:nowrap
    }
    #garagePickerWrap.build339-garage-card{
      margin-top:12px!important;padding:14px;border:1px solid rgba(36,195,107,.24);
      border-radius:16px;background:rgba(36,195,107,.06)
    }
    #garagePickerWrap.build339-garage-card .kicker{font-weight:800;color:rgba(248,250,252,.98)}
    #garageVehicleList.build339-garage-list{
      display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:10px;margin-top:10px!important
    }
    #garageVehicleList.build339-garage-list .vehicle-option{
      min-height:74px;padding:12px 14px;border-color:rgba(255,255,255,.13);background:rgba(255,255,255,.055)
    }
    #garageVehicleList.build339-garage-list .vehicle-option:hover{
      border-color:rgba(77,119,255,.5);background:rgba(77,119,255,.11)
    }
    #garageVehicleList.build339-garage-list .vehicle-option.active{
      border-color:rgba(77,119,255,.72);background:rgba(77,119,255,.15)
    }
    .build339-vehicle-grid{
      display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;
      gap:12px!important;margin-top:12px!important;padding:14px;border:1px solid rgba(255,255,255,.095);
      border-radius:18px;background:rgba(255,255,255,.025);align-items:stretch
    }
    .build339-vehicle-group-heading{
      grid-column:1/-1;display:flex;align-items:baseline;justify-content:space-between;gap:12px;
      padding:0 2px 2px
    }
    .build339-vehicle-group-heading strong{font-size:1rem;color:rgba(248,250,252,.98)}
    .build339-vehicle-group-heading span{font-size:.82rem;color:rgba(234,242,255,.62)}
    .build339-vehicle-field{
      display:flex;flex-direction:column;gap:7px;min-width:0;padding:12px;border:1px solid rgba(255,255,255,.09);
      border-radius:14px;background:rgba(9,17,31,.42)
    }
    .build339-vehicle-field:focus-within{
      border-color:rgba(77,119,255,.62);box-shadow:0 0 0 2px rgba(77,119,255,.13);background:rgba(77,119,255,.065)
    }
    .build339-vehicle-label{
      display:flex;align-items:center;justify-content:space-between;gap:8px;margin:0!important;
      color:rgba(248,250,252,.96);font-size:.92rem;font-weight:800
    }
    .build339-field-state{
      display:inline-flex;align-items:center;padding:3px 7px;border-radius:999px;border:1px solid rgba(255,255,255,.12);
      color:rgba(234,242,255,.68);font-size:.68rem;font-weight:800;letter-spacing:.02em;text-transform:uppercase
    }
    .build339-field-state.required{
      border-color:rgba(77,119,255,.38);background:rgba(77,119,255,.12);color:#dce6ff
    }
    .build339-vehicle-field input,
    .build339-vehicle-field select{
      width:100%!important;max-width:none!important;min-height:44px!important;margin:0!important;
      padding:10px 11px!important;border-radius:11px!important;border:1px solid rgba(255,255,255,.14)!important;
      background:rgba(7,13,24,.72)!important;color:rgba(248,250,252,.98)!important;font:inherit!important;
      box-sizing:border-box
    }
    .build339-vehicle-field select{padding-right:34px!important}
    .build339-vehicle-field input::placeholder{color:rgba(234,242,255,.46)}
    .build339-vehicle-field input:focus,
    .build339-vehicle-field select:focus{
      outline:2px solid rgba(109,150,255,.78)!important;outline-offset:1px;border-color:rgba(109,150,255,.72)!important
    }
    .build339-vehicle-field select option{background:#0d1526;color:#f8fafc}
    .build339-vehicle-hint{
      display:block;min-height:2.5em;color:rgba(234,242,255,.62);font-size:.78rem;line-height:1.35
    }
    body.is-embed .build339-vehicle-head{background:rgba(77,119,255,.085)}
    body.is-embed .build339-vehicle-grid{background:rgba(255,255,255,.018)}
    @media(max-width:900px){
      .build339-vehicle-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}
    }
    @media(max-width:640px){
      .build339-vehicle-head{padding:14px;align-items:stretch}
      .build339-vehicle-head a[href='/login']{width:100%}
      .build339-vehicle-grid{grid-template-columns:1fr!important;padding:12px}
      .build339-vehicle-group-heading{display:block}
      .build339-vehicle-group-heading span{display:block;margin-top:3px}
      .build339-vehicle-hint{min-height:0}
      #garageVehicleList.build339-garage-list{grid-template-columns:1fr}
    }
  `;
  doc.head.appendChild(style);
}

function findVehicleHead(firstGrid) {
  let cursor = firstGrid?.previousElementSibling || null;
  while (cursor) {
    if (cursor.classList?.contains('step-head') && /vehicle/i.test(cursor.textContent || '')) return cursor;
    cursor = cursor.previousElementSibling;
  }
  return null;
}

function groupMeta(grid) {
  if (grid.querySelector('#veh_year')) {
    return ['Vehicle basics', 'Year, make and model identify the exact vehicle.'];
  }
  if (grid.querySelector('#veh_color') || grid.querySelector('#veh_mileage')) {
    return ['Vehicle details', 'Helpful identification and service-history information.'];
  }
  if (grid.querySelector('#vehicle_size') || grid.querySelector('#veh_category') || grid.querySelector('#veh_body')) {
    return ['Size & body', 'These selections help match pricing, access and service time.'];
  }
  return ['Vehicle information', 'Confirm the details that apply to this booking.'];
}

function enhanceGrid(grid, doc) {
  if (!grid || grid.dataset.build339VehicleGrid === '1') return;
  grid.dataset.build339VehicleGrid = '1';
  grid.classList.add('build339-vehicle-grid');
  const [title, copy] = groupMeta(grid);
  const heading = doc.createElement('div');
  heading.className = 'build339-vehicle-group-heading';
  heading.innerHTML = `<strong>${title}</strong><span>${copy}</span>`;
  grid.prepend(heading);
}

function enhanceField(control, config, doc) {
  if (!control || control.dataset.build339VehicleField === '1') return;
  const wrap = control.parentElement;
  if (!wrap) return;
  control.dataset.build339VehicleField = '1';
  wrap.classList.add('build339-vehicle-field');

  const label = wrap.querySelector(`label[for="${control.id}"]`);
  if (label) {
    label.classList.add('build339-vehicle-label');
    if (!label.querySelector('.build339-field-state')) {
      const state = doc.createElement('span');
      state.className = `build339-field-state ${config.state === 'Required' ? 'required' : 'optional'}`;
      state.textContent = config.state;
      label.appendChild(state);
    }
  }

  const hintId = `${control.id}_build339_hint`;
  if (!wrap.querySelector(`#${hintId}`)) {
    const hint = doc.createElement('span');
    hint.id = hintId;
    hint.className = 'build339-vehicle-hint';
    hint.textContent = config.hint;
    wrap.appendChild(hint);
    const existing = String(control.getAttribute('aria-describedby') || '').trim();
    control.setAttribute('aria-describedby', [existing, hintId].filter(Boolean).join(' '));
  }
}

export function wireBookingVehicleFormUX(root = document) {
  const doc = root.ownerDocument || root;
  const first = root.querySelector('#veh_year');
  if (!first || doc.documentElement?.dataset?.build339VehicleUx === '1') return false;

  doc.documentElement.dataset.build339VehicleUx = '1';
  ensureStyles(root);

  const grids = new Set();
  Object.entries(FIELD_CONFIG).forEach(([id, config]) => {
    const control = root.querySelector(`#${id}`);
    if (!control) return;
    enhanceField(control, config, doc);
    const parent = control.parentElement?.parentElement;
    if (parent) grids.add(parent);
  });

  [...grids].forEach((grid) => enhanceGrid(grid, doc));

  const firstGrid = first.parentElement?.parentElement || null;
  const head = findVehicleHead(firstGrid);
  if (head) {
    head.classList.add('build339-vehicle-head');
    const copyWrap = head.firstElementChild;
    if (copyWrap && !copyWrap.querySelector('.build339-required-note')) {
      const note = doc.createElement('div');
      note.className = 'build339-required-note';
      note.textContent = 'Required to continue: year, make, model and vehicle size. The remaining fields help us prepare a more accurate appointment.';
      copyWrap.appendChild(note);
    }
  }

  const garageWrap = root.querySelector('#garagePickerWrap');
  const garageList = root.querySelector('#garageVehicleList');
  garageWrap?.classList.add('build339-garage-card');
  garageList?.classList.add('build339-garage-list');

  return true;
}
