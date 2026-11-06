import {requireStaffAccess,json} from '../_lib/staff-auth.js';
import {connectionStatus781} from '../_lib/ql781-comms-status.mjs';

async function owner(request,env){
  const access=await requireStaffAccess({request,env,capability:'manage_staff',
    allowLegacyAdminFallback:false});
  if(!access.ok)return access.response;
  if(access.auth_mode!=='session'||access.actor?.role_code!=='admin')
    return json({ok:false,error:'Signed-in original owner administrator session required.',
      connection_state:'DISCONNECTED / HOLD'},403);
  return null;
}
export async function onRequestGet({request,env}){
  const denied=await owner(request,env);if(denied)return denied;
  const report=connectionStatus781({revision:env?.CF_PAGES_COMMIT_SHA});
  const response=json(report);
  const headers=new Headers(response.headers);
  headers.set('Cache-Control','private, no-store');
  headers.set('Referrer-Policy','no-referrer');
  headers.set('X-Content-Type-Options','nosniff');
  return new Response(response.body,{status:response.status,headers});
}
const denyMutation=()=>json({ok:false,build:781,
  error:'No signed TEST decision, original receipt, credential, database mutation or remote GET may be submitted to this status endpoint.',
  connection_state:'DISCONNECTED / HOLD',network_requests:0},405);
export async function onRequestPost(){return denyMutation();}
export async function onRequestPut(){return denyMutation();}
export async function onRequestPatch(){return denyMutation();}
export async function onRequestDelete(){return denyMutation();}
