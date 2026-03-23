
export async function dispatchNotificationThroughProvider(env, event) {
  const channel = String(event.channel || "").trim().toLowerCase();
  const payload = {
    id: event.id || null,
    event_type: event.event_type || null,
    channel,
    recipient_email: event.recipient_email || null,
    recipient_phone: event.recipient_phone || null,
    subject: event.subject || null,
    body_text: event.body_text || null,
    body_html: event.body_html || null,
    payload: event.payload || null
  };

  if (channel === "email") {
    const url = env.NOTIFICATIONS_EMAIL_WEBHOOK_URL || "";
    if (!url) {
      return {
        ok: false,
        provider: "email",
        error: "Missing NOTIFICATIONS_EMAIL_WEBHOOK_URL."
      };
    }
    return postJson(url, payload, env.NOTIFICATIONS_PROVIDER_AUTH_TOKEN);
  }

  if (channel === "sms") {
    const url = env.NOTIFICATIONS_SMS_WEBHOOK_URL || "";
    if (!url) {
      return {
        ok: false,
        provider: "sms",
        error: "Missing NOTIFICATIONS_SMS_WEBHOOK_URL."
      };
    }
    return postJson(url, payload, env.NOTIFICATIONS_PROVIDER_AUTH_TOKEN);
  }

  return {
    ok: false,
    provider: channel || "unknown",
    error: "Unsupported notification channel."
  };
}

async function postJson(url, payload, bearerToken) {
  try {
    const headers = { "Content-Type": "application/json" };
    if (bearerToken) headers.Authorization = `Bearer ${bearerToken}`;

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    });

    const text = await response.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch {}

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error: data?.error || text || `Provider returned ${response.status}.`
      };
    }

    return {
      ok: true,
      status: response.status,
      provider_response: data || text || null
    };
  } catch (err) {
    return {
      ok: false,
      error: err?.message || "Provider dispatch failed."
    };
  }
}
