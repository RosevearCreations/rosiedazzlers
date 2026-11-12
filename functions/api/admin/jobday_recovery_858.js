// Build 858: signed current-source recheck, source-custodied conflict handoff,
// and original-owner non-authorizing recovery export. No remote sends or grants.
import {requireStaffAccess,json,isUuid} from '../_lib/staff-auth.js';
import {rest,clean,serviceReady} from '../_lib/creative-projects.js';
import {ownerActor842,SOURCE_TYPE_842} from '../_lib/jobday-social-842.js';
import {INCIDENT_AUDIT_853,incidentReference853,escalationRouting853} from '../_lib/jobday-replay-853.js';
import {conflictAging857} from '../_lib/jobday-custody-857.js';
import {CONTRACT_858,HOLD_858,hash858,checkFreshReceipt858,crossPlaneFreshness858,
 handoffAssessment858,recoveryExport858,EXPORT_ACTIONS_858} from '../_lib/jobday-recovery-858.js';
const fail=(error,status=409)=>json({ok:false,build:858,error,decision:'HOLD',...HOLD_858},status);
const safeTx=v=>typeof v==='string'&&/^[A-Za-z0-9][A-Za-z0-9_-]{11,95}$/.test(v);
const safeNonce=v=>typeof v==='string'&&/^[A-Za-z0-9_-]{20,100}$/.test(v);
const scope=(a,b)=>'case '+a+'; post '+b+';';
const originalAudit=(rows,a,b,i)=>rows.find(x=>x.safe_note?.startsWith(INCIDENT_AUDIT_853+' '+scope(a,b))&&
 x.safe_note.includes(' incident '+i+';'));
const sha40=v=>typeof v==='string'&&/^[a-f0-9]{40}$/.test(v);
async function persist(env,{project,bookingId,post,transaction,readback,kind,plane=null,
 receiptSha=null,observedAt=null,revision,digest,nonce,aging,ownerAction=null,actor}){
 const fields={p_project_id:project.id,p_booking_id:bookingId,p_post_id:post.id,
 p_transaction_review_id:transaction.id,p_prior_857_readback_id:readback.id,
 p_case_reference:transaction.case_reference,p_incident_reference:transaction.incident_reference,
 p_transaction_reference:transaction.transaction_reference,p_kind:kind,p_plane:plane,
 p_source_revision:revision,p_receipt_sha256:receiptSha,p_receipt_observed_at:observedAt,
 p_review_digest_sha256:digest,p_review_nonce:nonce,
 p_conflict_aging_status:aging.conflict_aging_status,p_open_conflict_count:aging.open_conflict_count,
 p_owner_action:ownerAction,p_actor_staff_email:actor};
 const rows=await rest(env,'rpc/rosie858_append_recovery_custody',{method:'POST',
   headers:{Prefer:'return=representation'},body:JSON.stringify(fields)});
 if(!Array.isArray(rows)||rows.length!==1||rows[0].outcome!=='INSERTED'||!isUuid(rows[0].review_id))
   throw Error('Immutable receipt/handoff/owner export duplicate or source drift; HOLD.');
 return {id:rows[0].review_id,recorded_at:rows[0].accepted_at};
}
export const onRequestOptions=()=>new Response('',{status:204});
export async function onRequest({request,env}){
 if(!['GET','POST'].includes(request.method))return fail('Original-owner GET/POST only.',405);
 if(Number(request.headers.get('content-length'))>15000)return fail('Source evidence too large.',413);
 const raw=request.method==='POST'?await request.text().catch(()=>''):'';
 if(raw.length>15000)return fail('Source evidence too large.',413);
 let body={};
 if(request.method==='POST'){
  try{body=JSON.parse(raw);if(!body||typeof body!=='object'||Array.isArray(body))throw Error();}
  catch{return fail('JSON object required.',400);}
 }
 const url=new URL(request.url);
 const bookingId=clean(body.booking_id||url.searchParams.get('booking_id'),80);
 if(!isUuid(bookingId))return fail('Exact original booking UUID required.',400);
 const auth=await requireStaffAccess({request,env,body,capability:'manage_staff',allowLegacyAdminFallback:false});
 if(!auth.ok)return auth.response;
 if(auth.auth_mode!=='session'||!ownerActor842(auth.actor))
  return fail('Signed-in original Rosie owner required, never legacy bridge authority.',403);
 if(!serviceReady(env))return fail('Original private Rosie evidence database unavailable.',503);
 if(!sha40(env?.CF_PAGES_COMMIT_SHA))return fail('Current production source revision cannot be proven.',503);
 try{
  const [bookings,projects,posts]=await Promise.all([
   rest(env,'bookings?select=id&id=eq.'+encodeURIComponent(bookingId)+'&limit=1'),
   rest(env,'creative_projects?select=id,consent_status,public_publish_allowed&source_booking_id=eq.'+encodeURIComponent(bookingId)+'&limit=2'),
   rest(env,'social_post_queue?select=id,platform,source_type&booking_id=eq.'+encodeURIComponent(bookingId)+
    '&source_type=eq.'+SOURCE_TYPE_842+'&order=created_at.desc&limit=21')
  ]);
  if(bookings?.length!==1||projects?.length!==1||!Array.isArray(posts)||!posts.length||posts.length>=21)
    return fail('Exact booking/project and complete bounded post source required.');
  const project=projects[0];
  const [audits,revocations,transactions,evidence,readbacks,recovery]=await Promise.all([
   rest(env,'creative_project_audit?select=id,safe_note,created_at&project_id=eq.'+
    encodeURIComponent(project.id)+'&event_type=eq.updated&order=created_at.desc&limit=250'),
   rest(env,'creative_project_audit?select=id&project_id=eq.'+encodeURIComponent(project.id)+
    '&event_type=eq.updated&safe_note=like.'+encodeURIComponent('Build 843 consent revoked:*')+'&limit=1'),
   rest(env,'rosie_master_transaction_review_v855?select=id,project_id,booking_id,post_id,case_reference,incident_reference,transaction_reference,source_revision,ai_data_nonce,comms_nonce,ai_data_sha256,comms_sha256,recorded_at&project_id=eq.'+
    encodeURIComponent(project.id)+'&order=recorded_at.desc&limit=100'),
   rest(env,'rosie_delivery_conflict_evidence_v856?select=id,transaction_review_id,kind,plane,recorded_at&project_id=eq.'+
    encodeURIComponent(project.id)+'&order=recorded_at.desc&limit=100'),
   rest(env,'rosie_custody_readback_v857?select=id,transaction_review_id,kind,review_digest_sha256,recorded_at&project_id=eq.'+
    encodeURIComponent(project.id)+'&order=recorded_at.desc&limit=100'),
   rest(env,'rosie_recovery_custody_v858?select=id,transaction_review_id,prior_857_readback_id,kind,plane,receipt_sha256,receipt_observed_at,source_revision,review_digest_sha256,owner_action,recorded_at&project_id=eq.'+
    encodeURIComponent(project.id)+'&order=recorded_at.desc&limit=100')
  ]);
  if(!Array.isArray(audits)||audits.length>=250||!Array.isArray(revocations)||
   !Array.isArray(transactions)||transactions.length>=100||!Array.isArray(evidence)||evidence.length>=100||
   !Array.isArray(readbacks)||readbacks.length>=100||!Array.isArray(recovery)||recovery.length>=100)
   return fail('Original evidence window truncated or database unavailable; HOLD.',503);
  const revoked=revocations.length>0&&
    (project.consent_status!=='approved_public'||project.public_publish_allowed!==true);
  const expected=String(env?.ROSIE_RECALL_EXPECTED_PLATFORMS_852||'').split(',').map(s=>s.trim()).filter(Boolean);
  const attempts=await Promise.all(posts.map(p=>rest(env,'social_dispatch_attempts?select=id,status,platform,created_at,request_summary,response_summary&social_post_id=eq.'+
   encodeURIComponent(p.id)+'&order=created_at.desc&limit=200')));
  if(attempts.some(a=>!Array.isArray(a)||a.length>=200))return fail('Original dispatch attempt evidence incomplete.',503);
  const routing=escalationRouting853(posts.map((p,i)=>({post_id:p.id,platform:p.platform,attempts:attempts[i]})),
   {expectedPlatforms:expected,revoked});
  if(!revoked||routing.decision!=='ROUTING_REVIEW_ONLY')
    return fail('Explicit owner consent revocation and scoped source route review required.');
  const src=request.method==='POST'?body:Object.fromEntries(url.searchParams);
  const postId=clean(src.post_id,80),caseId=clean(src.owner_case_reference,80),
    incident=clean(src.incident_reference,80),txRef=clean(src.transaction_reference,96);
  if(!isUuid(postId)||!incidentReference853(caseId)||!incidentReference853(incident)||!safeTx(txRef))
    return fail('Exact post/case/incident/transaction identifiers required.',400);
  const post=posts.find(p=>p.id===postId),owner=originalAudit(audits,caseId,postId,incident);
  if(!post||!owner)return fail('Original source incident owner audit required.');
  const current=routing.routes.find(r=>r.platform===post.platform);
  const priority=/ priority ([A-Z]+);/.exec(owner.safe_note)?.[1];
  const route=/ route ([A-Z0-9_]+);/.exec(owner.safe_note)?.[1];
  if(!current||current.priority!==priority||current.route!==route)
    return fail('Source incident priority/route drift; requires independent re-evaluation.');
  const selected=transactions.filter(t=>t.booking_id===bookingId&&t.post_id===postId&&
    t.case_reference===caseId&&t.incident_reference===incident&&t.transaction_reference===txRef);
  if(selected.length!==1)return fail('One exact original 855 signed Master review required.');
  const transaction=selected[0],originalReadbacks=readbacks.filter(r=>r.transaction_review_id===transaction.id&&
    r.kind==='owner_acceptance_readback');
  if(originalReadbacks.length!==1)return fail('Durable original 857 owner HOLD readback required.');
  const readback=originalReadbacks[0],originalConflicts=evidence.filter(e=>
    e.transaction_review_id===transaction.id&&e.kind==='replay_conflict_review');
  const aging=conflictAging857({conflicts:originalConflicts,priority});
  if(aging.decision!=='AGING_REVIEW_ONLY')return fail('Original bounded conflict priority/age required.');
  const records=recovery.filter(r=>r.transaction_review_id===transaction.id);
  const freshness=crossPlaneFreshness858({records,transaction,sourceRevision:env.CF_PAGES_COMMIT_SHA});
  const handoffs=records.filter(r=>r.kind==='conflict_escalation_handoff');
  const exports=records.filter(r=>r.kind==='owner_recovery_acceptance_export');
  if(request.method==='GET'){
   return json({ok:true,build:858,contract:CONTRACT_858,transaction_reference:txRef,
    incident_reference:incident,source_revision:env.CF_PAGES_COMMIT_SHA,
    cross_plane_freshness:freshness,original_conflict_aging:aging,
    handoffs:handoffs.map(r=>({id:r.id,recorded_at:r.recorded_at,
     review_digest_sha256:r.review_digest_sha256,owner_action:r.owner_action})),
    owner_exports:exports.map(r=>({id:r.id,recorded_at:r.recorded_at,
     review_digest_sha256:r.review_digest_sha256,owner_action:r.owner_action})),
    ...HOLD_858});
  }
  const nonce=clean(body.review_nonce,100);
  if(!safeNonce(nonce))return fail('Unique 20–100 character review nonce required.',400);
  const actor=clean(auth.actor?.email,140)||clean(auth.actor?.id,140)||'OriginalOwner';
  const common={project,bookingId,post,transaction,readback,revision:env.CF_PAGES_COMMIT_SHA,nonce,aging,actor};
  if(body.action==='recheck_fresh_signed_plane_receipt'){
   if(body.confirm_independent_fresh_ed25519_check!==true||
      body.acknowledge_signed_observation_not_delivery!==true)
    return fail('Independent signature check and explicit no-delivery assertion required.');
   const plane=clean(body.plane,40);
   const checked=await checkFreshReceipt858(env,body.receipt||{},body.signature,
    {plane,transaction,bookingId,projectId:project.id,post,caseReference:caseId,
      incidentReference:incident,actor,now:Date.now()});
   if(!checked.ok)return fail(checked.reason);
   const evidenceSha=await hash858('ROSIE-858-FRESH-RECHECK-V1\n'+JSON.stringify([
    transaction.id,plane,checked.receipt_sha256,checked.source_revision,nonce]));
   const stored=await persist(env,{...common,kind:'fresh_receipt_recheck',plane,
     receiptSha:checked.receipt_sha256,observedAt:checked.observed_at,digest:evidenceSha});
   return json({ok:true,build:858,record_id:stored.id,recorded_at:stored.recorded_at,
    review_digest_sha256:evidenceSha,receipt_sha256:checked.receipt_sha256,
    plane,decision:checked.decision,...HOLD_858});
  }
  if(body.action==='record_conflict_escalation_handoff'){
   if(body.confirm_independent_rechecks_current===true&&body.acknowledge_no_external_handoff_sent===true){
    const action=clean(body.owner_action,60);
    const assessment=handoffAssessment858({transaction,readbacks:originalReadbacks,
      freshness,aging,ownerAction:action});
    if(assessment.decision!=='DURABLE_CONFLICT_HANDOFF_REQUEST_HOLD_ONLY')
      return fail('Owner conflict handoff HOLD: '+assessment.reasons.join(', '));
    const digest=await hash858('ROSIE-858-CONFLICT-HANDOFF-V1\n'+JSON.stringify([
      transaction.id,readback.id,env.CF_PAGES_COMMIT_SHA,
      freshness.rechecks.map(r=>[r.plane,r.id,r.receipt_sha256]),
      aging.conflict_aging_status,aging.open_conflict_count,action,nonce]));
    const stored=await persist(env,{...common,kind:'conflict_escalation_handoff',digest,ownerAction:action});
    return json({ok:true,build:858,record_id:stored.id,recorded_at:stored.recorded_at,
      review_digest_sha256:digest,...assessment});
   }
   return fail('Explicit original owner acknowledgement of review-only handoff required.');
  }
  if(body.action==='export_owner_recovery_acceptance'){
   if(body.confirm_original_owner_recovery_review!==true||body.acknowledge_master_incident_hold!==true)
     return fail('Original owner review and explicit external Master/incident HOLD acknowledgement required.');
   const action=clean(body.owner_action,60);
   if(!EXPORT_ACTIONS_858.includes(action)||handoffs.length!==1||exports.length)
     return fail('One immutable conflict handoff and unused owner recovery export required.');
   const result=await recoveryExport858({transaction,sourceRevision:env.CF_PAGES_COMMIT_SHA,
    readback,handoff:handoffs[0],freshness,aging,ownerAction:action,nonce});
   const stored=await persist(env,{...common,kind:'owner_recovery_acceptance_export',
    digest:result.sha256,ownerAction:action});
   return json({ok:true,build:858,record_id:stored.id,recorded_at:stored.recorded_at,
    bundle:result.bundle,export_sha256:result.sha256,decision:'OWNER_RECOVERY_ACCEPTANCE_EXPORT_HOLD_ONLY',
    ...HOLD_858});
  }
  return fail('Unsupported Build 858 action.',405);
 }catch(e){return fail(e?.message||'Protected original-source Build 858 verification unavailable.',503);}
}
