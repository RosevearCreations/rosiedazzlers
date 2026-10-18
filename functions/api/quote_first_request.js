// Build 573: gated, idempotent public inquiry handoff. No booking, quote, payment or media writes.
import {normalizeQuoteFirstRequest573,sameQuoteFirstRequest573} from "../../assets/quote-first-intake-v573.js";
const json=(obj,status=200)=>new Response(JSON.stringify(obj),{status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
const enabled=env=>env?.QUOTE_FIRST_INTAKE_ENABLED==="true"
  && Boolean(env?.QUOTE_FIRST_TURNSTILE_SITE_KEY&&env?.QUOTE_FIRST_TURNSTILE_SECRET
  &&env?.SUPABASE_URL&&env?.SUPABASE_SERVICE_ROLE_KEY);
const supabase=env=>String(env.SUPABASE_URL).replace(/\/$/,"");
const headers=env=>({apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:"Bearer "+env.SUPABASE_SERVICE_ROLE_KEY,"Content-Type":"application/json"});
export async function onRequestGet({env}){
  return json({ok:true,enabled:enabled(env),site_key:enabled(env)?env.QUOTE_FIRST_TURNSTILE_SITE_KEY:null,
    accepts_booking:false,accepts_payment:false,manual_staff_review_required:true});
}
export async function onRequestPost({request,env}){
  if(!enabled(env))return json({ok:false,code:"INTAKE_NOT_ENABLED",error:"This quote request form is not yet accepting submissions. Please use the existing booking page."},503);
  if(request.headers.get("origin")!==new URL(request.url).origin)return json({ok:false,error:"Origin check failed."},403);
  if(!/^application\/json\b/i.test(request.headers.get("content-type")||""))return json({ok:false,error:"JSON required."},415);
  if(Number(request.headers.get("content-length")||0)>6000)return json({ok:false,error:"Request too large."},413);
  let raw;
  try {raw=await request.text();if(raw.length>6000)return json({ok:false,error:"Request too large."},413);}
  catch{return json({ok:false,error:"Could not read request."},400);}
  let body;
  try{body=JSON.parse(raw);}catch{return json({ok:false,error:"Invalid JSON."},400);}
  if(body?.website)return json({ok:true,received:true,booking_created:false});
  const normalized=normalizeQuoteFirstRequest573(body);
  if(!normalized.ok)return json({ok:false,error:normalized.error},400);
  const token=typeof body.turnstile_token==="string"?body.turnstile_token.slice(0,2200):"";
  if(!token)return json({ok:false,error:"Security verification is required."},400);
  let verdict;
  try{
    const form=new URLSearchParams({secret:env.QUOTE_FIRST_TURNSTILE_SECRET,response:token});
    const response=await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify",{method:"POST",body:form});
    verdict=response.ok?await response.json():null;
  }catch{return json({ok:false,error:"Security verification unavailable. Please try again."},503);}
  const host=new URL(request.url).hostname;
  if(verdict?.success!==true||verdict.hostname!==host)return json({ok:false,error:"Security verification failed. Refresh and try again."},403);
  // Client-generated random UUID v4 is reused on retries; DB PRIMARY KEY is the atomic duplicate barrier.
  const id=normalized.request_id,base=supabase(env)+"/rest/v1/public_inquiry_leads";
  const select="id,full_name,email,phone,service_area,message,source_path";
  const sameReply=()=>json({ok:true,received:true,replay:true,reference:id,
    staff_review_required:true,quote_created:false,booking_created:false,payment_taken:false},200);
  try{
    const response=await fetch(base,{method:"POST",headers:{...headers(env),Prefer:"return=minimal"},
      body:JSON.stringify(normalized.payload)});
    if(response.ok)return json({ok:true,received:true,replay:false,reference:id,
      staff_review_required:true,quote_created:false,booking_created:false,payment_taken:false},201);
    if(response.status!==409)return json({ok:false,error:"The inquiry could not be saved. Please use the current booking page."},503);
    // On an ID collision, compare complete canonical request. Never disclose existing lead details.
    const found=await fetch(base+"?select="+encodeURIComponent(select)+"&id=eq."+encodeURIComponent(id)+"&limit=1",
      {headers:headers(env)});
    if(!found.ok)return json({ok:false,error:"Could not verify duplicate request."},503);
    const rows=await found.json().catch(()=>[]);
    if(sameQuoteFirstRequest573(rows?.[0],normalized.payload))return sameReply();
    return json({ok:false,error:"This request reference is already in use. Start a new request."},409);
  }catch{return json({ok:false,error:"Inquiry service is temporarily unavailable. Use the current booking page."},503);}
}
export async function onRequestOptions(){return json({ok:false,error:"Method not allowed."},405);}
