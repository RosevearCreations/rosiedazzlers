import { requireStaffAccess, serviceHeaders, json, methodNotAllowed, isUuid } from "../_lib/staff-auth.js";
import { withSocialCors, socialCorsHeaders } from "../_lib/social-dispatch.js";
import { attemptPlatformPublish, publishViaWebhook } from "../_lib/social-platform-dispatch.js";

const STATUS_BY_ACTION = {
  mark_ready: "ready",
  mark_posted: "posted",
  mark_failed: "failed",
  skip: "skipped",
  reopen: "draft"
};

export async function onRequestOptions() {
  return new Response("", { status: 204, headers: socialCorsHeaders() });
}

export async function onRequestGet() {
  return withSocialCors(methodNotAllowed());
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json().catch(() => ({}));
    const id = String(body.id || "").trim();
    const action = String(body.action || "mark_ready").trim().toLowerCase();
    if (!isUuid(id)) return withSocialCors(json({ ok: false, error: "Valid social post id is required." }, 400));

    const access = await requireStaffAccess({ request, env, body, capability: "manage_progress", allowLegacyAdminFallback: true });
    if (!access.ok) return withSocialCors(access.response);
    const actor = access.actor || {};

    const post = await loadSocialPost(env, id);
    if (!post) return withSocialCors(json({ ok: false, error: "Social post was not found." }, 404));

    if (action === "send_webhook") {
      return withSocialCors(await handleWebhookDispatch({ env, post, actor }));
    }

    if (action === "publish_api") {
      return withSocialCors(await handleApiPublish({ env, post, actor }));
    }

    const status = STATUS_BY_ACTION[action];
    if (!status) return withSocialCors(json({ ok: false, error: "Unsupported social dispatch action." }, 400));

    const patch = {
      status,
      updated_at: new Date().toISOString(),
      last_error: status === "failed" ? String(body.error || "Marked failed manually.").slice(0, 500) : null
    };

    if (status === "posted") {
      patch.posted_at = new Date().toISOString();
      patch.external_post_id = String(body.external_post_id || post.external_post_id || "").trim() || null;
      patch.external_post_url = String(body.external_post_url || post.external_post_url || "").trim() || null;
    }

    const updated = await updateSocialPost(env, id, patch);
    await logAttempt(env, {
      social_post_id: id,
      platform: post.platform,
      status,
      request_summary: { action, actor: actor.full_name || actor.email || "Staff" },
      response_summary: { manual: true },
      error_message: patch.last_error
    });

    return withSocialCors(json({ ok: true, post: updated, message: `Social post marked ${status}.` }));
  } catch (err) {
    return withSocialCors(json({ ok: false, error: err?.message || "Could not update social post." }, 500));
  }
}

async function handleApiPublish({ env, post, actor }) {
  const result = await attemptPlatformPublish({ env, post, actor });
  const status = result.ok ? "posted" : (result.status || "failed");

  const patch = {
    status,
    updated_at: new Date().toISOString(),
    posted_at: result.ok ? new Date().toISOString() : post.posted_at || null,
    external_post_id: result.external_post_id || post.external_post_id || null,
    external_post_url: result.external_post_url || post.external_post_url || null,
    last_error: result.ok ? null : String(result.error || "Platform publish failed.").slice(0, 500),
    attempt_count: Number(post.attempt_count || 0) + 1
  };

  const updated = await updateSocialPost(env, post.id, patch);

  await logAttempt(env, {
    social_post_id: post.id,
    platform: post.platform,
    status,
    request_summary: { action: "publish_api", actor: actor.full_name || actor.email || "Staff" },
    response_summary: result.response_summary || {},
    error_message: patch.last_error
  });

  return json({
    ok: !!result.ok,
    post: updated,
    message: result.ok ? "Platform publish completed." : "Platform publish did not complete. The draft remains available for manual/webhook posting.",
    detail: result.error || null
  }, result.ok || result.unsupported ? 200 : 400);
}

async function handleWebhookDispatch({ env, post, actor }) {
  const result = await publishViaWebhook({ env, post, actor, reason: "Manual Send webhook action from Social Queue." });
  const status = result.ok ? "posted" : "failed";

  const updated = await updateSocialPost(env, post.id, {
    status,
    updated_at: new Date().toISOString(),
    posted_at: result.ok ? new Date().toISOString() : post.posted_at || null,
    external_post_id: result.external_post_id || post.external_post_id || null,
    external_post_url: result.external_post_url || post.external_post_url || null,
    attempt_count: Number(post.attempt_count || 0) + 1,
    last_error: result.ok ? null : String(result.error || "Webhook dispatch failed.").slice(0, 500)
  });

  await logAttempt(env, {
    social_post_id: post.id,
    platform: post.platform,
    status,
    request_summary: { action: "send_webhook", actor: actor.full_name || actor.email || "Staff" },
    response_summary: result.response_summary || {},
    error_message: result.ok ? null : String(result.error || "Webhook dispatch failed.").slice(0, 500)
  });

  return json({
    ok: !!result.ok,
    post: updated,
    message: result.ok ? "Webhook dispatch completed." : "Webhook dispatch failed.",
    detail: result.error || null
  }, result.ok ? 200 : 400);
}

async function loadSocialPost(env, id) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/social_post_queue?select=*&id=eq.${encodeURIComponent(id)}&limit=1`, { headers: serviceHeaders(env) });
  if (!res.ok) return null;
  const rows = await res.json().catch(() => []);
  return Array.isArray(rows) ? rows[0] || null : null;
}

async function updateSocialPost(env, id, patch) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/social_post_queue?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { ...serviceHeaders(env), Prefer: "return=representation" },
    body: JSON.stringify(patch)
  });
  if (!res.ok) throw new Error(`Could not update social post. ${await res.text()}`);
  const rows = await res.json().catch(() => []);
  return Array.isArray(rows) ? rows[0] || null : null;
}

async function logAttempt(env, payload) {
  try {
    await fetch(`${env.SUPABASE_URL}/rest/v1/social_dispatch_attempts`, {
      method: "POST",
      headers: serviceHeaders(env),
      body: JSON.stringify([payload])
    });
  } catch {
    // Attempts are useful but should never block the queue UI.
  }
}
