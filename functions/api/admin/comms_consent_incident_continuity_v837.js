import {hasActionAccess} from '../_lib/action-permissions.js';
import {staffAccess811} from './worksite_issue_review_v811.js';
import {consentIncidentReadiness837} from '../../../assets/build837-consent-incident-continuity.mjs';
const answer=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{
  'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store',
  'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer',
  'X-Robots-Tag':'noindex,nofollow','Access-Control-Allow-Origin':'none'}});
const reject=()=>answer({ok:false,error:'No customer communication or incident mutation is authorized here.'},405);
export const onRequestOptions=reject;
export const onRequestPost=reject;
export const onRequestPut=reject;
export const onRequestPatch=reject;
export const onRequestDelete=reject;
export async function onRequestGet({request,env}){
  const access=await staffAccess811(request,env);
  if(!access.ok)return access.response;
  if(!['admin','operations_manager'].includes(String(access.actor?.role_code||'').toLowerCase())||
     !hasActionAccess(access.actor,'operations.assignment.manage'))
    return answer({ok:false,error:'Rosie administrator/supervisor permission required.'},403);
  try{return answer({ok:true,report:consentIncidentReadiness837({runtimeRevision:env?.CF_PAGES_COMMIT_SHA,
    generatedAt:new Date().toISOString()}),authority:{localSessionVerified:true,
      customerReads:0,incidentReads:0,otherDatabaseReads:0,databaseWrites:0,
      providerCalls:0,masterCalls:0,originalOperatorInvoked:false}});
  }catch{return answer({ok:false,error:'Private source status unavailable; communication HOLD.'},503);}
}
