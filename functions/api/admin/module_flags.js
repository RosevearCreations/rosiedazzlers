// Build 266 — global module runtime availability flags.
// One lightweight app_management_settings row; no background polling. I.T. stays on to preserve recovery access.
import { requireStaffAccess, serviceHeaders, json } from "../_lib/staff-auth.js";

const KEY="module_runtime_flags";
const DEFAULT_FLAGS=Object.freeze({customer:true,detailer:true,operations:true,admin:true,it:true,finance:true,daip:true,socials:true});

export async function onRequestOptions(){return new Response("",{status:204,headers:corsHeaders()});}
export async function onRequestGet(context){return handleRead(context);}
export async function onRequestPost(context){
  const {request,env}=context;
  try{
    const body=await request.json().catch(()=>({}));
    const access=await requireStaffAccess({request,env,body,capability:"manage_staff",allowLegacyAdminFallback:false});
    if(!access.ok)return withCors(access.response);
    const flags=normalizeFlags(body.flags);
    flags.it=true;
    const value={build:266,flags,locked:{it:true},updated_by:access.actor?.id||null,updated_at:new Date().toISOString()};
    const response=await fetch(`${env.SUPABASE_URL}/rest/v1/app_management_settings?on_conflict=key`,{method:"POST",headers:{...serviceHeaders(env),Prefer:"resolution=merge-duplicates,return=representation"},body:JSON.stringify([{key:KEY,value,updated_at:value.updated_at}])});
    if(!response.ok)return withCors(json({error:`Could not save module runtime flags. ${await response.text()}`},500));
    return withCors(json({ok:true,flags,locked:{it:true},updated_at:value.updated_at,source:"app_management_settings"}));
  }catch(error){return withCors(json({error:error?.message||"Unexpected module flag error."},500));}
}
async function handleRead({request,env}){
  try{
    const access=await requireStaffAccess({request,env,body:{},allowLegacyAdminFallback:false});
    if(!access.ok)return withCors(access.response);
    const response=await fetch(`${env.SUPABASE_URL}/rest/v1/app_management_settings?select=value,updated_at&key=eq.${KEY}&limit=1`,{headers:serviceHeaders(env)});
    if(!response.ok)return withCors(json({ok:true,flags:{...DEFAULT_FLAGS},locked:{it:true},updated_at:null,source:"defaults",warning:"Module flag row could not be read."}));
    const rows=await response.json().catch(()=>[]);const row=Array.isArray(rows)?rows[0]||null:null;
    const flags=normalizeFlags(row?.value?.flags||row?.value||{});flags.it=true;
    return withCors(json({ok:true,flags,locked:{it:true},updated_at:row?.updated_at||row?.value?.updated_at||null,source:row?"app_management_settings":"defaults"}));
  }catch(error){return withCors(json({ok:true,flags:{...DEFAULT_FLAGS},locked:{it:true},updated_at:null,source:"defaults",warning:error?.message||"Module flags unavailable."}));}
}
function normalizeFlags(input){const out={...DEFAULT_FLAGS};for(const key of Object.keys(DEFAULT_FLAGS))if(typeof input?.[key]==="boolean")out[key]=input[key];return out;}
function corsHeaders(){return {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET,POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type","Cache-Control":"no-store"};}
function withCors(response){const headers=new Headers(response.headers||{});for(const [k,v] of Object.entries(corsHeaders()))headers.set(k,v);return new Response(response.body,{status:response.status,statusText:response.statusText,headers});}
