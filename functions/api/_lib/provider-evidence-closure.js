// Build 417 — Payment, Refund & Delivery Provider Evidence Closure
// Pure classification only. No provider contact, payment/refund mutation, message send, webhook replay or business-data write.

import { classifyNotificationDeliveryEvidence } from "./customer-communication-consent.js";

const REFUND_SUCCESS = new Set(["refunded","succeeded","success","complete","completed","settled","refund_recorded"]);

export function buildProviderEvidenceClosure({
  readiness = {},
  refunds = [],
  notifications = [],
  sources = {},
  generated_at = new Date().toISOString()
} = {}) {
  const items = Array.isArray(readiness?.items) ? readiness.items : [];
  const stripe = paymentOutcome(items, "stripe");
  const paypal = paymentOutcome(items, "paypal");
  const refund = refundEvidence(Array.isArray(refunds) ? refunds : []);
  const delivery = deliveryEvidence(Array.isArray(notifications) ? notifications : []);

  const required = [
    stage("stripe_payment", "Stripe reconciled provider outcome", stripe.observed, stripe.classification, stripe.detail),
    stage("paypal_payment", "PayPal reconciled provider outcome", paypal.observed, paypal.classification, paypal.detail),
    stage("refund", "Linked definitive refund outcome", refund.definitive_refunds > 0, refund.source_available ? "provider_dependent" : "unavailable",
      refund.definitive_refunds > 0
        ? `${refund.definitive_refunds} refund record(s) have request identity, provider refund/event identity, amount/currency and refunded timestamp evidence.`
        : "No persisted refund record currently satisfies the definitive linked-refund evidence contract."),
    stage("delivery", "Definitive message delivery outcome", delivery.definitive_deliveries > 0, delivery.source_available ? "provider_dependent" : "unavailable",
      delivery.definitive_deliveries > 0
        ? `${delivery.definitive_deliveries} notification(s) contain explicit provider-verified delivery evidence.`
        : delivery.provider_accepted > 0
          ? `${delivery.provider_accepted} notification(s) have provider-accepted/sent evidence, but that is not definitive delivery.`
          : "No persisted notification currently contains definitive provider delivery evidence.")
  ];

  const outstanding = required.filter((row) => row.status !== "verified");
  return {
    generated_at,
    authority: "payment_refund_delivery_provider_evidence_closure",
    status: outstanding.length ? "hold" : "ready",
    decision: outstanding.length ? "provider_evidence_incomplete" : "provider_evidence_complete",
    truth_boundary: {
      source_configuration_is_provider_success: false,
      provider_contact_performed: false,
      payment_or_refund_mutation_performed: false,
      notification_send_performed: false,
      webhook_replay_performed: false,
      accounting_mutation_performed: false,
      customer_identity_exposed: false,
      provider_accepted_is_definitive_delivery: false
    },
    sources: {
      payment_readiness_available: sources?.payment_readiness_available !== false,
      refund_source_available: refund.source_available,
      notification_source_available: delivery.source_available,
      refund_warning: clean(sources?.refund_warning) || null,
      notification_warning: clean(sources?.notification_warning) || null
    },
    payments: { stripe, paypal },
    refunds: refund,
    delivery,
    required,
    outstanding: outstanding.map(({id,title,status,classification}) => ({id,title,status,classification}))
  };
}

function paymentOutcome(items, provider) {
  const id = `${provider}_provider_outcome`;
  const item = items.find((row) => clean(row?.id) === id) || {};
  const classification = clean(item?.classification) || "provider_dependent";
  const reconciled = integer(item?.evidence?.reconciled_records);
  const observed = classification === "runtime_proven" && reconciled > 0;
  return {
    provider,
    observed,
    classification: observed ? "runtime_proven" : classification,
    reconciled_records: reconciled,
    latest_accepted_at: clean(item?.evidence?.latest_accepted_at) || null,
    replay_observed: integer(item?.evidence?.replay_observed),
    detail: observed
      ? `Persisted verified ${providerLabel(provider)} outcome reconciles to an internal payment request.`
      : `No persisted ${providerLabel(provider)} outcome currently satisfies the retained live-payment reconciliation contract.`
  };
}

function refundEvidence(rows) {
  let definitive = 0, incomplete = 0;
  const byProvider = { stripe: 0, paypal: 0, other: 0 };
  let latest = null;
  for (const row of rows) {
    const provider = normalize(row?.provider);
    const amount = integer(row?.refund_amount_cents);
    const currency = clean(row?.currency).toUpperCase();
    const success = REFUND_SUCCESS.has(normalize(row?.refund_status));
    const identity = !!clean(row?.quote_deposit_payment_request_id)
      && !!clean(row?.provider_refund_id)
      && !!clean(row?.provider_event_id);
    const valid = success && identity && amount > 0 && /^[A-Z]{3}$/.test(currency) && !!clean(row?.refunded_at);
    if (valid) {
      definitive += 1;
      if (provider === "stripe" || provider === "paypal") byProvider[provider] += 1;
      else byProvider.other += 1;
      const at = clean(row?.refunded_at);
      if (!latest || at > latest) latest = at;
    } else {
      incomplete += 1;
    }
  }
  return {
    source_available: true,
    total_records: rows.length,
    definitive_refunds: definitive,
    incomplete_records: incomplete,
    by_provider: byProvider,
    latest_refunded_at: latest,
    provider_success_inferred: false
  };
}

function deliveryEvidence(rows) {
  let definitive = 0, accepted = 0, failed = 0, cancelled = 0, queued = 0;
  const byChannel = {};
  let latest = null;
  for (const row of rows) {
    const evidence = classifyNotificationDeliveryEvidence(row);
    const channel = normalize(row?.channel) || "unknown";
    byChannel[channel] ||= { definitive_deliveries: 0, provider_accepted: 0, failed: 0, cancelled: 0, queued: 0 };
    if (evidence.definitive_delivery) {
      definitive += 1;
      byChannel[channel].definitive_deliveries += 1;
      if (evidence.evidence_at && (!latest || evidence.evidence_at > latest)) latest = evidence.evidence_at;
    } else if (evidence.state === "provider_accepted") {
      accepted += 1;
      byChannel[channel].provider_accepted += 1;
    } else if (evidence.state === "failed") {
      failed += 1;
      byChannel[channel].failed += 1;
    } else if (["cancelled","suppressed"].includes(evidence.state)) {
      cancelled += 1;
      byChannel[channel].cancelled += 1;
    } else {
      queued += 1;
      byChannel[channel].queued += 1;
    }
  }
  return {
    source_available: true,
    total_records: rows.length,
    definitive_deliveries: definitive,
    provider_accepted: accepted,
    failed,
    cancelled_or_suppressed: cancelled,
    queued_or_pending: queued,
    by_channel: byChannel,
    latest_definitive_delivery_at: latest,
    provider_accepted_is_definitive_delivery: false
  };
}

function stage(id, title, verified, fallbackClassification, detail) {
  return {
    id,
    title,
    status: verified ? "verified" : (fallbackClassification === "unavailable" ? "unavailable" : "provider_dependent"),
    classification: verified ? "runtime_proven" : (fallbackClassification || "provider_dependent"),
    detail
  };
}

function providerLabel(value) { return value === "paypal" ? "PayPal" : "Stripe"; }
function normalize(value) { return clean(value).toLowerCase(); }
function integer(value) { const n = Number(value); return Number.isFinite(n) ? Math.max(0, Math.trunc(n)) : 0; }
function clean(value) { return String(value ?? "").trim(); }
