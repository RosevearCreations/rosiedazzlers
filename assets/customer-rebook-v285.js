// Build 285 retained authority + Builds 356–357 successor compatibility.
// This layer carries only prior package/date evidence. It never carries old slot,
// vehicle size, price, add-ons, deposit, payment state, customer identity or booking state.
// Build 357 also requires the historical service to resolve against the current public pricing catalog before selection.
const hasLocation = typeof location !== "undefined";
const normalizedPath = hasLocation ? (String(location.pathname || "/").replace(/\.html$/i, "").replace(/\/+$/, "") || "/") : "/";
const params = new URLSearchParams(hasLocation ? location.search : "");
const DASHBOARD_API = "/api/client/dashboard";
const CURRENT_CATALOG_API = "/api/pricing_catalog_public";
const REJECTED_STATUS = /cancel|refund|failed|declin|void/i;
const RETIRED_CATALOG_STATUS = /retired|inactive|disabled|archived|unavailable/i;

function localTodayIso() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function cleanPackage(value) {
  return String(value || "").trim().slice(0, 120);
}

export function cleanDate(value) {
  const date = String(value || "").slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : "";
}

export function isRepeatableBooking(row) {
  const packageCode = cleanPackage(row?.package_code);
  const serviceDate = cleanDate(row?.service_date);
  const status = `${row?.status || ""} ${row?.job_status || ""}`;
  return !!packageCode && !!serviceDate && serviceDate < localTodayIso() && !REJECTED_STATUS.test(status);
}

export function isCurrentCatalogPackageBookable(pkg) {
  if (!pkg || !cleanPackage(pkg.code)) return false;
  if (pkg.active === false || pkg.enabled === false || pkg.bookable === false) return false;
  const lifecycle = `${pkg.status || ""} ${pkg.lifecycle_status || ""}`;
  if (RETIRED_CATALOG_STATUS.test(lifecycle)) return false;
  const prices = pkg.prices_cad && typeof pkg.prices_cad === "object" ? pkg.prices_cad : {};
  return ["small", "mid", "oversize"].some((size) => {
    const value = Number(prices[size]);
    return Number.isFinite(value) && value > 0;
  });
}

export function resolveCurrentCatalogPackage(catalog, packageCode) {
  const requestedCode = cleanPackage(packageCode);
  if (!requestedCode || !catalog || !Array.isArray(catalog.packages)) return null;
  const current = catalog.packages.find((pkg) => cleanPackage(pkg?.code) === requestedCode) || null;
  return isCurrentCatalogPackageBookable(current) ? current : null;
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

async function loadCurrentPricingCatalog() {
  try {
    const response = await fetch(CURRENT_CATALOG_API, { credentials: "same-origin", cache: "no-store" });
    const data = await response.json().catch(() => null);
    if (!response.ok || data?.ok !== true || !Array.isArray(data.packages)) return null;
    return data;
  } catch {
    return null;
  }
}

export function rebookHref(row) {
  const packageCode = cleanPackage(row?.package_code);
  const serviceDate = cleanDate(row?.service_date);
  if (!packageCode || !serviceDate) return "";
  const query = new URLSearchParams({
    rebook_package: packageCode,
    rebook_date: serviceDate
  });
  return `/book?${query.toString()}`;
}

function appendRebookAction(card, row, source = "history") {
  if (!card || !row || !isRepeatableBooking(row) || card.querySelector("[data-build285-rebook-action]")) return;
  const href = rebookHref(row);
  if (!href) return;
  const action = document.createElement("a");
  action.className = "btn small primary";
  action.dataset.build285RebookAction = "true";
  action.setAttribute("data-build356-safe-rebook-action", "true");
  action.href = href;
  action.textContent = "Book this service again";
  const actions = document.createElement("p");
  actions.dataset.build285Rebook = source;
  actions.dataset.build356SafeRebook = source;
  actions.appendChild(action);
  card.appendChild(actions);
}

function installAccountHistoryActions(data, attempt = 0) {
  const host = document.querySelector("#bookingHistory");
  if (!host) return;

  const serviceRows = Array.isArray(data?.service_history) ? data.service_history : [];
  const completedCards = [...host.querySelectorAll("[data-build355-completed-service]")];
  const expectsCanonicalHistory = !!document.querySelector('script[src*="my-account-v355.js"]');

  if (expectsCanonicalHistory && serviceRows.length && !completedCards.length && attempt < 50) {
    setTimeout(() => installAccountHistoryActions(data, attempt + 1), 100);
    return;
  }

  if (completedCards.length) {
    completedCards.forEach((card, index) => appendRebookAction(card, serviceRows[index], "service-history"));
    return;
  }

  const cards = [...host.querySelectorAll(":scope > article.card")];
  if (!cards.length && data.bookings.length && attempt < 50) {
    setTimeout(() => installAccountHistoryActions(data, attempt + 1), 100);
    return;
  }
  cards.forEach((card, index) => appendRebookAction(card, data.bookings[index], "history"));
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
  return [...document.querySelectorAll("[data-choose-package],[data-package-suggest],[data-package]")].find((node) =>
    String(node.getAttribute("data-choose-package") || node.getAttribute("data-package-suggest") || node.getAttribute("data-package") || "") === packageCode
  ) || null;
}

function rebookContextAnchor() {
  return document.querySelector(".qb274__account") ||
    document.querySelector("[data-qb274-vehicle]") ||
    document.querySelector("#bookingStatus") ||
    document.querySelector("main .panel");
}

function showRebookContext({ packageCode = "", packageName = "", priorDate = "", tone = "ok", message = "" } = {}) {
  let panel = document.querySelector("[data-build285-rebook-context]");
  if (!panel) {
    panel = document.createElement("div");
    panel.dataset.build285RebookContext = "true";
    panel.dataset.build356SafeRebookContext = "true";
    panel.className = "notice";
    const anchor = rebookContextAnchor();
    if (!anchor) return null;
    anchor.insertAdjacentElement("afterend", panel);
  }
  panel.className = tone === "bad" ? "notice bad" : tone === "warn" ? "notice warn" : "notice ok";
  if (tone === "ok") {
    panel.setAttribute("data-build357-current-catalog-verified", "true");
    const serviceLabel = packageName || packageCode;
    panel.innerHTML = `<strong>Using your previous booking as a starting point</strong><div>${serviceLabel ? `Current service: ${escapeText(serviceLabel)}${priorDate ? ` · previously booked ${escapeText(priorDate)}` : ""}. ` : ""}${escapeText(message || "The service was verified against the current catalog. Current vehicle size, availability, add-ons, price, deposit and payment rules are recalculated from today's booking authority.")}</div>`;
  } else {
    panel.removeAttribute("data-build357-current-catalog-verified");
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

  const currentCatalog = await loadCurrentPricingCatalog();
  if (!currentCatalog) {
    showRebookContext({ tone: "warn", message: "The current service catalog and pricing could not be verified. Choose a current service below instead of reusing historical commercial terms." });
    return;
  }

  const currentPackage = resolveCurrentCatalogPackage(currentCatalog, requestedPackage);
  if (!currentPackage) {
    showRebookContext({ tone: "warn", message: "That previous service is retired, unavailable, or no longer has current bookable pricing. Choose a current service below; Rosie will not silently substitute another service." });
    return;
  }

  waitForCurrentPackage(requestedPackage, (control) => {
    if (!control) {
      showRebookContext({ tone: "warn", message: "The current catalog recognizes the service, but the live booking control is not available. Choose a current service below; Rosie will not silently substitute another service." });
      return;
    }

    control.click();
    optionallyPrefillSingleGarageVehicle(data);
    const vehicleMessage = Array.isArray(data.vehicles) && data.vehicles.length > 1
      ? "The service was verified against the current catalog. Choose the correct saved Garage vehicle before continuing. Current vehicle size, availability, add-ons, price, deposit and payment rules are recalculated from today's booking authority."
      : "The service was verified against the current catalog. Only the service choice is being reused. Current vehicle size, availability, add-ons, price, deposit and payment rules are recalculated from today's booking authority.";
    showRebookContext({ packageCode: requestedPackage, packageName: String(currentPackage.name || "").trim(), priorDate: requestedDate, message: vehicleMessage });
    publishRebookEvent({ package_code: requestedPackage, prior_service_date: requestedDate, vehicle_count: Array.isArray(data.vehicles) ? data.vehicles.length : 0, current_catalog_verified: true });
  });
}

if (normalizedPath === "/my-account") installAccountHistoryHandoff();
if (normalizedPath === "/book") installBookHandoff();
