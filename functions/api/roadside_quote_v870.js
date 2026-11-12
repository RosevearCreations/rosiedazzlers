// Rosie 870: capability-scoped public read from a random 256-bit bearer link.
// Response never contains photos, phone, email, name, addresses, draft ID or payment references.
import { serviceHeaders, json } from './_lib/staff-auth.js';
const headers={ 'Cache-Control':'no-store', 'Referrer-Policy':'no-referrer' };
const packages=new Set(['premium_wash','basic_detail','complete_detail','interior_detail','exterior_detail']);
const sizes=new Set(['small','mid','oversize']);
const fail=(error,status)=>json({ok:false,build:870,error,booking_confirmed:false,deposit_verified:false},status,headers);
async function query(env,table,columns,filter){
 const response=await fetch(env.SUPABASE_URL.replace(/\/+$/,'')+
  '/rest/v1/'+table+'?select='+columns+'&'+filter+'&limit=2',
  {headers:serviceHeaders(env)});
 const out=await response.json().catch(()=>null);
 if(!response.ok||!Array.isArray(out))throw Error('Private quote lookup unavailable');
 return out.length===1?out[0]:null;
}
async function sha256(value){
 const d=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));
 return [...new Uint8Array(d)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
export const onRequestOptions=()=>new Response(null,{status:204,headers});
export async function onRequest({request,env}){
 if(request.method!=='POST')return fail('Only token-based quote lookup is supported',405);
 if(!/^https:\/\//.test(env.SUPABASE_URL||'')||!env.SUPABASE_SERVICE_ROLE_KEY)
  return fail('Quote lookup is not configured',503);
 if(Number(request.headers.get('content-length'))>500)return fail('Link token too large',413);
 const raw=await request.text().catch(()=>'');
 if(raw.length>500)return fail('Link token too large',413);
 let token='';
 try{
  const body=JSON.parse(raw);
  token=String(body?.share_token||'');
 }catch{return fail('Invalid link token',400);}
 if(!/^[A-Za-z0-9_-]{43}$/.test(token))return fail('Invalid link token',400);
 try{
  const hash=await sha256(token);
  const s=await query(env,'rosie_roadside_quote_shares_v870',
   'draft_id,quote_snapshot_cents,package_code,vehicle_size,expires_at,revoked_at',
   'token_hash=eq.'+hash);
  if(!s||s.revoked_at||Date.parse(s.expires_at)<=Date.now())
   return fail('Quote link is no longer available. Please request a new link.',410);
  const d=await query(env,'rosie_detailing_intake_v868',
   'id,status,expires_at,contact_permission,quote_cents,linked_booking_id',
   'id=eq.'+encodeURIComponent(s.draft_id));
  if(!d||d.status!=='intake_draft'||d.contact_permission!==true||
      Date.parse(d.expires_at)<=Date.now()||d.quote_cents!==s.quote_snapshot_cents)
   return fail('This quote changed or expired. Please request a fresh link.',410);
  const params=new URLSearchParams();
  if(packages.has(s.package_code))params.set('package',s.package_code);
  if(sizes.has(s.vehicle_size))params.set('size',s.vehicle_size);
  const bookingHref='/book'+(params.toString()?'?'+params.toString():'')+'#booking';
  return json({ok:true,build:870,estimate_cad:s.quote_snapshot_cents/100,
   package_code:packages.has(s.package_code)?s.package_code:null,
   vehicle_size:sizes.has(s.vehicle_size)?s.vehicle_size:null,
   booking_href:d.linked_booking_id?null:bookingHref,
   already_booked:Boolean(d.linked_booking_id),expires_at:s.expires_at,
   price_is_estimate:true,availability_not_reserved:true,
   customer_must_confirm_terms_and_checkout:true,
   photos_public:false,booking_confirmed:false,deposit_verified:false},200,headers);
 }catch{return fail('Quote verification unavailable',503);}
}
