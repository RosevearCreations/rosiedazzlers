import { roundMoney } from "./accounting-gl.js";

function clone(value) {
  return JSON.parse(JSON.stringify(value || {}));
}

function findLine(lines, code) {
  return lines.find((row) => String(row.line) === String(code)) || null;
}

function ensureLine(lines, code, category, key) {
  let row = findLine(lines, code);
  if (row) return row;
  row = {
    line: String(code),
    key,
    category,
    recorded_amount_cad: 0,
    suggested_deductible_cad: 0,
    unresolved_amount_cad: 0,
    source_accounts: [],
    review_required: true
  };
  lines.push(row);
  return row;
}

export function enrichT2125WithTaxSupport(workpaper = {}, support = {}) {
  const out = clone(workpaper);
  out.line_items = Array.isArray(out.line_items) ? out.line_items : [];
  out.review_flags = Array.isArray(out.review_flags) ? out.review_flags : [];

  const mileage = support?.mileage_summary || {};
  const vehiclePct = Number(mileage.combined_business_use_pct);
  const vehicleLine = findLine(out.line_items, "9281");
  if (vehicleLine && Number.isFinite(vehiclePct) && vehiclePct >= 0) {
    const recorded = Number(vehicleLine.recorded_amount_cad || 0);
    vehicleLine.structured_support_candidate_cad = roundMoney(recorded * Math.min(100, vehiclePct) / 100);
    vehicleLine.structured_support_basis = `Combined reconciled business use ${vehiclePct.toFixed(2)}%`;
    vehicleLine.suggested_deductible_cad = vehicleLine.structured_support_candidate_cad;
    vehicleLine.unresolved_amount_cad = 0;
    vehicleLine.review_required = true;
  }

  const homeCalc = support?.home_office_calculation || null;
  const homeCandidate = Number(homeCalc?.suggested_current_year_deduction_cad);
  if (homeCalc && Number.isFinite(homeCandidate)) {
    const line = ensureLine(out.line_items, "9945", "Business-use-of-home expenses", "business_use_home");
    line.structured_support_candidate_cad = roundMoney(homeCandidate);
    line.structured_support_basis = `Build 273 home-office allocation ${Number(homeCalc.allocation_pct || 0).toFixed(2)}%; subject to income limit/carry-forward review`;
    line.suggested_deductible_cad = roundMoney(homeCandidate);
    line.unresolved_amount_cad = 0;
    line.review_required = true;
  }

  const ccaSummary = support?.capital_asset_summary || {};
  const ccaCandidate = Number(ccaSummary.suggested_cca_claim_cad);
  if (Number.isFinite(ccaCandidate) && ccaCandidate > 0) {
    const line = ensureLine(out.line_items, "9936", "Capital cost allowance (CCA)", "cca");
    line.structured_support_candidate_cad = roundMoney(ccaCandidate);
    line.structured_support_basis = "Build 273 capital-asset schedule claim total; class/rate and availability-for-use facts remain review items";
    line.suggested_deductible_cad = roundMoney(ccaCandidate);
    line.unresolved_amount_cad = 0;
    line.review_required = true;
  }

  out.line_items.sort((a, b) => Number(a.line || 0) - Number(b.line || 0));

  const inventory = support?.tax_year_support || null;
  const profile = support?.profile || null;
  const readiness = Array.isArray(support?.readiness) ? support.readiness : [];
  const structured = {
    profile: profile ? {
      entity_type: profile.entity_type || "unconfirmed",
      jurisdiction_country: profile.jurisdiction_country || "CA",
      jurisdiction_province: profile.jurisdiction_province || "ON",
      gst_hst_registered: typeof profile.gst_hst_registered === "boolean" ? profile.gst_hst_registered : null,
      business_number_masked: profile.business_number_masked || null,
      gst_hst_number_masked: profile.gst_hst_number_masked || null,
      identifiers_policy: "masked_only"
    } : null,
    vehicle: {
      combined_business_use_pct: Number.isFinite(vehiclePct) ? vehiclePct : null,
      combined_business_km: Number(mileage.combined_business_km || 0),
      combined_total_km: Number(mileage.combined_total_km || 0),
      review_required: mileage.review_required !== false
    },
    home_office: homeCalc ? {
      allocation_pct: homeCalc.allocation_pct ?? null,
      eligible_cost_total_cad: homeCalc.eligible_cost_total_cad ?? null,
      current_year_candidate_cad: homeCalc.suggested_current_year_deduction_cad ?? null,
      carryforward_candidate_cad: homeCalc.suggested_carryforward_cad ?? null,
      review_required: true
    } : null,
    cca: {
      asset_count: Number(ccaSummary.asset_count || 0),
      claim_candidate_cad: Number(ccaSummary.suggested_cca_claim_cad || 0),
      unresolved_asset_count: Number(ccaSummary.unresolved_asset_count || 0),
      review_required: ccaSummary.review_required === true
    },
    inventory_cogs: inventory ? {
      opening_inventory_cad: inventory.opening_inventory_cad ?? null,
      closing_inventory_cad: inventory.closing_inventory_cad ?? null,
      inventory_valuation_method: inventory.inventory_valuation_method || null,
      direct_cost_adjustment_cad: Number(inventory.direct_cost_adjustment_cad || 0),
      filing_status: inventory.filing_status || "collecting"
    } : null,
    readiness
  };
  out.structured_tax_support = structured;

  if (!profile || profile.entity_type === "unconfirmed") {
    out.review_flags.push({ severity: "review", message: "Confirm the business entity/tax profile before treating the T2125 package as filing-ready." });
  }
  if (vehicleLine && !Number.isFinite(vehiclePct)) {
    out.review_flags.push({ severity: "review", t2125_line: "9281", message: "Vehicle expenses are present but annual total/business kilometres are not reconciled yet." });
  }
  if (Number(ccaSummary.unresolved_asset_count || 0) > 0) {
    out.review_flags.push({ severity: "review", t2125_line: "9936", message: `${ccaSummary.unresolved_asset_count} capital asset(s) still need a CCA class and/or current-year claim decision.` });
  }
  if (support?.home_office && !Number.isFinite(homeCandidate)) {
    out.review_flags.push({ severity: "review", t2125_line: "9945", message: "The business-use-of-home record is incomplete; finish the allocation basis and income-limit facts." });
  }

  const unresolved = roundMoney(out.line_items.reduce((sum, row) => sum + Number(row.unresolved_amount_cad || 0), 0));
  const candidate = roundMoney(out.line_items.reduce((sum, row) => sum + Number(row.suggested_deductible_cad || 0), 0));
  out.summary = {
    ...(out.summary || {}),
    known_deductible_candidate_cad: candidate,
    unresolved_expense_cad: unresolved
  };
  out.filing_status = out.review_flags.length ? "review_required" : "mapped_for_review";
  out.generated_from = `${out.generated_from || "Rosie Dazzlers accounting year-end report"} + Build 273 structured tax support`;
  return out;
}
