// Rosie 876: bounded automated, read-only owner refund watch for a configured
// private scheduled caller. Never sends a customer message or changes payments.
import {serviceHeaders,json,isUuid} from './_lib/staff-auth.js';
import {refundReadback} from './admin/roadside_audit_v871.js';
import {assessRoadsideRefundDrift} from './_lib/roadside-refund-drift-v875.js';
import {classifyRoadsideRefundEscalation,rollupRoadsideEscalations}
 from './_lib/roadside-escalation-policy-v876.js';
const headers={'Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'};
const deny=(error,status=403)=>json({ok:false,build:876,error,escalation_sent:false},status,headers);
async function bearerEqual(expected,actual){
 if(typeof expected!=='string'||expected.length<32||
    typeof actual!=='string'||actual.length!==expected.length)return false;
 const enc=new TextEncoder();
 const [x,y]=await Promise.all([crypto.subtle.digest('SHA-256',enc.encode(expected)),
   crypto.subtle.digest('SHA-256',enc.encode(actual))]);
 const a=new Uint8Array(x),b=new Uint8Array(y);let mismatch=0;
 for(let i=0;i<a.length;i++)mismatch|=a[i]^b[i];
 return mismatch===0;
}
async function recentChecks(env,from){
 const path='rosie_roadside_net_deposit_checks_v871?select=id,draft_id,booking_id,'+
  'provider,source,state,gross_cents,refunded_cents,net_cents,net_verified,checked_at'+
  '&checked_at=gte.'+encodeURIComponent(from)+'&order=checked_at.desc,id.desc&limit=31';
 const r=await fetch(env.SUPABASE_URL.replace(/\/+$/,'')+'/rest/v1/'+path,
  {redirect:'error',headers:serviceHeaders(env)});
 const records=await r.json().catch(()=>null);
 if(!r.ok||!Array.isArray(records))throw Error('Bounded original refund ledger readback unavailable');
 return records;
}
export async function onRequestPost({request,env}){
 if(env.ROSIE_ROADSIDE_ESCALATION_ENABLED!=='true'||
  !env.ROSIE_ROADSIDE_ESCALATION_JOB_SECRET||
  !/^https:\/\//.test(env.SUPABASE_URL||'')||!env.SUPABASE_SERVICE_ROLE_KEY)
  return deny('Original scheduled owner escalation is not enrolled',503);
 const authorization=request.headers.get('Authorization')||'';
 if(!authorization.startsWith('Bearer ')||
  !await bearerEqual(env.ROSIE_ROADSIDE_ESCALATION_JOB_SECRET,
    authorization.slice('Bearer '.length)))return deny('Scheduled owner authority required',401);
 const now=Date.now(),from=new Date(now-24*3600000).toISOString();
 try{
  const records=await recentChecks(env,from);
  const chosen=[],seen=new Set();let incomplete=records.length===31;
  for(const r of records){
   if(!isUuid(r.booking_id)||!isUuid(r.draft_id)){incomplete=true;continue;}
   if(seen.has(r.booking_id))continue;
   seen.add(r.booking_id);
   if(chosen.length>=8){incomplete=true;break;}
   chosen.push(r);
  }
  const policies=[];
  // Strictly bounded serial API reads to avoid flooding the original provider.
  for(const snapshot of chosen){
   let live;
   try{live=await refundReadback(env,snapshot.booking_id);}
   catch{live={state:'provider_unavailable_hold',net_verified:false,
    reason:'Original payment provider unavailable to scheduled watch'};}
   const drift=assessRoadsideRefundDrift({
    snapshot,live,bookingId:snapshot.booking_id,nowMs:now});
   policies.push(classifyRoadsideRefundEscalation(drift,
    {nowMs:now,lastCheckAt:snapshot.checked_at}));
  }
  const rollup=rollupRoadsideEscalations(policies,{coverageIncomplete:incomplete,nowMs:now});
  return json({ok:true,build:876,...rollup,
   scoped_recent_hours:24,checked_bookings:chosen.length,
   no_owner_issue_created_by_endpoint:true,scheduled_proof_not_a_customer_delivery:true},200,headers);
 }catch{return deny('Scheduled refund watch could not inspect original evidence; review manually',503);}
}
export const onRequestOptions=()=>deny('Scheduled signed POST only',405);
