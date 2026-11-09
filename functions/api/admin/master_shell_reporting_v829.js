// Private Rosie-only GET. No outbound AI Data route, no broader shell credentials.
import {serviceHeaders} from '../_lib/staff-auth.js';
import {hasActionAccess} from '../_lib/action-permissions.js';
import {staffAccess811} from './worksite_issue_review_v811.js';
import {reportingPreview829} from '../../../assets/build829-ai-data-adapter.mjs';

const respond=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{
  'Content-Type':'application/json; charset=utf-8',
  'Cache-Control':'no-store, private',
  'X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex,nofollow',
  'Referrer-Policy':'no-referrer','Access-Control-Allow-Origin':'none'
}});
const authorized=actor=>['operations_manager','admin'].includes(String(actor?.role_code||'').toLowerCase())&&
  hasActionAccess(actor,'operations.assignment.manage');
export const onRequestOptions=()=>respond({ok:false,error:'Method not allowed.'},405);
export const onRequestPost=()=>respond({ok:false,error:'Read-only adapter; method not allowed.'},405);

export async function onRequestGet({request,env}){
  const access=await staffAccess811(request,env);
  if(!access.ok)return access.response;
  if(!authorized(access.actor))return respond({ok:false,error:'Supervisor action permission required.'},403);
  try{
    const query='select=id,event_kind,actor_staff_user_id,target_event_id,module_id,role_id,device_class,browser_class,observed_outcome,observed_at,evidence_ref,review_state,recorded_at&order=recorded_at.desc,id.desc&limit=100';
    const response=await fetch(env.SUPABASE_URL+'/rest/v1/rosie_field_acceptance_events_v826?'+query,{
      headers:serviceHeaders(env),redirect:'error'});
    if(!response.ok)throw Error('Unavailable source');
    const events=await response.json();
    if(!Array.isArray(events)||events.length>100)throw Error('Invalid source window');
    return respond({ok:true,preview:reportingPreview829({events,
      sourceRevision:env.CF_PAGES_COMMIT_SHA,generatedAt:new Date().toISOString()})});
  }catch{
    return respond({ok:false,error:'Authenticated source unavailable; no reporting preview or evidence inferred.'},503);
  }
}
