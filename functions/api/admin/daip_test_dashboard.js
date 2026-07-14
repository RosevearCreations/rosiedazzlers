// Build 218 — protected DAIP Test Lab dashboard. Safe metadata only; no storage URLs or customer fields.
import { requireStaffAccess, serviceHeaders, json } from '../_lib/staff-auth.js';
import { readTestControl, serviceReady, safeJson, withCors, corsHeaders, DAIP_BUILD } from '../_lib/daip-test-mode.js';

export async function onRequestOptions(){ return new Response('', { status:204, headers:corsHeaders() }); }
export async function onRequestGet(context){ return handle(context); }
export async function onRequestPost(context){ return handle(context); }

async function handle({ request, env }) {
  try {
    const body = request.method === 'GET' ? {} : await request.json().catch(() => ({}));
    const access = await requireStaffAccess({ request, env, body, capability:'manage_staff', allowLegacyAdminFallback:true });
    if (!access.ok) return withCors(access.response);
    const control = await readTestControl(env);
    if (!control.ok) return withCors(json({ ok:true, build:DAIP_BUILD, ready:false, setup_required:true, warning:control.error, control:null, summary:emptySummary(), jobs:[], assets:[], tasks:[] }));
    if (!serviceReady(env)) return withCors(json({ ok:true, build:DAIP_BUILD, ready:false, setup_required:true, warning:'Supabase service configuration is missing.', control:control.control, summary:emptySummary(), jobs:[], assets:[], tasks:[] }));

    const [jobs, assets, tasks, reviews] = await Promise.all([
      load(env, 'daip_media_jobs', 'id,job_code,safe_label,job_date,status,created_at,updated_at,archived_at', 'order=created_at.desc&limit=80'),
      load(env, 'daip_media_assets', 'id,media_job_id,safe_filename,asset_kind,capture_stage,mime_type,file_size_bytes,source_reference_label,storage_status,privacy_status,created_at', 'order=created_at.desc&limit=300'),
      load(env, 'daip_processing_tasks', 'id,media_job_id,task_type,status,execution_blocked,created_at', 'order=created_at.desc&limit=300'),
      load(env, 'daip_privacy_reviews', 'id,media_asset_id,review_status,reviewed_at,created_at', 'order=created_at.desc&limit=300')
    ]);
    const jobRows = jobs.rows;
    const assetRows = assets.rows;
    const taskRows = tasks.rows;
    const reviewRows = reviews.rows;
    const summary = {
      total_jobs: jobRows.length,
      active_jobs: jobRows.filter((row)=>row.status !== 'archived').length,
      archived_jobs: jobRows.filter((row)=>row.status === 'archived').length,
      registered_assets: assetRows.length,
      privacy_pending: assetRows.filter((row)=>!['internal_only_cleared','blocked_private'].includes(String(row.privacy_status || ''))).length,
      internal_only_cleared: assetRows.filter((row)=>row.privacy_status === 'internal_only_cleared').length,
      blocked_private: assetRows.filter((row)=>row.privacy_status === 'blocked_private').length,
      planned_tasks: taskRows.length,
      executable_tasks: taskRows.filter((row)=>row.execution_blocked !== true).length,
      review_records: reviewRows.length
    };
    return withCors(json({ ok:true, build:DAIP_BUILD, ready:true, setup_required:false, control:control.control, summary, jobs:jobRows, assets:assetRows, tasks:taskRows, reviews:reviewRows, generated_at:new Date().toISOString(), warning:mergeWarnings([jobs.warning,assets.warning,tasks.warning,reviews.warning]) }));
  } catch (err) {
    return withCors(json({ ok:false, error:err?.message || 'Could not load DAIP Test Lab.' }, 500));
  }
}
async function load(env, table, select, suffix){
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/${table}?select=${encodeURIComponent(select)}&${suffix}`, {headers:serviceHeaders(env)});
  const text = await response.text();
  return response.ok ? {rows:Array.isArray(safeJson(text)) ? safeJson(text) : [], warning:null} : {rows:[], warning:`${table} is unavailable.`};
}
function mergeWarnings(list){ const values=list.filter(Boolean); return values.length ? values.join(' ') : null; }
function emptySummary(){ return {total_jobs:0,active_jobs:0,archived_jobs:0,registered_assets:0,privacy_pending:0,internal_only_cleared:0,blocked_private:0,planned_tasks:0,executable_tasks:0,review_records:0}; }
