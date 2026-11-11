// Build 846 source-owned intelligence only: no cross-app reader, no PII,
// no emitted event, no signed-health/connection promotion or readiness score.
import {serviceHeaders} from '../_lib/staff-auth.js';
import {hasActionAccess} from '../_lib/action-permissions.js';
import {staffAccess811} from './worksite_issue_review_v811.js';
import {masterSocialProjection846,CAPABILITY_AUDIT_846} from '../_lib/jobday-capabilities-846.js';

const respond=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex,nofollow','Referrer-Policy':'no-referrer','Access-Control-Allow-Origin':'none'}});
const deny=()=>respond({ok:false,error:'Private read-only source. No cross-app consumer or mutation authorization.'},405);
export const onRequestOptions=deny;
export const onRequestPost=deny;
export const onRequestPut=deny;
export const onRequestPatch=deny;
export const onRequestDelete=deny;

async function privateRead(env,table,query){
  const r=await fetch(`${env.SUPABASE_URL}/rest/v1/${table}?${query}`,{method:'GET',headers:serviceHeaders(env),redirect:'error'});
  if(!r.ok)throw Error('Source unavailable');
  const data=await r.json();if(!Array.isArray(data))throw Error('Invalid source');return data;
}

export async function onRequestGet({request,env}){
  const access=await staffAccess811(request,env);
  if(!access.ok)return access.response;
  if(!['admin','operations_manager'].includes(String(access.actor?.role_code||'').toLowerCase())||!hasActionAccess(access.actor,'operations.assignment.manage'))return respond({ok:false,error:'Original signed Rosie supervisor authority required.'},403);
  if(!env?.SUPABASE_URL||!env?.SUPABASE_SERVICE_ROLE_KEY)return respond({ok:false,error:'Private service source unavailable.'},503);
  try{
    const posts=await privateRead(env,'social_post_queue','select=id,platform,status&source_type=eq.daip_job_media_tag&order=created_at.desc&limit=200');
    const ids=posts.map(p=>p.id);
    const [attempts,audits]=await Promise.all([
      ids.length?privateRead(env,'social_dispatch_attempts',`select=social_post_id,status,created_at&social_post_id=in.(${ids.join(',')})&order=created_at.desc&limit=500`):[],
      privateRead(env,'creative_project_audit',`select=id,created_at&event_type=eq.updated&safe_note=like.${encodeURIComponent(CAPABILITY_AUDIT_846+'*')}&order=created_at.desc&limit=250`)
    ]);
    const truncated=posts.length===200||attempts.length===500||audits.length===250;
    const projection=masterSocialProjection846({posts,attempts,capabilityAudits:audits,now:new Date().toISOString(),revision:env?.CF_PAGES_COMMIT_SHA,truncated});
    return respond({ok:true,build:846,projection,authority:{local_source_only:true,signed_supervisor:true,customer_data_returned:false,database_writes:0,external_provider_calls:0,master_events_emitted:0,master_reader_granted:false,source_signer_enrolled:false,completion_score_approved:false}});
  }catch{return respond({ok:false,error:'Authenticated original social evidence unavailable; no Master projection inferred.'},503);}
}
