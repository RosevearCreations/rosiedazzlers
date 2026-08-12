import { requireStaffAccess, json, methodNotAllowed } from '../_lib/staff-auth.js';
import { attachCatalogReadiness } from '../_lib/catalog-readiness.js';

export async function onRequestOptions(){ return new Response('',{status:204,headers:corsHeaders()}); }
export async function onRequestPost(){ return withCors(methodNotAllowed()); }
export async function onRequestGet({request,env}){
  try{
    const access=await requireStaffAccess({request,env,capability:'manage_staff',allowLegacyAdminFallback:false});
    if(!access.ok) return withCors(access.response);
    if(!env.SUPABASE_URL||!env.SUPABASE_SERVICE_ROLE_KEY) return withCors(json({ok:true,items:[],summary:{total:0,ready:0,blocked:0,average_score:0},source:'unconfigured'}));
    const res=await fetch(`${env.SUPABASE_URL}/rest/v1/catalog_inventory_items?select=*&order=updated_at.desc`,{headers:serviceHeaders(env)});
    if(!res.ok) return withCors(json({error:await res.text()},500));
    const items=attachCatalogReadiness(await res.json().catch(()=>[]));
    const ready=items.filter(x=>x.publish_readiness.ready).length;
    const average=items.length?Math.round(items.reduce((sum,x)=>sum+Number(x.publish_readiness.score||0),0)/items.length):0;
    return withCors(json({ok:true,source:'database',items,summary:{total:items.length,ready,blocked:items.length-ready,average_score:average}}));
  }catch(err){ return withCors(json({error:String(err?.message||err)},500)); }
}
function serviceHeaders(env){return {apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:`Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,Accept:'application/json'};}
function corsHeaders(){return {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,OPTIONS','Access-Control-Allow-Headers':'Content-Type, x-admin-password, x-staff-email, x-staff-user-id','Cache-Control':'no-store'};}
function withCors(response){const headers=new Headers(response.headers||{});for(const [k,v] of Object.entries(corsHeaders()))headers.set(k,v);return new Response(response.body,{status:response.status,statusText:response.statusText,headers});}
