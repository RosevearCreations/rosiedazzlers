// Build 270 - server-only Web Push subscription persistence helpers.
import { serviceHeaders } from "./staff-auth.js";

const MAX_ENDPOINT_LENGTH = 4096;
const MAX_KEY_LENGTH = 512;

export function normalizeBrowserPushSubscription(input) {
  const source = input && typeof input === "object" ? input : {};
  const endpoint = cleanText(source.endpoint, MAX_ENDPOINT_LENGTH);
  const keys = source.keys && typeof source.keys === "object" ? source.keys : {};
  const p256dh = cleanText(keys.p256dh, MAX_KEY_LENGTH);
  const authSecret = cleanText(keys.auth, MAX_KEY_LENGTH);
  if (!endpoint || !p256dh || !authSecret) {
    throw new Error("A complete browser push subscription is required.");
  }
  let url;
  try { url = new URL(endpoint); } catch { throw new Error("Push subscription endpoint is invalid."); }
  if (url.protocol !== "https:") throw new Error("Push subscription endpoint must use HTTPS.");
  const expirationTime = Number(source.expirationTime);
  return {
    endpoint,
    p256dh,
    auth_secret: authSecret,
    expires_at: Number.isFinite(expirationTime) && expirationTime > 0 ? new Date(expirationTime).toISOString() : null
  };
}

export function cleanPushMetadata(body, request) {
  const preferences = body?.event_preferences && typeof body.event_preferences === "object" && !Array.isArray(body.event_preferences)
    ? Object.fromEntries(Object.entries(body.event_preferences).filter(([key,value]) => /^[a-z0-9_.-]{1,80}$/i.test(key) && typeof value === "boolean"))
    : {};
  return {
    user_agent: cleanText(request.headers.get("user-agent"), 1000),
    platform: cleanText(body?.platform, 120),
    timezone: cleanTimezone(body?.timezone),
    event_preferences: preferences
  };
}

export async function saveStaffPushSubscription({ env, actor, subscription, metadata }) {
  const existing = await loadSubscriptionByEndpoint(env, subscription.endpoint);
  if (existing && (existing.p256dh !== subscription.p256dh || existing.auth_secret !== subscription.auth_secret)) {
    const err = new Error("This push endpoint is already registered with different browser keys.");
    err.status = 409;
    throw err;
  }
  const now = new Date().toISOString();
  const record = {
    owner_type: "staff",
    staff_user_id: actor.id,
    customer_profile_id: null,
    endpoint: subscription.endpoint,
    p256dh: subscription.p256dh,
    auth_secret: subscription.auth_secret,
    content_encoding: "aes128gcm",
    expires_at: subscription.expires_at,
    user_agent: metadata.user_agent,
    platform: metadata.platform,
    timezone: metadata.timezone,
    push_enabled: true,
    event_preferences: metadata.event_preferences,
    revoked_at: null,
    last_seen_at: now,
    updated_at: now,
    last_error: null
  };
  if (existing) {
    const response = await fetch(`${env.SUPABASE_URL}/rest/v1/notification_push_subscriptions?id=eq.${encodeURIComponent(existing.id)}`, {
      method: "PATCH",
      headers: { ...serviceHeaders(env), Prefer: "return=representation" },
      body: JSON.stringify(record)
    });
    if (!response.ok) throw new Error(`Could not update push subscription. ${await response.text()}`);
    const rows = await response.json().catch(() => []);
    return Array.isArray(rows) ? rows[0] || null : null;
  }
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/notification_push_subscriptions`, {
    method: "POST",
    headers: { ...serviceHeaders(env), Prefer: "return=representation" },
    body: JSON.stringify([record])
  });
  if (!response.ok) throw new Error(`Could not save push subscription. ${await response.text()}`);
  const rows = await response.json().catch(() => []);
  return Array.isArray(rows) ? rows[0] || null : null;
}

export async function revokeStaffPushSubscription({ env, actor, endpoint }) {
  const cleanEndpoint = cleanText(endpoint, MAX_ENDPOINT_LENGTH);
  if (!cleanEndpoint) throw new Error("Push subscription endpoint is required.");
  const response = await fetch(
    `${env.SUPABASE_URL}/rest/v1/notification_push_subscriptions?owner_type=eq.staff&staff_user_id=eq.${encodeURIComponent(actor.id)}&endpoint=eq.${encodeURIComponent(cleanEndpoint)}`,
    {
      method: "PATCH",
      headers: { ...serviceHeaders(env), Prefer: "return=representation" },
      body: JSON.stringify({ push_enabled:false, revoked_at:new Date().toISOString(), updated_at:new Date().toISOString() })
    }
  );
  if (!response.ok) throw new Error(`Could not revoke push subscription. ${await response.text()}`);
  const rows = await response.json().catch(() => []);
  return Array.isArray(rows) ? rows.length : 0;
}

async function loadSubscriptionByEndpoint(env, endpoint) {
  const response = await fetch(
    `${env.SUPABASE_URL}/rest/v1/notification_push_subscriptions?select=id,owner_type,staff_user_id,customer_profile_id,p256dh,auth_secret&endpoint=eq.${encodeURIComponent(endpoint)}&limit=1`,
    { headers: serviceHeaders(env) }
  );
  if (!response.ok) throw new Error(`Could not inspect push subscription. ${await response.text()}`);
  const rows = await response.json().catch(() => []);
  return Array.isArray(rows) ? rows[0] || null : null;
}

function cleanText(value, max) {
  const text = String(value ?? "").trim();
  return text ? text.slice(0, max) : null;
}

function cleanTimezone(value) {
  const text = cleanText(value, 100) || "America/Toronto";
  try { new Intl.DateTimeFormat("en", { timeZone:text }).format(); return text; } catch { return "America/Toronto"; }
}
