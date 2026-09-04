const state = { records: [], filtered: [] };
const $ = (selector) => document.querySelector(selector);
const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (m) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[m]));
const money = (cents, currency = "CAD") => new Intl.NumberFormat("en-CA", { style:"currency", currency }).format(Number(cents || 0) / 100);
const when = (value) => { try { return value ? new Intl.DateTimeFormat("en-CA", { dateStyle:"medium", timeStyle:"short" }).format(new Date(value)) : "—"; } catch { return "—"; } };

function setNotice(message, kind = "") {
  const node = $("#pageNotice");
  node.className = `notice${kind ? ` ${kind}` : ""}`;
  node.textContent = message;
}

async function apiJson(url) {
  const response = await fetch(url, { method:"GET", credentials:"include", cache:"no-store", headers:{ Accept:"application/json" } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data?.ok === false) throw new Error(data?.error || `Request failed (${response.status}).`);
  return data;
}

function verifyContract(contract) {
  const safe = contract?.read_only === true &&
    contract?.secret_values_exposed === false &&
    contract?.provider_contact_read_only === true &&
    contract?.provider_mutation === false &&
    contract?.finance_mutation === false &&
    contract?.automatic_charge === false &&
    contract?.automatic_checkout_creation === false &&
    contract?.automatic_customer_notification === false &&
    contract?.recurring_billing === false &&
    contract?.webhook_verification_asserted === false &&
    contract?.operator_action_required === true;
  if (!safe) throw new Error("Payment reconciliation did not return the required fail-closed read-only contract.");
}

async function load() {
  $("#refreshBtn").disabled = true;
  setNotice("Checking Stripe/local reconciliation evidence…");
  try {
    const data = await apiJson("/api/admin/payment_reconciliation_readiness?limit=25");
    verifyContract(data.contract || {});
    state.records = Array.isArray(data.records) ? data.records : [];
    renderEnvironment(data);
    renderCounts(data.summary || {});
    renderMessages(data.blockers || [], data.warnings || [], data.source_warning, data.finance_warning);
    applyFilters();
    const blocked = Array.isArray(data.blockers) && data.blockers.length;
    setNotice(`Checked ${state.records.length} tracked Stripe payment request${state.records.length === 1 ? "" : "s"}.`, blocked ? "bad" : "ok");
  } catch (err) {
    state.records = [];
    state.filtered = [];
    renderCounts({});
    renderRows();
    setNotice(err?.message || "Could not load payment reconciliation readiness.", "bad");
  } finally {
    $("#refreshBtn").disabled = false;
  }
}

function renderEnvironment(data) {
  const env = data.stripe_environment || {};
  $("#stripeMode").textContent = env.mode || "unknown";
  $("#providerContact").textContent = env.provider_contact_allowed ? "Read-only lookup allowed" : "Blocked / unavailable";
  $("#financeSource").textContent = data.finance_source_ready ? "Available" : "Unavailable";
}

function renderMessages(blockers, warnings, sourceWarning, financeWarning) {
  const items = [];
  blockers.forEach((message) => items.push(`<li class="bad-text"><strong>Blocker:</strong> ${esc(message)}</li>`));
  warnings.forEach((message) => items.push(`<li>${esc(message)}</li>`));
  if (sourceWarning) items.push(`<li class="bad-text"><strong>Payment source:</strong> ${esc(sourceWarning)}</li>`);
  if (financeWarning) items.push(`<li class="bad-text"><strong>Finance source:</strong> ${esc(financeWarning)}</li>`);
  $("#messageList").innerHTML = items.length ? items.join("") : "<li>No reconciliation warnings.</li>";
}

function renderCounts(summary) {
  $("#requiredCount").textContent = Number(summary.reconciliation_required || 0);
  $("#matchedCount").textContent = Number(summary.matched_paid || 0);
  $("#blockedCount").textContent = Number(summary.blocked_discrepancy || 0);
  $("#openCount").textContent = Number(summary.provider_open || 0);
}

function applyFilters() {
  const q = String($("#searchInput").value || "").trim().toLowerCase();
  const filter = String($("#stateFilter").value || "all");
  state.filtered = state.records.filter((record) => {
    const stateMatches = filter === "all" || group(record.reconciliation_state) === filter || record.reconciliation_state === filter;
    if (!stateMatches) return false;
    if (!q) return true;
    return [record.request_id, record.booking_id, record.customer_name, record.customer_email, record.reconciliation_state, record.provider_session_status, record.provider_payment_status].join(" ").toLowerCase().includes(q);
  });
  renderRows();
}

function group(value) {
  if (["finance_reconciliation_required", "request_state_reconciliation_required"].includes(value)) return "required";
  if (["blocked_identity_mismatch", "local_provider_discrepancy", "complete_unpaid_review", "blocked_provider_unavailable", "manual_review"].includes(value)) return "blocked";
  if (value === "matched_paid") return "matched";
  return "other";
}

function badge(value) {
  const g = group(value);
  const cls = g === "required" ? "warn" : g === "blocked" ? "bad" : g === "matched" ? "ok" : "neutral";
  const label = ({
    finance_reconciliation_required:"Finance reconciliation",
    request_state_reconciliation_required:"Request-state reconciliation",
    matched_paid:"Matched paid",
    blocked_identity_mismatch:"Identity mismatch",
    local_provider_discrepancy:"Local/provider discrepancy",
    complete_unpaid_review:"Complete / unpaid review",
    blocked_provider_unavailable:"Provider unavailable",
    provider_open:"Provider open",
    recovery_ready:"Recovery ready",
    manual_review:"Manual review"
  })[value] || value || "Unknown";
  return `<span class="badge ${cls}">${esc(label)}</span>`;
}

function yesNo(value) { return value ? "Yes" : "No"; }

function renderRows() {
  const body = $("#reconciliationRows");
  if (!state.filtered.length) {
    body.innerHTML = '<tr><td colspan="9" class="empty">No reconciliation records match the current filters.</td></tr>';
    return;
  }
  body.innerHTML = state.filtered.map((record) => `<tr>
    <td data-label="State">${badge(record.reconciliation_state)}</td>
    <td data-label="Customer"><strong>${esc(record.customer_name || "Unnamed")}</strong><div class="muted">${esc(record.customer_email || "No email")}</div></td>
    <td data-label="Booking"><span class="mono">${esc(record.booking_id || "—")}</span></td>
    <td data-label="Expected"><strong>${esc(money(record.amount_cents, record.currency))}</strong><div class="muted">${esc(record.currency)}</div></td>
    <td data-label="Stripe"><strong>${esc(record.provider_session_status || "unknown")}</strong><div class="muted">payment: ${esc(record.provider_payment_status || "unknown")}</div></td>
    <td data-label="Identity">${yesNo(record.identity_matches)}<div class="muted">amount ${yesNo(record.amount_matches)} · currency ${yesNo(record.currency_matches)}</div></td>
    <td data-label="Local request">${record.local_paid ? "Paid" : "Not paid"}<div class="muted">${esc(money(record.local_paid_amount_cents, record.currency))} · ${esc(when(record.local_paid_at))}</div></td>
    <td data-label="Finance ledger">${record.finance_final_payment_count} final payment${record.finance_final_payment_count === 1 ? "" : "s"}<div class="muted">${esc(money(record.finance_final_payment_cents, record.currency))}</div></td>
    <td data-label="Next step"><div>${esc(record.operator_next_step || "Review manually.")}</div><div class="actions">${record.booking_id ? `<a class="btn secondary" href="/admin-booking.html?booking_id=${encodeURIComponent(record.booking_id)}">Open booking</a>` : ""}<a class="btn secondary" href="/admin-payment-recovery.html">Recovery</a></div></td>
  </tr>`).join("");
}

$("#searchInput").addEventListener("input", applyFilters);
$("#stateFilter").addEventListener("change", applyFilters);
$("#refreshBtn").addEventListener("click", load);
load();
