// Rosie Build 854 — original-owner atomic source ledger pilot and signed Master
// incident HOLD reconciliation. No external transport, dispatch or CONNECTED.
import {requireStaffAccess,json,isUuid} from '../_lib/staff-auth.js';
import {serviceReady,rest,clean} from '../_lib/creative-projects.js';
import {ownerActor842,SOURCE_TYPE_842} from '../_lib/jobday-social-842.js';
import {CONSUMER_AUDIT_852} from '../_lib/jobday-continuity-852.js';
import {REPLAY_AUDIT_853,INCIDENT_AUDIT_853,incidentReference853,verifyReplayLedger853,escalationRouting853} from '../_lib/jobday-replay-853.js';
import {CONTRACT_854,verifyMaster854,slaEvidence854,reconcileMaster854} from '../_lib/jobday-atomic-854.js';
const fail=(error,status=409)=>json({ok:false,build:854,error,decision:'HOLD',
  master_connection:'HOLD',master_runtime_ack:false,consumer_authorized:false,
  atomic_ledger_claim_recorded:false,external_mirrors_verified:false,
  notification_sent:false,provider_mutation_performed:false,master_events_emitted:0},status);
const scoped=(caseId,postId)=>'case '+caseId+'; post '+postId+';';
const has=(note,k,v)=>typeof note==='string'&&typeof v==='string'&&v.length>0&&note.includes(' '+k+' '+v+';');
const audit=(rows,prefix,scope)=>rows.filter(x=>typeof x.safe_note==='string'&&x.safe_note.startsWith(prefix+' '+scope));
const params=({project,bookingId,post,caseId,kind,nonce,digest,revision,sequence,disposition,actor,
  incident=null,priorDigest=null,sla=null})=>({
  p_project_id:project.id,p_booking_id:bookingId,p_post_id:post.id,p_case_reference:caseId,
  p_kind:kind,p_receipt_nonce:nonce,p_evidence_sha256:digest,p_source_revision:revision,
  p_ledger_sequence:sequence,p_disposition:disposition,p_actor_staff_email:actor,
  p_incident_reference:incident,p_prior_ledger_sha256:priorDigest,
  p_sla_target_hours:sla?.review_target_hours||null,
  p_sla_due_at:sla?.review_due_at||null,p_response_observed_at:sla?.response_observed_at||null
});
async function atomicClaim(env,payload){
  const rows=await rest(env,'rpc/rosie854_append_evidence',{method:'POST',
    headers:{Prefer:'return=representation'},body:JSON.stringify(payload)});
  if(!Array.isArray(rows)||rows.length!==1||rows[0]?.outcome!=='INSERTED'||!isUuid(rows[0]?.ledger_id))
    return {ok:false,reason:'REPLAY_OR_CONFLICT_OR_ATOMIC_RPC_UNAVAILABLE'};
  return {ok:true,id:rows[0].ledger_id,recorded_at:rows[0].accepted_at};
}
export const onRequestOptions=()=>new Response('',{status:204});
export async function onRequest({request,env}){
  if(!['GET','POST'].includes(request.method))return fail('Only original-owner GET/POST reviews are supported.',405);
  if(Number(request.headers.get('content-length'))>12000)return fail('Signed evidence payload too large.',413);
  const raw=request.method==='POST'?await request.text().catch(()=>''):'';
  if(raw.length>12000)return fail('Signed evidence payload too large.',413);
  let body={};
  if(request.method==='POST'){
    try{body=JSON.parse(raw);if(!body||Array.isArray(body)||typeof body!=='object')throw Error();}
    catch{return fail('Valid JSON object required.',400);}
  }
  const bookingId=clean(body.booking_id||new URL(request.url).searchParams.get('booking_id'),80);
  if(!isUuid(bookingId))return fail('Exact original booking UUID required.',400);
  const auth=await requireStaffAccess({request,env,body,capability:'manage_staff',allowLegacyAdminFallback:false});
  if(!auth.ok)return auth.response;
  if(auth.auth_mode!=='session'||!ownerActor842(auth.actor))return fail('Original signed-in Rosie owner only; no bridge/legacy authority.',403);
  if(!serviceReady(env))return fail('Private original-source database unavailable.',503);
  try{
    const [bookings,projects,posts]=await Promise.all([
      rest(env,'bookings?select=id&id=eq.'+encodeURIComponent(bookingId)+'&limit=1'),
      rest(env,'creative_projects?select=id,consent_status,public_publish_allowed&source_booking_id=eq.'+encodeURIComponent(bookingId)+'&limit=2'),
      rest(env,'social_post_queue?select=id,platform,source_type&booking_id=eq.'+encodeURIComponent(bookingId)+'&source_type=eq.'+SOURCE_TYPE_842+'&order=created_at.desc&limit=21')
    ]);
    if(bookings?.length!==1||projects?.length!==1||!Array.isArray(posts)||!posts.length||posts.length>=21)
      return fail('Original booking, unique project and complete <=20 post source window required.');
    const project=projects[0];
    const [audits,revocations,ledger]=await Promise.all([
      rest(env,'creative_project_audit?select=id,safe_note,created_at&project_id=eq.'+encodeURIComponent(project.id)+'&event_type=eq.updated&order=created_at.desc&limit=250'),
      rest(env,'creative_project_audit?select=id&project_id=eq.'+encodeURIComponent(project.id)+'&event_type=eq.updated&safe_note=like.'+encodeURIComponent('Build 843 consent revoked:*')+'&limit=1'),
      rest(env,'rosie_incident_atomic_ledger_v854?select=id,kind,booking_id,post_id,case_reference,incident_reference,receipt_nonce,evidence_sha256,source_revision,ledger_sequence,disposition,sla_target_hours,sla_due_at,response_observed_at,recorded_at&project_id=eq.'+encodeURIComponent(project.id)+'&order=recorded_at.desc&limit=100')
    ]);
    if(!Array.isArray(audits)||audits.length>=250||!Array.isArray(revocations)||!Array.isArray(ledger)||ledger.length>=100)
      return fail('Original evidence or atomic ledger history truncated; reconcile offline.',503);
    const revoked=Boolean(revocations.length)||project.consent_status!=='approved_public'||project.public_publish_allowed!==true;
    const manifest=String(env?.ROSIE_RECALL_EXPECTED_PLATFORMS_852||'').split(',').map(p=>p.trim()).filter(Boolean);
    const attempts=await Promise.all(posts.map(p=>rest(env,'social_dispatch_attempts?select=id,status,platform,created_at,request_summary,response_summary&social_post_id=eq.'+encodeURIComponent(p.id)+'&order=created_at.desc&limit=200')));
    if(attempts.some(a=>!Array.isArray(a)||a.length>=200))return fail('Original social dispatch receipt history truncated.',503);
    const routing=escalationRouting853(posts.map((p,i)=>({post_id:p.id,platform:p.platform,attempts:attempts[i]})),{expectedPlatforms:manifest,revoked});
    const actor=clean(auth.actor?.email,140)||clean(auth.actor?.id,140)||'OriginalOwner';
    if(request.method==='GET'){
      const history=ledger.slice(0,50).map(l=>({
        ledger_id:l.id,kind:l.kind,recorded_at:l.recorded_at,post_id:l.post_id,
        case_reference:l.case_reference,incident_reference:l.incident_reference,
        ledger_sequence:l.ledger_sequence,disposition:l.disposition,
        sla_target_hours:l.sla_target_hours,sla_due_at:l.sla_due_at,
        response_observed_at:l.response_observed_at,atomic_source_claim:true,
        verified_master_delivery:false,provider_mutation_performed:false
      }));
      return json({ok:true,build:854,contract:CONTRACT_854,booking_id:bookingId,
        source_window_complete:routing.source_window_complete,routing_decision:routing.decision,
        routes:routing.routes,revocation_recorded:revocations.length>0,
        atomic_local_ledger_schema_readable:true,atomic_claims:history,
        signed_master_response_pin_enrolled:Boolean(env?.ROSIE_AIDATA_INCIDENT_RESPONSE_ED25519_PUBLIC_KEY_854),
        independent_master_transport_verified:false,atomic_master_ledger_verified:false,
        master_connection:'HOLD',master_runtime_ack:false,notification_sent:false,master_events_emitted:0});
    }
    if(!revocations.length||!revoked||routing.decision!=='ROUTING_REVIEW_ONLY')
      return fail('Original consent withdrawal or complete local source routing evidence required.');
    const caseId=clean(body.owner_case_reference,80),postId=clean(body.post_id,80),action=clean(body.action,70);
    if(!incidentReference853(caseId)||!isUuid(postId))return fail('Original case and exact post required.',400);
    const post=posts.find(p=>p.id===postId);
    if(!post)return fail('Post does not belong to this booking.');
    const scope=scoped(caseId,postId);
    if(action==='claim_atomic_replay_pilot'){
      if(body.confirm_independent_ledger_signer!==true||body.acknowledge_no_master_atomicity_or_transport_grant!==true)
        return fail('Explicit independent reviewer and non-authorizing atomicity pilot acknowledgements required.');
      const r=body.receipt||{};
      const prior=audit(audits,CONSUMER_AUDIT_852,scope).some(a=>has(a.safe_note,'signed_sha256',r.prior_consumer_sha256)&&
        has(a.safe_note,'nonce',r.prior_consumer_nonce)&&has(a.safe_note,'source_revision',r.prior_source_revision));
      if(!prior)return fail('Exact earlier signed consumer decision audit absent.');
      const v=await verifyReplayLedger853(env,r,body.signature,{bookingId,projectId:project.id,post,
        caseReference:caseId,priorConsumerSha:r.prior_consumer_sha256,
        priorConsumerNonce:r.prior_consumer_nonce,priorSourceRevision:r.prior_source_revision,actor});
      if(!v.ok)return fail(v.reason);
      const previous=audit(audits,REPLAY_AUDIT_853,scope).some(a=>
        has(a.safe_note,'nonce',r.nonce)&&has(a.safe_note,'signed_sha256',v.canonical_sha256)&&
        has(a.safe_note,'ledger_sequence',String(r.ledger_sequence))&&has(a.safe_note,'source_revision',r.source_revision));
      if(!previous)return fail('Same signed Build 853 review must first be persisted in original owner audit.');
      const claim=await atomicClaim(env,params({project,bookingId,post,caseId,kind:'ledger_snapshot',
        nonce:r.nonce,digest:v.canonical_sha256,revision:r.source_revision,
        sequence:r.ledger_sequence,disposition:'signed_snapshot_hold',actor}));
      if(!claim.ok)return fail('Independent ledger snapshot '+claim.reason);
      return json({ok:true,build:854,decision:'ATOMIC_SOURCE_PILOT_CLAIM_ONLY',
        ledger_id:claim.id,accepted_at:claim.recorded_at,review_sha256:v.canonical_sha256,
        source_database_atomic_nonce_claim:true,remote_master_atomicity_verified:false,
        master_connection:'HOLD',master_runtime_ack:false,consumer_authorized:false,
        master_events_emitted:0,notification_sent:false,provider_mutation_performed:false});
    }
    if(action==='reconcile_independent_master_incident'){
      if(body.confirm_independent_master_response_signature!==true||body.acknowledge_no_delivery_or_connected_grant!==true)
        return fail('Independent Master response signer and runtime transport HOLD acknowledgements required.');
      const r=body.receipt||{},incident=clean(body.incident_reference,80);
      if(!incidentReference853(incident))return fail('Safe original incident reference required.',400);
      const original=audit(audits,INCIDENT_AUDIT_853,scope).find(a=>has(a.safe_note,'incident',incident));
      if(!original)return fail('Original owner incident decision audit not found.');
      const route=/ route ([A-Z0-9_]+);/.exec(original.safe_note)?.[1],
        priority=/ priority ([A-Z]+);/.exec(original.safe_note)?.[1];
      const routeNow=routing.routes.find(x=>x.platform===post.platform);
      if(!routeNow||routeNow.route!==route||routeNow.priority!==priority)
        return fail('SLA route or priority drift requires renewed original owner incident review.');
      const snapshots=ledger.filter(x=>x.kind==='ledger_snapshot'&&x.post_id===postId&&
        x.case_reference===caseId&&x.evidence_sha256===r.prior_ledger_sha256&&
        x.ledger_sequence===r.prior_ledger_sequence&&x.source_revision===r.source_revision);
      if(snapshots.length!==1)return fail('Matching exact atomic source ledger snapshot absent or inconsistent.');
      const verdict=await verifyMaster854(env,r,body.signature,{bookingId,projectId:project.id,
        post,caseReference:caseId,incidentReference:incident,ledgerDigest:snapshots[0].evidence_sha256,
        ledgerSequence:snapshots[0].ledger_sequence,ownerAuditId:original.id,actor});
      if(!verdict.ok)return fail(verdict.reason);
      const sla=slaEvidence854({incidentRecordedAt:original.created_at,priority,route,
        observedAt:r.observed_at});
      const review=reconcileMaster854({verdict,sla,atomicSnapshot:snapshots[0],incidentAudit:original});
      if(review.decision!=='SIGNED_MASTER_RESPONSE_REVIEW_ONLY')
        return fail('Independent incident response remains HOLD: '+review.reasons.join(', '));
      const claim=await atomicClaim(env,params({project,bookingId,post,caseId,
        kind:'master_incident_response',nonce:r.nonce,digest:verdict.sha256,
        revision:r.source_revision,sequence:r.prior_ledger_sequence,actor,
        incident,priorDigest:r.prior_ledger_sha256,disposition:r.disposition,sla}));
      if(!claim.ok)return fail('Independent Master response '+claim.reason);
      return json({ok:true,build:854,ledger_id:claim.id,accepted_at:claim.recorded_at,
        response_sha256:verdict.sha256,sla, ...review,decision:'SIGNED_MASTER_RESPONSE_REVIEW_ONLY',
        source_database_atomic_nonce_claim:true,remote_master_atomicity_verified:false});
    }
    return fail('Unsupported Build 854 action.',405);
  }catch(e){return fail(e?.message||'Original incident ledger pilot unavailable.',503);}
}
