import { serviceHeaders } from "./staff-auth.js";
import { roundMoney } from "./accounting-gl.js";

const PROFILE_KEY = "business_tax_profile";
const HOME_COST_KEYS = [
  "heat",
  "electricity",
  "water",
  "home_insurance",
  "maintenance",
  "mortgage_interest",
  "property_taxes",
  "rent",
  "other"
];

function text(value, max = 500) {
  const s = String(value ?? "").trim();
  return s ? s.slice(0, max) : null;
}

function numberOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function nonNegative(value, fallback = null) {
  const n = numberOrNull(value);
  if (n == null) return fallback;
  return Math.max(0, n);
}

function pct(value, fallback = null) {
  const n = numberOrNull(value);
  if (n == null) return fallback;
  return Math.max(0, Math.min(100, n));
}

function taxYear(value) {
  const current = new Date().getFullYear();
  const n = Number(value || current);
  return Math.max(2020, Math.min(2100, Number.isFinite(n) ? Math.trunc(n) : current));
}

function dateText(value) {
  const s = text(value, 10);
  return s && /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
}

function maskedOnly(value) {
  const s = text(value, 80);
  if (!s) return null;
  const compact = s.replace(/\s+/g, "");
  const tail = compact.replace(/[^A-Za-z0-9]/g, "").slice(-4);
  return tail ? `•••• ${tail}` : null;
}

async function rest(env, path, options = {}) {
  const headers = { ...serviceHeaders(env), ...(options.headers || {}) };
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, { ...options, headers });
  const body = await res.text();
  let parsed = null;
  if (body) {
    try { parsed = JSON.parse(body); } catch { parsed = body; }
  }
  if (!res.ok) {
    const detail = typeof parsed === "string" ? parsed : (parsed?.message || parsed?.details || JSON.stringify(parsed || {}));
    throw new Error(`Tax support storage request failed (${res.status}). ${detail}`);
  }
  return parsed;
}

async function insertRow(env, table, payload) {
  const rows = await rest(env, table, {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify([payload])
  });
  return Array.isArray(rows) ? rows[0] || null : null;
}

async function patchRow(env, table, id, payload) {
  const rows = await rest(env, `${table}?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(payload)
  });
  return Array.isArray(rows) ? rows[0] || null : null;
}

async function upsertRows(env, table, payload, conflict) {
  const rows = await rest(env, `${table}?on_conflict=${encodeURIComponent(conflict)}`, {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify([payload])
  });
  return Array.isArray(rows) ? rows[0] || null : null;
}

export async function loadBusinessTaxProfile(env) {
  const rows = await rest(env, `app_management_settings?select=key,value,updated_at&key=eq.${encodeURIComponent(PROFILE_KEY)}&limit=1`);
  const row = Array.isArray(rows) ? rows[0] : null;
  return row?.value && typeof row.value === "object" ? { ...row.value, updated_at: row.updated_at || null } : null;
}

export async function saveBusinessTaxProfile(env, input = {}, actor = {}) {
  const previous = await loadBusinessTaxProfile(env);
  if (previous) {
    const history = { ...previous };
    delete history.updated_at;
    await rest(env, "app_management_setting_history", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify([{ key: PROFILE_KEY, value: history }])
    });
  }

  const profile = {
    schema_version: 1,
    jurisdiction_country: "CA",
    jurisdiction_province: text(input.jurisdiction_province, 2)?.toUpperCase() || "ON",
    tax_workpaper: "T2125",
    entity_type: ["unconfirmed","sole_proprietor","partnership","corporation","other"].includes(String(input.entity_type || "")) ? String(input.entity_type) : "unconfirmed",
    primary_business_activity: text(input.primary_business_activity, 160) || "Mobile auto detailing",
    gst_hst_registered: typeof input.gst_hst_registered === "boolean" ? input.gst_hst_registered : null,
    business_number_masked: maskedOnly(input.business_number_masked ?? input.business_number),
    gst_hst_number_masked: maskedOnly(input.gst_hst_number_masked ?? input.gst_hst_number),
    fiscal_year_end_month: Math.max(1, Math.min(12, Number(input.fiscal_year_end_month || 12))),
    fiscal_year_end_day: Math.max(1, Math.min(31, Number(input.fiscal_year_end_day || 31))),
    accounting_method: ["accrual_review","cash_review","other"].includes(String(input.accounting_method || "")) ? String(input.accounting_method) : "accrual_review",
    identifiers_policy: "masked_only",
    notes: text(input.notes, 1200)
  };

  const rows = await rest(env, `app_management_settings?on_conflict=key`, {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify([{
      key: PROFILE_KEY,
      value: profile,
      updated_at: new Date().toISOString(),
      updated_by_staff_user_id: actor?.id || null
    }])
  });
  const saved = Array.isArray(rows) ? rows[0] : null;
  return saved?.value ? { ...saved.value, updated_at: saved.updated_at || null } : profile;
}

export function calculateHomeOfficeWorkpaper(input = {}, { fallbackNetIncome = null } = {}) {
  const method = ["area","area_and_time","reasonable_other"].includes(String(input.allocation_method || "")) ? String(input.allocation_method) : "area";
  const workspace = nonNegative(input.workspace_area_sqft);
  const home = nonNegative(input.home_area_sqft);
  const areaRatio = workspace != null && home > 0 ? Math.min(1, workspace / home) : null;
  let timeRatio = 1;
  if (!input.exclusive_business_use && method === "area_and_time") {
    const hours = Math.min(24, nonNegative(input.shared_hours_per_day, 0));
    const days = Math.min(7, nonNegative(input.shared_days_per_week, 0));
    const weeks = Math.min(53, nonNegative(input.shared_weeks_per_year, 0));
    timeRatio = Math.min(1, (hours / 24) * (days / 7) * (weeks / 52));
  }
  let allocationRatio = areaRatio;
  if (method === "area_and_time" && areaRatio != null) allocationRatio = areaRatio * timeRatio;
  if (method === "reasonable_other") allocationRatio = pct(input.allocation_pct, null) == null ? null : pct(input.allocation_pct, 0) / 100;

  const eligibleCosts = {};
  let costTotal = 0;
  const source = input.eligible_costs && typeof input.eligible_costs === "object" ? input.eligible_costs : {};
  for (const key of HOME_COST_KEYS) {
    const amount = roundMoney(nonNegative(source[key], 0));
    eligibleCosts[key] = amount;
    costTotal = roundMoney(costTotal + amount);
  }
  const prior = roundMoney(nonNegative(input.prior_carryforward_cad, 0));
  const allocatedCurrent = allocationRatio == null ? null : roundMoney(costTotal * allocationRatio);
  const available = allocatedCurrent == null ? null : roundMoney(allocatedCurrent + prior);
  const explicitLimit = nonNegative(input.net_income_limit_cad);
  const fallbackLimit = nonNegative(fallbackNetIncome);
  const limit = explicitLimit == null ? fallbackLimit : explicitLimit;
  const deduction = available == null || limit == null ? null : roundMoney(Math.min(available, limit));
  const carry = available == null || deduction == null ? null : roundMoney(Math.max(0, available - deduction));

  return {
    allocation_method: method,
    workspace_area_sqft: workspace,
    home_area_sqft: home,
    exclusive_business_use: input.exclusive_business_use === true,
    shared_hours_per_day: nonNegative(input.shared_hours_per_day),
    shared_days_per_week: nonNegative(input.shared_days_per_week),
    shared_weeks_per_year: nonNegative(input.shared_weeks_per_year),
    eligible_costs: eligibleCosts,
    prior_carryforward_cad: prior,
    net_income_limit_cad: limit == null ? null : roundMoney(limit),
    allocation_pct: allocationRatio == null ? null : Math.round(allocationRatio * 1000000) / 10000,
    eligible_cost_total_cad: costTotal,
    calculated_candidate_cad: allocatedCurrent,
    suggested_current_year_deduction_cad: deduction,
    suggested_carryforward_cad: carry,
    readiness: {
      allocation_basis_complete: allocationRatio != null,
      eligible_costs_present: costTotal > 0,
      income_limit_present: limit != null,
      review_required: true
    }
  };
}

export function calculateMileageSummary(vehicles = [], annualRows = [], logs = []) {
  const rowsByVehicle = new Map(annualRows.map((row) => [String(row.vehicle_id), row]));
  const logsByVehicle = new Map();
  for (const row of logs) {
    const key = String(row.vehicle_id || "");
    if (!logsByVehicle.has(key)) logsByVehicle.set(key, []);
    logsByVehicle.get(key).push(row);
  }

  let combinedTotal = 0;
  let combinedBusiness = 0;
  const summaries = vehicles.map((vehicle) => {
    const annual = rowsByVehicle.get(String(vehicle.id)) || null;
    const vehicleLogs = logsByVehicle.get(String(vehicle.id)) || [];
    const includedLogs = vehicleLogs.filter((row) => row.review_status !== "excluded");
    const loggedBusinessKm = Math.round(includedLogs.reduce((sum, row) => sum + Number(row.business_km || 0), 0) * 10) / 10;
    let totalKm = nonNegative(annual?.total_km);
    if (totalKm == null && annual?.opening_odometer_km != null && annual?.closing_odometer_km != null) {
      totalKm = Math.max(0, Number(annual.closing_odometer_km) - Number(annual.opening_odometer_km));
    }
    const annualBusiness = Number(annual?.business_km || 0);
    const businessKm = Math.max(0, annualBusiness > 0 ? annualBusiness : loggedBusinessKm);
    const ratio = totalKm > 0 ? Math.min(1, businessKm / totalKm) : null;
    if (totalKm > 0) combinedTotal += totalKm;
    combinedBusiness += businessKm;
    return {
      vehicle,
      annual,
      log_count: vehicleLogs.length,
      unreviewed_log_count: vehicleLogs.filter((row) => row.review_status === "unreviewed").length,
      logged_business_km: loggedBusinessKm,
      reconciled_business_km: Math.round(businessKm * 10) / 10,
      total_km: totalKm == null ? null : Math.round(totalKm * 10) / 10,
      business_use_pct: ratio == null ? null : Math.round(ratio * 10000) / 100,
      ready_for_allocation: ratio != null && businessKm <= totalKm
    };
  });

  return {
    vehicles: summaries,
    combined_total_km: Math.round(combinedTotal * 10) / 10,
    combined_business_km: Math.round(combinedBusiness * 10) / 10,
    combined_business_use_pct: combinedTotal > 0 ? Math.round(Math.min(1, combinedBusiness / combinedTotal) * 10000) / 100 : null,
    review_required: summaries.some((row) => !row.ready_for_allocation || row.unreviewed_log_count > 0)
  };
}

export function calculateCapitalAssetSummary(assets = []) {
  let claimTotal = 0;
  let unresolved = 0;
  for (const asset of assets) {
    if (asset.review_status === "disposed") continue;
    const claim = numberOrNull(asset.current_year_cca_claim_cad);
    if (claim != null) claimTotal = roundMoney(claimTotal + Math.max(0, claim));
    if (!text(asset.cca_class, 40) || claim == null) unresolved += 1;
  }
  return {
    asset_count: assets.length,
    suggested_cca_claim_cad: roundMoney(claimTotal),
    unresolved_asset_count: unresolved,
    review_required: unresolved > 0 || assets.length > 0
  };
}

export async function loadTaxSupport(env, { year }) {
  const y = taxYear(year);
  const start = `${y}-01-01`;
  const end = `${y}-12-31`;
  const [profile, vehicles, annualRows, logs, homeRows, assets, taxYearRows, documents] = await Promise.all([
    loadBusinessTaxProfile(env),
    rest(env, "accounting_business_vehicles?select=*&order=active.desc,label.asc"),
    rest(env, `accounting_vehicle_tax_years?select=*&tax_year=eq.${y}&order=created_at.asc`),
    rest(env, `accounting_mileage_logs?select=*&trip_date=gte.${start}&trip_date=lte.${end}&order=trip_date.desc,created_at.desc&limit=1000`),
    rest(env, `accounting_home_office_workpapers?select=*&tax_year=eq.${y}&limit=1`),
    rest(env, `accounting_capital_assets?select=*&acquisition_date=lte.${end}&or=(disposition_date.is.null,disposition_date.gte.${start})&order=acquisition_date.asc`),
    rest(env, `accounting_tax_year_support?select=*&tax_year=eq.${y}&limit=1`),
    rest(env, `accounting_documents?select=id,related_type,related_id,document_kind,title,document_date,file_name,storage_path,file_url,notes&related_type=in.(tax_general,tax_vehicle,tax_home_office,tax_cca,tax_inventory)&order=document_date.desc.nullslast,created_at.desc&limit=500`)
  ]);

  const vehicleList = Array.isArray(vehicles) ? vehicles : [];
  const annualList = Array.isArray(annualRows) ? annualRows : [];
  const logList = Array.isArray(logs) ? logs : [];
  const home = Array.isArray(homeRows) ? homeRows[0] || null : null;
  const capitalAssets = Array.isArray(assets) ? assets : [];
  const yearSupport = Array.isArray(taxYearRows) ? taxYearRows[0] || null : null;
  const mileage = calculateMileageSummary(vehicleList, annualList, logList);
  const homeCalculation = home ? calculateHomeOfficeWorkpaper(home) : null;
  const cca = calculateCapitalAssetSummary(capitalAssets);
  const inventoryReady = !!(yearSupport && yearSupport.opening_inventory_cad != null && yearSupport.closing_inventory_cad != null && text(yearSupport.inventory_valuation_method, 120));

  const readiness = [
    { key: "tax_profile", label: "Business tax profile", ready: !!(profile && profile.entity_type !== "unconfirmed"), manual_input: true },
    { key: "vehicle", label: "Vehicle business-use reconciliation", ready: vehicleList.length === 0 || !mileage.review_required, manual_input: vehicleList.length > 0 },
    { key: "home_office", label: "Business-use-of-home workpaper", ready: !home || !!(homeCalculation?.readiness?.allocation_basis_complete && homeCalculation?.readiness?.income_limit_present), manual_input: !!home },
    { key: "cca", label: "Capital asset / CCA schedule", ready: cca.unresolved_asset_count === 0, manual_input: capitalAssets.length > 0 },
    { key: "inventory", label: "Year-end inventory / COGS support", ready: inventoryReady, manual_input: true }
  ];

  return {
    year: y,
    profile,
    vehicles: vehicleList,
    vehicle_tax_years: annualList,
    mileage_logs: logList,
    mileage_summary: mileage,
    home_office: home,
    home_office_calculation: homeCalculation,
    capital_assets: capitalAssets,
    capital_asset_summary: cca,
    tax_year_support: yearSupport,
    documents: Array.isArray(documents) ? documents : [],
    readiness,
    ready_count: readiness.filter((row) => row.ready).length,
    readiness_count: readiness.length
  };
}

export async function saveTaxSupportOperation(env, body = {}, actor = {}, { fallbackNetIncome = null } = {}) {
  const operation = String(body.operation || "").trim();
  const now = new Date().toISOString();
  const actorId = actor?.id || null;

  if (operation === "save_profile") return { operation, record: await saveBusinessTaxProfile(env, body.profile || body, actor) };

  if (operation === "save_vehicle") {
    const src = body.vehicle || body;
    const payload = {
      updated_at: now,
      label: text(src.label, 120) || "Business-use vehicle",
      vehicle_year: src.vehicle_year == null ? null : Math.max(1900, Math.min(2100, Number(src.vehicle_year))),
      make: text(src.make, 80), model: text(src.model, 80),
      ownership_type: ["personal","business","leased","other"].includes(String(src.ownership_type || "")) ? String(src.ownership_type) : "personal",
      acquisition_date: dateText(src.acquisition_date), placed_in_service_date: dateText(src.placed_in_service_date),
      capital_cost_cad: nonNegative(src.capital_cost_cad), cca_class: text(src.cca_class, 40), active: src.active !== false,
      notes: text(src.notes, 1200), updated_by_staff_user_id: actorId
    };
    if (src.id) return { operation, record: await patchRow(env, "accounting_business_vehicles", src.id, payload) };
    payload.created_by_staff_user_id = actorId;
    return { operation, record: await insertRow(env, "accounting_business_vehicles", payload) };
  }

  if (operation === "save_mileage") {
    const src = body.mileage || body;
    let totalKm = nonNegative(src.total_km);
    const startKm = nonNegative(src.start_odometer_km);
    const endKm = nonNegative(src.end_odometer_km);
    if (totalKm == null && startKm != null && endKm != null) totalKm = Math.max(0, endKm - startKm);
    const businessKm = nonNegative(src.business_km, totalKm == null ? 0 : totalKm);
    if (!src.vehicle_id || !dateText(src.trip_date) || !text(src.purpose, 300) || totalKm == null) throw new Error("Vehicle, trip date, purpose and total kilometres are required.");
    if (businessKm > totalKm) throw new Error("Business kilometres cannot exceed total kilometres.");
    const payload = {
      updated_at: now, vehicle_id: src.vehicle_id, trip_date: dateText(src.trip_date), booking_id: text(src.booking_id, 40),
      purpose: text(src.purpose, 300), origin_label: text(src.origin_label, 200), destination_label: text(src.destination_label, 200),
      start_odometer_km: startKm, end_odometer_km: endKm, total_km: Math.round(totalKm * 10) / 10, business_km: Math.round(businessKm * 10) / 10,
      parking_cad: roundMoney(nonNegative(src.parking_cad, 0)), tolls_cad: roundMoney(nonNegative(src.tolls_cad, 0)),
      document_id: text(src.document_id, 40), review_status: ["unreviewed","reviewed","excluded"].includes(String(src.review_status || "")) ? String(src.review_status) : "unreviewed",
      notes: text(src.notes, 1200), updated_by_staff_user_id: actorId
    };
    if (src.id) return { operation, record: await patchRow(env, "accounting_mileage_logs", src.id, payload) };
    payload.created_by_staff_user_id = actorId;
    return { operation, record: await insertRow(env, "accounting_mileage_logs", payload) };
  }

  if (operation === "save_vehicle_year") {
    const src = body.vehicle_year || body;
    if (!src.vehicle_id) throw new Error("Vehicle is required.");
    const y = taxYear(src.tax_year);
    const opening = nonNegative(src.opening_odometer_km);
    const closing = nonNegative(src.closing_odometer_km);
    let total = nonNegative(src.total_km);
    if (total == null && opening != null && closing != null) total = Math.max(0, closing - opening);
    let business = nonNegative(src.business_km, 0);
    if ((src.business_km === null || src.business_km === undefined || src.business_km === "") && body.logged_business_km != null) business = nonNegative(body.logged_business_km, 0);
    if (total != null && business > total) throw new Error("Business kilometres cannot exceed total annual kilometres.");
    const payload = {
      vehicle_id: src.vehicle_id, tax_year: y, updated_at: now, opening_odometer_km: opening, closing_odometer_km: closing,
      total_km: total == null ? null : Math.round(total * 10) / 10, business_km: Math.round(business * 10) / 10,
      business_use_pct: total > 0 ? Math.round(Math.min(1, business / total) * 1000000) / 10000 : null,
      status: ["draft","review","ready"].includes(String(src.status || "")) ? String(src.status) : "draft",
      notes: text(src.notes, 1200), reviewed_at: src.status === "ready" ? now : null,
      reviewed_by_staff_user_id: src.status === "ready" ? actorId : null, updated_by_staff_user_id: actorId
    };
    return { operation, record: await upsertRows(env, "accounting_vehicle_tax_years", payload, "vehicle_id,tax_year") };
  }

  if (operation === "save_home_office") {
    const src = body.home_office || body;
    const y = taxYear(src.tax_year);
    const calc = calculateHomeOfficeWorkpaper(src, { fallbackNetIncome });
    const payload = {
      ...calc,
      tax_year: y,
      updated_at: now,
      claim_amount_cad: nonNegative(src.claim_amount_cad),
      review_status: ["draft","review","ready"].includes(String(src.review_status || "")) ? String(src.review_status) : "draft",
      notes: text(src.notes, 1600), reviewed_at: src.review_status === "ready" ? now : null,
      reviewed_by_staff_user_id: src.review_status === "ready" ? actorId : null, updated_by_staff_user_id: actorId
    };
    delete payload.readiness;
    return { operation, record: await upsertRows(env, "accounting_home_office_workpapers", payload, "tax_year"), calculation: calc };
  }

  if (operation === "save_capital_asset") {
    const src = body.asset || body;
    if (!text(src.asset_name, 200) || !dateText(src.acquisition_date) || nonNegative(src.capital_cost_cad) == null) throw new Error("Asset name, acquisition date and capital cost are required.");
    const payload = {
      updated_at: now, asset_name: text(src.asset_name, 200), inventory_item_id: text(src.inventory_item_id, 40),
      acquisition_date: dateText(src.acquisition_date), available_for_use_date: dateText(src.available_for_use_date), disposition_date: dateText(src.disposition_date),
      capital_cost_cad: roundMoney(nonNegative(src.capital_cost_cad, 0)), proceeds_cad: nonNegative(src.proceeds_cad), cca_class: text(src.cca_class, 40),
      prior_ucc_cad: nonNegative(src.prior_ucc_cad), business_use_pct: pct(src.business_use_pct, 100), current_year_cca_claim_cad: nonNegative(src.current_year_cca_claim_cad),
      document_id: text(src.document_id, 40), review_status: ["draft","review","ready","disposed"].includes(String(src.review_status || "")) ? String(src.review_status) : "draft",
      notes: text(src.notes, 1600), updated_by_staff_user_id: actorId
    };
    if (src.id) return { operation, record: await patchRow(env, "accounting_capital_assets", src.id, payload) };
    payload.created_by_staff_user_id = actorId;
    return { operation, record: await insertRow(env, "accounting_capital_assets", payload) };
  }

  if (operation === "save_tax_year") {
    const src = body.tax_year_support || body;
    const payload = {
      tax_year: taxYear(src.tax_year), updated_at: now, opening_inventory_cad: nonNegative(src.opening_inventory_cad), closing_inventory_cad: nonNegative(src.closing_inventory_cad),
      inventory_valuation_method: text(src.inventory_valuation_method, 120), direct_cost_adjustment_cad: roundMoney(numberOrNull(src.direct_cost_adjustment_cad) || 0),
      filing_status: ["collecting","review","accountant_ready","filed"].includes(String(src.filing_status || "")) ? String(src.filing_status) : "collecting",
      notes: text(src.notes, 1600), accountant_notes: text(src.accountant_notes, 2400),
      reviewed_at: ["accountant_ready","filed"].includes(String(src.filing_status || "")) ? now : null,
      reviewed_by_staff_user_id: ["accountant_ready","filed"].includes(String(src.filing_status || "")) ? actorId : null,
      updated_by_staff_user_id: actorId
    };
    return { operation, record: await upsertRows(env, "accounting_tax_year_support", payload, "tax_year") };
  }

  throw new Error("Unsupported tax-support operation.");
}
