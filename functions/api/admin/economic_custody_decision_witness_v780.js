import {requireStaffAccess,json} from '../_lib/staff-auth.js';
import {reviewOwnerFollowthrough776} from './economic_owner_followthrough_v776.js';
import {reconcileRetentionCustodyExpiry777} from '../_lib/economic-retention-custody-expiry-v777.js';
import {reconcileRetentionRenewalFollowup778} from '../_lib/economic-retention-renewal-followup-v778.js';
import {buildCustodyExceptionDecisionRegister779} from '../_lib/economic-custody-exception-register-v779.js';
import {reconcileCustodyDecisionWitness780} from '../_lib/economic-custody-decision-witness-v780.js';

const reject=(error,status=400)=>json({ok:false,build:780,error,
  witness_reconciliation_status:'HOLD_UNVERIFIED_ORIGINAL_WITNESSES',
  production_database_written_by_app:false,closure_allowed:false},status);
async function protect(request,env){
  const auth=await requireStaffAccess({request,env,capability:'manage_staff',
    allowLegacyAdminFallback:false});
  if(!auth.ok)return auth.response;
  return auth.auth_mode==='session'?null:reject('Signed-in owner session required.',403);
}
export async function onRequestGet({request,env}){
  const denied=await protect(request,env);if(denied)return denied;
  return json({ok:true,build:780,read_only:true,
    witness_reconciliation_status:'HOLD_UNVERIFIED_ORIGINAL_WITNESSES',
    witness_rows:[],closure_allowed:false,production_database_written_by_app:false});
}
export async function onRequestPost({request,env}){
  const denied=await protect(request,env);if(denied)return denied;
  if(request.headers.get('origin')!==new URL(request.url).origin)
    return reject('Same-origin owner witness review only.',403);
  if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type')||''))
    return reject('Original signed JSON request required.',415);
  if(Number(request.headers.get('content-length')||0)>210000)
    return reject('Original signed evidence exceeds 210 KB.',413);
  let body;
  try{const raw=await request.text();if(raw.length>210000)throw Error('large');
    body=JSON.parse(raw);
  }catch{return reject('Ten original signed owner envelopes are required.');}
  const history=await reviewOwnerFollowthrough776({env,body});
  if(history.report?.ok!==true)
    return reject(history.report?.error||'Original signed owner evidence incomplete.');
  const now=Date.now();
  const expiryReport=await reconcileRetentionCustodyExpiry777({history,now});
  const followupReport=await reconcileRetentionRenewalFollowup778({expiryReport,now});
  const register=await buildCustodyExceptionDecisionRegister779({
    expiryReport,followupReport,history,now});
  return json(await reconcileCustodyDecisionWitness780({
    register,expiryReport,followupReport,history,now}));
}
const readonly=()=>reject('Original signed human decisions are external; no custody, owner consent, dispute, SQL, audit, retention, dispatch or notification writes.',405);
export async function onRequestPut(){return readonly();}
export async function onRequestPatch(){return readonly();}
export async function onRequestDelete(){return readonly();}
export async function onRequestOptions(){return new Response('',{status:204,
  headers:{Allow:'GET,POST,OPTIONS','Cache-Control':'no-store'}});}
