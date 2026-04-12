import { requireStaffAccess, json, methodNotAllowed } from "../_lib/staff-auth.js";
import { loadRecoverySettings } from "../_lib/app-settings.js";
import { dispatchNotificationThroughProvider } from "../_lib/provider-dispatch.js";

export async function onRequestOptions(){ return new Response("", { status:204, headers:corsHeaders() }); }
export async function onRequestPost(context){
  const { request, env } = context;
  try {
    const body = await request.json().catch(() => ({}));
    const access = await requireStaffAccess({ request, env, body, capability:'manage_staff', allowLegacyAdminFallback:true });
    if (!access.ok) return withCors(access.response);

    const settings = await loadRecoverySettings(env);
    const templates = settings.recovery_templates || {};
    const rules = settings.recovery_rules || {};
    const providerRules = settings.recovery_provider_rules || {};
    let channel = String(body.channel || rules.default_recovery_channel || 'email').trim().toLowerCase();
    if (!['email','sms'].includes(channel)) channel = 'email';

    const previewData = {
      customer_name: String(body.customer_name || 'Valued Customer').trim() || 'Valued Customer',
      recovery_url: String(body.recovery_url || (env.PUBLIC_SITE_URL ? `${env.PUBLIC_SITE_URL}/book` : '/book')).trim(),
      service_date: String(body.service_date || '').trim(),
      package_name: String(body.package_name || '').trim(),
      gift_code: String(body.gift_code || '').trim()
    };

    const subject = applyTokens(body.subject || templates.abandoned_checkout_subject || 'Complete your Rosie Dazzlers booking', previewData);
    const bodyText = applyTokens(body.body_text || templates.abandoned_checkout_body_text || 'We noticed you started a booking but did not complete checkout. Come back to finish your order when you are ready.', previewData);
    const bodyHtml = applyTokens(body.body_html || templates.abandoned_checkout_body_html || '', previewData);

    const event = {
      event_type: 'abandoned_checkout_recovery',
      channel,
      recipient_email: String(body.customer_email || '').trim() || null,
      recipient_phone: String(body.recipient_phone || '').trim() || null,
      subject,
      body_text: bodyText,
      body_html: bodyHtml,
      payload: { preview: true, ...previewData }
    };

    let dispatch = null;
    if (body.send_test === true) {
      const previewRecipient = channel === 'email'
        ? (String(body.test_recipient || providerRules?.email?.send_test_to || event.recipient_email || '').trim())
        : (String(body.test_recipient || providerRules?.sms?.send_test_to || event.recipient_phone || '').trim());
      if (!previewRecipient) return withCors(json({ error: 'A test recipient is required for preview sending.' }, 400));
      dispatch = await dispatchNotificationThroughProvider(env, event, { preview: true, previewRecipient });
    }

    return withCors(json({
      ok: true,
      preview: {
        channel,
        subject,
        body_text: bodyText,
        body_html: bodyHtml,
        provider_rule: providerRules?.[channel] || null
      },
      dispatch
    }));
  } catch (err) {
    return withCors(json({ error: err?.message || 'Unexpected server error.' }, 500));
  }
}
export async function onRequestGet(){ return withCors(methodNotAllowed()); }
function applyTokens(input, tokens){
  return String(input || '')
    .replace(/\{\{\s*customer_name\s*\}\}/gi, tokens.customer_name || '')
    .replace(/\{\{\s*recovery_url\s*\}\}/gi, tokens.recovery_url || '')
    .replace(/\{\{\s*service_date\s*\}\}/gi, tokens.service_date || '')
    .replace(/\{\{\s*package_name\s*\}\}/gi, tokens.package_name || '')
    .replace(/\{\{\s*gift_code\s*\}\}/gi, tokens.gift_code || '');
}
function corsHeaders(){ return {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type","Cache-Control":"no-store"}; }
function withCors(response){ const h=new Headers(response.headers||{}); for (const [k,v] of Object.entries(corsHeaders())) h.set(k,v); return new Response(response.body,{ status:response.status, statusText:response.statusText, headers:h }); }
