// Build 375 — read-only payment reconciliation and month-end closure authority.
// Existing booking finance events and accounting ledgers remain the sources of truth.
// This helper never posts journal entries, closes a month, charges a customer, or mutates a payment provider.
import { serviceHeaders } from "./staff-auth.js";
import { FINANCE_EVENT_TYPES } from "./financial-lifecycle.js";
import {
  buildBankReconciliationSnapshot,
  buildReceivablesAgingReport,
  buildTaxReport,
  listPayables,
  roundMoney
} from "./accounting-gl.js";

const CHECKLIST_FIELDS = [
  "remittance_reviewed",
  "payables_reviewed",
  "receivables_reviewed",
  "statements_exported",
  "inventory_costs_reviewed",
  "profitability_reviewed"
];

const CLOSED_RECONCILIATION_STATUSES = new Set([
  "reconciled",
  "complete",
  "completed",
  "closed",
  "approved"
]);

const PAID_REQUEST_STATUSES = new Set([
  "paid",
  "succeeded",
  "complete",
  "completed"
]);

export async function buildMonthEndClosureSnapshot(env, { month, year, checklist = null } = {}) {
  const period = monthRange(month, year);
  const [bankStep, taxStep, receivablesStep, payablesStep, financeStep, requestsStep, checklistStep] = await Promise.all([
    safeStep("bank_reconciliation", () => buildBankReconciliationSnapshot(env, {
      month: period.month,
      year: period.year,
      accountCode: "cash"
    })),
    safeStep("hst_support", () => buildTaxReport(env, { month: period.month, year: period.year })),
    safeStep("receivables", () => buildReceivablesAgingReport(env, { month: period.month, year: period.year })),
    safeStep("payables", () => listPayables(env, { status: "all" })),
    safeStep("booking_finance", () => loadFinanceEvents(env, period)),
    safeStep("provider_payment_requests", () => loadPaidFinalBalanceRequests(env, period)),
    checklist
      ? Promise.resolve({ ok: true, name: "month_end_checklist", value: checklist, error: null })
      : safeStep("month_end_checklist", () => loadMonthEndChecklist(env, period.monthStart))
  ]);

  const normalizedChecklist = normalizeChecklist(checklistStep.ok ? checklistStep.value : null);
  const financeTotals = summarizeFinanceEvents(financeStep.ok ? financeStep.value : []);
  const providerEvidence = summarizeProviderRequests(requestsStep.ok ? requestsStep.value : []);
  const bankEvidence = summarizeBank(bankStep.ok ? bankStep.value : null);
  const openPayables = summarizeOpenPayables(payablesStep.ok ? payablesStep.value : []);
  const checklistReady = CHECKLIST_FIELDS.every((field) => normalizedChecklist[field] === true);
  const providerSettlementReviewRequired = providerEvidence.paid_request_count > 0;
  const providerSettlementReviewReady = !providerSettlementReviewRequired || normalizedChecklist.statements_exported;

  const blockers = [];
  for (const step of [bankStep, taxStep, receivablesStep, payablesStep, financeStep, requestsStep, checklistStep]) {
    if (!step.ok) blockers.push(`${step.name}: ${step.error || "evidence unavailable"}`);
  }
  if (bankStep.ok && !bankEvidence.ready) {
    blockers.push(bankEvidence.reason || "Cash account bank reconciliation is not closed for this month.");
  }
  if (!checklistReady) {
    const missing = CHECKLIST_FIELDS.filter((field) => !normalizedChecklist[field]);
    blockers.push(`Month-end review checklist is incomplete: ${missing.join(", ")}.`);
  }
  if (!providerSettlementReviewReady) {
    blockers.push("Paid provider requests exist, but statement/provider settlement review has not been marked complete.");
  }

  const closeReadyCandidate = blockers.length === 0;

  return {
    build: 375,
    month: period.month,
    year: period.year,
    month_start: period.monthStart,
    period_end_exclusive: period.nextMonth,
    status: closeReadyCandidate ? "close_ready_candidate" : "review_required",
    close_ready_candidate: closeReadyCandidate,
    blockers,
    contract: {
      read_only: true,
      automatic_close: false,
      accounting_posting: false,
      booking_mutation: false,
      customer_charge: false,
      payment_provider_mutation: false,
      operator_approval_required: true
    },
    checklist: normalizedChecklist,
    evidence: {
      booking_finance: {
        available: financeStep.ok,
        ...financeTotals
      },
      provider_payments: {
        available: requestsStep.ok,
        settlement_review_required: providerSettlementReviewRequired,
        settlement_review_ready: providerSettlementReviewReady,
        ...providerEvidence
      },
      bank_reconciliation: {
        available: bankStep.ok,
        ...bankEvidence
      },
      hst_support: {
        available: taxStep.ok,
        remittance_reviewed: normalizedChecklist.remittance_reviewed,
        report: taxStep.ok ? taxStep.value : null
      },
      receivables: {
        available: receivablesStep.ok,
        reviewed: normalizedChecklist.receivables_reviewed,
        report: receivablesStep.ok ? receivablesStep.value : null
      },
      payables: {
        available: payablesStep.ok,
        reviewed: normalizedChecklist.payables_reviewed,
        ...openPayables
      }
    },
    generated_at: new Date().toISOString()
  };
}

export function normalizeMonthEndChecklist(row) {
  return normalizeChecklist(row);
}

function monthRange(month, year) {
  const now = new Date();
  const safeMonth = Math.max(1, Math.min(12, Number(month || (now.getMonth() + 1)) || 1));
  const safeYear = Math.max(2020, Math.min(2100, Number(year || now.getFullYear()) || now.getFullYear()));
  const monthStart = `${safeYear}-${String(safeMonth).padStart(2, "0")}-01`;
  const next = safeMonth === 12
    ? `${safeYear + 1}-01-01`
    : `${safeYear}-${String(safeMonth + 1).padStart(2, "0")}-01`;
  return { month: safeMonth, year: safeYear, monthStart, nextMonth: next };
}

async function safeStep(name, fn) {
  try {
    return { ok: true, name, value: await fn(), error: null };
  } catch (err) {
    return { ok: false, name, value: null, error: err?.message || String(err || "Unavailable") };
  }
}

async function loadMonthEndChecklist(env, monthStart) {
  const endpoint = `${env.SUPABASE_URL}/rest/v1/accounting_month_end_checklists?select=*&month_start=eq.${encodeURIComponent(monthStart)}&limit=1`;
  const res = await fetch(endpoint, { headers: serviceHeaders(env) });
  if (!res.ok) throw new Error(`Could not load month-end checklist. ${await res.text()}`);
  const rows = await res.json().catch(() => []);
  return Array.isArray(rows) ? rows[0] || null : null;
}

async function loadFinanceEvents(env, period) {
  const eventFilter = FINANCE_EVENT_TYPES.map((type) => `event_type.eq.${type}`).join(",");
  const endpoint = `${env.SUPABASE_URL}/rest/v1/booking_events?select=${encodeURIComponent("booking_id,event_type,payload,created_at")}&or=(${eventFilter})&created_at=gte.${period.monthStart}T00:00:00Z&created_at=lt.${period.nextMonth}T00:00:00Z&order=created_at.asc&limit=5000`;
  const res = await fetch(endpoint, { headers: serviceHeaders(env) });
  if (!res.ok) throw new Error(`Could not load booking finance evidence. ${await res.text()}`);
  return await res.json().catch(() => []);
}

async function loadPaidFinalBalanceRequests(env, period) {
  const fields = "id,booking_id,amount_cents,paid_amount_cents,currency,status,provider,provider_status,paid_at,created_at,updated_at";
  const endpoint = `${env.SUPABASE_URL}/rest/v1/final_balance_payment_requests?select=${encodeURIComponent(fields)}&order=created_at.desc&limit=1000`;
  const res = await fetch(endpoint, { headers: serviceHeaders(env) });
  if (!res.ok) throw new Error(`Could not load provider payment evidence. ${await res.text()}`);
  const rows = await res.json().catch(() => []);
  return (Array.isArray(rows) ? rows : []).filter((row) => {
    if (!isPaidRequest(row)) return false;
    const paidAt = Date.parse(row?.paid_at || row?.updated_at || row?.created_at || "");
    const start = Date.parse(`${period.monthStart}T00:00:00Z`);
    const end = Date.parse(`${period.nextMonth}T00:00:00Z`);
    return Number.isFinite(paidAt) && paidAt >= start && paidAt < end;
  });
}

function summarizeFinanceEvents(rows) {
  const totals = {
    event_count: 0,
    deposit_cad: 0,
    final_payment_cad: 0,
    refund_cad: 0,
    discount_cad: 0,
    other_adjustment_cad: 0,
    tip_cad: 0
  };
  for (const row of Array.isArray(rows) ? rows : []) {
    const payload = row && typeof row.payload === "object" && row.payload ? row.payload : {};
    const type = String(payload.entry_type || row.event_type || "").replace("booking_finance_", "");
    const amount = roundMoney(payload.amount_cad || 0);
    if (!Number.isFinite(Number(amount))) continue;
    totals.event_count += 1;
    if (type === "deposit") totals.deposit_cad = roundMoney(totals.deposit_cad + amount);
    else if (type === "final_payment") totals.final_payment_cad = roundMoney(totals.final_payment_cad + amount);
    else if (type === "refund") totals.refund_cad = roundMoney(totals.refund_cad + amount);
    else if (type === "discount") totals.discount_cad = roundMoney(totals.discount_cad + amount);
    else if (type === "other") totals.other_adjustment_cad = roundMoney(totals.other_adjustment_cad + amount);
    else if (type === "tip") totals.tip_cad = roundMoney(totals.tip_cad + amount);
  }
  totals.net_service_collections_cad = roundMoney(
    totals.deposit_cad + totals.final_payment_cad - totals.refund_cad
  );
  return totals;
}

function summarizeProviderRequests(rows) {
  const byProvider = {};
  let paidAmountCents = 0;
  for (const row of Array.isArray(rows) ? rows : []) {
    const provider = normalizeStatus(row?.provider) || "unclassified";
    const cents = Number(row?.paid_amount_cents || row?.amount_cents || 0);
    const safeCents = Number.isFinite(cents) ? Math.max(0, Math.round(cents)) : 0;
    paidAmountCents += safeCents;
    if (!byProvider[provider]) byProvider[provider] = { paid_request_count: 0, paid_amount_cents: 0 };
    byProvider[provider].paid_request_count += 1;
    byProvider[provider].paid_amount_cents += safeCents;
  }
  return {
    paid_request_count: Array.isArray(rows) ? rows.length : 0,
    paid_amount_cents: paidAmountCents,
    paid_amount_cad: roundMoney(paidAmountCents / 100),
    by_provider: byProvider
  };
}

function summarizeBank(snapshot) {
  if (!snapshot) {
    return { ready: false, reason: "Cash account bank reconciliation evidence is unavailable.", latest_reconciliation: null };
  }
  const latest = snapshot.latest_reconciliation || null;
  if (!latest) {
    return {
      ready: false,
      reason: "No saved cash account reconciliation exists for this month.",
      ending_book_balance_cad: roundMoney(snapshot.ending_book_balance_cad || 0),
      latest_reconciliation: null
    };
  }
  const status = normalizeStatus(latest.status);
  const difference = roundMoney(latest.difference_cad ?? (
    Number(latest.statement_ending_balance_cad || 0) - Number(latest.calculated_book_balance_cad || 0)
  ));
  const ready = CLOSED_RECONCILIATION_STATUSES.has(status) && Math.abs(difference) < 0.01;
  return {
    ready,
    reason: ready ? null : `Cash reconciliation must be closed with a zero difference; current status is ${status || "unknown"} and difference is ${difference.toFixed(2)} CAD.`,
    ending_book_balance_cad: roundMoney(snapshot.ending_book_balance_cad || 0),
    month_activity_cad: roundMoney(snapshot.month_activity_cad || 0),
    difference_cad: difference,
    latest_reconciliation: latest
  };
}

function summarizeOpenPayables(rows) {
  const open = (Array.isArray(rows) ? rows : []).filter((row) =>
    ["open", "partial"].includes(normalizeStatus(row?.payment_status))
  );
  return {
    open_count: open.length,
    open_balance_cad: roundMoney(open.reduce((sum, row) => sum + Number(row?.balance_due_cad || 0), 0)),
    rows: open.slice(0, 100)
  };
}

function normalizeChecklist(row) {
  const normalized = { month_start: row?.month_start || null };
  for (const field of CHECKLIST_FIELDS) normalized[field] = row?.[field] === true;
  normalized.notes = row?.notes || "";
  normalized.updated_at = row?.updated_at || null;
  normalized.updated_by_name = row?.updated_by_name || null;
  return normalized;
}

function isPaidRequest(row) {
  const status = normalizeStatus(row?.status);
  const providerStatus = normalizeStatus(row?.provider_status);
  return !!row?.paid_at || PAID_REQUEST_STATUSES.has(status) || providerStatus.includes("paid") || providerStatus.includes("succeeded");
}

function normalizeStatus(value) {
  return String(value || "").trim().toLowerCase();
}
