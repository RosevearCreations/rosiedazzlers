// Rosie 860: original-owner scoped independent intake correlation and daily
// continuity exception HOLD review. No Master transport or provider mutation.
import {requireStaffAccess,json,isUuid} from '../_lib/staff-auth.js';
import {rest,clean,serviceReady} from '../_lib/creative-projects.js';
import {ownerActor842,SOURCE_TYPE_842} from '../_lib/jobday-social-842.js';
import {INCIDENT_AUDIT_853,incidentReference853,escalationRouting853} from '../_lib/jobday-replay-853.js';
import {conflictAging857} from '../_lib/jobday-custody-857.js';
import {freshCustodian860,exceptionAssessment860,hash860} from '../_lib/jobday-intake-860.js';
import {CONTRACT_861,HOLD_861,ACTIONS_861,verifyDiscrepancy861,intakeExceptionAging861,digest861} from '../_lib/jobday-exception-861.js';
const fail=(error,status=409)=>json({ok:false,build:861,decision:'HOLD',error,...HOLD_861},status);
const safeTx=v=>typeof v==='string'&&/^[A-Za-z0-9][A-Za-z0-9_-]{11,95}$/.test(v);
const safeNonce=v=>typeof v==='string'&&/^[A-Za-z0-9_-]{20,100}$/.test(v);
const sha40=v=>typeof v==='string'&&/^[a-f0-9]{40}$/.test(v);
const ownerAudit=(rows,a,b,i)=>rows.find(x=>x.safe_note?.startsWith(
 INCIDENT_AUDIT_853+' case '+a+'; post '+b+';')&&x.safe_note.includes(' incident '+i+';'));
async function persist(env,{project,bookingId,post,tx,handoff,ownerDecision,
 ownerException,intake=null,kind,plane=null,checked=null,digest,nonce,aging,action=null,
 previous=null,actor}){
 const params={p_project_id:project.id,p_booking_id:bookingId,p_post_id:post.id,
  p_transaction_review_id:tx.id,p_handoff_858_id:handoff.id,
  p_owner_decision_859_id:ownerDecision.id,p_owner_exception_860_id:ownerException.id,
  p_intake_860_id:intake?.id||null,p_kind:kind,p_plane:plane,
  p_source_revision:env.CF_PAGES_COMMIT_SHA,p_receipt_sha256:checked?.receipt_sha256||null,
  p_disputed_sha256:checked?.disputed_intake_sha256||null,
  p_discrepancy_code:checked?.discrepancy_code||null,
  p_signer_id:checked?.signer_id||null,p_review_digest_sha256:digest,
  p_review_nonce:nonce,p_age_hours:aging.oldest_exception_age_hours,
  p_aging_status:aging.aging_status,p_issue_codes:aging.issues,
  p_owner_action:action,p_previous_id:previous?.id||null,
  p_previous_sha256:previous?.review_digest_sha256||null,p_actor_staff_email:actor};
 const rows=await rest(env,'rpc/rosie861_append_discrepancy_escalation',
  {method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify(params)});
 if(!Array.isArray(rows)||rows.length!==1||rows[0].outcome!=='INSERTED'||!isUuid(rows[0].review_id))
  throw Error('Exact immutable original 861 claim/HOLD escalation replay or source drift.');
 return {id:rows[0].review_id,recorded_at:rows[0].accepted_at};
}
export const onRequestOptions=()=>new Response('',{status:204});
export async function onRequest({request,env}){
 if(!['GET','POST'].includes(request.method))return fail('Original-owner read/review only.',405);
 if(Number(request.headers.get('content-length'))>16000)return fail('Evidence payload too large.',413);
 const raw=request.method==='POST'?await request.text().catch(()=>''):'';
 if(raw.length>16000)return fail('Evidence payload too large.',413);
 let body={};
 if(request.method==='POST'){
  try{body=JSON.parse(raw);if(!body||typeof body!=='object'||Array.isArray(body))throw Error();}
  catch{return fail('JSON object required.',400);}
 }
 const url=new URL(request.url),bookingId=clean(body.booking_id||url.searchParams.get('booking_id'),80);
 if(!isUuid(bookingId))return fail('Exact original booking UUID required.',400);
 const auth=await requireStaffAccess({request,env,body,capability:'manage_staff',
  allowLegacyAdminFallback:false});
 if(!auth.ok)return auth.response;
 if(auth.auth_mode!=='session'||!ownerActor842(auth.actor))
  return fail('Signed-in original Rosie owner required; legacy bridge never grants authority.',403);
 if(!serviceReady(env)||!sha40(env?.CF_PAGES_COMMIT_SHA))
  return fail('Private original Rosie data or exact deployed SHA unavailable.',503);
 try{
  const [bookings,projects,posts]=await Promise.all([
   rest(env,'bookings?select=id&id=eq.'+encodeURIComponent(bookingId)+'&limit=1'),
   rest(env,'creative_projects?select=id,consent_status,public_publish_allowed&source_booking_id=eq.'+
    encodeURIComponent(bookingId)+'&limit=2'),
   rest(env,'social_post_queue?select=id,platform,source_type&booking_id=eq.'+
    encodeURIComponent(bookingId)+'&source_type=eq.'+SOURCE_TYPE_842+'&order=created_at.desc&limit=21')
  ]);
  if(bookings?.length!==1||projects?.length!==1||!Array.isArray(posts)||
   !posts.length||posts.length>=21)
   return fail('One original booking/project and complete bounded social post source required.');
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
   return fail('Incomplete original source/incident evidence; HOLD.',503);
  const revoked=revocations.length>0&&
   (project.consent_status!=='approved_public'||project.public_publish_allowed!==true);
  const expected=String(env?.ROSIE_RECALL_EXPECTED_PLATFORMS_852||'').split(',').map(s=>s.trim()).filter(Boolean);
  const attempts=await Promise.all(posts.map(p=>rest(env,'social_dispatch_attempts?select=id,status,platform,created_at,request_summary,response_summary&social_post_id=eq.'+
   encodeURIComponent(p.id)+'&order=created_at.desc&limit=200')));
  if(attempts.some(a=>!Array.isArray(a)||a.length>=200))
   return fail('Original dispatch attempt window truncated.',503);
  const routing=escalationRouting853(posts.map((p,i)=>({post_id:p.id,platform:p.platform,attempts:attempts[i]})),
   {expectedPlatforms:expected,revoked});
  if(!revoked||routing.decision!=='ROUTING_REVIEW_ONLY')
   return fail('Revoked original consent and original source-only routing required.');
  const src=request.method==='POST'?body:Object.fromEntries(url.searchParams);
  const postId=clean(src.post_id,80),caseId=clean(src.owner_case_reference,80),
   incident=clean(src.incident_reference,80),txRef=clean(src.transaction_reference,96);
  if(!isUuid(postId)||!incidentReference853(caseId)||!incidentReference853(incident)||!safeTx(txRef))
   return fail('Exact original post/case/incident/transaction identifiers required.',400);
  const post=posts.find(p=>p.id===postId),audit=ownerAudit(audits,caseId,postId,incident);
  if(!post||!audit)return fail('Original incident owner audit required.');
  const route=routing.routes.find(x=>x.platform===post.platform),
   priority=/ priority ([A-Z]+);/.exec(audit.safe_note)?.[1],
   origRoute=/ route ([A-Z0-9_]+);/.exec(audit.safe_note)?.[1];
  if(!route||route.priority!==priority||route.route!==origRoute)
   return fail('Original incident route/priority drift; HOLD.');
  const selected=transactions.filter(x=>x.booking_id===bookingId&&x.post_id===postId&&
   x.case_reference===caseId&&x.incident_reference===incident&&x.transaction_reference===txRef);
  if(selected.length!==1)return fail('One original source-specific 855 signed transaction required.');
  const tx=selected[0],
   origReadbacks=readbacks.filter(x=>x.transaction_review_id===tx.id&&x.kind==='owner_acceptance_readback');
  if(origReadbacks.length!==1)return fail('Original unique owner 857 readback required.');
  const origHandoffs=recovery.filter(x=>x.transaction_review_id===tx.id&&x.kind==='conflict_escalation_handoff');
  if(origHandoffs.length!==1||origHandoffs[0].prior_857_readback_id!==origReadbacks[0].id)
   return fail('Exact immutable original 858 handoff required.');
  const handoff=origHandoffs[0],
   aging=conflictAging857({conflicts:conflicts.filter(x=>x.transaction_review_id===tx.id&&
    x.kind==='replay_conflict_review'),priority});
  if(aging.decision!=='AGING_REVIEW_ONLY'||!(aging.open_conflict_count>0))
   return fail('Bounded unresolved original 856 conflict and aging required.');
  const suffix='&transaction_review_id=eq.'+encodeURIComponent(tx.id);
  const [reviews,checkpoints,intakes,exceptions,firstExceptions,discrepancies,escalations]=await Promise.all([
   rest(env,'rosie_incident_continuity_v859?select=id,kind,plane,transaction_review_id,handoff_858_id,owner_export_858_id,owner_decision_859_id,review_source_revision,receipt_sha256,review_digest_sha256,signer_id,owner_action,recorded_at'+
    suffix+'&kind=neq.incident_continuity_checkpoint&order=recorded_at.desc&limit=100'),
   rest(env,'rosie_incident_continuity_v859?select=id,kind,transaction_review_id,owner_decision_859_id,review_digest_sha256,recorded_at,previous_checkpoint_id'+
    suffix+'&kind=eq.incident_continuity_checkpoint&order=recorded_at.desc&limit=1'),
   rest(env,'rosie_external_intake_custody_v860?select=id,kind,plane,transaction_review_id,handoff_858_id,owner_decision_859_id,return_859_id,source_revision,receipt_sha256,signer_id,observed_at,review_digest_sha256,recorded_at'+
    suffix+'&kind=eq.signed_external_intake_correlation&order=recorded_at.desc&limit=100'),
   rest(env,'rosie_external_intake_custody_v860?select=id,kind,transaction_review_id,checkpoint_859_id,exception_codes,owner_action,previous_exception_id,previous_exception_sha256,review_digest_sha256,recorded_at'+
    suffix+'&kind=eq.owner_continuity_exception_review&order=recorded_at.desc&limit=25'),
   rest(env,'rosie_external_intake_custody_v860?select=id,kind,transaction_review_id,review_digest_sha256,recorded_at'+
    suffix+'&kind=eq.owner_continuity_exception_review&order=recorded_at.asc&limit=1'),
   rest(env,'rosie_intake_discrepancy_v861?select=id,kind,plane,transaction_review_id,intake_860_id,receipt_sha256,discrepancy_code,disputed_sha256,review_digest_sha256,recorded_at'+
    suffix+'&kind=eq.signed_external_custodian_discrepancy&order=recorded_at.desc&limit=100'),
   rest(env,'rosie_intake_discrepancy_v861?select=id,kind,transaction_review_id,review_digest_sha256,owner_action,aging_status,age_hours,issue_codes,previous_id,recorded_at'+
    suffix+'&kind=eq.owner_hold_escalation_review&order=recorded_at.desc&limit=25')
  ]);
  if(!Array.isArray(reviews)||reviews.length>=100||!Array.isArray(checkpoints)||
   !Array.isArray(intakes)||intakes.length>=100||!Array.isArray(exceptions)||
   !Array.isArray(firstExceptions)||!Array.isArray(discrepancies)||discrepancies.length>=100||
   !Array.isArray(escalations))
   return fail('Private independent custodian and owner exception source window incomplete.',503);
  const decisionRows=reviews.filter(x=>x.kind==='owner_recovery_decision'&&
   x.transaction_review_id===tx.id&&x.handoff_858_id===handoff.id);
  if(decisionRows.length>1)return fail('Multiple conflicting original owner decisions; HOLD.');
  const ownerDecision=decisionRows[0]||null,checkpoint=checkpoints[0]||null;
  const returnRows=reviews.filter(x=>x.kind==='signed_escalation_return'&&
   x.transaction_review_id===tx.id&&x.handoff_858_id===handoff.id);
  const custody=ownerDecision?freshCustodian860({returns:returnRows,intakes,tx,handoff,
   ownerDecision,revision:env.CF_PAGES_COMMIT_SHA}):
   {decision:'HOLD',reason:'ORIGINAL_859_OWNER_DECISION_REQUIRED',
    return_status:'MISSING',intake_status:'MISSING',...HOLD_861};
  const assessment=exceptionAssessment860({custody,latestCheckpoint:checkpoint,aging});
  const originalException=exceptions[0]||null;
  const intakeAging=intakeExceptionAging861({intakes,
   exceptions:firstExceptions.length?[firstExceptions[0],
    ...exceptions.filter(e=>e.id!==firstExceptions[0].id)]:exceptions,
   discrepancies,txId:tx.id,now:Date.now()});
  const previousEscalation=escalations[0]||null;
  if(request.method==='GET'){
   return json({ok:true,build:861,contract:CONTRACT_861,
    source_revision:env.CF_PAGES_COMMIT_SHA,transaction_reference:txRef,
    incident_reference:incident,original_owner_decision_id:ownerDecision?.id||null,
    latest_860_exception_id:originalException?.id||null,
    original_intake_freshness:custody,original_exception_assessment:assessment,
    intake_exception_aging:intakeAging,
    signed_custodian_discrepancies:discrepancies.map(x=>({
     id:x.id,plane:x.plane,intake_860_id:x.intake_860_id,
     discrepancy_code:x.discrepancy_code,review_digest_sha256:x.review_digest_sha256,
     recorded_at:x.recorded_at})),
    owner_hold_escalation_history:escalations.map(x=>({
     id:x.id,review_digest_sha256:x.review_digest_sha256,
     owner_action:x.owner_action,aging_status:x.aging_status,
     age_hours:x.age_hours,issue_codes:x.issue_codes,
     previous_id:x.previous_id,recorded_at:x.recorded_at})),
    owner_history_window_may_be_truncated:escalations.length>=25,...HOLD_861});
  }
  if(!ownerDecision||!originalException)return fail(
   'Original 859 owner decision and 860 owner HOLD exception required.');
  if(intakeAging.decision!=='ORIGINAL_OWNER_INTAKE_EXCEPTION_AGING_HOLD_ONLY')
   return fail('Complete original source-bound intake intakeAging window required.');
  const nonce=clean(body.review_nonce,100);
  if(!safeNonce(nonce))return fail('New unique owner review nonce required.',400);
  const actor=clean(auth.actor?.email,140)||clean(auth.actor?.id,140)||'OriginalOwner';
  const common={project,bookingId,post,tx,handoff,ownerDecision,
   ownerException:originalException,nonce,aging:intakeAging,actor};
  if(body.action==='record_independent_custodian_discrepancy'){
   if(body.confirm_external_ed25519_discrepancy_claim!==true||
      body.acknowledge_discrepancy_is_not_runtime_delivery!==true)
    return fail('Original owner must confirm independent signature and runtime HOLD.');
   const plane=clean(body.plane,40),intakeId=clean(body.intake_860_id,80);
   const matches=intakes.filter(x=>x.id===intakeId&&x.plane===plane&&
    x.transaction_review_id===tx.id&&x.kind==='signed_external_intake_correlation');
   if(matches.length!==1)return fail('One exact independently signed 860 intake record required.');
   const intake=matches[0];
   const checked=await verifyDiscrepancy861(env,body.receipt||{},body.signature,{
    plane,tx,handoff,ownerDecision,intake,ownerException:originalException,
    bookingId,projectId:project.id,postId:post.id,now:Date.now()});
   if(!checked.ok)return fail(checked.reason);
   const digest=await digest861({kind:'signed_external_custodian_discrepancy',
    tx,handoff,ownerDecision,nonce,checked,intake,ownerException:originalException});
   const saved=await persist(env,{...common,kind:'signed_external_custodian_discrepancy',
    plane,intake,checked,digest});
   return json({ok:true,build:861,record_id:saved.id,recorded_at:saved.recorded_at,
    independent_claim_sha256:checked.receipt_sha256,
    review_digest_sha256:digest,discrepancy_code:checked.discrepancy_code,
    decision:checked.decision,...HOLD_861});
  }
  if(body.action==='record_owner_hold_escalation'){
   if(body.confirm_original_incident_still_open!==true||
    body.acknowledge_external_discrepancy_unresolved!==true||
    body.acknowledge_no_master_receiver_ack!==true)
    return fail('Explicit original-owner open-incident, discrepancy and Master HOLD acknowledgements required.');
   const action=clean(body.owner_action,80);
   if(!ACTIONS_861.includes(action))return fail('Only non-authorizing owner escalation permitted.');
   const digest=await digest861({kind:'owner_hold_escalation_review',
    tx,handoff,ownerDecision,nonce,aging:intakeAging,action,previous:previousEscalation});
   const saved=await persist(env,{...common,kind:'owner_hold_escalation_review',
    digest,action,previous:previousEscalation});
   return json({ok:true,build:861,record_id:saved.id,recorded_at:saved.recorded_at,
    review_digest_sha256:digest,aging_status:intakeAging.aging_status,
    owner_action:action,decision:'IMMUTABLE_OWNER_HOLD_ESCALATION_ONLY',...HOLD_861});
  }
  if(body.action==='export_original_owner_hold_history'){
   if(body.confirm_private_hold_export_only!==true)
    return fail('Private original owner non-authorizing HOLD export acknowledgement required.');
   const bundle={format:'rosie.original-owner-intake-discrepancy-hold.v861',
    generated_at:new Date().toISOString(),source_revision:env.CF_PAGES_COMMIT_SHA,
    transaction_review_id:tx.id,incident_reference:tx.incident_reference,
    latest_860_exception_id:originalException.id,intake_exception_aging:intakeAging,
    signed_custodian_discrepancies:discrepancies.map(x=>({
     id:x.id,plane:x.plane,discrepancy_code:x.discrepancy_code,
     intake_860_id:x.intake_860_id,review_digest_sha256:x.review_digest_sha256,
     recorded_at:x.recorded_at})),
    owner_hold_history:escalations.map(x=>({
     id:x.id,review_digest_sha256:x.review_digest_sha256,
     owner_action:x.owner_action,previous_id:x.previous_id,
     aging_status:x.aging_status,recorded_at:x.recorded_at})),
    history_window_may_be_truncated:escalations.length>=25,
    operational_state:{...HOLD_861}};
   return json({ok:true,build:861,decision:'PRIVATE_OWNER_HOLD_HISTORY_EXPORT',
    bundle,bundle_sha256:await hash860('ROSIE-861-OWNER-HOLD-EXPORT-V1\\n'+
    JSON.stringify(bundle)),...HOLD_861});
  }
  return fail('Unsupported Build 861 original-owner HOLD action.',405);
 }catch(e){return fail(e?.message||'Protected Rosie 861 source custody unavailable.',503);}
}
