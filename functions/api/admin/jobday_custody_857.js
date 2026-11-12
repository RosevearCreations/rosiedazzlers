// Rosie 857 — original-owner historical witness cryptographic revalidation,
// bounded conflict escalation aging and Master owner HOLD acceptance readback.
// No provider, Master, device or consumer writes; no CONNECTED grant.
import {requireStaffAccess,json,isUuid} from '../_lib/staff-auth.js';
import {rest,clean,serviceReady} from '../_lib/creative-projects.js';
import {ownerActor842,SOURCE_TYPE_842} from '../_lib/jobday-social-842.js';
import {INCIDENT_AUDIT_853,incidentReference853,escalationRouting853} from '../_lib/jobday-replay-853.js';
import {PLANES_857,CONTRACT_857,revalidateHistoricCustody857,conflictAging857,
  revalidationDigest857,ownerAcceptance857,readbackDigest857} from '../_lib/jobday-custody-857.js';
const fail=(error,status=409)=>json({ok:false,build:857,error,decision:'HOLD',
  master_connection:'HOLD',master_runtime_ack:false,verified_remote_delivery:false,
  owner_operational_incident_closed:false,provider_mutation_performed:false,
  consumer_authorized:false,master_events_emitted:0},status);
const has=(note,k,v)=>typeof note==='string'&&typeof v==='string'&&v.length>0&&note.includes(' '+k+' '+v+';');
const scope=(caseId,postId)=>'case '+caseId+'; post '+postId+';';
const safeTx=v=>typeof v==='string'&&/^[A-Za-z0-9][A-Za-z0-9_-]{11,95}$/.test(v);
const safeNonce=v=>typeof v==='string'&&/^[A-Za-z0-9_-]{20,100}$/.test(v);
const originalAudit=(rows,caseId,postId,incident)=>rows.find(a=>
 a.safe_note?.startsWith(INCIDENT_AUDIT_853+' '+scope(caseId,postId))&&has(a.safe_note,'incident',incident));
const priorSha=(transaction,plane)=>plane==='ai-data-platform'?transaction.ai_data_sha256:transaction.comms_sha256;
async function persist(env,fields){
 const records=await rest(env,'rpc/rosie857_append_custody_readback',{method:'POST',
   headers:{Prefer:'return=representation'},body:JSON.stringify(fields)});
 if(!Array.isArray(records)||records.length!==1||records[0].outcome!=='INSERTED'||!isUuid(records[0].review_id))
   throw Error('Replay/duplicate original owner review rejected; HOLD retained.');
 return {id:records[0].review_id,recorded_at:records[0].accepted_at};
}
const params=({project,bookingId,post,transaction,kind,plane=null,witness=null,nonce,digest,
 aging,ownerAction=null,actor})=>({
 p_project_id:project.id,p_booking_id:bookingId,p_post_id:post.id,
 p_transaction_review_id:transaction.id,p_case_reference:transaction.case_reference,
 p_incident_reference:transaction.incident_reference,p_transaction_reference:transaction.transaction_reference,
 p_kind:kind,p_plane:plane,p_witness_856_id:witness?.id||null,
 p_prior_witness_sha256:witness?.evidence_sha256||null,
 p_review_digest_sha256:digest,p_review_nonce:nonce,
 p_conflict_aging_status:aging.conflict_aging_status,p_open_conflict_count:aging.open_conflict_count,
 p_owner_action:ownerAction,p_actor_staff_email:actor
});
export const onRequestOptions=()=>new Response('',{status:204});
export async function onRequest({request,env}){
 if(!['GET','POST'].includes(request.method))return fail('Only original-owner GET/POST supported.',405);
 if(Number(request.headers.get('content-length'))>15000)return fail('Signed evidence payload too large.',413);
 const raw=request.method==='POST'?await request.text().catch(()=>''):'';
 if(raw.length>15000)return fail('Signed evidence payload too large.',413);
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
   return fail('Original signed-in Rosie owner required. No bridge/legacy authority.',403);
 if(!serviceReady(env))return fail('Original source private database unavailable.',503);
 try{
  const [bookings,projects,posts]=await Promise.all([
   rest(env,'bookings?select=id&id=eq.'+encodeURIComponent(bookingId)+'&limit=1'),
   rest(env,'creative_projects?select=id,consent_status,public_publish_allowed&source_booking_id=eq.'+encodeURIComponent(bookingId)+'&limit=2'),
   rest(env,'social_post_queue?select=id,platform,source_type&booking_id=eq.'+encodeURIComponent(bookingId)+'&source_type=eq.'+SOURCE_TYPE_842+'&order=created_at.desc&limit=21')
  ]);
  if(bookings?.length!==1||projects?.length!==1||!Array.isArray(posts)||!posts.length||posts.length>=21)
   return fail('Original booking, unique project and complete bounded post source required.');
  const project=projects[0];
  const [audits,revocations,transactions,evidence,readbacks]=await Promise.all([
   rest(env,'creative_project_audit?select=id,safe_note,created_at&project_id=eq.'+encodeURIComponent(project.id)+'&event_type=eq.updated&order=created_at.desc&limit=250'),
   rest(env,'creative_project_audit?select=id&project_id=eq.'+encodeURIComponent(project.id)+'&event_type=eq.updated&safe_note=like.'+encodeURIComponent('Build 843 consent revoked:*')+'&limit=1'),
   rest(env,'rosie_master_transaction_review_v855?select=id,project_id,booking_id,post_id,case_reference,incident_reference,transaction_reference,source_revision,ai_data_nonce,comms_nonce,ai_data_sha256,comms_sha256,source_sla_due_at,recorded_at&project_id=eq.'+encodeURIComponent(project.id)+'&order=recorded_at.desc&limit=100'),
   rest(env,'rosie_delivery_conflict_evidence_v856?select=id,project_id,booking_id,post_id,transaction_review_id,case_reference,incident_reference,transaction_reference,kind,plane,evidence_nonce,evidence_sha256,prior_855_sha256,source_revision,delivery_receipt_reference,witness_observed_at,conflict_reference,conflict_kind,recovery_action,recorded_at&project_id=eq.'+encodeURIComponent(project.id)+'&order=recorded_at.desc&limit=100'),
   rest(env,'rosie_custody_readback_v857?select=id,transaction_review_id,case_reference,incident_reference,transaction_reference,kind,plane,witness_856_id,prior_witness_sha256,review_digest_sha256,review_nonce,conflict_aging_status,open_conflict_count,owner_action,recorded_at&project_id=eq.'+encodeURIComponent(project.id)+'&order=recorded_at.desc&limit=100')
  ]);
  if(!Array.isArray(audits)||audits.length>=250||!Array.isArray(revocations)||
    !Array.isArray(transactions)||transactions.length>=100||
    !Array.isArray(evidence)||evidence.length>=100||
    !Array.isArray(readbacks)||readbacks.length>=100)
    return fail('Original audit, transaction or custody evidence truncated; HOLD.',503);
  const revoked=Boolean(revocations.length)||project.consent_status!=='approved_public'||project.public_publish_allowed!==true;
  const expected=String(env?.ROSIE_RECALL_EXPECTED_PLATFORMS_852||'').split(',').map(s=>s.trim()).filter(Boolean);
  const attempts=await Promise.all(posts.map(p=>rest(env,
   'social_dispatch_attempts?select=id,status,platform,created_at,request_summary,response_summary&social_post_id=eq.'+
   encodeURIComponent(p.id)+'&order=created_at.desc&limit=200')));
  if(attempts.some(a=>!Array.isArray(a)||a.length>=200))return fail('Unbounded original dispatch evidence.',503);
  const routing=escalationRouting853(posts.map((p,i)=>({post_id:p.id,platform:p.platform,attempts:attempts[i]})),
   {expectedPlatforms:expected,revoked});
  const actor=clean(auth.actor?.email,140)||clean(auth.actor?.id,140)||'OriginalOwner';
  if(request.method==='GET'&&url.searchParams.get('mode')!=='readback'){
   return json({ok:true,build:857,contract:CONTRACT_857,booking_id:bookingId,
    source_window_complete:routing.source_window_complete,routing_decision:routing.decision,
    revocation_recorded:revocations.length>0,transaction_count:transactions.length,
    witness_count:evidence.filter(e=>e.kind==='signed_delivery_hold_witness').length,
    conflict_count:evidence.filter(e=>e.kind==='replay_conflict_review').length,
    historical_revalidations:readbacks.filter(e=>e.kind==='historical_witness_revalidation').length,
    original_owner_readbacks:readbacks.filter(e=>e.kind==='owner_acceptance_readback').length,
    public_historic_signers_configured:Boolean(env?.ROSIE_AIDATA_DELIVERY_WITNESS_ED25519_PUBLIC_KEY_856&&
      env?.ROSIE_COMMS_DELIVERY_WITNESS_ED25519_PUBLIC_KEY_856),
    master_connection:'HOLD',verified_fresh_live_receiver_ack:false,
    verified_remote_delivery:false,owner_operational_incident_closed:false,master_events_emitted:0});
  }
  if(!revocations.length||!revoked||routing.decision!=='ROUTING_REVIEW_ONLY')
   return fail('Original explicit consent revocation and complete route evidence required.');
  const source=request.method==='GET'?Object.fromEntries(url.searchParams):body;
  const postId=clean(source.post_id,80),caseId=clean(source.owner_case_reference,80),
   incident=clean(source.incident_reference,80),txRef=clean(source.transaction_reference,96);
  if(!isUuid(postId)||!incidentReference853(caseId)||!incidentReference853(incident)||!safeTx(txRef))
   return fail('Exact post, owner case, incident and transaction reference required.',400);
  const post=posts.find(p=>p.id===postId),owner=originalAudit(audits,caseId,postId,incident);
  if(!post||!owner)return fail('Original post and owner incident decision audit required.');
  const current=routing.routes.find(r=>r.platform===post.platform),
    route=/ route ([A-Z0-9_]+);/.exec(owner.safe_note)?.[1],
    priority=/ priority ([A-Z]+);/.exec(owner.safe_note)?.[1];
  if(!current||route!==current.route||priority!==current.priority)
    return fail('Original incident priority/route changed; independent source review required.');
  const selected=transactions.filter(t=>t.booking_id===bookingId&&t.post_id===postId&&
   t.case_reference===caseId&&t.incident_reference===incident&&t.transaction_reference===txRef);
  if(selected.length!==1)return fail('Exactly one original 855 signed Master review required.');
  const transaction=selected[0];
  const history=evidence.filter(e=>e.transaction_review_id===transaction.id);
  const witnesses=history.filter(e=>e.kind==='signed_delivery_hold_witness'),
    conflicts=history.filter(e=>e.kind==='replay_conflict_review');
  const originalRevalidations=readbacks.filter(r=>r.transaction_review_id===transaction.id&&
    r.kind==='historical_witness_revalidation');
  const previousReadbacks=readbacks.filter(r=>r.transaction_review_id===transaction.id&&
    r.kind==='owner_acceptance_readback');
  const aging=conflictAging857({conflicts,priority});
  if(aging.decision!=='AGING_REVIEW_ONLY')return fail('Complete bounded source conflict-aging review required.');
  if(request.method==='GET'){
   const summary=ownerAcceptance857({transaction,revalidations:originalRevalidations,aging,
     ownerAction:'maintain_external_hold'});
   return json({ok:true,build:857,contract:CONTRACT_857,
    transaction_reference:txRef,incident_reference:incident,
    revalidated_planes:originalRevalidations.map(r=>({plane:r.plane,witness_id:r.witness_856_id,
     review_digest_sha256:r.review_digest_sha256,recorded_at:r.recorded_at})),
    source_conflict_aging:aging,owner_acceptance_readback:summary,
    stored_readbacks:previousReadbacks.map(x=>({id:x.id,recorded_at:x.recorded_at,
      owner_action:x.owner_action,review_digest_sha256:x.review_digest_sha256})),
    master_connection:'HOLD',verified_live_master_delivery:false,
    owner_operational_incident_closed:false,master_events_emitted:0});
  }
  const reviewNonce=clean(body.review_nonce,100);
  if(!safeNonce(reviewNonce))return fail('New original review nonce (20–100 characters) required.',400);
  if(body.action==='revalidate_independent_historical_witness'){
   if(body.confirm_historical_ed25519_signature_check!==true||
      body.acknowledge_no_fresh_live_delivery_grant!==true)
    return fail('Explicit historical-only verifier and no fresh-live-delivery acknowledgement required.');
   const plane=clean(body.plane,40),witnessId=clean(body.witness_856_id,80);
   if(!PLANES_857.includes(plane)||!isUuid(witnessId))
    return fail('Exact original Master plane and immutable witness UUID required.',400);
   const selectedWitness=witnesses.filter(w=>w.id===witnessId&&w.plane===plane);
   if(selectedWitness.length!==1)return fail('One exact scoped original 856 signed witness required.');
   const witness=selectedWitness[0];
   const verdict=await revalidateHistoricCustody857(env,body.receipt||{},body.signature,
    {witness,plane,transaction,bookingId,projectId:project.id,post,
      caseReference:caseId,incidentReference:incident,actor});
   if(!verdict.ok)return fail(verdict.reason);
   const reviewDigest=await revalidationDigest857({transaction,witness,plane,nonce:reviewNonce,aging});
   const claim=await persist(env,params({project,bookingId,post,transaction,
     kind:'historical_witness_revalidation',plane,witness,nonce:reviewNonce,
     digest:reviewDigest,aging,actor}));
   return json({ok:true,build:857,decision:'HISTORICAL_ORIGINAL_WITNESS_REVALIDATED_HOLD_ONLY',
    record_id:claim.id,recorded_at:claim.recorded_at,review_digest_sha256:reviewDigest,
    witness_sha256:verdict.witness_sha256,original_source_revision:verdict.source_revision,
    historical_signature_revalidated:true,source_conflict_aging:aging,
    verified_fresh_live_receiver_ack:false,master_connection:'HOLD',master_runtime_ack:false,
    owner_operational_incident_closed:false,provider_mutation_performed:false,master_events_emitted:0});
  }
  if(body.action==='record_master_owner_acceptance_readback'){
   if(body.confirm_both_historical_master_witnesses!==true||
      body.acknowledge_operational_master_and_incident_hold!==true)
    return fail('Both independent historical source signatures and non-authorizing owner acceptance required.');
   const ownerAction=clean(body.owner_action,60);
   const result=ownerAcceptance857({transaction,revalidations:originalRevalidations,aging,ownerAction});
   if(result.decision!=='OWNER_MASTER_ACCEPTANCE_READBACK_HOLD_ONLY')
    return fail('Original independent Master owner readback remains HOLD: '+result.reasons.join(', '));
   const digest=await readbackDigest857({transaction,revalidations:originalRevalidations,
     aging,action:ownerAction,nonce:reviewNonce});
   const claim=await persist(env,params({project,bookingId,post,transaction,
     kind:'owner_acceptance_readback',nonce:reviewNonce,digest,aging,ownerAction,actor}));
   return json({ok:true,build:857,record_id:claim.id,recorded_at:claim.recorded_at,
    readback_sha256:digest,...result,master_runtime_ack:false,
    owner_operational_incident_closed:false,master_events_emitted:0});
  }
  return fail('Unsupported original-owner Build 857 action.',405);
 }catch(e){return fail(e?.message||'Original protected custody/owner readback unavailable.',503);}
}
