// Build 380 — booking recovery, refresh/back resilience, and customer-safe checkout retry.
// Session state stays in this browser tab only. Server pricing, availability, booking, and payment rules remain authoritative.

const DRAFT_KEY = "rd_booking_draft_v380";
const REQUEST_KEY = "rd_booking_request_v380";
const PAYMENT_KEY = "rd_booking_payment_v380";
const CANCEL_KEY = "rd_booking_cancel_v380";
const DRAFT_MAX_AGE_MS = 6 * 60 * 60 * 1000;

const SIMPLE_FIELDS = [
  "service_date", "service_area", "veh_year", "veh_make", "veh_model", "veh_plate", "veh_photo",
  "veh_body", "veh_category", "veh_color", "veh_mileage", "vehicle_size", "gift_code", "promo_code",
  "special_notes", "photo_estimate_links", "customer_name", "customer_email", "customer_phone",
  "address_line1", "city", "postal_code"
];

const CHECKBOX_FIELDS = [
  "ack_driveway", "ack_power_water", "ack_bylaw", "ack_cancellation", "need_mobile_water_power",
  "photo_estimate_requested"
];

function normalizedPath() {
  return String(location.pathname || "/").replace(/\.html$/i, "").replace(/\/+$/, "") || "/";
}

function safeSessionGet(key) {
  try { return sessionStorage.getItem(key); } catch { return null; }
}

function safeSessionSet(key, value) {
  try { sessionStorage.setItem(key, value); } catch {}
}

function safeSessionRemove(key) {
  try { sessionStorage.removeItem(key); } catch {}
}

function clearRecoveryState() {
  [DRAFT_KEY, REQUEST_KEY, PAYMENT_KEY, CANCEL_KEY].forEach(safeSessionRemove);
}

function parseJson(text, fallback = null) {
  try { return JSON.parse(text); } catch { return fallback; }
}

function requestId() {
  let value = safeSessionGet(REQUEST_KEY);
  if (value) return value;
  value = globalThis.crypto?.randomUUID?.() || `rd-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  safeSessionSet(REQUEST_KEY, value);
  return value;
}

function bookingIdFromAnyContext() {
  const own = new URLSearchParams(location.search).get("booking_id");
  if (own) return own;
  try {
    if (window.parent && window.parent !== window) {
      return new URLSearchParams(window.parent.location.search).get("booking_id") || "";
    }
  } catch {}
  return "";
}

function hasExplicitBookingPrefill() {
  const params = new URLSearchParams(location.search);
  return ["package", "size", "area", "date", "slot", "addons"].some((key) => params.has(key));
}

function todayIso() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function readDraft() {
  const draft = parseJson(safeSessionGet(DRAFT_KEY), null);
  if (!draft || typeof draft !== "object") return null;
  if (!Number.isFinite(Number(draft.saved_at)) || Date.now() - Number(draft.saved_at) > DRAFT_MAX_AGE_MS) {
    safeSessionRemove(DRAFT_KEY);
    return null;
  }
  return draft;
}

function selectedCode(selector, attr) {
  return document.querySelector(`${selector}.active`)?.getAttribute(attr) || "";
}

function captureDraft() {
  const fields = {};
  SIMPLE_FIELDS.forEach((id) => {
    const node = document.getElementById(id);
    if (node) fields[id] = node.value ?? "";
  });

  const checks = {};
  CHECKBOX_FIELDS.forEach((id) => {
    const node = document.getElementById(id);
    if (node) checks[id] = node.checked === true;
  });

  const mediaConsent = document.querySelector("input[name='media_consent_preference']:checked")?.value || "estimate_only";
  const conditionFlags = [...document.querySelectorAll("[data-condition-flag]:checked")]
    .map((node) => node.getAttribute("data-condition-flag"))
    .filter(Boolean);

  return {
    version: 380,
    saved_at: Date.now(),
    fields,
    checks,
    media_consent_preference: mediaConsent,
    condition_flags: conditionFlags,
    package_code: selectedCode("[data-package]", "data-package"),
    addon_codes: [...document.querySelectorAll("[data-addon].active")].map((node) => node.getAttribute("data-addon")).filter(Boolean),
    slot: selectedCode("[data-slot]", "data-slot"),
    current_step: Number(document.querySelector(".wizard-step:not([hidden])")?.dataset?.step || 1)
  };
}

function createNotice() {
  let box = document.getElementById("bookingRecoveryNotice");
  if (box) return box;
  const host = document.querySelector("main.container") || document.body;
  box = document.createElement("div");
  box.id = "bookingRecoveryNotice";
  box.className = "notice warn";
  box.style.display = "none";
  box.style.marginBottom = "14px";
  box.innerHTML = `<strong data-recovery-title>Booking recovery</strong><div data-recovery-copy class="mini" style="margin-top:4px"></div><div style="margin-top:8px"><button type="button" class="btn ghost small" data-recovery-discard>Discard saved booking</button></div>`;
  host.prepend(box);
  box.querySelector("[data-recovery-discard]")?.addEventListener("click", () => {
    clearRecoveryState();
    const target = "/book?fresh=1";
    try {
      if (window.top && window.top !== window) window.top.location.href = target;
      else location.href = target;
    } catch {
      location.href = target;
    }
  });
  return box;
}

function showNotice(title, message, tone = "warn") {
  const box = createNotice();
  box.style.display = "block";
  box.className = `notice ${tone}`.trim();
  const titleNode = box.querySelector("[data-recovery-title]");
  const copyNode = box.querySelector("[data-recovery-copy]");
  if (titleNode) titleNode.textContent = title;
  if (copyNode) copyNode.textContent = message;
}

function setNodeValue(node, value) {
  if (!node || value == null) return;
  const next = String(value);
  if (node.value === next) return;
  node.value = next;
  node.dispatchEvent(new Event("input", { bubbles: true }));
  node.dispatchEvent(new Event("change", { bubbles: true }));
}

function restoreSimpleDraft(draft) {
  Object.entries(draft.fields || {}).forEach(([id, value]) => {
    const node = document.getElementById(id);
    if (!node) return;
    if (id === "service_date" && value && String(value) < todayIso()) return;
    setNodeValue(node, value);
  });

  Object.entries(draft.checks || {}).forEach(([id, value]) => {
    const node = document.getElementById(id);
    if (!node || node.checked === Boolean(value)) return;
    node.checked = Boolean(value);
    node.dispatchEvent(new Event("change", { bubbles: true }));
  });

  const consent = document.querySelector(`input[name='media_consent_preference'][value='${CSS.escape(String(draft.media_consent_preference || "estimate_only"))}']`);
  if (consent && !consent.checked) {
    consent.checked = true;
    consent.dispatchEvent(new Event("change", { bubbles: true }));
  }

  const wantedFlags = new Set(Array.isArray(draft.condition_flags) ? draft.condition_flags : []);
  document.querySelectorAll("[data-condition-flag]").forEach((node) => {
    const wanted = wantedFlags.has(node.getAttribute("data-condition-flag"));
    if (node.checked !== wanted) {
      node.checked = wanted;
      node.dispatchEvent(new Event("change", { bubbles: true }));
    }
  });
}

function restoreDynamicDraft(draft) {
  let resolved = true;

  if (draft.package_code) {
    const button = document.querySelector(`[data-package='${CSS.escape(String(draft.package_code))}']`);
    if (button && !button.classList.contains("active")) {
      button.click();
      resolved = false;
    } else if (!button && document.querySelector("#packageCards")?.children?.length) {
      // The saved package no longer exists; do not keep waiting for it.
    } else if (!button) {
      resolved = false;
    }
  }

  const addonCodes = Array.isArray(draft.addon_codes) ? draft.addon_codes : [];
  addonCodes.forEach((code) => {
    const button = document.querySelector(`[data-addon='${CSS.escape(String(code))}']`);
    if (button && !button.classList.contains("active") && !button.hasAttribute("data-disabled")) {
      button.click();
      resolved = false;
    } else if (!button && !document.querySelector("#addonsBox")?.children?.length) {
      resolved = false;
    }
  });

  if (draft.slot) {
    const button = document.querySelector(`[data-slot='${CSS.escape(String(draft.slot))}']`);
    if (button && !button.disabled && !button.classList.contains("active")) {
      button.click();
      resolved = false;
    } else if (!button || button.disabled) {
      resolved = false;
    }
  }

  return resolved;
}

function installDraftPersistence() {
  let restoring = true;
  let saveQueued = false;
  const save = () => {
    if (restoring || saveQueued) return;
    saveQueued = true;
    queueMicrotask(() => {
      saveQueued = false;
      safeSessionSet(DRAFT_KEY, JSON.stringify(captureDraft()));
    });
  };

  document.addEventListener("input", save, true);
  document.addEventListener("change", save, true);
  document.addEventListener("click", (event) => {
    if (event.target?.closest?.("[data-package],[data-addon],[data-slot],[data-step-nav],[data-inline-next-step],#prevStepBtn,#nextStepBtn")) save();
  }, true);
  window.addEventListener("pagehide", () => {
    if (!restoring) safeSessionSet(DRAFT_KEY, JSON.stringify(captureDraft()));
  });

  const draft = readDraft();
  if (!draft || hasExplicitBookingPrefill()) {
    restoring = false;
    if (draft && hasExplicitBookingPrefill()) {
      showNotice("Saved booking available", "This link contains explicit booking choices, so they were kept instead of overwriting them with the saved session.", "ok");
    }
    return;
  }

  restoreSimpleDraft(draft);
  const observer = new MutationObserver(() => {
    if (restoreDynamicDraft(draft)) finishRestore();
  });
  observer.observe(document.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ["class", "disabled"] });

  let finished = false;
  function finishRestore() {
    if (finished) return;
    finished = true;
    observer.disconnect();
    restoring = false;
    safeSessionSet(DRAFT_KEY, JSON.stringify(captureDraft()));
    const cancelledId = bookingIdFromAnyContext() || safeSessionGet(CANCEL_KEY);
    if (cancelledId) {
      showNotice("Payment not completed", "Your booking details were restored. You can review availability and press Book and pay deposit again; the server will resume the same recent booking hold when it is safe to do so.", "warn");
    } else {
      showNotice("Booking restored", "Your in-progress booking details were restored after the page interruption. Please review the date and availability before continuing.", "ok");
    }
  }

  restoreDynamicDraft(draft);
  setTimeout(finishRestore, 8000);
}

function responseWithJson(response, data) {
  const headers = new Headers(response.headers);
  headers.set("content-type", "application/json; charset=utf-8");
  headers.delete("content-length");
  return new Response(JSON.stringify(data), { status: response.status, statusText: response.statusText, headers });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function installCheckoutRecoveryFetch() {
  if (window.__rdBookingRecoveryFetchInstalled) return;
  window.__rdBookingRecoveryFetchInstalled = true;
  const originalFetch = window.fetch.bind(window);

  window.fetch = async function bookingRecoveryFetch(input, init = {}) {
    const rawUrl = typeof input === "string" ? input : input?.url || "";
    let url;
    try { url = new URL(rawUrl, location.href); } catch { return originalFetch(input, init); }
    const method = String(init?.method || (typeof input !== "string" ? input?.method : "GET") || "GET").toUpperCase();
    if (url.origin !== location.origin || url.pathname !== "/api/checkout" || method !== "POST") {
      return originalFetch(input, init);
    }

    let body = parseJson(init?.body, null);
    if (!body || typeof body !== "object") return originalFetch(input, init);
    body = { ...body, client_request_id: requestId() };
    const recoveryInit = { ...init, body: JSON.stringify(body) };

    let response;
    try {
      response = await originalFetch("/api/checkout_recovery", recoveryInit);
    } catch (firstError) {
      await sleep(500);
      try {
        response = await originalFetch("/api/checkout_recovery", recoveryInit);
      } catch {
        throw firstError;
      }
    }

    let data = await response.clone().json().catch(() => null);
    if (response.status === 409 && data?.recovery_state === "pending_session_attach") {
      await sleep(Math.min(1200, Math.max(400, Number(data.retry_after_seconds || 1) * 1000)));
      response = await originalFetch("/api/checkout_recovery", recoveryInit);
      data = await response.clone().json().catch(() => null);
    }

    if (response.status === 409) {
      safeSessionSet(CANCEL_KEY, String(data?.booking_id || bookingIdFromAnyContext() || "conflict"));
      window.dispatchEvent(new CustomEvent("rd:booking-checkout-conflict", { detail: data || {} }));
      return response;
    }

    if (response.ok && data?.ok) {
      const normalized = { ...data };
      if (!normalized.checkout_url && normalized.approve_url) normalized.checkout_url = normalized.approve_url;
      if (!normalized.checkout_url && normalized.mode === "gift_only_confirm" && normalized.booking_id) {
        normalized.checkout_url = `/complete?provider=gift&booking_id=${encodeURIComponent(normalized.booking_id)}`;
      }
      if (normalized.booking_id) {
        safeSessionSet(PAYMENT_KEY, JSON.stringify({ booking_id: normalized.booking_id, started_at: Date.now(), mode: normalized.mode || "checkout", recovered: normalized.recovered === true }));
        safeSessionSet(CANCEL_KEY, String(normalized.booking_id));
      }
      if (normalized.checkout_url) return responseWithJson(response, normalized);
    }

    return response;
  };
}

function installConflictUX() {
  window.addEventListener("rd:booking-checkout-conflict", (event) => {
    const detail = event.detail || {};
    const message = detail.recovery_state === "stale_availability"
      ? "That appointment time changed while you were booking. Availability is being refreshed; choose another open time and retry."
      : detail.recovery_state === "payment_session_expired"
        ? "Your earlier payment page is no longer open. No duplicate booking was created. Review the refreshed availability before retrying."
        : "We preserved your booking details and did not create a duplicate. Review availability, then retry safely.";
    showNotice("Booking needs review", message, "warn");

    const stepOne = document.querySelector("[data-step-nav='1']");
    if (stepOne && !stepOne.disabled) stepOne.click();
    const dateField = document.getElementById("service_date");
    if (dateField?.value) dateField.dispatchEvent(new Event("change", { bubbles: true }));
  });
}

function markCancelReturn() {
  const bookingId = bookingIdFromAnyContext();
  if (bookingId) safeSessionSet(CANCEL_KEY, bookingId);
}

export function wireBookingRecovery() {
  const path = normalizedPath();
  const params = new URLSearchParams(location.search);

  if (params.get("fresh") === "1") clearRecoveryState();

  if (["/complete", "/booking-confirmed"].includes(path)) {
    clearRecoveryState();
    return;
  }

  markCancelReturn();

  if (path === "/book") {
    if (bookingIdFromAnyContext()) {
      showNotice("Payment return detected", "Your in-progress booking is still available in this browser tab. The planner will restore it and safely resume the same recent booking hold when possible.", "warn");
    }
    return;
  }

  if (path !== "/booking-planner") return;

  installCheckoutRecoveryFetch();
  installConflictUX();
  installDraftPersistence();
}
