// Build 852 — original-owner only, read-only aging + signed review intake.
// Never mutate social providers, invoke Master transport or grant CONNECTED.
import {requireStaffAccess,json,isUuid} from '../_lib/staff-auth.js';
import {serviceReady,rest,clean} from '../_lib/creative-projects.js';
import {ownerActor842,SOURCE_TYPE_842} from '../_lib/jobday-social-842.js';
import {DEVICE_AUDIT_851,RECEIVER_AUDIT_851} from '../_lib/jobday-witness-851.js';
import {CONTRACT_852,DEVICE_RECHECK_AUDIT_852,CONSUMER_AUDIT_852,recallAging852,validateDeviceRecheck852,validateConsumerDecision852,continuityHold852} from '../_lib/jobday-continuity-852.js';
const fail=(error,status=409)=>json({ok:false,build:852,error,decision:'HOLD',master_connection:'HOLD',master_runtime_ack:false,external_mirrors_verified:false,provider_mutation_performed:false,master_events_emitted:0},status);
const CASE=/^[A-Za-z0-9][A-Za-z0-9_-]{2,79}$/;
const safeNote=(note,prefix,key)=>typeof note==='string'&&note.startsWith(prefix+' '+key);
const scoped=(audits,prefix,key)=>audits.filter(a=>safeNote(a.safe_note,prefix,key));
const has=(note,key,value)=>typeof note==='string'&&note.includes(' '+key+' '+value+';');
const replay=(audits,prefix,value)=>audits.some(a=>a.safe_note?.startsWith(prefix)&&has(a.safe_note,'nonce',value));
const keyFor=(caseId,postId)=>'case '+caseId+'; post '+postId+';';
const iso=v=>typeof v==='string'&&Number.isFinite(Date.parse(v))?Date.parse(v):NaN;
async function record(env,projectId,actor,note){
  const rows=await rest(env,'creative_project_audit',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({project_id:projectId,event_type:'updated',actor_staff_email:actor,safe_note:note})});
  if(!rows?.[0]?.id)throw Error('Signed decision review could not be persisted.');
  return rows[0].id;
}
export const onRequestOptions=()=>new Response('',{status:204});
export async function onRequest({request,env}){
  if(!['GET','POST'].includes(request.method))return fail('Only GET and POST permitted.',405);
  if(Number(request.headers.get('content-length'))>12000)return fail('Evidence payload exceeds allowed size.',413);
  const raw=request.method==='POST'?await request.text().catch(()=>''):'';
  if(raw.length>12000)return fail('Evidence payload exceeds allowed size.',413);
  let body={};if(request.method==='POST'){try{body=JSON.parse(raw);if(!body||typeof body!=='object'||Array.isArray(body))throw Error();}catch{return fail('Valid JSON object required.',400);}}
  const bookingId=clean(body.booking_id||new URL(request.url).searchParams.get('booking_id'),80);
  if(!isUuid(bookingId))return fail('Exact original booking UUID required.',400);
  const auth=await requireStaffAccess({request,env,body,capability:'manage_staff',allowLegacyAdminFallback:false});
  if(!auth.ok)return auth.response;
  if(auth.auth_mode!=='session'||!ownerActor842(auth.actor))return fail('Signed-in original Rosie owner required; legacy and bridge denied.',403);
  if(!serviceReady(env))return fail('Private original source evidence unavailable.',503);
  try{
    const [bookings,projects,posts]=await Promise.all([
      rest(env,'bookings?select=id&id=eq.'+encodeURIComponent(bookingId)+'&limit=1'),
      rest(env,'creative_projects?select=id,consent_status,public_publish_allowed&source_booking_id=eq.'+encodeURIComponent(bookingId)+'&limit=2'),
      rest(env,'social_post_queue?select=id,platform,source_type&booking_id=eq.'+encodeURIComponent(bookingId)+'&source_type=eq.'+SOURCE_TYPE_842+'&order=created_at.desc&limit=21')
    ]);
    if(bookings?.length!==1||projects?.length!==1||!Array.isArray(posts)||!posts.length||posts.length>=21)throw Error('Exact booking, unique project and complete 20-post source history required.');
    const project=projects[0];
    const [audits,revocations]=await Promise.all([
      rest(env,'creative_project_audit?select=id,safe_note,created_at&project_id=eq.'+encodeURIComponent(project.id)+'&event_type=eq.updated&order=created_at.desc&limit=250'),
      rest(env,'creative_project_audit?select=id&project_id=eq.'+encodeURIComponent(project.id)+'&event_type=eq.updated&safe_note=like.'+encodeURIComponent('Build 843 consent revoked:*')+'&limit=1')
    ]);
    if(!Array.isArray(audits)||audits.length>=250||!Array.isArray(revocations))throw Error('Complete audit/revocation history required; no inference from truncated data.');
    const revoked=Boolean(revocations.length)||project.consent_status!=='approved_public'||project.public_publish_allowed!==true;
    const manifest=String(env?.ROSIE_RECALL_EXPECTED_PLATFORMS_852||'').split(',').map(x=>x.trim()).filter(Boolean);
    const attempts=await Promise.all(posts.map(p=>rest(env,'social_dispatch_attempts?select=id,status,platform,created_at,request_summary,response_summary&social_post_id=eq.'+encodeURIComponent(p.id)+'&order=created_at.desc&limit=200')));
    if(attempts.some(rows=>!Array.isArray(rows)||rows.length>=200))throw Error('Original post receipt window incomplete; owner reconciliation required.');
    const aging=recallAging852(posts.map((p,i)=>({post_id:p.id,platform:p.platform,attempts:attempts[i]})),{expectedPlatforms:manifest,revoked});
    const actor=clean(auth.actor?.email,140)||String(auth.actor?.id||'OriginalOwner');
    if(request.method==='GET'){
      return json({ok:true,build:852,booking_id:bookingId,contract:CONTRACT_852,source_window_complete:aging.source_window_complete,platform_aging:aging.platforms,aging_decision:aging.decision,aging_reasons:aging.reasons,revocation_recorded:revocations.length>0,signed_rechecks:audits.filter(a=>a.safe_note?.startsWith(DEVICE_RECHECK_AUDIT_852)).length,consumer_continuity_reviews:audits.filter(a=>a.safe_note?.startsWith(CONSUMER_AUDIT_852)).length,required_device_pin_enrolled:Boolean(env?.ROSIE_ORIGINAL_DEVICE_WITNESS_ED25519_PUBLIC_KEY_851),required_master_pin_enrolled:Boolean(env?.ROSIE_AIDATA_CONSUMER_DECISION_ED25519_PUBLIC_KEY_852),...continuityHold852({revocationRecorded:revocations.length>0,aging})});
    }
    const action=clean(body.action,64),caseId=clean(body.owner_case_reference,80),postId=clean(body.post_id,80);
    if(!CASE.test(caseId)||!isUuid(postId))return fail('Original safe owner case and post UUID required.',400);
    const post=posts.find(p=>p.id===postId);if(!post)return fail('Original post does not belong to this booking.');
    if(!revoked||!revocations.length||aging.decision!=='REVIEW_ONLY')return fail('Original consent or platform evidence coverage is HOLD.');
    const key=keyFor(caseId,postId);
    const witnesses=scoped(audits,DEVICE_AUDIT_851,key),acks=scoped(audits,RECEIVER_AUDIT_851,key),rechecks=scoped(audits,DEVICE_RECHECK_AUDIT_852,key),decisions=scoped(audits,CONSUMER_AUDIT_852,key);
    if(action==='admit_signed_original_device_recheck'){
      if(body.confirm_original_device_recheck_signature!==true||body.acknowledge_physical_device_presence_unverified!==true)return fail('Independent device signature and physical-presence HOLD acknowledgment required.');
      const r=body.receipt||{};
      const prior=witnesses.find(a=>has(a.safe_note,'signed_sha256',r.prior_witness_sha256)&&has(a.safe_note,'nonce',r.prior_witness_nonce)&&has(a.safe_note,'source_revision',r.prior_source_revision));
      if(!prior)return fail('Matching original Build 851 signed witness audit required.');
      if(replay(audits,DEVICE_RECHECK_AUDIT_852,r.nonce))return fail('Signed device recheck nonce replay denied.');
      const v=await validateDeviceRecheck852(env,r,body.signature,{bookingId,projectId:project.id,post,caseReference:caseId,priorWitnessSha256:r.prior_witness_sha256,priorWitnessNonce:r.prior_witness_nonce,priorSourceRevision:r.prior_source_revision,actor});
      if(!v.ok)return fail(v.reason);
      const note=DEVICE_RECHECK_AUDIT_852+' '+key+' nonce '+r.nonce+'; signed_sha256 '+v.sha256+'; prior_witness_sha256 '+r.prior_witness_sha256+'; prior_witness_nonce '+r.prior_witness_nonce+'; prior_source_revision '+r.prior_source_revision+'; source_revision '+r.source_revision+'; signer '+r.signer_id+'; expires '+v.expires_at+'; device signed recheck only, physical-presence HOLD, Master HOLD.';
      const id=await record(env,project.id,actor,note);
      return json({ok:true,build:852,audit_id:id,signed_recheck_sha256:v.sha256,review_recorded:true,original_device_presence_independently_verified:false,master_connection:'HOLD',consumer_authorized:false,master_events_emitted:0});
    }
    if(action==='record_signed_master_consumer_decision'){
      if(body.confirm_independent_consumer_signature!==true||body.acknowledge_no_verified_runtime_transport!==true)return fail('Separate Master signature and runtime transport HOLD acknowledgment required.');
      const r=body.receipt||{};
      const priorAck=acks.find(a=>has(a.safe_note,'signed_sha256',r.prior_ack_sha256)&&has(a.safe_note,'ack_nonce',r.prior_ack_nonce)&&has(a.safe_note,'source_revision',r.prior_source_revision));
      const recheck=rechecks.find(a=>has(a.safe_note,'signed_sha256',r.device_recheck_sha256)&&has(a.safe_note,'nonce',r.device_recheck_nonce)&&has(a.safe_note,'prior_source_revision',r.prior_source_revision));
      if(!priorAck||!recheck)return fail('Exact prior 851 ACK and fresh signed original-device recheck audits required.');
      if(!has(priorAck.safe_note,'witness_sha256',(()=>{const found=/ prior_witness_sha256 ([0-9a-f]{64});/.exec(recheck.safe_note);return found?.[1]||'none';})()))return fail('Master ACK and device recheck must share original witness lineage.');
      const exp=/ expires ([^;]+);/.exec(recheck.safe_note);
      if(!Number.isFinite(iso(exp?.[1]))||iso(exp[1])<=Date.now())return fail('Previously signed recheck expired; new recheck required.');
      if(replay(audits,CONSUMER_AUDIT_852,r.nonce))return fail('Independent consumer decision nonce replay denied.');
      const deviceSigner=/ signer ([A-Za-z0-9_.@-]+);/.exec(recheck.safe_note)?.[1];
      if(!deviceSigner)return fail('Distinct original-device signer provenance missing.');
      const v=await validateConsumerDecision852(env,r,body.signature,{bookingId,projectId:project.id,post,caseReference:caseId,priorAckSha256:r.prior_ack_sha256,priorAckNonce:r.prior_ack_nonce,priorSourceRevision:r.prior_source_revision,recheckSha256:r.device_recheck_sha256,recheckNonce:r.device_recheck_nonce,deviceSigner,actor});
      if(!v.ok)return fail(v.reason);
      const note=CONSUMER_AUDIT_852+' '+key+' nonce '+r.nonce+'; signed_sha256 '+v.sha256+'; prior_ack_sha256 '+r.prior_ack_sha256+'; recheck_sha256 '+r.device_recheck_sha256+'; source_revision '+r.source_revision+'; decision '+r.decision+'; expires '+v.expires_at+'; distinct signer review only, receiver transport/replay unverified, CONNECTED HOLD.';
      const id=await record(env,project.id,actor,note);
      return json({ok:true,build:852,audit_id:id,signed_consumer_decision_sha256:v.sha256,...continuityHold852({revocationRecorded:true,aging,deviceRecheckRecorded:true,consumerDecisionRecorded:true})});
    }
    return fail('Unknown Build 852 action.',405);
  }catch(e){return fail(e?.message||'Original private evidence unavailable.',503);}
}
