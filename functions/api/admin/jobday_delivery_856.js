// Rosie 856 — private, original-owner-only delivery witness / conflict / export.
// All evidence remains source review only: no remote dispatch, provider action or CONNECTED.
import {requireStaffAccess,json,isUuid} from '../_lib/staff-auth.js';
import {rest,clean,serviceReady} from '../_lib/creative-projects.js';
import {ownerActor842,SOURCE_TYPE_842} from '../_lib/jobday-social-842.js';
import {INCIDENT_AUDIT_853,incidentReference853,escalationRouting853} from '../_lib/jobday-replay-853.js';
import {CONTRACT_856,PLANES_856,verifyWitness856,conflictReview856,ownerEvidenceExport856} from '../_lib/jobday-delivery-856.js';
const fail=(error,status=409)=>json({ok:false,build:856,error,decision:'HOLD',
  master_connection:'HOLD',master_runtime_ack:false,verified_remote_delivery:false,
  owner_operational_incident_closed:false,provider_mutation_performed:false,
  consumer_authorized:false,master_events_emitted:0},status);
const matches=(note,k,value)=>typeof note==='string'&&typeof value==='string'&&value.length>0&&note.includes(' '+k+' '+value+';');
const scope=(caseId,postId)=>'case '+caseId+'; post '+postId+';';
const safeTx=v=>typeof v==='string'&&/^[A-Za-z0-9][A-Za-z0-9_-]{11,95}$/.test(v);
const auditFor=(audits,caseId,postId,incident)=>audits.find(a=>
 a.safe_note?.startsWith(INCIDENT_AUDIT_853+' '+scope(caseId,postId))&&matches(a.safe_note,'incident',incident));
async function claim(env,fields){
 const rows=await rest(env,'rpc/rosie856_append_evidence',{method:'POST',
   headers:{Prefer:'return=representation'},body:JSON.stringify(fields)});
 if(!Array.isArray(rows)||rows.length!==1||rows[0]?.outcome!=='INSERTED'||!isUuid(rows[0]?.evidence_id))
   throw Error('Build 856 atomic replay/conflict rejected; original evidence remains unchanged.');
 return {id:rows[0].evidence_id,recorded_at:rows[0].accepted_at};
}
function params({project,bookingId,post,transaction,plane,kind,nonce,digest,revision,priorSha,actor,
 receiptRef=null,observedAt=null,conflictRef=null,conflictKind=null,recoveryAction=null}){
 return {p_project_id:project.id,p_booking_id:bookingId,p_post_id:post.id,
  p_transaction_review_id:transaction.id,p_case_reference:transaction.case_reference,
  p_incident_reference:transaction.incident_reference,p_transaction_reference:transaction.transaction_reference,
  p_kind:kind,p_plane:plane,p_evidence_nonce:nonce,p_evidence_sha256:digest,
  p_source_revision:revision,p_prior_855_sha256:priorSha,
  p_delivery_receipt_reference:receiptRef,p_witness_observed_at:observedAt,
  p_conflict_reference:conflictRef,p_conflict_kind:conflictKind,p_recovery_action:recoveryAction,
  p_actor_staff_email:actor};
}
export const onRequestOptions=()=>new Response('',{status:204});
export async function onRequest({request,env}){
 if(!['GET','POST'].includes(request.method))return fail('Only original-owner GET/POST supported.',405);
 if(Number(request.headers.get('content-length'))>14000)return fail('Evidence payload too large.',413);
 const raw=request.method==='POST'?await request.text().catch(()=>''):'';
 if(raw.length>14000)return fail('Evidence payload too large.',413);
 let body={};
 if(request.method==='POST'){
   try{body=JSON.parse(raw);if(!body||typeof body!=='object'||Array.isArray(body))throw Error();}
   catch{return fail('Valid JSON object required.',400);}
 }
 const url=new URL(request.url);
 const bookingId=clean(body.booking_id||url.searchParams.get('booking_id'),80);
 if(!isUuid(bookingId))return fail('Exact original booking UUID required.',400);
 const auth=await requireStaffAccess({request,env,body,capability:'manage_staff',allowLegacyAdminFallback:false});
 if(!auth.ok)return auth.response;
 if(auth.auth_mode!=='session'||!ownerActor842(auth.actor))
   return fail('Signed-in original Rosie owner required; bridge and legacy authority denied.',403);
 if(!serviceReady(env))return fail('Original private source storage unavailable.',503);
 try{
  const [bookings,projects,posts]=await Promise.all([
    rest(env,'bookings?select=id&id=eq.'+encodeURIComponent(bookingId)+'&limit=1'),
    rest(env,'creative_projects?select=id,consent_status,public_publish_allowed&source_booking_id=eq.'+encodeURIComponent(bookingId)+'&limit=2'),
    rest(env,'social_post_queue?select=id,platform,source_type&booking_id=eq.'+encodeURIComponent(bookingId)+'&source_type=eq.'+SOURCE_TYPE_842+'&order=created_at.desc&limit=21')
  ]);
  if(bookings?.length!==1||projects?.length!==1||!Array.isArray(posts)||posts.length<1||posts.length>=21)
   return fail('Original booking, unique project and untruncated social post source required.');
  const project=projects[0];
  const [audits,revocations,transactions,events]=await Promise.all([
    rest(env,'creative_project_audit?select=id,safe_note,created_at&project_id=eq.'+encodeURIComponent(project.id)+'&event_type=eq.updated&order=created_at.desc&limit=250'),
    rest(env,'creative_project_audit?select=id&project_id=eq.'+encodeURIComponent(project.id)+'&event_type=eq.updated&safe_note=like.'+encodeURIComponent('Build 843 consent revoked:*')+'&limit=1'),
    rest(env,'rosie_master_transaction_review_v855?select=id,project_id,booking_id,post_id,case_reference,incident_reference,transaction_reference,source_revision,ai_data_nonce,comms_nonce,ai_data_sha256,comms_sha256,source_sla_due_at,sla_review_status,owner_review_decision,recorded_at&project_id=eq.'+encodeURIComponent(project.id)+'&order=recorded_at.desc&limit=100'),
    rest(env,'rosie_delivery_conflict_evidence_v856?select=id,project_id,booking_id,post_id,transaction_review_id,case_reference,incident_reference,transaction_reference,kind,plane,evidence_sha256,prior_855_sha256,delivery_receipt_reference,witness_observed_at,conflict_reference,conflict_kind,recovery_action,recorded_at&project_id=eq.'+encodeURIComponent(project.id)+'&order=recorded_at.desc&limit=100')
  ]);
  if(!Array.isArray(audits)||audits.length>=250||!Array.isArray(revocations)||
     !Array.isArray(transactions)||transactions.length>=100||
     !Array.isArray(events)||events.length>=100)
    return fail('Source audit, 855 transaction or 856 custody history incomplete; HOLD.',503);
  const revoked=Boolean(revocations.length)||project.consent_status!=='approved_public'||project.public_publish_allowed!==true;
  const expected=String(env?.ROSIE_RECALL_EXPECTED_PLATFORMS_852||'').split(',').map(v=>v.trim()).filter(Boolean);
  const attempts=await Promise.all(posts.map(p=>rest(env,
    'social_dispatch_attempts?select=id,status,platform,created_at,request_summary,response_summary&social_post_id=eq.'+
    encodeURIComponent(p.id)+'&order=created_at.desc&limit=200')));
  if(attempts.some(a=>!Array.isArray(a)||a.length>=200))
    return fail('Original recall attempt history incomplete.',503);
  const routing=escalationRouting853(posts.map((p,i)=>({post_id:p.id,platform:p.platform,attempts:attempts[i]})),
    {expectedPlatforms:expected,revoked});
  const actor=clean(auth.actor?.email,140)||clean(auth.actor?.id,140)||'OriginalOwner';
  if(request.method==='GET'){
    const exportRequested=url.searchParams.get('mode')==='closure_export';
    if(!exportRequested){
      return json({ok:true,build:856,contract:CONTRACT_856,booking_id:bookingId,
        source_window_complete:routing.source_window_complete,routing_decision:routing.decision,
        revocation_recorded:revocations.length>0,
        transactions_reviewed:transactions.length,
        delivery_witness_reviews:events.filter(e=>e.kind==='signed_delivery_hold_witness').length,
        replay_conflict_reviews:events.filter(e=>e.kind==='replay_conflict_review').length,
        recent_custody:events.slice(0,40).map(e=>({id:e.id,kind:e.kind,plane:e.plane,
          transaction_reference:e.transaction_reference,incident_reference:e.incident_reference,
          recorded_at:e.recorded_at,conflict_kind:e.conflict_kind||null,
          recovery_action:e.recovery_action||null,provider_action_performed:false})),
        ai_data_witness_pin_enrolled:Boolean(env?.ROSIE_AIDATA_DELIVERY_WITNESS_ED25519_PUBLIC_KEY_856),
        comms_witness_pin_enrolled:Boolean(env?.ROSIE_COMMS_DELIVERY_WITNESS_ED25519_PUBLIC_KEY_856),
        verified_remote_delivery:false,owner_operational_incident_closed:false,
        master_connection:'HOLD',master_runtime_ack:false,master_events_emitted:0});
    }
    if(!revocations.length||!revoked||routing.decision!=='ROUTING_REVIEW_ONLY')
      return fail('Original consent revocation or complete source route missing; export HOLD.');
    const incident=clean(url.searchParams.get('incident_reference'),80);
    const txRef=clean(url.searchParams.get('transaction_reference'),96);
    if(!incidentReference853(incident)||!safeTx(txRef))return fail('Exact original incident and transaction reference required.',400);
    const selected=transactions.filter(t=>t.incident_reference===incident&&t.transaction_reference===txRef);
    if(selected.length!==1||!posts.some(p=>p.id===selected[0].post_id)||
      !auditFor(audits,selected[0].case_reference,selected[0].post_id,incident))
      return fail('Exact transaction and owner incident source custody required.');
    const transaction=selected[0];
    const scoped=events.filter(e=>e.transaction_review_id===transaction.id);
    const witnesses=scoped.filter(e=>e.kind==='signed_delivery_hold_witness');
    const conflicts=scoped.filter(e=>e.kind==='replay_conflict_review');
    const exported=await ownerEvidenceExport856({transaction,witnesses,conflicts});
    return new Response(JSON.stringify({ok:true,build:856,
      export_sha256:exported.sha256,checksum_algorithm:'SHA-256',...exported.bundle},null,2),{
      status:200,headers:{'Content-Type':'application/json; charset=utf-8',
        'Content-Disposition':'attachment; filename="rosie-incident-856-'+incident+'.json"',
        'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}
    });
  }
  if(!revocations.length||!revoked||routing.decision!=='ROUTING_REVIEW_ONLY')
    return fail('Original consent revocation and complete source platform evidence required.');
  const postId=clean(body.post_id,80),caseId=clean(body.owner_case_reference,80),
    incident=clean(body.incident_reference,80),txRef=clean(body.transaction_reference,96),
    plane=clean(body.plane,40);
  if(!isUuid(postId)||!incidentReference853(caseId)||!incidentReference853(incident)||
    !safeTx(txRef)||!PLANES_856.includes(plane))return fail('Original post/case/incident/transaction and exact plane required.',400);
  const post=posts.find(p=>p.id===postId);
  if(!post||!auditFor(audits,caseId,postId,incident))return fail('Original case/incident owner audit not present.');
  const selected=transactions.filter(t=>t.post_id===postId&&t.case_reference===caseId&&
    t.incident_reference===incident&&t.transaction_reference===txRef);
  if(selected.length!==1)return fail('Exact unique original signed 855 transaction required.');
  const transaction=selected[0];
  const priorSha=plane==='ai-data-platform'?transaction.ai_data_sha256:transaction.comms_sha256;
  if(body.action==='admit_external_delivery_witness'){
    if(body.confirm_independent_receiver_signature!==true||
       body.acknowledge_remote_delivery_unverified!==true)
      return fail('Explicit independent signer and external delivery HOLD acknowledgements required.');
    const r=body.receipt||{};
    const verdict=await verifyWitness856(env,r,body.signature,{plane,bookingId,
       projectId:project.id,post,caseReference:caseId,incidentReference:incident,transaction,actor});
    if(!verdict.ok)return fail(verdict.reason);
    const accepted=await claim(env,params({project,bookingId,post,transaction,plane,
      kind:'signed_delivery_hold_witness',nonce:verdict.nonce,
      digest:verdict.canonical_sha256,revision:r.source_revision,
      priorSha,receiptRef:verdict.delivery_receipt_reference,
      observedAt:verdict.observed_at,actor}));
    return json({ok:true,build:856,decision:'SIGNED_RECEIVER_WITNESS_REVIEW_ONLY',
      evidence_id:accepted.id,recorded_at:accepted.recorded_at,
      signature_verified:true,receipt_sha256:verdict.canonical_sha256,
      remote_receiver_delivery_verified:false,master_connection:'HOLD',master_runtime_ack:false,
      owner_operational_incident_closed:false,provider_mutation_performed:false,
      master_events_emitted:0});
  }
  if(body.action==='record_replay_conflict_recovery'){
    if(body.confirm_original_owner_recovery_review!==true||
       body.acknowledge_no_automatic_provider_retry!==true)
      return fail('Explicit original owner conflict triage and no automatic retry acknowledgements required.');
    const kind=clean(body.conflict_kind,60),action=clean(body.recovery_action,70),
      conflictRef=clean(body.conflict_reference,96),evidenceNonce=clean(body.evidence_nonce,100),
      evidenceDigest=clean(body.evidence_sha256,64);
    const review=conflictReview856({plane,conflictKind:kind,recoveryAction:action,
      conflictReference:conflictRef,evidenceNonce,evidenceSha256:evidenceDigest,transaction});
    if(review.decision!=='OWNER_CONFLICT_TRIAGE_RECORDED_ONLY')
      return fail(review.reasons.join(', '));
    const accepted=await claim(env,params({project,bookingId,post,transaction,plane,
      kind:'replay_conflict_review',nonce:evidenceNonce,digest:evidenceDigest,
      revision:env.CF_PAGES_COMMIT_SHA,priorSha,
      conflictRef,conflictKind:kind,recoveryAction:action,actor}));
    return json({ok:true,build:856,decision:review.decision,
      evidence_id:accepted.id,recorded_at:accepted.recorded_at,
      ...review,owner_operational_incident_closed:false,master_runtime_ack:false,
      master_events_emitted:0});
  }
  return fail('Unknown original-owner Build 856 action.',405);
 }catch(e){return fail(e?.message||'Original private incident custody unavailable.',503);}
}
