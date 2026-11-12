// Rosie 855: signed-in original-owner cross-plane transaction HOLD pilot.
// The POST never sends Master messages, acknowledges providers or closes incidents.
import {requireStaffAccess,json,isUuid} from '../_lib/staff-auth.js';
import {serviceReady,rest,clean} from '../_lib/creative-projects.js';
import {ownerActor842,SOURCE_TYPE_842} from '../_lib/jobday-social-842.js';
import {INCIDENT_AUDIT_853,incidentReference853,escalationRouting853} from '../_lib/jobday-replay-853.js';
import {slaEvidence854} from '../_lib/jobday-atomic-854.js';
import {CONTRACT_855,verifyTransaction855,reviewCrossPlane855} from '../_lib/jobday-transaction-855.js';
const fail=(error,status=409)=>json({ok:false,build:855,error,decision:'HOLD',
  master_connection:'HOLD',master_runtime_ack:false,remote_transaction_commit_verified:false,
  owner_operational_incident_closed:false,consumer_authorized:false,
  master_events_emitted:0,provider_mutation_performed:false},status);
const matched=(note,key,value)=>typeof note==='string'&&typeof value==='string'&&value.length>0&&note.includes(' '+key+' '+value+';');
const scope=(caseId,postId)=>'case '+caseId+'; post '+postId+';';
const originalOwnerIncident=(audits,caseId,postId,incident)=>audits.find(a=>
  a.safe_note?.startsWith(INCIDENT_AUDIT_853+' '+scope(caseId,postId))&&matched(a.safe_note,'incident',incident));
async function insert(env,body){
 const rows=await rest(env,'rpc/rosie855_record_transaction_review',{
   method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify(body)});
 if(!Array.isArray(rows)||rows.length!==1||rows[0].outcome!=='INSERTED'||!isUuid(rows[0].review_id))
   throw Error('Atomic cross-plane transaction replay or incident conflict; no review accepted.');
 return {id:rows[0].review_id,recorded_at:rows[0].accepted_at};
}
export const onRequestOptions=()=>new Response('',{status:204});
export async function onRequest({request,env}){
 if(!['GET','POST'].includes(request.method))return fail('Original owner GET and POST only.',405);
 if(Number(request.headers.get('content-length'))>14000)return fail('Evidence payload too large.',413);
 const raw=request.method==='POST'?await request.text().catch(()=>''):'';
 if(raw.length>14000)return fail('Evidence payload too large.',413);
 let body={};
 if(request.method==='POST')try{body=JSON.parse(raw);if(!body||typeof body!=='object'||Array.isArray(body))throw Error();}
 catch{return fail('JSON object required.',400);}
 const bookingId=clean(body.booking_id||new URL(request.url).searchParams.get('booking_id'),80);
 if(!isUuid(bookingId))return fail('Exact original booking UUID required.',400);
 const auth=await requireStaffAccess({request,env,body,capability:'manage_staff',allowLegacyAdminFallback:false});
 if(!auth.ok)return auth.response;
 if(auth.auth_mode!=='session'||!ownerActor842(auth.actor))
   return fail('Original Rosie owner session required, bridge and legacy denied.',403);
 if(!serviceReady(env))return fail('Original source service database unavailable.',503);
 try{
   const [bookings,projects,posts]=await Promise.all([
     rest(env,'bookings?select=id&id=eq.'+encodeURIComponent(bookingId)+'&limit=1'),
     rest(env,'creative_projects?select=id,consent_status,public_publish_allowed&source_booking_id=eq.'+encodeURIComponent(bookingId)+'&limit=2'),
     rest(env,'social_post_queue?select=id,platform,source_type&booking_id=eq.'+encodeURIComponent(bookingId)+'&source_type=eq.'+SOURCE_TYPE_842+'&order=created_at.desc&limit=21')
   ]);
   if(bookings?.length!==1||projects?.length!==1||!Array.isArray(posts)||!posts.length||posts.length>=21)
     return fail('Original booking, one project and bounded complete social posts required.');
   const project=projects[0];
   const [audits,revocations,responses,reviews]=await Promise.all([
     rest(env,'creative_project_audit?select=id,safe_note,created_at&project_id=eq.'+encodeURIComponent(project.id)+'&event_type=eq.updated&order=created_at.desc&limit=250'),
     rest(env,'creative_project_audit?select=id&project_id=eq.'+encodeURIComponent(project.id)+'&event_type=eq.updated&safe_note=like.'+encodeURIComponent('Build 843 consent revoked:*')+'&limit=1'),
     rest(env,'rosie_incident_atomic_ledger_v854?select=id,kind,project_id,booking_id,post_id,case_reference,incident_reference,evidence_sha256,source_revision,sla_due_at,recorded_at,disposition&project_id=eq.'+encodeURIComponent(project.id)+'&kind=eq.master_incident_response&order=recorded_at.desc&limit=100'),
     rest(env,'rosie_master_transaction_review_v855?select=id,transaction_reference,incident_reference,post_id,case_reference,recorded_at,source_sla_due_at,sla_review_status,owner_review_decision&project_id=eq.'+encodeURIComponent(project.id)+'&order=recorded_at.desc&limit=100')
   ]);
   if(!Array.isArray(audits)||audits.length>=250||!Array.isArray(revocations)||!Array.isArray(responses)||
     responses.length>=100||!Array.isArray(reviews)||reviews.length>=100)
     return fail('Original audit or independent transaction evidence window incomplete.',503);
   const revoked=Boolean(revocations.length)||project.consent_status!=='approved_public'||project.public_publish_allowed!==true;
   const manifest=String(env?.ROSIE_RECALL_EXPECTED_PLATFORMS_852||'').split(',').map(x=>x.trim()).filter(Boolean);
   const attempts=await Promise.all(posts.map(p=>rest(env,
     'social_dispatch_attempts?select=id,status,platform,created_at,request_summary,response_summary&social_post_id=eq.'+
     encodeURIComponent(p.id)+'&order=created_at.desc&limit=200')));
   if(attempts.some(x=>!Array.isArray(x)||x.length>=200))return fail('Truncated source recall attempts.',503);
   const routing=escalationRouting853(posts.map((p,i)=>({post_id:p.id,platform:p.platform,attempts:attempts[i]})),
     {expectedPlatforms:manifest,revoked});
   if(request.method==='GET'){
     return json({ok:true,build:855,contract:CONTRACT_855,booking_id:bookingId,
       source_window_complete:routing.source_window_complete,routing_decision:routing.decision,
       revocation_recorded:revocations.length>0,independent_response_count:responses.length,
       transaction_reviews:reviews.slice(0,50),
       ai_data_public_signer_enrolled:Boolean(env?.ROSIE_AIDATA_TX_REPLAY_ED25519_PUBLIC_KEY_855),
       comms_public_signer_enrolled:Boolean(env?.ROSIE_COMMS_TX_REPLAY_ED25519_PUBLIC_KEY_855),
       owner_operational_incident_closed:false,remote_transaction_commit_verified:false,
       confirmed_sla_resolution:false,master_connection:'HOLD',master_runtime_ack:false,master_events_emitted:0});
   }
   if(!revocations.length||!revoked||routing.decision!=='ROUTING_REVIEW_ONLY')
     return fail('Original explicit consent withdrawal and complete platform evidence required.');
   if(body.action!=='record_cross_plane_transaction_review'||
     body.confirm_independent_ai_data_and_comms_signatures!==true||
     body.acknowledge_no_remote_transaction_or_incident_closure!==true)
     return fail('Explicit owner two-plane signature review and operational HOLD acknowledgements required.');
   const postId=clean(body.post_id,80),caseId=clean(body.owner_case_reference,80),
     incident=clean(body.incident_reference,80),tx=clean(body.transaction_reference,96);
   if(!isUuid(postId)||!incidentReference853(caseId)||!incidentReference853(incident)||
      !/^[A-Za-z0-9][A-Za-z0-9_-]{11,95}$/.test(tx))return fail('Original post, case, incident and safe transaction reference required.',400);
   const post=posts.find(x=>x.id===postId);
   if(!post)return fail('Post does not belong to original booking.');
   const owner=originalOwnerIncident(audits,caseId,postId,incident);
   if(!owner||!isUuid(owner.id))return fail('Original durable 853 owner incident decision absent.');
   const route=/ route ([A-Z0-9_]+);/.exec(owner.safe_note)?.[1],
     priority=/ priority ([A-Z]+);/.exec(owner.safe_note)?.[1];
   const active=routing.routes.find(x=>x.platform===post.platform);
   if(!active||active.route!==route||active.priority!==priority)
     return fail('Original owner incident route drift requires renewed manual review.');
   const sla=slaEvidence854({incidentRecordedAt:owner.created_at,priority,route});
   if(sla.decision!=='SLA_REVIEW_ONLY')return fail('Original incident clock cannot be independently evaluated.');
   const prior=responses.find(x=>x.id===body.prior_854_response_id&&
     x.booking_id===bookingId&&x.post_id===postId&&x.case_reference===caseId&&
     x.incident_reference===incident&&
     ['hold_response_acknowledged','hold_response_recheck_required'].includes(x.disposition));
   if(!prior||Date.parse(prior.sla_due_at)!==Date.parse(sla.review_due_at))
     return fail('Exact prior Build 854 atomic HOLD response and source SLA anchor required.');
   const actor=clean(auth.actor?.email,140)||clean(auth.actor?.id,140)||'OriginalOwner';
   const ai=body.ai_data_receipt||{},comms=body.comms_receipt||{};
   const context={bookingId,projectId:project.id,post,caseReference:caseId,incidentReference:incident,
     transactionReference:tx,prior854:prior,ownerAuditId:owner.id,actor};
   const [a,c]=await Promise.all([
     verifyTransaction855(env,ai,body.ai_data_signature,{...context,plane:'ai-data-platform'}),
     verifyTransaction855(env,comms,body.comms_signature,{...context,plane:'rosevear-comms-hub'})
   ]);
   const review=reviewCrossPlane855({ai:a,comms:c,prior854:prior,
     incidentRecordedAt:owner.created_at,ownerDecision:body.owner_review_decision});
   if(review.decision!=='OWNER_CROSS_PLANE_REVIEW_RECORDED_ONLY')
     return fail('Two-plane source review remains HOLD: '+review.reasons.join(', '));
   const claimed=await insert(env,{
     p_project_id:project.id,p_booking_id:bookingId,p_post_id:post.id,p_owner_audit_id:owner.id,
     p_source_854_response_id:prior.id,p_source_854_response_sha256:prior.evidence_sha256,
     p_case_reference:caseId,p_incident_reference:incident,p_transaction_reference:tx,
     p_source_revision:env.CF_PAGES_COMMIT_SHA,
     p_ai_data_nonce:a.nonce,p_comms_nonce:c.nonce,
     p_ai_data_sha256:a.canonical_sha256,p_comms_sha256:c.canonical_sha256,
     p_ai_data_observed_at:a.observed_at,p_comms_observed_at:c.observed_at,
     p_source_sla_due_at:review.source_sla_due_at,p_sla_review_status:review.review_status,
     p_owner_review_decision:body.owner_review_decision,p_actor_staff_email:actor
   });
   return json({ok:true,build:855,ledger_review_id:claimed.id,recorded_at:claimed.recorded_at,
     transaction_reference:tx,ai_data_signature_verified:true,comms_signature_verified:true,
     local_atomic_owner_review_recorded:true,...review});
 }catch(e){return fail(e?.message||'Original independent cross-plane receipt review unavailable.',503);}
}
