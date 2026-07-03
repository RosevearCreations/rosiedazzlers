// Build 220 — secure customer access actions. Staff send reset/setup links; they never view or set a client password.
import { requireStaffAccess, json, cleanText } from '../_lib/staff-auth.js';
import {
  canArchiveCustomer, canManageCustomerSecurity, loadCustomerProfile, updateCustomerProfile,
  revokeAllCustomerSessions, addCustomerAudit, safeAuditSummary
} from '../_lib/customer-admin.js';
import { issueCustomerAuthToken, sendCustomerAuthEmail } from '../_lib/customer-auth-tokens.js';

const SECURITY_ACTIONS = new Set(['send_password_reset','send_account_setup','resend_verification','revoke_sessions']);
const LIFECYCLE_ACTIONS = new Set(['suspend','reactivate','archive','restore']);

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
    const action = String(body.action || '').trim();
    const customerProfileId = cleanText(body.customer_profile_id);
    if (!SECURITY_ACTIONS.has(action) && !LIFECYCLE_ACTIONS.has(action)) return withCors(json({ error:'Unsupported customer access action.' },400));
    const customer = await loadCustomerProfile(env, customerProfileId);
    if (!customer) return withCors(json({ error:'Customer profile not found.' },404));
    if (SECURITY_ACTIONS.has(action) && !canManageCustomerSecurity(access.actor)) return withCors(json({ error:'Only an administrator or booking manager can manage client access.' },403));
    if (LIFECYCLE_ACTIONS.has(action) && !canArchiveCustomer(access.actor)) return withCors(json({ error:'Only an administrator can suspend, restore, or archive a client account.' },403));

    if (action === 'send_password_reset' || action === 'send_account_setup' || action === 'resend_verification') {
      if (customer.archived_at || customer.is_active !== true) return withCors(json({ error:'Restore or reactivate the client account before sending access email.' },409));
      const purpose = action === 'resend_verification' ? 'email_verification' : 'password_reset';
      const issued = await issueCustomerAuthToken({ env, customerProfileId, purpose, expiresMinutes:purpose === 'email_verification' ? 24*60 : 90, payload:{ source:'staff_customer_management', action } });
      const delivery = await sendCustomerAuthEmail({ env, request, customer, purpose, rawToken:issued.rawToken, messageVariant:action === 'send_account_setup' ? 'account_setup' : 'standard' }).catch((error) => ({ ok:false, error:error?.message || 'Email delivery failed.' }));
      const eventType = action === 'send_password_reset' ? 'password_reset_issued' : (action === 'send_account_setup' ? 'account_setup_issued' : 'verification_issued');
      await addCustomerAudit(env, { customerProfileId, eventType, actor:access.actor, safeSummary:action === 'send_account_setup' ? 'Staff requested a secure account-setup email.' : (action === 'send_password_reset' ? 'Staff requested a secure password-reset email.' : 'Staff requested a new email-verification message.') });
      return withCors(json({ ok:true, action, delivery:{ ok:delivery.ok === true, provider:delivery.provider || null }, message:delivery.ok ? 'Secure client access email requested.' : 'The secure link was created, but the configured email provider did not confirm delivery. Check notification delivery before retrying.' }));
    }

    if (action === 'revoke_sessions') {
      const count = await revokeAllCustomerSessions(env, customerProfileId);
      await addCustomerAudit(env, { customerProfileId, eventType:'sessions_revoked', actor:access.actor, safeSummary:'Staff revoked all active customer sessions.' });
      return withCors(json({ ok:true, action, revoked_sessions:count, message:'All active client sessions were revoked.' }));
    }

    if (action === 'suspend') {
      const reason = cleanText(body.reason);
      if (!reason || reason.length < 6) return withCors(json({ error:'Provide a short internal reason before suspending an account.' },400));
      await revokeAllCustomerSessions(env, customerProfileId);
      await updateCustomerProfile(env, customerProfileId, { is_active:false }, access.actor, 'account_suspended', 'Administrator suspended client sign-in access.');
      return withCors(json({ ok:true, action, message:'Client account suspended and active sessions revoked.' }));
    }
    if (action === 'reactivate') {
      await updateCustomerProfile(env, customerProfileId, { is_active:true, archived_at:null, archived_by_staff_user_id:null, archived_by_staff_email:null, archive_reason:null }, access.actor, 'account_reactivated', 'Administrator reactivated client sign-in access.');
      return withCors(json({ ok:true, action, message:'Client account reactivated. Send an account-setup or reset email when appropriate.' }));
    }
    if (action === 'archive') {
      const reason = cleanText(body.reason);
      if (!reason || reason.length < 8) return withCors(json({ error:'Provide a short audit reason before archiving an account.' },400));
      if (String(body.confirm_archive || '') !== 'ARCHIVE CLIENT') return withCors(json({ error:'Type ARCHIVE CLIENT to confirm. Archiving blocks sign-in but preserves booking/payment records.' },400));
      await revokeAllCustomerSessions(env, customerProfileId);
      await updateCustomerProfile(env, customerProfileId, { is_active:false, archived_at:new Date().toISOString(), archived_by_staff_user_id:access.actor.id || null, archived_by_staff_email:access.actor.email || null, archive_reason:reason }, access.actor, 'account_archived', 'Administrator archived a customer account while preserving business records.');
      return withCors(json({ ok:true, action, message:'Client account archived. Historical business records were preserved.' }));
    }
    if (action === 'restore') {
      await updateCustomerProfile(env, customerProfileId, { is_active:true, archived_at:null, archived_by_staff_user_id:null, archived_by_staff_email:null, archive_reason:null }, access.actor, 'account_restored', 'Administrator restored an archived customer account.');
      return withCors(json({ ok:true, action, message:'Archived client account restored.' }));
    }
  } catch (error) { return withCors(json({ error:error?.message || 'Could not complete customer access action.' },500)); }
}
export async function onRequestGet(){ return withCors(json({ error:'Method not allowed.' },405)); }
function corsHeaders(){ return {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type,x-admin-password,x-staff-email,x-staff-user-id','Cache-Control':'no-store'}; }
function withCors(response){ const headers=new Headers(response.headers||{}); for(const [key,value] of Object.entries(corsHeaders())) headers.set(key,value); return new Response(response.body,{status:response.status,statusText:response.statusText,headers}); }
