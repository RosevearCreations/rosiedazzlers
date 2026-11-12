// Rosie 866: original-owner-only. Never transmits to independent Master planes.
import {onRequest as previous865} from './jobday_readback_865.js';
import {requireStaffAccess,json,isUuid} from '../_lib/staff-auth.js';
import {rest,clean,serviceReady} from '../_lib/creative-projects.js';
import {ownerActor842} from '../_lib/jobday-social-842.js';
import {readbackSnapshot865} from '../_lib/jobday-readback-865.js';
import {CONTRACT_866,HOLD_866,KINDS_866,ACTIONS_866,
 rotateCustody866,correlateSlaReceipt866,recheckTwoPlane866,digest866}
 from '../_lib/jobday-rotation-866.js';
const fail=(error,status=409)=>json({ok:false,build:866,decision:'HOLD',error,...HOLD_866},status);
const nonce=s=>typeof s==='string'&&/^[A-Za-z0-9_-]{20,100}$/.test(s);
const revision=s=>typeof s==='string'&&/^[a-f0-9]{40}$/.test(s);
async function unique(env,table,cols,where){
 const rows=await rest(env,table+'?select='+cols+'&'+where+'&limit=2');
 if(!Array.isArray(rows)||rows.length!==1)throw Error('Original scoped source row not unique');
 return rows[0];
}
async function list(env,table,cols,where,limit=25){
 const rows=await rest(env,table+'?select='+cols+'&'+where+
  '&order=recorded_at.desc,id.desc&limit='+limit);
 if(!Array.isArray(rows)||rows.length>=limit)
  throw Error('Original immutable source history incomplete; HOLD');
 return rows;
}
export const onRequestOptions=()=>new Response('',{status:204});
export async function onRequest({request,env}){
 if(!['GET','POST'].includes(request.method))
  return fail('Only original owner scoped review methods allowed',405);
 if(Number(request.headers.get('content-length'))>24000)
  return fail('Private owner review payload too large',413);
 const raw=request.method==='POST'?await request.text().catch(()=>''):'';
 if(raw.length>24000)return fail('Private owner review payload too large',413);
 let body={};
 if(request.method==='POST'){
  try{body=JSON.parse(raw);if(!body||Array.isArray(body)||
    typeof body!=='object')throw Error('bad');}
  catch{return fail('JSON owner review object required',400);}
 }
 const url=new URL(request.url),src=request.method==='POST'?
  body:Object.fromEntries(url.searchParams);
 const bookingId=clean(src.booking_id,80),postId=clean(src.post_id,80),
  caseRef=clean(src.owner_case_reference,80),
  incidentRef=clean(src.incident_reference,80),
  transactionRef=clean(src.transaction_reference,96);
 if(!isUuid(bookingId)||!isUuid(postId)||!caseRef||!incidentRef||!transactionRef)
  return fail('Exact original booking/post/owner case/incident/transaction required',400);
 if(!serviceReady(env)||!revision(env.CF_PAGES_COMMIT_SHA))
  return fail('Original Rosie private service or deployed source SHA unavailable',503);
 try{
  const priorUrl=new URL('/api/admin/jobday_readback_865',url);
  for(const [key,value] of Object.entries({booking_id:bookingId,
   post_id:postId,owner_case_reference:caseRef,
   incident_reference:incidentRef,transaction_reference:transactionRef}))
   priorUrl.searchParams.set(key,value);
  const headers=new Headers(request.headers);
  headers.delete('content-type');headers.delete('content-length');
  const previous=await previous865({
   request:new Request(priorUrl.toString(),{method:'GET',headers}),env});
  if(!previous.ok)return previous;
  const current=await previous.json();
  if(!current?.ok||current.build!==865||
   current.source_revision!==env.CF_PAGES_COMMIT_SHA||
   current.transaction_reference!==transactionRef||
   current.history_may_be_truncated!==false||
   current.master_connected!==false||current.owner_incident_closed!==false)
   return fail('Latest original Rosie 865 owner scope not verified',409);
  // Owner-only authorization also applies to GET; do not expose private tips
  // through a generic admin or legacy fallback.
  const auth=await requireStaffAccess({request,env,body,
   capability:'manage_staff',allowLegacyAdminFallback:false});
  if(!auth.ok)return auth.response;
  if(auth.auth_mode!=='session'||!ownerActor842(auth.actor))
   return fail('Current original Rosie owner session required',403);
  const tx=await unique(env,'rosie_master_transaction_review_v855',
   'id,project_id,booking_id,post_id,case_reference,incident_reference,transaction_reference',
   'booking_id=eq.'+encodeURIComponent(bookingId)+
   '&post_id=eq.'+encodeURIComponent(postId)+
   '&transaction_reference=eq.'+encodeURIComponent(transactionRef));
  if(tx.case_reference!==caseRef||tx.incident_reference!==incidentRef)
   return fail('Original Rosie owner incident mismatch');
  const where='transaction_review_id=eq.'+encodeURIComponent(tx.id);
  const [exportRows,snapshotRows,freshRows,escalationRows,driftRows,refs,
   rotations,correlations,rechecks,latestSla,latestPrivateExport]=await Promise.all([
   list(env,'rosie_owner_continuity_v864',
    'id,kind,transaction_review_id,source_revision,snapshot_sha256,latest_recovery_864_id,latest_drift_864_id,reconciliation_863_id,critical_followup_863_id,previous_export_id,previous_export_sha256,recorded_at',
    where+'&kind=eq.owner_incident_continuity_export'),
   list(env,'rosie_owner_readback_v865',
    'id,kind,transaction_review_id,review_status,snapshot_sha256,latest_export_864_id,review_digest_sha256,recorded_at',
    where+'&kind=eq.owner_continuity_snapshot_readback'),
   list(env,'rosie_owner_readback_v865',
    'id,kind,transaction_review_id,review_status,owner_action,review_digest_sha256,recorded_at',
    where+'&kind=eq.owner_critical_followup_freshness'),
   list(env,'rosie_owner_readback_v865',
    'id,kind,transaction_review_id,review_status,owner_action,review_digest_sha256,recorded_at',
    where+'&kind=eq.owner_two_plane_discrepancy_escalation'),
   list(env,'rosie_owner_continuity_v864',
    'id,kind,transaction_review_id,review_status,review_digest_sha256,recorded_at',
    where+'&kind=eq.owner_two_plane_drift_review'),
   list(env,'rosie_postwitness_hold_v863',
    'id,kind,plane,transaction_review_id,receipt_sha256,review_digest_sha256,recorded_at',
    where+'&kind=eq.signed_master_hold_export_readback'),
   list(env,'rosie_owner_rotation_v866',
    'id,kind,transaction_review_id,review_status,review_digest_sha256,previous_id,recorded_at',
    where+'&kind=eq.owner_private_snapshot_custody_rotation'),
   list(env,'rosie_owner_rotation_v866',
    'id,kind,transaction_review_id,review_status,review_digest_sha256,previous_id,recorded_at',
    where+'&kind=eq.owner_sla_offline_receipt_correlation'),
   list(env,'rosie_owner_rotation_v866',
    'id,kind,transaction_review_id,review_status,review_digest_sha256,previous_id,recorded_at',
    where+'&kind=eq.owner_signed_two_plane_exception_recheck'),
   list(env,'rosie_discrepancy_review_v862',
    'id,kind,transaction_review_id,sla_status,review_digest_sha256,recorded_at',
    where+'&kind=eq.owner_aging_sla_recheck'),
   list(env,'rosie_discrepancy_review_v862',
    'id,kind,transaction_review_id,snapshot_sha256,recorded_at',
    where+'&kind=eq.master_hold_custody_export')
  ]);
  if(![snapshotRows,freshRows,escalationRows,rotations,correlations,rechecks]
   .every(a=>a.every(r=>r.transaction_review_id===tx.id))||
   !Array.isArray(latestPrivateExport)||!Array.isArray(latestSla)||
   exportRows[0]?.id!==
    current.latest_original_owner_private_snapshot_864_id||
   exportRows[0]?.snapshot_sha256!==
    current.latest_original_owner_private_snapshot_sha256||
   snapshotRows[0]?.id!==
    current.owner_snapshot_readback_history?.[0]?.id||
   freshRows[0]?.id!==
    current.owner_critical_freshness_history?.[0]?.id||
   escalationRows[0]?.id!==
    current.owner_two_plane_hold_escalation_history?.[0]?.id)
   return fail('Original 864/865 private owner immutable tips drifted',503);
  const originalSla=latestSla[0]||null;
  if(!originalSla||originalSla.kind!=='owner_aging_sla_recheck'||
   originalSla.sla_status!=='CRITICAL_HOLD'||!latestPrivateExport[0])
   return fail('Original 862 critical SLA and private export unavailable',503);
  const ownerExport864=exportRows[0]||null;
  const latestSnapshot865=snapshotRows[0]||null;
  const latestFreshness865=freshRows[0]||null;
  const latestEscalation865=escalationRows[0]||null;
  const drift864=driftRows[0]||null;
  const fresh=current.original_critical_owner_sla_freshness;
  const escal=current.signed_two_plane_discrepancy_escalation;
  const correlation=correlateSlaReceipt866({freshness:fresh,
   latestFreshness865,latestEscalation865,refs,txId:tx.id});
  const recheck=recheckTwoPlane866({escalation:escal,latestEscalation865,
   drift864,refs,txId:tx.id});
  if(request.method==='GET')return json({ok:true,build:866,
   contract:CONTRACT_866,source_revision:env.CF_PAGES_COMMIT_SHA,
   transaction_reference:transactionRef,
   latest_verified_private_snapshot_864_sha256:ownerExport864?.snapshot_sha256||null,
   original_owner_private_rotation_requires_bundle:true,
   latest_865_snapshot_readback_id:latestSnapshot865?.id||null,
   independent_sla_offline_receipt_correlation:correlation,
   signed_two_plane_hold_exception_recheck:recheck,
   private_custody_rotation_history:rotations,
   sla_offline_correlation_history:correlations,
   signed_two_plane_exception_history:rechecks,
   history_may_be_truncated:false,...HOLD_866});
  const reviewNonce=clean(body.review_nonce,100);
  const ownerAction=clean(body.owner_action,90);
  if(!nonce(reviewNonce)||!ACTIONS_866.includes(ownerAction))
   return fail('Fresh owner nonce and non-closing action required',400);
  if(body.confirm_original_incident_still_open!==true||
   body.acknowledge_no_external_master_ack_or_closure!==true)
   return fail('Explicit original owner HOLD acknowledgement required',400);
  let kind,result,previousRow,verified=null;
  if(body.action==='rotate_private_owner_snapshot_custody'){
   if(body.confirm_private_reference_rotation_only!==true||
    body.confirm_original_owner_supplied_bundle!==true||
    !ownerExport864||!latestSnapshot865||!latestPrivateExport[0])
    return fail('Previously verified private 864 bundle and 865 readback required');
   verified=await readbackSnapshot865({bundle:body.bundle,
    exportRow:ownerExport864,tx,latestSla:originalSla,
    latestPrivateExport:latestPrivateExport[0]});
   previousRow=rotations[0]||null;
   result=rotateCustody866({verified,ownerExport864,
    ownerReadback865:latestSnapshot865,txId:tx.id,
    previousRotation:previousRow});
   kind=KINDS_866[0];
  }else if(body.action==='correlate_sla_offline_receipt_references'){
   if(body.confirm_offline_receipts_are_not_ack!==true)
    return fail('Offline receipt refs never prove receiver ACK');
   kind=KINDS_866[1];previousRow=correlations[0]||null;result=correlation;
  }else if(body.action==='recheck_signed_two_plane_hold_exceptions'){
   if(body.confirm_both_master_incidents_remain_hold!==true)
    return fail('Independent two-plane incident HOLD must be explicit');
   kind=KINDS_866[2];previousRow=rechecks[0]||null;result=recheck;
  }else return fail('Unsupported original owner 866 custody action',405);
  if(result?.decision==='HOLD'||!result?.status?.endsWith('_HOLD'))
   return fail(result?.reason||'Original source missing; no immutable write permitted',409);
  const digest=await digest866({kind,tx,
   sourceRevision:env.CF_PAGES_COMMIT_SHA,nonce:reviewNonce,
   previous:previousRow,ownerAction,
   rotation:kind===KINDS_866[0]?result:null,
   correlation:kind===KINDS_866[1]?result:null,
   recheck:kind===KINDS_866[2]?result:null});
  const actor=clean(auth.actor?.email,140)||clean(auth.actor?.id,140)||'OriginalOwner';
  const response=await rest(env,'rpc/rosie866_append_owner_rotation_hold',{
   method:'POST',headers:{Prefer:'return=representation'},
   body:JSON.stringify({
    p_project_id:tx.project_id,p_booking_id:bookingId,p_post_id:postId,
    p_transaction_review_id:tx.id,
    p_latest_export_864_id:ownerExport864?.id||null,
    p_latest_snapshot_865_id:latestSnapshot865?.id||null,
    p_latest_freshness_865_id:latestFreshness865?.id||null,
    p_latest_escalation_865_id:latestEscalation865?.id||null,
    p_latest_drift_864_id:drift864?.id||null,
    p_ai_receipt_863_id:refs.find(x=>x.plane==='ai-data-platform')?.id||null,
    p_comms_receipt_863_id:refs.find(x=>x.plane==='rosevear-comms-hub')?.id||null,
    p_kind:kind,p_review_status:result.status,p_review_nonce:reviewNonce,
    p_verified_snapshot_sha256:kind===KINDS_866[0]?
     result.original_verified_snapshot_sha256:null,
    p_review_digest_sha256:digest,
    p_source_revision:env.CF_PAGES_COMMIT_SHA,p_owner_action:ownerAction,
    p_previous_id:previousRow?.id||null,
    p_previous_sha256:previousRow?.review_digest_sha256||null,
    p_actor_staff_email:actor})});
  if(!Array.isArray(response)||response.length!==1||
   response[0].outcome!=='INSERTED'||!isUuid(response[0].review_id))
   return fail('Atomic original owner custody predecessor changed',409);
  return json({ok:true,build:866,decision:result.decision,
   review_status:result.status,record_id:response[0].review_id,
   recorded_at:response[0].accepted_at,review_digest_sha256:digest,
   ...HOLD_866});
 }catch(e){return fail(e?.message||'Protected Rosie 866 source unavailable',503);}
}
