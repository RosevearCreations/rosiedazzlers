import webpush from "npm:web-push@3.6.7";

const JSON_HEADERS = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" };
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

Deno.serve(async (request) => {
  if (request.method !== "POST") return respond({ error: "Method not allowed." }, 405);
  try {
    const env = runtimeEnv();
    const input = await request.json().catch(() => ({}));
    const staffId = cleanUuid(input.recipient_staff_user_id);
    const customerId = cleanUuid(input.customer_profile_id);
    if ((staffId ? 1 : 0) + (customerId ? 1 : 0) !== 1) {
      return respond({ error: "Exactly one staff or customer push recipient is required." }, 400);
    }

    const vapid = await loadVapidConfig(env);
    if (!vapid.public_key || !vapid.private_key || !vapid.subject) {
      return respond({ error: "VAPID configuration is incomplete." }, 503);
    }
    webpush.setVapidDetails(vapid.subject, vapid.public_key, vapid.private_key);

    const subscriptions = await loadSubscriptions(env, { staffId, customerId });
    if (!subscriptions.length) {
      return respond({ ok: true, sent: 0, revoked: 0, failed: 0, skipped: "no_active_subscription" });
    }

    const notification = buildNotification(input);
    const encoded = JSON.stringify(notification);
    let sent = 0;
    let revoked = 0;
    let failed = 0;
    const failures: Array<{ id: string; status: number | null; error: string }> = [];

    for (const subscription of subscriptions) {
      try {
        await webpush.sendNotification(
          { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth_secret } },
          encoded,
          { TTL: 300, urgency: "normal", topic: safeTopic(notification.tag) }
        );
        sent += 1;
        await patchSubscription(env, subscription.id, { last_success_at: new Date().toISOString(), last_failure_at: null, last_error: null, last_seen_at: new Date().toISOString(), updated_at: new Date().toISOString() });
      } catch (error) {
        const status = Number(error?.statusCode || error?.status || 0) || null;
        const message = cleanError(error);
        if (status === 404 || status === 410) {
          revoked += 1;
          await patchSubscription(env, subscription.id, { push_enabled: false, revoked_at: new Date().toISOString(), last_failure_at: new Date().toISOString(), last_error: message, updated_at: new Date().toISOString() });
        } else {
          failed += 1;
          failures.push({ id: subscription.id, status, error: message });
          await patchSubscription(env, subscription.id, { last_failure_at: new Date().toISOString(), last_error: message, updated_at: new Date().toISOString() });
        }
      }
    }

    if (sent === 0 && failed > 0) {
      return respond({ ok: false, sent, revoked, failed, failures: failures.slice(0, 10) }, 502);
    }
    return respond({ ok: true, sent, revoked, failed, failures: failures.slice(0, 10) });
  } catch (error) {
    return respond({ error: cleanError(error) }, 500);
  }
});

function runtimeEnv() {
  const supabaseUrl = String(Deno.env.get("SUPABASE_URL") || "").replace(/\/$/, "");
  const serviceKey = String(Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || legacyServiceKey() || "");
  if (!supabaseUrl || !serviceKey) throw new Error("Supabase server credentials are unavailable.");
  return { supabaseUrl, serviceKey };
}

function legacyServiceKey() {
  const raw = String(Deno.env.get("SUPABASE_SECRET_KEYS") || "").trim();
  if (!raw) return "";
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return String(parsed[0] || "");
    if (parsed && typeof parsed === "object") return String(parsed.current || parsed.primary || Object.values(parsed)[0] || "");
  } catch {}
  return raw.split(",")[0]?.trim() || "";
}

async function loadVapidConfig(env: { supabaseUrl: string; serviceKey: string }) {
  const response = await fetch(`${env.supabaseUrl}/rest/v1/rpc/notification_push_private_config`, {
    method: "POST",
    headers: serviceHeaders(env),
    body: "{}"
  });
  if (!response.ok) throw new Error(`Could not load VAPID configuration (${response.status}).`);
  const data = await response.json().catch(() => []);
  return Array.isArray(data) ? data[0] || {} : data || {};
}

async function loadSubscriptions(env: { supabaseUrl: string; serviceKey: string }, target: { staffId: string | null; customerId: string | null }) {
  const ownerType = target.staffId ? "staff" : "customer";
  const ownerColumn = target.staffId ? "staff_user_id" : "customer_profile_id";
  const ownerId = target.staffId || target.customerId;
  const url = `${env.supabaseUrl}/rest/v1/notification_push_subscriptions?select=id,endpoint,p256dh,auth_secret,content_encoding&owner_type=eq.${ownerType}&${ownerColumn}=eq.${encodeURIComponent(String(ownerId))}&push_enabled=eq.true&revoked_at=is.null`;
  const response = await fetch(url, { headers: serviceHeaders(env) });
  if (!response.ok) throw new Error(`Could not load push subscriptions (${response.status}).`);
  const rows = await response.json().catch(() => []);
  return Array.isArray(rows) ? rows : [];
}

async function patchSubscription(env: { supabaseUrl: string; serviceKey: string }, id: string, patch: Record<string, unknown>) {
  await fetch(`${env.supabaseUrl}/rest/v1/notification_push_subscriptions?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { ...serviceHeaders(env), Prefer: "return=minimal" },
    body: JSON.stringify(patch)
  }).catch(() => null);
}

function serviceHeaders(env: { serviceKey: string }) {
  return { apikey: env.serviceKey, Authorization: `Bearer ${env.serviceKey}`, "Content-Type": "application/json" };
}

function buildNotification(input: any) {
  const payload = input?.payload && typeof input.payload === "object" ? input.payload : {};
  const eventType = String(input?.event_type || "rosie_update").slice(0, 100);
  const body = String(input?.body_text || payload.message || "You have a Rosie Dazzlers update.").slice(0, 500);
  const url = safePath(payload.progress_url || payload.detailer_url || payload.url || (input?.recipient_staff_user_id ? "/app/" : "/progress"));
  const title = String(payload.title || titleFor(eventType)).slice(0, 100);
  return { title, body, url, tag: `rosie-${String(input?.id || eventType).replace(/[^a-z0-9_-]/gi, "-").slice(0, 80)}`, event_type: eventType };
}

function titleFor(eventType: string) {
  if (eventType.includes("message") || eventType.includes("comment")) return "New Rosie Dazzlers message";
  if (eventType.includes("media")) return "New detail photos available";
  if (eventType.includes("progress") || eventType.includes("status")) return "Detailing progress updated";
  if (eventType.includes("assign")) return "Rosie job assignment";
  return "Rosie Dazzlers";
}

function safePath(value: unknown) {
  const text = String(value || "/app/");
  return text.startsWith("/") && !text.startsWith("//") ? text.slice(0, 500) : "/app/";
}
function safeTopic(value: unknown) { return String(value || "rosie-update").replace(/[^A-Za-z0-9_-]/g, "-").slice(0, 32) || "rosie-update"; }
function cleanUuid(value: unknown) { const text = String(value || "").trim(); return UUID_RE.test(text) ? text : null; }
function cleanError(error: any) { return String(error?.body || error?.message || error || "Web Push delivery failed.").slice(0, 1000); }
function respond(body: unknown, status = 200) { return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS }); }
