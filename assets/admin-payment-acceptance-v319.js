// Build 319 — read-only Payment Acceptance Evidence client.
const API = "/api/admin/payment_acceptance_evidence?limit=200";

const $ = (id) => document.getElementById(id);
const state = { loading: false };

document.addEventListener("DOMContentLoaded", () => {
  $("refreshBtn")?.addEventListener("click", loadEvidence);
  loadEvidence();
});

async function loadEvidence() {
  if (state.loading) return;
  state.loading = true;
  setNotice("Loading payment acceptance evidence…", "");
  if ($("refreshBtn")) $("refreshBtn").disabled = true;

  try {
    const response = await fetch(API, { method: "GET", headers: { Accept: "application/json" }, credentials: "same-origin" });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.ok) throw new Error(data?.error || `Evidence request failed (${response.status}).`);
    assertReadOnlyContract(data.contract);
    render(data);
  } catch (error) {
    renderFailure(error);
  } finally {
    state.loading = false;
    if ($("refreshBtn")) $("refreshBtn").disabled = false;
  }
}

function assertReadOnlyContract(contract) {
  const safe = contract?.read_only === true
    && contract?.secret_values_exposed === false
    && contract?.provider_mutation === false
    && contract?.automatic_charge === false
    && contract?.automatic_checkout_creation === false
    && contract?.automatic_customer_notification === false
    && contract?.recurring_billing === false
    && contract?.operator_action_required === true
    && contract?.webhook_verification_asserted === false;
  if (!safe) throw new Error("Payment evidence safety contract is missing or unsafe. Rendering is blocked.");
}

function render(data) {
  const stripe = data.stripe_environment || {};
  const summary = data.summary || {};
  $("stripeMode").textContent = String(stripe.mode || "unknown").replaceAll("_", " ");
  $("stripeDetail").textContent = stripe.mode === "test"
    ? "Test credential classified server-side; secret value not returned."
    : stripe.mode === "live"
      ? "Live credential detected — Development provider acceptance blocked."
      : stripe.mode === "not_configured"
        ? "Stripe unavailable; manual fallback only."
        : "Credential mode cannot be safely classified.";
  $("checkoutCount").textContent = number(summary.stripe_checkout_evidence);
  $("paidCount").textContent = number(summary.stripe_persisted_paid_evidence);
  $("developmentState").textContent = label(data.development_status);
  $("developmentDetail").textContent = developmentDetail(data.development_status);
  renderList($("blockerList"), data.blockers, "No Development blockers reported.");
  renderList($("warningList"), data.warnings, "No warnings reported.");
  renderRows(Array.isArray(data.records) ? data.records : []);

  if (!data.table_ready) {
    setNotice(data.source_warning || "Payment evidence table is unavailable. Provider configuration can be shown, but transaction evidence cannot be accepted.", "warn");
  } else if ((data.blockers || []).length) {
    setNotice(`Development payment acceptance is blocked: ${label(data.development_status)}.`, "bad");
  } else if (data.development_status === "persisted_paid_evidence_present") {
    setNotice("Stripe test mode has persisted paid evidence. This is application evidence only; Build 319 does not assert webhook verification.", "ok");
  } else if (data.development_status === "checkout_evidence_present") {
    setNotice("Stripe test mode has checkout-creation evidence. Payment completion evidence is still pending.", "ok");
  } else if (data.development_status === "configuration_ready_evidence_pending") {
    setNotice("Stripe test configuration is ready; persisted transaction evidence is still pending.", "warn");
  } else {
    setNotice("Provider transaction acceptance is not established; manual operation remains available.", "warn");
  }
}

function renderRows(records) {
  const body = $("evidenceRows");
  body.replaceChildren();
  if (!records.length) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 9;
    td.className = "empty";
    td.textContent = "No persisted final-balance payment evidence was found.";
    tr.append(td);
    body.append(tr);
    return;
  }

  for (const record of records) {
    const tr = document.createElement("tr");
    appendCell(tr, "Request", shortId(record.request_id));
    appendCell(tr, "Booking", record.booking_id || "—");
    appendCell(tr, "Customer", record.customer_name || "—");
    appendCell(tr, "Provider", record.provider || "—", badgeClass(record.evidence_state));
    appendCell(tr, "Amount", money(record.amount_cents, record.currency), "money");
    appendCell(tr, "Status", label(record.status));
    appendCell(tr, "Evidence", label(record.evidence_state), badgeClass(record.evidence_state));
    appendCell(tr, "Checkout", formatDate(record.checkout_created_at));
    appendCell(tr, "Paid", formatDate(record.paid_at));
    body.append(tr);
  }
}

function appendCell(row, heading, value, className = "") {
  const cell = document.createElement("td");
  cell.dataset.label = heading;
  if (className.startsWith("badge")) {
    const badge = document.createElement("span");
    badge.className = className;
    badge.textContent = String(value);
    cell.append(badge);
  } else {
    cell.className = className;
    cell.textContent = String(value);
  }
  row.append(cell);
}

function renderList(element, values, emptyText) {
  element.replaceChildren();
  const items = Array.isArray(values) && values.length ? values : [emptyText];
  for (const value of items) {
    const li = document.createElement("li");
    li.textContent = String(value);
    element.append(li);
  }
}

function renderFailure(error) {
  setNotice(error?.message || "Could not load payment acceptance evidence.", "bad");
  $("stripeMode").textContent = "Unavailable";
  $("stripeDetail").textContent = "Read-only evidence could not be loaded.";
  $("checkoutCount").textContent = "—";
  $("paidCount").textContent = "—";
  $("developmentState").textContent = "Blocked";
  $("developmentDetail").textContent = "Resolve the evidence API failure before Development acceptance.";
  renderList($("blockerList"), ["Evidence API unavailable; acceptance must fail closed."], "");
  renderList($("warningList"), [], "No additional warnings available.");
  renderRows([]);
}

function setNotice(message, tone) {
  const notice = $("pageNotice");
  notice.className = `notice${tone ? ` ${tone}` : ""}`;
  notice.textContent = message;
}

function badgeClass(evidenceState) {
  const value = String(evidenceState || "");
  if (value.includes("paid_evidence") || value === "stripe_checkout_evidence") return "badge ok";
  if (value.includes("failed") || value.includes("cancelled") || value.includes("expired")) return "badge bad";
  if (value.includes("pending") || value.includes("manual") || value.includes("not_current")) return "badge warn";
  return "badge neutral";
}

function developmentDetail(status) {
  const details = {
    blocked_live_credential: "Live Stripe credential detected; Development provider testing is prohibited.",
    blocked_unknown_credential: "Stripe credential mode is unknown; provider testing remains blocked.",
    manual_only: "No Stripe test acceptance; manual operational fallback only.",
    configuration_ready_evidence_pending: "Test credentials ready; no persisted Stripe transaction evidence yet.",
    checkout_evidence_present: "A Stripe checkout was persisted; paid evidence is not yet established.",
    persisted_paid_evidence_present: "Persisted Stripe paid state exists; webhook verification is not asserted."
  };
  return details[status] || "Development evidence state could not be classified.";
}

function money(cents, currency = "CAD") {
  const value = Number(cents || 0) / 100;
  try { return new Intl.NumberFormat("en-CA", { style: "currency", currency: currency || "CAD" }).format(value); }
  catch { return `$${value.toFixed(2)}`; }
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" });
}

function shortId(value) {
  const text = String(value ?? "—");
  return text.length > 14 ? `${text.slice(0, 6)}…${text.slice(-5)}` : text;
}

function number(value) {
  return new Intl.NumberFormat("en-CA").format(Number(value || 0));
}

function label(value) {
  return String(value || "unknown").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
