// Build 217 — secure, revocable public links for final-balance payment requests.
// The browser receives only a random opaque token. Supabase stores only its SHA-256 hash.

const DEFAULT_LINK_DAYS = 14;
const MAX_LINK_DAYS = 90;

export function siteOrigin(request, env) {
  const configured = String(env?.PUBLIC_SITE_ORIGIN || env?.SITE_URL || env?.PUBLIC_BASE_URL || "").trim();
  if (configured) return configured.replace(/\/$/, "");
  return new URL(request.url).origin;
}

export function newOpaqueToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function hashOpaqueToken(token) {
  const data = new TextEncoder().encode(String(token || ""));
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function equalHash(a, b) {
  const left = String(a || "");
  const right = String(b || "");
  if (!left || !right || left.length !== right.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i += 1) diff |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return diff === 0;
}

export function paymentPageUrl(origin, requestId, token) {
  const url = new URL("/final-balance-payment.html", origin);
  url.searchParams.set("request_id", String(requestId || ""));
  url.searchParams.set("token", String(token || ""));
  return url.toString();
}

export function tokenFromPaymentUrl(value) {
  try { return new URL(String(value || "")).searchParams.get("token") || ""; }
  catch { return ""; }
}

export function safeExpiry(raw, { now = new Date(), fallbackDays = DEFAULT_LINK_DAYS } = {}) {
  const min = new Date(now.getTime() + 5 * 60 * 1000);
  const max = new Date(now.getTime() + MAX_LINK_DAYS * 24 * 60 * 60 * 1000);
  const candidate = raw ? new Date(raw) : new Date(now.getTime() + fallbackDays * 24 * 60 * 60 * 1000);
  if (Number.isNaN(candidate.getTime())) return { ok:false, error:"Expiry must be a valid date and time." };
  if (candidate < min) return { ok:false, error:"Expiry must be at least five minutes in the future." };
  if (candidate > max) return { ok:false, error:`Expiry cannot be more than ${MAX_LINK_DAYS} days from now.` };
  return { ok:true, value:candidate.toISOString() };
}

export function statusKind(row, now = new Date()) {
  const status = String(row?.status || "").toLowerCase();
  if (row?.paid_at || /paid|succeeded|settled|complete/.test(status)) return "paid";
  if (row?.cancelled_at || /cancel/.test(status)) return "cancelled";
  if (row?.expires_at && new Date(row.expires_at).getTime() <= now.getTime()) return "expired";
  return "open";
}

export function publicPaymentView(row, now = new Date()) {
  const state = statusKind(row, now);
  return {
    id: row?.id || null,
    state,
    status: String(row?.status || "open"),
    amount_cents: Number(row?.amount_cents || 0),
    currency: String(row?.currency || "CAD").toUpperCase(),
    checkout_url: state === "open" ? safeExternalUrl(row?.checkout_url) : null,
    expires_at: row?.expires_at || null,
    paid_at: row?.paid_at || null,
    provider_status: safeText(row?.provider_status),
    created_at: row?.created_at || null
  };
}

export function safeExternalUrl(value) {
  try {
    const parsed = new URL(String(value || ""));
    return parsed.protocol === "https:" ? parsed.toString() : null;
  } catch { return null; }
}

function safeText(value) { return String(value || "").trim().slice(0, 180) || null; }
function safeNote(value) { return String(value || "").replace(/[\r\n]+/g, " ").trim().slice(0, 280) || null; }
