// Build 847: signed original owner-only, job-bound provider/custodian review;
// verified post-closure conflict reopening; independent AI Data contract intake.
// No posting, takedown, CDN purge, direct Master transport or tenant grant.
import {requireStaffAccess,json,isUuid} from '../_lib/staff-auth.js';
import {serviceReady,rest,clean} from '../_lib/creative-projects.js';
import {ownerActor842,SOURCE_TYPE_842} from '../_lib/jobday-social-842.js';
import {PROVIDER_AUDIT_845,providerSetup845} from '../_lib/jobday-provider-845.js';
import {CAPABILITY_AUDIT_846,CDN_STATUS_846} from '../_lib/jobday-capabilities-846.js';
import {REOPEN_STATUS_847,PILOT_AUDIT_847,MASTER_AUDIT_847,MASTER_CONTRACT_847,recallState847,validateMaster847} from '../_lib/jobday-pilot-847.js';

const fail=(error,status=409)=>json({ok:false,error,external_provider_mutation:false,master_events_emitted:0,master_connection:'HOLD'},status);
const caseId=v=>typeof v==='string'&&/^[A-Za-z0-9][A-Za-z0-9_-]{2,79}$/.test(v);
const recent=a=>Number.isFinite(Date.parse(a?.created_at))&&Date.now()-Date.parse(a.created_at)<=864e5&&Date.parse(a.created_at)<=Date.now()+300000;
const attempted=(env,post)=>rest(env,`social_dispatch_attempts?select=id,platform,status,created_at,request_summary,response_summary&social_post_id=eq.${encodeURIComponent(post.id)}&order=created_at.desc&limit=200`);
const writeAttempt=(env,post,request,response)=>rest(env,'social_dispatch_attempts',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({social_post_id:post.id,platform:post.platform,status:REOPEN_STATUS_847,request_summary:request,response_summary:response})});
const writeAudit=(env,project,actor,note)=>rest(env,'creative_project_audit',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({project_id:project.id,event_type:'updated',actor_staff_email:actor,safe_note:note})});

async function context(env,bookingId){
  const [booking,projects,posts]=await Promise.all([
    rest(env,`bookings?select=id&id=eq.${encodeURIComponent(bookingId)}&limit=1`),
    rest(env,`creative_projects?select=id,source_booking_id,consent_status,public_publish_allowed&source_booking_id=eq.${encodeURIComponent(bookingId)}&limit=2`),
    rest(env,`social_post_queue?select=id,booking_id,source_type,platform,status,posted_at,external_post_id,external_post_url,media_urls&booking_id=eq.${encodeURIComponent(bookingId)}&source_type=eq.${SOURCE_TYPE_842}&order=created_at.desc&limit=500`)
  ]);
  if(booking?.length!==1||projects?.length!==1||posts.length===500)throw Error('Exact original booking/project, complete bounded job-post history required.');
  const project=projects[0];
  const [audits,revocations]=await Promise.all([
    rest(env,`creative_project_audit?select=id,safe_note,created_at&project_id=eq.${project.id}&event_type=eq.updated&order=created_at.desc&limit=250`),
    rest(env,`creative_project_audit?select=id&project_id=eq.${project.id}&event_type=eq.updated&safe_note=like.${encodeURIComponent('Build 843 consent revoked:*')}&limit=1`)
  ]);
  const revoked=Boolean(revocations?.length)||project.consent_status!=='approved_public'||project.public_publish_allowed!==true;
  return {project,posts,audits:audits||[],revoked};
}

export async function onRequestOptions(){return new Response('',{status:204});}
export async function onRequest({request,env}){
  if(!['GET','POST'].includes(request.method))return fail('Method not allowed.',405);
  const body=request.method==='POST'?await request.json().catch(()=>({})):{},bookingId=clean(body.booking_id||new URL(request.url).searchParams.get('booking_id'),80);
  if(!isUuid(bookingId))return fail('Original booking UUID required.',400);
  const auth=await requireStaffAccess({request,env,body,capability:'manage_staff',allowLegacyAdminFallback:false});
  if(!auth.ok)return auth.response;
  if(auth.auth_mode!=='session'||!ownerActor842(auth.actor))return fail('An original signed-in Rosie owner session is required; legacy password or bridge cannot certify this pilot.',403);
  if(!serviceReady(env))return fail('Private evidence store is unavailable.',503);
  try{
    const {project,posts,audits,revoked}=await context(env,bookingId),actor=clean(auth.actor?.email,140)||String(auth.actor?.id||'Owner');
    if(request.method==='GET'){
      const limited=posts.slice(0,20),ids=limited.map(p=>p.id);
      const history=ids.length?await rest(env,`social_dispatch_attempts?select=id,social_post_id,status,created_at,request_summary,response_summary&social_post_id=in.(${ids.join(',')})&order=created_at.desc&limit=500`):[];
      const cases=limited.map(p=>{const rows=(history||[]).filter(a=>a.social_post_id===p.id),state=recallState847(rows);return {post_id:p.id,platform:p.platform,recall_state:state.state,closure_at:state.closure?.created_at||null,conflict_at:state.conflict?.created_at||null,reopen_at:state.reopen?.created_at||null,manual_external_mirror_review_required:true};});
      return json({ok:true,build:847,booking_id:bookingId,revoked,cases,view_truncated:posts.length>20||(history||[]).length===500||audits.length===250,owner_pilot_reviews:audits.filter(a=>a.safe_note?.startsWith(PILOT_AUDIT_847)).length,independent_master_contract_receipts:audits.filter(a=>a.safe_note?.startsWith(MASTER_AUDIT_847)).length,master_contract:MASTER_CONTRACT_847,master_signer_pin_enrolled:Boolean(env?.ROSIE_AIDATA_SOCIAL_CONTRACT_ED25519_PUBLIC_KEY),deployed_revision_present:/^[0-9a-f]{40}$/.test(env?.CF_PAGES_COMMIT_SHA||''),external_provider_mutation:false,master_events_emitted:0,master_connection:'HOLD'});
    }
    const action=clean(body.action,45),ownerCase=clean(body.owner_case_reference,80);
    if(!caseId(ownerCase)||audits.length===250)return fail('Original safe case reference and complete bounded audit history required.');
    const post=posts.find(p=>p.id===clean(body.post_id,80));
    if(!post)return fail('Select exact job-originated social post.');
    const rows=await attempted(env,post);
    if(rows.length===200)return fail('Post evidence history truncated; supervised reconciliation required.');
    const state=recallState847(rows);
    if(action==='reopen_verified_conflict'){
      if(!revoked||state.state!=='CONFLICT_REOPEN_REQUIRED'||!state.closure?.id||!state.conflict?.id||body.confirm_reopen_verified_conflict!==true||body.acknowledge_takedown_unverified!==true)return fail('A new authenticated provider LIVE receipt after scoped closure, original revocation and two owner confirmations are required.');
      const saved=await writeAttempt(env,post,{action,actor,owner_case_reference:ownerCase,original_closure_id:state.closure.id,conflicting_provider_live_receipt_id:state.conflict.id},{previous_scoped_closure_superseded:true,public_consent_remains_revoked:true,provider_takedown_reverification:'HOLD',fresh_independent_provider_cdn_custody_required:true,master_connection:'HOLD'});
      if(!saved?.[0]?.id)return fail('Conflict reopening audit was not durably saved.',503);
      return json({ok:true,reopen_id:saved[0].id,recall_state:'REOPENED_VERIFIED_PROVIDER_CONFLICT_HOLD',previous_scoped_closure_superseded:true,external_provider_mutation:false,master_connection:'HOLD'});
    }
    if(action==='review_original_provider_custodian_pilot'){
      if(body.confirm_original_owner_pilot_review!==true||body.acknowledge_external_acceptance_hold!==true)return fail('Signed owner pilot and independent external acceptance HOLD acknowledgments required.');
      if(audits.some(a=>a.safe_note?.startsWith(PILOT_AUDIT_847)&&a.safe_note.includes(`post ${post.id}; case ${ownerCase};`)))return fail('Original pilot case was already reviewed; repeated case admission denied.');
      const setup=providerSetup845(env,post.platform),account=setup.account;
      const enrollment=Boolean(account&&audits.find(a=>recent(a)&&a.safe_note?.startsWith(`${PROVIDER_AUDIT_845} ${post.platform}; account ${account};`)));
      const read=Boolean(account&&audits.find(a=>recent(a)&&a.safe_note?.startsWith(`${CAPABILITY_AUDIT_846} ${post.platform}; account ${account};`)));
      const removal=rows.some(a=>a.status==='provider_witness_verified_removed'&&a.response_summary?.independent_witness_signature_valid===true&&a.response_summary?.provider_result==='provider_delete_acknowledged');
      const cdn=rows.some(a=>a.status===CDN_STATUS_846&&a.response_summary?.independent_witness_signature_valid===true&&a.response_summary?.cache_purge_result==='cdn_purge_acknowledged');
      const gaps=[...(!enrollment?['ORIGINAL_PROVIDER_ACCOUNT_ENROLLMENT_HOLD']:[]),...(!read?['PROVIDER_CONTENT_READ_HOLD']:[]),...(!removal?['INDEPENDENT_PROVIDER_REMOVAL_HOLD']:[]),...(!cdn?['INDEPENDENT_CDN_WITNESS_HOLD']:[]),...(state.state!=='CLOSED_SCOPED_EXTERNAL_MIRRORS_HOLD'?['RECALL_SCOPE_OR_CONFLICT_HOLD']:[])];
      const note=`${PILOT_AUDIT_847} ${post.platform}; post ${post.id}; case ${ownerCase}; provider account ${enrollment?'EVIDENCED':'HOLD'}; read ${read?'EVIDENCED':'HOLD'}; signed removal ${removal?'EVIDENCED':'HOLD'}; CDN ${cdn?'EVIDENCED':'HOLD'}; recall ${state.state}; original owner reviewed; external and physical acceptance HOLD.`;
      const saved=await writeAudit(env,project,actor,note);
      if(!saved?.[0]?.id)return fail('Original pilot review was not saved.',503);
      return json({ok:true,review_id:saved[0].id,source_evidence_reviewed:true,source_gaps:gaps,real_provider_custodian_acceptance:'HOLD',original_device_hardware_attested:false,master_connection:'HOLD'});
    }
    if(action==='admit_independent_master_contract'){
      if(body.confirm_independent_master_receipt_review!==true||body.acknowledge_master_runtime_hold!==true)return fail('Independent Master signer custody and no-runtime-connection owner acknowledgments required.');
      const receipt=body.receipt||{};
      if(receipt.master_case_reference!==ownerCase)return fail('Owner and signed Master case references must match.');
      const verification=await validateMaster847(env,receipt,body.signature,{bookingId,projectId:project.id,actor});
      if(!verification.ok)return fail(verification.reason);
      if(audits.some(a=>a.safe_note?.startsWith(MASTER_AUDIT_847)&&a.safe_note.includes(`nonce ${receipt.nonce};`)))return fail('Original Master contract nonce already admitted.');
      const note=`${MASTER_AUDIT_847} contract ${MASTER_CONTRACT_847}; source revision ${receipt.source_revision}; case ${ownerCase}; nonce ${receipt.nonce}; consumer ai-data-platform; verifier ${clean(receipt.signer_id,100)}; canonical sha256 ${verification.sha256}; contract receipt verified; runtime consumer delivery/ACK HOLD; owner acceptance HOLD.`;
      const saved=await writeAudit(env,project,actor,note);
      if(!saved?.[0]?.id)return fail('Signed Master source-contract review could not be durably saved.',503);
      return json({ok:true,review_id:saved[0].id,independent_master_contract_signature_verified:true,source_contract:MASTER_CONTRACT_847,source_revision:receipt.source_revision,master_runtime_consumer_ack:false,consumer_payload_eligible:false,master_connection:'HOLD'});
    }
    return fail('Unknown Build 847 action.');
  }catch(e){return fail(e?.message||'Private original evidence unavailable.',503);}
}
