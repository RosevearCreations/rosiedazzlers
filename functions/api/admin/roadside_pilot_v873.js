// Build 873: independent callback enrollment readback and owner-gated roadside closure.
// No customer data, token, payment mutation, or inferred receipt is exposed publicly.
import {requireStaffAccess,serviceHeaders,json,isUuid} from '../_lib/staff-auth.js';
const headers={'Cache-Control':'no-store, private','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'};
const fail=(error,status=400)=>json({ok:false,build:873,error,pilot_closed:false},status,headers);
const clean=(x,n=180)=>String(x??'').trim().slice(0,n);
const configured=env=>/^https:\/\//.test(env.SUPABASE_URL||'')&&!!env.SUPABASE_SERVICE_ROLE_KEY;
async function db(env,path,method='GET',data){
 const response=await fetch(env.SUPABASE_URL.replace(/\/+$/,'')+'/rest/v1/'+path,{
  method,redirect:'error',headers:{...serviceHeaders(env),...(method==='POST'?{Prefer:'return=representation'}:{})},
  ...(data===undefined?{}:{body:JSON.stringify(data)})
 });
 const value=await response.json().catch(()=>null);
 if(!response.ok||!Array.isArray(value))throw Error('Original private provider/owner evidence unavailable');
 return value;
}
export const onRequestOptions=()=>new Response(null,{status:204,headers});
export async function onRequest({request,env}){
 if(!['GET','POST'].includes(request.method))return fail('Unsupported method',405);
 if(!configured(env))return fail('Original Supabase authority unavailable',503);
 const raw=request.method==='POST'?await request.text().catch(()=>''):'';
 if(raw.length>2500)return fail('Owner request too large',413);
 let body={};
 if(request.method==='POST')try{
  body=JSON.parse(raw);if(!body||typeof body!=='object'||Array.isArray(body))throw Error();
 }catch{return fail('JSON object required');}
 const auth=await requireStaffAccess({request,env,body,capability:'manage_bookings',allowLegacyAdminFallback:false});
 if(!auth.ok)return auth.response;
 if(auth.auth_mode!=='session'||auth.actor?.is_admin!==true)return fail('Signed-in owner/Admin required',403);
 const actor=clean(auth.actor?.email||auth.actor?.id,140);
 if(actor.length<3)return fail('Original owner identity required',403);
 const draftId=clean(request.method==='GET'?
  new URL(request.url).searchParams.get('draft_id'):body.draft_id,80);
 if(!isUuid(draftId))return fail('Exact original roadside draft required');
 try{
  const where='&draft_id=eq.'+encodeURIComponent(draftId);
  const drafts=await db(env,'rosie_detailing_intake_v868?select=id,linked_booking_id,contact_permission,private_photo_permission,quote_share_withdrawn_at,private_capture_withdrawn_at&id=eq.'+draftId+'&limit=2');
  if(drafts.length!==1)return fail('Original draft unavailable',404);
  if(request.method==='GET'){
   const [dispatches,devices,net,exceptions,closed]=await Promise.all([
    db(env,'rosie_roadside_dispatches_v872?select=id,state,receipt_at,provider,provider_message_id'+where+'&order=created_at.desc&limit=10'),
    db(env,'rosie_roadside_device_challenges_v872?select=id,state,owner_accepted_at'+where+'&order=issued_at.desc&limit=10'),
    db(env,'rosie_roadside_net_deposit_checks_v871?select=id,booking_id,provider,state,source,gross_cents,refunded_cents,net_cents,net_verified,checked_at'+where+'&order=checked_at.desc,id.desc&limit=1'),
    db(env,'rosie_roadside_refund_cases_v872?select=id,state,issue_code'+where+'&order=opened_at.desc&limit=20'),
    db(env,'rosie_roadside_pilot_closures_v873?select=id,dispatch_id,device_challenge_id,net_check_id,owner_actor,closed_at'+where+'&limit=2')
   ]);
   const d=drafts[0],latest=net[0],now=Date.now();
   const callbackSecretEnrolled=(env.ROSIE_QUOTE_RECEIPT_WEBHOOK_SECRET||'').length>=32;
   const delivery=dispatches.find(x=>x.state==='delivery_confirmed'&&x.receipt_at);
   const device=devices.find(x=>x.state==='owner_accepted'&&x.owner_accepted_at);
   const netReady=!!latest&&latest.booking_id===d.linked_booking_id&&latest.net_verified===true&&
    ['stripe_live','paypal_live'].includes(latest.source)&&
    ['net_deposit_intact','partial_refund_verified','full_refund_verified'].includes(latest.state)&&
    Number.isSafeInteger(latest.gross_cents)&&latest.gross_cents>0&&
    Number.isSafeInteger(latest.refunded_cents)&&latest.refunded_cents>=0&&
    Number.isSafeInteger(latest.net_cents)&&latest.net_cents>=0&&
    latest.refunded_cents+latest.net_cents===latest.gross_cents&&
    now-Date.parse(latest.checked_at)>=0&&now-Date.parse(latest.checked_at)<=15*60*1000;
   const consentReady=d.contact_permission===true&&d.private_photo_permission===true&&
    !d.quote_share_withdrawn_at&&!d.private_capture_withdrawn_at;
   const unresolved=exceptions.some(x=>['open','reviewed_hold'].includes(x.state));
   return json({ok:true,build:873,
    callback_secret_enrolled:callbackSecretEnrolled,
    callback_external_provider_registration_verified:false,
    signed_delivery_observed:!!delivery,
    original_device_owner_accepted:!!device,
    net_source_confirmed:netReady,
    latest_net_check:latest||null,
    refund_exception_open:unresolved,
    original_consent_active:consentReady,
    owner_pilot_closed:closed.length===1,
    closure:closed[0]||null,
    eligible_for_owner_closure:!closed.length&&callbackSecretEnrolled&&
     !!delivery&&!!device&&netReady&&!unresolved&&consentReady&&!!d.linked_booking_id,
    candidate_dispatch_id:delivery?.id||null,
    candidate_device_challenge_id:device?.id||null,
    candidate_net_check_id:netReady?latest.id:null,
    no_payment_or_booking_mutation:true
   },200,headers);
  }
  if(body.action!=='close_original_roadside_pilot'||body.confirm_original_provider_callback_witnessed!==true||
    body.confirm_original_device_owner_witnessed!==true||
    body.confirm_current_refund_source_reviewed!==true)return fail('Three explicit independent owner confirmations required');
  if((env.ROSIE_QUOTE_RECEIPT_WEBHOOK_SECRET||'').length<32)
   return fail('Provider callback signing secret not enrolled',409);
  const dispatchId=clean(body.dispatch_id,80),deviceId=clean(body.device_challenge_id,80),
   netId=clean(body.net_check_id,80),note=clean(body.owner_note,500);
  if(![dispatchId,deviceId,netId].every(isUuid)||note.length<12)
   return fail('Exact source receipt, field proof, refund check and owner explanation required');
  const result=await db(env,'rpc/rosie873_close_roadside_pilot','POST',{
   p_id:crypto.randomUUID(),p_draft_id:draftId,p_dispatch_id:dispatchId,
   p_device_challenge_id:deviceId,p_net_check_id:netId,
   p_owner_actor:actor,p_owner_note:note
  });
  if(result.length!==1||result[0].outcome!=='ORIGINAL_PILOT_CLOSED')
   throw Error('Owner closure receipt was not committed');
  return json({ok:true,build:873,owner_pilot_closed:true,
   original_provider_evidence_required:true,refund_issued:false,
   booking_created:false,payment_changed:false},201,headers);
 }catch(e){return fail(e?.message||'Original provider custody remains on HOLD',409);}
}
