const state = { rows: [], filtered: [], selectedId: null, generatedAt: null };

const $ = (selector) => document.querySelector(selector);

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function money(cents) {
  const amount = Number(cents || 0) / 100;
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(Number.isFinite(amount) ? amount : 0);
}

function setNotice(message, kind = "") {
  const node = $("#pageNotice");
  if (!node) return;
  node.className = `notice${kind ? ` ${kind}` : ""}`;
  node.textContent = message;
}

async function apiJson(url, options = {}) {
  const response = await fetch(url, {
    credentials: "include",
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data?.ok === false) throw new Error(data?.error || `Request failed (${response.status}).`);
  return data;
}

async function loadReadiness() {
  setNotice("Loading final-balance readiness…");
  $("#refreshBtn").disabled = true;
  try {
    const data = await apiJson("/api/admin/final_balance_readiness?limit=200");
    state.rows = Array.isArray(data.rows) ? data.rows : [];
    state.generatedAt = data.generated_at || null;
    verifyServerContract(data.contract || {});
    renderMetrics(data.counts || {});
    applyFilters();
    const warnings = Array.isArray(data.warnings) ? data.warnings.filter(Boolean) : [];
    setNotice(warnings.length ? `Readiness loaded with warnings: ${warnings.join(" ")}` : `Readiness loaded for ${state.rows.length} booking${state.rows.length === 1 ? "" : "s"}.`, warnings.length ? "warn" : "ok");
  } catch (err) {
    state.rows = [];
    state.filtered = [];
    renderMetrics({ ready: 0, blocked: 0, requested: 0, paid: 0 });
    renderQueue();
    setNotice(err?.message || "Could not load final-balance readiness.", "bad");
  } finally {
    $("#refreshBtn").disabled = false;
  }
}

function verifyServerContract(contract) {
  const safe = contract.automatic_charge === false &&
    contract.automatic_final_balance_request === false &&
    contract.recurring_billing === false &&
    contract.operator_action_required === true;
  if (!safe) throw new Error("Final-balance authority did not return the required fail-closed operator contract.");
}

function renderMetrics(counts) {
  $("#readyCount").textContent = Number(counts.ready || 0);
  $("#blockedCount").textContent = Number(counts.blocked || 0);
  $("#requestedCount").textContent = Number(counts.requested || 0);
  $("#paidCount").textContent = Number(counts.paid || 0);
}

function applyFilters() {
  const query = String($("#searchInput").value || "").trim().toLowerCase();
  const status = String($("#statusFilter").value || "all");
  state.filtered = state.rows.filter((row) => {
    if (status !== "all" && row.readiness !== status) return false;
    if (!query) return true;
    const haystack = [row.booking_id, row.customer_name, row.customer_email, row.service_date, row.status, row.job_status, row.package_code, row.vehicle_size].join(" ").toLowerCase();
    return haystack.includes(query);
  });
  renderQueue();
}

function renderQueue() {
  const body = $("#queueBody");
  if (!state.filtered.length) {
    body.innerHTML = '<tr><td colspan="8" class="empty">No bookings match the current readiness filter.</td></tr>';
    return;
  }
  body.innerHTML = state.filtered.map((row) => {
    const reason = Array.isArray(row.reasons) ? row.reasons.join(" ") : "";
    const request = row.active_request || row.latest_request || null;
    const requestSummary = request ? `${request.status || "request"}${request.provider ? ` · ${request.provider}` : ""}` : "No tracked request";
    return `<tr data-booking-id="${escapeHtml(row.booking_id)}">
      <td><span class="badge ${escapeHtml(row.readiness)}">${escapeHtml(labelFor(row.readiness))}</span></td>
      <td><strong>${escapeHtml(row.service_date || "No date")}</strong><div class="small">${escapeHtml(row.booking_id)}</div></td>
      <td>${escapeHtml(row.customer_name || "Unnamed")}<div class="small">${escapeHtml(row.customer_email || "No email")}</div></td>
      <td>${escapeHtml(row.job_status || row.status || "—")}<div class="small">booking: ${escapeHtml(row.status || "—")}</div></td>
      <td>${escapeHtml(money(row.total_cents))}</td>
      <td><strong>${escapeHtml(money(row.calculated_due_cents))}</strong></td>
      <td>${escapeHtml(reason)}<div class="small">${escapeHtml(requestSummary)}</div></td>
      <td><div class="actions">${actionMarkup(row)}</div></td>
    </tr>`;
  }).join("");

  body.querySelectorAll("tr[data-booking-id]").forEach((rowNode) => {
    rowNode.addEventListener("click", (event) => {
      if (event.target.closest("button,a")) return;
      selectBooking(rowNode.dataset.bookingId);
    });
  });
  body.querySelectorAll("button[data-action]").forEach((button) => {
    button.addEventListener("click", () => handleAction(button.dataset.action, button.dataset.bookingId));
  });
}

function actionMarkup(row) {
  const bookingHref = `/admin-booking.html?booking_id=${encodeURIComponent(row.booking_id)}`;
  const parts = [`<button class="btn secondary" type="button" data-action="select" data-booking-id="${escapeHtml(row.booking_id)}">Review</button>`, `<a class="btn secondary" href="${bookingHref}">Booking</a>`];
  if (row.readiness === "ready") parts.push(`<button class="btn" type="button" data-action="create-request" data-booking-id="${escapeHtml(row.booking_id)}">Create request</button>`);
  if (row.readiness === "requested" && row.active_request?.id) parts.push(`<button class="btn" type="button" data-action="create-checkout" data-booking-id="${escapeHtml(row.booking_id)}">Create / refresh checkout</button>`);
  if (row.active_request?.checkout_url) parts.push(`<a class="btn secondary" href="${escapeHtml(row.active_request.checkout_url)}" target="_blank" rel="noopener">Open checkout</a>`);
  if (row.active_request?.payment_url) parts.push(`<a class="btn secondary" href="${escapeHtml(row.active_request.payment_url)}" target="_blank" rel="noopener">Open secure status</a>`);
  return parts.join("");
}

function selectBooking(bookingId) {
  state.selectedId = bookingId;
  const row = state.rows.find((item) => String(item.booking_id) === String(bookingId));
  if (!row) return;
  const request = row.active_request || row.latest_request || null;
  const reasons = Array.isArray(row.reasons) ? row.reasons : [];
  $("#selectedDetails").innerHTML = `<div class="details-grid">
    <div class="detail"><strong>Readiness</strong><span class="badge ${escapeHtml(row.readiness)}">${escapeHtml(labelFor(row.readiness))}</span><div class="small" style="margin-top:7px">${escapeHtml(reasons.join(" "))}</div></div>
    <div class="detail"><strong>Customer</strong>${escapeHtml(row.customer_name || "Unnamed")}<div class="small">${escapeHtml(row.customer_email || "No email")}</div></div>
    <div class="detail"><strong>Booking total</strong>${escapeHtml(money(row.total_cents))}<div class="small">Stored booking price_total_cents.</div></div>
    <div class="detail"><strong>Calculated due</strong>${escapeHtml(money(row.calculated_due_cents))}<div class="small">Tips are excluded from service balance.</div></div>
    <div class="detail"><strong>Finance components</strong>Deposit ${escapeHtml(money(row.finance?.deposit_cents))} · Final ${escapeHtml(money(row.finance?.final_payment_cents))} · Discount ${escapeHtml(money(row.finance?.discount_cents))} · Refund ${escapeHtml(money(row.finance?.refund_cents))} · Other ${escapeHtml(money(row.finance?.other_cents))}</div>
    <div class="detail"><strong>Tracked request</strong>${request ? `${escapeHtml(request.status || "open")} · ${escapeHtml(money(request.amount_cents))}` : "None"}<div class="small">${request?.provider_status ? escapeHtml(request.provider_status) : ""}</div></div>
  </div>
  <div class="actions" style="margin-top:14px">${actionMarkup(row)}</div>`;
  $("#selectedDetails").querySelectorAll("button[data-action]").forEach((button) => {
    button.addEventListener("click", () => handleAction(button.dataset.action, button.dataset.bookingId));
  });
}

async function handleAction(action, bookingId) {
  const row = state.rows.find((item) => String(item.booking_id) === String(bookingId));
  if (!row) return;
  if (action === "select") {
    selectBooking(bookingId);
    return;
  }
  if (action === "create-request") {
    await createRequest(row);
    return;
  }
  if (action === "create-checkout") {
    await createCheckout(row);
  }
}

async function createRequest(row) {
  if (row.readiness !== "ready" || !(Number(row.calculated_due_cents) > 0)) {
    setNotice("Request creation is blocked because this booking is not currently Ready.", "warn");
    return;
  }
  const confirmed = window.confirm(`Create a tracked final-balance request for ${money(row.calculated_due_cents)}? This does not charge the customer and does not notify them.`);
  if (!confirmed) return;
  setNotice("Creating the operator-approved request…");
  try {
    const data = await apiJson("/api/admin/final_balance_request_create", {
      method: "POST",
      body: JSON.stringify({
        booking_id: row.booking_id,
        customer_name: row.customer_name || "",
        customer_email: row.customer_email || "",
        amount_cents: row.calculated_due_cents,
        currency: "CAD",
        notes: "Build 317 operator-approved final balance request"
      })
    });
    setNotice(`Final-balance request created. No charge or customer notification was performed. Request ${data?.request?.id || "created"}.`, "ok");
    await loadReadiness();
    selectBooking(row.booking_id);
  } catch (err) {
    setNotice(err?.message || "Could not create final-balance request.", "bad");
  }
}

async function createCheckout(row) {
  const request = row.active_request;
  if (row.readiness !== "requested" || !request?.id) {
    setNotice("Hosted checkout creation requires an existing active final-balance request.", "warn");
    return;
  }
  const confirmed = window.confirm("Create or refresh the hosted checkout for this request? This does not charge the customer and does not notify them.");
  if (!confirmed) return;
  setNotice("Creating the operator-approved hosted checkout…");
  try {
    const data = await apiJson("/api/admin/final_balance_checkout_create", {
      method: "POST",
      body: JSON.stringify({ payment_request_id: request.id, notify_customer: false })
    });
    const provider = data.provider || "manual";
    setNotice(`Hosted checkout handoff prepared using ${provider}. No customer notification was sent.`, "ok");
    await loadReadiness();
    selectBooking(row.booking_id);
  } catch (err) {
    setNotice(err?.message || "Could not create hosted checkout.", "bad");
  }
}

function labelFor(readiness) {
  if (readiness === "paid") return "Paid / Closed";
  return readiness ? readiness.charAt(0).toUpperCase() + readiness.slice(1) : "Blocked";
}

$("#searchInput").addEventListener("input", applyFilters);
$("#statusFilter").addEventListener("change", applyFilters);
$("#refreshBtn").addEventListener("click", loadReadiness);

loadReadiness();
