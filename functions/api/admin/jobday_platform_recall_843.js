// Build 843 — per-platform owner-observed post evidence, fail-closed consent
// withdrawal, and original-device accessibility closure. No external mutation.
import {requireStaffAccess,json,isUuid} from '../_lib/staff-auth.js';
import {rest,serviceReady,clean} from '../_lib/creative-projects.js';
import {ownerActor842,SOURCE_TYPE_842} from '../_lib/jobday-social-842.js';

const safeFail=(message,status=400)=>json({ok:false,error:message,provider_takedown_performed:false,independent_platform_verification:false},status);
const HOSTS={
  facebook:['facebook.com','www.facebook.com','m.facebook.com'],
  instagram:['instagram.com','www.instagram.com'],
  x:['x.com','www.x.com','twitter.com','www.twitter.com'],
  tiktok:['tiktok.com','www.tiktok.com'],
  google_business_profile:['google.com','www.google.com','maps.google.com','business.google.com'],
  linkedin:['linkedin.com','www.linkedin.com'],
  youtube_shorts:['youtube.com','www.youtube.com','youtu.be']
};
export function validPlatformPostUrl843(platform,value){
  try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&!u.hash&&!u.searchParams.has('access_token')&&(HOSTS[platform]||[]).includes(u.hostname.toLowerCase())&&u.pathname.length>2&&value.length<=900;}
  catch{return false;}
}
const summary=p=>({id:p.id,platform:p.platform,status:p.status,external_post_id:p.external_post_id||null,external_post_url:p.external_post_url||null,source_id:p.source_id,posted_at:p.posted_at||null});
const recallNote='Build 843 consent withdrawn. External published-post recall required; removal unverified.';
async function projectFor(env,bookingId){
  const rows=await rest(env,`creative_projects?select=id,source_booking_id,consent_status,public_publish_allowed&source_booking_id=eq.${encodeURIComponent(bookingId)}&limit=2`);
  if(rows?.length!==1)throw Error('Exactly one linked DAIP Creative Project is required.');
  return rows[0];
}
async function postedRecords(env,bookingId){
  return rest(env,`social_post_queue?select=id,booking_id,source_type,source_id,platform,status,media_urls,posted_at,external_post_url,external_post_id,last_error&booking_id=eq.${encodeURIComponent(bookingId)}&source_type=eq.${SOURCE_TYPE_842}&order=created_at.desc&limit=500`);
}
export async function onRequestOptions(){return new Response('',{status:204});}
export async function onRequest({request,env}){
  if(!['GET','POST'].includes(request.method))return safeFail('Method not allowed.',405);
  const body=request.method==='POST'?await request.json().catch(()=>({})):{};
  const bookingId=clean(body.booking_id||new URL(request.url).searchParams.get('booking_id'),80);
  if(!isUuid(bookingId))return safeFail('A valid booking ID is required.');
  const auth=await requireStaffAccess({request,env,body,capability:'manage_staff',allowLegacyAdminFallback:true});
  if(!auth.ok)return auth.response;
  if(!ownerActor842(auth.actor))return safeFail('Owner/supervisor dual authority is required.',403);
  if(!serviceReady(env))return safeFail('Private database service is unavailable.',503);
  try{
    const [booking,project,posts]=await Promise.all([
      rest(env,`bookings?select=id&id=eq.${encodeURIComponent(bookingId)}&limit=1`),
      projectFor(env,bookingId),
      postedRecords(env,bookingId)
    ]);
    if(booking?.length!==1)return safeFail('Booking not found.',404);
    // Never refuse to register a customer's withdrawal just because the
    // read-only worklist reached its display bound. The bulk queue denial
    // below still applies to every matching record, not only these 500.
    if(posts.length===500&&body.action!=='revoke_public_consent')return safeFail('Post history reached the 500-item audit bound. Owner review is required before any other state change.',409);
    if(request.method==='GET'){
      const audits=await rest(env,`creative_project_audit?select=id,safe_note,created_at&project_id=eq.${encodeURIComponent(project.id)}&event_type=eq.updated&order=created_at.desc&limit=200`);
      const ids=posts.map(p=>p.id);
      const attempts=ids.length?await rest(env,`social_dispatch_attempts?select=id,social_post_id,status,request_summary,response_summary,created_at&social_post_id=in.(${ids.join(',')})&order=created_at.desc&limit=500`):[];
      const revoked=project.consent_status!=='approved_public'||project.public_publish_allowed!==true||(audits||[]).some(a=>a.safe_note?.startsWith('Build 843 consent revoked:'));
      return json({ok:true,build:843,booking_id:bookingId,consent:{revoked,public_publish_allowed:project.public_publish_allowed===true&&!revoked,status:project.consent_status,recall_required:revoked&&posts.some(p=>p.posted_at||p.external_post_id||p.external_post_url)},mobile_owner_closures:(audits||[]).filter(a=>a.safe_note?.startsWith('Build 843 mobile owner closure:')).map(a=>({at:a.created_at,summary:a.safe_note.slice(0,220),owner_attested:true,independent_device_verified:false})),posts:posts.map(p=>{
        const rows=attempts.filter(a=>a.social_post_id===p.id);
        const recall=rows.find(a=>a.status==='recall_required');
        const owner=rows.find(a=>a.status==='owner_observed_live_post');
        return {...summary(p),external_recall_required:!!recall||revoked&&Boolean(p.posted_at||p.external_post_id||p.external_post_url),platform_confirmation:recall?'RECALL_REQUIRED_PLATFORM_TAKEDOWN_UNVERIFIED':owner?'OWNER_OBSERVED_PROVIDER_UNVERIFIED':p.status==='posted'?'POSTED_STATUS_PROVIDER_UNVERIFIED':'NOT_CONFIRMED',owner_observed_at:owner?.created_at||null};
      }),original_device_independently_verified:false,provider_lookup_performed:false,private_media_shared:false});
    }
    const action=clean(body.action,50),actor=clean(auth.actor?.email,160)||'Owner';
    if(action==='confirm_platform_post'){
      const id=clean(body.post_id,80),url=clean(body.post_url,900),platformId=clean(body.platform_post_id,150),reference=clean(body.evidence_reference,120);
      const post=posts.find(p=>p.id===id);
      if(!post||post.status!=='posted'||!post.posted_at)return safeFail('Only an actually dispatched posted record can receive an owner-observed confirmation.',409);
      if(project.consent_status!=='approved_public'||project.public_publish_allowed!==true)return safeFail('Public-use consent is withdrawn; confirmation is blocked and recall is required.',409);
      const audits=await rest(env,`creative_project_audit?select=id,safe_note&project_id=eq.${encodeURIComponent(project.id)}&event_type=eq.updated&safe_note=like.${encodeURIComponent('Build 843 consent revoked:*')}&limit=1`);
      if(audits?.length)return safeFail('This source was previously revoked. Restore through a separately approved new consent episode.',409);
      if(!validPlatformPostUrl843(post.platform,url)||!platformId||!reference||body.owner_opened_public_post!==true)return safeFail('Confirm a platform-matched HTTPS public post URL, external post ID, owner observation and non-sensitive evidence reference.');
      if(post.external_post_id&&post.external_post_id!==platformId)return safeFail('The supplied platform post ID conflicts with the recorded provider post ID.',409);
      if(post.external_post_url&&post.external_post_url!==url)return safeFail('The supplied public URL conflicts with the recorded dispatch URL.',409);
      const saved=await rest(env,'social_dispatch_attempts',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({social_post_id:post.id,platform:post.platform,status:'owner_observed_live_post',request_summary:{action,actor,evidence_reference:reference},response_summary:{owner_checked_url:url,provider_post_id:platformId,owner_observed:true,provider_lookup_performed:false,independent_platform_verification:false,auto_publish:false}})});
      if(!saved?.[0]?.id)return safeFail('Owner observation could not be durably recorded.',503);
      return json({ok:true,receipt_id:saved[0].id,platform:post.platform,owner_observed:true,independently_verified:false,provider_lookup_performed:false,publication_happened:false});
    }
    if(action==='revoke_public_consent'){
      const reference=clean(body.evidence_reference,120),reason=clean(body.reason_code,40);
      if(!reference||!['customer_withdrawal','owner_privacy_hold','expired_rights','incorrect_consent'].includes(reason)||body.confirm_recall_required!==true)return safeFail('Choose an explicit withdrawal reason, a private evidence reference and acknowledge that external takedown remains manual.');
      // An audit first creates a durable denial even if the subsequent project
      // or queue patch fails; sourceGate842 checks this immutable prefix.
      const note=`Build 843 consent revoked: ${reason}; reference ${reference}; external platform takedown must be verified separately.`;
      const audit=await rest(env,'creative_project_audit',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({project_id:project.id,event_type:'updated',actor_staff_email:actor,safe_note:note})});
      if(!audit?.[0]?.id)return safeFail('Revocation audit was not recorded.',503);
      await rest(env,`creative_projects?id=eq.${encodeURIComponent(project.id)}`,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({consent_status:'declined',public_publish_allowed:false,consent_reviewed:true,updated_at:new Date().toISOString()})});
      // Block all tagged drafts/ready/posted rows. Preserve posted_at, external
      // ID/URL and attempt history for the true external recall worklist.
      const patched=await rest(env,`social_post_queue?booking_id=eq.${encodeURIComponent(bookingId)}&source_type=eq.${SOURCE_TYPE_842}&status=in.(draft,ready,posted,failed)`,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({status:'failed',last_error:recallNote,updated_at:new Date().toISOString()})});
      let recorded=0;
      for(const p of posts){
        const found=await rest(env,`social_dispatch_attempts?select=id&social_post_id=eq.${encodeURIComponent(p.id)}&status=eq.recall_required&limit=1`);
        if(found?.length){recorded++;continue;}
        const out=await rest(env,'social_dispatch_attempts',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({social_post_id:p.id,platform:p.platform,status:'recall_required',request_summary:{action,actor,reason_code:reason,evidence_reference:reference},response_summary:{original_posted_at:p.posted_at||null,external_post_id:p.external_post_id||null,external_post_url:p.external_post_url||null,external_takedown_verified:false,public_photo_recall_pending:true,independent_provider_confirmation:false}})});
        if(out?.[0]?.id)recorded++;
      }
      return json({ok:true,consent_revoked:true,publication_blocked:true,source_posts_in_bounded_review:posts.length,worklist_may_be_incomplete:posts.length===500,queue_rows_failed:patched?.length||0,recall_audits_recorded:recorded,needs_external_recall:posts.filter(p=>p.posted_at||p.external_post_id||p.external_post_url).map(p=>({id:p.id,platform:p.platform,post_url:p.external_post_url||null})),photo_studio_recall_pending:true,provider_takedown_performed:false,independent_platform_verification:false});
    }
    if(action==='close_mobile_accessibility'){
      const device=clean(body.device_type,30),reference=clean(body.evidence_reference,120),review=clean(body.owner_review_reference,120);
      if(!['android_phone','iphone','ipad','android_tablet','desktop','other'].includes(device)||!reference||!review||body.accessible_journey_confirmed!==true||body.manual_recovery_confirmed!==true)return safeFail('Provide original-device type, non-sensitive observation and owner review references, and confirm accessible journey and recovery.');
      const audits=await rest(env,`creative_project_audit?select=id,safe_note,created_at&project_id=eq.${encodeURIComponent(project.id)}&event_type=eq.updated&order=created_at.desc&limit=200`);
      const observed=(audits||[]).find(a=>a.safe_note?.startsWith(`Build 842 device observation: ${device} | pass | accessibility checked | recovery checked`));
      if(!observed)return safeFail('A prior owner-observed PASS on this original device is required. Open Build 842 device acceptance first.',409);
      if(!Number.isFinite(Date.parse(observed.created_at))||Date.now()-Date.parse(observed.created_at)>30*864e5)return safeFail('Original-device observation is older than 30 days. Repeat on the actual device.',409);
      const note=`Build 843 mobile owner closure: ${device}; observation ${observed.id}; evidence ${reference}; owner review ${review}; OWNER_OBSERVED_PASS; independent device verification HOLD.`;
      const saved=await rest(env,'creative_project_audit',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({project_id:project.id,event_type:'updated',actor_staff_email:actor,safe_note:note})});
      if(!saved?.[0]?.id)return safeFail('Mobile owner closure audit could not be saved.',503);
      return json({ok:true,owner_review_recorded:true,closure_audit_id:saved[0].id,original_observation_id:observed.id,independently_device_verified:false,global_acceptance_unchanged:true});
    }
    return safeFail('Unsupported action.',400);
  }catch(error){return safeFail(error?.message||'Build 843 owner evidence was unavailable.',503);}
}
