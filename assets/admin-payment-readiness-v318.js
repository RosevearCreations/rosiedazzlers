const $ = (selector) => document.querySelector(selector);

function setNotice(message, kind = "") {
  const node = $("#pageNotice");
  node.className = `notice${kind ? ` ${kind}` : ""}`;
  node.textContent = message;
}

async function apiJson(url) {
  const response = await fetch(url, { credentials: "include", headers: { Accept: "application/json" } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data?.ok === false) throw new Error(data?.error || `Request failed (${response.status}).`);
  return data;
}

function badge(provider) {
  if (provider.provider === "stripe") {
    if (provider.mode === "test") return '<span class="badge ok">Test ready</span>';
    if (provider.mode === "live") return '<span class="badge bad">Development blocked</span>';
    return '<span class="badge warn">Manual only</span>';
  }
  if (provider.provider === "paypal") return '<span class="badge warn">Not integrated</span>';
  return '<span class="badge ok">Available</span>';
}

function yesNo(value) { return value ? "Yes" : "No"; }

function renderProvider(prefix, provider) {
  $(`#${prefix}Status`).innerHTML = `${badge(provider)} <span>${provider.status || "unknown"}</span>`;
  $(`#${prefix}Meta`).innerHTML = `
    <div><strong>Integration</strong>${yesNo(provider.integration_available)}</div>
    <div><strong>Configured</strong>${yesNo(provider.configured)}</div>
    <div><strong>Mode</strong>${provider.mode || "unknown"}</div>
    <div><strong>Test acceptance</strong>${yesNo(provider.test_acceptance_ready)}</div>
    <div><strong>Hosted checkout</strong>${yesNo(provider.hosted_checkout_supported)}</div>
    <div><strong>Automatic charge</strong>${yesNo(provider.automatic_charge)}</div>`;
}

function renderList(selector, items, emptyText) {
  const node = $(selector);
  const rows = Array.isArray(items) ? items.filter(Boolean) : [];
  node.innerHTML = rows.length ? rows.map((item) => `<li>${escapeHtml(item)}</li>`).join("") : `<li>${escapeHtml(emptyText)}</li>`;
}

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

function verifyContract(contract) {
  const safe = contract.read_only === true &&
    contract.secret_values_exposed === false &&
    contract.automatic_charge === false &&
    contract.automatic_checkout_creation === false &&
    contract.automatic_customer_notification === false &&
    contract.recurring_billing === false &&
    contract.operator_action_required === true;
  if (!safe) throw new Error("Payment-provider readiness did not return the required fail-closed contract.");
}

async function loadReadiness() {
  setNotice("Loading payment-provider readiness…");
  $("#refreshBtn").disabled = true;
  try {
    const data = await apiJson("/api/admin/payment_provider_readiness");
    verifyContract(data.contract || {});
    renderProvider("stripe", data.providers?.stripe || {});
    renderProvider("paypal", data.providers?.paypal || {});
    renderProvider("manual", data.providers?.manual || {});
    renderList("#blockerList", data.blockers, "No Development payment blockers detected.");
    renderList("#warningList", data.warnings, "No provider warnings detected.");

    const development = $("#developmentStatus");
    if (data.development_status === "blocked") {
      development.className = "notice bad";
      development.textContent = "BLOCKED — Development provider acceptance must not proceed until the listed blocker is corrected.";
      setNotice("Provider readiness loaded with a Development blocker.", "bad");
    } else if (data.development_status === "test_ready") {
      development.className = "notice ok";
      development.textContent = "TEST READY — Stripe test credentials are present; actual test transactions still require explicit operator action in the existing payment workflow.";
      setNotice("Payment-provider readiness loaded. Stripe is in test mode.", "ok");
    } else {
      development.className = "notice warn";
      development.textContent = "MANUAL ONLY — Development remains fail-closed to provider charging; use manual payment handoff until test credentials/integrations are available.";
      setNotice("Payment-provider readiness loaded with manual fallback only.", "warn");
    }
  } catch (err) {
    setNotice(err?.message || "Could not load payment-provider readiness.", "bad");
    $("#developmentStatus").className = "notice bad";
    $("#developmentStatus").textContent = "BLOCKED — readiness could not be verified.";
  } finally {
    $("#refreshBtn").disabled = false;
  }
}

$("#refreshBtn").addEventListener("click", loadReadiness);
loadReadiness();
