import {requireStaffAccess,serviceHeaders,json,isUuid,cleanText} from '../_lib/staff-auth.js';
import {canWorkMobileBooking745} from '../_lib/detailer-mobile-scope-v745.js';
import {reconcileShift748,stableReceiptId748,SHIFT_SOURCE748,SHIFT_TYPES748,SHIFT_SUBMIT_EVENT748,SHIFT_REVIEW_EVENT748} from '../_lib/shift-reconciliation-v748.js';

const scopeError=(message,code,status=409)=>json({ok:false,code,error:message},status);
const sameOrigin=request=>request.headers.get('origin')===new URL(request.url).origin;

async function readRows(env,bookingId,staffId){
  const query=new URLSearchParams({select:'id,booking_id,staff_user_id,entry_type,event_time,created_at,note,source,minutes',booking_id:`eq.${bookingId}`,staff_user_id:`eq.${staffId}`,source:`eq.${SHIFT_SOURCE748}`,order:'event_time.asc,created_at.asc',limit:'250'});
  const res=await fetch(`${env.SUPABASE_URL}/rest/v1/job_time_entries?${query}`,{headers:serviceHeaders(env)});
  if(!res.ok)throw Error('Could not reconcile the current clock history. No mutation was sent.');
  const rows=await res.json();
  if(!Array.isArray(rows)||rows.length>=250)throw Error('Clock history is incomplete; ask Operations to reconcile the job.');
  return rows;
}
async function readReceipts(env,bookingId){
  const query=new URLSearchParams({select:'id,booking_id,event_type,payload,created_at,actor_name',booking_id:`eq.${bookingId}`,event_type:`in.(${SHIFT_SUBMIT_EVENT748},${SHIFT_REVIEW_EVENT748})`,order:'created_at.desc',limit:'150'});
  const res=await fetch(`${env.SUPABASE_URL}/rest/v1/booking_events?${query}`,{headers:serviceHeaders(env)});
  if(!res.ok)throw Error('Could not verify existing shift submissions and reviews.');
  const rows=await res.json();if(!Array.isArray(rows)||rows.length>=150)throw Error('Shift review history is too large; escalate to Operations.');
  return rows;
}
function currentReceipts(rows,staffId){
  const submissions=rows.filter(row=>row.event_type===SHIFT_SUBMIT_EVENT748&&String(row.payload?.staff_user_id||'')===String(staffId));
  const submission=submissions[0]||null;
  const review=submission?rows.find(row=>row.event_type===SHIFT_REVIEW_EVENT748&&row.payload?.submission_id===submission.id)||null:null;
  return {submission:submission?{id:submission.id,created_at:submission.created_at,revision:submission.payload?.revision,summary:submission.payload?.summary,staff_user_id:staffId}:null,
    review:review?{id:review.id,created_at:review.created_at,decision:review.payload?.decision,note:review.payload?.note,actor_name:review.actor_name}:null};
}
async function appendReceipt(env,receipt){
  const res=await fetch(`${env.SUPABASE_URL}/rest/v1/booking_events`,{method:'POST',headers:{...serviceHeaders(env),Prefer:'return=representation'},body:JSON.stringify([receipt])});
  if(!res.ok){
    if(res.status===409){const q=new URLSearchParams({select:'id,event_type,payload',id:`eq.${receipt.id}`,limit:'1'});
      const existing=await fetch(`${env.SUPABASE_URL}/rest/v1/booking_events?${q}`,{headers:serviceHeaders(env)});
      if(existing.ok){const rows=await existing.json().catch(()=>[]);if(rows[0]?.event_type===receipt.event_type&&JSON.stringify(rows[0]?.payload)===JSON.stringify(receipt.payload))return {already_saved:true};}
      throw Error('Receipt conflict: another decision may have been recorded. Reload before retrying.');
    }
    throw Error('Shift receipt outcome unconfirmed. Reload and check the audit before retrying.');
  }
  const rows=await res.json().catch(()=>[]);
  if(!rows[0]?.id)throw Error('Shift receipt may have saved but was not confirmed. Reload before retrying.');
  return {already_saved:false};
}

export async function onRequestPost(context){
  const {request,env}=context,reviewer=context.reviewer748===true;
  try{
    const body=await request.json().catch(()=>({}));
    const action=String(body.action||'').trim();
    const valid=reviewer?['queue','load','review']:['load','punch','submit'];
    if(!valid.includes(action))return scopeError('Unsupported shift action.', 'unsupported_action',400);
    const bookingId=String(body.booking_id||'').trim();
    if(action!=='queue'&&!isUuid(bookingId))return scopeError('Valid booking ID is required.','invalid_booking',400);
    const access=await requireStaffAccess({request,env,body,capability:reviewer?'manage_bookings':'work_booking',bookingId:action==='queue'?null:bookingId,allowLegacyAdminFallback:false});
    if(!access.ok)return access.response;
    if(access.auth_mode!=='session'||!sameOrigin(request))return scopeError('A same-origin signed-in staff session is required.','session_required',403);
    const actor=access.actor||{};
    if(reviewer&&action==='queue'){
      const q=new URLSearchParams({select:'id,booking_id,event_type,payload,created_at,actor_name',event_type:`in.(${SHIFT_SUBMIT_EVENT748},${SHIFT_REVIEW_EVENT748})`,order:'created_at.desc',limit:'120'});
      const res=await fetch(`${env.SUPABASE_URL}/rest/v1/booking_events?${q}`,{headers:serviceHeaders(env)});
      if(!res.ok)return scopeError('Could not read the shift review queue.','queue_unavailable',503);
      const events=await res.json().catch(()=>[]);if(!Array.isArray(events))return scopeError('Queue response unreadable.','queue_unavailable',503);
      const reviews=new Set(events.filter(x=>x.event_type===SHIFT_REVIEW_EVENT748).map(x=>x.payload?.submission_id));
      const queued=events.filter(x=>x.event_type===SHIFT_SUBMIT_EVENT748).map(x=>({id:x.id,booking_id:x.booking_id,staff_user_id:x.payload?.staff_user_id,actor_name:x.actor_name,created_at:x.created_at,revision:x.payload?.revision,
        paid_candidate_minutes:x.payload?.summary?.paid_candidate_minutes||0,reviewed:reviews.has(x.id)}));
      return json({ok:true,build:748,queue:queued,read_only:true,payroll_posted:false});
    }
    const staffId=reviewer?String(body.staff_user_id||'').trim():String(actor.id||'').trim();
    if(!isUuid(staffId))return scopeError('A valid staff identity is required.','staff_scope',400);
    const bookingRes=await fetch(`${env.SUPABASE_URL}/rest/v1/bookings?select=id,current_workflow_stage,job_status,status,assigned_staff_user_id,assigned_staff_email&id=eq.${bookingId}&limit=1`,{headers:serviceHeaders(env)});
    if(!bookingRes.ok)return scopeError('Current booking assignment could not be verified.','booking_unavailable',503);
    const bookingRows=await bookingRes.json().catch(()=>[]),booking=Array.isArray(bookingRows)?bookingRows[0]:null;
    if(!booking)return scopeError('Booking no longer exists.','booking_missing',404);
    if(!reviewer&&!await canWorkMobileBooking745({env,actor,booking}))return scopeError('This job is not currently assigned to you.','assignment_changed',403);
    const rows=await readRows(env,bookingId,staffId),summary=reconcileShift748(rows);
    const receipts=await readReceipts(env,bookingId),receipt=currentReceipts(receipts,staffId);
    if(action==='load')return json({ok:true,build:748,booking_id:bookingId,staff_user_id:staffId,summary,receipt,payroll_posted:false,read_only:true});
    if(action==='punch'){
      const punch=String(body.punch||'').trim(),operationId=String(body.operation_id||'').trim();
      if(!SHIFT_TYPES748[punch]||!isUuid(operationId))return scopeError('Choose a valid punch with one unique operation ID.','invalid_punch',400);
      const old=rows.find(row=>row.id===operationId);
      if(old)return old.entry_type===SHIFT_TYPES748[punch]?json({ok:true,build:748,already_saved:true,summary,receipt}):scopeError('This operation ID belongs to a different punch.','idempotency_conflict');
      if(String(body.expected_revision||'')!==summary.revision)return scopeError('Clock entries changed. Reload and review the latest punches. Nothing was replayed.','stale_shift_revision');
      if(!summary.next_actions.includes(punch))return scopeError(`Cannot ${punch.replaceAll('_',' ')} while ${summary.state}. Review missing punches with Operations.`, 'invalid_transition');
      const stage=String(booking.current_workflow_stage||booking.job_status||booking.status||'').toLowerCase();
      if(punch==='clock_in'&&!['accepted','dispatched','arrived','detailing','paused'].includes(stage))return scopeError('Clock-in is available only for current assigned work.','inactive_job');
      if(summary.issues.some(issue=>!issue.startsWith('No shift clock-in')&&!issue.startsWith('Open ')))return scopeError('Time history has conflicts. Ask Operations to reconcile before another punch.','history_conflict');
      const row={id:operationId,booking_id:bookingId,staff_user_id:staffId,staff_name:actor.full_name||null,created_by_name:actor.full_name||actor.email||'Staff',source:SHIFT_SOURCE748,
        entry_type:SHIFT_TYPES748[punch],minutes:0,event_time:new Date().toISOString(),note:String(cleanText(body.note)||'').slice(0,240)};
      const inserted=await fetch(`${env.SUPABASE_URL}/rest/v1/job_time_entries`,{method:'POST',headers:{...serviceHeaders(env),Prefer:'return=representation'},body:JSON.stringify([row])}).catch(()=>null);
      if(!inserted?.ok){
        if(inserted?.status===409){const existing=await readRows(env,bookingId,staffId);if(existing.some(item=>item.id===operationId&&item.entry_type===row.entry_type))return json({ok:true,build:748,already_saved:true,summary:reconcileShift748(existing)});}
        return scopeError('Punch outcome uncertain. Reload the shift before repeating; no automatic replay.','punch_unconfirmed',503);
      }
      const confirmed=await readRows(env,bookingId,staffId);
      if(!confirmed.some(item=>item.id===operationId))return scopeError('Punch may have saved; reload before repeating.','punch_unconfirmed',503);
      return json({ok:true,build:748,summary:reconcileShift748(confirmed),receipt,current_punch:punch,payroll_posted:false});
    }
    if(String(body.expected_revision||'')!==summary.revision)return scopeError('Clock entries changed. Reload and review the latest punches.','stale_shift_revision');
    if(action==='submit'){
      if(!summary.ready_to_submit)return scopeError('Close all shifts and resolve missing/invalid punches before submitting.','shift_not_ready');
      const id=await stableReceiptId748(['submit',bookingId,staffId,summary.revision]);
      const prior=receipts.find(x=>x.id===id);
      if(prior)return json({ok:true,build:748,already_saved:true,submission_id:id,summary,payroll_posted:false});
      const audit={id,booking_id:bookingId,event_type:SHIFT_SUBMIT_EVENT748,actor_name:actor.full_name||actor.email||'Staff',event_note:'Staff submitted source-linked shift time for independent review; no payroll mutation.',
        payload:{staff_user_id:staffId,actor_id:actor.id,revision:summary.revision,summary:{totals:summary.totals,shift_count:summary.shift_count,paid_candidate_minutes:summary.paid_candidate_minutes,issues:summary.issues},
          source:'job_time_entries',payroll_posted:false,review_status:'pending'}};
      const result=await appendReceipt(env,audit);
      return json({ok:true,build:748,submission_id:id,already_saved:result.already_saved,summary,payroll_posted:false,review_status:'pending'});
    }
    if(action==='review'){
      const submission=receipt.submission;
      if(!submission||String(body.submission_id||'')!==submission.id)return scopeError('Select the latest submitted shift; older submissions cannot be approved.','submission_stale');
      if(receipt.review)return scopeError('This submission already has an independent decision.','already_reviewed');
      if(staffId===String(actor.id))return scopeError('Staff cannot independently approve their own clock record.','self_review',403);
      const decision=String(body.decision||'');
      if(!['accepted','needs_correction'].includes(decision))return scopeError('Choose accepted or needs correction.','invalid_decision',400);
      if(decision==='accepted'&&(submission.revision!==summary.revision||!summary.ready_to_submit))return scopeError('Clock source changed or contains an exception. Return it for reconciliation.','source_revision_changed');
      const note=String(cleanText(body.note)||'').slice(0,500);
      if(note.length<12)return scopeError('Record a clear review reason (at least 12 characters).','review_note_required',400);
      const id=await stableReceiptId748(['review',submission.id]);
      const audit={id,booking_id:bookingId,event_type:SHIFT_REVIEW_EVENT748,actor_name:actor.full_name||actor.email||'Reviewer',
        event_note:decision==='accepted'?'Independent shift source reconciliation accepted; payroll remains separate.':'Shift discrepancy returned for staff correction.',
        payload:{submission_id:submission.id,staff_user_id:staffId,actor_id:actor.id,decision,note,revision:summary.revision,source_revision_matches:submission.revision===summary.revision,
          outstanding_issues:summary.issues,payroll_posted:false}};
      const result=await appendReceipt(env,audit);
      return json({ok:true,build:748,decision,review_id:id,already_saved:result.already_saved,payroll_posted:false});
    }
    return scopeError('Unsupported shift action.','unsupported_action',400);
  }catch(error){return scopeError(error?.message||'Shift reconciliation unavailable. Reload before retrying.','shift_unavailable',503);}
}
