import {requireStaffAccess,json} from '../_lib/staff-auth.js';
import {reviewOwnerFollowthrough776} from './economic_owner_followthrough_v776.js';
import {reconcileRetentionCustodyExpiry777} from '../_lib/economic-retention-custody-expiry-v777.js';
import {reconcileRetentionRenewalFollowup778} from '../_lib/economic-retention-renewal-followup-v778.js';

const reject=(error,status=400)=>json({ok:false,build:778,error,
  renewal_followup_status:'HOLD_RENEWAL_SIGNED_SOURCE_OR_DIGEST_CONFLICT',
  production_database_written_by_app:false,closure_allowed:false},status);
async function protect(request,env){
  const auth=await requireStaffAccess({request,env,capability:'manage_staff',
    allowLegacyAdminFallback:false});
  if(!auth.ok)return auth.response;
  return auth.auth_mode==='session'?null:reject('Signed-in owner session required.',403);
}
export async function onRequestGet({request,env}){
  const denied=await protect(request,env);if(denied)return denied;
  return json({ok:true,build:778,read_only:true,
    renewal_followup_status:'HOLD_RENEWAL_SIGNED_SOURCE_OR_DIGEST_CONFLICT',
    closure_allowed:false,production_database_written_by_app:false});
}
export async function onRequestPost({request,env}){
  const denied=await protect(request,env);if(denied)return denied;
  if(request.headers.get('origin')!==new URL(request.url).origin)
    return reject('Same-origin owner review only.',403);
  if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type')||''))
    return reject('Original signed JSON request required.',415);
  if(Number(request.headers.get('content-length')||0)>210000)
    return reject('Original signed evidence exceeds 210 KB.',413);
  let body;
  try{const raw=await request.text();if(raw.length>210000)throw Error('large');
    body=JSON.parse(raw);
  }catch{return reject('Submit the ten original Build 776 signed owner envelopes.');}
  const history=await reviewOwnerFollowthrough776({env,body});
  if(history.report?.ok!==true)
    return reject(history.report?.error||'Original signed owner evidence incomplete.');
  const expiryReport=await reconcileRetentionCustodyExpiry777({history});
  return json(await reconcileRetentionRenewalFollowup778({expiryReport}));
}
const readonly=()=>reject('Original owner and custodian renewal is external; no source retention, database, audit, email or business writes.',405);
export async function onRequestPut(){return readonly();}
export async function onRequestPatch(){return readonly();}
export async function onRequestDelete(){return readonly();}
export async function onRequestOptions(){return new Response('',{status:204,
  headers:{Allow:'GET,POST,OPTIONS','Cache-Control':'no-store'}});}
