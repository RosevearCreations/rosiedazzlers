import { getCurrentCustomerSession, touchCustomerSession, rotateCustomerSession, appendSetCookie, buildClearCustomerSessionCookie } from "../_lib/customer-session.js";
export async function onRequestOptions(){return new Response("",{status:204,headers:corsHeaders()});}
export async function onRequestGet(context){ const {request,env}=context; try{
 if(!env.SUPABASE_URL||!env.SUPABASE_SERVICE_ROLE_KEY||!env.CUSTOMER_SESSION_SECRET) return withCors(json({error:"Server configuration is incomplete."},500));
 const current=await getCurrentCustomerSession({env,request});
 if(!current||!current.customer_profile){ let headers=new Headers({"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"}); headers=appendSetCookie(headers,current?.clear_cookie||buildClearCustomerSessionCookie()); headers=applyCors(headers); return new Response(JSON.stringify({ok:true,authenticated:false,customer:null},null,2),{status:200,headers}); }
 await touchCustomerSession({env,sessionId:current.session?.id||null,request});
 let rotatedCookie=null; if(current.needs_rotation===true){ const rotated=await rotateCustomerSession({env,request,currentSession:current.session,customerProfile:current.customer_profile}); rotatedCookie=rotated.cookie||null; }
 let headers=new Headers({"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"}); if(rotatedCookie) headers=appendSetCookie(headers,rotatedCookie); headers=applyCors(headers);
 return new Response(JSON.stringify({ok:true,authenticated:true,customer:current.customer_profile},null,2),{status:200,headers});
 } catch(err){ return withCors(json({error:err?.message||"Unexpected server error."},500)); } }
export async function onRequestPost(context){ return onRequestGet(context); }
function json(data,status=200){ return new Response(JSON.stringify(data,null,2),{status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"}}); }
function corsHeaders(){ return {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET,POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type","Cache-Control":"no-store"}; }
function applyCors(headers){ const out=headers instanceof Headers?new Headers(headers):new Headers(headers||{}); for(const [k,v] of Object.entries(corsHeaders())) if(!out.has(k)) out.set(k,v); return out; }
function withCors(response){ return new Response(response.body,{status:response.status,statusText:response.statusText,headers:applyCors(response.headers||{})}); }
