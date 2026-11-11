// Build 844 — source-bound verifier witnesses, public derivative recall and
// independently witnessed original-device review. Nothing auto-publishes.
import {requireStaffAccess,json,isUuid} from '../_lib/staff-auth.js';
import {serviceReady,rest,clean} from '../_lib/creative-projects.js';
import {getPublicAssetsBucket,publicUrlForKey,isApprovedImageKey} from '../_lib/photo-library.js';
import {isPrivateMediaKey} from '../_lib/photo-studio-safety.js';
import {ownerActor842,SOURCE_TYPE_842,HANDOFF_842} from '../_lib/jobday-social-842.js';
import {validPlatformPostUrl843} from './jobday_platform_recall_843.js';
import {verifyPinnedWitness844,freshWitness844,digestReference844,nonce844,PROVIDER_STATUS_844,DEVICE_AUDIT_844,RECALL_AUDIT_844} from '../_lib/jobday-acceptance-844.js';

const fail=(error,status=400)=>json({ok:false,error,provider_post_changed:false,platform_takedown_performed:false,original_device_hardware_attested:false},status);
const hasRevocation=rows=>(rows||[]).some(row=>String(row.safe_note||'').startsWith('Build 843 consent revoked:'));
const isApproved=p=>p?.consent_status==='approved_public'&&p?.public_publish_allowed===true;
const safePost=p=>({id:p.id,platform:p.platform,status:p.status,posted_at:p.posted_at||null,external_post_id:p.external_post_id||null,external_post_url:p.external_post_url||null});

async function load844(env,bookingId){
  const [booking,projects,posts]=await Promise.all([
    rest(env,`bookings?select=id&id=eq.${encodeURIComponent(bookingId)}&limit=1`),
    rest(env,`creative_projects?select=id,source_booking_id,consent_status,public_publish_allowed&source_booking_id=eq.${encodeURIComponent(bookingId)}&limit=2`),
    rest(env,`social_post_queue?select=id,booking_id,source_type,source_id,platform,status,posted_at,external_post_url,external_post_id,media_urls&booking_id=eq.${encodeURIComponent(bookingId)}&source_type=eq.${SOURCE_TYPE_842}&order=created_at.desc&limit=500`)
  ]);
  if(booking?.length!==1||projects?.length!==1)throw Error('One existing booking and unique linked DAIP project are required.');
  const audits=await rest(env,`creative_project_audit?select=id,safe_note,created_at,actor_staff_email&project_id=eq.${encodeURIComponent(projects[0].id)}&event_type=eq.updated&order=created_at.desc&limit=250`);
  const extraRevocations=await rest(env,`creative_project_audit?select=id,safe_note&project_id=eq.${encodeURIComponent(projects[0].id)}&event_type=eq.updated&safe_note=like.${encodeURIComponent('Build 843 consent revoked:*')}&limit=1`);
  return {project:projects[0],posts:posts||[],audits:audits||[],revoked:hasRevocation(extraRevocations)||!isApproved(projects[0])};
}

async function attemptsFor(env,postId){return rest(env,`social_dispatch_attempts?select=id,platform,status,request_summary,response_summary,created_at&social_post_id=eq.${encodeURIComponent(postId)}&order=created_at.desc&limit=200`);}

export async function onRequestOptions(){return new Response('',{status:204});}
export async function onRequest({request,env}){
  if(!['GET','POST'].includes(request.method))return fail('Method not allowed.',405);
  const body=request.method==='POST'?await request.json().catch(()=>({})):{},bookingId=clean(body.booking_id||new URL(request.url).searchParams.get('booking_id'),80);
  if(!isUuid(bookingId))return fail('An existing booking UUID is required.');
  const auth=await requireStaffAccess({request,env,body,capability:'manage_staff',allowLegacyAdminFallback:true});
  if(!auth.ok)return auth.response;
  if(!ownerActor842(auth.actor))return fail('Owner authority is required.',403);
  if(!serviceReady(env))return fail('Private database service is unavailable.',503);
  try{
    const {project,posts,audits,revoked}=await load844(env,bookingId);
    const actor=clean(auth.actor?.email,140)||'Owner';
    if(request.method==='GET'){
      const results=[];
      // Bound the cross-ledger read to stay under Workers' request budget.
      for(const p of posts.slice(0,20)){
        const attempts=await attemptsFor(env,p.id);
        const live=attempts.find(a=>a.status===PROVIDER_STATUS_844.post_live);
        const removed=attempts.find(a=>a.status===PROVIDER_STATUS_844.post_removed);
        const derivative=attempts.find(a=>a.status==='public_derivative_r2_deleted');
        const pending=attempts.some(a=>a.status==='recall_required');
        results.push({...safePost(p),provider_receipt:removed?'PINNED_INDEPENDENT_VERIFIER_REPORTED_REMOVED':live?'PINNED_INDEPENDENT_VERIFIER_REPORTED_LIVE':pending?'RECALL_REQUIRED_PROVIDER_HOLD':'PROVIDER_VERIFICATION_HOLD',provider_receipt_at:removed?.created_at||live?.created_at||null,public_derivative_recall:derivative?'R2_ORIGIN_DELETED_CDN_CACHE_HOLD':revoked?'PUBLIC_RECALL_PENDING':'NOT_REQUESTED'});
      }
      return json({ok:true,build:844,booking_id:bookingId,revoked,post_count_in_bounded_view:posts.length,view_truncated:posts.length>20,posts:results,device_receipts:audits.filter(a=>a.safe_note?.startsWith(DEVICE_AUDIT_844)).map(a=>({id:a.id,created_at:a.created_at,summary:a.safe_note.slice(0,180),signature_witnessed:true,hardware_attested:false})),provider_pin_enrolled:Boolean(env?.ROSIE_SOCIAL_PROVIDER_WITNESS_ED25519_PUBLIC_KEY),device_pin_enrolled:Boolean(env?.ROSIE_DEVICE_INDEPENDENT_WITNESS_ED25519_PUBLIC_KEY),live_provider_lookup_executed_here:false,independent_owner_device_hardware_attested:false,platform_takedown_performed:false});
    }
    const action=clean(body.action,45),post=posts.find(p=>p.id===clean(body.post_id,80));
    if(action==='admit_provider_receipt'){
      const receipt=body.receipt||{},signature=body.signature;
      if(!post||receipt.version!==1||receipt.kind!=='provider'||receipt.booking_id!==bookingId||receipt.post_id!==post.id||receipt.platform!==post.platform)return fail('Independent provider witness receipt is not bound to this booking, post and platform.',409);
      if(!['post_live','post_removed'].includes(receipt.outcome)||receipt.external_post_id!==post.external_post_id||receipt.external_post_url!==post.external_post_url||!post.external_post_id||!validPlatformPostUrl843(post.platform,post.external_post_url))return fail('A recorded matching external provider ID, HTTPS URL and recognized outcome are required.',409);
      const validProviderResult=receipt.outcome==='post_live'?receipt.provider_http_status===200&&receipt.provider_result==='provider_post_found':[200,204].includes(receipt.provider_http_status)&&receipt.provider_result==='provider_delete_acknowledged';
      if(!validProviderResult||receipt.provider_access_authenticated!==true||!clean(receipt.provider_request_id,150)||!digestReference844(receipt.provider_response_sha256)||!freshWitness844(receipt)||!nonce844(receipt.nonce)||typeof receipt.witness_id!=='string'||!clean(receipt.witness_id,120)||receipt.witness_id.toLowerCase()===actor.toLowerCase())return fail('Fresh independent provider 200 visibility or explicit 200/204 deletion ACK, response digest, nonce and separate verifier are required; a 404 is not deletion proof.',409);
      const prior=await attemptsFor(env,post.id);
      if(receipt.outcome==='post_live'&&(!isApproved(project)||revoked||post.status!=='posted'||!post.posted_at))return fail('Current public-use consent and a genuinely posted source record are required; a revoked post cannot be confirmed live.',409);
      if(receipt.outcome==='post_removed'&&(!revoked||!prior.some(a=>a.status==='recall_required')))return fail('A durable consent withdrawal and this post’s external recall request must precede an independent removal receipt.',409);
      const sig=await verifyPinnedWitness844(env,'provider',receipt,signature);
      if(!sig.ok)return fail(sig.reason,409);
      const status=PROVIDER_STATUS_844[receipt.outcome];
      if(prior.some(a=>a.status===status&&a.request_summary?.nonce===receipt.nonce))return fail('This signed source-bound receipt has already been admitted.',409);
      const saved=await rest(env,'social_dispatch_attempts',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({social_post_id:post.id,platform:post.platform,status,request_summary:{action,actor,witness_id:receipt.witness_id,nonce:receipt.nonce,provider_request_id:receipt.provider_request_id},response_summary:{external_post_id:post.external_post_id,external_post_url:post.external_post_url,outcome:receipt.outcome,provider_http_status:receipt.provider_http_status,provider_result:receipt.provider_result,provider_response_sha256:receipt.provider_response_sha256,observed_at:receipt.observed_at,independent_witness_signature_valid:true,pin_id:sig.pin_id,authenticated_provider_response_attested:true,native_provider_signature_verified:false,no_live_lookup_performed_by_rosie:true}})});
      if(!saved?.[0]?.id)return fail('Independent provider witness receipt could not be stored.',503);
      return json({ok:true,receipt_id:saved[0].id,confirmation:receipt.outcome==='post_removed'?'SIGNED_INDEPENDENT_VERIFIER_ATTESTED_PROVIDER_REMOVAL':'SIGNED_INDEPENDENT_VERIFIER_ATTESTED_PROVIDER_VISIBILITY',provider_self_signed:false,independent_witness_signature_valid:true,automated_platform_mutation:false});
    }
    if(action==='admit_independent_device_review'){
      const receipt=body.receipt||{},signature=body.signature;
      if(receipt.version!==1||receipt.kind!=='device'||receipt.booking_id!==bookingId||receipt.project_id!==project.id||!['iphone','android_phone','ipad','android_tablet','desktop','other'].includes(receipt.device_type)||receipt.accessibility_pass!==true||receipt.recovery_pass!==true||!nonce844(receipt.nonce)||!freshWitness844(receipt)||!digestReference844(receipt.witness_reference_sha256)||typeof receipt.witness_id!=='string'||!clean(receipt.witness_id,120)||receipt.witness_id.toLowerCase()===actor.toLowerCase())return fail('Independent device evidence must be recent, source-bound, separated from owner, and attest both accessibility and recovery.',409);
      const observed=audits.find(a=>a.id===receipt.observation_audit_id&&a.safe_note?.startsWith(`Build 842 device observation: ${receipt.device_type} | pass | accessibility checked | recovery checked`));
      const closure=audits.find(a=>a.id===receipt.owner_closure_audit_id&&a.safe_note?.startsWith(`Build 843 mobile owner closure: ${receipt.device_type}; observation ${receipt.observation_audit_id};`));
      if(!observed||!closure||Date.now()-Date.parse(observed.created_at)>30*864e5||Date.parse(receipt.observed_at)<Date.parse(closure.created_at))return fail('Matching recent original-device PASS and specific owner closure must precede the independent witness.',409);
      const sig=await verifyPinnedWitness844(env,'device',receipt,signature);
      if(!sig.ok)return fail(sig.reason,409);
      if(audits.some(a=>a.safe_note?.includes(`witness nonce ${receipt.nonce};`)))return fail('This independent device witness nonce has already been used.',409);
      const note=`${DEVICE_AUDIT_844} ${receipt.device_type}; owner closure ${closure.id}; witness ${clean(receipt.witness_id,90)}; witness nonce ${receipt.nonce}; signature verified; accessible/recovery pass; hardware attestation HOLD.`;
      const saved=await rest(env,'creative_project_audit',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({project_id:project.id,event_type:'updated',actor_staff_email:actor,safe_note:note})});
      if(!saved?.[0]?.id)return fail('Independent device witness audit could not be saved.',503);
      return json({ok:true,review_id:saved[0].id,independent_witness_signature_valid:true,owner_review_recorded:true,original_hardware_independently_attested:false,production_business_acceptance_unchanged:true});
    }
    if(action==='delete_public_r2_derivative'){
      if(!post||!revoked||body.confirm_permanent_public_r2_deletion!==true||body.acknowledge_cdn_and_platform_copies_remain!==true||!clean(body.owner_case_reference,120))return fail('Select a revoked job post, explicit permanent public R2 deletion consent, and owner case reference.',409);
      const attempts=await attemptsFor(env,post.id),handoff=attempts.find(a=>a.status===HANDOFF_842&&a.response_summary?.project_id===project.id&&a.response_summary?.public_url===post.media_urls?.[0]);
      const photoId=handoff?.request_summary?.photo_id;
      if(!isUuid(photoId)||!Array.isArray(post.media_urls)||post.media_urls.length!==1||!attempts.some(a=>a.status==='recall_required'))return fail('The one-to-one approved public derivative and recall audit must be source-bound.',409);
      if(attempts.some(a=>a.status==='public_derivative_r2_deleted'))return fail('This public derivative already has a completed R2 deletion receipt.',409);
      const photoRows=await rest(env,`app_media_library?select=id,r2_key,source_status&id=eq.${encodeURIComponent(photoId)}&limit=1`);
      const photo=photoRows?.[0],key=photo?.r2_key;
      if(photoRows?.length!==1||photo.source_status!=='active'||!isApprovedImageKey(key)||isPrivateMediaKey(key)||publicUrlForKey(env,key)!==post.media_urls[0])return fail('Only a currently active, exact-matched public Photo Studio R2 derivative can be recalled.',409);
      const [assignments,users]=await Promise.all([
        rest(env,`app_media_assignments?select=id&media_id=eq.${encodeURIComponent(photo.id)}&is_active=eq.true&limit=1`),
        rest(env,`social_post_queue?select=id,booking_id,status&media_urls=cs.${encodeURIComponent(JSON.stringify([post.media_urls[0]]))}&limit=101`)
      ]);
      if(assignments?.length||users?.length===101||users?.some(p=>p.booking_id!==bookingId||p.status!=='failed'))return fail('This image still has an active site placement, another booking, or an unblocked social use. Resolve shared use before deletion.',409);
      const bucket=getPublicAssetsBucket(env);
      if(!bucket||typeof bucket.head!=='function'||typeof bucket.delete!=='function')return fail('Original public R2 binding with authenticated HEAD and DELETE is unavailable.',503);
      const origin=await bucket.head(key);
      if(!origin)return fail('Object was already absent; no deletion provenance can be certified from this action.',409);
      const preflight=await rest(env,'social_dispatch_attempts',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({social_post_id:post.id,platform:post.platform,status:'public_derivative_recall_requested',request_summary:{actor,owner_case_reference:clean(body.owner_case_reference,120),photo_id:photo.id},response_summary:{r2_key:key,r2_object_previously_present:true,external_cdn_and_platform_copies_unverified:true}})});
      if(!preflight?.[0]?.id)return fail('Persistent recall request could not be saved; deletion blocked.',503);
      // Archive before physical deletion so new Photo Studio assignments can
      // no longer choose the object during the removal window. A failure
      // leaves a safely archived public asset needing owner follow-up.
      const archived=await rest(env,`app_media_library?id=eq.${encodeURIComponent(photo.id)}&source_status=eq.active`,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({source_status:'archived',updated_at:new Date().toISOString()})});
      if(archived?.length!==1)return fail('Photo Studio archival could not be confirmed; physical deletion was blocked.',503);
      await bucket.delete(key);
      if(await bucket.head(key))return fail('Origin still returned the object after deletion. Do not claim recall completed.',503);
      const done=await rest(env,'social_dispatch_attempts',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({social_post_id:post.id,platform:post.platform,status:'public_derivative_r2_deleted',request_summary:{actor,owner_case_reference:clean(body.owner_case_reference,120),preflight_receipt_id:preflight[0].id,photo_id:photo.id},response_summary:{r2_key:key,r2_head_after_delete:'absent',photo_studio_status:'archived',cdn_cache_verified:false,external_platform_posts_deleted:false}})});
      if(!done?.[0]?.id)return fail('Origin is absent and Photo Studio archived, but final audit was not saved. Manual reconciliation required.',503);
      return json({ok:true,r2_origin_absent_verified:true,receipt_id:done[0].id,public_photo_studio_archived:true,cdn_cache_verified:false,external_platform_posts_deleted:false,private_original_media_deleted:false});
    }
    return fail('Unknown Build 844 owner action.');
  }catch(e){return fail(e?.message||'Build 844 private verification is unavailable.',503);}
}
