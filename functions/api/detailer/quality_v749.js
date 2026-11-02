import {requireStaffAccess,serviceHeaders,json,isUuid,cleanText} from '../_lib/staff-auth.js';
import {canWorkMobileBooking745} from '../_lib/detailer-mobile-scope-v745.js';
import {QC_EVENT749,QC_ITEMS749,QC_TYPES749,QC_MUST_PASS749,qcReceiptId749} from '../_lib/quality-v749.js';
import {qualitySnapshot749,saveQualityReceipt749} from '../_lib/quality-store-v749.js';

const answer=(code,error,status=409)=>json({ok:false,build:749,code,error},status);
const clean=(v,n=350)=>String(cleanText(v)||'').slice(0,n);
const sameOrigin=request=>request.headers.get('origin')===new URL(request.url).origin;

export async function onRequestPost(context){
  const {request,env}=context,reviewer=context.reviewer749===true;
  try{
    const body=await request.json().catch(()=>({})),action=String(body.action||'').trim();
    if(!(reviewer?['queue','load','review','resolve']:['load','check','issue','submit']).includes(action))return answer('unsupported_action','Unsupported quality action.',400);
    const bookingId=String(body.booking_id||'').trim();
    if(action!=='queue'&&!isUuid(bookingId))return answer('invalid_booking','A valid booking is required.',400);
    const access=await requireStaffAccess({request,env,body,capability:reviewer?'manage_bookings':'work_booking',bookingId:action==='queue'?null:bookingId,allowLegacyAdminFallback:false});
    if(!access.ok)return access.response;
    if(access.auth_mode!=='session'||!sameOrigin(request))return answer('session_required','A same-origin signed-in staff session is required.',403);
    const actor=access.actor;
    if(reviewer&&action==='queue'){
      const q=new URLSearchParams({select:'id,booking_id,event_type,payload,actor_name,created_at',event_type:`in.(${QC_EVENT749.submit},${QC_EVENT749.review},${QC_EVENT749.issue})`,order:'created_at.desc',limit:'200'});
      const res=await fetch(`${env.SUPABASE_URL}/rest/v1/booking_events?${q}`,{headers:serviceHeaders(env)});
      if(!res.ok)return answer('queue_unavailable','Could not verify quality review queue.',503);
      const events=await res.json().catch(()=>[]);
      if(!Array.isArray(events)||events.length>=200)return answer('queue_incomplete','Quality queue exceeded the safe read limit. Escalate to Operations.',503);
      const decisions=new Set(events.filter(x=>x.event_type===QC_EVENT749.review).map(x=>x.payload?.submission_id));
      const queue=events.filter(x=>x.event_type===QC_EVENT749.submit).map(x=>({id:x.id,booking_id:x.booking_id,submitted_at:x.created_at,staff_name:x.actor_name,staff_user_id:x.payload?.staff_user_id,reviewed:decisions.has(x.id)}));
      const exceptions=events.filter(x=>x.event_type===QC_EVENT749.issue).map(x=>({booking_id:x.booking_id,issue_id:x.id,kind:x.payload?.kind,opened_at:x.created_at}));
      return json({ok:true,build:749,queue,exceptions,read_only:true});
    }
    const bookingRes=await fetch(`${env.SUPABASE_URL}/rest/v1/bookings?select=id,assigned_staff_user_id,assigned_staff_email,current_workflow_stage,job_status,status&id=eq.${bookingId}&limit=1`,{headers:serviceHeaders(env)});
    if(!bookingRes.ok)return answer('booking_unavailable','Could not verify current booking.',503);
    const booking=(await bookingRes.json().catch(()=>[]))?.[0];
    if(!booking)return answer('booking_missing','Booking was not found.',404);
    if(!reviewer&&!await canWorkMobileBooking745({env,actor,booking}))return answer('assignment_changed','This job is no longer assigned to you.',403);
    const {events,media,summary}=await qualitySnapshot749(env,bookingId);
    if(action==='load')return json({ok:true,build:749,booking_id:bookingId,summary,read_only:true,customer_signed:false});
    if(!reviewer&&['check','issue'].includes(action)){
      const existing=events.find(x=>x.id===String(body.operation_id||''));
      if(existing){
        const p=existing.payload||{},matches=action==='check'?existing.event_type===QC_EVENT749.check&&p.actor_id===actor.id&&p.phase===body.phase&&p.item===body.item&&p.result===body.result&&p.note===clean(body.note):
          existing.event_type===QC_EVENT749.issue&&p.actor_id===actor.id&&p.kind===body.kind&&p.note===clean(body.note,650)&&p.evidence_id===(String(body.evidence_id||'').trim()||null);
        return matches?json({ok:true,build:749,already_saved:true,summary}):answer('idempotency_conflict','Operation ID was already used for different quality evidence. Reload and inspect the original receipt.');
      }
    }
    if(String(body.expected_revision||'')!==summary.revision)return answer('stale_revision','Quality evidence changed. Reload the original record; no change was saved.');
    const actorName=actor.full_name||actor.email||'Staff';
    const receipt=(id,type,note,payload)=>({id,booking_id:bookingId,event_type:type,actor_name:actorName,event_note:note,payload:{...payload,actor_id:actor.id,build:749,customer_signature:false,customer_notified:false}});
    if(!reviewer&&['check','issue'].includes(action)){
      const operationId=String(body.operation_id||'');if(!isUuid(operationId))return answer('operation_id','A unique operation ID is required.',400);
      if(summary.approved&&action==='check')return answer('approved_locked','Approved checks are locked. Open a documented quality exception first.');
      let row;
      if(action==='check'){
        const phase=String(body.phase||''),item=String(body.item||''),result=String(body.result||''),note=clean(body.note);
        if(!QC_ITEMS749[phase]?.includes(item)||!['pass','needs_rework','not_applicable'].includes(result))return answer('invalid_check','Select a required item and result.',400);
        const stage=String(booking.current_workflow_stage||booking.job_status||booking.status||'').toLowerCase();
        if(phase==='after'&&!['detailing','paused','awaiting_payment','completed'].includes(stage))return answer('after_check_early','After-service quality checks require an active or completed detail, not a pre-work assignment.');
        if(result==='not_applicable'&&QC_MUST_PASS749.includes(item))return answer('required_check','Service scope, worksite safety and final walkaround must be positively checked; use a private exception if blocked.',400);
        if(result!=='pass'&&note.length<12)return answer('check_reason_required','Record a specific reason for rework or not-applicable (12+ characters).',400);
        row=receipt(operationId,QC_EVENT749.check,`Staff ${phase} quality check: ${item} = ${result}`,{phase,item,result,note});
      }else{
        const kind=String(body.kind||''),note=clean(body.note,650),evidenceId=String(body.evidence_id||'').trim();
        if(!QC_TYPES749.includes(kind)||note.length<15)return answer('issue_invalid','Select a concern and give a factual description of at least 15 characters.',400);
        if(evidenceId&&!isUuid(evidenceId))return answer('issue_evidence','Evidence reference must be a valid job-media ID.',400);
        if(evidenceId&&!media.some(x=>x.id===evidenceId))return answer('issue_evidence_scope','Evidence is not attached to this booking.',403);
        row=receipt(operationId,QC_EVENT749.issue,'Private quality exception — Operations review required.',{kind,note,evidence_id:evidenceId||null});
      }
      const saved=await saveQualityReceipt749(env,row);const current=await qualitySnapshot749(env,bookingId);
      return json({ok:true,build:749,already_saved:saved.duplicate,summary:current.summary,customer_notified:false});
    }
    if(!reviewer&&action==='submit'){
      if(!summary.source_ready)return answer('quality_incomplete','Finish every pre/post check, correct exceptions and verify private before/after photos before submitting.');
      if(summary.submitted?.revision===summary.revision)return json({ok:true,already_saved:true,build:749,summary});
      const id=await qcReceiptId749(['submit',bookingId,actor.id,summary.revision]);
      const row=receipt(id,QC_EVENT749.submit,'Staff quality packet submitted for independent manager decision; customer sign-off not implied.',{staff_user_id:actor.id,revision:summary.revision});
      const saved=await saveQualityReceipt749(env,row);
      return json({ok:true,build:749,submitted_id:id,already_saved:saved.duplicate,summary:(await qualitySnapshot749(env,bookingId)).summary});
    }
    if(reviewer&&action==='resolve'){
      const issueId=String(body.issue_id||''),evidenceId=String(body.evidence_id||''),note=clean(body.note,650),operationId=String(body.operation_id||'');
      if(!isUuid(issueId)||!isUuid(evidenceId)||!isUuid(operationId)||note.length<15)return answer('resolution_required','Choose an issue and real job-photo evidence, then document rework verification.',400);
      const issue=summary.issues.find(x=>x.id===issueId&&!x.resolved);
      if(!issue||!['rework','missing_step'].includes(issue.kind))return answer('resolution_scope','This issue cannot be closed as rework; damage and customer claims require their separate authorized process.');
      if(issue.opened_by===actor.id)return answer('independent_review_required','The person opening an exception cannot independently verify its closure.',403);
      if(!media.some(x=>x.id===evidenceId&&x.visibility==='internal'&&x.review_status!=='rejected'&&
        !['hidden','removed'].includes(x.thread_status)&&Date.parse(x.created_at||'')>Date.parse(issue.opened_at||'')))
        return answer('evidence_missing','Choose valid private job-photo evidence captured after this issue was opened.',403);
      const row=receipt(operationId,QC_EVENT749.resolve,'Independent rework check recorded; no claim, refund or customer decision.',{issue_id:issueId,evidence_id:evidenceId,note});
      const saved=await saveQualityReceipt749(env,row);
      return json({ok:true,build:749,already_saved:saved.duplicate,summary:(await qualitySnapshot749(env,bookingId)).summary});
    }
    if(reviewer&&action==='review'){
      const submission=summary.submitted,decision=String(body.decision||''),note=clean(body.note,600);
      if(!submission||submission.id!==String(body.submission_id||''))return answer('submission_stale','Load and review the latest submission.');
      if(summary.review)return answer('already_reviewed','This submission already has a decision. Staff must correct and resubmit a new source revision.');
      if(submission.staff_user_id===actor.id)return answer('self_review','Staff cannot approve their own quality packet.',403);
      if(!['accepted','needs_rework'].includes(decision)||note.length<12)return answer('review_reason_required','Select a decision and explain it in at least 12 characters.',400);
      if(decision==='accepted'&&(!summary.source_ready||submission.revision!==summary.revision))return answer('source_changed','Quality evidence is incomplete or changed after submission; request rework.');
      const id=await qcReceiptId749(['review',submission.id]);
      const row=receipt(id,QC_EVENT749.review,'Independent quality decision saved; customer signature and notifications remain separate.',{submission_id:submission.id,decision,note,revision:summary.revision});
      const saved=await saveQualityReceipt749(env,row);
      return json({ok:true,build:749,already_saved:saved.duplicate,summary:(await qualitySnapshot749(env,bookingId)).summary,customer_notified:false});
    }
    return answer('unsupported_action','Unsupported quality action.',400);
  }catch(error){return answer('quality_unavailable',error?.message||'Quality source unavailable; no automatic retry.',503);}
}
