// Build 842 — original-owner observation, approved-public derivative handoff,
// and provenance-aware social delivery timeline. Never auto-publishes.
import {requireStaffAccess,json,isUuid} from '../_lib/staff-auth.js';
import {serviceReady,rest,clean} from '../_lib/creative-projects.js';
import {loadAssignablePublicPhoto} from '../_lib/photo-studio-safety.js';
import {publicUrlForKey} from '../_lib/photo-library.js';
import {ownerActor842,sourceGate842,verifyAttachedDerivative842,SOURCE_TYPE_842,HANDOFF_842} from '../_lib/jobday-social-842.js';

const safeFail=(error,status=400)=>json({ok:false,error,publication_happened:false},status);
const deviceTypes=new Set(['android_phone','iphone','ipad','android_tablet','desktop','other']);
const resultTypes=new Set(['pass','fail','blocked']);
const sanitizePost=(post,attempts=[])=>{
  const recent=attempts.filter(row=>row.social_post_id===post.id);
  const delivery=recent.find(row=>row.request_summary?.action==='publish_api'||row.request_summary?.action==='send_webhook'||row.request_summary?.action==='mark_posted')||null;
  let evidence='NOT_DELIVERED';
  if(delivery?.status==='failed'||delivery?.status==='blocked')evidence='DISPATCH_FAILED_OR_BLOCKED';
  else if(delivery?.status==='posted'&&delivery.request_summary?.action==='publish_api')evidence='PROVIDER_REPORTED_NOT_INDEPENDENTLY_VERIFIED';
  else if(delivery?.status==='posted'&&delivery.request_summary?.action==='send_webhook')evidence='WEBHOOK_ACCEPTED_PLATFORM_UNVERIFIED';
  else if(delivery?.status==='posted'&&delivery.request_summary?.action==='mark_posted')evidence='MANUAL_CLAIM_UNVERIFIED';
  return {id:post.id,platform:post.platform,status:post.status,source_id:post.source_id,media_attached:Array.isArray(post.media_urls)&&post.media_urls.length>0,review_status:post.review_status||null,evidence,delivery_at:delivery?.created_at||null,external_post_url:post.external_post_url||null,external_post_id:post.external_post_id||null};
};

export async function onRequestOptions(){return new Response('',{status:204});}
export async function onRequest(context){
  const {request,env}=context;
  if(!['GET','POST'].includes(request.method))return safeFail('Method not allowed.',405);
  const body=request.method==='POST'?await request.json().catch(()=>({})):{};
  const bookingId=clean(body.booking_id||new URL(request.url).searchParams.get('booking_id'),80);
  if(!isUuid(bookingId))return safeFail('Choose a valid booking ID.');
  const auth=await requireStaffAccess({request,env,body,capability:'manage_staff',allowLegacyAdminFallback:true});
  if(!auth.ok)return auth.response;
  if(!ownerActor842(auth.actor))return safeFail('Owner/supervisor dual authority is required.',403);
  if(!serviceReady(env))return safeFail('Private database service is unavailable.',503);
  try{
    const rows=await rest(env,`bookings?select=id,service_date,package_code,status,job_status&id=eq.${encodeURIComponent(bookingId)}&limit=1`);
    if(!rows?.length)return safeFail('Booking is not available.',404);
    const posts=await rest(env,`social_post_queue?select=id,booking_id,source_type,source_id,platform,status,review_status,media_urls,external_post_url,external_post_id&booking_id=eq.${encodeURIComponent(bookingId)}&source_type=eq.${SOURCE_TYPE_842}&order=created_at.desc&limit=40`);
    if(request.method==='GET'){
      const audit=await rest(env,`creative_projects?select=id,source_booking_id&source_booking_id=eq.${encodeURIComponent(bookingId)}&limit=2`);
      const audits=audit?.length===1?await rest(env,`creative_project_audit?select=id,event_type,safe_note,created_at,actor_staff_email&project_id=eq.${encodeURIComponent(audit[0].id)}&event_type=eq.updated&order=created_at.desc&limit=50`):[];
      const deviceReviews=(audits||[]).filter(row=>row.safe_note?.startsWith('Build 842 device observation:')).map(row=>({created_at:row.created_at,summary:row.safe_note.replace('Build 842 device observation:','').slice(0,220),self_attested:true,independently_verified:false}));
      const ids=(posts||[]).map(row=>row.id);
      const attempts=ids.length?await rest(env,`social_dispatch_attempts?select=id,social_post_id,platform,status,request_summary,response_summary,created_at&social_post_id=in.(${ids.join(',')})&order=created_at.desc&limit=120`):[];
      const gate=posts?.length?await sourceGate842(env,posts[0]):{ok:false,reason:'No DAIP-tagged job draft exists.'};
      return json({ok:true,build:842,booking:{id:rows[0].id,service_date:rows[0].service_date||null,package_code:rows[0].package_code||null,status:rows[0].status||null,job_status:rows[0].job_status||null},handoff:{ready:gate.ok,reason:gate.reason||null,blockers:gate.blockers||[],independent_lineage_proof:false},device_reviews:deviceReviews,posts:(posts||[]).map(post=>sanitizePost(post,attempts||[])),raw_media_shared:false,automatic_publication:false,provider_connection_inferred:false});
    }
    const action=clean(body.action,40);
    if(action==='record_device_observation'){
      const type=clean(body.device_type,30),result=clean(body.result,20),evidence=clean(body.evidence_reference,120);
      const accessible=body.accessibility_checked===true,recovery=body.recovery_checked===true;
      if(!deviceTypes.has(type)||!resultTypes.has(result)||!evidence||!accessible||!recovery)return safeFail('Choose a device, observation result, accessible recovery review and non-sensitive evidence reference.');
      const project=await rest(env,`creative_projects?select=id&source_booking_id=eq.${encodeURIComponent(bookingId)}&limit=2`);
      if(project?.length!==1)return safeFail('One linked DAIP project is required for this owner device review.',409);
      const summary=`Build 842 device observation: ${type} | ${result} | accessibility checked | recovery checked | owner reference ${evidence} | owner-attested, independent verification HOLD.`;
      const created=await rest(env,'creative_project_audit',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({project_id:project[0].id,event_type:'updated',actor_staff_email:clean(auth.actor?.email,200)||null,safe_note:summary})});
      return json({ok:true,observation_id:created?.[0]?.id||null,owner_attested:true,independently_verified:false,system_acceptance_unchanged:true});
    }
    if(action!=='attach_public_derivative')return safeFail('Unsupported owner action.');
    const postId=clean(body.post_id,80),photoId=clean(body.photo_id,80),lineage=clean(body.lineage_reference,120);
    if(!isUuid(postId)||!isUuid(photoId)||!lineage||body.lineage_attested!==true||body.privacy_review_attested!==true)return safeFail('Choose one draft and one approved public photo, explicitly attest its source lineage/privacy review and add an evidence reference.');
    const post=(posts||[]).find(row=>row.id===postId);
    if(!post||post.status!=='draft')return safeFail('Choose an existing draft for this booking. Approved or dispatched posts cannot be replaced.',409);
    if(Array.isArray(post.media_urls)&&post.media_urls.length)return safeFail('This draft already has media; do not overwrite an existing handoff.',409);
    const gate=await sourceGate842(env,post);
    if(!gate.ok)return json({ok:false,error:gate.reason,blockers:gate.blockers||[],publication_happened:false},409);
    const image=await loadAssignablePublicPhoto(env,photoId);
    if(!image.ok)return safeFail(image.error,image.status||409);
    const publicUrl=publicUrlForKey(env,image.photo.r2_key);
    // Write the audit *first*. A partial failure leaves a harmless review audit,
    // not a public post; publication checks still bind its URL to the queue row.
    const audit=await rest(env,'social_dispatch_attempts',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({social_post_id:post.id,platform:post.platform,status:HANDOFF_842,request_summary:{action:'attach_public_derivative',actor:clean(auth.actor?.email,160)||'Owner',photo_id:photoId,lineage_reference:lineage},response_summary:{public_url:publicUrl,project_id:gate.project_id,source_id:post.source_id,operator_lineage_attested:true,operator_privacy_attested:true,independently_verified:false,auto_publish:false}})});
    if(!audit?.[0]?.id)return safeFail('Handoff audit was not saved; attachment blocked.',503);
    const updated=await rest(env,`social_post_queue?id=eq.${encodeURIComponent(post.id)}&status=eq.draft`,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({media_urls:[publicUrl],status:'draft',review_status:'needs_review',customer_consent_confirmed:false,plate_privacy_confirmed:false,no_private_info_confirmed:false,updated_at:new Date().toISOString()})});
    if(updated?.length!==1)return safeFail('Draft changed during handoff. Refresh and review; nothing published.',409);
    const verified=await verifyAttachedDerivative842(env,updated[0]);
    if(!verified.ok)return safeFail('Handoff audit could not be reconciled: '+verified.reason,409);
    return json({ok:true,post_id:post.id,handoff_audit_id:audit[0].id,public_derivative_attached:true,owner_lineage_attested:true,independently_verified:false,post_status:'draft',publication_happened:false,review_required:true});
  }catch(err){return safeFail(err?.message||'Job-day owner evidence unavailable.',503);}
}
