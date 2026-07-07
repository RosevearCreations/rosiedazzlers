// Build 220 — create/update customer profile without exposing password controls.
import { requireStaffAccess, json, cleanText } from '../_lib/staff-auth.js';
import { recordCustomerContactPreferenceChange,
  customerAccessLevel, normalizeCustomerProfileInput, loadCustomerProfile,
  createCustomerProfile, updateCustomerProfile, ensureAvailableCustomerEmail,
  verifyTier, revokeAllCustomerSessions, publicCustomerProfile
} from '../_lib/customer-admin.js';
import { issueCustomerAuthToken, sendCustomerAuthEmail } from '../_lib/customer-auth-tokens.js';

export async function onRequest(context){
  const method = String(context.request?.method || 'GET').toUpperCase();
  if (method === 'OPTIONS') return onRequestOptions(context);
  if (method === 'POST') return onRequestPost(context);
  return withCors(json({ error:'Method not allowed.', allowed_methods:['POST','OPTIONS'] },405));
}
export async function onRequestOptions(){ return new Response('', { status:204, headers:corsHeaders() }); }
export async function onRequestPost(context){
  const { request, env } = context;
  try {
    const body = await request.json().catch(() => ({}));
    const access = await requireStaffAccess({ request, env, body, capability:'view_live_ops', allowLegacyAdminFallback:true });
    if (!access.ok) return withCors(access.response);
    const level = customerAccessLevel(access.actor);
    const id = cleanText(body.customer_profile_id || body.id);
    const creating = !id;
    if (creating && level !== 'manager') return withCors(json({ error:'Only an administrator or booking manager can create a client account.' },403));
    const normalized = normalizeCustomerProfileInput(body, access.actor, { creating });
    if (!normalized.ok) return withCors(json({ error:normalized.error },400));
    if (normalized.patch.tier_code) await verifyTier(env, normalized.patch.tier_code);

    if (creating) {
      const email = await ensureAvailableCustomerEmail(env, normalized.patch.email);
      normalized.patch.email = email;
      normalized.patch.is_active = true;
      normalized.patch.email_verified_at = null;
      const profile = await createCustomerProfile(env, normalized.patch, access.actor);
      return withCors(json({ ok:true, mode:'created', customer_profile:profile, message:'Customer profile created. Use Send account setup to email a secure first-password link.' }));
    }

    const existing = await loadCustomerProfile(env, id);
    if (!existing) return withCors(json({ error:'Customer profile not found.' },404));
    if (existing.archived_at) return withCors(json({ error:'Restore the archived account before editing it.' },409));
    const patch = { ...normalized.patch };
    let emailChanged = false;
    if (level !== 'manager') {
      delete patch.email; delete patch.tier_code; delete patch.client_private_notes; delete patch.admin_private_notes;
      delete patch.notification_opt_in; delete patch.notification_channel; delete patch.detailer_chat_opt_in;
      delete patch.notify_on_progress_post; delete patch.notify_on_media_upload; delete patch.notify_on_comment_reply;
      delete patch.live_updates_enabled; delete patch.billing_profile_enabled; delete patch.sms_phone;
      delete patch.alternate_address_label; delete patch.alternate_address_line1; delete patch.alternate_address_line2;
      delete patch.alternate_city; delete patch.alternate_province; delete patch.alternate_postal_code; delete patch.notes;
    } else if (patch.email && patch.email !== existing.email) {
      if (String(body.confirm_email_change || '') !== 'CHANGE EMAIL') return withCors(json({ error:'Type CHANGE EMAIL to confirm an email change. This signs the client out and sends a new verification email.' },400));
      patch.email = await ensureAvailableCustomerEmail(env, patch.email, id);
      patch.email_verified_at = null;
      emailChanged = true;
    } else {
      delete patch.email;
    }
    const profile = await updateCustomerProfile(env, id, patch, access.actor, emailChanged ? 'email_changed' : 'profile_updated', emailChanged ? 'Staff changed the client sign-in email and revoked active sessions.' : (level === 'manager' ? 'Staff updated customer profile information.' : 'Detailer updated job-relevant customer information.'));
    let preferenceHistoryWarning = null;
    if (level === 'manager') {
      try { await recordCustomerContactPreferenceChange(env, { customerProfileId:id, before:existing, after:profile, actor:access.actor }); }
      catch (historyError) { preferenceHistoryWarning = 'Profile saved, but preference history is unavailable until the Build 224 migration is applied.'; }
    }
    let verificationDelivery = null;
    if (emailChanged) {
      await revokeAllCustomerSessions(env, id);
      const issued = await issueCustomerAuthToken({ env, customerProfileId:id, purpose:'email_verification', expiresMinutes:24*60, payload:{ reason:'staff_email_change' } });
      verificationDelivery = await sendCustomerAuthEmail({ env, request, customer:profile, purpose:'email_verification', rawToken:issued.rawToken }).catch((error) => ({ ok:false, error:error?.message || 'Email delivery failed.' }));
    }
    return withCors(json({ ok:true, mode:'updated', customer_profile:publicCustomerProfile(profile), email_changed:emailChanged, verification_delivery:verificationDelivery ? { ok:verificationDelivery.ok === true, provider:verificationDelivery.provider || null } : null, preference_history_warning:preferenceHistoryWarning, message:emailChanged ? 'Profile updated. Existing sessions were revoked and a verification email was requested.' : 'Customer profile updated.' }));
  } catch (error) { return withCors(json({ error:error?.message || 'Could not save customer profile.' },500)); }
}
export async function onRequestGet(){ return withCors(json({ error:'Method not allowed.' },405)); }
function corsHeaders(){ return {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type,x-admin-password,x-staff-email,x-staff-user-id','Cache-Control':'no-store'}; }
function withCors(response){ const headers=new Headers(response.headers||{}); for(const [key,value] of Object.entries(corsHeaders())) headers.set(key,value); return new Response(response.body,{status:response.status,statusText:response.statusText,headers}); }
