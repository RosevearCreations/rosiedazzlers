// Owner-only Build 874 native webhook mapping SELF-TEST, never receipt intake.
import {requireStaffAccess,serviceHeaders,json,isUuid} from '../_lib/staff-auth.js';
import {checkNativeMappingAgainstDispatch,mapNativeRoadsideProviderEvent} from '../_lib/roadside-native-mapping-v874.js';
const h={'Cache-Control':'no-store, private','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'};
const fail=(error,status=400)=>json({ok:false,build:874,error,provider_delivery_confirmed:false},status,h);
async function db(env,path){
 const r=await fetch(env.SUPABASE_URL.replace(/\/+$/,'')+'/rest/v1/'+path,{
  redirect:'error',headers:serviceHeaders(env)});
 const v=await r.json().catch(()=>null);
 if(!r.ok||!Array.isArray(v))throw Error('Original private provider records unavailable');
 return v;
}
export const onRequestOptions=()=>new Response(null,{status:204,headers:h});
export async function onRequest({request,env}){
 if(!['GET','POST'].includes(request.method))return fail('Method not supported',405);
 if(!/^https:\/\//.test(env.SUPABASE_URL||'')||!env.SUPABASE_SERVICE_ROLE_KEY)
  return fail('Original private storage unavailable',503);
 const raw=request.method==='POST'?await request.text().catch(()=>''):'';
 if(raw.length>4000)return fail('Self-test input too large',413);
 let body={};
 if(raw)try{body=JSON.parse(raw);if(!body||typeof body!=='object'||Array.isArray(body))throw Error();}
 catch{return fail('JSON object required');}
 const auth=await requireStaffAccess({request,env,body,capability:'manage_bookings',allowLegacyAdminFallback:false});
 if(!auth.ok)return auth.response;
 if(auth.auth_mode!=='session'||auth.actor?.is_admin!==true)return fail('Original signed-in owner/Admin required',403);
 const draftId=(request.method==='GET'?
  new URL(request.url).searchParams.get('draft_id'):body.draft_id)||'';
 if(!isUuid(draftId))return fail('Exact original private draft ID required');
 try{
  const base='rosie_roadside_dispatches_v872?select=id,provider_message_id,state,created_at,receipt_at'+
   '&draft_id=eq.'+encodeURIComponent(draftId)+'&order=created_at.desc&limit=25';
  const dispatches=await db(env,base);
  if(request.method==='GET'){
   return json({ok:true,build:874,callback_secret_present:(env.ROSIE_QUOTE_RECEIPT_WEBHOOK_SECRET||'').length>=32,
    external_provider_enrollment_proven:false,
    independent_provider_receipt_observed:dispatches.some(x=>x.state==='delivery_confirmed'&&x.receipt_at),
    candidate_dispatch_count:dispatches.length,
    mapping_contract:'rosie_notification_adapter_v1',
    native_adapter_enabled:env.ROSIE_ROADSIDE_NATIVE_PROVIDER==='resend_svix'&&
     /^whsec_[A-Za-z0-9+/]+={0,2}$/.test(env.ROSIE_ROADSIDE_RESEND_WEBHOOK_SECRET||''),
    native_adapter_kind:env.ROSIE_ROADSIDE_NATIVE_PROVIDER==='resend_svix'?'resend_svix':'not_enrolled',
    native_external_provider_registration_verified:false,
    dry_run_only:true,no_provider_request_made:true,no_receipt_written:true},200,h);
  }
  if(body.action!=='dry_run_native_receipt_mapping'||body.confirm_no_customer_send===false)
   return fail('Only non-sending dry-run native mapping self-test is permitted');
  const candidate=mapNativeRoadsideProviderEvent(body.native_event);
  if(!candidate.ok)return fail(candidate.reason,422);
  const found=dispatches.find(x=>x.id===candidate.canonical.dispatch_id);
  const result=checkNativeMappingAgainstDispatch(body.native_event,found);
  if(!result.ok)return fail(result.reason,409);
  return json({ok:true,build:874,original_dispatch_correlated:true,...result,
   callback_secret_present:(env.ROSIE_QUOTE_RECEIPT_WEBHOOK_SECRET||'').length>=32,
   external_provider_enrollment_proven:false,
   next_step:'Verify real native provider signature at its adapter; forward only authenticated events as the independently signed Build 872 callback.'},200,h);
 }catch{return fail('Private original provider self-test unavailable',503);}
}
