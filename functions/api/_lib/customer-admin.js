// Build 220 — customer access-management helpers.
// password_hash values, raw reset tokens, session tokens, payment data, and media remain server-only and are not returned by publicCustomerProfile().

import { serviceHeaders, cleanEmail, cleanText, isUuid } from './staff-auth.js';

export const CUSTOMER_ADMIN_BUILD = 220;

const CUSTOMER_FIELDS = [
  'id','created_at','updated_at','email','full_name','phone','tier_code','notes',
  'address_line1','address_line2','city','province','postal_code','vehicle_notes',
  'preferred_contact_name','sms_phone','alternate_address_label','alternate_address_line1',
  'alternate_address_line2','alternate_city','alternate_province','alternate_postal_code',
  'client_private_notes','detailer_visible_notes','admin_private_notes','notification_opt_in',
  'notification_channel','detailer_chat_opt_in','notify_on_progress_post','notify_on_media_upload',
  'notify_on_comment_reply','has_water_hookup','has_power_hookup','live_updates_enabled',
  'billing_profile_enabled','is_active','email_verified_at','last_login_at','archived_at',
  'archived_by_staff_email','archive_reason','lifetime_bookings','lifetime_spend_cents','big_tipper'
].join(',');

export function customerAccessLevel(actor = {}) {
  if (actor.is_admin === true || actor.can_manage_staff === true || actor.can_manage_bookings === true) return 'manager';
  if (actor.can_manage_progress === true || actor.is_senior_detailer === true || actor.is_detailer === true) return 'operational';
  return 'none';
}

export function canManageCustomerSecurity(actor = {}) {
  return actor.is_admin === true || actor.can_manage_staff === true || actor.can_manage_bookings === true;
}

export function canArchiveCustomer(actor = {}) {
  return actor.is_admin === true || actor.can_manage_staff === true;
}

export function publicCustomerProfile(row = {}) {
  return {
    id: row.id || null,
    created_at: row.created_at || null,
    updated_at: row.updated_at || null,
    email: row.email || null,
    full_name: row.full_name || null,
    phone: row.phone || null,
    tier_code: row.tier_code || null,
    notes: row.notes || null,
    address_line1: row.address_line1 || null,
    address_line2: row.address_line2 || null,
    city: row.city || null,
    province: row.province || null,
    postal_code: row.postal_code || null,
    vehicle_notes: row.vehicle_notes || null,
    preferred_contact_name: row.preferred_contact_name || null,
    sms_phone: row.sms_phone || null,
    alternate_address_label: row.alternate_address_label || null,
    alternate_address_line1: row.alternate_address_line1 || null,
    alternate_address_line2: row.alternate_address_line2 || null,
    alternate_city: row.alternate_city || null,
    alternate_province: row.alternate_province || null,
    alternate_postal_code: row.alternate_postal_code || null,
    client_private_notes: row.client_private_notes || null,
    detailer_visible_notes: row.detailer_visible_notes || null,
    admin_private_notes: row.admin_private_notes || null,
    notification_opt_in: row.notification_opt_in === true,
    notification_channel: row.notification_channel || 'email',
    detailer_chat_opt_in: row.detailer_chat_opt_in !== false,
    notify_on_progress_post: row.notify_on_progress_post === true,
    notify_on_media_upload: row.notify_on_media_upload === true,
    notify_on_comment_reply: row.notify_on_comment_reply === true,
    has_water_hookup: row.has_water_hookup === true,
    has_power_hookup: row.has_power_hookup === true,
    live_updates_enabled: row.live_updates_enabled !== false,
    billing_profile_enabled: row.billing_profile_enabled === true,
    is_active: row.is_active === true,
    email_verified_at: row.email_verified_at || null,
    last_login_at: row.last_login_at || null,
    archived_at: row.archived_at || null,
    archived_by_staff_email: row.archived_by_staff_email || null,
    archive_reason: row.archive_reason || null,
    lifetime_bookings: Number(row.lifetime_bookings || 0),
    lifetime_spend_cents: Number(row.lifetime_spend_cents || 0),
    big_tipper: row.big_tipper === true
  };
}

export async function listCustomerProfiles(env, { includeArchived = false, status = 'all', limit = 250 } = {}) {
  const headers = serviceHeaders(env);
  const safeLimit = Math.max(1, Math.min(500, Number(limit) || 250));
  let url = `${env.SUPABASE_URL}/rest/v1/customer_profiles?select=${encodeURIComponent(CUSTOMER_FIELDS)}&order=updated_at.desc,created_at.desc&limit=${safeLimit}`;
  if (!includeArchived) url += '&archived_at=is.null';
  if (status === 'active') url += '&is_active=eq.true';
  if (status === 'suspended') url += '&is_active=eq.false&archived_at=is.null';
  if (status === 'archived') url += '&archived_at=not.is.null';
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`Could not load customers. ${await response.text()}`);
  const rows = await response.json().catch(() => []);
  return (Array.isArray(rows) ? rows : []).map(publicCustomerProfile);
}

export async function loadCustomerProfile(env, customerProfileId) {
  if (!isUuid(customerProfileId)) throw new Error('Invalid customer profile id.');
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/customer_profiles?select=${encodeURIComponent(CUSTOMER_FIELDS)}&id=eq.${encodeURIComponent(customerProfileId)}&limit=1`, { headers: serviceHeaders(env) });
  if (!response.ok) throw new Error(`Could not load customer profile. ${await response.text()}`);
  const rows = await response.json().catch(() => []);
  const row = Array.isArray(rows) ? rows[0] || null : null;
  return row ? publicCustomerProfile(row) : null;
}

export async function loadCustomerAdminDetail(env, customerProfileId) {
  const profile = await loadCustomerProfile(env, customerProfileId);
  if (!profile) return null;
  const headers = serviceHeaders(env);
  const now = new Date().toISOString();
  const [sessionRes, tokenRes, vehicleRes, bookingRes, auditRes] = await Promise.all([
    fetch(`${env.SUPABASE_URL}/rest/v1/customer_auth_sessions?select=id,created_at,last_seen_at,expires_at&customer_profile_id=eq.${encodeURIComponent(customerProfileId)}&revoked_at=is.null&expires_at=gt.${encodeURIComponent(now)}&order=last_seen_at.desc&limit=50`, { headers }).catch(() => null),
    fetch(`${env.SUPABASE_URL}/rest/v1/customer_auth_tokens?select=id,created_at,expires_at,purpose&customer_profile_id=eq.${encodeURIComponent(customerProfileId)}&used_at=is.null&expires_at=gt.${encodeURIComponent(now)}&order=created_at.desc&limit=20`, { headers }).catch(() => null),
    fetch(`${env.SUPABASE_URL}/rest/v1/customer_vehicles?select=id,vehicle_name,model_year,make,model,is_primary,updated_at&customer_profile_id=eq.${encodeURIComponent(customerProfileId)}&order=is_primary.desc,updated_at.desc&limit=25`, { headers }).catch(() => null),
    fetch(`${env.SUPABASE_URL}/rest/v1/bookings?select=id,status,job_status,service_date,created_at,price_total_cents,deposit_cents&customer_email=eq.${encodeURIComponent(profile.email || '__no_match__')}&order=service_date.desc,created_at.desc&limit=25`, { headers }).catch(() => null),
    fetch(`${env.SUPABASE_URL}/rest/v1/customer_admin_audit_events?select=event_type,actor_staff_email,safe_summary,created_at&customer_profile_id=eq.${encodeURIComponent(customerProfileId)}&order=created_at.desc&limit=25`, { headers }).catch(() => null)
  ]);
  const sessions = sessionRes?.ok ? await sessionRes.json().catch(() => []) : [];
  const tokens = tokenRes?.ok ? await tokenRes.json().catch(() => []) : [];
  const vehicles = vehicleRes?.ok ? await vehicleRes.json().catch(() => []) : [];
  const bookings = bookingRes?.ok ? await bookingRes.json().catch(() => []) : [];
  const audit = auditRes?.ok ? await auditRes.json().catch(() => []) : [];
  const bookingRows = Array.isArray(bookings) ? bookings : [];
  return {
    profile,
    access: {
      active_sessions: Array.isArray(sessions) ? sessions.length : 0,
      latest_session_at: Array.isArray(sessions) && sessions[0] ? (sessions[0].last_seen_at || sessions[0].created_at || null) : null,
      pending_reset_links: Array.isArray(tokens) ? tokens.filter((row) => row.purpose === 'password_reset').length : 0,
      pending_verification_links: Array.isArray(tokens) ? tokens.filter((row) => row.purpose === 'email_verification').length : 0
    },
    vehicles: Array.isArray(vehicles) ? vehicles : [],
    booking_summary: {
      booking_count: bookingRows.length,
      active_count: bookingRows.filter((row) => !['cancelled','completed'].includes(String(row.status || row.job_status || '').toLowerCase())).length,
      total_value_cents: bookingRows.reduce((sum, row) => sum + Number(row.price_total_cents || 0), 0),
      last_booking_at: bookingRows[0]?.service_date || bookingRows[0]?.created_at || null
    },
    audit: Array.isArray(audit) ? audit : []
  };
}

export async function createCustomerProfile(env, patch, actor) {
  const headers = serviceHeaders(env);
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/customer_profiles`, {
    method: 'POST', headers: { ...headers, Prefer: 'return=representation' }, body: JSON.stringify([{ ...patch, created_at:new Date().toISOString(), updated_at:new Date().toISOString() }])
  });
  if (!response.ok) throw new Error(`Could not create customer profile. ${await response.text()}`);
  const rows = await response.json().catch(() => []);
  const profile = Array.isArray(rows) ? rows[0] || null : null;
  if (!profile) throw new Error('Customer profile was not returned after creation.');
  await addCustomerAudit(env, { customerProfileId:profile.id, eventType:'profile_created', actor, safeSummary:'Staff created a new customer profile.' });
  return publicCustomerProfile(profile);
}

export async function updateCustomerProfile(env, customerProfileId, patch, actor, eventType = 'profile_updated', safeSummary = 'Staff updated customer profile information.') {
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/customer_profiles?id=eq.${encodeURIComponent(customerProfileId)}`, {
    method: 'PATCH', headers: { ...serviceHeaders(env), Prefer: 'return=representation' }, body: JSON.stringify({ ...patch, updated_at:new Date().toISOString() })
  });
  if (!response.ok) throw new Error(`Could not update customer profile. ${await response.text()}`);
  const rows = await response.json().catch(() => []);
  const profile = Array.isArray(rows) ? rows[0] || null : null;
  if (!profile) throw new Error('Customer profile was not found.');
  await addCustomerAudit(env, { customerProfileId, eventType, actor, safeSummary });
  return publicCustomerProfile(profile);
}

export async function ensureAvailableCustomerEmail(env, email, excludingId = null) {
  const normalized = cleanEmail(email);
  if (!normalized) throw new Error('A valid client email is required.');
  let url = `${env.SUPABASE_URL}/rest/v1/customer_profiles?select=id&email=eq.${encodeURIComponent(normalized)}&limit=2`;
  const response = await fetch(url, { headers:serviceHeaders(env) });
  if (!response.ok) throw new Error(`Could not check customer email. ${await response.text()}`);
  const rows = await response.json().catch(() => []);
  const duplicate = (Array.isArray(rows) ? rows : []).find((row) => String(row.id || '') !== String(excludingId || ''));
  if (duplicate) throw new Error('Another customer account already uses that email address.');
  return normalized;
}

export function normalizeCustomerProfileInput(body = {}, actor = {}, { creating = false } = {}) {
  const level = customerAccessLevel(actor);
  if (level === 'none') return { ok:false, error:'Permission denied.' };
  const isManager = level === 'manager';
  const fullName = cleanText(body.full_name);
  if (creating && !fullName) return { ok:false, error:'Client full name is required.' };
  const patch = {
    full_name: fullName,
    phone: cleanText(body.phone),
    preferred_contact_name: cleanText(body.preferred_contact_name),
    address_line1: cleanText(body.address_line1),
    address_line2: cleanText(body.address_line2),
    city: cleanText(body.city),
    province: cleanText(body.province),
    postal_code: cleanText(body.postal_code),
    vehicle_notes: cleanText(body.vehicle_notes),
    detailer_visible_notes: cleanText(body.detailer_visible_notes),
    has_water_hookup: boolValue(body.has_water_hookup),
    has_power_hookup: boolValue(body.has_power_hookup)
  };
  if (isManager) {
    Object.assign(patch, {
      email: body.email === undefined ? undefined : cleanEmail(body.email),
      sms_phone: cleanText(body.sms_phone),
      tier_code: cleanTier(body.tier_code),
      notes: cleanText(body.notes),
      client_private_notes: cleanText(body.client_private_notes),
      admin_private_notes: cleanText(body.admin_private_notes),
      notification_opt_in: boolValue(body.notification_opt_in),
      notification_channel: notificationChannel(body.notification_channel),
      detailer_chat_opt_in: boolValue(body.detailer_chat_opt_in),
      notify_on_progress_post: boolValue(body.notify_on_progress_post),
      notify_on_media_upload: boolValue(body.notify_on_media_upload),
      notify_on_comment_reply: boolValue(body.notify_on_comment_reply),
      live_updates_enabled: boolValue(body.live_updates_enabled),
      billing_profile_enabled: boolValue(body.billing_profile_enabled),
      alternate_address_label: cleanText(body.alternate_address_label),
      alternate_address_line1: cleanText(body.alternate_address_line1),
      alternate_address_line2: cleanText(body.alternate_address_line2),
      alternate_city: cleanText(body.alternate_city),
      alternate_province: cleanText(body.alternate_province),
      alternate_postal_code: cleanText(body.alternate_postal_code)
    });
    if (body.email !== undefined && !patch.email) return { ok:false, error:'A valid client email is required.' };
    if (patch.tier_code === null && body.tier_code) return { ok:false, error:'Choose a valid customer tier.' };
  }
  return { ok:true, patch:stripUndefined(patch), access_level:level };
}

export async function verifyTier(env, tierCode) {
  if (!tierCode) return;
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/customer_tiers?select=code,is_active&code=eq.${encodeURIComponent(tierCode)}&limit=1`, { headers:serviceHeaders(env) });
  if (!response.ok) throw new Error(`Could not verify customer tier. ${await response.text()}`);
  const rows = await response.json().catch(() => []);
  if (!Array.isArray(rows) || !rows[0]) throw new Error('Selected customer tier does not exist.');
}

export async function revokeAllCustomerSessions(env, customerProfileId) {
  const now = new Date().toISOString();
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/customer_auth_sessions?customer_profile_id=eq.${encodeURIComponent(customerProfileId)}&revoked_at=is.null`, {
    method:'PATCH', headers:{ ...serviceHeaders(env), Prefer:'return=representation' }, body:JSON.stringify({ revoked_at:now, updated_at:now })
  });
  if (!response.ok) throw new Error(`Could not revoke customer sessions. ${await response.text()}`);
  const rows = await response.json().catch(() => []);
  return Array.isArray(rows) ? rows.length : 0;
}

export async function addCustomerAudit(env, { customerProfileId, eventType, actor = {}, safeSummary }) {
  if (!customerProfileId || !eventType) return;
  const summary = safeAuditSummary(safeSummary);
  if (!summary) throw new Error('Audit summary is invalid.');
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/customer_admin_audit_events`, {
    method:'POST', headers:{ ...serviceHeaders(env), Prefer:'return=minimal' }, body:JSON.stringify([{
      customer_profile_id:customerProfileId, event_type:eventType,
      actor_staff_user_id:actor.id || null, actor_staff_email:actor.email || null,
      safe_summary:summary
    }])
  });
  if (!response.ok) throw new Error(`Could not write customer audit record. ${await response.text()}`);
}

export function safeAuditSummary(value) {
  const text = cleanText(value);
  if (!text || text.length > 500) return null;
  if (/https?:\/\/|s3:\/\/|signed[_ -]?url|token|password|bearer\s+/i.test(text)) return null;
  return text;
}

export function boolValue(value) {
  if (typeof value === 'boolean') return value;
  const raw = String(value ?? '').trim().toLowerCase();
  return raw === 'true' || raw === '1' || raw === 'yes' || raw === 'on';
}

function cleanTier(value) {
  const raw = String(value ?? '').trim().toLowerCase();
  if (!raw) return null;
  return ['bronze','silver','gold','platinum','custom'].includes(raw) ? raw : null;
}
function notificationChannel(value) {
  const raw = String(value ?? '').trim().toLowerCase();
  return ['email','sms','none'].includes(raw) ? raw : 'email';
}
function stripUndefined(value) {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined));
}
