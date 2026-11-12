// Build 851 — owner session-only, append-only, non-authorizing evidence review.
import {requireStaffAccess,json,isUuid} from '../_lib/staff-auth.js';
import {serviceReady,rest,clean} from '../_lib/creative-projects.js';
import {ownerActor842,SOURCE_TYPE_842} from '../_lib/jobday-social-842.js';
import {recoveryCustody850} from '../_lib/jobday-custody-850.js';
import {CONTRACT_851,DEVICE_AUDIT_851,RECEIVER_AUDIT_851,CLOSURE_AUDIT_851,validateDeviceWitness851,validateReceiverAck851,consentSafeReview851} from '../_lib/jobday-witness-851.js';
const fail=(error,status=409)=>json({ok:false,error,build:851,master_connection:'HOLD',master_runtime_ack:false,external_mirrors_verified:false,provider_mutation_performed:false,master_events_emitted:0},status);
const CASE=/^[A-Za-z0-9][A-Za-z0-9_-]{2,79}$/;
const ATTEMPT_SELECT='id,status,platform,created_at,request_summary,response_summary';
const scopeKey=(caseId,postId)=>'case '+caseId+'; post '+postId+';';
const reviews=(rows,prefix,caseId,postId)=>rows.filter(a=>typeof a.safe_note==='string'&&a.safe_note.startsWith(prefix+' '+scopeKey(caseId,postId)));
async function audit(env,projectId,actor,note){
  const rows=await rest(env,'creative_project_audit',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({project_id:projectId,event_type:'updated',actor_staff_email:actor,safe_note:note})});
  if(!rows?.[0]?.id)throw Error('Evidence review was not durably audited.');
  return rows[0].id;
}
export const onRequestOptions=()=>new Response('',{status:204});
export async function onRequest({request,env}){
  if(!['GET','POST'].includes(request.method))return fail('Only GET and POST supported.',405);
  if(Number(request.headers.get('content-length'))>10000)return fail('Receipt payload too large.',413);
  const raw=request.method==='POST'?await request.text().catch(()=>''):'';
  if(raw.length>10000)return fail('Receipt payload too large.',413);
  let body={};
  if(request.method==='POST'){try{body=JSON.parse(raw);if(!body||typeof body!=='object'||Array.isArray(body))throw Error();}catch{return fail('Valid JSON required.',400);}}
  const bookingId=clean(body.booking_id||new URL(request.url).searchParams.get('booking_id'),80);
  if(!isUuid(bookingId))return fail('Exact original booking UUID required.',400);
  const auth=await requireStaffAccess({request,env,body,capability:'manage_staff',allowLegacyAdminFallback:false});
  if(!auth.ok)return auth.response;
  if(auth.auth_mode!=='session'||!ownerActor842(auth.actor))return fail('Original signed-in Rosie owner session required; legacy and bridge denied.',403);
  if(!serviceReady(env))return fail('Private original evidence unavailable.',503);
  try{
    const [bookings,projects,posts]=await Promise.all([
      rest(env,'bookings?select=id&id=eq.'+encodeURIComponent(bookingId)+'&limit=1'),
      rest(env,'creative_projects?select=id,consent_status,public_publish_allowed&source_booking_id=eq.'+encodeURIComponent(bookingId)+'&limit=2'),
      rest(env,'social_post_queue?select=id,platform,source_type&booking_id=eq.'+encodeURIComponent(bookingId)+'&source_type=eq.'+SOURCE_TYPE_842+'&order=created_at.desc&limit=51')
    ]);
    if(bookings?.length!==1||projects?.length!==1||!Array.isArray(posts)||posts.length>=51)throw Error('Original booking, unique linked project and complete bounded source posts required.');
    const project=projects[0];
    const [audits,revocations]=await Promise.all([
      rest(env,'creative_project_audit?select=id,safe_note,created_at&project_id=eq.'+encodeURIComponent(project.id)+'&event_type=eq.updated&order=created_at.desc&limit=250'),
      rest(env,'creative_project_audit?select=id&project_id=eq.'+encodeURIComponent(project.id)+'&event_type=eq.updated&safe_note=like.'+encodeURIComponent('Build 843 consent revoked:*')+'&limit=1')
    ]);
    if(!Array.isArray(audits)||audits.length>=250||!Array.isArray(revocations))throw Error('Original consent history or audit window incomplete.');
    const revoked=Boolean(revocations.length)||project.consent_status!=='approved_public'||project.public_publish_allowed!==true;
    const actor=clean(auth.actor?.email,140)||String(auth.actor?.id||'Owner');
    if(request.method==='GET')return json({ok:true,build:851,booking_id:bookingId,contract:CONTRACT_851,posts_reviewable:posts.length,consent_withdrawn:revoked,revocation_recorded:Boolean(revocations.length),device_pin_enrolled:Boolean(env?.ROSIE_ORIGINAL_DEVICE_WITNESS_ED25519_PUBLIC_KEY_851&&env?.ROSIE_ORIGINAL_DEVICE_ID_851),master_ack_pin_enrolled:Boolean(env?.ROSIE_AIDATA_RECEIVER_ACK_ED25519_PUBLIC_KEY_851),device_witness_reviews:audits.filter(a=>a.safe_note?.startsWith(DEVICE_AUDIT_851)).length,ack_correlation_reviews:audits.filter(a=>a.safe_note?.startsWith(RECEIVER_AUDIT_851)).length,scoped_exception_reviews:audits.filter(a=>a.safe_note?.startsWith(CLOSURE_AUDIT_851)).length,master_connection:'HOLD',master_runtime_ack:false,external_mirrors_verified:false,master_events_emitted:0});
    const action=clean(body.action,64),caseId=clean(body.owner_case_reference,80),postId=clean(body.post_id,80);
    if(!CASE.test(caseId)||!isUuid(postId))return fail('Safe owner case and original post UUID required.',400);
    const post=posts.find(p=>p.id===postId);if(!post)return fail('Original job post not found.');
    const rows=await rest(env,'social_dispatch_attempts?select='+ATTEMPT_SELECT+'&social_post_id=eq.'+encodeURIComponent(postId)+'&order=created_at.desc&limit=200');
    if(!Array.isArray(rows)||rows.length>=200)throw Error('Original post evidence window truncated.');
    const custody=recoveryCustody850(rows,{revoked});
    const ws=reviews(audits,DEVICE_AUDIT_851,caseId,postId),as=reviews(audits,RECEIVER_AUDIT_851,caseId,postId),key=scopeKey(caseId,postId);
    if(action==='admit_original_device_witness'){
      if(body.confirm_independent_device_signature!==true||body.acknowledge_external_mirrors_and_master_hold!==true||!revocations.length)return fail('Recorded original consent withdrawal and independent signed HOLD acknowledgment required.');
      const receipt=body.receipt||{},v=await validateDeviceWitness851(env,receipt,body.signature,{bookingId,projectId:project.id,post,caseReference:caseId,custody,actor});
      if(!v.ok)return fail(v.reason);
      if(ws.some(a=>a.safe_note.includes(' nonce '+receipt.nonce+';')))return fail('Original-device witness nonce replay denied.');
      const note=DEVICE_AUDIT_851+' '+key+' nonce '+receipt.nonce+'; signed_sha256 '+v.sha256+'; source_revision '+receipt.source_revision+'; provider '+receipt.provider_receipt_id+'; cdn '+receipt.cdn_receipt_id+'; closure '+receipt.closure_receipt_id+'; expires '+v.expires_at+'; scoped only, consent withdrawn, external mirrors and Master HOLD.';
      const id=await audit(env,project.id,actor,note);
      return json({ok:true,build:851,audit_id:id,witness_sha256:v.sha256,original_device_signature_verified:true,decision:'SCOPED_REVIEW_ONLY',master_connection:'HOLD',master_runtime_ack:false,provider_mutation_performed:false,external_mirrors_verified:false,master_events_emitted:0});
    }
    if(action==='correlate_independent_master_ack'){
      if(body.confirm_independent_master_signature!==true||body.acknowledge_transport_and_replay_hold!==true)return fail('Independent signer and runtime HOLD acknowledgments required.');
      const receipt=body.receipt||{};
      const w=ws.find(a=>a.safe_note.includes(' signed_sha256 '+receipt.witness_sha256+';')&&a.safe_note.includes(' nonce '+receipt.witness_nonce+';'));
      if(!w)return fail('Persisted exact signed original-device witness digest and nonce required.');
      if(as.some(a=>a.safe_note.includes(' ack_nonce '+receipt.nonce+';')))return fail('Independent Master ACK review nonce replay denied.');
      const v=await validateReceiverAck851(env,receipt,body.signature,{bookingId,projectId:project.id,post,caseReference:caseId,witnessSha256:receipt.witness_sha256,witnessNonce:receipt.witness_nonce,actor});
      if(!v.ok)return fail(v.reason);
      const note=RECEIVER_AUDIT_851+' '+key+' ack_nonce '+receipt.nonce+'; witness_sha256 '+receipt.witness_sha256+'; witness_nonce '+receipt.witness_nonce+'; signed_sha256 '+v.sha256+'; replay_digest '+receipt.durable_replay_digest_sha256+'; source_revision '+receipt.source_revision+'; expires '+v.expires_at+'; signed receipt review only, independent transport/replay unverified, Master HOLD.';
      const id=await audit(env,project.id,actor,note);
      return json({ok:true,build:851,audit_id:id,ack_signature_verified:true,correlated_witness_sha256:receipt.witness_sha256,durable_receiver_transport_verified:false,durable_replay_verified:false,master_runtime_ack:false,master_connection:'HOLD',consumer_authorized:false,master_events_emitted:0});
    }
    if(action==='review_consent_safe_exception'){
      if(body.acknowledge_scope_only_no_global_removal!==true||body.acknowledge_master_runtime_hold!==true)return fail('Explicit scoped-only and Master HOLD acknowledgments required.');
      const sha=clean(body.witness_sha256,64),nonce=clean(body.witness_nonce,100);
      const w=ws.find(a=>a.safe_note.includes(' signed_sha256 '+sha+';')&&a.safe_note.includes(' nonce '+nonce+';'));
      const ack=as.find(a=>a.safe_note.includes(' witness_sha256 '+sha+';')&&a.safe_note.includes(' witness_nonce '+nonce+';'));
      const v=consentSafeReview851({revoked,revocationRecorded:revocations.length>0,custody,witnessRecorded:Boolean(w),ackRecorded:Boolean(ack),caseBound:/^[0-9a-f]{64}$/.test(sha)&&/^[A-Za-z0-9_-]{20,100}$/.test(nonce)});
      if(v.decision!=='SCOPED_REVIEW_ONLY')return fail('Exception closure evidence HOLD: '+v.reasons.join(', '));
      if(reviews(audits,CLOSURE_AUDIT_851,caseId,postId).some(a=>a.safe_note.includes(' witness_sha256 '+sha+';')))return fail('Scoped review already recorded for this witness; replay denied.');
      const note=CLOSURE_AUDIT_851+' '+key+' witness_sha256 '+sha+'; consent withdrawal recorded, original provider/CDN evidence scoped, signed Master ACK reviewed, transport/replay unverified, global removal and CONNECTED HOLD.';
      const id=await audit(env,project.id,actor,note);
      return json({ok:true,build:851,audit_id:id,...v});
    }
    return fail('Unknown Build 851 review action.',405);
  }catch(e){return fail(e?.message||'Original private evidence unavailable.',503);}
}
