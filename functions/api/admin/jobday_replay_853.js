// Build 853 — signed-in original-owner replay-ledger snapshot review and incident history.
// No social provider dispatch, Master transport, consent restoration or CONNECTED claims.
import {requireStaffAccess,json,isUuid} from '../_lib/staff-auth.js';
import {serviceReady,rest,clean} from '../_lib/creative-projects.js';
import {ownerActor842,SOURCE_TYPE_842} from '../_lib/jobday-social-842.js';
import {CONSUMER_AUDIT_852} from '../_lib/jobday-continuity-852.js';
import {CONTRACT_853,REPLAY_AUDIT_853,INCIDENT_AUDIT_853,incidentReference853,verifyReplayLedger853,escalationRouting853,ownerIncidentDecision853} from '../_lib/jobday-replay-853.js';
const fail=(error,status=409)=>json({ok:false,build:853,error,decision:'HOLD',master_connection:'HOLD',master_runtime_ack:false,provider_mutation_performed:false,external_mirrors_verified:false,master_events_emitted:0},status);
const bounded=(value,max=100)=>typeof value==='string'?value.slice(0,max):'';
const match=(note,k,v)=>typeof note==='string'&&typeof v==='string'&&v.length>0&&note.includes(' '+k+' '+v+';');
const key=(caseId,postId)=>'case '+caseId+'; post '+postId+';';
const relevant=(audits,prefix,k)=>audits.filter(a=>typeof a.safe_note==='string'&&a.safe_note.startsWith(prefix+' '+k));
const prior=(audits,prefix,k,hash,nonce,source)=>relevant(audits,prefix,k).find(a=>match(a.safe_note,'signed_sha256',hash)&&match(a.safe_note,'nonce',nonce)&&match(a.safe_note,'source_revision',source));
async function write(env,projectId,actor,safeNote){
  const rows=await rest(env,'creative_project_audit',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({project_id:projectId,event_type:'updated',actor_staff_email:actor,safe_note:safeNote})});
  if(!rows?.[0]?.id)throw Error('Durable original-owner incident review audit unavailable.');
  return rows[0].id;
}
export const onRequestOptions=()=>new Response('',{status:204});
export async function onRequest({request,env}){
  if(!['GET','POST'].includes(request.method))return fail('Only original-owner GET and POST reviews supported.',405);
  if(Number(request.headers.get('content-length'))>12000)return fail('Evidence payload too large.',413);
  const raw=request.method==='POST'?await request.text().catch(()=>''):'';
  if(raw.length>12000)return fail('Evidence payload too large.',413);
  let body={};
  if(request.method==='POST'){try{body=JSON.parse(raw);if(!body||Array.isArray(body)||typeof body!=='object')throw Error();}catch{return fail('Valid JSON object required.',400);}}
  const bookingId=clean(body.booking_id||new URL(request.url).searchParams.get('booking_id'),80);
  if(!isUuid(bookingId))return fail('Exact original booking UUID required.',400);
  const auth=await requireStaffAccess({request,env,body,capability:'manage_staff',allowLegacyAdminFallback:false});
  if(!auth.ok)return auth.response;
  if(auth.auth_mode!=='session'||!ownerActor842(auth.actor))return fail('Original Rosie owner session required; legacy/bridge authority denied.',403);
  if(!serviceReady(env))return fail('Original private audit evidence unavailable.',503);
  try{
    const [bookings,projects,posts]=await Promise.all([
      rest(env,'bookings?select=id&id=eq.'+encodeURIComponent(bookingId)+'&limit=1'),
      rest(env,'creative_projects?select=id,consent_status,public_publish_allowed&source_booking_id=eq.'+encodeURIComponent(bookingId)+'&limit=2'),
      rest(env,'social_post_queue?select=id,platform,source_type&booking_id=eq.'+encodeURIComponent(bookingId)+'&source_type=eq.'+SOURCE_TYPE_842+'&order=created_at.desc&limit=21')
    ]);
    if(bookings?.length!==1||projects?.length!==1||!Array.isArray(posts)||posts.length<1||posts.length>=21)throw Error('Original booking, unique linked project and untruncated local social posts required.');
    const project=projects[0];
    const [audits,revocations]=await Promise.all([
      rest(env,'creative_project_audit?select=id,safe_note,created_at&project_id=eq.'+encodeURIComponent(project.id)+'&event_type=eq.updated&order=created_at.desc&limit=250'),
      rest(env,'creative_project_audit?select=id&project_id=eq.'+encodeURIComponent(project.id)+'&event_type=eq.updated&safe_note=like.'+encodeURIComponent('Build 843 consent revoked:*')+'&limit=1')
    ]);
    if(!Array.isArray(audits)||audits.length>=250||!Array.isArray(revocations))throw Error('Original bounded consent or incident history incomplete. No authority can be inferred.');
    const revoked=Boolean(revocations.length)||project.consent_status!=='approved_public'||project.public_publish_allowed!==true;
    const manifest=String(env?.ROSIE_RECALL_EXPECTED_PLATFORMS_852||'').split(',').map(p=>p.trim()).filter(Boolean);
    const attempts=await Promise.all(posts.map(p=>rest(env,'social_dispatch_attempts?select=id,status,platform,created_at,request_summary,response_summary&social_post_id=eq.'+encodeURIComponent(p.id)+'&order=created_at.desc&limit=200')));
    if(attempts.some(rows=>!Array.isArray(rows)||rows.length>=200))throw Error('Original post receipts incomplete; supervised owner reconciliation required.');
    const routing=escalationRouting853(posts.map((p,i)=>({post_id:p.id,platform:p.platform,attempts:attempts[i]})),{expectedPlatforms:manifest,revoked});
    const actor=clean(auth.actor?.email,140)||String(auth.actor?.id||'OriginalOwner');
    if(request.method==='GET'){
      const history=audits.filter(a=>typeof a.safe_note==='string'&&a.safe_note.startsWith(INCIDENT_AUDIT_853)).slice(0,50).map(a=>{
        const s=a.safe_note,extract=k=>new RegExp(' '+k+' ([A-Za-z0-9_-]+);').exec(s)?.[1]||null;
        return {audit_id:a.id,recorded_at:a.created_at,incident_reference:extract('incident'),case_reference:extract('case'),action:extract('action'),route:extract('route'),priority:extract('priority'),decision:'OWNER_REVIEW_RECORDED_ONLY',external_delivery_verified:false};
      });
      return json({ok:true,build:853,booking_id:bookingId,contract:CONTRACT_853,source_window_complete:routing.source_window_complete,routing_decision:routing.decision,routing_reasons:routing.reasons,routes:routing.routes,prior_consumer_reviews:audits.filter(a=>a.safe_note?.startsWith(CONSUMER_AUDIT_852)).length,replay_snapshot_reviews:audits.filter(a=>a.safe_note?.startsWith(REPLAY_AUDIT_853)).length,owner_incident_decisions:history,incident_history_window_complete:audits.length<250,independent_ledger_pin_enrolled:Boolean(env?.ROSIE_AIDATA_REPLAY_LEDGER_ED25519_PUBLIC_KEY_853),revocation_recorded:revocations.length>0,master_connection:'HOLD',master_runtime_ack:false,atomic_ledger_uniqueness_verified:false,external_provider_removal_verified:false,notification_sent:false,master_events_emitted:0});
    }
    const action=clean(body.action,64),caseId=clean(body.owner_case_reference,80),postId=clean(body.post_id,80);
    if(!incidentReference853(caseId)||!isUuid(postId))return fail('Safe owner case reference and exact original post required.',400);
    const post=posts.find(p=>p.id===postId);
    if(!post)return fail('Original post does not belong to this booking.');
    if(!revocations.length||!revoked||routing.decision!=='ROUTING_REVIEW_ONLY')return fail('Original consent withdrawal and complete local platform routing evidence required.');
    const scope=key(caseId,postId),ledgerReviews=relevant(audits,REPLAY_AUDIT_853,scope);
    if(action==='review_independent_replay_snapshot'){
      if(body.confirm_independent_ledger_signer!==true||body.acknowledge_runtime_ledger_and_transport_hold!==true)return fail('Independent signer review and runtime replay/transport HOLD acknowledgements required.');
      const receipt=body.receipt||{};
      const upstream=prior(audits,CONSUMER_AUDIT_852,scope,receipt.prior_consumer_sha256,receipt.prior_consumer_nonce,receipt.prior_source_revision);
      if(!upstream)return fail('Exact previous signed Master consumer decision not found in original audit history.');
      if(audits.some(a=>a.safe_note?.startsWith(REPLAY_AUDIT_853)&&match(a.safe_note,'nonce',receipt.nonce)))return fail('Original replay-ledger receipt nonce already reviewed.');
      if(ledgerReviews.some(a=>match(a.safe_note,'ledger_sequence',String(receipt.ledger_sequence))))return fail('Ledger sequence already reviewed for this case; conflicting snapshots require independent reconciliation.');
      const verdict=await verifyReplayLedger853(env,receipt,body.signature,{bookingId,projectId:project.id,post,caseReference:caseId,priorConsumerSha:receipt.prior_consumer_sha256,priorConsumerNonce:receipt.prior_consumer_nonce,priorSourceRevision:receipt.prior_source_revision,actor});
      if(!verdict.ok)return fail(verdict.reason);
      const note=REPLAY_AUDIT_853+' '+scope+' nonce '+receipt.nonce+'; signed_sha256 '+verdict.canonical_sha256+'; ledger_sequence '+receipt.ledger_sequence+'; ledger_entry_sha256 '+receipt.ledger_entry_digest_sha256+'; ledger_chain_sha256 '+receipt.ledger_chain_digest_sha256+'; prior_consumer_sha256 '+receipt.prior_consumer_sha256+'; prior_consumer_nonce '+receipt.prior_consumer_nonce+'; source_revision '+receipt.source_revision+'; signer '+receipt.signer_id+'; expires '+verdict.expires_at+'; signature review only, no direct remote ledger read or atomic uniqueness proof; Master HOLD.';
      const id=await write(env,project.id,actor,note);
      return json({ok:true,build:853,audit_id:id,signature_verified:true,review_digest_sha256:verdict.canonical_sha256,ledger_sequence:verdict.ledger_sequence,durable_remote_read_verified:false,atomic_ledger_uniqueness_verified:false,master_connection:'HOLD',consumer_authorized:false,master_events_emitted:0});
    }
    if(action==='record_owner_incident_decision'){
      if(body.confirm_original_owner_incident_decision!==true||body.acknowledge_no_notification_or_provider_mutation!==true)return fail('Explicit original-owner review and no-dispatch acknowledgment required.');
      const incident=clean(body.incident_reference,80),decisionAction=clean(body.incident_action,64),route=clean(body.route,90);
      if(!incidentReference853(incident))return fail('Safe exact incident reference required.',400);
      // A durable original incident reference cannot be assigned twice anywhere in the bounded project audit history.
      if(audits.some(a=>a.safe_note?.startsWith(INCIDENT_AUDIT_853)&&match(a.safe_note,'incident',incident)))return fail('Incident reference replay or conflicting decision denied.');
      const verdict=ownerIncidentDecision853({action:decisionAction,platform:post.platform,route,caseReference:caseId,incidentReference:incident,revocationRecorded:Boolean(revocations.length),routing,ledgerReviewRecorded:ledgerReviews.length>0});
      if(verdict.decision!=='OWNER_REVIEW_RECORDED_ONLY')return fail('Incident decision HOLD: '+verdict.reasons.join(', '));
      const note=INCIDENT_AUDIT_853+' '+scope+' incident '+incident+'; action '+decisionAction+'; route '+verdict.route+'; priority '+verdict.priority+'; source_revision '+String(env?.CF_PAGES_COMMIT_SHA||'unknown')+'; manual original-owner review recorded; provider/notifications/receiver transport not dispatched; external and CONNECTED HOLD.';
      const id=await write(env,project.id,actor,note);
      return json({ok:true,build:853,audit_id:id,incident_reference:incident,...verdict});
    }
    return fail('Unsupported Build 853 action.',405);
  }catch(e){return fail(e?.message||'Private source/incident evidence unavailable.',503);}
}
