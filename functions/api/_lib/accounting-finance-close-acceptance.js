// Build 394 — read-only Finance close, reconciliation and accountant-export acceptance authority.
// Existing booking finance events, accounting journals, bank reconciliation, month-end checklist
// and export builders remain canonical. This helper never posts accounting entries, closes a period,
// charges/refunds a customer, or mutates Stripe/PayPal/provider state.
import { buildMonthEndClosureSnapshot } from "./accounting-month-end-closure.js";
import { buildMonthlyReport, roundMoney } from "./accounting-gl.js";

const FEE_ACCOUNT_PATTERN = /(fee|processing|processor|merchant|stripe|paypal)/i;

export async function buildFinanceCloseAcceptanceSnapshot(env, { month, year } = {}) {
  const period = normalizePeriod(month, year);
  const [closureStep, ledgerStep] = await Promise.all([
    safeStep("month_end_closure", () => buildMonthEndClosureSnapshot(env, period)),
    safeStep("posted_ledger", () => buildMonthlyReport(env, period))
  ]);

  return deriveFinanceCloseAcceptance({
    ...period,
    closure: closureStep.value,
    monthlyReport: ledgerStep.value,
    closureAvailable: closureStep.ok,
    ledgerAvailable: ledgerStep.ok,
    sourceErrors: [closureStep, ledgerStep]
      .filter((step) => !step.ok)
      .map((step) => `${step.name}: ${step.error || "evidence unavailable"}`)
  });
}

export function deriveFinanceCloseAcceptance({
  month,
  year,
  closure = null,
  monthlyReport = null,
  closureAvailable = true,
  ledgerAvailable = true,
  sourceErrors = []
} = {}) {
  const period = normalizePeriod(month, year);
  const booking = closure?.evidence?.booking_finance || {};
  const provider = closure?.evidence?.provider_payments || {};
  const bank = closure?.evidence?.bank_reconciliation || {};
  const hst = closure?.evidence?.hst_support || {};
  const feeEvidence = summarizeExplicitFeeAccounts(monthlyReport);

  const scenarios = {
    deposit: bookingScenario("deposit", booking, closureAvailable, "deposit_cad"),
    final_balance: bookingScenario("final balance", booking, closureAvailable, "final_payment_cad"),
    refund: bookingScenario("refund", booking, closureAvailable, "refund_cad"),
    provider_fees: providerFeeScenario({ provider, feeEvidence, closureAvailable, ledgerAvailable }),
    hst: hstScenario(hst, closureAvailable),
    reconciliation: reconciliationScenario(bank, closureAvailable),
    month_end: monthEndScenario(closure, closureAvailable),
    accountant_export: exportScenario(closure, closureAvailable, feeEvidence, provider)
  };

  const sourceUnavailable = !closureAvailable || !ledgerAvailable;
  const scenarioValues = Object.values(scenarios);
  const reviewScenarios = scenarioValues.filter((row) => row.status === "review");
  const unavailableScenarios = scenarioValues.filter((row) => row.status === "unavailable");
  let status = "ready";
  if (sourceUnavailable || unavailableScenarios.length) status = "unavailable";
  else if (reviewScenarios.length) status = "review";

  const reasons = [
    ...(Array.isArray(sourceErrors) ? sourceErrors : []),
    ...scenarioValues.flatMap((row) => row.reasons || [])
  ];

  return {
    build: 394,
    month: period.month,
    year: period.year,
    status,
    readiness: {
      ready: status === "ready",
      review_required: status === "review",
      unavailable: status === "unavailable",
      reasons: unique(reasons)
    },
    scenarios,
    export_manifest: buildExportManifest(period.year),
    boundaries: {
      read_only: true,
      accounting_posting: false,
      period_close_mutation: false,
      customer_charge: false,
      customer_refund: false,
      payment_provider_mutation: false,
      automatic_accountant_approval: false,
      explicit_operator_authorization_required_for_mutation: true
    },
    generated_at: new Date().toISOString()
  };
}

function bookingScenario(label, booking, available, amountField) {
  if (!available || booking?.available === false) {
    return scenario("unavailable", [`${capitalize(label)} evidence is unavailable from the canonical booking-finance authority.`], {
      amount_cad: null,
      event_count: null
    });
  }
  return scenario("ready", [], {
    amount_cad: roundMoney(booking?.[amountField] || 0),
    event_count: Number(booking?.event_count || 0),
    source: "booking_events / booking_finance_*"
  });
}

function providerFeeScenario({ provider, feeEvidence, closureAvailable, ledgerAvailable }) {
  if (!closureAvailable || !ledgerAvailable || provider?.available === false) {
    return scenario("unavailable", ["Provider-fee acceptance cannot be proven because provider or posted-ledger evidence is unavailable."], {
      applicable: null,
      recorded_fee_cad: null,
      fee_accounts: []
    });
  }

  const paidCount = Number(provider?.paid_request_count || 0);
  const applicable = paidCount > 0;
  if (!applicable) {
    return scenario("ready", [], {
      applicable: false,
      paid_provider_request_count: 0,
      recorded_fee_cad: roundMoney(feeEvidence.total_cad),
      fee_accounts: feeEvidence.accounts,
      note: "No paid provider requests exist for this period; explicit provider-fee evidence is not required."
    });
  }

  if (!feeEvidence.accounts.length) {
    return scenario("review", ["Paid provider requests exist but no explicit posted fee/processing account evidence was found; provider fees must be reviewed rather than inferred."], {
      applicable: true,
      paid_provider_request_count: paidCount,
      paid_provider_amount_cad: roundMoney(provider?.paid_amount_cad || 0),
      recorded_fee_cad: null,
      fee_accounts: []
    });
  }

  return scenario("ready", [], {
    applicable: true,
    paid_provider_request_count: paidCount,
    paid_provider_amount_cad: roundMoney(provider?.paid_amount_cad || 0),
    recorded_fee_cad: roundMoney(feeEvidence.total_cad),
    fee_accounts: feeEvidence.accounts
  });
}

function hstScenario(hst, closureAvailable) {
  if (!closureAvailable || hst?.available === false || !hst?.report) {
    return scenario("unavailable", ["HST evidence is unavailable from the posted sales-tax authority."], {
      net_tax_payable_cad: null,
      remittance_reviewed: false
    });
  }
  if (hst.remittance_reviewed !== true) {
    return scenario("review", ["HST report exists but remittance review is not complete for the period."], {
      net_tax_payable_cad: roundMoney(hst.report?.net_tax_payable_cad || 0),
      remittance_reviewed: false
    });
  }
  return scenario("ready", [], {
    net_tax_payable_cad: roundMoney(hst.report?.net_tax_payable_cad || 0),
    suggested_remittance_cad: roundMoney(hst.report?.suggested_remittance_cad || 0),
    remittance_reviewed: true
  });
}

function reconciliationScenario(bank, closureAvailable) {
  if (!closureAvailable || bank?.available === false) {
    return scenario("unavailable", ["Bank reconciliation evidence is unavailable."], {
      difference_cad: null,
      reconciliation_status: null
    });
  }
  if (bank.ready !== true) {
    return scenario("review", [bank.reason || "Bank reconciliation is not closed with a zero difference."], {
      difference_cad: bank.difference_cad == null ? null : roundMoney(bank.difference_cad),
      reconciliation_status: bank.latest_reconciliation?.status || null
    });
  }
  return scenario("ready", [], {
    difference_cad: roundMoney(bank.difference_cad || 0),
    reconciliation_status: bank.latest_reconciliation?.status || "reconciled"
  });
}

function monthEndScenario(closure, closureAvailable) {
  if (!closureAvailable || !closure) {
    return scenario("unavailable", ["Month-end close evidence is unavailable."], {
      close_ready_candidate: false,
      blockers: []
    });
  }
  if (closure.close_ready_candidate !== true) {
    return scenario("review", Array.isArray(closure.blockers) && closure.blockers.length
      ? closure.blockers
      : ["Month-end close remains review-required."], {
      close_ready_candidate: false,
      blockers: Array.isArray(closure.blockers) ? closure.blockers : []
    });
  }
  return scenario("ready", [], { close_ready_candidate: true, blockers: [] });
}

function exportScenario(closure, closureAvailable, feeEvidence, provider) {
  if (!closureAvailable || !closure) {
    return scenario("unavailable", ["Accountant-export readiness cannot be proven without month-end close evidence."], {
      manual_approval_required: true
    });
  }
  const paidCount = Number(provider?.paid_request_count || 0);
  const feeGap = paidCount > 0 && !feeEvidence.accounts.length;
  if (closure.close_ready_candidate !== true || feeGap) {
    const reasons = [];
    if (closure.close_ready_candidate !== true) reasons.push("Accountant export remains review-required until month-end close evidence is complete.");
    if (feeGap) reasons.push("Accountant export requires explicit provider-fee review because paid provider activity exists without posted fee evidence.");
    return scenario("review", reasons, { manual_approval_required: true });
  }
  return scenario("ready", [], { manual_approval_required: true });
}

function summarizeExplicitFeeAccounts(monthlyReport) {
  const rows = Array.isArray(monthlyReport?.by_account) ? monthlyReport.by_account : [];
  const accounts = rows
    .filter((row) => FEE_ACCOUNT_PATTERN.test(`${row?.account_code || ""} ${row?.label || ""}`))
    .map((row) => ({
      account_code: row.account_code || null,
      label: row.label || row.account_code || null,
      amount_cad: roundMoney(row.amount_cad || 0)
    }));
  return {
    accounts,
    total_cad: roundMoney(accounts.reduce((sum, row) => sum + Number(row.amount_cad || 0), 0))
  };
}

function buildExportManifest(year) {
  return {
    accountant_package: `/api/admin/accounting_accountant_package?year=${year}`,
    csv_exports: [
      "general_ledger",
      "profit_and_loss",
      "balance_sheet",
      "cash_flow",
      "payables",
      "inventory_costs",
      "receivables_aging",
      "operational_profitability",
      "year_end_package"
    ].map((type) => ({ type, endpoint: `/api/admin/accounting_export?type=${type}&year=${year}` }))
  };
}

function scenario(status, reasons = [], evidence = {}) {
  return { status, reasons: unique(reasons), evidence };
}

function normalizePeriod(month, year) {
  const now = new Date();
  const safeMonth = Math.max(1, Math.min(12, Number(month || (now.getMonth() + 1)) || 1));
  const safeYear = Math.max(2020, Math.min(2100, Number(year || now.getFullYear()) || now.getFullYear()));
  return { month: safeMonth, year: safeYear };
}

async function safeStep(name, fn) {
  try {
    return { ok: true, name, value: await fn(), error: null };
  } catch (err) {
    return { ok: false, name, value: null, error: err?.message || String(err || "Unavailable") };
  }
}

function unique(values) {
  return [...new Set((Array.isArray(values) ? values : []).filter(Boolean).map((value) => String(value)))];
}

function capitalize(value) {
  const text = String(value || "");
  return text ? text[0].toUpperCase() + text.slice(1) : text;
}
