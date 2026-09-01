// Build 285 — authenticated customer-history to current-booking rebook handoff.
// This layer carries only prior package/date evidence. It never carries old slot,
// vehicle size, price, add-ons, deposit or payment state into a new booking.
const normalizedPath = String(location.pathname || "/").replace(/\.html$/i, "").replace(/\/+$/, "") || "/";
const params = new URLSearchParams(location.search);
const DASHBOARD_API = "/api/client/dashboard";
const REJECTED_STATUS = /cancel|refund|failed|declin|void/i;

function localTodayIso() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function cleanPackage(value) {
  return String(value || "").trim().slice(0, 120);
}

function cleanDate(value) {
  const date = String(value || "").slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : "";
}

function isRepeatableBooking(row) {
  const packageCode = cleanPackage(row?.package_code);
  const serviceDate = cleanDate(row?.service_date);
  const status = `${row?.status || ""} ${row?.job_status || ""}`;
  return !!packageCode && !!serviceDate && serviceDate < localTodayIso() && !REJECTED_STATUS.test(status);
}

async function loadAuthenticatedDashboard() {
  try {
    const response = await fetch(DASHBOARD_API, { credentials: "include", cache: "no-store" });
    const data = await response.json().catch(() => null);
    if (!response.ok || data?.authenticated !== true || !Array.isArray(data.bookings)) return null;
    return data;
  } catch {
    return null;
  }
}

function rebookHref(row) {
  const query = new URLSearchParams({
    rebook_package: cleanPackage(row.package_code),
    rebook_date: cleanDate(row.service_date)
  });
  return `/book?${query.toString()}`;
}

function installAccountHistoryActions(data, attempt = 0) {
  const host = document.querySelector("#bookingHistory");
  if (!host) return;
  const cards = [...host.querySelectorAll(":scope > article.card")];
  if (!cards.length && data.bookings.length && attempt < 50) {
    setTimeout(() => installAccountHistoryActions(data, attempt + 1), 100);
    return;
  }

  cards.forEach((card, index) => {
    const row = data.bookings[index];
    if (!row || !isRepeatableBooking(row) || card.querySelector("[data-build285-rebook-action]")) return;
    const action = document.createElement("a");
    action.className = "btn small primary";
    action.dataset.build285RebookAction = "true";
    action.href = rebookHref(row);
    action.textContent = "Book this service again";
    const actions = document.createElement("p");
    actions.dataset.build285Rebook = "history";
    actions.appendChild(action);
    card.appendChild(actions);
  });
}

async function installAccountHistoryHandoff() {
  const data = await loadAuthenticatedDashboard();
  if (!data) return;
  installAccountHistoryActions(data);
}

function publishRebookEvent(payload = {}) {
  try {
    window.dispatchEvent(new CustomEvent("rd:analytics", {
      detail: { event: "booking_history_rebook_handoff", source: "customer_history", ...payload }
    }));
  } catch {}
}

function findCurrentPackageControl(packageCode) {
  return [...document.querySelectorAll("[data-package-suggest],[data-package]")].find((node) =>
    String(node.getAttribute("data-package-suggest") || node.getAttribute("data-package") || "") === packageCode
  ) || null;
}

function rebookContextAnchor() {
  return document.querySelector(".qb274__account") ||
    document.querySelector("[data-qb274-vehicle]") ||
    document.querySelector("#bookingStatus") ||
    document.querySelector("main .panel");
}

function showRebookContext({ packageCode = "", priorDate = "", tone = "ok", message = "" } = {}) {
  let panel = document.querySelector("[data-build285-rebook-context]");
  if (!panel) {
    panel = document.createElement("div");
    panel.dataset.build285RebookContext = "true";
    panel.className = "notice";
    const anchor = rebookContextAnchor();
    if (!anchor) return null;
    anchor.insertAdjacentElement("afterend", panel);
  }
  panel.className = tone === "bad" ? "notice bad" : tone === "warn" ? "notice warn" : "notice ok";
  if (tone === "ok") {
    panel.innerHTML = `<strong>Using your previous booking as a starting point</strong><div>${packageCode ? `Previous service: ${escapeText(packageCode)}${priorDate ? ` · ${escapeText(priorDate)}` : ""}. ` : ""}${escapeText(message || "Only the previous service choice is being reused. Current vehicle size, availability, add-ons, price, deposit and payment rules are recalculated from today's booking authority.")}</div>`;
  } else {
    panel.innerHTML = `<strong>Previous booking could not be reused automatically.</strong><div>${escapeText(message || "Choose a current service below.")}</div>`;
  }
  return panel;
}

function escapeText(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function waitForCurrentPackage(packageCode, callback, attempt = 0) {
  const control = findCurrentPackageControl(packageCode);
  if (control) return callback(control);
  if (attempt < 50) return setTimeout(() => waitForCurrentPackage(packageCode, callback, attempt + 1), 100);
  callback(null);
}

function optionallyPrefillSingleGarageVehicle(data, attempt = 0) {
  const vehicles = Array.isArray(data?.vehicles) ? data.vehicles : [];
  if (vehicles.length !== 1) return;
  const buttons = [...document.querySelectorAll("[data-garage-index]")];
  if (buttons.length === 1) {
    buttons[0].click();
    return;
  }
  if (attempt < 50) setTimeout(() => optionallyPrefillSingleGarageVehicle(data, attempt + 1), 100);
}

async function installBookHandoff() {
  const requestedPackage = cleanPackage(params.get("rebook_package"));
  const requestedDate = cleanDate(params.get("rebook_date"));
  if (!requestedPackage || !requestedDate) return;

  const data = await loadAuthenticatedDashboard();
  if (!data) {
    showRebookContext({ tone: "warn", message: "Sign in to verify the previous booking, or choose a current service below." });
    return;
  }

  const historyMatch = data.bookings.find((row) =>
    isRepeatableBooking(row) && cleanPackage(row.package_code) === requestedPackage && cleanDate(row.service_date) === requestedDate
  );
  if (!historyMatch) {
    showRebookContext({ tone: "warn", message: "That request does not match a repeatable booking in your authenticated history. Choose a current service below." });
    return;
  }

  waitForCurrentPackage(requestedPackage, (control) => {
    if (!control) {
      showRebookContext({ tone: "warn", message: "That previous service is no longer available to repeat. Choose a current service below; Rosie will not silently substitute another service." });
      return;
    }

    control.click();
    optionallyPrefillSingleGarageVehicle(data);
    const vehicleMessage = Array.isArray(data.vehicles) && data.vehicles.length > 1
      ? "Choose the correct saved Garage vehicle before continuing. Current vehicle size, availability, add-ons, price, deposit and payment rules are recalculated from today's booking authority."
      : "Only the previous service choice is being reused. Current vehicle size, availability, add-ons, price, deposit and payment rules are recalculated from today's booking authority.";
    showRebookContext({ packageCode: requestedPackage, priorDate: requestedDate, message: vehicleMessage });
    publishRebookEvent({ package_code: requestedPackage, prior_service_date: requestedDate, vehicle_count: Array.isArray(data.vehicles) ? data.vehicles.length : 0 });
  });
}

if (normalizedPath === "/my-account") installAccountHistoryHandoff();
if (normalizedPath === "/book") installBookHandoff();
