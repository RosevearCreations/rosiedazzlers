// Rosie 881 — original signed-in admin can inspect the current bounded risk rollup.
import {requireStaffAccess,json} from '../_lib/staff-auth.js';
import {evaluateRoadsideOperational881} from '../roadside_operational_watch_v881.js';
const h={'Cache-Control':'no-store, private','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'};
export async function onRequestGet({request,env}){
 const auth=await requireStaffAccess({request,env,body:{},capability:'manage_bookings',
  allowLegacyAdminFallback:false});
 if(!auth.ok)return auth.response;
 if(auth.auth_mode!=='session'||auth.actor?.is_admin!==true)
  return json({ok:false,build:881,state:'OWNER_ONLY_HOLD'},403,h);
 try{return json({...await evaluateRoadsideOperational881(env),
  scheduled_delivery_confirmed:false,independent_external_anchor_verified:false},200,h);}
 catch{return json({ok:false,build:881,state:'ORIGINAL_SOURCE_UNAVAILABLE_HOLD'},503,h);}
}
export const onRequestOptions=()=>json({ok:false,build:881,error:'Owner GET required'},405,h);
