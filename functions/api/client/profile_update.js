import { getCurrentCustomerSession } from "../_lib/customer-session.js";
import { serviceHeaders } from "../_lib/customer-session.js";
export async function onRequestOptions(){return new Response("",{status:204,headers:corsHeaders()});}
export async function onRequestPost(context){ const {request,env}=context; try{
 if(!env.SUPABASE_URL||!env.SUPABASE_SERVICE_ROLE_KEY||!env.CUSTOMER_SESSION_SECRET) return withCors(json({error:"Server configuration is incomplete."},500));
 const current=await getCurrentCustomerSession({env,request}); if(!current?.customer_profile?.id) return withCors(json({error:"Unauthorized."},401));
 const body=await request.json().catch(()=>({}));
 const patch={
   full_name: cleanText(body.full_name),
   phone: cleanText(body.phone),
   address_line1: cleanText(body.address_line1),
   address_line2: cleanText(body.address_line2),
   city: cleanText(body.city),
   province: cleanText(body.province),
   postal_code: cleanText(body.postal_code),
   vehicle_notes: cleanText(body.vehicle_notes),
   notes: cleanText(body.notes),
   updated_at: new Date().toISOString()
 };
 const res=await fetch(`${env.SUPABASE_URL}/rest/v1/customer_profiles?id=eq.${encodeURIComponent(current.customer_profile.id)}`,{method:"PATCH",headers:{...serviceHeaders(env),Prefer:"return=representation"},body:JSON.stringify(patch)});
 if(!res.ok) throw new Error(`Could not update profile. ${await res.text()}`);
 const rows=await res.json().catch(()=>[]); return withCors(json({ok:true,message:"Profile updated.",customer:Array.isArray(rows)?rows[0]||null:null}));
 } catch(err){ return withCors(json({error:err?.message||"Unexpected server error."},500)); }}
function cleanText(v){ const s=String(v??"").trim(); return s||null; }
function json(data,status=200){ return new Response(JSON.stringify(data,null,2),{status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"}}); }
function corsHeaders(){ return {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type","Cache-Control":"no-store"}; }
function withCors(response){ const headers=new Headers(response.headers||{}); for(const [k,v] of Object.entries(corsHeaders())) headers.set(k,v); return new Response(response.body,{status:response.status,statusText:response.statusText,headers}); }
