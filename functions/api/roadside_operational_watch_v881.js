// Rosie 881 — scheduled source-history drift/grace assessment. No customer data export.
import {json} from './_lib/staff-auth.js';
import {readOriginalRows881,readOperatorRoster881,signedJob881} from './_lib/roadside-watch-source-v881.js';
import {assessRoadsideOperational881} from './_lib/roadside-operational-v881.js';
const h={'Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'};
export async function evaluateRoadsideOperational881(env){
 const [nativeAll,rotationAll,roster]=await Promise.all([
  readOriginalRows881(env,'rosie_roadside_native_watch_v880'),
  readOriginalRows881(env,'rosie_roadside_rotation_receipts_v880'),
  readOperatorRoster881(env)]);
 return assessRoadsideOperational881({
  nativeRows:nativeAll.slice(0,60),rotationRows:rotationAll.slice(0,60),
  roster,nativeTruncated:nativeAll.length>60,rotationTruncated:rotationAll.length>60});
}
export async function onRequestPost({request,env}){
 if(env.ROSIE881_OWNER_WATCH_ENABLED!=='true'||
  !await signedJob881(env,request.headers.get('Authorization'),'ROSIE881_OWNER_WATCH_JOB_SECRET'))
  return json({ok:false,build:881,state:'NOT_ENROLLED_OR_UNAUTHORIZED'},403,h);
 try{return json(await evaluateRoadsideOperational881(env),200,h);}
 catch{return json({ok:false,build:881,state:'ORIGINAL_SOURCE_UNAVAILABLE_HOLD'},503,h);}
}
export const onRequestOptions=()=>json({ok:false,error:'Bearer-authenticated POST only'},405,h);
