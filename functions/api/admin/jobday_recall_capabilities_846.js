// Build 846: provider read capability, separately signed CDN witness, and
// evidence-scoped recall SLA closure. Everything stays private and owner-gated.
import {requireStaffAccess,json,isUuid} from '../_lib/staff-auth.js';
import {serviceReady,rest,clean} from '../_lib/creative-projects.js';
import {ownerActor842,SOURCE_TYPE_842} from '../_lib/jobday-social-842.js';
import {PROVIDER_STATUS_844} from '../_lib/jobday-acceptance-844.js';
import {PROVIDERS_845,PROVIDER_AUDIT_845,ageLevel845,providerSetup845} from '../_lib/jobday-provider-845.js';
import {CAPABILITY_AUDIT_846,CDN_STATUS_846,SLA_STATUS_846,verifyReadCapability846,verifyCdnWitness846,validCdnReceipt846,recallPolicy846} from '../_lib/jobday-capabilities-846.js';
import {recallState848} from '../_lib/jobday-recovery-848.js';

const fail=(error,status=400)=>json({ok:false,error,platform_mutation_performed:false,external_mirrors_verified:false,master_connection:'HOLD'},status);
const ref=value=>typeof value==='string'&&/^[A-Za-z0-9][A-Za-z0-9_-]{2,79}$/.test(value);
const removed=a=>a.status===PROVIDER_STATUS_844.post_removed&&a.response_summary?.independent_witness_signature_valid===true&&a.response_summary?.provider_result==='provider_delete_acknowledged'&&[200,204].includes(a.response_summary?.provider_http_status);
const originGone=a=>a.status==='public_derivative_r2_deleted'&&a.response_summary?.r2_head_after_delete==='absent'&&a.response_summary?.photo_studio_status==='archived';
const cdnWitness=a=>a.status===CDN_STATUS_846&&a.response_summary?.independent_witness_signature_valid===true&&a.response_summary?.cache_purge_result==='cdn_purge_acknowledged';

async function data846(env,bookingId){
  const [bookings,projects,posts]=await Promise.all([
    rest(env,`bookings?select=id&id=eq.${encodeURIComponent(bookingId)}&limit=1`),
    rest(env,`creative_projects?select=id,source_booking_id,consent_status,public_publish_allowed&source_booking_id=eq.${encodeURIComponent(bookingId)}&limit=2`),
    rest(env,`social_post_queue?select=id,booking_id,platform,status,source_type,source_id,posted_at,external_post_id,external_post_url,media_urls&booking_id=eq.${encodeURIComponent(bookingId)}&source_type=eq.${SOURCE_TYPE_842}&order=created_at.desc&limit=500`)
  ]);
  if(bookings?.length!==1||projects?.length!==1)throw Error('One original booking and unique private DAIP Creative Project are required.');
  const project=projects[0],audits=await rest(env,`creative_project_audit?select=id,safe_note,created_at&project_id=eq.${encodeURIComponent(project.id)}&event_type=eq.updated&order=created_at.desc&limit=250`);
  const revocation=await rest(env,`creative_project_audit?select=id&project_id=eq.${encodeURIComponent(project.id)}&event_type=eq.updated&safe_note=like.${encodeURIComponent('Build 843 consent revoked:*')}&limit=1`);
  return {project,posts:posts||[],audits:audits||[],revoked:Boolean(revocation?.length)||project.consent_status!=='approved_public'||project.public_publish_allowed!==true};
}
const attemptsFor=(env,id)=>rest(env,`social_dispatch_attempts?select=id,platform,status,request_summary,response_summary,created_at&social_post_id=eq.${encodeURIComponent(id)}&order=created_at.desc&limit=200`);
const addAttempt=(env,post,status,request,response)=>rest(env,'social_dispatch_attempts',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({social_post_id:post.id,platform:post.platform,status,request_summary:request,response_summary:response})});

export async function onRequestOptions(){return new Response('',{status:204});}
export async function onRequest({request,env}){
  if(!['GET','POST'].includes(request.method))return fail('Method not allowed.',405);
  const body=request.method==='POST'?await request.json().catch(()=>({})):{},bookingId=clean(body.booking_id||new URL(request.url).searchParams.get('booking_id'),80);
  if(!isUuid(bookingId))return fail('Existing booking UUID required.');
  const auth=await requireStaffAccess({request,env,body,capability:'manage_staff',allowLegacyAdminFallback:true});
  if(!auth.ok)return auth.response;
  if(!ownerActor842(auth.actor))return fail('Owner authority required.',403);
  if(!serviceReady(env))return fail('Private database service unavailable.',503);
  try{
    const {project,posts,audits,revoked}=await data846(env,bookingId),actor=clean(auth.actor?.email,140)||'Owner',policy=recallPolicy846(env);
    if(request.method==='GET'){
      const limited=posts.slice(0,20),ids=limited.map(p=>p.id),attempts=ids.length?await rest(env,`social_dispatch_attempts?select=id,social_post_id,status,request_summary,response_summary,created_at&social_post_id=in.(${ids.join(',')})&order=created_at.desc&limit=500`):[];
      return json({ok:true,build:846,revoked,booking_id:bookingId,recall_policy:policy,provider_capability_audits:audits.filter(a=>a.safe_note?.startsWith(CAPABILITY_AUDIT_846)).map(a=>({created_at:a.created_at,summary:a.safe_note.slice(0,170)})),cdn_witness_pin_enrolled:Boolean(env?.ROSIE_SOCIAL_CDN_WITNESS_ED25519_PUBLIC_KEY),posts:limited.map(p=>{
        const rows=(attempts||[]).filter(a=>a.social_post_id===p.id),recall=rows.find(a=>a.status==='recall_required'),provider=rows.find(removed),origin=rows.find(originGone),cdn=rows.find(cdnWitness),closure=recallState848(rows),liveLater=provider&&rows.some(a=>a.status==='provider_api_authenticated_post_visible'&&Date.parse(a.created_at)>Date.parse(provider.created_at));
        return {id:p.id,platform:p.platform,external_post_id:p.external_post_id||null,recall_aging:recall?ageLevel845(recall.created_at):null,provider_removal_witnessed:Boolean(provider),r2_origin_verified_gone:Boolean(origin),cdn_invalidation_witnessed:Boolean(cdn),conflicting_later_live_post:Boolean(liveLater),closure_state:closure.state==='CLOSED_SCOPED_EXTERNAL_MIRRORS_HOLD'?'SCOPED_EVIDENCE_CLOSED_EXTERNAL_MIRRORS_UNKNOWN':closure.state,closure_at:closure.closure?.created_at||null};
      }),view_truncated:posts.length>20||attempts.length===500,platform_mutation_performed:false,external_mirrors_verified:false,master_connection:'HOLD'});
    }
    const action=clean(body.action,45),caseRef=clean(body.owner_case_reference,80);
    if(!ref(caseRef))return fail('A safe owner case reference (3–80 allowed characters) is required.');
    if(action==='verify_read_capability'){
      const platform=clean(body.platform,30),setup=providerSetup845(env,platform);
      if(!PROVIDERS_845.includes(platform)||body.confirm_read_only_provider_check!==true||!setup.configured)return fail('Configured Facebook/Instagram read-only provider and explicit owner authorization required.',409);
      const enrolled=audits.find(a=>a.safe_note?.startsWith(`${PROVIDER_AUDIT_845} ${platform}; account ${setup.account};`)&&Number.isFinite(Date.parse(a.created_at))&&Date.now()-Date.parse(a.created_at)<=864e5);
      if(!enrolled)return fail('Recent authenticated Build 845 account enrollment for this exact account and job is required.',409);
      const result=await verifyReadCapability846(env,platform);
      if(!result.ok)return fail(`${result.reason}. Provider read capability remains HOLD.`,409);
      const note=`${CAPABILITY_AUDIT_846} ${platform}; account ${result.account_id}; ${result.verified_capability}; authenticated HTTP 200; response sha256 ${result.response_sha256}; prior enrollment ${enrolled.id}; case ${caseRef}; publish/delete permissions UNKNOWN.`;
      const saved=await rest(env,'creative_project_audit',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({project_id:project.id,event_type:'updated',actor_staff_email:actor,safe_note:note})});
      if(!saved?.[0]?.id)return fail('Authenticated provider capability evidence could not be durably saved.',503);
      return json({ok:true,receipt_id:saved[0].id,platform,capability:result.verified_capability,authenticated_content_list_read:true,publish_permission_verified:false,takedown_permission_verified:false,platform_mutation_performed:false});
    }
    const post=posts.find(p=>p.id===clean(body.post_id,80));
    if(!post)return fail('Choose the exact source-bound job post.',409);
    const rows=await attemptsFor(env,post.id);
    if(rows.length===200||posts.length===500)return fail('Source or receipt history reached its bound. Manual owner reconciliation required.',409);
    const recall=rows.find(a=>a.status==='recall_required');
    if(!revoked||!recall||!post.posted_at||!post.external_post_id)return fail('Only a published post with immutable withdrawal and recall evidence can proceed.',409);
    const deleted=rows.find(originGone);
    if(action==='admit_cdn_invalidation_witness'){
      const receipt=body.receipt||{};
      if(!deleted||!validCdnReceipt846(receipt,post,bookingId,actor)||body.confirm_independent_edge_evidence!==true)return fail('One exact public origin-deleted derivative, independent authenticated CDN 200/204 purge acknowledgment, and owner confirmation required.',409);
      if(rows.some(a=>a.status===CDN_STATUS_846&&a.request_summary?.nonce===receipt.nonce))return fail('CDN witness replay nonce already recorded.',409);
      const verified=await verifyCdnWitness846(env,receipt,body.signature);
      if(!verified.ok)return fail(verified.reason,409);
      const saved=await addAttempt(env,post,CDN_STATUS_846,{action,actor,owner_case_reference:caseRef,witness_id:receipt.witness_id,nonce:receipt.nonce,cache_purge_operation_id:receipt.cache_purge_operation_id},{public_asset_url:receipt.public_asset_url,cache_purge_result:receipt.cache_purge_result,cache_purge_http_status:receipt.cache_purge_http_status,cache_response_sha256:receipt.cache_response_sha256,observed_at:receipt.observed_at,independent_witness_signature_valid:true,authenticated_edge_request_attested:true,pin_id:verified.pin_id,all_global_edge_locations_verified:false,external_mirrors_verified:false});
      if(!saved?.[0]?.id)return fail('Signed CDN witness evidence could not be saved.',503);
      return json({ok:true,receipt_id:saved[0].id,independent_witness_signature_valid:true,cdn_api_purge_acknowledged:true,all_global_edges_verified:false,external_mirrors_verified:false});
    }
    if(action==='close_recall_sla'){
      if(!policy.configured||body.confirm_scoped_closure_only!==true||body.acknowledge_external_mirrors_unknown!==true)return fail('Configured owner recall SLA target and both scoped-closure acknowledgements required.',409);
      if(rows.some(a=>a.status===SLA_STATUS_846))return fail('This recall already has a source-bound scoped SLA closure.',409);
      const provider=rows.find(removed),cdn=rows.find(cdnWitness),latestLive=rows.filter(a=>a.status==='provider_api_authenticated_post_visible').map(a=>Date.parse(a.created_at)).filter(Number.isFinite).sort((a,b)=>b-a)[0];
      if(!provider||!deleted||!cdn||cdn.response_summary?.public_asset_url!==post.media_urls?.[0]||latestLive>Date.parse(provider.created_at))return fail('Independent provider removal, authenticated R2 origin absence, signed CDN invalidation, and no later provider visibility conflict are all required.',409);
      const since=Date.parse(recall.created_at);
      if(!Number.isFinite(since)||since>Date.now())return fail('Original recall timestamp is invalid; SLA cannot be measured.',409);
      const elapsed=Math.round((Date.now()-since)/36000)/100,disposition=elapsed<=policy.target_hours?'WITHIN_OWNER_TARGET':'BREACHED_OWNER_TARGET';
      const saved=await addAttempt(env,post,SLA_STATUS_846,{action,actor,owner_case_reference:caseRef,recall_id:recall.id,provider_receipt_id:provider.id,public_origin_receipt_id:deleted.id,cdn_receipt_id:cdn.id},{scope:'provider_post_r2_origin_cdn_api_ack_only',target_hours:policy.target_hours,elapsed_hours:elapsed,disposition,source_evidence_closed:true,provider_mutation_performed:false,external_mirrors_verified:false,owner_scoped_closure:true});
      if(!saved?.[0]?.id)return fail('Scoped recall SLA closure was not durably recorded.',503);
      return json({ok:true,closure_id:saved[0].id,disposition,elapsed_hours:elapsed,target_hours:policy.target_hours,source_evidence_closed:true,external_mirrors_verified:false,platform_mutation_performed:false,master_connection:'HOLD'});
    }
    return fail('Unsupported Build 846 action.');
  }catch(e){return fail(e?.message||'Private Build 846 source evidence unavailable.',503);}
}
