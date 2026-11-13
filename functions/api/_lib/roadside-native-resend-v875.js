// Rosie 875: opt-in Resend/Svix native HMAC verifier (no synthetic provider proof).
// The sender's true webhook secret must be enrolled outside GitHub.
const enc=new TextEncoder();
function header(h,k){return h?.get?h.get(k):h?.[k]??h?.[k.toLowerCase()]??null;}
export async function verifyResendSvix({secret,headers,rawBody,nowSeconds=Math.floor(Date.now()/1000)}={}){
 const denied=(reason)=>({ok:false,reason});
 if(typeof secret!=='string'||!/^whsec_[A-Za-z0-9+/]+={0,2}$/.test(secret))
  return denied('Dedicated native Resend signing key is not enrolled');
 let keyBytes;
 try{
  const b=atob(secret.slice(6));
  keyBytes=Uint8Array.from(b,c=>c.charCodeAt(0));
 }catch{return denied('Invalid native Resend signing key');}
 if(keyBytes.length<24||keyBytes.length>64)return denied('Invalid native Resend signing key size');
 const id=header(headers,'svix-id'),ts=header(headers,'svix-timestamp');
 const signatures=header(headers,'svix-signature');
 if(typeof id!=='string'||!/^[A-Za-z0-9_-]{8,160}$/.test(id)||
  typeof ts!=='string'||!/^\d{10}$/.test(ts)||
  !Number.isSafeInteger(Number(ts))||Math.abs(nowSeconds-Number(ts))>300||
  typeof signatures!=='string'||signatures.length>1200)
  return denied('Missing, stale or invalid native webhook headers');
 if(typeof rawBody!=='string'||enc.encode(rawBody).length<2||
  enc.encode(rawBody).length>8000)
  return denied('Native webhook raw body outside allowed bounds');
 const entries=signatures.trim().split(/\s+/);
 if(!entries.length||entries.length>8)return denied('Invalid native signature list');
 const key=await crypto.subtle.importKey('raw',keyBytes,{name:'HMAC',hash:'SHA-256'},false,['verify']);
 const signed=enc.encode(id+'.'+ts+'.'+rawBody);
 let verified=false;
 for(const entry of entries){
  const match=/^v1,([A-Za-z0-9+/]{43}=)$/.exec(entry);
  if(!match)continue;
  try{
   const decoded=Uint8Array.from(atob(match[1]),c=>c.charCodeAt(0));
   if(decoded.length===32&&await crypto.subtle.verify('HMAC',key,decoded,signed))
    verified=true;
  }catch{}
 }
 return verified?{ok:true,provider:'resend_svix',native_event_id:id}:
  denied('Native Resend signature verification failed');
}
export function parseResendNativeDelivery(rawBody){
 try{
  const event=JSON.parse(rawBody);
  const kinds={'email.delivered':'delivered','email.bounced':'bounced','email.failed':'failed'};
  const eventType=kinds[event?.type],data=event?.data;
  const reference=data?.email_id;
  const recipient=Array.isArray(data?.to)&&data.to.length===1?data.to[0]:null;
  if(!eventType||typeof reference!=='string'||!/^[A-Za-z0-9._:-]{8,160}$/.test(reference)||
   typeof recipient!=='string'||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient.trim())||
   recipient.length>180)
   return {ok:false,reason:'Native event missing single-recipient original email identity'};
  return {ok:true,event_type:eventType,provider_email_id:reference,
   recipient:recipient.trim().toLowerCase()};
 }catch{return {ok:false,reason:'Native JSON event is invalid'};}
}
export async function matchOriginalResendDispatch(event,dispatch){
 if(!event?.ok||!dispatch||event.provider_email_id!==dispatch.provider_message_id||
  !['email','resend'].includes(dispatch.provider)||
  !['provider_accepted','delivery_confirmed','delivery_failed','receipt_after_withdrawal'].includes(dispatch.state))
  return {ok:false,reason:'Original accepted resend provider dispatch not correlated'};
 const digest=await crypto.subtle.digest('SHA-256',enc.encode(event.recipient));
 const hex=[...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');
 return hex===dispatch.recipient_hash?
  {ok:true,dispatch_id:dispatch.id,event_type:event.event_type}:
  {ok:false,reason:'Original consented recipient does not match native provider receipt'};
}
