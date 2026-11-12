// Rosie 864: original-owner-only critical recovery, signed HOLD reference drift
// and private owner continuity; no provider mutation, Master transport or ACK.
import {onRequest as original863} from './jobday_postwitness_863.js';
import {requireStaffAccess,json,isUuid} from '../_lib/staff-auth.js';
import {rest,clean,serviceReady} from '../_lib/creative-projects.js';
import {ownerActor842} from '../_lib/jobday-social-842.js';
import {hash860} from '../_lib/jobday-intake-860.js';
import {CONTRACT_864,HOLD_864,ACTIONS_864,revalidateCritical864,
 monitorReadbackDrift864,digest864} from '../_lib/jobday-continuity-864.js';
const fail=(error,status=409)=>json({ok:false,build:864,decision:'HOLD',error,...HOLD_864},status);
const nonce=s=>typeof s==='string'&&/^[A-Za-z0-9_-]{20,100}$/.test(s);
const revision=s=>typeof s==='string'&&/^[a-f0-9]{40}$/.test(s);
const scoped=(r,tx)=>r&&isUuid(r.id)&&r.transaction_review_id===tx;
async function exact(env,table,cols,filter){
 const rows=await rest(env,table+'?select='+cols+'&'+filter+'&limit=2');
 if(!Array.isArray(rows)||rows.length!==1)throw Error('Exact original private owner custody row required.');
 return rows[0];
}
async function persist(env,{scope,kind,status,reviewNonce,digest,ownerAction=null,
 latestExport=null,latestRecon=null,latestCritical=null,
 latestRecovery=null,latestDrift=null,snapshotSha=null,
 previous=null,previousExport=null,actor}){
 const params={
 p_project_id:scope.tx.project_id,p_booking_id:scope.bookingId,p_post_id:scope.postId,
 p_transaction_review_id:scope.tx.id,
 p_owner_exception_860_id:scope.ownerEscalation.owner_exception_860_id,
 p_owner_escalation_861_id:scope.ownerEscalation.id,p_latest_sla_862_id:scope.latestSla.id,
 p_latest_export_862_id:latestExport?.id||null,
 p_reconciliation_863_id:latestRecon?.id||null,
 p_critical_followup_863_id:latestCritical?.id||null,
 p_latest_recovery_864_id:latestRecovery?.id||null,
 p_latest_drift_864_id:latestDrift?.id||null,
 p_kind:kind,p_review_status:status,p_source_revision:scope.env.CF_PAGES_COMMIT_SHA,
 p_review_digest_sha256:digest,p_review_nonce:reviewNonce,
 p_snapshot_sha256:snapshotSha,
 p_original_exception_age_hours:scope.critical.original_exception_age_hours,
 p_owner_action:ownerAction,p_previous_id:previous?.id||null,
 p_previous_sha256:previous?.review_digest_sha256||null,
 p_previous_export_id:previousExport?.id||null,
 p_previous_export_sha256:previousExport?.review_digest_sha256||null,
 p_actor_staff_email:actor};
 const rows=await rest(env,'rpc/rosie864_append_owner_continuity',
  {method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify(params)});
 if(!Array.isArray(rows)||rows.length!==1||rows[0].outcome!=='INSERTED'||
  !isUuid(rows[0].review_id))throw Error('Owner 864 immutable custody replay or predecessor drift.');
 return {id:rows[0].review_id,recorded_at:rows[0].accepted_at};
}
export const onRequestOptions=()=>new Response('',{status:204});
export async function onRequest({request,env}){
 if(!['GET','POST'].includes(request.method))return fail('Original owner read/review only.',405);
 if(Number(request.headers.get('content-length'))>17000)return fail('Payload too large.',413);
 const raw=request.method==='POST'?await request.text().catch(()=>''):'';
 if(raw.length>17000)return fail('Payload too large.',413);
 let body={};
 if(request.method==='POST'){
  try{body=JSON.parse(raw);if(!body||typeof body!=='object'||Array.isArray(body))throw Error();}
  catch{return fail('JSON object required.',400);}
 }
 const url=new URL(request.url),src=request.method==='POST'?body:Object.fromEntries(url.searchParams);
 const bookingId=clean(src.booking_id,80),postId=clean(src.post_id,80),
  caseRef=clean(src.owner_case_reference,80),incidentRef=clean(src.incident_reference,80),
  txRef=clean(src.transaction_reference,96);
 if(!isUuid(bookingId)||!isUuid(postId)||!caseRef||!incidentRef||!txRef)
  return fail('Exact original owner booking/post/case/incident/transaction required.',400);
 if(!serviceReady(env)||!revision(env.CF_PAGES_COMMIT_SHA))
  return fail('Exact deployed original Rosie revision or private database unavailable.',503);
 try{
  // Never bypass the full original 863→862→861→860→855 revoked-consent,
  // incident source, route/priority and original-owner session validation.
  const originalUrl=new URL('/api/admin/jobday_postwitness_863',url);
  for(const [key,value] of Object.entries({booking_id:bookingId,post_id:postId,
   owner_case_reference:caseRef,incident_reference:incidentRef,
   transaction_reference:txRef}))originalUrl.searchParams.set(key,value);
  const headers=new Headers(request.headers);
  headers.delete('content-length');headers.delete('content-type');
  const prerequisite=await original863({request:new Request(originalUrl.toString(),
   {method:'GET',headers}),env});
  if(!prerequisite.ok)return prerequisite;
  const original=await prerequisite.json();
  if(!original?.ok||original.build!==863||
   original.source_revision!==env.CF_PAGES_COMMIT_SHA||
   original.transaction_reference!==txRef)
   return fail('Original owner 863 protected HOLD source not verified.');
  const tx=await exact(env,'rosie_master_transaction_review_v855',
   'id,project_id,booking_id,post_id,case_reference,incident_reference,transaction_reference',
   'booking_id=eq.'+encodeURIComponent(bookingId)+
   '&post_id=eq.'+encodeURIComponent(postId)+
   '&transaction_reference=eq.'+encodeURIComponent(txRef));
  if(tx.case_reference!==caseRef||tx.incident_reference!==incidentRef)
   return fail('Original owner case/incident scope drift.',409);
  const t='transaction_review_id=eq.'+encodeURIComponent(tx.id);
  const [latestSla,latestExport,reconciliations,criticalHistory,
   readbacks,recoveryHistory,driftHistory,exportHistory]=await Promise.all([
   exact(env,'rosie_discrepancy_review_v862',
    'id,kind,transaction_review_id,owner_escalation_861_id,review_digest_sha256,sla_status,recorded_at',
    'id=eq.'+encodeURIComponent(original.latest_owner_sla_862_id)),
   original.latest_export_862_id?
    exact(env,'rosie_discrepancy_review_v862',
     'id,kind,transaction_review_id,previous_id,review_digest_sha256,snapshot_sha256,recorded_at',
     'id=eq.'+encodeURIComponent(original.latest_export_862_id)):Promise.resolve(null),
   rest(env,'rosie_postwitness_hold_v863?select=id,kind,transaction_review_id,review_digest_sha256,review_status,recorded_at&'+
    t+'&kind=eq.owner_post_witness_reconciliation&order=recorded_at.desc&limit=25'),
   rest(env,'rosie_postwitness_hold_v863?select=id,kind,transaction_review_id,review_digest_sha256,latest_sla_862_id,review_status,recorded_at&'+
    t+'&kind=eq.owner_critical_sla_follow_up&order=recorded_at.desc&limit=25'),
   rest(env,'rosie_postwitness_hold_v863?select=id,kind,plane,transaction_review_id,witness_862_id,export_862_id,export_snapshot_sha256,reconciliation_863_id,critical_followup_863_id,receipt_sha256,review_digest_sha256,recorded_at&'+
    t+'&kind=eq.signed_master_hold_export_readback&order=recorded_at.desc&limit=25'),
   rest(env,'rosie_owner_continuity_v864?select=id,kind,transaction_review_id,review_digest_sha256,review_status,previous_id,recorded_at&'+
    t+'&kind=eq.owner_critical_recovery_recheck&order=recorded_at.desc&limit=25'),
   rest(env,'rosie_owner_continuity_v864?select=id,kind,transaction_review_id,review_digest_sha256,review_status,previous_id,recorded_at&'+
    t+'&kind=eq.owner_two_plane_drift_review&order=recorded_at.desc&limit=25'),
   rest(env,'rosie_owner_continuity_v864?select=id,kind,transaction_review_id,review_digest_sha256,snapshot_sha256,previous_id,previous_export_id,recorded_at&'+
    t+'&kind=eq.owner_incident_continuity_export&order=recorded_at.desc&limit=25')
  ]);
  // Fetch the exact original owner escalation through the latest verified 862 SLA,
  // never from a client-supplied source ID.
  const escalation=await exact(env,'rosie_intake_discrepancy_v861',
   'id,kind,transaction_review_id,owner_exception_860_id,review_digest_sha256',
   'id=eq.'+encodeURIComponent(latestSla.owner_escalation_861_id));
  if(!scoped(latestSla,tx.id)||latestSla.kind!=='owner_aging_sla_recheck'||
   latestSla.id!==original.latest_owner_sla_862_id||latestSla.sla_status!=='CRITICAL_HOLD'||
   !scoped(escalation,tx.id)||escalation.kind!=='owner_hold_escalation_review'||
   !isUuid(escalation.owner_exception_860_id)||
   latestExport&&(!scoped(latestExport,tx.id)||
    latestExport.kind!=='master_hold_custody_export'||latestExport.previous_id!==latestSla.id)||
   ![reconciliations,criticalHistory,readbacks,recoveryHistory,driftHistory,exportHistory]
    .every(a=>Array.isArray(a)&&a.length<25&&a.every(r=>scoped(r,tx.id)))||
   original.history_may_be_truncated)
   return fail('Original owner 862–864 full bounded history, critical SLA or export lineage incomplete.',503);
  const ownerEscalationVerified=escalation,latestRecon=reconciliations[0]||null,
   latestCritical=criticalHistory[0]||null;
  if(original.owner_critical_follow_up_history?.[0]?.id!==latestCritical?.id||
   original.owner_reconciliation_history?.[0]?.id!==latestRecon?.id||
   readbacks.some((r,i)=>i>0&&
    Date.parse(r.recorded_at)>Date.parse(readbacks[i-1].recorded_at))||
   latestCritical&&latestCritical.latest_sla_862_id!==latestSla.id)
   return fail('Private original 863 protected evidence tip or signed history drift.',503);
  const critical=revalidateCritical864({latestSla,criticalHistory,
   aging:original.critical_owner_sla_follow_up,now:Date.now()});
  const drift=latestExport&&latestRecon&&latestCritical?
   monitorReadbackDrift864({readbacks,latestExport,
    latestReconciliation:latestRecon,latestCritical,txId:tx.id,now:Date.now()}):
   {decision:'HOLD',reason:'MISSING_ORIGINAL_EXPORT_OR_POST_WITNESS_OWNER_CUSTODY',...HOLD_864};
  const previousRecovery=recoveryHistory[0]||null,previousDrift=driftHistory[0]||null,
   previousExport=exportHistory[0]||null;
  if(request.method==='GET')return json({
   ok:true,build:864,contract:CONTRACT_864,
   source_revision:env.CF_PAGES_COMMIT_SHA,transaction_reference:txRef,
   critical_recovery_evidence_revalidation:critical,
   signed_two_plane_hold_readback_drift:drift,
   latest_original_sla_862_id:latestSla.id,
   latest_private_862_export_id:latestExport?.id||null,
   latest_owner_863_reconciliation_id:latestRecon?.id||null,
   latest_owner_863_critical_followup_id:latestCritical?.id||null,
   owner_recovery_recheck_history:recoveryHistory,
   owner_two_plane_drift_history:driftHistory,
   private_original_incident_continuity_export_history:exportHistory,
   history_may_be_truncated:false,
   verified_master_receiver_ack:false,...HOLD_864});
  const auth=await requireStaffAccess({request,env,body,
   capability:'manage_staff',allowLegacyAdminFallback:false});
  if(!auth.ok)return auth.response;
  if(auth.auth_mode!=='session'||!ownerActor842(auth.actor))
   return fail('Authenticated original Rosie owner required, no legacy fallback.',403);
  const reviewNonce=clean(body.review_nonce,100);
  if(!nonce(reviewNonce)||
   critical.decision!=='ORIGINAL_OWNER_CRITICAL_RECOVERY_EVIDENCE_HOLD_ONLY')
   return fail('Fresh nonce, exact critical 862 SLA and original owner incident required.',400);
  const actor=clean(auth.actor?.email,140)||clean(auth.actor?.id,140)||'OriginalOwner';
  const scope={tx,bookingId,postId,ownerEscalation:ownerEscalationVerified,
   latestSla,env,critical};
  let kind,status,ownerAction=null,previous=null,snapshotSha=null,
   bundle=null,persistExport=null,persistRecon=null,persistCritical=null,
   latestRecovery=null,latestDrift=null,priorExport=null;
  if(body.action==='record_critical_recovery_evidence_recheck'){
   if(body.acknowledge_critical_owner_incident_still_open!==true||
    body.confirm_no_operational_recovery_or_master_ack!==true)
    return fail('Explicit original owner critical open incident and no-ACK acknowledgement required.');
   ownerAction=clean(body.owner_action,90);
   if(!ACTIONS_864.includes(ownerAction))
    return fail('Only non-authorizing original owner recovery recheck actions permitted.');
   kind='owner_critical_recovery_recheck';status=critical.status;previous=previousRecovery;
   persistCritical=latestCritical;
  }else if(body.action==='record_two_plane_signed_hold_drift'){
   if(body.acknowledge_signed_readbacks_are_offline_references_only!==true||
    body.confirm_drift_is_not_master_receiver_ack!==true)
    return fail('Independent signed references are never verified Master ACK.');
   if(drift.decision!=='PROTECTED_TWO_PLANE_SIGNED_HOLD_REFERENCE_DRIFT_REVIEW_ONLY')
    return fail('Current original per-plane HOLD drift evidence unavailable.');
   kind='owner_two_plane_drift_review';status=drift.status;previous=previousDrift;
   persistExport=latestExport;persistRecon=latestRecon;persistCritical=latestCritical;
  }else if(body.action==='export_original_owner_incident_continuity'){
   if(body.confirm_private_owner_hold_snapshot_only!==true||
    body.acknowledge_no_cross_master_delivery_or_closure!==true)
    return fail('Explicit owner consent for private non-delivery HOLD custody export required.');
   if(!latestExport||!latestRecon||!latestCritical||!previousRecovery||!previousDrift||
    drift.decision!=='PROTECTED_TWO_PLANE_SIGNED_HOLD_REFERENCE_DRIFT_REVIEW_ONLY')
    return fail('Current original owner recovery and two-plane drift reviews required before export.');
   kind='owner_incident_continuity_export';
   status='PRIVATE_ORIGINAL_OWNER_CONTINUITY_HOLD';previous=previousDrift;
   priorExport=previousExport;latestRecovery=previousRecovery;latestDrift=previousDrift;
   persistExport=latestExport;persistRecon=latestRecon;persistCritical=latestCritical;
   bundle={format:'rosie.original-owner-critical-continuity-hold.v864',
    generated_at:new Date().toISOString(),
    source_revision:env.CF_PAGES_COMMIT_SHA,
    transaction_review_id:tx.id,incident_reference:tx.incident_reference,
    latest_sla_862_id:latestSla.id,latest_sla_862_sha256:latestSla.review_digest_sha256,
    private_export_862_id:latestExport.id,
    private_export_snapshot_862_sha256:latestExport.snapshot_sha256,
    latest_863_owner_reconciliation_id:latestRecon.id,
    latest_863_owner_critical_followup_id:latestCritical.id,
    critical_evidence_revalidation:critical,
    two_plane_readback_drift:drift,
    latest_864_recovery_id:previousRecovery.id,
    latest_864_recovery_sha256:previousRecovery.review_digest_sha256,
    latest_864_drift_id:previousDrift.id,
    latest_864_drift_sha256:previousDrift.review_digest_sha256,
    previous_continuity_export_id:previousExport?.id||null,
    previous_continuity_export_sha256:previousExport?.review_digest_sha256||null,
    source_history_truncated:false,
    delivery_state:'NOT_TRANSMITTED_HOLD_ONLY',...HOLD_864};
   snapshotSha=await hash860('ROSIE-864-PRIVATE-ORIGINAL-OWNER-CONTINUITY-HOLD-V1\n'+
     JSON.stringify(bundle));
  }else return fail('Unsupported Rosie 864 original owner HOLD action.',405);
  const digest=await digest864({kind,tx,latestSla,latestExport,reviewNonce,
   critical,drift,ownerAction,previous,previousExport:priorExport,bundleSha:snapshotSha});
  const saved=await persist(env,{scope,kind,status,reviewNonce,digest,ownerAction,
   latestExport:persistExport,latestRecon:persistRecon,latestCritical:persistCritical,
   latestRecovery,latestDrift,snapshotSha,
   previous,previousExport:priorExport,actor});
  return json({ok:true,build:864,record_id:saved.id,recorded_at:saved.recorded_at,
   review_digest_sha256:digest,review_status:status,
   decision:kind==='owner_incident_continuity_export'?
    'PRIVATE_ORIGINAL_OWNER_INCIDENT_CONTINUITY_HOLD_ONLY':
    kind==='owner_two_plane_drift_review'?
    'SIGNED_TWO_PLANE_REFERENCE_DRIFT_RECORDED_HOLD_ONLY':
    'ORIGINAL_OWNER_CRITICAL_RECOVERY_REVALIDATION_HOLD_ONLY',
   ...(bundle?{bundle,bundle_sha256:snapshotSha}:{}),...HOLD_864});
 }catch(error){return fail(error?.message||'Protected Rosie 864 original owner custody unavailable.',503);}
}
