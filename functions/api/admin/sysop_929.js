// Reuse existing authenticated staff gate and database-backed 928 receiver readiness.
import {onRequestGet as originalStatus} from './sysop_928.js';
import {receiverEnrollment929} from '../../../assets/build929-guest-custody.mjs';
const reply=(x,s=200)=>new Response(JSON.stringify(x),{status:s,headers:{'Content-Type':'application/json','Cache-Control':'private, no-store','Vary':'Cookie','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex,nofollow'}});
export async function onRequestGet(ctx){
 const res=await originalStatus(ctx);
 if(!res.ok)return res;
 try{const x=await res.json();if(x.ok!==true||x.build!==928||!Array.isArray(x.receivers))throw Error('SOURCE_UNAVAILABLE');
 return reply({ok:true,build:929,enrollment:receiverEnrollment929(x.receivers),originalReceivers:x.receivers,evidence:x.evidence,fieldCertified:false,authorizesAction:false});
 }catch{return reply({ok:false,error:'PRIVATE_ORIGINAL_READINESS_UNAVAILABLE'},503)}
}
const deny=()=>reply({ok:false,error:'READ_ONLY_METHOD_REQUIRED'},405);
export const onRequestPost=deny,onRequestPut=deny,onRequestPatch=deny,onRequestDelete=deny,onRequestOptions=deny;
