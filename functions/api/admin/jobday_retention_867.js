// Rosie 867 original-owner-only manual HOLD review; no Master dispatch.
import {onRequest as original866} from './jobday_rotation_866.js';
import {requireStaffAccess,json,isUuid} from '../_lib/staff-auth.js';
import {rest,clean,serviceReady} from '../_lib/creative-projects.js';
import {ownerActor842} from '../_lib/jobday-social-842.js';
import {CONTRACT_867,HOLD_867,KINDS_867,ACTIONS_867,PLANES_867,
 renewalAging867,routeException867,retentionAudit867,digest867}
 from '../_lib/jobday-retention-867.js';
const fail=(error,status=409)=>json({ok:false,build:867,decision:'HOLD',error,...HOLD_867},status);
const revision=x=>typeof x==='string'&&/^[a-f0-9]{40}$/.test(x);
const nonce=x=>typeof x==='string'&&/^[A-Za-z0-9_-]{20,100}$/.test(x);
async function exact(env,table,cols,query){
 const x=await rest(env,table+'?select='+cols+'&'+query+'&limit=2');
 if(!Array.isArray(x)||x.length!==1)throw Error('Original private row unavailable/not unique');
 return x[0];
}
async function rows(env,table,cols,query){
 const x=await rest(env,table+'?select='+cols+'&'+query+'&order=recorded_at.desc,id.desc&limit=25');
 if(!Array.isArray(x)||x.length>=25)throw Error('Original private history truncated; HOLD');
 return x;
}
export const onRequestOptions=()=>new Response('',{status:204});
export async function onRequest({request,env}){
 if(!['GET','POST'].includes(request.method))return fail('Original-owner review only',405);
 if(Number(request.headers.get('content-length'))>20000)return fail('Payload too large',413);
 const raw=request.method==='POST'?await request.text().catch(()=>''):'';
 if(raw.length>20000)return fail('Payload too large',413);
 let body={};
 if(request.method==='POST'){
  try{body=JSON.parse(raw);if(!body||typeof body!=='object'||Array.isArray(body))throw Error();}
  catch{return fail('JSON object required',400);}
 }
 const url=new URL(request.url),params=request.method==='POST'?body:Object.fromEntries(url.searchParams);
 const bookingId=clean(params.booking_id,80),postId=clean(params.post_id,80),
  caseRef=clean(params.owner_case_reference,80),
  incidentRef=clean(params.incident_reference,80),
  txRef=clean(params.transaction_reference,96);
 if(!isUuid(bookingId)||!isUuid(postId)||!caseRef||!incidentRef||!txRef)
  return fail('Original booking/post/case/incident/transaction required',400);
 if(!serviceReady(env)||!revision(env.CF_PAGES_COMMIT_SHA))
  return fail('Protected original Rosie deployed service/source unavailable',503);
 try{
  const origin=new URL('/api/admin/jobday_rotation_866',url);
  for(const [k,v] of Object.entries({booking_id:bookingId,post_id:postId,
    owner_case_reference:caseRef,incident_reference:incidentRef,transaction_reference:txRef}))
    origin.searchParams.set(k,v);
  const headers=new Headers(request.headers);
  headers.delete('content-length');headers.delete('content-type');
  const prior=await original866({request:new Request(origin,{method:'GET',headers}),env});
  if(!prior.ok)return prior;
  const state=await prior.json();
  if(!state.ok||state.build!==866||
   state.source_revision!==env.CF_PAGES_COMMIT_SHA||
   state.history_may_be_truncated!==false||
   state.transaction_reference!==txRef||
   state.master_connected!==false||state.owner_incident_closed!==false)
   return fail('Original 866 private source/HOLD not verified');
  const auth=await requireStaffAccess({request,env,body,capability:'manage_staff',
   allowLegacyAdminFallback:false});
  if(!auth.ok)return auth.response;
  if(auth.auth_mode!=='session'||!ownerActor842(auth.actor))
   return fail('Original Rosie owner session required',403);
  const tx=await exact(env,'rosie_master_transaction_review_v855',
   'id,project_id,booking_id,post_id,case_reference,incident_reference,transaction_reference',
   'booking_id=eq.'+encodeURIComponent(bookingId)+
   '&post_id=eq.'+encodeURIComponent(postId)+
   '&transaction_reference=eq.'+encodeURIComponent(txRef));
  if(tx.case_reference!==caseRef||tx.incident_reference!==incidentRef)
   return fail('Original case identity moved');
  const f='transaction_review_id=eq.'+encodeURIComponent(tx.id);
  const baseCols='id,kind,transaction_review_id,review_status,review_digest_sha256,previous_id,previous_sha256,recorded_at';
  const [rotations,correlations,rechecks,aiRefs,commsRefs,renewalHistory,
   routingHistory,retentionHistory]=await Promise.all([
   rows(env,'rosie_owner_rotation_v866',baseCols,
    f+'&kind=eq.owner_private_snapshot_custody_rotation'),
   rows(env,'rosie_owner_rotation_v866',baseCols,
    f+'&kind=eq.owner_sla_offline_receipt_correlation'),
   rows(env,'rosie_owner_rotation_v866',baseCols,
    f+'&kind=eq.owner_signed_two_plane_exception_recheck'),
   rows(env,'rosie_postwitness_hold_v863',
    'id,kind,plane,transaction_review_id,receipt_sha256,signer_id,review_digest_sha256,recorded_at',
    f+'&kind=eq.signed_master_hold_export_readback&plane=eq.ai-data-platform'),
   rows(env,'rosie_postwitness_hold_v863',
    'id,kind,plane,transaction_review_id,receipt_sha256,signer_id,review_digest_sha256,recorded_at',
    f+'&kind=eq.signed_master_hold_export_readback&plane=eq.rosevear-comms-hub'),
   rows(env,'rosie_owner_history_v867',baseCols,
    f+'&kind=eq.owner_signed_custody_renewal_aging'),
   rows(env,'rosie_owner_history_v867',baseCols+',plane',
    f+'&kind=eq.owner_independent_plane_receipt_exception_route'),
   rows(env,'rosie_owner_history_v867',baseCols,
    f+'&kind=eq.owner_hold_history_retention_audit')
  ]);
  if(rotations[0]?.id!==state.private_custody_rotation_history?.[0]?.id||
   correlations[0]?.id!==state.sla_offline_correlation_history?.[0]?.id||
   rechecks[0]?.id!==state.signed_two_plane_exception_history?.[0]?.id)
   return fail('Original immutable 866 tip changed',503);
  const histories={
   owner_private_snapshot_custody_rotation:rotations,
   owner_sla_offline_receipt_correlation:correlations,
   owner_signed_two_plane_exception_recheck:rechecks};
  const refs=[aiRefs[0],commsRefs[0]].filter(Boolean), now=Date.now();
  const renewal=renewalAging867({rotation866:rotations[0]||null,
   offlineRefs:refs,txId:tx.id,now});
  const audit=retentionAudit867({histories,txId:tx.id,now});
  const requestedPlane=clean(params.plane,64);
  const route=PLANES_867.includes(requestedPlane)?
   routeException867({correlation866:state.independent_sla_offline_receipt_correlation,
    recheck866:state.signed_two_plane_hold_exception_recheck,
    latestCorrelation866:correlations[0],latestRecheck866:rechecks[0],
    plane:requestedPlane,txId:tx.id,now}):null;
  if(request.method==='GET')return json({ok:true,build:867,contract:CONTRACT_867,
   source_revision:env.CF_PAGES_COMMIT_SHA,transaction_reference:txRef,
   signed_owner_custody_renewal_aging:renewal,
   plane_exception_route_preview:route,
   protected_hold_history_retention_audit:audit,
   owner_renewal_aging_history:renewalHistory,
   independent_plane_exception_route_history:routingHistory,
   local_hold_retention_audit_history:retentionHistory,
   history_may_be_truncated:false,...HOLD_867});
  if(!nonce(clean(body.review_nonce,100))||
   !ACTIONS_867.includes(clean(body.owner_action,90))||
   body.confirm_original_owner_incident_open!==true||
   body.acknowledge_offline_references_not_master_ack!==true||
   body.confirm_no_retention_deletion_or_external_send!==true)
   return fail('Fresh owner nonce, non-closing action and HOLD confirmations required',400);
  let kind,result,previous=null,plane=null;
  if(body.action==='record_original_owner_signed_custody_renewal_aging'){
   kind=KINDS_867[0];result=renewal;previous=renewalHistory[0]||null;
  }else if(body.action==='route_independent_plane_receipt_exception'){
   kind=KINDS_867[1];plane=clean(body.plane,64);result=route;
   previous=routingHistory.find(x=>x.plane===plane)||null;
   if(!PLANES_867.includes(plane))return fail('Choose an independent plane',400);
  }else if(body.action==='audit_protected_hold_history_retention'){
   kind=KINDS_867[2];result=audit;previous=retentionHistory[0]||null;
  }else return fail('Unsupported protected owner review action',405);
  if(result?.decision==='HOLD'||!result?.status?.endsWith('_HOLD'))
   return fail(result?.reason||'Required original source HOLD reference not present');
  const digest=await digest867({kind,tx,
   sourceRevision:env.CF_PAGES_COMMIT_SHA,
   nonce:clean(body.review_nonce,100),previous,
   ownerAction:clean(body.owner_action,90),plane,result});
  const actor=clean(auth.actor?.email,140)||clean(auth.actor?.id,140)||'OriginalOwner';
  const saved=await rest(env,'rpc/rosie867_append_private_hold',{
   method:'POST',headers:{Prefer:'return=representation'},
   body:JSON.stringify({
    p_project_id:tx.project_id,p_booking_id:bookingId,p_post_id:postId,
    p_transaction_review_id:tx.id,
    p_latest_rotation_866_id:rotations[0]?.id||null,
    p_latest_correlation_866_id:correlations[0]?.id||null,
    p_latest_recheck_866_id:rechecks[0]?.id||null,
    p_ai_reference_863_id:aiRefs[0]?.id||null,
    p_comms_reference_863_id:commsRefs[0]?.id||null,
    p_kind:kind,p_plane:plane,p_review_status:result.status,
    p_review_nonce:clean(body.review_nonce,100),
    p_review_digest_sha256:digest,
    p_source_revision:env.CF_PAGES_COMMIT_SHA,
    p_owner_action:clean(body.owner_action,90),
    p_previous_id:previous?.id||null,
    p_previous_sha256:previous?.review_digest_sha256||null,
    p_actor_staff_email:actor})});
  if(!Array.isArray(saved)||saved.length!==1||saved[0].outcome!=='INSERTED'||!isUuid(saved[0].review_id))
   return fail('Owner immutable history tip changed; try fresh review');
  return json({ok:true,build:867,decision:result.decision,
   review_status:result.status,record_id:saved[0].review_id,
   recorded_at:saved[0].accepted_at,review_digest_sha256:digest,
   ...HOLD_867});
 }catch(e){return fail(e?.message||'Original 867 owner continuity unavailable',503);}
}
