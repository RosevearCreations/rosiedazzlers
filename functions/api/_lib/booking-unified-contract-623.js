// Build 623 — pure, fail-closed preview contract. No booking, payment or reservation authority.
export const CONTRACT_VERSION_623 = "rosie-booking-contract.v1";
const SIZE = new Set(["small","mid","oversize"]);
const CODE = /^[a-z0-9][a-z0-9_-]{0,79}$/;
const clean = value => String(value == null ? "" : value).trim();
const money = value => {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 1000000) return null;
  const cents = Math.round(value * 100);
  return Math.abs(value * 100 - cents) < 0.000001 ? cents : null;
};
const issue = (code, message) => ({ code, message });
const find = (catalog, kind, code) => (Array.isArray(catalog?.[kind]) ? catalog[kind] : []).find(row => row?.code === code);
function addonsFromInput(value) {
  if (Array.isArray(value)) return value.map(clean);
  return clean(value) ? clean(value).split(",").map(clean) : [];
}
export function normalizeBookingSelection623(input = {}) {
  const get = key => typeof input?.get === "function" ? input.get(key) : input?.[key];
  const rawAddons = typeof input?.getAll === "function" && input.getAll("addon_code").length
    ? input.getAll("addon_code") : get("addon_codes") ?? get("addons");
  return {
    package_code: clean(get("package_code")),
    vehicle_size: clean(get("vehicle_size")).toLowerCase(),
    addon_codes: addonsFromInput(rawAddons),
    service_area: clean(get("service_area")),
    service_date: clean(get("service_date")),
    start_slot: clean(get("start_slot")).toUpperCase(),
    duration_slots: get("duration_slots") == null || clean(get("duration_slots")) === "" ? null : Number(get("duration_slots"))
  };
}
export function validateBookingSelection623(s) {
  const issues = [];
  if (!CODE.test(s.package_code)) issues.push(issue("PACKAGE_REQUIRED","Select a valid package code."));
  if (!SIZE.has(s.vehicle_size)) issues.push(issue("VEHICLE_SIZE_REQUIRED","Choose small, mid or oversize."));
  if (s.addon_codes.length > 20 || s.addon_codes.some(code => !CODE.test(code)) ||
      new Set(s.addon_codes).size !== s.addon_codes.length) {
    issues.push(issue("ADDON_CODES_INVALID","Add-on codes must be unique valid codes (up to 20)."));
  }
  if (s.service_area.length > 150) issues.push(issue("AREA_INVALID","Service area is too long."));
  const anySlot = !!(s.service_date || s.start_slot || s.duration_slots != null);
  if (anySlot) {
    const date = s.service_date;
    const validDate = /^\d{4}-\d{2}-\d{2}$/.test(date) &&
      !Number.isNaN(Date.parse(date + "T00:00:00Z")) &&
      new Date(date + "T00:00:00Z").toISOString().slice(0,10) === date;
    if (!validDate) issues.push(issue("DATE_INVALID","Choose a valid calendar date."));
    if (!["AM","PM"].includes(s.start_slot) || ![1,2].includes(s.duration_slots) ||
        (s.duration_slots === 2 && s.start_slot !== "AM")) {
      issues.push(issue("SLOT_INVALID","Choose AM or PM, or AM for a full-day slot."));
    }
  }
  return issues;
}
function calculatePrice(catalog, s) {
  const issues = [], manual = [];
  const pkg = find(catalog, "packages", s.package_code);
  if (!pkg) return { issues:[issue("PACKAGE_UNAVAILABLE","The selected package is not in the current catalog.")], manual, total_cents:null, deposit_cents:null };
  const base = money(pkg.prices_cad?.[s.vehicle_size]);
  if (base == null) issues.push(issue("PACKAGE_PRICE_MISSING","A valid package/vehicle price is not available."));
  let addonCents = 0;
  for (const code of s.addon_codes) {
    const addon = find(catalog,"addons",code);
    if (!addon) { issues.push(issue("ADDON_UNAVAILABLE",`Add-on '${code}' is not in the current catalog.`)); continue; }
    const requires = Array.isArray(addon.requires_package_codes_any) ? addon.requires_package_codes_any : [];
    if (requires.length && addon.standalone_allowed !== true && !requires.includes(pkg.code)) {
      issues.push(issue("ADDON_INCOMPATIBLE",`${addon.name || code} requires another package.`));
      continue;
    }
    const cents = money(addon.prices_cad?.[s.vehicle_size]);
    if (addon.quote_required === true || cents == null) {
      manual.push(issue("ADDON_REQUIRES_ESTIMATE",`${addon.name || code} needs staff inspection or a separate quote.`));
    } else addonCents += cents;
  }
  const defaultDeposit = ["premium_wash","basic_detail"].includes(pkg.code) ? 5000 : 10000;
  const depositCents = money(pkg.deposit_cad);
  return { issues, manual, total_cents:base == null ? null : base + addonCents,
    deposit_cents:depositCents != null && depositCents > 0 ? depositCents : defaultDeposit,
    base_cents:base, fixed_addon_cents:addonCents };
}
function resolveArea(catalog, area) {
  if (!area) return { status:"incomplete", code:"AREA_NOT_SELECTED" };
  const match = (Array.isArray(catalog?.service_areas) ? catalog.service_areas : [])
    .find(row => [row?.value,row?.label].some(v => clean(v).toLowerCase() === area.toLowerCase()));
  if (!match || match.is_active === false) return { status:"hold", code:"AREA_NOT_VERIFIED" };
  return { status:"review_required", code:"SITE_RULES_NEED_REVIEW",
    label:clean(match.label || match.value), county:clean(match.county),
    travel_tier:clean(match.travel_tier) };
}
export function buildUnifiedBookingContract623({selection = {},checkoutCatalog,publicCatalog,availability = null,authorityVerified = false} = {}) {
  const s = normalizeBookingSelection623(selection);
  const issues = validateBookingSelection623(s);
  const displayed = issues.length ? null : calculatePrice(publicCatalog,s);
  const checkout = issues.length ? null : calculatePrice(checkoutCatalog,s);
  if (displayed) issues.push(...displayed.issues);
  if (checkout) issues.push(...checkout.issues.map(i => ({...i, code:"CHECKOUT_" + i.code})));
  const parity = displayed?.total_cents != null && checkout?.total_cents != null &&
    displayed.total_cents === checkout.total_cents && displayed.deposit_cents === checkout.deposit_cents &&
    JSON.stringify(displayed.manual.map(i=>i.code)) === JSON.stringify(checkout.manual.map(i=>i.code)) &&
    displayed.issues.length === 0 && checkout.issues.length === 0;
  if (!parity) issues.push(issue("OWNER_PRICING_PARITY_HOLD","Public and checkout pricing/estimate rules are not verified as identical. Owner resolution is required."));
  if (!authorityVerified) issues.push(issue("CATALOG_AUTHORITY_UNVERIFIED","Live catalog authority has not been independently verified."));
  const area = resolveArea(checkoutCatalog,s.service_area);
  if (area.status !== "review_required") issues.push(issue(area.code,area.status === "incomplete" ? "Choose a service area." : "Selected service area requires staff verification."));
  const slotRequested = !!(s.service_date || s.start_slot || s.duration_slots != null);
  const slot = !slotRequested ? {status:"incomplete",code:"DATE_AND_SLOT_NOT_SELECTED"} :
    availability === null ? {status:"unverified",code:"AVAILABILITY_NOT_RECHECKED"} :
    availability.ok === true ? {status:"tentatively_available",code:"REALTIME_CONFIRMATION_REQUIRED"} :
    {status:"hold",code:clean(availability.code)||"AVAILABILITY_UNAVAILABLE"};
  if (slot.status !== "tentatively_available") issues.push(issue(slot.code,"Slot selection requires a fresh server check."));
  const needsQuote = !!(displayed?.manual?.length || checkout?.manual?.length);
  if (needsQuote) issues.push(issue("STAFF_ESTIMATE_REQUIRED","One or more selected services require an estimate."));
  const hasHold = issues.some(i=>!["AREA_NOT_SELECTED","DATE_AND_SLOT_NOT_SELECTED","STAFF_ESTIMATE_REQUIRED"].includes(i.code));
  return {
    schema:CONTRACT_VERSION_623, preview_only:true, booking_created:false, payment_taken:false,
    reservation_created:false, can_commit_booking:false, currency:"CAD",
    selection:s, pricing:{displayed_total_cents:displayed?.total_cents ?? null,
      checkout_total_cents:checkout?.total_cents ?? null,
      displayed_deposit_cents:displayed?.deposit_cents ?? null,
      checkout_deposit_cents:checkout?.deposit_cents ?? null,
      parity_status:parity?"matched":"owner_hold",
      amount_is_final:false, includes_taxes:false, includes_travel:false},
    eligibility:{service_area:area, seasonal_site_and_weather_approval:"not_verified",
      staff_review_required:true}, availability:slot,
    decision:hasHold?"hold":needsQuote?"quote_review_required":(area.status === "incomplete" || !slotRequested)?"incomplete":"review_ready",
    issues, authority:"Read-only selection snapshot; checkout, live inventory, site review and transactional booking retain independent server authority."
  };
}
