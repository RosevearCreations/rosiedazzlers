const T2125_EXPENSE_LINES = [
  { code: "8320", label: "Purchases during the year", key: "purchases", patterns: [/cost[_ -]?of[_ -]?goods/, /\bcogs\b/, /inventory[_ -]?purch/, /direct[_ -]?material/] },
  { code: "8340", label: "Direct wage costs", key: "direct_wages", patterns: [/direct[_ -]?wage/] },
  { code: "8360", label: "Subcontracts", key: "subcontracts", patterns: [/subcontract/, /contract[_ -]?labou?r/] },
  { code: "8450", label: "Other costs", key: "other_costs", patterns: [/other[_ -]?cost/] },
  { code: "8521", label: "Advertising", key: "advertising", patterns: [/advertis/, /marketing/, /promotion/] },
  { code: "8523", label: "Meals and entertainment", key: "meals_entertainment", patterns: [/meal/, /entertain/] },
  { code: "8590", label: "Bad debts", key: "bad_debts", patterns: [/bad[_ -]?debt/] },
  { code: "8690", label: "Insurance", key: "insurance", patterns: [/insurance/] },
  { code: "8710", label: "Interest and bank charges", key: "interest_bank", patterns: [/interest/, /bank[_ -]?(fee|charge)/, /merchant[_ -]?bank/] },
  { code: "8760", label: "Business taxes, licences and memberships", key: "taxes_licences_memberships", patterns: [/licen[cs]e/, /membership/, /business[_ -]?tax/, /permit/] },
  { code: "8810", label: "Office expenses", key: "office_expenses", patterns: [/office[_ -]?expense/] },
  { code: "8811", label: "Office stationery and supplies", key: "office_supplies", patterns: [/office[_ -]?suppl/, /stationery/, /shop[_ -]?suppl/, /consumable/] },
  { code: "8860", label: "Professional fees (legal, accounting and other professional services)", key: "professional_fees", patterns: [/professional[_ -]?fee/, /accounting[_ -]?fee/, /legal[_ -]?fee/, /consulting/] },
  { code: "8871", label: "Management and administration fees", key: "management_admin", patterns: [/management[_ -]?fee/, /admin(istration)?[_ -]?fee/] },
  { code: "8910", label: "Rent", key: "rent", patterns: [/\brent\b/, /lease[_ -]?premise/] },
  { code: "8960", label: "Repairs and maintenance", key: "repairs_maintenance", patterns: [/repair/, /maintenance/] },
  { code: "9060", label: "Salaries, wages and benefits", key: "wages_benefits", patterns: [/salary/, /salaries/, /payroll/, /wages?/, /employee[_ -]?benefit/] },
  { code: "9180", label: "Property taxes", key: "property_taxes", patterns: [/property[_ -]?tax/] },
  { code: "9200", label: "Travel expenses", key: "travel", patterns: [/travel/, /lodging/, /hotel/] },
  { code: "9220", label: "Utilities", key: "utilities", patterns: [/utilit/, /telephone/, /internet/, /hydro/, /electric/, /natural[_ -]?gas/] },
  { code: "9224", label: "Fuel costs (except for motor vehicles)", key: "non_vehicle_fuel", patterns: [/non[_ -]?vehicle[_ -]?fuel/, /equipment[_ -]?fuel/, /generator[_ -]?fuel/] },
  { code: "9275", label: "Delivery, freight and express", key: "delivery_freight", patterns: [/delivery/, /freight/, /courier/, /shipping/, /postage/] },
  { code: "9281", label: "Motor vehicle expenses (not including CCA)", key: "motor_vehicle", patterns: [/motor[_ -]?vehicle/, /vehicle[_ -]?expense/, /auto[_ -]?expense/, /vehicle[_ -]?fuel/, /gasoline/] },
  { code: "9936", label: "Capital cost allowance (CCA)", key: "cca", patterns: [/\bcca\b/, /capital[_ -]?cost[_ -]?allowance/, /depreciation/] },
  { code: "9945", label: "Business-use-of-home expenses", key: "business_use_home", patterns: [/business[_ -]?use[_ -]?(of[_ -]?)?home/, /home[_ -]?office/] },
  { code: "9270", label: "Other expenses", key: "other", patterns: [] }
];

function money(value) {
  const n = Number(value || 0);
  return Math.round((Number.isFinite(n) ? n : 0) * 100) / 100;
}

function textFor(row) {
  return `${row?.account_code || ""} ${row?.label || ""}`.toLowerCase();
}

function classifyExpense(row) {
  const text = textFor(row);
  for (const line of T2125_EXPENSE_LINES) {
    if (line.code === "9270") continue;
    if (line.patterns.some((pattern) => pattern.test(text))) return line;
  }
  return T2125_EXPENSE_LINES.find((line) => line.code === "9270");
}

function ruleFor(line) {
  if (line.code === "8523") {
    return {
      adjustment: "review_50_percent_limit",
      deductible_rate: 0.5,
      review_required: true,
      reason: "Meals and entertainment are commonly subject to a 50% limitation, but CRA exceptions exist and must be reviewed."
    };
  }
  if (line.code === "9281") {
    return {
      adjustment: "business_km_allocation_required",
      deductible_rate: null,
      review_required: true,
      reason: "Motor vehicle expenses require business-use support, normally including business and total kilometres."
    };
  }
  if (line.code === "9936") {
    return {
      adjustment: "cca_schedule_required",
      deductible_rate: null,
      review_required: true,
      reason: "CCA should be supported by the applicable asset/class schedule rather than treated as an ordinary current expense."
    };
  }
  if (line.code === "9945") {
    return {
      adjustment: "home_office_calculation_required",
      deductible_rate: null,
      review_required: true,
      reason: "Business-use-of-home expenses require a workspace allocation and are subject to the T2125 income limitation/carry-forward rules."
    };
  }
  if (line.code === "8320" || line.code === "8340" || line.code === "8360" || line.code === "8450") {
    return {
      adjustment: "cost_of_goods_sold_review",
      deductible_rate: null,
      review_required: true,
      reason: "Cost-of-goods-sold treatment depends on inventory/direct-cost facts and the T2125 Part 3 calculation."
    };
  }
  if (line.code === "9270") {
    return {
      adjustment: "category_review_required",
      deductible_rate: null,
      review_required: true,
      reason: "No specific T2125 category was inferred. Review the source account before using Other expenses."
    };
  }
  return {
    adjustment: "none_inferred",
    deductible_rate: 1,
    review_required: false,
    reason: null
  };
}

export function getT2125ExpenseLines() {
  return T2125_EXPENSE_LINES.map(({ patterns, ...line }) => ({ ...line }));
}

export function buildT2125WorkpaperFromYearEnd(report = {}, { year = null } = {}) {
  const taxYear = Number(year || report?.year || new Date().getFullYear());
  const sourceExpenses = Array.isArray(report?.expense_categories) ? report.expense_categories : [];
  const grouped = new Map();
  const sourceRows = [];
  const reviewFlags = [];

  for (const row of sourceExpenses) {
    const recorded = money(row?.amount_cad || 0);
    if (!recorded) continue;
    const line = classifyExpense(row);
    const rule = ruleFor(line);
    const suggestedDeductible = rule.deductible_rate == null
      ? null
      : money(recorded * rule.deductible_rate);

    const source = {
      account_code: String(row?.account_code || "").trim() || "unknown",
      account_label: String(row?.label || row?.account_code || "Unknown account"),
      recorded_amount_cad: recorded,
      t2125_line: line.code,
      t2125_category: line.label,
      adjustment: rule.adjustment,
      suggested_deductible_cad: suggestedDeductible,
      review_required: rule.review_required,
      review_reason: rule.reason
    };
    sourceRows.push(source);

    const current = grouped.get(line.code) || {
      line: line.code,
      key: line.key,
      category: line.label,
      recorded_amount_cad: 0,
      suggested_deductible_cad: 0,
      unresolved_amount_cad: 0,
      source_accounts: [],
      review_required: false
    };
    current.recorded_amount_cad = money(current.recorded_amount_cad + recorded);
    if (suggestedDeductible == null) {
      current.unresolved_amount_cad = money(current.unresolved_amount_cad + recorded);
    } else {
      current.suggested_deductible_cad = money(current.suggested_deductible_cad + suggestedDeductible);
    }
    current.review_required ||= rule.review_required;
    current.source_accounts.push(source.account_code);
    grouped.set(line.code, current);

    if (rule.review_required) {
      reviewFlags.push({
        severity: line.code === "9270" ? "high" : "review",
        account_code: source.account_code,
        amount_cad: recorded,
        t2125_line: line.code,
        message: rule.reason
      });
    }
  }

  const lineItems = Array.from(grouped.values())
    .map((row) => ({ ...row, source_accounts: [...new Set(row.source_accounts)].sort() }))
    .sort((a, b) => Number(a.line) - Number(b.line));

  const knownDeductible = money(lineItems.reduce((sum, row) => sum + Number(row.suggested_deductible_cad || 0), 0));
  const unresolved = money(lineItems.reduce((sum, row) => sum + Number(row.unresolved_amount_cad || 0), 0));
  const revenue = money(report?.totals?.revenue_cad || 0);
  const ledgerExpense = money(report?.totals?.expense_cad || 0);
  const ledgerNet = money(report?.totals?.net_income_cad || (revenue - ledgerExpense));
  const hstCollected = money(report?.totals?.hst_collected_cad || 0);
  const hstItcActivity = money(report?.totals?.hst_debits_cad || 0);
  const hstNet = money(report?.totals?.hst_net_activity_cad || 0);

  const generalFlags = [];
  if (unresolved > 0) {
    generalFlags.push({
      severity: "review",
      message: `${unresolved.toFixed(2)} CAD of recorded expenses needs an allocation or tax-category decision before the workpaper is filing-ready.`
    });
  }
  if (!sourceRows.length && ledgerExpense > 0) {
    generalFlags.push({ severity: "high", message: "Ledger expenses exist but no expense-category detail was available for T2125 mapping." });
  }

  return {
    schema_version: 1,
    tax_year: taxYear,
    jurisdiction: "Canada / Ontario",
    workpaper_type: "T2125",
    filing_status: reviewFlags.length || generalFlags.length ? "review_required" : "mapped_for_review",
    disclaimer: "Accounting workpaper only. It assists with T2125 preparation and does not determine filing eligibility or replace tax advice.",
    summary: {
      gross_business_revenue_cad: revenue,
      ledger_expenses_cad: ledgerExpense,
      ledger_net_income_cad: ledgerNet,
      known_deductible_candidate_cad: knownDeductible,
      unresolved_expense_cad: unresolved,
      owner_draw_cad: money(report?.totals?.owner_draw_cad || 0)
    },
    gst_hst_workpaper: {
      collected_cad: hstCollected,
      input_tax_credit_debit_activity_cad: hstItcActivity,
      net_tax_activity_cad: hstNet,
      note: "Verify that T2125 expense amounts are reduced by GST/HST input tax credits claimed where applicable."
    },
    line_items: lineItems,
    source_account_mappings: sourceRows,
    review_flags: [...generalFlags, ...reviewFlags],
    required_support: {
      motor_vehicle: ["business kilometres", "total kilometres", "operating expense support", "vehicle CCA/lease/interest support where applicable"],
      business_use_home: ["workspace area or reasonable allocation basis", "eligible home costs", "prior-year carry-forward", "net-income limitation"],
      cca: ["asset description", "acquisition/disposition dates", "capital cost", "CCA class", "business-use percentage", "prior UCC"],
      inventory_cogs: ["opening inventory", "purchases/direct costs", "closing inventory", "inventory valuation support"],
      documents: ["sales invoices", "vendor receipts/invoices", "bank/payment evidence", "GST/HST support"]
    },
    cra_reference_lines: getT2125ExpenseLines(),
    generated_from: "Rosie Dazzlers accounting year-end report"
  };
}
