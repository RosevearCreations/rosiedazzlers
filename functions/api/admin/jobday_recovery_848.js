// Build 848 original owner-only recovery & independent Master freshness.
// Post/asset mutations, external provider writes and cross-app sends are forbidden.
import {requireStaffAccess,json,isUuid} from '../_lib/staff-auth.js';
import {serviceReady,rest,clean} from '../_lib/creative-projects.js';
import {ownerActor842,SOURCE_TYPE_842} from '../_lib/jobday-social-842.js';
import {getPublicAssetsBucket,publicUrlForKey,isApprovedImageKey} from '../_lib/photo-library.js';
import {RECLOSE_848,FRESHNESS_AUDIT_848,MASTER_CONTRACT_848,recallState848,recoveryEvidence848,validateFresh848} from '../_lib/jobday-recovery-848.js';
const fail=(error,status=409)=>json({ok:false,error,external_provider_mutation:false,master_events_emitted:0,master_connection:'HOLD'},status);
const safeCase=s=>typeof s==='string'&&/^[A-Za-z0-9][A-Za-z0-9_-]{2,79}$/.test(s);
const select='id,social_post_id,status,platform,created_at,request_summary,response_summary';
const attemptFor=(env,id)=>rest(env,`social_dispatch_attempts?select=${select}&social_post_id=eq.${encodeURIComponent(id)}&order=created_at.desc&limit=200`);
async function data(env,bookingId){
  const [booking,projects,posts]=await Promise.all([
    rest(env,`bookings?select=id&id=eq.${encodeURIComponent(bookingId)}&limit=1`),
    rest(env,`creative_projects?select=id,source_booking_id,consent_status,public_publish_allowed&source_booking_id=eq.${encodeURIComponent(bookingId)}&limit=2`),
    rest(env,`social_post_queue?select=id,booking_id,platform,status,source_type,posted_at,external_post_id,external_post_url,media_urls&booking_id=eq.${encodeURIComponent(bookingId)}&source_type=eq.${SOURCE_TYPE_842}&order=created_at.desc&limit=500`)
  ]);
  if(booking?.length!==1||projects?.length!==1||!Array.isArray(posts)||posts.length===500)throw Error('Exact original booking/project and untruncated job post history required.');
  const project=projects[0];
  const [audits,revocations]=await Promise.all([
    rest(env,`creative_project_audit?select=id,safe_note,created_at&project_id=eq.${project.id}&event_type=eq.updated&order=created_at.desc&limit=250`),
    rest(env,`creative_project_audit?select=id&project_id=eq.${project.id}&event_type=eq.updated&safe_note=like.${encodeURIComponent('Build 843 consent revoked:*')}&limit=1`)
  ]);
  if(!Array.isArray(audits)||audits.length===250)throw Error('Owner audit history truncated; supervised reconciliation required.');
  return {project,posts,audits,revoked:Boolean(revocations?.length)||project.consent_status!=='approved_public'||project.public_publish_allowed!==true};
}
async function writeAttempt(env,p,request,response){return rest(env,'social_dispatch_attempts',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({social_post_id:p.id,platform:p.platform,status:RECLOSE_848,request_summary:request,response_summary:response})});}
async function writeAudit(env,p,actor,note){return rest(env,'creative_project_audit',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({project_id:p.id,event_type:'updated',actor_staff_email:actor,safe_note:note})});}
export const onRequestOptions=()=>new Response('',{status:204});
export async function onRequest({request,env}){
  if(!['GET','POST'].includes(request.method))return fail('Method not allowed.',405);
  const body=request.method==='POST'?await request.json().catch(()=>({})):{},bookingId=clean(body.booking_id||new URL(request.url).searchParams.get('booking_id'),80);
  if(!isUuid(bookingId))return fail('Original booking UUID required.',400);
  const auth=await requireStaffAccess({request,env,body,capability:'manage_staff',allowLegacyAdminFallback:false});
  if(!auth.ok)return auth.response;
  if(auth.auth_mode!=='session'||!ownerActor842(auth.actor))return fail('Original active signed-in Rosie owner session required.',403);
  if(!serviceReady(env))return fail('Private service evidence unavailable.',503);
  try{
    const {project,posts,audits,revoked}=await data(env,bookingId),actor=clean(auth.actor?.email,140)||String(auth.actor?.id||'Owner');
    if(request.method==='GET'){
      const limited=posts.slice(0,20),ids=limited.map(p=>p.id),rows=ids.length?await rest(env,`social_dispatch_attempts?select=${select}&social_post_id=in.(${ids.join(',')})&order=created_at.desc&limit=500`):[];
      if(!Array.isArray(rows))throw Error('Private attempt evidence unavailable.');
      const cases=limited.map(p=>{const evidence=rows.filter(a=>a.social_post_id===p.id),r=recoveryEvidence848(evidence,p,revoked);return {post_id:p.id,platform:p.platform,recall_state:r.state.state,closed_at:r.state.closure?.created_at||null,reopened_at:r.reopen?.created_at||null,recovery_gaps:r.gaps,latest_provider_proof_at:r.provider?.created_at||null,latest_cdn_proof_at:r.cdn?.created_at||null,origin_live_recheck_required:true,external_mirrors_verified:false};});
      const summary={open:cases.filter(x=>['RECALL_OPEN_HOLD','REOPENED_VERIFIED_PROVIDER_CONFLICT_HOLD','CONFLICT_REOPEN_REQUIRED'].includes(x.recall_state)).length,conflicts:cases.filter(x=>x.recall_state==='CONFLICT_REOPEN_REQUIRED').length,reopened:cases.filter(x=>x.recall_state==='REOPENED_VERIFIED_PROVIDER_CONFLICT_HOLD').length,reclosed:cases.filter(x=>x.recall_state==='RECLOSED_VERIFIED_RECOVERY_EXTERNAL_MIRRORS_HOLD').length,missing_provider:cases.filter(x=>x.recovery_gaps.includes('FRESH_SIGNED_PROVIDER_REMOVAL_HOLD')).length,missing_cdn:cases.filter(x=>x.recovery_gaps.includes('FRESH_SIGNED_CDN_ACK_HOLD')).length};
      return json({ok:true,build:848,booking_id:bookingId,revoked,summary,cases,view_truncated:posts.length>20||rows.length===500,master_contract:MASTER_CONTRACT_848,master_signer_pin_enrolled:Boolean(env?.ROSIE_AIDATA_SOCIAL_CONTRACT_ED25519_PUBLIC_KEY),master_freshness_reviews:audits.filter(a=>a.safe_note?.startsWith(FRESHNESS_AUDIT_848)).length,master_runtime_accepted:false,master_connection:'HOLD',external_provider_mutation:false,master_events_emitted:0});
    }
    const action=clean(body.action,45),ownerCase=clean(body.owner_case_reference,80);
    if(!safeCase(ownerCase))return fail('Safe owner case ID required.');
    const post=posts.find(p=>p.id===clean(body.post_id,80));
    if(!post)return fail('Choose exact job-originated social post.');
    const rows=await attemptFor(env,post.id);
    if(!Array.isArray(rows)||rows.length===200)return fail('Source evidence truncated; owner reconciliation HOLD.');
    if(action==='reclose_verified_recovery'){
      if(body.confirm_fresh_independent_recovery!==true||body.acknowledge_external_mirrors_unknown!==true)return fail('Independent recovery and external-mirror HOLD acknowledgements required.');
      if(!post.posted_at||!post.external_post_id||!Array.isArray(post.media_urls)||post.media_urls.length!==1)return fail('A previously published, exactly bound original public derivative is required.');
      const e=recoveryEvidence848(rows,post,revoked);
      if(!e.ready)return fail('Recovery evidence incomplete: '+e.gaps.join(', '));
      if(rows.some(r=>r.status===RECLOSE_848&&r.request_summary?.reopen_id===e.reopen.id))return fail('Recovery episode already reclosed. Duplicate prohibited.');
      const key=e.priorOrigin.response_summary.r2_key;
      if(!isApprovedImageKey(key)||publicUrlForKey(env,key)!==post.media_urls[0])return fail('Original approved-public R2 key and post derivative do not match.');
      const bucket=getPublicAssetsBucket(env);
      if(!bucket||typeof bucket.head!=='function')return fail('Authenticated original public R2 origin HEAD unavailable.',503);
      if(await bucket.head(key))return fail('Public derivative is present again; recovery closure blocked.');
      // Fresh scoped absence is observed by this server now. Historical
      // deletion alone never acts as a post-reopen HEAD observation.
      const checkedAt=new Date().toISOString();
      const saved=await writeAttempt(env,post,{action,actor,owner_case_reference:ownerCase,reopen_id:e.reopen.id,provider_removal_receipt_id:e.provider.id,cdn_witness_receipt_id:e.cdn.id,original_r2_deletion_id:e.priorOrigin.id},{scope:'fresh_provider_signed_removal_new_cdn_ack_original_r2_absent_now',r2_key:key,r2_head_after_reopen:'absent',r2_checked_at:checkedAt,independent_provider_signature_valid:true,independent_cdn_signature_valid:true,external_mirrors_verified:false,customer_consent_still_revoked:true,provider_mutation_performed:false,master_connection:'HOLD'});
      if(!saved?.[0]?.id)return fail('Recovered scoped recall closure not durably saved.',503);
      return json({ok:true,closure_id:saved[0].id,recall_state:'RECLOSED_VERIFIED_RECOVERY_EXTERNAL_MIRRORS_HOLD',public_r2_origin_rechecked_absent:true,provider_mutation_performed:false,external_mirrors_verified:false,master_connection:'HOLD'});
    }
    if(action==='admit_independent_master_freshness'){
      if(body.confirm_fresh_master_signature_review!==true||body.acknowledge_master_runtime_hold!==true)return fail('Independent signer and no-runtime-acceptance acknowledgments required.');
      const receipt=body.receipt||{};
      if(receipt.master_case_reference!==ownerCase)return fail('Signed Master and original owner case IDs differ.');
      const verdict=await validateFresh848(env,receipt,body.signature,{bookingId,projectId:project.id,actor});
      if(!verdict.ok)return fail(verdict.reason);
      if(audits.some(a=>a.safe_note?.startsWith(FRESHNESS_AUDIT_848)&&a.safe_note.includes(`nonce ${receipt.nonce};`)))return fail('Freshness nonce replay denied.');
      const note=`${FRESHNESS_AUDIT_848} contract ${MASTER_CONTRACT_848}; source revision ${receipt.source_revision}; case ${ownerCase}; nonce ${receipt.nonce}; verifier ${clean(receipt.signer_id,100)}; canonical sha256 ${verdict.sha256}; expires ${receipt.expires_at}; no runtime consumer ACK; owner acceptance HOLD.`;
      const saved=await writeAudit(env,project,actor,note);
      if(!saved?.[0]?.id)return fail('Independent freshness audit could not be durably saved.',503);
      return json({ok:true,review_id:saved[0].id,signature_verified:true,fresh_until:verdict.expires_at,source_revision:receipt.source_revision,master_runtime_consumer_ack:false,master_connection:'HOLD',master_events_emitted:0});
    }
    return fail('Unknown Build 848 action.');
  }catch(e){return fail(e?.message||'Original evidence unavailable.',503);}
}
