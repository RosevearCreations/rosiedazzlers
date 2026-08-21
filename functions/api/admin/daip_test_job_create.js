// Build 218 — create an auditable internal-only DAIP test job.
import { requireStaffAccess, serviceHeaders, json, isUuid } from '../_lib/staff-auth.js';
import { readTestControl, isInternalTestAcknowledged, safeDate, safeShortText, appendAuditEvent, safeJson, daipError, withCors, corsHeaders, DAIP_BUILD } from '../_lib/daip-test-mode.js';

export async function onRequestOptions(){ return new Response('', {status:204, headers:corsHeaders()}); }
export async function onRequestPost({request, env}) {
  try {
    const body = await request.json().catch(()=>({}));
    const access = await requireStaffAccess({request, env, body, capability:'manage_staff', allowLegacyAdminFallback:true});
    if (!access.ok) return withCors(access.response);
    const control = await readTestControl(env);
    if (!control.ok) return daipError(control.error, 409);
    const testBookingReference = String(body.test_booking_reference || '').trim().toUpperCase();
    const safeLabel = safeShortText(body.safe_label, 160);
    const jobDate = safeDate(body.job_date);
    if (!/^RD-TEST-BOOKING-[A-Z0-9-]{3,80}$/.test(testBookingReference)) return daipError('Enter a DAIP-only test reference such as RD-TEST-BOOKING-DEMO-01. Do not use any booking UUID or customer record.', 400,{code:'invalid_test_reference',field:'test_booking_reference'});
    if (!safeLabel) return daipError('Enter a short safe internal-test label with no customer name, address, VIN, or phone number.', 400,{code:'missing_safe_label',field:'safe_label'});
    if (!jobDate) return daipError('Choose a valid job date.', 400,{code:'invalid_job_date',field:'job_date'});
    if (!isInternalTestAcknowledged(body)) return daipError('Confirm all three safety acknowledgements before creating a DAIP test job. The INTERNAL TEST ONLY phrase is prefilled by the Test Lab.', 400,{code:'safety_acknowledgement_required',field:'safety'});

    const codeRes = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/daip_next_test_job_code`, {method:'POST', headers:serviceHeaders(env), body:JSON.stringify({p_job_date:jobDate})});
    const codeText = await codeRes.text();
    const jobCode = safeJson(codeText) || String(codeText || '').replaceAll('"','').trim();
    if (!codeRes.ok || !/^RD-TEST-\d{8}-\d{3,}$/.test(jobCode)) return daipError('Could not reserve a test-only DAIP job code. Apply Build 218 migration and try again.', 409);

    const now = new Date().toISOString();
    const row = { job_code:jobCode, test_booking_reference:testBookingReference, safe_label:safeLabel, job_date:jobDate, status:'created', test_mode:true, internal_test_only:true, contains_customer_data:false, contains_incident_material:false, public_export_blocked:true, processor_execution_blocked:true, storage_mode:'metadata_only', consent_scope:'internal_test_only', created_by_staff_user_id:isUuid(access.actor?.id) ? access.actor.id : null, created_at:now, updated_at:now };
    const insert = await fetch(`${env.SUPABASE_URL}/rest/v1/daip_media_jobs`, {method:'POST', headers:{...serviceHeaders(env), Prefer:'return=representation'}, body:JSON.stringify([row])});
    const insertText = await insert.text();
    const job = safeJson(insertText)?.[0] || null;
    if (!insert.ok || !job?.id) return daipError('Could not create the DAIP internal-test job. The row was not created.', 500);

    const tasks = ['intake_validation','private_storage_plan','manual_privacy_review','worker_preflight'].map((taskType)=>({media_job_id:job.id,task_type:taskType,status:taskType==='manual_privacy_review'?'ready_for_manual_review':'blocked_pending_worker',execution_blocked:true,attempts:0,safe_note:taskType==='worker_preflight'?'Planning record only. Build 218 cannot execute workers.':null,created_at:now,updated_at:now}));
    const taskRes = await fetch(`${env.SUPABASE_URL}/rest/v1/daip_processing_tasks`, {method:'POST', headers:{...serviceHeaders(env), Prefer:'return=minimal'}, body:JSON.stringify(tasks)});
    const taskWarning = taskRes.ok ? null : 'The job was created, but its non-executing planning tasks could not be seeded.';
    await appendAuditEvent(env, {media_job_id:job.id,actor_staff_user_id:access.actor?.id,event_type:'test_job_created',reason:'Internal test job created through DAIP Test Lab.',safe_metadata:{build:DAIP_BUILD,job_code:jobCode,test_booking_reference:testBookingReference,storage_mode:'metadata_only',public_export_blocked:true}});
    if (taskRes.ok) await appendAuditEvent(env, {media_job_id:job.id,actor_staff_user_id:access.actor?.id,event_type:'test_task_seeded',reason:'Non-executing DAIP planning tasks seeded.',safe_metadata:{task_count:tasks.length,execution_blocked:true}});
    return withCors(json({ok:true, build:DAIP_BUILD, runtime_build:261, job:{id:job.id,job_code:job.job_code,safe_label:job.safe_label,status:job.status,job_date:job.job_date}, warning:taskWarning}));
  } catch (err) { return withCors(json({ok:false,error:err?.message || 'Could not create DAIP test job.'},500)); }
}
