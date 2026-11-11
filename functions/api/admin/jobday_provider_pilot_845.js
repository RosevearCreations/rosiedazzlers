// Build 845 — owner-gated authenticated provider reads, durable recall
// escalation, original-device pilot. No posting, platform DELETE or data export.
import {requireStaffAccess,json,isUuid} from '../_lib/staff-auth.js';
import {serviceReady,rest,clean} from '../_lib/creative-projects.js';
import {ownerActor842,SOURCE_TYPE_842} from '../_lib/jobday-social-842.js';
import {validPlatformPostUrl843} from './jobday_platform_recall_843.js';
import {PROVIDER_STATUS_844,DEVICE_AUDIT_844} from '../_lib/jobday-acceptance-844.js';
import {PROVIDERS_845,PROVIDER_AUDIT_845,DEVICE_PILOT_845,RECALL_ESCALATION_845,providerSetup845,verifyAccount845,verifyLivePost845,ageLevel845} from '../_lib/jobday-provider-845.js';

const fail=(error,status=400)=>json({ok:false,error,platform_mutation_performed:false,global_device_acceptance:false,platform_takedown_verified:false},status);
const ref=v=>typeof v==='string'&&/^[A-Za-z0-9][A-Za-z0-9_-]{2,79}$/.test(v);
const hasRevoked=audits=>audits.some(a=>a.safe_note?.startsWith('Build 843 consent revoked:'));
const sanitize=p=>({id:p.id,platform:p.platform,status:p.status,posted_at:p.posted_at||null,external_post_id:p.external_post_id||null,external_post_url:p.external_post_url||null});
async function context845(env,bookingId){
  const [bookings,projects,posts]=await Promise.all([
    rest(env,`bookings?select=id&id=eq.${encodeURIComponent(bookingId)}&limit=1`),
    rest(env,`creative_projects?select=id,source_booking_id,consent_status,public_publish_allowed&source_booking_id=eq.${encodeURIComponent(bookingId)}&limit=2`),
    rest(env,`social_post_queue?select=id,booking_id,source_type,source_id,platform,status,posted_at,external_post_url,external_post_id&booking_id=eq.${encodeURIComponent(bookingId)}&source_type=eq.${SOURCE_TYPE_842}&order=created_at.desc&limit=500`)
  ]);
  if(bookings?.length!==1||projects?.length!==1)throw Error('An existing booking and unique private DAIP project are required.');
  const project=projects[0];
  const audits=await rest(env,`creative_project_audit?select=id,safe_note,created_at,actor_staff_email&project_id=eq.${encodeURIComponent(project.id)}&event_type=eq.updated&order=created_at.desc&limit=250`);
  const revokedRows=await rest(env,`creative_project_audit?select=id&project_id=eq.${encodeURIComponent(project.id)}&event_type=eq.updated&safe_note=like.${encodeURIComponent('Build 843 consent revoked:*')}&limit=1`);
  return {project,posts:posts||[],audits:audits||[],revoked:!!revokedRows?.length||hasRevoked(audits||[])||project.consent_status!=='approved_public'||project.public_publish_allowed!==true};
}
async function attemptsFor845(env,postId){return rest(env,`social_dispatch_attempts?select=id,platform,status,request_summary,response_summary,created_at&social_post_id=eq.${encodeURIComponent(postId)}&order=created_at.desc&limit=200`);}
const recordAttempt=(env,post,status,requestSummary,responseSummary)=>rest(env,'social_dispatch_attempts',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({social_post_id:post.id,platform:post.platform,status,request_summary:requestSummary,response_summary:responseSummary})});
const recordAudit=(env,project,actor,note)=>rest(env,'creative_project_audit',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({project_id:project.id,event_type:'updated',actor_staff_email:actor,safe_note:note})});

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
    const {project,posts,audits,revoked}=await context845(env,bookingId),actor=clean(auth.actor?.email,140)||'Owner';
    if(request.method==='GET'){
      const limited=posts.slice(0,20),ids=limited.map(p=>p.id);
      const attempts=ids.length?await rest(env,`social_dispatch_attempts?select=id,social_post_id,status,request_summary,response_summary,created_at&social_post_id=in.(${ids.join(',')})&order=created_at.desc&limit=500`):[];
      return json({ok:true,build:845,booking_id:bookingId,revoked,posts:limited.map(post=>{
        const rows=(attempts||[]).filter(a=>a.social_post_id===post.id),recall=rows.find(a=>a.status==='recall_required'),removal=rows.find(a=>a.status===PROVIDER_STATUS_844.post_removed),escalation=rows.find(a=>a.status===RECALL_ESCALATION_845),live=rows.find(a=>a.status==='provider_api_authenticated_post_visible'),r2=rows.find(a=>a.status==='public_derivative_r2_deleted');
        return {...sanitize(post),recall_state:!recall?'NOT_REQUESTED':removal?'INDEPENDENT_WITNESS_REMOVAL_RECEIPT_RECORDED':escalation?'OWNER_ESCALATION_OPEN': 'RECALL_REQUIRED_PROVIDER_HOLD',recall_aging:recall?ageLevel845(recall.created_at):null,provider_live_read:live?'AUTHENTICATED_API_200_READ_ONLY':'NOT_VERIFIED',public_r2_origin:r2?'R2_ORIGIN_ABSENT_CDN_UNVERIFIED':'R2_ORIGIN_RECALL_HOLD',last_escalation_at:escalation?.created_at||null,post_takedown_verified_by_rosie:false};
      }),posts_truncated:posts.length>20,attempts_truncated:(attempts||[]).length===500,adapters:PROVIDERS_845.map(platform=>{const s=providerSetup845(env,platform);return {platform,configured:s.configured,account_present:s.has_account,token_present:s.has_token,version_present:s.has_version,account_verified_for_job:audits.some(a=>a.safe_note?.startsWith(`${PROVIDER_AUDIT_845} ${platform};`))};}),device_pilots:audits.filter(a=>a.safe_note?.startsWith(DEVICE_PILOT_845)).map(a=>({id:a.id,created_at:a.created_at,summary:a.safe_note.slice(0,240),hardware_attestation:false})),independent_device_witnesses:audits.filter(a=>a.safe_note?.startsWith(DEVICE_AUDIT_844)).map(a=>({id:a.id,created_at:a.created_at,summary:a.safe_note.slice(0,210)})),platform_mutation_performed:false,global_device_acceptance:false});
    }
    const action=clean(body.action,50),caseRef=clean(body.owner_case_reference,80);
    if(!ref(caseRef))return fail('A non-sensitive owner case reference (3–80 letters, digits, hyphen or underscore) is required.');
    if(action==='enroll_adapter'){
      const platform=clean(body.platform,35);
      if(!PROVIDERS_845.includes(platform)||body.confirm_read_only_provider_auth!==true)return fail('Choose a supported provider and explicitly authorize its read-only account check.',409);
      const result=await verifyAccount845(env,platform);
      if(!result.ok)return fail(`${result.reason}: no provider enrollment has been accepted.`,409);
      const note=`${PROVIDER_AUDIT_845} ${platform}; account ${result.account_id}; authenticated HTTP 200; response sha256 ${result.response_sha256}; owner case ${caseRef}; no posting or takedown.`;
      const saved=await recordAudit(env,project,actor,note);
      if(!saved?.[0]?.id)return fail('Authenticated account result could not be durably recorded.',503);
      return json({ok:true,receipt_id:saved[0].id,account_authenticated_read_only:true,platform,provider_http_status:200,provider_response_sha256:result.response_sha256,live_post_confirmed:false,platform_mutation_performed:false});
    }
    const post=posts.find(p=>p.id===clean(body.post_id,80));
    if(action!=='owner_device_pilot'&&!post)return fail('Select a source-bound job post.',409);
    if(action==='probe_live_post'){
      if(body.confirm_read_only_provider_auth!==true||!post.external_post_id||!validPlatformPostUrl843(post.platform,post.external_post_url))return fail('Only a recorded provider post with a platform URL and explicit read-only consent can be checked.',409);
      if(!audits.some(a=>a.safe_note?.startsWith(`${PROVIDER_AUDIT_845} ${post.platform};`)))return fail('Verify this job’s provider account enrollment first.',409);
      const result=await verifyLivePost845(env,post);
      if(!result.ok)return fail(`${result.reason}: a 404 or inaccessible post cannot be treated as deleted.`,409);
      // A fresh revocation cannot be ignored. Visibility is still a useful
      // read-only recall escalation signal; it never restores publish rights.
      const saved=await recordAttempt(env,post,'provider_api_authenticated_post_visible',{action,actor,owner_case_reference:caseRef,revoked_at_probe:revoked},{external_post_id:result.external_post_id,provider_permalink:result.provider_permalink,provider_response_sha256:result.response_sha256,provider_http_status:200,authenticated_provider_read:true,provider_native_signature:false,platform_mutation_performed:false,takedown_verified:false});
      if(!saved?.[0]?.id)return fail('Authenticated post observation could not be durably recorded.',503);
      return json({ok:true,receipt_id:saved[0].id,platform:post.platform,authenticated_provider_read:true,live_post_observed:true,revoked_consent_still_blocked:revoked,provider_native_signature:false,takedown_verified:false,platform_mutation_performed:false});
    }
    if(action==='escalate_recall'){
      if(!revoked||body.confirm_no_platform_takedown!==true||!['customer_followup','provider_support','privacy_supervisor','legal_review'].includes(body.escalation_route))return fail('Recall escalation needs revoked consent, route selection and acknowledgement that no provider takedown occurred.',409);
      const rows=await attemptsFor845(env,post.id);
      if(rows.length===200)return fail('Original recall history hit the audit bound; manual supervisor reconciliation is required.',409);
      const recall=rows.find(a=>a.status==='recall_required');
      if(!recall||!post.posted_at&&!post.external_post_id)return fail('Only a historically published source with an original recall request can be escalated.',409);
      if(rows.some(a=>a.status===PROVIDER_STATUS_844.post_removed))return fail('Independent removal witness is already recorded. Review any separate CDN/origin work.',409);
      if(rows.some(a=>a.status===RECALL_ESCALATION_845&&a.request_summary?.owner_case_reference===caseRef))return fail('This recall case was already escalated; repeat admission is blocked.',409);
      const route=body.escalation_route;
      const saved=await recordAttempt(env,post,RECALL_ESCALATION_845,{action,actor,owner_case_reference:caseRef,escalation_route:route,original_recall_id:recall.id},{age_band:ageLevel845(recall.created_at),provider_takedown_verified:false,external_platform_mutation:false,owner_follow_up_required:true});
      if(!saved?.[0]?.id)return fail('Escalation could not be recorded.',503);
      return json({ok:true,escalation_id:saved[0].id,escalation_route:route,recall_aging:ageLevel845(recall.created_at),owner_follow_up_required:true,takedown_verified:false,platform_mutation_performed:false});
    }
    if(action==='owner_device_pilot'){
      const type=clean(body.device_type,30),witnessId=clean(body.independent_witness_audit_id,80);
      if(!['iphone','android_phone','ipad','android_tablet','desktop','other'].includes(type)||!isUuid(witnessId)||body.confirm_original_device_review!==true||body.confirm_independent_evidence_scope!==true)return fail('Original device type, existing independent witness ID and both scoped owner confirmations are required.',409);
      const witness=audits.find(a=>a.id===witnessId&&a.safe_note?.startsWith(`${DEVICE_AUDIT_844} ${type};`));
      if(!witness||!Number.isFinite(Date.parse(witness.created_at))||Date.now()-Date.parse(witness.created_at)>30*864e5)return fail('No recent independently signed Build 844 original-device witness matches this job and device.',409);
      if(audits.some(a=>a.safe_note?.startsWith(`${DEVICE_PILOT_845} ${type}; independent witness ${witnessId}; owner case ${caseRef};`)))return fail('This owner pilot decision has already been recorded.',409);
      const note=`${DEVICE_PILOT_845} ${type}; independent witness ${witnessId}; owner case ${caseRef}; scoped reviewed PASS; independent signer verified in Build 844; physical hardware attestation HOLD; Suite-wide acceptance HOLD.`;
      const saved=await recordAudit(env,project,actor,note);
      if(!saved?.[0]?.id)return fail('Original-device pilot acceptance could not be durably saved.',503);
      return json({ok:true,pilot_id:saved[0].id,original_device_owner_pilot_reviewed:true,source_witness_audit_id:witnessId,independent_witness_previously_admitted:true,original_hardware_cryptographic_attestation:false,global_device_acceptance:false});
    }
    return fail('Unknown Build 845 owner action.');
  }catch(e){return fail(e?.message||'Private Build 845 owner review is unavailable.',503);}
}
