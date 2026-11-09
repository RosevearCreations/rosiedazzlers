// Build 826: authenticated, append-only guided evidence and review decisions.
// Human-reported observations NEVER upgrade trusted QL-364/365D source status.
import {serviceHeaders} from '../_lib/staff-auth.js';
import {hasActionAccess} from '../_lib/action-permissions.js';
import {staffAccess811} from './worksite_issue_review_v811.js';
import {sameOrigin811} from '../client/worksite_issues_v811.js';
import {validateEvidence826,proposedMasterReadiness826} from '../../../assets/build826-field-evidence-contract.mjs';
import {draftRegistry827} from '../../../assets/build827-module-requirements.mjs';

const TABLE='rosie_field_acceptance_events_v826';
const SELECT='id,event_kind,actor_staff_user_id,target_event_id,module_id,role_id,device_class,browser_class,route_path,viewport_width,observed_outcome,observed_at,evidence_ref,review_state,recorded_at';
const PRIVATE_SELECT=SELECT+',request_id';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const respond=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{
  'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store, private',
  'X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex,nofollow',
  'Referrer-Policy':'no-referrer'
}});
const supervisor=actor=>['operations_manager','admin'].includes(String(actor?.role_code||'').toLowerCase())&&
  hasActionAccess(actor,'operations.assignment.manage');
async function loadRows(env,query){
  const response=await fetch(env.SUPABASE_URL+'/rest/v1/'+TABLE+'?'+query,{
    headers:serviceHeaders(env),redirect:'error'});
  if(!response.ok)throw Error('Source ledger unavailable');
  const rows=await response.json();
  if(!Array.isArray(rows)||rows.length>100)throw Error('Unexpected source format');
  return rows;
}
export const onRequestOptions=()=>respond({ok:false,error:'Method not allowed.'},405);
export async function onRequestGet({request,env}){
  const access=await staffAccess811(request,env);if(!access.ok)return access.response;
  if(!supervisor(access.actor))return respond({ok:false,error:'Supervisor action permission required.'},403);
  try{
    const events=await loadRows(env,'select='+SELECT+'&order=recorded_at.desc,id.desc&limit=100');
    return respond({ok:true,build:826,scope:'signed_supervisor_local_evidence_only',
      generated_at:new Date().toISOString(),events,history_limit:100,
      master_preview:proposedMasterReadiness826({
        events,sourceRevision:env.CF_PAGES_COMMIT_SHA,generatedAt:new Date().toISOString()
      }),
      requirement_registry_draft:draftRegistry827({events}),
      source_authority:{append_only:true,operator_reported_not_independently_verified:true,
        human_review_is_not_owner_cryptographic_signature:true,
        original_comms_test_receipt_verified:false,master_submission_performed:false,
        canonical_hold_updated:false,percentages_recalculated:false,
        notification_sent:false,booking_changed:false,device_command_sent:false}
    });
  }catch{return respond({ok:false,error:'Private field evidence source unavailable; no evidence has been inferred.'},503);}
}
export async function onRequestPost({request,env}){
  if(!sameOrigin811(request))return respond({ok:false,error:'Same-origin request required.'},403);
  if(!(request.headers.get('content-type')||'').toLowerCase().startsWith('application/json'))
    return respond({ok:false,error:'JSON body required.'},415);
  const access=await staffAccess811(request,env);if(!access.ok)return access.response;
  if(!supervisor(access.actor))return respond({ok:false,error:'Supervisor action permission required.'},403);
  try{
    const raw=await request.text();
    if(raw.length>2100)return respond({ok:false,error:'Evidence request is too large.'},413);
    const valid=validateEvidence826(JSON.parse(raw),{now:Date.now()});
    if(!valid)return respond({ok:false,error:'Invalid role, device, date, route, reference or review decision.'},400);
    const existing=await loadRows(env,'select='+PRIVATE_SELECT+
      '&actor_staff_user_id=eq.'+encodeURIComponent(access.actor.id)+
      '&request_id=eq.'+encodeURIComponent(valid.request_id)+'&limit=1');
    if(existing.length){
      const prior=existing[0];
      if(Object.entries(valid).some(([k,v])=>prior[k]!==v))
        return respond({ok:false,error:'Request ID already belongs to different evidence.'},409);
      return respond({ok:true,replayed:true,event_id:prior.id,
        recorded_at:prior.recorded_at,source_recorded:true,
        independent_verification:false,canonical_hold_changed:false});
    }
    if(valid.event_kind==='signoff'||valid.event_kind==='module_review'&&valid.review_state==='owner_review_candidate'){
      const targetId=valid.target_event_id;
      const found=await loadRows(env,'select='+PRIVATE_SELECT+'&id=eq.'+
        encodeURIComponent(targetId)+'&limit=1');
      const target=found[0];
      if(!target)return respond({ok:false,error:'Referenced source event is not available.'},404);
      if(target.actor_staff_user_id===access.actor.id)
        return respond({ok:false,error:'Independent review requires a different signed supervisor.'},403);
      if(valid.event_kind==='signoff'&&target.event_kind!=='observation')
        return respond({ok:false,error:'Supervisor signoff requires an original recorded observation.'},409);
      if(valid.event_kind==='module_review'&&
         !(target.event_kind==='signoff'&&target.review_state==='accepted_for_review'))
        return respond({ok:false,error:'Module review candidate requires a separately accepted signoff.'},409);
    }
    const payload={...valid,actor_staff_user_id:access.actor.id};
    const write=await fetch(env.SUPABASE_URL+'/rest/v1/'+TABLE+'?select='+PRIVATE_SELECT,{
      method:'POST',headers:{...serviceHeaders(env),Prefer:'return=representation'},
      body:JSON.stringify([payload]),redirect:'error'});
    if(!write.ok)return respond({ok:false,error:'Evidence not confirmed. Refresh and check history before retrying.'},503);
    const saved=await write.json().catch(()=>[]);
    if(!Array.isArray(saved)||saved.length!==1||!UUID.test(saved[0].id||'')||
       saved[0].actor_staff_user_id!==access.actor.id)
       return respond({ok:false,error:'Evidence persisted status not independently confirmed.'},503);
    const readback=await loadRows(env,'select='+PRIVATE_SELECT+'&id=eq.'+
      encodeURIComponent(saved[0].id)+'&limit=1');
    if(readback.length!==1||readback[0].request_id!==valid.request_id||
      readback[0].actor_staff_user_id!==access.actor.id||
      Object.entries(valid).some(([k,v])=>readback[0][k]!==v))
      return respond({ok:false,error:'Source write may exist but readback is unverified; retain request ID and reload.'},503);
    return respond({ok:true,event_id:saved[0].id,recorded_at:saved[0].recorded_at,
      source_recorded:true,independent_verification:false,
      original_owner_signatures:false,master_event_sent:false,
      canonical_hold_changed:false,percentages_changed:false},201);
  }catch(error){return respond({ok:false,error:error instanceof SyntaxError?'Invalid JSON request.':
    'Evidence source unavailable; do not assume a record was saved.'},error instanceof SyntaxError?400:503);}
}
