// An independent delivery witness endpoint, disabled until a separate HMAC secret
// is installed and an actual provider/witness is configured. Never simulates delivery.
import {serviceHeaders} from './_lib/customer-session.js';
import {verifyWitnessSignature908,normalizeWitness908} from './_lib/recovery-deliverability-v908.js';
const send=(v,status=200)=>new Response(JSON.stringify(v),{status,headers:{
 'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',
 'Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'}});
const no=()=>send({ok:false,error:'Method not allowed.'},405);
export const onRequestGet=no,onRequestOptions=no,onRequestPut=no,onRequestDelete=no;
export async function onRequestPost({request,env}){
 const secret=env?.RECOVERY_DELIVERY_WITNESS_SECRET_908;
 if(typeof secret!=='string'||secret.length<32)return send({ok:false,code:'HOLD_INDEPENDENT_WITNESS_NOT_ENROLLED'},503);
 if(!env?.SUPABASE_URL||!env?.SUPABASE_SERVICE_ROLE_KEY)return send({ok:false,code:'HOLD_ORIGINAL_EVIDENCE_STORE'},503);
 if(Number(request.headers.get('content-length')||0)>1024)return send({ok:false,error:'Payload too large.'},413);
 const raw=await request.text();
 if(raw.length>1024)return send({ok:false,error:'Payload too large.'},413);
 const timestamp=request.headers.get('x-rosie-witness-timestamp')||'';
 const signature=request.headers.get('x-rosie-witness-signature')||'';
 if(!(await verifyWitnessSignature908({secret,timestamp,body:raw,signature})))
  return send({ok:false,error:'Independent witness signature invalid.'},403);
 let data;try{data=JSON.parse(raw)}catch{return send({ok:false,error:'JSON required.'},400)}
 const claim=normalizeWitness908(data);
 if(!claim)return send({ok:false,error:'Invalid independent provider receipt.'},400);
 try{
  // A unique provider reference must already exist from the actual outbound provider.
  // A signed receipt is one-time, cannot overwrite previous witnessed facts.
  const url=env.SUPABASE_URL.replace(/\/+$/,'')+'/rest/v1/customer_recovery_delivery_evidence_908'+
   '?provider_reference=eq.'+encodeURIComponent(claim.provider_reference)+
   '&dispatch_state=eq.provider_accepted&witness_state=eq.pending';
  const res=await fetch(url,{method:'PATCH',headers:{...serviceHeaders(env),Prefer:'return=representation'},
   body:JSON.stringify({witness_state:claim.status,witnessed_at:claim.observed_at})});
  if(!res.ok)throw Error('Original private evidence unavailable');
  const rows=await res.json().catch(()=>[]);
  if(!Array.isArray(rows)||rows.length!==1)return send({ok:false,code:'NO_MATCHING_UNWITNESSED_DISPATCH'},409);
  return send({ok:true,witness_recorded:true,independent_provider_evidence:true,delivery_state:claim.status});
 }catch{return send({ok:false,error:'Original provider evidence not available.'},503)}
}
