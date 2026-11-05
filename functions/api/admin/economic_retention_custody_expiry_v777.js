import {requireStaffAccess,json} from '../_lib/staff-auth.js';
import {reviewOwnerFollowthrough776} from './economic_owner_followthrough_v776.js';
import {reconcileRetentionCustodyExpiry777}
  from '../_lib/economic-retention-custody-expiry-v777.js';

const reject=(error,status=400)=>json({ok:false,build:777,error,
  custody_expiry_status:'HOLD_ORIGINAL_SIGNED_CUSTODY_EVIDENCE',
  owner_business_signoff_by_app:false,
  production_database_written_by_app:false,closure_allowed:false},status);
async function protect(request,env){
  const auth=await requireStaffAccess({request,env,capability:'manage_staff',
    allowLegacyAdminFallback:false});
  if(!auth.ok)return auth.response;
  return auth.auth_mode==='session'?null:reject('Signed-in owner session required.',403);
}
export async function onRequestGet({request,env}){
  const denied=await protect(request,env);if(denied)return denied;
  return json({ok:true,build:777,read_only:true,
    renewal_alert_threshold_hours:72,
    custody_expiry_status:'HOLD_ORIGINAL_SIGNED_CUSTODY_EVIDENCE',
    owner_business_signoff_by_app:false,closure_allowed:false});
}
export async function onRequestPost({request,env}){
  const denied=await protect(request,env);if(denied)return denied;
  if(request.headers.get('origin')!==new URL(request.url).origin)
    return reject('Same-origin owner custody recheck only.',403);
  if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type')||''))
    return reject('Original signed JSON request required.',415);
  if(Number(request.headers.get('content-length')||0)>210000)
    return reject('Original signed evidence exceeds 210 KB.',413);
  let body;
  try{const raw=await request.text();if(raw.length>210000)throw Error('large');
    body=JSON.parse(raw);
  }catch{return reject('Submit the original Build 776 signed owner evidence packet.');}
  const history=await reviewOwnerFollowthrough776({env,body});
  if(history.report?.ok!==true)
    return reject(history.report?.error||'Original signed owner evidence incomplete.');
  return json(await reconcileRetentionCustodyExpiry777({history}));
}
const readonly=()=>reject('Build 777 rechecks original signed custody expiry only; no owner approval, renewal, source deletion, archive, SQL or notification.',405);
export async function onRequestPut(){return readonly();}
export async function onRequestPatch(){return readonly();}
export async function onRequestDelete(){return readonly();}
export async function onRequestOptions(){return new Response('',{status:204,
  headers:{Allow:'GET,POST,OPTIONS','Cache-Control':'no-store'}});}
