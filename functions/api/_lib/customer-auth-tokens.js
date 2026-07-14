import { serviceHeaders } from "./customer-session.js";
import { dispatchNotificationThroughProvider } from "./provider-dispatch.js";

// Customer-facing authentication links use opaque, single-use tokens. Only the SHA-256
// digest is stored. Never return the raw token, reset URL, or delivery-body content to staff tools.
export async function issueCustomerAuthToken({ env, customerProfileId, purpose, expiresMinutes = 60, payload = {} }) {
  if (!env?.SUPABASE_URL || !env?.SUPABASE_SERVICE_ROLE_KEY) throw new Error("Server configuration is incomplete.");
  if (!customerProfileId || !purpose) throw new Error('A customer profile and token purpose are required.');
  const rawToken = randomToken();
  const tokenHash = await sha256Hex(rawToken);
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + Math.max(5, Number(expiresMinutes || 60)) * 60000).toISOString();

  // A new message replaces any still-open link for the same recovery purpose. This reduces
  // confusing multiple-email flows without ever exposing the earlier raw token.
  const invalidate = await fetch(`${env.SUPABASE_URL}/rest/v1/customer_auth_tokens?customer_profile_id=eq.${encodeURIComponent(customerProfileId)}&purpose=eq.${encodeURIComponent(purpose)}&used_at=is.null`, {
    method: 'PATCH',
    headers: { ...serviceHeaders(env), Prefer: 'return=minimal' },
    body: JSON.stringify({ used_at: now })
  });
  if (!invalidate.ok) throw new Error(`Could not retire prior auth tokens. ${await invalidate.text()}`);

  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/customer_auth_tokens`, {
    method: "POST",
    headers: { ...serviceHeaders(env), Prefer: "return=representation" },
    body: JSON.stringify([{
      customer_profile_id: customerProfileId,
      purpose,
      token_hash: tokenHash,
      payload,
      expires_at: expiresAt
    }])
  });
  if (!res.ok) throw new Error(`Could not create auth token. ${await res.text()}`);
  const rows = await res.json().catch(() => []);
  const row = Array.isArray(rows) ? rows[0] || null : null;
  return { rawToken, tokenHash, record: row, expiresAt };
}

export async function consumeCustomerAuthToken({ env, rawToken, purpose }) {
  if (!env?.SUPABASE_URL || !env?.SUPABASE_SERVICE_ROLE_KEY || !rawToken || !purpose) return null;
  const tokenHash = await sha256Hex(rawToken);
  const now = new Date().toISOString();
  // Atomically claim an unused, unexpired token. The `used_at=is.null` predicate makes a
  // replay lose cleanly even if two requests arrive at the same time.
  const claimUrl = `${env.SUPABASE_URL}/rest/v1/customer_auth_tokens?purpose=eq.${encodeURIComponent(purpose)}&token_hash=eq.${encodeURIComponent(tokenHash)}&used_at=is.null&expires_at=gt.${encodeURIComponent(now)}`;
  const claim = await fetch(claimUrl, {
    method: 'PATCH',
    headers: { ...serviceHeaders(env), Prefer: 'return=representation' },
    body: JSON.stringify({ used_at: now })
  });
  if (!claim.ok) throw new Error(`Could not claim auth token. ${await claim.text()}`);
  const claimedRows = await claim.json().catch(() => []);
  const row = Array.isArray(claimedRows) ? claimedRows[0] || null : null;
  if (!row?.customer_profile_id) return null;

  const customer = await loadCustomerForToken(env, row.customer_profile_id);
  if (!customer) return null;
  return { ...row, customer_profile: customer };
}

export async function loadCustomerAuthToken({ env, rawToken, purpose, includeCustomer = false }) {
  if (!env?.SUPABASE_URL || !env?.SUPABASE_SERVICE_ROLE_KEY || !rawToken || !purpose) return null;
  const tokenHash = await sha256Hex(rawToken);
  let select = 'id,customer_profile_id,purpose,token_hash,expires_at,used_at,payload,created_at';
  if (includeCustomer) select += ',customer_profile:customer_profiles!customer_auth_tokens_customer_profile_id_fkey(id,email,full_name,is_active,email_verified_at,notification_channel,notification_opt_in,phone)';
  const url = `${env.SUPABASE_URL}/rest/v1/customer_auth_tokens?select=${encodeURIComponent(select)}&purpose=eq.${encodeURIComponent(purpose)}&token_hash=eq.${encodeURIComponent(tokenHash)}&order=created_at.desc&limit=1`;
  const res = await fetch(url, { headers: serviceHeaders(env) });
  if (!res.ok) throw new Error(`Could not load auth token. ${await res.text()}`);
  const rows = await res.json().catch(() => []);
  const row = Array.isArray(rows) ? rows[0] || null : null;
  if (!row || row.used_at || (row.expires_at && new Date(row.expires_at).getTime() < Date.now())) return null;
  return row;
}

export async function markCustomerAuthTokenUsed({ env, tokenId }) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/customer_auth_tokens?id=eq.${encodeURIComponent(tokenId)}&used_at=is.null`, {
    method: 'PATCH', headers: { ...serviceHeaders(env), Prefer: 'return=minimal' }, body: JSON.stringify({ used_at: new Date().toISOString() })
  });
  if (!res.ok) throw new Error(`Could not mark auth token used. ${await res.text()}`);
}

export async function sendCustomerAuthEmail({ env, request, customer, purpose, rawToken, messageVariant = 'standard' }) {
  const origin = trustedCustomerAuthOrigin(env, request);
  let subject = '';
  let body_text = '';
  let event_type = '';
  if (purpose === 'password_reset') {
    const link = `${origin}/login?reset_token=${encodeURIComponent(rawToken)}`;
    const setup = messageVariant === 'account_setup';
    subject = setup ? 'Set up your Rosie Dazzlers client account' : 'Reset your Rosie Dazzlers password';
    body_text = setup
      ? `A Rosie Dazzlers team member created or updated your client account. Use this secure link to choose your first password: ${link}`
      : `We received a request to reset your Rosie Dazzlers password. Use this secure link to choose a new password: ${link}`;
    event_type = setup ? 'customer_account_setup' : 'customer_password_reset';
  } else if (purpose === 'email_verification') {
    const link = `${origin}/login?verify_token=${encodeURIComponent(rawToken)}`;
    subject = 'Verify your Rosie Dazzlers email';
    body_text = `Please verify your Rosie Dazzlers email address by opening this secure link: ${link}`;
    event_type = 'customer_email_verification';
  } else {
    throw new Error('Unsupported auth email purpose.');
  }
  return dispatchNotificationThroughProvider(env, {
    event_type,
    channel: 'email',
    recipient_email: customer.email,
    recipient_phone: customer.phone || null,
    subject,
    body_text,
    payload: { purpose, customer_profile_id: customer.id || null, full_name: customer.full_name || null }
  });
}


function trustedCustomerAuthOrigin(env, request) {
  const configured = String(env?.PUBLIC_SITE_ORIGIN || env?.SITE_URL || '').trim();
  if (configured) {
    const url = new URL(configured);
    if (url.protocol !== 'https:' && url.hostname !== 'localhost') throw new Error('PUBLIC_SITE_ORIGIN must use HTTPS outside localhost.');
    return url.origin;
  }
  const requestUrl = new URL(request.url);
  const host = requestUrl.hostname.toLowerCase();
  const allowed = host === 'rosiedazzlers.ca' || host === 'www.rosiedazzlers.ca' || host.endsWith('.rosiedazzlers.pages.dev') || host === 'localhost' || host === '127.0.0.1';
  if (!allowed || (requestUrl.protocol !== 'https:' && host !== 'localhost' && host !== '127.0.0.1')) {
    throw new Error('Customer auth origin is not approved. Set PUBLIC_SITE_ORIGIN for this environment.');
  }
  return requestUrl.origin;
}

async function loadCustomerForToken(env, customerProfileId) {
  const url = `${env.SUPABASE_URL}/rest/v1/customer_profiles?select=${encodeURIComponent('id,email,full_name,is_active,email_verified_at,notification_channel,notification_opt_in,phone')}&id=eq.${encodeURIComponent(customerProfileId)}&limit=1`;
  const res = await fetch(url, { headers: serviceHeaders(env) });
  if (!res.ok) throw new Error(`Could not load customer for auth token. ${await res.text()}`);
  const rows = await res.json().catch(() => []);
  return Array.isArray(rows) ? rows[0] || null : null;
}

function randomToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function sha256Hex(input) {
  const data = new TextEncoder().encode(String(input || ''));
  const hash = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
