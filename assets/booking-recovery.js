// Build 380 — booking recovery, refresh/back resilience, and customer-safe checkout retry.
// Session state stays in this browser tab only. Server pricing, availability, booking, and payment rules remain authoritative.

import { sanitizedBookingChoices630, parseBookingChoices630, BOOKING_DRAFT_FIELDS_630 } from "./booking-draft-policy-v630.js";

const LEGACY_DRAFT_KEY = "rd_booking_draft_v380";
const DRAFT_KEY = "rd_booking_draft_v630";
const REQUEST_KEY = "rd_booking_request_v380";
const PAYMENT_KEY = "rd_booking_payment_v380";
const CANCEL_KEY = "rd_booking_cancel_v380";
// Only anonymous package preferences are persisted. Never store PII, VIN/plate,
// date/slot, payment details, prices, gift codes, consent or acknowledgements.
const SIMPLE_FIELDS = BOOKING_DRAFT_FIELDS_630;

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
  [DRAFT_KEY, LEGACY_DRAFT_KEY, REQUEST_KEY, PAYMENT_KEY, CANCEL_KEY].forEach(safeSessionRemove);
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
  const existing=safeSessionGet(DRAFT_KEY);
  const draft=parseBookingChoices630(existing);
  if(existing && !draft)safeSessionRemove(DRAFT_KEY);
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
  return sanitizedBookingChoices630({
    saved_at:Date.now(),fields,
    package_code:selectedCode("[data-package]","data-package"),
    addon_codes:[...document.querySelectorAll("[data-addon].active")]
      .map(node=>node.getAttribute("data-addon")).filter(Boolean)
  });
}

function createNotice() {
  let box = document.getElementById("bookingRecoveryNotice");
  if (box) return box;
  const host = document.querySelector("main.container") || document.body;
  box = document.createElement("div");
  box.id = "bookingRecoveryNotice";
  box.className = "notice warn";
  box.setAttribute("role","region");
  box.setAttribute("aria-label","Saved booking choices");
  box.style.display = "none";
  box.style.marginBottom = "14px";
  box.innerHTML = `<strong data-recovery-title>Booking recovery</strong><div data-recovery-copy class="mini" style="margin-top:4px"></div><div style="margin-top:8px"><button type="button" class="btn primary small" data-recovery-continue hidden>Continue saved choices</button> <button type="button" class="btn ghost small" data-recovery-discard>Discard saved choices</button></div>`;
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
  // Only anonymous fields. Never restore a date, time, approvals or payment state.
  for (const id of SIMPLE_FIELDS) {
    const node = document.getElementById(id);
    const value = draft.fields?.[id];
    if (id==="service_area" && value && ![...document.querySelectorAll("#service_area_options option")].some(o=>o.value.toLowerCase()===value.toLowerCase()))continue;
    if (node && typeof value==="string")setNodeValue(node,value);
  }
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
    if (button && !button.classList.contains("active") && !button.hasAttribute("data-disabled") && !button.querySelector(".tag.warn")) {
      button.click();
      resolved = false;
    } else if (!button && !document.querySelector("#addonsBox")?.children?.length) {
      resolved = false;
    }
  });

  // Build 630: intentionally do not restore a date or slot. Availability must be fetched fresh.

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
      if (!restoring) safeSessionSet(DRAFT_KEY, JSON.stringify(captureDraft()));
    });
  };
  document.addEventListener("input", save, true);
  document.addEventListener("change", save, true);
  document.addEventListener("click", event => {
    if(event.target?.closest?.("[data-package],[data-addon],[data-slot],[data-step-nav],[data-inline-next-step],#prevStepBtn,#nextStepBtn"))save();
  },true);
  window.addEventListener("pagehide",()=>{
    if(!restoring)safeSessionSet(DRAFT_KEY,JSON.stringify(captureDraft()));
  });
  const draft=readDraft();
  if (!draft || hasExplicitBookingPrefill()) {
    restoring=false;
    if(draft && hasExplicitBookingPrefill()){
      // An explicitly shared booking URL must win; never overwrite its selections.
      showNotice("Saved choices not applied","This link specified new booking choices. They take priority. You can discard the older choices.", "ok");
    }
    return;
  }
  // Deliberate user action required; no automatic restoration of stale state.
  showNotice("Continue your package choices?",
    "Only anonymous package, add-on, size and service-town choices were kept in this browser tab. Dates, slots, prices, contact details and payment information were not saved. Choose Continue to recheck everything.", "ok");
  const box=createNotice();
  const resume=box.querySelector("[data-recovery-continue]");
  if(resume)resume.hidden=false;
  resume?.addEventListener("click",()=>{
    resume.disabled=true;
    resume.hidden=true;
    // The canonical planner has already loaded its live catalog and availability.
    restoreSimpleDraft(draft);
    const observer=new MutationObserver(()=>{if(restoreDynamicDraft(draft))finish();});
    let finished=false;
    const finish=()=>{
      if(finished)return;
      finished=true;
      observer.disconnect();
      restoring=false;
      safeSessionSet(DRAFT_KEY,JSON.stringify(captureDraft()));
      showNotice("Choices restored — please review",
        "Your package choices have been reapplied where still offered. Choose a new available date and slot; all prices, add-on rules and availability are checked again before payment.", "ok");
    };
    observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:["class","disabled"]});
    restoreDynamicDraft(draft);
    // Do not wait indefinitely if a service/add-on has been removed from catalog.
    setTimeout(finish,4000);
  },{once:true});
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

  // Purge pre-630 drafts that may contain customer name, address, plate and other private data.
  safeSessionRemove(LEGACY_DRAFT_KEY);
  if (params.get("fresh") === "1") clearRecoveryState();

  if (["/complete", "/booking-confirmed"].includes(path)) {
    clearRecoveryState();
    return;
  }

  markCancelReturn();

  if (path === "/book") {
    if (bookingIdFromAnyContext()) {
      showNotice("Payment return detected", "Please review your booking and current availability in the planner. No previous appointment slot is assumed available.", "warn");
    } else if(readDraft()) {
      showNotice("Saved package choices", "A small anonymous draft is available in your booking planner below. Continue or discard it there; prices and dates will be checked again.", "ok");
    }
    return;
  }

  if (path !== "/booking-planner") return;

  installCheckoutRecoveryFetch();
  installConflictUX();
  installDraftPersistence();
}
