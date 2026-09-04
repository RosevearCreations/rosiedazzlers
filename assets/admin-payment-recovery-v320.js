const state = { rows: [], filtered: [] };
const $ = (selector) => document.querySelector(selector);
const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
const money = (cents, currency = "CAD") => new Intl.NumberFormat("en-CA", { style: "currency", currency }).format(Number(cents || 0) / 100);
const when = (value) => { try { return value ? new Intl.DateTimeFormat("en-CA", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "—"; } catch { return "—"; } };

function setNotice(message, kind = "") {
  const node = $("#pageNotice");
  node.className = `notice${kind ? ` ${kind}` : ""}`;
  node.textContent = message;
}

async function apiJson(url, options = {}) {
  const response = await fetch(url, {
    credentials: "include",
    ...options,
    headers: { Accept: "application/json", ...(options.body ? { "Content-Type": "application/json" } : {}), ...(options.headers || {}) }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data?.ok === false) throw new Error(data?.error || `Request failed (${response.status}).`);
  return data;
}

function verifyContract(contract) {
  const safe = contract?.read_only === true &&
    contract?.provider_contact === false &&
    contract?.automatic_charge === false &&
    contract?.automatic_checkout_creation === false &&
    contract?.automatic_customer_notification === false &&
    contract?.recurring_billing === false &&
    contract?.duplicate_checkout_creation === false &&
    contract?.operator_action_required === true;
  if (!safe) throw new Error("Recovery readiness did not return the required fail-closed operator contract.");
}

async function loadRecovery() {
  $("#refreshBtn").disabled = true;
  setNotice("Loading payment recovery readiness…");
  try {
    const data = await apiJson("/api/admin/payment_recovery_readiness?limit=200");
    verifyContract(data.contract || {});
    state.rows = Array.isArray(data.rows) ? data.rows : [];
    renderCounts(data.counts || {});
    applyFilters();
    setNotice(data.warning || `Loaded ${state.rows.length} tracked payment request${state.rows.length === 1 ? "" : "s"}.`, data.warning ? "warn" : "ok");
  } catch (err) {
    state.rows = [];
    state.filtered = [];
    renderCounts({});
    renderRows();
    setNotice(err?.message || "Could not load payment recovery readiness.", "bad");
  } finally {
    $("#refreshBtn").disabled = false;
  }
}

function renderCounts(counts) {
  $("#recoverCount").textContent = Number(counts.recovery_required || 0);
  $("#reuseCount").textContent = Number(counts.reuse_guarded || 0);
  $("#prepareCount").textContent = Number(counts.checkout_needed || 0) + Number(counts.manual_handoff || 0);
  $("#paidCount").textContent = Number(counts.paid_closed || 0);
}

function applyFilters() {
  const q = String($("#searchInput").value || "").trim().toLowerCase();
  const status = String($("#stateFilter").value || "all");
  state.filtered = state.rows.filter((row) => {
    if (status !== "all" && row.recovery_state !== status) return false;
    if (!q) return true;
    return [row.id, row.booking_id, row.customer_name, row.customer_email, row.provider, row.provider_status, row.status].join(" ").toLowerCase().includes(q);
  });
  renderRows();
}

function badgeClass(value) {
  if (value === "paid_closed") return "neutral";
  if (value === "reuse_guarded") return "ok";
  if (value === "recovery_required") return "bad";
  return "warn";
}

function label(value) {
  return ({
    checkout_needed: "Checkout needed",
    reuse_guarded: "Reuse guarded",
    recovery_required: "Recovery required",
    manual_handoff: "Manual handoff",
    paid_closed: "Paid / closed"
  })[value] || value || "Unknown";
}

function renderRows() {
  const body = $("#recoveryRows");
  if (!state.filtered.length) {
    body.innerHTML = '<tr><td colspan="9" class="empty">No payment requests match the current filters.</td></tr>';
    return;
  }
  body.innerHTML = state.filtered.map((row) => `<tr>
    <td data-label="Recovery"><span class="badge ${badgeClass(row.recovery_state)}">${esc(label(row.recovery_state))}</span></td>
    <td data-label="Customer"><strong>${esc(row.customer_name || "Unnamed")}</strong><div class="muted">${esc(row.customer_email || "No email")}</div></td>
    <td data-label="Booking"><span class="mono">${esc(row.booking_id || "—")}</span></td>
    <td data-label="Amount"><strong>${esc(money(row.amount_cents, row.currency))}</strong></td>
    <td data-label="Provider">${esc(row.provider || "manual")}<div class="muted">${esc(row.provider_status || "—")}</div></td>
    <td data-label="Checkout">${row.has_checkout_reference ? "Recorded" : "None"}<div class="muted">${esc(when(row.checkout_created_at))}</div></td>
    <td data-label="Expires">${esc(when(row.expires_at))}</td>
    <td data-label="Reason">${esc(row.recovery_reason || "—")}</td>
    <td data-label="Action"><div class="actions">${actionMarkup(row)}</div></td>
  </tr>`).join("");
  body.querySelectorAll("button[data-recover-id]").forEach((button) => button.addEventListener("click", () => prepareCheckout(button.dataset.recoverId)));
}

function actionMarkup(row) {
  const parts = [];
  if (row.payment_url) parts.push(`<a class="btn secondary" href="${esc(row.payment_url)}" target="_blank" rel="noopener">Customer status</a>`);
  if (row.booking_id) parts.push(`<a class="btn secondary" href="/admin-booking.html?booking_id=${encodeURIComponent(row.booking_id)}">Booking</a>`);
  if (row.recovery_state !== "paid_closed") parts.push(`<button class="btn" type="button" data-recover-id="${esc(row.id)}">${row.recovery_state === "recovery_required" ? "Recover request" : "Prepare / reuse checkout"}</button>`);
  return parts.join("");
}

async function prepareCheckout(id) {
  const row = state.rows.find((item) => String(item.id) === String(id));
  if (!row || row.recovery_state === "paid_closed") return;
  const isRecovery = row.recovery_state === "recovery_required";
  const message = isRecovery
    ? "Recover this closed/expired request? The server will verify any existing Stripe session, reuse an open session, and create a replacement only if Stripe confirms the previous session is expired. No charge or customer notification is automatic."
    : "Prepare this checkout? The server will reuse an existing open Stripe session instead of creating a duplicate. No charge or customer notification is automatic.";
  if (!window.confirm(message)) return;

  const body = { payment_request_id: row.id, notify_customer: false };
  if (isRecovery) {
    body.recovery_confirmed = true;
    body.recovery_reason = row.recovery_action || "operator_recovery";
    body.expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    body.rotate_link = true;
  }

  setNotice("Applying duplicate-safe payment recovery…");
  try {
    const data = await apiJson("/api/admin/final_balance_checkout_create", { method: "POST", body: JSON.stringify(body) });
    const action = data.checkout_reused ? "reused the existing checkout" : data.checkout_replaced ? "replaced a provider-confirmed expired checkout" : data.stripe_checkout_created ? "created the first checkout" : "prepared the manual handoff";
    setNotice(`Recovery complete: ${action}. No customer notification was sent.`, "ok");
    await loadRecovery();
  } catch (err) {
    setNotice(err?.message || "Could not prepare payment recovery.", "bad");
  }
}

$("#searchInput").addEventListener("input", applyFilters);
$("#stateFilter").addEventListener("change", applyFilters);
$("#refreshBtn").addEventListener("click", loadRecovery);
loadRecovery();
