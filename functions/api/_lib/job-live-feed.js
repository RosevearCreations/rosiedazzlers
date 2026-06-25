export const LIVE_STAGES = ["general", "arrival", "pre_existing", "during", "final", "recommendation", "issue"];
export const LIVE_AUDIENCES = ["customer", "review", "internal"];

export function normalizeLiveStage(value) {
  const stage = String(value || "general").trim().toLowerCase();
  return LIVE_STAGES.includes(stage) ? stage : "general";
}

export function normalizeAudience(value, legacyVisibility = "customer") {
  const raw = String(value || "").trim().toLowerCase();
  if (LIVE_AUDIENCES.includes(raw)) return raw;
  return String(legacyVisibility || "customer").trim().toLowerCase() === "internal" ? "internal" : "customer";
}

export function audienceFields(audience, actor = {}) {
  const now = new Date().toISOString();
  if (audience === "review") {
    return {
      visibility: "internal",
      review_status: "pending",
      requires_admin_review: true,
      customer_visible_at: null,
      approved_by_staff_user_id: null,
      approved_by_staff_name: null
    };
  }
  if (audience === "internal") {
    return {
      visibility: "internal",
      review_status: "not_required",
      requires_admin_review: false,
      customer_visible_at: null,
      approved_by_staff_user_id: null,
      approved_by_staff_name: null
    };
  }
  return {
    visibility: "customer",
    review_status: "approved",
    requires_admin_review: false,
    customer_visible_at: now,
    approved_by_staff_user_id: actor.id || null,
    approved_by_staff_name: actor.full_name || actor.email || null
  };
}

export function schemaLooksLegacy(text) {
  const value = String(text || "").toLowerCase();
  return value.includes("column") && (value.includes("does not exist") || value.includes("schema cache"));
}

export function safeExternalUrl(value) {
  const url = String(value || "").trim();
  if (!url) return "";
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol) ? parsed.toString() : "";
  } catch {
    return "";
  }
}

export async function signedStorageUrl({ env, bucket, path, expiresIn = 900 }) {
  const cleanBucket = String(bucket || "").trim();
  const cleanPath = String(path || "").trim();
  if (!cleanBucket || !cleanPath || !env?.SUPABASE_URL || !env?.SUPABASE_SERVICE_ROLE_KEY) return "";
  const res = await fetch(`${env.SUPABASE_URL}/storage/v1/object/sign/${encodeURIComponent(cleanBucket)}/${encodePath(cleanPath)}`, {
    method: "POST",
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ expiresIn })
  });
  if (!res.ok) return "";
  const out = await res.json().catch(() => ({}));
  const signed = out.signedURL || out.signedUrl || out.signed_url || out.url || "";
  if (!signed) return "";
  return signed.startsWith("http") ? signed : `${env.SUPABASE_URL}/storage/v1${signed}`;
}

export async function hydrateMediaRows(env, rows) {
  const list = Array.isArray(rows) ? rows : [];
  return Promise.all(list.map(async (row) => {
    const external = safeExternalUrl(row?.media_url);
    if (external) return { ...row, media_url: external, media_access: "external" };
    const signed = await signedStorageUrl({ env, bucket: row?.storage_bucket, path: row?.storage_path });
    return { ...row, media_url: signed || "", media_access: signed ? "signed" : "unavailable" };
  }));
}

export function publicWorkflowEvents(rows) {
  const allowed = new Set([
    "detailer_dispatched",
    "detailer_arrived",
    "detailing_started",
    "detailing_paused",
    "detailing_resumed",
    "detailing_completed",
    "detailer_update_posted",
    "media_posted",
    "customer_progress_enabled"
  ]);
  return (Array.isArray(rows) ? rows : [])
    .filter((row) => allowed.has(String(row?.event_type || "")))
    .map((row) => ({
      id: row.id || null,
      created_at: row.created_at || null,
      event_type: row.event_type || "update",
      event_note: sanitizePublicEventNote(row),
      actor_name: row.actor_name || null,
      payload: null
    }));
}

function sanitizePublicEventNote(row) {
  const type = String(row?.event_type || "");
  const safe = {
    detailer_dispatched: "Your detailer is on the way.",
    detailer_arrived: "Your detailer has arrived.",
    detailing_started: "Detailing work has started.",
    detailing_paused: "Detailing is temporarily paused.",
    detailing_resumed: "Detailing work has resumed.",
    detailing_completed: "Detailing is complete and moving to final review/payment.",
    customer_progress_enabled: "Your live progress link is active."
  };
  if (safe[type]) return safe[type];
  return String(row?.event_note || "Progress updated.").slice(0, 250);
}

function encodePath(path) {
  return encodeURIComponent(path).replace(/%2F/g, "/");
}
