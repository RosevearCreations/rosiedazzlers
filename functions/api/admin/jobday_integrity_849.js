// Build 849 — source-bound repeat recall episode integrity and independent
// Master ACK schema preflight. No external transport or provider writes.
import {requireStaffAccess,json,isUuid} from '../_lib/staff-auth.js';
import {serviceReady,rest,clean} from '../_lib/creative-projects.js';
import {ownerActor842,SOURCE_TYPE_842} from '../_lib/jobday-social-842.js';
import {REOPEN_STATUS_847} from '../_lib/jobday-pilot-847.js';
import {ACK_PREFLIGHT_AUDIT_849,MASTER_CONTRACT_849,episodeIntegrity849,exceptionPriority849,validateAckPreflight849,schemaDigest849} from '../_lib/jobday-integrity-849.js';
const fail=(error,status=409)=>json({ok:false,error,provider_mutation_performed:false,master_events_emitted:0,master_runtime_ack:false,master_connection:'HOLD'},status);
const safeCase=v=>typeof v==='string'&&/^[A-Za-z0-9][A-Za-z0-9_-]{2,79}$/.test(v);
const selects='id,social_post_id,status,platform,created_at,request_summary,response_summary';
async function data(env,bookingId){
  const [bookings,projects,posts]=await Promise.all([
    rest(env,`bookings?select=id&id=eq.${encodeURIComponent(bookingId)}&limit=1`),
    rest(env,`creative_projects?select=id,source_booking_id,consent_status,public_publish_allowed&source_booking_id=eq.${encodeURIComponent(bookingId)}&limit=2`),
    rest(env,`social_post_queue?select=id,booking_id,platform,status,source_type,posted_at,external_post_id,external_post_url,media_urls&booking_id=eq.${encodeURIComponent(bookingId)}&source_type=eq.${SOURCE_TYPE_842}&order=created_at.desc&limit=500`)
  ]);
  if(bookings?.length!==1||projects?.length!==1||!Array.isArray(posts)||posts.length>=500)throw Error('Original job, unique linked DAIP project and full bounded posts required.');
  const project=projects[0];
  const [audits,revocations]=await Promise.all([
    rest(env,`creative_project_audit?select=id,created_at,safe_note&project_id=eq.${project.id}&event_type=eq.updated&order=created_at.desc&limit=250`),
    rest(env,`creative_project_audit?select=id&project_id=eq.${project.id}&event_type=eq.updated&safe_note=like.${encodeURIComponent('Build 843 consent revoked:*')}&limit=1`)
  ]);
  if(!Array.isArray(audits)||audits.length>=250)throw Error('Owner audit history incomplete; no independent preflight or reopening can be certified.');
  const revoked=Boolean(revocations?.length)||project.consent_status!=='approved_public'||project.public_publish_allowed!==true;
  return {project,posts,audits,revoked};
}
const forPost=(env,postId)=>rest(env,`social_dispatch_attempts?select=${selects}&social_post_id=eq.${encodeURIComponent(postId)}&order=created_at.desc&limit=200`);
export const onRequestOptions=()=>new Response('',{status:204});
export async function onRequest({request,env}){
  if(!['GET','POST'].includes(request.method))return fail('Method not allowed.',405);
  const body=request.method==='POST'?await request.json().catch(()=>({})):{},bookingId=clean(body.booking_id||new URL(request.url).searchParams.get('booking_id'),80);
  if(!isUuid(bookingId))return fail('Original booking UUID required.',400);
  const auth=await requireStaffAccess({request,env,body,capability:'manage_staff',allowLegacyAdminFallback:false});
  if(!auth.ok)return auth.response;
  if(auth.auth_mode!=='session'||!ownerActor842(auth.actor))return fail('Original signed-in Rosie owner session required; bridge and legacy admin-password denied.',403);
  if(!serviceReady(env))return fail('Private evidence store unavailable.',503);
  try{
    const {project,posts,audits,revoked}=await data(env,bookingId),actor=clean(auth.actor?.email,140)||String(auth.actor?.id||'Owner');
    if(request.method==='GET'){
      const selected=posts.slice(0,20),ids=selected.map(p=>p.id);
      const attempts=ids.length?await rest(env,`social_dispatch_attempts?select=${selects}&social_post_id=in.(${ids.join(',')})&order=created_at.desc&limit=500`):[];
      if(!Array.isArray(attempts))throw Error('Private source attempts unavailable.');
      const cases=selected.map(p=>{
        const rows=attempts.filter(a=>a.social_post_id===p.id),pri=exceptionPriority849(rows);
        return {post_id:p.id,platform:p.platform,priority:pri.priority,priority_reason:pri.reason,recall_state:pri.recall_state,recall_age_hours:pri.recall_age_hours,reopen_episode_count:pri.episode_count,integrity_gaps:pri.integrity_gaps,external_mirrors_verified:false};
      });
      const priorities={CRITICAL:0,HIGH:0,ELEVATED:0,MONITOR:0,NONE:0};for(const c of cases)priorities[c.priority]++;
      return json({ok:true,build:849,booking_id:bookingId,revoked,summary:{priorities,repeat_episode_cases:cases.filter(c=>c.reopen_episode_count>1).length,source_cases:cases.length},cases,view_truncated:posts.length>20||attempts.length===500,master_preflight_contract:MASTER_CONTRACT_849,master_preflight_schema_sha256:await schemaDigest849(),independent_master_pin_enrolled:Boolean(env?.ROSIE_AIDATA_SOCIAL_ACK_PREFLIGHT_ED25519_PUBLIC_KEY),independent_preflight_reviews:audits.filter(a=>a.safe_note?.startsWith(ACK_PREFLIGHT_AUDIT_849)).length,master_runtime_ack:false,master_connection:'HOLD',provider_mutation_performed:false,master_events_emitted:0});
    }
    const action=clean(body.action,48),ownerCase=clean(body.owner_case_reference,80);
    if(!safeCase(ownerCase)||posts.length>20)return fail('A safe original owner case and complete, 20-post source window are required.');
    const post=posts.find(p=>p.id===clean(body.post_id,80));
    if(!post)return fail('Select the exact original job post.',409);
    const rows=await forPost(env,post.id);
    if(!Array.isArray(rows)||rows.length>=200)return fail('Receipt history truncated; manually reconcile before acting.');
    if(action==='reopen_repeat_verified_conflict'){
      if(!revoked||!post.posted_at||!post.external_post_id||body.confirm_second_provider_live_evidence!==true||body.acknowledge_revoked_consent_and_external_hold!==true)return fail('Original consent withdrawal, posted evidence, and both explicit owner acknowledgments required.');
      const e=episodeIntegrity849(rows),closure=e.closure,live=e.conflict;
      if(e.state!=='CONFLICT_REOPEN_REQUIRED'||!e.historical_linkage_verified||!closure?.id||!live?.id||Date.parse(live.created_at)<=Date.parse(closure.created_at)||e.episode_count>=20)return fail('Latest prior closure, newer authenticated provider LIVE receipt and complete multi-episode chain required.');
      if(rows.some(a=>a.status===REOPEN_STATUS_847&&(a.request_summary?.conflicting_provider_live_receipt_id===live.id||a.request_summary?.previous_scoped_closure_id===closure.id)))return fail('This exact verified LIVE conflict/closure is already assigned to a recall reopening.');
      const saved=await rest(env,'social_dispatch_attempts',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({social_post_id:post.id,platform:post.platform,status:REOPEN_STATUS_847,request_summary:{action,actor,owner_case_reference:ownerCase,previous_scoped_closure_id:closure.id,conflicting_provider_live_receipt_id:live.id,episode_number:e.episode_count+1},response_summary:{previous_scoped_closure_superseded:true,public_consent_still_revoked:true,provider_takedown_reverification:'HOLD',cdn_mirror_reverification:'HOLD',master_connection:'HOLD'}})});
      if(!saved?.[0]?.id)return fail('Multi-episode reopening audit was not durably stored.',503);
      return json({ok:true,reopen_id:saved[0].id,episode_number:e.episode_count+1,recall_state:'REOPENED_VERIFIED_PROVIDER_CONFLICT_HOLD',provider_mutation_performed:false,external_mirrors_verified:false,master_runtime_ack:false,master_connection:'HOLD'});
    }
    if(action==='preflight_independent_master_runtime_ack'){
      if(body.confirm_independent_master_preflight_signature!==true||body.acknowledge_no_master_runtime_ack_or_connection!==true)return fail('Independent signer and runtime HOLD acknowledgements required.');
      const receipt=body.receipt||{};
      const verdict=await validateAckPreflight849(env,receipt,body.signature,{actor,ownerCase});
      if(!verdict.ok)return fail(verdict.reason);
      if(audits.some(a=>a.safe_note?.startsWith(ACK_PREFLIGHT_AUDIT_849)&&a.safe_note.includes(`nonce ${receipt.nonce};`)))return fail('Independent Master preflight nonce already reviewed.');
      const note=`${ACK_PREFLIGHT_AUDIT_849} contract ${MASTER_CONTRACT_849}; source revision ${receipt.source_revision}; owner case ${ownerCase}; nonce ${receipt.nonce}; independent signer ${clean(receipt.signer_id,100)}; schema sha256 ${verdict.schema_digest_sha256}; signed sha256 ${verdict.canonical_sha256}; expires ${receipt.expires_at}; no consumer grant, no runtime transport, no runtime ACK, Master connection HOLD.`;
      const saved=await rest(env,'creative_project_audit',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({project_id:project.id,event_type:'updated',actor_staff_email:actor,safe_note:note})});
      if(!saved?.[0]?.id)return fail('Independent Master preflight audit was not stored.',503);
      return json({ok:true,preflight_id:saved[0].id,schema_preflight_signature_verified:true,source_revision:receipt.source_revision,preflight_expires_at:verdict.expires_at,master_runtime_ack:false,consumer_authorized:false,master_connection:'HOLD',master_events_emitted:0});
    }
    return fail('Unknown Build 849 action.');
  }catch(e){return fail(e?.message||'Private original evidence unavailable.',503);}
}
