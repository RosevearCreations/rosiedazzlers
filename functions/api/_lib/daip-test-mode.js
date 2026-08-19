// Build 218 — reusable DAIP internal-test-mode safeguards.
// DAIP Test Mode is intentionally metadata-only. This helper never creates storage URLs,
// uploads, workers, public exports, or publication actions.

import { serviceHeaders, json, cleanText, isUuid } from './staff-auth.js';

export const DAIP_BUILD = 218;
export const INTERNAL_TEST_PHRASE = 'INTERNAL TEST ONLY';
export const ARCHIVE_TEST_PHRASE = 'ARCHIVE INTERNAL TEST JOB';
export const SAFE_ASSET_KINDS = new Set(['test_photo', 'test_video']);
export const SAFE_CAPTURE_STAGES = new Set(['before', 'process', 'after', 'other']);
export const SAFE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime']);
export const SAFE_PRIVACY_STATUSES = new Set(['not_started', 'manual_review_required', 'internal_only_cleared', 'blocked_private']);

export function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,x-admin-password,x-staff-email,x-staff-user-id',
    'Cache-Control': 'no-store'
  };
}

export function withCors(response) {
  const headers = new Headers(response.headers || {});
  for (const [key, value] of Object.entries(corsHeaders())) headers.set(key, value);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

export function serviceReady(env) {
  return !!(env?.SUPABASE_URL && (env?.SUPABASE_SERVICE_ROLE_KEY || env?.SUPABASE_SERVICE_KEY || env?.SUPABASE_SERVICE_ROLE || env?.SUPABASE_SECRET_KEY));
}

export async function readTestControl(env) {
  if (!serviceReady(env)) return { ok:false, code:'service_not_configured', error:'Supabase service configuration is missing.' };
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/daip_test_control?select=singleton,mode,storage_provisioned,worker_enabled,public_export_enabled,automatic_publishing_enabled,notes,updated_at&singleton=eq.true&limit=1`, { headers:serviceHeaders(env) });
  const text = await res.text();
  if (!res.ok) return { ok:false, code:'migration_not_applied', error:'DAIP test-mode tables are not ready. Apply Build 218 migration.', detail:text.slice(0,160) };
  const row = safeJson(text)?.[0] || null;
  if (!row) return { ok:false, code:'control_missing', error:'DAIP test-mode control record is missing. Re-run Build 218 migration.' };
  if (row.mode !== 'internal_test' || row.storage_provisioned || row.worker_enabled || row.public_export_enabled || row.automatic_publishing_enabled) {
    return { ok:false, code:'unsafe_mode', error:'DAIP Test Lab is locked because the control record is not in its required internal-test state.' };
  }
  return { ok:true, control:row };
}

export function safeFilename(value) {
  const text = String(value || '').trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9._ -]{0,159}$/.test(text)) return null;
  if (/[\\/]/.test(text)) return null;
  return text;
}

export function safeShortText(value, max = 240) {
  const text = cleanText(value);
  return text ? text.slice(0, max) : null;
}

export function safeInteger(value, { min = 0, max = 10737418240 } = {}) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < min || number > max) return null;
  return number;
}

export function safeDate(value) {
  const text = String(value || '').trim();
  if (!text) return new Date().toISOString().slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
}

export function isInternalTestAcknowledged(body) {
  const phrase=String(body?.safety_confirmation||'').trim().replace(/\s+/g,' ').toUpperCase();
  return phrase === INTERNAL_TEST_PHRASE && body?.internal_test_only === true && body?.no_customer_data === true && body?.no_public_export === true;
}


export function containsForbiddenStorageInput(body = {}) {
  const prohibited = ['public_url','url','media_url','storage_key','storage_path','storage_bucket','signed_url','download_url','upload_url','r2_key','drive_file_id'];
  return prohibited.some((key) => Object.prototype.hasOwnProperty.call(body, key) && String(body[key] ?? '').trim() !== '');
}

export async function appendAuditEvent(env, row) {
  const payload = {
    media_job_id: isUuid(row?.media_job_id) ? row.media_job_id : null,
    media_asset_id: isUuid(row?.media_asset_id) ? row.media_asset_id : null,
    actor_staff_user_id: isUuid(row?.actor_staff_user_id) ? row.actor_staff_user_id : null,
    event_type: safeShortText(row?.event_type, 80) || 'test_task_seeded',
    reason: safeShortText(row?.reason, 1000),
    safe_metadata: row?.safe_metadata && typeof row.safe_metadata === 'object' ? row.safe_metadata : {}
  };
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/daip_audit_events`, { method:'POST', headers:{...serviceHeaders(env), Prefer:'return=minimal'}, body:JSON.stringify([payload]) });
  return res.ok;
}

export async function readInternalTestJob(env, jobId) {
  if (!isUuid(jobId)) return { ok:false, status:400, error:'Choose a valid DAIP test job.' };
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/daip_media_jobs?select=id,job_code,status,test_mode,internal_test_only,public_export_blocked,processor_execution_blocked,storage_mode&test_mode=is.true&id=eq.${encodeURIComponent(jobId)}&limit=1`, {headers:serviceHeaders(env)});
  const text = await res.text();
  if (!res.ok) return { ok:false, status:409, error:'DAIP test job registry is unavailable. Apply Build 218 migration.' };
  const job = safeJson(text)?.[0] || null;
  if (!job) return { ok:false, status:404, error:'DAIP test job was not found.' };
  if (!job.test_mode || !job.internal_test_only || !job.public_export_blocked || !job.processor_execution_blocked || job.storage_mode !== 'metadata_only') return { ok:false, status:409, error:'This record is not a safe DAIP internal-test job.' };
  return { ok:true, job };
}

export function safeJson(value) { try { return JSON.parse(value); } catch { return null; } }
export function daipError(error, status = 400, extra = {}) { return withCors(json({ ok:false, error, ...extra }, status)); }
