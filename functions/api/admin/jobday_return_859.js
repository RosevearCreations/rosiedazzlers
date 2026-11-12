// Rosie 859 — protected original-owner independent escalation return, decision
// and long-lived source-local HOLD continuity. Never sends to external receivers.
import {requireStaffAccess,json,isUuid} from '../_lib/staff-auth.js';
import {rest,clean,serviceReady} from '../_lib/creative-projects.js';
import {ownerActor842,SOURCE_TYPE_842} from '../_lib/jobday-social-842.js';
import {INCIDENT_AUDIT_853,incidentReference853,escalationRouting853} from '../_lib/jobday-replay-853.js';
import {conflictAging857} from '../_lib/jobday-custody-857.js';
import {CONTRACT_859,HOLD_859,ACTIONS_859,hash859,verifyReturn859,returnedPlanes859,
 ownerDecision859,continuity859,digest859,continuityExport859} from '../_lib/jobday-return-859.js';
const fail=(error,status=409)=>json({ok:false,build:859,decision:'HOLD',error,...HOLD_859},status);
const safeTx=v=>typeof v==='string'&&/^[A-Za-z0-9][A-Za-z0-9_-]{11,95}$/.test(v);
const safeNonce=v=>typeof v==='string'&&/^[A-Za-z0-9_-]{20,100}$/.test(v);
const sha40=v=>typeof v==='string'&&/^[a-f0-9]{40}$/.test(v);
const scopedAudit=(rows,caseId,postId,incident)=>rows.find(x=>
 x.safe_note?.startsWith(INCIDENT_AUDIT_853+' case '+caseId+'; post '+postId+';')&&
 x.safe_note.includes(' incident '+incident+';'));
async function persist(env,{project,bookingId,post,tx,readback,handoff,ownerExport,
 kind,plane=null,revision,receipt=null,signer=null,observedAt=null,digest,nonce,aging,
 action=null,decisionId=null,previous=null,status=null,actor}){
 const fields={p_project_id:project.id,p_booking_id:bookingId,p_post_id:post.id,
 p_transaction_review_id:tx.id,p_prior_857_readback_id:readback.id,
 p_handoff_858_id:handoff.id,p_owner_export_858_id:ownerExport.id,
 p_kind:kind,p_plane:plane,p_review_source_revision:revision,p_receipt_sha256:receipt,
 p_signer_id:signer,p_receipt_observed_at:observedAt,
 p_review_digest_sha256:digest,p_review_nonce:nonce,
 p_conflict_aging_status:aging.conflict_aging_status,p_open_conflict_count:aging.open_conflict_count,
 p_owner_action:action,p_owner_decision_859_id:decisionId,
 p_previous_checkpoint_id:previous?.id||null,
 p_previous_checkpoint_sha256:previous?.review_digest_sha256||null,
 p_continuity_status:status,p_actor_staff_email:actor};
 const rows=await rest(env,'rpc/rosie859_append_incident_continuity',
 {method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify(fields)});
 if(!Array.isArray(rows)||rows.length!==1||rows[0].outcome!=='INSERTED'||!isUuid(rows[0].review_id))
  throw Error('Immutable independent return, owner review or daily continuity replay rejected; HOLD.');
 return {id:rows[0].review_id,recorded_at:rows[0].accepted_at};
}
export const onRequestOptions=()=>new Response('',{status:204});
export async function onRequest({request,env}){
 if(!['GET','POST'].includes(request.method))return fail('Original owner GET/POST only.',405);
 if(Number(request.headers.get('content-length'))>16000)return fail('Signed return payload too large.',413);
 const raw=request.method==='POST'?await request.text().catch(()=>''):'';
 if(raw.length>16000)return fail('Signed return payload too large.',413);
 let body={};
 if(request.method==='POST'){
  try{body=JSON.parse(raw);if(!body||typeof body!=='object'||Array.isArray(body))throw Error();}
  catch{return fail('JSON object required.',400);}
 }
 const url=new URL(request.url),bookingId=clean(body.booking_id||url.searchParams.get('booking_id'),80);
 if(!isUuid(bookingId))return fail('Exact original booking UUID required.',400);
 const auth=await requireStaffAccess({request,env,body,capability:'manage_staff',allowLegacyAdminFallback:false});
 if(!auth.ok)return auth.response;
 if(auth.auth_mode!=='session'||!ownerActor842(auth.actor))
  return fail('Signed-in original Rosie owner only; no bridge or legacy fallback.',403);
 if(!serviceReady(env)||!sha40(env?.CF_PAGES_COMMIT_SHA))
  return fail('Private Rosie database or current deployment identity unavailable.',503);
 try{
  const [bookings,projects,posts]=await Promise.all([
   rest(env,'bookings?select=id&id=eq.'+encodeURIComponent(bookingId)+'&limit=1'),
   rest(env,'creative_projects?select=id,consent_status,public_publish_allowed&source_booking_id=eq.'+
    encodeURIComponent(bookingId)+'&limit=2'),
   rest(env,'social_post_queue?select=id,platform,source_type&booking_id=eq.'+
    encodeURIComponent(bookingId)+'&source_type=eq.'+SOURCE_TYPE_842+'&order=created_at.desc&limit=21')
  ]);
  if(bookings?.length!==1||projects?.length!==1||!Array.isArray(posts)||!posts.length||posts.length>=21)
   return fail('Exact booking, unique original project and bounded post source required.');
  const project=projects[0];
  const [audits,revocations,transactions,conflicts,readbacks,recovery]=await Promise.all([
   rest(env,'creative_project_audit?select=id,safe_note,created_at&project_id=eq.'+
    encodeURIComponent(project.id)+'&event_type=eq.updated&order=created_at.desc&limit=250'),
   rest(env,'creative_project_audit?select=id&project_id=eq.'+encodeURIComponent(project.id)+
    '&event_type=eq.updated&safe_note=like.'+encodeURIComponent('Build 843 consent revoked:*')+'&limit=1'),
   rest(env,'rosie_master_transaction_review_v855?select=id,project_id,booking_id,post_id,case_reference,incident_reference,transaction_reference,recorded_at&project_id=eq.'+
    encodeURIComponent(project.id)+'&order=recorded_at.desc&limit=100'),
   rest(env,'rosie_delivery_conflict_evidence_v856?select=id,transaction_review_id,kind,recorded_at&project_id=eq.'+
    encodeURIComponent(project.id)+'&order=recorded_at.desc&limit=100'),
   rest(env,'rosie_custody_readback_v857?select=id,transaction_review_id,kind,review_digest_sha256,recorded_at&project_id=eq.'+
    encodeURIComponent(project.id)+'&order=recorded_at.desc&limit=100'),
   rest(env,'rosie_recovery_custody_v858?select=id,transaction_review_id,prior_857_readback_id,kind,review_digest_sha256,source_revision,recorded_at&project_id=eq.'+
    encodeURIComponent(project.id)+'&order=recorded_at.desc&limit=100')
  ]);
  if(!Array.isArray(audits)||audits.length>=250||!Array.isArray(revocations)||
   !Array.isArray(transactions)||transactions.length>=100||!Array.isArray(conflicts)||conflicts.length>=100||
   !Array.isArray(readbacks)||readbacks.length>=100||!Array.isArray(recovery)||recovery.length>=100)
   return fail('Incomplete original source evidence window; HOLD.',503);
  const revoked=revocations.length>0&&
   (project.consent_status!=='approved_public'||project.public_publish_allowed!==true);
  const expected=String(env?.ROSIE_RECALL_EXPECTED_PLATFORMS_852||'').split(',').map(s=>s.trim()).filter(Boolean);
  const attempts=await Promise.all(posts.map(p=>rest(env,'social_dispatch_attempts?select=id,status,platform,created_at,request_summary,response_summary&social_post_id=eq.'+
   encodeURIComponent(p.id)+'&order=created_at.desc&limit=200')));
  if(attempts.some(a=>!Array.isArray(a)||a.length>=200))return fail('Incomplete dispatch attempt history.',503);
  const routing=escalationRouting853(posts.map((p,i)=>({post_id:p.id,platform:p.platform,attempts:attempts[i]})),
   {expectedPlatforms:expected,revoked});
  if(!revoked||routing.decision!=='ROUTING_REVIEW_ONLY')
   return fail('Original explicit consent revocation and review-only route required.');
  const src=request.method==='POST'?body:Object.fromEntries(url.searchParams);
  const postId=clean(src.post_id,80),caseId=clean(src.owner_case_reference,80),
   incident=clean(src.incident_reference,80),txRef=clean(src.transaction_reference,96);
  if(!isUuid(postId)||!incidentReference853(caseId)||!incidentReference853(incident)||!safeTx(txRef))
   return fail('Exact post, original case, incident and transaction reference required.',400);
  const post=posts.find(p=>p.id===postId),originalOwner=scopedAudit(audits,caseId,postId,incident);
  if(!post||!originalOwner)return fail('Original scoped incident owner audit required.');
  const route=routing.routes.find(r=>r.platform===post.platform),
   originalPriority=/ priority ([A-Z]+);/.exec(originalOwner.safe_note)?.[1],
   originalRoute=/ route ([A-Z0-9_]+);/.exec(originalOwner.safe_note)?.[1];
  if(!route||originalPriority!==route.priority||originalRoute!==route.route)
   return fail('Original priority or route drift; independent source review required.');
  const selected=transactions.filter(t=>t.booking_id===bookingId&&t.post_id===postId&&
   t.case_reference===caseId&&t.incident_reference===incident&&t.transaction_reference===txRef);
  if(selected.length!==1)return fail('One original immutable 855 Master transaction required.');
  const tx=selected[0],readbackRows=readbacks.filter(r=>r.transaction_review_id===tx.id&&
   r.kind==='owner_acceptance_readback');
  if(readbackRows.length!==1)return fail('Original unique 857 owner readback required.');
  const readback=readbackRows[0];
  const handoffs=recovery.filter(r=>r.transaction_review_id===tx.id&&r.kind==='conflict_escalation_handoff');
  const ownerExports=recovery.filter(r=>r.transaction_review_id===tx.id&&r.kind==='owner_recovery_acceptance_export');
  if(handoffs.length!==1||ownerExports.length!==1||
   handoffs[0].prior_857_readback_id!==readback.id||
   ownerExports[0].prior_857_readback_id!==readback.id||
   handoffs[0].source_revision!==ownerExports[0].source_revision)
   return fail('Matching immutable 858 handoff and owner recovery export required.');
  const handoff=handoffs[0],ownerExport=ownerExports[0],
    originalConflicts=conflicts.filter(c=>c.transaction_review_id===tx.id&&c.kind==='replay_conflict_review');
  const aging=conflictAging857({conflicts:originalConflicts,priority:originalPriority});
  if(aging.decision!=='AGING_REVIEW_ONLY'||!(aging.open_conflict_count>0))
   return fail('Bounded still-open source escalation conflict and age required.');
  // Query 859 by exact transaction, not project-wide. Daily history is append-only:
  // retain only last 25 checkpoints for response, not a claim to full historical export.
  const suffix='&transaction_review_id=eq.'+encodeURIComponent(tx.id);
  const [reviews,checkpoints]=await Promise.all([
   rest(env,'rosie_incident_continuity_v859?select=id,kind,plane,transaction_review_id,handoff_858_id,owner_export_858_id,review_source_revision,receipt_sha256,signer_id,review_digest_sha256,owner_action,recorded_at'+
    suffix+'&kind=neq.incident_continuity_checkpoint&order=recorded_at.desc&limit=100'),
   rest(env,'rosie_incident_continuity_v859?select=id,kind,transaction_review_id,owner_decision_859_id,previous_checkpoint_id,previous_checkpoint_sha256,review_digest_sha256,continuity_status,recorded_at'+
    suffix+'&kind=eq.incident_continuity_checkpoint&order=recorded_at.desc&limit=25')
  ]);
  if(!Array.isArray(reviews)||reviews.length>=100||!Array.isArray(checkpoints))
   return fail('Source independent return/decision evidence unavailable or truncated.',503);
  const rows=reviews.filter(r=>r.transaction_review_id===tx.id);
  const existingDecision=rows.filter(r=>r.kind==='owner_recovery_decision');
  if(existingDecision.length>1)return fail('Conflicting owner decision custody; HOLD.');
  const decision=existingDecision[0]||null;
  const returned=returnedPlanes859({records:rows,transaction:tx,handoff,
   reviewRevision:decision?.review_source_revision||env.CF_PAGES_COMMIT_SHA});
  const previous=checkpoints[0]||null;
  const continuity=decision?continuity859({decision,previous,aging}):
   {decision:'HOLD',reason:'ORIGINAL_OWNER_DECISION_NOT_RECORDED',...HOLD_859};
  if(request.method==='GET'){
   return json({ok:true,build:859,contract:CONTRACT_859,transaction_reference:txRef,
    source_revision:env.CF_PAGES_COMMIT_SHA,handoff_id:handoff.id,
    returned_plane_review:returned,original_conflict_aging:aging,
    owner_recovery_decision:decision?{id:decision.id,recorded_at:decision.recorded_at,
      review_digest_sha256:decision.review_digest_sha256,owner_action:decision.owner_action}:null,
    continuity_assessment:continuity,
    checkpoint_window:checkpoints.map(c=>({id:c.id,recorded_at:c.recorded_at,
      previous_checkpoint_id:c.previous_checkpoint_id,continuity_status:c.continuity_status,
      review_digest_sha256:c.review_digest_sha256})),
    checkpoint_window_may_be_truncated:checkpoints.length>=25,...HOLD_859});
  }
  const nonce=clean(body.review_nonce,100);
  if(!safeNonce(nonce))return fail('New unique original review nonce 20–100 characters required.',400);
  const actor=clean(auth.actor?.email,140)||clean(auth.actor?.id,140)||'OriginalOwner';
  const common={project,bookingId,post,tx,readback,handoff,ownerExport,
   revision:env.CF_PAGES_COMMIT_SHA,nonce,aging,actor};
  if(body.action==='record_independent_escalation_return'){
   if(body.confirm_independent_ed25519_return_verification!==true||
     body.acknowledge_receiver_observation_not_operational_ack!==true)
    return fail('Explicit non-authorizing independent signature verification acknowledgements required.');
   const plane=clean(body.plane,40);
   const checked=await verifyReturn859(env,body.receipt||{},body.signature,
    {plane,transaction:tx,handoff,bookingId,projectId:project.id,post,caseReference:caseId,
     incidentReference:incident,readback,actor,now:Date.now()});
   if(!checked.ok)return fail(checked.reason);
   const digest=await digest859({kind:'signed_escalation_return',transaction:tx,handoff,
    returns:checked,aging,nonce});
   const saved=await persist(env,{...common,kind:'signed_escalation_return',plane,
    receipt:checked.receipt_sha256,signer:checked.signer_id,
    observedAt:checked.observed_at,digest});
   return json({ok:true,build:859,record_id:saved.id,recorded_at:saved.recorded_at,
    review_digest_sha256:digest,receipt_sha256:checked.receipt_sha256,plane,
    decision:checked.decision,...HOLD_859});
  }
  if(body.action==='record_original_owner_recovery_decision'){
   if(body.confirm_both_signed_escalation_returns!==true||
    body.acknowledge_unresolved_master_and_incident_hold!==true)
    return fail('Original owner must acknowledge both independent signed returns and operational HOLD.');
   const action=clean(body.owner_action,60);
   const assessment=ownerDecision859({transaction:tx,readback,handoff,ownerExport,
    returns:returned,aging,ownerAction:action});
   if(assessment.decision!=='ORIGINAL_OWNER_RECOVERY_DECISION_HOLD_ONLY')
    return fail('Original owner recovery still HOLD: '+assessment.reasons.join(', '));
   const digest=await digest859({kind:'owner_recovery_decision',transaction:tx,handoff,
    returns:returned,aging,action,nonce});
   const saved=await persist(env,{...common,kind:'owner_recovery_decision',digest,action});
   return json({ok:true,build:859,record_id:saved.id,recorded_at:saved.recorded_at,
    review_digest_sha256:digest,...assessment});
  }
  if(body.action==='record_incident_continuity_checkpoint'){
   if(body.confirm_owner_incident_still_open!==true||body.acknowledge_no_external_resolution!==true)
    return fail('Explicit original owner continuing HOLD confirmation required.');
   if(!decision)return fail('Original 859 owner recovery decision required.');
   if(continuity.decision!=='LONG_LIVED_INCIDENT_HOLD_CHECKPOINT')
    return fail('Original immutable daily continuity predecessor not verified.');
   const digest=await digest859({kind:'incident_continuity_checkpoint',transaction:tx,
    handoff,decision,aging,nonce,previous,status:continuity.continuity_status});
   const saved=await persist(env,{...common,kind:'incident_continuity_checkpoint',
    decisionId:decision.id,previous,status:continuity.continuity_status,digest});
   return json({ok:true,build:859,record_id:saved.id,recorded_at:saved.recorded_at,
    review_digest_sha256:digest,continuity_status:continuity.continuity_status,
    decision:'LONG_LIVED_INCIDENT_HOLD_CHECKPOINT',...HOLD_859});
  }
  if(body.action==='export_owner_incident_continuity'){
   if(body.confirm_private_owner_export_review!==true||!decision)
    return fail('Original recorded owner decision and explicit private export review required.');
   const out=await continuityExport859({transaction:tx,handoff,returns:returned,
    ownerDecision:decision,checkpoints,aging});
   return json({ok:true,build:859,decision:'PRIVATE_ORIGINAL_OWNER_INCIDENT_EXPORT_HOLD_ONLY',
    bundle:out.bundle,bundle_sha256:out.sha256,
    checkpoint_window_may_be_truncated:checkpoints.length>=25,...HOLD_859});
  }
  return fail('Unsupported original owner Build 859 action.',405);
 }catch(e){return fail(e?.message||'Original source protected 859 custody unavailable.',503);}
}
